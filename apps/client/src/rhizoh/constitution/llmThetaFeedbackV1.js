/**
 * RHIZOH LLM surface → constitutional stress bump for the next tick (closed loop hint).
 */

export const RHIZOH_LLM_THETA_FEEDBACK_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

const BELIRSIZ_RE = /\[belirsiz:/gi;
const SIGMA_FOOTER_RE = /Rhizoh\s+σ-mod/i;
const EPSILON_FOOTER_RE = /Rhizoh\s+ε-mod/i;
const TRUNC_MARK_RE = /constitutional:\s*metin\s*θ-yüksek\s+modda\s+kısaltıldı/i;

/**
 * @param {{
 *   replyText?: string | null,
 *   constitutionalThetaPhase?: string | null,
 *   constitutionalThetaFilter?: string | null
 * }} input
 */
export function estimateRhizohLlmThetaStressFeedback(input) {
  const replyText = String(input.replyText || "");
  const phase = input.constitutionalThetaPhase || null;
  const filterApplied = input.constitutionalThetaFilter === "applied";

  let bump = 0;
  const belirsizMatches = replyText.match(BELIRSIZ_RE);
  const belirsizCount = belirsizMatches ? belirsizMatches.length : 0;
  bump += Math.min(0.04, belirsizCount * 0.008);
  if (TRUNC_MARK_RE.test(replyText)) bump += 0.025;
  if (SIGMA_FOOTER_RE.test(replyText)) bump += 0.015;
  if (EPSILON_FOOTER_RE.test(replyText)) bump += 0.008;
  if (phase === "immune_aggression" && filterApplied) bump += 0.012;

  const stressBump = clamp01(bump);
  return {
    stressBump,
    thetaDeltaHint: stressBump > 0 ? Math.round(stressBump * 120) / 1000 : 0,
    components: {
      belirsizCount,
      phase,
      filterApplied,
      hadTruncationMark: TRUNC_MARK_RE.test(replyText)
    }
  };
}
