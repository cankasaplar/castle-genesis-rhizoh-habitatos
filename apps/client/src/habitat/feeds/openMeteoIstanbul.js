/**
 * vNext-541 — Open-Meteo (no API key) → normalized constitutional weather scalar [0,1].
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @param {number} [opts.latitude] default Sultanahmet area
 * @param {number} [opts.longitude]
 */
export async function fetchOpenMeteoIstanbulComposite(opts = {}) {
  const lat = opts.latitude ?? 41.0082;
  const lon = opts.longitude ?? 28.9784;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
    `&wind_speed_unit=kmh&timezone=Europe%2FIstanbul`;

  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) throw new Error(`open-meteo: HTTP ${res.status}`);
  const j = await res.json();
  const c = j.current;
  if (!c) throw new Error("open-meteo: missing current");

  const temp = Number(c.temperature_2m);
  const wind = Number(c.wind_speed_10m ?? 0);
  const precip = Number(c.precipitation ?? 0);
  const rh = Number(c.relative_humidity_2m ?? 50);
  const code = Number(c.weather_code ?? 0);

  const tempComfort = 1 - clamp01(Math.abs(temp - 19) / 14);
  const stormHint =
    clamp01(wind / 52) * 0.42 +
    clamp01(precip * 2) * 0.28 +
    (code >= 51 && code <= 99 ? 0.22 : 0) +
    (rh > 92 ? 0.12 : 0);
  const composite01 = clamp01(0.22 + tempComfort * 0.48 + (1 - stormHint) * 0.32);

  return Object.freeze({
    composite01,
    raw: Object.freeze({
      temperature2m: temp,
      windKmh: wind,
      precipitationMm: precip,
      relativeHumidity: rh,
      weatherCode: code
    })
  });
}
