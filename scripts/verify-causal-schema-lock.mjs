/**
 * Ensures committed RSK ontology version matches scripts/locks/causal-schema.lock.
 * Intentional schema bumps require updating the lock file in the same PR.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ontologyPath = path.join(root, "apps/client/src/studio/types/rskOntology.ts");
const lockPath = path.join(root, "scripts/locks/causal-schema.lock");

function readOntologyVersion() {
  const src = fs.readFileSync(ontologyPath, "utf8");
  const m = src.match(/export const RSK_ONTOLOGY_VERSION\s*=\s*"([^"]+)"/);
  if (!m) {
    throw new Error(`Could not find RSK_ONTOLOGY_VERSION in ${path.relative(root, ontologyPath)}`);
  }
  return m[1];
}

function readLockVersion() {
  if (!fs.existsSync(lockPath)) {
    throw new Error(`Missing lock file: ${path.relative(root, lockPath)}`);
  }
  const raw = fs.readFileSync(lockPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const kv = /^RSK_ONTOLOGY_VERSION\s*=\s*(.+)$/.exec(t);
    if (kv) return kv[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error(`No RSK_ONTOLOGY_VERSION= line in ${path.relative(root, lockPath)}`);
}

try {
  const fromSource = readOntologyVersion();
  const fromLock = readLockVersion();
  if (fromSource !== fromLock) {
    console.error(
      `[causal-schema-lock] Mismatch:\n  rskOntology.ts → ${JSON.stringify(fromSource)}\n  causal-schema.lock → ${JSON.stringify(
        fromLock
      )}\nUpdate scripts/locks/causal-schema.lock in the same PR as ontology changes.`
    );
    process.exit(1);
  }
  console.log(`[causal-schema-lock] OK RSK_ONTOLOGY_VERSION=${fromSource}`);
} catch (e) {
  console.error("[causal-schema-lock]", e instanceof Error ? e.message : e);
  process.exit(1);
}
