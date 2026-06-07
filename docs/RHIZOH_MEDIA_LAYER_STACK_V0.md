# Rhizoh media layer stack v0

**SPECFLOW:** `RESEARCH-ONLY` — policy doc; runtime in listed modules.

## UX rule (fixed)

**Hiçbir fiziksel input (kamera/mic) doğrudan varlık yaratmaz.** Sadece veri üretir.

**Tek kullanıcı niyeti:** `OBSERVE` (gözlem başlat). İçeride dallanır; kullanıcı tek kapı görür, içeride katmanlar ayrılır.

```
OBSERVE (intent)
├── World      → __RHIZOH_WORLD_OBS__     (gate: "Gözlem başlat" / dünya)
├── Device     → __CASTLE_RHIZOH_BOX_MEDIA__ + __RHIZOH_OBSERVATION_FEED__  (dock: Box girişi only)
└── Companion  → __CASTLE_PWE__ / __RHIZOH_COMPANION_PRESENCE__  (derived — fusion, no button spawn)
        └── Castle (optional) → explicit: rhizoh kale kur / castle:open-init-gate-v0
```

## Fusion (`rhizohObserveFusionV0.js`)

`window.__RHIZOH_OBSERVE_FUSION__` — companion **eligible** when:

- `worldReady` (world gate complete)
- `mapField` (Cesium ready + map camera geo)

`deviceFeedActive` (box stream) is **metadata only** — does not spawn PWE.

Wrong chain (removed): `Camera → Companion → World`  
Correct: `Camera → data feed` · `World → observation` · `Companion → fusion(world + mapField)`

## Device resolution hierarchy

See previous section in this doc — `exact_device_id` → `group_id` → `label_regex` → `lkg_label` → `system_default` on `__CASTLE_RHIZOH_BOX_MEDIA__`.

## Cesium budgets (separate logs)

| Cap | Log | Purpose |
|-----|-----|---------|
| Footprints | `[CASTLE_CESIUM_RENDER_BUDGET] footprint_cap` | Rendering |
| POI | `[CASTLE_CESIUM_UX_BUDGET] poi_cap` | UX |
