/* DigiOpo – "Tiedot tarkistettu" -merkintä tiedollisille osioille.
 * Tiedot ovat tiedostossa js/tarkistettu.json (avain = sivupolku#osion-id tai pelkkä sivupolku).
 * Merkintä näytetään vain, jos pvm on asetettu. Jos tarkistuksesta on kulunut yli yhden
 * elokuun (vuosittainen tarkistus), merkintä kehottaa tarkistamaan tiedot lähteestä. */
(function () {
  "use strict";

  function viimeisinElokuu(nyt) {
    var v = nyt.getMonth() >= 7 ? nyt.getFullYear() : nyt.getFullYear() - 1; // elokuu = kuukausi 7
    return new Date(v, 7, 1);
  }

  function muotoile(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? parseInt(m[3], 10) + "." + parseInt(m[2], 10) + "." + m[1] : null;
  }

  function lisaaTyyli() {
    if (document.getElementById("tarkistettu-tyyli")) return;
    var s = document.createElement("style");
    s.id = "tarkistettu-tyyli";
    s.textContent =
      ".tarkistettu{margin:18px 0 4px;padding-top:8px;border-top:1px dashed #cbd5e1;" +
      "font-size:.8rem;line-height:1.5;color:#64748b}" +
      ".tarkistettu a{color:inherit;text-decoration:underline}" +
      ".tarkistettu--vanha{color:#92400e}" +
      "@media print{.tarkistettu{color:#444}}";
    document.head.appendChild(s);
  }

  function luoMerkinta(tieto) {
    var pvm = muotoile(tieto.pvm || "");
    if (!pvm) return null;
    var vanha = new Date(tieto.pvm + "T00:00:00") < viimeisinElokuu(new Date());
    var p = document.createElement("p");
    p.className = "tarkistettu" + (vanha ? " tarkistettu--vanha" : "");
    p.appendChild(document.createTextNode(
      "Tiedot tarkistettu " + pvm + (vanha ? " – tarkista ajantasaisuus lähteestä" : "") + ". Lähteet: "));
    (tieto.lahteet || []).forEach(function (l, i) {
      if (i) p.appendChild(document.createTextNode(", "));
      var a = document.createElement("a");
      a.href = l[1];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = l[0];
      p.appendChild(a);
    });
    p.appendChild(document.createTextNode("."));
    return p;
  }

  function sijoita(avain, merkinta) {
    var osat = avain.split("#");
    var kohde = osat[1] ? document.getElementById(osat[1]) : (document.querySelector("footer") || document.body);
    if (kohde) kohde.appendChild(merkinta);
  }

  function aja(data) {
    var polku = location.pathname.replace(/\/index\.html$/, "");
    var osiot = (data && data.osiot) || {};
    lisaaTyyli();
    Object.keys(osiot).forEach(function (avain) {
      if (avain.split("#")[0] !== polku) return;
      var m = luoMerkinta(osiot[avain]);
      if (m) sijoita(avain, m);
    });
  }

  function kaynnista() {
    fetch("/js/tarkistettu.json", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(aja)
      .catch(function () { /* merkintä on lisätieto – sivun pitää toimia ilman sitä */ });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kaynnista);
  else kaynnista();
})();
