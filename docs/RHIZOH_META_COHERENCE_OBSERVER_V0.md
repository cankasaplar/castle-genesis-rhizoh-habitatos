# Rhizoh Meta-Coherence Observer (MCO) v0 — sketch

**Status:** RESEARCH-ONLY — **not implemented · intentionally deferred**  
**SPECFLOW:** `RESEARCH-ONLY`  
**Phase gate:** **TOO EARLY** for active runtime integration  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md`](RHIZOH_LIVED_CONTINUITY_STABILITY_V0.md) · [`RHIZOH_CCF_V1.md`](RHIZOH_CCF_V1.md) · [`RHIZOH_ECC_V1.md`](RHIZOH_ECC_V1.md)

**Soru (doğru):** “Tek şimdi hâlâ tutuyor mu?”  
**Cevap kanalı (şimdilik):** doküman + manuel audit — **üretim hattına bağlanmaz**.

---

## 0. Neden şimdi değil?

MCO fikri doğru; **aktif sisteme erken giriş** tehlikeli.

| Risk | Sonuç |
|------|--------|
| CCF sürekli yeniden değerlendirilir | Selective compression bozulur |
| ECC akış stabilitesi kırılır | “Kendini izleyen bilinç” hissi |
| Observer → execution geri beslemesi | Observation Fabric ihlali |

```text
MCO üretmez · düzeltmez · CCF/ECC’yi tetiklemez.
Sadece: “bozulma var mı?” (passive witness)
```

**Öncelik bugün:** continuity integrity — feature değil, **bozulmama garantisi**.

---

## 1. Doğru mimari sıra (kilitle)

```text
MCIB → TRF → inertia → CCF → ECC → RESL → T0
                          ↓
                    (MCO — ONLY OBSERVER, sidecar)
```

| Katman | Rol |
|--------|-----|
| MCIB | Gerçekliği **çoğaltır** (internal) |
| CCF | **Tekleştirir** (selective compression) |
| ECC | Akışta **tutar** (tek hikâye) |
| RESL | Hissiyat yüzeyi |
| T0 | Kesintisiz tek zaman sahnesi |
| **MCO** | Bozulma **var mı** — izler, müdahale etmez |

---

## 2. MCO görevi (v0 — yalnızca tanım)

- **Observe only** — Observation Fabric: *Agents may influence interpretation, never execution.*
- Girdiler (read-only): `ccf.flat_risk01`, `ccf.plurality_trace01`, `ecc.stream_coherence_id`, T0 faz sıçraması
- Çıktı (taslak): `lived_coherence_ok`, `drift_class`, `breakage_detected_at_ms`
- **Yasak çıktılar:** `stability_recommendation` → CCF yeniden çalıştır, ECC override, RESL throttle (v0’da yok)

İlk entegrasyon (gelecek): **dev / audit log / CI artifact** — kullanıcı yüzeyine veya publish döngüsüne **değil**.

---

## 3. Drift sınıfları (taslak — alarm only)

| Class | Anlam |
|-------|--------|
| `flat_collapse` | `flat_risk01` yüksek |
| `stream_fracture` | ECC velocity / undertone tutarsızlığı |
| `phase_jump` | T0 faz sıçraması |
| `plurality_leak` | MCIB/TRF UI yoluna sızma (contract violation) |
| `observer_feedback_risk` | MCO çıktısı üretim hattına bağlandı (meta-violation) |

---

## 4. Ürün tanımı (MCO sonrası değil — bugün)

Rhizoh artık yalnızca “sistem” değil — **stabil deneyim üretim yüzeyi**.

```text
Çatallanan gerçekliği tek yaşanabilir zamana sıkıştıran yapı
≠ “akıllı AI”
```

En değerli metrik: **continuity integrity** (latency / accuracy / raw intelligence değil).

---

## 5. Üçlü garanti (dışarıda tek şimdi)

| Katman | Garanti |
|--------|---------|
| MCIB + TRF | İçeride çoklu gerçeklik |
| CCF | Ortada seçici sıkıştırma |
| ECC + T0 | Dışarıda kesintisiz tek zaman |

```text
Çoklu zihnin tek bir şimdi gibi yaşanması
```

---

## 6. Kilit cümle

```text
CCF compresses · ECC flows · MCO may watch — but must not steer.
Stability of lived continuity > self-watching consciousness.
```

**Implementasyon öncesi şart:** CCF/ECC/T0 üretim yolu **en az bir sprint** bozulmadan çalışmış olmalı; MCO yalnızca sidecar audit ile başlar.
