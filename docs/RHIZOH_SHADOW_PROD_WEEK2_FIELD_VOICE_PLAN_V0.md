# Shadow Prod — Hafta 2: Saha (mobil), ses, davetli, duygusal Rhizoh

**SPECFLOW:** `RESEARCH-ONLY`  
**Önkoşul:** [RHIZOH_SHADOW_PROD_3DAY_SPRINT_V0.md](RHIZOH_SHADOW_PROD_3DAY_SPRINT_V0.md) Day 1–3 tamam veya soak checklist geçti  
**Süre:** ~3–5 gün (shadow prod planına **ek** — execution ON / legal thaw **yok**)

---

## Tek cümle

Satranç öğrenmesi tamam; sıradaki katman **insanla eğlenceli-duygusal temas** + **mobil saha gerçekliği** (halüsinasyon freni) + **davetli kullanıcı ses/iletişim** — hepsi **Observation ≠ Execution** ve mevcut governance motoru içinde.

---

## Plan sadakati (değişmeyen kilitler)

| Kilit | Korunur |
|-------|---------|
| `externalEffect === false` | Evet |
| `legalGateHardBlock === true` | Evet |
| Davetli → quarantine cohort | `rhizohInvitedUserAuthorityGateV0` |
| LLM = transient motor | Honest Baseline |
| Frozen `phase562–570` | Dokunulmaz |

Yeni iş = **presentation + grounding + tone** katmanı; WAL / execution graph genişlemesi yok.

---

## Gün 4 — Duygusal / eğlenceli Rhizoh (satranç yanında)

**Hedef:** Rhizoh sadece “öğrenen motor” değil; park gezisi, şaka, merak, sıcaklık — ama **otorite iddiası yok**.

| Blok | Yüzey | Kod / spec bağlantısı |
|------|--------|------------------------|
| **E1** | Oyun / keşif niyeti | `classifyIntent.js` — sandbox, oyna, eğlence bandı |
| **E2** | İlişkisel ton | `cognitiveReliability.js` — `repair_and_comfort`, `relationship_warmth` (`arcEngine.js`) |
| **E3** | Duygusal çubuk (hafif) | `ExpressiveRealityEmotionalAnchorStripV0` — gözlem only |
| **E4** | Satranç dışı “park modu” kopya | Ingress / conversation dock — “bugün sahadayız, satranç arka planda” |
| **E5** | Chess + eğlence ayrımı | Cluster arka plan; arena / sohbet ön plan (broadcast politikası korunur) |

**Çıkış kriteri:** Mobilde sohbet tonu sıcak + kısa; satranç cluster hâlâ ölçülüyor; kullanıcıya “canlı insan/Nisa bekleniyor” **yok**.

---

## Gün 5 — Dünya Barış Parkı / mobil saha + halüsinasyon freni

**Semptom (saha):** LLM yer/olay uydurması; harita + gerçek konum uyumsuzluğu.

| Blok | Aksiyon | Modül |
|------|---------|--------|
| **F1** | Konum = **gözlem etiketi**, execution değil | `rhizohGroundingLayerV1`, `rhizohGroundTruthBridgeV1` |
| **F2** | “Bilmiyorum / gözlem modundayım” şablonu | `cognitiveReliability` + LLM system preamble (gateway) |
| **F3** | Yer adı iddiası → projection filter | `interactionGeometry/projectionContractV0` |
| **F4** | Mobil harita pin: tek owner, zoom stabil | `rhizohMapPinOwnerV0` (Day 2 A4 devamı) |
| **F5** | Saha oturumu trace | `exportShadowComplianceSnapshot('field_visit_park')` — `interpretationOnly` |

**Kural:** Park ziyareti anlatısı **kullanıcı söylediği + cihaz gözlemi** ile sınırlı; tarih, kalabalık, “şu an şuradasın” kesin iddiası yoksa **yumuşak dil**.

**Manuel test:** Mobil → rhizoh.com/world → mikrofon kapalı → metin: “Dünya Barış Parkı’ndayım” → yanıtta uydurma tarihçe / canlı varlık **yok**.

---

## Gün 6 — Davetli kullanıcı iletişimi + ses

