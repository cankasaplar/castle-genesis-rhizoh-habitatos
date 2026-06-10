import { describe, expect, it, beforeEach } from "vitest";
import {
  CONTEXT_LENS_V1_3,
  __resetContextualIdentityForTestV1_3,
  buildContextualIdentityV1_3,
  getActiveContextualIdentitiesV1_3
} from "../castleContextualIdentityV1_3.js";
import {
  applyContentionDegradationV1_3,
  buildThreadNodesV1_3,
  computeInterferenceMatrixV1_3
} from "../castleAttentionContentionV1_3.js";
import {
  __resetRealityCompositionForTestV1_3,
  composeRealityV1_3,
  OUTPUT_BLEND_MODE_V1_3
} from "../castleRealityCompositionV1_3.js";
import {
  __resetConversationThreadsForTestV1_2,
  createConversationThreadV1_2
} from "../castleConversationThreadV1_2.js";
import { __resetRoomRealityForTestV1_2, initRoomRealityV1_2 } from "../castleRoomRealityV1_2.js";

describe("castleRealityCompositionV1_3", () => {
  beforeEach(() => {
    __resetContextualIdentityForTestV1_3();
    __resetRealityCompositionForTestV1_3();
    __resetConversationThreadsForTestV1_2();
    __resetRoomRealityForTestV1_2();
    initRoomRealityV1_2({ roomId: "compose_room" });
  });

  it("contextual identity separates same owner by device and lens", () => {
    const coWatch = buildContextualIdentityV1_3({
      ownerId: "userA",
      source: "youtube",
      preview: "goal replay maç",
      type: "reference",
      atMs: 1000
    });
    const technical = buildContextualIdentityV1_3({
      ownerId: "userA",
      source: "mic",
      preview: "teknik api bug",
      type: "intent",
      atMs: 1100
    });
    expect(coWatch.ownerId).toBe(technical.ownerId);
    expect(coWatch.contextualId).not.toBe(technical.contextualId);
    expect(coWatch.contextLens).toBe(CONTEXT_LENS_V1_3.CO_WATCH);
    expect(technical.contextLens).toBe(CONTEXT_LENS_V1_3.TECHNICAL);
    expect(getActiveContextualIdentitiesV1_3("userA").length).toBe(2);
  });

  it("contention graph degrades overlapping threads and normalizes shares", () => {
    const atMs = 5000;
    const threads = [
      createConversationThreadV1_2({
        ownerId: "userA",
        topicLabel: "co_watch_sports",
        priority: 80,
        atMs
      }),
      createConversationThreadV1_2({
        ownerId: "userA",
        topicLabel: "audiobook",
        priority: 75,
        atMs: atMs + 100
      }),
      createConversationThreadV1_2({
        ownerId: "userA",
        topicLabel: "technical",
        priority: 60,
        atMs: atMs + 200
      })
    ];
    const nodes = buildThreadNodesV1_3(threads, atMs + 500);
    const matrix = computeInterferenceMatrixV1_3(nodes);
    const contested = applyContentionDegradationV1_3(nodes, matrix);

    expect(contested.length).toBe(3);
    expect(matrix.matrix[0][1]).toBeGreaterThan(0.4);
    const shareSum = contested.reduce((s, n) => s + n.executionShare, 0);
    expect(shareSum).toBeCloseTo(1, 2);
    expect(contested.every((n) => n.executionShare >= 0.05)).toBe(true);
    expect(contested.every((n) => n.interferenceWeight > 0)).toBe(true);
  });

  it("composeReality produces partial execution shares instead of binary speak", () => {
    const atMs = 10_000;
    createConversationThreadV1_2({
      ownerId: "user_local",
      topicLabel: "co_watch_sports",
      priority: 85,
      atMs
    });
    createConversationThreadV1_2({
      ownerId: "user_local",
      topicLabel: "audiobook",
      priority: 70,
      atMs: atMs + 50
    });

    const result = composeRealityV1_3({
      actionPlan: { speak: true, memoryWrite: true, uiHighlight: true, priority: 70, mode: "co_presence" },
      identityEvent: {
        ownerId: "user_local",
        threadId: "thread_sports",
        preview: "Rhizoh pozisyon?",
        type: "intent",
        salience: 0.8,
        timestamp: atMs + 100
      },
      source: "mic",
      atMs: atMs + 200
    });

    expect(result.realityFrame.threads.length).toBeGreaterThanOrEqual(2);
    expect(result.composedPlan.partialExecution).toBe(true);
    expect(result.composedPlan.speakShare).toBeGreaterThan(0);
    expect(result.composedPlan.memoryShare).toBeGreaterThan(0);
    const sliceSum = result.realityFrame.threadExecutionSlices.reduce(
      (s, x) => s + x.executionShare,
      0
    );
    expect(sliceSum).toBeCloseTo(1, 2);
  });

  it("room defer downgrades speak but allows background narrative band", () => {
    const atMs = 20_000;
    createConversationThreadV1_2({
      ownerId: "user_host",
      topicLabel: "co_watch_sports",
      priority: 90,
      atMs
    });

    const result = composeRealityV1_3({
      actionPlan: { speak: true, priority: 70, mode: "co_presence" },
      roomArbitration: { disposition: "defer" },
      identityEvent: {
        ownerId: "user_guest",
        preview: "Rhizoh?",
        type: "intent",
        salience: 0.7,
        timestamp: atMs
      },
      atMs
    });

    expect(result.composedPlan.speakShare).toBeLessThan(0.35);
    expect(
      result.realityFrame.outputBlend === OUTPUT_BLEND_MODE_V1_3.BACKGROUND_NARRATIVE ||
        result.realityFrame.outputBlend === OUTPUT_BLEND_MODE_V1_3.SILENT_OBSERVE
    ).toBe(true);
  });
});
