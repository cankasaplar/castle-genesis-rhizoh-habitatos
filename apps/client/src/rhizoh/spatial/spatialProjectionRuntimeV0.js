/**
 * PR-4-B — Spatial projection runtime (environmental field, not character engine).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Not:** character animation, humanoid embodiment, conversational avatar scene graph.
 * **Is:** anchor-conditioned projection cues (haze, wall wash, desk-adjacent focus bias) — numeric only.
 *
 * Orchestrates **spatial** state expression only; no identity reasoning (see `spatialProjectionBarrierV0.js`).
 *
 * PR-4-C: hardware coupling passes through `spatialHardwareEffectContractV0.js`, rate limiter,
 * provenance envelope, and `spatialSensorAirGapV0.js` before device adapters.
 */

import { getRoomAnchorByIdV0 } from "./spatialAnchorRegistryV0.js";

const SCHEMA = "spatialProjectionRuntime.v0";

/** @typedef {{ projectionHaze01: number, wallWash01: number, deskFocusGlow01: number, exposureLift01: number }} SpatialProjectionCueV0 */

function clamp01(x) {
  const n = typeof x === "number" && Number.isFinite(x) ? x : 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Deterministic cue bundle from room anchors + optional atmosphere / hypothesis **weights only**.
 *
 * @param {{
 *   primaryAnchorId?: string | null,
 *   atmosphereExposure01?: number,
 *   hypothesisConfidence01?: number
 * }} io
 * @returns {Readonly<SpatialProjectionCueV0 & { schema: string }>}
 */
export function deriveAnchorConditionedProjectionCueV0(io = {}) {
  const primary = io.primaryAnchorId != null ? getRoomAnchorByIdV0(String(io.primaryAnchorId)) : null;
  const exp = clamp01(io.atmosphereExposure01 ?? 0.55);
  const hyp = clamp01(io.hypothesisConfidence01 ?? 0);

  let wallWash01 = 0.22 + exp * 0.18;
  let deskFocusGlow01 = 0.12;
  let projectionHaze01 = 0.08 + exp * 0.12;
  let exposureLift01 = exp * 0.25;

  if (primary?.id === "north-wall") {
    wallWash01 = clamp01(wallWash01 + 0.22);
    projectionHaze01 = clamp01(projectionHaze01 + 0.06);
  }
  if (primary?.id === "window-anchor") {
    exposureLift01 = clamp01(exposureLift01 + 0.12);
    projectionHaze01 = clamp01(projectionHaze01 - 0.02);
  }
  if (primary?.id === "desk-anchor") {
    deskFocusGlow01 = clamp01(0.18 + hyp * 0.55 + exp * 0.12);
    wallWash01 = clamp01(wallWash01 - 0.04);
  }

  const out = Object.freeze({
    schema: SCHEMA,
    projectionHaze01: clamp01(projectionHaze01),
    wallWash01: clamp01(wallWash01),
    deskFocusGlow01: clamp01(deskFocusGlow01),
    exposureLift01: clamp01(exposureLift01)
  });

  return out;
}
