# Controlled Exposure Framework v1.0

**Status:** FROZEN — operational intent (non-executable)  
**Phase:** Pre–Counsel OK · Legal MVP · static deploy allowed · activation OFF

---

## 1. Core distinction

| | |
|-|-|
| **Tam hukuki garanti** | Kurumsal audit, özel DPA/SCC zinciri, enterprise compliance ops |
| **Kontrollü düşük riskli yayın** | Minimum viable compliance + bounded exposure |

**Şu anki hedef ikincisidir.** Legal perfection değil; **controlled exposure**.

Erken aşama ürünler çoğu zaman böyle ilerler. Fark: önce sistemi açıp sonra sınır düşünmek değil; **önce sınır, sonra açma**.

---

## 2. Şu an elde olan (Legal MVP)

| Katman | Durum |
|--------|--------|
| Legal yüzey + entity SSOT | ✔ |
| Consent (ayrı checkbox’lar) | ✔ |
| AI disclaimer (otorite değil) | ✔ |
| Yurtdışı aktarım farkındalığı | ✔ |
| Cookie gate (analytics kapalı) | ✔ |
| Activation / phase gate | ✔ |
| Ingress kontrollü | ✔ |
| Data-plane inert | ✔ |

Bu yapı **“hiç düşünülmemiş riskli launch”** kategorisinden uzaktır.  
Aynı anda **kurumsal tam legal audit** de değildir — ve bu faz için **normaldir**.

---

## 3. Freeze edilmiş gerçekçi hedef

- ✔ Static deploy  
- ✔ Legal gate  
- ✔ Consent collection  
- ✔ Cookie control  
- ✔ AI disclaimer  
- ✔ Beta / deneysel çerçeve (“erken erişim / deneysel teknoloji platformu”)  
- ✔ Activation OFF  
- ✔ Ingestion OFF  
- ✔ Controlled rollout  

**Deployment ≠ activation.**

---

## 4. Compliance yol haritası

| Aşama | Hedef |
|-------|--------|
| **Şimdi** | Minimum viable compliance |
| **Sonraki** | Counsel refinement (PRIMARY PDF → yazılı OK) |
| **Daha sonra** | Full compliance / enterprise hardening |

---

## 5. Asıl riskler (teknik değil)

- Aceleyle **live coupling** açmak  
- AI’yı **otorite** gibi göstermek  
- Sistemin olduğundan **daha tamamlanmış** görünmesi  

Bunlar bilinçli olarak engellenmiştir. Mimari karşılık: **bounded, gated, reversible, causally isolated**.

---

## 6. Operasyonel sıra (teori değil, küçük adımlar)

1. Legal MVP pack freeze  
2. Static deploy  
3. Consent + cookie doğrulama  
4. Passive staging smoke  
5. Counsel feedback → incremental refinement  
6. **En son** signal thaw  

**Counsel OK** = yasal izin mührü; sistem event değil. Bkz. [`COUNSEL_OK_DEFINITION_V1.0.md`](../legal/COUNSEL_OK_DEFINITION_V1.0.md).

---

## 7. İlgili belgeler

| Belge | Rol |
|-------|-----|
| [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](../RHIZOH_HONEST_BASELINE_CHARTER_V1.md) | Kültür / dürüst zemin |
| [`COUNSEL_PASS_CHECKLIST_V1.0.md`](../legal/COUNSEL_PASS_CHECKLIST_V1.0.md) | Avukat gönderimi |
| [`ACTIVATION_READY_HOLD_DECISION_V1.0.md`](ACTIVATION_READY_HOLD_DECISION_V1.0.md) | READY / HOLD |
| [`RHIZOH_LEGAL_INGRESS_FREEZE_V1.0.md`](../legal/RHIZOH_LEGAL_INGRESS_FREEZE_V1.0.md) | Ingress + katman ayrımı |
| [`GLOBAL_LAUNCH_RISK_AUDIT_FRAMEWORK_V1.0.md`](GLOBAL_LAUNCH_RISK_AUDIT_FRAMEWORK_V1.0.md) | Tam ölçek öncesi çerçeve |
| [`GLOBAL_LAUNCH_RISK_AUDIT_MATRIX_V1.0.md`](GLOBAL_LAUNCH_RISK_AUDIT_MATRIX_V1.0.md) | DONE/PARTIAL/MISSING repo matrisi |
| [`OPERATIONAL_HARDENING_PROGRAM_V1.0.md`](OPERATIONAL_HARDENING_PROGRAM_V1.0.md) | Counsel paralel ops omurga |
| [`SYNTHETIC_CRISIS_WEEK_V1.0.md`](SYNTHETIC_CRISIS_WEEK_V1.0.md) | Cognitive Infrastructure Stress Testing |
| [`OPERATIONAL_TRUST_AND_READINESS_V1.0.md`](OPERATIONAL_TRUST_AND_READINESS_V1.0.md) | Trust score vs global readiness |

---

*Controlled exposure v1.0 — May 2026.*
