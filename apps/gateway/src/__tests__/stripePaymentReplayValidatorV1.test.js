import test from "node:test";
import assert from "node:assert/strict";
import {
  clearStripeReplayCacheForTests,
  rememberStripeEventOrSkip
} from "../stripePaymentReplayValidatorV1.js";

test("rememberStripeEventOrSkip: first seen processes, second is duplicate", () => {
  clearStripeReplayCacheForTests();
  const a = rememberStripeEventOrSkip("evt_1", Math.floor(Date.now() / 1000));
  const b = rememberStripeEventOrSkip("evt_1", Math.floor(Date.now() / 1000));
  assert.equal(a.duplicate, false);
  assert.equal(b.duplicate, true);
  clearStripeReplayCacheForTests();
});

test("rememberStripeEventOrSkip: max age rejects when configured", () => {
  clearStripeReplayCacheForTests();
  const prev = process.env.CASTLE_STRIPE_WEBHOOK_MAX_EVENT_AGE_SEC;
  process.env.CASTLE_STRIPE_WEBHOOK_MAX_EVENT_AGE_SEC = "3600";
  const old = Math.floor(Date.now() / 1000) - 10_000;
  const r = rememberStripeEventOrSkip("evt_old", old);
  assert.equal(r.skippedAge, true);
  if (prev === undefined) delete process.env.CASTLE_STRIPE_WEBHOOK_MAX_EVENT_AGE_SEC;
  else process.env.CASTLE_STRIPE_WEBHOOK_MAX_EVENT_AGE_SEC = prev;
  clearStripeReplayCacheForTests();
});
