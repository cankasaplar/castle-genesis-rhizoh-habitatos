import React, { useState, useRef, useEffect, useSyncExternalStore, useCallback, memo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Globe,
  Atom,
  ShieldAlert,
  Satellite,
  Target,
  Layers,
  Info,
  Mic,
  Send,
  Map as MapIcon,
  Orbit,
  Activity,
  Network,
  GraduationCap,
  Cpu,
  Camera,
  Navigation2
} from "lucide-react";
import SovereignRuntimePanel from "./sovereign/SovereignRuntimePanel.jsx";
import { sovereignRuntimeSingleton } from "./sovereign/sovereignRuntimeSpec.js";
import { ISTANBUL_GEO, ISTANBUL_POI, latLonToSceneXZ } from "./castleFlight/geo.js";
import { getCastleFlightConfig } from "./castleFlight/castleFlightConfig.js";
import { DroneFlightBridge } from "./castleFlight/DroneFlightBridge.js";
import "./castleFlight/registerGlobals.js";
import CastleFlightHud from "./castleFlight/CastleFlightHud.jsx";
import CesiumRealMapLayer from "./castleFlight/CesiumRealMapLayer.jsx";
import { useCastleAuth } from "./firebase/useCastleAuth.js";
import { CastleAuthOverlay, CastleAccountBadge } from "./auth/CastleAuthOverlay.jsx";
import { createCastleUlid, stableJitterFromId } from "./kernel/castleIds.js";
import { worldToSpatialBucket } from "./kernel/spatialMorton.js";
import { KnowledgeGraphSubstrate, KG_NODE, KG_EDGE } from "./kernel/knowledgeGraphSubstrate.js";
import { ChronosScheduler, CapabilityToken } from "./kernel/sovereignChronos.js";
import { verifyTwistCommand } from "./kernel/roboticsClosedLoop.js";
import { warmSwarmGpu } from "./kernel/swarmGpuBridge.js";

const CODEX_VERSION = "vNext-530.Kernel-Morton-ULID";
const CODEX_DATE = "2026-04-28";
const GLOBE_RADIUS = 3000;
const MAX_INSTANCES = 50000;

/** L0–L13 + Rhizoh command plane (L13 = Robotics Mechanics bridge layer) */
const LAYER_SPECS = [
  { id: 0, code: "L0", name: "Core Physics" },
  { id: 1, code: "L1", name: "Spatial Hash" },
  { id: 2, code: "L2", name: "Agent Brain" },
  { id: 3, code: "L3", name: "MMO Presence Cloud" },
  { id: 4, code: "L4", name: "Satellite Layer" },
  { id: 5, code: "L5", name: "GreenRoom Live Stream" },
  { id: 6, code: "L6", name: "Swarm / Squad AI" },
  { id: 7, code: "L7", name: "Ghost Evolution" },
  { id: 8, code: "L8", name: "Procedural City Mind" },
  { id: 9, code: "L9", name: "Event Mesh" },
  { id: 10, code: "L10", name: "Rhizoh Command Layer" },
  { id: 11, code: "L11", name: "Castle Academics Core" },
  { id: 12, code: "L12", name: "Sovereign Runtime (META)" },
  { id: 13, code: "L13", name: "Robotics Mechanics Bridge" }
];

