import {
  AUTHORITY_WAL_HASH_GENESIS_V1,
  verifyAuthorityLedgerEntrySealV1
} from "./authorityWalHashChainV1.js";
import {
  canonicalAuthorityLedgerWitnessStringV1,
  hashAndSignAuthorityLedgerWitnessV1,
  AUTHORITY_LEDGER_WITNESS_SCHEMA_V1
} from "./authorityLedgerWitnessV1.js";

/** @type {Map<string, { chainHead: string, height: number, entries: object[] }>} */
const subjectChainsV1 = new Map();

const WITNESS_RING_MAX_V1 = 256;
let totalWitnessedEntriesV1 = 0;
/** @type {{ clientSealHash: string, gatewayWitnessHash: string, height: number, witnessedAt: number } | null} */
let lastWitnessV1 = null;

/**
 * @param {string} subjectId
 */
function getOrCreateSubjectChainV1(subjectId) {
  const key = String(subjectId || "unknown");
  let chain = subjectChainsV1.get(key);
  if (!chain) {
    chain = { chainHead: AUTHORITY_WAL_HASH_GENESIS_V1, height: 0, entries: [] };
    subjectChainsV1.set(key, chain);
  }
  return chain;
}

/**
 * Append-only witness — hold verdicts included; no silent repair on mismatch.
 * @param {string} subjectId
 * @param {object[]} entries sealed client authority ledger entries
 * @param {string} witnessSecret
 */
export function persistAuthorityLedgerWitnessBatchV1(subjectId, entries, witnessSecret) {
  const rows = Array.isArray(entries) ? entries : [];
  if (!rows.length) {
    return { ok: true, witnessed: 0, quarantined: 0, mode: "skip", results: [] };
  }

  const chain = getOrCreateSubjectChainV1(subjectId);
  const results = [];
  let witnessed = 0;
  let quarantined = 0;

  const sorted = [...rows].sort((a, b) => Number(a?.height || 0) - Number(b?.height || 0));

  for (const entry of sorted) {
    const expectedHeight = chain.height + 1;
    const entryHeight = Number(entry?.height);
    if (entryHeight !== expectedHeight) {
      quarantined += 1;
      results.push(
        Object.freeze({
          status: "quarantined",
          code: "height_regression",
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
          height: entryHeight,
          interpretationOnly: true
        })
      );
      continue;
    }

    const witnessedAt = Date.now();
    const witnessBody = {
      subjectId: String(subjectId || "unknown"),
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
    totalWitnessedEntriesV1 += 1;
    witnessed += 1;

    const witnessedEntry = Object.freeze({
      schema: `${AUTHORITY_LEDGER_WITNESS_SCHEMA_V1}.record`,
      status: "witnessed",
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
      witnessedAt
    };

    results.push(witnessedEntry);
  }

  return Object.freeze({
    ok: quarantined === 0 || witnessed > 0,
    witnessed,
    quarantined,
    mode: "witness_append_only",
    chainHead: chain.chainHead,
    chainHeight: chain.height,
    totalWitnessedEntries: totalWitnessedEntriesV1,
    lastWitness: lastWitnessV1,
    results
  });
}

export function getAuthorityLedgerWitnessSnapshotV1(subjectId) {
  const chain = subjectId ? subjectChainsV1.get(String(subjectId)) : null;
  return Object.freeze({
    schema: `${AUTHORITY_LEDGER_WITNESS_SCHEMA_V1}.snapshot`,
    totalWitnessedEntries: totalWitnessedEntriesV1,
    lastWitness: lastWitnessV1,
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

/** @internal node:test */
export function resetAuthorityLedgerWitnessStoreForTestV1() {
  subjectChainsV1.clear();
  totalWitnessedEntriesV1 = 0;
  lastWitnessV1 = null;
}
