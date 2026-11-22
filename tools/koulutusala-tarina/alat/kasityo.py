# -*- coding: utf-8 -*-
"""Käsityö – "Käsityömessut" (sisältö). Uusi ala, kuuluu kulttuurialaan.
Rakenna: python3 rakenna_tarina.py alat/kasityo.py <orig palvelu-ala.html> <uusi kasityo-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on pajayhteisön uusi kesätyöntekijä. Käsityömessut aukeavat klo 16, ja paja valmistelee
messuosastoa. Tarina kulkee klo 9–16. Ammatit: huonekalujen entisöijä, muotoilija,
tekstiiliartesaani, verhoilija, ompelija ja valokuvaaja. Loppuosan tehtävä on "Työtilauskortti"
(TEHTAVA tyyppi "tilauskortti"): oppilas täyttää kolme asiakkaan tilausta.

Jokaisessa kohtauksessa on paras vaihtoehto, järkevä mutta heikompi vaihtoehto (piirre 1 + tyyli)
ja huono vaihtoehto (ei piirteitä, tyyli + seuraus lopussa)."""

ala = "kasityo"
alaNimi = "Käsityö"
tarinaNimi = "Käsityömessut"
maailma = "paja"
yleisKohtaus = "paja"
katsoTeksti = "Katso pajaa"
kello = {"alku": 9 * 60, "raja": 7 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Kasityoala", "ifid": "74112b7e-0e98-43b3-830a-38d6069cc6db"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Messut aukeavat klo 16.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Pajan värit: lämmin puu, sinapinkeltainen lanka ja syvä petroolinvihreä
TEEMA = """:root {
  --a1: #e9b44c; --a1-rgb: 233,180,76;
  --a2: #6fb7a8; --a2-rgb: 111,183,168;
  --a3: #f6e7c8;
  --korostus: #ffd27a; --korostus-rgb: 255,210,122;
  --tausta: #1d1915; --tausta-rgb: 29,25,21;
  --tausta-2: #29231d; --tausta-2-rgb: 41,35,29;
  --paneeli: #241f1a; --paneeli-rgb: 36,31,26;
  --paneeli-2: #322a22;
  --tumma: #120f0c; --tumma-rgb: 18,15,12;
  --reuna: #e9b44c;
  --teksti-pehmea: #ede3d3; --teksti-pehmea-rgb: 237,227,211;
  --teksti-vaalea: #fffaf2;
  --nappi-teksti: #2a1c06;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a1), var(--a2));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #fff3da;
  --kansi-nappi-varjo: #7a5a1a;
  --kansi-nappi-hehku: 233,180,76;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Kulttuuriala", otsikko="Käsityö",
             alaotsikko="Käsityömessut · Mitä kaikkea tekijät osaavat, ennen kuin messut voivat alkaa?",
             nappi="Astu pajalle", ikoni="sakset")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet kesätöissä pajassa, jossa monta käsityöläistä ja valokuvaaja tekevät töitä saman katon alla. Tänään kello 16 aukeavat käsityömessut. Autat jokaista tekijää vuorollaan. Joka kerta päätät, mikä on paras tapa toimia.",
            faktat=[("6", "ammattilaista"), ("7", "tuntia aikaa"), ("1", "messuosasto")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "kasityo-tyynyt-tausta.webp",
               "alku": KUVA + "kasityo-puu-tausta.webp",
               "tehtava": KUVA + "kasityo-lanka-tausta.webp",
               "kortti": KUVA + "kasityo-kangas-tausta.webp",
               "loppu": [KUVA + "kasityo-tyynyt-tausta.webp", KUVA + "kasityo-keinutuoli-tausta.webp"],
               "oppilaitokset": [KUVA + "kasityo-lanka-tausta.webp", KUVA + "kasityo-puu-tausta.webp"]}

TARINA_ALKU = dict(nimi="Messupäivä", tausta="paja", teksti="""<<include "HUD">>
<h1>Messupäivä</h1>
<p>Kello on 9.00. Astut pajaan. Ilmassa tuoksuu puu ja vaha. Ompelukone surisee jossain nurkassa.</p>
<p>Olet pajan uusi kesätyöntekijä. Tänään kaikki valmistautuvat käsityömessuille, jotka aukeavat kello 16. Kierrät tekijöiden apuna koko päivän.</p>
<p class="puhe"><strong>Raili, huonekalujen entisöijä:</strong> ”Hyvä, että tulit! Tänään riittää tekemistä kaikille.”</p>
<div class="intro-nappi"><<link "Aloita päivä">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Entisöintipiste", tausta="keinutuoli", otsikko="Haljennut jalas", avain="entisoija",
      taustakuva=KUVA + "kasityo-keinutuoli-tausta.webp",
      kysymys="Miltä huonekalujen entisöijän työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän kymmenen jälkeen.",
      johdanto="""<p>Raili kunnostaa sata vuotta vanhaa keinutuolia. Se on messuosaston tärkein esine.</p>
<p>Kun Raili kääntää tuolin, hän huomaa, että toisessa jalaksessa on halkeama. Jalas on tuolin alla oleva kaareva puu, jonka varassa tuoli keinuu.</p>
<p class="puhe"><strong>Raili, huonekalujen entisöijä:</strong> ”Messuilla moni haluaa varmasti kokeilla tätä. Mitä teemme?”</p>""",
      valinnat=[
       dict(teksti="Raili liimaa halkeaman ja vahvistaa sen puutapeilla. Sitten tuolia koekeinutetaan, ennen kuin se viedään messuille.", aika=50, piirteet={"tarkka": 2, "vastuullinen": 1},
            palaute="<p><strong>Ammattilaisen ote!</strong></p><p>Liima tarvitsee aikaa kuivua, joten korjaus kannattaa tehdä heti aamulla. Koekeinutus varmistaa, että tuoli kestää, kun messuvieraat istuvat siihen.</p>"),
       dict(teksti="Tuoli viedään messuille vain katseltavaksi. Viereen laitetaan kyltti: ”Älä istu”.", tyyli="varovainen", aika=20, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Turvallista, mutta tuoli jää rikki.</strong></p><p>Kyltistä huolimatta joku istuu tuoliin. Ja keinutuoli on tehty keinumista varten. Raili korjaa halkeaman heti, kun liima ehtii kuivua ennen messuja.</p>"),
       dict(teksti="Halkeama on pieni. Korjataan se vasta messujen jälkeen, kun on enemmän aikaa.", tyyli="luottavainen", aika=15, piirteet={},
            palaute="<p><strong>Riskialtista.</strong></p><p>Halkeama kasvaa, kun tuolilla keinutaan. Jos jalas murtuu, joku voi kaatua. Raili korjaa halkeaman liimalla ja puutapeilla ennen messuja.</p>"),
      ]),
 dict(nimi="Muotoilustudio", tausta="muotoilu", otsikko="Taipuva prototyyppi", avain="muotoilija",
      taustakuva=KUVA + "kasityo-puu-tausta.webp",
      kysymys="Miltä muotoilijan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on puoli kahdentoista jälkeen.",
      johdanto="""<p>Muotoilija Iida on suunnitellut uuden tuolin, jonka selkänoja aaltoilee. Messuilla esitellään sen prototyyppi eli ensimmäinen kokeiluversio.</p>
<p>Testissä yksi selkänojan säleistä taipuu liikaa, kun tuoliin nojaa.</p>
<p class="puhe"><strong>Iida, muotoilija:</strong> ”Aikaa on vähän. Mitä tehdään?”</p>""",
      valinnat=[
       dict(teksti="Iida tekee kaksi vähän paksumpaa sälettä ja testaa ne. Messuilla kerrotaan, että tuoli on vielä kehitysvaiheessa, ja kävijöiltä kerätään palautetta.", aika=50, piirteet={"luova": 2, "tarkka": 1},
            palaute="<p><strong>Juuri näin muotoilija toimii!</strong></p><p>Prototyyppiä testataan ja parannetaan monta kertaa. Messuilla saatu palaute auttaa tekemään tuolista vielä paremman.</p>"),
       dict(teksti="Tuoli viedään messuille sellaisenaan. Säleet korjataan vasta, kun nähdään, mitä kävijät sanovat.", tyyli="rohkea", aika=25, piirteet={"luova": 1},
            palaute="<p><strong>Palaute on tärkeää, mutta…</strong></p><p>Kävijät istuvat tuoliin. Jos säle taipuu, ensivaikutelma on huono. Iida tekee paksummat säleet ja testaa ne ensin.</p>"),
       dict(teksti="Säleet vaihdetaan metalliputkiin. Ne kestävät varmasti.", tyyli="kaytannollinen", aika=40, piirteet={},
            palaute="<p><strong>Kestää, mutta idea katoaa.</strong></p><p>Aaltoileva puu oli koko suunnitelman ydin. Metalliputket tekevät tuolista raskaan ja erinäköisen. Iida tekee paksummat puusäleet ja testaa ne.</p>"),
      ]),
 dict(nimi="Kangaspuut", tausta="tyynyt", otsikko="Paljonko tyyny maksaa?", avain="tekstiiliartesaani",
      taustakuva=KUVA + "kasityo-tyynyt-tausta.webp",
      kysymys="Miltä tekstiiliartesaanin työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen yhtä.",
      johdanto="""<p>Tekstiiliartesaani Sanna on kutonut kangaspuilla tyynynpäällisiä messuille myytäväksi. Yhden tyynyn kutomiseen ja ompelemiseen menee noin viisi tuntia.</p>
<p>Nyt tyynyihin pitää laittaa hinnat.</p>
<p class="puhe"><strong>Sanna, tekstiiliartesaani:</strong> ”Miten hinta kannattaa päättää?”</p>""",
      valinnat=[
       dict(teksti="Lasketaan yhteen langat, työtunnit ja messupaikan hinta. Hintalappuun kirjoitetaan, että tyyny on kudottu käsin Suomessa.", aika=45, piirteet={"tarkka": 2, "kohtaaja": 1},
            palaute="<p><strong>Hienoa!</strong></p><p>Kun kaikki kulut ja työtunnit lasketaan, yrittäjä saa työstään palkan. Tarina tyynyn takana auttaa ostajaa ymmärtämään, miksi käsityö maksaa enemmän kuin tehdastuote.</p>"),
       dict(teksti="Katsotaan, mitä muut messuilla pyytävät tyynyistä, ja laitetaan sama hinta.", tyyli="kaytannollinen", aika=25, piirteet={"tarkka": 1},
            palaute="<p><strong>Hyvä vertailu, mutta ei riitä.</strong></p><p>Muiden tyynyt voivat olla tehdastuotteita, joiden tekeminen vie minuutteja. Sanna laskee omat kulunsa ja työtuntinsa, jotta hinta on hänelle reilu.</p>"),
       dict(teksti="Laitetaan edullinen hinta, niin kaikki tyynyt myydään heti.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei kannata.</strong></p><p>Jos hinta on liian pieni, Sanna tekee töitä ilman palkkaa. Silloin yritys ei pysy pystyssä. Sanna laskee kulut ja työtunnit.</p>"),
      ]),
 dict(nimi="Verhoomo", tausta="verhoilu", otsikko="Kangas koiraperheelle", avain="verhoilija",
      taustakuva=KUVA + "kasityo-kangas-tausta.webp",
      kysymys="Miltä verhoilijan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on vähän ennen kahta.",
      johdanto="""<p>Verhoilija Mikael päällystää asiakkaan vanhaa nojatuolia uudella kankaalla. Asiakas on valinnut vaalean samettikankaan.</p>
<p>Puhelimessa asiakas mainitsee, että perheessä on iso koira ja kaksi pientä lasta. Vaalea sametti likaantuu ja kuluu helposti.</p>
<p class="puhe"><strong>Mikael, verhoilija:</strong> ”Mitä minun kannattaa tehdä?”</p>""",
      valinnat=[
       dict(teksti="Mikael soittaa asiakkaalle. Hän kertoo kankaiden kestävyydestä ja lähettää kuvat kolmesta kestävämmästä kankaasta. Asiakas päättää itse.", aika=45, piirteet={"kohtaaja": 2, "vastuullinen": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Verhoilija tuntee kankaat. Asiakas tuntee oman kotinsa. Kun asiakas saa tietoa, hän voi tehdä valinnan, johon on tyytyväinen vielä vuosien päästä.</p>"),
       dict(teksti="Mikael verhoilee tuolin asiakkaan valitsemalla kankaalla. Asiakas tietää itse, mitä haluaa.", tyyli="luottavainen", aika=30, piirteet={"kohtaaja": 1},
            palaute="<p><strong>Asiakasta kuunnellaan, mutta tieto jää kertomatta.</strong></p><p>Jos kangas kuluu puolessa vuodessa, asiakas pettyy. Mikael kertoo kankaista ja antaa asiakkaan valita.</p>"),
       dict(teksti="Mikael vaihtaa kankaan kestävämpään. Hän on ammattilainen ja tietää paremmin.", tyyli="suora", aika=30, piirteet={},
            palaute="<p><strong>Hyvä aikomus, väärä tapa.</strong></p><p>Tuoli on asiakkaan, ja asiakas päättää. Muuten hän voi pettyä, kun näkee valmiin tuolin. Mikael kertoo kankaista ja antaa asiakkaan valita.</p>"),
      ]),
 dict(nimi="Ompelimo", tausta="ompelu", otsikko="Reikä villatakissa", avain="ompelija",
      taustakuva=KUVA + "kasityo-rekki-tausta.webp",
      kysymys="Miltä ompelijan työ näytti?", lisaaika=25, siirtymaTeksti="Seuraava tilanne on kolmen jälkeen.",
      johdanto="""<p>Ompelija Aino on tehnyt kierrätysmalliston. Hän on muokannut vanhoista takeista uusia, nykyaikaisia vaatteita. Takit roikkuvat rekissä valmiina messuille.</p>
<p>Yhden villatakin hihassa on pieni reikä. Sen on tehnyt koi eli vaatteita syövä pieni perhonen. Takki on roikkunut muiden takkien vieressä.</p>
<p class="puhe"><strong>Aino, ompelija:</strong> ”Mitä teemme tälle takille?”</p>""",
      valinnat=[
       dict(teksti="Aino tarkistaa kaikki rekin takit. Koinsyömä takki pakastetaan, ja reikä parsitaan villalangalla. Muut takit tuuletetaan.", aika=45, piirteet={"tarkka": 2, "vastuullinen": 1},
            palaute="<p><strong>Ammattilaisen ote!</strong></p><p>Takissa voi olla koin munia. Pakkanen tappaa ne. Kun kaikki takit tarkistetaan, koit eivät leviä muihin vaatteisiin. Parsittu reikä tuskin näkyy.</p>"),
       dict(teksti="Koinsyömä takki poistetaan mallistosta ja heitetään pois.", tyyli="varovainen", aika=20, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Varovaista, mutta hukkaa.</strong></p><p>Takin voi korjata, ja kierrätysmallistossa on tarkoitus säästää materiaaleja. Lisäksi koita voi olla muissakin takeissa. Aino tarkistaa kaikki takit ja pakastaa koinsyömän takin.</p>"),
       dict(teksti="Reikä on pieni. Takki ripustetaan rekin takimmaiseksi, ettei sitä huomaa.", tyyli="nopea", aika=15, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Koit voivat levitä muihin takkeihin, ja ostaja huomaa reiän kotona. Aino tarkistaa kaikki takit ja korjaa reiän.</p>"),
      ]),
 dict(nimi="Kuvausstudio", tausta="studio", otsikko="Naarmu kuvassa", avain="valokuvaaja",
      taustakuva=KUVA + "kasityo-aaltotuoli-tausta.webp",
      kysymys="Miltä valokuvaajan työ näytti?",
      johdanto="""<p>Valokuvaaja Joel kuvaa pajan tuotteita messuesitteeseen ja pajan verkkokauppaan.</p>
<p>Keinutuolin käsinojassa on vanha naarmu. Raili kysyy, voisiko Joel poistaa naarmun kuvasta kuvankäsittelyohjelmalla.</p>
<p class="puhe"><strong>Joel, valokuvaaja:</strong> ”Mitä mieltä sinä olet?”</p>""",
      valinnat=[
       dict(teksti="Joel kuvaa tuolin kauniissa valossa. Kuvasta säädetään vain valoisuutta ja värejä. Naarmu näkyy yhdessä lähikuvassa, ja tekstissä kerrotaan tuolin iästä.", aika=45, piirteet={"vastuullinen": 2, "luova": 1},
            palaute="<p><strong>Rehellistä ja tyylikästä!</strong></p><p>Tuotekuvan pitää näyttää, millainen tuote oikeasti on. Vanhassa huonekalussa käytön jäljet ovat osa tarinaa, ja hyvä valo tekee niistä kauniita.</p>"),
       dict(teksti="Joel etsii kuvakulman, josta naarmu ei näy.", tyyli="kaytannollinen", aika=30, piirteet={"luova": 1},
            palaute="<p><strong>Taitava ratkaisu, mutta…</strong></p><p>Verkkokaupan ostaja ei näe tuolia ennen ostoa. Hänen pitää tietää naarmusta. Joel ottaa myös lähikuvan, jossa naarmu näkyy.</p>"),
       dict(teksti="Joel poistaa naarmun kuvasta. Kuva näyttää siistimmältä.", tyyli="nopea", aika=20, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Kuva antaa ostajalle väärän kuvan tuotteesta. Kun ostaja huomaa naarmun, hän voi palauttaa tuolin. Joel kuvaa tuolin rehellisesti hyvässä valossa.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Messut", teksti="""<h1>Messut aukeavat</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>, kun osasto on valmis. Kello 16 messuhallin ovet aukeavat!</p>
<p>Ensimmäiset kävijät pysähtyvät pajan osastolle. Joku silittää tyynyä, toinen kokeilee keinutuolia. Sinä seisot tiskin takana ja huomaat, kuinka paljon osaamista jokaisessa esineessä on.</p>
<p>Huomasitko? Messuosastoon tarvittiin monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Raili, huonekalujen entisöijä</strong> – korjasi vanhan keinutuolin</li>
<li><strong>Iida, muotoilija</strong> – suunnitteli ja testasi uuden tuolin</li>
<li><strong>Sanna, tekstiiliartesaani</strong> – kutoi tyynyt ja hinnoitteli ne</li>
<li><strong>Mikael, verhoilija</strong> – päällysti nojatuolin</li>
<li><strong>Aino, ompelija</strong> – teki kierrätysmalliston</li>
<li><strong>Joel, valokuvaaja</strong> – kuvasi tuotteet esitteeseen</li>
</ul>
<p>Artesaaniksi ja verhoilijaksi voi opiskella ammattikoulussa taideteollisuusalan perustutkinnossa. Ompelijaksi opiskellaan tekstiili- ja muotialan perustutkinnossa, ja valokuvaajan työhön pääsee alkuun media-alan ja kuvallisen ilmaisun perustutkinnossa. Muotoilijaksi opiskellaan ammattikorkeakoulussa.</p>""")

PIIRTEET = {
 "tarkka": {"nimi": "Tarkka tekijä", "kuvaus": "Huomaat pienetkin viat ja korjaat ne kunnolla."},
 "luova": {"nimi": "Luova", "kuvaus": "Keksit ideoita ja kokeilet rohkeasti uutta."},
 "kohtaaja": {"nimi": "Asiakkaan kuuntelija", "kuvaus": "Selvität, mitä asiakas oikeasti tarvitsee."},
 "vastuullinen": {"nimi": "Rehellinen ja vastuullinen", "kuvaus": "Pidät huolta turvallisuudesta, materiaaleista ja luottamuksesta."},
}

AMMATIT = {
 "entisoija": {"nimi": "Huonekalujen entisöijä", "kuvaus": "Korjaa vanhoja huonekaluja niin, että niiden vanha ilme säilyy.",
               "tutkinto": "Taideteollisuusalan perustutkinto (artesaani) tai puuteollisuuden perustutkinto (puuseppä)", "piirteet": ["tarkka", "vastuullinen"]},
 "muotoilija": {"nimi": "Muotoilija", "kuvaus": "Suunnittelee uusia esineitä, huonekaluja ja tuotteita.",
                "tutkinto": "Muotoilija (AMK)", "piirteet": ["luova", "tarkka"]},
 "tekstiiliartesaani": {"nimi": "Tekstiiliartesaani", "kuvaus": "Kutoo, neuloo ja valmistaa tekstiilejä käsin, usein omassa yrityksessä.",
                        "tutkinto": "Taideteollisuusalan perustutkinto (artesaani)", "piirteet": ["luova", "kohtaaja"]},
 "verhoilija": {"nimi": "Verhoilija", "kuvaus": "Pehmustaa ja päällystää huonekaluja uudella kankaalla.",
                "tutkinto": "Taideteollisuusalan perustutkinto (artesaani, verhoilu)", "piirteet": ["kohtaaja", "tarkka"]},
 "ompelija": {"nimi": "Ompelija", "kuvaus": "Ompelee, korjaa ja muokkaa vaatteita ja muita tekstiilejä.",
              "tutkinto": "Tekstiili- ja muotialan perustutkinto (ompelija tai mittatilausompelija)", "piirteet": ["tarkka", "vastuullinen"]},
 "valokuvaaja": {"nimi": "Valokuvaaja", "kuvaus": "Kuvaa tuotteita, ihmisiä ja tapahtumia ja käsittelee kuvat.",
                 "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto, myöhemmin valokuvaaja (AT)", "piirteet": ["luova", "vastuullinen"]},
}

KUTSU_JOHDANTO = "Messut onnistuivat, ja pajalle tuli monta uutta tilausta! Nyt sinä pääset täyttämään kolmen asiakkaan työtilauskortit."

def V(teksti, hinta, tunnit, tagit=()):
    return {"teksti": teksti, "hinta": hinta, "tunnit": tunnit, "tagit": list(tagit)}

TEHTAVA = dict(
    tyyppi="tilauskortti",
    nimi="Työtilauskortti", tag="Tehtävä · noin 20 min",
    maara="<strong>kolme asiakkaan tilausta</strong>",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Täytä jokaiselle asiakkaalle työtilauskortti. Valitse materiaalit ja työvaiheet.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Hinta- ja aikamittari näyttävät heti, pysyykö työ asiakkaan budjetissa ja ajassa. Tarkistus kertoo, toteutuvatko asiakkaan toiveet. Voit muokata tilausta ja tarkistaa sen uudelleen. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Työtilauksesi",
    osa1="Osa 1/2 · Tilaus", osa2="Osa 2/2 · Perustelut",
    korttiLeima="TYÖTILAUS", toiveOtsikko="Asiakas kertoo", tekijaTeksti="Tekijä",
    hintaNimi="Hinta", aikaMittari="Työaika", yliTeksti="Yli!",
    vaatimuksetOtsikko="Tarkistuslista",
    budjettiNimi="Hinta pysyy asiakkaan budjetissa", aikaNimi="Työ valmistuu ajoissa",
    budjettiSelitys="Asiakas on kertonut, paljonko hän voi maksaa. Jos hinta nousee, siitä pitää sopia asiakkaan kanssa etukäteen.",
    aikaSelitys="Työhön on varattu tietty määrä tunteja. Jos työ venyy, seuraavat tilaukset myöhästyvät.",
    tarkistaNappi="Tarkista tilaus", muokkaaNappi="Muokkaa tilausta", seuraavaNappi="Seuraava tilaus", jatkaNappi="Jatka perusteluihin",
    takaisinNappi="Takaisin tilauksiin", valmisNappi="Katso tulos",
    perusteluOtsikko="Tilaukset on täytetty!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="TYÖTILAUKSET · PAJA KÄSI & KUVA",
    palaute=["Huipputyötä! Asiakkaat saavat juuri sen, mitä toivoivat, ja työ pysyy budjetissa.",
             "Hyvä työ! Pari kohtaa vielä, niin asiakkaat olisivat täysin tyytyväisiä.",
             "Hyvä alku! Lue tarkistuslistan selitykset ja kokeile muuttaa valintoja."],
    tilaukset=[
        dict(nimi="Isoäidin keinutuoli", ikoni="🪑", asiakas="Helmi, 72 vuotta", tekija="huonekalujen entisöijä", budjetti=200, tunnit=8,
             toive="”Tämä keinutuoli oli äitini. Haluan, että lapsenlapset voivat taas keinua siinä turvallisesti. Toivon, että tuoli näyttää yhä vanhalta eikä uudelta.”",
             osat=[
                dict(otsikko="Löysät liitokset", tyyppi="yksi", vaihtoehdot=[
                    V("Puran liitokset ja liimaan ne uudelleen perinteisellä liimalla", 40, 3, ["liitokset"]),
                    V("Kiinnitän liitokset metallikulmilla ja ruuveilla", 25, 1, ["liitokset", "metalli"]),
                    V("Teen tuolille kokonaan uuden rungon", 180, 7, ["liitokset", "uusi"])]),
                dict(otsikko="Haljennut jalas", tyyppi="yksi", vaihtoehdot=[
                    V("Liimaan halkeaman ja vahvistan sen puutapeilla", 30, 2, ["jalas"]),
                    V("Teen uuden jalaksen samasta puulajista ja sävytän sen", 70, 3, ["jalas"]),
                    V("Teippaan halkeaman jalaksen alapuolelta", 5, 0.5, [])]),
                dict(otsikko="Pinta", tyyppi="yksi", vaihtoehdot=[
                    V("Puhdistan vanhan pinnan ja vahaan sen", 35, 1.5, ["patina"]),
                    V("Hion vanhan pinnan pois ja lakkaan tuolin", 60, 3, ["uusi"]),
                    V("Maalaan tuolin valkoiseksi", 50, 2.5, ["uusi"])]),
                dict(otsikko="Lisäksi teen", tyyppi="monta", vaihtoehdot=[
                    V("Koekeinutan tuolin ja tarkistan kaikki liitokset", 0, 0.5, ["testi"]),
                    V("Ompelen istuimelle irrotettavan tyynyn", 45, 2, []),
                    V("Kirjoitan asiakkaalle hoito-ohjeen", 0, 0.5, ["ohje"])]),
             ],
             vaatimukset=[
                dict(nimi="Tuoli kestää keinumisen", kaikki=["liitokset", "jalas", "testi"],
                     selitys="Tuoli on turvallinen vasta, kun liitokset ja haljennut jalas on korjattu ja tuoli on koekeinutettu. Teippi ei pidä halkeamaa koossa."),
                dict(nimi="Tuoli näyttää yhä vanhalta", kaikki=["patina"], ei=["uusi", "metalli"],
                     selitys="Kun vanha pinta puhdistetaan ja vahataan, patina eli vanhan pinnan kaunis kuluma säilyy. Uusi lakka, maali, runko tai näkyvät metallikulmat tekevät tuolista uuden näköisen."),
                dict(nimi="Asiakas osaa hoitaa tuolia", kaikki=["ohje"],
                     selitys="Hoito-ohje kertoo esimerkiksi, miten vahattua pintaa puhdistetaan. Silloin tuoli kestää taas pitkään."),
             ]),
        dict(nimi="Kirjaston lukutuoli", ikoni="📚", asiakas="Kaupunginkirjasto, lasten osasto", tekija="verhoilija", budjetti=340, tunnit=10,
             toive="”Nojatuoli tulee lasten lukunurkkaan. Siinä istuu kymmeniä lapsia joka päivä. Tuolin pitää kestää kovaa käyttöä ja olla helppo pitää puhtaana. Kirjaston väri on sininen.”",
             osat=[
                dict(otsikko="Kangas", tyyppi="yksi", vaihtoehdot=[
                    V("Vaalea samettikangas, kestää 20 000 hankausta", 120, 0, []),
                    V("Sininen huonekalukangas, kestää 60 000 hankausta", 140, 0, ["kestava", "sininen"]),
                    V("Sininen pellavakangas, kestää 15 000 hankausta", 110, 0, ["sininen"])]),
                dict(otsikko="Pehmuste", tyyppi="yksi", vaihtoehdot=[
                    V("Uusi vaahtomuovi, joka on testattu paloturvalliseksi", 80, 2, ["palo"]),
                    V("Vanha täyte puhdistetaan ja käytetään uudelleen", 20, 3, []),
                    V("Halvin vaahtomuovi", 40, 2, [])]),
                dict(otsikko="Pohjatyö", tyyppi="yksi", vaihtoehdot=[
                    V("Vaihdan pohjan kuluneet vyöt uusiin ennen pehmustusta", 60, 5, ["pohja"]),
                    V("Kiristän vanhat vyöt", 15, 2, []),
                    V("Niittaan uuden kankaan suoraan vanhan päälle", 10, 1.5, [])]),
                dict(otsikko="Lisäksi teen", tyyppi="monta", vaihtoehdot=[
                    V("Suojakäsittely kankaalle tahroja vastaan", 30, 0.5, ["suoja"]),
                    V("Kirjaston logo kirjaillaan selkänojaan", 60, 2, []),
                    V("Ylimääräinen kangaspala myöhempiä korjauksia varten", 25, 0, [])]),
             ],
             vaatimukset=[
                dict(nimi="Tuoli kestää kovaa käyttöä", kaikki=["kestava", "pohja"],
                     selitys="Julkisessa tilassa kankaan pitää kestää paljon hankausta. Myös pohjan pitää olla kunnossa, muuten uusi kangas kuluu ja painuu nopeasti."),
                dict(nimi="Tuoli on helppo pitää puhtaana", kaikki=["suoja"],
                     selitys="Lasten käytössä tahroja tulee varmasti. Suojakäsitelty kangas on helppo pyyhkiä puhtaaksi."),
                dict(nimi="Tuoli on kirjaston värinen", kaikki=["sininen"],
                     selitys="Asiakas toivoi sinistä väriä. Vaalea sametti ei sovi toiveeseen."),
                dict(nimi="Tuoli sopii julkiseen tilaan", kaikki=["palo"],
                     selitys="Julkisissa tiloissa, kuten kirjastoissa, huonekalujen pitää olla paloturvallisia. Siksi pehmusteen täytyy olla testattu."),
             ]),
        dict(nimi="Isoisän villatakki", ikoni="🧥", asiakas="Noa, 16 vuotta", tekija="ompelija", budjetti=120, tunnit=7.5,
             toive="”Löysin isoisän vanhan villatakin. Se on minulle liian iso, ja vuori on repeillyt monesta kohtaa. Hihassa on pieni reikä. Haluan käyttää takkia talvella koulussa. Olen säästänyt 120 euroa.”",
             osat=[
                dict(otsikko="Koko", tyyppi="yksi", vaihtoehdot=[
                    V("Otan Noalta mitat ja kavennan takkia sivu- ja hihasaumoista", 40, 3, ["koko"]),
                    V("Lyhennän vain hihat", 20, 1, []),
                    V("Teen takista kokonaan uuden mallin", 150, 8, ["koko"])]),
                dict(otsikko="Vuori", tyyppi="yksi", vaihtoehdot=[
                    V("Vaihdan koko vuoren uuteen", 45, 2.5, ["vuori"]),
                    V("Paikkaan vuoren reiät", 15, 1, []),
                    V("Poistan vuoren kokonaan", 0, 0.5, [])]),
                dict(otsikko="Reikä hihassa", tyyppi="yksi", vaihtoehdot=[
                    V("Parsin reiän villalangalla niin, ettei se juuri näy", 10, 1, ["reika"]),
                    V("Ompelen reiän päälle näyttävän kangasmerkin", 8, 0.5, ["reika"]),
                    V("Jätän reiän, se kuuluu vanhaan takkiin", 0, 0, [])]),
                dict(otsikko="Lisäksi teen", tyyppi="monta", vaihtoehdot=[
                    V("Pakastan takin ensin, jotta mahdolliset koin munat kuolevat", 0, 0.5, ["koit"]),
                    V("Vaihdan napit uusiin puunappeihin", 20, 0.5, []),
                    V("Höyrytän ja tuuletan takin", 10, 0.5, [])]),
             ],
             vaatimukset=[
                dict(nimi="Takki sopii Noalle", kaikki=["koko"],
                     selitys="Liian iso takki pitää kaventaa Noan mittojen mukaan. Pelkkä hihojen lyhentäminen ei riitä."),
                dict(nimi="Takki on lämmin talvella", kaikki=["vuori"],
                     selitys="Vuori tekee takista lämpimän, ja takki on helppo pukea. Haurastunut vuori repeää uudestaan, vaikka sitä paikkaisi."),
                dict(nimi="Reikä on korjattu", kaikki=["reika"],
                     selitys="Korjaamaton reikä kasvaa käytössä. Reiän voi parsia huomaamattomasti tai peittää näyttävällä merkillä."),
                dict(nimi="Koit eivät leviä", kaikki=["koit"],
                     selitys="Koinsyömä reikä tarkoittaa, että takissa voi olla koin munia. Pakastus tappaa ne, joten ne eivät leviä Noan muihin vaatteisiin."),
             ]),
    ],
    kysymykset=[
        {"kysymys": "Miksi käsityöläisen kannattaa kertoa asiakkaalle eri materiaalien hyvistä ja huonoista puolista?", "ammattilainen": "Verhoilija",
         "tutkinto": "Taideteollisuusalan perustutkinto (artesaani, verhoilu)", "placeholder": "Asiakkaalle kannattaa kertoa, koska…"},
        {"kysymys": "Miksi tuotekuvan pitää näyttää, millainen tuote oikeasti on?", "ammattilainen": "Valokuvaaja",
         "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto", "placeholder": "Kuvan pitää olla rehellinen, koska…"},
    ],
    ammattilaisetOtsikko="Käsityön ja kuvan ammatteja",
    ammattilaiset=[
        {"nimi": "Artesaani", "tehtava": "valmistaa käsityötuotteita puusta, tekstiileistä tai muista materiaaleista", "tutkinto": "Taideteollisuusalan perustutkinto (artesaani)"},
        {"nimi": "Verhoilija", "tehtava": "pehmustaa ja päällystää huonekaluja", "tutkinto": "Taideteollisuusalan perustutkinto (artesaani, verhoilu)"},
        {"nimi": "Ompelija", "tehtava": "ompelee ja korjaa vaatteita", "tutkinto": "Tekstiili- ja muotialan perustutkinto"},
        {"nimi": "Puuseppä", "tehtava": "valmistaa ja korjaa puisia huonekaluja", "tutkinto": "Puuteollisuuden perustutkinto"},
        {"nimi": "Valokuvaaja", "tehtava": "kuvaa tuotteita, ihmisiä ja tapahtumia", "tutkinto": "Media-alan ja kuvallisen ilmaisun perustutkinto, valokuvaaja (AT)"},
        {"nimi": "Muotoilija", "tehtava": "suunnittelee uusia tuotteita ja huonekaluja", "tutkinto": "Muotoilija (AMK)"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Autoit pajaa valmistautumaan käsityömessuille ja täytit asiakkaiden työtilauksia. Samalla tutustuit käsityön ja valokuvauksen ammatteihin."

OPPILAITOKSET = ("Missä käsityötä ja valokuvausta voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Käsityön ja kuvan koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Samoja tutkintoja voi opiskella monessa muussakin oppilaitoksessa eri puolilla Suomea. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Koulutuskeskus Salpaus, Lahti", "Taideteollisuusalan perustutkinto (artesaani, myös verhoilu), tekstiili- ja muotialan perustutkinto sekä media-alan ja kuvallisen ilmaisun perustutkinto.", "https://salpaus.fi")
    + kortti("Savon ammattiopisto, Kuopio", "Media-alan ja kuvallisen ilmaisun perustutkinto ja muita kulttuurialan tutkintoja.", "https://sakky.fi")
    + kortti("Etsi artesaanin koulutus", "Hae Opintopolusta sanalla ”taideteollisuusalan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=taideteollisuusalan%20perustutkinto")
    + kortti("Etsi ompelijan koulutus", "Hae Opintopolusta sanalla ”tekstiili- ja muotialan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=tekstiili-%20ja%20muotialan%20perustutkinto")
    + kortti("Etsi kuvaajan koulutus", "Hae Opintopolusta sanalla ”media-alan ja kuvallisen ilmaisun perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=media-alan%20ja%20kuvallisen%20ilmaisun%20perustutkinto")
    + """<h3>Myöhemmin</h3>
""" + kortti("Työn ohessa: ammattitutkinnot", "Kokemuksen kertyessä voi suorittaa esimerkiksi valokuvaajan (AT), verhoilijan tai restauroijan ammattitutkinnon.", "https://opintopolku.fi/konfo/fi/haku?keyword=taideteollisuusalan%20ammattitutkinto")
    + kortti("Ammattikorkeakoulut", "Muotoilija (AMK), artenomi (AMK) ja medianomi (AMK). Esimerkiksi LAB-ammattikorkeakoulu ja Metropolia.", "https://opintopolku.fi/konfo/fi/haku?keyword=muotoilija%20amk")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
SEURAUKSET = {
    "Entisöintipiste": "Keinutuolin halkeama korjattiin viime hetkellä, eikä liima ehtinyt kuivua kunnolla ennen messuja.",
    "Muotoilustudio": "Aaltotuolin säleet jouduttiin tekemään uudelleen kiireessä, ja muotoilija sai korjata ne vielä messuaamuna.",
    "Kangaspuut": "Tyynyjen hinnat laskettiin uudelleen kesken päivän, ja osa hintalapuista jouduttiin vaihtamaan.",
    "Verhoomo": "Nojatuolin kangas jouduttiin miettimään uudelleen, ja asiakas sai tuolinsa viikon myöhässä.",
    "Ompelimo": "Kaikki rekin takit piti tarkistaa vielä messuaamuna, ettei koita levinnyt.",
    "Kuvausstudio": "Esitteen keinutuolikuva vaihdettiin viime hetkellä, ja esite meni painoon myöhässä.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>, kun pajan osasto on valmis. Kello 16 messuhallin ovet aukeavat. Kaikki onnistui juuri niin kuin piti!",
    "Kello on <<print setup.kello($aika)>>, kun osasto on valmis. Kello 16 messut alkavat, ja osastolla käy paljon väkeä. Pari asiaa olisi voinut mennä paremmin, mutta päivä onnistui.",
    "Kello on <<print setup.kello($aika)>>, kun osasto vihdoin saatiin pystyyn. Päivä oli täynnä korjattavaa, ja muutama kävijä huomasi keskeneräiset asiat.",
]
MYOHASSA = "Osasto ei ollut valmis ovien auetessa, ja ensimmäiset kävijät kulkivat ohi."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
