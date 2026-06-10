/**
 * Context wheel registry — strict mod isolation; no cross-mode node bleed.
 * T0 has no wheel; each World drawer domain hydrates its own node set.
 */

import { RHIZOH_LAYER_MODE_V0 } from "./rhizohLayerContextV0.js";

/** @typedef {{ id: string, label: string, whisper: string, seedIntent?: string, geometryKind?: string, layerFocus?: number, isRoboticsHub?: boolean }} ContextWheelNodeV0 */

/** @param {boolean} tr */
function mapNodesV0(tr) {
  return Object.freeze([
    Object.freeze({
      id: "zoom_in",
      label: tr ? "Yakın +" : "Zoom +",
      geometryKind: "ring",
      whisper: tr ? "Kamerayı yakınlaştır (fare tekerleği veya +)." : "Zoom in (wheel or +).",
      seedIntent: ""
    }),
    Object.freeze({
      id: "zoom_out",
      label: tr ? "Uzak −" : "Zoom −",
      geometryKind: "ring",
      whisper: tr ? "Kamerayı uzaklaştır (fare tekerleği veya −)." : "Zoom out (wheel or −).",
      seedIntent: ""
    }),
    Object.freeze({
      id: "layers",
      label: tr ? "Katman" : "Layer",
      geometryKind: "cube",
      whisper: tr ? "Sıradaki harita katmanına geç (Küre/3D/Uydu…)." : "Cycle map layer (globe/3D/satellite…).",
      seedIntent: ""
    }),
    Object.freeze({
      id: "view_3d",
      label: tr ? "3D↔Sokak" : "3D↔Streets",
      geometryKind: "spiral",
      whisper: tr ? "3D şehir ile sokak görünümü arasında geç." : "Toggle 3D city vs streets.",
      seedIntent: ""
    }),
    Object.freeze({
      id: "archive",
      label: tr ? "Arşiv" : "Archive",
      geometryKind: "archive",
      whisper: tr ? "Arşiv haritası (önizleme — henüz kapalı)." : "Archive map (preview — not wired).",
      seedIntent: ""
    }),
    Object.freeze({
      id: "fog",
      label: tr ? "Merkez" : "Center",
      geometryKind: "spiral",
      whisper: tr ? "Serencebey / konumuna yeniden odaklan." : "Recenter on Serencebey / your location.",
      seedIntent: ""
    })
  ]);
}

/** @param {boolean} tr */
function socialNodesV0(tr) {
  return Object.freeze([
    Object.freeze({
      id: "invite",
      label: tr ? "Davet" : "Invite",
      geometryKind: "spiral",
      whisper: tr ? "Oturum daveti paylaş." : "Share session invite.",
      seedIntent: tr ? "davet linkini paylaş" : "share invite link"
    }),
    Object.freeze({
      id: "call",
      label: tr ? "Ara" : "Call",
      geometryKind: "ring",
      whisper: tr ? "Castle-to-castle bağlantı." : "Castle-to-castle link.",
      seedIntent: tr ? "castle bağlantısı başlat" : "start castle call"
    }),
    Object.freeze({
      id: "camera",
      label: tr ? "Kamera" : "Camera",
      geometryKind: "cube",
      whisper: tr ? "Kamera aç / kapat." : "Toggle camera.",
      seedIntent: tr ? "kamerayı aç" : "toggle camera"
    }),
    Object.freeze({
      id: "voice",
      label: tr ? "Ses" : "Voice",
      geometryKind: "ring",
      whisper: tr ? "Ses kanalı seç." : "Voice channel.",
      seedIntent: tr ? "ses kanalını aç" : "open voice channel"
    }),
    Object.freeze({
      id: "presence",
      label: tr ? "Varlık" : "Presence",
      geometryKind: "spiral",
      whisper: tr ? "Görünürlük ayarı." : "Presence visibility.",
      seedIntent: tr ? "varlık görünürlüğünü ayarla" : "set presence visibility"
    }),
    Object.freeze({
      id: "whisper",
      label: tr ? "Fısıltı" : "Whisper",
      geometryKind: "spiral",
      whisper: tr ? "Grup / fısıltı modu." : "Group / whisper mode.",
      seedIntent: tr ? "fısıltı moduna geç" : "enter whisper mode"
    })
  ]);
}

