/**
 * Voice operating mode — precision vs continuity vs alert recall-first.
 * Companion (default): continuity-first, presence ack never terminal alone.
 * Normal: higher precision filters.
 * Alert: auto-triggered on distress lexicon — recall over precision.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_VOICE_OPERATING_MODE_SCHEMA_V0 = "rhizoh.voice_operating_mode.v0";

export const VOICE_OPERATING_MODE_V0 = Object.freeze({
  COMPANION: "companion",
  NORMAL: "normal",
  ALERT: "alert"
});

/** Distress / help lexicon — fuzzy match, partial STT OK. */
const ALERT_RECALL_PATTERNS_V0 = [
  { re: /\b(yard[iı]m|yard\.{0,3}|imdat|imd\.{0,3})\b/i, label: "help_tr", weight: 0.88 },
  { re: /\b(acil|ambulans|yang[iı]n|deprem|kurtar)\b/i, label: "emergency_tr", weight: 0.86 },
  { re: /\b(d[uü]şt[uü]m|d[uü]s\.{0,3}|can[iı]m\s+yan[iı]yor|nefes\s+alam)\b/i, label: "distress_tr", weight: 0.9 },
  { re: /\b(help|emergency|mayday|fire|ambulance)\b/i, label: "help_en", weight: 0.86 },
  { re: /\b(i'?m\s+hurt|can'?t\s+breathe|call\s+911)\b/i, label: "distress_en", weight: 0.88 }
];

/**
 * @returns {string}
 */
export function readVoiceOperatingModeV0() {
  const raw = String(import.meta.env?.VITE_RHIZOH_VOICE_OPERATING_MODE || "companion")
    .trim()
    .toLowerCase();
  if (raw === "normal" || raw === "precision") return VOICE_OPERATING_MODE_V0.NORMAL;
  return VOICE_OPERATING_MODE_V0.COMPANION;
}

export function isCompanionContinuityFirstV0() {
  return readVoiceOperatingModeV0() === VOICE_OPERATING_MODE_V0.COMPANION;
}

/**
 * @param {string} text
 */
export function detectAlertRecallSignalV0(text) {
  const norm = String(text || "").trim();
  if (norm.length < 3) return Object.freeze({ alert: false, score: 0, label: null });
  let best = null;
  for (const pat of ALERT_RECALL_PATTERNS_V0) {
    if (pat.re.test(norm)) {
      if (!best || pat.weight > best.weight) {
        best = { label: pat.label, weight: pat.weight };
      }
    }
  }
  if (!best) return Object.freeze({ alert: false, score: 0, label: null });
  return Object.freeze({ alert: true, score: best.weight, label: best.label });
}

/**
 * @param {string} text
 */
export function resolveEffectiveOperatingModeV0(text) {
  if (detectAlertRecallSignalV0(text).alert) return VOICE_OPERATING_MODE_V0.ALERT;
  return readVoiceOperatingModeV0();
}

/**
 * Alert path: accept turn for execution even when sanity would hold.
 * @param {object} meta
 */
export function evaluateAlertRecallRescueV0(meta = {}) {
  const text = String(meta.text || "").trim();
  const sig = detectAlertRecallSignalV0(text);
  if (!sig.alert) {
    return Object.freeze({ recallFirst: false, operatingMode: resolveEffectiveOperatingModeV0(text) });
  }
  logVoiceInfoV0("VOICE_ALERT_RECALL_FIRST", {
    label: sig.label,
    score: sig.score,
    preview: text.slice(0, 96),
    source: meta.source || "mic"
  });
  return Object.freeze({
    recallFirst: true,
    operatingMode: VOICE_OPERATING_MODE_V0.ALERT,
    label: sig.label,
    score: sig.score
  });
}

export function publishVoiceOperatingModeSnapshotV0(detail = {}) {
  if (typeof window === "undefined") return null;
  const snap = Object.freeze({
    schema: RHIZOH_VOICE_OPERATING_MODE_SCHEMA_V0,
    configured: readVoiceOperatingModeV0(),
    companionContinuityFirst: isCompanionContinuityFirstV0(),
    atMs: Date.now(),
    ...detail
  });
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.voiceOperatingMode = snap;
  return snap;
}
