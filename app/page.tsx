"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, LayoutDashboard, AlertTriangle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const features = [
  {
    icon: Shield,
    title: "Zero Signup",
    description: "All data stays in your browser. No accounts, no backend, no tracking of your financial data.",
  },
  {
    icon: LayoutDashboard,
    title: "Project Breakdown",
    description: "Group expenses by project. See exactly how much each side-project is costing you per month.",
  },
  {
    icon: AlertTriangle,
    title: "Waste Detector",
    description: "Mark subscriptions as unused and see your total wasted spend highlighted front and center.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1a1a] px-4 py-1.5 text-sm text-[#a3a3a3]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" />
          Local-first &middot; No signup required
        </div>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Stop Bleeding Money on Forgotten Subscriptions
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[#a3a3a3]">
          Track every SaaS tool, API, and infra cost across your projects. Local-first, no signup.
        </p>
        <Link href="/app" onClick={() => trackEvent("cta_click", "try_it_now")}>
          <Button className="mt-8 bg-[#f97316] px-8 py-6 text-lg font-semibold text-white hover:bg-[#ea680c]">
            Track My Expenses &rarr;
          </Button>
        </Link>
      </section>

      {/* Feature cards */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 pb-16 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="border border-white/10 bg-[#141414]">
            <CardContent className="p-6">
              <f.icon className="mb-4 h-8 w-8 text-[#f97316]" />
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-[#a3a3a3]">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-2xl px-4 pb-20 text-center">
        <Card className="border border-white/10 bg-[#1a1a1a]">
          <CardContent className="p-8">
            <p className="text-lg italic text-[#a3a3a3]">
              &ldquo;I feel like I&apos;m bleeding money on tools I forgot I subscribed to, or APIs I&apos;m not monitoring.&rdquo;
            </p>
            <p className="mt-4 text-sm font-medium text-white">— Indie Dev on Twitter</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-[#a3a3a3]">
        Built by visieasy.com &bull; Solving real problems, fast
      </footer>
    </div>
  );
}
