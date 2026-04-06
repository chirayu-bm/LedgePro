import { PrismaClient } from "@prisma/client";
import { env } from "./config.js";

process.env.DATABASE_URL ??= env.DATABASE_URL;

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});
