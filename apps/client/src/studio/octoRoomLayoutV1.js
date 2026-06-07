/** Compact Octo strip above chat — homepage dock band. */

export const OCTO_ROOM_DEFAULT_HEIGHT_PX_V1 = 108;

/**
 * @param {number} [preferred]
 * @param {{ min?: number, max?: number }} [bounds]
 * @returns {number}
 */
export function resolveOctoRoomHeightPxV1(
  preferred = OCTO_ROOM_DEFAULT_HEIGHT_PX_V1,
  bounds = {}
) {
  const minPx = bounds.min ?? 88;
  const maxPx = bounds.max ?? 128;
  const n = Number(preferred);
  if (!Number.isFinite(n) || n < minPx) return OCTO_ROOM_DEFAULT_HEIGHT_PX_V1;
  return Math.min(maxPx, Math.max(minPx, Math.round(n)));
}
