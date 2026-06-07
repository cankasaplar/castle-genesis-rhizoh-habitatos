/**
 * Full system report + localhost probe — single console entry for all gates, layers, audits.
 */

import { resolveDomainIdFromPathV0, RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainGateV0.js";
import { runDomainGateForPathV0, getRhizohNervousSystemConfigV0 } from "./rhizohDomainNervousSystemV0.js";
import { getRhizohDomainCoreSnapshotV0 } from "./rhizohDomainCoreStoreV0.js";
import { getDomainAdapterRegistrySnapshotV0 } from "./domainAdapterRegistryV0.js";
import { getControlPlaneSnapshotV0, getTensorAuditLogV0 } from "./rhizohControlPlaneV0.js";
import { getTruthTraceSnapshotV0 } from "./rhizohTruthTraceLayerV0.js";
import { getExplanationSnapshotV0 } from "./rhizohExplanationLayerV0.js";
import { getTraceSamplingSnapshotV0 } from "./rhizohTraceSamplingV0.js";
import { runLiveConsistencyAuditV0 } from "./rhizohLiveConsistencyAuditV0.js";
import { mapIntentToActionV0, invokeDomainCapabilityV0 } from "./rhizohTensorBridgeV0.js";
import { replayTensorIntentV0 } from "./rhizohTensorReplayV0.js";
import { emitSpatialEventFromDomainV0 } from "./rhizohSpatialEventEmitterV0.js";
import { listSpatialNodesV0, SPATIAL_NODE_TIER_V0 } from "./rhizohSpatialNodeLayerV0.js";
import { RHIZOH_DOMAIN_CAPABILITY_V0 } from "./rhizohDomainCapabilitySpecV0.js";
import { getWorldObservationIngressQueueSnapshotV0 } from "./worldObservationIngressQueueV0.js";
import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getSpatialReadyGateSnapshotV0 } from "./rhizohSpatialReadyGateV0.js";
import { auditDomainCoherenceV0, reconcileDomainPathCoherenceV0 } from "./rhizohDomainCoherenceV0.js";
import {
  emitSpatialTemporalTrailV0,
  getSpatialTemporalTrailSnapshotV0
} from "./rhizohSpatialTemporalTrailV0.js";
import { buildCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";
import { replayCausalChainV0 } from "./rhizohSpatialReplayEngineV0.js";
import { detectLiveConflictsV0 } from "./rhizohLiveConflictDetectorV0.js";
import { buildTurnBehaviorConsistencyFieldV0 } from "./turnBehaviorConsistencyFieldV0.js";
import { buildTurnBehavioralDriftReportV0 } from "./turnBehavioralDriftEngineV0.js";
import { buildCalibrationGovernorStateV0 } from "./rhizohCalibrationGovernorV0.js";
import { readTurnSovereigntyEnforcementModeV0 } from "./turnSovereigntyEnforcementModeV0.js";
import { getLastTurnSovereigntyV0 } from "./behavioralTurnSovereigntyV0.js";

export const RHIZOH_FULL_SYSTEM_REPORT_SCHEMA_V0 = "rhizoh.full_system_report.v0";

/** @type {boolean} */
let consoleMounted = false;

export const FULL_SYSTEM_PROBE_ROUTES_V0 = Object.freeze([
  { path: "/", domain: RHIZOH_DOMAIN_ID_V0.T0, label: "T0 Live" },
  { path: "/world/space", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "World Space" },
  { path: "/world/social", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "World Social" },
  { path: "/world/modes", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "World Modes" },
  { path: "/map", domain: RHIZOH_DOMAIN_ID_V0.WORLD, label: "Map Alias" },
  { path: "/hall/main", domain: RHIZOH_DOMAIN_ID_V0.CASTLE, label: "Castle Hall" },
  { path: "/greenroom/main", domain: RHIZOH_DOMAIN_ID_V0.CASTLE, label: "Castle Greenroom" },
  { path: "/broadcast/live", domain: RHIZOH_DOMAIN_ID_V0.CASTLE, label: "Castle Broadcast" },
  { path: "/studio", domain: RHIZOH_DOMAIN_ID_V0.STUDIO, label: "Studio" },
  { path: "/spiral", domain: RHIZOH_DOMAIN_ID_V0.STUDIO, label: "Studio Spiral" },
  { path: "/academy/observe", domain: RHIZOH_DOMAIN_ID_V0.OBSERVER, label: "Observer Academy" },
  { path: "/settings", domain: RHIZOH_DOMAIN_ID_V0.OBSERVER, label: "Observer Settings" }
]);

const WINDOW_SNAPSHOT_KEYS_V0 = [
  "__RHIZOH_NERVOUS_SYSTEM__",
  "__RHIZOH_DOMAIN_CORE__",
  "__RHIZOH_DOMAIN_ADAPTERS__",
  "__RHIZOH_CONTROL_PLANE__",
  "__RHIZOH_TRUTH_TRACE__",
  "__RHIZOH_EXPLANATION__",
  "__RHIZOH_LIVE_CONSISTENCY_AUDIT__",
  "__CASTLE_CESIUM__",
  "__RHIZOH_MAP_DIAG__",
  "__RHIZOH_WORLD_OBS__",
  "__RHIZOH_COMPANION_PRESENCE__",
  "__RHIZOH_OBSERVATION_FEED__"
];

/**
 * @returns {object}
 */
function collectWindowSnapshotsV0() {
  if (typeof window === "undefined") return Object.freeze({ available: false, keys: {} });
  const keys = {};
  for (const key of WINDOW_SNAPSHOT_KEYS_V0) {
    const val = window[key];
    if (val === undefined) {
      keys[key] = Object.freeze({ present: false });
    } else if (typeof val === "function") {
      keys[key] = Object.freeze({ present: true, type: "function" });
    } else {
      keys[key] = Object.freeze({
        present: true,
        type: typeof val,
        schema: val?.schema ?? null,
        summary: summarizeSnapshotV0(val)
      });
    }
  }
  return Object.freeze({ available: true, keys: Object.freeze(keys) });
}

/**
 * @param {unknown} val
 */
function summarizeSnapshotV0(val) {
  if (!val || typeof val !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (val);
  return Object.freeze({
    domain: o.domain ?? o.activeDomain ?? null,
    pathname: o.pathname ?? null,
    pass: o.pass ?? null,
    count: o.count ?? null,
    ready: o.ready ?? null,
    health: o.health?.propagation ?? o.propagation ?? null
  });
}

/**
 * Read-only probe — route resolution + dry-run replay, no state mutation.
 * Use for pass evaluation; live probe is opt-in via probeLive.
 */
export function runFullSystemProbeIsolatedV0() {
  const gateResults = [];
  let gatesPass = 0;

  for (const route of FULL_SYSTEM_PROBE_ROUTES_V0) {
    const resolved = resolveDomainIdFromPathV0(route.path);
    const domainMatch = resolved === route.domain;
    if (domainMatch) gatesPass += 1;
    gateResults.push(
      Object.freeze({
        path: route.path,
        label: route.label,
        expectedDomain: route.domain,
        resolvedDomain: resolved,
        domainMatch,
        gateOk: domainMatch,
        isolated: true,
        safeUiMode: null,
        propagation: "read_only",
        adaptersReady: null,
        error: null
      })
    );
  }

  const liveOps = [];
  const recordOp = (name, fn) => {
    try {
      const result = fn();
      const ok = result?.ok !== false || result?.deferred === true || result?.dryRun === true;
      liveOps.push(
        Object.freeze({ name, ok, isolated: true, result: compactResultV0(result) })
      );
    } catch (e) {
      liveOps.push(Object.freeze({ name, ok: false, isolated: true, error: String(e?.message || e) }));
    }
  };

  recordOp("tensor_replay_dry_run", () =>
    replayTensorIntentV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map", { dryRun: true })
  );
  recordOp("causal_chain_replay", () =>
    replayCausalChainV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map")
  );

  const liveOpsPass = liveOps.filter((o) => o.ok).length;
  const envBlockers = collectEnvBlockersV0();

  return Object.freeze({
    isolated: true,
    readOnly: true,
    gates: Object.freeze(gateResults),
    gatesPass,
    gatesTotal: gateResults.length,
    liveOps: Object.freeze(liveOps),
    liveOpsPass,
    liveOpsTotal: liveOps.length,
    consistencyAudit: null,
    envBlockers,
    pass:
      gatesPass === gateResults.length && liveOpsPass === liveOps.length && envBlockers.length === 0
  });
}

/**
 * Live probe — mutates runtime state (diagnostics only). Prefer isolated probe for pass.
 */
export function runFullSystemProbeV0() {
  const gateResults = [];
  let gatesPass = 0;

  for (const route of FULL_SYSTEM_PROBE_ROUTES_V0) {
    const resolved = resolveDomainIdFromPathV0(route.path);
    const domainMatch = resolved === route.domain;
    let gate = null;
    let gateOk = false;
    let error = null;
    try {
      gate = runDomainGateForPathV0(route.path);
      gateOk =
        domainMatch &&
        gate?.domain === route.domain &&
        gate?.tensor?.ok !== false &&
        Boolean(gate?.health?.gate);
    } catch (e) {
      error = String(e?.message || e);
    }
    if (gateOk) gatesPass += 1;
    gateResults.push(
      Object.freeze({
        path: route.path,
        label: route.label,
        expectedDomain: route.domain,
        resolvedDomain: resolved,
        domainMatch,
        gateOk,
        safeUiMode: gate?.safeUiMode === true,
        propagation: gate?.health?.propagation ?? null,
        adaptersReady: gate?.adaptersReady === true,
        error
      })
    );
  }

  const liveOps = [];
  const recordOp = (name, fn, opts = {}) => {
    try {
      const result = fn();
      const deferredOk =
        opts.acceptDeferred === true &&
        (result?.deferred === true ||
          result?.reason === "cesium_not_ready" ||
          result?.skipReason === "cesium_not_ready");
      const ok = result?.ok !== false || deferredOk;
      liveOps.push(
        Object.freeze({ name, ok, deferred: deferredOk, result: compactResultV0(result) })
      );
      return ok;
    } catch (e) {
      liveOps.push(Object.freeze({ name, ok: false, error: String(e?.message || e) }));
      return false;
    }
  };

  runDomainGateForPathV0("/world/space");
  recordOp("tensor_open_world_map", () =>
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.WORLD, { intent: "open_world_map" })
  );
  recordOp("tensor_replay_dry_run", () =>
    replayTensorIntentV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map")
  );
  recordOp("spatial_static_pin", () =>
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.STATIC,
      nodeId: "probe-pin-static",
      kind: "probe"
    })
  );
  recordOp("spatial_live_projection", () =>
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "probe-pin-live",
      kind: "avatar"
    })
  );
  recordOp(
    "adapter_spatial_probe",
    () =>
      invokeDomainCapabilityV0(RHIZOH_DOMAIN_ID_V0.WORLD, RHIZOH_DOMAIN_CAPABILITY_V0.SPATIAL, {
        op: "ensure_ready"
      }),
    { acceptDeferred: true }
  );
  recordOp("spatial_temporal_trail", () =>
    emitSpatialTemporalTrailV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      nodeId: "probe-trail-temporal",
      kind: "probe_trail",
      payload: { source: "full_system_probe" }
    })
  );
  recordOp("causal_chain_replay", () =>
    replayCausalChainV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map")
  );
  recordOp("castle_presence_signal", () => {
    runDomainGateForPathV0("/greenroom/main");
    return invokeDomainCapabilityV0(RHIZOH_DOMAIN_ID_V0.CASTLE, RHIZOH_DOMAIN_CAPABILITY_V0.PRESENCE, {
      action: "probe"
    });
  });

  const liveOpsPass = liveOps.filter((o) => o.ok).length;
  const audit = runLiveConsistencyAuditV0({ domain: RHIZOH_DOMAIN_ID_V0.WORLD });
  const envBlockers = collectEnvBlockersV0();

  return Object.freeze({
    isolated: false,
    readOnly: false,
    gates: Object.freeze(gateResults),
    gatesPass,
    gatesTotal: gateResults.length,
    liveOps: Object.freeze(liveOps),
    liveOpsPass,
    liveOpsTotal: liveOps.length,
    consistencyAudit: audit,
    envBlockers,
    pass:
      gatesPass === gateResults.length &&
      liveOpsPass === liveOps.length &&
      audit.pass &&
      envBlockers.length === 0
  });
}

