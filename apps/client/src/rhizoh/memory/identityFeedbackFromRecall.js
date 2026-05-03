/**
 * IdentityFeedbackFromRecall — recall → rhizoh trust/familiarity (kapalı devre parçası).
 * Mitigates memory attractor collapse: diversity damping, anchor skew cap, phase jitter, high-drift gate.
 */

/** @param {number} x @param {number} a @param {number} b */
function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

/**
 * @param {unknown[]} recollection — applyMemoryDominanceCap sonrası sıralı anılar
 * @param {{
 *   currentPhysics?: Record<string, unknown>,
 *   now?: number
 * }} [ctx]
 * @returns {null | {
 *   trustDelta: number,
 *   familiarityDelta: number,
 *   diversityPenalty: number,
 *   anchorSkew: number,
 *   jitterApplied: number
 * }}
 */
export function computeIdentityFeedbackFromRecall(recollection, ctx = {}) {
  const list = Array.isArray(recollection) ? recollection.slice(0, 8) : [];
  if (list.length < 2) return null;

  const cur = ctx.currentPhysics && typeof ctx.currentPhysics === "object" ? ctx.currentPhysics : {};
  const now = Number(ctx.now) || Date.now();
  const maxW = Math.max(...list.map((r) => Number(r?.retrievalWeight) || 0));
  if (maxW < 0.06) return null;

  let wSum = 0;
  let trustAcc = 0;
  let famAcc = 0;
  const phases = [];
  let anchorCount = 0;

  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const w = Number(row.retrievalWeight) || 0;
    if (w < 1e-8) continue;
    const im = row.physicsImprint && typeof row.physicsImprint === "object" ? row.physicsImprint : null;
    const phase = im ? String(im.phase || "") : "";
    if (phase) phases.push(phase);
    if (row.memoryCrystallization === "ANCHOR_MEMORY") anchorCount += 1;
    const stab = im ? clamp(Number(im.stability) || 0, 0, 1) : 0.5;
    const drift = im ? clamp(Number(im.drift) || 0, 0, 1) : 0.2;
    const mf = row.memoryFieldScores && typeof row.memoryFieldScores === "object" ? row.memoryFieldScores : {};
    const align = clamp(Number(mf.physicsCollapse) || 0.5, 0, 1);
    const tNudge = (stab * 0.52 + align * 0.48 - drift * 0.38) * w;
    const fNudge = (align * 0.58 + (1 - drift) * 0.42) * w * 0.92;
    trustAcc += tNudge;
    famAcc += fNudge;
    wSum += w;
  }

  if (wSum < 1e-9) return null;

  let trustDelta = (trustAcc / wSum) * 0.017;
  let famDelta = (famAcc / wSum) * 0.021;

  const uniqPhases = new Set(phases);
  let diversityPenalty = 1;
  if (phases.length >= 3 && uniqPhases.size === 1) diversityPenalty = 0.52;
  else if (phases.length >= 4 && uniqPhases.size <= 2) diversityPenalty = 0.76;

  const anchorSkew = anchorCount / Math.max(1, list.length);
  if (anchorSkew >= 0.55) diversityPenalty *= 0.68;

  const jitter = Math.sin(now / 127_000) * 0.0014;
  trustDelta = clamp((trustDelta + jitter) * diversityPenalty, -0.009, 0.013);
  famDelta = clamp(famDelta * diversityPenalty, -0.007, 0.017);

  const curDrift = clamp(Number(cur.driftScore) || 0, 0, 1);
  const curStab = clamp(Number(cur.stabilityScore) || 0.5, 0, 1);
  if (curDrift > 0.62) {
    trustDelta *= 0.42;
    famDelta *= 0.52;
  }
  if (curStab < 0.34) famDelta *= 0.58;

  return {
    trustDelta: Math.round(trustDelta * 1e6) / 1e6,
    familiarityDelta: Math.round(famDelta * 1e6) / 1e6,
    diversityPenalty: Math.round(diversityPenalty * 1000) / 1000,
    anchorSkew: Math.round(anchorSkew * 1000) / 1000,
    jitterApplied: Math.round(jitter * 1e6) / 1e6
  };
}

/**
 * @param {{ version?: number, rhizoh?: Record<string, unknown> } | null | undefined} graph
 * @param {NonNullable<ReturnType<typeof computeIdentityFeedbackFromRecall>>} feedback
 */
export function applyRecallFeedbackToIdentityGraph(graph, feedback) {
  if (!feedback || !graph || graph.version !== 1) return graph;
  const r = graph.rhizoh && typeof graph.rhizoh === "object" ? graph.rhizoh : {};
  const t = clamp(Number(r.trust) + feedback.trustDelta, 0.08, 0.96);
  const f = clamp(Number(r.familiarity) + feedback.familiarityDelta, 0.08, 0.99);
  return {
    ...graph,
    rhizoh: {
      ...r,
      trust: Math.round(t * 1000) / 1000,
      familiarity: Math.round(f * 1000) / 1000,
      lastRecallFeedbackAt: Date.now()
    }
  };
}
