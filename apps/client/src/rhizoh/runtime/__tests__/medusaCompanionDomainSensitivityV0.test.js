import { describe, expect, it } from "vitest";
import { resolveMedusaDomainMotionProfileV0 } from "../medusaCompanionDomainSensitivityV0.js";
import { RHIZOH_FEDERATION_NODE_V0 } from "../rhizohDomainGraphV0.js";

describe("medusaCompanionDomainSensitivityV0", () => {
  it("media overlay has higher sway than observer", () => {
    const media = resolveMedusaDomainMotionProfileV0(RHIZOH_FEDERATION_NODE_V0.MEDIA);
    const observer = resolveMedusaDomainMotionProfileV0(RHIZOH_FEDERATION_NODE_V0.OBSERVER);
    expect(media.swayScale).toBeGreaterThan(observer.swayScale);
  });
});
