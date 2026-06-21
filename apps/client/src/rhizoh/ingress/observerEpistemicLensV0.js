/**
 * Observer epistemic lens v0 — projection function over causal graph.
 * Observer ≠ vertex. Observer = read-only filter / lens.
 * @see docs/RHIZOH_OBSERVER_NODE_SPEC.md
 */

import { evaluateEpistemicReturnFieldV0 } from "./epistemicReturnFieldV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";
import { getObserverTraceSnapshotV0 } from "./observerReadOnlyHookV0.js";
import { buildVisitorEpistemicFingerprintV0 } from "./visitorEpistemicFingerprintV0.js";

export const OBSERVER_EPISTEMIC_LENS_SCHEMA_V0 = "castle.rhizoh.observer_epistemic_lens.v0";

/**
 * @param {object} [causalMap]
 * @param {{ perceptionMode?: string }} [opts]
 */
export function projectObserverLensV0(causalMap, opts = {}) {
  const map = causalMap ?? (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const nodes = map?.nodes || [];
  const edges = map?.edges || map?.causalMapRaw?.edges || [];
  const echo = getVisitorEpistemicTraceV0();
  const trace = getObserverTraceSnapshotV0();
  const fingerprint = buildVisitorEpistemicFingerprintV0({ visitor: echo, observerTrace: trace });
  const returnField = evaluateEpistemicReturnFieldV0(echo);

  const perceptionMode = opts.perceptionMode || echo?.perceptionMode || "explorer";

  const lensWeights = Object.freeze({
    explorer: Object.freeze({ map: 1, chess: 0.8, castle: 0.5, timeline: 0.3 }),
    research: Object.freeze({ map: 0.7, chess: 0.6, castle: 0.5, timeline: 1 }),
    signal: Object.freeze({ map: 0.5, chess: 0.4, castle: 0.3, timeline: 0.6 })
  });
  const weights = lensWeights[perceptionMode] || lensWeights.explorer;

  return Object.freeze({
    schema: OBSERVER_EPISTEMIC_LENS_SCHEMA_V0,
    kind: "epistemic_lens_projection",
    isVertex: false,
    isAgent: false,
    perceptionMode,
    weights,
    causalSummary: Object.freeze({
      nodeCount: map?.nodeCount ?? nodes.length,
      edgeCount: map?.edgeCount ?? edges.length,
      compressed: map?.compressed === true
    }),
    observerEcho: Object.freeze({
      visited_surfaces: echo?.visited_surfaces ?? [],
      coherence_alignment: echo?.coherence_alignment ?? 0,
      return_vector: echo?.return_vector ?? "none",
      engagement_vector: echo?.engagement_vector ?? 0,
      return_probability: echo?.return_probability ?? 0
    }),
    epistemicFingerprint: fingerprint,
    returnField: Object.freeze({
      familiarity: returnField.familiarity,
      recognition: returnField.recognition,
      memory: false,
      continuity: returnField.continuity
    }),
    traceEntryCount: trace?.count ?? 0,
    interpretationOnly: true,
    readOnly: true,
    influencesCausalGraph: false
  });
}

export function mountObserverEpistemicLensConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.observerLens = Object.freeze({
    project: projectObserverLensV0
  });
}