const LAYER_UI_PROFILES = {
  0: {
    mission: "Fizik stabilitesi ve tick senkronu",
    detail: "ECS hareketleri, damping, sabit adım simülasyon doğrulama",
    reality: "GLOBE",
    camera: "ORBIT",
    satellite: false,
    quickActions: ["SCAN CITY", "ACTIVATE SWARM"],
    widgets: ["stack", "rail", "camera", "events"],
    theme: { bg: "rgba(4, 22, 38, 0.8)", border: "#0ea5e9", text: "#67e8f9", accent: "#22d3ee" },
    flight: "globe-wide"
  },
  1: {
    mission: "Spatial hash yoğunluğu ve komsuluk taraması",
    detail: "Yakın ajan kümeleri ve grid tabanlı davranış etkilerini izle",
    reality: "GLOBE",
    camera: "DRONE",
    satellite: false,
    quickActions: ["ZOOM AGENT", "SUMMON SQUAD"],
    widgets: ["stack", "rail", "layerxp", "camera", "events"],
    theme: { bg: "rgba(15, 23, 42, 0.85)", border: "#22d3ee", text: "#bae6fd", accent: "#38bdf8" },
    flight: "agent"
  },
  2: {
    mission: "Agent beyin tipleri ve rol dengesi",
    detail: "Arketip bazlı davranış çeşitliliği ve görev dağılımı",
    reality: "GLOBE",
    camera: "DRONE",
    satellite: false,
    quickActions: ["CALL AGENTS", "ZOOM AGENT"],
    widgets: ["stack", "layerxp", "camera", "events", "rhizoh", "connections"],
    theme: { bg: "rgba(17, 24, 39, 0.86)", border: "#60a5fa", text: "#dbeafe", accent: "#93c5fd" },
    flight: "agent"
  },
  3: {
    mission: "MMO presence akışı ve canlı popülasyon",
    detail: "Eşzamanlı ajan yoğunluğu ve etkileşim sürekliliği",
    reality: "GLOBE",
    camera: "ORBIT",
    satellite: true,
    quickActions: ["SUMMON SQUAD", "ACTIVATE SWARM"],
    widgets: ["stack", "rail", "layerxp", "camera", "events"],
    theme: { bg: "rgba(31, 41, 55, 0.86)", border: "#06b6d4", text: "#cffafe", accent: "#22d3ee" },
    flight: "globe-wide"
  },
  4: {
    mission: "Uydu sinyal katmanı doğrulaması",
    detail: "Katmanlar arası tarama, feed ve telemetri görünürlüğü",
    reality: "REAL_MAP",
    camera: "ORBIT",
    satellite: true,
    quickActions: ["SATELLITE LINK", "SATELLITE SIGNAL"],
    widgets: ["stack", "layerxp", "camera", "flighthud", "events"],
    theme: { bg: "rgba(7, 23, 35, 0.86)", border: "#14b8a6", text: "#99f6e4", accent: "#2dd4bf" },
    flight: "istanbul-high"
  },
  5: {
    mission: "GreenRoom canlı yayın ve medya rezonansı",
    detail: "Canlı bağlantı, stream tetikleyicileri ve media köprüsü",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["OPEN GREENROOM", "ENTER GREENROOM"],
    widgets: ["stack", "layerxp", "camera", "flighthud", "events", "studiomirror"],
    theme: { bg: "rgba(20, 12, 36, 0.86)", border: "#a78bfa", text: "#ede9fe", accent: "#c4b5fd" },
    flight: "istanbul-mid"
  },
  6: {
    mission: "Swarm/Squad formasyon davranışı",
    detail: "Squad intent ve yörünge ayrışmasının sahnede izlenmesi",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["SUMMON SQUAD", "ACTIVATE SWARM"],
    widgets: ["stack", "rail", "layerxp", "camera", "flighthud", "events"],
    theme: { bg: "rgba(22, 18, 10, 0.86)", border: "#f59e0b", text: "#fde68a", accent: "#fbbf24" },
    flight: "agent"
  },
  7: {
    mission: "Ghost pet evrimi ve owner bağı",
    detail: "Pet progression, bağ gücü ve mikro sürü etkileri",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["CALL PET", "ZOOM AGENT"],
    widgets: ["stack", "layerxp", "camera", "events", "rhizoh"],
    theme: { bg: "rgba(30, 10, 28, 0.86)", border: "#e879f9", text: "#f5d0fe", accent: "#f0abfc" },
    flight: "agent"
  },
  8: {
    mission: "Procedural city zihin katmanı",
    detail: "District enerji akışı, tower etkisi ve şehir dokusu",
    reality: "REAL_MAP",
    camera: "ORBIT",
    satellite: false,
    quickActions: ["SCAN CITY", "BUILD TOWER"],
    widgets: ["stack", "rail", "layerxp", "camera", "events", "academy", "intel"],
    theme: { bg: "rgba(10, 24, 20, 0.86)", border: "#34d399", text: "#a7f3d0", accent: "#6ee7b7" },
    flight: "istanbul-wide"
  },
  9: {
    mission: "Event mesh darbeleri ve neden-sonuç zinciri",
    detail: "Katmanlar arası event pulse izleme ve yoğunluk kontrolü",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: true,
    quickActions: ["RUN CURRICULUM", "EXAM MODE"],
    widgets: ["stack", "rail", "layerxp", "camera", "events", "academy", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(23, 11, 38, 0.86)", border: "#c084fc", text: "#e9d5ff", accent: "#d8b4fe" },
    flight: "istanbul-mid"
  },
  10: {
    mission: "Komut orkestrasyonu ve operasyon kontrolü",
    detail: "Rhizoh komut hattı ile gerçek zamanlı senaryo yönetimi",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: true,
    quickActions: ["SPAWN RHIZOH", "ZOOM CASTLE"],
    widgets: ["stack", "rail", "layerxp", "camera", "events", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(28, 15, 12, 0.86)", border: "#fb7185", text: "#fecdd3", accent: "#fda4af" },
    flight: "rhizoh"
  },
  11: {
    mission: "Academics yaşam döngüsü ve mezuniyet",
    detail: "Curriculum, exam, graduation queue ve öğretici etkileşim",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: false,
    quickActions: ["RUN CURRICULUM", "EXAM MODE"],
    widgets: ["stack", "rail", "layerxp", "camera", "academy", "events", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(15, 16, 41, 0.86)", border: "#818cf8", text: "#c7d2fe", accent: "#a5b4fc" },
    flight: "academy"
  },
  12: {
    mission: "META orchestrator ve sovereign registries",
    detail: "Boot sequence, Chronos clock ve manifest sağlığı",
    reality: "REAL_MAP",
    camera: "ORBIT",
    satellite: true,
    quickActions: ["SOVEREIGN BOOT", "META BOOT"],
    widgets: ["stack", "rail", "layerxp", "camera", "sovereign", "events", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel"],
    theme: { bg: "rgba(9, 22, 35, 0.9)", border: "#22d3ee", text: "#e0f2fe", accent: "#67e8f9" },
    flight: "castle"
  },
  13: {
    mission: "Robotics-mechanics entegrasyonu ve live kontrol köprüsü",
    detail: "Kullanıcı robotik/drone sistemlerini Rhizoh Brain ile bağlar, komut-plan döngüsü üretir",
    reality: "REAL_MAP",
    camera: "DRONE",
    satellite: true,
    quickActions: ["ZOOM AGENT", "ZOOM CASTLE"],
    widgets: ["stack", "rail", "layerxp", "camera", "rhizoh", "connections", "identitylab", "academyroom", "continuity", "intel", "studiomirror", "robotics"],
    theme: { bg: "rgba(8, 24, 18, 0.9)", border: "#34d399", text: "#d1fae5", accent: "#6ee7b7" },
    flight: "agent"
  }
};

const STATE = {
  DEAD: 0,
  CITIZEN: 1,
  PENDING: 2,
  GHOSTPET: 3,
  RHIZOH: 4,
  GUARDIAN: 5,
  SCOUT: 6,
  BUILDER: 7,
  SENTINEL: 8,
  AGENT_PROFESSOR: 9,
  AGENT_CADET: 10,
  AGENT_STUDENT: 11,
  AGENT_MASTER: 12
};
const PET_STAGE = { SEED: 0, BUD: 1, CRAWLER: 2, SPIRIT: 3, GUARDIAN: 4, MYTHIC: 5, CELESTIAL: 6 };

const ABILITY = {
  SCAN: 1 << 0,
  HEAL: 1 << 1,
  BUILD: 1 << 2,
  SUMMON: 1 << 3,
  COMMAND: 1 << 4,
  SATELLITE: 1 << 5,
  GREENROOM: 1 << 6,
  EVOLVE: 1 << 7,
  PORTAL: 1 << 8,
  SHIELD: 1 << 9,
  OVERMIND: 1 << 10,
  POSSESS: 1 << 11
};

/** District zoning (procedural city mind) — + Castle Academics */
const MAX_DISTRICTS = 128;
const DISTRICT = {
  CIVIC: 0,
  INDUSTRIAL: 1,
  GREENROOM: 2,
  ARCHIVE: 3,
  DEFENSE: 4,
  MARKET: 5,
  SANCTUARY: 6,
  ANOMALY: 7,
  ACADEMICS: 8,
  ACADEMY: 8
};

const DISTRICT_LABEL = ["civic", "industrial", "greenroom", "archive", "defense", "market", "sanctuary", "anomaly", "academics"];

const AGENT_ARCHETYPE = { NONE: 0, SCOUT: 1, GUARD: 2, HACKER: 3, BUILDER: 4, HEALER: 5, HUNTER: 6 };

const SQUAD_INTENT = { SCAN: 0, ATTACK: 1, DEFEND: 2, ESCORT: 3, HARVEST: 4, BUILD: 5, HEAL: 6, EXPLORE: 7 };

const SATELLITE_CHANNEL = ["VOICE", "MUSIC", "MEMORY", "DREAM", "SIGNAL", "STREAM"];

const HEATMAP_SIZE = 256;
const HEATMAP_LEN = HEATMAP_SIZE * HEATMAP_SIZE;

const YOUTUBE_LIVE_URL = "https://www.youtube.com/@CastleGenesis/live";

/** Boids / hayalet grid komşu üst sınırı (O(N·K) yerine sabit K). */
const BOID_NEIGHBOR_CAP = 22;
const BOID_COLLECT_CAP = 120;

function getOrCreateCastleDevUid() {
  const key = "castle.dev.uid";
  let uid = "";
  try {
    uid = window.localStorage.getItem(key) || "";
    if (!uid) {
      uid = `u-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, uid);
    }
  } catch {
    uid = `u-${Math.random().toString(36).slice(2, 10)}`;
  }
  return uid;
}

function getRhizohApiBase() {
  const cfg = getCastleFlightConfig();
  const url = String(cfg.rhizohLlmHttp || "").trim();
  if (!url) return "http://localhost:8090";
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "http://localhost:8090";
  }
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

class EventMesh {
  constructor(capacity = 64) {
    this.capacity = capacity;
    this.buf = [];
  }
  push(ev) {
    this.buf.unshift(ev);
    if (this.buf.length > this.capacity) this.buf.length = this.capacity;
  }
  recent(n = 8) {
    return this.buf.slice(0, n);
  }
  clear() {
    this.buf.length = 0;
  }
}

class SquadRegistry {
  constructor() {
    this.nextId = 1;
    /** @type {Map<number, { rank: number; morale: number; intent: number; memorySeed: number; orbitMode: string }>} */
    this.squads = new Map();
  }
  create(intentKey = "ESCORT", orbitMode = "escort") {
    const id = this.nextId++;
    const intent = SQUAD_INTENT[intentKey] ?? SQUAD_INTENT.ESCORT;
    const memorySeed = (Math.random() * 0xffffffff) >>> 0;
    this.squads.set(id, {
      rank: 1,
      morale: 100,
      intent,
      memorySeed,
      orbitMode
    });
    return id;
  }
  get(id) {
    return this.squads.get(id);
  }
  clear() {
    this.squads.clear();
    this.nextId = 1;
  }
}

/** L8 procedural city mind + L9 heatmaps + Castle Academics district */
class CityMind {
  constructor() {
    this.districtType = new Uint8Array(MAX_DISTRICTS);
    this.districtEnergy = new Float32Array(MAX_DISTRICTS);
    this.districtThreat = new Float32Array(MAX_DISTRICTS);
    this.districtOwner = new Int32Array(MAX_DISTRICTS).fill(-1);
    this.heatMap = new Float32Array(HEATMAP_LEN);
    this.signalMap = new Float32Array(HEATMAP_LEN);
    this.threatMap = new Float32Array(HEATMAP_LEN);
    this.lifeMap = new Float32Array(HEATMAP_LEN);
    this.academicsTier = 1;
    this.academicsEnergy = 0;
    this.boxCount = 1500;
    this.seedDistricts();
  }

  seedDistricts() {
    for (let i = 0; i < MAX_DISTRICTS; i++) {
      const r = Math.random();
      if (i === 0) this.districtType[i] = DISTRICT.ACADEMICS;
      else if (r < 0.12) this.districtType[i] = DISTRICT.CIVIC;
      else if (r < 0.22) this.districtType[i] = DISTRICT.INDUSTRIAL;
      else if (r < 0.32) this.districtType[i] = DISTRICT.GREENROOM;
      else if (r < 0.4) this.districtType[i] = DISTRICT.ARCHIVE;
      else if (r < 0.52) this.districtType[i] = DISTRICT.DEFENSE;
      else if (r < 0.65) this.districtType[i] = DISTRICT.MARKET;
      else if (r < 0.78) this.districtType[i] = DISTRICT.SANCTUARY;
      else if (r < 0.9) this.districtType[i] = DISTRICT.ANOMALY;
      else this.districtType[i] = DISTRICT.CIVIC;
      this.districtEnergy[i] = 20 + Math.random() * 80;
      this.districtThreat[i] = Math.random() * 30;
      this.districtOwner[i] = -1;
    }
  }

  scanCity() {
    for (let i = 0; i < HEATMAP_LEN; i++) {
      const n = Math.random();
      this.heatMap[i] = n;
      this.signalMap[i] = n * 0.6;
      this.threatMap[i] = (1 - n) * 0.4;
      this.lifeMap[i] = 0.4 + n * 0.6;
    }
    let peak = 0;
    for (let i = 0; i < HEATMAP_LEN; i++) if (this.heatMap[i] > peak) peak = this.heatMap[i];
    return peak;
  }

  buildTower(districtId = 0) {
    const d = Math.max(0, Math.min(MAX_DISTRICTS - 1, districtId | 0));
    this.districtEnergy[d] += 35;
    this.districtThreat[d] = Math.max(0, this.districtThreat[d] - 2);
    return this.districtEnergy[d];
  }

  /** L8 city mind tick + living districts (academy field grows) */
  tick(dt, world) {
    if (!world) return;
    const ts = dt * 60;
    for (let i = 0; i < MAX_DISTRICTS; i++) {
      this.districtEnergy[i] += (Math.random() - 0.5) * 2 * ts;
      if (this.districtType[i] === DISTRICT.ACADEMICS || this.districtType[i] === DISTRICT.ACADEMY) {
        this.districtEnergy[i] += 0.5 * ts;
      }
      this.districtEnergy[i] = Math.max(5, Math.min(9999, this.districtEnergy[i]));
    }
    this.academicsEnergy += dt * (10 + this.academicsTier * 0.35);
    if (this.districtType[0] === DISTRICT.ACADEMICS) this.districtEnergy[0] += dt * 4;
    if (this.academicsEnergy > 220) {
      this.academicsEnergy = 0;
      this.academicsTier = Math.min(255, this.academicsTier + 1);
    }
    const cap = Math.min(world.activeCount, 512);
    for (let i = 0; i < cap; i++) {
      if (world.state[i] === STATE.CITIZEN && world.brainType[i] !== AGENT_ARCHETYPE.NONE) {
        world.xp[i] += dt * 2.5;
      }
    }
  }

  academicsDistrictSnapshot() {
    return {
      tier: this.academicsTier,
      energy: this.districtEnergy[0],
      threat: this.districtThreat[0],
      label: DISTRICT_LABEL[DISTRICT.ACADEMICS] || "academics"
    };
  }

  reset() {
    this.academicsTier = 1;
    this.academicsEnergy = 0;
    this.seedDistricts();
    this.heatMap.fill(0);
    this.signalMap.fill(0);
    this.threatMap.fill(0);
    this.lifeMap.fill(0);
  }
}

const cityMind = new CityMind();
const eventMesh = new EventMesh(96);
const squadRegistry = new SquadRegistry();

/** Server-side LLM recommended; client stub keeps ECS loop closed */
async function callLLMStub(prompt) {
  return {
    action: "MOVE",
    dx: (Math.random() - 0.5) * 0.02,
    dz: (Math.random() - 0.5) * 0.02,
    _stub: true,
    prompt
  };
}

async function queryRhizohLLM({ message, provider, connectionId, agentId, layerProfile, layerSpec, simTime }) {
  const cfg = getCastleFlightConfig();
  const endpoint = cfg.rhizohLlmHttp;
  if (!endpoint) {
    return {
      reply: `Rhizoh: ${layerProfile.mission}. Talep alındı -> ${message}. Kamera ve ajanlar bu katman için hizalanıyor.`,
      directive: "FOCUS_RHIZOH",
      source: "local-stub"
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        message,
        provider,
        connectionId: connectionId || "",
        context: {
          agentId: agentId || "",
          layerId: layerSpec.id,
          layerCode: layerSpec.code,
          layerName: layerSpec.name,
          mission: layerProfile.mission,
          detail: layerProfile.detail,
          reality: layerProfile.reality,
          camera: layerProfile.camera,
          simTime
        },
        options: {
          maxTokens: 280,
          language: "tr-TR"
        }
      }),
      headers: {
        "Content-Type": "application/json",
        ...(cfg.rhizohLlmToken ? { Authorization: `Bearer ${cfg.rhizohLlmToken}` } : {}),
        "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
      }
    });
    if (!res.ok) throw new Error(`rhizoh_llm_http_${res.status}`);
    const json = await res.json();
    return {
      reply: String(json?.reply || json?.text || "Rhizoh yanıtı boş döndü."),
      directive: String(json?.directive || json?.action || ""),
      source: "remote-llm"
    };
  } catch {
    return {
      reply: `Rhizoh: Uzak LLM hattı yanıt vermedi. Yerel protokolle devam ediyorum -> ${message}`,
      directive: "FOCUS_RHIZOH",
      source: "fallback"
    };
  }
}

class World {
  constructor(maxEntities) {
    this.MAX = maxEntities;
    this.posX = new Float32Array(this.MAX);
    this.posY = new Float32Array(this.MAX);
    this.posZ = new Float32Array(this.MAX);
    this.velX = new Float32Array(this.MAX);
    this.velY = new Float32Array(this.MAX);
    this.velZ = new Float32Array(this.MAX);
    this.state = new Uint8Array(this.MAX);
    this.isDirty = new Uint8Array(this.MAX);
    this.colorDirty = new Uint8Array(this.MAX);
    this.cellHash = new Int32Array(this.MAX).fill(-1);
    this.brainType = new Uint8Array(this.MAX);
    this.energy = new Float32Array(this.MAX);
    this.focus = new Float32Array(this.MAX);
    this.xp = new Float32Array(this.MAX);
    this.level = new Uint16Array(this.MAX);
    this.abilityMask = new Uint32Array(this.MAX);
    this.targetIdx = new Int32Array(this.MAX).fill(-1);
    this.petStage = new Uint8Array(this.MAX);
    this.bond = new Float32Array(this.MAX);
    this.ownerIdx = new Int32Array(this.MAX).fill(-1);
    this.presenceState = new Uint8Array(this.MAX);
    this.channelId = new Uint16Array(this.MAX);
    this.idToIndex = new Map();
    this.indexToId = new Array(this.MAX);
    this.removedSet = new Set();
    this.HASH_SIZE = 16411;
    this.CELL_SIZE = 250;
    /** Hayalet / boids için daha ince hücre (hotspot zincirlerini kısaltır). */
    this.GHOST_CELL_SIZE = 48;
    this.ghostGridHead = new Int32Array(this.HASH_SIZE).fill(-1);
    this.ghostGridNext = new Int32Array(this.MAX).fill(-1);
    this.agentGridHead = new Int32Array(this.HASH_SIZE).fill(-1);
    this.agentGridNext = new Int32Array(this.MAX).fill(-1);
    this.squadId = new Uint16Array(this.MAX);
    this.swarmActive = false;
    this.portalCharge = 0;
    this.activeCount = 0;
    this.simTime = 0;
    this.targetMode = "GLOBE";
    this.rhizohIdx = -1;

    // --- L11: CASTLE ACADEMICS CORE ---
    this.curriculum = [
      { id: "basics", name: "Spatial Awareness", req: 0 },
      { id: "physics", name: "Motion & Force", req: 1000 },
      { id: "swarm", name: "Swarm Intelligence", req: 3000 },
      { id: "command", name: "Command Systems", req: 6000 },
      { id: "overmind", name: "Overmind Theory", req: 10000 }
    ];
    this.curriculumTier = new Uint16Array(this.MAX);
    this.examQueue = [];
    this.graduationQueue = [];
    this.examMode = false;
    this.academyXP = new Float32Array(this.MAX);
    this.knowledge = new Float32Array(this.MAX);
    this.discipline = new Float32Array(this.MAX);
    this.llmProfiles = new Map();
    this.agentMemory = new Map();
    this.agentPersona = new Map();
    this.agentBindings = new Map();
    this.agentPetLink = new Map();
    this.knowledgeGraph = new KnowledgeGraphSubstrate();
    this.knowledgeGraph.upsertNode("castle:academies:root", KG_NODE.CONCEPT, "Castle Academies", { layer: 11 });
    this.chronos = new ChronosScheduler();
    this.capability = new CapabilityToken({
      scope: "rhizoh-client",
      expiresAtSim: Infinity,
      actions: ["MOVE", "TEACH", "SUMMON_PET", "SUMMON PET", "*"]
    });
    this.castles = {
      academy: {
        knowledgeGraph: this.knowledgeGraph,
        connectedAgents: [],
        globalMemory: []
      }
    };

    /** Per-entity shell altitude + swirl phase — avoids single shared orbit ring */
    this.orbitShellOffset = new Float32Array(this.MAX);
    this.orbitDrift = new Float32Array(this.MAX);
  }

  reset() {
    this.activeCount = 0;
    this.simTime = 0;
    this.swarmActive = false;
    this.portalCharge = 0;
    this.idToIndex.clear();
    this.indexToId = new Array(this.MAX);
    this.removedSet.clear();
    this.state.fill(0);
    this.isDirty.fill(0);
    this.colorDirty.fill(0);
    this.cellHash.fill(-1);
    this.squadId.fill(0);
    this.rhizohIdx = -1;
    this.academyXP.fill(0);
    this.knowledge.fill(0);
    this.discipline.fill(0);
    this.curriculumTier.fill(0);
    this.orbitShellOffset.fill(0);
    this.orbitDrift.fill(0);
    this.examQueue.length = 0;
    this.graduationQueue.length = 0;
    this.examMode = false;
    this.llmProfiles.clear();
    this.agentMemory.clear();
    this.agentPersona.clear();
    this.agentBindings.clear();
    this.agentPetLink.clear();
    this.knowledgeGraph.clear();
    this.knowledgeGraph.upsertNode("castle:academies:root", KG_NODE.CONCEPT, "Castle Academies", { layer: 11 });
    this.chronos = new ChronosScheduler();
    this.castles.academy.connectedAgents.length = 0;
    this.castles.academy.globalMemory.length = 0;
  }

  spatialHash(x, y, z) {
    return worldToSpatialBucket(x, y, z, this.CELL_SIZE, this.HASH_SIZE);
  }

  spatialHashGhost(x, y, z) {
    return worldToSpatialBucket(x, y, z, this.GHOST_CELL_SIZE, this.HASH_SIZE);
  }

  allocate(id, stateCode = STATE.CITIZEN, archetype = AGENT_ARCHETYPE.NONE, squadIdVal = 0) {
    if (this.idToIndex.has(id)) {
      const idx = this.idToIndex.get(id);
      this.state[idx] = stateCode;
      this.isDirty[idx] = 1;
      this.colorDirty[idx] = 1;
      this.cellHash[idx] = -1;
      if (archetype) this.brainType[idx] = archetype;
      if (squadIdVal) this.squadId[idx] = squadIdVal;
      return idx;
    }
    if (this.activeCount >= this.MAX) return -1;

    const idx = this.activeCount++;
    this.idToIndex.set(id, idx);
    this.indexToId[idx] = id;

    this.posX[idx] = (Math.random() - 0.5) * 4000;
    this.posY[idx] = 3500;
    this.posZ[idx] = (Math.random() - 0.5) * 4000;
    this.velX[idx] = (Math.random() - 0.5) * 5;
    this.velY[idx] = (Math.random() - 0.5) * 5;
    this.velZ[idx] = (Math.random() - 0.5) * 5;

    this.state[idx] = stateCode;
    this.isDirty[idx] = 1;
    this.colorDirty[idx] = 1;
    this.cellHash[idx] = -1;
    this.brainType[idx] = archetype;
    this.squadId[idx] = squadIdVal;

    this.xp[idx] = 0;
    this.level[idx] = 1;
    this.petStage[idx] = PET_STAGE.SEED;
    this.ownerIdx[idx] = -1;
    this.targetIdx[idx] = -1;
    this.academyXP[idx] = 0;
    this.knowledge[idx] = 0;
    this.discipline[idx] = 0;
    {
      const { lo, hi } = typeof id === "string" ? stableJitterFromId(id) : stableJitterFromId(`slot-${idx}`);
      this.orbitShellOffset[idx] = (lo % 2001) / 20 - 50;
      this.orbitDrift[idx] = (hi % 6283) / 1000;
    }

    if (stateCode === STATE.RHIZOH) {
      this.rhizohIdx = idx;
      this.abilityMask[idx] =
        ABILITY.SCAN |
        ABILITY.SUMMON |
        ABILITY.EVOLVE |
        ABILITY.COMMAND |
        ABILITY.SATELLITE |
        ABILITY.GREENROOM |
        ABILITY.OVERMIND |
        ABILITY.PORTAL;
      this.posY[idx] = 4000;
    }

    return idx;
  }

  remove(id) {
    const idx = this.idToIndex.get(id);
    if (idx === undefined) return;

    if (this.state[idx] === STATE.RHIZOH) this.rhizohIdx = -1;

    const lastIdx = --this.activeCount;

    if (idx !== lastIdx) {
      this.posX[idx] = this.posX[lastIdx];
      this.posY[idx] = this.posY[lastIdx];
      this.posZ[idx] = this.posZ[lastIdx];
      this.velX[idx] = this.velX[lastIdx];
      this.velY[idx] = this.velY[lastIdx];
      this.velZ[idx] = this.velZ[lastIdx];
      this.state[idx] = this.state[lastIdx];
      this.cellHash[idx] = this.cellHash[lastIdx];

      this.brainType[idx] = this.brainType[lastIdx];
      this.energy[idx] = this.energy[lastIdx];
      this.xp[idx] = this.xp[lastIdx];
      this.level[idx] = this.level[lastIdx];
      this.abilityMask[idx] = this.abilityMask[lastIdx];
      this.targetIdx[idx] = this.targetIdx[lastIdx];
      this.petStage[idx] = this.petStage[lastIdx];
      this.ownerIdx[idx] = this.ownerIdx[lastIdx];
      this.squadId[idx] = this.squadId[lastIdx];
      this.academyXP[idx] = this.academyXP[lastIdx];
      this.knowledge[idx] = this.knowledge[lastIdx];
      this.discipline[idx] = this.discipline[lastIdx];
      this.curriculumTier[idx] = this.curriculumTier[lastIdx];
      this.orbitShellOffset[idx] = this.orbitShellOffset[lastIdx];
      this.orbitDrift[idx] = this.orbitDrift[lastIdx];

      this.isDirty[idx] = 1;
      this.colorDirty[idx] = 1;

      const lastId = this.indexToId[lastIdx];
      this.idToIndex.set(lastId, idx);
      this.indexToId[idx] = lastId;

      if (this.state[idx] === STATE.RHIZOH) this.rhizohIdx = idx;

      if (this.agentMemory.has(lastIdx)) this.agentMemory.set(idx, this.agentMemory.get(lastIdx));
      else this.agentMemory.delete(idx);
      this.agentMemory.delete(lastIdx);

      if (this.agentPersona.has(lastIdx)) this.agentPersona.set(idx, this.agentPersona.get(lastIdx));
      else this.agentPersona.delete(idx);
      this.agentPersona.delete(lastIdx);

      if (this.agentPetLink.has(lastIdx)) {
        this.agentPetLink.set(idx, this.agentPetLink.get(lastIdx));
        this.agentPetLink.delete(lastIdx);
      } else {
        this.agentPetLink.delete(idx);
      }
    } else {
      this.agentMemory.delete(idx);
      this.agentPersona.delete(idx);
      this.agentPetLink.delete(idx);
    }

    this.state[lastIdx] = 0;
    this.idToIndex.delete(id);
    this.indexToId[lastIdx] = undefined;
    this.removedSet.add(id);
  }

  flushRemoved() {
    if (this.removedSet.size === 0) return null;
    const arr = Array.from(this.removedSet);
    this.removedSet.clear();
    return arr;
  }

  findNearbyAgents(i, radius) {
    const px = this.posX[i];
    const py = this.posY[i];
    const pz = this.posZ[i];
    const r2 = radius * radius;
    const cx = Math.floor(px / this.CELL_SIZE);
    const cy = Math.floor(py / this.CELL_SIZE);
    const cz = Math.floor(pz / this.CELL_SIZE);
    const cellR = Math.ceil(radius / this.CELL_SIZE) + 1;
    const out = [];
    for (let dx = -cellR; dx <= cellR; dx++) {
      for (let dy = -cellR; dy <= cellR; dy++) {
        for (let dz = -cellR; dz <= cellR; dz++) {
          const hh = this.spatialHash((cx + dx) * this.CELL_SIZE, (cy + dy) * this.CELL_SIZE, (cz + dz) * this.CELL_SIZE);
          let j = this.agentGridHead[hh];
          while (j !== -1) {
            if (j !== i && this.state[j] !== 0) {
              const ddx = this.posX[j] - px;
              const ddy = this.posY[j] - py;
              const ddz = this.posZ[j] - pz;
              if (ddx * ddx + ddy * ddy + ddz * ddz <= r2) out.push(j);
            }
            j = this.agentGridNext[j];
          }
        }
      }
    }
    return out;
  }

  spawnEvent(srcIdx, tgtIdx, kind, energy) {
    const src = this.indexToId[srcIdx] ?? `i${srcIdx}`;
    const tgt = tgtIdx >= 0 ? (this.indexToId[tgtIdx] ?? `i${tgtIdx}`) : "MESH";
    eventMesh.push({
      eventType: `ACADEMY_${kind}`,
      eventSource: String(src),
      eventTarget: String(tgt),
      eventEnergy: energy,
      eventLifetime: 8 + Math.random() * 4,
      ts: new Date().toLocaleTimeString()
    });
    uiStore.dispatch({ type: "EVENT_PULSE" });
  }

  processGraduationQueue() {
    if (this.graduationQueue.length === 0) return;
    const idx = this.graduationQueue.pop();
    if (idx === undefined || this.state[idx] === 0) return;
    if (this.state[idx] !== STATE.AGENT_STUDENT) return;
    this.state[idx] = STATE.AGENT_MASTER;
    this.colorDirty[idx] = 1;
    this.isDirty[idx] = 1;
    this.spawnEvent(idx, -1, 7, 4.0);
    const gid = this.indexToId[idx];
    if (gid) {
      const nk = `graduate:${gid}`;
      this.knowledgeGraph.upsertNode(nk, KG_NODE.CONCEPT, "Graduate", { tier: "MASTER" });
      this.knowledgeGraph.link(String(gid), KG_EDGE.SUPPORTS, nk, 1);
    }
    this.castles.academy.globalMemory.push({ type: "GRADUATION", agent: this.indexToId[idx], t: this.simTime });
    uiStore.dispatch({
      type: "ADD_LOG",
      payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "🎓 ACADEMY GRADUATION: AGENT -> MASTER" }
    });
  }

  registerLLMAgent(userId, agentConfig) {
    const agentId = agentConfig.agentId;
    this.llmProfiles.set(agentId, { ...agentConfig, userId });
    if (!this.agentBindings.has(userId)) this.agentBindings.set(userId, []);
    this.agentBindings.get(userId).push(agentId);
    const idx = this.allocate(`LLM-${agentId}`, STATE.AGENT_PROFESSOR);
    if (idx < 0) return -1;
    this.agentPersona.set(idx, agentConfig.persona || { role: "Academy Professor", traits: ["mentor"], domain: "academics" });
    this.agentMemory.set(idx, { shortTerm: [], longTerm: [], skills: {} });
    this.castles.academy.connectedAgents.push(`LLM-${agentId}`);
    const gk = `agent:LLM-${agentId}`;
    this.knowledgeGraph.upsertNode(gk, KG_NODE.AGENT, String(agentConfig.persona?.role || "Academy Professor"), {
      model: agentConfig.model,
      domain: agentConfig.persona?.domain
    });
    this.knowledgeGraph.link("castle:academies:root", KG_EDGE.TEACHES, gk, 1);
    return idx;
  }

  applyAgentDecision(i, response) {
    if (!response || typeof response !== "object") return;
    const act = String(response.action || "");
    if (!this.capability.allows(act, this.simTime)) return;
    if (response.action === "MOVE") {
      const v = verifyTwistCommand(
        { speed: Math.hypot(Number(response.dx) || 0, Number(response.dz) || 0), x: this.posX[i], y: this.posY[i], z: this.posZ[i] },
        { vMax: 80, xMax: 8000, yMax: 9000, zMax: 8000 }
      );
      if (!v.ok) return;
      this.velX[i] += response.dx || 0;
      this.velZ[i] += response.dz || 0;
      this.isDirty[i] = 1;
    }
    if (response.action === "TEACH") {
      this.discipline[i] += 2;
      const t = response.target;
      if (typeof t === "number" && t >= 0 && t < this.activeCount) {
        this.spawnEvent(i, t, 6, 2.0);
        const tid = this.indexToId[t];
        if (tid) {
          const sid = `cadet:${tid}`;
          this.knowledgeGraph.upsertNode(sid, KG_NODE.MEMORY, "cadet_session", { mentor: this.indexToId[i] });
          this.knowledgeGraph.link(String(this.indexToId[i]), KG_EDGE.TEACHES, sid, 1);
        }
      }
    }
    if (response.action === "SUMMON_PET" || response.action === "SUMMON PET") {
      const petId = `PET-${createCastleUlid()}`;
      const pidx = this.allocate(petId, STATE.GHOSTPET);
      if (pidx >= 0) {
        this.ownerIdx[pidx] = i;
        this.agentPetLink.set(i, pidx);
      }
    }
    const mem = this.agentMemory.get(i);
    if (mem) mem.shortTerm.push(response);
  }

  async runLLMThought(agentIdx, stimulus) {
    const persona = this.agentPersona.get(agentIdx);
    const memory = this.agentMemory.get(agentIdx);
    if (!persona || !memory) return;
    const prompt = {
      role: persona.role,
      traits: persona.traits,
      worldState: {
        position: [this.posX[agentIdx], this.posY[agentIdx], this.posZ[agentIdx]],
        knowledge: this.knowledge[agentIdx],
        academyLevel: this.academyXP[agentIdx]
      },
      memory: memory.shortTerm.slice(-8),
      stimulus
    };
    const response = await callLLMStub(prompt);
    this.applyAgentDecision(agentIdx, response);
  }

  resetAcademyLayer() {
    this.academyXP.fill(0);
    this.knowledge.fill(0);
    this.discipline.fill(0);
    this.curriculumTier.fill(0);
    this.examQueue.length = 0;
    this.graduationQueue.length = 0;
    this.examMode = false;
    this.llmProfiles.clear();
    this.agentMemory.clear();
    this.agentPersona.clear();
    this.agentBindings.clear();
    this.agentPetLink.clear();
    this.knowledgeGraph.clear();
    this.knowledgeGraph.upsertNode("castle:academies:root", KG_NODE.CONCEPT, "Castle Academies", { layer: 11 });
    this.castles.academy.connectedAgents.length = 0;
    this.castles.academy.globalMemory.length = 0;
  }

  /** Cadet ring by curriculum tier + discipline bump */
  runCurriculumOrganize() {
    const cadets = [];
    for (let i = 0; i < this.activeCount; i++) {
      if (this.state[i] === STATE.AGENT_CADET) cadets.push(i);
    }
    cadets.sort((a, b) => this.curriculumTier[a] - this.curriculumTier[b]);
    const n = cadets.length;
    const ringR = 1200;
    const baseY = 3500;
    for (let k = 0; k < n; k++) {
      const i = cadets[k];
      const angle = (k / Math.max(1, n)) * Math.PI * 2;
      this.posX[i] = Math.cos(angle) * ringR;
      this.posZ[i] = Math.sin(angle) * ringR;
      this.posY[i] = baseY + this.curriculumTier[i] * 45;
      this.discipline[i] += 5;
      this.velX[i] *= 0.5;
      this.velZ[i] *= 0.5;
      this.isDirty[i] = 1;
      this.colorDirty[i] = 1;
    }
  }

  tick(dt) {
    const safeDt = Number.isFinite(dt) ? Math.max(0.0001, Math.min(dt, 0.05)) : 0.016;
    const timeScale = safeDt * 60;
    this.simTime += safeDt;
    this.chronos.flushDue(this.simTime);

    const k = 0.008;
    const damping = Math.pow(0.99, timeScale);

    this.ghostGridHead.fill(-1);
    this.agentGridHead.fill(-1);

    for (let i = 0; i < this.activeCount; i++) {
      if (this.state[i] === 0) continue;

      const px = this.posX[i];
      const py = this.posY[i];
      const pz = this.posZ[i];
      const h = this.spatialHash(px, py, pz);

      if (this.cellHash[i] !== h) this.cellHash[i] = h;

      this.agentGridNext[i] = this.agentGridHead[h];
      this.agentGridHead[h] = i;

      if (this.state[i] === STATE.GHOSTPET) {
        const hg = this.spatialHashGhost(px, py, pz);
        this.ghostGridNext[i] = this.ghostGridHead[hg];
        this.ghostGridHead[hg] = i;
      }
    }

    for (let i = 0; i < this.activeCount; i++) {
      if (this.state[i] === 0) continue;

      const px = this.posX[i];
      const py = this.posY[i];
      const pz = this.posZ[i];
      let moved = false;

      if (this.state[i] === STATE.AGENT_CADET || this.state[i] === STATE.AGENT_STUDENT || this.state[i] === STATE.AGENT_MASTER) {
        const knowledgeGain = safeDt * (10 + this.discipline[i] * 0.1);
        this.academyXP[i] += knowledgeGain;
        this.knowledge[i] += knowledgeGain * 0.5;
        const curIdx = this.curriculum.findIndex((c) => this.academyXP[i] < c.req);
        const lvl = curIdx === -1 ? this.curriculum.length - 1 : curIdx;
        this.curriculumTier[i] = lvl;
        this.colorDirty[i] = 1;
      }

      if (this.state[i] === STATE.RHIZOH) {
        const orbitR = 1000;
        const orbitSpeed = this.simTime * 0.2;
        const targetX = Math.cos(orbitSpeed) * orbitR;
        const targetZ = Math.sin(orbitSpeed) * orbitR;
        const targetY = this.targetMode === "GLOBE" ? GLOBE_RADIUS + 1200 : 800;

        this.velX[i] += (targetX - px) * 0.01 * timeScale;
        this.velY[i] += (targetY - py) * 0.01 * timeScale;
        this.velZ[i] += (targetZ - pz) * 0.01 * timeScale;
        moved = true;
        this.isDirty[i] = 1;
      } else if (this.state[i] === STATE.AGENT_PROFESSOR) {
        const nearby = this.findNearbyAgents(i, 800);
        for (let ni = 0; ni < nearby.length; ni++) {
          const s = nearby[ni];
          if (this.state[s] === STATE.AGENT_CADET || this.state[s] === STATE.AGENT_STUDENT) {
            this.academyXP[s] += safeDt * 80;
            this.knowledge[s] += safeDt * 3;
            this.discipline[s] += safeDt * 0.5;
            if (Math.random() < 0.02) this.spawnEvent(i, s, 6, 1.2);
          }
        }
        moved = true;
        this.isDirty[i] = 1;
      } else if (this.state[i] === STATE.GHOSTPET) {
        this.xp[i] += safeDt * 10;
        if (this.xp[i] > 500 && this.petStage[i] === PET_STAGE.SEED) {
          this.petStage[i] = PET_STAGE.BUD;
          this.colorDirty[i] = 1;
          uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "EVOLUTION: PET YÜKSELDİ [BUD]" } });
        }
        if (this.xp[i] > 1500 && this.petStage[i] === PET_STAGE.BUD) {
          this.petStage[i] = PET_STAGE.SPIRIT;
          this.colorDirty[i] = 1;
        }
        if (this.xp[i] > 3000 && this.petStage[i] === PET_STAGE.SPIRIT) {
          this.petStage[i] = PET_STAGE.GUARDIAN;
          this.colorDirty[i] = 1;
        }

        let cohX = 0,
          cohY = 0,
          cohZ = 0,
          aliX = 0,
          aliY = 0,
          aliZ = 0,
          sepX = 0,
          sepY = 0,
          sepZ = 0;
        let count = 0;

        if (this.ownerIdx[i] !== -1 && this.state[this.ownerIdx[i]] !== 0) {
          const ox = this.posX[this.ownerIdx[i]],
            oy = this.posY[this.ownerIdx[i]],
            oz = this.posZ[this.ownerIdx[i]];
          cohX += ox;
          cohY += oy;
          cohZ += oz;
          count++;
        }

        const gcx = Math.floor(px / this.GHOST_CELL_SIZE);
        const gcy = Math.floor(py / this.GHOST_CELL_SIZE);
        const gcz = Math.floor(pz / this.GHOST_CELL_SIZE);
        const neighborPool = [];
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              const hh = this.spatialHashGhost(
                (gcx + dx) * this.GHOST_CELL_SIZE,
                (gcy + dy) * this.GHOST_CELL_SIZE,
                (gcz + dz) * this.GHOST_CELL_SIZE
              );
              let neighborIdx = this.ghostGridHead[hh];
              while (neighborIdx !== -1 && neighborPool.length < BOID_COLLECT_CAP) {
                if (neighborIdx !== i) {
                  const nx = this.posX[neighborIdx];
                  const ny = this.posY[neighborIdx];
                  const nz = this.posZ[neighborIdx];
                  const dxDist = px - nx;
                  const dyDist = py - ny;
                  const dzDist = pz - nz;
                  const distSq2 = dxDist * dxDist + dyDist * dyDist + dzDist * dzDist;
                  if (distSq2 > 0.001 && distSq2 < 15000) neighborPool.push(neighborIdx);
                }
                neighborIdx = this.ghostGridNext[neighborIdx];
              }
            }
          }
        }
        let pickN = neighborPool.length;
        if (pickN > BOID_NEIGHBOR_CAP) pickN = BOID_NEIGHBOR_CAP;
        for (let p = 0; p < pickN; p++) {
          const r = p + Math.floor(Math.random() * (neighborPool.length - p));
          const t = neighborPool[p];
          neighborPool[p] = neighborPool[r];
          neighborPool[r] = t;
        }
        for (let p = 0; p < pickN; p++) {
          const neighborIdx = neighborPool[p];
          const nx = this.posX[neighborIdx];
          const ny = this.posY[neighborIdx];
          const nz = this.posZ[neighborIdx];
          const dxDist = px - nx;
          const dyDist = py - ny;
          const dzDist = pz - nz;
          const distSq2 = dxDist * dxDist + dyDist * dyDist + dzDist * dzDist;
          cohX += nx;
          cohY += ny;
          cohZ += nz;
          aliX += this.velX[neighborIdx];
          aliY += this.velY[neighborIdx];
          aliZ += this.velZ[neighborIdx];
          const invDist = 1.0 / Math.max(0.1, Math.sqrt(distSq2));
          sepX += dxDist * invDist;
          sepY += dyDist * invDist;
          sepZ += dzDist * invDist;
          count++;
        }

        if (count > 0) {
          cohX /= count;
          cohY /= count;
          cohZ /= count;
          aliX /= count;
          aliY /= count;
          aliZ /= count;

          const stageMult = 1 + this.petStage[i] * 0.2;

          this.velX[i] += ((cohX - px) * 0.0005 * stageMult + aliX * 0.02 + sepX * 0.05) * timeScale;
          this.velY[i] += ((cohY - py) * 0.0005 * stageMult + aliY * 0.02 + sepY * 0.05) * timeScale;
          this.velZ[i] += ((cohZ - pz) * 0.0005 * stageMult + aliZ * 0.02 + sepZ * 0.05) * timeScale;
          moved = true;
        }
      }

      this.posX[i] += this.velX[i] * timeScale;
      this.posY[i] += this.velY[i] * timeScale;
      this.posZ[i] += this.velZ[i] * timeScale;

      const vSq = this.velX[i] * this.velX[i] + this.velY[i] * this.velY[i] + this.velZ[i] * this.velZ[i];
      const distSq = this.posX[i] * this.posX[i] + this.posY[i] * this.posY[i] + this.posZ[i] * this.posZ[i];

      if (this.targetMode === "GLOBE") {
        const squadLane = this.squadId[i] * 2.3;
        const brainLane = this.brainType[i] * 11;
        const targetRadius = GLOBE_RADIUS + 380 + this.orbitShellOffset[i] + squadLane + brainLane * 0.15;

        if (distSq > 100 && this.state[i] !== STATE.GHOSTPET && this.state[i] !== STATE.RHIZOH) {
          const invDist = 1 / Math.sqrt(distSq + 0.0001);
          const dist = distSq * invDist;
          const pull = -k * (dist - targetRadius) * timeScale;
          this.velX[i] += this.posX[i] * invDist * pull;
          this.velY[i] += this.posY[i] * invDist * pull;
          this.velZ[i] += this.posZ[i] * invDist * pull;
          moved = true;

          const wf = 0.028 + this.brainType[i] * 0.0035 + (this.orbitDrift[i] % 1) * 0.018;
          const ph = this.simTime * wf + this.orbitDrift[i] * 12.566 + this.squadId[i] * 0.17;
          const swirl = Math.sin(ph) * 0.14 * timeScale;
          this.velX[i] += -this.posZ[i] * swirl * 0.000018;
          this.velZ[i] += this.posX[i] * swirl * 0.000018;
        }

        const distOffset = Math.abs(Math.sqrt(distSq + 0.0001) - targetRadius);

        if (vSq < 0.0005 && distOffset < 5 && !moved && this.state[i] !== STATE.RHIZOH) {
          this.velX[i] = 0;
          this.velY[i] = 0;
          this.velZ[i] = 0;
          this.isDirty[i] = 0;
        } else {
          this.isDirty[i] = 1;
        }
      } else {
        if (this.state[i] !== STATE.RHIZOH) {
          const targetY = 50 + (i % 200);
          this.velY[i] += (targetY - this.posY[i]) * 0.02 * timeScale;

          if (this.posX[i] > 3000) this.velX[i] -= 0.5 * timeScale;
          if (this.posX[i] < -3000) this.velX[i] += 0.5 * timeScale;
          if (this.posZ[i] > 3000) this.velZ[i] -= 0.5 * timeScale;
          if (this.posZ[i] < -3000) this.velZ[i] += 0.5 * timeScale;

          const lane = 1 + (this.brainType[i] % 10) * 0.012 + (this.squadId[i] % 13) * 0.009;
          this.velX[i] += this.posZ[i] * 0.0001 * timeScale * lane;
          this.velZ[i] -= this.posX[i] * 0.0001 * timeScale * lane;
        }
        this.isDirty[i] = 1;
      }

      this.velX[i] *= damping;
      this.velY[i] *= damping;
      this.velZ[i] *= damping;
    }

    if (this.swarmActive) {
      for (let i = 0; i < this.activeCount; i++) {
        if (this.state[i] !== STATE.CITIZEN) continue;
        this.velX[i] += (Math.random() - 0.5) * 2.5 * timeScale;
        this.velZ[i] += (Math.random() - 0.5) * 2.5 * timeScale;
        this.isDirty[i] = 1;
      }
    }

    if (this.portalCharge > 0) this.portalCharge = Math.max(0, this.portalCharge - safeDt * 0.35);

    const examP = 0.001 * (this.examMode ? 4 : 1);
    if (Math.random() < examP) {
      for (let i = 0; i < this.activeCount; i++) {
        if (this.state[i] >= STATE.AGENT_CADET && this.state[i] <= STATE.AGENT_STUDENT) {
          const score = this.knowledge[i] + this.discipline[i] * 2;
          if (score > 5000 && this.state[i] === STATE.AGENT_STUDENT && !this.graduationQueue.includes(i)) {
            this.graduationQueue.push(i);
          }
        }
      }
    }
    this.processGraduationQueue();
  }
}

const coreWorld = new World(MAX_INSTANCES);

class RealMapCore {
  static isLoaded = false;
  static isLoading = false;
  /** Fatih beacon — zoom / drone targets */
  static castleWorldPos = new THREE.Vector3(0, 320, 0);

  static async loadCity(sceneGroup, onLog) {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    onLog("SATELLITE_LINK: L5 ZONE GENERATION STARTED…");
    this.buildProceduralFallback(sceneGroup);
    this.isLoaded = true;
    this.isLoading = false;
    onLog("SATELLITE_LINK: ISTANBUL TILE · procedural REAL_MAP injected.");
  }

  static buildProceduralFallback(sceneGroup) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x051a30,
      emissive: 0x00ff88,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      metalness: 0.8
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const count = 1600;
    const instanced = new THREE.InstancedMesh(geo, material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      let x;
      let z;
      if (i < count * 0.9) {
        const lat = ISTANBUL_GEO.latMin + Math.random() * (ISTANBUL_GEO.latMax - ISTANBUL_GEO.latMin);
        const lon = ISTANBUL_GEO.lonMin + Math.random() * (ISTANBUL_GEO.lonMax - ISTANBUL_GEO.lonMin);
        const p = latLonToSceneXZ(lat, lon);
        x = p.x + (Math.random() - 0.5) * 180;
        z = p.z + (Math.random() - 0.5) * 180;
      } else {
        x = (Math.random() - 0.5) * 16000;
        z = (Math.random() - 0.5) * 16000;
      }
      const h = Math.random() > 0.9 ? 520 + Math.random() * 380 : 80 + Math.random() * 160;
      dummy.position.set(x, 0, z);
      dummy.scale.set(45 + Math.random() * 85, h, 45 + Math.random() * 85);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    sceneGroup.add(instanced);

    const fp = latLonToSceneXZ(ISTANBUL_POI.FATIH.lat, ISTANBUL_POI.FATIH.lon);
    RealMapCore.castleWorldPos.set(fp.x, 340, fp.z);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff6600,
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.25
    });
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(90, 140, 520, 10), beaconMat);
    spire.position.set(fp.x, 260, fp.z);
    sceneGroup.add(spire);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(160, 1), beaconMat);
    crown.position.set(fp.x, 560, fp.z);
    sceneGroup.add(crown);
  }
}

class RingBuffer {
  constructor(size) {
    this.size = size;
    this.data = new Array(size).fill(null);
    this.head = 0;
  }
  push(item) {
    this.data[this.head] = item;
    this.head = (this.head + 1) % this.size;
  }
  toArray() {
    const result = [];
    for (let i = 0; i < this.size; i++) {
      const idx = (this.head - 1 - i + this.size) % this.size;
      if (this.data[idx]) result.push(this.data[idx]);
    }
    return result;
  }
}

const logBuffer = new RingBuffer(50);
logBuffer.push({ ts: CODEX_DATE, type: "SYS", data: "RHIZOH L0–L13 stack + Sovereign Runtime + Robotics bridge online." });

const layerTransitionRing = new RingBuffer(28);

const uiStore = {
  state: {
    viewMode: "CITIZEN",
    realityMode: "GLOBE",
    tickCounter: 0,
    activeEntityCount: 0,
    isSatelliteActive: false,
    layerFocus: 10,
    layerTransitionSeq: 0,
    cameraMode: "ORBIT",
    satelliteScanMode: "SIGNAL",
    heatPeak: 0,
    academicsTier: 1,
    district0Energy: 0,
    swarmActive: false,
    greenRoomArm: false,
    portalVisible: false,
    squadCount: 0
  },
  listeners: new Set(),
  getState() {
    return this.state;
  },
  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  },
  dispatch(action) {
    if (action.type === "EVENT_PULSE") {
      this.state = { ...this.state, tickCounter: this.state.tickCounter + 1 };
      this.listeners.forEach((l) => l());
      return;
    }
    if (action.type === "ADD_LOG") {
      logBuffer.push(action.payload);
      this.state = { ...this.state, tickCounter: this.state.tickCounter + 1 };
    } else if (action.type === "SYNC_STATS") {
      this.state = { ...this.state, activeEntityCount: action.payload };
    } else if (action.type === "SYNC_METRICS") {
      this.state = { ...this.state, ...action.payload };
    } else {
      let next = this.state;
      if (action.type === "TOGGLE_VIEW") next = { ...next, viewMode: next.viewMode === "CITIZEN" ? "DEVELOPER" : "CITIZEN" };
      if (action.type === "SET_REALITY") {
        coreWorld.targetMode = action.payload;
        next = { ...next, realityMode: action.payload };
      }
      if (action.type === "TOGGLE_SATELLITE") next = { ...next, isSatelliteActive: !next.isSatelliteActive };
      if (action.type === "SET_LAYER_FOCUS") {
        const nf = Math.max(0, Math.min(13, action.payload | 0));
        const prev = this.state.layerFocus;
        if (prev !== nf) {
          const fromSpec = LAYER_SPECS.find((x) => x.id === prev);
          const toSpec = LAYER_SPECS.find((x) => x.id === nf);
          layerTransitionRing.push({
            ts: new Date().toLocaleTimeString(),
            from: prev,
            to: nf,
            label: `${fromSpec?.code ?? "?"}→${toSpec?.code ?? "?"} · ${toSpec?.name ?? ""}`
          });
          logBuffer.push({
            ts: new Date().toLocaleTimeString(),
            type: "SYS",
            data: `LAYER · ${fromSpec?.code ?? "?"} → ${toSpec?.code ?? "?"} (${toSpec?.name ?? ""})`
          });
        }
        next = {
          ...next,
          layerFocus: nf,
          ...(prev !== nf
            ? {
                layerTransitionSeq: (this.state.layerTransitionSeq || 0) + 1,
                tickCounter: this.state.tickCounter + 1
              }
            : {})
        };
      }
      if (action.type === "SET_CAMERA_MODE") {
        next = { ...next, cameraMode: action.payload === "DRONE" ? "DRONE" : "ORBIT", tickCounter: this.state.tickCounter + 1 };
      }
      if (action.type === "SET_SATELLITE_MODE") next = { ...next, satelliteScanMode: action.payload };
      if (action.type === "TOGGLE_SWARM") {
        coreWorld.swarmActive = !coreWorld.swarmActive;
        next = { ...next, swarmActive: coreWorld.swarmActive };
      }
      if (action.type === "SET_GREENROOM") next = { ...next, greenRoomArm: !!action.payload };
      if (action.type === "SET_PORTAL") {
        coreWorld.portalCharge = action.payload ? 1 : 0;
        next = { ...next, portalVisible: !!action.payload };
      }
      this.state = next;
    }
    this.listeners.forEach((l) => l());
  }
};

const ARCHETYPE_NAMES = ["", "SCOUT", "GUARD", "HACKER", "BUILDER", "HEALER", "HUNTER"];

function formatRoster(roster) {
  return roster.map((a) => ARCHETYPE_NAMES[a] || "?").join(", ");
}

function pushRhizohEvent(eventType, eventSource, eventTarget, eventEnergy = 1) {
  eventMesh.push({
    eventType,
    eventSource,
    eventTarget,
    eventEnergy,
    eventLifetime: 6 + Math.random() * 8,
    ts: new Date().toLocaleTimeString()
  });
  uiStore.dispatch({ type: "EVENT_PULSE" });
}

const useUISelector = (selector) => {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  return useSyncExternalStore(
    uiStore.subscribe.bind(uiStore),
    useCallback(() => selectorRef.current(uiStore.getState()), [])
  );
};

class ApexEngine {
  constructor(container) {
    this.container = container;
    this.active = true;

    this.slotColorCache = new Uint8Array(coreWorld.MAX).fill(255);

    this._dirCacheX = new Float32Array(coreWorld.MAX).fill(0);
    this._dirCacheY = new Float32Array(coreWorld.MAX).fill(0);
    this._dirCacheZ = new Float32Array(coreWorld.MAX).fill(1);
    this._qCacheX = new Float32Array(coreWorld.MAX).fill(0);
    this._qCacheY = new Float32Array(coreWorld.MAX).fill(0);
    this._qCacheZ = new Float32Array(coreWorld.MAX).fill(0);
    this._qCacheW = new Float32Array(coreWorld.MAX).fill(1);

    this._qTemp = new THREE.Quaternion();
    this._dirTemp = new THREE.Vector3();

    this.camForward = new THREE.Vector3(0, 0, -1);
    this.agentForward = new THREE.Vector3(0, 0, 1);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010103);
    this.scene.fog = new THREE.FogExp2(0x010103, 0.00006);

    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 50, 400000);
    this.targetCamPos = new THREE.Vector3();
    this.targetCamDir = new THREE.Vector3();
    this._camScratch = new THREE.Vector3();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 80;
    this.controls.maxDistance = 180000;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enabled = false;
    this._zoomAgentCursor = 0;
    this.droneBridge = null;
    this._wallPrev = performance.now();

    this.setupWorld();
    this.setupInstancing();

    this.renderLoop = this.renderLoop.bind(this);
    this.renderLoop();
  }

  setupWorld() {
    this.globeGroup = new THREE.Group();
    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x051020, emissive: 0x0a1a3f, emissiveIntensity: 1.2, roughness: 0.1, metalness: 1.0, transparent: true, opacity: 0.9 })
    );
    this.globeGroup.add(this.globe);
    const grid = new THREE.GridHelper(GLOBE_RADIUS * 8, 50, 0x00ffff, 0x0a1a3f);
    grid.position.y = -GLOBE_RADIUS - 100;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.globeGroup.add(grid);
    this.scene.add(this.globeGroup);

    this.realMapGroup = new THREE.Group();
    this.realMapGroup.visible = false;
    const cityGrid = new THREE.GridHelper(20000, 100, 0x00ff88, 0x051020);
    cityGrid.material.opacity = 0.4;
    cityGrid.material.transparent = true;
    this.realMapGroup.add(cityGrid);
    this.scene.add(this.realMapGroup);

    this.satelliteGroup = new THREE.Group();
    const satRing = new THREE.Mesh(
      new THREE.TorusGeometry(8000, 10, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.1, wireframe: true })
    );
    satRing.rotation.x = Math.PI / 2;
    this.satelliteGroup.add(satRing);
    this.satelliteGroup.visible = false;
    this.scene.add(this.satelliteGroup);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    this.sunLight = new THREE.DirectionalLight(0x00ffff, 4.0);
    this.sunLight.position.set(10000, 10000, 10000);
    this.scene.add(this.sunLight);
  }

  setupInstancing() {
    const geometry = new THREE.IcosahedronGeometry(80, 1);

    this.agentInstances = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshStandardMaterial({
        roughness: 0,
        metalness: 1,
        emissiveIntensity: 2.5,
        flatShading: true,
        vertexColors: true
      }),
      coreWorld.MAX
    );
    this.agentInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colorArray = new Float32Array(coreWorld.MAX * 3).fill(1.0);
    this.agentInstances.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    this.agentInstances.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.agentInstances);
  }

  handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.controls) this.controls.update();
  }

  async transitionReality(mode) {
    if (mode === "REAL_MAP") {
      if (!RealMapCore.isLoaded) {
        await RealMapCore.loadCity(this.realMapGroup, (msg) => {
          uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: msg } });
        });
      }
      this.realMapGroup.visible = true;
      this.scene.fog.density = 0.00015;
      if (!this.droneBridge) {
        const cfg = getCastleFlightConfig();
        this.droneBridge = new DroneFlightBridge(this.realMapGroup, cfg);
        this.droneBridge.startSimulated();
        if (cfg.droneTelemetryWs) this.droneBridge.connectTelemetryWs(cfg.droneTelemetryWs);
        if (cfg.gatewayWsUrl) this.droneBridge.connectGatewayMirror(cfg.gatewayWsUrl, cfg.gatewayToken);
      }
    } else {
      this.realMapGroup.visible = false;
      this.scene.fog.density = 0.00006;
      if (this.droneBridge) {
        this.droneBridge.dispose();
        this.droneBridge = null;
      }
    }
  }

  renderLoop() {
    if (!this.active) return;
    requestAnimationFrame(this.renderLoop);

    const nowWall = performance.now();
    const frameDt = Math.min(0.1, Math.max(0.001, (nowWall - this._wallPrev) / 1000));
    this._wallPrev = nowWall;

    const simTime = coreWorld.simTime;
    const activeCount = coreWorld.activeCount;
    const mode = uiStore.getState().realityMode;
    const isSat = uiStore.getState().isSatelliteActive;

    if (isSat) {
      this.satelliteGroup.visible = true;
      this.satelliteGroup.rotation.y += 0.001;
      this.satelliteGroup.rotation.z = Math.sin(simTime * 0.1) * 0.1;
    } else {
      this.satelliteGroup.visible = false;
    }

    let matrixBatchDirty = false;
    let colorBatchDirty = false;

    const imArray = this.agentInstances.instanceMatrix.array;
    const icArray = this.agentInstances.instanceColor.array;

    for (let i = 0; i < activeCount; i++) {
      const stateCode = coreWorld.state[i];
      if (stateCode === 0) continue;

      if (coreWorld.isDirty[i]) {
        const px = coreWorld.posX[i];
        const py = coreWorld.posY[i];
        const pz = coreWorld.posZ[i];
        const vx = coreWorld.velX[i];
        const vy = coreWorld.velY[i];
        const vz = coreWorld.velZ[i];

        const speedSq = vx * vx + vy * vy + vz * vz;
        if (speedSq > 0.001) {
          const invSpeed = 1 / Math.sqrt(speedSq);
          const nx = vx * invSpeed;
          const ny = vy * invSpeed;
          const nz = vz * invSpeed;

          const dot = this._dirCacheX[i] * nx + this._dirCacheY[i] * ny + this._dirCacheZ[i] * nz;
          if (dot < 0.999) {
            this._dirCacheX[i] = nx;
            this._dirCacheY[i] = ny;
            this._dirCacheZ[i] = nz;
            this._dirTemp.set(nx, ny, nz);
            this._qTemp.setFromUnitVectors(this.agentForward, this._dirTemp);
            this._qCacheX[i] = this._qTemp.x;
            this._qCacheY[i] = this._qTemp.y;
            this._qCacheZ[i] = this._qTemp.z;
            this._qCacheW[i] = this._qTemp.w;
          }
        }

        let baseS = mode === "REAL_MAP" ? 0.6 : 1.2 + Math.sin(simTime * 3 + i) * 0.2;

        if (stateCode === STATE.RHIZOH) {
          baseS = 6.0 + Math.sin(simTime * 5) * 1.0;
        } else if (stateCode === STATE.AGENT_PROFESSOR) {
          baseS = 2.8 + Math.sin(simTime * 2 + i * 0.01) * 0.25;
        } else if (stateCode === STATE.AGENT_MASTER) {
          baseS = 2.4 + Math.sin(simTime * 3 + i) * 0.15;
        } else if (stateCode === STATE.GHOSTPET) {
          const stage = coreWorld.petStage[i];
          baseS = 1.0 + stage * 0.5;
        }

        const sx = baseS * 0.5,
          sy = baseS * 0.5,
          sz = baseS * 1.5;

        const qx = this._qCacheX[i],
          qy = this._qCacheY[i],
          qz = this._qCacheZ[i],
          qw = this._qCacheW[i];
        const x2 = qx + qx,
          y2 = qy + qy,
          z2 = qz + qz;
        const xx = qx * x2,
          xy = qx * y2,
          xz = qx * z2;
        const yy = qy * y2,
          yz = qy * z2,
          zz = qz * z2;
        const wx = qw * x2,
          wy = qw * y2,
          wz = qw * z2;

        const offset = i * 16;
        imArray[offset + 0] = (1 - (yy + zz)) * sx;
        imArray[offset + 1] = (xy + wz) * sx;
        imArray[offset + 2] = (xz - wy) * sx;
        imArray[offset + 3] = 0;
        imArray[offset + 4] = (xy - wz) * sy;
        imArray[offset + 5] = (1 - (xx + zz)) * sy;
        imArray[offset + 6] = (yz + wx) * sy;
        imArray[offset + 7] = 0;
        imArray[offset + 8] = (xz + wy) * sz;
        imArray[offset + 9] = (yz - wx) * sz;
        imArray[offset + 10] = (1 - (xx + yy)) * sz;
        imArray[offset + 11] = 0;
        imArray[offset + 12] = px;
        imArray[offset + 13] = py;
        imArray[offset + 14] = pz;
        imArray[offset + 15] = 1;

        matrixBatchDirty = true;
      }

      const tierPart = stateCode >= STATE.AGENT_PROFESSOR && stateCode <= STATE.AGENT_MASTER ? coreWorld.curriculumTier[i] : 0;
      const cacheKey = stateCode + coreWorld.petStage[i] * 100 + coreWorld.brainType[i] * 1000 + tierPart * 10000;
      if (coreWorld.colorDirty[i] || this.slotColorCache[i] !== cacheKey) {
        this.slotColorCache[i] = cacheKey;
        coreWorld.colorDirty[i] = 0;

        let r = 0,
          g = 1,
          b = 1;
        if (stateCode === STATE.RHIZOH) {
          r = 0;
          g = 1;
          b = 1;
        } else if (stateCode === STATE.CITIZEN && coreWorld.brainType[i] > 0) {
          const a = coreWorld.brainType[i];
          r = 0.2 + (a % 3) * 0.2;
          g = 0.75;
          b = 0.35 + (a % 5) * 0.1;
        } else if (stateCode === STATE.GHOSTPET) {
          const stage = coreWorld.petStage[i];
          if (stage === PET_STAGE.SEED) {
            r = 0.5;
            g = 0.5;
            b = 0.5;
          } else if (stage === PET_STAGE.BUD) {
            r = 0.2;
            g = 0.8;
            b = 0.2;
          } else if (stage === PET_STAGE.SPIRIT) {
            r = 0.2;
            g = 0.5;
            b = 1.0;
          } else if (stage === PET_STAGE.GUARDIAN) {
            r = 0.8;
            g = 0.2;
            b = 1.0;
          } else {
            r = 1.0;
            g = 0.84;
            b = 0.0;
          }
        } else if (stateCode === STATE.PENDING) {
          r = 1;
          g = 0;
          b = 1;
        } else if (stateCode === STATE.AGENT_PROFESSOR) {
          r = 0.95;
          g = 0.75;
          b = 0.15;
        } else if (stateCode === STATE.AGENT_CADET) {
          r = 0.15;
          g = 0.55;
          b = 0.95;
        } else if (stateCode === STATE.AGENT_STUDENT) {
          r = 0.2;
          g = 0.95;
          b = 0.85;
        } else if (stateCode === STATE.AGENT_MASTER) {
          r = 0.75;
          g = 0.35;
          b = 1.0;
        }

        const cIdx = i * 3;
        icArray[cIdx] = r;
        icArray[cIdx + 1] = g;
        icArray[cIdx + 2] = b;
        colorBatchDirty = true;
      }
    }

    this.agentInstances.count = activeCount;

    if (matrixBatchDirty) this.agentInstances.instanceMatrix.needsUpdate = true;
    if (colorBatchDirty && this.agentInstances.instanceColor) this.agentInstances.instanceColor.needsUpdate = true;

    const camMode = uiStore.getState().cameraMode;
    const layerFocus = uiStore.getState().layerFocus;

    if (camMode === "ORBIT") {
      this.controls.enabled = false;
      let lookTargetY = 500;
      if (mode === "GLOBE") {
        const camAngle = simTime * 0.1;
        const orbitBoost = 1 + (layerFocus / 13) * 0.07;
        this.targetCamPos.set(
          Math.cos(camAngle) * 14000 * orbitBoost,
          5000 + Math.sin(simTime * 0.2) * 1500,
          Math.sin(camAngle) * 14000 * orbitBoost
        );
        this.globe.rotation.y += 0.0003;
        this.globeGroup.visible = true;
        if (this.globe.material.opacity < 0.9) this.globe.material.opacity += 0.02;
      } else {
        const cityPan = simTime * 0.05;
        this.targetCamPos.set(Math.cos(cityPan) * 5200, 2100 + Math.sin(simTime * 0.03) * 400, Math.sin(cityPan) * 5200);
        lookTargetY = Math.max(140, RealMapCore.castleWorldPos.y * 0.45);
        this._camScratch.set(cx, lookTargetY, cz);
        if (this.globe.material.opacity > 0) this.globe.material.opacity -= 0.02;
        else this.globeGroup.visible = false;
      }

      this.camera.position.lerp(this.targetCamPos, 0.022);
      if (mode === "REAL_MAP") {
        this.targetCamDir.copy(this._camScratch).sub(this.camera.position).normalize();
      } else {
        this.targetCamDir.set(0, lookTargetY, 0).sub(this.camera.position).normalize();
      }
      this._qTemp.setFromUnitVectors(this.camForward, this.targetCamDir);
      this.camera.quaternion.slerp(this._qTemp, 0.022);
    } else {
      this.controls.enabled = true;
      this.controls.update();
    }

    if (mode === "REAL_MAP" && this.droneBridge) {
      this.droneBridge.tick(simTime, frameDt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  setCameraMode(mode) {
    uiStore.dispatch({ type: "SET_CAMERA_MODE", payload: mode === "DRONE" ? "DRONE" : "ORBIT" });
  }

  focusWorldPoint(x, y, z, distance = 1600) {
    uiStore.dispatch({ type: "SET_CAMERA_MODE", payload: "DRONE" });
    this.controls.target.set(x, y, z);
    this.camera.position.set(x + distance * 0.48, y + distance * 0.32, z + distance * 0.52);
    this.controls.update();
  }

  focusNextAgent() {
    const n = coreWorld.activeCount;
    if (n <= 0) return -1;
    for (let step = 0; step < n; step++) {
      const i = this._zoomAgentCursor % n;
      this._zoomAgentCursor++;
      if (coreWorld.state[i] !== 0) {
        const d = 720 + (coreWorld.brainType[i] % 7) * 130 + (coreWorld.squadId[i] % 6) * 95;
        this.focusWorldPoint(coreWorld.posX[i], coreWorld.posY[i], coreWorld.posZ[i], d);
        return i;
      }
    }
    return -1;
  }

  focusCastleBeacon() {
    const p = RealMapCore.castleWorldPos;
    this.focusWorldPoint(p.x, p.y, p.z, 2600);
  }

  focusIstanbulPOI(key) {
    const poi = ISTANBUL_POI[key];
    if (!poi) return;
    const xz = latLonToSceneXZ(poi.lat, poi.lon);
    this.focusWorldPoint(xz.x, 200, xz.z, 3000);
  }

  terminate() {
    this.active = false;
    if (this.droneBridge) {
      this.droneBridge.dispose();
      this.droneBridge = null;
    }
    if (this.controls) this.controls.dispose();
    this.scene.traverse((object) => {
      if (!object.isMesh && !object.isInstancedMesh && !object.isLine) return;
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
        else object.material.dispose();
      }
    });

    if (this.container && this.renderer.domElement) this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}

const SovereignHud = memo(({ engineRef }) => {
  const viewMode = useUISelector((s) => s.viewMode);
  const realityMode = useUISelector((s) => s.realityMode);
  const isSatActive = useUISelector((s) => s.isSatelliteActive);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(Math.floor(coreWorld.simTime * 10) / 10), 100);
    return () => clearInterval(interval);
  }, []);

  const toggleReality = () => {
    const nextMode = realityMode === "GLOBE" ? "REAL_MAP" : "GLOBE";
    uiStore.dispatch({ type: "SET_REALITY", payload: nextMode });
    if (engineRef.current) engineRef.current.transitionReality(nextMode);
    uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `LAYER SHIFT: ${nextMode}` } });
  };

  const toggleSatellite = () => {
    uiStore.dispatch({ type: "TOGGLE_SATELLITE" });
    uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L4: UYDU KATMANI TOGGLE" } });
  };

  return (
    <div className="flex flex-col gap-6 pointer-events-auto">
      <div className="bg-[#0a0f1d]/95 backdrop-blur-3xl border border-cyan-400/40 p-7 rounded-[2.5rem] flex items-center gap-6 shadow-[0_0_60px_rgba(0,255,255,0.15)] ring-1 ring-white/10 transition-all">
        <div
          onClick={() => uiStore.dispatch({ type: "TOGGLE_VIEW" })}
          className={`p-5 rounded-3xl cursor-pointer transition-all duration-700 ${viewMode === "DEVELOPER" ? "bg-rose-500 shadow-[0_0_40px_#f43f5e]" : "bg-cyan-400 shadow-[0_0_40px_#00ffff]"}`}
        >
          {viewMode === "DEVELOPER" ? <ShieldAlert size={30} className="text-black" /> : <Orbit size={30} className="text-black animate-spin-slow" />}
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-widest text-white uppercase">{viewMode}</h1>
          <div className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.5em]">
            {CODEX_VERSION} • {tick}s
          </div>
          <p className="text-[8px] text-white/45 mt-3 normal-case tracking-wide font-semibold leading-snug max-w-[28rem]">
            LLM MMO city simulation (research sandbox) · Playable game (real-time multiplayer feel) · Agent marketplace + user-owned AI ecosystem · Castle Genesis production platform
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={toggleReality}
          className={`flex-1 relative overflow-hidden group flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-500 shadow-2xl backdrop-blur-md ${realityMode === "REAL_MAP" ? "bg-emerald-950/80 border-emerald-500/50 hover:bg-emerald-900" : "bg-indigo-950/80 border-indigo-500/50 hover:bg-indigo-900"}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          {realityMode === "REAL_MAP" ? <MapIcon size={28} className="text-emerald-400" /> : <Globe size={28} className="text-indigo-400" />}
          <div className="text-left z-10">
            <div className="text-[10px] text-white/50 tracking-[0.3em] font-black uppercase">Active Layer</div>
            <div className={`text-lg font-black tracking-widest ${realityMode === "REAL_MAP" ? "text-emerald-400" : "text-indigo-400"}`}>
              {realityMode === "REAL_MAP" ? "REAL CITY 3D (CESIUM)" : "ABSTRACT GLOBE"}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={toggleSatellite}
          className={`p-5 rounded-[2rem] border flex items-center justify-center transition-all cursor-pointer ${isSatActive ? "bg-amber-500/20 border-amber-400/50 text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]" : "bg-white/5 border-white/10 text-white/30 hover:text-amber-300/80"}`}
          aria-pressed={isSatActive}
        >
          <Satellite size={28} className={isSatActive ? "animate-pulse" : ""} />
        </button>
      </div>

      <div className="bg-[#050a14]/90 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] w-[450px] text-left shadow-2xl border-t-cyan-500/20">
         <div className="text-[10px] text-cyan-400 tracking-[0.5em] mb-6 flex items-center gap-2 uppercase font-black">
            <Layers size={16} className="animate-pulse text-rose-400" /> LOG STREAM (L10 FEED)
         </div>
        <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar flex flex-col">
          <LogList />
        </div>
      </div>
    </div>
  );
});

const LogList = memo(() => {
  useUISelector((s) => s.tickCounter);
  const logs = logBuffer.toArray();
  return logs.map((l, i) => (
    <div key={i} className="text-[10px] text-white/60 font-mono flex gap-3 border-b border-white/5 pb-2 hover:text-cyan-300 transition-colors group">
      <span className={`${l.type === "ERR" ? "text-rose-500" : l.type === "WARN" ? "text-amber-400" : "text-cyan-500"} group-hover:animate-pulse`}>
        [{String(l.ts).split(" ")[0] || l.ts}]›
      </span>{" "}
      {l.data}
    </div>
  ));
});

const LayerStackMini = memo(() => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  return (
    <div className="rounded-2xl p-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-cyan-500/90 tracking-[0.35em] mb-2 font-black flex items-center gap-2">
        <Cpu size={12} /> L0–L13 RHIZOH STACK
      </div>
      <div className="flex flex-wrap gap-1">
        {LAYER_SPECS.map((L) => (
          <button
            key={L.code}
            type="button"
            onClick={() => {
              uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: L.id });
              pushRhizohEvent("LAYER_FOCUS", "Rhizoh", L.code, L.id / 10);
            }}
            className={`text-[8px] px-2 py-1 rounded-lg border transition-colors ${focus === L.id ? "border-cyan-400 text-cyan-200 bg-cyan-500/10" : "border-white/10 text-white/45 hover:border-white/25"}`}
            title={L.name}
          >
            {L.code}
          </button>
        ))}
      </div>
      <div className="text-[8px] text-white/35 mt-2 font-mono">{LAYER_SPECS.find((x) => x.id === focus)?.name || "—"}</div>
    </div>
  );
});

const LayerRail = memo(() => {
  useUISelector((s) => s.layerTransitionSeq);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const rows = layerTransitionRing.toArray();
  return (
    <div className="rounded-2xl p-3 max-h-36 overflow-y-auto no-scrollbar" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-cyan-400 tracking-[0.3em] mb-2 font-black flex items-center gap-2">
        <Layers size={14} /> KATMAN GEÇİŞLERİ
      </div>
      {rows.length === 0 ? (
        <div className="text-[8px] text-white/35 normal-case font-semibold">L0–L13 düğmeleri veya komut: LAYER 7 · L12=META · L13=ROBOTICS</div>
      ) : (
        <div className="space-y-1 text-[8px] text-white/65 font-mono">
          {rows.map((r, i) => (
            <div key={`${r.ts}-${i}`} className="border-b border-white/5 pb-1">
              <span className="text-cyan-500">{r.ts}</span> · {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const LayerExperiencePanel = memo(({ engineRef }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const reality = useUISelector((s) => s.realityMode);
  const camera = useUISelector((s) => s.cameraMode);
  const isSat = useUISelector((s) => s.isSatelliteActive);
  const profile = LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10];
  const spec = LAYER_SPECS.find((l) => l.id === focus) || LAYER_SPECS[10];
  const tinyBtn = "text-[8px] px-2 py-1.5 rounded-lg border font-bold transition-colors";

  const runQuickAction = async (action) => {
    const engine = engineRef.current;
    if (!engine) return;
    const log = (data) =>
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data }
      });

    if (action === "ZOOM AGENT") {
      engine.focusNextAgent();
      log("LAYER ACTION · Zoom agent");
      return;
    }
    if (action === "ZOOM CASTLE") {
      uiStore.dispatch({ type: "SET_REALITY", payload: "REAL_MAP" });
      await engine.transitionReality("REAL_MAP");
      const c = window.__CASTLE_CESIUM__;
      if (c?.focusCastle) c.focusCastle();
      else engine.focusCastleBeacon();
      log("LAYER ACTION · Zoom castle");
      return;
    }
    log(`LAYER ACTION · Komut terminali: ${action}`);
  };

  const applyLayerPreset = async (id) => {
    const p = LAYER_UI_PROFILES[id];
    const engine = engineRef.current;
    if (!p || !engine) return;

    uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: id });
    if (p.camera) engine.setCameraMode(p.camera);
    if (p.reality) {
      uiStore.dispatch({ type: "SET_REALITY", payload: p.reality });
      await engine.transitionReality(p.reality);
    }
    const satShouldBe = !!p.satellite;
    if (satShouldBe !== isSat) uiStore.dispatch({ type: "TOGGLE_SATELLITE" });

    uiStore.dispatch({
      type: "ADD_LOG",
      payload: {
        ts: new Date().toLocaleTimeString(),
        type: "SYS",
        data: `LAYER PRESET · ${spec.code} (${spec.name}) · ${p.reality}/${p.camera}${satShouldBe ? " + SAT" : ""}`
      }
    });
  };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: profile.theme.bg, border: `1px solid ${profile.theme.border}` }}>
      <div className="text-[9px] text-cyan-300 tracking-[0.35em] flex items-center gap-2 font-black">
        <Layers size={14} /> LAYER EXPERIENCE
      </div>
      <div className="rounded-xl border border-white/10 p-3 bg-white/[0.03]">
        <div className="text-[8px] text-white/45 tracking-[0.25em]">{spec.code}</div>
        <div className="text-xs text-white font-black mt-1">{spec.name}</div>
        <div className="text-[9px] text-cyan-100 mt-2">{profile.mission}</div>
        <div className="text-[8px] text-white/45 mt-1 leading-relaxed">{profile.detail}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[8px]">
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Reality: <span className="text-white">{reality}</span></div>
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Camera: <span className="text-white">{camera}</span></div>
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Satellite: <span className="text-white">{isSat ? "ON" : "OFF"}</span></div>
        <div className="rounded-lg border border-white/10 p-2 bg-black/25 text-white/70">Preset: <span className="text-white">{profile.reality}/{profile.camera}</span></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${tinyBtn} border-cyan-400/35 text-cyan-100`} onClick={() => void applyLayerPreset(focus)}>
          Katman preset uygula
        </button>
        {profile.quickActions.map((action) => (
          <button
            key={action}
            type="button"
            className={`${tinyBtn} border-white/15 text-white/70 hover:border-cyan-400/35`}
            onClick={() => void runQuickAction(action)}
          >
            {action}
          </button>
        ))}
      </div>
      <div className="text-[8px] text-white/35 leading-relaxed">
        L0-L13 arasında geçişte artık yalnızca log değil, katman bazlı görev, görünüm preset'i ve hızlı operasyon butonları uygulanır.
      </div>
    </div>
  );
});

const CameraFlightDeck = memo(({ engineRef }) => {
  const camMode = useUISelector((s) => s.cameraMode);
  const reality = useUISelector((s) => s.realityMode);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const btn = "text-[8px] px-2 py-1.5 rounded-lg border font-bold transition-colors";
  const flyRealMapThen = async (fn) => {
    const e = engineRef.current;
    if (!e) return;
    uiStore.dispatch({ type: "SET_REALITY", payload: "REAL_MAP" });
    await e.transitionReality("REAL_MAP");
    fn(e);
  };
  const flyCesium = async (action) => {
    uiStore.dispatch({ type: "SET_REALITY", payload: "REAL_MAP" });
    await engineRef.current?.transitionReality("REAL_MAP");
    const c = window.__CASTLE_CESIUM__;
    if (!c) return false;
    if (action === "castle") c.focusCastle?.();
    else if (action && action.startsWith("poi:")) c.focusPOI?.(action.slice(4));
    else c.flyToIstanbul?.();
    return true;
  };
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-sky-300 tracking-[0.35em] flex flex-wrap items-center gap-2 font-black">
        <Camera size={14} /> KAMERA · <span className="text-white">{camMode}</span>
        <span className="text-white/40 font-mono normal-case tracking-normal">{reality === "REAL_MAP" ? "İstanbul REAL_MAP" : "Globe"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btn} border-emerald-500/45 ${camMode === "ORBIT" ? "bg-emerald-500/15 text-emerald-200" : "border-white/15 text-white/55"}`} onClick={() => engineRef.current?.setCameraMode("ORBIT")}>
          Orbit auto
        </button>
        <button type="button" className={`${btn} border-amber-500/45 ${camMode === "DRONE" ? "bg-amber-500/15 text-amber-200" : "border-white/15 text-white/55"}`} onClick={() => engineRef.current?.setCameraMode("DRONE")}>
          Drone free
        </button>
        <button type="button" className={`${btn} border-cyan-500/40 text-cyan-100`} onClick={() => engineRef.current?.focusNextAgent()}>
          Zoom agent
        </button>
        <button
          type="button"
          className={`${btn} border-orange-400/45 text-orange-100`}
          onClick={() =>
            void (async () => {
              const ok = await flyCesium("castle");
              if (!ok) await flyRealMapThen((e) => e.focusCastleBeacon());
            })()
          }
        >
          Zoom castle
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Navigation2 size={12} className="text-white/35 shrink-0" />
        {["FATIH", "KADIKOY", "BESIKTAS", "USKUDAR"].map((k) => (
          <button
            key={k}
            type="button"
            className={`${btn} border-white/12 text-white/70 normal-case tracking-normal`}
            onClick={() =>
              void (async () => {
                const ok = await flyCesium(`poi:${k}`);
                if (!ok) await flyRealMapThen((e) => e.focusIstanbulPOI(k));
              })()
            }
          >
            {ISTANBUL_POI[k].label}
          </button>
        ))}
      </div>
      <p className="text-[7px] text-white/40 normal-case tracking-wide leading-relaxed font-semibold">
        Drone: sürükleyerek dön · tekerlek zoom · orta tuş kaydır. Gerçek şehir için önce “PROCEDURAL CITY” (REAL_MAP).
      </p>
    </div>
  );
});

