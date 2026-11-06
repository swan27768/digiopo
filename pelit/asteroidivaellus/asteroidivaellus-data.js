/* Asteroidivaellus – tarinadata.
 * Kaikki hahmot, nimet ja tekstit ovat DigiOpon omia. Peli on saanut aiheen
 * ajatuksesta "mikä on oikeasti tärkeää" – siinä ei ole lainauksia, hahmoja
 * eikä kuvia mistään julkaistusta kirjasta tai sen suomennoksesta. */
window.AV_DATA = {
  arvot: {
    merkitys: { nimi: "Merkitys", kuvaus: "Haluat tehdä asioita, joilla on sinulle väliä." },
    yhdessa: { nimi: "Yhdessä", kuvaus: "Sinulle tärkeintä on tehdä ja olla yhdessä toisten kanssa." },
    vapaus: { nimi: "Vapaus", kuvaus: "Haluat itse päättää, mitä teet ja miten." },
    kasvu: { nimi: "Kasvu", kuvaus: "Haluat oppia uutta ja kokeilla, mihin pystyt." }
  },
  planeetat: [
    {
      nimi: "Komentajan asteroidi",
      vari: "radial-gradient(circle at 30% 30%,#ff9a8b,#b5384a)",
      kuvaus: "Asteroidilla asuu Komentaja. Hän antaa käskyjä, vaikka kukaan ei ole kuuntelemassa. Kun huomaa sinut, hän ilahtuu. \"Vihdoin joku, jolle voin antaa tehtäviä!\" hän sanoo. \"Saat olla apulaiseni. Teet vain sen, mitä käsken.\"",
      kysymys: "Mitä sinä teet?",
      valinnat: [
        { teksti: "Jään apulaiseksi. Ei tarvitse itse miettiä.", pisteet: { yhdessa: 1 }, vastaus: "Komentaja on tyytyväinen. Sinulla on helppoa, mutta huomaat pian, että kukaan ei kysy, mitä sinä ajattelet." },
        { teksti: "Ehdotan, että päätämme asiat yhdessä.", pisteet: { yhdessa: 1, merkitys: 1 }, vastaus: "Komentaja miettii pitkään. \"Yhdessä? Se on uutta.\" Hän kokeilee, ja yhdessä tekeminen onnistuu yllättävän hyvin." },
        { teksti: "Kiitän tarjouksesta ja jatkan matkaa.", pisteet: { vapaus: 2 }, vastaus: "Komentaja huutaa vielä käskyn perääsi. Sinä vain heilautat kättä. Omat päätökset ovat sinulle tärkeitä." }
      ]
    },
    {
      nimi: "Taputtajan asteroidi",
      vari: "radial-gradient(circle at 30% 30%,#ffe29a,#d98f1f)",
      kuvaus: "Täällä asuu Taputtaja. Hän tekee kaiken vain siksi, että muut ihailisivat. \"Taputa minulle!\" hän pyytää heti kun näkee sinut. \"Minä olen koko avaruuden paras!\"",
      kysymys: "Miten vastaat?",
      valinnat: [
        { teksti: "Taputan hänelle. Se ilahduttaa häntä.", pisteet: { yhdessa: 1 }, vastaus: "Taputtaja hymyilee leveästi. Hetken kuluttua hän jo pyytää lisää. Kehut loppuvat nopeammin kuin hänen jaksamisensa." },
        { teksti: "Kysyn, mikä hänestä itsestään on oikeasti kivaa tehdä.", pisteet: { merkitys: 2 }, vastaus: "Taputtaja on pitkään hiljaa. \"Ei kukaan ole kysynyt sitä aiemmin\", hän sanoo. Sitten hän alkaa kertoa unelmastaan." },
        { teksti: "Sanon, että kehut tuntuvat tyhjiltä, jos niitä pitää pyytää.", pisteet: { kasvu: 1, merkitys: 1 }, vastaus: "Taputtaja mutristaa suunsa, mutta jää miettimään. Rehellinen sana voi auttaa enemmän kuin kehu." }
      ]
    },
    {
      nimi: "Laskijan asteroidi",
      vari: "radial-gradient(circle at 30% 30%,#a8e6cf,#2e8b6b)",
      kuvaus: "Laskija istuu kasan keskellä. Kasa on täynnä pieniä kiviä. \"Omistan kaikki nämä kivet!\" hän kertoo. \"Lasken ne joka päivä. Siksi minulla ei ole aikaa millekään muulle.\"",
      kysymys: "Mitä teet?",
      valinnat: [
        { teksti: "Kysyn, mitä hän tekee kivillä, kun on laskenut ne.", pisteet: { merkitys: 2 }, vastaus: "Laskija avaa suunsa, mutta ei keksi vastausta. \"En ole ajatellut sitä\", hän myöntää. Se on hyvä alku." },
        { teksti: "Autan laskemaan, jotta hän saa vapaata aikaa.", pisteet: { yhdessa: 1, kasvu: 1 }, vastaus: "Lasketaan yhdessä. Laskija huomaa, että vapaa-aika voi olla kivaa. Hän ei vain tiedä, mitä sillä tekisi." },
        { teksti: "Jätän hänet rauhaan. Hän saa itse päättää, mitä tekee.", pisteet: { vapaus: 2 }, vastaus: "Laskija jatkaa laskemista. Ehkä hän on onnellinen, ehkä ei. Sinä et voi tietää sitä toisen puolesta." }
      ]
    },
    {
      nimi: "Majakkavahdin asteroidi",
      vari: "radial-gradient(circle at 30% 30%,#b7c8ff,#3b5bdb)",
      kuvaus: "Pienellä asteroidilla on majakka. Majakkavahti sytyttää sen valon joka ilta. Hän on väsynyt, mutta hän tietää, että valo auttaa matkalaisia löytämään oikean reitin. \"Joskus tuntuu, ettei kukaan edes näe sitä\", hän sanoo.",
      kysymys: "Miten voisit auttaa?",
      valinnat: [
        { teksti: "Tarjoudun vahtimaan majakkaa, jotta hän pääsee lepäämään.", pisteet: { yhdessa: 2 }, vastaus: "Majakkavahti nukkuu ensimmäistä kertaa kuukausiin. Sinä huomaat, että toisen auttaminen tuntuu hyvältä." },
        { teksti: "Kysyn, mikä saa hänet jaksamaan.", pisteet: { merkitys: 2 }, vastaus: "\"Tiedän, että joku jossain pääsee turvaan\", hän vastaa. Hänen työnsä merkitys on hänelle selvä, vaikka työ on raskasta." },
        { teksti: "Ehdotan, että majakan voisi rakentaa toimimaan itsestään.", pisteet: { kasvu: 2 }, vastaus: "Majakkavahti kiinnostuu. Teette yhdessä suunnitelman. Uusi tapa tehdä asioita voi vapauttaa aikaa tärkeämpään." }
      ]
    },
    {
      nimi: "Kartoittajan asteroidi",
      vari: "radial-gradient(circle at 30% 30%,#d8b4fe,#7e3fb3)",
      kuvaus: "Kartoittajalla on seinät täynnä karttoja. Hän tietää jokaisesta paikasta kaiken. Hän ei ole kuitenkaan koskaan käynyt missään. \"Matkustaminen on vaarallista\", hän sanoo. \"Kartoista on turvallisempi opiskella.\"",
      kysymys: "Mitä sanot hänelle?",
      valinnat: [
        { teksti: "Pyydän häntä matkakumppaniksi.", pisteet: { yhdessa: 1, kasvu: 1 }, vastaus: "Kartoittaja epäröi. Lopulta hän ottaa yhden kartan ja astuu aluksesi. Pelottaa, mutta jännittääkin." },
        { teksti: "Pyydän häneltä vinkkejä ja lähden yksin.", pisteet: { vapaus: 1, kasvu: 1 }, vastaus: "Kartoittaja piirtää sinulle reitin. Hän on ylpeä, että tietoa tarvitaan. Sinä lähdet omille poluillesi." },
        { teksti: "Kerron, millaista oli käydä muilla asteroideilla.", pisteet: { merkitys: 1, yhdessa: 1 }, vastaus: "Kartoittaja kuuntelee tarkasti. Kartat heräävät eloon, kun joku kertoo, millaista siellä oikeasti on." }
      ]
    }
  ],
  tulokset: {
    merkitys: { otsikko: "Etsit merkitystä", teksti: "Kysyit monta kertaa, miksi joku tekee jotain. Sinulle on tärkeää, että tekeminen tuntuu omalta ja tärkeältä. Se auttaa myöhemmin, kun mietit opintoja ja töitä." },
    yhdessa: { otsikko: "Tykkäät tehdä yhdessä", teksti: "Autoit muita ja ehdotit yhteistä tekemistä. Sinulle työ on parasta, kun siinä on ihmisiä mukana." },
    vapaus: { otsikko: "Haluat päättää itse", teksti: "Vaalit omia valintojasi ja annat muille tilaa päättää omistaan. Itsenäisyys on sinulle iso arvo." },
    kasvu: { otsikko: "Haluat kasvaa", teksti: "Ehdotit uusia tapoja ja kannustit muita kokeilemaan. Uuden oppiminen kiinnostaa sinua." }
  },
  pohdinta: [
    { id: "p1", kysymys: "Minkä asteroidin asukas oli sinusta mielenkiintoisin? Miksi?" },
    { id: "p2", kysymys: "Mikä tekee sinun mielestäsi työstä tai opiskelusta merkityksellistä?" },
    { id: "p3", kysymys: "Missä asioissa haluaisit itse päättää? Entä missä auttaisit mielellään muita?" },
    { id: "p4", kysymys: "Mitä yhtä pientä asiaa voisit kokeilla tänä keväänä, joka vie sinua kohti tulevaisuutta?" }
  ]
};
