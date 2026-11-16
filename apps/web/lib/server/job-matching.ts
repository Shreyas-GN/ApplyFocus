import type {
  CapabilityStrength,
  JobIntelligenceBreakdown,
  JobMatchBreakdown,
  OpportunityConstraintCheck,
  OpportunityEvaluation,
  ProfileDto,
  RequirementEvaluation,
  TransferableSkillMatch,
} from '@/lib/types';

const KNOWN_SKILLS = [
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C++',
  'SQL',
  'PostgreSQL',
  'Postgres',
  'Supabase',
  'MongoDB',
  'Redis',
  'GraphQL',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Tailwind',
  'CSS',
  'HTML',
  'Git',
  'CI/CD',
  'Machine Learning',
  'LLM',
  'AI',
  'PyTorch',
  'TensorFlow',
  'Figma',
  'Product Management',
  'Ruby',
  'Rails',
  'Django',
  'FastAPI',
  'NestJS',
  'Express',
  'Prisma',
  'Drizzle',
  'Playwright',
  'Vitest',
  'Jest',
  'Linux',
  'Swift',
  'Kotlin',
];

const TRANSFERABLE_SKILL_RULES: Array<{
  from: string[];
  to: string[];
  reason: string;
}> = [
  {
    from: ['React', 'Next.js'],
    to: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'Tailwind', 'Figma'],
    reason: 'Modern component architecture and frontend UI fundamentals transfer directly.',
  },
  {
    from: ['TypeScript'],
    to: ['JavaScript', 'Node.js', 'NestJS', 'Express'],
    reason: 'Strong TypeScript fluency maps directly to JavaScript and typed backend services.',
  },
  {
    from: ['JavaScript'],
    to: ['TypeScript', 'React', 'Node.js', 'Next.js'],
    reason: 'Core JavaScript runtime mastery accelerates ramp-up across TypeScript & JS frameworks.',
  },
  {
    from: ['PostgreSQL', 'Postgres', 'Supabase', 'SQL'],
    to: ['SQL', 'PostgreSQL', 'Prisma', 'Drizzle', 'Redis', 'MongoDB'],
    reason: 'Relational modeling and query optimization experience transfers across data stores.',
  },
  {
    from: ['Node.js', 'Express', 'NestJS'],
    to: ['FastAPI', 'Django', 'Rails', 'Go', 'GraphQL'],
    reason: 'API design, async concurrency, and service architecture patterns carry over cleanly.',
  },
  {
    from: ['Python', 'Django', 'FastAPI'],
    to: ['Node.js', 'Machine Learning', 'AI', 'LLM', 'PyTorch', 'TensorFlow', 'SQL'],
    reason: 'Python engineering experience bridges backend services, data pipelines, and AI workflows.',
  },
  {
    from: ['AWS', 'GCP', 'Azure'],
    to: ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
    reason: 'Cloud platform fundamentals transfer across providers and infrastructure automation.',
  },
  {
    from: ['Docker', 'Kubernetes'],
    to: ['Terraform', 'CI/CD', 'Linux', 'AWS', 'GCP'],
    reason: 'Container orchestration and deployment pipeline skills map directly to DevOps workflows.',
  },
  {
    from: ['Vitest', 'Jest', 'Playwright'],
    to: ['Playwright', 'Vitest', 'Jest', 'CI/CD', 'TypeScript'],
    reason: 'Automated testing methodology and assertion frameworks transfer across test runners.',
  },
  {
    from: ['PyTorch', 'TensorFlow', 'Machine Learning', 'LLM'],
    to: ['AI', 'LLM', 'PyTorch', 'TensorFlow', 'Python'],
    reason: 'Applied ML model training and evaluation skills transfer directly across AI stacks.',
  },
];

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractJobSkills(title: string, description: string): string[] {
  const haystack = ` ${title} ${description} `.toLowerCase();
  const found: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(haystack)) {
      found.push(skill);
    }
  }

  return Array.from(new Set(found));
}

