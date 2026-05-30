# DigiOpo – Julkaisusuunnitelma
**Versio 1.0 · Toukokuu 2026**

---

## Tiivistelmä

DigiOpo julkaistaan **lisensoituna SaaS-palveluna** kouluille. Tekniikka pidetään mahdollisimman yksinkertaisena: staattinen sivusto + serverless-funktiot. Ei tietokantaa oppilaille, ei kirjautumista, ei henkilötietoja.

---

## 1. Lisenssimalli

### Miten se toimii

Koulu tai opettaja ostaa **koululisenssin** – ei oppilaskohtaista kirjautumista. Lisenssi on **koulukohtainen pääsykoodi** (esim. `MÄYRÄLÄ-2026`), jonka opettaja jakaa oppilailleen.

**Oppilaan kokemus:**
1. Oppilas menee osoitteeseen `digiopo.fi`
2. Ensimmäisellä kerralla pyydetään koulun koodi
3. Koodi tarkistetaan palvelimelta → hyväksytty / hylätty / vanhentunut
4. Koodi tallennetaan selaimen `localStorage`-muistiin
5. Seuraavilla kerroilla sisään pääsee suoraan – ei toistuvaa kirjautumista

**Lisenssin tiedot:**
- Koululle luodaan uniikki koodi
- Koodilla on vanhenemispäivä (vuosi, tai testilisenssille 4–6 kk)
- Ei käyttäjämäärän rajoitusta (koulu voi antaa koodin kaikille oppilaille)

### Hintamalli (ehdotus)
| Lisenssi | Hinta | Kesto | Huomio |
|---|---|---|---|
| Testilisenssi | Ilmainen | 4–6 kk | Opettajan hakemus |
| Koululisenssi | ~150–300 €/v | 12 kk | Per koulu |
| Kuntalisenssi | Neuvoteltava | 12 kk | Useampi koulu |

---

## 2. Tekninen arkkitehtuuri

### Valittu stack

```
┌─────────────────────────────────────────────────────┐
│  Selain (oppilas)                                   │
│  HTML + CSS + JS + localStorage                     │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────────┐
│  Netlify (hosting + serverless-funktiot)             │
│                                                     │
│  ├── Staattiset tiedostot (HTML/CSS/JS/kuvat)       │
│  ├── /api/lisenssi   ← koodin tarkistus             │
│  └── /api/claude     ← AI-proxy (tuleva)            │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│  Supabase (lisenssitietokanta)                      │
│  Taulut: lisenssit (koodi, koulu, voimassa_asti)    │
└─────────────────────────────────────────────────────┘
```

### Miksi Netlify?
- Ilmainen taso riittää alkuvaiheessa
- Serverless-funktiot sisäänrakennettu (korvaa proxy.js)
- HTTPS automaattinen
- CDN globaalisti → nopea kouluissa
- Yksinkertainen `netlify.toml`-konfiguraatio tietoturvaotsikoille

### Miksi Supabase lisenssikannaksi?
- Ilmainen taso (500 MB, 50 000 riviä) riittää sadoille kouluille
- Ei henkilötietoja → GDPR-riski minimaalinen
- Row Level Security (RLS) suojaa tietokannan suoralta käytöltä
- REST API valmiina ilman erillistä backendia

---

## 3. Tietoturva

### Periaatteet koulukäytössä

**GDPR ja tietosuoja:**
- Oppilaat eivät rekisteröidy → ei henkilötietoja palvelimella
- Oppilaan vastaukset tallentuvat *vain* oppilaan omaan selaimeen (localStorage)
- Ei analytiikkaa joka seuraa yksilöitä
- Koululisenssin yhteystiedot (opettajan nimi, sähköposti) → käsittelyperusteena sopimus
- Tietosuojaseloste tarvitaan (koululisenssin ostajalle)

**Evästeet / localStorage:**
- localStorage ei ole eväste → ei vaadi cookie-banneria
- Suositus silti: lyhyt tietosuojailmoitus sivuston footerissa

### Tekninen tietoturva

**Staattiset sivut (ei serveripuolta → pieni hyökkäyspinta):**
- Ei SQL-injektiota (ei tietokantaa selainpuolella)
- Ei XSS-riskiä palvelimelta tulevan datan kautta
- Kaikki sisältö on kovakoodattu HTML:ään

