import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetChessUnifiedMemoryGraphForTestV0 } from "../chessUnifiedMemoryGraphV0.js";
import { __resetChessEngineTaskQueueForTestV0 } from "../chessEngineTaskQueueV0.js";
import {
  convertGeometryDriftToUglRewardV0,
  convertPolicyDiffToUglRewardV0,
  compileObservationToUglEventV0,
  resolveUglActorIdV0
} from "../rhizohDriftRewardConverterV0.js";
import { __resetUglEventStreamForTestV0, appendUglEventV0, readUglEventStreamV0 } from "../rhizohUglEventV0.js";
import {
  encodeChessFenTensorV0,
  encodeUglStateV0,
  flattenChessStateEmbeddingV0
} from "../rhizohUglStateEncoderV0.js";
import { chessUciToActionIndexV0, encodeUglActionV0 } from "../rhizohUglActionSpaceV0.js";
import { computeUglRewardV0 } from "../rhizohUglRewardModelV0.js";
import {
  applyChessUglActionV0,
  getChessUglAdapterV0,
  initChessUglStateV0,
  legalChessUglActionsV0
} from "../rhizohUglChessAdapterV0.js";
import {
  __resetUglMatchSchedulerForTestV0,
  getUglMatchSchedulerSnapshotV0,
  scheduleUglLearnTaskV0,
  scheduleUglPlayTaskV0
} from "../rhizohUglMatchSchedulerV0.js";
import { __resetRhizohUglBootForTestV0, buildRhizohUglReportV0, ensureRhizohUglV0 } from "../rhizohUglBootV0.js";
import { buildRhizohChessEvolutionCurveV0, __resetRhizohChessEvolutionCurveForTestV0 } from "../rhizohChessEvolutionCurveV0.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("rhizohUglLayerV0", () => {
  beforeEach(() => {
    __resetChessUnifiedMemoryGraphForTestV0();
    __resetUglEventStreamForTestV0();
    __resetUglMatchSchedulerForTestV0();
    __resetRhizohUglBootForTestV0();
    __resetChessEngineTaskQueueForTestV0();
    __resetRhizohChessEvolutionCurveForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
  });

  it("encodes chess FEN to canonical tensor + embedding", () => {
    const tensor = encodeChessFenTensorV0(START_FEN);
    expect(tensor.rank).toBe(8);
    expect(tensor.file).toBe(8);
    expect(tensor.channels).toBe(13);
    expect(tensor.data.some((v) => v === 1)).toBe(true);
    const emb = flattenChessStateEmbeddingV0(START_FEN);
    expect(emb).toHaveLength(64);
    const state = encodeUglStateV0("chess", { fen: START_FEN });
    expect(state.meta.gameType).toBe("chess");
    expect(state.embedding).toHaveLength(64);
  });

  it("normalizes chess UCI into action space", () => {
    const action = encodeUglActionV0("chess", { actorId: "white", uci: "e2e4" });
    expect(action.payload.uci).toBe("e2e4");
    expect(chessUciToActionIndexV0("e2e4")).toBeGreaterThanOrEqual(0);
    expect(action.embedding).toHaveLength(64);
  });

  it("computes unified reward from policy_diff rank", () => {
    const r = convertPolicyDiffToUglRewardV0(
      { matchedRank: 1, drifted: false, winningLine: { cp: 40 } },
      { isNewPosition: true }
    );
    expect(r.shaping).toBe(1);
    expect(r.total).toBeGreaterThan(0);
  });

  it("computes drift reward from geometry family mismatch", () => {
    const r = convertGeometryDriftToUglRewardV0({
      z: 0.54,
      context: { playedPattern: "cluster", expectedPattern: "jump" }
    });
    expect(r.drift).toBeGreaterThan(0.3);
  });

  it("compiles geometry drift without policyDiff (no slotId crash)", () => {
    const event = compileObservationToUglEventV0({
      matchId: "cluster_3_test",
      geometryDrift: {
        z: 0.54,
        context: { playedPattern: "cluster", expectedPattern: "jump" }
      },
      source: "geometry_drift"
    });
    expect(event.a.actorId).toBe("unknown");
    expect(event.r.drift).toBeGreaterThan(0);
  });

  it("resolveUglActorId prefers explicit actorId", () => {
    expect(resolveUglActorIdV0({ actorId: "rhizoh_ai" })).toBe("rhizoh_ai");
    expect(resolveUglActorIdV0({ policyDiff: { slotId: 2 } })).toBe("slot_2");
    expect(resolveUglActorIdV0({})).toBe("unknown");
  });

  it("compiles observation artifacts into UGLEvent", () => {
    const event = compileObservationToUglEventV0({
      matchId: "cluster_0_test",
      fenBefore: START_FEN,
      fenAfter: START_FEN,
      policyDiff: { matchedRank: 3, drifted: true, played: "e2e4" },
      geometryDrift: {
        z: 0.54,
        context: { playedPattern: "cluster", expectedPattern: "jump" }
      }
    });
    expect(event.schema).toContain("ugl_event");
    expect(event.r.total).toBeGreaterThan(0);
    appendUglEventV0(event);
    expect(readUglEventStreamV0(4)).toHaveLength(1);
  });

  it("chess adapter applies legal moves deterministically", () => {
    const adapter = getChessUglAdapterV0();
    expect(adapter.rulesetId).toContain("chess");
    const legal = legalChessUglActionsV0(START_FEN);
    expect(legal.length).toBeGreaterThan(10);
    const e4 = legal.find((a) => a.payload.uci === "e2e4");
    expect(e4).toBeTruthy();
    const applied = applyChessUglActionV0(START_FEN, e4);
    expect(applied.fen).toContain("4P3");
    expect(initChessUglStateV0().meta.gameType).toBe("chess");
  });

  it("defers learn tasks when play pipeline is busy", async () => {
    let playDone = false;
    const playPromise = scheduleUglPlayTaskV0(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            playDone = true;
            resolve("play");
          }, 40);
        }),
      { kind: "cluster_move", label: "test_play" }
    );
    const learnResult = await scheduleUglLearnTaskV0(async () => "learn", { label: "test_learn" });
    expect(learnResult).toBe(null);
    const snapBusy = getUglMatchSchedulerSnapshotV0();
    expect(snapBusy.learnPipeline.deferred).toBeGreaterThanOrEqual(1);
    await playPromise;
    await vi.waitFor(
      () => {
        expect(playDone).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it("installs ugl DevTools and report", () => {
    ensureRhizohUglV0();
    expect(typeof window.__rhizoh.uglReport).toBe("function");
    const report = buildRhizohUglReportV0();
    expect(report.version).toBe(1);
    expect(report.adapters).toContain("chess");
    expect(report.scheduler.pipelines).toContain("play");
  });

  it("evolution curve exposes performanceDelta", async () => {
    const report = await buildRhizohChessEvolutionCurveV0();
    expect(report.performanceDelta).toBeTruthy();
    expect(report.performanceDelta).toHaveProperty("graphVersionChanged");
    expect(report.performanceDelta).toHaveProperty("predictionAccuracyDelta");
  });
});
