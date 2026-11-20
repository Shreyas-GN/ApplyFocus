import type { TransferableSkillMatch } from "@/lib/types";

export interface TransferableTaxonomyRule {
  from: string[];
  to: string[];
  category: string;
  relationship: string;
  reason: string;
  confidence: number;
}

export interface TransferableSkillOpportunity {
  sourceSkill: string;
  transferableSkill: string;
  category: string;
  relationship: string;
  evidence: string;
  confidence: number;
  isAlreadyAcquired: boolean;
}

export interface CandidateTransferableAnalysis {
  totalAcquired: number;
  opportunities: TransferableSkillOpportunity[];
  highConfidenceBridges: TransferableSkillOpportunity[];
}

export const TRANSFERABLE_TAXONOMY: TransferableTaxonomyRule[] = [
  {
    from: ["JavaScript", "JS"],
    to: ["TypeScript", "Frontend Engineering", "Node.js", "Web Fundamentals"],
    category: "Languages & Core Runtimes",
    relationship: "Language Evolution",
    reason: "JavaScript core language proficiency, ECMAScript mechanics, and asynchronous event-loop mastery transfer directly to TypeScript and typed JavaScript backend runtimes.",
    confidence: 0.95,
  },
  {
    from: ["TypeScript", "TS"],
    to: ["JavaScript", "Node.js", "Type Systems", "Clean Architecture"],
    category: "Languages & Core Runtimes",
    relationship: "Superset Fluency",
    reason: "Deep TypeScript fluency encompasses JavaScript runtime semantics while ensuring strict interface contracts and maintainable system boundaries.",
    confidence: 0.98,
  },
  {
    from: ["React", "React.js", "ReactJS"],
    to: [
      "Next.js",
      "Component-Based Frontend",
      "State Management",
      "TypeScript",
      "Web Performance",
    ],
    category: "Frontend Architecture",
    relationship: "Framework to Ecosystem",
    reason: "Declarative component lifecycle, virtual DOM reconciliation, and unidirectional state patterns map directly to modern SSR frameworks like Next.js and generalized component architectures.",
    confidence: 0.94,
  },
  {
    from: ["Next.js", "NextJS"],
    to: ["React", "Full-Stack Web Development", "SSR/SSG Architecture", "Vercel / Edge Deployment"],
    category: "Frontend Architecture",
    relationship: "Full-Stack Meta-Framework",
    reason: "Next.js integrates client-side rendering with server components and edge execution, demonstrating end-to-end fullstack web mastery.",
    confidence: 0.96,
  },
  {
    from: ["SQL", "PostgreSQL", "Postgres", "MySQL"],
    to: [
      "Relational Database Fundamentals",
      "Data Modeling",
      "Query Optimization",
      "Prisma",
      "Drizzle",
      "Drizzle ORM",
      "Database Migrations",
    ],
    category: "Databases & Storage",
    relationship: "Foundational Persistence",
    reason: "Understanding schema normalization, relational indexing, transaction semantics, and ACID guarantees transfers across relational databases and modern ORM abstractions.",
    confidence: 0.95,
  },
  {
    from: ["Prisma", "TypeORM", "Sequelize", "Hibernate", "SQLAlchemy", "ORM"],
    to: ["Drizzle", "Drizzle ORM", "Database Querying", "Schema Modeling"],
    category: "Databases & Storage",
    relationship: "ORM Abstraction Transfer",
    reason: "Experience with ORM query composition, schema relations, and database migrations translates rapidly to modern TypeScript ORMs like Drizzle.",
    confidence: 0.93,
  },
  {
    from: ["REST", "REST APIs", "RESTful API Development", "API Design"],
    to: [
      "Backend Engineering",
      "HTTP Fundamentals",
      "API Architecture",
      "Microservices",
      "GraphQL",
    ],
    category: "API & Backend Architecture",
    relationship: "Architectural Pattern",
    reason: "RESTful resource modeling, HTTP status semantics, stateless auth, and idempotent verbs establish core architectural competencies for distributed web services.",
    confidence: 0.92,
  },
  {
    from: ["Python", "FastAPI", "Django", "Flask"],
    to: [
      "Backend Services",
      "Data Pipelines",
      "API Development",
      "Applied Machine Learning",
      "PyTorch",
    ],
    category: "Languages & Data",
    relationship: "Multi-Paradigm Ecosystem",
    reason: "Python async web frameworks bridge cleanly to distributed microservices, computational data pipelines, and AI/ML model integration.",
    confidence: 0.9,
  },
  {
    from: ["Docker", "Containers"],
    to: [
      "Kubernetes",
      "DevOps & CI/CD",
      "Container Security",
      "Cloud Infrastructure",
      "Linux Systems",
    ],
    category: "Cloud & DevOps",
    relationship: "Infrastructure Abstraction",
    reason: "Containerization fundamentals, multi-stage image builds, and container network isolation carry directly into orchestration engines and CI/CD pipelines.",
    confidence: 0.92,
  },
  {
    from: ["AWS", "GCP", "Azure", "Cloud Infrastructure"],
    to: [
      "Cloud Architecture",
      "Terraform",
      "Infrastructure as Code",
      "High Availability & Resiliency",
    ],
    category: "Cloud & DevOps",
    relationship: "Cloud Provider Symmetry",
    reason: "Core cloud concepts (IAM, object storage, virtual networking, serverless compute) transfer with high fidelity across public cloud providers and IaC tooling.",
    confidence: 0.88,
  },
  {
    from: ["Vitest", "Jest", "Playwright", "Cypress", "Automated Testing"],
    to: [
      "Quality Engineering",
      "Test-Driven Development (TDD)",
      "CI/CD Pipeline Verification",
      "E2E Testing",
    ],
    category: "Testing & Quality",
    relationship: "Methodology Transfer",
    reason: "Unit and end-to-end assertion methodologies, mocking strategies, and regression test suites apply across all test automation frameworks and deployment gates.",
    confidence: 0.93,
  },
  {
    from: ["Git", "GitHub", "GitLab"],
    to: ["Version Control Best Practices", "Code Review Workflows", "Release Management", "Trunk-Based Development"],
    category: "Developer Tooling",
    relationship: "Standard Engineering Practice",
    reason: "Branching strategies, merge conflict resolution, and pull-request collaboration are universally transferable across engineering teams.",
    confidence: 0.97,
  },
  {
    from: ["Tailwind", "Tailwind CSS", "CSS", "Sass"],
    to: ["Design Systems", "Responsive UI Design", "Frontend Styling", "Accessibility (a11y)"],
    category: "Frontend Architecture",
    relationship: "Styling & UI Mechanics",
    reason: "Box model mastery, utility-first ergonomics, media query responsiveness, and CSS token systems transfer directly to design system engineering.",
    confidence: 0.91,
  },
  {
    from: ["PyTorch", "TensorFlow", "Scikit-Learn", "Machine Learning"],
    to: ["Applied AI", "Deep Learning", "Model Evaluation & Metrics", "Data Preprocessing"],
    category: "Data & AI",
    relationship: "Applied ML Fundamentals",
    reason: "Tensor operations, loss gradient optimization, cross-validation, and dataset vectorization form the core foundation across machine learning ecosystems.",
    confidence: 0.92,
  },
];

