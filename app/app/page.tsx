"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Download,
  AlertTriangle,
  X,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import type { Subscription, Category, BillingCycle } from "@/lib/types";
import {
  loadSubscriptions,
  saveSubscriptions,
  exportCSV,
  loadFeedback,
  saveFeedback,
  hasVoted,
  markVoted,
} from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";

type SortKey = "name" | "cost" | "project" | "unused";

const CATEGORIES: Category[] = ["API", "SaaS", "Infrastructure", "Other"];
const CATEGORY_COLORS: Record<Category, string> = {
  API: "#3b82f6",
  SaaS: "#f97316",
  Infrastructure: "#22c55e",
  Other: "#a855f7",
};

export default function AppPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortAsc, setSortAsc] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formCycle, setFormCycle] = useState<BillingCycle>("monthly");
  const [formCategory, setFormCategory] = useState<Category>("SaaS");
  const [formProject, setFormProject] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formUnused, setFormUnused] = useState(false);

  // Feedback state
  const [feedbackVote, setFeedbackVote] = useState<"yes" | "no" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [feedbackYesCount, setFeedbackYesCount] = useState(0);

  useEffect(() => {
    setSubs(loadSubscriptions());
    setAlreadyVoted(hasVoted());
    const fb = loadFeedback();
    setFeedbackYesCount(fb.yes);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveSubscriptions(subs);
  }, [subs, loaded]);

  const existingProjects = useMemo(
    () => [...new Set(subs.map((s) => s.project).filter(Boolean))],
    [subs]
  );

  const stats = useMemo(() => {
    const active = subs.filter((s) => !s.unused);
    const unused = subs.filter((s) => s.unused);
    const totalMonthly = subs.reduce((sum, s) => sum + s.costMonthly, 0);
    const wastedMonthly = unused.reduce((sum, s) => sum + s.costMonthly, 0);
    return {
      totalMonthly,
      totalAnnual: totalMonthly * 12,
      activeCount: active.length,
      wastedMonthly,
    };
  }, [subs]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of subs) {
      map[s.category] = (map[s.category] || 0) + s.costMonthly;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [subs]);

  const projectBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of subs) {
      const key = s.project || "Unassigned";
      map[key] = (map[key] || 0) + s.costMonthly;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [subs]);

  const sortedSubs = useMemo(() => {
    const sorted = [...subs].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cost":
          return b.costMonthly - a.costMonthly;
        case "project":
          return (a.project || "").localeCompare(b.project || "");
        case "unused":
          return Number(b.unused) - Number(a.unused);
      }
    });
    return sortAsc ? sorted.reverse() : sorted;
  }, [subs, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCost("");
    setFormCycle("monthly");
    setFormCategory("SaaS");
    setFormProject("");
    setFormNotes("");
    setFormUnused(false);
  };

  const handleAdd = () => {
    const cost = parseFloat(formCost);
    if (!formName.trim() || isNaN(cost) || cost <= 0) return;
    const costMonthly = formCycle === "annual" ? cost / 12 : cost;
    const sub: Subscription = {
      id: crypto.randomUUID(),
      name: formName.trim(),
      costMonthly: Math.round(costMonthly * 100) / 100,
      billingCycle: formCycle,
      originalCost: cost,
      category: formCategory,
      project: formProject.trim(),
      notes: formNotes.trim(),
      unused: formUnused,
      createdAt: new Date().toISOString(),
    };
    setSubs((prev) => [...prev, sub]);
    trackEvent("subscription_added");
    resetForm();
    setShowForm(false);
  };

  const toggleUnused = (id: string) => {
    setSubs((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (!s.unused) trackEvent("subscription_marked_unused");
          return { ...s, unused: !s.unused };
        }
        return s;
      })
    );
  };

  const deleteSub = (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleExport = useCallback(() => {
    exportCSV(subs);
    trackEvent("csv_exported");
  }, [subs]);

  const handleFeedback = (vote: "yes" | "no") => {
    setFeedbackVote(vote);
    const fb = loadFeedback();
    if (vote === "yes") fb.yes++;
    else fb.no++;
    saveFeedback(fb);
    setFeedbackYesCount(fb.yes);
  };

  const submitFeedback = () => {
    if (feedbackComment.trim()) {
      const fb = loadFeedback();
      fb.comments.push(feedbackComment.trim());
      saveFeedback(fb);
    }
    markVoted();
    setFeedbackSubmitted(true);
    setAlreadyVoted(true);
  };

  const maxCategoryValue = categoryBreakdown.length > 0 ? categoryBreakdown[0][1] : 1;
  const maxProjectValue = projectBreakdown.length > 0 ? projectBreakdown[0][1] : 1;

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#141414]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-white">Dev Expense Tracker</span>
          <Link href="/" className="flex items-center gap-1 text-sm text-[#a3a3a3] hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Dashboard Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border border-white/10 bg-[#141414]">
            <CardContent className="p-4">
              <p className="text-xs text-[#a3a3a3]">Monthly Burn</p>
              <p className="font-mono-num text-2xl font-bold text-white">${stats.totalMonthly.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-[#141414]">
            <CardContent className="p-4">
              <p className="text-xs text-[#a3a3a3]">Annual Burn</p>
              <p className="font-mono-num text-2xl font-bold text-white">${stats.totalAnnual.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-[#141414]">
            <CardContent className="p-4">
              <p className="text-xs text-[#a3a3a3]">Active Subscriptions</p>
              <p className="font-mono-num text-2xl font-bold text-white">{stats.activeCount}</p>
            </CardContent>
          </Card>
          <Card className="border border-[#f97316]/30 bg-[#141414]">
            <CardContent className="p-4">
              <p className="text-xs text-[#f97316]">Wasted / mo</p>
              <p className="font-mono-num text-2xl font-bold text-[#f97316]">${stats.wastedMonthly.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Unused Alert */}
        {stats.wastedMonthly > 0 && (
          <Card className="mb-8 border border-[#f97316]/30 bg-[#1a1a1a]">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-[#f97316]" />
              <p className="text-sm text-[#f97316]">
                You are wasting{" "}
                <span className="font-mono-num font-bold">${stats.wastedMonthly.toFixed(2)}/mo</span>{" "}
                on {subs.filter((s) => s.unused).length} unused subscription
                {subs.filter((s) => s.unused).length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#f97316] text-white hover:bg-[#ea680c]"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Subscription
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-white/10 text-[#a3a3a3] hover:text-white"
            disabled={subs.length === 0}
          >
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Add Subscription Form */}
        {showForm && (
          <Card className="mb-8 border border-white/10 bg-[#1a1a1a]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg text-white">Add Subscription</CardTitle>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-[#a3a3a3] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-[#a3a3a3]">Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vercel Pro"
                  className="mt-1 border-white/10 bg-[#141414] text-white"
                />
              </div>
              <div>
                <Label className="text-[#a3a3a3]">
                  Cost ({formCycle === "annual" ? "$/year" : "$/month"}) *
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formCost}
                  onChange={(e) => setFormCost(e.target.value)}
                  placeholder="19.99"
                  className="font-mono-num mt-1 border-white/10 bg-[#141414] text-white"
                />
              </div>
              <div>
                <Label className="text-[#a3a3a3]">Billing Cycle</Label>
                <div className="mt-1 flex gap-2">
                  <Button
                    type="button"
                    variant={formCycle === "monthly" ? "default" : "outline"}
                    onClick={() => setFormCycle("monthly")}
                    className={formCycle === "monthly" ? "bg-[#f97316] text-white hover:bg-[#ea680c]" : "border-white/10 text-[#a3a3a3]"}
                    size="sm"
                  >
                    Monthly
                  </Button>
                  <Button
                    type="button"
                    variant={formCycle === "annual" ? "default" : "outline"}
                    onClick={() => setFormCycle("annual")}
                    className={formCycle === "annual" ? "bg-[#f97316] text-white hover:bg-[#ea680c]" : "border-white/10 text-[#a3a3a3]"}
                    size="sm"
                  >
                    Annual
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[#a3a3a3]">Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as Category)}>
                  <SelectTrigger className="mt-1 border-white/10 bg-[#141414] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1a1a1a]">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-white hover:bg-[#141414]">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#a3a3a3]">Project</Label>
                {existingProjects.length > 0 ? (
                  <Select value={formProject} onValueChange={setFormProject}>
                    <SelectTrigger className="mt-1 border-white/10 bg-[#141414] text-white">
                      <SelectValue placeholder="Select or type below" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#1a1a1a]">
                      {existingProjects.map((p) => (
                        <SelectItem key={p} value={p} className="text-white hover:bg-[#141414]">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                <Input
                  value={formProject}
                  onChange={(e) => setFormProject(e.target.value)}
                  placeholder="e.g. my-saas-app"
                  className={`${existingProjects.length > 0 ? "mt-2" : "mt-1"} border-white/10 bg-[#141414] text-white`}
                />
              </div>
              <div>
                <Label className="text-[#a3a3a3]">Notes</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="mt-1 border-white/10 bg-[#141414] text-white"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setFormUnused(!formUnused)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${formUnused ? "bg-[#f97316]" : "bg-[#333]"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${formUnused ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <Label className="text-[#a3a3a3]">Mark as unused/dormant</Label>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleAdd} className="bg-[#f97316] text-white hover:bg-[#ea680c]">
                  Add Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscriptions List */}
        {subs.length > 0 && (
          <Card className="mb-8 border border-white/10 bg-[#141414]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Sort buttons */}
              <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
                {(["cost", "name", "project", "unused"] as SortKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${sortKey === key ? "bg-[#f97316]/20 text-[#f97316]" : "text-[#a3a3a3] hover:text-white"}`}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
              <div className="divide-y divide-white/5">
                {sortedSubs.map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-center gap-4 px-4 py-3 ${sub.unused ? "opacity-60" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{sub.name}</span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: CATEGORY_COLORS[sub.category], color: CATEGORY_COLORS[sub.category] }}
                        >
                          {sub.category}
                        </Badge>
                        {sub.unused && (
                          <Badge className="bg-[#f97316]/20 text-xs text-[#f97316]">Unused</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-[#a3a3a3]">
                        {sub.project && <span>Project: {sub.project}</span>}
                        <span>{sub.billingCycle === "annual" ? `$${sub.originalCost.toFixed(2)}/yr` : `$${sub.originalCost.toFixed(2)}/mo`}</span>
                        {sub.notes && <span className="truncate max-w-[200px]">{sub.notes}</span>}
                      </div>
                    </div>
                    <div className="font-mono-num text-right text-lg font-bold text-white">
                      ${sub.costMonthly.toFixed(2)}
                      <span className="text-xs font-normal text-[#a3a3a3]">/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleUnused(sub.id)}
                        title={sub.unused ? "Mark as active" : "Mark as unused"}
                        className={`rounded p-1 text-xs ${sub.unused ? "text-[#22c55e] hover:text-[#16a34a]" : "text-[#a3a3a3] hover:text-[#f97316]"}`}
                      >
                        {sub.unused ? "Activate" : "Unused"}
                      </button>
                      <button
                        onClick={() => deleteSub(sub.id)}
                        className="rounded p-1 text-[#a3a3a3] hover:text-[#ef4444]"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {subs.length === 0 && !showForm && (
          <Card className="mb-8 border border-white/10 bg-[#141414]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[#a3a3a3]">No subscriptions yet. Add your first one to start tracking.</p>
            </CardContent>
          </Card>
        )}

        {/* Breakdowns */}
        {subs.length > 0 && (
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {/* Category Breakdown */}
            <Card className="border border-white/10 bg-[#141414]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">By Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryBreakdown.map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">{cat}</span>
                      <span className="font-mono-num text-white">${amount.toFixed(2)}/mo</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(amount / maxCategoryValue) * 100}%`,
                          backgroundColor: CATEGORY_COLORS[cat as Category] || "#a3a3a3",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Project Breakdown */}
            <Card className="border border-white/10 bg-[#141414]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">By Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectBreakdown.map(([proj, amount]) => (
                  <div key={proj}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">{proj}</span>
                      <span className="font-mono-num text-white">${amount.toFixed(2)}/mo</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                      <div
                        className="h-full rounded-full bg-[#f97316]"
                        style={{ width: `${(amount / maxProjectValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Widget */}
        <Card className="mb-8 border border-white/10 bg-[#1a1a1a]">
          <CardContent className="p-6">
            {alreadyVoted || feedbackSubmitted ? (
              <div className="text-center">
                <p className="text-sm text-[#a3a3a3]">Thanks for the feedback!</p>
                {feedbackYesCount > 0 && (
                  <p className="mt-1 text-xs text-[#a3a3a3]">
                    <span className="font-mono-num text-white">{feedbackYesCount}</span> people found this tool helpful
                  </p>
                )}
              </div>
            ) : feedbackVote ? (
              <div className="space-y-3">
                <p className="text-sm text-[#a3a3a3]">Any suggestions?</p>
                <Textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="border-white/10 bg-[#141414] text-white"
                  rows={2}
                />
                <Button onClick={submitFeedback} className="bg-[#f97316] text-white hover:bg-[#ea680c]" size="sm">
                  Submit
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-3 text-sm text-white">Was this tool helpful?</p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleFeedback("yes")}
                    className="border-white/10 text-white hover:bg-[#141414]"
                  >
                    👍 Yes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleFeedback("no")}
                    className="border-white/10 text-white hover:bg-[#141414]"
                  >
                    👎 No
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-[#a3a3a3]">
        Built by visieasy.com &bull; Solving real problems, fast
      </footer>
    </div>
  );
}
