import { Subscription, FeedbackData } from "./types";

const STORAGE_KEY = "dev-expense-tracker-data";
const FEEDBACK_KEY = "feedback_dev-expense-tracker";
const FEEDBACK_VOTED_KEY = "feedback_dev-expense-tracker_voted";

export function loadSubscriptions(): Subscription[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Subscription[];
  } catch {
    return [];
  }
}

export function saveSubscriptions(subs: Subscription[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

export function loadFeedback(): FeedbackData {
  if (typeof window === "undefined") return { yes: 0, no: 0, comments: [] };
  const raw = localStorage.getItem(FEEDBACK_KEY);
  if (!raw) return { yes: 0, no: 0, comments: [] };
  try {
    return JSON.parse(raw) as FeedbackData;
  } catch {
    return { yes: 0, no: 0, comments: [] };
  }
}

export function saveFeedback(data: FeedbackData) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(data));
}

export function hasVoted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FEEDBACK_VOTED_KEY) === "true";
}

export function markVoted() {
  localStorage.setItem(FEEDBACK_VOTED_KEY, "true");
}

export function exportCSV(subs: Subscription[]): void {
  const headers = ["Name", "Monthly Cost", "Original Cost", "Billing Cycle", "Category", "Project", "Notes", "Unused", "Created"];
  const rows = subs.map((s) => [
    s.name,
    s.costMonthly.toFixed(2),
    s.originalCost.toFixed(2),
    s.billingCycle,
    s.category,
    s.project,
    `"${s.notes.replace(/"/g, '""')}"`,
    s.unused ? "Yes" : "No",
    s.createdAt,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dev-expenses.csv";
  a.click();
  URL.revokeObjectURL(url);
}
