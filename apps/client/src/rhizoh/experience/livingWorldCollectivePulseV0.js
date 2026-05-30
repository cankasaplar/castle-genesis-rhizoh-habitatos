/**
 * CORE-ELIGIBLE — Collective presence feeling (read-only; emotion only).
 *
 * No metrics, economy, or system dashboard — only “yalnız değilsin”.
 */

export const LIVING_WORLD_COLLECTIVE_PULSE_SCHEMA_V0 = "castle.rhizoh.living_world_collective_pulse.v0";

const FEELING_LINES_V0 = Object.freeze([
  "Başka izler de bu örgüde nefes alıyor — yalnız değilsin.",
  "Uzakta başka bir ritim daha var; seninkinden bağımsız ama aynı dünyada.",
  "Kolektif sessizlik de bir nabızdır — bugün hafif ve paylaşımlı.",
  "Kimse senin yerine düşünmez; ama başkaları da burada duruyor.",
  "Dünya senin örneğinde durmuyor — başka köşeler de akıyor."
]);

const RETURNING_LINES_V0 = Object.freeze([
  "Geri döndüğünde örgü seni tanıdı — yalnız değilsin.",
  "Araya giren zaman ortak ritmi bozmaz; başkaları da bekliyordu.",
  "Sen ayrıyken de nefes devam etti — yalnız kalmadın."
]);

function djb2U32(input) {
  const s = String(input || "");
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

/**
 * @param {string} worldInstanceId
 * @param {{ returning?: boolean, somethingChanged?: boolean }} [ctx]
 */
export function deriveCollectivePresenceFeelingV0(worldInstanceId, ctx = {}) {
  const d = new Date();
  const bucket = `${worldInstanceId}|${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  const h = djb2U32(`${bucket}|feeling_v0`);
  const pool = ctx.returning ? RETURNING_LINES_V0 : FEELING_LINES_V0;
  const primary = pool[h % pool.length];
  const secondary =
    ctx.somethingChanged && ctx.returning
      ? "Değişim sadece senin alanında değil — örgü de kaydı."
      : null;

  return Object.freeze({
    schema: LIVING_WORLD_COLLECTIVE_PULSE_SCHEMA_V0,
    readOnly: true,
    primary,
    secondary,
    tone: "yalniz_degilsin"
  });
}

/** @deprecated use deriveCollectivePresenceFeelingV0 */
export function deriveCollectivePulseReadOnlyV0(worldInstanceId, atMs = Date.now()) {
  const feeling = deriveCollectivePresenceFeelingV0(worldInstanceId);
  return Object.freeze({
    schema: LIVING_WORLD_COLLECTIVE_PULSE_SCHEMA_V0,
    readOnly: true,
    asOfMs: atMs,
    lines: Object.freeze([feeling.primary, feeling.secondary].filter(Boolean)),
    metrics: {},
    disclaimer: ""
  });
}
