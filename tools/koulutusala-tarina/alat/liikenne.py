# -*- coding: utf-8 -*-
"""Autot ja liikenne – "Lumimyräkkäpäivä" (sisältö). Uusi ala, kuuluu tekniikan aloihin.
Rakenna: python3 rakenna_tarina.py alat/liikenne.py <orig palvelu-ala.html> <uusi liikenne-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on liikennekeskuksen päivystäjä. Tarina kulkee yhden talvipäivän klo 7–16 (kohtauksilla lisäaika).
Ammatit: automekaanikko, yhdistelmäajoneuvonkuljettaja, linja-autonkuljettaja, autokorimekaanikko,
veturinkuljettaja ja huoltomyyjä. Loppuosan tehtävä on "Vianetsintä" (TEHTAVA tyyppi "vianetsinta"):
oppilas tutkii kolme autoa rajatulla testimäärällä, päättelee vian ja kokoaa korjaustilauksen."""

ala = "liikenne"
alaNimi = "Autot ja liikenne"
tarinaNimi = "Lumimyräkkäpäivä"
maailma = "liikenne"
yleisKohtaus = "liikenne"
katsoTeksti = "Katso liikennettä"
kello = {"alku": 7 * 60, "raja": 9 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Liikenneala", "ifid": "2f483236-d70f-42e4-9403-5f362794ee72"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Vuoro päättyy klo 16.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Talven värit: tumma asfaltti, liikennemerkin sininen ja varoitusoranssi
TEEMA = """:root {
  --a1: #ffa94d; --a1-rgb: 255,169,77;
  --a2: #4dabf7; --a2-rgb: 77,171,247;
  --a3: #ffe0b8;
  --korostus: #ffd43b; --korostus-rgb: 255,212,59;
  --tausta: #151b23; --tausta-rgb: 21,27,35;
  --tausta-2: #1f2833; --tausta-2-rgb: 31,40,51;
  --paneeli: #1a222c; --paneeli-rgb: 26,34,44;
  --paneeli-2: #25303c;
  --tumma: #0e1318; --tumma-rgb: 14,19,24;
  --reuna: #ffa94d;
  --teksti-pehmea: #dde4ec; --teksti-pehmea-rgb: 221,228,236;
  --teksti-vaalea: #f8fafc;
  --nappi-teksti: #2a1400;
  --kansi-nappi-bg: linear-gradient(135deg, #ff8a2a, var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #ffe0b8;
  --kansi-nappi-varjo: #8a4a00;
  --kansi-nappi-hehku: 255,169,77;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Tekniikan ala", otsikko="Autot ja liikenne",
             alaotsikko="Lumimyräkkäpäivä · Kuka pitää autot kunnossa ja liikenteen liikkeellä, kun lunta tulee tuiskuamalla?",
             nappi="Lähde liikenteeseen", ikoni="auto")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet liikennekeskuksen päivystäjä. Tänään Suomeen tulee kova lumimyräkkä. Seuraat, miten autojen ja liikenteen ammattilaiset selviävät päivästä. Joka kerta päätät, mikä on paras tapa toimia.",
            faktat=[("6", "ammattilaista"), ("1", "myräkkä"), ("9", "tuntia")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "liikenne-lumipyry-tausta.webp",
               "alku": KUVA + "liikenne-alyliikenne-tausta.webp",
               "tehtava": KUVA + "liikenne-sahkoauto-tausta.webp",
               "kortti": KUVA + "liikenne-alyliikenne-tausta.webp",
               "loppu": [KUVA + "liikenne-juna-tausta.webp", KUVA + "liikenne-bussi-tausta.webp", KUVA + "liikenne-moottoritie-tausta.webp", KUVA + "liikenne-lumipyry-tausta.webp"],
               "oppilaitokset": [KUVA + "liikenne-sahkoauto-tausta.webp", KUVA + "liikenne-moottoritie-tausta.webp", KUVA + "liikenne-ruuhka-tausta.webp"]}

TARINA_ALKU = dict(nimi="Myräkkä tulee", tausta="liikennekeskus", teksti="""<<include "HUD">>
<h1>Myräkkä tulee</h1>
<p>Kello on 7.00. Istut liikennekeskuksessa. Edessäsi on seinällinen näyttöjä: tiekameroita, karttoja ja säätutkia.</p>
<p>Liikennekeskus seuraa teitä ja rautateitä koko ajan. Täältä varoitetaan liukkaudesta, vaihdetaan nopeusrajoituksia ja kerrotaan onnettomuuksista.</p>
<p>Ennuste lupaa koko päiväksi lumimyräkkää. Tänään liikenteessä tarvitaan monen alan ammattilaisia.</p>
<p class="puhe"><strong>Riikka, vuoron vetäjä:</strong> ”Kahvit kuppiin. Tästä tulee pitkä päivä!”</p>
<div class="intro-nappi"><<link "Aloita vuoro">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Korjaamo aamulla", tausta="korjaamo", otsikko="Kesärenkaat alla", avain="automekaanikko",
      taustakuva=KUVA + "liikenne-lumipyry-tausta.webp",
      kysymys="Miltä automekaanikon työ näytti?", lisaaika=60, siirtymaTeksti="Seuraava tilanne on vähän ennen kymmentä.",
      johdanto="""<p>Autokorjaamolle tulee asiakas. Hänen autossaan on vielä kesärenkaat, vaikka maa on valkoinen.</p>
<p>”Lähden nyt Tampereelle. Talvirenkaat vaihdetaan vasta ensi viikolla, kun minulla on aikaa”, hän sanoo.</p>
<p class="puhe"><strong>Oskari, automekaanikko:</strong> ”Mitä hänelle sanotaan?”</p>""",
      valinnat=[
       dict(teksti="Talvirenkaat vaihdetaan heti. Asiakas odottaa tunnin kahvilla, ja sitten hän pääsee turvallisesti matkaan.", aika=45, piirteet={"turva": 2, "asiakas": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Kesärenkailla auto ei pysy lumella tiellä. Laki vaatii talvirenkaat talvikelillä. Oskari vaihtaa renkaat, ja asiakas lähtee turvallisesti.</p>"),
       dict(teksti="Asiakas saa lähteä, kunhan hän ajaa hiljaa.", aika=30, piirteet={},
            palaute="<p><strong>Vaarallista!</strong></p><p>Kesärenkailla jarrutusmatka on lumella moninkertainen, vaikka ajaisi hiljaa. Oskari pyytää asiakasta odottamaan renkaanvaihtoa.</p>"),
       dict(teksti="Vaihdetaan talvirenkaat vain eteen. Se on nopeampaa.", aika=35, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Jos talvirenkaat ovat vain edessä, auton takapää voi lähteä liukkaalla luistamaan. Kaikissa renkaissa pitää olla samanlaiset renkaat.</p>"),
      ]),
 dict(nimi="Moottoritiellä", tausta="moottoritie", otsikko="Rekka ja lumipyry", avain="yhdistelma",
      taustakuva=KUVA + "liikenne-ruuhka-tausta.webp",
      kysymys="Miltä yhdistelmäajoneuvonkuljettajan työ näytti?", lisaaika=75, siirtymaTeksti="Seuraava tilanne on puolenpäivän jälkeen.",
      johdanto="""<p>Näet tiekamerasta, että moottoritiellä on kova lumipyry. Kuljettaja Mira ajaa rekkaa, jossa on ruokaa kauppoihin.</p>
<p>Miran ajoaika on täynnä. Laki vaatii, että hän pitää nyt tauon. Kauppa odottaa kuormaa, ja perille on vielä tunnin matka.</p>
<p class="puhe"><strong>Mira, yhdistelmäajoneuvonkuljettaja:</strong> ”Mitä teen?”</p>""",
      valinnat=[
       dict(teksti="Mira pysähtyy taukopaikalle ja pitää lakisääteisen tauon. Hän ilmoittaa kauppaan, että kuorma myöhästyy.", aika=45, piirteet={"turva": 2, "tarkka": 1},
            palaute="<p><strong>Oikein!</strong></p><p>Ajo- ja lepoajat on määrätty laissa. Väsynyt kuljettaja on yhtä vaarallinen kuin humalainen. Kun Mira ilmoittaa myöhästymisestä, kauppa osaa varautua.</p>"),
       dict(teksti="Mira ajaa tauotta perille. Tunti ei ole paljon.", aika=40, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Ajoajat tarkistetaan ajopiirturista, ja rikkomuksesta tulee sakko. Tärkeintä on silti, että väsyneenä riski joutua onnettomuuteen kasvaa. Mira pysähtyy taukopaikalle.</p>"),
       dict(teksti="Mira ajaa kovempaa, jotta ehtii perille ennen taukoa.", aika=40, piirteet={},
            palaute="<p><strong>Hengenvaarallista!</strong></p><p>40-tonninen rekka tarvitsee liukkaalla todella pitkän jarrutusmatkan. Mira hidastaa ja pitää tauon.</p>"),
      ]),
 dict(nimi="Bussipysäkillä", tausta="bussi", otsikko="Myöhässä oleva bussi", avain="linja",
      taustakuva=KUVA + "liikenne-bussi-tausta.webp",
      kysymys="Miltä linja-autonkuljettajan työ näytti?", lisaaika=60, siirtymaTeksti="Seuraava tilanne on puoli kahdelta.",
      johdanto="""<p>Kaupungissa bussit ovat myöhässä lumen takia. Kuljettaja Ahmed on jo 15 minuuttia myöhässä aikataulusta.</p>
<p>Pysäkillä odottaa matkustaja pyörätuolissa. Bussin luiska on jäinen, ja pysäkin reunassa on lumivalli.</p>
<p class="puhe"><strong>Ahmed, linja-autonkuljettaja:</strong> ”Miten toimin?”</p>""",
      valinnat=[
       dict(teksti="Ahmed pysähtyy, puhdistaa luiskan lumesta ja auttaa matkustajan kyytiin. Hän varmistaa, että pyörätuoli on kiinnitetty.", aika=45, piirteet={"asiakas": 2, "turva": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Linja-autonkuljettaja on asiakaspalvelija. Jokaisella on oikeus päästä kyytiin. Muutama minuutti lisää ei haittaa, kun kaikki pääsevät turvallisesti perille.</p>"),
       dict(teksti="Ahmed ajaa pysäkin ohi, koska hän on jo myöhässä.", aika=30, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Matkustaja jäisi pakkaseen, eikä seuraava bussi välttämättä pääse yhtään paremmin. Ahmed pysähtyy ja auttaa.</p>"),
       dict(teksti="Ahmed sanoo, että matkustaja voi odottaa seuraavaa bussia.", aika=30, piirteet={},
            palaute="<p><strong>Ei reilua.</strong></p><p>Kun luiska puhdistetaan, kyytiin pääsee turvallisesti. Ahmed auttaa matkustajan kyytiin.</p>"),
      ]),
 dict(nimi="Kolarikorjaamo", tausta="kolari", otsikko="Kolhiintunut auto", avain="korimekaanikko",
      kysymys="Miltä autokorimekaanikon työ näytti?", lisaaika=45, siirtymaTeksti="Seuraava tilanne on kolmen jälkeen.",
      johdanto="""<p>Liukkaalla risteyksessä on tapahtunut pieni kolari. Kukaan ei loukkaantunut, mutta auton keula meni rikki. Auto hinataan korjaamolle.</p>
<p>Puskurin sisällä on tutka-anturi. Se jarruttaa autoa automaattisesti, jos edessä on este. Asiakas haluaa säästää: ”Vaihtakaa vain puskuri. Ei sitä anturia tarvitse säätää.”</p>
<p class="puhe"><strong>Elina, autokorimekaanikko:</strong> ”Mitä teen?”</p>""",
      valinnat=[
       dict(teksti="Elina vaihtaa puskurin ja säätää anturin valmistajan ohjeen mukaan. Hän kertoo asiakkaalle, miksi se on tärkeää.", aika=45, piirteet={"tarkka": 2, "turva": 1},
            palaute="<p><strong>Ammattilaisen työtä!</strong></p><p>Jos anturi osoittaa vähänkin vinoon, hätäjarrutus ei toimi oikein. Asiakas ymmärtää, kun Elina selittää asian.</p>"),
       dict(teksti="Elina vaihtaa vain puskurin, kuten asiakas pyysi.", aika=30, piirteet={},
            palaute="<p><strong>Riskialtista.</strong></p><p>Säätämätön anturi voi jarruttaa turhaan tai jättää jarruttamatta. Elina kertoo asiakkaalle, miksi anturi pitää säätää.</p>"),
       dict(teksti="Elina irrottaa anturin kokonaan, niin siitä ei ole harmia.", aika=30, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Turvalaitetta ei poisteta. Ne estävät paljon onnettomuuksia. Elina säätää anturin ohjeen mukaan.</p>"),
      ]),
 dict(nimi="Puu radalla", tausta="juna", otsikko="Lumen painama puu", avain="veturi",
      taustakuva=KUVA + "liikenne-yojuna-tausta.webp",
      kysymys="Miltä veturinkuljettajan työ näytti?", lisaaika=30, siirtymaTeksti="Seuraava tilanne on vähän ennen neljää.",
      johdanto="""<p>Junaradalla lumen painama puu on kaatunut nojaamaan junan sähköjohtoon.</p>
<p>Veturinkuljettaja Pekka huomaa puun kaukaa. Junassa on 300 matkustajaa.</p>
<p class="puhe"><strong>Pekka, veturinkuljettaja:</strong> ”Mitä teen?”</p>""",
      valinnat=[
       dict(teksti="Pekka jarruttaa ja pysäyttää junan. Hän ilmoittaa liikenteenohjaukseen ja kertoo matkustajille, mitä tapahtuu.", aika=45, piirteet={"turva": 2, "rauhallinen": 1},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Liikenteenohjaus katkaisee sähköt, ja huoltomiehet poistavat puun. Matkustajat pysyvät rauhallisina, kun heille kerrotaan, mitä tapahtuu.</p>"),
       dict(teksti="Pekka ajaa hiljaa puun ohi.", aika=30, piirteet={},
            palaute="<p><strong>Vaarallista!</strong></p><p>Puu voi repiä sähköjohdon alas tai rikkoa junan. Pekka pysäyttää junan ja ilmoittaa liikenteenohjaukseen.</p>"),
       dict(teksti="Pekka menee itse sahaamaan puun pois radalta.", aika=30, piirteet={},
            palaute="<p><strong>Hengenvaarallista!</strong></p><p>Junan sähköjohdossa kulkee 25 000 voltin jännite. Vain koulutetut huoltomiehet poistavat puun, kun sähkö on katkaistu.</p>"),
      ]),
 dict(nimi="Asiakaspalvelussa", tausta="huolto", otsikko="Jono tiskillä", avain="huoltomyyja",
      taustakuva=KUVA + "liikenne-sahkoauto-tausta.webp",
      kysymys="Miltä huoltomyyjän työ näytti?",
      johdanto="""<p>Korjaamon tiskillä on pitkä jono. Kaikki haluavat talvirenkaat heti alle.</p>
<p>Yksi asiakas korottaa ääntään: ”Minulla ei ole aikaa odottaa! Vaihtakaa renkaani nyt heti!”</p>
<p class="puhe"><strong>Sanna, huoltomyyjä:</strong> ”Miten vastaan hänelle?”</p>""",
      valinnat=[
       dict(teksti="Sanna kuuntelee rauhallisesti ja kertoo, kauanko odotus todella kestää. Hän tarjoaa vapaata aikaa huomisaamuna.", aika=45, piirteet={"asiakas": 2, "rauhallinen": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Kun asiakasta kuunnellaan ja hänelle kerrotaan totuus, hän rauhoittuu. Asiakas varaa ajan aamuksi ja lähtee bussilla kotiin.</p>"),
       dict(teksti="Sanna lupaa, että kaikkien renkaat vaihdetaan tunnin sisällä.", aika=30, piirteet={},
            palaute="<p><strong>Lupaus, jota ei voi pitää.</strong></p><p>Korjaamossa ei ehdi vaihtaa kaikkia renkaita tunnissa. Asiakkaat suuttuvat vielä enemmän, kun lupaus ei pidä. Sanna kertoo totuuden ja tarjoaa uuden ajan.</p>"),
       dict(teksti="Sanna käskee asiakkaan mennä muualle.", aika=30, piirteet={},
            palaute="<p><strong>Ei hyvä.</strong></p><p>Hyvä asiakaspalvelu on huoltomyyjän tärkein taito. Sanna rauhoittuu, kuuntelee ja tarjoaa uuden ajan.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Myräkkä laantuu", teksti="""<h1>Myräkkä laantuu</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Lumisade loppuu, ja tiet aurataan.</p>
<p>Liikennekeskuksen näytöillä liikenne alkaa taas sujua. Kirjoitat iltavuorolle, mitä päivän aikana tapahtui.</p>
<p>Huomasitko? Liikenne pysyi liikkeellä, koska moni ammattilainen teki työnsä huolellisesti:</p>
<ul class="ammattilista">
<li><strong>Oskari, automekaanikko</strong> – vaihtoi talvirenkaat ennen pitkää matkaa</li>
<li><strong>Mira, yhdistelmäajoneuvonkuljettaja</strong> – piti tauon ja vei kuorman turvallisesti perille</li>
<li><strong>Ahmed, linja-autonkuljettaja</strong> – auttoi pyörätuolia käyttävän matkustajan kyytiin</li>
<li><strong>Elina, autokorimekaanikko</strong> – korjasi kolariauton ja sen turvalaitteet</li>
<li><strong>Pekka, veturinkuljettaja</strong> – pysäytti junan ajoissa</li>
<li><strong>Sanna, huoltomyyjä</strong> – rauhoitti jonon korjaamon tiskillä</li>
</ul>
<p>Automekaanikoksi, autokorimekaanikoksi ja huoltomyyjäksi voi opiskella ajoneuvoalan perustutkinnossa. Rekan ja bussin kuljettajaksi opiskellaan logistiikan perustutkinnossa. Veturinkuljettajat ja liikennekeskuksen päivystäjät koulutetaan yleensä aikuisena työpaikan omassa koulutuksessa.</p>""")

PIIRTEET = {
 "turva": {"nimi": "Turvallisuus ensin", "kuvaus": "Et ota riskejä liikenteessä, vaikka olisi kiire."},
 "tarkka": {"nimi": "Tarkka", "kuvaus": "Teet työt ohjeiden mukaan ja huomaat pienetkin viat."},
 "asiakas": {"nimi": "Asiakaspalvelija", "kuvaus": "Autat ihmisiä ystävällisesti ja kerrot asiat rehellisesti."},
 "rauhallinen": {"nimi": "Rauhallinen", "kuvaus": "Pysyt rauhallisena, kun tilanne muuttuu yllättäen."},
}

AMMATIT = {
 "automekaanikko": {"nimi": "Automekaanikko", "kuvaus": "Huoltaa ja korjaa autoja sekä etsii vikoja testilaitteilla.",
                    "tutkinto": "Ajoneuvoalan perustutkinto (automekaanikko)", "piirteet": ["tarkka", "turva"]},
 "yhdistelma": {"nimi": "Yhdistelmäajoneuvonkuljettaja", "kuvaus": "Kuljettaa rekalla tavaraa Suomessa ja ulkomailla.",
                "tutkinto": "Logistiikan perustutkinto (yhdistelmäajoneuvonkuljettaja)", "piirteet": ["turva", "rauhallinen"]},
 "linja": {"nimi": "Linja-autonkuljettaja", "kuvaus": "Kuljettaa matkustajia kaupungissa, kaukoliikenteessä ja tilausajoissa.",
           "tutkinto": "Logistiikan perustutkinto (linja-autonkuljettaja)", "piirteet": ["asiakas", "turva"]},
 "korimekaanikko": {"nimi": "Autokorimekaanikko", "kuvaus": "Korjaa kolarissa vaurioituneita autoja ja niiden turvalaitteita.",
                    "tutkinto": "Ajoneuvoalan perustutkinto (autokorimekaanikko)", "piirteet": ["tarkka", "turva"]},
 "veturi": {"nimi": "Veturinkuljettaja", "kuvaus": "Kuljettaa henkilö- ja tavarajunia.",
            "tutkinto": "Rautatieyhtiön veturinkuljettajakoulutus aikuisena", "piirteet": ["rauhallinen", "turva"]},
 "huoltomyyja": {"nimi": "Huoltomyyjä", "kuvaus": "Palvelee korjaamon asiakkaita, varaa ajat ja kertoo korjausten hinnat.",
                 "tutkinto": "Ajoneuvoalan perustutkinto (huoltomyyjä)", "piirteet": ["asiakas", "rauhallinen"]},
}

KUTSU_JOHDANTO = "Myräkkä on ohi, mutta korjaamolle tulee kolme autoa, joissa on vika. Nyt sinä pääset automekaanikon paikalle. Selvitä testien avulla, mikä autoissa on vialla."

def T(nimi, ikoni, tulos, poikkeama=False, avain=False, kesto=""):
    return {"nimi": nimi, "ikoni": ikoni, "tulos": tulos, "poikkeama": poikkeama, "avain": avain, "kesto": kesto}

TEHTAVA = dict(
    tyyppi="vianetsinta",
    nimi="Vianetsintä", tag="Tehtävä · noin 20 min",
    maara="<strong>kolme vikaantunutta autoa</strong>",
    ohjeAskelLause="Jokaisen auton kohdalla teet kolme asiaa:",
    askeleet=["Valitse testit. Saat tehdä vain kolme testiä, koska korjaamon aika maksaa asiakkaalle.",
              "Päättele testitulosten avulla, mikä autossa on vialla.",
              "Kokoa korjaustilaus. Valitse vain ne osat ja työt, jotka tarvitaan."],
    lopuksi="Lopuksi vastaat kahteen kysymykseen. Sitten lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Korjaamoraporttisi",
    osa1="Auto", osa2="Viimeinen osa · Perustelut",
    korjaamo="AUTOKORJAAMO",
    tuloksetOtsikko="Testitulokset",
    testiOhje="Mitä testaat?",
    diagNappi="Tiedän vian – tee diagnoosi",
    tarkistaNappi="Tarkista korjaus",
    seuraavaNappi="Seuraava auto", jatkaNappi="Jatka perusteluihin", valmisNappi="Katso tulos",
    perusteluOtsikko="Kolme autoa korjattu!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="KORJAAMORAPORTTI · 3 AUTOA",
    palaute=["Huippumekaanikko! Löysit viat oikeilla testeillä ja tilasit vain tarvittavat korjaukset.",
             "Hyvää työtä! Pari asiaa vielä, niin olisit täydellinen automekaanikko.",
             "Hyvä alku! Mieti, mitkä testit liittyvät asiakkaan kertomaan oireeseen."],
    maxTesteja=3,
    autot=[
      dict(malli="Henkilöauto, vuosimalli 2015", tiedot="180 000 km · bensiini", ikoni="🚗",
           oire="Auto käynnistyy tosi huonosti pakkasaamuina. Valot himmenevät, kun yritän käynnistää.",
           testit=[T("Renkaiden urasyvyys", "🛞", "Kaikissa renkaissa 6 mm. Hyvä.", kesto="5 min"),
                   T("Akun jännite", "🔋", "11,9 V – liian matala. Täysi akku on noin 12,6 V.", True, True, "5 min"),
                   T("Pakokaasumittaus", "💨", "Päästöt normaalit.", kesto="15 min"),
                   T("Akun kuntotesti", "📉", "Akku jaksaa vain 40 % uuden akun tehosta. Akku on 7 vuotta vanha.", True, True, "10 min"),
                   T("Laturin lataustesti", "⚡", "14,2 V – laturi lataa normaalisti.", kesto="10 min"),
                   T("Jarrunesteen kunto", "🧪", "Jarruneste on kunnossa.", kesto="5 min")],
           testiSelitys="Akun jännite ja akun kuntotesti kertovat, jaksaako akku. Huono käynnistys pakkasella on usein akun vika.",
           viat=["Laturi on rikki", "Akku on kulunut loppuun", "Polttoaine on jäätynyt", "Renkaat ovat huonot"], oikeaVika=1,
           vikaSelitys="Vanha akku menettää tehoaan, ja pakkasella sen teho heikkenee vielä lisää. Laturi lataa normaalisti, joten vika ei ole siinä.",
           tilaus=[{"nimi": "Uusi akku", "hinta": 180, "oikein": True},
                   {"nimi": "Uusi laturi", "hinta": 450},
                   {"nimi": "Akun vaihto ja testaus", "hinta": 40, "oikein": True},
                   {"nimi": "Moottoriöljyn vaihto", "hinta": 120},
                   {"nimi": "Uudet renkaat (4 kpl)", "hinta": 480}],
           tilausSelitys="Vain akku vaihdetaan. Ylimääräiset korjaukset maksaisivat asiakkaalle turhaan satoja euroja."),
      dict(malli="Pakettiauto, vuosimalli 2019", tiedot="95 000 km · diesel", ikoni="🚐",
           oire="Kun jarrutan, kuuluu kova kirskuna. Auto myös vetää vasemmalle.",
           testit=[T("Akun jännite", "🔋", "12,6 V – akku on kunnossa.", kesto="5 min"),
                   T("Rengaspaineet", "🛞", "Kaikissa renkaissa 2,5 bar. Kunnossa.", kesto="5 min"),
                   T("Jarrupalojen paksuus", "📏", "Vasen etu: 1 mm – loppu! Oikea etu: 6 mm.", True, True, "15 min"),
                   T("Jarrunesteen määrä", "🧪", "Jarrunestettä on riittävästi.", kesto="5 min"),
                   T("Jarrulevyjen tarkastus", "💿", "Vasen etulevy on uurteinen ja kulunut.", True, True, "15 min"),
                   T("Pyöränsuuntaus", "📐", "Suuntaus on kunnossa.", kesto="30 min")],
           testiSelitys="Kirskuna jarrutettaessa viittaa jarruihin. Siksi kannattaa mitata jarrupalat ja tarkastaa jarrulevyt.",
           viat=["Rengas on tyhjä", "Etujarrujen palat ja levy ovat kuluneet", "Ohjaus on rikki", "Jarruneste on loppu"], oikeaVika=1,
           vikaSelitys="Kun jarrupala on kulunut loppuun, metalli hankaa levyä ja kirskuu. Auto vetää sille puolelle, jossa jarru toimii eri tavalla.",
           tilaus=[{"nimi": "Etujarrupalat (pari)", "hinta": 90, "oikein": True},
                   {"nimi": "Uudet renkaat (4 kpl)", "hinta": 480},
                   {"nimi": "Etujarrulevyt (pari)", "hinta": 160, "oikein": True},
                   {"nimi": "Pyöränsuuntaus", "hinta": 90},
                   {"nimi": "Jarrujen vaihtotyö", "hinta": 150, "oikein": True}],
           tilausSelitys="Jarrupalat ja jarrulevyt vaihdetaan aina pareittain samaan akseliin. Silloin auto jarruttaa suoraan."),
      dict(malli="Farmariauto, vuosimalli 2012", tiedot="240 000 km · bensiini", ikoni="🚙",
           oire="Tuulilasi huurtuu sisältä, eikä puhallin lämmitä yhtään. Lämpömittari näyttää koko ajan kylmää.",
           testit=[T("Vikakoodien luku", "💻", "Ei vikakoodeja.", kesto="10 min"),
                   T("Jäähdytysnesteen määrä", "🌡️", "Säiliö on melkein tyhjä!", True, True, "5 min"),
                   T("Pyyhkijänsulat", "🧽", "Sulat ovat kuluneet, mutta ne eivät liity vikaan.", kesto="5 min"),
                   T("Ilmansuodatin", "🌬️", "Suodatin on puhdas.", kesto="10 min"),
                   T("Jäähdytysjärjestelmän painekoe", "🔍", "Vesipumpun tiivisteestä vuotaa nestettä.", True, True, "20 min"),
                   T("Akun jännite", "🔋", "12,5 V – akku on kunnossa.", kesto="5 min")],
           testiSelitys="Auton lämmitys käyttää moottorin kuumaa jäähdytysnestettä. Kun lämmitys ei toimi, tarkistetaan nesteen määrä ja etsitään vuoto.",
           viat=["Lämmityksen puhallin on rikki", "Tuulilasi on viallinen", "Jäähdytysneste vuotaa vesipumpusta", "Ilmansuodatin on tukossa"], oikeaVika=2,
           vikaSelitys="Kun jäähdytysneste vuotaa, kuuma neste ei kierrä lämmityslaitteen kautta. Siksi puhallin puhaltaa vain kylmää ilmaa.",
           tilaus=[{"nimi": "Uusi vesipumppu", "hinta": 220, "oikein": True},
                   {"nimi": "Uusi tuulilasi", "hinta": 600},
                   {"nimi": "Vesipumpun vaihtotyö", "hinta": 260, "oikein": True},
                   {"nimi": "Uusi puhallin", "hinta": 190},
                   {"nimi": "Jäähdytysneste", "hinta": 40, "oikein": True}],
           tilausSelitys="Vuotava pumppu vaihdetaan, ja järjestelmään lisätään uutta jäähdytysnestettä."),
    ],
    kysymykset=[
        {"kysymys": "Miksi automekaanikko tekee testejä, ennen kuin hän vaihtaa osia?", "ammattilainen": "Automekaanikko",
         "tutkinto": "Ajoneuvoalan perustutkinto (automekaanikko)", "placeholder": "Testit tehdään ensin, koska…"},
        {"kysymys": "Miten kertoisit asiakkaalle, että korjaus maksaa enemmän kuin hän luuli?", "ammattilainen": "Huoltomyyjä",
         "tutkinto": "Ajoneuvoalan perustutkinto (huoltomyyjä)", "placeholder": "Sanoisin hänelle…"},
    ],
    ammattilaisetOtsikko="Autojen ja liikenteen ammatteja",
    ammattilaiset=[
        {"nimi": "Automekaanikko", "tehtava": "huoltaa ja korjaa autoja", "tutkinto": "Ajoneuvoalan perustutkinto (automekaanikko)"},
        {"nimi": "Autokorimekaanikko", "tehtava": "korjaa kolarissa vaurioituneita autoja", "tutkinto": "Ajoneuvoalan perustutkinto (autokorimekaanikko)"},
        {"nimi": "Huoltomyyjä", "tehtava": "palvelee korjaamon asiakkaita", "tutkinto": "Ajoneuvoalan perustutkinto (huoltomyyjä)"},
        {"nimi": "Yhdistelmäajoneuvonkuljettaja", "tehtava": "kuljettaa tavaraa rekalla", "tutkinto": "Logistiikan perustutkinto (yhdistelmäajoneuvonkuljettaja)"},
        {"nimi": "Linja-autonkuljettaja", "tehtava": "kuljettaa matkustajia bussilla", "tutkinto": "Logistiikan perustutkinto (linja-autonkuljettaja)"},
        {"nimi": "Veturinkuljettaja", "tehtava": "kuljettaa junia", "tutkinto": "Rautatieyhtiön koulutus aikuisena"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Seurasit lumimyräkkäpäivää liikennekeskuksesta ja korjasit itse kolme autoa. Samalla tutustuit autojen ja liikenteen ammatteihin."

OPPILAITOKSET = ("Missä autojen ja liikenteen aloja voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Autojen ja liikenteen koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Näitä aloja voi opiskella monessa ammattiopistossa eri puolilla Suomea. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Ajoneuvoala ja logistiikka</h3>
""" + kortti("Koulutuskeskus Salpaus, Lahti", "Ajoneuvoalan perustutkinto (automekaanikko) ja logistiikan perustutkinto (esimerkiksi linja-autonkuljettaja ja yhdistelmäajoneuvonkuljettaja).", "https://salpaus.fi")
    + kortti("Lapin ammattiopisto Redu, Rovaniemi", "Logistiikan perustutkinto: kuorma-autonkuljettaja, linja-autonkuljettaja tai yhdistelmäajoneuvonkuljettaja.", "https://redu.fi")
    + kortti("Turun ammatti-instituutti", "Ajoneuvoalan perustutkinto.", "https://www.turku.fi/tai")
    + kortti("Taitotalo, Helsinki", "Ajoneuvoalan ja logistiikan koulutuksia.", "https://www.taitotalo.fi")
    + kortti("Etsi lisää Opintopolusta", "Hae sanoilla ”ajoneuvoalan perustutkinto” tai ”logistiikan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=ajoneuvoalan%20perustutkinto")
    + """<h3>Myöhemmin aikuisena</h3>
<p>Veturinkuljettajat ja liikennekeskusten päivystäjät koulutetaan yleensä rautatie- tai liikenneyhtiön omassa koulutuksessa. Ajoneuvoalan insinööriksi voi opiskella ammattikorkeakoulussa.</p>
<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]
