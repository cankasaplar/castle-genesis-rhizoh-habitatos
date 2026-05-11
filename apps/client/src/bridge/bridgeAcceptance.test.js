import { describe, expect, it } from "vitest";
import { buildFieldAtlas } from "../kernel/render/fieldAtlasBuilder.js";
import { buildBranchRiverSegments } from "../kernel/render/branchRiverRenderer.js";
import { composeFieldFrame, resolveCanonicalRegionalMap } from "./fieldFrameComposer.js";
import { createCastleFieldBridge } from "./CastleFieldBridge.js";
import { packBranchSegmentsForGpu } from "./branchBufferUploader.js";
import { probeFieldDevice } from "./deviceFieldAdapter.js";

describe("vNext-539 CastleFieldBridge", () => {
  it("composeFieldFrame produces overlay + stable fingerprint contract", () => {
    const atlas = buildFieldAtlas({
      cells: [
        {
          cx: 0,
          cy: 0,
          cz: 0,
          sample: {
            regionId: "istanbul",
            pressureMean: [0.7, 0.2, 0.8, 0.5, 0.4],
            resonanceMean: [0.65, 0.15, 0.55, 0.82, 0.42],
            branchEntropy: 0.12,
            conflictSeverity: 0.08
          }
        }
      ]
    });
    const branchSegments = buildBranchRiverSegments({
      parentEpochHash: "0xe0",
      children: [{ epochHash: "0xe1", lineageBranchId: "main" }],
      prunedHashes: []
    });
    const a = composeFieldFrame({
      atlas,
      regionalSamples: new Map([["istanbul", 1]]),
      branchSegments,
      weatherSummary: { glow: 0.5 },
      epochHash: "0xabc"
    });
    expect(a.overlayState.epochHash).toBe("0xabc");
    expect(a.overlayState.cellCount).toBe(1);
    expect(a.overlayState.branchSegmentCount).toBeGreaterThan(0);
    expect(a.frameFingerprint.startsWith("0x")).toBe(true);
    const b = composeFieldFrame({
      atlas,
      regionalSamples: new Map([["istanbul", 1]]),
      branchSegments,
      weatherSummary: { glow: 0.5 },
      epochHash: "0xabc"
    });
    expect(b.frameFingerprint).toBe(a.frameFingerprint);
  });

  it("submitFrame without GPU returns null buffers but still fingerprints", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const atlas = buildFieldAtlas({
      cells: [
        {
          cx: 1,
          cy: 1,
          cz: 1,
          sample: {
            regionId: "x",
            pressureMean: [0.5, 0.5, 0.5, 0.5, 0.5],
            resonanceMean: [0.5, 0.5, 0.5, 0.5, 0.5],
            branchEntropy: 0,
            conflictSeverity: 0
          }
        }
      ]
    });
    const out = bridge.submitFrame({ atlas, epochHash: "0x1" });
    expect(out.fieldBuffer).toBeNull();
    expect(out.branchBuffer).toBeNull();
    expect(out.fieldTexture).toBeNull();
    expect(out.atlas).toBe(atlas);
    expect(out.branchSegments).toEqual([]);
    expect(out.overlayState.rhizohSovereign.tier).toBe("L1");
    expect(out.frameFingerprint).toMatch(/^0x[0-9a-f]+$/);
  });

  it("submitFrame echoes rhizohSovereign overrides into overlayState", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const atlas = buildFieldAtlas({
      cells: [
        {
          cx: 0,
          cy: 0,
          cz: 0,
          sample: {
            regionId: "x",
            pressureMean: [0.5, 0.5, 0.5, 0.5, 0.5],
            resonanceMean: [0.5, 0.5, 0.5, 0.5, 0.5],
            branchEntropy: 0,
            conflictSeverity: 0
          }
        }
      ]
    });
    const out = bridge.submitFrame({
      atlas,
      epochHash: "0xz",
      rhizohSovereign: { tier: "L3", mutation: "pending", drift: 0.2 }
    });
    expect(out.overlayState.rhizohSovereign.tier).toBe("L3");
    expect(out.overlayState.rhizohSovereign.mutation).toBe("pending");
    expect(out.overlayState.rhizohSovereign.drift).toBe(0.2);
  });

  it("packBranchSegmentsForGpu is deterministic", () => {
    const segs = buildBranchRiverSegments({
      parentEpochHash: "0xp",
      children: [{ epochHash: "0xc", lineageBranchId: "main" }],
      prunedHashes: []
    });
    const p1 = packBranchSegmentsForGpu(segs);
    const p2 = packBranchSegmentsForGpu(segs);
    expect(p1.length).toBe(p2.length);
    for (let i = 0; i < p1.length; i++) expect(p1[i]).toBe(p2[i]);
  });

  it("resolveCanonicalRegionalMap prefers regionalMap over regionalSamples", () => {
    const a = new Map([["x", 1]]);
    const b = new Map([["x", 2]]);
    const r = resolveCanonicalRegionalMap({ regionalMap: a, regionalSamples: b });
    expect(r.get("x")).toBe(1);
  });

  it("submitFrame includes regionalMap aligned with input", () => {
    const bridge = createCastleFieldBridge({ device: null });
    const atlas = buildFieldAtlas({
      cells: [
        {
          cx: 0,
          cy: 0,
          cz: 0,
          sample: {
            regionId: "istanbul",
            pressureMean: [0.5, 0.5, 0.5, 0.5, 0.5],
            resonanceMean: [0.5, 0.5, 0.5, 0.5, 0.5],
            branchEntropy: 0,
            conflictSeverity: 0
          }
        }
      ]
    });
    const regionalMap = new Map([
      [
        "istanbul",
        {
          regionId: "istanbul",
          pressureMean: [0.5, 0.5, 0.5, 0.5, 0.5],
          resonanceMean: [0.5, 0.5, 0.5, 0.5, 0.5],
          branchEntropy: 0,
          conflictSeverity: 0
        }
      ]
    ]);
    const out = bridge.submitFrame({ atlas, regionalMap, epochHash: "0xrm" });
    expect(out.regionalMap.get("istanbul")).toBeDefined();
    expect(out.regionalMap.size).toBe(1);
  });

  it("probeFieldDevice exposes delta-stream preference", () => {
    const p = probeFieldDevice({});
    expect(typeof p.hasWebGpu).toBe("boolean");
    expect(p.prefersDeltaStream).toBe(true);
  });
});
