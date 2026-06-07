import * as THREE from "three";
import {
  buildSentenceColorKeyV1,
  createCognitiveGeometryEngineV1,
  extractActiveSentenceV1,
  ingestActiveSentenceV1,
  ingestCognitiveDraftV1,
  resolveCognitiveCrystalColorV1,
  resolveOppositeCrystalColorV1,
  resolveSpeakingCrystalColorV1,
  stepCognitiveGeometryEngineV1
} from "./octoCognitiveGeometryCompilerV1.js";
import {
  createOctoReactionEcologyV0,
  mergeOctoEcologyIntoCarryV0,
  stepOctoReactionEcologyV0
} from "./octoReactionEcologyV0.js";
import { createOctoJournalV0, stepOctoJournalV0 } from "./octoJournalV0.js";
import { createRhizohMemoryV0, stepRhizohMemoryV0 } from "./rhizohMemoryV0.js";
import { resolveAttentionHintBiasV0 } from "./rhizohAttentionFieldV0.js";
import { classifyCubeGeometryV0 } from "./octoJournalV0.js";
import {
  createCompanionBaselineV0,
  snapshotCompanionObservabilityV0,
  stepOctoObservationDiscoveryV0
} from "./octoObservationReportV0.js";
import { stepRhizohObservationInboxCouplingV0 } from "./rhizohObservationInboxCouplingV0.js";

export {
  SPEAKING_CRYSTAL_PALETTE_V1,
  resolveSpeakingCrystalColorV1
} from "./octoCognitiveGeometryCompilerV1.js";

const CUBE_EDGE_V1 = 0.192;
const NODE_SPHERE_RADIUS_V1 = 0.068;
const NODE_POINT_RADIUS_V1 = 0.0028;
const COGNITIVE_NODE_COUNT_V1 = 96;

const _dummy = new THREE.Object3D();
const _nodeColor = new THREE.Color();

/**
 * @param {number} aspectHint
 */
export function resolveSpeakingCrystalLanesV1(aspectHint = 3.2) {
  const wide = aspectHint > 2.2;
  const spread = wide ? 0.62 + Math.min((aspectHint - 2.2) * 0.12, 0.22) : 0.46;
  return Object.freeze({ left: -spread, right: spread, center: 0 });
}

/**
 * Cognitive Geometry Compiler — küp içinde Fibonacci node kümesi.
 * @param {THREE.Scene} scene
 * @param {number} [aspectHint]
 */
export function createOctoSpeakingCrystalV1(scene, aspectHint = 3.2) {
  const lanes = resolveSpeakingCrystalLanesV1(aspectHint);
  const engine = createCognitiveGeometryEngineV1(COGNITIVE_NODE_COUNT_V1);
  const palette = resolveCognitiveCrystalColorV1(engine.currentTopology, engine.rhizohLock, engine.dominant);

  const group = new THREE.Group();
  group.name = "octoSpeakingCrystal";

  const cubeGroup = new THREE.Group();
  cubeGroup.name = "cognitive_cube";

  const cubeWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE_EDGE_V1, CUBE_EDGE_V1, CUBE_EDGE_V1)),
    new THREE.LineBasicMaterial({
      color: 0x3d5578,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    })
  );
  cubeWire.name = "cube_wire";
  cubeGroup.add(cubeWire);

  const cubeGlass = new THREE.Mesh(
    new THREE.BoxGeometry(CUBE_EDGE_V1, CUBE_EDGE_V1, CUBE_EDGE_V1),
    new THREE.MeshStandardMaterial({
      color: 0x0a1424,
      emissive: 0x0e1e36,
      emissiveIntensity: 0.35,
      metalness: 0.55,
      roughness: 0.35,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  cubeGlass.name = "cube_glass";
  cubeGroup.add(cubeGlass);

  const nodeMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(NODE_POINT_RADIUS_V1, 6, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    }),
    engine.numNodes
  );
  nodeMesh.name = "cognitive_nodes";
  cubeGroup.add(nodeMesh);

  const linkPositions = new Float32Array(engine.linkPairs.length * 6);
  const linkGeometry = new THREE.BufferGeometry();
  linkGeometry.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
  const linkLines = new THREE.LineSegments(
    linkGeometry,
    new THREE.LineBasicMaterial({
      color: palette.base,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    })
  );
  linkLines.name = "cognitive_mesh";
  cubeGroup.add(linkLines);

  group.add(cubeGroup);

  const light = new THREE.PointLight(palette.emissive, 0.42, 2.6);
  group.add(light);

  scene.add(group);

  const rest = { x: lanes.right, y: 0.02, z: 0.14 };
  group.position.set(rest.x, rest.y, rest.z);

  return {
    group,
    cubeGroup,
    cubeWire,
    cubeGlass,
    nodeMesh,
    linkLines,
    linkGeometry,
    linkPositions,
    light,
    engine,
    ecology: createOctoReactionEcologyV0(),
    journal: createOctoJournalV0(),
    rhizohMemory: createRhizohMemoryV0(),
    companionBaseline: createCompanionBaselineV0(),
    lanes,
    rest,
    state: {
      phase: "idle",
      currentColor: { ...palette },
      lockedColor: null,
      octoTintRequested: false,
      lastSubmitPulse: 0,
      sessionSwim: false,
      contrastBind: true,
      sentenceKey: "",
      colorRevision: 0
    },
    setAspect(aspect) {
      const next = resolveSpeakingCrystalLanesV1(aspect);
      this.lanes = next;
      this.rest.x = next.right;
      this.group.position.x = next.right;
    },
    dispose() {
      scene.remove(group);
      cubeWire.geometry.dispose();
      cubeWire.material.dispose();
      cubeGlass.geometry.dispose();
      cubeGlass.material.dispose();
      nodeMesh.geometry.dispose();
      nodeMesh.material.dispose();
      linkGeometry.dispose();
      linkLines.material.dispose();
    }
  };
}

