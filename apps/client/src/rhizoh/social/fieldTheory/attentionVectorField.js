/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function norm2(vx, vy) {
  const m = Math.hypot(vx, vy);
  if (m < 1e-9) return { vx: 0, vy: 0, magnitude: 0 };
  return { vx: vx / m, vy: vy / m, magnitude: m };
}

/**
 * Map discrete attention drift + momenta into a 2D attention vector field sample.
 * @param {Record<string, unknown> | null | undefined} socialPhysics
 */
export function computeAttentionVectorField(socialPhysics) {
  const sp = socialPhysics && typeof socialPhysics === "object" ? socialPhysics : {};
  const dir = String(sp.attentionDirection || "self_anchor");
  const im = clamp01(sp.interactionMomentum);
  const co = clamp01(sp.coPresenceMomentum);
  let vx = 0.2;
  let vy = -0.6;
  if (dir === "dialogue_focus") {
    vx = 0.92;
    vy = 0.28;
  } else if (dir === "room_scan") {
    vx = -0.55;
    vy = 0.84;
  }
  const n = norm2(vx, vy);
  const magnitude = clamp01(0.22 + im * 0.52 + co * 0.38 + (Number(sp.driftScore) || 0) * 0.12);
  return {
    vx: Math.round(n.vx * magnitude * 1000) / 1000,
    vy: Math.round(n.vy * magnitude * 1000) / 1000,
    magnitude: Math.round(magnitude * 1000) / 1000,
    directionLabel: dir
  };
}
