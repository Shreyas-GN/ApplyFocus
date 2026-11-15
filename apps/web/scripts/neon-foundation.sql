-- =============================================================================
-- Neon Foundation SQL
-- Applies migrations 0000-0007 adapted for plain PostgreSQL (no Supabase deps).
-- Supabase-specific lines omitted: auth.users FKs, auth.uid() policies,
-- storage.buckets/objects, and RLS ENABLE (no policies = blocked by default).
--
-- Apply once to a fresh Neon database:
--   psql "$DATABASE_MIGRATION_URL" -f apps/web/scripts/neon-foundation.sql
-- =============================================================================

-- ── 0000: Enums + initial tables ─────────────────────────────────────────────

CREATE TYPE "public"."item_source" AS ENUM('user', 'ai');
CREATE TYPE "public"."resume_processing_status" AS ENUM('uploaded', 'extracting', 'parsing', 'parsed', 'failed');
CREATE TYPE "public"."review_status" AS ENUM('pending_review', 'confirmed', 'rejected');

CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

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

CREATE TABLE "education_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution" text NOT NULL,
	"degree" text,
	"field_of_study" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"description" text,
	"source" "item_source" DEFAULT 'user' NOT NULL,
	"confidence" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"source" "item_source" DEFAULT 'user' NOT NULL,
	"confidence" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

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

CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"source" "item_source" DEFAULT 'user' NOT NULL,
	"confidence" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

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
	"source" "item_source" DEFAULT 'user' NOT NULL,
	"confidence" numeric(4, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- FK within public schema only
ALTER TABLE "resume_parsed_data" ADD CONSTRAINT "resume_parsed_data_resume_id_resumes_id_fk"
  FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs" USING btree ("user_id","created_at");
CREATE INDEX "certifications_user_id_idx" ON "certifications" USING btree ("user_id");
CREATE INDEX "education_entries_user_id_idx" ON "education_entries" USING btree ("user_id");
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");
CREATE INDEX "resume_parsed_data_user_id_idx" ON "resume_parsed_data" USING btree ("user_id");
CREATE INDEX "resumes_user_id_idx" ON "resumes" USING btree ("user_id");
CREATE INDEX "skills_user_id_idx" ON "skills" USING btree ("user_id");
CREATE UNIQUE INDEX "skills_user_id_lower_name_idx" ON "skills" USING btree ("user_id",lower("name"));
CREATE INDEX "work_experiences_user_id_idx" ON "work_experiences" USING btree ("user_id");

-- ── 0001: application_events, applications, jobs ─────────────────────────────

CREATE TYPE "public"."application_status" AS ENUM('saved', 'applied', 'interviewing', 'offer', 'rejected');

CREATE TABLE "application_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

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
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

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

ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk"
  FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "application_events_app_id_idx" ON "application_events" USING btree ("application_id");
CREATE INDEX "applications_user_id_idx" ON "applications" USING btree ("user_id");
CREATE UNIQUE INDEX "jobs_source_external_id_idx" ON "jobs" USING btree ("source","external_id");
CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company");

-- ── 0002: tailored_documents ──────────────────────────────────────────────────

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

ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_job_id_jobs_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_application_id_applications_id_fk"
  FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "tailored_documents_user_id_idx" ON "tailored_documents" USING btree ("user_id");
CREATE INDEX "tailored_documents_user_job_idx" ON "tailored_documents" USING btree ("user_id","job_id");

-- ── 0003: extension_sessions ──────────────────────────────────────────────────

CREATE TABLE "extension_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text DEFAULT 'Chrome Extension' NOT NULL,
	"token_hash" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "extension_sessions_user_id_idx" ON "extension_sessions" USING btree ("user_id");
CREATE UNIQUE INDEX "extension_sessions_token_hash_idx" ON "extension_sessions" USING btree ("token_hash");

-- ── 0004: column additions ────────────────────────────────────────────────────

ALTER TABLE "education_entries" ADD COLUMN "graduation_year" integer;
ALTER TABLE "education_entries" ADD COLUMN "grade" text;
ALTER TABLE "profiles" ADD COLUMN "contact_email" text;
ALTER TABLE "profiles" ADD COLUMN "career_stage" text;
ALTER TABLE "profiles" ADD COLUMN "preferred_experience_level" text;
ALTER TABLE "profiles" ADD COLUMN "desired_roles" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "profiles" ADD COLUMN "adjacent_roles" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "profiles" ADD COLUMN "excluded_roles" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "profiles" ADD COLUMN "intelligence_metadata" jsonb;
ALTER TABLE "projects" ADD COLUMN "role" text;
ALTER TABLE "projects" ADD COLUMN "technologies" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "projects" ADD COLUMN "contributions" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "projects" ADD COLUMN "github_url" text;
ALTER TABLE "projects" ADD COLUMN "live_url" text;
ALTER TABLE "skills" ADD COLUMN "proficiency" text;
ALTER TABLE "skills" ADD COLUMN "years_of_experience" numeric(4, 1);
ALTER TABLE "skills" ADD COLUMN "evidence" text;
ALTER TABLE "work_experiences" ADD COLUMN "responsibilities" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "work_experiences" ADD COLUMN "achievements" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "work_experiences" ADD COLUMN "technologies" text[] DEFAULT '{}'::text[] NOT NULL;

-- ── 0005: more column additions ───────────────────────────────────────────────

ALTER TABLE "applications" ADD COLUMN "follow_up_at" timestamp with time zone;
ALTER TABLE "applications" ADD COLUMN "checklist" jsonb;
ALTER TABLE "profiles" ADD COLUMN "notification_preferences" jsonb;

-- ── 0006: job_state enum + job_states table ───────────────────────────────────

CREATE TYPE "public"."job_state" AS ENUM('saved', 'dismissed');

CREATE TABLE "job_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"state" "job_state" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "job_states" ADD CONSTRAINT "job_states_job_id_jobs_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "job_states_user_job_idx" ON "job_states" USING btree ("user_id","job_id");
CREATE INDEX "job_states_user_state_idx" ON "job_states" USING btree ("user_id","state");

-- ── 0007: job_boards table ────────────────────────────────────────────────────

CREATE TABLE "job_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"provider" text NOT NULL,
	"slug" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "job_boards_provider_slug_idx" ON "job_boards" USING btree ("provider","slug");

-- ── Drizzle migration history (marks all 8 migrations as applied) ─────────────

CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES
  ('19e3ca80beeb74256fc3757c633342662ec506b08f4c05b1120aee0452e38641', 1794329749366),
  ('59df65e35782f65c582daf143ed5b49dc6c0340776c1d8a88bf2e28b3d480e21', 1794377353597),
  ('bc183027aff95710bc8527112209427a5f49e76cf4f81b0b2c20b854b1f3b4a6', 1794379905879),
  ('fda7259117c069c3059d64b89c64d0249f2c1b10e35ee00cc3de76c7f2492008', 1794380695745),
  ('0036c04634cab1b7d7107a51b3d7ef485622c1efa26b5f0502bddf9f62c9a06a', 1794396217612),
  ('f1470a5588fcf41b7b46b1ba4976073ccef3e09f115271e2612b517bb29ee3fd', 1794396871366),
  ('05ed993bb76713a63eaba5999543ab4759382864ee21b52f8020a5dcf00f2cc2', 1794415648495),
  ('6b767bc3b602035e73be0d4b708129459c65126cfc0ab5471d9bbe44d8b99181', 1794416000000)
ON CONFLICT DO NOTHING;
