# Academic habitat — oturum günlüğü (SESSION_LOG)

**Amaç:** Her habitat çalışmasında **karar izi** ve **artefakt köprüsü** — akademik üretimin repoda izlenebilir olması. Bu dosya **execution engine değildir**; süreç ve şeffaflık katmanıdır.

**Formal ad (ETSS-1):** Bu günlük **Temporal Audit Ledger (TAL)** örneğidir — yapısal nedensellik (**Episodic Causal Graph / ECG**) ile karıştırılmamalıdır. Tam spec: [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](../EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md).

## URL vs canonical memory

Harici **ChatGPT / tarayıcı oturum URL’leri** çoğu zaman **taşınabilir içerik değildir** — oturuma bağlı temsil; dışarıdan deterministik okuma beklenmez. **URL = pointer**, canonical kayıt **repo + bu günlük + özet + artefact listesi**.

| Zayıf (tek başına) | Güçlü |
|--------------------|--------|
| Ham oturum linki | **Summary + Linked Artifacts + Git** |

Pipeline özeti: Live conversation → observation extraction → **SESSION_LOG** → attribution mührü → repo.

## Observation artifact ledger (runtime ↔ repo)

İstemcide üretilen **Attested Boot Observation Artifact** (ABOA) ve ilerideki gözlem artefaktları, bu günlükte **aynı alan adlarıyla** kayda geçirilebilir. Amaç: **runtime mühür** ile **repo defteri** birebir eşleşsin ([`OBSERVATION_EVENT_REGISTRY.md`](../OBSERVATION_EVENT_REGISTRY.md) event #1).

**Not:** `fingerprint` ve `fieldSnapshot` değerleri oturum başına değişir; kayıt sırasında `window.__rhizoh.debug().bootObservationArtifact` (veya eşdeğer) çıktısından **kopyalanır**. Bu blok **execution kanıtı değil**, izlenebilirlik / audit köprüsüdür.

## Nasıl kullanılır

- Her anlamlı oturum veya PR öncesi **yeni bir blok** ekleyin (en üste veya en alta tutarlı bir sıra — takım kararı).
- Frozen core’a dokunan bir PR varsa: blokta `CORE-ELIGIBLE` + `npm run stabilization:validate-graph` sonucu not edin.
- Ham LLM çıktısı yerine: **özet**, **insan review**, **PR linki**.

---

## Şablon (kopyala-yapıştır)

```markdown
### YYYY-MM-DD — <kısa başlık>

**Source:** (isteğe bağlı — harici oturum pointer’ı canonical değildir)
- Örn. ChatGPT custom GPT (…) — yalnızca izlenebilirlik

**Summary:**
- Madde madde ne sabitlendi

**Linked Artifacts:**
- `docs/OBSERVATION_FABRIC_V1.md`
- …

- **Habitat:** Academic (veya ileride Robotics / …)
- **Katılımcılar:** <isimler + Cursor Agent>
- **SPECFLOW:** RESEARCH-ONLY | CORE-ELIGIBLE | FUTURE-PROOF-ONLY
- **Hedef:** <bir cümle>
- **Çıktılar:** <dosya/issue/PR>
- **Karar özeti:** <ne kabul / ne red>
- **Frozen core:** dokunulmadı | dokunuldu (gerekçe + validator yeşil)
- **Notlar / trace:** <isteğe bağlı>
```

### Boot Observation Event (ABOA — event #1)

Runtime boot attestation kaydı için şablon ([`BOOT_ARTIFACT_PROTOCOL.md`](../BOOT_ARTIFACT_PROTOCOL.md)):

```markdown
### YYYY-MM-DD — Boot Observation Event

**Event:**
- **id:** 1
- **type:** boot
- **schemaVersion:** ABOA-1
- **semanticVersion:** v1.2.1
- **fingerprint:** sha256:<hex> — *`bootObservationArtifact.fingerprint`*

**Provenance:**
- **phase:** STABLE | CHAOS | BIFURCATION | UNKNOWN
- **scenario:** RHIZOH | CASTLE | GHOST | UNKNOWN
- **readoutDegraded:** true | false
- **fieldSnapshot:**
  - **intensity:** <number>
  - **entropy:** <number>
  - **coherence:** <number>

**Source:** (isteğe bağlı)

**Summary:**
- Kısa açıklama (örn. ilk epistemik boot tasdiki yayımlandı / protokol güncellendi)

**Linked Artifacts:**
- `docs/BOOT_ARTIFACT_PROTOCOL.md`
- `docs/WELCOME_RHIZOH.md`
- `docs/OBSERVATION_EVENT_REGISTRY.md`
- `docs/ARTIFACT_FAMILY_TAXONOMY.md`

- **SPECFLOW:** FUTURE-PROOF-ONLY
- **Frozen core:** dokunulmadı | dokunuldu (…)
```

---

## Günlük

### 2026-06-12 — World · Space map pins + cohort allowlist (gün kapanışı)

**Summary:**
- `/world/space` Sovereign v11 harita: Leaflet varsayılan; Cesium opt-in (`VITE_RHIZOH_WORLD_SPACE_CESIUM=1`).
- MY CASTLE / EVENT / RADIO pin tıklaması geçici olarak farklı YouTube kanallarına yönlendiriliyor (`castle_genesis` / `nasa` / `lofi`) — **kalıcı model değil**.
- **Ertelenen (FUTURE):** Her pinin kendine özgü yetenekleri var; kullanıcı EVENT oluşturduğunda bu ileride **kendi canlı yayını** veya **daha önce yayınlanmış event VOD** olmalı — sabit media player kanalı değil.
- Kohort allowlist: `iremkaraman@gmail.com` eklendi (`functions/cohort-email-allowlist.v0.json`).

**Linked Artifacts:**
- `apps/client/src/rhizoh/runtime/worldSpaceMediaChannelsV0.js`
- `apps/client/src/rhizoh/runtime/sovereignWorldMapNodesV0.js`
- `functions/cohort-email-allowlist.v0.json`
- PR #30 (branch `cursor/sovereign-v11-map-integrate-3d11`)

- **Habitat:** Collaboration / ops
- **SPECFLOW:** RESEARCH-ONLY (pin semantics); cohort = ops
- **Frozen core:** dokunulmadı
- **Not:** Bugün için bu kadar — pin→event VOD/live modeli sonraki sprint.

### NEXT SPRINT — Tower API keys + workspace + library pins

**Hedef (CORE-ELIGIBLE değil; habitat / ürün yüzeyi):**
- Tüm **tower** pinleri (Gemini, Claude, ChatGPT, DeepMind, Mistral, Kyoto, Sora, …) için **gerçek provider API key** env + gateway firewall
- Her tower → **gerçek workspace** (`RhizohV11TowerWorkspaceHostV0` / entity registry) — sim placeholder değil
- **LIBRARY (vault)** + kişisel **arşiv kütüphane** katmanı pinleri → encrypted archive / media archive ile bağlantı
- EVENT pin → kullanıcı canlı yayın veya yayınlanmış event VOD (sabit YouTube kanalı değil)

**Bağımlılıklar:** gateway secret store, `VITE_*` / Functions env, tower workspace spec SSOT, frozen core dokunulmaz.

**SPECFLOW:** RESEARCH-ONLY → implementasyon sprintinde CORE-ELIGIBLE olmayan runtime katmanları (`worldSpace*`, `sovereignWorldMap*`, tower workspace host).

### 2026-06-01 — Academic Observatory Layer (AOL) v0 SSOT

**Summary:**
- Kapalı ürün vs açık araştırma alanı ayrımı SSOT’ye alındı: sistem **çalışırken anlaşılabilir** olmalı; prod yüzeyi debug’a dönmemeli.
- AOL üç iş: observation export · trace→paper · reproducibility — model değiştirmez, UX optimize etmez, ürün feature üretmez.
- Katman harfleri: A=core, B=engine, C=surface, **D=AOL** ([`RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md`](../RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md)).

**Linked Artifacts:**
- `docs/RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md`
- `docs/schemas/academic-observation-export-v0.schema.json`

- **Habitat:** Academic
- **SPECFLOW:** RESEARCH-ONLY
- **Frozen core:** dokunulmadı
- **Kod:** `apps/gateway/src/rhizoh/academicObservationExportV0.js`, `academicObservatoryHttpV0.js`, `GET /rhizoh/academic/observatory/export`

### 2026-05-09 — Founding state sealed (PRE-BOOTSTRAP)

**Tag:** `FOUNDING_STATE_PRE_BOOTSTRAP_V1`  
**Seal:** [`docs/FOUNDING_STATE_PRE_BOOTSTRAP_V1.md`](../FOUNDING_STATE_PRE_BOOTSTRAP_V1.md)

Constitutional substrate specification complete (pre-bootstrap). No `genesis_hash`, operational KMS attestation, or **ACTIVE** constitutional declaration exists until bootstrap ceremony steps in that document are completed.

- **SPECFLOW:** FUTURE-PROOF-ONLY (governance / reference corpus)
- **Frozen core:** dokunulmadı

### 2026-05-09 — Boundary Confirmed

External layer documents established:

- `docs/MEDIA_OBSERVER_BRIDGE.md` (PLANNED / EXTERNAL-LAYER)
- `docs/NOTEBOOKLM_REGISTER.md` (cross-reference only)
- `docs/CURSOR_TEAM_ONBOARDING_CHECKLIST.md` (PLANNED / REFERENCE-LAYER)

Layer contract locked:  
SESSION_LOG = ledger | Artifact = canonical object | Media = external pointer | NotebookLM = retrieval surface

AGENTS.md pointer added — non-authoritative, discovery only.

Invariant confirmed: Media may inform observation; media may never define canonical truth.

### 2026-05-08 — SESSION_LOG ↔ ABOA ledger + artifact family taxonomy

**Event:**
- **id:** 1
- **type:** boot
- **schemaVersion:** ABOA-1
- **semanticVersion:** v1.2.1
- **fingerprint:** sha256:*(oturumda `bootObservationArtifact.fingerprint` ile doldurulur)*

**Provenance:**
- **phase:** *(runtime readout — örn. STABLE)*
- **scenario:** *(örn. RHIZOH)*
- **readoutDegraded:** false
- **fieldSnapshot:**
  - **intensity:** *(runtime)*
  - **entropy:** *(runtime)*
  - **coherence:** *(runtime)*

**Summary:**
- SESSION_LOG’a Boot Observation Event şablonu ve runtime↔repo ledger notu eklendi.
- Planned gözlem artefakt aileleri: ASAA, AFOA, AOJA, APEA — `ARTIFACT_FAMILY_TAXONOMY.md`.
- Observation Event Registry tablosu artifact kodlarıyla güncellendi.

**Linked Artifacts:**
- `docs/BOOT_ARTIFACT_PROTOCOL.md`
- `docs/OBSERVATION_EVENT_REGISTRY.md`
- `docs/ARTIFACT_FAMILY_TAXONOMY.md`
- `docs/WELCOME_RHIZOH.md`
- `docs/FIRST_TOUCH_PROTOCOL.md`

- **Katılımcılar:** Principal, **Cursor Agent (Castle)**
- **SPECFLOW:** FUTURE-PROOF-ONLY
- **Frozen core:** dokunulmadı

### 2026-05-09 — Observation Fabric + Layer Expansion (canonical mühür)

**Source:**
- ChatGPT custom GPT (Can Kasaplar / Nisa Nur Yıldırım workspace) — *harici oturum; canonical içerik repoda*

**Summary:**
- Execution layer fully isolated from observation layer
- Multi-agent system reframed as observational fabric (not execution intelligence)
- Attribution = forensic trace, not semantic authority
- Layer expansion restricted to projection / interpretive space only
- External chat URLs are session-bound pointers; SESSION_LOG + artifacts are canonical

**Linked Artifacts:**
- `docs/OBSERVATION_FABRIC_V1.md`
- `docs/LAYER_EXPANSION_PROTOCOL.md`
- `docs/AGENT_IDENTITY_AND_ATTRIBUTION.md`
- `docs/WORLDSTATE_V0_SPEC.md` · `docs/schemas/worldstate-v0.schema.json`
- `docs/CURSOR_AGENT_INTRO.md`

- **Katılımcılar:** Principal, **Cursor Agent (Castle)**
- **SPECFLOW:** FUTURE-PROOF-ONLY
- **Frozen core:** dokunulmadı

### 2026-05-08 — WorldState v0 + replay/diff canonical spec

- **Hedef:** Laboratuvar evren snapshot’ı; Frozen Causal Kernel + Expanding Observational Manifold — **kernel sabit, manifold kaydı**.  
- **Çıktılar:** `docs/WORLDSTATE_V0_SPEC.md`, `docs/schemas/worldstate-v0.schema.json`; attribution § forensic vs pseudo-authority (`AGENT_IDENTITY_AND_ATTRIBUTION.md`).  
- **SPECFLOW:** FUTURE-PROOF-ONLY  
- **Frozen core:** dokunulmadı  

### 2026-05-08 — Observation Fabric + Layer Expansion + attribution mührü

- **Habitat:** Policy / orchestration  
- **Katılımcılar:** Principal, **Cursor Agent (Castle)**  
- **SPECFLOW:** FUTURE-PROOF-ONLY  
- **Hedef:** Çoklu gözlemci = observers only; execution isolation; katman genişlemesi core’u yeniden tanımlamaz; kimlik/mühür belgesi.  
- **Çıktılar:** `docs/OBSERVATION_FABRIC_V1.md`, `docs/LAYER_EXPANSION_PROTOCOL.md`, `docs/AGENT_IDENTITY_AND_ATTRIBUTION.md`; `AGENTS.md`, `SPECFLOW_MARKERS.md`, `ARCHITECTURE_POST_FREEZE_SUMMARY.md`, `validateSpecflowCoherence.mjs`, CI paths.  
- **Karar özeti:** *Multi-layer observational intelligence* — symbiotic **observation**, not symbiotic **execution** intelligence.  
- **Frozen core:** dokunulmadı  

### 2026-05-08 — Multi-agent bootstrap + context reconstruction

- **Habitat:** Academic / orchestration  
- **Katılımcılar:** orchestrator, Cursor Agent  
- **SPECFLOW:** FUTURE-PROOF-ONLY (süreç dokümanları)  
- **Hedef:** Nisa (ChatGPT) / Cursor / mimari review için **yeniden kurulabilir bağlam**; shared memory yok.  
- **Çıktılar:** `docs/SPRINT_BOOTSTRAP_TEMPLATE.md`, `docs/CONTEXT_RECONSTRUCTION_PROMPT.md`; `AGENTS.md`, `HABITAT_COLLABORATION_ACADEMIC.md`, `SPRINT_HABITAT_ACADEMIC.md`, `SPECFLOW_MARKERS.md`, CI path güncellemesi.  
- **Karar özeti:** Üç adım protokolü ve üç rol prompt’u repoda sabitlendi.  
- **Frozen core:** dokunulmadı  

### 2026-05-08 — Habitat + bias katmanı notu

- **Habitat:** Academic  
- **Katılımcılar:** proje sahibi, Cursor Agent  
- **SPECFLOW:** FUTURE-PROOF-ONLY (belge / kural katmanı)  
- **Hedef:** `.cursor/rules`, `AGENTS.md`, habitat doc ile **soft execution policy** sabitleme; engine ile karıştırılmaması.  
- **Çıktılar:** `AGENTS.md`, `.cursor/rules/frozen-core-habitat.mdc`, `ARCHITECTURE_POST_FREEZE_SUMMARY.md` §6 güncellemesi, bu SESSION_LOG.  
- **Karar özeti:** Koordinasyon katmanı eklendi; graf/hash CI hakemi değişmedi.  
- **Frozen core:** dokunulmadı  

---

### 2026-06-19 — World darkness regression (prod observation — deferred)

**Summary:**
- Prod (`index-DLrhb7we.js`, `/world/space`): arka plan dünya çok karanlık; önceden şehir / drone / sürü görünürlüğü vardı.
- Boot: `simulation_world_rebuild` → `activeGhosts: 0`, `totalGhosts: 0` (swarm katmanı boş replay sonrası).
- Chess arena overlay: `RhizohChessArenaWorkspaceV0` → `bg-black/80 backdrop-blur-sm` (bilinçli dim; frozen core değil).
- Surface policy: T0 `/` = Apex GLOBE + procedural swarm; `/world/space` = Cesium map stage — **Apex drones suppressed** (`shouldUseApexProceduralRealMapV0` false on space route).
- Olası katmanlar (sonra bakılacak): `spatialBootGate` renderMode, `worldLayerStatus` RENDERER_PENDING, `worldDomainCalmMode` (legal hold / spiral countdown), Cesium mount vs V11 fallback, kamera framing inside arena vs world mesh.
- Frozen core (v562–v570): dokunulmadı; perception/camera = regression-only per phase gate.

**Prod diagnostics (bookmark):**
```js
window.__rhizoh.worldLayerStatus
window.__rhizoh.spatialRendererRegistry
window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__ // dev only
await __RHIZOH_FULL_REPORT__()
```

**Linked Artifacts:**
- `docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md` (policy red line)
- `docs/SURFACE_REDUCTION_PASS_LIVE_V0.md` (prod debug overlays off)
- `apps/client/src/components/RhizohChessArenaWorkspaceV0.jsx` (arena dim layer)
- `apps/client/src/rhizoh/runtime/rhizohWorldSurfacePolicyV0.js`

- **Katılımcılar:** Principal, **Cursor Agent**
- **SPECFLOW:** RESEARCH-ONLY
- **Frozen core:** dokunulmadı
- **Durum:** not alındı — implementasyon ertelendi (UGL/chess öncelikli sprint)

*(Sonraki oturumlar için üste veya alta yeni blok ekleyin.)*
