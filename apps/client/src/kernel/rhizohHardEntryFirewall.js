/**
 * GAP 3 — Sert giriş: validate → permit → run ayrımı; permit olmadan yan etkili çalıştırıcı çalışmaz.
 */

import { evaluateRhizohPreApplyGate, RHIZOH_GUARANTEE_TIER } from "./rhizohRuntimeGuarantees.js";

/**
 * İki aşamalı permit defteri — tek kullanımlık token; run çağrısı permit’i tüketir.
 */
export function createRhizohHardEntryFirewall() {
  let activePermit = null;

  return {
    invalidate() {
      activePermit = null;
    },

    /**
     * Yalnızca doğrulama; run yok.
     * @param {{ ok: boolean, detail?: string }} validationResult
     */
    validateOnly(validationResult) {
      activePermit = null;
      if (!validationResult?.ok) {
        return Object.freeze({
          permitted: false,
          reason: validationResult?.detail ?? "validation_failed",
          permitToken: null
        });
      }
      const token = Object.freeze({
        kind: "rhizoh_hard_entry_permit",
        nonce: `${Date.now().toString(36)}_${(Math.random() * 1e9) | 0}`
      });
      activePermit = token;
      return Object.freeze({ permitted: true, reason: null, permitToken: token });
    },

    /**
     * Token aktif permit ile referans eşitliği — aynı nesne olmalı.
     * @param {object | null} permitToken
     * @param {() => unknown} runFn
     */
    runIfPermitted(permitToken, runFn) {
      if (typeof runFn !== "function" || !permitToken || permitToken !== activePermit) {
        return Object.freeze({
          executed: false,
          reason: "hard_gate_denied_no_valid_permit"
        });
      }
      activePermit = null;
      try {
        const result = runFn();
        return Object.freeze({ executed: true, reason: null, result });
      } catch (err) {
        return Object.freeze({
          executed: false,
          reason: "runner_threw",
          error: err
        });
      }
    }
  };
}

/**
 * Pre-apply gate + tek çağrıda koş — permit defteri olmadan policy choke point.
 * @param {object | null | undefined} frameState
 */
export function withRhizohHardExecutionGate(frameState, tier, runFn) {
  const gate = evaluateRhizohPreApplyGate(frameState, { tier });
  if (!gate.execute) {
    return Object.freeze({
      executed: false,
      gate,
      result: null
    });
  }
  const result = typeof runFn === "function" ? runFn() : null;
  return Object.freeze({
    executed: true,
    gate,
    result
  });
}

export { RHIZOH_GUARANTEE_TIER };
