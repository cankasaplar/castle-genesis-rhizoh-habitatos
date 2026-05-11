import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { getRhizohOperationalDriftPanelSnapshot } from "../rhizohOperationalDriftPanelV1.js";

describe("rhizohOperationalDriftPanelV1", () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => {
          store[k] = String(v);
        },
        removeItem: (k) => {
          delete store[k];
        },
        clear: () => {
          for (const pk of Object.keys(store)) delete store[pk];
        }
      }
    );
    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
      location: { origin: "http://localhost:5173" }
    });
    globalThis.__RHIZOH_TEST_GATEWAY_HTTP__ = "http://localhost:8090/rhizoh/llm";
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    delete globalThis.__RHIZOH_TEST_GATEWAY_HTTP__;
    vi.unstubAllGlobals();
  });

  it("returns schemaVersion and learningRate in snapshot", () => {
    const s = getRhizohOperationalDriftPanelSnapshot(Date.now());
    expect(s.schemaVersion).toBe("1.0.0");
    expect(s.learningRate && typeof s.learningRate.effectiveMultiplier01 === "number").toBe(true);
    expect(typeof s.divergence?.externalLagIndex01 === "number").toBe(true);
    expect(s.realWorldAlignment?.gaps?.A_groundTruthNotIndependent).toBeTruthy();
    expect(s.groundingPosture?.fundamentalTruth).toContain("iç referanslı");
    expect(s.groundingPosture?.alignmentVsTruth?.warning).toBeTruthy();
  });
});
