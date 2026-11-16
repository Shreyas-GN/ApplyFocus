CREATE TABLE "resume_files" (
	"resume_id" uuid PRIMARY KEY NOT NULL,
	"file_data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stack_auth_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_stack_auth_id_unique" UNIQUE("stack_auth_id")
);
--> statement-breakpoint
ALTER TABLE "application_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "application_strategies" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "applications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "education_entries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "extension_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "job_states" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resume_parsed_data" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resumes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "screening_answers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "skills" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tailored_documents" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_experiences" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "application_events" DROP CONSTRAINT "application_events_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "application_strategies" DROP CONSTRAINT "application_strategies_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "certifications" DROP CONSTRAINT "certifications_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "education_entries" DROP CONSTRAINT "education_entries_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "extension_sessions" DROP CONSTRAINT "extension_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "job_states" DROP CONSTRAINT "job_states_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "resume_parsed_data" DROP CONSTRAINT "resume_parsed_data_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "resumes" DROP CONSTRAINT "resumes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "screening_answers" DROP CONSTRAINT "screening_answers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "skills" DROP CONSTRAINT "skills_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tailored_documents" DROP CONSTRAINT "tailored_documents_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "work_experiences" DROP CONSTRAINT "work_experiences_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "resume_files" ADD CONSTRAINT "resume_files_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
CREATE UNIQUE INDEX "users_stack_auth_id_idx" ON "users" USING btree ("stack_auth_id");--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "application_strategies" ADD CONSTRAINT "application_strategies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "education_entries" ADD CONSTRAINT "education_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "extension_sessions" ADD CONSTRAINT "extension_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "job_states" ADD CONSTRAINT "job_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "resume_parsed_data" ADD CONSTRAINT "resume_parsed_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "tailored_documents" ADD CONSTRAINT "tailored_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "work_experiences" ADD CONSTRAINT "work_experiences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
DROP POLICY "application_events_owner_policy" ON "application_events" CASCADE;--> statement-breakpoint
DROP POLICY "application_strategies_owner_policy" ON "application_strategies" CASCADE;--> statement-breakpoint
DROP POLICY "applications_owner_policy" ON "applications" CASCADE;--> statement-breakpoint
DROP POLICY "audit_logs_owner_policy" ON "audit_logs" CASCADE;--> statement-breakpoint
DROP POLICY "certifications_owner_policy" ON "certifications" CASCADE;--> statement-breakpoint
DROP POLICY "education_entries_owner_policy" ON "education_entries" CASCADE;--> statement-breakpoint
DROP POLICY "extension_sessions_owner_policy" ON "extension_sessions" CASCADE;--> statement-breakpoint
DROP POLICY "job_states_owner_policy" ON "job_states" CASCADE;--> statement-breakpoint
DROP POLICY "jobs_authenticated_read_policy" ON "jobs" CASCADE;--> statement-breakpoint
DROP POLICY "profiles_owner_policy" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "projects_owner_policy" ON "projects" CASCADE;--> statement-breakpoint
DROP POLICY "resume_parsed_data_owner_policy" ON "resume_parsed_data" CASCADE;--> statement-breakpoint
DROP POLICY "resumes_owner_policy" ON "resumes" CASCADE;--> statement-breakpoint
DROP POLICY "screening_answers_owner_policy" ON "screening_answers" CASCADE;--> statement-breakpoint
DROP POLICY "skills_owner_policy" ON "skills" CASCADE;--> statement-breakpoint
DROP POLICY "tailored_documents_owner_policy" ON "tailored_documents" CASCADE;--> statement-breakpoint
DROP POLICY "work_experiences_owner_policy" ON "work_experiences" CASCADE;