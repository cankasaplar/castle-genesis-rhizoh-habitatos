# Castle — API anahtarları ve ortam değişkenleri

Bu dosya repodaki **tüm gizli / yapılandırma** değişkenlerinin tek referansıdır. Gerçek değerleri yalnızca `.env.local`, `.env.production` veya barındırıcı gizli alanlarında tutun; repoya commit etmeyin.

**Hızlı özet (hangi dosya?):** repo kökünde **`ANAHTARLAR_BURAYA.txt`** — ilk kurulum için `npm run setup:env`.

**Üretim kontrol listesi:** [`docs/PRODUCTION_LAUNCH_CHECKLIST.md`](docs/PRODUCTION_LAUNCH_CHECKLIST.md) · Yerel doğrulama: `npm run verify:production` (şablonları doldurduktan sonra).

**Gateway’i Render’a almak:** [`docs/RENDER_GATEWAY.md`](docs/RENDER_GATEWAY.md) — monorepo **kökünden** build (`render.yaml` veya kök `npm ci` + `node apps/gateway/src/server.js`). Client `VITE_RHIZOH_LLM_HTTP` / `VITE_GATEWAY_WS` Render’da gösterilen host ile doldurulmalı (başka GitHub reposu değil).

## Dışarıdan alınacak anahtarlar (özet)

| Kaynak | Ne için |
|--------|---------|
| **Firebase Console** (proje `castle-genesis`) | Web: `VITE_FIREBASE_CONFIG`. Sunucu: servis hesabı → `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. |
| **OpenAI / Anthropic / Google AI / xAI / DeepSeek / Mistral / OpenRouter** | Rhizoh LLM (`CASTLE_LLM_PROVIDER` + ilgili `*_API_KEY`). |
| **Cesium ion** | `VITE_CESIUM_ION_TOKEN` |
| **Mapbox** | `VITE_MAPBOX_TOKEN`. |
| **Telegram BotFather** | `CASTLE_TELEGRAM_BOT_TOKEN`. |
| **Meta WhatsApp Cloud API** | `CASTLE_WHATSAPP_TOKEN`, `CASTLE_WHATSAPP_PHONE_NUMBER_ID`. |
| **Sizin ürettiğiniz gizli** | `CASTLE_GATEWAY_TOKEN` = `VITE_GATEWAY_TOKEN`; `CASTLE_JWT_SECRET`; `CASTLE_STORE_SECRET`. |
| **GitHub Actions deploy** | `FIREBASE_SERVICE_ACCOUNT_CASTLE_GENESIS` (JSON) + build için `VITE_*` secret’ları. |
| **Gmail (SPIRALMMO günlük rapor)** | `SPIRALMMO_SMTP_USER`, `SPIRALMMO_SMTP_APP_PASSWORD` (Google App Password), `SPIRALMMO_REPORT_TO` — kurulum: `scripts/setup-gmail-spiralmmo.ps1` · [`docs/SPIRALMMO_DAILY_EMAIL_AUTOMATION_V0.md`](docs/SPIRALMMO_DAILY_EMAIL_AUTOMATION_V0.md) |
| **Ops mail kimligi (From)** | `RHIZOH_MAIL_MORNING_FROM`, `RHIZOH_MAIL_SPIRALMMO_FROM`, `*_FROM_NAME` — `scripts/set-rhizoh-mail-identity.ps1` · [`docs/RHIZOH_OPS_MAIL_IDENTITY_V0.md`](docs/RHIZOH_OPS_MAIL_IDENTITY_V0.md) · GoDaddy: [`docs/RHIZOH_GODADDY_MAIL_SETUP_V0.md`](docs/RHIZOH_GODADDY_MAIL_SETUP_V0.md) |

## Rhizoh ana hat (gateway route’ları)

Sunucu **`apps/gateway/src/server.js`** içinde Express yok; yollar sabit path ile eşleşir.

| Amaç | Method | Path | Tam örnek |
|------|--------|------|-----------|
| **Rhizoh LLM** (istemci ana hat) | `POST` | **`/rhizoh/llm`** | `https://HOST/rhizoh/llm` |
| Canlılık | `GET` | `/health/live` | `https://HOST/health/live` |
| Hazır | `GET` | `/health/ready` | `https://HOST/health/ready` |
| Bağımlılıklar (istemci monitörü) | `GET` | `/health/deps` | `https://HOST/health/deps` |

**`/api/chat`**, **`/gateway`** veya tek başına **`/rhizoh`** bu gateway’de Rhizoh LLM için kullanılmıyor; doğru path **`/rhizoh/llm`**.

