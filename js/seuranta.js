// DigiOpo – Käyttöseuranta
// Lähettää sivukäynnin /api/ping -päätteeseen.
//Ei tallenna henkilötietoja. GDPR-turvallinen.

(function () {
  "use strict";

  const AVAIN = "digiopo_ping_";
  const PAIVA = new Date().toISOString().slice(0, 10); // "2026-05-31"

  // Onko tämä sivu jo pingitetty tänään?
  function onJoPingitetty(sivu) {
    try {
      return localStorage.getItem(AVAIN + sivu) === PAIVA;
    } catch {
      return false;
    }
  }

  function merkitsePingitetyksi(sivu) {
    try {
      localStorage.setItem(AVAIN + sivu, PAIVA);
    } catch {}
  }

  // Muodosta sivun tunniste URL:sta
  function tunnistaSivu() {
    const polku = window.location.pathname.toLowerCase();

    if (polku.includes("vahvuusmatka"))       return "peli-vahvuusmatka";
    if (polku.includes("supervoimat"))         return "peli-supervoimat";
    if (polku.includes("ala-set"))             return "peli-ala-set";
    if (polku.includes("amissanasto"))         return "peli-amissanasto";
    if (polku.includes("lukiosanasto"))        return "peli-lukiosanasto";
    if (polku.includes("ajattelutavat"))       return "peli-ajattelutavat";
    if (polku.includes("koulutusalat"))        return "peli-koulutusalat";
    if (polku.includes("kadonnut_motivaatio") ||
        polku.includes("motivaatio"))          return "peli-kadonnut-motivaatio";
    if (polku.includes("duunimina"))           return "peli-duunimina";
    if (polku.includes("pakopeli"))            return "peli-oppimisen-pakopeli";
    if (polku.includes("tiedon-temppeli"))     return "peli-tiedon-temppeli";
    if (polku.includes("robo-tarina"))         return "peli-robo-tarina";
    if (polku.includes("7luokka"))             return "7luokka";
    if (polku.includes("8luokka"))             return "8luokka";
    if (polku.includes("9luokka"))             return "9luokka";
    if (polku.includes("vuosikello"))          return "sivu-vuosikello";
    if (polku.includes("duuniin-tet") ||
        polku.includes("tet_tehtava"))         return "sivu-tet";
    if (polku.includes("valinnat"))            return "sivu-valinnat";
    if (polku.includes("tulevaisuus"))         return "sivu-tulevaisuus";
    if (polku === "/" || polku.endsWith("index.html")) return "etusivu";

    return null;
  }

  function lahetaPing(sivu) {
    if (!sivu) return;
    if (onJoPingitetty(sivu)) return; // Ei pingata uudelleen samana päivänä

    fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sivu }),
      keepalive: true,
    }).then(function () {
      merkitsePingitetyksi(sivu);
    }).catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      lahetaPing(tunnistaSivu());
    });
  } else {
    lahetaPing(tunnistaSivu());
  }
})();
