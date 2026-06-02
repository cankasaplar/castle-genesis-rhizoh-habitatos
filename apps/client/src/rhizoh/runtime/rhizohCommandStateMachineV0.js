/**
 * Command state machine — persistent system state (session); no LLM.
 * pause → system_paused | listen → active_listening | ghost → perception.altered
 */

import { recordLocalCommandMemoryV0 } from "./rhizohCommandMemoryV0.js";

export const RHIZOH_COMMAND_STATE_MACHINE_SCHEMA_V0 = "castle.command_state_machine.v0";
export const RHIZOH_COMMAND_STATE_CHANGE_EVENT_V0 = "rhizoh:command-state-changed";
export const RHIZOH_COMMAND_STATE_STORAGE_KEY_V0 = "rhizoh.command_state_machine.v0";

export const COMMAND_SYSTEM_STATE_V0 = Object.freeze({
  ACTIVE: "active",
  PAUSED: "system_paused"
});

export const COMMAND_LISTENING_STATE_V0 = Object.freeze({
  IDLE: "idle",
  ACTIVE_LISTENING: "active_listening",
  OFF: "listening_off"
});

export const COMMAND_PERCEPTION_STATE_V0 = Object.freeze({
  NOMINAL: "nominal",
  GHOST: "ghost_mode",
  OBSERVER: "observer_mode",
  CREATIVE: "creative_mode",
  GHOST_VISION: "ghost_vision"
});

/** @type {Readonly<Record<string, Partial<ReturnType<typeof defaultCommandStateV0>>>>} */
export const COMMAND_STATE_TRANSITIONS_V0 = Object.freeze({
  system_pause: Object.freeze({ system: COMMAND_SYSTEM_STATE_V0.PAUSED }),
  system_resume: Object.freeze({ system: COMMAND_SYSTEM_STATE_V0.ACTIVE }),
  session_restart: Object.freeze({
    system: COMMAND_SYSTEM_STATE_V0.ACTIVE,
    listening: COMMAND_LISTENING_STATE_V0.IDLE,
    perception: COMMAND_PERCEPTION_STATE_V0.NOMINAL
  }),
  context_reset: Object.freeze({ listening: COMMAND_LISTENING_STATE_V0.IDLE }),
  memory_clear: Object.freeze({ listening: COMMAND_LISTENING_STATE_V0.IDLE }),

  start_listening: Object.freeze({
    listening: COMMAND_LISTENING_STATE_V0.ACTIVE_LISTENING,
    system: COMMAND_SYSTEM_STATE_V0.ACTIVE
  }),
  stop_listening: Object.freeze({ listening: COMMAND_LISTENING_STATE_V0.OFF }),

  media_play: Object.freeze({ mediaPlayback: "playing" }),
  media_pause: Object.freeze({ mediaPlayback: "paused" }),
  media_resume: Object.freeze({ mediaPlayback: "playing" }),
  media_stop: Object.freeze({ mediaPlayback: "idle" }),

  mute_voice: Object.freeze({ voiceMuted: true }),
  unmute_voice: Object.freeze({ voiceMuted: false }),

  map_open: Object.freeze({ map: "open" }),
  map_close: Object.freeze({ map: "closed" }),

  world_freeze: Object.freeze({ world: "frozen" }),
  world_resume: Object.freeze({ world: "running" }),

  camera_open: Object.freeze({ camera: "open" }),
  camera_close: Object.freeze({ camera: "closed" }),

  mode_ghost_enter: Object.freeze({ perception: COMMAND_PERCEPTION_STATE_V0.GHOST }),
  mode_ghost_exit: Object.freeze({ perception: COMMAND_PERCEPTION_STATE_V0.NOMINAL }),
  mode_observer_enter: Object.freeze({ perception: COMMAND_PERCEPTION_STATE_V0.OBSERVER }),
  mode_creative_enter: Object.freeze({ perception: COMMAND_PERCEPTION_STATE_V0.CREATIVE }),
  ghost_vision_mode: Object.freeze({ perception: COMMAND_PERCEPTION_STATE_V0.GHOST_VISION })
});

export function defaultCommandStateV0() {
  return Object.freeze({
    schema: RHIZOH_COMMAND_STATE_MACHINE_SCHEMA_V0,
    system: COMMAND_SYSTEM_STATE_V0.ACTIVE,
    listening: COMMAND_LISTENING_STATE_V0.IDLE,
    perception: COMMAND_PERCEPTION_STATE_V0.NOMINAL,
    mediaPlayback: "idle",
    world: "running",
    map: "closed",
    camera: "closed",
    voiceMuted: false,
    lastCanonical: null,
    lastTransitionAtMs: 0,
    history: Object.freeze([])
  });
}

/** @type {ReturnType<typeof defaultCommandStateV0>} */
let commandState = defaultCommandStateV0();

function cloneStateForMergeV0(base) {
  return {
    schema: RHIZOH_COMMAND_STATE_MACHINE_SCHEMA_V0,
    system: base.system,
    listening: base.listening,
    perception: base.perception,
    mediaPlayback: base.mediaPlayback,
    world: base.world,
    map: base.map,
    camera: base.camera,
    voiceMuted: base.voiceMuted,
    lastCanonical: base.lastCanonical,
    lastTransitionAtMs: base.lastTransitionAtMs,
    history: [...(base.history || [])]
  };
}

