# -*- coding: utf-8 -*-
"""Turvallisuusala – "Yövuoro satamakaupungissa" (sisältö). Uusi ala.
Rakenna: python3 rakenna_tarina.py alat/turvallisuus.py <orig palvelu-ala.html> <uusi turvallisuus-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on hätäkeskuksen vuoroesimies. Tarina kulkee yhden yön klo 22–6 (kohtauksilla lisäaika).
Ammatit: vartija, järjestyksenvalvoja, hätäkeskuspäivystäjä, pelastaja, poliisi ja vanginvartija.
Loppuosan tehtävä on "Hätäpuhelu" (TEHTAVA tyyppi "hatapuhelu"): oppilas hoitaa kolme puhelua,
valitsee kysymykset, yksiköt, kiireellisyyden ja neuvon soittajalle."""

ala = "turvallisuus"
alaNimi = "Turvallisuusala"
tarinaNimi = "Yövuoro satamakaupungissa"
maailma = "satama"
yleisKohtaus = "satama"
katsoTeksti = "Katso satamaa"
kello = {"alku": 22 * 60, "raja": 9 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Turvallisuusala", "ifid": "833477fd-68f4-431c-9f95-99602205b1cb"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Vuoro päättyy klo 7.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Yön värit: tumma yönsininen, hälytyssininen ja hälytyspunainen
TEEMA = """:root {
  --a1: #5aa9ff; --a1-rgb: 90,169,255;
  --a2: #ff5a5a; --a2-rgb: 255,90,90;
  --a3: #b8dcff;
  --korostus: #ffd43b; --korostus-rgb: 255,212,59;
  --tausta: #0b1424; --tausta-rgb: 11,20,36;
  --tausta-2: #13203a; --tausta-2-rgb: 19,32,58;
  --paneeli: #111c30; --paneeli-rgb: 17,28,48;
  --paneeli-2: #1a2a44;
  --tumma: #070d18; --tumma-rgb: 7,13,24;
  --reuna: #5aa9ff;
  --teksti-pehmea: #d6e2f0; --teksti-pehmea-rgb: 214,226,240;
  --teksti-vaalea: #f8fafc;
  --nappi-teksti: #04142c;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a1), #8fc6ff);
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #d8ecff;
  --kansi-nappi-varjo: #123a6a;
  --kansi-nappi-hehku: 90,169,255;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Turvallisuusala", otsikko="Turvallisuusala",
             alaotsikko="Yövuoro satamakaupungissa · Kuka pitää kaupungin turvassa, kun muut nukkuvat?",
             nappi="Aloita yövuoro", ikoni="kilpi")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet hätäkeskuksen vuoroesimies. Yön aikana satamakaupungissa tapahtuu kaikenlaista. Seuraat, miten turvallisuusalan ammattilaiset hoitavat tilanteet. Joka kerta päätät, mikä on paras tapa toimia.",
            faktat=[("6", "ammattilaista"), ("1", "yö"), ("112", "hätänumero")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "turva-satama-tausta.webp",
               "alku": KUVA + "turva-kierros-tausta.webp",
               "tehtava": KUVA + "turva-hatakeskus-tausta.webp",
               "kortti": KUVA + "turva-hatakeskus-tausta.webp",
               "loppu": [KUVA + "turva-satama-tausta.webp", KUVA + "turva-poliisi-tausta.webp", KUVA + "turva-kierros-tausta.webp"],
               "oppilaitokset": [KUVA + "turva-vankila-tausta.webp", KUVA + "turva-satama-tausta.webp"]}

TARINA_ALKU = dict(nimi="Yövuoro alkaa", tausta="satama", teksti="""<<include "HUD">>
<h1>Yövuoro alkaa</h1>
<p>Kello on 22.00. Istut hätäkeskuksessa. Olet vuoroesimies eli johdat yövuoroa.</p>
<p>Hätäkeskukseen tulevat kaikki numeroon 112 soitetut puhelut. Päivystäjät päättävät, keitä paikalle lähetetään: pelastajat, ensihoidon vai poliisin.</p>
<p>Tänä yönä seuraat myös, miten muut turvallisuusalan ammattilaiset tekevät työtään satamakaupungissa.</p>
<p class="puhe"><strong>Noora, hätäkeskuspäivystäjä:</strong> ”Kahvi on keitetty. Nyt alkaa yö!”</p>
<div class="intro-nappi"><<link "Aloita vuoro">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Sataman portti", tausta="portti", otsikko="Rikkinäinen lukko", avain="vartija",
      taustakuva=KUVA + "turva-kierros-tausta.webp",
      kysymys="Miltä vartijan työ näytti?", lisaaika=50, siirtymaTeksti="Seuraava tilanne on vähän ennen puoltayötä.",
      johdanto="""<p>Vartija Emma tekee kierrosta sataman konttialueella. Hän huomaa, että portin lukko on rikottu.</p>
<p>Konttien välissä liikkuu kaksi ihmistä taskulamppujen kanssa. Emma soittaa hätäkeskukseen.</p>
<p class="puhe"><strong>Emma, vartija:</strong> ”Täällä on joku. Menenkö puhumaan heille?”</p>""",
      valinnat=[
       dict(teksti="Emma pysyy turvallisen matkan päässä ja kertoo puhelimessa, mitä näkee. Poliisi lähtee paikalle.", aika=40, piirteet={"turva": 2, "tarkka": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Vartijan tärkeä tehtävä on huomata asioita ja ilmoittaa niistä. Poliisi saa kiinni kaksi ihmistä, jotka yrittivät murtautua konttiin. Kukaan ei loukkaantunut.</p>"),
       dict(teksti="Emma menee yksin konttien väliin ja ottaa heidät kiinni.", tyyli="rohkea", aika=40, piirteet={},
            palaute="<p><strong>Vaarallista!</strong></p><p>Pimeässä yksin voi joutua vaaraan. Emma ei tiedä, onko murtautujilla aseita. Hän jää odottamaan poliisia turvallisen matkan päähän.</p>"),
       dict(teksti="Emma huutaa kauempaa, ettei alueelle saa tulla, ja soittaa sitten poliisille.", tyyli="suora", aika=30, piirteet={"turva": 1}, palaute="<p><strong>Rohkeaa, mutta riskialtista.</strong></p><p>Huutaminen paljastaa Emman paikan, ja murtautujat ehtivät karata. Vartija pysyy turvassa, seuraa tilannetta ja kertoo poliisille, mitä näkee.</p>"),
      ]),
 dict(nimi="Klubin ovi", tausta="klubi", otsikko="Ovella jonoa", avain="jarjestyksenvalvoja",
      taustakuva=KUVA + "turva-satama-tausta.webp",
      kysymys="Miltä järjestyksenvalvojan työ näytti?", lisaaika=40, siirtymaTeksti="Seuraava tilanne on yhden aikaan yöllä.",
      johdanto="""<p>Nuorten klubilla on keikka. Siellä ei myydä alkoholia. Järjestyksenvalvoja Sami seisoo ovella.</p>
<p>Jonossa on nuori, joka on selvästi humalassa. Hän horjuu ja puhuu sekavasti. Kaverit pyytävät, että hänet päästetään sisään.</p>
<p class="puhe"><strong>Sami, järjestyksenvalvoja:</strong> ”Mitä tässä kannattaa tehdä?”</p>""",
      valinnat=[
       dict(teksti="Sami ei päästä nuorta sisään. Hän puhuu rauhallisesti ja huolehtii, että nuori pääsee turvallisesti kotiin. Hän soittaa nuoren huoltajalle.", aika=45, piirteet={"kuuntelija": 2, "turva": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Järjestyksenvalvoja pitää huolta myös siitä, ettei kukaan jää yksin huonoon kuntoon. Nuoren äiti tulee hakemaan hänet kotiin.</p>"),
       dict(teksti="Sami päästää hänet sisään, koska kaverit lupaavat pitää hänestä huolta.", tyyli="empaattinen", aika=30, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Humalassa olevaa ei päästetä tapahtumaan. Hän voi satuttaa itseään tai muita. Sami ohjaa nuoren ulos ja soittaa hänen huoltajalleen.</p>"),
       dict(teksti="Sami käskee nuoren lähteä yksin kotiin.", tyyli="suora", aika=30, piirteet={},
            palaute="<p><strong>Vaarallista.</strong></p><p>Humalainen nuori voi kaatua, eksyä tai joutua vaaraan. Sami pysäyttää hänet ja soittaa hänen huoltajalleen.</p>"),
      ]),
 dict(nimi="Hätäpuhelu yöllä", tausta="112", otsikko="Lapsi soittaa", avain="hatakeskus",
      taustakuva=KUVA + "turva-hatakeskus-tausta.webp",
      kysymys="Miltä hätäkeskuspäivystäjän työ näytti?", lisaaika=45, siirtymaTeksti="Seuraava tilanne on kolmen aikaan yöllä.",
      johdanto="""<p>Hätäkeskuksessa on hiljaista. Sitten päivystäjä Noora saa puhelun.</p>
<p>Soittaja on noin 10-vuotias lapsi. Hän itkee niin, että sanoista on vaikea saada selvää: ”Äiti kaatui eikä herää!”</p>
<p class="puhe"><strong>Noora, hätäkeskuspäivystäjä:</strong> ”Mitä kysyn ensin?”</p>""",
      valinnat=[
       dict(teksti="Noora kysyy ensin osoitteen ja sitten, mitä tapahtui. Hän puhuu rauhallisesti ja lyhyin lausein.", aika=45, piirteet={"rauhallinen": 2, "tarkka": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Kun osoite on tiedossa, ensihoito voi lähteä heti, vaikka puhelu katkeaisi. Noora neuvoo lasta katsomaan, hengittääkö äiti. Hän pysyy puhelimessa, kunnes ensihoitajat ovat perillä.</p>"),
       dict(teksti="Noora rauhoittaa ensin lasta pitkään ja kysyy sitten osoitteen.", tyyli="empaattinen", aika=45, piirteet={"rauhallinen": 1}, palaute="<p><strong>Rauhallisuus on tärkeää, mutta osoite ensin.</strong></p><p>Jos puhelu katkeaa, apu ei löydä perille. Noora kysyy osoitteen heti ja rauhoittaa lasta sen jälkeen. Silloin ensihoito on jo matkalla.</p>"),
       dict(teksti="Noora käskee lasta tiukasti lopettamaan itkemisen.", tyyli="suora", aika=40, piirteet={},
            palaute="<p><strong>Ei auta.</strong></p><p>Pelästynyt lapsi rauhoittuu, kun aikuinen puhuu itse rauhallisesti. Noora vaihtaa äänensävyä ja kysyy ensin osoitteen.</p>"),
      ]),
 dict(nimi="Tulipalo satamassa", tausta="palo", otsikko="Savua varastosta", avain="pelastaja",
      kysymys="Miltä pelastajan työ näytti?", lisaaika=30, siirtymaTeksti="Seuraava tilanne on neljän aikaan aamuyöllä.",
      johdanto="""<p>Sataman varastohallista nousee paksua savua. Pelastajat ajavat paikalle.</p>
<p>Hallin omistaja juoksee pelastaja Jussin luo. ”Toimistossa on läppäri, jossa on koko firman tiedot! Haen sen nopeasti!”</p>
<p class="puhe"><strong>Jussi, pelastaja:</strong> ”Miten toimitaan?”</p>""",
      valinnat=[
       dict(teksti="Kukaan ei mene palavaan halliin ilman suojavarusteita. Savusukeltajat tarkistavat ensin, onko sisällä ihmisiä.", aika=60, piirteet={"turva": 2, "rauhallinen": 1},
            palaute="<p><strong>Oikein!</strong></p><p>Palon savu on myrkyllistä. Jo muutama hengenveto voi viedä tajun. Pelastajat sammuttavat palon, eikä kukaan loukkaannu. Tavaran voi korvata, ihmistä ei.</p>"),
       dict(teksti="Omistaja saa käydä nopeasti, kun hän pitää märkää huivia suun edessä.", tyyli="empaattinen", aika=45, piirteet={},
            palaute="<p><strong>Hengenvaarallista!</strong></p><p>Märkä huivi ei suojaa myrkylliseltä savulta. Jussi pysäyttää omistajan, ja savusukeltajat menevät halliin.</p>"),
       dict(teksti="Jussi juoksee itse hakemaan läppärin ilman paria.", tyyli="rohkea", aika=45, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Pelastajat menevät savuun aina parina ja oikeilla varusteilla. Ihmisten pelastaminen on tärkeämpää kuin tavarat.</p>"),
      ]),
 dict(nimi="Yöpartio", tausta="partio", otsikko="Kadonnut nuori", avain="poliisi",
      taustakuva=KUVA + "turva-poliisi-tausta.webp",
      kysymys="Miltä poliisin työ näytti?", lisaaika=15, siirtymaTeksti="Seuraava tilanne on viiden aikaan aamulla.",
      johdanto="""<p>Poliisipartio saa tehtävän: 14-vuotias nuori on ilmoitettu kadonneeksi.</p>
<p>Poliisi Aleksi löytää hänet istumasta yksin laiturin reunalta. Nuori on kylmissään. Hän sanoo, ettei halua mennä kotiin.</p>
<p class="puhe"><strong>Aleksi, poliisi:</strong> ”Miten tästä jatketaan?”</p>""",
      valinnat=[
       dict(teksti="Aleksi istuu viereen ja kysyy rauhallisesti, mitä on tapahtunut. Hän tarjoaa lämmintä paikkaa autosta ja kertoo huoltajille, että nuori on löytynyt.", aika=45, piirteet={"kuuntelija": 2, "rauhallinen": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Poliisin työ on myös auttamista. Nuori kertoo riidasta kotona. Sosiaalipäivystyksen työntekijä tulee juttelemaan, ja nuori pääsee turvaan.</p>"),
       dict(teksti="Aleksi vie nuoren heti kotiin kysymättä mitään.", tyyli="nopea", aika=30, piirteet={},
            palaute="<p><strong>Liian nopeasti.</strong></p><p>Jos kotona on jotain vakavaa, nuori ei ehkä ole siellä turvassa. Aleksi pysähtyy ja kuuntelee nuorta ensin.</p>"),
       dict(teksti="Aleksi soittaa heti huoltajille ja pyytää heitä hakemaan nuoren laiturilta.", tyyli="kaytannollinen", aika=30, piirteet={"rauhallinen": 1}, palaute="<p><strong>Huoltajille kerrotaan, mutta ensin kuunnellaan.</strong></p><p>Nuori sanoi, ettei halua mennä kotiin. Jos kotona on jotain vakavaa, hän ei ehkä ole siellä turvassa. Aleksi kysyy ensin rauhassa, mitä on tapahtunut.</p>"),
      ]),
 dict(nimi="Aamu vankilassa", tausta="vankila", otsikko="Levoton aamu", avain="vanginvartija",
      taustakuva=KUVA + "turva-vankila-tausta.webp",
      kysymys="Miltä vanginvartijan työ näytti?",
      johdanto="""<p>Vanginvartija Leila tekee aamukierrosta vankilassa.</p>
<p>Vanki Tomi on ollut levoton koko yön. Hän vapautuu tänään, mutta hän ei tiedä, missä nukkuu ensi yönä. Tomi lyö sellin ovea ja huutaa.</p>
<p class="puhe"><strong>Leila, vanginvartija:</strong> ”Mitä teen?”</p>""",
      valinnat=[
       dict(teksti="Leila puhuu rauhallisesti ja kuuntelee. Hän lupaa, että Tomi pääsee aamulla puhumaan sosiaalityöntekijän kanssa asunnosta.", aika=45, piirteet={"kuuntelija": 2, "rauhallinen": 1},
            palaute="<p><strong>Hyvä!</strong></p><p>Vanginvartija huolehtii turvallisuudesta, mutta hän myös tukee vankia uuteen elämään. Kun Tomilla on asunto ja suunnitelma, hän ei palaa niin helposti rikosten pariin.</p>"),
       dict(teksti="Leila ei vastaa mitään. Kyllä Tomi rauhoittuu itsekseen.", tyyli="luottavainen", aika=30, piirteet={},
            palaute="<p><strong>Ei hyvä.</strong></p><p>Kun kukaan ei kuuntele, tilanne voi pahentua. Leila menee puhumaan Tomille.</p>"),
       dict(teksti="Leila sanoo Tomille, että asunnon etsiminen on hänen oma asiansa.", tyyli="suora", aika=30, piirteet={}, palaute="<p><strong>Ei auta.</strong></p><p>Vanginvartijan työhön kuuluu myös vangin tukeminen uuteen elämään. Ilman asuntoa Tomi voi helposti palata rikosten pariin. Leila rauhoittaa tilanteen ja järjestää tapaamisen sosiaalityöntekijän kanssa.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Aamu valkenee", teksti="""<h1>Aamu valkenee</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Yövuoro on melkein ohi!</p>
<p>Aurinko nousee sataman ylle. Aamuvuoro tulee töihin, ja sinä kerrot, mitä yöllä tapahtui.</p>
<p>Huomasitko? Kaupungin turvallisuudesta huolehti yön aikana monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Emma, vartija</strong> – huomasi murron ja ilmoitti siitä</li>
<li><strong>Sami, järjestyksenvalvoja</strong> – huolehti, että humalainen nuori pääsi turvaan</li>
<li><strong>Noora, hätäkeskuspäivystäjä</strong> – auttoi lasta puhelimessa</li>
<li><strong>Jussi, pelastaja</strong> – sammutti palon turvallisesti</li>
<li><strong>Aleksi, poliisi</strong> – löysi kadonneen nuoren ja kuunteli häntä</li>
<li><strong>Leila, vanginvartija</strong> – rauhoitti vangin ja auttoi häntä eteenpäin</li>
</ul>
<p>Vartijaksi ja järjestyksenvalvojaksi voi opiskella ammattikoulussa turvallisuusalan perustutkinnossa. Pelastajaksi, hätäkeskuspäivystäjäksi, poliisiksi ja vanginvartijaksi haetaan vasta, kun sinulla on jo toisen asteen tutkinto eli ammattikoulun tai lukion tutkinto.</p>""")

PIIRTEET = {
 "turva": {"nimi": "Turvallisuus ensin", "kuvaus": "Et ota turhia riskejä. Mietit ensin, miten kukaan ei loukkaannu."},
 "rauhallinen": {"nimi": "Rauhallinen", "kuvaus": "Pysyt rauhallisena, vaikka ympärillä on hätä ja hälinä."},
 "kuuntelija": {"nimi": "Hyvä kohtaaja", "kuvaus": "Kuuntelet ihmisiä ja kohtaat heidät kunnioittavasti."},
 "tarkka": {"nimi": "Tarkka", "kuvaus": "Huomaat tärkeät asiat ja kerrot ne selkeästi eteenpäin."},
}

AMMATIT = {
 "vartija": {"nimi": "Vartija", "kuvaus": "Valvoo kiinteistöjä ja alueita, tekee kierroksia ja ilmoittaa poikkeamista.",
             "tutkinto": "Turvallisuusalan perustutkinto (turvallisuusvalvoja)", "piirteet": ["turva", "tarkka"]},
 "jarjestyksenvalvoja": {"nimi": "Järjestyksenvalvoja", "kuvaus": "Pitää yllä järjestystä tapahtumissa, ravintoloissa ja konserteissa.",
                         "tutkinto": "Turvallisuusalan perustutkinto (turvallisuusvalvoja)", "piirteet": ["kuuntelija", "turva"]},
 "hatakeskus": {"nimi": "Hätäkeskuspäivystäjä", "kuvaus": "Vastaa hätänumeroon 112, arvioi tilanteen ja lähettää apua paikalle.",
                "tutkinto": "Hätäkeskuspäivystäjätutkinto, Pelastusopisto (1,5 vuotta)", "piirteet": ["rauhallinen", "tarkka"]},
 "pelastaja": {"nimi": "Pelastaja", "kuvaus": "Sammuttaa paloja ja auttaa onnettomuuksissa, esimerkiksi liikenteessä ja vesillä.",
               "tutkinto": "Pelastajatutkinto, Pelastusopisto (1,5 vuotta)", "piirteet": ["turva", "rauhallinen"]},
 "poliisi": {"nimi": "Poliisi", "kuvaus": "Ylläpitää yleistä järjestystä ja turvallisuutta, selvittää rikoksia ja auttaa ihmisiä.",
             "tutkinto": "Poliisi (AMK), Poliisiammattikorkeakoulu", "piirteet": ["kuuntelija", "rauhallinen"]},
 "vanginvartija": {"nimi": "Vanginvartija", "kuvaus": "Huolehtii vankilan turvallisuudesta ja tukee vankeja palaamaan tavalliseen elämään.",
                   "tutkinto": "Rikosseuraamusalan tutkinto, Rikosseuraamusalan koulutuskeskus RSKK", "piirteet": ["kuuntelija", "rauhallinen"]},
}

KUTSU_JOHDANTO = "Vuoro jatkuu! Nyt sinä istut itse päivystäjän paikalla. Puhelin soi kolme kertaa. Jokaisessa puhelussa sinun pitää selvittää nopeasti, mitä on tapahtunut, ja lähettää oikea apu."

TEHTAVA = dict(
    tyyppi="hatapuhelu",
    nimi="Hätäpuhelu", tag="Tehtävä · noin 20 min",
    maara="<strong>kolme hätäpuhelua</strong>",
    ohjeAskelLause="Jokaisessa puhelussa teet neljä asiaa:",
    askeleet=["Valitse kysymykset. Saat kysyä vain kolme kysymystä, koska hädässä jokainen sekunti on tärkeä.",
              "Lähetä paikalle oikeat auttajat: pelastus, ensihoito tai poliisi.",
              "Päätä, kuinka kiireellinen tilanne on.",
              "Neuvo soittajaa, mitä hän voi tehdä ennen kuin apu tulee."],
    lopuksi="Lopuksi vastaat kahteen kysymykseen. Sitten lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Vuororaporttisi",
    osa1="Hätäpuhelu", osa2="Viimeinen osa · Perustelut",
    keskus="HÄTÄKESKUS · YÖVUORO",
    tiedotOtsikko="Selvitetyt tiedot",
    kysyOhje="Mitä kysyt?",
    paataNappi="Tiedän tarpeeksi – päätä toimista",
    halytaNappi="🚨 Hälytä apu",
    seuraavaNappi="Seuraava puhelu", jatkaNappi="Jatka perusteluihin", valmisNappi="Katso tulos",
    perusteluOtsikko="Kolme puhelua hoidettu!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="VUORORAPORTTI · HÄTÄKESKUS",
    palaute=["Huippupäivystäjä! Selvitit tärkeät asiat ja lähetit oikean avun.",
             "Hyvää työtä! Pari asiaa vielä, niin olisit täydellinen päivystäjä.",
             "Hyvä alku! Muista kysyä ensin osoite ja se, onko joku vaarassa."],
    maxKysymyksia=3,
    yksikot=[{"avain": "pelastus", "nimi": "Pelastus", "ikoni": "🚒"},
             {"avain": "ensihoito", "nimi": "Ensihoito", "ikoni": "🚑"},
             {"avain": "poliisi", "nimi": "Poliisi", "ikoni": "🚓"}],
    kiireet=["🔴 Hyvin kiireellinen", "🟠 Kiireellinen", "🟢 Ei kiireellinen"],
    puhelut=[
      dict(otsikko="Savua rappukäytävässä",
           alku="Apua! Meidän rappukäytävä on täynnä savua!",
           tiedot=[{"avain": "osoite", "nimi": "Osoite", "selitys": "Ilman osoitetta apu ei löydä perille. Siksi osoite kysytään aina ensin."},
                   {"avain": "tapahtuma", "nimi": "Mitä tapahtui", "selitys": "Savu ja palovaroittimen piippaus kertovat, että asunnossa palaa."},
                   {"avain": "vaara", "nimi": "Onko joku vaarassa", "selitys": "Naapuri voi olla savun keskellä. Pelastajat hakevat hänet ensimmäisenä."}],
           kysymykset=[
             {"teksti": "Mikä on osoite?", "vastaus": "Laiturikatu 12 B. Asun kolmannessa kerroksessa.", "tieto": "osoite"},
             {"teksti": "Mikä sinun nimesi on?", "vastaus": "Mira.", "selitys": "Nimi on hyvä tietää, mutta se ei auta pelastajia löytämään perille."},
             {"teksti": "Mitä tarkalleen tapahtui?", "vastaus": "Naapurin ovelta tulee savua. Palovaroitin piippaa siellä.", "tieto": "tapahtuma"},
             {"teksti": "Onko talossa hissi?", "vastaus": "On, mutta se on tosi pieni.", "selitys": "Tämä ei auta nyt. Tulipalossa hissiä ei käytetä."},
             {"teksti": "Onko joku vaarassa?", "vastaus": "Naapurissa asuu vanha mies. Hän ei avaa ovea!", "tieto": "vaara"},
             {"teksti": "Kauanko olet asunut talossa?", "vastaus": "Pari vuotta… miksi kysyt?", "selitys": "Tämä ei liity hätään. Aikaa kului turhaan."}],
           yksikot=["pelastus", "ensihoito"],
           yksikkoSelitys="Pelastajat sammuttavat palon ja hakevat naapurin. Ensihoito tarkistaa, onko joku hengittänyt savua.",
           kiire=0,
           ohjeet=[{"teksti": "Juokse portaita alas savun läpi.", "oikein": False},
                   {"teksti": "Pysy omassa asunnossa ja pidä ovi kiinni. Mene ikkunalle tai parvekkeelle, niin pelastajat näkevät sinut.", "oikein": True,
                    "selitys": "Savuinen rappukäytävä on hengenvaarallinen. Oma asunto on turvallinen paikka, kun ovi on kiinni."},
                   {"teksti": "Mene koputtamaan naapurin ovea, kunnes hän avaa.", "oikein": False}]),
      dict(otsikko="Mopo kaatui",
           alku="Mun kaveri kaatui mopolla! Se makaa tiellä!",
           tiedot=[{"avain": "paikka", "nimi": "Paikka", "selitys": "Ilman tarkkaa paikkaa ensihoito ei löydä perille."},
                   {"avain": "tapahtuma", "nimi": "Mitä tapahtui", "selitys": "Kun kaatuu kovaa vauhtia, voi saada myös vammoja, joita ei näe päältä."},
                   {"avain": "tila", "nimi": "Potilaan kunto", "selitys": "Potilas on tajuissaan ja hengittää. Tilanne ei ole hengenvaarallinen, mutta apua tarvitaan nopeasti."}],
           kysymykset=[
             {"teksti": "Kenen mopo se on?", "vastaus": "Sen oma. Se sai sen synttärilahjaksi.", "selitys": "Tämä ei auta auttajia. Aikaa kului turhaan."},
             {"teksti": "Missä olette?", "vastaus": "Satamatien ja Rantakadun risteyksessä, huoltoaseman vieressä.", "tieto": "paikka"},
             {"teksti": "Ajoiko hän ylinopeutta?", "vastaus": "En tiedä… ehkä vähän.", "selitys": "Poliisi selvittää tämän myöhemmin. Nyt tärkeintä on apu."},
             {"teksti": "Mitä tapahtui?", "vastaus": "Mopo liukastui mutkassa, ja kaveri lensi asfaltille.", "tieto": "tapahtuma"},
             {"teksti": "Onko mopo pahasti rikki?", "vastaus": "Peili irtosi ja kylki on naarmuilla.", "selitys": "Mopo voi odottaa. Ihminen on tärkein."},
             {"teksti": "Onko hän tajuissaan ja hengittääkö hän?", "vastaus": "On tajuissaan ja puhuu. Jalka on vinossa, ja siihen sattuu kovasti.", "tieto": "tila"}],
           yksikot=["ensihoito", "poliisi"],
           yksikkoSelitys="Ensihoitajat hoitavat jalan. Poliisi tulee, koska kyse on liikenneonnettomuudesta.",
           kiire=1,
           ohjeet=[{"teksti": "Nosta hänet istumaan mopon selkään odottamaan.", "oikein": False},
                   {"teksti": "Anna hänelle särkylääkettä ja vettä.", "oikein": False},
                   {"teksti": "Älä liikuta häntä. Peittele hänet lämpimästi ja pysy vieressä. Soita heti uudelleen, jos hän menee huonompaan kuntoon.", "oikein": True,
                    "selitys": "Liikuttaminen voi pahentaa vammoja. Lämpö ja seura auttavat jaksamaan, kunnes apu tulee."}]),
      dict(otsikko="Kaveri ei herää",
           alku="Meidän bileissä yks tyyppi ei herää! Se joi tosi paljon.",
           tiedot=[{"avain": "osoite", "nimi": "Osoite", "selitys": "Ensihoito lähtee heti, kun osoite on tiedossa."},
                   {"avain": "tila", "nimi": "Hengittääkö hän", "selitys": "Jos ihminen ei herää mutta hengittää, hänet käännetään kylkiasentoon."},
                   {"avain": "tapahtuma", "nimi": "Mitä hän on juonut", "selitys": "Iso määrä alkoholia lyhyessä ajassa voi aiheuttaa alkoholimyrkytyksen. Se on hengenvaarallista."}],
           kysymykset=[
             {"teksti": "Hengittääkö hän?", "vastaus": "Joo, mutta tosi raskaasti. Hän oksensi äsken.", "tieto": "tila"},
             {"teksti": "Kenen bileet nämä ovat?", "vastaus": "Mun… vanhemmat on mökillä.", "selitys": "Tämä ei auta nyt. Ensin hoidetaan kaverin henki."},
             {"teksti": "Mikä on osoite?", "vastaus": "Kalliokuja 3 A 7. Se on kerrostalo sataman lähellä.", "tieto": "osoite"},
             {"teksti": "Saatteko te kaikki rangaistuksen?", "vastaus": "Ei kai… pitäisikö mun lopettaa puhelu?", "selitys": "Huono kysymys! Pelko voi saada soittajan lopettamaan puhelun. Hätäkeskus auttaa eikä rankaise."},
             {"teksti": "Mitä ja kuinka paljon hän on juonut?", "vastaus": "Melkein pullon vodkaa. Ehkä tunnin sisällä.", "tieto": "tapahtuma"},
             {"teksti": "Mikä musiikki siellä soi?", "vastaus": "Ööh… räppiä?", "selitys": "Tämä ei liity hätään mitenkään."}],
           yksikot=["ensihoito"],
           yksikkoSelitys="Ensihoitajat hoitavat alkoholimyrkytyksen. Pelastusta tai poliisia ei tarvita, koska tulipaloa tai rikosta ei ole.",
           kiire=0,
           ohjeet=[{"teksti": "Anna hänen nukkua selällään. Kyllä hän aamulla herää.", "oikein": False},
                   {"teksti": "Käännä hänet kylkiasentoon, ettei hän tukehdu oksennukseen. Pysy hänen vieressään.", "oikein": True,
                    "selitys": "Kylkiasennossa hengitystiet pysyvät auki, vaikka hän oksentaisi."},
                   {"teksti": "Laita hänet kylmään suihkuun, niin hän herää.", "oikein": False}]),
    ],
    kysymykset=[
        {"kysymys": "Miksi hätäkeskuspäivystäjä kysyy aina ensin osoitteen?", "ammattilainen": "Hätäkeskuspäivystäjä",
         "tutkinto": "Hätäkeskuspäivystäjätutkinto, Pelastusopisto", "placeholder": "Osoite kysytään ensin, koska…"},
        {"kysymys": "Mitä tekisit, jos kaverisi menisi juhlissa niin huonoon kuntoon, ettei hän herää?", "ammattilainen": "Järjestyksenvalvoja",
         "tutkinto": "Turvallisuusalan perustutkinto (turvallisuusvalvoja)", "placeholder": "Tekisin näin…"},
    ],
    ammattilaisetOtsikko="Turvallisuusalan ammatteja",
    ammattilaiset=[
        {"nimi": "Vartija", "tehtava": "valvoo alueita ja rakennuksia", "tutkinto": "Turvallisuusalan perustutkinto (turvallisuusvalvoja)"},
        {"nimi": "Järjestyksenvalvoja", "tehtava": "pitää järjestystä tapahtumissa ja ravintoloissa", "tutkinto": "Turvallisuusalan perustutkinto (turvallisuusvalvoja)"},
        {"nimi": "Hätäkeskuspäivystäjä", "tehtava": "vastaa numeroon 112 ja lähettää apua", "tutkinto": "Hätäkeskuspäivystäjätutkinto, Pelastusopisto"},
        {"nimi": "Pelastaja", "tehtava": "sammuttaa paloja ja auttaa onnettomuuksissa", "tutkinto": "Pelastajatutkinto, Pelastusopisto"},
        {"nimi": "Poliisi", "tehtava": "ylläpitää järjestystä ja selvittää rikoksia", "tutkinto": "Poliisi (AMK), Poliisiammattikorkeakoulu"},
        {"nimi": "Vanginvartija", "tehtava": "huolehtii vankilan turvallisuudesta", "tutkinto": "Rikosseuraamusalan tutkinto, RSKK"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Johdit hätäkeskuksen yövuoroa ja hoidit itse kolme hätäpuhelua. Samalla tutustuit turvallisuusalan ammatteihin."

OPPILAITOKSET = ("Missä turvallisuusalaa voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Turvallisuusalan koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Taitotalo, Helsinki", "Turvallisuusalan perustutkinto (turvallisuusvalvoja). Voit työllistyä esimerkiksi vartijaksi, järjestyksenvalvojaksi tai turvatarkastajaksi.", "https://www.taitotalo.fi")
    + kortti("OSAO, Oulu", "Turvallisuusalan perustutkinto (turvallisuusvalvoja).", "https://www.osao.fi")
    + kortti("Etsi lisää Opintopolusta", "Hae sanalla ”turvallisuusalan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=turvallisuusalan%20perustutkinto")
    + """<h3>Toisen asteen tutkinnon jälkeen</h3>
<p>Näihin haetaan, kun sinulla on jo ammattikoulun tai lukion tutkinto.</p>
""" + kortti("Pelastusopisto, Kuopio", "Pelastajatutkinto ja hätäkeskuspäivystäjätutkinto. Kumpikin kestää noin puolitoista vuotta.", "https://www.pelastusopisto.fi")
    + kortti("Poliisiammattikorkeakoulu, Tampere", "Poliisi (AMK) -tutkinto.", "https://polamk.fi")
    + kortti("Rikosseuraamusalan koulutuskeskus RSKK, Vantaa", "Rikosseuraamusalan tutkinto. Sillä pääsee töihin vanginvartijaksi.", "https://rskk.fi")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Sataman portti": "Poliisi saapui myöhemmin. Murtautujat ehtivät viedä yhden laatikon.",
    "Klubin ovi": "Ovella syntyi kinastelua, ja jono jumittui hetkeksi.",
    "Hätäpuhelu yöllä": "Osoitteen selvittäminen viivästyi. Ensihoito lähti liikkeelle minuutteja myöhemmin.",
    "Tulipalo satamassa": "Pelastustyö hidastui, koska omistajaa piti estää menemästä halliin.",
    "Yöpartio": "Nuori ehti sulkeutua. Hänen luottamuksensa voittaminen vei pidempään.",
    "Aamu vankilassa": "Tomin levottomuus ehti pahentua. Rauhoittaminen vei aamulla paljon aikaa.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Yövuoro on melkein ohi! Kaupunki on turvassa, ja kaikki yön tilanteet päättyivät hyvin.",
    "Kello on <<print setup.kello($aika)>>. Yövuoro on melkein ohi. Yö meni enimmäkseen hyvin, mutta pari tilannetta jäi kaivelemaan.",
    "Kello on <<print setup.kello($aika)>>. Yövuoro on melkein ohi, mutta yö oli raskas. Moni tilanne päättyi huonosti.",
]
MYOHASSA = "Vuoro venyi yli seitsemän, koska virheiden selvittäminen vei aikaa."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
