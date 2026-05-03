import * as Cesium from "cesium";
import { CESIUM_SCENE_BUDGET, trimPolylineTrailBudget } from "./cesiumSceneBudget.js";

/**
 * ECS / runtime → Cesium görünür dünya (D: hero semantics, core heart, governance tint).
 * window.__CASTLE_WORLD_PROJECTION__ üzerinden beslenir.
 */

function finiteOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const CLAMP_LAT_MAX = 85;

/**
 * PVS / Cartesian blow-up önleme — geçersiz veya uç değerleri reddeder veya sıkıştırır.
 * @returns {{ lon: number, lat: number, alt: number } | null}
 */
export function clampLonLatAlt(lon, lat, alt) {
  const lo = Number(lon);
  const la = Number(lat);
  const a = alt === undefined || alt === null ? 120 : Number(alt);
  if (!Number.isFinite(lo) || !Number.isFinite(la)) return null;
  const clon = Math.max(-180, Math.min(180, lo));
  const clat = Math.max(-CLAMP_LAT_MAX, Math.min(CLAMP_LAT_MAX, la));
  const ca = Number.isFinite(a) ? Math.max(-500, Math.min(50_000_000, a)) : 120;
  return { lon: clon, lat: clat, alt: ca };
}

function cesiumTimeSeconds(t) {
  if (typeof t === "number" && Number.isFinite(t)) return t;
  if (t && typeof t === "object") {
    try {
      return Cesium.JulianDate.toDate(t).getTime() / 1000;
    } catch {
      /* noop */
    }
  }
  return performance.now() / 1000;
}

function enuToCartesian(lon, lat, altM, eastM, northM, upM) {
  const safeLon = finiteOr(lon, 28.9784);
  const safeLat = finiteOr(lat, 41.0082);
  const safeAlt = finiteOr(altM, 120);
  const safeEast = finiteOr(eastM, 0);
  const safeNorth = finiteOr(northM, 0);
  const safeUp = finiteOr(upM, 0);
  const center = Cesium.Cartesian3.fromDegrees(safeLon, safeLat, safeAlt);
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  const local = new Cesium.Cartesian3(safeEast, safeNorth, safeUp);
  return Cesium.Matrix4.multiplyByPoint(enu, local, new Cesium.Cartesian3());
}

function lerpGreatCirclePositions(lon1, lat1, a1, lon2, lat2, a2, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(
      Cesium.Cartesian3.fromDegrees(
        lon1 + (lon2 - lon1) * t,
        lat1 + (lat2 - lat1) * t,
        a1 + (a2 - a1) * t
      )
    );
  }
  return pts;
}

function readGovPack() {
  return typeof window !== "undefined" ? window.__CASTLE_WORLD_PROJECTION__ : null;
}

/** FROZEN: neredeyse duran dünya; RECOVERY: sessizlik → tek pulse → yayılım. */
function governanceMotionScale() {
  const pack = readGovPack();
  if (!pack) return 1;
  const g = String(pack.governance || "NORMAL").toUpperCase();
  const entered = Number(pack.governanceEnteredAt) || Number(pack.ts) || Date.now();
  const elapsed = (Date.now() - entered) / 1000;
  if (g === "FROZEN") return 0.045;
  if (g === "RECOVERY") {
    if (elapsed < 2.6) return 0.06;
    if (elapsed < 4.5) {
      const u = (elapsed - 2.6) / 1.9;
      return 0.1 + Math.sin(u * Math.PI) * 0.9;
    }
    return Math.min(1, 0.2 + ((elapsed - 4.5) / 4) * 0.8);
  }
  return 1;
}

function governanceTrailStrength() {
  const pack = readGovPack();
  if (!pack) return 1;
  const g = String(pack.governance || "NORMAL").toUpperCase();
  if (g === "FROZEN") return 0.12;
  const entered = Number(pack.governanceEnteredAt) || Number(pack.ts) || Date.now();
  const elapsed = (Date.now() - entered) / 1000;
  if (g === "RECOVERY") {
    if (elapsed < 2.6) return 0.16;
    if (elapsed < 4.5) return 0.32 + ((elapsed - 2.6) / 1.9) * 0.38;
    return Math.min(1, 0.48 + ((elapsed - 4.5) / 4) * 0.52);
  }
  return 1;
}

