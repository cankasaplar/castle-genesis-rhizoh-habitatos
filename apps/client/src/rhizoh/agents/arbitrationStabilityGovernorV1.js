/**
 * L10 Arbitration Stability Governor v1 — temporal character for perception arbitration (read-only).
 *
 * Tracks recent dominant frames, dampens oscillation excess, and nudges dominance scalars
 * so prompt ordering gains a stable “decision personality” without ecology write-back.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/** @param {number[]} xs length 3 */
function stdDev3(xs) {
  if (!xs || xs.length !== 3) return 0;
  const m = (xs[0] + xs[1] + xs[2]) / 3;
  const v = ((xs[0] - m) ** 2 + (xs[1] - m) ** 2 + (xs[2] - m) ** 2) / 3;
  return Math.sqrt(Math.max(0, v));
}

export const ARBITRATION_STABILITY_GOVERNOR_V1 = Object.freeze({
  version: "1",
  autonomyTier: "arbitration_governor_read_only",
  ecologyWriteBack: false,
  maxFramesDefault: 10,
  guarantees: Object.freeze([
    "Adjusts dominance scalars and frame stickiness only — never mutates ghost ecology or chorus kernels.",
    "Memory buffer is client continuity metadata; bounded ring (last N frames)."
  ])
});

/**
 * @param {unknown} raw
 */
export function normalizeArbitrationGovernorBuffer(raw) {
  const maxFrames = Math.min(
    24,
    Math.max(4, Number(raw?.maxFrames) || ARBITRATION_STABILITY_GOVERNOR_V1.maxFramesDefault)
  );
  if (!raw || typeof raw !== "object") {
    return { version: "1", maxFrames, entries: [] };
  }
  const entriesIn = Array.isArray(raw.entries) ? raw.entries : [];
  const entries = entriesIn
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      return {
        dominantFrame: String(e.dominantFrame || "neutral"),
        ghost: clamp01(Number(e.ghost)),
        chorus: clamp01(Number(e.chorus)),
        agent: clamp01(Number(e.agent)),
        conflictScore: clamp01(Number(e.conflictScore)),
        at: Number.isFinite(Number(e.at)) ? Number(e.at) : Date.now()
      };
    })
    .filter(Boolean)
    .slice(-maxFrames);
  return { version: "1", maxFrames, entries };
}

export function createEmptyArbitrationMemoryBuffer(maxFrames) {
  return normalizeArbitrationGovernorBuffer({ maxFrames: maxFrames ?? ARBITRATION_STABILITY_GOVERNOR_V1.maxFramesDefault, entries: [] });
}

/**
 * @param {Record<string, unknown>} buffer
 * @param {{ dominantFrame: string, ghost: number, chorus: number, agent: number, conflictScore: number }} entry
 */
export function pushArbitrationMemoryEntry(buffer, entry) {
  const b = normalizeArbitrationGovernorBuffer(buffer);
  const row = {
    dominantFrame: String(entry.dominantFrame || "neutral"),
    ghost: clamp01(Number(entry.ghost)),
    chorus: clamp01(Number(entry.chorus)),
    agent: clamp01(Number(entry.agent)),
    conflictScore: clamp01(Number(entry.conflictScore)),
    at: Date.now()
  };
  const next = [...b.entries, row].slice(-b.maxFrames);
  return { ...b, entries: next };
}

/** @param {{ dominantFrame: string }[]} entries */
function trailingDominantCount(entries, frameId) {
  const id = String(frameId);
  let n = 0;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (String(entries[i].dominantFrame) === id) n += 1;
    else break;
  }
  return n;
}

/**
 * @param {Record<string, unknown>} buffer
 */
export function computeFrameStability(buffer) {
  const b = normalizeArbitrationGovernorBuffer(buffer);
  const entries = b.entries;
  const n = entries.length;
  if (n < 2) {
    return {
      stabilityIndex: 1,
      frameVolatility: 0,
      dominanceStickiness: n === 1 ? 1 : 0,
      windowSize: n
    };
  }
  let flips = 0;
  for (let i = 1; i < n; i += 1) {
    if (entries[i].dominantFrame !== entries[i - 1].dominantFrame) flips += 1;
  }
  const frameVolatility = flips / (n - 1);
  const stabilityIndex = clamp01(1 - frameVolatility * 1.12);
  const lastDom = entries[n - 1]?.dominantFrame;
  let suffix = 0;
  for (let i = n - 1; i >= 0 && entries[i].dominantFrame === lastDom; i -= 1) suffix += 1;
  const dominanceStickiness = suffix / n;
  return {
    stabilityIndex,
    frameVolatility,
    dominanceStickiness,
    windowSize: n
  };
}

/**
 * @param {Record<string, unknown>} buffer
 */
export function detectOscillationPattern(buffer) {
  const b = normalizeArbitrationGovernorBuffer(buffer);
  const f = b.entries.map((e) => e.dominantFrame);
  if (f.length < 3) {
    return { pattern: "insufficient_data", alternationScore: 0, neutralRate: 0 };
  }
  let flips = 0;
  for (let i = 1; i < f.length; i += 1) {
    if (f[i] !== f[i - 1]) flips += 1;
  }
  const alternationScore = flips / (f.length - 1);
  const neutralRate = f.filter((x) => x === "neutral").length / f.length;
  let pattern = "stable";
  if (neutralRate >= 0.38) pattern = "neutral_heavy";
  else if (alternationScore >= 0.62) pattern = "alternating";
  else if (alternationScore >= 0.38) pattern = "transitional";
  else if (alternationScore < 0.22) pattern = "stable";
  else pattern = "chaotic";
  return { pattern, alternationScore, neutralRate };
}

