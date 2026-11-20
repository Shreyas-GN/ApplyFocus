import type { AtsFinding } from "@applypilot/validators";
import type { ResumeParsedData } from "@applypilot/validators";

export interface StructureAnalysisInput {
  rawText: string | null | undefined;
  parsedData?: ResumeParsedData | null;
}

export interface StructureAnalysisOutput {
  structureQualityScore: number;
  formattingCompatibilityScore: number;
  findings: AtsFinding[];
  hasInconsistentDates: boolean;
  hasChronologyIssues: boolean;
  hasMultiColumnIndicators: boolean;
  hasExcessiveSpecialSymbols: boolean;
  bulletCount: number;
  quantifiedBulletCount: number;
}

const DECORATIVE_SYMBOLS_REGEX = /[★☆✦✧❖✪✫✬✭✮✯✰▲▼►◄◆◇■□●○➔➜➤]/g;
const AMBIGUOUS_HEADING_PATTERNS = [
  { pattern: /\b(my story|my journey|life story|about me|who i am)\b/i, standard: "Professional Summary" },
  { pattern: /\b(stuff i built|what i made|things i did|hacks|creations)\b/i, standard: "Projects" },
  { pattern: /\b(what i know|toolbox|tool belt|weapons of choice|stack)\b/i, standard: "Technical Skills" },
  { pattern: /\b(career steps|where i worked|past roles|history)\b/i, standard: "Work Experience" },
];

const QUANTIFIABLE_METRIC_PATTERNS = [
  /\b\d+(\.\d+)?%/, // 25%, 3.5%
  /\$[\d,]+(\.\d+)?\s*(k|m|b|million|billion|thousand)?/i, // $500k, $1.2M
  /\b\d+\s*x\b/i, // 3x, 10x
  /\b\d{1,3}(,\d{3})+/, // 10,000, 1,000,000
  /\b(decreased|reduced|increased|boosted|grew|saved|cut|accelerated)\s+(by\s+)?\d+/i,
  /\b\d+\s*(users|customers|clients|engineers|requests|rps|qps|endpoints|services|nodes|ms|seconds|minutes)\b/i,
];

