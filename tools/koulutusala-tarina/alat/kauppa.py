# -*- coding: utf-8 -*-
"""Kaupan ala – "Ostajana muotimessuilla" (sisältö).
Rakenna: python3 rakenna_tarina.py alat/kauppa.py <orig kauppa-ala.html> <uusi kauppa-ala.html>

Loppuosan tehtävä on "Sisäänostajan budjetti" (TEHTAVA tyyppi "budjetti"):
oppilas ostaa nuorisovaatekaupalle kevään valikoiman 2 000 euron budjetilla 12 tuotteesta.
Peli laskee käytetyn summan, myyntiarvion, voittoarvion ja valikoiman jakauman
(trendi / perus / vastuullinen). Lopuksi oppilas perustelee kolme asiaa."""

ala = "kauppa"
alaNimi = "Kaupan ala"
tarinaNimi = "Ostajana muotimessuilla"
maailma = "kauppa"
yleisKohtaus = "halli"
katsoTeksti = "Katso messuhallia"
kello = {"alku": 9 * 60, "raja": 360}
aikaRivi = "Tilaukset olivat valmiina kello"
siirtyma = 15
siirtymaTeksti = "Seuraavalle osastolle kävelet 15 min."
kutsuTilanneOtsikko = "Tehtävä"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Tilaukset klo 15.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Muotiliikkeen tyyli: mustat paneelit, kulta ja korallinpunainen korostus
TEEMA = """:root {
  --a1: #f3c969; --a1-rgb: 243,201,105;
  --a2: #e0a83a; --a2-rgb: 224,168,58;
  --a3: #f8dc9a;
  --korostus: #ff7f8e; --korostus-rgb: 255,127,142;
  --tausta: #141218; --tausta-rgb: 20,18,24;
  --tausta-2: #221e28; --tausta-2-rgb: 34,30,40;
  --paneeli: #1b1820; --paneeli-rgb: 27,24,32;
  --paneeli-2: #29232f;
  --tumma: #0c0b0f; --tumma-rgb: 12,11,15;
  --reuna: #f3c969;
  --teksti-pehmea: #e6dfd2; --teksti-pehmea-rgb: 230,223,210;
  --teksti-vaalea: #fbf7f0;
  --nappi-teksti: #241a05;
  /* Kannen aloitusnappi samanvärinen kuin tarinan muut napit */
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #fff1cc;
  --kansi-nappi-varjo: #8a6412;
  --kansi-nappi-hehku: 243,201,105;
}
/* Vaalea messuhalli: kannen teksti tarvitsee tumman pohjan */
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.92) 0%, rgba(var(--tausta-rgb),.7) 38%, rgba(var(--tausta-rgb),.25) 62%, rgba(var(--tausta-rgb),0) 82%) !important;
}"""

KANSI = dict(pieni="Kaupan ala", otsikko="Kaupan ala",
             alaotsikko="Ostajana muotimessuilla · Mitä nuoret haluavat pukea ensi keväänä?",
             nappi="Astu messuille", ikoni="kassi")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet nuorten vaatekaupan apulaissisäänostaja. Tänään lähdet sisäänostaja Sofian kanssa muotimessuille valitsemaan kevään vaatteita. Miten sinä toimisit?",
            faktat=[("6", "ammattilaista"), ("2 000 €", "budjetti"), ("1", "oma ammattikortti")])

