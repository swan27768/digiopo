# 10 – Tunnetut rajoitteet

Mitä järjestelmä ei tee, missä sen rajat kulkevat ja mitkä asiat on tehty
tietoisesti tavalla joka voi näyttää virheeltä.

Tämä osio on tarkoitettu luettavaksi **ennen** kuin projektia laajennetaan tai
luovutetaan eteenpäin.

---

## 1. Alustan rajat

### Vercel Hobby

| Raja | Tilanne |
|---|---|
| 12 serverless-funktiota | **Täynnä** – `api/`-kansiossa on tasan 12 |
| 2 cron-ajoa / vrk | **Täynnä** – 06:00 ja 07:00 UTC |

Molemmat katot ovat jo vaikuttaneet rakenteeseen. Ylikäyttöhälytys yhdistettiin
`tarkista-kirjaukset`-funktioon, ja tietokannan siivoukset tehdään Supabasen
pg_cronilla juuri siksi, etteivät ne veisi Vercel-kiintiötä.

Uusi endpoint vaatii siis joko olemassa olevan laajentamista `toiminto`-kentällä,
siirtoa `digiopo-home`-projektiin (jossa on tilaa), tai Pro-tilausta.

### Supabase

Ilmaistason tilaraja on 500 MB. Nykyinen käyttö on murto-osa siitä, mutta
**automaattista varmuuskopiointia ei ole erikseen järjestetty** – ollaan
Supabasen oman varmuuskopioinnin varassa. Tämä on ensimmäinen asia, joka
kannattaa korjata asiakasmäärän kasvaessa.

### Cold start

Serverless-funktiot nukahtavat käyttämättöminä. Päivän ensimmäinen pyyntö voi
kestää sekunnin tai kaksi pidempään. Ei korjattavissa Hobby-tasolla.

---

## 2. Koulujen verkko

**Koko koulu tulee ulos samasta NAT-osoitteesta.** Tämä on projektin tärkein
ympäristörajoite ja selittää useita ratkaisuja, jotka näyttäisivät muuten
oudoilta.

Seuraukset:

- Rate limit on IP-kohtainen, joten **25 oppilasta ja opettaja jakavat saman
  budjetin**. Ks. [05 – API](05-api.md).
- Kirjautumisen rate limit laskee **vain epäonnistuneita** yrityksiä. Muuten
  koulu lukkiutuisi ulos joka aamu kello kahdeksan.
- Automaattinen pollaus on kallista. Opettajanäkymän 5 sekunnin päivitysväli
  söi yksin puolet koulun budjetista, ja se jouduttiin nostamaan 20 sekuntiin.

Uutta pollausta lisättäessä: laske `(60 / väli sekunteina) × 5` ja vertaa
endpointin rajaan. Yli 10 % rajasta on liikaa.

---

## 3. Fail-open-venttiilit

Kolme kohtaa toimii puuttuvalla asetuksella niin, että **suojaus on pois
päältä eikä mikään ilmoita siitä**.

| Muuttuja | Puuttuessa | Tarkoituksellinen? |
|---|---|---|
| `LISENSSI_JWT_SECRET` | Maksumuuri pois, sisältö julkista | **Kyllä** – hätäkatkaisu |
| `CRON_SECRET` | Cron-endpointit avoimia | Ei |
| `UPSTASH_REDIS_REST_*` | Rate limit vain instanssikohtainen | Osin |

Ensimmäinen on tarkoituksellinen: jos muuri rikkoutuu kesken koulupäivän,
ympäristömuuttujan poisto avaa sisällön ja opetus jatkuu. Ks.
[08 – Julkaisu](08-julkaisu.md).

Kaksi muuta on syytä pitää asetettuina.

---

## 4. Asioita jotka näyttävät virheeltä mutta eivät ole

**`tyyppi` ei rajoita pääsyä.** Myös `testi`-tyyppinen lisenssi avaa koko
sisällön. Ainoat portit ovat `aktiivinen` ja `voimassa_asti`.

**Lisenssin sulkeminen tehoaa vasta vuorokaudessa.** Eväste on pitkäikäinen
(~300 vrk) ja taustatarkistus ajetaan 24 tunnin välein. Jos pääsy on
katkaistava heti, koodi on vaihdettava.

**Laitemäärä ei ole päälukumäärä.** Sama oppilas kahdella laitteella näkyy
kahtena, incognito luo uuden laitteen joka kerta, ja luokan yhteiskone näkyy
yhtenä vaikka käyttäjiä on kolmekymmentä.

**Koulunimen muutos näkyy viiveellä.** Nimi leivotaan istuntoevästeeseen
kirjautumishetkellä ja päivittyy vasta vuorokauden taustatarkistuksessa.

**Vain ryhmän omistaja voi poistaa sen.** Jos opettaja vaihtaa koulua, hänen
ryhmänsä jäävät kantaan – 24 kuukauden automaattisiivous hoitaa ne aikanaan.

**Muutos ei aina näy heti julkaisun jälkeen.** Välimuistia on kolmessa
kerroksessa. Ks. [08 – Julkaisu](08-julkaisu.md).

---

## 5. Rakenteelliset rajoitteet

### Kaksi projektia, yksi tietokanta

`digiopo` (sovellus) ja `digiopo-home` (markkinointi ja tilaukset) ovat
erillisiä repoja ja erillisiä Vercel-projekteja, mutta **molemmat kirjoittavat
samaan `lisenssit`-tauluun**.

Kannan rajoitteita muutettaessa on tarkistettava molemmat. Tämä on jo kerran
aiheuttanut rikkoutumisen: uniikki-indeksi olisi kaatanut tilausautomaation
uusintatilaukset.

