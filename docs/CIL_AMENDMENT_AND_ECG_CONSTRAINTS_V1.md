# CIL Amendment Syntax & ECG Formal Constraint Layer

**Durum:** Canonical spec (Ring 0 / Ring 1 hizası).  
**Sürüm:** CAECL-1  
**İlişkili:** [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`architecture/ADR_BOOTSTRAP_AUTHORITY_V1.md`](architecture/ADR_BOOTSTRAP_AUTHORITY_V1.md) · [`STABILIZATION.md`](../STABILIZATION.md) · [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md) · **Phase 2 (planlı runtime):** [`EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md`](EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md)

**Durum özeti (tek cümle):** ETSS truth’u ayırdı, CIL değişimi sınırladı, ECG nedeni yapılandırdı, TAL ise hepsini zaman içinde kaydetti — CAECL-1 ile sistem artık sadece çalışan değil, **kendi değişimini hukuki olarak yöneten** bir epistemik makine haline geldi; **gerçek icra motoru ve otomatik ECG muhafızı** EP2-1 ile tanımlanır (henüz implementasyon değil, hedef spec).

Bu belge iki parçadan oluşur:

- **A — CIL Amendment Syntax:** Anayasa benzeri belgeler ve frozen politika **nasıl**, **kiminle**, **hangi şartla** değişir; makine-okur **diff kaydı** şablonu.
- **B — ECG Formal Constraint Layer:** Studio çekirdeğindeki **kenar geçerliliği**, **nedensel tutarlılık**, **merge** anlamları (kodla uyumlu).

---

# A) CIL Amendment Syntax

## A.1 Ne “CIL” değişikliği sayılır?

Aşağıdakiler **CIL yüzeyine** dokunur (law surface — [`ETSS-1`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md)):

| Sınıf | Örnek | Tipik yol |
|--------|--------|-----------|
| **Topology / freeze** | v562–v570 zincirinin rolü, import yönü, yeni faz hattı | [`STABILIZATION.md`](../STABILIZATION.md), stabilization graf |
| **Trust / attestation** | KMS kökü, imza politikası, genesis → operasyonel kök | [`ADR_BOOTSTRAP_AUTHORITY_V1.md`](architecture/ADR_BOOTSTRAP_AUTHORITY_V1.md) |
| **Epistemic mapping** | TAL/ECG/CIL ayrımı, indirgenemezlik | [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) |
| **Artifact protocol bump** | ABOA-1 → ABOA-2, mühür alanları | [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md), boot protokolleri |

Salt **TAL** (ör. [`academic/SESSION_LOG.md`](academic/SESSION_LOG.md) yeni blok) veya salt **ECG implementasyon refaktörü** (davranış koruyan) her zaman **CIL amendment** değildir; ancak **normatif metin** “artık hukuk böyle” diyorsa CIL’e yazılır veya mevcut CIL belgesine **amendment kaydı** bağlanır.

## A.2 Nasıl değişir? (constitution diff formatı)

**Temel hukuk:** **Overwrite yok** — geçmiş anlam silinmez; düzeltme **append** veya **açık supersession** (eski metin kalır, yerine yeni bölüm + pointer) ile yapılır.

Her anlamlı CIL değişikliği için repoda (tercihen `docs/architecture/` veya ilgili kök belgenin sonuna) aşağıdaki **Amendment Block** üretilir:

```markdown
## CIL-AMENDMENT <AMENDMENT_ID>

**Date:** YYYY-MM-DD
**Change-class:** ADD | CLARIFY | VERSION_LINE | PROTOCOL_BUMP | TRUST_ROOT
**Targets:** (repo paths — normatif etkilenen dosyalar)
**Prior-anchor:** (önceki mühür: commit SHA, belge içi başlık id, veya `parent_amendment: CIL-AMENDMENT <ID>`)
**SPECFLOW:** CORE-ELIGIBLE | RESEARCH-ONLY | FUTURE-PROOF-ONLY
**Summary:** (bir paragraf — ne değişti)
**Rationale:** (neden şimdi)
**Validation:** (örn. `npm run stabilization:validate-graph` — sonuç özeti)
**Compensation-of:** (yalnız CEE-1 telafisi — başarısız amendment id)
**Failure-context:** (örn. ASE_ATOMIC_VIOLATION — kısa)
**Attestations:**
- Role: <Steward | Approver | Maintainer | CI-Bot> — Identity: <kim / ne> — Ref: <PR, imza, run id>
```

