import { ImageResponse } from "next/og";

export const alt = "ApplyFocus: know if you fit before you apply";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#181818",
          color: "#FFFFFF",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#BC4A32",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            AF
          </div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>ApplyFocus</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, fontWeight: 600, lineHeight: 1 }}>
          <div>Know if you fit</div>
          <div style={{ color: "#9B9B9B" }}>before you apply</div>
        </div>
        <div style={{ fontSize: 28, color: "#B8B8B8" }}>
          Evidence based fit analysis for job seekers
        </div>
      </div>
    ),
    size,
  );
}
