# -*- coding: utf-8 -*-
"""Taide ja muotoilu – "Kampanja" (sisältö). Uusi ala, kuuluu kulttuurialaan.
Rakenna: python3 rakenna_tarina.py alat/muotoilu.py <orig palvelu-ala.html> <uusi muotoilu-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on mainostoimisto Kipinän harjoittelija. Toimisto tekee kaupungille kampanjan uuden
skeittipuiston avajaisiin. Tarina kulkee klo 9–16, ja kello 16 kampanja esitellään asiakkaalle.
Ammatit: AD, graafinen suunnittelija, kuvittaja, 3D-mallintaja, teollinen muotoilija ja kuvataiteilija.
Loppuosan tehtävä on "Visuaalinen ilme" (TEHTAVA tyyppi "ilme"): oppilas suunnittelee julisteen.

Jokaisessa kohtauksessa on paras vaihtoehto, järkevä mutta heikompi vaihtoehto (piirre 1 + tyyli)
ja huono vaihtoehto (ei piirteitä, tyyli + seuraus lopussa)."""

ala = "muotoilu"
alaNimi = "Taide ja muotoilu"
tarinaNimi = "Kampanja"
maailma = "mainostoimisto"
yleisKohtaus = "toimisto"
katsoTeksti = "Katso toimistoa"
kello = {"alku": 9 * 60, "raja": 7 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Muotoilu", "ifid": "f56d71d3-73ee-459f-97f0-cd0581854125"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Esittely asiakkaalle klo 16.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Mainostoimiston värit: neonvihreä, korallinpunainen ja syvä yönsininen
TEEMA = """:root {
  --a1: #39e58c; --a1-rgb: 57,229,140;
  --a2: #ff6f59; --a2-rgb: 255,111,89;
  --a3: #e6fff1;
  --korostus: #f4d35e; --korostus-rgb: 244,211,94;
  --tausta: #121428; --tausta-rgb: 18,20,40;
  --tausta-2: #1b1e38; --tausta-2-rgb: 27,30,56;
  --paneeli: #171a33; --paneeli-rgb: 23,26,51;
  --paneeli-2: #222645;
  --tumma: #0a0b18; --tumma-rgb: 10,11,24;
  --reuna: #39e58c;
  --teksti-pehmea: #e4e6f5; --teksti-pehmea-rgb: 228,230,245;
  --teksti-vaalea: #fafbff;
  --nappi-teksti: #0b2416;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a1), var(--korostus));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #eafff3;
  --kansi-nappi-varjo: #1f6b44;
  --kansi-nappi-hehku: 57,229,140;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Kulttuuriala", otsikko="Taide ja muotoilu",
             alaotsikko="Kampanja · Miten idea muuttuu julisteeksi, logoksi ja muraaliksi yhdessä päivässä?",
             nappi="Astu toimistoon", ikoni="sakset")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet harjoittelijana mainostoimistossa. Toimisto tekee kaupungille kampanjan uuden skeittipuiston avajaisiin. Kello 16 kampanja esitellään asiakkaalle. Päivän aikana autat kuutta taiteen ja muotoilun ammattilaista.",
            faktat=[("6", "ammattilaista"), ("7", "tuntia aikaa"), ("1", "kampanja")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "muotoilu-skuutti-tausta.webp",
               "alku": KUVA + "muotoilu-tyopiste-tausta.webp",
               "tehtava": KUVA + "muotoilu-kulho-tausta.webp",
               "kortti": KUVA + "muotoilu-kamera-tausta.webp",
               "loppu": [KUVA + "muotoilu-kulho-tausta.webp", KUVA + "muotoilu-ramppi-tausta.webp"],
               "oppilaitokset": [KUVA + "muotoilu-tyopiste-tausta.webp", KUVA + "muotoilu-kamera-tausta.webp"]}

TARINA_ALKU = dict(nimi="Toimistoaamu", tausta="toimisto", teksti="""<<run setup.taustakuva("../../images/koulutusalat/muotoilu-kulho-tausta.webp")>><<include "HUD">>
<h1>Toimistoaamu</h1>
<p>Kello on 9.00. Astut mainostoimisto Kipinän avokonttoriin. Seinillä on julisteita, ja 3D-tulostin hurisee nurkassa.</p>
<p>Olet toimiston harjoittelija. Tänään valmistellaan kampanjaa kaupungin uuden skeittipuiston avajaisiin. Kello 16 kampanja esitellään asiakkaalle.</p>
<p class="puhe"><strong>Sanni, AD:</strong> ”Tervetuloa! Tule heti mukaan palaveriin. Asiakas on jo täällä.”</p>
<div class="intro-nappi"><<link "Aloita päivä">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Neuvotteluhuone", tausta="brief", otsikko="Kaikki julisteeseen?", avain="ad",
      taustakuva=KUVA + "muotoilu-tyopiste-tausta.webp",
      kysymys="Miltä AD:n työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän yli kymmenen.",
      johdanto="""<p>AD eli taiteellinen johtaja Sanni vetää palaveria. Asiakas kertoo, mitä kaikkea julisteeseen pitää mahtua: ohjelma, sponsorit, säännöt, puiston historia, aukioloajat ja kymmenen logoa.</p>
<p>Sanni tietää, että liian täyteen ahdettua julistetta ei lue kukaan.</p>
<p class="puhe"><strong>Sanni, AD:</strong> ”Mitä ehdotamme asiakkaalle?”</p>""",
      valinnat=[
       dict(teksti="Kysytään asiakkaalta, mikä on tärkein viesti. Julisteeseen tulee vain se, aika ja paikka. Muut tiedot laitetaan verkkosivulle, jonne pääsee QR-koodilla.", aika=45, piirteet={"kuuntelija": 2, "selkea": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Hyvä suunnittelija auttaa asiakasta kertomaan yhden asian selvästi. Kun tärkein viesti on selvä, juliste toimii myös ohi kävellessä.</p>"),
       dict(teksti="Tehdään juliste niin kuin asiakas pyytää. Asiakas maksaa, ja asiakas päättää.", tyyli="luottavainen", aika=25, piirteet={"kuuntelija": 1},
            palaute="<p><strong>Asiakasta kuunnellaan, mutta…</strong></p><p>Asiakas palkkaa toimiston, koska se osaa viestiä. Sannin tehtävä on myös neuvoa. Täysi juliste ei tavoita nuoria, eikä asiakas silloin saa sitä, mitä haluaa.</p>"),
       dict(teksti="Jätetään asiakkaan lista huomiotta ja tehdään oma taiteellinen versio. Kyllä asiakas siitä tykkää.", tyyli="rohkea", aika=20, piirteet={},
            palaute="<p><strong>Ei toimi.</strong></p><p>Jos asiakasta ei kuunnella, luottamus katoaa. Sanni kysyy asiakkaalta tärkeimmän viestin ja ehdottaa ratkaisua yhdessä.</p>"),
      ]),
 dict(nimi="Logo", tausta="graafikko", otsikko="Punainen ja vihreä", avain="graafinen",
      taustakuva=KUVA + "muotoilu-skuutti-tausta.webp",
      kysymys="Miltä graafisen suunnittelijan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli kahdentoista aikaan.",
      johdanto="""<p>Graafinen suunnittelija Leo tekee skeittipuistolle logoa. Asiakas haluaa logoon punaisen ja vihreän.</p>
<p>Leo muistaa, että moni värisokea ei erota punaista ja vihreää toisistaan. Suomessa noin joka kahdeskymmenes mies on punavihersokea.</p>
<p class="puhe"><strong>Leo, graafinen suunnittelija:</strong> ”Miten ratkaisemme tämän?”</p>""",
      valinnat=[
       dict(teksti="Leo testaa logon värisokeussimulaatiolla. Värit saavat jäädä, mutta logon osat erotetaan myös muodolla ja vaalealla ääriviivalla.", aika=45, piirteet={"selkea": 2, "kuuntelija": 1},
            palaute="<p><strong>Ammattilaisen ratkaisu!</strong></p><p>Hyvä logo toimii myös mustavalkoisena. Kun osat erottuvat muodon ja kontrastin avulla, logo on selkeä kaikille, ja asiakas saa haluamansa värit.</p>"),
       dict(teksti="Leo vaihtaa värit siniseen ja oranssiin kertomatta siitä asiakkaalle.", tyyli="suora", aika=25, piirteet={"selkea": 1},
            palaute="<p><strong>Toimiva väripari, mutta…</strong></p><p>Sininen ja oranssi erottuvat hyvin, mutta asiakkaan toive ohitettiin. Leo kertoo asiakkaalle syyn ja ehdottaa ratkaisua yhdessä.</p>"),
       dict(teksti="Värisokeita on vähän. Tehdään logo asiakkaan väreillä ilman testausta.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Ei riitä.</strong></p><p>Joka kahdeskymmenes mies on paljon ihmisiä. Skeittipuiston logo näkyy kylteissä ja opasteissa, joten sen pitää toimia kaikille. Leo testaa logon.</p>"),
      ]),
 dict(nimi="Kuvituspöytä", tausta="kuvitus", otsikko="Tekoälyllä nopeammin?", avain="kuvittaja",
      taustakuva=KUVA + "muotoilu-tyopiste-tausta.webp",
      kysymys="Miltä kuvittajan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli yhden aikaan.",
      johdanto="""<p>Kuvittaja Emma tekee julisteen pääkuvaa. Aikaa on vähän.</p>
<p>Harjoittelijakaveri ehdottaa, että tekoälyllä saisi hetkessä kuvan, joka näyttää tunnetun taiteilijan työltä.</p>
<p class="puhe"><strong>Emma, kuvittaja:</strong> ”Mitä mieltä sinä olet?”</p>""",
      valinnat=[
       dict(teksti="Emma käyttää tekoälyä vain ideoiden etsimiseen. Kuvan hän piirtää itse, ja asiakkaalle kerrotaan, miten kuva tehtiin.", aika=45, piirteet={"vastuullinen": 2, "luova": 1},
            palaute="<p><strong>Rehellistä ja ammattimaista!</strong></p><p>Toisen taiteilijan tyylin matkiminen voi loukata hänen oikeuksiaan. Oma kuva on asiakkaalle turvallinen, ja se tekee kampanjasta ainutlaatuisen.</p>"),
       dict(teksti="Ostetaan kuvapankista valmis kuva skeittaajasta.", tyyli="kaytannollinen", aika=25, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Laillista, mutta tavallista.</strong></p><p>Ostetulla kuvalla on käyttölupa, mutta sama kuva voi olla jonkun toisen mainoksessa. Oma kuvitus erottuu paremmin.</p>"),
       dict(teksti="Tehdään tekoälykuva tunnetun taiteilijan tyyliin. Kukaan ei huomaa.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Taiteilijan tyylin kopioiminen ilman lupaa on epäreilua ja voi johtaa riitaan. Kampanja voi saada huonoa julkisuutta. Emma piirtää kuvan itse.</p>"),
      ]),
 dict(nimi="Mallinnus", tausta="mallinnus", otsikko="Siistimpi kuin todellisuus", avain="mallintaja",
      taustakuva=KUVA + "muotoilu-kamera-tausta.webp",
      kysymys="Miltä 3D-mallintajan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen kahta.",
      johdanto="""<p>3D-mallintaja Onni tekee skeittipuistosta kuvan, joka näyttää valmiilta puistolta. Rakentaminen on vielä kesken.</p>
<p>Kuva näyttää Onnin mielestä vähän tylsältä. Puistoon tulee vain kaksi ramppia.</p>
<p class="puhe"><strong>Onni, 3D-mallintaja:</strong> ”Miten teen kuvasta parhaan mahdollisen?”</p>""",
      valinnat=[
       dict(teksti="Onni tarkistaa mitat arkkitehdiltä. Hän tekee kuvasta tunnelmallisen valon ja ihmisten avulla, mutta puisto näyttää siltä, millainen se oikeasti tulee olemaan.", aika=45, piirteet={"vastuullinen": 2, "luova": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Valo, värit ja ihmiset tekevät kuvasta elävän. Kun puisto avautuu, nuoret löytävät juuri sen, mitä kuvassa luvattiin.</p>"),
       dict(teksti="Esittelyssä ei näytetä kuvaa ollenkaan, koska puisto ei ole vielä valmis.", tyyli="varovainen", aika=20, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Varovaista, mutta kampanja jää vaisuksi.</strong></p><p>Visualisointi auttaa ihmisiä innostumaan. Kuvaan voi merkitä, että se on suunnitelma. Silloin kuva on sekä houkutteleva että rehellinen.</p>"),
       dict(teksti="Onni lisää kuvaan enemmän ramppeja ja kaiteita, niin puisto näyttää siistimmältä.", tyyli="rohkea", aika=20, piirteet={},
            palaute="<p><strong>Harhaanjohtavaa.</strong></p><p>Kun nuoret tulevat avajaisiin, he pettyvät. Mainos ei saa luvata enempää kuin todellisuudessa on. Onni tekee kuvan oikeista suunnitelmista.</p>"),
      ]),
 dict(nimi="Muotoilupaja", tausta="muotoilu", otsikko="Avajaislahja", avain="muotoilija",
      taustakuva=KUVA + "muotoilu-kulho-tausta.webp",
      kysymys="Miltä teollisen muotoilijan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen kolmea.",
      johdanto="""<p>Teollinen muotoilija Kaisa suunnittelee avajaisiin pienen lahjan nuorille. Idea on heijastin, jonka voi kiinnittää reppuun tai rullalautaan.</p>
<p>3D-tulostin tekee jo ensimmäistä versiota.</p>
<p class="puhe"><strong>Kaisa, teollinen muotoilija:</strong> ”Miten varmistamme, että nuoret oikeasti käyttävät tätä?”</p>""",
      valinnat=[
       dict(teksti="Kaisa tulostaa kolme prototyyppiä ja vie ne nuorisotalolle. Nuoret kokeilevat niitä, ja Kaisa muuttaa muotoa palautteen mukaan.", aika=45, piirteet={"kuuntelija": 2, "luova": 1},
            palaute="<p><strong>Muotoilijan tärkein työkalu!</strong></p><p>Prototyyppi eli kokeiluversio paljastaa ongelmat ennen kuin tuhansia kappaleita valmistetaan. Käyttäjien palaute tekee tuotteesta sellaisen, että sitä halutaan käyttää.</p>"),
       dict(teksti="Kaisa viimeistelee oman suunnitelmansa. Hän on muotoilija ja tietää, mikä toimii.", tyyli="suora", aika=25, piirteet={"luova": 1},
            palaute="<p><strong>Taitava, mutta testaamaton.</strong></p><p>Ammattilainenkaan ei aina tiedä, miten nuoret tuotetta käyttävät. Nopea testi käyttäjillä säästää rahaa ja vaivaa.</p>"),
       dict(teksti="Tilataan halvimmat muovipinssit ulkomailta. Ne tulevat valmiina.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Halpaa, mutta…</strong></p><p>Turhat muovitavarat päätyvät usein roskiin. Hyvä muotoilu miettii, mitä käyttäjä oikeasti tarvitsee ja mistä tuote tehdään.</p>"),
      ]),
 dict(nimi="Muraali", tausta="muraali", otsikko="Nuorten oma seinä", avain="kuvataiteilija",
      taustakuva=KUVA + "muotoilu-ramppi-tausta.webp",
      kysymys="Miltä kuvataiteilijan työ näytti?",
      johdanto="""<p>Kuvataiteilija Aino maalaa skeittipuiston muuriin muraalia eli suurta seinämaalausta. Paikalle tulee joukko nuoria.</p>
<p>Nuoret kysyvät, saisivatko hekin maalata seinään jotain omaa.</p>
<p class="puhe"><strong>Aino, kuvataiteilija:</strong> ”Mitä vastaan heille?”</p>""",
      valinnat=[
       dict(teksti="Aino järjestää lauantaina työpajan. Nuoret luonnostelevat ideoita, ja parhaat ideat maalataan yhdessä osaksi muraalia.", aika=45, piirteet={"luova": 2, "kuuntelija": 1},
            palaute="<p><strong>Upea ratkaisu!</strong></p><p>Kun nuoret saavat olla mukana, muraali tuntuu heidän omaltaan, ja sitä myös suojellaan. Kuvataiteilija voi ohjata työtä niin, että lopputulos on yhtenäinen.</p>"),
       dict(teksti="Aino maalaa oman suunnitelmansa loppuun. Nuoret saavat seurata vierestä.", tyyli="varovainen", aika=25, piirteet={"luova": 1},
            palaute="<p><strong>Taiteilijan näkemys säilyy, mutta…</strong></p><p>Nuoret ovat puiston käyttäjiä. Kun heidät otetaan mukaan, muraali kertoo myös heistä. Pieni työpaja ei vaaranna kokonaisuutta.</p>"),
       dict(teksti="Kuka tahansa saa maalata seinään, mitä haluaa.", tyyli="rohkea", aika=15, piirteet={},
            palaute="<p><strong>Ei toimi.</strong></p><p>Ilman suunnitelmaa seinästä tulee sekava, ja kaupunki on maksanut muraalista. Työpaja antaa nuorille äänen ja pitää kokonaisuuden kasassa.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Esittely", teksti="""<<run setup.taustakuva(either("../../images/koulutusalat/muotoilu-skuutti-tausta.webp", "../../images/koulutusalat/muotoilu-ramppi-tausta.webp"))>><h1>Kampanja valmis</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>, kun kampanja on valmis. Kello 16 se esitellään asiakkaalle.</p>
<p>Neuvotteluhuoneen näytöllä vaihtuvat logo, juliste, 3D-kuva puistosta, heijastinlahja ja muraalin luonnos. Asiakas nyökkää ja hymyilee.</p>
<p>Huomasitko? Yhteen kampanjaan tarvittiin monta taiteen ja muotoilun ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Sanni, AD</strong> – johti kampanjaa ja kuunteli asiakasta</li>
<li><strong>Leo, graafinen suunnittelija</strong> – teki logon, joka toimii kaikille</li>
<li><strong>Emma, kuvittaja</strong> – piirsi julisteen kuvan</li>
<li><strong>Onni, 3D-mallintaja</strong> – teki puistosta visualisoinnin</li>
<li><strong>Kaisa, teollinen muotoilija</strong> – suunnitteli avajaislahjan</li>
<li><strong>Aino, kuvataiteilija</strong> – maalasi muraalin yhdessä nuorten kanssa</li>
</ul>
<p>Graafisen suunnittelun, kuvituksen ja 3D-mallinnuksen opinnot voi aloittaa ammattikoulussa media-alan ja kuvallisen ilmaisun perustutkinnossa. Muotoilijaksi ja kuvataiteilijaksi opiskellaan ammattikorkeakoulussa tai yliopistossa.</p>""")

PIIRTEET = {
 "luova": {"nimi": "Ideoija", "kuvaus": "Keksit omia, uusia ratkaisuja."},
 "kuuntelija": {"nimi": "Käyttäjän kuuntelija", "kuvaus": "Selvität, mitä asiakas ja käyttäjät oikeasti tarvitsevat."},
 "selkea": {"nimi": "Selkeyden mestari", "kuvaus": "Teet asioista helppoja ymmärtää ja nähdä."},
 "vastuullinen": {"nimi": "Rehellinen tekijä", "kuvaus": "Kunnioitat toisten töitä ja kerrot totuuden."},
}

AMMATIT = {
 "ad": {"nimi": "AD eli taiteellinen johtaja", "kuvaus": "Johtaa mainoskampanjan visuaalista suunnittelua ja tiimiä.",
        "tutkinto": "Medianomi (AMK) tai muotoilija (AMK) ja työkokemus", "piirteet": ["kuuntelija", "selkea"]},
 "graafinen": {"nimi": "Graafinen suunnittelija", "kuvaus": "Suunnittelee logoja, julisteita, verkkosivuja ja pakkauksia.",
               "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto tai medianomi (AMK)", "piirteet": ["selkea", "luova"]},
 "kuvittaja": {"nimi": "Kuvittaja", "kuvaus": "Piirtää kuvia kirjoihin, mainoksiin, peleihin ja verkkoon.",
               "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto tai kuvataiteilija (AMK)", "piirteet": ["luova", "vastuullinen"]},
 "mallintaja": {"nimi": "3D-mallintaja", "kuvaus": "Tekee 3D-malleja ja visualisointeja peleihin, elokuviin ja arkkitehtuuriin.",
                "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto tai medianomi (AMK)", "piirteet": ["luova", "vastuullinen"]},
 "muotoilija": {"nimi": "Teollinen muotoilija", "kuvaus": "Suunnittelee tuotteita, joita valmistetaan tehtaissa.",
                "tutkinto": "Muotoilija (AMK) tai taiteen maisteri (Aalto-yliopisto)", "piirteet": ["kuuntelija", "luova"]},
 "kuvataiteilija": {"nimi": "Kuvataiteilija", "kuvaus": "Tekee maalauksia, veistoksia, muraaleja ja muuta taidetta.",
                    "tutkinto": "Kuvataiteilija (AMK) tai kuvataiteen maisteri (Taideyliopisto)", "piirteet": ["luova", "kuuntelija"]},
}

KUTSU_JOHDANTO = "Esittely meni hyvin, ja asiakas pyytää vielä yhden julisteen. Nyt sinä pääset suunnittelemaan sen!"

def V(teksti, tagit=(), **kw):
    d = {"teksti": teksti, "tagit": list(tagit)}; d.update(kw); return d

TEHTAVA = dict(
    tyyppi="ilme",
    nimi="Visuaalinen ilme", tag="Tehtävä · noin 15 min",
    maara="<strong>yksi juliste skeittipuiston avajaisiin</strong>",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Suunnittele juliste: valitse värit, fontti, otsikon koko, kuva, asettelu ja lisätiedot.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Esikatselu ja kontrastimittari päivittyvät heti. Kun näytät julisteen asiakkaalle, näet, mitkä briefin kohdat toteutuivat. Voit muokata julistetta ja yrittää uudelleen. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Julisteesi",
    osa1="Osa 1/2 · Juliste", osa2="Osa 2/2 · Perustelut",
    briefOtsikko="Asiakkaan brief",
    brief="Kaupungin uusi skeittipuisto avautuu. Juliste tulee kouluille, kirjastoon ja bussipysäkeille. Sen pitää houkutella 13–18-vuotiaita ja näkyä kauas. Kaupungin logo pitää olla mukana. Kuvan käyttöön pitää olla lupa.",
    julisteOtsikko="Skeitti\u00adpuisto avautuu!",
    oletusPaletti={"tausta": "#3a3d52", "tekstivari": "#ffffff", "korostus": "#8a8fb0"},
    esikatseluNimi="Esikatselu", eiKuvaa="Valitse kuva",
    kontrastiNimi="Kontrasti", kontrastiHyva="– teksti erottuu hyvin", kontrastiHuono="– tekstiä on vaikea lukea",
    kontrastiOhje="Valitse värit, niin näet kontrastin.",
    saannotOtsikko="Briefin tarkistuslista",
    tarkistaNappi="Näytä asiakkaalle", muokkaaNappi="Muokkaa julistetta", jatkaNappi="Jatka perusteluihin",
    takaisinNappi="Takaisin julisteeseen", valmisNappi="Katso tulos",
    perusteluOtsikko="Juliste on valmis!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="JULISTE · MAINOSTOIMISTO KIPINÄ",
    palaute=["Huippujuliste! Se näkyy, houkuttelee nuoria ja kertoo kaiken tärkeän.",
             "Hyvä juliste! Pari muutosta, niin asiakas olisi täysin tyytyväinen.",
             "Hyvä alku! Lue tarkistuslistan selitykset ja kokeile muuttaa valintoja."],
    osat=[
        dict(avain="paletti", otsikko="Värit", tyyppi="yksi", vaihtoehdot=[
            V("Yö ja neon", ["nuorekas"], tausta="#14162b", tekstivari="#ffffff", korostus="#39ff88"),
            V("Pastellit", ["nuorekas"], tausta="#f7c6d9", tekstivari="#ffffff", korostus="#a0e7e5"),
            V("Betoni ja oranssi", ["nuorekas"], tausta="#8d939b", tekstivari="#ff7a1a", korostus="#ffffff"),
            V("Virallinen sininen", ["virallinen"], tausta="#ffffff", tekstivari="#1d3557", korostus="#457b9d"),
            V("Keltainen ja musta", ["nuorekas"], tausta="#f4d35e", tekstivari="#14162b", korostus="#e2552f")]),
        dict(avain="fontti", otsikko="Otsikon fontti", tyyppi="yksi", vaihtoehdot=[
            V("Leveä ja paksu", ["nuorekas", "luettava"], fontti="'Arial Black', 'Helvetica Neue', Arial, sans-serif", paino=900),
            V("Käsinkirjoitettu", ["nuorekas"], fontti="'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive", paino=400, kursiivi=True),
            V("Perinteinen kirjafontti", ["luettava", "virallinen"], fontti="Georgia, 'Times New Roman', serif", paino=700)]),
        dict(avain="koko", otsikko="Otsikon koko", tyyppi="yksi", vaihtoehdot=[
            V("Pieni", [], koko=1.0), V("Keskikokoinen", ["iso"], koko=1.65), V("Iso", ["iso"], koko=2.3)]),
        dict(avain="kuva", otsikko="Kuva", tyyppi="yksi", vaihtoehdot=[
            V("Oma valokuva skeittaajasta, jolta on kysytty lupa", ["lupa"], laji="oma"),
            V("Kuvittajan oma piirros", ["lupa"], laji="piirros"),
            V("Tekoälykuva tunnetun taiteilijan tyyliin", [], laji="tekoaly"),
            V("Kuva, joka löytyi netistä", [], laji="netti")]),
        dict(avain="asettelu", otsikko="Asettelu", tyyppi="yksi", vaihtoehdot=[
            V("Kuva ylhäällä, otsikko alla", [], luokka="il-ylhaalla"),
            V("Otsikko ylhäällä, kuva alla", [], luokka="il-alhaalla"),
            V("Kuva koko taustana", [], luokka="il-paalla")]),
        dict(avain="lisat", otsikko="Lisää julisteeseen", tyyppi="monta", vaihtoehdot=[
            V("Aika: la 6.6. klo 14–20", ["aika"], elementti="tieto", lyhyt="LA 6.6. KLO 14–20"),
            V("Paikka: Koivupuiston skeittipuisto", ["paikka"], elementti="tieto", lyhyt="Koivupuisto"),
            V("Kaupungin logo", ["logo"], elementti="logo", lyhyt="KAUPUNKI"),
            V("QR-koodi ohjelmaan", ["qr"], elementti="qr"),
            V("Pitkä teksti puiston rakentamisesta", ["pitka"], elementti="pitka", lyhyt="Puiston suunnittelu alkoi kolme vuotta sitten, kun nuorisovaltuusto teki aloitteen. Rakentaminen aloitettiin keväällä, ja työssä on käytetty kotimaista betonia…")]),
    ],
    saannot=[
        {"tyyppi": "kontrasti", "min": 4.5, "nimi": "Teksti erottuu taustasta",
         "selitys": "Tekstin ja taustan kontrastin pitää olla vähintään 4,5 : 1. Muuten heikkonäköiset ja kaukaa katsovat eivät saa tekstistä selvää. Vaalea teksti vaalealla taustalla katoaa."},
        {"tyyppi": "tagit", "kaikki": ["luettava", "iso"], "nimi": "Otsikko näkyy kauas",
         "selitys": "Julistetta luetaan ohi kävellen usean metrin päästä. Selkeä fontti ja vähintään keskikokoinen otsikko toimivat. Käsinkirjoitettua fonttia on vaikea lukea kaukaa."},
        {"tyyppi": "tagit", "kaikki": ["nuorekas"], "ei": ["virallinen"], "nimi": "Juliste puhuttelee nuoria",
         "selitys": "Kohderyhmä on 13–18-vuotiaat. Rohkeat värit ja leveä fontti viestivät energiaa. Virallinen tyyli muistuttaa kunnan tiedotetta."},
        {"tyyppi": "tagit", "kaikki": ["lupa"], "nimi": "Kuvan käyttöön on lupa",
         "selitys": "Netistä löytyneet kuvat kuuluvat niiden tekijöille. Tunnetun taiteilijan tyylin kopioiminen tekoälyllä on epäreilua. Oma kuva tai kuvittajan piirros on turvallinen valinta."},
        {"tyyppi": "tagit", "kaikki": ["aika", "paikka"], "nimi": "Aika ja paikka näkyvät",
         "selitys": "Ilman aikaa ja paikkaa kukaan ei tiedä, minne ja milloin mennä. Ne ovat julisteen tärkeimmät tiedot."},
        {"tyyppi": "tagit", "kaikki": ["logo"], "nimi": "Kaupungin logo on mukana",
         "selitys": "Asiakas pyysi logoa briefissä. Logo kertoo, kuka tapahtuman järjestää."},
        {"tyyppi": "tagit", "ei": ["pitka"], "nimi": "Juliste ei ole liian täynnä",
         "selitys": "Pitkää tekstiä ei lueta ohi kävellessä. Lisätiedot kannattaa laittaa verkkosivulle, jonne QR-koodi vie."},
    ],
    kysymykset=[
        {"kysymys": "Miksi julisteen suunnittelijan pitää ajatella myös heikkonäköisiä ja värisokeita?", "ammattilainen": "Graafinen suunnittelija",
         "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto", "placeholder": "Heitä pitää ajatella, koska…"},
        {"kysymys": "Miksi toisen taiteilijan kuvaa tai tyyliä ei saa käyttää ilman lupaa?", "ammattilainen": "Kuvittaja",
         "tutkinto": "Kuvataiteilija (AMK)", "placeholder": "Lupa tarvitaan, koska…"},
    ],
    ammattilaisetOtsikko="Taiteen ja muotoilun ammatteja",
    ammattilaiset=[
        {"nimi": "Graafinen suunnittelija", "tehtava": "suunnittelee logoja, julisteita ja verkkosivuja", "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto, medianomi (AMK)"},
        {"nimi": "Kuvittaja", "tehtava": "piirtää kuvia kirjoihin, peleihin ja mainoksiin", "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto, kuvataiteilija (AMK)"},
        {"nimi": "3D-mallintaja", "tehtava": "tekee 3D-malleja peleihin ja visualisointeihin", "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto, medianomi (AMK)"},
        {"nimi": "Teollinen muotoilija", "tehtava": "suunnittelee tuotteita", "tutkinto": "Muotoilija (AMK)"},
        {"nimi": "Kuvataiteilija", "tehtava": "tekee taidetta, kuten maalauksia ja muraaleja", "tutkinto": "Kuvataiteilija (AMK), kuvataiteen maisteri"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Autoit mainostoimistoa kampanjan kanssa ja suunnittelit oman julisteen. Samalla tutustuit taiteen ja muotoilun ammatteihin."

OPPILAITOKSET = ("Missä taidetta ja muotoilua voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Taiteen ja muotoilun koulutukset</h2>
<p>Taiteen ja muotoilun opinnot voi aloittaa ammattikoulussa tai lukiossa. Moni jatkaa myöhemmin ammattikorkeakouluun tai yliopistoon. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Media-alan ja kuvallisen ilmaisun perustutkinto", "Graafinen suunnittelu, kuvitus, valokuvaus, video ja 3D-mallinnus.", "https://opintopolku.fi/konfo/fi/haku?keyword=media-alan%20ja%20kuvallisen%20ilmaisun%20perustutkinto")
    + kortti("Taideteollisuusalan perustutkinto", "Artesaanin tutkinto: muotoilu ja käsityö eri materiaaleista.", "https://opintopolku.fi/konfo/fi/haku?keyword=taideteollisuusalan%20perustutkinto")
    + kortti("Kuvataidelukiot", "Lukiossa voi painottaa kuvataidetta. Esimerkiksi Helsingissä, Tampereella ja Oulussa on kuvataidelukioita.", "https://opintopolku.fi/konfo/fi/haku?keyword=kuvataidelukio")
    + """<h3>Myöhemmin</h3>
""" + kortti("Ammattikorkeakoulut", "Muotoilija (AMK), medianomi (AMK) ja kuvataiteilija (AMK). Esimerkiksi LAB, Metropolia, TAMK ja Turun AMK.", "https://opintopolku.fi/konfo/fi/haku?keyword=muotoilija%20amk")
    + kortti("Aalto-yliopisto", "Muotoilu, graafinen suunnittelu ja elokuvataide (Arts).", "https://www.aalto.fi/fi/taiteiden-ja-suunnittelun-korkeakoulu")
    + kortti("Taideyliopisto", "Kuvataideakatemiassa opiskellaan kuvataiteilijaksi.", "https://www.uniarts.fi")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
SEURAUKSET = {
    "Neuvotteluhuone": "Julisteen sisältöä jouduttiin karsimaan viime hetkellä, kun asiakas ei ollut tyytyväinen.",
    "Logo": "Logoa jouduttiin muuttamaan vielä esittelyn jälkeen, koska kaikki eivät erottaneet sen osia.",
    "Kuvituspöytä": "Pääkuva piti vaihtaa, ja Emma joutui piirtämään uuden kuvan kiireessä.",
    "Mallinnus": "3D-kuvaa jouduttiin muuttamaan, koska se lupasi enemmän kuin puistoon oikeasti tulee.",
    "Muotoilupaja": "Avajaislahjan suunnitelma piti tehdä uudelleen, kun nuoret eivät innostuneet siitä.",
    "Muraali": "Muraalin suunnitelmaa jouduttiin selvittämään nuorten kanssa vielä illalla.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>, kun kampanja on valmis. Kello 16 esittely alkaa, ja kaikki on kunnossa!",
    "Kello on <<print setup.kello($aika)>>, kun kampanja on valmis. Kello 16 esittely alkaa. Pari asiaa olisi voinut mennä paremmin, mutta päivä onnistui.",
    "Kello on <<print setup.kello($aika)>>, kun kampanja vihdoin on valmis. Päivä oli täynnä korjattavaa, ja Sanni on huolissaan.",
]
MYOHASSA = "Kampanja ei ollut valmis kello 16, ja asiakas joutui odottamaan."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
