import { describe, it, expect, beforeEach } from "vitest";
import { lightActuatorV0 } from "../lightActuatorV0.js";
import {
  canonicalLightToHueBridgePayloadV0,
  kelvinToHueCtMiredV0,
  validateDumbLightProjectionForHueV0
} from "../hueAdapterV0.js";
import { buildPhysicalAckEnvelopeV0, normalizeHueAckEnvelopeV0, PHYSICAL_ACK_SCHEMA_VERSION_V0 } from "../physicalAckEnvelopeV0.js";
import { verifyPhysicalParityV0, hueDeviceStateToMirrorLightV0 } from "../physicalParityVerifierV0.js";
import { projectSubstrateFromNestedExecutionResultV0 } from "../canonicalMirrorPipelineV0.js";
import {
  appendDeviceAckEntryV0,
  clearDeviceAckLogForTestsV0,
  getDeviceAckSnapshotV0,
  tryDispatchPhysicalAckV0
} from "../deviceAckLogV0.js";
import { PHYSICAL_DRIFT_DETECTED, DRIFT_SCOPE } from "../driftNamespaceV0.js";
import { assertPhysicalAckSinkAllowedV0, PHYSICAL_FEEDBACK_CONSTITUTION_V0 } from "../physicalFeedbackBarrierV0.js";
import { assertForwardExecutionAuthorityV0, EXECUTION_LAYER, EXECUTION_AUTHORITY_LAW_V0 } from "../executionAuthorityBoundaryV0.js";

describe("PR-3.3-A hueAdapterV0", () => {
  it("maps actuator output to Hue PUT body (on + bri + ct)", () => {
    const light = lightActuatorV0.apply({
      namespace: "LIGHT_ACTUATOR",
      brightness: 0.5,
      temperature: 4000,
      transition: 400
    });
    const p = canonicalLightToHueBridgePayloadV0(light, { lightId: "2" });
    expect(p).not.toBeNull();
    expect(p.method).toBe("PUT");
    expect(p.path).toContain("/lights/2/state");
    expect(p.body.on).toBe(true);
    expect(p.body.bri).toBeGreaterThan(120);
    expect(p.body.ct).toBe(kelvinToHueCtMiredV0(4000));
  });

  it("off when brightness ~0", () => {
    const light = lightActuatorV0.apply({ brightness: 0, temperature: 3000 });
    const p = canonicalLightToHueBridgePayloadV0(light);
    expect(p).not.toBeNull();
    expect(p.body.on).toBe(false);
  });
  it("rejects non-dumb keys (epistemic leakage guard)", () => {
    expect(validateDumbLightProjectionForHueV0({ brightness: 0.5, driftBloom: 0.2 }).ok).toBe(false);
    expect(canonicalLightToHueBridgePayloadV0({ brightness: 0.5, driftBloom: 0.2 })).toBeNull();
  });
});

describe("PR-3.3-A physicalAckEnvelopeV0", () => {
  it("normalizeHueAckEnvelopeV0 sets acknowledged from success array", () => {
    const ack = normalizeHueAckEnvelopeV0({
      executionId: "ex-1",
      commandHash: "habc",
      receivedAt: 555,
      bridgeResponse: { success: ["/lights/1/state"] }
    });
    expect(ack.acknowledged).toBe(true);
    expect(ack.actuator).toBe("HUE");
    expect(ack.commandHash).toBe("habc");
    expect(ack.ackSchemaVersion).toBe(PHYSICAL_ACK_SCHEMA_VERSION_V0);
  });
});

