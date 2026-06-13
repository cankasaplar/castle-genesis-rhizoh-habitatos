import { describe, expect, it, beforeEach } from "vitest";
import {
  ensureCastleIdentityV0,
  incrementCastleIdentityStatV0,
  mergeCastleIdentityFromCloudV0,
  readCastleIdentityV0,
  resetCastleIdentityForTestV0
} from "../castleIdentityV0.js";
import {
  appendGhostMemoryV0,
  ensureGhostMemoryV0,
  mergeGhostMemoryFromCloudV0,
  resetGhostMemoryForTestV0
} from "../ghostMemoryPersistenceV0.js";
import {
  appendCastleChronicleEntryV0,
  listCastleChronicleV0,
  recordFirstContactChronicleV0,
  resetCastleChronicleForTestV0
} from "../castleChronicleV0.js";

describe("castleIdentityV0", () => {
  beforeEach(() => {
    resetCastleIdentityForTestV0();
  });

  it("creates and increments castle identity stats", () => {
    ensureCastleIdentityV0({ castleId: "castle_01", founder: "Mimar", motto: "Remember" });
    incrementCastleIdentityStatV0("visitors", 2);
    incrementCastleIdentityStatV0("matchesPlayed", 1);
    const id = readCastleIdentityV0();
    expect(id?.castleId).toBe("castle_01");
    expect(id?.visitors).toBe(2);
    expect(id?.matchesPlayed).toBe(1);
    expect(id?.motto).toBe("Remember");
  });

  it("merges cloud identity with max counters", () => {
    ensureCastleIdentityV0({ castleId: "castle_01", visitors: 5 });
    mergeCastleIdentityFromCloudV0({
      castleId: "castle_01",
      visitors: 12,
      matchesPlayed: 3
    });
    const id = readCastleIdentityV0();
    expect(id?.visitors).toBe(12);
    expect(id?.matchesPlayed).toBe(3);
  });
});

describe("ghostMemoryPersistenceV0", () => {
  beforeEach(() => {
    resetGhostMemoryForTestV0();
  });

  it("stores relationships and memories", () => {
    ensureGhostMemoryV0({ ghostId: "ghost_01" });
    appendGhostMemoryV0({
      summary: "First contact with Castle Alpha",
      peerCastleId: "castle_alpha",
      tags: ["network"]
    });
    const ghost = mergeGhostMemoryFromCloudV0([
      {
        ghostId: "ghost_01",
        relationships: [{ peerCastleId: "castle_alpha", kind: "ally" }],
        memories: [],
        preferences: [{ key: "tone", value: "warm" }]
      }
    ]);
    expect(ghost?.memories?.length).toBeGreaterThan(0);
    expect(ghost?.relationships?.[0]?.peerCastleId).toBe("castle_alpha");
  });
});

describe("castleChronicleV0", () => {
  beforeEach(() => {
    resetCastleChronicleForTestV0();
  });

  it("appends chronicle entries with dedupe", () => {
    recordFirstContactChronicleV0({ peerCastleId: "castle_alpha" });
    recordFirstContactChronicleV0({ peerCastleId: "castle_alpha" });
    appendCastleChronicleEntryV0({
      kind: "library_wing",
      title: "Opened Library Wing"
    });
    const rows = listCastleChronicleV0();
    expect(rows.length).toBe(2);
    expect(rows.some((r) => r.title.includes("castle_alpha"))).toBe(true);
  });
});
