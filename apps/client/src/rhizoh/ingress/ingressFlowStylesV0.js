/** Shared rhizoh.com ingress surface styles */
export const INGRESS_SURFACE_V0 = Object.freeze({
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "32px 24px",
    background: "linear-gradient(180deg, #050810 0%, #0a1220 100%)",
    color: "#d8e8f4",
    fontFamily: "Inter, system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto"
  },
  kicker: { fontSize: 11, letterSpacing: "0.12em", opacity: 0.65, margin: "0 0 8px" },
  title: { fontSize: 22, fontWeight: 600, margin: "0 0 16px", lineHeight: 1.35 },
  lead: { fontSize: 15, lineHeight: 1.6, opacity: 0.92, margin: "0 0 20px" },
  primaryBtn: (enabled) => ({
    background: enabled ? "#38bdf8" : "#334155",
    color: enabled ? "#041018" : "#94a3b8",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 600,
    fontSize: 14,
    cursor: enabled ? "pointer" : "not-allowed"
  }),
  link: { color: "#7dd3fc" }
});
