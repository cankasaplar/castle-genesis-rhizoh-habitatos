import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { getRhizohRealWorldAlignmentAssessment } from "../rhizohRealWorldAlignmentV1.js";

describe("rhizohRealWorldAlignmentV1", () => {
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
      location: { origin: "http://localhost:5173" }
    });
    globalThis.__RHIZOH_TEST_GATEWAY_HTTP__ = "http://localhost:8090/rhizoh/llm";
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    delete globalThis.__RHIZOH_TEST_GATEWAY_HTTP__;
    vi.unstubAllGlobals();
  });

  it("reports stable_subject_bucket when analystStableKey set", () => {
    const a = getRhizohRealWorldAlignmentAssessment({ analystStableKey: "user-stable-1" }, Date.now());
    expect(a.gaps?.B_cohortNotPopulation?.cohortModel).toBe("stable_subject_bucket");
  });

  it("reports session_id_bucket_proxy without stable key", () => {
    const a = getRhizohRealWorldAlignmentAssessment({}, Date.now());
    expect(a.gaps?.B_cohortNotPopulation?.cohortModel).toBe("session_id_bucket_proxy");
  });
});
