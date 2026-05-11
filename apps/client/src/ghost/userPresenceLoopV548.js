/**
 * vNext-548 — Kullanıcı varlık döngüsü: izleyici → ghost / wake / ton / ilçe üzerinde etki.
 *
 * UI veya input katmanı `setFocus`, `pulseInteraction`, `requestOracleNudge` ile besler;
 * intent + narrator bu snapshot'ı okur.
 */

/** @typedef {"calm" | "tense" | "oracle" | "awe"} GhostNarrationTone */

/**
 * @typedef {object} UserPresenceSnapshot
 * @property {string | null} focusedDistrictId
 * @property {number} interactionEnergy01 son etkileşim yoğunluğu (sönümlenir)
 * @property {number} wakeAffinity01 kullanıcının dram/oracle eğilimi [0–1]
 * @property {number} presenceWeight01 odak gücü [0–1]
 * @property {boolean} oracleNudgeConsumed bu karede tek seferlik oracle isteği işlendi mi (dışarı okuma)
 */

/**
 * @param {object} [opts]
 * @param {number} [opts.interactionDecayPerSec]
 * @param {number} [opts.wakeAffinityDecayPerSec]
 * @param {number} [opts.defaultPresenceWeight]
 */
export function createUserPresenceLoop(opts = {}) {
  const interactionDecayPerSec = opts.interactionDecayPerSec ?? 1.35;
  const wakeAffinityDecayPerSec = opts.wakeAffinityDecayPerSec ?? 0.55;
  const defaultPresenceWeight = opts.defaultPresenceWeight ?? 0.72;

  /** @type {string | null} */
  let focusedDistrictId = null;
  let interactionEnergy01 = 0;
  let wakeAffinity01 = 0;
  let presenceWeight01 = defaultPresenceWeight;
  /** tek karelik: intent tick içinde tüketilir */
  let pendingOracleNudge = false;

  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  return {
    /**
     * @param {string | null} districtId
     * @param {number} [weight01] odak gücü; verilmezse önceki presenceWeight korunur
     */
    setFocus(districtId, weight01) {
      focusedDistrictId = districtId;
      if (typeof weight01 === "number" && Number.isFinite(weight01)) {
        presenceWeight01 = clamp01(weight01);
      }
    },

    /** @param {number} strength01 */
    pulseInteraction(strength01) {
      const s = clamp01(strength01);
      interactionEnergy01 = clamp01(interactionEnergy01 + s * (1 - interactionEnergy01 * 0.35));
    },

    /** @param {number} [amount01] */
    biasWakeAffinity(amount01 = 0.34) {
      wakeAffinity01 = clamp01(wakeAffinity01 + amount01);
    },

    /** Kullanıcı “oracle / climax” isteği — bir sonraki snapshot’ta işaretlenir */
    requestOracleNudge() {
      pendingOracleNudge = true;
    },

    /**
     * @param {number} nowMs
     * @param {number} dtSec
     */
    tick(nowMs, dtSec) {
      const dt = Math.max(0, Math.min(0.1, dtSec));
      const e = Math.exp(-interactionDecayPerSec * dt);
      interactionEnergy01 *= e;
      const w = Math.exp(-wakeAffinityDecayPerSec * dt);
      wakeAffinity01 *= w;
      if (interactionEnergy01 < 1e-4) interactionEnergy01 = 0;
      if (wakeAffinity01 < 1e-4) wakeAffinity01 = 0;
    },

    /**
     * @param {number} [_nowMs]
     * @returns {UserPresenceSnapshot}
     */
    snapshot(_nowMs = 0) {
      const oracleNudge = pendingOracleNudge;
      pendingOracleNudge = false;
      return Object.freeze({
        focusedDistrictId,
        interactionEnergy01,
        wakeAffinity01,
        presenceWeight01,
        oracleNudgeConsumed: oracleNudge
      });
    },

    reset() {
      focusedDistrictId = null;
      interactionEnergy01 = 0;
      wakeAffinity01 = 0;
      presenceWeight01 = defaultPresenceWeight;
      pendingOracleNudge = false;
    }
  };
}

/**
 * Kullanıcı + habitat tonunu birleştir (narration).
 * @param {GhostNarrationTone} fieldTone
 * @param {UserPresenceSnapshot} snap
 * @param {number} [ghostResistance01] vNext-549 — yüksek = hayalet tonu korur
 */
export function mergeNarrationToneWithPresence(fieldTone, snap, ghostResistance01 = 0) {
  if (!snap) return fieldTone;
  const r = Math.max(0, Math.min(1, ghostResistance01));

  if (snap.oracleNudgeConsumed) {
    if (r >= 0.84) return fieldTone;
    return /** @type {const} */ ("oracle");
  }
  const affTh = 0.62 + r * 0.14;
  if (snap.wakeAffinity01 > affTh && fieldTone === "calm") return /** @type {const} */ ("tense");
  const enTh = 0.55 + r * 0.14;
  if (snap.interactionEnergy01 > enTh && (fieldTone === "calm" || fieldTone === "awe")) {
    return /** @type {const} */ ("tense");
  }
  return fieldTone;
}

/**
 * İlçe vurgusu: habitat seçimi ile kullanıcı odağını harmanlar.
 * @param {string | null} habitatPick
 * @param {UserPresenceSnapshot} snap
 * @param {"idle" | "rising" | "peak" | "decay"} wakePhase
 * @param {number} [ghostResistance01] vNext-549 — yüksek = habitat seçimi korunur
 */
export function mergeEmphasisDistrictWithPresence(habitatPick, snap, wakePhase, ghostResistance01 = 0) {
  if (!snap?.focusedDistrictId || snap.presenceWeight01 < 0.2) return habitatPick;
  if (wakePhase === "rising" || wakePhase === "peak") return habitatPick;

  const r = Math.max(0, Math.min(1, ghostResistance01));
  const blend01 = Math.min(1, snap.presenceWeight01 * 0.62 + snap.interactionEnergy01 * 0.38);
  const effectiveBlend = blend01 * (1 - r * 0.62);
  const threshold = 0.42 + r * 0.22;
  if (effectiveBlend > threshold) return snap.focusedDistrictId;
  return habitatPick;
}
