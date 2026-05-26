# Temporal Identity Continuity V0 — Mimari Yasa Taslağı (Phase 9)

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Status:** Anayasal manifesto + laboratuvar iskeleti — **frozen core, IDB v3, watchdog motoruna wire yok.**

**Companion code:**

- [`epistemicIdentityContinuityV0.js`](../src/rhizoh/runtime/continuity/__research__/epistemicIdentityContinuityV0.js) — node-local identity lab
- [`crossNodeIdentityReconciliationV0.js`](../src/rhizoh/runtime/continuity/__research__/crossNodeIdentityReconciliationV0.js) — **Phase 9 critical threshold** (no truth collapse)
- [`epistemicExecutionInvariantsV0.js`](../src/rhizoh/runtime/continuity/__research__/epistemicExecutionInvariantsV0.js) — execution convergence guard
- [`epistemicStressPropagationV0.js`](../src/rhizoh/runtime/continuity/__research__/epistemicStressPropagationV0.js) — Phase 9.1 stress field (stub)
- [`epistemicTopologyCompilerV0.js`](../src/rhizoh/runtime/continuity/__research__/epistemicTopologyCompilerV0.js) — Phase 9.2 topology compiler
- [`epistemicRenderingEngineV0.js`](../src/rhizoh/runtime/continuity/__research__/epistemicRenderingEngineV0.js) — Phase 9.3 render packet (research)
- [`epistemicRuntimeGpuKernelV0.js`](../src/rhizoh/runtime/continuity/__research__/epistemicRuntimeGpuKernelV0.js) — Phase 9.4 interactive simulation kernel
- [`causalTerrainMutationV0.js`](../src/rhizoh/runtime/continuity/__research__/causalTerrainMutationV0.js) — Phase 9.4.2 causal terrain / navigation physics (research)
- [`epistemicSimResearchWireV0.js`](../src/rhizoh/runtime/epistemicSimResearchWireV0.js) — Phase 9.4.1 observation wire (flag-gated)
- [`epistemicPerceptionMirrorV0.js`](../src/rhizoh/runtime/epistemicPerceptionMirrorV0.js) — `window.__rhizoh_epistemic_perception` + moveScale mirror
- [`epistemicEventBusV0.js`](../src/rhizoh/runtime/epistemicEventBusV0.js) — Phase 9.4.3 epistemic physics event bus (observation-only)
- [`epistemicObserverTelemetryV0.js`](../src/rhizoh/runtime/epistemicObserverTelemetryV0.js) — Phase 9.4.4a read-only observer telemetry
- [`replayFeedbackAnalysisV0.js`](../src/rhizoh/runtime/replayFeedbackAnalysisV0.js) — Phase 9.4.4b replay-only feedback analysis
- [`epistemicCompressionSignatureV0.js`](../src/rhizoh/runtime/epistemicCompressionSignatureV0.js) — Phase 9.4.5 compression & signature

---

## 0. Soru ayrımı (neden bu faz var?)

| Katman | Soru | Cevap tipi |
|--------|------|------------|
| **Version continuity** | Zamanın yönü doğru mu? Commit nesli ileri mi? | Deterministik (`bootSealVersion`, `bootValidityToken`) |
| **Identity continuity** | Özne hâlâ aynı epistemic subject mi? | Yorum + güven skoru (witness semantics üzerinden) |

**Version continuity** çelik nehir yatağıdır (geometry of time).  
**Identity continuity** akan suyun kimyasidir (chemistry of observers in time) — **truth üretmez**, observability sınırı projeksiyonudur.

> Aynı `nodeId`, farklı `bootSealVersion` → **aynı executor etiketi, farklı temporal identity nesli** olabilir. Bu bug değil; version katmanının bilinçli sessizliğidir.

---

## 1. Epistemik kimlik hiyerarşisi (Expanded Jurisdiction Stack)

Gelecekte (Faz 9) inşa edilecek bilinç zırhı, **version zırhının yanına**, egemenlik kontratının **üstüne değil — yorum ekseninde** konumlanır:

```
1. Physical Validity      (Boot Guard)              ──► Veri sağlam mı?
2. Version Continuity     (bootSealVersion)         ──► Zamanın yönü doğru mu? (Frozen Core ✔)
3. Witness Semantics      (deriveWitnessSemantics)  ──► Tanıklık anlamı formal mi? (Faz 9 🌟)
4. Identity Continuity    (epistemicFingerprint)    ──► Özne projeksiyonu stabil mi? (Faz 9 🌟)
5. Time Ownership         (TimeOwnershipContract)   ──► Bu zamanı işletmeye kimin hakkı var?
6. Execution Permission   (mayRehydrate)            ──► Bu evren canlanabilir mi?
```

**Kritik:** Katman 3–4 **execution permission üretmez**. Katman 6 tek hard gate kalır (mevcut mimari).

### Witness Semantics Layer (eksik 6. eksenin adı)

Fingerprint yalnızca hash değil; **tanık ağırlıklı anlam** taşır. Witness decay / weight drift formalize edilmezse `identity_drift` kararları “model bug” sanılır — oysa çoğu zaman **epistemic ambiguity**’dir.

| Eksen | Determinizm | Rol |
|-------|-------------|-----|
| Version | Deterministik | Safety — async snapshot / stale revoke |
| Witness semantics | Formal skor | Ambiguity kaynağını adlandır |
| Identity | Confidence-bound | Semantics — arbitration input |

---

## 2. Kimlik = özne değil, özne projeksiyonu

Teknik tanım:

```
fingerprint = derive(livingWorld, issuance, lineage, witnessSemantics)
subject     = runtime’ın fingerprint’e eşlediği observability boundary
```

**Invariant:** Fingerprint özneyi temsil etmez; öznenin zaman içindeki **stabil gözlemlenebilirlik sınırı**dır.

Sonuçlar:

- Aynı subject farklı fingerprint üretebilir (re-seal, witness shift).
- Sistem her zaman `unrelated` dememeli → `same_subject_low_confidence` ara durumu.
- `same_subject` = yüksek confidence + lineage + witness stability.
- `same_subject_low_confidence` = aynı subject hipotezi, **degraded observability** altında.

