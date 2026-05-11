#!/usr/bin/env node
/**
 * Audit hash-chain doğrulama veya self-test (argümansız geçici zincir).
 *
 *   node scripts/rhizoh-audit-chain-verify.mjs [path/to/chain.jsonl]
 *
 * CI: argümansız çalışır — append + verify döngüsü.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GENESIS = "RHIZOH_AUDIT_CHAIN_GENESIS_V1";

function digestHex(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

/**
 * @param {string} filePath
 */
export function verifyRhizohAuditChainFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: "missing_file" };
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.trim().split("\n").filter(Boolean);
  let prevLineDigest = GENESIS;
  let lastSeq = 0;
  for (let i = 0; i < lines.length; i++) {
    let j;
    try {
      j = JSON.parse(lines[i]);
    } catch {
      return { ok: false, error: "bad_json", line: i + 1 };
    }
    if (j.prevDigest !== prevLineDigest) {
      return { ok: false, error: "prev_digest_mismatch", line: i + 1, seq: j.seq };
    }
    const material = `${j.prevDigest}|${j.recordDigest}|${j.seq}`;
    const expected = digestHex(material);
    if (expected !== j.lineDigest) {
      return { ok: false, error: "line_digest_mismatch", line: i + 1, seq: j.seq };
    }
    prevLineDigest = j.lineDigest;
    lastSeq = Number(j.seq) || lastSeq;
  }
  return { ok: true, lines: lines.length, lastSeq, headDigest: prevLineDigest };
}

const argPath = process.argv[2];

if (argPath) {
  const r = verifyRhizohAuditChainFile(argPath);
  console.log(JSON.stringify({ schema: "rhizoh.audit_chain.verify.v1", path: argPath, ...r }, null, 2));
  process.exit(r.ok ? 0 : 1);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rhizoh-audit-selftest-"));
const chainPath = path.join(dir, "chain.jsonl");

let head = GENESIS;
for (let seq = 1; seq <= 4; seq++) {
  const canonicalBody = JSON.stringify({ probe: seq, ts: 1 });
  const recordDigest = digestHex(canonicalBody);
  const lineDigest = digestHex(`${head}|${recordDigest}|${seq}`);
  const line = {
    seq,
    prevDigest: head,
    recordDigest,
    lineDigest,
    emittedAt: Date.now()
  };
  fs.appendFileSync(chainPath, `${JSON.stringify(line)}\n`, "utf8");
  head = lineDigest;
}

const self = verifyRhizohAuditChainFile(chainPath);
console.log(JSON.stringify({ schema: "rhizoh.audit_chain.selftest.v1", chainPath, ...self }, null, 2));
process.exit(self.ok ? 0 : 1);
