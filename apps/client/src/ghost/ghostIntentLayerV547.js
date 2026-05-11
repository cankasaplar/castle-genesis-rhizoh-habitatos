/**
 * vNext-547 — Ghost Intent: sahne denetçisi (ilçe vurgusu, oracle anı, nehir seçimi, anlatım tonu) + wake episodları.
 */

import { ISTANBUL_V540_DISTRICTS } from "../scene/istanbulBiomePresetV540.js";
import { ghostDistrictAffinity01 } from "./ghostRenderer.js";
import { scoreHabitatWake, shouldWakeImmediately } from "../habitat/runtime/wakeMoments.js";
import { buildFieldStoryBeats } from "../broadcast/fieldStoryEngine.js";
import { createGhostEpisodeMemory } from "./ghostEpisodeMemoryV547.js";
import { createWakeBudgetGate } from "./wakeBudgetGateV548.js";
import { mergeEmphasisDistrictWithPresence } from "./userPresenceLoopV548.js";
import {
  computeGhostResistance01,
  userWakeBoostGainMul,
  oracleNudgeWakeFloor,
  oracleNudgeAllowsBypass
} from "./ghostResistanceV549.js";
import { createMicroWakeLeakEngine } from "./microWakeLeakageV550.js";

/** @typedef {"idle" | "rising" | "peak" | "decay"} GhostWakePhase */

/** @typedef {"calm" | "tense" | "oracle" | "awe"} GhostNarrationTone */

/**
 * @typedef {object} GhostIntent
 * @property {string | null} emphasizedDistrictId
 * @property {boolean} oracleMomentForced
 * @property {GhostNarrationTone} narrationTone
 * @property {number} branchSurgeMul
 * @property {Partial<Record<"fork" | "merge" | "pruned" | "mainline", number>>} branchKindOpacityMul
 * @property {GhostWakePhase} wakePhase
 * @property {number} wakeIntensity01
 * @property {number} ghostResistance01 vNext-549 kullanıcı baskısına karşı otonomi [0–1]
 * @property {number} microWake01 vNext-550 arka plan sızıntısı [0–1]; bütçe / FSM dışı
 */

/**
 * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
 * @param {import("./ghostGenome.js").GhostGenome} genome
 * @param {GhostWakePhase} wakePhase
 * @param {import("../broadcast/fieldStoryEngine.js").FieldStoryBeats} beats
 */
function pickEmphasizedDistrict(frame, genome, wakePhase, beats) {
  if (wakePhase === "rising" || wakePhase === "peak") {
    return beats.peakContradictionRegionId || beats.peakMemoryRegionId;
  }
  const map = frame.regionalMap;
  let bestId = /** @type {string | null} */ (null);
  let bestW = -1;
  for (const d of ISTANBUL_V540_DISTRICTS) {
    const aff = ghostDistrictAffinity01(d.regionId, map);
    let w = aff;
    if (d.regionId === "kadikoy") w *= 0.45 + genome.playfulness * 0.75;
    if (d.regionId === "fatih") w *= 0.45 + genome.memoryDepth * 0.75;
    if (d.regionId === "besiktas" || d.regionId === "uskudar") w *= 0.88 + genome.curiosity * 0.18;
    if (d.regionId === "sisli") w *= 0.9 + genome.calm * 0.12;
    if (w > bestW) {
      bestW = w;
      bestId = d.regionId;
    }
  }
  return bestId;
}

/**
 * @param {GhostWakePhase} phase
 * @param {import("./ghostGenome.js").GhostGenome} genome
 * @returns {GhostNarrationTone}
 */
function toneForPhase(phase, genome) {
  if (phase === "rising") return "tense";
  if (phase === "peak") return "oracle";
  if (phase === "decay") return "awe";
  if (genome.scarTension > 0.58) return "tense";
  return "calm";
}

/**
 * @param {GhostWakePhase} phase
 */
function branchKindOpacityForPhase(phase) {
  if (phase === "decay") {
    return { fork: 1, merge: 1, mainline: 1, pruned: 0.45 };
  }
  if (phase === "peak") {
    return { fork: 1.05, merge: 1.05, mainline: 1.08, pruned: 1.18 };
  }
  if (phase === "rising") {
    return { fork: 1.12, merge: 1, mainline: 1.05, pruned: 1.05 };
  }
  return { fork: 1, merge: 1, mainline: 1, pruned: 1 };
}

