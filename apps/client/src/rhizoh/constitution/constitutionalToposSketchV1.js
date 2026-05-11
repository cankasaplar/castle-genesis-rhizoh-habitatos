/**
 * RHIZOH constitutional topos sketch — RHIZOH CONSTITUTIONAL STACK v2.2.0 (U)
 * Sonlu site + doğrusal Heyting (intuitionistic / eksik bilgi toleranslı; klasik boolean değil).
 * Ω sınıflandırıcı çekirdeği, truth sheaf bileşimi, Grothendieck örtüsü, pullback (∧) semantiği.
 */

/** Katman paketi — semantic overlay U ile hizalı. */
export const RHIZOH_CONSTITUTIONAL_TOPOS_VERSION = "2.2.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Alt-nesne sınıflandırıcısı için doğrusal Heyting (Gödel) zinciri düğümleri [0,1]. */
export const RHIZOH_CONSTITUTIONAL_OMEGA_CHAIN_V1 = Object.freeze([0, 0.25, 0.5, 0.75, 1]);

/**
 * Canonical site objects — sistem “varlıkları” topos nesneleri olarak modellenir.
 * θ katmanı kimliği: `theta` (ASCII; anahtar olarak θ Unicode kullanılmaz).
 */
export const RHIZOH_CONSTITUTIONAL_SITE_OBJECTS_V1 = Object.freeze([
  "membrane",
  "claim",
  "firewall",
  "deception",
  "organism",
  "replay",
  "theta",
  "llm_surface"
]);

/** Eski uzun kimlikler → v2.2 canonical (geriye dönük layerTruth / emphasis). */
export const RHIZOH_CONSTITUTIONAL_SITE_LEGACY_TO_CANONICAL_V1 = Object.freeze({
  identity_membrane: "membrane",
  claim_contract: "claim",
  emotional_firewall: "firewall",
  deception_graph: "deception",
  organism_stress: "organism",
  replay_seal: "replay",
  theta_adapter: "theta",
  llm_surface: "llm_surface",
  membrane: "membrane",
  claim: "claim",
  firewall: "firewall",
  deception: "deception",
  organism: "organism",
  replay: "replay",
  theta: "theta"
});

/**
 * @param {string} siteObjectId
 */
export function normalizeRhizohConstitutionalSiteObjectId(siteObjectId) {
  const k = String(siteObjectId || "").trim();
  const canon =
    /** @type {Record<string, string>} */ (RHIZOH_CONSTITUTIONAL_SITE_LEGACY_TO_CANONICAL_V1)[k];
  return canon || k;
}

/**
 * LayerTruth anahtarlarını canonical forma çeker; çakışan alias’lar için ∨ (join) birleştirir.
 * @param {Record<string, number>} layerTruth
 */
export function canonicalizeRhizohConstitutionalLayerTruth(layerTruth) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const [rawKey, val] of Object.entries(layerTruth || {})) {
    const ck = normalizeRhizohConstitutionalSiteObjectId(rawKey);
    const v = clamp01(val);
    out[ck] = out[ck] != null ? heytingRhizohLinearJoin(out[ck], v) : v;
  }
  return out;
}

/**
 * Doğrusal Heyting: ∧ = min, ∨ = max, → (Gödel), ¬ crisp (eksik bilgi ile uyumlu; çift olumsuzluk zorunlu değil).
 */
export function heytingRhizohLinearMeet(a, b) {
  return Math.min(clamp01(a), clamp01(b));
}

export function heytingRhizohLinearJoin(a, b) {
  return Math.max(clamp01(a), clamp01(b));
}

export function heytingRhizohLinearImplies(a, b) {
  const x = clamp01(a);
  const y = clamp01(b);
  return x <= y ? 1 : y;
}

export function heytingRhizohLinearNegation(a) {
  const x = clamp01(a);
  return x <= 1e-9 ? 1 : 0;
}

/**
 * Ω^n için karakteristik fonksiyon — bitmask ile partial membership / truth slicing.
 * @param {number} mask bit mask
 * @param {number} nBits
 * @param {number} bitIndex 0..nBits-1
 */
export function characteristicRhizohSubobject(mask, nBits, bitIndex) {
  const nb = Math.max(1, Math.min(16, Math.floor(nBits)));
  const bi = Math.max(0, Math.min(nb - 1, Math.floor(bitIndex)));
  const bit = (Math.floor(mask) >> bi) & 1;
  return bit ? 1 : 0;
}

/**
 * Truth sheaf composition — katman doğruluklarından global Ω özeti.
 * Çıktı özü: omegaGlobal, layerMeet, impliesSelfConsistency (+ ek olarak layerJoin).
 * @param {Record<string, number>} layerTruth her anahtar [0,1]; legacy anahtarlar canonicalize edilir
 */
