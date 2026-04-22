import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cachellm — Save 60-90% on LLM API costs",
  description:
    "Auto-optimize LLM prompt caching. One line of code, 60-90% savings on Claude, GPT & Gemini API bills.",
  openGraph: {
    title: "cachellm — Save 60-90% on LLM API costs",
    description: "Auto-optimize LLM prompt caching with one line of code.",
    url: "https://cache-llm.vercel.app",
    siteName: "cachellm",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
