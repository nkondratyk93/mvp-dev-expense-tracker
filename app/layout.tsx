import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev Expense Tracker — Stop Bleeding Money on Forgotten Subscriptions",
  description:
    "Track every SaaS tool, API, and infra cost across your indie projects. Local-first dashboard with project grouping and waste detection. No signup.",
  openGraph: {
    title:
      "Dev Expense Tracker — Stop Bleeding Money on Forgotten Subscriptions",
    description:
      "Track every SaaS tool, API, and infra cost across your indie projects. Local-first dashboard with project grouping and waste detection. No signup.",
    url: "https://dev-expense-tracker.visieasy.com",
    siteName: "visieasy.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Dev Expense Tracker — Stop Bleeding Money on Forgotten Subscriptions",
    description:
      "Track every SaaS tool, API, and infra cost across your indie projects. Local-first dashboard with project grouping and waste detection. No signup.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0f0f0f] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {children}
        <GoogleAnalytics gaId="G-XHZ6T0YRK0" />
      </body>
    </html>
  );
}
