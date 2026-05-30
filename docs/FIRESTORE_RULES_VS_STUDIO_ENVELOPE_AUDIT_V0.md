# Firestore rules vs Studio canonical envelope — Audit (V0)

**Amaç:** `permission-denied` / `invalid-argument` kök nedenini **alan bazında** eşlemek.  
**Kaynak kurallar:** [`firestore.rules`](../firestore.rules) — `rhizoh_events/{stream}/items` + `rhizohEventEnvelopeOk()` + `rhizohTypeMatchesStream` + `observePrimaryClaimOk`.  
**İstemci üretici:** [`apps/client/src/rhizoh/studio/studioFirestoreCanonicalEnvelopeV0.js`](../apps/client/src/rhizoh/studio/studioFirestoreCanonicalEnvelopeV0.js).  
**Red yakalama:** [`apps/client/src/firebase/captureFirestoreRejectionV1.js`](../apps/client/src/firebase/captureFirestoreRejectionV1.js) → konsol `[CASTLE_FIRESTORE_REJECT]` + `window.__CASTLE_LAST_FIRESTORE_REJECT__`.

---

## 1. `rhizoh_events/{stream}/items` — create şartları

| Kural | Beklenen | Studio envelope (V0) | Uyum |
|-------|-----------|----------------------|------|
| `request.auth != null` | Oturum açık | `addDoc` çağıran auth’lı olmalı | Üretici değil, çağıran |
| `stream == 'studio'` | Path `rhizoh_events/studio/items` | `RHIZOH_STUDIO_FIRESTORE_STREAM` | Çağıran |
| `hasAll(['type','source','schemaVersion','correlationId','actorUid'])` | Beş anahtar zorunlu | Hepsi üst seviyede | Evet |
| `actorUid == request.auth.uid` | Eşleşme | `actorUid` caller’dan | Caller sorumlu |
| `source == 'client'` | Sabit | `"client"` | Evet |
| `schemaVersion is int` ve `== 1` | Sayı 1 | `1` (number, not string) | Evet |
| `type` string, `size() > 4` ve `< 200` | Uzunluk | `studio_canonical_event_v1` | Evet |
| `correlationId` string, `size() > 4` ve `< 200` | **> 4** (5+ karakter) | `ensureCorrelationId()` kısa girdiyi genişletir | Evet |
| `rhizohTypeMatchesStream('studio', type)` | `^studio_.*_v[0-9]+$` | `studio_canonical_event_v1` | Evet |
| `observePrimaryClaimOk` | `observe` stream’de `primaryClaimCount` | Studio’da koşul pasif | Evet |
| Ek alanlar (`sessionId`, `identityMap`, …) | Rules `hasAll` dışı alanları **genelde** yasaklamaz | Üst seviyede ek alanlar | Firestore’da ekstra alan genelde izinli; **ileri sıkılaştırma** ayrı PR |

---

## 2. Sık reject nedenleri → kontrol

| Firebase `code` | Olası neden |
|-----------------|-------------|
| `permission-denied` | `actorUid` ≠ `auth.uid`; `source` ≠ `client`; `schemaVersion` tipi; `type` / `correlationId` uzunluk; stream yanlış; `observe` için `primaryClaimCount` (studio değil) |
| `invalid-argument` | Geçersiz path, document id, veya veri tipi (ör. `schemaVersion` string) |

**Konsol:** `[CASTLE_FIRESTORE_REJECT]` satırında `context` + `code` + `message` birlikte bakın.

---

## 3. “React error 185” notu

Üretim build’de minify edilmiş React hata kodları **Firestore kodu değildir**. Eşzamanlı olarak:

1. Konsolda **`[CASTLE_FIRESTORE_REJECT]`** var mı bakın (`permission-denied` vb.).  
2. Yoksa hata **render / state** kaynaklı olabilir (ör. snapshot callback içinde sınırsız yeniden yazım); `useCastleAuth` içinde bootstrap `setDoc` hata durumunda `setProfileReady(true)` ile kilit açılır.

Kaynak map veya dev build ile React gerçek mesajını açmak ayrıca önerilir.

---

## 4. RCIL / RRHP / `users` — farklı path’ler

Bu audit **yalnızca** `rhizoh_events/studio/items` + canonical studio envelope içindir.

- **RCIL:** `castle/genesis/v1/runtime/rcil_events` — `rhizohEventEnvelopeOk` **uygulanmaz**; reject başka nedenlerden (auth, `castle/**` rules).  
- **RRHP:** `users/{uid}/rrhp_projection_v1/singleton` — alt koleksiyon `users/{uid}/**` yazma.  
- **`users` kök:** profil bootstrap — aynı blok.

Hepsi `logFirestoreRejection` ile **ayrı `context`** etiketiyle loglanır.

---

*V0 — Rules vs envelope; `firestore.rules` değişince bu tablo güncellenmelidir.*
