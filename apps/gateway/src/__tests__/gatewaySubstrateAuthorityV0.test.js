import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  assertWalPeerSocketAuthorityV0,
  buildGatewaySubstrateAuthoritySnapshotV0,
  isProductionSubstrateAuthoritySatisfiedV0,
  resolveGatewayAuthorityPathV0,
  validateWalPeerFeedSignatureV0
} from "../gatewaySubstrateAuthorityV0.js";

const envBackup = { ...process.env };

describe("gatewaySubstrateAuthorityV0", () => {
  beforeEach(() => {
    process.env = { ...envBackup };
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    delete process.env.CASTLE_JWT_SECRET;
    delete process.env.CASTLE_GATEWAY_TOKEN;
    delete process.env.CASTLE_REQUIRE_AUTH;
    delete process.env.CASTLE_REQUIRE_WAL_PEER_AUTH;
    delete process.env.CASTLE_REJECT_UNSIGNED_WAL;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = envBackup;
  });

  it("resolves firebase as primary authority path", () => {
    process.env.FIREBASE_PROJECT_ID = "p";
    process.env.FIREBASE_CLIENT_EMAIL = "e";
    process.env.FIREBASE_PRIVATE_KEY = "k";
    assert.equal(resolveGatewayAuthorityPathV0(), "firebase");
    assert.equal(isProductionSubstrateAuthoritySatisfiedV0(), true);
  });

  it("rejects unsigned WAL feed when signature required", () => {
    process.env.NODE_ENV = "production";
    const r = validateWalPeerFeedSignatureV0({ signed: false, history: [] });
    assert.equal(r.ok, false);
    assert.equal(r.code, "wal_feed_unsigned");
  });

  it("requires authenticated socket for WAL peer when production default", () => {
    process.env.NODE_ENV = "production";
    const r = assertWalPeerSocketAuthorityV0({ auth: { ok: false } });
    assert.equal(r.ok, false);
  });

  it("buildGatewaySubstrateAuthoritySnapshot exposes posture", () => {
    process.env.CASTLE_GATEWAY_TOKEN = "x".repeat(20);
    const snap = buildGatewaySubstrateAuthoritySnapshotV0();
    assert.ok(snap.schema.includes("substrate_authority"));
    assert.equal(snap.gatewayTokenConfigured, true);
  });
});
