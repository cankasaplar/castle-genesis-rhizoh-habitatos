#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const here = dirname(fileURLToPath(import.meta.url));
const analysisArg = process.argv[2];

const narrative = await buildUnifiedStateNarrativeV0({
  loadTestAnalysisPath: analysisArg || undefined
});

const json = JSON.stringify(narrative, null, 2);
console.log(json);

const exportDir = join(here, "../../../../docs/exports/ops");
mkdirSync(exportDir, { recursive: true });
const out = join(exportDir, "unified_state_narrative_LATEST.json");
writeFileSync(out, json, "utf8");
console.error(`wrote ${out}`);
