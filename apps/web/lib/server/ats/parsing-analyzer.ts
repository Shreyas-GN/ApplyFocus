import type { AtsFinding } from "@applypilot/validators";
import type { ResumeParsedData } from "@applypilot/validators";

export interface ParsingAnalysisInput {
  rawText: string | null | undefined;
  mimeType: string;
  fileSizeBytes: number;
  parsedData?: ResumeParsedData | null;
  processingError?: string | null;
}

export interface ParsingAnalysisOutput {
  parsingReadinessScore: number;
  findings: AtsFinding[];
  isScannedOrImageOnly: boolean;
  hasEncodingIssues: boolean;
  contactIntegrity: {
    hasName: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
    hasLocation: boolean;
  };
  detectedSections: string[];
  missingSections: string[];
  totalWords: number;
}

const SECTION_PATTERNS: { name: string; pattern: RegExp; required: boolean }[] = [
  {
    name: "Contact Information",
    pattern: /\b(email|phone|contact|linkedin|github)\b/i,
    required: true,
  },
  {
    name: "Work Experience",
    pattern: /\b(work experience|professional experience|experience|employment history|work history)\b/i,
    required: true,
  },
  {
    name: "Education",
    pattern: /\b(education|academic background|academics|degrees|university|college)\b/i,
    required: true,
  },
  {
    name: "Skills",
    pattern: /\b(skills|technical skills|technologies|core competencies|competencies|tools & technologies)\b/i,
    required: true,
  },
  {
    name: "Projects",
    pattern: /\b(projects|technical projects|key projects|personal projects|portfolio)\b/i,
    required: false,
  },
  {
    name: "Professional Summary",
    pattern: /\b(summary|professional summary|executive summary|about me|profile)\b/i,
    required: false,
  },
  {
    name: "Certifications",
    pattern: /\b(certifications|credentials|licenses|accreditations)\b/i,
    required: false,
  },
];

const STANDARD_EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;

