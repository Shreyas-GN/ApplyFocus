import type { TailoredResumeContent } from '../types';

export interface AtsFinding {
  id: string;
  category: 'contact' | 'impact' | 'keywords' | 'structure' | 'length';
  severity: 'error' | 'warning' | 'tip';
  title: string;
  description: string;
  recommendation: string;
}

export interface AtsAuditReport {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    contactScore: number;
    impactScore: number;
    structureScore: number;
    keywordScore: number;
  };
  metrics: {
    totalBulletPoints: number;
    quantifiedBulletCount: number;
    quantifiedBulletPercent: number;
    actionVerbCount: number;
    weakVerbCount: number;
    skillsCount: number;
    keywordsMatchedCount: number;
    keywordsMissingCount: number;
  };
  findings: AtsFinding[];
  recognizedActionVerbs: string[];
  weakVerbsFound: string[];
}

const STRONG_ACTION_VERBS = new Set([
  'accelerated', 'achieved', 'administered', 'advanced', 'advocated', 'analyzed',
  'architected', 'assembled', 'automated', 'authored', 'benchmarked', 'boosted',
  'budgeted', 'built', 'centralized', 'championed', 'coached', 'collaborated',
  'consolidated', 'constructed', 'converted', 'coordinated', 'crafted', 'created',
  'decreased', 'delivered', 'deployed', 'designed', 'developed', 'devised',
  'diagnosed', 'directed', 'doubled', 'drove', 'eliminated', 'engineered',
  'enhanced', 'established', 'executed', 'expanded', 'expedited', 'facilitated',
  'formulated', 'fostered', 'generated', 'governed', 'guided', 'headed',
  'identified', 'implemented', 'improved', 'increased', 'initiated', 'innovated',
  'inspected', 'instituted', 'integrated', 'invented', 'launched', 'led',
  'leveraged', 'managed', 'maximized', 'mentored', 'migrated', 'minimized',
  'modernized', 'negotiated', 'orchestrated', 'organized', 'overhauled', 'oversaw',
  'partnered', 'pioneered', 'planned', 'produced', 'programmed', 'projected',
  'promoted', 'published', 're-engineered', 'reduced', 'refactored', 'reformed',
  'remodeled', 'reorganized', 'resolved', 'restructured', 'revamped', 'revitalized',
  'scaled', 'secured', 'simplified', 'slashed', 'solved', 'spearheaded',
  'standardized', 'steered', 'streamlined', 'strengthened', 'structured', 'surpassed',
  'synthesized', 'systematized', 'targeted', 'tracked', 'transformed', 'transitioned',
  'tripled', 'uncovered', 'unified', 'upgraded', 'validated', 'yielded',
]);

const WEAK_VERB_PATTERNS = [
  /\bresponsible for\b/i,
  /\bhelped with\b/i,
  /\bworked on\b/i,
  /\bassisted with\b/i,
  /\bduties included\b/i,
  /\btasked with\b/i,
  /\bhandled\b/i,
  /\bparticipated in\b/i,
];

