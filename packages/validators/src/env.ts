import { z } from "zod";

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Authentication (in-house)
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  // Supabase Storage (private résumé files only — not used for auth)
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required").optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_MIGRATION_URL: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("anthropic/claude-3.5-sonnet"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseWebEnv(raw: Record<string, string | undefined>): WebEnv {
  return webEnvSchema.parse(raw);
}
