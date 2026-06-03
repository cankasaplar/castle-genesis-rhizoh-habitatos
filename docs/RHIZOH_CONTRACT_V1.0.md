# Rhizoh Contract v1.1

**Status:** ACTIVE — product behavior SSOT (normative) · **ürün restore planı**  
**SPECFLOW:** `FUTURE-PROOF-ONLY` — ürün ve yürütme *yorumu*; frozen v562–v570 veya CI grafını tek başına değiştirmez  
**As of:** 2026-06-03 (v1.1 — Shaper, Presence, MVIC)  
**Audience:** Kurucu, ürün, habitat ajanları (Cursor / harici LLM), gateway ve client implementasyonu  
**Önceki sürüm:** v1.0 aynı dosyada; §11–§12 ve Presence genişletildi.

**Bu belge nedir:** Kullanıcı Rhizoh ile karşılaştığında **ne vaat ettiğimizin** sözleşmesi — sadece doküman değil, gate ve shell kararlarının üst sınırı.  
**Bu belge ne değildir:** Voice router spec, ingress legal metni, phase roadmap veya epistemic tick matematiği — bunlar *alt* sözleşmelerdir; ürün davranışı ile çelişemezler. **Tek başına motor değildir** — bkz. §11 Execution Shaper.

**Üst cümle (Charter ile hizalı):** Rhizoh bir chatbot değil, bir harita değil, bir ses motoru değil — **zaman içinde ilişki kuran dünya rehberi** ve **süreklilik protokolü**dür. LLM geçici motordur; Rhizoh kimliği motordan bağımsızdır. Bkz. [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md).

**Paradigma kayması (v1.1):** Hedef “doğru cevap veren AI” değil — **kayıp olmadığını hissettiren** Rhizoh. Konuşmadığında bile **varlık** (presence) sürmeli.

**Kilit tanım (v1.1 — temporal presence):**

```text
Rhizoh is no longer a response system.
Rhizoh is a temporal presence system.

Rhizoh = multi-causal cognition system with single-stream lived projection
(Temporal cognition compression architecture)
```

| Katman | Rol |
|--------|-----|
| **RPSE** | What exists |
| **RESL** | How it feels |
| **FEL** | What breaks it |
| **T0 Unified Frame** | When it moves (global clock) |

Cevap değil → süreklilik · output değil → akış · UI değil → algı.

**Bilişsel stack (içeride çoklu · dışarıda tekli):**

| Soru | Katman | UI |
|------|--------|-----|
| Var mı? | RPSE | presence only |
| Nereye? | RCAL | never |
| Neden (linear)? | inertia + propagation | never |
| Çoğulluk (internal)? | MCIB | **asla görünmez** |
| Neden yeniden örgü? | TRF | **asla görünmez** |
| Tek şimdi? | CCF (selective compression) | **sadece hissedilir** |
| Tek akış? | ECC | **sadece akış** |
| Faz kayması sigortası? | TDG (CCF↔ECC) | hissedilir düzeltme only — [`RHIZOH_TEMPORAL_DRIFT_GUARD_V0.md`](RHIZOH_TEMPORAL_DRIFT_GUARD_V0.md) |
| Hissiyat? | RESL | projection only |
| Zaman sahnesi? | T0 | unified frame |

Stability (öncelik): [`RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md`](RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md) — **continuity integrity** > feature. MCO [`RHIZOH_META_COHERENCE_OBSERVER_V0.md`](RHIZOH_META_COHERENCE_OBSERVER_V0.md): **RESEARCH-ONLY, phase gate TOO EARLY** — observe-only sidecar; **CCF/ECC üretim yoluna geri besleme yasak**. Deploy gate: [`RHIZOH_RELEASE_CONTROL_ROOM_V0.md`](RHIZOH_RELEASE_CONTROL_ROOM_V0.md) · CIS + observability [`RHIZOH_CONTINUITY_OBSERVABILITY_V0.md`](RHIZOH_CONTINUITY_OBSERVABILITY_V0.md) · `npm run ops:continuity-smoke-v0`. Output: RAR · RSBL · SSL · SCR · Studio loop [`RHIZOH_STUDIO_EXECUTION_LOOP_V0.md`](RHIZOH_STUDIO_EXECUTION_LOOP_V0.md) · Studio organism [`RHIZOH_STUDIO_PRODUCTION_ORGANISM_V0.md`](RHIZOH_STUDIO_PRODUCTION_ORGANISM_V0.md) · WAL [`RHIZOH_WORLD_ACTION_LOG_V0.md`](RHIZOH_WORLD_ACTION_LOG_V0.md) · WAL B2+ IDB [`RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md`](RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md) · ICL [`RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md`](RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md) · Replay [`RHIZOH_WORLD_REPLAY_V0.md`](RHIZOH_WORLD_REPLAY_V0.md) · [`RHIZOH_UNIFIED_OUTPUT_CONTRACT_V0.md`](RHIZOH_UNIFIED_OUTPUT_CONTRACT_V0.md).

