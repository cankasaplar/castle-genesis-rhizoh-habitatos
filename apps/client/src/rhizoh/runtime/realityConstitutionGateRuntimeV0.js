/**
 * Constitution gate runtime — pre-seal constitutional veto (ROS v2 subset).
 *
 * Spec anchor: `realityOperatingSystemConstitutionLayerV2.js` (causal_constitution_enforcement).
 * Total function: accept path only when rules pass; else reject with auditable code.
 */

const SEALING_COMMIT_CLASSES_V0 = new Set([
  "sealing_world_geometry",
  "sealing_topology_mandate"
]);

export const REALITY_CONSTITUTION_GATE_RUNTIME_SCHEMA_V0 =
  "castle.rhizoh.reality_constitution_gate_runtime.v0";

export const CONSTITUTION_POLICY_REVISION_V0 = "castle.constitution.runtime.v0";

/** Machine-checkable rules (runtime subset). */
export const CONSTITUTION_RULES_V0 = Object.freeze([
  {
    id: "R1_coherence_no_world_seal",
    check: "coherence cannot enqueue sealing-class commits"
  },
  {
    id: "R2_topology_requires_room_scope",
    check: "sealing_topology_mandate requires roomScope"
  },
  {
    id: "R3_sealing_requires_payload_witness",
    check: "sealing-class requires non-empty payloadHash"
  },
  {
    id: "R4_wal_sealing_requires_attestation",
    check: "wal sealing-class requires signed attestation flag on candidate"
  },
  {
    id: "R5_unknown_source_sealing_denied",
    check: "unknown source cannot advance sealing-class"
  }
]);

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} [_seal]
 * @returns {{ ok: true, policyRevision: string } | { ok: false, code: string, ruleId: string }}
 */
export function evaluateConstitutionBeforeSealV0(candidate, _seal) {
  const source = String(candidate?.source || "unknown");
  const commitClassId = String(candidate?.commitClassId || "");
  const isSealing = SEALING_COMMIT_CLASSES_V0.has(commitClassId);

  if (candidate?.constitutionOk === false) {
    return { ok: false, code: "CONSTITUTION_EXPLICIT_VETO", ruleId: "R0_explicit" };
  }

  if (isSealing && source === "coherence") {
    return { ok: false, code: "CONSTITUTION_COHERENCE_NO_WORLD_WRITE", ruleId: "R1_coherence_no_world_seal" };
  }

  if (commitClassId === "sealing_topology_mandate") {
    const room = String(candidate?.roomScope || "").trim();
    if (!room) {
      return { ok: false, code: "CONSTITUTION_TOPOLOGY_ROOM_REQUIRED", ruleId: "R2_topology_requires_room_scope" };
    }
  }

  if (isSealing) {
    const ph = String(candidate?.payloadHash || "").trim();
    if (!ph || ph === "h00000000") {
      return {
        ok: false,
        code: "CONSTITUTION_PAYLOAD_WITNESS_REQUIRED",
        ruleId: "R3_sealing_requires_payload_witness"
      };
    }
  }

  if (isSealing && source === "wal" && candidate?.leaseOk === false) {
    return { ok: false, code: "CONSTITUTION_WAL_ATTESTATION_REQUIRED", ruleId: "R4_wal_sealing_requires_attestation" };
  }

  if (isSealing && source === "unknown") {
    return { ok: false, code: "CONSTITUTION_UNKNOWN_SOURCE", ruleId: "R5_unknown_source_sealing_denied" };
  }

  return { ok: true, policyRevision: CONSTITUTION_POLICY_REVISION_V0 };
}

/**
 * Adapter for sealing core gate hook.
 *
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 */
export function checkConstitutionGateRuntimeV0(candidate) {
  const r = evaluateConstitutionBeforeSealV0(candidate);
  if (!r.ok) {
    return { ok: false, code: r.code, ruleId: r.ruleId };
  }
  return { ok: true };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildRealityConstitutionGateSnapshotV0() {
  return {
    schema: REALITY_CONSTITUTION_GATE_RUNTIME_SCHEMA_V0,
    policyRevision: CONSTITUTION_POLICY_REVISION_V0,
    rules: CONSTITUTION_RULES_V0,
    ts: Date.now()
  };
}
