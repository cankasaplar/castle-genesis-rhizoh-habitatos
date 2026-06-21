/**
 * Narrative plane v0 — derived UI projection only (plane C).
 * Never writes causal or observation SSOT.
 */

import { evaluateEpistemicReturnFieldV0 } from "./epistemicReturnFieldV0.js";
import { projectObserverLensV0 } from "./observerEpistemicLensV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";
import { OBSERVER_PLANE_V0 } from "./observerReadOnlyHookV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "./narrativeProjectionEngineV0.js";

export { resolveNarrativeFromObserverTraceV0 };

export const NARRATIVE_PLANE_SCHEMA_V0 = "castle.rhizoh.narrative_plane.v0";

/**
 * @param {{ locale?: string, causalMap?: object }} [opts]
 */
export function buildNarrativePlaneV0(opts = {}) {
  const tr = opts.locale === "tr";
  const echo = getVisitorEpistemicTraceV0();
  const returnField = evaluateEpistemicReturnFieldV0(echo);
  const projection = resolveNarrativeFromObserverTraceV0({ locale: opts.locale });
  const lens = projectObserverLensV0(opts.causalMap);
  const depth = echo?.coherence_alignment ?? 0;
  const stable = (lens.causalSummary?.nodeCount ?? 0) > 0;
  const familiar = returnField.recognition !== "none";
  const primary = projection.primaryFocus;

  const youAreHere = familiar
    ? tr
      ? "Tekrarlayan bir epistemik örüntüsün — davranış şekli tanınıyor, kimlik değil."
      : "You are a recurring epistemic pattern — behavior shape recognized, not identity."
    : tr
      ? "Anonim gözlemcisin — sistem etkileşimi görür, süreklilik henüz istatistiksel değil."
      : "You are an anonymous observer — system sees interaction, continuity not yet statistical.";

  return Object.freeze({
    schema: NARRATIVE_PLANE_SCHEMA_V0,
    plane: OBSERVER_PLANE_V0.NARRATIVE,
    youAreHere,
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
    entityNarrative: primary
      ? Object.freeze({
          entityId: primary.entityId,
          title: primary.title,
          description: primary.description,
          salience: primary.salience,
          grounded: primary.grounded,
          registryHit: primary.registryHit
        })
      : null,
    groundedNarratives: projection.groundedNarratives,
    semanticCoupling: false,
    epistemicResonance: false,
    bidirectionalInfluence: false,
    returnVector: echo?.return_vector ?? "none",
    epistemicFamiliarity: returnField.familiarity,
    recognition: returnField.recognition,
    continuity: returnField.continuity,
    memory: false,
    observerPosture: familiar ? "recurring_epistemic_pattern" : "anonymous_observer",
    derivedOnly: true,
    interpretationOnly: true,
    influencesExecution: false
  });
}

export function mountNarrativePlaneConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.narrativePlane = Object.freeze({
    build: buildNarrativePlaneV0,
    resolve: resolveNarrativeFromObserverTraceV0
  });
}
