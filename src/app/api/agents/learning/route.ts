import { NextRequest, NextResponse } from "next/server";
import {
  generateStudyPlan,
  detectKnowledgeGaps,
  getSpacedRepetitionReminders,
} from "@/lib/agents/learningAgent";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { type, resourceId } = await req.json();

    if (type === "study-plan" && resourceId) {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
      });
      if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

      const raw = await generateStudyPlan({
        resourceTitle: resource.title,
        resourceType: resource.type,
        platform: resource.platform ?? undefined,
        topicTags: JSON.parse(resource.topicTags) as string[],
        currentProgress: resource.progress,
        totalHoursLogged: resource.totalHours,
        notes: resource.notes ?? undefined,
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      const plan = JSON.parse(jsonMatch[0]);

      // Save the plan
      await prisma.studyPlan.create({
        data: {
          resourceId,
          topic: resource.title,
          content: JSON.stringify(plan),
        },
      });

      return NextResponse.json(plan);
    }

    if (type === "knowledge-gaps") {
      const sessions = await prisma.studySession.findMany({
        include: { resource: true },
      });
      const topicMap: Record<string, { hours: number; lastStudied: Date }> = {};
      sessions.forEach((s) => {
        const tags: string[] = JSON.parse(s.resource.topicTags);
        tags.forEach((tag) => {
          if (!topicMap[tag]) {
            topicMap[tag] = { hours: 0, lastStudied: s.date };
          }
          topicMap[tag].hours += s.duration / 60;
          if (s.date > topicMap[tag].lastStudied) {
            topicMap[tag].lastStudied = s.date;
          }
        });
      });

      const raw = await detectKnowledgeGaps({
        studiedTopics: Object.entries(topicMap).map(([topic, data]) => ({
          topic,
          hoursSpent: Math.round(data.hours * 10) / 10,
          lastStudied: data.lastStudied.toDateString(),
        })),
        csLevel: "sophomore",
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    if (type === "reminders") {
      const resources = await prisma.resource.findMany({
        where: { completed: false, lastStudied: { not: null } },
      });

      const raw = await getSpacedRepetitionReminders({
        resources: resources.map((r) => ({
          title: r.title,
          lastStudied: r.lastStudied!.toDateString(),
          progress: r.progress,
        })),
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Learning agent error:", error);
    return NextResponse.json({ error: "Learning agent failed" }, { status: 500 });
  }
}
