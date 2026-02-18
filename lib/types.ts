export type BillingCycle = "monthly" | "annual";
export type Category = "API" | "SaaS" | "Infrastructure" | "Other";

export interface Subscription {
  id: string;
  name: string;
  costMonthly: number;
  billingCycle: BillingCycle;
  originalCost: number;
  category: Category;
  project: string;
  notes: string;
  unused: boolean;
  createdAt: string;
}

export interface FeedbackData {
  yes: number;
  no: number;
  comments: string[];
}
