import { describe, expect, it, beforeEach } from "vitest";
import {
  listCastleArchiveEntitiesV0,
  listCastleArchiveEventsV0,
  saveCastleArchiveEntityV0,
  tombstoneCastleArchiveEntityV0
} from "../castleArchiveVaultV0.js";

describe("castleArchiveVaultV0", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("rhizoh_castle_archive_vault_v0");
    }
  });

  it("tombstones entity but preserves events", () => {
    const ent = saveCastleArchiveEntityV0({ title: "Test doc", content: "hello", format: "text/plain" });
    expect(listCastleArchiveEntitiesV0().length).toBe(1);
    const del = tombstoneCastleArchiveEntityV0(ent.id);
    expect(del.ok).toBe(true);
    expect(listCastleArchiveEntitiesV0().length).toBe(0);
    const events = listCastleArchiveEventsV0();
    expect(events.some((e) => e.type === "entity_saved")).toBe(true);
    expect(events.some((e) => e.type === "entity_tombstoned")).toBe(true);
  });

  it("persists media meta fields on save", () => {
    const ent = saveCastleArchiveEntityV0({
      title: "Frequency track",
      format: "text/plain",
      content: "ambient loop",
      frequencyBand: "ambient",
      eventState: "live",
      contentKind: "music"
    });
    expect(ent.frequencyBand).toBe("ambient");
    expect(ent.eventState).toBe("live");
    expect(ent.contentKind).toBe("music");
  });
});
