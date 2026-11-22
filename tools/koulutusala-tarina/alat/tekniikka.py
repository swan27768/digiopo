# -*- coding: utf-8 -*-
"""Tekniikan ala – "Linja seis!" (sisältö). Rakenna: python3 rakenna_tarina.py alat/tekniikka.py <orig.html> <uusi.html>"""

ala = "tekniikka"
alaNimi = "Tekniikan ala"
tarinaNimi = "Linja seis!"
maailma = "tekniikka"          # tausta3d.js:n maailma
yleisKohtaus = "tehdas"        # 3D-kohtaus aloitus-, ohje- ja korttisivuille
katsoTeksti = "Katso tehdasta"
kello = {"alku": 12 * 60, "raja": 180}
aikaRivi = "Rekka lähti kello"
siirtyma = 10
siirtymaTeksti = "Seuraavalle asemalle kävelet 10 min."
kutsuTilanneOtsikko = "Vikatilanne"

HUD = [("hud-kello", "Kello <<print setup.kello($aika)>>"),
       ("hud-rekka", "Rekka tulee klo 15.00"),
       ("hud-jaljella", "<<print setup.jaljella($aika)>>")]

TEEMA = """:root {
  --a1: #6fffe9; --a1-rgb: 111,255,233;
  --a2: #4ea8de; --a2-rgb: 78,168,222;
  --a3: #72efdd;
  --korostus: #ffe066; --korostus-rgb: 255,224,102;
  --tausta: #0b132b; --tausta-rgb: 11,19,43;
  --tausta-2: #1c2541; --tausta-2-rgb: 28,37,65;
  --paneeli: #111a33; --paneeli-rgb: 17,26,51;
  --paneeli-2: #13224a;
  --tumma: #06101f; --tumma-rgb: 6,16,31;
  --reuna: #2dd4bf;
  --teksti-pehmea: #c7d2fe; --teksti-pehmea-rgb: 199,210,254;
  --teksti-vaalea: #e6fbff;
  --nappi-teksti: #051b1f;
}"""

KANSI = dict(pieni="Tekniikan ala", otsikko="Tekniikan ala",
             alaotsikko="Linja seis! · Ehditkö korjata tehtaan ennen kuin rekka tulee?")

ALKU = dict(tag="Tarina · noin 15 min",
            teksti="Olet sähköpyörätehtaan vuoromestari. Sinä vastaat siitä, että päivän pyörät valmistuvat. Kesken päivän tuotantolinja pysähtyy, ja rekka tulee hakemaan pyörät kello 15. Ehditkö selvittää vian?",
            faktat=[("5", "ammattilaista"), ("3 h", "aikaa"), ("1", "oma ammattikortti")])

TARINA_ALKU = dict(nimi="Linja seis", tausta="halytys", teksti="<<include \"HUD\">>\n<h1>Linja seis!</h1>\n<p>Kello on 12.00. Olet Volttipyörä Oy:n vuoromestari. Tehdas kokoaa sähköpyöriä, ja sinä johdat tämän päivän vuoroa.</p>\n<p>Kierrät automaatioasentaja Sannan kanssa tuotantolinjaa. Robotit hitsaavat runkoja, ja hihna kuljettaa pyöriä eteenpäin.</p>\n<p>Yhtäkkiä kuuluu kova piippaus. Punaiset valot alkavat vilkkua. Hihna pysähtyy.</p>\n<p class=\"puhe\"><strong>Sanna:</strong> ”Linja seis! Rekka tulee hakemaan 120 pyörää kello 15. Tule, mennään ohjaamoon.”</p>\n<div class=\"intro-nappi\"><<link \"Juokse ohjaamoon\">><<set $aika += 5>><<goto \"{{ENSIMMAINEN}}\">><</link>></div>")

