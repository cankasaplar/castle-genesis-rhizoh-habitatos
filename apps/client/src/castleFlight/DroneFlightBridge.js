import * as THREE from "three";
import { latLonToSceneXZ, sceneXZToLatLon, ISTANBUL_POI } from "./geo.js";
import { getCastleFlightConfig } from "./castleFlightConfig.js";
import { createEnvelope } from "@castle/protocol";
import { WS_MESSAGE } from "@castle/protocol";
import { publishCastleTelemetry } from "./telemetryHub.js";

export { subscribeCastleDroneTelemetry } from "./telemetryHub.js";

/**
 * 3B şehir üzerinde drone görselleştirme + opsiyonel WS telemetri + gateway relay.
 */
export class DroneFlightBridge {
  constructor(sceneGroup, config = getCastleFlightConfig()) {
    this.config = config;
    this.root = new THREE.Group();
    this.root.name = "CastleDroneFleet";
    sceneGroup.add(this.root);
    this.drones = [];
    this.ws = null;
    this.gatewayWs = null;
    this._telemetryAcc = 0;
    this._lastGatewayPush = 0;
    this._livePoses = new Map();
  }

  startSimulated() {
    const n = this.config.simulatedDroneCount;
    const hub = latLonToSceneXZ(ISTANBUL_POI.FATIH.lat, ISTANBUL_POI.FATIH.lon);
    const palette = [0x00ffff, 0xff6600, 0x88ff00, 0xff00aa, 0xffffff];
    for (let i = 0; i < n; i++) {
      const mesh = this._makeDroneMesh(palette[i % palette.length]);
      const phase = (i / n) * Math.PI * 2;
      const radius = 400 + i * 220;
      const speed = 0.12 + i * 0.02;
      this.root.add(mesh);
      this.drones.push({
        id: `SIM-DRONE-${i + 1}`,
        mesh,
        hubX: hub.x,
        hubZ: hub.z,
        phase,
        radius,
        speed,
        altBase: 160 + i * 35
      });
    }
  }

  _makeDroneMesh(color) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(44, 12, 66),
      new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25, emissive: color, emissiveIntensity: 0.15 })
    );
    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(36, 36, 4, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 })
    );
    rotor.position.y = 14;
    const g = new THREE.Group();
    g.add(body);
    g.add(rotor);
    return g;
  }

  connectTelemetryWs(url) {
    if (!url || typeof WebSocket === "undefined") return;
    try {
      this._closeWs();
      this.ws = new WebSocket(url);
      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          this._applyTelemetryPose(data);
        } catch {
          /* ignore */
        }
      };
      this.ws.onerror = () => {};
    } catch {
      /* ignore */
    }
  }

  connectGatewayMirror(gatewayUrl, token = "") {
    if (!gatewayUrl || typeof WebSocket === "undefined") return;
    try {
      if (this.gatewayWs) {
        try {
          this.gatewayWs.close();
        } catch {
          /* ignore */
        }
        this.gatewayWs = null;
      }
      const q = token ? `?token=${encodeURIComponent(token)}` : "";
      this.gatewayWs = new WebSocket(`${gatewayUrl}${q}`);
      this.gatewayWs.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === WS_MESSAGE.DRONE_TELEMETRY && msg.payload) {
            const p = msg.payload;
            if (Array.isArray(p.drones)) {
              for (const d of p.drones) this._applyTelemetryPose(d);
            } else {
              this._applyTelemetryPose(p);
            }
          }
        } catch {
          /* ignore */
        }
      };
    } catch {
      /* ignore */
    }
  }

  _applyTelemetryPose(data) {
    const id = String(data.id || "unknown");
    const lat = Number(data.lat);
    const lon = Number(data.lon);
    const alt = Number(data.alt ?? 120);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const { x, z } = latLonToSceneXZ(lat, lon);
    this._livePoses.set(id, { x, y: alt, z, lat, lon, yaw: data.yaw });
    publishCastleTelemetry({ id, lat, lon, alt, source: "live" });
  }

  tick(simTime, dt) {
    for (const d of this.drones) {
      const ang = simTime * d.speed + d.phase;
      const x = d.hubX + Math.cos(ang) * d.radius;
      const z = d.hubZ + Math.sin(ang) * d.radius * 0.85;
      const y = d.altBase + Math.sin(simTime * 1.7 + d.phase) * 28;
      d.mesh.position.set(x, y, z);
      d.mesh.rotation.y = -ang + Math.PI / 2;
    }

    this._telemetryAcc += dt;
    const interval = 1 / Math.max(8, Math.min(60, this.config.telemetryMaxHz));
    if (this._telemetryAcc < interval) return;
    this._telemetryAcc = 0;

    const batch = [];
    for (const d of this.drones) {
      const { lat, lon } = sceneXZToLatLon(d.mesh.position.x, d.mesh.position.z);
      const payload = {
        id: d.id,
        lat,
        lon,
        alt: d.mesh.position.y,
        simTime,
        source: "simulated"
      };
      publishCastleTelemetry(payload);
      batch.push(payload);
    }

    const now = performance.now();
    if (now - this._lastGatewayPush > 180 && batch.length && this.gatewayWs?.readyState === 1) {
      this._lastGatewayPush = now;
      try {
        this.gatewayWs.send(JSON.stringify(createEnvelope(WS_MESSAGE.DRONE_TELEMETRY, { drones: batch, ts: Date.now() })));
      } catch {
        /* ignore */
      }
    }
  }

  _closeWs() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
  }

  dispose() {
    this._closeWs();
    if (this.gatewayWs) {
      try {
        this.gatewayWs.close();
      } catch {
        /* ignore */
      }
      this.gatewayWs = null;
    }
    while (this.root.children.length) {
      const o = this.root.children[0];
      this.root.remove(o);
      o.traverse((x) => {
        if (x.geometry) x.geometry.dispose();
        if (x.material) x.material.dispose();
      });
    }
    if (this.root.parent) this.root.parent.remove(this.root);
  }
}
