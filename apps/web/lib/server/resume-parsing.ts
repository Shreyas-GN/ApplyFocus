
import { db } from '@/lib/db';
import { resumeParsedData, resumes } from '@/lib/db/schema';
import { createStorageClient } from '@/lib/storage/client';
import { resolveAiClient } from './ai-provider';
import {
  resumeParsedDataSchema,
  type ResumeParsedData,
} from '@applypilot/validators';
import { eq } from 'drizzle-orm';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';

const SYSTEM_PROMPT = `You extract structured candidate intelligence from resume text for ApplyFocus. You must follow these rules strictly:

1. Only output information that is explicitly present or directly supported in the resume text. Never invent, extrapolate, or hallucinate an employer, job title, date, school, certification, skill, or metric that is not in the text.
2. If a date or detail is ambiguous or missing, omit it or set it to null rather than guessing.
3. For every entry you output, include a "confidence" number from 0 to 1 reflecting how certain you are the entry is accurately transcribed from the text.
4. Set "source" to "ai" on every entry you output.
5. Evidence-Backed Skills:
   - For every skill, assign an "evidenceCategory":
     * "AI_EXTRACTED" if the skill is directly demonstrated in work experience or projects with textual evidence.
     * "AI_SUGGESTED" if the skill is inferred as potentially relevant or only listed in a bare skills list without demonstrated context.
   - For "evidenceSentence", quote the actual text or sentence from the resume that demonstrates the skill. Do not fabricate quotes.
   - For "connectedExperience", specify the company name or role where demonstrated, or omit if not tied to a specific job.
   - For "connectedProject", specify the project name where demonstrated, or omit if not tied to a project.
   - Set "category" to one of: "languages", "frameworks", "databases", "cloud", "developer_tools", "technical", "soft_skills", "domain".
6. Personal & Profile Intelligence:
   - Calculate "yearsOfExperience" as an integer only when dates are reliably calculable across the timeline; otherwise omit or set to null.
   - Set "currentRole" to the candidate's current or most recent job title.
   - Set "careerDomain" (e.g., "Software Engineering", "Frontend Engineering", "Full-Stack Engineering", "Backend Engineering", "Data & AI", "Cloud & DevOps", "Product Management").
   - Set "seniorityEstimate" (e.g., "Entry", "Mid-Level", "Senior", "Lead", "Executive").
7. Work Experience:
   - Extract "responsibilities" as an array of responsibility bullet points.
   - Extract "achievements" as an array of outcome or impact bullet points.
   - Extract "technologies" as an array of technologies mentioned in that role.
   - Extract "evidenceSentences" as an array of sentences supporting demonstrated capabilities.
8. Projects:
   - Extract "technologies", "responsibilities", "measurableOutcomes" (metrics/outcomes where supplied in text), and "skillsDemonstrated".
9. Education:
   - Extract "institution", "degree", "fieldOfStudy", "graduationYear" (integer where mentioned), "startDate", "endDate", "description".
10. Output ONLY a single JSON object matching this exact shape, with no commentary, no markdown code fences, and no extra top-level keys:

{
  "personal": {"fullName": "", "email": "", "phone": "", "location": "", "linkedinUrl": "", "githubUrl": "", "portfolioUrl": "", "headline": "", "summary": "", "yearsOfExperience": 0, "currentRole": "", "careerDomain": "", "seniorityEstimate": ""},
  "experience": [{"company": "", "title": "", "location": "", "startDate": "", "endDate": "", "isCurrent": false, "description": "", "responsibilities": [], "achievements": [], "technologies": [], "evidenceSentences": [], "confidence": 0.0, "source": "ai"}],
  "education": [{"institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "graduationYear": 2024, "description": "", "confidence": 0.0, "source": "ai"}],
  "skills": [{"name": "", "category": "", "confidence": 0.0, "source": "ai", "evidenceCategory": "AI_EXTRACTED", "evidenceSentence": "", "connectedExperience": "", "connectedProject": ""}],
  "projects": [{"name": "", "description": "", "url": "", "startDate": "", "endDate": "", "technologies": [], "responsibilities": [], "measurableOutcomes": [], "skillsDemonstrated": [], "confidence": 0.0, "source": "ai"}],
  "certifications": [{"name": "", "issuer": "", "issueDate": "", "expiryDate": "", "credentialUrl": "", "confidence": 0.0, "source": "ai"}],
  "overallConfidence": 0.0
}

Omit any personal field you cannot find rather than leaving it as an empty string. Omit entire sections (as empty arrays) you find no evidence for.`;

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const { text } = await extractText(new Uint8Array(buffer));
    const extracted = Array.isArray(text) ? text.join('\n') : text;
    if (!extracted || !extracted.trim()) {
      throw new Error(
        'Could not extract text from this PDF. It may be scanned or image-only.'
      );
    }
    return extracted.trim();
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const extracted = result.value;
    if (!extracted || !extracted.trim()) {
      throw new Error('Could not extract text from this DOCX file.');
    }
    return extracted.trim();
  }

  throw new Error(`Unsupported mime type: ${mimeType}`);
}

