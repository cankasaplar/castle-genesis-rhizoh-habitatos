/**
 * vNext-551 — Collective Narrative Arbitration Kernel
 *
 * Çok kullanıcı + tek ghost alanı: çatışan intent → birleşik presence, gerilim dengesi,
 * “hangi gerçeklik kazanır” seçimi, ortak episode hafızası budama önerisi.
 *
 * Wake bütçesi / FSM burada tüketilmez; yalnızca ipuçları ve birleştirilmiş snapshot üretir.
 *
 * Entegrasyon: `wakeEconomy.wakeThresholdDelta` değerini intent öncesi taban eşiğe ekleyin;
 * `mergedPresence` tek `UserPresenceSnapshot` olarak `CastleSceneSync` / `onHabitatFrame` beslemesi.
 */

import { mergeCollectivePresenceSnaps } from "./ghostCollectivePresenceV549.js";

/**
 * @typedef {object} CollectiveParticipant
 * @property {string} [id]
 * @property {import("./userPresenceLoopV548.js").UserPresenceSnapshot} snapshot
 * @property {number} [weight01] katılım ağırlığı [0–1], varsayılan 1
 */

/**
 * @typedef {"field" | "ghost" | "crowd" | "plural_soft"} DominantNarrativeLane
 */

/**
 * @typedef {object} CollectiveNarrativeVerdict
 * @property {DominantNarrativeLane} dominantLane
 * @property {number} crowdPressure01 kalabalık birleşik baskı
 * @property {number} ghostPushback01 hayalet direnç vektörü
 * @property {number} conflictEntropy01 ilçe / intent yayılımı (0 düşük, 1 yüksek çatışma)
 * @property {number} tension01 crowd vs ghost (0 denge, pozitif = kalabalık önde)
 */

/**
 * @typedef {object} CollectiveWakeEconomyHint
 * @property {number} wakeThresholdDelta taban eşiğe eklenecek stres (arbitraj)
 * @property {boolean} softenOracleNudge çoğul çatışmada oracle talebini yumuşat
 */

/**
 * @typedef {object} CollectiveArbitrationInput
 * @property {CollectiveParticipant[]} participants
 * @property {number} [ghostResistance01]
 * @property {import("./ghostEvolution.js").GhostEvolutionStageId} [ghostStage]
 * @property {string | null} [fieldPreferredDistrictId] habitat / contradiction odağı
 */

/**
 * @typedef {object} CollectiveArbitrationOutput
 * @property {import("./userPresenceLoopV548.js").UserPresenceSnapshot | null} mergedPresence
 * @property {CollectiveNarrativeVerdict} verdict
 * @property {CollectiveWakeEconomyHint} wakeEconomy
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {import("./ghostEvolution.js").GhostEvolutionStageId | undefined} stage
 */
function stageGhostBias(stage) {
  if (stage === "Oracle" || stage === "Mythic") return 0.1;
  if (stage === "Hatchling") return -0.06;
  return 0;
}

/**
 * Ağırlıklı çoklu presence birleştirici (549’daki oylamayı weight ile ölçekler).
 * @param {CollectiveParticipant[]} participants
 * @returns {import("./userPresenceLoopV548.js").UserPresenceSnapshot | null}
 */
export function mergeWeightedCollectivePresence(participants) {
  if (!participants?.length) return null;
  const scaled = participants.map((p) => {
    const w = p.weight01 != null && Number.isFinite(p.weight01) ? clamp01(p.weight01) : 1;
    const s = p.snapshot;
    return {
      focusedDistrictId: s.focusedDistrictId,
      interactionEnergy01: s.interactionEnergy01 * w,
      wakeAffinity01: s.wakeAffinity01 * w,
      presenceWeight01: s.presenceWeight01 * w,
      oracleNudgeConsumed: s.oracleNudgeConsumed
    };
  });
  return mergeCollectivePresenceSnaps(scaled);
}

/**
 * İlçe oylarının normalize entropisi (çatışma göstergesi).
 * @param {CollectiveParticipant[]} participants
 */
export function computeIntentConflictEntropy(participants) {
  if (!participants?.length) return 0;
  /** @type {Map<string, number>} */
  const votes = new Map();
  let mass = 0;
  for (const p of participants) {
    const id = p.snapshot?.focusedDistrictId;
    if (!id) continue;
    const w = (p.weight01 != null ? clamp01(p.weight01) : 1) * (0.4 + p.snapshot.presenceWeight01 * 0.6);
    votes.set(id, (votes.get(id) ?? 0) + w);
    mass += w;
  }
  if (mass < 1e-6) return 0;
  let h = 0;
  for (const v of votes.values()) {
    const p = v / mass;
    if (p > 1e-8) h -= p * Math.log(p);
  }
  const hMax = Math.log(Math.max(2, votes.size));
  return votes.size <= 1 ? 0 : clamp01(h / hMax);
}

/**
 * @param {CollectiveParticipant[]} participants
 */
function computeCrowdPressure01(participants) {
  if (!participants.length) return 0;
  let s = 0;
  let wsum = 0;
  for (const p of participants) {
    const w = p.weight01 != null ? clamp01(p.weight01) : 1;
    const x =
      p.snapshot.interactionEnergy01 * 0.38 +
      p.snapshot.wakeAffinity01 * 0.32 +
      p.snapshot.presenceWeight01 * 0.22;
    s += x * w;
    wsum += w;
  }
  const mean = wsum > 0 ? s / wsum : 0;
  const nBoost = Math.min(1.35, 1 + (participants.length - 1) * 0.07);
  return clamp01(mean * nBoost);
}

