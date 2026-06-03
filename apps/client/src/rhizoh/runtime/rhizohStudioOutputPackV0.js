/**
 * Studio Output Pack v0 — RAR artifact → lived packaging → RSBL surfaces.
 * RAR = what happened · Studio = how it becomes lived output.
 * @see docs/RHIZOH_STUDIO_OUTPUT_FACTORY_V0.md
 */

import { readLastSurfaceSingularityV0 } from "./rhizohSurfaceSingularityLayerV0.js";
import { readLastSurfaceBindingsV0 } from "./rhizohSurfaceBindingLayerV0.js";
import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";

export const STUDIO_OUTPUT_PACK_SCHEMA_V0 = "castle.rhizoh.studio_output_pack.v0";

export const RHIZOH_STUDIO_OUTPUT_PACK_EVENT_V0 = "rhizoh:studio-output-pack-v0";

/** @type {ReturnType<typeof buildStudioOutputPackV0> | null} */
let lastPack = null;

/**
 * @param {ReturnType<import("./rhizohArtifactRegistryV0.js").registerRhizohArtifactV0>} artifact
 * @param {{ bindings?: ReturnType<typeof readLastSurfaceBindingsV0>, frame?: ReturnType<typeof readLastT0PresenceFrameV0> }} [ctx]
 */
export function buildStudioOutputPackV0(artifact, ctx = {}) {
  const bindings = ctx.bindings || readLastSurfaceBindingsV0();
  const frame = ctx.frame || readLastT0PresenceFrameV0();
  const ssl = readLastSurfaceSingularityV0();

  return Object.freeze({
    schema: STUDIO_OUTPUT_PACK_SCHEMA_V0,
    pack_id: `sop_${artifact?.artifact_id || "none"}_${Date.now()}`,
    atMs: Number(artifact?.atMs) || Date.now(),
    artifact_id: artifact?.artifact_id || null,
    artifact_kind: artifact?.kind || null,
    lineage: artifact?.lineage || null,
    lived_state: Object.freeze({
      version: 1,
      coherence_id: bindings?.coherence_id || frame?.coherenceId || null,
      experiential_now_id: bindings?.experiential_now_id || artifact?.lineage?.experiential_now_id || null,
      /** Persistence slot — disk/WAL not wired in v0 */
      persistence: "memory_only"
    }),
    surfaces: Object.freeze(artifact?.surfaces || []),
    projection_map: bindings?.surfaces || ssl?.surfaces || null,
    packaging_stage: Object.freeze(["mcib", "ccf", "ecc", "rar", "studio", "wal", "rsbl", "ssl", "scr"])
  });
}

/**
 * @param {ReturnType<typeof buildStudioOutputPackV0>} pack
 */
export function publishStudioOutputPackBuiltV0(pack) {
  if (!pack) return null;
  lastPack = pack;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.studioOutputPack = pack;
    window.__rhizoh.studioOutputPacks = Object.freeze([
      ...(window.__rhizoh.studioOutputPacks || []).slice(-15),
      pack
    ]);
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_STUDIO_OUTPUT_PACK_EVENT_V0, {
          detail: Object.freeze({ pack })
        })
      );
    } catch {
      /* noop */
    }
  }
  return pack;
}

/**
 * @param {ReturnType<import("./rhizohArtifactRegistryV0.js").registerRhizohArtifactV0>} artifact
 */
export function publishStudioOutputPackV0(artifact) {
  if (!artifact) return null;
  return publishStudioOutputPackBuiltV0(buildStudioOutputPackV0(artifact));
}

export function readLastStudioOutputPackV0() {
  return lastPack;
}

export function resetRhizohStudioOutputPackForTestV0() {
  lastPack = null;
}
