import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Gigstark — private creator settlement", description: "A non-custodial STRK20 creator escrow demo." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
