/**
 * SPECFLOW policy documents: presence, cross-links, and required tag vocabulary.
 * Does not read GitHub PR labels — that remains process or a future GH Action.
 *
 * Run: node scripts/validateSpecflowCoherence.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const FILES = Object.freeze({
  specflow: join(ROOT, "SPECFLOW_MARKERS.md"),
  stabilization: join(ROOT, "STABILIZATION.md"),
  sprintPrep: join(ROOT, "docs", "SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md"),
  postFreezeSummary: join(ROOT, "docs", "ARCHITECTURE_POST_FREEZE_SUMMARY.md"),
  habitatAcademic: join(ROOT, "docs", "SPRINT_HABITAT_ACADEMIC.md"),
  habitatCollab: join(ROOT, "docs", "HABITAT_COLLABORATION_ACADEMIC.md"),
  observationFabric: join(ROOT, "docs", "OBSERVATION_FABRIC_V1.md"),
  layerExpansion: join(ROOT, "docs", "LAYER_EXPANSION_PROTOCOL.md"),
  agentIdentity: join(ROOT, "docs", "AGENT_IDENTITY_AND_ATTRIBUTION.md"),
  worldstateSpec: join(ROOT, "docs", "WORLDSTATE_V0_SPEC.md"),
  worldstateSchema: join(ROOT, "docs", "schemas", "worldstate-v0.schema.json"),
  agents: join(ROOT, "AGENTS.md"),
  cursorRule: join(ROOT, ".cursor", "rules", "frozen-core-habitat.mdc"),
  graphDoc: join(ROOT, "STABILIZATION_GRAPH.md"),
  graphValidator: join(ROOT, "scripts", "validateStabilizationGraph.mjs")
});

const SPECFLOW_REQUIRED = Object.freeze([
  "CORE-ELIGIBLE",
  "RESEARCH-ONLY",
  "FUTURE-PROOF-ONLY",
  "Executable Core",
  "Specification / Research"
]);

function mustExist(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
}

function main() {
  for (const p of Object.values(FILES)) {
    mustExist(p);
  }

  const spec = readFileSync(FILES.specflow, "utf8");
  for (const token of SPECFLOW_REQUIRED) {
    if (!spec.includes(token)) {
      console.error(`validateSpecflowCoherence: SPECFLOW_MARKERS.md must contain: "${token}"`);
      process.exit(1);
    }
  }

  const stab = readFileSync(FILES.stabilization, "utf8");
  if (!stab.includes("SPECFLOW_MARKERS")) {
    console.error("validateSpecflowCoherence: STABILIZATION.md must reference SPECFLOW_MARKERS.md");
    process.exit(1);
  }
  if (!stab.includes("ARCHITECTURE_POST_FREEZE_SUMMARY")) {
    console.error(
      "validateSpecflowCoherence: STABILIZATION.md must reference docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md"
    );
    process.exit(1);
  }

  const post = readFileSync(FILES.postFreezeSummary, "utf8");
  for (const token of ["v562", "Executable Core", "Policy / Spec", "Epistemic Layer", "enforce edilmiyor", "Habitat"]) {
    if (!post.includes(token)) {
      console.error(
        `validateSpecflowCoherence: docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md must contain: "${token}"`
      );
      process.exit(1);
    }
  }

  const agents = readFileSync(FILES.agents, "utf8");
  for (const token of [
    "frozen-core-habitat.mdc",
    "SPRINT_HABITAT_ACADEMIC.md",
    "HABITAT_COLLABORATION_ACADEMIC.md",
    "OBSERVATION_FABRIC_V1.md",
    "LAYER_EXPANSION_PROTOCOL.md",
    "AGENT_IDENTITY_AND_ATTRIBUTION.md",
    "WORLDSTATE_V0_SPEC.md",
    "worldstate-v0.schema.json",
    "v562"
  ]) {
    if (!agents.includes(token)) {
      console.error(`validateSpecflowCoherence: AGENTS.md must reference or contain: "${token}"`);
      process.exit(1);
    }
  }

  const academic = readFileSync(FILES.habitatAcademic, "utf8");
  if (!academic.includes("RESEARCH-ONLY")) {
    console.error("validateSpecflowCoherence: SPRINT_HABITAT_ACADEMIC.md must mention RESEARCH-ONLY");
    process.exit(1);
  }

  const collab = readFileSync(FILES.habitatCollab, "utf8");
  if (!collab.includes("Nisa")) {
    console.error("validateSpecflowCoherence: HABITAT_COLLABORATION_ACADEMIC.md must mention Nisa");
    process.exit(1);
  }

  const rule = readFileSync(FILES.cursorRule, "utf8");
  if (!rule.includes("alwaysApply") || !rule.includes("v562")) {
    console.error(
      "validateSpecflowCoherence: .cursor/rules/frozen-core-habitat.mdc must include alwaysApply and v562"
    );
    process.exit(1);
  }

  const prep = readFileSync(FILES.sprintPrep, "utf8");
  if (!prep.includes("SPECFLOW_MARKERS")) {
    console.error(
      "validateSpecflowCoherence: docs/SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md must reference SPECFLOW_MARKERS"
    );
    process.exit(1);
  }

  console.log("validateSpecflowCoherence: OK (policy docs present, tags and cross-links intact).");
}

main();
