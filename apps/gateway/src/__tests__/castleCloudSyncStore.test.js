import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getCloudSyncSnapshotV0,
  mergeCloudSyncSnapshotV0,
  resetCloudSyncStoreForTestV0
} from "../castleCloudSyncStore.js";

describe("castleCloudSyncStore", () => {
  it("merges entities and preserves events append-only", async () => {
    await resetCloudSyncStoreForTestV0();
    const uid = "test-user-1";
    await mergeCloudSyncSnapshotV0(uid, {
      entities: [{ id: "ent_1", title: "Doc A", format: "text/plain" }],
      events: [{ id: "evt_1", type: "entity_saved", entityId: "ent_1" }]
    });
    const snap = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap.entities.length, 1);
    assert.equal(snap.events.length, 1);

    await mergeCloudSyncSnapshotV0(uid, {
      entities: [{ id: "ent_1", title: "Doc A updated", tombstonedAt: "2026-01-01T00:00:00.000Z" }],
      events: [{ id: "evt_2", type: "entity_tombstoned", entityId: "ent_1" }]
    });
    const snap2 = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap2.entities[0].title, "Doc A updated");
    assert.equal(snap2.events.length, 2);
  });

  it("merges castle identity counters and chronicle entries", async () => {
    await resetCloudSyncStoreForTestV0();
    const uid = "castle-memory-user";
    await mergeCloudSyncSnapshotV0(uid, {
      castleIdentity: {
        castleId: "castle_memory_user",
        founder: "Founder A",
        visitors: 3,
        matchesPlayed: 1
      },
      chronicle: [
        {
          id: "chr_1",
          ts: "2026-06-15T10:00:00.000Z",
          title: "First Contact with Castle Alpha",
          kind: "first_contact"
        }
      ]
    });
    await mergeCloudSyncSnapshotV0(uid, {
      castleIdentity: {
        castleId: "castle_memory_user",
        visitors: 10,
        matchesPlayed: 2,
        libraryWingsOpened: 1
      },
      chronicle: [
        {
          id: "chr_2",
          ts: "2026-06-18T10:00:00.000Z",
          title: "Won Chess Match",
          kind: "chess_won"
        }
      ]
    });
    const snap = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap.castleIdentity.visitors, 10);
    assert.equal(snap.castleIdentity.matchesPlayed, 2);
    assert.equal(snap.castleIdentity.libraryWingsOpened, 1);
    assert.equal(snap.chronicle.length, 2);
  });

  it("merges opening book entries by key with max counters", async () => {
    await resetCloudSyncStoreForTestV0();
    const uid = "opening-book-user";
    await mergeCloudSyncSnapshotV0(uid, {
      openingBook: [
        {
          key: "b20",
          name: "Sicilian Defense",
          eco: "B20",
          games: 2,
          wins: 1,
          losses: 1
        }
      ]
    });
    await mergeCloudSyncSnapshotV0(uid, {
      openingBook: [
        {
          key: "b20",
          name: "Sicilian Defense",
          eco: "B20",
          games: 1,
          wins: 0,
          losses: 1
        }
      ]
    });
    const snap = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap.openingBook.length, 1);
    assert.equal(snap.openingBook[0].games, 2);
    assert.equal(snap.openingBook[0].wins, 1);
    assert.equal(snap.openingBook[0].losses, 1);
  });

  it("merges chess civilization profile", async () => {
    await resetCloudSyncStoreForTestV0();
    const uid = "chess-civ-user";
    await mergeCloudSyncSnapshotV0(uid, {
      chessCivilization: {
        castleId: "castle_a",
        elo: 1212,
        rivals: [{ castleId: "castle_b", matches: 2, wins: 1, losses: 1 }]
      }
    });
    await mergeCloudSyncSnapshotV0(uid, {
      chessCivilization: {
        castleId: "castle_a",
        elo: 1220,
        rivals: [{ castleId: "castle_b", matches: 1, wins: 0, losses: 1 }]
      }
    });
    const snap = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap.chessCivilization.elo, 1220);
    assert.equal(snap.chessCivilization.rivals[0].matches, 2);
  });

  it("merges media civilization counters", async () => {
    await resetCloudSyncStoreForTestV0();
    const uid = "media-civ-user";
    await mergeCloudSyncSnapshotV0(uid, {
      mediaCivilization: {
        castleId: "castle_m",
        itemsArchived: 3,
        notesWritten: 2,
        bookmarks: 1
      }
    });
    await mergeCloudSyncSnapshotV0(uid, {
      mediaCivilization: {
        castleId: "castle_m",
        itemsArchived: 1,
        notesWritten: 5,
        bookmarks: 0
      }
    });
    const snap = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap.mediaCivilization.itemsArchived, 3);
    assert.equal(snap.mediaCivilization.notesWritten, 5);
    assert.equal(snap.mediaCivilization.bookmarks, 1);
  });
});
