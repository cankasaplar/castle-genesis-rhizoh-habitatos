/**
 * Screenshot scope watermark v1 — must render on shareable ops surfaces.
 */

export const SCREENSHOT_WATERMARK_SCHEMA_V1 = "rhizoh.screenshot_scope_watermark.v0";

/**
 * @param {unknown} hardeningPayload
 */
export function resolveScreenshotWatermarkFromHardeningV1(hardeningPayload) {
  const w =
    hardeningPayload?.unifiedState?.screenshotScopeWatermark ||
    hardeningPayload?.screenshotScopeWatermark;
  if (w?.lines) return w;
  const tenantId = hardeningPayload?.unifiedState?.tenantScope?.tenantId || "__unknown__";
  return {
    schema: SCREENSHOT_WATERMARK_SCHEMA_V1,
    tenantId,
    scope: "unknown",
    fingerprintShort: "—",
    lines: {
      tr: `KAPSAM: ${tenantId} · karar değil`,
      en: `SCOPE: ${tenantId} · non-binding`
    }
  };
}