function collectEpistemicSubstrateV0() {
  let turnSovereignty = null;
  try {
    turnSovereignty = getLastTurnSovereigntyV0();
  } catch {
    turnSovereignty = null;
  }
  let behaviorConsistency = null;
  let behavioralDrift = null;
  let calibrationGovernor = null;
  try {
    behaviorConsistency = buildTurnBehaviorConsistencyFieldV0();
    behavioralDrift = buildTurnBehavioralDriftReportV0();
    calibrationGovernor = buildCalibrationGovernorStateV0();
  } catch {
    /* optional layers */
  }
  return Object.freeze({
    stack: Object.freeze([
      "temporal",
      "causal",
      "replay",
      "conflict",
      "compression",
      "truth_loss",
      "turn_sovereignty",
      "drift_calibration"
    ]),
    turnSovereignty: turnSovereignty
      ? Object.freeze({
          sovereignReality: turnSovereignty.sovereignReality,
          selectionReason: turnSovereignty.selectionReason,
          enforcement: readTurnSovereigntyEnforcementModeV0()
        })
      : null,
    behaviorConsistency,
    behavioralDrift,
    calibrationGovernor,
    consoleApis: Object.freeze([
      "__RHIZOH_FULL_REPORT__()",
      "__rhizoh.causalMap",
      "__rhizoh.causalMapRaw",
      "__rhizoh.truthLoss",
      "__rhizoh.liveConflicts",
      "__rhizoh.behavioralDrift",
      "__rhizoh.calibrationGovernor",
      "__rhizoh.turnBehaviorConsistency",
      "__RHIZOH_REPLAY_CAUSAL__(domain, intent)"
    ])
  });
}

