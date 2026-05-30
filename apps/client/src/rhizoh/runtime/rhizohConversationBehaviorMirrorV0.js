/**
 * Conversation behavior mirror v0 — observational phase only (no learning, no weight updates).
 * Aggregates: language heatmap, silence vs speak log, ack→reply latency histogram, companion tone drift.
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_CONVERSATION_MIRROR_SCHEMA_V0 = "castle.rhizoh.conversation_behavior_mirror.v0";

const STORAGE_KEY_V0 = "castle.rhizoh.conversation_mirror_ring.v0";
const MAX_RING = 120;
const MAX_SPEAK_LOG = 48;
const LATENCY_BUCKETS_MS_V0 = Object.freeze([
  { id: "0_100", min: 0, max: 100 },
  { id: "100_200", min: 100, max: 200 },
  { id: "200_400", min: 200, max: 400 },
  { id: "400_800", min: 400, max: 800 },
  { id: "800_2000", min: 800, max: 2000 },
  { id: "2000_plus", min: 2000, max: Infinity }
]);

const LANG_KEYS_V0 = Object.freeze(["tr", "en", "es", "jp", "other"]);

/** @type {object[]} */
let ringV0 = [];
/** @type {number | null} */
let lastDispatchAtMsV0 = null;
let mirrorInstalledV0 = false;

function ensureMirrorInstalledV0() {
  if (mirrorInstalledV0) return;
  mirrorInstalledV0 = true;
  ringV0 = readRingFromStorageV0();
  publishMirrorSurfaceV0();
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/** @returns {boolean} */
export function isConversationBehaviorMirrorEnabledV0() {
  try {
    if (String(import.meta.env?.VITE_RHIZOH_CONVERSATION_MIRROR || "1") === "0") return false;
    return true;
  } catch {
    return true;
  }
}

function normalizeLangV0(lang) {
  const l = String(lang || "tr").toLowerCase().slice(0, 2);
  return LANG_KEYS_V0.includes(l) ? l : "other";
}

function readRingFromStorageV0() {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function writeRingToStorageV0() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_V0, JSON.stringify(ringV0.slice(-MAX_RING)));
  } catch {
    /* quota */
  }
}

/** @returns {boolean} */
export function isConversationMirrorInspectVisibleV0() {
  try {
    if (String(import.meta.env?.VITE_RHIZOH_CONVERSATION_MIRROR_UI || "") === "1") return true;
    if (import.meta.env?.DEV) return true;
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      if (q.get("mirror") === "1" || q.get("conversation_mirror") === "1") return true;
    }
  } catch {
    /* noop */
  }
  return false;
}

function pushEventV0(evt) {
  if (!isConversationBehaviorMirrorEnabledV0()) return;
  ensureMirrorInstalledV0();
  const row = Object.freeze({
    atMs: Date.now(),
    ...evt
  });
  ringV0 = [...ringV0, row].slice(-MAX_RING);
  writeRingToStorageV0();
  publishMirrorSurfaceV0();
}

function latencyBucketIdV0(ms) {
  const n = Math.max(0, Number(ms) || 0);
  for (const b of LATENCY_BUCKETS_MS_V0) {
    if (n >= b.min && n < b.max) return b.id;
  }
  return "2000_plus";
}

function emptyLangCellV0() {
  return Object.freeze({
    turns: 0,
    fastPath: 0,
    fullPipeline: 0,
    voiceTurns: 0,
    textTurns: 0
  });
}

function buildLanguageHeatmapV0(events) {
  const cells = Object.fromEntries(LANG_KEYS_V0.map((k) => [k, { ...emptyLangCellV0() }]));
  for (const e of events) {
    if (e.kind !== "turn") continue;
    const lang = normalizeLangV0(e.language);
    const c = { ...cells[lang] };
    c.turns += 1;
    if (e.fastPath) c.fastPath += 1;
    if (e.routeId === "full_pipeline") c.fullPipeline += 1;
    if (e.channel === "voice") c.voiceTurns += 1;
    if (e.channel === "text") c.textTurns += 1;
    cells[lang] = Object.freeze(c);
  }
  return Object.freeze(cells);
}

function buildSpeakSilenceLogV0(events) {
  return Object.freeze(
    events
      .filter((e) => e.kind === "voice_route")
      .slice(-MAX_SPEAK_LOG)
      .map((e) =>
        Object.freeze({
          atMs: e.atMs,
          decision: e.executionAccepted ? "speak" : "silence",
          reason: e.reason || null,
          rejectionLayer: e.rejectionLayer || null,
          preview: e.preview ? String(e.preview).slice(0, 64) : null
        })
      )
  );
}

