# Rhizoh — Product shell & gateway backlog

Bu doküman, kernel/studio katmanının olgunluğu ile **ürün kabuğu (routing / zone / gateway)** arasındaki boşluğu netleştirir. Öncelik sırası: **A → B → C → D → E** (paralel mümkün olsa da C+D ürün kalbi).

## Doğrulanmış bugünkü durum (repo)

| Alan | Durum | Not |
|------|--------|-----|
| React shell | Tek kök | `apps/client/src/main.jsx` → `AppRhizoh528.jsx` |
| Client routing | SPA + az path | Örn. `/greenroom/live/:traceId` → çekmece + `applyBroadcastPresence` (`AppRhizoh528.jsx`) |
| Legacy yüzey | **301 + Vite redirect** | Eski `*.html` URL’leri kaldırıldı; `firebase.json` redirect + `CastleShellRouter` iç rotalar |
| RSK / Studio | İstemci içi | `apps/client/src/studio/**` — causal graph, presence, broadcast fold, director, attention, propagate, cross-room stitch, CI lock |
| Gateway LLM (HTTP) | Var | `apps/gateway/src/rhizohLlmGateway.js`, `rhizohGatewayTurn.js` — `/rhizoh/llm` vb. |
| Oda + atom delta (WS) | Kısmi / hedef | Tam zincir: join → publish causal delta → subscribe → replay — ayrı backlog maddesi |

---

## A — Product router unify

**Durum (2026-05):** `react-router-dom` + `CastleShellRouter`, `AppRhizoh528` içinde `useLocation` ile rota senkronu; legacy `public/*.html` kaldırıldı; `firebase.json` + Vite middleware 301/302.

**Kalan ince işler:** Üst menüde her yüzey için `navigate` + URL’nin her zaman tutarlı olması (çekmece aç/kapa ↔ `replaceState`), deep link testleri.

**Kabul:** Eski bookmark’lar tek SPA’ya düşer; studio kernel tek yerde.

---

## B — Presence world shell (Green Room = zone)

**Durum (2026-05):** `/greenroom/main` → `ensureGreenRoomMainHallBound()` → `roomUid = greenroom:main`, `joinPresenceRoom` + `transitionPresenceZone(backstage)`, `role = guest`, `status = quiet`; backstage `PresenceZoneSemantics` (toolAccess, agentAllowed, petAllowed, …). Viewport: Green Room backstage için loş ışık (`PresenceStudioViewport`).

**Kalan:** `/greenroom/live/:traceId` ile `broadcastProjections` / director tek pipeline; “Mirror = default world” tek `PresenceRoom` politikası.

---

## C — Gateway (minimum oda + atom)

**Amaç:** Çok kullanıcıda **kaynak gerçeği** gateway (veya ayrı realtime servisi); istemci kernel ile senkron.

**Minimum set:**

| Yetenek | Anlamı |
|---------|--------|
| `join room` | Kimlik + `roomUid` + avatar projection |
| `publish atom` | Causal / presence / broadcast atom append (yetkilendirilmiş) |
| `subscribe` | WebSocket veya SSE ile oda delta stream |
| `replay` | Graph veya projection snapshot + tarihsel okuma |

**Kabul:** İstemci “stub-only” moddan çıkınca bile offline/demo kernel korunur; online modda aynı atomlar sunucuya gider.

---

## D — Rhizoh live (stub → gerçek zincir)

**Amaç:** `client → gateway → LLM → (stream) → causal node → projection → viewport` zincirinin **ürün seviyesinde** tamamlanması.

**Not:** HTTP üzerinden LLM cevabı gateway’de mevcut; eksik parçalar tipik olarak:

- Streaming token’ların UI + opsiyonel ara causal node’lara yazımı
- Companion `listen/respond` ile gateway turn’ün tek pipeline’da birleştirilmesi
- Moderation / tool calling politikası (gateway’de veya ayrı katman)

**Kabul:** Bir “happy path” turn’ü uçtan uca loglanabilir (`traceId` + graph node id).

---

## E — Real map bind

**Amaç:** Cesium / harita varlığı ile **presence room** ve **broadcast room** aynı gerçeklik bağlamını paylaşır.

**Yapılacaklar:**

1. `EntityProjection` ↔ `AvatarEntity.projection` köprüsü (zaten kısmen var — `PresenceStudioViewport` entity mesh).
2. Harita odaklı `roomUid` veya “spatial bucket” ile broadcast odasını eşle; sunucu tarafında (C) ile aynı `roomUid`.
3. Ürün kuralı: “Map surface active” iken studio çekmecesi aynı `roomUid`’den bias örnekler.

**Kabul:** Haritada seçilen entity ile studio’daki avatar/broadcast aynı session kimliğine bağlanabilir.

---

## İlgili dosyalar (hızlı atlas)

- Shell: `apps/client/src/main.jsx`, `apps/client/src/AppRhizoh528.jsx`
- Router: `apps/client/src/shell/CastleShellRouter.jsx`, `firebase.json` `redirects`
- Studio kernel: `apps/client/src/studio/store/studioStore.ts`, `apps/client/src/studio/ui/KernelConsolePanel.tsx`, `DirectorDeckPanel.tsx`
- Gateway LLM: `apps/gateway/src/rhizohLlmGateway.js`, `apps/gateway/src/rhizohGatewayTurn.js`, `apps/gateway/src/server.js`
- CI: `.github/workflows/ci-enforcement.yml`, `scripts/locks/causal-schema.lock`

---

## Önerilen sıra (tek cümle)

Önce **A + B** (kullanıcı nerede olduğunu anlar), paralelde **C** (veri gerçeği), sonra **D** (LLM canlılığı), en sonda **E** (harita ↔ oda birleşimi).
