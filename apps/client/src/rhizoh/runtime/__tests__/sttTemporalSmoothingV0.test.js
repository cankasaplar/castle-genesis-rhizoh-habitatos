import { describe, expect, it, beforeEach } from "vitest";
import {
  applySttTemporalSmoothingV0,
  classifySttScriptBucketV0,
  detectSttTemporalNoiseV0,
  ingestSttTemporalFrameV0,
  resetSttTemporalSmoothingV0,
  resolveSttTemporalProfileV0,
  STT_SCRIPT_BUCKET_V0,
  STT_TEMPORAL_PROFILE_ID_V0,
  STT_TEMPORAL_PROFILE_NOISY_V0,
  STT_TEMPORAL_PROFILE_QUIET_V0,
  __resetSttTemporalSmoothingForTestV0,
  __setSttTemporalActiveProfileForTestV0
} from "../sttTemporalSmoothingV0.js";

describe("sttTemporalSmoothingV0", () => {
  beforeEach(() => {
    __resetSttTemporalSmoothingForTestV0();
  });

  it("classifies Turkish Latin vs Arabic script buckets", () => {
    expect(classifySttScriptBucketV0("merhaba nasılsın")).toBe(STT_SCRIPT_BUCKET_V0.LATIN_TR);
    expect(classifySttScriptBucketV0("سیزن ایکایی")).toBe(STT_SCRIPT_BUCKET_V0.ARABIC);
  });

  it("uses quiet profile in low-noise context", () => {
    const profile = resolveSttTemporalProfileV0({
      text: "merhaba",
      confidence: 0.62,
      maxRms: 0.02,
      band: "directed_candidate"
    });
    expect(profile.id).toBe(STT_TEMPORAL_PROFILE_ID_V0.QUIET);
    expect(profile.windowSize).toBe(STT_TEMPORAL_PROFILE_QUIET_V0.windowSize);
    expect(profile.emaAlpha).toBe(STT_TEMPORAL_PROFILE_QUIET_V0.emaAlpha);
    expect(profile.spikeThreshold).toBe(STT_TEMPORAL_PROFILE_QUIET_V0.spikeThreshold);
  });

  it("switches to noisy profile when TV/ambient signals detected", () => {
    ingestSttTemporalFrameV0({
      text: "merhaba",
      confidence: 0.55,
      isFinal: false,
      band: "ambient",
      ambientScore: 2
    });
    const noise = detectSttTemporalNoiseV0({
      text: "background tv",
      band: "ambient",
      ambientScore: 3,
      maxRms: 0.04
    });
    expect(noise.noiseDetectedHigh).toBe(true);

    const profile = resolveSttTemporalProfileV0({
      band: "ambient",
      ambientScore: 3,
      maxRms: 0.04
    });
    expect(profile.id).toBe(STT_TEMPORAL_PROFILE_ID_V0.NOISY);
    expect(profile.windowSize).toBe(7);
    expect(profile.emaAlpha).toBe(0.25);
    expect(profile.spikeThreshold).toBe(0.18);
  });

  it("smooths confidence across frames (decays single spike)", () => {
    ingestSttTemporalFrameV0({ text: "merhaba", confidence: 0.62, isFinal: false });
    ingestSttTemporalFrameV0({ text: "merhaba nasılsın", confidence: 0.64, isFinal: false });
    const agg = applySttTemporalSmoothingV0({
      text: "merhaba nasılsın bugün",
      confidence: 0.9,
      isFinal: true,
      source: "mic_v3"
    });
    expect(agg.effectiveConfidence).toBeLessThan(0.9);
    expect(agg.effectiveConfidence).toBeGreaterThan(0.55);
  });

  it("suppresses Arabic noise spike when majority is Latin TR (noisy profile)", () => {
    __setSttTemporalActiveProfileForTestV0(STT_TEMPORAL_PROFILE_ID_V0.NOISY);
    ingestSttTemporalFrameV0({
      text: "merhaba rhizoh",
      confidence: 0.61,
      isFinal: false,
      source: "mic",
      band: "ambient",
      ambientScore: 2
    });
    ingestSttTemporalFrameV0({
      text: "haritayı aç lütfen",
      confidence: 0.63,
      isFinal: false,
      source: "mic",
      band: "ambient",
      ambientScore: 2
    });
    const agg = applySttTemporalSmoothingV0({
      text: "سیزن ایکایی",
      confidence: 0.88,
      maxRms: 0.01,
      isFinal: true,
      source: "mic_v3",
      band: "ambient",
      ambientScore: 3,
      noiseDetectedHigh: true
    });
    expect(agg.profileId).toBe(STT_TEMPORAL_PROFILE_ID_V0.NOISY);
    expect(agg.majorityScript).toMatch(/latin/);
    expect(agg.suppress || agg.scriptOutlier).toBe(true);
  });

  it("resets buffer and profile cleanly", () => {
    ingestSttTemporalFrameV0({ text: "test", confidence: 0.5 });
    __setSttTemporalActiveProfileForTestV0(STT_TEMPORAL_PROFILE_ID_V0.NOISY);
    resetSttTemporalSmoothingV0();
    const agg = applySttTemporalSmoothingV0({ text: "yeni", confidence: 0.6, isFinal: true });
    expect(agg.frameCount).toBe(1);
    expect(agg.profileId).toBe(STT_TEMPORAL_PROFILE_ID_V0.QUIET);
  });
});
