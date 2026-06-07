/**
 * Turn Sovereignty v0 — temporal ontology engine (log-only default).
 * Single reality per turn; advisory modules shadowed after lock.
 * @see apps/client/docs/RHIZOH_BEHAVIORAL_TURN_SOVEREIGNTY_V0.md
 */

import { RHIZOH_INTENT } from "../router/intentTypes.js";
import { CMD_EXEC_DECISION_V0 } from "./rhizohCommandExecutionTraceV0.js";
import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  readTurnSovereigntyEnforcementModeV0,
  TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0
} from "./turnSovereigntyEnforcementModeV0.js";
import { publishTurnBehaviorConsistencyFieldV0 } from "./turnBehaviorConsistencyFieldV0.js";
import { publishTurnBehavioralDriftReportV0 } from "./turnBehavioralDriftEngineV0.js";
import { assertObservationDoesNotInfluenceAuthorityV0 } from "./turnSovereigntyObservationExecutionInvariantV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { VOICE_CONVERSATION_AUTHORITY_PATH_V0 } from "./rhizohVoiceConversationAuthorityV0.js";

export const TURN_SOVEREIGNTY_SCHEMA_V0 = "castle.rhizoh.turn_sovereignty.v0";

export const SOVEREIGN_REALITY_V0 = Object.freeze({
  PRESENCE_ACK: "presence_ack",
  FAST_REFLEX: "fast_reflex",
  COMMAND_EXECUTE: "command_execute",
  LLM_CONVERSATION: "llm_conversation",
  SILENT_OBSERVE: "silent_observe"
});

export const SOVEREIGNTY_OUTPUT_CHANNEL_V0 = Object.freeze({
  TTS: "tts",
  TEXT: "text",
  NONE: "none"
});

export const SOVEREIGNTY_VIOLATION_V0 = Object.freeze({
  SHADOW_LEAK: "SHADOW_LEAK",
  POST_LOCK_MUTATION: "POST_LOCK_MUTATION",
  LLM_BYPASS_LEAK: "LLM_BYPASS_LEAK",
  ACK_LLM_ECHO: "ACK_LLM_ECHO",
  ARBITRATION_OVERRIDE: "ARBITRATION_OVERRIDE"
});

export const DIRECTED_PATTERN_V0 = Object.freeze({
  WAKE: "wake",
  PRESENCE_CHECK: "presence_check",
  ADDRESS: "address"
});

const WAKE_PATTERNS_V0 = [
  /^(rhizoh|rizo|riza|rizoh)\b/i,
  /^dostum\b/i,
  /^hey\s+(rhizoh|rizo)\b/i
];

const PRESENCE_PATTERNS_V0 = [
  /beni\s+duy/i,
  /duyabiliyor\s+musun/i,
  /can\s+you\s+hear\s+me/i,
  /are\s+you\s+there/i,
  /burada\s+mısın/i
];

const TASK_VERB_PATTERNS_V0 = [
  /\b(aç|götür|goster|göster|open|show|zoom|fly|harita|map)\b/i,
  /\b(yardım\s+et|help\s+me|fix|düzelt)\b/i
];

const TRACE_RING_MAX_V0 = 64;

/** @type {object[]} */
const traceRingV0 = [];

/** @type {Record<string, number>} */
const conflictHeatmapV0 = {};

/** @type {object | null} */
let lastLockV0 = null;

/** @type {Map<string, object>} */
const lockByTurnIdV0 = new Map();

function readEnforcementFlagV0() {
  const mode = readTurnSovereigntyEnforcementModeV0();
  return (
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.PARTIAL ||
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.FULL
  );
}

export function getTurnSovereigntyLockByIdV0(turnId) {
  const id = String(turnId || "").trim();
  if (!id) return null;
  return lockByTurnIdV0.get(id) || null;
}

/**
 * @param {string} text
 */
