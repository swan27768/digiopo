/* Unelmatoiveiden kone: arpoo ryhmälle toiveen, jos luokan lappuja ei ole tarpeeksi (7. lk, Unelmatoimisto). */
(function () {
  "use strict";
  var TOIVEET = [
    "Haluan asua kodissa, joka tietää, mitä tarvitsen.",
    "Haluan kokeilla työpäivää, joka on aivan erilainen kuin tämä.",
    "Haluan oppia taidon, jonka osaan sitten loppuelämän.",
    "Haluan matkustaa paikkaan, jossa en ole koskaan käynyt.",
    "Haluan nähdä Maan avaruudesta.",
    "Haluan harrastuksen, jossa saan uusia kavereita.",
    "Haluan tehdä jotain, mikä auttaa muita.",
    "Haluan koulupäivän, jossa kaikki on hauskaa.",
    "Haluan kokeilla jotain, mitä kukaan ei ole ennen kokeillut.",
    "Haluan elää tavalla, joka ei kuormita luontoa.",
    "Haluan paikan, jossa voin rauhoittua.",
    "Haluan seikkailun, joka vähän jännittää.",
    "Haluan keksiä jotain, mitä maailmassa ei vielä ole.",
    "Haluan viettää päivän yhdessä koko perheen kanssa.",
    "Haluan oppia jotain uutta ilman kirjoja ja kokeita.",
    "Haluan juhlat, joita kaikki muistavat vielä vuosien päästä."
  ];
  var kaytetyt = [];
  function arvo() {
    if (kaytetyt.length >= TOIVEET.length) kaytetyt = [];
    var v;
    do { v = TOIVEET[Math.floor(Math.random() * TOIVEET.length)]; } while (kaytetyt.indexOf(v) !== -1);
    kaytetyt.push(v);
    return v;
  }
  function t(avain, oletus) {
    try {
      if (window.i18n && typeof window.i18n.t === "function") {
        var x = window.i18n.t(avain);
        if (x && x !== avain) return x;
      }
    } catch (e) { /* ei haittaa */ }
    return oletus;
  }
  document.addEventListener("DOMContentLoaded", function () {
    var nappi = document.getElementById("unelmakone-nappi");
    var tulos = document.getElementById("unelmakone-tulos");
    if (!nappi || !tulos) return;
    nappi.addEventListener("click", function () {
      tulos.textContent = arvo();
      tulos.classList.add("on-toive");
      nappi.textContent = t("unelmakone.uusi", "Arvo uusi toive");
      nappi.removeAttribute("data-i18n");
    });
  });
})();
