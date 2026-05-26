/**
 * Scene projection adapter (v0) — pure visual hints from world presence.
 *
 * Sınır: `worldPresenceState` **mutate edilmez**; yalnızca okunur.
 * Çıktı: fogDensity, ambientTint (RGB 0–1), castleAuraIntensity, castleMetabolicPulse — Cesium/Three/DOM burada yok.
 *
 * @see docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md
 */

/**
 * @typedef {{ r: number, g: number, b: number }} Rgb01
 * @typedef {{
 *   fogDensity: number,
 *   ambientTint: Rgb01,
 *   castleAuraIntensity: number,
 *   castleMetabolicPulse: number
 * }} ProjectionHintsV0
 */

/** @returns {ProjectionHintsV0} */
function neutralHintsV0() {
  return {
    fogDensity: 0.22,
    ambientTint: { r: 0.55, g: 0.62, b: 0.72 },
    castleAuraIntensity: 0.45,
    castleMetabolicPulse: 0.45
  };
}

/**
 * @param {string} weatherType
 * @param {number} luminosity 0–1
 * @returns {Rgb01}
 */
function ambientTintFromWeatherV0(weatherType, luminosity) {
  const lum = Math.min(1, Math.max(0, luminosity));
  const w = String(weatherType || "unknown").toLowerCase();
  if (w === "rain") {
    return { r: 0.38 + lum * 0.08, g: 0.45 + lum * 0.1, b: 0.58 + lum * 0.12 };
  }
  if (w === "clouds") {
    return { r: 0.48 + lum * 0.1, g: 0.52 + lum * 0.08, b: 0.6 + lum * 0.06 };
  }
  if (w === "clear") {
    return { r: 0.72 + (1 - lum) * 0.08, g: 0.78 + (1 - lum) * 0.06, b: 0.9 };
  }
  return { r: 0.52 + lum * 0.12, g: 0.58 + lum * 0.1, b: 0.68 + lum * 0.08 };
}

/**
 * Pure: world presence snapshot → projection hints (atmosferik kanıt, şov değil).
 * @param {unknown} worldPresenceState
 * @returns {ProjectionHintsV0}
 */
export function deriveProjectionHintsV0(worldPresenceState) {
  if (!worldPresenceState || typeof worldPresenceState !== "object") return neutralHintsV0();
  const s = /** @type {Record<string, unknown>} */ (worldPresenceState);
  const atm = s.atmosphere && typeof s.atmosphere === "object" ? /** @type {Record<string, unknown>} */ (s.atmosphere) : {};
  const amb = s.ambient && typeof s.ambient === "object" ? /** @type {Record<string, unknown>} */ (s.ambient) : {};

  const fogDiff = typeof atm.fogDiffusion === "number" ? atm.fogDiffusion : 0.35;
  const drift = typeof atm.driftBloom === "number" ? atm.driftBloom : 0.2;
  const vis = typeof atm.visibilityBudget === "number" ? atm.visibilityBudget : 0.7;
  const aura = typeof atm.auraIntensity === "number" ? atm.auraIntensity : 0.45;

  const fogDensity = Math.min(1, Math.max(0, fogDiff * 0.72 + drift * 0.18 + (1 - vis) * 0.12));
  const castleAuraIntensity = Math.min(1, Math.max(0, aura * (0.92 - fogDensity * 0.18)));
  const metabolic = Math.min(1, Math.max(0, aura * 0.55 + vis * 0.25 + drift * 0.2));

  const lum = typeof amb.luminosity === "number" ? amb.luminosity : 0.5;
  const weatherType = String(amb.weatherType || "unknown");
  const ambientTint = ambientTintFromWeatherV0(weatherType, lum);

  return { fogDensity, ambientTint, castleAuraIntensity, castleMetabolicPulse: metabolic };
}

const HOST_PROPS = [
  "--rhizoh-proj-fog-density",
  "--rhizoh-proj-aura",
  "--rhizoh-proj-metabolic",
  "--rhizoh-proj-tint-r",
  "--rhizoh-proj-tint-g",
  "--rhizoh-proj-tint-b"
];

/**
 * @param {HTMLElement | null} host
 * @param {ProjectionHintsV0} hints
 */
export function applyProjectionHintsToHostV0(host, hints) {
  if (!host || !hints) return;
  const { r, g, b } = hints.ambientTint;
  host.style.setProperty("--rhizoh-proj-fog-density", hints.fogDensity.toFixed(4));
  host.style.setProperty("--rhizoh-proj-aura", hints.castleAuraIntensity.toFixed(4));
  host.style.setProperty("--rhizoh-proj-metabolic", hints.castleMetabolicPulse.toFixed(4));
  host.style.setProperty("--rhizoh-proj-tint-r", r.toFixed(4));
  host.style.setProperty("--rhizoh-proj-tint-g", g.toFixed(4));
  host.style.setProperty("--rhizoh-proj-tint-b", b.toFixed(4));
}

/** @param {HTMLElement | null} host */
export function clearProjectionHintsFromHostV0(host) {
  if (!host) return;
  for (const p of HOST_PROPS) host.style.removeProperty(p);
}

/**
 * Tek "Castle" aura yüzeyi — ince glow; cyberpunk overload yok.
 * @param {HTMLElement | null} el
 * @param {ProjectionHintsV0} hints
 */
export function applyProjectionHintsToCastleAuraSurfaceV0(el, hints) {
  if (!el || !hints) return;
  const m = typeof hints.castleMetabolicPulse === "number" ? hints.castleMetabolicPulse : hints.castleAuraIntensity;
  const a = hints.castleAuraIntensity;
  const fog = hints.fogDensity;
  const spread = 16 + m * 42 + a * 10;
  const alpha = 0.09 + m * 0.2 + a * 0.06;
  const blur = 8 + fog * 14;
  el.style.boxShadow = `0 0 ${spread}px rgba(34,211,238,${alpha.toFixed(3)}), 0 0 ${blur}px rgba(168,85,247,${(0.04 + a * 0.06).toFixed(3)})`;
  el.style.transition = "box-shadow 1.4s ease-out, opacity 1.4s ease-out";
  el.style.opacity = String(Math.min(0.98, 0.82 + m * 0.08 + a * 0.06 - fog * 0.06));
}

/** @param {HTMLElement | null} el */
export function clearCastleAuraSurfaceHintsV0(el) {
  if (!el) return;
  el.style.removeProperty("box-shadow");
  el.style.removeProperty("opacity");
  el.style.removeProperty("transition");
}
