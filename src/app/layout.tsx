import type { Metadata } from "next";
import "./globals.css";
import "./starknet-theme.css";

export const metadata: Metadata = {
  title: "Gigstark — private verifiable settlement",
  description: "ZK-enforced freelance settlement with optional Oyster receipts on Starknet and STRK20.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
