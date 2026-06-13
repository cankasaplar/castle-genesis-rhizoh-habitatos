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
});
