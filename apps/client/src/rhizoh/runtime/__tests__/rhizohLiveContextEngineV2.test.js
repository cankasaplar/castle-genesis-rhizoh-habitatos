import { describe, expect, it } from "vitest";
import {
  RHIZOH_CONTEXT_PRIORITY_V2,
  buildRhizohLiveContextEnvelopeV2,
  classifyRhizohLiveContextIntentV2
} from "../rhizohLiveContextEngineV2.js";

describe("rhizohLiveContextEngineV2", () => {
  it("classifies sports and spatial intents", () => {
    expect(classifyRhizohLiveContextIntentV2("Fenerbahçe ne yapıyor?")).toBe("sports_live");
    expect(classifyRhizohLiveContextIntentV2("Bana etrafı anlat")).toBe("spatial_briefing");
  });

  it("prioritizes live world context and emits suggested actions", () => {
    const env = buildRhizohLiveContextEnvelopeV2({
      userMessage: "Fenerbahçe ne yapıyor?",
      spatial: { label: "Kadıköy", source: "user_anchor", lat: 40.99, lon: 29.03 },
      memory: { intents: ["spor konuşuldu"], spatial: ["Kadıköy"], narrative: ["harita keşfi başladı"] },
      liveWorld: {
        source: "test_live_feed",
        sports: {
          live: [{ homeName: "Fenerbahçe", awayName: "Rakip", homeScore: 1, awayScore: 0 }]
        }
      },
      suggestedActions: [
        { id: "open_match_map", labelTr: "Maçı haritada aç", labelEn: "Open match on map", command: "set_map_tool", confidence: 0.8 }
      ]
    });

    expect(env.priority).toBe(RHIZOH_CONTEXT_PRIORITY_V2);
    expect(env.intent).toBe("sports_live");
    expect(env.liveInjection.kind).toBe("sports");
    expect(env.state.spatial.label).toBe("Kadıköy");
    expect(env.state.memory.intents).toEqual(["spor konuşuldu"]);
    expect(env.suggestedActions[0]).toMatchObject({ id: "open_match_map", confidence: 0.8 });
    expect(env.responseContract.rhythm).toBe("answer_direction_discovery");
  });

  it("keeps LLM as fallback when live context is absent", () => {
    const env = buildRhizohLiveContextEnvelopeV2({
      userMessage: "Rhizoh ne yapar?"
    });

    expect(env.intent).toBe("general_context");
    expect(env.liveInjection).toBeNull();
    expect(env.priority.llmFallback).toBe(0.1);
  });
});
