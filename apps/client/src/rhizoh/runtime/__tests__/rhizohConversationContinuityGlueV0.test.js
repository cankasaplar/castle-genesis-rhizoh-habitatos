import { describe, it, expect, beforeEach } from "vitest";
import {
  buildConversationContinuityGlueV0,
  resolveGlueProsodyForChunkV0,
  RHIZOH_CONVERSATION_CONTINUITY_GLUE_SCHEMA_V0
} from "../rhizohConversationContinuityGlueV0.js";

describe("rhizohConversationContinuityGlueV0", () => {
  beforeEach(() => {
    window.__CASTLE_RHIZOH_EXPRESSION__ = {
      projection: { language: "tr", pacing: "calm" },
      conversationBehavior: {
        microRhythmFeel: {
          breathGapMs: 140,
          hesitationMs: 55,
          whenYouHearMs: 200
        }
      }
    };
    window.__CASTLE_RHIZOH_HOT_SPEECH__ = {
      skeleton: { pacing: "calm", targetFirstAudioMs: 220 }
    };
  });

  it("builds glue with bridge gap in human range", () => {
    const glue = buildConversationContinuityGlueV0({ llmWaitMs: 1200 });
    expect(glue.schema).toBe(RHIZOH_CONVERSATION_CONTINUITY_GLUE_SCHEMA_V0);
    expect(glue.bridgeGapMs).toBeGreaterThanOrEqual(55);
    expect(glue.bridgeGapMs).toBeLessThanOrEqual(240);
    expect(window.__CASTLE_RHIZOH_SPEECH_GLUE__).toEqual(glue);
  });

  it("rate ramp softens from ack speed to reply", () => {
    const glue = buildConversationContinuityGlueV0({});
    const p0 = resolveGlueProsodyForChunkV0(glue, 0);
    const p2 = resolveGlueProsodyForChunkV0(glue, 2);
    expect(p0.rate).toBeGreaterThan(p2.rate);
    expect(p0.volume).toBeLessThanOrEqual(p2.volume);
  });
});
