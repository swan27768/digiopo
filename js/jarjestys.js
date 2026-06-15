/* ============================================================
   JARJESTYS.JS — opettajan osiojärjestys
   Vaihe 1: raahaus + localStorage (opettajan oma selain)
   Vaihe 2: jako oppilaille (Supabase api/jarjestys.js)
     - Opettaja luo jakoryhmän (ryhmäkoodi + salainen avain) ja julkaisee
       järjestyksen. Oppilaat liittyvät ?ryhma=KOODI-linkillä ja näkevät
       opettajan järjestyksen kaikilla laitteilla.
   - Vain OSIOITA järjestetään, ei tehtäviä.
   - Muokkaustila vain ?ope=1.
   - Järjestys sovelletaan siirtämällä <section>-elementit DOM:ssa.
   Riippuvuus: SortableJS (ladataan vain muokkaustilassa).
   ============================================================ */
(function () {
  "use strict";

  var LUOKKA = (location.pathname.match(/(\d)luokka/) || [])[1];
  if (!LUOKKA) return;

  var main = document.getElementById("main-content");
  if (!main) return;

  var API = "/api/jarjestys";
  // localStorage-avaimet
  var LS_LOCAL  = "digiopo-jarjestys-" + LUOKKA;          // opettajan paikallinen työversio
  var LS_CACHE  = "digiopo-jarjestys-cache-" + LUOKKA;    // palvelimelta haettu (oppilas)
  var LS_RYHMA  = "digiopo-ryhma";                         // oppilaan liittymä (kaikki luokat)
  var LS_OPE_R  = "digiopo-ope-ryhma";                    // opettajan jakoryhmä
  var LS_OPE_A  = "digiopo-ope-avain";                    // opettajan avain (oma laite)

  // ---- apurit ----
  function osiot() {
    return Array.prototype.slice.call(main.querySelectorAll(":scope > section.aihe-osio"));
  }
  function jarjestysNyt() { return osiot().map(function (s) { return s.id; }); }
  var OLETUS = jarjestysNyt();

  function lue(avain) {
    try { var r = localStorage.getItem(avain); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
  }
  function kirjoita(avain, arvo) {
    try { localStorage.setItem(avain, JSON.stringify(arvo)); } catch (e) {}
  }
  function lueRaaka(avain) { try { return localStorage.getItem(avain); } catch (e) { return null; } }
  function kirjoitaRaaka(avain, arvo) { try { localStorage.setItem(avain, arvo); } catch (e) {} }

  // Yhdistä tallennettu järjestys nykyisiin osioihin (uudet osiot loppuun, poistetut pois)
  function yhdista(tallennettu) {
    if (!Array.isArray(tallennettu)) return null;
    var nyt = jarjestysNyt();
    var tulos = tallennettu.filter(function (id) { return nyt.indexOf(id) !== -1; });
    nyt.forEach(function (id) { if (tulos.indexOf(id) === -1) tulos.push(id); });
    return tulos;
  }

  // ---- navin (aihelista) ryhmittely ----
  var nav = document.querySelector(".aihelista");
  function navRyhmat() {
    var ryhmat = {}, nykyinen = null;
    if (!nav) return ryhmat;
    Array.prototype.forEach.call(nav.children, function (el) {
      if (el.tagName !== "A") { if (nykyinen) ryhmat[nykyinen].push(el); return; }
      var sub = /\bsub-link\b/.test(el.className);
      var href = el.getAttribute("href") || "";
      if (!sub && href.charAt(0) === "#") { nykyinen = href.slice(1); ryhmat[nykyinen] = [el]; }
      else if (nykyinen) { ryhmat[nykyinen].push(el); }
    });
    return ryhmat;
  }

  // ---- sovella järjestys DOM:iin ----
  function sovella(jarjestys) {
    if (!jarjestys) return;
    jarjestys.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec && sec.parentElement === main) main.appendChild(sec);
    });
    if (nav) {
      var ryhmat = navRyhmat();
      jarjestys.forEach(function (id) {
        (ryhmat[id] || []).forEach(function (el) { nav.appendChild(el); });
      });
    }
  }

  // ---- API-kutsut ----
  function haeServer(ryhma) {
    return fetch(API + "?ryhma=" + encodeURIComponent(ryhma) + "&luokka=" + LUOKKA)
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false }; });
  }
  function postServer(payload) {
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, virhe: "verkko" }; });
  }

  // ============================================================
  //  LATAUS: sovella paras tunnettu järjestys
  // ============================================================
  var params = new URLSearchParams(location.search);
  var ope = params.get("ope") === "1";

  // Oppilas: ?ryhma=KOODI tallentaa liittymän
  var ryhmaParam = (params.get("ryhma") || "").trim().toUpperCase();
  if (ryhmaParam) kirjoitaRaaka(LS_RYHMA, ryhmaParam);
  var liittymaRyhma = lueRaaka(LS_RYHMA);

  if (ope) {
    // Opettaja: käytä paikallista työversiota
    sovella(yhdista(lue(LS_LOCAL)));
  } else if (liittymaRyhma) {
    // Oppilas: näytä heti välimuisti, päivitä sitten palvelimelta
    sovella(yhdista(lue(LS_CACHE)) || yhdista(lue(LS_LOCAL)));
    haeServer(liittymaRyhma).then(function (v) {
      if (v && v.ok && v.jarjestys) {
        kirjoita(LS_CACHE, v.jarjestys);
        sovella(yhdista(v.jarjestys));
      }
    });
  } else {
    // Tavallinen (ei jakoa): paikallinen järjestys jos on
    sovella(yhdista(lue(LS_LOCAL)));
  }

  // ============================================================
  //  MUOKKAUSTILA (vain ?ope=1)
  // ============================================================
  if (!ope) return;

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("ope-muokkaustila");
    lisaaKahvat();
    naytaPaneeli();
    ladataSortable(kaynnistaSortable);
  });

  function lisaaKahvat() {
    osiot().forEach(function (sec) {
      if (sec.querySelector(":scope > .jarjestys-kahva")) return;
      var k = document.createElement("button");
      k.type = "button";
      k.className = "jarjestys-kahva";
      k.title = "Raahaa osiota järjestääksesi";
      k.setAttribute("aria-label", "Raahaa osiota");
      k.innerHTML = "⠿";
      sec.insertAdjacentElement("afterbegin", k);
    });
  }

  function ladataSortable(cb) {
    if (window.Sortable) return cb();
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.6/Sortable.min.js";
    s.onload = cb;
    s.onerror = function () { console.warn("SortableJS ei latautunut."); };
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
        kirjoita(LS_LOCAL, uusi);
        if (nav) sovella(uusi);
        merkitseJulkaisematon();
      },
    });
  }

  // ---- muokkaustilan paneeli (banneri + jako) ----
  var julkaisuTila;
  function naytaPaneeli() {
    if (document.querySelector(".jarjestys-banneri")) return;
    var b = document.createElement("div");
    b.className = "jarjestys-banneri";
    b.innerHTML =
      '<div class="jarjestys-rivi">' +
        '<span class="jarjestys-teksti">👩‍🏫 <strong>Muokkaustila</strong> — raahaa osioita kahvasta (⠿). ' +
        'Järjestys tallentuu tähän selaimeen automaattisesti.</span>' +
        '<button type="button" class="jarjestys-nappi jarjestys-palauta">Palauta oletus</button>' +
      '</div>' +
      '<div class="jarjestys-jako"></div>';
    document.body.appendChild(b);
    b.querySelector(".jarjestys-palauta").addEventListener("click", function () {
      try { localStorage.removeItem(LS_LOCAL); } catch (e) {}
      sovella(OLETUS);
    });
    paivitaJako();
  }

  function merkitseJulkaisematon() {
    if (julkaisuTila) { julkaisuTila.textContent = "Muutoksia ei vielä julkaistu oppilaille."; julkaisuTila.className = "jarjestys-tila odottaa"; }
  }

  function paivitaJako() {
    var box = document.querySelector(".jarjestys-jako");
    if (!box) return;
    var ryhma = lueRaaka(LS_OPE_R);
    var avain = lueRaaka(LS_OPE_A);

    if (!ryhma || !avain) {
      box.innerHTML =
        '<span class="jarjestys-teksti">Jaa järjestys oppilaille: luo jakoryhmä kerran.</span>' +
        '<button type="button" class="jarjestys-nappi jarjestys-luo">Luo jakoryhmä</button>' +
        '<span class="jarjestys-tila"></span>';
      box.querySelector(".jarjestys-luo").addEventListener("click", luoRyhma);
      julkaisuTila = box.querySelector(".jarjestys-tila");
      return;
    }

    var linkki = location.origin + location.pathname + "?ryhma=" + encodeURIComponent(ryhma);
    box.innerHTML =
      '<span class="jarjestys-teksti">Ryhmäkoodi: <strong>' + ryhma + '</strong> · ' +
      'Oppilaan linkki: <a href="' + linkki + '" class="jarjestys-linkki">' + linkki + '</a></span>' +
      '<button type="button" class="jarjestys-nappi jarjestys-julkaise">Tallenna oppilaille</button>' +
      '<span class="jarjestys-tila"></span>';
    box.querySelector(".jarjestys-julkaise").addEventListener("click", julkaise);
    julkaisuTila = box.querySelector(".jarjestys-tila");
  }

  function luoRyhma() {
    var avain = prompt("Valitse salainen opettaja-avain (vähintään 4 merkkiä).\n" +
      "Tarvitset sen järjestyksen tallentamiseen. Älä jaa sitä oppilaille.");
    if (avain == null) return;
    avain = avain.trim();
    if (avain.length < 4) { alert("Avain on liian lyhyt (vähintään 4 merkkiä)."); return; }
    if (julkaisuTila) { julkaisuTila.textContent = "Luodaan ryhmää…"; julkaisuTila.className = "jarjestys-tila"; }
    var koulukoodi = null;
    try {
      var lis = JSON.parse(localStorage.getItem("digiopo_lisenssi") || "null");
      if (lis) koulukoodi = lis.koodi || lis.koulu || null;
    } catch (e) {}
    postServer({ toiminto: "rekisteroi", avain: avain, koulukoodi: koulukoodi }).then(function (v) {
      if (v && v.ok && v.ryhmakoodi) {
        kirjoitaRaaka(LS_OPE_R, v.ryhmakoodi);
        kirjoitaRaaka(LS_OPE_A, avain);
        paivitaJako();
        julkaise(); // julkaise nykyinen järjestys heti
      } else {
        if (julkaisuTila) { julkaisuTila.textContent = "Ryhmän luonti epäonnistui."; julkaisuTila.className = "jarjestys-tila virhe"; }
      }
    });
  }

  function julkaise() {
    var ryhma = lueRaaka(LS_OPE_R), avain = lueRaaka(LS_OPE_A);
    if (!ryhma || !avain) return;
    if (julkaisuTila) { julkaisuTila.textContent = "Tallennetaan…"; julkaisuTila.className = "jarjestys-tila"; }
    postServer({ toiminto: "tallenna", ryhma: ryhma, avain: avain, luokka: LUOKKA, jarjestys: jarjestysNyt() })
      .then(function (v) {
        if (v && v.ok) {
          if (julkaisuTila) { julkaisuTila.textContent = "✓ Julkaistu oppilaille."; julkaisuTila.className = "jarjestys-tila ok"; }
        } else if (v && v.virhe === "avain_ei_tasmaa") {
          if (julkaisuTila) { julkaisuTila.textContent = "Avain ei täsmää tähän ryhmään."; julkaisuTila.className = "jarjestys-tila virhe"; }
        } else {
          if (julkaisuTila) { julkaisuTila.textContent = "Tallennus epäonnistui."; julkaisuTila.className = "jarjestys-tila virhe"; }
        }
      });
  }
})();
