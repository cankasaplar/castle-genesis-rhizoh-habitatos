#!/usr/bin/env node
/**
 * Seal LEGAL_REALITY_SPEC_V0.1.md — SHA-256 for ledger / SESSION_LOG.
 * Usage: node scripts/seal-legal-reality-spec.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "docs/LEGAL_REALITY_SPEC_V0.1.md");
const body = readFileSync(path, "utf8");
const sha256 = createHash("sha256").update(body, "utf8").digest("hex");

console.log(JSON.stringify({ path: "docs/LEGAL_REALITY_SPEC_V0.1.md", sha256, atMs: Date.now() }, null, 2));
