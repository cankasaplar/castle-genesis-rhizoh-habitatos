/**
 * Voice immutable event timeline — Layer A only.
 *
 * EVENTS ARE IMMUTABLE; PERSONAL DATA IS ERASABLE.
 * This ring never stores audio, transcript, or raw user message content. It only
 * stores anonymized actor ids and payload references owned by erasable stores.
 */

import {
  createRhizohImmutableEventV0,
  createRhizohPayloadRefV0,
  RHIZOH_EVENT_POLICY_TAG_V0
} from "@castle/protocol";

export const RHIZOH_VOICE_IMMUTABLE_EVENT_TIMELINE_SCHEMA_V0 =
  "rhizoh.voice_immutable_event_timeline.v0";

const RING_MAX_V0 = 48;

const timelineStateV0 = {
  seq: 0,
  ring: []
};

function publishTimelineV0() {
  if (typeof window === "undefined") return;
  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.voiceImmutableEvents = getVoiceImmutableEventTimelineSnapshotV0();
  } catch {
    /* noop */
  }
}

/**
 * @param {{
 *   type: string,
 *   sessionId?: string,
 *   traceId?: string,
 *   payloadRef?: string | null,
 *   payloadRefSeed?: string,
 *   actorSeed?: string,
 *   policyTag?: string
 * }} input
 */
export function recordVoiceImmutableEventV0(input = {}) {
  timelineStateV0.seq += 1;
  const sessionId = String(input.sessionId || "").slice(0, 128);
  const traceId = String(input.traceId || "").slice(0, 128);
  const payloadRef =
    input.payloadRef === null
      ? null
      : input.payloadRef ||
        createRhizohPayloadRefV0(
          input.payloadRefSeed || `${sessionId}:${traceId}:${input.type}:${timelineStateV0.seq}`
        );
  const row = createRhizohImmutableEventV0({
    type: input.type,
    sessionId,
    traceId,
    eventSeq: timelineStateV0.seq,
    actorSeed: input.actorSeed || sessionId || traceId,
    payloadRef,
    policyTag: input.policyTag || RHIZOH_EVENT_POLICY_TAG_V0.ERASABLE_PAYLOAD_REF
  });
  timelineStateV0.ring = [...timelineStateV0.ring.slice(-(RING_MAX_V0 - 1)), row];
  publishTimelineV0();
  return row;
}

export function getVoiceImmutableEventTimelineSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_VOICE_IMMUTABLE_EVENT_TIMELINE_SCHEMA_V0,
    seq: timelineStateV0.seq,
    tail: Object.freeze(timelineStateV0.ring.slice(-RING_MAX_V0)),
    law: "EVENTS_IMMUTABLE_PERSONAL_DATA_ERASABLE"
  });
}

export function resetVoiceImmutableEventTimelineForTestV0() {
  timelineStateV0.seq = 0;
  timelineStateV0.ring = [];
  publishTimelineV0();
}
