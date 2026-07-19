# 03 – Tietokanta

DigiOpon tietokanta on Supabasen PostgreSQL. Kaikki taulut ovat suljettuja:
RLS on päällä ja pääsykäytäntö on `using(false)`, eli **mikään ei pääse tauluihin
suoraan** — ei selain, ei anon-avain. Ainoa reitti sisään on palvelinfunktio
`service_role`-avaimella.

Skeema on hajautettu 18 SQL-tiedostoon, jotka ajetaan Supabasen SQL Editorissa
käsin. Migraatiotyökalua ei ole.

---

## 1. Ajojärjestys

Järjestyksellä on väliä: osa tiedostoista viittaa aiemmin luotuihin tauluihin ja
funktioihin. Aja nämä ylhäältä alas.

| # | Tiedosto | Luo / muuttaa | Riippuu |
|---|---|---|---|
| 1 | `supabase_schema.sql` | `lisenssit`, funktio `paivita_muokattu_at()` | — |
| 2 | `supabase_jarjestys.sql` | `opetusryhmat`, `jarjestykset` | 1 (funktio) |
| 3 | `supabase_opettajatili_vaihe1.sql` | `opetusryhmat.omistaja_email` | 2 |
| 4 | `supabase_poista_pin.sql` | pudottaa `opetusryhmat.avain_hash` | 2, 3 |
| 5 | `supabase_lukuvuosi_aikataulu.sql` | `lukuvuosi_tapahtumat` | 1, 2 |
| 6 | `supabase_lisenssi_kirjaukset.sql` | `lisenssi_kirjaukset` + 2 näkymää | 1 |
| 7 | `supabase_lisenssi_seuranta.sql` | `lisenssi_laitteet`, `lisenssit.paikat` | 1, 6 |
| 8 | `supabase_laskuri.sql` | `page_views`, funktio `kasvata_laskuri()` + 3 näkymää | — |
| 9 | `supabase_maailma_taulu.sql` | `maailma_ratkaisut` | — |
| 10 | `supabase_fake_insta.sql` | `fake_insta_profiilit` | — |
| 11 | `supabase_ammattiset.sql` | `ammattiset_tulostaulu`, `ammattiset_asetukset` | — |
| 12 | `supabase_tiedontemppeli.sql` | `tiedontemppeli_tulostaulu` | — |
| 13 | `supabase_tykkays_dedupe.sql` | `mt_tykkays_laite`, `fip_tykkays_laite`, `fip_tahti_laite` | **9, 10** |
| 14 | `supabase_admin_virheet.sql` | `api_virheet` + siivousfunktio | — |
| 15 | `supabase_admin_viestit.sql` | `admin_viestit` | — |
| 16 | `supabase_siivous_cron.sql` | pg_cron-ajastukset | **kaikki edelliset** |

Kaikki tiedostot ovat idempotentteja (`create table if not exists`,
`create or replace`, `add column if not exists`), joten uudelleenajo on
turvallista eikä tuhoa dataa.

### Tiedostot joita EI ajeta tuoreeseen asennukseen

| Tiedosto | Miksi ohitetaan |
|---|---|
| `supabase_lukuvuosi_luokka_migraatio.sql` | Lisää `luokka`-sarakkeen `lukuvuosi_tapahtumat`-tauluun. Sarake on jo mukana tiedoston 5 `create table` -lauseessa, joten migraatio on tarpeeton uudessa kannassa. Se on olemassa vain vanhoja asennuksia varten. |
| `supabase_KAIKKI_uudet_29-6.sql` | Historiallinen koostetiedosto 29.6.2026. Sisältö on täysin päällekkäinen modulaaristen tiedostojen kanssa (tarkistettu rivivertailulla). Merkitty varoitusotsikolla. |

---

## 2. Kaksi kohtaa joissa järjestys oikeasti kaatuu

**`supabase_tykkays_dedupe.sql` ennen pelitauluja.** Tiedosto luo
vieras avain -viittaukset tauluihin `maailma_ratkaisut` ja
`fake_insta_profiilit`. Jos ajat sen ennen tiedostoja 9 ja 10, ajo kaatuu
virheeseen `relation does not exist`.

