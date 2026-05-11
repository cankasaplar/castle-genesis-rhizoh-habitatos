# Rhizoh — FER-1 Runtime Closure Patch (V1)

**Rol:** Yeni spec değil — **runtime closure**: Firebase’i yalnız **database + event log** olmaktan çıkarıp **state-producing runtime**’a yaklaştıran zorunlu kablolar. Aşağıdaki dört başlık **opsiyonel değildir**; production öncesi kapatılmalıdır.

**Önkoşul:** [Minimal Production Stack](RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md) (rules + şema dosyaları + iskeletler).

**Normatif üst belgeler:** [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Gerçek production eksik listesi (zorunlu)

| # | Bileşen | Ne eksik | Kabul kriteri |
|---|---------|-----------|----------------|
| **1** | **Gateway validation** | Runtime’da şema / payload / sürüm doğrulaması yok | `schemaVersion` uyuşmazlığı **reject**; manifest dışı `type` **reject**; payload JSON Schema ile **reject** |
| **2** | **Event ordering engine** | `correlationId` ile **nedensel sıra** ve **replay determinizm** yok | Aynı stream + correlation için sıralı projection; replay aynı girdi → aynı OWIS tetik özeti |
| **3** | **OWIS injection bridge** | `event → world state` eşlemesi ve **Observe render tetikleyicisi** yok | `observe_*` event’i → client veya gateway’de tek W-faz commit + UI subscription |
| **4** | **Broadcast pipeline completion** | YouTube / live / **index** katmanı yok | `broadcast_index` doldurulur; embed URL Observe’e **tek katman**; canlı worker idempotent |

---

## 2. Mimari gerçek (teknik)

**Şu an Firebase:** **database + event log** — zaman taşıyıcı katman **başladı** (rules + append) fakat **state üreten runtime** değil.

**Dönüşüm:** “Rhizoh düşünce sistemi” → **Rhizoh event-driven operating system (partial)** — closure patch tamamlanınca **partial** sıfatı kalkar.

**Ürün dili:** “Bilinç modeli üretildi; henüz **dünya üretmiyor**” → OWIS bridge + Observe tetikleyici bu cümleyi kapatır.

---

## 3. İlerleme (hedef oran — ekip hissi, ölçüm değil)

| | Yaklaşık |
|---|----------|
| **SPEC** | ~%90 |
| **SKELETON (repo iskeleti)** | ~%60 |
| **PRODUCTION (closure öncesi)** | ~%20–30 |

Closure patch, **production** satırını yükseltmek için yazılmıştır.

---

## 4. Runtime closure — dört kablo (patch içeriği)

### 4.1 Schema validation worker (gateway +/veya Functions)

- **Gateway:** [`apps/gateway/src/fer1/validateRhizohEvent.js`](../apps/gateway/src/fer1/validateRhizohEvent.js) — manifest + envelope + temel payload kontrolü.  
- **Functions:** İsteğe bağlı aynı mantığın kopyası veya paylaşılan paket; `onCreate` öncesi **reject** (invalid → sil veya dead-letter koleksiyonu — ürün kararı).

### 4.2 Event ordering + replay engine

- [`apps/gateway/src/fer1/eventOrderingEngineSkeleton.js`](../apps/gateway/src/fer1/eventOrderingEngineSkeleton.js) — sıralama anahtarı, karşılaştırıcı, replay giriş noktası.  
- **Determinizm:** projection yazımı tek iş parçacığı / transaction veya gateway serial queue.

### 4.3 OWIS world trigger bridge

- [`apps/gateway/src/fer1/owisWorldTriggerBridgeSkeleton.js`](../apps/gateway/src/fer1/owisWorldTriggerBridgeSkeleton.js) — `observe_*` → `W0…W3+` + “render tetik” bayrağı.  
- İstemci: Firestore `onSnapshot` veya aynı correlation ile **tek** state reducer ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)).

### 4.4 Broadcast completion + replay skeleton

- [`apps/gateway/src/fer1/broadcastWorkerSkeleton.js`](../apps/gateway/src/fer1/broadcastWorkerSkeleton.js) — index + witness tamamlama (genişletilecek).  
- [`apps/gateway/src/fer1/replayEngineSkeleton.js`](../apps/gateway/src/fer1/replayEngineSkeleton.js) — zaman çizelgesinden OWIS/broadcast yeniden oynatma.

---

## 5. Cloud Functions (validator)

[`functions/index.js`](../functions/index.js) — trigger giriş noktası; [`functions/validateRhizohEvent.js`](../functions/validateRhizohEvent.js) manifest’i önce **`functions/schemas/rhizoh_event_types.json`** (deploy ile gider), yoksa monorepo içi `docs/schemas/...` yolundan okur. Üretimde gateway ile **tek SoT** için manifest değişimlerinde iki yolu senkron tutun veya paylaşılan paket kullanın (çift drift yasak).

---

## 6. Sonraki sıra (kapatma)

1. Gateway’de HTTP veya iç pipeline’da her yazımdan önce **validate** çağrısı.  
2. **Ordering** koleksiyonu veya monoton `sequence` alanı + projection worker.  
3. **OWIS bridge** + client subscription.  
4. **broadcast_index** + dış API.  
5. **Replay** dry-run testi (determinizm).

---

## 7. İlişkili belgeler

- [FER-1 Minimal Production Stack](RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md)  
- [Firestore Rules intent](FIRESTORE_RULES_INTENT_FER1_V1.md)  
- **[Sonraki sprint planı — Production Closure Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md)** (deterministik ordering, replay/state rebuild, OWIS UI projection, broadcast execution, DLQ)  
- **[RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)** (ORDER / STATE / WORLD / OUTBOUND kabloları, snapshot, drift)  
- **[WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)** (RDCL sonrası: kısmi arıza altında world consistency)  
- **[SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md)** (WC-PF sonrası: semantic recovery / correction UX)  
- **[TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)** · **[ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)** (çatı: Epistemic Continuity Runtime) · **[ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)** · **[AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)** (agency / intent) · **[GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** (PAG/HOGA) · **[EAERT](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)**

---

*FER-1 Runtime Closure Patch V1 — state-producing runtime; dünya üretimi.*
