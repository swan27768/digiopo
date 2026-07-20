# 09 – Ylläpitorutiinit

Mitä järjestelmä tekee itsestään, mitä sinun pitää tehdä, ja mistä näet onko
kaikki kunnossa.

---

## 1. Hallintapaneeli

Osoitteessa **digiopo.fi/admin-paneeli.html** (markkinointisivustolla, eri
projekti). Se kutsuu `app.digiopo.fi`-rajapintoja `x-admin-key`-otsakkeella,
jonka arvo on `ADMIN_DASHBOARD_KEY`.

| Näkymä | Rajapinta | Sisältö |
|---|---|---|
| Tilastot | `/api/admin-tilastot` | Lisenssit, käyntimäärät, viimeisimmät virheet, Vercelin julkaisutila |
| Massaviesti | `/api/admin-viesti` | Tiedote lisenssinhaltijoille |
| Ryhmät | `/api/jarjestys` | Opetusryhmien hallinta |

Tärkein osa on **Vikatilanteet**, joka näyttää `api_virheet`-taulun tuoreimmat
rivit. Se on ainoa paikka, jossa palvelinvirheet näkyvät ilman että kaivaa
tietokantaa.

---

## 2. Automaattiset ajot

### Vercel Cron (`vercel.json`)

| Ajo | Aika (UTC) | Suomen aikaa | Tekee |
|---|---|---|---|
| `/api/tarkista-kirjaukset` | 06:00 | 09:00 | Kirjautumispiikki (yli 50/h) ja lisenssien ylikäyttö |
| `/api/tarkista-virheet` | 07:00 | 10:00 | Kooste edellisen vuorokauden API-virheistä |

Molemmat lähettävät sähköpostia vain jos on jotain kerrottavaa. **Hiljaisuus
tarkoittaa että kaikki on kunnossa** – mutta myös sitä, ettet huomaa jos
sähköpostit lakkaavat toimimasta.

Hobby-taso sallii enintään kaksi cron-ajoa päivässä, ja molemmat ovat
käytössä. Uusi ajastettu tehtävä on siis tehtävä Supabasen pg_cronilla.

### Supabase pg_cron (`supabase_siivous_cron.sql`)

Pyörii tietokannan sisällä eikä kuluta Vercelin funktiokiintiötä.

| Ajo | Aika | Tekee |
|---|---|---|
| `digiopo_rutiinisiivous` | 1. ja 15. päivä klo 03:00 | Kevyt siivous |
| `digiopo_suursiivous` | 1.8. klo 04:00 | Lukuvuoden vaihto |

**Rutiinisiivous poistaa:**

- menneet `lukuvuosi_tapahtumat`
- yli 90 vrk vanhat `api_virheet`
- yli 30 vrk hyväksymättä jääneet oppilastyöt (`maailma_ratkaisut`,
  `fake_insta_profiilit`, tila `odottaa`)
- yli 3 kk vanhat pelitulokset
- yli 24 kk koskemattomat `opetusryhmat` (lisätty 19.7.2026)
- yli 12 kk vanhat `lisenssi_kirjaukset` (lisätty 19.7.2026)
- yli 24 kk vanhat `admin_viestit` (lisätty 19.7.2026)

⚠️ **Opetusryhmän poisto vie mukanaan järjestykset ja lukuvuosikalenterin**
(cascade). "Koskematon" lasketaan kolmesta aikaleimasta – ryhmä, järjestykset
ja kalenteritapahtumat – koska opettaja voi päivittää järjestystä muuttamatta
itse ryhmää. Pelkkä käyttö ei kuitenkaan päivitä mitään aikaleimaa, joten 24 kk
on tarkoituksella pitkä raja. Älä lyhennä sitä harkitsematta.

**Suursiivous** tekee edellisen ja lisäksi:

- **nollaa pelien tulostaulut kokonaan** – tuore kilpailu uudelle lukuvuodelle
- poistaa yli 12 kk vanhan `page_views`-raakadatan
- poistaa yli 12 kk käyttämättömät `lisenssi_laitteet`-rivit

