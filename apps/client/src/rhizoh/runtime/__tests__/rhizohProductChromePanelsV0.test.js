import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  defaultRhizohChromePanelsOpenV0,
  getRhizohChromePanelsSnapshotV0,
  isRhizohProductChromePanelOpenV0,
  readRhizohChromePanelsOpenV0,
  setRhizohProductSurfacePanelExclusiveV0,
  toggleRhizohProductSurfacePanelV0
} from "../rhizohProductChromePanelsV0.js";

describe("rhizohProductChromePanelsV0", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults all surface panels closed", () => {
    expect(defaultRhizohChromePanelsOpenV0().world).toBe(false);
    expect(defaultRhizohChromePanelsOpenV0().studio).toBe(false);
  });

  it("exclusive open closes other panels", () => {
    setRhizohProductSurfacePanelExclusiveV0("studio", true);
    expect(isRhizohProductChromePanelOpenV0("studio")).toBe(true);
    expect(isRhizohProductChromePanelOpenV0("world")).toBe(false);
  });

  it("bottom nav toggle closes when same surface already open", () => {
    setRhizohProductSurfacePanelExclusiveV0("hall", true);
    const r = toggleRhizohProductSurfacePanelV0("hall", "hall");
    expect(r.closed).toBe(true);
    expect(readRhizohChromePanelsOpenV0().hall).toBe(false);
  });

  it("opens world panel (wheel) exclusively", () => {
    setRhizohProductSurfacePanelExclusiveV0("world", true);
    expect(isRhizohProductChromePanelOpenV0("world")).toBe(true);
    expect(isRhizohProductChromePanelOpenV0("hall")).toBe(false);
  });

  it("getRhizohChromePanelsSnapshotV0 is referentially stable when unchanged", () => {
    const a = getRhizohChromePanelsSnapshotV0();
    const b = getRhizohChromePanelsSnapshotV0();
    expect(a).toBe(b);
    setRhizohProductSurfacePanelExclusiveV0("studio", true);
    const c = getRhizohChromePanelsSnapshotV0();
    expect(c).not.toBe(a);
    const d = getRhizohChromePanelsSnapshotV0();
    expect(c).toBe(d);
  });
});
