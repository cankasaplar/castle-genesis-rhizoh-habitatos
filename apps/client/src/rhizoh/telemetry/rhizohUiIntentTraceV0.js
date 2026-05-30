/**
 * Product-layer trace: UI intent → engine action (console + `castle:rhizoh-signal`).
 * UI markup değişmeden; yalnızca çağrı noktalarından emit edilir.
 *
 * **Çekirdek üçlü (V0):** her emit bir **execution atom**; `correlationId` = **execution identity**
 * (zaman çizelgesi omurgası / temporal spine); `intentLayer` = **execution context classifier**
 * (rol ekseni — kim başlattı / hangi bağlamda yürüdü).
 *
 * **Birleşik model:** aynı iz hem “sistem nasıl davranıyor?” (behavior) hem “nasıl gözlemleniyor?”
 * (observability) sorularına cevap verir — çift graph değil, tek graph.
 *
 * Ürün dili: **Rhizoh Behavior Trace Layer V0** / **Rhizoh Behavior Graph V0** — tek `correlationId`
 * altında niyet, motor ve zamanlama **semantic execution trace** olarak zincirlenir.
 */

import { emitRhizohBehaviorSignal } from "./rhizohBehaviorSignalsV1.js";

/**
 * Execution context classifier (role axis). Bir olayın **bağlam sınıfı** — tekil execution identity değil (`correlationId`).
 * @typedef {"ui" | "voice" | "system" | "system_internal" | "replay" | "inferred"} RhizohIntentLayerV0
 */

export const RHIZOH_INTENT_LAYER_UI = "ui";
export const RHIZOH_INTENT_LAYER_VOICE = "voice";
export const RHIZOH_INTENT_LAYER_SYSTEM = "system";
/** Motor içi / scheduler / iç döngü — kullanıcı veya dış komuttan bir adım uzak. */
export const RHIZOH_INTENT_LAYER_SYSTEM_INTERNAL = "system_internal";
export const RHIZOH_INTENT_LAYER_REPLAY = "replay";
/** Kural türetimli deterministik etiket (heuristic “oracle truth” değil). */
export const RHIZOH_INTENT_LAYER_INFERRED = "inferred";

const RHIZOH_INTENT_LAYER_SET = new Set([
  RHIZOH_INTENT_LAYER_UI,
  RHIZOH_INTENT_LAYER_VOICE,
  RHIZOH_INTENT_LAYER_SYSTEM,
  RHIZOH_INTENT_LAYER_SYSTEM_INTERNAL,
  RHIZOH_INTENT_LAYER_REPLAY,
  RHIZOH_INTENT_LAYER_INFERRED
]);

/**
 * @param {unknown} layer
 * @param {RhizohIntentLayerV0} fallback
 * @returns {RhizohIntentLayerV0}
 */
export function normalizeRhizohIntentLayer(layer, fallback) {
  const s = String(layer || "")
    .trim()
    .toLowerCase();
  if (RHIZOH_INTENT_LAYER_SET.has(s)) return /** @type {RhizohIntentLayerV0} */ (s);
  return fallback;
}

/** @returns {string} */
export function newRhizohUiCorrelationId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }
  return `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {{
 *   source?: string,
 *   element?: string,
 *   intent: string,
 *   phase?: string,
 *   intentLayer?: string,
 *   correlationId?: string,
 *   [key: string]: unknown
 * }} args
 * @returns {string} correlationId
 */
export function emitRhizohUiIntent(args) {
  const a = args && typeof args === "object" ? args : { intent: "UNKNOWN" };
  const source = String(a.source || "unknown");
  const element = String(a.element || "");
  const intent = String(a.intent || "UNKNOWN");
  const phase = String(a.phase || "");
  const intentLayer = normalizeRhizohIntentLayer(a.intentLayer, RHIZOH_INTENT_LAYER_UI);
  const correlationId = a.correlationId != null ? String(a.correlationId) : newRhizohUiCorrelationId();
  const { intent: _i, source: _s, element: _e, phase: _p, correlationId: _c, intentLayer: _l, ...rest } = a;
  const line = `[RHIZOH_UI_INTENT] layer=${intentLayer} src=${source} el=${element} intent=${intent} phase=${phase} cid=${correlationId}`;
  try {
    if (typeof console !== "undefined" && console.info) console.info(line, rest);
  } catch {
    /* noop */
  }
  emitRhizohBehaviorSignal("rhizoh.ui.intent", {
    intentLayer,
    source,
    element,
    intent,
    phase,
    correlationId,
    ...rest
  });
  return correlationId;
}

/**
 * @param {{
 *   intent?: string,
 *   outcome: string,
 *   target: string,
 *   intentLayer?: string,
 *   correlationId?: string,
 *   durationMs?: number,
 *   [key: string]: unknown
 * }} args
 */
export function emitRhizohEngineActionTrace(args) {
  const a = args && typeof args === "object" ? args : { outcome: "", target: "" };
  const intent = String(a.intent || "");
  const outcome = String(a.outcome || "");
  const target = String(a.target || "");
  const intentLayer = normalizeRhizohIntentLayer(a.intentLayer, RHIZOH_INTENT_LAYER_SYSTEM);
  const correlationId = a.correlationId != null ? String(a.correlationId) : "";
  const durationMs = typeof a.durationMs === "number" && Number.isFinite(a.durationMs) ? a.durationMs : undefined;
  const { intent: _i, outcome: _o, target: _t, correlationId: _c, durationMs: _d, intentLayer: _l, ...rest } = a;
  const line = `[RHIZOH_ENGINE_ACTION] layer=${intentLayer} intent=${intent || "—"} outcome=${outcome} target=${target} cid=${correlationId || "—"}${durationMs != null ? ` dt=${Math.round(durationMs)}ms` : ""}`;
  try {
    if (typeof console !== "undefined" && console.info) console.info(line, rest);
  } catch {
    /* noop */
  }
  emitRhizohBehaviorSignal("rhizoh.engine.action", {
    intentLayer,
    intent: intent || undefined,
    outcome,
    target,
    correlationId: correlationId || undefined,
    durationMs,
    ...rest
  });
}
