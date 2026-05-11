/**
 * vNext-549 (ön katman) — Ghost direnci: kullanıcı baskısı “dominance collapse” etmesin.
 *
 * Genome + evrim aşaması → resistance01 [0–1]. Yüksek = alan/ghost otonomisi daha çok korunur.
 */

/**
 * @param {import("./ghostGenome.js").GhostGenome} genome
 * @param {import("./ghostEvolution.js").GhostEvolutionStageId} [stage]
 * @returns {number} 0–1
 */
export function computeGhostResistance01(genome, stage) {
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const res = genome.resilience ?? 0.5;
  const wis = genome.wisdom ?? 0.5;
  const bond = genome.sovereignBond ?? 0.5;
  const calm = genome.calm ?? 0.5;
  const play = genome.playfulness ?? 0.5;
  const cur = genome.curiosity ?? 0.5;
  const scar = genome.scarTension ?? 0;

  const spine = clamp01(
    0.17 + res * 0.26 + wis * 0.19 + bond * 0.15 + calm * 0.09 - play * 0.13 - cur * 0.09
  );
  const scarLift = scar * 0.13;

  let stageBias = 0;
  if (stage === "Oracle" || stage === "Mythic") stageBias = 0.08;
  else if (stage === "Hatchling") stageBias = -0.08;

  return clamp01(spine + scarLift + stageBias);
}

/**
 * Wake skoruna eklenen kullanıcı katkı çarpanı.
 * @param {number} resistance01
 */
export function userWakeBoostGainMul(resistance01) {
  const r = Math.max(0, Math.min(1, resistance01));
  return Math.max(0.2, 1 - r * 0.76);
}

/**
 * Oracle nudge’ın idle wake tabanı — dirençli ghost daha az “otomatik sıçratır”.
 * @param {number} resistance01
 */
export function oracleNudgeWakeFloor(resistance01) {
  const r = Math.max(0, Math.min(1, resistance01));
  return Math.max(0.34, 0.53 - r * 0.24);
}

/**
 * Sessizlik bypass: çok dirençli hayalet kullanıcı “zorlamasını” kısmen reddeder.
 * @param {number} resistance01
 * @returns {boolean}
 */
export function oracleNudgeAllowsBypass(resistance01) {
  return resistance01 < 0.78;
}
