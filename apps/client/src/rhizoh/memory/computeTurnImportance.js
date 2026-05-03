import { RHIZOH_INTENT } from "../router/intentTypes.js";

/**
 * Tur önem skoru I (0–1) — niyet tablosu + duygu sıçraması.
 * @param {string} intent
 * @param {{ tensionDelta?: number }} [opts]
 */
export function computeTurnImportance(intent, opts = {}) {
  const i = String(intent || "");
  const table = {
    [RHIZOH_INTENT.CRISIS]: 0.78,
    [RHIZOH_INTENT.BUILD]: 0.55,
    [RHIZOH_INTENT.CHAT]: 0.32,
    [RHIZOH_INTENT.REFLECT]: 0.62,
    [RHIZOH_INTENT.PLAY]: 0.48,
    [RHIZOH_INTENT.SILENCE]: 0.25
  };
  let I = table[i] ?? 0.35;
  const td = Number(opts.tensionDelta) || 0;
  if (td > 0.12) I += 0.1;
  if (td > 0.22) I += 0.08;
  if (td > 0.35) I += 0.06;
  return Math.min(1, Math.round(I * 1000) / 1000);
}
