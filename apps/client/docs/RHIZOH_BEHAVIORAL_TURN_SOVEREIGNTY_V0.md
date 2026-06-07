# Rhizoh Behavioral Turn Sovereignty v0

**SPECFLOW:** `RESEARCH-ONLY` · **Status:** SPEC LOCK · **Engine:** log-only (`behavioralTurnSovereigntyV0.js`)

**Executable truth** yalnızca repo + CI + freeze politikasında tanımlıdır. Bu belge **temporal ontology / turn physics** sözleşmesidir; frozen core (`apps/client/src/ghost/phase*.js`) veya gateway execution graph'ını tek başına değiştirmez.

**Tek cümle:** Her kullanıcı turn'ünde sistem **tek bir gerçeklik** seçer; diğer tüm modüller o turn için **advisory (shadow)** olur.

---

## 0. Problem — ontolojik tekillik eksikliği

Rhizoh bugün şunları yapabiliyor:

| Yetenek | Modül | Durum |
|---------|-------|-------|
| Intent üretimi | `routeRhizohInput` / `classifyIntent` | ✔ |
| State çözümleme | `resolveRhizohConversationDepthV0`, `conversationPhase` | ✔ |
| Voice execution gate | `resolveConversationAuthorityV0` | ✔ (voice ingest only) |
| Memory commitment | `finalizeVoiceBehavioralCommitmentV0` | ✔ (eligibility, not output) |
| Perception stack | `arbitratePerceptionV1` | ✔ (prompt ordering only) |
| Prompt composition | `globalMeaningEngine` → `buildSystemPrompt` | ✔ |

Eksik olan:

> **"Diğer tüm sistemleri o turn için yok sayma"**

Bu yüzden aynı turn'de birden fazla **lokal olarak doğru** çıkış üretilebiliyor:

```
instant_ack  → "Tamam, dinliyorum."
MVIC         → "Buradayım — seni duyuyorum."
LLM          → "Evet, nasıl yardımcı olabilirim?"
TTS          → (ack + LLM echo)
```

Hepsi doğru — ama **aynı gerçekliği paylaşmıyorlar**. Kullanıcı deneyimi: kopukluk, "bazen farklı biri gibi konuşuyor."

Bu bir prompt problemi değil; **ontolojik tekillik** problemidir.

---

## 1. Kavram ayrımı

| Eski çerçeve | Yeni çerçeve |
|--------------|--------------|
| Authority Resolver — "kim konuşacak?" | **Turn Sovereignty** — "hangi gerçeklik var?" |
| Çatışma çözümü (sonradan merge) | **Zaman tekilliği** (çatışma oluşmadan önce kilitle) |
| Multi-prompt system | **Temporal decision OS** |
| Behavioral Governance (geniş) | **Temporal Ontology Engine** (turn physics) |

**Authority** hâlâ bir seçim problemi. **Sovereignty** tek gerçeklik problemi.

---

## 2. Üç yasa (çekirdek fizik)

### 2.1 Single Reality Rule

Her turn = **1** `sovereignReality`. Başka modül o turn'de "gerçek" olamaz.

### 2.2 Shadow Everything Else

Kilit sonrası tüm diğer modüller yalnızca **advisory**: log, trace, replay, founder review. Execution veya user-visible output üretemezler.

### 2.3 Output Channel Singularity

Her turn = **1** `outputChannel` + **1** user-visible speech/text path. İkinci ses = sovereignty violation (`SHADOW_LEAK`).

### 2.4 Sub-Reality Variation (anti-robotic determinism)

`sovereignReality` tek kalır; **ikinci bir gerçeklik açılmaz**. Ancak aynı reality içinde kontrollü varyasyon izinlidir:

```typescript
subReality: {
  emotionalTone: string;       // warm | steady | alert | contemplative
  microVariation: string;      // presence_pool | depth_greet | reflex_pool | none
  phraseVariant: string | null; // pool rotation — same sovereign channel
  allowsPoolRotation: boolean;
}
```

**Kural:** `subReality` yalnızca phrase seçimi ve ton bias'ı değiştirir; `sovereignReality`, `outputChannel` veya LLM scope'unu **değiştiremez**.

### 2.5 No-Lock Escape Rule (authority starvation guard)

