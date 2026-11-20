import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobRequirements } from '@/lib/db/schema';
import type {
  JobRequirement,
  JobRequirementCategory,
  JobRequirementImportance,
  JobRequirementsExtraction,
} from '@/lib/types';
import { jobRequirementsExtractionSchema } from '@applypilot/validators';
import { resolveAiClient } from './ai-provider';
import { cleanJsonFence, type ClaudeMessagesClient } from './tailoring';

export function computeTextHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

const REQUIREMENT_EXTRACTION_SYSTEM_PROMPT = `You are a precision Job Requirement Extraction Engine for ApplyFocus.
Your mission is to parse the provided job description and extract a structured, exhaustive, non-redundant list of verifiable requirements.

EXTRACTION CATEGORIES:
1. "TECHNICAL": Programming languages, frameworks, libraries, databases, cloud platforms, DevOps tools, architectural concepts.
2. "EXPERIENCE": Overall years of professional experience, specific domain experience (e.g. backend, mobile), seniority scope (e.g., Staff/Lead).
3. "EDUCATION": University degrees, certifications, or educational equivalence.
4. "ADDITIONAL": Communication, problem-solving, stakeholder management, cross-functional collaboration.

IMPORTANCE CLASSIFICATION & HARD CONSTRAINTS:
- "MUST_HAVE": Explicitly required qualifications ("must have", "required", "minimum of", "qualifications", "essential", core title duties).
- "PREFERRED": Explicitly preferred qualifications ("preferred", "nice to have", "bonus", "plus", "ideal candidate", "advantage").
- "OPTIONAL": Secondary exploratory exposure ("optional", "familiarity with is a plus").

HANDLING SPECIAL PATTERNS:
1. Ambiguous requirements (e.g. "Experience with Python, preferably FastAPI"):
   - Extract "Python" as MUST_HAVE (isHardConstraint: true).
   - Extract "FastAPI" as PREFERRED (isHardConstraint: false).
   - Do NOT treat the entire sentence as preferred!
2. Combined requirements (e.g. "Experience developing REST APIs using Python and PostgreSQL"):
   - Extract "Python", "PostgreSQL", and "REST APIs" as separate requirements while preserving the sentence in evidenceSentence.
   - Do NOT merge them into one indivisible requirement.
3. Experience requirements (e.g. "Minimum two years of experience developing backend applications"):
   - minYears: 2
   - domain: "Backend Development"
   - isHardConstraint: true
   - Do NOT invent years if unspecified.
4. Generic requirements (e.g. "Strong communication skills", "Team player"):
   - category: "ADDITIONAL"
   - isHardConstraint: false
   - Do NOT treat generic soft skills as hard technical constraints.
5. Deduplication:
   - Do not emit semantically duplicate requirements (e.g. "Postgres" vs "PostgreSQL"). Normalize to the canonical name.

Output MUST be ONLY valid JSON matching:
{
  "requirements": [
    {
      "id": "tech-python",
      "name": "Python Proficiency",
      "normalizedSkill": "Python",
      "category": "TECHNICAL",
      "importance": "MUST_HAVE",
      "isHardConstraint": true,
      "confidence": 0.95,
      "domain": "Backend Development",
      "minYears": 2,
      "evidenceSentence": "Minimum two years of experience with Python, preferably FastAPI."
    }
  ]
}`;

// Canonical skill normalization map
const CANONICAL_SKILL_MAP: Record<string, string> = {
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  react: 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'next.js': 'Next.js',
  nextjs: 'Next.js',
  'node.js': 'Node.js',
  nodejs: 'Node.js',
  node: 'Node.js',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  golang: 'Go',
  go: 'Go',
  py: 'Python',
  python: 'Python',
  'rest api': 'REST APIs',
  'rest apis': 'REST APIs',
  restful: 'REST APIs',
  graphql: 'GraphQL',
  docker: 'Docker',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  sql: 'SQL',
  nosql: 'NoSQL',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  redis: 'Redis',
  drizzle: 'Drizzle ORM',
  prisma: 'Prisma',
};

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

export function normalizeSkillName(raw: string): string {
  const clean = raw.trim();
  const lower = clean.toLowerCase();
  return CANONICAL_SKILL_MAP[lower] ?? clean;
}

