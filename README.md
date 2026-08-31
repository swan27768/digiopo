# DigiOpo – Minun polkuni

DigiOpo on peruskoulun oppilaanohjauksen digitaalinen oppimateriaali
7.–9.-luokkalaisille. Se kokoaa oppilaanohjauksen tehtävät, interaktiiviset
harjoitukset ja opettajan materiaalit yhteen selainpohjaiseen kokonaisuuteen,
joka toimii ilman asennuksia niin tietokoneella kuin mobiililaitteella.

Tuote on lisenssipohjainen: koulu tai kunta hankkii käyttöoikeuden, ja sisältö
on suojattu palvelinpuolisella maksumuurilla.

## Laajuus

- **89 sivua** oppimateriaalia luokka-asteittain (7., 8. ja 9. lk)
- **~20 interaktiivista tehtävää ja peliä** – mm. vahvuusmatka, tiedon temppeli,
  fake-insta, pakopeli, koulutusalatestit, yhteishakulaskuri
- **Opettajan materiaalit** jokaiseen osioon: ohjeet, tehtäväkortit, tulostettavat PDF:t
- **11 kieltä** (fi, sv, en, et, ru, ar, fa, so, sq, es, tr)
- **Opettajan hallintapaneeli**: opetusryhmät, koulukohtainen lukuvuosikalenteri,
  tehtävien järjestyksen muokkaus
- **Ylläpitäjän paneeli**: lisenssien hallinta, käyttöseuranta, virhelokit

## Teknologiat

Sivusto on rakennettu tarkoituksella kevyeksi: ei frontend-frameworkia, ei
build-vaihetta. HTML, CSS ja vanilla JavaScript tarjoillaan sellaisenaan.

| Osa | Toteutus |
|---|---|
| Hosting ja CDN | Vercel (staattiset tiedostot + serverless-funktiot) |
| Tietokanta | Supabase (PostgreSQL) |
| Palvelinlogiikka | 12 serverless-funktiota kansiossa `api/` |
| Maksumuuri | Vercel Edge Middleware + allekirjoitettu HttpOnly-eväste |
| Rate limit | Upstash Redis (jaettu serverless-instanssien yli) |
| Offline-tuki | Service worker (PWA) |
| Ajastetut työt | Vercel Cron + Supabase-funktiot |

**Turvaperiaate:** selain ei koskaan puhu suoraan Supabaseen. Kaikki tietokantaliikenne
kulkee palvelinfunktion kautta service_role-avaimella, ja tauluissa on RLS `using(false)`.
Opettaja-avaimet tallennetaan vain SHA-256-tiivisteinä.

## Rakenne

```
digiopo/
├── index.html              Etusivu
├── middleware.js           Maksumuuri (tarkistaa lisenssin ennen sisältöä)
├── vercel.json             Reititys, CSP-otsakkeet, cronit, välimuisti
├── sw.js                   Service worker
│
├── api/                    Serverless-funktiot
│   └── _lib/               Jaettu koodi: token, rate limit, virhelogi
├── sivut/                  Luokka-asteiden sivut ja osiot
├── tehtavat/               Yksittäiset tehtävät + opettajan ohjeet
├── pelit/                  Interaktiiviset pelit
├── js/, css/, images/      Skriptit, tyylit, WebP-kuvat
├── translations/           11 kielitiedostoa
├── supabase_*.sql          Tietokantaskeemat
└── docs/                   Tekninen dokumentaatio
```

## Käyttöönotto

Lyhyesti:

1. Luo Supabase-projekti ja aja `supabase_*.sql`-tiedostot oikeassa järjestyksessä
2. Luo Vercel-projekti ja kytke tämä repo siihen
3. Kopioi `.env.example` → `.env` ja täytä arvot; vie samat muuttujat Verceliin
4. Luo Upstash Redis -tietokanta rate limitiä varten

**Täydet ohjeet:** [`docs/`](docs/README.md)

### Paikallinen kehitys

```bash
npm install
npm run dev          # http://localhost:8000
```

macOS: `esikatselu.command` käynnistää saman kaksoisklikkauksella.
Julkaisu tuotantoon: `julkaise.command` (push GitHubiin → Vercel julkaisee).

## Dokumentaatio

Tekninen dokumentaatio on kansiossa [`docs/`](docs/README.md): käyttöönotto,
tietokannan ajojärjestys, arkkitehtuuri ja turvamalli, API-rajapinnat,
sisällön ylläpito ja tunnetut rajoitteet.

## Lisenssi ja oikeudet

© Olga Lenskaja. Kaikki oikeudet pidätetään.
Sisältö, koodi ja tavaramerkki ovat tekijän omaisuutta eikä niitä saa
kopioida tai levittää ilman kirjallista lupaa.
