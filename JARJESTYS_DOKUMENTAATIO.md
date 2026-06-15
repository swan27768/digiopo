# DigiOpo — Osiorakenne ja osioiden järjestely

Tämä dokumentti kokoaa yhteen kesäkuussa 2026 tehdyn työn: luokkasivujen
osiorakenteen yhtenäistämisen sekä opettajan osiojärjestely-ominaisuuden
(Vaihe 1 + Vaihe 2). Tarkoitettu sekä ylläpitäjälle että tulevalle kehittäjälle.

---

## 1. Yhteenveto

Kolmelle luokkasivulle (`sivut/7luokka.html`, `8luokka.html`, `9luokka.html`)
tehtiin kaksi kokonaisuutta:

1. **Rakenteen yhtenäistäminen** — teemaosioille yhteinen tunniste, kaksi
   osioparia yhdistettiin yhdeksi, ja vanhentunut osio poistettiin.
2. **Järjestely-ominaisuus** — opettaja voi raahata osiot haluamaansa
   järjestykseen. Vaihe 1 tallentaa järjestyksen selaimeen; Vaihe 2 jakaa sen
   oppilaille Supabasen kautta.

Keskeinen periaate: **vain opettaja järjestää, ja vain osioita — ei tehtäviä.**
Tehtävät pysyvät kunkin osion sisällä alkuperäisessä järjestyksessä.

---

## 2. Rakenteen yhtenäistäminen

### 2.1 Teematunnisteet (`data-teema`)
Jokainen teemaosio sai attribuutin `data-teema`, joka kertoo mihin neljästä
yhteisestä teemasta osio kuuluu. Sama teema voi toistua saman luokan sisällä,
joten teema **ei** ole sama kuin osion id.

| Teema | Esiintyy osioissa |
|-------|-------------------|
| `opiskelutaidot` | 7lk: opiskelutaidot, mina-oppijana · 8lk: klinikka · 9lk: ajattelu, paatoksenteko |
| `vahvuudet` | 7lk: omat-vahvuudet · 8lk: vahvuudet |
| `tet` | 8lk: tet · 9lk: tet |
| `tulevaisuus` | 7lk: tulevaisuus · 8lk: tulevaisuus · 9lk: tulevaisuus |

Otsikoita ja id:itä **ei** muutettu — vain attribuutti lisättiin.

### 2.2 Yhdistetyt osiot ja ala-osiot
Kaksi osioparia yhdistettiin yhdeksi osioksi käyttäen uutta **ala-osio**-mallia:

- **7lk johdanto** = entiset `mita-on-opo` + `tervetuloa`. "Yläkoulun startti"
  on nyt ala-osio (`<div id="tervetuloa" class="ala-osio">`) johdannon sisällä.
- **9lk tulevaisuus** = entiset `tulevaisuus-mina` + `tulevaisuus`. "Case: Vesi
  2045" on ala-osio (`<div class="ala-osio" data-osio="tulevaisuus-vesi">`).

Ala-osio säilyttää oman otsikkonsa, tehtävänsä ja "tieteellinen tausta"
-lähdenappinsa. Tätä varten `js/osio-rakenne.js`:ää laajennettiin: se käsittelee
nyt myös elementit, joilla on `data-osio`-attribuutti, ja liittää niille teoria-
ja tavoite/yhteenvetopaneelit samalla logiikalla kuin tavallisille osioille.
Tyylit ala-osiolle ovat `css/osio-rakenne.css`:n lopussa (`.ala-osio`).

### 2.3 Poistettu
- 7lk:n `tiedon-temppeli`-osio (oli jo aiemmin poistettu; jäljellä vain pelin
  iframe-linkki).
- Luonnos-/varakopiot `sivut/`-kansiosta: `7luokka_A/B/C.html`, `proto_7lk.html`,
  `proto_8lk.html`, `proto_9lk.html`.

---

## 3. Järjestely — Vaihe 1 (raahaus + localStorage)

**Tiedostot:** `js/jarjestys.js`, `css/jarjestys.css` (linkitetty kaikilla
kolmella sivulla).

### Miten se toimii
- Muokkaustila avautuu vain osoitteella **`?ope=1`**, esim.
  `…/7luokka.html?ope=1`. Ilman parametria oppilas ei näe raahausta.
- Muokkaustilassa jokaiseen osioon tulee raahauskahva (⠿) ja alas banneri.
  Raahaus toteutetaan **SortableJS**-kirjastolla (ladataan CDN:stä vain
  muokkaustilassa).
- Järjestys tallentuu selaimen localStorageen avaimella
  `digiopo-jarjestys-<luokka>` ja sovelletaan jokaisella latauksella
  siirtämällä `<section>`-elementit DOM:ssa (jolloin maskotti, scroll-tunnistus
  ja sisällysluettelo toimivat automaattisesti oikein).
- "Palauta oletus" -nappi tyhjentää tallennuksen ja palauttaa HTML:n mukaisen
  alkuperäisen järjestyksen.

Vaihe 1 toimii ilman backendiä ja on testattu paikallisesti.
Rajoite: järjestys on **selainkohtainen** — ei seuraa laitteesta toiseen eikä
näy oppilaille. Sen ratkaisee Vaihe 2.

---

## 4. Järjestely — Vaihe 2 (jako oppilaille)

