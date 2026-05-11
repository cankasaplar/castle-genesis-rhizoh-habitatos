/**
 * Compensation Execution Engine — dry-run markdown template (no repo writes).
 * @see docs/COMPENSATION_EXECUTION_ENGINE_V1.md
 *
 *   npm run epistemic:cee-template -- --file scripts/fixtures/cee-sample-input.json
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/**
 * @param {unknown} o
 * @returns {o is Record<string, unknown>}
 */
function isObj(o) {
  return o !== null && typeof o === "object" && !Array.isArray(o);
}

/**
 * @param {Record<string, unknown>} input
 */
export function buildCompensationMarkdown(input) {
  const id = String(input.compensationId ?? "CIL-COMP-<SET_ID>");
  const date = String(input.date ?? "YYYY-MM-DD");
  const compensationOf = String(input.compensationOf ?? "");
  const failureContext = String(input.failureContext ?? input.failedAseCode ?? "");
  const priorAnchor = String(input.priorAnchor ?? "");
  const specflow = String(input.specflow ?? "FUTURE-PROOF-ONLY");
  const summary = String(input.summary ?? "");
  const rationale = String(input.rationale ?? "");
  const validation = String(input.validation ?? "npm run stabilization:validate-amendment -- --verify");
  const attestations = String(input.attestations ?? "- Role: Maintainer — Identity: — Ref: ");

  const targets = Array.isArray(input.targets) ? input.targets.map((x) => String(x)).filter(Boolean) : [];
  const targetsLine = targets.length ? targets.join(", ") : "(comma-separated repo paths)";

  if (!compensationOf.trim()) {
    throw new Error("ceeCompensationTemplate: compensationOf is required");
  }
  if (!priorAnchor.trim()) {
    throw new Error("ceeCompensationTemplate: priorAnchor is required");
  }

  return `## CIL-AMENDMENT ${id}

**Date:** ${date}
**Change-class:** ADD
**Compensation-of:** ${compensationOf}
**Failure-context:** ${failureContext || "(ASE or AEE code + one line)"}
**Targets:** ${targetsLine}
**Prior-anchor:** ${priorAnchor}
**SPECFLOW:** ${specflow}
**Summary:** ${summary || "(what failed / what this fixes)"}
**Rationale:** ${rationale || "(why this compensation now)"}
**Validation:** ${validation}
**Attestations:**
${attestations}
`;
}

function main() {
  const argv = process.argv.slice(2);
  let rawText = null;
  const fi = argv.indexOf("--file");
  if (fi !== -1 && argv[fi + 1]) {
    rawText = readFileSync(resolve(ROOT, argv[fi + 1]), "utf8");
  }
  if (rawText == null && process.env.CEE_INPUT_JSON) {
    rawText = process.env.CEE_INPUT_JSON;
  }
  if (rawText == null) {
    console.error("Usage: npm run epistemic:cee-template -- --file path/to/input.json");
    console.error("   or: CEE_INPUT_JSON='{...}' node scripts/ceeCompensationTemplate.mjs");
    process.exit(1);
  }
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    console.error("ceeCompensationTemplate: invalid JSON");
    process.exit(1);
  }
  if (!isObj(data)) {
    console.error("ceeCompensationTemplate: root must be object");
    process.exit(1);
  }
  try {
    process.stdout.write(buildCompensationMarkdown(data));
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
