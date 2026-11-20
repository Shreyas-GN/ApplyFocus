ALTER TABLE "projects" ADD COLUMN "measurable_outcomes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "skills_demonstrated" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "evidence_category" text DEFAULT 'USER_CONFIRMED' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "evidence_sentence" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "connected_experience" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "connected_project" text;--> statement-breakpoint
ALTER TABLE "work_experiences" ADD COLUMN "evidence_sentences" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
CREATE INDEX "skills_evidence_category_idx" ON "skills" USING btree ("evidence_category");