/* ============================================================
   DigiOpo · ohje-paneeli.js
   Avaa opettajan ohjeet kirjan viereen oikealle liukuvaan
   paneeliin (omaan kehykseen / iframeen) uuden välilehden sijaan.

   Käyttöönotto:
     1) Kopioi tämä tiedosto kansioon  /js/
     2) Lisää jokaiselle luokkasivulle juuri ennen </body>:
          <script defer src="/js/ohje-paneeli.js"></script>

   Ei muuta tarvita: moduuli nappaa automaattisesti kaikki
   linkit  <a class="opettaja-lataus" ...>  ja avaa ne paneeliin.
   target="_blank" jää varmuudeksi — ilman JS:ää linkki toimii
   yhä uutena välilehtenä, ja Ctrl/Cmd-klikkaus avaa uuden
   välilehden niin kuin ennenkin.
   ============================================================ */
(function () {
  "use strict";
  var PANEL_ID = "ohje-paneeli";
  // Napattavat linkit: opettajan ohje -painikkeet eri sivuilla.
  // download-linkit (esim. tulostettavat PDF-passit) jätetään rauhaan.
  var LINK_SEL = "a.opettaja-lataus, a.opettajalle-pallero, a[data-ohje]";

  // "Lukutila": kevyt tyyli, joka syötetään avattuun ohjeeseen (sama origin),
  // jotta se on mukava lukea paneelissa eikä näytä tulostusarkilta.
  // Tulostus tapahtuu paneelin yläpalkista, joten ohjeen oma iso
  // "Tulosta ohje" -nappi piilotetaan.
  var READING_CSS =
    "body{font-size:16.5px!important;line-height:1.62!important;min-height:0!important;background:#fff!important}" +
    ".btn-print,.tulosta-btn,.print-btn,.print,.ohje-tulosta,button[onclick*='print'],a[onclick*='print']{display:none!important}";

  function injectOnce() {
    if (document.getElementById(PANEL_ID)) return;

    var css =
      ".ohje-scrim{position:fixed;inset:0;background:rgba(20,23,29,.30);opacity:0;transition:opacity .25s;z-index:9998}" +
      ".ohje-auki .ohje-scrim{opacity:1}" +
      "@media(min-width:900px){.ohje-scrim{background:transparent;pointer-events:none}}" +
      ".ohje-paneeli{position:fixed;top:0;right:0;height:100vh;height:100dvh;width:min(680px,52vw);max-width:100vw;" +
      "background:var(--ohje-bg,#fff);box-shadow:-12px 0 40px rgba(20,23,29,.18);transform:translateX(101%);" +
      "transition:transform .26s cubic-bezier(.4,0,.2,1);z-index:9999;display:flex;flex-direction:column}" +
      ".ohje-auki .ohje-paneeli{transform:translateX(0)}" +
      "@media(max-width:899px){.ohje-paneeli{width:100vw}}" +
      ".ohje-ptop{display:flex;align-items:center;gap:8px;padding:9px 12px;flex:0 0 auto;" +
      "border-bottom:1px solid var(--ohje-line,#e2e5ea);background:var(--ohje-bar,#f6f7f9)}" +
      ".ohje-ptitle{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:600;font-size:.95rem;" +
      "color:var(--ohje-ink,#1a1e26);margin-right:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".ohje-btn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;" +
      "border:0;background:transparent;color:var(--ohje-ink,#1a1e26);cursor:pointer;border-radius:8px;" +
      "font-size:1rem;text-decoration:none;line-height:1}" +
      ".ohje-btn:hover{background:rgba(0,0,0,.07)}" +
      ".ohje-sulje{font-size:1.5rem}" +
      ".ohje-frame{flex:1 1 auto;border:0;width:100%;background:#fff}" +
      "@media(min-width:900px){body.ohje-auki{padding-right:min(680px,52vw)}}" +
      "@media(prefers-reduced-motion:reduce){.ohje-paneeli,.ohje-scrim{transition:none}}" +
      "@media(prefers-color-scheme:dark){.ohje-paneeli{--ohje-bg:#1c2129;--ohje-bar:#14171d;--ohje-ink:#eef0f4;--ohje-line:#2c333f}}";

    var style = document.createElement("style");
    style.setAttribute("data-ohje-paneeli", "");
    style.textContent = css;
    document.head.appendChild(style);

    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="ohje-scrim" data-close hidden></div>' +
      '<aside id="' + PANEL_ID + '" class="ohje-paneeli" role="dialog" aria-label="Opettajan ohje" hidden>' +
        '<header class="ohje-ptop">' +
          '<span class="ohje-ptitle">Opettajan ohje</span>' +
          '<button type="button" class="ohje-btn ohje-tulosta" title="Tulosta ohje" aria-label="Tulosta ohje">\u2399</button>' +
          '<a class="ohje-btn ohje-uusi" target="_blank" rel="noopener" title="Avaa uuteen välilehteen" aria-label="Avaa uuteen välilehteen">&#8599;</a>' +
          '<button type="button" class="ohje-btn ohje-sulje" data-close title="Sulje" aria-label="Sulje ohje">&times;</button>' +
        '</header>' +
        '<iframe class="ohje-frame" title="Opettajan ohje"></iframe>' +
      '</aside>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t && (t.hasAttribute && t.hasAttribute("data-close"))) sulje();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") sulje();
    });

    // Tulosta paneelin yläpalkista (tulostaa avatun ohjeen)
    document.getElementById(PANEL_ID)
      .querySelector(".ohje-tulosta")
      .addEventListener("click", function () {
        var f = document.getElementById(PANEL_ID).querySelector(".ohje-frame");
        try { f.contentWindow.focus(); f.contentWindow.print(); } catch (err) {}
      });
  }

  // Syötä lukutila-tyyli avattuun ohjeeseen (sama origin)
  function syotaLukutila(frame) {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.head) return;
      if (doc.getElementById("ohje-reading-css")) return;
      var st = doc.createElement("style");
      st.id = "ohje-reading-css";
      st.textContent = READING_CSS;
      doc.head.appendChild(st);
    } catch (err) {}
  }

  function avaa(url, otsikko) {
    if (!url) return;
    injectOnce();
    var panel = document.getElementById(PANEL_ID);
    var frame = panel.querySelector(".ohje-frame");
    var scrim = document.querySelector(".ohje-scrim");
    panel.querySelector(".ohje-ptitle").textContent = otsikko || "Opettajan ohje";
    panel.querySelector(".ohje-uusi").href = url;
    frame.onload = function () { syotaLukutila(frame); };
    if (frame.getAttribute("src") !== url) frame.setAttribute("src", url);
    else syotaLukutila(frame);
    panel.hidden = false;
    scrim.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { document.body.classList.add("ohje-auki"); });
    });
  }

  function sulje() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel || panel.hidden) return;
    var scrim = document.querySelector(".ohje-scrim");
    document.body.classList.remove("ohje-auki");
    window.setTimeout(function () {
      panel.hidden = true;
      if (scrim) scrim.hidden = true;
    }, 280);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest(LINK_SEL) : null;
    if (!a || e.defaultPrevented) return;
    // download-linkit (tulostettavat PDF:t yms.) ladataan normaalisti
    if (a.hasAttribute("download")) return;
    // salli uusi välilehti näppäinyhdistelmillä ja hiiren keskipainikkeella
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var otsikko = a.getAttribute("data-ohje-title") || "Opettajan ohje";
    avaa(a.getAttribute("href"), otsikko);
  });

  // valinnainen ohjelmallinen käyttö: OhjePaneeli.avaa(url, otsikko)
  window.OhjePaneeli = { avaa: avaa, sulje: sulje };
})();
