import type { Metadata } from "next";
import "./globals.css";
import "./starknet-theme.css";

export const metadata: Metadata = {
  title: "Gigstark — private creator payments on Starknet",
  description: "A non-custodial STRK20 interface for private creator payments on Starknet Mainnet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