STEP 6 `silent_observe` sonrası, substantive input varsa:

```text
if sovereignReality === silent_observe
   AND isNoLockEscapeEligible(text, router, voice, modality)
   → force sovereignReality = llm_conversation (safe mode)
   → selectionReason = no_lock_escape_safe_llm
   → maxTokensCeiling capped (≤640 default)
```

**Escape yok:** `SILENCE` intent, `silenceMode`, `gatewayMaintenance`, `ambient` band, boş/kısa junk.

Bu kural **authority starvation** (sessizlik patlaması) riskini kapatır — sistem substantive turn'de boşta kalmaz.

### 2.6 Enforcement modes = governance rehearsal

| Mode | Rol |
|------|-----|
| `log_only` | Shadow trace only |
| `soft` | **Probabilistic governance rehearsal** — violation simülasyonu, execution serbest |
| `partial` | presence_ack izolasyonu + boundary block |
| `full` | Irreversible turn enforcement |

---

## 3. Pipeline yerleşimi

```text
INPUT (text | voice | UI)
  ↓
INTENT ROUTER          routeRhizohInput, voice witness band
  ↓
STATE RESOLVER         depth, phase, arbitration candidates, commitment
  ↓
┌─────────────────────────────────────────────────────────┐
│  TURN SOVEREIGNTY LAYER  ← EKSİK (bu spec)             │
│  lock → select reality → suppress → bind scope → emit  │
└─────────────────────────────────────────────────────────┘
  ↓                              ↓
PROMPT COMPOSER (bound)    UX EXECUTOR (single channel)
  ↓                              ↓
LLM (if sovereign)         TTS / text / none
```

**Cube/Fox** bu pipeline'da **State Resolver ile Sovereignty arasına** girer — yalnızca `attentionInfluenceVector` (bias). Karar uzayına girmez.

```text
Cube/Fox → attention weights → influence scoring ONLY
         → may NOT: authority, prompt text, output channel
```

İlgili invariant: [`docs/RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md`](../../docs/RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md) — `topologyWrite: false`.

---

## 4. Schema — `TURN_SOVEREIGNTY_V0`

```typescript
/** castle.rhizoh.turn_sovereignty.v0 */
type TurnSovereigntyV0 = {
  schema: "castle.rhizoh.turn_sovereignty.v0";
  turnId: string;              // === traceId, 1:1
  lockedAtMs: number;          // monotonic; post-lock immutable

  /** Ontolojik olarak TEK gerçek mod */
  sovereignReality:
    | "presence_ack"      // instant_ack / MVIC / companion flow ack
    | "fast_reflex"       // local phrase, LLM bypass
    | "command_execute"   // kernel command, silent or minimal UX
    | "llm_conversation"  // full LLM + bound prompt scope
    | "silent_observe";   // no user-visible output; shadow only

  /** Tek çıkış kanalı */
  outputChannel: "tts" | "text" | "none";

  /** Sovereign modülün ürettiği tek user-visible içerik (varsa) */
  sovereignOutput?: {
    text: string;
    locale: string;
    source: string;           // e.g. instant_ack | fast_reflex | llm
  };

  /** Kilit öncesi toplanan adaylar — gerçek DEĞİL, trace only */
  advisory: {
    router?: RouterAdvisory;
    depth?: DepthAdvisory;
    arbitration?: ArbitrationAdvisory;
    voice?: VoiceAdvisory;
    cubeFox?: CubeFoxInfluenceV0;
    commitment?: CommitmentAdvisory;
  };

  /** Bu turn'de etkisiz kılınan modüller */
  suppressed: string[];

  /** sovereignReality === llm_conversation ise sıkı bağ */
  promptScope?: {
    allowedDirectives: string[];
    maxTokensCeiling: number;
    forbiddenModules: string[];
    arbitrationMode: "primary_bound" | "suppressed";
    depthModeBound: boolean;
  };

  /** İhlal tespiti */
  violations: SovereigntyViolationV0[];
};
```

### 4.1 Input envelope — `TurnSovereigntyInputV0`

Sovereignty layer'a **tek giriş**; modüller bundan önce advisory candidate üretir, sonra kilitlenir.

