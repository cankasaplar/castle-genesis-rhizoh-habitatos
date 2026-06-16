/**
 * TemporalBridge v0 — separates event_time (historical replay) from execution_time (live).
 * Phase 0: replay detection, voice gating, UI sync enforcement hooks.
 *
 * Voice is a temporal-aware renderer, not a blind event consumer.
 */

import {
  isRhizohCatchUpReplayActiveV0,
  setRhizohCatchUpReplayActiveV0
} from "./rhizohCatchUpGuardV0.js";

export const TEMPORAL_BRIDGE_SCHEMA_V0 = "castle.rhizoh.temporal_bridge.v0";
export const RHIZOH_TEMPORAL_MODE_EVENT_V0 = "rhizoh:temporal-mode-v0";

export const VOICE_TEMPORAL_MODE_V0 = Object.freeze({
  LIVE: "live",
  MUTED_REPLAY: "muted_replay"
});

/** @type {"live" | "muted_replay"} */
let voiceModeV0 = VOICE_TEMPORAL_MODE_V0.LIVE;
let replayDepthV0 = 0;

/** @type {object[]} */
const mutedReplayVoiceQueueV0 = [];
const MUTED_QUEUE_MAX_V0 = 48;

function publishTemporalModeV0(source = "unknown") {
  const snapshot = Object.freeze({
    schema: TEMPORAL_BRIDGE_SCHEMA_V0,
    voiceMode: voiceModeV0,
    replayActive: isReplayModeActiveV0(),
    replayDepth: replayDepthV0,
    mutedQueueSize: mutedReplayVoiceQueueV0.length,
    source,
    atMs: Date.now()
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.temporalBridge = snapshot;
    window.dispatchEvent(new CustomEvent(RHIZOH_TEMPORAL_MODE_EVENT_V0, { detail: snapshot }));
  }
  return snapshot;
}

/**
 * True when system is replaying historical layers (not live execution).
 */
export function isReplayModeActiveV0() {
  return isRhizohCatchUpReplayActiveV0();
}

export function getVoiceTemporalModeV0() {
  return voiceModeV0;
}

/**
 * Voice output must be suppressed during replay.
 */
export function shouldMuteVoiceOutputV0() {
  return voiceModeV0 === VOICE_TEMPORAL_MODE_V0.MUTED_REPLAY || isRhizohCatchUpReplayActiveV0();
}

/**
 * Enter replay mode — voice → MUTED_REPLAY, catch-up guard armed.
 * @param {string} [source]
 */
export function enterReplayModeV0(source = "catch_up") {
  replayDepthV0 += 1;
  setRhizohCatchUpReplayActiveV0(true);
  if (replayDepthV0 === 1) {
    voiceModeV0 = VOICE_TEMPORAL_MODE_V0.MUTED_REPLAY;
  }
  publishTemporalModeV0(source);
}

/**
 * Exit replay mode — restore LIVE voice when outermost replay completes.
 * @param {string} [source]
 */
export function exitReplayModeV0(source = "catch_up") {
  replayDepthV0 = Math.max(0, replayDepthV0 - 1);
  setRhizohCatchUpReplayActiveV0(false);
  if (replayDepthV0 === 0) {
    voiceModeV0 = VOICE_TEMPORAL_MODE_V0.LIVE;
  }
  publishTemporalModeV0(source);
}

/**
 * Manual voice mode override (tests / ops).
 * @param {"live" | "muted_replay"} mode
 */
export function setVoiceTemporalModeV0(mode) {
  voiceModeV0 =
    mode === VOICE_TEMPORAL_MODE_V0.MUTED_REPLAY
      ? VOICE_TEMPORAL_MODE_V0.MUTED_REPLAY
      : VOICE_TEMPORAL_MODE_V0.LIVE;
  publishTemporalModeV0("manual");
}

/**
 * Queue voice event suppressed during replay (observability only — not spoken).
 * @param {{ text: string, meta?: object }} event
 */
export function enqueueMutedReplayVoiceV0(event) {
  const text = String(event?.text || "").trim();
  if (!text) return null;
  const row = Object.freeze({
    text: text.slice(0, 480),
    meta: event.meta || null,
    atMs: Date.now()
  });
  mutedReplayVoiceQueueV0.push(row);
  if (mutedReplayVoiceQueueV0.length > MUTED_QUEUE_MAX_V0) {
    mutedReplayVoiceQueueV0.shift();
  }
  return row;
}

export function getMutedReplayVoiceSnapshotV0() {
  return Object.freeze({
    schema: TEMPORAL_BRIDGE_SCHEMA_V0,
    count: mutedReplayVoiceQueueV0.length,
    recent: Object.freeze(mutedReplayVoiceQueueV0.slice(-8))
  });
}

export function getTemporalBridgeSnapshotV0() {
  return Object.freeze({
    schema: TEMPORAL_BRIDGE_SCHEMA_V0,
    voiceMode: voiceModeV0,
    replayActive: isReplayModeActiveV0(),
    replayDepth: replayDepthV0,
    mutedVoice: getMutedReplayVoiceSnapshotV0()
  });
}

/** @internal vitest */
export function __resetTemporalBridgeForTestV0() {
  voiceModeV0 = VOICE_TEMPORAL_MODE_V0.LIVE;
  replayDepthV0 = 0;
  mutedReplayVoiceQueueV0.length = 0;
  if (typeof window !== "undefined" && window.__rhizoh?.temporalBridge) {
    delete window.__rhizoh.temporalBridge;
  }
}
