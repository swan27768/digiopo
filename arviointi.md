# DigiOpo – Tekninen ja sisällöllinen arviointi
**Arvioitu:** 29.5.2026  
**Suhteessa:** OPH:n oppilaanohjauksen tavoitteet perusopetuksessa

---

## 1. Tekninen arviointi

### Vahvuudet

**Rakenne ja teknologiavalinnat**  
Sivusto on rakennettu puhtaalla HTML5/CSS3/JavaScriptillä ilman erillisiä frameworkeja. Tämä tekee siitä kevyen, nopean ladata ja helppo ylläpitää ilman riippuvuushelvettejä. CSS on jaettu selkeästi vastuualueittain (base, layout, components, navbar, aihe jne.) – modulaarinen lähestymistapa helpottaa jatkokehitystä.

**Saavutettavuus (accessibility)**  
Sivusto osoittaa selkeää panostusta saavutettavuuteen:
- `lang="fi"` html-elementissä
- Skip-to-content -linkki näppäimistökäyttäjille
- Kaikki sivunavigaatiot ja sivupaneelit on merkitty `aria-label`-attribuuteilla
- Osiot käyttävät `aria-labelledby`-yhteyksiä otsikkoihin
- Semanttinen HTML: `<main>`, `<aside>`, `<header>`, `<footer>`, `<nav>`, `<section>`
- aria-label-attribuutteja on yli 127 kpl sivuilla – tämä on selvästi harkittu, ei sattuma

**Responsiivisuus**  
Viewport-meta on kunnossa. Erillinen CSS-rakenne viittaa mobiilihuomiointiin.

**Tallentaminen ja interaktiivisuus**  
- Oppilaan vastaukset tallentuvat automaattisesti `localStorage`-selaintallennukseen
- Word-lataus omista vastauksista
- Tehtävähaku (`haku.js`)
- Runsaasti pelejä ja interaktiivisia tehtäviä

**Tekoälyntegrointio**  
Sivustossa on `proxy.js` – Node.js-välityspalvelin Anthropic Claude API:lle. Tämä mahdollistaa tekoälyavusteisen ohjauksen jossain sivuston osassa. Ratkaisu on teknisesti järkevä (API-avain piilossa palvelimella), mutta **tuotantokäytössä vaatii käynnissä olevan Node-palvelimen** – tämä on riippuvuus, joka täytyy hallita erikseen staattisten HTML-tiedostojen lisäksi.

### Kehityskohteet

**localStorage:n rajoitukset**  
Oppilaan vastaukset tallentuvat vain selaimen muistiin: jos oppilas vaihtaa laitetta tai selain tyhjentää välimuistin, vastaukset häviävät. Pitkällä tähtäimellä tarvitaan joko pilvitallennnus tai koulukohtainen kirjautuminen.

**Ei käyttäjätilejä**  
Sivusto on täysin anonyymi – opettaja ei näe oppilaiden edistymistä. Opettajasivuja (`valinnat_ope.html`, `vahvuusmatka_ope.html` jne.) on olemassa, mutta ne tuntuvat erillisiltä staattiselta sivuilta, ei aidolta opettajan hallintanäkymältä.

**Ei meta-tiedostoa tai manifestia**  
Sivustolta puuttuu `manifest.json` (PWA-tuki) ja `favicon`. Nämä ovat pieniä, mutta parantaisivat käyttökokemusta ja ammattimaista vaikutelmaa.

**Tyhjät alt-tekstit**  
Kaksi kuvaa sivuilla käyttää `alt=""` – nämä on tarkistettava, ovatko ne aidosti dekoratiivisia.

**proxy.js – ei tuotantovalmis**  
Tiedosto on kehitysympäristöä varten (localhost:3001). Tuotantokäyttöön tarvitaan selkeä ohjeistus palvelimen käynnistämiseen tai vaihtoehtoinen ratkaisu.

---

## 2. Sisällöllinen arviointi

### Rakenne luokittain

**7. luokka – Yläkoulun startti**  
Kattaa: mitä oppilaanohjaus on, opiskelutaidot (muisti, lukeminen, ajanhallinta), motivaatio, omat vahvuudet, Robo-maskottitarina. Sisältö on nuorelle sopivan konkreettista ja kannustavaa.

**8. luokka – Suunta löytyy**  
Kattaa: Suomen koulutusjärjestelmä, vahvuudet ja kiinnostukset, TET-jakso, oppimaan oppimisen klinikka, tulevaisuustuumailu. Vahvuus: kytkee itsetuntemuksen koulutusjärjestelmän konkreettisiin vaihtoehtoihin.

**9. luokka – Valintojen aika**  
Kattaa: yhteishaku, ajattelutyylit, TET, epävarmuuden käsittely, valintojen tekeminen, tulevaisuusskenaariot. Erityisen arvokas epävarmuuden normalisointi – "Mitä jos suunnitelma ei toimi?" on harvinainen ja tärkeä aihe.