function collectWebsocketDiagnosticV0() {
  let cfg = {};
  try {
    cfg = getCastleFlightConfig();
  } catch {
    cfg = {};
  }
  const wsUrl = String(cfg.gatewayWsUrl || cfg.gatewayWs || "").trim();
  return Object.freeze({
    configured: Boolean(wsUrl),
    url: wsUrl || null,
    note:
      "Unexpected response code 200 on WS handshake = proxy/host not forwarding Upgrade (need 101). HTTP gateway can work while WS stays blocked.",
    castlePresenceBlockedUntilUpgrade: Boolean(wsUrl)
  });
}

function collectEnvBlockersV0() {
  const blockers = [];
  let cfg = {};
  try {
    cfg = getCastleFlightConfig();
  } catch {
    cfg = {};
  }
  if (!cfg.cesiumIonToken && !import.meta.env?.VITE_CESIUM_ION_TOKEN) {
    blockers.push("missing_VITE_CESIUM_ION_TOKEN");
  }
  const ingress = getWorldObservationIngressQueueSnapshotV0();
  if (ingress.authBlocked || !ingress.hasGatewayToken) {
    blockers.push("missing_or_invalid_VITE_GATEWAY_TOKEN");
  }
  return Object.freeze(blockers);
}

/**
 * @param {unknown} result
 */
