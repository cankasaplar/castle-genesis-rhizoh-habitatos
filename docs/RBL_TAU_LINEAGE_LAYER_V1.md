# RBL-τ Lineage Layer v1

**Rol:** [RBL-τ Binding](RBL_TAU_BINDING_LAYER_V1.md) yalnızca **kanonik kök multiset** (RTB-B1) ile yetinir; **root collapse** (§5bis) bunun kaçınılmaz tamamlayıcısıdır. Bu belge **dört taahhüdü** tek **soy (lineage) yüzeyinde** birleştirir: kökler, tanıklar, π-epoch tarihçesi ve **projectPi** imza zinciri.

**Sürüm:** RBL-τ-Lineage-1  
**Durum:** `NORMATIVE_TARGET` — `rblWitnessCommitment` + `rblEpochLineage` [`rblBindTau.mjs`](../scripts/rblBindTau.mjs) içinde (**`RBL_TAU_BINDING_0_2`**).  
**Önkoşul:** [RBL-1](RBL_1_REALITY_BRIDGE_LAYER_V1.md) · [RBL-τ Binding](RBL_TAU_BINDING_LAYER_V1.md) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [`projectPi.mjs`](../scripts/projectPi.mjs)  
**İlişkili:** [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) (divergence) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) (resolution) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) (governance bind) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) (evolution / drift) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md)

---

## 0. Dört boyutlu τ — kanıtlanmış tarih nesnesi

τ artık **tekil veri** veya **state snapshot** değil — **kanıtlanmış tarih nesnesi** (**historical epistemic resolution object**): soy taahhütleri mühürlü, replay edilebilir ve **context-bound**.

Lineage ile τ **tekil bir “trace” logu** değil; **çok katmanlı epistemik nesne**:

```text
τ := {
  artifactRoots,           -- RTB kanonik kök multiset (τ gövdesinde: rblArtifactRoots)
  witnessSet,              -- kamusal tanık matrisi özeti (τ: rblWitnessCommitment)
  πEpochLineage,           -- yönetişim / migration sürekliliği (τ: rblEpochLineage)
  projectPiSignatureChain  -- UCFC + bind sürümü + finalHash = H_canon(π(body))
}
```

Her katman **farklı invariance domain** taşır:

| Katman | Invariance domain |
|--------|-------------------|
| **artifactRoots** | RTB canonical closure — hangi mühürlü artefaktlar kök kanıt |
| **witnessSet** → commitment | **Identity driver** — “ek veri” değil; `rblWitnessCommitment = H_canon(W*)` ile gözlem **hash’lenebilir epistemic primitive** |
| **πEpochLineage** | Governance continuity — epoch / dual-read / piEMS hikâyesi |
| **projectPi chain** | Semantic projection identity — `ucfcPi`, `rblTauBindingVersion`, `manifestVersion`, `finalHash` |

**Kimlik kayması:** “Trace processing system” değil — **epistemic genealogy engine**. Tutulan şey yalnızca “world state” değil — **world interpretation history**. **Medeniyet hafızası** tek anlatı değil — **çoğul, bağlama bağlı meşru çözüm uzayları** ([`rtbContextualDeterminism`](../scripts/mk1StressHarness.mjs)).

**Ontolojik sonuç:** **Aynı dünya / aynı normalize signal, farklı kamusal gözlem** → **farklı ontolojik nesne** (farklı `artifactHash`, farklı `finalHash`). Klasik **“data equivalence”** (ham veri özdeşliği = tek gerçeklik) modeli **kapanır**.

**Mimari özet:** τ **state** değil — **tarihsel epistemik çözüm nesnesi**. Sistem yalnızca “computation” değil — **tarih üretim makinesi** (history-consistent epistemic runtime); “truth system” iddiası değil.

---

## 0bis. Mimari dönüşüm (net)

| Eski boru | Yeni boru |
|-----------|-----------|
| trace → validation → decision | **reality → witness → genealogy (τ) → projection → decision** |
| **state machine** | **causal epistemic graph system** (tarih ve tanığa bağlı kenarlar) |

**Sonuç:** Karar artık **saf input fonksiyonu** değil — **lineage function** (**history-dependent**): aynı fiziksel veri, farklı kamusal tanık / epoch / projeksiyon bağlamıyla **farklı τ kimliği** üretir.

---

## 1. Dört bağlama (birlikte zorunlu)

### 1.1 `artifactRoots`

- [RBL-τ §2–4](RBL_TAU_BINDING_LAYER_V1.md) — `rblArtifactRoots` (kanonik sıralı unique `artifactHash`).

