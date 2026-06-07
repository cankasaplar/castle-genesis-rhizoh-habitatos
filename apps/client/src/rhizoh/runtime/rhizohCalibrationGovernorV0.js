/**
 * Calibration Governor v0 — observation-only drift → founder suggestion → manual commit.
 * Never auto-applies to execution or authority selection.
 * @see apps/client/docs/RHIZOH_BEHAVIORAL_TURN_SOVEREIGNTY_V0.md §17
 */

import { buildTurnBehavioralDriftReportV0 } from "./turnBehavioralDriftEngineV0.js";
import { SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0 } from "./turnSovereigntyObservationExecutionInvariantV0.js";

export const RHIZOH_CALIBRATION_GOVERNOR_SCHEMA_V0 = "castle.rhizoh.calibration_governor.v0";

const STORAGE_KEY_V0 = "rhizoh.calibration_governor_commits.v0";

function readCommitsV0() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCommitsV0(commits) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(commits));
  } catch {
    /* noop */
  }
}

/**
 * @param {object} signal
 */
function proposalFromDriftSignalV0(signal) {
  const code = String(signal?.code || "unknown");
  const id = `cal_${code}_${Date.now()}`;
  const templates = {
    elevated_silent_observe: {
      message: "Rhizoh sessizlik oranı yükseliyor — voice gate veya enforcement partial gözden geçirilsin mi?",
      category: "authority_starvation"
    },
    no_lock_escape_pressure: {
      message: "No-lock escape baskısı yüksek — router/gate fallback zinciri incelensin mi?",
      category: "fallback_pressure"
    },
    low_llm_conversation_share: {
      message: "LLM conversation payı düşük — oturum 'sessiz' hissediyor olabilir.",
      category: "conversation_share"
    },
    high_presence_ack_share: {
      message: "Presence-dominant oturum — wake/presence test yükü beklenen aralıkta mı?",
      category: "presence_dominance"
    }
  };
  const tpl = templates[code] || {
    message: `Drift sinyali: ${code}`,
    category: "generic"
  };
  return Object.freeze({
    id,
    code,
    severity: signal?.severity || "medium",
    category: tpl.category,
    message: tpl.message,
    founderQuestion: "Benim davranışım bu yönde kayıyor — bunu onaylıyor musun?",
    status: "pending",
    autoApply: false,
    influencesAuthority: false,
    influencesExecution: false,
    createdAtMs: Date.now()
  });
}

/**
 * @param {object} decay
 */
function proposalFromCubeFoxDecayV0(decay) {
  if (!decay || decay.trend === "stable" || decay.trend === "insufficient_data") return null;
  return Object.freeze({
    id: `cal_cube_fox_${Date.now()}`,
    code: "cube_fox_influence_shift",
    severity: "low",
    category: "attention_bias",
    message: `Cube/Fox advisory bias kayıyor (${decay.trend}) — cap wheel attention runtime incelensin mi?`,
    founderQuestion: "Benim davranışım bu yönde kayıyor — bunu onaylıyor musun?",
    status: "pending",
    autoApply: false,
    influencesAuthority: false,
    influencesExecution: false,
    createdAtMs: Date.now()
  });
}

export function buildCalibrationGovernorProposalsV0() {
  const drift = buildTurnBehavioralDriftReportV0();
  const commits = readCommitsV0();
  /** @type {object[]} */
  const proposals = [];

  for (const signal of drift.consistency?.driftSignals || []) {
    proposals.push(proposalFromDriftSignalV0(signal));
  }

  const foxProposal = proposalFromCubeFoxDecayV0(drift.metrics?.cubeFoxInfluenceDecay);
  if (foxProposal) proposals.push(foxProposal);

  if (
    drift.metrics?.authorityVolatilityScore > 0.55 &&
    !proposals.some((p) => p.code === "authority_volatility")
  ) {
    proposals.push(
      Object.freeze({
        id: `cal_volatility_${Date.now()}`,
        code: "authority_volatility",
        severity: "medium",
        category: "reality_flips",
        message: "Authority volatility yüksek — reality flip oranı founder review gerektiriyor.",
        founderQuestion: "Benim davranışım bu yönde kayıyor — bunu onaylıyor musun?",
        status: "pending",
        autoApply: false,
        influencesAuthority: false,
        influencesExecution: false,
        createdAtMs: Date.now()
      })
    );
  }

  const merged = proposals.map((p) => {
    const commit = commits[p.id];
    if (!commit) return p;
    return Object.freeze({
      ...p,
      status: commit.status || p.status,
      committedAtMs: commit.committedAtMs || null,
      rejectedAtMs: commit.rejectedAtMs || null,
      founderNote: commit.founderNote || null
    });
  });

  return Object.freeze(merged);
}

export function buildCalibrationGovernorStateV0() {
  const proposals = buildCalibrationGovernorProposalsV0();
  const pending = proposals.filter((p) => p.status === "pending");
  const drift = buildTurnBehavioralDriftReportV0();

  return Object.freeze({
    schema: RHIZOH_CALIBRATION_GOVERNOR_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesAuthority: false,
    influencesExecution: false,
    autoApply: false,
    layerWeightPolicy: SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0,
    systemDefinition:
      "Rhizoh is a closed behavioral OS that measures and constrains its own behavior — not a learning system.",
    pendingCount: pending.length,
    proposals,
    driftSummary: drift.selfExplanation,
    founderOnly: Object.freeze({
      driftSelfExplanation: drift.selfExplanation,
      note: "Founder review only — never concatenate into LLM/system prompt paths."
    })
  });
}

/**
 * Founder manual commit — audit trail only; does NOT mutate execution kernel.
 * @param {string} proposalId
 * @param {{ note?: string }} [opts]
 */
export function commitCalibrationProposalV0(proposalId, opts = {}) {
  const id = String(proposalId || "").trim();
  if (!id) return { ok: false, reason: "missing_proposal_id" };
  const commits = readCommitsV0();
  commits[id] = {
    status: "committed",
    committedAtMs: Date.now(),
    founderNote: opts.note ? String(opts.note) : null,
    autoApplied: false
  };
  writeCommitsV0(commits);
  return Object.freeze({ ok: true, proposalId: id, status: "committed", autoApplied: false });
}

/**
 * @param {string} proposalId
 * @param {{ note?: string }} [opts]
 */
export function rejectCalibrationProposalV0(proposalId, opts = {}) {
  const id = String(proposalId || "").trim();
  if (!id) return { ok: false, reason: "missing_proposal_id" };
  const commits = readCommitsV0();
  commits[id] = {
    status: "rejected",
    rejectedAtMs: Date.now(),
    founderNote: opts.note ? String(opts.note) : null
  };
  writeCommitsV0(commits);
  return Object.freeze({ ok: true, proposalId: id, status: "rejected" });
}

export function publishCalibrationGovernorV0() {
  const state = buildCalibrationGovernorStateV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.calibrationGovernor = state;
    window.__rhizoh.commitCalibrationProposalV0 = commitCalibrationProposalV0;
    window.__rhizoh.rejectCalibrationProposalV0 = rejectCalibrationProposalV0;
  }
  return state;
}
