# Rhizoh Studio ↔ Firebase — Integration Stabilization (V0)

**Faz:** entegrasyon sabitleme — mimari spek değil, **persistence contract** ile kimlik modelinin hizalanması.  
**İlişki:** Kimlik politikası [`RHIZOH_SSOT_SELECTION_POLICY_V0.md`](RHIZOH_SSOT_SELECTION_POLICY_V0.md) · runtime merge anları [`RHIZOH_RUNTIME_IDENTITY_RESOLUTION_FLOW_V0.md`](RHIZOH_RUNTIME_IDENTITY_RESOLUTION_FLOW_V0.md) · FER-1 rules [`firestore.rules`](../firestore.rules) · intent özeti [`FIRESTORE_RULES_INTENT_FER1_V1.md`](FIRESTORE_RULES_INTENT_FER1_V1.md) · **rules ↔ envelope audit:** [`FIRESTORE_RULES_VS_STUDIO_ENVELOPE_AUDIT_V0.md`](FIRESTORE_RULES_VS_STUDIO_ENVELOPE_AUDIT_V0.md) · **reject log:** [`apps/client/src/firebase/captureFirestoreRejectionV1.js`](../apps/client/src/firebase/captureFirestoreRejectionV1.js).

---

## 1. Hedef akış (doğru)

```
UI Event
   ↓
Studio Adapter Layer (IAL — packaging, flatten değil)
   ↓
Canonical Firestore write model (+ FER-1 envelope şartları)
   ↓
Firebase (rhizoh_events/studio/items veya ürün kararı path)
```

**Yanlış:** `Studio → Firebase (raw UI state)`  
**Doğru:** `Studio → normalized event envelope → Firebase`

---

## 2. Canonical document model (V0 öneri)

Firestore belgesinde **kimlik artık tek string değil**; üst katmanda FER-1’in zorunlu alanları + bağlama alanları birlikte durur.

| Alan | Anlam |
|------|--------|
| `type` | `studio_*_v{n}` — [`firestore.rules`](../firestore.rules) `rhizohTypeMatchesStream('studio', …)` ile uyumlu sabit (ör. `studio_canonical_event_v1`) |
| `source` | `"client"` |
| `schemaVersion` | `1` (int) |
| `correlationId` | İstemci üretimi; dedup / debug (rules min/max uzunluk) |
| `actorUid` | `request.auth.uid` ile **aynı** olmalı |
| `sessionId` | Ürün anchor (`loadRhizohProductSession`) |
| `continuityBindingKey` | Yerel `continuityRef` değil — **mantıksal bağ** (ör. `localStorage:rhizoh.continuity.v1` veya ileride `rhizoh_client_sync/{uid}` doc id) |
| `traceId` | Gateway tur / veya istemci TRC (politikaya göre) |
| `connectionId` | LLM bağlantı id (string; boş izinli) |
| `identityMap` | SIG / identity graph **JSON-serializable snapshot** (yeni alan) |
| `eventType` | İş anlamı (`studio.save`, `studio.ingest`, …) |
| `payload` | Serbest ama küçük tutulmalı; ağır veri ayrı doc veya storage |

**Not:** `continuityRef` (React ref) Firestore’a yazılmaz; **binding key** veya sunucu doc yolu yazılır.

Üretici (istemci, saf fonksiyon): [`../apps/client/src/rhizoh/studio/studioFirestoreCanonicalEnvelopeV0.js`](../apps/client/src/rhizoh/studio/studioFirestoreCanonicalEnvelopeV0.js) — `buildRhizohStudioFirestoreEventDocument`.

---

## 3. Neden şimdi kırılır? (teşhis sınıfı)

- **Kimlik modeli** çok alanlı ve concern ayrışmış ([envanter](RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md)).
- **Studio / eski yol** hâlâ tek anahtar veya ham UI state ile yazıyorsa → **rules `rhizohEventEnvelopeOk()`** veya `hasAll` şartları **reddeder** (`permission-denied`, `invalid-argument`, eksik alan).
- **SSOT’u Firestore’a zorlamak** yanlış; **Firebase’i SSOT modeline adapter ile uydurmak** doğru (senin cümlen).

---

## 4. Hızlı debug checklist

1. **Firebase konsol / istemci catch:** `permission-denied` mı, `invalid-argument` mı, `missing field` mı?  
2. **Write payload:** `actorUid === auth.uid` mi? `schemaVersion` int mi? `type` `studio_*_v\d+` mu?  
3. **`sessionId` / `continuityBindingKey`:** `undefined` değil mi (boş string rules’ta genelde sorun değil; `hasAll` yoksa ek şart yok — **payload genişlemesi rules güncellemesi gerektirebilir**).  
4. **Çift init:** `initializeApp` birden fazla mı? (Studio lifecycle).  
5. **Mevcut diğer yazarlar:** `rrhp_projection_v1` merge payload’ı farklı şema; RCIL `addDoc` ham `event` spread — bunlar **ayrı koleksiyon**; `rhizoh_events/studio` ile karıştırma.

---

## 5. Çözüm sırası (öneri)

1. **Kök neden log’u** — hata tipini sabitle.  
2. **IAL** — UI → `buildRhizohStudioFirestoreEventDocument` (+ gerekirse `validateRhizohStudioFirestoreEventDocument`).  
3. **Koleksiyon / şema hizası** — `rhizoh_events/studio/items` için create path; gerekirse rules’ta `payload` boyutu / şekil (minimal genişletme).  
4. **Rules** — “`sessionId` tekil” gibi **yanlış global SSOT varsayımını** kaldır; FER-1 envelope + `actorUid` bağını koru.

---

## 6. Tek cümle

**Studio çöküşü:** Kimlik modeli evrildi ama **persistence contract (normalize envelope)** güncellenmediği için rules veya şema reddi.

---

*V0 — Integration stabilization; adapter uygulandıkça örneklerle genişletilir.*
