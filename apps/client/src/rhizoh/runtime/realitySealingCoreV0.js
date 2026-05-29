/**
 * Reality Sealing Core (RSC) — Sprint 1 executable skeleton.
 *
 * **Ontology:** Reality is not what the LLM describes. Reality is what survives sealing.
 *
 * Pipeline (no WAL / ROS runtime here — gates are stubs until those layers wire in):
 *   candidate_event → epoch classifier → constitution gate → authority lease → world seal → reality_epoch++
 *
 * @see epochClassificationEngineV0.js
 * @see multiLayerRealityConsensusEngineV0.js
 */

import { EPOCH_COMMIT_CLASS_TAXONOMY_V0 } from "../spatial/epochClassificationEngineV0.js";
import { checkConstitutionGateRuntimeV0 } from "./realityConstitutionGateRuntimeV0.js";

export const REALITY_SEALING_CORE_SCHEMA_V0 = "castle.rhizoh.reality_sealing_core.v0";

/** Canonical ontological lock for Castle / Rhizoh. */
export const REALITY_ONTOLOGY_AXIOM_V0 =
  "Reality is not what the LLM describes. Reality is what survives sealing.";

/** Singular epoch authority — WAL / ROS / coherence must not bypass the sealer. */
export const CANONICAL_REALITY_AUTHORITY_INVARIANT_V0 =
  "Only the sealer may advance canonical reality.";

export const REALITY_SEAL_VERDICTS_V0 = Object.freeze({
  ALLOW_EPOCH_BUMP: "allow_epoch_bump",
  DEFER_COALESCE: "defer_coalesce",
  ROUTE_SUBCOUNTER: "route_subcounter_only",
  REJECT: "reject"
});

export const DEFAULT_REALITY_SEAL_BUDGET_V0 = Object.freeze({
  windowMs: 1000,
  maxSealsPerWindow: 8
});

export const REALITY_SEAL_LIMITS_V0 = Object.freeze({
  maxQueue: 64,
  maxAuditTrail: 256,
  genesisSealHash: "h00000000"
});

const COMMIT_CLASS_BY_ID = Object.freeze(
  Object.fromEntries(EPOCH_COMMIT_CLASS_TAXONOMY_V0.map((c) => [c.id, c]))
);

/**
 * @param {unknown} v
 * @returns {string}
 */
