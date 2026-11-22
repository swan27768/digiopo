# -*- coding: utf-8 -*-
"""Kasvatus ja ohjaus – "Retkipäivä" (sisältö). Uusi ala.
Rakenna: python3 rakenna_tarina.py alat/kasvatus.py <orig palvelu-ala.html> <uusi kasvatus-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on nuoriso-ohjaaja. Nuorisotalo, päiväkodin eskariryhmä ja koulun luokat lähtevät
yhteiselle luontoretkelle laavulle. Tarina kulkee klo 8–15. Ammatit: yhteisöpedagogi,
lastenohjaaja, luokanopettaja, koulunkäynninohjaaja, kommunikaation ja viittomakielen ohjaaja
ja varhaiskasvatuksen opettaja. Loppuosan tehtävä on "Retkiryhmät" (TEHTAVA tyyppi "ryhmanjako"):
oppilas jakaa 12 lasta kolmeen ryhmään.

Jokaisessa kohtauksessa on paras vaihtoehto, järkevä mutta heikompi vaihtoehto (piirre 1 + tyyli)
ja huono vaihtoehto (ei piirteitä, tyyli + seuraus lopussa)."""

ala = "kasvatus"
alaNimi = "Kasvatus ja ohjaus"
tarinaNimi = "Retkipäivä"
maailma = "retki"
yleisKohtaus = "retki"
katsoTeksti = "Katso retkimaastoa"
kello = {"alku": 8 * 60, "raja": 7 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Kasvatusala", "ifid": "f4bc9e60-ab58-4c15-b739-d76f097774fb"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Bussi lähtee kotiin klo 15.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Retkipäivän värit: metsänvihreä, auringon keltainen ja taivaansininen
TEEMA = """:root {
  --a1: #8fd16a; --a1-rgb: 143,209,106;
  --a2: #ffc857; --a2-rgb: 255,200,87;
  --a3: #e3f6d6;
  --korostus: #ffd66b; --korostus-rgb: 255,214,107;
  --tausta: #10201a; --tausta-rgb: 16,32,26;
  --tausta-2: #172c24; --tausta-2-rgb: 23,44,36;
  --paneeli: #142620; --paneeli-rgb: 20,38,32;
  --paneeli-2: #1d362c;
  --tumma: #0a1511; --tumma-rgb: 10,21,17;
  --reuna: #8fd16a;
  --teksti-pehmea: #e1efe4; --teksti-pehmea-rgb: 225,239,228;
  --teksti-vaalea: #f8fff6;
  --nappi-teksti: #10260a;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #f1ffe6;
  --kansi-nappi-varjo: #3a6a2a;
  --kansi-nappi-hehku: 143,209,106;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Kasvatus- ja ohjausala", otsikko="Kasvatus ja ohjaus",
             alaotsikko="Retkipäivä · Miten saadaan kymmenet lapset turvallisesti metsään ja takaisin?",
             nappi="Lähde retkelle", ikoni="sydan")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet nuoriso-ohjaaja. Tänään nuorisotalo, päiväkodin eskariryhmä ja koulun luokat lähtevät yhdessä retkelle metsään. Päivän aikana autat monta kasvatusalan ammattilaista. Joka kerta päätät, mikä on paras tapa toimia.",
            faktat=[("6", "ammattilaista"), ("40", "lasta"), ("1", "retkipäivä")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "kasvatus-piiri-tausta.webp",
               "alku": KUVA + "kasvatus-retki-tausta.webp",
               "tehtava": KUVA + "kasvatus-koulu-tausta.webp",
               "kortti": KUVA + "kasvatus-piiri-tausta.webp",
               "loppu": [KUVA + "kasvatus-piiri-tausta.webp", KUVA + "kasvatus-retki-tausta.webp"],
               "oppilaitokset": [KUVA + "kasvatus-koulu-tausta.webp", KUVA + "kasvatus-luokka-tausta.webp"]}

TARINA_ALKU = dict(nimi="Retkiaamu", tausta="retki", teksti="""<<include "HUD">>
<h1>Retkiaamu</h1>
<p>Kello on 8.00. Avaat nuorisotalon oven. Tänään on iso päivä: nuorisotalo, päiväkodin eskarit ja koulun ekaluokkalaiset lähtevät yhdessä metsäretkelle laavulle.</p>
<p>Olet nuoriso-ohjaaja. Huolehdit siitä, että retki sujuu ja kaikki pääsevät mukaan. Bussi lähtee laavulta takaisin kello 15.</p>
<p class="puhe"><strong>Jani, yhteisöpedagogi:</strong> ”Huomenta! Isoset ovat jo täällä. Mennään puhumaan heidän kanssaan.”</p>
<div class="intro-nappi"><<link "Aloita päivä">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Nuorisotalo", tausta="nuorisotalo", otsikko="Video retkeltä", avain="yhteisopedagogi",
      taustakuva=KUVA + "kasvatus-nuorisotalo-tausta.webp",
      kysymys="Miltä yhteisöpedagogin työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän yli yhdeksän.",
      johdanto="""<p>Kolme 8.-luokkalaista on lupautunut retkelle isosiksi eli apuohjaajiksi. Jani johtaa nuorisotaloa ja on sopinut asiasta heidän kanssaan.</p>
<p>Isonen Elias haluaa kuvata retkestä videon nuorisotalon someen. Videolla näkyisi paljon pieniä lapsia.</p>
<p class="puhe"><strong>Jani, yhteisöpedagogi:</strong> ”Idea on hieno. Mitä sanomme Eliakselle?”</p>""",
      valinnat=[
       dict(teksti="Elias saa kuvata. Hän kuvaa maisemia, käsiä ja selkiä. Kasvot näkyvät vain niillä lapsilla, joiden huoltajat ovat antaneet luvan. Jani katsoo videon ennen julkaisua.", aika=45, piirteet={"vastuullinen": 2, "tiimi": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Lapsen kuvan saa julkaista vain huoltajan luvalla. Kun säännöt sovitaan etukäteen, Elias saa tehdä videon, ja jokaisen lapsen yksityisyys säilyy.</p>"),
       dict(teksti="Kuvaaminen kielletään kokonaan. Silloin ei tule ongelmia.", tyyli="varovainen", aika=20, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Turvallista, mutta innostus sammuu.</strong></p><p>Nuoriso-ohjaajan työssä nuoret pääsevät itse tekemään ja vaikuttamaan. Video onnistuu, kun kuvaamisesta sovitaan selvät säännöt.</p>"),
       dict(teksti="Elias saa kuvata vapaasti. Jos joku valittaa, video poistetaan.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Kun video on kerran netissä, sitä ei saa kokonaan pois. Lapsen kuvan julkaisemiseen tarvitaan huoltajan lupa jo ennen julkaisua.</p>"),
      ]),
 dict(nimi="Päiväkoti", tausta="paivakoti", otsikko="Itku eteisessä", avain="lastenohjaaja",
      taustakuva=KUVA + "kasvatus-paivakoti-tausta.webp",
      kysymys="Miltä lastenohjaajan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli yhdentoista aikaan.",
      johdanto="""<p>Haet päiväkodin eskariryhmän bussiin. Eteisessä eskarilainen Aada itkee ja roikkuu äidin kädessä. Hän ei halua lähteä retkelle ilman äitiä.</p>
<p>Bussi odottaa pihalla, ja muut lapset ovat jo pukeneet.</p>
<p class="puhe"><strong>Minna, lastenohjaaja:</strong> ”Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Minna menee Aadan tasolle ja sanoo ääneen, että jännittää. Hän antaa Aadalle tärkeän tehtävän: Aada saa kantaa ryhmän retkikarttaa. Äiti halaa ja lähtee rauhallisesti.", aika=45, piirteet={"kohtaaja": 2, "luova": 1},
            palaute="<p><strong>Lämmin ja taitava ote!</strong></p><p>Kun aikuinen sanoittaa lapsen tunteen, lapsi tuntee tulleensa ymmärretyksi. Oma tehtävä vie ajatukset retkeen. Rauhallinen hyvästely on lapselle helpompi kuin salaa lähteminen.</p>"),
       dict(teksti="Aada jää päiväkotiin toisen ryhmän kanssa. Retkiä tulee vielä lisää.", tyyli="varovainen", aika=20, piirteet={"kohtaaja": 1},
            palaute="<p><strong>Aadan tunne otetaan vakavasti, mutta…</strong></p><p>Jos jännittävä asia aina vältetään, jännitys kasvaa. Moni lapsi rauhoittuu, kun aikuinen tukee ja antaa oman tehtävän. Minna auttaa Aadan mukaan retkelle.</p>"),
       dict(teksti="Äiti lähtee nopeasti, kun Aada ei katso. Itku loppuu kyllä bussissa.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei hyvä.</strong></p><p>Kun aikuinen katoaa salaa, lapsi voi pelätä seuraavalla kerralla vielä enemmän. Rauhallinen hyvästely ja aikuisen tuki auttavat enemmän.</p>"),
      ]),
 dict(nimi="Koululuokka", tausta="luokka", otsikko="Säännöt ennen lähtöä", avain="luokanopettaja",
      taustakuva=KUVA + "kasvatus-luokka-tausta.webp",
      kysymys="Miltä luokanopettajan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli kahdentoista jälkeen.",
      johdanto="""<p>Koululla ekaluokka odottaa lähtöä. Luokanopettaja Petri aikoo kertoa retken turvasäännöt.</p>
<p>Oppilaat ovat innoissaan. Moni puhuu yhtä aikaa, ja muutama on jo ovella reppu selässä.</p>
<p class="puhe"><strong>Petri, luokanopettaja:</strong> ”Miten saan säännöt menemään perille?”</p>""",
      valinnat=[
       dict(teksti="Petri näyttää säännöt kuvina taululla. Jokainen saa retkikaverin, ja parit kertovat toisilleen kolme tärkeintä sääntöä.", aika=45, piirteet={"vastuullinen": 2, "luova": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Kuvat auttavat muistamaan, ja kun oppilas sanoo säännön itse, se jää paremmin mieleen. Retkikaveri on tärkeä turvallisuussääntö: kaveri huomaa heti, jos toinen puuttuu.</p>"),
       dict(teksti="Petri antaa jokaiselle paperin, jossa säännöt lukevat. Oppilaat lukevat sen bussissa.", tyyli="kaytannollinen", aika=25, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Hyvä yritys, mutta…</strong></p><p>Kaikki ekaluokkalaiset eivät vielä lue sujuvasti, ja bussissa paperi unohtuu. Petri näyttää säännöt kuvina ja jakaa retkikaverit.</p>"),
       dict(teksti="Petri lukee säännöt nopeasti ääneen. Retkellä niistä voi muistuttaa.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei riitä.</strong></p><p>Innostunut luokka ei kuuntele pitkää listaa. Metsässä on liian myöhäistä opettaa sääntöjä. Petri näyttää säännöt kuvina ja jakaa retkikaverit.</p>"),
      ]),
 dict(nimi="Metsäpolku", tausta="polku", otsikko="Juurakkoinen polku", avain="koulunkayntiohjaaja",
      taustakuva=KUVA + "kasvatus-avustaja-tausta.webp",
      kysymys="Miltä koulunkäynninohjaajan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen yhtä.",
      johdanto="""<p>Bussi on pysähtynyt metsän reunaan. Ekaluokkalainen Amir liikkuu pyörätuolilla. Koulunkäynninohjaaja Sari auttaa häntä koulupäivän aikana.</p>
<p>Laavulle vievä lyhin polku on kapea ja täynnä puiden juuria.</p>
<p class="puhe"><strong>Sari, koulunkäynninohjaaja:</strong> ”Miten Amir pääsee laavulle?”</p>""",
      valinnat=[
       dict(teksti="Katsotte kartasta pidemmän, esteettömän sorapolun. Koko ryhmä kulkee sitä, joten Amir on mukana muiden kanssa.", aika=45, piirteet={"vastuullinen": 2, "kohtaaja": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Kun reitti valitaan niin, että kaikki pääsevät kulkemaan sitä, kukaan ei jää ryhmästä erilleen. Sari tuntee Amirin tarpeet ja auttaa suunnittelussa.</p>"),
       dict(teksti="Amir ja Sari menevät laavulle sorapolkua. Muut kävelevät lyhyempää metsäpolkua.", tyyli="kaytannollinen", aika=30, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Toimii, mutta Amir jää yksin.</strong></p><p>Retken tärkein osa on yhdessä kulkeminen. Kun koko ryhmä kulkee esteetöntä reittiä, Amir saa olla mukana kavereiden kanssa.</p>"),
       dict(teksti="Isommat lapset auttavat nostamaan Amirin pyörätuolin juurien yli.", tyyli="rohkea", aika=25, piirteet={},
            palaute="<p><strong>Auttamisen halu on hieno, mutta…</strong></p><p>Pyörätuolin nostaminen kapealla polulla on vaarallista sekä Amirille että nostajille. Kaikki kulkevat esteetöntä sorapolkua.</p>"),
      ]),
 dict(nimi="Metsäaukio", tausta="ryhma", otsikko="Ohjeet tuulessa", avain="kvk",
      taustakuva=KUVA + "kasvatus-retki-tausta.webp",
      kysymys="Miltä kommunikaation ja viittomakielen ohjaajan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen kahta.",
      johdanto="""<p>Ryhmä kokoontuu metsäaukiolle heijastinliiveissä. Kolmasluokkalainen Daniel kuulee huonosti ja käyttää viittomakieltä.</p>
<p>Metsässä tuulee, eikä Daniel saa selvää ohjeista. Kommunikaation ja viittomakielen ohjaaja Laura on hänen tukenaan.</p>
<p class="puhe"><strong>Laura, kommunikaation ja viittomakielen ohjaaja:</strong> ”Mikä olisi paras tapa?”</p>""",
      valinnat=[
       dict(teksti="Laura viittoo ohjeet Danielille. Lisäksi koko ryhmä opettelee kolme yhteistä käsimerkkiä: kokoontukaa, pysähtykää ja hiljaa.", aika=45, piirteet={"tiimi": 2, "luova": 1},
            palaute="<p><strong>Loistava idea!</strong></p><p>Yhteiset käsimerkit toimivat tuulessa kaikille. Daniel ei ole ainoa, joka tarvitsee merkkejä. Hän voi jopa opettaa niitä muille.</p>"),
       dict(teksti="Laura pysyy koko ajan Danielin vieressä ja tulkkaa kaiken.", tyyli="kaytannollinen", aika=30, piirteet={"tiimi": 1},
            palaute="<p><strong>Daniel saa tiedon, mutta…</strong></p><p>Jos aikuinen on aina vieressä, Daniel jää helposti muista erilleen. Yhteiset käsimerkit tuovat hänet mukaan ryhmään.</p>"),
       dict(teksti="Daniel katsoo, mitä muut tekevät. Kyllä hän näkee, mihin mennään.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Ei riitä.</strong></p><p>Turvaohjeet pitää ymmärtää varmasti. Muuten Daniel voi jäädä jälkeen tai eksyä. Laura viittoo ohjeet, ja ryhmä opettelee yhteiset käsimerkit.</p>"),
      ]),
 dict(nimi="Laavu", tausta="laavu", otsikko="Sivussa seisova Sofia", avain="vakaopettaja",
      taustakuva=KUVA + "kasvatus-piiri-tausta.webp",
      kysymys="Miltä varhaiskasvatuksen opettajan työ näytti?",
      johdanto="""<p>Laavulla paistetaan makkaraa, ja sitten leikitään piirileikkiä. Varhaiskasvatuksen opettaja Hanna ohjaa leikkiä.</p>
<p>Sofia aloitti eskarissa vasta viikko sitten. Hän seisoo piirin ulkopuolella ja katsoo maahan.</p>
<p class="puhe"><strong>Hanna, varhaiskasvatuksen opettaja:</strong> ”Miten saisimme Sofian mukaan?”</p>""",
      valinnat=[
       dict(teksti="Hanna valitsee leikin, jossa kaikki ovat piirissä yhtä aikaa. Hän kysyy Sofialta, haluaisiko tämä näyttää ensimmäisen liikkeen.", aika=45, piirteet={"kohtaaja": 2, "tiimi": 1},
            palaute="<p><strong>Taitavaa!</strong></p><p>Kun leikissä kukaan ei ole yksin vuorossa, ujokin uskaltaa liittyä. Pieni, oma tehtävä näyttää Sofialle, että häntä odotetaan mukaan.</p>"),
       dict(teksti="Hanna pyytää yhtä lasta ottamaan Sofian kaveriksi.", tyyli="empaattinen", aika=25, piirteet={"kohtaaja": 1},
            palaute="<p><strong>Ystävällinen ajatus, mutta…</strong></p><p>Määrätty kaveri voi tuntua Sofiasta nololta, ja toinen lapsi voi kokea sen pakkona. Leikki, jossa kaikki ovat mukana yhtä aikaa, toimii paremmin.</p>"),
       dict(teksti="Annetaan Sofian katsoa sivusta. Kyllä hän tulee mukaan, kun on valmis.", tyyli="varovainen", aika=20, piirteet={},
            palaute="<p><strong>Rauhallista, mutta Sofia jää yksin.</strong></p><p>Moni ujo lapsi odottaa, että joku kutsuu. Ilman kutsua hän voi jäädä sivuun koko päiväksi. Hanna kutsuu Sofian mukaan leikkiin lempeästi.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Kotimatka", teksti="""<h1>Bussi kotiin</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>, kun kaikki ovat bussissa. Retki on ohi!</p>
<p>Bussissa on väsynyttä hälinää. Joku näyttää löytämäänsä käpyä, toinen kertoo nähneensä oravan. Sinä lasket lapset vielä kerran. Kaikki ovat mukana.</p>
<p>Huomasitko? Yksi retki tarvitsi monta kasvatusalan ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Jani, yhteisöpedagogi</strong> – johti nuorisotaloa ja ohjasi isosia</li>
<li><strong>Minna, lastenohjaaja</strong> – tuki jännittävää eskarilaista</li>
<li><strong>Petri, luokanopettaja</strong> – opetti retken turvasäännöt</li>
<li><strong>Sari, koulunkäynninohjaaja</strong> – suunnitteli esteettömän reitin</li>
<li><strong>Laura, kommunikaation ja viittomakielen ohjaaja</strong> – auttoi ohjeiden ymmärtämisessä</li>
<li><strong>Hanna, varhaiskasvatuksen opettaja</strong> – sai kaikki mukaan leikkiin</li>
</ul>
<p>Lastenohjaajaksi, nuoriso- ja yhteisöohjaajaksi sekä kommunikaation ja viittomakielen ohjaajaksi voi opiskella ammattikoulussa kasvatus- ja ohjausalan perustutkinnossa. Koulunkäynninohjaajaksi pätevöidytään ammattitutkinnolla. Yhteisöpedagogiksi opiskellaan ammattikorkeakoulussa, ja opettajaksi yliopistossa.</p>""")

PIIRTEET = {
 "kohtaaja": {"nimi": "Lapsen kohtaaja", "kuvaus": "Huomaat, miltä toisesta tuntuu, ja autat häntä lempeästi."},
 "vastuullinen": {"nimi": "Turvallisuudesta huolehtija", "kuvaus": "Mietit etukäteen, miten kaikki pysyvät turvassa."},
 "tiimi": {"nimi": "Ryhmän rakentaja", "kuvaus": "Saat kaikki mukaan, eikä kukaan jää ulkopuolelle."},
 "luova": {"nimi": "Keksijä", "kuvaus": "Keksit uusia tapoja, joilla vaikea asia muuttuu helpoksi."},
}

AMMATIT = {
 "yhteisopedagogi": {"nimi": "Yhteisöpedagogi", "kuvaus": "Ohjaa nuorisotyötä, johtaa nuorisotaloa ja suunnittelee toimintaa nuorille.",
                     "tutkinto": "Yhteisöpedagogi (AMK)", "piirteet": ["tiimi", "vastuullinen"]},
 "lastenohjaaja": {"nimi": "Lastenohjaaja", "kuvaus": "Hoitaa, ohjaa ja leikittää lapsia päiväkodissa, kerhossa tai leirillä.",
                   "tutkinto": "Kasvatus- ja ohjausalan perustutkinto (lastenohjaaja)", "piirteet": ["kohtaaja", "luova"]},
 "luokanopettaja": {"nimi": "Luokanopettaja", "kuvaus": "Opettaa alakoulun oppilaita ja huolehtii luokan arjesta.",
                    "tutkinto": "Kasvatustieteen maisteri (yliopisto)", "piirteet": ["vastuullinen", "luova"]},
 "koulunkayntiohjaaja": {"nimi": "Koulunkäynninohjaaja", "kuvaus": "Auttaa oppilaita, jotka tarvitsevat tukea koulupäivän aikana.",
                         "tutkinto": "Kasvatus- ja ohjausalan ammattitutkinto (koulunkäynninohjaaja)", "piirteet": ["kohtaaja", "vastuullinen"]},
 "kvk": {"nimi": "Kommunikaation ja viittomakielen ohjaaja", "kuvaus": "Tukee lapsia ja aikuisia, jotka käyttävät viittomakieltä tai muita kommunikointikeinoja.",
         "tutkinto": "Kasvatus- ja ohjausalan perustutkinto (kommunikaation ja viittomakielen ohjaaja)", "piirteet": ["tiimi", "kohtaaja"]},
 "vakaopettaja": {"nimi": "Varhaiskasvatuksen opettaja", "kuvaus": "Suunnittelee ja johtaa päiväkotiryhmän toimintaa ja eskariopetusta.",
                  "tutkinto": "Kasvatustieteen kandidaatti, varhaiskasvatus (yliopisto)", "piirteet": ["kohtaaja", "tiimi"]},
}

KUTSU_JOHDANTO = "Retki onnistui, ja ensi viikolla lähdetään uudelle retkelle! Nyt sinä pääset nuoriso-ohjaajana jakamaan 12 lasta kolmeen retkiryhmään."

def L(avain, nimi, luokka, kuvaus, tagit=()):
    return {"avain": avain, "nimi": nimi, "luokka": luokka, "kuvaus": kuvaus, "tagit": list(tagit)}

TEHTAVA = dict(
    tyyppi="ryhmanjako",
    nimi="Retkiryhmät", tag="Tehtävä · noin 15 min",
    maara="<strong>12 lasta ja kolme retkiryhmää</strong>",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Jaa lapset kolmeen ryhmään. Lue jokaisen lapsen tiedot tarkasti.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Ryhmien koot näkyvät heti. Tarkistus kertoo, mitkä ohjaajien toiveet ja turvallisuussäännöt täyttyvät. Voit muokata ryhmiä ja tarkistaa uudelleen. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Retkiryhmäsi",
    osa1="Osa 1/2 · Ryhmänjako", osa2="Osa 2/2 · Perustelut",
    tilanneOtsikko="Ensi viikon retki",
    ohje="Jaa 12 lasta kolmeen retkiryhmään. Jokainen ryhmä kulkee eri polkua ja sillä on oma ohjaaja. Lue lasten tiedot ja ryhmien kuvaukset. Muistilista kertoo, mitä ohjaajat toivovat.",
    lapsetOtsikko="Lapset", saannotOtsikko="Ohjaajien muistilista",
    tarkistaNappi="Tarkista ryhmät", muokkaaNappi="Muokkaa ryhmiä", jatkaNappi="Jatka perusteluihin", tyhjennaNappi="Tyhjennä",
    takaisinNappi="Takaisin ryhmiin", valmisNappi="Katso tulos",
    perusteluOtsikko="Ryhmät ovat valmiit!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="RETKIRYHMÄT · ENSI VIIKON RETKI",
    palaute=["Huippujako! Jokainen lapsi pääsee retkelle turvallisesti ja hyvässä porukassa.",
             "Hyvä jako! Pari muutosta, niin jokainen lapsi viihtyisi ryhmässään.",
             "Hyvä alku! Lue muistilistan selitykset ja kokeile siirtää lapsia."],
    ryhmat=[
        {"avain": "A", "nimi": "Metsäpolku", "lyhyt": "Metsä", "ikoni": "🌲", "ohjaaja": "Ohjaaja: Petri, luokanopettaja",
         "kuvaus": "Kapea polku, jossa on juuria ja kiviä. Matkalla etsitään eläinten jälkiä."},
        {"avain": "B", "nimi": "Laavupolku", "lyhyt": "Laavu", "ikoni": "🔥", "ohjaaja": "Ohjaaja: Sari, koulunkäynninohjaaja",
         "kuvaus": "Leveä ja tasainen sorapolku. Ainoa esteetön reitti. Laavulla sytytetään nuotio."},
        {"avain": "C", "nimi": "Rantapolku", "lyhyt": "Ranta", "ikoni": "🌊", "ohjaaja": "Ohjaaja: sinä, nuoriso-ohjaaja",
         "kuvaus": "Polku kulkee järven rantaa. Laiturilla tutkitaan vesieläimiä haavilla."},
    ],
    lapset=[
        L("aada", "Aada", "eskari", "Pelkää vettä. Rannalle meneminen jännittää häntä tosi paljon."),
        L("leo", "Leo", "eskari", "Innokas ja utelias. Haluaa nähdä kaiken."),
        L("eemeli", "Eemeli", "1. lk", "Riitelee usein Juhon kanssa."),
        L("sofia", "Sofia", "1. lk", "Uusi koulussa. Tuntee vain Venlan."),
        L("oliver", "Oliver", "1. lk", "Tarvitsee paljon liikettä. Paikallaan oleminen on vaikeaa."),
        L("linnea", "Linnea", "1. lk", "Rauhallinen. Tykkää tutkia kasveja."),
        L("amir", "Amir", "1. lk", "Liikkuu pyörätuolilla."),
        L("hilla", "Hilla", "1. lk", "Minean paras kaveri. Leikkivät vain keskenään."),
        L("minea", "Minea", "1. lk", "Hillan paras kaveri. Leikkivät vain keskenään."),
        L("juho", "Juho", "3. lk", "Kummioppilas. Riitelee usein Eemelin kanssa.", ["kummi"]),
        L("venla", "Venla", "3. lk", "Kummioppilas. Asuu Sofian naapurissa.", ["kummi"]),
        L("daniel", "Daniel", "3. lk", "Kummioppilas. Kuulee huonosti ja käyttää viittomakieltä. Pienessä ryhmässä hän pysyy paremmin mukana.", ["kummi"]),
    ],
    saannot=[
        {"tyyppi": "koko", "min": 3, "max": 5, "nimi": "Jokaisessa ryhmässä on 3–5 lasta",
         "selitys": "Metsässä yksi aikuinen pystyy pitämään huolta enintään viidestä pienestä lapsesta. Liian pienessä ryhmässä taas on tylsää."},
        {"tyyppi": "vain", "lapsi": "amir", "ryhmat": ["B"], "nimi": "Amir pääsee kulkemaan reittinsä",
         "selitys": "Vain laavupolku on esteetön. Pyörätuolilla ei pääse juurakkoisella metsäpolulla eikä rannan kivikossa."},
        {"tyyppi": "ei", "lapsi": "aada", "ryhma": "C", "nimi": "Aada ei joudu rantaan",
         "selitys": "Aada pelkää vettä. Pelkoa voi harjoitella myöhemmin rauhassa, mutta retkipäivän pitää olla hänelle turvallinen ja mukava."},
        {"tyyppi": "yhdessa", "lapset": ["sofia", "venla"], "nimi": "Sofialla on tuttu kaveri ryhmässä",
         "selitys": "Uudelle oppilaalle tuttu kaveri tuo turvaa. Venla voi tutustuttaa Sofian muihin."},
        {"tyyppi": "erikseen", "lapset": ["eemeli", "juho"], "nimi": "Eemeli ja Juho ovat eri ryhmissä",
         "selitys": "Kun riitelevät lapset ovat eri ryhmissä, ohjaajan aika ei mene riitojen selvittämiseen."},
        {"tyyppi": "maxKoko", "lapsi": "daniel", "max": 4, "nimi": "Danielin ryhmässä on enintään 4 lasta",
         "selitys": "Pienessä ryhmässä Daniel näkee ohjaajan ja muiden kasvot. Silloin hän pysyy paremmin mukana keskustelussa."},
        {"tyyppi": "jokaisessa", "tagi": "kummi", "nimi": "Jokaisessa ryhmässä on kummioppilas",
         "selitys": "Kolmasluokkalainen kummi auttaa pienempiä ja on ohjaajan apuna. Siksi kummeja tarvitaan joka ryhmään."},
        {"tyyppi": "erikseen", "lapset": ["hilla", "minea"], "nimi": "Hilla ja Minea ovat eri ryhmissä",
         "selitys": "Opettaja toivoi tätä. Kun parhaat kaverit ovat välillä eri ryhmissä, molemmat tutustuvat muihinkin, eikä kukaan jää heidän porukkansa ulkopuolelle."},
    ],
    kysymykset=[
        {"kysymys": "Miksi ohjaajan pitää tietää jokaisen lapsen tarpeet, kun hän jakaa ryhmiä?", "ammattilainen": "Koulunkäynninohjaaja",
         "tutkinto": "Kasvatus- ja ohjausalan ammattitutkinto", "placeholder": "Tarpeet pitää tietää, koska…"},
        {"kysymys": "Miten ohjaaja voi auttaa uutta tai ujoa lasta pääsemään mukaan ryhmään?", "ammattilainen": "Nuoriso- ja yhteisöohjaaja",
         "tutkinto": "Kasvatus- ja ohjausalan perustutkinto", "placeholder": "Ohjaaja voi esimerkiksi…"},
    ],
    ammattilaisetOtsikko="Kasvatus- ja ohjausalan ammatteja",
    ammattilaiset=[
        {"nimi": "Lastenohjaaja", "tehtava": "hoitaa ja ohjaa lapsia päiväkodissa ja kerhoissa", "tutkinto": "Kasvatus- ja ohjausalan perustutkinto"},
        {"nimi": "Nuoriso- ja yhteisöohjaaja", "tehtava": "ohjaa nuoria nuorisotalossa, leireillä ja kouluissa", "tutkinto": "Kasvatus- ja ohjausalan perustutkinto"},
        {"nimi": "Kommunikaation ja viittomakielen ohjaaja", "tehtava": "tukee viittomakielisiä ja puhevammaisia", "tutkinto": "Kasvatus- ja ohjausalan perustutkinto"},
        {"nimi": "Koulunkäynninohjaaja", "tehtava": "tukee oppilaita koulupäivän aikana", "tutkinto": "Kasvatus- ja ohjausalan ammattitutkinto"},
        {"nimi": "Yhteisöpedagogi", "tehtava": "johtaa nuorisotyötä ja suunnittelee toimintaa", "tutkinto": "Yhteisöpedagogi (AMK)"},
        {"nimi": "Opettaja", "tehtava": "opettaa päiväkodissa tai koulussa", "tutkinto": "Kasvatustieteen kandidaatti tai maisteri (yliopisto)"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Autoit retkipäivän onnistumaan ja jaoit lapset retkiryhmiin. Samalla tutustuit kasvatus- ja ohjausalan ammatteihin."

OPPILAITOKSET = ("Missä kasvatus- ja ohjausalaa voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Kasvatus- ja ohjausalan koulutukset</h2>
<p>Kasvatus- ja ohjausalan perustutkintoa voi opiskella monessa oppilaitoksessa eri puolilla Suomea. Tässä on muutama esimerkki. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Koulutuskeskus Salpaus, Lahti", "Kasvatus- ja ohjausalan perustutkinto: lastenohjaaja sekä nuoriso- ja yhteisöohjaaja.", "https://salpaus.fi")
    + kortti("Lapin urheiluopisto (REDU), Rovaniemi", "Kasvatus- ja ohjausalan perustutkinto: lastenohjaaja sekä nuoriso- ja yhteisöohjaaja.", "https://www.redu.fi")
    + kortti("Etsi lisää Opintopolusta", "Hae sanalla ”kasvatus- ja ohjausalan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=kasvatus-%20ja%20ohjausalan%20perustutkinto")
    + """<h3>Myöhemmin</h3>
""" + kortti("Työn ohessa: ammattitutkinto", "Kasvatus- ja ohjausalan ammattitutkinnossa voi pätevöityä esimerkiksi koulunkäynninohjaajaksi.", "https://opintopolku.fi/konfo/fi/haku?keyword=kasvatus-%20ja%20ohjausalan%20ammattitutkinto")
    + kortti("Ammattikorkeakoulut", "Yhteisöpedagogi (AMK) ja sosionomi (AMK), esimerkiksi Humanistinen ammattikorkeakoulu Humak.", "https://www.humak.fi")
    + kortti("Yliopistot", "Varhaiskasvatuksen opettaja, luokanopettaja ja aineenopettaja opiskelevat kasvatustiedettä yliopistossa.", "https://opintopolku.fi/konfo/fi/haku?keyword=kasvatustiede")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
SEURAUKSET = {
    "Nuorisotalo": "Retkivideosta tuli huoltajilta palautetta, ja nuorisotalo joutui pyytämään anteeksi.",
    "Päiväkoti": "Aada itki vielä pitkään, ja hänen äitinsä soitti päiväkotiin huolissaan.",
    "Koululuokka": "Kaksi oppilasta lähti metsässä omille teilleen, ja heitä etsittiin hetki.",
    "Metsäpolku": "Amirin matka laavulle hidastui, ja ryhmä joutui odottamaan.",
    "Metsäaukio": "Daniel jäi jälkeen ryhmästä, eikä hän ymmärtänyt, mihin oltiin menossa.",
    "Laavu": "Sofia jäi leikin ulkopuolelle ja oli koko kotimatkan hiljainen.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>, kun kaikki ovat bussissa. Jokainen lapsi pääsi mukaan, ja päivä oli ikimuistoinen!",
    "Kello on <<print setup.kello($aika)>>, kun kaikki ovat bussissa. Pari asiaa olisi voinut mennä paremmin, mutta retki onnistui.",
    "Kello on <<print setup.kello($aika)>>, kun kaikki ovat vihdoin bussissa. Päivä oli täynnä selviteltävää, ja moni lapsi on väsynyt ja pahoillaan.",
]
MYOHASSA = "Bussi joutui odottamaan, ja vanhemmat odottivat lapsia koululla myöhään."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
