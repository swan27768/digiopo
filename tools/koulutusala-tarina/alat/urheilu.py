# -*- coding: utf-8 -*-
"""Urheilu, tanssi ja sirkus – "Finaalipäivä" (sisältö). Uusi ala DigiOpossa.
Rakenna: python3 rakenna_tarina.py alat/urheilu.py <orig palvelu-ala.html> <uusi urheilu-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana käytetään palvelualan
tiedostoa (SugarCube-moottori ja head). TARINA_TUNNISTE antaa tarinalle oman nimen ja
IFID:n, ja oppilaitossivu tehdään LISAPASSAGET-listalla.

Loppuosan tehtävä on "Viikko-ohjelma" (TEHTAVA tyyppi "viikko"): oppilas on valmentaja,
valitsee urheilijan, tanssijan tai sirkusartistin ja suunnittelee hänelle viikon
harjoitukset. Mittari näyttää kuormituksen, ja valmentajan muistilista tarkistaa
ohjelman (lepo, monipuolisuus, kevyt päivä ennen ottelua/esitystä). Lopuksi kaksi perustelua."""

ala = "urheilu"
alaNimi = "Urheilu, tanssi ja sirkus"
tarinaNimi = "Finaalipäivä"
maailma = "areena"
yleisKohtaus = "halli"
katsoTeksti = "Katso areenaa"
kello = {"alku": 8 * 60 + 30}
siirtyma = 60
siirtymaTeksti = "Seuraavaan tilanteeseen on noin tunti."
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Urheiluala", "ifid": "786c5c8f-c986-430c-9870-84ceab2d655c"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Finaali alkaa klo 18.00")]

