/**
 * Castle Temporal Coherence v1.1 — "what were we doing?" state keeper.
 * Bridges event graph to interruptible activity context.
 */

export const CASTLE_TEMPORAL_COHERENCE_SCHEMA_V1 = "castle.temporal_coherence.v1";

export const COHERENCE_ACTIVITY_V1 = Object.freeze({
  CONVERSATION: "conversation",
  CO_WATCH: "co_watch",
  AUDIOBOOK: "audiobook",
  AMBIENT: "ambient",
  EMERGENCY: "emergency"
});

/** @type {object | null} */
let coherenceSnapshotV1 = null;

/**
 * @param {object} input
 */
export function updateTemporalCoherenceV1(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const field = input.field;
  const spike = input.spike || input.spikes?.[0];
  const mode = input.mode || "co_presence";

  let activity = COHERENCE_ACTIVITY_V1.AMBIENT;
  let label = "ambient presence";
  let dominantSource = field?.dominantSource || "mic";

  if (spike?.type === "emergency") {
    activity = COHERENCE_ACTIVITY_V1.EMERGENCY;
    label = "emergency interrupt";
  } else if (spike?.type === "social_call" || spike?.type === "intent") {
    activity = COHERENCE_ACTIVITY_V1.CONVERSATION;
    label = "live conversation";
  } else if (
    dominantSource === "youtube" ||
    dominantSource === "tv" ||
    dominantSource === "media"
  ) {
    activity = COHERENCE_ACTIVITY_V1.CO_WATCH;
    label = `co_watch_${dominantSource}`;
  } else if (dominantSource === "file" || mode === "ambient_observer") {
    activity = COHERENCE_ACTIVITY_V1.AUDIOBOOK;
    label = "long_form_stream";
  }

  const prev = coherenceSnapshotV1;
  const sameActivity = prev?.activity === activity;

  coherenceSnapshotV1 = Object.freeze({
    schema: CASTLE_TEMPORAL_COHERENCE_SCHEMA_V1,
    activity,
    label,
    dominantSource,
    sinceMs: sameActivity ? prev.sinceMs : atMs,
    tickId: input.graph?.tickId || field?.graphTickId || 0,
    mediaPositionMs: spike?.mediaPositionMs ?? input.mediaPositionMs ?? null,
    atMs
  });

  publishCoherenceV1();
  return coherenceSnapshotV1;
}

export function getTemporalCoherenceV1() {
  return coherenceSnapshotV1;
}

function publishCoherenceV1() {
  if (typeof window === "undefined") return;
  window.__castle = window.__castle || {};
  window.__castle.temporalCoherence = coherenceSnapshotV1;
}

/** @internal vitest */
export function __resetTemporalCoherenceForTestV1() {
  coherenceSnapshotV1 = null;
}
