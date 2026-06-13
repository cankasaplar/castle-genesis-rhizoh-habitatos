/**
 * Rhizoh Chess Teacher v0 — Layer 4: template-based human explanations (no LLM).
 */

export const RHIZOH_CHESS_TEACHER_SCHEMA_V0 = "rhizoh.chess_teacher.v0";

const THEME_V0 = Object.freeze({
  CENTER: "center_control",
  DEVELOPMENT: "development",
  KING_SAFETY: "king_safety",
  ENDGAME: "endgame",
  TACTICS: "tactics",
  GENERAL: "general"
});

function pickThemeV0(mistake, phase) {
  const san = String(mistake?.san || "").toLowerCase();
  const alt = String(mistake?.alternative || "").toLowerCase();
  if (phase === "endgame") return THEME_V0.ENDGAME;
  if (/^[kq]/.test(san) || /^[kq]/.test(alt)) return THEME_V0.KING_SAFETY;
  if (/^[nbc]/.test(alt) && /^[kq]/.test(san)) return THEME_V0.DEVELOPMENT;
  if (san.includes("x") || alt.includes("x")) return THEME_V0.TACTICS;
  if (/^[def]/.test(san) || /^[def]/.test(alt)) return THEME_V0.CENTER;
  return THEME_V0.GENERAL;
}

const TEMPLATES_EN_V0 = Object.freeze({
  [THEME_V0.CENTER]: (m) =>
    `After move ${m.moveNumber}, center control weakened. ${m.alternative || "A stronger continuation"} would have kept pressure in the middle.`,
  [THEME_V0.DEVELOPMENT]: (m) =>
    `Move ${m.moveNumber} (${m.san}) slowed development. Playing ${m.alternative || "a developing move"} would have brought pieces into the game sooner.`,
  [THEME_V0.KING_SAFETY]: (m) =>
    `Move ${m.moveNumber} exposed king safety. ${m.alternative || "A safer line"} was preferable.`,
  [THEME_V0.ENDGAME]: (m) =>
    `In the endgame at move ${m.moveNumber}, ${m.san} gave away precision. ${m.alternative || "A tighter move"} preserves the advantage.`,
  [THEME_V0.TACTICS]: (m) =>
    `Move ${m.moveNumber} missed a tactical idea. ${m.alternative || "Another capture or fork"} was available.`,
  [THEME_V0.GENERAL]: (m) =>
    `Move ${m.moveNumber} (${m.san}) was not the strongest choice. ${m.alternative || "The engine line"} keeps the position healthier.`
});

const TEMPLATES_TR_V0 = Object.freeze({
  [THEME_V0.CENTER]: (m) =>
    `${m.moveNumber}. hamle sonrası merkez kontrolü zayıfladı. ${m.alternative || "Daha güçlü devam"} merkezde baskıyı koruyacaktı.`,
  [THEME_V0.DEVELOPMENT]: (m) =>
    `${m.moveNumber}. hamle (${m.san}) gelişimi yavaşlattı. ${m.alternative || "Gelişim hamlesi"} taşları oyuna daha erken sokardı.`,
  [THEME_V0.KING_SAFETY]: (m) =>
    `${m.moveNumber}. hamle şah güvenliğini zayıflattı. ${m.alternative || "Daha güvenli hat"} tercih edilmeliydi.`,
  [THEME_V0.ENDGAME]: (m) =>
    `Oyun sonunda ${m.moveNumber}. hamlede ${m.san} hassasiyeti kaybettirdi. ${m.alternative || "Sıkı hamle"} avantajı korur.`,
  [THEME_V0.TACTICS]: (m) =>
    `${m.moveNumber}. hamle taktik fırsatı kaçırdı. ${m.alternative || "Başka bir taktik"} mümkündü.`,
  [THEME_V0.GENERAL]: (m) =>
    `${m.moveNumber}. hamle (${m.san}) en güçlü seçenek değildi. ${m.alternative || "Motor hattı"} konumu daha sağlıklı tutar.`
});

/**
 * @param {object} observation — from observeChessMatchV0
 * @param {{ locale?: string }} [opts]
 */
export function teachChessLessonV0(observation = {}, opts = {}) {
  const tr = opts.locale === "tr";
  const templates = tr ? TEMPLATES_TR_V0 : TEMPLATES_EN_V0;
  const topMistake = observation.mistakes?.[0] || observation.criticalMoves?.[0] || null;
  const opening = observation.openingName || "this opening";

  if (topMistake) {
    const theme = pickThemeV0(topMistake, observation.phase);
    const body = templates[theme](topMistake);
    return Object.freeze({
      schema: RHIZOH_CHESS_TEACHER_SCHEMA_V0,
      title: tr
        ? `${topMistake.moveNumber}. hamle kritik nokta`
        : `Move ${topMistake.moveNumber} turning point`,
      body,
      theme,
      alternative: topMistake.alternative || null,
      moveNumber: topMistake.moveNumber,
      opening,
      eco: observation.eco || null
    });
  }

  const praise =
    observation.winner === "local"
      ? tr
        ? `${opening} açılışında güçlü oyun. Açılış defteri güncellendi.`
        : `Strong play in the ${opening}. Opening book updated.`
      : tr
        ? `${opening} maçı kayıt altına alındı. Bir sonraki maçta gelişim ve merkez önceliğini koru.`
        : `${opening} match recorded. Next time, prioritize development and center control.`;

  return Object.freeze({
    schema: RHIZOH_CHESS_TEACHER_SCHEMA_V0,
    title: tr ? `Açılış çalışması: ${opening}` : `Opening study: ${opening}`,
    body: praise,
    theme: THEME_V0.GENERAL,
    alternative: null,
    moveNumber: null,
    opening,
    eco: observation.eco || null
  });
}
