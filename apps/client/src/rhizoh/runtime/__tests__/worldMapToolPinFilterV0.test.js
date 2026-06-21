import { describe, expect, it } from "vitest";
import {
  filterPinsForWorldMapToolV0,
  isSpiralMMOMapPinV0
} from "../worldMapToolPinFilterV0.js";

describe("worldMapToolPinFilterV0", () => {
  const pins = [
    { id: "ghost", type: "ghost" },
    { id: "spiralmmo_bootstrap", type: "spiralmmo" },
    { id: "spiralmmo_europe", type: "spiralmmo" },
    { id: "my_castle", type: "castle" }
  ];

  it("isSpiralMMOMapPinV0 detects spiral pins", () => {
    expect(isSpiralMMOMapPinV0({ type: "spiralmmo" })).toBe(true);
    expect(isSpiralMMOMapPinV0({ type: "ghost" })).toBe(false);
  });

  it("filterPinsForWorldMapToolV0 hides spiral pins on V11 city map", () => {
    const filtered = filterPinsForWorldMapToolV0(pins, "city_map");
    expect(filtered.some((p) => p.type === "spiralmmo")).toBe(false);
    expect(filtered.some((p) => p.id === "ghost")).toBe(true);
  });

  it("filterPinsForWorldMapToolV0 keeps only spiral pins on satellite", () => {
    const filtered = filterPinsForWorldMapToolV0(pins, "satellite");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.type === "spiralmmo")).toBe(true);
  });
});
