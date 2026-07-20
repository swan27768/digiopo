# 01 – Yleiskuvaus

## Mikä DigiOpo on

Peruskoulun oppilaanohjauksen digitaalinen oppimateriaali 7.–9.-luokkalaisille.
Se kokoaa oppilaanohjauksen tehtävät, interaktiiviset harjoitukset ja opettajan
materiaalit yhteen selainpohjaiseen kokonaisuuteen, joka toimii ilman
asennuksia sekä tietokoneella että mobiililaitteella.

Tuote on lisenssipohjainen: koulu tai kunta hankkii käyttöoikeuden, ja sisältö
on suojattu palvelinpuolisella maksumuurilla.

Tuotanto: **app.digiopo.fi** · Markkinointi ja tilaukset: **digiopo.fi**

---

## Laajuus

| | Määrä |
|---|---|
| HTML-sivuja | 89 |
| Luokka-asteen osiosivuja | 17 |
| Tehtäväsivuja | 28 |
| Interaktiivisia pelejä | 17 |
| Opettajan materiaalisivuja | 6 |
| Kieliä | 11 |
| Palvelinfunktioita | 12 |
| Tietokantatauluja | 17 (+ 6 näkymää) |
| Kuvia | 82 |

Projekti aloitettiin maaliskuussa 2026, ja siihen on kertynyt 475 committia.

---

## Ketkä käyttävät

**Oppilas** kirjautuu koulun jaetulla koodilla ja tekee tehtäviä. Osa
tehtävistä on yksilötyötä, osa ryhmätöitä joissa työt tulevat luokan yhteiselle
taululle opettajan hyväksynnän jälkeen.

**Opettaja** kirjautuu omalla sähköpostillaan. Hän voi järjestää osiot
haluamaansa järjestykseen, ylläpitää koulun lukuvuosikalenteria ja moderoida
oppilaiden töitä. Opettaja luo opetusryhmän ja jakaa oppilaille ryhmäkoodin.

**Ylläpitäjä** hallinnoi lisenssejä, seuraa käyttöä ja virheitä
hallintapaneelista.

---

## Teknologiavalinnat ja perustelut

Sivusto on rakennettu tarkoituksella kevyeksi: **ei frontend-frameworkia, ei
build-vaihetta.** HTML, CSS ja vanilla JavaScript tarjoillaan sellaisenaan.

| Osa | Toteutus | Miksi |
|---|---|---|
| Hosting | Vercel | Staattiset tiedostot ja serverless-funktiot samassa, julkaisu git-pushista |
| Tietokanta | Supabase (PostgreSQL) | Valmis autentikointi, REST-rajapinta, pg_cron |
| Maksumuuri | Vercel Edge Middleware | Ajetaan ennen tiedoston tarjoilua – selain ei voi ohittaa |
| Istunto | HMAC-allekirjoitettu eväste | Ei ulkoista JWT-kirjastoa, toimii Node- ja Edge-ympäristössä |
| Rate limit | Upstash Redis | Jaettu serverless-instanssien kesken |
| Offline | Service worker (PWA) | Toimii koulun heikolla verkolla |
| Käännökset | JSON + `data-i18n` | Ei käännöskirjastoa, ei build-vaihetta |

Kevyt lähestymistapa on perusteltu kohdeympäristöllä. Koulun verkossa koko
luokka lataa saman sivun yhtä aikaa jaetulla kaistalla, laitteet ovat usein
vanhoja, eikä selaimia voi olettaa uusimmiksi. Ilman build-vaihetta myös
sisällön muokkaus on suoraviivaista: tiedosto auki, muutos, julkaisu.

---

## Turvamalli lyhyesti

Kaksi periaatetta, joita ei saa rikkoa:

**Selain ei koskaan puhu suoraan Supabaseen.** Kaikki kulkee palvelinfunktion
kautta `service_role`-avaimella, ja tauluissa on RLS-käytäntö `using(false)`.

**Pääsy ratkaistaan palvelimella.** Maksumuuri on Edge Middleware, joka ajetaan
ennen kuin tiedostoa tarjoillaan. Selaimen JavaScript ei voi ohittaa sitä.

Yksityiskohdat: [04 – Arkkitehtuuri ja turvamalli](04-arkkitehtuuri.md).

---

## Kaksi projektia

| Repo | Domain | Sisältö |
|---|---|---|
| `digiopo` | app.digiopo.fi | Oppimateriaali, maksumuuri, opettajan toiminnot |
| `digiopo-home` | digiopo.fi | Markkinointisivut, tilauslomake, hallintapaneeli |

⚠️ **Molemmat kirjoittavat samaan `lisenssit`-tauluun.** Kannan rajoitteita
muutettaessa on tarkistettava kumpikin. Ks.
[10 – Rajoitteet](10-rajoitteet.md).

---

## Kansiorakenne

```
digiopo/
├── index.html              Etusivu
├── middleware.js           Maksumuuri
├── vercel.json             Reititys, CSP, cronit, välimuisti
├── sw.js                   Service worker
├── dev-server.cjs          Paikallinen kehityspalvelin
│
├── api/                    12 serverless-funktiota
│   └── _lib/               token, rate limit, turva, virhelogi, opettaja
├── sivut/                  Luokka-asteiden osiosivut
├── tehtavat/               Tehtäväsivut ja opettajan ohjeet
├── pelit/                  Interaktiiviset pelit
├── js/                     Skriptit, osiodata, käännöslogiikka
├── css/                    Tyylit
├── images/                 WebP-kuvat
├── translations/           11 kielitiedostoa
├── supabase_*.sql          Tietokantaskeemat
└── docs/                   Tämä dokumentaatio
```

---

## Mistä aloittaa lukeminen

**Jos pystytät projektin tyhjästä:**
[02 – Käyttöönotto](02-kayttoonotto.md) → [03 – Tietokanta](03-tietokanta.md)

**Jos aiot muuttaa koodia:**
[04 – Arkkitehtuuri](04-arkkitehtuuri.md) → [05 – API](05-api.md) →
[10 – Rajoitteet](10-rajoitteet.md)

**Jos ylläpidät sisältöä:**
[07 – Sisällön ylläpito](07-sisallon-yllapito.md) →
[08 – Julkaisu](08-julkaisu.md)

**Jos hoidat asiakkaita ja lisenssejä:**
[06 – Lisenssit](06-lisenssit.md) → [09 – Ylläpito](09-yllapito.md)

**Jos arvioit projektia ostamista varten:**
Tämä osio → [10 – Rajoitteet](10-rajoitteet.md) →
[04 – Arkkitehtuuri](04-arkkitehtuuri.md)

Osio 10 kannattaa lukea aikaisin. Se kertoo suoraan mitä järjestelmä ei tee,
missä sen rajat kulkevat ja mitkä ratkaisut näyttävät virheiltä mutta ovat
tietoisia valintoja.
