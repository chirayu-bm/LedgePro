import { NextResponse } from "next/server";
import { mockTransactions } from "@/lib/constants";

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json({
    data: mockTransactions,
    total: mockTransactions.length,
    page: 1,
    limit: 10,
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const newTransaction = {
    id: `TXN${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    ...body,
    date: new Date().toISOString().split("T")[0],
  };

  return NextResponse.json({ data: newTransaction }, { status: 201 });
}