**HTTP-tietoturvaotsikoita** (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self' https://*.supabase.co"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

**Lisenssikoodi-endpoint (`/api/lisenssi`):**
- Rate limiting: max 5 yritystä / IP / 10 min → brute force estetty
- Koodi-validointi palvelinpuolella (ei frontendissä)
- Koodit hashataan tietokannassa (bcrypt)
- Vastauksessa vain: `{ok: true, voimassa_asti: "2026-12-31"}` – ei muuta tietoa

**AI-proxy (`/api/claude`, tuleva):**
- Vaatii voimassa olevan lisenssin tarkistuksen ennen API-kutsua
- Rate limiting per koulu (ei yksittäinen oppilas kuormita APIa)
- Syötteiden sanitointi ennen Claude-kutusua

### Teen-hakkerointi: konkreettiset uhat ja vastatoimet

| Uhka | Riski | Vastatoimi |
|---|---|---|
| Koodin arvaaminen brute forcella | Kohtalainen | Rate limiting 5/10min per IP |
| Lisenssikoodi jaetaan somessa | Matala | Koodi toimii silti – koulun vastuulla |
| DevTools → localStorage-manipulointi | Matala | Palvelin validoi aina uudelleen (24h TTL) |
| XSS-injektio | Matala | CSP-otsikot estävät |
| API-kutsun kaappaus (Claude) | Matala | Proxy palvelimella, avain ei selaimessa |
| DDoS | Matala | Netlify/Cloudflare absorboi automaattisesti |
| Iframe-upottaminen muulle sivulle | Matala | `X-Frame-Options: DENY` |

**Tärkein periaate:** Koska sivusto on staattinen eikä siellä ole oppilaiden henkilötietoja, tietomurron seuraukset ovat minimaaliset. Pahimmassa tapauksessa joku pääsee lukemaan oppisisältöä ilmaiseksi.

---

## 4. Testilisenssit (4–6 kk)

### Prosessi

1. Opettaja täyttää **testilisenssilomakkeen** (Google Forms tai oma lomake)
   - Nimi, koulu, sähköposti, arvioitu oppilasmäärä
2. Koodi generoidaan automaattisesti tai manuaalisesti
3. Koodi lähetetään sähköpostilla opettajalle
4. Tietokantaan merkitään: `tyyppi: 'testi', voimassa_asti: +5kk`
5. Testijakson lopussa automaattinen muistutus → tarjous vuosilisenssin ostoon

### Tekninen toteutus (vaihe 1: manuaalinen)
Alkuvaiheessa lisenssit lisätään Supabase-tietokantaan käsin. Kun koulujen määrä kasvaa, rakennetaan hallintapaneeli.

---

## 5. Julkaisuvaiheet

### Vaihe 1 – Julkaisukelpoinen MVP (1–2 viikkoa)
- [ ] Netlify-hosting käyttöön
- [ ] `netlify.toml` tietoturvaotsikoilla
- [ ] Serverless-funktio `/api/lisenssi` (Supabase-yhteys)
- [ ] Pääsykoodilomake etusivulle (korvaa nykyinen suora pääsy)
- [ ] Ensimmäinen testilisenssi luotu

### Vaihe 2 – Testilisenssiohjelma (2–4 viikkoa julkaisun jälkeen)
- [ ] Testilisenssilomake (Google Forms)
- [ ] Sähköpostipohja lisenssikoodin toimittamiseen
- [ ] Tietosuojaseloste sivustolle
- [ ] Seurantaraportti testikouluille (manuaalinen aluksi)

### Vaihe 3 – Maksuliikenne (1–2 kk julkaisun jälkeen)
- [ ] Stripe-integraatio (tai lasku PDF:nä pienille kouluille)
- [ ] Automaattinen koodin generointi maksamisen jälkeen
- [ ] Uusimismuistutukset sähköpostilla

### Vaihe 4 – Skaalaus (myöhemmin)
- [ ] Hallintapaneeli lisensseille
- [ ] Claude AI -integraatio (proxy.js → Netlify Function)
- [ ] Opettajan näkymä oppilaan edistymiseen (vaatii backend-laajennuksen)

---

## 6. Avoimet päätökset

Ennen toteutuksen aloittamista tarvitaan päätös seuraaviin:

1. **Koodi vai URL?** Haluatko oppilaan syöttävän koodin lomakkeella, vai riittääkö koululle uniikki URL (esim. `digiopo.fi/m/MÄYRÄLÄ-2026`)? URL on yksinkertaisempi mutta helpompi jakaa.

2. **Koodin TTL?** Kuinka usein selain tarkistaa palvelimelta, onko lisenssi yhä voimassa? Ehdotus: 24 h.

3. **Mitä tapahtuu kokeen umpeutuessa?** Lukittuuko koko sivusto, vai pääseekö selaamaan mutta ei tallentamaan?

4. **Maksutapa?** Stripe (verkkomaksu), lasku PDF (perinteiset koulut), vai molemmat?

5. **Domaini?** `digiopo.fi` – onko se jo hankittu?