export function analyzeDocumentParsing(
  input: ParsingAnalysisInput
): ParsingAnalysisOutput {
  const findings: AtsFinding[] = [];
  const text = (input.rawText ?? "").trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const totalWords = words.length;

  let score = 100;
  let isScannedOrImageOnly = false;
  let hasEncodingIssues = false;

  // 1. Text extraction completeness and readability
  if (!text || text.length === 0) {
    isScannedOrImageOnly = true;
    score = 0;
    findings.push({
      id: "parsing-no-text-extracted",
      category: "PARSING",
      severity: "CRITICAL",
      title: "No Text Content Extracted From Document",
      description:
        "The document parser could not extract any readable text from this file. This typically indicates a scanned image-only PDF, a flattened graphic export, or a corrupted file stream.",
      impact:
        "Applicant tracking systems rely on text streams to parse candidate information. A resume without readable text cannot be indexed or searched by recruiters.",
      evidence: input.processingError ?? "0 characters extracted from document.",
      recommendation:
        "Re-export your resume directly from Microsoft Word, Google Docs, or LaTeX as a text-selectable PDF rather than saving a scan or raster image.",
    });

    return {
      parsingReadinessScore: 0,
      findings,
      isScannedOrImageOnly: true,
      hasEncodingIssues: false,
      contactIntegrity: {
        hasName: false,
        hasEmail: false,
        hasPhone: false,
        hasLocation: false,
      },
      detectedSections: [],
      missingSections: SECTION_PATTERNS.filter((s) => s.required).map((s) => s.name),
      totalWords: 0,
    };
  }

  // 2. Extremely short extracted text check
  if (totalWords < 50 && input.fileSizeBytes > 10000) {
    isScannedOrImageOnly = true;
    score -= 60;
    findings.push({
      id: "parsing-insufficient-text",
      category: "PARSING",
      severity: "CRITICAL",
      title: "Extremely Low Text Content (Likely Scanned or Flattened PDF)",
      description: `Only ${totalWords} words were extracted from a file size of ${(input.fileSizeBytes / 1024).toFixed(0)} KB. Most text may be embedded in graphics or raster layers.`,
      impact:
        "Older and modern ATS parsers alike will fail to read experience, skills, and dates when text is trapped inside images.",
      evidence: `Extracted text snippet: "${text.slice(0, 120)}..."`,
      recommendation:
        "Generate a clean, text-based PDF using standard vector typography. Highlight text in a PDF viewer to confirm it is selectable.",
    });
  }

  // 3. Encoding / Unprintable / Replacement character check
  const replacementCharCount = (text.match(/\uFFFD/g) || []).length;
  const nonAsciiControlCount = (text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
  if (replacementCharCount > 5 || nonAsciiControlCount > 5) {
    hasEncodingIssues = true;
    score -= 30;
    findings.push({
      id: "parsing-character-encoding-errors",
      category: "PARSING",
      severity: "HIGH",
      title: "Corrupted Character Encoding or Font Glitches Detected",
      description: `Detected ${replacementCharCount + nonAsciiControlCount} corrupted glyphs or replacement characters (\uFFFD) in the extracted text.`,
      impact:
        "Non-standard custom fonts or corrupted ligature mappings cause ATS parsers to substitute garbled characters for words like 'finance' or 'engineer'.",
      evidence: `Found replacement glyphs in extracted stream.`,
      recommendation:
        "Use universal system fonts (e.g. Arial, Calibri, Helvetica, Georgia, Times New Roman) and avoid exotic icon font subsets.",
    });
  }

  // 4. Contact Information Integrity
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const firstLineLooksLikeName =
    firstLine.length < 50 &&
    /^[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){1,3}$/.test(firstLine) &&
    !SECTION_PATTERNS.some((s) => s.pattern.test(firstLine));

  const parsedPersonal = input.parsedData?.personal;
  const hasEmailInText = STANDARD_EMAIL_REGEX.test(text);
  const hasPhoneInText = PHONE_REGEX.test(text);
  const hasName = Boolean(
    (parsedPersonal?.fullName && parsedPersonal.fullName.trim().length > 1) ||
      firstLineLooksLikeName
  );
  const hasEmail = Boolean(parsedPersonal?.email || hasEmailInText);
  const hasPhone = Boolean(parsedPersonal?.phone || hasPhoneInText);
  const hasLocationInText = /\b[A-Z][a-zA-Z\s.-]+,\s*[A-Z]{2}\b/.test(text) || /\b(Remote|Hybrid|United States|USA|Canada|UK|India|Germany)\b/i.test(text);
  const hasLocation = Boolean(
    (parsedPersonal?.location && parsedPersonal.location.trim().length > 2) ||
      hasLocationInText
  );

  if (!hasName) {
    score -= 20;
    findings.push({
      id: "parsing-missing-name",
      category: "PARSING",
      severity: "CRITICAL",
      title: "Candidate Legal Name Could Not Be Verified",
      description: "Could not identify a clear candidate full name at the top of the resume.",
      impact: "Recruiter search indexing requires a candidate name to create an applicant profile in the ATS.",
      evidence: "No recognizable personal name header detected.",
      recommendation: "Place your full legal name at the top of your resume in clear 18-24pt text.",
    });
  }

  if (!hasEmail) {
    score -= 20;
    findings.push({
      id: "parsing-missing-email",
      category: "PARSING",
      severity: "CRITICAL",
      title: "Contact Email Address Missing or Unreadable",
      description: "No standard email address format (name@domain.com) was detected in the document.",
      impact: "Automated candidate communications and interview scheduling rely strictly on the primary email address.",
      evidence: "No RFC-compliant email string found in text stream.",
      recommendation: "Include a professional email address in the contact section at the top of the resume.",
    });
  }

  if (!hasPhone) {
    score -= 10;
    findings.push({
      id: "parsing-missing-phone",
      category: "PARSING",
      severity: "MEDIUM",
      title: "Phone Number Missing or Unformatted",
      description: "No standard phone number was extracted from the document header.",
      impact: "Recruiters performing quick phone screens may bypass profiles without immediate contact numbers.",
      evidence: "No 10-digit or international formatted phone sequence found.",
      recommendation: "Add your phone number with country and area code (e.g., +1 (555) 123-4567).",
    });
  }

  if (!hasLocation) {
    score -= 5;
    findings.push({
      id: "parsing-missing-location",
      category: "PARSING",
      severity: "LOW",
      title: "Geographic Location Not Detected",
      description: "Could not detect a City, State, or Country in contact details.",
      impact: "Many ATS filters screen candidates based on jurisdictional eligibility or work authorization locations.",
      evidence: "No city/state string detected in personal contact header.",
      recommendation: "Include your City and State/Country (e.g., 'San Francisco, CA' or 'London, UK').",
    });
  }

  // 5. Section Heading Recognition
  const detectedSections: string[] = [];
  const missingSections: string[] = [];

  for (const sec of SECTION_PATTERNS) {
    const isDetectedInText =
      (sec.name === "Contact Information" && (hasEmail || hasPhone)) ||
      lines.some((line) => {
        // Heading lines are typically short (< 60 chars) and match section keywords
        return line.length < 60 && sec.pattern.test(line);
      });

    // Also check parsed structured data fallback
    let isDetectedInParsed = false;
    if (input.parsedData) {
      if (sec.name === "Work Experience" && (input.parsedData.experience ?? []).length > 0) isDetectedInParsed = true;
      if (sec.name === "Education" && (input.parsedData.education ?? []).length > 0) isDetectedInParsed = true;
      if (sec.name === "Skills" && (input.parsedData.skills ?? []).length > 0) isDetectedInParsed = true;
      if (sec.name === "Projects" && (input.parsedData.projects ?? []).length > 0) isDetectedInParsed = true;
      if (sec.name === "Contact Information" && hasEmail) isDetectedInParsed = true;
    }

    if (isDetectedInText || isDetectedInParsed) {
      detectedSections.push(sec.name);
    } else if (sec.required) {
      missingSections.push(sec.name);
      score -= 15;
      findings.push({
        id: `parsing-missing-section-${sec.name.toLowerCase().replace(/\s+/g, "-")}`,
        category: "STRUCTURE",
        severity: "HIGH",
        title: `Required Section Heading Missing: ${sec.name}`,
        description: `Could not identify a standard "${sec.name}" section heading in the document.`,
        impact:
          "ATS parsing algorithms use standard headings as boundaries to populate structured database fields.",
        evidence: `No heading matching pattern: ${sec.pattern.source}`,
        recommendation: `Use a clear, conventional heading like "${sec.name}" on its own line.`,
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    parsingReadinessScore: finalScore,
    findings,
    isScannedOrImageOnly,
    hasEncodingIssues,
    contactIntegrity: {
      hasName,
      hasEmail,
      hasPhone,
      hasLocation,
    },
    detectedSections,
    missingSections,
    totalWords,
  };
}
