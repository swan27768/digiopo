# -*- coding: utf-8 -*-
"""Luonto- ja ympäristöala – "Mysteeri joella" (sisältö).
Rakenna: python3 rakenna_tarina.py alat/luonto.py <orig luonto-ala.html> <uusi luonto-ala.html>

Loppuosan tehtävä on "Jäljitä lähde kartalla" (TEHTAVA tyyppi "kartta"):
joen kartalla on 8 näytepistettä, ja oppilas saa ottaa vain 5 näytettä. Näytteistä näkyy
happi, sameus ja pH. Lopuksi oppilas valitsee kohdan, josta ongelma alkaa, perustelee sen
ja valitsee korjauksen. Taustakuvat ovat aitoja kuvia Lapin luonnosta."""

ala = "luonto"
alaNimi = "Luonto- ja ympäristöala"
tarinaNimi = "Mysteeri joella"
maailma = "luonto"
yleisKohtaus = "laakso"
katsoTeksti = "Katso maisemaa"
kello = {"alku": 8 * 60, "raja": 480}
aikaRivi = "Mysteeri ratkesi kello"
siirtyma = 20
siirtymaTeksti = "Seuraavaan paikkaan kävelet 20 min."
kutsuTilanneOtsikko = "Tehtävä"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Pimeä tulee klo 16.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Lapin syksy: tumman kuusenvihreät paneelit, ruskan oranssi ja puolukanpunainen
TEEMA = """:root {
  --a1: #f6a94d; --a1-rgb: 246,169,77;
  --a2: #e07b39; --a2-rgb: 224,123,57;
  --a3: #ffd08a;
  --korostus: #ff7b6b; --korostus-rgb: 255,123,107;
  --tausta: #0f1f18; --tausta-rgb: 15,31,24;
  --tausta-2: #1a3127; --tausta-2-rgb: 26,49,39;
  --paneeli: #142a20; --paneeli-rgb: 20,42,32;
  --paneeli-2: #1d3a2c;
  --tumma: #08130e; --tumma-rgb: 8,19,14;
  --reuna: #f6a94d;
  --teksti-pehmea: #d8e6d6; --teksti-pehmea-rgb: 216,230,214;
  --teksti-vaalea: #f3f8ef;
  --nappi-teksti: #2a1405;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #ffe3bf;
  --kansi-nappi-varjo: #8a4316;
  --kansi-nappi-hehku: 246,169,77;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.92) 0%, rgba(var(--tausta-rgb),.7) 38%, rgba(var(--tausta-rgb),.25) 62%, rgba(var(--tausta-rgb),0) 82%) !important;
}"""

KANSI = dict(pieni="Luonto- ja ympäristöala", otsikko="Luontoala",
             alaotsikko="Mysteeri joella · Miksi Lapin joen kalat voivat huonosti?",
             nappi="Lähde maastoon", ikoni="lehti")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet ympäristötarkastaja Lapissa. Joesta on löytynyt kuolleita kaloja, ja vesi on samentunut. Selvitä luonnon ammattilaisten kanssa, mistä ongelma johtuu.",
            faktat=[("6", "ammattilaista"), ("8", "näytepistettä"), ("1", "mysteeri")])

KUVA = "../../images/koulutusalat/"
# Lapin luontokuvat: sivuilla, joilla ei ole omaa kuvaa, arvotaan yksi näistä
LAPPI = [KUVA + n for n in ["luonto-ruska-tausta.webp", "luonto-laakso-tausta.webp", "luonto-puro-tausta.webp",
                            "luonto-tunturi-tausta.webp", "luonto-pitkospuut-tausta.webp", "luonto-kyla-tausta.webp",
                            "luonto-talvi-tausta.webp", "luonto-metsa-tausta.webp"]]
TAUSTAKUVAT = {"kansi": KUVA + "luonto-ruska-tausta.webp",
               "alku": KUVA + "luonto-ruska-tausta.webp",
               "tehtava": KUVA + "luonto-metsa-tausta.webp",
               "kortti": LAPPI, "loppu": LAPPI, "oppilaitokset": LAPPI}

