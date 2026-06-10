import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  resolveFoxFirstContactDeploymentV1,
  shouldFoxCalibrationPersistWriteV1,
  resolveFoxProactiveHardCapPerHourV1,
  resolveFoxProactiveEffectiveCooldownMinutesV1,
  pinFoxFirstContactAnchorUserV1,
  FOX_FIRST_CONTACT_COHORT_V1,
  __resetFoxFirstContactDeploymentForTestV1
} from "../foxProactiveDeploymentGateV1.js";
import {
  recordFoxProactiveOutcomeFeedbackV1,
  __resetFoxProactiveAdaptationForTestV1
} from "../foxProactiveAdaptationV1.js";
import {
  persistFoxProactiveCalibrationDiskV1,
  hydrateFoxProactiveCalibrationDiskV1,
  __clearFoxProactiveCalibrationDiskForTestV1
} from "../foxProactiveCalibrationPersistV1.js";
import { getFoxProactiveBudgetSnapshotV1 } from "../foxProactiveChannelV1.js";

describe("foxProactiveDeploymentGateV1", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetFoxFirstContactDeploymentForTestV1();
  });

  it("defines single anchor cohort", () => {
    expect(FOX_FIRST_CONTACT_COHORT_V1).toHaveLength(1);
    expect(FOX_FIRST_CONTACT_COHORT_V1[0].id).toBe("rhizoh_primary_tester_01");
  });

  it("phase 0 enables observe mode without calibration persist", () => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "0");
    const deploy = resolveFoxFirstContactDeploymentV1();
    expect(deploy.active).toBe(true);
    expect(deploy.phase).toBe("phase_0_self");
    expect(deploy.calibrationPersistWrite).toBe(false);
    expect(shouldFoxCalibrationPersistWriteV1()).toBe(false);
    expect(deploy.proactiveHardCapPerHour).toBe(1);
  });

  it("phase 1 requires anchor user pin", () => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "1");
    expect(resolveFoxFirstContactDeploymentV1().active).toBe(false);

    pinFoxFirstContactAnchorUserV1(true);
    const deploy = resolveFoxFirstContactDeploymentV1();
    expect(deploy.active).toBe(true);
    expect(deploy.phase).toBe("phase_1_cohort");
    expect(deploy.calibrationPersistWrite).toBe(true);
    expect(shouldFoxCalibrationPersistWriteV1()).toBe(true);
  });

  it("URL cohort param pins anchor user for phase 1", () => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "1");
    window.history.replaceState({}, "", "/?cohort=rhizoh_primary_tester_01");
    __resetFoxFirstContactDeploymentForTestV1();

    const deploy = resolveFoxFirstContactDeploymentV1();
    expect(deploy.active).toBe(true);
    expect(deploy.anchorUserPinned).toBe(true);
    expect(deploy.phase).toBe("phase_1_cohort");
  });

  it("URL fox_phase=observe overrides build phase to phase 0 self", () => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "1");
    window.history.replaceState({}, "", "/?fox_phase=observe");
    __resetFoxFirstContactDeploymentForTestV1();

    const deploy = resolveFoxFirstContactDeploymentV1();
    expect(deploy.active).toBe(true);
    expect(deploy.phase).toBe("phase_0_self");
    expect(deploy.calibrationPersistWrite).toBe(false);
  });

  it("applies hard proactive cap and low budget cooldown", () => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "0");
    expect(resolveFoxProactiveHardCapPerHourV1(3)).toBe(1);
    expect(resolveFoxProactiveEffectiveCooldownMinutesV1(14)).toBe(30);
  });
});

describe("fox first contact persist gate", () => {
  beforeEach(() => {
    __resetFoxProactiveAdaptationForTestV1();
    __clearFoxProactiveCalibrationDiskForTestV1();
    __resetFoxFirstContactDeploymentForTestV1();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    __resetFoxFirstContactDeploymentForTestV1();
  });

  it("phase 0 records outcomes in memory but skips disk persist", () => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "0");
    recordFoxProactiveOutcomeFeedbackV1({ userEngaged: true, ghostComfort: 0.6 });
    expect(hydrateFoxProactiveCalibrationDiskV1()).toBeNull();
  });

  it("phase 1 anchor user writes calibration to disk", () => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "1");
    pinFoxFirstContactAnchorUserV1(true);
    recordFoxProactiveOutcomeFeedbackV1({ userDismissed: true, ghostComfort: 0.4 });
    const disk = hydrateFoxProactiveCalibrationDiskV1();
    expect(disk?.calibration.significanceThreshold).toBeGreaterThan(0.72);
  });
});

describe("fox proactive budget under first contact", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_FOX_FIRST_CONTACT_PHASE", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("caps max initiations per hour at 1", () => {
    const snap = getFoxProactiveBudgetSnapshotV1();
    expect(snap.maxInitiationsPerHour).toBe(1);
    expect(snap.cooldownMinutes).toBeGreaterThanOrEqual(30);
  });
});
