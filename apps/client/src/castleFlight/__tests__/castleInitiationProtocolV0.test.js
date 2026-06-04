import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyCastleInitIntentV0,
  executeCastleInitSkipV0,
  publishCastleInitStateV0
} from "../castleInitiationProtocolV0.js";

describe("castleInitiationProtocolV0", () => {
  afterEach(() => {
    publishCastleInitStateV0({ phase: "idle", pendingMapPick: false });
  });

  it("classifies rhizoh kale kur as CASTLE_CREATE", () => {
    const c = classifyCastleInitIntentV0("Rhizoh kale kur");
    expect(c?.intent).toBe("CASTLE_CREATE");
    expect(c?.needsLocation).toBe(true);
  });

  it("executeCastleInitSkipV0 uses abstract_world_node without synthetic POI rows", async () => {
    const applyPersonalCastleDsl = vi.fn();
    const out = await executeCastleInitSkipV0({
      owner: "u-test",
      castleType: "SANCTUARY",
      readClientContinuity: () => ({ meta: {} }),
      writeClientContinuity: vi.fn()
    });
    expect(out.ok).toBe(true);
    expect(out.source).toBe("abstract");
    expect(applyPersonalCastleDsl).not.toHaveBeenCalled();
    expect(window.__CASTLE_INIT__?.source).toBe("abstract");
    expect(window.__CASTLE_INIT__?.phase).toBe("complete");
  });
});
