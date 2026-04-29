# Castle — API anahtarları ve ortam değişkenleri

Bu dosya repodaki **tüm gizli / yapılandırma** değişkenlerinin tek referansıdır. Gerçek değerleri yalnızca `.env.local`, `.env.production` veya barındırıcı gizli alanlarında tutun; repoya commit etmeyin.

## Dışarıdan alınacak anahtarlar (özet)

| Kaynak | Ne için |
|--------|---------|
| **Firebase Console** (proje `castle-genesis`) | Web: `VITE_FIREBASE_CONFIG`. Sunucu: servis hesabı → `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. |
| **OpenAI / Anthropic / Google AI / xAI / DeepSeek / Mistral / OpenRouter** | Rhizoh LLM (`CASTLE_LLM_PROVIDER` + ilgili `*_API_KEY`). |
| **Cesium ion** | `VITE_CESIUM_ION_TOKEN`. |
| **Mapbox** | `VITE_MAPBOX_TOKEN`. |
| **Telegram BotFather** | `CASTLE_TELEGRAM_BOT_TOKEN`. |
| **Meta WhatsApp Cloud API** | `CASTLE_WHATSAPP_TOKEN`, `CASTLE_WHATSAPP_PHONE_NUMBER_ID`. |
| **Sizin ürettiğiniz gizli** | `CASTLE_GATEWAY_TOKEN` = `VITE_GATEWAY_TOKEN`; `CASTLE_JWT_SECRET`; `CASTLE_STORE_SECRET`. |
| **GitHub Actions deploy** | `FIREBASE_SERVICE_ACCOUNT_CASTLE_GENESIS` (JSON) + build için `VITE_*` secret’ları. |

## Uyum: istemci ↔ gateway

| İstemci (`apps/client`) | Gateway (`apps/gateway`) | Not |
|-------------------------|---------------------------|-----|
| `VITE_GATEWAY_TOKEN` | `CASTLE_GATEWAY_TOKEN` | **Aynı gizli dize** olmalı; gateway bunu WebSocket/HTTP için doğrular. |
| `VITE_GATEWAY_WS_URL` | — | Örn. `wss://api.sizin-domain.com` (HTTPS sayfada `wss` kullanın). |
| `VITE_RHIZOH_LLM_HTTP` | Gateway aynı hostta `.../rhizoh/llm` | Örn. `https://api.sizin-domain.com/rhizoh/llm`. |
| `VITE_RHIZOH_LLM_TOKEN` | İlgili HTTP route koruması varsa | Gateway tarafında ayrı header kontrolü yoksa boş kalabilir; üretimde TLS + auth önerilir. |

## 1. Tarayıcı (Vite) — `apps/client`

| Değişken | Zorunlu | Nereden | Açıklama |
|----------|---------|---------|----------|
| `VITE_FIREBASE_CONFIG` | Üretimde önerilir | Firebase Console → Project settings → Your apps → Web → config JSON (tek satır) | `vite` build sırasında gömülür (`__firebase_config`). |
| `VITE_GATEWAY_WS_URL` | Önerilir | Kendi gateway URL’niz | Varsayılan `ws://localhost:8090`. |
| `VITE_GATEWAY_TOKEN` | Gateway’de token zorunluysa | Siz üretin | `CASTLE_GATEWAY_TOKEN` ile eşleşmeli. |
| `VITE_RHIZOH_LLM_HTTP` | Önerilir | Gateway tabanı + `/rhizoh/llm` | Rhizoh LLM HTTP proxy. |
| `VITE_RHIZOH_LLM_TOKEN` | İsteğe bağlı | — | İstemci tarafı ek header ihtiyacı için (şema için ayrılmış). |
| `VITE_CESIUM_ION_TOKEN` | Cesium Ion kullanıyorsanız | [Cesium ion](https://cesium.com/ion/) | 3D küre / gerçek dünya katmanı. |
| `VITE_MAPBOX_TOKEN` | Mapbox raster kullanıyorsanız | Mapbox | Uydu / vektör şablonları. |
| `VITE_SATELLITE_TILE_TEMPLATE` | Özel karo şablonu | — | `{z}/{x}/{y}` şablonu. |
| `VITE_DRONE_TELEMETRY_WS` | Canlı İHA köprüsü | Kendi WS | Telemetri akışı. |
| `VITE_FLIGHT_VIEWER_HTTP` | İsteğe bağlı | — | Uçuş viewer API. |
| `VITE_TELEMETRY_MAX_HZ` | Hayır | — | Varsayılan `30`. |
| `VITE_SIM_DRONE_COUNT` | Hayır | — | Varsayılan `4`. |
| `VITE_CASTLE_APP_ID` | Hayır | Siz belirlersiniz | `vite` → `__app_id`; Firestore’da `artifacts/{appId}/...` (varsayılan `castle-vnext-core`). |

**Dosyalar:** `.env.example`, `.env.production.example` → kopya `.env.local` / `.env.production`.

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
