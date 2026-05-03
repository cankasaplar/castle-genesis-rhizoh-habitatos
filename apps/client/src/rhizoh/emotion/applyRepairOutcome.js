import { normalizeEmotionState } from "./emotionState.js";
import { RHIZOH_INTENT } from "../router/intentTypes.js";

const DEFAULT_OUTCOME_SESSION = Object.freeze({
  lastRemoteFetchFailed: false,
  consecutiveLocalStubCount: 0
});

/**
 * @param {Record<string, unknown> | null | undefined} meta
 */
export function readOutcomeSessionFromMeta(meta) {
  const m = meta && typeof meta === "object" ? meta : {};
  return normalizeOutcomeSession({
    lastRemoteFetchFailed: m.rhizohLastRemoteFetchFailed,
    consecutiveLocalStubCount: m.rhizohConsecutiveLocalStubCount
  });
}

/**
 * @param {Record<string, unknown>} raw
 */
export function normalizeOutcomeSession(raw) {
  return {
    lastRemoteFetchFailed: !!(raw && raw.lastRemoteFetchFailed),
    consecutiveLocalStubCount: Math.max(
      0,
      Math.min(24, Number(raw?.consecutiveLocalStubCount) || 0)
    )
  };
}

function tokenizeForSimilarity(s) {
  const m = String(s || "")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu);
  return m || [];
}

/** Sørensen–Dice benzerliği (0–1). */
function diceCoefficient(a, b) {
  const ta = tokenizeForSimilarity(a).filter((w) => w.length > 2);
  const tb = tokenizeForSimilarity(b).filter((w) => w.length > 2);
  if (ta.length === 0 && tb.length === 0) return 1;
  const A = new Set(ta);
  const B = new Set(tb);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return (2 * inter) / (A.size + B.size);
}

function maxPriorAssistantSimilarity(reply, priorAssistantReplies) {
  const priors = Array.isArray(priorAssistantReplies) ? priorAssistantReplies : [];
  let m = 0;
  for (const p of priors.slice(-8)) {
    const sim = diceCoefficient(reply, String(p || ""));
    if (sim > m) m = sim;
  }
  return m;
}

/**
 * LLM yanıtı + kanal kalitesi → duygusal geri besleme (outcome loop).
 * Oturum bayrakları `outcomeSession` ile girer/çıkar (meta ile rehydrate).
 *
 * @param {{
 *   router?: { intent?: string, subIntent?: string },
 *   llmResult?: { reply?: string, source?: string },
 *   gatewayUx?: { phase?: string, previousPhase?: string },
 *   runtime?: Record<string, unknown>,
 *   previousEmotion?: Record<string, unknown>,
 *   outcomeSession?: { lastRemoteFetchFailed?: boolean, consecutiveLocalStubCount?: number },
 *   priorAssistantReplies?: string[]
 * }} input
 */
