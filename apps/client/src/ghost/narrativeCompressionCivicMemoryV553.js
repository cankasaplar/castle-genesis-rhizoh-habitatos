/**
 * vNext-553 — Narrative compression & civic memory
 *
 * Tek düz metin yerine okunabilir katmanlar; bilişsel yükü düşürür, parçalanmayı bağlar.
 * "Bugün şehir ne oldu?" → soyut öz + tarihsel konsensüs etiketleri + budanmış hafıza.
 */

import { ISTANBUL_DISTRICT_LABEL_TR } from "../scene/istanbulBiomePresetV540.js";
import { pruneSharedEpisodeMemory } from "./collectiveNarrativeArbitrationV551.js";

/**
 * @typedef {"pulse" | "tension" | "consensus" | "echo"} NarrativeStratumTier
 */

/**
 * @typedef {object} NarrativeStratum
 * @property {NarrativeStratumTier} tier
 * @property {string} text
 * @property {number} salience01 bu katmanın gösterim gücü [0–1]
 */

/**
 * @typedef {object} HistoricalConsensus
 * @property {string[]} tags sıralı etiketler (ör. uyanış, boğaz_gerilimi)
 * @property {Record<string, number>} tagWeight konsensüs ağırlıkları
 * @property {string | null} primaryDistrictId
 */

/**
 * @typedef {object} CompressedNarrativePack
 * @property {string} dayKey
 * @property {NarrativeStratum[]} strata
 * @property {string} civicOneLiner
 * @property {HistoricalConsensus} consensus
 * @property {number} cognitiveLoad01 yüksek = daha fazla katman / çatışma
 * @property {number} clarity01 düşük yük = yüksek okunabilirlik
 * @property {NarrativeStratumTier[]} recommendedVisible hangi katmanları önce göstermek iyi
 */

/**
 * @typedef {object} NarrativeCompressionInput
 * @property {string} dayKey
 * @property {import("./ghostEpisodeMemoryV547.js").GhostEpisodeEntry[]} episodeEntries
 * @property {import("./collectiveNarrativeArbitrationV551.js").CollectiveNarrativeVerdict} [verdict]
 * @property {number} [meanContradiction01]
 * @property {number} [nowMs]
 * @property {"tr" | "en"} [locale]
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {string | null | undefined} regionId
 * @param {"tr" | "en"} locale
 */
function districtLabel(regionId, locale) {
  if (!regionId) return locale === "en" ? "city mesh" : "şehir dokusu";
  if (locale === "en") return regionId;
  return ISTANBUL_DISTRICT_LABEL_TR[regionId] ?? regionId;
}

/**
 * Budanmış episode’lardan ağırlıklı tema konsensüsü.
 * @param {import("./ghostEpisodeMemoryV547.js").GhostEpisodeEntry[]} pruned
 * @param {number} [nowMs]
 */
export function formHistoricalConsensus(pruned, nowMs = Date.now()) {
  /** @type {Record<string, number>} */
  const tagWeight = {};
  /** @type {Record<string, number>} */
  const distW = {};

  const bump = (k, w) => {
    tagWeight[k] = (tagWeight[k] ?? 0) + w;
  };

  for (const e of pruned) {
    const age = Math.max(0, nowMs - e.t);
    const rec = Math.exp(-age / 380_000);
    const w = e.intensity01 * rec;

    if (e.kind === "wake_climax") bump("uyanış", w * 1.12);
    if (e.kind === "oracle_shift") bump("oracle_dalgası", w);
    if (e.kind === "branch_surge") bump("nehir_dalgalanması", w * 0.95);
    if (e.narrationTone === "tense" || e.narrationTone === "oracle") bump("ton_kırılması", w * 0.85);

    if (e.emphasizedDistrictId) {
      const id = e.emphasizedDistrictId;
      distW[id] = (distW[id] ?? 0) + w;
    }
  }

  let primaryDistrictId = /** @type {string | null} */ (null);
  let best = 0;
  for (const [id, w] of Object.entries(distW)) {
    if (w > best) {
      best = w;
      primaryDistrictId = id;
    }
  }
  if (primaryDistrictId) bump(`alan_${primaryDistrictId}`, best * 0.9);

  const tags = Object.entries(tagWeight)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => k);

  return Object.freeze({
    tags,
    tagWeight,
    primaryDistrictId
  });
}

/**
 * @param {NarrativeCompressionInput} input
 * @returns {CompressedNarrativePack}
 */