function normalizeInputTextV0(text) {
  return String(text || "")
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function classifyDirectedPatternsV0(text) {
  const norm = normalizeInputTextV0(text);
  if (!norm) return [];
  /** @type {string[]} */
  const out = [];
  for (const re of WAKE_PATTERNS_V0) {
    if (re.test(norm)) {
      out.push(DIRECTED_PATTERN_V0.WAKE);
      break;
    }
  }
  for (const re of PRESENCE_PATTERNS_V0) {
    if (re.test(norm)) {
      out.push(DIRECTED_PATTERN_V0.PRESENCE_CHECK);
      break;
    }
  }
  if (/\b(rhizoh|rizo|riza)\b/i.test(norm) && !out.includes(DIRECTED_PATTERN_V0.WAKE)) {
    out.push(DIRECTED_PATTERN_V0.ADDRESS);
  }
  return [...new Set(out)];
}

/**
 * @param {string} text
 * @param {string[]} directedPatterns
 */
/**
 * No-Lock Escape Rule — avoid authority starvation (silent_observe on substantive input).
 * @param {object} params
 */
export function isNoLockEscapeEligibleV0(params = {}) {
  const text = String(params.text || "").trim();
  if (text.length < 3) return false;
  const router = params.router && typeof params.router === "object" ? params.router : {};
  if (router.intent === RHIZOH_INTENT.SILENCE || router.silenceMode === true) return false;
  if (params.runtime?.gatewayMaintenance === true) return false;
  const band = String(params.voice?.band || "");
  if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) return false;
  const directed =
    Array.isArray(params.directedPatterns) && params.directedPatterns.length
      ? params.directedPatterns
      : classifyDirectedPatternsV0(text);
  if (directed.length > 0) return true;
  if (params.modality === "text") return true;
  if (text.length >= 12) return true;
  if (Number(router.confidence) >= 0.42) return true;
  if (router.intent && router.intent !== RHIZOH_INTENT.CHAT) return true;
  return false;
}

export function isMixedSubstantiveQueryV0(text, directedPatterns = []) {
  const norm = normalizeInputTextV0(text);
  if (norm.length <= 48) return false;
  const hasPresence =
    directedPatterns.includes(DIRECTED_PATTERN_V0.PRESENCE_CHECK) ||
    directedPatterns.includes(DIRECTED_PATTERN_V0.WAKE) ||
    directedPatterns.includes(DIRECTED_PATTERN_V0.ADDRESS);
  if (!hasPresence) return false;
  return TASK_VERB_PATTERNS_V0.some((re) => re.test(norm));
}

/**
 * @param {object} input
 */
function buildCubeFoxInfluenceV0(input) {
  const raw = input?.candidates?.cubeFox;
  if (!raw || typeof raw !== "object") {
    return Object.freeze({
      observerSpecies: null,
      attentionWeights: Object.freeze({ branching: 0, spike: 0, spiral: 0, stretch: 0, scanSpeed: 0 }),
      realityBias: Object.freeze({
        presence_ack: 0,
        fast_reflex: 0,
        llm_conversation: 0,
        silent_observe: 0
      }),
      authoritative: false
    });
  }
  return Object.freeze({
    observerSpecies: raw.observerSpecies ?? null,
    attentionWeights: Object.freeze({ ...(raw.attentionWeights || {}) }),
    realityBias: Object.freeze({
      presence_ack: Number(raw.realityBias?.presence_ack) || 0,
      fast_reflex: Number(raw.realityBias?.fast_reflex) || 0,
      llm_conversation: Number(raw.realityBias?.llm_conversation) || 0,
      silent_observe: Number(raw.realityBias?.silent_observe) || 0
    }),
    authoritative: false
  });
}

/**
 * Sub-reality: tone/micro-variation within single sovereign reality (not a second reality).
 * @param {object} params
 */
