import { sha256HexUtf8 } from "../rhizoh/epistemic/gatewaySealV529.js";
import { isCanonicalPhase, isCanonicalScenario } from "./rhizohScenarioPhaseReadoutV1.js";

/** Artifact family / wire shape — evolves independently of semantic `version` (e.g. ABOA-2, attribution boot). */
export const RHIZOH_ABOA_SCHEMA_VERSION = "ABOA-1";

/**
 * Deterministic value normalization for replay-safe seals (sorted keys, stable numbers).
 * @param {unknown} value
 * @returns {unknown}
 */
export function canonicalizeBootArtifactValue(value) {
  if (value === null) return null;
  if (value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 1000) / 1000;
  }
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((x) => canonicalizeBootArtifactValue(x));
  if (typeof value === "object") {
    const keys = Object.keys(/** @type {Record<string, unknown>} */ (value)).sort();
    const out = {};
    for (const k of keys) {
      out[k] = canonicalizeBootArtifactValue(/** @type {Record<string, unknown>} */ (value)[k]);
    }
    return out;
  }
  return String(value);
}

/**
 * Normalize provenance for fingerprinting; missing → explicit UNKNOWN (never throws).
 * @param {unknown} raw
 */
export function normalizeProvenanceForBootFingerprint(raw) {
  const p = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const phase = isCanonicalPhase(p.phase) ? p.phase : "UNKNOWN";
  const scenario = isCanonicalScenario(p.scenario) ? p.scenario : "UNKNOWN";
  const rv = typeof p.readoutVersion === "string" && p.readoutVersion ? p.readoutVersion : "rhizoh-scenario-readout-v1";
  const fs = p.fieldSnapshot && typeof p.fieldSnapshot === "object" ? p.fieldSnapshot : {};
  const intensity = canonicalizeBootArtifactValue(Number(fs.intensity) || 0);
  const entropy = canonicalizeBootArtifactValue(Number(fs.entropy) || 0);
  const coherence = canonicalizeBootArtifactValue(Number(fs.coherence) || 0);
  let driftState = p.driftState;
  if (driftState !== null && driftState !== "chaos_band" && driftState !== "bifurcation_band") {
    driftState = null;
  }
  const readoutDegraded = p.readoutDegraded === true;
  return {
    driftState,
    fieldSnapshot: {
      coherence,
      entropy,
      intensity
    },
    phase,
    readoutDegraded,
    readoutVersion: rv,
    scenario
  };
}

/**
 * Canonical payload for SHA-256 (excludes emittedAt, fingerprint).
 * Key order fixed by canonicalizeBootArtifactValue (sorted keys at each object).
 */
export function canonicalBootArtifactFingerprintSource(base) {
  const schemaVersion =
    typeof base.schemaVersion === "string" && base.schemaVersion ? base.schemaVersion : RHIZOH_ABOA_SCHEMA_VERSION;
  const payload = canonicalizeBootArtifactValue({
    mode: base.mode,
    primary: base.primary,
    provenance: normalizeProvenanceForBootFingerprint(base.provenance),
    schemaVersion,
    version: base.version
  });
  return JSON.stringify(payload);
}

/**
 * Attested Boot Observation Artifact seal — not execution authority.
 * @see docs/BOOT_ARTIFACT_PROTOCOL.md
 *
 * @param {{ version: string, mode: string, primary: string, schemaVersion?: string, provenance?: object } & Record<string, unknown>} base
 * @returns {Promise<typeof base & { schemaVersion: string, fingerprint: string, emittedAt: number, provenance: ReturnType<typeof normalizeProvenanceForBootFingerprint> }>}
 */
export async function sealRhizohBootArtifact(base) {
  const emittedAt = Date.now();
  const schemaVersion =
    typeof base.schemaVersion === "string" && base.schemaVersion ? base.schemaVersion : RHIZOH_ABOA_SCHEMA_VERSION;
  const provenance = normalizeProvenanceForBootFingerprint(base.provenance);
  const fingerprint = await sha256HexUtf8(
    canonicalBootArtifactFingerprintSource({ ...base, schemaVersion, provenance })
  );
  return { ...base, schemaVersion, provenance, fingerprint, emittedAt };
}
