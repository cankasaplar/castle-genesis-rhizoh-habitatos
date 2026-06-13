/**
 * Kernel trace membrane v0 — intent/domain/cluster globals invisible in production.
 * Sprint 40: OS stabil release layer; trace exposed only via VITE_RHIZOH_KERNEL_TRACE_DEBUG.
 * RESEARCH-ONLY.
 */

import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";

export const RHIZOH_KERNEL_TRACE_MEMBRANE_SCHEMA_V0 = "rhizoh.kernel_trace_membrane.v0";

export const RHIZOH_KERNEL_TRACE_GLOBAL_KEYS_V0 = Object.freeze([
  "__RHIZOH_INTENT_CLUSTER__",
  "__RHIZOH_CLUSTER_CIVILIZATION__",
  "__RHIZOH_CONTEXT_INTENT__",
  "__RHIZOH_DOMAIN_GRAPH__",
  "__RHIZOH_OS_STABIL_RELEASE__"
]);

/**
 * Kernel trace visible only when operator enables granular debug flag.
 */
export function isRhizohKernelTraceExposedV0() {
  return isCastleDebugGranularFlagEnabled("VITE_RHIZOH_KERNEL_TRACE_DEBUG");
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export function publishRhizohKernelTraceGlobalV0(key, value) {
  if (typeof window === "undefined") return;
  if (isRhizohKernelTraceExposedV0()) {
    window[key] = value;
  } else {
    try {
      delete window[key];
    } catch {
      window[key] = undefined;
    }
  }
}

/**
 * @param {string} eventName
 * @param {unknown} [detail]
 */
export function dispatchRhizohKernelTraceEventV0(eventName, detail) {
  if (typeof window === "undefined" || !isRhizohKernelTraceExposedV0()) return;
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch {
    /* noop */
  }
}

/** Remove kernel trace globals from window (production invisible mode). */
export function scrubRhizohKernelTraceGlobalsV0() {
  if (typeof window === "undefined" || isRhizohKernelTraceExposedV0()) return;
  for (const key of RHIZOH_KERNEL_TRACE_GLOBAL_KEYS_V0) {
    try {
      delete window[key];
    } catch {
      window[key] = undefined;
    }
  }
}
