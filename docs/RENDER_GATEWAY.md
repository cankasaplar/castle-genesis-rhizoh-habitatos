# Gateway — Render Web Service

Castle gateway (`apps/gateway`) bu monorepodaki **Node** HTTP/WS sunucusudur. Rhizoh istemcisi **`POST /rhizoh/llm`** ve health için **`GET /health/live`**, **`/health/ready`**, **`/health/deps`** kullanır.

**Voice Engine v3:** `POST /rhizoh/voice/transcribe/v3` — MediaRecorder ses → Google STT (fast) + Whisper (accurate). Gateway env: `OPENAI_API_KEY` zorunlu; `GOOGLE_SPEECH_API_KEY` veya `GOOGLE_API_KEY` fast path için opsiyonel.

## Önemli: yanlış repo örneği (ghost-whisperer)

`cankasaplar/ghost-whisperer` gibi **Castle dışı** bir GitHub reposuna bağlı Render servisi, bu uçları sunmaz veya zaman aşımına düşer. İstemci URL’leri **mutlaka bu monorepodan deploy edilen** gateway ile eşleşmelidir.

Hızlı doğrulama (deploy sonrası):

- `GET https://YOUR-SUBDOMAIN.onrender.com/health/live` → JSON içinde `ok: true` benzeri
- `GET .../health/ready` ve `GET .../health/deps` → anlamlı JSON (404 değil)

## 1) Blueprint ile kurulum (önerilen)

Repoda kökte **`render.yaml`** vardır. Render’da **New → Blueprint** ile bu repo’yu seçip uygula; ardından panelde **`OPENAI_API_KEY`** (ve isteğe bağlı **`CASTLE_GATEWAY_TOKEN`**) için değer gir.

Deploy bitince Render sana `https://castle-genesis-gateway.onrender.com` benzeri bir URL verir (`render.yaml` içindeki `name` ile uyumlu; ad çakışırsa Render farklı bir alt alan önerir). Bu tam host’u kopyala.

## 2) Manuel Web Service (monorepo kökü — doğru yol)

`@castle/command-dsl` vb. paketler **workspace** ile kök `package-lock.json` üzerinden bağlanır. Bu yüzden build **repo kökünden** çalışmalıdır.

| Alan | Değer |
|------|--------|
| **Repository** | Bu Castle monorepo (ghost-whisperer değil) |
| **Root Directory** | *(boş — repo kökü)* |
| **Build Command** | `npm install` (ilk deploy / workspace için güvenli); lockfile sabit ve tam CI ise `npm ci` |
| **Start Command** | `node apps/gateway/src/server.js` |
| **Health Check Path** | `/health/live` |

Render çalışma zamanında **`PORT`** set eder. Gateway: `Number(PORT) || Number(CASTLE_GATEWAY_PORT) || 8090`.

### `Root Directory: apps/gateway` ne zaman riskli?

Yalnızca `apps/gateway` altında `npm install` çalıştırmak, ortam ve npm sürümüne göre workspace paketlerini yanlış çözebilir. Sorun yaşarsan **kök dizinden** build/start kullan (yukarıdaki tablo) veya repodaki **`apps/gateway/Dockerfile`** ile Docker tabanlı Web Service aç.

## 3) Environment (Render Dashboard)

Örnek (anahtarları kendi değerlerinle doldur); tam liste: `apps/gateway/.env.production.example`.

```bash
CASTLE_MAX_MESSAGE_BYTES=32768
CASTLE_GATEWAY_TOKEN=<güçlü-rastgele-veya-dev-token>
CASTLE_ALLOWED_ORIGINS=https://rhizoh.com,https://www.rhizoh.com,https://castle-genesis.web.app,https://castle-genesis.firebaseapp.com,http://localhost:5173
CASTLE_HTTP_CORS_ORIGIN=https://rhizoh.com
CASTLE_REQUIRE_AUTH=false
CASTLE_ALLOW_DEV_ANON=true
CASTLE_ALLOW_DEV_HTTP_UID=true
OPENAI_API_KEY=sk-...
CASTLE_LLM_MODEL=gpt-4o-mini
# Voice v3 — Whisper: OPENAI_API_KEY; Google fast path (opsiyonel):
# GOOGLE_SPEECH_API_KEY=...
```

- **`CASTLE_GATEWAY_TOKEN`:** İstemci `VITE_GATEWAY_TOKEN` ile **aynı string** olmalı.
- **`OPENAI_API_KEY`:** LLM + Whisper ASR; istemciye koyma.
- **`GOOGLE_SPEECH_API_KEY`:** Voice v3 fast path (yoksa yalnız Whisper, UX biraz daha yavaş).

