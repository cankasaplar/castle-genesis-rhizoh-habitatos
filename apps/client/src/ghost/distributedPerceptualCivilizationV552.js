/**
 * vNext-552 — Distributed perceptual civilization layer (entegrasyon eşiği)
 *
 * - Paylaşılan wake ekonomisi (oturum havuzu, çoklu kullanıcı)
 * - Ghost ↔ kalabalık müzakere turu (yield / phase)
 * - 551 arbitraj çıktısı ile tek kare kompozisyonu
 *
 * Yerel `createWakeBudgetGate` ile birlikte: havuz “oturum payı”, gate “hayalet içi sınır”.
 */

import { arbitrateCollectiveNarrative } from "./collectiveNarrativeArbitrationV551.js";

const MS_PER_MIN = 60_000;

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @typedef {"resist" | "accede" | "bridge"} GhostNegotiationPhase
 */

/**
 * @typedef {object} GhostNegotiationOutcome
 * @property {GhostNegotiationPhase} negotiationPhase
 * @property {number} ghostYield01 hayaletin kalabalığa verdiği yol [0–1]
 * @property {number} crowdSatisfaction01 gerilim sonrası çözülme hissi [0–1]
 * @property {number} presenceScaleMul birleşik presence ölçeği (müzakere sonrası)
 */

/**
 * @typedef {object} SharedWakePoolState
 * @property {number} creditsPerMinute pencere başına toplam kredi
 * @property {number} majorWakeCost büyük wake maliyeti
 * @property {number} spentLastWindow son 60s harcanan
 * @property {number} remainingCredits kalan
 */

/**
 * Oturum genelinde paylaşılan wake kredisi (birden fazla kullanıcı aynı “medeniyet” havuzunu yer).
 * @param {object} [opts]
 * @param {number} [opts.creditsPerMinute] örn. 5
 * @param {number} [opts.majorWakeCost] örn. 2
 */
export function createSharedWakeEconomyPool(opts = {}) {
  const creditsPerMinute = opts.creditsPerMinute ?? 5;
  const majorWakeCost = opts.majorWakeCost ?? 2;

  /** @type {{ t: number, cost: number, userId: string }[]} */
  let ledger = [];

  function prune(nowMs) {
    const cut = nowMs - MS_PER_MIN;
    ledger = ledger.filter((l) => l.t > cut);
  }

  return {
    tick(nowMs) {
      prune(nowMs);
    },

    spentInWindow(nowMs) {
      prune(nowMs);
      return ledger.reduce((s, l) => s + l.cost, 0);
    },

    remainingCredits(nowMs) {
      return Math.max(0, creditsPerMinute - this.spentInWindow(nowMs));
    },

    /**
     * Büyük wake rezervasyonu (FSM rising başlamadan önce çağrılabilir).
     * @param {number} nowMs
     * @param {string} [userId]
     * @returns {{ ok: boolean, reason?: string }}
     */
    tryCommitMajorWake(nowMs, userId = "anon") {
      prune(nowMs);
      if (this.remainingCredits(nowMs) < majorWakeCost) {
        return { ok: false, reason: "shared_pool_exhausted" };
      }
      ledger.push({ t: nowMs, cost: majorWakeCost, userId: String(userId) });
      return { ok: true };
    },

    /** @param {number} nowMs */
    getState(nowMs) {
      prune(nowMs);
      return /** @type {SharedWakePoolState} */ ({
        creditsPerMinute,
        majorWakeCost,
        spentLastWindow: this.spentInWindow(nowMs),
        remainingCredits: this.remainingCredits(nowMs)
      });
    },

    reset() {
      ledger = [];
    }
  };
}

/**
 * Ghost ↔ crowd tek tur müzakere (arbitraj sonrası).
 * @param {object} p
 * @param {import("./collectiveNarrativeArbitrationV551.js").CollectiveNarrativeVerdict} p.verdict
 * @param {number} p.ghostResistance01 genome direnci [0–1]
 */