TARINA_ALKU = dict(nimi="Ostajana muotimessuilla", tausta="halli", teksti="""<<run setup.taustakuva("../../images/koulutusalat/kauppa-messut-tausta.webp")>><<include "HUD">>
<h1>Ostajana muotimessuilla</h1>
<p>Kello on 9.00. Olet Kolibri-vaatekaupan apulaissisäänostaja. Kauppa myy vaatteita nuorille.</p>
<p>Tänään olet sisäänostaja Sofian työparina muotimessuilla. Messuhallissa on satoja osastoja: vaatteita, kenkiä, laukkuja ja koruja.</p>
<p class="puhe"><strong>Sofia, sisäänostaja:</strong> ”Kevään tilaukset pitää lähettää kello 15. Ennen kuin ostamme mitään, mietitään, mitä asiakkaamme oikeasti haluavat.”</p>
<div class="intro-nappi"><<link "Aloita messukierros">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Trendit", tausta="trendit", otsikko="Trendiseinä", avain="ostaja",
      kysymys="Miltä sisäänostajan työ näytti?",
      johdanto="""<p>Messuhallin seinällä on suuri trendiseinä. Siinä on kymmeniä uusia värejä ja malleja.</p>
<p class="puhe"><strong>Sofia, sisäänostaja:</strong> ”Kaikkea ei voi ostaa. Miten päätämme, mitä kannattaa ostaa?”</p>""",
      valinnat=[
       dict(teksti="Katsotaan, mitä asiakkaat ovat ostaneet ja hakeneet verkkokaupasta.", aika=10, piirteet={"analyytikko": 2},
            palaute="<p><strong>Juuri näin!</strong></p><p>Myyntitiedoista näkee, että leveät farkut ja huppari myivät hyvin. Moni asiakas myös etsi verkkokaupasta kierrätysmateriaalista tehtyjä vaatteita.</p><p>Hyvä ostaja yhdistää trendit ja asiakastiedon.</p>"),
       dict(teksti="Ostetaan sitä, mikä näyttää minusta hyvältä.", aika=15, piirteet={"tyyli": 1},
            palaute="<p><strong>Oma maku on hyvä alku, mutta ei riitä.</strong></p><p>Asiakkaiden maku voi olla erilainen. Sofia avaa myyntitiedot: leveät farkut ja huppari myivät hyvin, ja moni etsi kierrätysmateriaalista tehtyjä vaatteita.</p>"),
       dict(teksti="Ostetaan samoja vaatteita kuin kilpailija.", aika=15, piirteet={},
            palaute="<p><strong>Silloin kaupat näyttävät samalta.</strong></p><p>Asiakkaalla ei ole syytä tulla juuri teille. Sofia avaa myyntitiedot ja etsii tuotteita, joita omat asiakkaat haluavat.</p>"),
      ]),
 dict(nimi="Myyntiosasto", tausta="edustaja", otsikko="Myyntiedustajan osasto", avain="edustaja",
      kysymys="Miltä myyntiedustajan työ näytti?",
      johdanto="""<p>Pysähdytte farkkumerkin osastolle. Myyntiedustaja Antti esittelee uutta mallia.</p>
<p class="puhe"><strong>Antti, myyntiedustaja:</strong> ”Jos tilaatte heti 500 paria, saatte 20 % alennusta!”</p>
<p>Kolibri myy keväällä yleensä noin 100 paria farkkuja.</p>""",
      valinnat=[
       dict(teksti="Ehdotan pienempää koe-erää, esimerkiksi 80 paria.", aika=15, piirteet={"neuvottelija": 2, "analyytikko": 1},
            palaute="<p><strong>Fiksu neuvottelu!</strong></p><p>Antti suostuu 80 parin erään ja antaa 10 % alennusta. Jos farkut myyvät hyvin, lisää voi tilata myöhemmin.</p><p>Myyntiedustaja ja ostaja etsivät ratkaisua, joka sopii molemmille.</p>"),
       dict(teksti="Tilataan 500 paria. Alennus on hyvä!", aika=10, piirteet={},
            palaute="<p><strong>Sofia pysäyttää sinut.</strong></p><p>Jos myydään vain 100 paria, 400 paria jää varastoon. Ne sitovat rahaa, ja ne pitää lopulta myydä halvalla. Sofia neuvottelee 80 parin koe-erän.</p>"),
       dict(teksti="Kieltäydytään. Alennukset ovat aina huijausta.", aika=10, piirteet={},
            palaute="<p><strong>Liian jyrkkää.</strong></p><p>Alennus voi olla hyvä, jos määrä on sopiva. Sofia neuvottelee 80 parin koe-erän ja 10 % alennuksen.</p>"),
      ]),
 dict(nimi="Vastuullisuus", tausta="vastuu", otsikko="Vastuullisuus", avain="vastuu",
      kysymys="Miltä vastuullisuusasiantuntijan työ näytti?",
      johdanto="""<p>Eräällä osastolla myydään t-paitoja vain 2 eurolla. Myyjä ei osaa kertoa, missä ja miten paidat on tehty.</p>
<p class="puhe"><strong>Noora, vastuullisuusasiantuntija:</strong> ”Halpa hinta houkuttaa. Mitä tekisit?”</p>""",
      valinnat=[
       dict(teksti="Pyydän tiedot tehtaasta ja materiaaleista ennen kuin ostamme.", aika=15, piirteet={"vastuu": 2},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Tietoja ei löydy. Noora kertoo, että silloin ei voi tietää, onko työntekijöille maksettu reilusti. Ostatte paidat toiselta toimittajalta, joka kertoo tehtaansa avoimesti.</p>"),
       dict(teksti="Ostetaan paljon. Saamme hyvän voiton.", aika=10, piirteet={},
            palaute="<p><strong>Halpa hinta voi tarkoittaa, että joku muu maksaa.</strong></p><p>Työntekijöille voidaan maksaa liian vähän, tai materiaali voi olla huonoa. Noora pyytää tiedot tehtaasta. Niitä ei löydy, joten paitoja ei osteta.</p>"),
       dict(teksti="Kysyn Nooralta, mitä vastuullisuusmerkkejä kannattaa etsiä.", aika=10, piirteet={"vastuu": 1, "neuvottelija": 1},
            palaute="<p><strong>Hyvä kysymys!</strong></p><p>Noora näyttää, millaisia merkkejä luomupuuvillasta ja reilusta työstä on. Näiltä paidoilta merkit puuttuvat, joten ostatte paidat toiselta toimittajalta.</p>"),
      ]),
 dict(nimi="Messuosasto", tausta="somistus", otsikko="Kolibrin messuosasto", avain="visualisti",
      kysymys="Miltä visualistin työ näytti?",
      johdanto="""<p>Myös Kolibrilla on messuilla oma pieni osasto. Visualisti Iiris rakentaa sitä. Kassit ovat täynnä vaatteita.</p>
<p class="puhe"><strong>Iiris, visualisti:</strong> ”Ohikulkijalla on kolme sekuntia aikaa huomata meidät. Miten vaatteet kannattaa laittaa esille?”</p>""",
      valinnat=[
       dict(teksti="Puetaan mallinukelle valmis asu ja valitaan väreiksi kaksi pääväriä.", aika=15, piirteet={"tyyli": 2},
            palaute="<p><strong>Ammattilaisen ote!</strong></p><p>Kun asukokonaisuus on valmis, asiakas näkee heti, miten vaatteita voi yhdistää. Selkeät värit erottuvat kauas.</p>"),
       dict(teksti="Laitetaan kaikki vaatteet esille, niin valikoima näkyy.", aika=15, piirteet={},
            palaute="<p><strong>Liian täynnä.</strong></p><p>Kun kaikkea on paljon, mikään ei erotu. Iiris valitsee yhden asukokonaisuuden mallinukelle ja kaksi pääväriä.</p>"),
       dict(teksti="Kysytään ohikulkijoilta, mikä osastoissa houkuttelee.", aika=15, piirteet={"tyyli": 1, "neuvottelija": 1},
            palaute="<p><strong>Kiinnostava idea!</strong></p><p>Moni sanoo, että valmis asu mallinukella houkuttelee eniten. Iiris pukee mallinuken ja valitsee kaksi pääväriä.</p>"),
      ]),
 dict(nimi="Kuvausstudio", tausta="verkko", otsikko="Kuvausstudio", avain="verkkokauppa",
      kysymys="Miltä verkkokauppa-asiantuntijan työ näytti?",
      johdanto="""<p>Messuilla on pieni kuvausstudio. Siellä uudet vaatteet kuvataan verkkokauppaa varten.</p>
<p class="puhe"><strong>Joona, verkkokauppa-asiantuntija:</strong> ”Asiakas ei voi verkkokaupassa koskea vaatteeseen. Mitä tuotesivulle pitää kirjoittaa?”</p>""",
      valinnat=[
       dict(teksti="Mitat, materiaali, pesuohje ja kuvia joka puolelta.", aika=15, piirteet={"analyytikko": 1, "vastuu": 1},
            palaute="<p><strong>Täydellistä!</strong></p><p>Kun tiedot ovat tarkat, asiakas valitsee oikean koon. Silloin palautuksia tulee vähemmän, ja se säästää rahaa ja luontoa.</p>"),
       dict(teksti="Lyhyt teksti: ”Ihana ja trendikäs!”", aika=10, piirteet={},
            palaute="<p><strong>Asiakas ei tiedä, sopiiko koko.</strong></p><p>Moni tilaa monta kokoa ja palauttaa osan. Joona lisää tuotesivulle mitat, materiaalin ja pesuohjeen.</p>"),
       dict(teksti="Kuvataan vaate mallin päällä ja kerrotaan mallin pituus.", aika=15, piirteet={"tyyli": 1, "analyytikko": 1},
            palaute="<p><strong>Hyvä idea!</strong></p><p>Kun asiakas näkee vaatteen ihmisen päällä, hän ymmärtää sen koon. Joona lisää vielä mitat, materiaalin ja pesuohjeen.</p>"),
      ]),
 dict(nimi="Varasto", tausta="varasto", otsikko="Messujen varasto", avain="varasto",
      kysymys="Miltä varastonhoitajan työ näytti?",
      johdanto="""<p>Messujen varastoon tulee laatikoita näytevaatteita. Lähetysluettelon mukaan huppareita pitäisi olla 40. Laatikoissa on vain 32.</p>
<p class="puhe"><strong>Kim, varastonhoitaja:</strong> ”Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Kirjataan puuttuvat hupparit ja ilmoitetaan toimittajalle.", aika=15, piirteet={"analyytikko": 2},
            palaute="<p><strong>Oikein toimittu!</strong></p><p>Toimittaja huomaa, että yksi laatikko jäi heidän varastoonsa. Se lähetetään perään, eikä Kolibri maksa tuotteista, joita ei tullut.</p>"),
       dict(teksti="Kuitataan lähetys vastaanotetuksi. Ei se niin tarkkaa ole.", aika=10, piirteet={},
            palaute="<p><strong>Silloin Kolibri maksaa myös puuttuvista huppareista.</strong></p><p>Kim laskee laatikot uudelleen ja kirjaa puutteen. Toimittaja lähettää puuttuvan laatikon perään.</p>"),
       dict(teksti="Lasken laatikot vielä kerran itse.", aika=15, piirteet={"analyytikko": 1},
            palaute="<p><strong>Tarkistus on hyvä alku.</strong></p><p>Huppareita on edelleen 32. Kim kirjaa puutteen ja ilmoittaa toimittajalle. Puuttuva laatikko lähetetään perään.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Tilaukset lähtevät", teksti="""<h1>Messupäivä päättyy</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Sofia lähettää kevään tilaukset ajoissa.</p>
<p>Keväällä Kolibrin hyllyillä on leveitä farkkuja, huppareita ja luomupuuvillaisia t-paitoja. Moni niistä on valittu messuilla.</p>
<p>Huomasitko? Kevään valikoimaan tarvittiin kuusi eri ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Sofia, sisäänostaja</strong> – päätti, mitä ostetaan</li>
<li><strong>Antti, myyntiedustaja</strong> – myi farkkuja ja neuvotteli hinnan</li>
<li><strong>Noora, vastuullisuusasiantuntija</strong> – selvitti, miten vaatteet on tehty</li>
<li><strong>Iiris, visualisti</strong> – teki osastosta houkuttelevan</li>
<li><strong>Joona, verkkokauppa-asiantuntija</strong> – teki tuotesivuista selkeitä</li>
<li><strong>Kim, varastonhoitaja</strong> – piti huolen, että kaikki tuotteet tulivat perille</li>
</ul>
<p>Kaupan alalle voi opiskella ammattikoulussa: merkonomiksi liiketoiminnan perustutkinnossa ja varastonhoitajaksi logistiikan perustutkinnossa. Monet jatkavat sen jälkeen tradenomiksi.</p>""")

