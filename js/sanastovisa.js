/* ============================================================
   DigiOpo · sanastovisa.js
   Yhteinen pelimoottori lukion ja amiksen sanastopeleille.

   Käyttö (sivulla ennen tätä tiedostoa):
     <script src="../js/sanastovisa-lukio.js"></script>   // määrittelee window.SANASTOVISA
     <script src="../js/sanastovisa.js"></script>
     <div id="sanastovisa"></div>

   window.SANASTOVISA = {
     id: "lukio",            // tallennusavaimeen
     otsikko, ohje,          // tekstit
     kysymyksia: 12,         // montako kysymystä / peli
     sanat: [ { termi, selitys, esim?, ryhma? } ]
   }

   Pisteet: joka oikea vastaus = 10 pistettä. Ei miinuspisteitä.
   Kertauskierros (väärin menneet uudelleen) ei anna pisteitä.
   ============================================================ */
(function () {
  "use strict";

  var C = window.SANASTOVISA;
  var juuri = document.getElementById("sanastovisa");
  if (!C || !C.sanat || !C.sanat.length || !juuri) return;

  var PISTEET_OIKEASTA = 10;
  var VAIHTOEHTOJA = 4;
  var KYSYMYKSIA = Math.min(C.kysymyksia || 12, C.sanat.length);
  var TALLENNUS = "digiopo-sanastovisa-" + (C.id || "peli");

  var tila = null;
  var ui = {};

  /* ---------- apurit ---------- */
  function el(tag, cls, teksti) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (teksti != null) e.textContent = teksti;
    return e;
  }
  function sekoita(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function parasLue() {
    try { return parseInt(window.localStorage.getItem(TALLENNUS), 10) || 0; } catch (e) { return 0; }
  }
  function parasKirjoita(p) {
    try { window.localStorage.setItem(TALLENNUS, String(p)); } catch (e) {}
  }

  /* ---------- väärät vaihtoehdot: mieluiten samasta aiheryhmästä ---------- */
  function vaarat(sana) {
    var samat = C.sanat.filter(function (s) { return s !== sana && s.ryhma && s.ryhma === sana.ryhma; });
    var muut = C.sanat.filter(function (s) { return s !== sana && !(s.ryhma && s.ryhma === sana.ryhma); });
    return sekoita(samat).concat(sekoita(muut)).slice(0, VAIHTOEHTOJA - 1);
  }

  /* ---------- käyttöliittymän runko ---------- */
  function rakenna() {
    juuri.textContent = "";
    juuri.className = "sv";
    if (C.vari) juuri.style.setProperty("--sv-vari", C.vari);
    if (C.variTumma) juuri.style.setProperty("--sv-vari-tumma", C.variTumma);
    if (C.variVaalea) juuri.style.setProperty("--sv-vari-vaalea", C.variVaalea);

    var otsikko = el("h1", "sv-otsikko", C.otsikko || "Sanastopeli");
    var ohje = el("p", "sv-ohje", C.ohje || "");

    var tilarivi = el("div", "sv-tilarivi");
    ui.numero = el("span", "sv-pilli");
    ui.pisteet = el("span", "sv-pilli sv-pilli-pisteet");
    ui.pisteet.setAttribute("aria-live", "polite");
    tilarivi.appendChild(ui.numero);
    tilarivi.appendChild(ui.pisteet);

    var palkki = el("div", "sv-palkki");
    palkki.setAttribute("role", "progressbar");
    palkki.setAttribute("aria-label", "Peli etenee");
    palkki.setAttribute("aria-valuemin", "0");
    ui.palkkiSisus = el("div", "sv-palkki-sisus");
    palkki.appendChild(ui.palkkiSisus);
    ui.palkki = palkki;

    ui.kortti = el("section", "sv-kortti");
    ui.kortti.setAttribute("aria-live", "off");

    juuri.appendChild(otsikko);
    juuri.appendChild(ohje);
    juuri.appendChild(tilarivi);
    juuri.appendChild(palkki);
    juuri.appendChild(ui.kortti);
  }

  /* ---------- pelin aloitus ---------- */
  function aloita(tila_) {
    tila = tila_;
    tila.nro = 0;
    tila.pisteet = 0;
    tila.oikein = 0;
    tila.virheet = [];
    tila.lukittu = false;
    ui.palkki.setAttribute("aria-valuemax", String(tila.jono.length));
    kysymys();
  }

  function uusiPeli() {
    var jono = sekoita(C.sanat).slice(0, KYSYMYKSIA);
    aloita({ jono: jono, kertaus: false });
  }

  function kertaa() {
    if (!tila || !tila.virheet.length) return;
    aloita({ jono: sekoita(tila.virheet), kertaus: true });
  }

  /* ---------- kysymys ---------- */
  function paivitaTilarivi() {
    var n = Math.min(tila.nro + 1, tila.jono.length);
    ui.numero.textContent = (tila.kertaus ? "Kertaus " : "Kysymys ") + n + " / " + tila.jono.length;
    ui.pisteet.textContent = tila.kertaus ? "Ei pisteitä" : "Pisteet: " + tila.pisteet;
    ui.palkkiSisus.style.width = (tila.nro / tila.jono.length * 100) + "%";
    ui.palkki.setAttribute("aria-valuenow", String(tila.nro));
  }

  function kysymys() {
    var sana = tila.jono[tila.nro];
    tila.lukittu = false;
    tila.nykyinen = sana;
    paivitaTilarivi();

    var vaihtoehdot = sekoita([sana].concat(vaarat(sana)));
    ui.kortti.textContent = "";

    var kysy = el("p", "sv-kysymys-ohje", "Mikä käsite tämä on?");
    var selitys = el("p", "sv-selitys", sana.selitys);
    selitys.id = "sv-selitys";

    var lista = el("div", "sv-vaihtoehdot");
    lista.setAttribute("role", "group");
    lista.setAttribute("aria-labelledby", "sv-selitys");

    ui.napit = vaihtoehdot.map(function (v, i) {
      var b = el("button", "sv-nappi");
      b.type = "button";
      var nro = el("span", "sv-nappi-nro", String(i + 1));
      nro.setAttribute("aria-hidden", "true");
      b.appendChild(nro);
      b.appendChild(el("span", "sv-nappi-teksti", v.termi));
      b.addEventListener("click", function () { vastaa(b, v === sana); });
      b._oikea = (v === sana);
      lista.appendChild(b);
      return b;
    });

    ui.palaute = el("div", "sv-palaute");
    ui.palaute.setAttribute("role", "status");
    ui.palaute.hidden = true;

    ui.seuraava = el("button", "sv-seuraava", "Seuraava →");
    ui.seuraava.type = "button";
    ui.seuraava.hidden = true;
    ui.seuraava.addEventListener("click", seuraava);

    ui.kortti.appendChild(kysy);
    ui.kortti.appendChild(selitys);
    ui.kortti.appendChild(lista);
    ui.kortti.appendChild(ui.palaute);
    ui.kortti.appendChild(ui.seuraava);
  }

  function vastaa(nappi, oikein) {
    if (tila.lukittu) return;
    tila.lukittu = true;
    var sana = tila.nykyinen;

    ui.napit.forEach(function (b) {
      b.disabled = true;
      if (b._oikea) b.classList.add("sv-oikea");
    });
    if (!oikein) nappi.classList.add("sv-vaara");
    nappi.classList.add("sv-valittu");

    ui.palaute.textContent = "";
    ui.palaute.hidden = false;
    ui.palaute.className = "sv-palaute " + (oikein ? "sv-palaute-oikein" : "sv-palaute-vaara");

    if (oikein) {
      tila.oikein++;
      if (!tila.kertaus) tila.pisteet += PISTEET_OIKEASTA;
      ui.palaute.appendChild(el("strong", null,
        tila.kertaus ? "Oikein! ✓" : "Oikein! +" + PISTEET_OIKEASTA + " pistettä ✓"));
    } else {
      tila.virheet.push(sana);
      ui.palaute.appendChild(el("strong", null, "Ei tällä kertaa."));
      ui.palaute.appendChild(el("span", null, " Oikea vastaus on "));
      ui.palaute.appendChild(el("strong", null, sana.termi + "."));
    }
    if (sana.esim) ui.palaute.appendChild(el("p", "sv-esim", "Esimerkki: " + sana.esim));

    paivitaTilarivi();
    ui.pisteet.textContent = tila.kertaus ? "Ei pisteitä" : "Pisteet: " + tila.pisteet;

    var viimeinen = tila.nro === tila.jono.length - 1;
    ui.seuraava.textContent = viimeinen ? "Katso tulos →" : "Seuraava →";
    ui.seuraava.hidden = false;
    ui.seuraava.focus();
  }

  function seuraava() {
    tila.nro++;
    if (tila.nro >= tila.jono.length) tulos();
    else kysymys();
    var otsikko = juuri.querySelector(".sv-otsikko");
    if (otsikko && otsikko.scrollIntoView) otsikko.scrollIntoView({ block: "start" });
  }

  /* ---------- tulos ---------- */
  function tulos() {
    var yht = tila.jono.length;
    tila.nro = yht;
    paivitaTilarivi();
    ui.numero.textContent = "Valmis!";
    ui.kortti.textContent = "";

    var osuus = tila.oikein / yht;
    var viesti = osuus === 1 ? "Täydet pisteet! Hallitset sanaston."
      : osuus >= 0.75 ? "Hienoa työtä! Sanasto on jo hyvin hallussa."
      : osuus >= 0.5 ? "Hyvä alku! Kertaa vielä väärin menneet."
      : "Hyvä, että kokeilit! Kertaa väärin menneet ja pelaa uudestaan.";

    ui.kortti.appendChild(el("h2", "sv-tulos-otsikko", viesti));

    var luvut = el("div", "sv-luvut");
    function luku(arvo, nimi) {
      var d = el("div", "sv-luku");
      d.appendChild(el("strong", null, arvo));
      d.appendChild(el("span", null, nimi));
      luvut.appendChild(d);
    }
    if (!tila.kertaus) {
      var max = yht * PISTEET_OIKEASTA;
      var ennatys = parasLue();
      var uusi = tila.pisteet > ennatys;
      if (uusi) parasKirjoita(tila.pisteet);
      luku(tila.pisteet + " / " + max, "Pisteet");
      luku(tila.oikein + " / " + yht, "Oikein");
      luku(String(Math.max(ennatys, tila.pisteet)), uusi ? "Uusi ennätys! 🎉" : "Oma ennätys");
    } else {
      luku(tila.oikein + " / " + yht, "Oikein kertauksessa");
    }
    ui.kortti.appendChild(luvut);

    if (tila.virheet.length) {
      ui.kortti.appendChild(el("h3", "sv-virheet-otsikko", "Kertaa nämä:"));
      var ul = el("ul", "sv-virheet");
      tila.virheet.forEach(function (s) {
        var li = el("li");
        li.appendChild(el("strong", null, s.termi));
        li.appendChild(el("span", null, " – " + s.selitys));
        ul.appendChild(li);
      });
      ui.kortti.appendChild(ul);
    }

    var toiminnot = el("div", "sv-toiminnot");
    if (tila.virheet.length) {
      var k = el("button", "sv-seuraava sv-toissijainen", "Kertaa väärin menneet");
      k.type = "button";
      k.addEventListener("click", kertaa);
      toiminnot.appendChild(k);
    }
    var u = el("button", "sv-seuraava", "Pelaa uudestaan");
    u.type = "button";
    u.addEventListener("click", uusiPeli);
    toiminnot.appendChild(u);
    ui.kortti.appendChild(toiminnot);
  }

  /* ---------- näppäimistö: 1–4 valitsevat vaihtoehdon ---------- */
  document.addEventListener("keydown", function (e) {
    if (!tila || tila.lukittu || !ui.napit) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var i = parseInt(e.key, 10);
    if (i >= 1 && i <= ui.napit.length && tila.nro < tila.jono.length) {
      var b = ui.napit[i - 1];
      if (b && !b.disabled) b.click();
    }
  });

  rakenna();
  uusiPeli();
})();
