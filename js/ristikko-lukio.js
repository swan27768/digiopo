/* Lukion ristikko – sanat ja vihjeet. Moottori: js/ristikko.js */
window.RISTIKKO = {
  id: "lukio",
  otsikko: "Lukion ristikko",
  ohje: "Ratkaise ristikko lukion sanastosta. Jokaisesta oikein täytetystä sanasta saat 10 pistettä.",
  vari: "#1d4ed8", variTumma: "#1e3a8a", variVaalea: "#dbeafe",
  rivit: 12, sarakkeet: 12,
  sanat: [
    { sana: "KURAATTORI", rivi: 0, sarake: 9, suunta: "down", vihje: "Koulun sosiaalityöntekijä." },
    { sana: "OPINTOPISTE", rivi: 0, sarake: 11, suunta: "down", vihje: "Mittaa lukio-opintojen laajuutta." },
    { sana: "LUKIODIPLOMI", rivi: 7, sarake: 0, suunta: "across", vihje: "Erillinen näyttö erityisestä osaamisesta, esimerkiksi musiikissa." },
    { sana: "APPROBATUR", rivi: 2, sarake: 0, suunta: "across", vihje: "Ylioppilastutkinnon alin hyväksytty arvosana." },
    { sana: "LAUDATUR", rivi: 4, sarake: 5, suunta: "down", vihje: "Ylioppilastutkinnon paras arvosana." },
    { sana: "ABITURIENTI", rivi: 11, sarake: 0, suunta: "across", vihje: "Opiskelija, joka valmistautuu ylioppilaskirjoituksiin." },
    { sana: "WILMA", rivi: 4, sarake: 3, suunta: "across", vihje: "Järjestelmä, jossa teet opintovalintoja ja seuraat opintojasi." },
    { sana: "TUTOR", rivi: 9, sarake: 3, suunta: "across", vihje: "Vanhempi opiskelija, joka auttaa uusia." },
    { sana: "OPINTOJAKSO", rivi: 0, sarake: 1, suunta: "across", vihje: "Yksi lukion opintokokonaisuus, josta saat opintopisteitä." }
  ]
};
