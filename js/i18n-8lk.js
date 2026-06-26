/**
 * DigiOpo i18n – 8. luokka sivukohtaiset käännökset
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

  function setHTML(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.innerHTML = val;
  }

  function setAllTxt(sel, vals) {
    if (!vals || !vals.length) return;
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < Math.min(els.length, vals.length); i++) {
      if (vals[i]) els[i].textContent = vals[i];
    }
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
  function applyG8(t) {
    var g8 = t && t.g8;
    if (!g8) return;

    /* Meta */
    if (g8.meta) {
      if (g8.meta.title) document.title = g8.meta.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && g8.meta.description) metaDesc.setAttribute('content', g8.meta.description);
    }

    /* Navigaatio - takaisin-linkki */
    setAttr('.nav-logo', 'aria-label', g(g8, 'nav.back_aria'));

    /* Sivupalkki */
    setTxt('.book-page-left h3', g(g8, 'sidebar.heading'));
    setTxt('.aihelista a[href="#johdanto"]', g(g8, 'sidebar.link_johdanto'));
    setTxt('.aihelista a[href="#koulutus"]', g(g8, 'sidebar.link_koulutus'));
    setTxt('.aihelista a[href="#koulutus-mission"]', g(g8, 'sidebar.link_koulutus_mission'));
    setTxt('.aihelista a[href="#vahvuudet"]', g(g8, 'sidebar.link_vahvuudet'));
    setTxt('.aihelista a[href="#vahvuudet-mission"]', g(g8, 'sidebar.link_vahvuudet_mission'));
    setTxt('.aihelista a[href="#tet"]', g(g8, 'sidebar.link_tet'));
    setTxt('.aihelista a[href="#tet-mission"]', g(g8, 'sidebar.link_tet_mission'));
    setTxt('.aihelista a[href="#klinikka"]', g(g8, 'sidebar.link_klinikka'));
    setTxt('.aihelista a[href="#tulevaisuus"]', g(g8, 'sidebar.link_tulevaisuus'));

    /* Breadcrumb */
    setTxt('.breadcrumb a[href="../index.html"]', g(g8, 'breadcrumb.home'));
    var crumbCurrent = document.querySelector('.breadcrumb');
    if (crumbCurrent && g8.breadcrumb) {
      var nodes = crumbCurrent.childNodes;
      for (var n = 0; n < nodes.length; n++) {
        if (nodes[n].nodeType === 3 && nodes[n].textContent.trim() === '8. luokka') {
          nodes[n].textContent = ' → ' + g8.breadcrumb.current;
          break;
        }
      }
    }

    /* H1 */
    setTxt('h1', g(g8, 'hero.h1'));

    /* ── Johdanto ── */
    var joh = g8.johdanto;
    if (joh) {
      setTxt('#otsikko-johdanto', joh.heading);
      setTxt('#johdanto .aihe-otsikko p', joh.subtitle);
      setTxt('.johdanto-maskotti-label', joh.label);
      setTxt('.johdanto-maskotti-teksti', joh.text);
      setAttr('#johdanto img[alt*="kaavio"]', 'alt', joh.img_alt);
    }

    /* ── Koulutus ── */
    var kou = g8.koulutus;
    if (kou) {
      setTxt('#otsikko-koulutus', kou.heading);
      setTxt('#koulutus .aihe-otsikko p', kou.subtitle);
      var kouTheory = document.querySelectorAll('#koulutus .theory-text p');
      if (kouTheory[0] && kou.p1) kouTheory[0].textContent = kou.p1;
      if (kouTheory[1] && kou.p2) kouTheory[1].innerHTML = '<strong>' + kou.p2 + '</strong>';
      setTxt('#koulutus button[onclick="avaaKjLightbox()"]', kou.btn_kaavio);
      setTxt('.ala-karuselli-otsikko', kou.karuselli_heading);
      setTxt('.ala-karuselli-kuvaus', kou.karuselli_desc);

      /* Karusellinimet */
      var slideNames = [
        kou.ala_kauppa, kou.ala_elintarvike, kou.ala_it, kou.ala_luonto,
        kou.ala_palvelu, kou.ala_tekniikka, kou.ala_taide, kou.ala_sote
      ];
      var slideNimiEls = document.querySelectorAll('.ala-slide-nimi');
      for (var s = 0; s < slideNimiEls.length && s < slideNames.length; s++) {
        if (slideNames[s]) slideNimiEls[s].textContent = slideNames[s];
      }

      /* Koulutusala-testi kortti */
      var testiH3 = document.querySelector('#koulutus [data-tapa="yksin"][data-tyyppi="testi"] ~ h3, #koulutus h3');
      var testiCards = document.querySelectorAll('#koulutus [style*="min-height: 240px"], #koulutus [style*="min-height:240px"]');
      if (testiCards[0]) {
        var testiH3el = testiCards[0].querySelector('h3');
        var testiPel  = testiCards[0].querySelector('p');
        if (testiH3el && kou.testi_heading) testiH3el.textContent = kou.testi_heading;
        if (testiPel && kou.testi_desc) testiPel.textContent = kou.testi_desc;
        var testiBadge = testiCards[0].querySelector('.hero-badge');
        if (testiBadge && kou.testi_badge) {
          var icon = testiBadge.querySelector('i');
          testiBadge.textContent = kou.testi_badge;
          if (icon) testiBadge.insertBefore(icon, testiBadge.firstChild);
        }
        var testiBtnEl = testiCards[0].querySelector('a.btn-hero');
        if (testiBtnEl && kou.testi_btn) testiBtnEl.textContent = kou.testi_btn;
        var testiVinkki = testiCards[0].querySelector('p[style*="opacity: 0.75"], p[style*="opacity:0.75"]');
        if (testiVinkki && kou.testi_vinkki) testiVinkki.textContent = kou.testi_vinkki;
      }

      /* AmmattiSet */
      if (testiCards[1]) {
        var asetH3 = testiCards[1].querySelector('h3');
        var asetP  = testiCards[1].querySelector('p');
        if (asetH3 && kou.alaset_heading) asetH3.textContent = kou.alaset_heading;
        if (asetP && kou.alaset_desc) asetP.textContent = kou.alaset_desc;
        var asetBadge = testiCards[1].querySelector('.hero-badge');
        if (asetBadge && kou.alaset_badge) {
          var asetIcon = asetBadge.querySelector('i');
          asetBadge.textContent = kou.alaset_badge;
          if (asetIcon) asetBadge.insertBefore(asetIcon, asetBadge.firstChild);
        }
        var asetBtn = testiCards[1].querySelector('a.btn-hero');
        if (asetBtn && kou.alaset_btn) asetBtn.textContent = kou.alaset_btn;
      }

      /* Maailma tarvitsee sinua */
      var maailmaCard = document.getElementById('koulutus-mission');
      if (maailmaCard) {
        var maailmaH3 = maailmaCard.querySelector('h3');
        var maailmaP  = maailmaCard.querySelector('p');
        var maailmaBtn = maailmaCard.querySelector('button.btn-hero');
        var maailmaBadge = maailmaCard.querySelector('.hero-badge');
        if (maailmaH3 && kou.maailma_heading) maailmaH3.textContent = kou.maailma_heading;
        if (maailmaP && kou.maailma_desc) maailmaP.textContent = kou.maailma_desc;
        if (maailmaBtn && kou.maailma_btn_open) maailmaBtn.textContent = kou.maailma_btn_open;
        if (maailmaBadge && kou.maailma_badge) {
          var mIcon = maailmaBadge.querySelector('i');
          maailmaBadge.textContent = kou.maailma_badge;
          if (mIcon) maailmaBadge.insertBefore(mIcon, maailmaBadge.firstChild);
        }
      }
      var suljeMaailmaBtn = document.querySelector('#maailma-wrapper button');
      if (suljeMaailmaBtn && kou.maailma_btn_close) {
        var closeIcon = suljeMaailmaBtn.querySelector('i');
        suljeMaailmaBtn.textContent = ' ' + kou.maailma_btn_close;
        if (closeIcon) suljeMaailmaBtn.insertBefore(closeIcon, suljeMaailmaBtn.firstChild);
      }
    }

    /* ── Vahvuudet ── */
    var vah = g8.vahvuudet;
    if (vah) {
      setTxt('#otsikko-vahvuudet', vah.heading);
      setTxt('#vahvuudet .aihe-otsikko p', vah.subtitle);
      var vahIntros = document.querySelectorAll('#vahvuudet > div > p');
      if (vahIntros[0] && vah.intro1) vahIntros[0].textContent = vah.intro1;
      if (vahIntros[1] && vah.intro2) vahIntros[1].textContent = vah.intro2;

      /* Vahvuusmatka */
      var vmCard = document.querySelector('#vahvuudet [data-tyyppi="tarina"]');
      if (vmCard) {
        var vmParent = vmCard.closest('[style*="min-height"]');
        if (vmParent) {
          var vmBadge = vmParent.querySelector('.hero-badge');
          var vmH3    = vmParent.querySelector('h3');
          var vmP     = vmParent.querySelector('p:not(.btn-hero)');
          var vmBtn   = vmParent.querySelector('button.btn-hero');
          var vmVinkki = vmParent.querySelector('p[style*="opacity"]');
          if (vmBadge && vah.vahvuusmatka_badge) {
            var vmIcon = vmBadge.querySelector('i');
            vmBadge.textContent = vah.vahvuusmatka_badge;
            if (vmIcon) vmBadge.insertBefore(vmIcon, vmBadge.firstChild);
          }
          if (vmH3 && vah.vahvuusmatka_heading) vmH3.textContent = vah.vahvuusmatka_heading;
          if (vmP && vah.vahvuusmatka_desc) vmP.textContent = vah.vahvuusmatka_desc;
          if (vmBtn && vah.vahvuusmatka_btn) vmBtn.textContent = vah.vahvuusmatka_btn;
          if (vmVinkki && vah.vahvuusmatka_vinkki) vmVinkki.textContent = vah.vahvuusmatka_vinkki;
        }
      }
      var suljeVmBtn = document.querySelector('#vahvuusmatkaContainer button');
      if (suljeVmBtn && vah.vahvuusmatka_close) {
        var svIcon = suljeVmBtn.querySelector('i');
        suljeVmBtn.textContent = ' ' + vah.vahvuusmatka_close;
        if (svIcon) suljeVmBtn.insertBefore(svIcon, suljeVmBtn.firstChild);
      }

      /* Fake Insta */
      var fiCard = document.getElementById('vahvuudet-mission');
      if (fiCard) {
        var fiH3    = fiCard.querySelector('h3');
        var fiP     = fiCard.querySelector('p[style*="opacity: 0.95"]');
        var fiBtn   = fiCard.querySelector('button.btn-hero');
        var fiBadge = fiCard.querySelector('.hero-badge');
        var fiMeta  = fiCard.querySelector('span[style*="font-size:13px"]');
        if (fiBadge && vah.fakeinsta_badge) {
          var fiIcon = fiBadge.querySelector('i');
          fiBadge.textContent = vah.fakeinsta_badge;
          if (fiIcon) fiBadge.insertBefore(fiIcon, fiBadge.firstChild);
        }
        if (fiH3  && vah.fakeinsta_heading) fiH3.textContent = vah.fakeinsta_heading;
        if (fiP   && vah.fakeinsta_desc)    fiP.textContent  = vah.fakeinsta_desc;
        if (fiBtn && vah.fakeinsta_btn_open) fiBtn.textContent = vah.fakeinsta_btn_open;
        if (fiMeta && vah.fakeinsta_meta)    fiMeta.textContent = vah.fakeinsta_meta;
      }
      var fiCloseBtn = document.querySelector('#fake-insta-wrapper button');
      if (fiCloseBtn && vah.fakeinsta_btn_close) {
        var ficIcon = fiCloseBtn.querySelector('i');
        fiCloseBtn.textContent = ' ' + vah.fakeinsta_btn_close;
        if (ficIcon) fiCloseBtn.insertBefore(ficIcon, fiCloseBtn.firstChild);
      }

      /* Haaste (vahvuudet) */
      var vahHaasteBtns = document.querySelectorAll('#vahvuudet .haaste-toggle .haaste-toggle-left > span:last-child');
      vahHaasteBtns.forEach(function(el) { if (vah.haaste_toggle) el.textContent = vah.haaste_toggle; });
      var vahHaasteOhje = document.querySelector('#vahvuudet .haaste-ohje');
      if (vahHaasteOhje && vah.haaste_ohje) vahHaasteOhje.innerHTML = vah.haaste_ohje;
      var vahHaasteVihje = document.querySelector('#vahvuudet .haaste-vihje');
      if (vahHaasteVihje && vah.haaste_vihje) vahHaasteVihje.textContent = vah.haaste_vihje;
    }

    /* ── TET ── */
    var tet = g8.tet;
    if (tet) {
      setTxt('#otsikko-tet', tet.heading);
      setTxt('#tet .aihe-otsikko p', tet.subtitle);
      var tetTheory = document.querySelectorAll('#tet .theory-text p');
      if (tetTheory[0] && tet.p1) tetTheory[0].textContent = tet.p1;
      if (tetTheory[1] && tet.p2) tetTheory[1].innerHTML = '<strong>' + tet.p2 + '</strong>';
      setTxt('.tet-polku-ohje', tet.polku_ohje);

      /* Polku - vaihenimet */
      var vaiheLabels = [tet.vaihe1_label, tet.vaihe2_label, tet.vaihe3_label,
                         tet.vaihe4_label, tet.vaihe5_label, tet.vaihe6_label];
      var vaiheEls = document.querySelectorAll('.tet-noodi-label');
      for (var v = 0; v < vaiheEls.length && v < vaiheLabels.length; v++) {
        if (vaiheLabels[v]) vaiheEls[v].textContent = vaiheLabels[v];
      }

      /* TET-paneelit */
      var paneeliData = [
        { heading: tet.paneeli1_heading, p1: tet.paneeli1_p1, vihje: tet.paneeli1_vihje },
        { heading: tet.paneeli2_heading, p1: tet.paneeli2_p1, kyll: tet.paneeli2_kyll_html, ei: tet.paneeli2_ei_html, vihje: tet.paneeli2_vihje },
        { heading: tet.paneeli3_heading, p1: tet.paneeli3_p1, p2: tet.paneeli3_p2, vihje: tet.paneeli3_vihje },
        { heading: tet.paneeli4_heading, p1: tet.paneeli4_p1, p2: tet.paneeli4_p2, vihje: tet.paneeli4_vihje },
        { heading: tet.paneeli5_heading, p1: tet.paneeli5_p1, vihje: tet.paneeli5_vihje },
        { heading: tet.paneeli6_heading, p1: tet.paneeli6_p1, vihje: tet.paneeli6_vihje }
      ];
      for (var pi = 1; pi <= 6; pi++) {
        var pan = document.getElementById('tet-paneeli-' + pi);
        var pd  = paneeliData[pi - 1];
        if (!pan || !pd) continue;
        var panH = pan.querySelector('.tet-paneeli-otsikko');
        if (panH && pd.heading) panH.textContent = pd.heading;
        var panPs = pan.querySelectorAll('p');
        if (pi === 2) {
          // Paneeli 2 has special structure with <ul>
          if (panPs[0] && pd.p1) panPs[0].innerHTML = pd.p1;
          var liEls = pan.querySelectorAll('li');
          if (liEls[0] && pd.kyll) liEls[0].innerHTML = pd.kyll;
          if (liEls[1] && pd.ei)   liEls[1].innerHTML = pd.ei;
        } else {
          if (panPs[0] && pd.p1) panPs[0].textContent = pd.p1;
          if (panPs[1] && pd.p2) panPs[1].textContent = pd.p2;
        }
        var panVihje = pan.querySelector('.tet-paneeli-vihje');
        if (panVihje && pd.vihje) panVihje.textContent = pd.vihje;
      }

      /* Pyörä pyörii */
      var pyoraCard = document.getElementById('tet-mission');
      if (pyoraCard) {
        var pyoraH3    = pyoraCard.querySelector('h3');
        var pyoraP     = pyoraCard.querySelector('p[style*="opacity: 0.95"]');
        var pyoraBtn   = pyoraCard.querySelector('button.btn-hero');
        var pyoraBadge = pyoraCard.querySelector('.hero-badge');
        var pyoraMeta  = pyoraCard.querySelector('span[style*="font-size:13px"]');
        if (pyoraBadge && tet.pyora_badge) {
          var pyIcon = pyoraBadge.querySelector('i');
          pyoraBadge.textContent = tet.pyora_badge;
          if (pyIcon) pyoraBadge.insertBefore(pyIcon, pyoraBadge.firstChild);
        }
        if (pyoraH3  && tet.pyora_heading)   pyoraH3.textContent   = tet.pyora_heading;
        if (pyoraP   && tet.pyora_desc)       pyoraP.textContent    = tet.pyora_desc;
        if (pyoraBtn && tet.pyora_btn_open)   pyoraBtn.textContent  = tet.pyora_btn_open;
        if (pyoraMeta && tet.pyora_meta)      pyoraMeta.textContent = tet.pyora_meta;
      }
      var pyoraCloseBtn = document.querySelector('#pyora-wrapper button');
      if (pyoraCloseBtn && tet.pyora_btn_close) {
        var pcIcon = pyoraCloseBtn.querySelector('i');
        pyoraCloseBtn.textContent = ' ' + tet.pyora_btn_close;
        if (pcIcon) pyoraCloseBtn.insertBefore(pcIcon, pyoraCloseBtn.firstChild);
      }

      /* Päivitä onnenpyörän kysymykset JS-muuttujaan */
      if (tet.spinner_questions) {
        window.tpKysymykset = tet.spinner_questions;
      }
    }

    /* ── Klinikka ── */
    var kli = g8.klinikka;
    if (kli) {
      setTxt('#otsikko-klinikka', kli.heading);
      setTxt('#klinikka .aihe-otsikko p', kli.subtitle);
      var kliBadge = document.querySelector('#klinikka .hero-card span, #klinikka span[style*="background:rgba"]');
      if (kliBadge && kli.badge) kliBadge.textContent = kli.badge;
      var kliP = document.querySelector('#klinikka p[style*="0.92rem"]');
      if (kliP && kli.kulku_html) kliP.innerHTML = kli.kulku_html;
    }

    /* ── Tulevaisuus ── */
    var tul = g8.tulevaisuus;
    if (tul) {
      setTxt('#otsikko-tulevaisuus', tul.heading);
      setTxt('#tulevaisuus .aihe-otsikko p', tul.subtitle);
      var tulTheory = document.querySelectorAll('#tulevaisuus .theory-text p');
      if (tulTheory[0] && tul.p1) tulTheory[0].innerHTML = tul.p1;
      if (tulTheory[1] && tul.p2) tulTheory[1].textContent = tul.p2;

      /* Tehtävä 1: Rakenna huomisen koulu */
      var task1Heading = document.querySelector('#tulevaisuus h3[style*="color:#3b0764"]');
      if (task1Heading && tul.task1_heading) task1Heading.textContent = tul.task1_heading;
      var task1Desc = document.querySelector('#tulevaisuus p[style*="margin:0 0 12px 42px"]');
      if (task1Desc && tul.task1_desc) task1Desc.textContent = tul.task1_desc;

      /* Avaa-nappi */
      var task1Btn = document.getElementById('tulevaisuus8-btn');
      if (task1Btn) {
        var t1BtnSpan = task1Btn.querySelector('span:first-child');
        if (t1BtnSpan && tul.task1_btn_open) t1BtnSpan.textContent = tul.task1_btn_open;
      }

      /* Sisällön rakenne - step headings */
      var t1Label = document.querySelector('#tulevaisuus8-sisalto [style*="display: inline-block"]');
      if (t1Label && tul.task1_label) t1Label.textContent = tul.task1_label;
      var t1StepsH3 = document.querySelector('#tulevaisuus8-sisalto h3[style*="color: #3b0764"]');
      if (t1StepsH3 && tul.task1_steps_heading) t1StepsH3.textContent = tul.task1_steps_heading;

      var stepDivs = document.querySelectorAll('#tulevaisuus8-sisalto > div:first-of-type [style*="border-radius:10px"]');
      if (stepDivs[0]) {
        var s1h = stepDivs[0].querySelector('[style*="font-weight:600"]');
        var s1p = stepDivs[0].querySelector('[style*="color:#6b7280"]');
        if (s1h && tul.task1_step1_heading) s1h.textContent = tul.task1_step1_heading;
        if (s1p && tul.task1_step1_desc)    s1p.textContent = tul.task1_step1_desc;
      }
      if (stepDivs[1]) {
        var s2h = stepDivs[1].querySelector('[style*="font-weight:600"]');
        var s2p = stepDivs[1].querySelector('[style*="color:#6b7280"]');
        if (s2h && tul.task1_step2_heading) s2h.textContent = tul.task1_step2_heading;
        if (s2p && tul.task1_step2_desc)    s2p.textContent = tul.task1_step2_desc;
      }
      if (stepDivs[2]) {
        var s3h = stepDivs[2].querySelector('[style*="font-weight:600"]');
        var s3p = stepDivs[2].querySelector('[style*="color:#6b7280"]');
        if (s3h && tul.task1_step3_heading) s3h.textContent = tul.task1_step3_heading;
        if (s3p && tul.task1_step3_desc)    s3p.textContent = tul.task1_step3_desc;
      }

      /* Palautusmuoto-kortit */
      setTxt('#tulevaisuus8-sisalto [style*="color: #6d28d9"][style*="font-size: 0.7rem"]', tul.submission_title);
      var submDesc = document.querySelector('#tulevaisuus8-sisalto p[style*="font-size:0.85rem"]');
      if (submDesc && tul.submission_desc) submDesc.textContent = tul.submission_desc;
      var submCards = document.querySelectorAll('#tulevaisuus8-sisalto [style*="border:1.5px solid #ddd6fe"]');
      if (submCards[0]) {
        var canvaH = submCards[0].querySelector('[style*="font-weight:700"]');
        var canvaP = submCards[0].querySelector('[style*="font-size:0.8rem"]');
        if (canvaH && tul.canva_title) canvaH.textContent = tul.canva_title;
        if (canvaP && tul.canva_desc_html) canvaP.innerHTML = tul.canva_desc_html;
      }
      if (submCards[1]) {
        var hdH = submCards[1].querySelector('[style*="font-weight:700"]');
        var hdP = submCards[1].querySelector('[style*="font-size:0.8rem"]');
        if (hdH && tul.handdrawn_title) hdH.textContent = tul.handdrawn_title;
        if (hdP && tul.handdrawn_desc) hdP.textContent = tul.handdrawn_desc;
      }
      if (submCards[2]) {
        var gsH = submCards[2].querySelector('[style*="font-weight:700"]');
        var gsP = submCards[2].querySelector('[style*="font-size:0.8rem"]');
        if (gsH && tul.slides_title) gsH.textContent = tul.slides_title;
        if (gsP && tul.slides_desc) gsP.textContent = tul.slides_desc;
      }
      var submTip = document.querySelector('#tulevaisuus8-sisalto [style*="color: #5b21b6"][style*="italic"]');
      if (submTip && tul.submission_tip) submTip.textContent = tul.submission_tip;
      var openBtn = document.querySelector('#tulevaisuus8-sisalto a[href*="Tulevaisuus_8lk"]');
      if (openBtn && tul.open_task_btn) openBtn.textContent = tul.open_task_btn;

      /* Ryhmä jumissa */
      var stuckToggle = document.querySelector('#vara-sisalto').previousElementSibling;
      if (stuckToggle) {
        var stuckSpan = stuckToggle.querySelector('span > span:last-child');
        if (stuckSpan && tul.stuck_toggle) stuckSpan.textContent = tul.stuck_toggle;
      }
      var stuckIntroP = document.querySelector('#vara-sisalto > p');
      if (stuckIntroP && tul.stuck_intro) stuckIntroP.textContent = tul.stuck_intro;

      /* Mission 1 */
      var m1Card = document.getElementById('tulevaisuus-mission');
      if (m1Card) {
        var m1H4 = m1Card.querySelector('h4');
        var m1Badge = m1Card.querySelector('.mission-badge');
        var m1P = m1Card.querySelector('p:not(.mission-hint)');
        var m1Lis = m1Card.querySelectorAll('li');
        var m1Hint = m1Card.querySelector('.mission-hint');
        if (m1H4    && tul.mission1_heading) m1H4.textContent    = tul.mission1_heading;
        if (m1Badge && tul.mission1_badge)   m1Badge.textContent = tul.mission1_badge;
        if (m1P     && tul.mission1_p)       m1P.textContent     = tul.mission1_p;
        if (m1Lis[0] && tul.mission1_li1)    m1Lis[0].textContent = tul.mission1_li1;
        if (m1Lis[1] && tul.mission1_li2)    m1Lis[1].textContent = tul.mission1_li2;
        if (m1Lis[2] && tul.mission1_li3)    m1Lis[2].textContent = tul.mission1_li3;
        if (m1Hint  && tul.mission1_hint)    m1Hint.textContent  = tul.mission1_hint;
      }

      /* Tehtävä 2: Tulevaisuuden työpaikka */
      var task2H3 = document.getElementById('otsikko-tyopaikka');
      if (task2H3 && tul.task2_heading) task2H3.textContent = tul.task2_heading;
      var task2Btn = document.getElementById('tyopaikka8-btn');
      if (task2Btn) {
        var t2Span = task2Btn.querySelector('span:first-child');
        if (t2Span && tul.task2_btn_open) t2Span.textContent = tul.task2_btn_open;
      }

      /* Onnenpyörä - vaihe 1 */
      var phase1Label = document.querySelector('#tyopaikka8-sisalto [style*="color:#6d28d9"][style*="0.7rem"]');
      if (phase1Label && tul.spinner_phase1) phase1Label.textContent = tul.spinner_phase1;
      var phase1P = document.querySelector('#tyopaikka8-sisalto > div p[style*="0.88rem"]');
      if (phase1P && tul.spinner_phase1_p) phase1P.textContent = tul.spinner_phase1_p;
      var resulLabel = document.querySelector('#tp-tulos [style*="color:#7c3aed"]');
      if (resulLabel && tul.spinner_result_label) resulLabel.textContent = tul.spinner_result_label;
      var spinBtn = document.getElementById('tp-pyora-btn');
      if (spinBtn && tul.spinner_btn) spinBtn.textContent = tul.spinner_btn;
      var spinHint = document.querySelector('#tyopaikka8-sisalto p[style*="color:#9ca3af"]');
      if (spinHint && tul.spinner_hint) spinHint.textContent = tul.spinner_hint;

      /* Päivitä spinner-kysymykset JS-muuttujaan */
      if (tul.spinner_questions && tul.spinner_questions.length) {
        window.tpKysymykset = tul.spinner_questions;
      }

      /* Vaihe 2 - Rakenna */
      var phase2Label = document.querySelector('#tyopaikka8-sisalto [style*="color:#6d28d9"][style*="0.7rem"]:last-of-type, #tyopaikka8-sisalto [style*="Nyt rakennetaan"]');
      // Haetaan vaihe 2 -otsikko position-perusteisesti
      var allPhaseLabels = document.querySelectorAll('#tyopaikka8-sisalto [style*="color:#6d28d9"][style*="0.7rem"]');
      if (allPhaseLabels[1] && tul.build_phase_title) allPhaseLabels[1].textContent = tul.build_phase_title;
      var buildP = document.querySelector('#tyopaikka8-sisalto [style*="color:#4b5563"][style*="0.88rem"]:last-of-type');
      if (buildP && tul.build_phase_p) buildP.textContent = tul.build_phase_p;

      /* LEGO ja vaihtoehdot */
      var legoCard = document.querySelector('#tyopaikka8-sisalto [style*="border:2px solid #7c3aed"]');
      if (legoCard) {
        var legoH = legoCard.querySelector('strong');
        var legoP = legoCard.querySelector('p');
        if (legoH && tul.lego_title) legoH.textContent = tul.lego_title;
        if (legoP && tul.lego_p)     legoP.textContent = tul.lego_p;
      }
      var noLegoCard = document.querySelector('#tyopaikka8-sisalto [style*="border:1.5px solid #ddd6fe"]');
      if (noLegoCard) {
        var noLegoH = noLegoCard.querySelector('strong');
        if (noLegoH && tul.nolego_title) noLegoH.textContent = tul.nolego_title;
        var altCards = noLegoCard.querySelectorAll('[style*="border-radius:8px"]');
        var altData = [
          { title: tul.draw_title,      desc: tul.draw_desc },
          { title: tul.prototype_title, desc: tul.prototype_desc },
          { title: tul.sticker_title,   desc: tul.sticker_desc }
        ];
        for (var ai = 0; ai < altCards.length && ai < altData.length; ai++) {
          var aH = altCards[ai].querySelector('[style*="font-weight:700"]');
          var aP = altCards[ai].querySelector('[style*="font-size:0.82rem"]');
          if (aH && altData[ai].title) aH.textContent = altData[ai].title;
          if (aP && altData[ai].desc)  aP.textContent = altData[ai].desc;
        }
      }
      var buildTip = document.querySelector('#tyopaikka8-sisalto [style*="color: #5b21b6"][style*="italic"]');
      if (buildTip && tul.build_tip) buildTip.textContent = tul.build_tip;

      /* Mission 2 */
      var m2Card = document.getElementById('tulevaisuus2-mission');
      if (m2Card) {
        var m2H4    = m2Card.querySelector('h4');
        var m2Badge = m2Card.querySelector('.mission-badge');
        var m2P     = m2Card.querySelector('p:not(.mission-hint)');
        var m2Lis   = m2Card.querySelectorAll('li');
        var m2Hint  = m2Card.querySelector('.mission-hint');
        if (m2H4    && tul.mission2_heading) m2H4.textContent    = tul.mission2_heading;
        if (m2Badge && tul.mission2_badge)   m2Badge.textContent = tul.mission2_badge;
        if (m2P     && tul.mission2_p)       m2P.textContent     = tul.mission2_p;
        if (m2Lis[0] && tul.mission2_li1) m2Lis[0].textContent = tul.mission2_li1;
        if (m2Lis[1] && tul.mission2_li2) m2Lis[1].textContent = tul.mission2_li2;
        if (m2Lis[2] && tul.mission2_li3) m2Lis[2].textContent = tul.mission2_li3;
        if (m2Lis[3] && tul.mission2_li4) m2Lis[3].innerHTML = '<strong>' + tul.mission2_li4.split(':')[0] + ':</strong> ' + tul.mission2_li4.split(':').slice(1).join(':');
        if (m2Hint  && tul.mission2_hint) m2Hint.textContent = tul.mission2_hint;
      }

      /* Haaste (tulevaisuus) */
      var tulHaaste = document.querySelector('#tulevaisuus .haaste-sisalto');
      if (tulHaaste) {
        var tulHaOhje  = tulHaaste.querySelector('.haaste-ohje');
        var tulHaVihje = tulHaaste.querySelector('.haaste-vihje');
        if (tulHaOhje  && tul.haaste_ohje_html) tulHaOhje.innerHTML  = tul.haaste_ohje_html;
        if (tulHaVihje && tul.haaste_vihje)     tulHaVihje.textContent = tul.haaste_vihje;
      }
      var tulHaastetog = document.querySelector('#tulevaisuus .haaste-toggle .haaste-toggle-left > span:last-child');
      if (tulHaastetog && tul.haaste_toggle) tulHaastetog.textContent = tul.haaste_toggle;
    }

  }

  /* ── Vain-suomeksi-varoitukset interaktiivisille tehtäville ── */
  var FI_ONLY_CLASS = 'fi-only-varoitus';

  // Elementit joissa sisältö on vain suomeksi
  var FI_ONLY_SELECTORS = [
    'a.btn-hero[href*="koulutusalat.html"]',
    'a.btn-hero[href*="ala-set.html"]',
    'button[aria-controls="maailma-wrapper"]',
    'button[onclick*="avaaVahvuusmatka"]',
    'button[aria-controls="fake-insta-wrapper"]',
    'button[aria-controls="pyora-wrapper"]',
    'iframe[src*="oppimisklinikka"]'
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
      // Lisää elementin jälkeen (tai iframen edelle)
      if (el.tagName === 'IFRAME') {
        el.parentNode.insertBefore(varoitus, el);
      } else {
        el.insertAdjacentElement('afterend', varoitus);
      }
    });
  }

  function paivitaVaroitukset(t) {
    var teksti = t && t.g8 && t.g8.fi_only_warning ? t.g8.fi_only_warning : null;
    lisaaVaroitukset(teksti);
  }

  /* ── Oma reitti löytyy tutkimalla ── */
  function applyTutkija(t) {
    var tj = t && t.g8 && t.g8.tutkija;
    if (!tj) return;

    /* Sivupalkki */
    var sidebarLinkTxt = t && t.g8 && t.g8.sidebar && t.g8.sidebar.link_tutkija;
    setTxt('.aihelista a[href="#tutkija-alue"]', sidebarLinkTxt);

    /* Otsikko & alaotsikko */
    setTxt('.ala-karuselli-otsikko', tj.heading);
    var subtitleEl = document.querySelector('#tutkija-alue > p');
    if (subtitleEl && tj.subtitle) subtitleEl.textContent = tj.subtitle;

    /* Opettajan ohje -nappi */
    var teacherBtn = document.querySelector('button[aria-controls="opettaja-ohje-sisalto"]');
    if (teacherBtn && tj.teacher_btn) {
      var span = teacherBtn.querySelector('span');
      teacherBtn.textContent = ' ' + tj.teacher_btn;
      if (span) teacherBtn.insertBefore(span, teacherBtn.firstChild);
    }
    /* Opettajan ohje -sisältö */
    var teacherBox = document.getElementById('opettaja-ohje-sisalto');
    if (teacherBox && tj.teacher_p1) {
      var ps = teacherBox.querySelectorAll('p');
      var lis = teacherBox.querySelectorAll('li');
      if (ps[0] && tj.teacher_p1) ps[0].textContent = tj.teacher_p1;
      if (lis[0] && tj.teacher_amis) lis[0].innerHTML = '<strong>Amispolku</strong> — ' + tj.teacher_amis;
      if (lis[1] && tj.teacher_lukio) lis[1].innerHTML = '<strong>Lukiopolku</strong> — ' + tj.teacher_lukio;
      if (ps[1] && tj.teacher_p2) ps[1].textContent = tj.teacher_p2;
    }

    /* Välilehdet */
    var tabAmis  = document.getElementById('tab-amis');
    var tabLukio = document.getElementById('tab-lukio');
    if (tabAmis  && tj.tab_amis)  tabAmis.textContent  = tj.tab_amis;
    if (tabLukio && tj.tab_lukio) tabLukio.textContent = tj.tab_lukio;

    /* ── AMISPOLKU ── */
    var amisPanel = document.getElementById('tutkija-amis');
    if (amisPanel) {
      /* Kuvaus */
      var amisDesc = amisPanel.querySelector('.tj-kuvaus');
      if (amisDesc && tj.amis_desc) amisDesc.textContent = tj.amis_desc;

      /* Tavoite-lista */
      var goalH = amisPanel.querySelector('.tj-tavoite h5');
      if (goalH && tj.amis_goal_heading) goalH.textContent = tj.amis_goal_heading;
      var goalLis = amisPanel.querySelectorAll('.tj-tavoite li');
      var goals = [tj.amis_goal_1, tj.amis_goal_2, tj.amis_goal_3, tj.amis_goal_4];
      for (var i = 0; i < goalLis.length && i < goals.length; i++) {
        if (goals[i]) goalLis[i].textContent = goals[i];
      }

      /* Etenemispolku */
      var steps = amisPanel.querySelectorAll('.tj-askel-teksti');
      var stepTexts = [tj.amis_step_1, tj.amis_step_2, tj.amis_step_3];
      for (var s = 0; s < steps.length && s < stepTexts.length; s++) {
        if (stepTexts[s]) steps[s].textContent = stepTexts[s];
      }

      /* Vaihe 1 otsikko & alaotsikko */
      var v1h = amisPanel.querySelector('#tutkija-amis .tj-osio-otsikko');
      if (v1h && tj.amis_v1_heading) {
        var vaiheSpan = v1h.querySelector('.tj-osio-vaihe');
        v1h.textContent = tj.amis_v1_heading;
        if (vaiheSpan) v1h.insertBefore(vaiheSpan, v1h.firstChild);
      }
      var v1sub = amisPanel.querySelector('.tj-kiinnostukset + p, .tj-kiinnostukset').previousElementSibling;
      var v1subEl = amisPanel.querySelector('.tj-kuvaus[style]');
      if (v1subEl && tj.amis_v1_subtitle) v1subEl.textContent = tj.amis_v1_subtitle;

      /* Suodatinnapit */
      var filMap = {
        ihmiset: tj.amis_fil_ihmiset, tekniikka: tj.amis_fil_tekniikka,
        data: tj.amis_fil_data, ruoka: tj.amis_fil_ruoka,
        luonto: tj.amis_fil_luonto, taide: tj.amis_fil_taide,
        kauppa: tj.amis_fil_kauppa, liikunta: tj.amis_fil_liikunta
      };
      amisPanel.querySelectorAll('.tj-kiinnostukset .tj-nappi[data-ala]').forEach(function(btn) {
        var ala = btn.dataset.ala;
        if (filMap[ala]) btn.textContent = filMap[ala];
      });
      var amisReset = amisPanel.querySelector('.tj-kiinnostukset button:not([data-ala])');
      if (amisReset && tj.amis_fil_reset) amisReset.textContent = tj.amis_fil_reset;

      /* Vaihe 2 otsikko */
      var v2osiot = amisPanel.querySelectorAll('.tj-osio-otsikko');
      if (v2osiot[1] && tj.amis_v2_heading) {
        var v2span = v2osiot[1].querySelector('.tj-osio-vaihe');
        v2osiot[1].textContent = tj.amis_v2_heading;
        if (v2span) v2osiot[1].insertBefore(v2span, v2osiot[1].firstChild);
      }
      var v2sub = amisPanel.querySelector('.tj-kuvaus-v2');
      if (v2sub && tj.amis_v2_subtitle) v2sub.textContent = tj.amis_v2_subtitle;

      /* Vaihe 3 otsikko & alaotsikko */
      if (v2osiot[2] && tj.amis_v3_heading) {
        var v3span = v2osiot[2].querySelector('.tj-osio-vaihe');
        v2osiot[2].textContent = tj.amis_v3_heading;
        if (v3span) v2osiot[2].insertBefore(v3span, v2osiot[2].firstChild);
      }
      var v3sub = document.querySelector('#amis-v3-wrap > p');
      if (v3sub && tj.amis_v3_subtitle) {
        v3sub.innerHTML = tj.amis_v3_subtitle + ' <a href="https://opintopolku.fi" target="_blank" rel="noopener" style="color:#d97706;font-weight:600;">Opintopolku.fi</a>';
      }
      var v3ohje = document.getElementById('amis-v3-ohje');
      if (v3ohje && tj.amis_v3_ohje) v3ohje.querySelector('p').textContent = tj.amis_v3_ohje;

      /* ── Vaihe 2 OSA A ── */
      var osaA = document.getElementById('amis-osa-a');
      if (osaA) {
        /* OSA A label */
        var osaALabel = osaA.querySelector('.amis-v2-label');
        if (osaALabel && tj.v2a_label) osaALabel.textContent = tj.v2a_label;

        /* Koulutusmuoto */
        var kmNimet  = osaA.querySelectorAll('.km-nimi');
        var kmKuvaus = osaA.querySelectorAll('.km-kuvaus');
        if (kmNimet[0]  && tj.v2a_km1_nimi)   kmNimet[0].textContent  = tj.v2a_km1_nimi;
        if (kmKuvaus[0] && tj.v2a_km1_kuvaus)  kmKuvaus[0].textContent = tj.v2a_km1_kuvaus;
        if (kmNimet[1]  && tj.v2a_km2_nimi)   kmNimet[1].textContent  = tj.v2a_km2_nimi;
        if (kmKuvaus[1] && tj.v2a_km2_kuvaus)  kmKuvaus[1].textContent = tj.v2a_km2_kuvaus;
        var kmVs = osaA.querySelector('.km-vs');
        if (kmVs && tj.v2a_vai) kmVs.textContent = tj.v2a_vai;

        /* YTO-boksi */
        var ytoBoksi = osaA.querySelector('.yto-boksi');
        if (ytoBoksi) {
          var ytoOtsikko = ytoBoksi.querySelector('.yto-otsikko');
          if (ytoOtsikko && tj.v2a_yto_otsikko) ytoOtsikko.textContent = tj.v2a_yto_otsikko;
          var ytoKuvaus = ytoBoksi.querySelector('.yto-kuvaus');
          if (ytoKuvaus && tj.v2a_yto_kuvaus) ytoKuvaus.textContent = tj.v2a_yto_kuvaus;
          var ytoAineet = ytoBoksi.querySelectorAll('.yto-aine span:last-child');
          var ytoTexts  = [tj.v2a_yto_1, tj.v2a_yto_2, tj.v2a_yto_3, tj.v2a_yto_4];
          for (var yi = 0; yi < ytoAineet.length && yi < ytoTexts.length; yi++) {
            if (ytoTexts[yi]) ytoAineet[yi].textContent = ytoTexts[yi];
          }
          var ytoLinkki = ytoBoksi.querySelector('.yto-linkki');
          if (ytoLinkki && tj.v2a_yto_linkki) ytoLinkki.textContent = tj.v2a_yto_linkki;
        }

        /* Arki-kortit */
        var arkiKortit = osaA.querySelectorAll('.tj-arki-kortti');
        var arkiData   = [
          [tj.v2a_arki1_nimi, tj.v2a_arki1_kuvaus],
          [tj.v2a_arki2_nimi, tj.v2a_arki2_kuvaus],
          [tj.v2a_arki3_nimi, tj.v2a_arki3_kuvaus]
        ];
        for (var ai = 0; ai < arkiKortit.length && ai < arkiData.length; ai++) {
          var ak = arkiKortit[ai];
          if (arkiData[ai][0]) { var ah = ak.querySelector('h5'); if (ah) ah.textContent = arkiData[ai][0]; }
          if (arkiData[ai][1]) { var ap = ak.querySelector('p');  if (ap) ap.textContent = arkiData[ai][1]; }
        }

        /* Kuittaa A */
        var kuittaaA = document.getElementById('kuittaa-a');
        if (kuittaaA && tj.v2a_kuittaa && !kuittaaA.classList.contains('kuitattu')) {
          var kaSpan = kuittaaA.querySelector('span');
          kuittaaA.textContent = ' ' + tj.v2a_kuittaa;
          if (kaSpan) kuittaaA.insertBefore(kaSpan, kuittaaA.firstChild);
        }
      }

      /* ── Vaihe 2 OSA B ── */
      var osaB = document.getElementById('amis-osa-b');
      if (osaB) {
        /* OSA B label */
        var osaBLabel = osaB.querySelector('.amis-v2-label');
        if (osaBLabel && tj.v2b_label) osaBLabel.textContent = tj.v2b_label;

        /* Reveal-nappi */
        var revealOtsikko = osaB.querySelector('.amis-reveal-otsikko');
        if (revealOtsikko && tj.v2b_reveal_otsikko) revealOtsikko.textContent = tj.v2b_reveal_otsikko;
        var revealKuvaus = osaB.querySelector('.amis-reveal-kuvaus');
        if (revealKuvaus && tj.v2b_reveal_kuvaus) revealKuvaus.textContent = tj.v2b_reveal_kuvaus;

        /* Tarina-tabit */
        var tarinaTabit = osaB.querySelectorAll('.tj-tarina-nappi');
        var tarinaLabels = [
          tj.v2b_tab_lahihoitaja, tj.v2b_tab_kokki,    tj.v2b_tab_datanomi,
          tj.v2b_tab_asentaja,    tj.v2b_tab_ymparistonhoitaja, tj.v2b_tab_artesaani,
          tj.v2b_tab_myynti,      tj.v2b_tab_liikunta
        ];
        for (var ti = 0; ti < tarinaTabit.length && ti < tarinaLabels.length; ti++) {
          if (tarinaLabels[ti]) tarinaTabit[ti].textContent = tarinaLabels[ti];
        }

        /* Kuittaa B */
        var kuittaaB = document.getElementById('kuittaa-b');
        if (kuittaaB && tj.v2b_kuittaa && !kuittaaB.classList.contains('kuitattu')) {
          var kbSpan = kuittaaB.querySelector('span');
          kuittaaB.textContent = ' ' + tj.v2b_kuittaa;
          if (kbSpan) kuittaaB.insertBefore(kbSpan, kuittaaB.firstChild);
        }
      }

      /* ── Yhteenveto (amispolku) ── */
      var amisYhteenveto = document.getElementById('amis-yhteenveto');
      if (amisYhteenveto) {
        var ayH5 = amisYhteenveto.querySelector('h5');
        if (ayH5 && tj.yhteenveto_otsikko) ayH5.textContent = tj.yhteenveto_otsikko;
        var ayPs = amisYhteenveto.querySelectorAll('p');
        if (ayPs[0] && tj.yhteenveto_p1) ayPs[0].textContent = tj.yhteenveto_p1;
        if (ayPs[1] && tj.yhteenveto_p2) ayPs[1].textContent = tj.yhteenveto_p2;
      }

      /* ── Erityisammattioppilaitokset ── */
      var erityisOtsikko = amisPanel.querySelector('.tj-osio-otsikko:last-of-type');
      /* Find by text content since there's no id */
      amisPanel.querySelectorAll('.tj-osio-otsikko').forEach(function(el) {
        if (el.textContent.indexOf('Erityisammattioppilaitokset') !== -1 && tj.erityis_heading) {
          var lisatietoSpan = el.querySelector('span');
          el.textContent = tj.erityis_heading;
          if (lisatietoSpan) el.insertBefore(lisatietoSpan, el.firstChild);
        }
      });
      var erityisKuvaus = amisPanel.querySelector('.erityis-grid');
      if (erityisKuvaus && tj.erityis_kuvaus) {
        var erPrev = erityisKuvaus.previousElementSibling;
        if (erPrev && erPrev.classList.contains('tj-kuvaus')) erPrev.textContent = tj.erityis_kuvaus;
      }
    }

    /* ── LUKIOPOLKU ── */
    var lukioPanel = document.getElementById('tutkija-lukio');
    if (lukioPanel) {
      /* Kuvaus */
      var lukioDesc = lukioPanel.querySelector('.tj-kuvaus');
      if (lukioDesc && tj.lukio_desc) lukioDesc.textContent = tj.lukio_desc;

      /* Tavoite-lista */
      var lGoalH = lukioPanel.querySelector('.tj-tavoite h5');
      if (lGoalH && tj.lukio_goal_heading) lGoalH.textContent = tj.lukio_goal_heading;
      var lGoalLis = lukioPanel.querySelectorAll('.tj-tavoite li');
      var lGoals = [tj.lukio_goal_1, tj.lukio_goal_2, tj.lukio_goal_3, tj.lukio_goal_4];
      for (var li = 0; li < lGoalLis.length && li < lGoals.length; li++) {
        if (lGoals[li]) lGoalLis[li].textContent = lGoals[li];
      }

      /* Etenemispolku */
      var lSteps = lukioPanel.querySelectorAll('.tj-askel-teksti');
      var lStepTexts = [tj.lukio_step_1, tj.lukio_step_2, tj.lukio_step_3, tj.lukio_step_4];
      for (var ls = 0; ls < lSteps.length && ls < lStepTexts.length; ls++) {
        if (lStepTexts[ls]) lSteps[ls].textContent = lStepTexts[ls];
      }

      /* Vaihe 1 otsikko */
      var lv1h = lukioPanel.querySelector('.tj-osio-otsikko');
      if (lv1h && tj.lukio_v1_heading) {
        var lv1span = lv1h.querySelector('.tj-osio-vaihe');
        lv1h.textContent = tj.lukio_v1_heading;
        if (lv1span) lv1h.insertBefore(lv1span, lv1h.firstChild);
      }
      var lv1sub = lukioPanel.querySelector('.tj-kuvaus[style]');
      if (lv1sub && tj.lukio_v1_subtitle) lv1sub.textContent = tj.lukio_v1_subtitle;

      /* Suodatinnapit */
      var lFilMap = {
        kielet: tj.lukio_fil_kielet, matikka: tj.lukio_fil_matikka,
        yhteiskunta: tj.lukio_fil_yhteiskunta, taide: tj.lukio_fil_taide,
        liikunta: tj.lukio_fil_liikunta, viestinta: tj.lukio_fil_viestinta,
        englanti: tj.lukio_fil_englanti
      };
      lukioPanel.querySelectorAll('.tj-kiinnostukset .tj-nappi[data-ala]').forEach(function(btn) {
        var ala = btn.dataset.ala;
        if (lFilMap[ala]) btn.textContent = lFilMap[ala];
      });
      var lukioReset = lukioPanel.querySelector('.tj-kiinnostukset button:not([data-ala])');
      if (lukioReset && tj.lukio_fil_reset) lukioReset.textContent = tj.lukio_fil_reset;

      /* ── Lukiopolku Vaihe 2: erikoislukio-kuvaus + Päivä lukiolaisena ── */
      var lukioOsiot = lukioPanel.querySelectorAll('.tj-osio-otsikko');
      /* LukioPanel otsikot järjestyksessä: [0]=V1, [1]=V2 erikoislukiot, [2]=V2 päivä, [3]=V3, [4]=V4 suunnitelma */
      /* Erikoislukio-kuvaus (p ennen erikoislukio-grid) */
      var erikoislukioGrid = lukioPanel.querySelector('#erikoislukio-grid');
      if (erikoislukioGrid && tj.lv2_erikoislukio_kuvaus) {
        var ekPrev = erikoislukioGrid.previousElementSibling;
        if (ekPrev && ekPrev.classList.contains('tj-kuvaus')) ekPrev.innerHTML = tj.lv2_erikoislukio_kuvaus;
      }
      /* Päivä lukiolaisena -otsikko (kolmas .tj-osio-otsikko) */
      if (lukioOsiot[2] && tj.lv2_paiva_heading) {
        var lv2pSpan = lukioOsiot[2].querySelector('.tj-osio-vaihe');
        lukioOsiot[2].textContent = tj.lv2_paiva_heading;
        if (lv2pSpan) lukioOsiot[2].insertBefore(lv2pSpan, lukioOsiot[2].firstChild);
      }

      /* Tarina-tabit (Emre, Yuki, Aino) */
      var lukioTabit = lukioPanel.querySelectorAll('.tj-tarinat-valit .tj-tarina-nappi');
      /* Tabit sisältävät SVG-avatarin + tekstiä — pitää korvata vain tekstisolmu */
      function setTabTeksti(btn, teksti) {
        if (!btn || !teksti) return;
        var svg = btn.querySelector('svg');
        btn.textContent = ' ' + teksti;
        if (svg) btn.insertBefore(svg, btn.firstChild);
      }
      if (lukioTabit[0]) setTabTeksti(lukioTabit[0], tj.lv2_tab_emre);
      if (lukioTabit[1]) setTabTeksti(lukioTabit[1], tj.lv2_tab_yuki);
      if (lukioTabit[2]) setTabTeksti(lukioTabit[2], tj.lv2_tab_aino);

      /* Tarinat: helper */
      function kaannaLukioTarina(panelId, tagi, header, sub, t1h, t1p, t2h, t2p, t3h, t3p, t4h, t4p) {
        var panel = document.getElementById(panelId);
        if (!panel) return;
        var tagiEl = panel.querySelector('.tj-tarina-tagi');
        if (tagiEl && tagi) tagiEl.textContent = tagi;
        var h4 = panel.querySelector('.th-teksti h4');
        if (h4 && header) h4.textContent = header;
        var subP = panel.querySelector('.th-teksti p');
        if (subP && sub) subP.textContent = sub;
        var rivit = panel.querySelectorAll('.tj-aika-rivi');
        var data = [[t1h,t1p],[t2h,t2p],[t3h,t3p],[t4h,t4p]];
        for (var ri = 0; ri < rivit.length && ri < data.length; ri++) {
          var h6 = rivit[ri].querySelector('h6'); var rp = rivit[ri].querySelector('p');
          if (h6 && data[ri][0]) h6.textContent = data[ri][0];
          if (rp && data[ri][1]) rp.textContent = data[ri][1];
        }
      }
      kaannaLukioTarina('lukio-yleislukio',
        tj.lv2_emre_tagi, tj.lv2_emre_header, tj.lv2_emre_sub,
        tj.lv2_emre_t1_h, tj.lv2_emre_t1_p, tj.lv2_emre_t2_h, tj.lv2_emre_t2_p,
        tj.lv2_emre_t3_h, tj.lv2_emre_t3_p, tj.lv2_emre_t4_h, tj.lv2_emre_t4_p);
      kaannaLukioTarina('lukio-ib',
        tj.lv2_yuki_tagi, tj.lv2_yuki_header, tj.lv2_yuki_sub,
        tj.lv2_yuki_t1_h, tj.lv2_yuki_t1_p, tj.lv2_yuki_t2_h, tj.lv2_yuki_t2_p,
        tj.lv2_yuki_t3_h, tj.lv2_yuki_t3_p, tj.lv2_yuki_t4_h, tj.lv2_yuki_t4_p);
      kaannaLukioTarina('lukio-urheilu',
        tj.lv2_aino_tagi, tj.lv2_aino_header, tj.lv2_aino_sub,
        tj.lv2_aino_t1_h, tj.lv2_aino_t1_p, tj.lv2_aino_t2_h, tj.lv2_aino_t2_p,
        tj.lv2_aino_t3_h, tj.lv2_aino_t3_p, tj.lv2_aino_t4_h, tj.lv2_aino_t4_p);

      /* ── Lukiopolku Vaihe 3: Lukion jälkeen ── */
      if (lukioOsiot[3] && tj.lv3_heading) {
        var lv3span = lukioOsiot[3].querySelector('.tj-osio-vaihe');
        lukioOsiot[3].textContent = tj.lv3_heading;
        if (lv3span) lukioOsiot[3].insertBefore(lv3span, lukioOsiot[3].firstChild);
      }
      var lv3kuvEl = lukioOsiot[3] ? lukioOsiot[3].nextElementSibling : null;
      if (lv3kuvEl && lv3kuvEl.classList.contains('tj-kuvaus') && tj.lv3_kuvaus) {
        lv3kuvEl.innerHTML = tj.lv3_kuvaus;
      }
      /* AMK & Yliopisto kortit */
      var kkKortit = lukioPanel.querySelectorAll('.kk-info-kortti');
      if (kkKortit[0]) {
        var amkH = kkKortit[0].querySelector('h5'); var amkP = kkKortit[0].querySelector('p');
        if (amkH && tj.lv3_amk_h) amkH.textContent = tj.lv3_amk_h;
        if (amkP && tj.lv3_amk_p) amkP.innerHTML = tj.lv3_amk_p;
      }
      if (kkKortit[1]) {
        var yoH = kkKortit[1].querySelector('h5'); var yoP = kkKortit[1].querySelector('p');
        if (yoH && tj.lv3_yo_h) yoH.textContent = tj.lv3_yo_h;
        if (yoP && tj.lv3_yo_p) yoP.innerHTML = tj.lv3_yo_p;
      }
      var kkTulos = document.getElementById('kk-tulos-otsikko');
      if (kkTulos && tj.lv3_tulos_kaikki) kkTulos.textContent = tj.lv3_tulos_kaikki;
      var kkEiTulos = document.getElementById('kk-ei-tuloksia');
      if (kkEiTulos && tj.lv3_ei_tuloksia) kkEiTulos.textContent = tj.lv3_ei_tuloksia;
      var kkNappi = lukioPanel.querySelector('.kk-opintopolku-nappi');
      if (kkNappi && tj.lv3_opintopolku_nappi) kkNappi.textContent = tj.lv3_opintopolku_nappi;

      /* ── Lukiosuunnitelma (Vaihe 4) ── */
      var lsPohja = lukioPanel.querySelector('.lukio-suunnitelma');
      if (lsPohja) {
        /* Heading */
        if (lukioOsiot[4] && tj.ls_heading) {
          var lv4span = lukioOsiot[4].querySelector('.tj-osio-vaihe');
          lukioOsiot[4].textContent = tj.ls_heading;
          if (lv4span) lukioOsiot[4].insertBefore(lv4span, lukioOsiot[4].firstChild);
        }
        var lsKuvEl = lsPohja.querySelector('.tj-kuvaus');
        if (lsKuvEl && tj.ls_kuvaus) lsKuvEl.textContent = tj.ls_kuvaus;

        /* Kysymykset */
        var lsQ = [
          { labelId:'ls-q1', ta:'ls-linja',    label:tj.ls_q1_label, ph:tj.ls_q1_ph },
          { labelId:'ls-q2', ta:'ls-aineet',   label:tj.ls_q2_label, ph:tj.ls_q2_ph },
          { labelId:'ls-q4', ta:'ls-haave',    label:tj.ls_q4_label, ph:tj.ls_q4_ph },
          { labelId:'ls-q5', ta:'ls-selvita',  label:tj.ls_q5_label, ph:tj.ls_q5_ph }
        ];
        lsQ.forEach(function(q) {
          var lEl = document.getElementById(q.labelId);
          if (lEl && q.label) lEl.textContent = q.label;
          var tEl = document.getElementById(q.ta);
          if (tEl && q.ph) tEl.placeholder = q.ph;
        });
        /* Q3 radio */
        var q3p = lsPohja.querySelector('.ls-kysymys:not([id])');
        if (q3p && tj.ls_q3_kysymys) q3p.textContent = tj.ls_q3_kysymys;
        var radiot = lsPohja.querySelectorAll('.ls-radio-nappi');
        var radioTekstit = [tj.ls_q3_amk, tj.ls_q3_yliopisto, tj.ls_q3_molemmat, tj.ls_q3_eos];
        radiot.forEach(function(r, idx) {
          if (radioTekstit[idx]) {
            var inp = r.querySelector('input');
            r.textContent = ' ' + radioTekstit[idx];
            if (inp) r.insertBefore(inp, r.firstChild);
          }
        });
        /* Napit */
        var lsTallenna = lsPohja.querySelector('.tj-tallenna.lukio');
        if (lsTallenna && tj.ls_tallenna) lsTallenna.textContent = tj.ls_tallenna;
        var lsTyhjenna = lsPohja.querySelector('.tj-tyhjenna');
        if (lsTyhjenna && tj.ls_tyhjenna) lsTyhjenna.textContent = tj.ls_tyhjenna;
        var lsTallennettu = document.getElementById('ls-tallennettu');
        if (lsTallennettu && tj.ls_tallennettu) lsTallennettu.textContent = tj.ls_tallennettu;
        var lsLataa = document.getElementById('ls-lataa-nappi');
        if (lsLataa && tj.ls_lataa) lsLataa.textContent = tj.ls_lataa;
      }

      /* ── Lukio Yhteenveto ── */
      var lukioYhteenveto = document.getElementById('lukio-yhteenveto');
      if (lukioYhteenveto) {
        var lyH5 = lukioYhteenveto.querySelector('h5');
        if (lyH5 && tj.lukio_yhteenveto_otsikko) lyH5.textContent = tj.lukio_yhteenveto_otsikko;
        var lyPs = lukioYhteenveto.querySelectorAll('p');
        if (lyPs[0] && tj.lukio_yhteenveto_p1) lyPs[0].textContent = tj.lukio_yhteenveto_p1;
      }
    }

    /* ── Päivitä jo renderöidyt amis-kortit (mid-session kielenvaihto) ── */
    var tNimi4  = tj.t_nimi  || [];
    var tAla4   = tj.t_ala   || [];
    var tLyhyt4 = tj.t_lyhyt || [];
    document.querySelectorAll('#amis-tutkinnot .tj-kortti[data-idx]').forEach(function(kortti) {
      var i = parseInt(kortti.dataset.idx, 10);
      var alaEl  = kortti.querySelector('.tj-kortti-ala');
      var nimiEl = kortti.querySelector('.tj-kortti-nimi');
      var lyhEl  = kortti.querySelector('.tj-kortti-lyhyt');
      if (alaEl  && tAla4[i])   alaEl.textContent  = tAla4[i];
      if (nimiEl && tNimi4[i])  nimiEl.textContent = tNimi4[i];
      if (lyhEl  && tLyhyt4[i]) lyhEl.textContent  = tLyhyt4[i];
      /* "Lue lisää" / "Sulje" nappi */
      var avaaBtn = kortti.querySelector('.tj-avaa');
      if (avaaBtn) {
        var onAuki = kortti.classList.contains('auki');
        avaaBtn.textContent = onAuki ? (tj.sulje || 'Sulje ▴') : (tj.lue_lisaa || 'Lue lisää ▾');
      }
      /* "Kesto" ja "Hae" linkit */
      var lisatiedot = kortti.querySelector('.tj-lisatiedot');
      if (lisatiedot) {
        var firstText = lisatiedot.firstChild;
        if (firstText && firstText.nodeType === 3 && tj.kesto_3v) {
          firstText.textContent = tj.kesto_3v + ' · ';
        }
        var opLink = lisatiedot.querySelector('a:not(.tj-peli-linkki)');
        if (opLink && tj.hae_opintopolku) opLink.textContent = tj.hae_opintopolku;
        var peliLink = lisatiedot.querySelector('.tj-peli-linkki');
        if (peliLink && tj.kokeile) peliLink.textContent = tj.kokeile;
      }
    });

    /* ── Päivitä jo renderöidyt lukio-linja-kortit ── */
    var lNimi4   = tj.l_nimi   || [];
    var lKuvaus4 = tj.l_kuvaus || [];
    document.querySelectorAll('#lukio-linjat .linja-kortti[data-idx]').forEach(function(kortti) {
      var i = parseInt(kortti.dataset.idx, 10);
      var h5 = kortti.querySelector('h5');
      var p  = kortti.querySelector('p');
      if (h5 && lNimi4[i])   h5.textContent = lNimi4[i];
      if (p  && lKuvaus4[i]) p.innerHTML    = lKuvaus4[i];
    });

    /* ── Päivitä jo renderöidyt erikoislukio-kortit ── */
    var eKuvaus4 = tj.e_kuvaus || [];
    document.querySelectorAll('#erikoislukio-grid .erikoislukio-kortti[data-idx]').forEach(function(kortti) {
      var i = parseInt(kortti.dataset.idx, 10);
      var p = kortti.querySelector('p');
      if (p && eKuvaus4[i]) p.innerHTML = eKuvaus4[i];
    });

    /* ── Päivitä jo renderöidyt KK-kortit ── */
    var kkNimi4   = tj.kk_nimi   || [];
    var kkKuvaus4 = tj.kk_kuvaus || [];
    var tyAmk4 = tj.kk_ty_amk || 'AMK';
    var tyYo4  = tj.kk_ty_yo  || 'Yliopisto';
    var tyMol4 = tj.kk_ty_molemmat || 'AMK & Yliopisto';
    document.querySelectorAll('#kk-kortit .kk-kortti[data-idx]').forEach(function(kortti) {
      var i = parseInt(kortti.dataset.idx, 10);
      var h5 = kortti.querySelector('h5');
      var p  = kortti.querySelector('p:not(.kk-esimerkki)');
      var tySpan = kortti.querySelector('.kk-tyyppi-nappula');
      if (h5 && kkNimi4[i])   h5.textContent = kkNimi4[i];
      if (p  && kkKuvaus4[i]) p.textContent  = kkKuvaus4[i];
      if (tySpan) {
        var cls = tySpan.classList;
        if (cls.contains('amk')) tySpan.textContent = tyAmk4;
        else if (cls.contains('yliopisto')) tySpan.textContent = tyYo4;
        else tySpan.textContent = tyMol4;
      }
    });
  }

  /* ── Keskustelutehtäväkorttien käännökset ── */
  // Kartta: href-tunniste → g8.tasks-avain
  var TASK_MAP = {
    'keskustelu-vaikuttaja': 'vaikuttaja',
    'keskustelu-tet':        'tet_discussion'
  };

  function kaannaKeskusteluKortit(t) {
    var tasks = t && t.g8 && t.g8.tasks;
    if (!tasks) return;
    document.querySelectorAll('a.keskustelu-kortti').forEach(function (kortti) {
      var href = kortti.getAttribute('href') || '';
      // Tunnista tehtävä href:stä, esim. "?id=keskustelu-vaikuttaja"
      var taskKey = null;
      for (var id in TASK_MAP) {
        if (href.indexOf(id) !== -1) { taskKey = TASK_MAP[id]; break; }
      }
      if (!taskKey || !tasks[taskKey]) return;
      var td = tasks[taskKey];
      // Otsikko (h3)
      var h3 = kortti.querySelector('h3');
      if (h3 && td.title) h3.textContent = td.title;
      // Kuvaus (p)
      var p = kortti.querySelector('p');
      if (p && td.description) p.textContent = td.description;
      // "Ryhmäkeskustelu" -badge
      var badge = kortti.querySelector('[style*="border-radius:999px"]');
      if (badge && tasks.discussion_label) badge.textContent = tasks.discussion_label;
      // "👥 Keskustele..." -hint
      var hint = kortti.querySelector('[style*="border-left"]');
      if (hint && tasks.discussion_hint) hint.textContent = tasks.discussion_hint;
    });
  }

  // MutationObserver: päivitä kortit heti kun luokka.js lisää ne DOM:iin
  // Reagoidaan VAIN elementtilisäyksiin (nodeType 1), ei tekstimuutoksiin (nodeType 3).
  // Näin vältetään ääretön silmukka, joka syntyisi kun textContent-muutokset
  // laukaisivat observerin uudelleen.
  var _taskObserver = null;
  var _lastT = null;

  function kaynnistaMutationObserver() {
    if (_taskObserver) return;
    var containers = ['tasks-vahvuudet', 'tasks-tet'];
    containers.forEach(function (cid) {
      var el = document.getElementById(cid);
      if (!el) return;
      var obs = new MutationObserver(function (mutations) {
        if (!_lastT) return;
        var hasNewElement = mutations.some(function (m) {
          return Array.prototype.some.call(m.addedNodes, function (n) {
            return n.nodeType === 1; // vain elementit, ei tekstisolmuja
          });
        });
        if (hasNewElement) kaannaKeskusteluKortit(_lastT);
      });
      obs.observe(el, { childList: true, subtree: true });
    });
    _taskObserver = true;
  }

  function paivitaKortit(t) {
    _lastT = t;
    kaannaKeskusteluKortit(t);
    kaynnistaMutationObserver();
  }

  /* ── Tapahtumakuuntelijat ── */
  document.addEventListener('digiopo:langchange', function (e) {
    applyG8(e.detail.t);
    applyTutkija(e.detail.t);
    paivitaVaroitukset(e.detail.t);
    paivitaKortit(e.detail.t);
  });

  /* Jos käännökset on jo ladattu ennen tätä skriptiä */
  if (window.DIGIOPO_T) {
    applyG8(window.DIGIOPO_T);
    applyTutkija(window.DIGIOPO_T);
    paivitaVaroitukset(window.DIGIOPO_T);
    paivitaKortit(window.DIGIOPO_T);
  }

})();
