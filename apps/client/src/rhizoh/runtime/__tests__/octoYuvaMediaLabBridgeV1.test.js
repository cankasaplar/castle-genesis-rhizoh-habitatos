import { describe, expect, it, beforeEach } from "vitest";
import {
  OCTO_YUVA_EIGHT_CAMERA_LENSES_V1,
  dismissOctoLabToWorldMapV1,
  maybePublishOctoYuvaActivationV1,
  openOctoYuvaEightCameraLabV1,
  publishOctoPerformanceFeedV1,
  readOctoLabPerformanceIntensityV1,
  resetOctoYuvaLabBridgeForTestsV1,
  tickYoutubeLabOctoPerformanceFeedV1
} from "../octoYuvaMediaLabBridgeV1.js";
import { deriveOctoMotionDriveV1 } from "../../../studio/octoConversationMotionV1.js";

describe("octoYuvaMediaLabBridgeV1", () => {
  beforeEach(() => {
    resetOctoYuvaLabBridgeForTestsV1();
    if (typeof window !== "undefined") {
      window.__rhizoh = {};
    }
  });

  it("defines eight observation lenses including Cesium Ion and YouTube lab", () => {
    expect(OCTO_YUVA_EIGHT_CAMERA_LENSES_V1).toHaveLength(8);
    expect(OCTO_YUVA_EIGHT_CAMERA_LENSES_V1.some((l) => l.kind === "cesium_ion")).toBe(true);
    expect(OCTO_YUVA_EIGHT_CAMERA_LENSES_V1.some((l) => l.kind === "youtube_lab")).toBe(true);
    expect(OCTO_YUVA_EIGHT_CAMERA_LENSES_V1.some((l) => l.kind === "leaflet_satellite")).toBe(true);
    expect(OCTO_YUVA_EIGHT_CAMERA_LENSES_V1.some((l) => l.kind === "octo_fox_dual")).toBe(true);
    expect(OCTO_YUVA_EIGHT_CAMERA_LENSES_V1.every((l) => l.facing === "other")).toBe(true);
  });

  it("publishes yuva activation once and opens media tube", () => {
    const media = [];
    const activated = [];
    window.addEventListener("RHIZOH_OPEN_MEDIA_TUBE", (ev) => media.push(ev.detail));
    window.addEventListener("rhizoh:octo-yuva-activated-v1", (ev) => activated.push(ev.detail));

    const first = maybePublishOctoYuvaActivationV1({ activation: 0.6, live: true });
    const second = maybePublishOctoYuvaActivationV1({ activation: 0.9, live: true });

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(media).toHaveLength(1);
    expect(media[0].octoLabMode).toBe(true);
    expect(activated[0].lenses).toHaveLength(8);
  });

  it("feeds YouTube lab performance into Octo motion drive", async () => {
    const feed = await tickYoutubeLabOctoPerformanceFeedV1();
    publishOctoPerformanceFeedV1(feed);
    const intensity = readOctoLabPerformanceIntensityV1();
    expect(intensity).toBeGreaterThan(0);

    const idle = deriveOctoMotionDriveV1({ fieldState: "idle" });
    const boosted = deriveOctoMotionDriveV1({
      fieldState: "speaking",
      replyText: "lab",
      engagementProxy: intensity
    });
    expect(boosted.activation).toBeGreaterThan(idle.activation);
  });

  it("openOctoYuvaEightCameraLab arms lens registry on window", () => {
    openOctoYuvaEightCameraLabV1({ source: "test" });
    expect(window.__rhizoh.octoEightCameraLab.lenses).toHaveLength(8);
  });

  it("dismissOctoLabToWorldMapV1 clears lab state and emits dismiss event", () => {
    openOctoYuvaEightCameraLabV1({ source: "test" });
    const dismissed = [];
    window.addEventListener("rhizoh:octo-lab-dismiss-v1", (ev) => dismissed.push(ev.detail));
    expect(dismissOctoLabToWorldMapV1({ source: "test_dismiss" })).toBe(true);
    expect(window.__rhizoh.octoEightCameraLab).toBeUndefined();
    expect(dismissed).toHaveLength(1);
  });
});
