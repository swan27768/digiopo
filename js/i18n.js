/**
 * DigiOpo i18n – kielenvaihtologiikka
 * Tukee: fi, sv, en, ru, et, ar, es, so, sq, fa, tr
 * RTL: ar, fa
 */
(function () {
  'use strict';

  var SUPPORTED = ['fi', 'sv', 'en', 'ru', 'et', 'ar', 'es', 'so', 'sq', 'fa', 'tr'];
  var RTL_LANGS  = ['ar', 'fa'];

  var LANG_LABELS = {
    fi: '🇫🇮 Suomi',
    sv: '🇸🇪 Svenska',
    en: '🇬🇧 English',
    ru: '🇷🇺 Русский',
    et: '🇪🇪 Eesti',
    ar: '🇸🇦 العربية',
    es: '🇪🇸 Español',
    so: '🇸🇴 Soomaali',
    sq: '🇦🇱 Shqip',
    fa: '🇮🇷 فارسی',
    tr: '🇹🇷 Türkçe'
  };

  var currentLang = null;

  /* ── Hae JSON-tiedoston polku sijainnin perusteella ── */
  function translationsBase() {
    // Sivut on kansiossa /sivut/ → noustaan ylös
    var path = window.location.pathname;
    if (path.indexOf('/sivut/') !== -1) {
      return '../translations/';
    }
    return './translations/';
  }

  /* ── Navigoi sisäkkäinen avain pistenotaatiolla ── */
  function getKey(obj, key) {
    var parts = key.split('.');
    var result = obj;
    for (var i = 0; i < parts.length; i++) {
      if (result == null || typeof result !== 'object') return null;
      result = result[parts[i]];
    }
    return (result !== undefined && result !== null) ? result : null;
  }

  /* ── Näytä/piilota fi-only-varoitukset ── */
  function applyWarnings(lang, t) {
    var els = document.querySelectorAll('[data-fi-only]');
    var msg = (t && getKey(t, 'fi_only')) || '⚠️ This content is only available in Finnish';
    var isFi = (lang === 'fi');

    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var old = el.querySelector('.fi-only-notice');
      if (old) old.parentNode.removeChild(old);

      if (!isFi) {
        var notice = document.createElement('div');
        notice.className = 'fi-only-notice';
        notice.setAttribute('aria-live', 'polite');
        notice.style.cssText = [
          'background:#fef3c7',
          'border:1.5px solid #f59e0b',
          'border-radius:10px',
          'padding:10px 14px',
          'font-size:0.85rem',
          'font-weight:600',
          'color:#78350f',
          'margin-bottom:12px',
          'display:flex',
          'align-items:center',
          'gap:8px'
        ].join(';');
        notice.textContent = msg;
        el.insertBefore(notice, el.firstChild);
      }
    }
  }

  /* ── Sovella käännökset DOM:iin ── */
  function applyTranslations(t) {
    // Tekstisisältö
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      var val = getKey(t, key);
      if (val !== null) {
        // Säilytä otsikkoon mahdollisesti lisätty teoria-nappi (i-linkki):
        // pelkkä textContent-asetus pyyhkisi sen pois.
        var nappi = els[i].querySelector('.teoria-nappi');
        els[i].textContent = val;
        if (nappi) els[i].appendChild(nappi);
      }
    }

    // HTML-sisältö (esim. <strong>-tagit)
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlEls.length; j++) {
      var hKey = htmlEls[j].getAttribute('data-i18n-html');
      var hVal = getKey(t, hKey);
      if (hVal !== null) htmlEls[j].innerHTML = hVal;
    }

    // Aria-label
    var ariaEls = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < ariaEls.length; k++) {
      var aKey = ariaEls[k].getAttribute('data-i18n-aria');
      var aVal = getKey(t, aKey);
      if (aVal !== null) ariaEls[k].setAttribute('aria-label', aVal);
    }

    // Sivun otsikko
    var titleKey = getKey(t, 'meta.title');
    if (titleKey) document.title = titleKey;

    // Meta description
    var metaDesc = document.querySelector('meta[name="description"]');
    var descKey = getKey(t, 'meta.description');
    if (metaDesc && descKey) metaDesc.setAttribute('content', descKey);
  }

  /* ── Aseta tekstisuunta ja lang-attribuutti ── */
  function applyDirection(lang) {
    var isRTL = RTL_LANGS.indexOf(lang) !== -1;
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }

  /* ── Päivitä pudotusvalikko ── */
  function updatePicker() {
    var picker = document.getElementById('i18n-picker');
    if (picker) picker.value = currentLang;
  }

  /* ── Lataa kielitiedosto ja sovella ── */
  function loadLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'fi';

    var url = translationsBase() + lang + '.json';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (t) {
        currentLang = lang;
        try { localStorage.setItem('digiopo-lang', lang); } catch (e) {}
        window.DIGIOPO_T = t;
        window.DIGIOPO_LANG = lang;
        applyTranslations(t);
        applyWarnings(lang, t);
        applyDirection(lang);
        updatePicker();
        document.dispatchEvent(new CustomEvent('digiopo:langchange', { detail: { lang: lang, t: t } }));
      })
      .catch(function (err) {
        console.warn('DigiOpo i18n: ei voitu ladata kieltä', lang, err);
        if (lang !== 'fi') loadLang('fi');
      });
  }

  /* ── Tunnista käyttäjän kielivalinta ── */
  function detectLang() {
    try {
      var saved = localStorage.getItem('digiopo-lang');
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}

    var browser = (navigator.language || 'fi').split('-')[0].toLowerCase();
    if (SUPPORTED.indexOf(browser) !== -1) return browser;
    return 'fi';
  }

  /* ── Rakenna kielivalitsin ── */
  function buildPicker() {
    var host = document.querySelector('.navbar .nav-right') || document.querySelector('.navbar');
    if (!host) return;

    var wrapper = document.createElement('div');
    wrapper.id = 'i18n-wrapper';
    wrapper.style.cssText = [
      'display:flex',
      'align-items:center'
    ].join(';');

    var select = document.createElement('select');
    select.id = 'i18n-picker';
    select.setAttribute('aria-label', 'Valitse kieli / Select language');
    select.style.cssText = [
      'font-size:0.82rem',
      'border:1.5px solid #e9d5ff',
      'border-radius:8px',
      'padding:5px 8px',
      'background:#faf5ff',
      'color:#4c1d95',
      'cursor:pointer',
      'outline:none',
      'font-family:inherit',
      'transition:border-color 0.2s'
    ].join(';');

    SUPPORTED.forEach(function (code) {
      var opt = document.createElement('option');
      opt.value = code;
      opt.textContent = LANG_LABELS[code] || code;
      select.appendChild(opt);
    });

    select.addEventListener('change', function (e) {
      loadLang(e.target.value);
    });

    select.addEventListener('mouseover', function () {
      select.style.borderColor = '#7c3aed';
    });
    select.addEventListener('mouseout', function () {
      select.style.borderColor = '#e9d5ff';
    });

    wrapper.appendChild(select);
    host.appendChild(wrapper);
  }

  /* ── Käynnistys ── */
  function init() {
    buildPicker();
    loadLang(detectLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
