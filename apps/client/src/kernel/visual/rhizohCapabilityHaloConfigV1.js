/**
 * Capability Graph — halo düğümleri + Rhizoh whisper metinleri (ürün yüzeyi).
 */

export const RHIZOH_CAPABILITY_HALO_INTRO_WHISPER =
  "Rhizoh capability graph — bir düğümün üzerine gel; ne yapabileceğimi fısıldayayım.";

/** Ana halka (saat yönü, 8 düğüm) */
export const RHIZOH_CAPABILITY_HALO_NODES_V1 = [
  {
    id: "create",
    label: "Create",
    whisper:
      "Studio veya GreenRoom’da yeni bir oturum açabilirim; senaryo, yayın veya içerik iskelesi kurarız.",
    seedIntent: "studio'da yeni bir yaratim oturumu ac",
    href: "/greenroom-ultimate.html"
  },
  {
    id: "explore",
    label: "Explore",
    whisper:
      "Istanbul ankorunda gerçek harita ve küre üzerinde keşif rotası çıkarabilirim; olay ve ajan yoğunluğunu gösteririm.",
    seedIntent: "istanbul uzerinde simule kesif rotasi ciz",
    layerFocus: null,
    openRealMap: true
  },
  {
    id: "learn",
    label: "Learn",
    whisper: "Academy / öğrenme katmanında modül ve etkinlik akışı önerebilirim.",
    seedIntent: "academy icin kisa bir ogrenme rotasi oner",
    layerFocus: 11
  },
  {
    id: "broadcast",
    label: "Broadcast",
    whisper: "Canlı yayın ve GreenRoom yönlendirmesi yapabilirim; izleyici ve bellek bağlarını açarım.",
    seedIntent: "yarin canli mac yayinla",
    href: "/greenroom-ultimate.html"
  },
  {
    id: "build",
    label: "Build",
    whisper: "Komut katmanında dünya, görev ve otomasyon iskelesi kurmana yardım ederim.",
    seedIntent: "rhizoh komut katmaninda yeni gorev iskelesi kur",
    layerFocus: 10
  },
  {
    id: "companion",
    label: "Companion",
    whisper: "Octo ile pet / ghost / eşlikçi karakter ve diyalog yüzeyi açabilirim.",
    seedIntent: "octo ile yeni bir companion karakter tasarla",
    href: "/octoai-studio.html"
  },
  {
    id: "robotics",
    label: "Robotics",
    whisper: "Cihaz köprüsü: kamera, sensör, drone veya robot kolunu sahneye bağlarız (L13).",
    isRoboticsHub: true,
    layerFocus: 13
  },
  {
    id: "swarm",
    label: "Swarm",
    whisper: "Swarm / squad katmanında toplu ajan akışını ve koordinasyonu ateşleyebilirim.",
    seedIntent: "swarm koordinasyonunu aktive et",
    layerFocus: 6
  },
  {
    id: "world",
    label: "World",
    whisper: "SpiralMMO ve sosyal dünya yüzeylerine intent ile köprü kurabilirim.",
    seedIntent: "spiralMMO icin gece etkinligi oner",
    href: "/spiralmmo-castlebyck.html"
  }
];

export const RHIZOH_ROBOTICS_DEVICE_CHIPS_V1 = [
  { id: "camera", label: "Camera", whisper: "Canlı kamera beslemesini dijital ikiz sahnesine bağlayabilirim.", seedIntent: "robotics katmaninda kamera live bridge ac" },
  { id: "mic", label: "Mic", whisper: "Mikrofon akışını yayın ve komut hattına yönlendirebilirim.", seedIntent: "mikrofon yayin hattina bagla" },
  { id: "sensor", label: "Sensor", whisper: "IoT sensör telemetrisini olay ağına düşürebilirim.", seedIntent: "iot sensor telemetrisini castle world'e bagla" },
  { id: "drone", label: "Drone", whisper: "Drone ile Boğaz veya saha üstünde keşif görevi planlayabilirim.", seedIntent: "drone ile bogazi kesfet gorevi planla" },
  { id: "arm", label: "Robot arm", whisper: "Robot kol görevlerini komut DSL ile sıraya koyarım.", seedIntent: "robot kol icin komut plani olustur" },
  { id: "iot", label: "IoT", whisper: "Cihaz mesh’ini açar, köprü durumunu gösteririm.", seedIntent: "iot cihaz mesh durumunu goster" },
  { id: "bridge", label: "Live bridge", whisper: "Canlı telemetry köprüsünü gateway üzerinden açarım.", seedIntent: "gateway uzerinden live telemetry bridge ac" }
];

/** Library — ayrı statik sayfa yoksa intent ile */
export const RHIZOH_LIBRARY_ROUTE_V1 = {
  label: "Library",
  whisper: "Castle Library arşivinde yayın özeti, transcript ve belgeleri düzenleyebilirim.",
  seedIntent: "castle library arsivinde son yayin ozetini ac"
};