/**
 * @param {GhostWakePhase} phase
 */
function surgeMulForPhase(phase) {
  if (phase === "idle") return 1;
  if (phase === "rising") return 1.2;
  if (phase === "peak") return 1.48;
  return 1.12;
}

/**
 * Embodiment çıktısına intent karıştır (immutable base).
 * @param {ReturnType<import("./ghostEmbodimentBridgeV546.js").computeGhostEmbodimentParams>} base
 * @param {GhostIntent | null | undefined} intent
 */
export function mergeEmbodimentWithGhostIntent(base, intent) {
  if (!intent) return base;
  const oracleMode =
    base.oracleMode || intent.oracleMomentForced || intent.wakePhase === "peak" || intent.wakePhase === "rising";
  const w = intent.wakeIntensity01;
  const surge = intent.branchSurgeMul;

  /** @type {Record<string, { scaleMul: number, opacityMul: number }>} */
  const perDistrict = {};
  for (const k of Object.keys(base.perDistrict)) {
    perDistrict[k] = { ...base.perDistrict[k] };
  }
  const em = intent.emphasizedDistrictId;
  if (em && perDistrict[em]) {
    const boost = 1 + 0.22 * (0.55 + w * 0.45);
    perDistrict[em] = {
      scaleMul: perDistrict[em].scaleMul * boost,
      opacityMul: perDistrict[em].opacityMul * (1 + w * 0.1)
    };
  }

  return Object.freeze({
    anchor: base.anchor,
    oracleMode,
    branchVisibilityMul: Math.min(1.62, base.branchVisibilityMul * surge),
    branchEmissiveMul: Math.min(1.88, base.branchEmissiveMul * (1 + w * 0.38)),
    fieldDistortionMul: Math.min(1.78, base.fieldDistortionMul * (1 + w * 0.26)),
    perDistrict,
    bosphorusDistance: base.bosphorusDistance
  });
}

/**
 * @param {object} [opts]
 * @param {number} [opts.wakeThreshold]
 * @param {number} [opts.risingMs]
 * @param {number} [opts.peakMs]
 * @param {number} [opts.decayMs]
 * @param {{ maxEntries?: number }} [opts.episode] episode ring buffer seçenekleri
 * @param {false | { maxWakePerMinute?: number, silentStabilizationMs?: number, decayHalfLifeMs?: number }} [opts.wakeBudget] vNext-548; `false` kapatır
 * @param {false | { baseLeak?: number, maxMicro?: number, staleStartMs?: number, staleMsForFull?: number }} [opts.microWake] vNext-550; `false` kapatır
 */