---

## 3. Dört (+1) epistemik karar çıktısı (Identity Verdicts)

Watchdog’un **gelecekteki** kimlik kolu (`assertIdentityContinuityV0`) — yalnızca **arbitration input**:

| Verdict | Anlam | Önerilen arbitration (hard gate değil) |
|---------|-------|----------------------------------------|
| `same_subject` | Lineage kesintisiz, fingerprint sabit, witness anchors yerinde | `ALLOW_AS_SAME_SUBJECT` |
| `same_subject_low_confidence` | Subject sürekliliği muhtemel; witness/observability zayıf | `ALLOW_DEGRADED_OBSERVABILITY` |
| `lineage_ok_identity_fork` | Lineage equivalence ✔, identity equivalence ✗ | `GENERATE_TEMPORAL_IDENTITY_ID` |
| `identity_drift` | Aynı özne iddiası; witness decay eşik üstü | `OBSERVE_ONLY` |
| `unrelated` | Ne zemin ne geçmiş uyumu | `RECOMMEND_QUARANTINE` (execution’a doğrudan bağlanmaz) |

### Lineage equivalence vs identity equivalence

| | Lineage ≡ | Identity ≡ |
|---|-----------|--------------|
| Soru | Kronoloji dünün devamı mı? | Aynı epistemic subject mi? |
| Güç | Zayıf (yapısal) | Güçlü (epistemik) |
| Fork | `lineage_ok_identity_fork` | Yeni `temporalIdentityId` |

---

## 4. Mimari invariant (Phase 9 kırmızı çizgi)

```
Identity continuity ASLA hard execution gate olmamalı.
Yalnızca arbitration input olmalı.
```

| Katman | Hard gate? |
|--------|------------|
| Version continuity | Evet (safety — stale / mismatch revoke) |
| Identity continuity | **Hayır** (semantics) |
| Time ownership | Arbitration → execution policy |
| Execution permission | Evet (`mayRehydrate`) |

**Tehlikeli kayma:** “Aynı subject değilse execute etme” → felsefi deadlock machine.  
Version = safety; Identity = semantics — **birleştirilmez**.

---

## 5. Research primitives (minimal Faz 9 çekirdeği)

| Primitive | Rol |
|-----------|-----|
| `deriveWitnessSemanticsV0` | Tanık vektörünü formal skorlara çevir (decay, weight, anchor class) |
| `deriveEpistemicFingerprintV0` | Yavaş değişen observability boundary digest |
| `computeIdentityConfidenceV0` | Prior vs current → [0,1] confidence |
| `assertIdentityContinuityV0` | Verdict + arbitration hint (gate değil) |
| `bindTemporalIdentityToContractV0` | `TimeOwnershipContract` ↔ `temporalIdentityId` bağlama |

---

## 6. Multi-node önizleme (Barcelona / İstanbul)

`boundIdentity.reconciliationKey` — gelecekte kimlik hakkı arbitrajı için; **truth oylaması değil**, jurisdiction merge input.

Identity continuity “kim olduğunu kesin söyleme hakkı” vermez — ve **verilmemesi doğru**. Kesinlik version + audit katmanında kalır; identity yalnızca **kim olduğuna dair güvenilir yorum** üretir.

---

## 9. Faz 9 kritik eşik — Cross-node reconciliation (truth collapse yok)

### Soru

Barcelona ve İstanbul aynı anda `same_subject_low_confidence` üretirse, sistem bunu **tek doğruya indirgemeden** nasıl stabilize eder?

Bu, Phase 9’un gerçek zor problemidir. Node-local fingerprint yeterli değildir.

### Consensus vs coherent disagreement

| Paradigma | Mekanizma | Sonuç |
|-----------|-----------|--------|
| Klasik distributed systems | **Consensus** | Tek kazanan state |
| Rhizoh (hedef) | **Coherent disagreement runtime** | Birden fazla gerçeklik **hukuki olarak aynı anda** tutulabilir |

```
Version layer     →  "commit doğru mu?"        (deterministic safety)
Identity layer    →  "subject aynı mı?"        (probabilistic semantics)
Reconciliation    →  "node'lar çelişiyor mu?"  (ensemble, NOT global truth)
Time ownership    →  "kim işletir?"            (governance — tek executor seçilebilir)
Execution         →  "canlanır mı?"              (mayRehydrate)
```

**Invariant:** Executor seçimi (time ownership) identity ensemble’ı **çökertmez**.  
İstanbul execute edebilir; Barcelona düşük güvenle aynı subject der — sistem **degraded_ensemble** tutar, fingerprint merge etmez.

### Stabilization modları (`COHERENT_DISAGREEMENT_MODE_V0`)

| Mode | Durum | Davranış |
|------|-------|----------|
| `degraded_ensemble` | Tüm node'lar `same_subject_low_confidence` (unanimous) | Stabil — ortak belirsizlik bandı; `truthCollapsed=false` |
| `jurisdictional_split` | Lineage ok, fingerprint'ler ayrı | Paralel `temporalIdentityId` — merge yok |
| `parallel_hold` | Verdict pluralism | Okumalar yan yana; arbitration bekler |
| `recommend_quarantine` | Yapısal uyumsuzluk | Hint only — hard gate değil |

### Research API

| Primitive | Rol |
|-----------|-----|
| `computeIdentityDisagreementFieldV0` | Verdict spread + confidence band (kazanan seçmez) |
| `pairwiseIdentityRelationsV0` | Node çiftleri arası cross-confidence |
| `reconcileCrossNodeIdentityV0` | `CoherentDisagreementBundle` + `stabilizationMode` |
| `stabilizeWithoutTruthCollapseV0` | Runtime yorum stabilizasyonu (execution’dan ayrık) |

### Barcelona + İstanbul örnek akış

