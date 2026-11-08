/* Tulevaisuuden unelmatoimisto — arpoo asiakastoiveita (tehtavat/unelmatoimisto.html). */
(function () {
  "use strict";

  var kaytetyt = [];
  function arvoToive() {
    var TOIVEET = window.UNELMATOIVEET || [];
    if (!TOIVEET.length) return "";
    if (kaytetyt.length >= TOIVEET.length) kaytetyt = [];
    var v;
    do { v = TOIVEET[Math.floor(Math.random() * TOIVEET.length)]; } while (kaytetyt.indexOf(v) !== -1);
    kaytetyt.push(v);
    return v;
  }

  document.addEventListener("DOMContentLoaded", function () {
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