export function compressNarrativeToLayers(input) {
  const locale = input.locale ?? "tr";
  const nowMs = input.nowMs ?? Date.now();
  const pruned = pruneSharedEpisodeMemory(input.episodeEntries, { nowMs, maxKeep: 24 });
  const consensus = formHistoricalConsensus(pruned, nowMs);

  const v = input.verdict;
  const conflict = v?.conflictEntropy01 ?? 0;
  const tension = v?.tension01 ?? 0;
  const meanC = input.meanContradiction01 ?? 0;

  const wakeN = pruned.filter((e) => e.kind === "wake_climax").length;
  const cognitiveLoad01 = clamp01(conflict * 0.34 + tension * 0.28 + Math.min(1, wakeN / 5) * 0.22 + meanC * 0.18);
  const clarity01 = clamp01(1 - cognitiveLoad01 * 0.88 + (pruned.length > 0 ? 0.06 : 0));

  /** @type {NarrativeStratum[]} */
  const strata = [];

  const pulseSal = clamp01(0.55 + (1 - cognitiveLoad01) * 0.35);
  if (locale === "en") {
    strata.push({
      tier: "pulse",
      text: "Rhythm steady; the field keeps a quiet underpulse.",
      salience01: pulseSal
    });
  } else {
    strata.push({
      tier: "pulse",
      text: "Nefes düzenli; alanın altında hafif bir nabız sürüyor.",
      salience01: pulseSal
    });
  }

  if (conflict > 0.38 || tension > 0.22 || wakeN >= 2) {
    const sal = clamp01(0.4 + conflict * 0.45 + tension * 0.25);
    if (locale === "en") {
      strata.push({
        tier: "tension",
        text: "Multiple focal threads negotiate; tension is being folded, not erased.",
        salience01: sal
      });
    } else {
      strata.push({
        tier: "tension",
        text: "Çoklu odağın gerilimi müzakereyle katlanıyor; silinmiyor, sakinleşiyor.",
        salience01: sal
      });
    }
  }

  const primaryName = districtLabel(consensus.primaryDistrictId, locale);
  const lane = v?.dominantLane;
  let consensusLine =
    locale === "en"
      ? `Today the city leaned toward ${primaryName} as the readable surface of consensus.`
      : `Bugün şehir, okunabilir yüzeyde ${primaryName} eksenine yaslandı.`;

  if (lane === "plural_soft") {
    consensusLine =
      locale === "en"
        ? "Today stayed plural: no single story won—layers stayed side by side."
        : "Bugün çoğul kaldı: tek hikâye kazanmadı; katmanlar yan yana durdu.";
  } else if (lane === "ghost") {
    consensusLine =
      locale === "en"
        ? "The spirit of the city held the line; the crowd bent toward its resistance."
        : "Şehrin ruhu çizgiyi korudu; kalabalık dirence doğru eğildi.";
  } else if (lane === "crowd") {
    consensusLine =
      locale === "en"
        ? "The crowd’s pressure became the day’s main contour."
        : "Kalabalığın baskısı günün ana konturunu çizdi.";
  }

  strata.push({
    tier: "consensus",
    text: consensusLine,
    salience01: clamp01(0.62 + (1 - cognitiveLoad01) * 0.28)
  });

  if (pruned.length) {
    const top = pruned[pruned.length - 1];
    const d = districtLabel(top.emphasizedDistrictId, locale);
    const echoText =
      locale === "en"
        ? `Latest echo: ${top.kind.replace("_", " ")} near ${d} (intensity ${top.intensity01.toFixed(2)}).`
        : `Son yankı: ${d} çevresinde ${top.kind === "wake_climax" ? "uyanış" : top.kind === "oracle_shift" ? "oracle kayması" : "nehir sıçraması"} (${top.intensity01.toFixed(2)}).`;
    strata.push({
      tier: "echo",
      text: echoText,
      salience01: clamp01(0.35 + top.intensity01 * 0.4)
    });
  }

  /** @type {NarrativeStratumTier[]} */
  const recommendedVisible = ["pulse", "consensus"];
  if (cognitiveLoad01 > 0.32) recommendedVisible.push("tension");
  if (pruned.length) recommendedVisible.push("echo");

  const civicOneLiner =
    locale === "en"
      ? `What this city became today: ${consensus.tags.slice(0, 3).join(" · ") || "a quiet field"}.`
      : `Bugün şehir ne oldu: ${consensus.tags.slice(0, 3).join(" · ") || "sakin bir alan"}.`;

  return Object.freeze({
    dayKey: input.dayKey,
    strata,
    civicOneLiner,
    consensus,
    cognitiveLoad01,
    clarity01,
    recommendedVisible
  });
}

/**
 * Gün özeti — compressNarrativeToLayers için kısa alias.
 * @param {NarrativeCompressionInput} input
 */
export function abstractCityDaySummary(input) {
  return compressNarrativeToLayers(input);
}

/**
 * Gün bazlı sıkıştırılmış paketleri tutar (tarihsel konsensüs için).
 * @param {object} [opts]
 * @param {number} [opts.maxDays]
 */
export function createCivicMemoryLedger(opts = {}) {
  const maxDays = opts.maxDays ?? 14;
  /** @type {{ dayKey: string, pack: CompressedNarrativePack, ts: number }[]} */
  const buf = [];

  return {
    /**
     * @param {string} dayKey
     * @param {CompressedNarrativePack} pack
     */
    recordDay(dayKey, pack) {
      buf.push({ dayKey, pack, ts: Date.now() });
      while (buf.length > maxDays) buf.shift();
    },

    /** @param {number} [n] */
    recent(n = 7) {
      return Object.freeze(buf.slice(-n));
    },

    /** Son birkaç günün etiketlerinden yavaş konsensüs */
    rollingConsensusTags(n = 5) {
      const slice = buf.slice(-n);
      /** @type {Record<string, number>} */
      const acc = {};
      for (const row of slice) {
        for (const t of row.pack.consensus.tags) {
          acc[t] = (acc[t] ?? 0) + 1;
        }
      }
      return Object.freeze(
        Object.entries(acc)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([k]) => k)
      );
    },

    clear() {
      buf.length = 0;
    }
  };
}
