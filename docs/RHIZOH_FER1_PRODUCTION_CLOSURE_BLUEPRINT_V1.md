# Rhizoh — FER-1 Production Closure Blueprint (V1)

**Rol:** [Runtime Closure Patch](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md) sonrası **son kablolama planı** — sistemi “event enforcement” seviyesinden **deterministik, dünya üreten runtime OS**’e taşıyan sprint tanımı. Bu belge **yeni kavram üretmez**; eşikleri ve kabul kriterlerini **final wiring** olarak sabitler.

**Önkoşul:** Closure patch baseline (validator + trigger + reject log + ordering/OWIS/replay **iskelet**).

**Normatif üst belgeler:** [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Doğruluk snapshot (özet)

| Aşama | Durum |
|--------|--------|
| **Event capture** | Var (Firestore append + rules) |
| **Event validation** | Var (gateway manifest + Functions doğrulama + reject **log**) |
| **Event interpretation** | Eksik (projection / tek reducer yok) |
| **World generation** | Eksik (OWIS → UI / dış dünya bağlı değil) |

**Ürün cümlesi:** Rhizoh artık **yanlış olayı üretmeyi** aktif biçimde sınırlıyor; henüz **doğru olaydan tek deterministik dünya** üretmiyor.

**Yol ayrımı:** (A) daha fazla spec → teorik mükemmellik · **(B) closure completion** → canlı dünya — bu blueprint **(B)**.

---

## 2. Üç katman (çalışan mimari özeti)

| Katman | İçerik | Olgunluk (hedef dil) |
|--------|--------|----------------------|
| **1 — Epistemic** | TCS / OWIS / ESTL ürün ve anlam katmanı | Tamam (belge + ürün dili) |
| **2 — Contract** | FER-1, şema manifesti, rules, closure patch | Çok güçlü |
| **3 — Runtime** | Validator, trigger, sıra motoru, replay, OWIS projection, broadcast, DLQ | **Başladı** — determinizm eksik |

---

## 3. Firebase rolü (güncel)

**Önce:** veritabanı.  
**Şimdi:** **temporal event substrate** (yarı-sistem) — zaman taşıyıcı + enforcement girişi; **tek gerçek dünya çıktısı** için üstteki runtime katmanı şart.

---

## 4. Merkez boşluk: determinizm

Aşağıdakiler **feature değil**; production öncesi **kapanması gereken çekirdek**:

| # | Boşluk | Bugün | Kapanış |
|---|--------|--------|---------|
| **1** | **Ordering kesinliği** | Sadece iskelet sıra anahtarı | Stream başına **monoton sequence** veya gateway **serial queue** + projection **tek yazar** |
| **2** | **Replay determinism** | Tetik listesi stub’ı | Aynı `correlationId` + event alt kümesi → **aynı materialize edilmiş state** (hash veya golden test) |
| **3** | **OWIS projection** | Bridge pasif, UI bağlı değil | `observe_*` → **tek reducer** → Observe surface subscription ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)) |
| **4** | **Broadcast execution** | Dış çıkış yok | `broadcast_index` + witness + embed / live path — idempotent worker |
| **5** | **DLQ / recovery** | Sadece log | Geçersiz veya çift işlenen event için **dead-letter** + yeniden oynatma politikası |

---

## 5. Sprint: Runtime Deterministic Closure Layer (RDCL)

**Hedef:** “Olayları biliyor ama dünyayı üretmiyor” → **tek nedensel dünya + izlenebilir replay**.

### 5.1 Ordering (queue + transaction)

- **Teslim:** Her `(stream, correlationId)` için total order; projection yazımı **çakışmasız** (transaction veya tek işçi kuyruğu).
- **Kabul:** Eşzamanlı iki create sonrası projection sırası **her zaman** aynı kurala uyar; yarış testi yeşil.

### 5.2 Replay + state rebuild

- **Teslim:** Zaman çizelgesi (veya `items` query + sequence) → **reduce** → `rhizoh_client_sync` veya ayrı `rhizoh_projection_*` belgesi.
- **Kabul:** Cold start’ta replay → UI’nin gördüğü OWIS fazı ile canlı akışta **aynı** (tolerans: yalnızca wall-clock).

### 5.3 OWIS projection (UI binding)

- **Teslim:** Client’ta `correlationId` scoped **tek** world state; `mapObserveEventToOwis` benzeri mantık **gerçek reducer** içinde.
- **Kabul:** Observe ekranı yalnız bu state’ten render; doğrudan “son event” hack’i yok.

### 5.4 Broadcast execution (externalization)

- **Teslim:** Domain event / witness → `broadcast_index` → Observe embed katmanı (YouTube / live URL sözleşmesi).
- **Kabul:** Aynı `broadcastId` için çift yazım idempotent; dış API hatası **retry + poison** ayrımı.

### 5.5 DLQ / recovery pipeline

- **Teslim:** Validation sonrası veya projection hatasında `rhizoh_events_dlq` (veya eşdeğer) + admin/otomatik retry kuralı.
- **Kabul:** “Sessiz kayıp” yok; her başarısızlık izlenebilir.

---

## 6. Mimari tek cümle (hedef öncesi / sonrası)

| | |
|--|--|
| **Bugün** | Rhizoh bir **event enforcement system**; henüz **reality generation system** değil. |
| **RDCL sonrası** | Rhizoh **deterministik event yorumlayan** ve **Observe + broadcast dünyasını** üreten kısmi OS. |

---

## 7. Repo karşılığı (mevcut → hedef)

| Bileşen | Bugün | RDCL hedefi |
|---------|--------|--------------|
| Ordering | [`eventOrderingEngineSkeleton.js`](../apps/gateway/src/fer1/eventOrderingEngineSkeleton.js) | Sequence + projection worker |
| Replay | [`replayEngineSkeleton.js`](../apps/gateway/src/fer1/replayEngineSkeleton.js) | State rebuild + test harness |
| OWIS | [`owisWorldTriggerBridgeSkeleton.js`](../apps/gateway/src/fer1/owisWorldTriggerBridgeSkeleton.js) | Client reducer + Observe bağlama |
| Broadcast | [`broadcastWorkerSkeleton.js`](../apps/gateway/src/fer1/broadcastWorkerSkeleton.js) | Gerçek index + dış API |
| Enforcement | [`functions/index.js`](../functions/index.js) + validate | + DLQ / delete policy (ürün kararı) |

---

## 8. İlişkili belgeler

- [FER-1 Runtime Closure Patch](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md)  
- [FER-1 Minimal Production Stack](RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md)  
- [Firestore Rules intent](FIRESTORE_RULES_INTENT_FER1_V1.md)  
- **[RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)** (kuyruk modeli, reducer, OWIS renderer contract, broadcast aşamaları, snapshot, drift)  
- **[WC-PF — World consistency under partial failure](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)** (RDCL sonrası: snapshot crash, partial replay, out-of-order recovery, broadcast lag)  
- **[SR-1 — Semantic recovery](RHIZOH_SEMANTIC_RECOVERY_V1.md)** (WC-PF sonrası: kullanıcı görünürlüğü, correction UI, replay UX)  
- **[TMC-1 — Trust memory](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)** · **[ECR — Epistemic Continuity Runtime](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)** · **[ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)** · **[AIL-1 — Agency & Intent](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)** · **[GEJ-1 — PAG/HOGA junction](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** · **[EAERT](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)**

---

*Production Closure Blueprint V1 — spec → validator → event → **deterministik** runtime davranışı.*
