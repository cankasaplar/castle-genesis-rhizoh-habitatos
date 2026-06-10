import { describe, expect, it } from "vitest";
import {
  buildRhizohCriticalContextV0,
  measureRhizohJsonUtf8BytesV0,
  RHIZOH_LLM_MAX_BODY_BYTES_V0,
  RHIZOH_LLM_TARGET_BODY_BYTES_V0,
  trimRhizohLlmRequestBodyV0
} from "../rhizohLlmPayloadTrimV0.js";

describe("rhizohLlmPayloadTrimV0", () => {
  it("drops context.languagePropagation and stays under target for fat context", () => {
    const fat = {
      message: "merhaba",
      languagePropagation: { uiLang: "tr", llmBcp47: "tr-TR", traceId: "TRC-x" },
      context: {
        languagePropagation: { uiLang: "tr", full: true },
        continuity: {
          sessionId: "s1",
          identity: { x: "y".repeat(20_000) },
          castleState: { z: Array.from({ length: 400 }, (_, i) => ({ i, blob: "a".repeat(400) })) },
          relationship: { trust: 0.5, emotions: { a: 1 } },
          rhizohMemoryEpisodes: Array.from({ length: 20 }, (_, i) => ({
            id: i,
            summary: "ep ".repeat(100)
          }))
        },
        life_continuity: { hints: "x".repeat(8000) },
        rhizohMultilingual: { big: "z".repeat(4000) },
        rhizohMemoryContract: "contract ".repeat(500)
      }
    };
    expect(measureRhizohJsonUtf8BytesV0(fat)).toBeGreaterThan(RHIZOH_LLM_TARGET_BODY_BYTES_V0);
    const { body, meta } = trimRhizohLlmRequestBodyV0(fat, { voiceTurn: true });
    expect(body.context.languagePropagation).toBeUndefined();
    expect(meta.trimmed).toBe(true);
    expect(measureRhizohJsonUtf8BytesV0(body)).toBeLessThanOrEqual(RHIZOH_LLM_MAX_BODY_BYTES_V0);
  });

  it("preserves rhizohCriticalContext through continuity trim", () => {
    const crit = buildRhizohCriticalContextV0({
      relationship: { bondScore: 0.61, trust: 0.58, relationalTone: { warmth: 0.7 } },
      rhizohNarrativeThread: { focusIntent: "reflect", arcSummary: "yalnızlık konusu açıldı" },
      rhizohGhostPerceptionV1: { overallTone: "tender", promptBlock: "field tone tender" },
      rhizohPerceptionArbitrationV1: {
        dominantFrame: "ghost",
        orderedPromptBlock: "primary ghost frame"
      }
    });
    expect(crit.narrativeSummary).toContain("reflect");
    expect(crit.ghostSummary).toContain("tender");
    expect(crit.arbitrationSummary).toContain("ghost");
  });
});
