import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt =
  "Employing a domestic worker in South Africa? Take the free 1-minute compliance check.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Attention-grabbing social/WhatsApp share card for the viral compliance
 * checker. A fear + curiosity hook plus a "quick, only 3 questions" promise so
 * people actually tap through and complete the check.
 */
export default function CheckOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0b1120 0%, #111827 55%, #1f2937 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Alert pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 22px",
              borderRadius: 999,
              background: "rgba(245, 158, 11, 0.16)",
              border: "1px solid rgba(245, 158, 11, 0.45)",
              color: "#fbbf24",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            ⚠️ ARE YOU COMPLIANT?
          </div>
        </div>

        {/* Hook */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              maxWidth: 1040,
            }}
          >
            Employing a domestic worker? You could be breaking the law.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 32,
              lineHeight: 1.3,
              color: "#cbd5e1",
              maxWidth: 980,
            }}
          >
            One CCMA dispute can cost up to 12 months&apos; wages. Most South African homeowners
            don&apos;t know they&apos;re at risk.
          </div>
        </div>

        {/* CTA row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 30px",
              borderRadius: 16,
              background: "#10b981",
              color: "#04231c",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            ✅ Free 1-minute check · just 3 questions
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{siteConfig.name}</div>
            <div style={{ fontSize: 24, color: "#94a3b8" }}>labourmate.co.za/check</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
