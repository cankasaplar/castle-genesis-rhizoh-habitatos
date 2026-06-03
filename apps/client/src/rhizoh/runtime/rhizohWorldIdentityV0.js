/**
 * World identity v0 — versioned continuity from episodic WAL chain (B2+).
 * Answers: "was this the same world?" — identity stabilization, not replay UI alone.
 * @see docs/RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md
 */

import { WAL_HASH_CHAIN_GENESIS_V0, foldWalSegmentHashV0 } from "./continuity/walHashChainV0.js";

export const WORLD_IDENTITY_SCHEMA_V0 = "castle.rhizoh.world_identity.v0";

export const RHIZOH_WORLD_IDENTITY_EVENT_V0 = "rhizoh:world-identity-v0";

/**
 * @param {ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>} entry
 * @param {string} prevChainHead
 */
export function foldWorldWalEntryHashV0(entry, prevChainHead = WAL_HASH_CHAIN_GENESIS_V0) {
  const payload = Object.freeze({
    entry_id: entry.entry_id,
    episode_seq: entry.episode_seq,
    atMs: entry.atMs,
    coherenceId: entry.t0_frame?.coherenceId || null,
    stream_coherence_id: entry.stream_coherence_id || null,
    experiential_now_id: entry.experiential_now_id || null,
    artifact_id: entry.artifact_ref?.artifact_id || null
  });
  return foldWalSegmentHashV0(prevChainHead, payload);
}

/**
 * @param {{
 *   entry: ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>,
 *   prevIdentity?: ReturnType<typeof buildWorldIdentityFromWalEntryV0> | null
 * }} ctx
 */
export function buildWorldIdentityFromWalEntryV0(ctx) {
  const entry = ctx.entry;
  const prev = ctx.prevIdentity;
  const prevHead = prev?.chain_head_hash || WAL_HASH_CHAIN_GENESIS_V0;
  const chain_head_hash = foldWorldWalEntryHashV0(entry, prevHead);
  const version = (prev?.identity_version || 0) + 1;

  return Object.freeze({
    schema: WORLD_IDENTITY_SCHEMA_V0,
    world_identity_id: `world_id_${chain_head_hash.replace(/^h/, "").slice(0, 12)}`,
    identity_version: version,
    chain_head_hash,
    last_entry_id: entry.entry_id,
    last_episode_seq: entry.episode_seq,
    last_coherence_id: entry.stream_coherence_id || entry.t0_frame?.coherenceId || null,
    experiential_now_id: entry.experiential_now_id || null,
    atMs: entry.atMs
  });
}

/**
 * @param {ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0> & { identity_link?: object }} entry
 * @param {ReturnType<typeof buildWorldIdentityFromWalEntryV0> | null} [storedIdentity]
 */
export function verifyWorldIdentityForReplayV0(entry, storedIdentity) {
  if (!entry) {
    return Object.freeze({ ok: false, code: "entry_missing", same_world: false, drift: true });
  }
  if (!storedIdentity?.chain_head_hash) {
    return Object.freeze({
      ok: true,
      code: "identity_bootstrap",
      same_world: true,
      drift: false,
      historical: false
    });
  }

  const link = entry.identity_link;
  if (link?.chain_head_hash === storedIdentity.chain_head_hash) {
    return Object.freeze({
      ok: true,
      code: "identity_match",
      same_world: true,
      drift: false,
      historical: entry.entry_id !== storedIdentity.last_entry_id
    });
  }

  if (Number(entry.episode_seq) < Number(storedIdentity.last_episode_seq)) {
    return Object.freeze({
      ok: true,
      code: "historical_episode",
      same_world: true,
      drift: false,
      historical: true
    });
  }

  if (
    entry.entry_id === storedIdentity.last_entry_id &&
    entry.episode_seq === storedIdentity.last_episode_seq
  ) {
    return Object.freeze({
      ok: true,
      code: "identity_match",
      same_world: true,
      drift: false,
      historical: false
    });
  }

  return Object.freeze({
    ok: false,
    code: "identity_drift",
    same_world: false,
    drift: true,
    stored_entry_id: storedIdentity.last_entry_id,
    replay_entry_id: entry.entry_id
  });
}

/**
 * @param {ReturnType<typeof buildWorldIdentityFromWalEntryV0>} identity
 */
export function publishWorldIdentityV0(identity) {
  if (typeof window === "undefined" || !identity) return identity;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldIdentity = identity;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_WORLD_IDENTITY_EVENT_V0, {
        detail: Object.freeze({ identity })
      })
    );
  } catch {
    /* noop */
  }
  return identity;
}

export function readWorldIdentityV0() {
  return typeof window !== "undefined" ? window.__rhizoh?.worldIdentity || null : null;
}
