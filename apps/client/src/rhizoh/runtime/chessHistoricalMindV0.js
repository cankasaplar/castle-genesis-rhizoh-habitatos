/**
 * Historical chess minds — decision bias presets (not lore-only).
 * RESEARCH-ONLY layer.
 */

export const CHESS_HISTORICAL_MIND_SCHEMA_V0 = "rhizoh.chess_historical_mind.v0";
const LS_KEY_V0 = "rhizoh.chess_historical_mind.v0";

export const CHESS_HISTORICAL_MIND_V0 = Object.freeze({
  RHIZOH: "rhizoh",
  KASPAROV: "kasparov",
  FISCHER: "fischer",
  CARLSEN: "carlsen",
  ANAND: "anand"
});

/** @type {Record<string, object>} */
const MIND_PRESETS_V0 = Object.freeze({
  [CHESS_HISTORICAL_MIND_V0.RHIZOH]: Object.freeze({
    id: CHESS_HISTORICAL_MIND_V0.RHIZOH,
    labelTr: "Rhizoh (öğrenen)",
    labelEn: "Rhizoh (learning)",
    aggressionBias: 0,
    winForcingMult: 1,
    riskPenaltyMult: 1,
    contemptOffset: 0,
    styleTr: "Denge + öğrenme ağırlığı",
    styleEn: "Balance + learning weights"
  }),
  [CHESS_HISTORICAL_MIND_V0.KASPAROV]: Object.freeze({
    id: CHESS_HISTORICAL_MIND_V0.KASPAROV,
    labelTr: "Kasparov",
    labelEn: "Kasparov",
    aggressionBias: 0.45,
    winForcingMult: 1.25,
    riskPenaltyMult: 0.7,
    contemptOffset: 18,
    styleTr: "Agresif hesaplama, dinamik saldırı",
    styleEn: "Aggressive calculation, dynamic attack"
  }),
  [CHESS_HISTORICAL_MIND_V0.FISCHER]: Object.freeze({
    id: CHESS_HISTORICAL_MIND_V0.FISCHER,
    labelTr: "Fischer",
    labelEn: "Fischer",
    aggressionBias: 0.35,
    winForcingMult: 1.2,
    riskPenaltyMult: 0.75,
    contemptOffset: 14,
    styleTr: "Derin hazırlık, net hedef",
    styleEn: "Deep prep, clear objective"
  }),
  [CHESS_HISTORICAL_MIND_V0.CARLSEN]: Object.freeze({
    id: CHESS_HISTORICAL_MIND_V0.CARLSEN,
    labelTr: "Carlsen",
    labelEn: "Carlsen",
    aggressionBias: 0.1,
    winForcingMult: 1.15,
    riskPenaltyMult: 0.55,
    contemptOffset: 8,
    styleTr: "Oyunsonu baskınlığı, düşük riskli çevirme",
    styleEn: "Endgame dominance, low-risk conversion"
  }),
  [CHESS_HISTORICAL_MIND_V0.ANAND]: Object.freeze({
    id: CHESS_HISTORICAL_MIND_V0.ANAND,
    labelTr: "Anand",
    labelEn: "Anand",
    aggressionBias: 0.2,
    winForcingMult: 1.05,
    riskPenaltyMult: 0.8,
    contemptOffset: 6,
    styleTr: "Hız + uyum, pratik seçim",
    styleEn: "Speed + adaptability, practical choice"
  })
});

/**
 * @param {string} [raw]
 */
export function normalizeChessHistoricalMindV0(raw) {
  const v = String(raw || "").trim().toLowerCase();
  return MIND_PRESETS_V0[v] ? v : CHESS_HISTORICAL_MIND_V0.RHIZOH;
}

export function listChessHistoricalMindsV0() {
  return Object.freeze(Object.values(MIND_PRESETS_V0).map((m) => Object.freeze({ ...m })));
}

export function getChessHistoricalMindV0(id) {
  const key = normalizeChessHistoricalMindV0(id);
  return Object.freeze({ ...MIND_PRESETS_V0[key] });
}

export function readChessHistoricalMindIdV0() {
  if (typeof window === "undefined") return CHESS_HISTORICAL_MIND_V0.RHIZOH;
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    if (!raw) return CHESS_HISTORICAL_MIND_V0.RHIZOH;
    return normalizeChessHistoricalMindV0(JSON.parse(raw)?.mindId);
  } catch {
    return CHESS_HISTORICAL_MIND_V0.RHIZOH;
  }
}

/**
 * @param {string} mindId
 */
export function saveChessHistoricalMindIdV0(mindId) {
  const normalized = normalizeChessHistoricalMindV0(mindId);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        LS_KEY_V0,
        JSON.stringify({ schema: CHESS_HISTORICAL_MIND_SCHEMA_V0, mindId: normalized })
      );
    } catch {
      /* noop */
    }
  }
  return normalized;
}

/**
 * Blend historical mind preset with learned weights.
 */
export function resolveChessMindBlendV0(opts = {}) {
  const mind = getChessHistoricalMindV0(opts.mindId || readChessHistoricalMindIdV0());
  const weights = opts.learningWeights || null;
  const learnAgg = weights?.aggressionBias ?? 0;
  const learnWin = weights?.winForcingWeight ?? 1;
  const learnRisk = weights?.riskPenaltyWeight ?? 0.55;

  return Object.freeze({
    mindId: mind.id,
    aggressionBias: Math.max(-1, Math.min(1, mind.aggressionBias + learnAgg * 0.5)),
    winForcingMult: mind.winForcingMult * learnWin,
    riskPenaltyMult: mind.riskPenaltyMult * learnRisk,
    contemptOffset: mind.contemptOffset + Math.round(learnAgg * 10)
  });
}