export function applyRepairOutcome({
  router = {},
  llmResult = {},
  gatewayUx = {},
  runtime = {},
  previousEmotion = {},
  outcomeSession: outcomeSessionIn,
  priorAssistantReplies
}) {
  const prev = normalizeEmotionState(previousEmotion);
  const reply = String(llmResult.reply || "");
  const source = String(llmResult.source || "");
  const intent = String(router.intent || "");

  let lastRemoteFetchFailed = normalizeOutcomeSession(outcomeSessionIn).lastRemoteFetchFailed;
  let consecutiveLocalStubCount = normalizeOutcomeSession(outcomeSessionIn).consecutiveLocalStubCount;

  const deltas = {
    trust: 0,
    familiarity: 0,
    tension: 0,
    wonder: 0,
    care: 0,
    rupture: 0,
    repair: 0
  };

  const resonance = computeResonance({ reply, source, intent, priorAssistantReplies });

  const currentPhase = String(gatewayUx.phase ?? runtime.rhizohGatewayPhase ?? "").toLowerCase();
  const prevPhaseUx = gatewayUx.previousPhase != null ? String(gatewayUx.previousPhase).toLowerCase() : "";

  const recoveryFromUx =
    prevPhaseUx &&
    /offline|offline_dns|degraded|degraded_llm|degraded_storage|unavailable|error|down|maintenance/.test(prevPhaseUx) &&
    /online|ready|healthy|live|ok|connected/.test(currentPhase);

  if (source === "remote-llm") {
    const recovery = lastRemoteFetchFailed || recoveryFromUx;
    if (recovery) {
      deltas.repair += 0.18;
      deltas.rupture -= 0.12;
      deltas.care += 0.06;
    }
    lastRemoteFetchFailed = false;

    let repairFromAnswer = 0.1;
    let trustFromAnswer = 0.03;

    if (intent === RHIZOH_INTENT.CRISIS) {
      repairFromAnswer += 0.08;
      deltas.care += 0.04;
    }

    if (resonance < 0.36) {
      repairFromAnswer *= 0.45;
      trustFromAnswer *= 0.7;
    } else if (resonance >= 0.65) {
      trustFromAnswer += 0.04;
      deltas.wonder += 0.03;
      repairFromAnswer += 0.06;
    }

    deltas.repair += repairFromAnswer;
    deltas.rupture -= 0.06;
    deltas.tension -= 0.08;
    deltas.trust += trustFromAnswer;

    consecutiveLocalStubCount = 0;
  } else if (source === "local-stub") {
    consecutiveLocalStubCount += 1;
    deltas.rupture += 0.03;
    deltas.trust -= 0.01;
    if (consecutiveLocalStubCount >= 2) {
      deltas.tension += 0.06;
    }
  } else if (source === "fallback") {
    lastRemoteFetchFailed = true;
    consecutiveLocalStubCount = 0;
    deltas.rupture += 0.12;
    deltas.tension += 0.1;
    deltas.wonder -= 0.04;
  } else {
    consecutiveLocalStubCount = 0;
  }

  const merged = normalizeEmotionState({
    trust: prev.trust + deltas.trust,
    familiarity: prev.familiarity + deltas.familiarity,
    tension: prev.tension + deltas.tension,
    wonder: prev.wonder + deltas.wonder,
    care: prev.care + deltas.care,
    rupture: prev.rupture + deltas.rupture,
    repair: prev.repair + deltas.repair
  });

  const outcomeSession = {
    lastRemoteFetchFailed,
    consecutiveLocalStubCount
  };

  return { emotions: merged, resonance, deltas, outcomeSession };
}

/**
 * İçerik rezonansı (0–1): uzunluk, tekrar, jeneriklik, niyet hizası, önceki cevaplara göre novelty.
 * @param {{ reply: string, source: string, intent: string, priorAssistantReplies?: string[] }} p
 */
export function computeResonance({ reply, source, intent, priorAssistantReplies }) {
  const t = String(reply || "").trim();
  if (source !== "remote-llm") {
    let s = 0.28;
    if (/yerel protokol|yanıt vermedi|fetch|ağ geçidi|VITE_GATEWAY|OPENAI_API_KEY/i.test(t)) s -= 0.12;
    return Math.max(0, Math.min(1, Math.round(s * 1000) / 1000));
  }

  let score = 0.42;
  const len = t.length;

  if (/yerel protokol|LLM için ağ geçidi|stub|_stub\b/i.test(t)) score -= 0.22;
  if (len > 480) score += 0.12;
  else if (len > 220) score += 0.09;
  else if (len > 120) score += 0.05;
  else if (len < 72) score -= 0.14;

  const parts = t
    .split(/[.!?;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((x) => x.length > 8);
  const uniq = new Set(parts);
  if (parts.length >= 4 && uniq.size / parts.length < 0.55) score -= 0.12;

  if (/\b(yardımcı olabilirim|nasıl yardımcı|başka bir konuda|genel olarak)\b/i.test(t) && len < 140) score -= 0.1;

  const maxSim = maxPriorAssistantSimilarity(t, priorAssistantReplies);
  const novelty = Math.max(0, Math.min(1, 1 - maxSim));
  score -= maxSim * 0.2;
  if (novelty > 0.48) score += novelty * 0.1;
  if (maxSim > 0.72) score -= 0.08;

  if (intent === RHIZOH_INTENT.CRISIS) {
    if (/\b(adım|dene|kontrol|log|çözüm|fix|satır|hata|kod|dosya)\b/i.test(t)) score += 0.11;
    if (/\d/.test(t)) score += 0.04;
  }
  if (intent === RHIZOH_INTENT.BUILD) {
    if (/\b(katman|modül|dosya|api|örnek|export|import|fonksiyon)\b/i.test(t) || /`/.test(t)) score += 0.07;
  }
  if (intent === RHIZOH_INTENT.REFLECT && len > 140) score += 0.06;
  if (intent === RHIZOH_INTENT.PLAY && /\b(dene|şöyle|örnek|varsayalım)\b/i.test(t)) score += 0.04;

  return Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
}

/** Test: sadece bellek bayrakları; duygu state’i değil. */
export function resetRepairOutcomeSessionState() {
  /* no-op: oturum artık meta ile taşınıyor */
}
