import { describe, expect, it } from "vitest";
import { applyLocalCommandAppBindingV0 } from "../rhizohLocalCommandAppBindingV0.js";

describe("rhizohLocalCommandAppBindingV0", () => {
  it("emits cesium binding for map_open", () => {
    const b = applyLocalCommandAppBindingV0({
      canonical: "map_open",
      action: "open",
      layer: "map"
    });
    expect(b.target).toBe("cesium");
    expect(b.cesium?.engine).toBe("cesium");
    expect(b.cesium?.op).toBe("open");
  });

  it("emits camera binding for camera_open", () => {
    const b = applyLocalCommandAppBindingV0({
      canonical: "camera_open",
      action: "open",
      layer: "camera"
    });
    expect(b.target).toBe("camera");
    expect(b.camera?.engine).toBe("browser_media");
  });
});