/**
 * @param {CollectiveArbitrationInput} input
 * @returns {CollectiveArbitrationOutput}
 */
export function arbitrateCollectiveNarrative(input) {
  const participants = input.participants?.filter((p) => p?.snapshot) ?? [];
  const ghostR = clamp01(input.ghostResistance01 ?? 0.5);
  const stageB = stageGhostBias(input.ghostStage);

  if (!participants.length) {
    return {
      mergedPresence: null,
      verdict: {
        dominantLane: "field",
        crowdPressure01: 0,
        ghostPushback01: clamp01(ghostR + stageB),
        conflictEntropy01: 0,
        tension01: 0
      },
      wakeEconomy: { wakeThresholdDelta: 0, softenOracleNudge: false }
    };
  }

  const conflictEntropy01 = computeIntentConflictEntropy(participants);
  const crowdPressure01 = computeCrowdPressure01(participants);
  const ghostPushback01 = clamp01(ghostR * (0.88 + stageB) + stageB * 0.35 + conflictEntropy01 * 0.08);
  const tension01 = clamp01(crowdPressure01 - ghostPushback01 * 0.92);

  /** @type {DominantNarrativeLane} */
  let dominantLane = "crowd";
  if (conflictEntropy01 > 0.62 && ghostPushback01 > 0.48) {
    dominantLane = "ghost";
  } else if (tension01 < 0.12 && participants.length > 1 && conflictEntropy01 > 0.35) {
    dominantLane = "plural_soft";
  } else if (ghostPushback01 > crowdPressure01 * 1.08 && conflictEntropy01 > 0.4) {
    dominantLane = "ghost";
  } else if (input.fieldPreferredDistrictId && conflictEntropy01 > 0.55 && ghostPushback01 > 0.42) {
    dominantLane = "field";
  }

  let mergedPresence = mergeWeightedCollectivePresence(participants);
  if (!mergedPresence) {
    return {
      mergedPresence: null,
      verdict: {
        dominantLane: "field",
        crowdPressure01,
        ghostPushback01,
        conflictEntropy01,
        tension01
      },
      wakeEconomy: {
        wakeThresholdDelta: clamp01(tension01 * 0.05 + conflictEntropy01 * 0.045),
        softenOracleNudge: participants.length > 2 && conflictEntropy01 > 0.5
      }
    };
  }

  const softenOracleNudge =
    participants.length > 2 && (conflictEntropy01 > 0.52 || (mergedPresence.oracleNudgeConsumed && tension01 > 0.38));

  let oracleNudgeConsumed = mergedPresence.oracleNudgeConsumed;
  if (softenOracleNudge) oracleNudgeConsumed = false;

  let focusedDistrictId = mergedPresence.focusedDistrictId;
  if (dominantLane === "field" && input.fieldPreferredDistrictId) {
    focusedDistrictId = input.fieldPreferredDistrictId;
  }
  if (dominantLane === "ghost" && input.fieldPreferredDistrictId && conflictEntropy01 > 0.45) {
    focusedDistrictId = input.fieldPreferredDistrictId;
  }

  mergedPresence = Object.freeze({
    ...mergedPresence,
    focusedDistrictId,
    oracleNudgeConsumed,
    interactionEnergy01: clamp01(mergedPresence.interactionEnergy01 * (softenOracleNudge ? 0.92 : 1)),
    wakeAffinity01: clamp01(mergedPresence.wakeAffinity01 * (softenOracleNudge ? 0.9 : 1))
  });

  const wakeThresholdDelta = clamp01(tension01 * 0.055 + conflictEntropy01 * 0.048);

  return {
    mergedPresence,
    verdict: Object.freeze({
      dominantLane,
      crowdPressure01,
      ghostPushback01,
      conflictEntropy01,
      tension01
    }),
    wakeEconomy: Object.freeze({
      wakeThresholdDelta,
      softenOracleNudge
    })
  };
}

/**
 * Ortak episode listesi: yoğunluk + zaman sönümü ile budama (kopya üretmez; yeni dizi döner).
 * @param {import("./ghostEpisodeMemoryV547.js").GhostEpisodeEntry[]} entries
 * @param {object} [opts]
 * @param {number} [opts.nowMs]
 * @param {number} [opts.maxKeep]
 * @param {number} [opts.halfLifeMs]
 */
export function pruneSharedEpisodeMemory(entries, opts = {}) {
  if (!entries?.length) return [];
  const now = opts.nowMs ?? Date.now();
  const maxKeep = opts.maxKeep ?? 28;
  const halfLifeMs = opts.halfLifeMs ?? 420_000;

  /** @param {import("./ghostEpisodeMemoryV547.js").GhostEpisodeEntry} e */
  function kindMul(e) {
    if (e.kind === "wake_climax") return 1.15;
    if (e.kind === "oracle_shift") return 1.05;
    return 1;
  }

  const scored = entries.map((e) => {
    const age = Math.max(0, now - e.t);
    const decay = Math.exp(-age / halfLifeMs);
    const score = e.intensity01 * decay * kindMul(e);
    return { e, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const kept = scored.slice(0, maxKeep).map((x) => x.e);
  kept.sort((a, b) => a.t - b.t);
  return Object.freeze(kept);
}
