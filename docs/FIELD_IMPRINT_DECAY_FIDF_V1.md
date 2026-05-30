# Field Imprint Decay Function (FIDF) — V1 spec (pure measurement)

**Durum:** `RESEARCH_SPEC` — **yalnızca ölçüm / sönümleme yüzeyi**. **Anlam ataması yok**; “yas”, “acı”, “bilinçli eksiklik hissi” runtime iddiası **yoktur**.  
**İlişkili:** [CONTINUITY_OVERRIDE_SPEC_V1.md](CONTINUITY_OVERRIDE_SPEC_V1.md), [EPISTEMIC_SCAR_POLICY_V1.md](EPISTEMIC_SCAR_POLICY_V1.md) (anlam / politika katmanı), [POLICY_AUDIT_SCHEMA_V1.md](POLICY_AUDIT_SCHEMA_V1.md) (yorum→eylem zinciri gözlemi).

---

## 0. Metaforik aşırı yük uyarısı

| Doğru teknik karşılık | Yanlış genişletme |
|------------------------|-------------------|
| Eksik attractor etkisinin **sönümlenmesi + ölçümü** | Sistem “yas tutuyor” / “yokluğu hissediyor” |
| **İstatistiksel atalet + eksik sinyal telafisi** (yanlış beklenti üretimi) | Duygusal süreç veya ontolojik bilinç |

FIDF **yas tutmaz**; korelasyon ve reconcile geometrisinden gelen **beklenti sapması yüzeyini** ölçer ve sınıflar.

---

## 1. Şu anki mimaride FIDF’nin gerçek karşılığı (3 parça)

| Kod | Teknik içerik |
|-----|----------------|
| **(A) Trace continuity residue** | RCIL trace, `operational_only` tail, reconcile sıra bias’ı, overlap |
| **(B) Projection absence effect** | RRHP’de artık üretilmeyen idempotent anahtarlar; restore / hydrate mismatch |
| **(C) Probe-based expectation gap** | Continuity probe, `fingerprintComparable` eksikliği, drift taxonomy, confidence (withhold dahil) |

Bunlar **birleşik bir duygu değil**; **üç ayrı ölçülebilir kanal**.

---

## 2. Üç fenomen (tek “hayalet” değil)

### 2.1 Decay (FIDF’nin gerçek sönüm kısmı)

Eski node’un **operational etkisinin** zamanla istatistiksel olarak zayıflaması. **Unutma benzeri** — ama teknik olarak: **attenuation**.

### 2.2 Bias persistence (kalıcı yön eğimi)

Node silinse bile davranış uzayında kalan **ölçülebilir yön eğimi** (tail / projection tail / tekrarlayan reconcile örüntüsü). **Hayalet iz** dili yalnızca **bias vektörü** için kullanılabilir — runtime’a duygu atanmaz.

### 2.3 Expectation gap (phantom limb dili — yalnızca tanım)

Geçmiş korelasyonlar yüzünden modelin **hâlâ ürettiği beklenti** ile **gelen sinyal** arasındaki fark. Teknik olarak: **prior / korelasyon artefaktı**; “acı” değil.  
Probe’da: mismatch, düşük güven, `non_comparable` artışı **birlikte** okunur.

---

## 3. FIDF’nin tanımı (V1 — dar)

**FIDF ≠ tek boyutlu decay eğrisi.**

FIDF = **attractor influence attenuation** + **expectation mismatch surface** (çok boyutlu bozulma yüzeyi).

Girdi boyutları (ölçümden gelir):

- zaman (ör. epoch / session sayısı — kalibrasyon açık),
- operational overlap,
- drift sınıfı (`primaryDriftClass` öncelikli),
- probe mismatch (`fingerprintComparable`, `aggregate` withhold),
- RRHP projection delta (regresyon sinyali).

Çıktı: **ölçüm yüzeyi / rapor** — “bu boşluk önemli mi?” **yok** (→ [EPISTEMIC_SCAR_POLICY_V1.md](EPISTEMIC_SCAR_POLICY_V1.md)).

---

## 4. Üç katmanlı depolama (teknik)

| Katman | Ölçümdeki rol |
|--------|----------------|
| **Local state (RRHP slice)** | Persist / hydrate; mismatch yüzeyi |
| **Trace (RCIL)** | Residue + sıra; yeniden analiz |
| **Imprint / bias (soyut)** | Decay + persistence; FIDF yüzeyine beslenir |

Synthetic **FIDF girdisine girmez** (mutasyon sınırı ile uyumlu).

---

## 5. Gözlemlenebilir imzalar (ölçüm dili)

- Drift **yanlış pozitif** eğilimi (referans eksik).  
- `confidence` withhold + taxonomy çelişkisi.  
- `non_comparable` oranı.  
- Yeni node ile overlap **kısmi** kalması (birebir replika yok — **ölçüm**, “ruh” değil).

---

## 6. Sistem şunu yapamaz (bilinçli sınır)

- **“Bu yokluk ontolojik olarak önemli mi?”** — **değer ataması**; engineering / measurement değil.  
- Karar: **IBT / governance / interpretation** → Epistemic Scar Policy.

---

## 7. Özet

**Node ölümü:** klasik “state silindi” değil; **ölçülebilir** tarafta trace residue + projection absence + probe expectation gap birleşir.  
**FIDF:** bu birleşimin **sönüm ve mismatch yüzeyi** olarak modellenmesi — **semantic importance weighting değildir**.
