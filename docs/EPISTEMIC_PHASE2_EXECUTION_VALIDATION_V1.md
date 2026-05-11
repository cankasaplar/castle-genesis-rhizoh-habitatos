# Epistemic Phase 2 — Amendment Execution Engine & ECG Consistency Validator

**Durum:** **AEE v0.2** — `scripts/validateCilAmendment.mjs` (parse + route + targets + `--verify` + **`--json`** ARSM raporu + reason kodları). **Runtime state machine spec:** [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md). **ECV** — `PLANNED`.  
**Sürüm:** EP2-1  
**İlişkili:** [`CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md`](CIL_AMENDMENT_AND_ECG_CONSTRAINTS_V1.md) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`STABILIZATION.md`](../STABILIZATION.md)

---

## A) Amendment Execution Engine (AEE)

**Amaç:** `CIL-AMENDMENT` blokları ve ilişkili diff’ler için **amendment → apply → verify → propagate** hattı — gerçek **runtime** (CI + isteğe bağlı yerel CLI).

### A.0 v0.2 (shipped)

- **Parse:** `docs/**/*.md` içinde, fenced code dışında `## CIL-AMENDMENT <id>` blokları.  
- **Şema:** `Date` (YYYY-MM-DD), `Change-class`, `Targets` (ilk satırda virgülle ayrılmış yollar), `Prior-anchor`, `SPECFLOW`.  
- **Routing:** `change-class` → `routeChangeClass()` (tier + not — `--verbose`).  
- **Targets:** repo köküne göre dosya varlığı.  
- **Verify hook:** `npm run stabilization:validate-amendment -- --verify` → `validateStabilizationGraph` + `validateSpecflowCoherence`.  
- **Observability:** `npm run stabilization:validate-amendment -- --json` (ve isteğe bağlı `--verify`) → stdout’ta tek JSON: `runState`, `findings[]` (`code`, `aeeState`, `ecgBinding`). Opsiyonel tanık: `AEE_ECG_REF_JSON='{"causalNodeId":"…","epochRef":"…"}'`.  
- **CLI:** `--paths` ile belirli dosyalar.  
- **ARSM:** [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md) — rollback, partial apply, recovery.