⚠️ Hyväksymättä jääneet oppilastyöt poistuvat 30 päivässä. Jos opettaja ei
moderoi töitä ennen sitä, ne katoavat. Tämä on syytä kertoa opettajille.

Tarkista ajastukset:

```sql
select jobname, schedule, active from cron.job;
```

---

## 3. Hälytykset

| Hälytys | Laukeaa | Lähde |
|---|---|---|
| Laitepiikki | yli 50 uutta laitetta / koodi / vrk | `lisenssi_laitteet` |
| Lisenssien ylikäyttö | 30 pv laitteita enemmän kuin `paikat` | `lisenssi_kaytto` |
| Virhekooste | uusia rivejä `api_virheet`-taulussa | `api_virheet` |

> **Korjattu 19.7.2026.** Laitepiikki oli aiemmin "kirjautumispiikki" ja luki
> `lisenssi_kirjaukset`-taulua, johon **mikään ei koskaan kirjoittanut** –
> hälytys ei siis voinut laueta kertaakaan. Laiteseuranta oli korvannut
> kirjautumislokin, mutta lukupuoli jäi osoittamaan vanhaan tauluun.
>
> Samalla ikkuna muuttui tunnista vuorokauteen. Cron ajetaan kerran päivässä,
> joten tunnin ikkuna näytti aina samaa kellonaikaa (08–09 Suomen aikaa) eli
> täsmälleen koulujen aloitushetkeä. Vuorokausi kattaa koko välin edellisestä
> ajosta.
>
> Laitetunniste on deduplikoitu, joten sivua päivittävä oppilas ei näy
> piikkinä – vuotanut koodi näkyy.

Sähköpostit lähtevät **vain jos sekä `RESEND_API_KEY` että `ADMIN_EMAIL` on
asetettu.** Toisen puuttuminen sammuttaa ne kokonaan ilman virheilmoitusta.

Ylikäyttöhälytys vaatii lisäksi, että lisenssillä on `paikat`-arvo. Ilman sitä
vertailua ei tehdä. Ks. [06 – Lisenssit](06-lisenssit.md).

### Kun hälytys tulee

**Kirjautumispiikki** on useimmiten normaali: koko koulu aloittaa yhtä aikaa
lukuvuoden alussa tai uusi kunta otti tuotteen käyttöön. Tarkista
`kirjautumiset_koodittain`-näkymästä mikä koodi piikin aiheutti. Jos yksi
koodi tuottaa satoja kirjautumisia lyhyessä ajassa, se on voinut vuotaa.

**Ylikäyttö** tarkoittaa että koodia käyttää useampi laite kuin on myyty
paikkoja. Muista että laitemäärä on suuntaa-antava, ei päälukumäärä – kaksi
laitetta per oppilas on tavallista. Merkittävä ylitys on myyntikeskustelun
aihe, ei syytös.

**Virhekooste** kertoo endpointeittain mitä kaatui. Yksittäinen virhe on
yleensä ohimenevä verkkokatkos. Toistuva sama virhe vaatii selvittelyä.

---

## 4. Säännölliset tarkistukset

### Viikoittain

Avaa hallintapaneeli ja vilkaise **Vikatilanteet**. Jos lista on tyhjä, ei
tarvita muuta.

### Kuukausittain

```sql
-- Pian vanhenevat lisenssit (uusintamyynti)
select koodi, koulu, yhteyshenkilö, email, voimassa_asti
from lisenssit
where aktiivinen and voimassa_asti between current_date and current_date + 30
order by voimassa_asti;

-- Käyttö vs. myydyt paikat
select * from lisenssi_kaytto order by laitteita_30pv desc;

-- Virheet endpointeittain
select endpoint, count(*) as kpl, max(luotu_at) as tuorein
from api_virheet
group by endpoint order by kpl desc;
```

### Lukuvuoden alussa (elokuu)

- [ ] Suursiivous ajettiin 1.8. – tarkista `select * from cron.job;`
- [ ] Pelien tulostaulut nollautuivat
- [ ] Lisenssit voimassa alkavalle lukuvuodelle
- [ ] Skeemavertailu ei palauta rivejä (ks. [03](03-tietokanta.md))
- [ ] Node-versio yhä Vercelin tukema (`package.json` → `engines`)

