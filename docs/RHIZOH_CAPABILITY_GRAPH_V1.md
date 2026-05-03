# RHIZOH Capability Graph v1

Bu belge RHIZOH icin "capability routing layer" sozlesmesidir.
Amac, tum modulleri tek bir intent-to-capability esleme duzenine sabitlemektir.

Bu belge ile:

- UI tek yuzeyde kalir (SLE korunur)
- backend sonsuz karmasiklikta buyuyebilir
- urun davranisi deterministik contract ile sabitlenir

## 1) Sistem Katmanlari ve Sorumluluk Siniri

### 1.1 RHIZOH CORE (hidden)

Kapsam:

- agents
- substrate
- governance engine
- replay / proof
- recovery / reconciliation

Ilke:

- Core dogrudan UI ile konusmaz
- Core, Capability Graph'e execution primitive saglar

### 1.2 WORLD LAYER (visible world)

Kapsam:

- ApexEngine
- Cesium
- MMO / Studio / Spiral entegrasyon yuzeyleri
- camera systems
- event rendering

Ilke:

- Dunya gorunur
- Orkestrasyon detaylari gizli

### 1.3 SLE LAYER (product surface)

Kapsam:

- single intent entry
- single scene UX
- state visualizer
- feedback + explainability

Ilke:

- Kullanici modul secmez
- Kullanici sonuc gorur

### 1.4 CAPABILITY GRAPH LAYER (missing piece -> bu belge)

Kapsam:

- intent classification
- capability node secimi
- route planlama
- fallback secimi

Ilke:

- "Niyet -> hangi moduller -> hangi output contract"

## 2) Capability Node Registry v1

Capability node'lari, runtime'ta id bazli kayitli olmalidir.

### 2.1 Primary experience nodes

- `CAP_STUDIO_BROADCAST`
  - Rol: yayin/icerik stream orkestrasyonu
  - Dunya etkisi: broadcast pipeline trigger
  - Cikti: stream session + eventId

- `CAP_GREENROOM_INTERACTION`
  - Rol: live interaction / host controls
  - Dunya etkisi: audience interaction state mutation
  - Cikti: live interaction envelope

- `CAP_SPIRAL_MMO_SIMULATION`
  - Rol: MMO world event propagation
  - Dunya etkisi: worldDelta + actor update
  - Cikti: simulation event package

- `CAP_OCTOAI_CHARACTER_RUNTIME`
  - Rol: character/ghost/NPC davranis orkestrasyonu
  - Dunya etkisi: agent persona state mutation
  - Cikti: character runtime packet

- `CAP_SWARM_COORDINATION`
  - Rol: coklu agent/squad/surge koordinasyonu
  - Dunya etkisi: distributed actor activation
  - Cikti: swarm activation report

- `CAP_ROBOTICS_CLOSED_LOOP`
  - Rol: robotics mechanics bridge / closed loop command
  - Dunya etkisi: mechanical state transition
  - Cikti: robotics execution trace

### 2.2 Core trust nodes

- `CAP_GOVERNANCE_GATE`
  - `NORMAL | DEGRADED | FROZEN` policy gate

- `CAP_PROOF_WITNESS`
  - proof/replay witness olusturma

- `CAP_REPLAY_SEAL`
  - deterministic trace sealing

- `CAP_RECOVERY_CONTROLLER`
  - rollback/retry/degrade/human intervention

- `CAP_AUDIT_EXPORT`
  - external review/export compliance pack

### 2.3 World infrastructure nodes

- `CAP_WORLD_RENDER`
  - ApexEngine render/update bridge

- `CAP_REAL_MAP_CONTEXT`
  - Cesium/geospatial context routing

- `CAP_CAMERA_ORCHESTRATION`
  - human/drone/rhizoh camera behavior

- `CAP_EVENT_MESH_PROPAGATION`
  - world event dag/mesh yayimi

## 3) Intent Taxonomy v1

Intent siniflari sabit enum olarak korunur:

- `create`
- `simulate`
- `broadcast`
- `explore`
- `coordinate`
- `recover`
- `govern`

Domain siniflari:

- `studio`
- `greenroom`
- `mmo`
- `spiral`
- `octoai`
- `swarm`
- `robotics`
- `generic`

## 4) Intent -> Capability Mapping Contract

Asagidaki eslemeler urun davranisi icin minimum zorunlu rotalardir.

### 4.1 Broadcast family

- Intent pattern: "canli yayin", "live broadcast", "studio performansi baslat"
- Primary: `CAP_STUDIO_BROADCAST`
- Secondary: `CAP_GREENROOM_INTERACTION`
- Safety: `CAP_GOVERNANCE_GATE`
- Trace: `CAP_PROOF_WITNESS` + `CAP_REPLAY_SEAL`
- Output class: `OUT_LIVE_EVENT`

### 4.2 MMO / simulation family

- Intent pattern: "world event olustur", "simulasyon baslat", "arena senaryosu"
- Primary: `CAP_SPIRAL_MMO_SIMULATION`
- Secondary: `CAP_EVENT_MESH_PROPAGATION`, `CAP_WORLD_RENDER`
- Safety: `CAP_GOVERNANCE_GATE`
- Trace: `CAP_PROOF_WITNESS`
- Output class: `OUT_SIMULATION_EVENT`

### 4.3 Character / NPC / ghost family

- Intent pattern: "NPC uret", "ghost character baslat", "karakter canlandir"
- Primary: `CAP_OCTOAI_CHARACTER_RUNTIME`
- Secondary: `CAP_SWARM_COORDINATION` (opsiyonel)
- Safety: `CAP_GOVERNANCE_GATE`
- Trace: `CAP_REPLAY_SEAL`
- Output class: `OUT_CHARACTER_EVENT`

### 4.4 Swarm coordination family

- Intent pattern: "squad topla", "swarm aktive et", "agentleri organize et"
- Primary: `CAP_SWARM_COORDINATION`
- Secondary: `CAP_SPIRAL_MMO_SIMULATION`
- Safety: `CAP_GOVERNANCE_GATE`
- Trace: `CAP_PROOF_WITNESS` + `CAP_REPLAY_SEAL`
- Output class: `OUT_SWARM_EVENT`

### 4.5 Robotics family

- Intent pattern: "robotik dongu calistir", "mechanics bridge execute"
- Primary: `CAP_ROBOTICS_CLOSED_LOOP`
- Secondary: `CAP_WORLD_RENDER` (telemetry reflection)
- Safety: `CAP_GOVERNANCE_GATE` (strict profile)
- Trace: `CAP_PROOF_WITNESS` (required)
- Output class: `OUT_ROBOTICS_EVENT`

### 4.6 Governance and recovery family

- Intent pattern: "sistemi dondur", "recovery baslat", "rollback yap"
- Primary: `CAP_GOVERNANCE_GATE` veya `CAP_RECOVERY_CONTROLLER`
- Secondary: `CAP_AUDIT_EXPORT`
- Trace: `CAP_REPLAY_SEAL` (required)
- Output class: `OUT_CONTROL_EVENT`

## 5) Routing Policy v1

Runtime routing asagidaki sirada calisir:

1. Intent classify
2. Domain infer
3. Capability candidate list
4. Governance pre-check
5. Simulation required mi?
6. Execute route
7. Seal + proof witness
8. Feedback + explainability

Deterministik karar anahtari:

- `routingKey = intentType + inferredDomain + governanceLevel`

Ayni `routingKey` ayni capability sirasini vermelidir (policy version sabitse).

## 6) Governance-Aware Route Mutation

### 6.1 NORMAL

- full capability graph route acik
- auto-approve mode (risk threshold altinda)

### 6.2 DEGRADED

- risky secondary node'lar kapatilir
- approval gerekebilir
- fallback route oncelikli

### 6.3 FROZEN

- reality mutation bloke
- sadece safe/read-only veya recovery flow
- zorunlu human intervention