```typescript
type TurnSovereigntyInputV0 = {
  turnId: string;
  atMs: number;

  /** Ham giriş */
  input: {
    text: string;
    modality: "text" | "voice" | "ui";
    source?: string;          // mic_v3 | text | barge_in | ...
    locale: string;
  };

  /** Önceden çözümlenmiş adaylar (pre-lock) */
  candidates: {
    router: ReturnType<routeRhizohInput>;
    depth: ReturnType<resolveRhizohConversationDepthV0>;
    arbitration?: ReturnType<arbitratePerceptionV1>;
    voice?: {
      authority: ReturnType<resolveConversationAuthorityV0>;
      commitment?: ReturnType<finalizeVoiceBehavioralCommitmentV0>;
      band?: string;          // ambient | unknown | directed_candidate
      dispatchRoute?: object;
      directedPatterns?: string[];  // wake | presence_check | ...
    };
    command?: {
      matched: boolean;
      decision?: string;      // SILENT_EXECUTE | LLM_FALLBACK | ...
      canonical?: string;
    };
    fastReflex?: {
      eligible: boolean;
      reply?: string;
    };
    instantAck?: {
      eligible: boolean;
      phrase?: string;
    };
    cubeFox?: CubeFoxInfluenceV0;
  };

  runtime: {
    conversationPhase: string;
    userTurnCount: number;
    strictVoiceIngest: boolean;
    gatewayMaintenance: boolean;
  };
};
```

### 4.2 Cube/Fox influence (non-authoritative)

```typescript
/** castle.rhizoh.cube_fox_influence.v0 — bias only */
type CubeFoxInfluenceV0 = {
  observerSpecies: "octo_v1" | "fox_v1" | null;
  attentionWeights: {
    branching: number;   // 0..1
    spike: number;
    spiral: number;
    stretch: number;
    scanSpeed: number;   // normalized
  };
  /** Scoring bias for sovereignty selection — NOT selection itself */
  realityBias: {
    presence_ack: number;
    fast_reflex: number;
    llm_conversation: number;
    silent_observe: number;
  };
  authoritative: false;  // MUST always be false
};
```

Kaynak: [`observerSpeciesRegistryV0.js`](../src/studio/observerSpeciesRegistryV0.js).

---

## 5. Lock mechanism

### 5.1 Turn lock lifecycle

```text
PHASE_COLLECT   → candidates gathered (advisory only, no output)
PHASE_LOCK      → resolveTurnSovereigntyV0() → immutable TurnSovereigntyV0
PHASE_EXECUTE   → single output path per sovereignReality
PHASE_RELEASE   → turn complete; advisory archived to trace
```

### 5.2 Lock rules

| Kural | Açıklama |
|-------|----------|
| `L1` | `lockedAtMs` sonrası `sovereignReality` değiştirilemez |
| `L2` | `instant_ack`, `queryRhizohLLM`, `speakRhizohReplyChunkedV0` yalnızca `PHASE_EXECUTE` ve sovereignty izniyle çağrılır |
| `L3` | İkinci user-visible output = `SHADOW_LEAK` violation |
| `L4` | Advisory modüller `PHASE_EXECUTE`'da **read-only**; prompt veya TTS'e yazamaz |
| `L5` | `turnId` başına en fazla 1 aktif lock; yeni input → önceki lock release veya abort |

### 5.3 Mevcut modüllerle entegrasyon noktaları

| Mevcut çağrı | Sovereignty sonrası |
|--------------|---------------------|
| `markVoiceTurnDispatchV0` / `playVoiceInstantAckV0` | Yalnız `sovereignReality === presence_ack` ve ack sovereign output ise |
| `queryRhizohLLM` | Yalnız `sovereignReality === llm_conversation` |
| `resolveConversationAuthorityV0` | Input candidate; final speak = sovereignty `outputChannel` |
| `buildSystemPrompt` | `promptScope` ile sınırlı compose |
| `publishVoiceBehavioralCommitmentV0` | Advisory; memory eligibility sovereignty'den bağımsız kalabilir (ayrı eksen) |

**Not:** Memory commitment (`turnCounts`, `sessionBumps`) bilinçli olarak **sovereignty dışı** kalabilir — observation/memory ekseni ile output/reality ekseni ayrılır ([`voiceBehavioralCommitmentV0.js`](../src/rhizoh/runtime/voiceBehavioralCommitmentV0.js)).

