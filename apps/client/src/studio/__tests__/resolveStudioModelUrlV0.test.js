import { describe, expect, it } from "vitest";
import { resolveStudioModelUrlV0 } from "../resolveStudioModelUrlV0.js";
import { STUDIO_MODEL_RH_GLOWING_V0 } from "../studioLiveRoomModelRefsV0.js";

describe("resolveStudioModelUrlV0", () => {
  it("maps legacy asset:// shane ref to rhizoh stage GLB", () => {
    expect(resolveStudioModelUrlV0("asset://castle/pet/shane-core.glb")).toBe(
      STUDIO_MODEL_RH_GLOWING_V0
    );
  });

  it("passes through absolute web paths", () => {
    expect(resolveStudioModelUrlV0("/models/foo.glb")).toBe("/models/foo.glb");
  });
});
