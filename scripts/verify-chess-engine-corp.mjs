#!/usr/bin/env node
/**
 * Verify /chess-engine/* CORP + MIME headers on a deployed host.
 * Usage: node scripts/verify-chess-engine-corp.mjs [origin]
 */

const origin = (process.argv[2] || "https://rhizoh.com").replace(/\/$/, "");
const paths = [
  "/chess-engine/stockfish-nnue-16-single.js",
  "/chess-engine/stockfish-nnue-16-single.wasm"
];

function isCorpOk(value) {
  const corp = String(value || "").toLowerCase();
  return corp.includes("same-origin") || corp.includes("same-site");
}

let failed = false;

for (const path of paths) {
  const url = `${origin}${path}`;
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const corp = res.headers.get("cross-origin-resource-policy");
    const type = res.headers.get("content-type") || "";
    const ok = res.ok && isCorpOk(corp);
    console.log(`${ok ? "OK" : "FAIL"} ${url}`);
    console.log(`  status=${res.status} corp=${corp || "(missing)"} type=${type}`);
    if (!ok) failed = true;
  } catch (err) {
    failed = true;
    console.log(`FAIL ${url}`);
    console.log(`  error=${err?.message || err}`);
  }
}

if (failed) {
  console.log("\nIf CORP is missing: redeploy firebase.json hosting headers and purge CDN cache for /chess-engine/*");
  process.exit(1);
}

console.log("\nChess engine CORP headers look good.");