/**
 * Soft scalar nudges from recent arbitration character.
 * @param {{ ghost: number, chorus: number, agent: number }} scores
 * @param {Record<string, unknown>} buffer — historical entries only (before this tick)
 */
export function applyDominanceDecay(scores, buffer) {
  const b = normalizeArbitrationGovernorBuffer(buffer);
  const prev = b.entries;
  const notes = [];
  let ghost = clamp01(Number(scores.ghost) || 0);
  let chorus = clamp01(Number(scores.chorus) || 0);
  let agent = clamp01(Number(scores.agent) || 0);

  const ghostStreak = trailingDominantCount(prev, "ghost");
  if (ghostStreak >= 5) {
    ghost *= 0.82;
    notes.push(`ghost_decay streak=${ghostStreak}`);
  }

  const agentStreak = trailingDominantCount(prev, "agent");
  if (agentStreak >= 4) {
    chorus *= 1.14;
    notes.push(`chorus_amplify_for_agent_streak=${agentStreak}`);
  }

  if (prev.length) {
    const neutralRate = prev.filter((e) => e.dominantFrame === "neutral").length / prev.length;
    if (neutralRate >= 0.35) {
      const bump = 1.065;
      ghost *= bump;
      chorus *= bump;
      agent *= bump;
      notes.push(`neutral_bias_amplify rate=${neutralRate.toFixed(2)}`);
    }
  }

  return {
    ghost: clamp01(ghost),
    chorus: clamp01(chorus),
    agent: clamp01(agent),
    notes
  };
}

/**
 * Reduce frame flip-flop when volatility is high and margin is thin.
 */
export function enforceFramePersistenceSoftLimit(resolved, buffer, adjustedDominance) {
  const r = resolved && typeof resolved === "object" ? resolved : null;
  if (!r || r.fallbackNeutral) return r;

  const b = normalizeArbitrationGovernorBuffer(buffer);
  const prev = b.entries;
  const prevDom = prev.length ? String(prev[prev.length - 1].dominantFrame) : "";
  if (!prevDom || prevDom === "neutral") return r;

  const stab = computeFrameStability(buffer);
  if (stab.frameVolatility <= 0.52) return r;

  const dom = adjustedDominance && typeof adjustedDominance === "object" ? adjustedDominance : {};
  const g = clamp01(Number(dom.ghost) || 0);
  const c = clamp01(Number(dom.chorus) || 0);
  const a = clamp01(Number(dom.agent) || 0);
  const sorted = [
    ["chorus", c],
    ["ghost", g],
    ["agent", a]
  ].sort((x, y) => y[1] - x[1]);
  const margin = sorted[0][1] - sorted[1][1];
  const candidate = String(r.dominantFrame);

  if (candidate !== prevDom && margin < 0.092) {
    return {
      ...r,
      dominantFrame: prevDom,
      fallbackNeutral: false,
      rationale: [
        ...(Array.isArray(r.rationale) ? r.rationale : []),
        `Stickiness: volatility=${stab.frameVolatility.toFixed(2)} margin=${margin.toFixed(3)} — retain ${prevDom}.`
      ]
    };
  }
  return r;
}

/**
 * @param {{ buffer: Record<string, unknown>, rawDominance: Record<string, unknown> }} input
 */
export function runArbitrationStabilityGovernorV1(input) {
  const inp = input && typeof input === "object" ? input : {};
  const raw = inp.rawDominance && typeof inp.rawDominance === "object" ? inp.rawDominance : {};
  const ghost0 = clamp01(Number(raw.ghost) || 0);
  const chorus0 = clamp01(Number(raw.chorus) || 0);
  const agent0 = clamp01(Number(raw.agent) || 0);
  const rawConflict = clamp01(
    Number.isFinite(Number(raw.conflictScore)) ? Number(raw.conflictScore) : stdDev3([ghost0, chorus0, agent0]) * 3.15
  );

  const buffer = inp.buffer;
  const stabilityMetrics = computeFrameStability(buffer);
  const oscillation = detectOscillationPattern(buffer);

  const decayed = applyDominanceDecay({ ghost: ghost0, chorus: chorus0, agent: agent0 }, buffer);
  const conflictScore = clamp01(stdDev3([decayed.ghost, decayed.chorus, decayed.agent]) * 3.15);

  const adjustedDominance = {
    ghost: decayed.ghost,
    chorus: decayed.chorus,
    agent: decayed.agent,
    conflictScore,
    raw: { ghost: ghost0, chorus: chorus0, agent: agent0, conflictScore: rawConflict }
  };

  return {
    contract: ARBITRATION_STABILITY_GOVERNOR_V1,
    ecologyWriteBack: false,
    stabilityMetrics,
    oscillation,
    adjustedDominance,
    governanceNotes: decayed.notes,
    source: "arbitration_stability_governor_v1"
  };
}
