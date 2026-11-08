/* Unelmatoiveiden kone ja Vinkki-linkki: arpoo ryhmälle toiveen, jos luokan lappuja ei ole tarpeeksi (7. lk, Unelmatoimisto). */
(function () {
  "use strict";
  var TOIVEET = [
    "Haluan sängyn tai tuolin, joka herättää minut aamulla helposti.",
    "Haluan repun, joka tuntuu kevyeltä, vaikka siinä on kaikki koulutavarat.",
    "Haluan laukun, joka muistuttaa, jos jotain jäi kotiin.",
    "Haluan eväsrasian, jossa ruoka pysyy lämpimänä tai kylmänä.",
    "Haluan takin, joka lämmittää pakkasella ja viilentää kuumalla.",
    "Haluan lampun tai laitteen, joka auttaa keskittymään läksyihin.",
    "Haluan kaapin tai hyllyn, joka siivoaa huoneeni melkein itse.",
    "Haluan tavan löytää avaimet, kuulokkeet ja kengät heti.",
    "Haluan kerhon, jossa kaikki rakentavat yhdessä robotteja.",
    "Haluan kerhon, jossa tehdään omia pelejä ja pelataan niitä.",
    "Haluan kerhon, jossa kokataan välipaloja ja syödään ne yhdessä.",
    "Haluan kerhon, jossa kuvataan ja leikataan lyhytelokuvia.",
    "Haluan kerhon, jossa korjataan rikkinäisiä pyöriä ja laitteita.",
    "Haluan sovelluksen, joka muistuttaa kaikista menoistani ja tehtävistäni.",
    "Haluan keksiä uuden pelin, jota voi pelata välitunnilla sateellakin.",
    "Haluan järjestää luokalle yllätyspäivän, jota kaikki muistavat.",
    "Haluan tehdä koulun pihalle penkin tai nurkkauksen, jossa on mukava istua.",
    "Haluan tehdä kuvan tai kartan, joka auttaa uutta oppilasta löytämään koulussa perille.",
    "Haluan keksiä tavan, jolla lemmikkini saa ruokaa, vaikka olen koulussa.",
    "Haluan keksiä tavan, jolla kaverini pääsevät mukaan peliin, vaikka heillä ei ole omaa välinettä.",
    "Haluan järjestää koululle tempauksen, joka auttaa jotakuta.",
    "Haluan tehdä videon, joka opettaa kavereille jonkin kivan taidon.",
    "Haluan rentoutumispaikan, jossa voi levätä ennen koetta tai esitelmää.",
    "Haluan keksiä tavan, jolla koulumatka tuntuu turvalliselta myös pimeällä."
  ];
  // Yhteinen toivelista: myös tehtavat/unelmatoimisto.js käyttää tätä.
  window.UNELMATOIVEET = TOIVEET;

  var kaytetyt = [];
  function arvo() {
    if (kaytetyt.length >= TOIVEET.length) kaytetyt = [];
    var v;
    do { v = TOIVEET[Math.floor(Math.random() * TOIVEET.length)]; } while (kaytetyt.indexOf(v) !== -1);
    kaytetyt.push(v);
    return v;
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
