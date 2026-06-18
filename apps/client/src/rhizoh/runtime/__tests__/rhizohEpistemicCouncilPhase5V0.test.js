import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  COUNCIL_MEMORY_KIND_V0,
  __resetEpistemicCouncilForTestV0,
  evaluateCouncilCooldownV0,
  evaluateCouncilTriggerV0,
  maybeEnqueueEpistemicCouncilV0,
  runEpistemicCouncilPipelineV0
} from "../rhizohEpistemicCouncilV0.js";
import { TOPOLOGY_EVENT_TYPES_V0 } from "../rhizohTopologyEventEmitterV0.js";

describe("rhizohEpistemicCouncilV0 phase5", () => {
  beforeEach(() => {
    __resetEpistemicCouncilForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: true }, chessGameCluster: { running: true } };
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          anomalyScore: 0.71,
          severity: "elevated",
          synthesis: "Gateway council anomaly elevated.",
          reasoningChain: [
            { step: "COLLECT", atMs: Date.now() },
            { step: "RANK", atMs: Date.now() },
            { step: "SYNTHESIZE", atMs: Date.now(), anomalyScore: 0.71 }
          ],
          lenses: [{ lensId: "gateway_collect_0", rank: 1 }]
        })
      }))
    );
  });

  it("throttles repeated council triggers per match", async () => {
    const trigger = evaluateCouncilTriggerV0({
      stockfishTimeout: true,
      matchId: "cluster_1_x"
    });
    await runEpistemicCouncilPipelineV0(trigger);
    const throttle = evaluateCouncilCooldownV0(trigger);
    expect(throttle?.throttled).toBe(true);
    const second = maybeEnqueueEpistemicCouncilV0({ stockfishTimeout: true, matchId: "cluster_1_x" });
    expect(second?.throttled).toBe(true);
  });

  it("runs gateway pipeline with anomaly reasoning fields", async () => {
    const trigger = evaluateCouncilTriggerV0({
      topologyEventType: TOPOLOGY_EVENT_TYPES_V0.DRIFT_DETECTED,
      matchId: "cluster_2_x",
      bypassCooldown: true
    });
    const obs = await runEpistemicCouncilPipelineV0(trigger);
    expect(obs.anomalyScore).toBe(0.71);
    expect(obs.reasoningChain?.length).toBeGreaterThanOrEqual(3);
    expect(obs.gatewayOk).toBe(true);
    expect(obs.kind).toBe(COUNCIL_MEMORY_KIND_V0.CONTEXTUAL_ANNOTATION);
  });
});
