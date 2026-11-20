import type {
  CandidateGapAnalysis,
  CandidateGapClassification,
  JobRequirement,
  ProfileDto,
  RequirementMatch,
  RequirementMatchResult,
  RequirementMatchStatus,
  ScoringBreakdown,
  SkillEvidenceCategory,
} from '@/lib/types';
import { findTransferableMatches } from '@/lib/transferable-skills';

// --- Single Requirement Matching ---

export function matchRequirementAgainstCandidate(
  requirement: JobRequirement,
  profile: ProfileDto | null
): RequirementMatch {
  if (!profile) {
    return {
      requirement,
      status: 'MISSING',
      candidateSkill: null,
      sourceExperience: null,
      sourceProject: null,
      evidenceSentence: null,
      evidenceCategory: null,
      transferableReason: null,
      rationale: 'No candidate profile found to match against.',
      confidence: 0,
    };
  }

  const reqNameLower = requirement.name.toLowerCase();
  const reqSkillLower = requirement.normalizedSkill.toLowerCase();
  const candidateSkills = profile.skills ?? [];
  const candidateExperiences = profile.experience ?? [];
  const candidateProjects = profile.projects ?? [];

  // Helper: check if text matches the requirement skill or name
  const textMatches = (text: string): boolean => {
    const lower = text.toLowerCase();
    if (lower === reqSkillLower || lower === reqNameLower) return true;
    const escaped = reqSkillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(lower);
  };

  // 1. Direct Skill Match in Candidate Profile
  const matchedSkill = candidateSkills.find(
    (s) => textMatches(s.name) || (s.category && textMatches(s.category))
  );

  if (matchedSkill) {
    const evidenceCategory: SkillEvidenceCategory =
      matchedSkill.evidenceCategory ??
      (matchedSkill.source === 'ai' ? 'AI_EXTRACTED' : 'USER_CONFIRMED');

    // Rule: AI suggestions must never automatically become verified candidate experience
    if (evidenceCategory === 'AI_SUGGESTED') {
      return {
        requirement,
        status: 'UNVERIFIED',
        candidateSkill: matchedSkill.name,
        sourceExperience: matchedSkill.connectedExperience ?? null,
        sourceProject: matchedSkill.connectedProject ?? null,
        evidenceSentence: matchedSkill.evidenceSentence ?? null,
        evidenceCategory: 'AI_SUGGESTED',
        transferableReason: null,
        rationale: `Skill "${matchedSkill.name}" is present in profile as an unconfirmed AI suggestion and lacks verifiable resume proof.`,
        confidence: 0.35,
      };
    }

    // Check years of experience requirement for technical skills
    if (
      requirement.minYears &&
      matchedSkill.yearsOfExperience !== null &&
      matchedSkill.yearsOfExperience !== undefined &&
      matchedSkill.yearsOfExperience < requirement.minYears
    ) {
      return {
        requirement,
        status: 'PARTIAL_MATCH',
        candidateSkill: matchedSkill.name,
        sourceExperience: matchedSkill.connectedExperience ?? null,
        sourceProject: matchedSkill.connectedProject ?? null,
        evidenceSentence: matchedSkill.evidenceSentence ?? null,
        evidenceCategory,
        transferableReason: null,
        rationale: `Demonstrated ${matchedSkill.name} with ${matchedSkill.yearsOfExperience} years recorded experience, falling short of employer's ${requirement.minYears}+ years requirement.`,
        confidence: 0.7,
      };
    }

    const citation = matchedSkill.connectedExperience
      ? ` at ${matchedSkill.connectedExperience}`
      : matchedSkill.connectedProject
        ? ` in project "${matchedSkill.connectedProject}"`
        : '';

    const hasCitation = Boolean(matchedSkill.connectedExperience || matchedSkill.connectedProject || matchedSkill.evidenceSentence);

    return {
      requirement,
      status: 'DIRECT_MATCH',
      candidateSkill: matchedSkill.name,
      sourceExperience: matchedSkill.connectedExperience ?? null,
      sourceProject: matchedSkill.connectedProject ?? null,
      evidenceSentence: matchedSkill.evidenceSentence ?? null,
      evidenceCategory,
      transferableReason: null,
      rationale: hasCitation
        ? `Direct match: Demonstrated ${matchedSkill.name}${citation}${
            matchedSkill.evidenceSentence ? ` ("${matchedSkill.evidenceSentence}")` : '.'
          }`
        : `Direct match: Confirmed ${matchedSkill.name} in profile without attached resume quotation.`,
      confidence: hasCitation ? 0.95 : 0.8,
    };
  }

  // 2. Scan Work Experiences for Direct Evidence
  for (const exp of candidateExperiences) {
    const hasTech = (exp.technologies ?? []).some(textMatches);
    const hasResp = (exp.responsibilities ?? []).some(textMatches);
    const hasAchieve = (exp.achievements ?? []).some(textMatches);
    const hasEvidence = (exp.evidenceSentences ?? []).some(textMatches);

    if (hasTech || hasResp || hasAchieve || hasEvidence) {
      const quote =
        (exp.evidenceSentences ?? []).find(textMatches) ??
        (exp.achievements ?? []).find(textMatches) ??
        (exp.responsibilities ?? []).find(textMatches) ??
        `Applied in role as ${exp.title} at ${exp.company}.`;

      return {
        requirement,
        status: 'DIRECT_MATCH',
        candidateSkill: requirement.normalizedSkill,
        sourceExperience: exp.company,
        sourceProject: null,
        evidenceSentence: quote,
        evidenceCategory: exp.source === 'ai' ? 'AI_EXTRACTED' : 'USER_CONFIRMED',
        transferableReason: null,
        rationale: `Direct match: Applied ${requirement.normalizedSkill} during employment as ${exp.title} at ${exp.company}.`,
        confidence: 0.9,
      };
    }
  }

  // 3. Scan Projects for Direct Demonstration (Technical / Architecture)
  // Rule: Personal projects demonstrate technical skills, but are never represented as professional employment.
  for (const proj of candidateProjects) {
    const hasTech = (proj.technologies ?? []).some(textMatches);
    const hasOutcomes = (proj.measurableOutcomes ?? []).some(textMatches);
    const hasSkills = (proj.skillsDemonstrated ?? []).some(textMatches);

    if (hasTech || hasOutcomes || hasSkills) {
      const quote =
        (proj.measurableOutcomes ?? []).find(textMatches) ??
        (proj.measurableOutcomes ?? [])[0] ??
        proj.description ??
        `Built in project "${proj.name}".`;

      return {
        requirement,
        status: 'DIRECT_MATCH',
        candidateSkill: requirement.normalizedSkill,
        sourceExperience: null,
        sourceProject: proj.name,
        evidenceSentence: quote,
        evidenceCategory: proj.source === 'ai' ? 'AI_EXTRACTED' : 'USER_CONFIRMED',
        transferableReason: null,
        rationale: `Direct match: Demonstrated ${requirement.normalizedSkill} in project "${proj.name}". (Project Demonstration)`,
        confidence: 0.85,
      };
    }
  }

  // 4. Experience Category Alignment
  // Rule: Project experience must NOT be represented as professional employment.
  if (requirement.category === 'EXPERIENCE') {
    const candYears = profile.yearsOfExperience;
    const targetYears = requirement.minYears ?? 3;
    const hasProjects = candidateProjects.length > 0;

    if (candYears !== null && candYears !== undefined && candYears > 0) {
      if (candYears >= targetYears) {
        return {
          requirement,
          status: 'DIRECT_MATCH',
          candidateSkill: `${candYears} Years Professional Experience`,
          sourceExperience: candidateExperiences[0]?.company ?? null,
          sourceProject: null,
          evidenceSentence: `${candYears} years of verified professional employment experience.`,
          evidenceCategory: 'USER_CONFIRMED',
          transferableReason: null,
          rationale: `Direct match: Candidate possesses ${candYears} years of professional employment experience, meeting the ${targetYears} years expectation.`,
          confidence: 0.95,
        };
      }
      if (candYears >= Math.max(1, targetYears - 2)) {
        return {
          requirement,
          status: 'PARTIAL_MATCH',
          candidateSkill: `${candYears} Years Professional Experience`,
          sourceExperience: candidateExperiences[0]?.company ?? null,
          sourceProject: null,
          evidenceSentence: `${candYears} years professional employment vs ${targetYears} years requested.`,
          evidenceCategory: 'USER_CONFIRMED',
          transferableReason: null,
          rationale: `Partial match: Candidate has ${candYears} years of professional experience, slightly below the ${targetYears} years requested.`,
          confidence: 0.65,
        };
      }
    }

    // Candidate has 0 professional employment years but has personal projects
    if (hasProjects) {
      return {
        requirement,
        status: 'PARTIAL_MATCH',
        candidateSkill: 'Personal Project Experience',
        sourceExperience: null,
        sourceProject: candidateProjects[0]?.name ?? null,
        evidenceSentence: `Demonstrated technical capability across ${candidateProjects.length} personal projects, but lacks professional employment tenure.`,
        evidenceCategory: 'USER_CONFIRMED',
        transferableReason: 'Hands-on practical projects demonstrate system design and execution.',
        rationale: `Partial match: Candidate has demonstrable personal project experience (${candidateProjects[0]?.name}), but does not meet the ${targetYears} years professional employment requirement.`,
        confidence: 0.5,
      };
    }

    return {
      requirement,
      status: 'MISSING',
      candidateSkill: null,
      sourceExperience: null,
      sourceProject: null,
      evidenceSentence: null,
      evidenceCategory: null,
      transferableReason: null,
      rationale: `Missing: Employer requires ${targetYears}+ years of professional employment experience; candidate records ${candYears ?? 0} years.`,
      confidence: 0,
    };
  }

  // 5. Education Category Alignment
  if (requirement.category === 'EDUCATION') {
    const edus = profile.education ?? [];
    const csDegree = edus.find(
      (e) =>
        e.fieldOfStudy &&
        /\b(computer science|software|engineering|information technology|data science)\b/i.test(
          e.fieldOfStudy
        )
    );
    if (csDegree) {
      return {
        requirement,
        status: 'DIRECT_MATCH',
        candidateSkill: `${csDegree.degree ?? 'Degree'} in ${csDegree.fieldOfStudy}`,
        sourceExperience: csDegree.institution,
        sourceProject: null,
        evidenceSentence: `${csDegree.degree ?? 'Degree'} from ${csDegree.institution}`,
        evidenceCategory: csDegree.source === 'ai' ? 'AI_EXTRACTED' : 'USER_CONFIRMED',
        transferableReason: null,
        rationale: `Direct match: ${csDegree.degree ?? 'Degree'} in ${csDegree.fieldOfStudy} from ${csDegree.institution}.`,
        confidence: 0.95,
      };
    }
    if (edus.length > 0 && edus[0]) {
      const first = edus[0];
      return {
        requirement,
        status: 'RELATED_MATCH',
        candidateSkill: `${first.degree ?? 'Degree'} in ${first.fieldOfStudy ?? 'Related Field'}`,
        sourceExperience: first.institution,
        sourceProject: null,
        evidenceSentence: `${first.degree ?? 'Degree'} from ${first.institution}`,
        evidenceCategory: first.source === 'ai' ? 'AI_EXTRACTED' : 'USER_CONFIRMED',
        transferableReason: 'Higher education credentials in a technical or quantitative discipline.',
        rationale: `Related match: Holds ${first.degree ?? 'Degree'} from ${first.institution}.`,
        confidence: 0.75,
      };
    }
  }

  // 6. Additional / Soft Skills Category Alignment
  if (requirement.category === 'ADDITIONAL') {
    const isLeadership = /\b(leadership|mentor|lead|manage)\b/i.test(requirement.name);
    const softMatches = candidateExperiences.filter((e) =>
      (e.responsibilities ?? []).some((r) =>
        isLeadership
          ? /\b(lead|mentor|manage|guided|architected)\b/i.test(r)
          : /\b(collaborat|partnered|communicat|cross-functional)\b/i.test(r)
      )
    );
    if (softMatches.length > 0 && softMatches[0]) {
      const exp = softMatches[0];
      const quote =
        (exp.responsibilities ?? []).find((r) =>
          isLeadership ? /\b(lead|mentor)\b/i.test(r) : /\b(collaborat|partnered)\b/i.test(r)
        ) ?? `Demonstrated at ${exp.company}.`;

      return {
        requirement,
        status: 'DIRECT_MATCH',
        candidateSkill: requirement.name,
        sourceExperience: exp.company,
        sourceProject: null,
        evidenceSentence: quote,
        evidenceCategory: 'USER_CONFIRMED',
        transferableReason: null,
        rationale: `Direct match: Demonstrated ${requirement.name.toLowerCase()} at ${exp.company}.`,
        confidence: 0.85,
      };
    }

    return {
      requirement,
      status: 'UNVERIFIED',
      candidateSkill: null,
      sourceExperience: null,
      sourceProject: null,
      evidenceSentence: null,
      evidenceCategory: null,
      transferableReason: null,
      rationale: `Unverified: General competency "${requirement.name}" is not explicitly documented in experience achievements.`,
      confidence: 0.4,
    };
  }

  // 7. Transferable Skills Intelligence Match
  // Rule: Do not award full direct-match credit for weakly related skills.
  const confirmedSkillNames = candidateSkills
    .filter((s) => s.evidenceCategory !== 'AI_SUGGESTED')
    .map((s) => s.name);

  const transferableMatches = findTransferableMatches(confirmedSkillNames, [
    requirement.normalizedSkill,
    requirement.name,
  ]);

  if (transferableMatches.length > 0 && transferableMatches[0]) {
    const t = transferableMatches[0];
    return {
      requirement,
      status: 'RELATED_MATCH',
      candidateSkill: t.candidateSkill,
      sourceExperience: null,
      sourceProject: null,
      evidenceSentence: `Candidate demonstrated ${t.candidateSkill}, which bridges to ${t.targetSkill}.`,
      evidenceCategory: 'USER_CONFIRMED',
      transferableReason: t.reason,
      rationale: `Related match: Background in ${t.candidateSkill} transfers to ${t.targetSkill} (${t.reason}).`,
      confidence: 0.75,
    };
  }

  // 8. Missing Requirement
  return {
    requirement,
    status: 'MISSING',
    candidateSkill: null,
    sourceExperience: null,
    sourceProject: null,
    evidenceSentence: null,
    evidenceCategory: null,
    transferableReason: null,
    rationale: `Missing: No direct or transferable evidence found in profile for ${requirement.name}.`,
    confidence: 0,
  };
}

