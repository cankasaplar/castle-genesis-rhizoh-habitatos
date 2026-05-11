# RBL-D1 — Divergence Semantics Engine v1

**Rol:** [RBL-τ Lineage](RBL_TAU_LINEAGE_LAYER_V1.md) genealogy’yi tanımlar; **çatışma anlambilimi** (divergence) olmadan sistem **yarım** kalır. RBL-D1, **çoklu meşru epistemik yol** kabul eden fakat **sınıflandırması ve çözüm politikası kapalı** bir motor sözleşmesidir — “tek anlatı” zorlaması yok; **kontrollü çoğulluk** var.

**Sürüm:** RBL-D1  
**Durum:** `NORMATIVE_TARGET` — spec-iskelet; runtime closure **sonraki faz**.  
**Önkoşul:** [RBL-1](RBL_1_REALITY_BRIDGE_LAYER_V1.md) · [RBL-τ Binding](RBL_TAU_BINDING_LAYER_V1.md) · [RBL-τ Lineage](RBL_TAU_LINEAGE_LAYER_V1.md) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)  
**İlişkili:** [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) · [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md)

---

## 0. Problem uzayı

Lineage katmanı şunu **kanıtlar**: aynı normalize signal, farklı `witnessSet` → farklı `artifactHash` / `finalHash` — ikisi de MK-1 yapısal olarak geçerli olabilir ([`rtbContextualDeterminism`](../scripts/mk1StressHarness.mjs)).  

RBL-D1 şunu **tanımlar**:

- Bu farklılık **ne anlama gelir** (ontoloji)?
- **Çatışma** ne zaman **zararsız çoğulluk**, ne zaman **çözüm gerektiren divergence**?
- **Fork** sonrası **reconciliation** hangi kurallarla yapılır?

---

## 1. Witness conflict ontology

**Hedef:** Tanık düzeyinde çelişki sınıfları (örnek taslak — kesin enum RBL-D1.1’de dondurulur):

| Sınıf (taslak) | Özet |
|------------------|------|
| **W-INDEPENDENT** | Aynı `payloadHash` altında tanık kümesi farklı ama RBL mühürleri tutarlı; Lineage zaten ayrı τ üretir — “conflict” değil, **parallel observation lineage**. |
| **W-EXCLUSIVE** | Aynı iddia için karşılıklı dışlayıcı tanık iddiaları; append-only ledger’da **ikisi de kalır**, πEFC / PAG **hangi τ’nin üretim için seçildiğini** ayırır. |
| **W-VOID** | Tanık yok veya mühür ihlali — RBL-I2 / seal failure; **fail-closed**. |

İlişki: [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) **DISSENT_CAPTURE** — minority witness **silinmez**; divergence motoru dissent’i **sınıfına** oturtur.

---

## 2. π split taxonomy

**Hedef:** [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) hücreleri ile hizalı **π ayrışması** tipleri:

- **π-SELF** — aynı `piHash` hattı.
- **π-NON_BREAKING** — üretim anlamında genişleme; matris + epoch politikası.
- **π-BREAKING** — ayrı genealogy zorunlu; **aynı τ kimliği iddiası** düşer.
- **π-INCOMPARABLE** — karşılaştırma yok; divergence **policy-bound**, sessiz birleştirme yok.

RBL-D1, πEFC `DECISION_CLASS` ile **çakışmadan** okunur: ayrı karar yüzeyi, aynı **sınıflandırma sözlüğü**ne bağlanır.

---

## 3. Epoch fork resolution rules

**Hedef:** [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) — dual-read, CUT_OVER, `authorityEpochId` vs `traceEpochId`:

| Durum | Normatif yön (taslak) |
|--------|------------------------|
| **Fork (aynı kök, farklı epoch hikâyesi)** | `rblEpochLineage` farklılığı zaten farklı `finalHash`; “merge” yalnız **yeni commitment** ile, overwrite yok (RTBL-I4). |
| **Dual-read ihlali** | MK-1 / πEFC zaten ret veya `UNDEFINED` politikası; RBL-D1 **sınıf etiketi** verir (`E-DUAL_READ_GAP` gibi — closure RBL-D1.1). |
| **CUT_OVER sonrası replay** | Tarihsel π replay [PAG / Compat hattı](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md); divergence = **hangi epoch’ta hangi τ’nin authoritative sayıldığı** — governance bundle ([PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)). |

---

## 4. “Valid contradictions” — aynı kök, farklı truth path

**Tanım:** “Truth” burada **oracle gerçeklik** değil — **taahhüt edilmiş epistemik çözüm** (committed resolution): aynı `rblArtifactRoots` multiset’ine **naif olarak** yaklaşıldığında özdeş sanılan durumlar, **farklı `rblWitnessCommitment` veya `rblEpochLineage`** ile **farklı `finalHash`** üretir ([RBL-τ Lineage §2](RBL_TAU_LINEAGE_LAYER_V1.md)).

RBL-D1 burada sınıflandırma sağlar:

- **V-CLASS-I** — Kasıtlı çoğulluk (contextual determinism); ikisi de **structurally valid**.
- **V-CLASS-II** — Biri veya ikisi **governance / seal** ihlali; biri reddedilir.
- **V-CLASS-III** — **Reconciliation** gerektirir (ör. yeni üst `LineageCommitment` veya PAG kararı).

**Çözüm eylemleri** (nasıl seçilir / ayrılır / arşivlenir) **[RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md)** ile tanımlanır — D1 yalnızca sınıf.

Kesin enum ve `RBL_DIV_ERR_*` closure **implementasyon sürümünde**.

---

## 5. Mimari konum

```text
RBL-1   → perception (noise → witness)
RBL-τ   → genealogy (history construction)
RBL-D1  → divergence (classify the fork)
RBL-R1  → resolution (policy: select / separate / reconcile & archive)
RBL-G1  → governance binding (who, veto/freeze, epoch, authority split)
RBL-A1  → authority evolution (GCS version, drift, multi-G1 coexist, epoch–authority sync)
MK-1 / πEFC → judgment (accept / reject / class)
```

**Tek cümle:** Sistem **“truth engine”** değil — **history-consistent epistemic runtime**; RBL-D1 **adlandırır**, [RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) **eylem politikası** verir, [RBL-G1](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) **yetkiye bağlar**, [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) **bağın zaman içi tutarlılığını** tanımlar.

---

## 6. Sonraki repo adımları

- `RBL_DIV_*` veya `RBL_D1_*` kapalı hata / sınıf enum’u.  
- `classifyDivergence(τ_a, τ_b, context)` veya ledger-seviye **event** şeması.  
- Stress: çift τ, aynı kök naive, farklı commitment → sınıf V-CLASS-I.  
- **[RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md)** — `resolveVClass` / `RBL_RES_ACTION_*` implementasyonu.  
- **[RBL-G1](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md)** — bundle / roller / epoch ile bağlama.  
- **[RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md)** — G1 kısıt sürümü, drift, çoklu G1, sınır senkronu.

---

**Mühür (RBL-D1):**

> **Plurality without chaos — classify the fork.**

---

*RBL-D1 — Divergence Semantics Engine; witness conflict ontology, π split taxonomy, epoch fork rules, valid contradiction classes.*
