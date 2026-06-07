/**
 * Cap wheel attention runtime — layer 4: time-ordered interaction contract.
 *
 * Static semantics live in capWheelIntentRegistryV1 + meaning ladder.
 * This module enforces runtime ordering: hover decode → render commit → click execute.
 *
 * HARD RULES (cross-layer — FOX swap must obey):
 * - NEVER: wheel → center influence · hover → execution · camera → decision · voice → UI mutation
 * - ALWAYS: center = identity projection · wheel = interpreter · voice = gate · camera = projection
 *
 * Ephemeral session log only — not persisted, not fed back into gate or center.
 */

export const CAP_WHEEL_ATTENTION_RUNTIME_SCHEMA_V1 = "castle.rhizoh.cap_wheel_attention_runtime.v1";

export const CAP_WHEEL_INTERACTION_PHASE_V1 = Object.freeze({
  IDLE: "idle",
  HOVER_DECODE: "hover_decode",
  CLICK_PENDING: "click_pending",
  CLICK_EXECUTE: "click_execute",
  DRAG_STEERING: "drag_steering"
});

/** @type {Readonly<{ never: readonly string[], always: readonly string[] }>} */
export const CAP_WHEEL_ATTENTION_HARD_RULES_V1 = Object.freeze({
  never: Object.freeze([
    "wheel_to_center_influence",
    "hover_to_execution",
    "hover_to_state_mutation_outside_wheel",
    "camera_to_behavior_decision",
    "voice_to_ui_modification"
  ]),
  always: Object.freeze([
    "center_pure_identity_projection",
    "wheel_pure_interpreter",
    "voice_pure_gate",
    "camera_pure_projection"
  ])
});

const MAX_EPHEMERAL_EVENTS = 32;

/**
 * @returns {{
 *   schema: string,
 *   seq: number,
 *   phase: string,
 *   lastHoverNodeId: string | null,
 *   lastClickNodeId: string | null,
 *   events: readonly object[]
 * }}
 */
export function createCapWheelAttentionSessionV1() {
  return Object.freeze({
    schema: CAP_WHEEL_ATTENTION_RUNTIME_SCHEMA_V1,
    seq: 0,
    phase: CAP_WHEEL_INTERACTION_PHASE_V1.IDLE,
    lastHoverNodeId: null,
    lastClickNodeId: null,
    events: Object.freeze([])
  });
}

/**
 * @param {ReturnType<typeof createCapWheelAttentionSessionV1>} session
 * @param {string} phase
 */
export function assertCapWheelPhaseAllowsV1(session, phase) {
  const cur = session?.phase || CAP_WHEEL_INTERACTION_PHASE_V1.IDLE;
  if (cur === phase) return true;
  if (phase === CAP_WHEEL_INTERACTION_PHASE_V1.CLICK_EXECUTE) {
    return (
      cur === CAP_WHEEL_INTERACTION_PHASE_V1.CLICK_PENDING ||
      cur === CAP_WHEEL_INTERACTION_PHASE_V1.HOVER_DECODE ||
      cur === CAP_WHEEL_INTERACTION_PHASE_V1.IDLE
    );
  }
  if (phase === CAP_WHEEL_INTERACTION_PHASE_V1.HOVER_DECODE) {
    return cur !== CAP_WHEEL_INTERACTION_PHASE_V1.CLICK_EXECUTE;
  }
  return true;
}

/**
 * @param {ReturnType<typeof createCapWheelAttentionSessionV1>} session
 * @param {{ type: string, nodeId?: string | null, atMs?: number }} event
 */
function appendCapWheelRuntimeEventV1(session, event) {
  const atMs = Number.isFinite(Number(event.atMs)) ? Number(event.atMs) : Date.now();
  const entry = Object.freeze({
    seq: session.seq + 1,
    type: String(event.type || "unknown"),
    nodeId: event.nodeId != null ? String(event.nodeId) : null,
    phase: session.phase,
    atMs
  });
  const events = [...session.events, entry].slice(-MAX_EPHEMERAL_EVENTS);
  return Object.freeze({ ...session, seq: entry.seq, events: Object.freeze(events) });
}

/**
 * Hover path — read-only semantic decode; must not schedule execution.
 * @param {ReturnType<typeof createCapWheelAttentionSessionV1>} session
 * @param {{ nodeId?: string | null, atMs?: number }} input
 */