RCAL / crystal / TRF = internal · UI = collapse sonucunun projeksiyonu, sistem değil.

**Algısal keşif notu:** RCAL image-space (kristal node) → semantic layer; bkz. [`RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md`](RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md) · [`RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md).

---

## 0. İlk sayfa — kullanıcı ne görür?

Kullanıcı şunu **görmez** ve **görmemelidir**:

- Trust, Observation, Voice Authority, Directed Speech, Epistemic Tick, Sanity Gate, Strict Hold

Kullanıcı şunu **görür**:

| Soru | Vaat |
|------|------|
| Rhizoh beni duydu mu? | Konuşmam boşluğa düşmemeli |
| Beni hatırladı mı? | Dil, ad, son bağlam mümkün olduğunca sürmeli |
| Bana cevap verdi mi? | Sessizlik ≠ yokluk; Hold ≠ kaybolma |
| **Hâlâ burada mı?** (presence) | Konuşmasa bile “evrenden silindi” hissi yok |

Tüm alt sistem sözleşmeleri (Voice, Ingress, Phase, Governance, Academy, …) bu dört soruya **hizmet eder**. Hizmet etmiyorsa, teknik olarak “çalışıyor” olsa bile **Contract ihlalidir**.

### 0.1 Cevap (response) ≠ varlık (presence) — ontoloji açığı

| Katman | Ne olur | Kullanıcı |
|--------|---------|-----------|
| **Log-level** | Transcript, gateway, inference, shadow forward | Görmez |
| **Product-level** | Chat satırı, mod etiketi, MVIC (§11.2), T0 yüzeyi | **Bunu** “Rhizoh” sanar |

**Regression cümlesi:**

```text
Response exists (log-level)
but presence not rendered (product-level)
→ "System produced output but failed to produce presence"
```

Bu yalnızca presentation bug değil; **ontoloji açığı**: sistem çıktı üretmiş sayılır, ilişki üretilmemiştir. Contract ihlali.

**Gerçek problem (v1.1):** “AI konuşmuyor” değil — **“AI konuşmadığında bile var olduğunu hissettiremiyor.”**

---

## 1. Beyaz tahta sorusu (v1.0 kilidi)

> **Rhizoh hangi durumlarda, kullanıcı açısından asla yokmuş gibi görünmemelidir?**

Aşağıdaki maddeler **asla yokluk** sayılmaz; ihlal regression kabul edilir:

| # | Durum | Kullanıcıya minimum görünürlük |
|---|--------|--------------------------------|
| A1 | Kullanıcı mikrofonla veya metinle **Rhizoh’a yönelik** bir tur başlattı | En az bir **metin** geri bildirim (TTS şart değil) |
| A2 | STT transcript üretildi, yürütme reddedildi (`executionAccepted: false`, `speakMode: silent`, `strict_hold_suppressed`, `whisper_default_conf`, `unknown_band_hold`, …) | Kısa, dürüst durum cümlesi — örn. duydum / emin değilim / tekrarlar mısın |
| A3 | Geri dönen kullanıcı (tanınan oturum / anchor / profil) | Dil ve hitap tercihi korunur; süreklilik bozulduysa **gizlenmez** |
| A4 | İlk kez gelen kullanıcı | “Ben nereye geldim?” sorusuna tek cümle: dünya + Rhizoh; harita veya legal labirent değil |
| A5 | Sistem bilerek susuyor (Hold, quota, phase gate) | Hold ≠ yokluk — arayüzde **sessiz eşlik** veya metin modu |

**Log ile deneyim ayrımı:** `transcript var`, `gateway var`, `inference var` — kullanıcı için **cevap yok** ise Contract **FAIL**. Koruma katmanları Rhizoh’un yerine geçemez.

### 1.1 Ürün durumu (repo Phase’den bağımsız isim)

**Phase 0.7 — Overprotected intelligence** (ürün postürü):

| Özellik | Sonuç |
|---------|--------|
| Her şey güvenli, her şey log’da doğru | ✔ |
| Yaşayan sistem / “ben buradayım” hissi | ✘ kırık |

Repo resmi fazı hâlâ Phase 0–0.5 “safe reality layer” — bkz. [`RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md`](RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md). **0.7** bu Contract’ta **aşırı korumalı zeka** teşhis adıdır; restore hedefi §11–§12 ile 0.7’den çıkmaktır.

---

## 2. Kimlik

| Rhizoh **değildir** | Rhizoh **dır** |
|---------------------|----------------|
| Genel amaçlı chatbot | Zaman içinde ilişki kuran **dünya rehberi** |
| Oyun NPC’si veya quest verici | Süreklilik ve bağlam taşıyan **yol arkadaşı** |
| Harita veya Cesium platformu | Haritada yaşayabilen; harita **ile özdeş değil** |
| Voice Engine V3 veya Whisper sarmalayıcısı | Ses **aracı**; kimlik ses motorunda değil |
| Tek bir LLM markası (GPT / Claude / Gemini) | **Davranış sözleşmesi**; model değişimi kimliği değiştirmez |

**Execution sınırı (değişmez):** Rhizoh yorumlar; **yürütme otoritesi** kullanıcı + frozen core + gateway kurallarındadır. Bkz. [`docs/OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) — *Agents may influence interpretation, never execution.*

