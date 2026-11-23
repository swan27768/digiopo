# -*- coding: utf-8 -*-
"""Merenkulku – "Ensimmäinen merivuoro" (sisältö). Uusi ala.
Rakenna: python3 rakenna_tarina.py alat/merenkulku.py <orig palvelu-ala.html> <uusi merenkulku-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on merenkulun opiskelija ensimmäisellä harjoitteluvuorollaan ro-ro-rahtilaivalla.
Laiva saapuu aamulla Helsinkiin ja lähtee kello 15. Tarina kulkee klo 7–15. Ammatit: luotsi,
satama-ahtaaja, laivamies, konemestari, laivakokki ja perämies. Loppuosan tehtävä on
"Lastaussuunnitelma" (TEHTAVA tyyppi "lastaus"): oppilas sijoittaa 12 ajoneuvoa autokannelle.

Jokaisessa kohtauksessa on paras vaihtoehto, järkevä mutta heikompi vaihtoehto (piirre 1 + tyyli)
ja huono vaihtoehto (ei piirteitä, tyyli + seuraus lopussa)."""

ala = "merenkulku"
alaNimi = "Merenkulku"
tarinaNimi = "Ensimmäinen merivuoro"
maailma = "laiva"
yleisKohtaus = "satama"
katsoTeksti = "Katso laivaa"
kello = {"alku": 7 * 60, "raja": 8 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Merenkulkuala", "ifid": "41e23748-470d-4fc7-892e-74bf5c28d0f6"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Laiva lähtee klo 15.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Meren värit: syvä merensininen, luotsiveneen oranssi ja vaahdon valkoinen
TEEMA = """:root {
  --a1: #5cc8ff; --a1-rgb: 92,200,255;
  --a2: #ff8a3d; --a2-rgb: 255,138,61;
  --a3: #dff3ff;
  --korostus: #ffb067; --korostus-rgb: 255,176,103;
  --tausta: #0b1a2a; --tausta-rgb: 11,26,42;
  --tausta-2: #112539; --tausta-2-rgb: 17,37,57;
  --paneeli: #0f2133; --paneeli-rgb: 15,33,51;
  --paneeli-2: #173049;
  --tumma: #06101b; --tumma-rgb: 6,16,27;
  --reuna: #5cc8ff;
  --teksti-pehmea: #dbe9f4; --teksti-pehmea-rgb: 219,233,244;
  --teksti-vaalea: #f6fbff;
  --nappi-teksti: #061a2b;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a1), var(--a2));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #eaf7ff;
  --kansi-nappi-varjo: #1d4f7a;
  --kansi-nappi-hehku: 92,200,255;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Merenkulkuala", otsikko="Merenkulku",
             alaotsikko="Ensimmäinen merivuoro · Kuka kaikki tarvitaan, jotta laiva lähtee ajallaan?",
             nappi="Astu laivaan", ikoni="auto")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet merenkulun opiskelija ja ensimmäistä päivää harjoittelussa rahtilaivalla. Laiva saapuu aamulla Helsinkiin, ja kello 15 se lähtee taas merelle rekat kyydissään. Päivän aikana autat monta merenkulun ammattilaista. Joka kerta päätät, mikä on paras tapa toimia.",
            faktat=[("6", "ammattilaista"), ("60", "rekkaa"), ("8", "tuntia satamassa")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "merenkulku-luotsivene-tausta.webp",
               "alku": KUVA + "merenkulku-ulappa-tausta.webp",
               "tehtava": KUVA + "merenkulku-lautta-tausta.webp",
               "kortti": KUVA + "merenkulku-luotsivene-tausta.webp",
               "loppu": [KUVA + "merenkulku-ulappa-tausta.webp", KUVA + "merenkulku-luotsivene-tausta.webp"],
               "oppilaitokset": [KUVA + "merenkulku-komentosilta-tausta.webp", KUVA + "merenkulku-lautta-tausta.webp"]}

TARINA_ALKU = dict(nimi="Laiva saapuu", tausta="kansi", teksti="""<<include "HUD">>
<h1>Laiva saapuu</h1>
<p>Kello on 7.00. Seisot rahtilaivan kannella. Aamu-usvan läpi näkyvät jo Helsingin saaret.</p>
<p>Olet merenkulun opiskelija, ja tämä on ensimmäinen päiväsi harjoittelussa. Laiva purkaa ja lastaa satamassa, ja kello 15 se lähtee taas merelle.</p>
<p class="puhe"><strong>Jussi, laivamies:</strong> ”Tervetuloa kyytiin! Luotsivene on jo tulossa. Tule mukaan.”</p>
<div class="intro-nappi"><<link "Aloita vuoro">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Luotsitikkaat", tausta="luotsi", otsikko="Luotsi tulee kyytiin", avain="luotsi",
      taustakuva=KUVA + "merenkulku-luotsi-tausta.webp",
      kysymys="Miltä luotsin työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän yli kahdeksan.",
      johdanto="""<p>Luotsi Tiina tuntee Helsingin vesialueen tarkasti. Hän opastaa laivan satamaan kapeiden väylien läpi.</p>
<p>Luotsivene ajaa laivan kylkeen, ja Tiina kiipeää laivaan köysitikkaita pitkin. Te valmistelette tikkaat Jussin kanssa.</p>
<p class="puhe"><strong>Jussi, laivamies:</strong> ”Miten valmistaudumme?”</p>""",
      valinnat=[
       dict(teksti="Tarkistetaan tikkaat, kiinnitykset ja korkeus. Pelastusrengas ja radiopuhelin ovat valmiina, ja Tiinaa ollaan vastassa kannella.", aika=45, piirteet={"vastuullinen": 2, "tiimi": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Luotsin nousu laivaan on yksi merenkulun vaarallisimmista hetkistä. Kun tikkaat on tarkistettu ja joku on vastassa, Tiina pääsee kyytiin turvallisesti.</p>"),
       dict(teksti="Tikkaat lasketaan valmiiksi jo puoli tuntia etukäteen, ettei Tiinan tarvitse odottaa.", tyyli="kaytannollinen", aika=25, piirteet={"tiimi": 1},
            palaute="<p><strong>Ajoissa, mutta tarkistus puuttuu.</strong></p><p>Tikkaiden kiinnitys ja korkeus pitää tarkistaa juuri ennen nousua, koska laiva ja aallot liikkuvat. Jussi tarkistaa tikkaat ja jää Tiinaa vastaan.</p>"),
       dict(teksti="Tiina on ammattilainen. Riittää, että tikkaat roikkuvat laivan kyljessä.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Huonosti kiinnitetyt tikkaat voivat pettää, ja putoaminen kylmään mereen on hengenvaarallista. Jussi tarkistaa tikkaat ja on vastassa kannella.</p>"),
      ]),
 dict(nimi="Autokansi", tausta="satama", otsikko="Kiire autokannella", avain="ahtaaja",
      taustakuva=KUVA + "merenkulku-lautta-tausta.webp",
      kysymys="Miltä satama-ahtaajan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli kymmenen aikaan.",
      johdanto="""<p>Laiva on laiturissa, ja peräportti on auki. Satama-ahtaaja Mika ohjaa rekkoja sisään autokannelle.</p>
<p>Yksi kuljettaja kiirehtii, koska hänen pitää ehtiä seuraavaan työhön. Mika ei ole vielä kiinnittänyt hänen rekkaansa kanteen.</p>
<p class="puhe"><strong>Mika, satama-ahtaaja:</strong> ”Mitä tehdään ensin?”</p>""",
      valinnat=[
       dict(teksti="Mika sitoo rekan kannelle sidontaliinoilla ja laittaa kiilat pyörien eteen. Vasta sitten seuraava rekka ajaa sisään.", aika=45, piirteet={"vastuullinen": 2, "tarkka": 1},
            palaute="<p><strong>Ammattilaisen ote!</strong></p><p>Merellä laiva keinuu, ja sitomaton rekka voi liikkua ja kaatua. Siitä voi seurata koko laivan kallistuminen. Sidonta tehdään aina heti.</p>"),
       dict(teksti="Rekat ajetaan ensin kaikki sisään, ja sitten ne sidotaan yhdellä kertaa.", tyyli="nopea", aika=30, piirteet={"tarkka": 1},
            palaute="<p><strong>Nopeaa, mutta riskialtista.</strong></p><p>Kiireessä joku rekka voi unohtua sitomatta. Mika sitoo jokaisen rekan heti, kun se on paikallaan.</p>"),
       dict(teksti="Merellä on tänään tyyntä, joten sidonta voidaan jättää väliin.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Sää voi muuttua nopeasti, ja laiva keinuu aina jonkin verran. Lasti sidotaan joka kerta, säästä riippumatta.</p>"),
      ]),
 dict(nimi="Pelastusvene", tausta="turva", otsikko="Ensimmäinen päivä laivalla", avain="laivamies",
      taustakuva=KUVA + "merenkulku-ulappa-tausta.webp",
      kysymys="Miltä laivamiehen työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli yhdentoista jälkeen.",
      johdanto="""<p>Laivamies Jussi hoitaa kannen töitä: kiinnityksiä, huoltoa ja vahtivuoroja. Hän on myös vastuussa sinun perehdytyksestäsi.</p>
<p>Jos laivalla soi hälytys, jokaisen pitää tietää, mihin mennään ja mitä tehdään.</p>
<p class="puhe"><strong>Jussi, laivamies:</strong> ”Milloin käydään turvallisuusasiat läpi?”</p>""",
      valinnat=[
       dict(teksti="Heti. Jussi näyttää pelastusliivit, kokoontumispaikan ja pelastusveneen, ja kävelette hätäreitin yhdessä läpi.", aika=45, piirteet={"vastuullinen": 2, "kohtaaja": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Laivalla turvallisuusperehdytys tehdään ensimmäisenä päivänä. Kun olet kävellyt reitin itse, löydät sen myös pimeässä ja kiireessä.</p>"),
       dict(teksti="Saat turvallisuusohjeet luettavaksi hyttiisi.", tyyli="kaytannollinen", aika=20, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Ohjeet ovat tärkeät, mutta…</strong></p><p>Paperilta luettu reitti unohtuu helposti, kun hälytys soi. Jussi näyttää paikat ja reitin myös käytännössä.</p>"),
       dict(teksti="Turvallisuusasiat käydään läpi ensimmäisessä harjoituksessa ensi viikolla.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Liian myöhään.</strong></p><p>Hätätilanne voi tulla jo ensimmäisellä matkalla. Jussi käy turvallisuusasiat läpi heti ensimmäisenä päivänä.</p>"),
      ]),
 dict(nimi="Konehuone", tausta="konehuone", otsikko="Öljyä lattialla", avain="konemestari",
      kysymys="Miltä konemestarin työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen kahtatoista.",
      johdanto="""<p>Konehuoneessa on kuuma, ja koneet jyrisevät. Konemestari Antti huoltaa koneita satamassa olon aikana.</p>
<p>Yhden polttoainepumpun tiivisteestä tihkuu öljyä lattialle. Laiva lähtee kello 15.</p>
<p class="puhe"><strong>Antti, konemestari:</strong> ”Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Pumppu pysäytetään ja tiiviste vaihdetaan varaosaan. Öljy siivotaan imeytysmatoilla, ja korjaus kirjataan konepäiväkirjaan.", aika=50, piirteet={"tarkka": 2, "vastuullinen": 1},
            palaute="<p><strong>Ammattilaisen ote!</strong></p><p>Satamassa korjaaminen on turvallisempaa kuin merellä. Kirjaus kertoo seuraavalle vuorolle, mitä on tehty. Öljy lattialla on myös liukastumis- ja palovaara.</p>"),
       dict(teksti="Vuodon alle laitetaan astia, ja pumppu korjataan seuraavalla satamakäynnillä.", tyyli="kaytannollinen", aika=25, piirteet={"tarkka": 1},
            palaute="<p><strong>Väliaikainen ratkaisu.</strong></p><p>Merellä vuoto voi pahentua, eikä silloin ole helppo korjata. Antti vaihtaa tiivisteen nyt, kun laiva on satamassa.</p>"),
       dict(teksti="Vuoto on pieni. Pyyhitään lattia ja jatketaan muita töitä.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei riitä.</strong></p><p>Pieni vuoto kasvaa, ja öljy kuuman koneen lähellä voi syttyä. Antti vaihtaa tiivisteen ja siivoaa öljyn.</p>"),
      ]),
 dict(nimi="Laivan keittiö", tausta="keittio", otsikko="Uusi allergia", avain="laivakokki",
      kysymys="Miltä laivakokin työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on yhden aikaan.",
      johdanto="""<p>Laivakokki Satu tekee ruoan koko miehistölle. Merellä ei voi käydä kaupassa, joten ruoat pitää suunnitella koko matkaksi.</p>
<p>Uusi kansimies kertoo, että hänellä on vakava pähkinäallergia. Päivän jälkiruoaksi on suunniteltu pähkinäpiirakkaa.</p>
<p class="puhe"><strong>Satu, laivakokki:</strong> ”Miten toimin?”</p>""",
      valinnat=[
       dict(teksti="Satu tekee koko miehistölle jälkiruoan ilman pähkinöitä ja merkitsee allergian ruokalistaan. Hän tarkistaa myös, että laivan apteekissa on adrenaliinikynä.", aika=45, piirteet={"kohtaaja": 2, "vastuullinen": 1},
            palaute="<p><strong>Huolellista!</strong></p><p>Merellä lähin sairaala voi olla tuntien päässä. Kun allergiaruoka tehdään kaikille, vahinkoja ei pääse sattumaan, ja ensiapu on valmiina.</p>"),
       dict(teksti="Satu tekee kansimiehelle oman jälkiruoan samalla pöydällä ja samoilla välineillä.", tyyli="empaattinen", aika=30, piirteet={"kohtaaja": 1},
            palaute="<p><strong>Hyvä ajatus, mutta riski jää.</strong></p><p>Vakavassa allergiassa pienikin määrä pähkinää yhteisillä välineillä voi aiheuttaa reaktion. Satu jättää pähkinät pois kokonaan.</p>"),
       dict(teksti="Kansimies voi itse jättää jälkiruoan syömättä.", tyyli="suora", aika=15, piirteet={},
            palaute="<p><strong>Ei riitä.</strong></p><p>Pähkinää voi olla myös muissa ruoissa, eikä kansimies tiedä aina, mitä niissä on. Satu suunnittelee ruoan niin, että se on kaikille turvallista.</p>"),
      ]),
 dict(nimi="Komentosilta", tausta="komentosilta", otsikko="Liian painava rekka", avain="peramies",
      taustakuva=KUVA + "merenkulku-komentosilta-tausta.webp",
      kysymys="Miltä perämiehen työ näytti?",
      johdanto="""<p>Komentosillalla perämies Sanna seuraa lastausta. Hän laskee, että laiva pysyy vakaana eikä kallistu.</p>
<p>Viimeisen rekan papereissa lukee 20 tonnia. Sataman vaa'an mukaan rekka painaa kuitenkin 32 tonnia.</p>
<p class="puhe"><strong>Sanna, perämies:</strong> ”Mitä teemme tälle rekalle?”</p>""",
      valinnat=[
       dict(teksti="Sanna pyytää rekan punnittavaksi uudelleen. Hän laskee laivan vakavuuden oikealla painolla ja päättää, mihin kohtaan kantta rekka sijoitetaan.", aika=45, piirteet={"tarkka": 2, "vastuullinen": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Laivan vakavuus lasketaan lastin painojen mukaan. Väärä paino voi saada laivan kallistumaan. Oikea paino ja hyvä paikka pitävät laivan tasapainossa.</p>"),
       dict(teksti="Rekka jätetään satamaan ja otetaan mukaan seuraavalla matkalla.", tyyli="varovainen", aika=25, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Turvallista, mutta asiakas jää ilman.</strong></p><p>Kun paino tarkistetaan ja vakavuus lasketaan uudelleen, rekka voidaan usein ottaa mukaan turvallisesti.</p>"),
       dict(teksti="Ero on vain 12 tonnia. Isossa laivassa se ei tunnu missään.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Väärä paino väärässä paikassa voi kallistaa laivaa, varsinkin myrskyssä. Sanna laskee vakavuuden oikealla painolla.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Lähtö", teksti="""<h1>Köydet irti</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>, kun laiva on valmis lähtöön. Kello 15 köydet irrotetaan.</p>
<p>Peräportti nousee kiinni, ja koneet alkavat jyristä. Seisot kannella ja katsot, kuinka satama pienenee. Ensimmäinen merivuorosi on alkanut.</p>
<p>Huomasitko? Yksi laivan satamakäynti tarvitsi monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Tiina, luotsi</strong> – opasti laivan satamaan</li>
<li><strong>Mika, satama-ahtaaja</strong> – lastasi ja sitoi rekat</li>
<li><strong>Jussi, laivamies</strong> – hoiti kannen työt ja perehdytti sinut</li>
<li><strong>Antti, konemestari</strong> – korjasi koneet</li>
<li><strong>Satu, laivakokki</strong> – teki ruoan koko miehistölle</li>
<li><strong>Sanna, perämies</strong> – laski laivan vakavuuden</li>
</ul>
<p>Laivamieheksi, vahtiperämieheksi ja vahtikonemestariksi voi opiskella ammattikoulussa merenkulkualan perustutkinnossa. Satama-ahtaajaksi opiskellaan logistiikan perustutkinnossa ja kokiksi ravintola- ja catering-alan perustutkinnossa. Merikapteeniksi ja konemestariksi opiskellaan ammattikorkeakoulussa. Luotsilla on merikapteenin koulutus ja pitkä kokemus merellä.</p>""")

PIIRTEET = {
 "tarkka": {"nimi": "Tarkka", "kuvaus": "Tarkistat asiat huolellisesti, ennen kuin jatkat."},
 "vastuullinen": {"nimi": "Turvallisuuden vartija", "kuvaus": "Mietit aina ensin, miten kaikki pysyvät turvassa."},
 "tiimi": {"nimi": "Miehistön jäsen", "kuvaus": "Teet yhteistyötä, ja muut voivat luottaa sinuun."},
 "kohtaaja": {"nimi": "Huolehtija", "kuvaus": "Huomaat, mitä muut tarvitsevat, ja autat heitä."},
}

AMMATIT = {
 "luotsi": {"nimi": "Luotsi", "kuvaus": "Opastaa laivoja turvallisesti mereltä satamiin ja takaisin.",
            "tutkinto": "Merikapteeni (AMK), merikokemus ja luotsin erityiskoulutus", "piirteet": ["tarkka", "vastuullinen"]},
 "ahtaaja": {"nimi": "Satama-ahtaaja", "kuvaus": "Lastaa ja purkaa laivoja satamassa.",
             "tutkinto": "Logistiikan perustutkinto (satama-ahtaaja)", "piirteet": ["vastuullinen", "tiimi"]},
 "laivamies": {"nimi": "Laivamies", "kuvaus": "Tekee kannen ja konehuoneen töitä ja pitää vahtia.",
               "tutkinto": "Merenkulkualan perustutkinto (laivamies)", "piirteet": ["tiimi", "vastuullinen"]},
 "konemestari": {"nimi": "Konemestari", "kuvaus": "Vastaa laivan koneista, sähköstä ja huollosta.",
                 "tutkinto": "Konemestari (AMK) tai merenkulkualan perustutkinto (vahtikonemestari)", "piirteet": ["tarkka", "vastuullinen"]},
 "laivakokki": {"nimi": "Laivakokki", "kuvaus": "Suunnittelee ja valmistaa ruoat miehistölle koko matkan ajaksi.",
                "tutkinto": "Ravintola- ja catering-alan perustutkinto (kokki)", "piirteet": ["kohtaaja", "tarkka"]},
 "peramies": {"nimi": "Perämies", "kuvaus": "Ohjaa laivaa vahtivuorollaan ja valvoo lastausta.",
              "tutkinto": "Merikapteeni (AMK) tai merenkulkualan perustutkinto (vahtiperämies)", "piirteet": ["tarkka", "tiimi"]},
}

KUTSU_JOHDANTO = "Laiva on matkalla, ja seuraavassa satamassa on taas lastaus. Nyt sinä pääset perämiehen apuna tekemään autokannen lastaussuunnitelman."

def A(avain, nimi, lyhyt, ikoni, paino, kuvaus, tagit=()):
    return {"avain": avain, "nimi": nimi, "lyhyt": lyhyt, "ikoni": ikoni, "paino": paino, "kuvaus": kuvaus, "tagit": list(tagit)}

TEHTAVA = dict(
    tyyppi="lastaus",
    nimi="Lastaussuunnitelma", tag="Tehtävä · noin 15 min",
    maara="<strong>12 ajoneuvoa ja yhden autokannen</strong>",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Sijoita kaikki ajoneuvot autokannelle. Huolehdi, että laiva pysyy tasapainossa ja turvallisena.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Kallistusmittari näyttää heti, painaako laivan toinen puoli enemmän. Tarkistuslista kertoo, mitkä turvallisuussäännöt täyttyvät. Voit muokata suunnitelmaa ja tarkistaa sen uudelleen. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Lastaussuunnitelmasi",
    osa1="Osa 1/2 · Autokansi", osa2="Osa 2/2 · Perustelut",
    tilanneOtsikko="Lastaus seuraavassa satamassa",
    ohje="Autokannella on neljä kaistaa ja neljä riviä. Valitse ajoneuvo listasta ja paina kannen ruutua. Ruutujen merkit kertovat, missä on sähköpistoke, vaarallisten aineiden alue ja hätäpoistumistie.",
    kaistat=4, rivit=4,
    keulaTeksti="KEULA", peraTeksti="PERÄPORTTI", vasenTeksti="◀ Vasen puoli", oikeaTeksti="Oikea puoli ▶",
    kaistaTeksti="Kaista", riviTeksti="rivi", kallistusNimi="Kallistus",
    ajoneuvotOtsikko="Lastattavat ajoneuvot", saannotOtsikko="Perämiehen tarkistuslista",
    kaikkiKannellaTeksti="Kaikki ajoneuvot ovat kannella.",
    vihje="Valitse ajoneuvo ja paina sitten kannen ruutua. Kannella olevan ajoneuvon saat takaisin listaan painamalla sitä.",
    valittuVihje="Paina nyt kannen ruutua, johon ajoneuvo menee.",
    erikoisruudut={"sahko": [[1, 3], [1, 4], [4, 3], [4, 4]], "adr": [[1, 1], [1, 2], [4, 1], [4, 2]], "poistuminen": [[3, 2]]},
    erikoisMerkit={"sahko": {"ikoni": "⚡", "nimi": "Sähköpistoke kylmärekalle"},
                   "adr": {"ikoni": "⚠️", "nimi": "Vaarallisten aineiden alue"},
                   "poistuminen": {"ikoni": "🚪", "nimi": "Hätäpoistumistie"}},
    tarkistaNappi="Tarkista suunnitelma", muokkaaNappi="Muokkaa suunnitelmaa", jatkaNappi="Jatka perusteluihin", tyhjennaNappi="Tyhjennä kansi",
    takaisinNappi="Takaisin kannelle", valmisNappi="Katso tulos",
    perusteluOtsikko="Lastaussuunnitelma on valmis!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="LASTAUSSUUNNITELMA · M/S AALLOTAR",
    palaute=["Huippusuunnitelma! Laiva on tasapainossa, ja jokainen ajoneuvo on turvallisella paikalla.",
             "Hyvä suunnitelma! Pari siirtoa, niin laiva olisi täysin turvallinen.",
             "Hyvä alku! Lue tarkistuslistan selitykset ja kokeile siirtää ajoneuvoja."],
    ajoneuvot=[
        A("r1", "Rekka: sahatavara", "Sahapuu", "🚛", 38, "Raskas lasti.", ["raskas"]),
        A("r2", "Rekka: paperirullat", "Paperi", "🚛", 40, "Raskain lasti.", ["raskas"]),
        A("r8", "Rekka: koneet", "Koneet", "🚛", 36, "Raskas lasti.", ["raskas"]),
        A("r3", "Rekka: huonekalut", "Kalusteet", "🚚", 22, "Tavallinen lasti."),
        A("r4", "Kylmärekka: kala", "Kala", "❄️", 30, "Kylmäkone tarvitsee sähköä koko matkan.", ["kylma"]),
        A("r7", "Kylmärekka: jäätelö", "Jäätelö", "❄️", 26, "Kylmäkone tarvitsee sähköä koko matkan.", ["kylma"]),
        A("r5", "Säiliörekka: maali", "Maali", "🛢️", 26, "Vaarallinen aine: syttyvä.", ["adr"]),
        A("r6", "Rekka: lannoite", "Lannoite", "🧪", 28, "Vaarallinen aine: hapettava. Voi kiihdyttää tulipaloa.", ["adr"]),
        A("r9", "Pakettiauto", "Paketti", "🚐", 4, "Kevyt ajoneuvo, ajaa ulos ensimmäisenä.", ["kevyt"]),
        A("r12", "Asuntoauto", "Asunto", "🚐", 4, "Kevyt ajoneuvo, ajaa ulos ensimmäisenä.", ["kevyt"]),
        A("r10", "Henkilöauto", "Auto", "🚗", 2, "Kevyt ajoneuvo, ajaa ulos ensimmäisenä.", ["kevyt"]),
        A("r11", "Henkilöauto", "Auto", "🚗", 2, "Kevyt ajoneuvo, ajaa ulos ensimmäisenä.", ["kevyt"]),
    ],
    saannot=[
        {"tyyppi": "kallistus", "max": 10, "nimi": "Laiva ei kallistu (puolten painoero enintään 10 t)",
         "selitys": "Jos toinen puoli on paljon painavampi, laiva kallistuu. Myrskyssä kallistunut laiva voi olla vaarassa kaatua."},
        {"tyyppi": "kaistat", "tagi": "raskas", "kaistat": [2, 3], "nimi": "Raskaimmat rekat ovat keskikaistoilla",
         "selitys": "Keskellä laivaa paino pitää laivan vakaana. Reunoilla raskas lasti saa laivan keinumaan enemmän."},
        {"tyyppi": "ruudut", "tagi": "kylma", "ruudut": "sahko", "nimi": "Kylmärekat ovat sähköpistokkeiden vieressä",
         "selitys": "Kylmärekan kone tarvitsee sähköä koko matkan. Ilman sähköä kala ja jäätelö pilaantuvat."},
        {"tyyppi": "ruudut", "tagi": "adr", "ruudut": "adr", "nimi": "Vaaralliset aineet ovat omalla alueellaan",
         "selitys": "Vaarallisten aineiden alueella on hyvä ilmanvaihto ja sammutuslaitteet. Siellä niitä on myös helppo valvoa."},
        {"tyyppi": "eiVierekkain", "tagi": "adr", "nimi": "Vaaralliset aineet eivät ole vierekkäin",
         "selitys": "Syttyvä maali ja hapettava lannoite yhdessä voivat pahentaa tulipaloa. Siksi ne pidetään erillään."},
        {"tyyppi": "rivit", "tagi": "kevyt", "rivit": [1, 2], "nimi": "Kevyet autot ovat lähellä peräporttia",
         "selitys": "Henkilöautot ja pakettiautot ajavat satamassa ulos ensimmäisinä. Silloin purku sujuu nopeasti."},
        {"tyyppi": "tyhja", "ruudut": "poistuminen", "nimi": "Hätäpoistumistie on vapaana",
         "selitys": "Hätäpoistumistien eteen ei saa koskaan pysäköidä. Tulipalossa ihmisten pitää päästä ulos autokannelta."},
    ],
    kysymykset=[
        {"kysymys": "Miksi laivan lasti pitää jakaa tasaisesti kannelle?", "ammattilainen": "Perämies",
         "tutkinto": "Merikapteeni (AMK)", "placeholder": "Lasti pitää jakaa tasaisesti, koska…"},
        {"kysymys": "Miksi vaaralliset aineet sijoitetaan omalle alueelleen?", "ammattilainen": "Satama-ahtaaja",
         "tutkinto": "Logistiikan perustutkinto (satama-ahtaaja)", "placeholder": "Vaaralliset aineet ovat erillään, koska…"},
    ],
    ammattilaisetOtsikko="Merenkulkualan ammatteja",
    ammattilaiset=[
        {"nimi": "Laivamies", "tehtava": "tekee kannen ja konehuoneen töitä", "tutkinto": "Merenkulkualan perustutkinto"},
        {"nimi": "Vahtiperämies", "tehtava": "ohjaa laivaa vahtivuorollaan", "tutkinto": "Merenkulkualan perustutkinto"},
        {"nimi": "Vahtikonemestari", "tehtava": "huolehtii koneista vahtivuorollaan", "tutkinto": "Merenkulkualan perustutkinto"},
        {"nimi": "Satama-ahtaaja", "tehtava": "lastaa ja purkaa laivoja", "tutkinto": "Logistiikan perustutkinto"},
        {"nimi": "Merikapteeni", "tehtava": "johtaa laivaa ja koko miehistöä", "tutkinto": "Merikapteeni (AMK)"},
        {"nimi": "Konemestari", "tehtava": "vastaa laivan koneista ja tekniikasta", "tutkinto": "Konemestari (AMK)"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Autoit laivaa satamakäynnin aikana ja teit autokannen lastaussuunnitelman. Samalla tutustuit merenkulkualan ammatteihin."

OPPILAITOKSET = ("Missä merenkulkua voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Merenkulkualan koulutukset</h2>
<p>Merenkulkualaa opiskellaan rannikon oppilaitoksissa. Merityöhön tarvitaan myös merimieslääkärin tarkastus, jossa tutkitaan esimerkiksi näkö ja väriaisti. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Etsi merenkulkualan perustutkinto", "Laivamies, vahtiperämies ja vahtikonemestari. Hae Opintopolusta sanalla ”merenkulkualan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=merenkulkualan%20perustutkinto")
    + kortti("Etsi satama-ahtaajan koulutus", "Logistiikan perustutkinto. Hae Opintopolusta sanalla ”satama-ahtaaja”.", "https://opintopolku.fi/konfo/fi/haku?keyword=satama-ahtaaja")
    + kortti("Etsi kokin koulutus", "Ravintola- ja catering-alan perustutkinto. Laivakokiksi pääsee kokin koulutuksella.", "https://opintopolku.fi/konfo/fi/haku?keyword=ravintola-%20ja%20catering-alan%20perustutkinto")
    + """<h3>Myöhemmin</h3>
""" + kortti("Kaakkois-Suomen ammattikorkeakoulu Xamk, Kotka", "Merikapteeni (AMK) ja konemestari (AMK).", "https://www.xamk.fi")
    + kortti("Satakunnan ammattikorkeakoulu, Rauma", "Merikapteeni (AMK) ja konemestari (AMK).", "https://www.samk.fi")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
SEURAUKSET = {
    "Luotsitikkaat": "Luotsitikkaat piti kiinnittää uudelleen viime hetkellä, ja laiva joutui odottamaan väylällä.",
    "Autokansi": "Yksi rekka oli siirtynyt satamassa, ja koko rivi jouduttiin sitomaan uudelleen.",
    "Pelastusvene": "Iltapäivän harjoituksessa et löytänyt kokoontumispaikalle, ja harjoitus piti aloittaa alusta.",
    "Konehuone": "Pumpun vuoto paheni, ja konehuone piti siivota ennen lähtöä.",
    "Laivan keittiö": "Kansimies sai lievän allergisen reaktion, ja ruokalista tehtiin uudelleen.",
    "Komentosilta": "Lastaussuunnitelma laskettiin vielä kerran uusiksi juuri ennen lähtöä.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>, kun laiva on valmis lähtöön. Kello 15 köydet irrotetaan. Kaikki sujui juuri niin kuin piti!",
    "Kello on <<print setup.kello($aika)>>, kun laiva on valmis lähtöön. Pari asiaa olisi voinut mennä paremmin, mutta laiva lähtee ajallaan.",
    "Kello on <<print setup.kello($aika)>>, kun laiva on vihdoin valmis. Päivä oli täynnä korjattavaa, ja kapteeni haluaa puhua kanssasi illalla.",
]
MYOHASSA = "Laiva lähti myöhässä, ja seuraavan sataman rekat joutuivat odottamaan."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