export function recordCapWheelHoverDecodeV1(session, input = {}) {
  const nodeId = input.nodeId != null ? String(input.nodeId) : null;
  let next = Object.freeze({
    ...session,
    phase: CAP_WHEEL_INTERACTION_PHASE_V1.HOVER_DECODE,
    lastHoverNodeId: nodeId
  });
  next = appendCapWheelRuntimeEventV1(next, {
    type: "hover_decode",
    nodeId,
    atMs: input.atMs
  });
  return next;
}

/**
 * Click path — marks pending; execution must run after render commit (rAF/microtask).
 * @param {ReturnType<typeof createCapWheelAttentionSessionV1>} session
 * @param {{ nodeId?: string | null, atMs?: number }} input
 */
export function recordCapWheelClickPendingV1(session, input = {}) {
  const nodeId = input.nodeId != null ? String(input.nodeId) : null;
  assertCapWheelPhaseAllowsV1(session, CAP_WHEEL_INTERACTION_PHASE_V1.CLICK_EXECUTE);
  let next = Object.freeze({
    ...session,
    phase: CAP_WHEEL_INTERACTION_PHASE_V1.CLICK_PENDING,
    lastClickNodeId: nodeId
  });
  next = appendCapWheelRuntimeEventV1(next, {
    type: "click_pending",
    nodeId,
    atMs: input.atMs
  });
  return next;
}

/**
 * @param {ReturnType<typeof createCapWheelAttentionSessionV1>} session
 * @param {{ nodeId?: string | null, atMs?: number }} input
 */
export function recordCapWheelClickExecuteV1(session, input = {}) {
  const nodeId = input.nodeId != null ? String(input.nodeId) : null;
  let next = Object.freeze({
    ...session,
    phase: CAP_WHEEL_INTERACTION_PHASE_V1.CLICK_EXECUTE,
    lastClickNodeId: nodeId
  });
  next = appendCapWheelRuntimeEventV1(next, {
    type: "click_execute",
    nodeId,
    atMs: input.atMs
  });
  return next;
}

/**
 * @param {ReturnType<typeof createCapWheelAttentionSessionV1>} session
 */
export function recordCapWheelInteractionIdleV1(session) {
  let next = Object.freeze({
    ...session,
    phase: CAP_WHEEL_INTERACTION_PHASE_V1.IDLE
  });
  next = appendCapWheelRuntimeEventV1(next, { type: "idle" });
  return next;
}

/**
 * Render-phase separation: semantic decode commits before execution callbacks.
 * @param {() => void} executeFn
 * @returns {() => void} cancel
 */
export function scheduleCapWheelExecuteAfterDecodeV1(executeFn) {
  if (typeof executeFn !== "function") return () => {};
  let cancelled = false;
  const run = () => {
    if (cancelled) return;
    executeFn();
  };
  if (typeof requestAnimationFrame === "function") {
    const id = requestAnimationFrame(() => {
      if (typeof queueMicrotask === "function") queueMicrotask(run);
      else run();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }
  if (typeof queueMicrotask === "function") {
    queueMicrotask(run);
    return () => {
      cancelled = true;
    };
  }
  run();
  return () => {
    cancelled = true;
  };
}

/**
 * @param {ReturnType<typeof createCapWheelAttentionSessionV1>} session
 */
export function getCapWheelAttentionRuntimeSnapshotV1(session) {
  return Object.freeze({
    schema: CAP_WHEEL_ATTENTION_RUNTIME_SCHEMA_V1,
    phase: session?.phase || CAP_WHEEL_INTERACTION_PHASE_V1.IDLE,
    seq: session?.seq || 0,
    lastHoverNodeId: session?.lastHoverNodeId || null,
    lastClickNodeId: session?.lastClickNodeId || null,
    eventCount: session?.events?.length || 0,
    lastEvent: session?.events?.length ? session.events[session.events.length - 1] : null,
    hardRules: CAP_WHEEL_ATTENTION_HARD_RULES_V1
  });
}

/**
 * Bind ephemeral debug getter on window (dev-only pattern).
 * @param {() => ReturnType<typeof createCapWheelAttentionSessionV1>} getSession
 */
export function bindCapWheelAttentionRuntimeDebugV1(getSession) {
  if (typeof window === "undefined" || typeof getSession !== "function") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.capWheelRuntime = () =>
    getCapWheelAttentionRuntimeSnapshotV1(getSession());
}
