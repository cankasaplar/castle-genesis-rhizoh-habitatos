/**
 * vNext-541 — USGS FDSN (no key) → micro-seismic activity scalar near Marmara / Istanbul.
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @param {number} [opts.hoursBack]
 */
export async function fetchUsgsMarmaraMicroseism(opts = {}) {
  const hours = opts.hoursBack ?? 24;
  const start = new Date(Date.now() - hours * 3600000).toISOString().split("T")[0];
  const url =
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}` +
    `&minlatitude=40.45&maxlatitude=41.55&minlongitude=26.0&maxlongitude=30.5` +
    `&minmagnitude=1.3&orderby=time`;

  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) throw new Error(`usgs: HTTP ${res.status}`);
  const j = await res.json();
  const feats = Array.isArray(j.features) ? j.features : [];
  let maxMag = 0;
  for (const f of feats) {
    const m = Number(f.properties?.mag ?? 0);
    if (m > maxMag) maxMag = m;
  }
  const microseism01 = clamp01(feats.length * 0.055 + maxMag * 0.09);

  return Object.freeze({
    microseism01,
    eventCount: feats.length,
    maxMagnitude: maxMag
  });
}
