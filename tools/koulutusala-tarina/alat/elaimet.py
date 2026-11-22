# -*- coding: utf-8 -*-
"""Eläimet – "Eläinkeskuksen pitkä päivä" (sisältö). Uusi ala, kuuluu luonnonvara-aloihin.
Rakenna: python3 rakenna_tarina.py alat/elaimet.py <orig palvelu-ala.html> <uusi elaimet-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on eläinkeskuksen vuorovastaava. Tarina kulkee yhden kevätpäivän klo 7–17.
Ammatit: eläintenhoitaja, trimmaaja, klinikkaeläinhoitaja, maaseutuyrittäjä/karjanhoitaja,
hevostenhoitaja ja eläinlääkäri. Loppuosan tehtävä on "Hoitokortti" (TEHTAVA tyyppi "hoitokortti"):
oppilas tekee kolmelle eläimelle hoito-ohjelman."""

ala = "elaimet"
alaNimi = "Eläimet"
tarinaNimi = "Eläinkeskuksen pitkä päivä"
maailma = "elainkeskus"
yleisKohtaus = "piha"
katsoTeksti = "Katso eläinkeskusta"
kello = {"alku": 7 * 60, "raja": 10 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Elainala", "ifid": "81578e95-50ff-498d-b5cc-5cc158ebda8c"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Vuoro päättyy klo 17.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Maaseudun värit: tumma metsänvihreä, kevään keltainen ja navetan punainen
TEEMA = """:root {
  --a1: #8fd16a; --a1-rgb: 143,209,106;
  --a2: #f2c14e; --a2-rgb: 242,193,78;
  --a3: #d8f0c4;
  --korostus: #f2c14e; --korostus-rgb: 242,193,78;
  --tausta: #17201a; --tausta-rgb: 23,32,26;
  --tausta-2: #223026; --tausta-2-rgb: 34,48,38;
  --paneeli: #1c271f; --paneeli-rgb: 28,39,31;
  --paneeli-2: #26352a;
  --tumma: #0f1611; --tumma-rgb: 15,22,17;
  --reuna: #8fd16a;
  --teksti-pehmea: #e2ecdc; --teksti-pehmea-rgb: 226,236,220;
  --teksti-vaalea: #f8fbf5;
  --nappi-teksti: #11240a;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #eaf7dc;
  --kansi-nappi-varjo: #3d6a22;
  --kansi-nappi-hehku: 143,209,106;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Luonto- ja ympäristöala", otsikko="Eläimet",
             alaotsikko="Eläinkeskuksen pitkä päivä · Kuka pitää huolta koirista, kissoista, lehmistä, hevosista ja lampaista?",
             nappi="Astu eläinkeskukseen", ikoni="sydan")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet maaseudun eläinkeskuksen vuorovastaava. Keskuksessa on koirahoitola, trimmaamo, eläinklinikka, navetta, talli ja lammastarha. Tänään jokaisessa paikassa tapahtuu jotain. Joka kerta päätät, mikä on eläimelle paras ratkaisu.",
            faktat=[("6", "ammattilaista"), ("5", "eläinlajia"), ("1", "päivä")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "elaimet-hevonen-tausta.webp",
               "alku": KUVA + "elaimet-lampaat-tausta.webp",
               "tehtava": KUVA + "elaimet-klinikka-tausta.webp",
               "kortti": KUVA + "elaimet-hevonen-tausta.webp",
               "loppu": [KUVA + "elaimet-hevonen-tausta.webp", KUVA + "elaimet-koirapesu-tausta.webp", KUVA + "elaimet-navetta-tausta.webp"],
               "oppilaitokset": [KUVA + "elaimet-lampaat-tausta.webp", KUVA + "elaimet-klinikka-tausta.webp"]}

TARINA_ALKU = dict(nimi="Aamu eläinkeskuksessa", tausta="piha", teksti="""<<include "HUD">>
<h1>Aamu eläinkeskuksessa</h1>
<p>Kello on 7.00. Koirat haukkuvat aamupalaa, ja navetasta kuuluu ammuntaa. Olet vuorovastaava eli johdat päivän työtä.</p>
<p>Eläinkeskuksessa työskentelee monen alan ammattilaisia. Jokaisella on oma tärkeä tehtävänsä eläinten hyvinvoinnissa.</p>
<p class="puhe"><strong>Venla, eläintenhoitaja:</strong> ”Huomenta! Koirahoitolassa on jo asiaa. Tuletko katsomaan?”</p>
<div class="intro-nappi"><<link "Aloita päivä">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Koirahoitola", tausta="hoitola", otsikko="Koira ei syö", avain="elaintenhoitaja",
      kysymys="Miltä eläintenhoitajan työ näytti?", lisaaika=50, siirtymaTeksti="Seuraava tilanne on yhdeksän jälkeen.",
      johdanto="""<p>Koirahoitolaan tuotiin eilen hoitokoira Nalle. Omistajat lähtivät viikoksi lomalle.</p>
<p>Nalle ei ole syönyt mitään. Se makaa tarhan nurkassa ja vapisee. Omistajat jättivät ohjeen: ”Nalle syö vain omaa ruokaansa.”</p>
<p class="puhe"><strong>Venla, eläintenhoitaja:</strong> ”Mitä teemme?”</p>""",
      valinnat=[
       dict(teksti="Annetaan Nallelle sen omaa ruokaa rauhallisessa paikassa. Venla istuu lähellä ja seuraa, juoko ja syökö koira. Jos koira ei syö huomennakaan, soitetaan eläinlääkärille.", aika=45, piirteet={"tarkkailija": 2, "rauhallinen": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Uusi paikka jännittää monia koiria. Kun Nalle saa rauhan ja tutun ruoan, se syö iltapäivällä. Venla kirjaa havainnot hoitokorttiin.</p>"),
       dict(teksti="Annetaan Nallelle makkaraa, niin se ainakin syö jotain.", aika=30, piirteet={},
            palaute="<p><strong>Ei hyvä.</strong></p><p>Suolainen ja rasvainen ihmisten ruoka voi sotkea koiran vatsan. Venla tarjoaa Nallelle sen omaa ruokaa rauhallisessa paikassa.</p>"),
       dict(teksti="Soitetaan heti omistajille ja kysytään, mitä tehdä.", aika=30, piirteet={"asiakas": 1}, palaute="<p><strong>Hyvä ajatus, mutta ei vielä.</strong></p><p>Omistajat ovat lomalla, eivätkä he voi auttaa kaukaa. Yksi syömätön päivä uudessa paikassa on tavallista. Ensin annetaan Nallelle rauhaa ja tuttua ruokaa ja seurataan tilannetta. Venla tekee niin, ja Nalle syö iltapäivällä.</p>"),
      ]),
 dict(nimi="Trimmaamo", tausta="trimmaamo", otsikko="Takkuinen turkki", avain="trimmaaja",
      taustakuva=KUVA + "elaimet-koirapesu-tausta.webp",
      kysymys="Miltä trimmaajan työ näytti?", lisaaika=50, siirtymaTeksti="Seuraava tilanne on vähän ennen puoltapäivää.",
      johdanto="""<p>Trimmaaja Aada pesee kultaistanoutajaa. Pesun aikana hän huomaa, että koiran korvan takana on punainen ja kuumottava haava.</p>
<p>Omistaja tulee hakemaan koiraa tunnin päästä.</p>
<p class="puhe"><strong>Aada, trimmaaja:</strong> ”Mitä teen?”</p>""",
      valinnat=[
       dict(teksti="Aada kuivaa haavan varovasti eikä leikkaa sen läheltä. Hän näyttää haavan omistajalle ja neuvoo viemään koiran eläinlääkäriin.", aika=50, piirteet={"tarkkailija": 2, "asiakas": 1},
            palaute="<p><strong>Ammattilaisen työtä!</strong></p><p>Trimmaaja näkee koiran ihon tarkemmin kuin kukaan muu. Omistaja on kiitollinen, ja eläinlääkäri hoitaa tulehtuneen haavan.</p>"),
       dict(teksti="Aada laittaa haavaan ihmisten haavavoidetta.", aika=40, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Kaikki ihmisten lääkkeet eivät sovi eläimille. Koira voi myös nuolla voiteen. Aada kertoo haavasta omistajalle.</p>"),
       dict(teksti="Aada leikkaa haavan ympäriltä karvat lyhyiksi, jotta haava pääsee kuivumaan.", aika=40, piirteet={}, palaute="<p><strong>Ei hyvä.</strong></p><p>Tulehtuneen haavan lähellä leikkaaminen voi sattua ja pahentaa haavaa. Haava kuuluu eläinlääkärille. Aada kertoo haavasta omistajalle.</p>"),
      ]),
 dict(nimi="Eläinklinikka", tausta="klinikka", otsikko="Kissalla on kipuja", avain="klinikka",
      taustakuva=KUVA + "elaimet-klinikka-tausta.webp",
      kysymys="Miltä klinikkaeläinhoitajan työ näytti?", lisaaika=45, siirtymaTeksti="Seuraava tilanne on yhden jälkeen.",
      johdanto="""<p>Eläinklinikalle soittaa huolestunut kissan omistaja. Hänen kissansa ontui aamulla.</p>
<p>”Annoin sille puolikkaan omaa särkylääkettäni. Voinko antaa illalla toisenkin?” omistaja kysyy.</p>
<p class="puhe"><strong>Noora, klinikkaeläinhoitaja:</strong> ”Mitä vastaan?”</p>""",
      valinnat=[
       dict(teksti="Noora sanoo, ettei lääkettä saa antaa enää. Kissa tuodaan heti klinikalle, ja eläinlääkäri tutkii sen.", aika=45, piirteet={"tarkkailija": 1, "rauhallinen": 2},
            palaute="<p><strong>Oikein!</strong></p><p>Monet ihmisten särkylääkkeet ovat kissalle myrkyllisiä, jo pieninä määrinä. Kissa saa hoitoa ajoissa ja toipuu.</p>"),
       dict(teksti="Noora sanoo, että puolikas tabletti illalla on varmasti hyvä.", aika=30, piirteet={},
            palaute="<p><strong>Vaarallista!</strong></p><p>Kissa ei pysty käsittelemään monia ihmisten lääkkeitä. Noora soittaa takaisin ja pyytää tuomaan kissan heti klinikalle.</p>"),
       dict(teksti="Noora sanoo, ettei lääkettä anneta enää, ja varaa kissalle ajan huomiseksi.", aika=30, piirteet={"rauhallinen": 1}, palaute="<p><strong>Hyvä alku, mutta liian hidas.</strong></p><p>On tärkeää, että lääkkeen antaminen loppui. Ihmisten särkylääke voi kuitenkin myrkyttää kissan jo nyt. Siksi kissa tuodaan klinikalle heti eikä vasta huomenna.</p>"),
      ]),
 dict(nimi="Navetta", tausta="navetta", otsikko="Lehmä ei nouse", avain="maaseutu",
      taustakuva=KUVA + "elaimet-navetta-tausta.webp",
      kysymys="Miltä maaseutuyrittäjän työ näytti?", lisaaika=45, siirtymaTeksti="Seuraava tilanne on puoli kolmelta.",
      johdanto="""<p>Navetassa lehmä Mansikki makaa eikä nouse ylös. Se poiki eilen vasikan.</p>
<p>Maaseutuyrittäjä Jussi ja harjoittelija Emilia ovat Mansikin luona.</p>
<p class="puhe"><strong>Jussi, maaseutuyrittäjä:</strong> ”Mitä nyt tehdään?”</p>""",
      valinnat=[
       dict(teksti="Soitetaan eläinlääkärille heti. Sillä välin Mansikki saa vettä ja pehmeät kuivikkeet, ja sen vointia seurataan.", aika=45, piirteet={"tarkkailija": 2, "vastuullinen": 1},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Poikimisen jälkeen lehmältä voi loppua veren kalsium. Silloin se ei jaksa nousta. Eläinlääkäri antaa lääkettä, ja Mansikki nousee illalla.</p>"),
       dict(teksti="Yritetään vetää Mansikki pystyyn köydellä.", aika=40, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Väkisin nostaminen voi satuttaa lehmää. Jussi soittaa eläinlääkärille.</p>"),
       dict(teksti="Odotetaan huomiseen. Ehkä se on vain väsynyt.", aika=30, piirteet={},
            palaute="<p><strong>Liian riskialtista.</strong></p><p>Makaava lehmä tarvitsee apua nopeasti. Jussi soittaa eläinlääkärille.</p>"),
      ]),
 dict(nimi="Talli", tausta="talli", otsikko="Ontuva hevonen", avain="hevonen",
      taustakuva=KUVA + "elaimet-hevonen-tausta.webp",
      kysymys="Miltä hevostenhoitajan työ näytti?", lisaaika=45, siirtymaTeksti="Seuraava tilanne on neljän aikaan.",
      johdanto="""<p>Tallilla alkaa pian ratsastustunti. Hevostenhoitaja Linnea huomaa, että hevonen Tähti ontuu vähän oikeaa etujalkaa.</p>
<p>Ratsastaja Sofia on odottanut tuntia koko viikon. ”Ei se onnu paljon. Voinhan silti ratsastaa?”</p>
<p class="puhe"><strong>Linnea, hevostenhoitaja:</strong> ”Mitä teen?”</p>""",
      valinnat=[
       dict(teksti="Tähti jää lepoon. Linnea puhdistaa ja tutkii kavion. Sofia ratsastaa tänään toisella hevosella.", aika=45, piirteet={"vastuullinen": 2, "asiakas": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Kaviosta löytyy kivi, joka oli painanut pohjaa. Kun kivi on poistettu, Tähti toipuu. Sofia pääsee silti tunnille.</p>"),
       dict(teksti="Sofia saa ratsastaa Tähdellä, kunhan hän ratsastaa vain käyntiä.", aika=30, piirteet={},
            palaute="<p><strong>Ei hyvä.</strong></p><p>Ontuva hevonen on kipeä. Ratsastus voi pahentaa vammaa. Linnea tutkii kavion ja antaa Sofialle toisen hevosen.</p>"),
       dict(teksti="Tähti jää lepoon, ja eläinlääkäri kutsutaan heti paikalle.", aika=30, piirteet={"vastuullinen": 1}, palaute="<p><strong>Turvallinen valinta, mutta ensin kannattaa katsoa itse.</strong></p><p>Hevostenhoitaja tutkii ensin kavion. Usein syy löytyy sieltä, kuten nyt: kavioon oli juuttunut kivi. Eläinlääkäri kutsutaan, jos syytä ei löydy tai ontuminen jatkuu.</p>"),
      ]),
 dict(nimi="Lammastarha", tausta="lampaat", otsikko="Yskivä lammas", avain="elainlaakari",
      taustakuva=KUVA + "elaimet-lampaat-tausta.webp",
      kysymys="Miltä eläinlääkärin työ näytti?",
      johdanto="""<p>Eläinlääkäri Mikael tulee tarkastamaan lampaat. Yksi lammas yskii ja sillä on kuumetta.</p>
<p>Lammastilan omistaja ehdottaa: ”Annetaan antibioottia kaikille lampaille varmuuden vuoksi. Ettei kukaan muu sairastu.”</p>
<p class="puhe"><strong>Mikael, eläinlääkäri:</strong> ”Mitä päätetään?”</p>""",
      valinnat=[
       dict(teksti="Vain sairas lammas saa lääkettä. Se erotetaan muista, ja muita seurataan tarkasti.", aika=45, piirteet={"vastuullinen": 2, "tarkkailija": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Jos antibiootteja käytetään turhaan, bakteerit tottuvat niihin, eivätkä lääkkeet enää tehoa. Se on vaarallista sekä eläimille että ihmisille.</p>"),
       dict(teksti="Kaikki lampaat saavat antibioottia varmuuden vuoksi.", aika=40, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Turha antibiootti lisää resistenssiä eli sitä, etteivät lääkkeet enää tehoa. Mikael hoitaa vain sairaan lampaan.</p>"),
       dict(teksti="Annetaan antibioottia sairaalle lampaalle ja sen kahdelle aitauskaverille.", aika=30, piirteet={"tarkkailija": 1}, palaute="<p><strong>Melkein!</strong></p><p>Kaverit eivät ole sairaita, joten lääke olisi niille turha. Turha antibiootti lisää resistenssiä eli sitä, etteivät lääkkeet enää tehoa. Mikael hoitaa vain sairaan lampaan ja erottaa sen muista.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Ilta eläinkeskuksessa", teksti="""<h1>Ilta eläinkeskuksessa</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Eläimet ovat syöneet, ja ilta-aurinko paistaa tarhoihin.</p>
<p>Kirjoitat päivän tapahtumat raporttiin iltavuorolle.</p>
<p>Huomasitko? Eläinten hyvinvoinnista huolehti tänään monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Venla, eläintenhoitaja</strong> – rauhoitti hoitokoiran ja seurasi sen syömistä</li>
<li><strong>Aada, trimmaaja</strong> – huomasi haavan koiran turkin alla</li>
<li><strong>Noora, klinikkaeläinhoitaja</strong> – esti kissaa saamasta vaarallista lääkettä</li>
<li><strong>Jussi, maaseutuyrittäjä</strong> – huolehti lehmästä poikimisen jälkeen</li>
<li><strong>Linnea, hevostenhoitaja</strong> – löysi kiven hevosen kaviosta</li>
<li><strong>Mikael, eläinlääkäri</strong> – hoiti sairaan lampaan ja käytti lääkkeitä oikein</li>
</ul>
<p>Eläintenhoitajaksi ja maaseutuyrittäjäksi voi opiskella maatalousalan perustutkinnossa ja hevostenhoitajaksi hevostalouden perustutkinnossa. Trimmaajaksi ja klinikkaeläinhoitajaksi voi myöhemmin erikoistua eläintenhoidon ammattitutkinnossa. Eläinlääkäriksi opiskellaan yliopistossa.</p>""")

PIIRTEET = {
 "tarkkailija": {"nimi": "Tarkka tarkkailija", "kuvaus": "Huomaat, kun eläin ei voi hyvin, vaikka se ei voi kertoa sitä."},
 "rauhallinen": {"nimi": "Rauhallinen", "kuvaus": "Pysyt rauhallisena, ja se rauhoittaa myös eläimiä ja ihmisiä."},
 "vastuullinen": {"nimi": "Vastuullinen", "kuvaus": "Laitat eläimen hyvinvoinnin aina etusijalle."},
 "asiakas": {"nimi": "Hyvä neuvoja", "kuvaus": "Kerrot omistajille asiat selvästi ja ystävällisesti."},
}

AMMATIT = {
 "elaintenhoitaja": {"nimi": "Eläintenhoitaja", "kuvaus": "Hoitaa eläimiä hoitoloissa, eläinkaupoissa, eläinpuistoissa ja maatiloilla.",
                     "tutkinto": "Maatalousalan perustutkinto (eläintenhoitaja)", "piirteet": ["tarkkailija", "rauhallinen"]},
 "trimmaaja": {"nimi": "Trimmaaja", "kuvaus": "Pesee, harjaa ja leikkaa koirien ja kissojen turkkia.",
               "tutkinto": "Eläintenhoidon ammattitutkinto (trimmaaja)", "piirteet": ["tarkkailija", "asiakas"]},
 "klinikka": {"nimi": "Klinikkaeläinhoitaja", "kuvaus": "Avustaa eläinlääkäriä ja hoitaa sairaita eläimiä klinikalla.",
              "tutkinto": "Eläintenhoidon ammattitutkinto (klinikkaeläinhoitaja)", "piirteet": ["rauhallinen", "asiakas"]},
 "maaseutu": {"nimi": "Maaseutuyrittäjä", "kuvaus": "Hoitaa omaa maatilaa ja sen eläimiä, esimerkiksi lehmiä.",
              "tutkinto": "Maatalousalan perustutkinto (maaseutuyrittäjä)", "piirteet": ["vastuullinen", "tarkkailija"]},
 "hevonen": {"nimi": "Hevostenhoitaja", "kuvaus": "Hoitaa, ruokkii ja liikuttaa hevosia talleilla.",
             "tutkinto": "Hevostalouden perustutkinto (hevostenhoitaja)", "piirteet": ["vastuullinen", "tarkkailija"]},
 "elainlaakari": {"nimi": "Eläinlääkäri", "kuvaus": "Tutkii, hoitaa ja leikkaa sairaita eläimiä.",
                  "tutkinto": "Eläinlääketieteen lisensiaatti, Helsingin yliopisto", "piirteet": ["vastuullinen", "rauhallinen"]},
}

KUTSU_JOHDANTO = "Päivä on ohi, mutta huomenna eläinkeskukseen tulee kolme uutta hoitoeläintä. Tee jokaiselle hoitokortti, jonka avulla kuka tahansa hoitaja osaa hoitaa eläintä oikein."


TEHTAVA = dict(
    tyyppi="hoitokortti",
    nimi="Hoitokortti", tag="Tehtävä · noin 20 min",
    maara="<strong>kolme hoitoeläintä</strong>",
    ohjeAskelLause="Jokaisen eläimen hoitokorttiin valitset neljä asiaa:",
    askeleet=["Ruokinta: mitä ja miten eläin syö.",
              "Liikunta: miten eläin liikkuu ja leikkii.",
              "Päivittäinen hoito: mitä hoitaja tekee joka päivä. Valitse kaikki sopivat.",
              "Hälytysmerkit: milloin pitää soittaa eläinlääkärille. Valitse kaikki sopivat."],
    lopuksi="Lopuksi vastaat kahteen kysymykseen. Sitten lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Hoitokorttisi",
    osa1="Hoitoeläin", osa2="Viimeinen osa · Perustelut",
    osat=["Ruokinta", "Liikunta", "Päivittäinen hoito", "Milloin eläinlääkäriin?"],
    korttiLeima="HOITOKORTTI", huomOtsikko="Omistaja kertoo",
    tarkistaNappi="Tarkista hoitokortti",
    seuraavaNappi="Seuraava eläin", jatkaNappi="Jatka perusteluihin", valmisNappi="Katso tulos",
    perusteluOtsikko="Kolme hoitokorttia valmiina!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="HOITOKORTIT · 3 ELÄINTÄ",
    palaute=["Huippuhoitaja! Eläimet saavat juuri sitä hoitoa, mitä ne tarvitsevat.",
             "Hyvää työtä! Pari asiaa vielä, niin hoitokortit olisivat täydelliset.",
             "Hyvä alku! Lue selitykset ja mieti, mitä eläin itse tarvitsee."],
    elaimet=[
      dict(nimi="Rocky", ikoni="🐕", tiedot="Labradorinnoutaja · 6 vuotta · 38 kg (sopiva paino olisi noin 30 kg)",
           huom="Rocky rakastaa ruokaa ja kerjää aina pöydän ääressä. Se on lihonut viime vuonna.",
           osat=[
             dict(tyyppi="yksi", vaihtoehdot=[
                 {"teksti": "Koiranruokaa sopivan painon mukaan kahdessa erässä. Ei ruokaa pöydästä.", "oikein": True},
                 {"teksti": "Ruokaa kupissa koko päivän, niin se saa syödä, kun haluaa."},
                 {"teksti": "Makkaraa ja ruoantähteitä palkaksi hyvästä käytöksestä."}],
                  selitys="Ylipainoinen koira syö ruokaa sopivan painonsa mukaan. Ruoka annetaan säännöllisesti, eikä se saa herkkuja pöydästä."),
             dict(tyyppi="yksi", vaihtoehdot=[
                 {"teksti": "Pihalla 10 minuuttia kahdesti päivässä."},
                 {"teksti": "Pitkiä kävelylenkkejä joka päivä, yhteensä noin puolitoista tuntia.", "oikein": True},
                 {"teksti": "Heti kahden tunnin juoksulenkki pyörän perässä."}],
                  selitys="Labradori tarvitsee paljon liikuntaa. Ylipainoiselle koiralle kävely on turvallisempaa kuin raju juoksu, joka rasittaa niveliä."),
             dict(tyyppi="monta", vaihtoehdot=[
                 {"teksti": "Raikasta vettä aina tarjolla", "oikein": True},
                 {"teksti": "Kylpy shampoolla joka päivä"},
                 {"teksti": "Turkin harjaus", "oikein": True},
                 {"teksti": "Suklaata palkkioksi"},
                 {"teksti": "Kynsien ja tassujen tarkistus", "oikein": True}],
                  selitys="Vesi, harjaus ja tassujen tarkistus kuuluvat päivittäiseen hoitoon. Suklaa on koiralle myrkyllistä, ja liian usein pesty iho kuivuu."),
             dict(tyyppi="monta", vaihtoehdot=[
                 {"teksti": "Oksentaa monta kertaa", "oikein": True},
                 {"teksti": "Heiluttaa häntää"},
                 {"teksti": "Ontuu monta päivää", "oikein": True},
                 {"teksti": "Ottaa päiväunet"},
                 {"teksti": "Ei syö eikä juo vuorokauteen", "oikein": True}],
                  selitys="Toistuva oksentelu, pitkään jatkuva ontuminen ja syömättömyys ovat merkkejä siitä, että koira tarvitsee eläinlääkäriä."),
           ]),
      dict(nimi="Mirri", ikoni="🐈", tiedot="Kotikissa · 14 vuotta · sisäkissa",
           huom="Mirri on jo vanha herra. Se nukkuu paljon, mutta tykkää vielä leikkiä.",
           osat=[
             dict(tyyppi="yksi", vaihtoehdot=[
                 {"teksti": "Lehmänmaitoa iso kupillinen joka päivä."},
                 {"teksti": "Koiranruokaa, koska sitä on talossa valmiina."},
                 {"teksti": "Seniorikissan ruokaa pieninä annoksina monta kertaa päivässä.", "oikein": True}],
                  selitys="Vanha kissa tarvitsee sille sopivaa ruokaa. Moni kissa ei siedä lehmänmaitoa, eikä koiranruoassa ole kaikkea, mitä kissa tarvitsee."),
             dict(tyyppi="yksi", vaihtoehdot=[
                 {"teksti": "Leikkihetkiä esimerkiksi kissanongella ja raapimispuu.", "oikein": True},
                 {"teksti": "Ulkoilu hihnassa kaksi tuntia joka päivä."},
                 {"teksti": "Ei mitään liikuntaa, koska se on vanha."}],
                  selitys="Lyhyet leikkihetket pitävät vanhan kissan virkeänä. Raapimispuussa se voi venytellä ja hoitaa kynsiään."),
             dict(tyyppi="monta", vaihtoehdot=[
                 {"teksti": "Hiekkalaatikon puhdistus joka päivä", "oikein": True},
                 {"teksti": "Hajuvettä turkkiin"},
                 {"teksti": "Raikasta vettä aina tarjolla", "oikein": True},
                 {"teksti": "Ihmisten särkylääkettä kipuun"},
                 {"teksti": "Turkin harjaus", "oikein": True}],
                  selitys="Puhdas hiekkalaatikko, vesi ja harjaus kuuluvat hoitoon. Ihmisten lääkkeet voivat olla kissalle myrkyllisiä, ja hajuvesi ärsyttää sen nenää."),
             dict(tyyppi="monta", vaihtoehdot=[
                 {"teksti": "Kehrää sylissä"},
                 {"teksti": "Hengittää suu auki", "oikein": True},
                 {"teksti": "Laihtuu nopeasti", "oikein": True},
                 {"teksti": "Nukkuu paljon päivällä"},
                 {"teksti": "Käy hiekkalaatikolla, mutta pissaa ei tule", "oikein": True}],
                  selitys="Suu auki hengittäminen, nopea laihtuminen ja pissavaikeudet ovat kissalla hätämerkkejä. Vanha kissa nukkuu paljon, ja se on normaalia."),
           ]),
      dict(nimi="Tähti", ikoni="🐎", tiedot="Suomenhevonen · 12 vuotta · ratsastuskoulun hevonen",
           huom="Tähti on rauhallinen ja ahkera. Se on tunneilla viitenä päivänä viikossa.",
           osat=[
             dict(tyyppi="yksi", vaihtoehdot=[
                 {"teksti": "Pelkkää kauraa kolme kertaa päivässä."},
                 {"teksti": "Paljon heinää pitkin päivää sekä kivennäisiä.", "oikein": True},
                 {"teksti": "Ämpärillinen leipää ja porkkanoita."}],
                  selitys="Hevosen vatsa on tehty syömään heinää lähes koko ajan. Liika vilja ja leipä voivat aiheuttaa vatsakipua."),
             dict(tyyppi="yksi", vaihtoehdot=[
                 {"teksti": "Karsinassa koko päivän, ettei se likaannu."},
                 {"teksti": "Laukkaa kolme tuntia joka päivä."},
                 {"teksti": "Ulkoilua tarhassa joka päivä ja ratsastustunnit.", "oikein": True}],
                  selitys="Hevonen on laumaeläin, ja sen pitää päästä ulos liikkumaan joka päivä. Liian raskas työ väsyttää ja satuttaa sitä."),
             dict(tyyppi="monta", vaihtoehdot=[
                 {"teksti": "Kavioiden puhdistus", "oikein": True},
                 {"teksti": "Kengitys joka viikko"},
                 {"teksti": "Harjaus ennen ratsastusta", "oikein": True},
                 {"teksti": "Loimi päällä aina, kesälläkin"},
                 {"teksti": "Raikasta vettä aina tarjolla", "oikein": True}],
                  selitys="Kaviot puhdistetaan ja hevonen harjataan päivittäin. Kengät uusitaan muutaman viikon välein, ei joka viikko. Kesällä loimi kuumentaa liikaa."),
             dict(tyyppi="monta", vaihtoehdot=[
                 {"teksti": "Kuopii maata ja katsoo kylkiään", "oikein": True},
                 {"teksti": "Hirnuu kaverilleen"},
                 {"teksti": "Ontuu", "oikein": True},
                 {"teksti": "Syö heinää"},
                 {"teksti": "Ei syö ja on hikinen, vaikka lepää", "oikein": True}],
                  selitys="Kuopiminen, kylkien katselu ja hikoilu levossa voivat olla vatsakivun eli ähkyn merkkejä. Ähky ja ontuminen vaativat eläinlääkäriä."),
           ]),
    ],
    kysymykset=[
        {"kysymys": "Miksi lemmikille ei saa antaa ihmisten ruokaa tai lääkkeitä?", "ammattilainen": "Klinikkaeläinhoitaja",
         "tutkinto": "Eläintenhoidon ammattitutkinto (klinikkaeläinhoitaja)", "placeholder": "Ihmisten ruoka ja lääkkeet voivat…"},
        {"kysymys": "Minkä eläimen hoitamisesta olisit itse kiinnostunut ja miksi?", "ammattilainen": "Eläintenhoitaja",
         "tutkinto": "Maatalousalan perustutkinto (eläintenhoitaja)", "placeholder": "Minua kiinnostaisi…"},
    ],
    ammattilaisetOtsikko="Eläinalan ammatteja",
    ammattilaiset=[
        {"nimi": "Eläintenhoitaja", "tehtava": "hoitaa eläimiä hoitoloissa, eläinkaupoissa ja maatiloilla", "tutkinto": "Maatalousalan perustutkinto (eläintenhoitaja)"},
        {"nimi": "Maaseutuyrittäjä", "tehtava": "hoitaa maatilaa ja sen eläimiä", "tutkinto": "Maatalousalan perustutkinto (maaseutuyrittäjä)"},
        {"nimi": "Hevostenhoitaja", "tehtava": "hoitaa hevosia talleilla", "tutkinto": "Hevostalouden perustutkinto (hevostenhoitaja)"},
        {"nimi": "Trimmaaja", "tehtava": "hoitaa koirien ja kissojen turkkia", "tutkinto": "Eläintenhoidon ammattitutkinto (trimmaaja)"},
        {"nimi": "Klinikkaeläinhoitaja", "tehtava": "hoitaa sairaita eläimiä eläinklinikalla", "tutkinto": "Eläintenhoidon ammattitutkinto (klinikkaeläinhoitaja)"},
        {"nimi": "Eläinlääkäri", "tehtava": "tutkii ja hoitaa sairaita eläimiä", "tutkinto": "Eläinlääketiede, Helsingin yliopisto"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Johdit eläinkeskuksen päivää ja teit hoitokortit kolmelle eläimelle. Samalla tutustuit eläinalan ammatteihin."

OPPILAITOKSET = ("Missä eläinalaa voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Eläinalan koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Eläinalaa voi opiskella monessa ammattiopistossa eri puolilla Suomea. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Koulutuskeskus Salpaus, Lahti", "Maatalousalan perustutkinto (eläintenhoitaja, maaseutuyrittäjä) ja hevostalouden perustutkinto (hevostenhoitaja).", "https://salpaus.fi")
    + kortti("OSAO, Oulu", "Maatalousalan perustutkinto.", "https://www.osao.fi")
    + kortti("Etsi lisää Opintopolusta", "Hae sanoilla ”maatalousalan perustutkinto” tai ”hevostalouden perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=maatalousalan%20perustutkinto")
    + """<h3>Myöhemmin</h3>
""" + kortti("Taitotalo, Helsinki", "Eläintenhoidon ammattitutkinto: esimerkiksi trimmaaja ja klinikkaeläinhoitaja.", "https://www.taitotalo.fi")
    + kortti("Helsingin yliopisto", "Eläinlääketieteellinen tiedekunta. Eläinlääkäriksi opiskellaan yliopistossa lukion tai ammattikoulun jälkeen.", "https://www.helsinki.fi")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Koirahoitola": "Nallen hoito alkoi väärin. Se rauhoittui ja alkoi syödä vasta seuraavana päivänä.",
    "Trimmaamo": "Haavan hoito viivästyi, ja omistaja harmitteli, ettei hänelle kerrottu siitä heti.",
    "Eläinklinikka": "Väärä neuvo ehti huolestuttaa omistajaa. Kissa pääsi klinikalle tuntia myöhemmin kuin olisi voinut.",
    "Navetta": "Eläinlääkärille soitettiin myöhässä. Mansikki joutui odottamaan apua turhan kauan.",
    "Talli": "Tähden tutkiminen viivästyi, ja ratsastustunti alkoi myöhässä.",
    "Lammastarha": "Lammastilan omistaja jäi epäilemään, hoidettiinko lampaat oikein. Eläinlääkäri sopi uuden tarkastuksen.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Eläimet ovat syöneet, ja ilta-aurinko paistaa tarhoihin. Kaikki eläimet voivat hyvin.",
    "Kello on <<print setup.kello($aika)>>. Eläimet ovat syöneet, ja ilta-aurinko paistaa tarhoihin. Pari eläintä tarvitsee huomenna vielä erityistä huolenpitoa.",
    "Kello on <<print setup.kello($aika)>>. Päivä oli raskas. Moni eläin tarvitsee lisähoitoa, ja eläinlääkärin puhelin soi vielä illalla.",
]
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
