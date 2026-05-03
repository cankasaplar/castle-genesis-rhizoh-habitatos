/**
 * @typedef {"GLOBE" | "REAL_MAP"} RealityModeId
 */

/**
 * @typedef {Object} RealityTransitionPayload
 * @property {RealityModeId} from
 * @property {RealityModeId} to
 * @property {string} source
 * @property {number} durationMs
 * @property {boolean} success
 * @property {unknown} [error]
 * @property {string} [reason]
 */

export {};
