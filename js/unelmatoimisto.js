/* Tulevaisuuden unelmatoimisto — arpoo unelmapaketin tyypin ja asiakastoiveita (tehtavat/unelmatoimisto.html). */
(function () {
  "use strict";

  var PAKETIT = [
    "Matka Kuuhun", "Matka Marsiin", "Matka merenpohjaan", "Uusi koti tulevaisuuden kaupungissa",
    "Unelmaharrastus", "Unelmatyöpäivä", "Seikkailu, jota ei ole vielä olemassa", "Maailman paras koulupäivä"
  ];
  var TOIVEET = [
    "Haluan nähdä Maan avaruudesta.",
    "Haluan tavata uusia kavereita matkalla.",
    "Haluan kokeilla painotonta oloa.",
    "Haluan matkan, jossa saa levätä ja rauhoittua.",
    "Haluan oppia jotain aivan uutta.",
    "Haluan matkustaa koko perheen kanssa.",
    "Haluan nähdä jotain, mitä kukaan ei ole ennen nähnyt.",
    "Haluan matkan, joka ei pilaa luontoa.",
    "Haluan syödä jotain ihan outoa.",
    "Haluan auttaa muita matkalla.",
    "Haluan seikkailun, joka vähän jännittää.",
    "Haluan ottaa matkalta hienoja kuvia.",
    "Haluan matkan, joka ei maksa paljon.",
    "Haluan matkalle, jossa ei tarvitse puhua paljon."
  ];

  var viimeisin = null;
  function arvoPaketti() {
    var v, n = 0;
    do { v = PAKETIT[Math.floor(Math.random() * PAKETIT.length)]; n++; } while (v === viimeisin && n < 20);
    viimeisin = v;
    return v;
  }

  function pop(el) {
    el.classList.remove("vaihtuu");
    void el.offsetWidth;
    el.classList.add("vaihtuu");
  }

  var kaytetyt = [];
  function arvoToive() {
    if (kaytetyt.length >= TOIVEET.length) kaytetyt = [];
    var v;
    do { v = TOIVEET[Math.floor(Math.random() * TOIVEET.length)]; } while (kaytetyt.indexOf(v) !== -1);
    kaytetyt.push(v);
    return v;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pakettiNappi = document.getElementById("arvo-paketti");
    var pakettiNayto = document.getElementById("nayto-paketti");
    if (pakettiNappi && pakettiNayto) {
      pakettiNappi.addEventListener("click", function () {
        pakettiNayto.textContent = arvoPaketti();
        pop(pakettiNayto);
      });
    }

    var toiveNappi = document.getElementById("arvo-toive");
    var lista = document.getElementById("lista-toiveet");
    var tyhjenna = document.getElementById("tyhjenna-toiveet");
    if (toiveNappi && lista) {
      toiveNappi.addEventListener("click", function () {
        var li = document.createElement("li");
        li.textContent = arvoToive();
        lista.appendChild(li);
        while (lista.children.length > 3) lista.removeChild(lista.firstChild);
      });
    }
    if (tyhjenna && lista) {
      tyhjenna.addEventListener("click", function () {
        while (lista.firstChild) lista.removeChild(lista.firstChild);
      });
    }

    var tulosta = document.getElementById("tulosta-kortit");
    if (tulosta) tulosta.addEventListener("click", function () { window.print(); });
  });
})();
