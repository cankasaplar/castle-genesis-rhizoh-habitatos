/**
 * Presence Primitive v1 — always-on self-expression kernel.
 * Default speech acts: boot · mic listen · idle alive · heartbeat.
 * Live-first; governance observes async only.
 */

import { emitLivePresenceV0, getLastLiveEmitAtMsV0 } from "./rhizohLiveLayerV0.js";
import { PRESENCE_EVENT_KIND_V0 } from "./rhizohPresenceSignatureV0.js";
import { CONTINUITY_STATE_V0 } from "./rhizohContinuityKernelV0.js";
import { noteGroundSignalV1, GROUND_SIGNAL_KIND_V1 } from "./rhizohGroundingLayerV1.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";

export const RHIZOH_PRESENCE_PRIMITIVE_SCHEMA_V1 = "rhizoh.presence_primitive.v1";

export const PRESENCE_PRIMITIVE_ACT_V1 = Object.freeze({
  BOOT_READY: "boot_ready",
  MIC_LISTEN: "mic_listen",
  IDLE_ALIVE: "idle_alive",
  HEARTBEAT: "heartbeat"
});

const BOOT_ONCE_KEY_V1 = "rhizoh.presence_primitive.boot.v1";
const MIC_LISTEN_THROTTLE_MS_V1 = 45_000;
const IDLE_ALIVE_UI_MS_V1 = 120_000;
const IDLE_ALIVE_VOICE_MS_V1 = 600_000;
const HEARTBEAT_MS_V1 = 90_000;

/** @type {Record<string, number>} */
const lastActAtMsV1 = {};
/** @type {number} */
let primitiveEmitCountV1 = 0;
/** @type {object | null} */
let lastPrimitiveEmitV1 = null;

function trV0() {
  return String(resolveOutputLanguageCodeV0() || "tr").toLowerCase().startsWith("tr");
}

function phraseForActV1(act) {
  const tr = trV0();
  switch (act) {
    case PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY:
      return tr ? "Hazırım." : "I'm ready.";
    case PRESENCE_PRIMITIVE_ACT_V1.MIC_LISTEN:
      return tr ? "Dinliyorum." : "Listening.";
    case PRESENCE_PRIMITIVE_ACT_V1.IDLE_ALIVE:
      return tr ? "Buradayım." : "I'm here.";
    case PRESENCE_PRIMITIVE_ACT_V1.HEARTBEAT:
      return tr ? "Buradayım." : "I'm here.";
    default:
      return tr ? "Buradayım." : "I'm here.";
  }
}

function presenceKindForActV1(act) {
  if (act === PRESENCE_PRIMITIVE_ACT_V1.MIC_LISTEN) return PRESENCE_EVENT_KIND_V0.LISTEN;
  if (act === PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY) return PRESENCE_EVENT_KIND_V0.PULSE;
  return PRESENCE_EVENT_KIND_V0.OBSERVE;
}

function bootAlreadyFiredV1() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(BOOT_ONCE_KEY_V1) === "1";
}

function markBootFiredV1() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(BOOT_ONCE_KEY_V1, "1");
  }
}

/**
 * @param {string} act
 * @param {number} throttleMs
 */
function actThrottleOkV1(act, throttleMs) {
  const last = lastActAtMsV1[act] || 0;
  return Date.now() - last >= throttleMs;
}

/**
 * Default speech act — always uses live layer.
 * @param {string} act
 * @param {object} [opts]
 */
export function emitPresencePrimitiveV1(act, opts = {}) {
  const phrase = String(opts.phrase || phraseForActV1(act)).trim();
  if (!phrase) return null;

  const throttleMs = Number(opts.throttleMs) || 0;
  if (throttleMs > 0 && !actThrottleOkV1(act, throttleMs)) {
    return Object.freeze({ ok: false, reason: "throttled", act });
  }

  if (act === PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY && bootAlreadyFiredV1() && opts.force !== true) {
    return Object.freeze({ ok: false, reason: "boot_already_fired", act });
  }

  const speakDefault =
    act === PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY
      ? true
      : act === PRESENCE_PRIMITIVE_ACT_V1.IDLE_ALIVE
        ? opts.speak === true
        : false;

  const live = emitLivePresenceV0({
    phrase,
    kind: opts.kind || presenceKindForActV1(act),
    intent: act,
    traceId: opts.traceId || `primitive_${act}_${Date.now().toString(36)}`,
    speak: opts.speak !== undefined ? opts.speak : speakDefault,
    source: `presence_primitive_${act}`,
    moduleId: "presence_primitive",
    incrementTurn: false,
    userInitiated: false
  });

  lastActAtMsV1[act] = Date.now();
  primitiveEmitCountV1 += 1;
  if (act === PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY) markBootFiredV1();
  if (act === PRESENCE_PRIMITIVE_ACT_V1.MIC_LISTEN) {
    noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.MIC_OPEN);
  }

  const row = Object.freeze({
    ok: true,
    act,
    live,
    spoke: live.spoke,
    phrase,
    atMs: Date.now()
  });
  lastPrimitiveEmitV1 = row;

  logVoiceInfoV0("PRESENCE_PRIMITIVE_EMIT", {
    act,
    spoke: live.spoke,
    latencyMs: live.latencyMs
  });

  publishPresencePrimitiveV1();
  return row;
}

