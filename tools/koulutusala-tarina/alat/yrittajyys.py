# -*- coding: utf-8 -*-
"""Yrittäjyys – "Kesäkahvila" (sisältö). Uusi ala, kuuluu kauppa ja yrittäjyys -alaan.
Rakenna: python3 rakenna_tarina.py alat/yrittajyys.py <orig palvelu-ala.html> <uusi yrittajyys-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on 16-vuotias nuori yrittäjä, joka perustaa kaverinsa Eetun kanssa kesäkahvilan rannalle.
Tarina kulkee avajaispäivänä klo 9–16. Ammatit: yritysneuvoja, pankin asiakasneuvoja, tukkumyyjä,
kirjanpitäjä, markkinointiassistentti ja kokenut yrittäjä. Loppuosan tehtävä on "Kannattavuuslaskuri"
(TEHTAVA tyyppi "kannattavuus"): oppilas säätää hintaa, aukioloa ja mainontaa kolmena viikkona.

Jokaisessa kohtauksessa on paras vaihtoehto, järkevä mutta heikompi vaihtoehto (piirre 1 + tyyli)
ja huono vaihtoehto (ei piirteitä, tyyli + seuraus lopussa)."""

ala = "yrittajyys"
alaNimi = "Yrittäjyys"
tarinaNimi = "Kesäkahvila"
maailma = "rantakahvila"
yleisKohtaus = "ranta"
katsoTeksti = "Katso rantaa"
kello = {"alku": 9 * 60, "raja": 7 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Yrittajyys", "ifid": "0937fcbb-9280-4868-b0a9-e9a6fc42b1f4"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Avajaiset klo 16.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Kesäkahvilan värit: kahvinruskea, mansikanpunainen ja kesätaivaan sininen
TEEMA = """:root {
  --a1: #ffb35c; --a1-rgb: 255,179,92;
  --a2: #ff6f7d; --a2-rgb: 255,111,125;
  --a3: #ffe9d2;
  --korostus: #ffd27a; --korostus-rgb: 255,210,122;
  --tausta: #1e1713; --tausta-rgb: 30,23,19;
  --tausta-2: #2a201a; --tausta-2-rgb: 42,32,26;
  --paneeli: #251c17; --paneeli-rgb: 37,28,23;
  --paneeli-2: #33261f;
  --tumma: #120d0a; --tumma-rgb: 18,13,10;
  --reuna: #ffb35c;
  --teksti-pehmea: #f1e4d8; --teksti-pehmea-rgb: 241,228,216;
  --teksti-vaalea: #fffaf4;
  --nappi-teksti: #2a1406;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a1), var(--a2));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #fff0de;
  --kansi-nappi-varjo: #7a3a1a;
  --kansi-nappi-hehku: 255,179,92;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Kauppa ja yrittäjyys", otsikko="Yrittäjyys",
             alaotsikko="Kesäkahvila · Mitä kaikkea pitää osata, kun perustaa oman yrityksen?",
             nappi="Avaa kahvila", ikoni="kuppi")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet 16-vuotias ja perustat kaverisi Eetun kanssa kesäkahvilan rannalle. Tänään on avajaispäivä. Ennen avajaisia tapaat monta ammattilaista, jotka auttavat yrittäjiä. Joka kerta päätät, mikä on paras tapa toimia.",
            faktat=[("6", "ammattilaista"), ("7", "tuntia aikaa"), ("1", "oma yritys")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "yrittaja-kioski-tausta.webp",
               "alku": KUVA + "yrittaja-kahvila-tausta.webp",
               "tehtava": KUVA + "yrittaja-kahvi-tausta.webp",
               "kortti": KUVA + "yrittaja-leivokset-tausta.webp",
               "loppu": [KUVA + "yrittaja-kahvila-tausta.webp", KUVA + "yrittaja-kioski-tausta.webp"],
               "oppilaitokset": [KUVA + "yrittaja-kahvi-tausta.webp", KUVA + "yrittaja-leivokset-tausta.webp"]}

TARINA_ALKU = dict(nimi="Avajaispäivä", tausta="ranta", teksti="""<<include "HUD">>
<h1>Avajaispäivä</h1>
<p>Kello on 9.00. Seisot rannalla punaisen kioskin edessä. Kyltissä lukee Kahvila Laituri. Se on sinun ja Eetun oma yritys.</p>
<p>Avajaiset ovat kello 16. Sitä ennen pitää hoitaa vielä monta asiaa: suunnitelma, rahat, ostokset, kuitit ja mainos.</p>
<p class="puhe"><strong>Eetu, yrityskumppanisi:</strong> ”Jännittää! Mennään ensin yritysneuvojalle, kuten sovittiin.”</p>
<div class="intro-nappi"><<link "Aloita päivä">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Yritysneuvonta", tausta="neuvoja", otsikko="Kenelle kahvila on?", avain="yritysneuvoja",
      taustakuva=KUVA + "yrittaja-kahvila-tausta.webp",
      kysymys="Miltä yritysneuvojan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän yli kymmenen.",
      johdanto="""<p>Yritysneuvoja Mira auttaa uusia yrittäjiä maksutta. Hän käy kanssanne läpi liiketoimintasuunnitelman eli suunnitelman siitä, miten yritys toimii ja tekee rahaa.</p>
<p class="puhe"><strong>Mira, yritysneuvoja:</strong> ”Keitä asiakkaanne ovat ja mitä myytte?”</p>""",
      valinnat=[
       dict(teksti="Asiakkaita ovat rannan perheet, uimarit ja pyöräilijät. Myydään vain muutamaa tuotetta: kahvia, mehua, jäätelöä ja kahta leivonnaista.", aika=45, piirteet={"asiakas": 2, "laskija": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Kun tiedät asiakkaasi, tiedät myös, mitä he haluavat ostaa. Lyhyt valikoima on helppo hoitaa, eikä raaka-aineita mene hukkaan.</p>"),
       dict(teksti="Myydään vähän kaikkea: smoothieita, salaatteja, hampurilaisia ja kahvia. Silloin jokainen löytää jotain.", tyyli="rohkea", aika=25, piirteet={"luova": 1},
            palaute="<p><strong>Iso idea, mutta…</strong></p><p>Laaja valikoima tarkoittaa paljon raaka-aineita ja laitteita. Osa pilaantuu, ja pienessä kioskissa työ ruuhkautuu. Mira neuvoo valitsemaan kohderyhmän ja lyhyen valikoiman.</p>"),
       dict(teksti="Suunnitelmaa ei tarvita. Katsotaan kesän aikana, mikä myy.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Riskialtista.</strong></p><p>Ilman suunnitelmaa et tiedä, mitä ostaa ja paljonko pyytää hintaa. Mira auttaa miettimään asiakkaat ja tuotteet ennen avajaisia.</p>"),
      ]),
 dict(nimi="Pankki", tausta="pankki", otsikko="Kahvinkeitin maksaa", avain="pankki",
      kysymys="Miltä pankin asiakasneuvojan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli kahdentoista aikaan.",
      johdanto="""<p>Kioskiin tarvitaan kunnon kahvinkeitin. Uusi kone maksaa 2 400 euroa. Teillä on säästöjä yhteensä 1 000 euroa.</p>
<p>Pankin asiakasneuvoja Jari kuuntelee suunnitelmaanne.</p>
<p class="puhe"><strong>Jari, pankin asiakasneuvoja:</strong> ”Miten aiotte rahoittaa koneen?”</p>""",
      valinnat=[
       dict(teksti="Ostetaan huollettu, käytetty kone 900 eurolla omista säästöistä. Jari laskee kanssanne, paljonko rahaa jää kesän ostoksiin.", aika=45, piirteet={"laskija": 2, "vastuullinen": 1},
            palaute="<p><strong>Viisas ratkaisu!</strong></p><p>Kun aloittaa pienesti, yritys ei ole heti velkaa. Jari auttaa laskemaan, että rahaa jää myös raaka-aineisiin ja yllättäviin kuluihin.</p>"),
       dict(teksti="Vuokrataan uusi kone 150 eurolla kuukaudessa. Silloin isoa summaa ei tarvita heti.", tyyli="kaytannollinen", aika=25, piirteet={"laskija": 1},
            palaute="<p><strong>Toimii, mutta laske kokonaishinta.</strong></p><p>Vuokra on kulu joka kuukausi, vaikka satasi koko viikon. Jari näyttää, että käytetty kone tulisi kesän aikana halvemmaksi.</p>"),
       dict(teksti="Otetaan pikalaina netistä. Rahat tulevat tilille heti, ja ostetaan uusi kone.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei kannata.</strong></p><p>Pikalainan korko on usein todella suuri, ja velka kasvaa nopeasti. Alaikäinen ei voi edes ottaa lainaa ilman huoltajaa. Jari auttaa löytämään edullisemman ratkaisun.</p>"),
      ]),
 dict(nimi="Tukkumyymälä", tausta="tukku", otsikko="Paljonko ostetaan?", avain="tukkumyyja",
      taustakuva=KUVA + "yrittaja-leivokset-tausta.webp",
      kysymys="Miltä tukkumyyjän työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli yhden aikaan.",
      johdanto="""<p>Tukkumyymälässä yritykset ostavat tuotteita isoina erinä. Myyjä Sami esittelee kahvia, mehuja, jäätelöä ja leivontatarvikkeita.</p>
<p>Jos ostatte koko kesän tarpeet kerralla, saatte 20 prosentin alennuksen.</p>
<p class="puhe"><strong>Sami, tukkumyyjä:</strong> ”Paljonko laitetaan kärryyn?”</p>""",
      valinnat=[
       dict(teksti="Ostetaan ensimmäisen viikon tarpeet. Sami kertoo, mitkä tuotteet säilyvät pitkään. Lisää tilataan sen mukaan, mikä myy.", aika=45, piirteet={"laskija": 2, "vastuullinen": 1},
            palaute="<p><strong>Hyvä suunnitelma!</strong></p><p>Alussa et vielä tiedä, mikä myy parhaiten. Kun ostat vähän kerrallaan, rahaa ei jää kiinni varastoon eikä tuotteita pilaannu.</p>"),
       dict(teksti="Ostetaan joka aamu lähikaupasta vain sen päivän tarpeet. Silloin mitään ei jää yli.", tyyli="kaytannollinen", aika=25, piirteet={"laskija": 1},
            palaute="<p><strong>Ei hukkaa, mutta kallista.</strong></p><p>Lähikaupassa hinnat ovat korkeampia kuin tukussa, ja kauppareissut vievät aikaa joka päivä. Viikon ostokset tukusta ovat parempi tasapaino.</p>"),
       dict(teksti="Ostetaan koko kesän tarpeet kerralla, koska alennus on iso.", tyyli="rohkea", aika=20, piirteet={},
            palaute="<p><strong>Alennus houkuttaa, mutta…</strong></p><p>Kaikki rahat menevät kerralla, eikä niitä jää muihin kuluihin. Osa tuotteista pilaantuu ennen kuin ne myydään. Sami suosittelee aloittamaan viikon tarpeista.</p>"),
      ]),
 dict(nimi="Kuitit", tausta="kirjanpito", otsikko="Kuittipino", avain="kirjanpitaja",
      taustakuva=KUVA + "yrittaja-kahvi-tausta.webp",
      kysymys="Miltä kirjanpitäjän työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen kahta.",
      johdanto="""<p>Kioskin tiskillä on jo pino kuitteja: tukkuostokset, maalit, kyltti ja pari käteisellä maksettua ostosta.</p>
<p>Kirjanpitäjä Anu hoitaa kahvilan kirjanpidon. Kirjanpito tarkoittaa, että kaikki yrityksen tulot ja menot merkitään muistiin.</p>
<p class="puhe"><strong>Anu, kirjanpitäjä:</strong> ”Miten hoidatte kuitit kesän aikana?”</p>""",
      valinnat=[
       dict(teksti="Jokaisesta ostoksesta otetaan kuitti, ja se kuvataan heti kirjanpitosovellukseen. Anu tarkistaa ne kerran kuussa.", aika=45, piirteet={"vastuullinen": 2, "laskija": 1},
            palaute="<p><strong>Täydellistä!</strong></p><p>Kun kuitit tallennetaan heti, mikään ei katoa. Anu näkee koko ajan, kannattaako kahvila, ja verot voidaan laskea oikein.</p>"),
       dict(teksti="Kuitit kerätään kenkälaatikkoon, ja ne viedään Anulle syksyllä.", tyyli="luottavainen", aika=25, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Kuitit säilyvät, mutta…</strong></p><p>Lämpöpaperille tulostettu kuitti haalistuu, ja osa katoaa kesän aikana. Et myöskään tiedä kesken kesän, teetkö voittoa. Tallenna kuitit heti.</p>"),
       dict(teksti="Pieniä käteisostoksia ei kirjata. Ne ovat vain muutaman euron ostoksia.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Yrityksen kaikki menot ja tulot pitää kirjata, myös pienet. Pienistä summista kertyy kesän aikana paljon. Anu neuvoo tallentamaan jokaisen kuitin.</p>"),
      ]),
 dict(nimi="Somemainos", tausta="some", otsikko="Avajaismainos", avain="markkinointi",
      taustakuva=KUVA + "yrittaja-leivokset-tausta.webp",
      kysymys="Miltä markkinointiassistentin työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen kolmea.",
      johdanto="""<p>Avajaisista pitää kertoa ihmisille. Markkinointiassistentti Noora on luvannut auttaa kahvilan somen kanssa.</p>
<p>Eetu on leiponut mansikkamuffinsseja, ja kioski on maalattu.</p>
<p class="puhe"><strong>Noora, markkinointiassistentti:</strong> ”Millainen mainos tehdään?”</p>""",
      valinnat=[
       dict(teksti="Kuvataan omat muffinssit ja kioski. Julkaisussa kerrotaan avajaistarjouksesta, ja kommentteihin vastataan.", aika=45, piirteet={"luova": 2, "asiakas": 1},
            palaute="<p><strong>Loistavaa!</strong></p><p>Omat kuvat näyttävät, millainen kahvila oikeasti on. Kun vastaat kommentteihin, asiakkaat tuntevat olevansa tervetulleita jo ennen avajaisia.</p>"),
       dict(teksti="Ostetaan maksettu mainos, joka näkyy koko kaupungissa.", tyyli="rohkea", aika=25, piirteet={"luova": 1},
            palaute="<p><strong>Näkyvyyttä, mutta kallista.</strong></p><p>Mainos näkyy myös ihmisille, jotka eivät koskaan tule rannalle. Noora neuvoo kohdistamaan mainoksen lähialueelle ja tekemään sen omilla kuvilla.</p>"),
       dict(teksti="Otetaan netistä hieno kuva kahvikupista. Se näyttää ammattimaiselta.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei saa.</strong></p><p>Netin kuvat kuuluvat niiden ottajille. Jos käytät kuvaa ilman lupaa, voit joutua maksamaan korvauksen. Ja asiakas haluaa nähdä juuri teidän kahvilanne.</p>"),
      ]),
 dict(nimi="Koeavaus", tausta="asiakas", otsikko="Kylmä kahvi", avain="yrittaja",
      taustakuva=KUVA + "yrittaja-kioski-tausta.webp",
      kysymys="Miltä kokeneen yrittäjän työ näytti?",
      johdanto="""<p>Ennen virallisia avajaisia kutsutte naapurit koeavaukseen. Jonoa kertyy nopeasti.</p>
<p>Yksi asiakas palaa tiskille. Hänen kahvinsa on haaleaa, ja hän on jonottanut kauan. Naapurin leipomon yrittäjä Leena seuraa tilannetta vieressä.</p>
<p class="puhe"><strong>Leena, yrittäjä:</strong> ”Tämä on tärkeä hetki. Miten toimit?”</p>""",
      valinnat=[
       dict(teksti="Pyydät anteeksi ja keität heti uuden kahvin. Kysyt, mitä voisitte tehdä paremmin. Jono nopeutuu, kun Eetu ottaa maksut ja sinä teet juomat.", aika=45, piirteet={"asiakas": 2, "vastuullinen": 1},
            palaute="<p><strong>Ammattilaisen ote!</strong></p><p>Asiakas, jonka valitukseen vastataan hyvin, palaa usein uudelleen. Palaute auttaa myös korjaamaan ongelman, kuten työnjaon jonossa.</p>"),
       dict(teksti="Annat asiakkaalle rahat takaisin ja pahoittelet.", tyyli="empaattinen", aika=25, piirteet={"asiakas": 1},
            palaute="<p><strong>Ystävällistä, mutta…</strong></p><p>Asiakas saa rahansa, mutta jää ilman kahvia. Et myöskään saa tietää, mikä meni pieleen. Uusi kahvi ja palautteen kysyminen auttavat enemmän.</p>"),
       dict(teksti="Selität, että kone on uusi ja että muutkin ovat joutuneet odottamaan.", tyyli="suora", aika=15, piirteet={},
            palaute="<p><strong>Ei toimi.</strong></p><p>Selitys kuulostaa puolustelulta, eikä asiakkaan ongelma ratkea. Pyydä anteeksi, korjaa virhe heti ja kysy palautetta.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Avajaiset", teksti="""<h1>Avajaiset</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>, kun kahvila on valmis. Kello 16 avajaiset alkavat!</p>
<p>Ensimmäiset asiakkaat tulevat uimarannalta. Eetu ojentaa jäätelöä, ja sinä keität kahvia. Kassaan kertyy ensimmäiset eurot omasta yrityksestä.</p>
<p>Huomasitko? Pienenkin yrityksen perustamiseen tarvittiin monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Mira, yritysneuvoja</strong> – auttoi tekemään liiketoimintasuunnitelman</li>
<li><strong>Jari, pankin asiakasneuvoja</strong> – auttoi rahoituksessa</li>
<li><strong>Sami, tukkumyyjä</strong> – neuvoi ostoksissa</li>
<li><strong>Anu, kirjanpitäjä</strong> – opetti hoitamaan kuitit</li>
<li><strong>Noora, markkinointiassistentti</strong> – teki mainoksen kanssanne</li>
<li><strong>Leena, yrittäjä</strong> – näytti, miten asiakasta palvellaan</li>
</ul>
<p>Myyjäksi, kirjanpitäjäksi ja markkinointiassistentiksi voi opiskella ammattikoulussa liiketoiminnan perustutkinnossa. Tutkinnon nimike on merkonomi. Yritysneuvojat ja pankin asiantuntijat ovat usein tradenomeja, ja tradenomiksi opiskellaan ammattikorkeakoulussa. Yrittäjäksi voi ryhtyä minkä tahansa alan ammattilainen.</p>""")

PIIRTEET = {
 "laskija": {"nimi": "Tarkka laskija", "kuvaus": "Lasket, paljonko asiat maksavat, ennen kuin päätät."},
 "asiakas": {"nimi": "Asiakkaan kuuntelija", "kuvaus": "Mietit, mitä asiakas oikeasti tarvitsee."},
 "luova": {"nimi": "Ideoija", "kuvaus": "Keksit omia tapoja tehdä asioita."},
 "vastuullinen": {"nimi": "Vastuullinen yrittäjä", "kuvaus": "Hoidat rahat, säännöt ja lupaukset kunnolla."},
}

AMMATIT = {
 "yritysneuvoja": {"nimi": "Yritysneuvoja", "kuvaus": "Auttaa uusia yrittäjiä suunnittelemaan yrityksen ja selvittämään, mitä perustamiseen tarvitaan.",
                   "tutkinto": "Tradenomi (AMK)", "piirteet": ["asiakas", "laskija"]},
 "pankki": {"nimi": "Pankin asiakasneuvoja", "kuvaus": "Neuvoo ihmisiä ja yrityksiä raha-asioissa, säästämisessä ja lainoissa.",
            "tutkinto": "Liiketoiminnan perustutkinto (merkonomi) tai tradenomi (AMK)", "piirteet": ["laskija", "vastuullinen"]},
 "tukkumyyja": {"nimi": "Tukkumyyjä", "kuvaus": "Myy tuotteita yrityksille ja neuvoo, mitä kannattaa ostaa.",
                "tutkinto": "Liiketoiminnan perustutkinto (merkonomi)", "piirteet": ["asiakas", "laskija"]},
 "kirjanpitaja": {"nimi": "Kirjanpitäjä", "kuvaus": "Merkitsee yritysten tulot ja menot ja laskee verot.",
                  "tutkinto": "Liiketoiminnan perustutkinto (merkonomi) tai tradenomi (AMK)", "piirteet": ["laskija", "vastuullinen"]},
 "markkinointi": {"nimi": "Markkinointiassistentti", "kuvaus": "Tekee mainoksia, somepäivityksiä ja kampanjoita.",
                  "tutkinto": "Liiketoiminnan perustutkinto (merkonomi)", "piirteet": ["luova", "asiakas"]},
 "yrittaja": {"nimi": "Yrittäjä", "kuvaus": "Johtaa omaa yritystään ja vastaa sen asiakkaista, rahoista ja työntekijöistä.",
              "tutkinto": "Minkä tahansa alan koulutus, esimerkiksi yrittäjän ammattitutkinto", "piirteet": ["asiakas", "vastuullinen"]},
}

KUTSU_JOHDANTO = "Avajaiset onnistuivat! Nyt alkaa varsinainen kesä. Kannattavuuslaskurilla pääset kokeilemaan, miten hinta, aukioloaika ja mainonta vaikuttavat siihen, tekeekö kahvila voittoa."

def S(avain, nimi, mi, ma, askel, oletus, muoto, vihje, yksikko=""):
    return {"avain": avain, "nimi": nimi, "min": mi, "max": ma, "askel": askel, "oletus": oletus, "muoto": muoto, "vihje": vihje, "yksikko": yksikko}

TEHTAVA = dict(
    tyyppi="kannattavuus",
    nimi="Kannattavuuslaskuri", tag="Tehtävä · noin 15 min",
    maara="<strong>kolme kesäviikkoa</strong>",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Säädä jokaiselle viikolle hinta, aukioloaika ja mainonta. Yritä saavuttaa viikon tavoitteet.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Luvut ja kaavio päivittyvät heti, kun liikutat säätimiä. Kun lukitset viikon suunnitelman, näet, mitkä tavoitteet täyttyivät. Voit muuttaa valintoja ja yrittää uudelleen. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Kahvilasi kesä",
    osa1="Osa 1/2 · Viikko", osa2="Osa 2/2 · Perustelut",
    tavoitteetOtsikko="Viikon tavoitteet",
    asiakkaatNimi="Asiakkaita viikossa", tulotNimi="Tulot", kulutNimi="Kulut", voittoNimi="Voitto", tappioNimi="Tappio", voittoalue="Voittoalue",
    erittelyNimi="Mistä kulut tulevat?", kiinteatNimi="Vuokra, sähkö ja lainan lyhennys", raakaNimi="Raaka-aineet",
    palkatNimi="Kesätyöntekijän palkka", mainosNimi="Mainonta",
    ennusteTeksti="Ennuste:", xAkseli="asiakkaita viikossa",
    rajaTeksti="Kannattavuusraja", rajaYksikko="asiakasta viikossa",
    rajaYli="Ennuste ylittää rajan, joten kahvila tekee voittoa.", rajaAli="Ennuste jää rajan alle, joten kahvila tekee tappiota.",
    rajaEi="Hinta on niin pieni, ettei se kata edes raaka-aineita.",
    tarkistaNappi="Lukitse viikon suunnitelma", palautaNappi="Palauta alkuarvot", muokkaaNappi="Muuta valintoja",
    seuraavaNappi="Seuraava viikko", jatkaNappi="Jatka perusteluihin", takaisinNappi="Takaisin laskuriin", valmisNappi="Katso tulos",
    perusteluOtsikko="Kesä on laskettu!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="KANNATTAVUUSLASKELMA · KAHVILA LAITURI",
    palaute=["Huippuyrittäjä! Kahvila tekee voittoa, ja asiakkaat ovat tyytyväisiä.",
             "Hyvä kesä! Pari säätöä vielä, niin kahvila olisi täysin kannattava.",
             "Hyvä alku! Lue tavoitteiden selitykset ja kokeile säätää hintaa, aukioloa ja mainontaa."],
    malli=dict(perushinta=3.5, perustunnit=8, kilpailuJousto=1.0, mainosMax=0.3, mainosPuoli=80,
               kiinteat=450, raakaaine=1.4, tuntipalkka=14),
    saatimet=[
        S("hinta", "Hinta (kahvi + pulla)", 2, 8, 0.5, 3.5, "euro2", "Kalliimpi hinta tuo enemmän rahaa asiakasta kohden, mutta asiakkaita tulee vähemmän."),
        S("tunnit", "Auki päivässä", 2, 12, 1, 8, "tunnit", "Pidempi aukiolo tuo asiakkaita, mutta kesätyöntekijän palkka kasvaa.", "h"),
        S("mainonta", "Mainonta viikossa", 0, 200, 25, 50, "euro", "Mainos tuo uusia asiakkaita, mutta vaikutus pienenee, kun summa kasvaa."),
    ],
    viikot=[
        dict(nimi="Aurinkoinen kesäkuu", ikoni="☀️", perusasiakkaat=700, k=0.45, tuntiEksp=0.7,
             kuvaus="Helle jatkuu koko viikon, ja ranta on täynnä ihmisiä. Nyt kannattaa tehdä voittoa, jotta sadepäivien varalle jää rahaa.",
             saannot=[
                {"tyyppi": "tulosVah", "arvo": 0, "nimi": "Kahvila ei tee tappiota",
                 "selitys": "Tulojen pitää olla suuremmat kuin kulujen. Muuten yrityksen rahat loppuvat."},
                {"tyyppi": "tulosVah", "arvo": 400, "nimi": "Voittoa tulee vähintään 400 €",
                 "selitys": "Hyvinä viikkoina kannattaa säästää, koska sadeviikkoina tulee tappiota. Kokeile pidempää aukioloa ja vähän mainontaa."},
                {"tyyppi": "hintaMax", "arvo": 4.5, "nimi": "Hinta on enintään 4,50 €",
                 "selitys": "Liian kallis hinta karkottaa rannan perheet. Kohtuullinen hinta saa asiakkaat palaamaan."},
             ]),
        dict(nimi="Sadeviikko", ikoni="🌧️", perusasiakkaat=400, k=0.3, tuntiEksp=0.35,
             kuvaus="Koko viikon sataa. Uimarit ovat poissa, ja asiakkaita tulee vain sadetaukojen aikana. Voittoa on vaikea tehdä, mutta tappion voi pitää pienenä.",
             saannot=[
                {"tyyppi": "tulosVah", "arvo": -200, "nimi": "Tappio on enintään 200 €",
                 "selitys": "Vuokra pitää maksaa joka tapauksessa. Kun aukioloa lyhennetään, palkkakulut pienenevät, mutta asiakkaita ei menetetä paljon, koska heitä tulee vain sadetaukojen aikana."},
                {"tyyppi": "tunnitMin", "arvo": 4, "nimi": "Kahvila on auki vähintään 4 tuntia päivässä",
                 "selitys": "Jos kahvila on usein kiinni, asiakkaat eivät tiedä, milloin sinne voi tulla."},
                {"tyyppi": "hintaMax", "arvo": 5, "nimi": "Hinta on enintään 5 €",
                 "selitys": "Hinnan nostaminen sadepäivänä tuntuu asiakkaista epäreilulta."},
             ]),
        dict(nimi="Kilpailija avaa viereen", ikoni="🏪", perusasiakkaat=600, k=0.45, tuntiEksp=0.7, kilpailijanHinta=3.0,
             kuvaus="Rannan toiseen päähän avautuu kahvila, jossa kahvi ja pulla maksavat 3 €. Jos hintasi on kalliimpi, moni menee sinne.",
             saannot=[
                {"tyyppi": "tulosVah", "arvo": 0, "nimi": "Kahvila ei tee tappiota",
                 "selitys": "Kilpailu vie asiakkaita. Kun hinta on kilpailukykyinen ja kahvila auki pitkään, asiakkaita riittää taas."},
                {"tyyppi": "hintaMin", "arvo": 2.5, "nimi": "Hinta on vähintään 2,50 €",
                 "selitys": "Hintasota on vaarallinen. Jos hinta on liian pieni, myynnistä ei jää katetta eli rahaa raaka-aineiden jälkeen."},
                {"tyyppi": "mainontaMin", "arvo": 50, "nimi": "Mainontaan käytetään vähintään 50 €",
                 "selitys": "Kun kilpailija tulee, pitää kertoa, miksi juuri teille kannattaa tulla. Esimerkiksi Eetun mansikkamuffinssit!"},
             ]),
    ],
    kysymykset=[
        {"kysymys": "Miksi kahvila voi tehdä tappiota, vaikka asiakkaita tulee paljon?", "ammattilainen": "Kirjanpitäjä",
         "tutkinto": "Liiketoiminnan perustutkinto (merkonomi)", "placeholder": "Tappiota voi tulla, koska…"},
        {"kysymys": "Mitä tekisit, jos kesällä sataisi monta viikkoa peräkkäin?", "ammattilainen": "Yrittäjä",
         "tutkinto": "Minkä tahansa alan koulutus", "placeholder": "Jos sataisi pitkään, minä…"},
    ],
    ammattilaisetOtsikko="Kaupan ja yrittäjyyden ammatteja",
    ammattilaiset=[
        {"nimi": "Merkonomi", "tehtava": "toimii myyjänä, asiakaspalvelussa, markkinoinnissa tai taloushallinnossa", "tutkinto": "Liiketoiminnan perustutkinto"},
        {"nimi": "Kirjanpitäjä", "tehtava": "hoitaa yritysten tulot, menot ja verot", "tutkinto": "Liiketoiminnan perustutkinto tai tradenomi (AMK)"},
        {"nimi": "Markkinointiassistentti", "tehtava": "tekee mainoksia ja somepäivityksiä", "tutkinto": "Liiketoiminnan perustutkinto"},
        {"nimi": "Tradenomi", "tehtava": "työskentelee esimerkiksi pankissa, yritysneuvonnassa tai esihenkilönä", "tutkinto": "Tradenomi (AMK)"},
        {"nimi": "Yrittäjä", "tehtava": "johtaa omaa yritystään", "tutkinto": "Minkä tahansa alan koulutus"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Perustit kesäkahvilan ja laskit, miten se pysyy kannattavana. Samalla tutustuit kaupan ja yrittäjyyden ammatteihin."

OPPILAITOKSET = ("Missä kauppaa ja yrittäjyyttä voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Kaupan ja yrittäjyyden koulutukset</h2>
<p>Liiketoiminnan perustutkintoa voi opiskella lähes kaikissa ammattiopistoissa. Yrittäjyyttä voi kokeilla jo opiskeluaikana. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Liiketoiminnan perustutkinto", "Tutkintonimike on merkonomi. Voit erikoistua esimerkiksi myyntiin, asiakaspalveluun, markkinointiin tai taloushallintoon.", "https://opintopolku.fi/konfo/fi/haku?keyword=liiketoiminnan%20perustutkinto")
    + kortti("Yrittäjyyttä opiskeluaikana", "Monissa ammattiopistoissa ja lukioissa voi perustaa harjoitusyrityksen esimerkiksi NY Vuosi yrittäjänä -ohjelmassa.", "https://nuoriyrittajyys.fi")
    + """<h3>Myöhemmin</h3>
""" + kortti("Ammattikorkeakoulut", "Tradenomi (AMK) opiskelee liiketaloutta: taloushallintoa, markkinointia, myyntiä ja johtamista.", "https://opintopolku.fi/konfo/fi/haku?keyword=tradenomi")
    + kortti("Yrittäjän ammattitutkinto", "Tutkinto on tarkoitettu yrittäjille ja yritystä suunnitteleville aikuisille.", "https://opintopolku.fi/konfo/fi/haku?keyword=yritt%C3%A4j%C3%A4n%20ammattitutkinto")
    + kortti("Yliopistot", "Kauppatieteiden maisteri opiskelee kauppakorkeakoulussa esimerkiksi taloutta, markkinointia ja johtamista.", "https://opintopolku.fi/konfo/fi/haku?keyword=kauppatieteet")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
SEURAUKSET = {
    "Yritysneuvonta": "Valikoimaa jouduttiin karsimaan viime hetkellä, ja osa raaka-aineista jäi käyttämättä.",
    "Pankki": "Koneen rahoitus piti miettiä uudelleen, ja Jari joutui laskemaan kanssanne kaiken alusta.",
    "Tukkumyymälä": "Ostokset jouduttiin vaihtamaan, ja rahaa kului turhaan.",
    "Kuitit": "Osa kuiteista oli kadonnut, ja Anu joutui selvittämään ostoksia jälkikäteen.",
    "Somemainos": "Mainos piti tehdä uudelleen, ja se julkaistiin vasta juuri ennen avajaisia.",
    "Koeavaus": "Koeavauksen asiakas kertoi huonosta palvelusta myös naapureille.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>, kun kahvila on valmis. Kello 16 avajaiset alkavat, ja kaikki on kunnossa!",
    "Kello on <<print setup.kello($aika)>>, kun kahvila on valmis. Avajaiset alkavat kello 16. Pari asiaa olisi voinut mennä paremmin, mutta päivä onnistui.",
    "Kello on <<print setup.kello($aika)>>, kun kahvila vihdoin on valmis. Päivä oli täynnä korjattavaa, ja Eetu on aika väsynyt.",
]
MYOHASSA = "Kahvila ei ollut valmis kello 16, ja ensimmäiset asiakkaat joutuivat odottamaan."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
