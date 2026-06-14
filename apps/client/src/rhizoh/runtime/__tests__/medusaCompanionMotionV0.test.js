import { describe, expect, it } from "vitest";
import { collectMedusaSnakeMeshesV0, tagMedusaGltfSnakeMeshesV0 } from "../medusaCompanionMotionV0.js";

describe("medusaCompanionMotionV0", () => {
  it("tags snake meshes by name", () => {
    const snake = { name: "Hair_Snake_01", userData: {} };
    const bust = { name: "Bust", userData: {} };
    const root = {
      traverse(fn) {
        fn(snake);
        fn(bust);
      }
    };
    tagMedusaGltfSnakeMeshesV0(root);
    expect(snake.userData.medusaSnake).toBe(true);
    const snakes = collectMedusaSnakeMeshesV0(root);
    expect(snakes).toHaveLength(1);
    expect(snakes[0].name).toBe("Hair_Snake_01");
  });
});