KOHTAUKSET = [
 {
  "nimi": "Ohjaamo",
  "tausta": "ohjaamo",
  "otsikko": "Ohjaamo",
  "johdanto": "<p>Ohjaamossa on kuusi näyttöä. Yhdellä vilkkuu punainen teksti: <strong>VIKA E-47 · ROBOTTI 3 · YLIVIRTA</strong>.</p>\n<p class=\"puhe\"><strong>Sanna, automaatioasentaja:</strong> ”Ylivirta tarkoittaa, että moottori on ottanut liikaa sähköä. Robotti pysäytti koko linjan, ettei mitään hajoa. Mitä tekisit ensin?”</p>",
  "valinnat": [
   {
    "teksti": "Painan Käynnistä-nappia. Ehkä vika katoaa.", "tyyli": "nopea",
    "aika": 25,
    "piirteet": {},
    "palaute": "<p><strong>Linja lähtee käyntiin… ja pysähtyy taas kahden minuutin päästä.</strong></p><p>Kotona laitteen uudelleenkäynnistys auttaa usein. Tehtaassa vika palaa, jos sen syytä ei löydy. Robotti voi myös hajota pahemmin.</p><p>Sanna avaa hälytyslokin. Siitä näkyy, että robotin 3 moottori kuumeni ja sähkökeskuksessa laukesi sulake.</p>"
   },
   {
    "teksti": "Avaan hälytyslokin ja katson, mitä tapahtui ennen vikaa.",
    "aika": 15,
    "piirteet": {
     "vianetsija": 2
    },
    "palaute": "<p><strong>Hyvä veto!</strong></p><p>Lokista näkyy järjestys: ensin robotin 3 moottori kuumeni, sitten sähkökeskuksessa laukesi sulake. Nyt tiedätte, mistä aloittaa.</p><p>Automaatioasentaja tekee juuri näin: lukee koneen viestejä kuin vihjeitä.</p>"
   },
   {
    "teksti": "Kysyn Sannalta, mistä hän itse aloittaisi.",
    "aika": 15,
    "piirteet": {
     "tiimi": 2,
     "vianetsija": 1
    },
    "palaute": "<p><strong>Fiksu kysymys.</strong></p><p>Sanna avaa hälytyslokin. Siitä näkyy, että robotin 3 moottori kuumeni ja sähkökeskuksessa laukesi sulake.</p><p>Uudessa työpaikassa kysyminen ei ole heikkoutta. Se säästää aikaa ja estää virheitä.</p>"
   }
  ],
  "avain": "automaatio",
  "kysymys": "Miltä automaatioasentajan työ näytti?"
 },
 {
  "nimi": "Sähkökeskus",
  "tausta": "sahko",
  "otsikko": "Sähkökeskus",
  "johdanto": "<p>Sähkökeskuksessa on kymmeniä sulakkeita. Yksi on lauennut, ja sen merkkivalo vilkkuu punaisena.</p>\n<p class=\"puhe\"><strong>Mikko, sähköasentaja:</strong> ”Tämä sulake syöttää sähköä robotille 3. Mitä tehdään?”</p>",
  "valinnat": [
   {
    "teksti": "Nostan sulakkeen heti takaisin ylös.", "tyyli": "rohkea",
    "aika": 20,
    "piirteet": {},
    "palaute": "<p><strong>Mikko pysäyttää sinut.</strong> ”Odota! Jos johdossa on oikosulku, voi tulla tulipalo tai sähköisku.”</p><p>Sulake laukeaa aina jostain syystä. Ensin pitää selvittää syy. Ja muista: sähkötöitä saa tehdä vain koulutettu ammattilainen.</p><p>Mikko mittaa johdon. Se on kunnossa, joten vika on robotissa.</p>"
   },
   {
    "teksti": "Pyydän Mikkoa mittaamaan johdon ensin.",
    "aika": 25,
    "piirteet": {
     "tarkka": 2
    },
    "palaute": "<p><strong>Juuri niin!</strong></p><p>Mikko mittaa johdon yleismittarilla. Johto on kunnossa, joten vika on itse robotissa.</p><p>Sähköasentajan tärkein sääntö: ensin mitataan, sitten korjataan.</p>"
   },
   {
    "teksti": "Laitan keskukseen varoituskyltin, ettei kukaan kytke sähköä vahingossa.",
    "aika": 20,
    "piirteet": {
     "tarkka": 2,
     "tiimi": 1
    },
    "palaute": "<p><strong>Näin ammattilaiset toimivat.</strong></p><p>Kun laitetta korjataan, sähköt lukitaan pois päältä ja paikalle laitetaan kyltti. Se suojaa korjaajaa.</p><p>Sitten Mikko mittaa johdon. Se on kunnossa, joten vika on robotissa.</p>"
   }
  ],
  "avain": "sahko",
  "kysymys": "Miltä sähköasentajan työ näytti?"
 },
 {
  "nimi": "Koneistamo",
  "tausta": "koneistamo",
  "otsikko": "Koneistamo",
  "johdanto": "<p>Robotti 3 avataan. Moottorin kiinnike on kulunut. Siksi moottori tärisi, kuumeni ja otti liikaa sähköä.</p>\n<p>Uusi kiinnike tehdään heti metallista CNC-koneella. Kone tekee osan tietokoneohjelman mukaan.</p>\n<p class=\"puhe\"><strong>Aino, CNC-koneistaja:</strong> ”Piirustuksen mukaan reikien välin pitää olla 48,00 mm. Se saa heittää enintään 0,05 mm suuntaan tai toiseen. Mittasin juuri ensimmäisen osan: 48,20 mm. Kelpaako se?”</p>",
  "valinnat": [
   {
    "teksti": "Kelpaa. 0,2 mm on tosi vähän.", "tyyli": "kaytannollinen",
    "aika": 35,
    "piirteet": {},
    "palaute": "<p><strong>Silmälle ero on pieni, mutta osa ei sovi paikalleen.</strong></p><p>Sallittu ero on vain 0,05 mm. Osassa ero on 0,20 mm, eli neljä kertaa sallitun verran.</p><p>Aino korjaa ohjelman ja tekee uuden osan. Koneistajan työssä mittaaminen ja laskeminen ovat arkea.</p>"
   },
   {
    "teksti": "Ei kelpaa. Korjataan koneen ohjelmaa ja tehdään uusi.",
    "aika": 25,
    "piirteet": {
     "tarkka": 2,
     "tekija": 1
    },
    "palaute": "<p><strong>Oikein laskettu!</strong></p><p>48,20 − 48,00 = 0,20 mm. Se on enemmän kuin sallittu 0,05 mm.</p><p>Aino näyttää, miten ohjelmaan syötetään korjaus. Uusi osa on 48,01 mm. Täydellinen!</p>"
   },
   {
    "teksti": "Mitataan vielä kerran, ettei mittauksessa tullut virhettä.",
    "aika": 30,
    "piirteet": {
     "tarkka": 1,
     "vianetsija": 1
    },
    "palaute": "<p><strong>Hyvä ajatus, sillä mittauksessakin voi tulla virhe.</strong></p><p>Toinen mittaus näyttää taas 48,20 mm. Se on enemmän kuin sallittu 0,05 mm, joten osa ei kelpaa.</p><p>Aino korjaa ohjelman, ja uusi osa on 48,01 mm.</p>"
   }
  ],
  "avain": "cnc",
  "kysymys": "Miltä CNC-koneistajan työ näytti?"
 },
 {
  "nimi": "Konehalli",
  "tausta": "halli",
  "otsikko": "Konehalli",
  "johdanto": "<p>Uusi osa on paikallaan. Mutta miksi moottori kuumeni niin paljon? Hallissa on tukalan kuuma.</p>\n<p class=\"puhe\"><strong>Jari, kylmäasentaja:</strong> ”Hallin jäähdytyslaite puhaltaa vain vähän ilmaa. Jos halli kuumenee, moottorit kuumenevat taas. Miten selvitetään vika?”</p>",
  "valinnat": [
   {
    "teksti": "Avataan hallin isot ovet, niin tulee viileämpää.", "tyyli": "kaytannollinen",
    "aika": 35,
    "piirteet": {
     "tiimi": 1
    },
    "palaute": "<p><strong>Halli viilenee hetkeksi.</strong> Mutta ulkoa tulee pölyä, eikä se ole hyväksi koneille.</p><p>Jari sanoo: ”Hyvä hätäratkaisu, mutta vika pitää silti korjata.” Te avaatte laitteen ja löydätte syyn: ilmansuodatin on täysin tukossa. Uusi suodatin paikalle, ja tuuletin puhaltaa taas täysillä.</p>",
    "tausta": "halliOk"
   },
   {
    "teksti": "Avataan laite ja tarkistetaan suodatin ja puhallin.",
    "aika": 30,
    "piirteet": {
     "tekija": 2,
     "vianetsija": 1
    },
    "palaute": "<p><strong>Jari ojentaa sinulle hanskat ja ruuvinvääntimen.</strong></p><p>Kun kansi aukeaa, syy näkyy heti: ilmansuodatin on harmaa ja täynnä pölyä. Vaihdatte uuden. Tuuletin alkaa puhaltaa täysillä!</p>",
    "tausta": "halliOk"
   },
   {
    "teksti": "Katsotaan huoltokirjasta, milloin laite on viimeksi huollettu.",
    "aika": 30,
    "piirteet": {
     "tarkka": 1,
     "vianetsija": 1
    },
    "palaute": "<p><strong>Huoltokirjasta löytyy vihje.</strong> Laite on huollettu viimeksi kaksi vuotta sitten!</p><p>Jari avaa laitteen, ja ilmansuodatin on tosiaan tukossa. Uusi suodatin paikalle, ja tuuletin puhaltaa taas täysillä.</p>",
    "tausta": "halliOk"
   }
  ],
  "avain": "kylma",
  "kysymys": "Miltä kylmäasentajan työ näytti?"
 },
 {
  "nimi": "Lastauslaituri",
  "tausta": "laituri",
  "otsikko": "Lastauslaituri",
  "johdanto": "<p>Sanna painaa Käynnistä-nappia. Hihna lähtee liikkeelle ja robotit heräävät. Linja käy taas!</p>\n<p>Viimeiset pyörät pakataan lavoille. Sitten rekka peruuttaa laiturille, ja kuljettaja huutaa: ”Takalaidan nostin on jumissa! En saa lavoja kyytiin.”</p>\n<p class=\"puhe\"><strong>Noora, hyötyajoneuvomekaanikko:</strong> ”Onneksi olen täällä. Nostimen hydrauliikkaletku vuotaa. Mitä sinä teet?”</p>",
  "valinnat": [
   {
    "teksti": "Autan Nooraa vaihtamaan vuotavan letkun.",
    "aika": 25,
    "piirteet": {
     "tekija": 2
    },
    "palaute": "<p><strong>Noora näyttää, mistä letku irrotetaan.</strong></p><p>Öljyä tippuu hanskoille, mutta uusi letku on pian paikallaan. Nostin toimii!</p><p>Hyötyajoneuvomekaanikko korjaa kuorma-autoja, busseja ja työkoneita. Usein juuri silloin, kun niitä tarvitaan kiireellä.</p>"
   },
   {
    "teksti": "Pyydän trukkikuskia lastaamaan lavat toisesta ovesta.",
    "aika": 15,
    "piirteet": {
     "tiimi": 2
    },
    "palaute": "<p><strong>Hyvä idea!</strong></p><p>Trukilla lavat saadaan kyytiin ilman nostinta. Sillä välin Noora korjaa letkun rauhassa.</p><p>Tiimityö toimii, kun jokainen tekee sitä, missä on paras.</p>"
   },
   {
    "teksti": "Tarkistan, että pyörät ovat kunnolla kiinni lavoissa.",
    "aika": 20,
    "piirteet": {
     "tarkka": 2
    },
    "palaute": "<p><strong>Tärkeä juttu!</strong></p><p>Jos kuorma liikkuu matkalla, pyörät voivat hajota. Löydät yhden löysän kiristysliinan ja kiristät sen.</p><p>Sillä välin Noora on vaihtanut vuotavan letkun, ja nostin toimii.</p>"
   }
  ],
  "avain": "raskas",
  "kysymys": "Miltä hyötyajoneuvomekaanikon työ näytti?"
 }
]

