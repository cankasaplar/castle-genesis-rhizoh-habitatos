import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getRhizohCommandPanelAuxExpandedSnapshotV0,
  isRhizohCommandPanelAuxExpandedV0,
  subscribeRhizohCommandPanelAuxExpandedV0,
  writeRhizohCommandPanelAuxExpandedV0
} from "../rhizohCommandPanelPrefsV0.js";

const AUX_KEY_V2 = "rhizoh.command_panel_aux.v2";

describe("rhizohCommandPanelPrefsV0", () => {
  afterEach(() => {
    localStorage.removeItem(AUX_KEY_V2);
    localStorage.removeItem("rhizoh.command_panel_aux.v1");
  });

  it("defaults advanced aux to collapsed", () => {
    expect(isRhizohCommandPanelAuxExpandedV0()).toBe(false);
    expect(localStorage.getItem(AUX_KEY_V2)).toBe("0");
  });

  it("write is single SSOT for T0 and spatial dock", () => {
    writeRhizohCommandPanelAuxExpandedV0(true);
    expect(getRhizohCommandPanelAuxExpandedSnapshotV0()).toBe(true);
    writeRhizohCommandPanelAuxExpandedV0(false);
    expect(getRhizohCommandPanelAuxExpandedSnapshotV0()).toBe(false);
  });

  it("notifies subscribers on same-tab write (T0 toggle → spatial dock)", () => {
    const spy = vi.fn();
    const unsub = subscribeRhizohCommandPanelAuxExpandedV0(spy);
    writeRhizohCommandPanelAuxExpandedV0(true);
    expect(spy).toHaveBeenCalledTimes(1);
    writeRhizohCommandPanelAuxExpandedV0(false);
    expect(spy).toHaveBeenCalledTimes(2);
    unsub();
  });
});
