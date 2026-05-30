# Epistemic Scar Policy — V1 (meaning assignment layer)

**Durum:** `GOVERNANCE_OPEN` — **anlam ataması** ve “hangi yokluk / hangi hayalet iz önemli?” sorusu. **Runtime motoru değildir**; RCIL/RRHP/probe **altına gömülmez**.  
**İlişkili ölçüm:** [FIELD_IMPRINT_DECAY_FIDF_V1.md](FIELD_IMPRINT_DECAY_FIDF_V1.md) (saf ölçüm), [CONTINUITY_OVERRIDE_SPEC_V1.md](CONTINUITY_OVERRIDE_SPEC_V1.md) (müdahale yetkisi önerisi), [POLICY_AUDIT_SCHEMA_V1.md](POLICY_AUDIT_SCHEMA_V1.md) (yorum→eylem gözlemi).

---

## 1. FIDF ile ayrım (kritik)

| Katman | Soru | Kim cevaplar |
|--------|------|----------------|
| **FIDF** | Etki sönüyor mu, mismatch yüzeyi nerede, hangi sinyal eksik? | Ölçüm + rapor |
| **Epistemic Scar Policy** | Bu boşluk **ignore** edilebilir mi, **davranışı değiştirmeli** mi, **insan kapısı** şart mı? | IBT / governance / interpretation |

**“Epistemik yas”** veya benzeri dil burada **politika / metafor** olarak kalabilir; **koda duygu atanmaz**.

---

## 2. Politika girdileri (öneri)

FIDF ve probe çıktıları **girdi**dir; tek başına yeterli değildir:

- `driftClasses`, `primaryDriftClass`, `confidence` (contributions + withhold),
- ürün / güven / yasal sınıflar (harici),
- insan onayı gereksinimi (`CONTINUITY_OVERRIDE` modları).

---

## 3. Çıktı (V1 — soyut)

- **Scar significance** (örn. `low` | `medium` | `high`) — **tanım OPEN**; sayısal kalibrasyon yok.  
- **Recommended posture:** `observe` | `reweight` | `force_break` | `human_gate` — yalnız **öneri**; yürütme ayrı süreç.

---

## 4. Governance guardrails — policy-to-action distance

### 4.1 Risk: yorum gücü → fiili kontrol

Scar Policy zamanla **öneri → implicit default → fiili davranış normu** zincirine kayabilir (**governance drift**). Bu, teknik bug değil; **yetki sızıntısı** riskidir.

### 4.2 Zorunlu ilkeler (V1)

1. **No direct execution bridge** — Scar çıktısı RCIL ingest, RRHP `setDoc`, probe mantığını override etme veya frozen runtime **doğrudan** tetikleyemez. Eylem için **ayrı yürütme hattı** + açık onay (insan / ürün / güvenlik süreci) zorunlu.
2. **Policy-to-action distance** — “Yüksek significance” veya `force_break` posture için minimum zincir: **öneri (dokümante)** → **onay** (tek kişi değilse çift göz / change ticket) → **versiyonlu runbook** → **(isteğe bağlı) kod**. Öneri tek başına **state değiştirmez**.
3. **No implicit default** — Dashboard / otomasyon Scar çıktısını **sessiz varsayılan eylem** veya **auto-apply** olarak kullanamaz; her uygulama **açık seçim + audit log** (hangi policy sürümü, kim onayladı).
4. **Version pinning** — Uygulama anında kullanılan politika **sürümü / hash** denetim kaydında durur; “hangi metin karar verdi?” sorusu geriye dönük cevaplanabilir olmalı.
5. **Reversibility review** — Scar önerileri için periyodik “hâlâ geçerli mi?” incelemesi; isteğe bağlı **TTL / sunset** (OPEN — sayı yok).

### 4.3 İleride (OPEN)

- Öneri → eylem arası **adım sayısı / gecikme** metrikleri (yalnız gözlem; hedef: distance’ın kısalmadığını doğrulamak). **Somut kontrat:** [POLICY_AUDIT_SCHEMA_V1.md](POLICY_AUDIT_SCHEMA_V1.md) + [schemas/policy-audit-v1.schema.json](schemas/policy-audit-v1.schema.json). **Passive / Delayed / Active:** aynı belgede §7; **geri bakış ≠ geri besleme**, soft friction, **sessiz baskılama**, **görünürlük bütçesi**, **visibility drift**, **yorum ayrışması**, **ayrışmanın zamanda karakteri**, **düğümler arası iz**, **yankı sönümü (ERDL)**, **CIEM**, **MOGB**, **ORCI** ve **ECPI** (aksiyomlar + **§8.15.6**–**§8.15.10**: …, C-CEASM, **REAMLF**, **MCCB** §8.15.10.4, **OSRIB** §8.15.10.5, **EODE** §8.15.10.7, **EITG** §8.15.10.8 (EOL: bağımsız eksen **hatırlatması**); **§8.15.10.9** belge sınırı) §8 (§8.5–8.15); **§8.15.11+ yok**, **§8.16+ yok**.

---

## 5. Sınır

- Bu dosya **distributed identity**, **IBT binding kanıtı** veya **bilinç** iddiası taşımaz.  
- Frozen core (v562–v570) ile **doğrudan** bağlanmaz.

---

## 6. Özet

**Ölümün ne ölçüldüğü** = FIDF + probe.  
**Ölümün ne ifade ettiği** = Epistemic Scar Policy (açık governance katmanı — V1 iskelet).  
**Scar’ın gücü** = öneri ve anlam; **fiili kontrol** ancak guardrail’li yürütme hattı ile bağlanır.
