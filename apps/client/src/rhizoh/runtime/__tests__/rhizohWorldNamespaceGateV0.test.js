import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isRhizohSpatialExecutionAllowedV0,
  isRhizohWorldDomainUiActiveV0,
  isRhizohWorldNamespaceCommitAllowedV0
} from "../rhizohWorldNamespaceGateV0.js";
import { publishIngressRouteV0 } from "../spatialSinkRoutePolicyV0.js";
import { markCastleAppEngineReadyV0 } from "../spatialSinkRoutePolicyV0.js";

describe("rhizohWorldNamespaceGateV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    delete window.__rhizoh_ingress_phase;
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    delete window.__rhizoh;
    delete window.__rhizoh_ingress_phase;
  });

  it("blocks spatial execution on ingress routes", () => {
    publishIngressRouteV0("legal_preamble");
    expect(isRhizohSpatialExecutionAllowedV0()).toBe(false);
    expect(isRhizohWorldNamespaceCommitAllowedV0()).toBe(false);
  });

  it("allows spatial execution on app route after legal", () => {
    publishIngressRouteV0("app");
    expect(isRhizohSpatialExecutionAllowedV0()).toBe(true);
  });

  it("world domain UI gate requires /world path", () => {
    publishIngressRouteV0("app");
    expect(isRhizohWorldDomainUiActiveV0()).toBe(false);
    window.history.replaceState({}, "", "/world/space");
    expect(isRhizohWorldDomainUiActiveV0()).toBe(true);
  });

  it("world commit requires world space + engine ready", () => {
    publishIngressRouteV0("app");
    window.history.replaceState({}, "", "/world/space");
    markCastleAppEngineReadyV0("test");
    expect(isRhizohWorldNamespaceCommitAllowedV0()).toBe(true);
  });
});
