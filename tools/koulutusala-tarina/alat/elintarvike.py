# -*- coding: utf-8 -*-
"""Elintarvikeala – "Uusi välipala" (sisältö).
Rakenna: python3 rakenna_tarina.py alat/elintarvike.py <orig elintarvike-ala.html> <uusi elintarvike-ala.html>

Loppuosan tehtävä on "Kehitä oma välipala" (TEHTAVA tyyppi "kehitys"):
oppilas valitsee 6 vaiheessa kohderyhmän, pohjan, maun, lisäyksen, pakkauksen ja myyntipaikan,
perustelee jokaisen valinnan ja nimeää tuotteen. Peli laskee hinnan, kerää allergeenit ja
kertoo, sopiiko tuote kohderyhmälle. Jokaisessa vaiheessa näytetään, kuka tekee työtä ammatikseen."""

ala = "elintarvike"
alaNimi = "Elintarvikeala"
tarinaNimi = "Uusi välipala"
maailma = "elintarvike"
yleisKohtaus = "yleis"
katsoTeksti = "Katso tehdasta"
kello = {"alku": 8 * 60, "raja": 300}
aikaRivi = "Marjapala oli valmis kello"
siirtyma = 15
siirtymaTeksti = "Seuraavalle osastolle siirtyminen vie 15 min."
kutsuTilanneOtsikko = "Vaihe"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Maistatus klo 13.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Herkullinen teema: suklaanruskeat paneelit, mansikka, vanilja ja karamelli.
TEEMA = """:root {
  --a1: #ff8fab; --a1-rgb: 255,143,171;
  --a2: #ff6b8b; --a2-rgb: 255,107,139;
  --a3: #ffc2d1;
  --korostus: #ffd29d; --korostus-rgb: 255,210,157;
  --tausta: #2e1b14; --tausta-rgb: 46,27,20;
  --tausta-2: #44291e; --tausta-2-rgb: 68,41,30;
  --paneeli: #3a2219; --paneeli-rgb: 58,34,25;
  --paneeli-2: #4a2d21;
  --tumma: #1f110c; --tumma-rgb: 31,17,12;
  --reuna: #ff8fab;
  --teksti-pehmea: #f6dccb; --teksti-pehmea-rgb: 246,220,203;
  --teksti-vaalea: #fff4ea;
  --nappi-teksti: #3a0d1c;
  /* Kannen aloitusnappi samanvärinen kuin tarinan muut napit */
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #ffd6e0;
  --kansi-nappi-varjo: #b02a52;
  --kansi-nappi-hehku: 255,107,139;
}
/* Vaalea 3D-tehdas: kannen teksti tarvitsee tumman pohjan */
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.92) 0%, rgba(var(--tausta-rgb),.7) 38%, rgba(var(--tausta-rgb),.25) 62%, rgba(var(--tausta-rgb),0) 82%) !important;
}"""

KANSI = dict(pieni="Elintarvikeala", otsikko="Elintarvikeala",
             alaotsikko="Uusi välipala · Ehtiikö Marjapala koululaisten maisteltavaksi kello 13?",
             nappi="Aloita maistelu", ikoni="sydan")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet elintarviketehtaan laatuvastaava. Tänään tehdään ensimmäinen erä uutta välipalaa, Marjapalaa, ja sinä varmistat, että se on turvallista. Kello 13 koululaiset maistavat sitä. Miten sinä toimisit?",
            faktat=[("6", "ammattilaista"), ("5", "tuntia aikaa"), ("1", "oma välipala")])

