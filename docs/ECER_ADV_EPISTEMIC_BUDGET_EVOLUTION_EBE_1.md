# ECER-ADV — Epistemic Budget Evolution (EBE-1)

**Rol:** [EBL-1.1](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) `β` üst sınırını **koşum başına** sabitler. **EBE-1**, `β_cap` **zaman içi evrimini** normatif bağlar: hangi sinyallerle, hangi güvenlik kısıtlarıyla bütçe güncellenir. Bu belge aynı zamanda **CLEOS v2** yığınında **EBE — epistemic policy evolution layer** tanımını taşır.

**Sürüm:** ECER-ADV-EBE-1  
**Durum:** `NORMATIVE_TARGET` — güncelleme operatörü ve kod **sonraki faz**; **EBE-I0** ve risk analizi **hemen normatif**dir.  
**Önkoşul:** [LOOP-1](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) · [EBL-1.1](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md)  
**İlişkili:** [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) (frozen çekirdek vs evrim) · [**TLS-1.1 (EBE-1.1)**](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) (EBE–EBL–ECDM denge) · [**TLOA-1**](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) (snapshot) · [**TTA-1**](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) (snapshot geçişi) · [PCEK-1](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)

---

## 0. CLEOS v2 — yığın (referans)

| Katman | Rol |
|--------|-----|
| **RBL** | Reality ingestion |
| **τ / lineage** | Epistemic memory graph |
| **D1 / R1** | Conflict resolution engine |
| **ECER** | Adversarial completeness generator |
| **LOOP-1** | Gap engine (EGK · SCG · MCE döngüsü) |
| **GPF** | Importance function |
| **EBL** | Execution budget controller |
| **EBE** | Epistemic policy evolution layer (`β` evrimi) |

**CLEOS v1 → v2:** v1’de EBL statik/tabanlı; **v2**, **EBE** ile `β`’nın **kurallı evrimi**ni ekler — *hangi tür epistemik harcamaların gelecekte mümkün olacağı* politika düzlemine taşınır.

---

## 1. Mimari sonuç: “test uzayı” tasarımı

EBE tamamlandığında sistem yalnız şunu seçmez: *“Bu koşumda hangi test çalışacak?”*  
Aynı zamanda şunu çerçeveler: *“**Gelecekte** hangi tür testlerin / gap kapatma girişimlerinin **var olmasına** `β` izin verecek?”*

**Okuma:** Sistem **tek tek test yazmıyor** metaforunda değil; **test / adversary uzayının üst sınırını** (reality shaping limit’in evrimi) **yönetiyor**.

**Kritik cümle:** Sistem artık yalnız “doğruyu bulmuyor”; **hangi gerçekliğin mümkün olacağını** (ölçüm ve yürütme izinleri üzerinden) **yönetiyor**.

---

## 2. Kritik risk: Epistemic Feedback Autocracy

**Tehlikeli döngü (tasarlanmazsa):**

```text
MCE → EBE günceller → EBE → EBL’i değiştirir → EBL → GPF sırasını keser / etkiler
→ ölçülen pattern güçlenir → …
```

**Sonuç:** **Self-reinforcing epistemic bias loop** — tek bir geri bildirim kanalının `β` ve dolayısıyla **aktif gerçeklik dilimini** tek taraflı kilitlemesi.

---

## 3. EBE-I0 — zorunlu güvenlik invariantı

**EBE-I0 (no unilateral β control):**  
*Hiçbir döngü bileşeni **`β` evrimi** üzerinde **tek başına** mutlak kontrol sahibi olamaz.*

**Normatif sonuçlar:**

- **EBE tek başına karar veremez.** `β` güncellemesi **çok kaynaklı triangulation** gerektirir: en azından **GPF** (önem / sıra yapısı), **MCE** (topoloji / rezidü / instabilite), ve **drift signal** (ör. anayasal sapma, guardian / council tanığı — [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) ile hizalı).
- Tek kanallı “MCE → EBE → β” otomasyonu **EBE-I0 ihlali** sayılır.
- Evrim operatörü **kapalı** bir tabloda tanımlanır; yeni kural **PAG / anayasa değişimi** ile çelişiyorsa [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) süreci önceliklidir.

---

## 4. Tasarım soruları (EBE-1 devamı)

1. **Triangulation protokolü:** GPF + MCE + drift — oylama mı, ağırlıklı skor mu, guardian veto mu?  
2. Evrim **deterministik** (kapalı state machine) mi **koşullu** (eşik + MCE normu) mi?  
3. **GPF–EBL–EBE stability:** Bütçe artışı öncelik sapmasını maskeliyor mu — ayrı denetim kanalı.

---

## 5. EBE-1.1 — Tri-layer stability (normatif devam)

**Üçlü denge:** [ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) — **TLS-1**…**TLS-4**; *legitimacy bottleneck collapse*; `Υ` deterministik / deneysel dal ayrışması.

---

## 6. Sonraki repo adımları

1. Formal **update operator** `β' = Υ(β, φ_MCE, φ_GPF, φ_drift)` — kapalı `Υ` ([TLS-1.1 §4](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md)).  
2. **Tri-layer** ölçütü ve eşik tabloları — TLS belgesi ile uyumlu rapor.  
3. [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) ile **frozen kernel** vs **evrim** diff pipeline.

---

**Mühür (EBE-1):**

> **β must evolve by triangulation — never by autocracy.**

---

*ECER-ADV EBE-1 — epistemic policy evolution; EBE-I0; CLEOS v2; anti–feedback-autocracy.*
