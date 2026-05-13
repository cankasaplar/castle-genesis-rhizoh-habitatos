import test from "node:test";
import assert from "node:assert/strict";
import {
  publishGenesisContinuityEvent,
  registerGenesisSseClient,
  genesisContinuityStreamSubscriberCount,
  getGenesisContinuitySeq
} from "../genesisContinuityStreamHubV0.js";

function mockRes() {
  const chunks = [];
  const listeners = {};
  const res = {
    writableEnded: false,
    write(chunk) {
      chunks.push(String(chunk));
    },
    on(ev, fn) {
      (listeners[ev] ||= []).push(fn);
    },
    removeListener() {},
    emit(ev) {
      for (const f of listeners[ev] || []) f();
    },
    chunks,
    listeners
  };
  return res;
}

test("publishGenesisContinuityEvent assigns monotonic seq and SSE id line", () => {
  const res = mockRes();
  const startSeq = getGenesisContinuitySeq();
  registerGenesisSseClient(res, { headers: {} });
  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "tick:1", payload: { value: 1 } });
  const joined = res.chunks.join("");
  assert.match(joined, /id: /);
  assert.match(joined, /"seq":/);
  assert.match(joined, /TickAdvanced/);
  assert.match(joined, /tick:1/);
  assert.equal(getGenesisContinuitySeq(), startSeq + 1);
  res.emit("close");
  assert.equal(genesisContinuityStreamSubscriberCount(), 0);
});

test("publish without SSE clients still advances seq and retains ring for Last-Event-ID", () => {
  const before = getGenesisContinuitySeq();
  publishGenesisContinuityEvent({ type: "SealIssued", id: "seal:abc", payload: { sealHash: "abc" } });
  assert.equal(getGenesisContinuitySeq(), before + 1);
  const res = mockRes();
  registerGenesisSseClient(res, { headers: { "last-event-id": String(before) } });
  const joined = res.chunks.join("");
  assert.match(joined, /SealIssued/);
  res.emit("close");
});