/** @param {boolean} tr */
function roboticsNodesV0(tr) {
  return Object.freeze([
    Object.freeze({
      id: "autonomy",
      label: tr ? "Otonomi" : "Autonomy",
      geometryKind: "ring",
      whisper: tr ? "Manuel → otomatik seviye." : "Manual → auto level.",
      seedIntent: tr ? "otonomi seviyesini ayarla" : "set autonomy level",
      layerFocus: 13
    }),
    Object.freeze({
      id: "task",
      label: tr ? "Görev" : "Task",
      geometryKind: "cube",
      whisper: tr ? "Ajana görev ata." : "Assign agent task.",
      seedIntent: tr ? "robota görev ata" : "assign robot task",
      layerFocus: 13
    }),
    Object.freeze({
      id: "spawn",
      label: tr ? "Spawn" : "Spawn",
      geometryKind: "spiral",
      whisper: tr ? "Ajan oluştur / birleştir." : "Spawn or merge agent.",
      seedIntent: tr ? "robot ajanı oluştur" : "spawn robot agent",
      layerFocus: 13
    }),
    Object.freeze({
      id: "safety",
      label: tr ? "Kilit" : "Safety",
      geometryKind: "cube",
      whisper: tr ? "Güvenlik kilidi." : "Safety lock.",
      seedIntent: tr ? "güvenlik kilidini aç" : "toggle safety lock",
      layerFocus: 13
    }),
    Object.freeze({
      id: "routing",
      label: tr ? "Rota" : "Routing",
      geometryKind: "spiral",
      whisper: tr ? "Hedef yönlendirme." : "Goal routing.",
      seedIntent: tr ? "hedef rotası ayarla" : "set goal routing",
      layerFocus: 13
    }),
    Object.freeze({
      id: "tune",
      label: tr ? "Ayarlama" : "Tune",
      geometryKind: "ring",
      whisper: tr ? "Davranış ince ayarı." : "Behavior tuning.",
      seedIntent: tr ? "robot davranışını ayarla" : "tune robot behavior",
      layerFocus: 13,
      isRoboticsHub: true
    })
  ]);
}

/** @param {boolean} tr */
function spiralNodesV0(tr) {
  return Object.freeze([
    Object.freeze({
      id: "time_speed",
      label: tr ? "Zaman" : "Time",
      geometryKind: "spiral",
      whisper: tr ? "Simülasyon hızı." : "Simulation time speed.",
      seedIntent: tr ? "zaman hızını ayarla" : "set time speed"
    }),
    Object.freeze({
      id: "event_trigger",
      label: tr ? "Olay" : "Event",
      geometryKind: "cube",
      whisper: tr ? "Olay tetikle." : "Trigger event.",
      seedIntent: tr ? "simülasyon olayı tetikle" : "trigger simulation event"
    }),
    Object.freeze({
      id: "spawn_rules",
      label: tr ? "Spawn" : "Spawn",
      geometryKind: "spiral",
      whisper: tr ? "Doğum kuralları." : "Spawn rules.",
      seedIntent: tr ? "spawn kurallarını ayarla" : "set spawn rules"
    }),
    Object.freeze({
      id: "sync",
      label: tr ? "Sync" : "Sync",
      geometryKind: "ring",
      whisper: tr ? "Oyuncu senkron modu." : "Player sync mode.",
      seedIntent: tr ? "oyuncu senkronunu ayarla" : "set player sync"
    }),
    Object.freeze({
      id: "rarity",
      label: tr ? "Nadir" : "Rarity",
      geometryKind: "cube",
      whisper: tr ? "Karşılaşma / nadirlik." : "Encounter rarity.",
      seedIntent: tr ? "nadirlik ayarını değiştir" : "set encounter rarity"
    }),
    Object.freeze({
      id: "world_state",
      label: tr ? "Durum" : "State",
      geometryKind: "spiral",
      whisper: tr ? "Dünya durumu." : "World state.",
      seedIntent: tr ? "dünya durumunu ayarla" : "set world state"
    })
  ]);
}

/** @param {boolean} tr */
function dreamNodesV0(tr) {
  return Object.freeze([
    Object.freeze({
      id: "narrative",
      label: tr ? "Anlatı" : "Narrative",
      geometryKind: "spiral",
      whisper: tr ? "Anlatı modu." : "Narrative mode.",
      seedIntent: tr ? "anlatı modunu aç" : "open narrative mode"
    }),
    Object.freeze({
      id: "density",
      label: tr ? "Yoğunluk" : "Density",
      geometryKind: "ring",
      whisper: tr ? "Halüsinasyon yoğunluğu." : "Hallucination density.",
      seedIntent: tr ? "yoğunluğu ayarla" : "set hallucination density"
    }),
    Object.freeze({
      id: "visual",
      label: tr ? "Görsel" : "Visual",
      geometryKind: "cube",
      whisper: tr ? "Görsel stil kayması." : "Visual style shift.",
      seedIntent: tr ? "görsel stili değiştir" : "shift visual style"
    }),
    Object.freeze({
      id: "memory",
      label: tr ? "Bellek" : "Memory",
      geometryKind: "spiral",
      whisper: tr ? "Bellek karışımı." : "Memory blending.",
      seedIntent: tr ? "bellek karışımını ayarla" : "blend memory"
    }),
    Object.freeze({
      id: "surreal",
      label: tr ? "Sürreal" : "Surreal",
      geometryKind: "cube",
      whisper: tr ? "Sürreal olaylar." : "Surreal events.",
      seedIntent: tr ? "sürreal olayları aç" : "toggle surreal events"
    })
  ]);
}

