/**
 * Perception alignment snapshot — read-only merge of three camera lenses + drift guardrail.
 * @see docs/CAMERA_UNIFICATION_SPEC_V1.md
 *
 * Invariants:
 * - READ ONLY — never calls router, executor, or Octo camera mutators
 * - Deterministic — same normalized input → same contract output
 * - Drift explanations never imply causality without explicit command evidence
 */

import { mapFieldStateToOctoEmotionV1, deriveOctoMotionDriveV1 } from "../studio/octoConversationMotionV1.js";
import {
  resolveRhizohHabitatFocusModeV0,
  resolveRhizohHabitatFocusVisualsV0
} from "../rhizoh/runtime/rhizohHabitatFocusModeV0.js";

export const CAMERA_COORDINATE_CONTRACT_SCHEMA_V0 = "castle.camera_coordinate_contract.v0";
export const PERCEPTION_ALIGNMENT_SNAPSHOT_SCHEMA_V0 = "castle.perception_alignment_snapshot.v0";

export const ALIGNMENT_DRIFT_RISK_V0 = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

/** Sources that may legitimately mutate spatial state during an active session. */
export const USER_SPATIAL_EXECUTOR_SOURCES_V0 = Object.freeze([
  "registry",
  "world_map_tool",
  "dsl_spawn_castle",
  "camera_deck",
  "rhizoh_directive",
  "comms_directive",
  "broadcast_focus",
  "broadcast_presence",
  "transcript_jump",
  "layer_quick",
  "boot_engine_ready",
  "reality_chrome_v0",
  "world_first_observation",
  "direct"
]);

const TIME_SKEW_WARN_MS_V0 = 250;
const TIME_SKEW_HIGH_MS_V0 = 500;
const SPATIAL_UNDER_CONVERSATION_WINDOW_MS_V0 = 500;

const SEVERITY_RANK_V0 = Object.freeze({ low: 1, medium: 2, high: 3 });

/**
 * @param {number} atMs
 */
export function normalizeAlignmentTickMsV0(atMs) {
  const n = Number(atMs) || 0;
  return Math.floor(n / 100) * 100;
}

/**
 * @param {{
 *   atMs?: number,
 *   perceptionCapturedAtMs?: number,
 *   spatialCapturedAtMs?: number,
 *   presentationCapturedAtMs?: number
 * }} input
 */
export function normalizeAlignmentTimeSyncV0(input = {}) {
  const canonicalAtMs = normalizeAlignmentTickMsV0(input.atMs ?? 0);
  const perceptionAtMs = Number(input.perceptionCapturedAtMs ?? canonicalAtMs) || canonicalAtMs;
  const spatialAtMs = Number(input.spatialCapturedAtMs ?? canonicalAtMs) || canonicalAtMs;
  const presentationAtMs = Number(input.presentationCapturedAtMs ?? canonicalAtMs) || canonicalAtMs;
  const skews = [
    Math.abs(perceptionAtMs - canonicalAtMs),
    Math.abs(spatialAtMs - canonicalAtMs),
    Math.abs(presentationAtMs - canonicalAtMs)
  ];
  const maxSkewMs = Math.max(...skews, 0);
  return Object.freeze({
    canonicalAtMs,
    perceptionAtMs,
    spatialAtMs,
    presentationAtMs,
    maxSkewMs
  });
}

/**
 * @param {number} [nowMs]
 */
export function readSpatialLensSnapshotV0(nowMs = 0) {
  const capturedAtMs = Number(nowMs) || 0;
  if (typeof window === "undefined") {
    return Object.freeze({
      capturedAtMs,
      frame: "wgs84",
      ready: false,
      geo: null,
      lastExecutorOp: null,
      lastExecutorOk: false,
      lastExecutorAtMs: null,
      lastExecutorSource: null,
      realityMode: null,
      mapSurfaceActive: null
    });
  }

  const executor = window.__CASTLE_CESIUM_EXECUTOR__?.last || null;
  const cesium = window.__CASTLE_CESIUM__ || null;
  let geo = null;
  try {
    geo = cesium?.getCameraGeo?.() || null;
  } catch {
    geo = null;
  }

  return Object.freeze({
    capturedAtMs,
    frame: "wgs84",
    ready: cesium?.ready === true,
    geo: geo
      ? Object.freeze({
          lat: Number(geo.lat),
          lon: Number(geo.lon),
          height: Number(geo.height)
        })
      : null,
    lastExecutorOp: executor?.op ? String(executor.op) : null,
    lastExecutorOk: executor?.ok === true,
    lastExecutorAtMs: Number(executor?.atMs) || null,
    lastExecutorSource: executor?.meta?.source ? String(executor.meta.source) : null,
    realityMode: null,
    mapSurfaceActive: null
  });
}

