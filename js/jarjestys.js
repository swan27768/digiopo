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
  var LS_LOCK = "digiopo-lukitut-" + LUOKKA;          // opettajan lukot (työversio)
  var LS_LOCK_CACHE = "digiopo-lukitut-cache-" + LUOKKA; // oppilaan välimuisti

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

  // Kirjaa ryhmäkoodi paikalliseen "omat ryhmät" -listaan (ei PIN:iä). Sama
  // lista näkyy lukuvuoden aikataulun muokkaustilassa (aikataulu_ope.html).
  function listaanRyhma(koodi) {
    if (!koodi) return;
    try {
      var l = JSON.parse(localStorage.getItem("digiopo-ryhmalista") || "[]");
      if (!Array.isArray(l)) l = [];
      if (!l.some(function (r) { return r && r.koodi === koodi; })) {
        l.push({ koodi: koodi, nimi: "" });
        localStorage.setItem("digiopo-ryhmalista", JSON.stringify(l));
      }
    } catch (e) {}
  }
  function lueRyhmalista() {
    try { var l = JSON.parse(localStorage.getItem("digiopo-ryhmalista") || "[]"); return Array.isArray(l) ? l : []; }
    catch (e) { return []; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // "Omat ryhmät" -lista porttiin: opettaja voi valita heti minkä ryhmän avaa.
  function porttiListaHTML(aktiivinen) {
    var lista = lueRyhmalista();
    if (!lista.length) return "";
    var rivit = lista.map(function (r) {
      var on = r.koodi === aktiivinen ? " aktiivinen" : "";
      var nimi = r.nimi ? '<span class="portti-lista-nimi">' + esc(r.nimi) + '</span>' : '';
      return '<button type="button" class="portti-lista-rivi' + on + '" data-koodi="' + esc(r.koodi) + '">' +
        nimi + '<span class="portti-lista-koodi">' + esc(r.koodi) + '</span></button>';
    }).join("");
    return '<div class="portti-lista"><div class="portti-lista-otsikko">Omat ryhmät</div>' + rivit + '</div>';
  }

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

  // ---- lukot ----
  function lueLukot() { var a = lue(LS_LOCK); return Array.isArray(a) ? a : []; }
  function tallennaLukot(a) { kirjoita(LS_LOCK, a); }

  // Oppilasnäkymä: merkitse lukitut osiot (CSS piilottaa sisällön + pelit)
  function applyLukot(lukitut) {
    lukitut = Array.isArray(lukitut) ? lukitut : [];
    osiot().forEach(function (sec) {
      var on = lukitut.indexOf(sec.id) !== -1;
      var viesti = sec.querySelector(":scope > .osio-lukko");
      if (on) {
        sec.classList.add("osio-lukittu");
        if (!viesti) {
          var m = document.createElement("div");
          m.className = "osio-lukko";
          m.innerHTML = '<span class="osio-lukko-ikoni" aria-hidden="true">🔒</span> ' +
            'Opettaja avaa tämän osion myöhemmin.';
          var ots = sec.querySelector(":scope > .aihe-otsikko");
          if (ots) ots.insertAdjacentElement("afterend", m);
          else sec.insertAdjacentElement("afterbegin", m);
        }
      } else {
        sec.classList.remove("osio-lukittu");
        if (viesti) viesti.remove();
      }
    });
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
    applyLukot(lue(LS_LOCK_CACHE) || []);
    haeServer(liittymaRyhma).then(function (v) {
      if (v && v.ok) {
        if (v.jarjestys) { kirjoita(LS_CACHE, v.jarjestys); sovella(yhdista(v.jarjestys)); }
        var luk = v.lukitut || [];
        kirjoita(LS_LOCK_CACHE, luk);
        applyLukot(luk);
      }
    });
  } else {
    sovella(yhdista(lue(LS_LOCAL)));
  }

  // ============================================================
  //  OPETTAJA-LINKKI + PIN-PORTTI + MUOKKAUSTILA
  // ============================================================
  var muokkausPaalla = false;
  var julkaisuTila;
  var tiliMoodi = false; // true = muokkaus avattiin opettajatilillä (tallennus istunnolla, ei PIN:llä)

  document.addEventListener("DOMContentLoaded", function () {
    lisaaOpeLinkki();
    // Opettajan keskuksesta tullessa: ?tili_ryhma=KOODI avaa muokkaustilan suoraan
    // (ja ?aikataulu=1 myös aikataulu-modaalin), jos kirjautunut opettaja omistaa ryhmän.
    var tiliRyhmaParam = (params.get("tili_ryhma") || "").trim().toUpperCase();
    var avaaAikataulu = params.get("aikataulu") === "1";
    if (tiliRyhmaParam && /^[A-Z0-9-]{4,16}$/.test(tiliRyhmaParam)) {
      postServer({ toiminto: "omat_ryhmat" }).then(function (v) {
        if (v && v.ok && (v.ryhmat || []).some(function (r) { return r.ryhmakoodi === tiliRyhmaParam; })) {
          kirjoitaRaaka(LS_OPE_R, tiliRyhmaParam);
          tiliMoodi = true;
          kaynnistaMuokkaus();
          if (avaaAikataulu) avaaAikatauluModaali();
        } else if (avaaPortti) {
          avaaPinPortti();
        }
      });
      return;
    }
    if (avaaPortti) avaaPinPortti();
  });

  function lisaaOpeLinkki() {
    if (document.querySelector(".jarjestys-opelinkki")) return;
    var a = document.createElement("button");
    a.type = "button";
    a.className = "jarjestys-opelinkki";
    a.textContent = "Sivun hallinta";
    a.title = "Sivun hallinta (opon muokkaustila)";
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

    // "Vaihda ryhmä / luo uusi": unohtaa tältä laitteelta muistetun ryhmän ja
    // avaa portin uudelleen luonti-/liittymisnäkymässä (ryhmä ja sen järjestys
    // säilyvät palvelimella — tämä ei poista mitään serveriltä).
    var vaihda = overlay.querySelector(".portti-vaihda");
    if (vaihda) {
      vaihda.addEventListener("click", function (e) {
        e.preventDefault();
        try { localStorage.removeItem(LS_OPE_R); localStorage.removeItem(LS_OPE_A); } catch (e2) {}
        sulje();
        avaaPinPortti();
      });
    }

    // "Omat ryhmät": klikkaus valitsee ryhmän ja avaa portin uudelleen PIN-kysymykseen.
    Array.prototype.forEach.call(overlay.querySelectorAll(".portti-lista-rivi"), function (btn) {
      btn.addEventListener("click", function () {
        var koodi = btn.getAttribute("data-koodi");
        kirjoitaRaaka(LS_OPE_R, koodi);
        try { localStorage.removeItem(LS_OPE_A); } catch (e2) {} // eri ryhmä → pyydä PIN uudelleen
        sulje();
        avaaPinPortti();
      });
    });

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
        if (!/^\d{6,}$/.test(pin)) return nayta("PIN on vähintään 6 numeroa (vain numeroita).", "virhe");
        nayta("Tarkistetaan…");
        postServer({ toiminto: "tarkista", ryhma: tunnettu, avain: pin }).then(function (v) {
          if (v && v.ok) { kirjoitaRaaka(LS_OPE_A, pin); sulje(); kaynnistaMuokkaus(); }
          else nayta(v && v.virhe === "avain_ei_tasmaa" ? "Väärä PIN." : "Tarkistus epäonnistui.", "virhe");
        });
        return;
      }

      if (aktiiviUusi) {
        var pinU = overlay.querySelector(".portti-pin-uusi").value.trim();
        if (!/^\d{6,}$/.test(pinU)) return nayta("Valitse PIN: vähintään 6 numeroa (vain numeroita).", "virhe");
        nayta("Luodaan ryhmää…");
        var koulukoodi = null;
        try { var lis = JSON.parse(localStorage.getItem("digiopo_lisenssi") || "null"); if (lis) koulukoodi = lis.koodi || lis.koulu || null; } catch (e) {}
        postServer({ toiminto: "rekisteroi", avain: pinU, koulukoodi: koulukoodi }).then(function (v) {
          if (v && v.ok && v.ryhmakoodi) {
            kirjoitaRaaka(LS_OPE_R, v.ryhmakoodi); kirjoitaRaaka(LS_OPE_A, pinU); listaanRyhma(v.ryhmakoodi);
            // EI kutsuta julkaise() tässä: muuten muokkaustilaan tullessa
            // näkyy heti tallennuskuittaus, vaikka opettaja ei ole tehnyt
            // mitään muutoksia. Tallennus tapahtuu vasta "Tallenna oppilaille"
            // -napista (kuten muissakin kirjautumispoluissa).
            sulje(); kaynnistaMuokkaus();
          } else nayta("Ryhmän luonti epäonnistui.", "virhe");
        });
      } else {
        var koodi = overlay.querySelector(".portti-koodi").value.trim().toUpperCase();
        var pinL = overlay.querySelector(".portti-pin-liity").value.trim();
        if (!/^[A-Z0-9-]{4,16}$/.test(koodi)) return nayta("Tarkista ryhmäkoodi.", "virhe");
        if (!/^\d{6,}$/.test(pinL)) return nayta("PIN on vähintään 6 numeroa (vain numeroita).", "virhe");
        nayta("Tarkistetaan…");
        postServer({ toiminto: "tarkista", ryhma: koodi, avain: pinL }).then(function (v) {
          if (v && v.ok) { kirjoitaRaaka(LS_OPE_R, koodi); kirjoitaRaaka(LS_OPE_A, pinL); listaanRyhma(koodi); sulje(); kaynnistaMuokkaus(); }
          else nayta(v && v.virhe === "avain_ei_tasmaa" ? "Väärä koodi tai PIN." : "Tarkistus epäonnistui.", "virhe");
        });
      }
    });

    // TILIMOODI: jos opettaja on kirjautunut omalla tilillään (istunto), näytä
    // hänen palvelinpuoliset ryhmänsä ja avaa muokkaus ILMAN PIN:iä. Alla oleva
    // PIN-virta jää fallbackiksi (uudet/legacy-ryhmät, kirjautumaton laite).
    postServer({ toiminto: "omat_ryhmat" }).then(function (v) {
      var laatikko = overlay.querySelector(".portti-laatikko");
      if (!laatikko) return;
      // Ei kirjautunut opettajana → kirjautumiskehotus (ei PIN-porttia).
      if (!v || !v.ok) {
        laatikko.innerHTML =
          '<h2>Opettajan muokkaustila</h2>' +
          '<p>Kirjaudu opettajana omalla sähköpostillasi, niin voit muokata ryhmiäsi.</p>' +
          '<div class="portti-napit">' +
            '<a class="jarjestys-nappi" href="/kirjaudu.html" style="text-decoration:none">Kirjaudu opettajana →</a>' +
            '<button type="button" class="portti-sulje-kirj">Sulje</button>' +
          '</div>';
        var sk = laatikko.querySelector(".portti-sulje-kirj");
        if (sk) sk.addEventListener("click", sulje);
        return;
      }
      var ryhmat = v.ryhmat || [];
      var listaHTML = ryhmat.length
        ? ryhmat.map(function (r) {
            var nimi = r.nimi ? '<span class="portti-lista-nimi">' + esc(r.nimi) + '</span>' : '';
            return '<div style="display:flex;gap:6px;margin-bottom:.3rem">' +
              '<button type="button" class="portti-lista-rivi portti-tili-rivi" data-koodi="' + esc(r.ryhmakoodi) + '" style="flex:1;margin-bottom:0">' +
                '<span class="portti-tili-avaa">✏️ Avaa</span>' + nimi +
                '<span class="portti-lista-koodi">' + esc(r.ryhmakoodi) + '</span></button>' +
              '<button type="button" class="portti-tili-poista" data-koodi="' + esc(r.ryhmakoodi) + '" title="Poista ryhmä" style="flex:0 0 auto;background:#fff;border:1px solid #e0a3a3;color:#b91c1c;border-radius:.5rem;padding:0 .55rem;cursor:pointer;font-size:15px">🗑</button>' +
            '</div>';
          }).join("")
        : '<p style="font-size:12px;color:#6b5f88;margin:.2rem 0 .5rem">Ei vielä omia ryhmiä. Luo ensimmäinen alta.</p>';
      var lohko = document.createElement("div");
      lohko.style.cssText = "margin:0 0 0.8rem;padding:0 0 0.8rem;border-bottom:1px solid #ece7d6";
      lohko.innerHTML =
        (v.email ? '<div style="font-size:11px;color:#8b7fb0;margin-bottom:.55rem">Kirjautunut: <strong>' + esc(v.email) + '</strong></div>' : '') +
        '<div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:.04em;color:#7c6ba8;font-weight:700;margin-bottom:.35rem">Omat ryhmät · avaa ilman PIN:iä</div>' +
        listaHTML +
        '<button type="button" class="jarjestys-nappi portti-luo-btn" style="width:100%;margin-top:.4rem">➕ Luo uusi ryhmä</button>';
      var otsikko = laatikko.querySelector("h2");
      if (otsikko && otsikko.nextSibling) laatikko.insertBefore(lohko, otsikko.nextSibling);
      else laatikko.insertBefore(lohko, laatikko.firstChild);

      // Kirjautuneelle opettajalle näytetään VAIN tili-osio: piilota PIN-virta ja
      // paikallinen roster, jottei sama ryhmä näy kahdesti eikä PIN-portti jää
      // sekoittamaan (klikkaus alempaan riviin avasi ennen PIN-portin uudelleen).
      ['.portti-lista', '.portti-pin', '.portti-laheta', '.portti-moodit', '.portti-uusi', '.portti-liity'].forEach(function (sel) {
        var piiloon = laatikko.querySelector(sel); if (piiloon) piiloon.style.display = 'none';
      });
      Array.prototype.forEach.call(laatikko.children, function (child) {
        if (child.tagName === 'P') child.style.display = 'none'; // PIN-ohjetekstit + viesti (suorat lapset)
      });

      // Avaa oma ryhmä ilman PIN:iä (tilimoodi)
      Array.prototype.forEach.call(lohko.querySelectorAll(".portti-tili-rivi"), function (btn) {
        btn.addEventListener("click", function () {
          kirjoitaRaaka(LS_OPE_R, btn.getAttribute("data-koodi"));
          tiliMoodi = true;
          sulje();
          kaynnistaMuokkaus();
        });
      });

      // Poista oma ryhmä (poista_oma, vahvistus). Poistaa myös järjestyksen ja aikataulun.
      Array.prototype.forEach.call(lohko.querySelectorAll(".portti-tili-poista"), function (btn) {
        btn.addEventListener("click", function () {
          var koodi = btn.getAttribute("data-koodi");
          if (!window.confirm("Poistetaanko ryhmä " + koodi + " pysyvästi?\n\nTämä poistaa myös ryhmän osiojärjestyksen ja aikataulun. Ei voi perua.")) return;
          btn.disabled = true; btn.textContent = "…";
          postServer({ toiminto: "poista_oma", ryhma: koodi, vahvista: koodi }).then(function (r) {
            if (r && r.ok) { sulje(); avaaPinPortti(); } // päivitä lista
            else { btn.disabled = false; btn.textContent = "🗑"; alert("Poisto epäonnistui: " + ((r && r.virhe) || "")); }
          });
        });
      });

      // "Luo uusi ryhmä": luo ryhmä opettajan omistukseen ja avaa muokkaustila
      var luoBtn = lohko.querySelector(".portti-luo-btn");
      if (luoBtn) {
        luoBtn.addEventListener("click", function () {
          var nimi = window.prompt("Anna ryhmälle nimi (esim. 7A). Voit jättää tyhjäksi.", "");
          if (nimi === null) return; // peruttu
          var koulukoodi = null;
          try { var lis = JSON.parse(localStorage.getItem("digiopo_lisenssi") || "null"); if (lis) koulukoodi = lis.koodi || lis.koulu || null; } catch (e) {}
          luoBtn.disabled = true; luoBtn.textContent = "Luodaan…";
          postServer({ toiminto: "luo_oma", nimi: nimi.trim(), koulukoodi: koulukoodi }).then(function (r) {
            if (r && r.ok && r.ryhmakoodi) {
              kirjoitaRaaka(LS_OPE_R, r.ryhmakoodi);
              tiliMoodi = true;
              listaanRyhma(r.ryhmakoodi);
              sulje();
              kaynnistaMuokkaus();
            } else {
              luoBtn.disabled = false; luoBtn.textContent = "➕ Luo uusi ryhmä";
              alert("Ryhmän luonti epäonnistui.");
            }
          });
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
        porttiListaHTML(tunnettu) +
        '<p>Ryhmä <strong>' + tunnettu + '</strong>. Syötä PIN avataksesi muokkaustilan.</p>' +
        '<input class="portti-pin" type="password" inputmode="numeric" placeholder="PIN" autocomplete="off">' +
        '<p class="portti-viesti"></p>' +
        '<p class="portti-vaihda-rivi" style="margin:4px 0 0;font-size:13px"><a href="#" class="portti-vaihda" style="color:#7c3aed">Vaihda ryhmä / luo uusi</a></p>' +
        '<div class="portti-napit"><button type="button" class="portti-peruuta">Peruuta</button>' +
        '<button type="button" class="jarjestys-nappi portti-laheta">Avaa</button></div></div>';
    }
    return '<div class="portti-laatikko">' +
      '<h2>Opettajan muokkaustila</h2>' +
      porttiListaHTML(null) +
      '<div class="portti-moodit">' +
        '<button type="button" class="portti-moodi aktiivinen" data-mode="uusi">Luo uusi ryhmä</button>' +
        '<button type="button" class="portti-moodi" data-mode="liity">Minulla on jo ryhmä</button>' +
      '</div>' +
      '<div class="portti-uusi">' +
        '<p>Valitse salainen PIN (väh. 6 numeroa). Se luo jakoryhmän ja toimii jatkossa muokkaustilan avaimena. Älä jaa sitä oppilaille äläkä käytä arvattavaa (esim. 123456 tai syntymävuosi).</p>' +
        '<input class="portti-pin-uusi" type="password" inputmode="numeric" placeholder="Valitse PIN (väh. 6 numeroa)" autocomplete="off">' +
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
    var lukot = lueLukot();
    osiot().forEach(function (sec) {
      var locked = lukot.indexOf(sec.id) !== -1;
      if (!sec.querySelector(":scope > .jarjestys-kahva")) {
        var k = document.createElement("button");
        k.type = "button"; k.className = "jarjestys-kahva";
        k.title = "Raahaa osiota järjestääksesi"; k.setAttribute("aria-label", "Raahaa osiota");
        k.innerHTML = "⠿";
        sec.insertAdjacentElement("afterbegin", k);
      }
      if (!sec.querySelector(":scope > .jarjestys-lukko-nappi")) {
        var L = document.createElement("button");
        L.type = "button"; L.className = "jarjestys-lukko-nappi";
        paivitaLukkoNappi(L, locked);
        L.addEventListener("click", function () {
          var lk = lueLukot(); var i = lk.indexOf(sec.id); var nyt;
          if (i === -1) { lk.push(sec.id); nyt = true; } else { lk.splice(i, 1); nyt = false; }
          tallennaLukot(lk);
          paivitaLukkoNappi(L, nyt);
          sec.classList.toggle("ope-osio-lukittu", nyt);
          if (julkaisuTila) { julkaisuTila.textContent = "Muutoksia ei vielä julkaistu oppilaille."; julkaisuTila.className = "jarjestys-tila odottaa"; }
        });
        sec.insertAdjacentElement("afterbegin", L);
      }
      sec.classList.toggle("ope-osio-lukittu", locked);
    });
  }

  function paivitaLukkoNappi(btn, locked) {
    btn.innerHTML = locked ? "🔒" : "🔓";
    btn.title = locked ? "Lukittu oppilailta — klikkaa avataksesi" : "Avoin — klikkaa lukitaksesi oppilailta";
    btn.setAttribute("aria-label", btn.title);
    btn.classList.toggle("lukittu", locked);
  }

  function paivitaKaikkiLukot() {
    var lukot = lueLukot();
    osiot().forEach(function (sec) {
      var L = sec.querySelector(":scope > .jarjestys-lukko-nappi");
      var locked = lukot.indexOf(sec.id) !== -1;
      if (L) paivitaLukkoNappi(L, locked);
      sec.classList.toggle("ope-osio-lukittu", locked);
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
      '<div class="jp-head">' +
        '<span class="jp-title">👩‍🏫 Muokkaustila</span>' +
        '<button type="button" class="jarjestys-nappi jarjestys-sulje" title="Sulje">✕</button>' +
      '</div>' +
      // 1. Osioiden järjestys
      '<div class="jp-block">' +
        '<div class="jp-h">Osioiden järjestys</div>' +
        '<p class="jp-ohje">Raahaa osioita kahvasta (⠿) ja lukitse/avaa osioita lukolla (🔒).</p>' +
        '<button type="button" class="jarjestys-nappi jarjestys-palauta">Palauta oletusjärjestys</button>' +
      '</div>' +
      // 2. Lukuvuoden aikataulu
      '<div class="jp-block">' +
        '<div class="jp-h">Lukuvuoden aikataulu</div>' +
        '<p class="jp-ohje">Lisää koulun tärkeät päivät (TET-jakso, yhteishaku, palautukset), jotka oppilaat näkevät.</p>' +
        '<button type="button" class="jarjestys-nappi jarjestys-aikataulu">Muokkaa aikataulua</button>' +
      '</div>' +
      // 3. Julkaise muutokset oppilaille
      '<div class="jp-block">' +
        '<div class="jp-h">Julkaise oppilaille</div>' +
        '<p class="jp-ohje">Tallenna tekemäsi järjestys- ja lukitusmuutokset oppilaiden nähtäväksi.</p>' +
        '<button type="button" class="jarjestys-nappi jarjestys-julkaise">Tallenna oppilaille</button>' +
        '<span class="jarjestys-tila"></span>' +
      '</div>' +
      // 4. Jaettava linkki oppilaille (viimeisenä)
      '<div class="jp-block">' +
        '<div class="jp-h">Jaa linkki oppilaille</div>' +
        '<p class="jp-koodi">Ryhmäkoodi: <strong>' + (ryhma || "—") + '</strong></p>' +
        '<code class="jarjestys-linkki-teksti">' + linkki + '</code>' +
        '<button type="button" class="jarjestys-nappi jarjestys-kopioi">Kopioi linkki</button>' +
      '</div>';
    document.body.appendChild(b);
    b.querySelector(".jarjestys-sulje").addEventListener("click", lopetaMuokkaus);
    b.querySelector(".jarjestys-palauta").addEventListener("click", function () {
      try { localStorage.removeItem(LS_LOCAL); localStorage.removeItem(LS_LOCK); } catch (e) {}
      sovella(OLETUS);
      paivitaKaikkiLukot();
    });
    b.querySelector(".jarjestys-julkaise").addEventListener("click", julkaise);
    var aikatauluNappi = b.querySelector(".jarjestys-aikataulu");
    if (aikatauluNappi) aikatauluNappi.addEventListener("click", avaaAikatauluModaali);
    var kopioiNappi = b.querySelector(".jarjestys-kopioi");
    if (kopioiNappi) kopioiNappi.addEventListener("click", function () {
      if (navigator.clipboard) navigator.clipboard.writeText(linkki).then(function () {
        var vanha = kopioiNappi.textContent;
        kopioiNappi.textContent = "Kopioitu ✓";
        setTimeout(function () { kopioiNappi.textContent = vanha; }, 1500);
      });
    });
    julkaisuTila = b.querySelector(".jarjestys-tila");
  }

  // ---------- Aikataulu-modaali (samalla luokkasivulla, ei erillistä sivua) ----------
  function avaaAikatauluModaali() {
    if (document.querySelector(".aikataulu-modaali-overlay")) return;
    var ryhma = lueRaaka(LS_OPE_R);
    if (!ryhma) return;
    var API_A = "/api/aikataulu";
    var TYYPIT = { tet: "TET-jakso", yhteishaku: "Yhteishaku", palautus: "Palautuspäivä", tapahtuma: "Tapahtuma", muu: "Muu" };
    var muokattavaId = null;

    // Valtuutus samoin kuin muokkaustila avattiin: istunto (tilimoodi) tai PIN.
    function avainNyt() { return tiliMoodi ? "" : (lueRaaka(LS_OPE_A) || ""); }
    function postA(payload) {
      return fetch(API_A, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); }).catch(function () { return { ok: false, virhe: "verkko" }; });
    }
    function pvmSuomeksi(iso) { var o = String(iso || "").split("-"); if (o.length !== 3) return iso || ""; return parseInt(o[2], 10) + "." + parseInt(o[1], 10) + "." + o[0]; }
    function pvmVali(a, l) { if (l && l !== a) return pvmSuomeksi(a) + " – " + pvmSuomeksi(l); return pvmSuomeksi(a); }

    var overlay = document.createElement("div");
    overlay.className = "aikataulu-modaali-overlay";
    overlay.innerHTML =
      '<div class="aikataulu-modaali">' +
        '<div class="am-head"><span>🗓️ Lukuvuoden aikataulu — ' + LUOKKA + '. luokka</span>' +
        '<button type="button" class="am-sulje" title="Sulje">✕</button></div>' +
        '<div class="am-lomake">' +
          '<input class="am-otsikko" type="text" maxlength="80" placeholder="Otsikko (esim. TET-jakso)">' +
          '<div class="am-rivi2">' +
            '<select class="am-tyyppi">' + Object.keys(TYYPIT).map(function (k) { return '<option value="' + k + '">' + esc(TYYPIT[k]) + '</option>'; }).join("") + '</select>' +
            '<input class="am-alku" type="date">' +
            '<input class="am-loppu" type="date">' +
          '</div>' +
          '<textarea class="am-kuvaus" maxlength="200" placeholder="Lyhyt lisätieto oppilaille (valinnainen)"></textarea>' +
          '<div class="am-napit">' +
            '<button type="button" class="jarjestys-nappi am-tallenna">Lisää tapahtuma</button>' +
            '<button type="button" class="am-peru" hidden>Peru</button>' +
            '<span class="am-tila"></span>' +
          '</div>' +
        '</div>' +
        '<div class="am-lista"><p class="am-tyhja">Ladataan…</p></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var q = function (sel) { return overlay.querySelector(sel); };
    function sulje() { overlay.remove(); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) sulje(); });
    q(".am-sulje").addEventListener("click", sulje);

    function naytaTila(t, lk) { var el = q(".am-tila"); el.textContent = t || ""; el.className = "am-tila" + (lk ? " " + lk : ""); }
    function tyhjennaLomake() { muokattavaId = null; q(".am-otsikko").value = ""; q(".am-tyyppi").value = "tet"; q(".am-alku").value = ""; q(".am-loppu").value = ""; q(".am-kuvaus").value = ""; q(".am-tallenna").textContent = "Lisää tapahtuma"; q(".am-peru").hidden = true; }

    function lataa() {
      fetch(API_A + "?ryhma=" + encodeURIComponent(ryhma) + "&luokka=" + LUOKKA)
        .then(function (r) { return r.json(); })
        .then(function (d) { if (!d || !d.ok) { q(".am-lista").innerHTML = '<p class="am-tyhja">Lataus epäonnistui.</p>'; return; } renderoi(d.tapahtumat || []); })
        .catch(function () { q(".am-lista").innerHTML = '<p class="am-tyhja">Yhteysvirhe.</p>'; });
    }

    function renderoi(lista) {
      if (!lista.length) { q(".am-lista").innerHTML = '<p class="am-tyhja">Ei vielä tapahtumia. Lisää ensimmäinen yllä.</p>'; return; }
      q(".am-lista").innerHTML = lista.map(function (t) {
        var tyyppi = TYYPIT[t.tyyppi] ? t.tyyppi : "muu";
        return '<div class="am-rivi am-t-' + tyyppi + '" data-id="' + esc(t.id) + '">' +
          '<div class="am-tiedot"><div class="am-pvm">' + esc(pvmVali(t.alku_pvm, t.loppu_pvm)) + ' · ' + esc(TYYPIT[tyyppi]) + '</div>' +
          '<div class="am-otsikkorivi">' + esc(t.otsikko) + '</div>' + (t.kuvaus ? '<div class="am-kuvausrivi">' + esc(t.kuvaus) + '</div>' : '') + '</div>' +
          '<div class="am-toiminnot"><button type="button" class="am-muokkaa">Muokkaa</button><button type="button" class="am-poista">Poista</button></div>' +
        '</div>';
      }).join("");
      Array.prototype.forEach.call(q(".am-lista").querySelectorAll(".am-rivi"), function (el) {
        var id = el.getAttribute("data-id");
        var t = lista.filter(function (x) { return String(x.id) === id; })[0];
        el.querySelector(".am-muokkaa").addEventListener("click", function () { aloitaMuokkaus(t); });
        el.querySelector(".am-poista").addEventListener("click", function () { poista(t); });
      });
    }

    function aloitaMuokkaus(t) {
      muokattavaId = t.id;
      q(".am-otsikko").value = t.otsikko || ""; q(".am-tyyppi").value = t.tyyppi || "muu";
      q(".am-alku").value = t.alku_pvm || ""; q(".am-loppu").value = t.loppu_pvm || ""; q(".am-kuvaus").value = t.kuvaus || "";
      q(".am-tallenna").textContent = "Tallenna muutokset"; q(".am-peru").hidden = false; q(".am-otsikko").focus();
    }

    q(".am-peru").addEventListener("click", function () { tyhjennaLomake(); naytaTila(""); });

    q(".am-tallenna").addEventListener("click", function () {
      var otsikko = (q(".am-otsikko").value || "").trim();
      var alku = q(".am-alku").value;
      var loppu = q(".am-loppu").value || null;
      var kuvaus = (q(".am-kuvaus").value || "").trim() || null;
      if (!otsikko) return naytaTila("Anna otsikko.", "virhe");
      if (!alku) return naytaTila("Valitse alkupäivä.", "virhe");
      if (loppu && loppu < alku) return naytaTila("Loppupäivä ei voi olla ennen alkupäivää.", "virhe");
      var payload = { ryhma: ryhma, avain: avainNyt(), luokka: LUOKKA, otsikko: otsikko, tyyppi: q(".am-tyyppi").value, alku_pvm: alku, loppu_pvm: loppu, kuvaus: kuvaus };
      payload.toiminto = muokattavaId ? "muokkaa" : "lisaa";
      if (muokattavaId) payload.id = muokattavaId;
      q(".am-tallenna").disabled = true; naytaTila("Tallennetaan…");
      postA(payload).then(function (v) {
        q(".am-tallenna").disabled = false;
        if (v && v.ok) { naytaTila(muokattavaId ? "Muutokset tallennettu." : "Tapahtuma lisätty.", "ok"); tyhjennaLomake(); lataa(); }
        else if (v && (v.virhe === "ei_kirjautunut" || v.virhe === "ei_omistaja" || v.virhe === "avain_ei_tasmaa")) naytaTila("Ei oikeutta — kirjaudu uudelleen.", "virhe");
        else naytaTila("Tallennus epäonnistui.", "virhe");
      });
    });

    function poista(t) {
      if (!window.confirm('Poistetaanko "' + (t.otsikko || "") + '"?')) return;
      postA({ toiminto: "poista", ryhma: ryhma, avain: avainNyt(), id: t.id }).then(function (v) {
        if (v && v.ok) { if (muokattavaId === t.id) tyhjennaLomake(); lataa(); }
        else naytaTila("Poisto epäonnistui.", "virhe");
      });
    }

    lataa();
  }

  function julkaise() {
    var ryhma = lueRaaka(LS_OPE_R);
    if (!ryhma) return;
    var payload;
    if (tiliMoodi) {
      // Opettajatili: tallennus istunnolla + omistajuudella, ei PIN:iä.
      payload = { toiminto: "tallenna_oma", ryhma: ryhma, luokka: LUOKKA, jarjestys: jarjestysNyt(), lukitut: lueLukot() };
    } else {
      var avain = lueRaaka(LS_OPE_A);
      if (!avain) return;
      payload = { toiminto: "tallenna", ryhma: ryhma, avain: avain, luokka: LUOKKA, jarjestys: jarjestysNyt(), lukitut: lueLukot() };
    }
    if (julkaisuTila) { julkaisuTila.textContent = "Tallennetaan…"; julkaisuTila.className = "jarjestys-tila"; }
    postServer(payload)
      .then(function (v) {
        if (!julkaisuTila) return;
        if (v && v.ok) { julkaisuTila.textContent = "✓ Julkaistu oppilaille."; julkaisuTila.className = "jarjestys-tila ok"; }
        else if (v && v.virhe === "avain_ei_tasmaa") { julkaisuTila.textContent = "Avain ei täsmää."; julkaisuTila.className = "jarjestys-tila virhe"; }
        else if (v && (v.virhe === "ei_kirjautunut" || v.virhe === "ei_omistaja")) { julkaisuTila.textContent = "Istunto vanhentui — kirjaudu uudelleen."; julkaisuTila.className = "jarjestys-tila virhe"; }
        else { julkaisuTila.textContent = "Tallennus epäonnistui."; julkaisuTila.className = "jarjestys-tila virhe"; }
      });
  }
})();
