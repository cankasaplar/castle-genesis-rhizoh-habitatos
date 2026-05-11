/**
 * vNext-540 — CastleSceneSync: bridge frame → Three.js embodiment (buffers optional; CPU atlas drives meshes).
 */

import * as THREE from "three";
import { FieldVolumeMesh } from "./FieldVolumeMesh.js";
import { BranchRiverMesh } from "./BranchRiverMesh.js";
import { OrbOverlayMesh } from "./OrbOverlayMesh.js";
import { RegionalLabelMesh } from "./RegionalLabelMesh.js";
import { GhostSpiritMesh } from "./GhostSpiritMesh.js";
import { BOSPORUS_PATH_V540, ISTANBUL_V540_DISTRICTS } from "./istanbulBiomePresetV540.js";
import { computeGhostEmbodimentParams } from "../ghost/ghostEmbodimentBridgeV546.js";
import { buildGhostRendererHints } from "../ghost/ghostRenderer.js";
import { mergeEmbodimentWithGhostIntent } from "../ghost/ghostIntentLayerV547.js";

/**
 * @typedef {object} SceneSyncContext
 * @property {Partial<{ tier: string, drift: number, discomfort: number, legitimacyResonance: number, mutation: string }>} [sovereign] sovereign orb overrides only (alan verisi `frame.regionalMap`)
 * @property {import("../ghost/ghostGenome.js").GhostGenome} [ghostGenome] vNext-546
 * @property {import("../ghost/ghostEvolution.js").GhostEvolutionStageId} [ghostStage]
 * @property {ReturnType<import("../ghost/ghostIntentLayerV547.js").createGhostIntentController>} [ghostIntentController] vNext-547
 * @property {import("../ghost/ghostIntentLayerV547.js").GhostIntent} [ghostIntent] doğrudan intent (controller üzerine yazar)
 * @property {import("../ghost/userPresenceLoopV548.js").UserPresenceSnapshot | null} [userPresence] vNext-548 anlık snapshot
 */

export class CastleSceneSync {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [options]
   * @param {import("./istanbulBiomePresetV540.js").IstanbulDistrictAnchor[]} [options.districts]
   * @param {THREE.Vector3[]} [options.bosphorusPath]
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.lastFingerprint = null;
    const districts = options.districts?.length ? options.districts : ISTANBUL_V540_DISTRICTS;
    const bosphorusPath = options.bosphorusPath?.length ? options.bosphorusPath : BOSPORUS_PATH_V540;
    const labelsEnabled = options.labelsEnabled !== false;
    /** @type {typeof ISTANBUL_V540_DISTRICTS} */
    this._districts = districts;
    /** @type {THREE.Vector3[]} */
    this._bosphorusPath = bosphorusPath;
    this._citySpiritId = options.citySpiritId ?? "istanbul";
    this._ghostEmbodimentEnabled = options.ghostEmbodiment === true;
    this._lastNow = 0;

    this.fieldVolume = new FieldVolumeMesh({ districts });
    this.branchRiver = new BranchRiverMesh({ bosphorusPath });
    this.orb = new OrbOverlayMesh({ ...options, labelsEnabled });
    this.labels = new RegionalLabelMesh({ districts, labelsEnabled });
    /** @type {GhostSpiritMesh | null} */
    this.ghostSpirit = null;
    if (this._ghostEmbodimentEnabled) {
      this.ghostSpirit = new GhostSpiritMesh();
    }