/**
 * @param {{
 *   atMs?: number,
 *   fieldState?: string,
 *   replyText?: string,
 *   draftText?: string,
 *   busy?: boolean,
 *   cubeFocus?: { x?: number, y?: number, z?: number },
 *   mountId?: string,
 *   capturedAtMs?: number
 * }} input
 */
export function buildPerceptionLensSnapshotV0(input = {}) {
  const fieldState = String(input.fieldState || "IDLE").toUpperCase();
  const emotion = mapFieldStateToOctoEmotionV1(fieldState);
  const drive = deriveOctoMotionDriveV1({
    fieldState,
    replyText: input.replyText,
    draftText: input.draftText,
    busy: input.busy
  });
  const cube = input.cubeFocus || {};
  const x = Number.isFinite(Number(cube.x)) ? Number(cube.x) : 0;
  const y = Number.isFinite(Number(cube.y)) ? Number(cube.y) : 0.12;
  const z = Number.isFinite(Number(cube.z)) ? Number(cube.z) : 0.14;

  return Object.freeze({
    capturedAtMs: Number(input.capturedAtMs ?? input.atMs ?? 0) || 0,
    frame: "cube_local",
    cubeCentric: true,
    fieldState,
    octoDrive: String(drive.swimMode || emotion),
    octoEmotion: String(emotion),
    cubeFocus: Object.freeze({ x, y, z }),
    mountId: String(input.mountId || "unknown")
  });
}

/**
 * @param {{
 *   atMs?: number,
 *   habitatMode?: string,
 *   productSurface?: string,
 *   realityMode?: string,
 *   worldMapTool?: string,
 *   fieldState?: string,
 *   hasReply?: boolean,
 *   hasDraft?: boolean,
 *   voiceListening?: boolean,
 *   capturedAtMs?: number
 * }} input
 */
export function buildPresentationLensSnapshotV0(input = {}) {
  const habitatMode =
    input.habitatMode ||
    resolveRhizohHabitatFocusModeV0({
      fieldState: input.fieldState,
      hasReply: input.hasReply,
      hasDraft: input.hasDraft,
      voiceListening: input.voiceListening,
      worldMapTool: input.worldMapTool,
      productSurface: input.productSurface,
      realityMode: input.realityMode
    });
  const visuals = resolveRhizohHabitatFocusVisualsV0(habitatMode);

  return Object.freeze({
    capturedAtMs: Number(input.capturedAtMs ?? input.atMs ?? 0) || 0,
    frame: "screen_css",
    habitatMode,
    octoHeightPx: visuals.octoHeightPx,
    octoHeightMaxPx: visuals.octoHeightMaxPx,
    chatScale: visuals.chatScale,
    chatOpacity: visuals.chatOpacity,
    chatZIndex: visuals.chatZIndex,
    wheelOpacity: visuals.wheelOpacity,
    showMapStrip: visuals.showMapStrip
  });
}

/**
 * @param {{
 *   code: string,
 *   severity: "low" | "medium" | "high",
 *   message: string,
 *   evidence?: object,
 *   causalClaim?: boolean,
 *   guardrail?: string
 * }} row
 */
function explainDriftV0(row) {
  return Object.freeze({
    code: String(row.code),
    severity: row.severity,
    message: String(row.message),
    evidence: row.evidence ? Object.freeze({ ...row.evidence }) : Object.freeze({}),
    causalClaim: row.causalClaim === true,
    guardrail: String(row.guardrail || "observe_only")
  });
}

/**
 * @param {ReturnType<typeof buildPerceptionAlignmentSnapshotV0>} snapshot
 */
