/* Tulevaisuuden unelmatoimisto — tulostaa unelmakortit (tehtavat/unelmatoimisto.html). */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var tulosta = document.getElementById("tulosta-kortit");
    if (tulosta) tulosta.addEventListener("click", function () { window.print(); });
  });
})();
