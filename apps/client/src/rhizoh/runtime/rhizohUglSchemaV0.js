/**
 * Rhizoh Unified Game Language (UGL) v1 — core schemas.
 * RESEARCH-ONLY — semantic compiler; no execution authority.
 */

export const RHIZOH_UGL_SCHEMA_V0 = "castle.rhizoh.ugl.v0";
export const RHIZOH_UGL_VERSION_V0 = 1;
export const RHIZOH_UGL_EMBEDDING_DIM_V0 = 64;

export const RHIZOH_UGL_GAME_TYPE_V0 = Object.freeze({
  CHESS: "chess",
  GO: "go",
  CHECKERS: "checkers",
  SHOGI: "shogi",
  SPORTS: "sports",
  CUSTOM: "custom"
});

export const RHIZOH_UGL_ACTION_TYPE_V0 = Object.freeze({
  MOVE: "move",
  PASS: "pass",
  INTERACT: "interact",
  SPECIAL: "special",
  EVENT: "event",
  PLAY: "play",
  POSSESSION: "possession",
  SCORE_DELTA: "score_delta"
});

export const RHIZOH_UGL_PIPELINE_V0 = Object.freeze({
  PLAY: "play",
  LEARN: "learn"
});

export const RHIZOH_UGL_EVENT_SCHEMA_V0 = "castle.rhizoh.ugl_event.v0";
export const RHIZOH_UGL_EVENT_STREAM_LS_KEY_V0 = "rhizoh.ugl.event_stream.v0";
export const RHIZOH_UGL_EVENT_V0 = "rhizoh:ugl-event-v0";

export const RHIZOH_UGL_REWARD_SCHEMA_V0 = "castle.rhizoh.ugl_reward.v0";

export const RHIZOH_UGL_REWARD_WEIGHTS_V0 = Object.freeze({
  terminal: 1,
  shaping: 0.35,
  drift: 0.25,
  novelty: 0.15
});
