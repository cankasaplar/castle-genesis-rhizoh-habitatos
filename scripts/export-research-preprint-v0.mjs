#!/usr/bin/env node
/**
 * Export RHIZOH_RESEARCH_PREPRINT_V1.md → PDF (requires pandoc).
 * Run: npm run academic:export-preprint-v0
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "docs/academic/RHIZOH_RESEARCH_PREPRINT_V1.md");
const outDir = join(root, "docs/exports/academic");
const out = join(outDir, "RHIZOH_RESEARCH_PREPRINT_V1.pdf");

if (!existsSync(src)) {
  console.error("academic:export-preprint-v0: missing", src);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

try {
  execSync(`pandoc "${src}" -o "${out}" --metadata title="Rhizoh Research Preprint v1"`, {
    stdio: "inherit"
  });
  console.log("academic:export-preprint-v0: OK", out);
} catch (e) {
  console.error(
    "academic:export-preprint-v0: pandoc failed — install pandoc or use the markdown source directly:"
  );
  console.error(" ", src);
  process.exit(1);
}
