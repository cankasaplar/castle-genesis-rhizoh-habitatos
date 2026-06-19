/**
 * SpiralMMO cube canonical unit — 1 cell = fixed px; size from state only.
 */

export const SPIRAL_CUBE_CANONICAL_CELL_PX_V0 = 28;
export const SPIRAL_CUBE_UNIT_SCHEMA_V0 = "rhizoh.spiral_cube_unit.v0";

const DEPTH_MULT_V0 = Object.freeze([0.92, 1.0, 1.1]);
const ORDER_BONUS_V0 = 0.14;

/**
 * Pixel size from deterministic state — never derived per animation frame.
 * @param {{ depthLayer?: number, sizeNoise?: number, isOrder?: boolean }} input
 */
export function resolveSpiralCubeSizePxV0(input = {}) {
  const depthLayer = Math.max(0, Math.min(2, Number(input.depthLayer) || 0));
  const sizeNoise = Math.max(0, Math.min(1, Number(input.sizeNoise) || 0));
  const isOrder = input.isOrder === true;
  const depthMult = DEPTH_MULT_V0[depthLayer] ?? 1;
  const orderMult = isOrder ? 1 + ORDER_BONUS_V0 : 1;
  const noiseMult = 0.88 + sizeNoise * 0.28;
  return Math.round(SPIRAL_CUBE_CANONICAL_CELL_PX_V0 * depthMult * orderMult * noiseMult);
}

/**
 * Single render scale layer for overlay transforms (state → scale, not frame drift).
 * @param {{ depth?: number }} cubeSpec
 */
export function resolveSpiralCubeRenderScaleV0(cubeSpec = {}) {
  const depth = Math.max(0, Math.min(1.2, Number(cubeSpec.depth) || 0.5));
  return Number((1.02 + depth * 0.22).toFixed(3));
}