export function inferWorkMode(
  title: string,
  location: string | null,
  description: string
): 'remote' | 'hybrid' | 'onsite' {
  const text = `${title} ${location ?? ''} ${description.slice(0, 600)}`.toLowerCase();
  if (/\bremote\b/.test(text)) return 'remote';
  if (/\bhybrid\b/.test(text)) return 'hybrid';
  return 'onsite';
}

export function inferSeniorityLevel(title: string, description = ''): string {
  const titleText = title.toLowerCase();
  if (/\b(staff|principal|distinguished|architect)\b/.test(titleText)) {
    return 'Staff / Principal';
  }
  if (/\b(lead|manager|head of|director|vp)\b/.test(titleText)) {
    return 'Lead / Manager';
  }
  if (/\b(senior|sr\.?)\b/.test(titleText)) {
    return 'Senior';
  }
  if (/\b(junior|jr\.?|entry|intern|new grad|associate)\b/.test(titleText)) {
    return 'Entry / Junior';
  }
  const desc = description.slice(0, 2000).toLowerCase();
  if (/\b(7\+|8\+|10\+)\s*years/.test(desc)) return 'Senior / Staff';
  if (/\b(3\+|4\+|5\+)\s*years/.test(desc)) return 'Mid to Senior';
  if (/\b(0-2|1-2|1\+)\s*years/.test(desc)) return 'Entry / Junior';
  return 'Mid-level / Unspecified';
}

export function extractExpectedExperienceYears(description: string): string | null {
  const match = description.match(
    /\b(\d{1,2}\s*(?:-|–|to)\s*\d{1,2}|\d{1,2}\+)\s*years?\s*(?:of)?\s*(?:relevant|professional|industry|software|engineering|work)?\s*(?:experience)?/i
  );
  if (!match?.[1]) return null;
  return `${match[1].replace(/\s+/g, ' ')} years`;
}

export function findTransferableSkills(
  userSkills: string[],
  missingSkills: string[]
): TransferableSkillMatch[] {
  if (userSkills.length === 0 || missingSkills.length === 0) return [];
  const results: TransferableSkillMatch[] = [];
  const seenTarget = new Set<string>();
  const userSkillMap = new Map<string, string>();
  for (const skill of userSkills) {
    userSkillMap.set(skill.toLowerCase(), skill);
  }

  for (const target of missingSkills) {
    const targetLower = target.toLowerCase();
    if (seenTarget.has(targetLower)) continue;

    for (const rule of TRANSFERABLE_SKILL_RULES) {
      if (!rule.to.some((t) => t.toLowerCase() === targetLower)) continue;
      const matchedCandidate = rule.from.find((f) => userSkillMap.has(f.toLowerCase()));
      if (matchedCandidate) {
        seenTarget.add(targetLower);
        results.push({
          candidateSkill: userSkillMap.get(matchedCandidate.toLowerCase()) ?? matchedCandidate,
          targetSkill: target,
          reason: rule.reason,
        });
        break;
      }
    }
  }

  return results.slice(0, 6);
}