---

## 6. Sovereignty selection algorithm

Deterministik öncelik sırası — **tie-break yok**, ilk eşleşen kazanır.

```text
STEP 0 — Hard blocks
  IF gatewayMaintenance OR router.intent === SILENCE (silenceMode)
    → sovereignReality = silent_observe
    → STOP

STEP 1 — Command sovereignty
  IF command.matched AND command.decision IN (SILENT_EXECUTE, HYBRID with silent)
    → sovereignReality = command_execute
    → outputChannel = none | minimal TTS per command policy
    → suppress: instant_ack, llm, depth verbose, arbitration primary
    → STOP

STEP 2 — Presence / wake (directed speech)
  IF voice.band === directed_candidate
     AND directedPatterns intersects { presence_check, wake, address }
     AND NOT mixed_substantive_query (see STEP 6)
    → sovereignReality = presence_ack
    → outputChannel = tts
    → sovereignOutput = single phrase (MVIC or instant_ack pool — ONE source)
    → suppress: llm_conversation COMPLETELY
    → suppress: instant_ack if MVIC already sovereign (no double ack)
    → STOP

STEP 3 — Fast reflex
  IF fastReflex.eligible AND voice.authority.path === FAST_REFLEX
    → sovereignReality = fast_reflex
    → suppress: llm, instant_ack (unless fast reflex IS the ack)
    → STOP

STEP 4 — Crisis override
  IF router.intent === CRISIS AND router.confidence >= 0.55
    → sovereignReality = llm_conversation
    → promptScope: depth forced DEBATE or CRISIS repair; arbitration may primary_bound
    → suppress: presence_ack, fast_reflex
    → apply cubeFox bias to promptScope weights only
    → STOP

STEP 5 — LLM conversation (default execution path)
  IF voice.authority.maySpeak AND commitment.behaviorEligible !== false
     OR modality === text
    → sovereignReality = llm_conversation
    → promptScope bound from depth + router (arbitration secondary unless conflict low)
    → instant_ack: SUBORDINATE only — pre-llm filler, MUST NOT contradict sovereign scope
    → IF strictVoiceIngest: instant_ack suppressed entirely when LLM sovereign
    → STOP

STEP 6 — Shadow / observe
  → sovereignReality = silent_observe
  → shadow path: MVIC light/delayed per voice observational map
  → STOP
```

### 6.1 Mixed intent guard (STEP 2 vs 5)

```text
mixed_substantive_query =
  presence_check_pattern AND message_length > 48 AND contains_task_verb
```

Örnek: *"Rhizoh beni duyuyor musun, haritayı İstanbul'a götür"* → **llm_conversation** (presence ack tek başına yetersiz).

### 6.2 Cube/Fox weighting (non-authoritative)

Cube/Fox `realityBias` yalnızca **STEP 4–5 tie region** içinde skor ayarlar:

```text
effectiveScore(reality) = basePriority(reality) + cubeFox.realityBias[reality]
```

`basePriority` STEP sırasından gelir — Cube/Fox STEP sırasını **asla** değiştirmez.

---

## 7. Prompt scope binding (`llm_conversation`)

| `sovereignReality` | `buildSystemPrompt` davranışı |
|--------------------|-------------------------------|
| `llm_conversation` | `depth.directive` + `router` tone + `storySnap` (bound) |
| `presence_ack` | **LLM çağrılmaz** |
| `fast_reflex` | **LLM çağrılmaz** |
| `command_execute` | LLM yalnız `LLM_FALLBACK` command decision ise |
| `silent_observe` | **LLM çağrılmaz** |

`forbiddenModules` örnekleri (presence_ack sonrası leak önleme):

```json
["depth_discourse_directive", "arbitration_primary_frame", "instant_ack_parallel"]
```

---

## 8. Observability & debug

### 8.1 Log events

| Event | Anlam |
|-------|-------|
| `TURN_SOVEREIGNTY_LOCK` | Turn kilitlendi |
| `TURN_SOVEREIGNTY_REALITY` | Seçilen `sovereignReality` |
| `TURN_SOVEREIGNTY_SUPPRESSED` | Shadow modül listesi |
| `TURN_SOVEREIGNTY_VIOLATION` | `SHADOW_LEAK` veya post-lock mutation attempt |

