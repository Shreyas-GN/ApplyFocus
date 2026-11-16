import { z } from "zod";

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Neon Auth (Stack Auth) configuration
  NEXT_PUBLIC_STACK_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_STACK_PROJECT_ID is required"),
  NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: z.string().min(1, "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is required"),
  STACK_SECRET_SERVER_KEY: z.string().min(1, "STACK_SECRET_SERVER_KEY is required"),
  // Neon PostgreSQL connection
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_MIGRATION_URL: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("anthropic/claude-3.5-sonnet"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  CRON_SECRET: z.string().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseWebEnv(raw: Record<string, string | undefined>): WebEnv {
  return webEnvSchema.parse(raw);
}