**Change-class sözlüğü:**

| Değer | Anlam |
|--------|--------|
| **ADD** | Yeni invariant veya bölüm; eskiyi geçersiz kılmaz |
| **CLARIFY** | Yorum / örnek; normatif güç zayıf veya aynı hukuku netleştirir |
| **VERSION_LINE** | Frozen çekirdekte yeni davranış hattı (örn. v571+) veya experimental ayrımı — [`STABILIZATION.md`](../STABILIZATION.md) ile uyumlu olmalı |
| **PROTOCOL_BUMP** | Wire / artifact sürümü (ABOA-2 vb.) — append-only protokol evrimi |
| **TRUST_ROOT** | Genesis, KMS, çift onay gerektiren güven kökü değişikliği |

İsteğe bağlı **makine özeti** (CI veya script için tek satır JSON):

```json
{
  "amendment_id": "CIL-2026-05-10-001",
  "change_class": "ADD",
  "targets": ["docs/EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md"],
  "prior_anchor": "commit:abc123...",
  "specflow": "FUTURE-PROOF-ONLY"
}
```

## A.3 Kim değiştirir?

[`ADR_BOOTSTRAP_AUTHORITY_V1.md`](architecture/ADR_BOOTSTRAP_AUTHORITY_V1.md) ile hizalı özet:

| Değişiklik türü | Yetki |
|------------------|--------|
| **Trust root / zincir anlamı / KMS politikası** | **Çift teyit** — İnsan **Steward** + **Approver** (veya politika izin veriyorsa Steward + onaylı CI attestation) |
| **Genesis / ilk kayıt** | İnsan steward — kayıt **TAL**’da ve gerekiyorsa imzalı artefakt |
| **Frozen core topology (v562–v570)** | Bakım seviyesi: mevcut süreç + graf doğrulayıcı; **davranış değişimi** → **VERSION_LINE** + review |
| **Akademik / referans CIL** (ETSS, bu belge) | Principal + görünür review; SPECFLOW ve amendment block zorunlu |

**Break-glass:** Ayrı prosedür, seyrek, **zorunlu audit** — ADR’deki çizgiyle aynı.

## A.4 Hangi şartla değişir?

1. **Explicit amendment block** (yukarıdaki şablon) bir PR veya doğrudan commit gövdesinde izlenebilir olmalı.  
2. **SPECFLOW** hedef dosyalarla uyumlu olmalı (`CORE-ELIGIBLE` çekirdek PR’larında validator yeşil).  
3. **STABILIZATION:** Frozen zincir içinde “feature” yok; yeni davranış **v571+** veya **experimental** yolu.  
4. **TRUST_ROOT / PROTOCOL_BUMP:** İlgili ADR + (gerekiyorsa) artifact taksonomisi güncellenmiş olmalı.  
5. **Inter-surface non-collapse:** Bir CIL değişikliği, ETSS-1’e göre TAL’ı ECG’nin yerine koymaz veya tersine — amendment metninde yüzey ihlali iddiası varsa reddedilir.

---

# B) ECG Formal Constraint Layer

Bu katman, **Castle Studio** içindeki append-only **Episodic Causal Graph** yazımını kısıtlar. Uygulama referansı: `apps/client/src/studio/runtime/graphReducer.ts` (`appendCausalNode`). Hata kodları aşağıda **resmi isim** olarak sabittir.

## B.1 Edge / düğüm geçerliliği (edge validity)

