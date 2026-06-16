import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetRhizohPwaPermissionsN12ForTestV0,
  canCacheAppShellN12V0,
  canPersistUserMemoryN12V0,
  canPersistUserTopologyN12V0,
  isCameraSyncGrantedN12V0,
  readRhizohPwaPermissionsN12V0,
  writeRhizohPwaPermissionsN12V0
} from "../rhizohPwaPermissionsN12V0.js";

describe("rhizohPwaPermissionsN12V0", () => {
  beforeEach(() => {
    __resetRhizohPwaPermissionsN12ForTestV0();
  });

  it("defaults all grants to false", () => {
    const p = readRhizohPwaPermissionsN12V0();
    expect(p.camera).toBe(false);
    expect(p.topology).toBe(false);
    expect(p.memory).toBe(false);
    expect(isCameraSyncGrantedN12V0()).toBe(false);
    expect(canPersistUserTopologyN12V0()).toBe(false);
    expect(canPersistUserMemoryN12V0()).toBe(false);
  });

  it("app shell cache is always allowed", () => {
    expect(canCacheAppShellN12V0()).toBe(true);
  });

  it("writeRhizohPwaPermissionsN12V0 patches grants", () => {
    writeRhizohPwaPermissionsN12V0({ camera: true, topology: true });
    expect(isCameraSyncGrantedN12V0()).toBe(true);
    expect(canPersistUserTopologyN12V0()).toBe(true);
    expect(canPersistUserMemoryN12V0()).toBe(false);
  });
});
