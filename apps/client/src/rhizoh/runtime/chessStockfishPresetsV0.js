/**
 * Stockfish strength presets — arena default should beat casual humans.
 */
export const CHESS_STOCKFISH_PRESET_V0 = Object.freeze({
  WARMUP: Object.freeze({ skill: 5, movetimeMs: 600, depth: 8 }),
  TEACHER_BACKUP: Object.freeze({ skill: 8, movetimeMs: 1400, depth: 10, elo: 1258 }),
  ARENA: Object.freeze({ skill: 18, movetimeMs: 2200, depth: 14 }),
  STRONG: Object.freeze({ skill: 20, movetimeMs: 3500, depth: 16 }),
  MAX: Object.freeze({ skill: 20, movetimeMs: 5000, depth: 18 })
});

/**
 * Map Rhizoh civilization ELO → Stockfish skill (learned player grows stronger).
 * @param {number} elo
 */
export function stockfishSkillFromEloV0(elo) {
  const e = Number(elo) || 1200;
  if (e < 1000) return 4;
  if (e < 1300) return 8;
  if (e < 1500) return 12;
  if (e < 1700) return 15;
  if (e < 1900) return 17;
  if (e < 2100) return 19;
  return 20;
}