export function analyzeDocumentStructure(
  input: StructureAnalysisInput
): StructureAnalysisOutput {
  const findings: AtsFinding[] = [];
  const text = (input.rawText ?? "").trim();
  const parsed = input.parsedData;

  let structureScore = 100;
  let formattingScore = 100;

  let hasInconsistentDates = false;
  let hasChronologyIssues = false;
  let hasMultiColumnIndicators = false;
  let hasExcessiveSpecialSymbols = false;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Ambiguous or Unconventional Section Headings
  for (const item of AMBIGUOUS_HEADING_PATTERNS) {
    const matchLine = lines.find((l) => l.length < 50 && item.pattern.test(l));
    if (matchLine) {
      structureScore -= 10;
      findings.push({
        id: `structure-ambiguous-heading-${item.standard.toLowerCase().replace(/\s+/g, "-")}`,
        category: "STRUCTURE",
        severity: "MEDIUM",
        title: `Unconventional Section Heading: "${matchLine}"`,
        description: `Detected creative heading "${matchLine}" instead of a recognized standard heading like "${item.standard}".`,
        impact:
          "Applicant tracking systems use keyword-based semantic parsers to classify document blocks. Non-standard headings risk entire sections being miscategorized or omitted.",
        evidence: `Heading text: "${matchLine}"`,
        recommendation: `Rename this heading to standard "${item.standard}".`,
      });
    }
  }

  // 2. Date Format Consistency & Chronology Check
  const experiences = parsed?.experience ?? [];
  const dateStylesFound = new Set<string>();
  const parsedYears: number[] = [];

  for (const exp of experiences) {
    const start = exp.startDate?.trim() ?? "";
    const end = exp.endDate?.trim() ?? "";

    for (const d of [start, end]) {
      if (!d) continue;
      if (/^\d{4}-\d{2}$/.test(d) || /^\d{2}\/\d{4}$/.test(d)) {
        dateStylesFound.add("NUMERICAL_MONTH_YEAR");
      } else if (/^[A-Za-z]+\s+\d{4}$/.test(d) || /^[A-Za-z]{3}\.?\s+\d{4}$/.test(d)) {
        dateStylesFound.add("TEXT_MONTH_YEAR");
      } else if (/^\d{4}$/.test(d)) {
        dateStylesFound.add("YEAR_ONLY");
      } else if (/present|current/i.test(d)) {
        dateStylesFound.add("PRESENT_KEYWORD");
      } else {
        dateStylesFound.add("UNCONVENTIONAL_DATE");
      }

      // Try extract 4-digit year for chronology check
      const yearMatch = d.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch && yearMatch[1]) {
        parsedYears.push(parseInt(yearMatch[1], 10));
      }
    }
  }

  // If candidate has >= 2 experiences and mixed incompatible date styles
  const substantiveStyles = Array.from(dateStylesFound).filter(
    (s) => s !== "PRESENT_KEYWORD"
  );
  if (substantiveStyles.length > 1 && experiences.length >= 2) {
    hasInconsistentDates = true;
    structureScore -= 15;
    findings.push({
      id: "structure-inconsistent-date-formats",
      category: "STRUCTURE",
      severity: "MEDIUM",
      title: "Inconsistent Date Formats Across Employment History",
      description: `Detected multiple date conventions (${substantiveStyles.join(", ")}) across roles.`,
      impact:
        "Parsing engines extract start and end dates to compute total tenure and career continuity. Inconsistent formats can lead to calculation errors or phantom employment gaps.",
      evidence: `Found variations across roles: ${experiences.map((e) => `${e.company}: ${e.startDate ?? ""} - ${e.endDate ?? ""}`).filter(Boolean).slice(0, 3).join("; ")}`,
      recommendation:
        "Standardize all dates to a uniform convention throughout the document, such as 'Month YYYY' (e.g., 'May 2021 – Present') or 'MM/YYYY'.",
    });
  }

  // Check Reverse Chronological Order
  if (experiences.length >= 2) {
    let chronological = true;
    for (let i = 0; i < experiences.length - 1; i++) {
      const current = experiences[i];
      const next = experiences[i + 1];
      if (!current || !next) continue;

      const currentYear = current.startDate?.match(/\b(19\d{2}|20\d{2})\b/)?.[1];
      const nextYear = next.startDate?.match(/\b(19\d{2}|20\d{2})\b/)?.[1];

      // If current role is older than the subsequent role, and neither is present/current
      if (
        currentYear &&
        nextYear &&
        parseInt(currentYear, 10) < parseInt(nextYear, 10) &&
        !current.isCurrent
      ) {
        chronological = false;
        break;
      }
    }

    if (!chronological) {
      hasChronologyIssues = true;
      structureScore -= 15;
      findings.push({
        id: "structure-disordered-chronology",
        category: "STRUCTURE",
        severity: "HIGH",
        title: "Employment History Is Not In Reverse Chronological Order",
        description:
          "Work experience entries appear out of chronological order. Older positions precede more recent positions.",
        impact:
          "Recruiters and automated timelines expect the most recent position first to evaluate current seniority and domain focus.",
        evidence: `Timeline order: ${experiences.map((e) => `${e.company} (${e.startDate ?? ""})`).slice(0, 3).join(" -> ")}`,
        recommendation:
          "Reorganize your employment section in reverse chronological order, placing your current or most recent role at the top.",
      });
    }
  }

  // 3. Multi-Column or Tabular Indicators
  const linesWithTabs = lines.filter((l) => l.includes("\t")).length;
  const linesWithPipes = lines.filter((l) => (l.match(/\|/g) || []).length >= 2).length;
  const isMultiColumnSuspect = linesWithTabs >= 4 || linesWithPipes >= 6;

  if (isMultiColumnSuspect) {
    hasMultiColumnIndicators = true;
    formattingScore -= 15;
    findings.push({
      id: "formatting-multi-column-or-tables",
      category: "FORMATTING",
      severity: "LOW",
      title: "Multi-Column or Tabular Layout Indicators Detected",
      description: `Detected ${linesWithTabs + linesWithPipes} lines containing tabular delimiters or vertical dividing pipes.`,
      impact:
        "While modern ATS platforms can parse many two-column layouts, some older parsers read strictly left-to-right across columns, potentially interleaving two separate paragraphs into garbled sentences.",
      evidence: `Found ${linesWithTabs} tab-separated lines and ${linesWithPipes} pipe-divided structures in raw text stream.`,
      recommendation:
        "Ensure your layout flows in a clean, single-column reading hierarchy without placing critical experience side-by-side in complex tables.",
    });
  }

  // 4. Excessive Decorative Unicode Characters / Symbols
  const decorativeMatches = text.match(DECORATIVE_SYMBOLS_REGEX) || [];
  if (decorativeMatches.length > 5) {
    hasExcessiveSpecialSymbols = true;
    formattingScore -= 15;
    findings.push({
      id: "formatting-excessive-decorative-symbols",
      category: "FORMATTING",
      severity: "LOW",
      title: "Non-Standard Decorative Symbols Detected",
      description: `Found ${decorativeMatches.length} non-standard glyphs or decorative symbols (e.g. ${Array.from(new Set(decorativeMatches)).slice(0, 4).join(" ")}).`,
      impact:
        "Certain PDF text extraction engines misinterpret complex symbols as ASCII numbers or punctuation, breaking word boundaries.",
      evidence: `Symbol instances found: ${decorativeMatches.slice(0, 6).join(" ")}`,
      recommendation:
        "Replace decorative symbols, star ratings, or graphics with clean standard bullets (• or -) and plain typography.",
    });
  }

  // 5. Bullet Point Structure & Quantifiable Metrics Density
  const bullets: string[] = [];
  for (const exp of experiences) {
    for (const r of exp.responsibilities ?? []) {
      if (r.trim()) bullets.push(r.trim());
    }
    for (const a of exp.achievements ?? []) {
      if (a.trim()) bullets.push(a.trim());
    }
  }

  // Also extract bullet lines from raw text if parsed bullets are empty
  if (bullets.length === 0) {
    for (const line of lines) {
      if (/^[-*•·▪]\s+/.test(line)) {
        bullets.push(line.replace(/^[-*•·▪]\s+/, ""));
      }
    }
  }

  let quantifiedBulletCount = 0;
  for (const b of bullets) {
    if (QUANTIFIABLE_METRIC_PATTERNS.some((pat) => pat.test(b))) {
      quantifiedBulletCount++;
    }
  }

  const bulletCount = bullets.length;
  if (bulletCount >= 3) {
    const quantifiedRatio = quantifiedBulletCount / bulletCount;
    if (quantifiedRatio < 0.25) {
      structureScore -= 10;
      findings.push({
        id: "structure-low-quantifiable-outcomes",
        category: "COMMUNICATION",
        severity: "MEDIUM",
        title: "Few Quantifiable Outcomes in Experience Descriptions",
        description: `Only ${quantifiedBulletCount} of ${bulletCount} (${Math.round(quantifiedRatio * 100)}%) experience bullet points contain quantifiable metrics, percentages, or measurable results.`,
        impact:
          "Recruiters look for verifiable evidence of business impact, scale, and delivery velocity rather than passive duty lists.",
        evidence: `Sample bullet without measurable outcome: "${bullets[0]?.slice(0, 100)}..."`,
        recommendation:
          "Enhance key achievements using the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]' with numbers, latencies, or percentages.",
      });
    }
  }

  const finalStructureScore = Math.max(0, Math.min(100, structureScore));
  const finalFormattingScore = Math.max(0, Math.min(100, formattingScore));

  return {
    structureQualityScore: finalStructureScore,
    formattingCompatibilityScore: finalFormattingScore,
    findings,
    hasInconsistentDates,
    hasChronologyIssues,
    hasMultiColumnIndicators,
    hasExcessiveSpecialSymbols,
    bulletCount,
    quantifiedBulletCount,
  };
}

