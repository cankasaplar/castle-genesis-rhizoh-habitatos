/**
 * vNext-554 — Civic memory evolution & public narrative drift control
 *
 * Günler arası hafıza evrimi, kolektif bias düzeltmesi, şehir kimliği drift takibi,
 * ghost ↔ civic memory geri beslemesi (direnç ayarı önerisi).
 */

/**
 * @typedef {import("./narrativeCompressionCivicMemoryV553.js").CompressedNarrativePack} CompressedNarrativePack
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {string[]} a
 * @param {string[]} b
 */
function jaccard01(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size && !B.size) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * İki gün paketi arası anlatı sapması.
 * @param {CompressedNarrativePack | null} prev
 * @param {CompressedNarrativePack} next
 */
export function measureNarrativeDrift(prev, next) {
  if (!prev) {
    return Object.freeze({
      tagDrift01: 0,
      clarityDelta: 0,
      loadDelta: 0,
      primaryDistrictChanged: false,
      driftMagnitude01: 0
    });
  }

  const overlap = jaccard01(prev.consensus.tags, next.consensus.tags);
  const tagDrift01 = clamp01(1 - overlap);
  const clarityDelta = next.clarity01 - prev.clarity01;
  const loadDelta = next.cognitiveLoad01 - prev.cognitiveLoad01;
  const primaryDistrictChanged = prev.consensus.primaryDistrictId !== next.consensus.primaryDistrictId;
  const driftMagnitude01 = clamp01(
    tagDrift01 * 0.42 + (primaryDistrictChanged ? 0.22 : 0) + Math.min(1, Math.abs(clarityDelta) * 1.2) * 0.18 + Math.min(1, Math.abs(loadDelta)) * 0.18
  );

  return Object.freeze({
    tagDrift01,
    clarityDelta,
    loadDelta,
    primaryDistrictChanged,
    driftMagnitude01
  });
}

/**
 * Tekrar eden etiketlere hafif bias (nostalji), uzun kuyrukta frekans tavanı (echo chamber kırma).
 * @param {Record<string, number>} tagWeight
 * @param {object} [opts]
 * @param {number} [opts.repetitionCap] aynı etiket üst sınır çarpanı
 * @param {number} [opts.noveltyBoost] yeni etiket bonusu
 */
export function manageCollectiveMemoryBias(tagWeight, opts = {}) {
  const cap = opts.repetitionCap ?? 1.35;
  const novelty = opts.noveltyBoost ?? 1.08;
  const vals = Object.values(tagWeight);
  const maxW = vals.length > 0 ? Math.max(...vals) : 1e-6;
  /** @type {Record<string, number>} */
  const out = {};
  for (const [k, w] of Object.entries(tagWeight)) {
    const norm = w / maxW;
    const damp = norm > 0.92 ? cap / (1 + (norm - 0.92) * 6) : 1;
    out[k] = w * damp;
  }
  const keys = Object.keys(out);
  if (keys.length > 6) {
    const sorted = keys.sort((a, b) => out[b] - out[a]);
    for (let i = 6; i < sorted.length; i++) {
      out[sorted[i]] *= 0.92;
    }
  }
  const outVals = Object.values(out);
  const max2 = outVals.length > 0 ? Math.max(...outVals) : 1e-6;
  for (const k of Object.keys(out)) {
    if (out[k] < max2 * 0.18) out[k] *= novelty;
  }
  return Object.freeze(out);
}

/**
 * Kimlik vektörünü EMA ile güncelle.
 * @param {Record<string, number>} ema önceki
 * @param {string[]} tags
 * @param {number} alpha [0–1] yeni gün ağırlığı
 */
export function evolveIdentityTagEma(ema, tags, alpha = 0.28) {
  const a = clamp01(alpha);
  /** @type {Record<string, number>} */
  const next = { ...ema };
  for (const k of Object.keys(next)) next[k] *= 1 - a * 0.35;
  for (const t of tags) {
    next[t] = (next[t] ?? 0) * (1 - a) + a * (1 / Math.max(1, tags.length));
  }
  let s = 0;
  for (const v of Object.values(next)) s += v;
  if (s > 1e-6) {
    for (const k of Object.keys(next)) next[k] /= s;
  }
  return Object.freeze(next);
}

/**
 * Kamusal anlatı sürüklenmesini yumuşat (ani tema zıplamasını kes).
 * @param {string} civicOneLiner
 * @param {string | null} prevSmoothed
 * @param {number} blend01 önceki cümle kelime payı
 */
