/**
 * RHIZOH LOCAL COMMAND REGISTRY — LLM-bypassable deterministic execution surface.
 * Layers: media | audio | map | world | camera | system
 */

export const LOCAL_COMMAND_LAYER_V0 = Object.freeze({
  MEDIA: "media",
  AUDIO: "audio",
  MAP: "map",
  WORLD: "world",
  CAMERA: "camera",
  SYSTEM: "system"
});

export const LOCAL_COMMAND_HANDLER_V0 = Object.freeze({
  MEDIA: "mediaCommandHandlerV0",
  AUDIO: "audioVoiceCommandHandlerV0",
  MAP: "mapSpatialCommandHandlerV0",
  CAMERA: "cameraVisionCommandHandlerV0",
  CASTLE: "castleLifecycleCommandHandlerV0",
  SYSTEM: "systemCastleCommandHandlerV0"
});

/**
 * @param {string} layer
 * @param {string} handler
 * @param {string} action
 * @param {readonly string[]} aliases
 */
function cmd(layer, handler, action, aliases) {
  return Object.freeze({
    localOnly: true,
    layer,
    handler,
    action,
    aliases: Object.freeze([...aliases])
  });
}

/** @type {Readonly<Record<string, ReturnType<typeof cmd>>>} */
export const RHIZOH_LOCAL_COMMAND_REGISTRY_V0 = Object.freeze({
  // —— Media player ——
  media_play: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "play", [
    "play",
    "start playback",
    "oynat",
    "çal"
  ]),
  media_pause: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "pause", [
    "pause",
    "pause playback",
    "pause music",
    "duraklat",
    "müziği durdur"
  ]),
  media_resume: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "resume", [
    "resume playback",
    "continue playing",
    "devam et"
  ]),
  media_stop: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "stop", [
    "stop",
    "stop playback",
    "stop music",
    "durdur"
  ]),
  media_next: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "next", [
    "next track",
    "next song",
    "sonraki",
    "skip"
  ]),
  media_previous: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "previous", [
    "previous track",
    "previous song",
    "önceki"
  ]),
  media_shuffle_on: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "shuffle_on", [
    "shuffle on",
    "enable shuffle",
    "karışık aç"
  ]),
  media_shuffle_off: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "shuffle_off", [
    "shuffle off",
    "disable shuffle",
    "karışık kapat"
  ]),
  media_repeat_on: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "repeat_on", [
    "repeat on",
    "enable repeat",
    "tekrar aç"
  ]),
  media_repeat_off: cmd(LOCAL_COMMAND_LAYER_V0.MEDIA, LOCAL_COMMAND_HANDLER_V0.MEDIA, "repeat_off", [
    "repeat off",
    "disable repeat",
    "tekrar kapat"
  ]),

  // —— Audio / voice (TTS renderer only; not OLP) ——
  mute_voice: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "mute", [
    "mute",
    "mute voice",
    "sus",
    "sessiz",
    "sustur"
  ]),
  unmute_voice: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "unmute", [
    "unmute",
    "unmute voice",
    "sesi aç"
  ]),
  voice_faster: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "rate_up", [
    "voice faster",
    "speak faster",
    "hızlı konuş",
    "konuşma hızını artır"
  ]),
  voice_slower: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "rate_down", [
    "voice slower",
    "speak slower",
    "yavaş konuş",
    "konuşma hızını azalt"
  ]),
  voice_change: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "change_voice", [
    "change voice",
    "switch voice",
    "sesi değiştir"
  ]),
  voice_female: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "voice_female", [
    "female voice",
    "switch to female voice",
    "kadın sesi"
  ]),
  voice_male: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "voice_male", [
    "male voice",
    "switch to male voice",
    "erkek sesi"
  ]),
  volume_up: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "volume_up", [
    "increase volume",
    "volume up",
    "sesi yükselt"
  ]),
  volume_down: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "volume_down", [
    "decrease volume",
    "volume down",
    "sesi kıs",
    "sesi azalt"
  ]),
  stop_listening: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "stop_listening", [
    "stop listening",
    "stop mic",
    "tamam dur",
    "dinlemeyi durdur",
    "dur"
  ]),
  start_listening: cmd(LOCAL_COMMAND_LAYER_V0.AUDIO, LOCAL_COMMAND_HANDLER_V0.AUDIO, "start_listening", [
    "listen",
    "start listening",
    "start mic",
    "dinle",
    "mikrofonu aç",
    "dinlemeye başla"
  ]),

  // —— Map ——
  map_open: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "open", [
    "open map",
    "show map",
    "haritayı aç",
    "harita",
    "rhizoh open map",
    "rizoh open map",
    "rise or open map",
    "rhizoh haritayı aç",
    "rhizoh harita"
  ]),
  map_close: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "close", [
    "close map",
    "hide map",
    "haritayı kapat"
  ]),
  map_zoom_in: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "zoom_in", [
    "zoom in",
    "yakınlaştır"
  ]),
  map_zoom_out: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "zoom_out", [
    "zoom out",
    "uzaklaştır"
  ]),
  map_center: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "center", [
    "center map",
    "recenter map",
    "haritayı ortala"
  ]),
  map_follow_player: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "follow", [
    "follow player",
    "follow me",
    "beni takip et"
  ]),
  map_show_locations: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "show_locations", [
    "show locations",
    "show pins",
    "konumları göster"
  ]),
  map_toggle_layers: cmd(LOCAL_COMMAND_LAYER_V0.MAP, LOCAL_COMMAND_HANDLER_V0.MAP, "toggle_layers", [
    "toggle layers",
    "toggle map layers",
    "katmanları aç kapa"
  ]),

  // —— World / castle ——
  castle_enter: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "enter_castle", [
    "enter castle",
    "open castle",
    "kaleye gir"
  ]),
  castle_create: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.CASTLE, "create_castle", [
    "create castle",
    "build castle",
    "castle create",
    "kale oluştur",
    "kale olustur",
    "kale kur",
    "kalemi kur",
    "kendi kalemi kur",
    "rhizoh kale kur"
  ]),
  castle_exit: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "exit_castle", [
    "exit castle",
    "leave castle",
    "kaleden çık"
  ]),
  room_library: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "room_library", [
    "library",
    "go to library",
    "kütüphane",
    "kütüphaneye geç"
  ]),
  room_garden: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "room_garden", [
    "garden",
    "go to garden",
    "bahçe",
    "bahçeye geç"
  ]),
  room_lab: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "room_lab", [
    "lab",
    "go to lab",
    "laboratuvar",
    "laba geç"
  ]),
  ghost_layer_show: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "ghosts_show", [
    "show ghost layer",
    "show ghosts",
    "hayaletleri göster"
  ]),
  ghost_layer_hide: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "ghosts_hide", [
    "hide ghost layer",
    "hide ghosts",
    "hayaletleri gizle"
  ]),
  world_state_show: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "world_state", [
    "show world state",
    "world state",
    "dünya durumunu göster"
  ]),
  world_freeze: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "freeze", [
    "freeze world",
    "pause world",
    "dünyayı dondur"
  ]),
  world_resume: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "resume_world", [
    "resume world",
    "unfreeze world",
    "dünyayı devam ettir"
  ]),
  spatial_log_ticks: cmd(LOCAL_COMMAND_LAYER_V0.WORLD, LOCAL_COMMAND_HANDLER_V0.MAP, "log_spatial", [
    "log spatial ticks",
    "spatial ticks",
    "mekansal tick logla"
  ]),

  // —— Camera / vision ——
  camera_open: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "open", [
    "open camera",
    "kamerayı aç"
  ]),
  camera_close: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "close", [
    "close camera",
    "kamerayı kapat"
  ]),
  camera_photo: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "photo", [
    "take photo",
    "capture photo",
    "fotoğraf çek"
  ]),
  camera_record_start: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "record_start", [
    "start recording",
    "record video",
    "kayda başla"
  ]),
  camera_record_stop: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "record_stop", [
    "stop recording",
    "kaydı durdur"
  ]),
  vision_enable: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "vision_on", [
    "enable vision",
    "vision on",
    "görüşü aç"
  ]),
  vision_disable: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "vision_off", [
    "disable vision",
    "vision off",
    "görüşü kapat"
  ]),
  camera_front: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "front", [
    "front camera",
    "switch front camera",
    "ön kamera"
  ]),
  camera_back: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "back", [
    "back camera",
    "switch back camera",
    "arka kamera"
  ]),
  vision_scan: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "scan", [
    "scan environment",
    "scan room",
    "ortamı tara"
  ]),
  ghost_vision_mode: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "ghost_vision", [
    "ghost vision mode",
    "ghost vision",
    "hayalet görüş"
  ]),
  shadow_capture: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "shadow_capture", [
    "shadow capture",
    "gölge yakala"
  ]),
  world_snapshot: cmd(LOCAL_COMMAND_LAYER_V0.CAMERA, LOCAL_COMMAND_HANDLER_V0.CAMERA, "snapshot", [
    "snapshot world state",
    "world snapshot",
    "dünya anlık görüntü"
  ]),

  // —— System / castle core ——
  system_pause: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "pause", [
    "pause system",
    "system pause",
    "sistemi duraklat"
  ]),
  system_resume: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "resume", [
    "resume system",
    "system resume",
    "sistemi devam ettir"
  ]),
  session_restart: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "restart_session", [
    "restart session",
    "oturumu yeniden başlat"
  ]),
  context_reset: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "reset_context", [
    "reset context",
    "clear context",
    "bağlamı sıfırla"
  ]),
  memory_clear: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "clear_memory", [
    "clear memory",
    "clear session memory",
    "hafızayı temizle"
  ]),
  debug_show_logs: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "show_logs", [
    "show logs",
    "open logs",
    "logları göster"
  ]),
  debug_open_panel: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "debug_panel", [
    "open debug",
    "open debug panel",
    "debug panel",
    "hata ayıklama"
  ]),
  debug_export_session: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "export_session", [
    "export session",
    "oturumu dışa aktar"
  ]),
  debug_show_violations: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "show_violations", [
    "show violations",
    "language violations",
    "ihlalleri göster"
  ]),
  debug_language_runtime: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "language_runtime", [
    "show language runtime",
    "language runtime",
    "dil runtime"
  ]),
  mode_ghost_enter: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "ghost_mode_on", [
    "enter ghost mode",
    "ghost mode",
    "hayalet modu"
  ]),
  mode_ghost_exit: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "ghost_mode_off", [
    "exit ghost mode",
    "leave ghost mode",
    "hayalet modundan çık"
  ]),
  mode_observer_enter: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "observer_mode", [
    "enter observer mode",
    "observer mode",
    "gözlemci modu"
  ]),
  mode_creative_enter: cmd(LOCAL_COMMAND_LAYER_V0.SYSTEM, LOCAL_COMMAND_HANDLER_V0.SYSTEM, "creative_mode", [
    "enter creative mode",
    "creative mode",
    "yaratıcı mod"
  ])
});

