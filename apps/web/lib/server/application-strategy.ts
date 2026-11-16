import type {
  ApplicationStrategy,
  JobIntelligenceBreakdown,
  JobMatchBreakdown,
  OpportunityEvaluation,
  ProfileDto,
  ResumeSectionChange,
  ScreeningTopic,
  StrategyAction,
  StrategyExperience,
  StrategyProject,
} from '@/lib/types';
import { deterministicHash } from './job-matching';

const MAX_EXPERIENCES = 3;
const MAX_PROJECTS = 2;

function getRecencyScore(endDate: string | null, isCurrent: boolean): number {
  if (isCurrent) return 1.0;
  if (!endDate) return 0.5;
  const year = parseInt(endDate.slice(0, 4), 10);
  if (isNaN(year)) return 0.5;
  const age = new Date().getFullYear() - year;
  if (age <= 1) return 0.95;
  if (age <= 2) return 0.85;
  if (age <= 4) return 0.70;
  if (age <= 6) return 0.55;
  return 0.40;
}

interface ScoredExperience {
  id: string;
  score: number;
  coveredRequired: string[];
  relevantAchievements: string[];
}

interface ScoredProject {
  id: string;
  score: number;
  coveredRequired: string[];
  whySelected: string;
}

function scoreExperience(
  exp: ProfileDto['experience'][number],
  requiredSkills: string[],
  preferredSkills: string[],
): ScoredExperience {
  const techs = new Set((exp.technologies ?? []).map((t) => t.toLowerCase()));
  const descText =
    `${exp.description ?? ''} ${(exp.achievements ?? []).join(' ')}`.toLowerCase();

  const coveredRequired: string[] = [];
  for (const s of requiredSkills) {
    if (techs.has(s.toLowerCase()) || descText.includes(s.toLowerCase()))
      coveredRequired.push(s);
  }

  const coveredPreferred: string[] = [];
  for (const s of preferredSkills) {
    if (techs.has(s.toLowerCase()) || descText.includes(s.toLowerCase()))
      coveredPreferred.push(s);
  }

  let score = coveredRequired.length * 2 + coveredPreferred.length * 0.5;
  if (score === 0) return { id: exp.id, score: 0, coveredRequired: [], relevantAchievements: [] };

  const rec = getRecencyScore(exp.endDate ?? null, exp.isCurrent);
  score *= 0.5 + rec * 0.5;
  if ((exp.achievements ?? []).length > 0) score *= 1.2;
  if ((exp.technologies ?? []).length >= 3) score *= 1.1;

  const reqLower = new Set(
    [...requiredSkills, ...preferredSkills].map((s) => s.toLowerCase()),
  );
  const relevantAchievements: string[] = [];
  for (const ach of exp.achievements ?? []) {
    if ([...reqLower].some((r) => ach.toLowerCase().includes(r)))
      relevantAchievements.push(ach);
  }
  for (const ach of exp.achievements ?? []) {
    if (!relevantAchievements.includes(ach) && relevantAchievements.length < 2)
      relevantAchievements.push(ach);
  }

  return { id: exp.id, score, coveredRequired, relevantAchievements };
}

function scoreProject(
  proj: ProfileDto['projects'][number],
  requiredSkills: string[],
  preferredSkills: string[],
): ScoredProject {
  const techs = new Set((proj.technologies ?? []).map((t) => t.toLowerCase()));
  const descText =
    `${proj.description ?? ''} ${(proj.contributions ?? []).join(' ')}`.toLowerCase();

  const coveredRequired: string[] = [];
  for (const s of requiredSkills) {
    if (techs.has(s.toLowerCase()) || descText.includes(s.toLowerCase()))
      coveredRequired.push(s);
  }

  const coveredPreferred: string[] = [];
  for (const s of preferredSkills) {
    if (techs.has(s.toLowerCase()) || descText.includes(s.toLowerCase()))
      coveredPreferred.push(s);
  }

  let score = coveredRequired.length * 2 + coveredPreferred.length * 0.5;
  if (score === 0)
    return { id: proj.id, score: 0, coveredRequired: [], whySelected: '' };

  if (proj.liveUrl || proj.githubUrl) score *= 1.2;
  if ((proj.contributions ?? []).length > 0) score *= 1.15;
  if ((proj.technologies ?? []).length >= 3) score *= 1.1;

  const topCovered = coveredRequired.slice(0, 3).join(', ');
  return {
    id: proj.id,
    score,
    coveredRequired,
    whySelected: topCovered ? `Demonstrates ${topCovered}` : 'Relevant project experience',
  };
}