### Kun kosket tietokannan rajoitteisiin

Tarkista **molemmat projektit**. `digiopo-home/api/tilaus.js` kirjoittaa
samaan `lisenssit`-tauluun, ja sen rikkoutuminen näkyy vain siten, että
asiakas saa "Palvelinvirhe – yritä uudelleen".

---

## 5. Kun jokin ei toimi

| Oire | Todennäköisin syy |
|---|---|
| Muutos ei näy tuotannossa | Välimuisti – ks. [08](08-julkaisu.md) |
| Suojattu sivu ei ohjaa portille | `LISENSSI_JWT_SECRET` puuttuu → muuri pois päältä |
| Opettaja ei näe oppilaiden töitä | Koulunimet eivät täsmää – ks. [06](06-lisenssit.md) |
| `liikaa_yrityksia` kesken tunnin | Rate limit, koko koulu jakaa IP:n – ks. [05](05-api.md) |
| Hälytyssähköpostit lakkasivat | `RESEND_API_KEY` tai `ADMIN_EMAIL` |
| Rajapinta palauttaa 404 | Taulu tai näkymä puuttuu kannasta – aja skeemavertailu |
| Tilaus kaatuu "Palvelinvirheeseen" | `api_virheet`-taulu kertoo syyn |

Ensimmäinen askel on lähes aina **`api_virheet`-taulu tai selaimen konsoli**.
Ne kertovat suoraan mikä meni pieleen, ja säästävät arvailulta.

---

## 6. Mitä ei ole automatisoitu

Rehellisyyden vuoksi – nämä ovat käsityötä:

- **Lisenssien luonti** ilman laskutusta – hallintapaneelin lomakkeella
- **Laskujen seuranta** – laskunumeroa ei tallenneta kantaan
- **Uusintamyynti** – pian vanhenevat on haettava kyselyllä tai paneelista
- **Varmuuskopiot** – käsin, muistutusten varassa (ks. alla)
- **Käännösten päivitys** – uusi avain lisättävä 11 tiedostoon käsin
- **Sisältömuutokset** – tiedostoja editoimalla, ei hallintapaneelista

---

## 7. Varmuuskopiot ja avainten vaihto

Hallintapaneelissa on **Ylläpitorytmi — muistutukset** -osio, joka seuraa
toistuvia tehtäviä ja laskee seuraavan eräpäivän. Väri kertoo tilan.

| Tehtävä | Väli | Miten |
|---|---|---|
| Tietokannan varmuuskopio | viikoittain | `pg_dump` → `Documents/Varmuuskopiot`, nimeä päivämäärällä |
| Koodin varmuuskopio | kuukausittain | GitHub → Code → Download ZIP, talleta myös koneen ulkopuolelle |
| Pian vanhenevat lisenssit | kuukausittain | Live-tilastot → "Vanhenee 30 pv" |
| API-virhelokit | viikoittain | Live-tilastot → Vikatilanteet |
| Admin- ja API-avainten vaihto | 6 kk | `ADMIN_DASHBOARD_KEY`, DB-salasana, API-avaimet → päivitä Verceliin |

⚠️ **Muistutusten tila tallentuu vain yhden selaimen `localStorage`-muistiin.**
Jos vaihdat selainta, tyhjennät selaustiedot tai avaat paneelin eri polusta,
merkinnät katoavat – itse varmuuskopiot eivät, mutta tieto siitä milloin ne on
viimeksi tehty katoaa.

Tämä on ainoa kohta koko järjestelmässä, jossa **menetys olisi peruuttamaton**.
Jos varmuuskopio jää tekemättä ja kanta menetetään, mitään ei ole mistä palata.
Muistutus auttaa, mutta se on silti muistin varassa.

Kestävämpi ratkaisu olisi ajastettu vienti Supabasesta ulkoiseen tallennukseen.
Se on kirjattu osion [10 – Rajoitteet](10-rajoitteet.md) korjauslistan
ykköseksi.
