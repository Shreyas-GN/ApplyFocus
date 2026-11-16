CREATE TABLE "job_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"slug" text NOT NULL,
	"company_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_status" text,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_boards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
CREATE UNIQUE INDEX "job_boards_provider_slug_idx" ON "job_boards" USING btree ("provider","slug");--> statement-breakpoint
CREATE INDEX "jobs_is_active_idx" ON "jobs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "jobs_search_vector_idx" ON "jobs" USING gin ("search_vector");--> statement-breakpoint
CREATE POLICY "job_boards_authenticated_read_policy" ON "job_boards" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint

-- Backfill search_vector for existing jobs
UPDATE "jobs" SET "search_vector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(company, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(skills, ' '), '')), 'B') ||
  setweight(to_tsvector('english', coalesce(left(description, 4000), '')), 'C')
WHERE "search_vector" IS NULL;--> statement-breakpoint

-- Seed board catalogue
INSERT INTO "job_boards" ("provider", "slug", "company_name") VALUES
  ('greenhouse', 'vercel',           'Vercel'),
  ('greenhouse', 'anthropic',        'Anthropic'),
  ('greenhouse', 'stripe',           'Stripe'),
  ('greenhouse', 'figma',            'Figma'),
  ('greenhouse', 'linear',           'Linear'),
  ('greenhouse', 'notion',           'Notion'),
  ('greenhouse', 'openai',           'OpenAI'),
  ('greenhouse', 'databricks',       'Databricks'),
  ('lever',      'retool',           'Retool'),
  ('lever',      'coda',             'Coda'),
  ('ashby',      'supabase',         'Supabase'),
  ('ashby',      'resend',           'Resend'),
  ('ashby',      'cal',              'Cal.com'),
  ('smartrecruiters', 'mongodb',     'MongoDB')
ON CONFLICT DO NOTHING;