export function computeAlignmentDriftV0(snapshot) {
  const explanations = [];
  const contract = snapshot?.contract;
  if (!contract) {
    return Object.freeze({
      semanticDriftRisk: ALIGNMENT_DRIFT_RISK_V0.LOW,
      guardrailActive: false,
      blockFalseCorrelation: true,
      explanations: Object.freeze([]),
      notes: Object.freeze(["missing_contract"])
    });
  }

  const { perception, spatial, presentation, focus, timeSync } = contract;
  const atMs = contract.atMs;

  if (timeSync.maxSkewMs >= TIME_SKEW_HIGH_MS_V0) {
    explanations.push(
      explainDriftV0({
        code: "P2_TIME_SKEW_HIGH",
        severity: "medium",
        message: "Lens capture times diverged beyond alignment window; snapshot is observational only.",
        evidence: { maxSkewMs: timeSync.maxSkewMs, thresholdMs: TIME_SKEW_HIGH_MS_V0 },
        causalClaim: false,
        guardrail: "downgrade_correlation_confidence"
      })
    );
  } else if (timeSync.maxSkewMs >= TIME_SKEW_WARN_MS_V0) {
    explanations.push(
      explainDriftV0({
        code: "P2_TIME_SKEW_WARN",
        severity: "low",
        message: "Minor lens time skew; correlation is tick-normalized, not causal.",
        evidence: { maxSkewMs: timeSync.maxSkewMs },
        causalClaim: false,
        guardrail: "observe_only"
      })
    );
  }

  const expectedEmotion = mapFieldStateToOctoEmotionV1(perception.fieldState);
  if (
    perception.octoEmotion &&
    expectedEmotion &&
    perception.octoEmotion !== expectedEmotion &&
    perception.fieldState === "IDLE"
  ) {
    explanations.push(
      explainDriftV0({
        code: "P2_PERCEPTION_FIELD_EMOTION_MISMATCH",
        severity: "low",
        message: "Octo emotion does not match IDLE fieldState mapping.",
        evidence: {
          fieldState: perception.fieldState,
          octoEmotion: perception.octoEmotion,
          expectedEmotion
        },
        causalClaim: false,
        guardrail: "observe_only"
      })
    );
  }

  if (
    presentation.showMapStrip === true &&
    spatial.ready === false &&
    String(focus.realityMode || "").toUpperCase() === "REAL_MAP"
  ) {
    explanations.push(
      explainDriftV0({
        code: "P2_PRESENTATION_AHEAD_OF_SPATIAL",
        severity: "medium",
        message: "UI shows map strip while Cesium spatial lens is not ready.",
        evidence: {
          showMapStrip: presentation.showMapStrip,
          spatialReady: spatial.ready,
          realityMode: focus.realityMode
        },
        causalClaim: false,
        guardrail: "block_false_correlation"
      })
    );
  }

  const spatialOp = spatial.lastExecutorOp;
  const spatialSource = spatial.lastExecutorSource;
  const spatialAt = spatial.lastExecutorAtMs;
  const userSpatial =
    spatialSource && USER_SPATIAL_EXECUTOR_SOURCES_V0.includes(spatialSource);

  if (
    focus.habitatMode === "conversation" &&
    spatialOp &&
    spatialAt != null &&
    Math.abs(atMs - spatialAt) <= SPATIAL_UNDER_CONVERSATION_WINDOW_MS_V0 &&
    !userSpatial
  ) {
    explanations.push(
      explainDriftV0({
        code: "P2_FALSE_CORRELATION_SPATIAL_UNDER_CONVERSATION",
        severity: "high",
        message:
          "Spatial executor activity coincides with conversation focus without a user spatial source — do not infer causality.",
        evidence: {
          habitatMode: focus.habitatMode,
          lastExecutorOp: spatialOp,
          lastExecutorSource: spatialSource,
          deltaMs: Math.abs(atMs - spatialAt)
        },
        causalClaim: false,
        guardrail: "block_false_correlation"
      })
    );
  }

  if (snapshot.knownMountIds?.length > 1) {
    const uniqueMounts = new Set(snapshot.knownMountIds);
    if (uniqueMounts.size > 1) {
      explanations.push(
        explainDriftV0({
          code: "P2_OCTO_MOUNT_FRAGMENTATION",
          severity: "high",
          message: "Multiple Octo mounts reported; perception truth is not unified.",
          evidence: { mountIds: [...uniqueMounts] },
          causalClaim: false,
          guardrail: "block_false_correlation"
        })
      );
    }
  }

  if (
    spatialOp === "zoom_in" &&
    spatial.lastExecutorOk === true &&
    spatial.geo &&
    snapshot.priorSpatialHeight != null &&
    snapshot.priorSpatialHeight === spatial.geo.height
  ) {
    explanations.push(
      explainDriftV0({
        code: "P2_SPATIAL_STALE_AFTER_ZOOM",
        severity: "low",
        message: "Executor reported zoom success but camera height unchanged in snapshot.",
        evidence: {
          height: spatial.geo.height,
          priorHeight: snapshot.priorSpatialHeight
        },
        causalClaim: false,
        guardrail: "observe_only"
      })
    );
  }

  let semanticDriftRisk = ALIGNMENT_DRIFT_RISK_V0.LOW;
  for (const ex of explanations) {
    if (ex.severity === "high") semanticDriftRisk = ALIGNMENT_DRIFT_RISK_V0.HIGH;
    else if (ex.severity === "medium" && semanticDriftRisk !== ALIGNMENT_DRIFT_RISK_V0.HIGH) {
      semanticDriftRisk = ALIGNMENT_DRIFT_RISK_V0.MEDIUM;
    }
  }

  const blockFalseCorrelation = explanations.some(
    (ex) => ex.guardrail === "block_false_correlation" || ex.guardrail === "downgrade_correlation_confidence"
  );
  const guardrailActive =
    semanticDriftRisk !== ALIGNMENT_DRIFT_RISK_V0.LOW || blockFalseCorrelation;

  return Object.freeze({
    semanticDriftRisk,
    guardrailActive,
    blockFalseCorrelation,
    explanations: Object.freeze(explanations),
    notes: Object.freeze(
      guardrailActive
        ? ["alignment_is_observational_not_causal"]
        : ["alignment_coherent_within_lens_contract"]
    )
  });
}

