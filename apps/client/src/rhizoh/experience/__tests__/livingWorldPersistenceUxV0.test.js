import { describe, it, expect, beforeEach } from "vitest";
import {
  openLivingWorldBrowserSessionV0,
  touchLivingWorldPersistenceTickV0,
  buildLivingWorldPersistenceCopyV0,
  readLivingWorldPersistenceV0,
  clearLivingWorldPersistenceForTestV0,
  clearBrowserSessionActiveForTestV0,
  formatRelativeVisitTrV0
} from "../livingWorldPersistenceUxV0.js";
import { deriveCollectivePresenceFeelingV0 } from "../livingWorldCollectivePulseV0.js";

describe("livingWorldPersistenceUxV0", () => {
  const WI = "wi_test_persist";

  beforeEach(() => {
    clearLivingWorldPersistenceForTestV0();
    clearBrowserSessionActiveForTestV0(WI);
  });

  it("open session increments visit once; ticks do not inflate", () => {
    const a = openLivingWorldBrowserSessionV0({ worldInstanceId: WI });
    expect(a.opened).toBe(true);
    expect(a.visitCount).toBe(1);

    touchLivingWorldPersistenceTickV0({
      worldInstanceId: WI,
      weatherType: "clear",
      atmosphereLead: "öğle — açık"
    });
    touchLivingWorldPersistenceTickV0({
      worldInstanceId: WI,
      weatherType: "rain",
      atmosphereLead: "akşam — yağmur"
    });

    const stored = readLivingWorldPersistenceV0(WI);
    expect(stored?.visitCount).toBe(1);
    expect(stored?.lastWeatherType).toBe("rain");
  });

  it("buildLivingWorldPersistenceCopyV0 surfaces welcome and yesterday", () => {
    openLivingWorldBrowserSessionV0({ worldInstanceId: WI });
    const touch = touchLivingWorldPersistenceTickV0({
      worldInstanceId: WI,
      atmosphereLead: "sabah — bulutlu",
      weatherType: "clouds"
    });
    const copy = buildLivingWorldPersistenceCopyV0(readLivingWorldPersistenceV0(WI), touch, {
      atmosphereLead: "sabah — bulutlu",
      worldEcho: "wi_test",
      weatherType: "clouds",
      timeZone: "Europe/Istanbul"
    });
    expect(copy.welcomeHeadline).toBeTruthy();
    expect(copy.yesterdayLine.length).toBeGreaterThan(0);
    expect(copy.worldNowLine).toContain("sabah");
  });

  it("formatRelativeVisitTrV0 handles recent gap", () => {
    expect(formatRelativeVisitTrV0(Date.now() - 120_000)).toMatch(/dk/);
  });
});

describe("livingWorldCollectivePulseV0", () => {
  it("deriveCollectivePresenceFeelingV0 is emotional only (no digits)", () => {
    const a = deriveCollectivePresenceFeelingV0("wi_x", { returning: true });
    const b = deriveCollectivePresenceFeelingV0("wi_x", { returning: true });
    expect(a.readOnly).toBe(true);
    expect(a.primary).toBe(b.primary);
    expect(a.primary).not.toMatch(/\d/);
  });
});
