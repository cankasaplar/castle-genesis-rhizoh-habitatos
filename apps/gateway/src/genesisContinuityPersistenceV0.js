import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyEpistemicSeal } from "./epistemicSeal.js";
import { getGenesisLedgerChainAnchorHexV0 } from "./genesisLedgerAnchorV0.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHECKPOINT_LOG = "genesis-checkpoints.jsonl";
const CONTINUITY_HEAD = "genesis-continuity-head.json";

/** @returns {boolean} */
export function genesisContinuityDiskPersistEnabled() {
  return String(process.env.CASTLE_GENESIS_DISK_PERSIST || "").trim() === "1";
}

export function genesisContinuityDataDir() {
  const o = String(process.env.CASTLE_GENESIS_DATA_DIR || "").trim();
  if (o) return path.resolve(o);
  return path.join(__dirname, "..", "data");
}

function checkpointLogPath() {
  return path.join(genesisContinuityDataDir(), CHECKPOINT_LOG);
}

function continuityHeadPath() {
  return path.join(genesisContinuityDataDir(), CONTINUITY_HEAD);
}

function sealSecret() {
  return String(process.env.CASTLE_EPISTEMIC_SEAL_SECRET || process.env.CASTLE_GATEWAY_TOKEN || "").trim();
}

async function ensureDataDir() {
  await fs.mkdir(genesisContinuityDataDir(), { recursive: true });
}

/**
 * Federation-oriented log line: explicit chain fields + full signed payload for offline verify.
 * @param {Record<string, unknown>} cp — materialized checkpoint
 */
export async function appendGenesisCheckpointLogLineV0(cp) {
  if (!genesisContinuityDiskPersistEnabled() || !cp || typeof cp !== "object") return;
  await ensureDataDir();
  const line = {
    recordSchema: "castle.genesis.checkpoint_log_line.v0",
    seqCommittedThrough: cp.seqCommittedThrough,
    prevLedgerRoot: cp.prevLedgerRoot,
    ledgerRoot: cp.ledgerRoot,
    checkpointHash: cp.checkpointHash,
    signature: cp.signature,
    serverTime: cp.serverTime,
    intervalSeq: cp.intervalSeq,
    canonical: cp.canonical,
    checkpoint: cp
  };
  await fs.appendFile(checkpointLogPath(), `${JSON.stringify(line)}\n`, "utf8");
}

let headTimer = null;
let pendingHeadSeq = 0;

async function flushContinuityHead(seq) {
  if (!genesisContinuityDiskPersistEnabled()) return;
  await ensureDataDir();
  const body = JSON.stringify({
    recordSchema: "castle.genesis.continuity_head.v0",
    lastContinuitySeq: Number(seq) || 0,
    serverTime: Date.now()
  });
  const p = continuityHeadPath();
  const tmp = `${p}.${process.pid}.tmp`;
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, p);
}

/** Coalesced atomic head write (crash window ≤ debounce). */
export function scheduleGenesisContinuityHeadPersistV0(seq) {
  if (!genesisContinuityDiskPersistEnabled()) return;
  pendingHeadSeq = Number(seq) || 0;
  if (headTimer) return;
  headTimer = setTimeout(() => {
    headTimer = null;
    const s = pendingHeadSeq;
    void flushContinuityHead(s).catch(() => {});
  }, 40);
}

/** @returns {Promise<number>} */
export async function readGenesisContinuityHeadLastSeqV0() {
  if (!genesisContinuityDiskPersistEnabled()) return 0;
  try {
    const raw = await fs.readFile(continuityHeadPath(), "utf8");
    const j = JSON.parse(raw);
    return Math.max(0, Math.floor(Number(j?.lastContinuitySeq) || 0));
  } catch {
    return 0;
  }
}

/**
 * Parse JSONL checkpoint log text (no chain validation).
 * @returns {{ ok: true, records: Array<{ lineIndex: number, cp: Record<string, unknown> }> } | { ok: false, error: string, records: Array<{ lineIndex: number, cp: Record<string, unknown> }> }}
 */
export function parseGenesisCheckpointLogTextV0(raw) {
  /** @type {Array<{ lineIndex: number, cp: Record<string, unknown> }>} */
  const records = [];
  const lines = String(raw || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    try {
      const row = JSON.parse(lines[i]);
      const cp = row.checkpoint && typeof row.checkpoint === "object" ? row.checkpoint : row;
      records.push({ lineIndex: i + 1, cp });
    } catch {
      return { ok: false, error: `checkpoint_log_parse_error_line_${i + 1}`, records };
    }
  }
  return { ok: true, records };
}