function persistCommandStateV0(state) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      RHIZOH_COMMAND_STATE_STORAGE_KEY_V0,
      JSON.stringify({
        system: state.system,
        listening: state.listening,
        perception: state.perception,
        mediaPlayback: state.mediaPlayback,
        world: state.world,
        map: state.map,
        camera: state.camera,
        voiceMuted: state.voiceMuted,
        lastCanonical: state.lastCanonical,
        lastTransitionAtMs: state.lastTransitionAtMs,
        history: state.history
      })
    );
  } catch {
    /* noop */
  }
}

export function hydrateCommandStateMachineV0() {
  if (typeof sessionStorage === "undefined") {
    commandState = defaultCommandStateV0();
    publishCommandStateV0();
    return commandState;
  }
  try {
    const raw = sessionStorage.getItem(RHIZOH_COMMAND_STATE_STORAGE_KEY_V0);
    if (!raw) {
      commandState = defaultCommandStateV0();
      publishCommandStateV0();
      return commandState;
    }
    const parsed = JSON.parse(raw);
    commandState = Object.freeze({
      ...defaultCommandStateV0(),
      ...parsed,
      schema: RHIZOH_COMMAND_STATE_MACHINE_SCHEMA_V0,
      history: Object.freeze(Array.isArray(parsed.history) ? parsed.history.slice(-24) : [])
    });
  } catch {
    commandState = defaultCommandStateV0();
  }
  publishCommandStateV0();
  return commandState;
}

function publishCommandStateV0() {
  if (typeof window === "undefined") return;
  window.__CASTLE_COMMAND_STATE__ = commandState;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.commandState = commandState;
}

/**
 * @param {string} canonical
 * @param {{ layer?: string, action?: string }} [meta]
 */
export function applyCommandStateTransitionV0(canonical, meta = {}) {
  const key = String(canonical || "");
  const patch = COMMAND_STATE_TRANSITIONS_V0[key];
  const previous = commandState;
  const atMs = Date.now();

  if (!patch) {
    recordLocalCommandMemoryV0({
      canonical: key,
      layer: String(meta.layer || ""),
      action: String(meta.action || ""),
      atMs
    });
    return Object.freeze({
      ok: false,
      reason: "no_state_transition",
      canonical: key,
      state: commandState
    });
  }

  const nextRaw = cloneStateForMergeV0(commandState);
  Object.assign(nextRaw, patch);
  nextRaw.lastCanonical = key;
  nextRaw.lastTransitionAtMs = atMs;
  const historyEntry = Object.freeze({
    canonical: key,
    patch: Object.freeze({ ...patch }),
    atMs,
    layer: meta.layer || null
  });
  nextRaw.history = [...nextRaw.history.slice(-23), historyEntry];

  commandState = Object.freeze(nextRaw);
  persistCommandStateV0(commandState);
  publishCommandStateV0();

  recordLocalCommandMemoryV0({
    canonical: key,
    layer: String(meta.layer || ""),
    action: String(meta.action || ""),
    atMs
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_COMMAND_STATE_CHANGE_EVENT_V0, {
        detail: Object.freeze({
          schema: RHIZOH_COMMAND_STATE_MACHINE_SCHEMA_V0,
          canonical: key,
          previous,
          state: commandState,
          patch
        })
      })
    );
  }

  return Object.freeze({
    ok: true,
    canonical: key,
    previous,
    state: commandState,
    patch
  });
}

export function readCommandStateMachineV0() {
  return commandState;
}

/** Immutable snapshot for replay sandbox restore. */
export function snapshotCommandStateV0() {
  return Object.freeze({
    ...commandState,
    history: Object.freeze([...(commandState.history || [])])
  });
}

/**
 * @param {ReturnType<typeof snapshotCommandStateV0>} snap
 */
export function restoreCommandStateSnapshotV0(snap) {
  if (!snap) {
    commandState = defaultCommandStateV0();
  } else {
    commandState = Object.freeze({
      ...defaultCommandStateV0(),
      ...snap,
      schema: RHIZOH_COMMAND_STATE_MACHINE_SCHEMA_V0,
      history: Object.freeze([...(snap.history || [])])
    });
  }
  publishCommandStateV0();
  return commandState;
}

/**
 * Pure transition preview — no persist, no events (replay simulation).
 * @param {string} canonical
 * @param {ReturnType<typeof readCommandStateMachineV0>} [base]
 */
export function previewCommandStateTransitionV0(canonical, base = commandState) {
  const key = String(canonical || "");
  const patch = COMMAND_STATE_TRANSITIONS_V0[key];
  if (!patch) {
    return Object.freeze({ ok: false, canonical: key, state: base });
  }
  const nextRaw = cloneStateForMergeV0(base);
  Object.assign(nextRaw, patch);
  nextRaw.lastCanonical = key;
  return Object.freeze({
    ok: true,
    canonical: key,
    previous: base,
    state: Object.freeze(nextRaw),
    patch: Object.freeze({ ...patch })
  });
}

export function isSystemPausedV0() {
  return commandState.system === COMMAND_SYSTEM_STATE_V0.PAUSED;
}

export function isActiveListeningV0() {
  return commandState.listening === COMMAND_LISTENING_STATE_V0.ACTIVE_LISTENING;
}

export function readPerceptionModeV0() {
  return commandState.perception;
}

/** @internal vitest */
export function __resetCommandStateMachineForTestV0() {
  commandState = defaultCommandStateV0();
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(RHIZOH_COMMAND_STATE_STORAGE_KEY_V0);
    } catch {
      /* noop */
    }
  }
  publishCommandStateV0();
}
