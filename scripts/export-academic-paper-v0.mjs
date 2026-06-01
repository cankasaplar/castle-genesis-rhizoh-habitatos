#!/usr/bin/env node
/**
 * Academic Observatory — export JSON → paper markdown (file or stdout).
 *
 * Live gateway:
 *   CASTLE_GATEWAY_HTTP=https://your-gateway.onrender.com
 *   CASTLE_GATEWAY_TOKEN=...
 *   CASTLE_ACADEMIC_OBSERVATORY_KEY=...   (or X-Castle-Moderation-Key equivalent)
 *   node scripts/export-academic-paper-v0.mjs --user-id=uid_... --thread-id=thr_...
 *
 * Authenticated user (own scope) — Firebase ID token:
 *   CASTLE_GATEWAY_HTTP=... CASTLE_FIREBASE_ID_TOKEN=...
 *   node scripts/export-academic-paper-v0.mjs --thread-id=thr_...
 *
 * Offline from saved export JSON:
 *   node scripts/export-academic-paper-v0.mjs path/to/export.json
 *   node scripts/export-academic-paper-v0.mjs < export.json
 *
 * Default output: docs/exports/academic/<timestamp>-<thread>.md
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const { formatAcademicPaperMarkdownV0, buildPaperBlocksFromExportV0 } = await import(
  pathToFileURL(join(root, "apps/gateway/src/rhizoh/academicObservationExportV0.js")).href
);

function usage() {
  process.stderr.write(`Usage:
  node scripts/export-academic-paper-v0.mjs [export.json | -]
  node scripts/export-academic-paper-v0.mjs --user-id=UID [--thread-id=] [--trace-id=] [--out=path.md]

Env (gateway): CASTLE_GATEWAY_HTTP, CASTLE_GATEWAY_TOKEN or CASTLE_FIREBASE_ID_TOKEN,
  CASTLE_ACADEMIC_OBSERVATORY_KEY (admin cross-user)
`);
}

/**
 * @param {string} name
 */
function argValue(name) {
  const pref = `--${name}=`;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(pref)) return a.slice(pref.length);
  }
  return "";
}

/**
 * @param {Record<string, unknown>} body
 */
function extractExportEnvelope(body) {
  if (body?.export && typeof body.export === "object") {
    return /** @type {Record<string, unknown>} */ (body.export);
  }
  if (body?.contract_version) return body;
  throw new Error("invalid_export_json");
}

/**
 * @param {{ userId: string, threadId?: string, traceId?: string }} q
 */
async function fetchExportFromGateway(q) {
  const base = String(process.env.CASTLE_GATEWAY_HTTP || process.env.VITE_GATEWAY_HTTP || "")
    .trim()
    .replace(/\/+$/, "");
  if (!base) throw new Error("CASTLE_GATEWAY_HTTP_required");

  const url = new URL(`${base}/rhizoh/academic/observatory/export`);
  url.searchParams.set("paper", "1");
  if (q.threadId) url.searchParams.set("thread_id", q.threadId);
  if (q.traceId) url.searchParams.set("trace_id", q.traceId);
  if (q.userId) url.searchParams.set("user_id", q.userId);

  /** @type {Record<string, string>} */
  const headers = { Accept: "application/json" };
  const obsKey = String(process.env.CASTLE_ACADEMIC_OBSERVATORY_KEY || "").trim();
  const modKey = String(process.env.CASTLE_MODERATION_ADMIN_KEY || "").trim();
  if (obsKey) headers["X-Castle-Academic-Observatory-Key"] = obsKey;
  else if (modKey) headers["X-Castle-Moderation-Key"] = modKey;

  const gatewayToken = String(process.env.CASTLE_GATEWAY_TOKEN || process.env.VITE_GATEWAY_TOKEN || "").trim();
  const firebaseToken = String(process.env.CASTLE_FIREBASE_ID_TOKEN || "").trim();
  if (firebaseToken) headers.Authorization = `Bearer ${firebaseToken}`;
  else if (gatewayToken) headers["X-Castle-Gateway-Token"] = gatewayToken;

  const res = await fetch(url.toString(), { method: "GET", headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`gateway_non_json status=${res.status}`);
  }
  if (!res.ok || !body?.ok) {
    throw new Error(`gateway_export_failed status=${res.status} error=${body?.error || "unknown"}`);
  }
  return extractExportEnvelope(body);
}

function defaultOutPath(exp) {
  const ts = String(exp?.exported_at || new Date().toISOString())
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const thread = String(exp?.session_ref?.thread_id || "session").replace(/[^\w-]+/g, "_");
  return join(root, "docs", "exports", "academic", `${ts}-${thread}.md`);
}

async function main() {
  const argv = process.argv.slice(2);
  const outArg = argValue("out");
  const userId = argValue("user-id");
  const threadId = argValue("thread-id");
  const traceId = argValue("trace-id");

  let exp;
  const positional = argv.find((a) => !a.startsWith("--") && a !== outArg);
  if (positional && positional !== "-") {
    const raw = readFileSync(positional, "utf8");
    exp = extractExportEnvelope(JSON.parse(raw));
  } else if (positional === "-" || (!userId && !process.env.CASTLE_GATEWAY_HTTP)) {
    const raw = readFileSync(0, "utf8");
    exp = extractExportEnvelope(JSON.parse(raw));
  } else if (userId || process.env.CASTLE_GATEWAY_HTTP) {
    const uid =
      userId ||
      String(process.env.CASTLE_ACADEMIC_EXPORT_USER_ID || process.env.CASTLE_EXPORT_USER_ID || "").trim();
    if (uid.length < 8) {
      usage();
      throw new Error("user_id_required (--user-id or CASTLE_ACADEMIC_EXPORT_USER_ID)");
    }
    exp = await fetchExportFromGateway({
      userId: uid,
      threadId: threadId || undefined,
      traceId: traceId || undefined
    });
  } else {
    usage();
    process.exit(2);
  }

  const paper = formatAcademicPaperMarkdownV0(exp, buildPaperBlocksFromExportV0(exp));
  const outPath = outArg || defaultOutPath(exp);

  if (outArg || !process.stdout.isTTY) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, paper, "utf8");
    process.stderr.write(`Wrote ${outPath}\n`);
  } else {
    process.stdout.write(paper);
  }
}

main().catch((e) => {
  process.stderr.write(`[export-academic-paper-v0] ${e?.message || e}\n`);
  process.exit(1);
});