TARINA_LOPPU = dict(nimi="Rekka lähtee", teksti="<h1>Rekka lähtee!</h1>\n<p class=\"highlight\">Kello on <<print setup.kello($aika)>>. Rekka lähtee ajoissa, ja 120 sähköpyörää on matkalla kauppoihin!</p>\n<p>Huomasitko? Yhden vian korjaamiseen tarvittiin viisi eri ammattilaista:</p>\n<ul class=\"ammattilista\">\n<li><strong>Sanna, automaatioasentaja</strong> – löysi vian koneen viesteistä</li>\n<li><strong>Mikko, sähköasentaja</strong> – hoiti sähköt turvallisesti</li>\n<li><strong>Aino, CNC-koneistaja</strong> – teki uuden osan sadasosamillin tarkkuudella</li>\n<li><strong>Jari, kylmäasentaja</strong> – korjasi hallin jäähdytyksen</li>\n<li><strong>Noora, hyötyajoneuvomekaanikko</strong> – sai rekan nostimen toimimaan</li>\n</ul>\n<p>Kaikkiin näihin ammatteihin voi opiskella ammattikoulussa.</p>")

PIIRTEET = {
 "vianetsija": {
  "nimi": "Ongelmanratkaisija",
  "kuvaus": "Etsit syyn ennen kuin korjaat."
 },
 "tarkka": {
  "nimi": "Tarkka ja turvallinen",
  "kuvaus": "Mittaat, tarkistat ja huolehdit, ettei kukaan satu."
 },
 "tekija": {
  "nimi": "Käsillä tekijä",
  "kuvaus": "Tartut työkaluihin ja haluat nähdä, miten asiat toimivat."
 },
 "tiimi": {
  "nimi": "Tiimipelaaja",
  "kuvaus": "Kysyt, sovit asioista ja saat muut mukaan."
 }
}

