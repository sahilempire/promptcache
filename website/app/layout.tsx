import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cachellm — Save 60-90% on LLM API costs",
  description:
    "Auto-optimize LLM prompt caching. One line of code, 60-90% savings on Claude, GPT & Gemini API bills. Zero dependencies, zero config.",
  keywords: [
    "llm", "prompt caching", "anthropic", "openai", "claude",
    "gpt", "cost optimization", "token savings", "npm", "typescript",
  ],
  openGraph: {
    title: "cachellm — Save 60-90% on LLM API costs",
    description: "Auto-optimize LLM prompt caching with one line of code.",
    url: "https://cache-llm.vercel.app",
    siteName: "cachellm",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "cachellm — Save 60-90% on LLM API costs",
    description: "Auto-optimize LLM prompt caching with one line of code.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#050505] text-[#d0d0d0]">
        {children}
      </body>
    </html>
  );
}
