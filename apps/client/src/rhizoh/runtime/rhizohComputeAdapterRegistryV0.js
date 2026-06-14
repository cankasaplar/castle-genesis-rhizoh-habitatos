/**
 * Compute adapter registry — WebGPU/rendering ONLY.
 * Chrome "No available adapters" belongs HERE, never voice STT/TTS.
 */

import { requestWebGpuAdapterQuietlyV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_COMPUTE_ADAPTER_SCHEMA_V0 = "rhizoh.compute_adapter_registry.v0";

/** @type {object | null} */
let computeSnapshotV0 = null;

/**
 * Probe WebGPU adapter availability (soft signal).
 */
export async function probeComputeAdapterV0() {
  let webgpuApiPresent = false;
  let adapterAvailable = false;
  let note = "compute_layer_independent_from_voice";

  if (typeof navigator !== "undefined" && navigator.gpu) {
    webgpuApiPresent = true;
    try {
      const adapter = await requestWebGpuAdapterQuietlyV0();
      adapterAvailable = adapter !== null;
      if (!adapterAvailable) {
        note = "Chrome 'No available adapters' = WebGPU compute — not voice pipeline.";
      }
    } catch {
      adapterAvailable = false;
      note = "WebGPU requestAdapter failed — compute fallback only.";
    }
  }

  computeSnapshotV0 = Object.freeze({
    schema: RHIZOH_COMPUTE_ADAPTER_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    webgpuApiPresent,
    adapterAvailable,
    layer: "compute_rendering",
    voicePipelineImpact: false,
    voicePipelineAware: false,
    indirectCouplingRisk: adapterAvailable === false,
    couplingNote:
      "Compute load must not gate voice eligibility — governed separately in pulse loop.",
    note
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.computeAdapter = computeSnapshotV0;
  }
  return computeSnapshotV0;
}

export function getComputeAdapterSnapshotV0() {
  return (
    computeSnapshotV0 ||
    Object.freeze({
      schema: RHIZOH_COMPUTE_ADAPTER_SCHEMA_V0,
      evaluatedAtMs: null,
      webgpuApiPresent: null,
      adapterAvailable: null,
      layer: "compute_rendering",
      voicePipelineImpact: false,
      voicePipelineAware: false,
      indirectCouplingRisk: null,
      note: "not_probed"
    })
  );
}

/** @internal vitest */
export function __resetComputeAdapterForTestV0() {
  computeSnapshotV0 = null;
}
