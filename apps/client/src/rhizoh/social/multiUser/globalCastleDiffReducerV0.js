/**
 * SPECFLOW: RESEARCH-ONLY — Global multi-castle diff reducer (**B** evolution path).
 *
 * Fuses roster-like slices from many castles into one **deterministic** `mergedWsRoom` suitable
 * for `runSocialCoherenceKernelTickV0` input. Tie-break: higher `priority` wins, then lexicographically
 * smaller `castleId`. Wired execution path: `runGlobalSocialCoherenceKernelTickV0` in
 * `globalCoherenceKernelBridgeV0.js`.
 *
 * ## Semantic drift (diff systems risk)
 *
 * Small patches compose over time; without periodic **full snapshots** + **replay / checkpoint
 * binding** (Genesis `seq` ↔ kernel `frame`), meaning can wander. Callers should honor
 * `driftGuard.fullSnapshotRecommended` and attach lineage when integrating C.
 */

export const GLOBAL_CASTLE_DIFF_REDUCER_SCHEMA_V0 = "castle.rhizoh.global_castle_diff_reducer.v0";

/** After this many consecutive delta-only merges without a full slice, ask for a full snapshot. */
export const GLOBAL_COHERENCE_MAX_DELTA_WITHOUT_FULL = 48;

/**
 * @param {{ pri: number, castleId: string }} candidate
 * @param {{ pri: number, castleId: string }} incumbent
 * @returns {boolean} true if candidate should replace incumbent
 */
function scoreBeats(candidate, incumbent) {
  if (candidate.pri !== incumbent.pri) return candidate.pri > incumbent.pri;
  return String(candidate.castleId).localeCompare(String(incumbent.castleId)) < 0;
}

/**
 * @param {unknown} row
 * @param {string} castleId
 * @param {number} priority
 */
function normalizeRosterRow(row, castleId, priority) {
  const r = row && typeof row === "object" ? row : {};
  const uid = String(r.userId || r.id || "").trim();
  if (!uid) return null;
  return {
    userId: uid,
    lastMs: Math.max(0, Number(r.lastMs) || 0),
    label: String(r.label || r.displayName || uid).slice(0, 48),
    energyHint01: Number.isFinite(Number(r.energyHint01)) ? Number(r.energyHint01) : undefined,
    nexusEnergy: Number.isFinite(Number(r.nexusEnergy)) ? Number(r.nexusEnergy) : undefined,
    bridged: !!r.bridged,
    sourceCastleId: castleId,
    sourcePriority: priority
  };
}

/**
 * Reduces multiple castle slices into one merged room view.
 *
 * @param {Array<{
 *   castleId: string,
 *   priority?: number,
 *   sliceKind?: "full"|"delta",
 *   wsRoom?: { castleRoomKey?: string, seq?: number, roster?: unknown[] } | null
 * }>} slices
 * @param {{ deltaFramesSinceFull?: number, forceFullSnapshot?: boolean }} [opts]
 */
export function reduceGlobalCastleCoherenceSlicesV0(slices, opts = null) {
  const list = Array.isArray(slices) ? slices : [];
  const o = opts && typeof opts === "object" ? opts : {};
  const deltaFramesSinceFull = Math.max(0, Math.floor(Number(o.deltaFramesSinceFull) || 0));
  const forceFull = !!o.forceFullSnapshot;

  /** @type {Map<string, { row: Record<string, unknown>, score: { pri: number, castleId: string } }>} */
  const byUser = new Map();
  let maxSeq = 0;

  for (const s of list) {
    const castleId = String(s?.castleId || "unknown").slice(0, 64);
    const pri = Number.isFinite(Number(s?.priority)) ? Number(s.priority) : 0;
    const room = s?.wsRoom && typeof s.wsRoom === "object" ? s.wsRoom : null;
    const roster = room && Array.isArray(room.roster) ? room.roster : [];
    const sq = room && Number.isFinite(Number(room.seq)) ? Number(room.seq) : 0;
    if (sq > maxSeq) maxSeq = sq;
    for (const raw of roster) {
      const row = normalizeRosterRow(raw, castleId, pri);
      if (!row) continue;
      const score = { pri, castleId };
      const prev = byUser.get(row.userId);
      if (!prev || scoreBeats(score, prev.score)) {
        byUser.set(row.userId, { row, score });
      }
    }
  }

  const roster = [...byUser.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((uid) => {
      const { row } = byUser.get(uid);
      return row;
    });

  const fullSnapshotRecommended =
    forceFull || deltaFramesSinceFull >= GLOBAL_COHERENCE_MAX_DELTA_WITHOUT_FULL;

  return {
    schema: GLOBAL_CASTLE_DIFF_REDUCER_SCHEMA_V0,
    mergedWsRoom: {
      castleRoomKey: "global:coherence",
      seq: maxSeq + 1,
      roster
    },
    sources: [...new Set(list.map((s) => String(s?.castleId || "").trim()).filter(Boolean))].sort(),
    driftGuard: {
      fullSnapshotRecommended,
      deltaFramesSinceFull,
      reason: fullSnapshotRecommended
        ? forceFull
          ? "forced_full"
          : "delta_without_full_threshold"
        : "within_delta_budget",
      genesisReplaySuggested: fullSnapshotRecommended
    }
  };
}

/**
 * @param {number} deltaFramesSinceFull
 * @param {number} [max]
 */
export function shouldRequestFullCoherenceSnapshotV0(deltaFramesSinceFull, max) {
  const m = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : GLOBAL_COHERENCE_MAX_DELTA_WITHOUT_FULL;
  return Math.max(0, Math.floor(Number(deltaFramesSinceFull) || 0)) >= m;
}