PIIRTEET = {
 "analyytikko": {"nimi": "Laskelmoija", "kuvaus": "Päätät faktojen ja lukujen perusteella."},
 "tyyli": {"nimi": "Tyylitaituri", "kuvaus": "Näet, mikä näyttää hyvältä ja houkuttelee asiakkaita."},
 "neuvottelija": {"nimi": "Neuvottelija", "kuvaus": "Etsit ratkaisun, joka sopii kaikille."},
 "vastuu": {"nimi": "Vastuullinen valitsija", "kuvaus": "Mietit, miten tuotteet on tehty."},
}

LT = "Liiketoiminnan perustutkinto (merkonomi)"
AMMATIT = {
 "ostaja": {"nimi": "Sisäänostaja", "kuvaus": "Päättää, mitä tuotteita kauppa ostaa myyntiin.",
            "tutkinto": "Tradenomi (AMK). Alkuun pääsee merkonomina", "piirteet": ["analyytikko", "tyyli"]},
 "edustaja": {"nimi": "Myyntiedustaja", "kuvaus": "Myy tuotteita kaupoille ja neuvottelee hinnoista.",
              "tutkinto": LT, "piirteet": ["neuvottelija", "analyytikko"]},
 "vastuu": {"nimi": "Vastuullisuusasiantuntija", "kuvaus": "Selvittää, miten ja missä tuotteet on tehty.",
            "tutkinto": "Esimerkiksi tradenomi (AMK)", "piirteet": ["vastuu", "analyytikko"]},
 "visualisti": {"nimi": "Visualisti", "kuvaus": "Suunnittelee näyteikkunat ja myymälän ilmeen.",
                "tutkinto": "Taideteollisuusalan perustutkinto", "piirteet": ["tyyli", "neuvottelija"]},
 "verkkokauppa": {"nimi": "Verkkokauppa-asiantuntija", "kuvaus": "Pitää verkkokaupan tuotesivut ja kampanjat kunnossa.",
                  "tutkinto": LT + ", jatkossa esimerkiksi tradenomi (AMK)", "piirteet": ["analyytikko", "tyyli"]},
 "varasto": {"nimi": "Varastonhoitaja", "kuvaus": "Vastaanottaa, tarkistaa ja lähettää tuotteita.",
             "tutkinto": "Logistiikan perustutkinto (varastonhoitaja)", "piirteet": ["analyytikko", "vastuu"]},
}