**Auth sıkılaştırma (canlı):** smoke / WAKE zinciri için `CASTLE_REQUIRE_AUTH=false` ve dev anon bayrakları açık kalabilir. Oturunca Render’da şuna çek: `CASTLE_REQUIRE_AUTH=true`, `CASTLE_ALLOW_DEV_ANON=false`, `CASTLE_ALLOW_DEV_HTTP_UID=false` (istemci JWT / Firebase akışı hazır olmalı).

## 4) Firebase Hosting (client)

`apps/client/.env.production` (veya CI secret) — **Render panelinde gösterilen gerçek URL** ile doldur:

```bash
VITE_RHIZOH_LLM_HTTP=https://YOUR-SUBDOMAIN.onrender.com/rhizoh/llm
VITE_GATEWAY_HTTP=https://YOUR-SUBDOMAIN.onrender.com/rhizoh/llm
VITE_GATEWAY_WS=wss://YOUR-SUBDOMAIN.onrender.com
VITE_GATEWAY_TOKEN=CASTLE_GATEWAY_TOKEN_ile_ayni_string
```

Sonra **`npm run build`** ve Hosting deploy. Yerel kontrol: `npm run verify:production`.

## 5) Firestore kuralları

Üretimde tüm veritabanına `allow read, write: if true` kullanmayın. Repodaki `firestore.rules` ve `ENV_KEYS.md` referans alın.

---

## Launch checklist

### A) Render deploy

- `GET .../health/live` → **200**, `ok: true` benzeri
- `GET .../health/ready`, `GET .../health/deps` → **200** / anlamlı JSON

### B) Client env

Gateway URL + token hizalı; ardından client build + Firebase Hosting deploy.

### C) Auth

İlk smoke için `CASTLE_REQUIRE_AUTH=false`; sıkılaştırma için sonra `true` ve JWT/Firebase akışı.

---

## 6) Voice Engine v3 — Render panel adımları

Mevcut servis: **`castle-genesis-rhizoh-habitatos`** (veya paneldeki tam ad).

### A) Kod deploy (önce)

Voice v3 route'u `apps/gateway/src/rhizohVoiceTranscribeV3.js` içinde. Render'ın bağlı olduğu **branch'e push** et (çoğu servis `main`). Deploy bitince logda `[GENESIS_BOOT]` görünür.

### B) Environment → Add / güncelle

| Key | Değer | Not |
|-----|--------|-----|
| `OPENAI_API_KEY` | `sk-...` | **Zorunlu** — LLM + Whisper |
| `GOOGLE_SPEECH_API_KEY` | Google Cloud API key | Opsiyonel — fast STT (~1–2s) |
| `CASTLE_GATEWAY_TOKEN` | örn. `castle_dev_token_2026` | Client `VITE_GATEWAY_TOKEN` ile **aynı** |
| `CASTLE_ALLOWED_ORIGINS` | `https://rhizoh.com,https://www.rhizoh.com,...` | CORS — rhizoh.com mutlaka |
| `CASTLE_HTTP_CORS_ORIGIN` | `https://rhizoh.com` | Birincil origin |
| `CASTLE_RL_RHIZOH_VOICE_TRANSCRIBE_PER_MIN` | `30` | Rate limit (opsiyonel) |

**Google STT anahtarı:** [Google Cloud Console](https://console.cloud.google.com/) → APIs → **Cloud Speech-to-Text API** etkin → Credentials → API key. Aynı key'i `GOOGLE_API_KEY` olarak da kullanabilirsin (Gemini key'i Speech API'ye yetki vermiyorsa ayrı key gerekir).

### C) Deploy tetikle

Environment kaydettikten sonra **Manual Deploy → Deploy latest commit** (veya otomatik deploy bekle). Free tier cold start 30–60 sn sürebilir.

### D) Doğrulama (PowerShell)

```powershell
$base = "https://castle-genesis-rhizoh-habitatos.onrender.com"
Invoke-RestMethod "$base/health/live"
Invoke-RestMethod "$base/health/deps"
```

Voice endpoint (boş ses → `422`, route yoksa `404`):

```powershell
$token = "castle_dev_token_2026"
$body = '{"path":"both","audioBase64":""}'
Invoke-RestMethod -Method POST -Uri "$base/rhizoh/voice/transcribe/v3" `
  -Headers @{ "Content-Type"="application/json"; "X-Castle-Gateway-Token"=$token } `
  -Body $body
```

Beklenen: `422` + `audio_base64_required` (route canlı). `404` → kod henüz deploy edilmemiş. `503 voice_asr_not_configured` → `OPENAI_API_KEY` eksik.

### E) Client (Firebase / t0-interface)

`apps/client/.env.production`:

```bash
VITE_RHIZOH_VOICE_ENGINE_V3=1
VITE_GATEWAY_HTTP=https://castle-genesis-rhizoh-habitatos.onrender.com/rhizoh/llm
VITE_GATEWAY_TOKEN=castle_dev_token_2026   # Render ile aynı
```

Yeniden build + `firebase deploy --only hosting`.
