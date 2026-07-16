# Toteutussuunnitelma: Koulukohtainen lukuvuoden aikataulu

**Tavoite:** Eri koulujen opettajat luovat oman koulun lukuvuoden tärkeät tapahtumat
(TET-jakso, yhteishaku, tehtävien palautuspäivät ym.) omaan muokkaustilaansa, ja
heidän oppilaansa näkevät ne omalla näkymällään koko lukuvuoden ajan. Opettajan
muutokset päivittyvät oppilaille automaattisesti.

---

## 1. Miksi tämä on suoraviivaista

DigiOpossa on jo tuotannossa testattu **täsmälleen sama kuvio**: `jarjestys`-ominaisuus.
Siinä opettaja luo opetusryhmän (ryhmäkoodi + salainen opettaja-avain), oppilaat
liittyvät `?ryhma=KOODI`-linkillä, ja data haetaan palvelimelta joka latauksella.

Uusi aikataulu-ominaisuus **käyttää samaa `opetusryhmat`-taulua ja samaa turvamallia**:

- Selain ei koskaan puhu suoraan Supabaseen. Kaikki kulkee palvelinfunktion kautta
  service_role-avaimella; tauluissa RLS `using(false)`.
- Opettaja-avain tallennetaan vain SHA-256-tiivisteenä (`avain_hash`), kuten järjestyksessä.
- Oppilaan luku on julkinen pelkällä ryhmäkoodilla; kirjoitus vaatii avaimen.

Turvakriittistä uutta koodia ei siis synny — kopioidaan `api/jarjestys.js`:n malli.

Uudelleenkäytettävät osat: `opetusryhmat`-taulu, `api/_lib/turva.js` (`haeIp`),
`api/_lib/virhelogi.js`, rate limit -malli, ryhmäkoodin validointi, localStorage-avaimet
`digiopo-ryhma` (oppilas) ja `digiopo-ope-ryhma` + `digiopo-ope-avain` (opettaja).

---

## 2. Tietokanta — uusi taulu

Uusi tiedosto: `supabase_lukuvuosi_aikataulu.sql` (ajetaan Supabase SQL Editorissa
`supabase_jarjestys.sql`:n jälkeen, koska viittaa `opetusryhmat`-tauluun).

```sql
-- DigiOpo – Koulukohtainen lukuvuoden aikataulu
-- Vaatii supabase_jarjestys.sql:n (opetusryhmat-taulu).

create table if not exists lukuvuosi_tapahtumat (
  id           uuid        primary key default gen_random_uuid(),
  ryhmakoodi   text        not null references opetusryhmat (ryhmakoodi) on delete cascade,
  otsikko      text        not null check (char_length(otsikko) <= 80),
  tyyppi       text        not null default 'muu'
                           check (tyyppi in ('tet','yhteishaku','palautus','tapahtuma','muu')),
  alku_pvm     date        not null,
  loppu_pvm    date,                                   -- null = yksittäinen päivä
  kuvaus       text        check (char_length(kuvaus) <= 200),
  luotu_at     timestamptz not null default now(),
  muokattu_at  timestamptz not null default now()
);

create index if not exists lukuvuosi_tapahtumat_ryhma_idx
  on lukuvuosi_tapahtumat (ryhmakoodi, alku_pvm);

-- Automaattinen muokattu_at (käyttää supabase_schema.sql:n funktiota)
drop trigger if exists lukuvuosi_tapahtumat_muokattu_at on lukuvuosi_tapahtumat;
create trigger lukuvuosi_tapahtumat_muokattu_at
  before update on lukuvuosi_tapahtumat
  for each row execute function paivita_muokattu_at();

-- RLS: vain service_role (api/aikataulu.js) pääsee
alter table lukuvuosi_tapahtumat enable row level security;
drop policy if exists "Ei julkista paasya aikataulu" on lukuvuosi_tapahtumat;
create policy "Ei julkista paasya aikataulu" on lukuvuosi_tapahtumat for all using (false);
```

**Tapahtumatyypit** ohjaavat väriä ja ikonia oppilaan näkymässä:

