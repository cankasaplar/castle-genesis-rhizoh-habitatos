/**
 * RHIZOH Deception Detection v1 — epistemic immune layer: provenance, counter-evidence,
 * contradiction graph, uncertainty propagation, witness topology.
 * TruthConfidence ≈ Provenance − ContradictionPenalty + WitnessSupport (scaled); heuristic audit primitive.
 */

/**
 * @typedef {{
 *   sourceId: string,
 *   relation: 'direct' | 'derived' | 'reported' | 'synthetic',
 *   at?: number,
 *   trustHint?: number
 * }} RhizohProvenanceHop
 */

/**
 * @typedef {{
 *   id: string,
 *   strength: number,
 *   sourceId?: string,
 *   at?: number,
 *   note?: string
 * }} RhizohCounterEvidence
 */

/**
 * @typedef {{
 *   claimA: string,
 *   claimB: string,
 *   weight: number,
 *   kind?: 'logical' | 'factual' | 'normative'
 * }} RhizohContradictionEdge
 */

/**
 * @typedef {{
 *   claimId: string,
 *   witnessId: string,
 *   stance: 'support' | 'refute' | 'observe',
 *   weight?: number,
 *   at?: number
 * }} RhizohWitnessEdge
 */

/**
 * @typedef {Record<string, ReadonlyArray<RhizohCounterEvidence>>} RhizohCounterEvidenceRegistry
 */

/**
 * @typedef {{
 *   edges: ReadonlyArray<RhizohContradictionEdge>,
 *   byClaim?: Record<string, string[]>
 * }} RhizohContradictionGraph
 */

export const RHIZOH_DECEPTION_DETECTION_VERSION = "1.0.0";

