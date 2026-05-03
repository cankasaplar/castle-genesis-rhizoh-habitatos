import { RHIZOH_INTENT } from "../router/intentTypes.js";

/**
 * Uzun ufuk anlatı: ilişki evrimi + faz (episode / intent zincirinin üstünde).
 * @param {unknown} prev
 * @param {{
 *   intent?: string,
 *   bond?: number,
 *   emotions?: Record<string, unknown>,
 *   outcomeResonance?: number | null,
 *   thread?: Record<string, unknown> | null
 * }} input
 */
export function advanceRhizohNarrativeArc(prev, input = {}) {
  const p = prev && typeof prev === "object" ? prev : {};
  const int = String(input.intent || "CHAT");
  const bondNum = Math.max(0, Math.min(1, Number(input.bond) || 0));
  const prevBond = Number.isFinite(Number(p.lastBondSample)) ? Number(p.lastBondSample) : bondNum;
  const bondDelta = bondNum - prevBond;
  const em = input.emotions && typeof input.emotions === "object" ? input.emotions : {};
  const tension = Number(em.tension) || 0;
  const repair = Number(em.repair) || 0;
  const rupture = Number(em.rupture) || 0;

  let phase = "stabilize";
  let trajectory = "steady_presence";

  if (int === RHIZOH_INTENT.CRISIS || tension > 0.48 || rupture > 0.38) {
    phase = "repair";
    trajectory = "crisis_or_stress";
  } else if (repair > 0.38 && tension < 0.32 && rupture < 0.25) {
    phase = "recovery";
    trajectory = "bond_rebuild";
  } else if (bondDelta > 0.035 || (bondNum > 0.48 && int === RHIZOH_INTENT.CHAT)) {
    phase = "deepen";
    trajectory = "relationship_warmth";
  } else if (int === RHIZOH_INTENT.BUILD || int === RHIZOH_INTENT.PLAY) {
    phase = "explore";
    trajectory = "co_creation";
  } else if (int === RHIZOH_INTENT.REFLECT) {
    phase = "meaning";
    trajectory = "shared_inquiry";
  } else if (int === RHIZOH_INTENT.SILENCE) {
    phase = "hold";
    trajectory = "quiet_presence";
  }

  const bondTrend =
    Math.round((bondDelta * 0.65 + Number(p.bondTrend || 0) * 0.35) * 1000) / 1000;

  const milestones = Array.isArray(p.milestones) ? p.milestones.slice(-4) : [];
  const label = `${int}:${Math.round(bondNum * 100)}`;
  if (!milestones.length || milestones[milestones.length - 1] !== label) milestones.push(label);

  const direction = describeArcDirection(trajectory, bondDelta, bondTrend);
  const th = input.thread && typeof input.thread === "object" ? input.thread : {};
  const arcHeadline = String(th.arcSummary || direction).slice(-200);

  return {
    phase,
    trajectory,
    direction,
    bondTrend,
    lastBondSample: bondNum,
    milestones: milestones.slice(-5),
    focusIntent: int,
    outcomeResonance:
      input.outcomeResonance != null && Number.isFinite(Number(input.outcomeResonance))
        ? Math.round(Number(input.outcomeResonance) * 1000) / 1000
        : null,
    arcHeadline,
    updatedAt: Date.now()
  };
}

/**
 * @param {string} trajectory
 * @param {number} bondDelta
 * @param {number} bondTrend
 */
function describeArcDirection(trajectory, bondDelta, bondTrend) {
  if (trajectory === "crisis_or_stress") {
    return "Ufuk: stres hattı — önce güvenli çözüm ve sakin tempo; ilişkiyi germeden ilerle.";
  }
  if (trajectory === "bond_rebuild") {
    return "Ufuk: onarım — güven geri yükleniyor; kısa, net, destekleyici kal.";
  }
  if (trajectory === "relationship_warmth") {
    return "Ufuk: derinleşme — tanıdıklık artıyor; sürekliliği koru, abartılı dramadan kaçın.";
  }
  if (trajectory === "co_creation") {
    return "Ufuk: ortak üretim — merak ve net öneriler; kullanıcı ritmine uy.";
  }
  if (trajectory === "shared_inquiry") {
    return "Ufuk: ortak düşünce — yargısız, derin ama sıkıcı olmayan tempo.";
  }
  if (trajectory === "quiet_presence") {
    return "Ufuk: sessiz eşlik — minimal ama sıcak; boşluk bırak.";
  }
  if (bondDelta < -0.05 || bondTrend < -0.06) {
    return "Ufuk: bağ zayıflıyor olabilir — ton seçici, talep etmeden destek ver.";
  }
  return "Ufuk: dengeli eşlik — Rhizoh kimliği sabit, duygu dalgalanmasına göre ton ayarla.";
}
