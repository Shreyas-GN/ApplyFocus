import type {
  AtsFinding,
  JobRequirement,
  RequirementResumeAlignmentItem,
} from "@applypilot/validators";
import type { ResumeParsedData } from "@applypilot/validators";
import { TRANSFERABLE_TAXONOMY } from "@/lib/server/transferable-skills";

export interface TerminologyAnalysisInput {
  rawText: string | null | undefined;
  parsedData?: ResumeParsedData | null;
  requirements: JobRequirement[];
}

export interface TerminologyAnalysisOutput {
  terminologyAlignmentScore: number;
  keywordStuffingDetected: boolean;
  keywordStuffingPenalty: number;
  findings: AtsFinding[];
  directKeywordsMatched: number;
  missingKeywordsCount: number;
  alignmentItems: RequirementResumeAlignmentItem[];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWord(haystack: string, needle: string): boolean {
  if (!needle.trim()) return false;
  const escaped = escapeRegex(needle.trim());
  // Word boundary check, allowing for trailing punctuation or hyphens
  const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+.-])${escaped}(?:$|[^a-zA-Z0-9_#+.-])`, "i");
  return regex.test(haystack);
}

function findExcerpt(text: string, keyword: string, maxLength = 140): string | null {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const idx = lowerText.indexOf(lowerKeyword);
  if (idx === -1) return null;

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + keyword.length + 80);
  let snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = `...${snippet}`;
  if (end < text.length) snippet = `${snippet}...`;
  return snippet;
}

