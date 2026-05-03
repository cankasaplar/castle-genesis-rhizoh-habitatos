/**
 * Client-side only: estimates dm/dt for proto mitosis between Observatory frames.
 * Does not mutate kernel state or continuity payloads.
 */

const protoPulseMap = new Map();

/**
 * @param {unknown[]} protos
 * @returns {Array<Record<string, unknown>>}
 */
export function enrichProtoAgentsWithPulse(protos) {
  const list = Array.isArray(protos) ? protos : [];
  const now = Date.now();
  const currentIds = new Set();
  const out = [];

  for (const p of list) {
    if (!p || typeof p !== "object") continue;
    const id = String(p.id || "");
    if (!id) continue;
    currentIds.add(id);
    const m = Math.max(0, Math.min(1, Number(p.mitosisConfidence) || 0));
    const prev = protoPulseMap.get(id);
    let dmDt = 0;
    if (prev && now > prev.t) {
      dmDt = (m - prev.m) / ((now - prev.t) / 1000);
    }
    protoPulseMap.set(id, { m, t: now });
    out.push({
      ...p,
      l10dmDt: Math.round(dmDt * 1000) / 1000
    });
  }

  for (const k of protoPulseMap.keys()) {
    if (!currentIds.has(k)) protoPulseMap.delete(k);
  }

  return out;
}
