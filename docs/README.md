# DigiOpo – tekninen dokumentaatio

Tämä kansio sisältää DigiOpon teknisen dokumentaation. Tavoite on, että
projektin saa käyntiin ja sitä pystyy ylläpitämään ilman alkuperäisen
tekijän apua.

**Lukijaksi oletetaan** kehittäjä, joka osaa JavaScriptiä ja SQL:ää mutta
ei tunne tätä projektia lainkaan.

---

## Sisällysluettelo

| # | Dokumentti | Sisältö | Tila |
|---|---|---|---|
| 01 | [Yleiskuvaus](01-yleiskuvaus.md) | Mikä DigiOpo on, kenelle, mistä osista koostuu | ⬜ |
| 02 | [Käyttöönotto](02-kayttoonotto.md) | Ympäristömuuttujat, Vercel-pystytys, domain | ✅ |
| 03 | [Tietokanta](03-tietokanta.md) | Supabase, taulut, SQL-tiedostojen ajojärjestys | ✅ |
| 04 | [Arkkitehtuuri ja turvamalli](04-arkkitehtuuri.md) | Maksumuuri, middleware, service_role-periaate | ✅ |
| 05 | [API-rajapinnat](05-api.md) | 12 palvelinfunktiota, parametrit, vastaukset | ✅ |
| 06 | [Lisenssien hallinta](06-lisenssit.md) | Koodit, voimassaolo, laiteseuranta, ylikäyttö | ✅ |
| 07 | [Sisällön ylläpito](07-sisallon-yllapito.md) | Uusi tehtävä, käännösavaimet, kuvat | ✅ |
| 08 | [Julkaisu ja välimuisti](08-julkaisu.md) | Deploy, service worker, cache-versiointi | ⬜ |
| 09 | [Ylläpitorutiinit](09-yllapito.md) | Cronit, siivoukset, virhelokit, seuranta | ⬜ |
| 10 | [Tunnetut rajoitteet](10-rajoitteet.md) | Rate limitit, Vercel Hobby, keskeneräiset asiat | ⬜ |

⬜ = kesken · ✅ = valmis

---

## Mitä kuhunkin osioon tulee

### 01 – Yleiskuvaus
Kohderyhmä (7.–9. lk oppilaanohjaus), laajuus (89 HTML-sivua, ~20
interaktiivista tehtävää, 11 kieltä), teknologiavalinnat ja perustelut:
staattinen sivusto ilman frameworkia, Vercel-hosting, Supabase-tietokanta.
Kansiorakenteen selitys.

### 02 – Käyttöönotto
Kaikki `.env.example`-tiedoston muuttujat selitettynä: mihin kutakin
tarvitaan, mistä arvo hankitaan ja mitä tapahtuu jos se puuttuu.
Erityisesti `LISENSSI_JWT_SECRET` — sen puuttuminen sammuttaa maksumuurin
(fail-open, tarkoituksellinen turvaventtiili).
Vercel-projektin luonti, ympäristömuuttujien vienti, domainin kytkentä,
Upstash Redis -tietokannan luonti.

### 03 – Tietokanta
Numeroitu ajojärjestys 18 SQL-tiedostolle. Riippuvuudet ovat todellisia:

- `supabase_jarjestys.sql` luo `opetusryhmat`-taulun
- `supabase_lukuvuosi_aikataulu.sql` viittaa siihen → **ajettava jälkeen**
- `supabase_tykkays_dedupe.sql` viittaa tauluihin `maailma_ratkaisut` ja
  `fake_insta_profiilit` → **ajettava niiden jälkeen**

Lisäksi taulukohtainen kuvaus ja RLS-periaate (`using(false)` — mihinkään
tauluun ei pääse suoraan selaimesta).

### 04 – Arkkitehtuuri ja turvamalli
Tämä on dokumentaation turvakriittisin osa. Kaksi periaatetta, joita ei saa
rikkoa:

1. **Selain ei koskaan puhu suoraan Supabaseen.** Kaikki kulkee
   palvelinfunktion kautta service_role-avaimella.
2. **Hallintaoikeus todetaan allekirjoitetusta evästeestä.** Opettajan
   sähköpostia verrataan ryhmän `omistaja_email`-kenttään
   (`api/_lib/opettaja.js`). Aiempi PIN-pohjainen malli (`avain_hash`,
   SHA-256) on poistettu heinäkuussa 2026 – ks. `supabase_poista_pin.sql`.

