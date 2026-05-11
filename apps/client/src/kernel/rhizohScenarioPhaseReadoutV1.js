/**
 * Scenario / phase readout for boot artifact provenance — observation only, not execution.
 * Provenance annotates the artifact; it must never change canonical `primary` semantics.
 * @see docs/BOOT_ARTIFACT_PROTOCOL.md
 */

/** @typedef {{ intensity: number, entropy: number, coherence: number }} RhizohFieldSnapshotV1 */

/** @typedef {"STABLE"|"CHAOS"|"BIFURCATION"|"UNKNOWN"} RhizohPhaseV1 */
/** @typedef {"RHIZOH"|"CASTLE"|"GHOST"|"UNKNOWN"} RhizohScenarioBandV1 */

const PHASES = new Set(["STABLE", "CHAOS", "BIFURCATION", "UNKNOWN"]);
const SCENARIOS = new Set(["RHIZOH", "CASTLE", "GHOST", "UNKNOWN"]);

/**
 * @param {object} input
 * @param {string} [input.realityState]
 * @param {string} [input.governanceState]
 * @param {string} [input.rhizohFieldState]
 * @param {number} [input.heatPeak]
 * @param {number} [input.activeEntityCount]
 * @param {boolean} [input.swarmActive]
 * @param {boolean} [input.mapSurfaceActive]
 * @returns {{ readoutVersion: "rhizoh-scenario-readout-v1", phase: RhizohPhaseV1, scenario: RhizohScenarioBandV1, fieldSnapshot: RhizohFieldSnapshotV1 }}
 */
export function computeRhizohScenarioPhaseReadout(input = {}) {
  const reality = String(input.realityState || "WORLD_STABLE").toUpperCase();
  const gov = String(input.governanceState || "NORMAL").toUpperCase();
  const field = String(input.rhizohFieldState || "IDLE").toUpperCase();
  const heat = Math.max(0, Number(input.heatPeak) || 0);
  const entities = Math.max(0, Number(input.activeEntityCount) || 0);
  const swarm = Boolean(input.swarmActive);
  const mapOn = Boolean(input.mapSurfaceActive);

  const entropyRaw =
    (gov === "FROZEN" ? 0.35 : 0) +
    (gov === "DEGRADED" ? 0.22 : 0) +
    (gov === "CRITICAL" ? 0.28 : 0) +
    (/TRANSITION|BROADCASTING|SIMULATING/.test(reality) ? 0.14 : 0) +
    (field !== "IDLE" ? 0.12 : 0) +
    Math.min(0.22, heat / 48);
  const entropy = Math.min(1, entropyRaw);

  const coherenceRaw =
    1 -
    (gov === "NORMAL" ? 0 : 0.12) -
    (reality === "WORLD_STABLE" ? 0 : 0.18) -
    (field !== "IDLE" ? 0.08 : 0) -
    (mapOn ? 0 : 0.02);
  const coherence = Math.max(0, Math.min(1, coherenceRaw));

  const intensity = entities * 0.085 + heat * 0.14 + (swarm ? 2.6 : 0) + (field !== "IDLE" ? 1.15 : 0) + (mapOn ? 0.4 : 0);

  let scenario = "RHIZOH";
  if (entropy > 0.65) scenario = "GHOST";
  else if (intensity > 7 && coherence > 0.4) scenario = "CASTLE";

  let phase = "STABLE";
  if (gov === "CRITICAL" || gov === "FROZEN" || field === "EXECUTING") phase = "CHAOS";
  else if (gov === "RECOVERY" || gov === "DEGRADED" || /TRANSITION|BROADCASTING/.test(reality)) phase = "BIFURCATION";

  const round3 = (x) => Math.round(x * 1000) / 1000;

  return {
    readoutVersion: "rhizoh-scenario-readout-v1",
    phase,
    scenario,
    fieldSnapshot: {
      intensity: round3(intensity),
      entropy: round3(entropy),
      coherence: round3(coherence)
    }
  };
}

/**
 * Full boot provenance for Attested Boot Observation Artifact.
 * `readoutDegraded: true` → explicit UNKNOWN (degraded / signals unavailable) — never blocks seal.
 * `driftState` is metadata only; it must not drive `primary` text (frozen-core boundary).
 *
 * @param {object} [input]
 * @param {boolean} [input.readoutDegraded]
 * @returns {{ readoutVersion: string, phase: RhizohPhaseV1, scenario: RhizohScenarioBandV1, fieldSnapshot: RhizohFieldSnapshotV1, driftState: null | "chaos_band" | "bifurcation_band", readoutDegraded: boolean }}
 */
export function buildBootObservationProvenance(input = {}) {
  if (input.readoutDegraded) {
    return {
      readoutVersion: "rhizoh-scenario-readout-v1",
      phase: "UNKNOWN",
      scenario: "UNKNOWN",
      fieldSnapshot: { intensity: 0, entropy: 0, coherence: 0 },
      driftState: null,
      readoutDegraded: true
    };
  }
  const r = computeRhizohScenarioPhaseReadout(input);
  const driftState =
    r.phase === "CHAOS" ? "chaos_band" : r.phase === "BIFURCATION" ? "bifurcation_band" : null;
  return {
    ...r,
    driftState,
    readoutDegraded: false
  };
}

/** @param {unknown} phase @returns {phase is RhizohPhaseV1} */
export function isCanonicalPhase(phase) {
  return typeof phase === "string" && PHASES.has(phase);
}

/** @param {unknown} scenario @returns {scenario is RhizohScenarioBandV1} */
export function isCanonicalScenario(scenario) {
  return typeof scenario === "string" && SCENARIOS.has(scenario);
}
