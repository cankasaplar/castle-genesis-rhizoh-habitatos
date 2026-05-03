# Gateway — Render Web Service

Castle gateway (`apps/gateway`) bu monorepodaki **Node** HTTP/WS sunucusudur. Rhizoh istemcisi **`POST /rhizoh/llm`** ve health için **`GET /health/live`**, **`/health/ready`**, **`/health/deps`** kullanır.

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
CASTLE_ALLOWED_ORIGINS=https://castle-genesis.web.app,http://localhost:5173
CASTLE_HTTP_CORS_ORIGIN=https://castle-genesis.web.app
CASTLE_REQUIRE_AUTH=false
CASTLE_ALLOW_DEV_ANON=true
CASTLE_ALLOW_DEV_HTTP_UID=true
OPENAI_API_KEY=sk-...
CASTLE_LLM_MODEL=gpt-4o-mini
```

- **`CASTLE_GATEWAY_TOKEN`:** İstemci `VITE_GATEWAY_TOKEN` ile **aynı string** olmalı.
- **`OPENAI_API_KEY`:** Gateway’de; istemciye koyma.

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
