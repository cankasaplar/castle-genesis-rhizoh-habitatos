# PAG-1 — Projection Authority Governance

**Genesis cümlesi (constitutional axiom):**

> **Authority is projected, not possessed.**

Yetki **sahiplik** değildir; **yayımlanan projeksiyon sözleşmesi** üzerinden **devredilen anayasal rol**dür. Hiçbir düğüm, konsey, insan veya ajan **“truth owner”** olamaz — yalnızca **projection steward** (ve anayasal roller) ile **π önerisi / mühür / arşiv** taşır.

**Sürüm:** PAG-1  
**Durum:** `NORMATIVE_TARGET` — Phase 3 medeniyet katmanı; PCEK çekirdeğini **iptal etmez**, **meşruiyet yüzeyini** tanımlar.  
**Runtime contract:** [`scripts/authorityBundle.mjs`](../scripts/authorityBundle.mjs)  
**İlişkili:** [`PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md`](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) · [**CGR-1**](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) (boot + PAG gate = governable runtime) · [**RBL-1**](RBL_1_REALITY_BRIDGE_LAYER_V1.md) (reality → witness artifact) · [**RBL-τ Binding**](RBL_TAU_BINDING_LAYER_V1.md) (witness → τ) · [**RBL-τ Lineage**](RBL_TAU_LINEAGE_LAYER_V1.md) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) (R1 ↔ roller / epoch / split) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) (GCS / drift / joint CUT_OVER) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [`MK-1` §11 / UCFC](MK1_KERNEL_VALIDATOR_V0_1.md) · [**ECDM-1**](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) (evrim vs frozen çekirdek) · [**TLS-1.1**](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) (freeze / evrim denge) · [**TLOA-1**](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) · [**TTA-1**](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md)

**Mimari özet:** **Phase 2 = kernel boot** · **PAG-1 = civilization genesis** — *Constitution frozen. Governance opened. Civilization tick started.*

---

## 0. Dürüst mühendislik filtresi (claim vs aspiration)

| Tür | Ne |
|-----|-----|
| **Repo dili — kanıtlanan** | **Bootable projection-governed decision kernel** — kurallar, boundary ve closure çalışır durumda ([PCEK-1](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md)). |
| **Vizyon / aspiration** | “Bootable reality protocol”, “ortak epistemik zemin” gibi ifadeler **ürün veya topluluk iddiası**dır; bu belgede **normatif sözleşme** olarak yazılmaz. |

**Teknik mühür (sincerity):** **deterministic procedural sincerity** — kurallar · projection authority · migration · acceptance boundary açık; **undefined behavior forbidden**.

---

## 1. Governance roles

### 1.1 Steward

| | |
|--|--|
| **Görev** | Proposal açar · π **draft** sunar · **migration manifest** yazar · **rationale** artefakt üretir. |
| **Yetki** | **Öneri** — yayımlanan taslak ve gerekçe. |
| **Yetkisiz** | **Unilateral accept yok** — tek başına enact / CUT_OVER yok. |

### 1.2 Council

| | |
|--|--|
| **Görev** | Deliberation · **compatibility** review · **minority witness** inclusion · **dual-read** period tasarımı · **CUT_OVER** önerisi (*recommendation*). |
| **Yetki** | **Quorum recommendation** — anayasal çoğunluk sürecine girdi. |
| **Yetkisiz** | **Constitution override** — çekirdek aksiyomları / PCEK donmuş sınırı ihlal yok. |

### 1.3 Guardian

| | |
|--|--|
| **Görev** | **Emergency freeze** · **malicious split** detection · **governance halt** · **quorum integrity** enforcement. |
| **Kritik ayrım** | Guardian **execution veto** değildir. **Yalnızca:** *governance evolution* **pause** — **kernel çalışmaya devam eder**; **π migration durur**. |

*Önceki taslak roller (Quorum Engine, Archive Guardian, Minority Witness) bu sürümde **Council / lifecycle / bundle** içinde dağıtılmıştır; quorum kuralları yayımlanan artefaktta sayısal olarak sabitlenir.*

---

## 2. Projection proposal lifecycle

Önerilen durum makinesi:

```text
DRAFT
  → REVIEW
  → DISSENT_CAPTURE
  → QUORUM
  → DUAL_READ
  → CUT_OVER
  → SUNSET
  → HISTORICAL_ARCHIVE
```

