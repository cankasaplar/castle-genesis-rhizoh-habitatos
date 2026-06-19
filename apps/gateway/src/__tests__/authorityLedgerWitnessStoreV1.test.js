import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTHORITY_WAL_HASH_GENESIS_V1,
  foldAuthorityWalSegmentHashV1
} from "../authorityWalHashChainV1.js";
import {
  persistAuthorityLedgerWitnessBatchV1,
  resetAuthorityLedgerWitnessStoreForTestV1,
  replayAuthorityLedgerWitnessChainV1
} from "../authorityLedgerWitnessStoreV1.js";

const SECRET = "test_witness_secret_16b";

function buildSealedEntryV1(height, prevHash, verdict = "hold") {
  const admissionRequest = {
    verdict,
    inferenceEligible: false,
    holdReason: "cold_boot"
  };
  const authorityDecision = {
    decision: "hold_no_downstream",
    realityMutationPermitted: false
  };
  const realityMutation = {
    permitted: false,
    reason: "phase_gate"
  };
  const body = {
    height,
    admissionRequest,
    humanAttestation: null,
    authorityDecision,
    realityMutation
  };
  const sealHash = foldAuthorityWalSegmentHashV1(prevHash, body);
  return {
    schema: "castle.rhizoh.authority_ledger.v1.entry",
    entryId: `auth_ledger_${height}`,
    height,
    admissionRequest,
    humanAttestation: null,
    authorityDecision,
    realityMutation,
    seal: { prevSealHash: prevHash, sealHash, sealedAtMs: Date.now() }
  };
}

test("witnesses hold entry and advances chain height", () => {
  resetAuthorityLedgerWitnessStoreForTestV1();
  const entry = buildSealedEntryV1(1, AUTHORITY_WAL_HASH_GENESIS_V1, "hold");
  const r = persistAuthorityLedgerWitnessBatchV1("subj-a", [entry], SECRET);
  assert.equal(r.witnessed, 1);
  assert.equal(r.quarantined, 0);
  assert.equal(r.chainHeight, 1);
  assert.ok(r.lastWitness?.gatewayWitnessHash);
  assert.equal(r.results[0]?.status, "witnessed");
  assert.equal(r.results[0]?.holdRecorded, true);
});

test("witnesses chained entries in order", () => {
  resetAuthorityLedgerWitnessStoreForTestV1();
  const e1 = buildSealedEntryV1(1, AUTHORITY_WAL_HASH_GENESIS_V1);
  const r1 = persistAuthorityLedgerWitnessBatchV1("subj-b", [e1], SECRET);
  const e2 = buildSealedEntryV1(2, r1.chainHead);
  const r2 = persistAuthorityLedgerWitnessBatchV1("subj-b", [e2], SECRET);
  assert.equal(r2.chainHeight, 2);
  assert.equal(r2.witnessed, 1);
});

test("quarantines height regression without silent repair", () => {
  resetAuthorityLedgerWitnessStoreForTestV1();
  const e1 = buildSealedEntryV1(1, AUTHORITY_WAL_HASH_GENESIS_V1);
  persistAuthorityLedgerWitnessBatchV1("subj-c", [e1], SECRET);
  const bad = buildSealedEntryV1(1, AUTHORITY_WAL_HASH_GENESIS_V1);
  const r = persistAuthorityLedgerWitnessBatchV1("subj-c", [bad], SECRET);
  assert.equal(r.witnessed, 0);
  assert.equal(r.quarantined, 1);
  assert.equal(r.results[0]?.status, "quarantined");
  assert.equal(r.results[0]?.code, "height_regression");
});

test("quarantines seal hash mismatch", () => {
  resetAuthorityLedgerWitnessStoreForTestV1();
  const entry = buildSealedEntryV1(1, AUTHORITY_WAL_HASH_GENESIS_V1);
  entry.seal.sealHash = "hdeadbeef";
  const r = persistAuthorityLedgerWitnessBatchV1("subj-d", [entry], SECRET);
  assert.equal(r.witnessed, 0);
  assert.equal(r.quarantined, 1);
  assert.equal(r.results[0]?.code, "seal_hash_mismatch");
});

test("replay verifies witnessed seal chain", () => {
  resetAuthorityLedgerWitnessStoreForTestV1();
  const e1 = buildSealedEntryV1(1, AUTHORITY_WAL_HASH_GENESIS_V1);
  const r1 = persistAuthorityLedgerWitnessBatchV1("subj-replay", [e1], SECRET);
  const e2 = buildSealedEntryV1(2, r1.chainHead);
  persistAuthorityLedgerWitnessBatchV1("subj-replay", [e2], SECRET);
  const replay = replayAuthorityLedgerWitnessChainV1("subj-replay");
  assert.equal(replay.ok, true);
  assert.equal(replay.height, 2);
  assert.equal(replay.entriesReplayed, 2);
  assert.equal(replay.sealHead, e2.seal.sealHash);
});
