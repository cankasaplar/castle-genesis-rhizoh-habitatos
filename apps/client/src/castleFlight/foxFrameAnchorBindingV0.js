/**
 * FOX frame anchor binding — co-bind anchor · camera · social to one projection tick.
 *
 * Called from conversation stage rAF (after cube-centric camera update).
 * READ ONLY outward — never mutates citizenship, camera authority, or gate state.
 *
 * @see projectionSyncContractV0.js
 */

import { normalizeAlignmentTickMsV0 } from "./perceptionAlignmentSnapshotV0.js";
import {
  bindProjectionSyncDebugV0,
  evaluateProjectionFrameCoherenceV0,
  projectionSyncDebugDetailV0
} from "./projectionSyncContractV0.js";
import { readLastSurfaceCitizenshipV0 } from "../rhizoh/runtime/rhizohSurfaceCitizenshipRuntimeV0.js";

export const FOX_FRAME_ANCHOR_BINDING_SCHEMA_V0 = "castle.fox_frame_anchor_binding.v0";

/** @type {string | null} */
let lastBoundTickMs = null;

/**
 * SCR master clock before co-bind (observability only).
 */
export function readSocialProjectionSourceMsV0() {
  const citizenship = readLastSurfaceCitizenshipV0();
  return normalizeAlignmentTickMsV0(Number(citizenship?.atMs) || Date.now());
}

/**
 * @returns {ReturnType<typeof publishFoxAnchorFrameBindingV0> | null}
 */
export function readFoxAnchorFrameBindingV0() {
  if (typeof window === "undefined") return null;
  return window.__rhizoh?.foxFrameBinding || null;
}

/**
 * Publish anchor + camera + social frames on the same normalized tick.
 * Camera shares anchor rAF; social is co-bound to tick (source ms kept for drift debug).
 * @param {{
 *   atMs?: number,
 *   speciesId?: string,
 *   mountId?: string,
 *   force?: boolean
 * }} input
 */
export function publishFoxAnchorFrameBindingV0(input = {}) {
  const tickMs = normalizeAlignmentTickMsV0(input.atMs ?? Date.now());
  if (!input.force && lastBoundTickMs === tickMs) {
    const existing = readFoxAnchorFrameBindingV0();
    if (existing?.frames?.tickMs === tickMs) return existing;
  }
  lastBoundTickMs = tickMs;

  const socialSourceMs = readSocialProjectionSourceMsV0();
  const speciesId = String(input.speciesId || "octo_v1").trim() || "octo_v1";
  const mountId = input.mountId != null ? String(input.mountId) : null;

  const frames = Object.freeze({
    schema: FOX_FRAME_ANCHOR_BINDING_SCHEMA_V0,
    readOnly: true,
    tickMs,
    anchorFrameMs: tickMs,
    cameraFrameMs: tickMs,
    socialFrameMs: tickMs,
    socialSourceMs,
    socialCoBound: true,
    speciesId,
    mountId
  });

  const coherence = evaluateProjectionFrameCoherenceV0({
    tickMs,
    anchorFrameMs: tickMs,
    cameraFrameMs: tickMs,
    socialFrameMs: tickMs,
    speciesId
  });

  const payload = Object.freeze({
    frames,
    coherence,
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.foxFrameBinding = payload;
    window.__rhizoh.projectionSyncLast = projectionSyncDebugDetailV0(coherence);
  }

  return payload;
}

/**
 * Dev getter — same tick binding snapshot.
 */
export function bindFoxFrameAnchorDebugV0() {
  bindProjectionSyncDebugV0(() => {
    const binding = readFoxAnchorFrameBindingV0();
    return (
      binding?.coherence ||
      evaluateProjectionFrameCoherenceV0({
        tickMs: normalizeAlignmentTickMsV0(Date.now())
      })
    );
  });
}

/** @internal vitest */
export function __resetFoxFrameAnchorBindingForTestV0() {
  lastBoundTickMs = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.foxFrameBinding;
    delete window.__rhizoh.projectionSyncLast;
  }
}
