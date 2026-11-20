ALTER TABLE "jobs" ADD COLUMN "source_platform" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "company_logo" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "direct_apply_url" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_min" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_max" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_currency" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "fingerprint" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "role_track" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "last_liveness_check" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_fingerprint_idx" ON "jobs" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_role_track_idx" ON "jobs" USING btree ("role_track");--> statement-breakpoint
CREATE INDEX "jobs_source_platform_idx" ON "jobs" USING btree ("source_platform");