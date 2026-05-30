/**
 * SPECFLOW: CORE-ELIGIBLE
 *
 * Initiative layer (locked definition): **not** “start talking for no reason”.
 * It governs **conversation potential** — how much bounded social space Rhizoh may open:
 * 1) **Spontaneity** — silence thresholds, ambient load, user activity (when *may* surface).
 * 2) **Micro-intervention** — none vs soft check-in vs active steer (how much *interposes*).
 * 3) **Social energy** — observer vs guide vs host/co-creator (how *alive* the presence reads).
 *
 * Pipeline anchor: environment → presence → **initiative (this module)** → response → memory.
 */

const DEFAULT_BUDGET = 1;
const RECOVERY_PER_HOUR = 0.22;
const PING_COST = 0.18;
const MIN_BUDGET_TO_HINT = 0.28;

/**
 * @param {{ budget01?: number, lastUpdatedAt?: number, totalSpent01?: number }} prev
 * @param {{ nowMs: number, silenceMs: number, mode: string, personaId: string, allowProactiveSurface: boolean }} ctx
 * @returns {{ budget01: number, allowProactivePing: boolean, spendHint01: number, lastUpdatedAt: number }}
 */
export function computeInitiativeBudgetV0(prev, ctx) {
  const nowMs = Math.max(0, Number(ctx.nowMs) || 0);
  const prevBudget = Math.min(1, Math.max(0, Number(prev?.budget01)));
  const safePrev = Number.isFinite(prevBudget) && prevBudget > 0 ? prevBudget : DEFAULT_BUDGET;
  const lastAt = typeof prev?.lastUpdatedAt === "number" && Number.isFinite(prev.lastUpdatedAt) ? prev.lastUpdatedAt : nowMs;
  const dtMs = Math.max(0, nowMs - lastAt);
  const recover = (RECOVERY_PER_HOUR * dtMs) / 3_600_000;
  let budget01 = Math.min(1, safePrev + recover);

  const silenceMs = Math.max(0, Number(ctx.silenceMs) || 0);
  const mode = String(ctx.mode || "IDLE");
  const personaId = String(ctx.personaId || "");
  const surface = !!ctx.allowProactiveSurface;

  let allowProactivePing = false;
  let spendHint01 = 0;

  const hostish = personaId.includes("HOST") || mode === "HOST";
  const socialish = mode === "SOCIAL_ACTIVE" || mode === "AWARE" || hostish;

  if (surface && socialish && budget01 >= MIN_BUDGET_TO_HINT) {
    if (hostish && silenceMs > 55_000) {
      allowProactivePing = true;
      spendHint01 = PING_COST;
    } else if (!hostish && silenceMs > 120_000 && budget01 > 0.45) {
      allowProactivePing = true;
      spendHint01 = PING_COST * 0.85;
    }
  }

  return {
    budget01: Math.round(budget01 * 1000) / 1000,
    allowProactivePing,
    spendHint01: Math.round(spendHint01 * 1000) / 1000,
    lastUpdatedAt: nowMs
  };
}

/**
 * Turn kapandığında bütçeyi gerçekten düşür (persist sonrası çağrılır).
 * @param {{ budget01?: number }} prev
 * @param {{ spent01: number }} ev
 */
export function applyInitiativeSpendV0(prev, ev) {
  const b = Math.min(1, Math.max(0, Number(prev?.budget01)));
  const s = Math.min(0.6, Math.max(0, Number(ev?.spent01) || 0));
  return { budget01: Math.round(Math.max(0, b - s) * 1000) / 1000 };
}

export const INITIATIVE_DEFAULT_STATE_V0 = Object.freeze({
  budget01: DEFAULT_BUDGET,
  lastUpdatedAt: 0,
  totalSpent01: 0
});
