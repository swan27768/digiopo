# -*- coding: utf-8 -*-
"""Sote-ala – "Hälytys 112" (sisältö).
Rakenna: python3 rakenna_tarina.py alat/sote.py <orig sote.html> <uusi sote.html>"""

ala = "sote"
alaNimi = "Sote-ala"
tarinaNimi = "Hälytys 112"
maailma = "sote"
yleisKohtaus = "ilta"
katsoTeksti = "Katso ympärille"
kello = {"alku": 17 * 60, "raja": None}
aikaRivi = ""
siirtyma = 20
siirtymaTeksti = "Seuraavaan paikkaan siirtyminen vie 20 min."
kutsuTilanneOtsikko = "Tilanne"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Iltavuoro klo 17–21")]

TEEMA = """:root {
  --a1: #7cf3d0; --a1-rgb: 124,243,208;
  --a2: #5cc2c4; --a2-rgb: 92,194,196;
  --a3: #8ef0d8;
  --korostus: #ffc6a5; --korostus-rgb: 255,198,165;
  --tausta: #0a1b24; --tausta-rgb: 10,27,36;
  --tausta-2: #15303a; --tausta-2-rgb: 21,48,58;
  --paneeli: #0f2630; --paneeli-rgb: 15,38,48;
  --paneeli-2: #123744;
  --tumma: #06141b; --tumma-rgb: 6,20,27;
  --reuna: #3fbfa8;
  --teksti-pehmea: #c5e8e6; --teksti-pehmea-rgb: 197,232,230;
  --teksti-vaalea: #e8fbf8;
  --nappi-teksti: #04201c;
}
/* Vaalea 3D-sairaala: kannen teksti tarvitsee vahvemman tumman pohjan */
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 70%, rgba(var(--tausta-rgb),0) 90%) !important;
}"""

KANSI = dict(pieni="Terveys- ja hyvinvointiala · tarina", otsikko="Sote-ala",
             alaotsikko="Hälytys 112 · Seuraa yhtä iltaa hätäpuhelusta sairaalaan.",
             nappi="Aloita tästä", ikoni="syke")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet ensihoidon kenttäjohtaja iltavuorossa. Sinä johdat alueen ambulansseja ja autat, kun tilanne on vaikea. Miten sinä toimisit?",
            faktat=[("6", "ammattilaista"), ("1", "ilta"), ("1", "oma ammattikortti")])