### İstemci env (tam URL)

Şunlardan **biri** yeterli; kod önceliği: **`VITE_GATEWAY_HTTP` → `VITE_RHIZOH_LLM_HTTP`** (`castleFlightConfig.js`).

```bash
# Önerilen (tek satırda tam uç nokta):
VITE_RHIZOH_LLM_HTTP=https://HOST/rhizoh/llm

# veya aynı değer:
VITE_GATEWAY_HTTP=https://HOST/rhizoh/llm
```

`HOST` örnekleri: `castle-gateway.onrender.com`, `api.castlegenesis.ai`, `xxxx.run.app` (Cloud Run).

`VITE_GATEWAY_TOKEN` = gateway’deki **`CASTLE_GATEWAY_TOKEN`** ile aynı olmalı.

### Deploy sonrası doğrulama (kritik)

1. **Build’de env gömüldü mü:** üretim sayfasında tarayıcı konsolu:
   - `import.meta.env.VITE_RHIZOH_LLM_HTTP` **veya** kullandığınız `import.meta.env.VITE_GATEWAY_HTTP`
   - Çıktı **string URL** olmalı (boş / `undefined` ise Hosting build sırasında secret yok demektir → GitHub Actions secret veya `apps/client/.env.production` + yeniden `npm run build`).

2. **Network:** Rhizoh mesajı gönderince `rhizoh/llm` isteği — beklenen durum kodları: **200** (başarı), **401/403** (token/auth), veya CORS hatası (origin / `CASTLE_HTTP_CORS_ORIGIN`).

3. **Health:** yeni sekmede `GET https://HOST/health/deps` → JSON (`llm`, `ok`, …); tarayıcıdan CORS gerekebilir — **aynı origin veya CORS açık** olmalı.

## Uyum: istemci ↔ gateway

| İstemci (`apps/client`) | Gateway (`apps/gateway`) | Not |
|-------------------------|---------------------------|-----|
| `VITE_GATEWAY_TOKEN` | `CASTLE_GATEWAY_TOKEN` | **Aynı gizli dize** olmalı; gateway bunu WebSocket/HTTP için doğrular. |
| `VITE_GATEWAY_URL` | — | Tek HTTPS taban (örn. `https://api…`); istemci `wss://…` ve `…/rhizoh/llm` türetir. Ayrı `VITE_GATEWAY_WS` / `VITE_GATEWAY_HTTP` verilirse onlar önceliklidir. |
| `VITE_GATEWAY_WS` / `VITE_GATEWAY_WS_URL` | — | Kısa ad `VITE_GATEWAY_WS`; örn. `wss://api.sizin-domain.com` veya `/ws` path’li tam URL. |
| `VITE_GATEWAY_HTTP` / `VITE_RHIZOH_LLM_HTTP` | Gateway **`POST /rhizoh/llm`** | **Tam URL:** `https://HOST/rhizoh/llm`. Önce `VITE_GATEWAY_HTTP`, yoksa `VITE_RHIZOH_LLM_HTTP`. |
| `VITE_RHIZOH_LLM_TOKEN` | İlgili HTTP route koruması varsa | Gateway tarafında ayrı header kontrolü yoksa boş kalabilir; üretimde TLS + auth önerilir. |

## 1. Tarayıcı (Vite) — `apps/client`

