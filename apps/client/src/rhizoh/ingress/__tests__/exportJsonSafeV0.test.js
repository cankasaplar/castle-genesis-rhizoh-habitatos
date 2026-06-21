import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exportJsonSafeV0 } from "../exportJsonSafeV0.js";

describe("exportJsonSafeV0", () => {
  beforeEach(() => {
    vi.stubGlobal("document", {
      hasFocus: () => false,
      createElement: () => ({
        click: vi.fn(),
        remove: vi.fn(),
        rel: "",
        href: "",
        download: ""
      }),
      body: { appendChild: vi.fn() }
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:test",
      revokeObjectURL: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to download when document is not focused", async () => {
    const out = await exportJsonSafeV0('{"a":1}', "test.json");
    expect(out.ok).toBe(true);
    expect(out.method).toBe("download");
  });
});
