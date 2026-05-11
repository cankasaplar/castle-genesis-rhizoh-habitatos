/**
 * GEMC-1 — deterministic consolidation manifest (read-only; no source mutation).
 * @see docs/GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md
 *
 *   npm run epistemic:gemc-manifest -- --file scripts/fixtures/gemc-sample-sources.json
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

/**
 * @param {Record<string, unknown>} sources
 */
export function buildGemcManifest(sources) {
  const rollupId = `GEMC-ROLLUP-${createHash("sha256").update(stableStringify(sources)).digest("hex").slice(0, 16)}`;
  const manifestCore = {
    gemcVersion: "1.0",
    rollupId,
    sources: {
      epochRefs: sources.epochRefs ?? [],
      craArtifactIds: sources.craArtifactIds ?? [],
      talPointers: sources.talPointers ?? [],
      commitAnchors: sources.commitAnchors ?? []
    },
    compressionTier: sources.compressionTier ?? "unspecified",
    prunePolicyRef: sources.prunePolicyRef ?? null,
    derivedViewOnly: true,
    canonicalSourcesImmutable: true
  };
  const manifestHash = createHash("sha256").update(stableStringify(manifestCore)).digest("hex");
  return { ...manifestCore, manifestHash };
}

function main() {
  const argv = process.argv.slice(2);
  const fi = argv.indexOf("--file");
  if (fi === -1 || !argv[fi + 1]) {
    console.error("Usage: npm run epistemic:gemc-manifest -- --file path/to/gemc-sample-sources.json");
    process.exit(1);
  }
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, argv[fi + 1]), "utf8");
  } catch {
    console.error("gemcConsolidationManifest: cannot read file");
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("gemcConsolidationManifest: invalid JSON");
    process.exit(1);
  }
  console.log(JSON.stringify(buildGemcManifest(data), null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