/**
 * Deterministic alignment snapshot — pass explicit lens inputs (preferred for tests).
 * @param {{
 *   atMs: number,
 *   correlationId?: string,
 *   focus?: object,
 *   perception?: ReturnType<typeof buildPerceptionLensSnapshotV0>,
 *   spatial?: ReturnType<typeof readSpatialLensSnapshotV0>,
 *   presentation?: ReturnType<typeof buildPresentationLensSnapshotV0>,
 *   knownMountIds?: string[],
 *   priorSpatialHeight?: number | null
 * }} input
 */
export function buildPerceptionAlignmentSnapshotV0(input = {}) {
  const timeSync = normalizeAlignmentTimeSyncV0({
    atMs: input.atMs,
    perceptionCapturedAtMs: input.perception?.capturedAtMs,
    spatialCapturedAtMs: input.spatial?.capturedAtMs,
    presentationCapturedAtMs: input.presentation?.capturedAtMs
  });

  const focus = Object.freeze({
    habitatMode: String(input.focus?.habitatMode || input.presentation?.habitatMode || "navigation"),
    productSurface: String(input.focus?.productSurface || "world"),
    realityMode: String(input.focus?.realityMode || "GLOBE").toUpperCase(),
    worldMapTool: String(input.focus?.worldMapTool || "globe")
  });

  const perception =
    input.perception ||
    buildPerceptionLensSnapshotV0({ atMs: timeSync.canonicalAtMs, fieldState: "IDLE" });
  const spatial =
    input.spatial ||
    readSpatialLensSnapshotV0(timeSync.canonicalAtMs);
  const presentation =
    input.presentation ||
    buildPresentationLensSnapshotV0({ atMs: timeSync.canonicalAtMs, habitatMode: focus.habitatMode });

  const contractWithoutAlignment = Object.freeze({
    schema: CAMERA_COORDINATE_CONTRACT_SCHEMA_V0,
    correlationId: String(input.correlationId || `align-${timeSync.canonicalAtMs}`),
    atMs: timeSync.canonicalAtMs,
    timeSync,
    focus,
    perception: Object.freeze({ ...perception }),
    spatial: Object.freeze({
      ...spatial,
      realityMode: spatial.realityMode ?? focus.realityMode,
      mapSurfaceActive: spatial.mapSurfaceActive ?? null
    }),
    presentation: Object.freeze({ ...presentation })
  });

  const draft = Object.freeze({
    schema: PERCEPTION_ALIGNMENT_SNAPSHOT_SCHEMA_V0,
    contract: contractWithoutAlignment,
    knownMountIds: Object.freeze(
      Array.isArray(input.knownMountIds) ? [...input.knownMountIds] : [perception.mountId]
    ),
    priorSpatialHeight:
      input.priorSpatialHeight === undefined ? null : input.priorSpatialHeight
  });

  const alignment = computeAlignmentDriftV0(draft);
  const contract = Object.freeze({
    ...contractWithoutAlignment,
    alignment
  });

  return Object.freeze({
    schema: PERCEPTION_ALIGNMENT_SNAPSHOT_SCHEMA_V0,
    contract,
    knownMountIds: draft.knownMountIds,
    priorSpatialHeight: draft.priorSpatialHeight,
    readOnly: true
  });
}

/**
 * Compose from explicit runtime T0 state + read-only window mirrors. Does not mutate lenses.
 * @param {{
 *   atMs?: number,
 *   correlationId?: string,
 *   fieldState?: string,
 *   replyText?: string,
 *   draftText?: string,
 *   busy?: boolean,
 *   mountId?: string,
 *   cubeFocus?: object,
 *   productSurface?: string,
 *   realityMode?: string,
 *   worldMapTool?: string,
 *   voiceListening?: boolean,
 *   mapSurfaceActive?: boolean,
 *   knownMountIds?: string[],
 *   priorSpatialHeight?: number | null
 * }} runtime
 */
