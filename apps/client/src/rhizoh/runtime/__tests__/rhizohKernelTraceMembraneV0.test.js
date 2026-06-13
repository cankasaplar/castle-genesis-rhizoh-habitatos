import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dispatchRhizohKernelTraceEventV0,
  isRhizohKernelTraceExposedV0,
  publishRhizohKernelTraceGlobalV0,
  RHIZOH_KERNEL_TRACE_GLOBAL_KEYS_V0,
  scrubRhizohKernelTraceGlobalsV0
} from "../rhizohKernelTraceMembraneV0.js";

describe("rhizohKernelTraceMembraneV0", () => {
  beforeEach(() => {
    import.meta.env.DEV = false;
    import.meta.env.VITE_DEBUG = "0";
    import.meta.env.VITE_RHIZOH_KERNEL_TRACE_DEBUG = "0";
    for (const key of RHIZOH_KERNEL_TRACE_GLOBAL_KEYS_V0) {
      delete window[key];
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of RHIZOH_KERNEL_TRACE_GLOBAL_KEYS_V0) {
      delete window[key];
    }
  });

  it("hides kernel trace globals in production without granular flag", () => {
    expect(isRhizohKernelTraceExposedV0()).toBe(false);
    publishRhizohKernelTraceGlobalV0("__RHIZOH_CONTEXT_INTENT__", { intentId: "x" });
    expect(window.__RHIZOH_CONTEXT_INTENT__).toBeUndefined();
  });

  it("exposes kernel trace globals when VITE_RHIZOH_KERNEL_TRACE_DEBUG=1 in prod", () => {
    import.meta.env.VITE_RHIZOH_KERNEL_TRACE_DEBUG = "1";
    import.meta.env.VITE_DEBUG = "1";
    expect(isRhizohKernelTraceExposedV0()).toBe(true);
    publishRhizohKernelTraceGlobalV0("__RHIZOH_CONTEXT_INTENT__", { intentId: "x" });
    expect(window.__RHIZOH_CONTEXT_INTENT__?.intentId).toBe("x");
  });

  it("scrubRhizohKernelTraceGlobalsV0 removes all kernel trace keys", () => {
    import.meta.env.VITE_RHIZOH_KERNEL_TRACE_DEBUG = "1";
    import.meta.env.VITE_DEBUG = "1";
    publishRhizohKernelTraceGlobalV0("__RHIZOH_DOMAIN_GRAPH__", { ok: true });
    import.meta.env.VITE_RHIZOH_KERNEL_TRACE_DEBUG = "0";
    import.meta.env.VITE_DEBUG = "0";
    scrubRhizohKernelTraceGlobalsV0();
    expect(window.__RHIZOH_DOMAIN_GRAPH__).toBeUndefined();
  });

  it("does not dispatch kernel trace events when invisible", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    dispatchRhizohKernelTraceEventV0("rhizoh:test", { ok: true });
    expect(spy).not.toHaveBeenCalled();
  });
});
