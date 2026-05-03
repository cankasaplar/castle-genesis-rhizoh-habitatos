/**
 * Kişisel bağ grafı — her aktör için trust / familiarity / resonance.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {Record<string, unknown>} bondGraph
 * @param {{
 *   operatorId: string,
 *   operatorLabel: string,
 *   trust: number,
 *   familiarity: number,
 *   assistantSnippet?: string
 * }} input
 */
export function mergeBondGraphFromTurn(bondGraph, input) {
  const id = String(input.operatorId || "local-operator");
  const label = String(input.operatorLabel || id).slice(0, 48);
  const base = bondGraph && typeof bondGraph === "object" ? { ...bondGraph } : {};
  const prev =
    base[id] && typeof base[id] === "object"
      ? base[id]
      : { trust: 0.42, familiarity: 0.18, resonance: 0.48, label };

  const trustIn = clamp01(input.trust);
  const famIn = clamp01(input.familiarity);
  const t = clamp01(Number(prev.trust) * 0.9 + trustIn * 0.1);
  const f = clamp01(Number(prev.familiarity) * 0.9 + famIn * 0.1);
  let res = clamp01(Number(prev.resonance ?? 0.48));
  if (input.assistantSnippet && String(input.assistantSnippet).trim().length > 0) {
    res = clamp01(res * 0.97 + 0.06);
  }

  base[id] = {
    trust: Math.round(t * 1000) / 1000,
    familiarity: Math.round(f * 1000) / 1000,
    resonance: Math.round(res * 1000) / 1000,
    label
  };
  return base;
}

/**
 * Çoklu özne için yer tutucu — ileride peer listesinden doldurulur.
 * @param {Record<string, unknown>} bondGraph
 * @param {{ id: string, label: string }[]} participants
 */
export function seedBondStubs(bondGraph, participants) {
  const g = bondGraph && typeof bondGraph === "object" ? { ...bondGraph } : {};
  for (const p of participants || []) {
    const id = String(p?.id || "").trim();
    if (!id || g[id]) continue;
    g[id] = {
      trust: 0.38,
      familiarity: 0.12,
      resonance: 0.4,
      label: String(p.label || id).slice(0, 48)
    };
  }
  return g;
}