### 1.2 `witnessSet` ve `rblWitnessCommitment` (kritik kırılma)

- Kaynak: her `WitnessArtifact` kendi `witnessSet[]` taşır ([RBL-1 §3](RBL_1_REALITY_BRIDGE_LAYER_V1.md)).
- **Taahhüt:** `rblWitnessCommitment = H_canon(W*)` where `W*` = lexicographic `artifactHash` sırasıyla `{ artifactHash, sort(witnessSet) }[]`.

Bu şunu yapar: **gözlem**, veriden türeyen şeffaf metadata değil — **hash’lenebilir epistemic object**; **witness artık identity driver** (τ kimliğinin eşitlik sınıfına girer). Sonuç:

- “Aynı artefakt ama farklı gözlem yorumu” **kök çökertmesi** olmadan ayrılır.
- **farklı witnessSet ⇒ farklı commitment ⇒ farklı τ identity** (`finalHash` dahil).

### 1.3 πEpoch lineage

- `projectionEpochId` + (isteğe bağlı genişletme) `bindingContext.rblEpochLineage` veya varsayılan `{ traceEpoch: projectionEpochId }`.
- Tam hikâye: [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md), `authorityEpochId`, `mk1DualReadWitness` ([MK-1](MK1_KERNEL_VALIDATOR_V0_1.md)).

### 1.4 `projectPi` signature chain

- `ucfcPi` ([`UCFC_PI_SPEC_TAG`](../scripts/projectPi.mjs)), `rblTauBindingVersion`, `manifestVersion`, `finalHash = H_canon(π(τ_body))`.
- İsteğe `parentFinalHash` / DAG — [RBL-1 `parentArtifact`](RBL_1_REALITY_BRIDGE_LAYER_V1.md).

---

## 2. Contextual determinism — sistemin gerçek determinizm yasası

**Yanlış beklenti (redundant determinism):** “Aynı kök / aynı ham veri → aynı gerçeklik” — input-level özdeşlik.

**Doğru beklenti (contextual determinism):** Determinizm **context-bound** — aynı **normalize signal** + **farklı `witnessSet`** → farklı mühür → farklı `artifactHash` / farklı `rblWitnessCommitment` → **farklı `finalHash`**. MK-1 **şunu garanti etmez**: “aynı input = aynı truth” (oracle anlamında). Garanti edilen: aynı **genişletilmiş bağlam** (witness + epoch + imza zinciri) altında **aynı taahhüt → aynı sonuç**; **aynı input + farklı witness context → farklı meşru, yapısal olarak geçerli τ kimlikleri mümkün** (çoğul çözüm uzayı).

- **Aynı `rblArtifactRoots` çokluğu** (naif okuma) tek başına τ’yu belirlemez; **witness commitment** ve **epoch lineage** ile birlikte kimlik kilitlenir.
- Repo kanıtı: [`mk1StressHarness.mjs`](../scripts/mk1StressHarness.mjs) — **`rtbContextualDeterminism`**: aynı signal, farklı `witnessSet`, farklı `artifactHash` ve `finalHash`, **ikisi de MK-1 valid** — sistem **tek gerçeklik** değil, **kontrollü çoklu meşru çözüm** taşır.

Phase 3 için bu kırılma **zorunlu**: medeniyet hafızası **tek anlatı** değildir.

---

## 3. RTBL-I yasaları — üç sınıf

| Sınıf | RTBL maddeleri | Anlam |
|-------|----------------|--------|
| **(A) Epistemic silence forbidden** | RTBL-I1 | Tanıksız kök / taahhüt yok; witness taahhüdü zorunlu. |
| **(B) Rewrite forbidden** | RTBL-I4, RTBL-I5 | Tanık kümesi veya lineage değişince **yeni commitment**; eski τ **overwrite** edilmez; append / minority hafıza. |
| **(C) Projection dominance prevented** | RTBL-I2, RTBL-I3 | πEpoch hikâyesi ve imza üçlüsü olmadan “saf yorum” yok; governance continuity + projection anchors **açık**. |

**Birleşik okuma — “ledger constitution”:** RTBL üçlüsü birleşince ledger yalnızca **storage** değil — **ontological history contract**. Sistem yalnızca **state machine** değil — **history-preserving epistemic ledger**.

