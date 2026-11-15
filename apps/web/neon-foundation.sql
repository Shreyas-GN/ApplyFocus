-- ApplyPilot Neon Foundation Schema
-- Combined from all Drizzle migrations, adapted for Neon.
-- Auth is handled by Supabase; this DB has no auth.users FK constraints.
-- RLS is enforced at the application layer (server-side API routes).

-- Enums
CREATE TYPE "public"."item_source" AS ENUM('user', 'ai');
CREATE TYPE "public"."resume_processing_status" AS ENUM('uploaded', 'extracting', 'parsing', 'parsed', 'failed');
CREATE TYPE "public"."review_status" AS ENUM('pending_review', 'confirmed', 'rejected');
CREATE TYPE "public"."application_status" AS ENUM('saved', 'applied', 'interviewing', 'offer', 'rejected');
CREATE TYPE "public"."job_state" AS ENUM('saved', 'dismissed');

-- Profiles
CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY NOT NULL,
  "full_name" text,
  "phone" text,
  "location" text,
  "linkedin_url" text,
  "github_url" text,
  "portfolio_url" text,
  "headline" text,
  "summary" text,
  "years_of_experience" integer,
  "employment_status" text,
  "preferred_titles" text[] DEFAULT '{}'::text[] NOT NULL,
  "preferred_locations" text[] DEFAULT '{}'::text[] NOT NULL,
  "work_mode" text,
  "employment_types" text[] DEFAULT '{}'::text[] NOT NULL,
  "expected_salary_min" integer,
  "expected_salary_max" integer,
  "preferred_industries" text[] DEFAULT '{}'::text[] NOT NULL,
  "excluded_companies" text[] DEFAULT '{}'::text[] NOT NULL,
  "notification_preferences" jsonb,
  "contact_email" text,
  "career_stage" text,
  "preferred_experience_level" text,
  "desired_roles" text[] DEFAULT '{}'::text[] NOT NULL,
  "adjacent_roles" text[] DEFAULT '{}'::text[] NOT NULL,
  "excluded_roles" text[] DEFAULT '{}'::text[] NOT NULL,
  "intelligence_metadata" jsonb,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Work Experiences
