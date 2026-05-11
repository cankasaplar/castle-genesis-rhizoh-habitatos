import { describe, it, expect } from "vitest";
import {
  canonicalBootArtifactFingerprintSource,
  canonicalizeBootArtifactValue,
  sealRhizohBootArtifact,
  RHIZOH_ABOA_SCHEMA_VERSION
} from "./rhizohBootArtifactSeal.js";

describe("rhizohBootArtifactSeal", () => {
  it("canonicalBootArtifactFingerprintSource defaults provenance to UNKNOWN", () => {
    const s = canonicalBootArtifactFingerprintSource({
      schemaVersion: RHIZOH_ABOA_SCHEMA_VERSION,
      version: "v1.2.1",
      mode: "epistemic-first-touch",
      primary: "x"
    });
    expect(s).toContain("UNKNOWN");
    expect(s).toContain('"primary":"x"');
    expect(s).toContain('"schemaVersion":"ABOA-1"');
  });

  it("same fingerprint when object key order differs", async () => {
    const prov = {
      driftState: null,
      fieldSnapshot: { coherence: 0.8, entropy: 0.2, intensity: 1 },
      phase: "STABLE",
      readoutDegraded: false,
      readoutVersion: "rhizoh-scenario-readout-v1",
      scenario: "RHIZOH"
    };
    const a = {
      schemaVersion: "ABOA-1",
      version: "v1.2.1",
      mode: "epistemic-first-touch",
      primary: "hello",
      provenance: prov
    };
    const b = {
      primary: "hello",
      schemaVersion: "ABOA-1",
      version: "v1.2.1",
      mode: "epistemic-first-touch",
      provenance: {
        readoutVersion: "rhizoh-scenario-readout-v1",
        scenario: "RHIZOH",
        phase: "STABLE",
        readoutDegraded: false,
        driftState: null,
        fieldSnapshot: { intensity: 1, entropy: 0.2, coherence: 0.8 }
      }
    };
    expect(canonicalBootArtifactFingerprintSource(a)).toBe(canonicalBootArtifactFingerprintSource(b));
  });

  it("canonicalizeBootArtifactValue sorts nested keys", () => {
    const c = canonicalizeBootArtifactValue({ z: 1, a: { m: 2, b: 3 } });
    expect(JSON.stringify(c)).toBe(JSON.stringify({ a: { b: 3, m: 2 }, z: 1 }));
  });

  it("sealRhizohBootArtifact adds schemaVersion, fingerprint, emittedAt, normalizes provenance", async () => {
    const base = {
      schemaVersion: RHIZOH_ABOA_SCHEMA_VERSION,
      version: "v1.2.1",
      mode: "epistemic-first-touch",
      primary: "hello",
      provenance: {
        readoutVersion: "rhizoh-scenario-readout-v1",
        phase: "STABLE",
        scenario: "RHIZOH",
        fieldSnapshot: { intensity: 0, entropy: 0.1, coherence: 0.9 },
        driftState: null,
        readoutDegraded: false
      }
    };
    const sealed = await sealRhizohBootArtifact(base);
    expect(sealed.schemaVersion).toBe("ABOA-1");
    expect(sealed.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(typeof sealed.emittedAt).toBe("number");
    expect(sealed.provenance.phase).toBe("STABLE");
    expect(sealed.provenance.readoutDegraded).toBe(false);
  });
});