KUTSU_JOHDANTO = "Tarinassa näit, miten sisäänostaja Sofia valitsi kevään vaatteet. Nyt sinä olet Kolibrin sisäänostaja!"

TEHTAVA = dict(
    tyyppi="budjetti",
    nimi="Sisäänostajan budjetti", tag="Tehtävä · noin 25 min",
    maara="<strong>2 000 euroa</strong> ja 12 tuotetta, joista valita",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Osta kevään valikoima. Pysy budjetissa ja valitse vähintään viisi eri tuotetta.",
              "Vastaa kolmeen kysymykseen ja perustele valintasi."],
    lopuksi="Peli laskee, paljonko myyt ja paljonko voittoa saat. Laskut ovat yksinkertaistettuja: verot ja muut kulut eivät ole mukana. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Tilausvahvistuksesi",
    budjetti=2000, askel=5, maxMaara=60, minKaytto=1500, minTuotteita=5,
    ostoOhje="Kolibri on nuorten vaatekauppa. Osta kevään valikoima 2 000 eurolla. Lisää tuotteita viiden kappaleen erissä. Kokeile rohkeasti: voit muuttaa määriä niin monta kertaa kuin haluat.",
    tilanneOtsikko="Sinä olet sisäänostaja",
    osa1="Osa 1/2 · Ostot", osa2="Osa 2/2 · Perustelut",
    valmisOstot="Lähetä tilaus", takaisinOstoihin="Muokkaa ostoja", valmisNappi="Katso tilausvahvistus",
    perusteluOtsikko="Tilaus on lähetetty!", perusteluOhje="Vastaa vielä kolmeen kysymykseen. Kirjoita jokaiseen yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="TILAUSVAHVISTUS · KEVÄT", kauppaNimi="Kolibri-vaatekauppa",
    ryhmat={"trendi": {"nimi": "Trendi", "vari": "#ff7f8e"},
            "perus": {"nimi": "Perus", "vari": "#8ec5ff"},
            "vastuullinen": {"nimi": "Vastuullinen", "vari": "#8ce99a"}},
    tavoitteet=[
        {"ryhma": "perus", "min": 25, "ok": "Perustuotteita on hyvin. Ne myyvät varmasti.",
         "alle": "perustuotteita on vähän. Hupparit, t-paidat ja sukat myyvät joka kevät."},
        {"ryhma": "vastuullinen", "min": 20, "ok": "Vastuullisia tuotteita on vähintään viidennes. Moni asiakas etsii niitä.",
         "alle": "vastuullisia tuotteita on alle 20 %. Moni asiakas etsi niitä verkkokaupasta."},
        {"ryhma": "trendi", "max": 50, "ok": "Trendituotteita on sopivasti.",
         "yli": "yli puolet on trendituotteita. Jos trendi vaihtuu, osa jää myymättä."},
    ],
    kysymykset=[
        {"kysymys": "Käytit eniten rahaa tuotteeseen: {top}. Miksi?", "ammattilainen": "Sisäänostaja",
         "tutkinto": "Tradenomi (AMK). Alkuun pääsee merkonomina", "placeholder": "Ostin tätä eniten, koska…"},
        {"kysymys": "Asiakas kysyy, miksi vastuullinen t-paita on kalliimpi kuin halpa paita. Mitä vastaat?", "ammattilainen": "Myyjä",
         "tutkinto": LT, "placeholder": "Kertoisin asiakkaalle, että…"},
        {"kysymys": "Osa tuotteista jää myymättä. Mitä teet niille?", "ammattilainen": "Myymäläpäällikkö",
         "tutkinto": "Esimerkiksi merkonomi ja työkokemus tai tradenomi (AMK)", "placeholder": "Myymättä jääneet tuotteet…"},
    ],
)

