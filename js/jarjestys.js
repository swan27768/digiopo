/* ============================================================
   JARJESTYS.JS — opettajan osiojärjestys
   - Vain OSIOITA järjestetään, ei tehtäviä.
   - Muokkaustila avautuu "Opettaja"-linkistä PIN-portin kautta (Taso 2):
     PIN = opettaja-avain, joka vahvistetaan palvelimelta.
       · 1. kerta: PIN luo jakoryhmän (yksi ryhmäkoodi).
       · tunnettu laite: pelkkä PIN.
       · uusi laite: ryhmäkoodi + PIN (kuten Classroomin luokkakoodi).
   - Oppilas liittyy ?ryhma=KOODI-linkillä ja näkee opettajan järjestyksen.
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
  var LS_LOCAL = "digiopo-jarjestys-" + LUOKKA;       // opettajan paikallinen työversio
  var LS_CACHE = "digiopo-jarjestys-cache-" + LUOKKA; // palvelimelta haettu (oppilas)
  var LS_RYHMA = "digiopo-ryhma";                     // oppilaan liittymä
  var LS_OPE_R = "digiopo-ope-ryhma";                 // opettajan jakoryhmä (laite)
  var LS_OPE_A = "digiopo-ope-avain";                 // opettajan avain (laite)

  // ---- apurit ----
  function osiot() {
    return Array.prototype.slice.call(main.querySelectorAll(":scope > section.aihe-osio"));
  }
  function jarjestysNyt() { return osiot().map(function (s) { return s.id; }); }
  var OLETUS = jarjestysNyt();

  function lue(a) { try { var r = localStorage.getItem(a); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function kirjoita(a, v) { try { localStorage.setItem(a, JSON.stringify(v)); } catch (e) {} }
  function lueRaaka(a) { try { return localStorage.getItem(a); } catch (e) { return null; } }
  function kirjoitaRaaka(a, v) { try { localStorage.setItem(a, v); } catch (e) {} }

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

  function sovella(jarjestys) {
    if (!jarjestys) return;
    jarjestys.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec && sec.parentElement === main) main.appendChild(sec);
    });
    if (nav) {
      var ryhmat = navRyhmat();
      jarjestys.forEach(function (id) { (ryhmat[id] || []).forEach(function (el) { nav.appendChild(el); }); });
    }
  }

  // ---- API ----
  function haeServer(ryhma) {
    return fetch(API + "?ryhma=" + encodeURIComponent(ryhma) + "&luokka=" + LUOKKA)
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false }; });
  }
  function postServer(payload) {
    return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, virhe: "verkko" }; });
  }

  // ============================================================
  //  LATAUS: sovella paras tunnettu järjestys
  // ============================================================
  var params = new URLSearchParams(location.search);
  var avaaPortti = params.get("ope") === "1"; // ?ope=1 avaa PIN-portin
  var ryhmaParam = (params.get("ryhma") || "").trim().toUpperCase();
  if (ryhmaParam) kirjoitaRaaka(LS_RYHMA, ryhmaParam);

  var opeRyhma = lueRaaka(LS_OPE_R);          // tämä on opettajan laite, jos asetettu
  var liittymaRyhma = lueRaaka(LS_RYHMA);

  if (opeRyhma) {
    // Opettajan laite: näytä oma työversio
    sovella(yhdista(lue(LS_LOCAL)));
  } else if (liittymaRyhma) {
    // Oppilas: välimuisti heti, sitten palvelimelta
    sovella(yhdista(lue(LS_CACHE)) || yhdista(lue(LS_LOCAL)));
    haeServer(liittymaRyhma).then(function (v) {
      if (v && v.ok && v.jarjestys) { kirjoita(LS_CACHE, v.jarjestys); sovella(yhdista(v.jarjestys)); }
    });
  } else {
    sovella(yhdista(lue(LS_LOCAL)));
  }

  // ============================================================
  //  OPETTAJA-LINKKI + PIN-PORTTI + MUOKKAUSTILA
  // ============================================================
  var muokkausPaalla = false;
  var julkaisuTila;

  document.addEventListener("DOMContentLoaded", function () {
    lisaaOpeLinkki();
    if (avaaPortti) avaaPinPortti();
  });

  function lisaaOpeLinkki() {
    if (document.querySelector(".jarjestys-opelinkki")) return;
    var a = document.createElement("button");
    a.type = "button";
    a.className = "jarjestys-opelinkki";
    a.textContent = "OPO";
    a.title = "OPO – muokkaustila";
    a.addEventListener("click", avaaPinPortti);
    document.body.appendChild(a);
  }

  // ---------- PIN-portti (modaali) ----------
  function avaaPinPortti() {
    if (muokkausPaalla) return;
    if (document.querySelector(".jarjestys-portti")) return;
    var tunnettu = lueRaaka(LS_OPE_R); // ryhmäkoodi tallessa tällä laitteella?

    var overlay = document.createElement("div");
    overlay.className = "jarjestys-portti";
    overlay.innerHTML = porttiHTML(tunnettu);
    document.body.appendChild(overlay);

    var sulje = function () { overlay.remove(); };
    overlay.addEventListener("click", function (e) { if (e.target === overlay) sulje(); });
    overlay.querySelector(".portti-peruuta").addEventListener("click", sulje);

    var viesti = overlay.querySelector(".portti-viesti");
    function nayta(t, lk) { viesti.textContent = t; viesti.className = "portti-viesti" + (lk ? " " + lk : ""); }

    // Tilanvaihto uudelle/tunnetulle laitteelle
    var modeUusi = overlay.querySelector('[data-mode="uusi"]');
    var modeLiity = overlay.querySelector('[data-mode="liity"]');
    var lohkoUusi = overlay.querySelector(".portti-uusi");
    var lohkoLiity = overlay.querySelector(".portti-liity");
    if (modeUusi && modeLiity) {
      modeUusi.addEventListener("click", function () {
        modeUusi.classList.add("aktiivinen"); modeLiity.classList.remove("aktiivinen");
        lohkoUusi.hidden = false; lohkoLiity.hidden = true; nayta("");
      });
      modeLiity.addEventListener("click", function () {
        modeLiity.classList.add("aktiivinen"); modeUusi.classList.remove("aktiivinen");
        lohkoLiity.hidden = false; lohkoUusi.hidden = true; nayta("");
      });
    }

    overlay.querySelector(".portti-laheta").addEventListener("click", function () {
      var aktiiviUusi = lohkoUusi && !lohkoUusi.hidden;

      if (tunnettu) {
        var pin = overlay.querySelector(".portti-pin").value.trim();
        if (pin.length < 4) return nayta("Anna PIN (vähintään 4 merkkiä).", "virhe");
        nayta("Tarkistetaan…");
        postServer({ toiminto: "tarkista", ryhma: tunnettu, avain: pin }).then(function (v) {
          if (v && v.ok) { kirjoitaRaaka(LS_OPE_A, pin); sulje(); kaynnistaMuokkaus(); }
          else nayta(v && v.virhe === "avain_ei_tasmaa" ? "Väärä PIN." : "Tarkistus epäonnistui.", "virhe");
        });
        return;
      }

      if (aktiiviUusi) {
        var pinU = overlay.querySelector(".portti-pin-uusi").value.trim();
        if (pinU.length < 4) return nayta("Valitse PIN (vähintään 4 merkkiä).", "virhe");
        nayta("Luodaan ryhmää…");
        var koulukoodi = null;
        try { var lis = JSON.parse(localStorage.getItem("digiopo_lisenssi") || "null"); if (lis) koulukoodi = lis.koodi || lis.koulu || null; } catch (e) {}
        postServer({ toiminto: "rekisteroi", avain: pinU, koulukoodi: koulukoodi }).then(function (v) {
          if (v && v.ok && v.ryhmakoodi) {
            kirjoitaRaaka(LS_OPE_R, v.ryhmakoodi); kirjoitaRaaka(LS_OPE_A, pinU);
            sulje(); kaynnistaMuokkaus(); julkaise();
          } else nayta("Ryhmän luonti epäonnistui.", "virhe");
        });
      } else {
        var koodi = overlay.querySelector(".portti-koodi").value.trim().toUpperCase();
        var pinL = overlay.querySelector(".portti-pin-liity").value.trim();
        if (!/^[A-Z0-9-]{4,16}$/.test(koodi)) return nayta("Tarkista ryhmäkoodi.", "virhe");
        if (pinL.length < 4) return nayta("Anna PIN.", "virhe");
        nayta("Tarkistetaan…");
        postServer({ toiminto: "tarkista", ryhma: koodi, avain: pinL }).then(function (v) {
          if (v && v.ok) { kirjoitaRaaka(LS_OPE_R, koodi); kirjoitaRaaka(LS_OPE_A, pinL); sulje(); kaynnistaMuokkaus(); }
          else nayta(v && v.virhe === "avain_ei_tasmaa" ? "Väärä koodi tai PIN." : "Tarkistus epäonnistui.", "virhe");
        });
      }
    });

    var eka = overlay.querySelector("input");
    if (eka) eka.focus();
  }

  function porttiHTML(tunnettu) {
    if (tunnettu) {
      return '<div class="portti-laatikko">' +
        '<h2>Opettajan muokkaustila</h2>' +
        '<p>Ryhmä <strong>' + tunnettu + '</strong>. Syötä PIN avataksesi muokkaustilan.</p>' +
        '<input class="portti-pin" type="password" inputmode="numeric" placeholder="PIN" autocomplete="off">' +
        '<p class="portti-viesti"></p>' +
        '<div class="portti-napit"><button type="button" class="portti-peruuta">Peruuta</button>' +
        '<button type="button" class="jarjestys-nappi portti-laheta">Avaa</button></div></div>';
    }
    return '<div class="portti-laatikko">' +
      '<h2>Opettajan muokkaustila</h2>' +
      '<div class="portti-moodit">' +
        '<button type="button" class="portti-moodi aktiivinen" data-mode="uusi">Luo uusi ryhmä</button>' +
        '<button type="button" class="portti-moodi" data-mode="liity">Minulla on jo ryhmä</button>' +
      '</div>' +
      '<div class="portti-uusi">' +
        '<p>Valitse salainen PIN. Se luo jakoryhmän ja toimii jatkossa muokkaustilan avaimena. Älä jaa sitä oppilaille.</p>' +
        '<input class="portti-pin-uusi" type="password" inputmode="numeric" placeholder="Valitse PIN (väh. 4 merkkiä)" autocomplete="off">' +
      '</div>' +
      '<div class="portti-liity" hidden>' +
        '<p>Toisella laitteella jo luotu ryhmä? Anna ryhmäkoodi ja PIN.</p>' +
        '<input class="portti-koodi" type="text" placeholder="Ryhmäkoodi (esim. K3M-9PQ2)" autocomplete="off">' +
        '<input class="portti-pin-liity" type="password" inputmode="numeric" placeholder="PIN" autocomplete="off">' +
      '</div>' +
      '<p class="portti-viesti"></p>' +
      '<div class="portti-napit"><button type="button" class="portti-peruuta">Peruuta</button>' +
      '<button type="button" class="jarjestys-nappi portti-laheta">Jatka</button></div></div>';
  }

  // ---------- Muokkaustila ----------
  function kaynnistaMuokkaus() {
    if (muokkausPaalla) return;
    muokkausPaalla = true;
    document.body.classList.add("ope-muokkaustila");
    lisaaKahvat();
    naytaPaneeli();
    ladataSortable(kaynnistaSortable);
  }
  function lopetaMuokkaus() {
    muokkausPaalla = false;
    document.body.classList.remove("ope-muokkaustila");
    var b = document.querySelector(".jarjestys-banneri"); if (b) b.remove();
    Array.prototype.forEach.call(document.querySelectorAll(".jarjestys-kahva"), function (k) { k.remove(); });
  }

  function lisaaKahvat() {
    osiot().forEach(function (sec) {
      if (sec.querySelector(":scope > .jarjestys-kahva")) return;
      var k = document.createElement("button");
      k.type = "button"; k.className = "jarjestys-kahva";
      k.title = "Raahaa osiota järjestääksesi"; k.setAttribute("aria-label", "Raahaa osiota");
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
      draggable: "section.aihe-osio", handle: ".jarjestys-kahva",
      animation: 150, ghostClass: "jarjestys-haamu",
      onEnd: function () {
        var uusi = jarjestysNyt();
        kirjoita(LS_LOCAL, uusi);
        if (nav) sovella(uusi);
        if (julkaisuTila) { julkaisuTila.textContent = "Muutoksia ei vielä julkaistu oppilaille."; julkaisuTila.className = "jarjestys-tila odottaa"; }
      },
    });
  }

  function naytaPaneeli() {
    if (document.querySelector(".jarjestys-banneri")) return;
    var ryhma = lueRaaka(LS_OPE_R);
    var linkki = location.origin + location.pathname + "?ryhma=" + encodeURIComponent(ryhma || "");
    var b = document.createElement("div");
    b.className = "jarjestys-banneri";
    b.innerHTML =
      '<div class="jarjestys-rivi">' +
        '<span class="jarjestys-teksti">👩‍🏫 <strong>Muokkaustila</strong> — raahaa osioita kahvasta (⠿).</span>' +
        '<button type="button" class="jarjestys-nappi jarjestys-palauta">Palauta oletus</button>' +
        '<button type="button" class="jarjestys-nappi jarjestys-sulje">Sulje</button>' +
      '</div>' +
      '<div class="jarjestys-jako">' +
        '<span class="jarjestys-teksti">Oppilaiden ryhmäkoodi: <strong>' + (ryhma || "—") + '</strong> · ' +
        'linkki: <a class="jarjestys-linkki" href="' + linkki + '">' + linkki + '</a></span>' +
        '<button type="button" class="jarjestys-nappi jarjestys-julkaise">Tallenna oppilaille</button>' +
        '<span class="jarjestys-tila"></span>' +
      '</div>';
    document.body.appendChild(b);
    b.querySelector(".jarjestys-sulje").addEventListener("click", lopetaMuokkaus);
    b.querySelector(".jarjestys-palauta").addEventListener("click", function () {
      try { localStorage.removeItem(LS_LOCAL); } catch (e) {}
      sovella(OLETUS);
    });
    b.querySelector(".jarjestys-julkaise").addEventListener("click", julkaise);
    julkaisuTila = b.querySelector(".jarjestys-tila");
  }

  function julkaise() {
    var ryhma = lueRaaka(LS_OPE_R), avain = lueRaaka(LS_OPE_A);
    if (!ryhma || !avain) return;
    if (julkaisuTila) { julkaisuTila.textContent = "Tallennetaan…"; julkaisuTila.className = "jarjestys-tila"; }
    postServer({ toiminto: "tallenna", ryhma: ryhma, avain: avain, luokka: LUOKKA, jarjestys: jarjestysNyt() })
      .then(function (v) {
        if (!julkaisuTila) return;
        if (v && v.ok) { julkaisuTila.textContent = "✓ Julkaistu oppilaille."; julkaisuTila.className = "jarjestys-tila ok"; }
        else if (v && v.virhe === "avain_ei_tasmaa") { julkaisuTila.textContent = "Avain ei täsmää."; julkaisuTila.className = "jarjestys-tila virhe"; }
        else { julkaisuTila.textContent = "Tallennus epäonnistui."; julkaisuTila.className = "jarjestys-tila virhe"; }
      });
  }
})();
