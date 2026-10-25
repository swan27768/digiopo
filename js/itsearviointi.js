/* ============================================================
   ITSEARVIOINTI — avaaja luokkasivuille (7./8./9. lk)
   Osio #itsearviointi ja sen nappi + iframe-säiliö ovat sivun HTML:ssä
   (opettaja voi piilottaa/lukita osion kuten muut osiot). Säiliön TÄYTYY
   olla HTML:ssä jo latauksessa: tehtava-ikkuna.js etsii piilotetut
   iframe-säiliöt vain kerran, DOMContentLoaded-hetkellä.
   Tämä skripti kytkee napit ja avaa lomakkeen iframeen
   (tehtavat/itsearviointi.html).
   ============================================================ */
(function () {
  "use strict";
  var LUOKKA = (location.pathname.match(/(\d)luokka/) || [])[1];
  var avaaNappi = document.getElementById("itsearviointi-avaa");
  var suljeNappi = document.getElementById("itsearviointi-sulje");
  var c = document.getElementById("itsearviointiContainer");
  var f = document.getElementById("itsearviointiIframe");
  if (!LUOKKA || !avaaNappi || !suljeNappi || !c || !f) return;

  var T = {
    fi: { nappi: "Avaa itsearviointi", sulje: "✕ Sulje tehtävä", otsikko: "Itsearviointi", ohje: "Palauta itsearviointilomake opolle." },
    sv: { nappi: "Öppna självbedömningen", sulje: "✕ Stäng uppgiften", otsikko: "Självbedömning", ohje: "Lämna in självbedömningen till studiehandledaren." },
    en: { nappi: "Open self-assessment", sulje: "✕ Close task", otsikko: "Self-assessment", ohje: "Return the self-assessment form to your guidance counsellor." }
  };
  function kieli() {
    var l = (document.documentElement.getAttribute("lang") || "fi").toLowerCase().slice(0, 2);
    return T[l] ? l : "fi";
  }
  function teksti() {
    var t = T[kieli()];
    avaaNappi.querySelector("span").textContent = t.nappi;
    suljeNappi.textContent = t.sulje;
    f.title = t.otsikko;
    var o = document.querySelector(".itsearv-ohje-teksti");
    if (o) o.textContent = t.ohje;
  }

  function avaa() {
    f.src = "../tehtavat/itsearviointi.html?luokka=" + LUOKKA + "&kieli=" + kieli();
    c.style.display = "block";
    avaaNappi.setAttribute("aria-expanded", "true");
    setTimeout(function () { c.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }
  function sulje() {
    f.src = "about:blank";
    c.style.display = "none";
    avaaNappi.setAttribute("aria-expanded", "false");
    avaaNappi.focus();
  }

  avaaNappi.addEventListener("click", avaa);
  suljeNappi.addEventListener("click", sulje);
  teksti();
  new MutationObserver(teksti).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