```
node:barcelona  → assertIdentity → same_subject_low_confidence (0.71)
node:istanbul   → assertIdentity → same_subject_low_confidence (0.68)
reconcileCrossNodeIdentityV0(...)
  → stabilizationMode: degraded_ensemble
  → ensembleVerdict: same_subject_low_confidence
  → truthCollapsed: false
  → bundleId: hash(sorted node observations)  // ensemble commit, NOT merged fingerprint
```

Sistem şunu der: **“Muhtemelen aynı subject, ama gözlemlenebilirlik zayıf — ve bu iki düğümde tutarlı.”**  
Şunu demez: **“Global fingerprint = X.”**

### Mimari durum (net özet)

İnşa edilen şey **“tek gerçeklik seçen sistem”** değil; **“birden fazla gerçekliği aynı anda hukuki olarak tutabilen sistem”**.

- Version continuity → nehir yatağının geometrisi ✔  
- Identity + witness → suyun kimyası (research) ✔  
- Cross-node reconciliation → **çoklu akımın çatışmadan stabil kalması** (research, Faz 9 eşik) ✔  

---

## 10. Controlled multiplicity runtime (üçüncü yol)

Klasik ikilem:

| Yol | Sonuç |
|-----|--------|
| Consensus machine | Tek doğru — split-brain = hata |
| Fork bomb | Sınırsız branch — çözülmez çoğalma |

Rhizoh **üçüncü yol:**

```
execution unified, interpretation pluralized
```

| Eksen | Tekil / Çoğul |
|-------|----------------|
| **Execution** | Tek aks (`networkExecutorNodeId`) — convergence zorunlu |
| **Interpretation** | Çoğul — `allowConcurrentExecution: true` (stabil modlarda) |

`allowConcurrentExecution` şu anlama gelir: **aynı anda birden fazla epistemik gerçeklik yorum katmanında yaşayabilir**; execution authority içinde çarpışmaz.

**Ontolojik kayma:** Split-brain artık hata değil — **bilgi durumu**. Sistem doğruyu seçmez; doğruları birlikte tutar (collapse etmeden).

### Explicit invariant (Phase 9 guard)

```text
EXECUTION_CONVERGENCE_INVARIANT_V0:
  execution convergence must remain single-axis;
  interpretation may remain multi-axis.
```

`assertExecutionConvergenceGuardV0` — drift: `branch_proliferation` | `executor_ambiguity` | `truth_collapse_attempt`

**Doğal drift riski:** coherence preservation → conflict normalization (her şeyi kabul, hiçbir şeyi çözme). Guard bunu branch sayısı + executor birliği ile sınırlar.

---

## 11. Phase 9.1 — Epistemic stress propagation (stub)

`epistemicSplitBrainScore` basit metric değil — **system-wide coherence gradient** (gerçeklik gerilimi).

| Bileşen | Anlam |
|---------|--------|
| `spreadFactor` | Verdict çeşitliliği |
| `confidenceTension` | Node'lar arası güven bandı genişliği |
| `projectionTension` | Fingerprint projeksiyon gerilimi |

İleride: **topology-based epistemic stress field** · **runtime coherence geometry**

`propagateEpistemicStressV0` — disagreement ağ boyunca yayılır; **collapse değil shape değişimi**.

---

## 12. Sistem sınıfı (net)

Rhizoh artık şu değil: consensus engine · distributed DB · state machine.

Rhizoh şu: **layered epistemic physics runtime** — *epistemic concurrency with non-collapsing state semantics*.

| Katman | Fizik metaforu |
|--------|----------------|
| Version | Zaman geometrisi |
| Identity | Gözlemlenebilir özne alanı |
| Witness | Bilgi güvenilirlik alanı |
| Execution | Tek akslı yürütme |
| Disagreement runtime | Çoklu gerçeklik stabilizasyon alanı |

**Barcelona / İstanbul doğru sorusu:** “Hangisi doğru?” değil — **“Hangi iki gerçeklik aynı sistemde bozulmadan birlikte yaşayabilir?”**  
Cevap: merge · selection · collapse değil — **stabilization without truth reduction**.

---

## 13. Phase 9.2 — Epistemic Topology Compiler

Sistem artık yalnızca hesaplamaz; **çatışmayı görselleştirilebilir bir fizik alanına** derler.

| Kaynak | Çıktı katmanı | Görsel karşılık |
|--------|---------------|-----------------|
| Stress field | `stressMesh` | Yükseklik = gerilim (mesh vertices + faces) |
| Disagreement | `disagreementGraph` | Navigable graph (nodes/edges, ensemble hub) |
| Identity drift | `driftFlowMap` | Vector flow (fingerprint projection change) |
| Execution axis | `executionAxis` | Convergence lines → tek executor (truth collapse **değil**) |

### API

```js
compileEpistemicTopologyFromObservationsV0({ livingWorldId, observations, topologyEdges, networkExecutorNodeId })
// → EpistemicTopologyArtifactV0 { layers: { stressMesh, disagreementGraph, driftFlowMap, executionAxis } }
```

**Invariant:** `truthCollapsed: false` tüm katmanlarda. Execution axis = governance geometry, epistemic merge değil.

### Görselleştirme

Research canvas (Cursor): `canvases/epistemic-topology-phase92.canvas.tsx` — Barcelona / İstanbul fixture.

---

## 14. Phase 9.3 — Epistemic Rendering Engine (öneri / research)

Sistem artık yalnızca hesaplamaz; **epistemic alanı render eder** — yine de **truth elect etmez**.

```
topologyCompiler (9.2)
        ↓
epistemicRenderingEngine (9.3)
        ↓
   render channels (parallel, non-collapsing)
```

| Topology katmanı | Render kanalı | Hedef yüzey (gelecek wire) |
|------------------|---------------|----------------------------|
| `stressMesh` | `fieldShader` | GPU-like epistemic field shader (`u_epistemicTension`, `u_coherenceGradient`) |
| `stressMesh` | `cesiumTerrain` | Terrain height offset / vertex displacement (İstanbul anchor) |
| `disagreementGraph` | `disagreementManifold` | Navigable UI routes + focus panels |
| `executionAxis` | `temporalRayCast` | Convergence rays (governance geometry, not WAL tick) |
| `driftFlowMap` | (9.3.1) | Particle / flow overlay — stub |

