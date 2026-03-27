import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const resources = await prisma.resource.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { studySessions: true } } },
  });
  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const { title, type, url, platform, topicTags, notes } = await req.json();
  const resource = await prisma.resource.create({
    data: {
      title,
      type,
      url: url || null,
      platform: platform || null,
      topicTags: JSON.stringify(topicTags || []),
      notes: notes || null,
    },
  });
  return NextResponse.json(resource);
}

export async function PATCH(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (data.topicTags) data.topicTags = JSON.stringify(data.topicTags);
  if (data.progress === 100) {
    data.completed = true;
    data.completedAt = new Date();
  }
  const resource = await prisma.resource.update({ where: { id }, data });
  return NextResponse.json(resource);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
