/**
 * Combined analytics: causal topology on merged stream + entropy / ∇H field on ring∪archive seq bins.
 */
import { resolveGenesisReplayRouterV1, GENESIS_REPLAY_ROUTER_MAX_SPAN } from "./genesisReplayRouterV1.js";
import { queryGenesisContinuityRingV0 } from "./genesisContinuityStreamHubV0.js";
import { listGenesisContinuityArchiveEventsInRangeForAnalyticsV0 } from "./genesisContinuityEventArchiveV0.js";
import { buildRegimeSegmentGraphFromContinuityV1 } from "./genesisReplayCausalTopologyV1.js";
import { computeEntropyGradientFieldV1 } from "./genesisReplayEntropyGradientV1.js";

export const GENESIS_REPLAY_ANALYTICS_SCHEMA = "castle.genesis.replay_analytics.v1";

/**
 * @param {{ from: number, to: number, type?: string, bins?: number, includeCheckpoints?: boolean }} opts
 */
export async function computeGenesisReplayAnalyticsV1(opts) {
  const from = Math.floor(Number(opts?.from) || 0);
  const to = Math.floor(Number(opts?.to) || 0);
  const typeFilter = String(opts?.type ?? "").trim();
  const bins = Number(opts?.bins) || 16;
  const includeCheckpoints = opts?.includeCheckpoints !== false;

  if (from <= 0 || to <= 0) {
    return { ok: false, error: "invalid_range", schema: GENESIS_REPLAY_ANALYTICS_SCHEMA };
  }
  if (to < from) {
    return { ok: false, error: "range_inverted", schema: GENESIS_REPLAY_ANALYTICS_SCHEMA };
  }
  if (to - from > GENESIS_REPLAY_ROUTER_MAX_SPAN) {
    return {
      ok: false,
      error: "range_span_too_large",
      maxSpan: GENESIS_REPLAY_ROUTER_MAX_SPAN,
      schema: GENESIS_REPLAY_ANALYTICS_SCHEMA
    };
  }

  const replay = await resolveGenesisReplayRouterV1({
    from,
    to,
    type: typeFilter,
    includeCheckpoints
  });
  if (!replay.ok) {
    return { ...replay, schema: GENESIS_REPLAY_ANALYTICS_SCHEMA };
  }

  const ringQ = queryGenesisContinuityRingV0(from, to, typeFilter);
  const ringEvents = ringQ.ok ? ringQ.events : [];

  const arch = await listGenesisContinuityArchiveEventsInRangeForAnalyticsV0(from, to, typeFilter);
  const archiveEvents = arch.ok ? arch.events : [];

  const causalTopology = buildRegimeSegmentGraphFromContinuityV1(
    Array.isArray(replay.continuityEvents) ? replay.continuityEvents : []
  );
  const stabilityField = computeEntropyGradientFieldV1(from, to, bins, ringEvents, archiveEvents);

  return {
    ok: true,
    schema: GENESIS_REPLAY_ANALYTICS_SCHEMA,
    from,
    to,
    type: typeFilter || null,
    replayFingerprint: replay.replayFingerprint,
    determinismProjection: replay.determinismProjection,
    causalTopology,
    stabilityField,
    sources: {
      ringQueryOk: ringQ.ok,
      archiveListOk: arch.ok,
      ...(arch.ok ? {} : { archiveError: arch.error, archiveHint: arch.hint })
    }
  };
}