export function readPerceptionAlignmentFromRuntimeV0(runtime = {}) {
  const atMs = Number(runtime.atMs) || Date.now();
  const spatial = readSpatialLensSnapshotV0(atMs);
  const spatialMerged = Object.freeze({
    ...spatial,
    realityMode: runtime.realityMode
      ? String(runtime.realityMode).toUpperCase()
      : spatial.realityMode,
    mapSurfaceActive:
      runtime.mapSurfaceActive === undefined ? spatial.mapSurfaceActive : runtime.mapSurfaceActive
  });

  return buildPerceptionAlignmentSnapshotV0({
    atMs,
    correlationId: runtime.correlationId,
    focus: Object.freeze({
      productSurface: runtime.productSurface,
      realityMode: runtime.realityMode,
      worldMapTool: runtime.worldMapTool
    }),
    perception: buildPerceptionLensSnapshotV0({
      atMs,
      capturedAtMs: atMs,
      fieldState: runtime.fieldState,
      replyText: runtime.replyText,
      draftText: runtime.draftText,
      busy: runtime.busy,
      mountId: runtime.mountId,
      cubeFocus: runtime.cubeFocus
    }),
    spatial: spatialMerged,
    presentation: buildPresentationLensSnapshotV0({
      atMs,
      capturedAtMs: atMs,
      fieldState: runtime.fieldState,
      hasReply: Boolean(String(runtime.replyText || "").trim()),
      hasDraft: Boolean(String(runtime.draftText || "").trim()),
      voiceListening: runtime.voiceListening,
      productSurface: runtime.productSurface,
      realityMode: runtime.realityMode,
      worldMapTool: runtime.worldMapTool
    }),
    knownMountIds: runtime.knownMountIds,
    priorSpatialHeight: runtime.priorSpatialHeight
  });
}

/**
 * Debug publish only — NO influence back to Octo, Cesium, or habitat.
 * @param {ReturnType<typeof buildPerceptionAlignmentSnapshotV0>} snapshot
 */
export function publishPerceptionAlignmentSnapshotV0(snapshot) {
  if (typeof window !== "undefined") {
    window.__CASTLE_PERCEPTION_ALIGNMENT__ = Object.freeze({
      schema: PERCEPTION_ALIGNMENT_SNAPSHOT_SCHEMA_V0,
      readOnly: true,
      last: snapshot,
      atMs: snapshot?.contract?.atMs ?? Date.now()
    });
  }
  return snapshot;
}

/**
 * Compact lens labels for T0 observation strip (read-only).
 * @param {ReturnType<typeof buildPerceptionAlignmentSnapshotV0>["contract"]} contract
 */
export function summarizePerceptionAlignmentLensesV0(contract) {
  if (!contract) {
    return Object.freeze({
      octo: "—",
      cesium: "—",
      habitat: "—"
    });
  }
  const p = contract.perception;
  const s = contract.spatial;
  const h = contract.presentation;
  const geoH =
    s.geo && Number.isFinite(s.geo.height) ? `${Math.round(s.geo.height)}m` : "—";
  return Object.freeze({
    octo: `${p.fieldState}/${p.octoDrive}@${p.mountId}`,
    cesium: `${s.ready ? "ready" : "wait"}:${s.lastExecutorOp || "—"}:${geoH}`,
    habitat: `${h.habitatMode}·${h.octoHeightPx}px·strip=${h.showMapStrip ? "on" : "off"}`
  });
}

/**
 * Drift summary for observation strip.
 * @param {ReturnType<typeof buildPerceptionAlignmentSnapshotV0>["contract"]["alignment"]} alignment
 */
export function summarizePerceptionAlignmentDriftV0(alignment) {
  if (!alignment) {
    return Object.freeze({
      risk: ALIGNMENT_DRIFT_RISK_V0.LOW,
      guardrailActive: false,
      blockFalseCorrelation: false,
      primaryCode: null,
      explanationCount: 0
    });
  }
  const primary = alignment.explanations?.[0];
  return Object.freeze({
    risk: alignment.semanticDriftRisk,
    guardrailActive: alignment.guardrailActive === true,
    blockFalseCorrelation: alignment.blockFalseCorrelation === true,
    primaryCode: primary?.code || null,
    explanationCount: alignment.explanations?.length || 0
  });
}

/** @internal vitest */
export function __resetPerceptionAlignmentPublishForTestV0() {
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_PERCEPTION_ALIGNMENT__;
    } catch {
      /* noop */
    }
  }
}
