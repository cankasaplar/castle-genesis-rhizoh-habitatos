import { describe, expect, it } from "vitest";
import { ensureCastleWorldTopology } from "../lib/bootstrapWorldTopology";
import { resetRhizohStudioKernelStore } from "../store/studioStore";
import { resolveWorldRoute } from "../store/worldTopologySlice";

describe("world topology", () => {
  it("bootstraps canonical regions and resolves routes", () => {
    resetRhizohStudioKernelStore();
    ensureCastleWorldTopology();
    const rt = resolveWorldRoute("region:green-room", "region:academy");
    expect(rt.ok).toBe(true);
    if (rt.ok) {
      expect(rt.value[0]).toBe("region:green-room");
      expect(rt.value.includes("region:castle-district")).toBe(true);
      expect(rt.value[rt.value.length - 1]).toBe("region:academy");
    }
  });
});