Maksumuurin kulku: lisenssikoodi → `api/lisenssi.js` → allekirjoitettu token
→ HttpOnly-eväste `digiopo_lisenssi` → `middleware.js` tarkistaa ennen kuin
suojattu sisältö tarjoillaan. Suojatut polut on lueteltu middlewaren
`config.matcher`-listassa. Sivupyynnöt ohjataan `liity.html`-portille,
data-pyynnöt estetään 401:llä.

### 05 – API-rajapinnat
Kansiossa `api/` on 12 funktiota ja `api/_lib/`-jaettu koodi
(`token.js`, `rate.js`, `turva.js`, `virhelogi.js`, `opettaja.js`).
Kustakin: mitä tekee, mitä parametreja ottaa, mitä palauttaa, vaatiiko
lisenssin tai opettaja-avaimen, mikä rate limit on voimassa.

### 06 – Lisenssijärjestelmä
Lisenssikoodien luonti ja hallinta admin-paneelista, koodikohtainen
laitelaskenta (`lisenssi_laitteet`), kirjausloki (`lisenssi_kirjaukset`)
ja ylikäyttöhälytys, joka ajetaan `tarkista-kirjaukset`-cronin yhteydessä.

### 07 – Sisällön ylläpito
Miten lisätään uusi tehtävä: HTML-sivu, merkintä
`js/osio-data-Xlk.js`-tiedostoon, käännösavaimet `translations/*.json`
(11 kieltä), kuvat WebP-muodossa — **ei base64**, koska se paisuttaa
HTML:n ja rikkoo välimuistin.

### 08 – Julkaisu ja välimuisti
Deploy-prosessi (`julkaise.command`), paikallinen esikatselu
(`esikatselu.command`, `dev-server.cjs`).

⚠️ **Kriittinen askel:** service workerin (`sw.js`) cache-versio on
nostettava jokaisen sisältöpäivityksen yhteydessä. Jos se unohtuu,
käyttäjille jää vanha versio näkyviin eikä korjaus näy kentällä.

`vercel.json` määrittää lisäksi CSP-otsakkeet ja
stale-while-revalidate-välimuistin osio-datatiedostoille.

### 09 – Ylläpitorutiinit
Kaksi Vercel-cronia: `/api/tarkista-kirjaukset` klo 6 ja
`/api/tarkista-virheet` klo 7 päivittäin. Supabasen puolella
`digiopo_siivoa` ja `digiopo_suursiivous`. Virhelokien luku
admin-paneelista ja mitä hälytyksille tehdään.

### 10 – Tunnetut rajoitteet
Rate limitit ja koulujen NAT-ongelma (koko koulu näkyy yhtenä IP-osoitteena
— ratkaistu, mutta syy on ymmärrettävä ennen kuin rajoja säätää).
Vercel Hobby -tilin **12 funktion katto**, joka on jo täynnä: uusi
API-endpoint vaatii joko olemassa olevan yhdistämistä tai Pro-tilausta.
Cold start -käyttäytyminen.

---

## Korjattu 19.7.2026

Dokumentointia aloitettaessa löytyi viisi epäjohdonmukaisuutta. Kaikki on
korjattu:

1. ✅ **`package.json`** – nimi oli `digiopo-proxy`, kuvaus puhui Claude API
   -välityspalvelimesta ja `main`/`start` osoittivat olemattomaan
   `proxy.js`-tiedostoon. Korjattu vastaamaan projektia; `npm run dev`
   säilyi ennallaan.
2. ✅ **`.env.example`** – viittasi tiedostoon `middleware.mjs`. Oikea nimi
   on `middleware.js` (Vercel tunnistaa middlewaren vain `.js`/`.ts`-päätteellä).
3. ✅ **`supabase_KAIKKI_uudet_29-6.sql`** – todettiin täysin päällekkäiseksi
   modulaaristen tiedostojen kanssa (rivivertailu: ei yhtään riviä vain tässä
   tiedostossa). Merkitty historialliseksi koostetiedostoksi selkeällä
   otsikolla, joka ohjaa käyttämään modulaarisia tiedostoja. Voidaan poistaa,
   kun `03-tietokanta.md` on valmis.
4. ✅ **`.env.example`** – sisälsi oikeat `VERCEL_PROJECT_ID`- ja
   `VERCEL_TEAM_ID`-arvot. Vaihdettu paikkamerkeiksi.
