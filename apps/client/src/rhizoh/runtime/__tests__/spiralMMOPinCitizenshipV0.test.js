import { describe, expect, it, beforeEach } from "vitest";
import {
  SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0,
  SPIRAL_MMO_SIX_FORTY_FOUR_BASE_SEC_V0,
  deriveSpiralMMOPinSixFortyFourMotionV0,
  formatSpiralMMOPinCitizenshipRemainingV0,
  listSpiralMMOPinCitizenshipSnapshotsV0,
  resolveSpiralMMOPinCitizenshipV0,
  __resetSpiralMMOPinCitizenshipForTestV0
} from "../spiralMMOPinCitizenshipV0.js";
import { RHIZOH_SPIRAL_MMO_BOOTSTRAP_PIN_V0 } from "../spiralMMOContinentPinsV0.js";

describe("spiralMMOPinCitizenshipV0", () => {
  beforeEach(() => {
    __resetSpiralMMOPinCitizenshipForTestV0();
  });

  it("defines 6+44 tier durations at hour/day/month/year scales", () => {
    expect(SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0.hour).toBe((6 * 3600 + 44 * 60) * 1000);
    expect(SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0.day).toBe((6 * 86400 + 44 * 60) * 1000);
    expect(SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0.month).toBeGreaterThan(
      SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0.day
    );
    expect(SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0.year).toBeGreaterThan(
      SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0.month
    );
  });

  it("assigns unique 6.44 motion cycles per pin ordinal", () => {
    const bootstrap = deriveSpiralMMOPinSixFortyFourMotionV0(RHIZOH_SPIRAL_MMO_BOOTSTRAP_PIN_V0);
    const europe = deriveSpiralMMOPinSixFortyFourMotionV0({ id: "spiralmmo_europe", continent: "europe" });
    expect(bootstrap.cycleSec).toBeGreaterThanOrEqual(SPIRAL_MMO_SIX_FORTY_FOUR_BASE_SEC_V0);
    expect(europe.cycleSec).not.toBe(bootstrap.cycleSec);
    expect(bootstrap.ringDefs).toHaveLength(3);
    expect(bootstrap.ringDefs[0].dur).toMatch(/s$/);
  });

  it("resolves per-pin citizenship countdown from session anchor", () => {
    const now = Date.UTC(2026, 5, 19, 12, 0, 0);
    const snap = resolveSpiralMMOPinCitizenshipV0(RHIZOH_SPIRAL_MMO_BOOTSTRAP_PIN_V0, now);
    expect(snap.citizenshipRequired).toBe(true);
    expect(snap.birdsExempt).toBe(true);
    expect(snap.activeTierId).toBe("hour");
    expect(snap.activeRemainingMs).toBe(SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0.hour);
    expect(snap.tiers).toHaveLength(4);
    expect(formatSpiralMMOPinCitizenshipRemainingV0(snap.activeRemainingMs, "hour")).toMatch(/6h 44m/);
  });

  it("lists citizenship for all spiral map pins", () => {
    const rows = listSpiralMMOPinCitizenshipSnapshotsV0();
    expect(rows.length).toBeGreaterThanOrEqual(8);
    expect(rows.every((r) => r.motion?.cycleSec > 0)).toBe(true);
  });
});