export function analyzeJobTerminology(
  input: TerminologyAnalysisInput
): TerminologyAnalysisOutput {
  const text = (input.rawText ?? "").trim();
  const parsed = input.parsedData;
  const requirements = input.requirements ?? [];
  const findings: AtsFinding[] = [];

  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const totalWords = Math.max(1, words.length);

  // 1. Keyword Stuffing Detection
  let keywordStuffingDetected = false;
  let keywordStuffingPenalty = 0;
  const stuffedKeywords: string[] = [];

  // Count term frequency of key technologies and nouns
  const frequencyMap = new Map<string, number>();
  for (const w of words) {
    const cleaned = w.toLowerCase().replace(/^[^a-z0-9#+]+|[^a-z0-9#+]+$/g, "");
    if (cleaned.length >= 3) {
      frequencyMap.set(cleaned, (frequencyMap.get(cleaned) ?? 0) + 1);
    }
  }

  for (const req of requirements) {
    const term = req.normalizedSkill.toLowerCase().trim();
    if (!term || term.length < 3) continue;

    // Check count of this specific term in text
    const escaped = escapeRegex(term);
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+.-])${escaped}(?:$|[^a-zA-Z0-9_#+.-])`, "gi");
    const count = (text.match(regex) || []).length;

    // If term appears >= 7 times and represents > 3.5% of total words, or repeats unnaturally
    if (count >= 7 && (count / totalWords) > 0.035) {
      stuffedKeywords.push(`${req.normalizedSkill} (${count}x)`);
    }
  }

  // Check for unnatural keyword dumps (e.g., lines containing > 15 comma-separated terms)
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let denseDumpDetected = false;
  for (const line of lines) {
    const commas = (line.match(/,/g) || []).length;
    const lineWords = line.split(/\s+/).length;
    if (commas >= 12 && lineWords < 40 && !/[.!?]/.test(line)) {
      denseDumpDetected = true;
      break;
    }
  }

  if (stuffedKeywords.length > 0 || denseDumpDetected) {
    keywordStuffingDetected = true;
    keywordStuffingPenalty = 25;
    findings.push({
      id: "terminology-keyword-stuffing-detected",
      category: "TERMINOLOGY",
      severity: "HIGH",
      title: "Unnatural Keyword Repetition (Keyword Stuffing) Detected",
      description: denseDumpDetected
        ? "Detected an unstructured cluster of comma-separated keywords inserted without narrative sentence context."
        : `Detected unnatural repetition of terms: ${stuffedKeywords.join(", ")}.`,
      impact:
        "Modern ATS and human reviewers penalize keyword stuffing. Over-saturating a document with repetitive terms reduces recruiter trust and can trigger automated ranking demotions.",
      evidence: stuffedKeywords.length > 0
        ? `Overused keywords: ${stuffedKeywords.join("; ")}`
        : "Dense comma-separated keyword block detected in text stream.",
      recommendation:
        "Distribute keywords naturally across relevant project outcomes and job responsibilities. Avoid repeating the same tool name more than 2-3 times.",
    });
  }

  // 2. Requirement Terminology Evaluation
  const alignmentItems: RequirementResumeAlignmentItem[] = [];
  let directMatchesCount = 0;
  let missingCount = 0;

  // Build searchable text blocks from parsed resume data
  const experienceTextBlocks: string[] = [];
  const projectTextBlocks: string[] = [];
  const skillsTextBlocks: string[] = [];

  for (const exp of parsed?.experience ?? []) {
    experienceTextBlocks.push(
      [exp.title, exp.company, ...(exp.responsibilities ?? []), ...(exp.achievements ?? [])].join(" ")
    );
  }

  for (const proj of parsed?.projects ?? []) {
    projectTextBlocks.push(
      [proj.name, proj.description ?? "", ...(proj.responsibilities ?? []), ...(proj.measurableOutcomes ?? [])].join(" ")
    );
  }

  for (const skill of parsed?.skills ?? []) {
    skillsTextBlocks.push(skill.name);
  }

  // Also segment section text directly from rawText lines (covers cases where parsedData is pending or raw text is evaluated)
  let activeSection: "NONE" | "EXPERIENCE" | "PROJECTS" | "SKILLS" = "NONE";
  for (const line of lines) {
    if (line.length < 60 && /\b(work experience|professional experience|employment history|experience)\b/i.test(line)) {
      activeSection = "EXPERIENCE";
      continue;
    }
    if (line.length < 60 && /\b(projects|technical projects|key projects|personal projects)\b/i.test(line)) {
      activeSection = "PROJECTS";
      continue;
    }
    if (line.length < 60 && /\b(skills|technical skills|technologies|core competencies|tools)\b/i.test(line)) {
      activeSection = "SKILLS";
      continue;
    }
    if (line.length < 60 && /\b(education|academic background|academics|certifications)\b/i.test(line)) {
      activeSection = "NONE";
      continue;
    }

    if (activeSection === "EXPERIENCE") experienceTextBlocks.push(line);
    if (activeSection === "PROJECTS") projectTextBlocks.push(line);
    if (activeSection === "SKILLS") skillsTextBlocks.push(line);
  }

  const allExperienceText = experienceTextBlocks.join(" ");
  const allProjectText = projectTextBlocks.join(" ");
  const allSkillsText = skillsTextBlocks.join(" ");

  for (const req of requirements) {
    const skillName = req.normalizedSkill;
    const reqName = req.name;

    const inFullText = containsWord(text, skillName) || containsWord(text, reqName);
    const inExperience = containsWord(allExperienceText, skillName) || containsWord(allExperienceText, reqName);
    const inProjects = containsWord(allProjectText, skillName) || containsWord(allProjectText, reqName);
    const inSkillsList = containsWord(allSkillsText, skillName) || containsWord(allSkillsText, reqName);

    let contextQuality: "HIGH" | "MODERATE" | "WEAK" | "NONE" = "NONE";
    if (inExperience || inProjects) {
      // Check if surrounded by quantifiable results or action verbs
      const excerpt = findExcerpt(allExperienceText + " " + allProjectText, skillName) ?? "";
      const hasMetric =
        /\b\d+(\.\d+)?%|\$\d+|\b\d+(k|m|b)?\s*(users|clients|nodes|events|requests|ops|transactions|ms|seconds|minutes)\b/i.test(excerpt) ||
        /\b\d+\s*k\b/i.test(excerpt);
      contextQuality = hasMetric ? "HIGH" : "MODERATE";
    } else if (inSkillsList || inFullText) {
      contextQuality = "WEAK";
    }

    // Check related terminology via transferable taxonomy
    let relatedTermFound: string | null = null;
    const rules = TRANSFERABLE_TAXONOMY.filter((r) =>
      r.to.some((t) => t.toLowerCase() === skillName.toLowerCase() || t.toLowerCase() === reqName.toLowerCase())
    );

    for (const rule of rules) {
      for (const fromSkill of rule.from) {
        if (containsWord(text, fromSkill)) {
          relatedTermFound = fromSkill;
          break;
        }
      }
      if (relatedTermFound) break;
    }

    let status: RequirementResumeAlignmentItem["status"] = "NO_SUPPORTING_CANDIDATE_EVIDENCE";
    let rationale = "";
    let suggestedImprovement: string | null = null;

    if (inFullText && (contextQuality === "HIGH" || contextQuality === "MODERATE")) {
      directMatchesCount++;
      status = "DEMONSTRATED_AND_COMMUNICATED";
      rationale = `Direct terminology "${skillName}" is explicitly communicated within work experience or project achievements.`;
    } else if (inFullText && contextQuality === "WEAK") {
      directMatchesCount++;
      status = "DEMONSTRATED_BUT_POORLY_COMMUNICATED";
      rationale = `Terminology "${skillName}" is listed in the resume, but lacks narrative context or demonstrated deliverables.`;
      suggestedImprovement = `Add a specific achievement bullet under relevant employment or project work describing how you applied ${skillName}.`;
    } else if (!inFullText && relatedTermFound) {
      status = "RELATED_TERMINOLOGY_PRESENT";
      rationale = `Target terminology "${skillName}" is missing, but related competency "${relatedTermFound}" was identified in the document.`;
      suggestedImprovement = `If your experience with ${relatedTermFound} included exposure to ${skillName}, consider explicitly incorporating "${skillName}".`;
    } else {
      missingCount++;
      status = "NO_SUPPORTING_CANDIDATE_EVIDENCE";
      rationale = `Neither direct terminology "${skillName}" nor related terminology was identified in the resume text.`;
      suggestedImprovement = `If you have authentic experience with ${skillName}, include it in your skills section or relevant project descriptions.`;
    }

    alignmentItems.push({
      requirementId: req.id,
      requirementName: req.name,
      normalizedSkill: req.normalizedSkill,
      category: req.category,
      importance: req.importance,
      status,
      candidateEvidenceSummary: null, // Populated by alignment-engine when profile evidence is present
      resumeExcerpt: inFullText ? findExcerpt(text, skillName) : null,
      keywordFound: inFullText,
      contextQuality,
      rationale,
      suggestedImprovement,
    });
  }

  // Calculate Terminology Alignment Score
  let terminologyAlignmentScore = 75;
  if (requirements.length > 0) {
    const earned = alignmentItems.reduce((acc, item) => {
      if (item.status === "DEMONSTRATED_AND_COMMUNICATED") return acc + 1.0;
      if (item.status === "DEMONSTRATED_BUT_POORLY_COMMUNICATED") return acc + 0.7;
      if (item.status === "RELATED_TERMINOLOGY_PRESENT") return acc + 0.5;
      return acc;
    }, 0);

    const rawPercent = Math.round((earned / requirements.length) * 100);
    terminologyAlignmentScore = Math.max(0, Math.min(100, rawPercent - keywordStuffingPenalty));
  }

  return {
    terminologyAlignmentScore,
    keywordStuffingDetected,
    keywordStuffingPenalty,
    findings,
    directKeywordsMatched: directMatchesCount,
    missingKeywordsCount: missingCount,
    alignmentItems,
  };
}
