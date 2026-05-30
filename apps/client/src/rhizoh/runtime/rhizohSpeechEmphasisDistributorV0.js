/**
 * Speech Meaning Engine v0 — emphasis budget across segments (vurgu dağıtıcı).
 */

export const RHIZOH_SPEECH_EMPHASIS_SCHEMA_V0 = "castle.rhizoh.speech_emphasis_distributor.v0";

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {ReturnType<import("./rhizohSpeechSentenceSegmenterV0.js").segmentSpeechTextV0>} segmentation
 * @param {ReturnType<import("./rhizohSpeechMeaningDensityMapV0.js").buildMeaningDensityMapV0>} densityMap
 */
export function distributeSpeechEmphasisV0(segmentation, densityMap) {
  const segments = segmentation?.segments || [];
  const densityById = new Map(
    (densityMap?.segments || []).map((d) => [d.segmentId, d])
  );

  if (!segments.length) {
    return Object.freeze({
      schema: RHIZOH_SPEECH_EMPHASIS_SCHEMA_V0,
      segments: Object.freeze([]),
      peakEmphasis01: 0,
      emphasisBudget01: 0
    });
  }

  const raw = segments.map((seg) => {
    const dens = densityById.get(seg.id);
    let weight = dens?.density01 ?? 0.35;
    if (seg.endsWithQuestion) weight += 0.18;
    if (seg.endsWithExclaim) weight += 0.12;
    if (seg.kind === "clause") weight += 0.04;
    return { segmentId: seg.id, raw: clamp01(weight) };
  });

  const sum = raw.reduce((s, r) => s + r.raw, 0) || 1;
  const distributed = raw.map((r) =>
    Object.freeze({
      segmentId: r.segmentId,
      emphasis01: clamp01(r.raw / sum),
      stressTier: r.raw >= 0.35 ? "peak" : r.raw >= 0.2 ? "lift" : "neutral"
    })
  );

  const peakEmphasis01 = Math.max(...distributed.map((d) => d.emphasis01));

  return Object.freeze({
    schema: RHIZOH_SPEECH_EMPHASIS_SCHEMA_V0,
    segments: Object.freeze(distributed),
    peakEmphasis01,
    emphasisBudget01: clamp01(sum / segments.length)
  });
}
