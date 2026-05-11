# ECER-ADV — Tri-Layer Observable Artifact (TLOA-1)

**Rol:** [TLS-1.1](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) üçlü dengeyi **tanımlar**; **TLOA-1** aynı anı **tek**, **dışa aktarılabilir**, **ölçülebilir** nesnede birleştirir — **EBE**, **EBL**, **ECDM** → **tek zaman damgalı epistemik kesit**. Bu, MCE panoları, denetim zinciri ve koşumlar arası **karşılaştırılabilir** iz için normatif şemadır.

**Sürüm:** ECER-ADV-TLOA-1  
**Durum:** `NORMATIVE_TARGET` — alanlar genişleyebilir; `_version` bump ile.  
**Önkoşul:** [TLS-1.1](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) · [EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) · [EBL-1.1](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) · [ECDM-1](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md)  
**İlişkili:** [LOOP-1](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) · [**TTA-1**](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) (snapshot’lar arası hukuk) · [**TTA-1.1**](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) (ikinci mertebe · kural geçişleri) · [**HOGA-1**](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) (kural değişimi bileşimi) · [`ecerTriLayerObservableArtifact.mjs`](../scripts/ecerTriLayerObservableArtifact.mjs)

---

## 0. Amaç (özet)

| Önce | Sonra |
|------|--------|
| Üç katman ayrı loglar | **Tek** `TriLayerEpistemicSnapshot` |
| Karşılaştırma zor | **Canonical** serileştirme + **içerik özeti** (`snapshotContentDigest`) |

---

## 1. Teknik anlam (netleştirme)

### 1.1 Tri-layer projection = tek nesne

**EBE** (evrim), **EBL** (bütçe / yürütme), **ECDM** (meşruiyet / drift) artık **üç ayrı “sistem”** olarak değil, **aynı gözlem nesnesinin** (`TriLayerEpistemicSnapshot`) **üç projeksiyonu** olarak okunur. Hepsi **aynı zaman damgalı epistemik kesitte** kilitlenir.

**Kırılma:** Karşılaştırma ve replay, tek artefakt üzerinden yapılır.

### 1.2 Closure = artifact özelliği; global runtime sorusu değil

**Önceki okuma (kaba):** “Sistem stabil mi?” (global, tek bit).  
**TLOA-1 okuması:** “**Bu snapshot** hangi **stabil bandı** temsil ediyor?”

Stabilite **global tek değer** değil; **snapshot-bazlı** ve **kanıtlanabilir** (`closure.stableBandHint` + ECDM / ledger bağlamı).

### 1.3 `snapshotContentDigest` = epistemik kimlik

`snapshotContentDigest(snapshot)` yalnız “bir hash” değildir; normatif olarak şunları taşır:

| Rol | Anlam |
|-----|--------|
| **Epistemic identity** | İçerik gövdesi aynıysa “öz” aynı kabul edilir (politika: id/timestamp hariç tutma §8). |
| **Tri-layer coherence fingerprint** | Üç projeksiyonun **aynı kesitte** birlikte sabitlendiğinin özeti. |
| **Replay determinism anchor** | Aynı digest → aynı epistemik evren **tanımı** (replay / diff başlangıcı). |

**TLOA-I3:** Aynı sistem kurulumu **farklı** snapshot digest’leri üretebilir; **aynı digest** ⇒ aynı TLOA içerik evreni (canonical payload eşliği).

### 1.4 Gerçek fonksiyon: denetlenebilir zaman kesiti

TLOA-1, **EBE–EBL–ECDM üçlüsünü** tek **denetlenebilir zaman kesiti** haline getirir. Örnek sorular **tek nesne** üzerinden:

- EBE bu kesitte **hangi evrim kapısında**?  
- EBL **bütçe / prefix** ihlali veya taşması var mı?  
- ECDM **meşruiyet** sınıfı ne?

Hepsi **replay** ve **diff** için aynı artefakt üzerinden okunabilir.

---

## 2. Mimari üçlü: Runtime · Governance · Observability

| Katman | Örnek bileşenler | Rol |
|--------|------------------|-----|
| **A) Runtime** (canlı işletim) | GPF, EBL yürütme, EBE evrim motoru | Anlık karar ve kesim |
| **B) Governance** (normatif alan) | ECDM, PAG, authority | Meşruiyet ve çekirdek uyumu |
| **C) Observability** (**TLOA**) | Snapshot, `snapshotContentDigest`, zincir | **Epistemic ledgerization of time** — klasik logging değil; **mühürlenmiş** kesitler |

