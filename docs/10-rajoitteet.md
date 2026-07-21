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

Ilmaistason tilaraja on 500 MB. Nykyinen käyttö on murto-osa siitä.

### ⚠️ Ilmaistasolla EI OLE varmuuskopioita

Supabasen Free Plan ei sisällä ajastettuja varmuuskopioita eikä palautusta
ajassa taaksepäin. Pro-taso antaa 7 päivän säilytyksen.

**Käsin tehty `pg_dump` on siis ainoa turva, ei lisäturva.** Jos kanta
menetetään eikä tuoretta dumppia ole, mitään ei ole mistä palata: lisenssit,
opetusryhmät, oppilaiden työt ja koko myyntihistoria.

Riski on tällä hetkellä pieni, koska maksavia asiakkaita ei vielä ole ja
menetys koskisi lähinnä testidataa. **Se muuttuu heti kun ensimmäinen koulu
aloittaa** – silloin kannassa on oppilaiden töitä, joita ei voi tuottaa
uudelleen.

Käytännön suositus: Pro-taso viimeistään ensimmäisen maksavan asiakkaan
myötä. Se ei poista käsin tehdyn dumpin tarvetta – oma kopio on riippumaton
Supabasesta ja säilyy pidempään kuin 7 päivää – mutta se poistaa yksittäisen
unohtuneen viikon kohtalokkuuden.

Varmuuskopiointiohje: [09 – Ylläpito](09-yllapito.md).

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

### Osa asetuksista on kovakoodattu selainpuolelle

`SUPABASE_URL`, `SUPABASE_ANON` ja kirjautumislinkin paluuosoite ovat
kovakoodattuja kolmeen tiedostoon (`js/lisenssiportti.js`,
`js/opettaja-keskus.js`, `kirjaudu.html`). Kahdessa API-funktiossa on lisäksi
kovakoodattu CORS-origin.

Uuteen ympäristöön siirtäminen vaatii siis koodimuutoksia, ei pelkkiä
ympäristömuuttujia. **Ilman niitä sivusto näyttää toimivan mutta puhuu väärään
Supabase-projektiin** – vikatyypeistä pahin, koska mikään ei ilmoita siitä.

Vaihdettavat kohdat on lueteltu osiossa
[02 – Käyttöönotto](02-kayttoonotto.md), kohta 8b.

Kestävämpi ratkaisu olisi koota arvot yhteen `js/config.js`-tiedostoon, josta
muut lukevat ne. Silloin vaihdettavia paikkoja olisi yksi. Refaktorointi
koskee maksumuurin polkua, joten se vaatii huolellisen testauksen.

### Osa asetuksista elää vain Supabasessa

Custom SMTP, Site URL ja Redirect URLs eivät ole koodissa eivätkä
ympäristömuuttujissa. Ne on tehtävä Supabasen hallintapaneelista käsin, ja
ilman niitä opettajakirjautuminen joko rajoittuu kahteen viestiin tunnissa tai
ei toimi lainkaan.

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
| Varmuuskopiointi käsin, muistutusten varassa | Toimii, mutta riippuu siitä että joku muistaa | **Korkea** |
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

1. **Varmuuskopioinnin automatisointi.** Käytäntö on olemassa, mutta se on
   muistin varassa – ja tämä on ainoa kohta jossa menetys olisi peruuttamaton.
   Ajastettu vienti Supabasesta ulkoiseen tallennukseen poistaisi riippuvuuden
   siitä että joku muistaa. Muistutusten tila elää lisäksi vain yhden selaimen
   `localStorage`-muistissa.
2. **Hyväksyttyjen oppilastöiden siivous.** Ainoa taulu joka kasvaa rajatta.
   Luonteva paikka on suursiivous elokuussa, pelien tulostaulujen tapaan.
3. **Vercel Pro**, jos uusia toimintoja tarvitaan. Funktiokatto on täynnä ja
   kaikki kiertotiet on jo käytetty.
4. **Migraatiokäytäntö tietokannalle.** Käsin ajaminen on toiminut yhden
   ihmisen projektissa, mutta ei kestä useampaa tekijää.
