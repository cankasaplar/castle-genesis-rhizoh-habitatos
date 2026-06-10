import { describe, expect, it, beforeEach } from "vitest";
import {
  aggregateInboundInteractionV1_4,
  buildThreadInteractionFieldV1_4,
  resolveThreadInteractionV1_4
} from "../castleThreadInteractionFieldV1_4.js";
import {
  __resetAttentionInertiaForTestV1_4,
  getAttentionInertiaV1_4,
  tickAttentionInertiaV1_4
} from "../castleAttentionInertiaV1_4.js";
import {
  __resetRealityDynamicsForTestV1_4,
  applyRealityDynamicsV1_4
} from "../castleRealityDynamicsV1_4.js";
import { composeRealityV1_3 } from "../castleRealityCompositionV1_3.js";
import {
  __resetConversationThreadsForTestV1_2,
  createConversationThreadV1_2
} from "../castleConversationThreadV1_2.js";
import { __resetContextualIdentityForTestV1_3 } from "../castleContextualIdentityV1_3.js";
import { __resetRoomRealityForTestV1_2, initRoomRealityV1_2 } from "../castleRoomRealityV1_2.js";

describe("castleRealityDynamicsV1_4", () => {
  beforeEach(() => {
    __resetRealityDynamicsForTestV1_4();
    __resetAttentionInertiaForTestV1_4();
    __resetContextualIdentityForTestV1_3();
    __resetConversationThreadsForTestV1_2();
    __resetRoomRealityForTestV1_2();
    initRoomRealityV1_2({ roomId: "dynamics_room" });
  });

  it("interaction field is directional — co_watch suppresses audiobook", () => {
    const sports = { threadId: "t1", topicLabel: "co_watch_sports", salience: 0.8, executionShare: 0.5 };
    const audio = { threadId: "t2", topicLabel: "audiobook", salience: 0.7, executionShare: 0.5 };
    const ab = resolveThreadInteractionV1_4(sports, audio);
    const ba = resolveThreadInteractionV1_4(audio, sports);
    expect(ab.suppresses).toBeGreaterThan(0.3);
    expect(ab.reframes).toBe(0);
    expect(ba.reframes).toBeGreaterThan(ab.suppresses * 0.3);
  });

  it("attention inertia lags context shift after co_watch history", () => {
    const t0 = 10_000;
    tickAttentionInertiaV1_4({ ownerId: "userA", contextLens: "co_watch", intentWeight: 0.9, atMs: t0 });
    tickAttentionInertiaV1_4({ ownerId: "userA", contextLens: "co_watch", intentWeight: 0.85, atMs: t0 + 500 });

    const shifted = tickAttentionInertiaV1_4({
      ownerId: "userA",
      contextLens: "social",
      intentWeight: 0.7,
      atMs: t0 + 800
    });

    expect(shifted.currentLens).toBe("social");
    expect(shifted.laggedLens).toBe("co_watch");
    expect(shifted.contextShiftPending).toBe(true);
    expect(shifted.deferredContextShiftMs).toBeGreaterThan(0);
    expect(getAttentionInertiaV1_4("userA")?.cognitiveMomentum).toBeGreaterThan(0);
  });

  it("applyRealityDynamics deforms shares nonlinearly — not equal to linear", () => {
    const atMs = 20_000;
    createConversationThreadV1_2({
      ownerId: "user_local",
      topicLabel: "co_watch_sports",
      priority: 85,
      atMs
    });
    createConversationThreadV1_2({
      ownerId: "user_local",
      topicLabel: "audiobook",
      priority: 75,
      atMs: atMs + 100
    });
    createConversationThreadV1_2({
      ownerId: "user_local",
      topicLabel: "general",
      priority: 65,
      atMs: atMs + 200
    });

    const composition = composeRealityV1_3({
      actionPlan: { speak: true, memoryWrite: true, uiHighlight: true, priority: 70, mode: "co_presence" },
      identityEvent: {
        ownerId: "user_local",
        preview: "Rhizoh pozisyon?",
        type: "intent",
        salience: 0.8,
        timestamp: atMs + 300
      },
      atMs: atMs + 400
    });

    const linearWeights = [...(composition.realityFrame.compositionWeights || [])];
    const dynamics = applyRealityDynamicsV1_4(composition, { atMs: atMs + 400 });

    expect(dynamics.schema).toBe("castle.reality_dynamics.v1.4");
    expect(dynamics.deformedPlan.dynamicsApplied).toBe(true);
    expect(dynamics.interactionField.edgeCount).toBeGreaterThan(0);
    expect(dynamics.deformationGraph.nodes.length).toBe(3);

    const deformed = dynamics.deformedFrame.deformedCompositionWeights;
    const deformedSum = deformed.reduce((s, v) => s + v, 0);
    expect(deformedSum).toBeCloseTo(1, 2);

    const maxDelta = dynamics.deformationGraph.nodes.reduce(
      (m, n) => Math.max(m, Math.abs(n.delta)),
      0
    );
    expect(maxDelta).toBeGreaterThan(0);

    const linearSum = linearWeights.reduce((s, v) => s + v, 0);
    expect(deformed.some((v, i) => Math.abs(v - linearWeights[i] / linearSum) > 0.02)).toBe(true);
  });

  it("inbound interaction aggregates suppresses and reframes on audiobook thread", () => {
    const nodes = [
      { threadId: "s", topicLabel: "co_watch_sports", salience: 0.9, executionShare: 0.5 },
      { threadId: "a", topicLabel: "audiobook", salience: 0.7, executionShare: 0.3 },
      { threadId: "g", topicLabel: "general", salience: 0.6, executionShare: 0.2 }
    ];
    const field = buildThreadInteractionFieldV1_4(nodes);
    const inbound = aggregateInboundInteractionV1_4("a", field.edges);
    expect(inbound.suppresses).toBeGreaterThan(0.2);
    expect(inbound.reframes).toBeGreaterThan(0);
  });
});
