#!/usr/bin/env node
/**
 * Verify world artifact layout (post-build deploy gate).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = ["ui", "scr", "studio", "castle", "pet"];
let ok = true;

for (const surface of required) {
  const dir = join(root, "dist", surface);
  const manifest = join(dir, "world-artifact.v0.json");
  if (!existsSync(dir) || !existsSync(manifest)) {
    console.error(`MISSING: dist/${surface} (run npm run ops:materialize-world-artifacts-v0)`);
    ok = false;
  } else {
    console.log(`OK: dist/${surface}`);
  }
}

if (!existsSync(join(root, "dist/world-manifest.v0.json"))) {
  console.error("MISSING: dist/world-manifest.v0.json");
  ok = false;
}

process.exit(ok ? 0 : 1);
