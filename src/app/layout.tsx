import type { Metadata } from "next";
import "./globals.css";
import "./qualifying-route.css";
import "./starknet-theme.css";
import "./hackathon-polish.css";

export const metadata: Metadata = {
  title: "ZeeroStream — private creator payments on Starknet",
  description: "A non-custodial STRK20 interface for private creator payments on Starknet Mainnet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