function compactResultV0(result) {
  if (!result || typeof result !== "object") return result;
  const o = /** @type {Record<string, unknown>} */ (result);
  return Object.freeze({
    ok: o.ok,
    reason: o.reason ?? null,
    domain: o.domain ?? null,
    intent: o.intent ?? null,
    dryRun: o.dryRun ?? null,
    deferred: o.deferred ?? null
  });
}

/**
 * Full system report — snapshot + optional probe.
 * Pipeline: raw graph → compression → normalization metadata → audit → pass.
 * @param {{ probe?: boolean, probeLive?: boolean, probeIsolated?: boolean, audit?: boolean, restorePath?: boolean }} [opts]
 */
export function runFullSystemReportV0(opts = {}) {
  const pathname =
    typeof window !== "undefined" ? String(window.location.pathname || "/") : "/";
  const startedAt = Date.now();
  const useIsolatedProbe = opts.probe === true && opts.probeLive !== true;

  if (opts.probe !== false && typeof window !== "undefined") {
    runDomainGateForPathV0(pathname);
  }

  const probe = opts.probe
    ? useIsolatedProbe
      ? runFullSystemProbeIsolatedV0()
      : runFullSystemProbeV0()
    : null;

  if (opts.probe === true && !useIsolatedProbe && opts.restorePath !== false && typeof window !== "undefined") {
    runDomainGateForPathV0(pathname);
  }

  const causalMap = buildCausalMapLayerV0({ probeIsolated: useIsolatedProbe });

  const audit =
    opts.audit !== false
      ? runLiveConsistencyAuditV0({
          domain: resolveDomainIdFromPathV0(pathname)
        })
      : null;

  const domainCoherence = reconcileDomainPathCoherenceV0(pathname);
  const liveConflicts = detectLiveConflictsV0(pathname, { structuralOnly: true });

  const report = Object.freeze({
    schema: RHIZOH_FULL_SYSTEM_REPORT_SCHEMA_V0,
    atMs: Date.now(),
    durationMs: Date.now() - startedAt,
    location: Object.freeze({
      href: typeof window !== "undefined" ? window.location.href : null,
      pathname,
      host: typeof window !== "undefined" ? window.location.host : null
    }),
    env: getRhizohNervousSystemConfigV0(),
    envBlockers: collectEnvBlockersV0(),
    ingress: getWorldObservationIngressQueueSnapshotV0(),
    domainCore: getRhizohDomainCoreSnapshotV0(),
    adapters: getDomainAdapterRegistrySnapshotV0(),
    controlPlane: getControlPlaneSnapshotV0(),
    truthTrace: getTruthTraceSnapshotV0(),
    explanation: getExplanationSnapshotV0(),
    traceSampling: getTraceSamplingSnapshotV0(),
    tensorAuditCount: getTensorAuditLogV0().length,
    spatialNodes: Object.freeze({
      total: listSpatialNodesV0().length,
      static: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.STATIC).length,
      live: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.LIVE).length,
      temporal: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.TEMPORAL).length
    }),
    spatialReadyGate: getSpatialReadyGateSnapshotV0(),
    temporalTrail: getSpatialTemporalTrailSnapshotV0(),
    causalMap,
    liveConflicts,
    domainCoherence: auditDomainCoherenceV0(pathname),
    domainReconcile: domainCoherence,
    websocket: collectWebsocketDiagnosticV0(),
    epistemicSubstrate: collectEpistemicSubstrateV0(),
    evaluation: Object.freeze({
      structuralTruthPass: causalMap.truthLoss?.structuralPass !== false,
      compressionBudget: causalMap.truthLoss?.compressionBudget ?? null,
      compressionContext: causalMap.compressionContext ?? null,
      probeMode: probe?.isolated ? "isolated_read_only" : probe ? "live_mutating" : "none"
    }),
    windowSnapshots: collectWindowSnapshotsV0(),
    probe,
    audit,
    pass:
      causalMap.truthLoss?.structuralPass !== false &&
      (probe?.pass ?? true) &&
      (audit?.pass ?? true) &&
      domainCoherence.pass === true &&
      liveConflicts.structuralPass === true &&
      collectEnvBlockersV0().length === 0
  });

  if (typeof window !== "undefined") {
    window.__RHIZOH_FULL_SYSTEM_REPORT__ = report;
    window.dispatchEvent(
      new CustomEvent("rhizoh:full-system-report-v0", { detail: report })
    );
  }

  return report;
}

