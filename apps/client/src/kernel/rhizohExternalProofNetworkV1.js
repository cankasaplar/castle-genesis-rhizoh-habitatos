/**
 * RHIZOH External Proof Network v1
 * — çoklu çözücü orkestrasyonu, kanıt yönlendirme grafiği, güven ağırlıklı sertifikasyon yüzeyi,
 *   dağıtık SMT delegasyon modeli (tek IR parçası v1; parçalama sözleşmesi iskelet).
 *
 * Dürüstlük: ağ politikası ve operasyonel konsensüs; otomatik SMT doğruluğu / tam seslik yok.
 */

export const RHIZOH_EXTERNAL_PROOF_NETWORK_VERSION = "v1";

/** @typedef {"primary"|"witness"|"edge"|"aggregator"} RhizohProofSolverRoleV1 */

/**
 * @typedef {object} RhizohProofSolverNodeV1
 * @property {string} nodeId
 * @property {RhizohProofSolverRoleV1} role
 * @property {number} trustWeight — 0..1 politika ağırlığı (seslik değil)
 * @property {string} backendKind
 * @property {"in_process"|"remote_delegate"} [endpointKind]
 * @property {boolean} [enabled]
 * @property {(ir: object) => Promise<{ status: "sat"|"unsat"|"unknown", model?: object, diagnostics?: string }>} checkSat
 */

/** @type {Map<string, RhizohProofSolverNodeV1>} */
const _solverNodes = new Map();

export function assertValidProofSolverNodeV1(node) {
  if (!node || typeof node !== "object") throw new Error("rhizohProofNetwork: invalid node");
  if (!node.nodeId || typeof node.nodeId !== "string") throw new Error("rhizohProofNetwork: nodeId required");
  const roles = /** @type {const} */ (["primary", "witness", "edge", "aggregator"]);
  if (!roles.includes(/** @type {any} */ (node.role))) throw new Error("rhizohProofNetwork: role invalid");
  if (typeof node.checkSat !== "function") throw new Error("rhizohProofNetwork: checkSat required");
  const w = Number(node.trustWeight);
  if (!(w >= 0 && w <= 1)) throw new Error("rhizohProofNetwork: trustWeight must be 0..1");
  if (!node.backendKind || typeof node.backendKind !== "string") throw new Error("rhizohProofNetwork: backendKind required");
}

/**
 * @param {RhizohProofSolverNodeV1} node
 */
export function registerRhizohProofSolverNode(node) {
  assertValidProofSolverNodeV1(node);
  _solverNodes.set(node.nodeId, node);
}

export function unregisterRhizohProofSolverNode(nodeId) {
  _solverNodes.delete(String(nodeId));
}

export function clearRhizohProofSolverNodes() {
  _solverNodes.clear();
}

export function listRhizohProofSolverNodes() {
  return Object.freeze([..._solverNodes.values()].map((n) => n.nodeId));
}

export function getRhizohProofSolverNode(nodeId) {
  return _solverNodes.get(String(nodeId)) ?? null;
}

/** Varsayılan kanıt akışı — yerel tanık → paralel SMT → güven birleşimi → isteğe bağlı dış cert kancası. */
export function buildDefaultProofRoutingGraphV1() {
  return Object.freeze({
    graphId: "rhizoh_proof_routing_default_v1",
    version: RHIZOH_EXTERNAL_PROOF_NETWORK_VERSION,
    honesty:
      "graph_describes_routing_intent_not_semantic_soundness_remote_nodes_require_explicit_trust",
    nodes: Object.freeze([
      { id: "LOCAL_CANONICAL", kind: "local_witness", stage: 0 },
      { id: "DELEGATE_SMT_PRIMARY", kind: "smt_check", stage: 1 },
      { id: "DELEGATE_SMT_WITNESS", kind: "smt_witness", stage: 1 },
      { id: "MERGE_TRUST", kind: "trust_weighted_merge", stage: 2 },
      { id: "EXTERNAL_CERT", kind: "truth_cert_hook", stage: 3 }
    ]),
    edges: Object.freeze([
      { from: "LOCAL_CANONICAL", to: "DELEGATE_SMT_PRIMARY", edgeKind: "sequential", label: "ir_from_epistemic" },
      { from: "LOCAL_CANONICAL", to: "DELEGATE_SMT_WITNESS", edgeKind: "parallel_fanout" },
      { from: "DELEGATE_SMT_PRIMARY", to: "MERGE_TRUST", edgeKind: "sequential" },
      { from: "DELEGATE_SMT_WITNESS", to: "MERGE_TRUST", edgeKind: "sequential" },
      { from: "MERGE_TRUST", to: "EXTERNAL_CERT", edgeKind: "sequential", label: "optional_external_truth_cert" }
    ])
  });
}

