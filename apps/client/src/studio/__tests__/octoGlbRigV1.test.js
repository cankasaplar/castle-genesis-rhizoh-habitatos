import { describe, expect, it } from "vitest";
import * as THREE from "three";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  animateOctoGlbRigV1,
  pickOctoPrimaryReachChainV1,
  pickOctoReachChainsV1,
  resetOctoGlbRigV1
} from "../octoGlbRigV1.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const glbPath = path.resolve(__dirname, "../../../public/models/octo-blue-ringed.glb");

function readGlbNodeNames() {
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
  return (json.nodes || []).map((n) => n.name).filter(Boolean);
}

describe("octoGlbRigV1", () => {
  it("GLB contains 8 tentacle root bones and BODY_MESH", () => {
    const names = readGlbNodeNames();
    expect(names).toContain("BODY_MESH");
    expect(names).toContain("BODY_RIG");
    expect(names).toContain("11");
    expect(names).toContain("11.007");
    expect(names.filter((n) => /^11(?:\.00[1-7])?$/.test(n)).length).toBe(8);
  });

  it("prefers chains on the right for orb reach", () => {
    const mockRig = {
      tentacles: [0, 1, 2, 3, 4, 5, 6, 7].map((id) => ({
        id,
        tip: {
          bone: {
            getWorldPosition: (out) => out.set(-0.4 + id * 0.12, 0, 0)
          }
        }
      }))
    };
    const primary = pickOctoPrimaryReachChainV1(mockRig, new THREE.Vector3(0.6, 0.02, 0.14));
    const picks = pickOctoReachChainsV1(mockRig, new THREE.Vector3(0.6, 0.02, 0.14));
    expect(picks.length).toBe(1);
    expect(primary).toBeGreaterThanOrEqual(4);
  });

  it("reset/animate accept plain rig bag (no userData)", () => {
    const bone = {
      quaternion: new THREE.Quaternion(),
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      parent: null,
      getWorldPosition: (out) => out.set(0, 0, 0),
      userData: {}
    };
    bone.userData.octoOrigQ = bone.quaternion.clone();
    bone.userData.octoOrigP = bone.position.clone();
    bone.userData.octoOrigR = bone.rotation.clone();
    const entry = {
      bone,
      name: "11",
      index: 0,
      originalQuaternion: bone.userData.octoOrigQ,
      originalPosition: bone.userData.octoOrigP,
      originalRotation: bone.userData.octoOrigR
    };
    const rig = {
      tentacles: [{ id: 0, bones: [entry], tip: entry, base: entry }],
      headBones: [entry],
      allBones: [entry],
      skeleton: { update: () => {} }
    };
    expect(() => resetOctoGlbRigV1(rig, 1)).not.toThrow();
    expect(() =>
      animateOctoGlbRigV1(rig, 0, { live: false }, {}, 1 / 60)
    ).not.toThrow();
    expect(rig.motion).toBeUndefined();
  });
});