const CastleAcademicsCard = memo(() => {
  const tier = useUISelector((s) => s.academicsTier);
  const nexus = useUISelector((s) => s.district0Energy);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  return (
    <div className="rounded-[2rem] p-5 backdrop-blur-xl" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[10px] text-violet-300 tracking-[0.4em] mb-2 flex items-center gap-2 font-black uppercase">
        <GraduationCap size={16} /> Castle Academics
      </div>
      <p className="text-[9px] text-white/55 leading-relaxed uppercase tracking-widest mb-3">
        L8 district index 0 · agents with archetypes gain XP · ties to GreenRoom / Spiral training loops.
      </p>
      <div className="text-sm font-mono text-violet-200">
        Tier <span className="text-white">{tier}</span> · Nexus Δ <span className="text-emerald-300">{nexus.toFixed(1)}</span>
      </div>
      <div className="text-[8px] text-white/35 mt-2">1500 procedural boxes · {MAX_DISTRICTS} districts · heatmap 256²</div>
    </div>
  );
});

const EventMeshMini = memo(() => {
  useUISelector((s) => s.tickCounter);
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const rows = eventMesh.recent(8);
  return (
    <div className="rounded-2xl p-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] text-fuchsia-300/90 tracking-[0.3em] mb-2 font-black">L9 EVENT MESH</div>
      <div className="text-[9px] text-white/55 space-y-1 max-h-28 overflow-y-auto font-mono no-scrollbar">
        {rows.length === 0 ? <span className="text-white/30">awaiting pulses…</span> : null}
        {rows.map((ev, i) => (
          <div key={i}>
            {ev.ts} · {ev.eventType} · {ev.eventSource}→{ev.eventTarget} · ε{ev.eventEnergy.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
});

const MyLLMConnectionsPanel = memo(({ selectedConnectionId, onSelectConnection }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("idle");
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const apiBase = getRhizohApiBase();
  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };

  const loadConnections = async () => {
    try {
      const res = await fetch(`${apiBase}/llm/connections`, { headers });
      const json = await res.json();
      if (json?.ok) {
        setItems(Array.isArray(json.items) ? json.items : []);
        if (!selectedConnectionId) {
          const d = (json.items || []).find((x) => x.isDefault) || json.items?.[0];
          if (d?.id) onSelectConnection(d.id);
        }
      }
    } catch {
      /* keep silent in UI */
    }
  };

  useEffect(() => {
    void loadConnections();
  }, []);

  const createConn = async () => {
    if (!provider || !model || !apiKey) return;
    setStatus("saving");
    try {
      const res = await fetch(`${apiBase}/llm/connections`, {
        method: "POST",
        headers,
        body: JSON.stringify({ provider, model, apiKey, label, isDefault: items.length === 0 })
      });
      const json = await res.json();
      if (json?.ok) {
        setItems(json.items || []);
        setApiKey("");
        if (json?.id) onSelectConnection(json.id);
        setStatus("saved");
      } else {
        setStatus(`err:${json?.error || "create_failed"}`);
      }
    } catch {
      setStatus("err:create_failed");
    }
  };

  const setDefault = async (id) => {
    try {
      const res = await fetch(`${apiBase}/llm/connections/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isDefault: true })
      });
      const json = await res.json();
      if (json?.ok) {
        setItems(json.items || []);
        onSelectConnection(id);
      }
    } catch {
      /* noop */
    }
  };

  const removeConn = async (id) => {
    try {
      const res = await fetch(`${apiBase}/llm/connections/${id}`, { method: "DELETE", headers });
      const json = await res.json();
      if (json?.ok) {
        const next = json.items || [];
        setItems(next);
        if (selectedConnectionId === id) onSelectConnection(next[0]?.id || "");
      }
    } catch {
      /* noop */
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">MY LLM CONNECTIONS</div>
      <div className="grid grid-cols-2 gap-2">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Google Gemini</option>
          <option value="xai">xAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="mistral">Mistral</option>
          <option value="openrouter">OpenRouter</option>
        </select>
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="model" className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="api key" className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      </div>
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={createConn}>
          Kaydet
        </button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void loadConnections()}>
          Yenile
        </button>
        <span className="text-[8px] text-white/40 self-center">{status}</span>
      </div>
      <div className="space-y-2 max-h-28 overflow-y-auto no-scrollbar">
        {items.length === 0 ? <div className="text-[8px] text-white/40">Kayıt yok.</div> : null}
        {items.map((it) => (
          <div key={it.id} className={`rounded border px-2 py-1 text-[8px] ${selectedConnectionId === it.id ? "border-cyan-300 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}>
            <div className="text-white/80 normal-case">{it.label || `${it.provider}:${it.model}`}</div>
            <div className="text-white/45 normal-case">{it.provider} · {it.model} · {it.keyMask}</div>
            <div className="flex gap-2 mt-1">
              <button type="button" className={`${btn} border-white/15 text-white/70`} onClick={() => onSelectConnection(it.id)}>Kullan</button>
              <button type="button" className={`${btn} border-white/15 text-white/70`} onClick={() => void setDefault(it.id)}>Default</button>
              <button type="button" className={`${btn} border-rose-400/35 text-rose-200`} onClick={() => void removeConn(it.id)}>Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const AgentIdentityLabPanel = memo(({ selectedAgentId, onSelectAgent }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [items, setItems] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [role, setRole] = useState("AGENT_STUDENT");
  const [status, setStatus] = useState("");
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const load = async () => {
    try {
      const res = await fetch(`${apiBase}/agents/identities`, { headers });
      const json = await res.json();
      if (json?.ok) {
        setItems(json.items || []);
        if (!selectedAgentId && json.items?.[0]?.id) onSelectAgent(json.items[0].id);
      }
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!agentId.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch(`${apiBase}/agents/identities`, {
        method: "POST",
        headers,
        body: JSON.stringify({ agentId: agentId.trim(), role, capabilityLevel: 1, personaSeed: { style: "adaptive" } })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("saved");
        setAgentId("");
        await load();
        if (json?.row?.id) onSelectAgent(json.row.id);
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">AGENT IDENTITY LAB</div>
      <div className="flex gap-2">
        <input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent-id" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="AGENT_CADET">CADET</option>
          <option value="AGENT_STUDENT">STUDENT</option>
          <option value="AGENT_PROFESSOR">PROFESSOR</option>
          <option value="AGENT_MASTER">MASTER</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={create}>Kayıt</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void load()}>Yenile</button>
        <span className="text-[8px] text-white/40 self-center">{status}</span>
      </div>
      <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
        {items.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`w-full text-left text-[8px] rounded border px-2 py-1 normal-case ${selectedAgentId === a.id ? "border-cyan-300 bg-cyan-500/10" : "border-white/10 bg-black/20"}`}
            onClick={() => onSelectAgent(a.id)}
          >
            {a.id} · {a.role} · rank {a?.progress?.academyRank ?? 1}
          </button>
        ))}
      </div>
    </div>
  );
});

const AcademyEventRoomPanel = memo(({ selectedAgentId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [items, setItems] = useState([]);
  const [type, setType] = useState("LECTURE");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const load = async () => {
    try {
      const res = await fetch(`${apiBase}/academy/events`, { headers });
      const json = await res.json();
      if (json?.ok) setItems(json.items || []);
    } catch {
      /* noop */
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const queueEvent = async () => {
    setStatus("queueing");
    try {
      const participants = selectedAgentId ? [{ agentId: selectedAgentId, role: "focus" }] : [];
      const res = await fetch(`${apiBase}/academy/events`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type, topic: topic || "academy session", participants, roomId: "academy-main" })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("queued");
        setTopic("");
        await load();
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  const resolveEvent = async (id) => {
    try {
      const res = await fetch(`${apiBase}/academy/events/${id}/resolve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ status: "resolved", xpGain: 140 })
      });
      const json = await res.json();
      if (json?.ok) await load();
    } catch {
      /* noop */
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">ACADEMY EVENT ROOM</div>
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="LECTURE">LECTURE</option>
          <option value="EXAM">EXAM</option>
          <option value="MENTOR_SESSION">MENTOR_SESSION</option>
          <option value="RESEARCH_QUEST">RESEARCH_QUEST</option>
          <option value="DUEL">DUEL</option>
        </select>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="topic" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      </div>
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={queueEvent}>Queue</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void load()}>Yenile</button>
        <span className="text-[8px] text-white/40 self-center">{status}</span>
      </div>
      <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar">
        {items.map((ev) => (
          <div key={ev.id} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-[8px] normal-case">
            {ev.type} · {ev.topic} · {ev.status}
            {ev.status !== "resolved" ? (
              <button type="button" className={`${btn} ml-2 border-emerald-400/35 text-emerald-200`} onClick={() => void resolveEvent(ev.id)}>
                Resolve
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
});

const RhizohContinuityHud = memo(({ selectedAgentId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [profile, setProfile] = useState(null);
  const [context, setContext] = useState(null);
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const refresh = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${apiBase}/memory/profile`, { headers }),
        fetch(`${apiBase}/memory/context`, {
          method: "POST",
          headers,
          body: JSON.stringify({ agentId: selectedAgentId || "", query: "continuity", limit: 90 })
        })
      ]);
      const p = await pRes.json();
      const c = await cRes.json();
      if (p?.ok) setProfile(p.profile || null);
      if (c?.ok) setContext(c.context || null);
    } catch {
      /* noop */
    }
  };
  useEffect(() => {
    void refresh();
  }, [selectedAgentId]);

  const heat = (context?.episodic?.length || 0) + (context?.semantic?.length || 0) * 2 + (context?.procedural?.length || 0) * 3;
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">RHIZOH CONTINUITY HUD</div>
      <div className="text-[8px] text-white/70 normal-case">
        Goals: {(profile?.goals || []).slice(0, 3).join(" · ") || "—"}
      </div>
      <div className="text-[8px] text-white/50 normal-case">
        Memory heat: {heat} · E:{context?.episodic?.length || 0} S:{context?.semantic?.length || 0} P:{context?.procedural?.length || 0}
      </div>
      <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void refresh()}>Yenile</button>
    </div>
  );
});

const StudioMirrorPanel = memo(() => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [liveArmed, setLiveArmed] = useState(false);
  const [status, setStatus] = useState("idle");
  const [protocol, setProtocol] = useState("WHIP");
  const [target, setTarget] = useState("");
  const [sessions, setSessions] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchRows, setSearchRows] = useState([]);
  const [note, setNote] = useState("");
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const refreshMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      setMicOn(stream.getAudioTracks().length > 0);
      setCamOn(stream.getVideoTracks().length > 0);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("camera+mic hazır");
    } catch {
      setStatus("media izin hatası");
    }
  };

  const toggleScreen = async () => {
    if (screenOn) {
      setScreenOn(false);
      setStatus("screen off");
      return;
    }
    try {
      const sc = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenOn(true);
      if (videoRef.current) videoRef.current.srcObject = sc;
      sc.getVideoTracks()[0].addEventListener("ended", () => setScreenOn(false));
      setStatus("screen paylaşımı açık");
    } catch {
      setStatus("screen izin hatası");
    }
  };

  const toggleRecord = () => {
    const s = streamRef.current;
    if (!s) {
      setStatus("önce media başlat");
      return;
    }
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      setStatus("kayıt durdu");
      return;
    }
    try {
      const rec = new MediaRecorder(s);
      recRef.current = rec;
      rec.ondataavailable = () => {};
      rec.start();
      setRecording(true);
      setStatus("kayıt başladı");
    } catch {
      setStatus("kayıt başlatılamadı");
    }
  };

  const armPublish = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/publish/session`, {
        method: "POST",
        headers,
        body: JSON.stringify({ protocol, target, roomId: "studio-main", bridge: "OBS/LiveKit/SFU", status: "armed" })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus(`publish armed:${json?.session?.id || ""}`);
        await refreshSessions();
      } else {
        setStatus(`publish err:${json?.error || "failed"}`);
      }
    } catch {
      setStatus("publish err");
    }
  };

  const runHealthCheck = async () => {
    const latest = sessions[0];
    const targetToCheck = target || latest?.target || "";
    const proto = protocol || latest?.protocol || "WHIP";
    if (!targetToCheck) {
      setStatus("health-check için target gerekli");
      return;
    }
    try {
      const res = await fetch(`${apiBase}/studio/publish/health-check`, {
        method: "POST",
        headers,
        body: JSON.stringify({ protocol: proto, target: targetToCheck, sessionId: latest?.id || "" })
      });
      const json = await res.json();
      if (json?.ok) {
        const h = json.health || {};
        setStatus(`health:${h.ok ? "ok" : "degraded"} (${h.reason || ""})`);
        await refreshSessions();
      } else {
        setStatus(`health err:${json?.error || "failed"}`);
      }
    } catch {
      setStatus("health-check error");
    }
  };

  const refreshSessions = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/publish/sessions`, { headers });
      const json = await res.json();
      if (json?.ok) setSessions(json.items || []);
    } catch {
      /* noop */
    }
  };

  const refreshTranscripts = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/transcripts?limit=60`, { headers: { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() } });
      const json = await res.json();
      if (json?.ok) setTranscripts(json.items || []);
    } catch {
      /* noop */
    }
  };

  const addNote = async () => {
    const text = note.trim();
    if (!text) return;
    try {
      const res = await fetch(`${apiBase}/studio/transcripts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ source: "operator", eventType: "studio-note", text, roomId: "studio-main", meta: { layer: "studio" } })
      });
      const json = await res.json();
      if (json?.ok) {
        setNote("");
        await refreshTranscripts();
      }
    } catch {
      /* noop */
    }
  };

  const searchMeta = async () => {
    try {
      const res = await fetch(`${apiBase}/studio/metadata/search?q=${encodeURIComponent(searchQ)}&limit=80`, {
        headers: { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() }
      });
      const json = await res.json();
      if (json?.ok) setSearchRows(json.items || []);
    } catch {
      /* noop */
    }
  };

  const jumpToTranscriptTarget = (row) => {
    const meta = row?.meta || {};
    const c = window.__CASTLE_CESIUM__;
    const lat = Number(meta?.lat);
    const lon = Number(meta?.lon);
    if (c && Number.isFinite(lat) && Number.isFinite(lon)) {
      c.streetView?.(lat, lon, 180);
      return;
    }
    if (meta?.directive === "ZOOM_CASTLE") {
      c?.focusCastle?.();
      return;
    }
    if (meta?.directive === "ISTANBUL_OVERVIEW") {
      c?.flyToIstanbul?.();
    }
  };

  useEffect(() => {
    void refreshSessions();
    void refreshTranscripts();
    const intv = setInterval(() => {
      void refreshTranscripts();
    }, 3000);
    return () => {
      clearInterval(intv);
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">STUDIO MIRROR</div>
      <div className="text-[8px] text-white/60 normal-case">
        mic:{micOn ? "on" : "off"} · cam:{camOn ? "on" : "off"} · screen:{screenOn ? "on" : "off"} · rec:{recording ? "on" : "off"} · live:{liveArmed ? "armed" : "idle"}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void refreshMedia()}>Mic+Cam</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void toggleScreen()}>{screenOn ? "Screen Off" : "Screen On"}</button>
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={toggleRecord}>{recording ? "Stop Rec" : "Start Rec"}</button>
        <button type="button" className={`${btn} border-rose-400/35 text-rose-200`} onClick={() => setLiveArmed((v) => !v)}>{liveArmed ? "Live Disarm" : "Live Arm"}</button>
      </div>
      <div className="flex gap-2">
        <select value={protocol} onChange={(e) => setProtocol(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="WHIP">WHIP</option>
          <option value="RTMP">RTMP</option>
          <option value="SFU">SFU</option>
        </select>
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="publish target / endpoint" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-fuchsia-400/35 text-fuchsia-200`} onClick={() => void armPublish()}>Arm Publish</button>
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={() => void runHealthCheck()}>Health Check</button>
      </div>
      <div className="flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="studio note / event metadata" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void addNote()}>Add Note</button>
      </div>
      <div className="flex gap-2">
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="metadata search (event, place, directive...)" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void searchMeta()}>Search</button>
      </div>
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-28 rounded border border-white/10 bg-black/40" />
      <div className="text-[8px] text-white/45">{status}</div>
      {sessions.length > 0 ? (
        <div className="text-[8px] text-white/65 normal-case max-h-14 overflow-y-auto no-scrollbar">
          {sessions.slice(0, 4).map((s) => (
            <div key={s.id}>{s.protocol} · {s.target || "n/a"} · {s.status}</div>
          ))}
        </div>
      ) : null}
      <div className="text-[8px] text-cyan-300 tracking-[0.2em]">LIVE TRANSCRIPT RAIL</div>
      <div className="text-[8px] text-white/70 normal-case max-h-24 overflow-y-auto no-scrollbar border border-white/10 rounded p-2 bg-black/20 space-y-1">
        {transcripts.length === 0 ? (
          "Henüz transcript yok."
        ) : (
          transcripts.map((t) => (
            <div key={t.id || `${t.ts}-${t.eventType}`} className="border-b border-white/10 pb-1">
              <div>{new Date(t.ts || Date.now()).toLocaleTimeString()} · {t.eventType} · {t.text}</div>
              <div className="flex gap-2 mt-1">
                <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => jumpToTranscriptTarget(t)}>
                  Jump
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {searchRows.length > 0 ? (
        <div className="text-[8px] text-emerald-200 normal-case max-h-24 overflow-y-auto no-scrollbar border border-emerald-500/30 rounded p-2 bg-emerald-900/10">
          {searchRows.map((t) => `${new Date(t.ts || Date.now()).toLocaleTimeString()} · ${t.eventType} · ${t.text}`).join("\n")}
        </div>
      ) : null}
    </div>
  );
});

const RoboticsMechanicsPanel = memo(({ selectedAgentId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [deviceName, setDeviceName] = useState("castle-drone-01");
  const [deviceKind, setDeviceKind] = useState("drone");
  const [endpoint, setEndpoint] = useState("");
  const [message, setMessage] = useState("Hedefe güvenli rota planla ve telemetriyi optimize et.");
  const [status, setStatus] = useState("");
  const [devices, setDevices] = useState([]);
  const [telemetryRows, setTelemetryRows] = useState([]);
  const [bridgeReply, setBridgeReply] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [telemetryLat, setTelemetryLat] = useState(41.0082);
  const [telemetryLon, setTelemetryLon] = useState(28.9784);
  const [telemetrySpeed, setTelemetrySpeed] = useState(8);
  const [autoTitle, setAutoTitle] = useState("Akşam yemeğini hazırlamaya başla");
  const [autoAt, setAutoAt] = useState("");
  const [automations, setAutomations] = useState([]);
  const [deviceAdapter, setDeviceAdapter] = useState("websocket");
  const [capabilitiesText, setCapabilitiesText] = useState("smart-oven.preheat,smart-watch.notify");
  const [commandAction, setCommandAction] = useState("smart-watch.notify");
  const [commandParams, setCommandParams] = useState('{"text":"Castle update hazır"}');
  const [commands, setCommands] = useState([]);
  const [graphSummary, setGraphSummary] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("telegram");
  const [socialEndpoint, setSocialEndpoint] = useState("");
  const [socialChannels, setSocialChannels] = useState([]);
  const [broadcastText, setBroadcastText] = useState("Castle teknik geliştirme güncellemesi yayında.");
  const [ethicsTracks, setEthicsTracks] = useState([]);
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";

  const loadDevices = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/devices`, { headers });
      const json = await res.json();
      if (json?.ok) {
        setDevices(json.items || []);
        if (!selectedDeviceId && json.items?.[0]?.id) setSelectedDeviceId(json.items[0].id);
      }
    } catch {
      /* noop */
    }
  };
  const loadTelemetry = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/telemetry`, { headers });
      const json = await res.json();
      if (json?.ok) setTelemetryRows(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadAutomations = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/automations`, { headers });
      const json = await res.json();
      if (json?.ok) setAutomations(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadCommands = async () => {
    try {
      const res = await fetch(`${apiBase}/robotics/commands`, { headers });
      const json = await res.json();
      if (json?.ok) setCommands(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadSocialChannels = async () => {
    try {
      const res = await fetch(`${apiBase}/social/channels`, { headers });
      const json = await res.json();
      if (json?.ok) setSocialChannels(json.items || []);
    } catch {
      /* noop */
    }
  };
  const loadEthics = async () => {
    try {
      const res = await fetch(`${apiBase}/social/ethics/programs`, { headers });
      const json = await res.json();
      if (json?.ok) setEthicsTracks(json.tracks || []);
    } catch {
      /* noop */
    }
  };
  useEffect(() => {
    void loadDevices();
    void loadTelemetry();
    void loadAutomations();
    void loadCommands();
    void loadSocialChannels();
    void loadEthics();
  }, []);

  const register = async () => {
    setStatus("registering...");
    try {
      const res = await fetch(`${apiBase}/robotics/devices`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: deviceName,
          kind: deviceKind,
          endpoint,
          transport: deviceAdapter,
          adapter: deviceAdapter,
          capabilityProfile: capabilitiesText.split(",").map((x) => x.trim()).filter(Boolean),
          status: "registered"
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("device registered");
        await loadDevices();
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:register");
    }
  };

  const bridge = async () => {
    setStatus("bridging...");
    try {
      const res = await fetch(`${apiBase}/robotics/rhizoh/bridge`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          agentId: selectedAgentId || "",
          worldState: { mode: "ROBOTICS_MECHANICS" },
          deviceState: { devices: devices.slice(0, 8) }
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setBridgeReply(json.result?.reply || "");
        setStatus("bridge ok");
      } else setStatus(`err:${json?.error || "bridge_failed"}`);
    } catch {
      setStatus("err:bridge");
    }
  };

  const pushTelemetry = async () => {
    if (!selectedDeviceId) return;
    setStatus("telemetry...");
    try {
      const res = await fetch(`${apiBase}/robotics/telemetry`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          lat: Number(telemetryLat),
          lon: Number(telemetryLon),
          speed: Number(telemetrySpeed),
          mode: "ACTIVE"
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus(`telemetry ok (${json?.command || "CONTINUE"})`);
        await loadTelemetry();
        await loadDevices();
      } else setStatus(`err:${json?.error || "telemetry_failed"}`);
    } catch {
      setStatus("err:telemetry");
    }
  };

  const scheduleAutomation = async () => {
    const when = autoAt ? new Date(autoAt).getTime() : Date.now() + 5 * 60 * 1000;
    setStatus("scheduling...");
    try {
      const res = await fetch(`${apiBase}/robotics/automations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: autoTitle,
          scheduleAt: when,
          action: "SMART_HOME_TASK",
          deviceId: selectedDeviceId || "",
          payload: { plannerIntent: autoTitle }
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("automation scheduled");
        await loadAutomations();
      } else setStatus(`err:${json?.error || "automation_failed"}`);
    } catch {
      setStatus("err:automation");
    }
  };

  const queueCommand = async () => {
    if (!selectedDeviceId) return;
    setStatus("command queue...");
    try {
      const params = commandParams ? JSON.parse(commandParams) : {};
      const res = await fetch(`${apiBase}/robotics/commands`, {
        method: "POST",
        headers,
        body: JSON.stringify({ deviceId: selectedDeviceId, action: commandAction, params })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("command queued");
        await loadCommands();
      } else setStatus(`err:${json?.error || "command_failed"}`);
    } catch {
      setStatus("err:command_json_or_send");
    }
  };

  const buildPlannerGraph = async () => {
    setStatus("planner graph...");
    try {
      const res = await fetch(`${apiBase}/robotics/planner/graph`, {
        method: "POST",
        headers,
        body: JSON.stringify({ task: autoTitle, context: { selectedDeviceId } })
      });
      const json = await res.json();
      if (json?.ok) {
        const g = json.graph || {};
        setGraphSummary(`${g.taskTitle || "Planner"} | nodes:${(g.nodes || []).length} edges:${(g.edges || []).length}`);
        setStatus("planner ok");
      } else setStatus(`err:${json?.error || "planner_failed"}`);
    } catch {
      setStatus("err:planner");
    }
  };

  const registerSocial = async () => {
    setStatus("social register...");
    try {
      const res = await fetch(`${apiBase}/social/channels`, {
        method: "POST",
        headers,
        body: JSON.stringify({ platform: socialPlatform, connectorType: "webhook", endpoint: socialEndpoint, status: "enabled" })
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("social channel enabled");
        await loadSocialChannels();
      } else setStatus(`err:${json?.error || "social_failed"}`);
    } catch {
      setStatus("err:social");
    }
  };

  const broadcastUpdate = async () => {
    setStatus("broadcast...");
    try {
      const res = await fetch(`${apiBase}/social/broadcast`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: broadcastText })
      });
      const json = await res.json();
      if (json?.ok) setStatus(`broadcast queued (${json.queuedChannels})`);
      else setStatus(`err:${json?.error || "broadcast_failed"}`);
    } catch {
      setStatus("err:broadcast");
    }
  };

  const dispatchQueuedCommands = async () => {
    setStatus("dispatching queued commands...");
    try {
      const res = await fetch(`${apiBase}/robotics/commands/dispatch`, {
        method: "POST",
        headers,
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus(`dispatch ok (${json.processed})`);
        await loadCommands();
      } else setStatus(`err:${json?.error || "dispatch_failed"}`);
    } catch {
      setStatus("err:dispatch");
    }
  };

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">ROBOTICS-MECHANICS BRIDGE</div>
      <div className="flex gap-2">
        <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="device name" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <select value={deviceAdapter} onChange={(e) => setDeviceAdapter(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="websocket">websocket</option>
          <option value="mqtt">mqtt</option>
        </select>
        <select value={deviceKind} onChange={(e) => setDeviceKind(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="drone">drone</option>
          <option value="robot">robot</option>
          <option value="rover">rover</option>
          <option value="arm">arm</option>
          <option value="smart-watch">smart-watch</option>
          <option value="smart-tv">smart-tv</option>
          <option value="smart-speaker">smart-speaker</option>
          <option value="smart-light">smart-light</option>
          <option value="smart-oven">smart-oven</option>
          <option value="smart-fridge">smart-fridge</option>
          <option value="smart-ac">smart-ac</option>
          <option value="smart-lock">smart-lock</option>
          <option value="smart-vacuum">smart-vacuum</option>
          <option value="smart-washer">smart-washer</option>
          <option value="iot-sensor">iot-sensor</option>
        </select>
      </div>
      <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="ws/http endpoint (opsiyonel)" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <input value={capabilitiesText} onChange={(e) => setCapabilitiesText(e.target.value)} placeholder="capability profile (comma): smart-oven.preheat,smart-watch.notify" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void register()}>Device Register</button>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={() => void loadDevices()}>Yenile</button>
      </div>
      <div className="flex gap-2">
        <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="">select-device</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.kind})
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <input value={telemetryLat} onChange={(e) => setTelemetryLat(Number(e.target.value) || 0)} className="w-24 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" placeholder="lat" />
        <input value={telemetryLon} onChange={(e) => setTelemetryLon(Number(e.target.value) || 0)} className="w-24 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" placeholder="lon" />
        <input value={telemetrySpeed} onChange={(e) => setTelemetrySpeed(Number(e.target.value) || 0)} className="w-20 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" placeholder="m/s" />
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={() => void pushTelemetry()}>
          Telemetry Push
        </button>
      </div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full h-14 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <button type="button" className={`${btn} border-emerald-400/35 text-emerald-200`} onClick={() => void bridge()}>Rhizoh Bridge Decision</button>
      <div className="flex gap-2">
        <input value={autoTitle} onChange={(e) => setAutoTitle(e.target.value)} placeholder="planner task (örn: akşam yemeğini hazırla)" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      </div>
      <div className="flex gap-2">
        <input type="datetime-local" value={autoAt} onChange={(e) => setAutoAt(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-fuchsia-400/35 text-fuchsia-200`} onClick={() => void scheduleAutomation()}>
          Schedule
        </button>
        <button type="button" className={`${btn} border-indigo-400/35 text-indigo-200`} onClick={() => void buildPlannerGraph()}>
          Build Action Graph
        </button>
      </div>
      <div className="flex gap-2">
        <input value={commandAction} onChange={(e) => setCommandAction(e.target.value)} placeholder="action (capability)" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-sky-400/35 text-sky-200`} onClick={() => void queueCommand()}>
          Queue Command
        </button>
        <button type="button" className={`${btn} border-violet-400/35 text-violet-200`} onClick={() => void dispatchQueuedCommands()}>
          Dispatch Queue
        </button>
      </div>
      <textarea value={commandParams} onChange={(e) => setCommandParams(e.target.value)} className="w-full h-12 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2">
        <select value={socialPlatform} onChange={(e) => setSocialPlatform(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="telegram">telegram</option>
          <option value="whatsapp">whatsapp</option>
          <option value="webhook">webhook</option>
        </select>
        <input value={socialEndpoint} onChange={(e) => setSocialEndpoint(e.target.value)} placeholder="social webhook/bot endpoint" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-lime-400/35 text-lime-200`} onClick={() => void registerSocial()}>
          Add Social Channel
        </button>
      </div>
      <div className="flex gap-2">
        <input value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <button type="button" className={`${btn} border-cyan-300/35 text-cyan-100`} onClick={() => void broadcastUpdate()}>
          Broadcast Update
        </button>
      </div>
      <div className="text-[8px] text-white/45">{status}</div>
      <div className="text-[8px] text-indigo-200/80 normal-case">{graphSummary}</div>
      <div className="text-[8px] text-white/70 normal-case max-h-20 overflow-y-auto no-scrollbar">{bridgeReply}</div>
      <div className="text-[8px] text-white/65 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {devices.map((d) => `${d.name} (${d.kind}) · ${d.status} · ${Array.isArray(d.capabilityProfile) ? d.capabilityProfile.join("|") : "-"}`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {telemetryRows.slice(0, 6).map((t) => `${new Date(t.ts || Date.now()).toLocaleTimeString()} · ${t.deviceId} · ${t.mode} · ${t.speed}m/s`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {automations.slice(0, 6).map((a) => `${a.title} · ${a.status} · ${new Date(a.scheduleAt || Date.now()).toLocaleString()}`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {commands.slice(0, 6).map((c) => `${c.deviceId} · ${c.action} · ${c.adapter} · ${c.status}`).join("\n")}
      </div>
      <div className="text-[8px] text-white/55 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {socialChannels.slice(0, 6).map((c) => `${c.platform} · ${c.connectorType} · ${c.status}`).join("\n")}
      </div>
      <div className="text-[8px] text-emerald-200/80 normal-case max-h-16 overflow-y-auto no-scrollbar">
        {ethicsTracks.slice(0, 4).map((t) => `${t.title} · ${t.audience} · ${(t.modules || []).slice(0, 2).join(",")}`).join("\n")}
      </div>
    </div>
  );
});

const EventLayerIntelPanel = memo(({ selectedAgentId, selectedConnectionId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const realityMode = useUISelector((s) => s.realityMode);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [place, setPlace] = useState("Suleymaniye Library Istanbul");
  const [docUrl, setDocUrl] = useState("");
  const [docText, setDocText] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [companionOn, setCompanionOn] = useState(false);
  const [thresholdM, setThresholdM] = useState(260);
  const [cooldownSec, setCooldownSec] = useState(25);
  const [pdfJobId, setPdfJobId] = useState("");
  const [pdfCitations, setPdfCitations] = useState([]);
  const [waypointName, setWaypointName] = useState("");
  const [waypointPersona, setWaypointPersona] = useState("historian");
  const [waypoints, setWaypoints] = useState([]);
  const [routeReplies, setRouteReplies] = useState([]);
  const apiBase = getRhizohApiBase();
  const headers = { "Content-Type": "application/json", "X-Castle-Dev-Uid": getOrCreateCastleDevUid() };
  const btn = "text-[8px] px-2 py-1 rounded-lg border font-bold transition-colors";
  const lastPoiRef = useRef({ id: "", ts: 0 });

  const placeBrief = async (overridePlace = "") => {
    const placeName = String(overridePlace || place || "").trim();
    if (!placeName) return;
    setStatus("place-brief...");
    try {
      const res = await fetch(`${apiBase}/event-layer/place-brief`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          placeName,
          agentId: selectedAgentId || "",
          connectionId: selectedConnectionId || ""
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setReply(json.reply || "");
        setStatus("ok");
        if ("speechSynthesis" in window && json.reply) {
          const u = new SpeechSynthesisUtterance(String(json.reply).slice(0, 300));
          u.lang = "tr-TR";
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  const docBrief = async () => {
    setStatus("doc-brief...");
    try {
      const res = await fetch(`${apiBase}/event-layer/pdf-brief`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: place, url: docUrl, text: docText, agentId: selectedAgentId || "", connectionId: selectedConnectionId || "" })
      });
      const json = await res.json();
      if (json?.ok) {
        setReply(json.reply || "");
        setStatus("ok");
      } else setStatus(`err:${json?.error || "failed"}`);
    } catch {
      setStatus("err:failed");
    }
  };

  const addWaypoint = () => {
    const name = waypointName.trim();
    if (!name) return;
    setWaypoints((prev) => [...prev, { name, persona: waypointPersona }].slice(0, 24));
    setWaypointName("");
  };

  const runRouteBrief = async () => {
    if (waypoints.length === 0) return;
    setStatus("route-brief...");
    try {
      const res = await fetch(`${apiBase}/event-layer/route-brief`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          waypoints,
          agentId: selectedAgentId || "",
          connectionId: selectedConnectionId || ""
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setRouteReplies(json.items || []);
        setStatus("route-ok");
        const first = json.items?.[0]?.reply;
        if (first && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(String(first).slice(0, 300));
          u.lang = "tr-TR";
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } else {
        setStatus(`err:${json?.error || "route_failed"}`);
      }
    } catch {
      setStatus("err:route_failed");
    }
  };

  const uploadPdf = async (file) => {
    if (!file) return;
    setStatus("pdf-upload...");
    try {
      const buf = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(buf);
      const res = await fetch(`${apiBase}/pdf/upload`, {
        method: "POST",
        headers,
        body: JSON.stringify({ fileName: file.name, contentBase64: b64 })
      });
      const json = await res.json();
      if (json?.ok?.toString() === "true" || json?.ok) {
        setPdfJobId(json?.job?.id || "");
        setStatus(`pdf-job:${json?.job?.id || "queued"}`);
      } else setStatus(`err:${json?.error || "upload_failed"}`);
    } catch {
      setStatus("err:upload_failed");
    }
  };

  useEffect(() => {
    if (!pdfJobId) return;
    let dead = false;
    const tick = async () => {
      try {
        const res = await fetch(`${apiBase}/pdf/jobs/${pdfJobId}`, {
          headers: { "X-Castle-Dev-Uid": getOrCreateCastleDevUid() }
        });
        const json = await res.json();
        if (dead || !json?.ok) return;
        const job = json.job || {};
        setStatus(`pdf:${job.status}`);
        if (job.status === "done") {
          const text = String(job.extractedText || "").slice(0, 12000);
          setPdfCitations(Array.isArray(job.citations) ? job.citations : []);
          if (text) {
            setDocText(text);
            void docBrief();
          }
          setPdfJobId("");
        }
        if (job.status === "failed") setPdfJobId("");
      } catch {
        /* noop */
      }
    };
    const intv = setInterval(() => void tick(), 3000);
    void tick();
    return () => {
      dead = true;
      clearInterval(intv);
    };
  }, [pdfJobId]);

  useEffect(() => {
    if (!companionOn || realityMode !== "REAL_MAP") return;
    let dead = false;
    const intv = setInterval(() => {
      if (dead) return;
      const c = window.__CASTLE_CESIUM__;
      if (!c?.getCameraGeo || !c?.findNearestImportant) return;
      const geo = c.getCameraGeo();
      const near = c.findNearestImportant(geo?.lat, geo?.lon, thresholdM);
      if (!near?.id) return;
      const now = Date.now();
      if (near.id === lastPoiRef.current.id && now - lastPoiRef.current.ts < cooldownSec * 1000) return;
      if (now - lastPoiRef.current.ts < cooldownSec * 1000) return;
      lastPoiRef.current = { id: near.id, ts: now };
      setPlace(near.name || place);
      void placeBrief(near.name || "");
    }, 3500);
    return () => {
      dead = true;
      clearInterval(intv);
    };
  }, [companionOn, thresholdM, cooldownSec, realityMode, selectedAgentId, selectedConnectionId]);

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300">EVENT LAYER INTEL + ROUTE COMPANION</div>
      <div className="flex gap-2">
        <input value={waypointName} onChange={(e) => setWaypointName(e.target.value)} placeholder="waypoint adı" className="flex-1 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
        <select value={waypointPersona} onChange={(e) => setWaypointPersona(e.target.value)} className="bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case">
          <option value="historian">historian</option>
          <option value="architect">architect</option>
          <option value="storyteller">storyteller</option>
          <option value="researcher">researcher</option>
          <option value="friendly-guide">friendly-guide</option>
        </select>
        <button type="button" className={`${btn} border-white/20 text-white/70`} onClick={addWaypoint}>Ekle</button>
      </div>
      {waypoints.length > 0 ? (
        <div className="text-[8px] text-white/65 normal-case max-h-12 overflow-y-auto no-scrollbar">
          {waypoints.map((w, i) => (
            <div key={`${w.name}-${i}`}>{i + 1}. {w.name} · {w.persona}</div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-fuchsia-400/35 text-fuchsia-200`} onClick={runRouteBrief}>
          Route briefing
        </button>
      </div>
      <div className="flex items-center gap-2 text-[8px] text-white/65">
        <label className="normal-case">Companion</label>
        <input type="checkbox" checked={companionOn} onChange={(e) => setCompanionOn(e.target.checked)} />
        <label className="normal-case">POI m</label>
        <input value={thresholdM} onChange={(e) => setThresholdM(Number(e.target.value) || 260)} className="w-14 bg-black/35 border border-white/15 rounded px-1 py-0.5 text-[8px]" />
        <label className="normal-case">Cooldown s</label>
        <input value={cooldownSec} onChange={(e) => setCooldownSec(Number(e.target.value) || 25)} className="w-14 bg-black/35 border border-white/15 rounded px-1 py-0.5 text-[8px]" />
      </div>
      <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="yürüyüş rotası / yapı adı" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2">
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={() => void placeBrief()}>Yapı bilgisi</button>
      </div>
      <input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="kütüphane doküman url (html/txt)" className="w-full bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <textarea value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="veya metni buraya yapıştır (PDF extract)" className="w-full h-16 bg-black/35 border border-white/15 rounded px-2 py-1 text-[9px] normal-case" />
      <div className="flex gap-2 items-center">
        <button type="button" className={`${btn} border-amber-400/35 text-amber-200`} onClick={() => void docBrief()}>Doküman/PDF brief</button>
        <label className={`${btn} border-white/20 text-white/70 cursor-pointer`}>
          PDF Upload
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadPdf(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="text-[8px] text-white/40">{status}</div>
      <div className="text-[8px] text-white/75 normal-case leading-relaxed max-h-24 overflow-y-auto no-scrollbar">{reply}</div>
      {pdfCitations.length > 0 ? (
        <div className="text-[8px] text-white/60 normal-case max-h-20 overflow-y-auto no-scrollbar">
          {pdfCitations.map((c, i) => (
            <div key={`cite-${i}`}>p.{c.page} {c.title}</div>
          ))}
        </div>
      ) : null}
      {routeReplies.length > 0 ? (
        <div className="text-[8px] text-white/70 normal-case max-h-24 overflow-y-auto no-scrollbar">
          {routeReplies.map((r, i) => (
            <div key={`route-${i}`}>{i + 1}. {r.name} [{r.persona}] — {r.reply}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

const RhizohCommsPanel = memo(({ engineRef, selectedConnectionId, selectedAgentId }) => {
  const focus = useUISelector((s) => s.layerFocus);
  const theme = (LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10]).theme;
  const [input, setInput] = useState("");
  const [lastReply, setLastReply] = useState("Rhizoh beklemede.");
  const [isThinking, setIsThinking] = useState(false);
  const [source, setSource] = useState("local");
  const [provider, setProvider] = useState("openai");
  const btn = "text-[8px] px-2 py-1.5 rounded-lg border font-bold transition-colors";

  const ensureRhizoh = () => {
    if (coreWorld.rhizohIdx !== -1) return coreWorld.rhizohIdx;
    const idx = coreWorld.allocate("RHIZOH-PRIME", STATE.RHIZOH);
    uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "RHIZOH ONLINE · avatar materialized." } });
    return idx;
  };

  const focusRhizoh = () => {
    const idx = ensureRhizoh();
    if (idx < 0) return;
    engineRef.current?.focusWorldPoint(coreWorld.posX[idx], coreWorld.posY[idx], coreWorld.posZ[idx], 1800);
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tr-TR";
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const applyDirective = (directive) => {
    const engine = engineRef.current;
    if (!engine || !directive) return;
    const d = String(directive).toUpperCase();
    if (d === "FOCUS_RHIZOH") {
      focusRhizoh();
      return;
    }
    if (d === "ZOOM_CASTLE") {
      const c = window.__CASTLE_CESIUM__;
      if (c?.focusCastle) c.focusCastle();
      else engine.focusCastleBeacon();
      return;
    }
    if (d === "ZOOM_AGENT") {
      engine.focusNextAgent();
      return;
    }
    if (d === "ISTANBUL_OVERVIEW") {
      window.__CASTLE_CESIUM__?.flyToIstanbul?.();
    }
  };

  const sendPrompt = async () => {
    const q = input.trim();
    if (!q || isThinking) return;
    setIsThinking(true);
    ensureRhizoh();
    const profile = LAYER_UI_PROFILES[focus] || LAYER_UI_PROFILES[10];
    const spec = LAYER_SPECS.find((s) => s.id === focus) || LAYER_SPECS[10];
    const out = await queryRhizohLLM({
      message: q,
      provider,
      connectionId: selectedConnectionId || "",
      agentId: selectedAgentId || "",
      layerProfile: profile,
      layerSpec: spec,
      simTime: coreWorld.simTime
    });
    const reply = out.reply;
    setLastReply(reply);
    setSource(out.source || "local");
    applyDirective(out.directive);
    speak(reply);
    uiStore.dispatch({
      type: "ADD_LOG",
      payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `RHIZOH COMMS [${out.source}] · ${q}` }
    });
    setInput("");
    setIsThinking(false);
  };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
      <div className="text-[9px] tracking-[0.35em] font-black text-cyan-300 flex items-center gap-2">
        <Mic size={12} /> RHIZOH COMMS
      </div>
      <div className="text-[8px] text-white/40">LLM source: {source}{isThinking ? " · düşünüyor..." : ""}</div>
      <div className="flex items-center gap-2">
        <span className="text-[8px] text-white/50">Provider</span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="bg-black/35 border border-white/15 rounded-lg px-2 py-1 text-[9px] text-white normal-case tracking-normal outline-none"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Google Gemini</option>
          <option value="xai">xAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="mistral">Mistral</option>
          <option value="openrouter">OpenRouter</option>
        </select>
      </div>
      <div className="text-[8px] text-white/70 leading-relaxed">{lastReply}</div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
          className="flex-1 bg-black/35 border border-white/15 rounded-lg px-2 py-1 text-[9px] text-white normal-case tracking-normal outline-none"
          placeholder="Rhizoh'a yaz: katman, kamera, görev..."
        />
        <button type="button" className={`${btn} border-cyan-400/35 text-cyan-100`} onClick={sendPrompt} disabled={isThinking}>
          {isThinking ? "..." : "Gönder"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${btn} border-white/20 text-white/75`} onClick={focusRhizoh}>
          Spawn + Fokus Rhizoh
        </button>
        <button type="button" className={`${btn} border-white/20 text-white/75`} onClick={() => speak(lastReply)}>
          Yanıtı seslendir
        </button>
      </div>
    </div>
  );
});

export default function AppRhizoh528() {
  const castleAuth = useCastleAuth();
  useEffect(() => {
    void warmSwarmGpu();
  }, []);
  const [booted, setBooted] = useState(false);
  const [cmd, setCmd] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const entityCount = useUISelector((s) => s.activeEntityCount);
  const realityMode = useUISelector((s) => s.realityMode);
  const layerFocus = useUISelector((s) => s.layerFocus);
  const currentLayerProfile = LAYER_UI_PROFILES[layerFocus] || LAYER_UI_PROFILES[10];
  const activeWidgets = currentLayerProfile.widgets || [];

  useEffect(() => {
    let isMounted = true;
    let simRaf = null;

    const resizeObserver = new ResizeObserver(() => {
      if (engineRef.current) engineRef.current.handleResize();
    });

    const init = async () => {
      for (let i = 0; i < 300; i++) coreWorld.allocate(`CITIZEN-${i}`, STATE.CITIZEN);
      if (coreWorld.rhizohIdx === -1) coreWorld.allocate("RHIZOH-PRIME", STATE.RHIZOH);

      if (containerRef.current && !engineRef.current) {
        engineRef.current = new ApexEngine(containerRef.current);
        resizeObserver.observe(containerRef.current);
        if (isMounted) setBooted(true);
      }

      let lastTime = performance.now();
      let accumulator = 0;
      const fixedStep = 1 / 60;
      let uiSyncCounter = 0;

      const simLoop = (now) => {
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.25) dt = 0.25;

        accumulator += dt;
        while (accumulator >= fixedStep) {
          coreWorld.tick(fixedStep);
          cityMind.tick(fixedStep, coreWorld);
          accumulator -= fixedStep;
        }

        coreWorld.flushRemoved();

        uiSyncCounter++;
        if (uiSyncCounter >= 30) {
          uiStore.dispatch({ type: "SYNC_STATS", payload: coreWorld.activeCount });
          uiStore.dispatch({
            type: "SYNC_METRICS",
            payload: {
              academicsTier: cityMind.academicsTier,
              district0Energy: cityMind.districtEnergy[0],
              squadCount: squadRegistry.squads.size,
              swarmActive: coreWorld.swarmActive
            }
          });
          uiSyncCounter = 0;
        }

        simRaf = requestAnimationFrame(simLoop);
      };
      simRaf = requestAnimationFrame(simLoop);
    };

    init();

    return () => {
      isMounted = false;
      coreWorld.reset();
      cityMind.reset();
      squadRegistry.clear();
      eventMesh.clear();
      resizeObserver.disconnect();
      if (simRaf) cancelAnimationFrame(simRaf);
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    const profile = LAYER_UI_PROFILES[layerFocus] || LAYER_UI_PROFILES[10];
    if (!engine || !profile) return;

    const run = async () => {
      if (profile.camera) engine.setCameraMode(profile.camera);
      if (profile.reality) {
        uiStore.dispatch({ type: "SET_REALITY", payload: profile.reality });
        await engine.transitionReality(profile.reality);
      }
      if (profile.flight === "agent") {
        engine.focusNextAgent();
      } else if (profile.flight === "rhizoh") {
        const idx = coreWorld.rhizohIdx !== -1 ? coreWorld.rhizohIdx : coreWorld.allocate("RHIZOH-PRIME", STATE.RHIZOH);
        if (idx >= 0) engine.focusWorldPoint(coreWorld.posX[idx], coreWorld.posY[idx], coreWorld.posZ[idx], 1800);
      } else if (profile.flight === "castle") {
        const c = window.__CASTLE_CESIUM__;
        if (c?.focusCastle) c.focusCastle();
        else engine.focusCastleBeacon();
      } else if (profile.flight === "academy") {
        const c = window.__CASTLE_CESIUM__;
        if (c?.streetView) c.streetView(ISTANBUL_POI.FATIH.lat, ISTANBUL_POI.FATIH.lon, 180);
      } else if (profile.flight === "istanbul-mid") {
        const c = window.__CASTLE_CESIUM__;
        c?.flyToIstanbul?.();
      } else if (profile.flight === "istanbul-high" || profile.flight === "istanbul-wide") {
        const c = window.__CASTLE_CESIUM__;
        c?.flyToIstanbul?.();
      }
    };
    void run();
  }, [layerFocus]);

  const handleExecute = () => {
    if (!cmd.trim()) return;
    const raw = cmd.trim();
    const command = raw.toUpperCase();

    const satelliteModeMatch = command.match(/^SATELLITE\s+(VOICE|MUSIC|MEMORY|DREAM|SIGNAL|STREAM)$/);
    if (satelliteModeMatch) {
      const mode = satelliteModeMatch[1];
      uiStore.dispatch({ type: "SET_SATELLITE_MODE", payload: mode });
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `L4 SATELLITE SCAN · ${mode}` } });
      pushRhizohEvent("SATELLITE_SCAN", "Satellite", mode, 1);
      setCmd("");
      return;
    }

    const layerMatch = command.match(/^LAYER\s+(\d{1,2})$/);
    if (layerMatch) {
      const id = Math.min(13, Math.max(0, parseInt(layerMatch[1], 10)));
      uiStore.dispatch({ type: "SET_LAYER_FOCUS", payload: id });
      pushRhizohEvent("COMMAND_PULSE", "Rhizoh", `L${id}`, id / 10);
      setCmd("");
      return;
    }

    if (command === "DRONE MODE" || command === "CAMERA DRONE") {
      engineRef.current?.setCameraMode("DRONE");
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "CAMERA: DRONE (OrbitControls)" } });
      setCmd("");
      return;
    }
    if (command === "ORBIT MODE" || command === "CAMERA ORBIT") {
      engineRef.current?.setCameraMode("ORBIT");
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "CAMERA: ORBIT showcase" } });
      setCmd("");
      return;
    }
    if (command === "ZOOM AGENT") {
      const idx = engineRef.current?.focusNextAgent() ?? -1;
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: idx >= 0 ? `CAMERA → agent slot ${idx}` : "CAMERA: no agent" }
      });
      setCmd("");
      return;
    }
    if (command === "ZOOM CASTLE") {
      void (async () => {
        uiStore.dispatch({ type: "SET_REALITY", payload: "REAL_MAP" });
        await engineRef.current?.transitionReality("REAL_MAP");
        const c = window.__CASTLE_CESIUM__;
        if (c?.focusCastle) c.focusCastle();
        else engineRef.current?.focusCastleBeacon();
        uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "CAMERA → İstanbul castle beacon" } });
      })();
      setCmd("");
      return;
    }
    const gotoMatch = command.match(/^GOTO\s+(FATIH|KADIKOY|BESIKTAS|USKUDAR)$/);
    if (gotoMatch) {
      const key = gotoMatch[1];
      void (async () => {
        uiStore.dispatch({ type: "SET_REALITY", payload: "REAL_MAP" });
        await engineRef.current?.transitionReality("REAL_MAP");
        const c = window.__CASTLE_CESIUM__;
        if (c?.focusPOI) c.focusPOI(key);
        else engineRef.current?.focusIstanbulPOI(key);
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `CAMERA → ${ISTANBUL_POI[key].label}` }
        });
      })();
      setCmd("");
      return;
    }

    if (command === "SOVEREIGN BOOT" || command === "META BOOT") {
      void (async () => {
        await sovereignRuntimeSingleton.runBootSequence((phase) => {
          uiStore.dispatch({
            type: "ADD_LOG",
            payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `L12 BOOT · ${phase.id}` }
          });
        });
        uiStore.dispatch({
          type: "ADD_LOG",
          payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L12: SOVEREIGN RUNTIME · boot OK · registries seeded" }
        });
        pushRhizohEvent("SOVEREIGN_BOOT", "META", "Castle", 1);
      })();
      setCmd("");
      return;
    }

    if (command === "SPAWN RHIZOH") {
      if (coreWorld.rhizohIdx === -1) {
        coreWorld.allocate("RHIZOH-PRIME", STATE.RHIZOH);
        uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L10: AVATAR ONLINE — RHIZOH COMMAND PLANE." } });
        pushRhizohEvent("COMMAND_PULSE", "Rhizoh", "MESH", 1);
      } else {
        uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "ERR", data: "RHIZOH ZATEN AKTİF." } });
      }
    } else if (command === "CALL PET" || command === "SUMMON PET") {
      const id = `PET-${createCastleUlid()}`;
      const idx = coreWorld.allocate(id, STATE.GHOSTPET);
      if (idx !== -1 && coreWorld.rhizohIdx !== -1) {
        coreWorld.ownerIdx[idx] = coreWorld.rhizohIdx;
        coreWorld.posX[idx] = coreWorld.posX[coreWorld.rhizohIdx] + (Math.random() * 200 - 100);
        coreWorld.posY[idx] = coreWorld.posY[coreWorld.rhizohIdx];
        coreWorld.posZ[idx] = coreWorld.posZ[coreWorld.rhizohIdx] + (Math.random() * 200 - 100);
        uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L7: GHOST PET BAĞLANDI → RHIZOH." } });
        pushRhizohEvent("PET_EVOLVE", "Pet", "RHIZOH", 0.6);
      } else {
        uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "WARN", data: "GHOST PET (OWNER YOK)" } });
      }
    } else if (command === "SATELLITE LINK") {
      uiStore.dispatch({ type: "TOGGLE_SATELLITE" });
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L4 · UYDU KATMANI TOGGLE" } });
      pushRhizohEvent("SATELLITE_SCAN", "Satellite", uiStore.getState().satelliteScanMode, 1);
    } else if (command === "SUMMON SQUAD") {
      const sid = squadRegistry.create("ESCORT", "escort");
      const roster = [AGENT_ARCHETYPE.SCOUT, AGENT_ARCHETYPE.GUARD, AGENT_ARCHETYPE.HACKER, AGENT_ARCHETYPE.BUILDER, AGENT_ARCHETYPE.HEALER, AGENT_ARCHETYPE.HUNTER];
      roster.forEach((arch, i) => {
        coreWorld.allocate(`SQ${sid}-${ARCHETYPE_NAMES[arch]}-${i}-${createCastleUlid()}`, STATE.CITIZEN, arch, sid);
      });
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `L6: SQUAD ${sid} · ${formatRoster(roster)}` } });
      pushRhizohEvent("SQUAD_FORM", "Rhizoh", `SQUAD-${sid}`, 1);
    } else if (command === "OPEN GREENROOM") {
      uiStore.dispatch({ type: "SET_GREENROOM", payload: true });
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L5: GREENROOM ARM — stream resonance." } });
      pushRhizohEvent("GREENROOM_RESONANCE", "GreenRoom", "STREAM", 1);
      window.open("/greenroom-ultimate.html", "_blank", "noopener");
    } else if (command === "SCAN CITY") {
      const peak = cityMind.scanCity();
      uiStore.dispatch({ type: "SYNC_METRICS", payload: { heatPeak: peak } });
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `L8/L9: HEATMAP PEAK ${peak.toFixed(3)}` } });
      pushRhizohEvent("CITY_SCAN", "CityMind", "256²", peak);
    } else if (command === "BUILD TOWER") {
      const e = cityMind.buildTower(0);
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: `L8: TOWER · district-0 E=${e.toFixed(1)}` } });
      pushRhizohEvent("DISTRICT_BUILD", "Builder", "district-0", 0.8);
    } else if (command === "OPEN PORTAL") {
      uiStore.dispatch({ type: "SET_PORTAL", payload: true });
      coreWorld.portalCharge = 1;
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "PORTAL · PHASE GATE (ABILITY.PORTAL)" } });
      pushRhizohEvent("PORTAL", "Rhizoh", "OVERWORLD", 1);
    } else if (command === "ACTIVATE SWARM") {
      if (!coreWorld.swarmActive) uiStore.dispatch({ type: "TOGGLE_SWARM" });
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L6: SWARM / SQUAD AI — citizens jitter ON" } });
      pushRhizohEvent("SWARM", "Overmind", "CITIZENS", 1);
    } else if (command === "CALL AGENTS") {
      const ids = [
        ["AG-SCOUT", AGENT_ARCHETYPE.SCOUT],
        ["AG-GUARD", AGENT_ARCHETYPE.GUARD],
        ["AG-HACKER", AGENT_ARCHETYPE.HACKER],
        ["AG-BUILD", AGENT_ARCHETYPE.BUILDER],
        ["AG-HEAL", AGENT_ARCHETYPE.HEALER],
        ["AG-HUNT", AGENT_ARCHETYPE.HUNTER]
      ];
      ids.forEach(([name, arch], i) => coreWorld.allocate(`${name}-${createCastleUlid()}-${i}`, STATE.CITIZEN, arch, 0));
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L2: ARCHETYPE LINEUP SPAWNED" } });
      pushRhizohEvent("AGENT_REPORT", "Agents", "Castle", 1);
    } else if (command === "ENTER GREENROOM" || command === "MEMORY RESONANCE") {
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "MEMORY resonance · dream channel stub" } });
      pushRhizohEvent("MEMORY", "Dream", "RESONANCE", 0.4);
    } else if (command === "RUN CURRICULUM") {
      coreWorld.runCurriculumOrganize();
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L11: CURRICULUM RUN — cadet ring + discipline pulse." }
      });
      pushRhizohEvent("ACADEMY_CURRICULUM", "Castle", "CADETS", 1);
    } else if (command === "EXAM MODE") {
      coreWorld.examMode = !coreWorld.examMode;
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: {
          ts: new Date().toLocaleTimeString(),
          type: "SYS",
          data: coreWorld.examMode ? "L11: EXAM MODE ON — graduation checks ↑4×" : "L11: EXAM MODE OFF"
        }
      });
      pushRhizohEvent("ACADEMY_EXAM", "Castle", coreWorld.examMode ? "INTENSE" : "NORMAL", 1);
    } else if (command === "ACADEMY RESET") {
      coreWorld.resetAcademyLayer();
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: "L11: ACADEMY RESET — XP / knowledge graph / LLM bindings cleared." }
      });
      pushRhizohEvent("ACADEMY_RESET", "Castle", "MESH", 1);
    } else if (command === "REGISTER LLM DEMO") {
      const idx = coreWorld.registerLLMAgent("demo-user", {
        agentId: `sage-${createCastleUlid()}`,
        model: "gpt-4.1-mini",
        persona: {
          role: "Academy Professor",
          traits: ["strict", "analytical", "creative"],
          domain: "physics + swarm intelligence"
        },
        memorySeed: "Castle Academics researcher"
      });
      uiStore.dispatch({
        type: "ADD_LOG",
        payload: {
          ts: new Date().toLocaleTimeString(),
          type: "SYS",
          data: idx >= 0 ? `L11: LLM AGENT REGISTERED · slot ${idx}` : "L11: REGISTER FAILED (capacity)"
        }
      });
      if (idx >= 0) pushRhizohEvent("LLM_REGISTER", "User", "Professor", 1);
    } else if (command === "KILL") {
      if (coreWorld.activeCount > 0) coreWorld.remove(coreWorld.indexToId[0]);
    } else {
      uiStore.dispatch({ type: "ADD_LOG", payload: { ts: new Date().toLocaleTimeString(), type: "WARN", data: `UNKNOWN: ${command}` } });
    }
    setCmd("");
  };

  const openUrl = (path) => window.open(path, "_blank", "noopener");

  return (
    <div className="h-screen w-full bg-[#010103] text-white font-mono overflow-hidden relative select-none uppercase font-black selection:bg-cyan-400/40">
      <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
      <CesiumRealMapLayer active={realityMode === "REAL_MAP"} />

      <div className="absolute inset-0 z-10 pointer-events-none p-12 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <SovereignHud engineRef={engineRef} />

          <div className="flex flex-col gap-6 pointer-events-auto w-96 text-left">
            <CastleAccountBadge auth={castleAuth} />
            <div className="bg-[#0a0f2a]/95 backdrop-blur-3xl border border-cyan-400/40 p-8 rounded-[3.5rem] shadow-[0_0_80px_rgba(0,255,255,0.1)] ring-1 ring-white/5">
              <div className="text-[12px] text-cyan-400 tracking-[0.6em] mb-10 flex items-center gap-3 uppercase font-black">
                <Target size={22} className="text-amber-500 animate-pulse" /> L0 → L13 KERNEL
              </div>
              <div className="space-y-6">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Activity size={40} className="text-cyan-400" />
                  </div>
                  <div className="text-[10px] text-white/30 mb-2 tracking-widest flex items-center gap-2 uppercase">Active Entities</div>
                  <div className="text-4xl text-cyan-400 font-mono italic">{entityCount}</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[2.5rem] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-amber-400 shrink-0 mt-1" />
                <p className="text-[9px] text-white/50 leading-relaxed font-black uppercase tracking-widest">
                  L0–L13: kernel … L11 Academics · L12 Sovereign Runtime · L13 Robotics Mechanics Bridge.
                </p>
              </div>
            </div>

            {activeWidgets.includes("stack") ? <LayerStackMini /> : null}
            {activeWidgets.includes("rail") ? <LayerRail /> : null}
            {activeWidgets.includes("layerxp") ? <LayerExperiencePanel engineRef={engineRef} /> : null}
            {activeWidgets.includes("camera") ? <CameraFlightDeck engineRef={engineRef} /> : null}
            {activeWidgets.includes("flighthud") ? <CastleFlightHud /> : null}
            {activeWidgets.includes("studiomirror") ? <StudioMirrorPanel /> : null}
            {activeWidgets.includes("sovereign") ? (
              <SovereignRuntimePanel
                getSimTime={() => coreWorld.simTime}
                onSystemLog={(msg) =>
                  uiStore.dispatch({
                    type: "ADD_LOG",
                    payload: { ts: new Date().toLocaleTimeString(), type: "SYS", data: msg }
                  })
                }
              />
            ) : null}
            {activeWidgets.includes("academy") ? <CastleAcademicsCard /> : null}
            {activeWidgets.includes("events") ? <EventMeshMini /> : null}
            {activeWidgets.includes("identitylab") ? (
              <AgentIdentityLabPanel selectedAgentId={selectedAgentId} onSelectAgent={setSelectedAgentId} />
            ) : null}
            {activeWidgets.includes("academyroom") ? <AcademyEventRoomPanel selectedAgentId={selectedAgentId} /> : null}
            {activeWidgets.includes("continuity") ? <RhizohContinuityHud selectedAgentId={selectedAgentId} /> : null}
            {activeWidgets.includes("intel") ? (
              <EventLayerIntelPanel selectedAgentId={selectedAgentId} selectedConnectionId={selectedConnectionId} />
            ) : null}
            {activeWidgets.includes("robotics") ? <RoboticsMechanicsPanel selectedAgentId={selectedAgentId} /> : null}
            {activeWidgets.includes("connections") ? (
              <MyLLMConnectionsPanel selectedConnectionId={selectedConnectionId} onSelectConnection={setSelectedConnectionId} />
            ) : null}
            {activeWidgets.includes("rhizoh") ? (
              <RhizohCommsPanel engineRef={engineRef} selectedConnectionId={selectedConnectionId} selectedAgentId={selectedAgentId} />
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openUrl("/greenroom-ultimate.html")} className="px-3 py-2 rounded-xl bg-cyan-400 text-black text-xs font-bold">
                Studio
              </button>
              <button type="button" onClick={() => openUrl("/octoai-studio.html")} className="px-3 py-2 rounded-xl bg-purple-400 text-black text-xs font-bold">
                OCTO
              </button>
              <button type="button" onClick={() => openUrl("/spiralmmo-castlebyck.html")} className="px-3 py-2 rounded-xl bg-emerald-400 text-black text-xs font-bold">
                SpiralMMO
              </button>
              <button type="button" onClick={() => openUrl(YOUTUBE_LIVE_URL)} className="px-3 py-2 rounded-xl bg-rose-400 text-black text-xs font-bold">
                YouTube
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-full max-w-6xl bg-[#0a1b3a]/98 border border-cyan-400/50 p-4 rounded-[5rem] flex items-center shadow-[0_0_120px_rgba(0,255,255,0.2)] backdrop-blur-5xl ring-2 ring-white/5 pointer-events-auto">
            <button type="button" className="ml-6 p-6 hover:bg-cyan-400/20 rounded-full text-cyan-400 transition-all active:scale-90 shadow-inner">
              <Mic size={32} />
            </button>
            <div className="flex-1 px-10 relative">
              <input
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                placeholder="SPAWN RHIZOH · CALL PET · SATELLITE LINK · SUMMON SQUAD · SCAN CITY · BUILD TOWER · OPEN GREENROOM · ACTIVATE SWARM · CALL AGENTS · SATELLITE SIGNAL …"
                className="w-full bg-transparent border-none outline-none text-xl font-black tracking-[0.5em] text-white uppercase placeholder:text-white/10 italic"
              />
            </div>
            <button type="button" onClick={handleExecute} className="p-7 bg-cyan-400 rounded-[3.5rem] hover:bg-cyan-300 transition-all text-black shadow-[0_0_60px_rgba(0,255,255,0.5)] active:scale-95 group">
              <Send size={38} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <CastleAuthOverlay auth={castleAuth} />

      {!booted && (
        <div className="absolute inset-0 z-[5000] bg-[#010103] flex flex-col items-center justify-center">
          <div className="relative mb-20 scale-[2.0]">
            <Atom size={120} className="text-cyan-400 animate-spin opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Network size={40} className="text-fuchsia-400 animate-pulse" />
            </div>
          </div>
          <div className="text-4xl font-black tracking-[2em] text-cyan-400/50 ml-[2em] animate-pulse uppercase italic">RHIZOH_Genesis</div>
        </div>
      )}

      <style>{`
        .animate-spin-slow { animation: spin 25s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input::placeholder { font-size: 11px; letter-spacing: 0.6em; opacity: 0.3; font-weight: 900; }
        .backdrop-blur-5xl { backdrop-filter: blur(80px); }
      `}</style>
    </div>
  );
}