function canonicalJsonV0(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : `"NaN"`;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => canonicalJsonV0(x)).join(",")}]`;
  if (typeof v === "object") {
    const o = /** @type {Record<string, unknown>} */ (v);
    const keys = Object.keys(o).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJsonV0(o[k])}`).join(",")}}`;
  }
  return `"${String(v)}"`;
}

/**
 * @param {string} str
 * @returns {string}
 */
function djb2HexU32(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState | null | undefined} slice
 * @param {{ windowMs?: number, maxSealsPerWindow?: number, nowMs?: number }} [opts]
 * @returns {import("../../studio/types/rskOntology.js").RealitySealLayerState}
 */
export function createDefaultRealitySealLayerStateV0(slice, opts = {}) {
  const nowMs = Number(opts.nowMs) || 0;
  const base = slice && typeof slice === "object" ? slice : {};
  return {
    realityEpoch: Number.isFinite(base.realityEpoch) ? Math.max(0, base.realityEpoch) : 0,
    sealHashHead:
      typeof base.sealHashHead === "string" && base.sealHashHead
        ? base.sealHashHead
        : REALITY_SEAL_LIMITS_V0.genesisSealHash,
    sealQueue: Array.isArray(base.sealQueue) ? [...base.sealQueue] : [],
    auditTrail: Array.isArray(base.auditTrail) ? [...base.auditTrail] : [],
    budget: {
      windowStartMs: Number(base.budget?.windowStartMs) || nowMs,
      windowMs: Number(opts.windowMs) || Number(base.budget?.windowMs) || DEFAULT_REALITY_SEAL_BUDGET_V0.windowMs,
      maxSealsPerWindow:
        Number(opts.maxSealsPerWindow) ||
        Number(base.budget?.maxSealsPerWindow) ||
        DEFAULT_REALITY_SEAL_BUDGET_V0.maxSealsPerWindow,
      sealsInWindow: Number(base.budget?.sealsInWindow) || 0
    },
    streamSeq: Number.isFinite(base.streamSeq) ? Math.max(0, base.streamSeq) : 0,
    intentSeq: Number.isFinite(base.intentSeq) ? Math.max(0, base.intentSeq) : 0,
    scheduler: {
      lastDrainAtMs: Number(base.scheduler?.lastDrainAtMs) || 0,
      lastScheduleEvalAtMs: Number(base.scheduler?.lastScheduleEvalAtMs) || nowMs,
      coalesceHoldUntilMs: Number(base.scheduler?.coalesceHoldUntilMs) || 0,
      drainPassesThisSession: Number(base.scheduler?.drainPassesThisSession) || 0
    }
  };
}

/**
 * @param {string} commitClassId
 * @returns {{ mayAdvanceRealityEpoch: boolean, counterTarget?: string } | null}
 */
export function resolveCommitClassV0(commitClassId) {
  const id = String(commitClassId || "").trim();
  if (!id) return null;
  const row = COMMIT_CLASS_BY_ID[id];
  if (row) return row;
  return COMMIT_CLASS_BY_ID.high_rate_substrate ?? null;
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {{ verdict: string, reasonCode: string, commitClassId: string }}
 */
export function classifyEpochCandidateV0(candidate, seal) {
  const commitClassId = String(candidate?.commitClassId || "high_rate_substrate");
  const klass = resolveCommitClassV0(commitClassId);
  const head = seal?.sealHashHead ?? REALITY_SEAL_LIMITS_V0.genesisSealHash;

  if (candidate?.duplicateOfPriorSeal || candidate?.payloadHash === head) {
    return {
      verdict: REALITY_SEAL_VERDICTS_V0.REJECT,
      reasonCode: "duplicate_or_noop",
      commitClassId
    };
  }

  if (!klass?.mayAdvanceRealityEpoch) {
    return {
      verdict: REALITY_SEAL_VERDICTS_V0.ROUTE_SUBCOUNTER,
      reasonCode: "non_sealing_class",
      commitClassId
    };
  }

  return {
    verdict: REALITY_SEAL_VERDICTS_V0.ALLOW_EPOCH_BUMP,
    reasonCode: "sealing_class_ok",
    commitClassId
  };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @returns {{ ok: true } | { ok: false, code: string, ruleId?: string }}
 */
export function checkConstitutionGateV0(candidate) {
  return checkConstitutionGateRuntimeV0(candidate);
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @returns {{ ok: true } | { ok: false, code: string }}
 */
export function checkAuthorityLeaseV0(candidate) {
  if (candidate?.leaseOk === false) {
    return { ok: false, code: "LEASE_AUTHORITY_REJECT" };
  }
  return { ok: true };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {number} nowMs
 * @returns {{ ok: true, budget: import("../../studio/types/rskOntology.js").RealitySealBudgetV0 } | { ok: false, code: string, budget: import("../../studio/types/rskOntology.js").RealitySealBudgetV0 }}
 */
export function checkEpochBudgetV0(seal, nowMs) {
  const b0 = seal.budget;
  let budget = { ...b0 };
  const t = Number(nowMs) || 0;
  if (t - budget.windowStartMs >= budget.windowMs) {
    budget = { ...budget, windowStartMs: t, sealsInWindow: 0 };
  }
  if (budget.sealsInWindow >= budget.maxSealsPerWindow) {
    return { ok: false, code: "EPOCH_INFLATION_BUDGET_EXCEEDED", budget };
  }
  return { ok: true, budget };
}

/**
 * @param {string} priorHash
 * @param {number} epoch
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @returns {string}
 */
export function computeSealHashV0(priorHash, epoch, candidate) {
  const basis = {
    priorHash: String(priorHash || REALITY_SEAL_LIMITS_V0.genesisSealHash),
    epoch: Number(epoch) || 0,
    candidateId: candidate?.candidateId,
    commitClassId: candidate?.commitClassId,
    payloadHash: candidate?.payloadHash,
    roomScope: candidate?.roomScope ?? null,
    source: candidate?.source ?? "unknown"
  };
  return djb2HexU32(canonicalJsonV0(basis));
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @returns {import("../../studio/types/rskOntology.js").RealitySealLayerState}
 */
export function enqueueRealitySealCandidateV0(seal, candidate) {
  const s = createDefaultRealitySealLayerStateV0(seal);
  const q = [...s.sealQueue, candidate];
  if (q.length > REALITY_SEAL_LIMITS_V0.maxQueue) {
    q.splice(0, q.length - REALITY_SEAL_LIMITS_V0.maxQueue);
  }
  return { ...s, sealQueue: q };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {string} verdict
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @returns {import("../../studio/types/rskOntology.js").RealitySealLayerState}
 */
function routeSubcounterV0(seal, verdict, candidate) {
  const s = { ...seal };
  const klass = resolveCommitClassV0(candidate.commitClassId);
  const target = klass?.counterTarget ?? "";
  if (target.includes("intent")) {
    s.intentSeq += 1;
  } else {
    s.streamSeq += 1;
  }
  return s;
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealAuditEntryV0[]} trail
 * @param {import("../../studio/types/rskOntology.js").RealitySealAuditEntryV0} entry
 * @returns {import("../../studio/types/rskOntology.js").RealitySealAuditEntryV0[]}
 */
function appendAuditV0(trail, entry) {
  const next = [...trail, entry];
  if (next.length > REALITY_SEAL_LIMITS_V0.maxAuditTrail) {
    next.splice(0, next.length - REALITY_SEAL_LIMITS_V0.maxAuditTrail);
  }
  return next;
}

/**
 * Process one queued candidate through the full sealing pipeline.
 *
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {import("../../studio/types/rskOntology.js").RealitySealCandidateV0} candidate
 * @param {number} nowMs
 * @returns {{ seal: import("../../studio/types/rskOntology.js").RealitySealLayerState, sealed: boolean, verdict: string, reasonCode: string }}
 */
export function processRealitySealCandidateV0(seal, candidate, nowMs) {
  let s = createDefaultRealitySealLayerStateV0(seal, { nowMs });
  const priorEpoch = s.realityEpoch;
  const priorSealHash = s.sealHashHead;
  const classification = classifyEpochCandidateV0(candidate, s);
  let verdict = classification.verdict;
  let reasonCode = classification.reasonCode;

  const constitution = checkConstitutionGateV0(candidate);
  if (!constitution.ok) {
    verdict = REALITY_SEAL_VERDICTS_V0.REJECT;
    reasonCode = constitution.ruleId
      ? `${constitution.code}:${constitution.ruleId}`
      : constitution.code;
  }

  const lease = checkAuthorityLeaseV0(candidate);
  if (lease.ok === false) {
    verdict = REALITY_SEAL_VERDICTS_V0.REJECT;
    reasonCode = lease.code;
  }

  if (verdict === REALITY_SEAL_VERDICTS_V0.ALLOW_EPOCH_BUMP) {
    const budgetCheck = checkEpochBudgetV0(s, nowMs);
    s = { ...s, budget: budgetCheck.budget };
    if (!budgetCheck.ok && !candidate?.emergencyForkToken) {
      verdict = REALITY_SEAL_VERDICTS_V0.DEFER_COALESCE;
      reasonCode = budgetCheck.code;
    }
  }

  let nextEpoch = priorEpoch;
  let nextHash = s.sealHashHead;
  let sealed = false;

  if (verdict === REALITY_SEAL_VERDICTS_V0.ALLOW_EPOCH_BUMP) {
    nextEpoch = priorEpoch + 1;
    nextHash = computeSealHashV0(s.sealHashHead, nextEpoch, candidate);
    s = {
      ...s,
      realityEpoch: nextEpoch,
      sealHashHead: nextHash,
      budget: {
        ...s.budget,
        sealsInWindow: s.budget.sealsInWindow + 1
      }
    };
    sealed = true;
  } else if (verdict === REALITY_SEAL_VERDICTS_V0.ROUTE_SUBCOUNTER) {
    s = routeSubcounterV0(s, verdict, candidate);
  }

  const auditEntry = {
    atMs: nowMs,
    candidateId: String(candidate.candidateId || ""),
    source: String(candidate.source || "unknown"),
    commitClassId: classification.commitClassId,
    verdict,
    priorEpoch,
    nextEpoch,
    priorSealHash,
    sealHash: nextHash,
    reasonCode
  };

  s = { ...s, auditTrail: appendAuditV0(s.auditTrail, auditEntry) };

  return { seal: s, sealed, verdict, reasonCode };
}

/**
 * Drain seal queue FIFO (deterministic given stable queue order).
 *
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {number} [nowMs]
 * @returns {{ seal: import("../../studio/types/rskOntology.js").RealitySealLayerState, processed: number, sealed: number }}
 */
export function drainRealitySealQueueV0(seal, nowMs = Date.now()) {
  let s = createDefaultRealitySealLayerStateV0(seal, { nowMs });
  const queue = [...s.sealQueue];
  let processed = 0;
  let sealed = 0;
  for (const candidate of queue) {
    const r = processRealitySealCandidateV0(s, candidate, nowMs);
    s = r.seal;
    processed += 1;
    if (r.sealed) sealed += 1;
  }
  return { seal: { ...s, sealQueue: [] }, processed, sealed };
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealAuditEntryV0[]} trail
 * @returns {{ ok: true } | { ok: false, code: string, index: number }}
 */
export function replaySealAuditTrailV0(trail) {
  if (!Array.isArray(trail) || trail.length === 0) {
    return { ok: true };
  }
  let expectEpoch = trail[0].priorEpoch;
  let expectHash = trail[0].priorSealHash ?? REALITY_SEAL_LIMITS_V0.genesisSealHash;
  for (let i = 0; i < trail.length; i++) {
    const row = trail[i];
    if (row.priorEpoch !== expectEpoch) {
      return { ok: false, code: "epoch_chain_break", index: i };
    }
    if (row.priorSealHash && row.priorSealHash !== expectHash) {
      return { ok: false, code: "seal_hash_chain_break", index: i };
    }
    if (row.verdict === REALITY_SEAL_VERDICTS_V0.ALLOW_EPOCH_BUMP) {
      if (row.nextEpoch !== row.priorEpoch + 1) {
        return { ok: false, code: "epoch_increment_invalid", index: i };
      }
    }
    expectEpoch = row.nextEpoch;
    expectHash = row.sealHash;
  }
  return { ok: true };
}

/**
 * @param {number} nowMs
 * @param {{ dEpochPerSec: number, sealsPerSec: number }} rates
 * @returns {"ok" | "warn" | "critical"}
 */
export function assessEpochInflationV0(nowMs, rates) {
  const d = Number(rates?.dEpochPerSec) || 0;
  const sps = Number(rates?.sealsPerSec) || 0;
  const max = DEFAULT_REALITY_SEAL_BUDGET_V0.maxSealsPerWindow;
  const win = DEFAULT_REALITY_SEAL_BUDGET_V0.windowMs / 1000;
  const band = max / Math.max(win, 0.001);
  if (d > band * 2 || sps > band * 2) return "critical";
  if (d > band || sps > band) return "warn";
  void nowMs;
  return "ok";
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @returns {Record<string, unknown>}
 */
export function buildRealitySealingCoreSnapshotV0(seal) {
  const s = createDefaultRealitySealLayerStateV0(seal);
  return {
    schema: REALITY_SEALING_CORE_SCHEMA_V0,
    axiom: REALITY_ONTOLOGY_AXIOM_V0,
    ts: Date.now(),
    realityEpoch: s.realityEpoch,
    sealHashHead: s.sealHashHead,
    queueDepth: s.sealQueue.length,
    auditDepth: s.auditTrail.length,
    streamSeq: s.streamSeq,
    intentSeq: s.intentSeq,
    budget: s.budget,
    pipeline: [
      "candidate_event",
      "epoch_classifier",
      "constitution_gate",
      "authority_lease_check",
      "world_seal",
      "reality_epoch++"
    ],
    inflationStatus: assessEpochInflationV0(Date.now(), {
      dEpochPerSec: s.budget.sealsInWindow / Math.max(s.budget.windowMs / 1000, 0.001),
      sealsPerSec: s.budget.sealsInWindow / Math.max(s.budget.windowMs / 1000, 0.001)
    })
  };
}