**Tiedostot:** `supabase_jarjestys.sql`, `api/jarjestys.js`, laajennettu
`js/jarjestys.js`. Käyttöönotto-ohje: **`VAIHE2_KAYTTOONOTTO.md`**.

### Arkkitehtuuri
Sama kaava kuin lisenssintarkistuksessa — selain ei koskaan puhu suoraan
Supabaseen:

```
Selain ──> /api/jarjestys (Vercel, SUPABASE_SERVICE_KEY) ──> Supabase
```

### Tunnistus
Kevyt koodimalli (ei tilejä, ei sähköposteja):
- **Ryhmäkoodi** — jaetaan oppilaille (esim. `K3M-9PQ2`). Antaa lukuoikeuden.
- **Opettaja-avain** — salainen PIN (väh. 4 merkkiä). Vaaditaan tallennukseen.
  Tallennetaan tietokantaan vain SHA-256-tiivisteenä (+ valinnainen
  `JARJESTYS_PEPPER`-suola).

### Tietokanta (`supabase_jarjestys.sql`)
- `opetusryhmat(ryhmakoodi, avain_hash, koulukoodi, nimi, …)`
- `jarjestykset(ryhmakoodi, luokka, jarjestys jsonb, …)` — yksi rivi per ryhmä
  + luokka-aste. `jarjestys` on lista osio-id:itä.
- RLS estää kaiken julkisen pääsyn (vain service_key API:n kautta).

### API (`api/jarjestys.js`)
- `GET /api/jarjestys?ryhma=KOODI&luokka=7` → järjestys (julkinen luku).
- `POST` `{toiminto:"rekisteroi", avain}` → luo ryhmän, palauttaa ryhmäkoodin.
- `POST` `{toiminto:"tallenna", ryhma, avain, luokka, jarjestys}` → tallentaa
  (vaatii oikean avaimen). Rate limit + CORS kuten `api/lisenssi.js`.

### Käyttö
- Opettaja (`?ope=1`): "Luo jakoryhmä" → antaa avaimen → saa ryhmäkoodin ja
  oppilaan linkin → "Tallenna oppilaille" julkaisee järjestyksen.
- Oppilas: avaa `?ryhma=KOODI`-linkin kerran → liittymä tallentuu selaimeen →
  sivu hakee ja näyttää opettajan järjestyksen kaikilla laitteilla.

Sama ryhmäkoodi ja avain toimivat kaikilla luokka-asteilla; järjestys
tallennetaan erikseen kullekin (7/8/9).

---

## 5. Käyttöönotto (Vaihe 2)

Tiivistelmä — täydet ohjeet `VAIHE2_KAYTTOONOTTO.md`:ssä.

1. **Supabase:** aja `supabase_jarjestys.sql` SQL Editorissa. *(Tehty.)*
2. **Vercel-ympäristömuuttuja:** lisää valinnainen `JARJESTYS_PEPPER`
   (Production + Preview). `SUPABASE_URL` ja `SUPABASE_SERVICE_KEY` ovat jo
   käytössä. *(Tehty.)*
3. **Julkaisu:** vie haara `jarjestys-ominaisuus` tuotantoon (merge mainiin +
   deploy). *(Kesken — odottaa julkaisua.)*

---

## 6. Nykytila ja jatko

### Tila
- Rakennemuutokset ja Vaihe 1: valmiita, yhdistetty `main`-haaraan paikallisesti.
- Vaihe 2: koodi valmis, committattu ja pushattu GitHubiin haaraan
  `jarjestys-ominaisuus`. **Ei vielä julkaistu Verceliin** (automaattijulkaisu
  on toistaiseksi pois päältä). Vaihetta 2 ei ole vielä testattu, koska se
  vaatii API:n + Supabasen (eli julkaisun).

### Kun haluat julkaista ja testata
Kytke Vercelin automaattijulkaisu takaisin päälle tai käynnistä julkaisu käsin,
ja testaa `VAIHE2_KAYTTOONOTTO.md`:n vaiheiden D ja E mukaan (opettaja luo
ryhmän ja julkaisee; oppilas avaa linkin toisessa selaimessa).

### Mahdolliset jatkokehitykset
- Opettajan "kirjaudu olemassa olevaan ryhmään" -nappi toiselle laitteelle
  (ryhmäkoodi + avain uudelleen).
- Ryhmäkoodin syöttö oppilaalle lisenssiportin yhteyteen (nyt vain linkin kautta).
- Vaihe 3: varsinainen Supabase Auth, jos halutaan vahvempi opettajaidentiteetti.
- Teeman (`data-teema`) hyödyntäminen esim. värikoodaukseen tai teemoittaiseen
  järjestelyyn.

---

## 7. Muutetut ja luodut tiedostot

**Uudet:**
`js/jarjestys.js`, `css/jarjestys.css`, `api/jarjestys.js`,
`supabase_jarjestys.sql`, `VAIHE2_KAYTTOONOTTO.md`, `JARJESTYS_DOKUMENTAATIO.md`

**Muokatut:**
`sivut/7luokka.html`, `sivut/8luokka.html`, `sivut/9luokka.html`,
`js/osio-rakenne.js`, `js/osio-data-9lk.js`, `css/osio-rakenne.css`

**Poistetut:**
`sivut/7luokka_A.html`, `7luokka_B.html`, `7luokka_C.html`,
`sivut/proto_7lk.html`, `proto_8lk.html`, `proto_9lk.html`