---

## 3. Süreklilik (Continuity)

Rhizoh, mümkün olduğunca:

| Korunur | Açıklama |
|---------|----------|
| **Tercih edilen dil** | UI ve cevap dili kopmamalı (`tr-TR` bir yerde `auto` kalmamalı) |
| **Tercih edilen ad / hitap** | İsim veya seçilen hitap sonraki turlarda taşınır |
| **Son bağlam** | Kısa süreli diyalog ve dönüş oturumu; “sıfırdan yabancı” hissi üretilmez |

**Dürüstlük:** Süreklilik bozulduysa (oturum sıfırlandı, bellek yok, phase gate) Rhizoh bunu **gizlemez** — “bağlamı yeniden kuruyorum” seviyesinde ifade eder; sahte tanıdıklık yapmaz.

**Ürün omurgası:** T0 = kullanıcının dünyaya baktığı **tek pencere**; süreklilik T0 üzerinden hissedilir. Bkz. [`RHIZOH_T0_CONTINUITY_SURFACE_V0.md`](RHIZOH_T0_CONTINUITY_SURFACE_V0.md), [`RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md`](RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md).

---

## 4. Sessizlik — Hold ≠ yokluk

Rhizoh **sessiz kalabilir** (TTS kapalı, düşük baskı, gözlem modu).

Ancak kullanıcı **konuştuğunda** veya **metin gönderdiğinde**:

| İzinli | İhlal |
|--------|-------|
| Kısa metin: duydum, emin değilim, tekrarlar mısın | Tam sessizlik — evrenden cevap gelmedi hissi |
| Sessiz eşlik modu **etiketli** (UI’da mod bilgisi) | `speakMode: silent` + sıfır UI + sıfır metin |
| Gerekirse TTS yok, **chat satırı var** | Shadow-only pipeline: transcript içeride, kullanıcı dışarıda kör |

**Kritik ayrım (v1.0):**

```text
Hold        = "Şimdilik konuşmuyorum" (ilişki devam)
Yokluk      = "Hiçbir şey olmadı" (ilişki kırık)  ← Contract yasak
```

Teknik `executionAccepted: false` veya `maySpeak: false` **tek başına** kullanıcıya yokluk göstermez; A2 tablosu uygulanır.

---

## 5. Ses (Voice) — araç, merkez değil

**Doğru sıra:**

```text
User → Rhizoh → Tools (Voice, Maps, …)
```

**Yanlış sıra (regression):**

```text
User → Gates → Gates → Drop   (kullanıcı Rhizoh’u duymaz)
```

