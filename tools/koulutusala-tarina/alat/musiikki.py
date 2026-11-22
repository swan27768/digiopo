# -*- coding: utf-8 -*-
"""Musiikki – "Konserttitalon kulisseissa" (sisältö). Uusi ala, kuuluu kulttuurialaan.
Rakenna: python3 rakenna_tarina.py alat/musiikki.py <orig palvelu-ala.html> <uusi musiikki-ala.html>

Alalla ei ole omaa alkuperäistä Twine-tiedostoa, joten pohjana on palvelualan tiedosto
(TARINA_TUNNISTE antaa oman nimen ja IFID:n, oppilaitossivu LISAPASSAGET-listalla).

Pelaaja on poplaulaja Aavan kiertuemanageri. Aava esiintyy illalla sinfoniaorkesterin kanssa.
Tarina kulkee klo 10–19. Ammatit: musiikkiteknologi, pianonvirittäjä, kapellimestari,
orkesterimuusikko, muusikko ja valosuunnittelija. Loppuosan tehtävä on "Keikan setlista"
(TEHTAVA tyyppi "setlista"): oppilas kokoaa 40–45 minuutin konsertin setlistan.

Jokaisessa kohtauksessa on paras vaihtoehto, järkevä mutta heikompi vaihtoehto (piirre 1 + tyyli)
ja huono vaihtoehto (ei piirteitä, tyyli + seuraus lopussa)."""

ala = "musiikki"
alaNimi = "Musiikki"
tarinaNimi = "Konserttitalon kulisseissa"
maailma = "konserttitalo"
yleisKohtaus = "sali"
katsoTeksti = "Katso konserttisalia"
kello = {"alku": 10 * 60, "raja": 9 * 60}
siirtyma = 0
siirtymaTeksti = ""
kutsuTilanneOtsikko = "Tehtävä"

TARINA_TUNNISTE = {"nimi": "Musiikkiala", "ifid": "75093ae8-4be1-4e8c-9f67-d909a10a0bb6"}

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Konsertti alkaa klo 19.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

# Konserttisalin värit: syvä violetti, lavavalon kulta ja magenta
TEEMA = """:root {
  --a1: #c58bff; --a1-rgb: 197,139,255;
  --a2: #ffcf5a; --a2-rgb: 255,207,90;
  --a3: #ead8ff;
  --korostus: #ffcf5a; --korostus-rgb: 255,207,90;
  --tausta: #150f22; --tausta-rgb: 21,15,34;
  --tausta-2: #201833; --tausta-2-rgb: 32,24,51;
  --paneeli: #1b1429; --paneeli-rgb: 27,20,41;
  --paneeli-2: #271d3b;
  --tumma: #0d0916; --tumma-rgb: 13,9,22;
  --reuna: #c58bff;
  --teksti-pehmea: #e6def2; --teksti-pehmea-rgb: 230,222,242;
  --teksti-vaalea: #faf7ff;
  --nappi-teksti: #1d0a33;
  --kansi-nappi-bg: linear-gradient(135deg, var(--a2), var(--a1));
  --kansi-nappi-teksti: var(--nappi-teksti);
  --kansi-nappi-reuna: #f3e6ff;
  --kansi-nappi-varjo: #5a2a8a;
  --kansi-nappi-hehku: 197,139,255;
}
html body #passages .passage .cover-link.cover-3d {
  background: linear-gradient(to top, rgba(var(--tausta-rgb),.95) 0%, rgba(var(--tausta-rgb),.8) 40%, rgba(var(--tausta-rgb),.35) 64%, rgba(var(--tausta-rgb),0) 84%) !important;
}
html body #passages .passage .cover-pieni, html body #passages .passage .cover-subtitle { text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 12px rgba(0,0,0,.7); }
html body #passages .passage .cover-title { text-shadow: 0 2px 14px rgba(0,0,0,.6); }"""

KANSI = dict(pieni="Kulttuuriala", otsikko="Musiikki",
             alaotsikko="Konserttitalon kulisseissa · Ketä kaikkia tarvitaan, ennen kuin konsertti voi alkaa?",
             nappi="Astu kulisseihin", ikoni="play")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet poplaulaja Aavan kiertuemanageri. Tänä iltana Aava esiintyy konserttitalossa yhdessä sinfoniaorkesterin kanssa. Ennen konserttia kulisseissa tapahtuu paljon. Joka kerta päätät, mikä on paras tapa toimia.",
            faktat=[("6", "ammattilaista"), ("60", "muusikkoa"), ("1", "konsertti")])

