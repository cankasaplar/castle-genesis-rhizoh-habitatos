/**
 * SPECFLOW: RESEARCH-ONLY — **YouTube as coherence sensor**: rich `youtubePipelineHint` for studio /
 * “Channel Director” (Rhizoh), aligned with genesis **arc** strategy (EP1–EP3), not a dumb upload pipe.
 *
 * Loop closure sketch: publish → analytics ingest → `ingestYouTubeAnalyticsForCoherenceFeedbackV0` →
 * `advanceCoherenceFeedbackStateV0` (`YOUTUBE_METRICS`).
 */

export const CASTLE_YOUTUBE_NARRATIVE_ARC_V0 = Object.freeze({
  GENESIS_IGNITION: "castle.genesis.arc.ignition.v0",
  FIRST_SOCIAL_COLLISION: "castle.genesis.arc.first_collision.v0",
  MULTI_CASTLE_EMERGENCE: "castle.genesis.arc.multi_castle.v0"
});

/** Human-facing defaults for EP1–EP3 (studio / director copy). */
export const CASTLE_GENESIS_EPISODE_TITLES_V0 = Object.freeze({
  ep1: "Castle Genesis Live — System Initialization",
  ep2: "Castle Genesis Live — First Social Collision",
  ep3: "Castle Genesis Live — Multi-Castle Emergence"
});

/**
 * @param {{
 *   frame?: number,
 *   sourcesCount?: number,
 *   socialConflict?: boolean,
 *   multiUserPeers?: boolean
 * }} input
 */
