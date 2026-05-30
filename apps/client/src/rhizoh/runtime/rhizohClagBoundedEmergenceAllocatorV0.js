/**
 * Bounded Emergence Allocator (BEA) v0 — RESEARCH-ONLY.
 * Formalizes "how much emergence is allowed" via resonance budget on active manifold only.
 * Does NOT write execution / LLM / sovereign selection (observational allocator).
 */

import { CLAG_NODE_KIND_V0 } from "./rhizohClagTypesV0.js";
import { CLAG_NODE_REGISTRY_ROLE_V0 } from "./rhizohClagNodeRegistryV0.js";

export const RHIZOH_BEA_SCHEMA_V0 = "castle.rhizoh.bounded_emergence_allocator.v0";

const DEFAULT_RESONANCE_BUDGET_V0 = 0.15;
const SOVEREIGN_CROSS_RESONANCE_CAP_V0 = 0.08;
const META_RESONANCE_CAP_V0 = 0.04;
const TRAVERSAL_RESONANCE_CAP_V0 = 0.05;

/**
 * @returns {number}
 */
export function getBeaResonanceBudgetDefaultV0() {
  try {
    const v = Number(import.meta.env?.VITE_RHIZOH_BEA_RESONANCE_BUDGET);
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v;
  } catch {
    /* noop */
  }
  return DEFAULT_RESONANCE_BUDGET_V0;
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {{
 *   nodes?: object[],
 *   edges?: object[],
 *   traversalPlan?: { primaryRoute?: { chainId?: string }, traversalSteps?: object[] } | null,
 *   graphContamination?: { detected?: boolean } | null,
 *   activeSovereignNodeCount?: number
 * }} input
 */
export function allocateBoundedEmergenceV0(input = {}) {
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const edges = Array.isArray(input.edges) ? input.edges : [];
  const contamination = input.graphContamination;
  const budgetScale = contamination?.detected === true ? 0.5 : 1;
  const resonanceBudget01 = clamp01(getBeaResonanceBudgetDefaultV0() * budgetScale);

  const sovereignNodes = nodes.filter(
    (n) =>
      n.kind === CLAG_NODE_KIND_V0.REAL_LIFE &&
      n.meta?.registryRole === CLAG_NODE_REGISTRY_ROLE_V0.ACTIVE_RUNTIME
  );

  /** @type {object[]} */
  const controlledResonance = [];

  if (sovereignNodes.length >= 2) {
    const a = sovereignNodes[0];
    const b = sovereignNodes[1];
    const w = Math.min(SOVEREIGN_CROSS_RESONANCE_CAP_V0, resonanceBudget01 * 0.55);
    controlledResonance.push(
      Object.freeze({
        kind: "controlled_resonance",
        label: "sovereign_cross_resonance",
        fromRegistryId: a.meta?.registryId,
        toRegistryId: b.meta?.registryId,
        weight: Math.round(w * 1000) / 1000,
        bidirectional: true,
        note: "Ankara ↔ Beşiktaş bounded coupling (active manifold only)"
      })
    );
  }

  const primarySovereign =
    sovereignNodes.find((n) => n.meta?.isPrimary === true) || sovereignNodes[0];
  const narrEdge = edges.find((e) => e.label === "conversation_episodic_thread");
  if (primarySovereign && narrEdge) {
    const w = Math.min(META_RESONANCE_CAP_V0, resonanceBudget01 * 0.28);
    controlledResonance.push(
      Object.freeze({
        kind: "controlled_resonance",
        label: "meta_narrative_sovereign_resonance",
        fromLayer: CLAG_NODE_KIND_V0.NARRATIVE,
        toRegistryId: primarySovereign.meta?.registryId,
        weight: Math.round(w * 1000) / 1000,
        sourceEdge: narrEdge.label
      })
    );
  }

  const primaryChain = input.traversalPlan?.primaryRoute?.chainId;
  if (primaryChain && primarySovereign) {
    const w = Math.min(TRAVERSAL_RESONANCE_CAP_V0, resonanceBudget01 * 0.2);
    controlledResonance.push(
      Object.freeze({
        kind: "controlled_resonance",
        label: "traversal_primary_echo",
        chainId: primaryChain,
        toRegistryId: primarySovereign.meta?.registryId,
        weight: Math.round(w * 1000) / 1000
      })
    );
  }

  const spent01 = controlledResonance.reduce((s, e) => s + Number(e.weight || 0), 0);
  const emergenceBudgetRemaining = clamp01(resonanceBudget01 - spent01);

  return Object.freeze({
    schema: RHIZOH_BEA_SCHEMA_V0,
    principle: "bounded_signal_mixing_not_uncontrolled_contamination",
    executionApplied: false,
    regime: contamination?.detected === true ? "contaminated_capped" : "nominal",
    resonanceBudget01,
    budgetScaledForContamination: budgetScale < 1,
    spent01: Math.round(spent01 * 1000) / 1000,
    emergenceBudgetRemaining: Math.round(emergenceBudgetRemaining * 1000) / 1000,
    activeSovereignNodeCount: input.activeSovereignNodeCount ?? sovereignNodes.length,
    controlledResonance: Object.freeze(controlledResonance),
    allowlist: Object.freeze({
      sovereignOnly: true,
      simulationPromoted: false,
      maxResonanceEdges: 4
    })
  });
}
