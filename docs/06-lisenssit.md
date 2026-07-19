# 06 – Lisenssien hallinta

Käytännön ohje: miten lisenssi luodaan, toimitetaan, seurataan ja suljetaan.

Tietokannan rakenne on osiossa [03](03-tietokanta.md), maksumuurin tekninen
toiminta osiossa [04](04-arkkitehtuuri.md).

---

## 1. Lisenssityypit

| Tyyppi | Kirjautuminen | `koodi` on |
|---|---|---|
| `kunta`, `vuosi` | Koulukoodi `liity.html`-portissa | Koulun jaettu **salasana** |
| `testi` | Sama | Sama |
| `opettaja` | Sähköposti Supabase Authin kautta | Pelkkä tunniste, ei käytössä |

⚠️ **`tyyppi` ei rajoita pääsyä.** Myös `testi` avaa koko sisällön. Kenttä on
raportointia varten. Ainoat portit ovat `aktiivinen` ja `voimassa_asti`.

---

## 2. Uuden koulun lisenssi

Kun kunta tai koulu ostaa, luodaan **kaksi asiaa**: koulukoodi oppilaille ja
opettajalisenssi jokaiselle opettajalle.

### Vaihe 1 – koulukoodi

```sql
insert into lisenssit
  (koodi, koulu, yhteyshenkilö, email, tyyppi, voimassa_asti, aktiivinen, paikat)
values
  ('DIGIOPO-' || upper(substr(md5(random()::text), 1, 8)),
   'Mäyrälän koulu', 'Matti Meikäläinen', 'matti@mayrala.fi',
   'vuosi', '2027-07-31', true, 150)
returning koodi;
```

`returning koodi` näyttää arvotun koodin **vain kerran** – ota se heti talteen.

### Vaihe 2 – opettajalisenssit

```sql
insert into lisenssit
  (koodi, koulu, yhteyshenkilö, email, tyyppi, voimassa_asti, aktiivinen)
values
  ('OPE-MAYRALA-1', 'Mäyrälän koulu', 'Matti Meikäläinen',
   'matti@mayrala.fi', 'opettaja', '2027-07-31', true);
```

Opettajan on lisäksi löydyttävä **Supabase Authentication → Users** -listalta
samalla sähköpostilla. Pelkkä lisenssirivi ei riitä.

### ⚠️ Koulunimen on täsmättävä täsmälleen

`koulu`-kenttä on se avain, jolla oppilaiden työt rajataan opettajalle
(fake-insta, maailma-taulu). Jos koulukoodissa lukee `"Mäyrälän koulu"` ja
opettajalisenssissä `"Mäyrälä"`, opettaja näkee tyhjän listan eikä saa mitään
virheilmoitusta.

Tarkista aina lisäyksen jälkeen:

```sql
select koulu, tyyppi, count(*)
from lisenssit
group by koulu, tyyppi
order by koulu;
```

Saman koulun rivien on oltava täsmälleen samalla kirjoitusasulla.

---

## 3. Koodin muoto

**Ostetut lisenssit luodaan automaattisesti**, ei käsin. Tilauslomake
`digiopo.fi/tilauslomake.html` kutsuu `digiopo-home/api/tilaus.js`-funktiota,
joka generoi koodin, tallentaa lisenssin, lähettää koodin asiakkaalle ja
laskun erikseen.

| Tyyppi | Muoto | Esimerkki |
|---|---|---|
| Koululisenssi | `KOULUNIMI-VUOSI-XXXX` | `MÄYRÄLÄN-2027-A7K2` |
| Opettajalisenssi | `OPE-VUOSI-XXXXXX` | `OPE-2027-SF8QFH` |

Satunnaisosa käytetään aakkostosta `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` –
sekaantuvat merkit (I, O, 0, 1, L) on jätetty pois, jotta koodin voi sanella
puhelimessa. Koululisenssissä 4 merkkiä (noin miljoona vaihtoehtoa),
opettajalisenssissä 6 (noin miljardi).

Koulun nimi koodin alussa on tarkoituksellinen: se tekee koodista
tunnistettavan, eikä se heikennä turvallisuutta, koska koulun nimi on
julkinen tieto. Arvaamattomuus tulee satunnaisosasta.

Koodit tallennetaan **isoilla kirjaimilla**, koska haku muuntaa syötteen
`toUpperCase()`-metodilla.

### Käsin luodut koodit

Jos luot koodin itse (testaajat, erikoistapaukset), käytä satunnaista:

```sql
'DIGIOPO-' || upper(substr(md5(random()::text), 1, 8))
```

**Älä käytä ennustettavaa kaavaa.** Aiemmin käsin luotuja koodeja oli muodossa
`ELLSA-160626` (etunimi + päivämäärä) ja `TESTI-2026`. Kun näkee yhden, kaavan
päättelee. Ne satunnaistettiin 19.7.2026.