**`supabase_poista_pin.sql` ennen koodin julkaisua.** Tiedosto pudottaa
`opetusryhmat.avain_hash`-sarakkeen. Tuoreessa asennuksessa tämä on vaaraton,
mutta olemassa olevaan tuotantoon sitä **ei saa ajaa ennen kuin uusi koodi on
julkaistu** — vanha käynnissä oleva koodi yrittäisi yhä lukea saraketta.
Tämä varoitus on kirjattu myös itse tiedostoon.

---

## 3. Taulut

### Lisenssit ja käyttö

| Taulu | Sisältö |
|---|---|
| `lisenssit` | Myydyt lisenssit: koodi, koulu, yhteyshenkilö, tyyppi (`testi`/`vuosi`/`kunta`), voimassaolo, `paikat` (myydyt paikat) |
| `lisenssi_kirjaukset` | Loki jokaisesta onnistuneesta kirjautumisesta: koodi, aika, IP, user agent |
| `lisenssi_laitteet` | Laitekohtainen seuranta, yksi rivi per koodi + laite. Perustuu selaimen pysyvään satunnaistunnisteeseen `digiopo_laite` |

### ⚠️ `koodi` ja `tyyppi` – kaksi helppoa väärinymmärrystä

**`tyyppi` ei rajoita pääsyä mitenkään.** `api/lisenssi.js` hakee lisenssin
pelkällä koodilla (`?koodi=eq.<koodi>`) ja tarkistaa vain `aktiivinen`- ja
`voimassa_asti`-kentät. Tyyppi valitaan mukaan kyselyyn, mutta sitä ei käytetä
porttina. Nimi `testi` antaa siis vaikutelman rajoitetusta oikeudesta, vaikka
sellainen lisenssi avaa koko sisällön. Kenttä on raportointia varten.

**`koodi` tarkoittaa eri asiaa eri lisenssityypeissä:**

| Tyyppi | Mikä `koodi` on |
|---|---|
| `testi`, `vuosi`, `kunta` | Koulun jaettu **salasana**. Oppilas kirjoittaa sen `liity.html`-porttiin |
| `opettaja` | Pelkkä rivin tunniste. Kirjautuminen tapahtuu sähköpostilla Supabase Authin kautta, koodia ei syötetä minnekään |

Käytännön seuraus: koulukoodin on oltava arvaamaton. Koodit tallennetaan
isoilla kirjaimilla, koska haku muuntaa syötteen `toUpperCase()`-metodilla.

Arvaamattoman koodin voi luoda näin:

```sql
update lisenssit
set koodi = 'DIGIOPO-' || upper(substr(md5(random()::text), 1, 8))
where koodi = 'VANHA-KOODI'
returning koodi, koulu;
```

`returning` näyttää uuden arvon vain kerran – ota se heti talteen.

---

**Laitemäärän tulkinta on suuntaa-antava**, ei päälukumäärä: yksi oppilas kahdella
laitteella näkyy kahtena, selaimen tyhjennys luo uuden laitteen, ja luokan
yhteiskone näkyy yhtenä vaikka käyttäjiä on monta. Seuranta ei estä mitään —
se vain vertaa käyttöä `paikat`-kenttään ylikäyttöhälytystä varten.

### Opetusryhmät

| Taulu | Sisältö |
|---|---|
| `opetusryhmat` | Ryhmäkoodi (jaetaan oppilaille), `omistaja_email`, koulukoodi, nimi |
| `jarjestykset` | Osioiden järjestys ja lukitukset per ryhmä + luokka-aste (7/8/9), jsonb |
| `lukuvuosi_tapahtumat` | Koulukohtainen lukuvuosikalenteri per ryhmä + luokka-aste |

Molemmat viimeiset viittaavat `opetusryhmat`-tauluun `on delete cascade`
-säännöllä: ryhmän poisto vie mukanaan järjestykset ja tapahtumat.

