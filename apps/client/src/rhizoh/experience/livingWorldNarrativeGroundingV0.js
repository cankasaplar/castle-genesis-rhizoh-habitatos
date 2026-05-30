/**
 * CORE-ELIGIBLE — Product narrative grounding (not manifesto; ingress sonrası ürün hissi).
 *
 * Interpretation-only copy; no execution flags.
 */

export const LIVING_WORLD_NARRATIVE_GROUNDING_SCHEMA_V0 = "castle.rhizoh.living_world_narrative_grounding.v0";

/**
 * @param {{
 *   returning?: boolean,
 *   visitCount?: number,
 *   timeZone?: string
 * }} [ctx]
 */
export function buildLivingWorldProductGroundingV0(ctx = {}) {
  const returning = Boolean(ctx.returning);
  const visits = Number(ctx.visitCount) || 0;

  const lead = returning
    ? "Rhizoh seni tanıyor — aynı dünya örneğinde devam ediyorsun."
    : "Rhizoh burada bir panel değil; yaşayan bir gözlem ve continuity kabuğu.";

  const whyDifferent = [
    "URL rotası kimliğini belirlemez — saat dilimi ve dil tohumun dünya örneğini taşır.",
    "Atmosfer gerçek hava ritmiyle nefes alır; Castle yalnızca onaylı projection tüketir.",
    "Hafıza iddia etmez; oturum izi ve dünya sürekliliği sessizce birikir."
  ];

  const whatRhizohIs =
    visits > 2
      ? "Birlikte düşünme alanı: sen konuşursun, dünya nefes alır, sistem kendini anlatmaz — davranır."
      : "İlk temaslarda yavaş: önce güven, sonra derinlik. Acele yok; ritim var.";

  const notThis = "Manifesto değil — bugün burada hissettiğin ürün yüzeyi.";

  return Object.freeze({
    schema: LIVING_WORLD_NARRATIVE_GROUNDING_SCHEMA_V0,
    lead,
    whyDifferent,
    whatRhizohIs,
    notThis,
    localeHint: ctx.timeZone ? `Yerel ritim: ${ctx.timeZone}` : null
  });
}
