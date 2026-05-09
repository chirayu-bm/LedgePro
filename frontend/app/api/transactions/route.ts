import { NextResponse } from "next/server";
import { mockTransactions } from "@/lib/constants";
import {
  transactionCreateInputSchema,
  type ApiErrorResponse,
  type TransactionCreateResponse,
  type TransactionsListResponse,
} from "@/lib/contracts";

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json<TransactionsListResponse>({
    data: mockTransactions,
    total: mockTransactions.length,
    page: 1,
    limit: 10,
  });
}

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = transactionCreateInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid transaction payload",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const newTransaction = {
    id: `TXN${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    ...parsed.data,
    date: new Date().toISOString().split("T")[0],
  };

  return NextResponse.json<TransactionCreateResponse>({ data: newTransaction }, { status: 201 });
}
