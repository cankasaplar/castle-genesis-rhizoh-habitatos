/**
 * FER-1 Memory Vault v0 — seal Ghost, Knowledge, Chronicle, Opening Book (+ civilization) at rest.
 * Plain JSON cleared on seal; passphrase required to unseal.
 */

import { GHOST_MEMORY_LS_KEY_V0 } from "./ghostMemoryPersistenceV0.js";
import { RHIZOH_KNOWLEDGE_LS_KEY_V0 } from "./rhizohKnowledgeStoreV0.js";
import { CASTLE_CHRONICLE_LS_KEY_V0 } from "./castleChronicleV0.js";
import { RHIZOH_OPENING_BOOK_LS_KEY_V0 } from "./rhizohOpeningBookV0.js";
import { CHESS_CIVILIZATION_LS_KEY_V0 } from "./chessCivilizationV0.js";
import { MEDIA_CIVILIZATION_LS_KEY_V0 } from "./mediaCivilizationV0.js";
import { encryptFer1JsonV0, decryptFer1JsonV0 } from "./fer1VaultCryptoV0.js";

export const FER1_MEMORY_VAULT_SCHEMA_V0 = "rhizoh.fer1_memory_vault.v0";
export const FER1_MEMORY_VAULT_LS_KEY_V0 = "rhizoh_fer1_memory_vault_v0";
export const FER1_MEMORY_VAULT_EVENT_V0 = "rhizoh:fer1-memory-vault-v0";

/** @type {ReadonlyArray<{ id: string, lsKey: string, label: string }>} */
export const FER1_PROTECTED_BUCKETS_V0 = Object.freeze([
  { id: "ghostMemory", lsKey: GHOST_MEMORY_LS_KEY_V0, label: "Ghost Memory" },
  { id: "knowledge", lsKey: RHIZOH_KNOWLEDGE_LS_KEY_V0, label: "Knowledge Store" },
  { id: "chronicle", lsKey: CASTLE_CHRONICLE_LS_KEY_V0, label: "Chronicle" },
  { id: "openingBook", lsKey: RHIZOH_OPENING_BOOK_LS_KEY_V0, label: "Opening Book" },
  { id: "chessCivilization", lsKey: CHESS_CIVILIZATION_LS_KEY_V0, label: "Chess Civilization" },
  { id: "mediaCivilization", lsKey: MEDIA_CIVILIZATION_LS_KEY_V0, label: "Media Civilization" }
]);

function nowIso() {
  return new Date().toISOString();
}

function readEnvelopeV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FER1_MEMORY_VAULT_LS_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeEnvelopeV0(envelope) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FER1_MEMORY_VAULT_LS_KEY_V0, JSON.stringify(envelope));
  dispatchVaultEventV0();
}

function clearEnvelopeV0() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(FER1_MEMORY_VAULT_LS_KEY_V0);
  dispatchVaultEventV0();
}

