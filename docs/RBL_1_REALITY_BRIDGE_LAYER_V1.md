# RBL-1 — Reality Bridge Layer v1

**Rol:** Phase 3’ün **ilk dış-ontoloji köprüsü** — ham dünya girdisi ile **kernel girdi domain** arasında anayasal sınır. İyi tanımlı bir **witness contract** olmadan deterministik dürüstlük içeri kapalı kalır; bu spec **kamusal artefakt** üzerinden meşru, replay edilebilir temas tanımlar.

**Sürüm:** RBL-1  
**Durum:** `NORMATIVE_TARGET`  
**Runtime primitive:** [`scripts/witnessArtifact.mjs`](../scripts/witnessArtifact.mjs)  
**İlişkili:** [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [PCEK-1](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) · [**RBL-τ Binding**](RBL_TAU_BINDING_LAYER_V1.md) (τ ↔ artefakt) · [**RBL-τ Lineage**](RBL_TAU_LINEAGE_LAYER_V1.md) (genealogy) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [`evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs) · [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md)

**Stack okuması (özet):**

| Katman | Milestone / yasa |
|--------|-------------------|
| Constitution | PCEK-1 |
| Governance | PAG-1 |
| Runtime | CGR-1 |
| **Reality (bridge)** | **RBL-1** |
| Civil | (sonra) |

---

## 0. Constitutional statement

> **Sensation is private; Witnessing is public.**

**Norm:** **Raw signal ≠ epistemic artifact.** Ham ölçüm / iddia / API çıktısı, **witness pipeline**’dan geçmeden artefakt olamaz ve **kernel sınırına giremez**.

| Özel alan (private) | Kamusal alan (public) |
|---------------------|------------------------|
| `observe`, `sense`, `feel`, `sample`, yerel belirsizlik | `witness`, `seal`, `append`, `replay`, `audit` |

Kernel’in konuştuğu şey **ham gerçeklik değil**; **mühürlü, append-only zincire uygun `WitnessArtifact`** ve türetilmiş τ’dir.

---

## 1. Input taxonomy

Dış dünya girdileri **dört aile**de sınıflanır; hepsi **aynı witness contract**’a girer (`sourceClass` ile etiketlenir; [`SOURCE_CLASS`](../scripts/witnessArtifact.mjs)).

| Aile | Örnekler |
|------|-----------|
| **Sensor / stream** | Sensor signal, IoT, telemetry, metric stream |
| **Human statement** | Assertion, testimony, declaration |
| **External computation** | API response, oracle feed, model output |
| **Synthetic internal** | Agent action, simulation output |

Normalizasyon **pipeline adımı**dır; hangi normalleştirmenin uygulandığı mühürde **açık** olmalıdır (`normalizationSpec`, bkz. RBL-I3).

---

## 2. Witness pipeline

Normatif sıra:

```text
Signal
  → Normalize        (canonical form; spec string ile izlenebilir)
  → Context bind     (epoch / clock / source scope)
  → Witness          (who saw? — kamusal tanık kümesi)
  → Seal             (H_canon gövde → artifactHash)
  → Artifact         (immutable envelope; payloadHash ≠ raw payload)
  → Append           (append-only ledger)
  → evaluateBindIndexed  (πEFC / karar)
```

**Özet boru:** dünya tarafı **private** kalır; zincir ve kernel **public artifact + hash** üzerinden ilerler.

---

## 3. WitnessArtifact type

Runtime nesne (kernel ve audit **hash / envelope** üzerinden konuşur):

```ts
WitnessArtifact {
  artifactHash: string;       // H_canon(body \ artifactHash) — [a-f0-9]{64}
  sourceClass: string;        // SOURCE_CLASS.*
  payloadHash: string;        // H_canon(signal) — raw payload burada yok
  witnessSet: string[];       // kamusal tanık kimlikleri; deterministik sıralı unique
  observedAt: string;         // gözlemlenme anı (ISO veya politika-string)
  projectionEpochId: string;
  piHash: string;
  normalizationSpec?: string; // RBL-I3 — sessiz rewrite yok
  sourceScope?: string;
  uncertaintyVector?: unknown; // RBL-I5 — açık belirsizlik
  parentArtifact?: string;    // önceki mühür — lineage (RBL-I6)
}
```

**Kritik ayrım:** `payloadHash !== payload`. Ham yük **ayrı storage**’da kalabilir; replay ve kernel **mühür + tanık + bağlam** ile çalışır.

**Referans:** `sealWitnessArtifact(signal, context, witnesses)` → [`witnessArtifact.mjs`](../scripts/witnessArtifact.mjs).

---

## 4. Constitutional invariants

| Kimlik | İfade |
|--------|--------|
| **RBL-I1** | **No raw signal enters kernel.** |
| **RBL-I2** | **No witnessless artifact accepted.** |
| **RBL-I3** | **No silent normalization rewrite.** — `normalizationSpec` yayımlanır veya normalizasyon gövdede sabitlenir. |
| **RBL-I4** | **Every artifact must be replay-sealable.** — `verifyArtifactSeal` ile `artifactHash` doğrulanır. |
| **RBL-I5** | **Uncertainty is explicit, never hidden.** — `uncertaintyVector` (veya eşdeğer) ile taşınır; yokmuş gibi davranılmaz. |
| **RBL-I6** | **Source lineage immutable.** — `parentArtifact` ile zincir; üst yazma yok. |
| **RBL-I7** | **Conflicting witnesses append, never overwrite.** — çatışma **ledger’a append**; PAG **minority memory** ile aynı ruhta “reality tarafı”. |

---

## 5. Runtime bridge primitive

| Fonksiyon | Rol |
|-----------|-----|
| `sealWitnessArtifact(signal, context, witnesses)` | Normalize edilmiş `signal` → `payloadHash` + mühürlü `WitnessArtifact` |
| `verifyArtifactSeal(artifact)` | RBL-I4 replay doğrulaması |
| `appendWitnessArtifact(ledger, artifact)` | Append-only ledger kopyası; mühür geçersizse red |
| `isWitnessArtifactShape` | Şekil kontrolü (crypt doğrulama değil) |

Sonrasında τ inşası ve **`evaluateBindIndexed`** ayrı bağlayıcıdır (RBL-1.1+).

**Hata closure (RBL):** `RBL_ERR_*` — [`witnessArtifact.mjs`](../scripts/witnessArtifact.mjs) içinde dondurulmuş önek.

---

## 6. İlişki: PAG / πEFC

- **RBL** dünya → **artifact**; **PAG** governance → **ProjectionAuthorityBundle**; ikisi de **typed runtime girdi** katmanıdır.  
- τ üretimi artefakt(lar)dan türetildiğinde **πEFC** aynı `piHash` / `projectionEpochId` hizası ile çalışır.

---

## 7. Sonraki adımlar

- [**RBL-τ Binding v1**](RBL_TAU_BINDING_LAYER_V1.md) — τ’nin `WitnessArtifact + π + epoch + clock`’tan türetilmesi; π-bağlamında kanonik bijeksiyon; hedef kod: `rblBindTau.mjs`.  
- İmzalı `witnessSet` (cryptographic identity) ve çoklu tanık quorum.  
- Storage / RBL **ledger** backend (salt bellek dışı kalıcılık).

---

**Mühür (RBL):**

> **Sensation is private; Witnessing is public.**

---

*RBL-1 — Reality Bridge Layer; the epistemic sensor is the public witness, not the private sensation.*
