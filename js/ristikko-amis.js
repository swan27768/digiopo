/* Amiksen ristikko – sanat ja vihjeet. Moottori: js/ristikko.js */
window.RISTIKKO = {
  id: "amis",
  otsikko: "Amiksen ristikko",
  ohje: "Ratkaise ristikko ammatillisen koulutuksen sanastosta. Jokaisesta oikein täytetystä sanasta saat 10 pistettä.",
  vari: "#15803d", variTumma: "#14532d", variVaalea: "#dcfce7",
  rivit: 11, sarakkeet: 12,
  sanat: [
    { sana: "OSAAMISPISTE", rivi: 10, sarake: 0, suunta: "across", vihje: "Mittaa ammatillisten opintojen laajuutta." },
    { sana: "OPPISOPIMUS", rivi: 0, sarake: 6, suunta: "down", vihje: "Opiskelet työpaikalla työsuhteessa." },
    { sana: "YHTEISHAKU", rivi: 3, sarake: 2, suunta: "across", vihje: "Keväällä tehtävä haku toisen asteen opintoihin." },
    { sana: "TYÖPAIKKA", rivi: 2, sarake: 2, suunta: "down", vihje: "Paikka, jossa opit oikeita työtehtäviä." },
    { sana: "TUTKINTO", rivi: 3, sarake: 0, suunta: "down", vihje: "Koulutuksen kokonaisuus, joka antaa pätevyyden ammattiin." },
    { sana: "AMMATTI", rivi: 8, sarake: 4, suunta: "across", vihje: "Työ, johon opiskelet pätevyyden." },
    { sana: "PALKKA", rivi: 0, sarake: 10, suunta: "down", vihje: "Oppisopimuksella saat sitä, koulutussopimuksella et." },
    { sana: "NÄYTTÖ", rivi: 0, sarake: 4, suunta: "down", vihje: "Osoitat osaamisesi käytännön työtehtävissä." },
    { sana: "HOKS", rivi: 3, sarake: 8, suunta: "down", vihje: "Henkilökohtainen suunnitelma siitä, mitä opiskelet ja miten." },
    { sana: "OPO", rivi: 0, sarake: 6, suunta: "across", vihje: "Opinto-ohjaaja lyhennettynä." }
  ]
};