KUVA = "../../images/koulutusalat/"
TAUSTAKUVAT = {"kansi": KUVA + "musiikki-sali-tausta.webp",
               "alku": KUVA + "musiikki-yleiso-tausta.webp",
               "tehtava": KUVA + "musiikki-basso-tausta.webp",
               "kortti": KUVA + "musiikki-yleiso-tausta.webp",
               "loppu": [KUVA + "musiikki-sali-tausta.webp", KUVA + "musiikki-yleiso-tausta.webp"],
               "oppilaitokset": [KUVA + "musiikki-nuotit-tausta.webp", KUVA + "musiikki-studio-tausta.webp"]}

TARINA_ALKU = dict(nimi="Konserttipäivä", tausta="sali", teksti="""<<include "HUD">>
<h1>Konserttipäivä</h1>
<p>Kello on 10.00. Saavut konserttitaloon. Lavalla on jo kymmeniä tuoleja ja nuottitelineitä orkesteria varten.</p>
<p>Olet kiertuemanageri. Huolehdit siitä, että Aavan konsertti alkaa ajoissa ja kaikki sujuu. Tänään yhteistyötä tehdään orkesterin, tekniikan ja bändin kanssa.</p>
<p class="puhe"><strong>Aava, laulaja:</strong> ”Tämä on uran isoin keikka. Jännittää jo nyt!”</p>
<div class="intro-nappi"><<link "Aloita päivä">><<set $aika += 5>><<goto "{{ENSIMMAINEN}}">><</link>></div>""")

