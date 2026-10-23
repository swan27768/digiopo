/* ============================================================
   KORTTIMERKIT JA PALETTI — js/korttimerkit.js
   1) Pieni tekstimerkki korttien yläreunaan: Lue / Tee / Toimi / Pelaa
   2) Hero-korttien gradientit luokka-asteen väriperheeseen
      (toiminnalliset kortit keltaiseen/ruskeaan). Kuvat säilyvät.
   Tyyppi tulee data-korttityyppi-merkinnästä (osio-rakenne.js),
   .theory-card-, .tasks-section- ja .mission-card-luokista.
   ============================================================ */
(function () {
  "use strict";

  var PALETIT = {
    "7": [[76, 29, 149], [109, 40, 217], [124, 58, 237]],
    "8": [[157, 23, 77], [190, 24, 93], [219, 39, 119]],
    "9": [[19, 78, 74], [15, 118, 110], [13, 148, 136]]
  };
  var TOIMINTA = [[120, 53, 15], [146, 64, 14], [180, 83, 9]];

  var TEKSTIT = {
    fi: { teoria: "Lue", tehtava: "Tee", toiminta: "Toimi", peli: "Pelaa" },
    sv: { teoria: "Läs", tehtava: "Gör", toiminta: "Agera", peli: "Spela" },
    en: { teoria: "Read", tehtava: "Do", toiminta: "Act", peli: "Play" }
  };

  function kieli() {
    var l = (document.documentElement.lang || "fi").slice(0, 2).toLowerCase();
    return TEKSTIT[l] || TEKSTIT.en;
  }

  /* ---- 2: paletti ---------------------------------------- */
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0;
    if (mx !== mn) s = l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn);
    return { s: s, l: l };
  }
  function sijoita(paletti, rgb) {
    var c = hsl(rgb[0], rgb[1], rgb[2]);
    if (c.s < 0.2) return null; // musta/valkoinen/harmaa jää ennalleen
    return c.l < 0.25 ? paletti[0] : c.l < 0.42 ? paletti[1] : paletti[2];
  }
  function varita(kerros, paletti) {
    var bg = kerros.style.backgroundImage;
    if (!bg || bg.indexOf("linear-gradient") === -1 || kerros.dataset.kmVaritetty) return;
    var uusi = bg.replace(/linear-gradient\((?:[^()]|\([^()]*\))*\)/g, function (grad) {
      return grad.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g, function (m, r, g, b, a) {
        var p = sijoita(paletti, [+r, +g, +b]);
        if (!p) return m;
        return a === undefined ? "rgb(" + p.join(",") + ")" : "rgba(" + p.join(",") + "," + a + ")";
      });
    });
    if (uusi !== bg) kerros.style.backgroundImage = uusi;
    kerros.dataset.kmVaritetty = "1";
  }
  function varitaKortit() {
    var luokka = document.body.getAttribute("data-luokka");
    var grade = PALETIT[luokka];
    if (!grade) return;
    document.querySelectorAll("[data-korttityyppi]").forEach(function (kortti) {
      if (kortti.classList.contains("ak-hero") || kortti.classList.contains("elamapeli-hero")) return;
      var p = kortti.getAttribute("data-korttityyppi") === "toiminta" ? TOIMINTA : grade;
      Array.prototype.forEach.call(kortti.children, function (k) {
        if (k.getAttribute("aria-hidden") === "true") varita(k, p);
      });
    });
  }

  /* ---- 1: tekstimerkit ----------------------------------- */
  function tyyppi(el) {
    if (el.hasAttribute("data-korttityyppi")) return el.getAttribute("data-korttityyppi");
    if (el.classList.contains("mission-card")) return "toiminta";
    if (el.classList.contains("theory-card")) return "teoria";
    if (el.classList.contains("tasks-section")) return "tehtava";
    return null;
  }
  function merkitse() {
    var t = kieli();
    var kohteet = document.querySelectorAll(
      "[data-korttityyppi], .mission-card, .aihe-osio > .theory-card, .aihe-osio > .tasks-section"
    );
    Array.prototype.forEach.call(kohteet, function (el) {
      var ty = tyyppi(el);
      if (!ty) return;
      // tehtäväsäiliö: merkki vain kun siinä on sisältöä
      if (el.classList.contains("tasks-section") && !el.querySelector(".task-card, iframe, button")) return;
      var m = el.querySelector(":scope > .kortti-merkki");
      if (!m) {
        m = document.createElement("span");
        m.className = "kortti-merkki";
        m.setAttribute("aria-hidden", "true");
        el.insertBefore(m, el.firstChild);
      }
      m.className = "kortti-merkki kortti-merkki--" + ty;
      m.textContent = t[ty] || "";
    });
  }

  var ajastettu = false;
  function ajasta() {
    if (ajastettu) return;
    ajastettu = true;
    requestAnimationFrame(function () {
      ajastettu = false;
      merkitse();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    varitaKortit();
    merkitse();
    var main = document.getElementById("main-content");
    if (main && window.MutationObserver) {
      new MutationObserver(function (muutokset) {
        for (var i = 0; i < muutokset.length; i++) {
          var lisatyt = muutokset[i].addedNodes;
          for (var j = 0; j < lisatyt.length; j++) {
            var n = lisatyt[j];
            if (n.nodeType === 1 && !(n.classList && n.classList.contains("kortti-merkki"))) return ajasta();
          }
        }
      }).observe(main, { childList: true, subtree: true });
    }
    new MutationObserver(ajasta).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  });
  document.addEventListener("digiopo:langchange", ajasta);
})();