# Tuotteet (KUTSU_KORTIT). osto/myynti euroina, menekki = arvio myytävästä osuudesta.
KUTSU_KORTIT = [
 {"nimi": "Leveälahkeiset farkut", "ikoni": "👖", "kuvaus": "Kevään kuumin farkkumalli.", "osto": 22, "myynti": 59, "ryhma": "trendi", "trendi": 3, "vastuu": 1, "menekki": 0.8},
 {"nimi": "Valkoinen t-paita", "ikoni": "👕", "kuvaus": "Perusmalli, joka sopii kaikkeen.", "osto": 4, "myynti": 15, "ryhma": "perus", "trendi": 1, "vastuu": 1, "menekki": 0.95},
 {"nimi": "Luomupuuvillainen t-paita", "ikoni": "🌱", "kuvaus": "Reilusti tehty luomupaita.", "osto": 7, "myynti": 22, "ryhma": "vastuullinen", "trendi": 1, "vastuu": 3, "menekki": 0.9},
 {"nimi": "Kierrätysmateriaalitakki", "ikoni": "🧥", "kuvaus": "Kevyt takki kierrätetystä polyesteristä.", "osto": 38, "myynti": 99, "ryhma": "vastuullinen", "trendi": 2, "vastuu": 3, "menekki": 0.6},
 {"nimi": "Lippis", "ikoni": "🧢", "kuvaus": "Lippis, jossa on iso logo.", "osto": 6, "myynti": 25, "ryhma": "trendi", "trendi": 2, "vastuu": 1, "menekki": 0.7},
 {"nimi": "Paksupohjaiset tennarit", "ikoni": "👟", "kuvaus": "Somessa nähty kenkämalli.", "osto": 30, "myynti": 79, "ryhma": "trendi", "trendi": 3, "vastuu": 1, "menekki": 0.75},
 {"nimi": "Collegeshortsit", "ikoni": "🩳", "kuvaus": "Mukavat shortsit kesään.", "osto": 9, "myynti": 29, "ryhma": "perus", "trendi": 1, "vastuu": 2, "menekki": 0.85},
 {"nimi": "Neuleliivi", "ikoni": "🧶", "kuvaus": "Retrohenkinen liivi. Rohkea valinta!", "osto": 14, "myynti": 45, "ryhma": "trendi", "trendi": 3, "vastuu": 2, "menekki": 0.55},
 {"nimi": "Reppu kierrätysmuovista", "ikoni": "🎒", "kuvaus": "Tehty kierrätetyistä muovipulloista.", "osto": 15, "myynti": 45, "ryhma": "vastuullinen", "trendi": 2, "vastuu": 3, "menekki": 0.7},
 {"nimi": "Sukat (3 paria)", "ikoni": "🧦", "kuvaus": "Värikkäät sukat kolmen parin pakkauksessa.", "osto": 3, "myynti": 12, "ryhma": "perus", "trendi": 1, "vastuu": 2, "menekki": 0.95},
 {"nimi": "Neonaurinkolasit", "ikoni": "🕶️", "kuvaus": "Viraalituote: voi myydä loppuun tai jäädä hyllyyn.", "osto": 4, "myynti": 19, "ryhma": "trendi", "trendi": 3, "vastuu": 1, "menekki": 0.4},
 {"nimi": "Collegehuppari", "ikoni": "👚", "kuvaus": "Pehmeä huppari, joka myy joka vuosi.", "osto": 12, "myynti": 39, "ryhma": "perus", "trendi": 1, "vastuu": 2, "menekki": 0.9},
]

