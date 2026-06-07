/**
 * Transcript acceptance ledger — full STT→filter decision forensics.
 * Answers "what was rejected?" not just "why rejected?".
 * Observation-only; never blocks execution.
 */

import { scoreSttTemplateLeakV0, evaluateSttContaminationV0 } from "./voiceSttContaminationGuardV0.js";
import { classifyVoiceFastIntentV0 } from "./rhizohVoiceDualPathRouterV0.js";
import { hasMeaningfulSpeechSignalV0 } from "./rhizohVoiceGrayZoneVerifyV0.js";

export const RHIZOH_TRANSCRIPT_ACCEPTANCE_LEDGER_SCHEMA_V0 =
  "rhizoh.transcript_acceptance_ledger.v0";

const RING_MAX_V0 = 20;
const TRANSCRIPT_MAX_V0 = 512;

/** @type {{ accepted: number, rejected: number, deferred: number, suspectedFalseNegatives: number, reasonCounts: Record<string, number>, ring: object[] }} */
const ledgerStateV0 = {
  accepted: 0,
  rejected: 0,
  deferred: 0,
  suspectedFalseNegatives: 0,
  reasonCounts: {},
  ring: []
};

function bumpReasonV0(reason) {
  const key = String(reason || "unknown").trim() || "unknown";
  ledgerStateV0.reasonCounts[key] = (ledgerStateV0.reasonCounts[key] || 0) + 1;
}

function pushRingV0(row) {
  ledgerStateV0.ring = [...ledgerStateV0.ring.slice(-(RING_MAX_V0 - 1)), Object.freeze(row)];
}

function publishWindowV0() {
  if (typeof window === "undefined") return;
  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.transcriptAcceptance = getTranscriptAcceptanceSnapshotV0();
  } catch {
    /* noop */
  }
}