export function computeJobMatch(
  profile: ProfileDto | null,
  job: {
    title: string;
    location: string | null;
    workMode: string | null;
    description: string;
    skills: string[];
  }
): JobMatchBreakdown {
  if (!profile) {
    return {
      score: 50,
      skillsScore: 0,
      experienceScore: 50,
      matchedSkills: [],
      missingSkills: job.skills.slice(0, 5),
      transferableSkills: [],
      strengths: [],
      gaps: job.skills.slice(0, 4).map((s) => `Requires ${s}`),
      reasons: ['Sign in and complete your profile for personalized match scoring.'],
      isAdjacentRole: false,
      adjacencyReason: null,
    };
  }

  const userSkills = profile.skills
    .filter((s) => s.source !== 'ai')
    .map((s) => s.name.trim())
    .filter(Boolean);
  const summaryConfirmed = profile.intelligenceMetadata?.summarySource !== 'ai';
  const confirmedHeadline = summaryConfirmed ? profile.headline : null;
  const hasPreferences =
    profile.preferredTitles.length > 0 ||
    (profile.desiredRoles?.length ?? 0) > 0 ||
    profile.preferredLocations.length > 0 ||
    Boolean(profile.workMode) ||
    Boolean(confirmedHeadline);

  if (userSkills.length === 0 && !hasPreferences) {
    return {
      score: 50,
      skillsScore: 0,
      experienceScore: 50,
      matchedSkills: [],
      missingSkills: job.skills.slice(0, 5),
      transferableSkills: [],
      strengths: [],
      gaps: job.skills.slice(0, 4).map((s) => `Listed requirement: ${s}`),
      reasons: ['Add skills and preferences to your profile to unlock accurate match scores.'],
      isAdjacentRole: false,
      adjacencyReason: null,
    };
  }

  const reasons: string[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  // 1. Skills match (45 points) + Skills compatibility percentage
  const jobHaystack = `${job.title} ${job.description}`.toLowerCase();
  const matchedSkills: string[] = [];

  for (const skill of userSkills) {
    const lower = skill.toLowerCase();
    const inTags = job.skills.some((js) => js.toLowerCase() === lower);
    if (inTags || jobHaystack.includes(lower)) {
      matchedSkills.push(skill);
    }
  }

  const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));
  const missingSkills = job.skills.filter(
    (js) => !userSkillSet.has(js.toLowerCase())
  );
  const transferableSkills = findTransferableSkills(userSkills, missingSkills);

  let skillsScore = 50;
  if (userSkills.length > 0) {
    const denominator = Math.max(Math.min(job.skills.length || 5, userSkills.length), 1);
    const directRatio = matchedSkills.length / denominator;
    const transferableBoost = Math.min(0.25, transferableSkills.length * 0.08);
    skillsScore = Math.min(100, Math.round((directRatio + transferableBoost) * 100));
    const skillPoints = Math.min(45, Math.round(directRatio * 45));
    score += skillPoints;

    if (matchedSkills.length > 0) {
      const topSkills = matchedSkills.slice(0, 4).join(', ');
      reasons.push(`Matches ${matchedSkills.length} of your skills (${topSkills})`);
      strengths.push(`Direct stack overlap in ${topSkills}`);
    } else if (job.skills.length > 0) {
      reasons.push('Low skill overlap with listed requirements');
      gaps.push(`Missing listed stack: ${missingSkills.slice(0, 4).join(', ')}`);
    }

    if (transferableSkills.length > 0) {
      strengths.push(
        `Transferable skills: ${transferableSkills
          .slice(0, 2)
          .map((t) => `${t.candidateSkill} → ${t.targetSkill}`)
          .join(', ')}`
      );
    }
    if (missingSkills.length > 0 && matchedSkills.length > 0) {
      gaps.push(`Unlisted in your profile: ${missingSkills.slice(0, 4).join(', ')}`);
    }
  } else {
    score += 15;
  }

  // 2. Title & Headline match (25 points)
  const jobTitleLower = job.title.toLowerCase();
  const experienceTitles = profile.experience
    .filter((e) => e.source !== 'ai')
    .map((e) => e.title);
  const titleTargets = [
    ...profile.preferredTitles,
    ...(profile.desiredRoles ?? []),
    ...(confirmedHeadline ? [confirmedHeadline] : []),
    ...experienceTitles,
  ]
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const isExcludedRole = (profile.excludedRoles ?? []).some((excluded) => {
    const token = excluded.trim().toLowerCase();
    return token.length > 0 && jobTitleLower.includes(token);
  });
  if (isExcludedRole) {
    gaps.push('Matches an excluded role in your Career Interests');
  }

  let bestTitleRatio = 0;
  if (titleTargets.length > 0) {
    for (const target of titleTargets) {
      const words = target.split(/\s+/).filter((w) => w.length > 2);
      if (words.length === 0) continue;
      const hits = words.filter((w) => jobTitleLower.includes(w)).length;
      bestTitleRatio = Math.max(bestTitleRatio, hits / words.length);
    }
    const titlePoints = Math.round(bestTitleRatio * 25);
    score += titlePoints;
    if (titlePoints >= 15) {
      reasons.push('Strong alignment with your target role');
      strengths.push('Title aligns closely with your target roles and experience');
    }
  } else {
    score += 12;
  }

  // 3. Location / Work Mode match (20 points)
  let locationMatched = false;
  if (profile.workMode && job.workMode === profile.workMode) {
    score += 20;
    locationMatched = true;
    reasons.push(`Matches your ${profile.workMode} work preference`);
    strengths.push(`Supports your preferred ${profile.workMode} work mode`);
  } else if (
    profile.preferredLocations.length > 0 &&
    job.location &&
    profile.preferredLocations.some((loc) =>
      job.location!.toLowerCase().includes(loc.toLowerCase())
    )
  ) {
    score += 20;
    locationMatched = true;
    reasons.push(`Located in preferred region (${job.location})`);
    strengths.push(`Matches preferred location (${job.location})`);
  } else if (!profile.workMode && profile.preferredLocations.length === 0) {
    score += 12;
  } else if (job.workMode === 'remote') {
    score += 12;
  }

  if (!locationMatched && profile.workMode && job.workMode && job.workMode !== profile.workMode) {
    reasons.push(`Work mode is ${job.workMode} (you prefer ${profile.workMode})`);
    gaps.push(`Work mode mismatch (${job.workMode} vs preferred ${profile.workMode})`);
  }

  // 4. Seniority & Experience alignment (10 points) + Experience compatibility %
  const years = profile.yearsOfExperience;
  let experienceScore = 70;
  if (years !== null && years !== undefined) {
    const isSenior = /\b(senior|sr\.?|staff|principal|lead)\b/i.test(job.title);
    const isJunior = /\b(junior|jr\.?|entry|intern|associate)\b/i.test(job.title);
    if ((isSenior && years >= 4) || (isJunior && years <= 2) || (!isSenior && !isJunior)) {
      score += 10;
      experienceScore = Math.min(100, 82 + (bestTitleRatio >= 0.5 ? 15 : 0));
      strengths.push(`Seniority aligns well (${years} yrs experience)`);
    } else {
      score += 3;
      experienceScore = isSenior && years < 4 ? 42 : 55;
      gaps.push(
        isSenior
          ? `Senior-level title vs ${years} years recorded experience`
          : `Entry-level scope vs ${years} years experience`
      );
    }
  } else {
    score += 7;
    experienceScore = Math.round(55 + bestTitleRatio * 35);
  }

  // 5. Adjacent-role detection (roles outside exact preferred titles with strong skill/transferable fit)
  const hasExplicitTitles =
    profile.preferredTitles.length > 0 ||
    (profile.desiredRoles?.length ?? 0) > 0 ||
    Boolean(confirmedHeadline) ||
    experienceTitles.length > 0;
  const matchesAdjacentInterest = (profile.adjacentRoles ?? []).some((adj) => {
    const words = adj.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return words.length > 0 && words.every((w) => jobTitleLower.includes(w));
  });
  const isAdjacentRole =
    matchesAdjacentInterest ||
    (hasExplicitTitles &&
      bestTitleRatio < 0.5 &&
      (matchedSkills.length >= 2 || transferableSkills.length >= 1 || skillsScore >= 50));

  let adjacencyReason: string | null = null;
  if (isAdjacentRole) {
    const overlapSummary =
      matchedSkills.length > 0
        ? matchedSkills.slice(0, 3).join(', ')
        : transferableSkills
            .slice(0, 2)
            .map((t) => t.targetSkill)
            .join(', ');
    adjacencyReason = `Different title track from your usual search, but your background in ${overlapSummary} transfers strongly.`;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    skillsScore,
    experienceScore,
    matchedSkills,
    missingSkills: missingSkills.slice(0, 6),
    transferableSkills,
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
    reasons,
    isAdjacentRole,
    adjacencyReason,
  };
}

