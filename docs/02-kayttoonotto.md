# 02 – Käyttöönotto

Miten DigiOpo pystytetään tyhjästä toimivaksi. Lopputulos: julkinen sivusto,
jossa lisenssimuuri, tietokanta ja ajastetut tarkistukset toimivat.

Tietokannan taulut ja SQL-tiedostojen ajojärjestys ovat omassa osiossaan:
[03 – Tietokanta](03-tietokanta.md).

---

## 1. Mitä tarvitset

| | Mihin | Pakollinen |
|---|---|---|
| GitHub-tili | Koodin säilytys, Vercelin lähde | Kyllä |
| Vercel-tili | Hosting, serverless-funktiot, cronit | Kyllä |
| Supabase-tili | PostgreSQL-tietokanta | Kyllä |
| Upstash-tili | Redis rate limitiä varten | Käytännössä kyllä |
| Resend-tili | Hälytyssähköpostit | Ei |
| Node.js 24.x | Paikallinen kehitys | Vain kehityksessä |

Ilmaiset tasot riittävät kaikkiin paitsi Verceliin, jonka rajoihin palataan
kohdassa 8.

---

## 2. Ympäristömuuttujat

Tämä on käyttöönoton tärkein taulukko. Muuttujat asetetaan **Vercelin
projektiasetuksiin**: Settings → Environment Variables. Tiedosto `.env.example`
on dokumentaatio, ei asetustiedosto — mikään tuotannossa ei lue sitä.

### Pakolliset

| Muuttuja | Mihin | Jos puuttuu |
|---|---|---|
| `SUPABASE_URL` | Kaikki 12 API-funktiota | Mikään palvelinpuolen toiminto ei toimi |
| `SUPABASE_SERVICE_KEY` | Sama | Sama |
| `LISENSSI_JWT_SECRET` | Maksumuuri: `middleware.js`, `api/lisenssi.js`, `api/_lib/opettaja.js` | **Maksumuuri on pois päältä** – sisältö on julkista |
| `ADMIN_DASHBOARD_KEY` | `api/admin-tilastot.js`, `admin-viesti.js`, `jarjestys.js` | Hallintapaneeliin ei pääse |

`LISENSSI_JWT_SECRET` ja `ADMIN_DASHBOARD_KEY` keksitään itse. Riittävän pitkä
satunnainen merkkijono:

```bash
openssl rand -hex 32
```

### Vahvasti suositellut

| Muuttuja | Mihin | Jos puuttuu |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Rate limit (`api/_lib/rate.js`) | Rajat lasketaan instanssikohtaisesti muistissa ja nollautuvat cold startissa – eivät päde piikissä |
| `UPSTASH_REDIS_REST_TOKEN` | Sama | Sama |
| `CRON_SECRET` | Cron-endpointtien suojaus | **Endpointit ovat suojaamattomia** – kuka tahansa voi kutsua niitä |

`CRON_SECRET` toimii fail-open-periaatteella: koodi tarkistaa avaimen vain jos
se on asetettu (`api/tarkista-kirjaukset.js:138`). Käytännön riski on pieni,
koska funktiot vain lukevat lukuja ja lähettävät sähköpostia, mutta ilman
avainta ulkopuolinen voi laukaista niitä toistuvasti.

### Valinnaiset

| Muuttuja | Mihin | Jos puuttuu |
|---|---|---|
| `RESEND_API_KEY` | Hälytyssähköpostit | Sähköpostit jäävät hiljaa lähettämättä |
| `ADMIN_EMAIL` | Hälytysten vastaanottaja | Sama |
| `FROM_EMAIL` | Lähettäjäosoite | Oletus `noreply@digiopo.fi` |
| `AMMATTISET_ADMIN_KEY` | Ammattiset-pelin tulostaulun ylläpito | Tulostaulua ei voi tyhjentää |
| `VERCEL_API_TOKEN` | Deploy-tila hallintapaneelissa | Paneeli toimii, tila ei näy |
| `VERCEL_PROJECT_ID` | Sama | Sama |
| `VERCEL_TEAM_ID` | Sama | Sama |

