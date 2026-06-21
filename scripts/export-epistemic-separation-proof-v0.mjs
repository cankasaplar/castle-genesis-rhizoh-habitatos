#!/usr/bin/env node
/**
 * Export epistemic separation proof artifact for paper / CI.
 * Run: npm run academic:export-separation-proof-v0
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/exports/academic");
mkdirSync(outDir, { recursive: true });

execSync("npm run ops:validate-observer-trace-boundary-v0", { cwd: root, stdio: "inherit" });

const artifact = {
  schema: "castle.rhizoh.epistemic_separation_proof_export.v0",
  exportedAtMs: Date.now(),
  boundaryValidation: "validate-observer-trace-boundary-v0: OK",
  paperSpine: [
    "Narrative generation is decoupled from causal truth",
    "Observer does not induce system state change, only projection bias",
    "Rhizoh is a non-agentic epistemic system in which observer traces generate only read-only narrative projections without causal or learning feedback into the system graph"
  ],
  enforcedBoundaries: {
    observerTraceExcludedFrom: [
      "learning_loops",
      "identity_updates",
      "causal_compression",
      "identity_event_log",
      "wal_seal_chain"
    ],
    narrativeFlags: {
      semanticCoupling: false,
      epistemicResonanceInNarrativePlane: false,
      bidirectionalInfluence: false
    },
    resonanceField: {
      measurementOnly: true,
      influencesCausalGraph: false,
      influencesNarrative: false
    }
  },
  browserProof: "window.__rhizoh.epistemicSeparationProof.build()",
  invitationStudy: "window.__rhizoh.invitationStudy.export()"
};

const outPath = join(outDir, "epistemic_separation_proof_v0.json");
writeFileSync(outPath, JSON.stringify(artifact, null, 2));
console.log(`export-separation-proof-v0: wrote ${outPath}`);