**Opettajalisenssejä rajoittaa osittainen uniikki-indeksi**
`lisenssit_opettaja_email_idx`: yksi opettajalisenssi per sähköposti.
`api/lisenssi.js` hakee lisenssin kyselyllä `?email=eq.<email>&tyyppi=eq.opettaja`
ja ottaa `data[0]` ilman `order by` -lauseketta, joten duplikaatit tekisivät
kirjautumisesta arvaamatonta. Koulukoodeja rajoite ei koske – sama
yhteyshenkilö voi olla usean koulun lisenssissä.

**Valtuutusmalli muuttui heinäkuussa 2026.** Aiemmin ryhmää hallittiin
salaisella opettaja-avaimella, joka tallennettiin SHA-256-tiivisteenä
(`avain_hash`). PIN-logiikka on poistettu kokonaan. Nyt hallintaoikeus
todetaan vertaamalla allekirjoitetusta evästeestä luettua sähköpostia ryhmän
`omistaja_email`-kenttään (`api/_lib/opettaja.js`). Oppilaan lukuoikeus on yhä
julkinen pelkällä ryhmäkoodilla.

### Pelit ja tehtävät

| Taulu | Peli |
|---|---|
| `maailma_ratkaisut` | Maailma tarvitsee sinua – oppilaiden ratkaisut ja tykkäykset |
| `fake_insta_profiilit` | Fake-insta – profiilit, tykkäykset, tähdet |
| `ammattiset_tulostaulu`, `ammattiset_asetukset` | Ammattiset |
| `tiedontemppeli_tulostaulu` | Tiedon temppeli |
| `mt_tykkays_laite`, `fip_tykkays_laite`, `fip_tahti_laite` | Dedupe: estävät saman laitteen toistuvat tykkäykset |

### Ylläpito

| Taulu | Sisältö |
|---|---|
| `page_views` | Käyntilaskuri, shardattu (ks. kohta 5) |
| `api_virheet` | Palvelinfunktioiden virheet. Näkyvät hallintapaneelin Vikatilanteet-osiossa |
| `admin_viestit` | Loki hallintapaneelista lähetetyistä massaviesteistä |

---

## 3b. Skeeman ajautuminen – korjattu 19.7.2026

Tuotantokanta ja SQL-tiedostot olivat eronneet toisistaan molempiin suuntiin.
Ongelma havaittiin, kun cron-hälytys ilmoitti virheestä
`Supabase virhe (ylikäyttö): 404`.

| Havainto | Suunta | Korjaus |
|---|---|---|
| `lisenssi_kaytto`-näkymä puuttui tuotannosta | tiedostossa, ei kannassa | `supabase_lisenssi_seuranta.sql` ajettu tuotantoon |
| `lisenssi_laitteet`-taulu puuttui tuotannosta | tiedostossa, ei kannassa | Sama ajo. Laiteseuranta oli epäonnistunut hiljaa (fire-and-forget try/catch) – historiadataa ei ole |
| `tyyppi`-rajoite salli `opettaja` | kannassa, ei tiedostossa | `supabase_schema.sql` päivitetty. Ilman tätä opettajakirjautuminen ei toimisi tuoreessa asennuksessa lainkaan |
| `page_views`-taulua ei luotu missään | kannassa, ei tiedostossa | `create table` lisätty `supabase_laskuri.sql`-tiedoston alkuun tuotannon rakenteen mukaisena |

Tarkistettu jälkikäteen: kaikki 17 taulua ja 6 näkymää ovat olemassa
tuotannossa, ja tiedostot vastaavat nyt niitä.

**Opetus:** kantaan ei saa ajaa käsin mitään, mikä ei ole SQL-tiedostossa.
Muuten projektia ei voi pystyttää tyhjästä eikä luovuttaa eteenpäin.

Tarkistuskysely, jolla vertailun voi toistaa milloin tahansa, on kohdassa 7.

---

## 4. Näkymät

Nämä ovat Supabasen Table Editorissa suoraan luettavia yhteenvetoja:

| Näkymä | Lähde |
|---|---|
| `kirjautumiset_koodittain` | Kirjautumiset per lisenssikoodi, ensimmäinen ja viimeisin |
| `viimeisimmat_kirjautumiset` | 100 tuoreinta kirjautumista |
| `kayntimaarat` | Käyntimäärät sivuittain |
| `viikon_kayntimaarat` | Viikkotaso |
| `paivittainen_yhteenveto` | Päivätaso |

---

## 5. Käyttölaskuri on shardattu

Funktio `kasvata_laskuri()` ei päivitä yhtä riviä per sivu ja päivä, vaan
kirjoittaa satunnaiseen bucketiin 0–19. Syy on kuuma rivi: kun tuhat oppilasta
avaa saman sivun samaan aikaan, yhteen riviin kohdistuvat UPDATEt jonottavat
rivilukkoon ja aiheuttavat timeoutteja. Sharding jakaa kirjoitukset 20 riville.

Näkymät summaavat bucketit takaisin yhteen, joten jaottelu ei näy raportoinnissa.

---

## 6. Automaattinen siivous (pg_cron)

`supabase_siivous_cron.sql` luo kaksi ajastusta. Ne pyörivät Supabasen sisällä
eivätkä kuluta Vercelin 12 funktion kiintiötä.

| Ajo | Aika | Tekee |
|---|---|---|
| `digiopo_siivoa` | 1. ja 15. päivä klo 03:00 | Rutiinisiivous: vanha raakadata pois |
| `digiopo_suursiivous` | 1.8. klo 04:00 | Nollaa pelien tulostaulut uutta lukuvuotta varten |

Jos `create extension pg_cron` antaa oikeusvirheen, ota laajennus ensin käyttöön:
Supabase-dashboard → Database → Extensions → `pg_cron` → Enable, ja aja tiedosto
uudelleen.

---

## 7. Ennen tuotantoa

⚠️ **`supabase_schema.sql` lisää kaksi testilisenssiä**, `TESTI-2026` ja
`KOULU-2026`. Ne on poistettava tai deaktivoitava ennen kuin sivusto avataan
julkisesti — muuten kuka tahansa pääsee maksumuurin läpi arvattavalla koodilla.

```sql
delete from lisenssit where koodi in ('TESTI-2026', 'KOULU-2026');
```

Tarkistuslista:

- [ ] Testilisenssit poistettu
- [ ] `select * from pg_policies where schemaname = 'public';` — jokaisella
      taululla on `using(false)`-käytäntö
- [ ] `service_role`-avain on vain Vercelin ympäristömuuttujissa, ei koodissa
- [ ] pg_cron-laajennus käytössä ja ajastukset näkyvät: `select * from cron.job;`
- [ ] Skeemavertailu alla ei palauta rivejä

### Skeemavertailu

Palauttaa vain puuttuvat rakenteet. Tyhjä tulos = kanta vastaa tiedostoja.

```sql
with odotetut(nimi, laji) as (values
  ('lisenssit','taulu'), ('lisenssi_kirjaukset','taulu'), ('lisenssi_laitteet','taulu'),
  ('opetusryhmat','taulu'), ('jarjestykset','taulu'), ('lukuvuosi_tapahtumat','taulu'),
  ('maailma_ratkaisut','taulu'), ('fake_insta_profiilit','taulu'),
  ('ammattiset_tulostaulu','taulu'), ('ammattiset_asetukset','taulu'),
  ('tiedontemppeli_tulostaulu','taulu'), ('mt_tykkays_laite','taulu'),
  ('fip_tykkays_laite','taulu'), ('fip_tahti_laite','taulu'),
  ('api_virheet','taulu'), ('admin_viestit','taulu'), ('page_views','taulu'),
  ('kirjautumiset_koodittain','nakyma'), ('viimeisimmat_kirjautumiset','nakyma'),
  ('lisenssi_kaytto','nakyma'), ('kayntimaarat','nakyma'),
  ('viikon_kayntimaarat','nakyma'), ('paivittainen_yhteenveto','nakyma')
)
select o.nimi, o.laji
from odotetut o
left join information_schema.tables t
  on t.table_schema = 'public' and t.table_name = o.nimi
where t.table_name is null
order by o.laji, o.nimi;
```
