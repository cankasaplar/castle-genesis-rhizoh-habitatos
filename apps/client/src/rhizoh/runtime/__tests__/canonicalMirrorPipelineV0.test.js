import { describe, it, expect } from "vitest";
import {
  projectSubstrateFromNestedExecutionResultV0,
  projectSubstrateFromRouterPartsV0,
  canonicalSubstrateParityV0,
  CANONICAL_MIRROR_CONTRACT_VERSION
} from "../canonicalMirrorPipelineV0.js";
import { executionRouterV0 } from "../executionRouterV0.js";
import { stampExecutionCommandHashV0 } from "../executionCommandHashV0.js";
import { replayExecutionCanonicalV0 } from "../replayExecutionV0.js";

describe("canonicalMirrorPipelineV0", () => {
  it("rejects unknown top-level executionResult keys (mirror divergence guard)", () => {
    const r = projectSubstrateFromNestedExecutionResultV0(
      { light: { color: "#000000", brightness: 0.1, temp: 3000 }, rogue: true },
      1
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("unknown_key"))).toBe(true);
  });

  it("rejects unknown light keys", () => {
    const r = projectSubstrateFromNestedExecutionResultV0(
      { light: { color: "#000000", brightness: 0.1, temp: 3000, power: 1 } },
      1
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("light_unknown_key:power");
  });

  it("nested + router canonical paths agree for stamped LIGHT+MEDIA", () => {
    const t = 42;
    const lightCmd = stampExecutionCommandHashV0({
      namespace: "LIGHT_ACTUATOR",
      type: "SET_STATE",
      lane: "active",
      provenance: { locked: true, source: "canonical_test" },
      color: "#0a0b0c",
      brightness: 0.42,
      temperature: 3000
    });
    const mediaCmd = stampExecutionCommandHashV0({
      namespace: "MEDIA_ACTUATOR",
      type: "OPEN_YOUTUBE_LIVE",
      lane: "active",
      provenance: { locked: true, source: "canonical_test" }
    });
    const lightOut = executionRouterV0(lightCmd);
    const mediaOut = executionRouterV0(mediaCmd);
    const fromRouter = projectSubstrateFromRouterPartsV0({ light: lightOut, media: mediaOut }, t);
    expect(fromRouter.ok).toBe(true);
    const nested = projectSubstrateFromNestedExecutionResultV0(
      {
        light: { color: "#0a0b0c", brightness: 0.42, temp: 3000 },
        media: {
          action: "OPEN_URL",
          payload: "https://www.youtube.com/@CastleGenesis/live"
        }
      },
      t
    );
    expect(nested.ok).toBe(true);
    if (fromRouter.ok && nested.ok) {
      expect(canonicalSubstrateParityV0(fromRouter.box, nested.box)).toBe(true);
      expect(fromRouter.contractVersion).toBe(CANONICAL_MIRROR_CONTRACT_VERSION);
    }
  });

  it("replayExecutionCanonicalV0 surfaces ok:false for invalid frames", () => {
    const out = replayExecutionCanonicalV0([
      { frameId: "bad", at: 1, executionResult: { notAllowedTopKey: true } }
    ]);
    expect(out[0].ok).toBe(false);
    if (!out[0].ok) expect(out[0].errors.length).toBeGreaterThan(0);
  });

  it("replayExecutionCanonicalV0 ok for schema-valid frames", () => {
    const out = replayExecutionCanonicalV0([
      {
        frameId: "ok",
        at: 9,
        executionResult: { light: { color: "#abcdef", brightness: 0.5, temp: 2700 } }
      }
    ]);
    expect(out[0].ok).toBe(true);
    if (out[0].ok) expect(out[0].box.timestamp).toBe(9);
  });
});