---

## 3b. Tilausautomaatio (`digiopo-home/api/tilaus.js`)

Lisenssit syntyvät kahdesta lähteestä: tilauslomakkeelta automaattisesti ja
käsin SQL:llä. **Molemmat kirjoittavat samaan `lisenssit`-tauluun eri
projekteista.** Kannan rajoitteita muutettaessa on tarkistettava molemmat.

| Tilaustyyppi | Mitä syntyy |
|---|---|
| Koululisenssi | `tyyppi='vuosi'`, koodi generoidaan, `paikat` = tilattu oppilasmäärä |
| Opettajalisenssi | `tyyppi='opettaja'`, koodi generoidaan (ei käytössä kirjautumisessa) |

**Uusintatilaus päivittää olemassa olevaa opettajalisenssiä**, ei luo uutta.
Voimassaolo jatkuu nykyisestä päättymispäivästä, jos lisenssi on yhä voimassa –
näin ajoissa uusiva asiakas ei menetä jäljellä olevaa aikaa. Vanhentuneella
lisenssillä lasketaan tilauspäivästä.

### Korjattu 19.7.2026

Kaksi vikaa löytyi, kun tilausautomaatio tarkistettiin osion 06 kirjoittamisen
yhteydessä:

1. **Opettajalisenssitilaus ei ollut koskaan voinut onnistua.** `INSERT` tehtiin
   ilman `koodi`-kenttää, joka on `NOT NULL`. Jokainen tilaus kaatui, asiakas
   näki "Palvelinvirhe – yritä uudelleen", eikä laskua lähetetty. Nyt koodi
   generoidaan (`generoi_opettaja_koodi`).
2. **Uusintatilaus olisi kaatunut uniikkiin indeksiin.** Duplikaattisuoja kattoi
   vain 3 minuuttia (tuplaklikkauksen esto). Nyt olemassa oleva rivi päivitetään.

Samalla korjattiin duplikaattisuoja huomioimaan lisenssin tyyppi: aiemmin sama
henkilö ei voinut tilata koululisenssiä ja opettajalisenssiä kolmen minuutin
sisällä – jälkimmäinen kuitattiin duplikaatiksi eikä lisenssiä syntynyt.

### Tiedossa olevat rajoitteet

- **Rate limit on muistipohjainen** (`Map`), joten se nollautuu cold startissa
  eikä päde serverless-instanssien yli. Matalavolyymiselle lomakkeelle riittävä,
  mutta ei todellinen suoja.
- **Kolmen vuoden lisenssi merkitään tyypiksi `vuosi`.** `voimassa_asti` on
  oikein, mutta raportointi näyttää sen vuosilisenssinä. Tyyppi `kunta` ei ole
  käytössä lainkaan.
- **Laskunumeroa ei tallenneta tietokantaan.** Se generoidaan, lähetetään
  sähköpostissa ja unohtuu. Laskutushistoria on vain lähetetyissä viesteissä.

---

## 4. Voimassaolo

Pääsy päättyy itsestään, kun `voimassa_asti` menee ohi. Tämä on parempi kuin
muistaa sulkea lisenssi käsin.

| Tilanne | Suositus |
|---|---|
| Kokeilu / testaaja | 30 päivää |
| Lukuvuosilisenssi | 31.7. |
| Kuntasopimus | Sopimuskauden loppu |

Vanhentuneen lisenssin voi jättää tauluun – se ei enää päästä sisään. Rivin
säilyttäminen on hyödyllistä: myyntihistoria ja uusinnat näkyvät.

Hallintapaneeli näyttää erikseen **pian vanhenevat**, eli aktiiviset lisenssit
joiden `voimassa_asti` on seuraavan 30 päivän sisällä
(`api/admin-tilastot.js`). Tämä on uusintamyynnin työjono.

---

## 5. Paikkamäärä ja ylikäytön seuranta

`paikat` = montako käyttöpaikkaa on myyty. Kenttä ei rajoita mitään – se on
vertailuluku hälytystä varten.

Näkymä `lisenssi_kaytto` laskee, montako **eri laitetta** on käyttänyt koodia
viimeisen 30 päivän aikana, ja vertaa sitä `paikat`-arvoon. Cron-ajo klo 06:00
lähettää sähköpostin ylittävistä riveistä.

Jos `paikat` on `null`, vertailua ei tehdä eikä hälytystä voi syntyä.

### Laitemäärä on suuntaa-antava

Laite tunnistetaan selaimen `localStorage`-tunnisteesta `digiopo_laite`. Luku
kasvaa myös ilman väärinkäyttöä:

