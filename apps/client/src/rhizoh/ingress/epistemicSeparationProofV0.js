/**
 * Epistemic separation proof v0 — paper evidence bundle.
 * Documents observation ≠ execution ≠ causal write (read-only assembly).
 * @see docs/RHIZOH_EPISTEMIC_SEPARATION_PROOF_V0.md
 */

import { getObserverTraceSnapshotV0, OBSERVER_TRACE_EXCLUDED_SINKS_V0 } from "./observerReadOnlyHookV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";
import { evaluateEpistemicReturnFieldV0 } from "./epistemicReturnFieldV0.js";
import { projectObserverLensV0 } from "./observerEpistemicLensV0.js";
import { resolveNarrativeFromObserverTraceV0 } from "./narrativeProjectionEngineV0.js";
import { buildNarrativePlaneV0 } from "./narrativePlaneProjectionV0.js";

export const EPISTEMIC_SEPARATION_PROOF_SCHEMA_V0 = "castle.rhizoh.epistemic_separation_proof.v0";

export const PAPER_SPINE_CLAIMS_V0 = Object.freeze([
  "Narrative generation is decoupled from causal truth",
  "Observer does not induce system state change, only projection bias",
  "Rhizoh is a non-agentic epistemic system in which observer traces generate only read-only narrative projections without causal or learning feedback into the system graph"
]);

/**
 * @param {{ locale?: string }} [opts]
 */
export function buildEpistemicSeparationProofV0(opts = {}) {
  const locale = opts.locale ?? "en";
  const observerTrace = getObserverTraceSnapshotV0();
  const visitor = getVisitorEpistemicTraceV0();
  const returnField = evaluateEpistemicReturnFieldV0(visitor);
  const lens = projectObserverLensV0();
  const narrativeResolve = resolveNarrativeFromObserverTraceV0({ locale });
  const narrativeBuild = buildNarrativePlaneV0({ locale });

  const traceEntry = observerTrace?.entries?.[observerTrace.entries.length - 1];

  return Object.freeze({
    schema: EPISTEMIC_SEPARATION_PROOF_SCHEMA_V0,
    exportedAtMs: Date.now(),
    paperSpine: PAPER_SPINE_CLAIMS_V0,
    planes: Object.freeze({
      causal: Object.freeze({ mutableByObserver: false, observerWrite: false }),
      observation: Object.freeze({
        observerTraceCount: observerTrace?.count ?? 0,
        visitorSessions: visitor?.sessions ?? 0,
        excludedFrom: OBSERVER_TRACE_EXCLUDED_SINKS_V0
      }),
      narrative: Object.freeze({
        entityCount: narrativeResolve?.entityCount ?? 0,
        semanticCoupling: narrativeBuild?.semanticCoupling === false,
        epistemicResonance: narrativeBuild?.epistemicResonance === false,
        bidirectionalInfluence: narrativeBuild?.bidirectionalInfluence === false
      })
    }),
    evidence: Object.freeze({
      lastObserverEntry: traceEntry
        ? Object.freeze({
            influencesCausalGraph: traceEntry.influencesCausalGraph === false,
            influencesIdentity: traceEntry.influencesIdentity === false,
            isAgenticInput: traceEntry.isAgenticInput === false
          })
        : null,
      returnField: Object.freeze({
        memory: returnField.memory === false,
        influencesCausalGraph: returnField.influencesCausalGraph === false,
        influencesIdentity: returnField.influencesIdentity === false
      }),
      lens: Object.freeze({
        isVertex: lens.isVertex === false,
        isAgent: lens.isAgent === false,
        influencesCausalGraph: lens.influencesCausalGraph === false
      }),
      visitor: Object.freeze({
        isMemory: visitor?.isMemory === false,
        isIdentity: visitor?.isIdentity === false,
        influencesExecution: visitor?.influencesExecution === false
      })
    }),
    separationHolds:
      narrativeBuild?.semanticCoupling === false &&
      narrativeBuild?.epistemicResonance === false &&
      returnField.memory === false &&
      lens.isVertex === false,
    interpretationOnly: true,
    readOnly: true
  });
}

export function mountEpistemicSeparationProofConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.epistemicSeparationProof = Object.freeze({
    build: buildEpistemicSeparationProofV0,
    exportJson: () => JSON.stringify(buildEpistemicSeparationProofV0(), null, 2)
  });
}
