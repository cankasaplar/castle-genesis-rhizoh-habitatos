import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createLifeContinuityStoreV0, resetLifeContinuityStoreV0 } from "../rhizoh/lifeContinuityStoreV0.js";
import {
  appendLifeContinuityAfterGatewayTurnV0,
  resolveLifeThreadIdFromPayloadV0,
  isLifeContinuityAppendEnabledV0
} from "../rhizoh/lifeContinuityGatewayHookV0.js";

const USER = "user_hook_alpha_01";

describe("lifeContinuityGatewayHookV0", () => {
  /** @type {string | undefined} */
  let prevAppend;
  /** @type {ReturnType<typeof createLifeContinuityStoreV0>} */
  let store;

  beforeEach(() => {
    prevAppend = process.env.CASTLE_LIFE_CONTINUITY_APPEND;
    resetLifeContinuityStoreV0();
    store = createLifeContinuityStoreV0();
  });

  afterEach(() => {
    if (prevAppend === undefined) delete process.env.CASTLE_LIFE_CONTINUITY_APPEND;
    else process.env.CASTLE_LIFE_CONTINUITY_APPEND = prevAppend;
    resetLifeContinuityStoreV0();
  });

  it("append disabled by default env", () => {
    delete process.env.CASTLE_LIFE_CONTINUITY_APPEND;
    assert.equal(isLifeContinuityAppendEnabledV0(), false);
  });

  it("appendTurn pair when env enabled", () => {
    process.env.CASTLE_LIFE_CONTINUITY_APPEND = "1";
    const result = { reply: "Yanıt metni." };
    const r = appendLifeContinuityAfterGatewayTurnV0({
      auth: { ok: true, uid: USER },
      safePayload: { message: "Soru?" },
      result,
      traceId: "trace_hook_001",
      store
    });
    assert.equal(r.ok, true);
    assert.equal(r.turns_appended, 2);
    assert.ok(r.thread_id);
    assert.equal(result.lifeContinuity.thread_id, r.thread_id);
    const recent = store.getRecentTurns(r.thread_id, { user_id: USER });
    assert.equal(recent.turns.length, 2);
  });

  it("resolveLifeThreadIdFromPayloadV0 reads context.life_continuity", () => {
    const id = resolveLifeThreadIdFromPayloadV0(
      { context: { life_continuity: { thread_id: "thr_existing" } } },
      store
    );
    assert.equal(id, "thr_existing");
  });
});