export function buildDefaultDelegationPolicyV1() {
  return Object.freeze({
    version: "v1",
    timeoutMsPerNode: 30000,
    maxParallelSolvers: 4,
    fallbackChain: Object.freeze([]),
    shardStrategy: "single_ir_v1_no_sharding",
    honesty: "delegation_schedules_work_units_soundness_requires_remote_trust_assumptions"
  });
}

/**
 * Dağıtık delegasyon planı — v1 tek parça IR; çoklu düğüme aynı gövde atanır.
 * @param {{ smtIrDigest?: string | null, nodeIds?: string[] }} spec
 */
export function buildDelegationPlanV1(spec = {}) {
  const ids = spec.nodeIds?.length ? spec.nodeIds : [..._solverNodes.keys()];
  return Object.freeze({
    planId: `rhizoh_del_v1_${String(spec.smtIrDigest ?? "nodigest").slice(0, 32)}_${Date.now()}`,
    model: "distributed_smt_delegation_v1_single_shard",
    assignments: Object.freeze(
      ids.map((nodeId, i) =>
        Object.freeze({
          nodeId,
          shardId: "full",
          priority: i
        })
      )
    )
  });
}

/**
 * @param {Array<{ ok?: boolean, status?: string, trustWeight?: number, nodeId?: string }>} results
 */
export function mergeTrustWeightedSolverResultsV1(results) {
  const okR = results.filter((r) => r && r.ok && r.status);
  if (!okR.length) {
    return Object.freeze({
      consensus: "none",
      certificationScore: 0,
      trustMass: 0,
      detail: "all_solver_invocations_failed_or_empty",
      note: "trust_weighted_merge_is_operational_not_cryptographic"
    });
  }
  const statuses = okR.map((r) => String(r.status));
  const uniq = [...new Set(statuses)];
  const trustMass = okR.reduce((s, r) => s + (Number(r.trustWeight) || 0), 0);

  const votes = Object.create(null);
  for (const r of okR) {
    const st = String(r.status);
    votes[st] = (votes[st] || 0) + (Number(r.trustWeight) || 0);
  }
  let winner = "unknown";
  let best = -1;
  for (const st of Object.keys(votes)) {
    if (votes[st] > best) {
      best = votes[st];
      winner = st;
    }
  }

  const conflict = uniq.length > 1;
  const certificationScore = conflict
    ? Math.min(0.55, trustMass / 2)
    : Math.min(1, trustMass / Math.max(0.25, okR.length));

  return Object.freeze({
    consensus: conflict ? "conflict" : uniq[0],
    weightedPreference: conflict ? winner : uniq[0],
    conflict,
    disagreeingStatuses: conflict ? uniq : Object.freeze([]),
    certificationScore,
    trustMass,
    voteByStatus: Object.freeze({ ...votes }),
    note: "trust_weighted_merge_is_operational_not_cryptographic"
  });
}

/**
 * Çoklu düğümde aynı IR ile paralel çağrı; zaman aşımı ve basit konsensüs.
 * @param {object} smtIr
 * @param {{
 *   routingGraph?: ReturnType<typeof buildDefaultProofRoutingGraphV1>,
 *   delegationPolicy?: ReturnType<typeof buildDefaultDelegationPolicyV1>,
 *   roles?: RhizohProofSolverRoleV1[] | null
 * }} [opts]
 */