// --- Deterministic Match Scoring & Explainable Gap Analysis ---

export function calculateRequirementMatchResult(
  requirements: JobRequirement[],
  profile: ProfileDto | null
): RequirementMatchResult {
  if (requirements.length === 0) {
    return {
      overallScore: 0,
      mustHaveCoverage: 0,
      preferredCoverage: 0,
      experienceAlignment: 0,
      technicalAlignment: 0,
      evidenceStrength: 0,
      transferableContribution: 0,
      hardConstraintCoverage: 0,
      matches: [],
      strongestMatches: [],
      partialMatches: [],
      missingRequirements: [],
      unverifiedRequirements: [],
      gaps: [],
      criticalGapsCount: 0,
      scoringBreakdown: {
        positiveFactors: [],
        negativeFactors: ['No job requirements extracted.'],
        scoreCapApplied: false,
        scoreCapReason: null,
        evidenceQualityScore: 0,
      },
    };
  }

  const matches = requirements.map((req) =>
    matchRequirementAgainstCandidate(req, profile)
  );

  const mustHaves = matches.filter((m) => m.requirement.importance === 'MUST_HAVE');
  const preferreds = matches.filter(
    (m) =>
      m.requirement.importance === 'PREFERRED' ||
      m.requirement.importance === 'OPTIONAL'
  );
  const hardConstraints = matches.filter(
    (m) => m.requirement.isHardConstraint || (m.requirement.importance === 'MUST_HAVE' && m.requirement.category !== 'ADDITIONAL')
  );

  // Status weight helper
  const scoreStatus = (status: RequirementMatchStatus, isMustHave: boolean): number => {
    switch (status) {
      case 'DIRECT_MATCH':
        return 1.0;
      case 'RELATED_MATCH':
        return isMustHave ? 0.65 : 0.7;
      case 'PARTIAL_MATCH':
        return 0.35;
      case 'UNVERIFIED':
        return 0.2;
      case 'MISSING':
      default:
        return 0.0;
    }
  };

  // Must-Have Coverage (0 - 100%)
  let mustHaveScore = 100;
  if (mustHaves.length > 0) {
    const earned = mustHaves.reduce((acc, m) => acc + scoreStatus(m.status, true), 0);
    mustHaveScore = Math.round((earned / mustHaves.length) * 100);
  }

  // Preferred Coverage (0 - 100%)
  let preferredScore = 100;
  if (preferreds.length > 0) {
    const earned = preferreds.reduce((acc, m) => acc + scoreStatus(m.status, false), 0);
    preferredScore = Math.round((earned / preferreds.length) * 100);
  }

  // Hard Constraint Coverage (0 - 100%)
  let hardConstraintScore = 100;
  if (hardConstraints.length > 0) {
    const earned = hardConstraints.reduce((acc, m) => acc + (m.status === 'DIRECT_MATCH' ? 1.0 : m.status === 'RELATED_MATCH' ? 0.65 : m.status === 'PARTIAL_MATCH' ? 0.35 : 0), 0);
    hardConstraintScore = Math.round((earned / hardConstraints.length) * 100);
  }

  // Technical Requirements Alignment
  const techMatches = matches.filter((m) => m.requirement.category === 'TECHNICAL');
  let technicalAlignment = 100;
  if (techMatches.length > 0) {
    const earned = techMatches.reduce((acc, m) => acc + scoreStatus(m.status, false), 0);
    technicalAlignment = Math.round((earned / techMatches.length) * 100);
  }

  // Experience Alignment
  const expMatches = matches.filter((m) => m.requirement.category === 'EXPERIENCE');
  let experienceAlignment = 75;
  if (expMatches.length > 0) {
    const earned = expMatches.reduce((acc, m) => acc + scoreStatus(m.status, true), 0);
    experienceAlignment = Math.round((earned / expMatches.length) * 100);
  } else if (profile?.yearsOfExperience) {
    experienceAlignment = Math.min(100, 70 + profile.yearsOfExperience * 5);
  }

  // Evidence Strength (proportion of non-missing matches backed by citations or confirmation)
  const nonMissing = matches.filter((m) => m.status !== 'MISSING');
  let evidenceStrength = 0;
  if (nonMissing.length > 0) {
    const verified = nonMissing.filter(
      (m) =>
        m.status === 'DIRECT_MATCH' &&
        Boolean(m.sourceExperience || m.sourceProject) &&
        Boolean(m.evidenceSentence && m.evidenceSentence.length > 10)
    ).length;
    evidenceStrength = Math.round((verified / nonMissing.length) * 100);
  }

  // Transferable Contribution
  const relatedMatchesCount = matches.filter((m) => m.status === 'RELATED_MATCH').length;
  const transferableContribution = Math.min(
    100,
    Math.round((relatedMatchesCount / Math.max(1, matches.length)) * 100)
  );

  // Raw weighted score calculation:
  // Must-Have: 55%, Preferred: 25%, Experience: 15%, Evidence Strength: 5% (adjusted if no preferreds exist)
  let rawScore = 0;
  if (mustHaves.length > 0 && preferreds.length > 0) {
    rawScore = Math.round(
      mustHaveScore * 0.55 +
        preferredScore * 0.25 +
        experienceAlignment * 0.15 +
        evidenceStrength * 0.05
    );
  } else if (mustHaves.length > 0) {
    rawScore = Math.round(
      mustHaveScore * 0.80 +
        experienceAlignment * 0.15 +
        evidenceStrength * 0.05
    );
  } else if (preferreds.length > 0) {
    rawScore = Math.round(
      preferredScore * 0.80 +
        experienceAlignment * 0.15 +
        evidenceStrength * 0.05
    );
  } else {
    rawScore = Math.round(experienceAlignment * 0.80 + evidenceStrength * 0.20);
  }

  // Explainable Scoring Breakdown
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];

  for (const m of matches) {
    if (m.status === 'DIRECT_MATCH') {
      positiveFactors.push(`Direct proof for ${m.requirement.name}${m.sourceExperience ? ` (${m.sourceExperience})` : m.sourceProject ? ` (${m.sourceProject})` : ''}`);
    } else if (m.status === 'RELATED_MATCH') {
      positiveFactors.push(`Transferable competency: ${m.candidateSkill} satisfies ${m.requirement.normalizedSkill}`);
    } else if (m.status === 'MISSING' && m.requirement.importance === 'MUST_HAVE') {
      negativeFactors.push(`Missing mandatory requirement: ${m.requirement.name}`);
    } else if (m.status === 'PARTIAL_MATCH') {
      negativeFactors.push(`Partial alignment: ${m.requirement.name} (experience or scope shortfall)`);
    } else if (m.status === 'UNVERIFIED') {
      negativeFactors.push(`Unverified proof: ${m.requirement.name} (lacks resume documentation)`);
    }
  }

  // Mandatory Requirement Capping Rule:
  // Missing genuine hard constraints strictly gates the score.
  let scoreCapApplied = false;
  let scoreCapReason: string | null = null;

  const missingHardConstraints = hardConstraints.filter((m) => m.status === 'MISSING');
  if (mustHaves.length > 0 && mustHaveScore === 0) {
    rawScore = Math.min(rawScore, 20);
    scoreCapApplied = true;
    scoreCapReason = 'Score capped at 20 because candidate meets 0% of mandatory requirements.';
  } else if (missingHardConstraints.length >= 2) {
    rawScore = Math.min(rawScore, 45);
    scoreCapApplied = true;
    scoreCapReason = `Score capped at 45 because multiple mandatory requirements are missing (${missingHardConstraints.map((m) => m.requirement.name).slice(0, 2).join(', ')}).`;
  } else if (missingHardConstraints.length === 1) {
    rawScore = Math.min(rawScore, 65);
    scoreCapApplied = true;
    scoreCapReason = `Score capped at 65 because mandatory requirement "${missingHardConstraints[0]?.requirement.name}" is missing.`;
  } else if (mustHaveScore < 50) {
    rawScore = Math.min(rawScore, 49);
    scoreCapApplied = true;
    scoreCapReason = `Score capped at 49 due to low mandatory requirement coverage (${mustHaveScore}%).`;
  } else if (mustHaveScore < 75) {
    rawScore = Math.min(rawScore, 69);
    scoreCapApplied = true;
    scoreCapReason = `Score capped at 69 due to partial mandatory coverage (${mustHaveScore}%).`;
  }

  const overallScore = Math.max(0, Math.min(100, rawScore));

  // Segmentation
  const strongestMatches = matches.filter(
    (m) =>
      m.status === 'DIRECT_MATCH' &&
      (m.evidenceCategory === 'USER_CONFIRMED' || Boolean(m.evidenceSentence))
  );
  const partialMatches = matches.filter(
    (m) => m.status === 'PARTIAL_MATCH' || m.status === 'RELATED_MATCH'
  );
  const missingRequirements = matches.filter((m) => m.status === 'MISSING');
  const unverifiedRequirements = matches.filter((m) => m.status === 'UNVERIFIED');

  // Candidate Gap Analysis
  const gaps: CandidateGapAnalysis[] = [];

  for (const match of matches) {
    if (match.status === 'DIRECT_MATCH') continue;

    let classification: CandidateGapClassification = 'SKILL_GAP';
    let gapType: 'QUALIFICATION_GAP' | 'EVIDENCE_GAP' = 'QUALIFICATION_GAP';

    if (match.status === 'MISSING' && match.requirement.importance === 'MUST_HAVE') {
      classification = 'CRITICAL_GAP';
      gapType = 'QUALIFICATION_GAP';
    } else if (match.status === 'PARTIAL_MATCH' || match.requirement.category === 'EXPERIENCE') {
      classification = 'EXPERIENCE_GAP';
      gapType = 'QUALIFICATION_GAP';
    } else if (match.status === 'UNVERIFIED') {
      classification = 'EVIDENCE_GAP';
      gapType = 'EVIDENCE_GAP';
    } else if (match.requirement.importance === 'OPTIONAL') {
      classification = 'MINOR_GAP';
      gapType = 'QUALIFICATION_GAP';
    } else {
      classification = 'SKILL_GAP';
      gapType = 'QUALIFICATION_GAP';
    }

    const employerExpectation = `${match.requirement.name} (${match.requirement.importance.replace('_', ' ')}) — "${match.requirement.evidenceSentence}"`;
    let candidateDemonstration = 'No evidence found in profile.';
    let missingEvidence = `Specific documentation of ${match.requirement.normalizedSkill} experience or projects.`;
    let actionableImprovement = `If you have worked with ${match.requirement.normalizedSkill}, add a bullet point under relevant work experience highlighting deliverables and metrics. If not, learn the fundamentals and build a demonstrable project before claiming experience.`;

    if (match.status === 'PARTIAL_MATCH' || classification === 'EXPERIENCE_GAP') {
      candidateDemonstration = match.rationale;
      missingEvidence = `Required years of professional employment or scope in ${match.requirement.normalizedSkill}.`;
      actionableImprovement = `Be transparent about your background and scope of ownership. If you have personal project experience, highlight architectural ownership and code quality without misrepresenting personal projects as professional employment.`;
    } else if (match.status === 'RELATED_MATCH' && match.candidateSkill) {
      candidateDemonstration = `Candidate demonstrated ${match.candidateSkill} (${match.transferableReason ?? 'related ecosystem'}).`;
      missingEvidence = `Direct production experience in ${match.requirement.normalizedSkill}.`;
      actionableImprovement = `Position your verified expertise in ${match.candidateSkill} as a strong foundation that enables immediate ramp-up in ${match.requirement.normalizedSkill}.`;
    } else if (match.status === 'UNVERIFIED') {
      candidateDemonstration = `Skill listed in profile, but lacking verified resume citation or project proof.`;
      missingEvidence = `Verifiable sentence connecting ${match.requirement.normalizedSkill} to a specific company, outcome, or project.`;
      actionableImprovement = `This appears to be an evidence gap. Attach this skill to an existing employment achievement or project to convert it into a verified match.`;
    }

    gaps.push({
      requirementId: match.requirement.id,
      requirementName: match.requirement.name,
      classification,
      gapType,
      employerExpectation,
      candidateDemonstration,
      missingEvidence,
      transferableSkillContext: match.transferableReason ?? null,
      actionableImprovement,
    });
  }

  const criticalGapsCount = gaps.filter(
    (g) => g.classification === 'CRITICAL_GAP'
  ).length;

  return {
    overallScore,
    mustHaveCoverage: mustHaveScore,
    preferredCoverage: preferredScore,
    experienceAlignment,
    technicalAlignment,
    evidenceStrength,
    transferableContribution,
    hardConstraintCoverage: hardConstraintScore,
    matches,
    strongestMatches,
    partialMatches,
    missingRequirements,
    unverifiedRequirements,
    gaps,
    criticalGapsCount,
    scoringBreakdown: {
      positiveFactors: positiveFactors.slice(0, 6),
      negativeFactors: negativeFactors.slice(0, 6),
      scoreCapApplied,
      scoreCapReason,
      evidenceQualityScore: evidenceStrength,
    },
  };
}