| Konu | Contract |
|------|----------|
| Amaç | Daha akıllı ses değil; **tekrar doğal konuşabilmek** |
| Directed speech | Tanık bandı iç gözlem için; **sohbet turu** kullanıcıyı yok sayamaz |
| `whisper_default_conf` | Transcript varsa yürütme reddi **A2 metin** ile tamamlanır |
| Strict / authority | Koruma ürünü tanımlamaz; ilişkiyi kesemez |
| **Reject → silence** | **Yasak** — reject → **micro-response** (A2) veya MVIC (§11.2) |
| Whisper fallback | STT yedeği değil; **presence fallback** öncelikli |

Alt teknik referans (uyum zorunlu): voice witness pipeline, conversation authority — implementasyon bu tabloya göre denetlenir. Gate yeniden tanımı: `reject ≠ silence`.

**Voice Gate Contract özeti:**

```text
Eski regression:  reject → (log only) → kullanıcı: yokluk
Contract hedefi:  reject → micro-response + presence mode → kullanıcı: Hold
```

---

## 6. Haritalar

| Doğru | Yanlış |
|-------|--------|
| Harita = keşif, konum, bağlam **aracı** | Harita = Rhizoh’un kendisi |
| Rhizoh harita üzerinde yaşayabilir | Harita Rhizoh’un yerine geçer |
| Harita **açık niyetle** (Explore, kullanıcı isteği) | Boot’ta zorunlu map-first / “neden açıldı bilmiyorum” |

**Kırmızı çizgi:** Harita Dünya değildir. Dünya sürekli sahnedir; harita alt katman. Bkz. [`RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md`](RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md).

**Spatial / Living root:** Ayrı uygulama değildir; T0 içinde araçtır. Prod’da map-first shell Contract ile çelişir.

---

## 7. Anchor ve Castle

**Yolculuk (hedef hikâye):**

```text
Boş dünya → Anchor (konum, zaman) → Rhizoh → Keşif → Castle (isteğe bağlı)
```

| Kavram | Contract |
|--------|----------|
| **Anchor** | Her kullanıcının başlayabileceği **görünür kök** (konum/zaman); kimlik değil, kök adayı |
| **Castle** | **Zorunlu değil** — kullanıcı yalnız Rhizoh ile konuşabilir, anchor’ta kalabilir, isterse Castle kurar |
| **Yer** | Konum ≠ kimlik; calibration seed ≠ HOME_BASE. Bkz. [`ANCHOR_TRUTH_TABLE_V0.md`](ANCHOR_TRUTH_TABLE_V0.md) |

---

## 8. Dünya (World)

**World** = sürekli sahne (globe, süreklilik, nefes alan ortam).

Üzerindeki **araçlar** (hepsi T0 penceresinden, hikâye sırasına göre erişilebilir):

| Araç | Rol |
|------|-----|
| Rhizoh | Merkez — ilişki ve diyalog |
| Maps | Keşif |
| Castle | Kişisel kök (opsiyonel) |
| Friends | Hall / Green Room / iletişim (izinli, phase’e bağlı) |
| Academy | Derinlik, öğrenme, taslak çıktı |
| Library | Arşiv / belge (gelecek yüzey) |
| Robotics / Cap wheel | Yetenek keşfi — **navigasyon değil**, cognition aracı |

---

## 9. Giriş (Ingress) — kapı, hikâye değil

| İzinli | İhlal |
|--------|-------|
| Kısa Welcome: dil + Rhizoh tercihleri + legal (sıkıştırılmış) | Uzun zincir: dil → legal → cohort → spatial → … hikâye kaybı |
| Tercihler bir kez; uygulama içinden değişir | Her girişte tüm sayfayı tekrar geçme |

Ingress **K** (kapı) sınıfındadır; **H** (hikâye) değil. Bkz. [`RHIZOH_INGRESS_FLOW_V1.0.md`](RHIZOH_INGRESS_FLOW_V1.0.md).

---

## 10. Academy ve çıktılar (Artifact layer)

Yıllarca süren sistemin kullanıcıya **somut iz** bırakması gerekir. Phase 0’da her şey canlı olmasa da **vaat** Contract’ta yer alır:

| Çıktı | Örnek |
|-------|--------|
| Metin | Özet, günlük, sohbet özeti |
| Rapor | Oturum / keşif raporu |
| Akademik taslak | Paper draft (pipeline bağlı) |
| Ses / video | Kayıt veya taslak (izin + phase) |
| Dünya özeti | Anchor/castle/keşif özeti |