/**
 * Deterministically identify transferable skill opportunities for a candidate.
 * Never automatically confirms or adds them to the candidate's profile;
 * surfaces opportunities with clear provenance and confidence level.
 */
export function identifyCandidateTransferableSkills(
  candidateSkills: Array<{
    name: string;
    evidenceCategory?: string | null;
    evidenceSentence?: string | null;
    source?: string | null;
  }>
): CandidateTransferableAnalysis {
  const normalizedCandidateSkills = new Map<string, string>();
  for (const skill of candidateSkills) {
    if (!skill.name) continue;
    normalizedCandidateSkills.set(skill.name.trim().toLowerCase(), skill.name.trim());
  }

  const opportunities: TransferableSkillOpportunity[] = [];
  const seenTargets = new Set<string>();

  for (const rule of TRANSFERABLE_TAXONOMY) {
    const matchedSource = rule.from.find((fromSkill) =>
      normalizedCandidateSkills.has(fromSkill.toLowerCase())
    );

    if (!matchedSource) continue;
    const originalCandidateSkill =
      normalizedCandidateSkills.get(matchedSource.toLowerCase()) ?? matchedSource;

    for (const target of rule.to) {
      const targetLower = target.toLowerCase();
      const isAlreadyAcquired = normalizedCandidateSkills.has(targetLower);

      if (seenTargets.has(targetLower)) continue;
      seenTargets.add(targetLower);

      opportunities.push({
        sourceSkill: originalCandidateSkill,
        transferableSkill: target,
        category: rule.category,
        relationship: rule.relationship,
        evidence: rule.reason,
        confidence: rule.confidence,
        isAlreadyAcquired,
      });
    }
  }

  const highConfidenceBridges = opportunities.filter(
    (opp) => !opp.isAlreadyAcquired && opp.confidence >= 0.9
  );

  return {
    totalAcquired: normalizedCandidateSkills.size,
    opportunities,
    highConfidenceBridges,
  };
}

/**
 * Match a candidate's skills against job requirements using direct and transferable intelligence.
 */
export function findTransferableMatches(
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

    for (const rule of TRANSFERABLE_TAXONOMY) {
      const hasTarget = rule.to.some((t) => {
        const tLower = t.toLowerCase();
        return (
          tLower === targetLower ||
          targetLower.includes(tLower) ||
          tLower.includes(targetLower)
        );
      });
      if (!hasTarget) continue;

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

