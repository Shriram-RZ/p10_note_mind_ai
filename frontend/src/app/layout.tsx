import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NoteMind AI — Smart AI Notes & Learning Companion",
  description: "AI-powered productivity and learning ecosystem. Summarize lectures, generate smart notes, translate content, create flashcards, and chat with your notes.",
  keywords: ["AI notes", "lecture summarizer", "study companion", "flashcards", "mind maps"],
  openGraph: {
    title: "NoteMind AI",
    description: "Your AI-powered study and productivity companion",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