| Kural | Koşul | Hata kodu |
|--------|--------|-----------|
| **Unique id** | Aynı `node.id` iki kez eklenemez | `causal_duplicate_id` |
| **Fork sonrası** | Düğüm, dalın `forkTick`inden önceki tick’te olamaz (dal tanımlıysa) | `causal_node_before_fork` |
| **Monotonic tick (yazar başına)** | Aynı `branchId::writerSubjectId` için yeni düğümün `tickIndex`i, önceki uçtan büyük olmalı | `causal_tick_not_monotonic` |
| **Bilinen neden** | Her `causeIds` girdisi grafta (veya `causeLookup` ile) çözümlenebilir olmalı | `causal_unknown_cause:<id>` |
| **Neden gelecekte değil** | Neden düğümünün `tickIndex`i ≥ yeni düğümün tick’i olamaz | `causal_future_cause` |
| **Fork öncesi aynı dal** | Aynı dalda, fork’tan önceki segmentte kalan nedene bağlanılamaz (genesis hariç) | `causal_same_branch_before_fork` |

**Genel ilke:** Mevcut düğümler **retroaktif değişmez**; sadece yeni düğüm eklenir.

## B.2 Nedensel tutarlılık (causal consistency)

- **Kapanış:** Her yeni atom, bildirdiği tüm nedenlere **zaman sırası ve dal geometrisi** açısından uyumlu olmalı (yukarıdaki tablo).  
- **Dal (branch):** `Branch` kaydı `forkTick`, `forkCauseNodeId`, `parentBranchId` ile geometriyi taşır; düğümler `branchId` ile bağlanır.  
- **Genesis:** `cn:kernel:genesis` sabit kök; nedensel zincir buradan okunabilir.

## B.3 Merge semantics

Üç ayrı “merge” ailesi birbirine karıştırılmaz (ETSS **non-collapse**):

| Bağlam | Anlam | Repo referansı |
|--------|--------|----------------|
| **Studio ECG** | Çoklu **neden** (`causeIds`) tek düğümde birleşebilir; yazar başına **tek linear tip** `writerHeads` ile takip edilir | `appendCausalNode`, `CausalNode.causeIds` |
| **Constitutional epoch** | Çizgisel olmayan soy: `mergeAncestry` — birleşmiş **ebeveyn epoch hash** listesi | `runConstitutionalEpoch` / `hashChainedEpoch` (`apps/client/src/kernel/orchestrator/runConstitutionalEpoch.js`) |
| **Meta-constitution grafiği** | Anayasa **paket sürümü** düğümleri; çoklu `parentIds`; soy izlerken **yalnızca `parentIds[0]`** zinciri | `metaConstitutionVersioningV1.js` |

**Varsayılan merge politikası sabiti (Studio):** `CAUSAL_DEFAULT_MERGE_POLICY = "deterministic-diff-resolution"` — ürün içi çözümleme stratejisine işaret eder; **CIL amendment** gerektiren yeni anlam, ayrı belge + `PROTOCOL_BUMP` veya kod sözleşmesi ile bağlanmalıdır.

---

## İlgili komutlar

```bash
npm run stabilization:validate-graph
npm run stabilization:validate-specflow
npm run stabilization:validate-amendment
npm run stabilization:validate-amendment -- --verify
npm run stabilization:validate-amendment -- --json --verify
```

---

## Phase 2 — İcra ve otomatik doğrulama

**Amendment Execution Engine v0.2** — parse + routing + targets + verify + **`--json`** (ARSM-1): [`EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md`](EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md) · [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md). **Apply:** [`APPLY_SEMANTICS_ENGINE_V1.md`](APPLY_SEMANTICS_ENGINE_V1.md). **ECGBinding Interpreter:** [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md). **Compensation:** [`COMPENSATION_EXECUTION_ENGINE_V1.md`](COMPENSATION_EXECUTION_ENGINE_V1.md) · **CESE / CLFB:** [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) · [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md). **ECV** hâlâ planlı.

---

*CAECL-1 — CIL amendment syntax + ECG formal constraints.*
