import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRealityHealthPayload,
  computeGatewayTruthFingerprint,
  hashRealityContractLock,
  verifyRealityContractLockParity
} from "../edgeRealityConsistencyV1.js";

test("hashRealityContractLock is stable sha256 hex", () => {
  const a = hashRealityContractLock();
  const b = hashRealityContractLock();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, b);
});

test("computeGatewayTruthFingerprint includes lock and fingerprint", () => {
  const f = computeGatewayTruthFingerprint();
  assert.match(f.fingerprintSha256, /^[0-9a-f]{64}$/);
  assert.match(f.lockSha256, /^[0-9a-f]{64}$/);
  assert.equal(f.lockSha256, hashRealityContractLock());
});

test("verifyRealityContractLockParity skips when env unset", () => {
  const prev = process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256;
  delete process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256;
  const p = verifyRealityContractLockParity();
  assert.equal(p.skipped, true);
  assert.equal(p.ok, true);
  if (prev !== undefined) process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256 = prev;
});

test("verifyRealityContractLockParity fails on wrong hash", () => {
  const prev = process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256;
  process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256 = "0".repeat(64);
  const p = verifyRealityContractLockParity();
  assert.equal(p.skipped, false);
  assert.equal(p.ok, false);
  if (prev === undefined) delete process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256;
  else process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256 = prev;
});

test("buildRealityHealthPayload shape", () => {
  const prev = process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256;
  delete process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256;
  const h = buildRealityHealthPayload();
  assert.ok("drift" in h);
  assert.ok("parity" in h);
  assert.ok("fingerprint" in h);
  assert.ok(typeof h.ok === "boolean");
  if (prev !== undefined) process.env.CASTLE_REALITY_CONTRACT_LOCK_SHA256 = prev;
});
