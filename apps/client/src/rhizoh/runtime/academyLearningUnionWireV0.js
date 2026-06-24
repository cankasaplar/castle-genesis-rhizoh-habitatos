/**
 * Academy Learning Union wire v0 — batch wire go + checkers tubes + union snapshot.
 * RESEARCH-ONLY — observation framing; no execution authority.
 */

import { buildRhizohAcademyLearningUnionReportV0 } from "./rhizohAcademyLearningUnionReportV0.js";
import { wireGoLearningMediaTubeV0 } from "./goLearningMediaTubeWireV0.js";
import { wireCheckersLearningMediaTubeV0 } from "./checkersLearningMediaTubeWireV0.js";

export const ACADEMY_LEARNING_UNION_WIRE_SCHEMA_V0 = "castle.rhizoh.academy_learning_union_wire.v0";

/**
 * Wire academy learning observation surfaces (go + checkers media tubes).
 * Chess cluster arms independently on core boot.
 * @param {{ locale?: string, demoMove?: boolean, go?: boolean, checkers?: boolean }} [opts]
 */
export async function wireAcademyLearningUnionV0(opts = {}) {
  const locale = String(opts.locale || "tr");
  const demoMove = opts.demoMove !== false;
  /** @type {Record<string, object>} */
  const wires = {};

  if (opts.go !== false) {
    wires.go = await wireGoLearningMediaTubeV0({ locale, force: true, demoMove });
  }
  if (opts.checkers !== false) {
    wires.checkers = await wireCheckersLearningMediaTubeV0({ locale, force: true, demoMove });
  }

  const union = buildRhizohAcademyLearningUnionReportV0();

  return Object.freeze({
    schema: ACADEMY_LEARNING_UNION_WIRE_SCHEMA_V0,
    ok: true,
    wires: Object.freeze(wires),
    union,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function ensureAcademyLearningUnionDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.academyLearningUnion = () => buildRhizohAcademyLearningUnionReportV0();
  window.__rhizoh.wireAcademyLearningUnion = (opts) => wireAcademyLearningUnionV0(opts);
  return window.__rhizoh.academyLearningUnion;
}

/** @internal vitest */
export function resetAcademyLearningUnionWireForTestV0() {
  /* stateless — noop */
}