export function globalRhizohConstitutionalTruthSheafCombine(layerTruth) {
  const canon = canonicalizeRhizohConstitutionalLayerTruth(layerTruth || {});
  const keys = Object.keys(canon).sort();
  if (!keys.length) return { omegaGlobal: 0, layerMeet: 0, layerJoin: 0, impliesSelfConsistency: 1 };

  let meet = 1;
  let join = 0;
  const vals = [];
  for (const k of keys) {
    const v = clamp01(canon[k]);
    vals.push(v);
    meet = heytingRhizohLinearMeet(meet, v);
    join = heytingRhizohLinearJoin(join, v);
  }
  const omegaGlobal = clamp01(vals.reduce((s, v) => s + v, 0) / vals.length);
  const impliesSelfConsistency = vals.reduce((acc, v) => heytingRhizohLinearImplies(acc, v), 1);

  return {
    omegaGlobal: Math.round(omegaGlobal * 1000) / 1000,
    layerMeet: Math.round(meet * 1000) / 1000,
    layerJoin: Math.round(join * 1000) / 1000,
    impliesSelfConsistency: Math.round(impliesSelfConsistency * 1000) / 1000
  };
}

/**
 * Grothendieck örtüsü — hangi alt-sistem hangi örtü altında “geçerli / doğrulanmış” kabul edilir.
 * @param {string} siteObjectId
 */
export function grothendieckRhizohCoverageFamily(siteObjectId) {
  const base = [...RHIZOH_CONSTITUTIONAL_SITE_OBJECTS_V1];
  const id = normalizeRhizohConstitutionalSiteObjectId(String(siteObjectId || ""));
  /** @type {Record<string, ReadonlyArray<string>>} */
  const cov = {
    membrane: ["membrane", "claim", "replay"],
    claim: ["claim", "deception", "llm_surface"],
    firewall: ["firewall", "membrane"],
    deception: ["deception", "claim"],
    organism: ["organism", "membrane", "theta"],
    replay: ["replay", "claim", "deception"],
    theta: ["theta", "organism", "llm_surface"],
    llm_surface: ["llm_surface", "claim", "firewall"]
  };
  const family = cov[id];
  if (!family) return { siteObjectId: id, coveringSieve: base, note: "fallback_total_cover" };
  return { siteObjectId: id, coveringSieve: [...family] };
}

/**
 * Pullback semantiği — kısıtların Heyting ∧ ile yayılımı (mantıksal pullback).
 */
export function pullbackRhizohConstitutionalSketch(constraints) {
  const c = (constraints || []).map(clamp01);
  if (!c.length) return { pullbackTruth: 1 };
  let p = c[0];
  for (let i = 1; i < c.length; i++) p = heytingRhizohLinearMeet(p, c[i]);
  return { pullbackTruth: Math.round(p * 1000) / 1000 };
}

/**
 * Tek pakette sonlu topos iskelesi + topolojik doğruluk dağılımı özeti.
 * @param {{
 *   layerTruth?: Record<string, number>,
 *   emphasisSiteObject?: string,
 *   subobjectMask?: number,
 *   subobjectBits?: number
 * }} input
 */
export function constructRhizohConstitutionalToposSketch(input = {}) {
  const combined = globalRhizohConstitutionalTruthSheafCombine(input.layerTruth || {});
  const emphasis = normalizeRhizohConstitutionalSiteObjectId(
    input.emphasisSiteObject || "replay"
  );
  const cover = grothendieckRhizohCoverageFamily(emphasis);
  const bits = Math.max(1, Math.min(8, Math.floor(input.subobjectBits ?? 4)));
  const mask = Math.floor(input.subobjectMask ?? 0b0110);
  /** @type {number[]} */
  const chi = [];
  for (let i = 0; i < bits; i++) chi.push(characteristicRhizohSubobject(mask, bits, i));

  return {
    semanticOverlayStack: "2.2.0",
    layerId: "U_topos_sketch",
    toposSketchVersion: RHIZOH_CONSTITUTIONAL_TOPOS_VERSION,
    omegaChain: RHIZOH_CONSTITUTIONAL_OMEGA_CHAIN_V1,
    siteObjects: RHIZOH_CONSTITUTIONAL_SITE_OBJECTS_V1,
    heyting: combined,
    coverage: cover,
    subobjectCharacteristicBits: chi,
    narrative:
      "Sonlu site üzerinde doğrusal Heyting (intuitionistic) doğruluk; Ω özeti + örtü geçerlilik alanları + ∧ pullback."
  };
}