/**
 * Validate full ordered checkpoint list (anchor + prev chain + optional HMAC).
 * @param {Array<{ lineIndex: number, cp: Record<string, unknown> }>} records
 */
export function validateGenesisCheckpointRecordsChainV0(records) {
  if (!Array.isArray(records)) {
    return { ok: false, error: "records_invalid", linesValidated: 0, maxSeqCommitted: 0 };
  }
  const secret = sealSecret();
  const anchor = getGenesisLedgerChainAnchorHexV0();
  let expectedPrev = anchor;
  let maxSeqCommitted = 0;
  /** @type {Record<string, unknown> | null} */
  let lastCp = null;
  for (let i = 0; i < records.length; i++) {
    const { lineIndex, cp } = records[i];
    const prev = String(cp.prevLedgerRoot || "");
    const ledger = String(cp.ledgerRoot || "");
    if (prev !== expectedPrev) {
      return {
        ok: false,
        error: `checkpoint_chain_prev_mismatch_line_${lineIndex}`,
        linesValidated: i,
        maxSeqCommitted
      };
    }
    if (secret) {
      const okS = verifyEpistemicSeal(
        String(cp.canonical || ""),
        secret,
        String(cp.checkpointHash || ""),
        String(cp.signature || "")
      );
      if (!okS) {
        return {
          ok: false,
          error: `checkpoint_signature_invalid_line_${lineIndex}`,
          linesValidated: i,
          maxSeqCommitted
        };
      }
    }
    expectedPrev = ledger;
    lastCp = cp;
    maxSeqCommitted = Math.max(maxSeqCommitted, Math.floor(Number(cp.seqCommittedThrough) || 0));
  }
  return {
    ok: true,
    linesValidated: records.length,
    maxSeqCommitted,
    ledgerHeadHex: lastCp ? expectedPrev : undefined,
    latestCp: lastCp
  };
}

/**
 * Read checkpoint log from disk (parse only; validate separately for query vs hydrate).
 * @returns {Promise<{ ok: boolean, error?: string, records: Array<{ lineIndex: number, cp: Record<string, unknown> }> }>}
 */
export async function readGenesisCheckpointLogRecordsV0() {
  if (!genesisContinuityDiskPersistEnabled()) {
    return { ok: true, records: [] };
  }
  let raw = "";
  try {
    raw = await fs.readFile(checkpointLogPath(), "utf8");
  } catch {
    return { ok: true, records: [] };
  }
  const parsed = parseGenesisCheckpointLogTextV0(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, records: parsed.records };
  }
  return { ok: true, records: parsed.records };
}

/**
 * Replay checkpoint JSONL: chain integrity + optional HMAC verify.
 * Caller applies `ledgerHeadHex` + `latestCp` via `applyGenesisCheckpointHydrationV0`.
 * @returns {Promise<{ ok: boolean, error?: string, linesApplied: number, maxSeqCommitted: number, ledgerHeadHex?: string, latestCp?: Record<string, unknown> | null }>}
 */
export async function hydrateGenesisCheckpointLogFromDiskV0() {
  if (!genesisContinuityDiskPersistEnabled()) {
    return { ok: true, linesApplied: 0, maxSeqCommitted: 0, latestCp: null };
  }
  const logPath = checkpointLogPath();
  let raw = "";
  try {
    raw = await fs.readFile(logPath, "utf8");
  } catch {
    return { ok: true, linesApplied: 0, maxSeqCommitted: 0, latestCp: null };
  }
  const parsed = parseGenesisCheckpointLogTextV0(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, linesApplied: 0, maxSeqCommitted: 0, latestCp: null };
  }
  const v = validateGenesisCheckpointRecordsChainV0(parsed.records);
  if (!v.ok) {
    return {
      ok: false,
      error: v.error,
      linesApplied: v.linesValidated ?? 0,
      maxSeqCommitted: v.maxSeqCommitted ?? 0,
      latestCp: null
    };
  }
  return {
    ok: true,
    linesApplied: parsed.records.length,
    maxSeqCommitted: v.maxSeqCommitted ?? 0,
    ledgerHeadHex: v.ledgerHeadHex,
    latestCp: v.latestCp ?? null
  };
}