Sähköpostihälytykset lähtevät vain jos **sekä** `RESEND_API_KEY` että
`ADMIN_EMAIL` on asetettu (`const sposti = Boolean(RESEND_API_KEY && ADMIN_EMAIL)`).
Toisen puuttuminen sammuttaa ne kokonaan ilman virheilmoitusta.

---

## 3. Supabase

1. Luo projekti osoitteessa [supabase.com](https://supabase.com)
2. Aja SQL-tiedostot järjestyksessä → [03 – Tietokanta](03-tietokanta.md)
3. Settings → API: kopioi **Project URL** → `SUPABASE_URL`
4. Samasta näkymästä **service_role**-avain → `SUPABASE_SERVICE_KEY`

⚠️ `service_role` ohittaa kaikki RLS-säännöt. Sitä ei saa koskaan viedä
selaimeen eikä committoida. Se kuuluu vain palvelinympäristöön. Tämä on koko
turvamallin perusta — ks. [04 – Arkkitehtuuri](04-arkkitehtuuri.md).

---

## 4. Upstash Redis

1. [console.upstash.com](https://console.upstash.com) → Redis → Create Database
2. Valitse sijainniksi Eurooppa (lyhyempi viive Vercelin eu-alueelta)
3. **REST API** -välilehdeltä: `UPSTASH_REDIS_REST_URL` ja `UPSTASH_REDIS_REST_TOKEN`

Miksi tämä ei ole valinnainen käytännössä: koulussa koko luokka avaa sivun
saman minuutin sisällä ja saman NAT-osoitteen takaa. Muistipohjainen laskuri
hajoaa siinä tilanteessa, koska jokainen serverless-instanssi laskee omiaan.
Ks. [10 – Rajoitteet](10-rajoitteet.md).

---

## 5. Resend – EI valinnainen

Resend hoitaa **kolme eri asiaa**, joista kaksi on kriittisiä:

| Käyttö | Mitä rikkoutuu ilman |
|---|---|
| Tilausvahvistukset ja laskut | Asiakas maksaa eikä saa koodiaan |
| Opettajien kirjautumislinkit (Supabase SMTP) | **Opettajat eivät pääse kirjautumaan** |
| Hälytyssähköpostit | Ylikäyttö ja virheet jäävät huomaamatta |

### Vaiheet

1. Luo tili ja API-avain → `RESEND_API_KEY`
2. **Lisää ja vahvista domain** (Domains → Add Domain)
3. Aseta `ADMIN_EMAIL` ja `FROM_EMAIL`

### ⚠️ Domainin vahvistus vaatii DNS-tietueet

Resend antaa **DKIM-, SPF- ja DMARC-tietueet**, jotka on lisättävä
verkkotunnuksen DNS-asetuksiin TXT-tietueina. Vahvistus kestää minuuteista
tunteihin.

**Ennen vahvistusta yksikään sähköposti ei lähde** – ei tilausvahvistus, ei
kirjautumislinkki, ei hälytys. Tämä on käyttöönoton hitain vaihe, joten
aloita siitä.

---

## 5b. Supabase Auth – kolme asetusta jotka EIVÄT ole koodissa

Nämä tehdään Supabasen hallintapaneelista. Ne eivät ole missään
SQL-tiedostossa eivätkä ympäristömuuttujissa, joten pystytys epäonnistuu
hiljaa ilman niitä.

### 1. Custom SMTP (pakollinen)

**Authentication → Emails → SMTP Settings → Enable custom SMTP**

| Kenttä | Arvo |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (kirjaimellisesti tämä sana, ei sähköposti) |
| Password | Resendin API-avain, jolla on Sending access |
| Sender email | Sama vahvistettu domain kuin `FROM_EMAIL` |
| Sender name | `DigiOpo` |

⚠️ **Ilman tätä Supabasen oma sähköposti lähettää vain 2 viestiä tunnissa
koko projektissa.** Kolmas opettaja, joka pyytää kirjautumislinkkiä saman
tunnin aikana, saa virheen `email rate limit exceeded` – eikä hänelle näy
syytä. Tämä osuu ensimmäisen koulun ensimmäisellä oppitunnilla.

Custom SMTP nostaa rajan 30 viestiin tunnissa (säädettävissä kohdasta
**Authentication → Rate Limits**), ja sen jälkeen rajat tulevat Resendiltä.

Suositus: luo Resendiin **oma API-avain nimellä `supabase-smtp`**. Silloin
näet Resendin lokista kumpi järjestelmä lähetti mitäkin, ja voit perua toisen
kaatamatta toista.

### 2. Site URL ja Redirect URLs (pakollinen)

**Authentication → URL Configuration**

- **Site URL:** sovelluksen osoite, esim. `https://app.digiopo.fi`
- **Redirect URLs:** salli `https://<domain>/kirjaudu.html`

Kirjautumislinkki ohjaa tähän osoitteeseen. Jos domain ei ole sallittujen
listalla, linkki ei toimi – käyttäjä saa virheen tai päätyy väärään paikkaan.

### 3. Minimum interval per user

Oletus 60 sekuntia on hyvä. Se estää saman käyttäjän toistuvat pyynnöt, mikä
on tavallista hätäilyä eikä hyökkäys.

---

## 6. Vercel

1. New Project → tuo GitHub-repo
2. Framework Preset: **Other**. Build-komentoa ei ole eikä tarvita – sivusto
   tarjoillaan sellaisenaan.
3. Settings → Environment Variables: syötä kohdan 2 muuttujat
4. Deploy

Node-versio tulee `package.json`:n `engines`-kentästä (`24.x`). Vercel varoittaa
vanhentuneista versioista ja lopulta lakkaa tukemasta niitä, joten tämä on
tarkistettava ajoittain.

### Cronit

Ajastukset ovat `vercel.json`-tiedostossa eikä niitä tarvitse asettaa käsin:

| Polku | Aika (UTC) | Tekee |
|---|---|---|
| `/api/tarkista-kirjaukset` | 06:00 | Ylikäyttötarkistus, hälytys jos yli 50 kirjausta/tunti |
| `/api/tarkista-virheet` | 07:00 | Kooste API-virheistä |

### Domain

Settings → Domains → lisää domain ja seuraa DNS-ohjeita. Tuotannossa käytössä
on `app.digiopo.fi`.

---

## 7. Paikallinen kehitys

```bash
npm install
npm run dev          # http://localhost:8000
```

macOS: `esikatselu.command` tekee saman kaksoisklikkauksella. Julkaisu:
`julkaise.command` pushaa `main`-haaraan, mistä Vercel julkaisee automaattisesti.

⚠️ **`.command`-tiedostot toimivat vain macOS:llä.** Windowsissa kaksoisklikkaus
ei tee mitään – käytä `npm run dev` ja `git push origin main`.

Kehityspalvelin (`dev-server.cjs`) ei tarvitse yhtään ympäristömuuttujaa eikä lue
`.env`-tiedostoa. Se jäljittelee `/api/lisenssi`- ja `/api/ping`-vastaukset
paikallisesti ja hyväksyy minkä tahansa lisenssikoodin, jotta muuri ei estä
kehitystä. Portin voi vaihtaa vain shell-muuttujalla: `PORT=3000 npm run dev`.

### Odotettuja 404-virheitä paikallisesti

Nämä eivät ole vikoja:

- `/_vercel/insights/script.js` – Vercelin kävijäseuranta, olemassa vain
  tuotannossa. Esiintyy 81 sivulla, `defer`-merkittynä eikä vaikuta toimintaan.
- `/favicon.ico` – niillä sivuilla, joilta favicon-linkitys vielä puuttuu.

---

## 8. Vercel Hobby -rajat

**Serverless-funktioita saa olla enintään 12.** Kansiossa `api/` on tällä
hetkellä täsmälleen 12. Katto on siis täynnä: uusi endpoint vaatii joko
olemassa olevan funktion laajentamista tai Pro-tilausta.

Tämä on jo vaikuttanut rakenteeseen – ylikäyttöhälytys yhdistettiin
`tarkista-kirjaukset`-funktioon juuri tästä syystä.

Cron-ajoja Hobby-tasolla saa olla enintään kaksi päivässä, mikä vastaa nykyistä
käyttöä täsmälleen.

---

## 8b. ⚠️ Kovakoodatut arvot – vaihdettava uudessa ympäristössä

Kaikki asetukset eivät ole ympäristömuuttujissa. **Selainpuolen koodissa on
kovakoodattuja arvoja**, jotka osoittavat alkuperäiseen ympäristöön.

Jos näitä ei vaihda, sivusto **näyttää toimivan** mutta selainpuoli puhuu
väärään Supabase-projektiin ja kirjautumislinkit ohjaavat väärään domainiin.
Mikään ei ilmoita virheestä – tämä on käyttöönoton vaarallisin kohta.

### Supabasen osoite ja anon-avain

Kolmessa tiedostossa, samat kaksi riviä kussakin:

| Tiedosto | Rivit |
|---|---|
| `js/lisenssiportti.js` | `SUPABASE_URL`, `SUPABASE_ANON` |
| `js/opettaja-keskus.js` | `SUPABASE_URL`, `SUPABASE_ANON` |
| `kirjaudu.html` | `SUPABASE_URL`, `SUPABASE_ANON` |

Arvot löytyvät Supabasesta: **Settings → API**. Anon-avain on tarkoitettu
julkiseksi – se ei anna pääsyä dataan, koska RLS estää kaiken. Varsinainen
suojaus on `service_role`-avaimessa, joka on vain palvelinpuolella.

### Kirjautumislinkin paluuosoite

`kirjaudu.html`, kohta `emailRedirectTo`:

```js
emailRedirectTo: 'https://app.digiopo.fi/kirjaudu.html',
```

Vaihda uuteen domainiin. Sama osoite on lisättävä myös Supabasen
**Redirect URLs** -listalle (ks. kohta 5b).

### CORS-rajaus

Kaksi API-funktiota rajaa sallitun originin:

```js
res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
```

| Tiedosto |
|---|
| `api/fake-insta.js` |
| `api/maailma-taulu.js` |

Muut admin-rajapinnat käyttävät `'*'`-arvoa, koska valtuutus tulee
`x-admin-key`-otsakkeesta eikä evästeestä – niitä ei tarvitse muuttaa.

### Muut domain-viittaukset

```bash
grep -rn "app\.digiopo\.fi\|digiopo\.fi" --include="*.js" --include="*.html" . \
  | grep -v node_modules
```

Aja tämä lopuksi ja käy tulokset läpi. Osa on tekstiä sähköposteissa ja
ohjeissa – ne kannattaa päivittää samalla, vaikka ne eivät riko mitään.

---

## 9. Käyttöönoton tarkistuslista

Kun kaikki on pystyssä, varmista:

- [ ] Etusivu latautuu
- [ ] Suojattu sivu (esim. `/8luokka`) ohjaa `liity.html`-portille ilman lisenssiä
- [ ] Kelvollinen lisenssikoodi päästää läpi ja pääsy säilyy sivunvaihdossa
- [ ] Hallintapaneeli aukeaa `ADMIN_DASHBOARD_KEY`-avaimella
- [ ] Selaimen konsolissa ei CSP-virheitä
- [ ] Application → Service Workers: `sw.js` aktiivinen (tuotannossa)
- [ ] Supabasen `api_virheet`-taulu ei täyty virheistä

**Uudessa ympäristössä lisäksi:**

- [ ] Resendin domain vahvistettu (DKIM, SPF, DMARC) – tarkista Resendin
      Domains-näkymästä että tila on *Verified*
- [ ] Supabase custom SMTP päällä ja testattu: pyydä kirjautumislinkki ja
      tarkista että viesti näkyy **Resendin lokissa**. Jos ei näy, viesti
      kulki Supabasen kautta eikä asetus ole voimassa.
- [ ] Site URL ja Redirect URLs asetettu uudelle domainille
- [ ] Kovakoodatut arvot vaihdettu (kohta 8b) – varmista avaamalla
      selaimen verkkovälilehti ja tarkistamalla, että pyynnöt menevät
      **omaan** Supabase-projektiin
- [ ] Opettajakirjautuminen toimii päästä päähän: linkki tulee, avautuu
      oikeaan osoitteeseen ja hallintasivu aukeaa

Jos suojattu sivu **ei** ohjaa portille, `LISENSSI_JWT_SECRET` puuttuu ja muuri
on pois päältä. Tämä on tarkoituksellinen turvaventtiili: ympäristömuuttujan
poistaminen on nopein tapa perua maksumuuri, jos se rikkoutuu kesken koulupäivän.