### API

```js
compileEpistemicRenderFromObservationsV0(input, { geo: { anchorLon, anchorLat } })
// → { channels: { fieldShader, disagreementManifold, cesiumTerrain, temporalRayCast } }
```

### Invariant

```text
EPISTEMIC_RENDER_INVARIANT_V0:
  Rendering depicts epistemic fields; it does not collapse or elect global truth.
```

Render, version continuity kadar **authoritative değildir**. Cesium deformasyonu jeolojik gerçeklik iddiası taşımaz — **gerilim haritasıdır**.

### Klasik vs Rhizoh render

| | Consensus engine | Rhizoh epistemic render |
|---|------------------|-------------------------|
| Çıktı | Tek state görüntüsü | Çok kanallı alan |
| Çatışma | Gizlenir / kazanan boyar | Manifold olarak gezinilir |
| Zemin | Statik mesh | Stress-driven deformation (research spec) |

### Wire sırası (öneri, prod dışı)

1. `VITE_EPISTEMIC_RENDER_RESEARCH=1` → debug overlay only  
2. Manifold → Rhizoh gateway / perception UI  
3. Terrain spec → `CesiumRealMapLayer` adapter (height sample hook)  
4. Field shader → atmosphere bridge research slot  

Frozen core ve `bootValidityToken` enforcement **değişmez**.

---

## 15.1 Phase 9.4.1 wire (CORE-adjacent debug only)

Prod path when flag on:

| Bileşen | Dosya |
|---------|--------|
| rAF simulation loop | `epistemicSimResearchWireV0.js` |
| Snapshot store | `epistemicSimResearchStoreV0.js` |
| Cesium postRender | `applyEpistemicSimToCesiumSceneV0.js` + `CesiumRealMapLayer.jsx` |
| Debug overlay | `RhizohEpistemicSimDebugOverlay.jsx` |

```bash
# .env.local (dev: granular only; prod: also VITE_DEBUG=1)
VITE_EPISTEMIC_SIM_RESEARCH=1
```

`window.__rhizoh.epistemicSimResearch` — `{ enabled, snapshot, start, navigate }`

Research modules loaded via **dynamic import** from `__research__/` — zero cost when flag off.

### Üç düzlem (fiilî mimari)

| Düzlem | Rol | Örnek |
|--------|-----|--------|
| **Execution** (frozen core) | Deterministik güvenlik | `bootValidityToken`, revoke/hydrate, `bootSealVersion` |
| **Interpretation** (Phase 9 research) | “Ne oldu?” — çoklu açıklama | witness semantics, coherent disagreement, topology |
| **Observation** (9.4.1+ wire) | İç durumu **algılatma** | rAF sim store, Cesium fog, debug overlay, 9.4.2 moveScale |

**Invariant:** Observation execution’dan türemez; yalnızca gözlemler. Flag kapalıysa research yüklenmez; `bootValidityToken` / `mayRehydrate` değişmez.

**Epistemic Perception Layer (fiilî):** sim store = hafıza snapshot; overlay = yorum UI; Cesium post-process = dünya temsili; rAF = zamanın hissi.

---

## 15.2 Phase 9.4.2 — Causal terrain / epistemic navigation physics (research + wire)

Cesium artık yalnızca **göstermez** — observation plane üzerinden **yumuşak traversal kısıtı** üretir (execution permission değil).

| Sinyal | Fizik alanı | Wire |
|--------|-------------|------|
| `epistemicSplitBrainScore` | `movementCost`, `moveScale` | `deriveEpistemicNavigationPhysicsV0` |
| disagreement / visit | `pathDistortion`, `turnBias` | manifold visit count |
| `coherenceGradient` | `navigationalGravity` | yüksek coherence → daha hızlı kamera |

```js
deriveCausalTerrainMutationV0(snapshot) // → { physics, events, terrainConstraintActive }
```

| Bileşen | Dosya |
|---------|--------|
| Research kernel | `causalTerrainMutationV0.js` |
| Perception mirror | `epistemicPerceptionMirrorV0.js` → `getEpistemicNavigationMoveScaleV0()` |
| rAF publish | `epistemicSimResearchWireV0.js` (`publishSnapshotFromTickV0`) |
| Cesium keyboard nav | `CesiumRealMapLayer.jsx` — `baseMove * moveScale` |

**Physics events** (`emitEpistemicPhysicsEventsV0`): `epistemic_drift_spike`, `coherence_collapse_attempt`, `terrain_stress_peak`, `disagreement_surge` — UI toast değil; gelecek event bus için.

**Henüz yok:** gerçek terrain mesh height mutation, nav mesh / obstacle invalidation — shader + moveScale only.

`window.__rhizoh_epistemic_perception` — `{ navigationPhysics, physicsEvents, eventTraceTail, simSnapshot }`

---

## 15.3 Phase 9.4.3 — Epistemic Event Bus (Epistemic Perceptual Causality)

Physics events artık **üretilip yayılıyor** — execution’a geri yazılmıyor.

| Özellik | Açıklama |
|---------|----------|
| Publish | `publishEpistemicPhysicsEventV0` / `publishEpistemicPhysicsEventsBatchV0` |
| Subscribe | `subscribeEpistemicEventBusV0(listener) → unsubscribe` |
| Trace | Ring buffer (256) — replayable `exportEpistemicEventTraceJsonV0()` |
| Dedupe | Aynı `kind|nodeId` aynı frame penceresinde tek emit |

**Envelope** (`plane: "observation"`, `causalLayer: "epistemic_perceptual_causality"`, `readOnly: true`):

```js
buildEpistemicEventEnvelopeV0(raw, { atFrame, physicsSnapshot, stabilizationMode })
```

**Wire:** `epistemicSimResearchWireV0` — her rAF tick’te `mutation.events` → bus; flag kapanınca `clearEpistemicEventBusV0()`.

