import { describe, it, expect, beforeEach } from "vitest";
import { segmentSpeechTextV0 } from "../rhizohSpeechSentenceSegmenterV0.js";
import { buildMeaningDensityMapV0 } from "../rhizohSpeechMeaningDensityMapV0.js";
import { distributeSpeechEmphasisV0 } from "../rhizohSpeechEmphasisDistributorV0.js";
import { computeSpeechRhythmPlanV0 } from "../rhizohSpeechRhythmMotorV0.js";
import {
  runSpeechMeaningEngineV0,
  resetSpeechMeaningEngineV0
} from "../rhizohSpeechMeaningEngineV0.js";

describe("rhizohSpeechMeaningEngineV0", () => {
  beforeEach(() => resetSpeechMeaningEngineV0());

  it("segments Turkish sentences and clauses", () => {
    const seg = segmentSpeechTextV0(
      "Merhaba Rhizoh. Dün ne konuşmuştuk; hatırlıyor musun? Bu önemli."
    );
    expect(seg.segments.length).toBeGreaterThanOrEqual(2);
    expect(seg.segments.some((s) => s.endsWithQuestion)).toBe(true);
  });

  it("builds meaning density map with hotspots", () => {
    const seg = segmentSpeechTextV0("Rhizoh, gerçekten neden bu dünya önemli?");
    const map = buildMeaningDensityMapV0(seg);
    expect(map.utteranceDensity01).toBeGreaterThan(0.3);
    expect(map.segments.length).toBe(seg.segments.length);
  });

  it("distributes emphasis budget across segments", () => {
    const seg = segmentSpeechTextV0("Sakin kal. Ama Rhizoh, şimdi duyuyor musun?");
    const map = buildMeaningDensityMapV0(seg);
    const emp = distributeSpeechEmphasisV0(seg, map);
    const sum = emp.segments.reduce((s, e) => s + e.emphasis01, 0);
    expect(sum).toBeGreaterThan(0.9);
    expect(sum).toBeLessThanOrEqual(1.05);
    expect(emp.peakEmphasis01).toBeGreaterThan(0);
  });

  it("rhythm motor aligns to collapsed breath, not phase names", () => {
    const seg = segmentSpeechTextV0("Kısa bir cümle. İkinci cümle.");
    const map = buildMeaningDensityMapV0(seg);
    const emp = distributeSpeechEmphasisV0(seg, map);
    const rhythm = computeSpeechRhythmPlanV0({
      segmentation: seg,
      emphasis: emp,
      densityMap: map,
      conversationBehavior: {
        rhythm: { breath: "exhale", pacing: "flowing" },
        continuity01: 0.6,
        toneStability01: 0.8
      }
    });
    expect(rhythm.breathAlign).toBe("exhale");
    expect(rhythm.cues.length).toBe(2);
    expect(rhythm.meanPauseMs).toBeLessThan(400);
    expect(String(rhythm.pacing)).not.toMatch(/accumulate|release|conserve/);
  });

  it("runSpeechMeaningEngineV0 returns collapsed resonance", () => {
    const out = runSpeechMeaningEngineV0({
      text: "Rhizoh, dünkü konuşmayı hatırlıyor musun?",
      conversationBehavior: {
        rhythm: { breath: "hold", pacing: "measured" },
        continuity01: 0.7
      },
      role: "user",
      traceId: "TRC-SME-1"
    });
    expect(out.resonance.segmentCount).toBeGreaterThan(0);
    expect(out.resonance.breathAlign).toBe("hold");
    expect(out.densityMap.hotspots.length).toBeGreaterThanOrEqual(0);
  });
});
