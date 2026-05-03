/**
 * Temporal Intent Drift Memory v1 — bounded history of closure + arbitration texture (read-only biography).
 * Persisted in client continuity meta only; no ecology or governor kernel write-back.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

export const TEMPORAL_INTENT_DRIFT_MEMORY_V1 = Object.freeze({
  version: "1",
  autonomyTier: "temporal_intent_memory_read_only",
  ecologyWriteBack: false,
  defaultMaxSnapshots: 20,
  guarantees: Object.freeze([
    "Stores prompt-facing biography snapshots only; does not feed back into arbitration kernels.",
    "Ring buffer — oldest drops beyond maxSnapshots."
  ])
});

/**
 * @param {unknown} raw
 */
export function normalizeTemporalIntentDriftMemory(raw) {
  const maxSnapshots = Math.min(
    48,
    Math.max(6, Number(raw?.maxSnapshots) || TEMPORAL_INTENT_DRIFT_MEMORY_V1.defaultMaxSnapshots)
  );
  if (!raw || typeof raw !== "object") {
    return { version: "1", maxSnapshots, snapshots: [] };
  }
  const snapsIn = Array.isArray(raw.snapshots) ? raw.snapshots : [];
  const snapshots = snapsIn
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      return {
        at: Number.isFinite(Number(s.at)) ? Number(s.at) : Date.now(),
        dominantFrame: String(s.dominantFrame || "neutral"),
        patternIntentPosture: String(s.patternIntentPosture || "—").slice(0, 64),
        intentBiasLine: String(s.intentBiasLine || "").slice(0, 320),
        oscillationPattern: s.oscillationPattern != null ? String(s.oscillationPattern).slice(0, 32) : null,
        arbitrationHeadline: String(s.arbitrationHeadline || "").slice(0, 240),
        governorVolatility: s.governorVolatility != null && Number.isFinite(Number(s.governorVolatility)) ? clamp01(Number(s.governorVolatility)) : null,
        governorStickiness: s.governorStickiness != null && Number.isFinite(Number(s.governorStickiness)) ? clamp01(Number(s.governorStickiness)) : null,
        conflictScore: s.conflictScore != null && Number.isFinite(Number(s.conflictScore)) ? clamp01(Number(s.conflictScore)) : null
      };
    })
    .filter(Boolean)
    .slice(-maxSnapshots);
  return { version: "1", maxSnapshots, snapshots };
}

/**
 * @param {Record<string, unknown>} memory
 * @param {Record<string, unknown>} snapshot
 * @param {{ dedupeWithinMs?: number }} [opts] — suppress duplicate rapid rebuilds (same headline/posture/frame)
 */
export function pushTemporalIntentSnapshot(memory, snapshot, opts) {
  const m = normalizeTemporalIntentDriftMemory(memory);
  const o = opts && typeof opts === "object" ? opts : {};
  const row = {
    at: Number.isFinite(Number(snapshot.at)) ? Number(snapshot.at) : Date.now(),
    dominantFrame: String(snapshot.dominantFrame || "neutral"),
    patternIntentPosture: String(snapshot.patternIntentPosture || "—").slice(0, 64),
    intentBiasLine: String(snapshot.intentBiasLine || "").slice(0, 320),
    oscillationPattern: snapshot.oscillationPattern != null ? String(snapshot.oscillationPattern).slice(0, 32) : null,
    arbitrationHeadline: String(snapshot.arbitrationHeadline || "").slice(0, 240),
    governorVolatility:
      snapshot.governorVolatility != null && Number.isFinite(Number(snapshot.governorVolatility))
        ? clamp01(Number(snapshot.governorVolatility))
        : null,
    governorStickiness:
      snapshot.governorStickiness != null && Number.isFinite(Number(snapshot.governorStickiness))
        ? clamp01(Number(snapshot.governorStickiness))
        : null,
    conflictScore:
      snapshot.conflictScore != null && Number.isFinite(Number(snapshot.conflictScore))
        ? clamp01(Number(snapshot.conflictScore))
        : null
  };
  const dedupeMs = Number(o.dedupeWithinMs);
  if (Number.isFinite(dedupeMs) && dedupeMs > 0 && m.snapshots.length) {
    const last = m.snapshots[m.snapshots.length - 1];
    const dt = row.at - last.at;
    if (
      dt >= 0 &&
      dt < dedupeMs &&
      last.dominantFrame === row.dominantFrame &&
      last.patternIntentPosture === row.patternIntentPosture &&
      last.arbitrationHeadline === row.arbitrationHeadline
    ) {
      return m;
    }
  }
  const next = [...m.snapshots, row].slice(-m.maxSnapshots);
  return { ...m, snapshots: next };
}

/**
 * @param {Record<string, unknown> | null | undefined} proj — ghost user-agent stack
 */