export function ghostNegotiationRound(p) {
  const v = p.verdict;
  const r = clamp01(p.ghostResistance01 ?? v.ghostPushback01);

  /** @type {GhostNegotiationPhase} */
  let negotiationPhase = "bridge";
  if (v.dominantLane === "ghost" && v.conflictEntropy01 > 0.34) negotiationPhase = "resist";
  else if (v.dominantLane === "crowd" && v.tension01 > 0.24) negotiationPhase = "accede";
  else if (v.dominantLane === "plural_soft") negotiationPhase = "bridge";

  const ghostYield01 = clamp01(
    v.tension01 * (0.52 - r * 0.26) + v.conflictEntropy01 * (0.2 - r * 0.09) + (negotiationPhase === "accede" ? 0.16 : 0)
  );

  const crowdSatisfaction01 = clamp01(
    (1 - r) * 0.32 + v.crowdPressure01 * 0.44 + (negotiationPhase === "accede" ? 0.2 : negotiationPhase === "bridge" ? 0.12 : 0.06)
  );

  const presenceScaleMul = clamp01(0.76 + ghostYield01 * 0.34 + (negotiationPhase === "bridge" ? 0.06 : 0));

  return Object.freeze({
    negotiationPhase,
    ghostYield01,
    crowdSatisfaction01,
    presenceScaleMul
  });
}

/**
 * @param {import("./userPresenceLoopV548.js").UserPresenceSnapshot | null} snap
 * @param {number} mul
 */
function scaleNegotiatedPresence(snap, mul) {
  if (!snap) return null;
  const m = clamp01(mul);
  return Object.freeze({
    ...snap,
    interactionEnergy01: clamp01(snap.interactionEnergy01 * m),
    wakeAffinity01: clamp01(snap.wakeAffinity01 * m),
    presenceWeight01: clamp01(snap.presenceWeight01 * (0.88 + m * 0.12))
  });
}

/**
 * @typedef {object} PerceptualCivilizationFrame
 * @property {import("./collectiveNarrativeArbitrationV551.js").CollectiveArbitrationOutput} arbitration
 * @property {GhostNegotiationOutcome} negotiation
 * @property {import("./userPresenceLoopV548.js").UserPresenceSnapshot | null} mergedPresence
 * @property {number} wakeThresholdDelta toplam eşik düzeltmesi (arbitraj + havuz baskısı)
 * @property {boolean} softenOracleNudge
 * @property {{ ok: boolean, reason?: string, remainingCredits?: number }} majorWakeReservation
 */

/**
 * Tek kare: arbitraj + müzakere + isteğe bağlı paylaşık havuz uygunluğu.
 *
 * @param {object} ctx
 * @param {import("./collectiveNarrativeArbitrationV551.js").CollectiveArbitrationInput} ctx.arbitrationInput
 * @param {number} ctx.ghostResistance01
 * @param {number} ctx.nowMs
 * @param {ReturnType<typeof createSharedWakeEconomyPool>} [ctx.sharedWakePool]
 * @param {boolean} [ctx.attemptMajorWakeReservation] true ise havuzdan major wake düşer
 * @param {string} [ctx.reservationUserId]
 * @returns {PerceptualCivilizationFrame}
 */
export function composePerceptualCivilizationFrame(ctx) {
  const arbitration = arbitrateCollectiveNarrative(ctx.arbitrationInput);
  const negotiation = ghostNegotiationRound({
    verdict: arbitration.verdict,
    ghostResistance01: ctx.ghostResistance01
  });

  const mergedPresence = scaleNegotiatedPresence(arbitration.mergedPresence, negotiation.presenceScaleMul);

  let majorWakeReservation = /** @type {PerceptualCivilizationFrame["majorWakeReservation"]} */ ({ ok: true });
  if (ctx.sharedWakePool) {
    ctx.sharedWakePool.tick(ctx.nowMs);
    const rem = ctx.sharedWakePool.remainingCredits(ctx.nowMs);
    if (ctx.attemptMajorWakeReservation) {
      majorWakeReservation = ctx.sharedWakePool.tryCommitMajorWake(ctx.nowMs, ctx.reservationUserId);
      if (!majorWakeReservation.ok) {
        majorWakeReservation = { ...majorWakeReservation, remainingCredits: rem };
      }
    } else {
      majorWakeReservation = {
        ok: rem >= (ctx.sharedWakePool.getState(ctx.nowMs).majorWakeCost ?? 2),
        remainingCredits: rem
      };
    }
  }

  let wakeThresholdDelta = arbitration.wakeEconomy.wakeThresholdDelta;
  if (!majorWakeReservation.ok) {
    wakeThresholdDelta = clamp01(wakeThresholdDelta + 0.065);
  }

  return Object.freeze({
    arbitration,
    negotiation,
    mergedPresence,
    wakeThresholdDelta,
    softenOracleNudge: arbitration.wakeEconomy.softenOracleNudge,
    majorWakeReservation
  });
}

export { arbitrateCollectiveNarrative };