# Iltainen areena: tummansininen halli, oranssi joukkueväri ja turkoosit valot
TEEMA = """:root {
  --a1: #ff9a4a; --a1-rgb: 255,154,74;
  --a2: #ff6b3d; --a2-rgb: 255,107,61;
  --a3: #ffc79a;
  --korostus: #3ddbd9; --korostus-rgb: 61,219,217;
  --tausta: #0d1530; --tausta-rgb: 13,21,48;
  --tausta-2: #16214a; --tausta-2-rgb: 22,33,74;
  --paneeli: #121c3d; --paneeli-rgb: 18,28,61;
  --paneeli-2: #1c2a55;
  --tumma: #080d20; --tumma-rgb: 8,13,32;
  --reuna: #ff9a4a;
  --teksti-pehmea: #d3dcf2; --teksti-pehmea-rgb: 211,220,242;
  --teksti-vaalea: #f4f7fd;
  --nappi-teksti: #2a1000;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #ffd9b8;
  --kansi-nappi-varjo: #8a3a10;
  --kansi-nappi-hehku: 255,154,74;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.94) 0%, rgba(var(--tausta-rgb),.78) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Palveluala", otsikko="Urheiluala",
             alaotsikko="Finaalipäivä · Ketä kaikkia tarvitaan, kun nuoret onnistuvat isolla areenalla?",
             nappi="Astu areenalle", ikoni="pokaali")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet nuorten salibandyjoukkue Kotkien valmentaja. Tänään pelataan SM-finaali. Erätauolla areenalla esiintyy tanssi- ja sirkusryhmä. Miten sinä toimisit isona päivänä?",
            faktat=[("6", "ammattilaista"), ("1", "finaali"), ("2", "esitystä")])

KUVA = "../../images/koulutusalat/"
# Aidot urheilukuvat koko ruudun taustoina (muokattu niin, ettei lähde tunnistu)
TAUSTAKUVAT = {"kansi": KUVA + "urheilu-jaakiekko-tausta.webp",
               "alku": KUVA + "urheilu-jalkapallo-tausta.webp",
               "tehtava": KUVA + "urheilu-lentopallo-tausta.webp",
               "kortti": KUVA + "urheilu-juoksija-tausta.webp",
               "loppu": [KUVA + "urheilu-jaakiekko-tausta.webp", KUVA + "urheilu-jalkapallo-tausta.webp", KUVA + "urheilu-lentopallo-tausta.webp"],
               "oppilaitokset": [KUVA + "urheilu-juoksija-tausta.webp", KUVA + "urheilu-jalkapallo-tausta.webp"]}

TARINA_ALKU = dict(nimi="Finaalipäivä", tausta="halli", teksti="""<<include "HUD">>
<h1>Finaalipäivä</h1>
<p>Kello on 8.30. Olet nuorten salibandyjoukkue Kotkien valmentaja. Valmentaja suunnittelee harjoitukset ja auttaa pelaajia onnistumaan, myös silloin kun jännittää.</p>
<p>Illalla kello 18 pelataan SM-finaali Haukkoja vastaan. Erätauolla areenalla esiintyvät nuorten tanssiryhmä ja sirkusryhmä. Katsomoon tulee yli tuhat ihmistä.</p>
<p class="puhe"><strong>Joukkueenjohtaja Pia:</strong> ”Tästä tulee pitkä ja upea päivä. Aloitetaan aamuharjoituksella!”</p>
<div class="intro-nappi"><<link "Mene kentälle">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Aamuharjoitus", tausta="lammittely", otsikko="Aamuharjoitus", avain="liikuntaneuvoja",
      kysymys="Miltä liikuntaneuvojan työ näytti?",
      taustakuva=KUVA + "urheilu-juoksija-tausta.webp",
      johdanto="""<p>Areenalla on vielä hiljaista. Joukkue tulee aamuharjoitukseen.</p>
<p>Pelaajat ovat innoissaan. Moni haluaa treenata tänään tosi kovaa, jotta illalla menisi hyvin.</p>
<p class="puhe"><strong>Jere, liikuntaneuvoja:</strong> ”Minä vedän lämmittelyn. Millainen harjoitus tänään tehdään?”</p>""",
      valinnat=[
       dict(teksti="Kevyt herättely: lämmittely, vähän syöttöjä ja illan taktiikka läpi.", aika=45, piirteet={"keho": 2, "rauhallinen": 1},
            palaute="<p><strong>Juuri oikein!</strong></p><p>Pelipäivän aamuna keho herätellään, mutta sitä ei väsytetä. Jere vetää iloisen lämmittelyn, ja joukkue käy taktiikan läpi.</p>"),
       dict(teksti="Kova treeni, niin olemme illalla varmasti valmiita.", aika=60, piirteet={},
            palaute="<p><strong>Liian raskasta.</strong></p><p>Kova treeni aamulla vie voimat illalta. Jere ehdottaa kevyttä herättelyä ja taktiikkaa.</p>"),
       dict(teksti="Ei harjoitusta ollenkaan. Kaikki lepäävät.", aika=30, piirteet={"keho": 1},
            palaute="<p><strong>Lepo on tärkeää, mutta…</strong></p><p>…kevyt liike herättää kehon ja vähentää jännitystä. Jere vetää lyhyen ja kevyen harjoituksen.</p>"),
      ]),
 dict(nimi="Fysioterapia", tausta="fysio", otsikko="Kipeä nilkka", avain="fysioterapeutti",
      kysymys="Miltä fysioterapeutin työ näytti?",
      johdanto="""<p>Harjoituksen lopussa kapteeni Venla kaatuu ja pitelee nilkkaansa.</p>
<p>Hän nousee ylös ja sanoo: ”Ei tämä mitään. Minä pelaan illalla!”</p>
<p class="puhe"><strong>Noora, fysioterapeutti:</strong> ”Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Noora tutkii nilkan. Päätämme illan pelistä, kun tiedämme enemmän.", aika=45, piirteet={"turva": 2, "keho": 1},
            palaute="<p><strong>Viisas valinta!</strong></p><p>Noora testaa nilkan liikkeet. Nilkka on vain vähän venähtänyt. Noora teippaa sen, ja Venla saa pelata, jos kipu ei kasva.</p>"),
       dict(teksti="Venla on kapteeni. Hän pelaa, vaikka sattuisi.", aika=30, piirteet={},
            palaute="<p><strong>Kipu on kehon viesti.</strong></p><p>Jos pelaa kipeällä nilkalla, vamma voi pahentua. Noora tutkii nilkan ensin.</p>"),
       dict(teksti="Venla jää heti pois finaalista.", aika=30, piirteet={"turva": 1},
            palaute="<p><strong>Varovaista, mutta liian nopeasti päätetty.</strong></p><p>Ensin kannattaa selvittää, mitä nilkalle tapahtui. Noora tutkii sen, ja vamma on onneksi pieni.</p>"),
      ]),
 dict(nimi="Tanssiryhmä", tausta="tanssi", otsikko="Tanssiryhmän harjoitus", avain="tanssija",
      kysymys="Miltä tanssijan työ näytti?",
      johdanto="""<p>Iltapäivällä areenalla harjoittelee tanssiryhmä. He esiintyvät finaalin ensimmäisellä erätauolla.</p>
<p>Yksi tanssijoista, Mette, pysähtyy kesken harjoituksen. Hän unohti koreografian eli tanssin liikesarjan.</p>
<p>Mette sanoo hiljaa: ”En pysty esiintymään tuhannen ihmisen edessä.”</p>
<p class="puhe"><strong>Iina, tanssija:</strong> ”Sinä olet valmentaja ja tiedät jännityksestä. Mitä sanoisit Metelle?”</p>""",
      valinnat=[
       dict(teksti="Jännitys on ihan normaalia. Hengitetään rauhassa ja käydään liikkeet hitaasti läpi yhdessä.", aika=60, piirteet={"rauhallinen": 2, "kannustaja": 1},
            palaute="<p><strong>Hyvää tukea!</strong></p><p>Kun liikkeet käydään hitaasti läpi, ne palaavat mieleen. Mette rauhoittuu ja haluaa esiintyä.</p>"),
       dict(teksti="Kaikki jännittävät. Älä ole noin herkkä.", aika=45, piirteet={},
            palaute="<p><strong>Tämä ei auta.</strong></p><p>Metellä on nyt vielä huonompi olo. Iina rauhoittaa häntä, ja he käyvät liikkeet hitaasti läpi.</p>"),
       dict(teksti="Mette voi jäädä pois, jos haluaa.", aika=45, piirteet={"kannustaja": 1},
            palaute="<p><strong>Ystävällistä, mutta…</strong></p><p>…moni jännittäjä onnistuu, kun saa tukea. Iina ja Mette käyvät liikkeet yhdessä läpi, ja Mette päättää esiintyä.</p>"),
      ]),
 dict(nimi="Sirkusnumero", tausta="sirkus", otsikko="Sirkusnumero katon alla", avain="sirkusartisti",
      kysymys="Miltä sirkusartistin työ näytti?",
      johdanto="""<p>Katon alla roikkuu ilmavanne. Sirkusartisti Aleksi tekee siinä show'n huippunumeron, korkealla yleisön yläpuolella.</p>
<p>Aikaa on vähän, ja Aleksi haluaisi aloittaa harjoituksen heti.</p>
<p class="puhe"><strong>Aleksi, sirkusartisti:</strong> ”Vanne on kiinnitetty kattoon. Aloitetaanko?”</p>""",
      valinnat=[
       dict(teksti="Tarkistetaan ensin kiinnitys, köysi ja turvamatto yhdessä.", aika=45, piirteet={"turva": 2},
            palaute="<p><strong>Ammattilaisen tapa!</strong></p><p>Sirkuksessa turvallisuus tarkistetaan aina ennen kuin noustaan ilmaan. Aleksi ja areenan teknikko käyvät kiinnitykset läpi. Kaikki on kunnossa.</p>"),
       dict(teksti="Ei ehditä tarkistaa. Mennään heti ilmaan.", aika=30, piirteet={},
            palaute="<p><strong>Liian vaarallista!</strong></p><p>Korkealla pienikin vika voi olla vaarallinen. Aleksi tarkistaa kiinnitykset ennen kuin nousee ilmaan.</p>"),
       dict(teksti="Tehdään numero lattialla, niin se on turvallisempi.", aika=30, piirteet={"turva": 1},
            palaute="<p><strong>Turvallista, mutta numero menisi pilalle.</strong></p><p>Kun kiinnitykset tarkistetaan huolella, ilmanumeron voi tehdä turvallisesti. Aleksi ja teknikko tarkistavat ne yhdessä.</p>"),
      ]),
 dict(nimi="Pukukoppi", tausta="pukukoppi", otsikko="Pukukoppi ennen peliä", avain="hieroja",
      kysymys="Miltä hierojan työ näytti?",
      johdanto="""<p>Finaalin alkuun on vähän aikaa. Pukukopissa on hiljaista. Moni pelaaja jännittää, ja lihakset tuntuvat jäykiltä.</p>
<p class="puhe"><strong>Timo, hieroja:</strong> ”Ehdin hoitaa muutaman pelaajan. Mitä teen?”</p>""",
      valinnat=[
       dict(teksti="Lyhyt ja kevyt hieronta. Sitten lämmittely ja yhteinen kannustushuuto.", aika=30, piirteet={"keho": 1, "kannustaja": 2},
            palaute="<p><strong>Täydellistä!</strong></p><p>Kevyt hieronta herättää lihakset. Lämmittely ja yhteinen huuto nostavat tunnelmaa. Joukkue on valmis!</p>"),
       dict(teksti="Syvä ja tehokas hieronta jumissa oleville lihaksille.", aika=45, piirteet={},
            palaute="<p><strong>Ei juuri ennen peliä.</strong></p><p>Syvä hieronta voi väsyttää lihakset. Sen aika on pelin jälkeen. Timo tekee nyt kevyen hieronnan.</p>"),
       dict(teksti="Ei hierontaa. Katsotaan vielä videoita vastustajasta.", aika=45, piirteet={"rauhallinen": 1},
            palaute="<p><strong>Videot katsottiin jo eilen.</strong></p><p>Nyt keho tarvitsee lämmittelyä ja mieli kannustusta. Timo tekee kevyen hieronnan, ja joukkue lähtee lämmittelemään.</p>"),
      ]),
 dict(nimi="Finaali", tausta="finaali", otsikko="Finaali käynnissä", avain="erotuomari",
      kysymys="Miltä erotuomarin työ näytti?",
      johdanto="""<p>Areena on täynnä. Erätauon show sai valtavat aplodit, ja Mette hymyili koko esityksen ajan.</p>
<p>Toinen erä on menossa. Erotuomari antaa Eemelille kahden minuutin jäähyn. Eemeli suuttuu ja alkaa huutaa tuomarille.</p>
<p class="puhe"><strong>Hanna, erotuomari:</strong> ”Valmentaja, rauhoitatko pelaajasi?”</p>""",
      valinnat=[
       dict(teksti="Rauhoitan Eemelin. Kysyn tuomarilta tilanteesta asiallisesti erätauolla.", aika=20, piirteet={"rauhallinen": 2, "kannustaja": 1},
            palaute="<p><strong>Reilu peli!</strong></p><p>Eemeli istuu jäähyn rauhassa. Erätauolla Hanna kertoo, miksi jäähy tuli. Eemeli ymmärtää ja pelaa loppuottelun hienosti.</p>"),
       dict(teksti="Huudan itsekin tuomarille. Jäähy oli väärä!", aika=20, piirteet={},
            palaute="<p><strong>Huono esimerkki.</strong></p><p>Valmentajakin voi saada rangaistuksen. Hanna muistuttaa, että kaikkia kohdellaan kunnioittavasti. Rauhoitat Eemelin.</p>"),
       dict(teksti="En sano mitään. Eemeli hoitakoon asiansa itse.", aika=20, piirteet={},
            palaute="<p><strong>Valmentaja auttaa pelaajaa.</strong></p><p>Eemeli voi saada lisää rangaistusta. Rauhoitat hänet, ja peli jatkuu.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Loppusummeri", teksti="""<h1>Loppusummeri</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Kotkat voittaa finaalin 5–4!</p>
<<if _taso is 0>><p>Venla pelasi teipatulla nilkalla koko ottelun. Erätauon show oli illan kohokohta, ja yleisö taputti seisaaltaan.</p><</if>>
<p>Huomasitko? Finaalipäivänä tarvittiin monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Jere, liikuntaneuvoja</strong> – veti aamun harjoituksen</li>
<li><strong>Noora, fysioterapeutti</strong> – tutki ja teippasi nilkan</li>
<li><strong>Iina, tanssija</strong> – esiintyi ja tuki ryhmäänsä</li>
<li><strong>Aleksi, sirkusartisti</strong> – teki ilmanumeron turvallisesti</li>
<li><strong>Timo, hieroja</strong> – valmisti lihakset peliin</li>
<li><strong>Hanna, erotuomari</strong> – piti huolen reilusta pelistä</li>
</ul>
<p>Sinä olit valmentaja. Moneen näistä töistä voi opiskella ammattikoulussa: liikunnanohjauksen, tanssialan tai sirkusalan perustutkinnossa. Fysioterapeutiksi opiskellaan ammattikorkeakoulussa.</p>""")

PIIRTEET = {
 "keho": {"nimi": "Kehon kuuntelija", "kuvaus": "Tiedät, että keho tarvitsee sekä treeniä että lepoa."},
 "turva": {"nimi": "Turvallisuus ensin", "kuvaus": "Et ota turhia riskejä, kun kyse on ihmisten terveydestä."},
 "rauhallinen": {"nimi": "Rauhallinen paineessa", "kuvaus": "Pysyt rauhallisena, vaikka tilanne on jännittävä."},
 "kannustaja": {"nimi": "Kannustaja", "kuvaus": "Autat muita uskomaan itseensä."},
}

AMMATIT = {
 "liikuntaneuvoja": {"nimi": "Liikuntaneuvoja", "kuvaus": "Ohjaa liikuntaa ja harjoituksia eri-ikäisille.",
                     "tutkinto": "Liikunnanohjauksen perustutkinto (liikuntaneuvoja)", "piirteet": ["keho", "kannustaja"]},
 "fysioterapeutti": {"nimi": "Fysioterapeutti", "kuvaus": "Tutkii ja hoitaa vammoja ja neuvoo, miten keho pysyy kunnossa.",
                     "tutkinto": "Fysioterapeutti (AMK), ammattikorkeakoulu", "piirteet": ["keho", "turva"]},
 "tanssija": {"nimi": "Tanssija", "kuvaus": "Esiintyy ja ilmaisee tarinoita ja tunteita liikkeellä.",
              "tutkinto": "Tanssialan perustutkinto (tanssija)", "piirteet": ["kannustaja", "rauhallinen"]},
 "sirkusartisti": {"nimi": "Sirkusartisti", "kuvaus": "Tekee akrobatiaa, ilmanumeroita tai jongleerausta esityksissä.",
                   "tutkinto": "Sirkusalan perustutkinto (sirkusartisti)", "piirteet": ["turva", "rauhallinen"]},
 "hieroja": {"nimi": "Hieroja", "kuvaus": "Huoltaa lihaksia ja auttaa palautumaan rasituksesta.",
             "tutkinto": "Hieronnan ammattitutkinto (koulutettu hieroja)", "piirteet": ["keho", "rauhallinen"]},
 "erotuomari": {"nimi": "Erotuomari", "kuvaus": "Valvoo, että peliä pelataan sääntöjen mukaan ja reilusti.",
                "tutkinto": "Lajiliiton tuomarikoulutus. Usein sivutyö opiskelun tai muun työn ohella", "piirteet": ["rauhallinen", "turva"]},
}

KUTSU_JOHDANTO = "Tarinassa näit, että urheilija, tanssija ja sirkusartisti tarvitsevat sekä kovaa treeniä että lepoa. Nyt olet itse valmentaja! Valitse yksi nuori ja suunnittele hänelle viikon harjoitukset."

KOULU = {"nimi": "Koulu", "ikoni": "🏫", "kuorma": 0}
def koulu():
    return {p + "-Aamu": KOULU for p in ["Ma", "Ti", "Ke", "To", "Pe"]}

def saannot(laji_nimi, tapahtuma_pv, tapahtuma_nimi, lisat, kuorma):
    """Muistilista. tapahtuma_pv = päivän indeksi (0 = ma), jonka pitää olla kevyt."""
    pv = ["maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai", "sunnuntai"][tapahtuma_pv]
    return ([{"tyyppi": "maara", "harj": "laji", "min": 3, "max": 4, "nimi": f"{laji_nimi} 3–4 kertaa viikossa",
              "selitys": "Taito kehittyy, kun treenaat säännöllisesti. Yli neljä lajitreeniä viikossa on koulun ohella liikaa.", "ammattilainen": "Valmentaja"}]
            + lisat +
            [{"tyyppi": "kevyet", "min": 2, "nimi": "Vähintään 2 kevyttä päivää (kuorma 0–1)",
              "selitys": "Keho vahvistuu levossa, ei treenissä. Kevyenä päivänä voi levätä tai venytellä.", "ammattilainen": "Valmentaja"},
             {"tyyppi": "paiva", "paiva": tapahtuma_pv, "max": 1, "nimi": f"Kevyt {pv} ennen {tapahtuma_nimi}",
              "selitys": "Kun edellinen päivä on kevyt, keho on virkeä ja valmis isoon päivään.", "ammattilainen": "Valmentaja"},
             {"tyyppi": "paivaMax", "max": 4, "nimi": "Ei liian raskaita päiviä (kuorma enintään 4)",
              "selitys": "Kaksi kovaa treeniä samana päivänä kuormittaa liikaa, kun koulupäiväkin on takana.", "ammattilainen": "Fysioterapeutti"},
             {"tyyppi": "putki", "max": 3, "nimi": "Enintään 3 raskasta päivää peräkkäin",
              "selitys": "Pitkä putki ilman kevyttä päivää lisää loukkaantumisen riskiä.", "ammattilainen": "Fysioterapeutti"},
             {"tyyppi": "kuorma", "min": kuorma[0], "max": kuorma[1], "nimi": f"Viikon kuormitus {kuorma[0]}–{kuorma[1]}",
              "selitys": "Liian kevyt viikko ei kehitä. Liian raskas viikko väsyttää ja altistaa vammoille.", "ammattilainen": "Valmentaja"}])

TEHTAVA = dict(
    tyyppi="viikko",
    nimi="Viikko-ohjelma", tag="Tehtävä · noin 25 min",
    maara="<strong>yhden viikon</strong> harjoitukset yhdelle nuorelle",
    ohjeAskelLause="Teet kolme asiaa:",
    askeleet=["Valitse urheilija, tanssija tai sirkusartisti. Vaihtoehtoja on viisi.",
              "Lisää harjoitukset ja lepo viikkokalenteriin. Mittari ja valmentajan muistilista auttavat.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Lopuksi näet, kuinka hyvä ohjelmasta tuli. Lataa vastauksesi ja palauta ne Classroomiin.",
    tulosOtsikko="Valmentajan raportti",
    osa0="Valitse henkilö", osa1="Osa 1/2 · Viikko-ohjelma", osa2="Osa 2/2 · Perustelut",
    valintaOtsikko="Kenen valmentaja olet?",
    valintaOhje="Valitse yksi nuori. Suunnittelet hänelle ensi viikon harjoitukset. Koulu on arkiaamuisin, ja viikolla on myös iso tapahtuma.",
    ohje="Koulupäivät ja tapahtuma ovat valmiina kalenterissa. Lisää muut harjoitukset ja lepo. Jokaisella harjoituksella on kuorma: mitä isompi luku, sitä rankempi treeni.",
    vinkki="Valitse ylhäältä harjoitus. Napauta sitten viikosta kohtaa, johon lisäät sen. Kun napautat samaa kohtaa uudelleen, se tyhjenee.",
    saannotOtsikko="Valmentajan muistilista",
    mittariOtsikko="Viikon kuormitus", mittariKevyt="Liian kevyt", mittariSopiva="Sopiva", mittariRaskas="Liian raskas",
    tarkistaNappi="Tarkista ohjelma", jatkaNappi="Jatka perusteluihin", takaisinNappi="Muuta ohjelmaa", vaihdaNappi="Vaihda henkilöä", valmisNappi="Katso raportti",
    perusteluOtsikko="Hyvää työtä, valmentaja!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="VALMENTAJAN RAPORTTI · VIIKKO-OHJELMA",
    palaute=["Huippuohjelma! Tässä on treeniä, lepoa ja monipuolisuutta juuri sopivasti.",
             "Hyvä ohjelma! Pari asiaa vielä, niin viikko olisi täydellinen.",
             "Hyvä yritys! Katso muistilistan selitykset: niistä näet, mitä keho tarvitsee."],
    harjoitteet=[
        {"avain": "laji", "nimi": "Lajitreeni", "ikoni": "🏅", "kuorma": 3},
        {"avain": "voima", "nimi": "Voima", "ikoni": "💪", "kuorma": 2},
        {"avain": "kesto", "nimi": "Kestävyys", "ikoni": "🏃", "kuorma": 2},
        {"avain": "liikkuvuus", "nimi": "Liikkuvuus", "ikoni": "🧘", "kuorma": 1},
        {"avain": "lepo", "nimi": "Lepo", "ikoni": "😴", "kuorma": 0},
    ],
    kysymykset=[
        {"kysymys": "Miksi {nimi} tarvitsee lepopäiviä, vaikka hän haluaa kehittyä?", "ammattilainen": "Valmentaja",
         "tutkinto": "Liikunnanohjauksen perustutkinto, myöhemmin liikunnan ja valmennuksen ammattitutkinto (valmentaja)", "placeholder": "Lepo on tärkeää, koska…"},
        {"kysymys": "{nimi} sanoo: ”Haluan treenata joka päivä, niin minusta tulee paras.” Mitä vastaisit hänelle?", "ammattilainen": "Fysioterapeutti",
         "tutkinto": "Fysioterapeutti (AMK)", "placeholder": "Sanoisin hänelle, että…"},
    ],
    ammattilaisetOtsikko="Näissä töissä suunnitellaan harjoittelua ja huolletaan kehoa",
    ammattilaiset=[
        {"nimi": "Valmentaja", "tehtava": "suunnittelee harjoitukset ja tukee urheilijaa", "tutkinto": "Liikunnanohjauksen perustutkinto, myöhemmin liikunnan ja valmennuksen ammattitutkinto (valmentaja)"},
        {"nimi": "Liikuntaneuvoja", "tehtava": "ohjaa liikuntaa ryhmille ja yksittäisille ihmisille", "tutkinto": "Liikunnanohjauksen perustutkinto"},
        {"nimi": "Fysioterapeutti", "tehtava": "hoitaa vammoja ja neuvoo kehonhuollossa", "tutkinto": "Fysioterapeutti (AMK)"},
        {"nimi": "Tanssija", "tehtava": "harjoittelee ja esiintyy tanssiryhmässä", "tutkinto": "Tanssialan perustutkinto, myöhemmin esimerkiksi tanssinopettaja (AMK)"},
        {"nimi": "Sirkusartisti", "tehtava": "harjoittelee ja esiintyy sirkusnumeroissa", "tutkinto": "Sirkusalan perustutkinto, myöhemmin esimerkiksi sirkuksen AMK-koulutus"},
        {"nimi": "Liikunnanohjaaja (AMK)", "tehtava": "suunnittelee ja johtaa liikunta- ja urheilutoimintaa", "tutkinto": "Liikunnanohjaaja (AMK), ammattikorkeakoulu"},
    ],
)

# Henkilöt: kiinteat = valmiit menot kalenterissa (solu "Pv-Jakso"), saannot = muistilista
KUTSU_KORTIT = [
 {"nimi": "Leo, 15", "laji": "salibandypelaaja", "ikoni": "🏑", "lajiNimi": "Salibandytreeni",
  "kuvaus": "Pelaa Kotkien nuorissa. Lauantai-iltana on tärkeä sarjaottelu.",
  "kiinteat": dict(koulu(), **{"La-Ilta": {"nimi": "Ottelu", "ikoni": "🏆", "kuorma": 3}}),
  "saannot": saannot("Salibandytreeni", 4, "ottelua", [
      {"tyyppi": "maara", "harj": "voima", "min": 1, "nimi": "Vähintään 1 voimaharjoitus",
       "selitys": "Vahvat lihakset suojaavat polvia ja nilkkoja. Salibandyssa tehdään paljon nopeita käännöksiä.", "ammattilainen": "Fysioterapeutti"},
  ], (12, 18))},
 {"nimi": "Onni, 15", "laji": "jääkiekkoilija", "ikoni": "🏒", "lajiNimi": "Jäätreeni",
  "kuvaus": "Pelaa nuorten jääkiekkojoukkueessa. Perjantai-iltana on tärkeä ottelu.",
  "kiinteat": dict(koulu(), **{"Pe-Ilta": {"nimi": "Ottelu", "ikoni": "🏆", "kuorma": 3}}),
  "saannot": saannot("Jäätreeni", 3, "ottelua", [
      {"tyyppi": "maara", "harj": "voima", "min": 1, "nimi": "Vähintään 1 voimaharjoitus",
       "selitys": "Jääkiekossa kamppaillaan ja taklataan. Vahva keskivartalo ja jalat suojaavat loukkaantumisilta.", "ammattilainen": "Valmentaja"},
      {"tyyppi": "maara", "harj": "liikkuvuus", "min": 1, "nimi": "Vähintään 1 liikkuvuusharjoitus",
       "selitys": "Luistelu kuormittaa lonkkia ja nivusia. Liikkuvuusharjoitus auttaa niitä palautumaan.", "ammattilainen": "Fysioterapeutti"},
  ], (12, 18))},
 {"nimi": "Mira, 15", "laji": "juoksija, 400 metriä", "ikoni": "🏃", "lajiNimi": "Vauhtitreeni",
  "kuvaus": "Juoksee seurassa 400 metriä. Keskiviikkoiltana on hallikilpailu.",
  "kiinteat": dict(koulu(), **{"Ke-Ilta": {"nimi": "Kilpailu", "ikoni": "🏆", "kuorma": 3}}),
  "saannot": saannot("Vauhtitreeni", 1, "kilpailua", [
      {"tyyppi": "maara", "harj": "kesto", "min": 1, "nimi": "Vähintään 1 kestävyysharjoitus",
       "selitys": "Rauhallinen pitkä lenkki kasvattaa peruskuntoa. Silloin jaksaa juosta kovaa koko matkan.", "ammattilainen": "Valmentaja"},
      {"tyyppi": "maara", "harj": "voima", "min": 1, "nimi": "Vähintään 1 voimaharjoitus",
       "selitys": "Vahvat jalat antavat juoksuun vauhtia ja suojaavat jänteitä.", "ammattilainen": "Fysioterapeutti"},
  ], (12, 18))},
 {"nimi": "Aino, 15", "laji": "sirkusartisti, ilma-akrobatia", "ikoni": "🤸", "lajiNimi": "Sirkustreeni",
  "kuvaus": "Harjoittelee ilmavanteessa. Sunnuntai-iltana on sirkuskoulun esitys.",
  "kiinteat": dict(koulu(), **{"Su-Ilta": {"nimi": "Esitys", "ikoni": "🎪", "kuorma": 3}}),
  "saannot": saannot("Sirkustreeni", 5, "esitystä", [
      {"tyyppi": "maara", "harj": "voima", "min": 1, "nimi": "Vähintään 1 voimaharjoitus",
       "selitys": "Ilma-akrobatia vaatii vahvat kädet ja vahvan keskivartalon. Silloin roikkuminen ja liikkeet onnistuvat turvallisesti.", "ammattilainen": "Sirkusartisti"},
      {"tyyppi": "maara", "harj": "liikkuvuus", "min": 2, "nimi": "Vähintään 2 liikkuvuusharjoitusta",
       "selitys": "Notkeus auttaa tekemään liikkeet kauniisti ja suojaa venähdyksiltä.", "ammattilainen": "Fysioterapeutti"},
  ], (13, 19))},
 {"nimi": "Sara, 14", "laji": "tanssija, nykytanssi", "ikoni": "💃", "lajiNimi": "Tanssitreeni",
  "kuvaus": "Tanssii nykytanssin ryhmässä. Lauantaiaamuna on tanssikilpailu.",
  "kiinteat": dict(koulu(), **{"La-Aamu": {"nimi": "Kilpailu", "ikoni": "🏆", "kuorma": 3}}),
  "saannot": saannot("Tanssitreeni", 4, "kilpailua", [
      {"tyyppi": "maara", "harj": "liikkuvuus", "min": 2, "nimi": "Vähintään 2 liikkuvuusharjoitusta",
       "selitys": "Tanssija tarvitsee notkeutta: korkeat potkut ja hypyt onnistuvat, eikä lihas revähdä.", "ammattilainen": "Tanssija"},
      {"tyyppi": "maara", "harj": "kesto", "min": 1, "nimi": "Vähintään 1 kestävyysharjoitus",
       "selitys": "Esitys vaatii kestävyyttä. Hengästyneenäkin pitää jaksaa tanssia loppuun asti.", "ammattilainen": "Valmentaja"},
  ], (12, 18))},
]

LOPPU_TEKSTI = "Olit valmentaja SM-finaalin päivänä ja suunnittelit nuorelle viikon harjoitukset. Samalla tutustuit urheilun, tanssin ja sirkuksen ammatteihin."

OPPILAITOKSET = ("Missä urheilua, tanssia ja sirkusta voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Urheilun, tanssin ja sirkuksen koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Koulutukset ja hakukohteet voivat muuttua. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja oppilaitosten omilta sivuilta.</p>
<h3>Ammatillinen koulutus</h3>
""" + kortti("Kolmen kampuksen urheiluopisto", "Liikunnanohjauksen perustutkinto (liikuntaneuvoja). Kampukset Kisakalliossa, Pajulahdessa ja Helsingissä. Myös valmentajakoulutusta.", "https://www.kolmekampusta.fi")
    + kortti("Lapin urheiluopisto / Redu, Rovaniemi", "Liikunnanohjauksen perustutkinto ja tanssialan perustutkinto (tanssija).", "https://redu.fi")
    + kortti("Kainuun ammattiopisto, Vuokatti", "Liikunnanohjauksen perustutkinto (liikuntaneuvoja).", "https://www.kao.fi")
    + kortti("Varalan urheiluopisto, Tampere", "Liikunnan ja valmennuksen koulutuksia, esimerkiksi valmentajaksi.", "https://www.varala.fi")
    + kortti("Koulutuskeskus Salpaus, Lahti", "Sirkusalan perustutkinto (sirkusartisti).", "https://salpaus.fi")
    + """<h3>Urheilu ja opiskelu yhdessä</h3>
""" + kortti("Urheiluakatemiat, esimerkiksi Urhea", "Urheilijan ammatillinen koulutus: voit opiskella eri ammatteja ja harjoitella koulupäivän aikana.", "https://urhea.fi")
    + """<h3>Ammattikorkeakoulut ja yliopistot</h3>
""" + kortti("Haaga-Helia ammattikorkeakoulu, Vierumäki", "Liikunnanohjaaja (AMK).", "https://www.haaga-helia.fi")
    + kortti("Turun ammattikorkeakoulu, Taideakatemia", "Sirkuksen ja tanssinopettajan AMK-koulutus.", "https://www.turkuamk.fi")
    + kortti("Jyväskylän yliopisto", "Liikuntatieteet, esimerkiksi valmennustiede.", "https://www.jyu.fi")
    + kortti("Etsi lisää Opintopolusta", "Hae sanoilla liikunnanohjaus, tanssiala tai sirkusala.", "https://opintopolku.fi/konfo/fi/haku?keyword=liikunnanohjaus")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Aamuharjoitus": "Aamuharjoitus venyi liian raskaaksi. Osa pelaajista oli illalla väsyneitä.",
    "Fysioterapia": "Venlan nilkan tutkiminen viivästyi, ja hän jännitti, pääseekö pelaamaan.",
    "Tanssiryhmä": "Mette ehti hätääntyä vielä enemmän, ennen kuin hän rauhoittui.",
    "Sirkusnumero": "Harjoitus viivästyi, koska kiinnitykset tarkistettiin vasta viime hetkellä.",
    "Pukukoppi": "Hieroja ehti hoitaa vain osan pelaajista.",
    "Finaali": "Tilanne kärjistyi hetkeksi, ja erotuomari antoi joukkueelle varoituksen.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Kotkat voittaa finaalin 5–4! Koko päivän työ palkittiin.",
    "Kello on <<print setup.kello($aika)>>. Kotkat voittaa finaalin niukasti jatkoajalla. Pari asiaa teki illasta turhan vaikean.",
    "Kello on <<print setup.kello($aika)>>. Kotkat häviää finaalin 3–5. Päivän virheet tuntuivat illalla kentällä.",
]
