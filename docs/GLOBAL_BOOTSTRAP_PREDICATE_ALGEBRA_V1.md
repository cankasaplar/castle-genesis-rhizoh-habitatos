# Global Bootstrap Predicate Algebra Layer (GBS-PAL-1)

**Rol:** [`GBS-VG-1`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) içinde **isimlendirilmiş** `G0`–`G3` gate’lerinin **aralarındaki bağımlılık cebirini** kilitleyen katman — yani predicate’lerin **girdi/çıktı tipleri**, **değerlendirme sırası**, **döngüsüzlük** ve **monoton daralma** kurallarının **formal sözleşmesi**.  
**Durum:** `PLANNED` — mimari kapanış eşiği; implementasyon ayrı amendment.  
**Sürüm:** GBS-PAL-1  
**İlişkili:** [`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) (boot bacak → `Pack`) · [`EPISODIC_WORLD_MODEL_INTEGRATION_V1.md`](EPISODIC_WORLD_MODEL_INTEGRATION_V1.md) · [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) · [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) · [`GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) · [`CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md)

---

## 1. VG ile PAL ayrımı

| Katman | Soru |
|--------|------|
| **GBS-VG-1** | Startup’ta **hangi fazlar**, **hangi sırayla**, **fail-fast** ile çalışır? |
| **GBS-PAL-1** | `G0`–`G3` **cebirsel olarak** neye bağlıdır; hangi witness hangi predicate’i **besler**; **genişletme** nerede yasak? |

VG olmadan PAL soyut kalır; PAL olmadan VG’deki gate’ler **bağımsızlık illüzyonu** riski taşır.

---

## 2. Taşıyıcılar (formal iskelet)

**Aday durum:** `WorldCandidate` — boot anında değerlendirilen kapalı artefakt kümesi (snapshot, rollup pointer’ları, imzalar, vb.).  
**Tanık:** her `Gi` için `Witness_i` — o fazın **salt okunur** çıktısı (pass/fail + rapor gövdesi); PAL, hangi alanların sonraki faz için **yasal girdi** olduğunu tanımlar.

Predicate imgesi (okuma):

`Gi : (WorldCandidate, W_<i) → { pass, fail } × Witness_i`

Burada `W_<i`, yalnızca `G0`…`G{i-1}` üzerinden üretilmiş tanıkların birleşimidir (**geriye dönük tüketim yok**).

---

## 3. Değerlendirme grafiği (acyclic, total order)

**Zorunlu sıra:** `G0 → G1 → G2 → G3` (tek kaynak yol; paralel değerlendirme **aynı sırayı ihlal etmemeli**).

**Yasak:** `Gi`’nin çıktısı `Gj` için girdi olması için `j < i` (geçmişe kenar).  
**İzin:** `Gi` yalnızca `j < i` olan `Witness_j` ve `WorldCandidate`’ın **PAL’de listelenen** alanlarını okur.

Bu graf **DAG**dır; **constraint dependency graph**’ın boot alt grafiğidir.

---

## 4. Cebirsel özellikler

1. **Bileşim:** `S_valid = G0 ∧ G1 ∧ G2 ∧ G3` — VG §2 ile uyumlu; `∧` burada **aynı WorldCandidate** üzerinde ardışık daraltmayı ifade eder.  
2. **Monoton daralma:** `S_{k+1} ⊆ S_k` — `k` fazından sonra kabul edilen aday küme, öncekinin alt kümesidir; hiçbir `Gi` **yeni aday üretip** kümesi genişletmez.  
3. **Genişleme yasağı:** Predicate değerlendirmesi **operational state yazmaz**; yalnızca **eliminasyon** + **witness üretir** ([`GBS-VG-1` §6](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md)).  
4. **Hata ayrıştırması:** `fail` durumunda tek kök `Gi` (ilk fail) — kısmi boot yok; **fail-fast** ile orchestration sabittir.

---

## 5. Gate → dış artefakt eşlemesi (PAL sözlüğü — taslak)

PAL-1, aşağıdaki eşlemeyi **kesin alan listelerine** indirger (implementasyon öncesi `TBD` kalkar):

| Predicate | Tipik salt okunur girdiler (örnek aileler) | Tüketilen önceki tanık |
|-----------|-------------------------------------------|-------------------------|
| **G0** | Kimlik / trust kökleri, tören önkoşulları | — |
| **G1** | GEMC manifest, snapshot hash, EQR `planId` / lock | `Witness_0` |
| **G2** | GCR raporu, CESE ön sıra witness (tanımlıysa) | `Witness_0`, `Witness_1` |
| **G3** | CIL / ECG export, EWM vektör bileşenleri | `Witness_0`…`Witness_2` |

**Kural:** Bir artefakt **PAL listesinde yoksa** o faz için **yasal girdi değildir** (sızıntı = spec ihlali).

---

## 6. Gate 3 ve vektör (PAL notu)

`G3` çıktısı PAL dilinde **skaler değil**: `Witness_3` içinde **kısıt vektörü** + **gap manifesti** alanları tanımlanır; `pass`, vektörün **tüm zorunlu boyutlarının** model içi eşiklerle uyumlu olduğu anlamına gelir (detay **EWM-1** + PAL alt-bölümünde).

---

## 7. `GBS_ERR_*` ile hizalama

PAL, her `Gi` için **refinement** (alt-kod) ağacını bağlar: hangi alt-kısıt ihlali → hangi `GBS_ERR_*` alt etiketi.  
Üst aileler [`GBS-VG-1` §12](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) ile sabit kalır; **alt kodlar PAL’de doğar**.

---

## 8. Sonraki adımlar (PAL sonrası)

- **Compositional bind (CSB-1)** — `W_boot`’un `GCR` / `EQR` tanıklarıyla **aynı anchor**da nasıl **Pack** edildiği — [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md).  
- **Bootstrap ceremony layer** — operasyonel sıra + logging semantics + engine-level recovery ([`architecture/BOOTSTRAP_CEREMONY_CHECKLIST_V1.md`](architecture/BOOTSTRAP_CEREMONY_CHECKLIST_V1.md) ile hizalama).  
- **Genesis failure simulator** — PAL grafiğine karşı kasıtlı ihlaller.

---

## 9. Mutation policy

GBS-PAL-1 **append-only**; geri kenar veya genişletici predicate eklemek **yeni sürüm** veya açık amendment gerektirir.

---

*GBS-PAL-1 — Dependency algebra for G0–G3: typed witnesses, acyclic order, monotonic ∧-composition.*
