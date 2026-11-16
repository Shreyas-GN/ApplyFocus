import { z } from "zod";

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_MIGRATION_URL: z.string().min(1).optional(),
  NEON_AUTH_BASE_URL: z.string().url("NEON_AUTH_BASE_URL must be a valid URL").optional(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(1, "NEON_AUTH_COOKIE_SECRET is required").optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-20241022"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseWebEnv(raw: Record<string, string | undefined>): WebEnv {
  return webEnvSchema.parse(raw);
}