TARINA_ALKU = dict(nimi="Uusi välipala", tausta="yleis", teksti="""<<run setup.taustakuva("../../images/koulutusalat/elintarvike-tehdas-tausta.webp")>><<include "HUD">>
<h1>Uusi välipala</h1>
<p>Kello on 8.00. Olet Makupaja Oy:n laatuvastaava. Sinä varmistat, että tehtaan ruoka on turvallista ja hyvää. Tehtaassa tuoksuu paahdettu kaura ja mansikka.</p>
<p>Tänään valmistetaan ensimmäinen erä uutta välipalaa. Se on Marjapala: kaurapatukka, jossa on mansikkaa ja jogurttikuorrute.</p>
<p class="puhe"><strong>Tuotantopäällikkö Leena:</strong> ”Kello 13 viemme Marjapaloja koululle maistettavaksi. Kierrä tuotanto ja varmista, että kaikki on kunnossa. Aloita hygieniasulusta.”</p>
<div class="intro-nappi"><<link "Mene hygieniasulkuun">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Hygieniasulku", tausta="hygienia", otsikko="Hygieniasulku", avain="valmistaja",
      kysymys="Miltä elintarvikkeiden valmistajan työ näytti?",
      johdanto="""<p>Ennen tuotantoon menoa kaikki kulkevat hygieniasulun läpi. Sinulla on sormus, rannekello ja oma huppari.</p>
<p class="puhe"><strong>Sami, elintarvikkeiden valmistaja:</strong> ”Ruoan pitää olla puhdasta ja turvallista. Mitä teet ennen kuin menet sisään?”</p>""",
      valinnat=[
       dict(teksti="Riisun korut, pesen kädet ja puen työvaatteet ja hiussuojan.", aika=10, piirteet={"tarkka": 2},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Korut ja omat vaatteet voivat tuoda bakteereja ruokaan. Pieni osa voi myös pudota tuotteeseen. Siksi kaikki tekevät samoin, myös tehtaan johtaja.</p>"),
       dict(teksti="Laitan hanskat sormuksen päälle, niin se ei haittaa.", aika=15, piirteet={},
            palaute="<p><strong>Sami pyytää riisumaan sormuksen.</strong></p><p>Hanska voi revetä, ja sormuksen alle jää bakteereja. Korut riisutaan aina.</p><p>Pesette kädet ja puette työvaatteet ja hiussuojan.</p>"),
       dict(teksti="Menen suoraan sisään. Käyn vain nopeasti.", aika=15, piirteet={},
            palaute="<p><strong>Sami pysäyttää sinut ovella.</strong></p><p>Säännöt koskevat kaikkia, myös laatuvastaavaa ja tehtaan johtajaa. Yksikin hius tai bakteeri voi pilata koko erän.</p><p>Riisut korut, peset kädet ja puet työvaatteet.</p>"),
      ]),
 dict(nimi="Leipomo", tausta="leipomo", otsikko="Leipomo", avain="leipuri",
      kysymys="Miltä leipuri-kondiittorin työ näytti?",
      johdanto="""<p>Leipomossa sekoitetaan Marjapalan kauramassaa. Massa murenee käsissä. Se on liian kuivaa.</p>
<p class="puhe"><strong>Hanna, leipuri-kondiittori:</strong> ”Tästä ei saa ehjiä paloja. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Lisään vähän vettä silmämääräisesti.", aika=15, piirteet={},
            palaute="<p><strong>Massa paranee, mutta seuraava erä on erilainen.</strong></p><p>Isoissa määrissä kaikki punnitaan tarkasti. Muuten jokainen erä maistuu ja näyttää erilaiselta.</p><p>Hanna punnitsee lisänesteen ja kirjaa sen reseptiin.</p>"),
       dict(teksti="Punnitsen lisää nestettä ja kirjaan muutoksen reseptiin.", aika=10, piirteet={"tarkka": 2, "luova": 1},
            palaute="<p><strong>Ammattilaisen tapa!</strong></p><p>Kun muutos on kirjattu, jokainen erä onnistuu samalla tavalla. Massa pysyy nyt koossa, ja palat ovat ehjiä.</p>"),
       dict(teksti="Kysyn Hannalta, miltä massan pitäisi tuntua.", aika=10, piirteet={"tiimi": 2},
            palaute="<p><strong>Hyvä kysymys!</strong></p><p>Hanna näyttää: kun massaa puristaa, sen pitää pysyä koossa. Sitten hän punnitsee lisää nestettä ja kirjaa muutoksen reseptiin.</p>"),
      ]),
 dict(nimi="Meijeri", tausta="meijeri", otsikko="Meijeri", avain="meijeristi",
      kysymys="Miltä meijeristin työ näytti?",
      johdanto="""<p>Meijeriosastolla tehdään jogurttikuorrutetta. Maito pitää ensin kuumentaa 72 asteeseen, jotta haitalliset bakteerit kuolevat.</p>
<p>Mittari näyttää 68 astetta.</p>
<p class="puhe"><strong>Veera, meijeristi:</strong> ”Mitä teet, kun lämpötila ei ole vielä oikea?”</p>""",
      valinnat=[
       dict(teksti="Odotan, että lämpö nousee 72 asteeseen, ja kirjaan sen.", aika=15, piirteet={"tarkka": 2},
            palaute="<p><strong>Täsmälleen oikein!</strong></p><p>Lämpötila kirjataan joka kerta. Jos ruoasta tulee kysyttävää, kirjauksista näkee, että kaikki tehtiin oikein.</p>"),
       dict(teksti="68 astetta riittää. Nyt on kiire.", aika=10, piirteet={},
            palaute="<p><strong>Ei riitä.</strong></p><p>Jos lämpötila jää liian matalaksi, kaikki bakteerit eivät kuole. Veera kuumentaa erän uudelleen 72 asteeseen ja kirjaa sen.</p><p>Ruoan turvallisuudesta ei jousteta, vaikka olisi kiire.</p>"),
       dict(teksti="Kerron heti Veeralle, että lämpö on liian matala.", aika=10, piirteet={"tiimi": 2},
            palaute="<p><strong>Hyvä, että kerroit!</strong></p><p>Veera huomaa, että laitteen säätö oli väärin. Hän korjaa sen, ja maito kuumenee 72 asteeseen. Lämpötila kirjataan.</p>"),
      ]),
 dict(nimi="Laboratorio", tausta="laboratorio", otsikko="Laboratorio", avain="laborantti",
      kysymys="Miltä laborantin työ näytti?",
      johdanto="""<p>Laboratoriossa tutkitaan valmiita Marjapaloja. Yhden näytteen kosteus on liian korkea. Liian kostea patukka voi homehtua kaupan hyllyllä.</p>
<p class="puhe"><strong>Elias, laborantti:</strong> ”Tulos ei ole hyvä. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Mitataan uudelleen ja kerrotaan tulos tuotekehitykselle.", aika=15, piirteet={"tarkka": 2, "tiimi": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Uusi mittaus näyttää saman tuloksen. Patukoita paistetaan hetki pidempään, ja kosteus laskee sopivaksi.</p>"),
       dict(teksti="Muutetaan tulos pienemmäksi, ettei tule ongelmia.", aika=10, piirteet={},
            palaute="<p><strong>Ei koskaan!</strong></p><p>Tuloksia ei saa muuttaa. Ne kertovat, onko ruoka turvallista. Elias mittaa uudelleen ja kertoo tuloksen tuotekehitykselle. Patukoita paistetaan pidempään.</p>"),
       dict(teksti="Ei tehdä mitään. Patukka syödään kuitenkin nopeasti.", aika=10, piirteet={},
            palaute="<p><strong>Kaupassa patukka voi olla viikkoja.</strong></p><p>Siinä ajassa kostea patukka voi homehtua. Elias kertoo tuloksen tuotekehitykselle. Patukoita paistetaan pidempään.</p>"),
      ]),
 dict(nimi="Makutesti", tausta="kehitys", otsikko="Tuotekehitys: makutesti", avain="kehittaja",
      kysymys="Miltä tuotekehittäjän työ näytti?",
      johdanto="""<p>Tuotekehityksessä on aamulla käynyt testiryhmä: kymmenen seitsemäsluokkalaista. Moni heistä sanoi, että Marjapala on liian makea.</p>
<p class="puhe"><strong>Ronja, tuotekehittäjä:</strong> ”Ennen maistatusta ehditään vielä muuttaa reseptiä. Mitä ehdotat?”</p>""",
      valinnat=[
       dict(teksti="Lisätään sokeria. Kaikki tykkäävät makeasta.", aika=10, piirteet={},
            palaute="<p><strong>Palaute oli päinvastainen.</strong></p><p>Testiryhmä sanoi, että patukka on liian makea. Ronja vähentää sokeria ja lisää mansikkaa, jotta maku on raikkaampi.</p>"),
       dict(teksti="Vähennetään sokeria ja lisätään mansikkaa.", aika=15, piirteet={"luova": 2, "asiakas": 2},
            palaute="<p><strong>Hyvä ehdotus!</strong></p><p>Ronja tekee kokeilun. Uusi versio on raikkaampi, ja siinä on vähemmän sokeria. Testiryhmän kaksi jäsentä maistaa sitä, ja molemmat tykkäävät.</p>"),
       dict(teksti="Pidetään resepti samana. Testiryhmä oli pieni.", aika=10, piirteet={},
            palaute="<p><strong>Pienikin testiryhmä kertoo paljon.</strong></p><p>Jos moni sanoo saman asian, siitä kannattaa ottaa vaarin. Ronja vähentää sokeria ja lisää mansikkaa.</p>"),
      ]),
 dict(nimi="Pakkauslinja", tausta="pakkaus", otsikko="Pakkauslinja", avain="prosessi",
      taustakuva="../../images/koulutusalat/elintarvike-tehdas-tausta.webp",
      kysymys="Miltä prosessinhoitajan työ näytti?",
      johdanto="""<p>Marjapalat kulkevat pakkauskoneeseen. Huomaat jotain: tänään patukoihin lisättiin mantelirouhetta, mutta pakkauksen tekstissä ei lue ”sisältää mantelia”.</p>
<p class="puhe"><strong>Tomi, prosessinhoitaja:</strong> ”Hyvä havainto. Mitä teet?”</p>""",
      valinnat=[
       dict(teksti="Pysäytän linjan ja kerron heti Tomille.", aika=15, piirteet={"tarkka": 2, "tiimi": 1},
            palaute="<p><strong>Hienosti toimittu!</strong></p><p>Pähkinäallergia voi olla hengenvaarallinen. Tomi tulostaa uudet tarrat, joissa manteli mainitaan. Väärät pakkaukset kerätään pois.</p>"),
       dict(teksti="Annetaan mennä. Tuskin kukaan huomaa.", aika=10, piirteet={},
            palaute="<p><strong>Allergiselle tämä voi olla hengenvaarallinen.</strong></p><p>Tomi pysäyttää linjan ja tulostaa uudet tarrat, joissa manteli mainitaan. Väärät pakkaukset kerätään pois.</p>"),
       dict(teksti="Kirjoitan asiasta lapun ja jatkan töitä.", aika=10, piirteet={"tiimi": 1},
            palaute="<p><strong>Hyvä, että huomasit, mutta lappu ei riitä.</strong></p><p>Linja pitää pysäyttää heti, ettei vääriä pakkauksia tule lisää. Tomi pysäyttää linjan ja tulostaa uudet tarrat.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Maistatus", teksti="""<h1>Maistatus!</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Marjapalat ovat valmiita ja pakattuja. Ne ehtivät koululle ajoissa!</p>
<p>Koululla 7.-luokkalaiset maistavat Marjapalaa. Moni sanoo, että se on raikas ja juuri sopivan makea.</p>
<p>Huomasitko? Yhteen välipalaan tarvittiin kuusi eri ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Sami, elintarvikkeiden valmistaja</strong> – piti huolen hygieniasta</li>
<li><strong>Hanna, leipuri-kondiittori</strong> – teki massasta juuri oikeanlaisen</li>
<li><strong>Veera, meijeristi</strong> – kuumensi maidon turvalliseksi</li>
<li><strong>Elias, laborantti</strong> – tutki, että patukka säilyy</li>
<li><strong>Ronja, tuotekehittäjä</strong> – paransi makua testiryhmän avulla</li>
<li><strong>Tomi, prosessinhoitaja</strong> – piti huolen, että pakkauksen tiedot ovat oikein</li>
</ul>
<p>Elintarvikkeiden valmistajaksi, leipuri-kondiittoriksi ja meijeristiksi opiskellaan ammattikoulussa. Myös laborantiksi voi opiskella amiksessa.</p>""")

PIIRTEET = {
 "tarkka": {"nimi": "Tarkka ja turvallinen", "kuvaus": "Teet asiat oikein, vaikka olisi kiire."},
 "luova": {"nimi": "Makujen kehittäjä", "kuvaus": "Keksit, miten ruoasta tulee vielä parempaa."},
 "asiakas": {"nimi": "Syöjän puolella", "kuvaus": "Kuuntelet, mitä syöjät toivovat."},
 "tiimi": {"nimi": "Tiimipelaaja", "kuvaus": "Kerrot havainnoistasi ja kysyt neuvoa."},
}

ELT = "Elintarvikealan perustutkinto"
AMMATIT = {
 "valmistaja": {"nimi": "Elintarvikkeiden valmistaja", "kuvaus": "Valmistaa ruokia ja elintarvikkeita tehtaassa tai pienessä yrityksessä.",
                "tutkinto": ELT + " (elintarvikkeiden valmistaja)", "piirteet": ["tarkka", "tiimi"]},
 "leipuri": {"nimi": "Leipuri-kondiittori", "kuvaus": "Leipoo leipiä, leivonnaisia ja kakkuja.",
             "tutkinto": ELT + " (leipuri-kondiittori)", "piirteet": ["luova", "tarkka"]},
 "meijeristi": {"nimi": "Meijeristi", "kuvaus": "Valmistaa maitotuotteita, kuten jogurttia ja juustoa.",
                "tutkinto": ELT + " (meijeristi)", "piirteet": ["tarkka", "tiimi"]},
 "laborantti": {"nimi": "Laborantti", "kuvaus": "Tutkii näytteitä laboratoriossa ja varmistaa, että ruoka on turvallista.",
                "tutkinto": "Laboratorioalan perustutkinto (laborantti)", "piirteet": ["tarkka", "tiimi"]},
 "kehittaja": {"nimi": "Tuotekehittäjä", "kuvaus": "Keksii uusia ruokatuotteita ja parantaa vanhoja.",
               "tutkinto": "Insinööri (AMK), bio- ja elintarviketekniikka", "piirteet": ["luova", "asiakas"]},
 "prosessi": {"nimi": "Prosessinhoitaja", "kuvaus": "Ohjaa tehtaan koneita ja pakkauslinjaa ja valvoo laatua.",
              "tutkinto": ELT + ", jatkossa esimerkiksi elintarviketeollisuuden ammattitutkinto", "piirteet": ["tarkka", "tiimi"]},
}

KUTSU_JOHDANTO = "Tarinassa näit, miten Marjapala syntyi. Nyt on sinun vuorosi olla tuotekehittäjä! Kehitä oma välipala vaihe vaiheelta."

TEHTAVA = dict(
    tyyppi="kehitys",
    nimi="Kehitä oma välipala", tag="Tehtävä · noin 25 min",
    maara="<strong>6 vaihetta</strong>",
    ohjeAskelLause="Jokaisessa vaiheessa teet kaksi asiaa:",
    askeleet=["Valitse yksi vaihtoehto.", "Kirjoita yhdellä lauseella, miksi valitsit sen."],
    lopuksi="Peli laskee hinnan ja kertoo allergeenit. Lopuksi keksit välipalalle nimen ja mainoslauseen. Lataa vastauksesi ja palauta ne Classroomiin.",
    tulosOtsikko="Tuotekorttisi",
    korttiSana="Vaihe", seuraava="Seuraava vaihe", valitseNappi="Valitse",
    miksiLabel="Miksi valitsit tämän? Kirjoita yksi lause.", placeholder="Valitsin tämän, koska…",
    vihjeValitse="Valitse yksi vaihtoehto.", vihjeAlku="Valitse vaihtoehto ja kirjoita perustelu.",
    ammattilainenTeksti="Tätä työtä tekee",
    tilaOtsikko="Välipalasi nyt",
    nimeaNappi="Nimeä välipala", nimeaOtsikko="Nimi ja mainoslause",
    nimeaTeksti="Välipalasi on melkein valmis! Keksi sille nimi ja lyhyt mainoslause.",
    nimiPlaceholder="Esim. Marjapala", lausePlaceholder="Esim. Pieni pala, iso energia!",
    valmisNappi="Tee tuotekortti", korttiYla="TUOTEKORTTI · OMA VÄLIPALA",
    hintaRaja=2.5, hintaVinkki="Halvemmilla valinnoilla hinta laskisi.",
)

# Vaiheet (KUTSU_KORTIT-listassa). Ensimmäinen vaihe = kohderyhmä.
KUTSU_KORTIT = [
 {"otsikko": "Kohderyhmä", "kysymys": "Kenelle teet välipalan?",
  "miksi": "Miksi haluat tehdä välipalan juuri hänelle?",
  "ammattilainen": "Markkinointisuunnittelija", "ammattikuvaus": "selvittää, mitä asiakkaat haluavat",
  "tutkinto": "Esimerkiksi tradenomi (AMK). Alkuun pääsee merkonomina",
  "vaihtoehdot": [
   {"nimi": "Urheileva nuori", "kuvaus": "Treenaa monta kertaa viikossa ja tarvitsee proteiinia.", "tarve": "proteiini",
    "tarveOk": "Välipalassa on proteiinia, joten se sopii urheilijalle.", "tarveVinkki": "urheilija tarvitsee proteiinia. Esimerkiksi rahka tai hernerouhe toisi sitä.",
    "palaute": "Urheilija tarvitsee energiaa ja proteiinia, jotta lihakset palautuvat treenistä."},
   {"nimi": "Kiireinen koululainen", "kuvaus": "Syö välipalan bussissa tai välitunnilla.", "tarve": "kätevä",
    "tarveOk": "Välipala on helppo syödä mukana.", "tarveVinkki": "kiireinen koululainen tarvitsee välipalan, jonka voi syödä kulkiessa.",
    "palaute": "Kiireiselle välipalan pitää olla helppo ottaa mukaan ja syödä ilman lusikkaa."},
   {"nimi": "Vegaani", "kuvaus": "Ei syö mitään, mikä tulee eläimistä.", "kielletty": ["eläin"],
    "palaute": "Vegaanin välipalassa ei saa olla maitoa, kananmunaa tai muuta eläimistä tulevaa."},
   {"nimi": "Allerginen koululainen", "kuvaus": "Hänellä on maito- ja pähkinäallergia.", "kielletty": ["maito", "pähkinä"],
    "palaute": "Allergisen välipalassa ei saa olla maitoa eikä pähkinää. Tarkkuus on tärkeää, koska allergia voi olla vaarallinen."},
  ]},
 {"otsikko": "Pohja", "kysymys": "Mistä välipala tehdään?",
  "ammattilainen": "Elintarvikkeiden valmistaja", "ammattikuvaus": "valmistaa tuotteen tehtaassa",
  "tutkinto": ELT + " (elintarvikkeiden valmistaja)",
  "vaihtoehdot": [
   {"nimi": "Kaurapatukka", "kuvaus": "Paahdettua kauraa ja taateleita.", "hinta": 0.90, "allergeenit": ["gluteeni (kaura)"], "tagit": ["kätevä"],
    "palaute": "Kaurapatukka on helppo ottaa mukaan, ja kaura antaa pitkään energiaa."},
   {"nimi": "Rahkakuppi", "kuvaus": "Pehmeää rahkaa pienessä kupissa.", "hinta": 1.10, "allergeenit": ["maito"], "tagit": ["proteiini", "eläin"],
    "palaute": "Rahkassa on paljon proteiinia. Se pitää kuitenkin säilyttää kylmässä."},
   {"nimi": "Smoothie", "kuvaus": "Marjoista ja kauramaidosta tehty juoma pullossa.", "hinta": 1.30, "allergeenit": ["gluteeni (kaura)"], "tagit": ["kätevä"],
    "palaute": "Smoothie on helppo juoda kulkiessa, ja marjoissa on vitamiineja."},
   {"nimi": "Paahdetut kikherneet", "kuvaus": "Rapeita kikherneitä pussissa.", "hinta": 1.00, "tagit": ["proteiini", "kätevä"],
    "palaute": "Kikherneissä on kasviproteiinia, ja ne säilyvät hyvin."},
  ]},
 {"otsikko": "Maku", "kysymys": "Millainen maku välipalaan tulee?",
  "ammattilainen": "Laborantti", "ammattikuvaus": "tekee makutestejä ja tutkii raaka-aineita",
  "tutkinto": "Laboratorioalan perustutkinto (laborantti)",
  "vaihtoehdot": [
   {"nimi": "Mansikka", "kuvaus": "Kotimainen ja makea.", "hinta": 0.20, "tagit": ["kotimainen"], "palaute": "Mansikka on suomalaisten suosikkimaku."},
   {"nimi": "Mustikka", "kuvaus": "Metsän marja, jossa on paljon vitamiineja.", "hinta": 0.25, "tagit": ["kotimainen"], "palaute": "Mustikka on kotimainen ja terveellinen marja."},
   {"nimi": "Kaakao-appelsiini", "kuvaus": "Suklainen ja raikas.", "hinta": 0.25, "palaute": "Kaakao ja appelsiini on yllättävä ja raikas yhdistelmä."},
   {"nimi": "Kaneli-omena", "kuvaus": "Lämmin ja tuttu kuin omenapiirakka.", "hinta": 0.15, "palaute": "Kaneli-omena on tuttu ja edullinen maku."},
  ]},
 {"otsikko": "Lisäys", "kysymys": "Mitä välipalaan lisätään?",
  "ammattilainen": "Ravitsemusterapeutti", "ammattikuvaus": "neuvoo, miten ruoasta tulee terveellistä",
  "tutkinto": "Ravitsemusterapeutti, yliopisto",
  "vaihtoehdot": [
   {"nimi": "Suklaakuorrute", "kuvaus": "Maitosuklaata päälle.", "hinta": 0.30, "allergeenit": ["maito"], "tagit": ["eläin"],
    "palaute": "Suklaa tekee välipalasta herkun, mutta siinä on sokeria ja maitoa."},
   {"nimi": "Hernerouhe", "kuvaus": "Kotimaista kasviproteiinia.", "hinta": 0.15, "tagit": ["proteiini"],
    "palaute": "Hernerouhe tuo proteiinia, ja se sopii myös vegaanille."},
   {"nimi": "Siemenseos", "kuvaus": "Auringonkukan- ja kurpitsansiemeniä.", "hinta": 0.10,
    "palaute": "Siemenissä on hyviä rasvoja, ja ne sopivat useimmille."},
   {"nimi": "Mantelirouhe", "kuvaus": "Rapeaa mantelia.", "hinta": 0.30, "allergeenit": ["pähkinä"],
    "palaute": "Manteli on maukas, mutta se on pähkinä. Se pitää aina mainita pakkauksessa."},
  ]},
 {"otsikko": "Pakkaus", "kysymys": "Mihin välipala pakataan?",
  "ammattilainen": "Pakkaussuunnittelija", "ammattikuvaus": "suunnittelee pakkauksia, jotka suojaavat ruokaa",
  "tutkinto": "Esimerkiksi muotoilija tai insinööri (AMK)",
  "vaihtoehdot": [
   {"nimi": "Kartonkirasia", "kuvaus": "Paperista tehty rasia.", "hinta": 0.15, "tagit": ["kierrätettävä"],
    "palaute": "Kartonki on kevyt ja menee kartonkikeräykseen."},
   {"nimi": "Muovikääre", "kuvaus": "Ohut ja halpa.", "hinta": 0.05, "tagit": ["säilyy pitkään"],
    "palaute": "Muovi on halpaa ja pitää ruoan tuoreena, mutta siitä syntyy muovijätettä."},
   {"nimi": "Lasipurkki", "kuvaus": "Tukeva purkki, jonka voi käyttää uudelleen.", "hinta": 0.40, "tagit": ["kierrätettävä"],
    "palaute": "Lasi on kestävä, mutta painava ja kallis kuljettaa."},
   {"nimi": "Kompostoituva kääre", "kuvaus": "Maatuu biojätteessä.", "hinta": 0.25, "tagit": ["kompostoituva"],
    "palaute": "Kompostoituva kääre on ympäristöystävällinen, mutta vähän kalliimpi."},
  ]},
 {"otsikko": "Myyntipaikka", "kysymys": "Mistä välipalaa voi ostaa?",
  "ammattilainen": "Myyjä", "ammattikuvaus": "myy tuotteita ja kertoo niistä asiakkaille",
  "tutkinto": "Liiketoiminnan perustutkinto (merkonomi)",
  "vaihtoehdot": [
   {"nimi": "Koulun kahvila", "kuvaus": "Koululaiset ostavat välitunnilla.", "palaute": "Koulun kahvilassa asiakkaat ovat lähellä, mutta hinta ei saa olla korkea."},
   {"nimi": "Lähikauppa", "kuvaus": "Moni käy kaupassa joka päivä.", "palaute": "Kaupassa välipala kilpailee monen muun tuotteen kanssa. Pakkauksen pitää erottua."},
   {"nimi": "Kuntosali", "kuvaus": "Treenaajat ostavat treenin jälkeen.", "palaute": "Kuntosalilla ostajat etsivät usein proteiinia."},
   {"nimi": "Rautatieaseman kioski", "kuvaus": "Matkustajat ostavat kiireessä.", "palaute": "Kioskissa tärkeintä on, että välipalan voi syödä heti mukana."},
  ]},
]

LOPPU_TEKSTI = "Autoit Marjapalan valmiiksi ja kehitit oman välipalan. Samalla tutustuit yli kymmeneen ammattiin, jotka liittyvät ruokaan."

# Taustakuvat: etusivu (kansi + aloitussivu) ja tehtävän sivut
TAUSTAKUVAT = {"kansi": "../../images/koulutusalat/elintarvike-leivat-tausta.webp",
               "alku": "../../images/koulutusalat/elintarvike-leivat-tausta.webp",
               "tehtava": "../../images/koulutusalat/elintarvike-korvapuustit-tausta.webp"}

OPPILAITOKSET = ("Missä elintarvikealaa voi opiskella?", "Valitse alue")
SAILYTA = ["Valitse alue", "Koulutukset: Elintarvikeala (Uusimaa)", "Koulutukset: Elintarvikeala (Muu Suomi)"]
SAILYTA_KORVAUKSET = [("[[Palaa alkuun->start]]", "")]
