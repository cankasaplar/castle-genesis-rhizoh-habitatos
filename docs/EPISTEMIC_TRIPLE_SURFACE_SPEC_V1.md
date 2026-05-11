# Epistemic Triple Surface Spec (ETSS-1)

**Rol:** Bu belge sözlük veya serbest mimari not **değildir**. **Constitutional mapping layer**dır: üç epistemik yüzeyin kimliğini, birbirine **nasıl kilitlendiğini** ve **birbirine indirgenemeyeceğini** tanımlar.

**Sürüm:** ETSS-1  
**İlişkili:** [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md), [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md), [`academic/SESSION_LOG.md`](academic/SESSION_LOG.md)

---

## 1. Üç yüzey (tek epistemik yığın)

`SESSION_LOG`, `DAG`, `Frozen Core` ayrı ayrı “izole sistem” değildir; **tek epistemik stack’in üst üste oturan katmanlarıdır**. ETSS bunları ortak dilde **kilitler**:

| Yüzey | Kimlik | Bellek türü |
|--------|--------|----------------|
| **TAL** | **Execution surface** | Yürütme belleği — *execution ledger* / zaman indeksli audit |
| **ECG** | **Reasoning surface** | Nedensel türetim belleği — *reasoning substrate* (yapısal DAG) |
| **CIL** | **Law surface** | Hakikat hukuku — *constitutional invariant set* (ne mühürlenebilir, ne replay edilebilir) |

**Sabit cümle (anchor):**

- **SESSION_LOG** is memory of **execution** (what happened, when, under which habitat).
- **DAG** (episodic causal structure) is memory of **reasoning** (derivation, observation, merge — structural causality).
- **Frozen Core** is **law of truth** (what may be asserted, sealed, replayed, and how unknown/degraded is explicit).

---

## 2. Minimal isim standardı

| Kısaltma | Tam ad | Repo’da yaygın ad | Rol |
|----------|--------|-------------------|-----|
| **TAL** | Temporal Audit Ledger | `SESSION_LOG` ([`academic/SESSION_LOG.md`](academic/SESSION_LOG.md)) | Execution surface — append-only, insan-okur audit |
| **ECG** | Episodic Causal Graph | `causalGraph`, seal zinciri, epoch bağları (runtime / analyzer) | Reasoning surface — makine-okur yapısal nedensellik |
| **CIL** | Constitutional Invariant Layer | Frozen Core, stabilization graf, mühürlü protokoller | Law surface — ECG ve TAL’ı sınırlayan invariant’lar |

Günlük kullanımda `SESSION_LOG` / `DAG` / `Core` yeterli; **TAL / ECG / CIL** çapraz anlatımda aynı üçlüyü tek haritada toplar.

---

## 3. Ring modeli (referanslanabilir, uygulanabilir)

ETSS-1 ile ring katmanları yalnızca teori değil; **hangi artefaktın hangi yüzeyi temsil ettiğine** işaret eden çerçevedir:

- **Ring 0 (CIL):** Yalnız “kavram” değil — **referanslanabilir invariant set** (mühür, replay, unknown/degraded, authority).
- **Ring 1 (ECG):** DAG, “opsiyonel debug aracı” değil — sistemin **reasoning substrate’i** (protokol mekaniği + nedensel yapı).
- **Ring 2 (TAL):** Log yalnız “trace” değil — **execution ledger** (operasyonel ve incelemeye açık tarihçe).

Runtime (Ring 2 uygulaması) evrilebilir; Ring 0 + Ring 1 ihlal edilemez.

---

## 4. Türetilemezlik ve sızıntı riskinin kapatılması

**Yanlış modeller (kapatıldı):**

- “Log ile reasoning karışır.”
- “DAG, log’dan türetilir” (canonical anlamda).

**Doğru model:**

- Üç yüzey **birbirine referans verir**; **birbirinden türetilmez** (bir yüzey diğerinin tek kaynağı veya tam gölgesi değildir).

**Sonuç:** epistemik sızıntı (epistemic leakage) ve anlamsal çökme (semantic collapse) hedeflenerek kısıtlanır; **replay determinism** ve **audit stability** için yüzey ayrımı korunur.

**Yönellik:** `TAL → ECG → CIL` şeklinde **tek yönlü türetim zinciri** yoktur. ETSS bir **ilişki haritası** (relation map) sunar; oklar aşağıdaki şemada **anlatımsal / operasyonel yığın** sırasını gösterir, “TAL üretir ECG, ECG üretir CIL” iddiası taşımaz.

