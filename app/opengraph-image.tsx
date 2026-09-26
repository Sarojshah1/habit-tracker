import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HabitTrack — Free Habit Tracker & Study Focus for Students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #081C15 0%, #1B4332 50%, #2D6A4F 100%)",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "white",
        }}
      >
        {/* Top Brand Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "#52B788",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 900,
              color: "#081C15",
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-1px" }}>
            Habit<span style={{ color: "#74C69D" }}>Track</span>
          </span>
          <div
            style={{
              marginLeft: 16,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(116, 198, 157, 0.2)",
              border: "1px solid rgba(116, 198, 157, 0.4)",
              color: "#D8F3DC",
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            100% Free For Students
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-2px",
              margin: 0,
              maxWidth: 960,
            }}
          >
            Build study habits that <br />
            <span style={{ color: "#74C69D" }}>shape your academic future</span>.
          </h1>
          <p
            style={{
              fontSize: 24,
              color: "#D8F3DC",
              margin: 0,
              maxWidth: 820,
              lineHeight: 1.4,
            }}
          >
            Schedule daily routines, maintain long study streaks, master deep focus with Pomodoro timers, and track performance analytics.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: "#B7E4C7", fontWeight: 700 }}>
            <span>🔥</span> Daily Streaks
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: "#B7E4C7", fontWeight: 700 }}>
            <span>⏱️</span> Pomodoro Focus
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: "#B7E4C7", fontWeight: 700 }}>
            <span>📅</span> Consistency Calendar
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, color: "#B7E4C7", fontWeight: 700 }}>
            <span>🎯</span> Academic Goals
          </div>
          <div style={{ marginLeft: "auto", fontSize: 18, color: "#74C69D", fontWeight: 800 }}>
            habittrack.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
