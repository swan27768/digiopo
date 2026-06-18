/* ============================================================
   OSIO-RAKENNE.JS — rakentaa yhtenäisen osiorakenteen
   Lukee sisällöt window.OSIO_DATA-oliosta (osio-data-Xlk.js).
   ============================================================ */
(function () {
  "use strict";
  var DATA = window.OSIO_DATA;
  if (!DATA) return;

  document.addEventListener("DOMContentLoaded", function () {
    document.body.setAttribute("data-luokka", DATA.luokka);
    rakennaOsioPaneelit();
    muunnaOpettajaOsiot();
    rakennaHeroBadget();
    rakennaTeoriaModal();
  });

  // Rebuild objective/summary panels when language changes
  document.addEventListener("digiopo:langchange", function () {
    document.querySelectorAll(".osio-tavoitteet, .osio-yhteenveto").forEach(function (panel) {
      panel.parentNode.removeChild(panel);
    });
    rakennaOsioPaneelit();
  });

  /* ---- Työtavat ja tehtävätyypit --------------------------- */
  var TAVAT = {
    yksin: { ikoni: "fa-solid fa-user", nimi: "Yksin" },
    pari: { ikoni: "fa-solid fa-user-group", nimi: "Parin kanssa" },
    "yksin-pari": { ikoni: "fa-solid fa-user-group", nimi: "Yksin tai parin kanssa" },
    ryhma: { ikoni: "fa-solid fa-users", nimi: "Ryhmässä" }
  };
  var TYYPIT = {
    keskustelu: { ikoni: "fa-solid fa-comments", nimi: "Keskustelutehtävä" },
    toiminnallinen: { ikoni: "fa-solid fa-person-running", nimi: "Toiminnallinen tehtävä" },
    peli: { ikoni: "fa-solid fa-gamepad", nimi: "Pelitehtävä" },
    tarina: { ikoni: "fa-solid fa-book-open", nimi: "Interaktiivinen tarinatehtävä" },
    testi: { ikoni: "fa-solid fa-clipboard-check", nimi: "Testi / kysely" }
  };

  /* ---- 1 & 2: tavoite- ja yhteenvetopaneelit ---------------- */
  function rakennaOsioPaneelit() {
    // Tavalliset osiot (id vastaa osio-dataa)
    Object.keys(DATA.osiot || {}).forEach(function (id) {
      var osio = document.getElementById(id);
      var d = DATA.osiot[id];
      if (!osio || !d) return;
      kasitteleOsio(osio, d, false);
    });
    // Ala-osiot: yhdistetyn osion sisällä olevat erilliset aktiviteetit
    document.querySelectorAll("[data-osio]").forEach(function (osio) {
      var d = DATA.osiot[osio.getAttribute("data-osio")];
      if (d) kasitteleOsio(osio, d, true);
    });
  }

  // Lisää teoria-napin sekä tavoite-/yhteenvetopaneelit yhteen osioon.
  // ala=true → ala-osio (otsikko h3, ope-/yhteenvetohaku rajataan tähän lohkoon).
  function kasitteleOsio(osio, d, ala) {
    // i18n: hae käännökset jos saatavilla
    var t = window.DIGIOPO_T || {};
    var tl = t.lesson || {};
    var sId = osio.id || osio.getAttribute("data-osio");
    var ts = (t.sections && t.sections[sId]) || {};

    var lblObjTitle  = tl.objectives_title   || "Tunnin tavoitteet";
    var lblObjSub    = tl.objectives_subtitle || "Avaa ja katso, mitä tällä tunnilla tehdään";
    var lblStructH   = tl.structure_heading  || "Tunnin rakenne";
    var lblGoalsH    = tl.goals_heading      || "Tavoitteet";
    var lblWhyH      = tl.why_heading        || "Miksi tämä kannattaa?";
    var lblSumTitle  = tl.summary_title      || "Yhteenveto — mitä opit tällä oppitunnilla";
    var lblSumSub    = tl.summary_subtitle   || "Avaa, kun olet tehnyt oppitunnin tehtävät";
    var lblAfterH    = tl.after_heading      || "Tämän oppitunnin jälkeen";

    var rakenne     = (ts.structure  && ts.structure.length)  ? ts.structure  : d.rakenne;
    var tavoitteet  = (ts.objectives && ts.objectives.length) ? ts.objectives : d.tavoitteet;
    var yhteenveto  = (ts.summary    && ts.summary.length)    ? ts.summary    : d.yhteenveto;
    var miksi       = ts.why || d.miksi;

    if (d.teoria && DATA.teoriat && DATA.teoriat[d.teoria]) {
      var h = osio.querySelector(ala ? "h3, h2" : ".aihe-otsikko h2, h2");
      if (h && !h.querySelector(".teoria-nappi")) {
        h.appendChild(teoriaNappi(d.teoria, true));
      }
    }

    if (tavoitteet && tavoitteet.length) {
      var alku = el("details", "osio-info osio-tavoitteet");
      alku.innerHTML =
        summaryHTML("fa-solid fa-bullseye", lblObjTitle, lblObjSub) +
        '<div class="osio-info-sisalto">' +
        (rakenne && rakenne.length ? "<h4>" + esc(lblStructH) + "</h4><ul>" + lista(rakenne) + "</ul>" : "") +
        "<h4>" + esc(lblGoalsH) + "</h4><ul>" + lista(tavoitteet) + "</ul>" +
        (miksi ? '<div class="osio-miksi"><strong>' + esc(lblWhyH) + '</strong><br>' + miksi + "</div>" : "") +
        "</div>";
      var otsikko = osio.querySelector(".aihe-otsikko") || osio.querySelector("h2, h3");
      if (otsikko) otsikko.insertAdjacentElement("afterend", alku);
      else osio.insertAdjacentElement("afterbegin", alku);
    }

    if (yhteenveto && yhteenveto.length) {
      var loppu = el("details", "osio-info osio-yhteenveto");
      loppu.innerHTML =
        summaryHTML("fa-solid fa-clipboard-check", lblSumTitle, lblSumSub) +
        '<div class="osio-info-sisalto"><h4>' + esc(lblAfterH) + '</h4><ul>' +
        lista(yhteenveto) + "</ul></div>";
      // Rajaa ope-osioiden haku: pääosio ei nappaa ala-osion lohkoja eikä toisinpäin.
      var opeOsiot = Array.prototype.filter.call(
        osio.querySelectorAll(":scope .opettaja-osio, :scope .ope-osio"),
        function (o) {
          var p = o.closest("[data-osio]");
          return ala ? p === osio : p === null;
        });
      if (opeOsiot.length) {
        opeOsiot[opeOsiot.length - 1].insertAdjacentElement("afterend", loppu);
      } else if (ala) {
        osio.appendChild(loppu);
      } else {
        // Pääosio: sijoita yhteenveto ennen mahdollista ala-osiota.
        var ala1 = osio.querySelector(":scope [data-osio]");
        if (ala1) ala1.insertAdjacentElement("beforebegin", loppu);
        else osio.appendChild(loppu);
      }
    }
  }

  function summaryHTML(ikoni, otsikko, alaotsikko) {
    return (
      "<summary>" +
      '<span class="osio-info-ikoni"><i class="' + ikoni + '" aria-hidden="true"></i></span>' +
      '<span class="osio-info-tekstit">' +
      '<span class="osio-info-otsikko">' + otsikko + "</span>" +
      '<span class="osio-info-alaotsikko">' + alaotsikko + "</span>" +
      "</span>" +
      '<span class="osio-info-nuoli" aria-hidden="true">▼</span>' +
      "</summary>"
    );
  }

  /* ---- 3: harmaa palkki → pyöreä ope-nappi ------------------ */
  function muunnaOpettajaOsiot() {
    var laskuri = 0;
    document.querySelectorAll(".opettaja-osio").forEach(function (vanha) {
      var sisalto = vanha.querySelector(".opettaja-sisalto");
      var nimi = "";
      var nimiEl = vanha.querySelector(".opettaja-toggle-left span:last-child");
      if (nimiEl) nimi = nimiEl.textContent.replace(/^Opettajan materiaali\s*[–-]?\s*/i, "").trim();

      var uusi = el("div", "ope-osio");
      var pid = "ope-paneeli-" + ++laskuri;
      uusi.innerHTML =
        '<button type="button" class="ope-nappi" aria-expanded="false" aria-controls="' + pid + '" ' +
        'title="Opettajan ohje' + (nimi ? " – " + nimi : "") + '" aria-label="Opettajan ohje' + (nimi ? " – " + nimi : "") + '">' +
        '<i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i></button>' +
        '<span class="ope-vihje" aria-hidden="true">Opettajalle</span>' +
        '<div class="ope-paneeli" id="' + pid + '" hidden>' +
        '<p class="ope-paneeli-otsikko"><i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i> Opettajan ohje' +
        (nimi ? " – " + nimi : "") + "</p>" +
        (sisalto ? sisalto.innerHTML : "") +
        "</div>";

      vanha.replaceWith(uusi);
      var nappi = uusi.querySelector(".ope-nappi");
      var paneeli = uusi.querySelector(".ope-paneeli");
      nappi.addEventListener("click", function () {
        var auki = nappi.getAttribute("aria-expanded") === "true";
        nappi.setAttribute("aria-expanded", String(!auki));
        paneeli.hidden = auki;
      });
    });
  }

  /* ---- 4 & 5: hero-badget ja teoria-napit -------------------- */
  function rakennaHeroBadget() {
    document.querySelectorAll("[data-tapa], [data-tyyppi]").forEach(function (hero) {
      var tapa = TAVAT[hero.getAttribute("data-tapa")];
      var tyyppi = TYYPIT[hero.getAttribute("data-tyyppi")];
      var meta = el("div", "tehtava-meta");
      if (tapa) meta.appendChild(badge(tapa, "tehtava-badge tehtava-badge--tapa"));
      if (tyyppi) meta.appendChild(badge(tyyppi, "tehtava-badge"));

      var juuri = hero.classList.contains("hero-badge") ? hero.parentElement : hero;
      var vanhaBadge = hero.classList.contains("hero-badge")
        ? hero
        : hero.querySelector(".hero-badge");
      if (vanhaBadge) vanhaBadge.replaceWith(meta);
      else {
        var h3 = juuri.querySelector("h3");
        if (h3) h3.insertAdjacentElement("beforebegin", meta);
        else juuri.insertAdjacentElement("afterbegin", meta);
      }

      var avain = hero.getAttribute("data-teoria");
      if (avain && DATA.teoriat && DATA.teoriat[avain]) {
        var otsikko = juuri.querySelector("h3") || juuri.querySelector("h2");
        if (otsikko && !otsikko.querySelector(".teoria-nappi")) {
          otsikko.appendChild(teoriaNappi(avain, false));
        }
      }
    });
  }

  function teoriaNappi(avain, osiotaso) {
    var nappi = el("button", "teoria-nappi" + (osiotaso ? " teoria-nappi--osio" : ""));
    nappi.type = "button";
    nappi.textContent = "i";
    nappi.setAttribute("aria-label", "Tehtävän tieteellinen perusta ja lähteet");
    nappi.title = "Tieteellinen perusta ja lähteet";
    nappi.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      avaaTeoria(avain);
    });
    return nappi;
  }

  function badge(t, cls) {
    var s = el("span", cls);
    s.innerHTML = '<i class="' + t.ikoni + '" aria-hidden="true"></i>' + t.nimi;
    return s;
  }

  /* ---- Teoria-modal ------------------------------------------ */
  var modal;
  function rakennaTeoriaModal() {
    modal = el("div", "teoria-modal");
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Tehtävän tieteellinen perusta");
    modal.innerHTML =
      '<div class="teoria-modal-box">' +
      '<button type="button" class="teoria-sulje" aria-label="Sulje">✕</button>' +
      '<div class="teoria-modal-sisalto"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest(".teoria-sulje")) suljeTeoria();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) suljeTeoria();
    });
  }

  function avaaTeoria(avain) {
    var t = DATA.teoriat[avain];
    if (!t) return;
    modal.querySelector(".teoria-modal-sisalto").innerHTML =
      "<h2>" + t.otsikko + "</h2>" +
      '<p class="teoria-modal-laji">Tieteellinen perusta</p>' +
      t.teksti.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
      "<h3>Lähteet</h3><ul class='teoria-lahteet'>" + lista(t.lahteet) + "</ul>";
    modal.hidden = false;
    modal.querySelector(".teoria-sulje").focus();
    document.body.style.overflow = "hidden";
  }

  function suljeTeoria() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  /* ---- apurit ------------------------------------------------ */
  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function lista(arr) {
    return arr.map(function (x) { return "<li>" + x + "</li>"; }).join("");
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();