### 8.2 Console surface (hedef)

```js
window.__rhizoh.turnSovereignty          // son lock
window.__rhizoh.getTurnSovereigntyV0()   // trace export
```

Mevcut debug ile ilişki:

- `window.__CASTLE_RHIZOH_CONVERSATION_AUTHORITY__` → advisory candidate
- `window.__rhizoh.voiceWitnessCommitment` → memory axis
- `window.__rhizoh.voiceInstantAck` → yalnız sovereignty izinliyse

### 8.3 Violation taxonomy

| Code | Anlam |
|------|-------|
| `SHADOW_LEAK` | İkinci user-visible output aynı turn'de |
| `POST_LOCK_MUTATION` | `lockedAtMs` sonrası reality değişimi |
| `LLM_BYPASS_LEAK` | Sovereignty LLM yasakken `queryRhizohLLM` |
| `ACK_LLM_ECHO` | presence_ack + LLM reply aynı turn |
| `ARBITRATION_OVERRIDE` | Suppressed arbitration prompt'a girdi |

Mevcut leak detector: [`rhizohCommandExecutionTraceV0.js`](../src/rhizoh/runtime/rhizohCommandExecutionTraceV0.js) (`RHIZOH_CMD_EXEC`) — sovereignty ile genişletilir.

---

## 9. Sekiz kritik senaryo trace

### 9.1 Presence check — `"beni duyuyor musun?"`

| Alan | Değer |
|------|-------|
| Input | voice, `directed_candidate`, pattern `presence_check` |
| Router | CHAT, confidence ~0.6 |
| Depth | GREET candidate |
| **Sovereignty** | `presence_ack` |
| Suppressed | `llm_conversation`, `depth_directive`, `arbitration_primary`, parallel `instant_ack` |
| Output | TTS: *"Buradayım."* (tek phrase, MVIC `unknown_band_hold` veya dedicated presence pool) |
| Violations | Önleme: `ACK_LLM_ECHO` |

**Bugün:** instant_ack + LLM + MVIC paralel → **kopukluk**. **Hedef:** tek gerçeklik.

---

### 9.2 Wake — `"rhizoh"` / `"hey rhizoh"`

| Alan | Değer |
|------|-------|
| Input | voice, `DIRECTED_WAKE_PATTERNS_V0` match |
| Router | CHAT veya SILENCE (kısa) |
| **Sovereignty** | `presence_ack` (kısa co-presence, companion flow ack grammar) |
| Output | *"Evet."* / *"Buradayım."* — LLM yok |
| Cube/Fox | `realityBias.presence_ack += 0.1` (fox: scanSpeed high → slightly faster ack preference) |

Kaynak pattern: [`voiceDirectedSpeechObservationV0.js`](../src/rhizoh/runtime/voiceDirectedSpeechObservationV0.js).

---

### 9.3 Silence — `"sessiz"` / `"dinle"` / empty

| Alan | Değer |
|------|-------|
| Input | text veya voice |
| Router | SILENCE, `silenceMode: true` |
| Depth | suppressed |
| **Sovereignty** | `silent_observe` |
| Output | `none` |
| Advisory | arbitration neutral frame logged |

Kaynak: [`detectSilenceMode`](../src/rhizoh/router/intentSignals.js).

---

### 9.4 Command — `"haritayı aç"` / kernel command

| Alan | Değer |
|------|-------|
| Input | voice/text |
| Command | matched, `SILENT_EXECUTE` |
| **Sovereignty** | `command_execute` |
| Suppressed | instant_ack, llm (unless `LLM_FALLBACK`) |
| Output | `none` or minimal confirm per command policy |
| Trace | `RHIZOH_CMD_EXEC` leakFlags empty |

---

### 9.5 Crisis — `"çöküyor"` / `CRISIS.BUG`

| Alan | Değer |
|------|-------|
| Router | CRISIS, subIntent BUG, confidence high |
| Depth | DEBATE/repair candidate |
| **Sovereignty** | `llm_conversation` |
| Suppressed | presence_ack, fast_reflex |
| promptScope | calm repair tone, `maxTokens` elevated, arbitration `primary_bound` if conflict low |
| instant_ack | **suppressed** (strict) or subordinate 3-word max |

