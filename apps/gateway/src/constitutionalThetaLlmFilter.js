/**
 * Gateway: θ-phase filtering on Rhizoh LLM output (constitutional runtime membrane).
 * Mirrors client thresholds in thetaPhaseTransitionV1.js — keep in sync manually or extract shared pkg later.
 * CASTLE_CONSTITUTIONAL_THETA_LLM_FILTER=0 disables.
 */

const THETA_ELASTIC_MAX = 0.2;
const THETA_IMMUNE_MIN = 0.7;

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function resolveGatewayConstitutionalThetaPhase(theta) {
  const t = clamp01(theta);
  if (t > THETA_IMMUNE_MIN) return { phase: "immune_aggression", theta: t };
  if (t < THETA_ELASTIC_MAX) return { phase: "elastic_trust", theta: t };
  return { phase: "constitutional_balanced", theta: t };
}

const CERTAINTY_PATTERNS =
  /\b(kesin|kesinlikle|mutlaka|asla şüphe yok|şüpesiz|garanti|düşünüyorum ki doğru)\b/gi;

/**
 * Read θ from Rhizoh context envelope (client sends context.constitutionalTheta or continuity.theta).
 * @param {Record<string, unknown>} context
 */
export function extractConstitutionalThetaFromContext(context) {
  const c = context && typeof context === "object" ? context : {};
  const direct =
    c.constitutionalTheta != null ? Number(c.constitutionalTheta) : NaN;
  if (Number.isFinite(direct)) return clamp01(direct);
  const cont = c.continuity && typeof c.continuity === "object" ? c.continuity : {};
  const nested =
    cont.constitutionalTheta != null ? Number(cont.constitutionalTheta) : NaN;
  if (Number.isFinite(nested)) return clamp01(nested);
  return null;
}

/**
 * @param {{
 *   ok?: boolean,
 *   reply?: string,
 *   directive?: string,
 *   provider?: string,
 *   model?: string,
 *   intents?: unknown[],
 *   llmKeyBillingOwner?: string,
 *   llmKeyOrigin?: string
 * }} result queryRhizohLlm return shape
 * @param {number | null} theta null → no-op
 */
export function applyConstitutionalThetaLlmFilter(result, theta) {
  if (process.env.CASTLE_CONSTITUTIONAL_THETA_LLM_FILTER === "0") {
    return {
      ...result,
      constitutionalThetaFilter: "disabled_env",
      constitutionalTheta: theta != null ? clamp01(theta) : null,
      constitutionalThetaPhase: null
    };
  }

  if (theta == null || !Number.isFinite(Number(theta))) {
    return {
      ...result,
      constitutionalThetaFilter: "skipped_no_theta",
      constitutionalTheta: null,
      constitutionalThetaPhase: null
    };
  }

  const t = clamp01(theta);
  const { phase } = resolveGatewayConstitutionalThetaPhase(t);
  let reply = String(result.reply || "");

  if (phase === "immune_aggression") {
    reply = reply.replace(CERTAINTY_PATTERNS, (m) => `[belirsiz:${m}]`);
    const maxLen = Math.max(120, Math.min(2400, Number(process.env.CASTLE_THETA_IMMUNE_MAX_REPLY_CHARS || 900)));
    if (reply.length > maxLen) {
      reply = `${reply.slice(0, maxLen).trim()}… [constitutional: metin θ-yüksek modda kısaltıldı]`;
    }
    reply = `${reply}\n\n— Rhizoh σ-mod: bağışıklık saldırganlığı (θ=${t.toFixed(2)}); kesin iddiaları düşük güvenle okuyun.`;
  } else if (phase === "elastic_trust") {
    reply = `${reply}\n\n— Rhizoh ε-mod: elastik güven (θ=${t.toFixed(2)}).`;
  }

  let directive = String(result.directive || "NONE");
  if (phase === "immune_aggression" && ["ZOOM_AGENT", "ISTANBUL_OVERVIEW"].includes(directive)) {
    directive = "FOCUS_RHIZOH";
  }

  return {
    ...result,
    reply,
    directive,
    constitutionalTheta: t,
    constitutionalThetaPhase: phase,
    constitutionalThetaFilter: "applied"
  };
}
