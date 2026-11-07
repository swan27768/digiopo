/**
 * DigiOpo – opettajan ohjeen liitteet avautuvaan iframeen
 *
 * Opettajan ohjeen linkki, jossa on attribuutti data-esikatselu, avautuu
 * ohjeen päälle kelluvaan kehykseen (iframe) uuden sivun sijaan. Näin ohje
 * pysyy paikallaan ja liitteen (esim. tulostettava pohja) saa auki, tulostettua
 * ja suljettua yhdellä klikkauksella.
 *
 * Käyttö:  <a href="../tehtavat/x.html" target="_blank" rel="noopener"
 *             data-esikatselu data-otsikko="Näkyvä otsikko">…</a>
 *          <script src="/js/ohje-iframe.js" defer></script>
 *
 * Ilman JavaScriptiä sekä Ctrl/Cmd/Shift-klikkauksella ja keskipainikkeella
 * linkki toimii tavallisena uutena välilehtenä (target="_blank").
 */
(function () {
  'use strict';

  var linkit = document.querySelectorAll('a[data-esikatselu]');
  if (!linkit.length) return;

  var kerros = null, kehys = null, otsikkoEl = null, uusiEl = null, sulkuBtn = null, palautus = null;

  function rakenna() {
    var st = document.createElement('style');
    st.textContent =
      '.ei-kerros{position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;background:#fff}' +
      '.ei-kerros[hidden]{display:none}' +
      '.ei-ylapalkki{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #e2e5ea;background:#f6f7f9;flex:0 0 auto}' +
      '.ei-otsikko{margin-right:auto;font:600 .95rem system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1e26;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.ei-nappi{display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:#1a1e26;font:600 .9rem system-ui,sans-serif;cursor:pointer;text-decoration:none}' +
      '.ei-nappi:hover{background:rgba(0,0,0,.07)}' +
      '.ei-nappi:focus-visible{outline:3px solid #2563eb;outline-offset:1px}' +
      '.ei-sulje{font-size:1.5rem;line-height:1}' +
      '.ei-kehys{flex:1 1 auto;width:100%;border:0;background:#fff}' +
      '@media print{.ei-kerros{display:none!important}}';
    document.head.appendChild(st);

    kerros = document.createElement('div');
    kerros.className = 'ei-kerros';
    kerros.hidden = true;
    kerros.setAttribute('role', 'dialog');
    kerros.setAttribute('aria-modal', 'true');

    var yla = document.createElement('div');
    yla.className = 'ei-ylapalkki';
    otsikkoEl = document.createElement('span');
    otsikkoEl.className = 'ei-otsikko';
    uusiEl = document.createElement('a');
    uusiEl.className = 'ei-nappi';
    uusiEl.target = '_blank';
    uusiEl.rel = 'noopener';
    uusiEl.textContent = 'Avaa uuteen välilehteen ↗';
    sulkuBtn = document.createElement('button');
    sulkuBtn.type = 'button';
    sulkuBtn.className = 'ei-nappi ei-sulje';
    sulkuBtn.setAttribute('aria-label', 'Sulje');
    sulkuBtn.title = 'Sulje';
    sulkuBtn.innerHTML = '&times;';
    sulkuBtn.addEventListener('click', sulje);
    yla.appendChild(otsikkoEl);
    yla.appendChild(uusiEl);
    yla.appendChild(sulkuBtn);

    kehys = document.createElement('iframe');
    kehys.className = 'ei-kehys';

    kerros.appendChild(yla);
    kerros.appendChild(kehys);
    document.body.appendChild(kerros);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !kerros.hidden) sulje();
    });
  }

  function avaa(a) {
    if (!kerros) rakenna();
    var otsikko = a.getAttribute('data-otsikko') || a.textContent.trim();
    otsikkoEl.textContent = otsikko;
    kehys.title = otsikko;
    kerros.setAttribute('aria-label', otsikko);
    uusiEl.href = a.href;
    kehys.src = a.href;
    palautus = a;
    kerros.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    sulkuBtn.focus();
  }

  function sulje() {
    if (!kerros) return;
    kerros.hidden = true;
    kehys.removeAttribute('src');
    document.documentElement.style.overflow = '';
    if (palautus) palautus.focus();
  }

  Array.prototype.forEach.call(linkit, function (a) {
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      avaa(a);
    });
  });
})();