function applyJoinPresenceRippleBoost(b, out) {
  const joinUntil = Number(b?.joinPresenceUntil) || 0;
  if (joinUntil <= Date.now()) return out;
  const j = 1.36;
  return {
    speed: out.speed * 1.14,
    ampM: out.ampM * j,
    ampMJ: out.ampMJ * j,
    alpha: Math.min(0.26, out.alpha * 1.2),
    breathAmp: out.breathAmp + 0.04
  };
}

/** Broadcaster ripple: ROUTING hızlı, LIVE stabil nabız, COOLDOWN geniş yavaş, ARCHIVED sakin. */
function broadcastRippleVisual(t) {
  const pack = readGovPack();
  const b = pack?.broadcastEmphasis;
  const phase = String(b?.phase || "").toUpperCase();
  const base = 0.35;
  let out;
  if (phase === "ROUTING") {
    out = { speed: base * 3.12, ampM: 172, ampMJ: 204, alpha: 0.22, breathAmp: 0 };
  } else if (phase === "COOLDOWN") {
    out = { speed: base * 0.36, ampM: 208, ampMJ: 252, alpha: 0.092, breathAmp: 0 };
  } else if (phase === "ARCHIVED") {
    out = { speed: base * 0.19, ampM: 110, ampMJ: 132, alpha: 0.058, breathAmp: 0 };
  } else if (phase === "LIVE") {
    out = { speed: base * 0.78, ampM: 156, ampMJ: 186, alpha: 0.155, breathAmp: 0.072 };
  } else if (b?.active && b?.until > Date.now()) {
    out = { speed: base * 0.95, ampM: 160, ampMJ: 190, alpha: 0.148, breathAmp: 0.028 };
  } else {
    out = { speed: base, ampM: 160, ampMJ: 190, alpha: 0.135, breathAmp: 0 };
  }
  return applyJoinPresenceRippleBoost(b, out);
}

/** Preset: geometry + kurallar (rewrite yok — genişletilmiş tek tablo). */
function presetForAvatarKey(key) {
  const Color = Cesium.Color;
  const base = {
    color: Color.WHITE,
    point: 10,
    min: 58,
    maj: 86,
    line: 2,
    geometry: "default",
    animationRule: "idleBreath",
    trailRule: "standardGlow",
    interactionRule: "none"
  };
  const presets = {
    scout: {
      ...base,
      color: Color.YELLOW,
      point: 11,
      min: 72,
      maj: 98,
      line: 3,
      geometry: "beam",
      animationRule: "beamHeightOscillation",
      trailRule: "tightGlow",
      interactionRule: "focusPing"
    },
    curator: {
      ...base,
      color: Color.MEDIUMORCHID,
      point: 12,
      min: 92,
      maj: 128,
      line: 3,
      geometry: "orbitHalo",
      animationRule: "dualRingDrift",
      trailRule: "softGlow",
      interactionRule: "latticeSnap"
    },
    archivist: {
      ...base,
      color: Color.SKYBLUE,
      point: 10,
      min: 78,
      maj: 112,
      line: 3,
      geometry: "archiveRibbon",
      animationRule: "ribbonFlow",
      trailRule: "coolGlow",
      interactionRule: "traceRead"
    },
    builder: {
      ...base,
      color: Color.LIME,
      point: 12,
      min: 76,
      maj: 118,
      line: 3,
      geometry: "radialPulse",
      animationRule: "constructPulse",
      trailRule: "brightGlow",
      interactionRule: "patchApply"
    },
    sentinel: {
      ...base,
      color: Color.ORANGERED,
      point: 13,
      min: 88,
      maj: 124,
      line: 3,
      geometry: "shieldShell",
      animationRule: "shieldShell",
      trailRule: "armoredGlow",
      interactionRule: "blockPulse"
    },
    broadcaster: {
      ...base,
      color: Color.FUCHSIA,
      point: 14,
      min: 102,
      maj: 148,
      line: 4,
      geometry: "rippleEmission",
      animationRule: "rippleEmission",
      trailRule: "broadcastGlow",
      interactionRule: "waveFan"
    },
    navigator: {
      ...base,
      color: Color.DEEPSKYBLUE,
      point: 11,
      min: 68,
      maj: 102,
      line: 3,
      geometry: "routeArc",
      animationRule: "routeArc",
      trailRule: "vectorGlow",
      interactionRule: "waypointLock"
    },
    rhizoh: {
      ...base,
      color: Color.CYAN,
      point: 18,
      min: 150,
      maj: 200,
      line: 5,
      geometry: "default",
      animationRule: "coreHarmonic",
      trailRule: "coreTrail",
      interactionRule: "sovereign"
    },
    hero: {
      ...base,
      color: Color.WHITE,
      point: 9,
      min: 52,
      maj: 78,
      line: 2,
      geometry: "default",
      animationRule: "idleBreath",
      trailRule: "standardGlow",
      interactionRule: "none"
    }
  };
  return { ...base, ...(presets[key] || presets.hero) };
}