---

### 9.6 Mixed intent — `"rhizoh beni duyuyor musun, haritayı aç"`

| Alan | Değer |
|------|-------|
| Guard | `mixed_substantive_query = true` |
| **Sovereignty** | `llm_conversation` (presence ack tek başına yetersiz) |
| promptScope | task + brief presence acknowledgment in **single** LLM reply |
| Suppressed | parallel instant_ack |

---

### 9.7 Shadow leak prevention — interaction reject path

| Alan | Değer |
|------|-------|
| Voice router | `observationForward`, execution rejected |
| Commitment | `behaviorEligible: false` |
| **Sovereignty** | `silent_observe` |
| Shadow UX | MVIC `light` veya `delayed` — **tek** shadow ack |
| Rule | Shadow ack + LLM aynı turn'de **yasak** (`SHADOW_LEAK`) |

Kaynak: [`RHIZOH_VOICE_OBSERVATIONAL_COGNITION_MAP_V0.md`](./RHIZOH_VOICE_OBSERVATIONAL_COGNITION_MAP_V0.md).

---

### 9.8 LLM bypass mode — fast reflex / continuation hold

| Alan | Değer |
|------|-------|
| Pipeline | `runRhizohSpeechPipelineV0` → FAST_LOCAL |
| **Sovereignty** | `fast_reflex` |
| Output | local phrase, `llmBypass: true` |
| Suppressed | `queryRhizohLLM`, `instant_ack` (reflex phrase IS the output) |

Kaynak: [`rhizohSpeechPipelineV0.js`](../src/rhizoh/runtime/rhizohSpeechPipelineV0.js).

---

## 10. Implementation status

| Artifact | Path | Durum |
|----------|------|-------|
| Turn execution kernel (log-only) | `apps/client/src/rhizoh/runtime/behavioralTurnSovereigntyV0.js` | ✔ |
| Unit tests (8 scenario + trace/heatmap) | `apps/client/src/rhizoh/runtime/__tests__/behavioralTurnSovereigntyV0.test.js` | ✔ |
| Wire-in (dispatch / LLM / ack) | `rhizohQueryLlmV1.js`, `rhizohVoiceLlmDispatchV0.js`, `voiceInstantAckV0.js` | ⏳ |

### 10.1 Log-only API (bugün)

```js
import { lockTurnSovereigntyV0, explainTurnSovereigntyV0, exportTurnSovereigntyAnalysisV0 } from "./behavioralTurnSovereigntyV0.js";

const lock = lockTurnSovereigntyV0(inputEnvelope);
explainTurnSovereigntyV0(lock.turnId);           // replay: neden bu reality?
exportTurnSovereigntyAnalysisV0();              // trace ring + conflict heatmap
window.__rhizoh.turnSovereignty;                // son lock
```

**Enforcement modes** (`VITE_RHIZOH_TURN_SOVEREIGNTY_MODE`):

| Mode | Davranış |
|------|----------|
| `log_only` (default) | Lock + trace; hiçbir şeyi bloklamaz |
| `soft` | `TURN_SOVEREIGNTY_VIOLATION` log; execution devam |
| `partial` | `presence_ack` LLM/ack izolasyonu + boundary block |
| `full` | Tüm `permitTurnOutputV0` gate'leri aktif |

**Prompt Boundary Firewall** (`turnSovereigntyPromptFirewallV0.js`):

Locked turn'de yazma yüzeyleri: `system_prompt` | `llm_input` | `voice_output_queue` | `instant_ack`

Diagnostics: `exportTurnSovereigntyWireDiagnosticsV0()` — conflict + silent override heatmap.

**Wire-in (bugün):**

- `ensureTurnSovereigntyLockedV0` → `rhizohQueryLlmV1`, `rhizohVoiceLlmDispatchV0`
- `gateLlmInputForTurnV0` / `gateInstantAckForTurnV0` / `gateVoiceOutputForTurnV0`
- `applyTurnSovereigntyPromptScopeToContextV0` → LLM context pre-trim

**Kalan:**

- Gateway `buildSystemPrompt` server-side scope binding (client `turnSovereignty` meta gönderiyor)

---

## 13. Turn Behavior Consistency Field v0

