# -*- coding: utf-8 -*-
"""Kauneus ja hyvinvointi – "Oma hoitola auki" (sisältö). Uusi ala, kuuluu palvelualoihin.
Rakenna: python3 rakenna_tarina.py alat/kauneus.py <orig palvelu-ala.html> <uusi kauneus-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on nuori yrittäjä, joka avaa oman hoitolan ja toimii sen vastaavana.
Loppuosan tehtävä on "Hoidon vaiheet" (TEHTAVA tyyppi "jarjestys"): oppilas valitsee
kasvohoidon tai hiusten värjäyksen, järjestää vaiheet oikeaan järjestykseen,
valitsee kolme kotihoito-ohjetta ja perustelee kaksi asiaa."""

ala = "kauneus"
alaNimi = "Kauneus ja hyvinvointi"
tarinaNimi = "Oma hoitola auki"
maailma = "hoitola"
yleisKohtaus = "aula"
katsoTeksti = "Katso hoitolaa"
kello = {"alku": 8 * 60 + 30, "raja": 18 * 60 - (8 * 60 + 30)}
siirtyma = 30
siirtymaTeksti = "Seuraava asiakas tulee puolen tunnin päästä."
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Kauneusala", "ifid": "242ceca2-506b-4b75-bb74-fc5f374ef450"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Hoitola sulkeutuu klo 18.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Pehmeä hoitola: syvä luumu, roosa ja salvianvihreä
TEEMA = """:root {
  --a1: #f4b2bf; --a1-rgb: 244,178,191;
  --a2: #e88aa0; --a2-rgb: 232,138,160;
  --a3: #fbd9df;
  --korostus: #b9dbb0; --korostus-rgb: 185,219,176;
  --tausta: #33212b; --tausta-rgb: 51,33,43;
  --tausta-2: #432c38; --tausta-2-rgb: 67,44,56;
  --paneeli: #3a2631; --paneeli-rgb: 58,38,49;
  --paneeli-2: #4a3240;
  --tumma: #24161e; --tumma-rgb: 36,22,30;
  --reuna: #f4b2bf;
  --teksti-pehmea: #f0dfe4; --teksti-pehmea-rgb: 240,223,228;
  --teksti-vaalea: #fff8fa;
  --nappi-teksti: #3a1220;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #ffe4ea;
  --kansi-nappi-varjo: #8a3e52;
  --kansi-nappi-hehku: 244,160,180;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.94) 0%, rgba(var(--tausta-rgb),.78) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Palveluala", otsikko="Kauneus ja hyvinvointi",
             alaotsikko="Oma hoitola auki · Millaista on, kun avaat oman kauneushoitolan?",
             nappi="Avaa hoitola", ikoni="sydan")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet nuori yrittäjä, ja tänään avaat oman hoitolasi. Päivän aikana tapaat asiakkaita ja kauneus- ja hyvinvointialan ammattilaisia. Miten sinä toimisit?",
            faktat=[("6", "ammattilaista"), ("1", "avajaispäivä"), ("12", "asiakasta")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "kauneus-pyyhkeet-tausta.webp",
               "alku": KUVA + "kauneus-aula-tausta.webp",
               "tehtava": KUVA + "kauneus-rentoutus-tausta.webp",
               "kortti": KUVA + "kauneus-pyyhkeet-tausta.webp",
               "loppu": [KUVA + "kauneus-rentoutus-tausta.webp", KUVA + "kauneus-pyyhkeet-tausta.webp", KUVA + "kauneus-aula-tausta.webp"],
               "oppilaitokset": [KUVA + "kauneus-aula-tausta.webp", KUVA + "kauneus-pyyhkeet-tausta.webp"]}

TARINA_ALKU = dict(nimi="Oma hoitola auki", tausta="aula", teksti="""<<include "HUD">>
<h1>Oma hoitola auki</h1>
<p>Kello on 8.30. Tänään on iso päivä: avaat oman hoitolasi, Hoitola Helmen!</p>
<p>Olet hoitolan vastaava. Se tarkoittaa, että vastaat asiakkaiden turvallisuudesta ja hyvästä palvelusta. Hoitolassa työskentelee parturi-kampaaja, kosmetologi, hieroja ja kosmetiikkaneuvoja.</p>
<p class="puhe"><strong>Laura, estenomi:</strong> ”Onnea avajaisiin! Käydään ensin läpi hygienia, ennen kuin ovet aukeavat.”</p>
<div class="intro-nappi"><<link "Aloita päivä">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Välinehuolto", tausta="valineet", otsikko="Välineet kuntoon", avain="estenomi",
      kysymys="Miltä estenomin työ näytti?",
      johdanto="""<p>Työtasolla on käytettyjä välineitä eiliseltä harjoituspäivältä: pinsettejä, kampoja ja siveltimiä.</p>
<p>Ensimmäinen asiakas tulee pian.</p>
<p class="puhe"><strong>Laura, estenomi:</strong> ”Hoitolassa hygienia on tärkeintä. Mitä näille välineille tehdään?”</p>""",
      valinnat=[
       dict(teksti="Pestään, desinfioidaan ja laitetaan suljettuun kaappiin. Merkitään se hoitolan hygieniavihkoon.", aika=30, piirteet={"huolellinen": 2, "turva": 1},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Puhtaat välineet suojaavat asiakkaita tulehduksilta. Kun puhdistus merkitään ylös, sen voi tarkistaa myöhemmin.</p>"),
       dict(teksti="Pyyhitään ne paperilla. Ne näyttävät ihan puhtailta.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Ei riitä.</strong></p><p>Bakteereja ei näe paljaalla silmällä. Laura näyttää, miten välineet pestään ja desinfioidaan.</p>"),
       dict(teksti="Heitetään kaikki pois ja ostetaan uudet.", tyyli="varovainen", aika=30, piirteet={"turva": 1},
            palaute="<p><strong>Turvallista, mutta turhaa.</strong></p><p>Hyvät välineet kestävät pitkään, kun ne puhdistetaan oikein. Se säästää rahaa ja luontoa.</p>"),
      ]),
 dict(nimi="Kampaamo", tausta="kampaamo", otsikko="Hiusten värjäys", avain="kampaaja",
      kysymys="Miltä parturi-kampaajan työ näytti?",
      johdanto="""<p>Ensimmäinen asiakas, Sara, istuu kampaamotuoliin. Hän haluaa värjätä tummat hiuksensa tänään vaaleiksi, koska huomenna on juhlat.</p>
<p>Sara ei ole koskaan ennen värjännyt hiuksiaan.</p>
<p class="puhe"><strong>Niko, parturi-kampaaja:</strong> ”Hiusväristä voi saada allergisen reaktion. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Kerrotaan rehellisesti: ensin allergiatesti, ja vaalennus tehdään vaiheittain. Tänään tehdään hiustenhoito ja kampaus juhliin.", aika=60, piirteet={"rehellinen": 2, "turva": 1},
            palaute="<p><strong>Ammattilaisen ratkaisu!</strong></p><p>Sara on aluksi pettynyt, mutta kampaus on upea. Hän varaa värjäysajan ensi viikolle.</p>"),
       dict(teksti="Värjätään heti. Asiakas saa sen, mitä haluaa.", tyyli="empaattinen", aika=60, piirteet={},
            palaute="<p><strong>Liian riskialtista.</strong></p><p>Allerginen reaktio voi olla vakava, ja tumma tukka ei vaalene kerralla nätisti. Niko ehdottaa allergiatestiä ja kampausta juhliin.</p>"),
       dict(teksti="Kieltäydytään ja pyydetään Saraa lähtemään.", tyyli="suora", aika=30, piirteet={"turva": 1},
            palaute="<p><strong>Turvallista, mutta asiakas jää ilman palvelua.</strong></p><p>Parempi on kertoa vaihtoehdot. Niko tekee Saralle kampauksen ja varaa värjäysajan.</p>"),
      ]),
 dict(nimi="Kasvohoito", tausta="hoitohuone", otsikko="Kasvohoito", avain="kosmetologi",
      taustakuva=KUVA + "kauneus-naamio-tausta.webp",
      kysymys="Miltä kosmetologin työ näytti?",
      johdanto="""<p>Kosmetologi Emma tekee asiakkaalle kasvohoitoa. Kasvoilla on naamio.</p>
<p>Yhtäkkiä asiakas sanoo: ”Iho kirvelee tosi paljon.” Iho näyttää punoittavan.</p>
<p class="puhe"><strong>Emma, kosmetologi:</strong> ”Mitä teemme?”</p>""",
      valinnat=[
       dict(teksti="Poistetaan naamio heti ja rauhoitetaan iho viileällä kääreellä. Kirjoitetaan tuote asiakkaan tietoihin.", aika=60, piirteet={"turva": 2, "kohtaaja": 1},
            palaute="<p><strong>Oikein!</strong></p><p>Kun ärsyttävä tuote poistetaan heti, iho rauhoittuu. Kun tuote kirjataan ylös, sitä ei käytetä tälle asiakkaalle enää.</p>"),
       dict(teksti="Kirvely kuuluu asiaan. Jatketaan hoitoa.", tyyli="luottavainen", aika=60, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Kirvely ja punoitus voivat olla merkki allergiasta. Emma poistaa naamion heti.</p>"),
       dict(teksti="Laitetaan naamion päälle vielä kosteusvoidetta.", tyyli="kaytannollinen", aika=45, piirteet={},
            palaute="<p><strong>Ei auta.</strong></p><p>Ärsyttävä tuote on yhä iholla. Emma poistaa naamion ja rauhoittaa ihon.</p>"),
      ]),
 dict(nimi="Hieronta", tausta="hieronta", otsikko="Hieronta", avain="hieroja",
      taustakuva=KUVA + "kauneus-kasvohieronta-tausta.webp",
      kysymys="Miltä hierojan työ näytti?",
      johdanto="""<p>Hierontaan tulee asiakas, jolla on kipeä selkä. Hän kertoo, että kipu säteilee jalkaan asti ja varpaat tuntuvat puutuneilta.</p>
<p class="puhe"><strong>Sami, hieroja:</strong> ”Tämä kuulostaa siltä, että asia pitää tutkia tarkemmin. Mitä ajattelet?”</p>""",
      valinnat=[
       dict(teksti="Selkää ei hierota tänään. Neuvotaan asiakasta menemään lääkäriin. Tilalle voi tehdä kevyen niskahieronnan.", aika=45, piirteet={"turva": 2, "kohtaaja": 1},
            palaute="<p><strong>Vastuullista!</strong></p><p>Säteilevä kipu ja puutuminen voivat johtua hermon puristuksesta. Lääkäri selvittää syyn. Asiakas kiittää hyvästä neuvosta.</p>"),
       dict(teksti="Hierotaan selkää kevyesti, ettei kipu pahene.", tyyli="empaattinen", aika=45, piirteet={}, palaute="<p><strong>Ei vielä.</strong></p><p>Kun kipu säteilee jalkaan ja varpaat puutuvat, syy voi olla hermossa. Silloin selkää ei hierota ennen lääkärin tutkimusta. Sami neuvoo asiakasta menemään lääkäriin.</p>"),
       dict(teksti="Perutaan aika ja asiakas lähtee.", tyyli="varovainen", aika=15, piirteet={"turva": 1},
            palaute="<p><strong>Oikea suunta, mutta…</strong></p><p>…asiakas tarvitsee myös neuvon, mihin mennä. Sami neuvoo häntä menemään lääkäriin.</p>"),
      ]),
 dict(nimi="Some", tausta="tiski", otsikko="Kuva someen", avain="merkonomi",
      taustakuva=KUVA + "kauneus-aula-tausta.webp",
      kysymys="Miltä markkinoinnin työ näytti?",
      johdanto="""<p>Iltapäivällä Ella päivittää hoitolan Instagramia. Hän haluaa julkaista ennen ja jälkeen -kuvan Saran juhlakampauksesta.</p>
<p class="puhe"><strong>Ella, merkonomi:</strong> ”Kuva on upea! Laitetaanko se heti nettiin?”</p>""",
      valinnat=[
       dict(teksti="Kysytään Saralta lupa. Jos hän ei halua näkyä, kuvataan vain kampaus takaa.", aika=30, piirteet={"rehellinen": 1, "kohtaaja": 1, "huolellinen": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Sara antaa luvan ja on iloinen, että häneltä kysyttiin. Hän jakaa julkaisun omille kavereilleen.</p>"),
       dict(teksti="Julkaistaan heti. Kuva on niin hieno.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei ilman lupaa.</strong></p><p>Asiakkaan kuvaa ei saa julkaista ilman hänen lupaansa. Ella kysyy Saralta ensin.</p>"),
       dict(teksti="Muokataan kuvaa filtterillä täydelliseksi ja julkaistaan.", tyyli="kaytannollinen", aika=30, piirteet={},
            palaute="<p><strong>Ei rehellistä.</strong></p><p>Kuvan pitää näyttää oikea lopputulos. Muuten asiakkaat pettyvät. Ja lupa tarvitaan silti.</p>"),
      ]),
 dict(nimi="Tuote-esittely", tausta="esittely", otsikko="Ihme-voide?", avain="kosmetiikkaneuvoja",
      taustakuva=KUVA + "kauneus-rentoutus-tausta.webp",
      kysymys="Miltä kosmetiikkaneuvojan työ näytti?",
      johdanto="""<p>Päivän viimeinen asiakas katselee hoitolan tuotehyllyä. Hän ottaa käteensä kalliin voidepurkin.</p>
<p>”Poistaako tämä voide rypyt kokonaan?” hän kysyy.</p>
<p class="puhe"><strong>Iida, kosmetiikkaneuvoja:</strong> ”Mitä hänelle vastataan?”</p>""",
      valinnat=[
       dict(teksti="Kerrotaan rehellisesti: voide kosteuttaa ja voi pehmentää juonteita, mutta ei poista ryppyjä.", aika=30, piirteet={"rehellinen": 2, "kohtaaja": 1},
            palaute="<p><strong>Rehellisyys kannattaa!</strong></p><p>Asiakas arvostaa suoraa vastausta. Hän ostaa voiteen ja lupaa tulla uudelleen.</p>"),
       dict(teksti="Luvataan, että rypyt katoavat kahdessa viikossa.", tyyli="empaattinen", aika=15, piirteet={},
            palaute="<p><strong>Väärä lupaus.</strong></p><p>Asiakas pettyy, kun lupaus ei toteudu. Iida kertoo rehellisesti, mitä voide tekee.</p>"),
       dict(teksti="Myydään kolme purkkia, niin vaikutus on parempi.", tyyli="kaytannollinen", aika=15, piirteet={},
            palaute="<p><strong>Ei reilua.</strong></p><p>Hyvä myyjä myy sitä, mitä asiakas tarvitsee. Iida kertoo rehellisesti, mitä voide tekee.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Ensimmäinen päivä takana", teksti="""<h1>Ensimmäinen päivä takana</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Hoitola Helmen ensimmäinen päivä on ohi!</p>
<<if _taso is 0>><p>Asiakkaat lähtivät hyvällä mielellä, ja ajanvarauskalenteri täyttyy jo ensi viikolle.</p><</if>>
<p>Huomasitko? Hoitolassa tarvittiin monta kauneus- ja hyvinvointialan ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Laura, estenomi</strong> – neuvoi hygieniassa</li>
<li><strong>Niko, parturi-kampaaja</strong> – teki kampauksen ja suunnitteli värjäyksen</li>
<li><strong>Emma, kosmetologi</strong> – hoiti ihoa turvallisesti</li>
<li><strong>Sami, hieroja</strong> – tunnisti, milloin asiakas tarvitsee lääkäriä</li>
<li><strong>Ella, merkonomi</strong> – hoiti markkinoinnin somessa</li>
<li><strong>Iida, kosmetiikkaneuvoja</strong> – neuvoi asiakasta rehellisesti</li>
</ul>
<p>Sinä olit hoitolan vastaava ja yrittäjä. Moneen näistä töistä voi opiskella ammattikoulussa hius- ja kauneudenhoitoalan perustutkinnossa. Moni alan ammattilainen on myöhemmin oma pomonsa eli yrittäjä.</p>""")

PIIRTEET = {
 "huolellinen": {"nimi": "Huolellinen", "kuvaus": "Teet asiat kunnolla, myös ne, joita kukaan ei näe."},
 "turva": {"nimi": "Turvallisuus ensin", "kuvaus": "Huomaat riskit ja suojaat asiakasta."},
 "kohtaaja": {"nimi": "Asiakkaan kuuntelija", "kuvaus": "Kuuntelet, mitä asiakas tarvitsee ja miltä hänestä tuntuu."},
 "rehellinen": {"nimi": "Rehellinen", "kuvaus": "Kerrot asiat suoraan, vaikka myynti voisi kasvaa liioittelemalla."},
}

AMMATIT = {
 "estenomi": {"nimi": "Estenomi", "kuvaus": "Kauneudenhoitoalan asiantuntija, joka kouluttaa, suunnittelee hoitoja ja johtaa hoitoloita.",
              "tutkinto": "Estenomi (AMK), esimerkiksi Laurea", "piirteet": ["huolellinen", "turva"]},
 "kampaaja": {"nimi": "Parturi-kampaaja", "kuvaus": "Leikkaa, värjää ja muotoilee hiuksia.",
              "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto (parturi-kampaaja)", "piirteet": ["rehellinen", "kohtaaja"]},
 "kosmetologi": {"nimi": "Kosmetologi", "kuvaus": "Tekee kasvo-, käsi- ja jalkahoitoja ja neuvoo ihonhoidossa.",
                 "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto (kosmetologi)", "piirteet": ["turva", "huolellinen"]},
 "hieroja": {"nimi": "Hieroja", "kuvaus": "Hoitaa lihaksia ja auttaa rentoutumaan.",
             "tutkinto": "Hieronnan ammattitutkinto (koulutettu hieroja)", "piirteet": ["turva", "kohtaaja"]},
 "merkonomi": {"nimi": "Markkinoinnin tekijä", "kuvaus": "Tekee mainoksia ja somepäivityksiä ja palvelee asiakkaita.",
               "tutkinto": "Liiketoiminnan perustutkinto (merkonomi)", "piirteet": ["kohtaaja", "rehellinen"]},
 "kosmetiikkaneuvoja": {"nimi": "Kosmetiikkaneuvoja", "kuvaus": "Neuvoo asiakkaita kosmetiikan ja ihonhoidon valinnoissa.",
                        "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto (kosmetiikkaneuvoja)", "piirteet": ["rehellinen", "kohtaaja"]},
}

KUTSU_JOHDANTO = "Hoitolassa jokainen hoito tehdään tietyssä järjestyksessä. Nyt on sinun vuorosi: valitse hoito ja järjestä sen vaiheet oikein."

TEHTAVA = dict(
    tyyppi="jarjestys",
    nimi="Hoidon vaiheet", tag="Tehtävä · noin 20 min",
    maara="<strong>yhden hoidon</strong> vaiheet ja kotihoito-ohjeet",
    ohjeAskelLause="Teet kolme asiaa:",
    askeleet=["Valitse kasvohoito tai hiusten värjäys ja järjestä sen vaiheet oikeaan järjestykseen.",
              "Valitse asiakkaalle kolme hyvää kotihoito-ohjetta.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Saat palautetta jokaisen vaiheen jälkeen ja voit korjata vastauksiasi. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Hoitosuunnitelmasi",
    osa0="Valitse hoito", osa1="Osa 1/3 · Hoidon vaiheet", osa2="Osa 2/3 · Kotihoito-ohjeet", osa3="Osa 3/3 · Perustelut",
    valintaOtsikko="Minkä hoidon teet?",
    valintaOhje="Valitse toinen hoidoista. Saat asiakkaan, jolle teet hoidon.",
    ohje="Vaiheet ovat sekaisin. Siirrä ne nuolinapeilla oikeaan järjestykseen: ensimmäinen ylimmäksi.",
    ohjeetOtsikko="Kotihoito-ohjeet", ohjeetOhje="Hoito jatkuu kotona. Valitse asiakkaalle {n} hyvää ohjetta.",
    tarkistaNappi="Tarkista järjestys", jatkaNappi="Jatka kotihoito-ohjeisiin", vaihdaNappi="Vaihda hoitoa",
    ohjeTarkistaNappi="Tarkista ohjeet", jatka2Nappi="Jatka perusteluihin", takaisinNappi="Takaisin järjestykseen", takaisin2Nappi="Takaisin ohjeisiin",
    valmisNappi="Katso tulos",
    perusteluOtsikko="Melkein valmista!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="HOITOSUUNNITELMA · HOITOLA HELMI",
    palaute=["Täydellistä! Hoito etenee oikeassa järjestyksessä, ja asiakas saa hyvät ohjeet.",
             "Hyvää työtä! Pari kohtaa vielä, niin hoito olisi täydellinen.",
             "Hyvä yritys! Katso selitykset: niistä näet, miksi järjestys on tärkeä."],
    hoidot=[
      {"nimi": "Kasvohoito", "ikoni": "🧖", "ammatti": "kosmetologi",
       "asiakas": "Mira, 16, haluaa kasvohoidon, koska hänen ihonsa on kuiva ja vähän epäpuhdas.",
       "vaiheet": [
         {"nimi": "Haastattele asiakas: toiveet, allergiat ja lääkkeet", "selitys": "Haastattelu tehdään aina ensin. Allergia voi muuttaa koko hoidon."},
         {"nimi": "Puhdista iho ja poista meikki", "selitys": "Puhtaalta iholta näkee, millainen iho oikeasti on."},
         {"nimi": "Tutki iho suurennuslampun avulla", "selitys": "Ihon tutkimisen perusteella valitaan oikeat tuotteet."},
         {"nimi": "Kuori iho", "selitys": "Kuorinta poistaa kuolleita ihosoluja, joten seuraavat tuotteet imeytyvät paremmin."},
         {"nimi": "Tee kasvohieronta", "selitys": "Hieronta rentouttaa ja vilkastuttaa verenkiertoa."},
         {"nimi": "Levitä kasvonaamio", "selitys": "Naamio toimii parhaiten puhtaalla ja hierotulla iholla."},
         {"nimi": "Levitä seerumi ja kosteusvoide", "selitys": "Kosteusvoide suojaa ihoa hoidon lopuksi."},
         {"nimi": "Anna kotihoito-ohjeet ja varaa seuraava aika", "selitys": "Hoito jatkuu kotona. Hyvä palvelu päättyy ohjeisiin."},
       ],
       "ohjeet": [
         {"teksti": "Käytä aurinkosuojaa seuraavina päivinä.", "oikein": True, "selitys": "Kuorittu iho palaa auringossa herkemmin."},
         {"teksti": "Mene saunaan heti hoidon jälkeen.", "oikein": False, "selitys": "Kuumuus voi ärsyttää juuri hoidettua ihoa."},
         {"teksti": "Käytä kosteusvoidetta aamuin ja illoin.", "oikein": True, "selitys": "Kuiva iho tarvitsee kosteutta joka päivä."},
         {"teksti": "Kuori iho kotona joka päivä.", "oikein": False, "selitys": "Liian usein kuorittu iho ärtyy. 1–2 kertaa viikossa riittää."},
         {"teksti": "Pese kasvot illalla miedolla puhdistusaineella.", "oikein": True, "selitys": "Illalla puhdistettu iho saa levätä, ja epäpuhtaudet vähenevät."},
         {"teksti": "Purista näppylät pois heti.", "oikein": False, "selitys": "Puristelu voi levittää tulehdusta ja jättää arpia."},
       ]},
      {"nimi": "Hiusten värjäys", "ikoni": "💇", "ammatti": "parturi-kampaaja",
       "asiakas": "Sara, 17, haluaa värjätä hiuksensa kuparinpunaisiksi. Hän ei ole ennen värjännyt hiuksiaan.",
       "vaiheet": [
         {"nimi": "Keskustele asiakkaan kanssa: toivottu sävy ja hiusten kunto", "selitys": "Ensin selvitetään, mitä asiakas haluaa ja onnistuuko se hänen hiuksillaan."},
         {"nimi": "Tee allergiatesti 48 tuntia ennen värjäystä", "selitys": "Hiusväri voi aiheuttaa allergian. Testi tehdään hyvissä ajoin ennen värjäystä."},
         {"nimi": "Suojaa asiakkaan vaatteet ja iho hiusrajasta", "selitys": "Väri tahraa vaatteet ja ihon helposti."},
         {"nimi": "Sekoita väri valmistajan ohjeen mukaan", "selitys": "Oikea sekoitussuhde ratkaisee lopputuloksen."},
         {"nimi": "Levitä väri ja odota vaikutusaika", "selitys": "Väri tarvitsee aikaa, jotta se tarttuu hiukseen."},
         {"nimi": "Huuhtele, pese ja käytä hoitoainetta", "selitys": "Hoitoaine sulkee hiuksen pinnan ja auttaa väriä pysymään."},
         {"nimi": "Kuivaa, muotoile ja anna kotihoito-ohjeet", "selitys": "Lopuksi asiakas näkee lopputuloksen ja saa ohjeet kotiin."},
       ],
       "ohjeet": [
         {"teksti": "Käytä värjätyille hiuksille tarkoitettua shampoota.", "oikein": True, "selitys": "Se auttaa väriä pysymään kauemmin."},
         {"teksti": "Pese hiukset heti illalla kuumalla vedellä.", "oikein": False, "selitys": "Kuuma vesi ja liian aikainen pesu haalistavat väriä."},
         {"teksti": "Odota päivä tai kaksi ennen ensimmäistä pesua.", "oikein": True, "selitys": "Väri kiinnittyy hiukseen paremmin."},
         {"teksti": "Ui kloorivedessä ilman suojaa joka päivä.", "oikein": False, "selitys": "Kloori haalistaa ja muuttaa hiusten väriä."},
         {"teksti": "Suojaa hiukset lämpösuojalla ennen suoristusrautaa.", "oikein": True, "selitys": "Kuumuus haalistaa väriä ja kuivattaa hiuksia."},
         {"teksti": "Värjää hiukset uudelleen ensi viikolla.", "oikein": False, "selitys": "Liian tiheä värjäys rasittaa hiuksia."},
       ]},
    ],
    kysymykset=[
        {"kysymys": "Miksi hoidon vaiheiden järjestys on tärkeä? Anna yksi esimerkki.", "ammattilainen": "Kosmetologi ja parturi-kampaaja",
         "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto", "placeholder": "Järjestys on tärkeä, koska…"},
        {"kysymys": "Mitä tekisit, jos asiakas sanoisi kesken hoidon, että iho kirvelee?", "ammattilainen": "Kosmetologi",
         "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto (kosmetologi)", "placeholder": "Ensimmäiseksi minä…"},
    ],
    ammattilaisetOtsikko="Kauneus- ja hyvinvointialan ammatteja",
    ammattilaiset=[
        {"nimi": "Kosmetologi", "tehtava": "tekee kasvo-, käsi- ja jalkahoitoja", "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto (kosmetologi)"},
        {"nimi": "Parturi-kampaaja", "tehtava": "leikkaa, värjää ja muotoilee hiuksia", "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto (parturi-kampaaja)"},
        {"nimi": "Kosmetiikkaneuvoja", "tehtava": "neuvoo kosmetiikan valinnassa ja myy tuotteita", "tutkinto": "Hius- ja kauneudenhoitoalan perustutkinto (kosmetiikkaneuvoja)"},
        {"nimi": "Hieroja", "tehtava": "hoitaa lihaksia ja auttaa palautumaan", "tutkinto": "Hieronnan ammattitutkinto (koulutettu hieroja)"},
        {"nimi": "Estenomi", "tehtava": "kouluttaa, kehittää hoitoja ja johtaa hoitoloita", "tutkinto": "Estenomi (AMK)"},
        {"nimi": "Yrittäjä", "tehtava": "pyörittää omaa hoitolaa tai kampaamoa", "tutkinto": "Esimerkiksi perustutkinto ja myöhemmin yrittäjän ammattitutkinto"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Avasit oman hoitolan ja suunnittelit asiakkaalle hoidon vaihe vaiheelta. Samalla tutustuit kauneus- ja hyvinvointialan ammatteihin."

OPPILAITOKSET = ("Missä kauneus- ja hyvinvointialaa voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Kauneus- ja hyvinvointialan koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Hius- ja kauneudenhoitoalan perustutkintoa voi opiskella monessa ammattiopistossa eri puolilla Suomea. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Ammatillinen koulutus</h3>
""" + kortti("Stadin ammattiopisto, Helsinki", "Hius- ja kauneudenhoitoalan perustutkinto: parturi-kampaaja, kosmetiikkaneuvoja tai kosmetologi.", "https://www.hel.fi/fi/kasvatus-ja-koulutus/stadin-ammattiopisto-nilsiankadun-toimipaikka")
    + kortti("Koulutuskeskus Salpaus, Lahti", "Hius- ja kauneudenhoitoalan perustutkinto: kosmetologi ja kampaaja.", "https://www.salpaus.fi/koulutusesittely/kosmetologi/")
    + kortti("Lapin ammattiopisto Redu, Rovaniemi", "Hius- ja kauneudenhoitoalan perustutkinto, esimerkiksi parturi-kampaaja.", "https://www.redu.fi/fi/hakijalle/tutkinnot-ja-koulutukset/ammatilliset-perustutkinnot/hius-ja-kauneudenhoitoalan-perustutkinto")
    + kortti("Hierontakoulut", "Hieronnan ammattitutkinto (koulutettu hieroja). Koulutusta järjestävät monet oppilaitokset ja yksityiset hierontakoulut.", "https://opintopolku.fi/konfo/fi/haku?keyword=hieronnan%20ammattitutkinto")
    + """<h3>Ammattikorkeakoulu</h3>
""" + kortti("Laurea-ammattikorkeakoulu", "Kauneudenhoito- ja kosmetiikka-alan koulutus, estenomi (AMK).", "https://www.laurea.fi")
    + kortti("Etsi lisää Opintopolusta", "Hae sanalla ”hius- ja kauneudenhoitoala”.", "https://opintopolku.fi/konfo/fi/haku?keyword=hius-%20ja%20kauneudenhoitoala")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Välinehuolto": "Välineet piti pestä ja desinfioida uudelleen. Ensimmäinen asiakas joutui odottamaan.",
    "Kampaamo": "Sara ehti pettyä, kun värjäys ei onnistunutkaan heti.",
    "Kasvohoito": "Asiakkaan iho ehti ärtyä. Hoito keskeytettiin, ja asiakas lähti harmissaan.",
    "Hieronta": "Asiakas hämmentyi saamastaan neuvosta. Hän ei ole varma, tuleeko uudelleen.",
    "Some": "Kuvan julkaisu viivästyi, kun lupa piti kysyä jälkikäteen.",
    "Tuote-esittely": "Asiakas huomasi liioittelun ja epäili myyjän rehellisyyttä.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Hoitola Helmen ensimmäinen päivä on ohi! Asiakkaat olivat tyytyväisiä, ja ajanvarauskirja täyttyy.",
    "Kello on <<print setup.kello($aika)>>. Hoitola Helmen ensimmäinen päivä on ohi. Suurin osa asiakkaista oli tyytyväisiä, mutta pari asiaa pitää korjata.",
    "Kello on <<print setup.kello($aika)>>. Hoitola Helmen ensimmäinen päivä oli raskas. Moni asiakas lähti pettyneenä, ja hoitolan maine kärsi.",
]
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
