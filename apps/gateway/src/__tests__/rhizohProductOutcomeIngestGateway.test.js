import test from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  ingestRhizohProductOutcomeHttp,
  resolveOutcomeTrustWeight,
  resolveRhizohOutcomeCohortProfile,
  hashRhizohCohortProfile,
  verifyRhizohOutcomeHmac,
  verifyRhizohOutcomeSourceToken
} from "../rhizohProductOutcomeIngestGateway.js";

const baseBody = () => ({
  schemaVersion: "1.0.0",
  subjectKey: "u1",
  sessionId: "s1",
  decisionFingerprint: `fp-test-${Math.random().toString(36).slice(2, 8)}`,
  outcome: "success",
  ts: Date.now(),
  source: "crm"
});

test("resolveOutcomeTrustWeight caps by source ceiling", () => {
  const a = resolveOutcomeTrustWeight("crm", 0.99);
  assert.strictEqual(a.applied, 0.95);
  assert.strictEqual(a.trustCapped, true);

  const b = resolveOutcomeTrustWeight("anonymous", 0.5);
  assert.strictEqual(b.applied, 0.1);
  assert.strictEqual(b.trustCapped, true);

  const c = resolveOutcomeTrustWeight("manual_report", null);
  assert.strictEqual(c.applied, 0.4);
  assert.strictEqual(c.trustCapped, false);
});

test("weighted aggregate uses trustWeight", () => {
  const b1 = { ...baseBody(), outcome: "fail", score01: 0, trustWeight: 0.95, ts: 1000, cohortSampleN: 120 };
  let r = ingestRhizohProductOutcomeHttp(b1, {});
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.aggregate.sampleN, 1);
  assert.strictEqual(r.aggregate.outcomeRate, 0);

  const b2 = {
    ...b1,
    outcome: "success",
    score01: 1,
    trustWeight: 0.95,
    ts: 2000
  };
  r = ingestRhizohProductOutcomeHttp(b2, {});
  assert.strictEqual(r.aggregate.sampleN, 2);
  assert.ok(Math.abs(r.aggregate.outcomeRate - 0.5) < 0.01);
  assert.ok(r.aggregate.cohortHash);
  assert.strictEqual(typeof r.aggregate.cohortProfile?.confidence01, "number");
});

test("cohort profile resolver is deterministic and hash stable", () => {
  const event = {
    source: "support",
    sessionAgeMs: 20 * 86_400_000,
    avgTurnDepth: 7,
    return7d: 1,
    powerMode: 1,
    enterpriseSignal01: 0.1,
    correctionRatio01: 0.2,
    satisfactionProxy01: 0.9,
    cohortSampleN: 58
  };
  const a = resolveRhizohOutcomeCohortProfile(event);
  const b = resolveRhizohOutcomeCohortProfile(event);
  assert.strictEqual(a.cohortId, b.cohortId);
  assert.strictEqual(a.confidence01, b.confidence01);
  assert.deepStrictEqual(a.axes, b.axes);
  assert.strictEqual(hashRhizohCohortProfile(a), hashRhizohCohortProfile(b));
  assert.ok(Array.isArray(a.labels) && a.labels.length > 0);
});

test("verifyRhizohOutcomeHmac when secret unset skips", () => {
  const prev = process.env.RHIZOH_PRODUCT_OUTCOME_HMAC_SECRET;
  delete process.env.RHIZOH_PRODUCT_OUTCOME_HMAC_SECRET;
  const v = verifyRhizohOutcomeHmac('{"a":1}', "");
  assert.strictEqual(v.ok, true);
  assert.strictEqual(v.skipped, true);
  if (prev !== undefined) process.env.RHIZOH_PRODUCT_OUTCOME_HMAC_SECRET = prev;
});

test("verifyRhizohOutcomeHmac validates hex", () => {
  const secret = "test-secret-outcome";
  process.env.RHIZOH_PRODUCT_OUTCOME_HMAC_SECRET = secret;
  const raw = '{"x":1}';
  const hex = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  assert.strictEqual(verifyRhizohOutcomeHmac(raw, hex).ok, true);
  assert.strictEqual(verifyRhizohOutcomeHmac(raw, "v1=" + hex).ok, true);
  assert.strictEqual(verifyRhizohOutcomeHmac(raw, "00".repeat(32)).ok, false);
  delete process.env.RHIZOH_PRODUCT_OUTCOME_HMAC_SECRET;
});

test("verifyRhizohOutcomeSourceToken requires token when map has source", () => {
  process.env.RHIZOH_PRODUCT_OUTCOME_SOURCE_TOKENS_JSON = JSON.stringify({ crm: "tok-crm" });
  assert.strictEqual(verifyRhizohOutcomeSourceToken("crm", "").ok, false);
  assert.strictEqual(verifyRhizohOutcomeSourceToken("crm", "tok-crm").ok, true);
  assert.strictEqual(verifyRhizohOutcomeSourceToken("anonymous", "").ok, true);
  delete process.env.RHIZOH_PRODUCT_OUTCOME_SOURCE_TOKENS_JSON;
});
