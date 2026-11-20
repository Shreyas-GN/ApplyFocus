export interface ProfileStrengthInput {
  personal?: {
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    headline?: string | null;
    summary?: string | null;
    yearsOfExperience?: number | null;
  } | null;
  skills?: Array<{
    name: string;
    category?: string | null;
    proficiency?: string | null;
    evidence?: string | null;
    evidenceCategory?: string | null;
    evidenceSentence?: string | null;
    source?: string | null;
  }> | null;
  experience?: Array<{
    company: string;
    title: string;
    location?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    isCurrent?: boolean;
    description?: string | null;
    responsibilities?: string[];
    achievements?: string[];
    technologies?: string[];
    evidenceSentences?: string[];
    source?: string | null;
  }> | null;
  projects?: Array<{
    name: string;
    description?: string | null;
    url?: string | null;
    githubUrl?: string | null;
    liveUrl?: string | null;
    technologies?: string[];
    contributions?: string[];
    measurableOutcomes?: string[];
    skillsDemonstrated?: string[];
    source?: string | null;
  }> | null;
  education?: Array<{
    institution: string;
    degree?: string | null;
    fieldOfStudy?: string | null;
    graduationYear?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    description?: string | null;
  }> | null;
}

export type ProfileStrengthCategory =
  | "professional_summary"
  | "skills"
  | "work_experience"
  | "experience_evidence"
  | "projects"
  | "education"
  | "profile_completeness";

export interface ProfileStrengthCategoryScore {
  category: ProfileStrengthCategory;
  label: string;
  score: number;
  maxScore: number;
  percent: number;
  status: "strong" | "adequate" | "needs_attention";
}

export interface ProfileImprovementSuggestion {
  id: string;
  category: ProfileStrengthCategory;
  title: string;
  description: string;
  impactScore: number;
  priority: "high" | "medium" | "low";
}

export interface ProfileStrengthResult {
  overallScore: number;
  categoryScores: ProfileStrengthCategoryScore[];
  missingInformation: string[];
  suggestions: ProfileImprovementSuggestion[];
  disclaimer: string;
}

const QUANTIFIABLE_METRIC_REGEX =
  /\b(\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d+)?[kmb]?|\b\d+\s*(?:x|times|users|engineers|clients|teams|nodes|rps|qps|ms|seconds|minutes|hours|days|weeks|months|years))\b/i;

/**
 * Calculates a deterministic, reproducible Profile Strength score (0-100).
 * Completely offline: no LLMs, no random generators, strictly rules-based.
 */