AMMATIT = {
 "automaatio": {
  "nimi": "Automaatioasentaja",
  "kuvaus": "Asentaa ja korjaa robotteja ja koneita, jotka toimivat itsestään.",
  "tutkinto": "Sähkö- ja automaatioalan perustutkinto",
  "piirteet": [
   "vianetsija"
  ]
 },
 "sahko": {
  "nimi": "Sähköasentaja",
  "kuvaus": "Asentaa ja korjaa sähköjä taloissa ja tehtaissa.",
  "tutkinto": "Sähkö- ja automaatioalan perustutkinto",
  "piirteet": [
   "tarkka"
  ]
 },
 "cnc": {
  "nimi": "CNC-koneistaja",
  "kuvaus": "Tekee koneella metallista tarkkoja osia.",
  "tutkinto": "Kone- ja tuotantotekniikan perustutkinto",
  "piirteet": [
   "tarkka",
   "tekija"
  ]
 },
 "kylma": {
  "nimi": "Kylmäasentaja",
  "kuvaus": "Pitää jäähdytyksen, kylmälaitteet ja ilmastoinnin kunnossa.",
  "tutkinto": "Talotekniikan perustutkinto",
  "piirteet": [
   "tekija",
   "vianetsija"
  ]
 },
 "raskas": {
  "nimi": "Hyötyajoneuvomekaanikko",
  "kuvaus": "Korjaa kuorma-autoja, busseja ja työkoneita.",
  "tutkinto": "Ajoneuvoalan perustutkinto",
  "piirteet": [
   "tekija",
   "tiimi"
  ]
 }
}