function resolveSubRealityV0(params) {
  const router = params.router || {};
  const depth = params.depth || {};
  const sovereignReality = params.sovereignReality;
  const locale = params.locale || "tr";

  let emotionalTone = String(router.emotionalSignal || "NEUTRAL").toLowerCase();
  if (sovereignReality === SOVEREIGN_REALITY_V0.PRESENCE_ACK) {
    emotionalTone = emotionalTone === "alert" ? "steady" : emotionalTone || "warm";
  }
  if (sovereignReality === SOVEREIGN_REALITY_V0.SILENT_OBSERVE) {
    emotionalTone = "contemplative";
  }
  if (router.intent === RHIZOH_INTENT.CRISIS) {
    emotionalTone = "alert";
  }

  const microVariation =
    sovereignReality === SOVEREIGN_REALITY_V0.PRESENCE_ACK
      ? "presence_pool"
      : sovereignReality === SOVEREIGN_REALITY_V0.FAST_REFLEX
        ? "reflex_pool"
        : sovereignReality === SOVEREIGN_REALITY_V0.LLM_CONVERSATION
          ? depth.conversationMode
            ? `depth_${depth.conversationMode}`
            : "depth_default"
          : "none";

  const phraseHints =
    sovereignReality === SOVEREIGN_REALITY_V0.PRESENCE_ACK
      ? locale === "tr"
        ? ["Buradayım.", "Evet, buradayım.", "Seni duyuyorum."]
        : ["I'm here.", "Yes, I'm here.", "I hear you."]
      : [];

  const phraseVariant =
    phraseHints.length > 0
      ? phraseHints[Math.abs(hashStringV0(params.turnId || "t")) % phraseHints.length]
      : null;

  return Object.freeze({
    emotionalTone,
    microVariation,
    phraseVariant,
    allowsPoolRotation: sovereignReality !== SOVEREIGN_REALITY_V0.COMMAND_EXECUTE
  });
}