function dispatchVaultEventV0() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent(FER1_MEMORY_VAULT_EVENT_V0, {
        detail: Object.freeze({ status: getFer1VaultStatusV0() })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @returns {object}
 */
export function collectFer1VaultPlaintextV0() {
  if (typeof window === "undefined") {
    return Object.freeze({ schema: `${FER1_MEMORY_VAULT_SCHEMA_V0}.payload`, buckets: {}, collectedAt: nowIso() });
  }
  /** @type {Record<string, string|null>} */
  const buckets = {};
  let populated = 0;
  for (const row of FER1_PROTECTED_BUCKETS_V0) {
    const raw = window.localStorage.getItem(row.lsKey);
    buckets[row.id] = raw;
    if (raw) populated += 1;
  }
  return Object.freeze({
    schema: `${FER1_MEMORY_VAULT_SCHEMA_V0}.payload`,
    buckets,
    populated,
    collectedAt: nowIso()
  });
}

function clearProtectedPlaintextV0() {
  if (typeof window === "undefined") return;
  for (const row of FER1_PROTECTED_BUCKETS_V0) {
    window.localStorage.removeItem(row.lsKey);
  }
}

function restoreProtectedPlaintextV0(buckets = {}) {
  if (typeof window === "undefined") return 0;
  let restored = 0;
  for (const row of FER1_PROTECTED_BUCKETS_V0) {
    const raw = buckets[row.id];
    if (!raw) continue;
    window.localStorage.setItem(row.lsKey, raw);
    restored += 1;
  }
  return restored;
}

/**
 * @returns {{ sealed: boolean, bucketCount: number, sealedAt: string | null, populatedBuckets: number }}
 */
export function getFer1VaultStatusV0() {
  const envelope = readEnvelopeV0();
  if (!envelope?.crypto?.ciphertextB64) {
    const plain = collectFer1VaultPlaintextV0();
    return Object.freeze({
      sealed: false,
      bucketCount: FER1_PROTECTED_BUCKETS_V0.length,
      sealedAt: null,
      populatedBuckets: plain.populated || 0
    });
  }
  return Object.freeze({
    sealed: true,
    bucketCount: Number(envelope.bucketCount) || FER1_PROTECTED_BUCKETS_V0.length,
    sealedAt: envelope.sealedAt || null,
    populatedBuckets: Number(envelope.populatedBuckets) || 0
  });
}

export function isFer1VaultSealedV0() {
  return getFer1VaultStatusV0().sealed === true;
}

/**
 * @param {string} passphrase
 */
export async function sealFer1MemoryVaultV0(passphrase) {
  const pass = String(passphrase || "").trim();
  if (!pass) return Object.freeze({ ok: false, reason: "passphrase_required" });
  const payload = collectFer1VaultPlaintextV0();
  if (!payload.populated) {
    return Object.freeze({ ok: false, reason: "nothing_to_seal" });
  }
  try {
    const encrypted = await encryptFer1JsonV0(payload, pass);
    const envelope = Object.freeze({
      schema: FER1_MEMORY_VAULT_SCHEMA_V0,
      sealedAt: nowIso(),
      bucketCount: FER1_PROTECTED_BUCKETS_V0.length,
      populatedBuckets: payload.populated,
      crypto: encrypted
    });
    writeEnvelopeV0(envelope);
    clearProtectedPlaintextV0();
    return Object.freeze({ ok: true, status: getFer1VaultStatusV0(), envelope });
  } catch (e) {
    return Object.freeze({ ok: false, reason: String(e?.message || e || "seal_failed") });
  }
}

/**
 * @param {string} passphrase
 */
export async function unsealFer1MemoryVaultV0(passphrase) {
  const pass = String(passphrase || "").trim();
  if (!pass) return Object.freeze({ ok: false, reason: "passphrase_required" });
  const envelope = readEnvelopeV0();
  if (!envelope?.crypto) return Object.freeze({ ok: false, reason: "not_sealed" });
  try {
    const payload = await decryptFer1JsonV0(envelope.crypto, pass);
    const restored = restoreProtectedPlaintextV0(payload.buckets || {});
    clearEnvelopeV0();
    return Object.freeze({
      ok: true,
      restored,
      status: getFer1VaultStatusV0()
    });
  } catch {
    return Object.freeze({ ok: false, reason: "wrong_passphrase" });
  }
}

/**
 * Encrypted envelope for cloud sync (no passphrase leaves device).
 */
export function exportFer1VaultForCloudV0() {
  const envelope = readEnvelopeV0();
  if (!envelope?.crypto) return null;
  return Object.freeze({
    schema: FER1_MEMORY_VAULT_SCHEMA_V0,
    sealedAt: envelope.sealedAt,
    bucketCount: envelope.bucketCount,
    populatedBuckets: envelope.populatedBuckets,
    crypto: Object.freeze({ ...envelope.crypto })
  });
}

/**
 * @param {object} remote
 */
export function importFer1VaultFromCloudV0(remote = {}) {
  if (!remote?.crypto?.ciphertextB64) return Object.freeze({ ok: false, reason: "invalid_remote" });
  const local = readEnvelopeV0();
  if (local?.sealedAt && remote.sealedAt && String(remote.sealedAt) <= String(local.sealedAt)) {
    return Object.freeze({ ok: true, skipped: true, status: getFer1VaultStatusV0() });
  }
  writeEnvelopeV0({
    schema: FER1_MEMORY_VAULT_SCHEMA_V0,
    sealedAt: remote.sealedAt || nowIso(),
    bucketCount: remote.bucketCount || FER1_PROTECTED_BUCKETS_V0.length,
    populatedBuckets: remote.populatedBuckets || 0,
    crypto: remote.crypto
  });
  if (isFer1VaultSealedV0()) clearProtectedPlaintextV0();
  return Object.freeze({ ok: true, status: getFer1VaultStatusV0() });
}

export function resetFer1MemoryVaultForTestV0() {
  if (typeof window === "undefined") return;
  clearEnvelopeV0();
  clearProtectedPlaintextV0();
}
