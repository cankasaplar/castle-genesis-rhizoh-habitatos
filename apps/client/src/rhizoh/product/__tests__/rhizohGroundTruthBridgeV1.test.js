import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  normalizeRhizohOutcomeAggregateRows,
  getRhizohGroundTruthBridgeMvpHintSync
} from "../rhizohGroundTruthBridgeV1.js";
import { getRhizohGroundingPostureSnapshot } from "../rhizohGroundingPostureV1.js";
import {
  computeRhizohDecisionOverlayFingerprint,
  runRhizohRetrospectiveReplayHook
} from "../rhizohDecisionEffectivenessV1.js";
import {
  createEmptyRhizohProductPolicyState,
  saveRhizohProductPolicyState,
  loadRhizohProductPolicyState
} from "../rhizohProductPolicyStoreV1.js";

describe("rhizohGroundTruthBridgeV1", () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => {
          store[k] = String(v);
        },
        removeItem: (k) => {
          delete store[k];
        },
        clear: () => {
          for (const pk of Object.keys(store)) delete store[pk];
        }
      }
    );
    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
      location: { origin: "http://localhost:5173" },
      dispatchEvent: () => true
    });
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes aggregate GET payload", () => {
    const rows = normalizeRhizohOutcomeAggregateRows({
      schemaVersion: "1.1.0",
      rows: [
        {
          cohortId: "c1",
          decisionFingerprint: "fp_a",
          outcomeRate: 0.35,
          sampleN: 10,
          updatedAt: 100,
          sumTrustWeight: 9.5,
          sumWeightedScore01: 3.5
        }
      ]
    });
    expect(rows?.length).toBe(1);
    expect(rows?.[0].outcomeRate).toBe(0.35);
    expect(rows?.[0].sampleN).toBe(10);
  });

  it("replay hook rolls back when population outcome contradicts supporting verdict", () => {
    const overlay = {
      rationale: ["closure_timeout"],
      ux: { closureBannerMs: 12000 },
      phaseTuning: {},
      capabilityGates: {}
    };
    const fp = computeRhizohDecisionOverlayFingerprint(overlay);
    expect(fp.length).toBeGreaterThan(4);

    const st = createEmptyRhizohProductPolicyState();
    st.patch.ux = { closureBannerMs: 12000 };
    saveRhizohProductPolicyState(st);

    const eff = {
      episodes: [
        {
          id: "ep-replay-1",
          recordedAt: Date.now() - 1000,
          fingerprint: fp,
          rationale: overlay.rationale,
          ux: overlay.ux,
          phaseTuning: overlay.phaseTuning,
          capabilityGates: overlay.capabilityGates,
          baselineRollup: {},
          baselineDerived: {},
          outcome: {
            evaluatedAt: Date.now(),
            scores: [
              {
                tag: "closure_timeout",
                dimension: "closure_engagement",
                verdict: "supporting",
                score01: 0.72
              }
            ]
          }
        }
      ],
      lastFp: fp
    };
    globalThis.localStorage.setItem("rhizoh.decision.effectiveness.v1", JSON.stringify(eff));

    const now = Date.now();
    globalThis.localStorage.setItem(
      "rhizoh.grounding.outcome_aggregates.cache.v1",
      JSON.stringify({
        schemaVersion: "1.0.0",
        cachedAtMs: now,
        cohortId: "default",
        rows: [
          {
            cohortId: "default",
            decisionFingerprint: fp,
            outcomeRate: 0.28,
            sampleN: 8,
            updatedAt: now
          }
        ]
      })
    );

    const applied = runRhizohRetrospectiveReplayHook({ minSampleN: 5, maxOutcomeRate: 0.42 });
    expect(applied.length).toBe(1);
    expect(applied[0].episodeId).toBe("ep-replay-1");

    const next = loadRhizohProductPolicyState();
    expect(next.patch.ux?.closureBannerMs).toBeUndefined();

    const eff2 = JSON.parse(globalThis.localStorage.getItem("rhizoh.decision.effectiveness.v1"));
    const ep = eff2.episodes.find((e) => e.id === "ep-replay-1");
    expect(ep.outcome.retrospectiveReplay?.appliedAtMs).toBeTruthy();
  });

  it("posture hints Mode B when aggregate cache is fresh", () => {
    const now = Date.now();
    globalThis.localStorage.setItem(
      "rhizoh.grounding.outcome_aggregates.cache.v1",
      JSON.stringify({
        schemaVersion: "1.1.0",
        cachedAtMs: now,
        cohortId: "default",
        rows: [{ cohortId: "default", decisionFingerprint: "x", outcomeRate: 0.5, sampleN: 3, updatedAt: now }]
      })
    );
    const hint = getRhizohGroundTruthBridgeMvpHintSync();
    expect(hint.groundedLearningMode).toBe(true);
    const snap = getRhizohGroundingPostureSnapshot(now);
    expect(snap.groundTruthBridge?.groundedLearningMode).toBe(true);
    expect(String(snap.modes.current)).toContain("Mode B");
    expect(snap.populationTruth?.mode).toBe("embedded_cohort");
  });
});
