# -*- coding: utf-8 -*-
"""IT-ala – "Julkaisupäivä" (sisältö).
Rakenna: python3 rakenna_tarina.py alat/it.py <orig it-ala.html> <uusi it-ala.html>

Loppuosan tehtävä on Tietoturvatarkastus (ei "Kenet kutsut paikalle?"):
oppilas päättää 8 asiasta, onko se turvallinen vai riski, ja perustelee.
Jokaisen kortin jälkeen näytetään, kuka IT-alan ammattilainen hoitaa asiaa."""

ala = "it"
alaNimi = "IT-ala"
tarinaNimi = "Julkaisupäivä"
maailma = "it"
yleisKohtaus = "studio"
katsoTeksti = "Katso studiota"
kello = {"alku": 8 * 60, "raja": 240}
aikaRivi = "Peli oli valmis julkaisuun kello"
siirtyma = 15
siirtymaTeksti = "Seuraavaan tehtävään siirtyminen vie 15 min."
kutsuTilanneOtsikko = "Tarkastettava"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Julkaisu klo 12.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

TEEMA = """:root {
  --a1: #c4b1ff; --a1-rgb: 196,177,255;
  --a2: #8f6bff; --a2-rgb: 143,107,255;
  --a3: #d6c9ff;
  --korostus: #ff9bd2; --korostus-rgb: 255,155,210;
  --tausta: #110c22; --tausta-rgb: 17,12,34;
  --tausta-2: #1d1638; --tausta-2-rgb: 29,22,56;
  --paneeli: #17112e; --paneeli-rgb: 23,17,46;
  --paneeli-2: #221a44;
  --tumma: #0a0716; --tumma-rgb: 10,7,22;
  --reuna: #9b7bff;
  --teksti-pehmea: #d9d0ff; --teksti-pehmea-rgb: 217,208,255;
  --teksti-vaalea: #f3efff;
  --nappi-teksti: #160a33;
}"""

KANSI = dict(pieni="Tieto- ja viestintätekniikka", otsikko="IT-ala",
             alaotsikko="Julkaisupäivä · Saadaanko uusi peli julkaistua kello 12?",
             nappi="Aloita peli", ikoni="play")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet pelistudion tuottaja. Sinä vastaat siitä, että studion uusi mobiilipeli julkaistaan tänään kello 12. Aamulla kaikki ei kuitenkaan mene putkeen. Miten sinä toimisit?",
            faktat=[("6", "ammattilaista"), ("4", "tuntia aikaa"), ("1", "oma ammattikortti")])

