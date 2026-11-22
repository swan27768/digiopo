# -*- coding: utf-8 -*-
"""Rakentaminen ja talot – "Talo nousee viikossa" (sisältö). Uusi ala, kuuluu tekniikan aloihin.
Rakenna: python3 rakenna_tarina.py alat/rakennus.py <orig palvelu-ala.html> <uusi rakennus-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on rakennusmestari. Tarina kulkee maanantaista perjantaihin (kohtauksilla lisäaika).
Loppuosan tehtävä on "Suunnittele mökki" (TEHTAVA tyyppi "pohjapiirros"): oppilas piirtää
mökin pohjapiirroksen ruudukkoon, mittari laskee pinta-alat ja muistilista tarkistaa säännöt."""

ala = "rakennus"
alaNimi = "Rakentaminen ja talot"
tarinaNimi = "Talo nousee viikossa"
maailma = "tyomaa"
yleisKohtaus = "tyomaa"
katsoTeksti = "Katso työmaata"
kello = {"alku": 7 * 60, "raja": 4 * 24 * 60 + 9 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Rakennusala", "ifid": "35842d54-2074-4134-800b-e35f3ba18ecc"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Tavoite: katto valmis pe klo 16"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Työmaan värit: tumma teräksensininen, huomiokeltainen ja huomio-oranssi
TEEMA = """:root {
  --a1: #f7c437; --a1-rgb: 247,196,55;
  --a2: #ff8a2a; --a2-rgb: 255,138,42;
  --a3: #ffe08a;
  --korostus: #ff8a2a; --korostus-rgb: 255,138,42;
  --tausta: #1c242e; --tausta-rgb: 28,36,46;
  --tausta-2: #26313d; --tausta-2-rgb: 38,49,61;
  --paneeli: #212b36; --paneeli-rgb: 33,43,54;
  --paneeli-2: #2c3845;
  --tumma: #141a21; --tumma-rgb: 20,26,33;
  --reuna: #f7c437;
  --teksti-pehmea: #dbe3ea; --teksti-pehmea-rgb: 219,227,234;
  --teksti-vaalea: #f8fafc;
  --nappi-teksti: #2a1c00;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #fff0c2;
  --kansi-nappi-varjo: #8a5a00;
  --kansi-nappi-hehku: 247,196,55;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.94) 0%, rgba(var(--tausta-rgb),.78) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Tekniikan ala", otsikko="Rakentaminen ja talot",
             alaotsikko="Talo nousee viikossa · Ketä kaikkia tarvitaan, kun uusi koti rakennetaan?",
             nappi="Astu työmaalle", ikoni="kone")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet rakennusmestari omakotitalon työmaalla. Viikon aikana talon seinät ja katto nousevat paikoilleen. Miten sinä toimisit, kun tulee yllätyksiä?",
            faktat=[("6", "ammattilaista"), ("5", "päivää"), ("1", "talo")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "rakennus-runko-tausta.webp",
               "alku": KUVA + "rakennus-nosto-tausta.webp",
               "tehtava": KUVA + "rakennus-piirustus-tausta.webp",
               "kortti": KUVA + "rakennus-runko-tausta.webp",
               "loppu": [KUVA + "rakennus-runko-tausta.webp", KUVA + "rakennus-nosto-tausta.webp", KUVA + "rakennus-katto-tausta.webp"],
               "oppilaitokset": [KUVA + "rakennus-piirustus-tausta.webp", KUVA + "rakennus-runko-tausta.webp"]}

TARINA_ALKU = dict(nimi="Talo nousee viikossa", tausta="tyomaa", teksti="""<<include "HUD">>
<h1>Talo nousee viikossa</h1>
<p>On maanantaiaamu, ja kello on 7.00. Olet rakennusmestari. Vastaat siitä, että talo rakennetaan turvallisesti, piirustusten mukaan ja ajallaan.</p>
<p>Perustukset on jo valettu. Tällä viikolla nousevat seinät ja katto. Tavoite on, että perjantaina talo on vesikatossa eli katto on valmis.</p>
<p class="puhe"><strong>Aino, rakennusarkkitehti:</strong> ”Huomenta! Tule työmaakoppiin, katsotaan piirustukset vielä kerran.”</p>
<div class="intro-nappi"><<link "Mene työmaakoppiin">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Piirustukset", tausta="koppi", otsikko="Muutos piirustuksiin", avain="arkkitehti",
      taustakuva=KUVA + "rakennus-piirustus-tausta.webp",
      kysymys="Miltä rakennusarkkitehdin työ näytti?", lisaaika=1380, siirtymaTeksti="Seuraava tilanne on tiistaiaamuna.",
      johdanto="""<p>Talon omistaja soittaa. Hän haluaa olohuoneeseen paljon isomman ikkunan kuin piirustuksissa on.</p>
<p>Seinäelementit tehdään tehtaalla, ja ne tuodaan työmaalle jo huomenna.</p>
<p class="puhe"><strong>Aino, rakennusarkkitehti:</strong> ”Ikkuna tulee kantavaan seinään. Mitä teemme?”</p>""",
      valinnat=[
       dict(teksti="Kysytään suunnittelijoilta, kestääkö seinä isomman aukon. Muutos merkitään piirustuksiin.", aika=55, piirteet={"tarkka": 2, "vastuullinen": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Rakennesuunnittelija laskee, että seinään tarvitaan vahvempi palkki. Muutos ehtii tehtaalle, ja omistaja saa isomman ikkunan turvallisesti.</p>"),
       dict(teksti="Sahataan aukko isommaksi ja laitetaan yläpuolelle varmuuden vuoksi tukevampi palkki.", aika=30, piirteet={}, palaute="<p><strong>Vaarallista!</strong></p><p>Kantava seinä kannattelee kattoa. Vain rakennesuunnittelija voi laskea, millainen palkki riittää. Arvaus voi heikentää seinää. Aino ottaa yhteyttä suunnittelijoihin.</p>"),
       dict(teksti="Kieltäydytään. Piirustuksia ei muuteta koskaan.", aika=30, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Liian jyrkkää.</strong></p><p>Muutos on mahdollinen, kun se suunnitellaan oikein. Aino ottaa yhteyttä suunnittelijoihin.</p>"),
      ]),
 dict(nimi="Elementtien nosto", tausta="nosto", otsikko="Elementtien nosto", avain="elementtiasentaja",
      taustakuva=KUVA + "rakennus-nosto-tausta.webp",
      kysymys="Miltä elementtiasentajan työ näytti?", lisaaika=1380, siirtymaTeksti="Seuraava tilanne on keskiviikkoaamuna.",
      johdanto="""<p>Tiistaina nosturi nostaa seinäelementtejä paikoilleen. Tuuli yltyy, ja elementti alkaa heilua köyden päässä.</p>
<p>Nosturinkuljettaja kertoo radiolla, että tuulimittarin lukema on yli turvallisen rajan.</p>
<p class="puhe"><strong>Mikko, elementtiasentaja:</strong> ”Aikataulu on tiukka. Jatketaanko?”</p>""",
      valinnat=[
       dict(teksti="Keskeytetään nostot, kunnes tuuli heikkenee. Kukaan ei mene riippuvan taakan alle.", aika=60, piirteet={"turva": 2, "vastuullinen": 1},
            palaute="<p><strong>Turvallisuus ensin!</strong></p><p>Iltapäivällä tuuli tyyntyy, ja nostot jatkuvat. Aikataulu pysyy, koska kukaan ei loukkaantunut.</p>"),
       dict(teksti="Jatketaan. Pidetään elementistä käsin kiinni, ettei se heilu.", aika=45, piirteet={},
            palaute="<p><strong>Hengenvaarallista!</strong></p><p>Tonnien painoista elementtiä ei voi pidellä käsin. Nostot keskeytetään, kunnes tuuli heikkenee.</p>"),
       dict(teksti="Nostetaan vain pienet elementit.", aika=45, piirteet={},
            palaute="<p><strong>Ei auta.</strong></p><p>Pienikin seinäelementti toimii tuulessa kuin purje. Nostot keskeytetään, kunnes tuuli heikkenee.</p>"),
      ]),
 dict(nimi="Kattoristikot", tausta="katto", otsikko="Työ korkealla", avain="kirvesmies",
      taustakuva=KUVA + "rakennus-katto-tausta.webp",
      kysymys="Miltä talonrakentajan työ näytti?", lisaaika=1380, siirtymaTeksti="Seuraava tilanne on torstaiaamuna.",
      johdanto="""<p>Keskiviikkona kattoristikot nostetaan paikoilleen.</p>
<p>Kesätyöntekijä Leevi kiipeää ristikoille ilman turvavaljaita. ”Se on vain hetki”, hän huikkaa.</p>
<p class="puhe"><strong>Jari, talonrakentaja:</strong> ”Mitä sanot hänelle?”</p>""",
      valinnat=[
       dict(teksti="Leevi tulee heti alas. Korkealla käytetään aina valjaita ja kypärää. Näytetään, miten valjaat kiinnitetään.", aika=60, piirteet={"turva": 2, "opastaja": 1},
            palaute="<p><strong>Hyvä esimies!</strong></p><p>Jari näyttää Leeville, miten valjaat kiinnitetään. Leevi oppii, ja työ jatkuu turvallisesti.</p>"),
       dict(teksti="Annetaan olla. Hän on nuori ja ketterä.", aika=45, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Putoaminen on rakennustyömaan yleisimpiä vakavia onnettomuuksia. Leevi tulee alas ja saa valjaat.</p>"),
       dict(teksti="Leevi saa jäädä kotiin loppuviikoksi.", aika=45, piirteet={"turva": 1},
            palaute="<p><strong>Rangaistus ei opeta.</strong></p><p>Uusi työntekijä tarvitsee opastusta. Jari näyttää Leeville, miten valjaita käytetään.</p>"),
      ]),
 dict(nimi="Sähköt", tausta="sahkot", otsikko="Sähkötyöt", avain="sahko",
      kysymys="Miltä sähköasentajan työ näytti?", lisaaika=1380, siirtymaTeksti="Seuraava tilanne on perjantaiaamuna.",
      johdanto="""<p>Torstaina sähköasentaja Sanna asentaa seiniin rasioita ja johtoja.</p>
<p>Talon omistaja tulee työmaalle. ”Voisinko itse vetää saunan sähköt? Säästäisin rahaa”, hän kysyy.</p>
<p class="puhe"><strong>Sanna, sähköasentaja:</strong> ”Mitä hänelle vastataan?”</p>""",
      valinnat=[
       dict(teksti="Ei voi. Sähkötöitä saa tehdä vain sähköalan ammattilainen, koska virhe voi aiheuttaa tulipalon tai sähköiskun.", aika=60, piirteet={"turva": 2, "vastuullinen": 1},
            palaute="<p><strong>Oikein!</strong></p><p>Sanna kertoo, että sähkötyöt myös tarkastetaan ennen käyttöönottoa. Omistaja ymmärtää ja keksii säästää muualta.</p>"),
       dict(teksti="Totta kai, kunhan hän katsoo ohjeet netistä.", aika=45, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Kiukaan ja saunan sähköt ovat vaativia töitä. Sanna tekee ne itse.</p>"),
       dict(teksti="Sanna voi tehdä ne illalla halvemmalla ilman kuittia.", aika=45, piirteet={},
            palaute="<p><strong>Ei ole reilua eikä turvallista.</strong></p><p>Pimeä työ on laitonta, eikä sitä tarkasteta kunnolla. Sähkötyöt tehdään oikein ja kirjataan.</p>"),
      ]),
 dict(nimi="Putket", tausta="putket", otsikko="Kylpyhuone", avain="putki",
      kysymys="Miltä putkiasentajan työ näytti?", lisaaika=240, siirtymaTeksti="Seuraava tilanne on iltapäivällä.",
      johdanto="""<p>Perjantaiaamuna putkiasentaja Ville on tehnyt kylpyhuoneeseen vedeneristyksen. Sen pitää kuivua ennen laatoitusta.</p>
<p>Laatoittaja haluaisi kuitenkin aloittaa heti, jotta pääsisi aikaisin viikonlopun viettoon.</p>
<p class="puhe"><strong>Ville, putkiasentaja:</strong> ”Mitä päätät?”</p>""",
      valinnat=[
       dict(teksti="Odotetaan valmistajan ohjeen mukainen kuivumisaika. Laatoittaja tekee sillä välin eteisen.", aika=60, piirteet={"tarkka": 2, "vastuullinen": 1},
            palaute="<p><strong>Huolellista!</strong></p><p>Kun vedeneriste saa kuivua, kylpyhuone pysyy kuivana vuosikymmeniä. Eteinen valmistuu samalla.</p>"),
       dict(teksti="Laatoitetaan heti. Kyllä se kuivuu laattojen alla.", aika=45, piirteet={},
            palaute="<p><strong>Kosteusvaurion riski!</strong></p><p>Märkä vedeneriste ei toimi kunnolla. Vesi voi päästä rakenteisiin, ja korjaus maksaisi tuhansia euroja. Odotetaan kuivumista.</p>"),
       dict(teksti="Kuivatetaan vedeneristettä lämpöpuhaltimella ja laatoitetaan tunnin päästä.", aika=30, piirteet={}, palaute="<p><strong>Ei riitä.</strong></p><p>Puhallin kuivaa vain pinnan. Vedeneriste tarvitsee valmistajan ohjeen mukaisen kuivumisajan. Odotetaan, ja laatoittaja tekee sillä välin eteisen.</p>"),
      ]),
 dict(nimi="Maalaus", tausta="maalaus", otsikko="Sade uhkaa", avain="maalari",
      kysymys="Miltä maalarin työ näytti?",
      johdanto="""<p>Iltapäivällä maalari Pia aikoo maalata ulkoseinän ensimmäisen kerran. Taivas tummuu, ja sadetutka näyttää kuuroja.</p>
<p class="puhe"><strong>Pia, maalari:</strong> ”Ehtisin ehkä maalata ennen sadetta. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Ulkona ei maalata nyt. Pia maalaa sisäkatot, ja ulkoseinä maalataan kuivana päivänä.", aika=60, piirteet={"tarkka": 2, "vastuullinen": 1},
            palaute="<p><strong>Ammattilaisen päätös!</strong></p><p>Märkä maali valuisi ja irtoaisi. Sisätyöt etenevät, ja ulkoseinä maalataan ensi viikolla poutapäivänä.</p>"),
       dict(teksti="Maalataan nopeasti ennen sadetta.", aika=60, piirteet={},
            palaute="<p><strong>Riski ei kannata.</strong></p><p>Jos sade ehtii ennen kuin maali kuivuu, työ menee hukkaan. Pia maalaa sisätiloja.</p>"),
       dict(teksti="Maalataan seinä nyt ja suojataan se pressulla, jos sade alkaa.", aika=60, piirteet={"vastuullinen": 1}, palaute="<p><strong>Hyvä yritys, mutta ilma on jo liian kosteaa.</strong></p><p>Maali kuivuu huonosti kostealla säällä, eikä pressu suojaa kaikkea. Pia maalaa sisäkatot, ja ulkoseinä maalataan kuivana päivänä.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Harjannostajaiset", teksti="""<h1>Viikko päättyy</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>> perjantaina. Talo on vesikatossa!</p>
<<if _taso lte 1>><p>Katolle nostetaan lippu. Se on vanha suomalainen tapa juhlistaa sitä, että talon runko ja katto ovat valmiit. Omistaja tarjoaa koko porukalle kahvit ja pullat.</p><</if>>
<p>Huomasitko? Talon rakentamisessa tarvittiin monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Aino, rakennusarkkitehti</strong> – suunnitteli talon ja muutoksen</li>
<li><strong>Mikko, elementtiasentaja</strong> – kokosi seinät turvallisesti</li>
<li><strong>Jari, talonrakentaja</strong> – rakensi katon ja opasti nuorta työntekijää</li>
<li><strong>Sanna, sähköasentaja</strong> – teki sähköt</li>
<li><strong>Ville, putkiasentaja</strong> – teki kylpyhuoneen putket ja vedeneristyksen</li>
<li><strong>Pia, maalari</strong> – maalasi pinnat</li>
</ul>
<p>Sinä olit rakennusmestari. Moneen näistä töistä voi opiskella ammattikoulussa: rakennusalan, talotekniikan, sähkö- ja automaatioalan tai pintakäsittelyalan perustutkinnossa. Rakennusmestariksi ja rakennusarkkitehdiksi opiskellaan ammattikorkeakoulussa.</p>""")

PIIRTEET = {
 "turva": {"nimi": "Turvallisuus ensin", "kuvaus": "Et ota riskejä, kun kyse on ihmisten hengestä ja terveydestä."},
 "tarkka": {"nimi": "Tarkka", "kuvaus": "Teet asiat ohjeiden ja piirustusten mukaan, vaikka olisi kiire."},
 "vastuullinen": {"nimi": "Vastuullinen", "kuvaus": "Mietit, miten päätöksesi vaikuttavat taloon vuosien päästä."},
 "opastaja": {"nimi": "Hyvä opastaja", "kuvaus": "Neuvot muita rauhallisesti, kun he eivät vielä osaa."},
}

AMMATIT = {
 "arkkitehti": {"nimi": "Rakennusarkkitehti", "kuvaus": "Suunnittelee rakennuksia ja tekee niistä piirustukset.",
                "tutkinto": "Rakennusarkkitehti (AMK), ammattikorkeakoulu", "piirteet": ["tarkka", "vastuullinen"]},
 "elementtiasentaja": {"nimi": "Elementtiasentaja", "kuvaus": "Asentaa tehtaalla tehtyjä seinä- ja kattoelementtejä paikoilleen.",
                       "tutkinto": "Rakennusalan perustutkinto (talonrakentaja)", "piirteet": ["turva", "tarkka"]},
 "kirvesmies": {"nimi": "Talonrakentaja", "kuvaus": "Rakentaa runkoja, kattoja, seiniä ja lattioita, usein puusta.",
                "tutkinto": "Rakennusalan perustutkinto (talonrakentaja)", "piirteet": ["turva", "opastaja"]},
 "sahko": {"nimi": "Sähköasentaja", "kuvaus": "Asentaa ja korjaa rakennusten sähköjärjestelmiä.",
           "tutkinto": "Sähkö- ja automaatioalan perustutkinto (sähköasentaja)", "piirteet": ["turva", "vastuullinen"]},
 "putki": {"nimi": "Putkiasentaja", "kuvaus": "Asentaa vesi-, viemäri- ja lämmitysputkia.",
           "tutkinto": "Talotekniikan perustutkinto (putkiasentaja)", "piirteet": ["tarkka", "vastuullinen"]},
 "maalari": {"nimi": "Maalari", "kuvaus": "Maalaa ja käsittelee rakennusten pintoja sisällä ja ulkona.",
             "tutkinto": "Pintakäsittelyalan perustutkinto (maalari)", "piirteet": ["tarkka", "opastaja"]},
}

KUTSU_JOHDANTO = "Talo on katossa! Nyt sinä pääset suunnittelemaan. Asiakas haluaa pienen mökin järven rannalle. Piirrä mökin pohjapiirros kuten rakennusarkkitehti."

TEHTAVA = dict(
    tyyppi="pohjapiirros",
    nimi="Suunnittele mökki", tag="Tehtävä · noin 20 min",
    maara="<strong>yhden mökin</strong> pohjapiirros",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Piirrä mökin tilat ruudukkoon. Yksi ruutu on yksi neliömetri (m²).",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Mittari laskee pinta-alat, ja muistilista kertoo, mitä piirustuksesta vielä puuttuu. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Pohjapiirroksesi",
    osa1="Osa 1/2 · Pohjapiirros", osa2="Osa 2/2 · Perustelut",
    tilanneOtsikko="Asiakkaan toive",
    ohje="Mökki on 8 × 6 metriä. Siinä pitää olla eteinen, keittiö, olohuone, makuuhuone ja pesuhuone. Vesipiste 💧 ja ulko-ovi 🚪 ovat valmiina.",
    vinkki="Valitse tila ja napauta tai vedä ruutujen yli. Yksi ruutu on 1 m². Pyyhi-työkalulla voit tyhjentää ruutuja.",
    pinnatOtsikko="Pinta-alat", saannotOtsikko="Arkkitehdin muistilista",
    tarkistaNappi="Tarkista piirustus", jatkaNappi="Jatka perusteluihin", tyhjennaNappi="Tyhjennä kaikki", takaisinNappi="Muokkaa piirustusta", valmisNappi="Katso tulos",
    perusteluOtsikko="Hieno piirustus!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="POHJAPIIRROS · RANTAMÖKKI 8 × 6 M",
    palaute=["Huippusuunnitelma! Kaikki säännöt täyttyvät, ja mökki on toimiva.",
             "Hyvä suunnitelma! Pari asiaa vielä, niin piirustus olisi valmis.",
             "Hyvä alku! Katso muistilistan selitykset ja kokeile uudelleen."],
    leveys=8, korkeus=6, vesipiste=[2, 0], ovi=[5, 5],
    tilat=[{"avain": "E", "nimi": "Eteinen", "lyhenne": "E", "vari": "#e9d8a6"},
           {"avain": "K", "nimi": "Keittiö", "lyhenne": "K", "vari": "#f6b26b"},
           {"avain": "O", "nimi": "Olohuone", "lyhenne": "O", "vari": "#a4c2f4"},
           {"avain": "M", "nimi": "Makuuhuone", "lyhenne": "M", "vari": "#b6d7a8"},
           {"avain": "P", "nimi": "Pesuhuone", "lyhenne": "P", "vari": "#d5a6e6"}],
    saannot=[
      {"tyyppi": "kaikki", "nimi": "Kaikki viisi tilaa ovat mukana", "selitys": "Mökissä tarvitaan eteinen, keittiö, olohuone, makuuhuone ja pesuhuone.", "ammattilainen": "Rakennusarkkitehti"},
      {"tyyppi": "min", "tila": "O", "min": 10, "nimi": "Olohuone vähintään 10 m²", "selitys": "Olohuoneessa ollaan eniten. Sohva, pöytä ja kulkutila vievät tilaa.", "ammattilainen": "Rakennusarkkitehti"},
      {"tyyppi": "min", "tila": "M", "min": 7, "nimi": "Makuuhuone vähintään 7 m²", "selitys": "Sänky, vaatekaappi ja tila kulkea vievät noin 7 m².", "ammattilainen": "Rakennusarkkitehti"},
      {"tyyppi": "min", "tila": "P", "min": 3, "nimi": "Pesuhuone vähintään 3 m²", "selitys": "Suihku, wc-istuin ja lavuaari tarvitsevat tilaa.", "ammattilainen": "Putkiasentaja"},
      {"tyyppi": "vesi", "tila": "P", "nimi": "Pesuhuone on vesipisteen vieressä", "selitys": "Lyhyet putket ovat halvempia ja vuotavat harvemmin.", "ammattilainen": "Putkiasentaja"},
      {"tyyppi": "vesi", "tila": "K", "nimi": "Keittiö on vesipisteen vieressä", "selitys": "Tiskiallas ja astianpesukone tarvitsevat vettä ja viemärin.", "ammattilainen": "Putkiasentaja"},
      {"tyyppi": "ovi", "tila": "E", "nimi": "Ulko-ovelta tullaan eteiseen", "selitys": "Eteisessä riisutaan kengät ja takit. Lika ja kosteus jäävät sinne.", "ammattilainen": "Rakennusarkkitehti"},
      {"tyyppi": "yhtenainen", "nimi": "Jokainen tila on yhtenäinen", "selitys": "Huone ei voi olla kahdessa erillisessä palassa.", "ammattilainen": "Rakennusarkkitehti"},
      {"tyyppi": "taysi", "nimi": "Kaikki ruudut on käytetty", "selitys": "Rakentaminen on kallista. Jokainen neliömetri kannattaa käyttää.", "ammattilainen": "Rakennusmestari"},
    ],
    kysymykset=[
        {"kysymys": "Miksi keittiö ja pesuhuone kannattaa sijoittaa lähelle vesipistettä?", "ammattilainen": "Putkiasentaja",
         "tutkinto": "Talotekniikan perustutkinto (putkiasentaja)", "placeholder": "Ne kannattaa sijoittaa lähelle, koska…"},
        {"kysymys": "Mitä muuttaisit, jos mökissä asuisi pyörätuolia käyttävä ihminen?", "ammattilainen": "Rakennusarkkitehti",
         "tutkinto": "Rakennusarkkitehti (AMK)", "placeholder": "Muuttaisin esimerkiksi…"},
    ],
    ammattilaisetOtsikko="Rakennusalan ammatteja",
    ammattilaiset=[
        {"nimi": "Talonrakentaja", "tehtava": "rakentaa runkoja, kattoja ja seiniä", "tutkinto": "Rakennusalan perustutkinto (talonrakentaja)"},
        {"nimi": "Putkiasentaja", "tehtava": "asentaa vesi-, viemäri- ja lämmitysputkia", "tutkinto": "Talotekniikan perustutkinto (putkiasentaja)"},
        {"nimi": "Sähköasentaja", "tehtava": "tekee rakennusten sähkötyöt", "tutkinto": "Sähkö- ja automaatioalan perustutkinto (sähköasentaja)"},
        {"nimi": "Maalari", "tehtava": "maalaa ja käsittelee pintoja", "tutkinto": "Pintakäsittelyalan perustutkinto (maalari)"},
        {"nimi": "Rakennusmestari", "tehtava": "johtaa työmaata ja vastaa aikataulusta", "tutkinto": "Rakennusmestari (AMK)"},
        {"nimi": "Rakennusarkkitehti", "tehtava": "suunnittelee rakennukset ja tekee piirustukset", "tutkinto": "Rakennusarkkitehti (AMK)"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Johdit talon rakentamista viikon ajan ja suunnittelit mökin pohjapiirroksen. Samalla tutustuit rakennusalan ammatteihin."

OPPILAITOKSET = ("Missä rakennusalaa voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Rakennusalan koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Rakennusalaa voi opiskella monessa ammattiopistossa eri puolilla Suomea. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Ammatillinen koulutus</h3>
""" + kortti("Taitotalo, Helsinki", "Rakennusalan perustutkinto (talonrakentaja), talotekniikan perustutkinto (putkiasentaja) ja pintakäsittelyalan perustutkinto (maalari).", "https://www.taitotalo.fi")
    + kortti("Lapin ammattiopisto Redu, Rovaniemi", "Rakennusalan perustutkinto (talonrakentaja).", "https://www.redu.fi")
    + kortti("Ammattiopisto Tavastia, Hämeenlinna", "Rakennusalan perustutkinto.", "https://www.tavastia.fi")
    + kortti("JEDU, Pohjois-Pohjanmaa", "Rakennusalan perustutkinto.", "https://www.jedu.fi")
    + """<h3>Ammattikorkeakoulu</h3>
""" + kortti("Tampereen ammattikorkeakoulu (TAMK)", "Rakennusmestari (AMK) ja rakennusarkkitehti (AMK).", "https://www.tuni.fi/fi/tule-opiskelemaan")
    + kortti("Etsi lisää Opintopolusta", "Hae sanalla ”rakennusalan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=rakennusalan%20perustutkinto")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Piirustukset": "Muutoksen suunnittelu viivästyi, ja seinäelementit valmistuivat tehtaalla myöhemmin.",
    "Elementtien nosto": "Työmaalla oli vaaratilanne. Siitä tehtiin ilmoitus, ja nostot keskeytettiin.",
    "Kattoristikot": "Leevin turvallisuus oli vaarassa. Työmaalla pidettiin ylimääräinen turvallisuuspalaveri.",
    "Sähköt": "Talon omistaja harmistui. Hänelle piti selittää uudelleen, miksi sähkötyöt kuuluvat ammattilaisille.",
    "Putket": "Kylpyhuoneen aikataulusta tuli kiistaa. Laatoitus siirtyi.",
    "Maalaus": "Ulkoseinän maalaus siirtyi, ja Pia joutui vaihtamaan työsuunnitelman kesken päivän.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>> perjantaina. Talo on vesikatossa! Kaikki työt tehtiin turvallisesti ja oikein.",
    "Kello on <<print setup.kello($aika)>> perjantaina. Talo on vesikatossa, mutta muutama työ tehdään vielä uudelleen.",
    "Kello on <<print setup.kello($aika)>> perjantaina. Talo ei ole vielä valmis. Virheiden korjaaminen siirtää harjannostajaisia.",
]
MYOHASSA = "Viikko venyi, eikä katto ollut valmis perjantaina kello 16."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
