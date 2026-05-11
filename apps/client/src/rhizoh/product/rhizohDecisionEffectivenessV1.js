/**
 * Decision feedback validation — karar sonrası rollup delta ile basit etkinlik skoru.
 * Kesin A/B değil; yerel ürün döngüsü için “bu yön doğru mu?” ipucu.
 */

import { getRhizohBehaviorMetricsSnapshot } from "../telemetry/rhizohBehaviorMetricsAggregatorV1.js";
import { emitRhizohBehaviorSignal } from "../telemetry/rhizohBehaviorSignalsV1.js";
import {
  promoteGuardedPolicyFromEffectivenessEpisode,
  loadRhizohProductPolicyState,
  saveRhizohProductPolicyState,
  applyContraryPolicyRollbacks,
  RHIZOH_PRODUCT_POLICY_STORE_VERSION,
  emitRhizohProductPolicyUpdatedSignal
} from "./rhizohProductPolicyStoreV1.js";
import { refreshRhizohExternalGroundTruthBestEffort } from "./rhizohExternalGroundTruthV1.js";
import {
  flushRhizohExternalLossBatchBestEffort,
  getRhizohExternalLossLearningRateMultiplier
} from "./rhizohExternalLossFunctionV1.js";
import {
  fetchRhizohOutcomeAggregatesBestEffort,
  getRhizohOutcomeAggregatesCachedSync
} from "./rhizohGroundTruthBridgeV1.js";

export const RHIZOH_DECISION_EFFECTIVENESS_VERSION = "1.0.0";

export const CASTLE_DECISION_EFFECTIVENESS_EVENT = "castle:decision-effectiveness";

const LS_KEY = "rhizoh.decision.effectiveness.v1";
const MAX_EPISODES = 24;
const MIN_EVAL_AGE_MS = 90_000;
const MIN_DEPTH_DELTA = 2;
const MIN_CLOSURE_EVENT_DELTA = 1;
const MAX_EVAL_WAIT_MS = 86_400_000;

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function logRhizohHealth(stage, detail = {}) {
  try {
    if (typeof console !== "undefined") {
      console.info(`[RHIZOH_OK] ${String(stage || "unknown")}`, detail && typeof detail === "object" ? detail : {});
    }
  } catch {
    /* noop */
  }
}

/** @returns {{ episodes: object[], lastFp: string }} */
function loadStore() {
  try {
    if (typeof window === "undefined") return { episodes: [], lastFp: "" };
    const raw = window.localStorage.getItem(LS_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return {
      episodes: Array.isArray(p.episodes) ? p.episodes : [],
      lastFp: typeof p.lastFp === "string" ? p.lastFp : ""
    };
  } catch {
    return { episodes: [], lastFp: "" };
  }
}

function saveStore(store) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* noop */
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} r
 */
export function sliceRollupForEffectiveness(r) {
  if (!r || typeof r !== "object") return {};
  const cd = r.closureDismiss && typeof r.closureDismiss === "object" ? r.closureDismiss : {};
  const pe = r.phaseEnterCount && typeof r.phaseEnterCount === "object" ? r.phaseEnterCount : {};
  const pd = r.phaseDwellMs && typeof r.phaseDwellMs === "object" ? r.phaseDwellMs : {};
  return {
    closureVisibleMsSum: Number(r.closureVisibleMsSum) || 0,
    closureVisibleMsCount: Number(r.closureVisibleMsCount) || 0,
    closureDismiss: { timeout: Number(cd.timeout) || 0, replaced_or_unmount: Number(cd.replaced_or_unmount) || 0 },
    turnDepthSum: Number(r.turnDepthSum) || 0,
    turnDepthCount: Number(r.turnDepthCount) || 0,
    trustDeltaSum: Number(r.trustDeltaSum) || 0,
    phaseEnterCount: { ...pe },
    phaseDwellMs: { ...pd }
  };
}

