/**
 * Tül çizim katmanı — gerçek Octo modelinin üstünde (2D overlay, v0).
 */

const TAU = Math.PI * 2;
const NUM_TENTACLES = 8;
const SEGS = 18;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{
 *   cx: number, cy: number, nestR: number,
 *   behavior: { freq: number, amplitude: number, colorH: number, spread: number, curl: number },
 *   globalPhase: number, waveFlow: string, opacity?: number
 * }} opts
 */
export function drawOctoMediaTulleOverlayV0(ctx, opts) {
  const { cx, cy, nestR, behavior: b, globalPhase, waveFlow } = opts;
  const opacity = opts.opacity ?? 0.55;
  const tentaclePts = calcTulleTentaclePoints(cx, cy, nestR, b, globalPhase, waveFlow);
  drawTulleVeil(ctx, cx, cy, buildTullePoints(tentaclePts), b, globalPhase, opacity);
  tentaclePts.forEach((pts, ti) => drawTulleShimmer(ctx, pts, ti, b, globalPhase, nestR, opacity));
}

function calcTulleTentaclePoints(cx, cy, nestR, b, globalPhase, waveFlow) {
  return Array.from({ length: NUM_TENTACLES }, (_, ti) => {
    const baseAngle = (ti / NUM_TENTACLES) * TAU;
    const phase = (ti / NUM_TENTACLES) * TAU * 1.3;
    const flowDelay =
      waveFlow === "head_to_tip" ? ti * 0.2 : waveFlow === "tip_to_head" ? (NUM_TENTACLES - ti) * 0.2 : ti * 0.08;
    const angleWave = Math.sin(globalPhase * 0.9 + phase + flowDelay) * 0.32 * b.spread;
    const angle = baseAngle + angleWave;
    const mantleR = nestR * 0.3;
    const rootX = cx + Math.cos(angle) * mantleR;
    const rootY = cy + Math.sin(angle) * mantleR;
    const pts = [{ x: rootX, y: rootY }];
    let px = rootX;
    let py = rootY;
    let dir = angle;
    const baseLen = nestR * 0.88;

    for (let s = 1; s <= SEGS; s += 1) {
      const tRatio = s / SEGS;
      const segLen = (baseLen / SEGS) * (1 - tRatio * 0.5);
      const wavePhase = globalPhase * 0.85 + phase + tRatio * Math.PI * 3 + flowDelay;
      const wave = Math.sin(wavePhase) * b.amplitude * 0.45;
      dir += wave * 0.14;
      px += Math.cos(dir) * segLen;
      py += Math.sin(dir) * segLen;
      pts.push({ x: px, y: py });
    }
    return pts;
  });
}

function buildTullePoints(tentaclePoints) {
  const pts = [];
  tentaclePoints.forEach((tp, ti) => {
    for (let s = SEGS * 0.35; s < SEGS; s += 3) {
      const idx = Math.floor(s);
      if (tp[idx]) pts.push({ x: tp[idx].x, y: tp[idx].y, angle: Math.atan2(tp[idx].y, tp[idx].x) });
    }
    void ti;
  });
  return pts;
}

function drawTulleVeil(ctx, cx, cy, pts, b, globalPhase, opacity) {
  if (pts.length < 3) return;
  const hue = b.colorH;
  const sorted = pts
    .map((p) => ({ ...p, angle: Math.atan2(p.y - cy, p.x - cx) }))
    .sort((a, c) => a.angle - c.angle);

  ctx.beginPath();
  ctx.moveTo(sorted[0].x, sorted[0].y);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
  }
  ctx.closePath();
  const shimmer = (Math.sin(globalPhase * 2.5) * 0.5 + 0.5) * 0.04;
  ctx.fillStyle = `hsla(${hue + 18}, 65%, 74%, ${(0.028 + shimmer) * opacity})`;
  ctx.fill();
  ctx.strokeStyle = `hsla(${hue}, 70%, 80%, ${0.07 * opacity})`;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 42 + Math.sin(globalPhase) * 6, 0, TAU);
  ctx.fillStyle = `hsla(${hue + 160}, 50%, 90%, ${0.012 * opacity})`;
  ctx.fill();
}

function drawTulleShimmer(ctx, pts, ti, b, globalPhase, nestR, opacity) {
  if (pts.length < 2) return;
  const hue = b.colorH + ti * 8;
  for (let s = 2; s < pts.length; s += 2) {
    const tRatio = s / pts.length;
    ctx.beginPath();
    ctx.moveTo(pts[s - 1].x, pts[s - 1].y);
    ctx.lineTo(pts[s].x, pts[s].y);
    const a = (0.06 + Math.sin(globalPhase * 2 + ti + s * 0.2) * 0.04) * opacity;
    ctx.strokeStyle = `hsla(${hue + 35}, 85%, 86%, ${a})`;
    ctx.lineWidth = Math.max(0.2, nestR * 0.012 * (1 - tRatio));
    ctx.stroke();
  }
}
