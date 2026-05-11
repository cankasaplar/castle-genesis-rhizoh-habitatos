# πEFC Runtime Formal Spec v1.0

**Rol:** **Closure document** — Phase 2 mimari **kapanış yüzeyi**: πEFC operatörü, saflık / determinizm / önbellek / kısmi değerlendirme / replay / **MK-1 entegrasyon sözleşmesi** / epoch güvenliği / **hata closure**. Bu belge **ispat makinesi** değil; **engineering-grade** invariant + proof sketch + repo ile hizalı implementasyon kancaları.

**Sürüm:** πEFC-Runtime-1.0  
**Durum:** `NORMATIVE_TARGET` — **Final Immutable Core** (aşağı §0) ile **Versioned Governance Surface** bilinçli ayrımı.  
**Referans kod:** [`scripts/mk1Validate.mjs`](../scripts/mk1Validate.mjs) — πEFC genişletilmiş çağrı; [`scripts/mk1StressHarness.mjs`](../scripts/mk1StressHarness.mjs) — epoch / matris / dual-read / tarihsel π senaryoları.  
**İlişkili:** [**PCEK-1**](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) · [**PAG-1**](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [**CGR-1**](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [**RBL-1**](RBL_1_REALITY_BRIDGE_LAYER_V1.md) · [**RBL-τ Binding**](RBL_TAU_BINDING_LAYER_V1.md) · [**RBL-τ Lineage**](RBL_TAU_LINEAGE_LAYER_V1.md) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [MK-1 §11](MK1_KERNEL_VALIDATOR_V0_1.md) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) · [GDK-1](GLOBAL_DETERMINISM_KERNEL_V1.md) · [EBVM-1](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md)

---

## 0. Phase 2 kapanış — iki yüzey

**“Final immutable spec”** ifadesi **tüm sistemi** dondurmaz. Bilinçli olarak **versioned evolution** taşıyan katmanlar vardır (π **evolution** [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md), **compatibility matrix** [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md), **governance epoch** geçişleri).

| Yüzey | Ne dondurulur? |
|--------|----------------|
| **Final Immutable Core Spec (v1.0)** | **Çekirdek cebir + boundary contract** — aşağı §0.1 beşli. |
| **Versioned Governance Surface (evolvable)** | π sürümleri, M hücreleri, migrasyon politikaları, müzakere protokolleri — **yayımlanan** artefakt olarak değişir; çekirdek **nasıl birleştirileceğini** değiştirmez. |

**Analoji:** **constitution frozen** · **civilization evolvable** — açık yüzeyler “eksik” değil; **intentionally open**.

Bu ayrım sayesinde sistem: **dogmatik değil** (tüm anlam donmuyor) · kötü anlamda **drift’e açık değil** (çekirdek boundary sabit) · **governance-aware** (evrim yüzeyi bilinçli).

### 0.1 Final Immutable Core (frozen)

| # | Katman | Kilit |
|---|--------|--------|
| 1 | **EMCS** — execution contract | Manifest / gate sözleşmesi ([`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md)). |
| 2 | **CSB** — binding algebra | Kompozisyonel semantik bağlama ([`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)). |
| 3 | **GDK** — deterministic ordering | Zaman / sıra kernel ([`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md)). |
| 4 | **EBVM** — canonical trace generation | `evaluateBind` VM, izlenebilir yürütüm ([`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md)). |
| 5 | **MK-1** — acceptance | Range-based accept / reject ([`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md)). |
| 6 | **πEFC** — atomic decision semantics | `Decision = f(τ, π, epoch, clock)`; birleşik karar yüzeyi ([piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)). |

**Zincir özeti:** EMCS → CSB → GDK → EBVM → MK-1 → (UCFC / piEMS / Compat ile hizalı) **πEFC** — **Projection-Constrained Deterministic Decision Kernel** (**PCDDK**): *contract-bound deterministic judgment machine*; “truth engine” metafiziği yok.

### 0.2 Versioned Governance Surface (evolvable)

- **π authority** evolution · **epoch** migration · **compatibility** governance · **civilization** semantics (yayımlanan πEMS / Compat / müzakere artefaktları).

Bunlar çekirdeği **iptal etmez**; çekirdek **nasıl birleştirileceğini** tanımlamaya devam eder.

### 0.3 Phases (mühür durumu)

| Faz | İçerik | Durum |
|-----|--------|--------|
| **Phase 1** | Constitutional algebra (EMCS, CSB, CIL hizası) | ✅ |
| **Phase 2** | **PCEK-1 Frozen** — execution + validation / decision kernel (GDK, EBVM, MK-1, πEFC, Phase 2.5 ANF/π) | ✅ ([`PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md`](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md)) |
| **Phase 3** | **Evolvable Civilization** — PAG-1, RBL-1, Civil Ledger, … | ⏳ |

**Rhizoh Core:** Phase 2 = [**PCEK-1 bootable kernel** mühürlendi](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md); sonrası “core icadı” değil, **medeniyet yüzeyi** (governance, köprü, ledger).

### 0.4 İsimlendirme (semantik netlik)

- **`evaluateBindIndexed`** — adlandırılmış **sovereign** yüzey ([`evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs)). **`mk1Validate`** — tarihsel isim; **primitive acceptance kernel** + πEFC adapter ([`mk1Validate.mjs`](../scripts/mk1Validate.mjs)).

---

## 0.5 Closure checklist (bu belgenin mühürlediği maddeler)

| Madde | Bölüm |
|--------|--------|
| **Signature** | §1, [piEFC-1 §1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) |
| **Purity invariant** | §9.1 |
| **Deterministic theorem (engineering)** | §2.1, §7, §9.2 |
| **Memoization rule** | §2.2, §9.3 |
| **Partial evaluation boundary** | §2.3, §9.4 |
| **Replay immutability** | §2.4, §9.5 |
| **MK-1 integration contract** | §9.6, [`mk1Validate.mjs`](../scripts/mk1Validate.mjs) |
| **Epoch transition safety** | §7 (tablo), [piEMS §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) |
| **Error closure** | §9.7, `MK1_ERR_*` genişlemesi |
| **DecisionClass ∈ D** | §9.8, `DECISION_CLASS` |

### 0.6 Phase 2.5 closure artifacts (runtime)

Üç modül — **docs ↔ runtime** simetrisi; sovereign yüzey + primitive kernel:

| Modül | Rol |
|--------|-----|
| [`scripts/anfReduce.mjs`](../scripts/anfReduce.mjs) | `anfReduce` → ⟨π,σ,ι,γ,μ⟩; `anfExpectedOpId` = ANF commitment (`opId`). |
| [`scripts/projectPi.mjs`](../scripts/projectPi.mjs) | UCFC **π(trace)** — idempotent, deterministic; root `H_canon(π(body))`. |
| [`scripts/evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs) | **Sovereign API:** `(τ, π_authority, epoch_ctx, clock_ctx, manifest [, M [, authorityBundle]])` → πEFC outcome; opsiyonel **PAG-1** bundle ön kapısı (`PAG_ERR_*`); `mk1Validate` altında **validator primitive**. |
| [`scripts/witnessArtifact.mjs`](../scripts/witnessArtifact.mjs) | **RBL-1:** dünya sinyali → `sealWitnessArtifact` → `WitnessArtifact` (`payloadHash`); ledger `appendWitnessArtifact` ([RBL-1](RBL_1_REALITY_BRIDGE_LAYER_V1.md)). |
| [`scripts/rblBindTau.mjs`](../scripts/rblBindTau.mjs) | **RBL-τ:** `bindTraceFromArtifacts` (`rblWitnessCommitment`, `rblEpochLineage`, `RBL_TAU_BINDING_0_2`) — [Binding](RBL_TAU_BINDING_LAYER_V1.md) · [Lineage](RBL_TAU_LINEAGE_LAYER_V1.md). |

---

## 1. πEFC operatör kimliği

**πEFC** (π-indexed evaluation function contract), aşağıdaki **epoch-indexed deterministic evaluation operator** olarak okunur:

```text
πEFC : (τ, π, epoch, clock) → (mk1Result, compatibilityClass)
```

([piEFC-1 §1–2](PI_INDEXED_EVALUATION_CONTRACT_V1.md) ile aynı imza; çıktı `EvaluationOutcome` içinde toplanır.)

**Kritik kayma:** πEFC **truth üretmez**; **decision consistency** üretir — aynı genişletilmiş bağlamda **aynı birleşik karar**. Bu, “truth engine” değil; **contract-bound decision engine** ([`MK1` §11](MK1_KERNEL_VALIDATOR_V0_1.md), PCEK).

**Sistem durumu (özet):** **Epoch-indexed deterministic semantic evaluation kernel** — karar mutlak değil; **sözleşmeye bağlı** (π, M, MK-1, GDK).

---

## 2. Dört maddelik runtime spec (gerçek anlam)

### 2.1 Determinism guarantee

**Okuma:** Yalnız “kod saf fonksiyon” değil — **pure function constraint** genişletilmiş **durum uzayı** üzerinde:

**Genişletilmiş bağlam:** `π` + `epoch` + `clock` birlikte **extended state space closure** oluşturur; determinizm **yalnız input byte eşitliği** değil, **contextual determinism**:

Aynı `(τ, π, epoch_ctx, clock, M)` → aynı `EvaluationOutcome` ([piEFC-1 §5](PI_INDEXED_EVALUATION_CONTRACT_V1.md)).

### 2.2 Cross-epoch memoization

**Önerilen önbellek anahtarı (kavramsal):**

```text
cacheKey = H(τ ⊕ π ⊕ epoch)
```

(⊕: kanon birleştirme / serileştirme; H: uygun hash — `H_canon` ailesi ile hizalanabilir.)

**Anlam:** Sistem **truth cache** değil; **decision cache** — önbelleklenen **ontoloji** değil, **πEFC çıktı sınıfı**. **Epistemic cost** → tekrarlanan bağlamda **amortized computation** (aynı kararın yeniden hesaplanmaması).

**Sınır:** Kısmi değerlendirme (§2.3) sırasında **final** `EvaluationOutcome` önbelleğe **yazılmamalı** (premature classification).

### 2.3 Partial evaluation boundary

**Güvenlik / semantik sınır:** **Streaming** veya kısmi trace akışında:

- **No finality** — τ henüz kapanmadan “nihai accept” yok.  
- **No premature classification** — MK-1 öncesi **tekil** `compatibilityClass` ile üretim kararı bağlanmaz.

**Sabitleme:** **evaluation = stateful until closure event** — kapanış olayı **MK-1 gate** (trace gövdesi + `finalHash` / kabul filtresi hazır) ile hizalanır ([`MK1`](MK1_KERNEL_VALIDATOR_V0_1.md)).

### 2.4 Replay semantics

**OS-benzeri katman:** **Decision immutability** — bir kez **closure** altında üretilmiş `EvaluationOutcome`, **aynı** `(τ, π, epoch, clock, M)` ile replay’de **değişmez** (governance dışı).

**Ayrım (kritik):**

| Katman | Replay’de immutable mi? |
|--------|-------------------------|
| **Decision / outcome** (πEFC çıktısı) | Evet — aynı bağlamda sabit. |
| **Interpretation layer** (π evolution, yeni epoch, yeni M) | Hayır — **πEMS** zaman içi sözleşme değişir; bu **yeni** bir πEFC bağlamıdır, outcome’un “bozulması” değil. |

---

## 3. Sovereign decision function (teknik okuma)

Kompakt form:

```text
D = πEFC(τ, π_auth, E, C)
```

**Doğru teknik okuma:** **D** = *deterministic evaluation over a versioned semantic manifold* — **π_auth** ve **E** (epoch) manifold seçimidir.

**“Sovereign” burada politik değil:** anlamı **single-source-of-decision** (tek çağrıda birleşik D) — **single-source-of-truth değil** ([`MK1` §11](MK1_KERNEL_VALIDATOR_V0_1.md), PCEK).

---

## 4. Self-validation düzeltmesi (kritik)

**Yanlış eksik cümle:** “Sistem kendi kendini denetliyor.”

**Gerçek form:** **Rhizoh** (veya bu stack’i taşıyan runtime) **does not self-validate** in the sense of grounding truth. It **evaluates under a fixed externalized contract system**: **(π, MK-1, Compat, GDK)** — ve bunların **yayımlanmış** sürümleri.

- Sistem kendini **doğrulamıyor** (içsel truth üretmiyor).  
- Sistem **aynı dışsallaştırılmış kurala göre yeniden değerlendiriyor** — replay = **rule re-application**, not self-proof.

---

## 5. Matematiksel çekirdek (bileşen rolleri)

| Bileşen | Rol (fonksiyon sınıfı) |
|---------|-------------------------|
| **πEFC** | **Projection-indexed evaluation operator** |
| **MK-1** | **Acceptance predicate** (range membership) |
| **Compat-1** | **Classification function** M[i,j] |
| **GDK** | **Total ordering / clock constraint** (C) |
| **πEMS** | **Contract evolution function** (epoch geçişleri, CUT_OVER) |

**Birleşik karar formu:**

```text
Decision ∈ { Accept, Reclassify, Reject }   // Reclassify = migration / BREAKING yolu, explicit
Decision = f(τ, π, epoch, clock)             // f ≡ πEFC tabanlı birleşik pipeline
```

*(“Reclassify” üretim politikası: piEMS + Compat-1 ile doldurulur; πEFC çıktısı bunu compatibility + mk1 ile kodlar.)*

---

## 6. “Tekillik” hissi — gerçek kaynak

Gözlenen: **branching logic** azalır, **multi-path evaluation** tek yüzeyde toplanır, ayrı **reconciliation layer** ihtiyacı πEFC içinde **absorbe** edilir.

Bu **singularity** değil; **reduction to a single evaluation manifold** — tek manifoldta **contextual** determinizm, evrensel tek truth değil.

---

## 7. Mühendislik teoremleri / invariant’lar (kilitleme hedefi)

Aşağıdakiler **πEFC Execution Algebra Specification** (bir sonraki belge) için **yükümlülük** listesidir; burada **engineering form** olarak sabitlenir.

| Öğe | İçerik (hedef) |
|-----|----------------|
| **Determinism theorem** | ∀ sabit `(τ, π, epoch, clock, M)`, πEFC tek `EvaluationOutcome` — proof sketch: MK-1 determinizm + M sabit + GDK clock injektif politikası. |
| **Cache correctness** | `cacheKey = H(τ⊕π⊕epoch)` altında hit ⇒ outcome eşitliği; invalidation = epoch / M / π sürüm değişimi. |
| **Epoch transition safety** | CUT_OVER / dual-read ([piEMS §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)) ile **sessiz** outcome değişimi yasak; etiket zorunlu. |
| **MK-1 + Compat idempotence** | Aynı closure sonrası πEFC tekrar çağrısı → aynı D (immutable decision layer §2.4). |

---

## 8. Sonraki belge: πEFC Execution Algebra Specification

**Eksik formal parça (tam runtime closed system):** operasyonların **cebirsel** sırası, **evaluation order invariance** (mühendislik ispat formu), streaming / partial eval ile cebir **sınırı**, ve §7 maddelerinin **tam** proof sketch / test vektörleri — evaluation order invariance proof, cache correctness theorem, epoch transition safety invariant, MK-1 + Compat idempotence guarantee.

---

## 9. Implementation contract (MK-1 + πEFC)

### 9.1 Purity invariant

πEFC genişletilmiş çağrıda **yan etki yok**: `mk1Validate` yalnızca verilen `(τ, manifest, clock, π, epoch, M)` üzerinde **saf** değerlendirme üretir; global mutable policy state **okuma** dışında mutation yapmaz (M artefaktı çağıranın sorumluluğunda).

### 9.2 Contextual determinism (theorem — engineering form)

∀ sabit `(τ, π_authority, epoch_ctx, clock, M)` ve sabit `mk1Validate` sürümü: çıktı **tek** `EvaluationOutcome` / `PiefcOutcome`. Kanıt iskeleti: `runMk1Structural` deterministik + `resolveCompatibility` saf fonksiyon + GDK clock politikası injektif.

### 9.3 Memoization rule

Önerilen `cacheKey = H(τ ⊕ π ⊕ epoch)` — **decision cache**; invalidation: `M` sürümü, `piHash`, epoch etiketi değişimi. Kısmi eval (§2.3) sırasında **final** outcome yazılmaz.

### 9.4 Partial evaluation boundary

Streaming τ için **closure** (MK-1 gate) öncesi `DECISION_ACCEPT_SELF` / `DECISION_ACCEPT_NON_BREAKING` **yasak**; yalnızca `DECISION_PARTIAL_VALID` / `DECISION_PENDING` (MK-1.1) kullanılabilir. πEFC nihai kabul sınıfları yalnız **kapalı** trace üzerinde.

### 9.5 Replay immutability

Aynı closure bağlamında replay → aynı **decision**; π / M **evrimi** yeni bağlamdır, eski outcome’un bozulması değildir.

### 9.6 MK-1 integration contract

**Legacy:** `mk1Validate(trace, manifest, clock)` → `Mk1Ok | Mk1Err`.

**πEFC:** `mk1Validate(trace, { manifest, clock, piAuthority?, epochContext?, compatibilityMatrix? })` → yapısal `mk1` + `compatibility` + `decisionClass` + `witness?` + `piEfcCode?` ([`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md)).

