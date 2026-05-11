# Rhizoh — RDCL Implementation Map (V1)

**Rol:** [Production Closure Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md) içindeki **RDCL** sprintini **gerçek kablo planına** indirger: koleksiyonlar, sıra modeli, reducer sözleşmesi, UI bağlama, broadcast aşamaları, snapshot formatı ve **drift** tespiti. Bu belge **ürün UX’i değil** — runtime **wiring contract**’ıdır.

**Önkoşul:** [Event Integrity Layer](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md) baseline (capture, validation, enforcement/log, gateway hook).

**Normatif üst belgeler:** [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md) · [Implementation Map (ürün)](RHIZOH_IMPLEMENTATION_MAP.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Gerçek durum (doğrulama)

### 1.1 Var olanlar — **Event Integrity Layer**

- Event capture (append-only `rhizoh_events/.../items`)
- Schema / manifest validation (gateway + Functions)
- Enforcement (reject path + **audit log**)
- Gateway hook (FER-1 modülleri)

### 1.2 Zorunlu eksikler — **RDCL dört uzayı**

| Uzay | Soru | Bugün |
|------|------|--------|
| **ORDER** | Ne önce oldu? | Kısmen (sıra anahtarı iskeleti); **total order + tek yazar** yok |
| **STATE** | Ne oldu? (soyut) | Yok — **replay → state** yok |
| **WORLD** | Ne görünüyor? | Yok — **OWIS → UI** bağlı değil |
| **OUTBOUND** | Dünya nerede yayınlanıyor? | Yok — **broadcast execution** yok |

**Statü özeti:** epistemic OS ✔ · event OS ✔ · runtime OS ⚠ · **world OS** ❌

---

## 2. Gerçek kaynak ve hedef (kritik)

| Rol | Bugün (risk) | Hedef (RDCL) |
|-----|----------------|---------------|
| **Event log** | *de facto* tek “truth” | **Girdi** (immutable history) |
| **State** | dağınık / UI’da örtük | **Hesaplanmış doğruluk** (`reduce(events)`) |
| **World** | event’ten doğrudan sıçrama | **Projeksiyon** `world = G(state)` |

**Determinizm koşulu (normatif):**

- `state = F(eventSlice)` — aynı sıralı `eventSlice` → **bit-bit aynı** `state` (JSON canonicalize + `stateContentHash`).
- `world = G(state)` — aynı `state` → **aynı** render tree input’u (OWIS fazları + bağlı URL’ler).

Böylece: **“aynı olaylar → aynı dünya”** = `F` ve `G`’nin saf ve sıralı girdiye bağlı olması.

---

## 3. Mimari kırılma (soru kayması)

- **Önce:** “Doğru event üretiliyor mu?” → **Event correctness** (Integrity Layer ile kapanır).
- **Şimdi:** “Event’ler **aynı dünyayı** üretiyor mu?” → **World determinism** (RDCL).

**Risk (RDCL gecikirse):** event doğru kalır; **world farklılaşır** — replay bozulur, UI drift — **silent divergence**.

**RDCL anlamı:** `event correctness` → **`world correctness`** (türetilmiş).

---

## 4. ORDER SPACE — deterministik kuyruk modeli

### 4.1 Amaç

Aynı `(stream, correlationId)` için **total order**; yarışta iki projection yazarı **olmaz**.

### 4.2 Önerilen veri modeli (birincil)

Her event belgesine (create sırasında gateway veya güvenilir tek yazar):

| Alan | Tip | Açıklama |
|------|-----|----------|
| `sequence` | `int` | `(stream, correlationId)` içinde **monoton**; boşluk yok veya boşluk kuralı tek tip (ör. sadece gateway atar) |
| `orderingKey` | `string` | İdempotent worker için lex sıra yedek (ör. `padStart(16)+eventId`) |

**Kural:** Client doğrudan `sequence` yazamaz (rules: yalnızca `gateway` / `SYSTEM` veya `sequence` alanı create’te yok).

### 4.3 İşleme modeli (seçenekler — biri normatif olmalı)

| Model | Ne zaman | Not |
|--------|-----------|-----|
| **A — Gateway serial queue** | Tüm client yazıları HTTPS üzerinden | Firestore’a tek süreç yazar; sıra garantisi doğal |
| **B — Cloud Tasks / Pub-Sub** | `onCreate` sonrası projection | `correlationId` partition key; concurrency=1 |
| **C — Transactional claim** | İnce projection belgesi | `lastAppliedSequence` ile compare-and-swap |

**Kabul testi:** İki eşzamanlı event sonrası projection sırası **her koşumda** aynı; property test veya yarış harness.

**Repo hedefi:** [`eventOrderingEngineSkeleton.js`](../apps/gateway/src/fer1/eventOrderingEngineSkeleton.js) → sequence üretimi + sıralı tüketici implementasyonu.

---

## 5. STATE SPACE — replay reducer mimarisi

### 5.1 Reducer sözleşmesi (saf fonksiyon)

```text
type EventDoc = { stream, type, correlationId, sequence, ...payload }
type RhizohState = { schemaVersion, correlationId, observe: OwisState, ... }

reduce(prev: RhizohState | null, event: EventDoc): RhizohState
```

- **Yasak:** reducer içinde Firestore okuma, `Date.now()` ile **mantıksal** dallanma (audit timestamp ayrı alan olabilir).
- **Zorunlu:** `stream === 'observe'` dışındaki event’ler için net alt-reducer veya no-op.

### 5.2 Girdi dilimi

- `eventSlice = orderBy(sequence asc)` where `correlationId == X` (ve gerekiyorsa `stream in {...}`).
- Cold start: `slice` tam yüklendikten sonra tek pass `reduce`.

### 5.3 Çıktı — **state snapshot** (hesaplanmış doğruluk)

Ayrı koleksiyon önerisi (örnek isim — FER-1 ile hizalanmalı):

`rhizoh_projection_state/{correlationId}` veya mevcut `rhizoh_client_sync/{uid}` altında **canonical** alt belge.

| Alan | Açıklama |
|------|----------|
| `correlationId` | Anahtar |
| `lastAppliedSequence` | Replay checkpoint |
| `stateContentHash` | Canonical JSON hash (SHA-256) |
| `stateSchemaVersion` | Snapshot şema sürümü |
| `payload` | `RhizohState` JSON (OWIS fazları, broadcast pointer’ları) |
| `updatedAt` | Sunucu zamanı (iz; determinizm için **mantık** kullanılmaz) |

**Kabul:** Aynı `eventSlice` → aynı `stateContentHash` (golden test).

**Repo hedefi:** [`replayEngineSkeleton.js`](../apps/gateway/src/fer1/replayEngineSkeleton.js) → `reduce` + hash; Functions veya gateway worker snapshot yazar.

---

## 6. WORLD SPACE — OWIS renderer contract

### 6.1 Tek kaynak

Observe UI **yalnız** `RhizohState.observe` (veya eşdeğer alt ağaç) üzerinden render eder.

### 6.2 Renderer contract (istemci)

| Madde | Normatif |
|--------|-----------|
| **Girdi** | `observe: { owisPhase, layers, liveEmbedRef?, ... }` — OWIS-1 ile uyumlu alan seti |
| **Yasak** | “Son `observe_*` event” dokümanına doğrudan subscribe ile UI kararı |
| **Zorunlu** | `correlationId` scope: yanlış oturum state’i **asla** karışmaz |
| **Tetik** | `stateContentHash` değişince re-render (veya structural sharing) |

### 6.3 Köprü

[`owisWorldTriggerBridgeSkeleton.js`](../apps/gateway/src/fer1/owisWorldTriggerBridgeSkeleton.js) → yalnızca **event → delta**; asıl faz commit **reducer** içinde.

**Kabul:** E2E: aynı event listesi → aynı OWIS faz göstergesi (komponent testi).

---

## 7. OUTBOUND SPACE — broadcast pipeline spec

### 7.1 Aşamalar (idempotent)

1. **Intent:** `studio` / `castle` / domain event → `broadcastId` + `correlationId`
2. **Witness:** harici doğrulama (stream live, VOD id) → `witness` belgesi veya event
3. **Index:** `broadcast_index/{broadcastId}` — `embedUrl`, `status`, `lastWitnessAt`
4. **Observe bind:** `RhizohState.observe.liveEmbedRef` reducer ile index’ten doldurulur

**Idempotency key:** `(broadcastId, witnessKind, externalId)`.

**Repo hedefi:** [`broadcastWorkerSkeleton.js`](../apps/gateway/src/fer1/broadcastWorkerSkeleton.js) → gerçek yazım + retry ayrımı.

---

## 8. Drift detection layer

### 8.1 Amaç

**Silent divergence**’ı ölçülebilir hata yap.

### 8.2 Çalışma

| Adım | Açıklama |
|------|----------|
| **D1** | Arka planda (düşük öncelik) `replay(correlationId)` → `hash_replay` |
| **D2** | Canlı `rhizoh_projection_state` → `hash_live` |
| **D3** | `hash_replay !== hash_live` → `rhizoh_drift_report/{id}` veya metric + alarm |

**Tolerans:** Yalnızca `updatedAt` gibi audit alanları hash dışı bırakılır (alan listesi şemada sabitlenir).

### 8.3 Ürün kararı

Drift bulunduğunda: salt log / kullanıcıya “senkron yenile” / otomatik rebuild — blueprint’te seçilmeli.

---

## 9. DLQ / recovery (ORDER + STATE kesişimi)

- Projection exception → event `rhizoh_events_dlq/{eventId}` + orijinal `eventRef`
- **Recovery:** sequence boşluğu veya DLQ retry — tek yazar kuralı korunur

(Detay: [Blueprint §5.5](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md).)

---

## 10. Simülasyon sistemine geçiş (hedef dil)

**Önce:** event system (log merkezli).  
**RDCL sonrası:** **simulation system** — log girdi; state ve world **türetilir**; dış dünya outbound ile bağlanır.

---

## 11. Sonraki doğal kırılmalar (RDCL sonrası)

1. **World consistency under partial failure** — snapshot crash, partial replay, out-of-order recovery, broadcast lag: **[WC-PF V1](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)**.  
2. **Semantic recovery** — yanlış world sonrası kullanıcı görünürlüğü, state correction UI, replay correction UX: **[SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md)**.  
3. **Trust memory** — Chronicle rewrite yok, restore, hafıza normalize: **[TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)**.  
4. **ECR** (çatı): **[Epistemic Continuity Runtime](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)**.  
5. **AIL-1** (agency / intent / co-evolution milatı): **[Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)**.  
6. **GEJ-1** (PAG/HOGA junction · canlılık eşiği): **[Governance & Execution Junction](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)**.  
7. **EAERT** (execution equivalence): **[EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)**.  
8. **EAERT manifold topology** (partition / split-brain geometry): **[Manifold Topology V1](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md)**.  
9. **DRAS unified theorem set** (Distributed Reality Consistency **T_DRC**): **[Unified Theorem Set V1](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)**.  
10. **ECR Axiomatic System Card** (minimal indirgenemez çekirdek): **[System Card V1](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md)**.  
11. **Instantiation Fidelity Layer (IFL)** — **[IFL V1](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md)** · sonraki doğal **üçlü**: (a) **IFL Stress Harness** (gerçek trace · drift propagation · partition injection · latency chaos) · (b) **EAERT runtime validator** (node consistency enforcement) · (c) **GEJ/AIL policy execution simulator** (admission + transformation under load).  
12. **Reality Reconciliation & Healing Physics (RRHP)** — **[RRHP V1](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** (IFL sonrası: reconstruction / merge / reconciliation; **ESHRE** üst motor §11; **global determinism** garanti değil §9).  
13. **Identity under healing** — **[stub V1](RHIZOH_IDENTITY_UNDER_HEALING_CONTINUITY_V1.md)** (healing sırasında hangi versiyonun identity koruduğu · persistence / binding / temporal self-consistency).  
14. **IBT-1** — **[Identity Binding Theory](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md)** (hangi parçaların “ben” olarak kaldığı).  
15. **GCSB-1** — **[Global Composition Semantics Binding](RHIZOH_GLOBAL_COMPOSITION_SEMANTICS_BINDING_GCSB1.md)** (RRHP sonrası meaning stitching) · üst okuma: [DRAS §18.1 — DEPS / reality constraint manifold](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md).  
16. **IRE-1** — **[Identity Runtime Engine Blueprint](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md)** (deterministic identity loop hedefi).  
17. **RCIL** — **[Runtime Contracts Implementation Layer](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md)** (tek açık mühendislik ekseni; [DRAS §18.11](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).  
18. **RDVH** — **[Runtime Determinism Validation Harness](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md)** (RCIL / IRE-1 determinizm kanıt yükü; [RCIL §6](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md)).  
19. **PoCL** — **[Proof-of-Consistency Layer](RHIZOH_PROOF_OF_CONSISTENCY_LAYER_POCL_V1.md)** (RDVH trace → formal tutarlılık; [DRAS §18.12](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).  
20. **FCTS** — **[Full Consistency Theorem System](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md)** (PoCL üstü T1–T5 indeks; [DRAS §18.13](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).  
21. **MCF-1** — **[Meta-Consistency Framework](RHIZOH_META_CONSISTENCY_FRAMEWORK_MCF1_V1.md)** (FCTS + DRAS meta-stabilite; [DRAS §18.14](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).  
22. **RCIL Live Wiring Sprint** — **[operational instantiation](RHIZOH_RCIL_LIVE_WIRING_SPRINT_V1.md)** (Firebase/Genesis → RCIL · IRE · RDVH prod · IBT shard; [DRAS §18.15](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).

---

## 12. İlişkili belgeler

- [FER-1 Production Closure Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md)  
- [FER-1 Runtime Closure Patch](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md)  
- [Observe World Injection OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)  
- [World consistency under partial failure (WC-PF)](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)  
- [Semantic Recovery SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md)  
- [Trust Memory Consistency TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)  
- [Epistemic Continuity Runtime (ECR)](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)  
- [ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)  
- [AIL-1 — Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)  
- [GEJ-1 — AIL-1 Governance & Execution Junction](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)  
- [EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)  
- [EAERT — Reality Manifold Topology V1](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md)  
- [DRAS — Unified Reality Theorem Set V1](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)  
- [ECR Axiomatic System Card V1](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md)  
- [Instantiation Fidelity Layer (IFL) V1](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md)  
- [Reality Reconciliation & Healing Physics (RRHP) V1](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)  
- [Identity under healing — continuity stub V1](RHIZOH_IDENTITY_UNDER_HEALING_CONTINUITY_V1.md)  
- [Identity Binding Theory (IBT-1)](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md)  
- [Global Composition Semantics Binding (GCSB-1)](RHIZOH_GLOBAL_COMPOSITION_SEMANTICS_BINDING_GCSB1.md)  
- [Identity Runtime Engine (IRE-1) Blueprint V1](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md)  
- [Runtime Contracts Implementation Layer (RCIL) V1](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md) · [DRAS §18.11](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)  
- [Runtime Determinism Validation Harness (RDVH) V1](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md)  
- [Proof-of-Consistency Layer (PoCL) V1](RHIZOH_PROOF_OF_CONSISTENCY_LAYER_POCL_V1.md)  
- [Full Consistency Theorem System (FCTS) V1](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md)  
- [Meta-Consistency Framework (MCF-1) V1](RHIZOH_META_CONSISTENCY_FRAMEWORK_MCF1_V1.md)  
- [RCIL Live Wiring Sprint V1](RHIZOH_RCIL_LIVE_WIRING_SPRINT_V1.md)  

---

*RDCL Implementation Map V1 — ORDER · STATE · WORLD · OUTBOUND wiring.*
