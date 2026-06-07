/**
 * Cap wheel meaning ladder — hover read-only semantics; click executes elsewhere.
 * Level 1 icon (latent) · Level 2 whisper (interpretable) · Level 3 execute hint (click only).
 */

import {
  resolveCapWheelGeometryKindV1,
  resolveCapWheelIntentEncodingV1
} from "../../kernel/visual/capWheelIntentRegistryV1.js";
import { resolveUiCopyLocaleV0 } from "./rhizohProductCopyI18nV0.js";

export const CAP_WHEEL_MEANING_LADDER_SCHEMA_V0 = "castle.rhizoh.cap_wheel_meaning_ladder.v0";

/**
 * @param {{
 *   locale?: string,
 *   intro?: string,
 *   hoverNode?: { id?: string, label?: string, geometryKind?: string } | null,
 *   whisper?: string,
 *   hoverKind?: string | null
 * }} input
 */
export function resolveCapWheelMeaningLadderV0(input = {}) {
  const tr = resolveUiCopyLocaleV0(input.locale) === "tr";
  const intro = String(input.intro || "").trim();
  const hoverNode = input.hoverNode && typeof input.hoverNode === "object" ? input.hoverNode : null;
  const hoverKind = input.hoverKind != null ? String(input.hoverKind) : null;

  if (!hoverNode && !hoverKind) {
    return Object.freeze({
      schema: CAP_WHEEL_MEANING_LADDER_SCHEMA_V0,
      level: "idle",
      headline: tr ? "Komut yüzeyi" : "Command surface",
      body: intro,
      executeHint: null,
      geometryKind: null,
      readOnly: true
    });
  }

  const geometryKind = hoverKind
    ? resolveCapWheelGeometryKindV1({ id: hoverKind, geometryKind: hoverKind })
    : resolveCapWheelGeometryKindV1(hoverNode);
  const encoding = resolveCapWheelIntentEncodingV1(
    hoverNode || (hoverKind ? { id: hoverKind, geometryKind: hoverKind } : null)
  );

  return Object.freeze({
    schema: CAP_WHEEL_MEANING_LADDER_SCHEMA_V0,
    level: "hover",
    headline: hoverNode?.label || (hoverKind === "library" ? (tr ? "Arşiv" : "Library") : ""),
    body: String(input.whisper || "").trim(),
    executeHint: tr ? "Dokun = çalıştır" : "Tap to run",
    geometryKind,
    intentClass: encoding.intentClass,
    readOnly: true
  });
}