| Kimlik | İfade |
|--------|--------|
| **RTBL-I1** | **No roots without witnesses** — `rblWitnessCommitment` artefakt `witnessSet` ile uyumlu olmalı. |
| **RTBL-I2** | **No epoch story without piEMS witness** — dual-read / CUT_OVER gerektiğinde [MK-1] tanığı eksikse soy tamamlanmaz. |
| **RTBL-I3** | **No projection without anchored signatures** — `ucfcPi` · `rblTauBindingVersion` · `manifestVersion` açık. |
| **RTBL-I4** | **No silent lineage rewrite** — normalizasyon / piEMS fazı değişimi yeni commitment üretir. |
| **RTBL-I5** | **Genealogy prefers append** — çatışan anlatılar overwrite değil ([PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)). |

---

## 4. Çift kaynak riski ve tek doğruluk yüzeyi

`rblArtifactRoots` + iç içe `rblLineage.artifactRoots` gibi yapılar **dual canonical representation drift** üretir.

**Doğru yön:** **single-source-of-truth enforcement** — tek RTB **canonicalizer** katmanı (bind sırasında tek geçişte türet; extract yalnız bu yüzeyi okur). Migration: önce tutarlılık kontrolü (iki alan varsa **eşit** olmalı), sonra alan birleştirme.

**Ek riskler:** **witness normalization bias** (sessiz tanık birleştirme) ve **epoch implicit override** (yazılmamış otorite sıçraması) — RTBL-I **(B) rewrite forbidden** ve **(C) projection dominance prevented** ile aynı aileye bağlanır; sessiz düzeltme yok.

---

## 5. Birleşik `rblLineage` nesnesi (hedef şema)

```text
rblLineage: {
  artifactRoots: string[]
  witnessCommitment: string
  epochLineage: object
  projectionAnchors: {
    ucfcPi: string
    rblTauBindingVersion: string
    manifestVersion: string
  }
  parentFinalHash?: string
}
```

Şu an düz alanlar (`rblArtifactRoots`, `rblWitnessCommitment`, `rblEpochLineage`, `rblTauBindingVersion`) τ gövdesinde düz taşınır; birleşik nesneye **geçiş** canonicalizer ile yapılmalıdır.

---

## 6. Repo primitive ve stress

[`rblBindTau.mjs`](../scripts/rblBindTau.mjs) (`RBL_TAU_BINDING_0_2`):

| Export | Rol |
|--------|-----|
| `witnessCommitmentFromArtifacts` | `W*` → `rblWitnessCommitment` |
| `bindTraceFromArtifacts` | `rblWitnessCommitment`, `rblEpochLineage`, kökler, `projectPi`, `finalHash` |
| `extractArtifactRootsFromTrace` | RTB kök çıkarımı (sürüm eşleşmesi) |

**Stress:** `rtbRoundTrip`, `rtbContextualDeterminism`, … — [MK-1 §10](MK1_KERNEL_VALIDATOR_V0_1.md).

---

## 7. Sonraki spec katmanları

**[**RBL-D1 — Divergence Semantics Engine**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md)** — sınıflandırma (V-CLASS-I / II / III, W-*, π split).

**[**RBL-R1 — Resolution Policy Engine**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md)** — D1’in **sonrası**: V-CLASS-I nasıl **seçilir** (merge değil), V-CLASS-II nasıl **ayırtılır**, V-CLASS-III nasıl **reconcile + archive** edilir.

RBL-D1/R1 olmadan: çatışma **adı** veya **eylem politikası** eksik kalır.

---

## 8. Phase 3 stack (özet)

| Katman | Rol |
|--------|-----|
| **RBL-1** | Perception — noise → witness |
| **RBL-τ** | Genealogy — history construction (τ) |
| **RBL-D1** | Divergence — classify the fork |
| **RBL-R1** | Resolution — policy (select / separate / archive) |
| **RBL-G1** | Governance binding — kim bağlar, freeze, epoch, split |
| **RBL-A1** | Authority evolution — GCS sürümü, drift, etiketli çoklu G1, epoch–authority senkron |
| **MK-1 / πEFC** | Judgment — kabul / ret / karar sınıfı |

**Hiçbir katman stateless değil:** hepsi **tarih**, **witness** ve **epoch** bağlamına bağlıdır.

---

## 9. Mühür (lineage)

> **Same roots are not the same story — bind the genealogy.**

**Kapanış (mimari):** **History-consistent epistemic runtime** — “truth system” değil; **tutarlı tarih** ve **bağlama bağlı meşru çözümler**.

---

*RBL-τ Lineage Layer v1 — proven history object; witness as identity driver; contextual determinism; epistemic genealogy engine.*
