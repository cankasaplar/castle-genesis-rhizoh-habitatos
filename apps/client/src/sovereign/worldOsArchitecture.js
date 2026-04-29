/**
 * Sovereign Multi-Agent World OS — hedef mimari (5 sütun).
 * Oyun motoru / saf agent framework / tek başına digital twin değil: birleşik işletim katmanı.
 */

export const WORLD_OS_PILLARS = [
  {
    id: "DSR",
    name: "Distributed Sovereign Runtime",
    role: "Yetki, capability, Chronos, çok-parçacık orkestrasyon"
  },
  {
    id: "DSK",
    name: "Deterministic Simulation Kernel",
    role: "Tek gerçek zaman çizelgesi, yeniden üretilebilir fizik / politika tick"
  },
  {
    id: "HCF",
    name: "Hypergraph Cognition Fabric",
    role: "Hiperkenarlı bellek, çoklu bağlam → tek sonuç (urban cognition)"
  },
  {
    id: "CPP",
    name: "Cyber-Physical Control Plane",
    role: "Observe→…→Recover döngüsü, actuator / ağ / sensör hata toparlaması"
  },
  {
    id: "SCTM",
    name: "Smart City Twin Mesh",
    role: "Şehir ölçeği dijital ikiz, shard’lı coğrafya, telemetri örgüsü"
  }
];

/** Federated deterministic world: MMO shard değil; mesaj veri yolu ile bağlı bölge dünyaları. */
export const REGION_SHARD_IDS = [
  "Fatih",
  "Kadikoy",
  "Besiktas",
  "Uskudar",
  "IndustrialWest",
  "ArchiveZone",
  "AcademyCore"
];

export const GLOBAL_WORLD_TOPOLOGY = {
  root: "GlobalWorld",
  children: [
    {
      name: "RegionShard",
      range: "[0..N]",
      perShard: ["PhysicsCell", "SpatialIndex", "LocalMemory", "Telemetry", "PolicyState"]
    },
    "KnowledgeFabric",
    "RoboticsPlane",
    "MediaPlane",
    "SovereignKernel"
  ],
  scale: {
    singleHeapComfortable: 50_000,
    targetGlobalEntities: 5_000_000,
    localComputePerShard: "100k–300k entities (hedef aralık)",
    bottlenecks: ["memory bandwidth", "cache invalidation", "sync cost", "cross-thread chatter"]
  }
};

/**
 * Uzamsal sorgu: L0 Morton coarse prune → L1 BVH dense → L2 mikro düz dizi + SIMD sweep.
 * Karmaşıklık hedefi: ~O(log N); collision / hotspot baskısı düşük.
 */
export const ADAPTIVE_SPATIAL_STACK = {
  L0: { name: "coarse", structure: "Morton grid", purpose: "prune" },
  L1: { name: "dense", structure: "BVH hybrid (Sparse Voxel DAG ile birleştirilebilir)", purpose: "refine" },
  L2: { name: "micro", structure: "local flat arrays + SIMD sweep", purpose: "exact neighborhood" }
};

/** Mean-field: süreklilik alanları — ajan başına komşu taraması yerine yerel örnekleme. */
export const MEAN_FIELD_CHANNELS = ["rho", "velocity", "intent", "threat", "knowledge"];
