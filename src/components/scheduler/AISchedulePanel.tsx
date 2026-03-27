"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2, CheckCircle2, RefreshCw, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  deadline?: string;
  priority: string;
  estimatedMins: number;
  category: string;
};

type ScheduleBlock = {
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  taskId?: string;
  color?: string;
  notes?: string;
};

type GeneratedSchedule = {
  summary: string;
  blocks: ScheduleBlock[];
  rescheduleSuggestions?: Array<{
    taskId: string;
    reason: string;
    suggestedDate: string;
  }>;
};

const TYPE_COLORS: Record<string, string> = {
  task: "#6366f1",
  class: "#10b981",
  break: "#6b7280",
  blocked: "#f59e0b",
};

export default function AISchedulePanel({
  tasks,
  onScheduleApproved,
}: {
  tasks: Task[];
  onScheduleApproved: () => void;
}) {
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);

  async function generateSchedule() {
    setLoading(true);
    setApproved(false);
    setSchedule(null);
    try {
      const res = await fetch("/api/agents/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSchedule(data);
    } catch (err) {
      toast.error("Failed to generate schedule. Check your GROQ_API_KEY.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function approveSchedule() {
    if (!schedule) return;
    setApproving(true);
    try {
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          blocks: schedule.blocks,
          aiSummary: schedule.summary,
        }),
      });
      setApproved(true);
      toast.success("Schedule approved and saved!");
      onScheduleApproved();
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setApproving(false);
    }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold">AI Scheduler</span>
          </div>
          <Button onClick={generateSchedule} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {loading
              ? "Generating..."
              : schedule
              ? "Regenerate"
              : "Generate Schedule"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {tasks.length > 0
            ? `Analyzing ${tasks.length} pending tasks + your class schedule to build today's optimal plan.`
            : "Add some tasks first, then let AI build your optimal daily schedule."}
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-12 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Building your schedule for {today}...</p>
        </div>
      )}

      {schedule && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <p className="text-sm font-medium text-primary mb-1">
              📋 Schedule Summary
            </p>
            <p className="text-sm text-foreground">{schedule.summary}</p>
          </div>

          {/* Time Blocks */}
          <div className="space-y-2">
            {schedule.blocks.map((block, i) => {
              const color = block.color || TYPE_COLORS[block.type] || "#6366f1";
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{
                    borderColor: color + "30",
                    backgroundColor: color + "10",
                  }}
                >
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-xs font-mono font-medium" style={{ color }}>
                      {block.startTime}
                    </span>
                    <div
                      className="w-px h-4 my-0.5"
                      style={{ backgroundColor: color + "50" }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {block.endTime}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{block.title}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
                        style={{
                          color,
                          backgroundColor: color + "20",
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {block.type}
                      </span>
                    </div>
                    {block.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {block.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reschedule suggestions */}
          {schedule.rescheduleSuggestions &&
            schedule.rescheduleSuggestions.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <p className="text-sm font-medium text-amber-400 mb-2">
                  ⚠ Reschedule Suggestions
                </p>
                {schedule.rescheduleSuggestions.map((s, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    • {s.reason} → {s.suggestedDate}
                  </div>
                ))}
              </div>
            )}

          {/* Approve button */}
          {!approved ? (
            <Button
              onClick={approveSchedule}
              disabled={approving}
              className="w-full gap-2"
              size="lg"
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {approving ? "Saving..." : "Approve & Save Schedule"}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 text-primary font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Schedule approved! View in Calendar tab.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
