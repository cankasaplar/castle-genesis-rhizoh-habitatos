/**
 * (B) Closure Enforcement Layer v1 — yürütme kapısı → kanıt kapısı (proof witness isteğe bağlı).
 */

import { evaluateRhizohPreApplyGate, RHIZOH_GUARANTEE_TIER } from "./rhizohRuntimeGuarantees.js";

export const RHIZOH_CLOSURE_ENFORCEMENT_LAYER_VERSION = "v1";

export const RHIZOH_ENFORCEMENT_GATE_KIND = Object.freeze({
  EXECUTION: "execution_gate_v0",
  PROOF: "proof_gate_v1"
});

export function getClosureEnforcementLayerSpec() {
  return Object.freeze({
    version: RHIZOH_CLOSURE_ENFORCEMENT_LAYER_VERSION,
    evolution: "execution_gate_becomes_proof_gate",
    note: "proof_witness_optional_until_PROOF_kind"
  });
}

/**
 * Önce yapısal pre-apply; PROOF kind ise meta.proofWitness zorunlu (iskelet).
 * @param {object | null | undefined} frameState
 * @param {{ tier?: string, gateKind?: string }} [opts]
 */
export function evaluateRhizohClosureProofGate(frameState, opts = {}) {
  const tier = opts.tier ?? RHIZOH_GUARANTEE_TIER.EXPERIMENTAL;
  const gateKind = opts.gateKind ?? RHIZOH_ENFORCEMENT_GATE_KIND.EXECUTION;
  const preApply = evaluateRhizohPreApplyGate(frameState, { tier });

  if (gateKind !== RHIZOH_ENFORCEMENT_GATE_KIND.PROOF) {
    return Object.freeze({
      permitExecute: preApply.execute,
      blockedReasons: [...(preApply.blockedReasons ?? [])],
      tier,
      gateKind,
      preApply,
      proofGate: null
    });
  }

  const proofBlocked = [];
  const pw = frameState?.meta?.proofWitness;
  if (!pw || typeof pw !== "object") proofBlocked.push("proof_witness_missing");
  else {
    if (pw.layerVersion !== "v1") proofBlocked.push("proof_witness_version_mismatch");
    if (pw.obligationsSatisfied !== true) proofBlocked.push("proof_obligations_not_satisfied");
  }

  const permitExecute = preApply.execute && proofBlocked.length === 0;
  const blockedReasons = [...(preApply.blockedReasons ?? []), ...proofBlocked];

  return Object.freeze({
    permitExecute,
    blockedReasons,
    tier,
    gateKind,
    preApply,
    proofGate: Object.freeze({
      kind: "proof_gate_v1",
      witness: pw ?? null,
      proofBlockedReasons: Object.freeze([...proofBlocked])
    })
  });
}

export function buildClosureEnforcementLayerSurface() {
  return Object.freeze({
    layerId: "B_CLOSURE_ENFORCEMENT",
    version: RHIZOH_CLOSURE_ENFORCEMENT_LAYER_VERSION,
    spec: getClosureEnforcementLayerSpec(),
    gateKinds: RHIZOH_ENFORCEMENT_GATE_KIND,
    entrypoint: "evaluateRhizohClosureProofGate"
  });
}