function fingerprintOverlay(overlay) {
  if (!overlay || !Array.isArray(overlay.rationale) || overlay.rationale.length === 0) return "";
  const ux = overlay.ux && typeof overlay.ux === "object" ? overlay.ux : {};
  const pt = overlay.phaseTuning && typeof overlay.phaseTuning === "object" ? overlay.phaseTuning : {};
  const cg = overlay.capabilityGates && typeof overlay.capabilityGates === "object" ? overlay.capabilityGates : {};
  return JSON.stringify({
    r: overlay.rationale.slice().sort(),
    c: ux.closureBannerMs,
    tb: pt.trustBondForNormal,
    tt: pt.trustTurnsForNormal,
    it: pt.introTurnsForTrust,
    g: cg.suppressGovernanceOpsBadgeUnlessBond01
  });
}

/** Dış outcome ingest / CRM ile aynı anahtar — `maybeRecordRhizohDecisionEpisode` fingerprint alanı. */
export function computeRhizohDecisionOverlayFingerprint(overlay) {
  return fingerprintOverlay(overlay);
}

/**
 * Nüfus aggregate’ına göre retrospective rollback sonrası episodu işaretle (tekrar işleme).
 * @param {string} episodeId
 * @param {Record<string, unknown>} detail
 */
export function markRhizohDecisionEpisodeRetrospectiveReplay(episodeId, detail) {
  if (typeof window === "undefined") return false;
  const store = loadStore();
  let hit = false;
  const next = store.episodes.map((ep) => {
    if (ep.id !== episodeId) return ep;
    hit = true;
    const prevOut = ep.outcome && typeof ep.outcome === "object" ? ep.outcome : {};
    return {
      ...ep,
      outcome: {
        ...prevOut,
        retrospectiveReplay: { appliedAtMs: Date.now(), ...(detail || {}) }
      }
    };
  });
  if (!hit) return false;
  saveStore({ ...store, episodes: next });
  return true;
}

/**
 * Kohort düzeyinde düşük outcome oranı + içeride supporting karar → contrary rollback (ground truth bridge).
 * @param {{ minSampleN?: number, maxOutcomeRate?: number }} [opts]
 * @returns {{ episodeId: string, decisionFingerprint: string, rollbacks: string[] }[]}
 */
export function runRhizohRetrospectiveReplayHook(opts = {}) {
  if (typeof window === "undefined") return [];
  const minSampleN = Math.max(1, Math.floor(Number(opts.minSampleN) || 5));
  const maxOutcomeRate = Number.isFinite(Number(opts.maxOutcomeRate)) ? Number(opts.maxOutcomeRate) : 0.42;

  const agg = getRhizohOutcomeAggregatesCachedSync();
  if (agg.status !== "fresh" || !agg.rows.length) return [];

  const store = loadStore();
  const byFp = new Map(agg.rows.map((r) => [r.decisionFingerprint, r]));

  /** @type {{ episodeId: string, decisionFingerprint: string, rollbacks: string[] }[]} */
  const applied = [];

  for (const ep of store.episodes) {
    if (ep.outcome?.retrospectiveReplay?.appliedAtMs) continue;
    const scores = ep.outcome?.scores;
    if (!Array.isArray(scores) || !scores.length) continue;
    const hadSupporting = scores.some((s) => s && s.verdict === "supporting" && s.dimension);
    if (!hadSupporting) continue;

    const fp =
      typeof ep.fingerprint === "string" && ep.fingerprint
        ? ep.fingerprint
        : computeRhizohDecisionOverlayFingerprint({
            rationale: ep.rationale,
            ux: ep.ux,
            phaseTuning: ep.phaseTuning,
            capabilityGates: ep.capabilityGates
          });
    if (!fp) continue;

    const row = byFp.get(fp);
    if (!row || row.sampleN < minSampleN || row.outcomeRate > maxOutcomeRate) continue;

    const synthetic = scores
      .filter((s) => s && s.verdict === "supporting" && s.dimension)
      .map((s) => ({
        tag: s.tag,
        dimension: s.dimension,
        verdict: "contrary",
        score01: clamp01(1 - clamp01(Number(s.score01) || 0.55)),
        retrospectivePopulationBridge: true
      }));

    if (!synthetic.length) continue;

    const state = loadRhizohProductPolicyState();
    const rb = applyContraryPolicyRollbacks(state, synthetic);
    if (rb.touched) {
      saveRhizohProductPolicyState(state);
      emitRhizohProductPolicyUpdatedSignal({
        schemaVersion: "1.2.0",
        policyVersion: RHIZOH_PRODUCT_POLICY_STORE_VERSION,
        ts: Date.now(),
        promotions: [],
        rollbacks: rb.dimensions,
        skippedPromoteReason: "retrospective_population_contradiction",
        promoteMeta: { ...state.promoteMeta },
        auditTail: state.audit.slice(-4),
        externalLossLearningRate: getRhizohExternalLossLearningRateMultiplier()
      });
    }

    markRhizohDecisionEpisodeRetrospectiveReplay(ep.id, {
      decisionFingerprint: fp,
      cohortId: row.cohortId,
      populationOutcomeRate: row.outcomeRate,
      populationSampleN: row.sampleN,
      rollbackDimensions: rb.dimensions
    });

    emitRhizohBehaviorSignal("rhizoh.grounding.retrospective_contradiction", {
      episodeId: ep.id,
      decisionFingerprint: fp.slice(0, 256),
      populationOutcomeRate: row.outcomeRate,
      populationSampleN: row.sampleN,
      rollbackDimensions: rb.dimensions
    });

    applied.push({ episodeId: ep.id, decisionFingerprint: fp, rollbacks: rb.dimensions });
  }

  return applied;
}