export async function orchestrateRhizohMultiSolverCheckV1(smtIr, opts = {}) {
  const policy = opts.delegationPolicy ?? buildDefaultDelegationPolicyV1();
  const routing = opts.routingGraph ?? buildDefaultProofRoutingGraphV1();
  const roleFilter = opts.roles ?? null;

  const all = [..._solverNodes.values()].filter((n) => n.enabled !== false);
  let targets = all;
  if (roleFilter?.length) {
    targets = all.filter((n) => roleFilter.includes(/** @type {any} */ (n.role)));
  }
  if (!targets.length) {
    targets = all;
  }

  if (!targets.length) {
    return Object.freeze({
      ok: false,
      reason: "no_proof_solver_nodes_registered",
      orchestrationVersion: RHIZOH_EXTERNAL_PROOF_NETWORK_VERSION,
      routingGraphId: routing.graphId
    });
  }

  const capped = targets.slice(0, Math.max(1, policy.maxParallelSolvers ?? 4));

  const timeoutMs = policy.timeoutMsPerNode ?? 30000;

  const results = await Promise.all(
    capped.map(async (n) => {
      const t0 = Date.now();
      try {
        const out = await Promise.race([
          n.checkSat(smtIr),
          new Promise((_, rej) => {
            setTimeout(() => rej(new Error("rhizoh_delegation_timeout")), timeoutMs);
          })
        ]);
        const status = out?.status ?? "unknown";
        return Object.freeze({
          nodeId: n.nodeId,
          role: n.role,
          ok: true,
          latencyMs: Date.now() - t0,
          status,
          backendKind: n.backendKind,
          trustWeight: n.trustWeight,
          diagnostics: out?.diagnostics ?? null
        });
      } catch (e) {
        return Object.freeze({
          nodeId: n.nodeId,
          role: n.role,
          ok: false,
          latencyMs: Date.now() - t0,
          trustWeight: n.trustWeight,
          error: String(e?.message ?? e)
        });
      }
    })
  );

  const trustWeightedMerge = mergeTrustWeightedSolverResultsV1(results);

  return Object.freeze({
    ok: true,
    orchestrationVersion: RHIZOH_EXTERNAL_PROOF_NETWORK_VERSION,
    routingGraphId: routing.graphId,
    delegationPolicyRef: policy.version,
    results: Object.freeze(results),
    trustWeightedMerge,
    honesty: "multi_solver_orchestration_is_policy_consensus_not_formal_proof"
  });
}

/**
 * Dış / iç kanıt sonuçlarına güven ağırlıklı sertifika skoru (0..1).
 * @param {Array<{ kind: string, trustWeight: number, passed?: boolean, status?: string }>} attestations
 */
export function computeTrustWeightedCertificationV1(attestations) {
  if (!attestations?.length) {
    return Object.freeze({
      score: 0,
      verdict: "no_attestations",
      honesty: "certification_score_is_trust_policy_not_soundness"
    });
  }
  let mass = 0;
  let positive = 0;
  for (const a of attestations) {
    const w = Math.max(0, Math.min(1, Number(a.trustWeight) || 0));
    mass += w;
    const ok =
      a.passed === true ||
      a.status === "sat" ||
      a.status === "GRANTED" ||
      a.status === "EQUIVALENCE_HOLDS";
    if (ok) positive += w;
  }
  const score = mass > 0 ? positive / mass : 0;
  let verdict = "weak";
  if (score >= 0.85) verdict = "strong_policy";
  else if (score >= 0.5) verdict = "mixed";
  return Object.freeze({
    score,
    verdict,
    trustMass: mass,
    positiveMass: positive,
    honesty: "certification_score_is_trust_policy_not_soundness"
  });
}

/**
 * Köprü / manifest yüzeyi.
 * @param {object} [bridgePayload]
 */
export function buildExternalProofNetworkPayload(bridgePayload = {}) {
  const nodes = listRhizohProofSolverNodes();
  return Object.freeze({
    networkVersion: RHIZOH_EXTERNAL_PROOF_NETWORK_VERSION,
    registeredSolverNodes: nodes,
    nodeCount: nodes.length,
    proofRoutingGraph: buildDefaultProofRoutingGraphV1(),
    delegationPolicy: buildDefaultDelegationPolicyV1(),
    orchestrationEntrypoint: "orchestrateRhizohMultiSolverCheckV1",
    trustCertificationEntrypoint: "computeTrustWeightedCertificationV1",
    criticalHonestyCrossRef: "fieldTruthV529.criticalSolverAndProofRealityV529",
    solverExternalizationCrossRef: "rhizohSolverExternalizationLayerV1",
    bridgePayloadRef: bridgePayload?.snapshotId ?? null
  });
}