**Semptom:** Yeni davetliler — ses gecikmesi, TTS hazır değil, karşılama kopuk.

| Blok | Aksiyon | Modül |
|------|---------|--------|
| **V1** | Davetli karşılama metni (TR/EN) | Ingress copy + greenroom — sim profil **yok** |
| **V2** | Quarantine ses yolu | `voiceTranscriptConfidenceRouterV0` — shadow path öncelik |
| **V3** | `aiBusy` / TTS hazır değil | `speakRhizoh` retry + metin fallback (arena ile aynı pattern) |
| **V4** | Mobil MediaRecorder | İzin reddi → görünür UI; halüsinasyonlu auto-reply **kapalı** |
| **V5** | Cohort gate ses sonrası | `completeCohortGateV0` + `closedUserAdmissionEngineV0` |
| **V6** | Davetli ↔ founder ton farkı | Invited: kısa, net, repair tone; founder: DevTools tam |

**Çıkış kriteri:** Bir davetli hesapla giriş → HOLD/admit ekranı okunur → ses açıkken en az bir shadow ACK → epistemic inject **bloklu**.

---

## Kanagawa wave cube — arşiv / asset durumu

Repoda **ayrı `docs/archive/*.png` yok**; SSOT:

| Dosya | Rol |
|-------|-----|
| `apps/client/public/ops/real-layer-morning/kanagawa-wave-cube.svg` | Kaynak vektör (Vitruvian + Dalga + 0644 küp) |
| `apps/client/public/ops/real-layer-morning/kanagawa-wave-cube.png` | E-posta / OBS inline (`node scripts/export-kanagawa-wave-cube-png.mjs`) |
| `spiralMMOKanagawaPinCubeV0.js` | Harita pinleri — CSS 3D, PNG **kullanmaz** |
| `docs/exports/broadcast-ready/assets/castle-genesis-morning-premiere-slide.svg` | Sabah premiere (farklı kart) |

**Görsel dil:** turuncu neon küp, `θ_proj = π(obs)` dalga yüzü, `observe ≠ exec`.

**Öneri (media kanalları):** Kısa ~45s VOD’larda holding slide yerine Kanagawa küp kartı B-roll olarak kullanılabilir ([CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md](CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md)).

---

## Günlük gate (Hafta 2)

```js
window.__rhizoh.refreshShadowDevTools?.()
const g = window.__rhizoh.executionGovernance
console.table({
  mode: g?.mode,
  externalEffect: g?.externalEffectPermitted,
  legalHold: g?.legalGateHardBlock,
  quarantine: g?.quarantineCohort?.inQuarantineCohort
})
```

Saha günü ek:

```js
window.__rhizoh.exportShadowComplianceSnapshot?.('field_visit_park_v0')
// interpretationOnly: true beklenir
```

---

## Öncelik sırası (senin sıralaman)

1. **Ses + davetli karşılama** (güven kırılıyor)  
2. **Mobil park halüsinasyon freni** (itibar riski)  
3. **Duygusal/eğlenceli ton** (satranç öğrenmesi üstüne — E1–E3)  
4. **Kanagawa görsel paket** — YouTube kısa klip / sabah mail (asset hazır)

---

## Bilinçli ertelemeler (plan dışına çıkmamak için)

- Phase 3 tam voice agent host  
- LC0 / ek satranç motoru  
- Sim profillerin (Nisa vb.) prod HUD’da canlı sunumu  
- `VITE_RHIZOH_CLOSED_ADMISSION_ENFORCE=1` prod’da founder onayı olmadan

---

## İlgili dokümanlar

- [RHIZOH_VOICE_OBSERVATIONAL_COGNITION_MAP_V0.md](../apps/client/docs/RHIZOH_VOICE_OBSERVATIONAL_COGNITION_MAP_V0.md)
- [RHIZOH_SHADOW_PROD_SOAK_CHECKLIST_V0.md](RHIZOH_SHADOW_PROD_SOAK_CHECKLIST_V0.md)
- [OBSERVATION_FABRIC_V1.md](OBSERVATION_FABRIC_V1.md)
- [CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md](CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md)