export function deterministicHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(31, h) + input.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function computeOpportunityEvaluation(
  profile: ProfileDto | null,
  job: {
    title: string;
    company: string;
    location: string | null;
    workMode: string | null;
    employmentType: string | null;
    description: string;
    skills: string[];
  },
  match: JobMatchBreakdown,
  intelligence: JobIntelligenceBreakdown
): OpportunityEvaluation {
  if (!profile) {
    return {
      eligibilityAssessment:
        'Sign in and complete your profile to unlock evidence-based opportunity evaluation.',
      competitivenessAssessment:
        'Complete your profile to get a personalized competitiveness read.',
      recommendedAction: 'improve',
      actionRationale: 'Profile information is needed to evaluate this opportunity.',
      requirementEvaluations: [],
      strengths: [],
      missingEvidence: intelligence.requiredSkills.slice(0, 5),
      transferableCapabilities: [],
      constraintChecks: [],
      hardConstraintBlocked: false,
      confidenceLevel: 'low',
      uncertaintyReasons: ['No profile data available.'],
      evaluationVersion: 'v1:no-profile',
    };
  }

  const confirmedSkills = profile.skills.filter((s) => s.source !== 'ai');
  const userSkillMap = new Map(confirmedSkills.map((s) => [s.name.toLowerCase(), s]));

  const transferableByTarget = new Map<string, TransferableSkillMatch>();
  for (const t of match.transferableSkills) {
    transferableByTarget.set(t.targetSkill.toLowerCase(), t);
  }

  // Build per-requirement evaluations
  const requirementEvaluations: RequirementEvaluation[] = [];
  const allRequirements = [
    ...intelligence.requiredSkills.map((r) => ({ req: r, kind: 'required' as const })),
    ...intelligence.preferredSkills.map((r) => ({ req: r, kind: 'preferred' as const })),
  ];

  for (const { req, kind } of allRequirements) {
    const reqLower = req.toLowerCase();
    const skillEntry = userSkillMap.get(reqLower);

    if (skillEntry) {
      const yoe = skillEntry.yearsOfExperience ? Number(skillEntry.yearsOfExperience) : 0;
      const hasEvidence = Boolean(
        skillEntry.evidence?.trim() || yoe > 0 || skillEntry.proficiency?.trim()
      );
      const strength: CapabilityStrength = hasEvidence ? 'demonstrated' : 'confirmed';
      let evidence: string | null = null;
      if (skillEntry.evidence?.trim()) {
        evidence = skillEntry.evidence.trim();
      } else if (yoe > 0) {
        evidence = `${yoe} year${yoe === 1 ? '' : 's'} of experience`;
      } else if (skillEntry.proficiency?.trim()) {
        evidence = `${skillEntry.proficiency} proficiency`;
      }
      requirementEvaluations.push({
        requirement: req,
        kind,
        strength,
        evidence,
        candidateSkill: skillEntry.name,
        transferableFrom: null,
        note: hasEvidence
          ? 'Confirmed in your profile with supporting evidence.'
          : 'Listed in your profile; adding evidence would strengthen this claim.',
      });
      continue;
    }

    // Check experience technologies (direct tech usage at a job)
    const confirmedExp = profile.experience.filter((e) => e.source !== 'ai');
    const expTechMatch = confirmedExp.find((e) =>
      (e.technologies ?? []).some((t) => t.toLowerCase() === reqLower)
    );
    if (expTechMatch) {
      requirementEvaluations.push({
        requirement: req,
        kind,
        strength: 'inferred',
        evidence: `Used at ${expTechMatch.company}`,
        candidateSkill: null,
        transferableFrom: null,
        note: 'Found in your work experience technologies. Consider adding it as a formal skill.',
      });
      continue;
    }

    // Check transferable skills from match
    const transferable = transferableByTarget.get(reqLower);
    if (transferable) {
      requirementEvaluations.push({
        requirement: req,
        kind,
        strength: 'inferred',
        evidence: null,
        candidateSkill: null,
        transferableFrom: transferable.candidateSkill,
        note: transferable.reason,
      });
      continue;
    }

    // Check experience descriptions and project technologies
    const inExpDesc = confirmedExp.some((e) => {
      const hay = `${e.description ?? ''} ${(e.achievements ?? []).join(' ')}`.toLowerCase();
      return hay.includes(reqLower);
    });
    const confirmedProjects = profile.projects.filter((p) => p.source !== 'ai');
    const inProjectTech = confirmedProjects.some((p) =>
      (p.technologies ?? []).some((t) => t.toLowerCase() === reqLower)
    );
    const inProjectDesc = confirmedProjects.some((p) =>
      (p.description ?? '').toLowerCase().includes(reqLower)
    );

    if (inExpDesc || inProjectTech || inProjectDesc) {
      requirementEvaluations.push({
        requirement: req,
        kind,
        strength: 'inferred',
        evidence: inProjectTech || inProjectDesc ? 'Referenced in project work' : 'Referenced in work experience',
        candidateSkill: null,
        transferableFrom: null,
        note: 'Mentioned in your experience or projects but not listed as a formal skill.',
      });
      continue;
    }

    requirementEvaluations.push({
      requirement: req,
      kind,
      strength: 'unsupported',
      evidence: null,
      candidateSkill: null,
      transferableFrom: null,
      note: 'Not documented in your profile. If you have this capability, consider adding it.',
    });
  }

  // Constraint checks
  const constraintChecks: OpportunityConstraintCheck[] = [];
  let hardConstraintBlocked = false;

  const jobCompanyLower = job.company.trim().toLowerCase();
  const isExcludedCompany = (profile.excludedCompanies ?? []).some((c) => {
    const token = c.trim().toLowerCase();
    return token.length > 0 && (jobCompanyLower === token || jobCompanyLower.includes(token));
  });
  if (isExcludedCompany) {
    hardConstraintBlocked = true;
    constraintChecks.push({
      kind: 'excluded_company',
      satisfied: false,
      detail: `${job.company} is in your excluded companies list.`,
    });
  }

  const jobTitleLower = job.title.toLowerCase();
  const isExcludedRole = (profile.excludedRoles ?? []).some((r) => {
    const token = r.trim().toLowerCase();
    return token.length > 0 && jobTitleLower.includes(token);
  });
  if (isExcludedRole) {
    hardConstraintBlocked = true;
    constraintChecks.push({
      kind: 'excluded_role',
      satisfied: false,
      detail: 'This role title matches an excluded role in your Career Interests.',
    });
  }

  if (profile.workMode && job.workMode) {
    const workModeMatch = profile.workMode === job.workMode;
    constraintChecks.push({
      kind: 'work_mode',
      satisfied: workModeMatch,
      detail: workModeMatch
        ? `Work mode matches your preference (${profile.workMode}).`
        : `Role is ${job.workMode}; you prefer ${profile.workMode}.`,
    });
  }

  if (profile.preferredLocations.length > 0 && job.location && job.workMode !== 'remote') {
    const locationMatch = profile.preferredLocations.some((loc) =>
      job.location!.toLowerCase().includes(loc.toLowerCase())
    );
    if (!locationMatch) {
      constraintChecks.push({
        kind: 'location',
        satisfied: false,
        detail: `Role is in ${job.location}, outside your preferred locations.`,
      });
    }
  }

  if (profile.employmentTypes.length > 0 && job.employmentType) {
    const normalize = (t: string) => t.toLowerCase().replace(/[_\s]/g, '');
    const typeMatch = profile.employmentTypes.some(
      (pt) => normalize(pt) === normalize(job.employmentType!)
    );
    if (!typeMatch) {
      constraintChecks.push({
        kind: 'employment_type',
        satisfied: false,
        detail: `Role is ${job.employmentType.replace(/_/g, ' ')}; you prefer ${profile.employmentTypes[0]?.replace(/_/g, ' ') ?? 'other'}.`,
      });
    }
  }

  // Coverage metrics
  const coverable: CapabilityStrength[] = ['demonstrated', 'confirmed', 'inferred'];
  const requiredEvals = requirementEvaluations.filter((r) => r.kind === 'required');
  const coveredRequired = requiredEvals.filter((r) => coverable.includes(r.strength)).length;
  const totalRequired = requiredEvals.length;
  const coverageRatio = totalRequired > 0 ? coveredRequired / totalRequired : 1;

  const missingEvidence = requiredEvals
    .filter((r) => r.strength === 'unsupported')
    .map((r) => r.requirement);

  // Confidence assessment
  const uncertaintyReasons: string[] = [];
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';

  if (confirmedSkills.length === 0) {
    uncertaintyReasons.push('No confirmed skills — only AI-extracted entries pending your verification.');
    confidenceLevel = 'low';
  } else if (confirmedSkills.length < 3) {
    uncertaintyReasons.push('Few confirmed skills — add more for a sharper evaluation.');
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
  }

  if (profile.experience.filter((e) => e.source !== 'ai').length === 0) {
    uncertaintyReasons.push('No confirmed work experience — seniority and depth assessment is limited.');
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
  }

  if (totalRequired === 0) {
    uncertaintyReasons.push('No specific skill requirements identified in this posting.');
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
  }

  if ((profile.completionPercent ?? 0) < 40) {
    uncertaintyReasons.push('Profile is incomplete — evaluation may not reflect your full capabilities.');
    if (confidenceLevel !== 'low') confidenceLevel = 'medium';
  }

  // Recommended action
  let recommendedAction: 'pursue' | 'improve' | 'deprioritize';
  let actionRationale: string;
  let eligibilityAssessment: string;
  let competitivenessAssessment: string;

  if (hardConstraintBlocked) {
    recommendedAction = 'deprioritize';
    const blockedDetail = constraintChecks
      .filter((c) => !c.satisfied && (c.kind === 'excluded_company' || c.kind === 'excluded_role'))
      .map((c) => c.detail)
      .join(' ');
    actionRationale = blockedDetail || 'A hard career preference constraint is violated.';
    eligibilityAssessment = `This opportunity is excluded by your preferences. ${actionRationale}`;
    competitivenessAssessment = 'Evaluation skipped — this role conflicts with your stated exclusions.';
  } else if (coverageRatio >= 0.6) {
    recommendedAction = 'pursue';
    actionRationale = `You can account for ${coveredRequired} of ${totalRequired} required skill${totalRequired !== 1 ? 's' : ''}${
      match.transferableSkills.length > 0 ? ', including transferable capabilities' : ''
    }. Your background aligns with the core requirements.`;
    eligibilityAssessment = `You meet the essential requirements with ${Math.round(coverageRatio * 100)}% documented required skill coverage.`;
    competitivenessAssessment =
      match.experienceScore >= 60
        ? `Strong alignment across required skills and seniority level.${
            missingEvidence.length > 0
              ? ` Documenting ${missingEvidence.slice(0, 2).join(' and ')} would sharpen your profile.`
              : ' Your profile supports a confident application.'
          }`
        : 'Skill coverage is solid but the seniority expectation is mixed — frame your experience level clearly in the application.';
  } else if (coverageRatio >= 0.25) {
    recommendedAction = 'improve';
    actionRationale = `You cover ${coveredRequired} of ${totalRequired} required skill${totalRequired !== 1 ? 's' : ''}. Adding evidence for undocumented capabilities would improve your position.`;
    eligibilityAssessment = `Partial match — ${Math.round(coverageRatio * 100)}% of required skills are documented in your profile.`;
    competitivenessAssessment =
      missingEvidence.length > 0
        ? `Moderate competitiveness. Requirements without documentation: ${missingEvidence.slice(0, 3).join(', ')}.`
        : 'Moderate competitiveness. Consider enriching your profile evidence for stronger positioning.';
  } else {
    recommendedAction = 'deprioritize';
    actionRationale = `Only ${coveredRequired} of ${totalRequired} required skill${totalRequired !== 1 ? 's' : ''} are accounted for in your profile. This role requires significant upskilling or a different background.`;
    eligibilityAssessment = `Low documented skill alignment — your profile covers ${Math.round(coverageRatio * 100)}% of listed requirements.`;
    competitivenessAssessment =
      missingEvidence.length > 0
        ? `Limited competitiveness based on current profile. Key undocumented requirements: ${missingEvidence.slice(0, 4).join(', ')}.`
        : 'Limited competitiveness based on current profile.';
  }

  // Deterministic version hash based on key inputs
  const versionInput = [
    'v1',
    confirmedSkills.map((s) => s.name.toLowerCase()).sort().join(','),
    intelligence.requiredSkills.slice().sort().join(','),
    profile.workMode ?? '',
    (profile.excludedCompanies ?? []).slice().sort().join(','),
  ].join('|');
  const evaluationVersion = `v1:${deterministicHash(versionInput)}`;

  return {
    eligibilityAssessment,
    competitivenessAssessment,
    recommendedAction,
    actionRationale,
    requirementEvaluations,
    strengths: match.strengths,
    missingEvidence,
    transferableCapabilities: match.transferableSkills,
    constraintChecks,
    hardConstraintBlocked,
    confidenceLevel,
    uncertaintyReasons,
    evaluationVersion,
  };
}

