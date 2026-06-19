import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  normalizeCastleArchiveMediaMetaV0,
  CASTLE_MEDIA_EVENT_STATE_V0,
  CASTLE_MEDIA_FREQUENCY_BAND_V0
} from "../castleArchiveMediaMetaV0.js";
import {
  parseYoutubeCommunityLabSnapshotV0,
  ingestYoutubeCommunityLabV0
} from "../youtubeCommunityDataAdapterV0.js";
import {
  readCityMapLegalGateSnapshotV0,
  primeCityMapLegalCountdownSurfaceV0,
  resetCityMapLegalGateForTestsV0
} from "../cityMapLegalCountdownMediaGateV0.js";
import { RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1 } from "../sovereignWorldMapNodesV0.js";

vi.mock("../../ingress/ingress_router.js", () => ({
  hasLegalAccessAckV0: () => false,
  resolveIngressRouteV0: () =>
    Object.freeze({
      route: "legal_preamble",
      required: true,
      acked: false
    })
}));

vi.mock("./rhizohNeonCountdownV0.js", () => ({
  readRhizohNeonCountdownDeadlineMsV0: () => Date.now() + 120_000,
  resolveRhizohNeonCountdownRemainingMsV0: () => 90_000
}));

describe("castleArchiveMediaMetaV0", () => {
  it("normalizes frequency, event state, and content kind", () => {
    const meta = normalizeCastleArchiveMediaMetaV0({
      frequencyBand: "bass",
      eventState: "manifesto",
      contentKind: "music",
      youtubeChannelId: "UC_test",
      communityId: "comm_1"
    });
    expect(meta.frequencyBand).toBe(CASTLE_MEDIA_FREQUENCY_BAND_V0.BASS);
    expect(meta.eventState).toBe(CASTLE_MEDIA_EVENT_STATE_V0.MANIFESTO);
    expect(meta.youtubeChannelId).toBe("UC_test");
    expect(meta.communityId).toBe("comm_1");
  });
});

describe("youtubeCommunityDataAdapterV0", () => {
  it("parses community, vote, manifesto, and protest rows", () => {
    const lab = parseYoutubeCommunityLabSnapshotV0({
      channelId: "UC_castle",
      communities: [{ id: "c1", title: "Community post" }],
      votes: [{ id: "v1", title: "Poll", voteCount: 42 }],
      manifestos: [{ id: "m1", title: "Manifesto draft" }],
      protests: [{ id: "p1", title: "Street signal" }]
    });
    expect(lab.ok).toBe(true);
    expect(lab.communities).toHaveLength(1);
    expect(lab.votes[0].voteCount).toBe(42);
    expect(lab.manifestos[0].contentKind).toBe("manifesto");
    expect(lab.protests[0].eventState).toBe("protest");
  });

  it("ingests via fetch and publishes to window", async () => {
    window.__rhizoh = {};
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        channelId: "UC_lab",
        communities: [{ id: "c2", title: "Live chat thread" }]
      })
    });
    const lab = await ingestYoutubeCommunityLabV0({
      baseUrl: "https://bridge.example",
      fetchImpl
    });
    expect(fetchImpl).toHaveBeenCalled();
    expect(lab.ok).toBe(true);
    expect(window.__rhizoh.youtubeCommunityLab.communities).toHaveLength(1);
  });
});

describe("cityMapLegalCountdownMediaGateV0", () => {
  beforeEach(() => {
    resetCityMapLegalGateForTestsV0();
    window.__rhizoh = {};
  });

  it("reports legal hold snapshot", () => {
    const snap = readCityMapLegalGateSnapshotV0();
    expect(snap.legalHold).toBe(true);
    expect(snap.countdownRemainingMs).toBeGreaterThan(0);
    expect(snap.eventState).toBe("countdown");
  });

  it("primes city_map and media tube on legal hold", () => {
    const mediaEvents = [];
    window.addEventListener(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, (ev) => mediaEvents.push(ev.detail));
    expect(primeCityMapLegalCountdownSurfaceV0({ uiLocale: "tr" })).toBe(true);
    expect(mediaEvents).toHaveLength(1);
    expect(mediaEvents[0].legalGate).toBe(true);
    expect(mediaEvents[0].initialChannelId).toBe("castle_genesis");
  });
});