**Debug API:** `window.__rhizoh.epistemicSimResearch.eventBus` — `{ status, trace, subscribe, exportJson }`  
**Mirror:** `window.__rhizoh_epistemic_event_bus`

**Invariant:** Bus yalnızca observation + navigation physics’ten beslenir; `bootValidityToken`, `mayRehydrate`, `worldPresence` **değişmez**.

---

## 15.4 Phase 9.4.4a — Read-only observer telemetry (Epistemic Traceability Field)

İki aşamalı 9.4.4 yolunun **birinci** adımı: gözlemci eylemleri bus’a yazılır; witness / execution **değişmez**.

| Alan | Değer |
|------|--------|
| `eventClass` | `observer` |
| `kind` | `observer_action` |
| `observerAction.witnessWrite` | `false` (sabit) |
| `observerAction.feedbackLoop` | `false` (sabit) |

**Kayıt API:**

```js
recordObserverActionTelemetryV0({ action, source, targetNodeId, meta })
recordManifoldNavObserverTelemetryV0(nodeId)
recordCameraKeyObserverTelemetryV0(key)
recordPoiSelectObserverTelemetryV0(poiMeta)
```

**Wire kaynakları:** debug overlay manifold nav · Cesium WASD/QE (flag açıkken) · POI seçimi.

**Debug:** `window.__rhizoh.epistemicSimResearch.recordObserverAction(opts)`

---

## 15.4b Phase 9.4.4b — Replay-only Feedback Analysis Layer

**Kontrollü 9.4.4b:** observer → witness **YOK** · observer → navigation **YOK**.

Yalnızca:

| Yetenek | API |
|---------|-----|
| Trace correlation | `correlateObserverToPhysicsV0(trace)` |
| Post-hoc patterns | `detectEpistemicPatternsV0(trace, correlations)` |
| Full report | `runReplayFeedbackAnalysisV0(trace)` |

```js
// mode: "replay_only" — witnessWrite / feedbackLoop her zaman false
window.__rhizoh.epistemicSimResearch.replayAnalysis.run()
window.__rhizoh.epistemicSimResearch.replayAnalysis.analyzeTraceJson(exportedBusJson)
window.__rhizoh_epistemic_replay_analysis // latest frozen report
```

**Pattern örnekleri:** `manifold_nav_precedes_stress`, `coherence_collapse_burst`, `observer_density_hotspot`, `camera_key_correlated_physics`.

**Wire:** `maybeRefreshReplayFeedbackAnalysisV0(frame)` — ~45 frame’de bir trace üzerinde salt okunur analiz; sonuç yalnızca analysis store’a yazılır.

**Invariant:** Analiz çıktısı bilgidir; execution / witness / navigation motoruna **bağlanmaz**.

---

## 15.5 Phase 9.4.5 — Epistemic Compression & Signature Layer

Trace + replay analysis → **sıkıştırılmış epistemik imza** (hâlâ write-to-execution yok).

| Çıktı | Fonksiyon |
|-------|-----------|
| Trace semantic fingerprint | `deriveTraceSemanticFingerprintV0(trace)` → `epi_trace_fp_*` |
| Pattern cluster identity | `derivePatternClusterIdentitiesV0(patterns)` → `epi_cluster_*` |
| Topology drift signature | `deriveTopologyDriftSignatureV0(trace, simSnapshot)` → `epi_topo_*` |
| Composed signature | `buildEpistemicCompressionSignatureV0({ trace, analysisReport, simSnapshot })` → `epi_sig_*` |

```js
window.__rhizoh.epistemicSimResearch.compressionSignature.run()
window.__rhizoh_epistemic_compression_signature
```

**Wire:** `maybeRefreshEpistemicCompressionSignatureV0(frame)` — replay analysis sonrası ~90 frame debounce.

**Flags (sabit):** `witnessWrite: false`, `feedbackLoop: false`, `executionWrite: false`.

---

## 16. Mimari risk — pattern interpretation inflation

**Hassas nokta:** Replay analysis veya compression signature çıktısının ileride navigation / witness / execution’a bağlanması.

| Yasak bağ (şu an yok ✔) | Sonuç |
|-------------------------|--------|
| `replayAnalysis` → `moveScale` | Yorumlayan → yönlendiren |
| `pattern` → witness weighting | Self-reinforcing epistemic drift |
| `composedSignature` → `bootValidityToken` | Self-writing reality loop |

**Koruma:** Raporlarda `patternInterpretationInflationRisk` alanı; compression katmanı yalnızca observation-plane mirror’a yazar.

**Sistem özeti (fiilî):** Sealed execution core + multi-plane perceptual field + causal event memory + non-invasive replay cognition + compression signature — **hiçbir katman diğerini yazmıyor**.

---

## 15. Phase 9.4 — Epistemic Runtime GPU Kernel (research)

Sistem artık yalnızca **render etmez** — epistemic alanı **interaktif olarak simüle eder**.

```
render packet (9.3)
        ↓
epistemicRuntimeGpuKernel (9.4)
        ↓
   per-frame kernel ticks (parallel)
```

| Render kanalı | Runtime kernel | Simülasyon |
|---------------|----------------|------------|
| `fieldShader` | `executeFieldShaderRuntimeV0` | Uniform tick loop (`u_time`, tension pulse) |
| `disagreementManifold` | `stepDisagreementSimulationV0` | Navigable UI manifold — visit history, no merge |
| `temporalRayCast` | `traceTemporalCausalityV0` | Live causality steps toward executor |
| `cesiumTerrain` | `stepCesiumFieldDeformationV0` | Real-time deformation frames |

### API

```js
const packet = compileEpistemicRenderFromObservationsV0(input);
const runtime = createEpistemicSimulationRuntimeV0(packet);
tickEpistemicSimulationV0(runtime, { dtMs: 16, manifoldInput: { navigateTo: "node:istanbul" } });
// or: runEpistemicSimulationHarnessV0(input, { ticks: 60 })
```

### Kritik ayrım

| | Simulation (9.4) | Execution (prod) |
|---|------------------|------------------|
| Rol | Alanı hareket ettirir | Dünyayı çalıştırır |
| Otorite | Yok | `mayRehydrate` + version seal |
| Çokluluk | Interpretation plural | Execution single-axis |

