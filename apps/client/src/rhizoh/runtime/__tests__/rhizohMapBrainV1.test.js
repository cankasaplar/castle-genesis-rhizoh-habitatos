import { describe, expect, it } from "vitest";
import { buildRhizohMapBrainActionsV1 } from "../rhizohMapBrainV1.js";

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
});
