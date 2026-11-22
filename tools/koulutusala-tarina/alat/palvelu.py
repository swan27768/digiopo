# -*- coding: utf-8 -*-
"""Palvelualat (kuljetus ja matkailu) – "Myrsky lentokentällä" (sisältö).
Rakenna: python3 rakenna_tarina.py alat/palvelu.py <orig palvelu-ala.html> <uusi palvelu-ala.html>

Loppuosan tehtävä on "Järjestä jumiin jääneet" (TEHTAVA tyyppi "sijoitus"):
oppilas sijoittaa 8 matkustajaa aamulennolle, yöjunaan, bussiin, hotelliin tai loungeen.
Paikkoja on rajallisesti, ja matkustajilla on erilaisia tarpeita. Peli antaa pisteet
(✓✓ = sopii hyvin, ✓ = käy, ✗ = ei sovi) ja oppilas perustelee kaksi asiaa."""

ala = "palvelu"
alaNimi = "Palvelualat: kuljetus ja matkailu"
tarinaNimi = "Myrsky lentokentällä"
maailma = "lentokentta"
yleisKohtaus = "kentta"
katsoTeksti = "Katso kenttää"
kello = {"alku": 16 * 60, "raja": 360}
aikaRivi = "Kaikki matkustajat olivat turvassa kello"
siirtyma = 15
siirtymaTeksti = "Seuraavaan paikkaan kentällä siirtyminen vie 15 min."
kutsuTilanneOtsikko = "Tehtävä"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Viimeinen bussi klo 22.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Talvi-ilta lentokentällä: tummansiniset paneelit, kiitotien valojen meripihka ja jäänsininen
TEEMA = """:root {
  --a1: #ffc15e; --a1-rgb: 255,193,94;
  --a2: #f59f2a; --a2-rgb: 245,159,42;
  --a3: #ffdca0;
  --korostus: #7cc7ff; --korostus-rgb: 124,199,255;
  --tausta: #0c1628; --tausta-rgb: 12,22,40;
  --tausta-2: #15233b; --tausta-2-rgb: 21,35,59;
  --paneeli: #111e34; --paneeli-rgb: 17,30,52;
  --paneeli-2: #1a2a46;
  --tumma: #070e1a; --tumma-rgb: 7,14,26;
  --reuna: #ffc15e;
  --teksti-pehmea: #d5e1f2; --teksti-pehmea-rgb: 213,225,242;
  --teksti-vaalea: #f2f6fc;
  --nappi-teksti: #2a1800;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #ffe8bf;
  --kansi-nappi-varjo: #8a5a10;
  --kansi-nappi-hehku: 255,193,94;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.92) 0%, rgba(var(--tausta-rgb),.7) 38%, rgba(var(--tausta-rgb),.25) 62%, rgba(var(--tausta-rgb),0) 82%) !important;
}"""

KANSI = dict(pieni="Palveluala", otsikko="Palveluala",
             alaotsikko="Myrsky lentokentällä · Kuka auttaa satoja jumiin jääneitä matkustajia?",
             nappi="Astu terminaaliin", ikoni="kone")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet lentoaseman häiriötilannekoordinaattori. Illalla iskee lumimyrsky, ja lennot perutaan. Kentälle jää satoja matkustajia. Miten sinä auttaisit?",
            faktat=[("6", "ammattilaista"), ("8", "matkustajaa"), ("1", "lumimyrsky")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "palvelu-torni-tausta.webp",
               "alku": KUVA + "palvelu-torni-tausta.webp",
               "tehtava": KUVA + "palvelu-lounge-tausta.webp"}

