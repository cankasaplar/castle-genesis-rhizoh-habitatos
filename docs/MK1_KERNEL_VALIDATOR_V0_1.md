# MK-1 Kernel Validator v0.1 — Physics Compliance Checker

**Rol:** EBVM trace + EMCS manifest + GDK clock üzerinde **kabul standardı** — “gerçeklik üretmez”; **commit edilebilir trace** sınırını tanımlar.  
**Durum:** `PLANNED` — referans doğrulayıcı sözleşmesi; implementasyon `mk1Validate` ile hizalanır.  
**Sürüm:** MK-1 v0.1  
**Referans kod:** [`scripts/mk1Validate.mjs`](../scripts/mk1Validate.mjs) — `npm run epistemic:mk1-validate` · **Stress:** [`scripts/mk1StressHarness.mjs`](../scripts/mk1StressHarness.mjs) — `npm run epistemic:mk1-stress` · **ECER adversarial:** [`scripts/ecerAdversarialSuite.mjs`](../scripts/ecerAdversarialSuite.mjs) — `npm run epistemic:ecer-adversarial` · [ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md](ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md) · [ECER_ADVERSARIAL_META_ADV_1_1.md](ECER_ADVERSARIAL_META_ADV_1_1.md) (`npm run epistemic:ecer-adv-check` · `epistemic:ecer-adv-suggest`) · [ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) · [ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) · [EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) · [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) · [TLS-1.1](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) · [TLOA-1](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) · [TTA-1](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) · [TTA-1.1](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) · [HOGA-1](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) · **ETK-1:** [`ecerEpistemicTransitionKernel.mjs`](../scripts/ecerEpistemicTransitionKernel.mjs) (`npm run epistemic:etk-verify`) · **HOGA-1:** [`hogaComposition.mjs`](../scripts/hogaComposition.mjs) (`npm run epistemic:hoga-verify`) · **Phase 2.5:** [`anfReduce.mjs`](../scripts/anfReduce.mjs), [`projectPi.mjs`](../scripts/projectPi.mjs), [`evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs) · **RBL-1:** [`witnessArtifact.mjs`](../scripts/witnessArtifact.mjs) · **RBL-τ:** [RBL_TAU_BINDING_LAYER_V1.md](RBL_TAU_BINDING_LAYER_V1.md) · [RBL_TAU_LINEAGE_LAYER_V1.md](RBL_TAU_LINEAGE_LAYER_V1.md) · [RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [`rblBindTau.mjs`](../scripts/rblBindTau.mjs)  
**İlişkili:** [`PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md`](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) (**PCEK-1**) · [`PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md`](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) (**PAG-1** — π meşruiyeti) · [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) (EBVM, GECS, ANF, `K`) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) (GDK, DCI, §11) · [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) (EMCS) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) (CSB normal form) · [`PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md`](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) (piEMS-1: epoch, CUT_OVER) · [`PI_EMS_COMPAT_MATRIX_V1.md`](PI_EMS_COMPAT_MATRIX_V1.md) (πᵢ↔πⱼ matrisi) · [`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md) (piEFC-1) · [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) (πEFC-Runtime-1.0: decision consistency, memoization, Execution Algebra eşiği)

**Sistem tanımı (final):** **Deterministic Trace Acceptance Boundary Layer** — *computation sonrası gerçeklik kabul filtresi*.

**Mimari kayma:** “execution system” → **trace validation boundary**; MK-1 **compute etmez** (EBVM) · **normalize etmez** (CSB) · **order vermez** (GDK) · **yalnız reject / accept**.

**Dört katman (çekirdek ayrım):** **EBVM** üretir (commit değil) · **GDK** sıra / drift · **CSB** temsil çökertme / eşdeğerlik · **MK-1** **final accept/reject boundary** — hakikat veya “sistemin doğruluğu” kanıtı değil; soru: *bu trace kabul edilebilir state space’te mi?*

**Mühendislik gerçeği:** Bu “bir validator yazmak” değil — **deterministic computation boundary** tanımlamak. MK-1 garanti çerçevesi: **aynı trace → aynı kabul kararı**; **farklı trace → farklı eşdeğerlik sınıfı** (GECS ile); **ara durum undefined değil** (`MK1_ERR_*` veya `MK1_VALID_TRACE`).

### Semantic state (üç ayrım — kilitli)

| Katman | Rol |
|--------|-----|
| **(A) Production (EBVM)** | Trace üretir; graph oluşturur. |
| **(B) Binding (CSB)** | Eşdeğerlik sınıfı; normalization (MK-1 içinde GECS placeholder ile hizalanacak). |
| **(C) Acceptance (MK-1)** | Yalnız: **`trace ∈ VALID_STATE_SPACE` ? accept : reject** |