export function avgClosureVisibleMsFromRollupSlice(slice) {
  const c = Number(slice.closureVisibleMsCount) || 0;
  if (c < 1) return null;
  return slice.closureVisibleMsSum / c;
}

export function segmentAvgClosureVisibleMs(baseline, current) {
  const dC = (current.closureVisibleMsCount || 0) - (baseline.closureVisibleMsCount || 0);
  const dS = (current.closureVisibleMsSum || 0) - (baseline.closureVisibleMsSum || 0);
  if (dC < 1) return null;
  return dS / dC;
}

export function segmentAvgTurnDepth(baseline, current) {
  const dC = (current.turnDepthCount || 0) - (baseline.turnDepthCount || 0);
  const dS = (current.turnDepthSum || 0) - (baseline.turnDepthSum || 0);
  if (dC < 1) return null;
  return dS / dC;
}

export function dismissTotal(slice) {
  const d = slice.closureDismiss || {};
  return (Number(d.timeout) || 0) + (Number(d.replaced_or_unmount) || 0);
}

function verdictFromLift(lift, thresh) {
  const t = Number(thresh) || 0.06;
  if (lift > t) return "supporting";
  if (lift < -t) return "contrary";
  return "neutral";
}

/**
 * Aktif karar seti değişince baseline kaydı (aynı fingerprint tekrar yazılmaz).
 * @param {{ rationale?: string[], ux?: object, phaseTuning?: object, capabilityGates?: object }} overlay
 */
export function maybeRecordRhizohDecisionEpisode(overlay) {
  const fp = fingerprintOverlay(overlay);
  if (!fp) return false;
  const store = loadStore();
  if (fp === store.lastFp) return false;

  const snap = getRhizohBehaviorMetricsSnapshot();
  const episode = {
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    recordedAt: Date.now(),
    fingerprint: fp,
    rationale: overlay.rationale.slice(),
    ux: overlay.ux,
    phaseTuning: overlay.phaseTuning,
    capabilityGates: overlay.capabilityGates,
    baselineRollup: sliceRollupForEffectiveness(snap.rollup),
    baselineDerived: { ...(snap.derived || {}) },
    outcome: null
  };
  store.episodes = [...store.episodes, episode].slice(-MAX_EPISODES);
  store.lastFp = fp;
  saveStore(store);
  return true;
}