export function analyzeJobIntelligence(job: {
  title: string;
  company: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
  description: string;
  skills: string[];
  source: string;
}): JobIntelligenceBreakdown {
  const text = job.description.trim();
  const sentences = text
    .split(/(?<=[.!?])\s+|\s*[•·▪]\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 280);

  const responsibilityRegex =
    /\b(build|design|architect|develop|own|lead|collaborate|maintain|scale|optimize|ship|deliver|implement|drive|partner|mentor|ensure|create|improve|debug|test|deploy)\b/i;
  const techReqRegex =
    /\b(experience with|proficiency in|knowledge of|familiarity with|strong background|architecture|distributed|api|apis|database|databases|cloud|security|performance|testing|ci\/cd|scalability|typescript|python|react|postgres|kubernetes)\b/i;
  const preferredRegex =
    /\b(preferred|nice to have|bonus|plus|ideal|desirable|advantage|optional)\b/i;

  const responsibilities: string[] = [];
  const technicalRequirements: string[] = [];

  for (const s of sentences) {
    if (responsibilities.length < 6 && responsibilityRegex.test(s) && !/^we are an equal/i.test(s)) {
      responsibilities.push(s);
    }
    if (
      technicalRequirements.length < 6 &&
      techReqRegex.test(s) &&
      !responsibilities.includes(s)
    ) {
      technicalRequirements.push(s);
    }
  }

  // Classify skills into required vs preferred per sentence/clause so adjacent sections don't bleed
  const allClauses = text
    .split(/(?<=[.!?])\s+|\s*[•·▪]\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const preferredSkills: string[] = [];
  const requiredSkills: string[] = [];

  for (const skill of job.skills) {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (skillRegex.test(job.title)) {
      requiredSkills.push(skill);
      continue;
    }
    const matchingClauses = allClauses.filter((c) => skillRegex.test(c));
    if (
      matchingClauses.length > 0 &&
      matchingClauses.every((c) => preferredRegex.test(c))
    ) {
      preferredSkills.push(skill);
    } else {
      requiredSkills.push(skill);
    }
  }

  const seniorityLevel = inferSeniorityLevel(job.title, text);
  const expectedExperienceYears = extractExpectedExperienceYears(text);

  const highlights: string[] = [];
  if (job.workMode) highlights.push(`Work mode: ${job.workMode}`);
  if (job.location) highlights.push(`Location: ${job.location}`);
  if (job.employmentType) {
    highlights.push(`Commitment: ${job.employmentType.replace(/_/g, ' ')}`);
  }
  highlights.push(`Source: ${job.source} ATS board`);

  const summarySentences = sentences.slice(0, 2);
  const summary =
    summarySentences.length > 0
      ? summarySentences.join(' ')
      : `${job.company} is hiring a ${job.title}${job.location ? ` in ${job.location}` : ''}.`;

  return {
    summary,
    responsibilities:
      responsibilities.length > 0
        ? responsibilities
        : [
            `Collaborate with engineering and product teams at ${job.company} to deliver ${job.title} initiatives.`,
          ],
    requiredSkills,
    preferredSkills,
    technicalRequirements,
    seniorityLevel,
    expectedExperienceYears,
    companyAndRoleHighlights: highlights,
  };
}
