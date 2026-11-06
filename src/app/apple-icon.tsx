import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same mark as icon.svg, rendered as PNG for iOS home screens.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#1d3f8f", display: "flex", position: "relative" }}>
        <div style={{ position: "absolute", left: 25, top: 48, width: 107, height: 73, background: "#fff", borderRadius: 11, display: "flex" }} />
        <div style={{ position: "absolute", left: 25, top: 65, width: 107, height: 14, background: "#16202c", display: "flex" }} />
        <div style={{ position: "absolute", left: 39, top: 96, width: 34, height: 8, background: "#c3cad3", borderRadius: 4, display: "flex" }} />
        <div style={{ position: "absolute", left: 93, top: 90, width: 68, height: 68, background: "#18794e", border: "8px solid #1d3f8f", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="34" height="28" viewBox="0 0 34 28"><path d="M3 15l9 9L31 4" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    ),
    size,
  );
}