function buildAckReplyHistogramV0(events) {
  const counts = Object.fromEntries(LATENCY_BUCKETS_MS_V0.map((b) => [b.id, 0]));
  const samples = [];
  for (const e of events) {
    if (e.kind !== "glue_handoff" && e.kind !== "llm_complete") continue;
    const ms = e.ackToReplyMs ?? e.llmWaitMs;
    if (!Number.isFinite(ms)) continue;
    samples.push(ms);
    const id = latencyBucketIdV0(ms);
    counts[id] = (counts[id] || 0) + 1;
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const p50 = sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : null;
  const p90 = sorted.length ? sorted[Math.floor(sorted.length * 0.9)] : null;
  return Object.freeze({
    buckets: Object.freeze(counts),
    sampleCount: samples.length,
    p50Ms: p50,
    p90Ms: p90,
    lastMs: samples.length ? samples[samples.length - 1] : null
  });
}

function buildCompanionToneDriftV0(events) {
  const turns = events.filter((e) => e.kind === "turn" && e.relationalTone);
  if (turns.length < 2) {
    return Object.freeze({
      sampleCount: turns.length,
      driftIndex01: 0,
      warmthDelta01: 0,
      toneChanges: 0,
      firstTone: turns[0]?.relationalTone || null,
      lastTone: turns[turns.length - 1]?.relationalTone || null
    });
  }
  const first = turns[0];
  const last = turns[turns.length - 1];
  const warmthDelta01 = Math.abs(clamp01(last.warmth01) - clamp01(first.warmth01));
  let toneChanges = 0;
  for (let i = 1; i < turns.length; i += 1) {
    if (turns[i].relationalTone !== turns[i - 1].relationalTone) toneChanges += 1;
  }
  const driftIndex01 = clamp01(warmthDelta01 * 0.55 + Math.min(1, toneChanges / 4) * 0.45);
  return Object.freeze({
    sampleCount: turns.length,
    driftIndex01,
    warmthDelta01,
    toneChanges,
    firstTone: first.relationalTone,
    lastTone: last.relationalTone,
    warmthFirst01: clamp01(first.warmth01),
    warmthLast01: clamp01(last.warmth01)
  });
}

/**
 * @returns {ReturnType<typeof buildConversationBehaviorMirrorSnapshotV0>}
 */
export function buildConversationBehaviorMirrorSnapshotV0() {
  const events = ringV0.length ? ringV0 : readRingFromStorageV0();
  return Object.freeze({
    schema: RHIZOH_CONVERSATION_MIRROR_SCHEMA_V0,
    atMs: Date.now(),
    eventCount: events.length,
    languageHeatmap: buildLanguageHeatmapV0(events),
    speakSilenceLog: buildSpeakSilenceLogV0(events),
    ackReplyLatency: buildAckReplyHistogramV0(events),
    companionToneDrift: buildCompanionToneDriftV0(events),
    note: "MEASUREMENT_ONLY_NOT_LEARNING"
  });
}

function publishMirrorSurfaceV0() {
  const snap = buildConversationBehaviorMirrorSnapshotV0();
  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_CONVERSATION_MIRROR_SNAP__ = snap;
    window.__CASTLE_RHIZOH_CONVERSATION_MIRROR__ = () => buildConversationBehaviorMirrorSnapshotV0();
  }
  return snap;
}

export function installConversationBehaviorMirrorV0() {
  if (!isConversationBehaviorMirrorEnabledV0()) return;
  ensureMirrorInstalledV0();
  logCastleLifecycleV0("conversation_mirror_install", { eventCount: ringV0.length });
}

export function resetConversationBehaviorMirrorForTestV0() {
  ringV0 = [];
  lastDispatchAtMsV0 = null;
  mirrorInstalledV0 = false;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY_V0);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    delete window.__CASTLE_RHIZOH_CONVERSATION_MIRROR__;
  }
}

/** Marks LLM/voice dispatch start for ack→reply measurement. */
export function markConversationMirrorDispatchV0(atMs = Date.now()) {
  lastDispatchAtMsV0 = Number(atMs) || Date.now();
}

/**
 * @param {{
 *   traceId?: string,
 *   language?: string,
 *   routeId?: string,
 *   fastPath?: boolean,
 *   channel?: "voice" | "text",
 *   hotPathMs?: number,
 *   relationalTone?: string,
 *   warmth01?: number,
 *   presenceMode?: string
 * }} input
 */
export function recordConversationMirrorTurnV0(input = {}) {
  pushEventV0({
    kind: "turn",
    traceId: input.traceId || null,
    language: normalizeLangV0(input.language),
    routeId: input.routeId || null,
    fastPath: input.fastPath === true,
    channel: input.channel || "text",
    hotPathMs: Number.isFinite(input.hotPathMs) ? input.hotPathMs : null,
    relationalTone: input.relationalTone || null,
    warmth01: clamp01(input.warmth01),
    presenceMode: input.presenceMode || null
  });
}

/**
 * @param {{
 *   executionAccepted?: boolean,
 *   reason?: string,
 *   rejectionLayer?: string,
 *   preview?: string,
 *   source?: string
 * }} route
 */
export function recordConversationMirrorVoiceRouteV0(route = {}) {
  pushEventV0({
    kind: "voice_route",
    executionAccepted: route.executionAccepted === true,
    reason: route.reason || null,
    rejectionLayer: route.rejectionLayer || null,
    preview: route.preview || null,
    source: route.source || null
  });
}

/**
 * @param {{ bridgeGapMs?: number, llmWaitMs?: number, handoffMode?: string }} glue
 */
export function recordConversationMirrorGlueV0(glue = {}) {
  const t0 = lastDispatchAtMsV0;
  const ackToReplyMs = t0 != null ? Math.max(0, Date.now() - t0) : null;
  pushEventV0({
    kind: "glue_handoff",
    bridgeGapMs: glue.bridgeGapMs ?? null,
    llmWaitMs: glue.llmWaitMs ?? null,
    ackToReplyMs,
    handoffMode: glue.handoffMode || null
  });
}

/**
 * @param {{ llmWaitMs?: number, ok?: boolean }} input
 */
export function recordConversationMirrorLlmCompleteV0(input = {}) {
  const t0 = lastDispatchAtMsV0;
  const ackToReplyMs = t0 != null ? Math.max(0, Date.now() - t0) : null;
  pushEventV0({
    kind: "llm_complete",
    llmWaitMs: input.llmWaitMs ?? null,
    ackToReplyMs,
    ok: input.ok !== false
  });
}

/**
 * @param {{ firstSpeechMs?: number, phraseKind?: string }} input
 */
export function recordConversationMirrorFirstSpeechV0(input = {}) {
  pushEventV0({
    kind: "first_speech",
    firstSpeechMs: input.firstSpeechMs ?? null,
    phraseKind: input.phraseKind || "instant_ack"
  });
}