/** @param {string} s */
function hashStringV0(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/**
 * @param {{ reality: string, step: number, reason: string, score: number }[]} candidates
 * @param {string} winner
 */
function recordConflictHeatmapV0(candidates, winner) {
  const rivals = candidates.filter((c) => c.reality !== winner && c.score >= 0.45);
  for (const r of rivals) {
    const key = [winner, r.reality].sort().join("+");
    conflictHeatmapV0[key] = (conflictHeatmapV0[key] || 0) + 1;
  }
}

/**
 * @param {object} input — TurnSovereigntyInputV0 envelope (see spec)
 */
export function resolveTurnSovereigntyV0(input = {}) {
  input = assertObservationDoesNotInfluenceAuthorityV0(input, "resolveTurnSovereigntyV0");
  const turnId = String(input.turnId || `turn_${Date.now()}`);
  const atMs = Number(input.atMs) || Date.now();
  const text = String(input.input?.text || "").trim();
  const modality = String(input.input?.modality || "text");
  const locale = String(input.input?.locale || "tr");

  const router = input.candidates?.router && typeof input.candidates.router === "object" ? input.candidates.router : {};
  const depth = input.candidates?.depth && typeof input.candidates.depth === "object" ? input.candidates.depth : {};
  const voice = input.candidates?.voice && typeof input.candidates.voice === "object" ? input.candidates.voice : {};
  const command = input.candidates?.command && typeof input.candidates.command === "object" ? input.candidates.command : {};
  const fastReflex = input.candidates?.fastReflex && typeof input.candidates.fastReflex === "object" ? input.candidates.fastReflex : {};
  const instantAck = input.candidates?.instantAck && typeof input.candidates.instantAck === "object" ? input.candidates.instantAck : {};
  const runtime = input.runtime && typeof input.runtime === "object" ? input.runtime : {};

  const directedPatterns =
    Array.isArray(voice.directedPatterns) && voice.directedPatterns.length
      ? voice.directedPatterns
      : classifyDirectedPatternsV0(text);
  const mixedQuery = isMixedSubstantiveQueryV0(text, directedPatterns);
  const cubeFox = buildCubeFoxInfluenceV0(input);

  /** @type {{ reality: string, step: number, reason: string, score: number }[]} */
  const selectionTrace = [];
  /** @type {string[]} */
  const suppressed = [];
  /** @type {string[]} */
  const violations = [];
  /** @type {string[]} */
  const preventions = [];

  let sovereignReality = SOVEREIGN_REALITY_V0.SILENT_OBSERVE;
  let outputChannel = SOVEREIGNTY_OUTPUT_CHANNEL_V0.NONE;
  let selectionReason = "default_shadow";
  /** @type {object | undefined} */
  let sovereignOutput;
  /** @type {object | undefined} */
  let promptScope;

  const pushCandidate = (reality, step, reason, score) => {
    selectionTrace.push({ reality, step, reason, score });
  };

  // STEP 0 — hard blocks
  if (runtime.gatewayMaintenance || router.intent === RHIZOH_INTENT.SILENCE || router.silenceMode === true) {
    pushCandidate(SOVEREIGN_REALITY_V0.SILENT_OBSERVE, 0, "silence_or_maintenance", 1);
    sovereignReality = SOVEREIGN_REALITY_V0.SILENT_OBSERVE;
    selectionReason = runtime.gatewayMaintenance ? "gateway_maintenance" : "silence_mode";
    suppressed.push("llm_conversation", "presence_ack", "instant_ack", "fast_reflex", "depth_directive");
  }
  // STEP 1 — command
  else if (command.matched === true) {
    const decision = String(command.decision || "");
    const silentCmd =
      decision === CMD_EXEC_DECISION_V0.SILENT_EXECUTE ||
      (decision === CMD_EXEC_DECISION_V0.HYBRID && command.silentExecute === true);
    pushCandidate(SOVEREIGN_REALITY_V0.COMMAND_EXECUTE, 1, "command_matched", 0.95);
    if (silentCmd) {
      sovereignReality = SOVEREIGN_REALITY_V0.COMMAND_EXECUTE;
      outputChannel = SOVEREIGNTY_OUTPUT_CHANNEL_V0.NONE;
      selectionReason = "command_silent_execute";
      suppressed.push("llm_conversation", "presence_ack", "instant_ack", "fast_reflex", "arbitration_primary");
    } else if (decision === CMD_EXEC_DECISION_V0.LLM_FALLBACK || decision === CMD_EXEC_DECISION_V0.LLM) {
      pushCandidate(SOVEREIGN_REALITY_V0.LLM_CONVERSATION, 1, "command_llm_fallback", 0.88);
      sovereignReality = SOVEREIGN_REALITY_V0.LLM_CONVERSATION;
      outputChannel = modality === "voice" ? SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS : SOVEREIGNTY_OUTPUT_CHANNEL_V0.TEXT;
      selectionReason = "command_llm_fallback";
      suppressed.push("presence_ack", "instant_ack", "fast_reflex");
      promptScope = buildPromptScopeV0({ depth, router, arbitrationMode: "primary_bound" });
    } else {
      sovereignReality = SOVEREIGN_REALITY_V0.COMMAND_EXECUTE;
      outputChannel = SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS;
      selectionReason = "command_execute";
      suppressed.push("llm_conversation", "instant_ack");
    }
  }
  // STEP 2 — presence / wake (not mixed)
  else if (
    !mixedQuery &&
    (voice.band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE ||
      directedPatterns.includes(DIRECTED_PATTERN_V0.PRESENCE_CHECK) ||
      directedPatterns.includes(DIRECTED_PATTERN_V0.WAKE) ||
      (directedPatterns.includes(DIRECTED_PATTERN_V0.ADDRESS) && text.length <= 32))
  ) {
    pushCandidate(SOVEREIGN_REALITY_V0.PRESENCE_ACK, 2, "directed_presence_or_wake", 0.92);
    pushCandidate(SOVEREIGN_REALITY_V0.LLM_CONVERSATION, 5, "would_default_llm", 0.55);
    sovereignReality = SOVEREIGN_REALITY_V0.PRESENCE_ACK;
    outputChannel = modality === "text" ? SOVEREIGNTY_OUTPUT_CHANNEL_V0.TEXT : SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS;
    selectionReason = directedPatterns.includes(DIRECTED_PATTERN_V0.WAKE) ? "wake_ack" : "presence_check_ack";
    suppressed.push("llm_conversation", "instant_ack", "depth_directive", "arbitration_primary");
    preventions.push(SOVEREIGNTY_VIOLATION_V0.ACK_LLM_ECHO);
  }
  // STEP 3 — fast reflex
  else if (fastReflex.eligible === true && voice.authority?.path === VOICE_CONVERSATION_AUTHORITY_PATH_V0.FAST_REFLEX) {
    pushCandidate(SOVEREIGN_REALITY_V0.FAST_REFLEX, 3, "fast_reflex_path", 0.9);
    sovereignReality = SOVEREIGN_REALITY_V0.FAST_REFLEX;
    outputChannel = modality === "voice" ? SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS : SOVEREIGNTY_OUTPUT_CHANNEL_V0.TEXT;
    selectionReason = "fast_reflex";
    suppressed.push("llm_conversation", "instant_ack");
    sovereignOutput = Object.freeze({
      text: String(fastReflex.reply || "").trim(),
      locale,
      source: "fast_reflex"
    });
  }
  // STEP 4 — crisis
  else if (router.intent === RHIZOH_INTENT.CRISIS && Number(router.confidence) >= 0.55) {
    pushCandidate(SOVEREIGN_REALITY_V0.LLM_CONVERSATION, 4, "crisis_intent", 0.93);
    sovereignReality = SOVEREIGN_REALITY_V0.LLM_CONVERSATION;
    outputChannel = modality === "voice" ? SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS : SOVEREIGNTY_OUTPUT_CHANNEL_V0.TEXT;
    selectionReason = "crisis_llm";
    suppressed.push("presence_ack", "instant_ack", "fast_reflex");
    promptScope = buildPromptScopeV0({
      depth: { ...depth, conversationMode: depth.conversationMode || "debate" },
      router,
      arbitrationMode: "primary_bound",
      maxTokensCeiling: depth.maxTokensCeiling || 1200
    });
  }
  // STEP 5 — default LLM execution
  else if (
    modality === "text" ||
    voice.authority?.maySpeak === true ||
    voice.commitment?.behaviorEligible !== false
  ) {
    pushCandidate(SOVEREIGN_REALITY_V0.LLM_CONVERSATION, 5, "default_execution", 0.8);
    if (mixedQuery) {
      pushCandidate(SOVEREIGN_REALITY_V0.PRESENCE_ACK, 2, "mixed_would_presence", 0.7);
      selectionReason = "mixed_intent_llm_single_reply";
    } else {
      selectionReason = "llm_conversation";
    }
    sovereignReality = SOVEREIGN_REALITY_V0.LLM_CONVERSATION;
    outputChannel = modality === "voice" ? SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS : SOVEREIGNTY_OUTPUT_CHANNEL_V0.TEXT;
    suppressed.push("presence_ack");
    if (runtime.strictVoiceIngest === true) {
      suppressed.push("instant_ack");
    } else if (instantAck.eligible === true) {
      suppressed.push("instant_ack_parallel");
    }
    promptScope = buildPromptScopeV0({ depth, router, arbitrationMode: "primary_bound" });
  }
  // STEP 6 — shadow observe
  else {
    pushCandidate(SOVEREIGN_REALITY_V0.SILENT_OBSERVE, 6, "shadow_fallback", 0.6);
    sovereignReality = SOVEREIGN_REALITY_V0.SILENT_OBSERVE;
    selectionReason = "silent_observe";
    suppressed.push("llm_conversation", "instant_ack", "presence_ack");
  }

  /** STEP 6b — No-Lock Escape: never leave substantive turns without output authority */
  let noLockEscapeApplied = false;
  if (
    sovereignReality === SOVEREIGN_REALITY_V0.SILENT_OBSERVE &&
    isNoLockEscapeEligibleV0({ text, router, voice, modality, directedPatterns, runtime })
  ) {
    pushCandidate(SOVEREIGN_REALITY_V0.LLM_CONVERSATION, 6.5, "no_lock_escape_safe_llm", 0.72);
    sovereignReality = SOVEREIGN_REALITY_V0.LLM_CONVERSATION;
    outputChannel = modality === "voice" ? SOVEREIGNTY_OUTPUT_CHANNEL_V0.TTS : SOVEREIGNTY_OUTPUT_CHANNEL_V0.TEXT;
    selectionReason = "no_lock_escape_safe_llm";
    noLockEscapeApplied = true;
    suppressed.length = 0;
    suppressed.push("presence_ack");
    if (runtime.strictVoiceIngest === true) {
      suppressed.push("instant_ack");
    }
    promptScope = buildPromptScopeV0({
      depth,
      router,
      arbitrationMode: "primary_bound",
      maxTokensCeiling: Math.min(Number(depth.maxTokensCeiling) || 480, 640)
    });
  }

  const subReality = resolveSubRealityV0({ router, depth, sovereignReality, locale, turnId });
  if (sovereignReality === SOVEREIGN_REALITY_V0.PRESENCE_ACK && subReality.phraseVariant) {
    sovereignOutput = Object.freeze({
      text: subReality.phraseVariant,
      locale,
      source: "presence_ack"
    });
  }

  recordConflictHeatmapV0(selectionTrace, sovereignReality);

  const advisory = Object.freeze({
    router: Object.freeze({ ...router }),
    depth: Object.freeze({ ...depth }),
    voice: Object.freeze({ ...voice, directedPatterns }),
    command: Object.freeze({ ...command }),
    cubeFox,
    mixedSubstantiveQuery: mixedQuery
  });

  const lock = Object.freeze({
    schema: TURN_SOVEREIGNTY_SCHEMA_V0,
    turnId,
    lockedAtMs: atMs,
    sovereignReality,
    outputChannel,
    sovereignOutput,
    subReality,
    advisory,
    suppressed: Object.freeze([...new Set(suppressed)]),
    promptScope: promptScope ? Object.freeze({ ...promptScope }) : undefined,
    violations: Object.freeze(violations),
    preventions: Object.freeze(preventions),
    selectionReason,
    noLockEscapeApplied,
    selectionTrace: Object.freeze(selectionTrace.map((x) => Object.freeze({ ...x }))),
    enforcement: Object.freeze({
      enabled: readEnforcementFlagV0(),
      mode: readTurnSovereigntyEnforcementModeV0()
    })
  });

  return lock;
}

/**
 * @param {object} params
 */
function buildPromptScopeV0(params) {
  const depth = params.depth || {};
  const router = params.router || {};
  const directive = depth.directive ? String(depth.directive) : "";
  return Object.freeze({
    allowedDirectives: directive ? [directive] : [],
    maxTokensCeiling: Number(params.maxTokensCeiling || depth.maxTokensCeiling) || 480,
    forbiddenModules: Object.freeze([
      ...(params.arbitrationMode === "suppressed" ? ["arbitration_primary_frame"] : [])
    ]),
    arbitrationMode: params.arbitrationMode || "primary_bound",
    depthModeBound: Boolean(depth.conversationMode),
    routerIntent: router.intent ?? null
  });
}

/**
 * Lock turn — log-only by default; stores trace + heatmap.
 * @param {object} input
 */
export function lockTurnSovereigntyV0(input = {}) {
  const lock = resolveTurnSovereigntyV0(input);
  lastLockV0 = lock;
  lockByTurnIdV0.set(lock.turnId, lock);
  if (lockByTurnIdV0.size > TRACE_RING_MAX_V0) {
    const first = lockByTurnIdV0.keys().next().value;
    if (first) lockByTurnIdV0.delete(first);
  }
  traceRingV0.push(lock);
  if (traceRingV0.length > TRACE_RING_MAX_V0) traceRingV0.shift();

  logCastleLifecycleV0("TURN_SOVEREIGNTY_LOCK", {
    turnId: lock.turnId,
    sovereignReality: lock.sovereignReality,
    outputChannel: lock.outputChannel,
    selectionReason: lock.selectionReason,
    suppressed: lock.suppressed,
    enforcement: lock.enforcement.mode
  });
  logCastleLifecycleV0("TURN_SOVEREIGNTY_REALITY", {
    turnId: lock.turnId,
    reality: lock.sovereignReality,
    subReality: lock.subReality,
    reason: lock.selectionReason,
    trace: lock.selectionTrace
  });
  if (lock.suppressed.length) {
    logCastleLifecycleV0("TURN_SOVEREIGNTY_SUPPRESSED", {
      turnId: lock.turnId,
      modules: lock.suppressed
    });
  }

  publishTurnSovereigntyDebugV0(lock);
  publishTurnBehaviorConsistencyFieldV0();
  publishTurnBehavioralDriftReportV0();
  return lock;
}

/** @param {object} lock */
export function publishTurnSovereigntyDebugV0(lock) {
  if (typeof window === "undefined" || !lock) return;
  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.turnSovereignty = Object.freeze({ ...lock, publishedAtMs: Date.now() });
  } catch {
    /* noop */
  }
}