export function extractJobRequirementsDeterministic(job: {
  title: string;
  description: string;
  skills?: string[];
}): JobRequirement[] {
  const text = job.description.trim();
  const rawSentences = text
    .split(/(?<=[.!?])\s+|\s*[•·▪\n]+\s*/)
    .map((s) => s.trim().replace(/^[-*•·▪]\s*/, ''))
    .filter((s) => s.length >= 15 && s.length <= 360);

  const requirementsMap = new Map<string, JobRequirement>();

  const mustHaveRegex =
    /\b(must|required|requirement|minimum|essential|basic qualification|need to have|at least|strong proficiency in)\b/i;
  const preferredRegex =
    /\b(preferred|nice to have|plus|bonus|ideal|advantage|desirable|preferred qualification|preferably|good to have|helpful)\b/i;
  const yearsRegex =
    /\b(?:(\d+)\+?|(one|two|three|four|five|six|seven|eight|nine|ten))\s*(?:-\s*\d+\+?)?\s*(?:years?|yrs?)\b/i;

  function parseMinYears(sentence: string): number | null {
    const match = sentence.match(yearsRegex);
    if (!match) return null;
    if (match[1]) return Number.parseInt(match[1], 10);
    if (match[2]) return WORD_TO_NUMBER[match[2].toLowerCase()] ?? null;
    return null;
  }

  function inferDomain(sentence: string, title: string): string | undefined {
    const combined = `${title} ${sentence}`.toLowerCase();
    if (/\bbackend\b/i.test(combined)) return 'Backend Engineering';
    if (/\bfrontend\b/i.test(combined)) return 'Frontend Engineering';
    if (/\bfull\s*stack\b/i.test(combined)) return 'Full Stack Engineering';
    if (/\bmobile|ios|android\b/i.test(combined)) return 'Mobile Engineering';
    if (/\bdevops|infrastructure|cloud|platform\b/i.test(combined)) return 'Cloud & DevOps';
    if (/\bdata\b/i.test(combined)) return 'Data Engineering';
    if (/\bmachine learning|ai|llm\b/i.test(combined)) return 'AI & Machine Learning';
    return undefined;
  }

  // Helper to add or merge requirement
  function addRequirement(req: JobRequirement) {
    const normKey = req.normalizedSkill.toLowerCase();
    const existing = requirementsMap.get(normKey);

    if (!existing) {
      requirementsMap.set(normKey, req);
      return;
    }

    // Merge: prefer MUST_HAVE over PREFERRED
    if (req.importance === 'MUST_HAVE' && existing.importance !== 'MUST_HAVE') {
      existing.importance = 'MUST_HAVE';
      existing.isHardConstraint = req.isHardConstraint;
      existing.evidenceSentence = req.evidenceSentence;
    }

    // Retain minYears if specified
    if (req.minYears !== null && req.minYears !== undefined) {
      existing.minYears = Math.max(existing.minYears ?? 0, req.minYears);
    }

    if (!existing.domain && req.domain) {
      existing.domain = req.domain;
    }
  }

  // 1. Process explicit skills attached to job and scan for sub-clause importance
  for (const skill of job.skills ?? []) {
    const normalized = normalizeSkillName(skill);
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');

    const matchingSentence =
      rawSentences.find((s) => skillRegex.test(s)) ??
      `Hands-on requirement for ${normalized} in ${job.title} role.`;

    // Sub-clause aware importance:
    // "Experience with Python, preferably FastAPI" ->
    // Python is in main clause (MUST_HAVE), FastAPI is in "preferably FastAPI" clause (PREFERRED).
    const clauses = matchingSentence
      .split(/[,;(]|\band\b/i)
      .map((c) => c.trim())
      .filter(Boolean);

    let clauseIsPreferred = false;
    for (const clause of clauses) {
      if (skillRegex.test(clause)) {
        if (preferredRegex.test(clause)) {
          clauseIsPreferred = true;
        }
        break;
      }
    }

    // If the sentence as a whole has preferred keywords but the specific clause does not,
    // only mark preferred if the sentence starts with preferred or has no must-have keywords.
    const isPreferred = clauseIsPreferred || (preferredRegex.test(matchingSentence) && !mustHaveRegex.test(matchingSentence));

    const importance: JobRequirementImportance = isPreferred ? 'PREFERRED' : 'MUST_HAVE';
    const minYears = parseMinYears(matchingSentence);
    const id = `tech-${normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    addRequirement({
      id,
      name: normalized,
      normalizedSkill: normalized,
      category: 'TECHNICAL',
      importance,
      isHardConstraint: importance === 'MUST_HAVE',
      confidence: 0.95,
      domain: inferDomain(matchingSentence, job.title),
      minYears,
      evidenceSentence: matchingSentence,
    });
  }

  // 2. Scan sentences for experience requirements
  for (const s of rawSentences) {
    if (yearsRegex.test(s) && /\b(experience|background|track record|engineering|software|development|tenure)\b/i.test(s)) {
      const years = parseMinYears(s);
      const isPreferred = preferredRegex.test(s) && !mustHaveRegex.test(s);
      const domain = inferDomain(s, job.title);
      const id = `exp-${years ?? 'req'}-years-${s.slice(0, 15).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      addRequirement({
        id,
        name: `${years ? `${years}+ years ` : ''}${domain ?? 'Professional Experience'}`,
        normalizedSkill: domain ? `${domain} Experience` : 'Software Engineering Experience',
        category: 'EXPERIENCE',
        importance: isPreferred ? 'PREFERRED' : 'MUST_HAVE',
        isHardConstraint: !isPreferred,
        confidence: 0.9,
        domain,
        minYears: years,
        evidenceSentence: s,
      });
    }

    // 3. Scan sentences for education requirements
    if (
      /\b(bachelor|master|phd|degree|bs|ms|computer science|stem|b\.s\.|m\.s\.)\b/i.test(s) &&
      /\b(degree|field|equivalent|qualification|graduation)\b/i.test(s)
    ) {
      const isPreferred = preferredRegex.test(s) && !mustHaveRegex.test(s);
      const id = 'edu-degree-requirement';

      addRequirement({
        id,
        name: "Bachelor's or equivalent Degree in Computer Science or related field",
        normalizedSkill: 'Computer Science Degree',
        category: 'EDUCATION',
        importance: isPreferred ? 'PREFERRED' : 'MUST_HAVE',
        isHardConstraint: !isPreferred,
        confidence: 0.9,
        minYears: null,
        evidenceSentence: s,
      });
    }

    // 4. Scan sentences for soft/communication requirements
    // Generic phrases are categorized as ADDITIONAL and isHardConstraint is explicitly false!
    if (
      /\b(communication|cross-functional|collaborat|leadership|mentoring|problem-solving|team player|fast-paced)\b/i.test(s) &&
      (mustHaveRegex.test(s) || preferredRegex.test(s))
    ) {
      const isLeadership = /\b(leadership|mentor|lead|manage)\b/i.test(s);
      const name = isLeadership
        ? 'Technical Leadership & Mentorship'
        : 'Cross-functional Communication & Team Collaboration';
      const id = `add-${isLeadership ? 'leadership' : 'collaboration'}`;

      addRequirement({
        id,
        name,
        normalizedSkill: isLeadership ? 'Leadership' : 'Communication',
        category: 'ADDITIONAL',
        importance: 'PREFERRED', // Soft/generic skills are treated with flexible importance, never hard disqualifiers
        isHardConstraint: false,
        confidence: 0.85,
        minYears: null,
        evidenceSentence: s,
      });
    }
  }

  const results = Array.from(requirementsMap.values());

  // Fallback if none extracted
  if (results.length === 0) {
    results.push({
      id: 'tech-core-role',
      name: `${job.title} Core Competencies`,
      normalizedSkill: job.title,
      category: 'TECHNICAL',
      importance: 'MUST_HAVE',
      isHardConstraint: true,
      confidence: 0.8,
      minYears: null,
      evidenceSentence: text.slice(0, 160) || `Core competency for ${job.title}.`,
    });
  }

  return results;
}

export async function extractJobRequirementsWithAI(
  job: {
    id?: string;
    title: string;
    company: string;
    description: string;
    skills?: string[];
  },
  clientOverride?: ClaudeMessagesClient
): Promise<JobRequirement[]> {
  try {
    const { client: resolvedClient, model } = resolveAiClient(clientOverride);
    const payload = {
      jobTitle: job.title,
      company: job.company,
      knownSkills: job.skills ?? [],
      description: job.description.slice(0, 7000),
    };

    const response = await resolvedClient.messages.create({
      model,
      max_tokens: 3500,
      system: REQUIREMENT_EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    });

    const rawText = response.content
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text ?? '')
      .join('');

    const parsedJson = JSON.parse(cleanJsonFence(rawText));
    const validated: JobRequirementsExtraction =
      jobRequirementsExtractionSchema.parse(parsedJson);

    if (validated.requirements.length > 0) {
      // Deduplicate results by normalizedSkill
      const deduped = new Map<string, JobRequirement>();
      for (const req of validated.requirements) {
        const key = req.normalizedSkill.toLowerCase();
        if (!deduped.has(key) || req.importance === 'MUST_HAVE') {
          deduped.set(key, req);
        }
      }
      return Array.from(deduped.values());
    }
  } catch (error) {
    console.warn(
      '[Requirement Extraction] AI extraction failed or unconfigured; using deterministic extraction fallback.',
      error instanceof Error ? error.message : error
    );
  }

  return extractJobRequirementsDeterministic(job);
}