TARINA_ALKU = dict(nimi="Myrsky lentokentällä", tausta="kentta", teksti="""<<include "HUD">>
<h1>Myrsky lentokentällä</h1>
<p>Kello on 16.00. Olet lentoaseman häiriötilannekoordinaattori. Kun jokin menee pieleen, sinä autat eri ammattilaisia toimimaan yhdessä. Aamupäivä oli rauhallinen, mutta nyt taivas on muuttunut harmaaksi.</p>
<p>Sääennuste varoittaa: illalla tulee kova lumimyrsky. Lumen lisäksi tuuli puhaltaa kovaa.</p>
<p class="puhe"><strong>Vuoropäällikkö Riikka:</strong> ”Tästä tulee pitkä ilta. Lähdetään ensin lennonjohtotorniin katsomaan, miltä tilanne näyttää.”</p>
<div class="intro-nappi"><<link "Nouse torniin">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Lennonjohtotorni", tausta="torni", otsikko="Lennonjohtotorni", avain="lennonjohtaja",
      taustakuva=KUVA + "palvelu-torni-tausta.webp",
      kysymys="Miltä lennonjohtajan työ näytti?",
      johdanto="""<p>Tornissa on hiljaista, mutta tunnelma on jännittynyt. Ulkona lumi tuiskuaa niin, että kiitotie tuskin näkyy.</p>
<p>Radiosta kuuluu lentäjän ääni: ”Pyydämme laskeutumislupaa. Polttoainetta on vielä tunnin lentoon.”</p>
<p class="puhe"><strong>Anni, lennonjohtaja:</strong> ”Näkyvyys on liian huono. Mitä tekisit?”</p>""",
      valinnat=[
       dict(teksti="Kone lentää odotuskierrosta, kunnes kiitotie on aurattu, tai menee toiselle kentälle.", aika=15, piirteet={"rauhallinen": 2, "turva": 1},
            palaute="<p><strong>Turvallisuus ensin!</strong></p><p>Polttoainetta on tarpeeksi, joten kone voi odottaa. Anni ohjaa koneen odottamaan ja kertoo lentäjälle selkeästi, mitä tapahtuu.</p>"),
       dict(teksti="Annetaan laskeutua heti. Matkustajat haluavat kotiin.", aika=10, piirteet={},
            palaute="<p><strong>Liian vaarallista.</strong></p><p>Lumisella kiitotiellä kone voi liukua. Anni ohjaa koneen odottamaan, kunnes kiitotie on aurattu.</p>"),
       dict(teksti="Kysytään lentäjältä, mitä hän haluaa tehdä.", aika=10, piirteet={"tiimi": 1},
            palaute="<p><strong>Yhteistyö on tärkeää, mutta päätös on lennonjohdon.</strong></p><p>Lennonjohtaja näkee kokonaisuuden: kaikki koneet ja kiitotien kunnon. Anni ohjaa koneen odottamaan.</p>"),
      ]),
 dict(nimi="Kiitotie", tausta="kiitotie", otsikko="Kiitotie", avain="kenttahuolto",
      taustakuva=KUVA + "palvelu-kiitotie-tausta.webp",
      kysymys="Miltä lentoasemahuoltajan työ näytti?",
      johdanto="""<p>Lumiaurojen keltaiset valot vilkkuvat. Kiitotiellä on jo kymmenen senttiä lunta.</p>
<p class="puhe"><strong>Tero, lentoasemahuoltaja:</strong> ”Aurataan kiitotie. Milloin se voidaan avata koneille?”</p>""",
      valinnat=[
       dict(teksti="Kun kiitotie on aurattu ja sen liukkaus mitattu.", aika=15, piirteet={"turva": 2},
            palaute="<p><strong>Juuri niin!</strong></p><p>Tero mittaa kitkan erikoisautolla. Lennonjohto saa tiedon, ja odottava kone laskeutuu turvallisesti.</p>"),
       dict(teksti="Heti kun aurat ovat ajaneet kerran yli.", aika=10, piirteet={},
            palaute="<p><strong>Liukkaus pitää tarkistaa.</strong></p><p>Lumen alla voi olla jäätä. Tero mittaa kitkan, ja kiitotietä hiekoitetaan vielä kerran.</p>"),
       dict(teksti="Vasta kun myrsky on ohi.", aika=15, piirteet={"turva": 1},
            palaute="<p><strong>Varovaista, mutta myrsky voi kestää koko yön.</strong></p><p>Kun kiitotie aurataan ja mitataan, kentän voi avata turvallisesti jo aiemmin.</p>"),
      ]),
 dict(nimi="Lähtöaula", tausta="aula", otsikko="Lähtöaula", avain="virkailija",
      kysymys="Miltä lentoasemavirkailijan työ näytti?",
      johdanto="""<p>Taululle syttyy punainen teksti: PERUTTU. Illan viimeiset lennot perutaan. Palvelutiskille syntyy pitkä jono.</p>
<p>Ensimmäinen matkustaja huutaa: ”Tämä on ihan järjetöntä! Minun piti olla huomenna töissä!”</p>
<p class="puhe"><strong>Mira, lentoasemavirkailija:</strong> ”Miten vastaisit hänelle?”</p>""",
      valinnat=[
       dict(teksti="Kuuntelen rauhassa, pahoittelen tilannetta ja kerron vaihtoehdot.", aika=15, piirteet={"rauhallinen": 2, "asiakas": 2},
            palaute="<p><strong>Ammattilaisen tapa!</strong></p><p>Matkustaja rauhoittuu, kun häntä kuunnellaan. Mira löytää hänelle paikan aamun ensimmäiseltä lennolta.</p>"),
       dict(teksti="Sanon, ettei myrsky ole minun vikani.", aika=10, piirteet={},
            palaute="<p><strong>Totta, mutta se ei auta.</strong></p><p>Matkustaja suuttuu vielä enemmän. Mira pahoittelee tilannetta ja etsii hänelle paikan aamun lennolta.</p>"),
       dict(teksti="Pyydän häntä menemään jonon perälle odottamaan.", aika=10, piirteet={},
            palaute="<p><strong>Hän on jo jonossa.</strong></p><p>Mira kuuntelee häntä ja kertoo vaihtoehdot. Aamun lennolta löytyy paikka.</p>"),
      ]),
 dict(nimi="Ravintola", tausta="ravintola", otsikko="Kentän ravintola", avain="kokki",
      kysymys="Miltä kokin työ näytti?",
      johdanto="""<p>Kentän ravintolaan tulee 300 nälkäistä matkustajaa. Lentoyhtiö jakaa heille ruokakuponkeja.</p>
<p class="puhe"><strong>Jasmin, kokki:</strong> ”Ruoka loppuu, jos jatkamme tavallista listaa. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Tehdään isoja kattilallisia keittoa ja merkitään allergeenit selvästi.", aika=15, piirteet={"tiimi": 1, "asiakas": 1, "turva": 1},
            palaute="<p><strong>Fiksu ratkaisu!</strong></p><p>Keiton saa valmiiksi nopeasti, ja sitä riittää kaikille. Allergeenimerkinnät auttavat, kun syöjiä on paljon.</p>"),
       dict(teksti="Suljetaan ravintola. Liikaa ihmisiä.", aika=10, piirteet={},
            palaute="<p><strong>Nälkäiset matkustajat jäisivät ilman ruokaa.</strong></p><p>Jasmin keittää ison kattilallisen keittoa ja merkitsee allergeenit.</p>"),
       dict(teksti="Tehdään kaikille oma annos tavallisesta listasta.", aika=20, piirteet={"asiakas": 1},
            palaute="<p><strong>Ystävällistä, mutta liian hidasta.</strong></p><p>Jono kasvaa, ja raaka-aineet loppuvat. Jasmin vaihtaa keittoon, jota riittää kaikille.</p>"),
      ]),
 dict(nimi="Bussipysäkki", tausta="bussi", otsikko="Bussipysäkki", avain="kuljettaja",
      kysymys="Miltä linja-autonkuljettajan työ näytti?",
      johdanto="""<p>Lentoyhtiö tilaa bussin, joka vie matkustajia hotelliin kaupunkiin. Tie on liukas, ja lunta tulee yhä.</p>
<p class="puhe"><strong>Kari, linja-autonkuljettaja:</strong> ”Matkustajat haluavat lähteä heti. Mitä teen ennen kuin lähden?”</p>""",
      valinnat=[
       dict(teksti="Tarkistan reitin ja kelin. Kerron matkustajille, että ajetaan rauhallisesti.", aika=15, piirteet={"turva": 2, "asiakas": 1},
            palaute="<p><strong>Turvallinen ja palveleva kuljettaja!</strong></p><p>Kari kertoo matkan kestävän tavallista kauemmin. Matkustajat tietävät, mitä odottaa, ja kaikki pääsevät perille turvallisesti.</p>"),
       dict(teksti="Lähden heti ja ajan tavallista nopeutta.", aika=10, piirteet={},
            palaute="<p><strong>Liukkaalla tiellä tämä on vaarallista.</strong></p><p>Kari tarkistaa reitin ja ajaa rauhallisesti. Kaikki pääsevät perille turvallisesti.</p>"),
       dict(teksti="Odotan, kunnes tie on aurattu.", aika=20, piirteet={"turva": 1},
            palaute="<p><strong>Varovaista, mutta matkustajat jäisivät kentälle.</strong></p><p>Karin bussissa on talvirenkaat. Hän tarkistaa reitin ja ajaa rauhallisesti.</p>"),
      ]),
 dict(nimi="Hotelli", tausta="hotelli", otsikko="Lentokenttähotelli", avain="matkailu",
      taustakuva=KUVA + "palvelu-lounge-tausta.webp",
      kysymys="Miltä matkailun asiakaspalvelijan työ näytti?",
      johdanto="""<p>Kentän hotelliin tulee kymmenen matkustajaa. Vapaita huoneita on vain kolme.</p>
<p class="puhe"><strong>Laura, matkailun asiakaspalvelija:</strong> ”Kenelle annetaan huoneet?”</p>""",
      valinnat=[
       dict(teksti="Niille, jotka tarvitsevat lepoa eniten, kuten perheelle ja iäkkäälle matkustajalle. Muille lounge, tyynyt ja peitot.", aika=15, piirteet={"asiakas": 2, "rauhallinen": 1},
            palaute="<p><strong>Reilua ja välittävää!</strong></p><p>Laura antaa huoneet niille, jotka niitä eniten tarvitsevat. Muut saavat loungesta mukavat paikat, tyynyt, peitot ja aamupalan.</p>"),
       dict(teksti="Ne, jotka tulivat ensin, saavat huoneet.", aika=10, piirteet={},
            palaute="<p><strong>Nopeasti päätetty, mutta ei aina reilua.</strong></p><p>Pikkulapsen perhe ja iäkäs matkustaja tulivat viimeisinä. Laura järjestää heille huoneet ja muille paikat loungesta.</p>"),
       dict(teksti="Huutokaupataan huoneet. Eniten maksavat saavat ne.", aika=10, piirteet={},
            palaute="<p><strong>Hotelli ei toimi näin hätätilanteessa.</strong></p><p>Laura antaa huoneet niille, jotka tarvitsevat niitä eniten. Muut pääsevät loungeen.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Myrsky laantuu", teksti="""<h1>Myrsky laantuu</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Kaikilla matkustajilla on paikka, jossa olla yön yli.</p>
<p>Aamulla myrsky on ohi. Aurinko nousee, ja ensimmäinen kone nousee ilmaan kello 7.10.</p>
<p>Huomasitko? Myrskyn aikana tarvittiin kuusi eri ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Anni, lennonjohtaja</strong> – piti koneet turvassa</li>
<li><strong>Tero, lentoasemahuoltaja</strong> – aurasi ja tarkisti kiitotien</li>
<li><strong>Mira, lentoasemavirkailija</strong> – palveli jonossa olevia matkustajia</li>
<li><strong>Jasmin, kokki</strong> – ruokki satoja ihmisiä</li>
<li><strong>Kari, linja-autonkuljettaja</strong> – kuljetti matkustajat turvallisesti</li>
<li><strong>Laura, matkailun asiakaspalvelija</strong> – järjesti majoituksen</li>
</ul>
<p>Moneen näistä ammateista voi opiskella ammattikoulussa: logistiikan, matkailualan tai ravintola-alan perustutkinnossa.</p>""")

PIIRTEET = {
 "rauhallinen": {"nimi": "Rauhallinen", "kuvaus": "Pysyt rauhallisena, vaikka ympärillä on kiire."},
 "turva": {"nimi": "Turvallisuus ensin", "kuvaus": "Et ota riskejä, kun kyse on ihmisten turvallisuudesta."},
 "asiakas": {"nimi": "Asiakkaan auttaja", "kuvaus": "Huomaat, mitä toinen tarvitsee, ja autat häntä."},
 "tiimi": {"nimi": "Tiimipelaaja", "kuvaus": "Teet yhteistyötä ja etsit ratkaisuja yhdessä."},
}

AMMATIT = {
 "lennonjohtaja": {"nimi": "Lennonjohtaja", "kuvaus": "Johtaa lentoliikennettä ja pitää koneet turvassa.",
                   "tutkinto": "Lennonjohdon koulutus Avia Collegessa (noin 1,5 vuotta)", "piirteet": ["rauhallinen", "turva"]},
 "kenttahuolto": {"nimi": "Lentoasemahuoltaja", "kuvaus": "Pitää kiitotiet ja kentän kunnossa, myös talvella.",
                  "tutkinto": "Logistiikan perustutkinto (lentoasemapalvelut)", "piirteet": ["turva", "tiimi"]},
 "virkailija": {"nimi": "Lentoasemavirkailija", "kuvaus": "Auttaa matkustajia lähtöselvityksessä ja portilla.",
                "tutkinto": "Esimerkiksi matkailualan tai liiketoiminnan perustutkinto", "piirteet": ["asiakas", "rauhallinen"]},
 "kokki": {"nimi": "Kokki", "kuvaus": "Valmistaa ruokaa ravintolassa tai suurkeittiössä.",
           "tutkinto": "Ravintola- ja catering-alan perustutkinto (kokki)", "piirteet": ["tiimi", "asiakas"]},
 "kuljettaja": {"nimi": "Linja-autonkuljettaja", "kuvaus": "Kuljettaa ihmisiä turvallisesti paikasta toiseen.",
                "tutkinto": "Logistiikan perustutkinto (linja-autonkuljettaja)", "piirteet": ["turva", "asiakas"]},
 "matkailu": {"nimi": "Matkailun asiakaspalvelija", "kuvaus": "Palvelee asiakkaita hotellissa tai matkailukeskuksessa.",
              "tutkinto": "Matkailualan perustutkinto (matkailun asiakaspalvelija)", "piirteet": ["asiakas", "rauhallinen"]},
}

KUTSU_JOHDANTO = "Tarinassa ammattilaiset auttoivat satoja matkustajia. Nyt olet itse palvelutiskillä! Kahdeksan matkustajaa tarvitsee paikan yöksi tai jatkomatkan, mutta paikkoja on vähän."

TEHTAVA = dict(
    tyyppi="sijoitus",
    nimi="Järjestä jumiin jääneet", tag="Tehtävä · noin 25 min",
    maara="<strong>8 matkustajaa</strong> ja viisi vaihtoehtoa, joissa on rajallisesti paikkoja",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Sijoita jokainen matkustaja. Mieti, mitä kukin tarvitsee.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Peli kertoo, kuinka hyvin sijoitukset sopivat matkustajille. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Raporttisi",
    ohje="Lennot on peruttu. Valitse jokaiselle matkustajalle paikka. Yläreunasta näet, montako paikkaa on vielä vapaana. Kun kaikki on sijoitettu, tarkista tulos.",
    tilanneOtsikko="Olet palvelutiskillä",
    osa1="Osa 1/2 · Sijoitus", osa2="Osa 2/2 · Perustelut",
    tarkistaNappi="Tarkista sijoitukset", jatkaNappi="Jatka perusteluihin", takaisinNappi="Muuta sijoituksia", valmisNappi="Katso raportti",
    perusteluOtsikko="Hyvää työtä!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="RAPORTTI · MYRSKYYÖ",
    palaute=["Upeaa! Kaikki saivat juuri sen, mitä tarvitsivat.",
             "Hyvä! Moni matkustaja sai sopivan paikan.",
             "Tämä oli vaikea tehtävä. Katso selitykset: ne kertovat, mitä kukin tarvitsi."],
    vaihtoehdot=[
        {"avain": "lento", "nimi": "Aamulento", "lyhyt": "Aamulento", "ikoni": "✈️", "tieto": "lähtee klo 7.10", "paikat": 2},
        {"avain": "juna", "nimi": "Yöjuna", "lyhyt": "Yöjuna", "ikoni": "🚆", "tieto": "makuuvaunu, klo 22.30", "paikat": 2},
        {"avain": "bussi", "nimi": "Yöbussi", "lyhyt": "Bussi", "ikoni": "🚌", "tieto": "lähtee klo 21.00", "paikat": 3},
        {"avain": "hotelli", "nimi": "Hotelli", "lyhyt": "Hotelli", "ikoni": "🏨", "tieto": "huone kentän vieressä", "paikat": 3},
        {"avain": "lounge", "nimi": "Lounge", "lyhyt": "Lounge", "ikoni": "🛋️", "tieto": "nojatuoli, peitto, aamupala", "paikat": 4},
    ],
    kysymykset=[
        {"kysymys": "Kenen matkustajan sijoittaminen oli vaikeinta? Miksi?", "ammattilainen": "Lentoasemavirkailija",
         "tutkinto": "Esimerkiksi matkailualan tai liiketoiminnan perustutkinto", "placeholder": "Vaikeinta oli…, koska…"},
        {"kysymys": "Mitä sanoisit matkustajalle, joka ei saanut haluamaansa paikkaa?", "ammattilainen": "Matkailun asiakaspalvelija",
         "tutkinto": "Matkailualan perustutkinto", "placeholder": "Sanoisin hänelle…"},
    ],
    ammattilaisetOtsikko="Näissä töissä autetaan matkustajia",
    ammattilaiset=[
        {"nimi": "Lentoasemavirkailija", "tehtava": "etsii matkustajille uudet lennot", "tutkinto": "Esimerkiksi matkailualan tai liiketoiminnan perustutkinto"},
        {"nimi": "Matkailun asiakaspalvelija", "tehtava": "järjestää majoituksen hotelliin", "tutkinto": "Matkailualan perustutkinto"},
        {"nimi": "Linja-autonkuljettaja", "tehtava": "ajaa yöbussia", "tutkinto": "Logistiikan perustutkinto"},
        {"nimi": "Konduktööri", "tehtava": "palvelee junassa ja auttaa avustusta tarvitsevia", "tutkinto": "Esimerkiksi logistiikan tai matkailualan perustutkinto ja junayhtiön koulutus"},
        {"nimi": "Lentoemäntä tai stuertti", "tehtava": "huolehtii matkustajista koneessa", "tutkinto": "Lentoyhtiön oma koulutus. Pohjaksi sopii esimerkiksi matkailualan perustutkinto"},
    ],
)

# Matkustajat: sopivuus = { vaihtoehto: [taso 0–2, selitys] }
KUTSU_KORTIT = [
 {"nimi": "Kalle, 72", "ikoni": "👨‍🦽", "kuvaus": "Liikkuu pyörätuolilla. Menossa Ouluun, ei kiirettä.",
  "sopivuus": {"lento": [1, "Lento käy, mutta yö pitää ensin odottaa kentällä."],
               "juna": [1, "Junassa on esteetön vaunu, mutta makuupaikalle siirtyminen on hankalaa."],
               "bussi": [0, "Bussiin on portaat, eikä pyörätuoli mahdu kunnolla."],
               "hotelli": [2, "Esteetön huone ja kunnon yöuni. Aamulla hän jatkaa rauhassa."],
               "lounge": [0, "Yö nojatuolissa on raskas, kun ei pääse helposti liikkumaan."]}},
 {"nimi": "Sanna ja 2-vuotias Eeli", "ikoni": "👩‍👧", "kuvaus": "Menossa Ouluun. Lapsi on väsynyt ja itkuinen.",
  "sopivuus": {"lento": [1, "Lento on nopea, mutta yö kentällä on raskas pikkulapselle."],
               "juna": [2, "Makuuvaunussa lapsi saa nukkua, ja aamulla ollaan perillä."],
               "bussi": [0, "Yö istuen bussissa on liian raskas väsyneelle lapselle."],
               "hotelli": [2, "Lapsi saa nukkua sängyssä. Aamulla perhe jatkaa matkaa."],
               "lounge": [0, "Meluisa lounge ei sovi väsyneelle lapselle."]}},
 {"nimi": "Jonne, 24", "ikoni": "🧑‍💼", "kuvaus": "Työhaastattelu Rovaniemellä huomenna klo 10.",
  "sopivuus": {"lento": [2, "Kone on perillä 8.30. Hän ehtii haastatteluun."],
               "juna": [2, "Juna on perillä 8.40. Hän ehtii haastatteluun."],
               "bussi": [0, "Bussi on perillä vasta iltapäivällä. Haastattelu menisi ohi."],
               "hotelli": [0, "Hotellista hän ei ehdi Rovaniemelle ajoissa."],
               "lounge": [0, "Loungessa odottaminen ei vie häntä perille ajoissa."]}},
 {"nimi": "Yuki, 30", "ikoni": "🧳", "kuvaus": "Turisti Japanista, ei puhu suomea. Revontulimatka Rovaniemelle alkaa huomenna.",
  "sopivuus": {"lento": [2, "Suora lento on hänelle helpoin, eikä tarvitse vaihtaa."],
               "juna": [1, "Juna käy, mutta junaan nouseminen ja vaunun löytäminen on vaikeaa ilman kieltä."],
               "bussi": [0, "Pitkä bussimatka ja vaihdot ovat vaikeita ilman kieltä."],
               "hotelli": [1, "Hän saa levätä, mutta jatkomatka pitää järjestää aamulla uudelleen."],
               "lounge": [1, "Hän pääsee aamulla jatkamaan, mutta yö on pitkä."]}},
 {"nimi": "Helmi, 88", "ikoni": "👵", "kuvaus": "Lääkkeet ovat laukussa, joka on jo koneen ruumassa.",
  "sopivuus": {"lento": [1, "Hän pääsee perille aamulla, mutta yöllä tarvitaan lääkkeet ja lepoa."],
               "juna": [0, "Laukku ja lääkkeet jäisivät kentälle."],
               "bussi": [0, "Pitkä yömatka on raskas, ja lääkkeet jäisivät kentälle."],
               "hotelli": [2, "Hän saa levätä. Henkilökunta hakee laukun ja lääkkeet hotelliin."],
               "lounge": [0, "Yö nojatuolissa on liian raskas, ja lääkkeet pitää hakea."]}},
 {"nimi": "Mikko ja opaskoira Nelli", "ikoni": "🦮", "kuvaus": "Mikko on sokea. Menossa Ouluun.",
  "sopivuus": {"lento": [1, "Lento käy, mutta yö pitää ensin odottaa kentällä."],
               "juna": [2, "Junassa on tilaa koiralle, ja konduktööri avustaa."],
               "bussi": [1, "Bussi käy, mutta koiralle on ahdasta koko yön."],
               "hotelli": [2, "Rauhallinen huone sopii Mikolle ja Nellille."],
               "lounge": [0, "Vilkas ja meluisa lounge on vaikea opaskoiralle."]}},
 {"nimi": "Liisa, 35", "ikoni": "🩺", "kuvaus": "Sairaanhoitaja, aamuvuoro Oulun sairaalassa klo 7.",
  "sopivuus": {"lento": [0, "Kone on Oulussa vasta 8.10. Hän myöhästyisi vuorosta."],
               "juna": [1, "Juna on perillä 6.50. Ehtiminen on tosi tiukkaa."],
               "bussi": [2, "Bussi on Oulussa jo 5.00. Hän ehtii vuoroonsa."],
               "hotelli": [0, "Hotellista hän ei ehdi aamuvuoroon."],
               "lounge": [0, "Loungessa odottaminen ei vie häntä töihin ajoissa."]}},
 {"nimi": "Eetu, 19", "ikoni": "🎒", "kuvaus": "Opiskelija, haluaa kotiin Ouluun. Ei kiirettä eikä erityisiä tarpeita.",
  "sopivuus": {"lento": [1, "Käy, mutta vie paikan joltakulta, jolla on kiire."],
               "juna": [1, "Käy, mutta vie makuupaikan joltakulta, joka tarvitsee sitä enemmän."],
               "bussi": [2, "Bussi vie hänet kotiin, eikä hän vie paikkaa keneltäkään."],
               "hotelli": [0, "Hän ei tarvitse huonetta yhtä paljon kuin muut."],
               "lounge": [2, "Nuori ja terve matkustaja pärjää hyvin yön loungessa."]}},
]

LOPPU_TEKSTI = "Autoit lentoasemaa lumimyrskyn keskellä ja järjestit kahdeksalle matkustajalle paikan. Samalla tutustuit kymmeneen kuljetus- ja matkailualan ammattiin."

OPPILAITOKSET = ("Missä palvelualaa voi opiskella?", "Oppilaitokset")
SAILYTA = ["Oppilaitokset"]
SAILYTA_KORVAUKSET = []

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Lennonjohtotorni": "Laskeutumislupaa melkein annettiin liian aikaisin. Lentäjä joutui odottamaan epäselvää ohjetta.",
    "Kiitotie": "Kiitotien avaaminen viivästyi, kun liukkaus piti mitata uudelleen.",
    "Lähtöaula": "Matkustaja suuttui vielä enemmän ja teki valituksen.",
    "Ravintola": "Ruokajono kasvoi pitkäksi, ennen kuin ruokaa riitti kaikille.",
    "Bussipysäkki": "Matkustajat kärsivät odottaessaan, mutta kaikki pääsivät hotelliin turvallisesti.",
    "Hotelli": "Huonejako aiheutti riitaa aulassa, ennen kuin huoneet jaettiin uudelleen.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Kaikilla matkustajilla on paikka, jossa olla yön yli. Myrsky ei voittanut!",
    "Kello on <<print setup.kello($aika)>>. Melkein kaikilla matkustajilla on paikka yön yli. Pari asiaa olisi voinut mennä paremmin.",
    "Kello on <<print setup.kello($aika)>>. Yö lentokentällä oli kaoottinen. Moni matkustaja oli vihainen, ja lentoasema saa paljon valituksia.",
]
MYOHASSA = "Ilta venyi niin myöhään, että osa matkustajista pääsi hotelliin vasta keskellä yötä."
