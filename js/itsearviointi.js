/* ============================================================
   ITSEARVIOINTI — avaaja luokkasivuille (7./8./9. lk)
   Osio #itsearviointi on sivun HTML:ssä (opettaja voi piilottaa/lukita sen
   kuten muut osiot). Lomake ei ole sivulla suoraan: tämä skripti lisää
   osioon napin, joka avaa lomakkeen iframeen
   (tehtavat/itsearviointi.html). Ikkunointi ja sulkeminen:
   tehtava-ikkuna.js tunnistaa säiliön automaattisesti.
   ============================================================ */
(function () {
  "use strict";
  var LUOKKA = (location.pathname.match(/(\d)luokka/) || [])[1];
  var juuri = document.getElementById("itsearviointi-sisalto");
  if (!LUOKKA || !juuri) return;

  var T = {
    fi: { nappi: "Avaa itsearviointi", sulje: "Sulje tehtävä", otsikko: "Itsearviointi", ohje: "Kuusi lyhyttä kysymystä. Vastaus on nimetön." },
    sv: { nappi: "Öppna självbedömningen", sulje: "Stäng uppgiften", otsikko: "Självbedömning", ohje: "Sex korta frågor. Svaret är anonymt." },
    en: { nappi: "Open self-assessment", sulje: "Close task", otsikko: "Self-assessment", ohje: "Six short questions. Your answer is anonymous." }
  };
  function kieli() {
    var l = (document.documentElement.getAttribute("lang") || "fi").toLowerCase().slice(0, 2);
    return T[l] ? l : "fi";
  }

  var auki = false;
  function piirra() {
    var t = T[kieli()];
    var nappi = document.getElementById("itsearviointi-avaa");
    if (nappi) { nappi.querySelector("span").textContent = t.nappi; return; }
    juuri.innerHTML =
      '<p class="itsearv-ohje-teksti" style="margin:0 0 .8rem;color:#6b21a8">' + t.ohje + "</p>" +
      '<button type="button" id="itsearviointi-avaa" aria-expanded="false" aria-controls="itsearviointiContainer" ' +
      'style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;border:none;border-radius:12px;padding:14px 24px;font-size:1rem;font-weight:600;cursor:pointer;font-family:inherit">' +
      "<span>" + t.nappi + '</span><span aria-hidden="true">▶</span></button>' +
      '<div id="itsearviointiContainer" class="interactive-wrapper" style="display:none;margin-top:6px">' +
      '<div class="peli-sulje-rivi"><button type="button" class="peli-sulje-btn" id="itsearviointi-sulje">✕ ' + t.sulje + "</button></div>" +
      '<iframe id="itsearviointiIframe" title="' + t.otsikko + '" loading="lazy" ' +
      'style="width:100%;height:85vh;min-height:640px;border:none;border-radius:14px"></iframe></div>';
    document.getElementById("itsearviointi-avaa").addEventListener("click", avaa);
    document.getElementById("itsearviointi-sulje").addEventListener("click", sulje);
  }

  function avaa() {
    var c = document.getElementById("itsearviointiContainer");
    var f = document.getElementById("itsearviointiIframe");
    if (!c || !f) return;
    f.src = "../tehtavat/itsearviointi.html?luokka=" + LUOKKA + "&kieli=" + kieli();
    c.style.display = "block";
    auki = true;
    document.getElementById("itsearviointi-avaa").setAttribute("aria-expanded", "true");
    setTimeout(function () { c.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }
  function sulje() {
    var c = document.getElementById("itsearviointiContainer");
    var f = document.getElementById("itsearviointiIframe");
    if (!c) return;
    if (f) f.src = "about:blank";
    c.style.display = "none";
    auki = false;
    var n = document.getElementById("itsearviointi-avaa");
    if (n) { n.setAttribute("aria-expanded", "false"); n.focus(); }
  }

  piirra();
  new MutationObserver(piirra).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
