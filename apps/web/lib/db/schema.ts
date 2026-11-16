import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
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

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

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

// 0. App Users (bridges Neon Auth string IDs to app UUIDs)
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stackAuthId: text('stack_auth_id').notNull().unique(),
    email: text('email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('users_stack_auth_id_idx').on(table.stackAuthId),
  ]
);

// 1. Profiles
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

// 2. Work Experiences
export const workExperiences = pgTable(
  'work_experiences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 3. Education Entries
export const educationEntries = pgTable(
  'education_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 4. Skills
export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    proficiency: text('proficiency'),
    yearsOfExperience: numeric('years_of_experience', { precision: 4, scale: 1 }),
    evidence: text('evidence'),
    source: itemSourceEnum('source').default('user').notNull(),
    confidence: numeric('confidence', { precision: 4, scale: 3 }),
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
  ]
);

// 5. Projects
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 6. Certifications
export const certifications = pgTable(
  'certifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 7. Resumes
export const resumes = pgTable(
  'resumes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 7b. Resume Files (file content stored in Neon PostgreSQL)
export const resumeFiles = pgTable(
  'resume_files',
  {
    resumeId: uuid('resume_id')
      .primaryKey()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    fileData: bytea('file_data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

// 8. Resume Parsed Data
export const resumeParsedData = pgTable(
  'resume_parsed_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    resumeId: uuid('resume_id')
      .notNull()
      .unique()
      .references(() => resumes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 9. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
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
);

// 10. Jobs (Public ATS & ingested listings)
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: text('source').notNull(), // 'greenhouse' | 'lever' | 'manual'
    externalId: text('external_id').notNull(),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location'),
    workMode: text('work_mode'), // 'remote' | 'hybrid' | 'onsite'
    employmentType: text('employment_type'),
    url: text('url').notNull(),
    description: text('description').notNull(),
    skills: text('skills')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
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
    index('jobs_company_idx').on(table.company),
  ]
);

// 11. Applications (User's tracked jobs)
export const applications = pgTable(
  'applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 12. Application Events (Timeline log)
export const applicationEvents = pgTable(
  'application_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'created' | 'status_change' | 'note'
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('application_events_app_id_idx').on(table.applicationId),
  ]
);

// 13. Tailored Documents (AI tailored resumes & cover letters)
export const tailoredDocuments = pgTable(
  'tailored_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 14. Extension Sessions (Paired browser extension tokens)
export const extensionSessions = pgTable(
  'extension_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 15b. Application Strategies (per user+job, persisted strategy analysis)
export const applicationStrategies = pgTable(
  'application_strategies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 15. Job States (Saved bookmarks & dismissed jobs per user)
export const jobStates = pgTable(
  'job_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);

// 16. Screening Answers (Persisted AI-generated screening answers)
export const screeningAnswers = pgTable(
  'screening_answers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
);