TARINA_ALKU = dict(nimi="Julkaisupäivä", tausta="studio", teksti="""<<include "HUD">>
<h1>Julkaisupäivä</h1>
<p>Kello on 8.00. Olet Pikselipaja-pelistudion tuottaja. Sinä pidät langat käsissäsi julkaisupäivänä. Seinän isolla näytöllä lukee: <strong>Kettu kiertoradalla – julkaisu klo 12.00</strong>.</p>
<p>Peliä on tehty puolitoista vuotta. Tänään se tulee sovelluskauppoihin, ja tuhannet pelaajat odottavat.</p>
<p class="puhe"><strong>Studion johtaja Iida:</strong> ”Huomenta, tuottaja! Tänään et pääse helpolla. Testaajan pöydältä kuuluu huolestunutta puhetta. Mene katsomaan.”</p>
<div class="intro-nappi"><<link "Mene testaajan luo">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Testaus", tausta="testaus", otsikko="Testaus", avain="testaaja",
      kysymys="Miltä ohjelmistotestaajan työ näytti?",
      johdanto="""<p>Testaaja Emma on pelannut peliä kymmenellä eri puhelimella. Yhdellä vanhalla puhelimella peli kaatuu, kun painaa taukonappia.</p>
<p class="puhe"><strong>Emma, ohjelmistotestaaja:</strong> ”Tämä pitää kertoa koodarille. Miten kertoisit bugista?”</p>
<p class="pieni">Bugi = virhe ohjelmassa.</p>""",
      valinnat=[
       dict(teksti="Kirjoitan tarkasti: mikä puhelin, mitä painoin ja mitä tapahtui.", aika=10, piirteet={"tarkka": 2},
            palaute="<p><strong>Juuri näin!</strong></p><p>Tätä kutsutaan bugiraportiksi. Kun koodari tietää tarkalleen, miten virhe syntyy, hän löytää sen nopeasti.</p>"),
       dict(teksti="Lähetän koodarille viestin: peli kaatuu, korjaa pian.", tyyli="nopea", aika=20, piirteet={}, palaute="<p><strong>Koodari ei tiedä, mistä aloittaa.</strong></p><p>Peli toimii hänen koneellaan. Kestää kauan ennen kuin virhe löytyy.</p><p>Emma kirjoittaa bugiraportin: mikä puhelin, mitä painettiin ja mitä tapahtui. Sitten vika löytyy.</p>"),
       dict(teksti="Jätän asian. Vanhoja puhelimia on vähän.", tyyli="luottavainen", aika=10, piirteet={},
            palaute="<p><strong>Moni pelaaja käyttää vanhaa puhelinta.</strong></p><p>Jos peli kaatuu heti julkaisupäivänä, pelaajat antavat huonoja arvosteluja.</p><p>Emma kirjoittaa bugiraportin ja vie sen koodarille.</p>"),
      ]),
 dict(nimi="Koodi", tausta="koodi", otsikko="Koodarin pöytä", avain="koodari",
      kysymys="Miltä ohjelmistokehittäjän työ näytti?",
      johdanto="""<p>Koodari Onni lukee Emman raportin ja löytää virheen koodista. Hän kirjoittaa korjauksen.</p>
<p class="puhe"><strong>Onni, ohjelmistokehittäjä:</strong> ”Korjaus on valmis. Aikaa on vähän. Laitetaanko se suoraan peliin?”</p>""",
      valinnat=[
       dict(teksti="Laitetaan heti. Aikaa on vähän.", tyyli="nopea", aika=20, piirteet={},
            palaute="<p><strong>Hups! Korjaus rikkoi pelin äänet.</strong></p><p>Uusi koodi voi vaikuttaa muihin kohtiin. Onni joutuu perumaan muutoksen ja korjaamaan sen uudelleen.</p><p>Siksi korjaus testataan aina ennen kuin se lisätään peliin.</p>"),
       dict(teksti="Testataan korjaus ensin.", aika=10, piirteet={"tarkka": 2, "ongelma": 1},
            palaute="<p><strong>Hyvä veto!</strong></p><p>Testissä huomataan, että korjaus rikkoi pelin äänet. Onni korjaa senkin. Nyt kaikki toimii.</p><p>Hyvä koodari tarkistaa työnsä, vaikka olisi kiire.</p>"),
       dict(teksti="Pyydetään toista koodaria katsomaan koodi.", aika=15, piirteet={"tiimi": 2},
            palaute="<p><strong>Fiksua!</strong></p><p>Toinen koodari huomaa, että korjaus rikkoisi pelin äänet. Onni korjaa senkin.</p><p>Tätä kutsutaan koodikatselmoinniksi. Kaksi silmäparia huomaa enemmän kuin yksi.</p>"),
      ]),
 dict(nimi="Pelitestaus", tausta="ux", otsikko="Pelitestaus", avain="ux",
      kysymys="Miltä UX-suunnittelijan työ näytti?",
      johdanto="""<p>Studion sohvalla istuu viisi seitsemäsluokkalaista. He testaavat peliä. Kukaan ei löydä nappia, josta peli alkaa.</p>
<p class="puhe"><strong>Aada, UX-suunnittelija:</strong> ”Minä suunnittelen, miten peliä käytetään. Mitä tehdään, kun pelaajat eivät löydä nappia?”</p>
<p class="pieni">UX = käyttäjäkokemus. Se tarkoittaa, miltä jonkin käyttäminen tuntuu.</p>""",
      valinnat=[
       dict(teksti="Kirjoitetaan ruudulle pitkä ohje.", tyyli="kaytannollinen", aika=15, piirteet={},
            palaute="<p><strong>Kukaan ei lue pitkää ohjetta.</strong></p><p>Testaajat ohittavat tekstin heti. Hyvä peli on niin selkeä, ettei ohjetta tarvita.</p><p>Aada tekee napista isomman ja siirtää sen keskelle ruutua.</p>"),
       dict(teksti="Tehdään napista isompi ja selkeämpi.", aika=10, piirteet={"kayttaja": 2},
            palaute="<p><strong>Toimii!</strong></p><p>Aada tekee napista isomman ja kirkkaamman. Nyt kaikki viisi löytävät sen heti.</p><p>Kun ajattelee pelaajan puolelta, peliä on helppo käyttää.</p>"),
       dict(teksti="Kysytään pelaajilta, mistä he etsivät nappia.", aika=15, piirteet={"kayttaja": 2, "tiimi": 1},
            palaute="<p><strong>Loistava idea!</strong></p><p>Pelaajat näyttävät, että he etsivät nappia ruudun alareunasta. Aada siirtää napin sinne. Nyt kaikki löytävät sen heti.</p><p>Paras tieto tulee käyttäjiltä itseltään.</p>"),
      ]),
 dict(nimi="Konesali", tausta="verkko", otsikko="Konesali", avain="verkko",
      kysymys="Miltä tietoverkkoasentajan työ näytti?",
      johdanto="""<p>Peli pitäisi lähettää sovelluskauppaan, mutta studion netti pätkii. Konesalin kaapissa vilkkuu oranssi valo.</p>
<p class="puhe"><strong>Mikael, tietoverkkoasentaja:</strong> ”Jossain on vika. Miten lähtisit etsimään sitä?”</p>""",
      valinnat=[
       dict(teksti="Käynnistetään kaikki laitteet uudelleen yhtä aikaa.", tyyli="nopea", aika=20, piirteet={},
            palaute="<p><strong>Kaikkien työt katkeavat.</strong></p><p>Netti toimii hetken, mutta vika palaa. Syy ei löytynyt.</p><p>Mikael tarkistaa laitteet yksi kerrallaan. Kytkimestä löytyy löysä kaapeli.</p>"),
       dict(teksti="Tarkistetaan järjestyksessä: kaapelit, laitteet ja valot.", aika=10, piirteet={"ongelma": 2, "tarkka": 1},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Kytkimestä löytyy löysä kaapeli. Mikael vaihtaa sen, ja valo muuttuu vihreäksi.</p><p>Kun vikaa etsii askel kerrallaan, syy löytyy nopeasti.</p>"),
       dict(teksti="Ostetaan uusi reititin.", tyyli="kaytannollinen", aika=20, piirteet={},
            palaute="<p><strong>Kallis ratkaisu, eikä vika ollut reitittimessä.</strong></p><p>Mikael tarkistaa laitteet yksi kerrallaan. Kytkimestä löytyy löysä kaapeli. Uutta laitetta ei tarvittu.</p>"),
      ]),
 dict(nimi="Epäilyttävä viesti", tausta="tietoturva", otsikko="Epäilyttävä viesti", avain="tietoturva",
      kysymys="Miltä tietoturva-asiantuntijan työ näytti?",
      johdanto="""<p>Onnin sähköpostiin tulee viesti: ”Sovelluskauppa: julkaisunne on pysäytetty. Kirjaudu heti tästä linkistä, tai peliä ei julkaista tänään.”</p>
<p>Onni on jo klikkaamassa. Kiire on kova.</p>
<p class="puhe"><strong>Leila, tietoturva-asiantuntija:</strong> ”Odota hetki! Mitä tekisit tälle viestille?”</p>""",
      valinnat=[
       dict(teksti="Klikataan linkkiä. Julkaisu ei saa myöhästyä.", tyyli="nopea", aika=20, piirteet={},
            palaute="<p><strong>Linkki vie huijaussivulle.</strong></p><p>Onni ehtii kirjoittaa salasanansa. Leila vaihtaa salasanan heti ja tarkistaa, ettei kukaan päässyt tilille.</p><p>Huijarit käyttävät kiirettä hyväkseen. Siksi kiireessä kannattaa pysähtyä.</p>"),
       dict(teksti="Näytän viestin Leilalle ennen kuin kukaan klikkaa.", aika=10, piirteet={"tarkka": 2, "tiimi": 1},
            palaute="<p><strong>Hienosti toimittu!</strong></p><p>Leila tarkistaa lähettäjän osoitteen. Se on väärä. Viesti on huijaus.</p><p>Leila varoittaa myös muita, ettei kukaan klikkaa linkkiä.</p>"),
       dict(teksti="Poistan viestin heti.", tyyli="varovainen", aika=10, piirteet={"tarkka": 1},
            palaute="<p><strong>Hyvä, ettet klikannut!</strong></p><p>Sama viesti tuli kuitenkin muillekin. Leila pyytää, että epäilyttävät viestit näytetään hänelle. Silloin hän voi varoittaa koko tiimiä.</p>"),
      ]),
 dict(nimi="Asiakastuki", tausta="tuki", otsikko="Asiakastuki", avain="tuki",
      kysymys="Miltä IT-tukihenkilön työ näytti?",
      johdanto="""<p>Peli on jo ladattavissa ennakkoon. Tukipuhelimeen soittaa 68-vuotias Veikko. Hän haluaa pelata peliä lapsenlapsensa kanssa, mutta peli ei asennu hänen tablettiinsa.</p>
<p class="puhe"><strong>Juho, IT-tukihenkilö:</strong> ”Haluatko auttaa Veikkoa? Miten neuvoisit?”</p>""",
      valinnat=[
       dict(teksti="Lähetän Veikolle linkin pitkään ohjesivuun.", tyyli="kaytannollinen", aika=10, piirteet={},
            palaute="<p><strong>Veikko eksyy ohjesivulle.</strong></p><p>Hän soittaa uudelleen. Juho neuvoo häntä puhelimessa askel kerrallaan.</p><p>Syy löytyy: tabletin muisti on täynnä. Kun vanhoja kuvia siirretään pilveen, peli asentuu.</p>"),
       dict(teksti="Neuvon askel kerrallaan ja kysyn, mitä Veikko näkee ruudulla.", aika=15, piirteet={"kayttaja": 2, "ongelma": 1},
            palaute="<p><strong>Hyvää palvelua!</strong></p><p>Veikko kertoo, mitä ruudulla lukee. Syy löytyy: tabletin muisti on täynnä. Kun vanhoja kuvia siirretään pilveen, peli asentuu.</p><p>Veikko kiittää. Hän pääsee pelaamaan lapsenlapsensa kanssa.</p>"),
       dict(teksti="Sanon, että tabletti on varmasti liian vanha.", tyyli="suora", aika=5, piirteet={},
            palaute="<p><strong>Arvaus meni pieleen.</strong></p><p>Juho tarkistaa asian. Tabletti on tarpeeksi uusi, mutta sen muisti on täynnä. Kun vanhoja kuvia siirretään pilveen, peli asentuu.</p><p>Ennen kuin vastaa, kannattaa selvittää syy.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Peli julkaistu", teksti="""<h1>Julkaisupäivän ilta</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Kettu kiertoradalla on valmis. Kello 12.00 Iida painaa julkaisunappia, ja peli ilmestyy sovelluskauppoihin!</p>
<<if _taso is 0>><p>Ensimmäisen tunnin aikana peli ladataan 10 000 kertaa.</p><</if>>
<p>Huomasitko? Yhden pelin julkaisuun tarvittiin kuusi eri ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Emma, ohjelmistotestaaja</strong> – löysi bugin ja kuvasi sen tarkasti</li>
<li><strong>Onni, ohjelmistokehittäjä</strong> – korjasi koodin</li>
<li><strong>Aada, UX-suunnittelija</strong> – teki pelistä helpon käyttää</li>
<li><strong>Mikael, tietoverkkoasentaja</strong> – sai netin toimimaan</li>
<li><strong>Leila, tietoturva-asiantuntija</strong> – pysäytti huijauksen</li>
<li><strong>Juho, IT-tukihenkilö</strong> – auttoi pelaajaa</li>
</ul>
<p>Ohjelmistokehittäjäksi, tietoverkkoasentajaksi ja IT-tukihenkilöksi voi opiskella ammattikoulussa. Moni jatkaa sen jälkeen ammattikorkeakouluun.</p>""")

PIIRTEET = {
 "ongelma": {"nimi": "Ongelmanratkaisija", "kuvaus": "Etsit vian syyn askel kerrallaan."},
 "tarkka": {"nimi": "Tarkka", "kuvaus": "Huomaat pienetkin asiat ja tarkistat ennen kuin toimit."},
 "kayttaja": {"nimi": "Käyttäjän puolella", "kuvaus": "Mietit, miten muut ihmiset käyttävät tekemääsi."},
 "tiimi": {"nimi": "Tiimipelaaja", "kuvaus": "Kerrot havainnoistasi ja pyydät apua oikealta ihmiseltä."},
}

TVT = "Tieto- ja viestintätekniikan perustutkinto"
AMMATIT = {
 "testaaja": {"nimi": "Ohjelmistotestaaja", "kuvaus": "Etsii peleistä ja sovelluksista virheet ennen kuin käyttäjät löytävät ne.",
              "tutkinto": TVT + " (ohjelmistokehittäjä). Jatkossa esimerkiksi tradenomi tai insinööri (AMK)", "piirteet": ["tarkka", "ongelma"]},
 "koodari": {"nimi": "Ohjelmistokehittäjä", "kuvaus": "Kirjoittaa koodia, josta pelit, sovellukset ja nettisivut syntyvät.",
             "tutkinto": TVT + " (ohjelmistokehittäjä). Jatkossa esimerkiksi insinööri (AMK)", "piirteet": ["ongelma", "tarkka"]},
 "ux": {"nimi": "UX-suunnittelija", "kuvaus": "Suunnittelee, miten peliä tai sovellusta käytetään, ja tekee siitä helppoa.",
        "tutkinto": "Esimerkiksi medianomi, tradenomi tai insinööri (AMK)", "piirteet": ["kayttaja", "tiimi"]},
 "verkko": {"nimi": "Tietoverkkoasentaja", "kuvaus": "Rakentaa ja korjaa verkkoja, joiden kautta netti kulkee.",
            "tutkinto": TVT + " (tietoverkkoasentaja)", "piirteet": ["ongelma", "tarkka"]},
 "tietoturva": {"nimi": "Tietoturva-asiantuntija", "kuvaus": "Suojaa laitteita, tietoja ja ihmisiä huijauksilta ja hyökkäyksiltä.",
                "tutkinto": "Esimerkiksi insinööri tai tradenomi (AMK). Pohjaksi sopii amiksen IT-tutkinto", "piirteet": ["tarkka", "tiimi"]},
 "tuki": {"nimi": "IT-tukihenkilö", "kuvaus": "Auttaa ihmisiä, kun laite tai ohjelma ei toimi.",
          "tutkinto": TVT + " (IT-tukihenkilö)", "piirteet": ["kayttaja", "ongelma"]},
}

KUTSU_JOHDANTO = "Tarinassa Leila pysäytti huijausviestin ennen kuin kukaan klikkasi. Nyt on sinun vuorosi. Tarkasta asioita, joita voit kohdata myös omassa puhelimessasi."

TEHTAVA = dict(
    nimi="Tietoturvatarkastus", tag="Tehtävä · noin 25 min",
    maara="<strong>8 tarkastettavaa asiaa</strong>",
    askeleet=["Päätä, onko asia turvallinen vai riski.", "Kirjoita yhdellä lauseella, miksi ajattelet niin."],
    lopuksi="Sitten näet, osuitko oikeaan ja kuka IT-alan ammattilainen hoitaa tällaisia asioita työkseen. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    kysymys="Onko tämä turvallinen vai riski?", korttiSana="Tarkastus", seuraava="Seuraava tarkastus",
    miksiLabel="Miksi? Kirjoita yksi lause.", placeholder="Mielestäni tämä on …, koska…",
    vihjeValitse="Valitse: turvallinen vai riski.", vihjeAlku="Valitse vaihtoehto ja kirjoita perustelu.",
    sekoita=False, etiketit={"Turvallinen": "✓ Turvallinen", "Riski": "⚠ Riski"},
    palaute=["Huippua! Sinulla on tarkka silmä tietoturvalle.",
             "Hyvä! Huomasit jo monta riskiä.",
             "Nyt tunnistat huijauksia paljon paremmin kuin äsken. Juuri sitä varten tehtävä on."],
    ammattilainenTeksti="Työssä tätä hoitaa",
)

KUTSU_KORTIT = [
 {"tilanne": "Pelistudion sähköpostiin tulee viesti, joka pyytää vahvistamaan salasanan linkin kautta.",
  "nakyma": '<div class="tk-viesti"><p class="tk-lahettaja">Lähettäjä: tuki@sovelluskauppa-varmistus.net</p><p class="tk-aihe">KIIREELLINEN: Tilisi suljetaan!</p><p>Tilisi suljetaan 24 tunnin kuluttua. Vahvista salasanasi heti:</p><p class="tk-linkki">sovelluskauppa-varmistus.net/kirjaudu</p></div>',
  "oikea": "Riski", "ammattilainen": "Tietoturva-asiantuntija", "tutkinto": "Esimerkiksi insinööri tai tradenomi (AMK)",
  "vaihtoehdot": {
   "Turvallinen": "Viesti näyttää viralliselta, mutta se on huijaus.",
   "Riski": "Tämä on huijausviesti. Lähettäjän osoite on outo, viesti kiirehtii ja pyytää salasanaa. Oikea palvelu ei kysy salasanaa sähköpostilla."}},
 {"tilanne": "Kirjaudut peliin. Salasanan jälkeen peli pyytää vielä koodin, joka tuli juuri puhelimeesi.",
  "nakyma": '<div class="tk-puhelin"><p class="tk-ilmo">Tekstiviesti · Pikselipaja</p><p>Kirjautumiskoodisi on <strong>482 913</strong>. Älä kerro koodia kenellekään.</p></div>',
  "oikea": "Turvallinen", "ammattilainen": "IT-tukihenkilö", "tutkinto": TVT + " (IT-tukihenkilö)",
  "vaihtoehdot": {
   "Turvallinen": "Tämä on kaksivaiheinen tunnistautuminen. Vaikka joku saisi salasanasi, hän ei pääse tilillesi ilman puhelintasi. Jos koodi tulee, vaikka et itse kirjaudu, se on varoitusmerkki.",
   "Riski": "Varovaisuus on hyvä, mutta tämä on turvallista: pyysit koodin itse juuri nyt."}},
 {"tilanne": "Asennat uuden taskulamppusovelluksen. Se pyytää luvan sijaintiin, yhteystietoihin ja mikrofoniin.",
  "nakyma": '<ul class="tk-luvat"><li>📍 Sijainti, aina</li><li>📇 Yhteystiedot</li><li>🎙️ Mikrofoni</li><li>🔦 Taskulamppu</li></ul>',
  "oikea": "Riski", "ammattilainen": "Tietosuoja-asiantuntija", "tutkinto": "Esimerkiksi tradenomi (AMK) tai yliopisto",
  "vaihtoehdot": {
   "Turvallinen": "Sovellus näyttää harmittomalta, mutta se pyytää paljon enemmän kuin tarvitsee.",
   "Riski": "Taskulamppu tarvitsee vain luvan valoon. Sijaintia, yhteystietoja ja mikrofonia se ei tarvitse. Sovellus voi kerätä tietojasi ja myydä niitä eteenpäin."}},
 {"tilanne": "Teet uuden pelitilin. Keksit salasanaksi kettu2026.",
  "nakyma": '<div class="tk-salasana"><span class="tk-kentta">kettu2026</span></div>',
  "oikea": "Riski", "ammattilainen": "Ohjelmistokehittäjä", "tutkinto": TVT + " (ohjelmistokehittäjä)",
  "vaihtoehdot": {
   "Turvallinen": "Salasana on helppo muistaa, mutta myös helppo arvata.",
   "Riski": "Salasana on lyhyt, ja siinä on vain sana ja vuosiluku. Pitkä lause on parempi, esimerkiksi Kolme-kettua-hyppii-kuussa! Koodari voi tehdä palveluun säännön, joka estää liian heikot salasanat."}},
 {"tilanne": "Puhelimen sovelluskauppa ilmoittaa päivityksestä.",
  "nakyma": '<div class="tk-puhelin"><p class="tk-ilmo">Sovelluskauppa · Päivitykset</p><p><strong>Bussiopas</strong> · Seutuliikenne<br>Versio 2.4.1: korjattu virhe, jossa aikataulut eivät päivittyneet.</p></div>',
  "oikea": "Turvallinen", "ammattilainen": "Ohjelmistotestaaja", "tutkinto": TVT + " (ohjelmistokehittäjä)",
  "vaihtoehdot": {
   "Turvallinen": "Päivitys tulee virallisesta sovelluskaupasta ja oikealta tekijältä. Päivitykset korjaavat vikoja ja tietoturva-aukkoja, joten ne kannattaa asentaa. Testaaja on tarkistanut päivityksen ennen julkaisua.",
   "Riski": "Varovaisuus on hyvä, mutta tämä päivitys tulee virallisesta sovelluskaupasta ja oikealta tekijältä."}},
 {"tilanne": "Olet kahvilassa ja haluat ostaa pelin lisäosan pankkikortilla. Puhelin löytää avoimen wifin, jossa ei ole salasanaa.",
  "nakyma": '<div class="tk-puhelin"><p class="tk-ilmo">Wi-Fi-verkot</p><p>📶 <strong>Kahvila_ILMAINEN_wifi</strong><br>Avoin verkko, ei salasanaa</p></div>',
  "oikea": "Riski", "ammattilainen": "Tietoverkkoasentaja", "tutkinto": TVT + " (tietoverkkoasentaja)",
  "vaihtoehdot": {
   "Turvallinen": "Ilmainen netti on kätevä, mutta maksaminen avoimessa verkossa on riski.",
   "Riski": "Avoimessa verkossa joku voi seurata liikennettä tai tehdä samannimisen huijausverkon. Maksut kannattaa tehdä omalla mobiilidatalla."}},
 {"tilanne": "Pelin chatissa tuntematon pelaaja pyytää tunnuksiasi. Hän lupaa nostaa tasoasi ilmaiseksi.",
  "nakyma": '<div class="tk-chat"><p class="tk-nimi">ProGamer_99</p><p class="tk-kupla">moi! anna tunnukset ni nostan sun tason 50:een ilmaseks 😎</p></div>',
  "oikea": "Riski", "ammattilainen": "Moderaattori eli sisällönvalvoja", "tutkinto": "Ei omaa tutkintoa. Moni tulee alalle esimerkiksi IT-tuen tai asiakaspalvelun kautta",
  "vaihtoehdot": {
   "Turvallinen": "Tarjous kuulostaa hyvältä, mutta se on yleinen huijaus.",
   "Riski": "Tunnuksia ei anneta kenellekään. Tilin voi menettää, ja sillä voidaan huijata kavereitasi. Ilmoita viestistä pelin moderaattorille."}},
 {"tilanne": "Pelistudiossa kaikki tiedostot kopioidaan joka yö kahteen paikkaan.",
  "nakyma": '<div class="tk-puhelin"><p class="tk-ilmo">Varmuuskopio</p><p>✅ Valmis klo 03.00<br>Kopio 1: pilvipalvelu · Kopio 2: erillinen levy</p></div>',
  "oikea": "Turvallinen", "ammattilainen": "Järjestelmäasiantuntija", "tutkinto": "Esimerkiksi insinööri (AMK). Alkuun pääsee amiksen IT-tutkinnolla",
  "vaihtoehdot": {
   "Turvallinen": "Kun tiedostoista on kopio kahdessa paikassa, mitään ei menetetä, vaikka kone hajoaisi tai joutuisi hyökkäyksen kohteeksi.",
   "Riski": "Tämä on itse asiassa hyvä tapa suojata tiedostot."}},
]

LOPPU_TEKSTI = "Autoit pelistudiota julkaisemaan pelin ja tarkastit kahdeksan tietoturva-asiaa. Samalla tutustuit kymmeneen IT-alan ammattiin."

OPPILAITOKSET = ("Missä IT-alaa voi opiskella?", "Koulutus")
SAILYTA = ["Koulutus", "Korkeakoulut"]
SAILYTA_KORVAUKSET = [("<</link>\n  </div>", "<</link>>\n  </div>")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Testaus": "Epäselvän bugiraportin takia koodari etsi vikaa turhaan. Korjaus viivästyi.",
    "Koodi": "Testaamaton korjaus rikkoi pelin äänet. Muutos piti perua ja tehdä uudelleen.",
    "Pelitestaus": "Pitkän ohjeen kirjoittaminen meni hukkaan, kun kukaan ei lukenut sitä.",
    "Konesali": "Vian etsiminen arvaamalla katkaisi kaikkien työt hetkeksi.",
    "Epäilyttävä viesti": "Salasana päätyi huijareille. Kaikki tunnukset piti vaihtaa ja tarkistaa.",
    "Asiakastuki": "Veikko joutui soittamaan uudelleen. Hän ehti jo turhautua.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Kettu kiertoradalla on valmis. Kello 12.00 Iida painaa julkaisunappia, ja peli ilmestyy sovelluskauppoihin!",
    "Kello on <<print setup.kello($aika)>>. Peli julkaistiin, mutta pari ongelmaa jäi korjattavaksi. Tiimi tekee huomenna ensimmäisen päivityksen.",
    "Kello on <<print setup.kello($aika)>>. Julkaisu siirtyi. Pelissä oli liian monta ongelmaa, ja ne pitää korjata ennen kuin peli voidaan julkaista.",
]
MYOHASSA = "Kello ehti yli kahdentoista, joten julkaisu siirtyi iltapäivään."
