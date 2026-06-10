import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  __reconcileEnvelopesBeforePushForTestV1_9,
  __resetPhysicsFirebaseAdapterForTestV1_9,
  createPhysicsFirebaseAdapterV1_9,
  installPhysicsFirebaseCloudAdapterV1_9
} from "../castlePhysicsFirebaseAdapterV1_9.js";
import { __resetPhysicsLifecycleCloudForTestV1_9 } from "../castlePhysicsLifecycleCloudV1_9.js";
import {
  __resetStabilityMemoryGraphForTestV1_7,
  getDefaultPhysicsProfileV1_7,
  MODALITY_V1_7,
  observeStabilityMemoryV1_7
} from "../castleStabilityMemoryGraphV1_7.js";
import { buildPhysicsLifecycleEnvelopeV1_9 } from "../castlePhysicsLifecycleCloudV1_9.js";

describe("castlePhysicsFirebaseAdapterV1_9", () => {
  beforeEach(() => {
    __resetPhysicsFirebaseAdapterForTestV1_9();
    __resetPhysicsLifecycleCloudForTestV1_9();
    __resetStabilityMemoryGraphForTestV1_7();
  });

  it("push merges remote envelope before firestore write — cloud not truth", async () => {
    observeStabilityMemoryV1_7("uid_a", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true
    });
    const localEnvelope = buildPhysicsLifecycleEnvelopeV1_9("uid_a", 1100);

    const remoteProfile = {
      ...getDefaultPhysicsProfileV1_7("uid_a"),
      observationCount: 8,
      modalityBiasGraph: Object.freeze({
        ...getDefaultPhysicsProfileV1_7("uid_a").modalityBiasGraph,
        [MODALITY_V1_7.CO_WATCH]: Object.freeze({
          focusBias: 0.9,
          speechPriority: 0.88,
          memoryPriority: 0.5,
          phaseIndex: 0.1
        })
      })
    };

    const setDoc = vi.fn(async () => {});
    const getDoc = vi.fn(async () => ({
      exists: () => true,
      data: () => ({
        physicsLifecycleV1_9: {
          physicsProfile: remoteProfile,
          learningTrace: [],
          checksum: "chk_remote",
          deviceId: "dev_remote"
        }
      })
    }));

    const adapter = createPhysicsFirebaseAdapterV1_9({
      getUid: () => "uid_a",
      createRef: (uid) => ({ path: `rhizoh_client_sync/${uid}` }),
      getDocFn: getDoc,
      setDocFn: setDoc
    });

    const result = await adapter.push(localEnvelope);
    expect(result.pushed).toBe(true);
    expect(result.cloudIsTruthSource).toBe(false);
    expect(setDoc).toHaveBeenCalled();
    const written = setDoc.mock.calls[0][1];
    expect(written.productSurface).toBe("castle");
    expect(written.physicsSyncMeta.cloudIsTruthSource).toBe(false);
  });

  it("install registers adapter when uid present", () => {
    const registered = [];
    const result = installPhysicsFirebaseCloudAdapterV1_9({
      force: true,
      registerAdapter: (a) => registered.push(a),
      getUid: () => "firebase_uid_1"
    });
    expect(result.installed).toBe(true);
    expect(registered.length).toBe(1);
    expect(registered[0].cloudIsTruthSource).toBe(false);
  });

  it("reconcileEnvelopesBeforePush produces merged profile between devices", () => {
    observeStabilityMemoryV1_7("u", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true
    });
    const local = buildPhysicsLifecycleEnvelopeV1_9("u", 1000);
    const remote = {
      physicsProfile: {
        ...getDefaultPhysicsProfileV1_7("u"),
        observationCount: 10,
        modalityBiasGraph: getDefaultPhysicsProfileV1_7("u").modalityBiasGraph
      },
      learningTrace: [],
      checksum: "other"
    };
    const merged = __reconcileEnvelopesBeforePushForTestV1_9(local, remote, 2000);
    expect(merged.cloudIsTruthSource).toBe(false);
    expect(merged.physicsProfile.observationCount).toBeGreaterThanOrEqual(1);
  });
});