/**
 * @param {ReturnType<typeof createOctoSpeakingCrystalV1>} crystal
 * @param {{ base: number, emissive: number, rgb?: { r: number, g: number, b: number } }} palette
 * @param {ReturnType<typeof createCognitiveGeometryEngineV1>} engine
 * @param {number} delta
 */
function syncCognitiveCrystalVisualsV1(crystal, palette, engine, delta) {
  const smooth = Math.min(1, delta * 4.5);
  const top = engine.currentTopology;
  const rgb = palette.rgb || { r: 100, g: 150, b: 255 };

  crystal.cubeGroup.rotation.y = engine.rotationY;
  crystal.cubeGroup.rotation.x = engine.rotationX;

  for (let i = 0; i < engine.nodes.length; i += 1) {
    const node = engine.nodes[i];
    _dummy.position.set(
      node.x * NODE_SPHERE_RADIUS_V1,
      node.y * NODE_SPHERE_RADIUS_V1,
      node.z * NODE_SPHERE_RADIUS_V1
    );
    const scale = 1 + top.spikes * 0.35 + engine.energy * 0.25;
    _dummy.scale.setScalar(scale);
    _dummy.updateMatrix();
    crystal.nodeMesh.setMatrixAt(i, _dummy.matrix);
  }
  crystal.nodeMesh.instanceMatrix.needsUpdate = true;

  let offset = 0;
  for (const [a, b] of engine.linkPairs) {
    const na = engine.nodes[a];
    const nb = engine.nodes[b];
    crystal.linkPositions[offset++] = na.x * NODE_SPHERE_RADIUS_V1;
    crystal.linkPositions[offset++] = na.y * NODE_SPHERE_RADIUS_V1;
    crystal.linkPositions[offset++] = na.z * NODE_SPHERE_RADIUS_V1;
    crystal.linkPositions[offset++] = nb.x * NODE_SPHERE_RADIUS_V1;
    crystal.linkPositions[offset++] = nb.y * NODE_SPHERE_RADIUS_V1;
    crystal.linkPositions[offset++] = nb.z * NODE_SPHERE_RADIUS_V1;
  }
  crystal.linkGeometry.attributes.position.needsUpdate = true;

  _nodeColor.setRGB(rgb.r / 255, rgb.g / 255, rgb.b / 255);
  crystal.linkLines.material.color.lerp(_nodeColor, smooth);
  crystal.linkLines.material.opacity += (0.28 + engine.energy * 0.35 - crystal.linkLines.material.opacity) * smooth;

  crystal.cubeWire.material.color.lerp(_nodeColor, smooth * 0.55);
  crystal.cubeGlass.material.color.lerp(new THREE.Color(palette.base), smooth * 0.25);
  crystal.cubeGlass.material.emissive.lerp(new THREE.Color(palette.emissive), smooth);
  crystal.cubeGlass.material.emissiveIntensity += (0.42 + engine.energy * 0.55 - crystal.cubeGlass.material.emissiveIntensity) * smooth;
  if (crystal.nodeMesh?.material?.color) {
    crystal.nodeMesh.material.color.lerp(_nodeColor, smooth);
    crystal.nodeMesh.material.opacity += (0.82 + engine.energy * 0.12 - crystal.nodeMesh.material.opacity) * smooth;
  }

  const pulse = 0.38 + Math.sin(engine.rotationY * 2.2) * 0.12 + engine.energy * 0.28;
  crystal.light.intensity += (pulse - crystal.light.intensity) * smooth;
  crystal.light.color.lerp(new THREE.Color(palette.emissive), smooth);
}

