/**
 * Rhizoh Cognitive Policy — sağlık + niyet → davranış stratejisi (araç, hafıza, konuşma, inisiyatif).
 * Duygu ve ton ile aynı turda üretilir; runtime.rhizohPolicy olarak sürekliliğe yazılır.
 */

import { RHIZOH_INTENT } from "../router/intentTypes.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {Record<string, unknown>} [runtime]
 * @returns {{
 *   toolMode: "full" | "local_only",
 *   memoryMode: "normal" | "deferred_commit",
 *   initiative: number,
 *   verbosity: number,
 *   silenceCapable: boolean,
 *   speechMode: "normal" | "slow_and_direct",
 *   initiativeEntropy: "low" | "medium" | "high",
 *   verbosityStyle: "concise" | "moderate" | "expansive",
 *   updatedAt: number
 * }}
 */
export function deriveRhizohPolicy(runtime = {}) {
  const now = Date.now();
  const hs = runtime.healthState && typeof runtime.healthState === "object" ? runtime.healthState : null;
  const cap = hs?.capabilities && typeof hs.capabilities === "object" ? hs.capabilities : {};
  const conn = hs?.connectivity != null ? String(hs.connectivity) : "";
  const intent = String(runtime.rhizohRouter?.intent || runtime.intent || RHIZOH_INTENT.CHAT);
  const symptoms = Array.isArray(hs?.symptoms) ? hs.symptoms : [];

  let toolMode = /** @type {"full" | "local_only"} */ ("full");
  let memoryMode = /** @type {"normal" | "deferred_commit"} */ ("normal");
  let initiative = 0.6;
  let verbosity = 0.6;
  let silenceCapable = true;
  let speechMode = /** @type {"normal" | "slow_and_direct"} */ ("normal");

  const connectivityIsolation =
    conn === "MAINTENANCE" || conn === "OFFLINE" || conn === "OFFLINE_DNS" || conn === "UNCONFIGURED";

  if (connectivityIsolation) {
    toolMode = "local_only";
    initiative *= 0.52;
    verbosity *= 0.78;
    speechMode = "slow_and_direct";
  }

  if (cap.remoteReasoning === false) {
    toolMode = "local_only";
    initiative *= 0.7;
    verbosity -= 0.12;
  }

  if (cap.memoryWrite === false) {
    memoryMode = "deferred_commit";
  }

  if (symptoms.includes("high_neural_latency")) {
    speechMode = "slow_and_direct";
    verbosity -= 0.08;
  }

  if (conn === "MAINTENANCE") {
    toolMode = "local_only";
    speechMode = "slow_and_direct";
    initiative = Math.min(initiative, 0.42);
    verbosity = Math.min(verbosity, 0.55);
  }

  if (intent === RHIZOH_INTENT.REFLECT) {
    verbosity += 0.15;
    silenceCapable = true;
  } else if (intent === RHIZOH_INTENT.CRISIS) {
    verbosity -= 0.2;
    initiative += 0.2;
    silenceCapable = false;
  } else if (intent === RHIZOH_INTENT.BUILD) {
    initiative += 0.12;
    verbosity += 0.05;
  } else if (intent === RHIZOH_INTENT.PLAY) {
    initiative += 0.08;
  } else if (intent === RHIZOH_INTENT.SILENCE && !connectivityIsolation) {
    verbosity -= 0.25;
    initiative -= 0.15;
    silenceCapable = true;
  }

  initiative = clamp01(initiative);
  verbosity = clamp01(verbosity);

  const initiativeEntropy = initiative < 0.38 ? "low" : initiative > 0.72 ? "high" : "medium";
  const verbosityStyle = verbosity < 0.38 ? "concise" : verbosity > 0.72 ? "expansive" : "moderate";

  return {
    toolMode,
    memoryMode,
    initiative: Math.round(initiative * 1000) / 1000,
    verbosity: Math.round(verbosity * 1000) / 1000,
    silenceCapable,
    speechMode,
    initiativeEntropy,
    verbosityStyle,
    updatedAt: now
  };
}

/**
 * Gateway / continuity memory bloğu için kısa İngilizce satırlar (model talimatı).
 * @param {ReturnType<typeof deriveRhizohPolicy> | null | undefined} policy
 */
export function formatRhizohPolicyForPrompt(policy) {
  if (!policy || typeof policy !== "object") return "";
  const tool = policy.toolMode === "local_only" ? "local_only" : "full_remote_ok";
  const mem = policy.memoryMode === "deferred_commit" ? "deferred_commit" : "normal";
  const ent = policy.initiativeEntropy || "medium";
  const verb = policy.verbosityStyle || "moderate";
  const speech = policy.speechMode === "slow_and_direct" ? "slow_and_direct" : "normal";
  const sil = policy.silenceCapable ? "true" : "false";
  return [
    "Current policy (obey — shapes tools, memory claims, and reply shape):",
    `- tool mode: ${tool}`,
    `- memory mode: ${mem}`,
    `- initiative / entropy: ${ent}`,
    `- verbosity: ${verb}`,
    `- speech pacing: ${speech}`,
    `- silence capable: ${sil}`
  ].join("\n");
}