export async function getOrExtractJobRequirements(
  jobId: string,
  job: {
    title: string;
    company: string;
    description: string;
    skills?: string[];
  },
  clientOverride?: ClaudeMessagesClient
): Promise<JobRequirement[]> {
  const currentHash = computeTextHash(job.description);

  // 1. Check database cache
  try {
    const [cached] = await db
      .select()
      .from(jobRequirements)
      .where(eq(jobRequirements.jobId, jobId))
      .limit(1);

    if (cached && cached.descriptionHash === currentHash) {
      const parsed = jobRequirementsExtractionSchema.safeParse({
        requirements: cached.requirements,
      });
      if (parsed.success && parsed.data.requirements.length > 0) {
        return parsed.data.requirements;
      }
    }
  } catch (err) {
    console.warn('[Requirement Extraction Cache] Failed reading cache:', err);
  }

  // 2. Perform extraction (AI with deterministic fallback)
  const requirements = await extractJobRequirementsWithAI(
    { ...job, id: jobId },
    clientOverride
  );

  // 3. Persist in database cache (idempotent write)
  try {
    await db
      .insert(jobRequirements)
      .values({
        jobId,
        descriptionHash: currentHash,
        requirements,
        source: 'ai',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [jobRequirements.jobId],
        set: {
          descriptionHash: currentHash,
          requirements,
          source: 'ai',
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.warn('[Requirement Extraction Cache] Failed writing cache:', err);
  }

  return requirements;
}
