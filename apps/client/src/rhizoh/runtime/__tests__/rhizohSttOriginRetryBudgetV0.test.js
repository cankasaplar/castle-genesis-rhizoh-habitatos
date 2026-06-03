import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  __resetOriginRetryBudgetForTestV0,
  noteOriginRetryConsumedV0,
  peekOriginRetryBudgetV0,
  resetOriginRetryBudgetForSessionV0
} from "../rhizohSttOriginRetryBudgetV0.js";

describe("rhizohSttOriginRetryBudgetV0", () => {
  /** @type {Record<string, string | undefined>} */
  let envBackup;

  beforeEach(() => {
    envBackup = { ...import.meta.env };
    import.meta.env.VITE_RHIZOH_VOICE_ORIGIN_RETRY = "1";
    __resetOriginRetryBudgetForTestV0();
  });

  afterEach(() => {
    Object.assign(import.meta.env, envBackup);
  });

  it("blocks retry when origin retry flag off", () => {
    import.meta.env.VITE_RHIZOH_VOICE_ORIGIN_RETRY = "0";
    const v = peekOriginRetryBudgetV0({ sessionId: "s1", recordedMs: 2000 });
    expect(v.allowed).toBe(false);
    expect(v.reason).toBe("origin_retry_disabled");
  });

  it("allows one retry per session then exhausts budget", () => {
    const sid = "session-a";
    expect(peekOriginRetryBudgetV0({ sessionId: sid, recordedMs: 2000 }).allowed).toBe(true);
    noteOriginRetryConsumedV0(sid);
    const blocked = peekOriginRetryBudgetV0({ sessionId: sid, recordedMs: 2000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("origin_retry_budget_exhausted");
  });

  it("resets budget when session ends", () => {
    const sid = "session-reset";
    noteOriginRetryConsumedV0(sid);
    expect(peekOriginRetryBudgetV0({ sessionId: sid, recordedMs: 2000 }).allowed).toBe(false);
    resetOriginRetryBudgetForSessionV0(sid);
    expect(peekOriginRetryBudgetV0({ sessionId: sid, recordedMs: 2000 }).allowed).toBe(true);
  });

  it("rejects retry-of-retry, short clips, and direct reeval strategy", () => {
    expect(
      peekOriginRetryBudgetV0({ sessionId: "s2", recordedMs: 800 }).reason
    ).toBe("origin_retry_clip_too_short");

    expect(
      peekOriginRetryBudgetV0({
        sessionId: "s2",
        recordedMs: 2000,
        originReevalPass: true
      }).reason
    ).toBe("origin_retry_no_chain");

    expect(
      peekOriginRetryBudgetV0({
        sessionId: "s2",
        recordedMs: 2000,
        strategy: "origin_reeval_direct"
      }).reason
    ).toBe("origin_retry_already_reeval");
  });
});
