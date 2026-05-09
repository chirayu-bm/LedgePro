import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default("postgresql://ledgerflow:ledgerflow@localhost:5432/ledgerflow"),
  JWT_SECRET: z.string().min(8).default("dev-secret-change-me"),
  DEFAULT_TENANT_SLUG: z.string().min(1).default("demo-sme")
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG
});