### Interaktiiviset sisällöt ja pelit
Sivusto sisältää poikkeuksellisen laajan valikoiman:
- Vahvuusmatka, Supervoimat, Ala-set (itsetuntemus)
- Koulutusalakarusellit ja koulutusalapelit
- Ammattisanasto (amis + lukio)
- Kadonnut motivaatio -peli
- Duunimina, TET-tehtävät
- Oppimisen pakopeli
- Tiedon Temppeli
- Robo-peli (AI-tutori?)
- Vuosikello, yhteishakulaskuri

Tämä on sisällöllisesti erittäin rikas kokonaisuus.

### Kieli ja sävy
Teksti puhuttelee nuorta suoraan, innostavasti ja arvostavasti. Esimerkiksi: *"Kaikkea et voi ennustaa – mutta voit vaikuttaa siihen, mihin suuntaan lähdet."* Tämä on pedagogisesti tärkeää: ohjaus ei ole ohjeistusta vaan tukea itseohjautuvuuteen.

---

## 3. Vertailu OPH:n oppilaanohjauksen tavoitteisiin

### Tavoitteet ja niiden toteutuminen

| OPH:n tavoite | Toteutuminen DigiOpossa |
|---|---|
| Opiskeluvalmiuksien kehittäminen | ✅ Laaja opiskelutaitosisältö 7.lk, klinikka 8.lk |
| Itsetuntemus ja sosiaalinen kypsyminen | ✅ Vahvuudet, supervoimat, ajattelutyylit |
| Elämänsuunnittelun tiedot ja taidot | ✅ Tulevaisuusosiot kaikilla luokilla, epävarmuuden käsittely |
| Koulun yhdistäminen työelämään | ✅ TET-osiot 8.–9.lk, koulutusalat, ammattiesittelyt |
| Jatko-opintoihin ohjaus | ✅ Yhteishaku, koulutusjärjestelmä, TUVA/amis/lukio |
| Ohjaus nivelvaiheissa | ✅ Erillinen 9.lk-sisältö valintoihin valmistautumiseen |
| Vuosiluokat 7–9 kattavuus | ✅ Selkeä luokkakohtainen rakenne |
| Motivaation tukeminen | ✅ Kadonnut motivaatio -peli, motivaatio-osio |

### Puutteet suhteessa OPH:n tavoitteisiin

**Tasa-arvo, yhdenvertaisuus ja osallisuus**  
OPH korostaa ohjauksen roolia yhdenvertaisuuden edistämisessä ja syrjäytymisen ehkäisyssä. DigiOpossa tämä näkyy implisiittisesti (kannustava sävy, matalan kynnyksen tehtävät), mutta eksplisiittinen käsittely puuttuu. Esimerkiksi maahanmuuttotaustaisten tai erityistä tukea tarvitsevien oppilaiden näkökulmaa ei ole erikseen huomioitu.

**Tehostettu henkilökohtainen oppilaanohjaus (TEHO)**  
OPH edellyttää, että 8.–9.-luokkalaisille, jotka tarvitsevat lisätukea jatko-opintoihin, laaditaan jatko-opintosuunnitelma ja annetaan tehostettua ohjausta. DigiOpossa ei ole tähän kohdistettua osiota.

**Huoltajayhteistyö**  
OPH:n ohjaussuunnitelma edellyttää kodin ja koulun yhteistyötä. Sivusto on suunnattu oppilaille – huoltajille ei ole omaa osiota tai tietopakettia.

**Monialainen verkosto**  
OPH korostaa yhteistyötä eri asiantuntijoiden kanssa. Sivusto toimii itsenäisenä välineenä ilman kytköksiä muihin palveluihin (esim. Opintopolku.fi-integraatiota ei ole, vaikka yhteishakulaskuri viittaa siihen suuntaan).

**Ohjauksen jatkumo 1.–6. luokalta**  
OPH:n mukainen ohjaus alkaa jo ensimmäiseltä luokalta. DigiOpo kattaa vain yläkoulun (7–9). Tämä on tietoinen rajaus, mutta kannattaa mainita kontekstissa.

---

## 4. Yhteenveto

**DigiOpo on teknisesti huolitelttu, pedagogisesti ajateltu ja sisällöllisesti poikkeuksellisen laaja** digitaalinen oppilaanohjaustyökalu. Se vastaa erittäin hyvin OPH:n keskeisiin tavoitteisiin: itsetuntemus, opiskelutaidot, jatko-opintoihin tutustuminen ja elämänsuunnittelu on kaikki katettu ikätasoisesti ja innostavasti.

Merkittävimmät kehitysalueet ovat:
1. **Tasa-arvo- ja saavutettavuusnäkökulmat** sisältöön (erityistä tukea tarvitsevat, monikieliset oppilaat)
2. **Opettajan hallintanäkymä** – edistymisen seuranta ja yksilöllinen ohjaus
3. **Tehostettu henkilökohtainen ohjaus** omaksi osiokseen
4. **Huoltajaviestintä** osaksi kokonaisuutta
5. **Tuotantovalmius** (localStorage → pilvitallennus, proxy.js → dokumentoitu palvelinratkaisu)

Kokonaisarvio: **erittäin vahva pohja**, joka täyttää OPH:n tavoitteet hyvin perusoppilaiden osalta ja ansaitsee kehitystä inklusiivisempaan ja opettajakeskeisempään suuntaan.
