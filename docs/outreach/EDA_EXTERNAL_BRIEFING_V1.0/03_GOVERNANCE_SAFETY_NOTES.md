# Governance & Safety Notes

**Audience:** Policy, trust, and operational advisors  
**Length:** ~1 page  
**Tone:** Responsibility-first — not “AI hype”

---

## 1. Controlled rollout

We treat going live in **two separate decisions**:

| Decision | Meaning |
|----------|---------|
| **Ready?** | Infrastructure, legal pack, and automated checks say we *may* operate responsibly. |
| **Open?** | Any live external signal (e.g. device heartbeat) is allowed — **forbidden** until Ready is explicitly signed. |

Hosting a static site is **not** the same as activating data collection. That distinction is documented and checked in ops runbooks.

Rollout is **phased**: surface first, minimal read-only signal later, broader topology only after further gates — not a single launch event.

---

## 2. Security awareness

- **Least privilege:** production credentials and internal orchestration are **out of scope** for first external briefings.  
- **Separation:** control-plane paths are tested; data-plane ingestion is **designed but not wired** for production activation.  
- **Adversary thinking:** stress scenarios (flood, replay, malformed input) are described with **named violation types** — hash/tick mismatch is a failure, not “slow performance.”  
- **No silent channels:** interpretation constraints require that external input cannot find a side door into sealed state; violations are meant to be detectable.

We do not claim perfect security; we claim **explicit failure semantics** and a bias toward detectable breaches.

---

## 3. Moderation and harm mindset

- Harmful use is anticipated at the **product and community** level, not only as a model prompt issue.  
- Moderation is framed as **ongoing operational duty** (reports, escalation paths, proportionality) — not a one-time “safety model” badge.  
- AI-generated surface copy is treated as **non-authoritative** relative to sealed system state and legal text.

---

## 4. Data minimization (Phase 1 design intent)

When a first live signal is considered, the default schema is intentionally narrow:

- Opaque device/session references — **no** names in the pipeline design  
- Liveness, build id, consent epoch — **no** free-text payload  
- Rate limits and schema validation at the gateway  
- **No** GPS or rich telemetry in the default Phase 1 class without separate legal approval  

Observation logs may grow; **core sealed state must not** grow from those logs.

---

## 5. User trust approach

- **Honest baseline:** we avoid variable-reward “reality casinos”; rhythm and limits are part of the brand ethic.  
- **Ingress transparency:** terms and privacy references before deep product use where required.  
- **No fake social proof:** named research personas must not appear as “live users” in production UI.  
- **Predictability:** users should understand that the system **observes under rules**, not that it secretly runs them.

---

## 6. Operational responsibility

- Checklists (DNS, TLS, Firebase rules, ingress smoke) with human **READY / HOLD** sign-off.  
- Exportable run artifacts for activation readiness and violation harnesses (machine-readable summaries for ops, not marketing).  
- Founder alignment documents separate **culture** from **executable freeze** — expansion requires protocol, not ad-hoc patches.

---

## Closing line

We are not asking for trust because the demo is impressive. We are asking whether the **combination of phased activation, data minimization, non-interference rules, and operational checklists** matches what you expect before an infrastructure experiment gains broader exposure.

*Governance & safety notes v1.0 — May 2026*
