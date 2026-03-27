import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ priority: "desc" }, { deadline: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { title, description, deadline, priority, estimatedMins, category } =
    await req.json();
  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline) : null,
      priority: priority || "medium",
      estimatedMins: estimatedMins || 60,
      category: category || "personal",
    },
  });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (data.deadline) data.deadline = new Date(data.deadline);
  if (data.status === "completed") data.completedAt = new Date();
  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
