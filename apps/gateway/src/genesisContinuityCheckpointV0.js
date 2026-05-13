import crypto from "node:crypto";
import { hashAndSignEpistemicSeal, verifyEpistemicSeal } from "./epistemicSeal.js";
import { getGenesisLedgerChainAnchorHexV0 } from "./genesisLedgerAnchorV0.js";
import { appendGenesisCheckpointLogLineV0 } from "./genesisContinuityPersistenceV0.js";

export const GENESIS_SIGNED_CHECKPOINT_SCHEMA = "castle.genesis.signed_continuity_checkpoint.v0";

/** Hash-chain head (audit chain — separate from SSE ring). */
let ledgerChainHead = getGenesisLedgerChainAnchorHexV0();

/** @type {Record<string, unknown> | null} */
let latestCheckpoint = null;

let checkpointInFlight = false;

/** @type {(() => Promise<Record<string, unknown>>) | null} */
let surfaceGetter = null;

export function installGenesisCheckpointSurfaceGetter(fn) {
  surfaceGetter = typeof fn === "function" ? fn : null;
}

export function checkpointIntervalSeq() {
  const n = Number(process.env.GENESIS_CHECKPOINT_INTERVAL_SEQ || 128);
  return Math.max(8, Math.floor(n) || 128);
}

function checkpointSecret() {
  return String(process.env.CASTLE_EPISTEMIC_SEAL_SECRET || process.env.CASTLE_GATEWAY_TOKEN || "").trim();
}

/**
 * @param {string} prevLedgerRoot hex
 * @param {number} seqCommittedThrough
 * @param {number} ledgerEntriesTotal
 * @param {string} replayFingerprintHex
 */
export function computeGenesisLedgerRootLinkV0(prevLedgerRoot, seqCommittedThrough, ledgerEntriesTotal, replayFingerprintHex) {
  const link = JSON.stringify({
    prevLedgerRoot: String(prevLedgerRoot || ""),
    seqCommittedThrough: Number(seqCommittedThrough) || 0,
    ledgerEntriesTotal: Number(ledgerEntriesTotal) || 0,
    replayFingerprintHex: String(replayFingerprintHex || "")
  });
  return crypto.createHash("sha256").update(link, "utf8").digest("hex");
}

/**
 * @param {Record<string, unknown>} signBody — fields to canonicalize (no hash/signature)
 * @param {string} secret
 */
export function signGenesisCheckpointBodyV0(signBody, secret) {
  const canonical = `${JSON.stringify(signBody)}\n`;
  return { ...hashAndSignEpistemicSeal(canonical, secret), canonical };
}

/**
 * @param {string} canonical
 * @param {string} secret
 * @param {string} checkpointHash
 * @param {string} signature
 */
export function verifyGenesisSignedCheckpointV0(canonical, secret, checkpointHash, signature) {
  return verifyEpistemicSeal(canonical, secret, checkpointHash, signature);
}

/**
 * @param {number} seq
 * @param {Record<string, unknown>} surface — live genesis runtime payload
 * @returns {Record<string, unknown> | null}
 */
function materializeCheckpoint(seq, surface) {
  const secret = checkpointSecret();
  if (!secret) return null;

  const fp =
    surface?.replayFingerprint && typeof surface.replayFingerprint === "object"
      ? /** @type {Record<string, unknown>} */ (surface.replayFingerprint)
      : {};
  const fpHex = String(fp.hex || "");
  const ledgerTotal = Number(surface?.epistemicLedger?.entriesPersistedTotal ?? 0);
  const replay =
    surface?.replay && typeof surface.replay === "object" ? /** @type {Record<string, unknown>} */ (surface.replay) : {};
  const infra = surface?.infra && typeof surface.infra === "object" ? /** @type {Record<string, unknown>} */ (surface.infra) : {};

  const prevLedgerRoot = ledgerChainHead;
  const ledgerRoot = computeGenesisLedgerRootLinkV0(prevLedgerRoot, seq, ledgerTotal, fpHex);

  const signBody = {
    schema: GENESIS_SIGNED_CHECKPOINT_SCHEMA,
    seqCommittedThrough: seq,
    intervalSeq: checkpointIntervalSeq(),
    serverTime: Date.now(),
    prevLedgerRoot,
    ledgerRoot,
    replayFingerprintHex: fpHex,
    replayFingerprintShort: String(fp.short || ""),
    ledgerEntriesTotal: ledgerTotal,
    replayAlignment: String(replay.alignment || ""),
    divergenceTotal: replay.divergenceTotal ?? null,
    infraStatus: String(infra.status || ""),
    gateway: surface?.gateway ?? null
  };

  const { hash: checkpointHash, signature, canonical } = signGenesisCheckpointBodyV0(signBody, secret);

  ledgerChainHead = ledgerRoot;

  return {
    ...signBody,
    checkpointHash,
    signature,
    algorithm: "SHA-256+HMAC-SHA256",
    keyHint: process.env.CASTLE_EPISTEMIC_SEAL_SECRET ? "CASTLE_EPISTEMIC_SEAL_SECRET" : "CASTLE_GATEWAY_TOKEN",
    canonical
  };
}

export function noteGenesisCheckpointSeqCommitted(seq) {
  const interval = checkpointIntervalSeq();
  if (seq <= 0 || seq % interval !== 0) return;
  if (checkpointInFlight || !surfaceGetter) return;
  checkpointInFlight = true;
  void (async () => {
    try {
      const surface = await surfaceGetter();
      if (!surface || typeof surface !== "object") return;
      const cp = materializeCheckpoint(seq, surface);
      if (cp) {
        latestCheckpoint = cp;
        await appendGenesisCheckpointLogLineV0(cp);
      }
    } catch {
      /* never throw into hub */
    } finally {
      checkpointInFlight = false;
    }
  })();
}

export function getLatestGenesisSignedCheckpoint() {
  return latestCheckpoint;
}

/** @public Tests only — mutates ledger chain head when successful. */
export function materializeGenesisCheckpointForTests(seq, surface) {
  return materializeCheckpoint(seq, surface);
}

/** Boot / hydrate: restore ledger head + latest signed checkpoint (memory cache). */
export function applyGenesisCheckpointHydrationV0(ledgerHeadHex, latestCpRecord) {
  ledgerChainHead = String(ledgerHeadHex || "").trim() || getGenesisLedgerChainAnchorHexV0();
  latestCheckpoint =
    latestCpRecord && typeof latestCpRecord === "object"
      ? /** @type {Record<string, unknown>} */ (latestCpRecord)
      : null;
}

export { getGenesisLedgerChainAnchorHexV0 } from "./genesisLedgerAnchorV0.js";

/** Test / tooling: reset chain + latest (same process). */
export function resetGenesisCheckpointStateForTests() {
  ledgerChainHead = getGenesisLedgerChainAnchorHexV0();
  latestCheckpoint = null;
  checkpointInFlight = false;
}
