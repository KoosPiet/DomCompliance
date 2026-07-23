import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamically-rendered social share image (Open Graph + Twitter). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #10b981 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🛡️
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Are you legally compliant?
        </div>
        <div style={{ marginTop: 28, fontSize: 34, opacity: 0.9, maxWidth: 900 }}>
          {siteConfig.tagline}
        </div>
        <div style={{ marginTop: 48, fontSize: 26, opacity: 0.85 }}>
          Take the FREE 2-minute compliance check →
        </div>
      </div>
    ),
    { ...size },
  );
}