CREATE TABLE "work_experiences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "company" text NOT NULL,
  "title" text NOT NULL,
  "location" text,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "is_current" boolean DEFAULT false NOT NULL,
  "description" text,
  "responsibilities" text[] DEFAULT '{}'::text[] NOT NULL,
  "achievements" text[] DEFAULT '{}'::text[] NOT NULL,
  "technologies" text[] DEFAULT '{}'::text[] NOT NULL,
  "source" "item_source" DEFAULT 'user' NOT NULL,
  "confidence" numeric(4, 3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Education Entries
CREATE TABLE "education_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "institution" text NOT NULL,
  "degree" text,
  "field_of_study" text,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "graduation_year" integer,
  "grade" text,
  "description" text,
  "source" "item_source" DEFAULT 'user' NOT NULL,
  "confidence" numeric(4, 3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Skills
CREATE TABLE "skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "category" text,
  "proficiency" text,
  "years_of_experience" numeric(4, 1),
  "evidence" text,
  "source" "item_source" DEFAULT 'user' NOT NULL,
  "confidence" numeric(4, 3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Projects
CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "role" text,
  "technologies" text[] DEFAULT '{}'::text[] NOT NULL,
  "contributions" text[] DEFAULT '{}'::text[] NOT NULL,
  "url" text,
  "github_url" text,
  "live_url" text,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "source" "item_source" DEFAULT 'user' NOT NULL,
  "confidence" numeric(4, 3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Certifications
CREATE TABLE "certifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "issuer" text,
  "issue_date" timestamp with time zone,
  "expiry_date" timestamp with time zone,
  "credential_url" text,
  "source" "item_source" DEFAULT 'user' NOT NULL,
  "confidence" numeric(4, 3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Resumes
CREATE TABLE "resumes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "version_label" text NOT NULL,
  "original_filename" text NOT NULL,
  "mime_type" text NOT NULL,
  "file_size_bytes" integer NOT NULL,
  "storage_key" text NOT NULL,
  "checksum" text,
  "is_primary" boolean DEFAULT false NOT NULL,
  "processing_status" "resume_processing_status" DEFAULT 'uploaded' NOT NULL,
  "parse_attempts" integer DEFAULT 0 NOT NULL,
  "extracted_text" text,
  "processing_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Resume Parsed Data
CREATE TABLE "resume_parsed_data" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "resume_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "structured_data" jsonb NOT NULL,
  "overall_confidence" numeric(4, 3),
  "review_status" "review_status" DEFAULT 'pending_review' NOT NULL,
  "confirmed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "resume_parsed_data_resume_id_unique" UNIQUE("resume_id")
);

-- Audit Logs
CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "action" text NOT NULL,
  "metadata" jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Jobs
CREATE TABLE "jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source" text NOT NULL,
  "external_id" text NOT NULL,
  "company" text NOT NULL,
  "title" text NOT NULL,
  "location" text,
  "work_mode" text,
  "employment_type" text,
  "url" text NOT NULL,
  "description" text NOT NULL,
  "skills" text[] DEFAULT '{}'::text[] NOT NULL,
  "posted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Applications
CREATE TABLE "applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "job_id" uuid,
  "company" text NOT NULL,
  "title" text NOT NULL,
  "location" text,
  "url" text,
  "status" "application_status" DEFAULT 'saved' NOT NULL,
  "match_score" integer,
  "notes" text,
  "follow_up_at" timestamp with time zone,
  "checklist" jsonb,
  "applied_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Application Events
CREATE TABLE "application_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "type" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Tailored Documents
CREATE TABLE "tailored_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "job_id" uuid,
  "application_id" uuid,
  "company" text NOT NULL,
  "job_title" text NOT NULL,
  "type" text NOT NULL,
  "tone" text,
  "content" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Extension Sessions
CREATE TABLE "extension_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "label" text DEFAULT 'Chrome Extension' NOT NULL,
  "token_hash" text NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Job States
CREATE TABLE "job_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "job_id" uuid NOT NULL,
  "state" "job_state" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign Keys (intra-app only, no auth.users references)
ALTER TABLE "resume_parsed_data" ADD CONSTRAINT "resume_parsed_data_resume_id_fk"
  FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE cascade;

ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_fk"
  FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE cascade;

ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE set null;

ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_job_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE set null;

ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_application_id_fk"
  FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE set null;

ALTER TABLE "job_states" ADD CONSTRAINT "job_states_job_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE cascade;

-- Indexes
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs" USING btree ("user_id", "created_at");
CREATE INDEX "certifications_user_id_idx" ON "certifications" USING btree ("user_id");
CREATE INDEX "education_entries_user_id_idx" ON "education_entries" USING btree ("user_id");
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");
CREATE INDEX "resume_parsed_data_user_id_idx" ON "resume_parsed_data" USING btree ("user_id");
CREATE INDEX "resumes_user_id_idx" ON "resumes" USING btree ("user_id");
CREATE INDEX "skills_user_id_idx" ON "skills" USING btree ("user_id");
CREATE UNIQUE INDEX "skills_user_id_lower_name_idx" ON "skills" USING btree ("user_id", lower("name"));
CREATE INDEX "work_experiences_user_id_idx" ON "work_experiences" USING btree ("user_id");
CREATE UNIQUE INDEX "jobs_source_external_id_idx" ON "jobs" USING btree ("source", "external_id");
CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company");
CREATE INDEX "application_events_app_id_idx" ON "application_events" USING btree ("application_id");
CREATE INDEX "applications_user_id_idx" ON "applications" USING btree ("user_id");
CREATE INDEX "tailored_documents_user_id_idx" ON "tailored_documents" USING btree ("user_id");
CREATE INDEX "tailored_documents_user_job_idx" ON "tailored_documents" USING btree ("user_id", "job_id");
CREATE INDEX "extension_sessions_user_id_idx" ON "extension_sessions" USING btree ("user_id");
CREATE UNIQUE INDEX "extension_sessions_token_hash_idx" ON "extension_sessions" USING btree ("token_hash");
CREATE UNIQUE INDEX "job_states_user_job_idx" ON "job_states" USING btree ("user_id", "job_id");
CREATE INDEX "job_states_user_state_idx" ON "job_states" USING btree ("user_id", "state");
