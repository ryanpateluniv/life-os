"use client";

import { useRef } from "react";
import { Trophy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Badge = {
  id: string;
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  type: "finance" | "health" | "learning";
};

const TYPE_COLORS = {
  finance: { bg: "from-amber-500/20", border: "border-amber-500/30", text: "text-amber-400" },
  health: { bg: "from-rose-500/20", border: "border-rose-500/30", text: "text-rose-400" },
  learning: { bg: "from-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400" },
};

export default function BadgeShowcase({
  badges,
  emptyText,
}: {
  badges: Badge[];
  emptyText?: string;
}) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  async function downloadBadge(badge: Badge) {
    const { default: html2canvas } = await import("html2canvas");
    const el = cardRefs.current[badge.id];
    if (!el) return;
    const canvas = await html2canvas(el, {
      backgroundColor: "#0f0f1a",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `lifeos-badge-${badge.badgeKey}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{emptyText || "No badges yet. Keep going!"}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => {
        const colors = TYPE_COLORS[badge.type] || TYPE_COLORS.finance;
        return (
          <div key={badge.id} className="relative group">
            <div
              ref={(el) => {
                cardRefs.current[badge.id] = el;
              }}
              className={`p-5 rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} via-card to-card`}
            >
              <div className="text-4xl mb-3">{badge.icon}</div>
              <p className={`font-bold ${colors.text}`}>{badge.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {badge.description}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-2 font-mono">
                Life OS · Earned{" "}
                {new Date(badge.earnedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity gap-1 h-7 text-xs"
              onClick={() => downloadBadge(badge)}
            >
              <Download className="w-3 h-3" />
              Save
            </Button>
          </div>
        );
      })}
    </div>
  );
}
