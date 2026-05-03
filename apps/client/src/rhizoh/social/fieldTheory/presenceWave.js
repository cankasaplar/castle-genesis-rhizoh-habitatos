/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

const LIFE_PHASE = {
  unknown: 0.35,
  observing: 0.42,
  tentative_label: 0.55,
  resolved: 0.72,
  trusted: 0.88
};

/**
 * Per-entity presence as ψ ≈ A·e^{iφ} (stored re/im).
 * @param {Record<string, unknown>} entities
 * @param {Record<string, unknown>} relationships
 * @param {number} nowMs
 * @param {number} [maxNodes]
 */
export function computePresenceWaves(entities, relationships, nowMs, maxNodes = 10) {
  const ent = entities && typeof entities === "object" ? entities : {};
  const rel = relationships && typeof relationships === "object" ? relationships : {};
  const ids = Object.keys(ent).slice(0, maxNodes);
  const t = (Number(nowMs) || Date.now()) * 0.00012;
  const waves = [];
  for (const id of ids) {
    const e = ent[id];
    const r = rel[id] && typeof rel[id] === "object" ? rel[id] : {};
    if (!e || typeof e !== "object") continue;
    const life = String(r.identityLifecycle || "unknown");
    const baseA = LIFE_PHASE[life] ?? 0.4;
    const idConf = clamp01(e.identityConfidence != null ? Number(e.identityConfidence) : 0.5);
    const amplitude = clamp01(0.25 + 0.75 * baseA * (0.55 + 0.45 * idConf));
    const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const phase = (t + seed * 0.017) % (Math.PI * 2);
    const re = amplitude * Math.cos(phase);
    const im = amplitude * Math.sin(phase);
    waves.push({
      entityId: id,
      amplitude: Math.round(amplitude * 1000) / 1000,
      phase: Math.round(phase * 1000) / 1000,
      re: Math.round(re * 1000) / 1000,
      im: Math.round(im * 1000) / 1000
    });
  }
  return waves;
}
