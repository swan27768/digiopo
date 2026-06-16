# 🔐 Supabase service_role -avaimen vaihto

**Tilanne:** Supabasen salainen `service_role`-avain näkyi kuvakaappauksessa ja se vaihdetaan varmuuden vuoksi uuteen. Avain ohittaa kaikki tietokannan suojaukset, joten sen on pysyttävä salaisena.

**Ajoitus:** Tehdään **29.6. tai myöhemmin**, kun Vercelin julkaisuraja vapautuu — koska vaihto vaatii uuden julkaisun astuakseen voimaan.

**Tärkeää:** Projektisi käyttää vain `SUPABASE_SERVICE_KEY`-muuttujaa (palvelimella). Avainta ei ole kovakoodattu mihinkään tiedostoon, joten **koodia ei tarvitse muokata.** Selaimessa ei käytetä Supabase-avainta lainkaan.

---

## Tarkistuslista (tee järjestyksessä)

### 1. Luo uusi avain Supabasessa
- Mene: **supabase.com → projektisi → Settings → API**
- Etsi **service_role** / **secret key** -kohta.
  - **Jos näet "Secret keys" -osion** (uudempi järjestelmä): mitätöi (revoke) vanha avain ja luo **uusi secret key**.
  - **Jos näet vain "JWT Settings"** (vanhempi järjestelmä): valitse **"Generate a new JWT secret"** / "Roll".
    - ⚠️ Huom: tämä mitätöi samalla `anon`-avaimen ja kirjaa ulos mahdolliset Supabase-istunnot. Projektisi ei käytä näitä selaimessa, joten se ei haittaa — mutta hyvä tietää.
- **Kopioi uusi service_role-avain talteen** (tarvitset sen seuraavassa kohdassa).

### 2. Päivitä avain Verceliin
- Mene: **vercel.com → digiopo → Settings → Environment Variables**
- Etsi **`SUPABASE_SERVICE_KEY`** → muokkaa → liitä **uusi** avain → **Save**
- Varmista että se on asetettu **Production**-ympäristölle.

### 3. Päivitä paikallinen .env
- Avaa projektisi `.env`-tiedosto koneellasi.
- Päivitä rivi: `SUPABASE_SERVICE_KEY=<uusi avain>`
- (Tämä on vain paikallista testausta varten. `.env` ei mene GitHubiin — se on `.gitignore`ssa.)

### 4. Kytke julkaisu takaisin päälle
- Vercel → **Settings → Build and Deployment → Ignored Build Step**
- Vaihda **"Don't build anything" → "Automatic"** → **Save**

### 5. Julkaise uudelleen
- Pushaa GitHubiin **tai** Vercel → **Deployments** → viimeisin → **Redeploy**.
- Tämä "leipoo" uuden avaimen tuotantofunktioihin.

### 6. Varmista että sivusto toimii
Avaa app.digiopo.fi ja testaa:
- ✅ Koulukoodilla kirjautuminen toimii (lisenssitarkistus → `api/lisenssi`)
- ✅ Sivut latautuvat normaalisti (käyttölaskuri → `api/ping`)

### 7. Valmis
Vanha avain on nyt mitätön. Älä koskaan laita avainta suoraan koodiin tai kuvakaappaukseen — vain Vercelin Environment Variables -kohtaan ja paikalliseen `.env`-tiedostoon.

---

## Hyvä tietää: anon vs service_role
- **`anon` (public)** -avain on tarkoitettu näkyväksi — sitä ei tarvitse suojata. Turva tulee Supabasen Row Level Security -säännöistä.
- **`service_role` (secret)** -avain ohittaa kaikki suojaukset → pidettävä aina salassa. Tämä on se, jonka nyt vaihdamme.