**Modül:** `turnBehaviorConsistencyFieldV0.js` · **SPECFLOW:** `RESEARCH-ONLY`

Uzun vadeli davranış drift gözlemi — trace ring üzerinden:

| Metrik | Soru |
|--------|------|
| `rates.silentObserve` | Rhizoh bugün neden daha sessiz? |
| `rates.presenceAck` | Presence frequency stability |
| `rates.noLockEscape` | Authority starvation pressure |
| `driftSignals` | Otomatik uyarılar (`elevated_silent_observe`, `low_llm_conversation_share`, …) |

```js
window.__rhizoh.turnBehaviorConsistency
buildTurnBehaviorConsistencyFieldV0()
exportTurnSovereigntyWireDiagnosticsV0().behaviorConsistency
```

**Kritik sınır:** Consistency field **yalnızca gözlem** üretir. `driftSignals` uyarıları founder/ops için; authority seçimine **asla** girdi olmaz.

---

## 14. Observation ↔ Execution invariant (over-observation drift firewall)

**Risk:** Sistem kendini fazla analiz etmeye başlarsa davranış üretmek yerine davranışı yorumlamaya kayabilir (`consistency field weight > execution field weight`).

**Prensip (spec kilidi):**

> **Observation must never influence authority selection.**

| Alan | Weight | Authority'ye girebilir mi? |
|------|--------|----------------------------|
| Execution field (router, depth, voice gate, STEP order) | 1 | ✔ |
| Observation field (consistency, drift, heatmap, violations) | 0 | ✘ |

**Modül:** `turnSovereigntyObservationExecutionInvariantV0.js`

- `sanitizeTurnSovereigntyInputV0` — `consistencyField`, `driftSignals`, `influenceFeedback`, … strip
- `assertObservationDoesNotInfluenceAuthorityV0` — `resolveTurnSovereigntyV0` girişinde zorunlu
- `SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0` — `observationInfluencesAuthority: false`

**Hizalama:** `RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0` (`rhizohInfluenceObservabilityFirewallV0.js`) — `observabilityMutatesExecution: false` default; `VITE_RHIZOH_INFLUENCE_FEEDBACK=1` dışında cognition path feedback yok.

**Ürün tanımı (v0):** Rhizoh bir AI assistant veya prompt orchestration değil; **behavioral OS with self-observation layer**. Soru "Rhizoh nasıl cevap verir?" değil — **"Rhizoh nasıl bir davranış eğrisi üretir?"**

---

## 15. Behavioral Drift Engine v0 (long-term calibration loop)

**Modül:** `turnBehavioralDriftEngineV0.js` · **SPECFLOW:** `RESEARCH-ONLY`

Consistency field'ın üstüne uzun vadeli kalibrasyon gözlemi — **authority seçimine girmeyen** read-only rapor:

| Metrik | Anlam |
|--------|-------|
| `presenceStabilityIndex` | Presence_ack oranının pencere içi kararlılığı |
| `authorityVolatilityScore` | Ardışık turn'lerde reality flip oranı |
| `identityCoherenceMetric` | Reality dağılım entropisinin tersi (tek eğri hissi) |
| `cubeFoxInfluenceDecay` | Fox/octo advisory payının snapshot'lar arası kayması |
| `sevenDayPattern` | Çok oturumlu pencere (persist açıkken) |

```js
window.__rhizoh.behavioralDrift
window.__rhizoh.exportBehavioralDriftReportV0()
buildTurnBehavioralDriftReportV0().selfExplanation  // "ben neden böyle davranıyorum?"
```

**Persist (opsiyonel):** `VITE_RHIZOH_BEHAVIORAL_DRIFT_PERSIST=1` → `localStorage` snapshot ring (max 96). Kapalıyken yalnızca session penceresi.

**Invariant:** `influencesAuthority: false` — drift raporu yalnızca founder review / calibration; turn physics'i değiştirmez.

---

## 16. Indirect semantic leakage firewall

**Risk:** Observation doğrudan authority'ye girmese bile prompt composition'a sızarsa LLM bias'ı değişir.

| Sızıntı yolu | Örnek |
|--------------|-------|
| `selfExplanation` string concat | Drift metninin `rhizohMemoryContract` içine eklenmesi |
| Debug injection | `behaviorConsistency` / `driftSignals` context key |
| Consistency hint | `"elevated_silent_observe"` marker'lı system prompt eki |