export function buildTemporalIntentSnapshotFromStack(proj) {
  const p = proj && typeof proj === "object" ? proj : null;
  if (!p) return null;
  const arb = p.perceptionArbitrationV1 && typeof p.perceptionArbitrationV1 === "object" ? p.perceptionArbitrationV1 : null;
  if (!arb) return null;
  const ifc = p.intentFeedbackClosureV1 && typeof p.intentFeedbackClosureV1 === "object" ? p.intentFeedbackClosureV1 : null;
  const gv = arb.governorV1 && typeof arb.governorV1 === "object" ? arb.governorV1 : null;
  const sm = gv?.stabilityMetrics && typeof gv.stabilityMetrics === "object" ? gv.stabilityMetrics : null;

  return {
    at: Date.now(),
    dominantFrame: String(arb.dominantFrame || "neutral"),
    patternIntentPosture: ifc?.patternIntentPosture != null ? String(ifc.patternIntentPosture).slice(0, 64) : "—",
    intentBiasLine: ifc?.intentBiasLine != null ? String(ifc.intentBiasLine).slice(0, 320) : "",
    oscillationPattern:
      gv && !gv.disabled && gv.oscillation?.pattern != null ? String(gv.oscillation.pattern).slice(0, 32) : gv?.disabled ? "governor_preview" : null,
    arbitrationHeadline: String(arb.rationale?.[0] || "").slice(0, 240),
    governorVolatility: sm && sm.frameVolatility != null ? clamp01(Number(sm.frameVolatility)) : null,
    governorStickiness: sm && sm.dominanceStickiness != null ? clamp01(Number(sm.dominanceStickiness)) : null,
    conflictScore: arb.conflictScore != null ? clamp01(Number(arb.conflictScore)) : null
  };
}

/**
 * Lightweight drift metrics over the snapshot window.
 * @param {{ snapshots?: unknown[] }} memory
 */
export function computeArbitrationReasonDrift(memory) {
  const m = normalizeTemporalIntentDriftMemory(memory);
  const s = m.snapshots;
  if (s.length < 2) {
    return {
      windowSize: s.length,
      frameFlipRate: 0,
      uniqueDominantFrames: s.length ? 1 : 0,
      uniquePostures: s.length ? 1 : 0,
      oscillationLabelsSeen: [],
      volatilityMean: null,
      driftVerdict: "insufficient_history"
    };
  }
  let flips = 0;
  for (let i = 1; i < s.length; i += 1) {
    if (s[i].dominantFrame !== s[i - 1].dominantFrame) flips += 1;
  }
  const frameFlipRate = flips / (s.length - 1);
  const domSet = new Set(s.map((x) => x.dominantFrame));
  const posSet = new Set(s.map((x) => x.patternIntentPosture));
  const oscLabels = [...new Set(s.map((x) => x.oscillationPattern).filter(Boolean))];
  const vols = s.map((x) => x.governorVolatility).filter((x) => x != null);
  const volatilityMean = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : null;

  let driftVerdict = "steady_character";
  if (frameFlipRate > 0.55) driftVerdict = "frame_instability";
  else if (frameFlipRate > 0.32) driftVerdict = "frame_mobilization";
  if (posSet.size >= 4 && s.length >= 8) driftVerdict = "posture_exploration";

  return {
    windowSize: s.length,
    frameFlipRate: Math.round(frameFlipRate * 1000) / 1000,
    uniqueDominantFrames: domSet.size,
    uniquePostures: posSet.size,
    oscillationLabelsSeen: oscLabels.slice(0, 8),
    volatilityMean: volatilityMean != null ? Math.round(volatilityMean * 1000) / 1000 : null,
    driftVerdict
  };
}

/**
 * Compact biography block for the LLM (prompt-only).
 * @param {Record<string, unknown>} memory
 */
export function summarizeIntentDriftForPrompt(memory) {
  const m = normalizeTemporalIntentDriftMemory(memory);
  const s = m.snapshots;
  const drift = computeArbitrationReasonDrift(m);

  if (s.length < 2) {
    return [
      "[Temporal intent drift memory — read-only biography]",
      "Window is still thin fewer than two perceptual snapshots; character arc not yet distinguishable.",
      "Treat current closure block as the only temporal anchor for this turn."
    ].join("\n");
  }

  const tail = s.slice(-6);
  const frameArc = tail.map((x) => x.dominantFrame).join(" → ");
  const postureArc = tail.map((x) => x.patternIntentPosture).slice(-5).join(" → ");
  const oscTail = tail
    .map((x) => x.oscillationPattern || "—")
    .filter((x, i, a) => i === 0 || x !== a[i - 1])
    .slice(-4)
    .join(", ");
  const latest = s[s.length - 1];
  const prior = s[s.length - 2];
  const frameShift = latest.dominantFrame !== prior.dominantFrame ? `Dominant frame shifted ${prior.dominantFrame}→${latest.dominantFrame}.` : `Dominant frame held (${latest.dominantFrame}).`;

  const vols = tail.map((x) => x.governorVolatility).filter((x) => x != null);
  const volNote =
    vols.length >= 2
      ? `Recent volatility band ~${Math.min(...vols).toFixed(2)}–${Math.max(...vols).toFixed(2)} (governor texture).`
      : "";

  return [
    "[Temporal intent drift memory — read-only biography]",
    `Drift verdict (heuristic): ${drift.driftVerdict} · frameFlipRate=${drift.frameFlipRate} · uniqueFrames=${drift.uniqueDominantFrames} · uniquePostures=${drift.uniquePostures}.`,
    frameShift,
    `Dominant-frame arc (recent, oldest→newest): ${frameArc}.`,
    `Intent posture arc (recent): ${postureArc}.`,
    oscTail ? `Oscillation label trail (compressed): ${oscTail}.` : "",
    volNote,
    `Latest arbitration headline: ${latest.arbitrationHeadline || "—"}`,
    `Latest bias echo: ${(latest.intentBiasLine || "").slice(0, 260)}${(latest.intentBiasLine || "").length > 260 ? "…" : ""}`,
    "Use this only as temporal self-context — do not narrate these diagnostics to the user unless asked."
  ]
    .filter(Boolean)
    .join("\n");
}