function resolveOctoUserEnergyV0(draftText, replyText, drive) {
  const draft = String(draftText || "").trim();
  const reply = String(replyText || "").trim();
  if (draft) return Math.min(1, 0.32 + draft.length / 90);
  if (reply) return 0.42;
  if (drive?.busy) return 0.28;
  return 0;
}

function buildOctoEcologyCarryV0(
  crystal,
  engine,
  drive,
  draftText,
  replyText,
  delta = 1 / 60,
  palette = null,
  interactionCtx = {}
) {
  const nowMs = Date.now();
  const deltaMs = Math.max(0, delta * 1000);
  const memoryTick = stepRhizohMemoryV0(crystal.rhizohMemory, {
    nowMs,
    deltaMs,
    draftText,
    replyText,
    fieldState: interactionCtx.fieldState,
    mapSurfaceActive: interactionCtx.mapSurfaceActive,
    engine
  });
  const classified = classifyCubeGeometryV0(engine?.targetTopology ?? engine?.currentTopology ?? {});
  const attentionHintBias = resolveAttentionHintBiasV0(
    crystal.rhizohMemory.attentionField,
    classified.geometry
  );
  const tick = stepOctoReactionEcologyV0(crystal.ecology, engine, {
    nowMs,
    userEnergy: resolveOctoUserEnergyV0(draftText, replyText, drive),
    attentionHintBias,
    geometryKind: classified.geometry
  });
  const journalTick = stepOctoJournalV0(crystal.journal, tick, engine, palette ?? crystal.state.currentColor, {
    nowMs,
    deltaMs
  });
  const discoveryTick = stepOctoObservationDiscoveryV0(crystal.journal, crystal.rhizohMemory, { nowMs });
  const inboxCouplingTick = stepRhizohObservationInboxCouplingV0(crystal.rhizohMemory, { nowMs });
  const observability = snapshotCompanionObservabilityV0(crystal.journal, crystal.rhizohMemory, nowMs, {
    ecologyTick: tick,
    attentionHintBias,
    geometryKind: classified.geometry,
    baseline: crystal.companionBaseline,
    inboxCouplingTick,
    engine,
    observerSpeciesId: crystal.observerSpeciesId ?? "octo_v1"
  });
  if (typeof window !== "undefined") {
    window.__RHIZOH_COMPANION_OBSERVABILITY__ = observability;
  }
  return {
    tick,
    journalTick,
    memoryTick,
    discoveryTick,
    inboxCouplingTick,
    attentionHintBias,
    observability,
    bias: tick.intent
  };
}

/**
 * @param {ReturnType<typeof createOctoSpeakingCrystalV1>} crystal
 * @param {ReturnType<typeof import("./octoConversationMotionV1.js").deriveOctoMotionDriveV1>} drive
 * @param {number} delta
 * @param {number} time
 * @param {number} [aspectHint]
 * @param {number} [submitPulse]
 * @param {string} [draftText]
 * @param {string} [replyText]
 */