function numOrUndefV0(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function wordCountV0(text) {
  const t = String(text || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

/**
 * Compute filter forensics at record time — captures what acceptance layer saw.
 * @param {string} text
 * @param {{ confidence?: number, band?: string, strategy?: string, maxRms?: number, decision?: object }} ctx
 */
export function buildTranscriptFilterForensicsV0(text, ctx = {}) {
  const transcript = String(text || "").trim();
  const confidence = numOrUndefV0(ctx.confidence);
  const band = ctx.band ? String(ctx.band) : undefined;
  const strategy = ctx.strategy ? String(ctx.strategy) : undefined;
  const maxRms = numOrUndefV0(ctx.maxRms);
  const fast = classifyVoiceFastIntentV0(transcript);
  const meaningful = hasMeaningfulSpeechSignalV0(transcript, { fastIntent: fast.intent });
  const contamination = evaluateSttContaminationV0(transcript, { confidence, band, strategy });
  const templateScores = scoreSttTemplateLeakV0(transcript, { confidence, band, strategy });
  const decision = ctx.decision || null;

  return Object.freeze({
    fastIntent: fast.intent,
    meaningful,
    wordCount: wordCountV0(transcript),
    contamination: contamination.contaminated
      ? Object.freeze({
          kind: contamination.kind,
          reason: contamination.reason,
          shadowOnly: contamination.shadowOnly === true
        })
      : null,
    templateScore: templateScores.templateScore,
    uiLeak: templateScores.uiLeak,
    subtitleLeak: templateScores.subtitleLeak,
    speakMode: decision?.speakMode ?? undefined,
    execMode: decision?.execMode ?? undefined,
    confidenceTier: decision?.confidenceTier ?? undefined,
    dropKind: decision?.dropKind ?? undefined,
    verifyCount: decision?.verifyCount ?? undefined,
    maxRms,
    recordedMs: numOrUndefV0(ctx.recordedMs),
    bytes: numOrUndefV0(ctx.bytes)
  });
}

/**
 * Heuristic — flags possible filter overreach for human review (not authoritative).
 * @param {string} outcome
 * @param {string} reason
 * @param {object} forensics
 */
export function assessSuspectedFalseNegativeV0(outcome, reason, forensics = {}) {
  if (outcome !== "rejected") return false;
  const r = String(reason || "");
  const conf = numOrUndefV0(forensics.confidence);
  const rms = numOrUndefV0(forensics.maxRms);
  const templateScore = numOrUndefV0(forensics.templateScore) ?? 0;
  const meaningful = forensics.meaningful === true;
  const wordCount = Number(forensics.wordCount) || 0;

  if (meaningful && wordCount >= 3 && ["fast_noise_drop", "hard_drop_noise"].includes(r)) {
    return true;
  }
  if (conf != null && conf >= 0.55 && wordCount >= 2 && r === "fast_noise_drop") {
    return true;
  }
  if (rms != null && rms >= 0.04 && templateScore < 0.5 && r === "ui_chrome_echo") {
    return true;
  }
  if (templateScore < 0.45 && ["ui_chrome_echo", "platform_template_leak"].includes(r)) {
    return true;
  }
  return false;
}

/**
 * @param {{
 *   outcome: 'accepted'|'rejected'|'deferred',
 *   text?: string,
 *   reason?: string,
 *   source?: string,
 *   sessionId?: string,
 *   confidence?: number,
 *   band?: string,
 *   strategy?: string,
 *   pipelinePath?: string,
 *   maxRms?: number,
 *   recordedMs?: number,
 *   bytes?: number,
 *   decision?: object,
 *   quarantineId?: string,
 *   turnBound?: boolean
 * }} opts
 */
function buildLedgerRowV0(opts) {
  const transcript = String(opts.text || "").slice(0, TRANSCRIPT_MAX_V0);
  const reason = String(opts.reason || opts.outcome).trim() || opts.outcome;
  const confidence = numOrUndefV0(opts.confidence);
  const forensics = buildTranscriptFilterForensicsV0(transcript, {
    confidence,
    band: opts.band,
    strategy: opts.strategy,
    maxRms: opts.maxRms,
    recordedMs: opts.recordedMs,
    bytes: opts.bytes,
    decision: opts.decision
  });
  const suspectedFalseNegative = assessSuspectedFalseNegativeV0(opts.outcome, reason, {
    ...forensics,
    confidence
  });

  return Object.freeze({
    schema: RHIZOH_TRANSCRIPT_ACCEPTANCE_LEDGER_SCHEMA_V0,
    outcome: opts.outcome,
    accepted: opts.outcome === "accepted",
    atMs: Date.now(),
    rejectionReason: opts.outcome === "rejected" ? reason : undefined,
    reason,
    transcript,
    preview: transcript.slice(0, 96),
    confidence,
    maxRms: forensics.maxRms,
    band: opts.band ? String(opts.band) : undefined,
    strategy: opts.strategy ? String(opts.strategy) : undefined,
    pipelinePath: opts.pipelinePath ? String(opts.pipelinePath) : undefined,
    source: opts.source ? String(opts.source) : undefined,
    sessionId: opts.sessionId ? String(opts.sessionId) : undefined,
    quarantineId: opts.quarantineId ? String(opts.quarantineId) : undefined,
    turnBound: opts.turnBound === true,
    suspectedFalseNegative,
    filter: forensics
  });
}

/**
 * @param {object} opts
 */
export function recordTranscriptRejectedV0(opts = {}) {
  ledgerStateV0.rejected += 1;
  const reason = String(opts.reason || "rejected").trim() || "rejected";
  bumpReasonV0(reason);
  const row = buildLedgerRowV0({ ...opts, outcome: "rejected", reason });
  if (row.suspectedFalseNegative) ledgerStateV0.suspectedFalseNegatives += 1;
  pushRingV0(row);
  publishWindowV0();
  return row;
}

/**
 * @param {object} opts
 */
export function recordTranscriptAcceptedV0(opts = {}) {
  ledgerStateV0.accepted += 1;
  const row = buildLedgerRowV0({
    ...opts,
    outcome: "accepted",
    reason: "accepted_transcript"
  });
  pushRingV0(row);
  publishWindowV0();
  return row;
}

/**
 * @param {object} opts
 */
export function recordTranscriptDeferredV0(opts = {}) {
  ledgerStateV0.deferred += 1;
  const reason = String(opts.reason || "hold").trim() || "hold";
  bumpReasonV0(reason);
  const row = buildLedgerRowV0({ ...opts, outcome: "deferred", reason });
  pushRingV0(row);
  publishWindowV0();
  return row;
}

/**
 * Build ledger context from V3 orchestrator result.
 * @param {object} result
 * @param {string} sessionId
 */
export function buildV3TranscriptLedgerContextV0(result = {}, sessionId = "") {
  const merged = result.merged || {};
  const decision = result.decision || null;
  return Object.freeze({
    text: merged.text,
    confidence: merged.confidence,
    strategy: merged.strategy,
    maxRms: result.maxRms,
    recordedMs: result.recordedMs,
    bytes: result.bytes,
    band: result.bandObs?.band,
    decision,
    quarantineId: result.quarantineId,
    sessionId,
    source: "mic_v3",
    pipelinePath: result.fastPath ? "fast" : result.preSttDrop ? "pre_stt" : "shadow",
    reason: String(result.error || decision?.reason || "shadow_drop")
  });
}

export function getTranscriptAcceptanceSnapshotV0() {
  const total = ledgerStateV0.accepted + ledgerStateV0.rejected + ledgerStateV0.deferred;
  const reasons = Object.entries(ledgerStateV0.reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => Object.freeze({ reason, count }));

  const rejections = ledgerStateV0.ring.filter((r) => r.outcome === "rejected");
  const lastRejection = rejections.length ? rejections[rejections.length - 1] : null;

  return Object.freeze({
    schema: RHIZOH_TRANSCRIPT_ACCEPTANCE_LEDGER_SCHEMA_V0,
    accepted: ledgerStateV0.accepted,
    rejected: ledgerStateV0.rejected,
    deferred: ledgerStateV0.deferred,
    total,
    acceptRate: total > 0 ? Number((ledgerStateV0.accepted / total).toFixed(3)) : null,
    rejectRate: total > 0 ? Number((ledgerStateV0.rejected / total).toFixed(3)) : null,
    suspectedFalseNegatives: ledgerStateV0.suspectedFalseNegatives,
    rejectionReasons: Object.freeze(reasons),
    last: ledgerStateV0.ring.length ? ledgerStateV0.ring[ledgerStateV0.ring.length - 1] : null,
    lastRejection,
    tail: Object.freeze(ledgerStateV0.ring.slice(-RING_MAX_V0)),
    turnGap: ledgerStateV0.rejected + ledgerStateV0.deferred > 0 && ledgerStateV0.accepted === 0,
    filterArchitectureNote:
      "STT→quarantine→shadow_drop→governance→acceptance→turn; log shows post-filter transcript + forensics"
  });
}

export function __resetTranscriptAcceptanceLedgerForTestV0() {
  ledgerStateV0.accepted = 0;
  ledgerStateV0.rejected = 0;
  ledgerStateV0.deferred = 0;
  ledgerStateV0.suspectedFalseNegatives = 0;
  ledgerStateV0.reasonCounts = {};
  ledgerStateV0.ring = [];
  publishWindowV0();
}
