import { describe, expect, it } from "vitest";
import {
  RHIZOH_MAP_BRAIN_CONTEXT_WEIGHTS_V1,
  buildRhizohMapBrainActionsV1
} from "../rhizohMapBrainV1.js";

describe("rhizohMapBrainV1", () => {
  it("suggests opening the city map when the map is not active", () => {
    const brain = buildRhizohMapBrainActionsV1({
      mapState: { active: false, activeMapTool: "globe" }
    });

    expect(brain.actions[0]).toMatchObject({
      id: "show_city_map",
      command: "set_map_tool",
      mapTool: "city_map"
    });
  });

  it("prioritizes active castle focus when castle intent is present", () => {
    const brain = buildRhizohMapBrainActionsV1({
      conversationState: { lastIntent: "castle neredeydi" },
      mapState: {
        active: true,
        cesiumReady: true,
        activeMapTool: "city_map",
        hasActiveCastle: true,
        worldDataReady: true
      }
    });

    expect(brain.actions.some((action) => action.id === "focus_active_castle")).toBe(true);
    expect(brain.actions.find((action) => action.id === "focus_active_castle")).toMatchObject({
      command: "cesium_op",
      op: "focus_castle"
    });
  });

  it("turns conversation open loops into memory-node actions", () => {
    const brain = buildRhizohMapBrainActionsV1({
      conversationState: {
        activeThreads: ["map_policy"],
        unresolvedTasks: ["castle_spawn_rule"]
      },
      mapState: {
        active: true,
        activeMapTool: "city_map",
        hasActiveCastle: false,
        memoryNodeCount: 0
      }
    });

    expect(brain.actions).toContainEqual(
      expect.objectContaining({
        id: "show_memory_nodes",
        command: "set_map_tool",
        mapTool: "anchor_map"
      })
    );
  });

  it("applies bounded positive feedback without hiding base confidence", () => {
    const brain = buildRhizohMapBrainActionsV1({
      conversationState: { lastIntent: "castle" },
      mapState: {
        active: true,
        cesiumReady: true,
        activeMapTool: "city_map",
        hasActiveCastle: true
      },
      feedbackState: {
        actions: {
          focus_active_castle: {
            impressions: 4,
            selections: 4,
            successes: 3,
            failures: 0
          }
        }
      }
    });

    const action = brain.actions.find((row) => row.id === "focus_active_castle");
    expect(action.baseConfidence).toBe(0.94);
    expect(action.feedbackBias).toBeGreaterThan(0);
    expect(action.confidence).toBeGreaterThanOrEqual(action.baseConfidence);
  });

  it("exposes context weights for decision transparency", () => {
    const brain = buildRhizohMapBrainActionsV1({
      conversationState: { activeThreads: ["memory"] },
      mapState: {
        active: true,
        activeMapTool: "city_map",
        memoryNodeCount: 1
      }
    });

    expect(brain.contextWeights).toBe(RHIZOH_MAP_BRAIN_CONTEXT_WEIGHTS_V1);
    const memory = brain.actions.find((row) => row.id === "show_memory_nodes");
    expect(memory.contextSource).toBe("conversation");
    expect(memory.contextWeight).toBe(RHIZOH_MAP_BRAIN_CONTEXT_WEIGHTS_V1.conversation);
  });

  it("does not emit Cesium actions when V11 primary map is active but Cesium is not ready", () => {
    const brain = buildRhizohMapBrainActionsV1({
      conversationState: { lastIntent: "castle neredeydi" },
      mapState: {
        active: false,
        cesiumReady: false,
        activeMapTool: "city_map",
        hasActiveCastle: true,
        worldDataReady: true
      }
    });

    expect(brain.actions.some((action) => action.command === "cesium_op")).toBe(false);
    expect(brain.actions.some((action) => action.command === "set_map_tool")).toBe(true);
  });
});
