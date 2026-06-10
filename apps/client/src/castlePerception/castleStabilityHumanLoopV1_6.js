/**
 * Castle Stability Human Loop v1.6 — ingress + signal parse → Co-Governor negotiation.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_6.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { resumeRealityContextV1_5 } from "./castleRealityStabilityGovernorV1_5.js";
import {
  CO_GOVERNOR_ROLE_V1_6,
  negotiateStabilityV1_6
} from "./castleStabilityCoGovernorV1_6.js";

export const CASTLE_STABILITY_HUMAN_LOOP_SCHEMA_V1_6 = "castle.stability_human_loop.v1.6";

export const STABILITY_FEEDBACK_SIGNAL_V1_6 = Object.freeze({
  SLOW_DOWN: "slow_down",
  CUT_FREEZE: "cut_freeze",
  SUSTAIN_MODE: "sustain_mode",
  ADD_ALIVENESS: "add_aliveness",
  ACCELERATE: "accelerate",
  RELEASE_LOCK: "release_lock",
  FAST_EXPLAIN: "fast_explain",
  SUMMARIZE_REQUEST: "summarize_request",
  WRONG_UNDERSTANDING: "wrong_understanding",
  DEPRIORITIZE: "deprioritize",
  PRIORITIZE_THREAD: "prioritize_thread",
  SWITCH_SOCIAL: "switch_social",
  LISTEN_ONLY: "listen_only",
  BACKGROUND_THREAD: "background_thread"
});

const FEEDBACK_HOLD_MS_V1_6 = Object.freeze({
  [STABILITY_FEEDBACK_SIGNAL_V1_6.SLOW_DOWN]: 8000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.CUT_FREEZE]: 6000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.SUSTAIN_MODE]: 14000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.ADD_ALIVENESS]: 10000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.ACCELERATE]: 7000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.RELEASE_LOCK]: 0,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.FAST_EXPLAIN]: 9000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.SUMMARIZE_REQUEST]: 12000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.WRONG_UNDERSTANDING]: 8000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.DEPRIORITIZE]: 10000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.PRIORITIZE_THREAD]: 12000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.SWITCH_SOCIAL]: 10000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.LISTEN_ONLY]: 14000,
  [STABILITY_FEEDBACK_SIGNAL_V1_6.BACKGROUND_THREAD]: 9000
});

const SUSTAIN_LENS_HINTS_V1_6 = Object.freeze({
  co_watch: [/mac|maç|match|sport|izle/i],
  focus: [/kitap|book|audiobook|dinle|focus/i],
  social: [/sohbet|chat|konu[sş]|social|talk/i]
});

const FEEDBACK_PARSE_RULES_V1_6 = Object.freeze([
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.FAST_EXPLAIN,
    role: CO_GOVERNOR_ROLE_V1_6.STEERING,
    patterns: [/hizli acikla|hızlı açıkla|bana hizli|bana hızlı|quick explain|fast answer|hizli cevap|hızlı cevap/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.SUMMARIZE_REQUEST,
    role: CO_GOVERNOR_ROLE_V1_6.STEERING,
    patterns: [/ozet cikar|özet çıkar|summarize|ozetle|özetle|bana ozet|bana özet/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.SLOW_DOWN,
    role: CO_GOVERNOR_ROLE_V1_6.STEERING,
    patterns: [/cok yavas|çok yavaş|yavasla|yavaşla|too slow|slow down/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.BACKGROUND_THREAD,
    role: CO_GOVERNOR_ROLE_V1_6.STEERING,
    patterns: [/biraz arkaya|arka plana|background this|put in background/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.CUT_FREEZE,
    role: CO_GOVERNOR_ROLE_V1_6.PHASE_OVERRIDE,
    patterns: [/burada kes|kes burada|cut here|dur burada|freeze here|dondur|bunu dondur/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.SUSTAIN_MODE,
    role: CO_GOVERNOR_ROLE_V1_6.STEERING,
    patterns: [/mac mod|maç mod|match mode|bu modda kal|stay in|modunda kal|kal burada/i],
    extractLens: true
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.ADD_ALIVENESS,
    role: CO_GOVERNOR_ROLE_V1_6.STEERING,
    patterns: [/cok steril|çok steril|daha canli|daha canlı|too flat|canlan|soguk|soğuk/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.ACCELERATE,
    role: CO_GOVERNOR_ROLE_V1_6.STEERING,
    patterns: [/hizlan|hızlan|speed up|faster|acele|hizli|hızlı|daha hizli|daha hızlı/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.WRONG_UNDERSTANDING,
    role: CO_GOVERNOR_ROLE_V1_6.CORRECTION,
    patterns: [/yanlis anlad|yanlış anlad|wrong|hatali|hatalı|not what i meant|oyle demedim|öyle demedim/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.DEPRIORITIZE,
    role: CO_GOVERNOR_ROLE_V1_6.CORRECTION,
    patterns: [/onemseme|önemseme|ignore this|bunu onemseme|bunu önemseme|not important/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.PRIORITIZE_THREAD,
    role: CO_GOVERNOR_ROLE_V1_6.CORRECTION,
    patterns: [/thread onemli|thread önemli|su thread|şu thread|this thread matters|onemli bu|önemli bu/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.SWITCH_SOCIAL,
    role: CO_GOVERNOR_ROLE_V1_6.PHASE_OVERRIDE,
    patterns: [/sohbet mod|chat mode|sohbet moduna|switch to chat|konusma mod|konuşma mod/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.LISTEN_ONLY,
    role: CO_GOVERNOR_ROLE_V1_6.PHASE_OVERRIDE,
    patterns: [/sadece dinle|just listen|listen only|sessiz kal|be quiet|konusma|konuşma/i]
  },
  {
    signal: STABILITY_FEEDBACK_SIGNAL_V1_6.RELEASE_LOCK,
    role: CO_GOVERNOR_ROLE_V1_6.PHASE_OVERRIDE,
    patterns: [/kilidi ac|kilidi aç|release lock|devam et|unlock|serbest birak|serbest bırak/i]
  }
]);

/** @type {Map<string, object>} */
const activeHumanFeedbackV1_6 = new Map();

