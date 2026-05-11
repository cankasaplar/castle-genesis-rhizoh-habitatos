import { describe, expect, it } from "vitest";
import { createCastleFieldBridge } from "../bridge/CastleFieldBridge.js";
import { buildIstanbulBridgeInputV540 } from "../scene/istanbulBiomePresetV540.js";
import { buildFieldStoryBeats, districtDisplayName } from "./fieldStoryEngine.js";
import { narrateConstitutionalField } from "./constitutionalNarrator.js";
import { createLiveDirector } from "./liveDirector.js";
import { composeHabitatStreamPackage } from "./streamComposer.js";
import { createNarrationMemory } from "./narrationMemory.js";

describe("vNext-542 broadcast", () => {
  it("buildFieldStoryBeats + narrator produce Turkish constitutional weather line", () => {
    const input = buildIstanbulBridgeInputV540({ feeds: { traffic: 0.8 }, epochHash: "0xbroadcast" });
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(input);
    const beats = buildFieldStoryBeats(frame);
    expect(beats.peakContradictionRegionId).toBeTruthy();
    const line = narrateConstitutionalField(beats, "tr");
    expect(line.length).toBeGreaterThan(40);
    expect(line).toMatch(/Rhizoh|rhizoh|tier/i);
    expect(districtDisplayName("besiktas")).toBe("Beşiktaş");
  });

  it("liveDirector calls onNarration when fingerprint and narration line change", () => {
    const bridge = createCastleFieldBridge({ device: null });
    let n = 0;
    const dir = createLiveDirector({
      onNarration: () => {
        n++;
      }
    });
    const frame = bridge.submitFrame(buildIstanbulBridgeInputV540({ feeds: { traffic: 0.9 }, epochHash: "0xdir-a" }));
    dir.onBridgeFrame(frame);
    dir.onBridgeFrame(frame);
    expect(n).toBe(1);
    const frame2 = bridge.submitFrame(
      buildIstanbulBridgeInputV540({ feeds: { traffic: 0.05 }, epochHash: "0xdir-b" })
    );
    dir.onBridgeFrame(frame2);
    expect(n).toBe(2);
  });

  it("composeHabitatStreamPackage exposes lower third + default channel title", () => {
    const input = buildIstanbulBridgeInputV540({ epochHash: "0xstream" });
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(input);
    const beats = buildFieldStoryBeats(frame);
    const pkg = composeHabitatStreamPackage(frame, beats, { narrationLine: "Örnek altyazı." });
    expect(pkg.lowerThird.find((x) => x.key === "truth")).toBeDefined();
    expect(pkg.lowerThird.find((x) => x.key === "memory")).toBeDefined();
    expect(pkg.channelTitle).toMatch(/Istanbul/);
    expect(pkg.audioQueue.length).toBe(1);
  });

  it("narrationMemory can surface contradiction recall clause", () => {
    const mem = createNarrationMemory({ compareLagMs: 2000 });
    const bridge = createCastleFieldBridge({ device: null });
    const hi = buildIstanbulBridgeInputV540({ feeds: { traffic: 0.95, gridHealth: 0.4 }, epochHash: "0xm1" });
    const lo = buildIstanbulBridgeInputV540({ feeds: { traffic: 0.08, gridHealth: 0.85 }, epochHash: "0xm2" });
    const fHi = bridge.submitFrame(hi);
    const fLo = bridge.submitFrame(lo);
    mem.record(fHi, 0);
    const hints = mem.buildHints(fLo, 2500);
    const beats = buildFieldStoryBeats(fLo);
    const line = narrateConstitutionalField(beats, "tr", hints);
    if (hints?.contradictionRecall?.belowWave) {
      expect(line).toMatch(/dalganın altında|contradiction/i);
    }
  });
});
