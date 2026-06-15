# DigiOpo — Osioiden järjestely: ohjeet

Tämä dokumentti sisältää kaksi osaa:
- **Osa A: Opettajalle** — miten järjestät osiot ja jaat järjestyksen oppilaille.
- **Osa B: Ylläpitäjälle** — asennus, hallinta, turvallisuus ja vianetsintä.

---

# OSA A — OHJEET OPETTAJALLE

Voit järjestää oppituntien osiot haluamaasi järjestykseen kullakin
luokkasivulla (7., 8. ja 9. luokka). Oppilaat näkevät tehtävät kunkin osion
sisällä aina samassa järjestyksessä — vain osioiden keskinäinen järjestys
muuttuu.

## A1. Avaa muokkaustila

1. Avaa luokkasivu selaimessa, esim. `https://app.digiopo.fi/sivut/7luokka.html`
2. Lisää osoitteen **perään** `?ope=1` ja paina Enter:
   `https://app.digiopo.fi/sivut/7luokka.html?ope=1`
3. Sivu avautuu muokkaustilassa: alas ilmestyy violetti banneri, ja jokaisen
   osion oikeaan yläkulmaan tulee raahauskahva **⠿**.

> Vinkki: laita osoite kirjanmerkkeihin, niin pääset muokkaustilaan nopeasti.
> Oppilaat eivät näe muokkaustilaa, koska he avaavat sivun ilman `?ope=1`.

## A2. Järjestä osiot

- Tartu osion **⠿-kahvaan** ja raahaa osio haluamaasi kohtaan.
- Järjestys tallentuu **automaattisesti omaan selaimeesi** heti.
- Sisällysluettelo päivittyy samaan järjestykseen itsestään.
- **"Palauta oletus"** -nappi bannerissa palauttaa alkuperäisen järjestyksen.

Tässä vaiheessa järjestys näkyy vain sinun selaimessasi. Jos haluat oppilaiden
näkevän sen, jatka kohtaan A3.

## A3. Jaa järjestys oppilaille (kerran per ryhmä)

1. Klikkaa bannerissa **"Luo jakoryhmä"**.
2. Keksi **salainen opettaja-avain** (vähintään 4 merkkiä, esim. oma PIN).
   Tarvitset sen aina kun haluat tallentaa muutoksia. **Älä jaa sitä oppilaille.**
3. Saat **ryhmäkoodin** (esim. `K3M-9PQ2`) ja valmiin **oppilaan linkin**.
   Järjestys julkaistaan oppilaille heti.

## A4. Anna oppilaille pääsy

Jaa oppilaille **oppilaan linkki** bannerista (muotoa
`…/7luokka.html?ryhma=K3M-9PQ2`). Oppilas avaa sen kerran, ja näkee sen jälkeen
aina sinun järjestyksesi — myös omalla laitteellaan ja kotona.

> Oppilas tarvitsee edelleen koulukoodin kuten ennenkin. Ryhmäkoodi ja
> koulukoodi ovat eri asioita: koulukoodi avaa DigiOpon, ryhmäkoodi näyttää
> sinun järjestyksesi.

## A5. Muuta järjestystä myöhemmin

1. Avaa luokkasivu `?ope=1`-tilassa.
2. Raahaa osiot uuteen järjestykseen.
3. Klikkaa **"Tallenna oppilaille"**. Banneri vahvistaa: "✓ Julkaistu oppilaille".

Oppilaat näkevät uuden järjestyksen, kun he seuraavan kerran avaavat sivun.

## A6. Hyvä tietää

- **Sama ryhmäkoodi ja avain** toimivat kaikilla luokka-asteilla (7/8/9).
  Tee järjestys ja "Tallenna oppilaille" erikseen kullekin sivulle.
- **Avain säilyy vain siinä selaimessa, jossa loit ryhmän.** Jos vaihdat
  konetta tai tyhjennät selaimen tiedot, et pääse muokkaamaan samaa ryhmää
  ilman avainta. Käytä mieluiten samaa konetta/selainta. (Jos avain unohtuu,
  ota yhteys ylläpitäjään — ks. Osa B.)
- Oppilas, joka ei ole avannut ryhmälinkkiä, näkee oletusjärjestyksen.

---

# OSA B — OHJEET YLLÄPITÄJÄLLE

Ominaisuus noudattaa samaa kaavaa kuin lisenssintarkistus: selain ei koskaan
puhu suoraan Supabaseen, vaan kaikki kulkee Vercel-funktion
(`api/jarjestys.js`, `SUPABASE_SERVICE_KEY`) kautta.

```
Selain ──> /api/jarjestys (Vercel) ──> Supabase
```

## B1. Asennus (kertaluonteinen)

1. **Tietokanta:** aja `supabase_jarjestys.sql` Supabasen SQL Editorissa.
   Edellyttää, että `supabase_schema.sql` on joskus ajettu (käyttää sen
   `paivita_muokattu_at`-funktiota). Luo taulut `opetusryhmat` ja
   `jarjestykset` sekä RLS-säännöt (kaikki julkinen pääsy estetty).
2. **Ympäristömuuttujat (Vercel → Settings → Environment Variables):**
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — jo käytössä lisenssintarkistuksessa.
   - `JARJESTYS_PEPPER` *(valinnainen, suositeltu)* — pitkä satunnainen salaisuus,
     joka vahvistaa opettaja-avaimen tiivistettä. **Aseta kerran ennen
     ensimmäistä ryhmää, äläkä muuta** (muutos mitätöi olemassa olevat avaimet).
     Lisää ympäristöihin Production + Preview (Sensitive-tila estää Developmentin
     — se ei haittaa).
