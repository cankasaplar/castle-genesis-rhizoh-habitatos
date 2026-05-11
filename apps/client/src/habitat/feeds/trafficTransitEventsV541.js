/**
 * vNext-541 — Traffic / transit / events: optional HTTP + deterministic Istanbul-ish rhythm (no API pile-up).
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * İstanbul saati yaklaşımı: yerel wall-clock (tarayıcı TZ); TR odaklı ürün için sunucu tarafı TZ tercih edilir.
 * @param {number} [now]
 */
export function trafficRushFallback(now = Date.now()) {
  const h = new Date(now).getHours();
  let t = 0.38;
  if ((h >= 8 && h <= 10) || (h >= 17 && h <= 20)) t = 0.78;
  if (h >= 22 || h <= 5) t = 0.22;
  return clamp01(t + Math.sin(now / 3.6e6) * 0.04);
}

/**
 * @param {number} [now]
 */
export function transitCommuterPulseFallback(now = Date.now()) {
  const h = new Date(now).getHours();
  const dow = new Date(now).getDay();
  const weekend = dow === 0 || dow === 6 ? 0.12 : 0;
  let t = 0.48 + weekend;
  if ((h >= 7 && h <= 9) || (h >= 16 && h <= 20)) t += 0.22;
  return clamp01(t + Math.sin(now / 2.8e6) * 0.05);
}

/**
 * @param {number} [now]
 */
export function eventsCrowdFallback(now = Date.now()) {
  const dow = new Date(now).getDay();
  const h = new Date(now).getHours();
  const weekend = dow === 5 || dow === 6 ? 0.18 : 0;
  const evening = h >= 19 && h <= 23 ? 0.12 : 0;
  return clamp01(0.36 + weekend + evening + Math.sin(now / 4.2e6) * 0.06);
}

/**
 * Şebeke / altyapı sağlığı proxy (0 = ağır latent stress, 1 = rahat).
 * Düşük frekanslı, uzun periyot sinüs — gerçek grid API yokken ritim.
 * @param {number} [now]
 */
export function gridInfrastructureHealthFallback(now = Date.now()) {
  const slow = Math.sin(now / 8.64e7) * 0.09 + Math.sin(now / 1.728e8) * 0.06;
  return clamp01(0.74 + slow);
}

/**
 * GET JSON: { intensity: number } veya { traffic01: number } veya düz sayı gövdesi.
 * @param {string | undefined} url
 * @param {AbortSignal} [signal]
 * @param {() => number} fallback
 */
export async function fetchOptionalNormalized01(url, signal, fallback) {
  if (!url || typeof url !== "string") return fallback();
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return fallback();
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      if (typeof j === "number" && Number.isFinite(j)) return clamp01(j);
      const x = j.intensity ?? j.traffic01 ?? j.events01 ?? j.gridHealth ?? j.grid01 ?? j.value;
      if (typeof x === "number" && Number.isFinite(x)) return clamp01(x);
    }
    const txt = await res.text();
    const n = Number(txt.trim());
    if (Number.isFinite(n)) return clamp01(n);
  } catch {
    /* use fallback */
  }
  return fallback();
}
