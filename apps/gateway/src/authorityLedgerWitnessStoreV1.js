import {
  AUTHORITY_WAL_HASH_GENESIS_V1,
  verifyAuthorityLedgerEntrySealV1
} from "./authorityWalHashChainV1.js";
import {
  canonicalAuthorityLedgerWitnessStringV1,
  hashAndSignAuthorityLedgerWitnessV1,
  AUTHORITY_LEDGER_WITNESS_SCHEMA_V1
} from "./authorityLedgerWitnessV1.js";

/** @type {Map<string, { epochId: string, chainHead: string, height: number, entries: object[] }>} */
const epochChainsV1 = new Map();
/** @type {Map<string, string>} */
const subjectLatestEpochV1 = new Map();

const WITNESS_RING_MAX_V1 = 256;
let totalWitnessedEntriesV1 = 0;
/** @type {{ clientSealHash: string, gatewayWitnessHash: string, height: number, epochId: string, witnessedAt: number } | null} */
let lastWitnessV1 = null;

/**
 * @param {object} entry
 */
function readEntryEpochIdV1(entry) {
  return String(entry?.epoch?.epochId || entry?.epochId || "epoch_unknown").trim() || "epoch_unknown";
}

/**
 * @param {string} subjectId
 * @param {string} epochId
 */
function epochChainKeyV1(subjectId, epochId) {
  return `${String(subjectId || "unknown")}::${String(epochId || "epoch_unknown")}`;
}

/**
 * @param {string} subjectId
 * @param {string} epochId
 */
function getOrCreateEpochChainV1(subjectId, epochId) {
  const key = epochChainKeyV1(subjectId, epochId);
  let chain = epochChainsV1.get(key);
  if (!chain) {
    chain = {
      epochId: String(epochId),
      chainHead: AUTHORITY_WAL_HASH_GENESIS_V1,
      height: 0,
      entries: []
    };
    epochChainsV1.set(key, chain);
  }
  return chain;
}

/**
 * @param {string} subjectId
 * @param {string} [epochId]
 */
function resolveEpochChainForSubjectV1(subjectId, epochId) {
  const sid = String(subjectId || "unknown");
  const eid = epochId || subjectLatestEpochV1.get(sid) || null;
  if (!eid) return null;
  return epochChainsV1.get(epochChainKeyV1(sid, eid)) || null;
}

/**
 * Append-only witness — hold verdicts included; per-epoch chains (no cross-epoch height regression).
 * @param {string} subjectId
 * @param {object[]} entries sealed client authority ledger entries
 * @param {string} witnessSecret
 */
export function persistAuthorityLedgerWitnessBatchV1(subjectId, entries, witnessSecret) {
  const rows = Array.isArray(entries) ? entries : [];
  if (!rows.length) {
    return { ok: true, witnessed: 0, quarantined: 0, mode: "skip", results: [] };
  }

  const results = [];
  let witnessed = 0;
  let quarantined = 0;
  let lastChainHead = AUTHORITY_WAL_HASH_GENESIS_V1;
  let lastChainHeight = 0;
  let lastEpochId = null;

  const sorted = [...rows].sort((a, b) => Number(a?.height || 0) - Number(b?.height || 0));

  for (const entry of sorted) {
    const epochId = readEntryEpochIdV1(entry);
    const chain = getOrCreateEpochChainV1(subjectId, epochId);
    const expectedHeight = chain.height + 1;
    const entryHeight = Number(entry?.height);
    if (entryHeight !== expectedHeight) {
      quarantined += 1;
      results.push(
        Object.freeze({
          status: "quarantined",
          code: "height_regression",
          epochId,
          height: entryHeight,
          expectedHeight,
          interpretationOnly: true
        })
      );
      continue;
    }

    const sealCheck = verifyAuthorityLedgerEntrySealV1(entry, chain.chainHead);
    if (!sealCheck.ok) {
      quarantined += 1;
      results.push(
        Object.freeze({
          status: "quarantined",
          code: sealCheck.code || "seal_invalid",
          reason: sealCheck.reason || "witness_rejected",
          epochId,
          height: entryHeight,
          interpretationOnly: true
        })
      );
      continue;
    }

    const witnessedAt = Date.now();
    const witnessBody = {
      subjectId: String(subjectId || "unknown"),
      epochId,
      height: entryHeight,
      entryId: String(entry.entryId || `auth_ledger_${entryHeight}`),
      clientSealHash: sealCheck.sealHash,
      prevClientSealHash: sealCheck.prevSealHash,
      witnessedAt
    };
    const canonical = canonicalAuthorityLedgerWitnessStringV1(witnessBody);
    const { hash: gatewayWitnessHash, signature: gatewayWitnessSignature } =
      hashAndSignAuthorityLedgerWitnessV1(canonical, witnessSecret);

    chain.height = entryHeight;
    chain.chainHead = sealCheck.sealHash;
    subjectLatestEpochV1.set(String(subjectId || "unknown"), epochId);
    totalWitnessedEntriesV1 += 1;
    witnessed += 1;
    lastChainHead = chain.chainHead;
    lastChainHeight = chain.height;
    lastEpochId = epochId;

    const witnessedEntry = Object.freeze({
      schema: `${AUTHORITY_LEDGER_WITNESS_SCHEMA_V1}.record`,
      status: "witnessed",
      epochId,
      height: entryHeight,
      entryId: witnessBody.entryId,
      clientSealHash: sealCheck.sealHash,
      prevClientSealHash: sealCheck.prevSealHash,
      gatewayWitness: Object.freeze({
        hash: gatewayWitnessHash,
        signature: gatewayWitnessSignature,
        witnessedAt,
        algorithm: "SHA-256+HMAC-SHA256"
      }),
      verdict: entry?.admissionRequest?.verdict || null,
      holdRecorded: true,
      interpretationOnly: true,
      nonExecutive: true
    });

    chain.entries.unshift(witnessedEntry);
    if (chain.entries.length > WITNESS_RING_MAX_V1) {
      chain.entries.length = WITNESS_RING_MAX_V1;
    }

    lastWitnessV1 = {
      clientSealHash: sealCheck.sealHash,
      gatewayWitnessHash,
      height: entryHeight,
      epochId,
      witnessedAt
    };

    results.push(witnessedEntry);
  }

  return Object.freeze({
    ok: quarantined === 0 || witnessed > 0,
    witnessed,
    quarantined,
    mode: "witness_append_only",
    epochId: lastEpochId,
    chainHead: lastChainHead,
    chainHeight: lastChainHeight,
    totalWitnessedEntries: totalWitnessedEntriesV1,
    lastWitness: lastWitnessV1,
    results
  });
}

