import { RhizohPlayRoom } from "./RhizohPlayRoom.jsx";
import React from "react";
import {
  Cpu,
  Activity,
  ShieldCheck,
  Radio,
  Sparkles,
  Zap,
  Binary,
  Clock
} from "lucide-react";

const VERIFIED_METRICS_V0 = [
  {
    id: "hce-baseline",
    label: "Golden Baseline Standard",
    value: "22.0 / 30 (73.3%)",
    subtext: "5-run median WAC 30 tactical resolution (Reference floor: 19.0/30)",
    status: "Verified",
    icon: Zap,
    color: "#f59e0b"
  },
  {
    id: "cross-platform-parity",
    label: "Linux / Windows Parity",
    value: "10 / 10 PASS",
    subtext: "100.0% bit-for-bit evaluation match (0 cp delta across Linux & Windows)",
    status: "Verified",
    icon: ShieldCheck,
    color: "#10b981"
  },
  {
    id: "architecture",
    label: "Engine Architecture",
    value: "Pure HCE (Golden Baseline 22.0)",
    subtext: "Material, PST, mobility, king safety · HCE Dominance Guard Verified (22.0/30)",
    status: "Active",
    icon: Binary,
    color: "#6366f1"
  },
  {
    id: "nnue-pipeline",
    label: "NNUE Training Pipeline",
    value: "Phase 1: Cloud Infra",
    subtext: "Autonomous cloud worker infrastructure in prep for next-gen weights",
    status: "Preparing",
    icon: Activity,
    color: "#38bdf8"
  }
];

/**
 * Clean English landing interface for rhizoh.com.
 * Replaces legacy translator integration and map viewports.
 * Strictly displays only the 4 verified telemetry benchmarks.
 */
export function RhizohUnifiedEntryScreen() {
  const [activeTab, setActiveTab] = React.useState("overview"); // 'overview' | 'play'
  return (
    <div
      data-rhizoh-surface="chess-landing"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 0%, #0c1830 0%, #050a14 55%, #020408 100%)",
        color: "#f1f5f9",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "32px 20px 80px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Navigation Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(148, 163, 184, 0.12)",
            borderRadius: 16,
            marginBottom: 48
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 18,
                color: "#020617",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.4)"
              }}
            >
              R
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "0.05em" }}>RHIZOH</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Autonomous Chess Intelligence</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Tab Navigation */}
            <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.35)", padding: 4, borderRadius: 10, border: "1px solid rgba(148, 163, 184, 0.15)" }}>
              <button
                onClick={() => setActiveTab("overview")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: activeTab === "overview" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                  color: activeTab === "overview" ? "#f8fafc" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                📊 Telemetry
              </button>
              <button
                onClick={() => setActiveTab("play")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: activeTab === "play" ? "#38bdf8" : "transparent",
                  color: activeTab === "play" ? "#020617" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: activeTab === "play" ? "0 0 12px rgba(56, 189, 248, 0.4)" : "none"
                }}
              >
                ⚔️ Play Room
              </button>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: 20,
                fontSize: 12,
                color: "#34d399",
                fontWeight: 600
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981"
                }}
              />
              HCE 21.0 Baseline
            </span>
          </div>
        </header>

        {activeTab === "play" ? (
          <RhizohPlayRoom onBackToMetrics={() => setActiveTab("overview")} />
        ) : (
          <>
        {/* Hero Section */}
        <section style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: 24,
              fontSize: 12,
              fontWeight: 700,
              color: "#38bdf8",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 16
            }}
          >
            <Sparkles size={14} /> Real-Time Developmental Telemetry
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 54px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 20px",
              background: "linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Rhizoh is learning chess.
          </h1>
          <p
            style={{
              maxWidth: 680,
              margin: "0 auto",
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "#94a3b8",
              lineHeight: 1.6
            }}
          >
            An autonomous chess engine operating on the verified Golden HCE 22.0 baseline (73.3% WAC 30),
            engineered for tactical precision and strict adherence to the HCE Dominance Guard while scaled cloud training infrastructure is being prepared.
          </p>
        </section>

        {/* Live Metrics Grid (Strictly 4 Verified Metrics) */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Live Training & Evaluation Metrics
            </h2>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Verified benchmarks · Zero contamination
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16
            }}
          >
            {VERIFIED_METRICS_V0.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  style={{
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)"
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: m.color
                        }}
                      >
                        <Icon size={18} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
                          {m.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "rgba(255, 255, 255, 0.06)",
                          color: "#cbd5e1"
                        }}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: "#f8fafc",
                        letterSpacing: "-0.02em",
                        marginBottom: 8
                      }}
                    >
                      {m.value}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      borderTop: "1px solid rgba(148, 163, 184, 0.08)",
                      paddingTop: 10,
                      marginTop: 4
                    }}
                  >
                    {m.subtext}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Future YouTube Live Stream Placeholder */}
        <section
          style={{
            background: "linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: 20,
            padding: "28px 24px",
            marginBottom: 48,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)"
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20
            }}
          >
            <div style={{ maxWidth: 540 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: 16,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#f87171",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  <Radio size={13} />
                  Status: Coming Soon (Offline)
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>YouTube Stream Integration</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#f8fafc" }}>
                Live Stream Broadcast Slot
              </h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Direct YouTube streaming of autonomous self-play sessions, real-time NNUE gradient updates,
                and engine benchmark gauntlets is currently being prepared.
              </p>
            </div>

            <div>
              <button
                type="button"
                disabled
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 12,
                  color: "#fca5a5",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "not-allowed",
                  opacity: 0.8
                }}
              >
                <Clock size={16} />
                Live Broadcast Coming Soon
              </button>
            </div>
          </div>
        </section>
          </>
        )}

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid rgba(148, 163, 184, 0.1)",
            paddingTop: 24,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#64748b",
            gap: 12
          }}
        >
          <div>
            © {new Date().getFullYear()} Rhizoh Chess Engine · Castle Platform
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span>Protocol: Zero-Contamination EPD Audit</span>
            <span>•</span>
            <span>Architecture: Pure HCE (Golden Baseline 22.0)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