export function getLastTurnSovereigntyV0() {
  return lastLockV0;
}

export function getTurnSovereigntyTraceV0() {
  return Object.freeze([...traceRingV0]);
}

export function getTurnSovereigntyConflictHeatmapV0() {
  return Object.freeze({ ...conflictHeatmapV0 });
}

export function exportTurnSovereigntyAnalysisV0() {
  return Object.freeze({
    schema: TURN_SOVEREIGNTY_SCHEMA_V0,
    exportedAtMs: Date.now(),
    last: lastLockV0,
    trace: getTurnSovereigntyTraceV0(),
    conflictHeatmap: getTurnSovereigntyConflictHeatmapV0(),
    enforcement: readEnforcementFlagV0() ? "enforce" : "log_only"
  });
}

export function isTurnSovereigntyEnforcementEnabledV0() {
  return readEnforcementFlagV0();
}

/**
 * Replay helper — why was this reality selected?
 * @param {string} [turnId]
 */
export function explainTurnSovereigntyV0(turnId) {
  const id = String(turnId || lastLockV0?.turnId || "");
  const lock = id ? lockByTurnIdV0.get(id) || null : lastLockV0;
  if (!lock) return null;
  return Object.freeze({
    turnId: lock.turnId,
    sovereignReality: lock.sovereignReality,
    selectionReason: lock.selectionReason,
    selectionTrace: lock.selectionTrace,
    suppressed: lock.suppressed,
    subReality: lock.subReality,
    mixedSubstantiveQuery: lock.advisory?.mixedSubstantiveQuery
  });
}