### 6.4 RECOVERY

- `CAP_RECOVERY_CONTROLLER` primary olur
- rollback/retry/degrade secimi policy ile yapilir

## 7) Output Contract Registry

Her route asagidaki output siniflarindan birine inmelidir:

- `OUT_LIVE_EVENT`
- `OUT_SIMULATION_EVENT`
- `OUT_CHARACTER_EVENT`
- `OUT_SWARM_EVENT`
- `OUT_ROBOTICS_EVENT`
- `OUT_CONTROL_EVENT`
- `OUT_FAILURE_EVENT`

Tum output'lar ortak minimum alani tasir:

```json
{
  "eventId": "string",
  "traceId": "string",
  "type": "string",
  "confidence": 0.0,
  "governanceState": "NORMAL | DEGRADED | FROZEN | RECOVERY",
  "worldDeltaRef": "string | null",
  "explanationRef": "string"
}
```

## 8) Fallback Matrix v1

Hata sinifina gore fallback:

- simulation_fail -> retry_simulation -> degrade_route -> human_intervention
- governance_reject -> modify_plan -> human_approval -> cancel
- world_conflict -> rollback -> replay_verify -> retry_execute
- agent_failure -> replace_agent -> partial_execute -> degrade_mode
- proof_mismatch -> freeze_route -> recovery -> audit_export

## 9) User Intent Library v1 (suggestion seeds)

Bu kutuphane SLE input orb'da "hizli baslangic" onerileri icin kullanilir.

### 9.1 Broadcast starter intents

- "Yarin canli mac yayini baslat"
- "Studio'da muzik performansi ac"
- "Hybrid yayin: MMO + Studio olustur"

### 9.2 Simulation starter intents

- "Istanbul Arena'da kalabalik simulasyonu baslat"
- "SpiralMMO'da gece etkinligi olustur"
- "Yeni world event zinciri calistir"

### 9.3 Character starter intents

- "OctoAI ile yeni NPC karakter uret"
- "Ghost rehber karakter olustur"
- "Etkilesimli host avatar ac"

### 9.4 Swarm starter intents

- "Swarm koordinasyonunu aktive et"
- "Savunma squad'i olustur"
- "Agentleri performans gorevine dagit"

### 9.5 Control and safety starter intents

- "Bu olayin neden secildigini acikla"
- "Guvenlik riskini dusuk moda al"
- "Son eylemi geri al ve recovery baslat"

## 10) Explainability Requirements

`Why?` cevabi Capability Graph baglamina dayanmalidir:

- hangi intent siniflandirildi
- hangi capability node secildi
- neden bu route secildi
- governance karari neydi
- fallback varsa neden tetiklendi

Kural:

- Teknik jargon minimum
- insan dili maksimum

## 11) Telemetry and Audit Hooks

Her route asagidaki olaylari emit etmelidir:

- `intent_classified`
- `capability_selected`
- `governance_decided`
- `simulation_completed` (varsa)
- `execution_committed`
- `proof_sealed`
- `feedback_returned`
- `fallback_triggered` (varsa)

## 12) Implementation Scope (v1 tamamlanma kriteri)

Bu capability layer "hazir" sayilmasi icin:

1. Tum primary node'lar registry'de bulunmali
2. Intent taxonomy enum'u kodda sabitlenmeli
3. Routing policy version'lanmali
4. Output contract tum event tiplerinde normalize olmali
5. Explainability, capability secim nedenini dondurmeli
6. Fallback matrix en az 4 hata sinifinda aktif olmali
7. Replay/proof izleri traceId/eventId ile baglanmali

## 13) Final Product Definition

Bu katman ile RHIZOH urun tanimi:

- Backend: infinite complexity orchestration
- Frontend: one intent + one world + one outcome
- Runtime: deterministic intent-to-capability-to-reality pipeline

---

Belge surumu: 1.0 - `RHIZOH_CAPABILITY_GRAPH_V1.md`