3. **Julkaisu:** vie haara `jarjestys-ominaisuus` tuotantoon. Jos automaatti-
   julkaisu on pois päältä, kytke se päälle (Vercel → Settings → Git) tai
   käynnistä julkaisu käsin. `api/jarjestys.js` reitittyy automaattisesti
   osoitteeseen `/api/jarjestys`.

## B2. Tietomalli

```
opetusryhmat
  ryhmakoodi  text  (PK)   -- esim. "K3M-9PQ2", jaetaan oppilaille
  avain_hash  text         -- opettaja-avaimen SHA-256(-pepper)-tiiviste
  koulukoodi  text         -- valinnainen, lisenssikoodi jos tiedossa
  nimi        text         -- valinnainen kuvaus

jarjestykset
  ryhmakoodi  text  (FK -> opetusryhmat)
  luokka      text  ('7' | '8' | '9')
  jarjestys   jsonb        -- lista osio-id:itä, esim. ["johdanto","tet",...]
  (PK: ryhmakoodi + luokka)
```

## B3. API-rajapinta

| Metodi | Kutsu | Vaatii avaimen | Selitys |
|--------|-------|----------------|---------|
| GET | `/api/jarjestys?ryhma=KOODI&luokka=7` | ei | Hae ryhmän järjestys (oppilaan luku) |
| POST | `{toiminto:"rekisteroi", avain, koulukoodi?}` | – | Luo ryhmä, palauttaa ryhmäkoodin |
| POST | `{toiminto:"tallenna", ryhma, avain, luokka, jarjestys}` | kyllä | Tallenna/päivitä järjestys |

Suojaukset: IP-pohjainen rate limit (20 pyyntöä / 10 min POSTeille), syötteiden
validointi, avain vain tiivisteenä. CORS sallii `https://app.digiopo.fi`
(samaorigin-kutsut toimivat myös Preview-osoitteissa).

## B4. Yleiset hallintatehtävät (Supabase SQL Editor)

**Listaa ryhmät:**
```sql
select ryhmakoodi, koulukoodi, nimi, luotu_at from opetusryhmat order by luotu_at desc;
```

**Katso ryhmän tallennetut järjestykset:**
```sql
select luokka, jarjestys, muokattu_at from jarjestykset where ryhmakoodi = 'K3M-9PQ2';
```

**Opettaja unohti avaimensa** — avainta ei voi palauttaa (vain tiiviste
tallessa). Vaihtoehdot:
- Poista ryhmä, jolloin opettaja luo uuden (oppilaille uusi linkki):
  ```sql
  delete from opetusryhmat where ryhmakoodi = 'K3M-9PQ2';  -- poistaa myös järjestykset (cascade)
  ```
- TAI nollaa avain uuteen arvoon ilman ryhmän poistoa. Tiiviste lasketaan
  `sha256( PEPPER || ':' || avain )`. Aseta haluttu uusi avain esim. funktiolla:
  ```sql
  -- vaatii pgcrypto-laajennoksen
  update opetusryhmat
    set avain_hash = encode(digest('<PEPPER>' || ':' || '<uusi_avain>', 'sha256'), 'hex')
  where ryhmakoodi = 'K3M-9PQ2';
  ```
  Korvaa `<PEPPER>` Vercelin `JARJESTYS_PEPPER`-arvolla (tai tyhjä, jos ei
  asetettu) ja `<uusi_avain>` opettajan uudella avaimella.

**Tyhjennä yhden luokan järjestys (palauta oletukseen):**
```sql
delete from jarjestykset where ryhmakoodi = 'K3M-9PQ2' and luokka = '7';
```

## B5. Vianetsintä

| Oire | Todennäköinen syy / korjaus |
|------|------------------------------|
| Oppilas näkee oletusjärjestyksen | Ei avannut `?ryhma=`-linkkiä, tai ryhmälle ei ole tallennettu järjestystä tälle luokalle |
| "Tallennus epäonnistui" opettajalla | Tarkista että `supabase_jarjestys.sql` on ajettu ja env-muuttujat asetettu; katso Vercelin funktiolokit |
| "Avain ei täsmää tähän ryhmään" | Väärä opettaja-avain, tai `JARJESTYS_PEPPER` muutettu ryhmän luonnin jälkeen |
| Kaikki avaimet lakkasivat toimimasta | `JARJESTYS_PEPPER` muuttunut — palauta entinen arvo, tai nollaa avaimet (B4) |
| 429 / "liikaa_yrityksia" | Rate limit; odota ~10 min |

## B6. Turvallisuus — huomiot

- Opettaja-avain on **luokkahuonekäyttöön sopiva PIN**, ei pankkitason suojaus.
  Tallennetaan vain tiivisteenä. Tämä oli tietoinen valinta kevyen,
  tilittömän mallin puolesta.
- Oppilaalla on vain lukuoikeus ryhmäkoodilla; hän ei voi muuttaa järjestystä.
- Service key pysyy palvelimella; selaimelle ei koskaan välitetä Supabase-avaimia.
- Mahdolliset vahvistukset jatkossa: oikea Supabase Auth (Vaihe 3), avaimen
  lukitus liian monen yrityksen jälkeen, ryhmäkohtainen vanheneminen.
