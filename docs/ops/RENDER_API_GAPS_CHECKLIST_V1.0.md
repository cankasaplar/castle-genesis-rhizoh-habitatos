# Render API Gaps Checklist v1.0

**Tag:** `RESEARCH-ONLY` (ops prep — no data-plane activation)  
**Date:** 2026-06-24  
**Service:** `castle-genesis-rhizoh-habitatos` (veya `castle-genesis-gateway`) · Render Frankfurt  
**Parent:** [`RENDER_GATEWAY.md`](../RENDER_GATEWAY.md) · [`ENV_KEYS.md`](../../ENV_KEYS.md) · [`render.yaml`](../../render.yaml)

---

## Amaç

Yarın devam için **Render panelinde eksik kalan API anahtarları** ve **Firebase client env** hizalamasının tek sayfalık kontrol listesi. Kod değişikliği gerektirmez — yalnızca dashboard + redeploy.

---

## 1) Gateway — zorunlu (çalışmaz)

| Env key | Durum | Ne için | Doğrulama |
|---------|--------|---------|-----------|
| `OPENAI_API_KEY` | ☐ panelde set | LLM `/rhizoh/llm` + Whisper STT | `GET /health/deps` → openai ok |
| `CASTLE_GATEWAY_TOKEN` | ☐ panelde set | Transport gate | Client `VITE_GATEWAY_TOKEN` ile **aynı string** |
| `CASTLE_ALLOWED_ORIGINS` | ☐ rhizoh.com dahil | CORS / WS | Tarayıcıda gateway isteği CORS hatası yok |
| `CASTLE_HTTP_CORS_ORIGIN` | ☐ `https://rhizoh.com` | Birincil origin | Preflight 200 |

**Smoke:**
```bash
BASE=https://castle-genesis-rhizoh-habitatos.onrender.com
curl -s "$BASE/health/live" | head -c 200
curl -s "$BASE/health/deps" | head -c 400
```

---

## 2) Gateway — WorldSports / World News (P1)

| Env key | Durum | Ne için | Yoksa ne olur |
|---------|--------|---------|----------------|
| `FOOTBALL_DATA_ORG_TOKEN` | ☐ | Futbol yaklaşan + bazı canlı | WorldSports yalnızca NBA/API-Sports’a düşer |
| `API_SPORTS_KEY` | ☐ | NBA canlı skorlar | `liveMatchCount` düşük / boş |
| `NEWSDATA_API_KEY` | ☐ | World News headline feed | World News kanalı boş kalır |

**Smoke (client):**
```javascript
await __rhizoh.wireWorldSportsTube({ force: true })
__rhizoh.worldSportsObservationShort001({ locale: "tr" })
```

Beklenen: `readyToRecord: true`, `liveMatchCount >= 1`.

---

## 3) Gateway — Voice v3 (P2)

| Env key | Durum | Not |
|---------|--------|-----|
| `CASTLE_VOICE_TRANSCRIBE_PROVIDER` | ☐ | `gemini_live` veya varsayılan whisper |
| `GOOGLE_SPEECH_API_KEY` | ☐ opsiyonel | Fast STT (~1–2s); yoksa yalnız Whisper |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | ☐ | `gemini_live` için |
| `CASTLE_RL_RHIZOH_VOICE_TRANSCRIBE_PER_MIN` | ☐ | Örn. `30` |

**Smoke:**
```powershell
# Boş body → 422 audio_base64_required (route canlı demek)
Invoke-RestMethod -Method POST -Uri "$BASE/rhizoh/voice/transcribe/v3" `
  -Headers @{ "Content-Type"="application/json"; "X-Castle-Gateway-Token"="TOKEN" } `
  -Body '{"path":"both","audioBase64":""}'
```

---

## 4) Gateway — Auth / WAL (prod sıkı)

| Env key | Önerilen prod | Not |
|---------|---------------|-----|
| `CASTLE_REQUIRE_AUTH` | `true` | `render.yaml` default |
| `CASTLE_ALLOW_DEV_ANON` | `false` | Dev bypass kapalı |
| `CASTLE_ALLOW_DEV_HTTP_UID` | `false` | |
| `FIREBASE_PROJECT_ID` + service account | ☐ | `/health/deps` firestore |
| `CASTLE_JWT_SECRET` | ☐ >=24 char | Firebase yoksa fallback |

---

## 5) Firebase Hosting — client env (Render sonrası)

`apps/client/.env.production` (CI secret veya lokal build):

```bash
VITE_GATEWAY_HTTP=https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm
VITE_GATEWAY_WS=wss://castle-genesis-rhizoh-habitatos.onrender.com
VITE_GATEWAY_TOKEN=<CASTLE_GATEWAY_TOKEN ile aynı>
VITE_RHIZOH_VOICE_ENGINE_V3=1
```

**Opsiyonel — medya / öğrenme:**

| Key | Amaç |
|-----|------|
| `VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID` | Castle Genesis live embed |
| `VITE_CASTLE_GENESIS_YOUTUBE_CHESS_VIDEO_ID` | Satranç VOD kanalı |
| `VITE_RHIZOH_WORLDSPORTS_YOUTUBE_VIDEO_ID` | WorldSports VOD fallback |
| `VITE_RHIZOH_KATAGO_GTP_URL` | Go öğretmen motoru (sidecar) — yoksa demo |
| `VITE_RHIZOH_LC0_UCI_URL` | Chess Lc0 teacher (gelecek multi-AI) |

Deploy: `npm run build -w apps/client` → Firebase Hosting.

---

## 6) KataGo sidecar (gelecek — Render dışı)

Go gerçek öğretmen için ayrı servis gerekir (henüz repo’da yok):

1. KataGo WASM veya GTP sidecar container
2. Public `wss://` URL
3. Client: `VITE_RHIZOH_KATAGO_GTP_URL=wss://...`

Şimdilik: `kataGoStatus: not_configured` normal — demo öğrenme şeridi çalışır.

---

## 7) Yarın sabah sırası (önerilen)

1. Render panel → §1 zorunluları doğrula
2. §2 WorldSports anahtarları ekle → Manual Deploy
3. `wireWorldSportsTube` smoke
4. Client `.env.production` §5 → Hosting redeploy
5. Chess Short OBS kaydı (`/world/space?channel=chess&broadcast=1`)

---

## İlgili

- [`RHIZOH_PRODUCT_GAPS_V0.md`](../RHIZOH_PRODUCT_GAPS_V0.md)
- [`RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md`](../RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md)
- [`RHIZOH_GO_KATAGO_GTP_CONTRACT_V0.md`](../RHIZOH_GO_KATAGO_GTP_CONTRACT_V0.md)

*Observation only — Render checklist does not enable data-plane or thaw frozen core.*
