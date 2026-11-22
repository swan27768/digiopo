# -*- coding: utf-8 -*-
"""Taide ja humanistinen ala – "Festarit 48 tunnissa" (sisältö).
Rakenna: python3 rakenna_tarina.py alat/taide.py <orig taide-ala.html> <uusi taide-ala.html>

Pelaaja on festivaalin tapahtumakoordinaattori. Tarina kestää festarin 48 tuntia
(pe klo 16 – su klo 18). Kohtauksilla on oma lisäaika (lisaaika), jolla yö ja
välitunnit kuluvat.

Loppuosan tehtävä on "Festarijuliste" (TEHTAVA tyyppi "juliste"): oppilas kirjoittaa
julisteen tiedot ja valitsee kuvan, värit, fontin ja asettelun. Esikatselu päivittyy
heti, ja tarkistuslista arvioi tiedot (mitä, milloin, missä, lisätieto), otsikon
pituuden ja tekstin kontrastin. Juliste ladataan kuvana. Lopuksi kaksi perustelua."""

ala = "taide"
alaNimi = "Taide ja humanistinen ala"
tarinaNimi = "Festarit 48 tunnissa"
maailma = "festari"
yleisKohtaus = "puisto"
katsoTeksti = "Katso festareita"
kello = {"alku": 16 * 60, "raja": 50 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Festarit päättyvät su klo 18.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Kesäyön hämärä: syvä violetti, persikan hehku ja pinkit valot
TEEMA = """:root {
  --a1: #ffb27a; --a1-rgb: 255,178,122;
  --a2: #ff7a8a; --a2-rgb: 255,122,138;
  --a3: #ffd9b8;
  --korostus: #ff7ab8; --korostus-rgb: 255,122,184;
  --tausta: #1d1a45; --tausta-rgb: 29,26,69;
  --tausta-2: #2a2458; --tausta-2-rgb: 42,36,88;
  --paneeli: #221e4f; --paneeli-rgb: 34,30,79;
  --paneeli-2: #2e2862;
  --tumma: #120f2e; --tumma-rgb: 18,15,46;
  --reuna: #ffb27a;
  --teksti-pehmea: #e2daf2; --teksti-pehmea-rgb: 226,218,242;
  --teksti-vaalea: #fbf8ff;
  --nappi-teksti: #2a0f14;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #ffe1c8;
  --kansi-nappi-varjo: #8a3a4a;
  --kansi-nappi-hehku: 255,150,140;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.94) 0%, rgba(var(--tausta-rgb),.78) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Taide ja humanistinen ala", otsikko="Taideala",
             alaotsikko="Festarit 48 tunnissa · Ketä kaikkia tarvitaan, kun kaupunki juhlii koko viikonlopun?",
             nappi="Avaa portit", ikoni="play")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet Kesäyön festareiden tapahtumakoordinaattori. Festarit kestävät 48 tuntia: on konsertteja, markkinat, pelitelta ja esityksiä. Miten sinä hoitaisit yllättävät tilanteet?",
            faktat=[("6", "ammattilaista"), ("48", "tuntia"), ("6000", "kävijää")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "taide-tanssi-tausta.webp",
               "alku": KUVA + "taide-markkinat-tausta.webp",
               "tehtava": KUVA + "taide-lava-tausta.webp",
               "kortti": KUVA + "taide-jarvi-tausta.webp",
               "loppu": [KUVA + "taide-jarvi-tausta.webp", KUVA + "taide-markkinat-tausta.webp", KUVA + "taide-pelit-tausta.webp", KUVA + "taide-pyro-tausta.webp", KUVA + "taide-lava-tausta.webp"],
               "oppilaitokset": [KUVA + "taide-markkinat-tausta.webp", KUVA + "taide-jarvi-tausta.webp", KUVA + "taide-pyro-tausta.webp"]}

TARINA_ALKU = dict(nimi="Festarit 48 tunnissa", tausta="puisto", teksti="""<<include "HUD">>
<h1>Festarit 48 tunnissa</h1>
<p>On perjantai, ja kello on 16.00. Olet Kesäyön festareiden tapahtumakoordinaattori. Sinä pidät huolen, että kaikki tietävät, mitä tehdä, ja ratkaiset yllättäviä tilanteita.</p>
<p>Rantapuistoon tulee viikonlopun aikana tuhansia ihmisiä. Ohjelmassa on konsertteja, markkinat, pelitelta, teatteria ja rantakonsertti.</p>
<p class="puhe"><strong>Kaisa, festivaalituottaja:</strong> ”Portit aukeavat kahden tunnin päästä. Mennään katsomaan, että kaikki on valmista!”</p>
<div class="intro-nappi"><<link "Mene portille">><<set $aika += 15>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Portti", tausta="portti", otsikko="Opasteet portilla", avain="graafinen",
      kysymys="Miltä graafisen suunnittelijan työ näytti?", lisaaika=60, siirtymaTeksti="Portit aukeavat kello 18.",
      johdanto="""<p>Portilla on jo jono. Graafinen suunnittelija Sini katsoo festarikarttaa ja kalpenee.</p>
<p>Kartassa pelitelta on merkitty rantaan, vaikka se on puiston toisella laidalla. Kartat on jo painettu.</p>
<p class="puhe"><strong>Sini, graafinen suunnittelija:</strong> ”Tuhat karttaa ja kaikissa sama virhe. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Tehdään korjaustarra ja liimataan se karttoihin ennen kuin portit aukeavat.", aika=45, piirteet={"tarkka": 2, "luova": 1},
            palaute="<p><strong>Nopea ja fiksu korjaus!</strong></p><p>Sini suunnittelee tarran, jossa on oikea paikka. Vapaaehtoiset liimaavat tarrat, ja kävijät löytävät pelitelttaan.</p>"),
       dict(teksti="Ei haittaa. Ihmiset kyllä löytävät perille.", aika=30, piirteet={},
            palaute="<p><strong>Väärä kartta hämmentää kävijöitä.</strong></p><p>Moni etsisi pelitelttaa rannasta. Sini tekee korjaustarran, ja vapaaehtoiset liimaavat sen karttoihin.</p>"),
       dict(teksti="Painetaan kaikki kartat uudelleen.", aika=60, piirteet={"tarkka": 1},
            palaute="<p><strong>Huolellista, mutta hidasta ja kallista.</strong></p><p>Uudet kartat eivät ehtisi ajoissa. Sini tekee korjaustarran, joka korjaa virheen heti.</p>"),
      ]),
 dict(nimi="Rantalava", tausta="lava", otsikko="Avajaiskonsertti", avain="musiikkiteknologi",
      taustakuva=KUVA + "taide-pyro-tausta.webp",
      kysymys="Miltä musiikkiteknologin työ näytti?", lisaaika=900, siirtymaTeksti="Yö kuluu. Seuraava tilanne on lauantaiaamuna.",
      johdanto="""<p>Avajaiskonsertti alkaa, ja yleisö tanssii. Puhelimesi soi.</p>
<p>Lähitalon asukas valittaa: musiikki kuuluu hänen olohuoneeseensa asti, ja hänen vauvansa ei saa unta.</p>
<p class="puhe"><strong>Joonas, musiikkiteknologi:</strong> ”Minä hoidan äänentoiston. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Tarkistetaan, että äänenvoimakkuus pysyy luvassa sovitussa rajassa. Käännetään kaiuttimet järvelle päin.", aika=60, piirteet={"vastuullinen": 2, "tarkka": 1},
            palaute="<p><strong>Hienoa yhteistyötä!</strong></p><p>Joonas mittaa äänen ja säätää kaiuttimia. Konsertti kuulostaa yhä hyvältä, ja lähitalossa on hiljaisempaa.</p>"),
       dict(teksti="Jatketaan samalla äänellä. Konsertti loppuu kuitenkin kello 22.", aika=60, piirteet={}, palaute="<p><strong>Ei käy.</strong></p><p>Festareilla on lupa, jossa on rajat äänenvoimakkuudelle. Raja pätee koko illan. Joonas mittaa äänen ja kääntää kaiuttimet järvelle päin.</p>"),
       dict(teksti="Lopetetaan konsertti.", aika=45, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Liian jyrkkää.</strong></p><p>Yleisö pettyisi, ja ongelman voi ratkaista muuten. Joonas säätää ääntä ja kaiuttimien suuntaa.</p>"),
      ]),
 dict(nimi="Infopiste", tausta="info", otsikko="Infopiste", avain="tulkki",
      kysymys="Miltä viittomakielen tulkin työ näytti?", lisaaika=195, siirtymaTeksti="Seuraava tilanne on iltapäivällä.",
      johdanto="""<p>Lauantaiaamuna infopisteeseen tulee perhe. Isä viittoo: hän on kuuro ja haluaisi nähdä iltapäivän teatteriesityksen.</p>
<p class="puhe"><strong>Laura, viittomakielen tulkki:</strong> ”Olen festareilla töissä koko päivän. Mitä ehdotat?”</p>""",
      valinnat=[
       dict(teksti="Laura tulkkaa esityksen. Varataan perheelle paikat edestä, mistä tulkin näkee hyvin.", aika=45, piirteet={"kohtaaja": 2, "vastuullinen": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Kun tulkki seisoo lavan vieressä ja paikat ovat edessä, perhe voi seurata esitystä kuten muutkin.</p>"),
       dict(teksti="Annetaan perheelle käsiohjelma, jossa on näytelmän juoni.", aika=30, piirteet={"kohtaaja": 1},
            palaute="<p><strong>Hyvä lisä, mutta ei riitä.</strong></p><p>Juonen voi lukea, mutta repliikit jäisivät kuulematta. Laura tulkkaa esityksen, ja perhe saa paikat edestä.</p>"),
       dict(teksti="Esitys on puhetta, joten ehdotetaan jotain muuta ohjelmaa.", aika=30, piirteet={},
            palaute="<p><strong>Kaikilla on oikeus kulttuuriin.</strong></p><p>Juuri siksi festareilla on tulkki. Laura tulkkaa esityksen, ja perhe saa paikat edestä.</p>"),
      ]),
 dict(nimi="Pelitelta", tausta="pelit", otsikko="Pelitelta", avain="media",
      taustakuva=KUVA + "taide-pelit-tausta.webp",
      kysymys="Miltä mediapalvelujen toteuttajan työ näytti?", lisaaika=240, siirtymaTeksti="Seuraava tilanne on lauantai-iltana.",
      johdanto="""<p>Pelitelttaan on tullut kymmeniä nuoria pelaamaan. Festarit näyttävät turnauksen suorana lähetyksenä netissä.</p>
<p class="puhe"><strong>Aaro, mediapalvelujen toteuttaja:</strong> ”Haluaisin kuvata pelaajia lähikuvina lähetykseen. Saako kaikkien kasvot näyttää?”</p>""",
      valinnat=[
       dict(teksti="Vain niiden, jotka ovat antaneet luvan. Alaikäisten kohdalla kysytään myös huoltajalta.", aika=60, piirteet={"vastuullinen": 2, "tarkka": 1},
            palaute="<p><strong>Vastuullinen valinta!</strong></p><p>Aaro kerää luvat ennen turnausta. Ne, jotka eivät halua näkyä, kuvataan selän takaa.</p>"),
       dict(teksti="Kaikkia saa kuvata, koska teltta on julkinen paikka.", aika=45, piirteet={},
            palaute="<p><strong>Ei ihan.</strong></p><p>Lähikuviin, jotka julkaistaan netissä, pitää kysyä lupa. Varsinkin lasten ja nuorten kohdalla. Aaro kerää luvat ensin.</p>"),
       dict(teksti="Kuvataan vain näyttöjä ja käsiä, ei kasvoja.", aika=45, piirteet={"luova": 2},
            palaute="<p><strong>Luova ratkaisu!</strong></p><p>Lähetys näyttää yhä hienolta. Kun joku antaa luvan, Aaro voi kuvata myös hänen kasvonsa.</p>"),
      ]),
 dict(nimi="Markkinat", tausta="markkinat", otsikko="Markkinailta", avain="artesaani",
      taustakuva=KUVA + "taide-markkinat-tausta.webp",
      kysymys="Miltä artesaanin työ näytti?", lisaaika=1260, siirtymaTeksti="Ilta ja yö kuluvat. Seuraava tilanne on sunnuntai-iltana.",
      johdanto="""<p>Lauantai-iltana markkinoilla on tungosta, ja valot syttyvät puihin.</p>
<p>Artesaani Pirjo pitää lasten savipajaa. Savi loppuu kesken, ja jonossa on vielä 20 lasta.</p>
<p class="puhe"><strong>Pirjo, artesaani:</strong> ”Mitä nyt keksitään?”</p>""",
      valinnat=[
       dict(teksti="Tehdään koruja ja pikkuveistoksia kierrätysmateriaaleista, joita kojuilla on.", aika=60, piirteet={"luova": 2, "kohtaaja": 1},
            palaute="<p><strong>Luovaa!</strong></p><p>Pirjo kerää kojuilta pahvia, kangassuikaleita ja nappeja. Lapset tekevät hienoja koruja, ja jono liikkuu.</p>"),
       dict(teksti="Suljetaan paja. Ei voi mitään.", aika=30, piirteet={},
            palaute="<p><strong>Lapset pettyisivät.</strong></p><p>Pirjo keksii uuden työn kierrätysmateriaaleista, ja paja jatkuu.</p>"),
       dict(teksti="Annetaan jokaiselle lapselle vain pieni nokare savea.", aika=45, piirteet={"kohtaaja": 1},
            palaute="<p><strong>Reilua, mutta…</strong></p><p>…pienestä nokareesta ei saa paljon tehtyä. Pirjo keksii lisäksi korutyön kierrätysmateriaaleista.</p>"),
      ]),
 dict(nimi="Rantakonsertti", tausta="jarvi", otsikko="Rantakonsertti", avain="muusikko",
      taustakuva=KUVA + "taide-jarvi-tausta.webp",
      kysymys="Miltä muusikon työ näytti?",
      johdanto="""<p>Festarit päättyvät rantakonserttiin. Sellisti Helmi ja viulisti Ville valmistautuvat soittamaan järven rannalla.</p>
<p>Taivaalle kertyy tummia pilviä, ja sääennuste lupaa sadekuuroa.</p>
<p class="puhe"><strong>Helmi, muusikko:</strong> ”Soittimet ovat puuta ja tosi arvokkaita. Jos ne kastuvat, ne voivat mennä rikki. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Siirretään konsertti laiturin katoksen alle ja kerrotaan siitä yleisölle.", aika=60, piirteet={"vastuullinen": 1, "luova": 1, "kohtaaja": 1},
            palaute="<p><strong>Täydellinen ratkaisu!</strong></p><p>Katoksen alla soittimet pysyvät kuivina. Yleisö seuraa konserttia rannalta sateenvarjojen alta.</p>"),
       dict(teksti="Soitetaan, mutta pidetään soittimet sateenvarjojen alla.", aika=60, piirteet={}, palaute="<p><strong>Liian riskialtista.</strong></p><p>Tuuli kuljettaa sadetta sateenvarjojen alle, ja kosteus voi haljoittaa puisen soittimen. Konsertti siirretään laiturin katoksen alle.</p>"),
       dict(teksti="Perutaan konsertti heti.", aika=45, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Liian aikaisin.</strong></p><p>Ehkä ei sada ollenkaan. Ja vaikka satoi, konsertti onnistuu laiturin katoksen alla.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Festarit päättyvät", teksti="""<h1>Festarit päättyvät</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>> sunnuntaina. Viimeinen sävel soi järven yllä, ja yleisö taputtaa.</p>
<p>48 tunnissa festareilla kävi yli 6000 ihmistä. <<if _taso is 0>>Kaikki sujui, koska moni ammattilainen teki työnsä hyvin.<<else>>Moni ammattilainen teki parhaansa, ja hekin oppivat virheistä.<</if>></p>
<p>Huomasitko? Festareilla tarvittiin monta taiteen ja humanistisen alan ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Sini, graafinen suunnittelija</strong> – korjasi festarikartan</li>
<li><strong>Joonas, musiikkiteknologi</strong> – hoiti äänentoiston</li>
<li><strong>Laura, viittomakielen tulkki</strong> – tulkkasi teatteriesityksen</li>
<li><strong>Aaro, mediapalvelujen toteuttaja</strong> – kuvasi turnauksen</li>
<li><strong>Pirjo, artesaani</strong> – piti lasten pajaa</li>
<li><strong>Helmi, muusikko</strong> – soitti päätöskonsertin</li>
</ul>
<p>Sinä olit tapahtumakoordinaattori. Moneen näistä töistä voi opiskella ammattikoulussa: media-alan, musiikkialan tai taideteollisuusalan perustutkinnossa. Tulkiksi ja kulttuurituottajaksi opiskellaan ammattikorkeakoulussa.</p>""")

PIIRTEET = {
 "luova": {"nimi": "Luova ratkaisija", "kuvaus": "Keksit uuden tavan, kun suunnitelma ei toimi."},
 "tarkka": {"nimi": "Tarkka", "kuvaus": "Huomaat virheet ja korjaat ne ajoissa."},
 "kohtaaja": {"nimi": "Ihmisten kohtaaja", "kuvaus": "Huomaat, mitä toinen tarvitsee, ja autat häntä."},
 "vastuullinen": {"nimi": "Vastuullinen", "kuvaus": "Mietit, miten päätöksesi vaikuttavat muihin."},
}

AMMATIT = {
 "graafinen": {"nimi": "Graafinen suunnittelija", "kuvaus": "Suunnittelee julisteita, kuvituksia, logoja ja opasteita.",
               "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto (kuvallisen ilmaisun toteuttaja)", "piirteet": ["luova", "tarkka"]},
 "musiikkiteknologi": {"nimi": "Musiikkiteknologi", "kuvaus": "Hoitaa konserttien ja tapahtumien äänentoistoa ja äänityksiä.",
                       "tutkinto": "Musiikkialan perustutkinto (musiikkiteknologi)", "piirteet": ["tarkka", "vastuullinen"]},
 "tulkki": {"nimi": "Viittomakielen tulkki", "kuvaus": "Tulkkaa puhetta viittomakielelle ja viittomakieltä puheeksi.",
            "tutkinto": "Viittomakielen tulkki (AMK), esimerkiksi Humak tai Diak", "piirteet": ["kohtaaja", "tarkka"]},
 "media": {"nimi": "Mediapalvelujen toteuttaja", "kuvaus": "Kuvaa, editoi ja tekee videoita ja suoria lähetyksiä.",
           "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto (mediapalvelujen toteuttaja)", "piirteet": ["vastuullinen", "luova"]},
 "artesaani": {"nimi": "Artesaani", "kuvaus": "Valmistaa käsityötuotteita ja ohjaa käsityöpajoja.",
               "tutkinto": "Taideteollisuusalan perustutkinto (artesaani)", "piirteet": ["luova", "kohtaaja"]},
 "muusikko": {"nimi": "Muusikko", "kuvaus": "Soittaa tai laulaa konserteissa, bändeissä ja orkestereissa.",
              "tutkinto": "Musiikkialan perustutkinto (muusikko)", "piirteet": ["luova", "vastuullinen"]},
}

KUTSU_JOHDANTO = "Festarit onnistuivat! Nyt suunnitellaan jo ensi kesää. Sinä teet festareille julisteen kuten graafinen suunnittelija."

TEHTAVA = dict(
    tyyppi="juliste",
    nimi="Festarijuliste", tag="Tehtävä · noin 25 min",
    maara="<strong>yhden julisteen</strong> ensi kesän festareille",
    ohjeAskelLause="Teet kolme asiaa:",
    askeleet=["Kirjoita julisteeseen tapahtuman tiedot.",
              "Valitse kuva, värit, fontti ja tekstien paikka. Juliste muuttuu heti.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Tarkistuslista kertoo, mitä julisteesta vielä puuttuu. Voit ladata julisteen kuvana. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Julisteesi",
    osa1="Osa 1/2 · Juliste", osa2="Osa 2/2 · Perustelut",
    tilanneOtsikko="Tilaus festareilta",
    ohje="Ensi kesän festarit tarvitsevat julisteen. Kirjoita siihen alla olevat tiedot ja valitse kuva, värit ja fontti. Juliste päivittyy heti.",
    faktat=[("Tapahtuma", "Kesäyön festarit"), ("Milloin", "11.–13.6.2027"), ("Missä", "Rantapuisto"), ("Hinta", "Vapaa pääsy")],
    saannotOtsikko="Graafikon tarkistuslista",
    tarkistaNappi="Tarkista juliste", jatkaNappi="Jatka perusteluihin", takaisinNappi="Muokkaa julistetta", valmisNappi="Katso tulos", lataaNappi="Lataa juliste kuvana",
    perusteluOtsikko="Upea juliste!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="JULISTE · KESÄYÖN FESTARIT",
    palaute=["Huippujuliste! Kaikki tärkeä on mukana, ja teksti erottuu hyvin.",
             "Hyvä juliste! Pari asiaa vielä, niin se olisi valmis painoon.",
             "Hyvä alku! Katso tarkistuslistan selitykset: niistä näet, mitä julisteeseen vielä tarvitaan."],
    kuvat=[{"avain": "jarvi", "nimi": "Rantakonsertti", "src": KUVA + "taide-jarvi.webp"},
           {"avain": "markkinat", "nimi": "Markkinailta", "src": KUVA + "taide-markkinat.webp"},
           {"avain": "pelit", "nimi": "Pelitelta", "src": KUVA + "taide-pelit.webp"},
           {"avain": "lava", "nimi": "Päälava", "src": KUVA + "taide-lava.webp"},
           {"avain": "pyro", "nimi": "Tulishow", "src": KUVA + "taide-pyro.webp"}],
    varit=[{"avain": "kesayo", "nimi": "Kesäyö", "tausta": "#1d1a45", "teksti": "#ffd98a", "korostus": "#ff7ab8"},
           {"avain": "auringonlasku", "nimi": "Auringonlasku", "tausta": "#ff9a6b", "teksti": "#ffffff", "korostus": "#1d1a45"},
           {"avain": "metsa", "nimi": "Metsä", "tausta": "#123a2c", "teksti": "#eafff4", "korostus": "#ffd98a"},
           {"avain": "pastelli", "nimi": "Pastelli", "tausta": "#f6d7e8", "teksti": "#fff3a0", "korostus": "#8b5cf6"},
           {"avain": "neon", "nimi": "Neon", "tausta": "#0b0b12", "teksti": "#39ff88", "korostus": "#ff5fa2"}],
    fontit=[{"avain": "selkea", "nimi": "Selkeä", "css": "'Segoe UI', Arial, sans-serif", "paino": 900, "isot": True},
            {"avain": "juhla", "nimi": "Juhlava", "css": "Georgia, 'Times New Roman', serif", "paino": 700, "tyyli": "italic"},
            {"avain": "kasi", "nimi": "Käsiala", "css": "'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive", "paino": 400},
            {"avain": "leveä", "nimi": "Iso ja leveä", "css": "Impact, 'Arial Black', sans-serif", "paino": 400, "isot": True}],
    asettelut=[{"avain": "yla", "nimi": "Ylhäällä"}, {"avain": "keski", "nimi": "Keskellä"}, {"avain": "ala", "nimi": "Alhaalla"}],
    kysymykset=[
        {"kysymys": "Miksi valitsit juuri tämän kuvan ja nämä värit?", "ammattilainen": "Graafinen suunnittelija",
         "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto (kuvallisen ilmaisun toteuttaja)", "placeholder": "Valitsin tämän kuvan, koska…"},
        {"kysymys": "Kenelle juliste on suunnattu? Miten se näkyy julisteessa?", "ammattilainen": "Kulttuurituottaja",
         "tutkinto": "Kulttuurituottaja (AMK)", "placeholder": "Juliste on suunnattu…"},
    ],
    ammattilaisetOtsikko="Näissä töissä tehdään festareita ja julisteita",
    ammattilaiset=[
        {"nimi": "Graafinen suunnittelija", "tehtava": "suunnittelee julisteet, logot ja opasteet", "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto, jatkossa esimerkiksi muotoilija (AMK)"},
        {"nimi": "Kulttuurituottaja", "tehtava": "suunnittelee ja johtaa tapahtumia ja festareita", "tutkinto": "Kulttuurituottaja (AMK), esimerkiksi Humak tai Metropolia"},
        {"nimi": "Mediapalvelujen toteuttaja", "tehtava": "tekee festareiden videot ja somepäivitykset", "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto"},
        {"nimi": "Valokuvaaja", "tehtava": "ottaa kuvat julisteisiin ja nettiin", "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Hoidit festareiden yllättävät tilanteet 48 tunnissa ja teit julisteen ensi kesän festareille. Samalla tutustuit taiteen ja humanistisen alan ammatteihin."

OPPILAITOKSET = ("Missä taidealaa voi opiskella?", "Oppilaitokset")
SAILYTA = ["Oppilaitokset"]
SAILYTA_KORVAUKSET = []

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Portti": "Kartan korjaaminen vei aikaa. Ensimmäiset kävijät etsivät pelitelttaa rannasta.",
    "Rantalava": "Naapuri soitti valituksen myös kaupungille. Ensi vuonna äänirajoja valvotaan tarkemmin.",
    "Infopiste": "Kuuro perhe ehti pettyä, ennen kuin heille järjestettiin tulkki.",
    "Pelitelta": "Osa kuvista piti poistaa lähetyksestä, koska lupia ei ollut kysytty.",
    "Markkinat": "Jonossa olleet lapset pettyivät hetkeksi, ennen kuin uusi työ keksittiin.",
    "Rantakonsertti": "Soittajat hätääntyivät. Konsertti alkoi myöhässä katoksen alla.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>> sunnuntaina. Viimeinen sävel soi järven yllä, ja yleisö taputtaa. Festarit onnistuivat!",
    "Kello on <<print setup.kello($aika)>> sunnuntaina. Viimeinen sävel soi järven yllä. Festarit onnistuivat, mutta palautteessa on pari moitetta.",
    "Kello on <<print setup.kello($aika)>> sunnuntaina. Festarit päättyvät, mutta viikonloppuna meni moni asia pieleen. Ensi vuoden festarit ovat vaakalaudalla.",
]
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
