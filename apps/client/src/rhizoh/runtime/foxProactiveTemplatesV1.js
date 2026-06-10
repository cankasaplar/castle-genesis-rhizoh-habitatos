/**
 * FOX_PROACTIVE_TEMPLATES_V1 — deterministic fallback utterances (Rhizoh ifade katmanı değil, şablon).
 */

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {Record<string, unknown>} initiative
 */
export function buildFoxProactiveUtteranceV1(initiative) {
  const src = String(initiative?.source || "world");
  const sig = clamp01(initiative?.significance);
  const impact = String(initiative?.dominantImpact || "");

  if (src === "news" && sig >= 0.75) {
    return "Önemli bir gelişme fark ettim. İstersen kısaca aktarayım.";
  }
  if (src === "traffic") {
    return "Trafikte belirgin bir yoğunluk var — konuşmak istersen buradayım.";
  }
  if (src === "weather" && sig >= 0.6) {
    return "Hava koşullarında dikkat çeken bir değişim var. Bakmak ister misin?";
  }
  if (impact === "longTermContinuityImpact" && sig >= 0.7) {
    return "Uzun süredir taşıdığın konu hâlâ açık. Devam etmek istersen buradayım.";
  }
  if (src === "sports") {
    return "Canlı bir spor gelişmesi var. Merak edersen söyleyebilirim.";
  }
  return "Dış dünyada dikkat çekici bir şey fark ettim. İstersen paylaşırım.";
}
