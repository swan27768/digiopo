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

Kun kunta tai koulu ostaa, tarvitaan **kaksi asiaa**: koulukoodi oppilaille ja
opettajalisenssi jokaiselle opettajalle.

> **Tilauslomakkeen kautta nämä syntyvät automaattisesti.** Kun koulu tilaa
> `digiopo.fi/tilauslomake.html`-lomakkeella, tilausautomaatio luo koulukoodin
> **ja** opettajalisenssin yhteyshenkilölle sekä jokaiselle lomakkeen "muiden
> opettajien sähköpostit" -kentässä listatulle opettajalle (ks. osio 3b). Käsin
> SQL:llä luonti on tarpeen enää vain **erikoistapauksissa**: pilottikoulut,
> testaajat, sekä opettajat jotka lisätään vasta tilauksen jälkeen.

Alla oleva käsin luonti kannattaa siis tehdä lähinnä silloin kun lisäät
yksittäisen opettajan jo tilanneelle koululle tai luot testilisenssin.

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

**Pelkkä lisenssirivi riittää.** Supabase Auth -käyttäjää ei tarvitse luoda
etukäteen: `kirjaudu.html` käyttää asetusta `shouldCreateUser: true`, joten
tili syntyy automaattisesti ensimmäisen kirjautumislinkin myötä. Käyttöoikeus
tarkistetaan palvelimella lisenssistä, ei Auth-käyttäjän olemassaolosta.

Sama henkilö voi hyvin olla sekä koulukoodin haltija että opettajalisenssin
omistaja – ne ovat eri rivejä ja eri tyyppejä. Uniikki-indeksi koskee vain
opettajalisenssejä.

### Miten opettaja kirjautuu ja näkee hallintapaneelin

Opettaja kirjautuu `app.digiopo.fi/kirjaudu.html`-sivulla **sähköpostilla**
(magic link), ei koodilla. Kirjautuminen sekä avaa maksumuurin että antaa
opettajaoikeudet, joten opettaja ei tarvitse koulukoodia lainkaan. Pääsy
edellyttää, että sähköpostilla on `opettaja`-tyyppinen lisenssi.

"Hallintapaneeli"-nappi (`js/opettaja-keskus.js`) näytetään **vain laitteilla
joilla on opettajan Supabase-kirjautumissessio** (`sb-*-auth-token`
localStoragessa). Pelkällä koulukoodilla kirjautuneet oppilaat – myös
`testi`-lisenssillä – eivät näe nappia. Tämä on kevyt selainpuolen suodatus;
todellinen valtuutus tarkistetaan silti palvelimella opettajaevästeestä
(`api/jarjestys` → `haeKirjautunutOpettaja`). Jos opettajan Supabase-sessio
katoaa selaimesta, nappi piiloutuu kunnes hän kirjautuu uudelleen.

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

## 3b. Tilausautomaatio (`digiopo-home/api/tilaus.js` + `_lib/tilaus-taytto.js`)

Lisenssit syntyvät kahdesta lähteestä: tilauslomakkeelta automaattisesti ja
käsin SQL:llä. **Molemmat kirjoittavat samaan `lisenssit`-tauluun eri
projekteista.** Kannan rajoitteita muutettaessa on tarkistettava molemmat.

Tilauslomakkeella on **yksi tuote** – koululisenssi, kaudella `vuosi`
(1 lukuvuosi) tai `3vuotta`. Kausi vaikuttaa vain hintaan ja `voimassa_asti`-
päivään, ei tyyppiin (myös 3 vuoden lisenssi tallentuu tyypillä `vuosi`).

Yhdestä tilauksesta syntyy:

| Rivi | tyyppi | Kenelle |
|---|---|---|
| Koulukoodi | `vuosi` | Oppilaille (jaettu koodi), `paikat` = tilattu oppilasmäärä |
| Opettajalisenssi | `opettaja` | Tilaajalle (yhteyshenkilön sähköposti) |
| Opettajalisenssi | `opettaja` | Jokaiselle lomakkeen "muut opettajat" -sähköpostille |