function trailMaterialForRule(pr) {
  const c = pr.color;
  const rules = {
    standardGlow: { glow: 0.2, alpha: 0.62 },
    tightGlow: { glow: 0.26, alpha: 0.72 },
    softGlow: { glow: 0.14, alpha: 0.5 },
    coolGlow: { glow: 0.18, alpha: 0.58 },
    brightGlow: { glow: 0.24, alpha: 0.68 },
    armoredGlow: { glow: 0.16, alpha: 0.55 },
    broadcastGlow: { glow: 0.28, alpha: 0.7 },
    vectorGlow: { glow: 0.22, alpha: 0.64 },
    coreTrail: { glow: 0.3, alpha: 0.75 }
  };
  const r = rules[pr.trailRule] || rules.standardGlow;
  return new Cesium.PolylineGlowMaterialProperty({
    glowPower: r.glow,
    color: c.withAlpha(r.alpha)
  });
}

function trailMaterialForRuleDynamic(pr) {
  const c = pr.color;
  const rules = {
    standardGlow: { glow: 0.2, alpha: 0.62 },
    tightGlow: { glow: 0.26, alpha: 0.72 },
    softGlow: { glow: 0.14, alpha: 0.5 },
    coolGlow: { glow: 0.18, alpha: 0.58 },
    brightGlow: { glow: 0.24, alpha: 0.68 },
    armoredGlow: { glow: 0.16, alpha: 0.55 },
    broadcastGlow: { glow: 0.28, alpha: 0.7 },
    vectorGlow: { glow: 0.22, alpha: 0.64 },
    coreTrail: { glow: 0.3, alpha: 0.75 }
  };
  const r = rules[pr.trailRule] || rules.standardGlow;
  return new Cesium.PolylineGlowMaterialProperty({
    glowPower: new Cesium.CallbackProperty(() => r.glow * governanceTrailStrength(), false),
    color: new Cesium.CallbackProperty(() => c.withAlpha(r.alpha * governanceTrailStrength()), false)
  });
}

