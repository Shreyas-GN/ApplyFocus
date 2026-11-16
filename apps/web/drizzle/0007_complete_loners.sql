CREATE TYPE "public"."strategy_status" AS ENUM('ready', 'approved', 'failed');--> statement-breakpoint
CREATE TABLE "application_strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"status" "strategy_status" DEFAULT 'ready' NOT NULL,
	"content" jsonb NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_strategies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "application_strategies" ADD CONSTRAINT "application_strategies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_strategies" ADD CONSTRAINT "application_strategies_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_strategies_user_job_idx" ON "application_strategies" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX "application_strategies_user_id_idx" ON "application_strategies" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "application_strategies_owner_policy" ON "application_strategies" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));