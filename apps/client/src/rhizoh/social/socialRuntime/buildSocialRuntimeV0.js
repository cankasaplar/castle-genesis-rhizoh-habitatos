/**
 * SPECFLOW: CORE-ELIGIBLE — orchestrates A→D→B→C→E in one synchronous pass.
 *
 * System lock (architecture): Rhizoh is not merely reactive intelligence; it is a
 * **socially persistent presence with bounded initiative** — initiative = managed
 * conversation potential (spontaneity · micro-intervention · social energy), not raw output.
 */

import { detectLanguageContextV0 } from "./languageContextDetectorV0.js";
import { transitionSocialModeV0, SOCIAL_MODE_V0 } from "./socialModeStateMachineV0.js";
import { selectPersonaV0 } from "./personaRouterV0.js";
import { buildHitabetDirectiveV0 } from "./hitabetEngineV0.js";
import { computeInitiativeBudgetV0, INITIATIVE_DEFAULT_STATE_V0 } from "./initiativeBudgetV0.js";

export const SOCIAL_RUNTIME_SCHEMA_V0 = "castle.rhizoh.social_runtime.v0";

/**
 * @param {unknown} row
 * @returns {number}
 */
function turnTs(row) {
  const t = row && typeof row === "object" ? Number(row.ts) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/**
 * @param {{
 *   nowMs: number,
 *   userMessage: string,
 *   navLang?: string,
 *   defaultLocale?: string,
 *   prevMeta?: Record<string, unknown>|null,
 *   routerIntent?: string,
 *   silenceMode?: boolean,
 *   layerFocus?: number,
 *   castlePeerCount?: number,
 *   hasFirebaseUser?: boolean,
 *   recentTurns?: unknown[]
 * }} input
 */
export function buildSocialRuntimeV0(input) {
  const nowMs = Math.max(0, Number(input.nowMs) || Date.now());
  const msg = String(input.userMessage || "").trim();
  const navLang = String(input.navLang || "");
  const defaultLocale = String(input.defaultLocale || "tr").toLowerCase().slice(0, 8) || "tr";
  const meta = input.prevMeta && typeof input.prevMeta === "object" ? input.prevMeta : {};
  const prevSr = meta.socialRuntimeV1 && typeof meta.socialRuntimeV1 === "object" ? meta.socialRuntimeV1 : {};
  const prevMode = String(prevSr.mode || SOCIAL_MODE_V0.IDLE);
  const prevLocale = String(prevSr.lastDetectedLocale || defaultLocale);

  const lang = detectLanguageContextV0(msg, navLang);
  const turns = Array.isArray(input.recentTurns) ? input.recentTurns : [];
  const lastUserTs = turns.map(turnTs).reduce((a, b) => Math.max(a, b), 0);
  const silenceMs = msg.length ? 0 : Math.max(0, nowMs - (lastUserTs || Number(prevSr.lastUserActivityAt) || nowMs));

  const hostSurface = Number(input.layerFocus) === 5;
  const peerCount = Math.max(0, Number(input.castlePeerCount) || 0);
  let audience = String(lang.audience || "unknown");
  if (peerCount >= 2) audience = "group";
  else if (peerCount === 1) audience = "guest";
  else if (audience === "unknown" && msg.length > 0) audience = "solo";

  const silenceIntent =
    !!input.silenceMode || String(input.routerIntent || "").toUpperCase() === "SILENCE";

  const mode = transitionSocialModeV0({
    prevMode: prevMode,
    userMessageNonEmpty: msg.length > 0,
    silenceMs,
    localeConfidence: lang.confidence,
    detectedLocale: lang.detectedLocale,
    defaultLocale,
    hostSurface,
    silenceIntent,
    peerCount
  });

  const persona = selectPersonaV0({
    mode,
    detectedLocale: lang.detectedLocale,
    defaultLocale,
    register: lang.register,
    audience,
    hostSurface,
    peerCount
  });

  const initiativePrev = {
    budget01: typeof prevSr.initiativeBudget01 === "number" ? prevSr.initiativeBudget01 : INITIATIVE_DEFAULT_STATE_V0.budget01,
    lastUpdatedAt: typeof prevSr.initiativeLastUpdatedAt === "number" ? prevSr.initiativeLastUpdatedAt : nowMs,
    totalSpent01: typeof prevSr.initiativeTotalSpent01 === "number" ? prevSr.initiativeTotalSpent01 : 0
  };

  const initiative = computeInitiativeBudgetV0(initiativePrev, {
    nowMs,
    silenceMs,
    mode,
    personaId: persona.personaId,
    allowProactiveSurface:
      mode !== SOCIAL_MODE_V0.QUIET &&
      (mode !== SOCIAL_MODE_V0.IDLE || peerCount > 0 || msg.length > 0)
  });

  const hitabet = buildHitabetDirectiveV0(persona, {
    mode,
    allowProactivePing: initiative.allowProactivePing,
    initiativeBudget01: initiative.budget01
  });

  const forLlm = {
    schema: SOCIAL_RUNTIME_SCHEMA_V0,
    mode,
    personaId: persona.personaId,
    detectedLocale: lang.detectedLocale,
    register: lang.register,
    audience,
    respondInLocale: persona.respondInLocale,
    localeConfidence: lang.confidence,
    initiative: {
      budget01: initiative.budget01,
      allowProactivePing: initiative.allowProactivePing,
      cap01: persona.initiativeCap01
    },
    hitabet: {
      presetId: hitabet.presetId,
      tempo: persona.tempo,
      maxSentences: persona.maxSentences
    },
    directives: {
      llmBlock: hitabet.llmDirective
    }
  };

  const metaPersist = {
    schema: SOCIAL_RUNTIME_SCHEMA_V0,
    mode,
    personaId: persona.personaId,
    lastDetectedLocale: lang.detectedLocale,
    lastRespondLocale: persona.respondInLocale,
    register: lang.register,
    audience,
    initiativeBudget01: initiative.budget01,
    initiativeLastUpdatedAt: initiative.lastUpdatedAt,
    initiativeTotalSpent01: Math.min(
      1,
      initiativePrev.totalSpent01 + (initiative.allowProactivePing ? initiative.spendHint01 : 0)
    ),
    lastUserActivityAt: msg.length ? nowMs : typeof prevSr.lastUserActivityAt === "number" ? prevSr.lastUserActivityAt : lastUserTs || nowMs,
    lastModeAt: mode !== prevMode ? nowMs : typeof prevSr.lastModeAt === "number" ? prevSr.lastModeAt : nowMs,
    localeChanged: lang.detectedLocale !== prevLocale && lang.detectedLocale !== "und"
  };

  return { forLlm, metaPersist };
}