export function installCesiumWorldProjectionBind(viewer, fatih) {
  if (!viewer || viewer.isDestroyed?.()) return () => {};

  /** id -> { entities: Entity[] } */
  const heroBundles = new Map();
  /** id -> { lon, lat, alt } — CallbackProperty grafikleri güncel konumu okur */
  const heroKinematics = new Map();
  const trails = new Map();
  let anchorEntity = null;
  let swarmEntity = null;
  let memPrimitive = null;
  let lastMemPackTs = 0;

  let coreHeartBundle = null;
  let lastGovernanceKey = "";
  const crystallineEntities = [];

  function destroyCrystallineGrid() {
    while (crystallineEntities.length) {
      const ent = crystallineEntities.pop();
      try {
        viewer.entities.remove(ent);
      } catch {
        /* noop */
      }
    }
  }

  function ensureCrystallineGrid() {
    const pack = readGovPack();
    const g = String(pack?.governance || "NORMAL").toUpperCase();
    if (g !== "FROZEN") {
      destroyCrystallineGrid();
      return;
    }
    if (crystallineEntities.length) return;
    const L = 400;
    const nRays = 10;
    const baseAlt = 268;
    for (let i = 0; i < nRays; i++) {
      const ang = (i / nRays) * Math.PI * 2;
      const e = Math.cos(ang) * L;
      const n = Math.sin(ang) * L;
      const p1 = enuToCartesian(fatih.lon, fatih.lat, baseAlt, 0, 0, 0);
      const p2 = enuToCartesian(fatih.lon, fatih.lat, baseAlt, e, n, 0);
      const phase = i * 0.51;
      crystallineEntities.push(
        viewer.entities.add({
          polyline: {
            positions: [p1, p2],
            width: new Cesium.CallbackProperty(
              () => 1.1 + Math.abs(Math.sin(performance.now() / 220 + phase)) * 4.2,
              false
            ),
            material: new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const a = 0.1 + Math.abs(Math.sin(performance.now() / 260 + phase)) * 0.68;
                return Cesium.Color.fromHsl(0.52, 0.95, 0.72, a);
              }, false)
            )
          }
        })
      );
    }
  }

  function pushTrail(id, lon, lat, alt, pr) {
    const g = String(readGovPack()?.governance || "NORMAL").toUpperCase();
    if (g === "FROZEN" && Math.random() > 0.09) return;

    const c = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
    let arr = trails.get(id);
    if (!arr) {
      arr = [];
      trails.set(id, arr);
    }
    const minDist = pr.trailRule === "tightGlow" ? 0.8 : 1.5;
    const last = arr.length ? arr[arr.length - 1] : null;
    if (last && Cesium.Cartesian3.distance(last, c) < minDist) return;
    arr.push(c);
    let maxPts = pr.geometry === "archiveRibbon" ? 32 : 24;
    if (g === "FROZEN") maxPts = 7;
    else if (g === "RECOVERY") maxPts = Math.min(maxPts, 14);
    if (arr.length > maxPts) arr.shift();
    trimPolylineTrailBudget(trails, CESIUM_SCENE_BUDGET.MAX_POLYLINE_POINTS_TOTAL);
  }

  function removeHeroBundle(id) {
    const b = heroBundles.get(id);
    if (!b) return;
    for (const ent of b.entities) {
      try {
        viewer.entities.remove(ent);
      } catch {
        /* noop */
      }
    }
    heroBundles.delete(id);
    heroKinematics.delete(id);
    trails.delete(id);
  }

  function ensureAnchor() {
    if (anchorEntity) return;
    anchorEntity = viewer.entities.add({
      id: "castle-live-anchor",
      position: Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 280),
      point: {
        pixelSize: new Cesium.CallbackProperty((t) => {
          const g = String(readGovPack()?.governance || "NORMAL").toUpperCase();
          if (g === "FROZEN") return 11;
          const m = governanceMotionScale();
          return 15 + Math.sin(t * 2.2 * m) * 5;
        }, false),
        color: Cesium.Color.AQUA,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      ellipse: {
        semiMinorAxis: 280,
        semiMajorAxis: 380,
        height: 8,
        material: Cesium.Color.CYAN.withAlpha(0.2)
      },
      cylinder: {
        length: 900,
        topRadius: 0,
        bottomRadius: 72,
        material: Cesium.Color.CYAN.withAlpha(0.26)
      }
    });
  }

  function ensureRhizohCoreHeart() {
    if (coreHeartBundle) return;
    const lon = fatih.lon;
    const lat = fatih.lat;
    const coreAlt = 410;
    const orbitR = 195;
    const phases = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

    const harmonicRing = viewer.entities.add({
      id: "rhizoh-core-harmonic-ring",
      position: Cesium.Cartesian3.fromDegrees(lon, lat, coreAlt),
      ellipse: {
        semiMinorAxis: new Cesium.CallbackProperty((t) => {
          const m = governanceMotionScale();
          return 240 + Math.sin(t * 0.55 * m) * 28;
        }, false),
        semiMajorAxis: new Cesium.CallbackProperty((t) => {
          const m = governanceMotionScale();
          return 310 + Math.cos(t * 0.48 * m) * 34;
        }, false),
        height: 6,
        material: Cesium.Color.CYAN.withAlpha(0.18)
      }
    });

    const mainOrb = viewer.entities.add({
      id: "rhizoh-core-orb",
      position: Cesium.Cartesian3.fromDegrees(lon, lat, coreAlt + 12),
      ellipsoid: {
        radii: new Cesium.CallbackProperty((t) => {
          const m = governanceMotionScale();
          const b = 38 + Math.sin(t * 0.9 * m) * 7;
          return new Cesium.Cartesian3(b, b, b + 4);
        }, false),
        material: Cesium.Color.CYAN.withAlpha(0.42),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.35),
        outlineWidth: 1
      }
    });

    const sats = phases.map((ph, i) =>
      viewer.entities.add({
        id: `rhizoh-core-sat-${i}`,
        position: new Cesium.CallbackProperty((t) => {
          const ts = cesiumTimeSeconds(t);
          const m = governanceMotionScale();
          const a = ts * 0.11 * m + ph;
          const up = Math.sin(ts * 0.35 * m + ph) * 22;
          return enuToCartesian(lon, lat, coreAlt - 10 + up, Math.cos(a) * orbitR, Math.sin(a) * orbitR, 0);
        }, false),
        point: {
          pixelSize: 11,
          color: Cesium.Color.TURQUOISE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1.5
        }
      })
    );

    const links = phases.map((ph, i) =>
      viewer.entities.add({
        id: `rhizoh-core-link-${i}`,
        polyline: {
          width: 2,
          material: Cesium.Color.CYAN.withAlpha(0.42),
          positions: new Cesium.CallbackProperty((t) => {
            const ts = cesiumTimeSeconds(t);
            const m = governanceMotionScale();
            const core = Cesium.Cartesian3.fromDegrees(lon, lat, coreAlt + 12);
            const a = ts * 0.11 * m + ph;
            const up = Math.sin(ts * 0.35 * m + ph) * 22;
            const sat = enuToCartesian(lon, lat, coreAlt - 10 + up, Math.cos(a) * orbitR, Math.sin(a) * orbitR, 0);
            return [core, sat];
          }, false)
        }
      })
    );

    coreHeartBundle = {
      entities: [harmonicRing, mainOrb, ...sats, ...links]
    };
  }

  function destroyCoreHeart() {
    if (!coreHeartBundle) return;
    for (const ent of coreHeartBundle.entities) {
      try {
        viewer.entities.remove(ent);
      } catch {
        /* noop */
      }
    }
    coreHeartBundle = null;
  }

  function applyGovernanceAtmosphere(governance) {
    const g = String(governance || "NORMAL").toUpperCase();
    if (g === lastGovernanceKey) return;
    lastGovernanceKey = g;

    const scene = viewer.scene;
    const globe = scene.globe;
    const sky = scene.skyAtmosphere;

    const reset = () => {
      globe.atmosphereLightIntensity = 1.0;
      if (sky && sky.brightnessShift !== undefined) sky.brightnessShift = 0;
      if (sky && sky.hueShift !== undefined) sky.hueShift = 0;
      scene.fog.enabled = false;
    };

    if (g === "NORMAL") {
      reset();
      return;
    }

    scene.fog.enabled = true;

    if (g === "FROZEN") {
      globe.atmosphereLightIntensity = 0.36;
      scene.fog.density = 1.82e-4;
      scene.fog.color = Cesium.Color.fromCssColorString("#120a22");
      if (sky && sky.brightnessShift !== undefined) sky.brightnessShift = -0.2;
      if (sky && sky.hueShift !== undefined) sky.hueShift = -0.08;
    } else if (g === "RECOVERY") {
      globe.atmosphereLightIntensity = 0.78;
      scene.fog.density = 6.5e-5;
      scene.fog.color = Cesium.Color.fromCssColorString("#1a1030");
      if (sky && sky.brightnessShift !== undefined) sky.brightnessShift = -0.04;
      if (sky && sky.hueShift !== undefined) sky.hueShift = 0.08;
    } else if (g === "DEGRADED") {
      globe.atmosphereLightIntensity = 0.68;
      scene.fog.density = 8.8e-5;
      scene.fog.color = Cesium.Color.fromCssColorString("#24180a");
      if (sky && sky.brightnessShift !== undefined) sky.brightnessShift = -0.06;
      if (sky && sky.hueShift !== undefined) sky.hueShift = 0.05;
    } else {
      reset();
    }
  }

  function createHeroBundle(id, h, pr, lon, lat, alt) {
    const entities = [];
    const trailMat = trailMaterialForRuleDynamic(pr);

    const main = viewer.entities.add({
      id: `hero-${id}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
      point: {
        pixelSize:
          pr.animationRule === "constructPulse"
            ? new Cesium.CallbackProperty((t) => {
                const m = governanceMotionScale();
                return pr.point + Math.sin(t * 2.8 * m) * 3;
              }, false)
            : pr.point,
        color: pr.color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1.5
      },
      ellipse: {
        semiMinorAxis:
          pr.geometry === "radialPulse"
            ? new Cesium.CallbackProperty((t) => {
                const m = governanceMotionScale();
                return pr.min + Math.sin(t * 2.2 * m) * 16;
              }, false)
            : pr.min,
        semiMajorAxis:
          pr.geometry === "radialPulse"
            ? new Cesium.CallbackProperty((t) => {
                const m = governanceMotionScale();
                return pr.maj + Math.cos(t * 2.0 * m) * 18;
              }, false)
            : pr.maj,
        height: 2,
        material: pr.color.withAlpha(pr.geometry === "shieldShell" ? 0.12 : 0.24)
      },
      label: {
        text: String(h.avatarLabel || id),
        font: "11px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        pixelOffset: new Cesium.Cartesian2(0, -28),
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.55),
        scale: 0.85,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 320000)
      },
      polyline: {
        positions: new Cesium.CallbackProperty(() => trails.get(id) || [], false),
        width: pr.line,
        material: trailMat
      }
    });
    entities.push(main);

    if (pr.geometry === "beam") {
      const beam = viewer.entities.add({
        id: `hero-${id}-beam`,
        position: new Cesium.CallbackProperty((t) => {
          const k = heroKinematics.get(id);
          if (!k) return Cesium.Cartesian3.fromDegrees(lon, lat, alt);
          const m = governanceMotionScale();
          const len = 340 + Math.sin(t * 1.65 * m) * 95;
          return Cesium.Cartesian3.fromDegrees(k.lon, k.lat, k.alt + len * 0.5);
        }, false),
        cylinder: {
          length: new Cesium.CallbackProperty((t) => {
            const m = governanceMotionScale();
            return 340 + Math.sin(t * 1.65 * m) * 95;
          }, false),
          topRadius: 1.5,
          bottomRadius: 11,
          material: pr.color.withAlpha(0.38)
        }
      });
      entities.push(beam);
    }

    if (pr.geometry === "orbitHalo") {
      const ring = viewer.entities.add({
        id: `hero-${id}-halo`,
        polyline: {
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.22,
            color: pr.color.withAlpha(0.55)
          }),
          positions: new Cesium.CallbackProperty((t) => {
            const k = heroKinematics.get(id) || { lon, lat, alt };
            const m = governanceMotionScale();
            const rad = 78 + Math.sin(t * 0.85 * m) * 14;
            const n = 26;
            const arr = [];
            for (let i = 0; i <= n; i++) {
              const a = (i / n) * Math.PI * 2 + t * 0.28 * m;
              arr.push(enuToCartesian(k.lon, k.lat, k.alt, Math.cos(a) * rad, Math.sin(a) * rad, 0));
            }
            return arr;
          }, false)
        }
      });
      const ring2 = viewer.entities.add({
        id: `hero-${id}-halo2`,
        polyline: {
          width: 2,
          material: pr.color.withAlpha(0.35),
          positions: new Cesium.CallbackProperty((t) => {
            const k = heroKinematics.get(id) || { lon, lat, alt };
            const m = governanceMotionScale();
            const rad = 58 + Math.cos(t * 1.1 * m) * 10;
            const n = 22;
            const arr = [];
            for (let i = 0; i <= n; i++) {
              const a = (i / n) * Math.PI * 2 - t * 0.2 * m;
              arr.push(enuToCartesian(k.lon, k.lat, k.alt + 22, Math.cos(a) * rad, Math.sin(a) * rad, 0));
            }
            return arr;
          }, false)
        }
      });
      entities.push(ring, ring2);
    }

    if (pr.geometry === "archiveRibbon") {
      const ribbon = viewer.entities.add({
        id: `hero-${id}-ribbon`,
        polyline: {
          width: 2,
          material: pr.color.withAlpha(0.5),
          positions: new Cesium.CallbackProperty((t) => {
            const k = heroKinematics.get(id) || { lon, lat, alt };
            const m = governanceMotionScale();
            const steps = 20;
            const arr = [];
            for (let i = 0; i <= steps; i++) {
              const u = i / steps;
              const wave = Math.sin(u * 6 + t * 1.2 * m) * 18;
              arr.push(
                enuToCartesian(
                  k.lon,
                  k.lat,
                  k.alt - 15 + u * 95,
                  Math.cos(u * Math.PI * 2 + t * 0.15 * m) * wave * 0.08,
                  Math.sin(u * Math.PI * 2 + t * 0.15 * m) * wave * 0.08,
                  0
                )
              );
            }
            return arr;
          }, false)
        }
      });
      entities.push(ribbon);
    }

    if (pr.geometry === "shieldShell") {
      const shell = viewer.entities.add({
        id: `hero-${id}-shield`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        ellipsoid: {
          radii: new Cesium.Cartesian3(92, 92, 108),
          material: pr.color.withAlpha(0.14),
          outlineColor: pr.color.withAlpha(0.45),
          outlineWidth: 1
        }
      });
      entities.push(shell);
    }

    if (pr.geometry === "rippleEmission") {
      for (let k = 0; k < 2; k++) {
        const phase = k * 1.7;
        entities.push(
          viewer.entities.add({
            id: `hero-${id}-ripple-${k}`,
            position: Cesium.Cartesian3.fromDegrees(lon, lat, alt - 4),
            ellipse: {
              semiMinorAxis: new Cesium.CallbackProperty((t) => {
                const rv = broadcastRippleVisual(t);
                const m = governanceMotionScale();
                const spd = rv.speed * m * (1 + Math.sin(t * 2.08) * rv.breathAmp);
                const p = ((t * spd + phase) % 2.4) / 2.4;
                return 40 + p * rv.ampM;
              }, false),
              semiMajorAxis: new Cesium.CallbackProperty((t) => {
                const rv = broadcastRippleVisual(t);
                const m = governanceMotionScale();
                const spd = rv.speed * m * (1 + Math.sin(t * 2.08) * rv.breathAmp);
                const p = ((t * spd + phase) % 2.4) / 2.4;
                return 52 + p * rv.ampMJ;
              }, false),
              height: 1,
              material: new Cesium.ColorMaterialProperty(
                new Cesium.CallbackProperty((t) => {
                  const rv = broadcastRippleVisual(t);
                  return pr.color.withAlpha(rv.alpha);
                }, false)
              )
            }
          })
        );
      }
    }

    if (pr.geometry === "routeArc") {
      const arc = viewer.entities.add({
        id: `hero-${id}-arc`,
        polyline: {
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.DEEPSKYBLUE.withAlpha(0.5)
          }),
          positions: new Cesium.CallbackProperty(() => {
            const k = heroKinematics.get(id) || { lon, lat, alt };
            return lerpGreatCirclePositions(k.lon, k.lat, k.alt + 20, fatih.lon, fatih.lat, 260, 10);
          }, false)
        }
      });
      entities.push(arc);
    }

    heroBundles.set(id, { entities });
  }

  function syncHeroBundle(id, h, pr, lon, lat, alt) {
    const b = heroBundles.get(id);
    if (!b || !b.entities[0]) return;
    const main = b.entities[0];
    main.position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
    main.label.text = String(h.avatarLabel || id);

    if (pr.geometry === "shieldShell") {
      const shell = b.entities.find((e) => String(e.id).endsWith("-shield"));
      if (shell) shell.position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
    }
    if (pr.geometry === "rippleEmission") {
      for (const e of b.entities) {
        if (String(e.id).includes("-ripple-")) {
          e.position = Cesium.Cartesian3.fromDegrees(lon, lat, alt - 4);
        }
      }
    }
  }

  function ensureSwarmEntity() {
    if (swarmEntity) return;
    swarmEntity = viewer.entities.add({
      id: "swarm-flow-arc",
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          const p = window.__CASTLE_WORLD_PROJECTION__;
          if (!p?.swarmActive || !(p.heroes || []).length) return [];
          const pts = [];
          for (const h of p.heroes.slice(0, 16)) {
            const g = clampLonLatAlt(h.lon, h.lat, h.alt ?? 95);
            if (g) pts.push(Cesium.Cartesian3.fromDegrees(g.lon, g.lat, g.alt));
          }
          pts.push(Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 150));
          return pts;
        }, false),
        width: 5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: new Cesium.CallbackProperty(() => 0.22 * governanceTrailStrength(), false),
          color: new Cesium.CallbackProperty(() => Cesium.Color.FUCHSIA.withAlpha(0.55 * governanceTrailStrength()), false)
        })
      }
    });
  }

  function syncMemoryConstellation(nodes) {
    const n = Math.min(48, nodes?.length || 0);
    if (!memPrimitive) {
      memPrimitive = new Cesium.PointPrimitiveCollection();
      viewer.scene.primitives.add(memPrimitive);
    }
    memPrimitive.removeAll();
    for (let i = 0; i < n; i++) {
      const m = nodes[i];
      const g = clampLonLatAlt(m.lon, m.lat, m.alt ?? 160);
      if (!g) continue;
      memPrimitive.add({
        position: Cesium.Cartesian3.fromDegrees(g.lon, g.lat, g.alt),
        pixelSize: 4 + (i % 4),
        color: Cesium.Color.fromHsl(0.12 + (i % 10) * 0.07, 0.85, 0.55, 0.88),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1
      });
    }
  }

  let projectionRoundRobin = 0;

  const onPreRender = () => {
    const pack = window.__CASTLE_WORLD_PROJECTION__;
    if (!pack || viewer.isDestroyed()) return;

    const tick = projectionRoundRobin++ % 4;

    ensureAnchor();
    ensureRhizohCoreHeart();
    applyGovernanceAtmosphere(pack.governance);
    ensureCrystallineGrid();

    if (tick === 0 || tick === 3) {
      const alive = new Set();
      for (const h of pack.heroes || []) {
        const id = String(h.id || "");
        if (!id) continue;
        if ((h.avatarKey || "") === "rhizoh") continue;

        const geo = clampLonLatAlt(h.lon, h.lat, h.alt ?? 120);
        if (!geo) continue;

        alive.add(id);
        const pr = presetForAvatarKey(h.avatarKey || "hero");
        const { lon, lat, alt } = geo;
        heroKinematics.set(id, { lon, lat, alt });
        pushTrail(id, lon, lat, alt, pr);

        if (!heroBundles.has(id)) {
          createHeroBundle(id, h, pr, lon, lat, alt);
        } else {
          syncHeroBundle(id, h, pr, lon, lat, alt);
        }
      }

      for (const id of [...heroBundles.keys()]) {
        if (!alive.has(id)) removeHeroBundle(id);
      }
    }

    if (tick === 1 && pack.ts !== lastMemPackTs) {
      lastMemPackTs = pack.ts;
      syncMemoryConstellation(pack.memoryConstellation || []);
    }

    if (pack.swarmActive && (pack.heroes || []).length > 1) {
      ensureSwarmEntity();
      swarmEntity.show = true;
    } else if (swarmEntity) {
      swarmEntity.show = false;
    }

    /* requestRenderMode: preRender içinde requestRender basıncı render kuyruğunu şişirebilir; kare zaten işleniyor. */
  };

  viewer.scene.preRender.addEventListener(onPreRender);

  return () => {
    viewer.scene.preRender.removeEventListener(onPreRender);
    for (const id of [...heroBundles.keys()]) removeHeroBundle(id);
    trails.clear();
    destroyCrystallineGrid();
    destroyCoreHeart();
    if (anchorEntity) {
      try {
        viewer.entities.remove(anchorEntity);
      } catch {
        /* noop */
      }
      anchorEntity = null;
    }
    if (swarmEntity) {
      try {
        viewer.entities.remove(swarmEntity);
      } catch {
        /* noop */
      }
      swarmEntity = null;
    }
    if (memPrimitive) {
      try {
        viewer.scene.primitives.remove(memPrimitive);
      } catch {
        /* noop */
      }
      memPrimitive = null;
    }
    lastGovernanceKey = "";
  };
}
