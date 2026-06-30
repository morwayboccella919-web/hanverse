import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { MockApiProvider } from "@/components/mock-api-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "HanVerse — AI中文口语评分",
  description: "用AI给你的中文口语打分，即时反馈发音、语调和流利度",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("font-sans", geistSans.variable)}>
      <body className="antialiased min-h-screen bg-background">
        <MockApiProvider />
        {children}
      </body>
    </html>
  );
}
