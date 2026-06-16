/**
 * Rhizoh chess policy modes — win-prioritized vs loss-avoidance tuning.
 * RESEARCH-ONLY layer; does not touch frozen phase*.js.
 */

export const CHESS_POLICY_MODE_V0 = Object.freeze({
  AGGRESSIVE: "aggressive",
  BALANCED: "balanced",
  SAFE: "safe"
});

export const CHESS_POLICY_MODE_SCHEMA_V0 = "rhizoh.chess_policy_mode.v0";
const LS_KEY_V0 = "rhizoh.chess_policy_mode.v0";

const POLICY_TABLE_V0 = Object.freeze({
  [CHESS_POLICY_MODE_V0.AGGRESSIVE]: Object.freeze({
    labelTr: "Agresif",
    labelEn: "Aggressive",
    skillBoostWinning: 4,
    skillBoostAhead: 2,
    contemptWinning: 42,
    contemptAhead: 22,
    contemptEven: 8,
    movetimeWinningMult: 1.35,
    movetimeAheadMult: 1.12,
    depthWinningBonus: 2,
    minSkillWinning: 17
  }),
  [CHESS_POLICY_MODE_V0.BALANCED]: Object.freeze({
    labelTr: "Dengeli",
    labelEn: "Balanced",
    skillBoostWinning: 0,
    skillBoostAhead: 0,
    contemptWinning: 28,
    contemptAhead: 12,
    contemptEven: 0,
    movetimeWinningMult: 1,
    movetimeAheadMult: 1,
    depthWinningBonus: 0,
    minSkillWinning: 16
  }),
  [CHESS_POLICY_MODE_V0.SAFE]: Object.freeze({
    labelTr: "Güvenli",
    labelEn: "Safe",
    skillBoostWinning: -1,
    skillBoostAhead: 0,
    contemptWinning: 10,
    contemptAhead: 4,
    contemptEven: -6,
    movetimeWinningMult: 0.85,
    movetimeAheadMult: 0.92,
    depthWinningBonus: -1,
    minSkillWinning: 14
  })
});

/**
 * @param {string} [raw]
 */
export function normalizeChessPolicyModeV0(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === CHESS_POLICY_MODE_V0.AGGRESSIVE) return CHESS_POLICY_MODE_V0.AGGRESSIVE;
  if (v === CHESS_POLICY_MODE_V0.SAFE) return CHESS_POLICY_MODE_V0.SAFE;
  return CHESS_POLICY_MODE_V0.BALANCED;
}

export function readChessPolicyModeV0() {
  if (typeof window === "undefined") return CHESS_POLICY_MODE_V0.BALANCED;
  try {
    const raw = window.localStorage.getItem(LS_KEY_V0);
    if (!raw) return CHESS_POLICY_MODE_V0.BALANCED;
    const parsed = JSON.parse(raw);
    return normalizeChessPolicyModeV0(parsed?.mode);
  } catch {
    return CHESS_POLICY_MODE_V0.BALANCED;
  }
}

/**
 * @param {string} mode
 */
export function saveChessPolicyModeV0(mode) {
  const normalized = normalizeChessPolicyModeV0(mode);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        LS_KEY_V0,
        JSON.stringify({ schema: CHESS_POLICY_MODE_SCHEMA_V0, mode: normalized })
      );
    } catch {
      /* noop */
    }
  }
  return normalized;
}

/**
 * @param {string} mode
 */
export function getChessPolicyProfileV0(mode) {
  const key = normalizeChessPolicyModeV0(mode);
  return POLICY_TABLE_V0[key] || POLICY_TABLE_V0[CHESS_POLICY_MODE_V0.BALANCED];
}

/**
 * Resolve Stockfish params for Rhizoh given material + policy.
 * @param {{
 *   baseSkill: number,
 *   materialLead: number,
 *   isCheck?: boolean,
 *   policyMode?: string
 * }} ctx
 */
export function resolveRhizohChessEngineParamsV0(ctx) {
  const policy = getChessPolicyProfileV0(ctx.policyMode);
  const baseSkill = Math.max(1, Math.min(20, Number(ctx.baseSkill) || 12));
  const materialLead = Number(ctx.materialLead) || 0;
  const winning = materialLead >= 3 || (materialLead >= 1 && ctx.isCheck === true);
  const ahead = materialLead > 0 && !winning;

  let skill = baseSkill;
  if (winning) skill = Math.max(policy.minSkillWinning, baseSkill + policy.skillBoostWinning);
  else if (ahead) skill = Math.min(20, baseSkill + policy.skillBoostAhead);

  let contempt = policy.contemptEven;
  if (winning) contempt = policy.contemptWinning;
  else if (ahead) contempt = policy.contemptAhead;

  const baseMovetime = winning
    ? Math.min(4200, 1200 + skill * 120)
    : Math.min(2800, 900 + baseSkill * 80);
  const movetimeMult = winning
    ? policy.movetimeWinningMult
    : ahead
      ? policy.movetimeAheadMult
      : 1;
  const movetimeMs = Math.round(baseMovetime * movetimeMult);
  const depth = 12 + Math.floor(skill / 2) + (winning ? policy.depthWinningBonus : 0);

  return Object.freeze({
    skill,
    movetimeMs,
    depth: Math.max(8, Math.min(22, depth)),
    contempt,
    winning,
    ahead,
    policyMode: normalizeChessPolicyModeV0(ctx.policyMode)
  });
}
