import { beforeEach, describe, expect, it } from "vitest";
import { createRhizohImmutableEventV0 } from "@castle/protocol";
import {
  createVoiceVaultDataRequestV0,
  resolveVoiceDecisionViaMemoryCoreV0
} from "../voiceMemoryCoreVaultMediatorV0.js";
import {
  getVoiceImmutableEventTimelineSnapshotV0,
  resetVoiceImmutableEventTimelineForTestV0
} from "../voiceImmutableEventTimelineV0.js";

describe("voiceMemoryCoreVaultMediatorV0", () => {
  beforeEach(() => {
    resetVoiceImmutableEventTimelineForTestV0();
  });

  it("resolves a voice decision through MemoryCore without returning raw transcript", () => {
    const event = createRhizohImmutableEventV0({
      type: "VOICE_INTENT_PARSED",
      sessionId: "vault_session",
      traceId: "trace-vault",
      eventSeq: 1,
      payloadRef: "ptr_voice_payload"
    });

    const resolved = resolveVoiceDecisionViaMemoryCoreV0({
      event,
      intentScope: "voice_intent_decision",
      transcript: "Rhizoh beni duyuyor musun?",
      confidence: 0.91,
      strategy: "whisper_only",
      maxRms: 0.08,
      sessionId: "vault_session",
      traceId: "trace-vault"
    });

    expect(resolved.ok).toBe(true);
    expect(resolved.packet.packetRef).toMatch(/^ptr_/);
    expect(resolved.packet.decision).toBeTruthy();
    expect(resolved.packet.provenanceRef).toMatch(/^ptr_/);
    expect(JSON.stringify(resolved.packet)).not.toContain("Rhizoh beni duyuyor musun");

    const timeline = getVoiceImmutableEventTimelineSnapshotV0();
    expect(timeline.tail.map((row) => row.type)).toEqual([
      "VOICE_VAULT_DATA_REQUESTED",
      "VOICE_VAULT_DATA_REQUEST_RESOLVED"
    ]);
    expect(JSON.stringify(timeline.tail)).not.toContain("Rhizoh beni duyuyor musun");
  });

  it("rejects vault requests that contain raw personal fields on the event", () => {
    const badEvent = {
      ...createRhizohImmutableEventV0({
        type: "VOICE_INTENT_PARSED",
        sessionId: "vault_bad",
        eventSeq: 1,
        payloadRef: "ptr_bad"
      }),
      transcript: "raw text must not be on event"
    };

    const request = createVoiceVaultDataRequestV0({
      event: badEvent,
      intentScope: "voice_intent_decision",
      sessionId: "vault_bad"
    });

    expect(request.ok).toBe(false);
    expect(request.error).toBe("vault_request_rejected");
  });
});