---

## 5. Paralellik ve isteğe bağlı exporter

**Bugün:** TAL ile ECG **paralel** sürdürülür; TAL, ECG’nin otomatik gölge projeksiyonu değildir.

**Gelecek (isteğe bağlı):** `SESSION_LOG → exporter → DAG reconstruction` yalnızca **analiz aracı** olabilir; **garanti veya canonical kaynak** değildir. Canonical nedensellik ECG + CIL ile kalır.

---

## 6. Mimari snapshot (semantic binding görünümü)

```
Observer Layer
      ↓
Observation Fabric
      ↓
TAL (Execution Memory)
      ↓
ECG (Causal Reasoning Graph)
      ↓
CIL (Constitutional Law)
```

**ETSS-1:** Bu zincirin **semantic binding spec**’idir — yüzeylerin kimliği ve **indirgenemezlik** hukuku burada sabittir.

---

## 7. ECG örnek JSON — neden “referans”, wire değil

Aşağıdaki şekil **ortak model / iletişim** içindir; erken şema bağlama (early binding) ve gereksiz protokol dondurması yapmaz. **ECG burada bir modeldir; wire contract değil** — evrim alanı açık kalır. Üretim şemaları [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) ve ilgili protokollerle birleştirilir.

```json
{
  "node": "artifact_id",
  "parents": ["hashA", "hashB"],
  "epoch": "E-12",
  "seal": "parentSealHash",
  "causalType": "derivation | observation | merge"
}
```

---

## 8. ETSS-1’in kilitlediği üç şey (epistemic integrity)

1. **Identity of surfaces** — TAL / ECG / CIL kimlikleri sabitlenir.  
2. **Directionality** — Tek doğrultuda “pipeline türetimi” değil; **relation map**.  
3. **Non-collapsibility** — Yüzeyler birbirine indirgenemez; çapraz sızıntı mimari olarak reddedilir.

Bunların kilidi, pratikte sistemin **epistemic integrity layer**’ıdır.

---

## 9. Self-describing epistemic system

Rhizoh yalnızca çalışan bir yığın değil; **kendini nasıl düşündüğünü** de tanımlayan bir epistemik sistemdir: yüzeyler, hukuk ve nedensellik ayrımı **açık belge** ile bağlanır.

**Omurga özeti (İngilizce, sabit ifade):**

*Rhizoh is no longer a system that stores truth. It is a system that defines how truth can exist across three irreducible surfaces.*

---

## 10. Doğal sonraki adım (operasyonel bağ)

**CIL değişim sözdizimi + ECG kısıt katmanı (uygulanabilir spec):** [`CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md).

**Phase 2 — amendment icra motoru + ECG doğrulayıcı:** [`EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md`](EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md) · **ARSM:** [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md) · **Apply:** [`APPLY_SEMANTICS_ENGINE_V1.md`](APPLY_SEMANTICS_ENGINE_V1.md) · **CEE / CESE / CLFB:** [`COMPENSATION_EXECUTION_ENGINE_V1.md`](COMPENSATION_EXECUTION_ENGINE_V1.md) · [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) · [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) · **ECGI:** [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md).

**Global convergence (GCR-1 execution model + stub rapor):** [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md). **Episodic memory consolidation (türetilmiş sıkıştırma):** [`GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) · `npm run epistemic:gemc-manifest`. **Query & reconstruction (retrieval compiler):** [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) · `npm run epistemic:eqr-plan`. **World model integration (planlı):** [`EPISODIC_WORLD_MODEL_INTEGRATION_V1.md`](EPISODIC_WORLD_MODEL_INTEGRATION_V1.md). **Bootstrap verification gates (startup constraint engine):** [`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md). **Predicate algebra (G0–G3 dependency contract):** [`GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md`](GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md). **Compositional semantics binding (PAL + GCR + EQR + EWM):** [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md). **Engine manifest + EBVM + GDK:** [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) · [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) · `npm run epistemic:csb-eval` · `npm run epistemic:csb-harness` · `npm run epistemic:csb-vm` · `npm run epistemic:csb-vm-replay`.

### 10.1 Temporal epistemic operating system (referans yığın — kapalı döngü)

| Katman | Rol |
|--------|-----|
| **ETSS** | Truth isolation |
| **CIL** | Invariant law |
| **CAECL** | Mutation law |
| **ECG** | Read-only reasoning graph (export) |
| **TAL** | Execution trace |
| **AEE** | Execution engine |
| **ASE** | Apply semantics engine |
| **CEE** | Failure representation |
| **CESE** | Scheduling engine |
| **CLFB** | Feedback loop |
| **GCR** | Convergence engine |
| **GEMC** | Memory consolidation |
| **EQR** | Reconstruction (retrieval compiler) |
| **EWM** | Unified world model (planlı) |
| **GBS-VG** | Boot-time verification gates (constraint validation, fail-fast) |
| **GBS-PAL** | Gate predicate dependency algebra (`G0`–`G3` witness graph) |
| **CSB** | Compositional bind — `PAL + GCR + EQR + EWM` → `ValidityBundle` (ortak anchor) |
| **EMCS** | `EngineManifest` — **versioned executable constitution** ([`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md)) |
| **EBVM** | **Clock-indexed trace generator** — adımlı VM, tick’li execution graph, replay ([`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md)) |
| **GDK** | **Global ordering / determinism kernel** — clock, sanitize, observer isolation; **runtime safety** (clock consistency) ([`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md)) |

