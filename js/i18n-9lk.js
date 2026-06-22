/**
 * DigiOpo i18n – 9. luokka sivukohtaiset käännökset
 * Käyttää CSS-selectoreja, ei vaadi data-i18n muutoksia HTML:ään.
 * Kuuntelee digiopo:langchange tapahtumaa i18n.js:stä.
 */
(function () {
  'use strict';

  /* ── Apufunktiot ── */
  function setTxt(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  function setAllTxt(sel, vals) {
    if (!vals || !vals.length) return;
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length && i < vals.length; i++) {
      els[i].textContent = vals[i];
    }
  }

  function setHTML(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.innerHTML = val;
  }

  function setAttr(sel, attr, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }

  function g(obj, key) {
    var parts = key.split('.');
    var res = obj;
    for (var i = 0; i < parts.length; i++) {
      if (!res || typeof res !== 'object') return null;
      res = res[parts[i]];
    }
    return res != null ? res : null;
  }

  /* ── Pääkäyttö ── */
  function applyG9(t) {
    var g9 = t && t.g9;
    if (!g9) return;

    /* Meta */
    if (g9.meta) {
      if (g9.meta.title) document.title = g9.meta.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && g9.meta.description) metaDesc.setAttribute('content', g9.meta.description);
    }

    /* Navigaatio - takaisin-linkki */
    setAttr('.nav-logo', 'aria-label', g(g9, 'nav.back_aria'));

    /* Sivupalkki */
    setTxt('.book-page-left h3', g(g9, 'sidebar.heading'));
    setTxt('.aihelista a[href="#johdanto"]', g(g9, 'sidebar.link_johdanto'));
    setTxt('.aihelista a[href="#jatko"]', g(g9, 'sidebar.link_jatko'));
    setTxt('.aihelista a[href="#ajattelu"]', g(g9, 'sidebar.link_ajattelu'));
    setTxt('.aihelista a[href="#tet"]', g(g9, 'sidebar.link_tet'));
    setTxt('.aihelista a[href="#paatoksenteko"]', g(g9, 'sidebar.link_paatoksenteko'));
    setTxt('.aihelista a[href="#yhteishaku"]', g(g9, 'sidebar.link_yhteishaku'));
    setTxt('.aihelista a[href="#epavarmuus"]', g(g9, 'sidebar.link_epavarmuus'));
    setTxt('.aihelista a[href="#testi"]', g(g9, 'sidebar.link_testi'));
    setTxt('.aihelista a[href="#valinnat"]', g(g9, 'sidebar.link_valinnat'));
    setTxt('.aihelista a[href="#tulevaisuus"]', g(g9, 'sidebar.link_tulevaisuus'));

    /* Breadcrumb */
    setTxt('.breadcrumb a[href="../index.html"]', g(g9, 'breadcrumb.home'));
    var crumbCurrent = document.querySelector('.breadcrumb');
    if (crumbCurrent && g9.breadcrumb) {
      var nodes = crumbCurrent.childNodes;
      for (var n = 0; n < nodes.length; n++) {
        if (nodes[n].nodeType === 3 && nodes[n].textContent.trim() === '9. luokka') {
          nodes[n].textContent = ' → ' + g9.breadcrumb.current;
          break;
        }
      }
    }

    /* H1 — myös data-i18n hoitaa, mutta setTxt varmuuden vuoksi */
    setTxt('h1', g(g9, 'hero.h1'));

    /* Hero intro-kappale */
    setTxt('.book-page-right > p', g(g9, 'hero.intro'));

    /* ── Johdanto ── */
    setTxt('#johdanto h2#otsikko-johdanto', g(g9, 'johdanto.h2'));
    setTxt('#johdanto .aihe-otsikko p', g(g9, 'johdanto.subtitle'));
    setTxt('.johdanto-maskotti-label', g(g9, 'johdanto.maskotti_label'));
    setTxt('.johdanto-maskotti-teksti', g(g9, 'johdanto.maskotti_teksti'));
    /* Suurenna-painike: säilytetään emoji, vaihdetaan vain teksti */
    (function () {
      var zoomSpan = document.querySelector('#johdanto span[style*="absolute"]');
      if (zoomSpan && g9.johdanto && g9.johdanto.zoom) {
        zoomSpan.textContent = g9.johdanto.zoom;
      }
    })();

    /* ── Jatko ── */
    setTxt('#jatko h2#otsikko-jatko', g(g9, 'jatko.h2'));
    setTxt('#jatko .aihe-otsikko p', g(g9, 'jatko.subtitle'));

    /* Theory card */
    setTxt('#jatko .theory-card h3', g(g9, 'jatko.theory.h3'));
    setTxt('#jatko .theory-card .theory-text p:first-of-type', g(g9, 'jatko.theory.p'));
    setTxt('#jatko .theory-card .theory-text strong', g(g9, 'jatko.theory.strong'));

    /* Kaavio-painike */
    (function () {
      var kaavioBtns = document.querySelectorAll('#jatko button');
      for (var i = 0; i < kaavioBtns.length; i++) {
        if (kaavioBtns[i].getAttribute('onclick') === 'avaaKoulutusKaavio()') {
          var icon = kaavioBtns[i].querySelector('i');
          if (g9.jatko && g9.jatko.kaavio_btn) {
            kaavioBtns[i].textContent = g9.jatko.kaavio_btn;
            if (icon) kaavioBtns[i].insertBefore(icon, kaavioBtns[i].firstChild);
          }
          break;
        }
      }
      /* Sulje kaavio */
      var kaavioDlg = document.getElementById('koulutusKaavioDialog');
      if (kaavioDlg && g9.jatko && g9.jatko.kaavio_close) {
        var closeBtn = kaavioDlg.querySelector('button[aria-label]');
        if (closeBtn) closeBtn.setAttribute('aria-label', g9.jatko.kaavio_close);
      }
    })();

    /* Mission card 1 */
    (function () {
      var cards = document.querySelectorAll('#jatko .mission-card');
      var m1 = g(g9, 'jatko.mission1');
      if (cards[0] && m1) {
        var h4 = cards[0].querySelector('h4');
        var badge = cards[0].querySelector('.mission-badge');
        var p = cards[0].querySelector('p:not(.mission-hint)');
        var lis = cards[0].querySelectorAll('li');
        var hint = cards[0].querySelector('.mission-hint');
        if (h4) h4.textContent = m1.h4;
        if (badge) badge.textContent = m1.badge;
        if (p) p.textContent = m1.p;
        if (m1.li) for (var i = 0; i < lis.length && i < m1.li.length; i++) lis[i].textContent = m1.li[i];
        if (hint) hint.textContent = m1.hint;
      }
    })();

    /* Laskuri hero */
    (function () {
      var lk = g(g9, 'jatko.laskuri');
      if (!lk) return;
      var hero = document.querySelector('#jatko .duuniintet-hero');
      if (hero) {
        var badge = hero.querySelector('.duuniintet-badge');
        if (badge) {
          var icon = badge.querySelector('i');
          badge.textContent = lk.badge;
          if (icon) badge.insertBefore(icon, badge.firstChild);
        }
        var h3 = hero.querySelector('h3');
        if (h3) h3.textContent = lk.h3;
        var p = hero.querySelector('p');
        if (p) p.textContent = lk.p;
        var btn = document.getElementById('laskuri-btn');
        if (btn) {
          var icon2 = btn.querySelector('i');
          btn.textContent = lk.btn_open;
          if (icon2) btn.insertBefore(icon2, btn.firstChild);
        }
      }
      var closeBtn = document.querySelector('#laskuriContainer > div > button');
      if (closeBtn) closeBtn.textContent = lk.btn_close;
    })();

    /* Mission card 2 */
    (function () {
      var cards = document.querySelectorAll('#jatko .mission-card');
      var m2 = g(g9, 'jatko.mission2');
      if (cards[1] && m2) {
        var h4 = cards[1].querySelector('h4');
        var badge = cards[1].querySelector('.mission-badge');
        var p = cards[1].querySelector('p:not(.mission-hint)');
        var lis = cards[1].querySelectorAll('li');
        var hint = cards[1].querySelector('.mission-hint');
        if (h4) h4.textContent = m2.h4;
        if (badge) badge.textContent = m2.badge;
        if (p) p.textContent = m2.p;
        if (m2.li) for (var i = 0; i < lis.length && i < m2.li.length; i++) lis[i].textContent = m2.li[i];
        if (hint) hint.textContent = m2.hint;
      }
    })();

    /* Vuosikello hero */
    (function () {
      var vk = g(g9, 'jatko.vuosikello');
      if (!vk) return;
      var hero = document.querySelector('#jatko .tetjakso-hero');
      if (hero) {
        var badge = hero.querySelector('.tetjakso-badge');
        if (badge) {
          var icon = badge.querySelector('i');
          badge.textContent = vk.badge;
          if (icon) badge.insertBefore(icon, badge.firstChild);
        }
        var h3 = hero.querySelector('h3');
        if (h3) h3.textContent = vk.h3;
        var p = hero.querySelector('p');
        if (p) p.textContent = vk.p;
        var btn = hero.querySelector('.btn-tetjakso');
        if (btn) {
          var icon2 = btn.querySelector('i');
          btn.textContent = vk.btn_open;
          if (icon2) btn.insertBefore(icon2, btn.firstChild);
        }
      }
      var closeBtn = document.querySelector('#vuosikelloContainer > div > button');
      if (closeBtn) {
        var icon3 = closeBtn.querySelector('i');
        closeBtn.textContent = vk.btn_close;
        if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
      }
    })();

  }

  /* ── Tapahtumakuuntelijat ── */
  document.addEventListener('digiopo:langchange', function (e) {
    applyG9(e.detail.t);
  });

  /* Jos käännökset on jo ladattu ennen tätä skriptiä */
  if (window.DIGIOPO_T) {
    applyG9(window.DIGIOPO_T);
  }

})();