/**
 * @param {string} subjectId
 * @param {string} [epochId]
 */
export function getAuthorityLedgerWitnessSnapshotV1(subjectId, epochId) {
  const sid = subjectId ? String(subjectId) : null;
  const activeEpochId = epochId || (sid ? subjectLatestEpochV1.get(sid) : null) || null;
  const chain = sid ? resolveEpochChainForSubjectV1(sid, activeEpochId || undefined) : null;
  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_WITNESS_SCHEMA_V1}.snapshot`,
    totalWitnessedEntries: totalWitnessedEntriesV1,
    lastWitness: lastWitnessV1,
    activeEpochId,
    subjectHeight: chain?.height ?? 0,
    subjectChainHead: chain?.chainHead ?? AUTHORITY_WAL_HASH_GENESIS_V1,
    recentWitnessed: Object.freeze((chain?.entries || []).slice(0, 8)),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getAuthorityLedgerWitnessTotalV1() {
  return totalWitnessedEntriesV1;
}

/**
 * @param {string} subjectId
 * @param {string} [epochId]
 */
export function replayAuthorityLedgerWitnessChainV1(subjectId, epochId) {
  const chain = resolveEpochChainForSubjectV1(subjectId, epochId);

  if (!chain || chain.height === 0) {
    return Object.freeze({
      schema: `${AUTHORITY_LEDGER_WITNESS_SCHEMA_V1}.replay`,
      ok: true,
      epochId: epochId || chain?.epochId || null,
      height: 0,
      sealHead: AUTHORITY_WAL_HASH_GENESIS_V1,
      entriesReplayed: 0,
      workerReplayAvailable: false,
      gatewayReplayAvailable: true,
      trace: Object.freeze([]),
      interpretationOnly: true,
      nonExecutive: true
    });
  }

  const chronological = [...chain.entries].reverse();
  let head = AUTHORITY_WAL_HASH_GENESIS_V1;
  /** @type {object[]} */
  const trace = [];

  for (const row of chronological) {
    const height = Number(row?.height);
    const prev = String(row?.prevClientSealHash || "");
    const seal = String(row?.clientSealHash || "");
    const ok = prev === head && Boolean(seal);
    trace.push(
      Object.freeze({
        height,
        epochId: row.epochId || chain.epochId,
        ok,
        expectedPrev: head,
        actualPrev: prev,
        clientSealHash: seal || null
      })
    );
    if (!ok) {
      return Object.freeze({
        schema: `${AUTHORITY_LEDGER_WITNESS_SCHEMA_V1}.replay`,
        ok: false,
        reason: "witness_chain_break",
        epochId: chain.epochId,
        height,
        sealHead: head,
        entriesReplayed: trace.length,
        workerReplayAvailable: false,
        gatewayReplayAvailable: true,
        trace: Object.freeze(trace),
        interpretationOnly: true,
        nonExecutive: true
      });
    }
    head = seal;
  }

  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_WITNESS_SCHEMA_V1}.replay`,
    ok: true,
    epochId: chain.epochId,
    height: chain.height,
    sealHead: head,
    entriesReplayed: chronological.length,
    workerReplayAvailable: false,
    gatewayReplayAvailable: true,
    trace: Object.freeze(trace),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** @internal node:test */
export function resetAuthorityLedgerWitnessStoreForTestV1() {
  epochChainsV1.clear();
  subjectLatestEpochV1.clear();
  totalWitnessedEntriesV1 = 0;
  lastWitnessV1 = null;
}
