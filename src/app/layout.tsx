import type { Metadata } from "next";
import "./globals.css";
import "./starknet-theme.css";

export const metadata: Metadata = {
  title: "Gigstark — encrypted messaging and private creator monetization",
  description: "Encrypted creator-member messaging, bounded STRK20 subscriptions, and verifiable creator monetization on Starknet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
