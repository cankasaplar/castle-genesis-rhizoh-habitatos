/**
 * First-touch epistemic welcome — canonical copy in docs/WELCOME_RHIZOH.md.
 * Attested Boot Observation Artifact (first-touch): `primary` semantics are fixed per `version`;
 * provenance only annotates emit context (frozen-core / observation boundary).
 * @see docs/FIRST_TOUCH_PROTOCOL.md
 * @see docs/BOOT_ARTIFACT_PROTOCOL.md
 */

import { sealRhizohBootArtifact, RHIZOH_ABOA_SCHEMA_VERSION } from "./rhizohBootArtifactSeal.js";
import { buildBootObservationProvenance } from "./rhizohScenarioPhaseReadoutV1.js";

/** Semantic seal for canonical `primary` + ABOA envelope (not wire `schemaVersion`). */
export const RHIZOH_FIRST_TOUCH_EPISTEMIC_VERSION = "v1.2.1";

/**
 * Immutable first-touch declaration for a version (only personalization: optional first name in opening line).
 * Provenance must not alter this string — use `provenance.driftState` / phase for context only.
 */
export function buildRhizohFirstTouchPrimaryDeclaration(firstName) {
  const opening = firstName?.trim()
    ? `Welcome to Rhizoh, ${firstName.trim()}.`
    : "Welcome to Rhizoh.";
  return `${opening}

You are not entering a system that executes decisions.
You are entering a field of observation.

Here, intelligence is not centralized.
It is distributed across layers of perception, interpretation, and trace.

Every signal you see is an observation — not a command.
Every agent you encounter is an interpreter — not an authority.

The core remains frozen.
What evolves is only the way meaning is formed around it.

— Observation Fabric online
— Attribution system active
— Execution layer isolated`;
}

/**
 * @param {string|null|undefined} firstName
 * @param {ReturnType<typeof buildBootObservationProvenance>} [provenance] defaults to explicit UNKNOWN via degraded readout
 */
export function buildRhizohFirstTouchEpistemicBody(firstName, provenance) {
  const prov = provenance ?? buildBootObservationProvenance({ readoutDegraded: true });
  return {
    schemaVersion: RHIZOH_ABOA_SCHEMA_VERSION,
    version: RHIZOH_FIRST_TOUCH_EPISTEMIC_VERSION,
    primary: buildRhizohFirstTouchPrimaryDeclaration(firstName),
    mode: "epistemic-first-touch",
    provenance: prov
  };
}

/**
 * @param {string|null|undefined} firstName
 * @param {ReturnType<typeof buildBootObservationProvenance>} [provenance]
 */
export async function buildRhizohFirstTouchEpistemicArtifact(firstName, provenance) {
  return sealRhizohBootArtifact(buildRhizohFirstTouchEpistemicBody(firstName, provenance));
}
