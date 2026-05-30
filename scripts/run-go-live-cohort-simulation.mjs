#!/usr/bin/env node
/**
 * Go-live cohort simulation — export JSON + summary MD.
 * Usage: node scripts/run-go-live-cohort-simulation.mjs [--nodes 50] [--seed 42]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  return args[i + 1] ?? def;
}

const nodeCount = Number(arg("--nodes", "50"));
const seed = Number(arg("--seed", "42"));
const minAdmit = arg("--min-admit", null);

const engineUrl = pathToFileURL(
  join(root, "apps/client/src/rhizoh/ingress/goLiveCohortSimulationV0.js")
).href;
const { runGoLiveCohortSimulationV0, buildGoLiveCohortExportBundleV0 } = await import(engineUrl);

const thresholds = {};
if (minAdmit != null) thresholds.minAdmitRate = Number(minAdmit);

const run = runGoLiveCohortSimulationV0({ nodeCount, seed, thresholds });
const bundle = buildGoLiveCohortExportBundleV0(run);

const outDir = join(root, "docs/exports/ops");
mkdirSync(outDir, { recursive: true });

const jsonPath = join(outDir, "go_live_cohort_simulation_v1.0.json");
const mdPath = join(outDir, "go_live_cohort_simulation_v1.0_summary.md");

writeFileSync(jsonPath, JSON.stringify(bundle, null, 2), "utf8");

const md = `# Go-Live Cohort Simulation Summary

- **Generated:** ${bundle.generatedAt}
- **Nodes:** ${bundle.nodeCount} · **Seed:** ${bundle.seed}
- **Decision:** \`${bundle.decision}\`

## Metrics

| Metric | Value |
|--------|-------|
| Admit rate | ${(bundle.metrics.admitRate * 100).toFixed(1)}% |
| Hold rate | ${(bundle.metrics.holdRate * 100).toFixed(1)}% |
| Reject rate | ${(bundle.metrics.rejectRate * 100).toFixed(1)}% |
| Stress class spread | ${bundle.metrics.stressClassSpread} |
| Max single-class share | ${(bundle.metrics.maxSingleClassShare * 100).toFixed(1)}% |

## Histogram

${Object.entries(bundle.metrics.histogram)
  .map(([k, v]) => `- \`${k}\`: ${v}`)
  .join("\n")}

## Verdict counts

${Object.entries(bundle.metrics.verdictCounts)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

${bundle.reasons.length ? `## Decision reasons\n\n${bundle.reasons.map((r) => `- ${r}`).join("\n")}\n` : ""}

*Legal freeze ref: ${bundle.legalFreezeRef} · interpretation only*
`;

writeFileSync(mdPath, md, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: bundle.decision,
      admitRate: bundle.metrics.admitRate,
      jsonPath,
      mdPath
    },
    null,
    2
  )
);