TARINA_ALKU = dict(nimi="Mysteeri joella", tausta="laakso", teksti=f"""<<run setup.taustakuva("{KUVA}luonto-laakso-tausta.webp")>><<include "HUD">>
<h1>Mysteeri joella</h1>
<p>Kello on 8.00. On syyskuu, ja Lapin tunturit hehkuvat ruskan väreissä. Olet kunnan ympäristötarkastaja. Sinun työsi on valvoa, että luontoa ei pilata.</p>
<p>Aamulla tuli outo ilmoitus: Kuukkelijoesta on löytynyt kuolleita harjuksia, ja joen vesi on samentunut.</p>
<p class="puhe"><strong>Kalavesienhoitaja Aatu soittaa:</strong> ”Tämä on mysteeri, joka pitää ratkaista ennen kuin pimeä tulee. Tule joen rantaan.”</p>
<div class="intro-nappi"><<link "Lähde joelle">><<set $aika += 5>><<goto "{{{{ENSIMMAINEN}}}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Kuolleet kalat", taustakuva=KUVA + "luonto-puro-tausta.webp", tausta="ranta", otsikko="Joen ranta", avain="kalavesi",
      kysymys="Miltä kalavesienhoitajan työ näytti?",
      johdanto="""<p>Rannalla on kolme kuollutta harjusta. Joen vesi on ruskean sameaa.</p>
<p class="puhe"><strong>Aatu, kalavesienhoitaja:</strong> ”Ensin pitää kerätä todisteet. Mitä teet?”</p>""",
      valinnat=[
       dict(teksti="Kuvaan kalat, kirjaan paikan ja laitan yhden kalan kylmälaukkuun tutkittavaksi.", aika=15, piirteet={"tutkija": 2},
            palaute="<p><strong>Oikea tutkijan ote!</strong></p><p>Kuvat ja paikka auttavat myöhemmin. Laboratorio voi tutkia kalan ja selvittää, mihin se kuoli.</p>"),
       dict(teksti="Heitän kalat takaisin jokeen.", tyyli="kaytannollinen", aika=10, piirteet={},
            palaute="<p><strong>Todisteet katoavat.</strong></p><p>Aatu ehtii onneksi ottaa yhden kalan talteen. Hän kuvaa sen ja kirjaa paikan.</p>"),
       dict(teksti="Soitan heti kunnan ympäristöviranomaiselle ja kerron kuolleista kaloista.", tyyli="nopea", aika=10, piirteet={"viestija": 1}, palaute="<p><strong>Hyvä ilmoittaa, mutta ensin todisteet.</strong></p><p>Viranomainen tarvitsee kuvia, paikan ja kalan tutkittavaksi. Jos niitä ei kerätä nyt, virta vie ne mukanaan. Aatu kuvaa kalat ja kirjaa paikan, ja sitten soitetaan.</p>"),
      ]),
 dict(nimi="Näytteenotto", taustakuva=KUVA + "luonto-pitkospuut-tausta.webp", tausta="naytteet", otsikko="Näytteenotto", avain="ymparisto",
      kysymys="Miltä ympäristönhoitajan työ näytti?",
      johdanto="""<p>Ympäristönhoitaja Saana tulee paikalle näytepulloineen.</p>
<p class="puhe"><strong>Saana, ympäristönhoitaja:</strong> ”Näytteistä näkee, onko vedessä tarpeeksi happea ja kuinka sameaa se on. Mistä näytteet kannattaa ottaa?”</p>""",
      valinnat=[
       dict(teksti="Monesta kohdasta, sekä ylä- että alajuoksulta.", aika=15, piirteet={"tutkija": 2, "luonto": 1},
            palaute="<p><strong>Juuri niin!</strong></p><p>Kun näytteitä on joen eri kohdista, niitä voi verrata. Silloin näkee, missä kohdassa vesi muuttuu huonoksi.</p>"),
       dict(teksti="Yhdestä kohdasta tästä rannalta.", tyyli="nopea", aika=10, piirteet={},
            palaute="<p><strong>Yksi näyte ei riitä.</strong></p><p>Se kertoo vain, että vesi on huonoa tässä. Se ei kerro, mistä ongelma tulee. Saana päättää ottaa näytteitä monesta kohdasta.</p>"),
       dict(teksti="Ei tarvita näytteitä. Vedestä näkee, että se on sameaa.", tyyli="luottavainen", aika=10, piirteet={},
            palaute="<p><strong>Silmä ei näe kaikkea.</strong></p><p>Esimerkiksi hapen määrää ei voi nähdä. Saana ottaa näytteitä monesta kohdasta.</p>"),
      ]),
 dict(nimi="Laavulla", taustakuva=KUVA + "luonto-metsa-tausta.webp", tausta="laavu", otsikko="Laavulla", avain="ohjaaja",
      kysymys="Miltä luonto-ohjaajan työ näytti?",
      johdanto="""<p>Joen varrella on laavu. Luonto-ohjaaja Mikko on siellä retkiryhmän kanssa. Yksi retkeläisistä haluaa täyttää juomapullonsa joesta.</p>
<p class="puhe"><strong>Mikko, luonto-ohjaaja:</strong> ”Mitä sanoisit hänelle?”</p>""",
      valinnat=[
       dict(teksti="Kerron rauhallisesti, että vettä tutkitaan, ja haetaan juomavesi lähteestä.", aika=15, piirteet={"viestija": 2, "luonto": 1},
            palaute="<p><strong>Hienosti!</strong></p><p>Retkeläinen ymmärtää. Mikko kertoo vielä, että ryhmä näki eilen sateen jälkeen mutaista vettä ylempänä, hakkuuaukean kohdalla. Tärkeä vihje!</p>"),
       dict(teksti="Antaa juoda. Lapin vesi on aina puhdasta.", tyyli="luottavainen", aika=10, piirteet={},
            palaute="<p><strong>Ei tällä kertaa.</strong></p><p>Sameaa vettä ei kannata juoda keittämättä. Mikko hakee juomaveden lähteestä. Hän kertoo, että ryhmä näki eilen mutaista vettä hakkuuaukean kohdalla.</p>"),
       dict(teksti="Neuvon keittämään veden ennen juomista.", tyyli="kaytannollinen", aika=10, piirteet={"luonto": 1}, palaute="<p><strong>Melkein!</strong></p><p>Keittäminen tappaa bakteerit, mutta ei poista mutaa tai mahdollisia kemikaaleja. Kun kukaan ei vielä tiedä, mitä vedessä on, juomavesi haetaan lähteestä.</p>"),
      ]),
 dict(nimi="Poroaidalla", taustakuva=KUVA + "luonto-tunturi-tausta.webp", tausta="porot", otsikko="Poroaidalla", avain="poro",
      kysymys="Miltä poronhoitajan työ näytti?",
      johdanto="""<p>Ylempänä joen varrella on poroaita. Poronhoitaja Elle on tuomassa poroja syyslaitumelle.</p>
<p class="puhe"><strong>Elle, poronhoitaja:</strong> ”Kuljen täällä joka päivä. Kesällä tuolla metsässä kaivettiin uusi oja.”</p>""",
      valinnat=[
       dict(teksti="Kysyn tarkemmin, missä oja on, ja merkitsen sen karttaan.", aika=15, piirteet={"tiimi": 2, "tutkija": 1},
            palaute="<p><strong>Paikallinen tieto on arvokasta!</strong></p><p>Elle näyttää kartalta: oja on hakkuuaukealla, ja se laskee suoraan jokeen.</p>"),
       dict(teksti="Ohitan asian. Porot eivät liity tähän.", tyyli="nopea", aika=10, piirteet={},
            palaute="<p><strong>Tärkeä vihje jäi melkein kuulematta.</strong></p><p>Aatu kysyy Elleltä lisää. Oja on hakkuuaukealla, ja se laskee suoraan jokeen.</p>"),
       dict(teksti="Kysyn, ovatko porot sotkeneet joen.", tyyli="suora", aika=10, piirteet={"tutkija": 1},
            palaute="<p><strong>Hyvä, että kysyt, mutta porot eivät ole syy.</strong></p><p>Porot ovat kulkeneet täällä satoja vuosia. Elle näyttää kartalta, missä uusi oja on.</p>"),
      ]),
 dict(nimi="Hakkuuaukea", taustakuva=KUVA + "luonto-hakkuu-tausta.webp",
      kuva=[dict(src=KUVA + "luonto-vanhametsa.webp", alt="Vanha kuusimetsä, jossa maa on sammaleen peitossa.", leveys=1200, korkeus=782, teksti="Ennen: vanha metsä joen varrella"),
            dict(src=KUVA + "luonto-metsakone.webp", alt="Keltainen metsäkone kaataa puita lumisessa metsässä.", leveys=1200, korkeus=769, teksti="Hakkuu: metsäkone työssä")], tausta="hakkuu", otsikko="Hakkuuaukea", avain="metsa",
      kysymys="Miltä metsäkoneenkuljettajan työ näytti?",
      johdanto="""<p>Hakkuuaukealla seisoo metsäkone. Uudesta ojasta valuu ruskeaa mutaa kohti jokea.</p>
<p class="puhe"><strong>Jussi, metsäkoneenkuljettaja:</strong> ”Ojan päähän piti tehdä laskeutusallas, mutta se jäi kesken. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Kerron, mitä näytteet ja havainnot kertovat, ja ehdotan, että allas tehdään heti.", aika=15, piirteet={"viestija": 2, "luonto": 1},
            palaute="<p><strong>Rakentava ratkaisu!</strong></p><p>Jussi soittaa metsäyhtiöön. Allas tehdään vielä tällä viikolla, ja rantaan jätetään puusto suojavyöhykkeeksi.</p>"),
       dict(teksti="Otan kuvan mutavirrasta ja ilmoitan metsäyhtiölle, että Jussi teki virheen.", tyyli="suora", aika=10, piirteet={}, palaute="<p><strong>Syyttely ei auta.</strong></p><p>Jussi ei yksin päättänyt altaasta, ja hän voi korjata asian heti. Aatu juttelee rauhallisesti, ja yhdessä sovitaan, että allas tehdään heti.</p>"),
       dict(teksti="En sano mitään. Se ei kuulu minulle.", tyyli="varovainen", aika=10, piirteet={},
            palaute="<p><strong>Luonnon puolesta saa puhua.</strong></p><p>Aatu kertoo havainnoista. Jussi soittaa metsäyhtiöön, ja allas tehdään vielä tällä viikolla.</p>"),
      ]),
 dict(nimi="Laboratorio", taustakuva=KUVA + "luonto-kyla-tausta.webp",
      kuva=dict(src=KUVA + "luonto-labranaytteet.webp", alt="Vesinäytteitä koeputkissa telineessä. Nesteet ovat keltaisia, vihreitä ja sinisiä.", leveys=1000, korkeus=661), tausta="kyla", otsikko="Kylän laboratorio", avain="laborantti",
      kysymys="Miltä laborantin työ näytti?",
      johdanto="""<p>Kylän laboratoriossa laborantti Noora tutkii Saanan näytteet. Tulokset ovat valmiina.</p>
<p class="puhe"><strong>Noora, laborantti:</strong> ”Näytteitä on kahdeksasta kohdasta. Miten saamme selville, mistä ongelma alkaa?”</p>""",
      valinnat=[
       dict(teksti="Vertaillaan tuloksia järjestyksessä yläjuoksulta alajuoksulle.", aika=15, piirteet={"tutkija": 2},
            palaute="<p><strong>Täsmälleen!</strong></p><p>Yläjuoksulla vesi on kirkasta. Hakkuuaukean ojan kohdalla sameus nousee yhtäkkiä, ja happea on vähemmän. Mysteeri on ratkaistu!</p>"),
       dict(teksti="Katsotaan vain huonoin tulos.", tyyli="nopea", aika=10, piirteet={},
            palaute="<p><strong>Huonoin tulos ei kerro, mistä ongelma alkaa.</strong></p><p>Noora järjestää tulokset joen suunnassa. Hakkuuaukean ojan kohdalla sameus nousee yhtäkkiä.</p>"),
       dict(teksti="Lähetetään näytteet isompaan laboratorioon lisätutkimuksiin.", tyyli="varovainen", aika=10, piirteet={"tutkija": 1}, palaute="<p><strong>Huolellista, mutta hidasta.</strong></p><p>Lisätutkimukset kestävät viikkoja. Vastaus löytyy jo nyt, kun tulokset järjestetään joen suuntaan. Hakkuuaukean ojan kohdalla sameus nousee yhtäkkiä.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Joki toipuu", teksti=f"""<<run setup.taustakuva("{KUVA}luonto-talvi-tausta.webp")>><h1>Joki toipuu</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Mysteeri on ratkaistu ennen pimeää!</p>
<p>Ojaan rakennetaan laskeutusallas, joka pysäyttää mudan. Rantaan jätetään puusto suojavyöhykkeeksi. Pian tulee talvi, ja joki saa levätä jään alla.</p>
<p>Seuraavana keväänä vesi on taas kirkasta, ja harjukset palaavat kutemaan.</p>
<p>Huomasitko? Yhden mysteerin ratkaisuun tarvittiin kuusi ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Aatu, kalavesienhoitaja</strong> – keräsi todisteet</li>
<li><strong>Saana, ympäristönhoitaja</strong> – otti vesinäytteet</li>
<li><strong>Mikko, luonto-ohjaaja</strong> – piti retkeläiset turvassa</li>
<li><strong>Elle, poronhoitaja</strong> – kertoi, missä uusi oja on</li>
<li><strong>Jussi, metsäkoneenkuljettaja</strong> – teki korjauksen</li>
<li><strong>Noora, laborantti</strong> – tutki näytteet</li>
</ul>
<p>Kaikkiin näihin ammatteihin voi opiskella ammattikoulussa.</p>""")

PIIRTEET = {
 "tutkija": {"nimi": "Tutkija", "kuvaus": "Keräät todisteita ennen kuin teet päätöksen."},
 "luonto": {"nimi": "Luonnon puolustaja", "kuvaus": "Mietit, miten luonto voi hyvin."},
 "viestija": {"nimi": "Selkeä viestijä", "kuvaus": "Kerrot asiat rauhallisesti ja totuudenmukaisesti."},
 "tiimi": {"nimi": "Kuuntelija", "kuvaus": "Kuuntelet muita ja saat heiltä tärkeää tietoa."},
}

AMMATIT = {
 "kalavesi": {"nimi": "Kalavesienhoitaja", "kuvaus": "Hoitaa jokia ja järviä, jotta kalat voivat hyvin.",
              "tutkinto": "Kalatalouden perustutkinto (kalavesienhoitaja)", "piirteet": ["tutkija", "luonto"]},
 "ymparisto": {"nimi": "Ympäristönhoitaja", "kuvaus": "Tutkii ja hoitaa luontoa ja ympäristöä maastossa.",
               "tutkinto": "Luonto- ja ympäristöalan perustutkinto (ympäristönhoitaja)", "piirteet": ["tutkija", "luonto"]},
 "ohjaaja": {"nimi": "Luonto-ohjaaja", "kuvaus": "Vie ihmisiä turvallisesti retkille luontoon.",
             "tutkinto": "Luonto- ja ympäristöalan perustutkinto (luonto-ohjaaja)", "piirteet": ["viestija", "tiimi"]},
 "poro": {"nimi": "Poronhoitaja", "kuvaus": "Hoitaa poroja ja tuntee Lapin luonnon.",
          "tutkinto": "Luonto- ja ympäristöalan perustutkinto (poronhoitaja)", "piirteet": ["luonto", "tiimi"]},
 "metsa": {"nimi": "Metsäkoneenkuljettaja", "kuvaus": "Tekee metsätöitä isoilla koneilla.",
           "tutkinto": "Metsäalan perustutkinto (metsäkoneenkuljettaja)", "piirteet": ["luonto", "viestija"]},
 "laborantti": {"nimi": "Laborantti", "kuvaus": "Tutkii näytteitä laboratoriossa.",
                "tutkinto": "Laboratorioalan perustutkinto (laborantti)", "piirteet": ["tutkija", "tiimi"]},
}

KUTSU_JOHDANTO = "Tarinassa mysteeri ratkesi. Nyt saat ratkaista sen itse! Olet ympäristönhoitaja, ja sinulla on rahaa vain viiteen vesinäytteeseen."

TEHTAVA = dict(
    tyyppi="kartta",
    nimi="Jäljitä lähde kartalla", tag="Tehtävä · noin 25 min",
    maara="joen kartan, jossa on <strong>8 näytepistettä</strong>",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Ota enintään viisi vesinäytettä. Valitse pisteet fiksusti!",
              "Päättele, mistä ongelma alkaa. Perustele vastauksesi ja valitse, miten joki korjataan."],
    lopuksi="Lopuksi näet, ratkaisitko mysteerin. Lataa vastauksesi ja palauta ne Classroomiin.",
    tulosOtsikko="Tutkimusraporttisi",
    naytteet=5, minNaytteet=3,
    karttaNimi="Kuukkelijoen kartta. Joki virtaa tunturilta alas järveen.",
    karttaOhje="Kuukkelijoki virtaa tunturilta järveen. Jossain kohdassa vesi muuttuu huonoksi. Valitse kartalta piste ja ota näyte. Hyvässä vedessä happea on yli 9 mg/l ja sameus on alle 5.",
    raja="Vinkki: Vertaa näytteitä yläjuoksulta alajuoksulle. Missä kohdassa arvot muuttuvat?",
    tilanneOtsikko="Sinä olet ympäristönhoitaja",
    valitseOhje="Valitse kartalta numeroitu piste. Näet sen kuvauksen ja voit ottaa näytteen.",
    osa1="Osa 1/2 · Näytteet", osa2="Osa 2/2 · Ratkaisu",
    ratkaiseNappi="Ratkaise mysteeri", takaisinNappi="Takaisin näytteisiin", valmisNappi="Katso tutkimusraportti",
    lahdeKysymys="Mistä kohdasta ongelma alkaa?",
    perusteluKysymys="Mihin näytteisiin päätelmäsi perustuu?", perusteluPlaceholder="Päättelin tämän, koska näytteessä…",
    korjausKysymys="Miten joki kannattaa korjata?", korjausPerusteluKysymys="Miksi valitsit tämän korjauksen?",
    mittarit=[{"avain": "happi", "nimi": "Happi", "yksikko": "mg/l", "min": 9},
              {"avain": "sameus", "nimi": "Sameus", "yksikko": "NTU", "max": 5},
              {"avain": "ph", "nimi": "pH", "yksikko": "", "min": 6, "max": 8}],
    joki="M 55 6 C 48 18, 62 26, 56 36 C 50 46, 40 52, 46 62 C 52 72, 64 76, 56 88 C 48 100, 38 104, 48 118",
    sivuvedet=[{"d": "M 22 26 C 32 26, 44 30, 56.5 30", "vari": "#8c7a55", "leveys": 1.4},
               {"d": "M 80 52 C 70 54, 58 60, 45.5 58.5", "vari": "#8b5a2b", "leveys": 1.8}],
    alueet=[{"d": "M 0 0 L 100 0 L 100 14 C 80 18, 66 6, 55 12 C 42 4, 20 18, 0 12 Z", "vari": "#b5865a"},
            {"d": "M 6 18 C 14 14, 26 18, 28 26 C 30 34, 16 38, 8 34 C 2 30, 2 22, 6 18 Z", "vari": "#9aa56b"},
            {"d": "M 66 44 C 76 40, 92 44, 94 52 C 96 62, 80 66, 70 62 C 62 58, 60 48, 66 44 Z", "vari": "#d9c08f"},
            {"d": "M 68 80 C 76 76, 92 78, 94 86 C 96 94, 82 96, 72 94 C 64 92, 62 84, 68 80 Z", "vari": "#c9b9a8"},
            {"d": "M 14 98 C 22 94, 34 98, 34 104 C 34 110, 22 112, 16 110 C 10 108, 8 102, 14 98 Z", "vari": "#a9c78f"},
            {"d": "M 22 120 C 36 112, 62 112, 78 120 C 84 126, 70 132, 48 132 C 28 132, 14 128, 22 120 Z", "vari": "#6fa9dc", "opacity": 1}],
    kohteet=[{"x": 50, "y": 5, "teksti": "▲ Tunturi"}, {"x": 16, "y": 24, "teksti": "Suo"},
             {"x": 82, "y": 50, "teksti": "Hakkuuaukea"}, {"x": 82, "y": 84, "teksti": "Kylä"},
             {"x": 24, "y": 101, "teksti": "Leirintä"}, {"x": 66, "y": 126, "teksti": "Järvi"},
             {"x": 34, "y": 47, "teksti": "Poroaita"}],
    oikea="Hakkuuaukean oja", lahella=["Riippusilta"],
    tulosOikein="Ratkaisit mysteerin!", tulosLahella="Melkein!", tulosVaarin="Mysteeri ratkesi toisin",
    selitysOikein="✓ Oikein! Joki on kirkas ojan yläpuolella, mutta ojan kohdalla sameus nousee yhtäkkiä ja happi vähenee.",
    selitysLahella="Melkein: sillan kohdalla vesi on jo sameaa, mutta ongelma alkaa vähän ylempää, hakkuuaukean ojan kohdalta.",
    selitysVaarin="Ongelma alkaa hakkuuaukean ojan kohdalta. Sitä ylempänä vesi on kirkasta, alempana sameaa. Suon ruskea väri on luonnollista.",
    korjaukset=[
        {"nimi": "Laskeutusallas ojaan ja suojavyöhyke rantaan", "oikein": True,
         "palaute": "Paras ratkaisu: allas pysäyttää mudan, ja rannan puusto sitoo maata. Näin korjataan ongelman syy."},
        {"nimi": "Kalastuskielto joelle", "oikein": False,
         "palaute": "Kielto suojaa kaloja hetken, mutta muta valuu jokeen edelleen."},
        {"nimi": "Kylän puhdistamon sulkeminen", "oikein": False,
         "palaute": "Näytteiden mukaan puhdistamo ei ollut ongelman syy."},
        {"nimi": "Joen pohjan ruoppaus", "oikein": False,
         "palaute": "Ruoppaus poistaa vanhan mudan, mutta uutta tulee niin kauan kuin oja on korjaamatta."},
    ],
    ammattilaisetOtsikko="Näitä töitä tekevät",
    ammattilaiset=[
        {"nimi": "Ympäristönhoitaja", "tehtava": "ottaa vesinäytteet maastossa", "tutkinto": "Luonto- ja ympäristöalan perustutkinto"},
        {"nimi": "Laborantti", "tehtava": "tutkii näytteet laboratoriossa", "tutkinto": "Laboratorioalan perustutkinto"},
        {"nimi": "Metsäkoneenkuljettaja", "tehtava": "kaivaa laskeutusaltaan", "tutkinto": "Metsäalan perustutkinto"},
        {"nimi": "Kalavesienhoitaja", "tehtava": "kunnostaa joen pohjan kaloille sopivaksi", "tutkinto": "Kalatalouden perustutkinto"},
        {"nimi": "Ympäristöasiantuntija", "tehtava": "valvoo, että luontoa ei pilata", "tutkinto": "Esimerkiksi insinööri (AMK) tai biologi (yliopisto)"},
    ],
    korttiYla="TUTKIMUSRAPORTTI · KUUKKELIJOKI",
)

# Näytepisteet yläjuoksulta alajuoksulle (x, y kartan koordinaatteina 0–100 / 0–130)
KUTSU_KORTIT = [
 {"nimi": "Tunturipuro", "x": 54, "y": 11, "kuvaus": "Joen alku tunturin rinteellä.",
  "arvot": {"happi": 11.2, "sameus": 1, "ph": 7.1}, "havainto": "Vesi on kirkasta ja kylmää. Pohjassa näkyy kiviä."},
 {"nimi": "Suon laskuoja", "x": 57, "y": 29, "kuvaus": "Kohta, jossa suolta tuleva oja laskee jokeen.",
  "arvot": {"happi": 10.4, "sameus": 3, "ph": 6.3}, "havainto": "Vesi on vähän ruskeaa, kuin teetä. Väri tulee suon kasveista, ja se on luonnollista."},
 {"nimi": "Poroaita", "x": 48, "y": 47, "kuvaus": "Poroaidan kohdalla porot ylittävät joen.",
  "arvot": {"happi": 10.1, "sameus": 2, "ph": 6.8}, "havainto": "Vesi on kirkasta. Rannalla on porojen jälkiä."},
 {"nimi": "Hakkuuaukean oja", "x": 45, "y": 58.5, "kuvaus": "Kohta, jossa hakkuuaukean uusi oja laskee jokeen.",
  "arvot": {"happi": 7.2, "sameus": 48, "ph": 6.4}, "havainto": "Vesi on mutaista! Ojasta valuu ruskeaa lietettä jokeen."},
 {"nimi": "Riippusilta", "x": 55, "y": 73, "kuvaus": "Retkeilijöiden riippusilta.",
  "arvot": {"happi": 7.6, "sameus": 35, "ph": 6.6}, "havainto": "Vesi on sameaa. Pohjan kivet ovat liejun peitossa."},
 {"nimi": "Kylän puhdistamo", "x": 58, "y": 85, "kuvaus": "Kylän jätevedenpuhdistamon putki laskee jokeen.",
  "arvot": {"happi": 7.9, "sameus": 28, "ph": 6.8}, "havainto": "Vesi on yhä sameaa, mutta ei sen huonompaa kuin ylempänä."},
 {"nimi": "Leirintäalue", "x": 45, "y": 103, "kuvaus": "Leirintäalueen uimaranta.",
  "arvot": {"happi": 8.3, "sameus": 22, "ph": 6.9}, "havainto": "Vesi on vähän sameaa. Ranta on siisti."},
 {"nimi": "Joen suu", "x": 48, "y": 116, "kuvaus": "Kohta, jossa joki laskee järveen.",
  "arvot": {"happi": 8.6, "sameus": 15, "ph": 7.0}, "havainto": "Järvessä liete laskeutuu pohjaan, ja vesi kirkastuu vähitellen."},
]

LOPPU_TEKSTI = "Ratkaisit Kuukkelijoen mysteerin ja jäljitit ongelman lähteen kartalta. Samalla tutustuit kymmeneen luonto- ja ympäristöalan ammattiin."

OPPILAITOKSET = ("Missä luontoalaa voi opiskella?", "Oppilaitokset")
SAILYTA = ["Oppilaitokset"]
SAILYTA_KORVAUKSET = []

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Kuolleet kalat": "Osa todisteista katosi. Tutkimus alkoi heikommista tiedoista.",
    "Näytteenotto": "Näytteenotto piti suunnitella uudelleen. Tulokset valmistuivat myöhemmin.",
    "Laavulla": "Retkeläiset saivat ensin väärän neuvon, ja Mikko joutui korjaamaan sen.",
    "Poroaidalla": "Ellen vihje jäi melkein kuulematta. Ojan löytäminen viivästyi.",
    "Hakkuuaukea": "Syyttely kiristi tunnelmaa. Altaan rakentamisesta sopiminen viivästyi.",
    "Laboratorio": "Tulokset piti järjestää uudelleen, ja ongelman lähde selvisi myöhemmin.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Mysteeri on ratkaistu ennen pimeää! Laskeutusallas rakennetaan, ja joki alkaa puhdistua.",
    "Kello on <<print setup.kello($aika)>>. Mysteeri ratkesi, mutta mutkien kautta. Joki puhdistuu, kunhan oja korjataan.",
    "Kello on <<print setup.kello($aika)>>. Mysteeri ratkesi lopulta, mutta mutkien ja turhien epäilyjen kautta. Mutaa ehti valua jokeen vielä monta päivää.",
]
MYOHASSA = "Työ venyi pimeän puolelle, ja tutkimus jatkuu huomenna."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
