"use client";

import { useState } from "react";
import { Zap, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  pendingTasks: number;
  highPriorityTasks: string[];
  weekTotal: number;
  weekBudgetTotal: number;
  healthScore: number;
  weekStudyHours: number;
  currentResource?: string;
};

type Briefing = {
  greeting: string;
  headline: string;
  schedule: string;
  finance: string;
  health: string;
  learning: string;
  crossInsight?: string;
  motivationalClose: string;
};

export default function DashboardClient(props: Props) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function fetchBriefing() {
    setLoading(true);
    setExpanded(true);
    try {
      const res = await fetch("/api/agents/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
      });
      const data = await res.json();
      setBriefing(data);
    } catch {
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">AI Morning Briefing</span>
        </div>
        <div className="flex items-center gap-2">
          {briefing && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
          <Button
            size="sm"
            onClick={fetchBriefing}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {loading ? "Generating..." : briefing ? "Refresh" : "Get Briefing"}
          </Button>
        </div>
      </div>

      {!briefing && !loading && (
        <p className="text-sm text-muted-foreground mt-3">
          Click to get your personalized AI summary for today — schedule, finance,
          health, and learning in one shot.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Analyzing your data...
        </div>
      )}

      {briefing && expanded && (
        <div className="mt-4 space-y-3">
          <p className="text-base font-semibold text-primary">
            {briefing.greeting}
          </p>
          <p className="text-sm text-foreground font-medium">{briefing.headline}</p>
          <div className="space-y-2 pt-1">
            {[
              { label: "📅 Schedule", text: briefing.schedule },
              { label: "💰 Finance", text: briefing.finance },
              { label: "❤️ Health", text: briefing.health },
              { label: "📚 Learning", text: briefing.learning },
            ].map(({ label, text }) => (
              <div key={label} className="text-sm">
                <span className="font-medium text-muted-foreground">{label}: </span>
                <span className="text-foreground">{text}</span>
              </div>
            ))}
            {briefing.crossInsight && (
              <div className="text-sm bg-primary/10 border border-primary/20 rounded-lg p-3">
                <span className="font-medium text-primary">🔗 Pattern: </span>
                <span className="text-foreground">{briefing.crossInsight}</span>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-primary border-t border-border pt-3">
            {briefing.motivationalClose}
          </p>
        </div>
      )}
    </div>
  );
}
