import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createLifeContinuityStoreV0,
  LIFE_CONTINUITY_CONTRACT_V0,
  LIFE_STORE_CLASS_V0
} from "../rhizoh/lifeContinuityStoreV0.js";

const USER = "user_firebase_alpha_01";

describe("lifeContinuityStoreV0", () => {
  /** @type {ReturnType<typeof createLifeContinuityStoreV0>} */
  let store;

  beforeEach(() => {
    store = createLifeContinuityStoreV0();
  });

  it("appendTurn creates thread and returns frozen rows", () => {
    const r = store.appendTurn({
      user_id: USER,
      role: "user",
      text: "Geçen pazartesi continuity strip hakkında konuşalım.",
      correlation_id: "corr_001"
    });
    assert.equal(r.ok, true);
    assert.equal(r.thread.contract_version, LIFE_CONTINUITY_CONTRACT_V0);
    assert.equal(r.thread.life_store_class, LIFE_STORE_CLASS_V0);
    assert.equal(r.turn.role, "user");
    assert.match(r.thread.thread_id, /^thr_/);
    assert.match(r.turn.turn_id, /^trn_/);
  });

  it("getRecentTurns returns newest first", () => {
    const a = store.appendTurn({
      user_id: USER,
      role: "user",
      text: "ilk",
      at: "2026-05-25T10:00:00.000Z"
    });
    store.appendTurn({
      user_id: USER,
      thread_id: a.thread.thread_id,
      role: "assistant",
      text: "ikinci",
      at: "2026-05-25T10:01:00.000Z"
    });
    const recent = store.getRecentTurns(a.thread.thread_id, { user_id: USER, limit: 10 });
    assert.equal(recent.ok, true);
    assert.equal(recent.turns.length, 2);
    assert.equal(recent.turns[0].text, "ikinci");
    assert.equal(recent.turns[1].text, "ilk");
  });

  it("getThread enforces user_id boundary", () => {
    const r = store.appendTurn({ user_id: USER, role: "user", text: "gizli" });
    const ok = store.getThread(r.thread.thread_id, { user_id: USER });
    const bad = store.getThread(r.thread.thread_id, { user_id: "other_user_xx" });
    assert.equal(ok.ok, true);
    assert.equal(bad.ok, false);
  });

  it("appendNote and appendLink attach to thread", () => {
    const t = store.appendTurn({ user_id: USER, role: "user", text: "not al" });
    const note = store.appendNote({
      user_id: USER,
      thread_id: t.thread.thread_id,
      body: "L1 = süreklilik"
    });
    const link = store.appendLink({
      user_id: USER,
      thread_id: t.thread.thread_id,
      url: "https://www.rhizoh.com",
      title: "Rhizoh"
    });
    assert.equal(note.ok, true);
    assert.equal(link.ok, true);
    assert.equal(note.note.thread_id, t.thread.thread_id);
  });

  it("rejects append to missing thread", () => {
    const r = store.appendTurn({
      user_id: USER,
      thread_id: "thr_does_not_exist",
      role: "user",
      text: "fail"
    });
    assert.equal(r.ok, false);
    assert.equal(r.code, "thread_not_found");
  });
});
