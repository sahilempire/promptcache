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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