export function smoothPublicOneLiner(civicOneLiner, prevSmoothed, blend01 = 0.38) {
  const mix = clamp01(blend01);
  if (!prevSmoothed) return civicOneLiner;
  if (civicOneLiner === prevSmoothed) return civicOneLiner;
  const a = prevSmoothed.split(/\s+/).filter(Boolean);
  const b = civicOneLiner.split(/\s+/).filter(Boolean);
  if (!a.length) return civicOneLiner;
  if (!b.length) return prevSmoothed;
  const headN = Math.max(1, Math.ceil(a.length * mix));
  const tailStart = Math.max(0, Math.floor(b.length * (1 - mix * 0.65)));
  const out = [...a.slice(0, headN), ...b.slice(tailStart)].join(" ");
  return out.replace(/\s+/g, " ").trim().slice(0, 280);
}

/**
 * Ghost direnci için civic drift geri beslemesi.
 * @param {number} driftMagnitude01
 * @param {number} ghostResistance01 mevcut
 * @param {number} stagnation01 çok az drift uzun süre → düşük çeşitlilik
 */
export function computeGhostResistanceFeedback(driftMagnitude01, ghostResistance01, stagnation01 = 0) {
  const d = clamp01(driftMagnitude01);
  const r = clamp01(ghostResistance01);
  const st = clamp01(stagnation01);
  let raw = 0;
  if (d > 0.55 && r < 0.72) raw += (d - 0.55) * 0.22;
  if (d < 0.12 && st > 0.45) raw -= (st - 0.45) * 0.12;
  return clamp01(r + raw) - r;
}

/**
 * @typedef {object} CivicEvolutionStepResult
 * @property {CompressedNarrativePack} packAdjusted bias uygulanmış kopya (shallow)
 * @property {ReturnType<typeof measureNarrativeDrift>} drift
 * @property {Record<string, number>} identityEma
 * @property {number} identityDrift01 kimlik vektörü hareketi
 * @property {number} ghostResistanceDelta önerilen direnç düzeltmesi
 * @property {string} smoothedCivicOneLiner
 */

/**
 * @param {object} [opts]
 * @param {number} [opts.identityAlpha]
 * @param {number} [opts.oneLinerBlend]
 * @param {number} [opts.stagnationWindowDays]
 */
export function createCivicMemoryEvolutionRuntime(opts = {}) {
  const identityAlpha = opts.identityAlpha ?? 0.26;
  const oneLinerBlend = opts.oneLinerBlend ?? 0.35;
  const stagnationWindow = opts.stagnationWindowDays ?? 5;

  /** @type {CompressedNarrativePack | null} */
  let lastPack = null;
  /** @type {Record<string, number>} */
  let identityEma = {};
  let smoothedOneLiner = /** @type {string | null} */ (null);
  /** @type {number[]} */
  let recentDrifts = [];

  return {
    /**
     * @param {CompressedNarrativePack} pack
     * @param {number} ghostResistance01
     */
    stepDay(pack, ghostResistance01) {
      const drift = measureNarrativeDrift(lastPack, pack);
      recentDrifts.push(drift.driftMagnitude01);
      while (recentDrifts.length > stagnationWindow) recentDrifts.shift();
      const meanDrift = recentDrifts.length ? recentDrifts.reduce((s, x) => s + x, 0) / recentDrifts.length : 0;
      const stagnation01 = clamp01(1 - meanDrift * 3.2);

      const prevIdentity = { ...identityEma };
      identityEma = evolveIdentityTagEma(identityEma, pack.consensus.tags, identityAlpha);
      let idMove = 0;
      for (const k of new Set([...Object.keys(prevIdentity), ...Object.keys(identityEma)])) {
        idMove += Math.abs((identityEma[k] ?? 0) - (prevIdentity[k] ?? 0));
      }
      const identityDrift01 = clamp01(idMove * 0.5);

      const biasedWeights = manageCollectiveMemoryBias({ ...pack.consensus.tagWeight });
      const adjustedConsensus = Object.freeze({
        ...pack.consensus,
        tagWeight: biasedWeights,
        tags: Object.entries(biasedWeights)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([k]) => k)
      });

      const packAdjusted = Object.freeze({
        ...pack,
        consensus: adjustedConsensus,
        civicOneLiner: pack.civicOneLiner
      });

      const smoothedCivicOneLiner = smoothPublicOneLiner(pack.civicOneLiner, smoothedOneLiner, oneLinerBlend);
      smoothedOneLiner = smoothedCivicOneLiner;

      const ghostResistanceDelta = computeGhostResistanceFeedback(drift.driftMagnitude01, ghostResistance01, stagnation01);

      lastPack = pack;
      return Object.freeze({
        packAdjusted,
        drift,
        identityEma: { ...identityEma },
        identityDrift01,
        ghostResistanceDelta,
        smoothedCivicOneLiner,
        stagnation01
      });
    },

    getIdentityEma() {
      return { ...identityEma };
    },

    reset() {
      lastPack = null;
      identityEma = {};
      smoothedOneLiner = null;
      recentDrifts = [];
    }
  };
}