function scoreEpisode(ep, curRollupSlice) {
  /** @type {object[]} */
  const scores = [];
  const baseAvgClosure = avgClosureVisibleMsFromRollupSlice(ep.baselineRollup);
  const segClosure = segmentAvgClosureVisibleMs(ep.baselineRollup, curRollupSlice);
  const segDepth = segmentAvgTurnDepth(ep.baselineRollup, curRollupSlice);
  const baseDepth = ep.baselineDerived?.avgTurnDepth;

  for (const tag of ep.rationale) {
    if (typeof tag !== "string") continue;
    if (tag.includes("closure_timeout")) {
      if (baseAvgClosure != null && segClosure != null) {
        const lift = (segClosure - baseAvgClosure) / Math.max(400, baseAvgClosure);
        scores.push({
          tag,
          dimension: "closure_engagement",
          baselineAvgClosureMs: Math.round(baseAvgClosure),
          segmentAvgClosureMs: Math.round(segClosure),
          lift,
          score01: clamp01(0.5 + lift),
          verdict: verdictFromLift(lift, 0.07)
        });
      }
    }
    if (tag.includes("trust_build_stall")) {
      const dNorm =
        (curRollupSlice.phaseEnterCount?.NORMAL_CHAT || 0) -
        (ep.baselineRollup.phaseEnterCount?.NORMAL_CHAT || 0);
      const dTrust = (curRollupSlice.trustDeltaSum || 0) - (ep.baselineRollup.trustDeltaSum || 0);
      const lift = Math.max(-1, Math.min(1, dNorm * 0.22 + Math.tanh(dTrust * 4) * 0.18));
      scores.push({
        tag,
        dimension: "trust_advance",
        normalChatEnterDelta: dNorm,
        trustDeltaSumDelta: Math.round(dTrust * 1000) / 1000,
        lift,
        score01: clamp01(0.5 + lift * 0.45),
        verdict: verdictFromLift(lift, 0.04)
      });
    }
    if (tag.includes("governance_noise")) {
      if (segDepth != null && Number.isFinite(Number(baseDepth))) {
        const lift = segDepth - Number(baseDepth);
        scores.push({
          tag,
          dimension: "depth_under_gate",
          baselineAvgTurnDepth: Number(baseDepth),
          segmentAvgTurnDepth: Math.round(segDepth * 1000) / 1000,
          lift,
          score01: clamp01(0.5 + lift * 3),
          verdict: verdictFromLift(lift, 0.035)
        });
      }
    }
    if (tag.includes("shallow_intro")) {
      if (segDepth != null && Number.isFinite(Number(baseDepth))) {
        const lift = segDepth - Number(baseDepth);
        scores.push({
          tag,
          dimension: "intro_pacing_depth",
          baselineAvgTurnDepth: Number(baseDepth),
          segmentAvgTurnDepth: Math.round(segDepth * 1000) / 1000,
          lift,
          score01: clamp01(0.5 + lift * 3),
          verdict: verdictFromLift(lift, 0.035)
        });
      }
    }
  }
  return scores;
}

/**
 * Açık episodları değerlendirir; sonuçları LS’e yazar ve olay yayınlar.
 * @returns {{ episodeId: string, scores: object[] }[]}
 */
