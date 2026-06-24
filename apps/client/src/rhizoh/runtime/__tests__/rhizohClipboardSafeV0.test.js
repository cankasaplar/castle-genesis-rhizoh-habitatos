import { describe, expect, it, vi } from "vitest";
import { copyTextSafeV0 } from "../rhizohClipboardSafeV0.js";

describe("rhizohClipboardSafeV0", () => {
  it("falls back to console_log when clipboard unavailable", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await copyTextSafeV0("hello brief", { logOnFallback: true });
    expect(result.ok).toBe(false);
    expect(result.method).toBe("console_log");
    expect(logSpy).toHaveBeenCalledWith("hello brief");
    logSpy.mockRestore();
  });
});