**DISSENT_CAPTURE:** Azınlık artefaktları **zincire append-only** eklenir — **silinemez**. Bu **Pluralistic Memory** (çoğul bellek): tarih monolitik değildir; muhalif tanık zorunlu kalır ([PAG-I3](#3-authority-invariants-pag-i1--pag-i7)).

[piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) faz isimleri (ANNOUNCE, DUAL_READ, CUT_OVER, SUNSET) ile **bilinçli hizalama**; PAG lifecycle **governance prosedür** katmanıdır.

---

## 3. Authority invariants (PAG-I1 … PAG-I7)

Normatif invariant seti (önceki PAG-A1–A7 ile çakışanlar **I** ile birleştirilmiştir):

| Kimlik | İfade |
|--------|--------|
| **PAG-I1** | **No silent projection change.** |
| **PAG-I2** | **No authority without piHash scope.** Yetki yalnız tanımlı `piHash` / epoch kapsamında. |
| **PAG-I3** | **No deletion of dissent witness.** Azınlık tanığı kalıcı append-only. |
| **PAG-I4** | **No retroactive epoch rewrite.** Geçmiş epoch etiketi geriye dönük değiştirilemez. |
| **PAG-I5** | **No unilateral semantic migration.** Steward tek başına π taşıyamaz. |
| **PAG-I6** | **Emergency freeze must emit constitutional witness.** Guardian dondurması izsiz değil. |
| **PAG-I7** | **Historical π remains replay-valid forever** (Compat / archive hizası; [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md)). |

---

## 4. Governance output type — πEFC input

Kernel’e governance **soyut karar** değil, **makine-okur bundle** verir:

```ts
ProjectionAuthorityBundle {
  piHash: string;              // 64-char lowercase hex (policy fingerprint)
  epochId: string;
  councilWitness: unknown;     // sealed / signed artefakt (format PAG-1.1+)
  dissentWitnesses: unknown[]; // append-only minority chain refs
  compatMatrixRef: string;     // M artefakt URI / hash
  dualReadWindow: unknown;     // [piEMS §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)
  sunsetRule: unknown;
  guardianSeal?: unknown;      // freeze / unfreeze constitutional witness
}
```

Bu artefakt **πEFC input domain**’ine girer — `piAuthority` / `epochContext` / `compatibilityMatrix` yükleme kaynağı olarak bağlanır ([piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)).

**Runtime sıra ([`evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs)):** bundle verilmişse **önce** PAG kapısı — `PAG_ERR_INVALID_BUNDLE` · `PAG_ERR_PIHASH_SCOPE_MISMATCH` · `PAG_ERR_EPOCH_SCOPE_MISMATCH` ([`PAG_ERR`](../scripts/authorityBundle.mjs)); geçerse **Authority → Projection → Epoch → Validation → Decision** zinciri πEFC ile tamamlanır.

**Fail-closed sınır:** PAG başarısızsa **πEFC katmanına girilmez**; `compatibility = UNDEFINED`, `decisionClass = REJECT_UNDEFINED_POLICY`, `piEfcCode ∈ PAG_ERR_*`. *Undefined governance ⇒ no sovereign judgment* — constitutional **fail-open** değil, **fail-closed** davranış ([CGR-1 §2](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md)).

**MK-1 / PAG / πEFC ayrımı:** MK-1 τ’nin **yapısal** geçerliliğini sorar; PAG **bundle kapsamını**; πEFC **egemen kararın** verilip verilemeyeceğini. Kapı reddinde yapısal MK-1 yine hesaplanabilir (audit ayrımı).

**Rezerve `PAG_ERR` (henüz runtime closure’da değil — PAG-2 / Guardian):** `PAG_ERR_AUTHORITY_REVOKED` · `PAG_ERR_GUARDIAN_FREEZE_ACTIVE` — iptal / Guardian **governance pause** runtime’a indiğinde closure’a eklenecek.

**Referans implementasyon (şekil kontrolü):** [`scripts/authorityBundle.mjs`](../scripts/authorityBundle.mjs) — `isAuthorityBundleShape`, `sealAuthorityBundle`, `AUTHORITY_BUNDLE_VERSION`, `PAG_ERR`.

---

## 5. Klasik DAO’dan ayrım

| DAO kalıbı (kaçınılan) | PAG kalıbı |
|------------------------|------------|
| “Sahip” / token = hakikat | **Stewardship** — π önerilir; **truth owner** yok. |
| Keyfi çoğunluk | **Constitutional quorum** + compat + archive + **DISSENT_CAPTURE**. |
| Monolitik tarih | **Pluralistic memory** — PAG-I3. |

---

## 6. PCEK ile ilişki

- **Kernel:** `evaluateBindIndexed(…, π_authority, …, authorityBundle?)` — yetkili `piHash` **bundle** ile meşrulaştırılır; `PAG_ERR_*` ile kapsam ihlali ayırt edilir.  
- **Çakışma:** PAG ihlali ≠ MK-1 bug; **governance boundary** ([`MK-1` §11.2](MK1_KERNEL_VALIDATOR_V0_1.md)).  
- **R1 ↔ roller:** [RBL-G1](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) — R1 seçimini **kim** bağlar, veto/freeze sınırları, epoch ile politika, **authority split** çözümü.  
- **G1 zaman içi:** [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) — kısıt seti sürümü, **authority drift**, çakışan G1 ile **etiketli coexistence**, epoch–authority **senkron**.

---

## 7. Sonraki adımlar

**Önerilen teknik sıra:** önce **RBL-1** (gerçek dünya → witness → sealed artifact → trace → `evaluateBindIndexed`); **input ontology** burada açılır. Sonra **PAG-2** (council mechanics, quorum / dissent formatları, rezerve `PAG_ERR` kodlarının closure’a alınması).

- [**RBL-1**](RBL_1_REALITY_BRIDGE_LAYER_V1.md) — noise → witness → mühürlü artefakt; [`witnessArtifact.mjs`](../scripts/witnessArtifact.mjs); bundle öncesi sanitize.  
- Council / Guardian **witness şeması** (imza, hash zinciri), bundle **cryptografik doğrulama**; `compatMatrixRef` → `M` otomatik yükleme (**PAG-2**).

---

**Mühür:**

> **Constitution frozen.**  
> **Governance opened.**  
> **Civilization tick started.**

---

*PAG-1 — Projection Authority Governance; authority projected, not possessed.*