export function evaluateRhizohDecisionEffectiveness() {
  if (typeof window === "undefined") return [];
  const store = loadStore();
  const snap = getRhizohBehaviorMetricsSnapshot();
  const cur = sliceRollupForEffectiveness(snap.rollup);
  const now = Date.now();
  /** @type {{ episodeId: string, scores: object[] }[]} */
  const evaluations = [];

  const next = store.episodes.map((ep) => {
    if (ep.outcome) return ep;
    const age = now - ep.recordedAt;
    if (age > MAX_EVAL_WAIT_MS) {
      return {
        ...ep,
        outcome: { evaluatedAt: now, scores: [], note: "abandoned_window" }
      };
    }
    if (age < MIN_EVAL_AGE_MS) return ep;

    const dDepth = (cur.turnDepthCount || 0) - (ep.baselineRollup.turnDepthCount || 0);
    const dDismiss = dismissTotal(cur) - dismissTotal(ep.baselineRollup);

    if (dDepth < MIN_DEPTH_DELTA && dDismiss < MIN_CLOSURE_EVENT_DELTA) return ep;

    const scores = scoreEpisode(ep, cur);
    if (!scores.length) {
      return {
        ...ep,
        outcome: { evaluatedAt: now, scores: [], note: "no_matching_metrics" }
      };
    }

    evaluations.push({ episodeId: ep.id, scores });
    return { ...ep, outcome: { evaluatedAt: now, scores } };
  });

  saveStore({ ...store, episodes: next });

  if (evaluations.length > 0) {
    for (const ev of evaluations) {
      const ep = next.find((e) => e.id === ev.episodeId);
      const sc = ep?.outcome?.scores;
      if (Array.isArray(sc) && sc.length > 0) {
        const pr = promoteGuardedPolicyFromEffectivenessEpisode(ep, sc);
        if (pr.promoted) {
          emitRhizohBehaviorSignal("rhizoh.policy.learned_patch", {
            episodeId: ep.id,
            promotions: pr.detail?.promotions ?? []
          });
        }
        const rbDims = pr.detail?.rollbacks ?? [];
        if (rbDims.length > 0) {
          emitRhizohBehaviorSignal("rhizoh.policy.learned_rollback", {
            episodeId: ep.id,
            dimensions: rbDims,
            rollbackOnly: !!pr.rollbackOnly
          });
        }
        if (pr.skippedReason) {
          emitRhizohBehaviorSignal("rhizoh.policy.promote_skipped", {
            episodeId: ep.id,
            reason: pr.skippedReason
          });
        }
      }
    }
    try {
      window.dispatchEvent(
        new CustomEvent(CASTLE_DECISION_EFFECTIVENESS_EVENT, {
          detail: {
            schemaVersion: "1.0.0",
            effectivenessVersion: RHIZOH_DECISION_EFFECTIVENESS_VERSION,
            ts: now,
            evaluations
          }
        })
      );
    } catch {
      /* noop */
    }
    for (const ev of evaluations) {
      for (const s of ev.scores) {
        emitRhizohBehaviorSignal("rhizoh.decision.effectiveness", {
          episodeId: ev.episodeId,
          dimension: s.dimension,
          verdict: s.verdict,
          score01: s.score01,
          tag: s.tag
        });
      }
    }
  }

  return evaluations;
}

export async function runRhizohDecisionFeedbackTick(overlay, continuityMeta) {
  maybeRecordRhizohDecisionEpisode(overlay);
  await refreshRhizohExternalGroundTruthBestEffort();
  logRhizohHealth("aggregate_refresh", { source: "external_truth" });
  await fetchRhizohOutcomeAggregatesBestEffort(
    continuityMeta && typeof continuityMeta === "object" && continuityMeta.outcomeAggregateCohortId
      ? { cohortId: String(continuityMeta.outcomeAggregateCohortId) }
      : {}
  );
  logRhizohHealth("aggregate_refresh", { source: "outcome_aggregate" });
  const replay = runRhizohRetrospectiveReplayHook({});
  logRhizohHealth("replay_tick", { applied: Array.isArray(replay) ? replay.length : 0 });
  await flushRhizohExternalLossBatchBestEffort();
  logRhizohHealth("outcome_flush", {});
  const evaluations = evaluateRhizohDecisionEffectiveness();
  return evaluations;
}

/** Panel için son değerlendirilmiş episodlar. */
export function getRhizohDecisionEffectivenessReport() {
  const { episodes } = loadStore();
  return episodes
    .filter((e) => e.outcome && Array.isArray(e.outcome.scores) && e.outcome.scores.length > 0)
    .slice(-8)
    .reverse()
    .map((e) => ({
      id: e.id,
      recordedAt: e.recordedAt,
      evaluatedAt: e.outcome.evaluatedAt,
      rationale: e.rationale,
      scores: e.outcome.scores
    }));
}
