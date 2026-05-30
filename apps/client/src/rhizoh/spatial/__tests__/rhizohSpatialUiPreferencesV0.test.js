import { describe, it, expect, beforeEach } from "vitest";
import {
  defaultRhizohSpatialUiPrefsV0,
  mergeRhizohSpatialUiPrefsV0,
  readRhizohSpatialUiPrefsV0,
  writeRhizohSpatialUiPrefsV0,
  resolveSpatialMapSurfaceActiveV0,
  clearRhizohSpatialUiPrefsForTestV0
} from "../rhizohSpatialUiPreferencesV0.js";

describe("rhizohSpatialUiPreferencesV0", () => {
  beforeEach(() => {
    clearRhizohSpatialUiPrefsForTestV0();
  });

  it("defaults copy panel closed for immersion", () => {
    const d = defaultRhizohSpatialUiPrefsV0();
    expect(d.copyPanelOpen).toBe(false);
    expect(d.sections.hero).toBe(false);
    expect(d.sections.actions).toBe(true);
  });

  it("persists merged prefs", () => {
    writeRhizohSpatialUiPrefsV0(mergeRhizohSpatialUiPrefsV0({ copyPanelOpen: true, soundEnabled: true }));
    const r = readRhizohSpatialUiPrefsV0();
    expect(r.copyPanelOpen).toBe(true);
    expect(r.soundEnabled).toBe(true);
    expect(r.sections.hero).toBe(false);
  });

  it("map surface follows world layer not gateway", () => {
    expect(resolveSpatialMapSurfaceActiveV0("offline", { worldLayerEnabled: true })).toBe(true);
    expect(resolveSpatialMapSurfaceActiveV0("connecting", { worldLayerEnabled: true })).toBe(true);
    expect(resolveSpatialMapSurfaceActiveV0("connected", { worldLayerEnabled: false })).toBe(false);
  });
});
