/* ============================================================
   DigiOpo · ristikko.js
   Yhteinen pelimoottori lukion ja amiksen ristikoille.

   Sivulla ennen tätä tiedostoa on data, joka määrittelee window.RISTIKKO:
     { id, otsikko, ohje, vari, variTumma, variVaalea,
       rivit, sarakkeet,
       sanat: [ { sana, rivi, sarake, suunta: "across"|"down", vihje } ] }

   Pisteet: jokainen oikein ratkaistu sana = 10 pistettä. Ei miinuspisteitä.
   "Vinkki" (yksi kirjain) ei vähennä pisteitä.
   "Paljasta sana" täyttää sanan, mutta siitä ei saa pisteitä.
   ============================================================ */
(function () {
  "use strict";

  var C = window.RISTIKKO;
  var juuri = document.getElementById("ristikko");
  if (!C || !C.sanat || !juuri) return;

  var ROWS = C.rivit, COLS = C.sarakkeet;
  var PISTEET = 10;
  var TALLENNUS = "digiopo-ristikko-" + (C.id || "peli");
  var WORDS = C.sanat.map(function (s, i) {
    return { id: i + 1, word: s.sana, row: s.rivi, col: s.sarake, dir: s.suunta, clue: s.vihje };
  });

  var sol, user, cells, nums, solved, revealed, locked;
  var activeId = null, aR = -1, aC = -1;
  var ui = {};

  /* ---------- apurit ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function cellOf(w, i) {
    return { r: w.dir === "across" ? w.row : w.row + i, c: w.dir === "across" ? w.col + i : w.col };
  }
  function covers(w, r, c) {
    for (var i = 0; i < w.word.length; i++) {
      var p = cellOf(w, i);
      if (p.r === r && p.c === c) return true;
    }
    return false;
  }
  function wordById(id) {
    for (var i = 0; i < WORDS.length; i++) if (WORDS[i].id === id) return WORDS[i];
    return null;
  }
  function parasLue() {
    try { return parseInt(window.localStorage.getItem(TALLENNUS), 10) || 0; } catch (e) { return 0; }
  }
  function parasKirjoita(p) {
    try { window.localStorage.setItem(TALLENNUS, String(p)); } catch (e) {}
  }
  var toastT;
  function ilmoita(teksti, tyyppi) {
    ui.palaute.textContent = teksti;
    ui.palaute.className = "rs-palaute rs-palaute-" + (tyyppi || "info");
    ui.palaute.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { ui.palaute.hidden = true; }, 3500);
  }

  /* ---------- ratkaisu ja numerointi ---------- */
  function rakennaRatkaisu() {
    var g = [];
    for (var r = 0; r < ROWS; r++) g.push(new Array(COLS).fill(null));
    WORDS.forEach(function (w) {
      for (var i = 0; i < w.word.length; i++) {
        var p = cellOf(w, i);
        g[p.r][p.c] = w.word.charAt(i);
      }
    });
    return g;
  }
  function numeroi() {
    var n = {}, solunNro = {}, nro = 1;
    WORDS.slice().sort(function (a, b) { return a.row !== b.row ? a.row - b.row : a.col - b.col; })
      .forEach(function (w) {
        var k = w.row + "," + w.col;
        if (!solunNro[k]) solunNro[k] = nro++;
        n[w.id] = solunNro[k];
      });
    return n;
  }

  /* ---------- runko ---------- */
  function rakennaRunko() {
    juuri.textContent = "";
    juuri.className = "rs";
    if (C.vari) juuri.style.setProperty("--rs-vari", C.vari);
    if (C.variTumma) juuri.style.setProperty("--rs-vari-tumma", C.variTumma);
    if (C.variVaalea) juuri.style.setProperty("--rs-vari-vaalea", C.variVaalea);
    juuri.style.setProperty("--rs-sarakkeet", String(COLS));

    juuri.appendChild(el("h1", "rs-otsikko", C.otsikko || "Ristikko"));
    juuri.appendChild(el("p", "rs-ohje", C.ohje || ""));

    var ohjeet = el("details", "rs-ohjeet");
    ohjeet.appendChild(el("summary", null, "Näytä pelin ohjeet"));
    var ul = el("ul");
    [
      "Napauta ruutua tai vihjettä ja kirjoita vastaus. Kursori siirtyy itse eteenpäin.",
      "Napauta samaa ruutua uudestaan, jos haluat vaihtaa suuntaa (vaaka / pysty).",
      "Jokaisesta oikein täytetystä sanasta saat 10 pistettä.",
      "Vinkki paljastaa yhden kirjaimen eikä vähennä pisteitä.",
      "Paljasta sana täyttää sanan puolestasi, mutta siitä ei tule pisteitä."
    ].forEach(function (t) { ul.appendChild(el("li", null, t)); });
    ohjeet.appendChild(ul);
    juuri.appendChild(ohjeet);

    var tila = el("div", "rs-tilarivi");
    ui.sanat = el("span", "rs-pilli");
    ui.pisteet = el("span", "rs-pilli rs-pilli-pisteet");
    ui.pisteet.setAttribute("aria-live", "polite");
    tila.appendChild(ui.sanat);
    tila.appendChild(ui.pisteet);
    juuri.appendChild(tila);

    var palkki = el("div", "rs-palkki");
    palkki.setAttribute("role", "progressbar");
    palkki.setAttribute("aria-label", "Ristikko täyttyy");
    palkki.setAttribute("aria-valuemin", "0");
    palkki.setAttribute("aria-valuemax", String(WORDS.length));
    ui.palkki = palkki;
    ui.palkkiSisus = el("div", "rs-palkki-sisus");
    palkki.appendChild(ui.palkkiSisus);
    juuri.appendChild(palkki);

    ui.vihjeLaatikko = el("div", "rs-aktiivinen");
    ui.vihjeLaatikko.setAttribute("aria-live", "polite");
    ui.vihjeNro = el("strong", "rs-aktiivinen-nro");
    ui.vihjeTeksti = el("span");
    ui.vihjeLaatikko.appendChild(ui.vihjeNro);
    ui.vihjeLaatikko.appendChild(ui.vihjeTeksti);
    juuri.appendChild(ui.vihjeLaatikko);

    var asettelu = el("div", "rs-asettelu");
    var ruudukkoLaatikko = el("div", "rs-ruudukko-laatikko");
    ui.ruudukko = el("div", "rs-ruudukko");
    ui.ruudukko.setAttribute("role", "group");
    ui.ruudukko.setAttribute("aria-label", "Ristikon ruudukko");
    ui.ruudukko.style.gridTemplateColumns = "repeat(" + COLS + ", var(--rs-ruutu))";
    ruudukkoLaatikko.appendChild(ui.ruudukko);

    var vihjeet = el("div", "rs-vihjeet");
    var vaaka = el("div", "rs-vihjeosa");
    vaaka.appendChild(el("h2", null, "→ Vaakasuoraan"));
    ui.vaaka = el("div");
    vaaka.appendChild(ui.vaaka);
    var pysty = el("div", "rs-vihjeosa");
    pysty.appendChild(el("h2", null, "↓ Pystysuoraan"));
    ui.pysty = el("div");
    pysty.appendChild(ui.pysty);
    vihjeet.appendChild(vaaka);
    vihjeet.appendChild(pysty);

    asettelu.appendChild(ruudukkoLaatikko);
    asettelu.appendChild(vihjeet);
    juuri.appendChild(asettelu);

    var toiminnot = el("div", "rs-toiminnot");
    function nappi(teksti, cls, fn) {
      var b = el("button", "rs-nappi " + cls, teksti);
      b.type = "button";
      b.addEventListener("click", fn);
      toiminnot.appendChild(b);
      return b;
    }
    nappi("✓ Tarkista", "rs-nappi-ensisijainen", tarkista);
    nappi("💡 Vinkki", "", vinkki);
    nappi("👁 Paljasta sana", "", paljasta);
    nappi("↺ Aloita alusta", "", alusta);
    juuri.appendChild(toiminnot);

    ui.palaute = el("div", "rs-palaute");
    ui.palaute.setAttribute("role", "status");
    ui.palaute.hidden = true;
    juuri.appendChild(ui.palaute);

    ui.tulos = el("section", "rs-tulos");
    ui.tulos.hidden = true;
    juuri.appendChild(ui.tulos);
  }

  /* ---------- ruudukko ja vihjeet ---------- */
  function piirraRuudukko() {
    ui.ruudukko.textContent = "";
    cells = [];
    var alut = {};
    WORDS.forEach(function (w) { alut[w.row + "," + w.col] = nums[w.id]; });

    for (var r = 0; r < ROWS; r++) {
      cells[r] = [];
      for (var c = 0; c < COLS; c++) {
        var div = el("div", "rs-ruutu");
        if (sol[r][c]) {
          div.classList.add("rs-valkoinen");
          var inp = document.createElement("input");
          inp.type = "text";
          inp.maxLength = 1;
          inp.autocomplete = "off";
          inp.autocapitalize = "characters";
          inp.spellcheck = false;
          inp.setAttribute("aria-label", "Rivi " + (r + 1) + ", sarake " + (c + 1));
          inp.dataset.r = r;
          inp.dataset.c = c;
          inp.addEventListener("mousedown", klikkaus(r, c));
          inp.addEventListener("touchstart", klikkaus(r, c), { passive: false });
          inp.addEventListener("keydown", nappain);
          inp.addEventListener("input", syote);
          div.appendChild(inp);
          if (alut[r + "," + c]) div.appendChild(el("span", "rs-ruutu-nro", String(alut[r + "," + c])));
        } else {
          div.classList.add("rs-musta");
        }
        ui.ruudukko.appendChild(div);
        cells[r][c] = div;
      }
    }
  }
  function klikkaus(r, c) {
    return function (e) { e.preventDefault(); solunKlikkaus(r, c); };
  }

  function piirraVihjeet() {
    ui.vaaka.textContent = "";
    ui.pysty.textContent = "";
    function jarjesta(dir) {
      return WORDS.filter(function (w) { return w.dir === dir; })
        .sort(function (a, b) { return nums[a.id] - nums[b.id]; });
    }
    function rivi(cont, w) {
      var b = el("button", "rs-vihje");
      b.type = "button";
      b.id = "rs-vihje-" + w.id;
      b.appendChild(el("span", "rs-vihje-nro", nums[w.id] + "."));
      b.appendChild(el("span", "rs-vihje-teksti", w.clue + " (" + w.word.length + " kirjainta)"));
      b.addEventListener("click", function () { aktivoiSana(w.id, true); });
      cont.appendChild(b);
    }
    jarjesta("across").forEach(function (w) { rivi(ui.vaaka, w); });
    jarjesta("down").forEach(function (w) { rivi(ui.pysty, w); });
  }

  /* ---------- aktivointi ---------- */
  function tyhjennaKorostus() {
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      if (cells[r][c]) cells[r][c].classList.remove("rs-aktiivinen-sana", "rs-aktiivinen-ruutu");
    }
  }
  function aktivoiSana(id, ensimmainenTyhja, pr, pc) {
    var w = wordById(id);
    if (!w) return;
    activeId = id;
    ui.vihjeNro.textContent = nums[id] + (w.dir === "across" ? "→ " : "↓ ");
    ui.vihjeTeksti.textContent = w.clue + " (" + w.word.length + " kirjainta)";

    tyhjennaKorostus();
    for (var i = 0; i < w.word.length; i++) {
      var p = cellOf(w, i);
      cells[p.r][p.c].classList.add("rs-aktiivinen-sana");
    }
    var fr = pr >= 0 && pr != null ? pr : w.row;
    var fc = pc >= 0 && pc != null ? pc : w.col;
    if (ensimmainenTyhja) {
      fr = w.row; fc = w.col;
      for (var j = 0; j < w.word.length; j++) {
        var q = cellOf(w, j);
        if (user[q.r][q.c] !== sol[q.r][q.c]) { fr = q.r; fc = q.c; break; }
      }
    }
    asetaRuutu(fr, fc);

    var vanhat = juuri.querySelectorAll(".rs-vihje.rs-vihje-aktiivinen");
    for (var k = 0; k < vanhat.length; k++) vanhat[k].classList.remove("rs-vihje-aktiivinen");
    var v = document.getElementById("rs-vihje-" + id);
    if (v) v.classList.add("rs-vihje-aktiivinen");
  }
  function asetaRuutu(r, c) {
    if (aR >= 0 && cells[aR] && cells[aR][aC]) cells[aR][aC].classList.remove("rs-aktiivinen-ruutu");
    aR = r; aC = c;
    if (cells[r] && cells[r][c]) {
      cells[r][c].classList.add("rs-aktiivinen-ruutu");
      var inp = cells[r][c].querySelector("input");
      if (inp) { inp.focus({ preventScroll: true }); inp.select(); }
    }
  }
  function solunKlikkaus(r, c) {
    if (!sol[r][c]) return;
    var kattavat = WORDS.filter(function (w) { return covers(w, r, c); });
    if (!kattavat.length) return;
    if (activeId) {
      var nykyinen = kattavat.filter(function (w) { return w.id === activeId; })[0];
      if (nykyinen) {
        var toinen = kattavat.filter(function (w) { return w.id !== activeId; })[0];
        if (toinen) { aktivoiSana(toinen.id, false, r, c); return; }
        asetaRuutu(r, c);
        return;
      }
    }
    aktivoiSana(kattavat[0].id, false, r, c);
  }

  /* ---------- syöte ---------- */
  function syote(e) {
    var r = parseInt(e.target.dataset.r, 10), c = parseInt(e.target.dataset.c, 10);
    if (locked[r][c]) { e.target.value = user[r][c]; return; }
    var val = e.target.value.toUpperCase().replace(/[^A-ZÄÖÅ]/g, "");
    if (val.length > 1) val = val.slice(-1);
    e.target.value = val;
    user[r][c] = val;
    cells[r][c].classList.remove("rs-vaara", "rs-oikea");
    paivita();
    tarkistaSanat();
    if (val) etene(r, c);
  }
  function nappain(e) {
    var r = parseInt(e.target.dataset.r, 10), c = parseInt(e.target.dataset.c, 10);
    var k = e.key;
    if (k === "Backspace") {
      e.preventDefault();
      if (locked[r][c]) { peruuta(r, c); return; }
      if (user[r][c]) {
        user[r][c] = "";
        e.target.value = "";
        cells[r][c].classList.remove("rs-vaara", "rs-oikea");
        paivita();
      } else peruuta(r, c);
    } else if (k === "ArrowRight") { e.preventDefault(); siirra(r, c, 0, 1); }
    else if (k === "ArrowLeft") { e.preventDefault(); siirra(r, c, 0, -1); }
    else if (k === "ArrowDown") { e.preventDefault(); siirra(r, c, 1, 0); }
    else if (k === "ArrowUp") { e.preventDefault(); siirra(r, c, -1, 0); }
    else if (k === "Tab") {
      e.preventDefault();
      var i = -1;
      for (var j = 0; j < WORDS.length; j++) if (WORDS[j].id === activeId) i = j;
      var n = WORDS[(i + (e.shiftKey ? -1 : 1) + WORDS.length) % WORDS.length];
      aktivoiSana(n.id, true);
    }
  }
  function etene(r, c) {
    var w = wordById(activeId);
    if (!w) return;
    var nr = r + (w.dir === "down" ? 1 : 0), nc = c + (w.dir === "across" ? 1 : 0);
    if (nr < ROWS && nc < COLS && sol[nr][nc]) asetaRuutu(nr, nc);
  }
  function peruuta(r, c) {
    var w = wordById(activeId);
    if (!w) return;
    var nr = r - (w.dir === "down" ? 1 : 0), nc = c - (w.dir === "across" ? 1 : 0);
    if (nr >= 0 && nc >= 0 && sol[nr][nc]) {
      asetaRuutu(nr, nc);
      if (!locked[nr][nc]) {
        user[nr][nc] = "";
        var inp = cells[nr][nc].querySelector("input");
        if (inp) inp.value = "";
        cells[nr][nc].classList.remove("rs-vaara", "rs-oikea");
        paivita();
      }
    }
  }
  function siirra(r, c, dr, dc) {
    var nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || !sol[nr][nc]) return;
    var suunta = dr !== 0 ? "down" : "across";
    var w = WORDS.filter(function (x) { return x.dir === suunta && covers(x, nr, nc); })[0];
    if (w && w.id !== activeId) aktivoiSana(w.id, false, nr, nc);
    else asetaRuutu(nr, nc);
  }

  /* ---------- pisteet ja ratkaisu ---------- */
  function pisteet() {
    var n = 0;
    solved.forEach(function (id) { if (!revealed.has(id)) n += PISTEET; });
    return n;
  }
  function paivita() {
    ui.sanat.textContent = "Sanoja " + solved.size + " / " + WORDS.length;
    ui.pisteet.textContent = "Pisteet: " + pisteet();
    ui.palkkiSisus.style.width = (solved.size / WORDS.length * 100) + "%";
    ui.palkki.setAttribute("aria-valuenow", String(solved.size));
  }
  function lukitseSana(w) {
    for (var i = 0; i < w.word.length; i++) {
      var p = cellOf(w, i);
      locked[p.r][p.c] = true;
      cells[p.r][p.c].classList.remove("rs-vaara");
      cells[p.r][p.c].classList.add("rs-oikea");
      var inp = cells[p.r][p.c].querySelector("input");
      if (inp) inp.readOnly = true;
    }
    var v = document.getElementById("rs-vihje-" + w.id);
    if (v) v.classList.add("rs-vihje-ratkaistu");
  }
  function tarkistaSanat() {
    WORDS.forEach(function (w) {
      if (solved.has(w.id)) return;
      var tayttyy = true, oikein = true;
      for (var i = 0; i < w.word.length; i++) {
        var p = cellOf(w, i);
        var arvo = user[p.r][p.c];
        if (!arvo) tayttyy = false;
        if (arvo !== w.word.charAt(i)) oikein = false;
      }
      if (oikein) {
        solved.add(w.id);
        lukitseSana(w);
        ilmoita("Oikein! " + w.word + " +" + PISTEET + " pistettä ✓", "oikein");
        paivita();
      } else if (tayttyy && !w._varoitettu) {
        w._varoitettu = true;
        ilmoita("Sana " + nums[w.id] + (w.dir === "across" ? "→" : "↓") + " ei ole vielä oikein. Tarkista kirjaimet.", "vaara");
      }
      if (!tayttyy || oikein) w._varoitettu = false;
    });
    if (solved.size === WORDS.length) valmis();
  }

  function tarkista() {
    var oikein = 0, vaarin = 0;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      if (!sol[r][c] || !user[r][c] || locked[r][c]) continue;
      cells[r][c].classList.remove("rs-oikea", "rs-vaara");
      if (user[r][c] === sol[r][c]) { cells[r][c].classList.add("rs-oikea"); oikein++; }
      else { cells[r][c].classList.add("rs-vaara"); vaarin++; }
    }
    if (!oikein && !vaarin) ilmoita("Täytä ensin muutama kirjain.", "info");
    else if (vaarin) ilmoita("Väärin meni " + vaarin + " ruutua. Ne näkyvät punaisella. Pisteitä ei vähennetä.", "vaara");
    else ilmoita("Kaikki kirjaimet ovat oikein toistaiseksi! 🎉", "oikein");
  }

  function vinkki() {
    var w = wordById(activeId);
    if (!w) { ilmoita("Valitse ensin sana.", "info"); return; }
    if (solved.has(w.id)) { ilmoita("Tämä sana on jo oikein.", "oikein"); return; }
    for (var i = 0; i < w.word.length; i++) {
      var p = cellOf(w, i);
      if (user[p.r][p.c] !== w.word.charAt(i)) {
        user[p.r][p.c] = w.word.charAt(i);
        var inp = cells[p.r][p.c].querySelector("input");
        if (inp) inp.value = w.word.charAt(i);
        cells[p.r][p.c].classList.remove("rs-vaara");
        cells[p.r][p.c].classList.add("rs-oikea");
        ilmoita("Vinkki: kirjain " + (i + 1) + " on " + w.word.charAt(i) + ". Pisteitä ei vähennetä.", "info");
        paivita();
        tarkistaSanat();
        return;
      }
    }
  }

  function paljasta() {
    var w = wordById(activeId);
    if (!w) { ilmoita("Valitse ensin sana.", "info"); return; }
    if (solved.has(w.id)) { ilmoita("Tämä sana on jo oikein.", "oikein"); return; }
    for (var i = 0; i < w.word.length; i++) {
      var p = cellOf(w, i);
      user[p.r][p.c] = w.word.charAt(i);
      var inp = cells[p.r][p.c].querySelector("input");
      if (inp) inp.value = w.word.charAt(i);
    }
    revealed.add(w.id);
    solved.add(w.id);
    lukitseSana(w);
    ilmoita("Sana oli " + w.word + ". Paljastetusta sanasta ei tule pisteitä.", "info");
    paivita();
    tarkistaSanat();
  }

  function valmis() {
    var pist = pisteet();
    var max = WORDS.length * PISTEET;
    var ennatys = parasLue();
    var uusi = pist > ennatys;
    if (uusi) parasKirjoita(pist);

    ui.tulos.textContent = "";
    ui.tulos.hidden = false;
    ui.tulos.appendChild(el("h2", null, pist === max ? "Ristikko valmis, täydet pisteet! 🎉" : "Ristikko valmis! 🎓"));
    var luvut = el("div", "rs-luvut");
    function luku(arvo, nimi) {
      var d = el("div", "rs-luku");
      d.appendChild(el("strong", null, arvo));
      d.appendChild(el("span", null, nimi));
      luvut.appendChild(d);
    }
    luku(pist + " / " + max, "Pisteet");
    luku(String(revealed.size), "Paljastettua sanaa");
    luku(String(Math.max(ennatys, pist)), uusi ? "Uusi ennätys! 🎉" : "Oma ennätys");
    ui.tulos.appendChild(luvut);
    var uudestaan = el("button", "rs-nappi rs-nappi-ensisijainen", "Pelaa uudestaan");
    uudestaan.type = "button";
    uudestaan.addEventListener("click", alusta);
    ui.tulos.appendChild(uudestaan);
    ui.tulos.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ---------- aloitus ---------- */
  function alusta() {
    sol = rakennaRatkaisu();
    nums = numeroi();
    user = []; locked = [];
    for (var r = 0; r < ROWS; r++) { user.push(new Array(COLS).fill("")); locked.push(new Array(COLS).fill(false)); }
    solved = new Set();
    revealed = new Set();
    activeId = null; aR = -1; aC = -1;
    WORDS.forEach(function (w) { w._varoitettu = false; });
    ui.tulos.hidden = true;
    ui.palaute.hidden = true;
    ui.vihjeNro.textContent = "";
    ui.vihjeTeksti.textContent = "Napauta ruutua tai vihjettä aloittaaksesi.";
    piirraRuudukko();
    piirraVihjeet();
    paivita();
  }

  rakennaRunko();
  alusta();
})();
