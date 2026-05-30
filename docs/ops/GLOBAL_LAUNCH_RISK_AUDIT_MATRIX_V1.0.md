# Global Launch Risk Audit — Rhizoh Repo Matrix v1.0

**Framework:** [`GLOBAL_LAUNCH_RISK_AUDIT_FRAMEWORK_V1.0.md`](GLOBAL_LAUNCH_RISK_AUDIT_FRAMEWORK_V1.0.md)  
**Faz:** Controlled exposure (Legal MVP) — **global launch değil**  
**Legend:** DONE · PARTIAL · MISSING · UNKNOWN

---

## Özet (10 çekirdek soru — şu an)

| # | Soru | Durum |
|---|------|--------|
| 1 | Neden çöker? | **PARTIAL** — health endpoints var; merkezi incident otomasyonu zayıf |
| 2 | Yanlış davranırsa durdurma? | **PARTIAL** — SAFE_MODE / phase gate; tek global kill-switch bus yok |
| 3 | Kullanıcı verisi korunur mu? | **PARTIAL** — uid rules iyi; `castle/**` public read + memory rules gap |
| 4 | Agent çıktısı açıklanabilir mi? | **PARTIAL** — epistemic firewall + WAL spec; prod agent trace eksik |
| 5 | Maliyet patlarsa? | **MISSING** — cost dashboard / hard LLM cap yok |
| 6 | İlk kırılan katman? | **UNKNOWN** (yük testi yok) — tahmin: orchestration → billing |
| 7 | Kötü niyet absorbe? | **PARTIAL** — gateway rate limit; abuse report yok |
| 8 | Özellik saniyede kapanır mı? | **PARTIAL** — env flags; tek knob değil |
| 9 | Rollback? | **PARTIAL** — replay/repair; deploy rollback otomasyonu zayıf |
| 10 | AI vs ürün sorumluluğu ayrılmış mı? | **DONE** — legal + ingress + L4≠L1 doküman/kod |

---

## A. Agent architecture

| Madde | Durum | Kanıt / not |
|-------|--------|-------------|
| Kill switch | PARTIAL | `CASTLE_AGENT_EMERGENCY_DISABLE` + company SAFE_MODE |
| Max iteration | PARTIAL | `agentContainmentV0.js` on `/rhizoh/llm` |
| Tool whitelist | PARTIAL | `agentContractsRuntime.js` static allowed tools |
| Prompt injection logging | MISSING | Repo’da telemetry yok |
| Multi-agent loop guard | PARTIAL | Company substrate/DAG; prod Cursor-style guard yok |
| Sandboxing | PARTIAL | `sovereignVerifierTiers.js` SANDBOX; geniş prod sandbox yok |
| Context isolation | PARTIAL | Session/uid buckets gateway’de |
| Human override | PARTIAL | Spec + studio roles; ürün geneli zayıf |
| Emergency disable | PARTIAL | `phase1ActivationGateV0.js` — signal default OFF |

---

## B. Operasyonel

| Madde | Durum | Kanıt / not |
|-------|--------|-------------|
| Health checks | DONE | `apps/gateway/src/server.js` `/health/*` |
| Centralized logging | PARTIAL | Agent snapshot ring + audit; deploy’da merkezi pipeline yok |
| Agent state snapshots | PARTIAL | `agentObservabilityV0.js` + `/rhizoh/ops/agent-snapshots` |
| Alerting / incident | PARTIAL | Playbooks doc; otomatik paging UNKNOWN |
| Feature flags | DONE | `preDeploySubstrateGateV0.js`, env matrix go-live protocol |
| Canary / blue-green | PARTIAL | `CASTLE_PHASED_ROLLOUT_TIER` concurrent cap; Firebase tek deploy |
| Rollback (ops) | PARTIAL | `replayRepairKernelV0.js`; hosting rollback manuel |
| Circuit breaker | PARTIAL | Protocol Level A (env); kod modülü yok |
| Status page | MISSING | — |

---

## C. Güvenlik

| Madde | Durum | Kanıt / not |
|-------|--------|-------------|
| Rate limiting | DONE | `castleHttpRateLimit.js` + route wiring |
| WAF / edge | PARTIAL | `INFRASTRUCTURE_DNS_HARDENING_V0.1.md` — ops doğrulanmalı |
| RBAC | PARTIAL | uid-scoped; tam rol matrisi yok |
| Firebase rules | PARTIAL | `firestore.rules` — **P0:** `castle/{**}` public read |
| Memory collection rules | MISSING | `castle_user_memory` gateway’de; rules’da yok |
| Session isolation | PARTIAL | `users/{uid}` iyi; public read paths risk |
| Audit trail | PARTIAL | Legal ingress audit + rhizoh_events append-only |
| Abuse detection | PARTIAL | API caps; kullanıcı report yok |

