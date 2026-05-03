import { createEmptyMorphologyTargets } from "./l10MorphologyTargets.js";

const SMOOTH = 0.088;

/**
 * @param {ReturnType<import("./l10MorphologyTargets.js").createEmptyMorphologyTargets>} cur
 * @param {ReturnType<import("./l10MorphologyTargets.js").computeMorphologyTargets>} tgt
 * @param {number} [smooth]
 */
export function lerpMorphologyToward(cur, tgt, smooth = SMOOTH) {
  const k = smooth;
  cur.tsgeRadiusPx += (tgt.tsgeRadiusPx - cur.tsgeRadiusPx) * k;
  cur.tsgeGlow += (tgt.tsgeGlow - cur.tsgeGlow) * k;
  cur.tsgeWobblePx += (tgt.tsgeWobblePx - cur.tsgeWobblePx) * k;
  cur.tsgeStrokeOpacity += (tgt.tsgeStrokeOpacity - cur.tsgeStrokeOpacity) * k;
  cur.chorusTiltDeg += (tgt.chorusTiltDeg - cur.chorusTiltDeg) * k;
  cur.chorusJitterPx += (tgt.chorusJitterPx - cur.chorusJitterPx) * k;
  cur.chorusHueDeg += (tgt.chorusHueDeg - cur.chorusHueDeg) * k;

  cur.protoCount = tgt.protoCount;
  cur.courtCount = tgt.courtCount;

  for (let i = 0; i < cur.protos.length; i += 1) {
    const a = cur.protos[i];
    const b = tgt.protos[i] || a;
    a.scale += (b.scale - a.scale) * k;
    a.swayDeg += (b.swayDeg - a.swayDeg) * k;
  }

  for (let i = 0; i < cur.courtScores.length; i += 1) {
    const tv = tgt.courtScores[i] ?? 0;
    cur.courtScores[i] += (tv - cur.courtScores[i]) * k;
  }
}

/**
 * @param {HTMLElement | null} el
 * @param {ReturnType<typeof createEmptyMorphologyTargets>} m
 */
export function applyMorphologyCssVars(el, m) {
  if (!el) return;
  el.style.setProperty("--l10-tsge-radius", `${m.tsgeRadiusPx}px`);
  el.style.setProperty("--l10-tsge-glow", String(m.tsgeGlow));
  el.style.setProperty("--l10-tsge-glow-blur", `${1.15 + m.tsgeGlow * 7.2}px`);
  el.style.setProperty("--l10-tsge-wobble-amplitude", `${m.tsgeWobblePx}px`);
  el.style.setProperty("--l10-tsge-stroke-opacity", String(m.tsgeStrokeOpacity));
  el.style.setProperty("--l10-tsge-wobble-period", `${2.4 + (1 - m.tsgeGlow) * 2.8}s`);

  el.style.setProperty("--l10-chorus-tilt", `${m.chorusTiltDeg}deg`);
  el.style.setProperty("--l10-chorus-jitter", `${m.chorusJitterPx}px`);
  el.style.setProperty("--l10-chorus-hue", `${m.chorusHueDeg}deg`);
  el.style.setProperty("--l10-chorus-jitter-period", `${1.05 + Math.min(2.4, m.chorusJitterPx * 0.45)}s`);

  el.style.setProperty("--l10-proto-count", String(m.protoCount));
  el.style.setProperty("--l10-court-count", String(m.courtCount));

  for (let i = 0; i < m.protos.length; i += 1) {
    const p = m.protos[i];
    el.style.setProperty(`--l10-proto-${i}-scale`, String(p.scale));
    el.style.setProperty(`--l10-proto-${i}-sway-deg`, `${p.swayDeg}deg`);
    el.style.setProperty(`--l10-proto-${i}-sway-period`, `${4.2 + i * 0.35}s`);
  }

  for (let i = 0; i < m.courtScores.length; i += 1) {
    el.style.setProperty(`--l10-court-${i}-score`, String(m.courtScores[i]));
  }
}

/** @returns {ReturnType<typeof createEmptyMorphologyTargets>} */
export function createMorphologyRuntimeState() {
  return createEmptyMorphologyTargets();
}

/**
 * @param {ReturnType<typeof createEmptyMorphologyTargets>} cur
 * @param {ReturnType<import("./l10MorphologyTargets.js").computeMorphologyTargets>} tgt
 */
export function snapMorphologyToTarget(cur, tgt) {
  cur.tsgeRadiusPx = tgt.tsgeRadiusPx;
  cur.tsgeGlow = tgt.tsgeGlow;
  cur.tsgeWobblePx = tgt.tsgeWobblePx;
  cur.tsgeStrokeOpacity = tgt.tsgeStrokeOpacity;
  cur.chorusTiltDeg = tgt.chorusTiltDeg;
  cur.chorusJitterPx = tgt.chorusJitterPx;
  cur.chorusHueDeg = tgt.chorusHueDeg;
  cur.protoCount = tgt.protoCount;
  cur.courtCount = tgt.courtCount;
  for (let i = 0; i < cur.protos.length; i += 1) {
    const b = tgt.protos[i] || { scale: 1, swayDeg: 0 };
    cur.protos[i].scale = b.scale;
    cur.protos[i].swayDeg = b.swayDeg;
  }
  for (let i = 0; i < cur.courtScores.length; i += 1) {
    cur.courtScores[i] = tgt.courtScores[i] ?? 0;
  }
}