- yksi oppilas läppärillä ja puhelimella → 2 laitetta
- selaimen tyhjennys tai incognito → uusi laite joka kerta
- selaimen vaihto → uusi laite

Luokan yhteiskone taas näkyy yhtenä, vaikka käyttäjiä on kolmekymmentä.
**Kyseessä ei siis ole päälukumäärä**, vaan karkea käytön laajuuden mittari.

### Mitä arvoa käyttää

| Lisenssi | `paikat` |
|---|---|
| Koulu / kunta | Myyty oppilasmäärä |
| Kokeilu yhdelle opettajalle | 3 – kattaa yhden ihmisen laitteet, hälyttää jos koodi jaetaan luokalle |
| Oma testikoodi | `null` – muuten oma testaus hälyttää itselleen |

Liian tiukka arvo (esim. 1) tuottaa vääriä hälytyksiä heti ensimmäisenä
päivänä, ja hälytys menettää merkityksensä kun se soi aina.

---

## 6. Lisenssin sulkeminen

```sql
update lisenssit set aktiivinen = false where koodi = 'DIGIOPO-XXXXXXXX';
```

Sulkeminen tehoaa **noin vuorokaudessa**, ei heti. Syy: lisenssieväste on
pitkäikäinen (~300 vrk), jotta oppilaan ei tarvitse kirjautua joka kerta.
`js/lisenssiportti.js` tekee 24 tunnin välein taustatarkistuksen, joka poistaa
evästeen jos lisenssi ei enää kelpaa.

Jos pääsy on katkaistava heti, ainoa keino on vaihtaa koodi – silloin
taustatarkistus ei löydä sitä ja eväste poistetaan seuraavassa tarkistuksessa.

### Koodin vaihdon jälkeen: ilmoita käyttäjille

Vanha koodi lakkaa toimimasta heti, mutta olemassa olevat istunnot jatkuvat
enintään vuorokauden. Sen jälkeen käyttäjät tippuvat ulos ilman selitystä.
**Lähetä uusi koodi ennen sitä.**

---

## 7. Koulunimen muuttaminen

Koulunimi leivotaan istuntoevästeeseen kirjautumishetkellä. Nimen korjaaminen
lisenssiin ei siis vaikuta jo avattuihin istuntoihin heti.

Vanhalla nimellä kirjautunut oppilas lähettää työnsä yhä vanhalla nimellä,
jolloin opettaja ei näe niitä. Nimi päivittyy:

- **automaattisesti vuorokaudessa** taustatarkistuksen kautta, tai
- **heti**, jos käyttäjä syöttää koodin uudelleen puhtaassa selaimessa

Jos vaihdat koulunimen, siirrä myös olemassa olevat työt:

```sql
update fake_insta_profiilit set koulu = 'Uusi nimi' where koulu = 'Vanha nimi';
update maailma_ratkaisut     set koulu = 'Uusi nimi' where koulu = 'Vanha nimi';
```

---

## 8. Massaviestit lisenssinhaltijoille

Hallintapaneelista (`api/admin-viesti.js`). Vastaanottajat: aktiiviset,
voimassa olevat, **`tyyppi != 'testi'`**, sähköpostit deduplikoituna.

Kolme suojaa ennen lähetystä:

1. `esikatselu` – kertoo vastaanottajamäärän lähettämättä mitään
2. `testi` – lähettää vain `ADMIN_EMAIL`-osoitteeseen
3. `laheta` – vaatii kentän `vahvistus: 'LAHETA'`, tarkistetaan palvelimella

Lähetykset kirjataan `admin_viestit`-tauluun.

---

## 9. Säännölliset tarkistukset

**Kuukausittain**

```sql
-- Pian vanhenevat (uusintamyynti)
select koodi, koulu, yhteyshenkilö, email, voimassa_asti
from lisenssit
where aktiivinen and voimassa_asti between current_date and current_date + 30
order by voimassa_asti;

-- Käyttö vs. myydyt paikat
select * from lisenssi_kaytto order by laitteita_30pv desc;
```

**Aina lisenssin lisäyksen jälkeen**

```sql
-- Koulunimien yhtenäisyys
select koulu, tyyppi, count(*) from lisenssit group by koulu, tyyppi order by koulu;

-- Ei duplikaatteja opettajilla (uniikki-indeksi estää, mutta varmistus)
select email, count(*) from lisenssit
where tyyppi = 'opettaja' group by email having count(*) > 1;
```

**Ennen kuin näytät kannan ulkopuoliselle**

```sql
-- Arvattavat koodit
select koodi, koulu, tyyppi from lisenssit
where koodi !~ '^(DIGIOPO-[0-9A-F]{8}|OPE-[0-9]{4}-[A-Z0-9]{6}|.+-[0-9]{4}-[A-Z0-9]{4})$';
```