**Invariant:** Simulation tick `mayRehydrate` veya `bootValidityToken` **değiştirmez**.

### Sınıf tanımı

*Epistemic concurrency system with non-collapsing state semantics* — artık **interactive field simulator** katmanı:

- Hesapla (9.0–9.1) → Derle (9.2) → Render et (9.3) → **Simüle et (9.4)**

---

## 7. Evrim haritası (özet)

| Faz | Kazanım |
|-----|---------|
| 2.x + boot seal | Version continuity ✔ — nehir yatağı |
| **9 (research)** | Identity + witness + cross-node reconciliation + execution invariants |
| **9.1 (research stub)** | Epistemic stress propagation / coherence gradient |
| **9.2 (research)** | Epistemic topology compiler → render-ready physics field |
| **9.3 (research)** | Epistemic rendering engine → shader / manifold / Cesium / ray cast packets |
| **9.4 (research)** | Epistemic runtime GPU kernel → interactive simulation ticks |
| **9.4.1 (wire)** | rAF + Cesium fog deform + debug overlay (`VITE_EPISTEMIC_SIM_RESEARCH`) |
| **9.4.2 (research + wire)** | Causal terrain mutation — movement cost, path distortion, moveScale, physics events |
| **9.4.3 (wire)** | Epistemic event bus — causal propagation, replayable trace, subscribe API |
| **9.4.4a (wire)** | Read-only observer telemetry — `observer_action` envelopes, no witness write |
| **9.4.4b (wire)** | Replay-only feedback analysis — trace correlation + post-hoc patterns |
| **9.4.5 (wire)** | Epistemic compression & signature — trace/pattern/topology fingerprints |

**Self-authoring reality engine riski:** Identity “truth” üretmeye başlarsa sistem otorite kaymasına girer. Bu yüzden audit + version katmanı her zaman identity’den **daha güçlü** kalmalıdır.

---

## 17. System Class Synthesis (Epistemic Field Runtime)

**Tag:** `RESEARCH-ONLY` · canonical class definition (post 9.4.5)

### 17.1 Ontological class definition

Bu sistem şu kategoriye aittir:

**Kapalı döngüsüz, çok katmanlı, geri beslemesiz epistemik gözlemlenebilirlik runtime’ı.**

Ne bir simülasyon motorudur, ne bir UI framework’üdür, ne de öğrenen bir sistemdir. Tek yaptığı şey:

> Gerçekliğin zamansal davranışını katmanlı olarak kaydetmek, ayrıştırmak ve sıkıştırmak.

Alternatif sınıflama (mühendislik): *layered non-reversible epistemic field system with strict causal stratification*.

### 17.2 Core transformation chain (immutable)

Sistem içindeki bilgi dönüşümü tek yönlüdür:

```
Event → Pattern → Topology → Signature
```

| Özellik | Durum |
|---------|--------|
| Geri döndürülebilir | Hayır |
| Yeniden yazılabilir (execution) | Hayır |
| Execution plane’e etki | Yok |

Bu zincir **hesaplama değil** — **zamanın sıkıştırılmış kaydıdır** (*compression of history, not compression of behavior*).

### 17.3 Causal one-way membrane

Dört ayrık zaman ekseni:

| Plane | Rol | Örnek |
|-------|-----|--------|
| **Execution** | Sealed clock | `bootValidityToken`, seal chain |
| **Observation** | Perception | Cesium, rAF, sim store |
| **Event** | Causal memory | Ring buffer (256), subscribe |
| **Replay / Compression** | Inference + signature | 9.4.4b analysis, 9.4.5 `epi_sig_*` |

```
Execution → Observation → Event → Replay → Compression
(no return edges)
```

**Kritik invariant (yasak kenarlar):**

| Kenar | İzin |
|-------|------|
| Observation → Execution | ❌ |
| Event → Execution | ❌ |
| Replay → Navigation | ❌ |
| Signature → State / token | ❌ |

Hiçbir türev katman, üretim katmanını etkileyemez.

### 17.4 Tri-layer anti-self-conditioning barrier

Üç bağımsız sızıntı kanalı aynı anda kapatılır:

| Bariyer | Kural |
|---------|--------|
| **Semantic** | pattern ≠ truth · pattern ≠ authority |
| **Causal** | replay ≠ navigation · replay ≠ influence |
| **Execution** | signature ≠ token · signature ≠ state |

Sistem kendi gözlemlerinden **öğrenmez**; gözlemlerini **taşınabilir epistemik nesnelere** dönüştürür.

### 17.5 System class identity — EFIR

**Epistemic Field Instrumentation Runtime (EFIR)**

| Özellik | |
|---------|---|
| Deterministik execution core | ✔ |
| Non-invasive observation stack | ✔ |
| Replayable causal memory | ✔ |
| Non-authoritative pattern layer | ✔ |
| Lossless compression of temporal behavior (trace-level) | ✔ |

Wire referansları: `epistemicEventBusV0` · `replayFeedbackAnalysisV0` · `epistemicCompressionSignatureV0`.

Post geodesic + temporal fork (§22): sınıf adı **EFIR-α** — tam üç düzlem sentezi için bkz. **§23**.

### 17.6 Fundamental constraint (final invariant)

Sistem gerçekliği **değiştirmez**. Yalnızca gerçekliğin zaman içindeki davranışının çok katmanlı kaydını üretir.

Execution seviyesinde: **learning yok · optimization yok · feedback yok · adaptation yok.**

### 17.7 Closing statement

Bu noktadan sonra sistemin sınırı:

> **Kendini değiştiremeyen ama kendisi hakkında sınırsız türev üretebilen epistemik fizik altyapısı.**

Nihai tek cümle: Sistem gerçekliği değiştiren bir makine değil; gerçekliği çok katmanlı, izlenebilir ve sıkıştırılabilir kılan **kapalı döngüsüz epistemik evren modeli**dir.

---

