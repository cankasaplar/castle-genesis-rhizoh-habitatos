/**
 * CI Reply Schema Simulation Gate v1 — policy enforcement (deploy constraint).
 * Cohort routing controls WHERE; this gate controls WHETHER schema may ship.
 * @see docs/RHIZOH_REPLY_SCHEMA_EVOLUTION_GOVERNANCE_V1.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RHIZOH_REPLY_SCHEMA_V1,
  RHIZOH_REPLY_SCHEMA_REGISTRY_V1,
  attachReplySchemaContractV1
} from "../rhizohReplySchemaRegistryV1.js";
import { simulateReplySchemaEvolutionV1 } from "../rhizohReplySchemaLifecycleV1.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURE = path.join(__dirname, "../../fixtures/replySchemaGoldenSuiteV1.json");

/**
 * @param {{ strictFuture?: boolean, fixturePath?: string }} [opts]
 */
export function evaluateReplySchemaSimulationGateV1(opts = {}) {
  const strictFuture = opts.strictFuture === true;
  const fixturePath = opts.fixturePath ?? DEFAULT_FIXTURE;
  const raw = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const enforceSchema = String(raw.enforceSchema || RHIZOH_REPLY_SCHEMA_REGISTRY_V1.current);

  /** @type {{ id: string, mustPass: boolean, body: Record<string, unknown>, source?: string }[]} */
  const samples = [...(Array.isArray(raw.samples) ? raw.samples : [])];

  /** Live contract probes — gateway attach output must satisfy current schema */
  const liveProbes = [
    {
      id: "probe_live_ok",
      source: "attachReplySchemaContractV1",
      mustPass: true,
      body: attachReplySchemaContractV1(
        {
          ok: true,
          reply: "CI probe",
          rhizohDeliveryKind: "ok",
          replyFormatDriftScore: 0,
          rhizohCompressionLedger: { replyExtractPath: "json.reply" }
        },
        RHIZOH_REPLY_SCHEMA_V1
      )
    },
    {
      id: "probe_live_informative",
      source: "attachReplySchemaContractV1",
      mustPass: true,
      body: attachReplySchemaContractV1(
        {
          ok: true,
          reply: "Plain fallback",
          rhizohDeliveryKind: "unstructured_reply",
          replyFormatDriftScore: 0.5,
          rhizohCompressionLedger: { replyExtractPath: "plain_text_fallback" }
        },
        RHIZOH_REPLY_SCHEMA_V1
      )
    }
  ];

  const allSamples = [...samples, ...liveProbes];
  /** @type {string[]} */
  const failures = [];
  /** @type {Record<string, unknown>[]} */
  const results = [];

  for (const sample of allSamples) {
    const id = String(sample.id || "unknown");
    const mustPass = sample.mustPass !== false;
    const sim = simulateReplySchemaEvolutionV1(sample.body, enforceSchema);
    const row = {
      id,
      source: sample.source ?? "fixture",
      enforceSchema,
      wouldBreak: sim.wouldBreak,
      violations: [...sim.violations],
      mustPass
    };
    results.push(row);
    if (mustPass && sim.wouldBreak) {
      failures.push(`${id}: wouldBreak against ${enforceSchema} — ${sim.violations.join(", ")}`);
    }
  }

  /** @type {Record<string, unknown>[]} */
  const shadowResults = [];
  for (const shadow of Array.isArray(raw.shadowSimulations) ? raw.shadowSimulations : []) {
    const sourceSample = allSamples.find((s) => s.id === shadow.sourceSampleId);
    if (!sourceSample) {
      failures.push(`shadow:${shadow.id}: missing sourceSampleId ${shadow.sourceSampleId}`);
      continue;
    }
    const targetSchema = String(shadow.targetSchema || "");
    const sim = simulateReplySchemaEvolutionV1(sourceSample.body, targetSchema);
    const expectBreak = shadow.expectWouldBreak === true;
    const row = {
      id: String(shadow.id || "shadow"),
      targetSchema,
      wouldBreak: sim.wouldBreak,
      violations: [...sim.violations],
      expectWouldBreak: expectBreak,
      informational: !strictFuture
    };
    shadowResults.push(row);
    if (strictFuture && sim.wouldBreak) {
      failures.push(`shadow:${shadow.id}: future schema ${targetSchema} wouldBreak — ${sim.violations.join(", ")}`);
    }
    if (expectBreak !== sim.wouldBreak) {
      failures.push(
        `shadow:${shadow.id}: expected wouldBreak=${expectBreak} got ${sim.wouldBreak} for ${targetSchema}`
      );
    }
  }

  return Object.freeze({
    gate: "castle.rhizoh.reply_schema_simulation_gate.v1",
    enforceSchema,
    strictFuture,
    passed: failures.length === 0,
    failureCount: failures.length,
    failures: Object.freeze([...failures]),
    results: Object.freeze(results),
    shadowResults: Object.freeze(shadowResults)
  });
}

async function main() {
  const strictFuture = process.argv.includes("--strict-future");
  const payload = evaluateReplySchemaSimulationGateV1({ strictFuture });
  console.log(JSON.stringify(payload, null, 2));
  if (!payload.passed) {
    console.error("REPLY_SCHEMA_SIMULATION_GATE_FAIL");
    for (const f of payload.failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log("REPLY_SCHEMA_SIMULATION_GATE_OK");
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((err) => {
    console.error("REPLY_SCHEMA_SIMULATION_GATE_ERROR", err);
    process.exit(1);
  });
}
