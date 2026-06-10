/**
 * FOX_PROACTIVE_UTTERANCE_LLM_V1 — Rhizoh continuity modunda kısa proaktif ifade.
 * Template fallback her zaman mevcut; LLM yalnızca ifade üretir (Fox karar vermiştir).
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { postRhizohLlmTurnV0 } from "./rhizohLlmTurnClientV0.js";
import { buildFoxProactiveUtteranceV1 } from "./foxProactiveTemplatesV1.js";
import {
  buildRhizohDialogueThreadPromptBlockV1,
  coalesceRhizohDialogueThreadV1
} from "./rhizohDialogueThreadV1.js";
import { buildGhostPresentationTonePromptBlockV1 } from "./ghostStateEngineV1.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  buildFoxToneModulationPromptBlockV1,
  getFoxIdentityAnchorV1
} from "./foxIdentityAnchorV1.js";
import { getFoxToneModulationV1 } from "./foxProactiveAdaptationV1.js";

export const FOX_PROACTIVE_UTTERANCE_LLM_SCHEMA_V1 = "castle.rhizoh.fox_proactive_utterance_llm.v1";

function trimPhrase(s, maxLen = 220) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function isFoxProactiveLlmEnabledV1() {
  const raw = String(import.meta.env?.VITE_FOX_PROACTIVE_LLM ?? "1")
    .trim()
    .toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off";
}

function isLlmEndpointConfiguredV1() {
  try {
    const cfg = getCastleFlightConfig();
    return Boolean(String(cfg.rhizohLlmHttp || "").trim());
  } catch {
    return false;
  }
}

/**
 * @param {Record<string, unknown>} initiative
 * @param {unknown} dialogueThread
 * @param {Record<string, unknown>} [ghostHints]
 */
export function buildFoxProactiveLlmPromptMessageV1(initiative, dialogueThread, ctx = {}) {
  const ghostHints = ctx.ghostHints && typeof ctx.ghostHints === "object" ? ctx.ghostHints : {};
  const src = String(initiative?.source || "world");
  const sig = Number(initiative?.significance) || 0;
  const impact = String(initiative?.dominantImpact || "");
  const thread = coalesceRhizohDialogueThreadV1(dialogueThread);
  const threadBlock = buildRhizohDialogueThreadPromptBlockV1(thread);
  const ghostBias =
    ctx?.ghostPresentationBias ??
    (typeof window !== "undefined" ? window.__rhizoh?.ghostPresentationBias : null);
  const toneBlock = buildGhostPresentationTonePromptBlockV1(ghostBias);
  const toneMod =
    typeof window !== "undefined" ? window.__rhizoh?.foxToneModulation : getFoxToneModulationV1();
  const foxToneBlock = buildFoxToneModulationPromptBlockV1(toneMod);

  return [
    "[RHIZOH_PROACTIVE_CONTINUITY]",
    "Fox proaktif başlatma kararı verdi. Sen yalnızca kısa konuşma ifadesi üret.",
    "Kurallar: tek veya iki cümle, max 28 kelime, sıcak, davetkar, baskısız.",
    "Soru sorabilirsin ama chatbot gibi genel olma; dialogue thread ile süreklilik taşı.",
    `initiativeSource: ${src} · significance: ${sig.toFixed(2)} · impact: ${impact || "general"}`,
    `identityAnchor: warmth=${getFoxIdentityAnchorV1().toneBaseline.warmth} (bounded Fox identity)`,
    threadBlock,
    toneBlock,
    foxToneBlock,
    "Yalnızca söylenecek metni yaz — etiket, JSON veya açıklama ekleme."
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * @param {Record<string, unknown>} initiative
 * @param {{
 *   traceId?: string | null,
 *   dialogueThread?: unknown,
 *   ghostHints?: Record<string, unknown>,
 *   idToken?: string,
 *   connectionId?: string
 * }} [ctx]
 */
export async function resolveFoxProactiveUtteranceV1(initiative, ctx = {}) {
  const fallback = buildFoxProactiveUtteranceV1(initiative);
  const base = Object.freeze({
    schema: FOX_PROACTIVE_UTTERANCE_LLM_SCHEMA_V1,
    phrase: fallback,
    source: "template",
    llmAttempted: false
  });

  if (!isFoxProactiveLlmEnabledV1() || !isLlmEndpointConfiguredV1()) {
    return base;
  }

  const dialogueThread =
    ctx.dialogueThread ??
    (typeof window !== "undefined" ? window.__rhizoh?.rhizohDialogueThread : null);
  const message = buildFoxProactiveLlmPromptMessageV1(initiative, dialogueThread, {
    ghostHints: ctx.ghostHints || {},
    ghostPresentationBias: ctx.ghostPresentationBias
  });
  const traceId = ctx.traceId || `fox_proactive_llm_${Date.now()}`;

  try {
    const result = await postRhizohLlmTurnV0({
      message,
      traceId,
      skipHotWire: true,
      voiceTurn: false,
      connectionId: ctx.connectionId || "",
      idToken: ctx.idToken,
      sourcePath: "fox_proactive_utterance_v1",
      context: Object.freeze({
        foxProactiveInitiative: Object.freeze({
          id: initiative?.id,
          source: initiative?.source,
          significance: initiative?.significance,
          dominantImpact: initiative?.dominantImpact
        }),
        rhizohDialogueThread: coalesceRhizohDialogueThreadV1(dialogueThread),
        generationMode: "FAST_DIALOGUE",
        proactiveChannel: true
      }),
      options: Object.freeze({
        maxTokens: 96,
        temperature: 0.72
      })
    });

    if (result.ok && result.reply) {
      const phrase = trimPhrase(result.reply);
      if (phrase.length >= 12) {
        logVoiceInfoV0("FOX_PROACTIVE_LLM_UTTERANCE", {
          traceId,
          source: initiative?.source,
          chars: phrase.length
        });
        return Object.freeze({
          schema: FOX_PROACTIVE_UTTERANCE_LLM_SCHEMA_V1,
          phrase,
          source: "llm",
          llmAttempted: true,
          traceId: result.traceId || traceId
        });
      }
    }

    logVoiceInfoV0("FOX_PROACTIVE_LLM_FALLBACK", {
      traceId,
      error: result.error || "empty_reply"
    });
  } catch (err) {
    logVoiceInfoV0("FOX_PROACTIVE_LLM_FALLBACK", {
      traceId,
      error: String(err?.message || err)
    });
  }

  return Object.freeze({
    ...base,
    llmAttempted: true,
    source: "template_fallback"
  });
}
