import { z } from "zod";
import type { Transaction } from "@/lib/constants";

export const appRoleSchema = z.enum(["admin", "accountant", "viewer"]);
export type AppRole = z.infer<typeof appRoleSchema>;

export const transactionTypeSchema = z.enum(["credit", "debit"]);
export const transactionStatusSchema = z.enum(["completed", "pending", "failed"]);

export const transactionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().finite().positive(),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  date: z.string().min(1),
  category: z.string().min(1),
}) satisfies z.ZodType<Transaction>;

export const transactionCreateInputSchema = z.object({
  description: z.string().min(1),
  amount: z.number().finite().positive(),
  type: transactionTypeSchema,
  status: transactionStatusSchema.default("pending"),
  category: z.string().min(1),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateInputSchema>;

export const transactionsListResponseSchema = z.object({
  data: z.array(transactionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type TransactionsListResponse = z.infer<typeof transactionsListResponseSchema>;

export const transactionCreateResponseSchema = z.object({
  data: transactionSchema,
});

export type TransactionCreateResponse = z.infer<typeof transactionCreateResponseSchema>;

export type ApiErrorResponse = {
  error: {
    code: "VALIDATION_ERROR" | "UNKNOWN_ERROR";
    message: string;
    details?: Record<string, string[] | undefined>;
  };
};
