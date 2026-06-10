import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  EXPERIENCE_ATTENTION_KIND_V1,
  EXPERIENCE_SOURCE_V1,
  __resetExperienceFieldForTestV1,
  fuseExperienceAttentionSpikeV1,
  noteExperienceFieldEventV1
} from "../rhizohUnifiedExperienceFieldV1.js";
import {
  FABRIC_SPIKE_INTENT_V1,
  __resetExperienceFabricForTestV1
} from "../rhizohExperienceFabricV1.js";
import { __resetCoPresenceRuntimeForTestV1 } from "../rhizohCoPresenceRuntimeV1.js";
import { __resetStreamingAttentionGateForTestV0 } from "../rhizohStreamingAttentionGateV0.js";
import {
  clearVoiceAttentionModeOverrideV0,
  setVoiceAttentionModeOverrideV0,
  VOICE_ATTENTION_MODE_V0
} from "../voiceAttentionContextV0.js";

describe("rhizohUnifiedExperienceFieldV1", () => {
  beforeEach(() => {
    __resetExperienceFieldForTestV1();
    __resetExperienceFabricForTestV1();
    __resetCoPresenceRuntimeForTestV1();
    __resetStreamingAttentionGateForTestV0();
    clearVoiceAttentionModeOverrideV0();
    setVoiceAttentionModeOverrideV0(VOICE_ATTENTION_MODE_V0.CO_PRESENCE);
  });

  it("records media player timeline events", () => {
    const row = noteExperienceFieldEventV1({
      source: EXPERIENCE_SOURCE_V1.MEDIA_PLAYER,
      preview: "match replay segment",
      mediaPositionMs: 120_000
    });
    expect(row.source).toBe(EXPERIENCE_SOURCE_V1.MEDIA_PLAYER);
    expect(row.mediaPositionMs).toBe(120_000);
  });

  it("fuses pause + explain as interaction spike", () => {
    const spike = fuseExperienceAttentionSpikeV1({
      source: EXPERIENCE_SOURCE_V1.MEDIA_PLAYER,
      text: "burayı açıkla Rhizoh",
      userAction: "pause",
      confidence: 0.5
    });
    expect(spike.respond).toBe(true);
    expect([
      FABRIC_SPIKE_INTENT_V1.EXPLAIN_MOMENT,
      FABRIC_SPIKE_INTENT_V1.MEMORY_WRITE,
      FABRIC_SPIKE_INTENT_V1.CONVERSATION
    ]).toContain(spike.fusedKind);
  });

  it("memory recall phrase triggers recall kind", () => {
    const spike = fuseExperienceAttentionSpikeV1({
      source: EXPERIENCE_SOURCE_V1.FILE_STREAM,
      text: "bu sahneyi hatırla",
      userAction: "pause"
    });
    expect(spike.fieldSignals.some((s) => s.kind === EXPERIENCE_ATTENTION_KIND_V1.MEMORY_RECALL)).toBe(
      true
    );
  });
});
