import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveProductShellSelectionV0,
  shouldStartGreenRoomPresenceMeshV0,
  clearProductSurfaceForTestV0
} from "../rhizohProductShellBridgeV0.js";

describe("rhizohProductShellBridgeV0", () => {
  beforeEach(() => {
    clearProductSurfaceForTestV0();
  });

  it("world double-tap closes drawer", () => {
    expect(resolveProductShellSelectionV0("world", "world")).toEqual({
      surface: "world",
      toggleDrawer: false,
      closeDrawer: true
    });
  });

  it("hall opens drawer", () => {
    expect(resolveProductShellSelectionV0("hall", "world").surface).toBe("hall");
    expect(shouldStartGreenRoomPresenceMeshV0("hall")).toBe(true);
    expect(shouldStartGreenRoomPresenceMeshV0("studio")).toBe(false);
  });
});
