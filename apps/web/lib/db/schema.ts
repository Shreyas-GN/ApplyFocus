import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Enums
export const resumeProcessingStatusEnum = pgEnum('resume_processing_status', [
  'uploaded',
  'extracting',
  'parsing',
  'parsed',
  'failed',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending_review',
  'confirmed',
  'rejected',
]);

export const itemSourceEnum = pgEnum('item_source', ['user', 'ai']);

export const applicationStatusEnum = pgEnum('application_status', [
  'saved',
  'applied',
  'under_review',
  'assessment',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
]);

export const jobStateEnum = pgEnum('job_state', ['saved', 'dismissed']);

export const strategyStatusEnum = pgEnum('strategy_status', [
  'ready',
  'approved',
  'failed',
]);

// 1. Profiles
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    fullName: text('full_name'),
    phone: text('phone'),
    location: text('location'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    portfolioUrl: text('portfolio_url'),
    headline: text('headline'),
    summary: text('summary'),
    yearsOfExperience: integer('years_of_experience'),
    employmentStatus: text('employment_status'),
    preferredTitles: text('preferred_titles')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    preferredLocations: text('preferred_locations')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    workMode: text('work_mode'),
    employmentTypes: text('employment_types')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    expectedSalaryMin: integer('expected_salary_min'),
    expectedSalaryMax: integer('expected_salary_max'),
    preferredIndustries: text('preferred_industries')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    excludedCompanies: text('excluded_companies')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    contactEmail: text('contact_email'),
    careerStage: text('career_stage'),
    preferredExperienceLevel: text('preferred_experience_level'),
    desiredRoles: text('desired_roles')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    adjacentRoles: text('adjacent_roles')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    excludedRoles: text('excluded_roles')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    intelligenceMetadata: jsonb('intelligence_metadata'),
    notificationPreferences: jsonb('notification_preferences'),
    // Sign-in email, mirrored from the users table whenever the profile is
    // loaded so token-authenticated clients (browser extension) can read it.
    authEmail: text('auth_email'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
).enableRLS();

// 2. Work Experiences
export const workExperiences = pgTable(
  'work_experiences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    isCurrent: boolean('is_current').default(false).notNull(),
    description: text('description'),
    responsibilities: text('responsibilities')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    achievements: text('achievements')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    technologies: text('technologies')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    evidenceSentences: text('evidence_sentences')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('work_experiences_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 3. Education Entries
export const educationEntries = pgTable(
  'education_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    institution: text('institution').notNull(),
    degree: text('degree'),
    fieldOfStudy: text('field_of_study'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    graduationYear: integer('graduation_year'),
    grade: text('grade'),
    description: text('description'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('education_entries_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 4. Skills
export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    category: text('category'),
    proficiency: text('proficiency'),
    yearsOfExperience: numeric('years_of_experience', { precision: 4, scale: 1 }),
    evidence: text('evidence'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    evidenceCategory: text('evidence_category').default('USER_CONFIRMED').notNull(),
    evidenceSentence: text('evidence_sentence'),
    connectedExperience: text('connected_experience'),
    connectedProject: text('connected_project'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('skills_user_id_idx').on(table.userId),
    uniqueIndex('skills_user_id_lower_name_idx').on(
      table.userId,
      sql`lower(${table.name})`
    ),
    index('skills_evidence_category_idx').on(table.evidenceCategory),
  ]
).enableRLS();

// 5. Projects
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    role: text('role'),
    technologies: text('technologies')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    contributions: text('contributions')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    measurableOutcomes: text('measurable_outcomes')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    skillsDemonstrated: text('skills_demonstrated')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    url: text('url'),
    githubUrl: text('github_url'),
    liveUrl: text('live_url'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('projects_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 6. Certifications
export const certifications = pgTable(
  'certifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    issuer: text('issuer'),
    issueDate: timestamp('issue_date', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    credentialUrl: text('credential_url'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('certifications_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 7. Resumes
export const resumes = pgTable(
  'resumes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    versionLabel: text('version_label').notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    storageKey: text('storage_key').notNull(),
    checksum: text('checksum'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    processingStatus: resumeProcessingStatusEnum('processing_status')
      .default('uploaded')
      .notNull(),
    parseAttempts: integer('parse_attempts').default(0).notNull(),
    extractedText: text('extracted_text'),
    processingError: text('processing_error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('resumes_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 8. Resume Parsed Data
export const resumeParsedData = pgTable(
  'resume_parsed_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resumeId: uuid('resume_id')
      .notNull()
      .unique()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    structuredData: jsonb('structured_data').notNull(),
    overallConfidence: numeric('overall_confidence', { precision: 4, scale: 3 }),
    reviewStatus: reviewStatusEnum('review_status')
      .default('pending_review')
      .notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('resume_parsed_data_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 9. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id'),
    action: text('action').notNull(),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('audit_logs_user_id_created_at_idx').on(table.userId, table.createdAt),
  ]
).enableRLS();

// 10. Jobs (Public ATS & ingested listings)
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: text('source').notNull(), // 'greenhouse' | 'lever' | 'ashby' | 'jsearch' | 'google_jobs' | 'adzuna' | 'manual'
    sourcePlatform: text('source_platform'), // 'Naukri.com' | 'Indeed' | 'LinkedIn' | 'Glassdoor' | 'Greenhouse' | 'Lever' | 'Ashby'
    externalId: text('external_id').notNull(),
    company: text('company').notNull(),
    companyLogo: text('company_logo'),
    title: text('title').notNull(),
    location: text('location'),
    workMode: text('work_mode'), // 'remote' | 'hybrid' | 'onsite'
    employmentType: text('employment_type'),
    url: text('url').notNull(),
    directApplyUrl: text('direct_apply_url'),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    salaryCurrency: text('salary_currency'),
    description: text('description').notNull(),
    skills: text('skills')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    fingerprint: text('fingerprint'),
    status: text('status').default('active').notNull(),
    roleTrack: text('role_track'),
    lastLivenessCheck: timestamp('last_liveness_check', { withTimezone: true }),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('jobs_source_external_id_idx').on(
      table.source,
      table.externalId
    ),
    uniqueIndex('jobs_fingerprint_idx').on(table.fingerprint),
    index('jobs_status_idx').on(table.status),
    index('jobs_role_track_idx').on(table.roleTrack),
    index('jobs_company_idx').on(table.company),
    index('jobs_source_platform_idx').on(table.sourcePlatform),
  ]
).enableRLS();

// 11. Applications (User's tracked jobs)
export const applications = pgTable(
  'applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location'),
    url: text('url'),
    status: applicationStatusEnum('status').default('saved').notNull(),
    matchScore: integer('match_score'),
    notes: text('notes'),
    followUpAt: timestamp('follow_up_at', { withTimezone: true }),
    checklist: jsonb('checklist'),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('applications_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 12. Application Events (Timeline log)
export const applicationEvents = pgTable(
  'application_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    type: text('type').notNull(), // 'created' | 'status_change' | 'note'
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('application_events_app_id_idx').on(table.applicationId),
  ]
).enableRLS();

// 13. Tailored Documents (AI tailored resumes & cover letters)
export const tailoredDocuments = pgTable(
  'tailored_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    applicationId: uuid('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    company: text('company').notNull(),
    jobTitle: text('job_title').notNull(),
    type: text('type').notNull(), // 'resume' | 'cover_letter'
    tone: text('tone'), // 'formal' | 'conversational' | 'concise'
    content: jsonb('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('tailored_documents_user_id_idx').on(table.userId),
    index('tailored_documents_user_job_idx').on(table.userId, table.jobId),
  ]
).enableRLS();

// 14. Extension Sessions (Paired browser extension tokens)
export const extensionSessions = pgTable(
  'extension_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    label: text('label').default('Chrome Extension').notNull(),
    tokenHash: text('token_hash').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('extension_sessions_user_id_idx').on(table.userId),
    uniqueIndex('extension_sessions_token_hash_idx').on(table.tokenHash),
  ]
).enableRLS();

// 15b. Application Strategies (per user+job, persisted strategy analysis)
export const applicationStrategies = pgTable(
  'application_strategies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    status: strategyStatusEnum('status').default('ready').notNull(),
    content: jsonb('content').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('application_strategies_user_job_idx').on(table.userId, table.jobId),
    index('application_strategies_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 15. Job States (Saved bookmarks & dismissed jobs per user)
export const jobStates = pgTable(
  'job_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    state: jobStateEnum('state').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('job_states_user_job_idx').on(table.userId, table.jobId),
    index('job_states_user_state_idx').on(table.userId, table.state),
  ]
).enableRLS();

// 16. Screening Answers (Persisted AI-generated screening answers)
export const screeningAnswers = pgTable(
  'screening_answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    applicationId: uuid('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    groundedFacts: text('grounded_facts')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    source: text('source').notNull().default('claude'),
    approved: boolean('approved').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('screening_answers_user_id_idx').on(table.userId),
    index('screening_answers_user_job_idx').on(table.userId, table.jobId),
  ]
).enableRLS();

// 16b. Job Requirements (Cached extracted structured job requirements)
export const jobRequirements = pgTable(
  'job_requirements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    descriptionHash: text('description_hash').notNull(),
    requirements: jsonb('requirements').notNull(),
    source: text('source').default('ai').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('job_requirements_job_id_idx').on(table.jobId),
  ]
).enableRLS();

// 16c. Candidate Requirement Matches (Cached user-to-job requirement matching results)
export const candidateRequirementMatches = pgTable(
  'candidate_requirement_matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    profileHash: text('profile_hash').notNull(),
    jobHash: text('job_hash').notNull(),
    matchResult: jsonb('match_result').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('candidate_req_matches_user_job_idx').on(table.userId, table.jobId),
    index('candidate_req_matches_user_id_idx').on(table.userId),
  ]
).enableRLS();

// 16d. ATS Analyses (Cached resume ATS inspection and job-specific terminology alignment)
export const atsAnalyses = pgTable(
  'ats_analyses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    resumeId: uuid('resume_id')
      .notNull()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
    resumeHash: text('resume_hash').notNull(),
    jobHash: text('job_hash'),
    analysisResult: jsonb('analysis_result').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('ats_analyses_user_resume_idx').on(table.userId, table.resumeId),
    index('ats_analyses_user_job_idx').on(table.userId, table.jobId),
  ]
).enableRLS();

// 16. Auth: users (Better Auth user table with UUID PK)
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().default(''),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    passwordHash: text('password_hash'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)]
).enableRLS();

// 17. Auth: sessions (Better Auth session table)
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    uniqueIndex('sessions_token_idx').on(table.token),
  ]
).enableRLS();

// 18. Auth: accounts (Better Auth account table for credentials & OAuth)
export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)]
).enableRLS();

// 19. Auth: verifications (Better Auth verification table for tokens & codes)
export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)]
).enableRLS();

// 20. Legacy one-time auth tokens
export const authTokenPurposeEnum = pgEnum('auth_token_purpose', [
  'password_reset',
  'email_verification',
]);

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: authTokenPurposeEnum('purpose').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('auth_tokens_user_id_idx').on(table.userId)]
).enableRLS();

// 21. Rate limits
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();
