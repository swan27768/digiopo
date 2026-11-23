/* DigiOpo – Arvaa ja tarkista (8. lk, koulutusalakarusellin jälkeen).
 * Oppilas arvaa naisten osuuden kolmella ammatillisen koulutuksen alalla ja näkee oikeat luvut.
 * Oikeat luvut ovat HTML:ssä (data-oikea), jotta ne päivitetään yhdestä paikasta.
 * Käännökset: translations/<kieli>.json → g8.arvaa (i18n.js lähettää digiopo:langchange). */
(function () {
  "use strict";

  var OLETUS = {
    arvo: "{n} % naisia",
    tulos: "Arvasit {a} %. Oikea luku on {o} % naisia.",
    lahella: "Osuit lähelle!",
    palkki: "Palkki: oikea osuus {o} %, arvauksesi {a} %"
  };
  var tekstit = OLETUS;
  var tarkistettu = false;

  function t(avain) { return (tekstit && tekstit[avain]) || OLETUS[avain]; }
  function tayta(malli, arvot) {
    return malli.replace(/\{(\w)\}/g, function (m, k) { return arvot[k] != null ? arvot[k] : m; });
  }

  function paivitaRivi(rivi) {
    var saadin = rivi.querySelector('input[type="range"]');
    var arvo = rivi.querySelector(".arvaa__arvo");
    if (!saadin) return;
    var a = parseInt(saadin.value, 10);
    var teksti = tayta(t("arvo"), { n: a });
    if (arvo) arvo.textContent = teksti;
    saadin.setAttribute("aria-valuetext", teksti);
    if (!tarkistettu) return;
    var o = parseInt(rivi.getAttribute("data-oikea"), 10);
    var tulos = rivi.querySelector(".arvaa__tulos");
    if (!tulos || isNaN(o)) return;
    var tayte = tulos.querySelector(".arvaa__tayte");
    var merkki = tulos.querySelector(".arvaa__merkki");
    var palkki = tulos.querySelector(".arvaa__palkki");
    var selite = tulos.querySelector(".arvaa__selite");
    if (tayte) tayte.style.width = o + "%";
    if (merkki) merkki.style.insetInlineStart = a + "%";
    if (palkki) palkki.setAttribute("aria-label", tayta(t("palkki"), { o: o, a: a }));
    if (selite) {
      selite.textContent = "";
      if (Math.abs(a - o) <= 10) {
        var vahva = document.createElement("strong");
        vahva.textContent = t("lahella") + " ";
        selite.appendChild(vahva);
      }
      selite.appendChild(document.createTextNode(tayta(t("tulos"), { a: a, o: o })));
    }
    tulos.hidden = false;
  }

  function paivitaKaikki(juuri) {
    var rivit = juuri.querySelectorAll(".arvaa__rivi");
    for (var i = 0; i < rivit.length; i++) paivitaRivi(rivit[i]);
  }

  function kaanna(juuri, kaannos) {
    var a = kaannos && kaannos.g8 && kaannos.g8.arvaa;
    tekstit = a || OLETUS;
    if (a) {
      var els = juuri.querySelectorAll("[data-arvaa]");
      for (var i = 0; i < els.length; i++) {
        var avain = els[i].getAttribute("data-arvaa");
        if (a[avain]) els[i].textContent = a[avain];
      }
    }
    paivitaKaikki(juuri);
  }

  function alusta() {
    var juuri = document.getElementById("arvaa-tarkista");
    if (!juuri) return;
    var nappi = juuri.querySelector(".arvaa__nappi");
    var huomio = juuri.querySelector(".arvaa__huomio");

    juuri.addEventListener("input", function (e) {
      var rivi = e.target && e.target.closest ? e.target.closest(".arvaa__rivi") : null;
      if (rivi) paivitaRivi(rivi);
    });
    if (nappi) {
      nappi.addEventListener("click", function () {
        tarkistettu = true;
        paivitaKaikki(juuri);
        if (huomio) huomio.hidden = false;
        nappi.hidden = true;
      });
    }
    document.addEventListener("digiopo:langchange", function (e) {
      kaanna(juuri, e.detail && e.detail.t);
    });
    kaanna(juuri, window.DIGIOPO_T);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", alusta);
  else alusta();
})();