/** @param {boolean} tr */
function simulationNodesV0(tr) {
  return Object.freeze([
    Object.freeze({
      id: "rules",
      label: tr ? "Kural" : "Rules",
      geometryKind: "cube",
      whisper: tr ? "Simülasyon kuralları." : "Simulation rules.",
      seedIntent: tr ? "simülasyon kurallarını ayarla" : "set simulation rules"
    }),
    Object.freeze({
      id: "spawn",
      label: tr ? "Spawn" : "Spawn",
      geometryKind: "spiral",
      whisper: tr ? "Varlık doğurma." : "Entity spawn.",
      seedIntent: tr ? "simülasyon spawn ayarla" : "set simulation spawn"
    }),
    Object.freeze({
      id: "replay",
      label: tr ? "Replay" : "Replay",
      geometryKind: "archive",
      whisper: tr ? "Oturum tekrarı." : "Session replay.",
      seedIntent: tr ? "replay oturumunu aç" : "open replay session"
    }),
    Object.freeze({
      id: "ghost",
      label: tr ? "Ghost" : "Ghost",
      geometryKind: "ring",
      whisper: tr ? "Ghost sistem katmanı." : "Ghost system layer.",
      seedIntent: tr ? "ghost katmanını aç" : "open ghost layer"
    })
  ]);
}

const HEADLINES_V0 = Object.freeze({
  [RHIZOH_LAYER_MODE_V0.MAPS_SPACE]: Object.freeze({ tr: "Harita araçları", en: "Map tools" }),
  [RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL]: Object.freeze({ tr: "Bağlantı araçları", en: "Connection tools" }),
  [RHIZOH_LAYER_MODE_V0.MODE_ROBOTICS]: Object.freeze({ tr: "Robotics kontrol", en: "Robotics control" }),
  [RHIZOH_LAYER_MODE_V0.MODE_SPIRAL]: Object.freeze({ tr: "Spiral simülasyon", en: "Spiral simulation" }),
  [RHIZOH_LAYER_MODE_V0.MODE_DREAM]: Object.freeze({ tr: "Dream modu", en: "Dream mode" }),
  [RHIZOH_LAYER_MODE_V0.MODE_SIMULATION]: Object.freeze({ tr: "Simülasyon", en: "Simulation" })
});

const INTROS_V0 = Object.freeze({
  [RHIZOH_LAYER_MODE_V0.MAPS_SPACE]: Object.freeze({
    tr: "Tıkla: yakın/uzak, katman değiştir, 3D↔sokak, merkeze dön.",
    en: "Tap: zoom, cycle layer, 3D↔streets, recenter."
  }),
  [RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL]: Object.freeze({
    tr: "İlişki kontrolü — davet, ses, kamera.",
    en: "Relationship control — invite, voice, camera."
  }),
  [RHIZOH_LAYER_MODE_V0.MODE_ROBOTICS]: Object.freeze({
    tr: "Ajan davranışı — otonomi ve görev.",
    en: "Agent behavior — autonomy and tasks."
  }),
  [RHIZOH_LAYER_MODE_V0.MODE_SPIRAL]: Object.freeze({
    tr: "Oyun-zaman simülasyonu.",
    en: "Game-time simulation."
  }),
  [RHIZOH_LAYER_MODE_V0.MODE_DREAM]: Object.freeze({
    tr: "Yaratıcı distorsiyon katmanı.",
    en: "Creative distortion layer."
  }),
  [RHIZOH_LAYER_MODE_V0.MODE_SIMULATION]: Object.freeze({
    tr: "Ghost ve replay simülasyonu.",
    en: "Ghost and replay simulation."
  })
});

/**
 * @param {string} layerMode
 * @param {string} [locale]
 * @returns {{ nodes: readonly ContextWheelNodeV0[], headline: string, intro: string, hideLibrary: boolean }}
 */
export function resolveRhizohContextWheelPackV0(layerMode, locale = "tr") {
  const tr = String(locale || "tr").toLowerCase().startsWith("tr");
  const mode = String(layerMode || RHIZOH_LAYER_MODE_V0.T0_LIVE);

  /** @type {readonly ContextWheelNodeV0[]} */
  let nodes = [];
  if (mode === RHIZOH_LAYER_MODE_V0.MAPS_SPACE) nodes = mapNodesV0(tr);
  else if (mode === RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL) nodes = socialNodesV0(tr);
  else if (mode === RHIZOH_LAYER_MODE_V0.MODE_ROBOTICS) nodes = roboticsNodesV0(tr);
  else if (mode === RHIZOH_LAYER_MODE_V0.MODE_SPIRAL) nodes = spiralNodesV0(tr);
  else if (mode === RHIZOH_LAYER_MODE_V0.MODE_DREAM) nodes = dreamNodesV0(tr);
  else if (mode === RHIZOH_LAYER_MODE_V0.MODE_SIMULATION) nodes = simulationNodesV0(tr);

  const headlines = HEADLINES_V0[mode];
  const intros = INTROS_V0[mode];

  return Object.freeze({
    nodes,
    headline: tr ? headlines?.tr || "" : headlines?.en || "",
    intro: tr ? intros?.tr || "" : intros?.en || "",
    hideLibrary: mode !== RHIZOH_LAYER_MODE_V0.MAPS_SPACE
  });
}
