import { describe, expect, it } from "vitest";
import {
  filterPinsForWorldMapToolV0,
  isSatelliteWorldMapToolV0,
  isSpiralMMOMapPinV0,
  listSatelliteSpiralMapPinsV0
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

  it("listSatelliteSpiralMapPinsV0 returns bootstrap + continents", () => {
    const spirals = listSatelliteSpiralMapPinsV0();
    expect(spirals.length).toBeGreaterThanOrEqual(8);
    expect(spirals.every((p) => p.type === "spiralmmo")).toBe(true);
  });

  it("filterPinsForWorldMapToolV0 hides spiral pins on V11 city map", () => {
    const filtered = filterPinsForWorldMapToolV0(pins, "city_map");
    expect(filtered.some((p) => p.type === "spiralmmo")).toBe(false);
    expect(filtered.some((p) => p.id === "ghost")).toBe(true);
  });

  it("filterPinsForWorldMapToolV0 returns authoritative spiral set on satellite", () => {
    const filtered = filterPinsForWorldMapToolV0(pins, "satellite");
    expect(filtered).toEqual(listSatelliteSpiralMapPinsV0());
    expect(isSatelliteWorldMapToolV0("satellite")).toBe(true);
  });
});
