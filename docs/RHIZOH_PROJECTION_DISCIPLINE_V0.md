# Rhizoh — Projection discipline (V0, lock)

**SPECFLOW:** `RESEARCH-ONLY` — politika ve mimari sınır; **execution** yine kod + test + CI. Frozen `phase*.js` bu belgeyle tek başına değişmez.

## Amaç

Cesium / Three / DOM geldikten sonra sistemin tekrar **“harita uygulaması”** veya **“dashboard truth”** gravitasyonuna kaymaması için tek yönlü akış **kilitlenir**.

## Kurallar (zorunlu)

1. **Scene / projection adapter’lar `worldPresenceState` veya onun SSOT kaynağını asla mutate etmez.** Salt okunur girdi → saf fonksiyon veya salt yan etki (yalnız render yüzeyi).
2. **Projection katmanları runtime truth üretmez;** yalnızca **projection hints** (CSS custom properties, orb, ileride globe görünürlüğü) üretir veya tüketir.
3. **Temporal smoothing** (EMA, inertia) yalnızca **hint** üzerinde çalışır; dünya durumu satırını değiştirmez. **Orchestrator temporal lock (B3):** drift / missed-frame **tahmini** yalnızca Cesium `requestRender` sink’ine üst sınırlı ek çağrı önerir; ek tick veya world/projection truth yazımı tetiklenmez (`liveRuntimeTemporalLockV0.js`).
4. **Renderer veya kamera durumu → epistemik / world presence geri yazımı yok.** Özellikle: Cesium kamera pozisyonu, tile yükleme durumu, heuristic LOD → `worldPresenceState` / snapshot “truth” alanı olarak kullanılamaz.
5. **Tek yönlü boru:**

   `Reality feed → semantic interpretation → world presence state → projection hints → render surface`

6. **B2 (daraltılmış):** `perceptionSignalV0` yalnızca **DEBUG + gözlemlenebilirlik** — `perceptionDebugStoreV0` world state değildir; **runtime karar / smoothing / ingest** bu sinyale **bağlanmaz**. Cesium → worldPresence / snapshot yazımı yok.

## Kod referansları (v0)

- `worldPresenceRuntimeV0.js` — semantic interpretation.
- `sceneProjectionAdapterV0.js` — `deriveProjectionHintsV0` salt okunur.
- `projectionSmoothingV0.js` — yalnız hint yumuşatma.
- `apps/client/src/rhizoh/spatial/geographicAnchorsV0.js` — B0 semantic coordinate catalog (anchor ≠ render object); **ilk oturum kalibrasyon kökü** Sarıyer — `RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0` / `getRhizohCalibrationRootAnchorV0()` (cognitive prior; renderer preset değil).
- `apps/client/src/rhizoh/spatial/cesiumSpatialAdapterV0.js` — anchor projection → Cesium fog / globe parametreleri (saf sayı).
- `apps/client/src/rhizoh/spatial/perceptionSignalV0.js` — B2: salt okunur gözlem metrikleri (**runtime karara kapalı**).
- `apps/client/src/rhizoh/spatial/perceptionDebugStoreV0.js` — son sinyal anlık görüntüsü (**world state değil**).
- `apps/client/src/rhizoh/spatial/perceptionDebugRuntimeV0.js` — `VITE_RHIZOH_PERCEPTION_DEBUG=1` iken Cesium `postRender` → debug store.
- `apps/client/src/rhizoh/runtime/liveRuntimeOrchestratorV0.js` — B3: tek saat heartbeat (weather stale → presence → projection); Cesium yalnızca `requestRender` sink; perception yok.
- `apps/client/src/rhizoh/runtime/liveRuntimeTemporalLockV0.js` — B3 temporal lock: drift / missed-frame → üst sınırlı ek sink; lag telafisi ve ölçüm (truth yazımı yok).
- `apps/client/src/rhizoh/spatial/spatialOrchestratorV0.js` — B3+: dar **spatial projection composer** (`worldPresence` → hints; isteğe bağlı kamera ile anchor field probe). Authority / truth / karar motoru değil.
- `apps/client/src/rhizoh/spatial/spatialAnchorResolverV0.js` — deterministik anchor ağırlık (quantize + tie-break); “nearest flip” yok.
- `apps/client/src/rhizoh/runtime/rhizohRenderCapabilityV0.js` — **pre-resolved** render capability snapshot (`renderCapability.v0`); tier/auth/identity yok.
- `apps/client/src/rhizoh/runtime/rhizohCapabilityManagerV0.js` — UI **facade** re-export; **spatial / live orchestrator import etmemeli** (determinizm + mühür sınırı).
- `apps/client/src/rhizoh/runtime/RhizohPerceptionDebugOverlay.jsx` — B2 overlay (env gated).

## Cesium öncesi not (Yol B)

Coğrafya bağlanmadan önce **B0 — geographic semantic anchors** (`geographicAnchorsV0.js`: `id, lat, lon`, `epistemicProfile` vektörü, `atmosphericAffinity`, `influenceRadiusKm`; mesh/tile/shader yok) tercih edilir; geometri **anlam modelinden sonra** bağlanır. Ayrıntı: [`RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md`](RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md).