function buildPositioning(
  profile: ProfileDto,
  topExps: ScoredExperience[],
  skillsToEmphasize: string[],
  intelligence: JobIntelligenceBreakdown,
  job: { title: string; company: string },
): string {
  const confirmedExps = profile.experience.filter((e) => e.source !== 'ai');
  const topExp = confirmedExps.find((e) => e.id === topExps[0]?.id);
  const topSkills = skillsToEmphasize.slice(0, 3).join(', ');

  if (!topExp && !topSkills) {
    return `Emphasize your transferable background for this ${intelligence.seniorityLevel} ${job.title} role at ${job.company}.`;
  }
  if (topExp && topSkills) {
    return `Frame yourself as a ${topSkills} specialist, drawing on your ${topExp.title} background at ${topExp.company} to directly address ${job.company}'s requirements.`;
  }
  if (topSkills) {
    return `Lead with your ${topSkills} expertise to match ${job.company}'s ${intelligence.seniorityLevel.toLowerCase()}-level ${job.title} requirements.`;
  }
  return `Lead with your ${topExp!.title} experience at ${topExp!.company}, framing your most relevant work around the core requirements.`;
}

function buildScreeningTopics(
  evaluation: OpportunityEvaluation,
  match: JobMatchBreakdown,
  intelligence: JobIntelligenceBreakdown,
  topExps: ScoredExperience[],
  profile: ProfileDto,
): ScreeningTopic[] {
  const topics: ScreeningTopic[] = [];
  const confirmedExps = profile.experience.filter((e) => e.source !== 'ai');

  for (const req of evaluation.requirementEvaluations) {
    if (req.kind !== 'required') continue;
    if (req.strength === 'inferred' && req.transferableFrom) {
      topics.push({
        topic: `Your hands-on experience with ${req.requirement}`,
        reason: `${req.requirement} is a core requirement; your evidence comes from ${req.transferableFrom}`,
        preparationHint: `Explain how ${req.transferableFrom} work translates to ${req.requirement}. Have a concrete example ready.`,
      });
    } else if (req.strength === 'unsupported') {
      topics.push({
        topic: `Gap: ${req.requirement}`,
        reason: `${req.requirement} is required but not documented in your profile`,
        preparationHint: `Be candid about your exposure. If you have adjacent experience, describe it. If not, describe a learning plan.`,
      });
    }
  }

  if (
    match.experienceScore < 60 &&
    /senior|staff|lead|principal/i.test(intelligence.seniorityLevel)
  ) {
    topics.push({
      topic: 'Demonstrating seniority and ownership',
      reason: 'The role targets a senior level; your experience signals may need reinforcement',
      preparationHint:
        'Prepare examples of leading features end-to-end, mentoring peers, or making architectural decisions autonomously.',
    });
  }

  for (let i = 0; i < Math.min(2, topExps.length); i++) {
    const sel = topExps[i]!;
    const exp = confirmedExps.find((e) => e.id === sel.id);
    if (!exp || sel.coveredRequired.length === 0) continue;
    const covered = sel.coveredRequired.slice(0, 3).join(', ');
    topics.push({
      topic: `${exp.title} at ${exp.company} — ${covered}`,
      reason: 'This is your strongest evidence and will likely be explored in depth',
      preparationHint: `Prepare STAR-format answers about ${covered}. Have measurable outcomes ready.`,
    });
  }

  return topics.slice(0, 5);
}

function buildResumeSectionChanges(
  profile: ProfileDto,
  evaluation: OpportunityEvaluation,
  intelligence: JobIntelligenceBreakdown,
  topExps: ScoredExperience[],
): ResumeSectionChange[] {
  const changes: ResumeSectionChange[] = [];
  const confirmedSkillNames = new Set(
    profile.skills.filter((s) => s.source !== 'ai').map((s) => s.name.toLowerCase()),
  );
  const confirmedExps = profile.experience.filter((e) => e.source !== 'ai');

  const techSkillsMissing = new Set<string>();
  for (const exp of confirmedExps) {
    for (const tech of exp.technologies ?? []) {
      if (
        !confirmedSkillNames.has(tech.toLowerCase()) &&
        intelligence.requiredSkills.some((r) => r.toLowerCase() === tech.toLowerCase())
      ) {
        techSkillsMissing.add(tech);
      }
    }
  }
  if (techSkillsMissing.size > 0) {
    changes.push({
      section: 'skills',
      change: `Add ${[...techSkillsMissing].slice(0, 4).join(', ')} to your Skills section`,
      reason:
        'These required skills appear in your work experience but are absent from your Skills section — recruiters and ATS check skills first',
      priority: 'high',
    });
  }

  const summaryText = (profile.summary ?? '').toLowerCase();
  const requiredNotInSummary = intelligence.requiredSkills
    .filter(
      (s) =>
        confirmedSkillNames.has(s.toLowerCase()) && !summaryText.includes(s.toLowerCase()),
    )
    .slice(0, 3);
  if (requiredNotInSummary.length > 0) {
    changes.push({
      section: 'summary',
      change: `Mention ${requiredNotInSummary.join(', ')} in your professional summary`,
      reason: 'Your summary should signal these core requirements immediately',
      priority: 'medium',
    });
  }

  for (const sel of topExps.slice(0, 2)) {
    const exp = confirmedExps.find((e) => e.id === sel.id);
    if (!exp) continue;
    if ((exp.achievements ?? []).length === 0) {
      changes.push({
        section: 'experience',
        change: `Add measurable achievements to your ${exp.title} role at ${exp.company}`,
        reason: 'Quantified achievements differentiate you from candidates with similar titles',
        priority: 'high',
      });
    }
  }

  const inferredRequired = evaluation.requirementEvaluations
    .filter((r) => r.kind === 'required' && r.strength === 'inferred' && !r.candidateSkill)
    .map((r) => r.requirement)
    .slice(0, 2);
  if (inferredRequired.length > 0) {
    changes.push({
      section: 'experience',
      change: `Explicitly name ${inferredRequired.join(', ')} in your experience bullet points where applicable`,
      reason:
        'These required skills are inferred from your work but not explicitly stated — explicit mentions improve ATS parsing',
      priority: 'medium',
    });
  }

  return changes.slice(0, 5);
}

