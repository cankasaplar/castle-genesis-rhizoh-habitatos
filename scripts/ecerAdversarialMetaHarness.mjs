/**
 * ECER-ADV-META-1.1 — empty-cell detection, CI gate, synthetic proposal emission.
 *
 *   node scripts/ecerAdversarialMetaHarness.mjs check
 *   node scripts/ecerAdversarialMetaHarness.mjs suggest
 *   node scripts/ecerAdversarialMetaHarness.mjs suggest --write <file.json>
 *
 * @see docs/ECER_ADVERSARIAL_META_ADV_1_1.md
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADVERSARIAL_COMPLETENESS_VERSION,
  isAxisComplete,
  listMissingCells
} from "./ecerAdversarialCompleteness.mjs";
import { verifiedCoverageMatrix } from "./fixtures/ecer-adversarial/coverageRegistry.mjs";
import { syntheticProposalsForMissing } from "./ecerAdversarialSynthetic.mjs";

/**
 * @param {string | undefined} path
 * @returns {Record<string, Record<string, boolean>> | undefined}
 */
function loadOptionalOverlay(path) {
  if (!path) {
    return undefined;
  }
  const raw = readFileSync(resolve(path), "utf8");
  const j = JSON.parse(raw);
  if (!j || typeof j !== "object" || !j.matrix) {
    throw new Error("overlay JSON must be { matrix: Record<d, Record<axis, boolean>> }");
  }
  return j.matrix;
}

function printCheckHelp(missing) {
  console.error(
    JSON.stringify(
      {
        completenessVersion: ADVERSARIAL_COMPLETENESS_VERSION,
        axisComplete: false,
        missingCellCount: missing.length,
        hint: "Run: npm run epistemic:ecer-adv-suggest",
        next: "Implement minimal mutations; register in scripts/fixtures/ecer-adversarial/coverageRegistry.mjs"
      },
      null,
      2
    )
  );
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0] || "check";

  const overlayIdx = argv.indexOf("--overlay");
  const overlayPath = overlayIdx >= 0 ? argv[overlayIdx + 1] : undefined;
  const overlay = loadOptionalOverlay(overlayPath);

  const matrix = verifiedCoverageMatrix(overlay);

  if (cmd === "check") {
    const ok = isAxisComplete(matrix);
    if (!ok) {
      const missing = listMissingCells(matrix);
      printCheckHelp(missing);
      process.exit(1);
    }
    console.log(
      JSON.stringify(
        {
          completenessVersion: ADVERSARIAL_COMPLETENESS_VERSION,
          axisComplete: true,
          overlay: Boolean(overlayPath)
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  if (cmd === "suggest") {
    const missing = listMissingCells(matrix);
    const proposals = syntheticProposalsForMissing(missing);
    const payload = {
      completenessVersion: ADVERSARIAL_COMPLETENESS_VERSION,
      generatedFor: "empty_cells_after_verified_registry",
      missingCellCount: missing.length,
      proposals
    };

    const writeIdx = argv.indexOf("--write");
    if (writeIdx >= 0) {
      const out = argv[writeIdx + 1];
      if (!out) {
        console.error("usage: suggest --write <file.json>");
        process.exit(1);
      }
      writeFileSync(resolve(out), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      console.log(JSON.stringify({ written: out, proposalCount: proposals.length }, null, 2));
      process.exit(0);
    }

    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }

  console.error("usage: ecerAdversarialMetaHarness.mjs check|suggest [--overlay <matrix.json>]");
  console.error("       suggest --write <file.json> [--overlay <matrix.json>]");
  process.exit(1);
}

main();
