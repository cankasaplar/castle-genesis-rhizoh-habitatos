import { describe, expect, it, beforeEach } from "vitest";
import {
  observeAmbientEnergyV0,
  resetAmbientEnergyWitnessForTestV0,
  VOICE_AMBIENT_ENERGY_TIER
} from "../voiceAmbientEnergyWitnessV0.js";
import {
  classifyVoiceDirectedSpeechBandV0,
  VOICE_DIRECTED_SPEECH_BAND
} from "../voiceDirectedSpeechObservationV0.js";

describe("voiceAmbientEnergyWitnessV0", () => {
  beforeEach(() => resetAmbientEnergyWitnessForTestV0());

  it("labels near speech when rms spikes above baseline", () => {
    observeAmbientEnergyV0({ maxRms: 0.02 });
    observeAmbientEnergyV0({ maxRms: 0.02 });
    const out = observeAmbientEnergyV0({ maxRms: 0.045 });
    expect(out.tier).toBe(VOICE_AMBIENT_ENERGY_TIER.NEAR);
  });

  it("labels distant when rms stays low vs baseline", () => {
    for (let i = 0; i < 12; i += 1) observeAmbientEnergyV0({ maxRms: 0.05 });
    const out = observeAmbientEnergyV0({ maxRms: 0.015 });
    expect(out.tier).toBe(VOICE_AMBIENT_ENERGY_TIER.DISTANT);
  });
});

describe("classify + ambient energy (witness only)", () => {
  beforeEach(() => resetAmbientEnergyWitnessForTestV0());

  it("distant energy nudges unknown neutral text to ambient band", () => {
    for (let i = 0; i < 12; i += 1) observeAmbientEnergyV0({ maxRms: 0.05 });
    const out = classifyVoiceDirectedSpeechBandV0({
      text: "Bugün hava güzeldi.",
      confidence: 0.55,
      maxRms: 0.015
    });
    expect(out.energyTier).toBe(VOICE_AMBIENT_ENERGY_TIER.DISTANT);
    expect(out.band).toBe(VOICE_DIRECTED_SPEECH_BAND.AMBIENT);
  });
});