| Değişken | Zorunlu | Nereden | Açıklama |
|----------|---------|---------|----------|
| `VITE_FIREBASE_CONFIG` | Alternatif | Firebase Console → Web app JSON (tek satır) | `vite` build birleştirir; **veya** aşağıdaki `VITE_FIREBASE_*` alanları. |
| `VITE_FIREBASE_API_KEY` | Split modda | Console Web config | `VITE_FIREBASE_PROJECT_ID` ile birlikte kullanılabilir. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Hayır | — | Örn. `castle-genesis.firebaseapp.com`. |
| `VITE_FIREBASE_PROJECT_ID` | Split modda | — | Örn. `castle-genesis`. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Hayır | — | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Hayır | — | |
| `VITE_FIREBASE_APP_ID` | Hayır | — | |
| `VITE_FIREBASE_MEASUREMENT_ID` | Hayır | Analytics | |
| `VITE_FIREBASE_DATABASE_URL` | Hayır | Realtime DB | Boşsa `projectId` üzerinden varsayılan üretilir. |
| `VITE_GATEWAY_URL` | Önerilir (tek alan) | HTTPS gateway kökü | Örn. `https://api.example.com` → WS ve `/rhizoh/llm` otomatik; aşağıdaki ayrıntılı değişkenler doluysa onlar baskın. |
| `VITE_GATEWAY_WS` | Önerilir | Kendi gateway WS URL’niz | **VITE_GATEWAY_WS_URL** ile aynı rol (önce `VITE_GATEWAY_WS`). Varsayılan `ws://localhost:8090`. |
| `VITE_GATEWAY_HTTP` | Önerilir | Rhizoh LLM tabanı | **VITE_RHIZOH_LLM_HTTP** ile aynı rol (önce `VITE_GATEWAY_HTTP`). |
| `VITE_ENV` | Hayır | — | Bilgi amaçlı; genelde `production`. |
| `VITE_GATEWAY_TOKEN` | Gateway’de token zorunluysa | Siz üretin | `CASTLE_GATEWAY_TOKEN` ile eşleşmeli. |
| `VITE_RHIZOH_LLM_TOKEN` | İsteğe bağlı | — | İstemci tarafı ek header ihtiyacı için (şema için ayrılmış). |
| `VITE_GATEWAY_WS_URL` | Hayır | Eski isim | `VITE_GATEWAY_WS` yoksa kullanılır. |
| `VITE_RHIZOH_LLM_HTTP` | Hayır | Eski isim | `VITE_GATEWAY_HTTP` yoksa kullanılır. |
| `VITE_CESIUM_ION_TOKEN` | Cesium Ion kullanıyorsanız | [Cesium ion](https://cesium.com/ion/) | 3D küre / gerçek dünya katmanı. |
| `VITE_MAPBOX_TOKEN` | Mapbox raster kullanıyorsanız | Mapbox | Uydu / vektör şablonları. |
| `VITE_SATELLITE_TILE_TEMPLATE` | Özel karo şablonu | — | `{z}/{x}/{y}` şablonu. |
| `VITE_DRONE_TELEMETRY_WS` | Canlı İHA köprüsü | Kendi WS | Telemetri akışı. |
| `VITE_FLIGHT_VIEWER_HTTP` | İsteğe bağlı | — | Uçuş viewer API. |
| `VITE_TELEMETRY_MAX_HZ` | Hayır | — | Varsayılan `30`. |
| `VITE_SIM_DRONE_COUNT` | Hayır | — | Varsayılan `4`. |
| `VITE_CASTLE_APP_ID` | Hayır | Siz belirlersiniz | `vite` → `__app_id`; Firestore’da `artifacts/{appId}/...` (varsayılan `castle-vnext-core`). |
| `VITE_GENESIS_DEPLOY_MODE` | Hayır | `research` \| `observability` | Genesis Replay Observatory: **research** = laboratuvar (topoloji serbest); **observability** = H_surface kilidi + Legacy drift. GitHub Hosting deploy workflow varsayılanı **`observability`**. |
| `VITE_GENESIS_PASSIVE_EPOCH_MAX` | Hayır | Tamsayı | İlk N epistemik gradient epoch’ta rejim geçişi yalnızca log; varsayılan `100`. |
| `VITE_GENESIS_SIMULATE_LEGACY_DRIFT` | Hayır | `1` yalnız QA | Observability modda Legacy drift UI’yi zorlar; üretimde kapalı tutun. |
| `VITE_RHIZOH_INVITE_ONLY_GOOGLE` | Hayır | `1` | Giriş ekranında yalnızca Google; misafir + e-posta akışı gizlenir (kapalı kohort). |
| `VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST` | Hayır | Virgül/noktalı virgül ile e-postalar | **Yalnızca** `VITE_RHIZOH_COHORT_SERVER_GATE` kapalıyken istemci tarafında uygulanır. Üretimde sunucu kapısını tercih edin. |
| `VITE_RHIZOH_COHORT_OBSERVATION_LOG` | Hayır | `0` / `1` / boş | `0` kapalı. `1` açık. Boş: invite-only veya allowlist açıksa otomatik açık — `sessionStorage` halkası + `window.__CASTLE_COHORT_OBSERVATION_LOG__()`. **Pasif gözlem:** buffer runtime gate veya ürün kararı tetiklemez; yalnızca allowlist’li etiketler yazılır. |
| `VITE_RHIZOH_COHORT_SERVER_GATE` | Hayır | `1` | Açıksa oturumdan sonra `cohortGateV0` HTTPS ile doğrulama zorunlu; istemci `VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST` yetki için kullanılmaz. |
| `VITE_RHIZOH_COHORT_GATE_URL` | Hayır | Tam HTTPS URL | Boşsa `window.location.origin + /api/cohortGateV0` (Hosting rewrite gerekir). |
| `VITE_ONTOLOGICAL_BOOT_GATE` | Hayır | `0` \| `1` / boş | **`1`** → ön-yükleme gate açık (IDB seal + `mayBootstrapRuntime`). **`0` veya tanımsız** → gate kapalı (üretim cold start / kohort). `VITE_SUBSTRATE_CONTINUITY_IDB=1` iken gate açılır. |

**Dosyalar:** `.env.example`, `.env.production.example` → kopya `.env.local` / `.env.production`.

### 1b. Firebase Functions (`functions/`)

| Parametre / değişken | Zorunlu | Açıklama |
|----------------------|---------|----------|
| `COHORT_EMAIL_ALLOWLIST` | Kohort kapısı açıksa | **Function ortam değişkeni** (Gen2) — virgülle e-postalar. Boşsa `cohortGateV0` **503**. Örnek: `firebase deploy --only functions --set-env-vars COHORT_EMAIL_ALLOWLIST="a@x.com,b@y.com"` veya Console → cohortGateV0 → Ortam değişkenleri. |
| `cohortGateV0` | — | HTTPS; `Authorization: Bearer <Firebase ID token>`; başarıda `rhizoh_cohort_v0: true` custom claim (Firestore kurallarında sonraki adım). |
| Hosting rewrite | — | `firebase.json`: `/api/cohortGateV0` → `cohortGateV0`. **Sadece Hosting deploy** fonksiyonu yüklemez — ilk kurulumda: `firebase deploy --only functions,hosting,firestore:rules,storage` (projeye göre daraltın). |

## 2. Gateway — `apps/gateway`

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `FIREBASE_PROJECT_ID` | Admin + Firestore persist için | Örn. `castle-genesis`. |
| `FIREBASE_CLIENT_EMAIL` | ↑ | Servis hesabı e-postası. |
| `FIREBASE_PRIVATE_KEY` | ↑ | PEM; çok satırlıysa `\n` kaçışlı tek satır. |
| `CASTLE_REQUIRE_FIREBASE_PERSIST` | — | `true` ise yukarıdaki üçlü zorunlu (`firebasePersistence.js`). |
| `CASTLE_JWT_SECRET` | Firebase Admin yoksa ve JWT ile auth kullanılacaksa | HS256 imza gizlisi. |
| `CASTLE_GATEWAY_TOKEN` | Üretimde önerilir | İstemci `VITE_GATEWAY_TOKEN` ile aynı. |
| `CASTLE_GATEWAY_PORT` | Hayır | Varsayılan `8090`. |
| `CASTLE_MAX_MESSAGE_BYTES` | Hayır | WS mesaj üst sınırı. |
| `CASTLE_ALLOWED_ORIGINS` | CORS | Virgülle ayrılmış origin listesi. |
| `CASTLE_HTTP_CORS_ORIGIN` | HTTP yanıtları | Örn. `https://castle-genesis.web.app`. |
| `CASTLE_REQUIRE_AUTH` | — | `true` → bağlantılarda token doğrulama. |
| `CASTLE_ALLOW_DEV_ANON` | — | Varsayılan anon’a izin (geliştirme). |
| `CASTLE_ALLOW_DEV_HTTP_UID` | — | HTTP üzerinden dev uid. |
| `CASTLE_DATA_DIR` | Hayır | Kalıcı dosya dizini. |
| `CASTLE_STORE_SECRET` | Önerilir | `llmConnectionsStore` anahtar türetme. |
| `CASTLE_LLM_PROVIDER` | Hayır | `openai`, `anthropic`, `gemini`, `xai`, `deepseek`, `mistral`, `openrouter`. |
| `CASTLE_LLM_MODEL` | Hayır | Sağlayıcı model adı. |
| `OPENAI_API_KEY` | Sağlayıcıya göre | OpenAI / `rhizohBrain` yolu. |
| `ANTHROPIC_API_KEY` | Sağlayıcıya göre | Claude. |
| `GOOGLE_API_KEY` veya `GEMINI_API_KEY` | Gemini seçildiyse | `rhizohLlmGateway.js`. |
| `XAI_API_KEY` | xAI seçildiyse | |
| `DEEPSEEK_API_KEY` | DeepSeek seçildiyse | |
| `MISTRAL_API_KEY` | Mistral seçildiyse | |
| `OPENROUTER_API_KEY` | OpenRouter seçildiyse | |
| `CASTLE_TELEGRAM_BOT_TOKEN` | Telegram entegrasyonu | |
| `CASTLE_WHATSAPP_TOKEN` | WhatsApp Cloud API | |
| `CASTLE_WHATSAPP_PHONE_NUMBER_ID` | ↑ | |
| `CASTLE_SOCIAL_RETRY_MAX` | Hayır | |
| `CASTLE_SOCIAL_RETRY_BASE_MS` | Hayır | |
| `CASTLE_MEMORY_LIMIT` / `HOT_LIMIT` / `COMPACT_THRESHOLD` | Hayır | Bellek mağazası. |
| `CASTLE_ACADEMY_EVENT_AUTO_RESOLVE_MS` | Hayır | |
| `CASTLE_GEOFENCE_CENTER_LAT` / `LON` / `RADIUS_M` | Hayır | Varsayılan İstanbul bölgesi. |
| `CASTLE_SPEED_CAP_MPS` | Hayır | Hız tavanı. |
| `CASTLE_RHIZOH_LLM_DIAG` | Hayır | `1` ise `/rhizoh/llm` isteklerinde maskeli bellek/kimlik özeti konsola yazılır (üretimde kapalı tutun). |
| `CASTLE_RHIZOH_LLM_IDENTITY_LOG` | Hayır | `1` ise her `/rhizoh/llm` çağrısında tek satır: `identityNarrativeChars`, `recentTurns`, bellek sayıları (prompt dökümü yok; doğrulama için). |
| `CASTLE_ARTIFACT_APP_ID` | Hayır | Tanı modunda Firestore `artifacts/{appId}/public/data/*` sayımı; istemci `VITE_CASTLE_APP_ID` ile aynı olmalı (varsayılan `castle-vnext-core`). |

**Dosya:** `apps/gateway/.env.example` (kopya `.env` veya `.env.local`).

## 3. SFU — `apps/sfu`

| Değişken | Açıklama |
|----------|----------|
| `CASTLE_SFU_PORT` | Varsayılan `5005`. |
| `CASTLE_SFU_RTC_MIN_PORT` / `CASTLE_SFU_RTC_MAX_PORT` | RTP port aralığı. |
| `CASTLE_SFU_ANNOUNCED_IP` | NAT arkasında genelde zorunlu (public IP). |

## 4. Broadcaster — `apps/broadcaster`

| Değişken | Açıklama |
|----------|----------|
| `CASTLE_GATEWAY_WS_URL` | Gateway WebSocket. |
| `CASTLE_GATEWAY_TOKEN` | Gateway ile aynı paylaşımlı token. |
| `OPENAI_API_KEY` | Yayın cue / LLM ihtiyacı. |
| `CASTLE_BROADCAST_CUE_MS` | Cue aralığı (ms). |
| `CASTLE_STREAM_TARGET` | Varsayılan YouTube hedef URL. |

## 5. Firebase (özet)

| Ortam | Ne kullanılır |
|-------|----------------|
| **İstemci** | `VITE_FIREBASE_CONFIG` — Web SDK (`apiKey`, `authDomain`, `projectId`, …). Public; domain kısıtı Console’dan. |
| **Gateway** | Servis hesabı: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Admin SDK (Firestore, token doğrulama). |

**Proje kimliği:** `castle-genesis` (`.firebaserc` ile uyumlu).

### Authentication ve üyelik (ek anahtar gerekmez)

Console’da **Authentication → Sign-in method** içinde şunları etkinleştirin:

- **E-posta/Şifre** — kayıt ve giriş (`AppRhizoh528` + `useCastleAuth`).
- **Google** — `signInWithPopup` ile “Google ile devam et” (yetkili domain + OAuth ekranı Console’da).
- **Anonim** — “Misafir olarak devam et”.

Kullanıcı verisi **Firestore** `users/{uid}`: `displayName`, `onboardingCompleted`, `membershipTier` (`guest` | `member`), zaman damgaları. Kurallar `firestore.rules` içinde yalnızca ilgili `uid` okuyup yazabilir.

**Deploy:** `npm run firebase:deploy` veya `firebase:deploy:hosting` (yalnız statik); kural değişiklikleri için tam deploy veya `firebase:deploy:rules` benzeri hedef kullanın.

## 6. CI / GitHub Actions

Deploy workflow için örnek gizli adları: `FIREBASE_SERVICE_ACCOUNT_CASTLE_GENESIS`, `VITE_FIREBASE_CONFIG`, `VITE_GATEWAY_WS_URL`, `VITE_GATEWAY_TOKEN`, `VITE_CASTLE_APP_ID`, … — `.github/workflows/deploy-hosting.yml`.
