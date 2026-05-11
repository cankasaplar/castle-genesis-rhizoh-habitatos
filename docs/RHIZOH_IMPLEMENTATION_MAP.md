# Rhizoh — Implementation Map (`apps/client`)

**Rol:** Ürün deneyimi merkezli **tek tablo** — referans uygulama, UX hedefi, bugünkü giriş noktası, runtime bağımlılıkları, eksikler ve [FREEZE-0](RHIZOH_FREEZE_0.md) önceliği. Bu belge **dosya envanteri değil**; [Reference implementations](RHIZOH_REFERENCE_IMPLEMENTATIONS.md) ile aynı disiplinde.

**Kaynak gerçeklik:** Ürün kabuğu ve rota eşlemesi `apps/client/src/AppRhizoh528.jsx` (`matchPath` + `SET_PRODUCT_SURFACE`). Hedef rotalar (`/companion`, …) **henüz ayrı sayfa olmayabilir** — sütunda açıkça ayrılır.

**İlişkili:** [Companion-first UX state machine](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) · [State Transition Spec](RHIZOH_STATE_TRANSITION_SPEC_V1.md) · [Transition Choreography TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) · [Observe World Injection OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [Experience Stress Test ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) · [ESTL UX Collapse Report](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) · [ESTL UI Collapse Optimization](RHIZOH_ESTL_UI_COLLAPSE_OPTIMIZATION_V1.md) · [ESTL-OPT UI Diff Viewer](RHIZOH_ESTL_OPT_UI_DIFF_VIEWER_V1.md) · [Algı ekonomisi / ESTL döngüsü](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md) · [ESTL Full-Cycle Live Session](RHIZOH_ESTL_FULL_CYCLE_LIVE_SESSION_V1.md) · [Firebase Epistemic Runtime FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) · [FER-1 Minimal Production Stack](RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md) · [FER-1 Runtime Closure Patch](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md) · [FER-1 Production Closure Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md) · [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md) · [WC-PF partial failure](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) · [Semantic recovery SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md) · [Trust memory TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md) · [ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md) · [ECR execution model](RHIZOH_ECR_EXECUTION_MODEL_V1.md) · [AIL-1 agency / intent](RHIZOH_AGENCY_INTENT_SHAPING_V1.md) · [GEJ-1 PAG/HOGA junction](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md) · [EAERT execution equivalence](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) · [Firestore Rules intent FER-1](FIRESTORE_RULES_INTENT_FER1_V1.md) · [Embodied Product Reality](RHIZOH_EMBODIED_PRODUCT_REALITY.md) · [Reference User Journey](RHIZOH_COMPANION_REFERENCE_JOURNEY.md) · [Castle node runtime](CASTLE_NODE_RUNTIME_MODEL.md) · [UI language](RHIZOH_UI_LANGUAGE_GUIDE.md)

---

## 1. İki evren: Core-complete vs Product-complete

Projeyi iki **bağımsız başarı uzayına** böler; çoğu ekipte erken anlaşılmaz:

| | **Core-complete** (çekirdek evreni) | **Product-complete** (yaşam evreni) |
|--|--------------------------------------|--------------------------------------|
| **Ne** | ETK, HOGA, EBE, ECDM, TLOA, TTA, PAG, πEFC, RBL… — deterministik, governance-heavy, replayable, correct-by-construction **yetenek** | Companion açılıyor mu? Kullanıcı **geri geliyor** mu? Onboarding **hissediliyor** mu? Chronicle **okunuyor** mu? Castle **kuruluyor** mu? Sistem **yaşanıyor** mu? |
| **Ölçü** | MK-1, HOGA, ETK, spec uyumu | Davranışsal güven; [Invisible Kernel Tests](#5-invisible-kernel-tests-product-ci) |
| **Risk** | Sonsuz teori genişlemesi | Surface incoherence, bilişsel yük, güven kaybı |

**Kritik cümle:** **Core doğru olabilir; ürün yine de başarısız olabilir.**  
Kalite sorusu (final bar):

> **Can a non-technical human live with this daily?**  
> Evet → sistem kazanır · Hayır → teori **ürün açısından** irrelevant kalır.

Enterprise, aile node’u, Castle, Companion — hepsi bu soruya dayanır.

### 1.1 Çekirdek = asset (problem değil)

Çekirdek artık: güçlü, fazla güçlü, kendi içinde kapalı, deterministik, governance-heavy — **bu kısım “düzeltilmesi gereken hata” değil**, şirketin **teknolojik varlığıdır (asset)**. Risk, onu **sınırsız büyütmek** değil; yüzeyle **dengelememek**.

### 1.2 Ürün boşluğu = “feature eksikliği” değil

Tablodaki eksikler (Companion yok, Chronicle parçalı, Observe centerless, Studio ağır, Castle gömülü, Spiral erken) tek başına “bir özellik daha” değil — **experience coherence** (deneyim tutarlılığı) problemidir.

---

## 2. Surface incoherence — gizli ürün killer

**Teşhis:** Kernel çok güçlü; UI çok parçalı — debug + map + log + spiral + runtime **aynı yüzeyde** → kullanıcı **“hangi dünyadayım?”** hissini kaybeder. Sistem **doğru çalışabilir** ama insan zihni onu **tek şey** olarak tutamaz. Bu **algı mimarisi** problemidir; yalnız teknik UI hatası değil.

**Fren:** [FREEZE-0](RHIZOH_FREEZE_0.md) — özellikle **one emotional center per screen**. Bu ilke **opsiyonel değil**; ürün kaderine bağlıdır.

---

## 3. Single emotional center (zorunlu kural — “UI physics law”)

**Kural:** Bir ekran = **bir** zihinsel durum = **bir** duygusal merkez — gizli bir **UI fiziği yasası**. Bozulursa ürün **güçlü dashboard** olur; **yaşanan dünya** olmaz.

| Screen (hedef yüzey) | Zihinsel durum (tek bilinç) | Emotional center |
|----------------------|-----------------------------|-------------------|
| **Companion** | Bağ kurma | Connection |
| **Chronicle** | Geçmişi tutma | Memory |
| **Observe** | Dünyayı fark etme | Awareness |
| **Castle** | “Buradayım” | Presence |
| **Studio** | Akışı yönetme | Control |

Companion / Chronicle / Observe için [UI language](RHIZOH_UI_LANGUAGE_GUIDE.md) ile hizalı isimler kullanılabilir.

---

## 4. Şu anki gerçek durum (özet)

| Güçlü taraf | Zayıf taraf |
|-------------|-------------|
| Governance çok ileri | Yüzey hâlâ **dağınık bir güç gösterisi** |
| Memory / replay çok güçlü | **Giriş noktası net değil** — `/companion` yok (kritik) |
| Çok katmanlı mimari olgun | Duygusal merkezler **dağınık** |
| Teorik closure sağlam | Observe var ama **centerless** risk; Studio **ağır**; Spiral **erken görünürlük** riski |

**Tek cümle:** Rhizoh şu an **engine olarak çok ilerde, product olarak parçalı**.

### 4.1 Heuristik tamamlanma (yön göstergesi, kesin ölçüm değil)

| Boyut | Sipariş büyüklüğü (ekip hissi) |
|-------|----------------------------------|
| **Teknik / epistemic engine** | ~%80–90 — çok ileri |
| **Yaşanabilirlik / yüzey** | ~%30–40 — parçalı |

Bu uyumsuzluk **normal** ama **kritik**; bir sonraki faz yüzeyi **daraltmak** ve üçlü spine’ı oturtmak.

---

## 5. Invisible Kernel Tests (product CI)

Klasik CI: **çalışıyor mu?**  
Rhizoh ürün CI’si: **insan bunu yaşayabilir mi?** — bu, **ürün ontolojisi** testleridir; “soft” görünür ama **en kritik governance katmanı** olabilir.

| Test | Soru |
|------|------|
| **UX noise** | Yüzey karmaşıklaştı mı? Jargon / panel sızdı mı? |
| **Emotional stability** | Companion tonu bozuldu mu? ([Personality](RHIZOH_COMPANION_PERSONALITY_STABILITY.md)) |
| **Cognitive load** | Bir ekranda **birden fazla** duygusal merkez var mı? |
| **Calmness** | Bildirim / uyarı yoğunluğu arttı mı? ([Calm](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md)) |
| **Continuity feeling** | Hafıza / geri dönüş hissi zayıfladı mı? ([Journey](RHIZOH_COMPANION_REFERENCE_JOURNEY.md)) |

**İlke:** Teknik olarak doğru ama **yanlış hissettiren** → ürün açısından **başarısız** olabilir.

**Soru sırası (ürün yüzeyi):** Klasik test *“doğru mu?”* — ürün CI *“yaşanabilir mi?”* Bu, çekirdekte doğruluğu **iptal etmez**; fakat **yalnız doğruluk** ürün başarısını **garanti etmez**. İleri seviye: doğruluk **zorunlu**, yaşanabilirlik **birincil sıra** (yüzey kararlarında).

**Operasyonel stres katmanı:** [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) — birincil bar artık yalnız latency/feature değil; **kopuyor mu, akıyor mu?** ve katmanların **görünmez** kalması. Seans çıktısı ürün kararına dökülür: [ESTL-Driven UX Collapse Report](RHIZOH_ESTL_UX_COLLAPSE_REPORT_V1.md) (Companion’da düşme, Observe’da sıkılma, Chronicle’da bırakma — **redundancy azaltma + yüzey sadeleştirme**).

**Stratejik not:** Çekirdek güçlü olduğunda birincil risk “daha az yetenek” değil — **fazla sistem hissi**; öncelik yüzeyi **daraltmak** ve tekrarı **kesmektir**.

**Algı ekonomisi:** ESTL→CR→OPT→DIFF zinciri ve “kendi UX kaybını hesaplayabilen deneyim” tanımı için [RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md](RHIZOH_PERCEPTION_ECONOMY_AND_ESTL_LOOP_V1.md); gerçek kullanıcı ile ilk tam döngü: [ESTL Full-Cycle Live Session](RHIZOH_ESTL_FULL_CYCLE_LIVE_SESSION_V1.md).

---

## 6. Stratejik kilit: üç giriş + ikinci halka

**Şu an en doğru yön:** Kernel’i daha da büyütmek değil — **product surface’i daraltmak** (daha az ekran, daha net entry, daha güçlü default flow, daha az “mode”, daha çok tutarlı **state**).

**Aynı anda kilitlenmesi gereken üçlü:**

| # | Yüzey | Rol |
|---|--------|-----|
| **1** | **Companion** = **primary entry** — sistemin kapısı |
| **2** | **Chronicle** = **ikinci doğal aks** — retention motoru |
| **3** | **Observe** = **pasif awareness** — arka plan farkındalığı |

**İkinci halka** (Companion/Chronicle/Observe oturduktan sonra net): Castle · Studio · Spiral. Bu ayrım yoksa sistem büyüdükçe **dağılır**.

**Üçlü spine = “Rhizoh OS homepage”:** giriş (Companion) · hafıza (Chronicle) · dünya hissi (Observe) — geri kalan ikinci halkada kalır.

---

## 7. Ürün ↔ runtime ↔ route (ana tablo)

| Reference implementation | UX goal | Current route / surface | Runtime dependencies | Missing pieces | Freeze priority |
|---------------------------|---------|---------------------------|------------------------|----------------|-----------------|
| **Companion flow** | Connection + continuity | **`/`** kabuk + drawer; **`/companion` yok** | Gateway WS, LLM, session | Dedicated entry; reconnect; ses/bildirim disiplini | **HIGH** |
| **Chronicle** | Memory (Timeline) | **Parçalı**; **`/chronicle` yok** | Firestore/local, TLOA/ETK (sunucu düşüncesi) | Tek Timeline merkezi | **HIGH** |
| **Observe** | Awareness | **`/map`**, **`/`** world | Cesium, katmanlar | Overload azaltma; tek merkez | **MEDIUM** |
| **Castle** | Presence / Space | **`/castle/:id` yok** (runtime gömülü) | Auth, node model | URL, izinler, şablonlar | **HIGH** |
| **Studio** | Control | **`/studio`** | Store, presence, gateway | Ağır UI sadeleştirme | **MEDIUM** |
| **Spiral** | Collective (geç) | **`/spiral`** | Simülasyon | Flag / policy ile freeze | **LOW** |
| **Onboarding** | Sakin giriş | Gömülü; **`/onboarding` yok** | Auth | Tek hat | **HIGH** |
| **GreenRoom / Hall / Broadcast** | Canlı salon | **`/greenroom/*`**, **`/hall/*`**, **`/broadcast/*`** | Gateway | Companion’dan hikâye ayrımı | **MEDIUM** |
| **Academy / Settings** | Profil | **`/academy`**, **`/settings`** | Auth | — | **LOW** |

---

## 8. Davranışsal güven (ölçüm yönü)

| Alan | Örnek sinyal |
|------|----------------|
| Latency | İlk token, harita tepkisi |
| Reconnect | WS sonrası sessiz toparlanma |
| Voice pacing | Ses ritmi |
| Sync | Çok cihaz Timeline özü |
| Retrieval | “Unuttum” hissi vs dürüst sınır |

---

## 9. Kod köprüsü

- `apps/client/src/AppRhizoh528.jsx` — `matchPath`, `SET_PRODUCT_SURFACE`  
- `apps/gateway`  
- `apps/client/src/studio/store/`, `src/rhizoh/`  
- `apps/client/src/firebase/` — Auth + Firestore (`users`, `active_castles`, …); **birleşik event bus yok** — hedef sözleşme [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md)  
- `apps/gateway/src/firebasePersistence.js` — admin Firestore (opsiyonel persistence)  
- `docs/schemas/firebase/` — event JSON Schema pack (FER-1 sprint parça 1; şu an README)  
- `docs/FIRESTORE_RULES_INTENT_FER1_V1.md` — rules beklentisi; kök `firestore.rules` henüz epistemic koleksiyonları kapsamıyor olabilir

---

## 10. Birincil risk (artık net)

Bug değil, “eksik feature” değil, yalnız governance değil — **asıl risk:** **fazla güçlü çekirdeğin zayıf yüzeyi ezmesi** (karmaşıklık, mod, panel sızıntısı). Sistemi güçlü yapan şey artık **daha fazla komplekslik değil**, **daha fazla görünmezlik ve sadeleşme**.

---

## 11. Evrim + belgenin işi

Rhizoh’un evrimi: **çok güçlü bir epistemic engine** → **yaşanabilir bir dijital ortam**. Bu geçiş teknikten çok **ürün tasarımının en zor seviyesi**dir. Çekirdek zor kısım büyük ölçüde çözüldü; geriye kalan: onu **kaybetmeden görünmez** yapmak — nadir bir mühendislik problemi.

Bu belgeyle yapılan çerçeveleme (tek cümle): Rhizoh’u **framework** olmaktan çıkarıp **yaşanan sistem** olarak konumlandırmak.

**Ürün mührü (TCS + OWIS ekseni):** Rhizoh yalnız “yazılım” değil — **zihinsel süreklilik ile gerçeklik üretimini senkronlayan deneyim sistemi** ([TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)).

---

## 12. Teknik yön (darboğaz)

**Şu an en doğru teknik yön:** Yeni büyük spec, yeni cebir katmanı, yeni kernel yüzeyi **genişletmemek** — **Companion-first experience shell** inşa etmek; gerçek darboğaz **orası**.

**Ürün yığını:** (1) **Experience spine** — Companion, Chronicle, Observe · (2) **Cognitive layer** — [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) (zaman / bilinç, continuity) · (3) **Reality layer** — [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) (mekân / dünya, injection) · (4) **Validation** — [ESTL-1](RHIZOH_EXPERIENCE_STRESS_TEST_LAYER_ESTL1.md) (kopma vs akış) · (5) **Deep systems** — Castle, Studio, Spiral. En kritik kalite işi: **yeni yüzey yığmak değil**, geçiş + dünya enjeksiyon **hissini** mükemmelleştirmek.

---

*Implementation map — core-complete ≠ product-complete; asset çekirdek; experience coherence; surface daraltma; üç giriş kilidi; yaşanabilirlik ürün CI.*