/**
 * Pulse-driven default acts when scheduler did not emit.
 * @param {object} ctx
 */
export function evaluatePresencePrimitiveOnPulseV1(ctx = {}) {
  const seq = Number(ctx.seq) || 0;
  const continuity = ctx.continuity;
  const eventLogCount = ctx.eventLogCount ?? 0;
  const lastLiveAt = getLastLiveEmitAtMsV0();
  const sinceLiveMs = lastLiveAt ? Date.now() - lastLiveAt : Infinity;

  if (seq === 1 && !bootAlreadyFiredV1()) {
    return emitPresencePrimitiveV1(PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY, {
      traceId: `pulse_boot_${seq}`
    });
  }

  const listening =
    continuity?.state === CONTINUITY_STATE_V0.LISTENING ||
    continuity?.state === CONTINUITY_STATE_V0.IDLE ||
    continuity?.state === CONTINUITY_STATE_V0.OBSERVING;

  if (
    listening &&
    sinceLiveMs >= IDLE_ALIVE_UI_MS_V1 &&
    actThrottleOkV1(PRESENCE_PRIMITIVE_ACT_V1.IDLE_ALIVE, IDLE_ALIVE_UI_MS_V1)
  ) {
    const voiceIdle =
      eventLogCount === 0 &&
      sinceLiveMs >= IDLE_ALIVE_VOICE_MS_V1 &&
      actThrottleOkV1(`${PRESENCE_PRIMITIVE_ACT_V1.IDLE_ALIVE}_voice`, IDLE_ALIVE_VOICE_MS_V1);

    if (voiceIdle) {
      lastActAtMsV1[`${PRESENCE_PRIMITIVE_ACT_V1.IDLE_ALIVE}_voice`] = Date.now();
    }

    return emitPresencePrimitiveV1(PRESENCE_PRIMITIVE_ACT_V1.IDLE_ALIVE, {
      speak: voiceIdle,
      throttleMs: IDLE_ALIVE_UI_MS_V1,
      traceId: `pulse_idle_${seq}`
    });
  }

  if (
    sinceLiveMs >= HEARTBEAT_MS_V1 &&
    actThrottleOkV1(PRESENCE_PRIMITIVE_ACT_V1.HEARTBEAT, HEARTBEAT_MS_V1)
  ) {
    return emitPresencePrimitiveV1(PRESENCE_PRIMITIVE_ACT_V1.HEARTBEAT, {
      speak: false,
      throttleMs: HEARTBEAT_MS_V1,
      traceId: `pulse_hb_${seq}`
    });
  }

  return null;
}

export function emitMicListenPrimitiveV1(opts = {}) {
  return emitPresencePrimitiveV1(PRESENCE_PRIMITIVE_ACT_V1.MIC_LISTEN, {
    speak: false,
    throttleMs: MIC_LISTEN_THROTTLE_MS_V1,
    traceId: opts.traceId
  });
}

export function getPresencePrimitiveSnapshotV1() {
  return Object.freeze({
    schema: RHIZOH_PRESENCE_PRIMITIVE_SCHEMA_V1,
    emitCount: primitiveEmitCountV1,
    lastEmit: lastPrimitiveEmitV1,
    bootFired: bootAlreadyFiredV1(),
    lastActAtMs: Object.freeze({ ...lastActAtMsV1 }),
    alwaysOn: true
  });
}

function publishPresencePrimitiveV1() {
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.presencePrimitive = getPresencePrimitiveSnapshotV1();
  }
}

/** @internal vitest */
export function __resetPresencePrimitiveForTestV1() {
  for (const k of Object.keys(lastActAtMsV1)) delete lastActAtMsV1[k];
  primitiveEmitCountV1 = 0;
  lastPrimitiveEmitV1 = null;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(BOOT_ONCE_KEY_V1);
  }
}
