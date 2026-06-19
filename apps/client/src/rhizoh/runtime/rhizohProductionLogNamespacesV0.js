/**
 * Production log namespaces — keep STT, WebGPU probe, and Castle lifecycle separable in DevTools.
 * Chrome native "No available adapters" = WebGPU only; suppress during navigator.gpu.requestAdapter().
 */

import { resolveCastleLayerVoiceContextV1 } from "../../castle/layers/castleLayerRuntimeResolverV1.js";

const WEBGPU_ADAPTER_NOISE = /no available adapters/i;

/** High-frequency heartbeat tags — prod console quiet unless VITE_DEBUG=1. */
const VOICE_PROD_QUIET_TAGS_V0 = new Set([
  "PULSE_LOOP_TICK",
  "PULSE_LOOP_MOUNT",
  "LIVE_PRESENCE_EMIT",
  "PRESENCE_PRIMITIVE_EMIT",
  "THINKING_OBSERVATION",
  "CONTINUITY_STATE",
  "PERSONA_PULSE",
  "PERSONA_SCHEDULER_MOUNT",
  "FOX_SILENT_OBSERVATION",
  "SPEECH_GLUE_HANDOFF",
  "GROUNDING_OVERRIDE",
  "OUTPUT_CONTRACT_LOG"
]);

/** Routine lifecycle stages — errors/warnings still surface via logVoiceWarnV0. */
const CASTLE_PROD_QUIET_STAGES_V0 = new Set([
  "chess_move_played",
  "speech_meaning",
  "runtime_stability",
  "influence_observability",
  "first_speech_soft",
  "voice_turn_llm"
]);

/**
 * Prod default: quiet console (observability via __RHIZOH_FULL_REPORT__ / registries).
 * @returns {boolean}
 */
export function isRhizohVerboseConsoleV0() {
  if (typeof window !== "undefined" && window.__rhizoh?.debug?.consoleVerbose === true) {
    return true;
  }
  if (typeof import.meta !== "undefined") {
    if (String(import.meta.env?.VITE_DEBUG ?? "").trim() === "1") return true;
  }
  return false;
}

/**
 * @param {string} tag
 * @returns {boolean}
 */
export function shouldEmitVoiceConsoleInfoV0(tag) {
  if (isRhizohVerboseConsoleV0()) return true;
  return !VOICE_PROD_QUIET_TAGS_V0.has(String(tag || ""));
}

/**
 * @param {string} stage
 * @returns {boolean}
 */
export function shouldEmitCastleLifecycleConsoleV0(stage) {
  if (isRhizohVerboseConsoleV0()) return true;
  return !CASTLE_PROD_QUIET_STAGES_V0.has(String(stage || ""));
}

/** @param {unknown[]} args */
function isWebGpuAdapterNoise(args) {
  try {
    return WEBGPU_ADAPTER_NOISE.test(args.map((a) => String(a ?? "")).join(" "));
  } catch {
    return false;
  }
}

/**
 * Filters Chrome's navigator.gpu "No available adapters" console noise during probe window.
 */
export function installChromeWebGpuNoiseSuppressV0() {
  if (typeof window === "undefined" || window.__CASTLE_WEBGPU_NOISE_SUPPRESS__) return;
  window.__CASTLE_WEBGPU_NOISE_SUPPRESS__ = true;
}

/**
 * @param {GPURequestAdapterOptions} [options]
 * @returns {Promise<GPUAdapter | null>}
 */
export async function requestWebGpuAdapterQuietlyV0(options = {}) {
  if (typeof navigator === "undefined" || !navigator.gpu?.requestAdapter) return null;
  installChromeWebGpuNoiseSuppressV0();
  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;
  const wrap =
    (fn) =>
    (...args) => {
      if (isWebGpuAdapterNoise(args)) return;
      fn.apply(console, args);
    };
  console.warn = wrap(origWarn);
  console.error = wrap(origError);
  console.info = wrap(origInfo);
  try {
    return await navigator.gpu.requestAdapter(options);
  } catch {
    return null;
  } finally {
    console.warn = origWarn;
    console.error = origError;
    console.info = origInfo;
  }
}

/** @param {string} tag @param {Record<string, unknown>} [detail] */
export function logVoiceInfoV0(tag, detail = {}) {
  if (!shouldEmitVoiceConsoleInfoV0(tag)) return;
  let enriched = detail;
  try {
    const castleLayer = resolveCastleLayerVoiceContextV1({
      eventTag: tag,
      uiDomain: detail.uiDomain || detail.scope,
      intentClass: detail.intentClass,
      executionAccepted: detail.executionAccepted
    });
    enriched = { ...detail, castleLayer };
  } catch {
    /* resolver optional during boot */
  }
  console.info(`[VOICE_${String(tag || "INFO")}]`, enriched);
}

/** @param {string} tag @param {Record<string, unknown>} [detail] */
export function logVoiceWarnV0(tag, detail = {}) {
  let enriched = detail;
  try {
    const castleLayer = resolveCastleLayerVoiceContextV1({
      eventTag: tag,
      uiDomain: detail.uiDomain || detail.scope,
      intentClass: detail.intentClass,
      executionAccepted: detail.executionAccepted ?? false
    });
    enriched = { ...detail, castleLayer };
  } catch {
    /* noop */
  }
  console.warn(`[VOICE_${String(tag || "WARN")}]`, enriched);
}

/** @param {string} tag @param {Record<string, unknown>} [detail] */
export function logWebGpuInfoV0(tag, detail = {}) {
  console.info(`[WEBGPU_${String(tag || "INFO")}]`, detail);
}

/** Castle system lifecycle (LLM turn, boot-adjacent health — not STT / not GPU). */
export function logCastleLifecycleV0(stage, detail = {}) {
  if (!shouldEmitCastleLifecycleConsoleV0(stage)) return;
  const meta = detail && typeof detail === "object" ? detail : {};
  console.info(`[CASTLE_${String(stage || "unknown")}]`, meta);
}

export function createRhizohClientTraceIdV0() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TRC-${t}-${r}`;
}

/**
 * @param {string | null | undefined} serverTraceId
 * @param {string} clientTraceId
 */
export function resolveRhizohTurnTraceIdV0(serverTraceId, clientTraceId) {
  const server = String(serverTraceId || "").trim();
  if (server) return server;
  return String(clientTraceId || "").trim();
}
