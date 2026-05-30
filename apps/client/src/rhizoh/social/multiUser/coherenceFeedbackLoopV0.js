/**
 * SPECFLOW: RESEARCH-ONLY — **Coherence feedback loop** with **separated lanes** (UI / WS metrics /
 * distributor / YouTube / studio / LLM). Lane state is EWMA-smoothed; **how** lanes combine into
 * `kernelHints` is delegated to `coherenceFeedbackGovernanceV0` (explicit weights + runaway limits).
 */

import {
  COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0,
  DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0,
  deriveGovernedKernelHintsFromStateV0
} from "./coherenceFeedbackGovernanceV0.js";

export const COHERENCE_FEEDBACK_LOOP_SCHEMA_V0 = "castle.rhizoh.coherence_feedback_loop.v0";

const EWMA_ALPHA = 0.35;

/** @returns {Record<string, unknown>} */
export function createInitialCoherenceFeedbackStateV0() {
  return {
    schema: COHERENCE_FEEDBACK_LOOP_SCHEMA_V0,
    uiImpulseEwma: 0,
    /** `WS_METRICS` only — never written from distributor tick. */
    wsMetricsEwma: 0,
    /** `DISTRIBUTOR_TICK` network diff pulse only — not WS chat metrics. */
    distributorPulseEwma: 0,
    /** Full-snapshot / drift pressure from distributor (separate from pulse). */
    distributorDriftEwma: 0,
    youtubePerfEwma: 0.5,
    /** `STUDIO_EVENT` lane (0..1 EWMA). */
    studioEwma: 0,
    /** Optional LLM-side stress / correction signal (0..1). */
    llmStressEwma: 0,
    lastDistributorFrame: 0,
    /** Last **governed** bias applied to kernel (rate limit anchor). */
    lastPeerEnergyBias01: 0
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} prev
 * @param {{
 *   kind: "DISTRIBUTOR_TICK"|"UI_PULSE"|"WS_METRICS"|"YOUTUBE_METRICS"|"STUDIO_EVENT"|"LLM_SIGNAL"|"noop",
 *   payload?: Record<string, unknown>
 * }} event
 * @param {Record<string, unknown> | null | undefined} [governance] — see `DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0`
 */
export function advanceCoherenceFeedbackStateV0(prev, event, governance) {
  const s = {
    ...createInitialCoherenceFeedbackStateV0(),
    ...(prev && typeof prev === "object" ? prev : {})
  };
  const e = event && typeof event === "object" ? event : { kind: "noop", payload: {} };
  const pl = e.payload && typeof e.payload === "object" ? e.payload : {};
  const a = EWMA_ALPHA;
  const gov =
    governance &&
    typeof governance === "object" &&
    governance.schema === COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0
      ? governance
      : DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0;

  if (e.kind === "DISTRIBUTOR_TICK") {
    const dirty = !!(pl.networkDiff && typeof pl.networkDiff === "object" && pl.networkDiff.dirty);
    const pulse = dirty ? 0.85 : 0.12;
    s.distributorPulseEwma = (1 - a) * Number(s.distributorPulseEwma || 0) + a * pulse;
    const full = !!(pl.studioEvent && pl.studioEvent.fullSnapshotRecommended);
    const driftSig = full ? 0.95 : 0.1;
    s.distributorDriftEwma = (1 - a) * Number(s.distributorDriftEwma || 0) + a * driftSig;
    const fr = Number(pl.uiSnapshot?.frame);
    if (Number.isFinite(fr)) s.lastDistributorFrame = fr;
  } else if (e.kind === "UI_PULSE") {
    const i01 = Math.min(1, Math.max(0, Number(pl.intensity01) || 0));
    s.uiImpulseEwma = (1 - a) * Number(s.uiImpulseEwma || 0) + a * i01;
  } else if (e.kind === "WS_METRICS") {
    const mpm = Math.min(120, Math.max(0, Number(pl.messagesPerMinute) || 0));
    const norm = mpm / 60;
    s.wsMetricsEwma = (1 - a) * Number(s.wsMetricsEwma || 0) + a * norm;
  } else if (e.kind === "YOUTUBE_METRICS") {
    const perf = Math.min(1, Math.max(0, Number(pl.engagement01) ?? 0.5));
    s.youtubePerfEwma = (1 - a) * Number(s.youtubePerfEwma || 0.5) + a * perf;
  } else if (e.kind === "STUDIO_EVENT") {
    const w = Math.min(1, Math.max(0, Number(pl.personaWeightDelta01) || 0.12));
    const sig = Math.min(1, w * 2.8);
    s.studioEwma = (1 - a) * Number(s.studioEwma || 0) + a * sig;
  } else if (e.kind === "LLM_SIGNAL") {
    const stress = Math.min(1, Math.max(0, Number(pl.stress01) || 0));
    s.llmStressEwma = (1 - a) * Number(s.llmStressEwma || 0) + a * stress;
  }

  const lastBias = Number(s.lastPeerEnergyBias01);
  const kernelHints = deriveGovernedKernelHintsFromStateV0(s, Number.isFinite(lastBias) ? lastBias : null, gov);
  s.lastPeerEnergyBias01 = kernelHints.peerEnergyBias01;

  return {
    state: { ...s, schema: COHERENCE_FEEDBACK_LOOP_SCHEMA_V0 },
    kernelHints
  };
}

/**
 * `peerEnergyBias01` değerini `castlePeers` üzerine uygular → `runSocialCoherenceKernelTickV0` için `userEnergySlices`.
 *
 * @param {{ peerEnergyBias01?: number, distinctLangCount?: number, socialConflictFlag?: boolean } | null} hints
 * @param {unknown[]} castlePeers
 * @returns {{ userEnergySlices: Array<{ userId: string, energy01: number }>, distinctLangCount?: number, socialConflictFlag?: boolean } | null}
 */
export function mergeCoherenceFeedbackIntoKernelEnergyV0(hints, castlePeers) {
  if (!hints || typeof hints !== "object") return null;
  const bias = Number(hints.peerEnergyBias01);
  const b = Number.isFinite(bias) ? bias : 0;
  const peers = Array.isArray(castlePeers) ? castlePeers : [];
  /** @type {Array<{ userId: string, energy01: number }>} */
  const userEnergySlices = [];
  for (const p of peers) {
    const id = String(p?.id || "").trim();
    if (!id) continue;
    const base = Number.isFinite(Number(p?.nexusEnergy)) ? Number(p.nexusEnergy) : 0.5;
    userEnergySlices.push({
      userId: id,
      energy01: Math.min(0.98, Math.max(0.06, base + b))
    });
  }
  if (!userEnergySlices.length) {
    userEnergySlices.push({
      userId: "__coherence_feedback__",
      energy01: Math.min(0.98, Math.max(0.06, 0.52 + b))
    });
  }
  const out = { userEnergySlices };
  if (hints.distinctLangCount != null && Number.isFinite(Number(hints.distinctLangCount))) {
    out.distinctLangCount = Math.max(1, Math.floor(Number(hints.distinctLangCount)));
  }
  if (hints.socialConflictFlag === true) out.socialConflictFlag = true;
  return out;
}
