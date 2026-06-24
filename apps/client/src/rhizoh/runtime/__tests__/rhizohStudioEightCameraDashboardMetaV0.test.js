import { describe, expect, it } from "vitest";
import {
  STUDIO_EIGHT_CAMERA_GRID_ORDER_V0,
  assertStudioEightCameraGridOrderV0,
  buildStudioEightCameraDashboardTilesV0,
  formatStudioEightCameraTileV0,
  resolveStudioEightCameraHrefV0,
  resolveStudioEightCameraTitleV0
} from "../rhizohStudioEightCameraDashboardMetaV0.js";

describe("rhizohStudioEightCameraDashboardMetaV0", () => {
  it("grid order covers all eight camera ids", () => {
    assertStudioEightCameraGridOrderV0();
    expect(STUDIO_EIGHT_CAMERA_GRID_ORDER_V0).toHaveLength(8);
  });

  it("formats chess tile with live cluster", () => {
    const snap = {
      learningCameras: { chess: { movesSeen: 31 } },
      academyUnion: { unionLabel: "chess_solo", totalMovesSeen: 31 }
    };
    const tile = formatStudioEightCameraTileV0(
      "chess_arena",
      { id: "chess_arena", armed: true, clusterRunning: true, movesSeen: 31 },
      snap,
      "en"
    );
    expect(tile.title).toBe("Chess Arena");
    expect(tile.live).toBe(true);
    expect(tile.primary).toBe("31 moves");
    expect(tile.href).toBe("/world/space?channel=chess");
  });

  it("marks spatial as held without href", () => {
    const tile = formatStudioEightCameraTileV0(
      "spatial",
      { id: "spatial", armed: false, legalHold: true, phase: "MODEL" },
      {},
      "en"
    );
    expect(tile.held).toBe(true);
    expect(tile.href).toBeNull();
    expect(resolveStudioEightCameraHrefV0("spatial")).toBeNull();
  });

  it("builds dashboard tiles in grid order", () => {
    const snap = {
      eightCameras: {
        chess_arena: { id: "chess_arena", armed: true, movesSeen: 5 },
        go_arena: { id: "go_arena", armed: false, movesSeen: 0 },
        checkers_arena: { id: "checkers_arena", armed: false, movesSeen: 0 },
        academy: { id: "academy", armed: true, unionLabel: "chess_solo" },
        habitat: { id: "habitat", armed: false, climateLabel: null },
        memory: { id: "memory", armed: false, nodeCount: 0 },
        world_sports: { id: "world_sports", armed: false, liveMatchCount: 0, pinCount: 0 },
        spatial: { id: "spatial", armed: false, legalHold: true }
      },
      learningCameras: {
        chess: { movesSeen: 5 },
        go: { movesSeen: 0 },
        checkers: { movesSeen: 0 }
      },
      academyUnion: { unionLabel: "chess_solo", totalMovesSeen: 5 },
      habitatClimate: {},
      worldBridge: { memoryNodeCount: 0 }
    };
    const tiles = buildStudioEightCameraDashboardTilesV0(snap, "en");
    expect(tiles.map((t) => t.id)).toEqual([...STUDIO_EIGHT_CAMERA_GRID_ORDER_V0]);
    expect(resolveStudioEightCameraTitleV0("habitat", "tr")).toBe("Habitat");
  });
});