export function calculateProfileStrength(
  input: ProfileStrengthInput
): ProfileStrengthResult {
  const personal = input.personal ?? {};
  const skillsList = input.skills ?? [];
  const experienceList = input.experience ?? [];
  const projectsList = input.projects ?? [];
  const educationList = input.education ?? [];

  const missingInformation: string[] = [];
  const suggestions: ProfileImprovementSuggestion[] = [];

  // 1. Professional Summary (Max: 15)
  let summaryScore = 0;
  const headline = personal.headline?.trim() ?? "";
  const summaryText = personal.summary?.trim() ?? "";
  const years = personal.yearsOfExperience;

  if (headline.length >= 6) {
    summaryScore += 5;
  } else {
    missingInformation.push("Missing professional headline");
    suggestions.push({
      id: "add_headline",
      category: "professional_summary",
      title: "Add a crisp professional headline",
      description: "Define your positioning title (e.g., 'Senior Full-Stack Engineer — React & Node.js').",
      impactScore: 5,
      priority: "high",
    });
  }

  if (summaryText.length >= 80) {
    summaryScore += 5;
  } else if (summaryText.length > 0) {
    summaryScore += 2;
    missingInformation.push("Professional summary is brief (<80 characters)");
    suggestions.push({
      id: "expand_summary",
      category: "professional_summary",
      title: "Expand professional summary",
      description: "Provide at least 2-3 sentences outlining your domain expertise, technical focus, and career impact.",
      impactScore: 3,
      priority: "medium",
    });
  } else {
    missingInformation.push("Missing professional summary");
    suggestions.push({
      id: "add_summary",
      category: "professional_summary",
      title: "Draft a professional summary",
      description: "Summarize your core competencies and career trajectory for recruiters and ATS parsers.",
      impactScore: 5,
      priority: "high",
    });
  }

  if (years !== null && years !== undefined && years >= 0) {
    summaryScore += 5;
  } else {
    missingInformation.push("Unspecified total years of experience");
    suggestions.push({
      id: "specify_experience_years",
      category: "professional_summary",
      title: "Specify years of experience",
      description: "Record your cumulative professional experience to anchor seniority filtering.",
      impactScore: 5,
      priority: "medium",
    });
  }

  // 2. Skills (Max: 20)
  let skillsScore = 0;
  const validSkills = skillsList.filter((s) => s.name?.trim().length > 0);
  const categorizedSkills = validSkills.filter((s) => Boolean(s.category?.trim()));
  const confirmedSkills = validSkills.filter(
    (s) => s.evidenceCategory === "USER_CONFIRMED" || s.source === "user"
  );
  const evidenceBackedSkills = validSkills.filter(
    (s) =>
      s.evidenceCategory === "AI_EXTRACTED" &&
      (Boolean(s.evidenceSentence?.trim()) || Boolean(s.evidence?.trim()))
  );

  if (validSkills.length >= 6) {
    skillsScore += 8;
  } else if (validSkills.length >= 3) {
    skillsScore += 5;
    suggestions.push({
      id: "add_more_skills",
      category: "skills",
      title: "Add 3+ more core skills",
      description: "Expanding to at least 6 technical or domain skills improves job matching breadth.",
      impactScore: 3,
      priority: "medium",
    });
  } else if (validSkills.length > 0) {
    skillsScore += 2;
    missingInformation.push("Profile has fewer than 3 skills listed");
  } else {
    missingInformation.push("No skills listed on profile");
    suggestions.push({
      id: "add_initial_skills",
      category: "skills",
      title: "Add core technical and domain skills",
      description: "List languages, frameworks, databases, and infrastructure tools you use.",
      impactScore: 8,
      priority: "high",
    });
  }

  if (categorizedSkills.length >= 3) {
    skillsScore += 4;
  } else if (validSkills.length > 0) {
    missingInformation.push("Skills lack categorization");
    suggestions.push({
      id: "categorize_skills",
      category: "skills",
      title: "Categorize your skills",
      description: "Group skills into languages, frameworks, cloud, and tools for clear recruiter scanning.",
      impactScore: 4,
      priority: "low",
    });
  }

  if (confirmedSkills.length >= 3) {
    skillsScore += 5;
  } else if (confirmedSkills.length > 0) {
    skillsScore += 3;
    suggestions.push({
      id: "confirm_skills",
      category: "skills",
      title: "Confirm extracted skills",
      description: "Review and explicitly confirm AI-extracted skills to verify your proficiency.",
      impactScore: 2,
      priority: "medium",
    });
  } else if (evidenceBackedSkills.length >= 2) {
    skillsScore += 3;
  } else {
    missingInformation.push("No confirmed or evidence-backed skills");
    suggestions.push({
      id: "verify_skills",
      category: "skills",
      title: "Confirm skills with evidence",
      description: "Confirm extracted skills backed by resume quotes or project demonstrations.",
      impactScore: 5,
      priority: "high",
    });
  }

  if (validSkills.some((s) => s.proficiency)) {
    skillsScore += 3;
  }

  // 3. Work Experience (Max: 20)
  let expScore = 0;
  if (experienceList.length >= 2) {
    expScore += 10;
  } else if (experienceList.length === 1) {
    expScore += 6;
  } else {
    missingInformation.push("No work experience recorded");
    suggestions.push({
      id: "add_work_experience",
      category: "work_experience",
      title: "Add work experience history",
      description: "Record your previous and current roles, employers, dates, and scope.",
      impactScore: 10,
      priority: "high",
    });
  }

  const hasCurrentOrRecent = experienceList.some((e) => e.isCurrent || Boolean(e.endDate));
  if (hasCurrentOrRecent) {
    expScore += 5;
  }

  const allHaveDates =
    experienceList.length > 0 &&
    experienceList.every((e) => Boolean(e.startDate));
  if (allHaveDates) {
    expScore += 5;
  } else if (experienceList.length > 0) {
    missingInformation.push("Some work experience entries lack start dates");
    suggestions.push({
      id: "add_experience_dates",
      category: "work_experience",
      title: "Complete employment dates",
      description: "Add start and end dates to ensure accurate timeline calculation.",
      impactScore: 5,
      priority: "medium",
    });
  }

  // 4. Experience Evidence & Outcomes (Max: 15)
  let evidenceScore = 0;
  let hasQuantifiedAchievement = false;
  let hasTaggedTech = false;
  let hasEvidenceQuote = false;

  for (const exp of experienceList) {
    const achievements = exp.achievements ?? [];
    const responsibilities = exp.responsibilities ?? [];
    const desc = exp.description ?? "";
    const evidenceSnippets = exp.evidenceSentences ?? [];

    const corpus = [...achievements, ...responsibilities, desc, ...evidenceSnippets].join(" ");

    if (QUANTIFIABLE_METRIC_REGEX.test(corpus)) {
      hasQuantifiedAchievement = true;
    }
    if ((exp.technologies?.length ?? 0) > 0) {
      hasTaggedTech = true;
    }
    if (evidenceSnippets.length > 0) {
      hasEvidenceQuote = true;
    }
  }

  if (hasQuantifiedAchievement) {
    evidenceScore += 8;
  } else if (experienceList.length > 0) {
    missingInformation.push("Work experience lacks quantifiable metrics or outcomes");
    suggestions.push({
      id: "add_quantified_achievements",
      category: "experience_evidence",
      title: "Quantify achievements with metrics",
      description: "Include measurable outcomes (e.g., 'reduced latency by 35%', 'scaled to 100k users').",
      impactScore: 8,
      priority: "high",
    });
  }

  if (hasTaggedTech) {
    evidenceScore += 4;
  } else if (experienceList.length > 0) {
    missingInformation.push("Technologies not tagged on work experience");
    suggestions.push({
      id: "tag_experience_technologies",
      category: "experience_evidence",
      title: "Tag technologies per role",
      description: "List the tech stack applied under each position to prove hands-on context.",
      impactScore: 4,
      priority: "medium",
    });
  }

  if (hasEvidenceQuote) {
    evidenceScore += 3;
  }

  // 5. Projects (Max: 12)
  let projectsScore = 0;
  if (projectsList.length >= 2) {
    projectsScore += 6;
  } else if (projectsList.length === 1) {
    projectsScore += 4;
  } else {
    missingInformation.push("No technical projects documented");
    suggestions.push({
      id: "add_project",
      category: "projects",
      title: "Add 1-2 technical projects",
      description: "Showcase personal, open-source, or client projects with key deliverables.",
      impactScore: 6,
      priority: "medium",
    });
  }

  const projectsWithTechOrOutcomes = projectsList.filter(
    (p) =>
      (p.technologies?.length ?? 0) > 0 ||
      (p.measurableOutcomes?.length ?? 0) > 0 ||
      (p.skillsDemonstrated?.length ?? 0) > 0
  );
  if (projectsWithTechOrOutcomes.length > 0) {
    projectsScore += 3;
  }

  const projectsWithUrl = projectsList.filter(
    (p) => Boolean(p.url?.trim()) || Boolean(p.githubUrl?.trim()) || Boolean(p.liveUrl?.trim())
  );
  if (projectsWithUrl.length > 0) {
    projectsScore += 3;
  } else if (projectsList.length > 0) {
    missingInformation.push("Projects lack GitHub or live demonstration links");
    suggestions.push({
      id: "add_project_link",
      category: "projects",
      title: "Add GitHub or live project links",
      description: "Linking repositories or running deployments proves engineering craftsmanship.",
      impactScore: 3,
      priority: "low",
    });
  }

  // 6. Education (Max: 10)
  let eduScore = 0;
  if (educationList.length > 0) {
    const hasDegree = educationList.some((e) => Boolean(e.institution?.trim()) && Boolean(e.degree?.trim()));
    if (hasDegree) {
      eduScore += 7;
    } else {
      eduScore += 4;
      missingInformation.push("Education entry missing degree or field of study");
    }

    const hasGradDate = educationList.some(
      (e) => e.graduationYear !== null && e.graduationYear !== undefined
    );
    if (hasGradDate) {
      eduScore += 3;
    } else {
      missingInformation.push("Education entry missing graduation year");
    }
  } else {
    missingInformation.push("No education background provided");
    suggestions.push({
      id: "add_education",
      category: "education",
      title: "Add education credentials",
      description: "Record degree, institution, and field of study.",
      impactScore: 7,
      priority: "medium",
    });
  }

  // 7. Profile Completeness & Identity (Max: 8)
  let completenessScore = 0;
  if (personal.location?.trim()) {
    completenessScore += 3;
  } else {
    missingInformation.push("Missing target or resident location");
    suggestions.push({
      id: "add_location",
      category: "profile_completeness",
      title: "Add city and country location",
      description: "Recruiters and ATS boards filter by geographical region and time zones.",
      impactScore: 3,
      priority: "high",
    });
  }

  if (personal.linkedinUrl?.trim() || personal.githubUrl?.trim() || personal.portfolioUrl?.trim()) {
    completenessScore += 3;
  } else {
    missingInformation.push("Missing professional profile links (LinkedIn, GitHub, or Portfolio)");
    suggestions.push({
      id: "add_profile_links",
      category: "profile_completeness",
      title: "Link LinkedIn or GitHub profile",
      description: "Verified profile links strengthen authenticity and autofill applications.",
      impactScore: 3,
      priority: "medium",
    });
  }

  if (personal.phone?.trim() || personal.email?.trim()) {
    completenessScore += 2;
  }

  const categoryScores: ProfileStrengthCategoryScore[] = [
    {
      category: "professional_summary",
      label: "Professional Summary",
      score: summaryScore,
      maxScore: 15,
      percent: Math.round((summaryScore / 15) * 100),
      status: summaryScore >= 12 ? "strong" : summaryScore >= 7 ? "adequate" : "needs_attention",
    },
    {
      category: "skills",
      label: "Skills & Provenance",
      score: skillsScore,
      maxScore: 20,
      percent: Math.round((skillsScore / 20) * 100),
      status: skillsScore >= 16 ? "strong" : skillsScore >= 10 ? "adequate" : "needs_attention",
    },
    {
      category: "work_experience",
      label: "Work Experience",
      score: expScore,
      maxScore: 20,
      percent: Math.round((expScore / 20) * 100),
      status: expScore >= 16 ? "strong" : expScore >= 10 ? "adequate" : "needs_attention",
    },
    {
      category: "experience_evidence",
      label: "Experience Evidence",
      score: evidenceScore,
      maxScore: 15,
      percent: Math.round((evidenceScore / 15) * 100),
      status: evidenceScore >= 11 ? "strong" : evidenceScore >= 6 ? "adequate" : "needs_attention",
    },
    {
      category: "projects",
      label: "Technical Projects",
      score: projectsScore,
      maxScore: 12,
      percent: Math.round((projectsScore / 12) * 100),
      status: projectsScore >= 9 ? "strong" : projectsScore >= 5 ? "adequate" : "needs_attention",
    },
    {
      category: "education",
      label: "Education",
      score: eduScore,
      maxScore: 10,
      percent: Math.round((eduScore / 10) * 100),
      status: eduScore >= 8 ? "strong" : eduScore >= 4 ? "adequate" : "needs_attention",
    },
    {
      category: "profile_completeness",
      label: "Identity & Reachability",
      score: completenessScore,
      maxScore: 8,
      percent: Math.round((completenessScore / 8) * 100),
      status: completenessScore >= 6 ? "strong" : completenessScore >= 3 ? "adequate" : "needs_attention",
    },
  ];

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      summaryScore +
        skillsScore +
        expScore +
        evidenceScore +
        projectsScore +
        eduScore +
        completenessScore
    )
  );

  return {
    overallScore,
    categoryScores,
    missingInformation,
    suggestions: suggestions.sort((a, b) => b.impactScore - a.impactScore),
    disclaimer:
      "Profile strength evaluates the completeness, specificity, and evidence depth of your profile to improve tailoring and ATS matching. A high score does not guarantee employment or interview offers.",
  };
}