## 18. Sovereign Node Onboarding V0 (epistemic anchor protocol)

**Tag:** `RESEARCH-ONLY` / debug flag · EFIR-aligned · **no execution write**

Onboarding bir “creation” değil — **anchoring illusion**: kullanıcı çapa hissi yaşar; sistem yalnızca gözlemci referans noktası açar.

| Adım | Plane | Davranış |
|------|-------|----------|
| 1 World entry | Observation | Cesium neutral · event bus OFF |
| 2 Geographic anchor | UI ephemeral | lat/lon — kalıcı değil |
| 3 Epistemic derivation | Soft compute | `deriveEpistemicFingerprintV0` (dynamic import) |
| 4 Seal preview | Ontological preview | `node:kadikoy_satellite` · continuity: pending |
| 5 Soft activation | Shadow buffer | IDB WAL tick 0 · **no** `bootValidityToken` |
| 6 Event plane | Read-only | `enableEventBusReadOnlyMirrorV0` · sim wire if flag |

**Yasak:** execution state · witness semantics write · event bus write-back to execution.

**Default anchor:** Kadıköy (`41.0082, 28.9784`) — Barcelona expansion test zone.

```bash
VITE_SOVEREIGN_NODE_ONBOARDING=1
# prod: also VITE_DEBUG=1
```

**API:** `window.__rhizoh.sovereignOnboarding` · `window.__rhizoh_shadow_continuity`