**Miksi kantaa ei ole jaettu kahtia:** `lisenssit` on sama liiketoiminnallinen
objekti kahdesta suunnasta – tilauslomake luo, sovellus tarkistaa. Erillisissä
kannoissa sovellus joutuisi kysymään lisenssin voimassaolon markkinointisivuston
rajapinnalta jokaisella kirjautumisella. Se lisäisi viiveen ja uuden vikapisteen
kriittisimmälle polulle: jos digiopo.fi olisi alhaalla, oppilaat eivät pääsisi
oppitunnille.

Riskiä hallitaan ristiviittauksilla sen sijaan. `digiopo-home`-projektin
README ja molemmat kantaan kirjoittavat tiedostot kertovat, missä skeema asuu
ja mihin rajoitteisiin ne nojaavat.

⚠️ **Myyntiä ajatellen:** jaettu kanta sitoo projektit yhteen. Sovellusta ei
voi myydä ilman tilausjärjestelmää eikä päinvastoin ilman että jotain
rakennetaan uusiksi. Kokonaisuutena myytäessä tämä on etu – ostaja saa toimivan
ketjun tilauksesta käyttöön.

### Tietokantamuutokset käsin

Migraatiotyökalua ei ole. SQL-tiedostot ajetaan Supabasen SQL Editorissa käsin
oikeassa järjestyksessä. Ks. [03 – Tietokanta](03-tietokanta.md).

Riski on ilmeinen: kantaan voi päätyä muutoksia, joita ei ole tiedostoissa.
Näin on käynyt neljä kertaa. Osiossa 03 on skeemavertailukysely, joka paljastaa
eron – aja se ennen kuin näytät projektia ulkopuoliselle.

### Sisältö on tiedostoissa

Tehtävät, sivut ja tekstit ovat HTML-tiedostoissa, eivät tietokannassa.
Sisältömuutos vaatii tiedoston editoinnin ja julkaisun – hallintapaneelista ei
voi muokata sisältöä.

Käännösavain on lisättävä käsin **11 kielitiedostoon**.

### macOS-sidonnaisuudet

`esikatselu.command` ja `julkaise.command` toimivat vain macOS:llä.
Windowsissa käytä `npm run dev` ja `git push origin main`.

---

## 6. Kehitysympäristön erot tuotantoon

`dev-server.cjs` jäljittelee osan rajapinnoista, mutta **jäljitelmä ei vastaa
tuotantoa valtuutuksessa** – esimerkiksi `tarkista_opettaja` päästää
paikallisesti kaikki läpi.

Turvamuutoksia ei siis voi todentaa paikallisesti. Ne on testattava
tuotannossa.

Sama koskee `vercel.json`-otsakkeita: CSP, välimuistisäännöt ja reititykset
ovat Vercelin ominaisuuksia eikä dev-server lähetä niitä.

Tilauslomake ja hallintapaneelin lisenssitoiminnot vaativat
`digiopo-home`-projektin rajapinnat – niitä ei voi testata pelkällä
tiedostopalvelimella (VS Code Live Server ei riitä).

---

## 7. Keskeneräiset ja korjaamattomat

| Asia | Vaikutus | Prioriteetti |
|---|---|---|
| 18 HTML-sivua ilman favicon- ja manifest-linkitystä | Kosmeettinen; PWA-kehote ei laukea niiltä sivuilta | Matala |
| Hyväksytyt oppilastyöt eivät poistu koskaan | Taulut kasvavat rajatta | Keskitaso |
| `lisenssi_kirjaukset` on kuollut taulu | Mikään ei kirjoita siihen; näkymät aina tyhjiä | Matala |
| 3 vuoden lisenssi merkitään tyypiksi `vuosi` | Raportointi näyttää väärin; `voimassa_asti` on oikein | Matala |
| Laskunumeroa ei tallenneta kantaan | Laskutushistoria vain lähetetyissä sähköposteissa | Keskitaso |
| Tilauslomakkeen rate limit on muistipohjainen | Ei päde serverless-instanssien yli | Matala |
| Ei automaattista varmuuskopiointia | Supabasen oman varmuuskopioinnin varassa | **Korkea** |
| Lisenssin luonti vaati SQL-osaamista | Korjattu 19.7.2026: lomake hallintapaneelissa | Valmis |

---

## 8. Mitä ei ole automatisoitu

- **Uusintamyynti** – pian vanhenevat haettava kyselyllä tai paneelista
- **Laskujen seuranta** – laskunumeroa ei tallenneta
- **Käännösten päivitys** – uusi avain 11 tiedostoon käsin
- **Sisältömuutokset** – tiedostoja editoimalla
- **Tietokantamuutokset** – SQL käsin
- **Varmuuskopiointi** – ei erillistä vientiä

---

## 9. Mitä kannattaa korjata ensin

Jos projektia jatketaan tai se luovutetaan eteenpäin, tässä järjestyksessä:

1. **Varmuuskopiointi.** Ainoa kohta jossa menetys olisi peruuttamaton.
2. **Hyväksyttyjen oppilastöiden siivous.** Ainoa taulu joka kasvaa rajatta.
   Luonteva paikka on suursiivous elokuussa, pelien tulostaulujen tapaan.
3. **Vercel Pro**, jos uusia toimintoja tarvitaan. Funktiokatto on täynnä ja
   kaikki kiertotiet on jo käytetty.
4. **Migraatiokäytäntö tietokannalle.** Käsin ajaminen on toiminut yhden
   ihmisen projektissa, mutta ei kestä useampaa tekijää.
