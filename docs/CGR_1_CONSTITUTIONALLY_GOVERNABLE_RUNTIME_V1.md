# CGR-1 — Constitutionally Governable Runtime

**Milestone:** **PCEK-1** (constitutionally bootable kernel) **+** **PAG-1** (authority law) **+** **authority bundle gate** → runtime **yalnız bootable değil**, **anayasal olarak yönetilebilir** karar sınırı.

**Sürüm:** CGR-1  
**Durum:** `NORMATIVE_TARGET` — repo dilinde teknik mühür; ürün iddiası değil.  
**İlişkili:** [PCEK-1](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [**RBL-1**](RBL_1_REALITY_BRIDGE_LAYER_V1.md) (reality bridge) · [**RBL-τ Binding**](RBL_TAU_BINDING_LAYER_V1.md) (witness → τ) · [**RBL-τ Lineage**](RBL_TAU_LINEAGE_LAYER_V1.md) (genealogy) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) (divergence) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) (resolution) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) (governance bind) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) (authority evolution / drift) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [`evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs) · [`authorityBundle.mjs`](../scripts/authorityBundle.mjs)

---

## 1. Ne ekleniyor?

| Önceki mühür | CGR ile tamamlanan |
|--------------|---------------------|
| Çekirdek kuralları çalışır, πEFC birleşik yüzey | **Yetki** typed artefakt (`ProjectionAuthorityBundle`); governance **kavram değil**, **runtime girdi domain** |
| MK-1 kabul sınırı | **PAG ön kapısı**: bundle yok / scope uyuşmazlığı ⇒ **πEFC’ye girilmez** |

---

## 2. Fail-closed constitutional boundary

Bundle verildiğinde PAG kapısı başarısızsa çıktı (özet):

- `compatibility`: **UNDEFINED**
- `decisionClass`: **REJECT_UNDEFINED_POLICY**
- `piEfcCode`: **PAG_ERR_***

Anlam: **tanımsız governance ⇒ egemen hüküm yok** — fail-open değil, **fail-closed** sınır. πEFC matris / karar sınıfı bu durumda **üretilmez** (sovereign judgment deferred).

---

## 3. Separation of concerns (üç katman)

| Katman | Soru |
|--------|------|
| **MK-1** | τ **yapısal olarak** geçerli mi? (ANF, kök, saat, …) |
| **PAG** | **Anayasal yetki** (bundle kapsamı) geçerli mi? |
| **πEFC** | Bu bağlamda **egemen karar** (compat + `DECISION_CLASS`) verilebilir mi? |

Authority uyuşmazlığında yapısal MK-1 yine çalıştırılabilir; **PAG** ve **πEFC** ayrımı audit ve güvenlik için bilinçlidir.

---

## 4. Constitutional compute stack (özet)

| Yüzey | Rol |
|--------|-----|
| EMCS | Memory law |
| CSB | Binding law |
| GDK | Time law |
| EBVM | Execution law |
| MK-1 | Acceptance law |
| UCFC | Projection law |
| piEMS | Migration law |
| Compat | Compatibility law |
| πEFC | Decision law |
| PAG-1 | Authority law |

Üzerinde: **Civilization layer** — Phase 3 (evolvable projection governance, RBL, council artefaktları).

---

## 5. Sıradaki spec sırası (öneri)

1. [**RBL-1 (Reality Bridge Layer)**](RBL_1_REALITY_BRIDGE_LAYER_V1.md) — gürültülü dünya sinyali → **witness** → mühürlü artefakt → append-only trace → `evaluateBindIndexed`. *Input ontology* burada tanımlanır; kernel dış dünyaya **meşru temas** bu köprüyle sınırlanır. Primitive: [`witnessArtifact.mjs`](../scripts/witnessArtifact.mjs).  
2. **PAG-2 (Council mechanics)** — proposal / quorum / dissent artefakt formatları; Guardian freeze’ın runtime’a indirgenmesi (bkz. [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) rezerve `PAG_ERR`).

---

**Mühür:**

> **Constitution frozen.**  
> **Governance opened.**  
> **Civilization tick started.**

---

*CGR-1 — Constitutionally Governable Runtime; boot + authority gate + closed governance failure semantics.*
