/**
 * vNext-562 — Phase identity layer + collapse (reality shift) event system
 *
 * A) Her ajan için deterministik faz kimliği ve sürüklenme kişiliği (inertia / wander / coupling).
 * B) viralSync01 üst/alt eşik histerezisi ile reality_shift olayı (isteğe bağlı DOM sinyali).
 *
 * v561 ile: orchestrator çıktısı + ajan phase01 bu katmanda kişiselleştirilir; çöküş monitörü aynı viralSync beslemesini kullanır.
 * v563: `phaseConstraintKernelV563` — collapse enter veto, faz adım tavanı, coupling zarfı (merkezi izin çekirdeği).
 * v564: `phaseConstraintAdaptationV564` — veto / collapse / viral durgunluğuna göre politika uyumu.
 * v565: `phaseConstraintEquilibriumAnchorV565` — uzun dönem denge, baseline ankrajı, tick başına değişim tavanı.
 * v566: `phaseAnchorPlasticityV566` — baseline’ın yavaş öğrenmesi (meta-zaman plastisitesi).
 * v567: `phaseObservationControlCouplingV567` — triaxial gözlem → histerezisli kontrol geri beslemesi.
 * v568: `phaseObservationTrustCalibrationV568` — gözlem güveni + seçici bypass ipucu (`trustHint568`).
 * v569: `phaseTrustCalibrationDriftV569` — güven kalibrasyonunun zaman içi öğrenmesi (churn → bias).
 */

