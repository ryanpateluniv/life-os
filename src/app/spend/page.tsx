"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Trophy,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import BadgeShowcase from "@/components/BadgeShowcase";

const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Subscriptions",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f59e0b",
  Transport: "#3b82f6",
  Entertainment: "#8b5cf6",
  Shopping: "#ec4899",
  Health: "#10b981",
  Education: "#6366f1",
  Subscriptions: "#14b8a6",
  Other: "#6b7280",
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  note?: string;
  date: string;
};

type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
  weeklyLimit?: number;
};

type FinanceBadge = {
  id: string;
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
};

export default function SpendPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [badges, setBadges] = useState<FinanceBadge[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<null | {
    roast: string;
    topProblem: string;
    suggestions: string[];
    positives: string[];
  }>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [budgetForm, setBudgetForm] = useState({
    category: "Food",
    monthlyLimit: "",
    weeklyLimit: "",
  });

  const loadData = useCallback(async () => {
    const [expRes, budRes, badRes] = await Promise.all([
      fetch("/api/expenses?period=month"),
      fetch("/api/budgets"),
      fetch("/api/badges/finance"),
    ]);
    const [exp, bud, bad] = await Promise.all([
      expRes.json(),
      budRes.json(),
      badRes.json(),
    ]);
    setExpenses(exp);
    setBudgets(bud);
    setBadges(bad);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addExpense() {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const newExp = await res.json();

    // Check badges
    const badgeRes = await fetch("/api/badges/finance", { method: "POST" });
    const { awarded } = await badgeRes.json();
    if (awarded?.length > 0) {
      toast.success(`🏆 Badge earned: ${awarded.join(", ")}!`);
    }

    setExpenses((prev) => [newExp, ...prev]);
    setForm((p) => ({ ...p, amount: "", note: "" }));
    setShowForm(false);
    await loadData();
    toast.success("Expense logged!");
    setSubmitting(false);
  }

  async function saveBudget() {
    if (!budgetForm.monthlyLimit) {
      toast.error("Enter a monthly limit");
      return;
    }
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budgetForm),
    });
    await loadData();
    setShowBudgetForm(false);
    toast.success("Budget saved!");
  }

  async function deleteExpense(id: string) {
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  }

  async function getAIAnalysis() {
    setLoadingAnalysis(true);
    try {
      const res = await fetch("/api/agents/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: "month" }),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch {
      toast.error("Failed to get AI analysis");
    } finally {
      setLoadingAnalysis(false);
    }
  }

  // Compute stats
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  const pieData = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  const barData = CATEGORIES.filter((c) => byCategory[c]).map((c) => ({
    name: c.substring(0, 4),
    spent: Math.round(byCategory[c] || 0),
    budget: Math.round(
      budgets.find((b) => b.category === c)?.monthlyLimit || 0
    ),
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            Spend Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            ${totalSpent.toFixed(2)} spent this month
            {totalBudget > 0 && ` · $${totalBudget.toFixed(0)} budgeted`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBudgetForm(true)}
          >
            Set Budget
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Log Expense
          </Button>
        </div>
      </div>

      {/* Budget Status Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgets.map((budget) => {
            const spent = byCategory[budget.category] || 0;
            const pct = Math.min(100, Math.round((spent / budget.monthlyLimit) * 100));
            const over = spent > budget.monthlyLimit;
            return (
              <div
                key={budget.id}
                className={`p-4 rounded-xl border ${
                  over
                    ? "border-red-500/30 bg-red-500/5"
                    : pct >= 80
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{budget.category}</span>
                  {over ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : pct >= 80 ? (
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className={`text-xl font-bold ${
                      over ? "text-red-400" : pct >= 80 ? "text-amber-400" : "text-foreground"
                    }`}
                  >
                    ${spent.toFixed(0)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / ${budget.monthlyLimit}
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={`h-1.5 ${over ? "[&>div]:bg-red-400" : pct >= 80 ? "[&>div]:bg-amber-400" : "[&>div]:bg-emerald-400"}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {over
                    ? `$${(spent - budget.monthlyLimit).toFixed(0)} over budget`
                    : `$${(budget.monthlyLimit - spent).toFixed(0)} remaining`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="ai">AI Roast</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-4 space-y-2">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No expenses this month. Log your first one!</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-all"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[exp.category] || "#6b7280",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{exp.category}</span>
                    {exp.note && (
                      <span className="text-xs text-muted-foreground truncate">
                        · {exp.note}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(exp.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  ${exp.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => deleteExpense(exp.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="charts" className="mt-4 space-y-6">
          {pieData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Log expenses to see charts
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold mb-4">Spending by Category</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${Math.round((percent || 0) * 100)}%`
                        }
                        labelLine={false}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name] || "#6b7280"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: unknown) => typeof value === 'number' ? `$${value.toFixed(2)}` : '$0'}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold mb-4">Spent vs. Budget</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <Tooltip
                        formatter={(value: unknown) => typeof value === 'number' ? `$${value}` : '$0'}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="budget" fill="#1e1e2e" radius={4} name="Budget" />
                      <Bar dataKey="spent" fill="#6366f1" radius={4} name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold mb-3">Monthly Summary</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-400">
                      ${totalSpent.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">
                      ${totalBudget.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Budgeted</p>
                  </div>
                  <div>
                    <p
                      className={`text-2xl font-bold ${
                        totalBudget - totalSpent >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      ${Math.abs(totalBudget - totalSpent).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {totalBudget - totalSpent >= 0 ? "Remaining" : "Over Budget"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="ai" className="mt-4 space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-amber-400">
                  AI Money Roast
                </span>
              </div>
              <Button
                size="sm"
                onClick={getAIAnalysis}
                disabled={loadingAnalysis}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
              >
                {loadingAnalysis ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {loadingAnalysis ? "Analyzing..." : "Roast My Spending"}
              </Button>
            </div>
            <p className="text-sm text-amber-400/70">
              Get a brutally honest AI analysis of your spending habits. No sugarcoating.
            </p>
          </div>

          {aiAnalysis && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-semibold text-red-400 mb-2">
                  🔥 The Verdict
                </p>
                <p className="text-sm text-foreground">{aiAnalysis.roast}</p>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <p className="text-sm font-semibold text-amber-400 mb-2">
                  ⚠ Biggest Problem
                </p>
                <p className="text-sm text-foreground">{aiAnalysis.topProblem}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <p className="text-sm font-semibold mb-2">💡 Fix It</p>
                <ul className="space-y-1">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-primary shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              {aiAnalysis.positives?.length > 0 && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-sm font-semibold text-emerald-400 mb-2">
                    ✅ What You Did Right
                  </p>
                  <ul className="space-y-1">
                    {aiAnalysis.positives.map((p, i) => (
                      <li key={i} className="text-sm text-foreground">
                        · {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <BadgeShowcase
            badges={badges.map((b) => ({
              ...b,
              type: "finance",
            }))}
            emptyText="Keep logging expenses and staying under budget to earn badges!"
          />
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount ($) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v ?? p.category }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: CATEGORY_COLORS[c] }}
                      />
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input
                placeholder="What was it for?"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={addExpense} disabled={submitting} className="flex-1">
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Log Expense"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget Form Dialog */}
      <Dialog open={showBudgetForm} onOpenChange={setShowBudgetForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={budgetForm.category}
                onValueChange={(v) =>
                  setBudgetForm((p) => ({ ...p, category: v ?? p.category }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Limit ($)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 300"
                value={budgetForm.monthlyLimit}
                onChange={(e) =>
                  setBudgetForm((p) => ({ ...p, monthlyLimit: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Weekly Limit ($) — optional</Label>
              <Input
                type="number"
                min="0"
                placeholder="Auto: monthly ÷ 4"
                value={budgetForm.weeklyLimit}
                onChange={(e) =>
                  setBudgetForm((p) => ({ ...p, weeklyLimit: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBudgetForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={saveBudget} className="flex-1">
                Save Budget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
