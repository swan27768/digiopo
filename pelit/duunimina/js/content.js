// ============================
// DUUNIMINÄ – SISÄLTÖKERROS (NO MODULES)
// ============================
window.TYPE_PROFILES = {

  "Ihmisläheinen humanisti": {
    title: "Ihmisläheinen humanisti",
    lead: "Sinulle on tärkeää, että ihmisillä on hyvä olla. Huomaat herkästi toisten tarpeet ja haluat olla avuksi.",
    meaning: "Olet parhaimmillasi tilanteissa, joissa voit tukea, kuunnella ja auttaa muita eteenpäin.",
    promise: "Sinun tapasi toimia tekee maailmasta turvallisemman ja inhimillisemmän.",
    essence: "lämpöä, kuuntelevaa läsnäoloa ja aitoa halua auttaa muita eteenpäin"
  },

  "Tiimipelaaja": {
    title: "Tiimipelaaja",
    lead: "Viihdyt ihmisten parissa ja tuot porukkaan hyvää fiilistä. Sinussa on luontaista yhteishenkeä.",
    meaning: "Olet vahvimmillasi ryhmissä, joissa tarvitaan yhteistyötä ja vuorovaikutusta.",
    promise: "Sinä saat ihmiset toimimaan yhdessä.",
    essence: "luontaista yhteishenkeä ja kykyä saada ihmiset viihtymään yhdessä"
  },

  "Vaikuttaja": {
    title: "Vaikuttaja",
    lead: "Haluat saada asioita liikkeelle ja viedä eteenpäin. Rohkeus ja aloitekyky ovat sinulle luontaisia.",
    meaning: "Olet parhaimmillasi silloin, kun saat ottaa vastuuta ja tehdä päätöksiä.",
    promise: "Sinä saat asiat tapahtumaan.",
    essence: "rohkeutta, aloitteellisuutta ja voimaa saada asioita liikkeelle"
  },

  "Luovatyyppi": {
    title: "Luovatyyppi",
    lead: "Sinulla on luontainen tarve keksiä, luoda ja tehdä omalla tavallasi.",
    meaning: "Olet vahvimmillasi, kun saat käyttää mielikuvitustasi ja kehittää uusia tapoja toimia.",
    promise: "Sinä tuot maailmaan uutta.",
    essence: "mielikuvitusta, oivalluksia ja halua tehdä asiat omalla tavallasi"
  },

  "Ajattelijatyyppi": {
    title: "Ajattelijatyyppi",
    lead: "Pidät asioiden pohtimisesta, logiikasta ja siitä, että ymmärrät miten asiat toimivat.",
    meaning: "Olet parhaimmillasi, kun saat tutkia, suunnitella ja ratkaista ongelmia.",
    promise: "Sinä näet kokonaisuuksia, joita muut eivät.",
    essence: "selkeyttä, loogista ajattelua ja kykyä nähdä kokonaisuuksia"
  },

  "Tekijä": {
    title: "Tekijä",
    lead: "Tykkäät tehdä asioita ja nähdä työsi jäljen.",
    meaning: "Olet vahvimmillasi, kun saat tehdä omin käsin, keskittyä tekemiseen ja nähdä työsi tulokset.",
    promise: "Sinä teet asiat todeksi.",
    essence: "käytännön taitoa, sitkeyttä ja tekemisen varmuutta"
  },

  "Järjestäjätyyppi": {
    title: "Järjestäjätyyppi",
    lead: "Sinulle on tärkeää, että asiat tehdään kunnolla, turvallisesti ja oikein.",
    meaning: "Olet parhaimmillasi selkeissä rakenteissa, joissa huolellisuus ja vastuu ovat tärkeitä.",
    promise: "Sinä pidät kokonaisuudet kunnossa.",
    essence: "huolellisuutta, vastuullisuutta ja turvallisuutta luovaa otetta"
  },

  "Etsijä": {
    title: "Etsijä",
    lead: "Olet vielä etsimässä omaa tapaasi tehdä ja olla mukana.",
    meaning: "Tässä vaiheessa tärkeintä on kokeilla, tutustua ja löytää se, mikä tuntuu omalta.",
    promise: "Sinulla on lupa etsiä ja kasvaa.",
    essence: "uteliaisuutta ja kasvunhalua"
  }
};


window.buildInterpretation = function(primary, secondary) {

  const main = TYPE_PROFILES[primary];
  if (!main) return "";

  // Vain päätyyppi
  if (!secondary) {
    return `Olet ${primary}. Sinussa on ${main.essence}.`;
  }

  const support = TYPE_PROFILES[secondary];

  if (!support) {
    return `Olet ${primary}. Sinussa on ${main.essence}.`;
  }

  return `Olet ${primary}. Sinussa on ${main.essence} — ja myös ${support.essence}.`;
};