5. ✅ **`README.md` (juuressa)** – kuvasi projektin localStorage-pohjaisena
   staattisena sivustona mainitsematta Supabasea, lisenssejä, maksumuuria tai
   API-funktioita. Kirjoitettu uusiksi.

6. ✅ **Claude-välityspalvelin poistettu.** `dev-server.cjs` sisälsi toimivan
   `/v1/messages`-välityksen Anthropicin rajapintaan (`ANTHROPIC_API_KEY`).
   Tarkistuksessa selvisi, ettei mikään sivustolla kutsunut sitä eikä
   tuotannossa ollut vastaavaa funktiota — jäänne samasta vaiheesta kuin
   `proxy.js`. Poistettu: `https`-moduulin require, `API_KEY`-vakio,
   `/v1/messages`-käsittelijä, käynnistysbannerin tekoälyrivi,
   `.env.example`-merkintä sekä `https://api.anthropic.com`
   `vercel.json`:n CSP:n `connect-src`-listasta.

7. ✅ **Service worker ei enää rekisteröidy localhostissa**
   (`js/lisenssiportti.js`). Aiemmin sama SW pyöri paikallisessa
   kehityksessä kuin tuotannossa, sieppasi pyynnöt ja tarjoili vanhaa
   välimuistisisältöä — tai näytti `Ei verkkoyhteyttä eikä välimuistia`,
   jos dev-server ei ollut käynnissä. Nyt localhostissa rekisteröinti
   ohitetaan ja aiempi rekisteröinti poistetaan.

   ⚠️ **Rajoitus:** automaattinen poisto toimii vain, jos selain saa
   `lisenssiportti.js`-tiedoston uutena. Jos vanha SW on jo asennettu, se
   tarjoilee tiedoston omasta välimuististaan (`PRECACHE_ASSETS` sisältää
   sen), jolloin uusi koodi ei pääse ajoon lainkaan. Tällaisella koneella
   SW on poistettava kerran käsin: DevTools → Application → Service Workers
   → Unregister, ja Storage → Clear site data.

8. ✅ **`sw.js`:n `CACHE_VERSION` nostettu `digiopo-v10` → `digiopo-v11`.**
   Pakollinen, koska kohdan 7 muutos osuu esiladattuun tiedostoon: ilman
   versionostoa käyttäjien selaimet tarjoilisivat vanhaa `lisenssiportti.js`
   -tiedostoa välimuistista eikä korjaus näkyisi kentällä. Aktivointikäsittelijä
   poistaa nyt `digiopo-v10-*`-välimuistit automaattisesti. Versionumeron
   yhteyteen lisätty muistutuskommentti.

**Testattu poiston jälkeen:** `node --check` läpi, palvelin käynnistyy,
etusivu ja luokkasivujen rewritet vastaavat 200:lla, `/api/lisenssi` toimii,
`/v1/messages` vastaa odotetusti 404:llä.

---

## Avoimet korjaukset

Löydetty, ei vielä korjattu:

1. **Favicon- ja manifest-linkitys puuttuu 18 sivulta.** Sivustolla on
   `favicon.svg` ja `manifest.json`, mutta kaikki sivut eivät linkitä niitä.
   Seuraus: selaimen välilehdessä ei näy tunnusta, eikä PWA-asennuskehote
   laukea kyseisiltä sivuilta.

   Korjattu 19.7.2026: `index.html`, `liity.html` (lisenssiportti) ja
   `kirjaudu.html` — eli sivuston sisäänkäynnit.

   Jäljellä 18 sivua, kaikki sisäsivuja joihin päädytään navigoimalla:
   `aikataulu_ope.html`, `fake-insta.html`, 10 sivua `pelit/`-kansiossa,
   `sivut/lukuvuosi.html`, `sivut/startti-tetiin.html` ja kolme sivua
   `tehtavat/`-kansiossa. Korjataan kun noihin tiedostoihin muutenkin
   kosketaan.

   **Huom polku:** juuritason sivuilla `href="favicon.svg"`, alikansioiden
   sivuilla `href="../favicon.svg"`. Ei siis korjattavissa yhdellä
   hae-korvaa-ajolla.

2. **Konsolin 404 paikallisessa kehityksessä: `/_vercel/insights/script.js`.**
   Ei virhe — Vercelin kävijäseuranta tarjoillaan vasta tuotannossa. Skripti on
   `defer`-merkitty eikä puuttuminen vaikuta toimintaan. Esiintyy 81 sivulla.
   Mainittava käyttöönotto-ohjeessa, ettei kukaan lähde jäljittämään sitä.