function cleanJsonFence(raw: string): string {
  const stripped = raw.trim();
  const match = stripped.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // If no fences, find first '{' and last '}'
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return stripped.slice(start, end + 1);
  }
  return stripped;
}

export async function parseResumeWithClaude(
  text: string
): Promise<ResumeParsedData> {
  const { client, model } = resolveAiClient();

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Resume text:\n\n${text}` }],
  });

  const rawText = response.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('');

  try {
    const parsed = JSON.parse(cleanJsonFence(rawText));
    return resumeParsedDataSchema.parse(parsed);
  } catch (error) {
    console.error('Claude parsing response validation failed:', rawText, error);
    throw new Error(
      'Failed to parse resume into structured JSON. Please retry.'
    );
  }
}

export async function processResumeBackground(
  resumeId: string,
  userId: string
): Promise<void> {
  try {
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, resumeId))
      .limit(1);

    if (!resume) {
      console.error(`Resume ${resumeId} not found for background parsing`);
      return;
    }

    // Step 1: Extracting
    await db
      .update(resumes)
      .set({
        processingStatus: 'extracting',
        processingError: null,
      })
      .where(eq(resumes.id, resumeId));

    const supabase = createStorageClient();
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resume.storageKey);

    if (downloadError || !fileBlob) {
      throw new Error(
        `Failed to download resume from storage: ${downloadError?.message ?? 'Unknown'}`
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedText = await extractTextFromBuffer(buffer, resume.mimeType);

    // Step 2: Parsing with Claude
    await db
      .update(resumes)
      .set({
        processingStatus: 'parsing',
        extractedText,
      })
      .where(eq(resumes.id, resumeId));

    const parsedData = await parseResumeWithClaude(extractedText);

    // Step 3: Save parsed data & mark as parsed
    await db.transaction(async (tx) => {
      await tx
        .insert(resumeParsedData)
        .values({
          resumeId,
          userId,
          structuredData: parsedData,
          overallConfidence: String(parsedData.overallConfidence ?? 0.85),
          reviewStatus: 'pending_review',
        })
        .onConflictDoUpdate({
          target: resumeParsedData.resumeId,
          set: {
            structuredData: parsedData,
            overallConfidence: String(parsedData.overallConfidence ?? 0.85),
            reviewStatus: 'pending_review',
            updatedAt: new Date(),
          },
        });

      await tx
        .update(resumes)
        .set({
          processingStatus: 'parsed',
          parseAttempts: (resume.parseAttempts ?? 0) + 1,
        })
        .where(eq(resumes.id, resumeId));
    });

    console.log(`Successfully parsed resume ${resumeId}`);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown parsing error occurred';
    console.error(`Background parsing failed for resume ${resumeId}:`, err);

    await db
      .update(resumes)
      .set({
        processingStatus: 'failed',
        processingError: errorMessage,
      })
      .where(eq(resumes.id, resumeId));
  }
}
