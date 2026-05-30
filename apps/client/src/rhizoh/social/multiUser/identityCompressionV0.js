/**
 * SPECFLOW: RESEARCH-ONLY — **Identity compression**: persona continuity → tek cümlelik “karakter hissi”
 * (LLM / studio omurgası; uzun persona paketlerinin yerine sabit genişlikte özet).
 */

export const IDENTITY_COMPRESSION_SCHEMA_V0 = "castle.rhizoh.identity_compression_line.v0";

/**
 * @param {Record<string, unknown>|null|undefined} personaContinuity — `advancePersonaContinuityV0` çıktısı
 * @param {string|null|undefined} rhizohRuntimeRole
 * @param {{ locale?: "tr"|"en" }|null} [opts]
 * @returns {string}
 */
export function compressIdentityToCharacterLineV0(personaContinuity, rhizohRuntimeRole, opts) {
  const o = opts && typeof opts === "object" ? opts : {};
  const locale = o.locale === "en" ? "en" : "tr";
  const pc = personaContinuity && typeof personaContinuity === "object" ? personaContinuity : {};
  const band = String(pc.band || "").trim();
  const role = String(rhizohRuntimeRole || pc.lastRuntimeRole || "").trim() || "—";
  const ticks = Math.max(0, Math.floor(Number(pc.ticksInBand) || 0));
  const str = Math.min(1, Math.max(0, Number(pc.continuityStrength01) || 0));
  const pct = Math.round(str * 100);
  const mode = String(pc.socialModeEcho || "").trim();

  if (locale === "en") {
    if (band === "OBSERVER")
      return `Rhizoh holds an observer stance (${role}), light touch, continuity ${pct}% across ${ticks} beat(s).`;
    if (band === "INTERPRETER")
      return `Rhizoh is a tight interpreter bridge (${role}), continuity ${pct}%, mode ${mode || "n/a"}.`;
    if (band === "BRIDGE")
      return `Rhizoh mediates between voices (${role}), continuity ${pct}%, ${ticks} beat(s) in bridge posture.`;
    if (band === "HOST")
      return `Rhizoh hosts the thread (${role}), warm continuity ${pct}%, ${ticks} beat(s) grounded in the room.`;
    return `Rhizoh is present as ${role}, continuity forming (${pct}%).`;
  }

  if (band === "OBSERVER")
    return `Rhizoh dışarıdan izleyen, hafif dokunuşlu (${role}); süreklilik %${pct}, ${ticks} vuruş.`;
  if (band === "INTERPRETER")
    return `Rhizoh sıkı bir köprü çevirmen (${role}); süreklilik %${pct}, mod: ${mode || "—"}.`;
  if (band === "BRIDGE")
    return `Rhizoh sesleri dengeleyen arabulucu (${role}); süreklilik %${pct}, ${ticks} vuruş köprüde.`;
  if (band === "HOST")
    return `Rhizoh odayı taşıyan ev sahibi (${role}); sıcak süreklilik %${pct}, ${ticks} vuruş sahnede.`;
  return `Rhizoh ${role} olarak var; süreklilik %${pct} (kimlik oturuyor).`;
}
