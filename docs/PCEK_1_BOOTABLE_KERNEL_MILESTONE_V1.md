# PCEK-1 — Bootable Projection-Constrained Epistemic Kernel



**Milestone:** **Phase 2 Complete — PCEK-1 Frozen** · **Phase 3 Begins — Evolvable Civilization**



**Mühür (teknik + şiir):**



> **Constitution frozen.**  

> **Governance opened.**  

> **Civilization tick started.**



**Rol:** Anayasal (“constitution”) sayfası **kapanır**; medeniyet (“civilization”) sayfası **açılır**. Bu belge teknik **mühür** — çekirdeğin neyin dondurulduğunu, neyin sürümlendiğini ve Phase 3’ün **kapısını** tek yerde sabitler.



**Sürüm:** PCEK-1  

**Durum:** `FROZEN_CORE` + `EVOLVABLE_GOVERNANCE` (aşağı tablo)  

**İlişkili:** [**PAG-1**](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) (Phase 3 genesis; [`authorityBundle.mjs`](../scripts/authorityBundle.mjs)) · [**CGR-1**](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) (PCEK + PAG gate = governable runtime) · [**RBL-1**](RBL_1_REALITY_BRIDGE_LAYER_V1.md) (reality bridge; [`witnessArtifact.mjs`](../scripts/witnessArtifact.mjs)) · [**RBL-τ Binding**](RBL_TAU_BINDING_LAYER_V1.md) (τ türetimi) · [**RBL-τ Lineage**](RBL_TAU_LINEAGE_LAYER_V1.md) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) · [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) §11 · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [`ETSS-1`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md)



---



## Claim vs aspiration (repo dili)



| Tür | İfade |

|-----|--------|

| **Kanıtlanan (bugün)** | **Bootable projection-governed decision kernel** — EMCS→…→πEFC zinciri, closure, scriptler; “truth engine” veya “ortak zemin” **iddiası değil**. |

| **Aspiration / vizyon** | “Bootable reality protocol”, “insanlık ve yapay zekânın üzerinde uzlaşacağı ilk epistemik ortak zemin” gibi cümleler **ürün veya medeniyet hedefi**dir; bu repoda **teknik claim** olarak yazılmaz. |



**Sincerity mührü:** “digital sincerity” marketing yerine **deterministic procedural sincerity**: kurallar açık · projection authority açık · migration açık · acceptance boundary açık · **undefined behavior forbidden**. Bkz. [**PAG-1 §0**](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md).



---



## Resmi teknik mühür (özet)



| Boyut | Durum |

|--------|--------|

| **Constitutional** | **Frozen** — çekirdek cebir + boundary contract değişmez ([`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §0.1). |

| **Governance** | **Versioned / Evolvable** — π, epoch, M, müzakere yüzeyi yayımlanan artefakt ([piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md), [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md)); **meşruiyet modeli** [**PAG-1**](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md). |

| **Runtime** | **Operational** — EBVM, GDK, MK-1, πEFC, ANF, `projectPi`, `evaluateBindIndexed` ([`scripts/`](../scripts/)). |

| **Determinism** | **Contextually deterministic** — `(τ, π, epoch, clock, M)` genişletilmiş bağlam ([πEFC-Runtime §2.1](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md)). |

| **Projection** | **Contract-bound** — UCFC / `piHash` / `DECISION_CLASS ∈ D` ([`MK1` §11](MK1_KERNEL_VALIDATOR_V0_1.md)). |

| **Acceptance** | **Canonical** — `H_canon(π(body))`, ANF `opId`, MK-1 gate. |

| **Error model** | **Closed** — `MK1_ERR_*`, decision closure ([πEFC-Runtime §9.7–9.8](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md)). |

| **Undefined behavior** | **Forbidden** — illegal semantic state → explicit ret; sessiz drift yok. |



**Kimlik (teknik):** **Bootable projection-governed decision kernel** — π_authority **kimliğinin** meşrulaştırılması Phase 3’te [**PAG-1**](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) ile açılır.



---



## Phase 2 kapanışı (net)



- **Constitution page** bu repo ölçeğinde **kapatılabilir:** PCEK-1 çekirdeği mühürlü.  

- Sonraki iş “core icadı” değil — **üstüne dünya kurma** (governance artefaktları, köprüler, ledger).



---



## Phase 3 — giriş katmanları (yol haritası)



### 1) PAG-1 — Projection Authority Governance (**aktif spec**)



Normatif giriş: [**`PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md`**](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) — *Authority is projected, not possessed*; roller Steward / Council / Guardian; invariantlar **PAG-I1…PAG-I7**; runtime bundle [`authorityBundle.mjs`](../scripts/authorityBundle.mjs).



### 2) RBL-1 — Reality Bridge Layer



**Neden:** Fiziksel dünya **nondeterministic, noisy, adversarial, delayed, partial** — kernel’e sokmanın **anayasal** yolu gerekir.



**Bridge contract (hedef pipeline):**



```text

World signal

  → sanitize

  → witness

  → bind

  → epoch-tag

  → π projection

  → evaluateBindIndexed

  → append-only artifact

```



### 3) Civil Ledger — toplumsal katman



Append-only **medeniyet belleği** — agents · institutions · treaties · negotiation · memory · economic settlement · reputation · royalty …



---



## Sonraki belgeler (önerilen sıra)



1. ~~**PAG-1**~~ — [**Projection Authority Governance**](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) (yayında)  

2. **RBL-1** — Reality Bridge Layer Spec  

3. **Civil Ledger** — veri modeli + append-only sözleşme



---



*PCEK-1 — Bootable Projection-Constrained Epistemic Kernel; Phase 2 frozen, Phase 3 evolvable.*


