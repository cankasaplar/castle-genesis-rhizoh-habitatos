import { describe, expect, it } from "vitest";
import {
  buildOriginHomeSerencebeyPinV0,
  isOriginHomeSerencebeyPinV0,
  ORIGIN_HOME_SERENCEBEY_PIN_ID_V0
} from "../worldMapOriginHomePinV0.js";
import { ORIGIN_SEED_SERENCEBEY_V0 } from "../memoryAnchorSystemV0.js";

describe("worldMapOriginHomePinV0", () => {
  it("buildOriginHomeSerencebeyPinV0 uses immutable Serencebey seed coordinates", () => {
    const pin = buildOriginHomeSerencebeyPinV0();
    expect(pin.id).toBe(ORIGIN_HOME_SERENCEBEY_PIN_ID_V0);
    expect(pin.type).toBe("origin_home");
    expect(pin.lat).toBe(ORIGIN_SEED_SERENCEBEY_V0.location.lat);
    expect(pin.lon).toBe(ORIGIN_SEED_SERENCEBEY_V0.location.lon);
    expect(pin.immutable).toBe(true);
  });

  it("isOriginHomeSerencebeyPinV0 detects origin home pins", () => {
    const pin = buildOriginHomeSerencebeyPinV0();
    expect(isOriginHomeSerencebeyPinV0(pin)).toBe(true);
    expect(isOriginHomeSerencebeyPinV0({ id: "my_castle" })).toBe(false);
  });
});
