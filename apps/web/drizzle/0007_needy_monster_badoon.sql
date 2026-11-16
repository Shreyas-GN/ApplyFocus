ALTER TYPE "public"."application_status" ADD VALUE 'under_review' BEFORE 'interviewing';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'assessment' BEFORE 'interviewing';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'withdrawn';--> statement-breakpoint
CREATE TABLE "screening_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"application_id" uuid,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"grounded_facts" text[] DEFAULT '{}'::text[] NOT NULL,
	"source" text DEFAULT 'claude' NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "screening_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_answers" ADD CONSTRAINT "screening_answers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "screening_answers_user_id_idx" ON "screening_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "screening_answers_user_job_idx" ON "screening_answers" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE POLICY "screening_answers_owner_policy" ON "screening_answers" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));