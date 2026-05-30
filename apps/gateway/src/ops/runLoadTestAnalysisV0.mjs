#!/usr/bin/env node
/**
 * Analyze load_test_harness_LATEST.json → health intelligence + divergence map.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeAndExportLoadTestV0 } from "./loadTestAnalysisEngineV0.js";

const here = dirname(fileURLToPath(import.meta.url));
const defaultIn = join(here, "../../../../docs/exports/ops/load_test_harness_LATEST.json");
const input = process.argv[2] || defaultIn;

const { analysis, jsonPath, mdPath, divergencePath } = analyzeAndExportLoadTestV0(input);
console.log(JSON.stringify(analysis, null, 2));
console.error(`wrote ${jsonPath}`);
console.error(`wrote ${mdPath}`);
console.error(`wrote ${divergencePath}`);