**Prensip:** Execution surface'ler (LLM context, system prompt, TTS text) observation semantiği taşıyamaz.

**Modül:** `turnSovereigntyIndirectSemanticLeakageV0.js`

- `FORBIDDEN_EXECUTION_CONTEXT_KEYS_V0` — context'ten strip
- `OBSERVATION_SEMANTIC_MARKERS_V0` — string marker taraması
- `guardExecutionSurfaceAgainstObservationLeakageV0` — `applyTurnSovereigntyPromptScopeToContextV0` çıkışında zorunlu sanitize + `TURN_SOVEREIGNTY_SEMANTIC_LEAK` log

`selfExplanation` ve `founderOnly` alanları **yalnızca** `window.__rhizoh.behavioralDrift` / calibration governor — asla cognition path.

**Sistem tanımı (v0):** Rhizoh öğrenen sistem değil; **kendi davranışını ölçen ve sınırlayan kapalı bir OS**. Mimari eşik: ❌ daha iyi cevap üretme → ✔ cevap üretimini deterministik hale getirme (**behavioral runtime physics design**).

---

## 17. Calibration Governor v0

**Modül:** `rhizohCalibrationGovernorV0.js` · **SPECFLOW:** `RESEARCH-ONLY`

Drift → suggestion → **manual founder commit** → execution **asla otomatik değil**.

```
drift report → proposals (pending)
founder commitCalibrationProposalV0(id) → audit trail only
rejectCalibrationProposalV0(id) → dismissed
```

```js
window.__rhizoh.calibrationGovernor
window.__rhizoh.commitCalibrationProposalV0("cal_elevated_silent_observe_...")
window.__rhizoh.rejectCalibrationProposalV0("cal_...")
```

Her proposal: `influencesAuthority: false`, `influencesExecution: false`, `autoApply: false`.

Founder sorusu: *"Benim davranışım bu yönde kayıyor — bunu onaylıyor musun?"*

Commit yalnızca localStorage audit kaydı; turn sovereignty / LLM path'e geri besleme yok.

---

## 11. İlişkili belgeler

| Belge | İlişki |
|-------|--------|
| [`RHIZOH_VOICE_OBSERVATIONAL_COGNITION_MAP_V0.md`](./RHIZOH_VOICE_OBSERVATIONAL_COGNITION_MAP_V0.md) | Voice path taxonomy → sovereignty input |
| [`RHIZOH_GLOBAL_MEANING_ENGINE_V0.md`](./RHIZOH_GLOBAL_MEANING_ENGINE_V0.md) | Pre-LLM expression → advisory only post-lock |
| [`RHIZOH_GOVERNANCE_MIDDLEWARE_V1.md`](../../docs/RHIZOH_GOVERNANCE_MIDDLEWARE_V1.md) | Continuity authority matrisi (adjacent, broader) |
| [`OBSERVATION_FABRIC_V1.md`](../../docs/OBSERVATION_FABRIC_V1.md) | Agents influence interpretation, never execution |
| [`RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md`](../../docs/RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md) | Cube/Fox bias, not author |
| [`docs/RHIZOH_CUBE_FIELD_V0.md`](../../docs/RHIZOH_CUBE_FIELD_V0.md) | Geometry projection ≠ prompt |

---

## 12. Founder smoke checklist (post-implementation)

1. `"beni duyuyor musun?"` → konsolda `TURN_SOVEREIGNTY_REALITY: presence_ack`, LLM çağrısı yok
2. `"rhizoh"` wake → tek kısa TTS, `ACK_LLM_ECHO` violation yok
3. `"sessiz"` → `silent_observe`, output none
4. Command match → `command_execute`, `RHIZOH_CMD_EXEC` leak yok
5. `"çöküyor"` → `llm_conversation`, presence_ack suppressed
6. Mixed intent → tek LLM cevabı (task + presence), parallel ack yok
7. Shadow reject → tek shadow ack veya none; LLM yok
8. `copy(window.__rhizoh.getTurnSovereigntyV0())` — full trace export

---

*Son güncelleme: Turn Sovereignty v0 spec — temporal ontology engine; implementation RESEARCH-ONLY until wired.*
