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

  // Generate cryptographically secure transaction ID
  const randomBytes = crypto.getRandomValues(new Uint8Array(2));
  const randomNum = (randomBytes[0] << 8) | randomBytes[1];
  const id = `TXN${(randomNum % 10000).toString().padStart(4, "0")}`;

  const newTransaction = {
    id,
    ...parsed.data,
    date: new Date().toISOString().split("T")[0],
  };

  return NextResponse.json<TransactionCreateResponse>({ data: newTransaction }, { status: 201 });
}
