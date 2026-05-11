# Global Episodic Memory Consolidation (GEMC-1)

**Durum:** Canonical spec — **türetilmiş bellek** sıkıştırma ve **görünüm** minimizasyonu; **kanonik kaynaklara** dokunmaz. Salt okunur manifest stub: `scripts/gemcConsolidationManifest.mjs`.  
**Sürüm:** GEMC-1  
**İlişkili:** [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) (rollup → `Bind` anchor) · [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) · [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) · [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md)

---

## 1. Amaç ve sınır (ETSS uyumu)

**Episodic memory** burada: TAL satırları, CRA düğümleri, epoch zincirleri, mühürlü özetler ve (export edilmiş) ECG alt grafikleri.

| GEMC yapar | GEMC asla yapmaz |
|------------|-------------------|
| **Türetilmiş sıkıştırma** — yeni mühürlü özet artefakt | Kanonik TAL / CRA / ECG **silme** veya **overwrite** |
| **Görünüm** ve **katmanlı arşiv** (hot → warm → cold pointer) | [`CLFB-1`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) **immutable identity** ihlali |
| **Pruning** yalnız **türetilmiş projeksiyon** üzerinde | “Gerçek” nedensel grafı sessizce kısaltma |

**Özet ilke:** *Sıkıştırma = yeni belge + pointer zinciri; kaynak = append-only kalır.*

---

## 2. Cross-epoch semantic compression

**Tanım:** Birden fazla constitutional / operasyonel **epoch** (veya eşdeğer mühür hattı) tek bir **anlamsal özet** düğümünde birleştirilir — **kayıp** yalnızca *tekrar eden* veya *politika ile düşük değer* sayılan içerik için; **kayıp kanıt** yok (orijinallere hash pointer zorunlu).

| Bileşen | Açıklama |
|---------|-----------|
| **Rollup manifest** | Kapsanan epoch / commit / CRA id listesi + her biri için `contentHash` veya `priorAnchor` |
| **Semantic core** | İnsan veya onaylı model üretimi özet metni — **canonical değil**; kanıt = pointer listesi |
| **CIL bağ** | Yeni consolidation, **CIL-AMENDMENT** veya ileride `GEMC-ROLLUP` artefakt ailesi ile tanımlanır |

**GCR hizası:** Rollup öncesi [`GCR-1`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) ile çoklu kaynak uyumu doğrulanabilir.

---

## 3. Long-range lineage pruning

**“Pruning”** yalnızca:

1. **Türetilmiş indeks** — örn. “son N epoch için sadece kök + uç” görünümü; tam graf diskte/arşivde.  
2. **Eşik politikası** — `GEMC_PRUNE_POLICY` (CIL’de); derinlik, yaş, SPECFLOW sınıfı.  
3. **CRA lineage** — [`CLFB-1`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md): eski CRA **düğümleri silinmez**; rollup **yeni düğüm** olarak “bu aralığı temsil eder” der.

**Yasak:** `priorCraAnchor` zincirini geriye doğru **kesip** geçmişi yok etmek.

---

## 4. Epistemic graph minimization

**ECG** için minimizasyon = **projection / fold** (ör. [`projectionReducer.ts`](../apps/client/src/studio/runtime/projectionReducer.ts)):

| Tür | Anlam |
|-----|--------|
| **Subgraph export** | Belirli `causalNodeId` aralığı dışa aktarılır — kaynak graf değişmez |
| **Equivalence class collapse** | *Yalnız türetilmiş raporda* aynı semantik etkiye sahip düğümler tek kutuda — orijinal id listesi manifestte |
| **Storage tier** | Sık erişim altgraf vs tam export — pointer aynı |

**ECGI:** Minimize edilmiş görünüm `ecgBinding` ile **tanık** bağlanır; nedensellik iddiası üretmez ([`ECGI-1`](ECGBINDING_INTERPRETER_V1.md)).

---

## 5. Historical coherence optimization

**Hedef:** Sıkıştırılmış bellek, genişletildiğinde veya hash doğrulandığında **orijinallerle çelişmez**.

| Kontrol | Açıklama |
|---------|-----------|
| **Re-expand** | Manifest → kaynak listesi → yeniden yükleme → aynı kanonik serialize |
| **Merkle / seal** | Rollup kökü, yaprak hash’lerinin fonksiyonu (politika dosyasında tanım) |
| **Drift** | `GEMC_COHERENCE_DRIFT` — özet ile kaynak uyuşmuyor |

**Optimizasyon:** Okuma maliyetini düşürmek için **önbellek** ve **indeks** — önbellek **asla** tek doğruluk kaynağı değildir (ETSS: execution vs reasoning ayrımı).

---

## 6. Execution model (yüksek seviye)

1. **Select** — consolidation penceresi (epoch aralığı, CRA alt grafi).  
2. **Verify** — GCR + AEE doğrulayıcıları yeşil (kaynak tutarlı).  
3. **Compress** — özet + manifest üret (deterministik şablon).  
4. **Seal** — imza / hash ([`ADR_BOOTSTRAP_AUTHORITY_V1.md`](architecture/ADR_BOOTSTRAP_AUTHORITY_V1.md) çizgisi).  
5. **Propagate** — TAL satırı + pointer; ECG’ye **otomatik yazım yok**.  
6. **Archive** — isteğe bağlı katman (operasyon).

Stub CLI: `npm run epistemic:gemc-manifest -- --file scripts/fixtures/gemc-sample-sources.json`

---

## 7. Reason codes (GEMC)

| Kod | Anlam |
|-----|--------|
| `GEMC_SOURCE_MUTATION_FORBIDDEN` | Kaynak silme/overwrite girişimi |
| `GEMC_COHERENCE_DRIFT` | Özet ↔ kaynak hash uyuşmazlığı |
| `GEMC_PRUNE_POLICY_MISSING` | Pruning CIL’de tanımlı değil |
| `GEMC_ROLLUP_UNSEALED` | Mühürsüz özet yayınlanamaz |
| `GEMC_CROSS_EPOCH_GAP` | Epoch listesinde eksik halka |

---

## 8. Mutation policy

GEMC-1 **append-only**; artefakt ailesi (`GEMC-ROLLUP` vb.) [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) ile ileride bağlanır.

---

*GEMC-1 — Derived compression + lineage-safe pruning + ECG projection + coherence — sources immutable.*