export function computeApplicationStrategy(
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
  intelligence: JobIntelligenceBreakdown,
  evaluation: OpportunityEvaluation,
): ApplicationStrategy {
  if (!profile) {
    return {
      recommendedAction: 'deprioritize',
      actionReasons: ['No candidate profile available to assess fit'],
      positioning: 'Complete your profile to get personalized strategy.',
      selectedExperiences: [],
      selectedProjects: [],
      skillsToEmphasize: [],
      achievementsToHighlight: [],
      insufficientEvidenceRequirements: intelligence.requiredSkills,
      resumeSectionChanges: [],
      screeningTopics: [],
      confidenceLevel: 'low',
      uncertaintyReasons: ['Profile not available'],
      strategyVersion: 'v1:no-profile',
    };
  }

  if (evaluation.hardConstraintBlocked) {
    const hardCheck = evaluation.constraintChecks.find(
      (c) =>
        !c.satisfied &&
        (c.kind === 'excluded_company' || c.kind === 'excluded_role'),
    );
    return {
      recommendedAction: 'deprioritize',
      actionReasons: [
        hardCheck?.detail ?? 'Hard constraint violation blocks this opportunity',
      ],
      positioning: 'This opportunity conflicts with your stated preferences.',
      selectedExperiences: [],
      selectedProjects: [],
      skillsToEmphasize: [],
      achievementsToHighlight: [],
      insufficientEvidenceRequirements: [],
      resumeSectionChanges: [],
      screeningTopics: [],
      confidenceLevel: 'high',
      uncertaintyReasons: [],
      strategyVersion: 'v1:blocked',
    };
  }

  const confirmedExps = profile.experience.filter((e) => e.source !== 'ai');
  const confirmedProjs = profile.projects.filter((p) => p.source !== 'ai');
  const confirmedSkills = profile.skills.filter((s) => s.source !== 'ai');

  const expScores = confirmedExps
    .map((e) => scoreExperience(e, intelligence.requiredSkills, intelligence.preferredSkills))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EXPERIENCES);

  const projScores = confirmedProjs
    .map((p) => scoreProject(p, intelligence.requiredSkills, intelligence.preferredSkills))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PROJECTS);

  const selectedExperiences: StrategyExperience[] = expScores.map((sel, idx) => {
    const exp = confirmedExps.find((e) => e.id === sel.id)!;
    return {
      experienceId: sel.id,
      company: exp.company,
      title: exp.title,
      priority: idx + 1,
      coveredRequirements: sel.coveredRequired,
      achievementsToHighlight: sel.relevantAchievements.slice(0, 3),
      suggestedFocusAreas: sel.coveredRequired
        .slice(0, 3)
        .map((r) => `${r} architecture and delivery`),
    };
  });

  const selectedProjects: StrategyProject[] = projScores.map((sel, idx) => {
    const proj = confirmedProjs.find((p) => p.id === sel.id)!;
    return {
      projectId: sel.id,
      name: proj.name,
      priority: idx + 1,
      coveredRequirements: sel.coveredRequired,
      whySelected: sel.whySelected,
    };
  });

  const confirmedSkillNames = new Set(confirmedSkills.map((s) => s.name.toLowerCase()));
  const skillsToEmphasize = [
    ...intelligence.requiredSkills.filter((s) => confirmedSkillNames.has(s.toLowerCase())),
    ...intelligence.preferredSkills.filter((s) => confirmedSkillNames.has(s.toLowerCase())),
  ].slice(0, 8);

  const achievementsToHighlight: string[] = [];
  for (const sel of expScores) {
    for (const ach of sel.relevantAchievements.slice(0, 2)) {
      if (!achievementsToHighlight.includes(ach)) achievementsToHighlight.push(ach);
    }
  }

  const insufficientEvidenceRequirements = evaluation.requirementEvaluations
    .filter((r) => r.kind === 'required' && r.strength === 'unsupported')
    .map((r) => r.requirement);

  const requiredEvals = evaluation.requirementEvaluations.filter((r) => r.kind === 'required');
  const totalRequired = requiredEvals.length;
  const documented = requiredEvals.filter((r) => r.strength !== 'unsupported').length;
  const unsupported = requiredEvals.filter((r) => r.strength === 'unsupported').length;
  const coverageRatio = totalRequired > 0 ? documented / totalRequired : 0;
  const unsupportedRatio = totalRequired > 0 ? unsupported / totalRequired : 0;

  let recommendedAction: StrategyAction;
  const actionReasons: string[] = [];

  if (coverageRatio >= 0.70 && unsupported === 0 && match.experienceScore >= 65) {
    recommendedAction = 'apply_now';
    actionReasons.push(
      `Strong coverage: ${Math.round(coverageRatio * 100)}% of required skills documented with no gaps`,
    );
    if (match.experienceScore >= 80)
      actionReasons.push('Experience level aligns well with role requirements');
  } else if (coverageRatio >= 0.70 && evaluation.confidenceLevel === 'low') {
    recommendedAction = 'apply_with_improvements';
    actionReasons.push(
      `Good coverage (${Math.round(coverageRatio * 100)}%) but profile needs enrichment before applying`,
    );
    actionReasons.push('Strengthening profile documentation will increase response rates');
  } else if (coverageRatio >= 0.40 && unsupportedRatio <= 0.30) {
    recommendedAction = 'apply_with_improvements';
    actionReasons.push(
      `${Math.round(coverageRatio * 100)}% required skill coverage — targeted improvements recommended`,
    );
    if (unsupported > 0) {
      actionReasons.push(
        `${unsupported} requirement(s) lack direct evidence — profile improvements may bridge the gap`,
      );
    }
  } else if (unsupportedRatio > 0.50) {
    recommendedAction = 'strengthen_first';
    actionReasons.push(
      `${unsupported} of ${totalRequired} required skills are undocumented with no direct path`,
    );
    actionReasons.push(
      'Building evidence for these requirements will make a future application significantly stronger',
    );
  } else {
    recommendedAction = 'apply_with_improvements';
    actionReasons.push(
      `Moderate coverage (${Math.round(coverageRatio * 100)}%) — documentation improvements and targeted positioning recommended`,
    );
  }

  if (confirmedExps.length === 0 && recommendedAction === 'apply_now') {
    recommendedAction = 'apply_with_improvements';
    actionReasons.push(
      'No confirmed work experience on file — strengthening profile will improve outcomes',
    );
  }

  const positioning = buildPositioning(
    profile,
    expScores,
    skillsToEmphasize,
    intelligence,
    job,
  );

  const screeningTopics = buildScreeningTopics(
    evaluation,
    match,
    intelligence,
    expScores,
    profile,
  );

  const resumeSectionChanges = buildResumeSectionChanges(
    profile,
    evaluation,
    intelligence,
    expScores,
  );

  let confidenceLevel = evaluation.confidenceLevel;
  const uncertaintyReasons = [...evaluation.uncertaintyReasons];
  if (confirmedExps.length === 0) {
    // No work experience — lower confidence by one tier
    if (confidenceLevel === 'high') confidenceLevel = 'medium';
    else confidenceLevel = 'low';
    if (!uncertaintyReasons.some((r) => r.toLowerCase().includes('experience'))) {
      uncertaintyReasons.push('No confirmed work experience on profile');
    }
  }

  const sortedSkillNames = confirmedSkills
    .map((s) => s.name)
    .sort()
    .join(',');
  const sortedReq = [...intelligence.requiredSkills].sort().join(',');
  const strategyVersion = `v1:${deterministicHash(
    ['v1-strategy', sortedSkillNames, sortedReq, job.company, job.title].join('|'),
  )}`;

  return {
    recommendedAction,
    actionReasons,
    positioning,
    selectedExperiences,
    selectedProjects,
    skillsToEmphasize,
    achievementsToHighlight,
    insufficientEvidenceRequirements,
    resumeSectionChanges,
    screeningTopics,
    confidenceLevel,
    uncertaintyReasons,
    strategyVersion,
  };
}