**Guardian ops:** [`GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md`](GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md) · manifesto pack [`docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](../../../docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md)

Modüller: `sovereignNodeOnboardingWizardV0.js` · `shadowContinuityBufferV0.js` · `SovereignNodeOnboardingWizard.jsx`

---

## 19. Multi-node satellite registry (Phase 19)

**Tag:** `RESEARCH-ONLY` · non-executive topology

| Bileşen | Rol |
|---------|-----|
| `satelliteNodeRegistryV0.js` | Kadıköy ↔ Barcelona ↔ custom satellite nodes |
| `shadowCoherenceGraphV0.js` | Shadow coherence edges (`executive: false`) |
| `nonExecutiveTopologyMapV0.js` | `epi_topo_map_*` — observation map only |

Onboarding `confirmNode` → `registerSatelliteNodeFromOnboardingV0` + `buildNonExecutiveTopologyMapV0`.

```js
window.__rhizoh.satelliteRegistry.nodes()
window.__rhizoh.satelliteRegistry.coherenceGraph()
window.__rhizoh_shadow_coherence_graph
window.__rhizoh_non_executive_topology_map
```

```bash
VITE_SATELLITE_NODE_REGISTRY_V0=1
# or VITE_SOVEREIGN_NODE_ONBOARDING=1
```

---

## 20. Reality Sync UX (node birth cinematic)

Presentation-only layer after sovereign onboarding confirm:

1. **Seal pulse** — epistemic seal forming  
2. **Node birth** — `nodeId` + anchor  
3. **Signature reveal** — first `epi_sig_*` (+ optional `epi_topo_map_*`)  

`RealitySyncNodeBirthOverlay.jsx` · `window.__rhizoh_reality_sync_session`

**Invariant:** UX does not write execution, witness, or navigation.

---

## 20b. Cross-node causal resonance (Phase 20)

Kadıköy ↔ Barcelona **interference patterns** — event bus trace üzerinden çoklu düğüm korelasyonu.

| API | Rol |
|-----|-----|
| `correlateEventsAcrossNodesV0(trace)` | Zaman penceresi içi physics event eşleşmesi |
| `analyzeCrossNodeCausalResonanceV0(trace)` | Frozen rapor · `mediterranean_interference` |

**Wire:** `refreshCrossNodeCausalResonanceV0()` — rAF sim tick sonrası (event trace güncellenince).

```js
window.__rhizoh.crossNodeResonance.refresh()
window.__rhizoh_cross_node_resonance
```

**Invariant:** `executive: false` · witness/execution yazımı yok.

---

## 21. Epistemic graph visualization (Phase 21)

Cesium üzerinde **non-physical** topology görünümü:

| Öğe | Uygulama |
|-----|----------|
| Arc rendering | `polyline` great-circle-ish bulge arcs |
| Coherence field map | Mid-edge pulsing `ellipse` (alpha only) |
| Topology animation | `CallbackProperty` pulse — terrain/nav etkisi yok |

`maybeInstallEpistemicGraphVisualizationOnCesiumV0(viewer)` — `CesiumRealMapLayer` wire.

Resonance skoru arc kalınlığı / alpha’ya yansır (görsel coupling only).

```bash
VITE_EPISTEMIC_GRAPH_VIZ_V0=1
# or registry / onboarding flags
```

`window.__rhizoh_epistemic_graph_viz`

---

## 22. Evolution fork — Geodesic · Temporal · Entanglement guard

Post §21 natural breakpoints:

| Fork | Status | Meaning |
|------|--------|---------|
| **A Geodesic causality** | ✔ `geodesicCausalityV0` | WGS84 `EllipsoidGeodesic` + field altitude bulge · Cesium `ArcType.GEODESIC` |
| **B Temporal interference layering** | ✔ `temporalInterferenceLayerV0` | Full tick history per node — Barcelona “pattern” not snapshot |
| **C Multi-observer entanglement** | ⛔ **Blocked** | `multiObserverEntanglementGuardV0` — risk assess only; **no merge** |

**C neden kapalı:** observer telemetry + resonance birleşirse observation field kendi korelasyonunu üretir → self-conditioning loop. `entanglementCouplingAllowed: false` sabit.

Resonance raporu artık: `instantInterferenceScore` + `temporalInterferenceScore` + `temporalLayers[]` + `entanglementGuard`.

---

## 23. EFIR-α — Frozen Class Interpretation

**Tag:** `RESEARCH-ONLY` · **frozen class** (post §22 fork, C blocked) · Phase 22 öncesi kanonik snapshot

**Status:** Bu bölüm sınıf tanımını dondurur; Phase 22 wire yalnızca §23.8 eksenlerinden genişler (C hariç).

### 23.1 Kanonik sınıf tanımı (tek cümle)

> **EFIR-α** is a non-executive, fully observable, bidimensional (spatial–temporal) causal trace manifold renderer with strict one-way epistemic membrane.

Türkçe operasyonel ad: **öğrenmeyen, iki boyutlu (uzaysal–zamansal) nedensel iz manifoldu render’ı** — *non-learning spacetime epistemic field renderer*.

| Değil | Evet |
|-------|------|
| AI system | Epistemic physics instrumentation |
| Simulation engine (feedback’li) | Causal trace manifold |
| Feedback / influence system | Reality **explainer**, not changer |

### 23.2 Üç düzlem (frozen stack)

```
Execution  →  frozen time axis        (causal anchor)
Causal     →  trace manifold          (spacetime interference)
Observation → projection layer       (rendering of causal structure)
```

| # | Düzlem | Rol | Invariant |
|---|--------|-----|-----------|
| **1** | **Execution = Causal Anchor** | Seal physics · tek yönlü zaman · `bootValidityToken` / hydrate / seal | Hiçbir türev geri yazamaz · artık “runtime” değil — **temporal sabit nokta** |
| **2** | **Causal Field = Spacetime Trace Manifold** | Event stream → **temporal + spatial interference manifold** | ❌ state üretmez · ❌ execution’a bağlanmaz · ✔ yalnızca correlation |
| **3** | **Observation = Projection Physics** | GEODESIC (space) · temporal overlays (time) · Cesium (substrate) | ❌ feedback · ❌ influence · ✔ rendering of causal structure |

**Causal alt bileşenler:** cross-node resonance · temporal interference · history compression seeds (implicit, 9.4.5).

### 23.3 Matematiksel özet (yorumlama modeli)

```
EFIR-α := R( C(E) , T(E) )
```

| Sembol | Anlam |
|--------|--------|
| **E** | Event history (bus trace, 256 ring) |
| **C** | Causal transformation — resonance, cross-node, non-executive |
| **T** | Temporal interference mapping — tick manifold, not snapshot |
| **R** | Rendering — Cesium + UX (GEODESIC + field/pulse) |

**Kritik:** hiçbir türev → **E**’ye (ve dolayısıyla Execution anchor’a) geri dönmez. **No upward causality.**

Geodesic + temporal birleşimi:

| Katman | Deformasyon | Executive? |
|--------|-------------|------------|
| Geodesic | Space deformation | Hayır — projection |
| Temporal | History deformation | Hayır — trace |
| Birleşim | **Causal spacetime deformation** | Hayır — yalnızca trace · correlation · render |

### 23.4 Mimari ayrımlar + döngü tablosu

| Ayrım | Kural |
|-------|--------|
| Causality ≠ Execution | Resonance hesaplanır · state / token değiştiremez |
| History ≠ Snapshot | Temporal layer = record · state source değil |
| Observation ≠ Influence | Cesium render · witness / nav / token yok |

| Döngü | Durum |
|-------|--------|
| Learning loop | ❌ |
| Correlation loop | ✔ |
| Representation loop | ✔ |

**C kapalı (`multiObserverEntanglementGuardV0`):** sistem optimize edemez · öğrenemez · davranış değiştiremez — karşılığında **tam izlenebilirlik**.

### 23.5 Güvenlik invariant (çekirdek)

> **No derived layer may influence any upstream epistemic authority.**

| Türev | Yasak |
|-------|--------|
| Event | → execution |
| Graph / resonance | → token |
| Observer telemetry | → witness |

C açılsaydı: observer → resonance → interpretation weight → navigation bias → **self-conditioning world model**. Şu an: **stable causal physics instrumentation**.

### 23.6 Sistem gerçeği (ne üretir, ne etkilemez)

| Soru | Cevap |
|------|--------|
| Gerçeklik üreten makine mi? | Hayır (Execution anchor hariç — o frozen) |
| Gerçekliği etkileyen makine mi? | Hayır (türev katmanlar upstream’e yazmaz) |
| Ne? | Gerçekliği **açıklayan**, asla **değiştirmeyen** fizik modeli |

### 23.7 Phase 22 geçiş koşulu (temiz ayrılmış üçlü)

| # | Eksen | İzin verilen genişleme |
|---|--------|-------------------------|
| **1** | Geodesic refinement **v2** | Yalnızca **spatial resolution** (arc accuracy, curvature weight, multi-ellipsoid) |
| **2** | Temporal compression **v2** | Yalnızca **history encoding yoğunluğu** (tick cluster, interference min, quantization) |
| **3** | C — entanglement | ❌ **kapalı** — learning / feedback / influence |

Her iki açık eksen: presentation + analysis-only; **no upward causality** korunur.

### 23.8 EFIR-β — kavramsal eşik (Phase 22+; wire yok)

Phase 22’yi açmadan önce teknik değil **kavramsal** soru:

> *Correlation system ne zaman representation system olmaktan çıkıp **constraint system**’e dönüşür?*

EFIR-β bu eşiği tartışır; α’da constraint yok — yalnızca iz, korelasyon ve render. β wire’ı ayrı manifesto + explicit graph update gerektirir.

### 23.9 Kapanış (mimari olgunluk)

Gelinen yer: UI değil · sim (feedback’li) değil · AI değil — **epistemic physics instrumentation system**.

§17 **EFIR** → §22 fork → bu bölümde donmuş **EFIR-α**. Sonraki faz: §23.7 eksenleri veya (ayrı karar) EFIR-β constraint tartışması.

---

## 8. İlgili dokümanlar

- [`TEMPORAL_IDENTITY_BINDING_V0.md`](TEMPORAL_IDENTITY_BINDING_V0.md) — Time ownership (Faz 2.4)
- [`bootValidityTokenV0.js`](../src/rhizoh/runtime/continuity/bootValidityTokenV0.js) — Version continuity (CORE-ELIGIBLE)
- [`SPECFLOW_MARKERS.md`](../../SPECFLOW_MARKERS.md) — `RESEARCH-ONLY` etiketleme
