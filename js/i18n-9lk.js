/**
 * DigiOpo i18n – 9. luokka sivukohtaiset käännökset
 * Käyttää CSS-selectoreja, ei vaadi data-i18n muutoksia HTML:ään.
 * Kuuntelee digiopo:langchange tapahtumaa i18n.js:stä.
 */
(function () {
  'use strict';

  /* ── Apufunktiot ── */
  // Aseta otsikon teksti, mutta säilytä siihen lisätty teoria-nappi (i-linkki).
  // osio-rakenne.js lisää tieteellisen perustan i-napin h2/h3-otsikkoon; pelkkä
  // textContent-asetus pyyhkisi sen pois, joten irrotamme ja palautamme napin.
  function asetaOtsikko(el, val) {
    if (!el || !val) return;
    var nappi = el.querySelector(".teoria-nappi");
    el.textContent = val;
    if (nappi) el.appendChild(nappi);
  }

  function setTxt(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) asetaOtsikko(el, val);
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

    /* Mission card 1: Tutustu Opintopolkuun */
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

    /* Opintopolku-hero (Tehtävä 1) — #jatko-osion ensimmäinen tetjakso-hero */
    (function () {
      var op = g(g9, 'jatko.opintopolku');
      if (!op) return;
      var hero = document.querySelectorAll('#jatko .tetjakso-hero')[0];
      if (hero) {
        var badge = hero.querySelector('.tetjakso-badge');
        if (badge) {
          var icon = badge.querySelector('i');
          badge.textContent = op.badge;
          if (icon) badge.insertBefore(icon, badge.firstChild);
        }
        var h3 = hero.querySelector('h3');
        if (h3) h3.textContent = op.h3;
        var p = hero.querySelector('p');
        if (p) p.textContent = op.p;
        var btn = hero.querySelector('.btn-tetjakso');
        if (btn) {
          var icon2 = btn.querySelector('i');
          btn.textContent = op.btn;
          if (icon2) btn.insertBefore(icon2, btn.firstChild);
        }
      }
      var figs = document.querySelectorAll('#jatko .opo-esimerkit figure');
      if (figs[0]) {
        var img0 = figs[0].querySelector('img');
        var cap0 = figs[0].querySelector('figcaption');
        if (img0 && op.kuva1_alt) img0.setAttribute('alt', op.kuva1_alt);
        if (cap0 && op.kuva1_caption) cap0.textContent = op.kuva1_caption;
      }
      if (figs[1]) {
        var img1 = figs[1].querySelector('img');
        var cap1 = figs[1].querySelector('figcaption');
        if (img1 && op.kuva2_alt) img1.setAttribute('alt', op.kuva2_alt);
        if (cap1 && op.kuva2_caption) cap1.textContent = op.kuva2_caption;
      }
    })();

    /* Mission card 2: kalenteri */
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

    /* Vuosikello hero (Tehtävä 2) — #jatko-osion toinen tetjakso-hero */
    (function () {
      var vk = g(g9, 'jatko.vuosikello');
      if (!vk) return;
      var hero = document.querySelectorAll('#jatko .tetjakso-hero')[1];
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

    /* ── Ajattelu ── */
    (function () {
      var aj = g(g9, 'ajattelu');
      if (!aj) return;

      setTxt('#ajattelu h2#otsikko-ajattelu', aj.h2);
      setTxt('#ajattelu .aihe-otsikko p', aj.subtitle);

      /* Tehtävä 1 badge (span ennen theory-card:ia) */
      (function () {
        var spans = document.querySelectorAll('#ajattelu > span');
        if (spans.length && aj.badge1) spans[0].textContent = aj.badge1;
        /* Myös harmaalla divissä oleva span */
        var divSpans = document.querySelectorAll('#ajattelu > div > span');
        for (var i = 0; i < divSpans.length; i++) {
          if (divSpans[i].textContent.trim() === 'Tehtävä 1') {
            divSpans[i].textContent = aj.badge1;
            break;
          }
        }
      })();

      /* Theory card intro */
      setTxt('#ajattelu .theory-card .theory-text > p', aj.theory_intro);

      /* Ajattelutyypit – 5 korttia */
      if (aj.thinking_types) {
        var cards = document.querySelectorAll('#ajattelu .theory-card .theory-text > div > div');
        for (var i = 0; i < cards.length && i < aj.thinking_types.length; i++) {
          var ch = cards[i].children;
          if (ch[1]) ch[1].textContent = aj.thinking_types[i].title;
          if (ch[2]) ch[2].textContent = aj.thinking_types[i].desc;
        }
      }

      /* Peli-napit */
      (function () {
        var openBtn = document.querySelector('#ajattelu button[onclick="avaaAjattelupeli()"]');
        if (openBtn && aj.game_btn_open) openBtn.textContent = aj.game_btn_open;
        var closeBtns = document.querySelectorAll('#ajatteluSuljeBtn, #ajattelupeliContainer button');
        for (var i = 0; i < closeBtns.length; i++) {
          if (aj.game_btn_close) closeBtns[i].textContent = aj.game_btn_close;
        }
      })();

      /* Tehtävä 2 badge */
      (function () {
        var allSpans = document.querySelectorAll('#ajattelu > div > span');
        for (var i = 0; i < allSpans.length; i++) {
          if (allSpans[i].textContent.trim() === 'Tehtävä 2') {
            allSpans[i].textContent = aj.badge2;
            break;
          }
        }
      })();

      /* Salapoliisitehtävä (murha) */
      if (aj.murha) {
        var badge = document.querySelector('#ajattelu-mission .hero-badge');
        if (badge) {
          var icon = badge.querySelector('i');
          badge.textContent = aj.murha.badge;
          if (icon) badge.insertBefore(icon, badge.firstChild);
        }
        var mh3 = document.querySelector('#ajattelu-mission h3');
        if (mh3) asetaOtsikko(mh3, aj.murha.h3);
        var mp = document.querySelector('#ajattelu-mission p');
        if (mp) mp.textContent = aj.murha.p;
        var infoSpan = document.querySelector('#ajattelu-mission .btn-hero + span');
        if (infoSpan) infoSpan.textContent = aj.murha.info;
        /* Open-painike ja toggleMurha-patch */
        var openBtn = document.querySelector('#ajattelu-mission .btn-hero');
        if (openBtn && aj.murha.btn_open) openBtn.textContent = aj.murha.btn_open;
        /* Patch toggleMurha function */
        window._murhaAuki = aj.murha.btn_open;
        window._murhaSuljettu = aj.murha.btn_close;
        window.toggleMurha = function (btn) {
          var wrapper = document.getElementById('murha-wrapper');
          var isOpen = wrapper.style.display === 'block';
          wrapper.style.display = isOpen ? 'none' : 'block';
          btn.textContent = isOpen ? (window._murhaAuki || 'Avaa tehtävä') : (window._murhaSuljettu || 'Sulje tehtävä');
          btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
          if (!isOpen) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        /* Close-painike murha-wrapperissa */
        var closeBtn = document.querySelector('#murha-wrapper > div > button');
        if (closeBtn) {
          var closeIcon = closeBtn.querySelector('i');
          closeBtn.textContent = aj.murha.btn_close;
          if (closeIcon) closeBtn.insertBefore(closeIcon, closeBtn.firstChild);
        }
      }

      /* Opettajan materiaali */
      (function () {
        var el = document.querySelector('#ajattelu .opettaja-toggle .opettaja-toggle-left span:last-child');
        if (el && aj.opettaja_btn) el.textContent = aj.opettaja_btn;
        var link = document.querySelector('#opettaja-sisalto-ajattelu .opettaja-lataus');
        if (link && aj.opettaja_link) {
          var linkSpan = link.querySelector('span');
          link.textContent = aj.opettaja_link;
          if (linkSpan) link.insertBefore(linkSpan, link.firstChild);
        }
      })();
    })();

    /* ── TET ── */
    (function () {
      var tet = g(g9, 'tet');
      if (!tet) return;

      setTxt('#tet h2#otsikko-tet', tet.h2);
      setTxt('#tet .aihe-otsikko p', tet.subtitle);
      setTxt('#tet .theory-card .theory-text p:first-of-type', tet.theory_p);
      setTxt('#tet .theory-card .theory-text strong', tet.theory_strong);

      /* "Klikkaa suurentaaksesi" -teksti (2 kuvaa) */
      if (tet.zoom_caption) {
        var zoomIcons = document.querySelectorAll('#tet .fa-magnifying-glass-plus');
        for (var i = 0; i < zoomIcons.length; i++) {
          var parentDiv = zoomIcons[i].parentNode;
          if (parentDiv) {
            /* Korvaa tekstisolmu ikonin jälkeen */
            var nodes = parentDiv.childNodes;
            for (var n = 0; n < nodes.length; n++) {
              if (nodes[n].nodeType === 3) {
                nodes[n].textContent = ' ' + tet.zoom_caption;
              }
            }
          }
        }
      }

      /* Dialog sulje kuva */
      var tetDlgClose = document.querySelector('#tetKuvaDialog .tet-dialog-sulje');
      if (tetDlgClose && tet.dialog_close) {
        tetDlgClose.setAttribute('aria-label', tet.dialog_close);
        tetDlgClose.textContent = '✕';
      }

      /* Duuniin! TET-peli */
      if (tet.duuniintet) {
        var du = tet.duuniintet;
        var hero = document.querySelector('#tet .duuniintet-hero');
        if (hero) {
          var badge = hero.querySelector('.duuniintet-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = du.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('#tet .duuniintet-hero h3', du.h3);
          setTxt('#tet .duuniintet-hero p', du.p);
          var openBtn = hero.querySelector('.btn-duuniintet');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = du.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('#duuniintetContainer .duuniintet-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = du.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* TET-jakson jälkeen */
      if (tet.tetjakso) {
        var tj = tet.tetjakso;
        var tetHero = document.querySelector('#tet-harjoittelu-tehtava');
        if (tetHero) {
          var badge = tetHero.querySelector('.tetjakso-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = tj.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('#tet-harjoittelu-tehtava h3', tj.h3);
          setTxt('#tet-harjoittelu-tehtava p', tj.p);
          var openBtn = tetHero.querySelector('.btn-tetjakso');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = tj.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('#tetjaksoContainer .tetjakso-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = tj.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* Miten minä opin? */
      if (tet.oppiminen) {
        var op = tet.oppiminen;
        /* Label (pieni yläotsikko) */
        (function () {
          var osio = document.getElementById('tetOppimisOsio');
          if (!osio) return;
          /* Yläotsikko-div: ensimmäinen lapsi-div:n sisällä oleva pieni teksti-div */
          var labelDiv = osio.querySelector('div > div > div:first-child');
          if (labelDiv && op.label) labelDiv.textContent = op.label;
          setTxt('#tetOppimisOsio h3', op.h3);
          setTxt('#tetOppimisOsio > p', op.p);
          /* Avaa-painike */
          var openBtn = osio.querySelector('button[onclick="toggleTetOppiminen(this)"]');
          if (openBtn && op.btn_open) {
            var span = openBtn.querySelector('span:first-child');
            if (span) {
              var icon = span.querySelector('i');
              span.textContent = op.btn_open;
              if (icon) span.insertBefore(icon, span.firstChild);
            }
          }
          /* Kysymykset */
          var q1 = osio.querySelector('label[for="tetOppiminen1"]');
          if (q1) q1.textContent = op.q1_label;
          var q1p = osio.querySelector('label[for="tetOppiminen1"] + p');
          if (q1p) {
            var q1strong = q1p.querySelectorAll('strong');
            q1p.textContent = op.q1_hint;
          }
          var q2 = osio.querySelector('label[for="tetOppiminen2"]');
          if (q2) q2.textContent = op.q2_label;
          var q2p = osio.querySelector('label[for="tetOppiminen2"] + p');
          if (q2p) q2p.textContent = op.q2_hint;
          var q3 = osio.querySelector('label[for="tetOppiminen3"]');
          if (q3) q3.textContent = op.q3_label;
          var q3p = osio.querySelector('label[for="tetOppiminen3"] + p');
          if (q3p) q3p.textContent = op.q3_hint;
          /* Bonus (details/summary) */
          var summary = osio.querySelector('details summary');
          if (summary && op.bonus_summary) {
            var starSpan = summary.querySelector('span:first-child');
            summary.textContent = op.bonus_summary;
            if (starSpan) summary.insertBefore(starSpan, summary.firstChild);
          }
          var bonusLabel = osio.querySelector('label[for="tetOppiminenBonus"]');
          if (bonusLabel) bonusLabel.textContent = op.bonus_label;
          var bonusP = osio.querySelector('label[for="tetOppiminenBonus"] + p');
          if (bonusP) bonusP.textContent = op.bonus_hint;
          /* Tip (loppuhuomio) */
          var tip = osio.querySelector('div[style*="border-left"]');
          if (tip && op.tip) {
            var tipIcon = tip.querySelector('i');
            var tipStrong = tip.querySelector('strong');
            /* Säilytetään Miksi tärkeää -strong osittain */
            tip.textContent = op.tip;
          }
        })();
      }

      /* DuuniMinä */
      if (tet.duunimina) {
        var dm = tet.duunimina;
        var hero = document.querySelector('.duunimina-hero');
        if (hero) {
          var badge = hero.querySelector('.duunimina-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = dm.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('.duunimina-hero h3', dm.h3);
          setTxt('.duunimina-hero p', dm.p);
          var openBtn = hero.querySelector('.btn-duunimina');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = dm.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('.duunimina-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = dm.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* Reppu */
      if (tet.reppu) {
        var rp = tet.reppu;
        var repHero = document.querySelector('#reppu-tehtava');
        if (repHero) {
          var badge = repHero.querySelector('.tetjakso-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = rp.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('#reppu-tehtava h3', rp.h3);
          setTxt('#reppu-tehtava p', rp.p);
          var openBtn = repHero.querySelector('.btn-tetjakso');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = rp.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('#reppuContainer .tetjakso-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = rp.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* Opettajan materiaali – TET */
      (function () {
        var el = document.querySelector('#tet .opettaja-toggle .opettaja-toggle-left span:last-child');
        if (el && tet.opettaja_btn) el.textContent = tet.opettaja_btn;
        var link = document.querySelector('#opettaja-sisalto-tet .opettaja-lataus');
        if (link && tet.opettaja_link) {
          var linkSpan = link.querySelector('span');
          link.textContent = tet.opettaja_link;
          if (linkSpan) link.insertBefore(linkSpan, link.firstChild);
        }
      })();

      /* TET-polku: kielivaroitus + vaihe-käännökset */
      (function () {
        /* Kielivaroitus */
        var warnBox  = document.getElementById('tet9-lang-warning');
        var warnText = document.getElementById('tet9-lang-warning-text');
        if (warnBox && warnText) {
          if (tet.lang_warning) {
            warnText.textContent = tet.lang_warning;
            warnBox.hidden = false;
            warnBox.style.display = 'flex';
          } else {
            warnBox.hidden = true;
            warnBox.style.display = '';
          }
        }

        var pk = tet.polku;
        if (!pk) return;

        /* Ohje-teksti */
        setTxt('.tet-polku-osio .tet-polku-ohje', pk.ohje);

        /* Node-labelit (Koulu, Työpaikka, …) */
        var labels = document.querySelectorAll('.tet-polku-osio .tet-noodi-label');
        var labelKeys = ['v1_label','v2_label','v3_label','v4_label','v5_label','v6_label'];
        for (var i = 0; i < labels.length; i++) {
          if (pk[labelKeys[i]]) labels[i].textContent = pk[labelKeys[i]];
        }

        /* Paneeli 1 */
        var p1 = document.getElementById('tet9-paneeli-1');
        if (p1) {
          setTxt('#tet9-paneeli-1 .tet-paneeli-otsikko', pk.v1_otsikko);
          var p1p = p1.querySelector('p:not(.tet-paneeli-vihje)');
          if (p1p && pk.v1_p) p1p.textContent = pk.v1_p;
          setTxt('#tet9-paneeli-1 .tet-paneeli-vihje', pk.v1_vihje);
        }

        /* Paneeli 2 (sisältää ul>li) */
        var p2 = document.getElementById('tet9-paneeli-2');
        if (p2) {
          setTxt('#tet9-paneeli-2 .tet-paneeli-otsikko', pk.v2_otsikko);
          var p2p = p2.querySelector('p:not(.tet-paneeli-vihje)');
          if (p2p && pk.v2_p) {
            /* Säilytetään strong-elementti */
            p2p.textContent = pk.v2_p;
          }
          var p2lis = p2.querySelectorAll('li');
          if (p2lis[0] && pk.v2_li1) p2lis[0].textContent = pk.v2_li1;
          if (p2lis[1] && pk.v2_li2) p2lis[1].textContent = pk.v2_li2;
          setTxt('#tet9-paneeli-2 .tet-paneeli-vihje', pk.v2_vihje);
        }

        /* Paneeli 3 (kaksi p-elementtiä) */
        var p3 = document.getElementById('tet9-paneeli-3');
        if (p3) {
          setTxt('#tet9-paneeli-3 .tet-paneeli-otsikko', pk.v3_otsikko);
          var p3ps = p3.querySelectorAll('p:not(.tet-paneeli-vihje)');
          if (p3ps[0] && pk.v3_p1) p3ps[0].textContent = pk.v3_p1;
          if (p3ps[1] && pk.v3_p2) p3ps[1].textContent = pk.v3_p2;
          setTxt('#tet9-paneeli-3 .tet-paneeli-vihje', pk.v3_vihje);
        }

        /* Paneeli 4 (kaksi p-elementtiä) */
        var p4 = document.getElementById('tet9-paneeli-4');
        if (p4) {
          setTxt('#tet9-paneeli-4 .tet-paneeli-otsikko', pk.v4_otsikko);
          var p4ps = p4.querySelectorAll('p:not(.tet-paneeli-vihje)');
          if (p4ps[0] && pk.v4_p1) p4ps[0].textContent = pk.v4_p1;
          if (p4ps[1] && pk.v4_p2) p4ps[1].textContent = pk.v4_p2;
          setTxt('#tet9-paneeli-4 .tet-paneeli-vihje', pk.v4_vihje);
        }

        /* Paneeli 5 */
        var p5 = document.getElementById('tet9-paneeli-5');
        if (p5) {
          setTxt('#tet9-paneeli-5 .tet-paneeli-otsikko', pk.v5_otsikko);
          var p5p = p5.querySelector('p:not(.tet-paneeli-vihje)');
          if (p5p && pk.v5_p) p5p.textContent = pk.v5_p;
          setTxt('#tet9-paneeli-5 .tet-paneeli-vihje', pk.v5_vihje);
        }

        /* Paneeli 6 */
        var p6 = document.getElementById('tet9-paneeli-6');
        if (p6) {
          setTxt('#tet9-paneeli-6 .tet-paneeli-otsikko', pk.v6_otsikko);
          var p6p = p6.querySelector('p:not(.tet-paneeli-vihje)');
          if (p6p && pk.v6_p) p6p.textContent = pk.v6_p;
          setTxt('#tet9-paneeli-6 .tet-paneeli-vihje', pk.v6_vihje);
        }

        /* Dialogi-versio (kaikki vaiheet näkyvillä kerralla) */
        setTxt('#tet9d-ohje', pk.ohje);
        setTxt('#tet9-suurenna-teksti', pk.suurenna || 'Suurenna');
        setTxt('#tet9d-v1-label', pk.v1_label); setTxt('#tet9d-v1-otsikko', pk.v1_otsikko);
        if (pk.v1_p) { var d1p = document.getElementById('tet9d-v1-p'); if (d1p) d1p.textContent = pk.v1_p; }
        setTxt('#tet9d-v1-vihje', pk.v1_vihje);
        setTxt('#tet9d-v2-label', pk.v2_label); setTxt('#tet9d-v2-otsikko', pk.v2_otsikko);
        if (pk.v2_p) { var d2p = document.getElementById('tet9d-v2-p'); if (d2p) d2p.textContent = pk.v2_p; }
        if (pk.v2_li1) { var d2l1 = document.getElementById('tet9d-v2-li1'); if (d2l1) d2l1.textContent = pk.v2_li1; }
        if (pk.v2_li2) { var d2l2 = document.getElementById('tet9d-v2-li2'); if (d2l2) d2l2.textContent = pk.v2_li2; }
        setTxt('#tet9d-v2-vihje', pk.v2_vihje);
        setTxt('#tet9d-v3-label', pk.v3_label); setTxt('#tet9d-v3-otsikko', pk.v3_otsikko);
        if (pk.v3_p1) { var d3p1 = document.getElementById('tet9d-v3-p1'); if (d3p1) d3p1.textContent = pk.v3_p1; }
        if (pk.v3_p2) { var d3p2 = document.getElementById('tet9d-v3-p2'); if (d3p2) d3p2.textContent = pk.v3_p2; }
        setTxt('#tet9d-v3-vihje', pk.v3_vihje);
        setTxt('#tet9d-v4-label', pk.v4_label); setTxt('#tet9d-v4-otsikko', pk.v4_otsikko);
        if (pk.v4_p1) { var d4p1 = document.getElementById('tet9d-v4-p1'); if (d4p1) d4p1.textContent = pk.v4_p1; }
        if (pk.v4_p2) { var d4p2 = document.getElementById('tet9d-v4-p2'); if (d4p2) d4p2.textContent = pk.v4_p2; }
        setTxt('#tet9d-v4-vihje', pk.v4_vihje);
        setTxt('#tet9d-v5-label', pk.v5_label); setTxt('#tet9d-v5-otsikko', pk.v5_otsikko);
        if (pk.v5_p) { var d5p = document.getElementById('tet9d-v5-p'); if (d5p) d5p.textContent = pk.v5_p; }
        setTxt('#tet9d-v5-vihje', pk.v5_vihje);
        setTxt('#tet9d-v6-label', pk.v6_label); setTxt('#tet9d-v6-otsikko', pk.v6_otsikko);
        if (pk.v6_p) { var d6p = document.getElementById('tet9d-v6-p'); if (d6p) d6p.textContent = pk.v6_p; }
        setTxt('#tet9d-v6-vihje', pk.v6_vihje);
      })();
    })();

    /* ── Päätöksenteko ── */
    (function () {
      var pa = g(g9, 'paatoksenteko');
      if (!pa) return;

      /* h2 sisältää napin — päivitetään vain tekstisolmu */
      (function () {
        var h2 = document.querySelector('#paatoksenteko h2#otsikko-paatoksenteko');
        if (h2 && pa.h2) {
          var nodes = h2.childNodes;
          for (var n = 0; n < nodes.length; n++) {
            if (nodes[n].nodeType === 3 && nodes[n].textContent.trim()) {
              nodes[n].textContent = '\n              ' + pa.h2 + '\n              ';
              break;
            }
          }
        }
      })();

      setTxt('#paatoksenteko .aihe-otsikko p', pa.subtitle);

      /* Tietopaketti */
      (function () {
        var infoDiv = document.querySelector('#paatoksenteko > div[style*="eff6ff"]');
        if (!infoDiv) return;
        var h3 = infoDiv.querySelector('h3');
        if (h3) h3.textContent = pa.theory_h3;
        var ps = infoDiv.querySelectorAll('p');
        if (ps[0] && pa.theory_p1) ps[0].textContent = pa.theory_p1;
        if (ps[1] && pa.theory_p2) ps[1].textContent = pa.theory_p2;
      })();

      /* Neuvonantaja-tehtävä */
      if (pa.neuvonantaja) {
        var na = pa.neuvonantaja;
        var naDiv = document.querySelector('#paatoksenteko button[onclick*="_toggleNeuvonantaja2"]');
        if (naDiv) {
          var wrapper = naDiv.closest('div[style*="linear-gradient"]');
          if (wrapper) {
            /* badge div */
            var badgeDiv = wrapper.querySelector('div[style*="0.7rem"]');
            if (badgeDiv) badgeDiv.textContent = na.badge;
            /* h3 */
            var h3 = wrapper.querySelector('h3');
            if (h3) h3.textContent = na.h3;
            /* intro p */
            var introP = wrapper.querySelector('p');
            if (introP) introP.textContent = na.p;
            /* open button span */
            var btnSpan = naDiv.querySelector('span:first-child');
            if (btnSpan && na.btn_open) {
              var icon = btnSpan.querySelector('i');
              btnSpan.textContent = na.btn_open;
              if (icon) btnSpan.insertBefore(icon, btnSpan.firstChild);
            }
          }
          /* Phase 1 */
          var sisalto = document.getElementById('neuvonantajaSisalto2');
          if (sisalto) {
            var phase1 = sisalto.querySelector('div:first-child');
            if (phase1) {
              var p1badge = phase1.querySelector('p[style*="0.78rem"]');
              if (p1badge) p1badge.textContent = na.phase1_badge;
              var p1h4 = phase1.querySelector('h4');
              if (p1h4) p1h4.textContent = na.phase1_h4;
              var p1p = phase1.querySelector('p:not([style*="0.78rem"])');
              if (p1p) p1p.textContent = na.phase1_p;
              /* Decision tool cards */
              if (na.tool) {
                var toolCards = phase1.querySelectorAll('div[style*="eff6ff"][style*="border-radius:10px"]');
                for (var i = 0; i < toolCards.length && i < na.tool.length; i++) {
                  var strong = toolCards[i].querySelector('strong');
                  var desc = toolCards[i].querySelector('p');
                  if (strong) strong.textContent = na.tool[i].title;
                  if (desc) desc.textContent = na.tool[i].desc;
                }
              }
            }
            /* Phase 2 */
            var phase2 = sisalto.querySelectorAll('div[style*="border:1.5px"]')[1];
            if (phase2) {
              var p2badge = phase2.querySelector('p[style*="0.78rem"]');
              if (p2badge) p2badge.textContent = na.phase2_badge;
              var p2h4 = phase2.querySelector('h4');
              if (p2h4) p2h4.textContent = na.phase2_h4;
            }
            /* Phase 3 */
            var phase3 = sisalto.querySelectorAll('div[style*="border:1.5px"]')[2];
            if (phase3) {
              var p3badge = phase3.querySelector('p[style*="0.78rem"]');
              if (p3badge) p3badge.textContent = na.phase3_badge;
              var p3h4 = phase3.querySelector('h4');
              if (p3h4) p3h4.textContent = na.phase3_h4;
            }
          }
        }
      }

      /* Skenaariotehtävä */
      if (pa.skenaario) {
        var sk = pa.skenaario;
        var skBtn = document.querySelector('#paatoksenteko button[onclick*="_toggleSkenaario"]');
        if (skBtn) {
          var skWrapper = skBtn.closest('div[style*="linear-gradient"]');
          if (skWrapper) {
            var skBadge = skWrapper.querySelector('div[style*="0.7rem"]');
            if (skBadge) skBadge.textContent = sk.badge;
            var skH3 = skWrapper.querySelector('h3');
            if (skH3) skH3.textContent = sk.h3;
            var skP = skWrapper.querySelector('p');
            if (skP) skP.textContent = sk.p;
            var skSpan = skBtn.querySelector('span:first-child');
            if (skSpan && sk.btn_open) {
              var skIcon = skSpan.querySelector('span[aria-hidden]');
              skSpan.textContent = sk.btn_open;
              if (skIcon) skSpan.insertBefore(skIcon, skSpan.firstChild);
            }
          }
        }
      }

      /* Opettajan materiaali */
      (function () {
        var el = document.querySelector('#paatoksenteko .opettaja-toggle .opettaja-toggle-left span:last-child');
        if (el && pa.opettaja_btn) el.textContent = pa.opettaja_btn;
      })();
    })();

    /* ── Epävarmuus ── */
    (function () {
      var ev = g(g9, 'epavarmuus');
      if (!ev) return;

      setTxt('#epavarmuus h2#otsikko-epavarmuus', ev.h2);
      setTxt('#epavarmuus .aihe-otsikko p', ev.subtitle);

      /* Theory card */
      (function () {
        var tc = document.querySelector('#epavarmuus .theory-card .theory-text');
        if (!tc) return;
        var ps = tc.querySelectorAll('p');
        if (ps[0] && ev.theory_p1) ps[0].textContent = ev.theory_p1;
        if (ps[1] && ev.theory_p2) ps[1].textContent = ev.theory_p2;
      })();

      /* Vaihe 1 */
      if (ev.v1) {
        var v1 = ev.v1;
        var v1div = document.getElementById('epavarmuus-v1');
        if (v1div) {
          var v1badge = v1div.querySelector('div[style*="0.7rem"]');
          if (v1badge) v1badge.textContent = v1.badge;
          var v1h3 = v1div.querySelector('h3');
          if (v1h3) v1h3.textContent = v1.h3;
          var v1p = v1div.querySelector('p');
          if (v1p) v1p.textContent = v1.p;
          var v1btn = v1div.querySelector('button[onclick*="toggleEpavarmuusV1"]');
          if (v1btn && v1.btn_open) {
            var v1span = v1btn.querySelector('span:first-child');
            if (v1span) {
              var v1icon = v1span.querySelector('i');
              v1span.textContent = v1.btn_open;
              if (v1icon) v1span.insertBefore(v1icon, v1span.firstChild);
            }
          }
          /* Labels A–D */
          var lA = v1div.querySelector('label[for="ev1a"]');
          if (lA && v1.a_label) lA.textContent = v1.a_label;
          var hA = v1div.querySelector('label[for="ev1a"] + p');
          if (hA && v1.a_hint) {
            var emA = hA.querySelector('em');
            hA.textContent = v1.a_hint;
          }
          var lB = v1div.querySelector('label[for="ev1b"]');
          if (lB && v1.b_label) lB.textContent = v1.b_label;
          var hB = v1div.querySelector('label[for="ev1b"] + p');
          if (hB && v1.b_hint) hB.textContent = v1.b_hint;
          var lC = v1div.querySelector('label[for="ev1c"]');
          if (lC && v1.c_label) lC.textContent = v1.c_label;
          var hC = v1div.querySelector('label[for="ev1c"] + p');
          if (hC && v1.c_hint) hC.textContent = v1.c_hint;
          var lD = v1div.querySelector('label[for="ev1d"]');
          if (lD && v1.d_label) lD.textContent = v1.d_label;
          var hD = v1div.querySelector('label[for="ev1d"] + p');
          if (hD && v1.d_hint) hD.textContent = v1.d_hint;
        }
      }

      /* Vaihe 2 */
      if (ev.v2) {
        var v2 = ev.v2;
        var v2div = document.getElementById('epavarmuus-v2');
        if (v2div) {
          var v2badge = v2div.querySelector('div[style*="0.7rem"]');
          if (v2badge) v2badge.textContent = v2.badge;
          var v2h3 = v2div.querySelector('h3');
          if (v2h3) v2h3.textContent = v2.h3;
          var v2ps = v2div.querySelectorAll('p');
          if (v2ps[0] && v2.p) v2ps[0].textContent = v2.p;
          var v2btn = v2div.querySelector('button[onclick*="toggleEpavarmuusV2"]');
          if (v2btn && v2.btn_open) {
            var v2span = v2btn.querySelector('span:first-child');
            if (v2span) {
              var v2icon = v2span.querySelector('i');
              v2span.textContent = v2.btn_open;
              if (v2icon) v2span.insertBefore(v2icon, v2span.firstChild);
            }
          }
        }
      }

      /* Vaihe 3 */
      if (ev.v3) {
        var v3 = ev.v3;
        var v3div = document.getElementById('epavarmuus-v3');
        if (v3div) {
          var v3badge = v3div.querySelector('div[style*="0.7rem"]');
          if (v3badge) v3badge.textContent = v3.badge;
          var v3h3 = v3div.querySelector('h3');
          if (v3h3) v3h3.textContent = v3.h3;
          var v3p = v3div.querySelector('p');
          if (v3p && v3.p) v3p.textContent = v3.p;
          var v3btn = v3div.querySelector('button[onclick*="toggleEpavarmuusV3"]');
          if (v3btn && v3.btn_open) {
            var v3span = v3btn.querySelector('span:first-child');
            if (v3span) {
              var v3icon = v3span.querySelector('i');
              v3span.textContent = v3.btn_open;
              if (v3icon) v3span.insertBefore(v3icon, v3span.firstChild);
            }
          }
          /* Resilienssipakki-labelit */
          var res1 = v3div.querySelector('label[for="res1"]');
          if (res1 && v3.res1_label) res1.textContent = v3.res1_label;
          var res2 = v3div.querySelector('label[for="res2"]');
          if (res2 && v3.res2_label) res2.textContent = v3.res2_label;
          var res3 = v3div.querySelector('label[for="res3"]');
          if (res3 && v3.res3_label) res3.textContent = v3.res3_label;
          var res4 = v3div.querySelector('label[for="res4"]');
          if (res4 && v3.res4_label) res4.textContent = v3.res4_label;
          var res5 = v3div.querySelector('label[for="res5"]');
          if (res5 && v3.res5_label) res5.textContent = v3.res5_label;
          /* Luokkaosuus heading */
          if (v3.class_heading) {
            var classPs = v3div.querySelectorAll('p[style*="0.8rem"]');
            for (var i = 0; i < classPs.length; i++) {
              if (classPs[i].textContent.indexOf('Luokkaosuus') !== -1) {
                classPs[i].textContent = v3.class_heading;
                break;
              }
            }
          }
        }
      }

      /* Vaihe 4 */
      if (ev.v4) {
        var v4 = ev.v4;
        var v4div = document.getElementById('epavarmuus-v4');
        if (v4div) {
          var v4badge = v4div.querySelector('div[style*="0.7rem"]');
          if (v4badge) v4badge.textContent = v4.badge;
          var v4h3 = v4div.querySelector('h3');
          if (v4h3) v4h3.textContent = v4.h3;
          var v4p = v4div.querySelector('p');
          if (v4p && v4.p) v4p.textContent = v4.p;
          var v4btn = v4div.querySelector('button[onclick*="_toggleEpavarmuus"]');
          if (v4btn && v4.btn_open) {
            var v4span = v4btn.querySelector('span:first-child');
            if (v4span) {
              var v4icon = v4span.querySelector('i');
              v4span.textContent = v4.btn_open;
              if (v4icon) v4span.insertBefore(v4icon, v4span.firstChild);
            }
          }
          /* Fieldset legend */
          var legend = v4div.querySelector('legend');
          if (legend && v4.legend) legend.textContent = v4.legend;
          /* Instruction */
          if (v4.instruction) {
            var instrP = v4div.querySelector('p[style*="font-weight:600"]');
            if (instrP) instrP.textContent = v4.instruction;
          }
          /* Checkbox items */
          if (v4.items) {
            var chkLabels = v4div.querySelectorAll('label[style*="display:flex"]');
            for (var i = 0; i < chkLabels.length && i < v4.items.length; i++) {
              var spanEl = chkLabels[i].querySelector('span:not([style])');
              if (spanEl) spanEl.textContent = v4.items[i];
            }
          }
          /* Reflektio intro */
          if (v4.reflektio_intro) {
            var reflIntroP = v4div.querySelector('p[style*="font-weight:600"]:last-of-type');
            /* find the "Mieti hetki:" paragraph */
            var allBoldPs = v4div.querySelectorAll('p');
            for (var i = 0; i < allBoldPs.length; i++) {
              if (allBoldPs[i].textContent.trim() === 'Mieti hetki:') {
                allBoldPs[i].textContent = v4.reflektio_intro;
                break;
              }
            }
          }
          /* Reflektio labels */
          var rl1 = v4div.querySelector('label[for="askelmaReflektio1"]');
          if (rl1 && v4.reflektio1_label) rl1.textContent = v4.reflektio1_label;
          var rl2 = v4div.querySelector('label[for="askelmaReflektio2"]');
          if (rl2 && v4.reflektio2_label) rl2.textContent = v4.reflektio2_label;
        }
      }

      /* Opettajan materiaali */
      (function () {
        var el = document.querySelector('#epavarmuus .opettaja-toggle .opettaja-toggle-left span:last-child');
        if (el && ev.opettaja_btn) el.textContent = ev.opettaja_btn;
        var link = document.querySelector('#opettaja-sisalto-epavarmuus .opettaja-lataus');
        if (link && ev.opettaja_link) {
          var linkSpan = link.querySelector('span');
          link.textContent = ev.opettaja_link;
          if (linkSpan) link.insertBefore(linkSpan, link.firstChild);
        }
      })();
    })();

  } /* /applyG9 */

  /* ── Vain-suomeksi-varoitukset ── */
  var FI_ONLY_CLASS = 'fi-only-varoitus';

  var FI_ONLY_SELECTORS = [
    'button[onclick*="avaaLaskuri"]',
    'button[onclick*="avaaAjattelupeli"]',
    'button[onclick*="avaaDuuniinTet"]',
    'button[onclick*="avaaTetJakso"]',
    'button.btn-duunimina',
    'button[onclick*="avaaReppu"]',
    'button[onclick*="avaaHakustrategia"]',
    'button[onclick*="avaaElamapeli"]',
    'button[onclick*="avaaAiLaboratorio"]',
    'a.next-step-btn[href*="lukiosanasto"]',
    'a.next-step-btn[href*="amissanasto"]',
    'a.next-step-btn[href*="lukioristikko"]',
    'a.next-step-btn[href*="amisristikko"]',
    'a[href*="lukio_vs_amis.html"]'
  ];

  function poistaVaroitukset() {
    document.querySelectorAll('.' + FI_ONLY_CLASS).forEach(function (el) {
      el.parentNode.removeChild(el);
    });
  }

  function lisaaVaroitukset(teksti) {
    poistaVaroitukset();
    if (!teksti) return; // suomi — ei varoitusta
    FI_ONLY_SELECTORS.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var varoitus = document.createElement('p');
      varoitus.className = FI_ONLY_CLASS;
      varoitus.setAttribute('role', 'note');
      varoitus.textContent = teksti;
      varoitus.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:6px',
        'margin:8px 0 0',
        'padding:6px 12px',
        'background:rgba(255,200,0,0.18)',
        'border:1px solid rgba(180,130,0,0.4)',
        'border-radius:8px',
        'font-size:13px',
        'line-height:1.4',
        'color:inherit',
        'opacity:0.9'
      ].join(';');
      el.insertAdjacentElement('afterend', varoitus);
    });
  }

  function paivitaVaroitukset(t) {
    var teksti = t && t.g9 && t.g9.fi_only_warning ? t.g9.fi_only_warning : null;
    lisaaVaroitukset(teksti);
  }

  /* ── Keskustelutehtäväkorttien käännökset ── */
  // Kartta: href-tunniste → g9.tasks-avain
  var TASK_MAP = {
    'keskustelu-tet9':              'tet9',
    'keskustelu-harrastus-ammatti': 'harrastus_ammatti',
    'reflektio-valinnat9':          'valinnat9'
  };

  function kaannaTehtavaKortit(t) {
    var tasks = t && t.g9 && t.g9.tasks;
    if (!tasks) return;

    // Ryhmäkeskustelu-kortit
    document.querySelectorAll('a.keskustelu-kortti').forEach(function (kortti) {
      var href = kortti.getAttribute('href') || '';
      var taskKey = null;
      for (var id in TASK_MAP) {
        if (href.indexOf(id) !== -1) { taskKey = TASK_MAP[id]; break; }
      }
      if (!taskKey || !tasks[taskKey]) return;
      var td = tasks[taskKey];
      var h3 = kortti.querySelector('h3');
      if (h3 && td.title) h3.textContent = td.title;
      var p = kortti.querySelector('p');
      if (p && td.description) p.textContent = td.description;
      // Badge "Ryhmäkeskustelu"
      var badge = kortti.querySelector('[style*="border-radius:999px"]');
      if (badge && tasks.discussion_label) badge.textContent = tasks.discussion_label;
      // Hint "👥 Keskustele..."
      var hint = kortti.querySelector('[style*="border-left"]');
      if (hint && tasks.discussion_hint) hint.textContent = tasks.discussion_hint;
    });

    // Vihko-kortit (yksilötehtävät)
    document.querySelectorAll('a.vihko-kortti').forEach(function (kortti) {
      var href = kortti.getAttribute('href') || '';
      var taskKey = null;
      for (var id in TASK_MAP) {
        if (href.indexOf(id) !== -1) { taskKey = TASK_MAP[id]; break; }
      }
      if (!taskKey || !tasks[taskKey]) return;
      var td = tasks[taskKey];
      var h3 = kortti.querySelector('h3');
      if (h3 && td.title) {
        // Säilytä ikoni-elementti h3:n sisällä
        var ikoni = h3.querySelector('i');
        h3.textContent = td.title;
        if (ikoni) h3.appendChild(ikoni);
      }
      var p = kortti.querySelector('p');
      if (p && td.description) p.textContent = td.description;
      // Badge "✏️ Yksilötehtävä"
      var badge = kortti.querySelector('span[style*="fef08a"]');
      if (badge && tasks.individual_label) badge.textContent = tasks.individual_label;
    });
  }

  // MutationObserver: päivitä kortit heti kun luokka.js lisää ne DOM:iin
  var _observers = [];
  var _lastT = null;
  var _applying = false; // estää itseään ruokkivan silmukan
  var _havahdukset = 0;          // circuit breaker -laskuri
  var _ikkunaAlku = Date.now();  // laskurin aikaikkuna

  function kaynnistaMutationObserver() {
    if (_observers.length) return;
    var containers = ['tasks-tet-tyokaveri', 'tasks-tet', 'tasks-valinnat'];
    containers.forEach(function (cid) {
      var el = document.getElementById(cid);
      if (!el) return;
      var obs = new MutationObserver(function (mutations) {
        if (_applying || !_lastT) return; // ohita käännöksen itse aiheuttamat muutokset

        // Circuit breaker: jos tarkkailija havahtuu epänormaalin monta kertaa
        // lyhyessä ajassa (esim. ulkoinen selainlaajennus tai odottamaton tila
        // muokkaa DOMia jatkuvasti), pysäytä tarkkailu kokonaan ettei sivu jää
        // silmukkaan ("Page Unresponsive").
        var nyt = Date.now();
        if (nyt - _ikkunaAlku > 2000) { _ikkunaAlku = nyt; _havahdukset = 0; }
        if (++_havahdukset > 40) {
          _observers.forEach(function (o) { o.obs.disconnect(); });
          _observers.length = 0;
          return;
        }

        // Reagoi VAIN jos lisätty solmu on aito tehtäväkortti (luokka.js:n lisäämä)
        // — ei käännöksen omiin eikä ulkoisiin DOM-muutoksiin.
        var uusiKortti = mutations.some(function (m) {
          return Array.prototype.some.call(m.addedNodes, function (n) {
            return n.nodeType === 1 && typeof n.querySelector === 'function' && (
              (n.matches && n.matches('a.vihko-kortti, a.keskustelu-kortti')) ||
              n.querySelector('a.vihko-kortti, a.keskustelu-kortti')
            );
          });
        });
        if (uusiKortti) sovellaKaannos();
      });
      obs.observe(el, { childList: true, subtree: true });
      _observers.push({ obs: obs, el: el });
    });
  }

  // Suorita käännös niin, ettei se laukaise observeria uudelleen
  function sovellaKaannos() {
    if (_applying || !_lastT) return;
    _applying = true;
    _observers.forEach(function (o) { o.obs.disconnect(); });
    try {
      kaannaTehtavaKortit(_lastT);
    } finally {
      _observers.forEach(function (o) {
        o.obs.observe(o.el, { childList: true, subtree: true });
      });
      _applying = false;
    }
  }

  function paivitaKortit(t) {
    _lastT = t;
    kaynnistaMutationObserver();
    sovellaKaannos();
  }

  /* ── Tapahtumakuuntelijat ── */
  document.addEventListener('digiopo:langchange', function (e) {
    applyG9(e.detail.t);
    paivitaVaroitukset(e.detail.t);
    paivitaKortit(e.detail.t);
  });

  /* Jos käännökset on jo ladattu ennen tätä skriptiä */
  if (window.DIGIOPO_T) {
    applyG9(window.DIGIOPO_T);
    paivitaVaroitukset(window.DIGIOPO_T);
    paivitaKortit(window.DIGIOPO_T);
  }

})();
