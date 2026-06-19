import { describe, it, expect, beforeEach } from "vitest";
import {
  assertRhizohRuntimeSurfaceV0,
  bindRhizohRuntimeSurfaceV0,
  ensureRhizohRuntimeSurfaceBinderV0,
  resetRhizohRuntimeSurfaceBinderForTestV0,
  RUNTIME_SURFACE_API_KEYS_V0
} from "../rhizohRuntimeSurfaceBinderV0.js";

describe("rhizohRuntimeSurfaceBinderV0", () => {
  beforeEach(() => {
    resetRhizohRuntimeSurfaceBinderForTestV0();
    window.__rhizoh = {};
  });

  it("binds fusion interaction surface APIs", () => {
    bindRhizohRuntimeSurfaceV0(window.__rhizoh);
    const result = assertRhizohRuntimeSurfaceV0(window.__rhizoh);

    expect(result.ok).toBe(true);
    expect(RUNTIME_SURFACE_API_KEYS_V0).toHaveLength(9);
    for (const key of RUNTIME_SURFACE_API_KEYS_V0) {
      expect(typeof window.__rhizoh[key]).toBe("function");
    }
  });

  it("ensure is idempotent and exposes binder metadata", () => {
    ensureRhizohRuntimeSurfaceBinderV0();
    ensureRhizohRuntimeSurfaceBinderV0();

    expect(window.__rhizoh.runtimeSurfaceBinder?.phase).toBe(
      "post_ontological_gate_pre_react_mount"
    );
    assertRhizohRuntimeSurfaceV0();
  });

  it("assert throws when namespace incomplete", () => {
    expect(() => assertRhizohRuntimeSurfaceV0({})).toThrow(/missing APIs/);
  });
});
