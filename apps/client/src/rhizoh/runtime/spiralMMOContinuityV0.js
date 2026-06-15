/**
 * SpiralMMO continuity — no repeat spiral; dual handoff between awakenings (v0 visual).
 */

import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";

export const RHIZOH_SPIRAL_MMO_CONTINUITY_SCHEMA_V0 = "rhizoh.spiral_mmo_continuity.v0";
export const RHIZOH_SPIRAL_MMO_CONTINUITY_LS_KEY_V0 = "rhizoh_spiral_mmo_continuity_v0";
export const RHIZOH_SPIRAL_MMO_CONTINUITY_EVENT_V0 = "rhizoh:spiral-mmo-continuity-v0";

/** @type {{ lastTriggerIndex: number, epoch: number, history: number[] }} */
let memorySnapshotV0 = {
  lastTriggerIndex: -1,
  epoch: 0,
  history: []
};

function clampPinIndexV0(index, pinCount) {
  if (pinCount <= 0) return 0;
  return Math.max(0, Math.min(pinCount - 1, Number(index) || 0));
}

function normalizeContinuityV0(raw) {
  if (!raw || typeof raw !== "object") {
    return { lastTriggerIndex: -1, epoch: 0, history: [] };
  }
  const history = Array.isArray(raw.history)
    ? raw.history.map((n) => Number(n)).filter((n) => Number.isFinite(n)).slice(-12)
    : [];
  return {
    lastTriggerIndex: Number.isFinite(raw.lastTriggerIndex) ? raw.lastTriggerIndex : -1,
    epoch: Number.isFinite(raw.epoch) ? Math.max(0, raw.epoch) : 0,
    history
  };
}

/**
 * @returns {{ lastTriggerIndex: number, epoch: number, history: number[] }}
 */
export function readSpiralMMOContinuityV0() {
  if (typeof window === "undefined") return { ...memorySnapshotV0, history: memorySnapshotV0.history.slice() };
  try {
    const raw = window.localStorage.getItem(RHIZOH_SPIRAL_MMO_CONTINUITY_LS_KEY_V0);
    if (!raw) return { ...memorySnapshotV0, history: memorySnapshotV0.history.slice() };
    const parsed = JSON.parse(raw);
    const next = normalizeContinuityV0(parsed);
    memorySnapshotV0 = next;
    return { ...next, history: next.history.slice() };
  } catch {
    return { ...memorySnapshotV0, history: memorySnapshotV0.history.slice() };
  }
}

/**
 * @param {{ lastTriggerIndex: number, epoch: number, history: number[] }} next
 */
export function writeSpiralMMOContinuityV0(next) {
  const payload = normalizeContinuityV0(next);
  memorySnapshotV0 = payload;
  if (typeof window === "undefined") return payload;
  try {
    window.localStorage.setItem(
      RHIZOH_SPIRAL_MMO_CONTINUITY_LS_KEY_V0,
      JSON.stringify({
        schema: RHIZOH_SPIRAL_MMO_CONTINUITY_SCHEMA_V0,
        lastTriggerIndex: payload.lastTriggerIndex,
        epoch: payload.epoch,
        history: payload.history
      })
    );
    window.dispatchEvent(
      new CustomEvent(RHIZOH_SPIRAL_MMO_CONTINUITY_EVENT_V0, {
        detail: Object.freeze({ ...payload, history: Object.freeze(payload.history.slice()) })
      })
    );
  } catch {
    /* noop */
  }
  return payload;
}

/**
 * Next pin index on the ring — always different when pinCount > 1.
 * @param {number} currentIndex
 * @param {number} [pinCount]
 */
export function resolveNextSpiralTriggerIndexV0(currentIndex, pinCount = listSpiralMMOContinentMapPinsV0().length) {
  const safe = clampPinIndexV0(currentIndex, pinCount);
  if (pinCount <= 1) return safe;
  return (safe + 1) % pinCount;
}

/**
 * Same-spiral re-entry forbidden — advance to a different trigger when needed.
 * @param {number} requestedIndex
 * @param {number} [pinCount]
 */
export function resolveSpiralMMOEffectiveTriggerV0(requestedIndex, pinCount = listSpiralMMOContinentMapPinsV0().length) {
  const requested = clampPinIndexV0(requestedIndex, pinCount);
  const state = readSpiralMMOContinuityV0();

  if (state.lastTriggerIndex < 0 || pinCount <= 1) {
    return Object.freeze({
      triggerIndex: requested,
      requestedIndex: requested,
      advanced: false,
      reason: state.lastTriggerIndex < 0 ? "first_awakening" : "single_pin"
    });
  }

  if (requested !== state.lastTriggerIndex) {
    return Object.freeze({
      triggerIndex: requested,
      requestedIndex: requested,
      advanced: false,
      reason: "distinct_spiral"
    });
  }

  const next = resolveNextSpiralTriggerIndexV0(state.lastTriggerIndex, pinCount);
  return Object.freeze({
    triggerIndex: next,
    requestedIndex: requested,
    advanced: true,
    reason: "same_spiral_forbidden"
  });
}

/**
 * @param {number} triggerIndex
 * @param {{ handoffFromIndex?: number }} [meta]
 */
export function commitSpiralMMOAwakeningContinuityV0(triggerIndex, meta = {}) {
  const pins = listSpiralMMOContinentMapPinsV0();
  const safe = clampPinIndexV0(triggerIndex, pins.length);
  const prev = readSpiralMMOContinuityV0();
  const history = [...prev.history, safe].slice(-12);
  return writeSpiralMMOContinuityV0({
    lastTriggerIndex: safe,
    epoch: prev.epoch + 1,
    history
  });
}

/**
 * @param {number} triggerIndex
 * @param {number} [pinCount]
 */
export function resolveSpiralMMOCollapseHandoffV0(triggerIndex, pinCount = listSpiralMMOContinentMapPinsV0().length) {
  const fromIndex = clampPinIndexV0(triggerIndex, pinCount);
  const toIndex = resolveNextSpiralTriggerIndexV0(fromIndex, pinCount);
  return Object.freeze({
    fromIndex,
    toIndex,
    dualTransition: fromIndex !== toIndex
  });
}

export function resetSpiralMMOContinuityForTestV0() {
  memorySnapshotV0 = { lastTriggerIndex: -1, epoch: 0, history: [] };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(RHIZOH_SPIRAL_MMO_CONTINUITY_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
