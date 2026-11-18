ALTER TABLE "application_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "application_strategies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "education_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "extension_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "job_states" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resume_parsed_data" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resumes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "screening_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tailored_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_experiences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "application_events" DROP CONSTRAINT IF EXISTS "application_events_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "application_strategies" DROP CONSTRAINT IF EXISTS "application_strategies_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "certifications" DROP CONSTRAINT IF EXISTS "certifications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "education_entries" DROP CONSTRAINT IF EXISTS "education_entries_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "extension_sessions" DROP CONSTRAINT IF EXISTS "extension_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "job_states" DROP CONSTRAINT IF EXISTS "job_states_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "resume_parsed_data" DROP CONSTRAINT IF EXISTS "resume_parsed_data_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "resumes" DROP CONSTRAINT IF EXISTS "resumes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "screening_answers" DROP CONSTRAINT IF EXISTS "screening_answers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "skills" DROP CONSTRAINT IF EXISTS "skills_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tailored_documents" DROP CONSTRAINT IF EXISTS "tailored_documents_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "work_experiences" DROP CONSTRAINT IF EXISTS "work_experiences_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "auth_email" text;--> statement-breakpoint
DROP POLICY IF EXISTS "application_events_owner_policy" ON "application_events" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "application_strategies_owner_policy" ON "application_strategies" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "applications_owner_policy" ON "applications" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "audit_logs_owner_policy" ON "audit_logs" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "certifications_owner_policy" ON "certifications" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "education_entries_owner_policy" ON "education_entries" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "extension_sessions_owner_policy" ON "extension_sessions" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "job_states_owner_policy" ON "job_states" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "jobs_authenticated_read_policy" ON "jobs" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "profiles_owner_policy" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "projects_owner_policy" ON "projects" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "resume_parsed_data_owner_policy" ON "resume_parsed_data" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "resumes_owner_policy" ON "resumes" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "screening_answers_owner_policy" ON "screening_answers" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "skills_owner_policy" ON "skills" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "tailored_documents_owner_policy" ON "tailored_documents" CASCADE;--> statement-breakpoint
DROP POLICY IF EXISTS "work_experiences_owner_policy" ON "work_experiences" CASCADE;