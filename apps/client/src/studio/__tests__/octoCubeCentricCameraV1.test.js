import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  CUBE_CENTRIC_CAMERA_SCHEMA_V0,
  getCognitiveCubeFocusV1,
  resolveCubeCentricRestShotV1,
  aimCubeCentricConversationCameraV1
} from "../octoCubeCentricCameraV1.js";

function mockCrystal() {
  const cubeGroup = new THREE.Group();
  cubeGroup.name = "cognitive_cube";
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshBasicMaterial()
  );
  mesh.position.set(0, 0.1, 0.14);
  cubeGroup.add(mesh);
  const group = new THREE.Group();
  group.add(cubeGroup);
  return { cubeGroup, group };
}

describe("octoCubeCentricCameraV1", () => {
  it("resolves rest shot anchored to cognitive cube bbox", () => {
    const crystal = mockCrystal();
    crystal.cubeGroup.updateMatrixWorld(true);
    const shot = resolveCubeCentricRestShotV1(crystal, 3.2);
    expect(shot.schema).toBe(CUBE_CENTRIC_CAMERA_SCHEMA_V0);
    expect(shot.fov).toBeGreaterThan(40);
    expect(shot.pos.z).toBeGreaterThan(shot.look.z);
    expect(shot.look.y).toBeCloseTo(0.1, 1);
  });

  it("getCognitiveCubeFocusV1 returns cube center not origin", () => {
    const crystal = mockCrystal();
    const focus = getCognitiveCubeFocusV1(crystal);
    expect(focus.y).toBeGreaterThan(0);
    expect(focus.z).toBeGreaterThan(0);
  });

  it("aimCubeCentricConversationCameraV1 marks camera cube-centric", () => {
    const crystal = mockCrystal();
    const camera = new THREE.PerspectiveCamera(44, 3.2, 0.05, 50);
    aimCubeCentricConversationCameraV1(crystal, camera, 3.2);
    expect(camera.userData.cubeCentric).toBe(true);
    expect(camera.userData.rest?.look).toBeTruthy();
    expect(camera.position.z).toBeGreaterThan(0.5);
  });
});