export function createGhostIntentController(opts = {}) {
  /** @type {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame | null} */
  let prevFrame = null;
  /** @type {string | null} */
  let lastDigestFingerprint = null;
  /** @type {GhostWakePhase} */
  let wakePhase = "idle";
  let phaseStartMs = 0;
  let wakeIntensity = 0;
  const episode = createGhostEpisodeMemory(opts.episode || {});

  const risingMs = opts.risingMs ?? 520;
  const peakMs = opts.peakMs ?? 1400;
  const decayMs = opts.decayMs ?? 4600;

  const wakeBudget = opts.wakeBudget === false ? null : createWakeBudgetGate(typeof opts.wakeBudget === "object" ? opts.wakeBudget : {});

  const microLeak =
    opts.microWake === false ? null : createMicroWakeLeakEngine(typeof opts.microWake === "object" ? opts.microWake : {});

  return {
    episode,
    wakeBudget,

    getWakePhase() {
      return wakePhase;
    },

    /**
     * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
     * @param {import("./ghostGenome.js").GhostGenome} genome
     * @param {import("./ghostEvolution.js").GhostEvolutionStageId} stage
     * @param {number} nowMs
     * @param {number} [_dtSec] reserved
     * @param {import("./userPresenceLoopV548.js").UserPresenceSnapshot | null} [presence] vNext-548
     */
    onHabitatFrame(frame, genome, stage, nowMs, _dtSec = 0.016, presence = null) {
      wakeBudget?.tick(nowMs, _dtSec);
      const ghostResistance01 = computeGhostResistance01(genome, stage);

      const fp = frame.frameFingerprint;
      const digestChanged = fp != null && fp !== lastDigestFingerprint;

      let wakeScore = 0;
      if (digestChanged && prevFrame) {
        wakeScore = scoreHabitatWake(prevFrame, frame, opts);
      }
      if (digestChanged) {
        prevFrame = frame;
        lastDigestFingerprint = fp;
      }

      let scoreForWake = wakeScore;
      let bypassStabilization = false;
      if (presence) {
        const gain = userWakeBoostGainMul(ghostResistance01);
        scoreForWake = Math.min(
          1,
          wakeScore + (presence.interactionEnergy01 * 0.1 + presence.wakeAffinity01 * 0.08) * gain
        );
        if (presence.oracleNudgeConsumed) {
          scoreForWake = Math.max(scoreForWake, oracleNudgeWakeFloor(ghostResistance01));
          bypassStabilization = oracleNudgeAllowsBypass(ghostResistance01);
        }
      }

      const baseTh = opts.wakeThreshold ?? 0.42;
      const effTh = wakeBudget ? wakeBudget.effectiveWakeThreshold(baseTh, nowMs) : baseTh;

      if (wakePhase === "idle" && shouldWakeImmediately(scoreForWake, effTh)) {
        const can = !wakeBudget || wakeBudget.canStartWake(nowMs, { bypassStabilization });
        if (can) {
          wakePhase = "rising";
          phaseStartMs = nowMs;
          wakeIntensity = scoreForWake;
          wakeBudget?.recordWakeStart(nowMs);
        }
      }

      let completedEpisodeToIdle = false;
      const elapsed = nowMs - phaseStartMs;
      if (wakePhase === "rising" && elapsed >= risingMs) {
        wakePhase = "peak";
        phaseStartMs = nowMs;
        const beats = buildFieldStoryBeats(frame);
        episode.push({
          kind: "wake_climax",
          intensity01: wakeIntensity,
          habitatFingerprint: frame.frameFingerprint,
          narrationTone: "oracle",
          emphasizedDistrictId: beats.peakContradictionRegionId,
          t: nowMs
        });
      } else if (wakePhase === "peak" && elapsed >= peakMs) {
        wakePhase = "decay";
        phaseStartMs = nowMs;
      } else if (wakePhase === "decay" && elapsed >= decayMs) {
        wakePhase = "idle";
        wakeIntensity = 0;
        completedEpisodeToIdle = true;
      }

      if (completedEpisodeToIdle) wakeBudget?.onEpisodeComplete(nowMs);

      const beats = buildFieldStoryBeats(frame);
      const habitatEmphasis = pickEmphasizedDistrict(frame, genome, wakePhase, beats);
      const emphasizedDistrictId = mergeEmphasisDistrictWithPresence(
        habitatEmphasis,
        presence,
        wakePhase,
        ghostResistance01
      );
      const narrationTone = toneForPhase(wakePhase, genome);
      const branchSurgeMul = surgeMulForPhase(wakePhase);
      const branchKindOpacityMul = branchKindOpacityForPhase(wakePhase);

      const microWake01 = microLeak
        ? microLeak.sample(frame, { wakePhase, resistance01: ghostResistance01, dtSec: _dtSec })
        : 0;

      /** @type {GhostIntent} */
      const intent = {
        emphasizedDistrictId,
        oracleMomentForced: wakePhase === "peak" || wakePhase === "rising",
        narrationTone,
        branchSurgeMul,
        branchKindOpacityMul,
        wakePhase,
        wakeIntensity01: wakeIntensity,
        ghostResistance01,
        microWake01
      };

      return Object.freeze({
        intent,
        wakeScore: scoreForWake,
        stage
      });
    },

    reset() {
      prevFrame = null;
      lastDigestFingerprint = null;
      wakePhase = "idle";
      wakeIntensity = 0;
      episode.clear();
      wakeBudget?.reset();
      microLeak?.reset();
    }
  };
}
