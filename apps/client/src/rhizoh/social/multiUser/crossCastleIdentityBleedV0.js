/**
 * SPECFLOW: RESEARCH-ONLY — **Cross-castle identity bleed control**: federasyon / birleşik roster’ta
 * kaynak kale ayrımı zayıfladığında LLM’e açık “kimlik izolasyon” direktifi (operator biyografisini
 * uzaktan peer ile karıştırmayı engelleme).
 *
 * `globalCastleDiffReducerV0` roster satırlarına `sourceCastleId` yazar; bu modül bunu okur.
 */

export const CROSS_CASTLE_IDENTITY_BLEED_SCHEMA_V0 = "castle.rhizoh.cross_castle_identity_bleed.v0";

/**
 * @param {{
 *   wsRoom?: { roster?: unknown[] } | null,
 *   castlePeers?: unknown[],
 *   operatorUserId?: string
 * }|null|undefined} ctx
 */
export function evaluateCrossCastleIdentityBleedV0(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const roster = c.wsRoom && typeof c.wsRoom === "object" && Array.isArray(c.wsRoom.roster) ? c.wsRoom.roster : [];
  const peers = Array.isArray(c.castlePeers) ? c.castlePeers : [];
  const op = String(c.operatorUserId || "").trim();

  /** @type {Set<string>} */
  const castles = new Set();
  let remoteFacing = 0;
  for (const raw of roster) {
    const r = raw && typeof raw === "object" ? raw : {};
    const sc = String(r.sourceCastleId || "").trim();
    if (sc) castles.add(sc);
    const uid = String(r.userId || r.id || "").trim();
    if (op && uid && uid !== op) remoteFacing += 1;
  }

  const nCastles = castles.size;
  const peerN = peers.length;
  let bleedRisk01 = 0;
  if (nCastles >= 2) bleedRisk01 += 0.34;
  if (nCastles >= 3) bleedRisk01 += 0.22;
  if (peerN >= 4) bleedRisk01 += 0.18;
  if (remoteFacing >= 3) bleedRisk01 += 0.14;
  bleedRisk01 = Math.round(Math.min(1, Math.max(0, bleedRisk01)) * 1000) / 1000;

  let identityIsolationDirective = "";
  if (bleedRisk01 >= 0.55) {
    identityIsolationDirective =
      "Çok kale kaynağı: operatörün kişisel özeti ile uzak kale konuşmacılarının iddialarını birleştirme; her iddia için kaynak kale ve kullanıcıyı açıkça ayır.";
  } else if (nCastles >= 2) {
    identityIsolationDirective =
      "Birden fazla kale kaynağı var; Rhizoh kimliğini bu oturumun ev kale operatörüne sabitle, federasyon konuklarını ayrı hat olarak tut.";
  } else if (peerN >= 3) {
    identityIsolationDirective =
      "Kalabalık oda: odak kullanıcı ile gölge dinleyicileri karıştırma; dönüşleri tek iş parçacığında tut.";
  }

  /** Federasyon / çok kale için hafıza & persona kökeni (Federation Identity Law — ilk katman). */
  let memoryAttributionHint = "";
  if (nCastles >= 2) {
    memoryAttributionHint =
      "Hafıza ve anlatı iddiaları: ev kale operatörünün sürekliliği ile diğer kalelerden gelen sinyalleri ayrı kanallarda tut; uzak kale içeriğini operatörün biyografik hafızasına mal etme.";
  } else if (peerN >= 2) {
    memoryAttributionHint =
      "Çok kullanıcı: kimin hangi cümleyi taşıdığını açık tut; toplu sohbet hafızasını tek kişiye yedirme.";
  }

  return {
    schema: CROSS_CASTLE_IDENTITY_BLEED_SCHEMA_V0,
    bleedRisk01,
    distinctSourceCastles: nCastles,
    remoteRosterFaces: remoteFacing,
    identityIsolationDirective,
    memoryAttributionHint
  };
}
