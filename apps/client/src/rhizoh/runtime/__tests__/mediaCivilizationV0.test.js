import { describe, expect, it, beforeEach } from "vitest";
import {
  addCastleArchiveBookmarkV0,
  addCastleArchiveTagV0,
  addCastleArchiveUserNoteV0,
  saveCastleArchiveEntityV0
} from "../castleArchiveVaultV0.js";
import {
  MEDIA_CIVILIZATION_ACTION_V0,
  runMediaCivilizationPipelineV0
} from "../mediaCivilizationBridgeV0.js";
import { listRhizohKnowledgeV0, resetRhizohKnowledgeStoreForTestV0 } from "../rhizohKnowledgeStoreV0.js";
import { listCastleChronicleV0, resetCastleChronicleForTestV0 } from "../castleChronicleV0.js";
import { ensureGhostMemoryV0, readGhostMemoryV0, resetGhostMemoryForTestV0 } from "../ghostMemoryPersistenceV0.js";
import { readMediaCivilizationV0, resetMediaCivilizationForTestV0 } from "../mediaCivilizationV0.js";

describe("castleArchiveVaultV0 annotations", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("rhizoh_castle_archive_vault_v0");
    }
  });

  it("stores user notes, tags, and bookmarks on entities", () => {
    const ent = saveCastleArchiveEntityV0({ title: "Lecture", format: "text/plain", content: "notes" });
    addCastleArchiveUserNoteV0(ent.id, "Key insight about topology");
    addCastleArchiveTagV0(ent.id, "research");
    const bm = addCastleArchiveBookmarkV0(ent.id, { label: "Chapter 2", positionSec: 120 });
    expect(bm.ok).toBe(true);
    expect(bm.bookmark.positionSec).toBe(120);
  });
});

describe("mediaCivilizationBridgeV0", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("rhizoh_castle_archive_vault_v0");
    }
    resetRhizohKnowledgeStoreForTestV0();
    resetCastleChronicleForTestV0();
    resetGhostMemoryForTestV0();
    resetMediaCivilizationForTestV0();
    ensureGhostMemoryV0({ ghostId: "ghost_test" });
  });

  it("runs user note through Archive → Memory → Knowledge → Chronicle", () => {
    const ent = saveCastleArchiveEntityV0({
      title: "NASA Stream Notes",
      format: "text/plain",
      content: "Observation window",
      tags: ["media"]
    });
    const result = runMediaCivilizationPipelineV0({
      action: MEDIA_CIVILIZATION_ACTION_V0.NOTE,
      entityId: ent.id,
      noteText: "User bookmarked the launch sequence explanation."
    });
    expect(result.note?.text).toContain("launch sequence");
    expect(listRhizohKnowledgeV0().length).toBeGreaterThan(0);
    expect(listCastleChronicleV0().length).toBeGreaterThan(0);
    expect(readGhostMemoryV0()?.memories?.length).toBeGreaterThan(0);
    expect(readMediaCivilizationV0().notesWritten).toBe(1);
  });

  it("does not auto-summarize — knowledge answer is user text", () => {
    const ent = saveCastleArchiveEntityV0({ title: "Clip", format: "text/plain" });
    runMediaCivilizationPipelineV0({
      action: MEDIA_CIVILIZATION_ACTION_V0.NOTE,
      entityId: ent.id,
      noteText: "Exact user wording preserved."
    });
    const row = listRhizohKnowledgeV0().find((k) => k.answer.includes("Exact user wording"));
    expect(row?.teacher).toBe("user");
    expect(row?.answer).toBe("Exact user wording preserved.");
  });
});
