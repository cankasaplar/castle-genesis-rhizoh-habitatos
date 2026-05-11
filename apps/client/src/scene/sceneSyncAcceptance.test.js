import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { CastleSceneSync, sceneSyncShouldUpdate } from "./CastleSceneSync.js";
import { createCastleFieldBridge } from "../bridge/CastleFieldBridge.js";
import { buildIstanbulBridgeInputV540 } from "./istanbulBiomePresetV540.js";

describe("vNext-540 CastleSceneSync", () => {
  it("sceneSyncShouldUpdate is false when fingerprint unchanged", () => {
    expect(sceneSyncShouldUpdate(null, "0x1")).toBe(true);
    expect(sceneSyncShouldUpdate("0x1", "0x1")).toBe(false);
    expect(sceneSyncShouldUpdate("0x1", "0x2")).toBe(true);
    expect(sceneSyncShouldUpdate("0x1", "")).toBe(false);
  });

  it("Istanbul preset yields five atlas cells and bridge carries atlas + segments", () => {
    const input = buildIstanbulBridgeInputV540({ feeds: { traffic: 0.62 }, t: 0.1, epochHash: "0xist-test" });
    expect(input.atlas.cellCount).toBe(5);
    expect(input.regionalMap.size).toBe(5);
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(input);
    expect(frame.atlas).toBe(input.atlas);
    expect(frame.regionalMap.size).toBe(input.regionalMap.size);
    expect(frame.regionalMap.get("besiktas")).toBe(input.regionalMap.get("besiktas"));
    expect(frame.branchSegments.length).toBeGreaterThan(0);
    expect(frame.overlayState.rhizohSovereign).toBeDefined();
    expect(frame.overlayState.rhizohSovereign.mutation).toMatch(/pending|sealed/);
  });

  it("CastleSceneSync skips mesh sync when frameFingerprint matches (cheap path)", () => {
    const scene = new THREE.Scene();
    const sync = new CastleSceneSync(scene, { labelsEnabled: false });
    const spy = vi.spyOn(sync.fieldVolume, "sync");
    const input = buildIstanbulBridgeInputV540({ epochHash: "0xfingerprint-stable" });
    const bridge = createCastleFieldBridge({ device: null });
    const frame = bridge.submitFrame(input);
    sync.update(frame);
    sync.update(frame);
    expect(spy).toHaveBeenCalledTimes(1);
    sync.dispose();
  });
});