KUTSU_JOHDANTO = "Tehtaalla tarvittiin viisi eri ammattilaista. Tekniikan alan osaajia tarvitaan kuitenkin kaikkialla: kotona, autokorjaamolla, työmaalla ja tehtaissa."

KUTSU_KORTIT = [
 {
  "tilanne": "On kova pakkanen. Mummolan ilmalämpöpumppu puhaltaa vain kylmää, ja sen ulkoyksikkö on paksussa jäässä.",
  "oikea": "Kylmäasentaja",
  "tutkinto": "Talotekniikan perustutkinto",
  "vaihtoehdot": {
   "Sähköasentaja": "Sähköasentaja tekee laitteelle sähköliitännän, mutta itse lämpöpumpun vian korjaa kylmäasentaja.",
   "Kylmäasentaja": "Lämpöpumppu toimii samalla tavalla kuin jääkaappi. Kylmäasentaja asentaa ja huoltaa lämpöpumppuja ja kylmälaitteita.",
   "Putkiasentaja": "Putkiasentaja hoitaa vesijohtoja, viemäreitä ja lämmitysputkia. Lämpöpumpun vika kuuluu kylmäasentajalle.",
   "Ilmanvaihtoasentaja": "Ilmanvaihtoasentaja huoltaa talon ilmakanavia ja ilmanvaihtokoneita, ei lämpöpumppuja."
  }
 },
 {
  "tilanne": "Keittiön tiskipöydän alta tippuu vettä. Kaapin pohja on jo märkä.",
  "oikea": "Putkiasentaja",
  "tutkinto": "Talotekniikan perustutkinto",
  "vaihtoehdot": {
   "Ilmanvaihtoasentaja": "Ilmanvaihtoasentaja hoitaa ilmakanavia ja ilmanvaihtokoneita, ei vesiputkia.",
   "Putkiasentaja": "Putkiasentaja asentaa ja korjaa vesijohtoja ja viemäreitä. Vuoto kannattaa korjata heti, ettei rakenteisiin tule kosteusvaurio.",
   "Kylmäasentaja": "Kylmäasentaja huoltaa kylmälaitteita ja lämpöpumppuja. Vesivuoto kuuluu putkiasentajalle.",
   "Sähköasentaja": "Sähköasentaja hoitaa sähköt. Vesi ja sähkö ovat vaarallinen yhdistelmä, mutta vuodon korjaa putkiasentaja."
  }
 },
 {
  "tilanne": "Kerrostalon asunnoissa on tunkkainen ilma. Kylpyhuoneen peili pysyy huurussa pitkään suihkun jälkeen.",
  "oikea": "Ilmanvaihtoasentaja",
  "tutkinto": "Talotekniikan perustutkinto",
  "vaihtoehdot": {
   "Putkiasentaja": "Putkiasentaja hoitaa vesi- ja viemäriputkia. Tunkkainen ilma on ilmanvaihdon ongelma.",
   "Kylmäasentaja": "Kylmäasentaja huoltaa jäähdytystä ja lämpöpumppuja. Talon ilmanvaihtokanavat kuuluvat ilmanvaihtoasentajalle.",
   "Ilmanvaihtoasentaja": "Ilmanvaihtoasentaja asentaa ja huoltaa ilmakanavia ja ilmanvaihtokoneita. Usein syy on likainen suodatin tai tukkeutunut kanava.",
   "Automaatioasentaja": "Automaatioasentaja työskentelee yleensä tehtaissa koneiden ja robottien parissa. Tunkkaisen ilman korjaa ilmanvaihtoasentaja."
  }
 },
 {
  "tilanne": "Perhe rakentaa uuden autotallin. Sinne tarvitaan valot, pistorasiat ja sähköauton latauspiste.",
  "oikea": "Sähköasentaja",
  "tutkinto": "Sähkö- ja automaatioalan perustutkinto",
  "vaihtoehdot": {
   "Automaatioasentaja": "Automaatioasentaja työskentelee yleensä tehtaissa koneiden ja robottien parissa. Talon sähköt asentaa sähköasentaja.",
   "Automekaanikko": "Automekaanikko korjaa autoja, mutta latauspisteen asentaminen on sähkötyötä.",
   "Sähköasentaja": "Sähköasentaja asentaa taloihin valot, pistorasiat ja latauspisteet. Sähkötöitä saa tehdä vain koulutettu ammattilainen.",
   "Putkiasentaja": "Putkiasentaja hoitaa vesijohtoja ja viemäreitä. Sähköt kuuluvat sähköasentajalle."
  }
 },
 {
  "tilanne": "Auton kojelautaan syttyy moottorin vikavalo, ja auto nykii kiihdyttäessä.",
  "oikea": "Automekaanikko",
  "tutkinto": "Ajoneuvoalan perustutkinto",
  "vaihtoehdot": {
   "Autokorimekaanikko": "Autokorimekaanikko korjaa kolarivaurioita, kuten lommoja. Moottorin vika kuuluu automekaanikolle.",
   "Automekaanikko": "Automekaanikko lukee auton vikakoodit tietokoneella ja korjaa moottorin, jarrut ja muut tekniset osat.",
   "Automaalari": "Automaalari maalaa autoja korjauksen jälkeen. Hän ei korjaa moottoria.",
   "Hyötyajoneuvomekaanikko": "Hyötyajoneuvomekaanikko korjaa kuorma-autoja ja busseja. Henkilöauton korjaa automekaanikko."
  }
 },
 {
  "tilanne": "Parkkipaikalla sattui pikkukolari. Auton ovessa on iso lommo ja puskuri on haljennut.",
  "oikea": "Autokorimekaanikko",
  "tutkinto": "Ajoneuvoalan perustutkinto",
  "vaihtoehdot": {
   "Automekaanikko": "Automekaanikko korjaa moottoria ja muita teknisiä osia. Kolarivauriot korjaa autokorimekaanikko.",
   "Automaalari": "Melkein! Automaalaria tarvitaan myös, mutta vasta kun lommo on korjattu. Ensin töihin pääsee autokorimekaanikko.",
   "Autokorimekaanikko": "Autokorimekaanikko oikaisee lommot ja vaihtaa rikkoutuneet osat. Lopuksi automaalari maalaa korjatun kohdan.",
   "Levyseppähitsaaja": "Levyseppähitsaaja tekee metallirakenteita, mutta autojen korjaaminen on oma ammattinsa."
  }
 },
 {
  "tilanne": "Tehtaaseen tarvitaan teräksinen suojakaide uuden koneen ympärille, ettei kukaan kävele liian lähelle.",
  "oikea": "Levyseppähitsaaja",
  "tutkinto": "Kone- ja tuotantotekniikan perustutkinto",
  "vaihtoehdot": {
   "CNC-koneistaja": "CNC-koneistaja tekee koneella pieniä ja tarkkoja metalliosia. Isot hitsatut rakenteet tekee levyseppähitsaaja.",
   "Automaatioasentaja": "Automaatioasentaja voi asentaa koneeseen turva-anturit, mutta itse kaiteen tekee levyseppähitsaaja.",
   "Levyseppähitsaaja": "Levyseppähitsaaja leikkaa, taivuttaa ja hitsaa metallista rakenteita, kuten kaiteita ja telineitä.",
   "Sähköasentaja": "Sähköasentaja hoitaa sähköt. Teräksisen kaiteen valmistaa levyseppähitsaaja."
  }
 },
 {
  "tilanne": "Koulubussin jarrut vinkuvat. Bussi pitää tarkastaa ennen huomista luokkaretkeä.",
  "oikea": "Hyötyajoneuvomekaanikko",
  "tutkinto": "Ajoneuvoalan perustutkinto",
  "vaihtoehdot": {
   "Automekaanikko": "Automekaanikko korjaa henkilöautoja. Bussit ja kuorma-autot korjaa hyötyajoneuvomekaanikko.",
   "Hyötyajoneuvomekaanikko": "Hyötyajoneuvomekaanikko huoltaa ja korjaa busseja, kuorma-autoja ja työkoneita. Jarrut tarkastetaan huolella, koska kyydissä on paljon ihmisiä.",
   "Levyseppähitsaaja": "Levyseppähitsaaja tekee metallirakenteita. Jarrut kuuluvat mekaanikolle.",
   "Sähköasentaja": "Sähköasentaja tekee talojen sähkötöitä. Ajoneuvon jarrut kuuluvat mekaanikolle."
  }
 }
]