export const RHIZOH_DECEPTION_DEFAULTS_V1 = Object.freeze({
  derivedTrustDiscount: 0.88,
  reportedTrustDiscount: 0.72,
  syntheticTrustDiscount: 0.35,
  contradictionDamping: 0.82,
  uncertaintyAlpha: 0.62,
  witnessSupportScale: 0.42,
  propagationIterations: 6
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function relationDiscount(relation) {
  const d = RHIZOH_DECEPTION_DEFAULTS_V1;
  switch (relation) {
    case "direct":
      return 1;
    case "derived":
      return d.derivedTrustDiscount;
    case "reported":
      return d.reportedTrustDiscount;
    case "synthetic":
      return d.syntheticTrustDiscount;
    default:
      return d.reportedTrustDiscount;
  }
}

/**
 * Provenance strength ∈ [0,1] along a hop chain (weakest link × relation discounts).
 * @param {ReadonlyArray<RhizohProvenanceHop>} hops oldest-first or newest-first; uses min trust per hop
 * @param {Record<string, number>} trustBySourceId source → [0,1]
 */
export function computeRhizohProvenanceStrength(hops, trustBySourceId) {
  const tMap = trustBySourceId && typeof trustBySourceId === "object" ? trustBySourceId : {};
  if (!hops || !hops.length) return 0;
  let prod = 1;
  for (const h of hops) {
    const tid = String(h.sourceId || "").trim() || "unknown";
    const base = clamp01(h.trustHint != null ? h.trustHint : tMap[tid] ?? 0.45);
    prod = Math.min(prod, base * relationDiscount(h.relation));
  }
  return Math.round(clamp01(prod) * 1000) / 1000;
}

/**
 * Merge counter-evidence into registry (immutable copy).
 * @param {RhizohCounterEvidenceRegistry | null | undefined} registry
 * @param {string} claimId
 * @param {RhizohCounterEvidence} evidence
 */
export function addRhizohCounterEvidence(registry, claimId, evidence) {
  const reg = { ...(registry || {}) };
  const cid = String(claimId || "").trim();
  if (!cid) return reg;
  const prev = reg[cid] ? [...reg[cid]] : [];
  prev.push({
    id: String(evidence.id || `ce-${Date.now()}`),
    strength: clamp01(evidence.strength),
    sourceId: evidence.sourceId,
    at: evidence.at != null ? Number(evidence.at) : Date.now(),
    note: evidence.note
  });
  reg[cid] = prev;
  return reg;
}

/**
 * Aggregate counter-evidence pressure ∈ [0,1] (independent-ish OR combination).
 * @param {ReadonlyArray<RhizohCounterEvidence>} items
 */
export function aggregateRhizohCounterEvidencePressure(items) {
  if (!items || !items.length) return 0;
  let acc = 0;
  for (const e of items) {
    acc = clamp01(1 - (1 - acc) * (1 - clamp01(e.strength)));
  }
  return Math.round(clamp01(acc) * 1000) / 1000;
}

/**
 * Build adjacency index for contradiction graph.
 * @param {ReadonlyArray<RhizohContradictionEdge>} edges
 */
export function indexRhizohContradictionGraph(edges) {
  /** @type {Record<string, string[]>} */
  const by = {};
  for (const e of edges || []) {
    const a = String(e.claimA || "").trim();
    const b = String(e.claimB || "").trim();
    if (!a || !b) continue;
    if (!by[a]) by[a] = [];
    if (!by[b]) by[b] = [];
    if (!by[a].includes(b)) by[a].push(b);
    if (!by[b].includes(a)) by[b].push(a);
  }
  return { edges: edges || [], byClaim: by };
}

/**
 * Contradiction penalty for a claim: max over incident edges of (edgeWeight × neighbor severity).
 * Neighbor severity = max(counterPressure(neighbor), priorUncertainty).
 * @param {RhizohContradictionGraph} graph indexed
 * @param {string} claimId
 * @param {RhizohCounterEvidenceRegistry} counterRegistry
 * @param {Record<string, number>} [uncertaintyByClaimId]
 */
export function computeRhizohContradictionPenaltyForClaim(graph, claimId, counterRegistry, uncertaintyByClaimId) {
  const cid = String(claimId || "").trim();
  const unc = uncertaintyByClaimId || {};
  let penalty = 0;
  for (const e of graph.edges || []) {
    const a = String(e.claimA || "").trim();
    const b = String(e.claimB || "").trim();
    if (a !== cid && b !== cid) continue;
    const other = a === cid ? b : a;
    const w = clamp01(e.weight);
    const cItems = counterRegistry?.[other] || [];
    const cPress = aggregateRhizohCounterEvidencePressure(cItems);
    const u = clamp01(unc[other] ?? 0);
    const neighborSeverity = Math.max(cPress, u);
    penalty = Math.max(penalty, w * neighborSeverity);
  }
  const damp = RHIZOH_DECEPTION_DEFAULTS_V1.contradictionDamping;
  return Math.round(clamp01(penalty * damp) * 1000) / 1000;
}

/**
 * Uncertainty propagation on contradiction graph (relaxation).
 * @param {{
 *   graph: RhizohContradictionGraph,
 *   seedUncertainty: Record<string, number>,
 *   iterations?: number,
 *   alpha?: number
 * }} p
 */
export function propagateRhizohUncertainty(p) {
  const g = indexRhizohContradictionGraph(p.graph.edges || []);
  const alpha = p.alpha ?? RHIZOH_DECEPTION_DEFAULTS_V1.uncertaintyAlpha;
  const iters = Math.max(
    1,
    Math.min(24, p.iterations ?? RHIZOH_DECEPTION_DEFAULTS_V1.propagationIterations)
  );
  /** @type {Record<string, number>} */
  let u = { ...p.seedUncertainty };
  const claims = Object.keys(g.byClaim || {});
  for (const c of claims) {
    if (u[c] == null) u[c] = 0;
  }
  for (let k = 0; k < iters; k++) {
    const next = { ...u };
    for (const c of claims) {
      const neigh = g.byClaim[c] || [];
      let pull = u[c] ?? 0;
      for (const n of neigh) {
        pull = Math.max(pull, alpha * clamp01(u[n] ?? 0));
      }
      next[c] = clamp01(Math.max(u[c] ?? 0, pull));
    }
    u = next;
  }
  return u;
}

/**
 * Witness support ∈ [-1,1] aggregated then scaled to contribution for truth score.
 * @param {ReadonlyArray<RhizohWitnessEdge>} witnesses
 * @param {string} claimId
 * @param {Record<string, number>} [witnessTrustById]
 */
export function computeRhizohWitnessSupport(witnesses, claimId, witnessTrustById) {
  const cid = String(claimId || "").trim();
  const wt = witnessTrustById || {};
  let pos = 0;
  let neg = 0;
  for (const w of witnesses || []) {
    if (String(w.claimId || "").trim() !== cid) continue;
    const wid = String(w.witnessId || "").trim() || "anon";
    const tw = clamp01(wt[wid] ?? w.weight ?? 0.5);
    const sw = clamp01(w.weight != null ? w.weight : 0.5) * tw;
    if (w.stance === "support") pos += sw;
    else if (w.stance === "refute") neg += sw;
    else pos += sw * 0.35;
  }
  const net = clamp01(pos) - clamp01(neg);
  return Math.round(clamp01(0.5 + 0.5 * net) * 1000) / 1000;
}

/**
 * Representative composition (not probabilistically calibrated).
 * @param {{
 *   provenance01: number,
 *   contradictionPenalty01: number,
 *   witnessSupport01: number,
 *   witnessScale?: number
 * }} p witnessSupport01 from computeRhizohWitnessSupport (centered 0.5 map applied inside)
 */
export function computeRhizohTruthConfidence(p) {
  const prov = clamp01(p.provenance01);
  const pen = clamp01(p.contradictionPenalty01);
  const ws = clamp01(p.witnessSupport01);
  const scale = p.witnessScale ?? RHIZOH_DECEPTION_DEFAULTS_V1.witnessSupportScale;
  const witnessDelta = (ws - 0.5) * 2 * scale;
  const raw = prov - pen + witnessDelta;
  return Math.round(clamp01(raw) * 1000) / 1000;
}

/**
 * Full snapshot evaluation for one claim.
 * @param {{
 *   claimId: string,
 *   provenanceHops: ReadonlyArray<RhizohProvenanceHop>,
 *   trustBySourceId: Record<string, number>,
 *   counterRegistry: RhizohCounterEvidenceRegistry,
 *   contradictionGraph: RhizohContradictionGraph,
 *   witnesses: ReadonlyArray<RhizohWitnessEdge>,
 *   witnessTrustById?: Record<string, number>,
 *   seedUncertainty?: Record<string, number>
 * }} input
 */
export function evaluateRhizohDeceptionDetection(input) {
  const claimId = String(input.claimId || "").trim();
  const provenance = computeRhizohProvenanceStrength(input.provenanceHops || [], input.trustBySourceId || {});
  const counterPressure = aggregateRhizohCounterEvidencePressure(input.counterRegistry?.[claimId] || []);
  const edges = input.contradictionGraph?.edges || [];
  const g = indexRhizohContradictionGraph(edges);
  /** @type {Record<string, number>} */
  const seed = { ...(input.seedUncertainty || {}) };
  const touch = new Set([claimId]);
  for (const e of edges) {
    touch.add(String(e.claimA || "").trim());
    touch.add(String(e.claimB || "").trim());
  }
  for (const id of touch) {
    if (!id) continue;
    const ce = aggregateRhizohCounterEvidencePressure(input.counterRegistry?.[id] || []);
    seed[id] = Math.max(seed[id] ?? 0, id === claimId ? Math.max(ce, counterPressure) : ce);
  }
  const uncertainty = propagateRhizohUncertainty({ graph: { edges }, seedUncertainty: seed });
  const contradictionPenalty = computeRhizohContradictionPenaltyForClaim(
    g,
    claimId,
    input.counterRegistry || {},
    uncertainty
  );
  const witnessSupport = computeRhizohWitnessSupport(
    input.witnesses || [],
    claimId,
    input.witnessTrustById
  );
  const truthConfidence = computeRhizohTruthConfidence({
    provenance01: provenance,
    contradictionPenalty01: contradictionPenalty,
    witnessSupport01: witnessSupport
  });

  const deceptionRisk = Math.round(clamp01(1 - truthConfidence + contradictionPenalty * 0.35) * 1000) / 1000;

  return {
    claimId,
    provenanceStrength: provenance,
    counterEvidencePressure: counterPressure,
    contradictionPenalty,
    uncertaintyAfterPropagation: uncertainty[claimId] ?? 0,
    witnessSupport,
    truthConfidence,
    deceptionRisk,
    ok: truthConfidence >= 0.28 && deceptionRisk < 0.88
  };
}
