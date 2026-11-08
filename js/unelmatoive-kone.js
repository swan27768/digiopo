/* Unelmatoiveiden kone ja Vinkki-linkki: arpoo ryhmälle toiveen, jos luokan lappuja ei ole tarpeeksi (7. lk, Unelmatoimisto). */
(function () {
  "use strict";
  // Toiveet tulevat kielitiedostoista (translations/<kieli>.json, avain unelmakone.toiveet).
  function toiveet() {
    var T = window.DIGIOPO_T;
    var l = T && T.unelmakone && T.unelmakone.toiveet;
    return Array.isArray(l) && l.length ? l : [];
  }
  // Yhteinen toivelista (nykyisellä kielellä).
  Object.defineProperty(window, "UNELMATOIVEET", { configurable: true, get: toiveet });

  var kaytetyt = [];
  function arvo() {
    var L = toiveet();
    if (!L.length) return "";
    kaytetyt = kaytetyt.filter(function (i) { return i < L.length; });
    if (kaytetyt.length >= L.length) kaytetyt = [];
    var i;
    do { i = Math.floor(Math.random() * L.length); } while (kaytetyt.indexOf(i) !== -1);
    kaytetyt.push(i);
    return L[i];
  }
  function t(avain, oletus) {
    try {
      var osat = avain.split(".");
      var o = window.DIGIOPO_T;
      for (var i = 0; o && i < osat.length; i++) o = o[osat[i]];
      if (typeof o === "string" && o) return o;
    } catch (e) { /* ei haittaa */ }
    return oletus;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var nappi = document.getElementById("unelmakone-nappi");
    var tulos = document.getElementById("unelmakone-tulos");
    if (!nappi || !tulos) return;
    var kone = nappi.closest(".unelmakone");
    var ajastin = null;
    var vahenna = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function nayta() {
      tulos.textContent = arvo();
      tulos.removeAttribute("data-i18n");
      tulos.classList.add("on-toive");
      if (kone) kone.classList.remove("kaynnissa");
      nappi.textContent = t("unelmakone.uusi", "Arvo uusi toive");
      nappi.removeAttribute("data-i18n");
    }
    nappi.addEventListener("click", function () {
      if (ajastin) return;
      if (vahenna) { nayta(); return; }
      tulos.classList.remove("on-toive");
      tulos.textContent = t("unelmakone.miettii", "Kone miettii…");
      tulos.removeAttribute("data-i18n");
      if (kone) kone.classList.add("kaynnissa");
      ajastin = setTimeout(function () { ajastin = null; nayta(); }, 900);
    });
  });

  // Vinkki-linkit avaavat pienen iframen (ladataan vasta ensimmäisellä avauksella).
  document.addEventListener("DOMContentLoaded", function () {
    var napit = document.querySelectorAll(".vinkki-linkki");
    Array.prototype.forEach.call(napit, function (nappi) {
      var paneeli = document.getElementById(nappi.getAttribute("aria-controls"));
      var kehys = paneeli ? paneeli.querySelector("iframe") : null;
      if (!paneeli || !kehys) return;
      nappi.addEventListener("click", function () {
        var auki = nappi.getAttribute("aria-expanded") === "true";
        if (!auki && !kehys.getAttribute("src")) kehys.setAttribute("src", kehys.getAttribute("data-src"));
        nappi.setAttribute("aria-expanded", auki ? "false" : "true");
        paneeli.hidden = auki;
      });
    });
  });
})();