LOPPU_TEKSTI = "Kävit muotimessuilla ja ostit kaupalle oman kevään valikoiman. Samalla tutustuit kahdeksaan kaupan alan ammattiin."

# Taustakuvat: etusivu (kansi + aloitussivu) ja tehtävän sivut
TAUSTAKUVAT = {"kansi": "../../images/koulutusalat/kauppa-messut-tausta.webp",
               "alku": "../../images/koulutusalat/kauppa-messut-tausta.webp",
               "tehtava": "../../images/koulutusalat/kauppa-myymala-tausta.webp"}

OPPILAITOKSET = ("Missä kaupan alaa voi opiskella?", "Toinen aste")
SAILYTA = ["Toinen aste", "Korkeakoulut"]
SAILYTA_KORVAUKSET = [('<<link "Jatka ammattitehtävään" "Ammattitehtävä">><</link>>', '<<link "Takaisin" "Loppu">><</link>>')]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Trendit": "Tuotevalinnat piti aloittaa alusta myyntitiedoista.",
    "Myyntiosasto": "Neuvottelu meni ensin väärään suuntaan. Sofia joutui korjaamaan tilannetta.",
    "Vastuullisuus": "Halpojen paitojen selvittäminen vei aikaa, ja kaupat jäivät syntymättä.",
    "Messuosasto": "Osasto piti rakentaa uudelleen. Ensimmäiset asiakkaat kävelivät ohi.",
    "Kuvausstudio": "Tuotesivu piti kirjoittaa uudelleen. Verkkokaupan avaaminen viivästyi.",
    "Varasto": "Varaston kirjanpitoa piti korjata, ja puuttuvien huppareiden selvittäminen vei aikaa.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Sofia lähettää kevään tilaukset ajoissa. Kolibrin kevätmallisto on vastuullinen ja houkutteleva!",
    "Kello on <<print setup.kello($aika)>>. Sofia lähettää kevään tilaukset, mutta muutama asia meni vikaan. Kevään myynnistä tulee hyvä, muttei huippu.",
    "Kello on <<print setup.kello($aika)>>. Messupäivä meni moneen kertaan pieleen. Kolibrin kevätmyynti jää tavoitteesta.",
]
MYOHASSA = "Tilaukset lähtivät myöhässä, ja osa tuotteista ehti loppua tehtaalta."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
