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
    Object.keys(DATA.osiot || {}).forEach(function (id) {
      var osio = document.getElementById(id);
      var d = DATA.osiot[id];
      if (!osio || !d) return;

      if (d.teoria && DATA.teoriat && DATA.teoriat[d.teoria]) {
        var h2 = osio.querySelector(".aihe-otsikko h2, h2");
        if (h2 && !h2.querySelector(".teoria-nappi")) {
          h2.appendChild(teoriaNappi(d.teoria, true));
        }
      }

      if (d.tavoitteet) {
        var alku = el("details", "osio-info osio-tavoitteet");
        alku.innerHTML =
          summaryHTML("fa-solid fa-bullseye", "Tunnin tavoitteet",
            "Avaa ja katso, mitä tällä tunnilla tehdään") +
          '<div class="osio-info-sisalto">' +
          (d.rakenne ? "<h4>Tunnin rakenne</h4><ul>" + lista(d.rakenne) + "</ul>" : "") +
          "<h4>Tavoitteet</h4><ul>" + lista(d.tavoitteet) + "</ul>" +
          (d.miksi ? '<div class="osio-miksi"><strong>Miksi tämä kannattaa?</strong><br>' + d.miksi + "</div>" : "") +
          "</div>";
        var otsikko = osio.querySelector(".aihe-otsikko");
        if (otsikko) otsikko.insertAdjacentElement("afterend", alku);
        else osio.insertAdjacentElement("afterbegin", alku);
      }

      if (d.yhteenveto) {
        var loppu = el("details", "osio-info osio-yhteenveto");
        loppu.innerHTML =
          summaryHTML("fa-solid fa-clipboard-check", "Yhteenveto — mitä opit tällä oppitunnilla",
            "Avaa, kun olet tehnyt oppitunnin tehtävät") +
          '<div class="osio-info-sisalto"><h4>Tämän oppitunnin jälkeen</h4><ul>' +
          lista(d.yhteenveto) + "</ul></div>";
        var opeOsiot = osio.querySelectorAll(":scope .opettaja-osio, :scope .ope-osio");
        if (opeOsiot.length) {
          opeOsiot[opeOsiot.length - 1].insertAdjacentElement("beforebegin", loppu);
        } else {
          osio.appendChild(loppu);
        }
      }
    });
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
})();
