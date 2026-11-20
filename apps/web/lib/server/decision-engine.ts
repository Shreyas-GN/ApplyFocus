import type {
  AtsAnalysisResult,
  ConstraintEvaluationItem,
  DecisionActionPlanItem,
  DecisionApplicationReadiness,
  DecisionEvaluation,
  DecisionEvidenceItem,
  DecisionEvidenceStrength,
  DecisionGapCategory,
  DecisionGapItem,
  DecisionPositioning,
  DecisionRecommendationTier,
  DecisionSummaryMetrics,
  JobInformationQuality,
  OpportunityPriorityTier,
  ProfileDto,
  RequirementMatchResult
} from "@/lib/types";

export interface DecisionEngineInput {
  profile: ProfileDto;
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
    location?: string | null;
    workMode?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    postedAt?: Date | string | null;
    sourcePlatform?: string | null;
  };
  requirementMatch: RequirementMatchResult;
  atsAnalysis?: AtsAnalysisResult | null;
}

// ─── Deterministic Decision Rules ─────────────────────────────────────────────

export function evaluateDecisionIntelligence(
  input: DecisionEngineInput
): DecisionEvaluation {
  const { profile, job, requirementMatch, atsAnalysis } = input;

  // 1. Evaluate Job Information Quality
  const jobQuality = evaluateJobInformationQuality(job);

  // 2. Evaluate Candidate Constraints & Preferences
  const constraints = evaluateCandidateConstraints(profile, job);
  const hardConstraintViolated = constraints.some(
    (c) => c.status === "VIOLATED"
  );

  // 3. Classify Gaps (Qualification vs Experience vs Evidence vs Communication)
  const categorizedGaps = categorizeDecisionGaps(
    requirementMatch,
    atsAnalysis,
    profile
  );

  // 4. Rank Candidate Evidence (Distinguishing professional employment from projects)
  const { strongestExperiences, bestProjects, topAchievements, skillsToEmphasize } =
    extractAndRankEvidence(profile, requirementMatch, job);

  // 5. Determine Recommendation Tier
  const { recommendationTier, recommendationReason, whyPursue, whyCaution } =
    determineRecommendationTier({
      requirementMatch,
      hardConstraintViolated,
      categorizedGaps,
      jobQuality,
      profile,
    });

  // 6. Determine Opportunity Priority Tier
  const { priorityTier, priorityReason, priorityScore } =
    determineOpportunityPriority({
      recommendationTier,
      requirementMatch,
      jobQuality,
      hardConstraintViolated,
      atsAnalysis,
    });

  // 7. Determine Application Readiness
  const { applicationReadiness, readinessReason } = determineApplicationReadiness(
    {
      recommendationTier,
      atsAnalysis,
      categorizedGaps,
      profile,
    }
  );

  // 8. Generate Action Plan
  const actionPlan = generatePersonalizedActionPlan({
    categorizedGaps,
    atsAnalysis,
    strongestExperiences,
    bestProjects,
    applicationReadiness,
    recommendationTier,
    jobId: job.id,
  });

  // 9. Generate Positioning Intelligence
  const positioning = generatePositioningIntelligence({
    profile,
    job,
    strongestExperiences,
    bestProjects,
    categorizedGaps,
    requirementMatch,
  });

  // 10. Summary Metrics
  const summaryMetrics: DecisionSummaryMetrics = {
    mandatoryCoveragePercent: requirementMatch.mustHaveCoverage,
    preferredCoveragePercent: requirementMatch.preferredCoverage,
    overallMatchScore: requirementMatch.overallScore,
    atsReadinessScore: atsAnalysis ? atsAnalysis.overallReadiness : null,
    evidenceStrengthScore: calculateEvidenceStrengthScore(profile, requirementMatch),
    priorityScore,
  };

  const nextAction = determineNextAction({
    applicationReadiness,
    actionPlan,
    recommendationTier,
  });

  return {
    recommendationTier,
    recommendationReason,
    priorityTier,
    priorityReason,
    applicationReadiness,
    readinessReason,
    whyPursue,
    whyCaution,
    positioning,
    actionPlan,
    strongestExperiences,
    bestProjects,
    topAchievements,
    skillsToEmphasize,
    categorizedGaps,
    constraintsEvaluation: constraints,
    jobInformationQuality: jobQuality,
    summaryMetrics,
    nextAction,
  };
}

// ─── Sub-Engines & Evaluation Logic ──────────────────────────────────────────

