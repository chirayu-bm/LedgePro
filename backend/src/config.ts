import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  DEFAULT_TENANT_SLUG: z.string().min(1).default("demo-sme"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGINS: z.string().optional(),
  DEMO_USER_PASSWORD: z.string().min(8).max(72).optional()
});

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const parsed = envSchema.parse({
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD
});

const corsAllowedOrigins = parseCorsOrigins(parsed.CORS_ORIGINS);

if (parsed.NODE_ENV === "production" && parsed.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production.");
}

if (parsed.NODE_ENV === "production" && corsAllowedOrigins.length === 0) {
  throw new Error("CORS_ORIGINS must be configured in production.");
}

export const env = {
  ...parsed,
  CORS_ALLOWED_ORIGINS: corsAllowedOrigins
};