**Rol:** `mk1Validate` πEFC modunda **reference evaluator** — isim tarihsel; fonksiyon **sovereign decision surface**’e oturur (§0.4).

Yapısal ret öncelikli; governance katmanı yapısal geçer trace’te **ek** ret üretebilir (`piEfcCode`).

### 9.7 Error closure

Yeni kodlar yalnız `MK1_ERR` içinde tanımlıdır — **dynamic error yasak** (runtime closure). πEFC: `PROJECTION_AUTHORITY_MISMATCH`, `COMPAT_MATRIX_UNDEFINED`, `EPOCH_BINDING_MISSING`, `DUAL_READ_WITNESS_MISSING`.

**İllegal semantic state yok:** tanımsız / bağlanamayan durum → **explicit** `piEfcCode` + `DECISION_REJECT_*` / `REJECT_UNDEFINED_POLICY` ([`mk1StressHarness.mjs`](../scripts/mk1StressHarness.mjs) adversarial suite).

### 9.8 `decisionClass` — frozen enum **D** (closure)

**Invariant:** `decisionClass ∈ D` — runtime yeni string **üretemez**; yalnız [`DECISION_CLASS`](../scripts/mk1Validate.mjs) üyeleri. Bilinmeyen değer → **throw** (decision closure violation).

| Üye (`DECISION_CLASS.*`) | Anlam (v1.0 eşlemesi) |
|--------------------------|------------------------|
| `ACCEPT_SELF` | `compatibility === SELF`, yapısal `mk1` geçer. |
| `ACCEPT_NON_BREAKING` | `NON_BREAKING`, yapısal `mk1` geçer. |
| `REJECT_BREAKING` | `BREAKING`, yapısal `mk1` geçer; üretim **reclassify / migration** politikası. |
| `REJECT_INCOMPARABLE` | `INCOMPARABLE`, yapısal `mk1` geçer; yüzey dışı. |
| `REJECT_UNDEFINED_POLICY` | πEFC ön-kontrol ret (projection / matris / epoch / dual-read) **veya** yapısal `mk1` ret — *undefined policy / non-commit* bucket. |
| `PENDING` | Ayrılmış (async / çok adımlı pipeline; MK-1.1+). |
| `PARTIAL_VALID` | Ayrılmış (streaming; MK-1.1+). |

---

*πEFC-Runtime-1.0 — epoch-indexed deterministic semantic evaluation; decision engine, not truth engine; Final Immutable Core + Versioned Governance Surface.*