function evaluateJobInformationQuality(job: {
  title: string;
  description: string;
  location?: string | null;
  workMode?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  postedAt?: Date | string | null;
}): JobInformationQuality {
  const desc = (job.description ?? "").trim();
  const words = desc.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let completeness = 100;
  const missingEmployerDetails: string[] = [];
  const ambiguousRequirements: string[] = [];

  if (wordCount < 60) {
    completeness -= 40;
    missingEmployerDetails.push("Extremely short job description with minimal role detail.");
  } else if (wordCount < 150) {
    completeness -= 20;
    missingEmployerDetails.push("Brief description omitting detailed day-to-day responsibilities.");
  }

  const hasSalarySpecified = Boolean(
    (job.salaryMin && job.salaryMin > 0) ||
    (job.salaryMax && job.salaryMax > 0) ||
    /\$\d{2,3}(?:,\d{3})*(?:k)?/i.test(desc)
  );

  if (!hasSalarySpecified) {
    completeness -= 10;
    missingEmployerDetails.push("Compensation / salary range not disclosed.");
  }

  const hasClearSeniority =
    /\b(Junior|Associate|Mid|Senior|Staff|Principal|Lead|Director|VP|Manager)\b/i.test(
      job.title
    ) ||
    /\b\d+\+?\s+years?\b/i.test(desc);

  if (!hasClearSeniority) {
    completeness -= 10;
    missingEmployerDetails.push("Seniority level or expected years of experience not explicitly defined.");
  }

  // Check for ambiguous or buzzword requirements
  if (/\brockstar\b|\bguru\b|\bninja\b/i.test(desc)) {
    ambiguousRequirements.push("Subjective terminology ('rockstar'/'ninja') used instead of concrete technical deliverables.");
  }
  if (/\bwear many hats\b|\bfast-paced environment\b/i.test(desc)) {
    ambiguousRequirements.push("Broad scope indicators ('wear many hats') without clear boundary definition.");
  }

  // Freshness calculation
  let isFresh = true;
  let freshnessLabel = "Recently Posted";
  if (job.postedAt) {
    const postDate = new Date(job.postedAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 45) {
      isFresh = false;
      freshnessLabel = `Posted ${diffDays} days ago (Old posting)`;
    } else if (diffDays > 21) {
      isFresh = true;
      freshnessLabel = `Posted ${diffDays} days ago`;
    } else if (diffDays > 0) {
      freshnessLabel = `Posted ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    } else {
      freshnessLabel = "Posted today";
    }
  }

  return {
    descriptionCompletenessScore: Math.max(0, Math.min(100, completeness)),
    hasSalarySpecified,
    hasClearSeniority,
    isFresh,
    freshnessLabel,
    ambiguousRequirements,
    missingEmployerDetails,
  };
}

function evaluateCandidateConstraints(
  profile: ProfileDto,
  job: {
    location?: string | null;
    workMode?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
  }
): ConstraintEvaluationItem[] {
  const items: ConstraintEvaluationItem[] = [];

  // 1. Work Mode / Remote Preference
  const prefWorkMode = profile.workMode?.toLowerCase();
  const jobWorkMode = job.workMode?.toLowerCase();

  if (prefWorkMode) {
    if (jobWorkMode) {
      if (
        prefWorkMode === "remote" &&
        jobWorkMode !== "remote" &&
        jobWorkMode !== "hybrid_flexible"
      ) {
        items.push({
          name: "Work Location / Remote Mode",
          status: "VIOLATED",
          detail: `You prefer remote work, but this job requires ${jobWorkMode.replace("_", " ")}.`,
          candidatePreference: "Remote",
          jobOffering: jobWorkMode,
        });
      } else {
        items.push({
          name: "Work Location / Remote Mode",
          status: "SATISFIED",
          detail: `Opportunity work mode (${jobWorkMode}) aligns with your ${prefWorkMode} preference.`,
          candidatePreference: prefWorkMode,
          jobOffering: jobWorkMode,
        });
      }
    } else {
      items.push({
        name: "Work Location / Remote Mode",
        status: "UNKNOWN",
        detail: `You prefer ${prefWorkMode}, but the employer has not specified work mode.`,
        candidatePreference: prefWorkMode,
        jobOffering: null,
      });
    }
  }

  // 2. Compensation / Minimum Salary
  const expectedMin = profile.expectedSalaryMin;
  const jobMax = job.salaryMax;

  if (expectedMin && expectedMin > 0) {
    if (jobMax && jobMax > 0) {
      if (jobMax < expectedMin) {
        items.push({
          name: "Compensation Expectations",
          status: "VIOLATED",
          detail: `The maximum salary offered ($${jobMax.toLocaleString()}) is below your minimum expectation ($${expectedMin.toLocaleString()}).`,
          candidatePreference: `$${expectedMin.toLocaleString()}+`,
          jobOffering: `Up to $${jobMax.toLocaleString()}`,
        });
      } else {
        items.push({
          name: "Compensation Expectations",
          status: "SATISFIED",
          detail: `The salary range accommodates your target compensation expectation ($${expectedMin.toLocaleString()}).`,
          candidatePreference: `$${expectedMin.toLocaleString()}+`,
          jobOffering: job.salaryMin
            ? `$${job.salaryMin.toLocaleString()} - $${jobMax.toLocaleString()}`
            : `Up to $${jobMax.toLocaleString()}`,
        });
      }
    } else {
      items.push({
        name: "Compensation Expectations",
        status: "UNKNOWN",
        detail: `You specified a minimum salary of $${expectedMin.toLocaleString()}, but this posting does not disclose pay.`,
        candidatePreference: `$${expectedMin.toLocaleString()}+`,
        jobOffering: null,
      });
    }
  }

  // 3. Location constraints
  const prefLocations = profile.preferredLocations ?? [];
  if (prefLocations.length > 0 && job.location && jobWorkMode !== "remote") {
    const jobLoc = job.location.toLowerCase();
    const matchesLoc = prefLocations.some((loc) =>
      jobLoc.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLoc)
    );
    if (!matchesLoc) {
      items.push({
        name: "Geographic Location",
        status: "VIOLATED",
        detail: `Job location (${job.location}) does not match your preferred locations (${prefLocations.join(", ")}).`,
        candidatePreference: prefLocations.join(", "),
        jobOffering: job.location,
      });
    } else {
      items.push({
        name: "Geographic Location",
        status: "SATISFIED",
        detail: `Job location (${job.location}) matches your preferred location.`,
        candidatePreference: prefLocations.join(", "),
        jobOffering: job.location,
      });
    }
  }

  return items;
}

function categorizeDecisionGaps(
  match: RequirementMatchResult,
  ats: AtsAnalysisResult | null | undefined,
  profile: ProfileDto
): DecisionGapItem[] {
  const items: DecisionGapItem[] = [];
  const candidateSkills = new Set(
    profile.skills.map((s) => s.name.toLowerCase().trim())
  );

  const matchItems = match.matches ?? [];
  for (const item of matchItems) {
    if (item.status === "DIRECT_MATCH") continue;

    const reqName = item.requirement.name;
    const isHard = Boolean(item.requirement.isHardConstraint);
    const hasCandidateEvidence =
      candidateSkills.has(item.requirement.normalizedSkill.toLowerCase()) ||
      candidateSkills.has(reqName.toLowerCase());

    // Check ATS alignment status if available
    const atsAlignment = ats?.alignmentItems.find(
      (a) => a.requirementId === item.requirement.id || a.requirementName === reqName
    );

    let category: DecisionGapCategory;
    let strength: DecisionEvidenceStrength = "none";
    let note: string;
    let actionGuidance: string;

    const citation = item.evidenceSentence ?? item.sourceExperience ?? item.sourceProject ?? item.transferableReason ?? "adjacent technology";
    const rationale = item.rationale ?? "";

    if (item.status === "RELATED_MATCH") {
      category = "QUALIFICATION_GAP";
      strength = "transferable";
      note = `You possess transferable capability (${citation}), but lack direct production experience in ${reqName}.`;
      actionGuidance = `Frame your foundational competence in related tools and be prepared to explain rapid adaptability to ${reqName}.`;
    } else if (item.status === "PARTIAL_MATCH") {
      if (item.requirement.category === "EXPERIENCE") {
        category = "EXPERIENCE_GAP";
        strength = "weak";
        note = `Experience duration shortfall: ${rationale}.`;
        actionGuidance = `Emphasize the velocity and architectural impact of your existing experience rather than strictly years.`;
      } else {
        category = "EVIDENCE_GAP";
        strength = "weak";
        note = `Partial proof found: ${rationale}.`;
        actionGuidance = `Provide verifiable project or professional evidence (achievement or responsibility bullet) detailing your exact contribution.`;
      }
    } else {
      // MISSING
      if (
        atsAlignment?.status === "EVIDENCE_EXISTS_TERMINOLOGY_MISSING" ||
        (hasCandidateEvidence && atsAlignment?.status === "DEMONSTRATED_BUT_POORLY_COMMUNICATED")
      ) {
        category = "RESUME_COMMUNICATION_GAP";
        strength = "direct";
        note = `You have demonstrated evidence in your candidate profile, but your resume omitted or buried '${reqName}'.`;
        actionGuidance = `Incorporate '${reqName}' directly into your resume experience bullets where demonstrated.`;
      } else if (hasCandidateEvidence) {
        category = "EVIDENCE_GAP";
        strength = "weak";
        note = `You listed '${reqName}' in your skills profile, but no documented experience or project bullet supports it.`;
        actionGuidance = `Add a specific achievement or responsibility bullet demonstrating where you applied '${reqName}'.`;
      } else {
        category = "QUALIFICATION_GAP";
        strength = "none";
        note = `No verified evidence of '${reqName}' found in your background.`;
        actionGuidance = isHard
          ? `This is a mandatory requirement. If you possess unrecorded experience, add it to your profile; otherwise evaluate if applying is worth the qualification risk.`
          : `This is a preferred requirement. Highlight your adjacent technical strengths during application.`;
      }
    }

    items.push({
      requirement: reqName,
      category,
      evidenceStrength: strength,
      isHardConstraint: isHard,
      note,
      actionGuidance,
    });
  }

  return items;
}

function extractAndRankEvidence(
  profile: ProfileDto,
  match: RequirementMatchResult,
  job: { title: string; description: string }
) {
  const confirmedExp = profile.experience.filter((e) => e.source !== "ai");
  const confirmedProj = profile.projects.filter((p) => p.source !== "ai");
  const matchItems = match.matches ?? [];
  const directMatches = matchItems.filter((i) => i.status === "DIRECT_MATCH");
  const matchedSkillNames = directMatches.map((i) =>
    i.requirement.normalizedSkill.toLowerCase()
  );

  // Score experiences
  const rankedExperiences: DecisionEvidenceItem[] = confirmedExp
    .map((exp) => {
      let score = 0;
      const reasons: string[] = [];
      const expTech = (exp.technologies ?? []).map((t) => t.toLowerCase());
      const hits = expTech.filter((t) => matchedSkillNames.includes(t));

      if (hits.length > 0) {
        score += hits.length * 15;
        reasons.push(`Directly proves ${hits.slice(0, 3).join(", ")}`);
      }

      if (job.title && exp.title.toLowerCase().includes(job.title.toLowerCase())) {
        score += 5;
        reasons.push("Direct title alignment with target role");
      }

      if (exp.isCurrent) {
        score += 10;
        reasons.push("Current role");
      }

      const metrics = (exp.achievements ?? []).filter((a) =>
        /\d+%|\$\d+|\d+\s*(?:ms|sec|users|events)/i.test(a)
      );
      if (metrics.length > 0) {
        score += 8;
        reasons.push(`Contains ${metrics.length} quantified metric${metrics.length === 1 ? "" : "s"}`);
      }

      return {
        id: exp.id,
        type: "experience" as const,
        name: `${exp.title} at ${exp.company}`,
        relevanceReason:
          reasons.length > 0
            ? reasons.join(". ")
            : "Demonstrates core professional software engineering responsibility.",
        metricsCited: metrics.slice(0, 2),
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ id, type, name, relevanceReason, metricsCited }) => ({
      id,
      type,
      name,
      relevanceReason,
      metricsCited,
    }));

  // Score projects (Strictly separated from professional employment)
  const rankedProjects: DecisionEvidenceItem[] = confirmedProj
    .map((proj) => {
      let score = 0;
      const reasons: string[] = [];
      const projTech = (proj.technologies ?? []).map((t) => t.toLowerCase());
      const hits = projTech.filter((t) => matchedSkillNames.includes(t));

      if (hits.length > 0) {
        score += hits.length * 12;
        reasons.push(`Built using ${hits.slice(0, 3).join(", ")}`);
      }

      const outcomes = (proj.measurableOutcomes ?? []).concat(
        proj.contributions ?? []
      );
      const metrics = outcomes.filter((o) =>
        /\d+%|\$\d+|\d+\s*(?:ms|sec|users|events)/i.test(o)
      );
      if (metrics.length > 0) {
        score += 6;
      }

      return {
        id: proj.id,
        type: "project" as const,
        name: proj.name,
        relevanceReason:
          reasons.length > 0
            ? reasons.join(". ")
            : "Practical implementation project demonstrating code architecture.",
        metricsCited: metrics.slice(0, 2),
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ id, type, name, relevanceReason, metricsCited }) => ({
      id,
      type,
      name,
      relevanceReason,
      metricsCited,
    }));

  // Top achievements from confirmed experiences
  const topAchievements: string[] = [];
  for (const exp of confirmedExp) {
    for (const ach of exp.achievements ?? []) {
      if (topAchievements.length < 3 && ach.trim().length > 15) {
        topAchievements.push(`${ach} (${exp.company})`);
      }
    }
  }

  // Skills to emphasize
  const skillsToEmphasize = directMatches
    .filter((m) => m.requirement.importance === "MUST_HAVE")
    .map((m) => m.requirement.name)
    .slice(0, 6);

  return {
    strongestExperiences: rankedExperiences,
    bestProjects: rankedProjects,
    topAchievements,
    skillsToEmphasize,
  };
}

function determineRecommendationTier(params: {
  requirementMatch: RequirementMatchResult;
  hardConstraintViolated: boolean;
  categorizedGaps: DecisionGapItem[];
  jobQuality: JobInformationQuality;
  profile: ProfileDto;
}): {
  recommendationTier: DecisionRecommendationTier;
  recommendationReason: string;
  whyPursue: string[];
  whyCaution: string[];
} {
  const { requirementMatch, hardConstraintViolated, categorizedGaps, jobQuality, profile } =
    params;
  const whyPursue: string[] = [];
  const whyCaution: string[] = [];

  const mandatoryCoverage = requirementMatch.mustHaveCoverage;
  const matchScore = requirementMatch.overallScore;
  const criticalMandatoryGaps = categorizedGaps.filter(
    (g) => g.isHardConstraint && g.category === "QUALIFICATION_GAP"
  );
  const communicationGaps = categorizedGaps.filter(
    (g) => g.category === "RESUME_COMMUNICATION_GAP"
  );

  // Check for insufficient information
  const totalProfileItems =
    profile.experience.length + profile.skills.length + profile.projects.length;
  if (totalProfileItems === 0 || jobQuality.descriptionCompletenessScore < 20) {
    return {
      recommendationTier: "INSUFFICIENT_INFORMATION",
      recommendationReason:
        totalProfileItems === 0
          ? "Your candidate profile contains no verified skills or experience. Populate your profile to receive an evidence-backed application recommendation."
          : "The employer job posting lacks sufficient detail to determine technical alignment.",
      whyPursue: [],
      whyCaution: ["Insufficient data to form a confident evaluation."],
    };
  }

  // Check for Hard Constraint Violation or Major Disqualification
  if (hardConstraintViolated) {
    whyCaution.push("This opportunity conflicts with an explicitly recorded candidate constraint (e.g. location or compensation).");
  }
  if (criticalMandatoryGaps.length >= 1) {
    whyCaution.push(`Missing mandatory qualification${criticalMandatoryGaps.length === 1 ? "" : "s"}: ${criticalMandatoryGaps.map((g) => g.requirement).join(", ")}.`);
  }

  if (hardConstraintViolated || criticalMandatoryGaps.length >= 2 || mandatoryCoverage < 40) {
    return {
      recommendationTier: "LOW_PRIORITY",
      recommendationReason: hardConstraintViolated
        ? "Conflicts with your explicitly recorded constraints, making this opportunity low priority."
        : `Significant mandatory requirements are unsupported (${mandatoryCoverage}% mandatory fit). Applying carries a high probability of automated screening rejection.`,
      whyPursue,
      whyCaution,
    };
  }

  // Strong Opportunity Criteria
  if (
    mandatoryCoverage >= 80 &&
    matchScore >= 70 &&
    criticalMandatoryGaps.length === 0 &&
    !hardConstraintViolated
  ) {
    whyPursue.push(`Exceptional mandatory requirement alignment (${mandatoryCoverage}% coverage).`);
    whyPursue.push("Verified professional or project evidence supports the core technical stack.");
    if (communicationGaps.length > 0) {
      whyCaution.push(`Resume communication could be improved: ${communicationGaps.length} demonstrated skill${communicationGaps.length === 1 ? "" : "s"} not clearly articulated in resume text.`);
    }

    return {
      recommendationTier: "STRONG_OPPORTUNITY",
      recommendationReason:
        "Strong opportunity — You possess verified, credible evidence for the core requirements with zero critical qualification blockers. Prioritize this application.",
      whyPursue,
      whyCaution,
    };
  }

  // Worth Pursuing Criteria
  if (
    (mandatoryCoverage >= 60 || matchScore >= 55) &&
    criticalMandatoryGaps.length <= 1
  ) {
    whyPursue.push(`Solid qualification baseline (${mandatoryCoverage}% mandatory coverage).`);
    whyPursue.push("Demonstrated capability across several core requirements.");
    if (criticalMandatoryGaps.length === 1 && criticalMandatoryGaps[0]) {
      whyCaution.push(`One mandatory qualification gap: ${criticalMandatoryGaps[0].requirement}.`);
    }
    if (communicationGaps.length > 0) {
      whyCaution.push(`Resume presentation needs adjustment to communicate ${communicationGaps.map((g) => g.requirement).join(", ")}.`);
    }

    return {
      recommendationTier: "WORTH_PURSUING",
      recommendationReason:
        "Worth pursuing — You demonstrate a competitive qualification fit, though addressing manageable resume communication gaps or framing transferable strengths is recommended.",
      whyPursue,
      whyCaution,
    };
  }

  // Selective Application Criteria
  whyPursue.push("You possess relevant transferable skills and some technical overlap.");
  whyCaution.push(`Meaningful mandatory qualification gap (${mandatoryCoverage}% mandatory fit).`);
  whyCaution.push("Experience duration or primary technology stack shows limited direct evidence.");

  return {
    recommendationTier: "SELECTIVE_APPLICATION",
    recommendationReason:
      "Selective application — You possess partial technical overlap or transferable strengths, but have noticeable experience limitations or mandatory gaps. Apply selectively if you can articulate strong adjacent capability.",
    whyPursue,
    whyCaution,
  };
}

function determineOpportunityPriority(params: {
  recommendationTier: DecisionRecommendationTier;
  requirementMatch: RequirementMatchResult;
  jobQuality: JobInformationQuality;
  hardConstraintViolated: boolean;
  atsAnalysis?: AtsAnalysisResult | null;
}): {
  priorityTier: OpportunityPriorityTier;
  priorityReason: string;
  priorityScore: number;
} {
  const { recommendationTier, requirementMatch, jobQuality, hardConstraintViolated, atsAnalysis } =
    params;

  let score = 0;

  // Tier base points
  if (recommendationTier === "STRONG_OPPORTUNITY") score += 50;
  else if (recommendationTier === "WORTH_PURSUING") score += 35;
  else if (recommendationTier === "SELECTIVE_APPLICATION") score += 20;
  else if (recommendationTier === "LOW_PRIORITY") score += 5;
  else score += 10; // INSUFFICIENT_INFORMATION

  // Match score component (up to 30 pts)
  score += Math.round((requirementMatch.overallScore / 100) * 30);

  // Freshness & quality bonus (up to 10 pts)
  if (jobQuality.isFresh) score += 5;
  if (jobQuality.descriptionCompletenessScore >= 70) score += 5;

  // Resume readiness adjustment (up to 10 pts)
  if (atsAnalysis) {
    if (atsAnalysis.overallReadiness >= 75) score += 10;
    else if (atsAnalysis.overallReadiness >= 50) score += 5;
  } else {
    score += 5; // Neutral when no resume selected
  }

  // Hard constraints penalty
  if (hardConstraintViolated) {
    score = Math.min(score, 25);
  }

  const priorityScore = Math.max(0, Math.min(100, score));

  if (recommendationTier === "INSUFFICIENT_INFORMATION") {
    return {
      priorityTier: "NEEDS_REVIEW",
      priorityReason: "Requires additional candidate evidence or job clarification before prioritization.",
      priorityScore,
    };
  }

  if (priorityScore >= 75) {
    return {
      priorityTier: "HIGH_PRIORITY",
      priorityReason: "High priority opportunity with strong technical fit and actionable evidence.",
      priorityScore,
    };
  }

  if (priorityScore >= 50) {
    return {
      priorityTier: "MEDIUM_PRIORITY",
      priorityReason: "Viable opportunity deserving preparation and resume alignment.",
      priorityScore,
    };
  }

  return {
    priorityTier: "LOW_PRIORITY",
    priorityReason: "Lower priority due to qualification gaps, constraint mismatch, or low alignment.",
    priorityScore,
  };
}

function determineApplicationReadiness(params: {
  recommendationTier: DecisionRecommendationTier;
  atsAnalysis?: AtsAnalysisResult | null;
  categorizedGaps: DecisionGapItem[];
  profile: ProfileDto;
}): {
  applicationReadiness: DecisionApplicationReadiness;
  readinessReason: string;
} {
  const { recommendationTier, atsAnalysis, categorizedGaps, profile } = params;

  if (profile.skills.length === 0 && profile.experience.length === 0) {
    return {
      applicationReadiness: "NEEDS_REVIEW",
      readinessReason: "Candidate profile contains no confirmed skills or experience history.",
    };
  }

  if (recommendationTier === "LOW_PRIORITY") {
    return {
      applicationReadiness: "NOT_RECOMMENDED",
      readinessReason: "Not recommended due to fundamental qualification or candidate constraint mismatch.",
    };
  }

  if (recommendationTier === "INSUFFICIENT_INFORMATION") {
    return {
      applicationReadiness: "NEEDS_REVIEW",
      readinessReason: "Profile or job details need review before application readiness can be established.",
    };
  }

  // Evaluate ATS & Presentation Blocker
  const hasAtsBlocker = atsAnalysis && atsAnalysis.overallReadiness < 40;
  const communicationGaps = categorizedGaps.filter(
    (g) => g.category === "RESUME_COMMUNICATION_GAP"
  );

  if (hasAtsBlocker || communicationGaps.length >= 2) {
    return {
      applicationReadiness: "READY_AFTER_IMPROVEMENTS",
      readinessReason: hasAtsBlocker
        ? `Your resume has parsing or structural hazards (Readiness: ${atsAnalysis?.overallReadiness}/100). Resolve formatting and communication issues before submitting.`
        : `Your profile contains relevant evidence, but your resume lacks key terminology (${communicationGaps.map((g) => g.requirement).slice(0, 2).join(", ")}). Update your resume first.`,
    };
  }

  if (atsAnalysis && atsAnalysis.overallReadiness >= 75 && communicationGaps.length === 0) {
    return {
      applicationReadiness: "READY_TO_APPLY",
      readinessReason: "Ready to apply — Your resume accurately reflects your verified background and communicates key job terminology clearly.",
    };
  }

  return {
    applicationReadiness: "READY_AFTER_IMPROVEMENTS",
    readinessReason: "Minor resume alignment and positioning improvements recommended before submission.",
  };
}

function generatePersonalizedActionPlan(params: {
  categorizedGaps: DecisionGapItem[];
  atsAnalysis?: AtsAnalysisResult | null;
  strongestExperiences: DecisionEvidenceItem[];
  bestProjects: DecisionEvidenceItem[];
  applicationReadiness: DecisionApplicationReadiness;
  recommendationTier: DecisionRecommendationTier;
  jobId: string;
}): DecisionActionPlanItem[] {
  const {
    categorizedGaps,
    atsAnalysis,
    strongestExperiences,
    bestProjects,
    applicationReadiness,
    recommendationTier,
    jobId,
  } = params;

  const actions: DecisionActionPlanItem[] = [];

  // 0. Direct Application Action (when ready)
  if (applicationReadiness === "READY_TO_APPLY") {
    actions.push({
      id: "act-submit-direct",
      actionTitle: "Direct application ready",
      reason: "Your background and resume meet all mandatory qualifications with verified evidence.",
      supportingEvidence: "Zero critical ATS or hard constraint gaps detected.",
      priority: "HIGH",
      expectedImprovement: "Immediate submission without additional document revisions required.",
      isRequiredBeforeApplying: false,
      destinationUrl: `/applications`,
    });
  }

  // 1. Resume Terminology & Communication Actions
  const commGaps = categorizedGaps.filter(
    (g) => g.category === "RESUME_COMMUNICATION_GAP"
  );
  if (commGaps.length > 0) {
    const terms = commGaps.map((g) => g.requirement).slice(0, 3).join(", ");
    actions.push({
      id: "act-comm-gaps",
      actionTitle: `Incorporate demonstrated terminology: ${terms}`,
      reason: `Your profile contains evidence for ${terms}, but your selected resume text omits or buries these keywords.`,
      supportingEvidence: "Candidate verified intelligence confirms proficiency.",
      priority: "CRITICAL",
      expectedImprovement: "Eliminates false ATS negative screening filters for skills you actually possess.",
      isRequiredBeforeApplying: true,
      destinationUrl: `/tailor?jobId=${jobId}`,
    });
  }

  // 2. ATS Formatting & Parsing Actions
  if (atsAnalysis && atsAnalysis.findings.length > 0) {
    const criticalAts = atsAnalysis.findings.filter(
      (f) => f.severity === "CRITICAL" || f.severity === "HIGH"
    );
    const topFinding = criticalAts[0];
    if (topFinding) {
      actions.push({
        id: "act-ats-format",
        actionTitle: `Fix resume parsing hazard: ${topFinding.title}`,
        reason: topFinding.description,
        supportingEvidence: topFinding.evidence ?? "Document structure audit",
        priority: "HIGH",
        expectedImprovement: "Ensures automated applicant tracking systems parse your contact and section data accurately.",
        isRequiredBeforeApplying: topFinding.severity === "CRITICAL",
        destinationUrl: `/resumes`,
      });
    }
  }

  // 3. Project Evidence Enhancement
  const evidenceGaps = categorizedGaps.filter((g) => g.category === "EVIDENCE_GAP");
  const firstProject = bestProjects[0];
  const targetGap = evidenceGaps[0];
  if (targetGap && firstProject) {
    actions.push({
      id: "act-project-evidence",
      actionTitle: `Clarify project technical scope for ${targetGap.requirement}`,
      reason: `You listed ${targetGap.requirement} as a skill, but your resume lacks documented accomplishment metrics or implementation details.`,
      supportingEvidence: `Project ${firstProject.name} provides a relevant foundation.`,
      priority: "MEDIUM",
      expectedImprovement: "Provides concrete proof of capability to human reviewers and technical hiring managers.",
      isRequiredBeforeApplying: false,
      destinationUrl: `/profile`,
    });
  }

  // 4. Tailoring & Preparation Action
  if (recommendationTier === "STRONG_OPPORTUNITY" || recommendationTier === "WORTH_PURSUING") {
    actions.push({
      id: "act-tailor-application",
      actionTitle: "Generate tailored resume draft",
      reason: "Align section emphasis and achievement bullets with employer's stated priorities.",
      supportingEvidence: `Leverages your top experience (${strongestExperiences[0]?.name ?? "verified background"}).`,
      priority: "HIGH",
      expectedImprovement: "Directly positions your strongest verified achievements at the top of the resume.",
      isRequiredBeforeApplying: false,
      destinationUrl: `/tailor?jobId=${jobId}`,
    });
  }

  return actions;
}

function generatePositioningIntelligence(params: {
  profile: ProfileDto;
  job: { title: string; company: string };
  strongestExperiences: DecisionEvidenceItem[];
  bestProjects: DecisionEvidenceItem[];
  categorizedGaps: DecisionGapItem[];
  requirementMatch: RequirementMatchResult;
}): DecisionPositioning {
  const { profile, job, strongestExperiences, bestProjects, categorizedGaps, requirementMatch } =
    params;

  const topExp = strongestExperiences[0];
  const headlineAngle = topExp
    ? `Position yourself around your verified work at ${topExp.name}, emphasizing hands-on delivery and quantifiable architecture impact for this ${job.title} role.`
    : `Frame your background around demonstrated full-stack engineering deliverables and concrete project implementations for ${job.title}.`;

  const differentiators: string[] = [];
  if (profile.headline) {
    differentiators.push(`Verified specialization: ${profile.headline}`);
  }
  if (topExp && topExp.metricsCited.length > 0) {
    differentiators.push(`Documented quantifiable impact: ${topExp.metricsCited[0]}`);
  }
  if (bestProjects[0]) {
    differentiators.push(`Working open-source/production implementation in ${bestProjects[0].name}`);
  }
  if (requirementMatch.mustHaveCoverage >= 80) {
    differentiators.push(`Substantial core requirement coverage (${Math.round(requirementMatch.mustHaveCoverage)}% verified)`);
  }

  const positioningRisks: string[] = [];
  const claimsToAvoid: string[] = [];

  const expGaps = categorizedGaps.filter((g) => g.category === "EXPERIENCE_GAP");
  if (expGaps.length > 0) {
    positioningRisks.push(`Employer requests extensive years of experience; be prepared to demonstrate high execution velocity.`);
    claimsToAvoid.push("Do not claim personal or academic projects as years of professional employment.");
  }

  const qualGaps = categorizedGaps.filter((g) => g.category === "QUALIFICATION_GAP" && g.evidenceStrength === "none");
  if (qualGaps.length > 0) {
    claimsToAvoid.push(`Do not invent experience with ${qualGaps.slice(0, 2).map((g) => g.requirement).join(" or ")} if you have not worked with them in production.`);
  }

  return {
    headlineAngle,
    strongestEvidence: strongestExperiences.concat(bestProjects).slice(0, 4),
    differentiators,
    positioningRisks,
    claimsToAvoid,
  };
}

function calculateEvidenceStrengthScore(
  profile: ProfileDto,
  match: RequirementMatchResult
): number {
  let score = 0;
  const confirmedSkills = profile.skills.filter((s) => s.source !== "ai");
  const confirmedExp = profile.experience.filter((e) => e.source !== "ai");

  score += Math.min(40, confirmedExp.length * 15);
  score += Math.min(30, confirmedSkills.length * 3);
  score += Math.round((match.mustHaveCoverage / 100) * 30);

  return Math.max(0, Math.min(100, score));
}

function determineNextAction(params: {
  applicationReadiness: DecisionApplicationReadiness;
  actionPlan: DecisionActionPlanItem[];
  recommendationTier: DecisionRecommendationTier;
}): string {
  const { applicationReadiness, actionPlan, recommendationTier } = params;

  if (recommendationTier === "LOW_PRIORITY") {
    return "Archive or deprioritize this opportunity. Focus on positions with stronger qualification alignment.";
  }

  if (applicationReadiness === "READY_TO_APPLY") {
    return "Prepare and submit your application with your verified, ATS-ready resume.";
  }

  if (actionPlan.length > 0) {
    const requiredAction = actionPlan.find((a) => a.isRequiredBeforeApplying);
    if (requiredAction) {
      return requiredAction.actionTitle;
    }
    return actionPlan[0]?.actionTitle ?? "Review your resume draft in the Resume Tailoring Studio.";
  }

  return "Review your resume draft in the Resume Tailoring Studio.";
}
