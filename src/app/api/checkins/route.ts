import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mental health proxy questions
export const CHECKIN_QUESTIONS = [
  { id: "focus", text: "How easy was it to focus on things today?", scale: "1-5", highIsGood: true },
  { id: "energy", text: "How would you describe your energy levels?", scale: "1-5", highIsGood: true },
  { id: "meals", text: "Did you enjoy your meals today?", scale: "1-5", highIsGood: true },
  { id: "social", text: "Did you feel like connecting with others?", scale: "1-5", highIsGood: true },
  { id: "accomplishment", text: "Did you feel like you got things done today?", scale: "1-5", highIsGood: true },
];

function computeScore(answers: Array<{ questionId: string; value: number }>) {
  const total = answers.reduce((s, a) => s + a.value, 0);
  const max = answers.length * 5;
  return Math.round((total / max) * 100);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const checkins = await prisma.mentalHealthCheckin.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ checkins, questions: CHECKIN_QUESTIONS });
}

export async function POST(req: NextRequest) {
  const { answers } = await req.json();
  const totalScore = computeScore(answers);

  const checkin = await prisma.mentalHealthCheckin.create({
    data: {
      answers: JSON.stringify(answers),
      totalScore,
      date: new Date(),
    },
  });
  return NextResponse.json(checkin);
}
