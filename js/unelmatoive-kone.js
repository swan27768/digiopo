/* Unelmatoiveiden kone: arpoo ryhmälle toiveen, jos luokan lappuja ei ole tarpeeksi (7. lk, Unelmatoimisto). */
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
      if (window.i18n && typeof window.i18n.t === "function") {
        var x = window.i18n.t(avain);
        if (x && x !== avain) return x;
      }
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
      if (kone) kone.classList.add("kaynnissa");
      ajastin = setTimeout(function () { ajastin = null; nayta(); }, 900);
    });
  });
})();