### Deterministic lock (yok / var)

| ❌ Yok | ✅ Var |
|--------|--------|
| Dynamic error space | `MK1_ERR` kapalı domain |
| Semantic leakage (validator içine) | ANF / GECS placeholder — structure-only |
| Recursive hash dependency | `finalHash` hash girdisinde değil |
| Format ambiguity | Tek canonical hex kimlik: `[a-f0-9]{64}` |
| — | Root = strict equality canonical domain üzerinde |
| — | CLI = tek deterministik module resolution yolu |


---

## 0. Input contract

| Alan | Tip (mantıksal) | Açıklama |
|------|------------------|----------|
| **`trace`** | `EBVMTrace` | EBVM-2.0 ticked trace (kenarlar + meta + isteğe bağlı `finalHash`) — [`EBVM` §9.4](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#94-canonical-trace-grammar-ebvm-20) |
| **`manifest`** | `EngineManifest` | [`EMCS-1`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) |
| **`clock`** | `GDKClock` | `clockId`, `gdkPolicyVersion`, witness / `headHash` hattı — [`GDK` §5](GLOBAL_DETERMINISM_KERNEL_V1.md#5-gdk-clock-formal-spec) |

**Çıktı:** `ValidationReport` **veya** `MK1_ERR_*` (aşağıdaki guard’lara bire bir).

### 0.1 Canonical hash primitive (`H_canon`)

**Final invariant — tamamen stabil:** Bu artık “format seçimi” değil → **global identity domain**.

```javascript
export function H_canon(data) {
  const normalized = stableStringifyForDeterminism(data);
  return crypto
    .createHash("sha256")
    .update(normalized, "utf8")
    .digest("hex"); // 64-char lowercase hex
}
```

**HARD INVARIANT:** `H_canon` çıktısı **her zaman** `∈ [a-f0-9]{64}`.

Uygulama: `import * as crypto from "node:crypto"` — [`scripts/mk1Validate.mjs`](../scripts/mk1Validate.mjs); stable string — [`evaluateBind.mjs`](../scripts/evaluateBind.mjs).

**Spec seviyesi:** Belgelerde `sha256:` + hex **yalnız anlatım**; MK-1 runtime yüzeyi **yalnız ham hex**.

**İnvaryant:** `H_canon` = **single source of truth** for ALL MK-1 trace identity / `finalHash` checks.

### 0.2 Execution order (system — kilitli)

Bu artık yorum değil **execution contract**:

```text
EBVM → CSB → GDK → MK-1
```

| Katman | Rol |
|--------|-----|
| **EBVM** | Üretim — graph / trace üretir; **commit değil** |
| **CSB** | Temsil çökertme — bileşik anlam, normal form |
| **GDK** | Zorunlu ordering — clock, injektif sıra, drift sınırı |
| **MK-1** | **Final accept/reject boundary** — yan etki yok; saf **physics filter** |

MK-1 **ontology / felsefe / model** değil — **runtime truth gate** yalnızca “bu trace kabul edilebilir state space’te mi?” sorusunda.

### 0.3 `MK1_ERR_*` closure (kesin sözleşme)

Kod: `export const MK1_ERR = Object.freeze({ … })` — **dynamic error generation yasak**; yalnız bu anahtarlar. `err()` bilinmeyen string ile **throw** (closure violation). Lift haritası genişlerse **MK-1 minor**, yeni anahtar **belge + semver** ile.

### 0.4 Placeholder guard’lar (tasarım gerçeği)

| Guard | Şu an | Anlam |
|-------|--------|--------|
| **ANF** | `opId === anfExpectedOpId(edge, …)` | Phase 2.5: [`anfReduce.mjs`](../scripts/anfReduce.mjs) — tuple ⟨π,σ,ι,γ,μ⟩; **ι** = `anfBinding` yoksa dizin (çoklu kenarda permutasyon için `anfBinding` kullan) |
| **Clock** | `ok: true` | Gelecek **GDK enforcer**; ordering stub |
| **GECS** | Root’ta π | Phase 2.5: [`projectPi.mjs`](../scripts/projectPi.mjs) — `finalHash === H_canon(π(body))`; sıra permutation-invariant |

**Kritik invaryant:** **MK-1 correctness ≠** “evrensel ANF hakikati”; **MK-1 correctness =** yayımlanan **ANF_PHASE25** + **UCFC_PI_PHASE25** sözleşmesine göre yapısal + π tutarlılığı. ANF / π cebiri **genişletilebilir**; kök hash **π(body)** üzerinden ([`projectPi.mjs`](../scripts/projectPi.mjs)).

### 0.5 Hardened alignment (üç kilit)

1. **No circularity:** `finalHash` **hash input domain’inde değil** (`traceWithoutFinalHash`).  
2. **Contract-bound semantics:** ANF + π **yayımlanan** reducer / projection; MK-1 yalnız bu sözleşmeyi uygular ([`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §0.6).  
3. **Deterministic CLI boundary (single path):** `module resolution path` deterministik kimlik zincirinin parçası — `pathToFileURL(resolve(process.cwd(), file)).href`.

---

## 1. EBVM-K guard (edge space validity)

**Kural:**

> ∀ `e` ∈ `trace.edges` ⇒ `e.kind` ∈ `K`  
> `K = { causal, semantic, structural }` — [`EBVM` §9.3.1](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#931-edgekind-closure-final)

**İhlal:** `MK1_ERR_INVALID_EDGE_KIND`

**Not:** Bu katman **type-system enforcement**dır; ontology veya anlam sınıflandırması değil.

---

## 2. ANF identity guard (deterministic identity)

**Kural:** Her op düğümü / kenar için:

> `opId(node) == H_canon( ANF(node.inputs, manifest, clock) )`  
> (EBVM spec’te `opId` için `sha256:` öneki anlatılabilir; **MK-1 `H_canon` çıktısı her zaman ham hex** — entegrasyon sınırında aynı yüzeye indirgenir.)

ANF tüpü — [`EBVM` §9.6.1](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#961-opid-algebraic-normal-form-anf). `clock` burada π (politika) ve bağlam alanlarına girer.

**İhlal:** `MK1_ERR_IDENTITY_DIVERGENCE`

**Not:** Kimlik **runtime object** değil; **indirgenmiş cebirsel form** (DETAM).

---

## 3. GDK clock guard (injective time mapping)

**Kural:** Trace boyunca `(tick_i → headHash_i)` eşlemesi:

- **injektif** (aynı `tick` için tek `headHash` anlamı)  
- **monoton** (`tick` sırası bozulmaz)

**Formel kontroller:**

| Durum | Sonuç |
|-------|--------|
| Duplicate `tick` → farklı `headHash` | ❌ |
| Backward `tick` (`tick_{i+1} ≤ tick_i`) | ❌ |

[`GDK` DCI / §5.4](GLOBAL_DETERMINISM_KERNEL_V1.md#54-single-writer-clock-theorem-engineering-form) ile uyumlu okuma.

**İhlal:** `MK1_ERR_CLOCK_NON_INJECTIVE`

**Not:** Bu “evrende tek zaman” iddiası değil — **log ordering’in bozulmaması** ve `H_step` tutarlılığı.

**Stress köprüsü (v0.1):** `trace.mk1ClockWitness.tick` ile `clock.tick` ikisi de tanımlıysa **eşit** olmalı — aksi halde yukarıdaki kod (GDK drift enjeksiyonu için [`§10`](#10-mk-1-determinism-stress-harness-v01--poisoned-trace-suite)).

---

## 4. GECS equivalence guard (trace normalization)

**Kural:**

> `GECS(trace) == normalize(trace)`  
> veya eşdeğer: `ρ(trace, Π) ∈ canonical_class`

Reducer — [`EBVM` §7.2](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#72-gecs-equivalence-reducer), [§10](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#10-gecs-and-replayvmtrace-equivalence).

**İhlal:** `MK1_ERR_NON_CANONICAL_TRACE`

**Not:** Farklı **temsil** aynı **eşdeğerlik sınıfına** düşüyorsa kabul; sınıf dışı yüzey → red (politika `Π` ile sabitlenir).

---

## 5. Root invariant guard (global closure) — fixed spec

**Tam deterministik closure:** root check = **pure equality** canonical domain üzerinde (strict string equality).

> `trace.finalHash === H_canon( traceWithoutFinalHash(trace) )`  
> `finalHash ∉` hash girdisi; `finalHash` **yoksa** veya `[a-f0-9]{64}` değilse → red.

```javascript
function traceWithoutFinalHash(trace) {
  if (!trace || typeof trace !== "object") return {};

  const { finalHash, ...rest } = trace;
  return rest;
}

function checkRoot(trace) {
  if (!trace?.finalHash) return false;

  if (!/^[0-9a-f]{64}$/.test(trace.finalHash)) {
    return false;
  }

  const body = traceWithoutFinalHash(trace);
  const computed = H_canon(body);

  return computed === trace.finalHash;
}
```

*(Referans [`mk1Validate.mjs`](../scripts/mk1Validate.mjs) içinde `checkRoot` `{ ok }` döner; mantık özdeş.)*

Üst seviye **GDK `chainFinal`** / bundle — [`EBVM` §7.3](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#73-hash-finalization-rule) — politika ile aynı **ham hex** ailesine indirgenerek genişletilir.

**İhlal:** `MK1_ERR_ROOT_HASH_MISMATCH`

**Not:** **Trace integrity fingerprint** — “gerçekliğin tek mutlak hash’i” değil.

---

## 6. Validation pipeline (execution semantics)

**MK-1 içi guard sırası (sabit):** EBVM-K → ANF → Clock → GECS → Root.  
**Sistem sırası:** §0.2 — EBVM → CSB → GDK → MK-1.

```javascript
function mk1Validate(trace, manifest, clock) {
  const r1 = checkEdgeKinds(trace);
  if (!r1.ok) return MK1_ERR_INVALID_EDGE_KIND;

  const r2 = checkANF(trace, manifest, clock);
  if (!r2.ok) return MK1_ERR_IDENTITY_DIVERGENCE;

  const r3 = checkClock(trace, clock);
  if (!r3.ok) return MK1_ERR_CLOCK_NON_INJECTIVE;

  const r4 = checkGECS(trace);
  if (!r4.ok) return MK1_ERR_NON_CANONICAL_TRACE;

  const r5 = checkRoot(trace);
  if (!r5.ok) return MK1_ERR_ROOT_HASH_MISMATCH;

  return {
    valid: true,
    class: "MK1_VALID_TRACE",
    witness: trace.finalHash
  };
}
```

**Lift (mevcut hata ailesi):** `MK1_ERR_*` üst katmanda `GDK_ERR_*`, `CSB_ERR_VM_REPLAY_MISMATCH` veya `CSB_ERR_MANIFEST` ile **haritalanabilir** — tekilleştirme ayrı matris (MK-1.1).

### 6.1 CLI execution contract (fixed)

- **Girdi:** `process.argv[2]` — `trace`, `manifest`, `clock` **export** eden bir `.mjs` dosyası.  
- **Import (single deterministic path):**

```javascript
const mod = await import(
  pathToFileURL(resolve(process.cwd(), file)).href
);
```

**İnvaryant:** modül çözüm yolu, deterministik kimlik zincirinin parçasıdır.

- **Argüman yok:** stderr’e `MK1_ERR.INVALID_INPUT`, exit `1`.  
- **Çıktı:** `JSON.stringify(result, null, 2)`; exit `0` iff `result.valid`.

Örnek: `npm run epistemic:mk1-validate` → [`scripts/fixtures/mk1-sample-trace.mjs`](../scripts/fixtures/mk1-sample-trace.mjs).

---

## 7. Kritik mühendislik çerçevesi (commit vs üretim)

**Yanlış iddia:** “Sistem geçersiz gerçeklik **üretemez**.”

Bu ifade pratikte şuna kayar:

- debug edilemez sistem  
- geri dönüşsüz failure state’ler  
- self-referential deadlock riski  

**Doğru iddia:**

> Sistem **geçersiz trace üretebilir**; ancak bunları **committed state** olarak **kabul edemez**.

| Aşama | Serbest / kısıtlı |
|--------|-------------------|
| **Üretim** | Serbest — yürütüm hataları, ara trace, deneme |
| **Commit** | Kısıtlı — yalnız `mk1Validate` → `MK1_VALID_TRACE` |

**MK-1’in anlamı:**

- Gerçeklik **üretmez**  
- **Trace kabul standardı** tanımlar  
- **Execution**, commit yolunda **validation pipeline**’a bağlanır  

Bu konumlandırma: **ontology engineer** değil — **runtime constraint architect**.

**Özet özellikler:** üretim serbest · commit tekil · hash tek kaynak (`H_canon`) · clock ordering GDK’da zorunlu · eşdeğerlik çökertme (GECS) yolu açık · **geçersiz trace commit edilemez**.

---

## 8. `MK1_ERR_*` özeti

| Kod | Guard |
|-----|--------|
| `MK1_ERR_INVALID_INPUT` | §0 — eksik / hatalı `trace` · `manifest` · `clock` veya `edges` dizi değil |
| `MK1_ERR_INVALID_EDGE_KIND` | §1 EBVM-K |
| `MK1_ERR_IDENTITY_DIVERGENCE` | §2 ANF |
| `MK1_ERR_CLOCK_NON_INJECTIVE` | §3 GDK clock |
| `MK1_ERR_NON_CANONICAL_TRACE` | §4 GECS |
| `MK1_ERR_ROOT_HASH_MISMATCH` | §5 Root |
| `MK1_ERR_PROJECTION_AUTHORITY_MISMATCH` | πEFC — `piAuthority` vs `trace.piHash` / `piHash_trace`, matris yok ([`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §9.7) |
| `MK1_ERR_COMPAT_MATRIX_UNDEFINED` | πEFC — `M(i,j) === UNDEFINED` veya geçersiz hücre |
| `MK1_ERR_EPOCH_BINDING_MISSING` | πEFC — epoch / π etiketi eksik |
| `MK1_ERR_DUAL_READ_WITNESS_MISSING` | πEFC — [piEMS CUT_OVER / dual-read](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) tanığı yok |

**πEFC çağrısı (birleşik karar):** `mk1Validate(trace, { manifest, clock, piAuthority?, epochContext?, compatibilityMatrix? })` → `mk1` + `compatibility` + `decisionClass` + `witness?` + `piEfcCode?` — `decisionClass ∈ D` = export **`DECISION_CLASS`** ([`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §9.8). **Semantik:** `mk1Validate` πEFC modunda **reference evaluator** (tarihsel isim). Bkz. [`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md). Legacy üç argüman formu aynen geçerli.

---

## 9. Sonraki adımlar (mantıklı dallanma)

**A) MK-1.1 — Streaming validator (önerilen)** — artımlı düğüm doğrulama; kısmi trace kabulü; canlı GDK clock bağlama.

**B) MK-1 + CSB merge gate** — `evaluateBind` çıktısı doğrudan MK-1’e; **tek birleşik commit pipeline**.

**C) MK-1 Determinism Stress Harness v0.1** — aşağı §10 (uygulama: [`mk1StressHarness.mjs`](../scripts/mk1StressHarness.mjs), `npm run epistemic:mk1-stress`).

**D) MK-2 / UCFC / PCEK (yol haritası)** — projection governance kernel, sabit-nokta kabul, tek projection contract; aşağı §11.

