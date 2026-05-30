# Rhizoh Governance Middleware — Research & Implementation Spec v1

**SPECFLOW:** `RESEARCH-ONLY` · **Status:** EXPERIMENTAL

**Executable truth** yalnızca repo + CI + freeze politikasında tanımlıdır ([`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)). Bu belge **speculative / governance taslağıdır**; çalışan runtime’ın yerine geçmez.

**İlişkili (aynı problem uzayı):** [`docs/PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md`](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) (projection vs authority) · [`docs/OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) (gözlemci yürütme yetkisi taşımaz) · [`docs/INTERACTION_GEOMETRY_V0.md`](INTERACTION_GEOMETRY_V0.md) (session form telemetry; identity substrate dışı) · [`apps/client/src/rhizoh/boot/tceeDualPhaseBoot.js`](../apps/client/src/rhizoh/boot/tceeDualPhaseBoot.js) (TCEE faz mührü)

---

## Goal

Move Rhizoh continuity behavior from scattered phase conditionals toward an explicit governance + authority evaluation layer.

This document does NOT replace the current runtime.

It defines:

- authority vocabulary
- signal inventory
- projection vs mutation semantics
- governance middleware direction
- testing surface for memory + embodiment behavior

---

## 1. Core Problem

Current runtime behavior is distributed across conditional gates such as:

```js
if (tceeBoot.phase === TCEE_PHASE.AWAKE)
```

These branches already encode governance semantics:

- who can write
- what can mutate identity
- when relational amplification is allowed
- when continuity becomes authoritative

But today these semantics are:

- implicit
- scattered
- difficult to audit
- hard to evolve safely

The proposal:

Shift from:

```text
conditional runtime branching
```

to:

```text
authority-mediated continuity governance
```

---

## 2. Core Concept

Important distinction:

| Concept | Meaning |
| --- | --- |
| Memory exists | retrieval / persistence |
| Memory projected | visible to runtime / LLM |
| Memory embodied | affects relational behavior |
| Memory adaptive | modifies current reasoning amplitude |
| Memory authoritative | allowed to mutate identity / canonical continuity |

Rhizoh currently already separates these implicitly.

This spec formalizes them.

---

## 3. Governance Axes

Every signal receives independent authority properties.

| Axis | Meaning |
| --- | --- |
| Visible | observable / inspectable |
| Projectable | may influence surface behavior without commitment |
| Adaptive | may dynamically alter runtime weighting |
| Writable | may mutate persistent state |
| Canonical | contributes to authoritative continuity lineage |

Critical principle:

```text
Projectable ≠ Writable
Projection ≠ Authority
Warmth ≠ Commitment
```

---

## 4. Signal Inventory (Initial Draft)

### 4.1 rhizohWeightedRecollection

Description:
Weighted memory retrieval + governor capped recollection.

| Axis | Status |
| --- | --- |
| Visible | ✓ |
| Projectable | ✓ |
| Adaptive | partial |
| Writable | ✗ |
| Canonical | ✗ |

Notes:

- selection affected by bond, intent, governor caps
- influences runtime context
- does NOT directly mutate identity graph

---

### 4.2 relBase (continuity residue)

Description:
Baseline continuity **relationship** snapshot — **continuity residue**: latent relational / affective carry from continuity, without implying recall-driven embodiment amplification.

| Axis | Status |
| --- | --- |
| Visible | ✓ |
| Projectable | ✓ |
| Adaptive | low |
| Writable | ✗ (within current definition) |
| Canonical | ✗ |

Notes:

- present during `pre_breath`; ontological weight is **low** compared to identity-amplified projection
- must not be collapsed with recall-amplified overlay (epistemic category drift risk)

---

### 4.3 Identity-amplified relational projection (split)

**Vocabulary (intentional split):**

| Term | Meaning |
| --- | --- |
| **Continuity residue** | `relBase` / baseline relationship carry — latent trace, low embodiment energy |
| **Identity-amplified relational projection** | Recall + identity-informed **runtime** relational amplitude for the LLM surface (e.g. trust / familiarity overlay path) — higher embodiment energy, **authority-sensitive** |

Single “recall relational overlay” row merged **distinct epistemic behaviors**; that invites drift (e.g. “overlay is projectable” → **unintentionally** treating adaptive recall weighting as safe in `pre_breath`). Drift here is often **category slippage**, not a syntax bug.

**Summary (projection / adaptive / writable only — see full axes above):**

| Signal | Projection | Adaptive | Writable |
| --- | --- | --- | --- |
| Continuity residue (`relBase`) | ✓ | low | ✗ |
| Recall-amplified relational overlay (`relForLlm` trust/fam branch) | ✓ | ✓ (today **AWAKE-gated**) | ✗ (overlay only; not graph) |
| Identity-feedback relational synthesis (recall → graph feedback) | partial (internal) | ✓ | ✓ (when merge commits) |

#### 4.3.1 Recall-amplified relational overlay

Description:
Runtime relational amplitude for the LLM: trust / familiarity / bond derived from **post-recall** identity slice for this turn. In code paths discussed in the Rhizoh continuity thread, this path is **`tceeBoot.phase === awake` gated**.

| Axis | Status |
| --- | --- |
| Visible | partial |
| Projectable | ✓ |
| Adaptive | ✓ (gated) |
| Writable | ✗ |
| Canonical | ✗ |

Notes:

- **AWAKE-gated** today — do not relax without updating this matrix and review discipline
- candidate for a future **projection policy** layer (resonance without graph commit)

#### 4.3.2 Identity-feedback relational synthesis

Description:
`computeIdentityFeedbackFromRecall` → `applyRecallFeedbackToIdentityGraph` (and downstream merge persistence). **Ontological feedback**, not mere context injection.

| Axis | Status |
| --- | --- |
| Visible | partial |
| Projectable | partial |
| Adaptive | ✓ |
| Writable | ✓ |
| Canonical | ✗ (feeds lineage; seal/epoch are canonical anchors) |

Notes:

- **AWAKE-gated** today alongside overlay recompute
- this row is why “projection” and “mutation” must stay separable in review

---

### 4.4 identity graph

Description:
Persistent self-model relationship structure.

| Axis | Status |
| --- | --- |
| Visible | partial |
| Projectable | partial |
| Adaptive | ✓ |
| Writable | ✓ |
| Canonical | partial |

Notes:

- not itself absolute canonical truth
- participates in canonical continuity lineage

---

### 4.5 commitWakeSeal

Description:
Irreversible continuity activation seal.

| Axis | Status |
| --- | --- |
| Visible | limited |
| Projectable | ✗ |
| Adaptive | ✗ |
| Writable | ✓ |
| Canonical | ✓ |

Notes:

- should remain ontologically meaningful
- must not degrade into warmth toggle

---

### 4.6 memoryClockEpoch

Description:
Temporal continuity authority epoch.

| Axis | Status |
| --- | --- |
| Visible | limited |
| Projectable | ✗ |
| Adaptive | ✗ |
| Writable | ✓ |
| Canonical | ✓ |

---

## 5. Actor / Role Authority Map

IMPORTANT:
Prefer ROLE over PROCESS naming.

Example:

- observer
- gateway executor
- client runtime merge
- frozen subgraph
- human DSL authority

instead of:

- websocket worker #2
- app instance
- session handler

Reason:
Roles survive implementation drift.

### Initial Authority Matrix

| Role | Visible | Projectable | Adaptive | Writable | Canonical |
| --- | --- | --- | --- | --- | --- |
| observer fabric | ✓ | ✓ | low | ✗ | ✗ |
| gateway executor | ✓ | ✓ | ✓ | partial | ✗ |
| client runtime merge | ✓ | ✓ | ✓ | ✓ | partial |
| frozen core | limited | ✗ | ✗ | ✓ | ✓ |
| human DSL authority | ✓ | ✓ | partial | partial | partial |

---

## 6. Projection Policy Layer

Important architectural direction:

DO NOT necessarily add more TCEE phases.

Potential cleaner direction:

```text
TCEE phase
= ontological state

Projection policy
= embodiment behavior surface
```

This preserves:

- WAKE authority semantics
- irreversible seal meaning
- continuity legitimacy

while still allowing:

- onboarding warmth
- familiarity resonance
- intro suppression
- adaptive-lite embodiment

WITHOUT canonical mutation.

---

## 7. Soft Projection Concept

Research-only concept.

Potential behavior:

| Capability | soft projection |
| --- | --- |
| retrieval | ✓ |
| weighted recollection | ✓ |
| relational resonance | low amplitude |
| identity mutation | ✗ |
| seal commit | ✗ |
| epoch mutation | ✗ |
| canonical authority | ✗ |

Core principle:

```text
continuity resonance without identity commitment
```

---

## 8. Governance Middleware Direction

Long-term direction:

Replace scattered implicit gates with explicit authority evaluation.

Example evolution:

From:

```js
if (phase === AWAKE) {
  applyRecallFeedbackToIdentityGraph(...)
}
```

Toward:

```js
governance.evaluate({
  actor: "runtime_recall_pipeline",
  signal: "identity_feedback",
  operation: "write",
  target: "identity_graph"
})
```

Or:

```js
authority.can({
  actor,
  signal,
  operation,
  scope
})
```

Design constraint (anti–god-object):

Middleware should act as **authority adjudication substrate**, not a monolithic orchestrator that owns all behavior.

Goal:

- auditable authority
- explicit epistemic contracts
- safer multi-agent growth
- projection/authority separation
- continuity drift reduction

---

## 9. Product Surface Testing

The governance model must eventually become testable at UX level.

Research areas:

### 9.1 Latent Continuity UX

Questions:

- Does user feel “fully forgotten”?
- Does user feel “falsely over-familiarized”?
- Can system feel continuous without claiming canonical embodiment?

### 9.2 WAKE Semantics

Questions:

- Is WAKE discoverable?
- Does WAKE feel meaningful?
- Does activation feel ontological rather than cosmetic?

### 9.3 Projection vs Commitment

Questions:

- Can warmth exist without canonical merge?
- Can relational continuity remain reversible?
- Can onboarding preserve legitimacy?

### 9.4 Voice / TTS Lifecycle

Research hypothesis:

Phase transition + runtime remount + stream reset may produce:

- audio interruption
- stale playback teardown
- voice lifecycle races

Investigate:

- phase listeners
- dependency arrays
- stream abort timing
- TTS cleanup effects

---

## 10. Governance Review Discipline

Recommended review questions:

1. Which authority cell changes in this PR?
2. Is projection accidentally becoming authority?
3. Is canonical state leaking into lightweight projection?
4. Is observer fabric mutating continuity?
5. Is warmth being mistaken for commitment?

---

## 11. Final Framing

Rhizoh is increasingly behaving less like:

```text
assistant with memory
```

and more like:

```text
governed continuity infrastructure
```

The central problem is no longer:

```text
what does the model remember?
```

but:

```text
which signals are allowed to become reality?
```

---

## 12. Next implementation tranche (sketch) — `RESEARCH-ONLY`

Epistemik model belgede sabitlendikten sonra kod tarafında doğru sıra genelde: **ince evaluator → kademeli gate sarmalama → imperative `if (AWAKE)` temizliği** (evaluator politika keşfetmez; yalnızca bu belgedeki hücrelere göre karar verir).

**Witness-mode v0 (sıfır davranış mutasyonu):** Runtime aynı kalır (`if (AWAKE)`, recall pipeline, graph mutation, overlay). Eklenen şey **first-class audit surface**: dallar “rastgele branch” değil, belgede adlandırılmış **authority decision point** olarak loglanır. Bu aşamada evaluator **önce witness** (gözlem + kayıt); return path veya yan etkiler değişmez. Böylece **yetkiyi değiştirmeden yetkiyi görünür** kılınır — regression riski pratikte sıfıra yakın, baseline ölçümü için zemin açılır.

Önceki çerçeve: `code = governance`. Hedef çerçeve: **governance = kod üzerinde epistemik hesap verebilirlik / yorumlanabilirlik katmanı** (kod değişse bile matris ve review disiplini sabit kalabilir).

### 12.1 Minimal Authority Evaluator (middleware patlaması yok)

Küçük yüzey, örnek girdiler:

- `signal` (envanterdeki ad)
- `operation` (`read` | `project` | `adapt` | `write` | `seal` — projeye göre daraltılabilir)
- `phase` / bağlam (ör. `tceeBoot.phase`)
- `target` (ör. `identity_graph`, `relForLlm_overlay`, …)
- `actor` (rol adı; §5)

Çıktı: **allowed | denied**, **reason code**, **authority cell** (hangi matris hücresi).

### 12.2 Trace-first logging

Her değerlendirme kaydı: izin sonucu + gerekçe + hücre + (mümkünse) provenance kısa özeti. Amaç: regression ve multi-agent genişlemede **sessiz yetki yükseltmesi** avı.

**v0 PR’da önerilen tek kayıt şekli** (alanlar genişletilebilir; davranışı etkilemez):

```json
{
  "signal": "identity_feedback_synthesis",
  "actor": "client_runtime_merge",
  "operation": "write",
  "target": "identity_graph",
  "phase": "awake",
  "decision": "allowed",
  "authorityCell": "4.3.2 x §5 client_runtime_merge",
  "reason": "TCEE_AWAKE_WRITE_PATH_ACTIVE"
}
```

`decision` v0’da çoğu zaman mevcut dal ile **tutarlı** olmalı (witness); gelecekte aynı kayıt **deny** üretecek gate’e evrilir.

### 12.3 Projection leak detection (test sınıfı — öncelik)

Örnek savunma soruları otomasyona dökülür:

- Projection **yanlışlıkla writable** mu davranıyor?
- `relBase` / continuity residue **yanlışlıkla amplify** ediliyor mu?
- Identity-feedback synthesis veya recall→graph yazımı **`pre_breath`** altında sızıyor mu?

Bu testler, hata tipinin çoğu zaman **syntax değil epistemik kategori kayması** olduğu uyarısıyla uyumludur (§4.3).

---

## 13. Rhizoh Governance Stack (v0) — isimlendirilmiş yığın

Belge + planlanan ince kod ile oluşan yapı, katmanlı olarak şöyle adlandırılabilir:

| # | Katman | Rol |
| --- | --- | --- |
| 1 | **Runtime** | Değişmeden kalan yürütme: mevcut recall pipeline, `if (AWAKE)` dalları, overlay, graph mutation. |
| 2 | **Authority gates** | Bugün kodda **gömülü** olan gerçek yetki sınırları (semantik olarak §4–§5 ile haritalanır). |
| 3 | **Witness evaluator** | Yeni, **non-invasive**: karar noktalarını açıklar; v0’da return path’i değiştirmez (§12 witness-mode). |
| 4 | **Trace layer** | §12.2 kayıt şeması + (ileride) toplanabilir audit izi. |
| 5 | **Future policy engine** | Henüz **aktif değil**: deny / reroute / arbitration; yalnızca mimari yön. |

**Framing:** Sistem “ne yaptığını bilen” iddiasından ziyade, **ne yaptığının epistemik kaydını tutan** yığına evrilir — runtime **opaque execution** yerine **accountable epistemic** yüzey taşır (davranış aynı, hesap verebilirlik artar).

### 13.1 PR başarı kriteri (v0 tek kapı)

```text
Behavior identical, observability increased
```

- Çıktı (kullanıcıya görünen cevap / aynı state geçişleri) **değişmez**
- Gecikme ve bellek akışı **hedef olarak değişmez** (log maliyeti ayrı ölçülür)
- Her **AWAKE** ile ilişkili yetki kararı **explainable**
- Mutasyonlar **traceable** (hangi hücre, hangi `reason`)
- Recall etkisinin **ölçülebilir** izi (en azından “hangi path tetiklendi”) açılır

### 13.2 Sonraki evrim (dikkatli sıra — `RESEARCH-ONLY`)

| Faz | İçerik | Not |
| --- | --- | --- |
| **Phase 1** | Witness logging | İlk PR — §12 + **§14 Shadow Evaluation checklist** |
| **Phase 2** | Trace aggregation, drift metrikleri, projection vs mutation oranı | Gözlem altyapısı; hâlâ davranışa dokunmama hedefi |
| **Phase 3** | İsteğe bağlı **advisory** evaluator | Öneri / uyarı; **non-blocking** |
| **Phase 4** | Gerçek **authority arbitration** | En son, çok kontrollü; deny ve yönlendirme üretir |

Phase 4’e geçmeden Phase 2–3’te matris ve test sınıfının oturması gerekir; aksi halde arbitration “gizli politika”yı başka yere taşır.

---

## 14. Shadow Evaluation PR checklist — Phase 1 implementation spec

**Saha döngüsü (deploy → capture → pattern → replay → fix):** aşağıdaki **§15**.

**Amaç:** §13.1 — *Behavior identical, observability increased.* Aşağıdaki sarımlar **yalnızca witness** üretir; koşul sonuçları, return değerleri ve yan etkiler **değişmez**.

### 14.1 Sarılacak AWAKE / yetki blokları (Tier A — zorunlu)

| # | Dosya (repo path) | Yaklaşık konum | Ne yapılıyor | Önerilen `signal` | Önerilen `target` | `authorityCell` (ref) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `apps/client/src/AppRhizoh528.jsx` | `if (tceeBootPhase === TCEE_PHASE.AWAKE) {` … recall feedback | `computeIdentityFeedbackFromRecall` → `applyRecallFeedbackToIdentityGraph` | `identity_feedback_synthesis` | `identity_graph` | §4.3.2 |
| 2 | `apps/client/src/AppRhizoh528.jsx` | `relForLlm` ternary (`AWAKE` ? overlay : `relBase`) | Relational overlay vs continuity residue | `relational_overlay_for_llm` | `relForLlm` | §4.3.1 |
| 3 | `apps/client/src/AppRhizoh528.jsx` | `identityRecallClosure:` … `meta.tceeBoot?.phase === TCEE_PHASE.AWAKE` | CSIL’e recall closure geçişi | `identity_recall_closure_injection` | `csil_pre_reply` | §4.3 + §6 |
| 4 | `apps/client/src/AppRhizoh528.jsx` | `identityRecallClosure:` … `prevMeta.tceeBoot?.phase === TCEE_PHASE.AWAKE` | Post-reply registry tick’te aynı gate | `identity_recall_closure_injection` | `csil_post_reply` | §4.3 + §6 |

**Tier B (isteğe bağlı — Phase 1.1):** `apps/client/src/rhizoh/boot/castleFieldTemporalSpineV0.js` içinde `boot.phase !== TCEE_PHASE.AWAKE` erken dönüşü (`return null`) — temporal spine / idle vs awake ayrımı; recall→LLM ana hattından ayrı; drift analizi genişletilecekse eklenir.

**Tier C (tanı):** `RhizohPersistentCoreInspectV1.jsx`, `castleFieldTemporalPolicyV0.js` — UI / policy gösterimi; Phase 1 witness için zorunlu değil.

### 14.2 `pre_breath` tarafında da witness (öneri)

Yalnızca `AWAKE` dalının **içine** log yazmak “yarım” iz üretir. **Aynı authority sınıfı** için `pre_breath` yolunda da **bir satır** witness (ör. synthesis için `decision: skipped`, `reason: TCEE_PRE_BREATH_SYNTHESIS_GATED`) üretmek, §12.3 projection leak testlerine zemin verir — yine **davranış değiştirmeden**, `if` / `else` yanlarına yan etkisiz çağrı.

### 14.3 Log nerede üretilir?

- **Tek yardımcı (implementasyon):** [`apps/client/src/rhizoh/runtime/rhizohAuthorityWitnessV0.js`](../apps/client/src/rhizoh/runtime/rhizohAuthorityWitnessV0.js) — `witnessRhizohAuthorityV0(record)` yalnızca serialize + `console.debug`; flag kapalıyken **no-op** (erken return).
- **Emit kanalı (Phase 1):** `console.debug`; **üretimde gürültü yok** — [`castleDebugGateV0.js`](../apps/client/src/rhizoh/runtime/castleDebugGateV0.js) ile granular **`VITE_RHIZOH_AUTHORITY_WITNESS_DEBUG`** (`apps/client/.env.example`) + gerekiyorsa `VITE_DEBUG` şemsiyesi; prod’da varsayılan **kapalı**.
- **Ağ:** Phase 1’de **yeni HTTP / Firestore yazımı yok** (davranış ve güven yüzeyi genişlemez).

### 14.4 Minimal trace schema (Phase 1 sabit)

§12.2 ile aynı çekirdek; Phase 1’de isteğe bağlı alanlar:

| Alan | Zorunlu | Not |
| --- | --- | --- |
| `signal` | ✓ | §14.1 tablosu |
| `actor` | ✓ | Örn. `client_runtime_merge` (§5) |
| `operation` | ✓ | Örn. `write` \| `project` \| `adapt` |
| `target` | ✓ | §14.1 |
| `phase` | ✓ | `awake` \| `pre_breath` |
| `decision` | ✓ | `allowed` \| `skipped` \| `denied` (v0 witness: mevcut dal ile tutarlı) |
| `authorityCell` | ✓ | Belge ref (ör. `§4.3.2`) |
| `reason` | ✓ | Kısa makine kodu (ör. `TCEE_AWAKE_WRITE_PATH_ACTIVE`) |
| `step` | ✓ (implementasyon) | Aynı `traceId` altında pipeline adı — **konsol sırası ≠ causal sıra**; korelasyon için `ts` + `step` + `traceId` birlikte okunur |
| `traceId` | ✓ (client turunda) | **Client authority correlation id** (`createCastleUlid` veya execute path’te mevcut `TRC-*`); gateway `traceId` ayrı alan: `gatewayTraceId` (post-fetch witness) |
| `gatewayTraceId` | isteğe bağlı | `post_llm_fetch` korelasyon witness’ında |
| `ts` | otomatik | `witnessRhizohAuthorityV0` ekler |

**Propagation (implementasyon):** `queryRhizohLLM` çağrılmadan önce üretilen `rhizohAuthorityTraceId`, `buildContinuityPayload(msg, { rhizohAuthorityTraceId })` ve `cont.runtime.rhizohAuthorityTraceId` ile aynı tur boyunca taşınır; `rhizohPersistTraceFromOut` çıktısında `authorityTraceId` olarak persist trace’e yazılır (CSIL post witness ile hizalı).

### 14.5 PR merge checklist (kopyala-yapıştır)

- [ ] **Davranış:** LLM cevabı, `relForLlm` değeri, `rhizohRecallMerge`, disk yazımı — önce/sonra aynı (manuel veya mevcut test).
- [ ] **Koşullar:** `if (AWAKE)` ve ternary dalları **mantıksal olarak** değiştirilmedi; yalnızca witness çağrısı eklendi.
- [ ] **Performans:** Hot path’te ağır serileştirme yok; flag kapalıyken **sıfır maliyet** (early return).
- [ ] **Güvenlik / gizlilik:** Log’da ham kullanıcı mesajı yok; PII minimum.
- [ ] **Env:** `.env.example` içinde `VITE_RHIZOH_AUTHORITY_WITNESS_DEBUG` dokümante (varsa).
- [ ] **Belge:** Bu PR, §14.1 tablosundaki satırlarla eşleşen witness’ları listeler (review için).

### 14.6 Bilinçli dışarıda bırakılanlar (Phase 1)

- `tceeDualPhaseBoot.js` içindeki `commitWakeSeal` — **seal anı** ayrı bir “high ceremony” event; isterseniz ayrı tek witness (Phase 1.1).
- Gateway tarafı — client önce; gateway executor matrisi (§5) sonraki PR.

---

## 15. Shadow witness — saha döngüsü (5 adım) `RESEARCH-ONLY`

Amaç: üretim veya staging’de **olayları görünür** tutup, 1–3 hatadan **iz çıkarmak**, **kombinasyon** hipotezi üretmek, **sıra** varsayımını doğrulamak, en sonda **minimal patch**.

| Adım | Ne | Nasıl |
| --- | --- | --- |
| **1. Deploy (witness açık)** | Olayları görünür yap | Client build’de `VITE_RHIZOH_AUTHORITY_WITNESS_DEBUG=1`. Prod’da granular bayrak için ayrıca `VITE_DEBUG=1` gerekir ([`castleDebugGateV0.js`](../apps/client/src/rhizoh/runtime/castleDebugGateV0.js) — dev’de yalnız granular yeterli). Konsolda `[rhizoh.authority.witness]` filtreleyin. |
| **2. 1–3 failure capture** | Trace snapshot | Aynı `traceId` ile ardışık satırları kopyalayın; mümkünse `gatewayTraceId` + `step` + `ts` birlikte. Ham kullanıcı metnini paylaşmayın. |
| **3. Pattern extraction** | 2–3 event kombinasyonu | Örn. `post_llm_fetch` → `relational_overlay_for_llm` → `csil_post_reply` veya `csil_pre_reply` … — **konsol sırasını causal sıra sanmayın**; `ts` ile sıralayıp async/tick sınırını not edin. |
| **4. Deterministic replay** | “Hangi event önce?” | Zorunlu kod replay değil: log tabanlı **timeline yeniden kurma** (mental veya spreadsheet). Gerekirse aynı `TCEE` fazı + aynı tur akışıyla tekrar deneyin. |
| **5. Fix injection** | Minimal patch | Tek davranış değişikliği; witness’ı **kapatmadan** önce hipotezi doğrulayın; §13.1 ihlal etmeyin (davranış değişimi varsa ayrı PR + test). |

**Çıkış kriteri:** “Hangi sinyal hangi bağlamda yetkisiz göründü?” sorusuna tek cümle yanıt + küçük diff. **Değil:** witness’ı genişleterek kontrol katmanına kaymak (§12 witness-mode ihlali).

**Önceki / sonraki hata modeli (özet):** Eski: *bug → log → fix → done.* Yeni: *event → trace → pattern → replay → controlled patch → event* — debugging bir **lifecycle**; runtime ile aynı ontolojide, dışarıdan kopuk değil. **Faz 1–5 yol haritası ve yüzey/çekirdek kuralı:** aşağıdaki **§16**.

---

## 16. Yol haritası — faz 1–5 & yüzey / çekirdek sınırı `RESEARCH-ONLY`

### 16.1 Faz özeti

| Faz | Durum (öneri) | Ne | Hedef |
| --- | --- | --- | --- |
| **1 — Deploy & Observe** | şu an | Witness açık; `traceId` / `authorityTraceId` propagation; ürün UI akışı gerçek ortamda | **Saf veri** — teoriden ölçüme |
| **2 — Incident mapping** | veri toplandıkça | Ses kesilmesi, recall anomaly, overlay jitter, CSIL mismatch | **Pattern extraction** |
| **3 — Product surface refinement** | gözleme göre | Castle / map / studio / greenroom UX; trace görünürlüğü; debug overlay (**dev/staging**) | **Observability UX** — yeni iş mantığı değil |
| **4 — Targeted micro-fix** | hipotez net | Frozen core’a dokunmadan edge-case; lifecycle / race **izolasyonu** | **Minimum intrusion** düzeltme |
| **5 — Controlled user testing** | fix sonrası | Gerçek oturum; trace-temelli değerlendirme; anomaly skoru (tanım ayrı) | **Davranış doğrulama** |

### 16.2 En kritik mimari gerçek (yüzey ↔ çekirdek)

Hedeflenen durum: **self-observing runtime + deneysel product surface** — fakat:

| | |
| --- | --- |
| ❌ | **Surface çekirdeği etkilerse** (ürün UI / overlay, yürütme yetkisini veya governance yorumunu değiştirirse) → governance bozulur. |
| ✔ | **Surface yalnızca gözlem üretirse** → çekirdek stabil kalır. |

**İnce ama sert kural:** “Çekirdeğe dokunmadan” ile birlikte şunu ekleyin: **çekirdek, product tarafından yorumlanmayacak** — ürün yüzeyi **canonical truth veya yetki matrisi üretmez**; yalnızca mevcut trace / witness’ı okur ve sunar. Executable truth yine repo + CI + freeze politikasında kalır ([`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)).

### 16.3 Şu an için önerilen sıra (next steps)

1. PROD/DEV deploy — witness açık (§15 adım 1).  
2. **Surface runtime activation** — castle / map / studio / greenroom akışları; **yalnızca observability** (trace görünürlüğü, filtre, kopyala).  
3. **Session collection** — gerçek veya simüle oturum; `traceId` hattı; ses / etkileşim logları (PII’siz).  
4. **Incident clustering** — ses kesilmesi dahil kümeleme.  
5. **İlk diagnostic rapor** — §15 döngüsü ile tek sayfa özet.

### 16.4 Bu aşamada yapılmaması gerekenler

- ❌ Yeni “feature” istifi — özellikle witness/trace şemasını her PR’da değiştirmek.  
- ✔ **Gözlem yüzeyi stabilizasyonu** — UI akışı değişebilir; **trace sözleşmesi (§12 / §14.4) sabit** kalmalı; drift ayrı bilinçli PR.

### 16.5 Başarı kriteri (bu faz)

Doğru soru: *“Sistem davrandı mı?”* değil — **“Sistem gözlemlenebilir hale geldi mi?”** (aynı davranış altında daha iyi hesap verebilirlik). **Sonraki soyutlama (oturum zinciri):** aşağıdaki **§17**.

---

## 17. Conversation trace — “log”dan oturum zincirine `RESEARCH-ONLY`

### 17.1 Terim ayrımı (sabitle)

| Kavram | Rol |
| --- | --- |
| **Log** | Debug artifact — `console.debug`, geçici, geliştirici odaklı (§14 witness, `rhizohAuthorityWitnessV0`). |
| **Conversation trace** | **Epistemic memory** — bir Rhizoh konuşmasının **olay zinciri**; replay, korelasyon ve ürün analizi için yapılandırılmış. |

Takip edilen birim artık yalnızca “tek satır Rhizoh ne dedi” değil: **Rhizoh Conversation Session** — her kullanıcı–Rhizoh etkileşimi bir **turn zinciri** ve her turda **iç durum** ile birlikte kayıt.

### 17.2 Eskiden vs şimdi

| Eskiden | Şimdi |
| --- | --- |
| `log: "Rhizoh said: …"` | **Turn N:** girdi, çıktı, recall/overlay/CSIL bağlamı, `traceId` hattı, `phase`, zaman damgaları |

**Kritik değişim:** ❌ “Ne dedi” tek başına yeterli değil. ✔ **Hangi durumda ve hangi iç state ile** dedi — gerekli.

### 17.3 Minimal `ConversationSession` (çekirdek fikir — şema taslağı)

Executable implementasyon değil; **gruplama sözleşmesi** önerisi:

```text
ConversationSession
 ├── sessionId          (ürün oturumu; örn. rhizoh product session)
 ├── traceId            (client authority correlation — rhizohAuthorityTraceId / §14)
 ├── turns[]
 │     ├── turnIndex
 │     ├── userInput     (PII politikasına göre kısaltma/hash)
 │     ├── rhizohOutput
 │     ├── witnessEvents[]   (witness payload referansları veya kopya)
 │     ├── phase             (pre_breath | awake)
 │     ├── recallSnapshot    (özet: ağırlık / seçim meta; ham prompt değil)
 │     ├── overlaySnapshot   (trust/fam branch özeti)
 │     ├── csilEvents[]      (pre/post closure işaretleri)
 │     └── timestamps        (ts; sıra korelasyonu için)
```

**Üç omurga (birlikte):** `sessionId` → kimlik / ürün oturum omurgası · `traceId` (authority) → **causal** omurga · `turns[]` → **temporal** omurga. Üçü birleşince kayıt **üç eksenli** hale gelir.

**Birincil birim:** Eskiden **message** ≈ stateless event; artık **turn** ≈ stateful cognition snapshot. Chat yalnızca **output stream** değil; **stateful epistemic timeline** — birincil soru *“ne dedi?”* değil, *hangi iç durumla, hangi sırayla, hangi trace bağlamında dedi?*

### 17.4 Mevcut yapı ile uyum + eksik parça

Zaten var (client): `traceId` / `authorityTraceId` propagation, witness olayları, `phase`, CSIL öncesi/sonrası işaretleri (§14–§16).

**Eksik (bilinçli boşluk):** bu sinyallerin **turn-level grouping** altında tek bir **ConversationSession** kaydında birleştirilmesi — şu an witness konsola dağılıyor; oturum nesnesi yok.

### 17.5 Depolama seçenekleri (aşamalı)

| Katman | Ne | Not |
| --- | --- | --- |
| **1 — Local dev** | IndexedDB / JSON export / dev-only store | Çekirdeğe dokunmadan prototip |
| **2 — Gateway trace store** | Oturum bazlı toplama (ileride) | Dağıtık korelasyon |
| **3 — Product analytics** | Anonim / agregasyon (sonra) | Gizlilik ve retention politikası şart |

### 17.6 Önerilen surface bileşeni (implementasyon yönü — `RESEARCH-ONLY`)

**`RhizohConversationRecorder`** (veya eşdeğer ad): yalnızca **surface / client** katmanı; frozen core veya gateway davranışını değiştirmek zorunda değil.

- Kullanıcı mesajı → **turn start** (session + `traceId` bağla).  
- Rhizoh yanıtı → **turn close** (output + özet state).  
- Witness çağrıları → aynı `traceId` / `authorityTraceId` altında **attach** (event append).  

Bu, “chat log sistemi”nden **temporal cognition ledger** (zaman içinde durum bilen konuşma defteri) yönüne ilk adımdır — **kontrol katmanı değil**, kayıt ve gruplama katmanı.

### 17.7 Ürün / debug kazanımı (özet)

- **A)** Konuşma replay (veri toplandıkça birebir veya özüt oynatma).  
- **B)** Ses kesilmesi: o turda recall, overlay, CSIL zamanı — tek olay değil **cluster**.  
- **C)** Kullanıcı analizi: kesinti noktaları, phase geçişleri (anonim/agregasyon ile).

### 17.8 §16 ile hizalama

Faz 1–2 (§16): önce **veri ve pattern**; **ConversationSession** toplama faz 2–3’te devreye girebilir — trace şeması (§14.4) **önce sabit**, recorder **ayrı PR** ile eklenmeli (gözlem yüzeyi stabilizasyonu).

### 17.9 §15 + §17 birleşimi

| Katman | Rol |
| --- | --- |
| **§15** | Debugging **döngüsü** — deploy, capture, pattern, replay-mentali, kontrollü patch. |
| **§17** | Konuşma **hafıza grafiği** — oturum + turn + iç state. |

Birlikte: **self-debuggable conversation runtime** — konuşma yalnız UI değil; **debuggable runtime artifact** (yine: surface **actor** değil, **observer**).

### 17.10 Sonraki köprü — `RhizohConversationRecorder` v0 (taslak kapsam)

`RESEARCH-ONLY` / dev-first; çekirdek ve kontrol mantığına dokunmadan:

- turn tracking (start / close)  
- witness attach (mevcut payload şekli)  
- `traceId` / `authorityTraceId` bağlama  
- replay-ready yapı (export veya bellek halkası)  

**Sınırlar:** recorder yalnızca surface; **control logic yok**; **core mutation yok**. Bu korunursa güvenlik ve governance ayrımı sürer.

**Replay notu:** Hedef yalnızca metin replay değil; mümkün olduğunda **state replay** özeti (recall / overlay / CSIL / phase — ham prompt değil). Ses kesilmesi gibi sorunlar **tek event** değil; **turn içi state geçişi ile ses lifecycle çakışması** (temporal collision analizi).

### 17.11 Mimari yığıt ve birleşik tanım (özet)

| Katman | Rol | Durum (öneri) |
| --- | --- | --- |
| **1 — Execution (core)** | Yürütme | Stabil |
| **2 — Authority / policy** | Yetki, frozen sözleşme | Dokunulmadan |
| **3 — Witness** | Olay görünürlüğü (§14) | Aktif |
| **4 — Conversation trace** | Turn + state + trace bağlı diyalog (§17) | Tasarım / recorder ile gelişiyor |
| **5 — Replay / analysis** | Özüt oynatma, çarpışma analizi | Emerging |

**§15 vs §17 nedensellik:** §15 → **sistem** düzeyinde nedensellik (cluster, failure loop). §17 → **konuşma** düzeyinde nedensellik (turn state, trace-bound diyalog). Birlikte: **full-stack temporal observability** — konuşma hem yaşanan deneyim hem **debuggable artifact**; “LLM chat” değil, **self-observable temporal cognition runtime** yönü.

**`RhizohConversationRecorder` v0 — rol tanımı:** Yüzeyde **temporal state compiler**: olayları turn + state grafiğine **derler**; **kontrol etmez**, **mutate etmez**, yalnızca **observe** eder.

### 17.12 Recorder v0 — PR kabul kriteri (tek PR sınırı)

- Yalnızca **turn assembly** (start / close) + **trace attach** + **witness capture** (mevcut şema).  
- **Replay-ready** JSON export veya bellek halkası (dev).  
- **NO runtime influence** — yürütme dalları, `if (AWAKE)`, gateway veya frozen core’a müdahale yok.  
- Kontrol / policy / authority evaluator **yok** (§12 witness-mode ile uyum).