describe("PR-3.3-B physicalParityVerifierV0", () => {
  it("matches virtual box to Hue device state within tolerance", () => {
    const vb = projectSubstrateFromNestedExecutionResultV0(
      { light: { color: "#ffffff", brightness: 0.5, temp: 4000 } },
      1
    );
    expect(vb.ok).toBe(true);
    const ct = kelvinToHueCtMiredV0(4000);
    const ack = buildPhysicalAckEnvelopeV0({
      executionId: "ex",
      actuator: "HUE",
      acknowledged: true,
      receivedAt: 1,
      commandHash: "hx",
      deviceState: {
        hueLightState: { on: true, bri: 127, ct }
      }
    });
    if (vb.ok) {
      const r = verifyPhysicalParityV0({ virtualBox: vb.box, ackEnvelope: ack });
      expect(r.ok).toBe(true);
      expect(r.scope).toBe(DRIFT_SCOPE.PHYSICAL);
    }
  });

  it("detects PHYSICAL_DRIFT_DETECTED on brightness mismatch", () => {
    const vb = projectSubstrateFromNestedExecutionResultV0(
      { light: { color: "#ffffff", brightness: 0.9, temp: 4000 } },
      1
    );
    expect(vb.ok).toBe(true);
    const ct = kelvinToHueCtMiredV0(4000);
    const ack = buildPhysicalAckEnvelopeV0({
      executionId: "ex",
      actuator: "HUE",
      acknowledged: true,
      receivedAt: 1,
      commandHash: "hx",
      deviceState: { hueLightState: { on: true, bri: 50, ct } }
    });
    if (vb.ok) {
      const r = verifyPhysicalParityV0({ virtualBox: vb.box, ackEnvelope: ack });
      expect(r.ok).toBe(false);
      expect(r.code).toBe(PHYSICAL_DRIFT_DETECTED);
    }
  });

  it("hueDeviceStateToMirrorLightV0 maps bri and ct", () => {
    const ml = hueDeviceStateToMirrorLightV0({ on: true, bri: 254, ct: 200 });
    expect(ml?.brightness).toBeCloseTo(1, 5);
    expect(ml?.temp).toBeGreaterThan(1000);
  });
});

describe("PR-3.3 deviceAckLogV0", () => {
  beforeEach(() => {
    clearDeviceAckLogForTestsV0();
  });

  it("append + snapshot isolates ACK trail", () => {
    appendDeviceAckEntryV0(
      buildPhysicalAckEnvelopeV0({
        executionId: "a",
        actuator: "HUE",
        acknowledged: true,
        receivedAt: 1,
        deviceState: {},
        commandHash: "h"
      })
    );
    const snap = getDeviceAckSnapshotV0();
    expect(snap.length).toBe(1);
    expect(snap[0].executionId).toBe("a");
    expect(snap[0].ackSchemaVersion).toBe(1);
  });
});

describe("PR-3.3 physicalFeedbackBarrierV0", () => {
  it("constitution string is stable", () => {
    expect(PHYSICAL_FEEDBACK_CONSTITUTION_V0).toContain("cannot mutate epistemic");
  });

  it("rejects forbidden and unknown sinks", () => {
    expect(assertPhysicalAckSinkAllowedV0("uiStore").ok).toBe(false);
    expect(assertPhysicalAckSinkAllowedV0("worldPresence").ok).toBe(false);
    expect(assertPhysicalAckSinkAllowedV0("device_ack_log").ok).toBe(true);
  });
});

describe("PR-3.3 executionAuthorityBoundaryV0", () => {
  it("law string documents forward-only authority", () => {
    expect(EXECUTION_AUTHORITY_LAW_V0).toContain("may not drive canonical");
  });

  it("rejects actuator driving canonical or epistemic layers", () => {
    expect(
      assertForwardExecutionAuthorityV0(EXECUTION_LAYER.ACTUATOR, EXECUTION_LAYER.CANONICAL_EXECUTION).ok
    ).toBe(false);
    expect(
      assertForwardExecutionAuthorityV0(EXECUTION_LAYER.ACTUATOR, EXECUTION_LAYER.EPISTEMIC).ok
    ).toBe(false);
    expect(assertForwardExecutionAuthorityV0(EXECUTION_LAYER.CANONICAL_EXECUTION, EXECUTION_LAYER.ACTUATOR).ok).toBe(
      true
    );
  });
});

describe("PR-3.3 tryDispatchPhysicalAckV0", () => {
  beforeEach(() => clearDeviceAckLogForTestsV0());

  it("refuses uiStore sink", () => {
    const entry = buildPhysicalAckEnvelopeV0({
      executionId: "x",
      actuator: "HUE",
      acknowledged: true,
      receivedAt: 1,
      deviceState: {},
      commandHash: "h"
    });
    const r = tryDispatchPhysicalAckV0(entry, "uiStore");
    expect(r.ok).toBe(false);
    expect(getDeviceAckSnapshotV0().length).toBe(0);
  });
});
