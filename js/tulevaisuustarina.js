/* Tulevaisuustarina — arpoo aloituksen ja kysymyssanan sekä pyörittää kierroskelloa.
   Käyttö: tehtavat/tulevaisuustarina.html */
(function () {
  "use strict";

  var ALOITUKSET = [
    "Robo lentää",
    "Koulubussi lentää",
    "Opettajamme on robotti",
    "Kaverini keksii uuden ammatin",
    "Kauppa myy aikakoneita",
    "Kissa johtaa yritystä",
    "Minä olen avaruusopas",
    "Kaikki pelit muuttuvat oikeaksi elämäksi",
    "Merilevän viljelijä voittaa palkinnon",
    "Robotti oppii pelaamaan jalkapalloa",
    "Koulun ruokala tarjoaa ruokaa Marsista",
    "Luokkamme rakentaa aikakoneen"
  ];
  var KYSYMYSSANAT = ["Mihin?", "Miksi?", "Kenen kanssa?", "Milloin?", "Missä?", "Millainen?", "Miten?", "Mitä sitten?", "Mitä he sanoivat?"];
  var KIERROS_SEK = 60;

  var viimeisin = {};
  function arvo(lista, avain) {
    if (!lista.length) return "";
    var v, yrityksia = 0;
    do {
      v = lista[Math.floor(Math.random() * lista.length)];
      yrityksia++;
    } while (v === viimeisin[avain] && lista.length > 1 && yrityksia < 20);
    viimeisin[avain] = v;
    return v;
  }

  function nayta(nayttoId, teksti) {
    var el = document.getElementById(nayttoId);
    if (!el) return;
    el.textContent = teksti;
    el.classList.remove("vaihtuu");
    void el.offsetWidth;
    el.classList.add("vaihtuu");
  }

  function kytke(nappiId, nayttoId, lista) {
    var nappi = document.getElementById(nappiId);
    if (!nappi) return;
    nappi.addEventListener("click", function () { nayta(nayttoId, arvo(lista, nayttoId)); });
  }

  // Kello
  var jaljella = KIERROS_SEK, ajastin = null;
  function piirraKello() {
    var el = document.getElementById("kello-aika");
    if (!el) return;
    var m = Math.floor(jaljella / 60), s = jaljella % 60;
    el.textContent = m + ":" + (s < 10 ? "0" : "") + s;
  }
  function pysayta() { if (ajastin) { clearInterval(ajastin); ajastin = null; } }
  function kaynnista() {
    pysayta();
    if (jaljella <= 0) jaljella = KIERROS_SEK;
    piirraKello();
    ajastin = setInterval(function () {
      jaljella--;
      piirraKello();
      if (jaljella <= 0) {
        pysayta();
        var ilm = document.getElementById("kello-ilmoitus");
        if (ilm) ilm.textContent = "Aika loppui. Taita paperi ja anna se seuraavalle!";
      }
    }, 1000);
    var ilm2 = document.getElementById("kello-ilmoitus");
    if (ilm2) ilm2.textContent = "";
  }
  function nollaa() {
    pysayta();
    jaljella = KIERROS_SEK;
    piirraKello();
    var ilm = document.getElementById("kello-ilmoitus");
    if (ilm) ilm.textContent = "";
  }

  document.addEventListener("DOMContentLoaded", function () {
    kytke("arvo-aloitus", "nayto-aloitus", ALOITUKSET);
    kytke("arvo-kysymys", "nayto-kysymys", KYSYMYSSANAT);
    var k = document.getElementById("kello-kaynnista"); if (k) k.addEventListener("click", kaynnista);
    var p = document.getElementById("kello-pysayta"); if (p) p.addEventListener("click", pysayta);
    var n = document.getElementById("kello-nollaa"); if (n) n.addEventListener("click", nollaa);
    var t = document.getElementById("tulosta-lappu"); if (t) t.addEventListener("click", function () { window.print(); });
    piirraKello();
  });
})();
