# Üretim yayını — kontrol listesi

Gerçek anahtarları **asla** git’e commit etmeyin; Firebase Console, OpenAI, Cesium Ion vb. panellerden alın.

## 1. İstemci (Firebase Hosting build)

1. `apps/client/.env.production.example` dosyasını `apps/client/.env.production` olarak kopyalayın.
2. **Zorunlu (bir eşdeğer yeterli):**
   - Firebase: `VITE_FIREBASE_CONFIG` (tek satır JSON) **veya** `VITE_FIREBASE_API_KEY` + `VITE_FIREBASE_PROJECT_ID` (+ diğer `VITE_FIREBASE_*` alanları).
   - WebSocket: `VITE_GATEWAY_WS` veya `VITE_GATEWAY_WS_URL` — `wss://...`
   - Rhizoh HTTP: `VITE_GATEWAY_HTTP` veya `VITE_RHIZOH_LLM_HTTP` — `https://.../rhizoh/llm`
3. **Önerilir:**
   - `VITE_GATEWAY_TOKEN` — Gateway `CASTLE_GATEWAY_TOKEN` ile **aynı** gizli dize.
   - `VITE_CESIUM_ION_TOKEN` — Tam güç 3D küre / terrain.
   - `VITE_CASTLE_APP_ID` — Gateway `CASTLE_ARTIFACT_APP_ID` ile **aynı** (varsayılan `castle-vnext-core`).
4. Yerel doğrulama: `npm run verify:production -- --target=client`

## 2. Gateway (HTTPS API + WebSocket)

1. `apps/gateway/.env.production.example` → `apps/gateway/.env` (sunucuda veya gizli mağazada aynı anahtarlar).
2. **Zorunlu (tam güç):**
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — servis hesabı JSON ile uyumlu.
   - Seçilen LLM için anahtar (örn. `OPENAI_API_KEY`).
3. **Önerilir:**
   - `CASTLE_GATEWAY_TOKEN` — istemci ile paylaşımlı.
   - `CASTLE_HTTP_CORS_ORIGIN=https://castle-genesis.web.app`
   - `CASTLE_ALLOWED_ORIGINS` — Hosting + gerekiyorsa preview URL’leri.
   - `CASTLE_REQUIRE_AUTH=true`, geliştirici bypass’ları kapalı (`CASTLE_ALLOW_DEV_*=false`).
4. Doğrulama: `npm run verify:production -- --target=gateway --strict`

### 2b. Gateway kod güncellemesi (Rhizoh LLM / identity) — zorunlu redeploy

Hosting deploy **gateway Node sürecini yenilemez**. `rhizohLlmGateway.js` veya `server.js` değiştiyse üretim gateway’i mutlaka yeniden başlatın.

**Seçenek A — Docker (önerilen):** repo kökünden

```bash
docker build -f apps/gateway/Dockerfile -t castle-gateway .
docker stop castle-gateway 2>/dev/null; docker rm castle-gateway 2>/dev/null
docker run -d --name castle-gateway --restart unless-stopped -p 8090:8090 --env-file apps/gateway/.env castle-gateway
```

**Seçenek B — PM2 / doğrudan Node:** sunucuda repo veya artefakt güncelleyin, `npm ci --omit=dev`, ardından `pm2 restart <gateway-process>` veya eşdeğeri.

**Identity / bellek doğrulama (launch):** geçici olarak `.env` içinde `CASTLE_RHIZOH_LLM_IDENTITY_LOG=1` açın; gateway logunda `[rhizoh.llm.identity]` satırında `identityNarrativeChars` **> 0** olmalı (istemci `continuity.identityNarrative` gönderiyorsa). Tam teşhis için `CASTLE_RHIZOH_LLM_DIAG=1` (üretimde kısa süre).

GitHub Actions ile uzaktan redeploy: `.github/workflows/deploy-gateway.yml` (SSH secret’ları doldurulunca `workflow_dispatch`).

## 3. GitHub Actions (otomatik Hosting deploy)

Repository → **Settings → Secrets and variables → Actions** içinde en az:

| Secret | Açıklama |
|--------|----------|
| `FIREBASE_SERVICE_ACCOUNT_CASTLE_GENESIS` | Firebase CI servis hesabı JSON (tam içerik) |
| `VITE_FIREBASE_CONFIG` (veya ayrı `VITE_FIREBASE_*`) | Web config |
| `VITE_GATEWAY_WS` veya `VITE_GATEWAY_WS_URL` | `wss://...` |
| `VITE_GATEWAY_HTTP` veya `VITE_RHIZOH_LLM_HTTP` | `https://.../rhizoh/llm` |
| `VITE_ENV` | `production` (opsiyonel) |
| `VITE_GATEWAY_TOKEN` | Gateway token ile aynı |
| `VITE_CESIUM_ION_TOKEN` | İsteğe bağlı ama önerilir |
| `VITE_CASTLE_APP_ID` | Gateway ile aynı app id |

Workflow dosyası: `.github/workflows/deploy-hosting.yml`

## 4. Deploy Hosting

```bash
npm run firebase:deploy:hosting
```

Önce `npm run verify:production` ile ortamı kontrol edin.

## 5. SFU / Broadcaster (isteğe bağlı)

- `apps/sfu/.env.example` — WebRTC yayın için genelde public IP (`CASTLE_SFU_ANNOUNCED_IP`).
- `apps/broadcaster/.env.example` — Gateway WS + `OPENAI_API_KEY`.

## Tek referans

Tüm değişken listesi: **`ENV_KEYS.md`**

Entegrasyon sprinti (gateway domain, deploy modeli, env, Cesium, capability / launch maddeleri): **[`docs/INTEGRATION_SPRINT_CHECKLIST.md`](INTEGRATION_SPRINT_CHECKLIST.md)**

Kalıcı gateway domain kurulum runbook'u (VPS + PM2 + Nginx + SSL): **[`docs/GATEWAY_PERMANENT_SETUP.md`](GATEWAY_PERMANENT_SETUP.md)**
