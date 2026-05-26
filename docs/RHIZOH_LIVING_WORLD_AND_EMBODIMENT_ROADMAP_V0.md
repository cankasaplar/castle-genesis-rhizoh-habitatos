# Rhizoh — Living world, presence & embodiment roadmap (V0)

**SPECFLOW (birincil):** `RESEARCH-ONLY` — ürün yönü, deneyim ve mimari niyet; **frozen ghost faz zinciri (`apps/client/src/ghost/phase*.js`) üzerinde davranış değişikliği bu belgeyle tek başına haklı kılınmaz.** Uygulama PR’ları ayrıca `CORE-ELIGIBLE` / `FUTURE-PROOF-ONLY` ayrımına tabidir ([`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)).

**Ön koşul (operasyonel tez):** Freeze / identity / governance hattı yeterince stabil olduğu için enerji artık **çekirdeği yeniden tartışmaktan** çok **çekirdeği yaşayan dünyaya bağlamaya** kaydırılabilir. Bu belge o geçişin **haritasıdır**; execution engine değildir.

**Karar yönlendirmesi:** [`RHIZOH_SGRA_OPERATIONAL_MAP_V0.md`](RHIZOH_SGRA_OPERATIONAL_MAP_V0.md) — hangi iş **S**pec, hangisi **G**uard, hangisi **R**untime, hangisi **A**jan/insan ritmi.

**Kod (v0):** [`worldPresenceRuntimeV0.js`](../apps/client/src/rhizoh/runtime/worldPresenceRuntimeV0.js) · [`weatherIngestV0.js`](../apps/client/src/rhizoh/runtime/weatherIngestV0.js) · [`worldPresenceStoreV0.js`](../apps/client/src/rhizoh/runtime/worldPresenceStoreV0.js) · [`projectionSmoothingV0.js`](../apps/client/src/rhizoh/runtime/projectionSmoothingV0.js) · [`sceneProjectionAdapterV0.js`](../apps/client/src/rhizoh/runtime/sceneProjectionAdapterV0.js) · [`geographicAnchorsV0.js`](../apps/client/src/rhizoh/spatial/geographicAnchorsV0.js) · [`deriveAnchorAtmosphereProjectionV0.js`](../apps/client/src/rhizoh/spatial/deriveAnchorAtmosphereProjectionV0.js) · [`cesiumSpatialAdapterV0.js`](../apps/client/src/rhizoh/spatial/cesiumSpatialAdapterV0.js) · [`cesiumEpistemicRuntimeStoreV0.js`](../apps/client/src/rhizoh/spatial/cesiumEpistemicRuntimeStoreV0.js) · [`cesiumEpistemicBootstrapV0.js`](../apps/client/src/rhizoh/spatial/cesiumEpistemicBootstrapV0.js) · [`perceptionDebugStoreV0.js`](../apps/client/src/rhizoh/spatial/perceptionDebugStoreV0.js) · [`perceptionDebugRuntimeV0.js`](../apps/client/src/rhizoh/spatial/perceptionDebugRuntimeV0.js) · [`liveRuntimeOrchestratorV0.js`](../apps/client/src/rhizoh/runtime/liveRuntimeOrchestratorV0.js) · [`RhizohPerceptionDebugOverlay.jsx`](../apps/client/src/rhizoh/runtime/RhizohPerceptionDebugOverlay.jsx)

---

## 1. Teşhis: cognition var, embodiment eksik

Eksik olan “daha fazla zeka” değil; eksik olan:

- **Çevresel süreklilik** — gerçek zamanlı şehir ve ortam ile ritim  
- **Mekânsal hissiyat** — harita = sadece geometri değil, **collective cognition terrain**  
- **Kişisel bağlamın görünürleşmesi** — Rhizoh’nun “bildiğini hissettirmesi”  
- **Canlı veriyle rezonans** — sinyallerin **normalize** edilmiş “dünya durumu”na dönüşmesi  

İlk başarılı embodiment hissi: **“sistem nefes alıyor”** — en temiz veren sinyal ailesi: **hava, ışık, zaman, atmosfer** (agresif değil, düşük epistemik risk, *presence without interruption*).

**Kapatma ≠ anımsamama:** assertive closure yok; **passive memory surfaces** — literal profil (“sen X seviyorsun”) değil, **ambient contextual echo** (“Castle Sports layer son aktif alanlardan biri”).

---

## 2. Embodiment MVP veri sırası: **B → C → A**

| Sıra | Kod | Ne | Neden bu sırada |
|------|-----|-----|------------------|
| **1 (B)** | Atmospheric | OpenWeather (veya eşdeğer) → **atmosferik aura** | Sürekli değişir, tüm sahneyi etkiler, kullanıcı input’u istemez, ambient’tır, dashboard’a çekmez |
| **2 (C)** | Echoes | **User history echoes** — contextual fog, yan rezonans | “Hatırlıyor” hissi en güvenli şekilde ambient katmanda; profil paneli değil |
| **3 (A)** | Collective | **İBB trafik / kolektif nabız** | Yüksek semantik yük; yanlış normalize edilirse **smart city paneli** hissi — önce **şehir hissedilmeli**, sonra **analiz edilmeli** |

---

## 3. Phase 1 — Atmospheric Runtime (B)

**Modül:** `worldPresenceRuntimeV0.js` — ham veri → **semantic atmospheric interpretation** → **world presence state**; renderer / ses / hafıza / castle sistemleri bunu **tüketir**, burada üretilmez.

### 3.1 İlk `ambient` çekirdeği (MVP)

```text
ambient: {
  weatherType,
  cloudDensity,
  humidity,
  localTime,
  luminosity
}
```

(v0: feed yoksa nötr ambient; OpenWeather ingest ayrı modülde — STEP B.1.)

### 3.2 Epistemik çevre koşulu (VFX değil)

Hava **görsel efekt** değil; **epistemik çevre koşulu**na map edilir:

| Koşul | Yorum (Rhizoh dili) |
|--------|---------------------|
| Yoğun bulut / nem | `visibility budget` ↓ — uzak castle detayı sadeleşir, bridge overlay minimal |
| Açık gökyüzü / yüksek luminosity | memory echo alanı için “distant resonance” potansiyeli ↑ (C ile birleştirilir) |
| Gece | `night resonance` ↑ — ambient recall yüzeyleri daha görünür olabilir |

Türetilmiş yüzeyler (örnek isimler): **scene fog**, **aura intensity** (castle kenar ışığı stabilitesi), **drift bloom** (yağış/nem ile procedural “flora” baskısı), **night resonance**.

### 3.3 STEP B.1 — OpenWeather → normalized feed (v0)

- **`weatherIngestV0.js`:** `normalizeOpenWeatherCurrentJsonV0` (saf JSON dönüşümü) · `fetchOpenWeatherNormalizedV0` (Current Weather API, `units=metric`; anahtar yoksa `null`, ağ çağrısı yok).
- **`worldPresenceStoreV0.js`:** `refreshWeatherAtmosphereFeedIfStaleV0` (TTL, varsayılan **5 dk**; API anahtarı yokken **10 dk** cooldown, boş sonuç için gereksiz tekrar yok) · `startWorldWeatherAtmospherePollingV0` · `getCachedWeatherAtmosphereFeedV0`.
- **Birleşik pipeline:** `OpenWeather` → `weatherIngestV0` → `buildAmbientAtmosphereFromFeedV0` → `deriveEpistemicAtmosphereV0` → `buildWorldPresenceStateV0({ weatherFeed })`.
- **Sonraki yüzey (v0 uygulandı):** `sceneProjectionAdapterV0.js` + `projectionSmoothingV0.js` + `RhizohAtmospherePresenceBridge.jsx` (App mount, 10 dk poll) — aşağıda.

**Kilitleme (Cesium / embodiment öncesi):** [`RHIZOH_PROJECTION_DISCIPLINE_V0.md`](RHIZOH_PROJECTION_DISCIPLINE_V0.md) — adapter’lar state mutate etmez; projection salt okunur tüketici; renderer → truth geri yazımı yok.

### 3.4 Scene projection adapter (v0 — atmosferik kanıt)

**Yol A — perceptual stability (v0):** runtime truth (`worldPresenceState`) aynı; görsel yüzeyde süreklilik için `deriveProjectionHintsV0` → `smoothProjectionHintsV0(prev, next)` → `apply…` (yalnız projection). **Castle metabolic pulse:** `auraIntensity` + `visibilityBudget` + `driftBloom` birleşimi → `castleMetabolicPulse` (ışık şovu değil, ileride ses / titreşim / rezonans için ortak sinyal omurgası).

- **`sceneProjectionAdapterV0.js`:** `deriveProjectionHintsV0(worldPresenceState)` — salt okunur; çıktı **`fogDensity`**, **`ambientTint` (RGB 0–1)**, **`castleAuraIntensity`**, **`castleMetabolicPulse`**. `applyProjectionHintsToHostV0` (`--rhizoh-proj-*` dahil metabolic) / `applyProjectionHintsToCastleAuraSurfaceV0` — state **mutate etmez**; yalnız CSS / tek orb yüzeyi (`[data-rhizoh-atmosphere-castle-surface]`).
- **`projectionSmoothingV0.js`:** EMA / inertia / tint lerp — yalnız hint üzerinde.
- **`worldPresenceStoreV0.js`:** `getWeatherAtmosphereProvenanceV0()` — ingest kaynağı + `fetchedAt` + deterministik `epoch` (`buildAtmosphereEpochIdV0`); çoklu kaynak (İBB, sensör, castle etkisi) için provenance genişlemeye hazır.
- **Debug:** `VITE_RHIZOH_ATMOSPHERE_DEBUG=1` → ATM SOURCE / age / epoch + WEATHER / VISIBILITY / AURA / METABOLIC / FOG.
- **Bilinçli olarak yok:** Cesium iç state owner, particle storm, shader kaosu. **Cesium → epistemic state** yok; yalnız tüketici (spatial substrate).

---

## 4. STEP 2 — User echoes (C)

Hedef: sistemin seni **hatırladığını** assertive panelle değil, **contextual fog** ile hissettirmek.

Örnek **iz düşümü** (literal kullanıcı cümlesi değil):

- Spor rezonansı → kamera easing, kinetic glow, pulse ritmi  
- Müzik rejimi → harmonics / wave displacement / ışık senkronu  
- Castle design geçmişi → mimari detay yoğunluğu, procedural symmetry  

Hepsi **ambient**; hiçbiri “Can basketbol seviyor” tipi literal profil değildir.

---

## 5. STEP 3 — Traffic / collective cognition (A)

Çıktılar (taslak): stress fields, synchronization fractures, crowd resonance, disagreement turbulence — **yalnız B ve C oturduktan sonra**; aksi halde ürün “dashboard / şehir zekâsı paneli”ne kayar.

---

## 6. Veri borusu (mimari)

```text
Raw Reality
    → weatherIngestV0 (normalize)
    → Semantic Atmospheric Interpretation (worldPresenceRuntimeV0)
    → World Presence State
    → sceneProjectionAdapterV0 (derive visual hints)
    → projectionSmoothingV0 (temporal continuity, projection-only)
    → CSS / tek Castle aura yüzeyi (Cesium yalnız tüketici; ileride genişletilir)
```

Bu pipeline **API raw data ↔ renderer** arasına sıkışmaz; **yorumlayan runtime** katmanıdır.

---

## 7. Uzun vadede üç tasarım akışı (Living Istanbul · Presence · Castle)

### Living Istanbul Layer

Şehir ölçeğinde **yaşayan epistemik habitat**; harita yalnız geometri değil, collective cognition terrain anlatısı (Cesium, tiles, runtime overlay — ayrı PR’lar).

- **B0 — Geographic semantic anchors (Cesium öncesi):** [`geographicAnchorsV0.js`](../apps/client/src/rhizoh/spatial/geographicAnchorsV0.js) — beş çekirdek düğüm, `epistemicProfile` vektörü + `atmosphericAffinity`; [`deriveAnchorAtmosphereProjectionV0.js`](../apps/client/src/rhizoh/spatial/deriveAnchorAtmosphereProjectionV0.js) — `worldPresence` + anchor → `{ localFog, localAura, localExposure, resonanceDrift }` (saf projection hint; mesh / Cesium entity / shader yok). Anchor ≠ scene object ([`RHIZOH_PROJECTION_DISCIPLINE_V0.md`](RHIZOH_PROJECTION_DISCIPLINE_V0.md)).

#### Cesium hybrid v0 — epistemik kalibrasyon (policy, kod SSOT)

İlk anchor seçimi **“harita nereden başlasın?”** değil; **hangi epistemik karakter ilk referans (cognitive prior)?** — başlangıç tonu ve ilk 30–60 sn “world truth” kalibrasyonu.

| Anchor | Rol (özet) |
|--------|------------|
| **Sarıyer** | **Kalibrasyon kökü** — baseline, düşük entropy, noise suppression referansı; yanlış perception bias riskini düşürür. Kod: `RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0` · `getRhizohCalibrationRootAnchorV0()`. |
| **Beşiktaş** | Throughput / etkileşim yoğunluğu — sonraki fazda “canlı sistem” hissi. |
| **Kadıköy** | Divergence ekseni — sonraki fazda anlamsal dallanma / drift görünürlüğü. |

**Önerilen bootstrap sırası (Cesium geldiğinde):** (1) Cesium init — yalnız terrain/tiles, projection mapping yok → (2) anchor enjeksiyonu — kök = Sarıyer (`geographicAnchorsV0`) → (3) minimal projection — örn. `fogDensity` + `ambientTint` → (4) ikinci faz — Beşiktaş + Kadıköy divergence overlay. Bu sıra **epistemik reality calibration** tasarımıdır; “Cesium entegrasyonu” ile karıştırılmamalı.

**B1 (kod, isteğe bağlı):** `VITE_RHIZOH_EPISTEMIC_CESIUM_BOOTSTRAP=1` → [`cesiumEpistemicBootstrapV0.js`](../apps/client/src/rhizoh/spatial/cesiumEpistemicBootstrapV0.js) + [`cesiumSpatialAdapterV0.js`](../apps/client/src/rhizoh/spatial/cesiumSpatialAdapterV0.js) — `CesiumRealMapLayer`: ilk `setView` Sarıyer; terrain aşamasından sonra `deriveAnchorAtmosphereProjectionV0` → sahne fog / `globe.atmosphereLightIntensity` + tek calibration entity. Epistemik origin/mode SSOT: [`cesiumEpistemicRuntimeStoreV0.js`](../apps/client/src/rhizoh/spatial/cesiumEpistemicRuntimeStoreV0.js); `window` yalnızca `VITE_RHIZOH_EPISTEMIC_RUNTIME_DEBUG=1` ile ayna. Kamera hâlâ kullanıcı tarafından hareket ettirilebilir; epistemik **origin** store’da sabitlenir (truth state’e yazılmaz).

**B2 (FINAL — daraltılmış kilit):** **yalnızca DEBUG + gözlemlenebilirlik.** Canlı boru değişmez: `OpenWeather → weatherIngestV0 → worldPresenceRuntimeV0 → sceneProjectionAdapterV0 → Cesium/UI`. Gözlem hattı (ayrı, güvenli add-on): `Cesium → perceptionSignalV0` (salt okunur) → `perceptionDebugStoreV0` (world state **değil**) → isteğe bağlı overlay (`VITE_RHIZOH_PERCEPTION_DEBUG=1`, `RhizohPerceptionDebugOverlay` + `perceptionDebugRuntimeV0` / `postRender`). **`perceptionSignal` asla `worldPresenceState` değiştirmez**; runtime karar / smoothing / ingest bu katmana **bağlanmaz**.

**Spatial embodiment final lock (V1 anlatı + kod):** [`RHIZOH_SPATIAL_EMBODIMENT_FINAL_LOCK_V1.md`](RHIZOH_SPATIAL_EMBODIMENT_FINAL_LOCK_V1.md) — kamera = gözlem aracı; anchor = semantic field; Castle = yüzey; `spatialOrchestratorV0` (**SER**) = projection composer; `getRenderCapabilitySnapshotV0` = önceden çözülmüş render bayrakları; `rhizohCapabilityManagerV0` = yalnızca UI facade (composer import etmez; abonelik / harici ACL değil).

**B3 (v0 — tek saat):** [`liveRuntimeOrchestratorV0.js`](../apps/client/src/rhizoh/runtime/liveRuntimeOrchestratorV0.js) — `runLiveRuntimeOrchestratorTickV0`: stale weather refresh → `buildWorldPresenceStateV0` → derive + smooth → DOM projection; `registerLiveRuntimeCesiumRenderSinkV0` ile Cesium yalnızca `requestRender` **tüketici** tetik. **Temporal consistency lock:** [`liveRuntimeTemporalLockV0.js`](../apps/client/src/rhizoh/runtime/liveRuntimeTemporalLockV0.js) — tick drift / kaçırılmış kare için üst sınırlı ekstra sink çağrıları (truth yazımı yok), `setTimeout` zinciri ile tick süresine göre gecikme telafisi, projection→sink aralığı ve sink süresi ölçümü. `RhizohAtmospherePresenceBridge` artık ayrı poll + apply değil, bu orchestrator’ı kullanır. **Perception (B2) orchestrator içinde değildir.**

### Rhizoh Presence Layer

“Tanınıyor ama hissedilmiyor” → passive surfaces.

### Castle Embodiment Layer

**Procedural cognitive architecture** — epistemik duruma göre form/ışık/procedural dil (önceki durum tablosu burada yaşar).

---

## 8. Fazlı yol (özet)

| Faz | Ad | Hedef | Not |
|-----|-----|--------|-----|
| **1** | Presence & Reality | “Nefes alıyor” + İstanbul’a bağlanma | Önce **B** atmosfer; sonra **C** echoes; en son **A** trafik |
| **2** | Spatial Intelligence | Mekânsal zekâ, procedural castle, bridge | Research |
| **3** | Collective Runtime | Çoklu ajan / habitat | Research |

---

## 9. İlişkili belgeler

- [`RHIZOH_PROJECTION_DISCIPLINE_V0.md`](RHIZOH_PROJECTION_DISCIPLINE_V0.md) — projection / renderer sınırı (state mutate yok, tek yönlü boru)
- [`RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md`](RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md) — kimlik / snapshot sınırı  
- [`docs/ASSET_CONTRACT_SPEC.md`](ASSET_CONTRACT_SPEC.md) — 3D / semantik varlık öncesi kontrat  
- [`docs/WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) — laboratuvar evren snapshot’ı  

---

*V0 — Living world & embodiment; B→C→A sırası ve atmospheric öncelik bu revizyonla sabitlendi.*
