CREATE TYPE "public"."capability_processing_trigger" AS ENUM('resume_confirmed', 'profile_updated', 'manual');--> statement-breakpoint
CREATE TABLE "candidate_capability_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assessment_version" text NOT NULL,
	"processing_trigger" "capability_processing_trigger" NOT NULL,
	"source_resume_id" uuid,
	"capability_count" integer DEFAULT 0 NOT NULL,
	"directly_demonstrated_count" integer DEFAULT 0 NOT NULL,
	"evidence_coverage_percent" numeric(5, 2),
	"gap_count" integer DEFAULT 0 NOT NULL,
	"contradiction_count" integer DEFAULT 0 NOT NULL,
	"capabilities" jsonb NOT NULL,
	"processing_duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_capability_profiles" ADD CONSTRAINT "candidate_capability_profiles_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_capability_profiles" ADD CONSTRAINT "candidate_capability_profiles_source_resume_id_resumes_id_fk" FOREIGN KEY ("source_resume_id") REFERENCES "public"."resumes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cap_profiles_user_id_created_at_idx" ON "candidate_capability_profiles" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER POLICY "cap_profiles_owner_policy" ON "candidate_capability_profiles" TO "authenticated" USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