/**
 * Pretty-print report to console.
 * @param {ReturnType<typeof runFullSystemReportV0>} [report]
 */
export function printFullSystemReportV0(report) {
  const r = report || runFullSystemReportV0({ probe: false, audit: true });
  const lines = [
    "",
    "═══════════════════════════════════════════",
    "  RHIZOH FULL SYSTEM REPORT",
    "═══════════════════════════════════════════",
    `  path: ${r.location.pathname}`,
    `  domain: ${r.domainCore.activeDomain} (path→${r.domainCoherence?.expectedDomain ?? "?"})`,
    `  coherence: ${r.domainCoherence?.pass ? "✔ aligned" : `✘ ${(r.domainCoherence?.issues || []).join(", ")}`}`,
    `  pass: ${r.pass ? "✔ YES" : "✘ NO"}`,
    "───────────────────────────────────────────",
    "  ENV",
    `    gateway: ${r.env.gateway ? "✔" : "✘"}  cesium: ${r.env.cesium ? "✔" : "✘"}  worldLayer: ${r.env.worldLayer ? "✔" : "✘"}`,
    `    executionMode: ${r.env.executionMode}`,
    ...(r.envBlockers?.length
      ? ["  BLOCKERS", ...r.envBlockers.map((b) => `    ✘ ${b}`)]
      : []),
    ...(r.ingress?.authBlocked
      ? [`    ingress: paused (${r.ingress.authReason || "auth"})`]
      : []),
    "───────────────────────────────────────────",
    "  LAYERS",
    `    adapters.hydrated: ${r.adapters.hydrated}`,
    `    controlPlane: ${r.controlPlane?.health?.propagation ?? "n/a"}`,
    `    explanation: ${r.explanation.count} entries (${r.explanation.enabled ? "on" : "off"})`,
    `    spatial nodes: ${r.spatialNodes.total} (s:${r.spatialNodes.static} l:${r.spatialNodes.live} t:${r.spatialNodes.temporal})`,
    `    temporal trail: ${r.temporalTrail?.count ?? 0} markers`,
    `    causal map: ${r.causalMap?.nodeCount ?? 0} nodes / ${r.causalMap?.edgeCount ?? 0} edges (compressed:${r.causalMap?.compressed ? "yes" : "no"} ratio:${r.causalMap?.compression?.compressionRatio ?? 0})`,
    `    truth loss: ${
      r.evaluation?.structuralTruthPass
        ? `structural ok (intentional:${r.causalMap?.truthLoss?.intentionalLossCount ?? 0})`
        : `STRUCTURAL FAIL (${r.causalMap?.truthLoss?.structuralLossCount ?? 0})`
    }`,
    `    compression budget: ${r.evaluation?.compressionBudget?.withinBudget ? "within policy" : "review"}`,
    `    conflicts: ${r.liveConflicts?.structuralPass ? "none (structural)" : r.liveConflicts?.structuralConflictCount ?? 0}`,
    `    probe mode: ${r.evaluation?.probeMode ?? "none"}`,
    `    truthTrace: ${r.truthTrace.enabled ? "on" : "off"} (${r.truthTrace.count} entries)`,
    `    spatial gate: ${r.spatialReadyGate?.open ? "open" : "buffered"} (cesium:${r.spatialReadyGate?.cesiumReady ? "ready" : "pending"} buf:${r.spatialReadyGate?.buffered ?? 0})`,
    `    ws: ${r.websocket?.configured ? "configured" : "missing"} — ${r.websocket?.note ? "proxy may block 101" : ""}`,
    "───────────────────────────────────────────",
    "  EPISTEMIC SUBSTRATE",
    `    turn sovereignty: ${r.epistemicSubstrate?.turnSovereignty?.sovereignReality ?? "none"} (${r.epistemicSubstrate?.turnSovereignty?.enforcement ?? "log_only"})`,
    `    behavior consistency: ${r.epistemicSubstrate?.behaviorConsistency?.sampleSize ?? 0} turns`,
    `    behavioral drift: ${r.epistemicSubstrate?.behavioralDrift?.metrics?.identityCoherenceMetric ?? "n/a"} coherence`,
    `    calibration governor: ${r.epistemicSubstrate?.calibrationGovernor?.pendingCount ?? 0} pending`,
    `    truth loss narrative: ${r.causalMap?.truthLoss?.selfExplanation ?? "n/a"}`,
    `    compression narrative: ${r.evaluation?.compressionBudget?.narrative ?? "n/a"}`,
    `    conflict narrative: ${r.liveConflicts?.selfExplanation ?? "n/a"}`,
    "  CONSOLE APIS",
    ...(r.epistemicSubstrate?.consoleApis || []).map((api) => `    ${api}`),
    "───────────────────────────────────────────"
  ];

  if (r.probe) {
    lines.push("  GATE PROBE");
    for (const g of r.probe.gates) {
      lines.push(
        `    ${g.gateOk ? "✔" : "✘"} ${g.label.padEnd(18)} ${g.path} → ${g.resolvedDomain}`
      );
    }
    lines.push("  LIVE OPS");
    for (const op of r.probe.liveOps) {
      lines.push(`    ${op.ok ? "✔" : "✘"} ${op.name}`);
    }
    lines.push(`  audit: ${r.probe.consistencyAudit.pass ? "✔ consistent" : "✘ drift"}`);
  }

  if (r.audit && !r.probe) {
    lines.push("  CONSISTENCY AUDIT");
    for (const [key, axis] of Object.entries(r.audit.axes)) {
      lines.push(`    ${axis.pass ? "✔" : "✘"} ${key}`);
    }
  }

  lines.push("═══════════════════════════════════════════", "");
  const text = lines.join("\n");
  if (typeof console !== "undefined") console.log(text);
  return text;
}

/**
 * Mount console helpers (browser only).
 */
export function mountFullSystemReportConsoleV0() {
  if (typeof window === "undefined" || consoleMounted) return;
  consoleMounted = true;

  window.__RHIZOH_FULL_REPORT__ = async (opts = {}) => {
    const report = runFullSystemReportV0({
      probe: opts.probe === true,
      probeLive: opts.probeLive === true,
      probeIsolated: opts.probeIsolated !== false,
      audit: opts.audit !== false,
      restorePath: opts.restorePath !== false,
      ...opts
    });
    if (opts.print !== false) printFullSystemReportV0(report);
    return report;
  };
  window.__RHIZOH_PRINT_REPORT__ = printFullSystemReportV0;
  window.__RHIZOH_PROBE_GATES__ = runFullSystemProbeIsolatedV0;
  window.__RHIZOH_PROBE_GATES_LIVE__ = runFullSystemProbeV0;

  if (typeof console !== "undefined") {
    console.info(
      "[Rhizoh] Full report: await __RHIZOH_FULL_REPORT__()  |  Quick: __RHIZOH_PRINT_REPORT__()"
    );
  }
}

/** @internal vitest */
export function __resetFullSystemReportConsoleForTestV0() {
  consoleMounted = false;
}
