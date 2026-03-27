"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Task = {
  id: string;
  title: string;
  deadline?: string;
  priority: string;
  category: string;
  status: string;
};

type ClassSchedule = {
  id: string;
  courseName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  color: string;
};

type ScheduledBlock = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  color?: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRIORITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
};
const CATEGORY_ICONS: Record<string, string> = {
  study: "📚",
  personal: "👤",
  health: "❤️",
  work: "💼",
};

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [scheduledBlocks, setScheduledBlocks] = useState<ScheduledBlock[]>([]);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) =>
        setClasses(
          data.map((c: ClassSchedule & { daysOfWeek: string }) => ({
            ...c,
            daysOfWeek:
              typeof c.daysOfWeek === "string"
                ? JSON.parse(c.daysOfWeek)
                : c.daysOfWeek,
          }))
        )
      );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fetch(`/api/schedule?date=${today.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.blocks) setScheduledBlocks(data.blocks);
      })
      .catch(() => {});
  }, []);

  function getWeekDates(date: Date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  function getTasksForDate(date: Date) {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return (
        d.toDateString() === date.toDateString() && t.status !== "completed"
      );
    });
  }

  function getClassesForDay(dayName: string) {
    return classes.filter((c) => c.daysOfWeek.includes(dayName));
  }

  const weekDates = getWeekDates(currentDate);
  const today = new Date();

  function navigate(direction: number) {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {viewMode === "week"
              ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : currentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
        </div>
      </div>

      {viewMode === "week" ? (
        /* Week View */
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDates.map((date, i) => {
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={i}
                  className={`p-3 text-center cursor-pointer transition-colors ${
                    isToday ? "bg-primary/10" : "hover:bg-secondary"
                  }`}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewMode("day");
                  }}
                >
                  <p className="text-xs text-muted-foreground">{DAYS[i]}</p>
                  <p
                    className={`text-sm font-semibold mt-0.5 ${
                      isToday ? "text-primary" : ""
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Events */}
          <div className="grid grid-cols-7 min-h-32">
            {weekDates.map((date, i) => {
              const dayName = DAYS[i];
              const dayTasks = getTasksForDate(date);
              const dayClasses = getClassesForDay(dayName);
              const isToday = date.toDateString() === today.toDateString();

              return (
                <div
                  key={i}
                  className={`p-2 min-h-32 border-r border-border last:border-r-0 space-y-1 ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  {dayClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="text-[10px] px-1.5 py-1 rounded font-medium truncate"
                      style={{
                        backgroundColor: cls.color + "20",
                        color: cls.color,
                        border: `1px solid ${cls.color}30`,
                      }}
                    >
                      {cls.courseName}
                      <br />
                      <span className="opacity-70">
                        {cls.startTime}–{cls.endTime}
                      </span>
                    </div>
                  ))}
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-[10px] px-1.5 py-1 rounded font-medium truncate"
                      style={{
                        backgroundColor:
                          PRIORITY_COLORS[
                            task.priority as keyof typeof PRIORITY_COLORS
                          ] + "20",
                        color:
                          PRIORITY_COLORS[
                            task.priority as keyof typeof PRIORITY_COLORS
                          ],
                        border: `1px solid ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}30`,
                      }}
                    >
                      {CATEGORY_ICONS[task.category] || "•"} {task.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Day View */
        <DayView
          date={currentDate}
          tasks={getTasksForDate(currentDate)}
          classes={getClassesForDay(DAYS[currentDate.getDay()])}
          scheduledBlocks={
            currentDate.toDateString() === today.toDateString()
              ? scheduledBlocks
              : []
          }
        />
      )}
    </div>
  );
}

function DayView({
  date,
  tasks,
  classes,
  scheduledBlocks,
}: {
  date: Date;
  tasks: Task[];
  classes: ClassSchedule[];
  scheduledBlocks: ScheduledBlock[];
}) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm

  function timeToFraction(timeStr: string) {
    const [h, m] = timeStr.split(":").map(Number);
    return (h - 7) * 60 + m; // minutes from 7am
  }

  const totalMinutes = 16 * 60;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="relative" style={{ minHeight: "600px" }}>
        {/* Hour lines */}
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/50 flex"
            style={{ top: `${((h - 7) / 16) * 100}%` }}
          >
            <span className="text-[10px] text-muted-foreground w-12 pl-2 -mt-2 shrink-0">
              {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
            </span>
          </div>
        ))}

        {/* Events area */}
        <div className="ml-12 relative" style={{ height: "600px" }}>
          {/* Classes */}
          {classes.map((cls) => {
            const top = (timeToFraction(cls.startTime) / totalMinutes) * 100;
            const height =
              ((timeToFraction(cls.endTime) - timeToFraction(cls.startTime)) /
                totalMinutes) *
              100;
            return (
              <div
                key={cls.id}
                className="absolute left-1 right-1 rounded px-2 py-1 text-xs font-medium overflow-hidden"
                style={{
                  top: `${top}%`,
                  height: `${Math.max(height, 3)}%`,
                  backgroundColor: cls.color + "30",
                  color: cls.color,
                  border: `1px solid ${cls.color}50`,
                }}
              >
                {cls.courseName}
                <br />
                <span className="opacity-70 text-[10px]">
                  {cls.startTime}–{cls.endTime}
                </span>
              </div>
            );
          })}

          {/* Task deadlines */}
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className="absolute right-1 rounded px-2 py-1 text-[10px] font-medium"
              style={{
                top: `${(i * 5 + 2)}%`,
                left: "40%",
                backgroundColor:
                  PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] +
                  "20",
                color:
                  PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS],
                border: `1px solid ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}30`,
              }}
            >
              ⚑ {task.title}
            </div>
          ))}

          {/* AI Scheduled blocks */}
          {scheduledBlocks.map((block) => {
            const top = (timeToFraction(block.startTime) / totalMinutes) * 100;
            const height =
              ((timeToFraction(block.endTime) - timeToFraction(block.startTime)) /
                totalMinutes) *
              100;
            return (
              <div
                key={block.id}
                className="absolute left-1 rounded px-2 py-1 text-[10px] font-medium overflow-hidden"
                style={{
                  top: `${top}%`,
                  height: `${Math.max(height, 3)}%`,
                  width: "38%",
                  backgroundColor: (block.color || "#6366f1") + "30",
                  color: block.color || "#6366f1",
                  border: `1px solid ${block.color || "#6366f1"}50`,
                }}
              >
                ⚡ {block.title}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
