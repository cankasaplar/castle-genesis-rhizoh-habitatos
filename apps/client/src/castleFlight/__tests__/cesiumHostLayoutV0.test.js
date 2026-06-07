import { describe, expect, it, vi } from "vitest";
import {
  CESIUM_HOST_MIN_WIDTH_V0,
  isCesiumHostLayoutReadyV0,
  measureCesiumHostLayoutV0,
  resolveCesiumHostMinHeightV0
} from "../cesiumHostLayoutV0.js";

describe("cesiumHostLayoutV0", () => {
  it("resolveCesiumHostMinHeightV0 requires a map-sized viewport slice", () => {
    vi.stubGlobal("window", { innerHeight: 800 });
    expect(resolveCesiumHostMinHeightV0()).toBe(280);
    vi.stubGlobal("window", { innerHeight: 400 });
    expect(resolveCesiumHostMinHeightV0()).toBe(280);
    vi.unstubAllGlobals();
  });

  it("isCesiumHostLayoutReadyV0 rejects strip-thin hosts", () => {
    vi.stubGlobal("window", { innerHeight: 900 });
    const el = { clientWidth: 1200, clientHeight: 48 };
    expect(isCesiumHostLayoutReadyV0(el)).toBe(false);
    expect(isCesiumHostLayoutReadyV0({ clientWidth: 1200, clientHeight: 320 })).toBe(true);
    vi.unstubAllGlobals();
  });

  it("measureCesiumHostLayoutV0 rejects zero-height canvas", () => {
    vi.stubGlobal("window", { innerHeight: 900 });
    const host = {
      clientWidth: 800,
      clientHeight: 600,
      querySelector: () => ({ clientWidth: 800, clientHeight: 0 })
    };
    const m = measureCesiumHostLayoutV0(host);
    expect(m.hostH).toBe(600);
    expect(m.canvasH).toBe(0);
    expect(m.ready).toBe(false);
    vi.unstubAllGlobals();
  });

  it("accepts wide hosts above min width", () => {
    expect(isCesiumHostLayoutReadyV0({ clientWidth: CESIUM_HOST_MIN_WIDTH_V0, clientHeight: 400 }, { minWidth: 48, minHeight: 200 })).toBe(
      true
    );
  });
});