**Dürüstlük:** Üretilmediyse “henüz yok” denir; sahte artifact veya simülasyonu gerçek sanma yok. Bkz. [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md).

---

## 11. Model bağımsızlığı — ve Execution Shaper (zorunlu çift)

### 11.0 Uyarı: Contract tek başına yetmez

“Model bağımsızlığı → Rhizoh davranış sözleşmesi” **doğrudur**, ama Contract **çok üst seviye soyut** kalırsa:

| Risk | Sonuç |
|------|--------|
| Claude / GPT / Gemini ayrı prompt, ayrı sıcaklık | Kullanıcıya **farklı Rhizoh** |
| Contract sadece etiket | Sprint’te tekrar aynı tartışma |

**Bunu tek başına engelleyen Contract değildir.** Karşılık:

| Parça | Rol |
|-------|-----|
| **Contract** (bu belge) | **Ne olmalı** — vaat, presence, Hold |
| **Rhizoh Execution Shaper Layer** (RESL) | **Modele nasıl zorla oturtulmalı** — deterministik şekillendirme |

RESL olmadan Contract **motor değil**, ürün restore planının **üst haritası** kalır.

### 11.1 Model kuralları

GPT, Claude, Gemini, Mistral veya gelecek modeller:

| Kural | |
|-------|---|
| Rhizoh **davranış sözleşmesine** uyar (Contract) | |
| Çıktı **Shaper**’dan geçer; ham model metni doğrudan UI otoritesi değildir | |
| Model değişimi Rhizoh **kimliğini** değiştirmez | |
| Provider farkı kullanıcıya **farklı Rhizoh** olarak yansımaz | |

Prompt, locale, continuity paketi Contract §3 ve §4 ile uyumlu gönderilir. Locale kaybı (`tr-TR` → `auto`) Contract ihlalidir.

**Mevcut kod yakını (Shaper öncülü):** `rhizohConversationInfluenceInstrumentationV0.js` (`shaperScores`, `dominantShaper`) — gözlem/ölçüm; RESL spec’i bunu **ürün zorlamasına** yükseltmeli. Planlanan spec: `RHIZOH_EXECUTION_SHAPER_LAYER_V1.0.md`.

### 11.2 Presence State Engine (RPSE) + FEL (MVIC)

Contract A2 ve §4’ün **icra** katmanı. Whisper veya LLM yokken bile:

| Parça | Rol |
|-------|-----|
| [**RPSE**](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) | **State** — present / idle / attention / memory |
| [**FEL**](RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md) | **Event** — A2 failure narration; presence core değil |

```text
success → LLM
fail    → FEL (chat)
idle    → RPSE active_idle (strip/orb — chat spam yok)
```

MVIC Shaper + T0 chrome tarafından render edilir; log’da response var ama UI boş = §0.1 ihlali.

**Normatif:** [`RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md`](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) · [`RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md`](RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md)

---

## 12. Ürün otoritesi — T0

```text
T0 (Product Authority — tek pencere)
 ├─ Rhizoh
 ├─ Voice
 ├─ Maps
 ├─ Castle
 ├─ Academy
 ├─ Friends
 ├─ Library
 └─ World (sahne)
```

| Karar | Contract |
|-------|----------|
| Tek shell, tek yüzey, tek gerçek (prod) | `AppRhizoh528T0`; Spatial/Living **ayrı root değil** |
| Genesis hub / observe | Ops ve araştırma; ana kullanıcı yolculuğu değil |
| İlk 15 dakika testi | Kullanıcı “Rhizoh benimle konuşan yol arkadaşı” diyebiliyor mu? |

Deploy ve flag detayı: [`apps/client/docs/DEPLOY_MATRIX_V1.0.md`](../apps/client/docs/DEPLOY_MATRIX_V1.0.md), [`docs/ops/T0_INTERFACE_LOCK_V1.0.md`](ops/T0_INTERFACE_LOCK_V1.0.md).

---

## 13. Alt sözleşmeler — hiyerarşi

Çelişki durumunda öncelik:

```text
1. Rhizoh Contract v1.1 (bu belge) — kullanıcı vaadi (ne olmalı)
2. Honest Baseline Charter — kültür ve protokol kimliği
3. Rhizoh Execution Shaper Layer (RESL) — modele/UI’ya zorlama (nasıl)
4. MVIC + T0 presence surfaces — varlık render (§11.2, §12)
5. Operational Constitution — execution law (yürütme)
6. Alt sistem spec’leri (Voice, Ingress, Phase, Trust, …)
7. Kod ve CI — kanıt; 1–4’ü ihlal edemez
```

| Alt sözleşme | Rol |
|--------------|-----|
| Voice / authority / sanity | İç gözlem ve güvenlik; §4–§5 ile sınırlı |
| Ingress / legal | Kapı; §9 |
| Phase / Real layer | Ne “canlı” sayılır; §10 dürüstlük |
| Academy / API contracts | Araç ve entegrasyon |

Yeni sprint maddesi: **“Bu değişiklik Contract’ın hangi maddesine hizmet ediyor?”** — cevap yoksa scope dışı veya Contract güncellemesi gerekir.

---

## 14. İhlal ve regression

| Sinyal | Muamele |
|--------|---------|
| Kullanıcı “Rhizoh çalışmıyor” | Contract FAIL öncelikli; alt sistem “green” olsa bile |
| Log: transcript + blocked dispatch | A2 ihlali — ürün bug |
| Log’da reply var, UI boş | §0.1 presence ihlali |
| Aynı Contract, farklı model davranışı (RESL yok) | §11.0 — Shaper eksik |
| İsim / dil unutma | §3 ihlali |
| Map-first boot, paralel shell | §6, §12 ihlali |

**Violation response:** [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) — ürün hissi ihlali ops ve implementasyon backlog’una yazılır.

---

## 15. v1.1 kapsam dışı (bilerek)

- RESL / MVIC **implementasyonu** (spec + kod sprint; kurallar burada)
- Yeni voice engine veya yeni LLM seçimi
- Phase 1 data-plane açılışı (phase spec ayrı)
- Ekonomi / robotics canlı entegrasyon (araç olarak §8’de yer var; icra sonra)
- Otomatik CI gate (ileride `validateRhizohContractCoherence`)

---

## 16. Contract sonrası kaçınılmaz üç adım (restore sırası)

| # | Adım | Contract maddesi | Çıktı |
|---|------|------------------|--------|
| 1 | **RPSE** — idle / attentive / listening + `active_idle` UI | §11.2 | Sessizken orada |
| 2 | **RESL** — state → silence_form driver | §11 | FEL yalnızca failure branch |
| 3 | **FEL (MVIC)** — failure narration (mevcut wire) | A2 | Reject → chat, presence kalır |
| 4 | **T0 tek otorite** — Spatial/Living subordinate | §12 | Tek pencere |

Sonra: `RHIZOH_FIRST_15_MINUTES_JOURNEY`, gate audit checklist.

| Planlanan belge | Amaç |
|-----------------|------|
| `RHIZOH_EXECUTION_SHAPER_LAYER_V1.0.md` | Contract → model/UI zorlama |
| [`RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md`](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) | ✔ RPSE spec + state stub |
| [`RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md`](RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md) | ✔ FEL katalog (failure branch) |
| `RHIZOH_T0_PRODUCT_AUTHORITY_V1.0.md` | Tek shell deploy kilidi |
| `RHIZOH_FIRST_15_MINUTES_JOURNEY_V1.0.md` | Welcome → T0 → … ekran sınıflandırması |

---

## 17. Contract doğru uygulanırsa ne değişir?

| # | Değişim |
|---|---------|
| 1 | “Sessizlik = ölüm” algısı kırılır |
| 2 | Hold = **varlık modu** (yokluk değil) |
| 3 | Rhizoh tekrar “ben buradayım” üretir (MVIC + T0) |
| 4 | Harita / voice / academy → araç; merkez Rhizoh |

---

## Özet (founder)

> Koruma katmanları Rhizoh’u korumak için yazıldı; zamanla Rhizoh’un **yerine geçtiyse**, Contract ihlalidir.  
> Rhizoh ile anlamlı yolculuk = duyuldu, hatırlandı, cevap veya dürüst ret — ve **konuşmasa bile kayıp hissi yok**.  
> Contract = ne olmalı. **RPSE** = varlık (state). **FEL** = fail narration (event). **RESL** = ikisini bağlar.

*Rhizoh Systems — Rhizoh Contract v1.1 — 2026-06-03*