const METRIC_PATTERNS = [
  /\b\d+(\.\d+)?%/, // Percentages: 25%, 3.5%
  /\$[\d,]+(\.\d+)?\s*(k|m|b|million|billion|thousand)?/i, // Currency: $500k, $1.2M
  /€[\d,]+(\.\d+)?\s*(k|m|b|million|billion)?/i,
  /£[\d,]+(\.\d+)?\s*(k|m|b|million|billion)?/i,
  /\b\d+\s*x\b/i, // Multipliers: 3x, 10x
  /\b\d{1,3}(,\d{3})+/, // Formatted numbers: 10,000, 1,000,000
  /\b(decreased|reduced|increased|boosted|grew|saved|cut)\s+(by\s+)?\d+/i,
  /\b\d+\+/, // 50+, 100+
  /\b\d+\s*(users|customers|clients|engineers|teams|requests|rps|qps|endpoints|services|nodes|pipeline)/i,
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function analyzeResumeAts(
  content: TailoredResumeContent,
  _jobDescription?: string
): AtsAuditReport {
  const findings: AtsFinding[] = [];

  // 1. Contact Info Audit
  const contact = content.contactInfo ?? {};
  let contactScore = 100;

  if (!contact.fullName?.trim()) {
    contactScore -= 30;
    findings.push({
      id: 'missing-name',
      category: 'contact',
      severity: 'error',
      title: 'Full Name is Missing',
      description: 'ATS parsers look for candidate name at the top of the document.',
      recommendation: 'Add your legal first and last name in the contact header.',
    });
  }

  const email = contact.email?.trim() ?? '';
  if (!email) {
    contactScore -= 25;
    findings.push({
      id: 'missing-email',
      category: 'contact',
      severity: 'error',
      title: 'Contact Email Missing',
      description: 'Recruiters and automated systems require a primary email to schedule interviews.',
      recommendation: 'Include a clean, professional email address.',
    });
  } else if (!EMAIL_PATTERN.test(email)) {
    contactScore -= 15;
    findings.push({
      id: 'invalid-email',
      category: 'contact',
      severity: 'warning',
      title: 'Email Format Looks Non-Standard',
      description: `"${email}" may not be parsed reliably by older ATS engines.`,
      recommendation: 'Use standard name@domain.com formatting.',
    });
  }

  if (!contact.phone?.trim()) {
    contactScore -= 15;
    findings.push({
      id: 'missing-phone',
      category: 'contact',
      severity: 'warning',
      title: 'Phone Number Not Provided',
      description: 'Phone screening is standard in recruitment workflows.',
      recommendation: 'Include your direct phone number with country/area code.',
    });
  }

  if (!contact.location?.trim()) {
    contactScore -= 15;
    findings.push({
      id: 'missing-location',
      category: 'contact',
      severity: 'warning',
      title: 'Location / Work Jurisdiction Missing',
      description: 'Many corporate ATS search algorithms filter applicants by geographic region or timezone.',
      recommendation: 'Add your City, State/Country or "Remote (Country)".',
    });
  }

  if (!contact.linkedinUrl && !contact.githubUrl && !contact.portfolioUrl) {
    contactScore -= 10;
    findings.push({
      id: 'missing-profile-link',
      category: 'contact',
      severity: 'tip',
      title: 'No Professional Profile Links',
      description: '87% of recruiters cross-reference LinkedIn or technical portfolios.',
      recommendation: 'Add your LinkedIn or GitHub profile URL.',
    });
  }

  contactScore = Math.max(0, Math.min(100, contactScore));

  // 2. Action Verbs & Metrics (Impact Audit)
  const bullets: string[] = [];
  for (const exp of content.experience || []) {
    const lines = exp.tailoredDescription
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
      .filter((l) => l.length > 0);
    bullets.push(...lines);
  }

  const recognizedActionVerbs = new Set<string>();
  const weakVerbsFound = new Set<string>();
  let quantifiedBulletsCount = 0;

  for (const b of bullets) {
    // Check metric presence
    const hasMetric = METRIC_PATTERNS.some((pat) => pat.test(b));
    if (hasMetric) quantifiedBulletsCount++;

    // Check first word action verb
    const firstWord = b.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z-]/g, '') || '';
    if (STRONG_ACTION_VERBS.has(firstWord)) {
      recognizedActionVerbs.add(firstWord);
    }

    // Check weak verbs
    for (const weakPat of WEAK_VERB_PATTERNS) {
      if (weakPat.test(b)) {
        const match = b.match(weakPat);
        if (match) weakVerbsFound.add(match[0].toLowerCase());
      }
    }
  }

  const totalBullets = Math.max(1, bullets.length);
  const quantifiedPercent = Math.round((quantifiedBulletsCount / totalBullets) * 100);

  let impactScore = 50;
  // Metric density contribution (up to 30 pts)
  impactScore += Math.min(30, Math.round((quantifiedBulletsCount / totalBullets) * 40));
  // Action verbs contribution (up to 20 pts)
  impactScore += Math.min(20, recognizedActionVerbs.size * 3);
  // Penalty for weak verbs
  impactScore -= weakVerbsFound.size * 8;

  if (quantifiedPercent < 40) {
    findings.push({
      id: 'low-metrics',
      category: 'impact',
      severity: 'warning',
      title: 'Add More Quantifiable Results (Google XYZ Formula)',
      description: `Only ${quantifiedPercent}% of your bullet points contain numbers, metrics, or revenue scale.`,
      recommendation: 'Rewrite achievements using "Accomplished [X] measured by [Y] by doing [Z]" with percentages, dollar amounts, or time savings.',
    });
  }

  if (weakVerbsFound.size > 0) {
    findings.push({
      id: 'weak-verbs-present',
      category: 'impact',
      severity: 'warning',
      title: 'Replace Passive Responsibilities with Power Verbs',
      description: `Found passive phrasing: ${Array.from(weakVerbsFound).map((v) => `"${v}"`).join(', ')}.`,
      recommendation: 'Replace passive phrases with active verbs like "Spearheaded", "Architected", or "Automated".',
    });
  }

  if (recognizedActionVerbs.size < 3 && totalBullets > 3) {
    findings.push({
      id: 'few-action-verbs',
      category: 'impact',
      severity: 'tip',
      title: 'Diversify Action Power Verbs',
      description: 'Start every bullet with a distinct, decisive verb showing leadership and initiative.',
      recommendation: 'Use high-impact verbs like Orchestrated, Pioneered, Accelerated, or Overhauled.',
    });
  }

  impactScore = Math.max(0, Math.min(100, impactScore));

  // 3. Structure & Section Standards
  let structureScore = 100;

  if (!content.headline?.trim()) {
    structureScore -= 10;
    findings.push({
      id: 'missing-headline',
      category: 'structure',
      severity: 'tip',
      title: 'Add a Targeted Headline',
      description: 'A focused headline anchors your specialization for recruiter scanning.',
      recommendation: 'Add a 1-line professional title (e.g. "Senior Full Stack Engineer | Cloud & Distributed Systems").',
    });
  }

  if (!content.summary?.trim() || content.summary.length < 50) {
    structureScore -= 15;
    findings.push({
      id: 'short-summary',
      category: 'structure',
      severity: 'warning',
      title: 'Professional Summary Too Brief',
      description: 'A 3-4 sentence narrative hooks recruiter attention within the first 6 seconds.',
      recommendation: 'State your core specialization, years of leadership, and key business impact.',
    });
  }

  if ((content.highlightedSkills || []).length < 5) {
    structureScore -= 20;
    findings.push({
      id: 'few-skills',
      category: 'structure',
      severity: 'warning',
      title: 'Include More Core Competencies',
      description: `Only ${content.highlightedSkills?.length || 0} skills highlighted. ATS scanners look for 8-15 core skills.`,
      recommendation: 'Add technical frameworks, languages, and methodologies.',
    });
  }

  if ((content.experience || []).length === 0) {
    structureScore -= 35;
    findings.push({
      id: 'no-experience',
      category: 'structure',
      severity: 'error',
      title: 'No Work Experience Entries',
      description: 'Work history is the primary section evaluated by employers.',
      recommendation: 'Add relevant work history or project experience.',
    });
  }

  structureScore = Math.max(0, Math.min(100, structureScore));

  // 4. Keyword Alignment
  const used = content.keywordsUsed || [];
  const missing = content.missingKeywords || [];
  const totalKeywords = used.length + missing.length;
  let keywordScore = 80;

  if (totalKeywords > 0) {
    keywordScore = Math.round((used.length / totalKeywords) * 100);
  }

  if (missing.length > 0) {
    findings.push({
      id: 'missing-target-keywords',
      category: 'keywords',
      severity: missing.length > 3 ? 'warning' : 'tip',
      title: `${missing.length} Key Opportunity Keywords Missing`,
      description: `The job posting emphasizes terms that don't appear in your current draft: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '...' : ''}.`,
      recommendation: 'If you have authentic experience with these areas, incorporate them into your skills or bullet points.',
    });
  }

  keywordScore = Math.max(0, Math.min(100, keywordScore));

  // Overall Score Calculation (Weighted)
  // Structure (25%), Impact (35%), Keywords (25%), Contact (15%)
  const overallScore = Math.round(
    structureScore * 0.25 +
    impactScore * 0.35 +
    keywordScore * 0.25 +
    contactScore * 0.15
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'C';
  if (overallScore >= 93) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 75) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else grade = 'D';

  return {
    overallScore,
    grade,
    breakdown: {
      contactScore,
      impactScore,
      structureScore,
      keywordScore,
    },
    metrics: {
      totalBulletPoints: bullets.length,
      quantifiedBulletCount: quantifiedBulletsCount,
      quantifiedBulletPercent: quantifiedPercent,
      actionVerbCount: recognizedActionVerbs.size,
      weakVerbCount: weakVerbsFound.size,
      skillsCount: (content.highlightedSkills || []).length,
      keywordsMatchedCount: used.length,
      keywordsMissingCount: missing.length,
    },
    findings,
    recognizedActionVerbs: Array.from(recognizedActionVerbs),
    weakVerbsFound: Array.from(weakVerbsFound),
  };
}