import { deterministicVolatilityNoise01 } from "./adaptiveStabilityRelaxationV558.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/** FNV-1a benzeri hafif hash (tarayıcı / test uyumlu). */
export function hashAgentKey32(agentKey) {
  let h = 2166136261 >>> 0;
  const s = String(agentKey ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * @param {string} agentId
 * @param {string} [contextSalt] örn. roomId, ghostId
 */
export function computePhaseIdentityFingerprint(agentId, contextSalt = "") {
  const h = hashAgentKey32(`${contextSalt}::${agentId}`);
  const phaseHint01 = (h % 10001) / 10000;
  const driftSeed01 = ((h >>> 11) % 10001) / 10000;
  return Object.freeze({
    fingerprintHex32: h.toString(16).padStart(8, "0"),
    phaseHint01: clamp01(phaseHint01),
    driftPersonalitySeed01: clamp01(driftSeed01)
  });
}

function wrapPhase01(p) {
  let x = Number(p) || 0;
  x %= 1;
  if (x < 0) x += 1;
  return x;
}

/**
 * Kimlik tohumundan inertia / wander / coupling türetir.
 * @param {ReturnType<typeof computePhaseIdentityFingerprint>} identity
 * @param {{ inertiaSkew01?: number, wanderSkew01?: number, couplingSkew01?: number }} [opts]
 */
export function derivePhaseDriftPersonality(identity, opts = {}) {
  const seed = identity.driftPersonalitySeed01 ?? 0.5;
  const inertia01 = clamp01(0.32 + seed * 0.48 + clamp01(opts.inertiaSkew01 ?? 0) * 0.2);
  const wanderBias01 = clamp01(0.18 + (1 - seed) * 0.55 + clamp01(opts.wanderSkew01 ?? 0) * 0.15);
  const couplingBias01 = clamp01(0.22 + seed * 0.52 + clamp01(opts.couplingSkew01 ?? 0) * 0.12);
  return Object.freeze({ inertia01, wanderBias01, couplingBias01, seed01: seed });
}

/**
 * Yerel faz: kolektif çekim + kişilik sönümü + deterministik wander.
 * @param {number} localPhase01
 * @param {number} targetPhase01 genelde v561 collectivePhase01
 * @param {ReturnType<typeof derivePhaseDriftPersonality>} personality
 * @param {number} dtSec
 * @param {number} [tickSalt]
 */
export function stepPhaseWithPersonality(localPhase01, targetPhase01, personality, dtSec, tickSalt = 0) {
  const p = wrapPhase01(localPhase01);
  const t = wrapPhase01(targetPhase01);
  let d = t - p;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  const dt = Math.max(0, Math.min(0.12, dtSec));
  const pull = d * personality.couplingBias01 * (1 - personality.inertia01) * dt * 4.2;
  const n = deterministicVolatilityNoise01(Math.floor(tickSalt + p * 1e5)) - 0.5;
  const wander = n * 0.045 * personality.wanderBias01 * Math.sqrt(dt * 60);
  return wrapPhase01(p + pull + wander);
}

/**
 * viralSync histerezisi — enter/exit reality_shift olayları.
 * @param {{
 *   enterThreshold01?: number,
 *   exitThreshold01?: number,
 *   shouldAllowEnter?: (ctx: CollapseEnterContext) => boolean,
 *   onCollapseEnterCommitted?: (ctx: CollapseEnterContext) => void
 * }} [opts]
 */
export function createRealityCollapseEventMonitor(opts = {}) {
  const enter = clamp01(opts.enterThreshold01 ?? 0.72);
  const exit = clamp01(opts.exitThreshold01 ?? 0.46);
  const exitClamped = Math.min(exit, enter - 0.06);
  const shouldAllowEnter = typeof opts.shouldAllowEnter === "function" ? opts.shouldAllowEnter : null;
  const onCollapseEnterCommitted =
    typeof opts.onCollapseEnterCommitted === "function" ? opts.onCollapseEnterCommitted : null;
  let armed = false;

  return {
    /**
     * @param {number} viralSync01 v561
     * @param {number} nowMs
     * @param {Record<string, unknown>} [meta] collectivePhase01, dispersion01, stress01, …
     * @returns {{ armed: boolean, event: null | RealityShiftEvent, vetoed?: CollapseEnterVeto }}
     */
    sample(viralSync01, nowMs, meta = {}) {
      const v = clamp01(viralSync01);
      const t = Number(nowMs) || Date.now();
      /** @type {null | RealityShiftEvent} */
      let event = null;
      if (!armed && v >= enter) {
        /** @type {CollapseEnterContext} */
        const ctx = Object.freeze({ viralSync01: v, atMs: t, ...meta });
        if (shouldAllowEnter && shouldAllowEnter(ctx) === false) {
          return Object.freeze({
            armed: false,
            event: null,
            vetoed: Object.freeze({ phase: /** @type {const} */ ("enter"), ctx })
          });
        }
        armed = true;
        event = Object.freeze({
          kind: /** @type {const} */ ("reality_shift"),
          phase: /** @type {const} */ ("enter"),
          severity01: clamp01((v - enter) / Math.max(1e-6, 1 - enter)),
          viralSync01: v,
          atMs: t,
          ...meta
        });
        onCollapseEnterCommitted?.(ctx);
      } else if (armed && v <= exitClamped) {
        armed = false;
        event = Object.freeze({
          kind: /** @type {const} */ ("reality_shift"),
          phase: /** @type {const} */ ("exit"),
          severity01: clamp01(1 - v),
          viralSync01: v,
          atMs: t,
          ...meta
        });
      }

      return Object.freeze({ armed, event });
    },

    isArmed() {
      return armed;
    },

    reset() {
      armed = false;
    }
  };
}

/**
 * @typedef {{ kind: 'reality_shift', phase: 'enter'|'exit', severity01: number, viralSync01: number, atMs: number } & Record<string, unknown>} RealityShiftEvent
 * @typedef {{ viralSync01: number, atMs: number } & Record<string, unknown>} CollapseEnterContext
 * @typedef {{ phase: 'enter', ctx: CollapseEnterContext }} CollapseEnterVeto
 */

/**
 * İsteğe bağlı: `window` üzerinde `castle:reality-shift` (test dışı).
 * @param {RealityShiftEvent} event
 */
export function emitRealityShiftWindowEvent(event) {
  if (typeof window === "undefined" || !event) return;
  try {
    window.dispatchEvent(new CustomEvent("castle:reality-shift", { detail: event }));
  } catch {
    /* noop */
  }
}
