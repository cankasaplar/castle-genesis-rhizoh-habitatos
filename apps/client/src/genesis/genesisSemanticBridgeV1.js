/**
 * Deterministik semantic bridge: operasyonel olay / hub sinyali → Academy anchor.
 * Çıkarım yok, AI yok — yalnızca tablo eşlemesi.
 */

export const GENESIS_SEMANTIC_BRIDGE_SCHEMA = "castle.genesis.semantic_bridge.v1";

/** Academy rotası — hash ile anchor */
export const GENESIS_ACADEMY_PATH = "/genesis/academy";

/** @readonly Kararlı DOM / URL fragment id'leri */
export const SEMANTIC_ANCHOR = Object.freeze({
  seq: "seq",
  checkpointVsStream: "checkpoint-vs-stream",
  snorm: "snorm",
  resolverBundle: "resolver-bundle",
  tickAdvanced: "tick-advanced",
  sealIssued: "seal-issued",
  ledgerAdvanced: "ledger-advanced",
  replayState: "replay-state",
  presenceMesh: "presence-mesh",
  infraHealth: "infra-health",
  spiralWs: "spiral-ws",
  replayFingerprint: "replay-fingerprint",
  runtimeCapabilityEvent: "runtime-capability",
  streamTransport: "stream-transport",
  sseErrors: "sse-errors",
  healthLive: "health-live",
  runtimeSurface: "runtime-surface",
  checkpointTools: "checkpoint-tools",
  epistemicField: "epistemic-field",
  diagnostics: "diagnostics",
  continuityUnknown: "continuity-unknown"
});

/**
 * @param {string} anchorId
 * @returns {string}
 */
export function academyHashHref(anchorId) {
  const id = String(anchorId || "").trim().replace(/^#/, "");
  return `${GENESIS_ACADEMY_PATH}#${id}`;
}

/** @type {Record<string, { meaning: string, anchor: string }>} */
const CONTINUITY_EVENT_MAP = {
  TickAdvanced: { meaning: "temporal_progression", anchor: SEMANTIC_ANCHOR.tickAdvanced },
  SealIssued: { meaning: "epistemic_seal_surface", anchor: SEMANTIC_ANCHOR.sealIssued },
  LedgerAdvanced: { meaning: "ledger_acceptance_line", anchor: SEMANTIC_ANCHOR.ledgerAdvanced },
  ReplayState: { meaning: "replay_alignment_signal", anchor: SEMANTIC_ANCHOR.replayState },
  PresenceMesh: { meaning: "presence_room_continuity", anchor: SEMANTIC_ANCHOR.presenceMesh },
  InfraHealth: { meaning: "gateway_infra_score", anchor: SEMANTIC_ANCHOR.infraHealth },
  SpiralWebSocket: { meaning: "spiral_transport_fanout", anchor: SEMANTIC_ANCHOR.spiralWs },
  ReplayFingerprint: { meaning: "runtime_fingerprint_digest", anchor: SEMANTIC_ANCHOR.replayFingerprint },
  RuntimeCapabilityEvent: { meaning: "capability_surface_delta", anchor: SEMANTIC_ANCHOR.runtimeCapabilityEvent }
};

/**
 * @param {string} type — `castle.genesis.continuity_event.v0` `type` alanı
 * @returns {{ schema: string, eventType: string, meaning: string, explanationRef: string, anchorId: string }}
 */
export function explainContinuityEventType(type) {
  const t = String(type || "").trim();
  const row = CONTINUITY_EVENT_MAP[t];
  const anchor = row?.anchor || SEMANTIC_ANCHOR.continuityUnknown;
  const meaning = row?.meaning || "unmapped_continuity_kind";
  return {
    schema: GENESIS_SEMANTIC_BRIDGE_SCHEMA,
    eventType: t || "unknown",
    meaning,
    explanationRef: academyHashHref(anchor),
    anchorId: anchor
  };
}

/**
 * Hub diagnostics satırı → Academy anchor (metin eşlemesi değil, tür anahtarı).
 * @param {"health" | "runtime" | "poll" | "sse" | "origin"} kind
 */
export function explainHubDiagnosticKind(kind) {
  const k = String(kind || "").trim();
  const map = {
    health: SEMANTIC_ANCHOR.healthLive,
    runtime: SEMANTIC_ANCHOR.runtimeSurface,
    poll: SEMANTIC_ANCHOR.streamTransport,
    sse: SEMANTIC_ANCHOR.sseErrors,
    origin: SEMANTIC_ANCHOR.resolverBundle
  };
  const anchor = map[k] || SEMANTIC_ANCHOR.diagnostics;
  return {
    schema: GENESIS_SEMANTIC_BRIDGE_SCHEMA,
    kind: k,
    explanationRef: academyHashHref(anchor),
    anchorId: anchor
  };
}
