#!/usr/bin/env node
/**
 * Client reply boundary — forbid second-schema LLM reply re-extract on presentation paths.
 * Gateway owns extractPath; client reads json.reply only via replyEnvelope projection.
 *
 * @see docs/RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const scanRoot = join(root, "apps/client/src");

const EXEMPT = [
  "rhizohLlmReplyNormalizeV0.js",
  "rhizohReplyEnvelopeV1.js",
  "__tests__/",
  "/__tests__/"
];

/** Second reply selector — forbidden outside normalize/envelope modules. */
const FORBIDDEN = [
  /\?\.reply\s*\?\?\s*[^;\n]*\?\.(text|message|content)/,
  /\?\.(text|message|content)\s*\?\?\s*[^;\n]*\?\.(text|message|content|reply)/
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

function isExempt(rel) {
  if (EXEMPT.some((s) => rel.includes(s))) return true;
  return false;
}

const failures = [];
for (const file of walk(scanRoot)) {
  const rel = relative(root, file).replace(/\\/g, "/");
  if (isExempt(rel)) continue;
  const text = readFileSync(file, "utf8");
  for (const re of FORBIDDEN) {
    if (re.test(text)) {
      failures.push({ rel, rule: re.source });
    }
  }
}

if (failures.length) {
  console.error("[REPLY_ENVELOPE_BOUNDARY] Client LLM reply re-extract forbidden:");
  for (const f of failures) {
    console.error(`  ${f.rel} — ${f.rule}`);
  }
  process.exit(1);
}

console.log("[REPLY_ENVELOPE_BOUNDARY] ok — no client reply fallback chains");
