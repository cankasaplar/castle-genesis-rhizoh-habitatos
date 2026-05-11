# Global Consistency Reconciliation (GCR-1)

**Durum:** **Execution model (spec)** tanımlı; **tam motor** `PLANNED`. Salt okunur tarama: `scripts/gcrReconcileReport.mjs`.  
**Sürüm:** GCR-1  
**İlişkili:** [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) · [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) · [`GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) · [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) (temporal bacak → `Bind`) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · `apps/client/src/kernel/orchestrator/runConstitutionalEpoch.js` (`hashChainedEpoch`)

---

## 1. Amaç ve sınır

GCR, **birden fazla CRA zinciri**, **epoch hattı** ve **habitat / repo snapshot** arasında **global tutarlılık** sorularını **deterministik** biçimde yanıtlar.

| GCR yapar | GCR yapmaz |
|-----------|------------|
| Çakışma **tespiti**, birleşim **stratejisi** (rapor) | ECG’ye **otomatik yazım** |
| Epoch **merge planı** (öneri) | CIL **overwrite** |
| Yakınsama **tanığı** (aynı snapshot → aynı sonuç) | Sessiz telafi veya sıra patch’i ([`CLFB-1`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md)) |

**ETSS:** Reasoning yüzeyi (ECG) execution feedback ile **kirletilmez**; GCR çıktısı **TAL + rapor + gerekirse yeni CIL-AMENDMENT** ile bağlanır.

---

## 2. GCR execution model (runtime semantics)

### 2.1 Girdiler

| Girdi | Açıklama |
|--------|-----------|
| **CRA manifest** | Birden fazla CRA JSON (veya repo path listesi) — kimlik + state |
| **Commit snapshot** | `git rev-parse HEAD` veya eşdeğer — `orderRepairsDeterministic` ve doğrulayıcılar için |
| **Epoch header set** | İsteğe bağlı: `previousEpochHash`, `mergeAncestry`, `lineageBranchId` (constitutional hattı) |
| **Lineage scope** | `habitatId` / `registryRoot` (çok ortam) — dokümante pointer |

### 2.2 Çıktılar

| Çıktı | Açıklama |
|--------|-----------|
| **ReconcileReport** | `ok`, `gcrVersion`, `findings[]` (`code`, `severity`, `detail`) |
| **MergePlan** (öneri) | Epoch birleşim sırası veya “insan hakem” bayrağı |
| **Compensation closure** | Global `Compensation-of` grafi kapalı mı, döngü var mı |

### 2.3 Faz sırası (deterministik)

1. **Ingest** — CRA’ları canonical sıraya göre oku (`ceeArtifactId` lex, sonra `priorCraAnchor`).  
2. **Identity check** — aynı `amendmentId` iki CRA’da farklı `compensationOf` / `priorCraAnchor` → çatışma.  
3. **Target contention** — `targetsRemaining` kesişimi + uyumsuz `inject` / `failureContext` hedefi.  
4. **Lineage graph** — tüm `compensationOf` + `priorCraAnchor` kenarları → döngü / eksik kök.  
5. **Epoch alignment** — §4.  
6. **Convergence witness** — §5.  
7. **Emit report** — stdout JSON; yan etki yok.

---

## 3. Multi-CRA conflict resolution engine

| Çatışma sınıfı | Tespit | Çözüm stratejisi (rapor) |
|----------------|--------|---------------------------|
| **IDENTITY_FORK** | Aynı `amendmentId`, farklı immutable üçlü | `GCR_IDENTITY_FORK` — tek hakem amendment ([`CEE-1`](COMPENSATION_EXECUTION_ENGINE_V1.md)) |
| **TARGET_OVERLAP** | Kesişen `targetsRemaining`, farklı telafi mantığı | `GCR_TARGET_CONTENTION_GLOBAL` — birleşik CRA veya sıralı uygulama |
| **INJECT_DIVERGENCE** | Aynı hedef, `inject.aeePhases` uyumsuz | `GCR_INJECT_DIVERGENCE` — CIL ile faz listesi sabitleme |
| **STALE_PRIOR** | `priorCraAnchor` bilinmeyen commit | `GCR_STALE_PRIOR_CRA` — yeniden mühür / TAL |

**Politika sırası (öneri):** (1) Deterministik otomatik çözüm yoksa **fail-fast**; (2) **Steward merge**; (3) **yeni GCR-MERGE amendment** sınıfı (gelecek CAECL).

Salt okunur tarama: `npm run epistemic:gcr-reconcile -- --file scripts/fixtures/gcr-multi-cra-bundle.json` (çatışma örneği, exit 1) · `…/gcr-clean-bundle.json` (exit 0).

---

## 4. Epoch merge strategy

Constitutional epoch kimliği [`hashChainedEpoch`](../apps/client/src/kernel/orchestrator/runConstitutionalEpoch.js) ile:

`canonical = JSON.stringify({ parent, branch, merge, atom, mut, drift })` → hash.

| Strateji | Ne zaman |
|----------|-----------|
| **LINEAR_MERGE** | `mergeAncestry` boş; tek ebeveyn zinciri |
| **EXPLICIT_MERGE** | `mergeAncestry` dolu; ebeveyn hash’leri **sabit sırada** kanonik JSON’da |
| **DRIFT_GATE** | `identityDriftVector` eşik dışı → merge **yasak** raporu (operasyonel) |

**GCR rolü:** İki habitat’tan gelen epoch bildirimlerinin **aynı parent + merge + atom** anlamında uyumlu olup olmadığını kontrol etmek; uyumsuzluk → `GCR_EPOCH_DIVERGENCE`.

**Not:** Gerçek hash üretimi runtime’da; GCR **beyan edilen** header’ları karşılaştırır (witness).

---

## 5. Distributed causal convergence algorithm

**Tanım (epistemik):** Yakınsama, **nedensel** değil **müzakereli** — aynı **commitSnapshot** üzerinde:

1. `orderRepairsDeterministic(RepairItem[])` aynı girdi → aynı sıra ([`CESE-1` §6](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md)).  
2. `validateCilAmendment --json` (ve eşdeğer hook’lar) aynı çıktı.  
3. CRA seti için GCR **findings** listesi boş veya eşdeğer.

**Algoritma (yüksek seviye):**

```
witnesses = []
for each node in participation_set:
  run deterministic_bundle(snapshot)
  witnesses.append(hash(canonical_json(result)))
converged = (unique(witnesses).size == 1)
```

**Dağıtık:** Katılımcılar yalnız **witness** üretir; birleştirme **merkezi rapor** veya çoğunluk **yok** — *tek doğru* `commitSnapshot` + deterministik araçlar varsayımı ([`CLFB-1`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) ile uyumlu).

---

## 6. Cross-lineage compensation rules

**Lineage:** Farklı `priorCraAnchor` kökleri veya farklı habitat’lerden gelen CRA zincirleri.

| Kural | Açıklama |
|--------|-----------|
| **BRIDGE_AMENDMENT** | Çapraz telafi yalnız **yeni** `CIL-AMENDMENT` ile; iki zincire `Prior-anchor` pointer |
| **NO_CROSS_PATCH** | A zincirindeki CRA, B zincirinin kimlik alanını **güncelleyemez** |
| **MERGE_NODE** | İsteğe bağlı üçüncü CRA düğümü: `compensationOf` birden fazla id’ye işaret **etmez** — bunun yerine birleşik **merge amendment** metni (insan) |
| **ORDER_EXPORT** | Global sıra = `orderRepairsDeterministic` tüm RepairItem birleşiminde; çapraz kenarlar CESE döngü kuralına tabi |

Çatışma: `GCR_CROSS_LINEAGE_UNRESOLVED`.

---

## 7. Reason codes (GCR)

| Kod | Anlam |
|-----|--------|
| `GCR_IDENTITY_FORK` | Aynı amendmentId, farklı immutable kimlik |
| `GCR_TARGET_CONTENTION_GLOBAL` | Global hedef çakışması |
| `GCR_INJECT_DIVERGENCE` | Faz listesi uyumsuzluğu |
| `GCR_STALE_PRIOR_CRA` | priorCraAnchor çözülemedi |
| `GCR_GLOBAL_COMP_CYCLE` | Çoklu CRA compensation döngüsü |
| `GCR_EPOCH_DIVERGENCE` | Epoch header tutarsızlığı |
| `GCR_CONVERGENCE_FAIL` | Witness hash’leri aynı değil |
| `GCR_CROSS_LINEAGE_UNRESOLVED` | Çapraz soy çözülmedi |

---

## 8. İlişki CLFB / CESE

- CLFB tek düğüm **feedback**; GCR çok düğüm **uyumu**.  
- CESE sıra fonksiyonu GCR **convergence** kontrolünde **alt modül** olarak kullanılır.

---

## 9. Mutation policy

GCR-1 belge güncellemeleri **append-only**. Üretim motoru ayrı sürüm (`GCR-2`) ile genişler.

---

*GCR-1 — Multi-CRA reconciliation + epoch merge + distributed convergence witness + cross-lineage rules.*
