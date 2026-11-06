import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "DeclineKit: recover failed Stripe subscription payments";

// Same faces as the site: Newsreader for display, Public Sans for body.
const font = (file: string) => readFile(join(process.cwd(), "src/app/fonts", file));

export default async function OgImage() {
  const [newsMedium, newsSemi, sans, sansBold] = await Promise.all([
    font("Newsreader-Medium.ttf"),
    font("Newsreader-SemiBold.ttf"),
    font("PublicSans-Regular.ttf"),
    font("PublicSans-Bold.ttf"),
  ]);
  const row = (time: string, text: string, style: Record<string, string | number> = {}) => (
    <div style={{ display: "flex", alignItems: "baseline", fontSize: 24, padding: "9px 0" }}>
      <div style={{ display: "flex", width: 100, flexShrink: 0, color: "#4a5666" }}>{time}</div>
      <div style={{ display: "flex", flex: 1, color: "#16202c", ...style }}>{text}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#f6f8fa", display: "flex", padding: 70, gap: 60, alignItems: "center", fontFamily: "Public Sans" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 500 }}>
          <div style={{ fontFamily: "Newsreader", fontWeight: 600, fontSize: 38, color: "#1d3f8f", marginBottom: 24, letterSpacing: -0.5 }}>
            DeclineKit
          </div>
          <div style={{ fontFamily: "Newsreader", fontWeight: 500, fontSize: 64, color: "#16202c", lineHeight: 1.06, letterSpacing: -1 }}>
            Recover the subscriptions declined cards cost you.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #d7dde4", padding: 34, width: 540, borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 26, fontWeight: 700, borderBottom: "2px dashed #d7dde4", paddingBottom: 16, marginBottom: 12 }}>
            <div>Pro plan, monthly</div>
            <div style={{ fontFamily: "Newsreader", fontWeight: 600, fontSize: 34 }}>$49.00</div>
          </div>
          {row("Oct 2", "Charge declined: expired_card", { color: "#b4232c", fontWeight: 700 })}
          {row("Oct 2", "Card update email sent")}
          {row("Oct 5", "Customer added a new card")}
          {row("Oct 5", "Invoice paid: $49.00", { color: "#18794e", fontFamily: "Newsreader", fontWeight: 600, fontSize: 28 })}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Newsreader", data: newsMedium, weight: 500, style: "normal" },
        { name: "Newsreader", data: newsSemi, weight: 600, style: "normal" },
        { name: "Public Sans", data: sans, weight: 400, style: "normal" },
        { name: "Public Sans", data: sansBold, weight: 700, style: "normal" },
      ],
    },
  );
}
