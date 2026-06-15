/* ============================================================
   JARJESTYS.JS — opettajan osiojärjestys (Vaihe 1: localStorage)
   - Vain OSIOITA voi järjestää, ei tehtäviä.
   - Muokkaustila aktivoituu vain osoitteella ?ope=1.
   - Järjestys tallentuu selaimen localStorageen luokkakohtaisesti.
   - Tallennettu järjestys sovelletaan jokaisella latauksella siirtämällä
     <section>-elementit DOM:ssa (jolloin maskotti, scroll-tunnistus ja
     sisällysluettelo toimivat automaattisesti oikein).
   Riippuvuus: SortableJS (ladataan vain muokkaustilassa).
   ============================================================ */
(function () {
  "use strict";

  // ---- Luokan tunnistus (7 / 8 / 9) ----
  var m = (location.pathname.match(/(\d)luokka/) || [])[1];
  if (!m) return;
  var STORAGE_KEY = "digiopo-jarjestys-" + m;

  var main = document.getElementById("main-content");
  if (!main) return;

  function osiot() {
    return Array.prototype.slice.call(
      main.querySelectorAll(":scope > section.aihe-osio")
    );
  }
  function jarjestysNyt() {
    return osiot().map(function (s) { return s.id; });
  }

  var OLETUS = jarjestysNyt(); // HTML:n alkuperäinen (authored) järjestys

  // ---- Navin (aihelista) ryhmittely: top-link + sitä seuraavat sub-linkit ----
  var nav = document.querySelector(".aihelista");
  function navRyhmat() {
    if (!nav) return {};
    var ryhmat = {}, nykyinen = null;
    Array.prototype.forEach.call(nav.children, function (el) {
      if (el.tagName !== "A") { if (nykyinen) ryhmat[nykyinen].push(el); return; }
      var sub = /\bsub-link\b/.test(el.className);
      var href = (el.getAttribute("href") || "");
      if (!sub && href.charAt(0) === "#") {
        nykyinen = href.slice(1);
        ryhmat[nykyinen] = [el];
      } else if (nykyinen) {
        ryhmat[nykyinen].push(el);
      }
    });
    return ryhmat;
  }

  // ---- Sovella annettu järjestys ----
  function sovella(jarjestys) {
    // 1) osiot
    jarjestys.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec && sec.parentElement === main) main.appendChild(sec);
    });
    // 2) navi vastaamaan (jos olemassa)
    if (nav) {
      var ryhmat = navRyhmat();
      jarjestys.forEach(function (id) {
        (ryhmat[id] || []).forEach(function (el) { nav.appendChild(el); });
      });
    }
  }

  function lataaTallennettu() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : null;
    } catch (e) { return null; }
  }

  function tallenna(jarjestys) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(jarjestys)); } catch (e) {}
  }

  // Yhdistä tallennettu + oletus niin, ettei uusia/poistettuja osioita kadoteta
  function yhdista(tallennettu) {
    var nykyiset = jarjestysNyt();
    var tulos = tallennettu.filter(function (id) { return nykyiset.indexOf(id) !== -1; });
    nykyiset.forEach(function (id) { if (tulos.indexOf(id) === -1) tulos.push(id); });
    return tulos;
  }

  // ---- Sovella tallennettu järjestys heti ----
  var tallennettu = lataaTallennettu();
  if (tallennettu) sovella(yhdista(tallennettu));

  // ---- Muokkaustila vain ?ope=1 ----
  var ope = new URLSearchParams(location.search).get("ope") === "1";
  if (!ope) return;

  document.addEventListener("DOMContentLoaded", function () {
    lisaaKahvat();
    naytaBanneri();
    ladataSortable(kaynnistaSortable);
  });

  function lisaaKahvat() {
    osiot().forEach(function (sec) {
      if (sec.querySelector(":scope > .jarjestys-kahva")) return;
      var kahva = document.createElement("button");
      kahva.type = "button";
      kahva.className = "jarjestys-kahva";
      kahva.setAttribute("aria-label", "Raahaa osiota");
      kahva.title = "Raahaa osiota järjestääksesi";
      kahva.innerHTML = "⠿";
      sec.insertAdjacentElement("afterbegin", kahva);
    });
    document.body.classList.add("ope-muokkaustila");
  }

  function naytaBanneri() {
    if (document.querySelector(".jarjestys-banneri")) return;
    var b = document.createElement("div");
    b.className = "jarjestys-banneri";
    b.innerHTML =
      '<span class="jarjestys-banneri-teksti">' +
      "👩‍🏫 <strong>Muokkaustila</strong> — raahaa osioita kahvasta (⠿) " +
      "haluamaasi järjestykseen. Järjestys tallentuu automaattisesti tähän selaimeen." +
      "</span>" +
      '<button type="button" class="jarjestys-palauta">Palauta oletusjärjestys</button>';
    document.body.appendChild(b);
    b.querySelector(".jarjestys-palauta").addEventListener("click", function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      sovella(OLETUS);
    });
  }

  function ladataSortable(cb) {
    if (window.Sortable) return cb();
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.6/Sortable.min.js";
    s.onload = cb;
    s.onerror = function () {
      console.warn("SortableJS ei latautunut — raahaus ei käytössä.");
    };
    document.head.appendChild(s);
  }

  function kaynnistaSortable() {
    if (!window.Sortable) return;
    window.Sortable.create(main, {
      draggable: "section.aihe-osio",
      handle: ".jarjestys-kahva",
      animation: 150,
      ghostClass: "jarjestys-haamu",
      onEnd: function () {
        var uusi = jarjestysNyt();
        tallenna(uusi);
        if (nav) sovella(uusi); // pidä navi synkassa
      }
    });
  }
})();
