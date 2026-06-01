import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createLifeContinuityStoreV0 } from "../rhizoh/lifeContinuityStoreV0.js";
import {
  recallCitationsV0,
  tokenizeRecallQueryV0,
  isLikelyRecallQueryV0,
  buildRecallExcerptV0
} from "../rhizoh/lifeRecallEngineV0.js";

const USER = "user_recall_alpha_01";

describe("lifeRecallEngineV0", () => {
  /** @type {ReturnType<typeof createLifeContinuityStoreV0>} */
  let store;

  beforeEach(() => {
    store = createLifeContinuityStoreV0();
    store.appendTurn({
      user_id: USER,
      role: "user",
      text: "Geçen pazartesi Castle ve continuity strip hakkında konuştuk.",
      at: "2026-05-25T14:00:00.000Z"
    });
    store.appendTurn({
      user_id: USER,
      role: "assistant",
      text: "Evet, strip visit echo ile bağlanır.",
      at: "2026-05-25T14:01:00.000Z"
    });
    store.appendTurn({
      user_id: USER,
      role: "user",
      text: "Bugün sadece hava durumu.",
      at: "2026-06-01T09:00:00.000Z"
    });
  });

  it("tokenizeRecallQueryV0 drops short tokens", () => {
    const t = tokenizeRecallQueryV0("Geçen pazartesi ne konuşmuştuk?");
    assert.ok(t.includes("pazartesi") || t.includes("gecen"));
    assert.ok(!t.includes("ne"));
  });

  it("recallCitationsV0 returns citations without answer_hint", () => {
    const r = recallCitationsV0({
      user_id: USER,
      query: "Geçen pazartesi continuity strip",
      store
    });
    assert.equal(r.ok, true);
    assert.ok(r.recall.citations.length >= 1);
    assert.equal(r.recall.answer_hint, undefined);
    const first = r.recall.citations[0];
    assert.match(first.turn_id, /^trn_/);
    assert.ok(String(first.excerpt).toLowerCase().includes("continuity") || String(first.excerpt).includes("strip"));
  });

  it("isLikelyRecallQueryV0 detects Turkish recall cues", () => {
    assert.equal(isLikelyRecallQueryV0("Geçen pazartesi konuştuğumuz şeyi hatırlıyor musun?"), true);
    assert.equal(isLikelyRecallQueryV0("merhaba"), false);
  });

  it("buildRecallExcerptV0 centers on token hit", () => {
    const ex = buildRecallExcerptV0("aaa bbb continuity strip ccc", ["continuity"], 40);
    assert.ok(ex.includes("continuity"));
  });
});