    this.root = new THREE.Group();
    this.root.name = "CastleSceneSyncV540";
    this.root.add(this.fieldVolume.group);
    this.root.add(this.branchRiver.group);
    if (this.ghostSpirit) this.root.add(this.ghostSpirit.group);
    this.root.add(this.orb.group);
    this.root.add(this.labels.group);
    scene.add(this.root);
  }

  /**
   * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} bridgeFrame
   * @param {SceneSyncContext} [ctx]
   */
  update(bridgeFrame, ctx = {}) {
    if (!bridgeFrame?.frameFingerprint) return;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const dt = this._lastNow ? (now - this._lastNow) / 1000 : 0.016;
    this._lastNow = now;

    /** @type {import("../ghost/ghostIntentLayerV547.js").GhostIntent | null | undefined} */
    let ghostIntent = ctx.ghostIntent;
    if (!ghostIntent && ctx.ghostIntentController && ctx.ghostGenome && ctx.ghostStage) {
      const ir = ctx.ghostIntentController.onHabitatFrame(
        bridgeFrame,
        ctx.ghostGenome,
        ctx.ghostStage,
        now,
        dt,
        ctx.userPresence ?? null
      );
      ghostIntent = ir.intent;
    }

    const fpDup = bridgeFrame.frameFingerprint === this.lastFingerprint;
    const microLive = ghostIntent && (ghostIntent.microWake01 ?? 0) > 0.012;
    const wakeLive = (ghostIntent && ghostIntent.wakePhase !== "idle") || microLive;
    if (fpDup && !wakeLive) return;
    if (!fpDup) this.lastFingerprint = bridgeFrame.frameFingerprint;

    /** @type {{ fieldDistortionMul?: number, perDistrict?: Record<string, { scaleMul?: number, opacityMul?: number }> } | undefined} */
    let fieldGhostMod;
    /** @type {{ opacityMul?: number, emissiveIntensityMul?: number, kindOpacityMul?: Partial<Record<string, number>> } | undefined} */
    let branchGhostMod;

    if (this._ghostEmbodimentEnabled && this.ghostSpirit && ctx.ghostGenome && ctx.ghostStage) {
      let params = computeGhostEmbodimentParams(bridgeFrame, ctx.ghostGenome, ctx.ghostStage, {
        districts: this._districts,
        bosphorusPath: this._bosphorusPath
      });
      if (ghostIntent) params = mergeEmbodimentWithGhostIntent(params, ghostIntent);
      const hints = buildGhostRendererHints(this._citySpiritId, ctx.ghostGenome, ctx.ghostStage);
      const spiritWake = Math.min(
        1,
        (ghostIntent?.wakeIntensity01 ?? 0) + (ghostIntent?.microWake01 ?? 0) * 0.42
      );
      this.ghostSpirit.sync(hints, params.anchor, params.oracleMode, dt, spiritWake);
      branchGhostMod = {
        opacityMul: params.branchVisibilityMul,
        emissiveIntensityMul: params.branchEmissiveMul,
        kindOpacityMul: ghostIntent?.branchKindOpacityMul
      };
      fieldGhostMod = {
        fieldDistortionMul: params.fieldDistortionMul,
        perDistrict: params.perDistrict,
        emphasis:
          ghostIntent?.emphasizedDistrictId != null
            ? {
                districtId: ghostIntent.emphasizedDistrictId,
                strength01:
                  0.28 +
                  ((ghostIntent.wakeIntensity01 ?? 0) + (ghostIntent.microWake01 ?? 0) * 0.32) * 0.58
              }
            : undefined
      };
    }

    this.fieldVolume.sync(bridgeFrame, fieldGhostMod);
    this.branchRiver.sync(bridgeFrame, branchGhostMod);
    this.orb.sync(bridgeFrame, ctx);
    this.labels.sync(bridgeFrame);
  }

  invalidateFingerprintCache() {
    this.lastFingerprint = null;
  }

  dispose() {
    this.scene.remove(this.root);
    this.fieldVolume.dispose();
    this.branchRiver.dispose();
    if (this.ghostSpirit) this.ghostSpirit.dispose();
    this.orb.dispose();
    this.labels.dispose();
  }
}

/**
 * @param {string | null | undefined} lastFingerprint
 * @param {string | null | undefined} nextFingerprint
 */
export function sceneSyncShouldUpdate(lastFingerprint, nextFingerprint) {
  if (!nextFingerprint) return false;
  if (lastFingerprint === nextFingerprint) return false;
  return true;
}
