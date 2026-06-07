import * as THREE from "three";

export const STUDIO_CAMERA_MODE_V1 = Object.freeze({
  STAGE_FOCUS: "stage_focus",
  CONVERSATION: "conversation",
  WIDE_STUDIO: "wide_studio"
});

const STAGE_TARGET = new THREE.Vector3(0, 1.4, -2);
const RHI_POS = new THREE.Vector3(-0.8, 0, -4);
const OCTO_POS = new THREE.Vector3(2.2, 0, -1.2);

/**
 * @param {string} mode
 * @param {THREE.PerspectiveCamera} camera
 * @param {import("three/examples/jsm/controls/OrbitControls.js").OrbitControls} controls
 * @param {number} t elapsed seconds
 */
export function applyStudioCameraModeV1(mode, camera, controls, t = 0) {
  const m = String(mode || STUDIO_CAMERA_MODE_V1.STAGE_FOCUS);
  let camPos;
  let target;

  if (m === STUDIO_CAMERA_MODE_V1.CONVERSATION) {
    target = RHI_POS.clone().add(new THREE.Vector3(0, 1.6, 0));
    camPos = new THREE.Vector3(-2.2, 2.4, -1.5);
  } else if (m === STUDIO_CAMERA_MODE_V1.WIDE_STUDIO) {
    target = STAGE_TARGET.clone();
    camPos = new THREE.Vector3(10 + Math.sin(t * 0.08) * 0.5, 7.5, 12);
  } else {
    const orbit = 6.8 + Math.sin(t * 0.12) * 0.35;
    const ang = t * 0.18;
    target = STAGE_TARGET.clone().lerp(OCTO_POS, 0.22);
    camPos = new THREE.Vector3(
      Math.cos(ang) * orbit,
      4.2 + Math.sin(t * 0.2) * 0.25,
      Math.sin(ang) * orbit + 4
    );
  }

  camera.position.lerp(camPos, 0.04);
  controls.target.lerp(target, 0.06);
  controls.update();
}

export function getStudioCameraModeLabelV1(mode) {
  switch (mode) {
    case STUDIO_CAMERA_MODE_V1.CONVERSATION:
      return "Conversation";
    case STUDIO_CAMERA_MODE_V1.WIDE_STUDIO:
      return "Wide studio";
    default:
      return "Stage focus";
  }
}
