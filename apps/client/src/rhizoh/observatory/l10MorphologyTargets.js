/**
 * Phenomenology targets derived from authoritative diagnostics (slow truth).
 * Consumed by rAF interpolator → CSS custom properties (no React fast path).
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

const PROTO_SLOTS = 8;
const COURT_SLOTS = 5;

function emptyProtoSlot() {
  return { scale: 1, swayDeg: 0 };
}

export function createEmptyMorphologyTargets() {
  return {
    tsgeRadiusPx: 90,
    tsgeGlow: 0,
    tsgeWobblePx: 0,
    tsgeStrokeOpacity: 0.45,
    chorusTiltDeg: 0,
    chorusJitterPx: 0,
    chorusHueDeg: 0,
    protos: Array.from({ length: PROTO_SLOTS }, () => emptyProtoSlot()),
    courtScores: Array.from({ length: COURT_SLOTS }, () => 0),
    protoCount: 0,
    courtCount: 0
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} diagnostics
 */
export function computeMorphologyTargets(diagnostics) {
  const d = diagnostics && typeof diagnostics === "object" ? diagnostics : {};
  const t = d.tsge && typeof d.tsge === "object" ? d.tsge : {};
  const grav = clamp01(Number(t.localGravityMean) || 0);
  const varC = Math.min(1, (Number(t.attentionCurvatureVariance) || 0) / 0.12);
  const satP = clamp01(
    Number(t.saturationPressure) ||
      (Number(t.saturationStreak) || 0) / 22 ||
      0
  );

  const tsgeRadiusPx = 26 + 74 * grav;
  const tsgeGlow = satP;
  const tsgeWobblePx = 1.2 + varC * 6.8;
  const tsgeStrokeOpacity = 0.18 + 0.62 * (1 - varC * 0.85);

  const ch = d.chorus && typeof d.chorus === "object" ? d.chorus : {};
  const mb = ch.mergedBias && typeof ch.mergedBias === "object" ? ch.mergedBias : {};
  const b = Number(mb.BUILD) || 0;
  const c = Number(mb.CRISIS) || 0;
  const p = Number(mb.PLAY) || 0;
  const o = Number(mb.OBSERVE) || 0;
  const chorusTiltDeg = (b - c) * 12 + (p - o) * 5;
  const conflictNote = String(ch.conflictNote || "");
  const chorusJitterPx = conflictNote ? Math.min(3.2, 0.9 + conflictNote.length * 0.032) : 0;
  const dominant = String(ch.dominantTheme || "");
  const hueMap = { listener: 190, mediator: 275, scout: 38, counterweight: 350 };
  const chorusHueDeg = dominant ? hueMap[dominant] ?? 200 : 200;

  const protosRaw = Array.isArray(d.protoAgents) ? d.protoAgents : [];
  const protos = Array.from({ length: PROTO_SLOTS }, (_, i) => {
    const env = protosRaw[i];
    if (!env || typeof env !== "object") return emptyProtoSlot();
    const m = Math.min(1, Math.max(0, Number(env.mitosisConfidence) || 0));
    const kappa = Number(env.tetherKappa);
    const kappaN = Number.isFinite(kappa) ? kappa : 0.08;
    const tetherProduct = Math.min(1, kappaN * 12 * (1 - m));
    const scale = 0.35 + m * 0.85;
    const dmDt = Number(env.l10dmDt);
    const pulse = Number.isFinite(dmDt) ? Math.min(3.2, Math.abs(dmDt) * 22) : 0;
    const pulseBump = 1 + Math.min(0.2, pulse * 0.032);
    const swayDeg = tetherProduct * 4.2 + varC * 2.1;
    return { scale: scale * pulseBump, swayDeg };
  });

  const courtRaw = Array.isArray(d.embodimentCourt) ? d.embodimentCourt : [];
  const courtFallback = Array.isArray(d.embodimentCandidates) ? d.embodimentCandidates : [];
  const courtList = courtRaw.length ? courtRaw : courtFallback;
  const courtScores = Array.from({ length: COURT_SLOTS }, (_, i) => {
    const th = courtList[i];
    if (!th || typeof th !== "object") return 0;
    const g = th.lastEmbodimentGate && typeof th.lastEmbodimentGate === "object" ? th.lastEmbodimentGate : {};
    return clamp01(Number(g.score) || 0);
  });

  return {
    tsgeRadiusPx,
    tsgeGlow,
    tsgeWobblePx,
    tsgeStrokeOpacity,
    chorusTiltDeg,
    chorusJitterPx,
    chorusHueDeg,
    protos,
    courtScores,
    protoCount: Math.min(PROTO_SLOTS, protosRaw.length),
    courtCount: Math.min(COURT_SLOTS, courtList.length)
  };
}
