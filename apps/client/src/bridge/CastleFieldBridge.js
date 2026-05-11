/**
 * vNext-539 — CastleFieldBridge: kernel field → GPU buffers → scene sync contract.
 * Does not own Cesium/Three; only uploads + returns handles + overlay state.
 */

import { composeFieldFrame } from "./fieldFrameComposer.js";
import { createFieldAtlasBuffer, writeAtlasToGpu } from "./atlasUploader.js";
import { createBranchBuffer, writeBranchBuffer } from "./branchBufferUploader.js";
import { probeFieldDevice, requestFieldDevice } from "./deviceFieldAdapter.js";

/**
 * @typedef {object} CastleFieldBridgeInput
 * @property {import("../kernel/render/fieldAtlasBuilder.js").FieldAtlas} atlas
 * @property {Map<string, import("../kernel/render/fieldAtlasBuilder.js").FieldSample>} [regionalMap] canonical (preferred)
 * @property {Map<string, unknown> | unknown[]} [regionalSamples] legacy; used if regionalMap empty
 * @property {import("../kernel/render/branchRiverRenderer.js").BranchRiverSegment[]} [branchSegments]
 * @property {Record<string, number>} [weatherSummary]
 * @property {string} [epochHash]
 * @property {number[] | null} [dirtyCellIndices]
 * @property {Partial<{ tier: string, drift: number, discomfort: number, legitimacyResonance: number, mutation: "pending" | "sealed" }>} [rhizohSovereign]
 */

/**
 * @typedef {object} CastleFieldBridgeFrame
 * @property {GPUTexture | null} fieldTexture
 * @property {GPUBuffer | null} fieldBuffer
 * @property {GPUBuffer | null} branchBuffer
 * @property {object} overlayState
 * @property {string} frameFingerprint
 * @property {import("../kernel/render/fieldAtlasBuilder.js").FieldAtlas | null} atlas
 * @property {readonly import("../kernel/render/branchRiverRenderer.js").BranchRiverSegment[]} branchSegments
 * @property {ReadonlyMap<string, import("../kernel/render/fieldAtlasBuilder.js").FieldSample>} regionalMap
 */

/**
 * @param {object} [options]
 * @param {GPUDevice | null} [options.device]
 */
export function createCastleFieldBridge(options = {}) {
  const profile = probeFieldDevice({});
  /** @type {GPUDevice | null} */
  let device = options.device ?? null;
  /** @type {GPUBuffer | null} */
  let atlasGpuBuffer = null;
  /** @type {GPUBuffer | null} */
  let branchGpuBuffer = null;
  let lastAtlasCapacity = 0;
  let lastBranchCapacity = 0;

  return {
    profile,

    getDevice() {
      return device;
    },

    /** @param {GPUDevice | null} d */
    setDevice(d) {
      device = d;
      atlasGpuBuffer = null;
      branchGpuBuffer = null;
      lastAtlasCapacity = 0;
      lastBranchCapacity = 0;
    },

    async ensureDevice() {
      if (device) return device;
      const { device: d } = await requestFieldDevice();
      device = d;
      return device;
    },

    /**
     * @param {CastleFieldBridgeInput} input
     * @returns {CastleFieldBridgeFrame}
     */
    submitFrame(input) {
      const composed = composeFieldFrame(input);

      let fieldBuffer = null;
      let branchBuffer = null;
      /** @type {GPUTexture | null} */
      const fieldTexture = null;

      if (device && composed.atlas?.texels) {
        const need = composed.atlas.texels.byteLength;
        if (!atlasGpuBuffer || lastAtlasCapacity < need) {
          atlasGpuBuffer = createFieldAtlasBuffer(device, need);
          lastAtlasCapacity = need;
        }
        writeAtlasToGpu(device, device.queue, atlasGpuBuffer, composed.atlas, composed.dirtyCellIndices);
        fieldBuffer = atlasGpuBuffer;

        const bp = composed.branchPacked;
        if (!branchGpuBuffer || lastBranchCapacity < bp.byteLength) {
          branchGpuBuffer = createBranchBuffer(device, bp);
          lastBranchCapacity = branchGpuBuffer.size;
        }
        writeBranchBuffer(device.queue, branchGpuBuffer, bp);
        branchBuffer = branchGpuBuffer;
      }

      const branchSegments = input.branchSegments ? Object.freeze([...input.branchSegments]) : Object.freeze([]);

      return Object.freeze({
        fieldTexture,
        fieldBuffer,
        branchBuffer,
        overlayState: composed.overlayState,
        frameFingerprint: composed.frameFingerprint,
        atlas: composed.atlas ?? null,
        branchSegments,
        regionalMap: composed.regionalMap
      });
    }
  };
}