/**
 * Enforcement gates (no-op when log-only).
 * @param {string} turnId
 * @param {string} action — llm | instant_ack | tts
 */
export function permitTurnOutputV0(turnId, action) {
  const lock = lockByTurnIdV0.get(String(turnId || "")) || lastLockV0;
  const mode = readTurnSovereigntyEnforcementModeV0();
  if (!lock) return Object.freeze({ permitted: true, reason: "no_lock_legacy_pass", mode });
  if (
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.LOG_ONLY ||
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.OFF ||
    mode === TURN_SOVEREIGNTY_ENFORCEMENT_MODE_V0.SOFT
  ) {
    return Object.freeze({ permitted: true, reason: mode, lock });
  }

  const actionNorm = String(action || "");
  if (actionNorm === "llm") {
    const ok = lock.sovereignReality === SOVEREIGN_REALITY_V0.LLM_CONVERSATION;
    return Object.freeze({
      permitted: ok,
      reason: ok ? "sovereign_llm" : "llm_suppressed",
      lock
    });
  }
  if (actionNorm === "instant_ack") {
    if (lock.sovereignReality === SOVEREIGN_REALITY_V0.PRESENCE_ACK) {
      return Object.freeze({
        permitted: false,
        reason: "presence_ack_is_sovereign_output",
        lock,
        mode
      });
    }
    const ok =
      lock.sovereignReality === SOVEREIGN_REALITY_V0.LLM_CONVERSATION &&
      !lock.suppressed.includes("instant_ack") &&
      !lock.suppressed.includes("instant_ack_parallel");
    return Object.freeze({
      permitted: ok,
      reason: ok ? "ack_permitted" : "ack_suppressed",
      lock,
      mode
    });
  }
  if (actionNorm === "tts" || actionNorm === "text") {
    const ok = lock.outputChannel !== SOVEREIGNTY_OUTPUT_CHANNEL_V0.NONE;
    return Object.freeze({ permitted: ok, reason: ok ? "channel_open" : "channel_none", lock });
  }
  return Object.freeze({ permitted: false, reason: "unknown_action", lock });
}

export function resetTurnSovereigntyStateForTestsV0() {
  traceRingV0.length = 0;
  lastLockV0 = null;
  lockByTurnIdV0.clear();
  for (const k of Object.keys(conflictHeatmapV0)) delete conflictHeatmapV0[k];
}