Opettajalisenssien koodi (`OPE-VUOSI-XXXXXX`) generoidaan mutta **ei ole
käytössä kirjautumisessa** – opettaja kirjautuu sähköpostilla (magic link), ei
koodilla. Jokainen automaattisesti luotu opettaja saa sähköpostiinsa
kirjautumisohjeen, ja tilaaja näkee ohjeen myös koulukoodisähköpostissaan.

### Maksutavan vaikutus voimassaoloon

| Maksutapa | Koulukoodi | Opettajalisenssit |
|---|---|---|
| Verkkomaksu (Paytrail) | Täysi kausi heti, `maksettu=true` | Täysi kausi |
| Lasku (kunnat) | 30 pv aluksi, jatkuu täyteen kun lasku maksetaan | **Täysi kausi heti** |

Laskupolussa opettajalisenssit saavat täyden kauden heti (ei 30 pv):
koulukoodin voimassaoloa jatketaan maksun tullessa `koodi`n perusteella, mutta
opettajalisenssillä on eri koodi eikä jatkomekanismia, joten 30 pv vanhentaisi
opettajan pääsyn ennen laskun maksua.

### Tiedossa olevat rajoitteet ja käyttäytyminen

- **Yksi opettajalisenssi per sähköposti** (`lisenssit_opettaja_email_idx`). Jos
  listattu opettaja on jo opettajana toisella koululla, uutta lisenssiä ei luoda
  eikä hän saa ohjeviestiä – vanha lisenssi säilyy. Automaatti ei siirrä
  opettajaa koulusta toiseen.
- **"Muut opettajat" -kenttä on rajattu:** palvelin pudottaa virheelliset ja
  duplikaatit, poistaa tilaajan oman osoitteen ja hyväksyy enintään 15 osoitetta
  (`normalisoiOpettajaEmailit` osoitteessa `api/tilaus.js`).
- **Ei uusintalogiikkaa:** jokainen tilaus luo uuden koulukoodin. Vanhaa koodia
  ei suljeta automaattisesti eikä opettajalisenssin voimassaoloa jatketa. Kun
  koulu uusii, sulje vanha koodi käsin (osio 6) ja päivitä opettajien
  `voimassa_asti` tarvittaessa.
- **Rate limit on muistipohjainen** (`Map`), joten se nollautuu cold startissa
  eikä päde serverless-instanssien yli. Matalavolyymiselle lomakkeelle riittävä,
  mutta ei todellinen suoja.
- **Kolmen vuoden lisenssi merkitään tyypiksi `vuosi`.** `voimassa_asti` on
  oikein, mutta raportointi näyttää sen vuosilisenssinä. Tyyppi `kunta` ei ole
  käytössä lainkaan.

### Päivitetty 2026-08-11

Tilausautomaatio laajennettiin luomaan opettajaoikeudet automaattisesti:

1. **Opettajalisenssi luodaan nyt jokaisesta tilauksesta.** Aiemmin tilaus loi
   vain koulukoodin (`vuosi`), joka antaa vain oppilastason pääsyn – tilaaja ei
   saanut opettajan hallintapaneelia ilman erikseen käsin luotua
   opettajalisenssiä.
2. **Lomakkeelle lisättiin "muiden opettajien sähköpostit" -kenttä** (dynaamiset
   rivit). Kullekin luodaan opettajalisenssi ja lähetetään kirjautumisohje.
3. Molemmat maksupolut käyttävät samaa `luoOpettajalisenssiJosPuuttuu`-apua,
   joka tarkistaa uniikkiuden, sietää törmäykset eikä kaada tilausta jos
   opettajalisenssi on jo olemassa tai luonti epäonnistuu (virhe kirjataan
   `api_virheet`-tauluun).

> **Historiaa (19.7.2026):** tilausautomaation aiemmasta, ennen Paytrailia
> olleesta versiosta korjattiin kaksi vikaa: opettajalisenssin `INSERT` tehtiin
> ilman `NOT NULL`-`koodi`-kenttää (jokainen tilaus kaatui), ja uusintatilaus
> olisi kaatunut uniikkiin indeksiin. Nykyinen Paytrail-pohjainen flow on
> rakennettu uudelleen, joten nuo koodipolut eivät enää ole olemassa.

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
