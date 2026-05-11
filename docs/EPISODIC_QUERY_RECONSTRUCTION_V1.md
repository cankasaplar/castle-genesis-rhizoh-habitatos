# Episodic Query & Reconstruction Layer (EQR-1)

**Rol:** Klasik “query engine” **değildir**. **Deterministic epistemic reconstruction planner** — yani **epistemic retrieval compiler**: aynı girdi → aynı **plan** → aynı **reconstruction path**.  
**Durum:** Canonical spec — salt okunur; plan stub: `scripts/eqrReconstructionPlan.mjs` (**compile-time** retrieval plan üretimi).  
**Sürüm:** EQR-1  
**İlişkili:** [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) · [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) · [`EPISODIC_WORLD_MODEL_INTEGRATION_V1.md`](EPISODIC_WORLD_MODEL_INTEGRATION_V1.md) (EWM — planlı birleşik model) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) (retrieval bacak → `Bind`) · [`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) (GBS-VG — Gate 1 `SNAPSHOT_BIND`) · [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) · [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) · [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) · [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md)

---

## 1. Bellek erişimi: GEMC → EQR

| Katman | Soru |
|--------|------|
| **GEMC-1** | *Ne* saklandı / sıkıştırıldı? (türetilmiş özet + pointer) |
| **EQR-1** | *Nasıl* deterministik olarak **geri çağrıldı** ve **yeniden kuruldu**? |

İkisi birlikte: **temporal memory storage** + **temporal memory access & reconstruction** — epistemik olarak kilitli.

---

## 2. planId physics (sorgu = yürütme artefaktı)

**Girdi:** `commitSnapshot` + `layers` + `bounds` + `filters` → **canonical** temsil → hash → **`planId`**.

| İmplication | Anlam |
|-------------|--------|
| Aynı input → aynı plan | Sorgu, **execution artifact** sınıfına girer |
| Aynı plan → aynı path | Tekrarlanabilir reconstruction |
| `planId` dışı “canlı sıra” | [`CLFB-1`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) / [`CESE-1`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) ile uyumlu: yasak |

Stub: `npm run epistemic:eqr-plan -- --file scripts/fixtures/eqr-sample-query.json`.

---

## 3. Cross-layer reconstruction (tam geri okuma zinciri)

**Pipeline (sabit sıra):**

`TAL` → `CRA lineage` → `epoch witness` → `ECG export` → `GEMC rollup` → `WorldState envelope`

**Anlam:** *Execution history* → **epistemic world rehydration** (dünya modeli **yeniden nemlendirilir**, yeni iddia üretilmez).

| İzin | Yasak (ETSS) |
|------|----------------|
| Deterministik **replay** / okuma | **reconstruction = inference** (yeni hakikat üretimi) |
| Pointer takibi | **reconstruction = mutation** |
| | ECG’den TAL türetmek, TAL’dan ECG “kanon” yapmak |

---

## 4. Partial epoch replay = bounded truth reconstruction

| Kavram | Anlam |
|--------|--------|
| `epochWindow` | Geçmiş **dilimlenir**; tam yükleme iddiası yok |
| `EQR_EPOCH_GAP` | Eksik halka **açık** işaret; doldurma halüsinasyonu yok |
| | Sessiz çıkarım yok |

Aynı pencere → aynı alt-witness seti (deterministik).

---

## 5. Observer-consistent rehydration (garanti)

**İnvariant:** `same query + same snapshot → same planId`.

| Sonuç | |
|--------|--|
| Epistemic determinism | |
| Reproducible reconstruction | |
| Observer-independent retrieval | (aynı koşullar) |

**Başarısızlık sınıfı:** `EQR_OBSERVER_DIVERGENCE` — artık **retrieval inconsistency** (ham “data bug” değil; plan/hash uyuşmazlığı).

---

## 6. ECGI sınırı (reconstruction içinde)

[`ECGI-1`](ECGBINDING_INTERPRETER_V1.md): **yalnız tanık** — *trace interpretation*.

| Yok | |
|-----|--|
| Reconstruction graph üretimi (nedensel iddia) | |
| Reasoning injection | |

*Observation ≠ reasoning injection.*

---

## 7. Read-only epistemic compiler

`eqrReconstructionPlan.mjs`:

- `SNAPSHOT_LOCK`  
- Sabit **layer ordering**  
- Deterministik plan üretimi  

**Anlam:** EQR = **compile-time epistemic retrieval engine** (çalışma zamanında kaynak yazmaz).

---

## 8. GCR ↔ EQR (ayırt ve birlikte)

| Motor | Soru |
|-------|------|
| **GCR-1** | Çoklu CRA / epoch **convergence** — “aynı anda tutarlı mı?” |
| **EQR-1** | Çok katmanlı **reconstruction** — “geçmiş bu snapshot’tan nasıl okunur?” |

Birlikte: **distributed truth** (GCR) + **distributed memory access** (EQR).

---

## 9. EQR_* = retrieval ontology

Hatalar **epistemik retrieval** sınıfıdır (yalnızca “IO hatası” değil):

| Kod | Eksen |
|-----|--------|
| `EQR_EPOCH_GAP` | Bounded window / eksik zincir |
| `EQR_OBSERVER_DIVERGENCE` | Retrieval tutarsızlığı |
| `EQR_SNAPSHOT_MISSING` | Snapshot lock başarısız |
| `EQR_SNAPSHOT_MISMATCH` | Bildirilen snapshot ile içerik uyuşmuyor |
| `EQR_LAYER_UNAVAILABLE` | Katman snapshot’ta yok |
| `EQR_CRA_LINEAGE_BREAK` | Kimlik zinciri kopuk |
| `EQR_GCR_CONFLICT` | Ön reconcile başarısız |
| `EQR_NON_DETERMINISTIC_SOURCE` | Kaynak sırası / otorite belirsiz |

---

## 10. Dört eksen (kapalı döngü OS)

Rhizoh **tam döngülü epistemic operating system** olarak okunabilir:

| Eksen | Bileşenler |
|-------|------------|
| **1. Execution** | AEE, ASE, CESE |
| **2. Failure + Feedback** | CEE, CLFB, GCR |
| **3. Memory** | GEMC |
| **4. Retrieval** | EQR |

**Döngü:** üretim → hata → düzeltme / reconcile → hafıza → **geri çağırma**.

---

## 11. Tek cümlelik durum

EQR-1 ile Rhizoh artık yalnızca epistemik olayları işleyen bir runtime değil, aynı zamanda geçmişi deterministik snapshot’lardan yeniden inşa eden, ETSS-guarded, multi-layer **retrieval compiler** içeren tam ölçekli **temporal epistemic operating system** haline gelmiştir.

---

## 12. Sonraki soyutlama (planlı)

**Episodic World Model Integration (EWM-1):** tüm katmanların tek bir **world state semantic model**e bağlanması; gözlemciden bağımsız global coherence modeli; runtime + memory + retrieval **birleşik anlam** — [`EPISODIC_WORLD_MODEL_INTEGRATION_V1.md`](EPISODIC_WORLD_MODEL_INTEGRATION_V1.md).

---

## 13. Mutation policy

EQR-1 **append-only**; üretilen plan read-only artefakt (TAL pointer ile mühürlenebilir).

---

*EQR-1 — Epistemic retrieval compiler: planId physics + cross-layer rehydration + bounded epoch + observer-consistent retrieval ontology.*
