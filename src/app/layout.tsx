import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gigstark — private verifiable settlement",
  description: "TEE-protected, ZK-bound freelance settlement on Starknet and STRK20.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