---

## D. Hukuki / regülasyon

| Madde | Durum | Kanıt / not |
|-------|--------|-------------|
| KVKK / aydınlatma | DONE | `/legal/kvkk-aydinlatma-tr.html` + SSOT |
| Consent (ayrı checkbox) | DONE | `ingress_router.js` v0.2 + `LegalPreambleScreen.jsx` |
| Cookie gate | DONE | `CookieConsentBanner.jsx` + `main.jsx` gate |
| AI disclaimer | DONE | ToS + `ai-open-consent-tr.html` |
| Counsel OK (mühür) | MISSING | PDF hazır; yazılı onay bekliyor |
| GDPR full program | PARTIAL | Checklist taslak; odak KVKK |
| Data deletion pipeline | PARTIAL | KVKK metni; otomatik pipeline UNKNOWN |
| Age restrictions | MISSING | — |
| Content moderation (legal) | PARTIAL | ToS kuralları; ürün moderasyonu yok |

---

## E. Maliyet / scale

| Madde | Durum | Kanıt / not |
|-------|--------|-------------|
| Token budget (agent) | PARTIAL | `token_limit_daily` contract + session ceiling |
| Per-user LLM hard cap | PARTIAL | `costContainmentV0.js` daily budget + downgrade |
| Cost dashboard | MISSING | Stats via `/rhizoh/ops/hardening/status` only |
| Usage caps / quotas | PARTIAL | HTTP limits + product policy store |
| Auto-throttle | PARTIAL | Rate limit; maliyet bazlı throttle yok |
| Load test / break point | MISSING | — |

---

## F. Topluluk / sosyal

| Madde | Durum | Kanıt / not |
|-------|--------|-------------|
| Community guidelines | PARTIAL | ToS; ayrı community doc zayıf |
| Abuse reporting | MISSING | Kullanıcı yüzeyi yok |
| Moderation tools | PARTIAL | Studio `presenceRoleSlice` — global değil |
| Human review pipeline | MISSING | — |
| Crisis owner | PARTIAL | Outreach governance notes only |

---

## Alan bazlı rollup

| Alan | DONE | PARTIAL | MISSING | UNKNOWN |
|------|------|---------|---------|---------|
| Agent architecture | 0 | 7 | 2 | 0 |
| Auth / security | 1 | 6 | 2 | 0 |
| Memory | 0 | 2 | 1 | 0 |
| Infra / ops | 2 | 6 | 1 | 1 |
| Moderation | 0 | 2 | 2 | 0 |
| Logging / observability | 0 | 3 | 0 | 1 |
| Billing / cost | 0 | 2 | 2 | 0 |
| Deployment | 1 | 2 | 1 | 0 |
| Legal docs | 4 | 2 | 1 | 0 |
| Rollback / emergency | 0 | 4 | 0 | 0 |

---

## P0 — Controlled exposure öncesi (şimdi)

| # | Gap | Aksiyon |
|---|-----|---------|
| 1 | Counsel OK yok | PRIMARY PDF → avukat → yazılı onay |
| 2 | `castle/**` public read | Rules sıkılaştır veya client kullanımını kapat |
| 3 | Memory Firestore rules | `castle_user_memory` / agent memory eşle |
| 4 | Cookie enforcement | Staging network tab checklist |
| 5 | Signal OFF doğrulama | `activation-readiness-check` + env audit |

---

## P1 — Global launch öncesi (sonra)

| # | Gap | Aksiyon |
|---|-----|---------|
| 1 | Agent max-iteration + injection log | Gateway/agent runtime guard |
| 2 | Global kill-switch bus | `STABILIZATION.md` backlog |
| 3 | Abuse report + moderation MVP | Ürün yüzeyi |
| 4 | Cost ceiling + dashboard | Billing plane |
| 5 | Central logging + alerting | Deploy pipeline |
| 6 | Blue/green veya canary hosting | CI/CD |
| 7 | Load test | 10k concurrent senaryo |

---

## Şu anki faz ile uyum

| Hedef | Matris yorumu |
|-------|----------------|
| Legal MVP + static deploy | Legal satırı **DONE**; Counsel mühür **MISSING** |
| Activation OFF | Emergency / phase gate **PARTIAL** yeterli |
| Global viral launch | Agent + billing + moderation **MISSING** — bilinçli erteleme |

**Sonuç:** “Korku” ile “ölçülebilir risk” ayrıştı. Şu an **controlled exposure** için yeterli sınır var; **global launch** için P1 listesi net.

---

*Matrix v1.0 — 2026-05-24. Güncelleme: counsel OK + staging smoke + load test sonrası.*
