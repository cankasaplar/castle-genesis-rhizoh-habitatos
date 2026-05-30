# Rhizoh — Spatial embodiment final lock (V1 narrative, executable hooks)

**SPECFLOW:** `RESEARCH-ONLY` — bu belge **ürün kilidi / hukuki mühür değildir**; epistemik mimari sınırı ve kodla hizalı **çalışma tanımıdır**. Yürütme: `spatialOrchestratorV0.js` (**SER** — Spatial Epistemic Runtime), `spatialAnchorResolverV0.js`, `liveRuntimeOrchestratorV0.js`, `rhizohRenderCapabilityV0.js` (+ UI için ince facade: `rhizohCapabilityManagerV0.js`) + CI.

## Tek cümle

Sistem “dünyada ne olduğunu” tek başına ilan etmez; **nasıl görüneceğini** sözleşmeli bir **algısal (perceptual) contract** ile tanımlar — **gerçek zamanlı fiziksel ikiz** iddiası değildir.

## Üç kilit (aynı anda)

### 1. Kamera = gözlem enstrümanı

- Sarıyer = kalibrasyon kökü (`RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0`, `getRhizohCalibrationRootAnchorV0`).
- Kamera drift = **gözlemsel metrik** (B2 / perception), truth motoru değil.
- Anchor etkisi = **deterministik modülasyon** (semantic field), state üretimi değil.

### 2. Anchor’lar = semantic field katmanı

- Kadıköy → divergence basıncı; Beşiktaş → etkileşim yoğunluğu; Sarıyer → stabilite baseline (profil vektörleri `geographicAnchorsV0.js` içinde).
- Bu katman **world truth üretmez**; yalnızca **lokal projection bias** (sis / aura / exposure türevleri).

### 3. Castle = LOD-epistemik yüzey

- Zoom → epistemik yoğunluk **hint** tarafında; HUD → salt okunur state yansıtma; pulse → dünya durumu **türevi görünümü** — “entity” değil **state surface**.

## Orchestrator ayrımı (zorunlu)

| Değil | Evet |
|--------|------|
| Authority layer | Deterministik **projection composer** |
| Truth producer | `worldState → projectionHints → renderInputs` |
| Decision engine | Aynı girdi → aynı çıktı (sözleşme içi) |

**Canlı saat:** `liveRuntimeOrchestratorV0.js` — hava stale, presence, smoothing, DOM + Cesium `requestRender` sink; **Cesium karesi orchestrator’ı çalıştırmaz** (tüketici senkron; tek yönlü boru korunur).

**Mekânsal kompozisyon girişi:** `spatialOrchestratorV0.js` — `composeSpatialProjectionFrameV0` / mühür adı `composeSpatialProjectionV0` ile dar “spatial frame” API’si (isteğe bağlı kamera ile anchor field probe). **Import kuralı:** bu modül `rhizohCapabilityManagerV0` veya `rhizohRenderCapabilityV0` import etmez; yetenek bayrakları UI kabuğunda `getRenderCapabilitySnapshotV0()` ile **önceden çözülüp** gerekiyorsa ayrı dallanır.

## Render capability — orchestrator’dan izole mühür

| Doğru | Yanlış |
|--------|--------|
| `getRenderCapabilitySnapshotV0()` — yalnızca **pre-resolved** `observe` / `interact` / `write` | `getEffectiveCapabilitiesV0()` tarzı tier/auth/identity içeren API’nin projection içine sızması |
| UI shell veya bootstrap snapshot’ı üretir | Spatial / live orchestrator capability manager’a **bağımlı** olmaz |

`rhizohCapabilityManagerV0.js` yalnızca **re-export + deprecated alias** (`getRhizohCapabilitySnapshotV0`); tek kaynak `rhizohRenderCapabilityV0.js`. Şema: `renderCapability.v0`.

## Anchor çözümü — “nearest” değil

`findNearestAnchorV0` **yok**; yerine `spatialAnchorResolverV0.js`:

- Kamera lon/lat **quantize** (Cesium float gürültüsü),
- Eski perception ile aynı ağırlık çekirdeği (kesintisiz debug),
- **Dominant** anchor: eşit ağırlıkta `id` leksikografik tie-break.

## Capability manager — yalnızca UI / etkileşim kapısı (facade)

`rhizohRenderCapabilityV0.js` — `getRenderCapabilitySnapshotV0()`:

- **OBSERVE** — daima açık.
- **INTERACT** — `VITE_RHIZOH_INTERACT_ENABLED` ile yerel UI kilidi (varsayılan açık); **abonelik / ödeme / harici ACL değil**.
- **WRITE** — v0’da kapalı; ileride ayrı katman.

`rhizohCapabilityManagerV0.js` — UI import kolaylığı; **projection composer import etmemeli**.

| Dosya | Rol |
|--------|-----|
| [`spatialAnchorResolverV0.js`](../apps/client/src/rhizoh/spatial/spatialAnchorResolverV0.js) | Deterministik anchor ağırlık / field |
| [`spatialOrchestratorV0.js`](../apps/client/src/rhizoh/spatial/spatialOrchestratorV0.js) | Projection frame composer |
| [`liveRuntimeOrchestratorV0.js`](../apps/client/src/rhizoh/runtime/liveRuntimeOrchestratorV0.js) | Heartbeat + temporal lock + Cesium sink |
| [`rhizohRenderCapabilityV0.js`](../apps/client/src/rhizoh/runtime/rhizohRenderCapabilityV0.js) | `getRenderCapabilitySnapshotV0` — pre-resolved render flags (**tier/auth yok**) |
| [`rhizohCapabilityManagerV0.js`](../apps/client/src/rhizoh/runtime/rhizohCapabilityManagerV0.js) | UI facade re-export; composer import etmemeli |
| [`perceptionSignalV0.js`](../apps/client/src/rhizoh/spatial/perceptionSignalV0.js) | B2: anchor field distortion → resolver üzerinden |

## İlgili belgeler

- [`RHIZOH_PROJECTION_DISCIPLINE_V0.md`](RHIZOH_PROJECTION_DISCIPLINE_V0.md)
- [`RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md`](RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md)
