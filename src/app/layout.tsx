import type { Metadata } from "next";
import { CLOUD } from "@/lib/config";
import { Analytics } from "./analytics";
import { FirstTouch } from "./first-touch";
import { Newsreader, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Newsreader({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"] });
const body = Public_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: "DeclineKit: recover failed Stripe payments automatically",
  description:
    "When a subscription card is declined, DeclineKit emails your customer a link to update it and retries the charge. Install it from the Stripe App Marketplace in one click. Free until it recovers your first $100.",
  openGraph: { siteName: "DeclineKit", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        {CLOUD && <Analytics />}
        {CLOUD && <FirstTouch />}
      </body>
    </html>
  );
}
