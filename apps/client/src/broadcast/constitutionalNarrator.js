/**
 * vNext-542 — Story beats → canlı anlatım (TR odaklı constitutional weather commentary).
 */

import { districtDisplayName } from "./fieldStoryEngine.js";

/**
 * @param {import("./fieldStoryEngine.js").FieldStoryBeats} beats
 * @param {"tr" | "en"} [locale]
 * @param {object | null} [memoryHints] `createNarrationMemory().buildHints()` çıktısı
 * @param {{ narrationTone?: "calm" | "tense" | "oracle" | "awe" }} [voiceOpts] vNext-547 ghost intent
 */
export function narrateConstitutionalField(beats, locale = "tr", memoryHints = null, voiceOpts = null) {
  if (locale === "en") return narrateEn(beats);

  const tone = voiceOpts?.narrationTone ?? "calm";
  const prefix =
    tone === "tense"
      ? "Dikkat: alan sıçraması. "
      : tone === "oracle"
        ? "Oracle anı: "
        : tone === "awe"
          ? "Yankı çöküyor; nefes sürüyor. "
          : "";

  const cName = districtDisplayName(beats.peakContradictionRegionId, "Avrupa hattı");
  const mName = districtDisplayName(beats.peakMemoryRegionId, "tarihî çekirdek");
  const turb = beats.meanTurbulence;
  const truth = beats.meanTruth;
  const s = beats.sovereign || {};
  const tier = s.tier != null ? String(s.tier) : "L1";
  const drift = typeof s.drift === "number" ? s.drift.toFixed(2) : "?";
  const leg = typeof s.legitimacyResonance === "number" ? s.legitimacyResonance.toFixed(2) : "?";
  const mut = s.mutation != null ? String(s.mutation) : "sealed";

  const euroLine =
    turb > 0.55
      ? `Bu akşam Avrupa yakasında contradiction turbulence yükseliyor; en keskin düğüm ${cName}.`
      : `Avrupa yakası şu an göreli sakin; contradiction odağı ${cName} çevresinde ölçülü.`;

  const memLine =
    beats.peakMemory > 0.55
      ? `Memory echo ${mName} bölgesinde yoğun; tarihî katmanlar yüzeye yakın.`
      : `Hafıza yankısı ${mName} üzerinde orta düzeyde; alan nefes alıyor.`;

  const recall = memoryHints?.contradictionRecall;
  let recallLine = "";
  if (recall?.regionId && recall.belowWave) {
    const dname = districtDisplayName(recall.regionId);
    const hrs = Math.max(1, Math.round(recall.hoursApprox));
    const timePhrase = hrs === 2 ? "iki saat önceki" : `${hrs} saat önceki`;
    recallLine = `${dname}'de contradiction ${timePhrase} dalganın altında;${recall.memoryPersistent ? " memory echo hâlâ sürüyor." : ""} `;
  }

  const sun = `Rhizoh merkezi: tier ${tier}, drift ${drift}, legitimacy rezonansı ${leg}, mutasyon ${mut}.`;

  const body = [euroLine, memLine, recallLine, `Ortalama truth eğilimi ${truth.toFixed(2)}; dalga türbülansı ${turb.toFixed(2)}.`, sun]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return (prefix + body).replace(/\s+/g, " ").trim();
}

/**
 * @param {import("./fieldStoryEngine.js").FieldStoryBeats} beats
 */
function narrateEn(beats) {
  const cName = districtDisplayName(beats.peakContradictionRegionId, "north corridor");
  const mName = districtDisplayName(beats.peakMemoryRegionId, "historic core");
  return `Contradiction turbulence clusters near ${cName}; memory echo is dense around ${mName}. Mean truth ${beats.meanTruth.toFixed(
    2
  )}.`;
}
