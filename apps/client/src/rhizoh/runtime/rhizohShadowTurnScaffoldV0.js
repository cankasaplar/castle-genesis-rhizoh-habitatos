/**
 * Shadow Turn Scaffold v0 — continuity exists before governance commit.
 * Every witnessed utterance gets a weak turn scaffold for conversational flow.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { appendIdentityEventV0 } from "./rhizohIdentityEventLogV0.js";
import {
  recordContinuityPulseV0,
  CONTINUITY_STATE_V0
} from "./rhizohContinuityKernelV0.js";
import { resolveEffectiveOperatingModeV0 } from "./rhizohVoiceOperatingModeV0.js";

export const RHIZOH_SHADOW_TURN_SCHEMA_V0 = "rhizoh.shadow_turn_scaffold.v0";

const SHADOW_RING_MAX_V0 = 48;

/** @type {object[]} */
const shadowRingV0 = [];

/**
 * @param {number} n
 */
function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

/**
 * @param {object} opts
 */
export function scaffoldShadowTurnV0(opts = {}) {
  const text = String(opts.text || opts.preview || "").trim();
  if (text.length < 2) return null;

  const accepted = opts.accepted === true;
  const conf = clamp01(opts.confidence ?? 0.42);
  const band = String(opts.band || "unknown");
  const operatingMode = opts.operatingMode || resolveEffectiveOperatingModeV0(text);

  let memoryStrength = accepted
    ? clamp01(0.5 + conf * 0.45)
    : clamp01(0.08 + Math.min(text.length, 80) / 320 + conf * 0.22);

  if (operatingMode === "alert") {
    memoryStrength = Math.max(memoryStrength, 0.72);
  }

  const confidenceBand =
    conf >= 0.68 ? "medium" : conf >= 0.42 ? "low" : "very_low";

  const shadow = Object.freeze({
    schema: RHIZOH_SHADOW_TURN_SCHEMA_V0,
    turnId: String(opts.turnId || `shadow_${Date.now().toString(36)}`),
    preview: text.slice(0, 160),
    confidence: confidenceBand,
    sttConfidence: conf,
    memoryStrength,
    usableForContinuity: true,
    accepted,
    band,
    operatingMode,
    source: opts.source || "mic",
    stage: opts.stage || "witness",
    atMs: Date.now()
  });

  shadowRingV0.push(shadow);
  if (shadowRingV0.length > SHADOW_RING_MAX_V0) shadowRingV0.shift();

  recordContinuityPulseV0({
    state: CONTINUITY_STATE_V0.LISTENING,
    source: "shadow_turn",
    intent: accepted ? "user_turn" : "shadow_heard",
    preview: shadow.preview,
    momentum: accepted ? "committed" : "scaffold"
  });

  appendIdentityEventV0({
    type: accepted ? "turn_bind" : "shadow_turn",
    intent: accepted ? opts.intent || "voice" : "shadow_scaffold",
    preview: shadow.preview,
    turnId: shadow.turnId,
    modality: "voice",
    carrier: "local",
    presenceKind: accepted ? null : "shadow"
  });

  logVoiceInfoV0("SHADOW_TURN_SCAFFOLD", {
    turnId: shadow.turnId,
    accepted,
    memoryStrength: shadow.memoryStrength,
    confidence: shadow.confidence,
    band,
    operatingMode,
    preview: shadow.preview.slice(0, 96)
  });

  publishShadowTurnSnapshotV0(shadow);
  return shadow;
}

export function getShadowTurnSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_SHADOW_TURN_SCHEMA_V0,
    count: shadowRingV0.length,
    recent: Object.freeze([...shadowRingV0.slice(-12)]),
    latest: shadowRingV0.length ? shadowRingV0[shadowRingV0.length - 1] : null
  });
}

/** @param {object} shadow */
function publishShadowTurnSnapshotV0(shadow) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.shadowTurns = getShadowTurnSnapshotV0();
  window.__rhizoh.lastShadowTurn = shadow;
}

/** @internal vitest */
export function __resetShadowTurnScaffoldForTestV0() {
  shadowRingV0.length = 0;
}
