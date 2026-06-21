/**
 * Narrative plane v0 — derived UI projection only (plane C).
 * Never writes causal or observation SSOT.
 */

import { projectObserverLensV0 } from "./observerEpistemicLensV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";
import { OBSERVER_PLANE_V0 } from "./observerReadOnlyHookV0.js";

export const NARRATIVE_PLANE_SCHEMA_V0 = "castle.rhizoh.narrative_plane.v0";

/**
 * @param {{ locale?: string, causalMap?: object }} [opts]
 */
export function buildNarrativePlaneV0(opts = {}) {
  const tr = opts.locale === "tr";
  const lens = projectObserverLensV0(opts.causalMap);
  const echo = getVisitorEpistemicTraceV0();
  const depth = echo?.coherence_alignment ?? 0;
  const stable = (lens.causalSummary?.nodeCount ?? 0) > 0;

  return Object.freeze({
    schema: NARRATIVE_PLANE_SCHEMA_V0,
    plane: OBSERVER_PLANE_V0.NARRATIVE,
    youAreHere: tr
      ? "Salt okunur epistemik alanı gözlemliyorsun — ajan değilsin."
      : "You are observing a read-only epistemic field — you are not an agent.",
    systemStability: stable
      ? tr
        ? "Sistem kararlı — nedensel graf aktif."
        : "System is stable — causal graph active."
      : tr
        ? "Sistem başlatılıyor — graf henüz seyrek."
        : "System is bootstrapping — sparse graph.",
    mapExplorationDepth: depth,
    mapExplorationLabel: tr
      ? `Harita keşif derinliği: ${depth.toFixed(2)}`
      : `Map exploration depth: ${depth.toFixed(2)}`,
    returnVector: echo?.return_vector ?? "none",
    derivedOnly: true,
    interpretationOnly: true,
    influencesExecution: false
  });
}

export function mountNarrativePlaneConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.narrativePlane = Object.freeze({
    build: buildNarrativePlaneV0
  });
}