export function suggestNarrativeArcIdForGenesisV0(input) {
  const i = input && typeof input === "object" ? input : {};
  const frame = Math.max(0, Math.floor(Number(i.frame) || 0));
  const sourcesCount = Math.max(0, Math.floor(Number(i.sourcesCount) || 0));
  const conflict = !!i.socialConflict;
  const multi = !!i.multiUserPeers;
  if (sourcesCount >= 2 && (multi || frame >= 4)) return CASTLE_YOUTUBE_NARRATIVE_ARC_V0.MULTI_CASTLE_EMERGENCE;
  if (conflict && frame >= 2) return CASTLE_YOUTUBE_NARRATIVE_ARC_V0.FIRST_SOCIAL_COLLISION;
  return CASTLE_YOUTUBE_NARRATIVE_ARC_V0.GENESIS_IGNITION;
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * @param {{
 *   energyHint01: number,
 *   socialConflict: boolean,
 *   networkDiffDirty: boolean,
 *   fullSnapshotRecommended: boolean,
 *   sourcesCount: number,
 *   peerCount: number|null,
 *   narrativeArcId?: string
 * }} p
 */
export function computePublishRecommendationScoreV0(p) {
  const energy = clamp01(p.energyHint01);
  const conflict = p.socialConflict ? 1 : 0;
  const emotionalDensity01 = Math.min(1, Math.round((energy * 0.72 + conflict * 0.28) * 1000) / 1000);
  let s = 0.12;
  if (p.networkDiffDirty) s += 0.22;
  if (p.fullSnapshotRecommended) s += 0.12;
  const peers = Math.max(0, Math.floor(Number(p.peerCount) || 0));
  if (peers >= 2) s += 0.14;
  if (p.sourcesCount >= 2) s += 0.1;
  s += 0.3 * emotionalDensity01;
  const arc = String(p.narrativeArcId || "");
  if (arc.includes("multi_castle")) s += 0.05;
  else if (arc.includes("first_collision")) s += 0.03;
  return { publishRecommendationScore: Math.round(Math.min(1, Math.max(0, s)) * 1000) / 1000, emotionalDensity01 };
}

/**
 * @param {{
 *   kernel: Record<string, unknown>|null,
 *   globalMerge: Record<string, unknown>|null,
 *   networkPulse: Record<string, unknown>|null,
 *   networkDiff: Record<string, unknown>|null,
 *   uiSnapshot: Record<string, unknown>|null
 * }} ctx
 */
export function buildYoutubeCoherencePipelineHintV0(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const k = c.kernel && typeof c.kernel === "object" ? c.kernel : null;
  const gm = c.globalMerge && typeof c.globalMerge === "object" ? c.globalMerge : null;
  const np = c.networkPulse && typeof c.networkPulse === "object" ? c.networkPulse : null;
  const nd = c.networkDiff && typeof c.networkDiff === "object" ? c.networkDiff : null;
  const ui = c.uiSnapshot && typeof c.uiSnapshot === "object" ? c.uiSnapshot : null;

  const sp = np?.socialPulse && typeof np.socialPulse === "object" ? np.socialPulse : {};
  const coherenceFrame = Number.isFinite(Number(sp.coherenceFrame)) ? Number(sp.coherenceFrame) : null;
  const modeHint = String(sp.modeHint || "");
  const rhizohRuntimeRole = String(sp.rhizohRuntimeRole || "");
  const focusUserId = sp.focusUserId != null ? String(sp.focusUserId) : "";
  const energyHint01 = Number.isFinite(Number(sp.energyHint01)) ? Number(sp.energyHint01) : 0;

  const layers = k?.layers && typeof k.layers === "object" ? k.layers : null;
  const csil = layers?.csil && typeof layers.csil === "object" ? layers.csil : null;
  const socialConflict = !!csil?.socialConflictFlag;

  const sources = Array.isArray(gm?.sources) ? gm.sources : [];
  const drift = gm?.driftGuard && typeof gm.driftGuard === "object" ? gm.driftGuard : null;
  const fullSnapshotRecommended = !!(drift && drift.fullSnapshotRecommended);
  const networkDiffDirty = !!(nd && nd.dirty);
  const peerCount = ui != null && Number.isFinite(Number(ui.peerCount)) ? Number(ui.peerCount) : null;

  const narrativeArcId = suggestNarrativeArcIdForGenesisV0({
    frame: coherenceFrame ?? 0,
    sourcesCount: sources.length,
    socialConflict,
    multiUserPeers: (peerCount ?? 0) >= 2 || sources.length >= 2
  });

  const roleSignature = `${rhizohRuntimeRole}|${modeHint}|src=${sources.length}|cf=${coherenceFrame ?? ""}`;

  const { publishRecommendationScore, emotionalDensity01 } = computePublishRecommendationScoreV0({
    energyHint01,
    socialConflict,
    networkDiffDirty,
    fullSnapshotRecommended,
    sourcesCount: sources.length,
    peerCount,
    narrativeArcId
  });

  const directorBeat =
    narrativeArcId === CASTLE_YOUTUBE_NARRATIVE_ARC_V0.GENESIS_IGNITION
      ? "observe_self_boot"
      : narrativeArcId === CASTLE_YOUTUBE_NARRATIVE_ARC_V0.FIRST_SOCIAL_COLLISION
        ? "surface_csil_tension"
        : "surface_global_mesh";

  return {
    coherenceFrame,
    modeHint,
    rhizohRuntimeRole,
    focusUserId,
    roleSignature,
    emotionalDensity01,
    narrativeArcId,
    publishRecommendationScore,
    /** Rhizoh “Channel Director” — not full LLM; studio consumes. */
    directorMission: directorBeat,
    defaultEpisodeTitle:
      narrativeArcId === CASTLE_YOUTUBE_NARRATIVE_ARC_V0.MULTI_CASTLE_EMERGENCE
        ? CASTLE_GENESIS_EPISODE_TITLES_V0.ep3
        : narrativeArcId === CASTLE_YOUTUBE_NARRATIVE_ARC_V0.FIRST_SOCIAL_COLLISION
          ? CASTLE_GENESIS_EPISODE_TITLES_V0.ep2
          : CASTLE_GENESIS_EPISODE_TITLES_V0.ep1,
    /** Narrative line for VO / Rhizoh short social (avoid “system is now active”). */
    rhizohSocialLine:
      "We are not announcing power — we are watching the field wake up and name its own tensions.",
    thumbnailPromptSeed: `${rhizohRuntimeRole} · ${modeHint} · arc:${narrativeArcId.split(".").pop()} · peers:${peerCount ?? 0}`,
    titleSeed: `${rhizohRuntimeRole}:${coherenceFrame ?? ""}:${narrativeArcId.split(".").slice(-2).join(".")}`,
    sensorMode: "observation_and_feedback",
    sourcesHead: sources.slice(0, 5)
  };
}