KOHTAUKSET = [
 dict(nimi="Äänitysstudio", tausta="studio", otsikko="Rätisevä mikrofoni", avain="musiikkiteknologi",
      taustakuva=KUVA + "musiikki-studio-tausta.webp",
      kysymys="Miltä musiikkiteknologin työ näytti?", lisaaika=45, siirtymaTeksti="Seuraava tilanne on vähän ennen kahtatoista.",
      johdanto="""<p>Konsertti äänitetään ja lähetetään netissä suorana. Musiikkiteknologi Jonna testaa mikrofoneja studiossa.</p>
<p>Aavan langattomasta mikrofonista kuuluu välillä rätinää. Se kuuluu myös tallenteelle.</p>
<p class="puhe"><strong>Jonna, musiikkiteknologi:</strong> ”Mitä teemme?”</p>""",
      valinnat=[
       dict(teksti="Jonna etsii häiriön syyn. Mikrofonin taajuus vaihdetaan, ja koko lava testataan ennen kuin yleisö tulee.", aika=50, piirteet={"tarkka": 2, "tiimi": 1},
            palaute="<p><strong>Ammattilaisen ote!</strong></p><p>Toinen laite salissa käytti samaa taajuutta. Kun taajuus vaihdetaan, ääni on puhdas sekä salissa että tallenteella.</p>"),
       dict(teksti="Laitetaan lavalle varalle johdollinen mikrofoni ja jatketaan muita töitä.", tyyli="varovainen", aika=30, piirteet={"tarkka": 1},
            palaute="<p><strong>Hyvä varasuunnitelma, mutta vika jää.</strong></p><p>Jos rätinä alkaa kesken kappaleen, mikrofonin vaihtaminen katkaisee laulun ja tallenteen. Jonna etsii syyn: toinen laite käytti samaa taajuutta.</p>"),
       dict(teksti="Rätinä kuului vain hetken. Illalla se varmasti toimii.", tyyli="luottavainen", aika=20, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Häiriö ei katoa itsestään, ja illalla salissa on vielä enemmän laitteita. Jonna etsii syyn ja vaihtaa mikrofonin taajuuden.</p>"),
      ]),
 dict(nimi="Flyygeli", tausta="flyygeli", otsikko="Flyygeli siirtoon", avain="pianonvirittaja",
      kysymys="Miltä pianonvirittäjän työ näytti?", lisaaika=45, siirtymaTeksti="Seuraava tilanne on yhden jälkeen.",
      johdanto="""<p>Pianonvirittäjä Matti viritti flyygelin aamulla. Nyt valosuunnittelija haluaa siirtää flyygelin lavan reunalle, kuumien valojen alle.</p>
<p>Lämpö ja siirtäminen voivat muuttaa flyygelin vireen.</p>
<p class="puhe"><strong>Matti, pianonvirittäjä:</strong> ”Milloin flyygeli siirretään?”</p>""",
      valinnat=[
       dict(teksti="Siirretään flyygeli heti ja sytytetään valot. Matti virittää sen uudelleen, kun soitin on lämmennyt uudessa paikassa.", aika=50, piirteet={"tarkka": 2, "tiimi": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Flyygelin kielet reagoivat lämpöön. Kun soitin saa lämmetä paikallaan ennen viritystä, vire pysyy koko konsertin ajan.</p>"),
       dict(teksti="Jätetään flyygeli paikalleen. Valot suunnataan sen sijaan uudelleen.", tyyli="varovainen", aika=30, piirteet={"tiimi": 1},
            palaute="<p><strong>Toimii, mutta idea jää toteutumatta.</strong></p><p>Flyygelin saa siirtää, kunhan virittäjä ehtii virittää sen uudessa paikassa. Valosuunnittelijan näyttävä idea olisi onnistunut.</p>"),
       dict(teksti="Siirretään flyygeli vasta juuri ennen konserttia. Se viritettiin jo aamulla.", tyyli="nopea", aika=20, piirteet={},
            palaute="<p><strong>Riskialtista.</strong></p><p>Siirto ja kuumat valot muuttavat vireen. Orkesterin rinnalla epävireinen flyygeli kuuluisi heti. Matti virittää sen uudessa paikassa ajoissa.</p>"),
      ]),
 dict(nimi="Kapellimestari", tausta="kapu", otsikko="Muutos kesken harjoituksen", avain="kapellimestari",
      kysymys="Miltä kapellimestarin työ näytti?", lisaaika=40, siirtymaTeksti="Seuraava tilanne on kolmen jälkeen.",
      johdanto="""<p>Harjoitus on käynnissä. Aava keksii yhtäkkiä, että yhtä kappaletta pitäisi hidastaa ja siihen pitäisi lisätä uusi välisoitto.</p>
<p>Orkesterilla on painetut nuotit, joista 60 muusikkoa soittaa.</p>
<p class="puhe"><strong>Eeva, kapellimestari:</strong> ”Miten toimitaan?”</p>""",
      valinnat=[
       dict(teksti="Aava ja Eeva sopivat muutoksen tauolla. Muutos merkitään kaikkien nuotteihin, ja kohta harjoitellaan kerran.", aika=50, piirteet={"tiimi": 2, "tarkka": 1},
            palaute="<p><strong>Hienoa yhteistyötä!</strong></p><p>Kapellimestari johtaa orkesteria. Kun muutos on nuoteissa ja harjoiteltu, kaikki 60 muusikkoa soittavat sen yhdessä.</p>"),
       dict(teksti="Aava näyttää illalla lavalla käsimerkillä, milloin hidastetaan.", tyyli="rohkea", aika=30, piirteet={"luova": 1},
            palaute="<p><strong>Rohkea idea, mutta riskialtis.</strong></p><p>Orkesteri seuraa kapellimestaria, ei laulajaa. Harjoittelematon merkki voi sekoittaa koko kappaleen. Eeva ja Aava sopivat muutoksen ja harjoittelevat sen.</p>"),
       dict(teksti="Muutos sovitaan vain bändin kanssa. Orkesteri kyllä kuulee sen.", tyyli="nopea", aika=20, piirteet={},
            palaute="<p><strong>Ei toimi.</strong></p><p>Orkesteri soittaa nuoteista ja seuraa kapellimestaria. Jos vain bändi tietää muutoksesta, soitto menee sekaisin. Eeva ja Aava sopivat muutoksen yhdessä.</p>"),
      ]),
 dict(nimi="Orkesteri", tausta="orkesteri", otsikko="Kipeä ranne", avain="orkesterimuusikko",
      taustakuva=KUVA + "musiikki-nuotit-tausta.webp",
      kysymys="Miltä orkesterimuusikon työ näytti?", lisaaika=40, siirtymaTeksti="Seuraava tilanne on neljän jälkeen.",
      johdanto="""<p>Klarinetisti Leolla on illalla tärkeä soolo. Harjoituksen jälkeen hän hieroo rannettaan. Se on kipeä.</p>
<p>Leo aikoo silti harjoitella soolon vielä monta kertaa tauon aikana.</p>
<p class="puhe"><strong>Leo, orkesterimuusikko:</strong> ”Mitä sinä tekisit?”</p>""",
      valinnat=[
       dict(teksti="Leo lepuuttaa rannetta, käy soolon läpi kerran rauhallisesti ja kertoo kivusta kapellimestarille.", aika=40, piirteet={"vastuullinen": 2, "tiimi": 1},
            palaute="<p><strong>Viisas valinta!</strong></p><p>Muusikon keho on hänen työvälineensä. Kun ranne saa levätä, soolo onnistuu illalla. Kapellimestari tietää tilanteesta ja voi tukea Leoa.</p>"),
       dict(teksti="Leo harjoittelee puoli tuntia, mutta pitää välillä taukoja.", tyyli="kaytannollinen", aika=40, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Tauot auttavat, mutta eivät riitä.</strong></p><p>Kipeää rannetta ei kannata rasittaa juuri ennen konserttia. Leo käy soolon läpi vain kerran ja kertoo kivusta kapellimestarille.</p>"),
       dict(teksti="Leo harjoittelee koko tauon. Soolon pitää mennä täydellisesti.", tyyli="rohkea", aika=40, piirteet={},
            palaute="<p><strong>Ei hyvä.</strong></p><p>Liika harjoittelu kipeällä ranteella voi pahentaa rasitusvammaa, ja se voi kestää kuukausia. Leo lepuuttaa rannetta ja kertoo kivusta kapellimestarille.</p>"),
      ]),
 dict(nimi="Bändin nurkka", tausta="basso", otsikko="Korvatulpat lavalla", avain="muusikko",
      taustakuva=KUVA + "musiikki-basso-tausta.webp",
      kysymys="Miltä muusikon työ näytti?", lisaaika=35, siirtymaTeksti="Seuraava tilanne on puoli kuudelta.",
      johdanto="""<p>Aavan bändin basisti Sami virittää bassoaan. Lavalla on tosi kovaa, kun rummut ja orkesteri soittavat yhtä aikaa.</p>
<p>Sami ei halua käyttää korvatulppia. ”Ne pilaavat soundin”, hän sanoo.</p>
<p class="puhe"><strong>Sami, muusikko:</strong> ”Ei kai niitä tarvita?”</p>""",
      valinnat=[
       dict(teksti="Sami kokeilee muusikon korvatulppia ja korvamonitoreja. Jonna säätää niihin hyvän miksauksen.", aika=45, piirteet={"vastuullinen": 2, "tiimi": 1},
            palaute="<p><strong>Juuri näin!</strong></p><p>Muusikon korvatulpat vaimentavat ääntä tasaisesti, joten soundi säilyy. Kuulo on muusikon tärkein työväline koko uran ajan.</p>"),
       dict(teksti="Sami laittaa tulpat vain kovimpiin kappaleisiin.", tyyli="kaytannollinen", aika=30, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Parempi kuin ei mitään.</strong></p><p>Kuulo vaurioituu myös pitkästä altistuksesta, ei vain kovimmista hetkistä. Sami käyttää muusikon tulppia koko keikan.</p>"),
       dict(teksti="Ei käytetä tulppia. Oikea muusikko kuulee soundin paljain korvin.", tyyli="suora", aika=20, piirteet={},
            palaute="<p><strong>Ei käy.</strong></p><p>Kuulovaurio on pysyvä. Monella muusikolla on tinnitus eli korvien soiminen, joka ei lähde pois. Sami kokeilee muusikon tulppia.</p>"),
      ]),
 dict(nimi="Valot", tausta="valot", otsikko="Strobo finaaliin?", avain="valosuunnittelija",
      taustakuva=KUVA + "musiikki-sali-tausta.webp",
      kysymys="Miltä valosuunnittelijan työ näytti?",
      johdanto="""<p>Valosuunnittelija Kaisla ohjelmoi valoja. Aava haluaa finaaliin voimakkaan, nopeasti välkkyvän stroboskooppivalon.</p>
<p>Salissa on tänään 1 700 katsojaa.</p>
<p class="puhe"><strong>Kaisla, valosuunnittelija:</strong> ”Mitä päätetään?”</p>""",
      valinnat=[
       dict(teksti="Kaisla suunnittelee finaaliin näyttävät valot ilman nopeaa välkettä. Lipputiedoissa kerrotaan valoefekteistä.", aika=45, piirteet={"vastuullinen": 2, "luova": 1},
            palaute="<p><strong>Näyttävää ja turvallista!</strong></p><p>Nopeasti välkkyvä valo voi laukaista kohtauksen valoherkälle ihmiselle. Värit, keilat ja savu tekevät finaalista upean ilman välkettä.</p>"),
       dict(teksti="Strobo on mukana, mutta siitä kerrotaan yleisölle ennen kappaletta.", tyyli="empaattinen", aika=35, piirteet={"vastuullinen": 1},
            palaute="<p><strong>Varoitus on hyvä, mutta ei riitä.</strong></p><p>Kesken konsertin kaikki eivät ehdi poistua salista. Kaisla tekee finaaliin näyttävät valot ilman nopeaa välkettä.</p>"),
       dict(teksti="Strobo täysillä. Finaalin pitää olla ikimuistoinen.", tyyli="rohkea", aika=25, piirteet={},
            palaute="<p><strong>Liian riskialtista.</strong></p><p>Isossa yleisössä on usein valoherkkiä ihmisiä. Kaisla tekee finaaliin näyttävät valot ilman nopeaa välkettä.</p>"),
      ]),
]

TARINA_LOPPU = dict(nimi="Konsertti", teksti="""<h1>Valot sammuvat salissa</h1>
<p class="highlight">Kello on <<print setup.kello($aika)>>. Konsertti alkaa!</p>
<p>Sali hiljenee. Kapellimestari nostaa tahtipuikon, ja orkesteri aloittaa. Kulisseissa sinä seuraat, kuinka koko päivän työ muuttuu musiikiksi.</p>
<p>Huomasitko? Yksi konsertti tarvitsi monta ammattilaista:</p>
<ul class="ammattilista">
<li><strong>Jonna, musiikkiteknologi</strong> – huolehti äänestä ja tallenteesta</li>
<li><strong>Matti, pianonvirittäjä</strong> – viritti flyygelin</li>
<li><strong>Eeva, kapellimestari</strong> – johti orkesteria</li>
<li><strong>Leo, orkesterimuusikko</strong> – soitti klarinettisoolon</li>
<li><strong>Sami, muusikko</strong> – soitti bassoa Aavan bändissä</li>
<li><strong>Kaisla, valosuunnittelija</strong> – loi konsertin valot</li>
</ul>
<p>Muusikoksi, musiikkiteknologiksi ja pianonvirittäjäksi voi opiskella ammattikoulussa musiikkialan perustutkinnossa. Valosuunnittelijaksi opiskellaan ammattikorkeakoulussa. Kapellimestariksi ja orkesterimuusikoksi opiskellaan Sibelius-Akatemiassa.</p>""")

PIIRTEET = {
 "tarkka": {"nimi": "Tarkka korva", "kuvaus": "Huomaat pienetkin virheet äänessä ja yksityiskohdissa."},
 "tiimi": {"nimi": "Yhteistyön taitaja", "kuvaus": "Sovit asiat muiden kanssa, jotta kaikki soittavat samaan suuntaan."},
 "luova": {"nimi": "Luova", "kuvaus": "Keksit uusia ideoita ja näet, miten niistä tulee totta."},
 "vastuullinen": {"nimi": "Huolehtija", "kuvaus": "Pidät huolta muiden terveydestä ja turvallisuudesta."},
}

AMMATIT = {
 "musiikkiteknologi": {"nimi": "Musiikkiteknologi", "kuvaus": "Huolehtii äänentoistosta konserteissa ja äänittää musiikkia.",
                       "tutkinto": "Musiikkialan perustutkinto (musiikkiteknologi)", "piirteet": ["tarkka", "tiimi"]},
 "pianonvirittaja": {"nimi": "Pianonvirittäjä", "kuvaus": "Virittää ja huoltaa pianoja ja flyygeleitä.",
                     "tutkinto": "Musiikkialan perustutkinto (pianonvirittäjä)", "piirteet": ["tarkka", "vastuullinen"]},
 "kapellimestari": {"nimi": "Kapellimestari", "kuvaus": "Johtaa orkesteria harjoituksissa ja konserteissa.",
                    "tutkinto": "Kapellimestarikoulutus, Sibelius-Akatemia (Taideyliopisto)", "piirteet": ["tiimi", "luova"]},
 "orkesterimuusikko": {"nimi": "Orkesterimuusikko", "kuvaus": "Soittaa sinfonia- tai kamariorkesterissa.",
                       "tutkinto": "Musiikin kandidaatti ja maisteri, Sibelius-Akatemia", "piirteet": ["tarkka", "vastuullinen"]},
 "muusikko": {"nimi": "Muusikko", "kuvaus": "Soittaa tai laulaa bändeissä, keikoilla ja äänityksissä.",
              "tutkinto": "Musiikkialan perustutkinto (muusikko) tai muusikko (AMK)", "piirteet": ["luova", "tiimi"]},
 "valosuunnittelija": {"nimi": "Valosuunnittelija", "kuvaus": "Suunnittelee ja ohjaa valoja konserteissa ja esityksissä.",
                       "tutkinto": "Medianomi (AMK), esitys- ja teatteritekniikka", "piirteet": ["luova", "vastuullinen"]},
}

KUTSU_JOHDANTO = "Konsertti onnistui, ja Aava lähtee kiertueelle! Nyt sinä pääset kiertuemanagerina kokoamaan setlistan eli kappaleiden järjestyksen ensimmäiselle klubikeikalle."

def K(nimi, kesto, energia, kuvaus, tagit=()):
    return {"nimi": nimi, "kesto": kesto, "energia": energia, "kuvaus": kuvaus, "tagit": list(tagit)}

TEHTAVA = dict(
    tyyppi="setlista",
    nimi="Keikan setlista", tag="Tehtävä · noin 20 min",
    maara="<strong>yhden keikan setlista</strong>",
    ohjeAskelLause="Teet kaksi asiaa:",
    askeleet=["Valitse kappaleet ja laita ne järjestykseen. Keikka kestää 40–45 minuuttia.",
              "Perustele kaksi asiaa omin sanoin."],
    lopuksi="Energiakäyrä näyttää, miten keikan tunnelma vaihtelee, ja muistilista kertoo, mitä vielä puuttuu. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
    tulosOtsikko="Setlistasi",
    osa1="Osa 1/2 · Setlista", osa2="Osa 2/2 · Perustelut",
    tilanneOtsikko="Klubikeikka",
    ohje="Kokoa Aavan keikalle 40–45 minuutin setlista. Numero kertoo kappaleen energian: 1 = tosi rauhallinen, 5 = täysillä. Hyvä keikka on kuin tarina: siinä on alku, vaihtelua ja huippukohta lopussa.",
    kappaleetOtsikko="Aavan kappaleet", setlistaOtsikko="SETLISTA · KLUBIKEIKKA",
    kayraOtsikko="Energiakäyrä", saannotOtsikko="Kiertuemanagerin muistilista",
    tavoiteTeksti="40–45 min",
    tagiNimet={"hitti": "hitti", "suurinhitti": "suurin hitti", "uusi": "uusi", "orkesteri": "soitinkappale"},
    tarkistaNappi="Tarkista setlista", jatkaNappi="Jatka perusteluihin", tyhjennaNappi="Tyhjennä", takaisinNappi="Muokkaa setlistaa", valmisNappi="Katso tulos",
    perusteluOtsikko="Setlista on valmis!", perusteluOhje="Vastaa vielä kahteen kysymykseen. Kirjoita kumpaankin yksi tai kaksi lausetta.",
    ammattilainenTeksti="Tätä työtä tekee",
    korttiYla="SETLISTA · AAVAN KLUBIKEIKKA",
    palaute=["Huippusetlista! Keikassa on vauhtia, vaihtelua ja upea loppu.",
             "Hyvä setlista! Pari pientä muutosta, niin keikka olisi täydellinen.",
             "Hyvä alku! Katso muistilistaa ja kokeile siirtää kappaleita."],
    kappaleet=[
        K("Kesäkuu", "3:20", 4, "Aavan tunnetuin kappale. Koko yleisö laulaa mukana.", ["suurinhitti"]),
        K("Valonsäde", "3:40", 5, "Nopea ja iloinen. Saa yleisön liikkeelle.", ["hitti"]),
        K("Kaupungin valot", "3:50", 4, "Reipas kappale, jossa on iso kertosäe."),
        K("Talviyö", "4:30", 2, "Kaunis balladi pianon kanssa.", ["hitti"]),
        K("Minne tuuli vie", "5:10", 3, "Keskitempoinen tarina-kappale."),
        K("Hiljaisuus", "4:20", 1, "Uusi, tosi hiljainen kappale. Vain laulu ja kitara.", ["uusi"]),
        K("Rytmi", "3:30", 5, "Rummut edellä! Kovin tanssikappale."),
        K("Kotimatka", "4:00", 2, "Rauhallinen ja lämmin kappale."),
        K("Myrskyn silmä", "4:50", 4, "Uusi, voimakas rock-kappale.", ["uusi"]),
        K("Siivet", "6:00", 3, "Bändin näyttävä soitinkappale ilman laulua. Aava saa hengähtää.", ["orkesteri"]),
        K("Uusi alku", "4:10", 3, "Uusi kappale, jota yleisö ei ole vielä kuullut.", ["uusi"]),
        K("Lumen alla", "3:40", 2, "Uusi, hidas kappale.", ["uusi"]),
    ],
    saannot=[
        {"tyyppi": "kesto", "min": 40, "max": 45, "nimi": "Keikka kestää 40–45 minuuttia", "selitys": "Klubi on varattu tietyksi ajaksi. Liian lyhyt keikka pettää yleisön, liian pitkä venyy yli ajan."},
        {"tyyppi": "alku", "minEnergia": 4, "nimi": "Alku on energinen (energia 4 tai 5)", "selitys": "Ensimmäinen kappale herättää yleisön. Hidas aloitus voi jättää tunnelman laimeaksi."},
        {"tyyppi": "loppu", "tagi": "suurinhitti", "nimi": "Suurin hitti on viimeisenä", "selitys": "Keikka päättyy huippuun, kun kaikki saavat laulaa tutun kappaleen mukana."},
        {"tyyppi": "rauhallinen", "maxEnergia": 2, "nimi": "Keskellä on ainakin yksi rauhallinen kappale", "selitys": "Hiljainen hetki antaa yleisölle ja laulajalle hengähdystauon ja tekee lopusta vielä voimakkaamman."},
        {"tyyppi": "vaihtelu", "nimi": "Ei kolmea samanlaista kappaletta peräkkäin", "selitys": "Kolme hidasta peräkkäin väsyttää, ja kolme nopeaa peräkkäin uuvuttaa. Vaihtelu pitää yleisön mukana."},
        {"tyyppi": "uudet", "min": 1, "max": 2, "nimi": "Mukana 1–2 uutta kappaletta", "selitys": "Yleisö haluaa kuulla tuttuja kappaleita, mutta uusi kappale tuo yllätyksen."},
        {"tyyppi": "mukana", "tagi": "orkesteri", "nimi": "Bändin soitinkappale on mukana", "selitys": "Soitinkappaleen aikana laulajan ääni lepää, ja bändi pääsee loistamaan."},
    ],
    kysymykset=[
        {"kysymys": "Miksi keikka kannattaa aloittaa ja lopettaa energisellä kappaleella?", "ammattilainen": "Muusikko",
         "tutkinto": "Musiikkialan perustutkinto (muusikko)", "placeholder": "Energinen alku ja loppu ovat tärkeitä, koska…"},
        {"kysymys": "Mitä muusikko voi tehdä, jotta hänen kuulonsa säilyy koko työuran ajan?", "ammattilainen": "Musiikkiteknologi",
         "tutkinto": "Musiikkialan perustutkinto (musiikkiteknologi)", "placeholder": "Muusikko voi esimerkiksi…"},
    ],
    ammattilaisetOtsikko="Musiikkialan ammatteja",
    ammattilaiset=[
        {"nimi": "Muusikko", "tehtava": "soittaa ja laulaa keikoilla ja äänityksissä", "tutkinto": "Musiikkialan perustutkinto (muusikko)"},
        {"nimi": "Musiikkiteknologi", "tehtava": "huolehtii äänestä ja äänittää", "tutkinto": "Musiikkialan perustutkinto (musiikkiteknologi)"},
        {"nimi": "Pianonvirittäjä", "tehtava": "virittää ja huoltaa pianoja", "tutkinto": "Musiikkialan perustutkinto (pianonvirittäjä)"},
        {"nimi": "Valosuunnittelija", "tehtava": "suunnittelee konserttien valot", "tutkinto": "Medianomi (AMK), esitys- ja teatteritekniikka"},
        {"nimi": "Orkesterimuusikko", "tehtava": "soittaa sinfoniaorkesterissa", "tutkinto": "Musiikin kandidaatti ja maisteri, Sibelius-Akatemia"},
        {"nimi": "Kapellimestari", "tehtava": "johtaa orkesteria", "tutkinto": "Sibelius-Akatemia (Taideyliopisto)"},
    ],
)

KUTSU_KORTIT = []

LOPPU_TEKSTI = "Seurasit konserttipäivää kulisseissa ja kokosit keikalle setlistan. Samalla tutustuit musiikkialan ammatteihin."

OPPILAITOKSET = ("Missä musiikkia voi opiskella?", "Oppilaitokset")
SAILYTA = []
SAILYTA_KORVAUKSET = []

def kortti(nimi, teksti, url):
    return f'<div class="school-card">\n<h3>{nimi}</h3>\n<p>{teksti}</p>\n<a href="{url}" target="_blank" rel="noopener">Lue lisää</a>\n</div>\n'

LISAPASSAGET = [dict(nimi="Oppilaitokset", tags="scene-loppu", teksti=
"""<h2>Musiikkialan koulutukset</h2>
<p>Tässä on esimerkkejä oppilaitoksista. Musiikkialan perustutkintoon haetaan yleensä ennakkotehtävällä ja pääsykokeella. Tarkista ajantasaiset tiedot opinto-ohjaajaltasi ja Opintopolusta.</p>
<h3>Heti peruskoulun jälkeen</h3>
""" + kortti("Pop & Jazz Konservatorio, Helsinki", "Musiikkialan perustutkinto: muusikko ja musiikkiteknologi.", "https://www.popjazz.fi")
    + kortti("Lahden konservatorio", "Musiikkialan perustutkinto (muusikko).", "https://concis.fi")
    + kortti("Oulun konservatorio", "Musiikkialan perustutkinto (muusikko).", "https://www.ouka.fi/konservatorio")
    + kortti("Koulutuskeskus Salpaus, Lahti", "Musiikkialan perustutkinto (musiikkiteknologi).", "https://salpaus.fi")
    + kortti("Etsi lisää Opintopolusta", "Hae sanalla ”musiikkialan perustutkinto”.", "https://opintopolku.fi/konfo/fi/haku?keyword=musiikkialan%20perustutkinto")
    + """<h3>Myöhemmin</h3>
""" + kortti("Metropolia Ammattikorkeakoulu, Helsinki", "Muusikko (AMK), musiikkipedagogi (AMK) ja medianomi (AMK), esitys- ja teatteritekniikka.", "https://www.metropolia.fi")
    + kortti("Taideyliopiston Sibelius-Akatemia, Helsinki", "Musiikin kandidaatti ja maisteri. Ainoa paikka Suomessa, jossa voi opiskella kapellimestariksi.", "https://www.uniarts.fi")
    + """<div class="intro-nappi"><<link "Takaisin">><<goto "Loppu">><</link>></div>""")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
SEURAUKSET = {
    "Äänitysstudio": "Mikrofonihäiriön etsiminen jäi viime tippaan, ja yleisö pääsi saliin myöhässä.",
    "Flyygeli": "Flyygelin viritys tehtiin kiireessä, ja harjoituksesta jäi puolet pois.",
    "Kapellimestari": "Muutosta ei harjoiteltu kunnolla, ja kappale meni illalla hetkeksi sekaisin.",
    "Orkesteri": "Leon ranne kipeytyi lisää, ja soolo jännitti häntä koko konsertin ajan.",
    "Bändin nurkka": "Samin korvat soivat konsertin jälkeen, ja hän varasi ajan kuulotutkimukseen.",
    "Valot": "Yksi katsoja voi huonosti välkkyvien valojen takia, ja konserttitalo sai palautetta.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Konsertti alkaa ajoissa, ja sali on täynnä. Kaikki soi juuri niin kuin piti!",
    "Kello on <<print setup.kello($aika)>>. Konsertti alkaa, ja yleisö taputtaa. Pari asiaa olisi voinut mennä paremmin, mutta ilta onnistui.",
    "Kello on <<print setup.kello($aika)>>. Konsertti saatiin pidettyä, mutta ilta oli täynnä ongelmia. Lehden arvostelussa mainitaan kömmähdykset.",
]
MYOHASSA = "Konsertti alkoi myöhässä, ja yleisö joutui odottamaan aulassa."
# Näytä paras vaihtoehto eri kohdassa eri kohtauksissa (rakennusskripti järjestää)
SEKOITA_VALINNAT = True
