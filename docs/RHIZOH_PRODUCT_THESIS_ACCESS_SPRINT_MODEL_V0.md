# Rhizoh product thesis + access sprint model (v0)

**SPECFLOW:** `RESEARCH-ONLY` — ürün organizasyonu ve erişim çerçevesi; frozen core yürütmesinin yerine geçmez.

## Operational thesis (lock — English)

Rhizoh is a closed-access, role-based continuity system where users interact with a shared world through different perception and capability layers; SpiralMMO is a separate experimental simulation layer used only for research and non-production world mechanics.

## Sprint = davranış ve erişim paketi (özellik değil)

| Sprint | Paket | Soru |
|--------|--------|------|
| **1 — Controlled Access Launch** | Invite-only giriş; Google login (identity binding); RCML + continuity açık; HEL görünür; SpiralMMO kapalı veya read-only | Ürün var mı, kontrollü mü açılıyor? |
| **2 — Multi-Role Usage Layer** | Aynı sistem; farklı niyet / rol yüzeyleri (ör. TV’den pasif gözlem + academy; sınırlı event oluşturma; tam operasyon) | Kim neyi görebilir, neye dokunabilir? |
| **3 — Experience Expansion Layer** | SpiralMMO read-only gözlem; world mutation feedback stabil; cross-session continuity UX | Sistem tutarlı davranıyor mu? |

Rol örnekleri dokümandaki **simülasyon / runbook çapalarıdır**; production ingress’te “canlı varlık” olarak sunulmamalıdır (bkz. `AGENTS.md`).

## Mimari karşılık (tek dünya, çok algı)

- Ayrı ürün / ayrı backend yığını değil: **tek Rhizoh**, tek RCML, paylaşılan dünya modeli.
- Teknik karşılık: **role-based perception + capability gating** (görsel gerçeklik filtreleri, action surface, izin seviyeleri).
- TV / mobil / academy ayrımı önce **cihaz** değil **rol + yetenek** problemidir.

## Uyum çerçevesi (özet)

Profiling-as-product değil → **permissioned experience**; davranışsal manipülasyon değil → **bounded interaction**; opak tek motor değil → **explainable / katmanlı** anlatılabilirlik.

## SpiralMMO yerleşimi

Önce **observe-only** → sonra **controlled simulation** → en sonda **research cohort**; varsayılan production’da “herkesin ortak dünyası” değil.

## Dürüst risk

“Herkes her şeyi yapıyor ama farklı şekilde” iyi gate edilmezse: UI karmaşası, hukuki belirsizlik, permission drift. Mitigasyon: RCML + boundary + HEL disiplini.

## Faz

Artık saf “mimari tasarım” değil → **ürün organizasyonu + kullanıcı modeli + erişim ekonomisi**.