export function updateOctoSpeakingCrystalV1(
  crystal,
  drive,
  delta,
  time,
  aspectHint = 3.2,
  submitPulse = 0,
  draftText = "",
  replyText = "",
  interactionCtx = {}
) {
  const lanes = resolveSpeakingCrystalLanesV1(aspectHint);
  crystal.lanes = lanes;
  const smooth = Math.min(1, delta * 5);
  const contrast = crystal.state.contrastBind !== false;
  const cubePhaseSign = contrast ? 1 : 1;
  const octoPhaseSign = contrast ? -1 : 1;
  const floatY = Math.sin(time * 2.1 * cubePhaseSign) * 0.008;
  const driftX = Math.sin(time * 1.65 * cubePhaseSign) * 0.014;
  const restY = 0.02;
  const restZ = 0.14;
  const engine = crystal.engine;
  engine.cubeSpinSign = cubePhaseSign;

  if (submitPulse > 0 && submitPulse !== crystal.state.lastSubmitPulse) {
    crystal.state.lastSubmitPulse = submitPulse;
    crystal.state.colorRevision += 1;
    crystal.state.octoTintRequested = true;
    crystal.state.phase = "octo_tint";
  }

  const sentenceKey = buildSentenceColorKeyV1(draftText, replyText, submitPulse);
  if (sentenceKey !== crystal.state.sentenceKey) {
    crystal.state.sentenceKey = sentenceKey;
    crystal.state.colorRevision += 1;
    crystal.state.octoTintRequested = false;
    engine.lastSentenceSnapshot = "";
  }

  const hasDraft = String(draftText || "").trim().length > 0;
  const hasReply = String(replyText || "").trim().length > 0;
  const typing = Boolean(drive.draftOnly) && hasDraft;
  const coastSwim = drive.live && (!typing || crystal.state.octoTintRequested);

  if (hasDraft || hasReply || drive.live || crystal.state.octoTintRequested) {
    crystal.state.sessionSwim = true;
  }

  const compilerText = hasDraft ? draftText : String(replyText || "").trim();
  const activeSentence = extractActiveSentenceV1(compilerText);
  if (compilerText) {
    ingestCognitiveDraftV1(engine, compilerText);
  }
  if (activeSentence) {
    ingestActiveSentenceV1(engine, activeSentence);
  }

  const paletteLive = stepCognitiveGeometryEngineV1(
    engine,
    delta,
    Date.now(),
    hasDraft ? draftText : compilerText,
    {
      sessionDrift: crystal.state.sessionSwim,
      cubeSpinRate: contrast ? 1.18 : 1
    }
  );
  const palette = paletteLive;
  const octoPalette = contrast
    ? resolveOppositeCrystalColorV1({
        ...palette,
        base: palette.accent,
        accent: palette.emissive,
        emissive: palette.base
      })
    : palette;

  crystal.state.currentColor = { ...palette };

  crystal.rest.x = lanes.right;
  const targetX = lanes.right + driftX;
  crystal.group.position.x += (targetX - crystal.group.position.x) * smooth;
  crystal.group.position.y += (restY + floatY - crystal.group.position.y) * smooth;
  crystal.group.position.z += (restZ - crystal.group.position.z) * smooth;

  syncCognitiveCrystalVisualsV1(crystal, palette, engine, delta);
  const { tick: ecologyTick, journalTick, memoryTick } = buildOctoEcologyCarryV0(
    crystal,
    engine,
    drive,
    draftText,
    replyText,
    delta,
    palette,
    interactionCtx
  );

  if (!drive.live && !hasDraft && !crystal.state.sessionSwim) {
    crystal.state.phase = "idle";
    crystal.state.octoTintRequested = false;
    return mergeOctoEcologyIntoCarryV0(
      {
        phase: "idle",
        crystalColor: octoPalette.base,
        crystalEmissive: octoPalette.emissive,
        crystalAccent: octoPalette.accent,
        orbPos: crystal.group.position.clone(),
        freeSwim: false,
        coastSwim: false,
        allowBodySwim: false,
        sessionSwim: false,
        octoSwimPhaseSign: octoPhaseSign,
        octoSwimSpeedMul: contrast ? 1.22 : 1,
        octoHeadSign: contrast ? -1 : 1,
        octoTintRequested: false,
        touched: false,
        grabActive: false,
        reach: 0,
        touchAmount: 0,
        reachAmount: 0,
        tentacleExtend: 0,
        headLeanX: 0,
        bodyRoll: 0,
        bodyPitch: 0,
        ecologyTick,
        journalTick,
        memoryTick
      },
      ecologyTick
    );
  }

  const swimming = crystal.state.sessionSwim || drive.live || hasDraft || hasReply;
  const freeDrift = crystal.state.sessionSwim && !typing;

  return mergeOctoEcologyIntoCarryV0(
    {
      phase: typing
        ? "crystal_typing"
        : crystal.state.octoTintRequested
          ? "octo_tint"
          : freeDrift
            ? "free_drift"
            : coastSwim
              ? "coast"
              : "compiler",
      crystalColor: octoPalette.base,
      crystalEmissive: octoPalette.emissive,
      crystalAccent: octoPalette.accent,
      cubeColor: palette.base,
      orbPos: crystal.group.position.clone(),
      freeSwim: typing || freeDrift || crystal.state.sessionSwim,
      coastSwim: coastSwim || freeDrift || crystal.state.octoTintRequested || hasReply,
      allowBodySwim: swimming,
      sessionSwim: crystal.state.sessionSwim,
      octoSwimPhaseSign: octoPhaseSign,
      octoSwimSpeedMul: contrast ? (typing ? 1.05 : 1.28) : 1,
      octoHeadSign: contrast ? -1 : 1,
      octoTintRequested: crystal.state.octoTintRequested,
      touched: crystal.state.octoTintRequested,
      continuousColor: swimming,
      colorRevision: crystal.state.colorRevision,
      grabActive: false,
      reach: 0,
      touchAmount: crystal.state.octoTintRequested ? 1 : 0,
      reachAmount: 0,
      tentacleExtend: 0,
      headLeanX: 0,
      bodyRoll: 0,
      bodyPitch: 0,
      ecologyTick,
      journalTick,
      memoryTick
    },
    ecologyTick
  );
}
