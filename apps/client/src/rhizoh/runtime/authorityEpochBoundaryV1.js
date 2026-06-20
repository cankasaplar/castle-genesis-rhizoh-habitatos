/**
 * Authority Epoch Boundary v1 — client boot timeline primitive.
 * Each tab boot mints a fresh epoch; gateway witness archives per epoch.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_AUTHORITY_EPOCH_BOUNDARY_V1.md
 */

import { getOrCreateCastleDevUid } from "../useRhizohGatewayMonitor.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";

export const AUTHORITY_EPOCH_SCHEMA_V1 = "castle.rhizoh.authority_epoch.v1";

/** @type {string | null} */
let currentAuthorityEpochIdV1 = null;
let authorityEpochBootAtMsV1 = 0;

/**
 * Mint epoch once per client boot (stateless reality generator boundary).
 * @param {{ bootAtMs?: number, clientSeed?: string }} [opts]
 */
export function mintAuthorityEpochIdV1(opts = {}) {
  const bootAtMs = Number(opts.bootAtMs) || Date.now();
  const clientSeed = String(opts.clientSeed || getOrCreateCastleDevUid() || "client");
  const epochId = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    schema: AUTHORITY_EPOCH_SCHEMA_V1,
    bootAtMs,
    clientSeed
  });
  currentAuthorityEpochIdV1 = epochId;
  authorityEpochBootAtMsV1 = bootAtMs;
  return Object.freeze({
    schema: AUTHORITY_EPOCH_SCHEMA_V1,
    epochId,
    bootAtMs,
    clientSeed,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getAuthorityEpochIdV1() {
  if (!currentAuthorityEpochIdV1) {
    mintAuthorityEpochIdV1();
  }
  return currentAuthorityEpochIdV1;
}

export function getAuthorityEpochBootAtMsV1() {
  if (!currentAuthorityEpochIdV1) {
    mintAuthorityEpochIdV1();
  }
  return authorityEpochBootAtMsV1;
}

export function getAuthorityEpochSnapshotV1() {
  const epochId = getAuthorityEpochIdV1();
  return Object.freeze({
    schema: `${AUTHORITY_EPOCH_SCHEMA_V1}.snapshot`,
    epochId,
    bootAtMs: authorityEpochBootAtMsV1,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetAuthorityEpochForTestV1() {
  currentAuthorityEpochIdV1 = null;
  authorityEpochBootAtMsV1 = 0;
}

/**
 * @param {object | null | undefined} entry
 */
export function readEpochIdFromAuthorityEntryV1(entry) {
  return String(entry?.epoch?.epochId || entry?.epochId || "").trim() || null;
}
