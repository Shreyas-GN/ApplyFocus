CREATE TABLE "candidate_requirement_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"profile_hash" text NOT NULL,
	"job_hash" text NOT NULL,
	"match_result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_requirement_matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "job_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"description_hash" text NOT NULL,
	"requirements" jsonb NOT NULL,
	"source" text DEFAULT 'ai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_requirements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "candidate_requirement_matches" ADD CONSTRAINT "candidate_requirement_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_req_matches_user_job_idx" ON "candidate_requirement_matches" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX "candidate_req_matches_user_id_idx" ON "candidate_requirement_matches" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_requirements_job_id_idx" ON "job_requirements" USING btree ("job_id");