TARINA_ALKU = dict(nimi="Hälytys 112", tausta="ilta", teksti="""<<include "HUD">>
<h1>Hälytys 112</h1>
<p>Kello on 17.00. Olet ensihoidon kenttäjohtaja. Sinä johdat alueen ambulansseja ja pidät huolen, että apu kulkee hätäpuhelusta sairaalaan asti.</p>
<p>Ensimmäinen paikka on hätäkeskus. Istut päivystäjä Lauran vieressä, ja saat omat kuulokkeet.</p>
<p>Yhtäkkiä kuulokkeissa piippaa. Joku soittaa hätänumeroon.</p>
<p class="puhe"><strong>Laura:</strong> ”Kuuntele tarkkaan. Nyt tarvitaan rauhallista mieltä.”</p>
<div class="intro-nappi"><<link "Kuuntele puhelua">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Hätäkeskus", tausta="hatakeskus", otsikko="Hätäkeskus", avain="hatakeskus",
      kysymys="Miltä hätäkeskuspäivystäjän työ näytti?",
      johdanto="""<p>Soittaja on 12-vuotias Eetu. Hän on mummonsa luona. Mummo kaatui keittiössä eikä pääse ylös. Eetu itkee.</p>
<p class="puhe"><strong>Laura, hätäkeskuspäivystäjä:</strong> ”Jokainen sekunti on tärkeä. Mitä kysyisit Eetulta ensimmäisenä?”</p>""",
      valinnat=[
       dict(teksti="Kysyn, mitä mummolle tapahtui.", aika=15, piirteet={},
            palaute="<p><strong>Tärkeä kysymys, mutta ei ensimmäinen.</strong></p><p>Jos puhelu katkeaa, apu ei löydä perille ilman osoitetta. Siksi hätäkeskuksessa kysytään ensin, missä ollaan.</p><p>Laura kysyy osoitteen ja sitten, mitä tapahtui. Ambulanssi lähtee matkaan.</p>"),
       dict(teksti="Kysyn osoitteen, jossa he ovat.", aika=10, piirteet={"tarkka": 2},
            palaute="<p><strong>Juuri niin!</strong></p><p>Osoite kysytään ensin. Jos puhelu katkeaa, apu löytää silti perille.</p><p>Sitten Laura kysyy, mitä tapahtui. Ambulanssi lähtee matkaan jo puhelun aikana.</p>"),
       dict(teksti="Sanon Eetulle, että hän teki oikein, kun soitti.", aika=10, piirteet={"kuuntelija": 2, "rauhallinen": 1},
            palaute="<p><strong>Hieno ajatus.</strong></p><p>Kun Eetu rauhoittuu, hän osaa vastata paremmin. Laura kiittää Eetua ja kysyy heti perään osoitteen.</p><p>Hätäkeskuspäivystäjä tekee montaa asiaa yhtä aikaa: rauhoittaa, kysyy ja lähettää apua.</p>"),
      ]),
 dict(nimi="Kotikäynti", tausta="koti", otsikko="Kotikäynti", avain="perusensi",
      kysymys="Miltä perustason ensihoitajan työ näytti?",
      johdanto="""<p>Pääset ambulanssin kyytiin. Perillä mummo Aino, 84, istuu keittiön lattialla. Ranne on turvoksissa. Eetu pitää häntä kädestä.</p>
<p>Aino sanoo tiukasti: ”En minä mihinkään sairaalaan lähde! Kuka sitten hoitaa Mirrin?”</p>
<p class="puhe"><strong>Mira, perustason ensihoitaja:</strong> ”Ranne pitää kuvata sairaalassa. Miten saisimme Ainon lähtemään?”</p>""",
      valinnat=[
       dict(teksti="Sanon Ainolle, että nyt on pakko lähteä.", aika=15, piirteet={},
            palaute="<p><strong>Aino suuttuu ja kieltäytyy entistä tiukemmin.</strong></p><p>Hoitoon ei yleensä voi pakottaa. Siksi hoitajan pitää saada potilaan luottamus.</p><p>Mira istuu Ainon viereen ja kysyy, mikä häntä huolettaa. Kun kissan hoito on sovittu, Aino suostuu lähtemään.</p>"),
       dict(teksti="Kysyn rauhassa, mikä lähtemisessä huolettaa.", aika=10, piirteet={"kuuntelija": 2},
            palaute="<p><strong>Hyvä veto!</strong></p><p>Aino on huolissaan kissastaan Mirristä. Eetu lupaa, että hänen äitinsä tulee illalla hoitamaan Mirrin. Aino huokaisee ja suostuu lähtemään.</p><p>Kun kuuntelee, löytää usein ratkaisun.</p>"),
       dict(teksti="Pyydän Eetua soittamaan äidilleen.", aika=15, piirteet={"tiimi": 2},
            palaute="<p><strong>Toimiva idea.</strong></p><p>Eetun äiti puhuu Ainon kanssa puhelimessa ja lupaa hoitaa Mirrin. Aino suostuu lähtemään.</p><p>Läheiset ovat tärkeä osa hoitoa, varsinkin kun potilas on huolissaan.</p>"),
      ]),
 dict(nimi="Ambulanssi", tausta="ambulanssi", otsikko="Ambulanssi", avain="ensihoitaja",
      kysymys="Miltä ensihoitajan työ näytti?",
      johdanto="""<p>Ambulanssi ajaa kohti sairaalaa. Istut Ainon vieressä. Yhtäkkiä Aino sanoo, että häntä huimaa. Hän on kalpea, ja iho tuntuu kylmältä.</p>
<p class="puhe"><strong>Aleksi, ensihoitaja:</strong> ”Kerro, jos huomaat jotain. Mitä teet?”</p>""",
      valinnat=[
       dict(teksti="Kerron Aleksille heti, mitä huomasin.", aika=5, piirteet={"tiimi": 2, "rauhallinen": 1},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Aleksi mittaa verenpaineen. Se on matala. Hän nostaa Ainon jalat ylös ja antaa nestettä suoneen. Pian Ainon olo helpottaa.</p><p>Ensihoidossa pienikin muutos kerrotaan heti.</p>"),
       dict(teksti="Annan Ainolle vettä juotavaksi.", aika=10, piirteet={},
            palaute="<p><strong>Aleksi pysäyttää sinut ystävällisesti.</strong></p><p>Jos Aino tarvitsee leikkauksen, vatsan pitää olla tyhjä. Siksi potilaalle ei anneta juotavaa ennen kuin tiedetään, mikä on vialla.</p><p>Aleksi mittaa verenpaineen. Se on matala. Hän nostaa Ainon jalat ylös ja antaa nestettä suoneen.</p>"),
       dict(teksti="Odotan hetken. Ehkä huimaus menee ohi itsestään.", aika=15, piirteet={},
            palaute="<p><strong>Aino kalpenee lisää.</strong></p><p>Onneksi Aleksi huomaa sen itse. Ensihoidossa pienikin muutos kerrotaan heti, koska tilanne voi muuttua nopeasti.</p><p>Aleksi mittaa verenpaineen. Se on matala. Hän nostaa Ainon jalat ylös ja antaa nestettä suoneen.</p>"),
      ]),
 dict(nimi="Päivystys", tausta="paivystys", otsikko="Päivystys", avain="sairaanhoitaja",
      taustakuva="../../images/koulutusalat/sote-paivystys-tausta.webp",
      kysymys="Miltä sairaanhoitajan työ näytti?",
      johdanto="""<p>Sairaalan päivystyksessä Aino pääsee röntgeniin. Aulaan tulee samaan aikaan kolme uutta potilasta.</p>
<p class="puhe"><strong>Petra, sairaanhoitaja:</strong> ”Minun pitää päättää, kuka pääsee hoitoon ensin. Kenet sinä ottaisit ensimmäisenä?”</p>""",
      valinnat=[
       dict(teksti="Nuoren jalkapalloilijan, jonka nilkka on turvoksissa.", aika=15, piirteet={},
            palaute="<p><strong>Nilkka on kipeä, mutta odottaminen ei ole vaarallista.</strong></p><p>Petra ottaa ensin 60-vuotiaan miehen, jolla on puristavaa kipua rinnassa. Rintakipu voi olla sydänkohtaus, ja silloin jokainen minuutti on tärkeä.</p>"),
       dict(teksti="Miehen, jolla on puristavaa kipua rinnassa ja joka hikoilee.", aika=10, piirteet={"tarkka": 2, "rauhallinen": 1},
            palaute="<p><strong>Oikein!</strong></p><p>Rintakipu ja hikoilu voivat olla sydänkohtauksen merkkejä. Silloin jokainen minuutti on tärkeä.</p><p>Tätä kutsutaan hoidon kiireellisyyden arvioinniksi. Se on yksi sairaanhoitajan tärkeistä taidoista.</p>"),
       dict(teksti="Kuumeisen lapsen, joka leikkii ja juo hyvin.", aika=15, piirteet={},
            palaute="<p><strong>Lapsen kuume huolettaa, mutta leikkivä ja juova lapsi voi odottaa hetken.</strong></p><p>Petra ottaa ensin 60-vuotiaan miehen, jolla on puristavaa kipua rinnassa. Rintakipu voi olla sydänkohtaus, ja silloin jokainen minuutti on tärkeä.</p>"),
      ]),
 dict(nimi="Synnytysosasto", tausta="synnytys", otsikko="Synnytysosasto", avain="katilo",
      taustakuva="../../images/koulutusalat/sote-osasto-tausta.webp",
      kysymys="Miltä kätilön työ näytti?",
      johdanto="""<p>Ainon ranne on kipsattu. Sinut lähetetään viemään papereita synnytysosastolle. Siellä on juuri syntynyt vauva.</p>
<p>Vauvan isä katsoo vauvaa huolestuneena ja kysyy sinulta: ”Miksi vauvan kädet ja jalat ovat sinertävät? Onko jotain vialla?”</p>""",
      valinnat=[
       dict(teksti="Sanon, että varmasti kaikki on hyvin.", aika=10, piirteet={"kuuntelija": 1},
            palaute="<p><strong>Tarkoitit hyvää, mutta vastasyntyneen voinnin arvioi kätilö.</strong></p><p>Kätilö Henna tulee paikalle ja selittää: vastasyntyneen kädet ja jalat ovat usein sinertävät ensimmäisinä päivinä, koska verenkierto vasta tasaantuu. Kasvot ja vartalo ovat punakat, ja se on hyvä merkki.</p>"),
       dict(teksti="Pyydän kätilö Hennan paikalle vastaamaan.", aika=10, piirteet={"tiimi": 2, "tarkka": 1},
            palaute="<p><strong>Hyvin toimittu!</strong></p><p>Henna selittää: vastasyntyneen kädet ja jalat ovat usein sinertävät ensimmäisinä päivinä, koska verenkierto vasta tasaantuu. Kasvot ja vartalo ovat punakat, ja se on hyvä merkki.</p><p>Kun et tiedä vastausta, ohjaa kysymys oikealle ammattilaiselle.</p>"),
       dict(teksti="Etsin vastauksen netistä puhelimella.", aika=15, piirteet={},
            palaute="<p><strong>Netistä löytyy kymmeniä pelottavia vastauksia.</strong></p><p>Kätilö Henna tulee paikalle ja selittää: vastasyntyneen kädet ja jalat ovat usein sinertävät ensimmäisinä päivinä, koska verenkierto vasta tasaantuu. Kasvot ja vartalo ovat punakat, ja se on hyvä merkki.</p>"),
      ]),
 dict(nimi="Rauhallinen huone", tausta="nuoret", otsikko="Päivystyksen rauhallinen huone", avain="mielenterveys",
      taustakuva="../../images/koulutusalat/sote-osasto-tausta.webp",
      kysymys="Miltä mielenterveystyön lähihoitajan työ näytti?",
      johdanto="""<p>Ilta on jo pitkällä. Päivystykseen tulee 15-vuotias Sara äitinsä kanssa. Saran sydän hakkaa, kädet tärisevät ja hengitys kulkee nopeasti.</p>
<p>Lääkäri on tutkinut Saran: kyse on paniikkikohtauksesta. Se on pelottava, mutta ei vaarallinen.</p>
<p class="puhe"><strong>Jesse, lähihoitaja:</strong> ”Mennään Saran kanssa rauhalliseen huoneeseen. Miten auttaisit häntä?”</p>""",
      valinnat=[
       dict(teksti="Sanon Saralle, että hänen pitää vain rauhoittua.", aika=10, piirteet={},
            palaute="<p><strong>Tarkoitit hyvää, mutta käsky ei auta.</strong></p><p>Kun ahdistus on kova, käsky rauhoittua voi tuntua siltä, ettei häntä uskota. Jesse istuu Saran viereen ja ohjaa hengittämään hitaasti.</p>"),
       dict(teksti="Istun viereen ja hengitän hitaasti Saran kanssa.", aika=10, piirteet={"kuuntelija": 2, "rauhallinen": 2},
            palaute="<p><strong>Hyvin toimittu!</strong></p><p>Rauhallinen ihminen vieressä auttaa. Jesse ohjaa: hengitä sisään neljä sekuntia ja ulos kuusi sekuntia. Vähitellen Saran hengitys tasaantuu.</p>"),
       dict(teksti="Kysyn nopeasti monta kysymystä siitä, mitä tapahtui.", aika=10, piirteet={},
            palaute="<p><strong>Kysymyksille on aikansa myöhemmin.</strong></p><p>Kun ahdistus on päällä, monta kysymystä lisää painetta. Jesse istuu Saran viereen ja ohjaa ensin hengittämään hitaasti.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Vuoro päättyy", teksti="""<h1>Vuoro päättyy</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Iltavuoro on ohi.</p>
<p>Ainon ranne on kipsattu, ja hän pääsee huomenna kotiin Mirrin luo. Rintakipuinen mies on hoidossa. Vauva nukkuu äitinsä vieressä. Sara on rauhoittunut ja lähtee kotiin äitinsä kanssa.</p>
<p>Huomasitko? Yhden illan aikana tarvittiin kuusi eri ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Laura, hätäkeskuspäivystäjä</strong> – lähetti avun oikeaan paikkaan</li>
<li><strong>Mira, perustason ensihoitaja</strong> – sai Ainon luottamuksen</li>
<li><strong>Aleksi, ensihoitaja</strong> – huomasi, kun Ainon vointi muuttui</li>
<li><strong>Petra, sairaanhoitaja</strong> – päätti, kuka pääsee hoitoon ensin</li>
<li><strong>Henna, kätilö</strong> – hoiti äitiä ja vauvaa</li>
<li><strong>Jesse, lähihoitaja</strong> – auttoi Saraa rauhoittumaan</li>
</ul>
<p>Miran ja Jessen ammattiin opiskellaan ammattikoulussa: molemmat ovat lähihoitajia. Ensihoitajaksi, sairaanhoitajaksi ja kätilöksi opiskellaan ammattikorkeakoulussa. Sinne voi hakea myös amiksen jälkeen.</p>
<p class="pieni">Jos sinua itseäsi joskus ahdistaa, kerro siitä luotetulle aikuiselle, esimerkiksi kouluterveydenhoitajalle.</p>""")

PIIRTEET = {
 "kuuntelija": {"nimi": "Kuuntelija", "kuvaus": "Kuulet, mitä toinen oikeasti tarvitsee."},
 "tarkka": {"nimi": "Tarkka ja turvallinen", "kuvaus": "Teet asiat oikeassa järjestyksessä ja huolehdit turvallisuudesta."},
 "rauhallinen": {"nimi": "Rauhallinen kiireessä", "kuvaus": "Pysyt rauhallisena, vaikka tilanne jännittää."},
 "tiimi": {"nimi": "Tiimipelaaja", "kuvaus": "Kerrot havainnoistasi ja pyydät apua oikealta ihmiseltä."},
}

AMMATIT = {
 "hatakeskus": {"nimi": "Hätäkeskuspäivystäjä", "kuvaus": "Vastaa hätänumeroon 112 ja lähettää avun oikeaan paikkaan.",
                "tutkinto": "Hätäkeskuspäivystäjätutkinto, Pelastusopisto (1,5 vuotta, haetaan aikaisintaan 18-vuotiaana)", "piirteet": ["tarkka", "rauhallinen"]},
 "perusensi": {"nimi": "Perustason ensihoitaja", "kuvaus": "Hoitaa potilaita ambulanssissa ja kuljettaa heitä sairaalaan.",
               "tutkinto": "Sosiaali- ja terveysalan perustutkinto (lähihoitaja), perustason ensihoidon osaamisala", "piirteet": ["kuuntelija", "rauhallinen"]},
 "ensihoitaja": {"nimi": "Ensihoitaja", "kuvaus": "Vastaa vaativasta hoidosta ambulanssissa ja onnettomuuspaikalla.",
                 "tutkinto": "Ensihoitaja (AMK), ammattikorkeakoulu", "piirteet": ["tiimi", "rauhallinen"]},
 "sairaanhoitaja": {"nimi": "Sairaanhoitaja", "kuvaus": "Arvioi, kuka tarvitsee hoitoa ensin, ja hoitaa potilaita sairaalassa.",
                    "tutkinto": "Sairaanhoitaja (AMK), ammattikorkeakoulu", "piirteet": ["tarkka", "tiimi"]},
 "katilo": {"nimi": "Kätilö", "kuvaus": "Hoitaa äitiä ja vauvaa raskauden, synnytyksen ja ensimmäisten päivien aikana.",
            "tutkinto": "Kätilö (AMK), ammattikorkeakoulu", "piirteet": ["kuuntelija", "tarkka"]},
 "mielenterveys": {"nimi": "Lähihoitaja, mielenterveystyö", "kuvaus": "Tukee ihmisiä, joilla on vaikeaa mielenterveyden tai päihteiden kanssa.",
                   "tutkinto": "Sosiaali- ja terveysalan perustutkinto (lähihoitaja), mielenterveys-, päihde- ja riippuvuustyön osaamisala", "piirteet": ["kuuntelija", "rauhallinen"]},
}

LAHI = "Sosiaali- ja terveysalan perustutkinto (lähihoitaja)"
AMK = "Ammattikorkeakoulu (AMK)"

KUTSU_JOHDANTO = "Tarinassa tapasit kuusi sote-alan ammattilaista. Alalla on kuitenkin paljon muitakin ammatteja: koulussa, terveyskeskuksessa, laboratoriossa ja sairaalan kulissien takana."

KUTSU_KORTIT = [
 {"tilanne": "Kahdeksannella luokalla on vuorossa koulun terveystarkastus. Siinä tarkistetaan kasvu ja voit kysyä omasta terveydestäsi.",
  "oikea": "Kouluterveydenhoitaja", "tutkinto": "Terveydenhoitaja (AMK), ammattikorkeakoulu",
  "vaihtoehdot": {
   "Kouluterveydenhoitaja": "Kouluterveydenhoitaja tekee koulun terveystarkastukset ja rokotukset. Hänen kanssaan voi jutella myös jaksamisesta ja omasta terveydestä.",
   "Lähihoitaja": "Lähihoitaja auttaa hoitotyössä esimerkiksi sairaalassa tai kotihoidossa. Koulun terveystarkastukset tekee terveydenhoitaja.",
   "Kuraattori": "Kuraattori auttaa kaverisuhteiden ja koulunkäynnin pulmissa. Terveystarkastukset kuuluvat terveydenhoitajalle.",
   "Fysioterapeutti": "Fysioterapeutti auttaa liikkumisessa ja kuntoutuksessa. Terveystarkastukset tekee terveydenhoitaja."}},
 {"tilanne": "Treeneissä nilkka nyrjähti. Lääkärin mukaan mikään ei murtunut, mutta nilkka pitää kuntouttaa.",
  "oikea": "Fysioterapeutti", "tutkinto": "Fysioterapeutti (AMK), ammattikorkeakoulu",
  "vaihtoehdot": {
   "Lähihoitaja": "Lähihoitaja auttaa arjessa ja hoitotyössä. Kuntoutusharjoitteet suunnittelee fysioterapeutti.",
   "Fysioterapeutti": "Fysioterapeutti suunnittelee harjoitteet, joilla nilkka vahvistuu ja liikkuu taas normaalisti.",
   "Ensihoitaja": "Ensihoitaja auttaa äkillisissä hätätilanteissa. Nilkan kuntoutus kuuluu fysioterapeutille.",
   "Sairaanhoitaja": "Sairaanhoitaja hoitaa potilaita, mutta liikkumisen ja kuntoutuksen asiantuntija on fysioterapeutti."}},
 {"tilanne": "Hampaasta lohkesi iso pala, ja se vihloo.",
  "oikea": "Hammaslääkäri", "tutkinto": "Hammaslääkäri, yliopisto",
  "vaihtoehdot": {
   "Hammashoitaja": "Hammashoitaja avustaa hammaslääkäriä ja huolehtii välineistä. Hammashoitajaksi voi opiskella amiksessa lähihoitajan suunhoidon osaamisalalla.",
   "Suuhygienisti": "Suuhygienisti puhdistaa hampaita ja hoitaa ikeniä. Lohjenneen hampaan korjaa hammaslääkäri.",
   "Hammaslääkäri": "Hammaslääkäri tutkii hampaan ja korjaa lohjenneen kohdan, esimerkiksi paikalla.",
   "Lääkäri": "Lääkäri hoitaa sairauksia, mutta hampaat hoitaa hammaslääkäri."}},
 {"tilanne": "Koulussa taulun teksti näyttää sumealta. Tarvitset näöntarkastuksen ja ehkä silmälasit.",
  "oikea": "Optikko", "tutkinto": "Optikko (AMK), ammattikorkeakoulu",
  "vaihtoehdot": {
   "Farmaseutti": "Farmaseutti neuvoo lääkkeiden käytössä apteekissa. Silmälasit sovittaa optikko.",
   "Optikko": "Optikko tutkii näön ja sovittaa sopivat silmälasit tai piilolinssit.",
   "Lähihoitaja": "Lähihoitaja ei tee näöntarkastuksia. Näön tutkii optikko.",
   "Fysioterapeutti": "Fysioterapeutti auttaa liikkumisessa ja kuntoutuksessa, ei näössä."}},
 {"tilanne": "Leikkaussalissa käytetyt välineet pitää puhdistaa, pakata ja steriloida seuraavaa leikkausta varten.",
  "oikea": "Välinehuoltaja", "tutkinto": "Välinehuoltoalan perustutkinto (amis)",
  "vaihtoehdot": {
   "Sairaanhoitaja": "Sairaanhoitaja käyttää välineitä leikkauksessa, mutta niiden puhdistuksesta ja steriloinnista huolehtii välinehuoltaja.",
   "Lähihoitaja": "Lähihoitaja hoitaa potilaita. Leikkausvälineiden sterilointi on välinehuoltajan työtä.",
   "Välinehuoltaja": "Välinehuoltaja pesee, pakkaa ja steriloi sairaalan välineet, jotta ne ovat puhtaita ja turvallisia.",
   "Bioanalyytikko": "Bioanalyytikko tutkii näytteitä laboratoriossa. Välineet huoltaa välinehuoltaja."}},
 {"tilanne": "Terveyskeskuksessa sinulta otetaan verikoe. Näyte pitää tutkia laboratoriossa.",
  "oikea": "Bioanalyytikko", "tutkinto": "Bioanalyytikko (AMK), ammattikorkeakoulu",
  "vaihtoehdot": {
   "Bioanalyytikko": "Bioanalyytikko ottaa näytteitä ja tutkii niitä laboratoriossa. Tulosten avulla lääkäri näkee, mikä on vialla.",
   "Sairaanhoitaja": "Sairaanhoitaja voi ottaa näytteen, mutta laboratoriossa näytteen tutkii bioanalyytikko.",
   "Lääkäri": "Lääkäri tulkitsee tulokset, mutta näytteen tutkii laboratoriossa bioanalyytikko.",
   "Välinehuoltaja": "Välinehuoltaja huoltaa sairaalan välineet. Näytteet tutkii bioanalyytikko."}},
 {"tilanne": "Kaverisi kaatui pyörällä eikä herää. Soitat heti hätänumeroon 112. Kuka vastaa puheluun?",
  "oikea": "Hätäkeskuspäivystäjä", "tutkinto": "Hätäkeskuspäivystäjätutkinto, Pelastusopisto",
  "vaihtoehdot": {
   "Ensihoitaja": "Ensihoitaja tulee paikalle ambulanssilla, kun hätäkeskus lähettää hänet. Puheluun vastaa hätäkeskuspäivystäjä.",
   "Hätäkeskuspäivystäjä": "Hätäkeskuspäivystäjä vastaa numeroon 112, kysyy tärkeät asiat ja lähettää avun paikalle.",
   "Lääkäri": "Lääkäri hoitaa potilasta sairaalassa. Hätäpuheluun vastaa hätäkeskuspäivystäjä.",
   "Sairaanhoitaja": "Sairaanhoitaja työskentelee esimerkiksi sairaalassa. Hätäpuheluun vastaa hätäkeskuspäivystäjä."}},
 {"tilanne": "Kaverisuhteet ovat menneet solmuun, ja kouluun lähteminen tuntuu raskaalta. Kenen koulun ammattilaisen kanssa voit jutella asiasta?",
  "oikea": "Kuraattori", "tutkinto": "Sosionomi (AMK) tai muu soveltuva korkeakoulututkinto",
  "vaihtoehdot": {
   "Kuraattori": "Kuraattori on koulun sosiaalialan ammattilainen. Hän auttaa, kun kaverisuhteet, koulunkäynti tai kotiasiat painavat mieltä.",
   "Kouluterveydenhoitaja": "Melkein! Myös terveydenhoitajalle voi kertoa, jos mieltä painaa. Kaverisuhteiden ja koulunkäynnin pulmissa koulun oma asiantuntija on kuraattori.",
   "Fysioterapeutti": "Fysioterapeutti auttaa liikkumisessa ja kuntoutuksessa. Kaverisuhteiden pulmissa auttaa kuraattori.",
   "Lähihoitaja": "Lähihoitaja työskentelee esimerkiksi sairaalassa tai kotihoidossa. Koulussa kaverisuhteiden pulmissa auttaa kuraattori."}},
]

LOPPU_TEKSTI = "Seurasit yhtä iltaa hätäpuhelusta sairaalaan ja ratkaisit kahdeksan tilannetta. Samalla tutustuit yli kymmeneen sote-alan ammattiin."

OPPILAITOKSET = ("Missä sote-alaa voi opiskella?", "Valitse alue")
SAILYTA = ["Valitse alue", "Koulutukset: SOTE (Uusimaa)", "Koulutukset: SOTE (Muu Suomi)"]
SAILYTA_KORVAUKSET = [("elintarvikealan koulutuksia", "sote-alan koulutuksia")]