| tyyppi       | esimerkki                | väri / ikoni            |
|--------------|--------------------------|-------------------------|
| `tet`        | TET-jakso                | teal / matkalaukku      |
| `yhteishaku` | Yhteishaku alkaa         | sininen / lomake        |
| `palautus`   | Tehtävän palautuspäivä   | oranssi / kalenteri     |
| `tapahtuma`  | Vanhempainilta, retki    | violetti / tähti        |
| `muu`        | vapaa                    | harmaa / piste          |

---

## 3. API — uusi `api/aikataulu.js`

Kopioi `api/jarjestys.js`:n runko (importit, `sb()`-apuri, `hashAvain`, `haeRyhma`,
rate limit, CORS). Uusi ympäristömuuttuja ei ole pakollinen; voidaan käyttää samaa
`JARJESTYS_PEPPER`-arvoa avainhashissa, jotta opettaja-avain toimii molemmissa.

**Rajapinnat:**

```
GET /api/aikataulu?ryhma=KOODI
    → { ok:true, tapahtumat:[ {id,otsikko,tyyppi,alku_pvm,loppu_pvm,kuvaus}, ... ] }
    (julkinen luku, oppilaille; järjestetty alku_pvm:n mukaan)

POST /api/aikataulu   (JSON body, toiminto-kenttä ratkaisee — kaikki vaativat avaimen)
    { toiminto:"lisaa",   ryhma, avain, otsikko, tyyppi, alku_pvm, loppu_pvm?, kuvaus? }
        → { ok:true, id }
    { toiminto:"muokkaa", ryhma, avain, id, ...kentat }
        → { ok:true }
    { toiminto:"poista",  ryhma, avain, id }
        → { ok:true }
```

**Validointi (palvelimella):**

- `ryhma`: `/^[A-Z0-9-]{4,16}$/` (sama kuin järjestyksessä).
- `otsikko`: 1–80 merkkiä; `kuvaus`: ≤200; `tyyppi`: sallittujen listassa.
- `alku_pvm` / `loppu_pvm`: ISO-päivämäärä `YYYY-MM-DD`; jos molemmat, `loppu_pvm >= alku_pvm`.
- Tapahtumien enimmäismäärä per ryhmä (esim. 100) roskaamisen estoon.
- Kirjoitustoiminnot: hae ryhmä `haeRyhma(ryhma)`, vertaa `avain_hash === hashAvain(avain)`.
  Jos ei täsmää → `{ ok:false, virhe:'avain_ei_tasmaa' }`.
- Rate limit POST:lle (kopioi `tarkistaRateLimit`).

`GET` on julkinen luku (ei avainta), samoin kuin järjestyksen GET.

---

## 4. Opettajan muokkaustila

Kaksi vaihtoehtoa sijainnille — suositus **A**, koska opettajalla on jo ryhmä/avain
järjestystä varten samassa `localStorage`ssa:

- **A (suositus):** laajenna olemassa olevaa opettajan järjestely-/jakonäkymää uudella
  välilehdellä "Lukuvuoden aikataulu". Käyttää samaa `digiopo-ope-ryhma`- ja
  `digiopo-ope-avain`-tietoa → opettajan ei tarvitse luoda uutta ryhmää eikä muistaa
  toista koodia.
- **B:** oma sivu `aikataulu_ope.html` (kuten muut `*_ope.html`), jos halutaan pitää erillään.

**Toiminnot (CRUD-lomake):**

- Listaa nykyiset tapahtumat aikajärjestyksessä.
- "Lisää tapahtuma": otsikko, tyyppi (valikko), alkupäivä, valinnainen loppupäivä,
  valinnainen kuvaus → `POST toiminto:"lisaa"`.
- Muokkaa / poista rivikohtaisesti → `muokkaa` / `poista`.
- Kaikki kutsut lähettävät `ryhma` + `avain` (opettajan localStoragesta).
- Jos avain ei täsmää, näytä selkeä virhe ja pyydä avain uudelleen.

**Jakolinkki oppilaille:** näytä valmis linkki `https://app.digiopo.fi/<sivu>?ryhma=KOODI`
(sama ryhmäkoodi kuin järjestyksessä). Opettaja jakaa sen oppilaille kerran.

---

## 5. Oppilaan näkymä — oma osio/sivu

Valittu ratkaisu: **oma osio/sivu** "Oman koulun lukuvuosi".

