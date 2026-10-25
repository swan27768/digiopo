/* DigiOpo – tekijänoikeusmerkinnät.
 *  1) Sivun alalaitaan merkintä (näkyy ruudulla ja tulostuksessa).
 *  2) Jokaiseen tulostettavaan korttiin oma merkintä (KORTIT-taulukko).
 * Vuosi ja nimi muutetaan vain tästä tiedostosta.
 */
(function () {
  "use strict";

  var VUOSI = "2026";
  var TEKIJA = "DigiOpo Palvelut · Olga Lenskaja";
  var SIVU_TEKSTI = "© " + VUOSI + " " + TEKIJA + ". Kaikki oikeudet pidätetään. " +
    "Sisältöä ei saa kopioida tai levittää ilman kirjallista lupaa.";
  var KORTTI_TEKSTI = "© " + VUOSI + " DigiOpo · Olga Lenskaja";

  // Tulostettavat kortit: sivupolku -> CSS-valitsin korteille.
  var KORTIT = {
    "/tehtavat/aikataulu_tehtavakortit.html": ".card",
    "/tehtavat/lukeminen_tekstikortit.html": ".card",
    "/ohjeet/9lk_elamanpolku_kortit.html": ".kortti, .vihjekortti",
    "/ohjeet/malli/9lk_elamanpolku_kortit.html": ".kortti, .vihjekortti",
    "/tehtavat/murhamysteeri.html": ".clue-card, .form-card",
    "/tehtavat/motivaatiohuutokauppa.html": ".ongelmakortti",
    "/tehtavat/vahvuushuutokauppa.html": ".ryhmakortti",
    "/tehtavat/maailma_tarvitsee_sinua_opettaja.html": ".tuloskortti, .skenaariokortti",
    "/ohjeet/7lk_motivaatio_ope.html": "#tulostettavat .kortti",
    "/ohjeet/malli/7lk_motivaatio_ope.html": "#tulostettavat .kortti"
  };

  var polku = location.pathname;
  var korttiValitsin = KORTIT[polku] || null;

  function tyyli() {
    var s = document.createElement("style");
    s.id = "tko-tyyli";
    s.textContent =
      ".tko-sivu{display:block;clear:both;box-sizing:border-box;width:100%;max-width:1100px;margin:28px auto 0;padding:10px 16px 14px;" +
      "text-align:center;font:12px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#64748b;" +
      "border-top:1px solid #e2e8f0;break-inside:avoid;page-break-inside:avoid}" +
      ".tko-sivu--kiinni{position:fixed;left:0;right:0;bottom:0;z-index:2;margin:0;padding:3px 8px;max-width:none;" +
      "font-size:10px;background:rgba(255,255,255,.75);border-top:0;pointer-events:none}" +
      ".tko-kortti{display:block;clear:both;box-sizing:border-box;margin:6px 0 0;padding:0;text-align:center;" +
      "font:8pt/1.3 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#64748b;letter-spacing:.02em}" +
      "@media print{" +
      (korttiValitsin ? ".tko-sivu{display:none!important}" : "") +
      "body.print-kortit .tko-sivu,body.tulosta-kortit .tko-sivu{display:none!important}" +
      ".tko-sivu--kiinni{position:static;background:none}" +
      ".tko-sivu{color:#555;border-top:1px solid #bbb;margin-top:16px}" +
      ".tko-kortti{color:#555}}";
    document.head.appendChild(s);
  }

  function sivuMerkinta() {
    if (window.self !== window.top) return;                 // upotettu sivu: vanhempi näyttää merkinnän
    if (document.querySelector("[data-tko-oma], .tko-sivu")) return;
    var teksti = document.body ? (document.body.innerText || "") : "";
    if (teksti.indexOf("©") !== -1) return;           // sivulla on jo oma © -merkintä
    var p = document.createElement("p");
    p.className = "tko-sivu";
    p.textContent = SIVU_TEKSTI;
    document.body.appendChild(p);
    // Jos sivu on lukittu näkymän korkuiseksi eikä merkintä näy, kiinnitetään se alareunaan.
    var cs = getComputedStyle(document.body), ch = getComputedStyle(document.documentElement);
    var lukittu = cs.overflowY === "hidden" || ch.overflowY === "hidden";
    if (lukittu && p.getBoundingClientRect().top >= window.innerHeight) p.classList.add("tko-sivu--kiinni");
  }

  function korttiMerkinnat() {
    if (!korttiValitsin) return;
    var kortit = document.querySelectorAll(korttiValitsin);
    for (var i = 0; i < kortit.length; i++) {
      var k = kortit[i];
      if (k.querySelector(":scope > .tko-kortti")) continue;
      var m = document.createElement("span");
      m.className = "tko-kortti";
      m.textContent = KORTTI_TEKSTI;
      k.appendChild(m);
    }
  }

  function kaynnista() {
    tyyli();
    sivuMerkinta();   // ensin: tarkistaa, onko sivulla jo oma © -merkintä
    korttiMerkinnat();
    // Kortit voi piirtää myöhemmin (JS): tarkistetaan uudelleen hetken päästä.
    if (korttiValitsin) setTimeout(korttiMerkinnat, 800);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kaynnista);
  else kaynnista();
})();