*Üretim → hata → düzeltme / reconcile → hafıza → geri çağırma* döngüsü **EQR** ile tamamlanır; **EWM** birleşik anlam hedefidir; **GBS-VG** startup’ta **bounded ACTIVE** geçişini kilitlemeyi hedefler; **GBS-PAL** bu gate’lerin **formal bağımlılık cebirini** tanımlar; **CSB** boot + zamansal + retrieval tanıklarını **tek bileşik okumada** birleştirir ([`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md), [`GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md`](GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md), [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)).

### 10.2 Dört katman — kesin rol (EMCS · CSB · EBVM · GDK)

| Layer | Rol |
|-------|-----|
| **EMCS** | **Versioned law system** |
| **CSB** | **Compositional semantics** |
| **EBVM** | **Clock-indexed execution graph generator** |
| **GDK** | **Global ordering kernel** (runtime safety — clock consistency) |

**Epistemic Operating System (runtime OS):** **EMCS** = law · **CSB** = binding algebra (`Bind`) · **GDK** = time / ordering kernel · **EBVM** = trace generator (ANF + `K`-typed edges) — birlikte **DETAM** (*Deterministic Epistemic Trace Algebra Machine*): **time-indexed canonical reality generator**. `Execution ≈ VM(EMCS, CSB, Input)` yalnızca **GDK** altında tam replay-lenebilir; doğruluk **eşdeğerlik sınıfı determinizmi** (GECS) ile tamamlanır ([`EBVM` üst not](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md), [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) §14, [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) §5.4, §7–8).

**Mimari problem → çözüm:** “**Distributed execution → inconsistent reality model**” yerine “**distributed execution → single canonical trace space**” — aynı iddia altında **tek tarihçe sınıfı** ([`EBVM` §1](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md), [`GDK` §9](GLOBAL_DETERMINISM_KERNEL_V1.md)). **ISA v2** bu yüzden zorunludur: EBVM artık salt instruction set değil, **GDK tick** ile indekslenen trace üreticisidir ([`EBVM` §9](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#9-ebvm-isa-v2-clocked)).

**Baskın mühendislik riski:** **Clock drift abstraction leakage** — EMCS/CSB doğru olsa bile **GDK** yanlış uygulanırsa yığın “doğru spec, farklı gerçeklik” üretir; kritik sınır artık yalnız belge drift’i değil, **ordering çekirdeğinin runtime sızıntısı**dır ([`GDK` §7.1](GLOBAL_DETERMINISM_KERNEL_V1.md)).

**Trace commit standardı (MK-1):** Geçersiz trace **üretilebilir**; **committed** kabul yalnız [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) (`mk1Validate`, `MK1_ERR_*`) ile — üretim serbest, commit kısıtlı.

Anayasal tek cilt (`FROZEN_CORE_CONSTITUTION_V1`) geldiğinde **Section 0 — Epistemic Triple Surface Binding (ETSS-1)** ve yukarıdaki belgeler **cross-reference** ile aynı hukuku kilitleyebilir.

---

## 11. Mutation policy (bu belge)

- **ETSS-1** güncellemeleri: tercihen **append-only** düzeltme veya yeni bölüm; geriye dönük anlam silme yok.
- Üst sürüm (**ETSS-2**): anayasal genişleme gerekirse yeni dosya veya açık sürüm satırı.

---

*ETSS-1 — Constitutional mapping layer: TAL · ECG · CIL.*