- Uusi kevyt sivu esim. `sivut/lukuvuosi.html` (tai osio, joka upotetaan valikkoon).
- Latauksessa: lue ryhmäkoodi `?ryhma=`-parametristä; jos on, tallenna
  `localStorage["digiopo-ryhma"]`. Muuten lue tallennettu koodi.
- Hae `GET /api/aikataulu?ryhma=KOODI` joka latauksella → opettajan muutokset näkyvät heti.
- Renderöi **aikajanana / listana** aikajärjestyksessä: seuraavat tapahtumat korostettuna,
  menneet himmennettyinä. Jokainen tapahtuma: tyypin väri + ikoni, otsikko, päivämäärä(t),
  kuvaus. Ryhmittely esim. kuukausittain tai "Tulossa / Menneet".
- Jos ryhmäkoodia ei ole: näytä ohje "Pyydä opettajaltasi ryhmälinkki".
- Uudelleenkäytä olemassa olevaa liikennevalo-/kortti­tyyliä, jotta ilme on yhtenäinen.

**Sijoitus navigaatioon:** koska navi juuri siivottiin osio-otsikoiksi, lisätään yksi
uusi osio-otsikko "Oman koulun lukuvuosi" (7./8./9. luokan sivuille tai etusivulle).

---

## 6. Vaiheistus

1. **Tietokanta:** luo ja aja `supabase_lukuvuosi_aikataulu.sql` (Supabase).
2. **API:** `api/aikataulu.js` (GET-luku ensin, sitten POST-toiminnot). Testaa curlilla.
3. **Oppilaan näkymä:** `sivut/lukuvuosi.html` + hakulogiikka (pelkkä luku näkyviin).
4. **Opettajan muokkaustila:** CRUD-lomake (vaihtoehto A tai B).
5. **Navigaatio + jakolinkki:** osio-otsikko oppilaille, jakolinkki opettajalle.
6. **Viimeistely:** tapahtumatyyppien värit/ikonit, tyhjät tilat, virheilmoitukset, mobiili.

Vaiheet 1–3 tuottavat jo toimivan "oppilaat näkevät" -kokemuksen (opettaja voi syöttää
dataa vaikka suoraan API:lla), vaihe 4 tuo opettajan käyttöliittymän.

---

## 7. Testilista

- `GET` tuntemattomalla ryhmällä → tyhjä lista, ei virhettä.
- `POST lisaa` oikealla avaimella → tapahtuma ilmestyy oppilaan näkymään latauksella.
- `POST` väärällä avaimella → `avain_ei_tasmaa`, mitään ei tallennu.
- Suora Supabase-luku selaimesta → estetty (RLS `using(false)`).
- Päivämäärävalidointi: `loppu_pvm < alku_pvm` hylätään.
- Rate limit: liialliset POSTit → 429.
- Mobiilinäkymä ja tyhjä tila ("ei vielä tapahtumia").

---

## 8. Riskit ja sudenkuopat

- **Ympäristömuuttujat per ympäristö:** `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` on jo
  asetettu, mutta jos käytetään `JARJESTYS_PEPPER`-arvoa avainhashissa, sen on oltava
  sama Preview- ja Production-ympäristössä, muuten opettaja-avain ei täsmää.
- **API-tiedoston pääte `.js`** (CommonJS-yhteensopiva import kuten muissa api-funktioissa).
- **Aikavyöhyke:** tallenna `date`-tyyppinä (ei `timestamptz`) → ei aikavyöhykeongelmia
  koulupäivien kanssa.
- **Middleware/maksumuuri:** jos `sivut/lukuvuosi.html` on muurin takana, oppilaalla pitää
  olla lisenssieväste. Jos halutaan julkiseksi, jätä polku middlewaren matcherin ulkopuolelle.
- **Service worker:** älä cacheta aikataulu-API:a (tuore data joka latauksella).

---

## 9. Työmääräarvio

| Osa                          | Arvio        |
|------------------------------|--------------|
| SQL-taulu + RLS              | pieni        |
| `api/aikataulu.js`           | pieni–keski (kopioi järjestysmalli) |
| Oppilaan näkymä (sivu + haku)| keski        |
| Opettajan CRUD-muokkaustila  | keski        |
| Navigaatio, viimeistely, testit | pieni     |

Kokonaisuus on **keskikokoinen ominaisuus**, jonka turvaosuus on jo ratkaistu.
Suurin työ on kaksi käyttöliittymää (oppilas + opettaja).