function feedbackHoldMsV1_6(signal) {
  return FEEDBACK_HOLD_MS_V1_6[signal] ?? 6000;
}

function inferSustainLensV1_6(text = "") {
  const raw = String(text);
  for (const [lens, patterns] of Object.entries(SUSTAIN_LENS_HINTS_V1_6)) {
    if (patterns.some((re) => re.test(raw))) return lens;
  }
  return null;
}

export function parseStabilityFeedbackV1_6(text = "") {
  const raw = String(text).trim();
  if (!raw) return null;

  for (const rule of FEEDBACK_PARSE_RULES_V1_6) {
    if (!rule.patterns.some((re) => re.test(raw))) continue;
    const sustainLens = rule.extractLens ? inferSustainLensV1_6(raw) : null;
    return Object.freeze({
      signal: rule.signal,
      role: rule.role,
      sustainLens,
      raw
    });
  }
  return null;
}

export function submitStabilityFeedbackV1_6(signal, options = {}) {
  const ownerId = String(options.ownerId || "user_local");
  const atMs = Number(options.atMs) || Date.now();
  const holdMs = feedbackHoldMsV1_6(signal);

  if (signal === STABILITY_FEEDBACK_SIGNAL_V1_6.RELEASE_LOCK) {
    activeHumanFeedbackV1_6.delete(ownerId);
    resumeRealityContextV1_5(ownerId);
    return Object.freeze({
      signal,
      ownerId,
      released: true,
      atMs
    });
  }

  const entry = Object.freeze({
    signal,
    ownerId,
    role: options.role || null,
    sustainLens: options.sustainLens || null,
    targetThreadId: options.targetThreadId || null,
    atMs,
    expiresAtMs: holdMs > 0 ? atMs + holdMs : atMs,
    source: options.source || "explicit"
  });
  activeHumanFeedbackV1_6.set(ownerId, entry);
  return entry;
}

export function getActiveStabilityFeedbackV1_6(ownerId) {
  return activeHumanFeedbackV1_6.get(String(ownerId)) || null;
}

export function consumeHumanFeedbackV1_6(ownerId, atMs = Date.now()) {
  const key = String(ownerId);
  const entry = activeHumanFeedbackV1_6.get(key);
  if (!entry) return null;
  if (atMs > entry.expiresAtMs) {
    activeHumanFeedbackV1_6.delete(key);
    return null;
  }
  return entry;
}

export function applyStabilityHumanLoopV1_6(realityStability, input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const ownerId = String(
    input.ownerId || realityStability.dynamics?.contextualIdentity?.ownerId || "user_local"
  );

  let feedback = consumeHumanFeedbackV1_6(ownerId, atMs);

  if (input.stabilityFeedback) {
    feedback = submitStabilityFeedbackV1_6(input.stabilityFeedback, {
      ownerId,
      atMs,
      sustainLens: input.sustainLens || null,
      targetThreadId: input.targetThreadId || null,
      source: "ingress"
    });
  } else if (input.userInitiated) {
    const parsed = parseStabilityFeedbackV1_6(input.text || input.preview || "");
    if (parsed) {
      feedback = submitStabilityFeedbackV1_6(parsed.signal, {
        ownerId,
        atMs,
        sustainLens: parsed.sustainLens,
        role: parsed.role,
        targetThreadId: input.targetThreadId || null,
        source: "voice_parse"
      });
    }
  }

  const coGovernance = negotiateStabilityV1_6(realityStability, {
    ownerId,
    atMs,
    feedback: feedback?.released ? null : feedback,
    memoryPriors: input.memoryPriors
  });

  const governedPlan = coGovernance.negotiatedPlan;
  const governedFrame = coGovernance.negotiatedFrame;

  if (coGovernance.negotiated) {
    logVoiceInfoV0("STABILITY_HUMAN_LOOP", {
      signal: feedback?.signal,
      role: feedback?.role,
      negotiatedPhase: coGovernance.negotiatedPhase?.phase,
      negotiationDirection: coGovernance.coGovernorState?.negotiationField?.direction,
      dominantThread: governedPlan.dominantThreadId,
      speakShare: governedPlan.speakShare
    });
  }

  return Object.freeze({
    schema: CASTLE_STABILITY_HUMAN_LOOP_SCHEMA_V1_6,
    governedPlan,
    governedFrame,
    coGovernance,
    coGovernorState: coGovernance.coGovernorState,
    stabilityAgreement: coGovernance.stabilityAgreement,
    humanLoop: Object.freeze({
      active: coGovernance.negotiated,
      feedback: feedback?.released ? null : feedback,
      role: feedback?.role || null
    }),
    realityStability
  });
}

export function getStabilityHumanLoopSnapshotV1_6() {
  return Object.freeze({
    schema: CASTLE_STABILITY_HUMAN_LOOP_SCHEMA_V1_6,
    identity: "stability_feedback_human_loop",
    activeOwners: Object.freeze([...activeHumanFeedbackV1_6.keys()])
  });
}

/** @internal vitest */
export function __resetStabilityHumanLoopForTestV1_6() {
  activeHumanFeedbackV1_6.clear();
}

export { CO_GOVERNOR_ROLE_V1_6 };
