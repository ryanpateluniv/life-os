import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "month";

  const now = new Date();
  const start =
    period === "week"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      : new Date(now.getFullYear(), now.getMonth(), 1);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const { amount, category, note, date } = await req.json();
  const expense = await prisma.expense.create({
    data: {
      amount: parseFloat(amount),
      category,
      note: note || null,
      date: date ? new Date(date) : new Date(),
    },
  });
  return NextResponse.json(expense);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