**GDK hizası:** [`GDK-1` §11](GLOBAL_DETERMINISM_KERNEL_V1.md#11-gdk-enforcement-pipeline-runtime) pipeline ile MK-1 guard’ları **örtüşür**; MK-1, “physics compliance” için **isimlendirilmiş birleşik yüzey** olarak konumlanır.

---

## 10. MK-1 Determinism Stress Harness v0.1 — Poisoned Trace Suite

### 0. Amaç (corrected invariant)

**Goal:** **Rejection determinism** test etmek — **error elimination** değil.

**Düzeltme:** “Sistem asla hata kabul etmeyecek” değil — **System does not eliminate errors. System enforces deterministic rejection semantics.**

### Harness gerçek anlamı

- Doğruluk **ispatlamaz** · gerçeklik **üretmez** · hata **önlemez**.  
- Garanti: **aynı bozma → aynı reddetme** — **deterministic rejection engine** (truth machine değil).  
- πEFC senaryoları ile birlikte **falsification / contract adversarial suite** — yalnızca smoke değil.

### Üç sistem seviyesi

| Seviye | Rol |
|--------|-----|
| **EBVM** | Üretim |
| **CSB / GDK** | Düzenleme (binding, ordering) |
| **MK-1 + Stress Harness** | Doğrulama + stres — **controlled failure space** (chaos değil; bozulma davranışı sabit) |

### Core (referans kod)

- [`scripts/mk1StressHarness.mjs`](../scripts/mk1StressHarness.mjs) — `runMK1StressSuite`, `runAll`  
- [`scripts/fixtures/mk1-stress-base.mjs`](../scripts/fixtures/mk1-stress-base.mjs) — geçerli baseline (`mk1ClockWitness` + çoklu kenar)  
- Import: **`./mk1Validate.mjs`** (tek `H_canon` / `mk1Validate` kaynağı — ayrı `crypto/hash.js` yok)

### Test sütunları

| Test | İddia (v0.1) |
|------|----------------|
| **mutation** | 1-bit `opId` zehri ⇒ `MK1_ERR_IDENTITY_DIVERGENCE` (ANF) |
| **clockDrift** | `clock.tick` geri çekilir ⇒ `MK1_ERR_CLOCK_NON_INJECTIVE` (`trace.mk1ClockWitness.tick` ile eşleşme zorunlu) |
| **ordering** | Kenar sırası ters; **π(body)** aynı ⇒ `MK1_VALID_TRACE` (UCFC runtime ispatı) |
| **replay** | İki kez aynı trace ⇒ aynı `witness` / aynı ret kodu |
| **piefcEpochMismatch** | `piAuthority` ≠ `trace.piHash` ⇒ `PROJECTION_AUTHORITY_MISMATCH`, `DECISION_REJECT_UNDEFINED_POLICY` |
| **piefcMatrixUndefined** | `compatibilityMatrix` → `UNDEFINED` ⇒ `COMPAT_MATRIX_UNDEFINED` |
| **piefcDualReadCutover** | `dualReadRequired` ama `mk1DualReadWitness.epochs` yok ⇒ `DUAL_READ_WITNESS_MISSING` |
| **piefcReplayHistoricalPi** | Aynı π / M ile iki replay ⇒ aynı `decisionClass` / `compatibility` / `witness` |
| **pagInvalidBundle** | `evaluateBindIndexed` + bozuk bundle ⇒ `PAG_ERR_INVALID_BUNDLE` |
| **pagPiScopeMismatch** | `bundle.piHash` ≠ `π_authority` ⇒ `PAG_ERR_PIHASH_SCOPE_MISMATCH` |
| **pagEpochScopeMismatch** | `bundle.epochId` ≠ `epoch_ctx` otorite kapsamı ⇒ `PAG_ERR_EPOCH_SCOPE_MISMATCH` |
| **pagBundleAligned** | Hizalı bundle + geçerli τ ⇒ πEFC `ACCEPT_SELF` (bundle’sız kontrol ile uyumlu) |
| **rblSealVerify** | [RBL-1](RBL_1_REALITY_BRIDGE_LAYER_V1.md) `sealWitnessArtifact` + `verifyArtifactSeal` (RBL-I4) |
| **rblAppendRejectTamper** | `appendWitnessArtifact` geçerli mühür kabul; bozuk mühür ⇒ `RBL_ERR_APPEND_SEAL_FAIL` |
| **rblWitnessless** | Tanık listesi boş ⇒ `RBL_ERR_WITNESSLESS` (RBL-I2) |
| **rtbRoundTrip** | [RBL-τ](RBL_TAU_BINDING_LAYER_V1.md) `bindTraceFromArtifacts` (`RBL_TAU_BINDING_0_2`) → MK-1 geçerli τ → `extractArtifactRootsFromTrace` ≡ `canonicalRootsFromArtifacts` |
| **rtbBindPiMismatch** | Artefakt `piHash` bağlamdan sapınca `RTB_ERR_PI_EPOCH_MISMATCH` |
| **rtbExtractNoBinding** | `rblTauBindingVersion` yok ⇒ `RTB_ERR_NO_BINDING_VERSION` (baseline τ) |
| **rtbContextualDeterminism** | [RBL-τ Lineage](RBL_TAU_LINEAGE_LAYER_V1.md) aynı signal, farklı `witnessSet` → farklı `finalHash` (contextual determinism) |
| **ttaTrivialContent** | [TLOA-1](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) aynı tri-layer içerik, farklı `snapshotId` ⇒ aynı `snapshotContentDigest` · [TTA-1 / ETK-1](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) trivial `𝒯` |
| **ttaPagBlocksGovernanceTouch** | EBE değişimi + `pagAuthoritySatisfied: false` ⇒ `TTA_ERR_PAG_CONSTRAINT` / `ILLEGAL` |
| **ttaEcdmBypassNoWitness** | `CONSTITUTIONAL_DRIFT` hedefi, witness yok ⇒ `TTA_ERR_ECDM_BYPASS` · `requiresCutOverWitness` |
| **ttaDigestDiscontinuity** | `requireDigestContinuity` + yanlış `priorChainTipDigest` ⇒ `TTA_ERR_DIGEST_DISCONTINUITY` |
| **ttaEblInfeasible** | EBL patch + `eblBudgetFeasible: false` ⇒ `TTA_ERR_EBL_INFEASIBLE` |
| **ttaEcdmStrictNone** | `ecdmMaxLegitimacyDrift: NONE` iken ECDM alanı değişir ⇒ `TTA_ERR_DRIFT_UNBOUNDED` / `DRIFTED` |
| **ttaLedgerAppend** | `appendTransitionLedger` ardışık `seq` (ledger writer yüzeyi) |
| **hogaCommuteComposition** | [HOGA-1](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) kayıtlı çift `COMMUTE` ⇒ `composeMetaDelta` kabul |
| **hogaIncompatibleComposition** | `INCOMPATIBLE` çift ⇒ `HOGA_ERR_META_INCOMPATIBLE` |
| **hogaOrderSensitiveUnwitnessed** | `ORDER_SENSITIVE` çift, witness yok ⇒ `HOGA_ERR_ORDER_SENSITIVE_UNWITNESSED` |
| **hogaOrderSensitiveWitnessed** | Aynı çift + `compositionWitnessRef` ⇒ kabul |
| **hogaUnknownPairAmbiguous** | Kayıtsız çift ⇒ `AMBIGUOUS` + `COMPOSITION_UNDEFINED` |
| **hogaEcptPathValid** | `verifyEcptPathClosed` — ardışık faz kenarları `FROM>TO` ile mevcut |
| **hogaEcptMissingEdge** | Eksik kenar ⇒ `ECPT_PATH_NOT_CLOSED` |
| **hogaEcptForbiddenMiddle** | `forbiddenMiddles` ile gizli ara faz ⇒ `ECPT_HIDDEN_INTERMEDIATE` |

**Global runner:** `runAll` → `pass` iff tüm sütunlar `true`; `class`: `MK1_STABLE` \| `MK1_DEGRADED`.

### CLI

`node scripts/mk1StressHarness.mjs <fixture.mjs>` — argümansız `MK1_ERR_INVALID_INPUT`. Varsayılan: `npm run epistemic:mk1-stress`.

### Clock witness (stress / GDK köprüsü)

Trace gövdesinde opsiyonel **`mk1ClockWitness: { tick }`** + `clock.tick` — ikisi de sayı ise **eşit** olmalı; aksi halde `MK1_ERR_CLOCK_NON_INJECTIVE`. Tanık yoksa guard **geçer** (geriye dönük uyum); tam GDK §5.4 sonradan sıkılaştırılır.

---

## 11. MK-2 (yol haritası): fixed-point closure — UCFC — PCEK

**Üst isim (mimari):** **Projection-Constrained Epistemic Kernel** (**PCEK**). Bu kategori **truth engine** değil; **projection governance kernel** — OS, veritabanı veya theorem prover sınıfında değil; **policy-bound execution kernel**.

Kesin ayrım:

- Truth **üretimi** yok · tek gerçeklik **iddiası** yok · **semantic absolutism** yok.  
- Bunun yerinde: **truth = projection contract compliance** (sözleşmeye uygunluk).

Spec fiilen: “farklı modeller değil — **tek projection contract** altında farklı hesaplamalar.” **UCFC** bir **truth oracle** değil; **projection arbitration layer** (hangi π yetkili, hangi trace hangi π-range’inde).

**PCEK özellikleri (özet):**

| Özellik | Anlam |
|---------|--------|
| Execution | **value-neutral** (anlam taşıyan taraf execution değil) |
| Semantics | **contract-bound** |
| Validation | **range enforcement** (aşağı §5b) |
| Kimlik (π) | **projection fingerprinted** — `piHash` aşağı §11.1 |

**Kritik mimari hareket:** “Truth”u ortadan kaldırmak değil; truth’u **versioned constraint space**’e taşımak → **tek gerçeklik yok**, ama **tek projection authority** (yetkili π sözleşmesi) vardır.

### 5. MK-2’nin teknik anlamı (yanlış / doğru yorum)

**MK-2** burada “kendi kendini kontrol eden sistem” değil; **fixed-point closure operator** olarak anlaşılmalı:

**V(trace) = π(trace)**

- **V** — validation (MK katmanının kabul / ret sınıflandırması; pratikte kanon gövde + kök tanığı ile örtüşür).  
- **π** — §11.1: **versioned semantic governance primitive** / **contract object** (yalnızca `function` veya soyut artefakt değil).

**Sonuçlar:**

- π **yoksa** MK-2 **tanımsızdır** (sabit nokta iddiası boş).  
- **Birden fazla** π (veya aynı isimle farklı anlamlar) → **ontology / policy split**; klasik “bug”den çok **split-world consistency violation**.

### 5b. MK-1’in gerçek rolü — range classifier

Kural (hedef semantik):

**Accept(τ) ⇒ τ ∈ Range(π)**

MK-1 bir **validator** veya **truth checker** değil; **range classifier**: soru **“bu trace doğru mu?”** değil, **“bu trace hangi projection space’e (hangi π-range’e) ait?”** — **range membership** / kabul sınırı.

### 6. Unified Canonical Functor Constraint (UCFC)

**Invariant (mimari):** **GECS** ve **EBVM** aynı **projection contract**’a (aynı π tanımına) referans vermelidir — tek π, tek hash yüzeyi, tek kapanış. Buna **UCFC** (*Unified Canonical Functor Constraint*) denir.

MK-1 **runtime / acceptance** yüzeyindedir; formal eşdeğerlik (GECS, ANF, CSB) ayrı yüzeydedir. **Dual-truth aware** kasıtlıdır; hedef “tek truth” değil **uyumlu truth katmanları**; **UCFC** katmanlar arası **tek projeksiyon sözleşmesi** ile drift’i yönetir.

### 11.1. π — versioned semantic governance primitive

π’nin net karşılığı:

**π := versioned semantic governance primitive** (soyut “fonksiyon” veya dosya artefaktı etiketinden ayrı: **contract object**).

Engineering bağları:

- **idempotent** · **deterministic** · **hash’lenebilir** → **`piHash`**.  
- **`piHash`** = sözleşmenin **opaque identity** değil; **policy fingerprint** (hangi projeksiyon politikası geçerli).

**EngineManifest / `piHash`:** execution’ı **tek canonicalization epoch**’a bağlar — “code versioning” ile karıştırılmaz; **versioning of reality projection**.

### 11.2. Drift = policy divergence (bug değil)

**π_EBVM(τ) ≠ π_GECS(τ)** “ontological divergence”dır; **error** veya tutarsızlık retoriğiyle sınırlı değil → **policy split** / **policy divergence**: aynı input, **farklı projection policies**.

Tepki sınıfı: klasik **debugging** değil; **yalnız governance resolution** (sözleşmeyi tekilleştirmek, çoklu-π politikasını açık yazmak, piVM kuralları).

### 11.3. Dört katman — execution vs projection

**Özet cümle (mühendislik):** **Execution is neutral; projection defines meaning.**  
(Eski formülasyonla uyumlu: execution truth-bearing değil; anlamı **π sözleşmesi** tanımlar.)

| Katman | Rol |
|--------|-----|
| **EBVM** | **Trace generation** |
| **GECS** | **Equivalence space** |
| **UCFC** | **Projection contract** (π, `piHash`) — semantic governance |
| **MK-1** | **Range enforcement** |

### 11.4. Risk: world-model discontinuity = epoch boundary

**Risk:** `piHash` / π **değişir**; trace **önceki π epoch**’unda üretilmiştir.

Yorum: **Aynı execution, farklı semantic governance epoch** — runtime “yanlış” değil, semantic “yanlış” değil; **version mismatch** → **epoch boundary violation**. Klasik bug değil; **world-model discontinuity**.

UCFC bu yüzden **runtime safety** katmanı değil; **semantic governance layer** — π migrasyonu bilinçli tasarlanmalıdır.

### 11.5. π Versioning Semantics (piVM) — versioned calculus

Projection sistemi artık **versioned calculus**; **piVM** doğal olarak:

- backward-compat kuralları · **dual-π resolution** · **migration semantics**

Bu bir **runtime feature** listesi değil; **semantic migration layer**.

**Normatif spec:** [`PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md`](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) (**piEMS-1**) — `piHash` upgrade compatibility, mixed-π reconciliation, epoch transition rules, UCFC negotiation protocol, **CUT_OVER** güvenliği (§4.2.1: dual-read veya zorunlu epoch etiketi). **πᵢ↔πⱼ matrisi:** [`PI_EMS_COMPAT_MATRIX_V1.md`](PI_EMS_COMPAT_MATRIX_V1.md). **Runtime birleşik karar:** [`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md) (**piEFC-1**) — `evaluateBind(τ, π, epoch, clock)` → MK-1 + compatibility; formal semantik [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) (**decision engine**, truth engine değil). **Stack özeti:** versioned execution (EBVM) + versioned time (GDK) + versioned meaning (UCFC/piEMS) + acceptance (MK-1) → **Epistemic OS** formal stack.

### Teşhis özeti (şu an)

| Durum | Not |
|--------|-----|
| Runtime deterministik | ✓ |
| Semantic closure ayrılmış | ✓ |
| Clock ordering stabil | ✓ |
| Range / acceptance sınırı net | ✓ |
| Dual-truth bilinci | ⚠ bilinçli (iyi) |
| Policy drift | ⚠ [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) + [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) / piVM |

**Kısa sonuç:** **EBVM** = trace generation · **GECS** = equivalence space · **UCFC** = projection contract · **MK-1** = range enforcement — hepsi **canonical projection contract** etrafında. MK-2: Harness’ın üretimle **aynı π / aynı `piHash` (policy fingerprint)** üzerinde birleşmesi; `validate(trace) = trace` yalnızca **V = π** ile anlamlıdır.

---

*MK-1 v0.1 — Deterministic Trace Acceptance Boundary Layer; commit-time physics filter; `H_canon` ∈ `[a-f0-9]{64}`; computation sonrası kabul filtresi.*
