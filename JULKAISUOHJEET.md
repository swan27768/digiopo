# DigiOpo – Julkaisuohjeet aloittelijalle
**Arviolta 1–2 tuntia · Ei aiempaa kokemusta tarvita**

---

## Ennen kuin aloitat

Tarvitset:
- Sähköpostiosoitteen (sama riittää kaikkiin palveluihin)
- DigiOpo-kansion tietokoneellasi (se on jo olemassa: `/Users/vicis/Projects/digiopo`)
- GitHub-tilin (luodaan vaiheessa 3)

---

## VAIHE 1 – Supabase: tietokanta lisensseille

Supabase on pilvitietokanta. Se tallentaa koulukoodit ja niiden voimassaoloajat.

### 1.1 Luo tili

1. Mene osoitteeseen **[supabase.com](https://supabase.com)**
2. Klikkaa oikeassa yläkulmassa **"Start your project"**
3. Valitse **"Sign up with GitHub"** tai syötä sähköposti ja salasana
4. Vahvista sähköpostiosoitteesi (tarkista sähköposti)

### 1.2 Luo uusi projekti

1. Kirjautuneena näet Dashboard-sivun. Klikkaa **"New project"**
2. Täytä tiedot:
   - **Organization**: valitse oma nimesi (se on jo valmiina)
   - **Project name**: kirjoita `digiopo`
   - **Database password**: luo vahva salasana (tallenna se johonkin – tarvitset sen myöhemmin)
   - **Region**: valitse **"West EU (Ireland)"** – lähimpänä Suomea
3. Klikkaa **"Create new project"**
4. Odota 1–2 minuuttia. Näet pyörivän latauskuvakkeen – älä sulje sivua.

### 1.3 Aja tietokantarakenne

Kun projekti on valmis (vihreä "Active"-merkki):

1. Vasemmassa valikossa klikkaa **"SQL Editor"** (ikoni näyttää tietokantasylinteriltä)
2. Klikkaa oikealla ylhäällä **"New query"**
3. Avaa tietokoneellasi tiedosto `/Users/vicis/Projects/digiopo/supabase_schema.sql`
   - Mac: avaa Finder → navigoi kansioon → kaksoisklikkaa tiedostoa (avautuu TextEditissä)
   - Tai avaa se VS Codessa jos sinulla on se
4. Valitse **kaikki teksti** tiedostosta (Cmd+A Macilla)
5. **Kopioi** se (Cmd+C)
6. Liitä se Supabasen SQL Editor -kenttään (Cmd+V)
7. Klikkaa oikealla ylhäällä vihreää **"Run"**-nappia (tai paina Cmd+Enter)
8. Alhaalla pitäisi näkyä viesti: **"Success. No rows returned"** tai vastaava – tämä on oikein!

> **Mitä tapahtui?** Supabase loi `lisenssit`-nimisen taulun ja lisäsi kaksi testikoodi:
> `TESTI-2026` ja `KOULU-2026`. Näillä voit kokeilla toimiiko sivusto.

### 1.4 Kopioi Project URL

1. Vasemmassa valikossa klikkaa **"Project Settings"** (hammaspyörä-ikoni, aivan alhaalla)
2. Klikkaa **"API"**
3. Näet **"Project URL"** -kentän – se näyttää tältä:
   ```
   https://abcdefghijklmn.supabase.co
   ```
4. Klikkaa URL:n vieressä olevaa **kopiointinappia** (kaksi päällekkäistä neliötä)
5. **Liitä se johonkin muistiin** (esim. avaa Muistio/Notes-sovellus ja liitä sinne)

### 1.5 Kopioi service_role-avain

Samalla sivulla (Project Settings → API):

1. Vieritä alaspäin kohtaan **"Project API keys"**
2. Näet kaksi avainta:
   - `anon` `public` – **ÄLÄ käytä tätä**
   - `service_role` `secret` – **tämä tarvitaan**
3. Klikkaa `service_role`-rivin kohdalla **"Reveal"**-nappia
4. Klikkaa sen jälkeen kopiointinappia
5. **Liitä se myös muistioon** (pidä tämä salassa – älä jaa kenellekään)

> ⚠️ **Tärkeää:** service_role-avain on kuin pääsalasana tietokantaan. Älä koskaan laita sitä suoraan nettisivun koodiin.

---

## VAIHE 2 – GitHub: projektin versiointi

GitHub on paikka, johon tallennetaan sivuston koodi. Netlify hakee koodin sieltä automaattisesti.

### 2.1 Luo GitHub-tili

1. Mene osoitteeseen **[github.com](https://github.com)**
2. Klikkaa **"Sign up"**
3. Syötä sähköposti, salasana ja käyttäjätunnus (esim. `digiopo` tai oma nimesi)
4. Vahvista sähköposti

### 2.2 Luo uusi repositorio

1. Kirjautuneena klikkaa oikeassa yläkulmassa **"+"** → **"New repository"**
2. Täytä:
   - **Repository name**: `digiopo-app`
   - **Description**: `DigiOpo – app.digiopo.fi` (valinnainen)
   - Valitse **"Private"** (sivusto ei näy julkisesti GitHubissa – se näkyy vain Netlifyn kautta)
3. **ÄLÄ** lisää README:tä tai muita tiedostoja tässä vaiheessa
4. Klikkaa **"Create repository"**
5. Näet sivun, jossa on ohjeet. Kopioi repositorion URL – se näyttää tältä:
   ```
   https://github.com/sinuntunnus/digiopo-app.git
   ```

### 2.3 Vie DigiOpo-kansio GitHubiin

Tämä tehdään Macin Terminaalissa:

1. Avaa **Terminal** (Launchpad → Terminal, tai Spotlight-haku Cmd+Space → kirjoita "Terminal")
2. Navigoi DigiOpo-kansioon kirjoittamalla:
   ```bash
   cd "/Users/vicis/Projects/digiopo"
   ```
   Paina Enter.
3. Alusta Git kirjoittamalla nämä komennot yksi kerrallaan (Enter jokaisen jälkeen):
   ```bash
   git init
   git add .
   git commit -m "DigiOpo ensimmäinen versio"
   git branch -M main
   git remote add origin https://github.com/sinuntunnus/digiopo-app.git
   git push -u origin main
   ```
   > Korvaa `sinuntunnus` omalla GitHub-käyttäjätunnuksellasi!
4. Terminal saattaa pyytää GitHub-salasanaa. Kirjoita se (ei näy kirjoittaessa – se on normaalia).
5. Kun näet tekstiä jossa lukee `main -> main` tai `Branch 'main' set up`, kaikki meni oikein.

> **Jatkossa:** Kun muutat sivuston tiedostoja, aja nämä komennot Terminalissa päivittääksesi GitHubin:
> ```bash
> cd "/Users/vicis/Projects/digiopo"
> git add .
> git commit -m "Muutoksen kuvaus"
> git push
> ```
> Netlify hakee muutokset automaattisesti muutamassa minuutissa.

---

## VAIHE 3 – Netlify: sivuston julkaisu

Netlify julkaisee sivustosi ja pyörittää lisenssin tarkistuksen.

### 3.1 Luo tili

1. Mene osoitteeseen **[netlify.com](https://netlify.com)**
2. Klikkaa **"Sign up"**
3. Valitse **"Sign up with GitHub"** – näin Netlify ja GitHub yhdistyvät automaattisesti
4. Hyväksy käyttöoikeudet

### 3.2 Yhdistä GitHub-repositorio

1. Netlify-dashboardissa klikkaa **"Add new site"** → **"Import an existing project"**
2. Klikkaa **"Deploy with GitHub"**
3. Valitse repositorio listasta: `digiopo-app`
   - Jos et näe sitä, klikkaa **"Configure the Netlify app on GitHub"** ja anna lupa
4. Seuraavalla sivulla:
   - **Branch to deploy**: `main`
   - **Base directory**: jätä tyhjäksi
   - **Build command**: jätä tyhjäksi (sivusto ei tarvitse buildausta)
   - **Publish directory**: kirjoita `.` (piste)
5. Klikkaa **"Deploy site"**
6. Netlify antaa sivustolle satunnaisen osoitteen kuten `sparkling-fox-123456.netlify.app` – tämä on väliaikainen

### 3.3 Lisää ympäristömuuttujat (Supabase-yhteys)

Nyt kerrotaan Netlifylle Supabasen osoite ja avain:

1. Netlify-dashboardissa mene sivustosi asetuksiin:
   **Site configuration** → **Environment variables**
2. Klikkaa **"Add a variable"**
3. Lisää ensimmäinen muuttuja:
   - **Key**: `SUPABASE_URL`
   - **Value**: liitä Vaiheessa 1.4 kopioimasi URL (esim. `https://abcdefghijklmn.supabase.co`)
   - Klikkaa **"Create variable"**
4. Klikkaa uudelleen **"Add a variable"**
5. Lisää toinen muuttuja:
   - **Key**: `SUPABASE_SERVICE_KEY`
   - **Value**: liitä Vaiheessa 1.5 kopioimasi service_role-avain
   - Klikkaa **"Create variable"**

### 3.4 Ota Functions käyttöön uudelleen

Kun lisäät ympäristömuuttujia, Netlify ei automaattisesti päivitä niillä jo julkaistua versiota. Pakota uudelleenjulkaisu:

1. Vasemmassa valikossa klikkaa **"Deploys"**
2. Klikkaa **"Trigger deploy"** → **"Deploy site"**
3. Odota 1–2 minuuttia kunnes näkyy vihreä **"Published"**

### 3.5 Testaa toimiiko lisenssi

1. Mene Netlifyn antamaan osoitteeseen (esim. `sparkling-fox-123456.netlify.app`)
2. Sinulle pitäisi tulla esiin violetti **pääsykoodilomake**
3. Kirjoita testikoodiksi: `TESTI-2026`
4. Klikkaa **"Kirjaudu sisään"**
5. Jos näet DigiOpon etusivun – kaikki toimii! 🎉

> Jos tulee virhe "Palvelinvirhe", tarkista että ympäristömuuttujat on kirjoitettu täsmälleen oikein (ei välejä alussa tai lopussa).

---

## VAIHE 4 – Domain: app.digiopo.fi

Nyt yhdistetään oma domain `digiopo.fi` Netlifyn sivustoon.

### 4.1 Lisää subdomain Netlifyyn

1. Netlify-dashboardissa: **Domain management** → **Add a domain**
2. Kirjoita: `app.digiopo.fi`
3. Klikkaa **"Verify"** → **"Add domain"**
4. Netlify näyttää sinulle DNS-tietueen. Se näyttää tältä:
   ```
   CNAME   app   sparkling-fox-123456.netlify.app
   ```
   **Pidä tämä sivu auki** – tarvitset nämä tiedot seuraavassa kohdassa.

### 4.2 Lisää DNS-tietue domainrekisterissä

Sinun täytyy käydä siellä, missä olet ostanut `digiopo.fi`-domainin.

**Yleisiä palveluntarjoajia Suomessa:** Zoner, Name.com, Namecheap, GoDaddy, Ficora/Traficom-rekisteröijät

1. Kirjaudu domainrekisterisi hallintapaneeliin
2. Etsi **DNS-asetukset** tai **DNS-hallinta** (saattaa olla myös "Nimipalvelimet" tai "DNS records")
3. Lisää uusi tietue:
   - **Tyyppi**: `CNAME`
   - **Nimi/Host**: `app` (eli pelkkä `app`, ei koko osoitetta)
   - **Arvo/Points to**: `sparkling-fox-123456.netlify.app` (Netlifyn antama osoite)
   - **TTL**: `3600` tai "Automatic" – kumpi tahansa käy
4. Tallenna muutokset

> **Eri palvelut käyttävät eri termejä:**
> - Zoner: Lisää tietue → CNAME
> - Namecheap: Advanced DNS → Add New Record → CNAME
> - GoDaddy: DNS → Add → CNAME

### 4.3 Odota DNS-päivitystä

DNS-muutokset voivat kestää **15 minuutista 24 tuntiin**. Yleensä alle tunti.

Voit tarkistaa tilanteen:
1. Netlifyssa **Domain management** -sivulla näkyy osoitteen vieressä joko kellon kuva (odottaa) tai vihreä merkki (valmis)
2. Tai mene selaimessa osoitteeseen `app.digiopo.fi` – jos DigiOpo aukeaa, kaikki on valmista

### 4.4 HTTPS-sertifikaatti (automaattinen)

Kun DNS on päivittynyt, Netlify asentaa automaattisesti ilmaisen SSL-sertifikaatin (HTTPS). Tämä kestää 1–5 minuuttia domainin aktivoinnin jälkeen. Sinun ei tarvitse tehdä mitään – se tapahtuu itsestään.

---

## Valmis! Tarkistuslista

Käy nämä läpi kun kaikki on tehty:

- [ ] Supabase-tili luotu ja projekti toimii
- [ ] `supabase_schema.sql` ajettu → taulut olemassa
- [ ] Project URL ja service_role-avain tallennettu
- [ ] GitHub-tili ja repositorio `digiopo-app` luotu
- [ ] Koodi viety GitHubiin (`git push`)
- [ ] Netlify-tili luotu ja yhdistetty GitHubiin
- [ ] Ympäristömuuttujat `SUPABASE_URL` ja `SUPABASE_SERVICE_KEY` lisätty
- [ ] Testilisenssi `TESTI-2026` toimii
- [ ] DNS-tietue `app.digiopo.fi` lisätty domainrekisteriin
- [ ] `app.digiopo.fi` aukeaa selaimessa

---

## Ongelmatilanteita

**"Palvelinvirhe" kun syöttää koodin:**
→ Tarkista Netlifyn ympäristömuuttujat – ei välejä, ei lainausmerkkejä arvojen ympärillä

**"Virheellinen koodi" vaikka koodi on oikein:**
→ Käy Supabasessa SQL Editorissa ja aja: `SELECT * FROM lisenssit;` – näkyykö `TESTI-2026`?

**`app.digiopo.fi` ei aukea:**
→ DNS ei ole vielä päivittynyt. Odota ja yritä tunnin päästä uudelleen.

**`git push` pyytää salasanaa eikä hyväksy sitä:**
→ GitHub on siirtynyt token-pohjaiseen tunnistautumiseen. Mene GitHub → Settings → Developer settings → Personal access tokens → Generate new token. Käytä tokenia salasanan sijaan.

**Netlify näyttää "Page not found" -virheen:**
→ Varmista että Publish directory on `.` (piste) Netlifyn build-asetuksissa.

---

## Seuraava vaihe: Uuden lisenssin lisääminen

Kun koulu ostaa lisenssin, lisäät sen Supabaseen:

1. Mene **[supabase.com](https://supabase.com)** → kirjaudu → valitse `digiopo`-projekti
2. Vasemmassa valikossa: **Table Editor** → **lisenssit**
3. Klikkaa **"Insert" → "Insert row"**
4. Täytä:
   - `koodi`: esim. `MÄYRÄLÄ-2026` (kirjoita isolla)
   - `koulu`: `Mäyrälän yhtenäiskoulu`
   - `yhteyshenkilö`: opettajan nimi
   - `email`: opettajan sähköposti
   - `tyyppi`: `vuosi` tai `testi`
   - `voimassa_asti`: esim. `2027-05-31`
   - `aktiivinen`: jätä `true`
5. Klikkaa **"Save"**
6. Lähetä koodi opettajalle sähköpostilla
