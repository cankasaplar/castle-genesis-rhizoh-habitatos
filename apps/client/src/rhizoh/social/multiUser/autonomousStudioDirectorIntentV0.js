/**
 * SPECFLOW: RESEARCH-ONLY — **Autonomous Studio Director** iskeleti: gerçek clip/stream/kamera
 * orkestrasyonu yok; distributor + fatigue + episode sinyallerinden **yönlendirme niyeti** üretir
 * (ileride medya motoruna bağlanacak).
 */

export const AUTONOMOUS_STUDIO_DIRECTOR_INTENT_SCHEMA_V0 = "castle.rhizoh.autonomous_studio_director_intent.v0";

/**
 * @param {Record<string, unknown>|null|undefined} distributor — `distributeGlobalCoherenceKernelOutputV0` sonucu
 * @param {{ intensityEwma01?: number }|null} [opts]
 */
export function computeAutonomousStudioDirectorIntentV0(distributor, opts) {
  const d = distributor && typeof distributor === "object" ? distributor : {};
  const o = opts && typeof opts === "object" ? opts : {};
  const y = d.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null;
  const pr = y != null ? Number(y.publishRecommendationScore) : NaN;
  const dirty = !!(d.networkDiff && typeof d.networkDiff === "object" && d.networkDiff.dirty);
  const fullSnap = !!(d.studioEvent && typeof d.studioEvent === "object" && d.studioEvent.fullSnapshotRecommended);
  const intensity = Number(o.intensityEwma01);
  const hot = Number.isFinite(intensity) && intensity >= 0.72;

  let streamBias = "hold";
  if ((Number.isFinite(pr) && pr >= 0.56) || dirty || fullSnap) streamBias = "open";

  let clipExtraction = "none";
  if (dirty && Number.isFinite(pr) && pr >= 0.5) clipExtraction = "pulse_window_research";
  else if (fullSnap) clipExtraction = "full_snapshot_marker";

  const cameraEvent = hot ? "slow_push_research" : dirty ? "micro_reframe_research" : "idle";

  return {
    schema: AUTONOMOUS_STUDIO_DIRECTOR_INTENT_SCHEMA_V0,
    ts: Date.now(),
    streamBias,
    clipExtraction,
    cameraEvent,
    directorMission: y && typeof y.directorMission === "string" ? y.directorMission : null,
    narrativeArcId: y && typeof y.narrativeArcId === "string" ? y.narrativeArcId : null,
    note: "Orchestration deferred — intent only until media pipeline binds."
  };
}