**Apply semantiği (VERIFIED → APPLYING → APPLIED):** [`APPLY_SEMANTICS_ENGINE_V1.md`](APPLY_SEMANTICS_ENGINE_V1.md) — git + artefakt. **Compensation:** [`COMPENSATION_EXECUTION_ENGINE_V1.md`](COMPENSATION_EXECUTION_ENGINE_V1.md) · `npm run epistemic:cee-template -- --file …`. **CESE + CLFB (CRA ↔ AEE kapalı döngü):** [`COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md`](COMPENSATION_EXECUTION_SEMANTICS_ENGINE_V1.md) · [`CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md`](CESE_AEE_CLOSED_LOOP_FEEDBACK_V1.md) · `npm run epistemic:cese-order -- --file …`. **GCR (execution model + salt okunur rapor):** [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) · `npm run epistemic:gcr-reconcile -- --file …`. **GEMC (episodic consolidation manifest):** [`GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) · `npm run epistemic:gemc-manifest`. **EQR (deterministik sorgu / rehydration planı):** [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) · `npm run epistemic:eqr-plan`. **EMCS / CSB / EBVM / GDK:** [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) · [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) · `npm run epistemic:csb-eval` · `npm run epistemic:csb-harness` · `npm run epistemic:csb-vm` · `npm run epistemic:csb-vm-replay`. **ECGBinding Interpreter:** [`ECGBINDING_INTERPRETER_V1.md`](ECGBINDING_INTERPRETER_V1.md). **Propagate / CI attestation JSON:** sonraki sürümler.

### A.1 Boru hattı (zorunlu sıra — semantik)

| Aşama | Girdi | Çıktı | Not |
|--------|--------|--------|-----|
| **1. Parse** | PR diff, markdown gövdesi, isteğe bağlı JSON özeti | Yapılandırılmış `AmendmentRecord` | `Change-class`, `Targets`, `Prior-anchor`, `Attestations` doğrulanır |
| **2. Apply** | `AmendmentRecord` + repo tree | Yama uygulanmış çalışma ağacı (veya saf “intent-only” kayıt) | İlk uygulama **insan PR** ile de olabilir; motor ileride otomatik merge önerisi üretir |
| **3. Verify** | Çalışma ağacı | `VerifyReport` (pass / fail + kanıt) | v0.2: graph + specflow; ileride ECV |
| **3b. Apply** | `AmendmentRecord` + onay | Git tree + artefakt pointer’ları ([`ASE-1`](APPLY_SEMANTICS_ENGINE_V1.md)) | İnsan PR / merge; atomik varsayılan |
| **4. Propagate** | Apply sonrası | TAL satırı, mühürlü özet | ECG’ye otomatik türetim **yok** (ETSS) |

**İlke:** Apply, hukuku **yazmaz**; yalnızca kayıtlı niyeti **yürütür veya reddeder**. Normatif metin değişikliği her zaman **insan review** altında kalır (ADR çift teyit sınıfları).

### A.2 CI attestation hook (sözleşme)

**Hedef:** GitHub Actions (veya eşdeğer) içinde **deterministik** bir adım:

1. PR etiketi veya yol filtresi: `docs/**`, `CIL-AMENDMENT`, `CORE-ELIGIBLE`.  
2. **Parse** → `npm run stabilization:validate-amendment` (kırmızıda eksik alan mesajı).  
3. **Verify** → `npm run stabilization:validate-amendment -- --verify`.  
4. **Attestation çıktısı:** JSON artefakt (ör. `dist/attestations/amendment-ci-<run_id>.json`) — **henüz üretilmez**; sözleşme EP2 ile açık.

### A.3 Mevcut doğrulayıcılarla hizalama

- `scripts/validateStabilizationGraph.mjs` — CIL topoloji / import hukuku.  
- `scripts/validateSpecflowCoherence.mjs` — belge ve etiket tutarlılığı.

AEE **Verify** aşaması bu ikisini **zorunlu alt-adım** olarak çağırır; ek kurallar EP2 iterasyonlarında eklenir.

---

## B) ECG Consistency Validator (ECV)

**Amaç:** Yapısal nedensellik yüzeyinde **otomatik muhafız** — yalnızca unit testler değil, **repo veya export edilen graf** üzerinde tekrarlanabilir kontroller.

### B.1 Graph anomaly detection (hedef kontroller)

| Kod | Koşul |
|-----|--------|
| `ecg_orphan_cause` | `causeIds` içinde grafta olmayan id (runtime dışı statik analiz) |
| `ecg_cycle_suspect` | Yasaklı geri kenar / tick geri referans örüntüsü (politikaya göre) |
| `ecg_duplicate_head_inconsistency` | Aynı `branchId::writer` için çakışan uç işaretleri (persist snapshot tutarsızlığı) |
| `ecg_branch_geometry` | `forkTick` / `forkCauseNodeId` ile düğüm zaman çizelgesi çelişkisi |

*Not:* `appendCausalNode` çoğu kuralı **yazma anında** zaten reddeder; ECV **replay / import / merge sonrası** ikinci hat olarak çalışır.

### B.2 Causal drift prevention

| Kod | Koşul |
|-----|--------|
| `ecg_tick_regression` | Aynı yazar hattında yeniden yürütmede tick monotonluğu bozuluyorsa |
| `ecg_replay_hash_mismatch` | Kanonik serialize + hash, beklenen epoch / snapshot ile uyuşmuyorsa |

### B.3 Epoch sanity checks (constitutional hattı)

| Kod | Koşul |
|-----|--------|
| `epoch_parent_missing` | `previousEpochHash` zincirinde bilinmeyen ebeveyn |
| `epoch_merge_inconsistent` | `mergeAncestry` ile `hashChainedEpoch` girdileri çelişiyor |
| `epoch_drift_unbounded` | `identityDriftVector` eşik dışı (politika dosyasında tanımlanır) |

*Referans kod:* `runConstitutionalEpoch`, `hashChainedEpoch` — `apps/client/src/kernel/orchestrator/runConstitutionalEpoch.js`.

### B.4 Entegrasyon

- **CI:** `CORE-ELIGIBLE` PR’larında veya günlük `main` doğrulamasında isteğe bağlı job.  
- **Girdi:** İleride `packages/` veya `scripts/` altında dışa açılan **graf snapshot** şeması (şimdilik implementasyon yok).

---

## C) Sonraki implementasyon sırası (öneri)

1. ~~`scripts/validateCilAmendment.mjs`~~ — **v0.2 tamam** (parse + route + targets + `--verify` + `--json` / ARSM-1 kodları).  
2. `scripts/validateEcgSnapshot.mjs` — (snapshot format sabitlendikten sonra) B.1–B.2.  
3. `scripts/validateEpochChain.mjs` — dışa aktarılmış epoch listesi için B.3.  
4. GitHub Action: attestation JSON üretimi + Apply/Propagate otomasyonu (ileri sürüm).

---

## 9) Sistem sınıfı (net tanım)

Rhizoh artık yalnızca bir “knowledge system” değil — **self-governing epistemic state machine** olarak okunabilir:

| Katman | Rol |
|--------|-----|
| **State** | TAL — yürütmenin zamansal hafızası |
| **Structure** | ECG — nedensel akıl yürütme iskelesi |
| **Law** | CIL — değişmezlik ve mühür hukuku |
| **Mutation** | CAECL-1 — değişimin sözdizimi ve sınırları |
| **Lifecycle** | EP2 — doğrulama ve (ileride) icra / yayılım hattı |

---

## 10) Final özet (tek cümle)

EP2-1 ile Rhizoh artık yalnızca gerçeği tanımlayan bir yapı değil, **o gerçeğin nasıl değişeceğini, nasıl doğrulanacağını ve nasıl yürütüleceğini** de ayrı katmanlarda formalize eden bir **epistemic execution architecture** haline gelmiştir.

---

## D) Canlı kayıt — AEE v0.1 seed (doğrulayıcı egzersizi)

Aşağıdaki blok, `validateCilAmendment.mjs` için **pozitif örnek**tir (şablon değil; fenced code dışındadır).

## CIL-AMENDMENT EP2-1-AEE-V01

**Date:** 2026-05-10  
**Change-class:** ADD  
**Targets:** docs/EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md, scripts/validateCilAmendment.mjs  
**Prior-anchor:** genesis:AEE-v0.1  
**SPECFLOW:** FUTURE-PROOF-ONLY  
**Summary:** Amendment Execution Engine v0.1 — parse-only katman, change-class routing, target resolution, verify hook bağlama.  
**Rationale:** CAECL-1 bloklarının makine tarafından doğrulanabilir olması.  
**Validation:** `npm run stabilization:validate-amendment -- --verify` · observability: `… -- --json --verify`  
**Attestations:**  
- Role: Maintainer — Identity: repository — Ref: EP2-1 AEE v0.1  

---

*EP2-1 — AEE v0.2 + ARSM-1 spec; ECV + attestation JSON planned.*