/** Hybrid: local snapshot + optional LLM enrichment — never pure registry match. */
export const RHIZOH_HYBRID_COMMAND_PATTERNS_V0 = Object.freeze([
  Object.freeze({
    id: "capabilities_ask",
    re: /^(ne yapabilirsin|neler yapabilirsin|what can you do|bana kısa motivasyon ver)/i
  }),
  Object.freeze({ id: "state_query", re: /^(what is my (current )?state|show (my )?state|durumum ne)/i }),
  Object.freeze({ id: "session_summary", re: /^(summarize (this )?session|session summary|oturumu özetle)/i }),
  Object.freeze({ id: "last_messages", re: /^(show (my )?last messages|last messages|son mesajlar)/i }),
  Object.freeze({ id: "prior_utterance", re: /^(what did i say before|previous thing i said|önce ne dedim)/i }),
  Object.freeze({
    id: "teleport_param",
    re: /^(teleport to|go to node|ışınlan|node'a git)\s+.+$/i
  })
]);

/**
 * @param {(s: string) => string} normalizeFn
 */
export function buildLocalCommandAliasIndexV0(normalizeFn) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const [canonical, row] of Object.entries(RHIZOH_LOCAL_COMMAND_REGISTRY_V0)) {
    for (const alias of row.aliases) {
      map.set(normalizeFn(alias), canonical);
    }
    map.set(normalizeFn(canonical), canonical);
  }
  return map;
}

export function readLocalCommandRowV0(canonical) {
  return RHIZOH_LOCAL_COMMAND_REGISTRY_V0[String(canonical || "")] || null;
}

/** @deprecated use RHIZOH_LOCAL_COMMAND_REGISTRY_V0 */
export const RHIZOH_VOICE_COMMAND_REGISTRY_V0 = RHIZOH_LOCAL_COMMAND_REGISTRY_V0;
