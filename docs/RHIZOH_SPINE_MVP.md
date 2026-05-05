# Rhizoh spine — MVP (tek sayfa)

Bu belge **Castle Genesis** içindeki “canlı omurga”yı tanımlar: yeni repo veya sıfırdan gateway yazılmaz; mevcut modüllerin sırası ve deploy sözleşmesi.

## Akış (uçtan uca)

```
[Client]  RTQ / chat  →  POST /rhizoh/llm  (JSON)
    ↓
[Gateway] apps/gateway/src/server.js
    • CORS, JSON body
    • resolveHttpUser (JWT / dev header)
    • rate limit (rhizoh_llm:*)
    • llmKeySource: env | user_connection | auto
    • resolveConnection (user_connection)
    ↓
[Orchestrator] apps/gateway/src/rhizohGatewayTurn.js  →  rhizohGatewayTurn()
    1. memory_context   → getMemoryContext (memoryStore)
    2. full_context     → client continuity + memory birleşimi
    3. (opsiyonel log)  → CASTLE_RHIZOH_LLM_IDENTITY_LOG | CASTLE_RHIZOH_LLM_DIAG
    4. llm_query        → queryRhizohLlm (rhizohLlmGateway)
    5. audit            → logLlmAccess (castleLlmAudit)
    6. persist          → appendMemory ×2, addTranscript, autoCompact (auth ise)
    ↓
[Client]  JSON yanıt (reply, directive, …) + traceId
    • Cesium / Three / WebGPU / L9 bus → ayrı client katmanları (gateway HTTP cevabının dışında)
```

**Not:** `rhizohBrainV2` ve diğer “brain” yolları hâlâ başka HTTP/WS uçlarında kullanılabilir; `/rhizoh/llm` ana sohbet hattı orchestrator ile tek girişte toplanır.

## Trace

- Her başarılı tur: yanıtta **`traceId`** (UUID) ve **`turnLatencyMs`** (orchestrator turu toplam süre, ms).
- **`spinePhases`**: `{ name, ms }[]` — aşama bazlı gecikme profiler’ı.
  - **`CASTLE_RHIZOH_SPINE_TRACE=1`** → her istekte `spinePhases` (tam örnekleme).
  - **`CASTLE_RHIZOH_TRACE_SAMPLE=0.03`** → üretimde ~%3 istekte `spinePhases` (0–1 arası oran; örn. `0.01` = %1). Boş veya `0` = kapalı.
  - İkisi birden: `SPINE_TRACE=1` önceliklidir (tam trace).
- **MVP freeze:** `CASTLE_RHIZOH_SPINE_TRACE=0`, `CASTLE_RHIZOH_TRACE_SAMPLE=0`, `CASTLE_RHIZOH_WS_EMIT_PATCH=0` — `docs/PRODUCTION_LAUNCH_CHECKLIST.md` §1b.

## Ortam (özet)

| Ortam | Dosya / yer | Örnek anahtarlar |
|--------|----------------|------------------|
| Gateway (sunucu) | `apps/gateway/.env` veya Render Env | `OPENAI_API_KEY`, `CASTLE_GATEWAY_TOKEN`, `CASTLE_HTTP_CORS_ORIGIN`, `CASTLE_ALLOWED_ORIGINS`, `CASTLE_JWT_SECRET` (üretim), `CASTLE_LLM_PROVIDER`, `CASTLE_LLM_MODEL` |
| Client (Vite build) | `apps/client/.env.production` | `VITE_RHIZOH_LLM_HTTP`, `VITE_GATEWAY_HTTP`, `VITE_GATEWAY_WS`, `VITE_GATEWAY_TOKEN` (= `CASTLE_GATEWAY_TOKEN`) |

Tam liste: `ENV_KEYS.md`, gateway şablon: `apps/gateway/.env.production.example`.

## Health (gerçek uçlar)

| Method | Path | Amaç |
|--------|------|------|
| GET | `/health/live` | Süreç ayakta |
| GET | `/health/ready` | Bağımlılık hazırlığı + **Rhizoh yumuşak prob** |
| GET | `/health/deps` | LLM / Firestore vb. bayraklar |
| GET | `/health` | Kısa özet |

`/health/ready` yanıtına (LLM çağrısı **yok**, sadece env) şunlar eklenir:

- `gateway`: `"ok"` (handler ayakta)
- `llm`: `"ok"` \| `"degraded"` — seçili provider için API anahtarı yapılandırılmış mı (`rhizohLlmEnvConfigured`)
- `spine`: `"ok"` \| `"partial"` — şimdilik LLM ile aynı sinyal (tam “completion” kanıtı için `POST /rhizoh/llm` gerekir)

`/rhizoh/health` diye ayrı bir path **yok**; health yukarıdaki `/health/*` altında.

## POST /rhizoh/llm — telemetry alanları

| Alan | Anlam |
|------|--------|
| `traceId` | Tur korelasyonu |
| `turnLatencyMs` | Orchestrator tur süresi (KPI; provider/model ile dashboard’da kırılır) |
| `spinePhases` | Varsa aşama profiler’ı |
| `sampledTrace` | `true` → `spinePhases` örneklemeden geldi; `false` → `CASTLE_RHIZOH_SPINE_TRACE=1` tam trace; yok → `spinePhases` bu yanıtta yok |

## WebSocket

- Aynı HTTP süreci (`server.js`) içinde **WS** sunucusu; broadcast / envelope protokolü `@castle/protocol`.
- İstemci URL: `VITE_GATEWAY_WS` (üretimde `wss://`).
- Rhizoh spine tipleri (`WORLD_PATCH`, …) ve `createRhizohSpineEnvelope`: **`docs/RHIZOH_WS_SPINE_ENVELOPE.md`**

## Deploy sözleşmesi

- **Runtime:** Node (Rust / boş şablon değil).
- **Repo kökü:** monorepo; `package.json` + `apps/gateway`.
- **Build:** `npm install` (veya kökte `npm ci`).
- **Start:** `node apps/gateway/src/server.js`
- **PORT:** platform `PORT` (Render) veya `CASTLE_GATEWAY_PORT`.

Ayrıntı: `docs/RENDER_GATEWAY.md`, `render.yaml`.

## Sonraki (bilinçli genişleme)

- **Reality injection:** geo / ADS-B / weather → ayrı “kaynak kaydı” plugin API’si (henüz tek dosyada zorunlu değil).
- **Behavior graph:** entity / bindings / abilities → kernel şeması + event adları; gateway’de yalnızca LLM context alanlarına enjekte edilir.

Bu MVP omurgası: **HTTP doğrulama → `rhizohGatewayTurn` → istemci**. Kablolar burada kilitlenir; üst katmanlar plugin olarak kalır.