LOPPU_TEKSTI = "Selvitit tehtaan vian ja ratkaisit kahdeksan vikatilannetta. Samalla tutustuit yli kymmeneen tekniikan alan ammattiin."

OPPILAITOKSET = ("Missä tekniikan alaa voi opiskella?", "Oppilaitokset")
SAILYTA = ["Oppilaitokset"]
SAILYTA_KORVAUKSET = [("Takaisin tehtäväsivulle", "Takaisin")]

# --- Valintojen seuraukset (näkyvät tarinan lopussa) ---
# Kohtauksen nimi -> seuraus, jos kohtauksessa valittiin huono vaihtoehto (valinta ilman piirteitä).
SEURAUKSET = {
    "Ohjaamo": "Linja pysähtyi uudelleen, koska vian syytä ei ollut selvitetty. Aikaa hukkui.",
    "Sähkökeskus": "Sulakkeen nostaminen ilman syyn selvittämistä oli vaarallista. Vian etsintä alkoi alusta.",
    "Koneistamo": "Väärän kokoinen osa ei sopinut. Se piti koneistaa uudelleen.",
}
# Loppukappale: [kaikki meni hyvin, osa meni pieleen, moni meni pieleen]
LOPPU_TASOT = [
    "Kello on <<print setup.kello($aika)>>. Rekka lähtee ajoissa, ja 120 sähköpyörää on matkalla kauppoihin!",
    "Kello on <<print setup.kello($aika)>>. Rekka lähtee, mutta matkan varrella hukkui aikaa. Kuljettajalla on kiire ehtiä perille.",
    "Kello on <<print setup.kello($aika)>>. Liian moni asia meni pieleen. Osa sähköpyöristä jää odottamaan seuraavaa rekkaa.",
]
MYOHASSA = "Rekka lähti <<print $aika - 180>> minuuttia myöhässä, eikä kauppa saanut pyöriä ennen viikonloppua."
