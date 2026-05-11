# Firestore Rules — intent (FER-1 companion)

**Rol:** `firestore.rules` **henüz yok** veya epistemic koleksiyonları kapsamıyor; bu belge **kuralların neyi garanti etmesi gerektiğini** yazar — uygulama ayrı PR ([FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) sprint parça 2).

**Durum:** `NORMATIVE_TARGET`

---

## 1. Tehlike modeli

Şu an Firestore **yazılabilir** olsa da, epistemic koleksiyonlar rules’sız **güvenli değil** (kimlik sahteciliği, stream zehirleme, ESTL spam, companion↔observe veri karışması).

---

## 2. Zorunlu kural aileleri

| Aile | Amaç |
|------|------|
| **Auth bağlama** | `rhizoh_*` yazan her istek `request.auth != null`; `uid` alanları `request.auth.uid` ile tutarlı (ürün kararına göre). |
| **Companion izolasyonu** | `companion_event_stream` / companion yazma yolları: yalnız **kendi oturumu**; başka kullanıcının companion payload’una yazılamaz. |
| **Observe / OWIS** | `observe_world_stream`: yazma hızı / boyut üst sınırı (spam önleme); `primaryClaimCount` şekil kontrolü (kurallar tam sayı aralığı doğrular; **max-2 iş kuralı** ağır kısmı function’da tekrarlanır). |
| **ESTL** | `estl_*`: yazma kota + yalnızca facilitator rolü veya kendi `sessionId` (ürün kararı); public okuma kapalı veya aggregate-only. |
| **TCS ayna** | `rhizoh_client_sync`: istemci yalnız **kendi** belgesi; `productSurface` enum whitelist (string `in` listesi). |
| **Broadcast** | `broadcast_index` / `broadcast_sessions`: üyelik + `castleId` şartı; embed URL şema doğrulaması (https, host whitelist). |

---

## 3. Kuralların bilerek yapmadığı şeyler

| Sorumluluk | Neden |
|--------------|--------|
| **correlationId global benzersizliği** | Firestore Rules ile zor; **gateway / transaction** veya dedup function. |
| **Tam JSON Schema** | Rules’ta sınırlı; **validate** function veya gateway. |
| **OWIS max-2 tam semantik** | Kurallar + sunucu çift kontrol. |

---

## 4. Çıktı artefaktı

Kök [`firestore.rules`](../firestore.rules) içinde **FER-1 minimal** bloklar eklendi (`rhizoh_events`, `rhizoh_client_sync`, `estl_*`, `broadcast_index`) — detay ve dosya haritası: [Minimal Production Stack](RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md). Emulator + `firebase deploy --only firestore:rules` ile doğrulanmalıdır.

---

*Rules intent FER-1 — erişim kontrolü; companion izolasyonu; ESTL kota.*
