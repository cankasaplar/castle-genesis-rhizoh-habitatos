/**
 * Production UI labels — world mesh framing (no city-as-center).
 * @see docs/RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md (L2 reality chrome)
 */

export const WORLD_MESH_LABELS_V0 = Object.freeze({
  bootstrapPlaceName: "Istanbul",
  bootstrapWindowDisplay: "Bootstrap window · Istanbul",
  realMapViewport: "Observation map · bootstrap window",
  liveSignal: "Bootstrap window · Istanbul",
  welcomeHint: "Bootstrap observation active — open your node on the mesh.",
  meshFieldLayer: "Mesh field layer",
  academicsFieldDelta: "Field Δ",
  fieldEnergyNominal: "Field energy: nominal. Observation channels open.",
  /** L2 — de-city-identity chrome */
  realityModeGlobeDisplay: "Topology globe",
  realityModeRealMapDisplay: "Observation map",
  activeLayerChromeLabel: "Surface mode",
  cameraDeckDroneHint:
    "Drag to orbit · wheel zoom · middle-click pan. Observation map uses the bootstrap viewport.",
  flightHudIdleHint:
    "When the observation map is active, sim drones orbit; live pose via VITE_DRONE_TELEMETRY_WS.",
  layerL8DisplayName: "Mesh field index",
  layerL8Mission: "Mesh field index and district energy flow",
  layerL8Detail: "District energy, tower effects, and field texture on the observation surface",
  satelliteBootstrapLog: "SATELLITE_LINK: bootstrap tile · observation surface injected."
});

/** Locationless swarm observation — no city-as-story-center (L3). */
export function formatMeshSwarmFieldObservationV0(agentCount) {
  const n = Math.max(0, Number(agentCount) || 0);
  return `High-density field fluctuation observed on mesh. ${n} units in defensive formation protocol.`;
}

/** Neutral reality transition copy (L2). */
export function formatRealityTransitionLineV0(who, source, from, to, durationMs) {
  const dm = Number.isFinite(durationMs) ? ` (${durationMs}ms)` : "";
  const w = (who && String(who).trim()) || "Sen";
  const src = source || "APP";
  if (to === "REAL_MAP" && from === "GLOBE") {
    return `${w} · observation map surface (${src})${dm}`;
  }
  if (to === "GLOBE" && from === "REAL_MAP") {
    return `${w} · topology globe surface (${src})${dm}`;
  }
  return `${w} ${src}: ${from} → ${to}${dm}`;
}