**TLOA-I4 (öz):** *Gerçeklik = yalnızca “sistem durumu” değil; **gözlemlenmiş ve mühürlenmiş snapshot zinciri** üzerinden tanımlanan epistemik iz.*

---

## 3. Üst şema: `TriLayerEpistemicSnapshot`

Zorunlu kök alanlar:

| Alan | Tip | Anlam |
|------|-----|--------|
| `tloaVersion` | string | Örn. `TLOA_1_0` — şema sürümü. |
| `snapshotId` | string | Koşum kimliği (UUID veya monoton run id). |
| `capturedAt` | string | ISO-8601 zaman damgası. |
| `ebe` | object | **EBE state** (§4). |
| `ebl` | object | **EBL prefix state** (§5). |
| `ecdm` | object | **ECDM legitimacy state** (§6). |
| `closure` | object | **TLS / band özeti** (§7). |

**TLOA-I1 (tamlık):** `ebe`, `ebl`, `ecdm` **aynı snapshot’ta** bulunur; bilinmeyen alt alan `null` veya boş dizi ile **açıkça** işaretlenir.

**TLOA-I2 (denetim deposu):** Snapshot **append-only** veya **imzalı** depoda saklanırsa, `snapshotContentDigest` ile **içerik bütünlüğü** doğrulanır.

---

## 4. `ebe` — EBE state

| Alan | Anlam |
|------|--------|
| `betaCap` | `β` / `β_cap` özeti. |
| `evolutionGate` | `EVOLVE_ALLOWED` \| `FROZEN` \| `PENDING` \| `UNKNOWN`. |
| `lastCommitRef` | Son onaylı `β → β'` referansı veya `null`. |
| `triangulationRecord` | EBE-I0 kanıt özeti / referans. |

---

## 5. `ebl` — EBL prefix state

| Alan | Anlam |
|------|--------|
| `gpfQueueRef` | GPF kuyruk kimliği. |
| `acceptedGapIds` | İşlenmeye izinli prefix. |
| `deferredGapIds` | Ertelenen gap’ler. |
| `ledger` | [EBL-1.1](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) ledger özeti. |
| `budgetDimensionsConsumed` | İsteğe bağlı tüketim özeti. |

---

## 6. `ecdm` — Legitimacy state

| Alan | Anlam |
|------|--------|
| `legitimacyClass` | `POLICY_EVOLUTION_OK` \| `CONSTITUTIONAL_DRIFT` \| `AMBIGUOUS` \| `UNKNOWN`. |
| `bottleneckSignal` | TLS bottleneck göstergesi. |
| `coreVersionRefs` | PCEK / PAG / piEFC vb. referanslar. |
| `driftReportRef` | ECDM raporu URI/hash veya `null`. |

---

## 7. `closure` — Band özeti

| Alan | Anlam |
|------|--------|
| `stableBandHint` | `IN_BAND` \| `FREEZE_RISK` \| `DRIFT_RISK` \| `UNKNOWN`. |
| `tlsNotes` | İsteğe bağlı gerekçe. |

---

## 8. `snapshotContentDigest` (programatik)

- **Girdi:** `tloaVersion` + `ebe` + `ebl` + `ecdm` + `closure` — deterministik kanonik JSON.  
- **Çıktı:** `sha256:hex` (referans: [`ecerTriLayerObservableArtifact.mjs`](../scripts/ecerTriLayerObservableArtifact.mjs)).  
- **Politika:** `snapshotId` / `capturedAt` **hariç** (saf içerik kimliği) veya **dahil** (tam anlık) — dağıtımda **tek tip** seçilmeli.

---

## 9. Repo eşlemesi

- Builder: [`ecerTriLayerObservableArtifact.mjs`](../scripts/ecerTriLayerObservableArtifact.mjs).  
- **Eksik (sonraki sınır):** İki snapshot arası **meşru dönüşüm** — [TTA-1](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md); **kural uzayının** meşru evrimi — [TTA-1.1](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md); **ardışık kural değişimlerinin** tutarlı bileşimi — [HOGA-1](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md).

---

**Mühür (TLOA-1):**

> **One object, three planes — the epistemic moment made portable.**  
> **Reality is the chain of witnessed snapshots, not the daemon’s mood.**

---

*ECER-ADV TLOA-1 — tri-layer projection; snapshot closure; digest as epistemic identity; observability ledger.*
