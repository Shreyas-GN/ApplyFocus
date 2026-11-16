CREATE TYPE "public"."job_board_provider" AS ENUM('greenhouse', 'lever', 'ashby', 'smartrecruiters');--> statement-breakpoint
CREATE TABLE "job_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "job_board_provider" NOT NULL,
	"slug" text NOT NULL,
	"company_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_seed" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_boards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || left(coalesce(description, ''), 4096))) STORED;--> statement-breakpoint
CREATE UNIQUE INDEX "job_boards_provider_slug_idx" ON "job_boards" USING btree ("provider","slug");--> statement-breakpoint
CREATE INDEX "job_boards_is_active_idx" ON "job_boards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "jobs_is_active_idx" ON "jobs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "jobs_search_vector_gin_idx" ON "jobs" USING gin ("search_vector");--> statement-breakpoint
CREATE POLICY "job_boards_authenticated_read_policy" ON "job_boards" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
-- Seed 14 job boards across all 4 ATS providers
INSERT INTO "job_boards" ("provider", "slug", "company_name", "is_active", "is_seed") VALUES
  ('greenhouse', 'vercel',    'Vercel',     true, true),
  ('greenhouse', 'anthropic', 'Anthropic',  true, true),
  ('greenhouse', 'stripe',    'Stripe',     true, true),
  ('greenhouse', 'figma',     'Figma',      true, true),
  ('greenhouse', 'notion',    'Notion',     true, true),
  ('lever',      'netflix',   'Netflix',    true, true),
  ('lever',      'shopify',   'Shopify',    true, true),
  ('lever',      'square',    'Square',     true, true),
  ('ashby',      'linear',    'Linear',     true, true),
  ('ashby',      'mercury',   'Mercury',    true, true),
  ('ashby',      'ramp',      'Ramp',       true, true),
  ('smartrecruiters', 'canva',      'Canva',      true, true),
  ('smartrecruiters', 'twilio',     'Twilio',     true, true),
  ('smartrecruiters', 'cloudflare', 'Cloudflare', true, true)
ON CONFLICT ("provider", "slug") DO NOTHING;