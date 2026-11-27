/* ══ 8. lk · Oma reitti löytyy tutkimalla · Lukiopolku Vaihe 4: Oma lukiosuunnitelma ══
   Oppilas valitsee painotuksen (tai erikoislukion), 1–3 kiinnostavaa ainetta ja jatkosuunnan,
   kirjoittaa halutessaan haaveen ja selvitettävän asian → suunnitelmakortti → PDF Classroomiin.
   Painotukset tulevat sivun TJ_LINJAT- ja TJ_ERIKOISLUKIOT-taulukoista; Vaihe 1:n valintoihin
   (lukioValitut) sopivat merkitään tähdellä.
   Tila: localStorage dg8-lukio-v4 ja dg8-lukio-v4-valmis. Vanha dg8-lukio-suunnitelma siirretään kerran.
   Käännökset: valinnainen ylikirjoitus DIGIOPO_T.g8.tutkija.lv4 (sama rakenne kuin FI). */
(function () {
  'use strict';

  var FI = {
    ui: {
      q_painotus: 'Mikä painotus tai erikoislukio kiinnostaa eniten?',
      ryhma_painotukset: 'Lukion painotukset', ryhma_erikois: 'Erikoislukiot',
      sopii: 'Sopii valintoihisi',
      sopii_selite: '★ = sopii Vaihe 1:n valintoihisi',
      erikois_huom: 'Erikoislukioihin haetaan usein pääsy- tai soveltuvuuskokeella.',
      eos_selitys: 'Ei haittaa. Yleislukiossa voit kokeilla eri aineita ja painottaa niitä myöhemmin.',
      q_aineet: 'Mitkä aineet kiinnostavat? Valitse 1–3.',
      aineet_laskuri: '{n}/3 valittu',
      aineet_max: 'Voit valita kolme ainetta. Poista ensin yksi, jos haluat vaihtaa.',
      q_jatko: 'Mitä haluaisit tehdä lukion jälkeen?',
      haave: 'Mitä haaveilet opiskelevasi tai tekeväsi lukion jälkeen? (vapaaehtoinen)',
      haave_esim: 'Esim. haluaisin opiskella lääkäriksi tai perustaa oman yrityksen.',
      selvita: 'Yksi asia, jonka haluan vielä selvittää (vapaaehtoinen)',
      selvita_esim: 'Esim. miten aineiden valinta vaikuttaa jatko-opintoihin?',
      nimi: 'Nimesi (näkyy vain PDF:ssä, vapaaehtoinen)',
      puuttuu: 'Valitse vielä painotus, vähintään yksi aine ja suunta lukion jälkeen.',
      kortti_otsikko: 'Oma lukiosuunnitelmani',
      k_painotus: 'Painotus', k_aineet: 'Kiinnostavat aineet', k_jatko: 'Lukion jälkeen',
      k_haave: 'Haaveeni', k_selvita: 'Haluan vielä selvittää',
      valmis: 'Valmis – tallenna suunnitelmani', tallennettu: '✓ Tallennettu!',
      lataa: 'Lataa suunnitelma PDF:nä',
      lataa_ohje: 'Tallenna PDF omalle koneellesi ja palauta se opolle Classroomiin.',
      lataa_virhe: 'PDF:n teko ei onnistunut, joten suunnitelma latautui tekstitiedostona. Palauta se Classroomiin.',
      tyhjenna: 'Tyhjennä vastaukset', tyhjenna_varmista: 'Haluatko varmasti tyhjentää lukiosuunnitelman?',
      eos: 'En tiedä vielä',
      pdf_ala: 'DigiOpo · 8. luokka · Oma reitti löytyy tutkimalla',
      pdf_pvm: 'Päivämäärä', pdf_nimi: 'Nimi', pdf_otsikko: 'Suunnitelmani',
      pdf_loppu: 'Palauta tämä tiedosto opinto-ohjaajalle Classroomiin.'
    },
    aineet: ['Äidinkieli ja kirjallisuus', 'Pitkä matematiikka', 'Lyhyt matematiikka', 'Englanti', 'Ruotsi',
      'Jokin muu kieli', 'Fysiikka', 'Kemia', 'Biologia', 'Maantiede', 'Historia', 'Yhteiskuntaoppi',
      'Psykologia', 'Filosofia', 'Terveystieto', 'Kuvataide', 'Musiikki', 'Liikunta'],
    jatko: [
      { id: 'amk', teksti: 'Ammattikorkeakoulu (AMK)', kortti: 'Ammattikorkeakoulu (AMK)',
        selitys: 'AMK:ssa opiskelu on käytännönläheistä. Valmistut yleensä 3,5–4,5 vuodessa.' },
      { id: 'yliopisto', teksti: 'Yliopisto', kortti: 'Yliopisto',
        selitys: 'Yliopistossa opiskelu on tieteellistä. Kandidaatti (3 v) ja maisteri (2 v) vievät yhteensä yleensä 5 vuotta.' },
      { id: 'molemmat', teksti: 'Molemmat kiinnostavat', kortti: 'AMK tai yliopisto',
        selitys: 'Hyvä! Voit hakea molempiin samassa korkeakoulujen yhteishaussa.' },
      { id: 'eos', teksti: 'En tiedä vielä', kortti: 'Vielä auki',
        selitys: 'Ihan ok. Lukion aikana ehdit tutustua vaihtoehtoihin – opo auttaa.' }
    ]
  };

  var AVAIN = 'dg8-lukio-v4', VALMIS = 'dg8-lukio-v4-valmis', VANHA = 'dg8-lukio-suunnitelma';

  function yhdista(a, b) {
    if (!b || typeof b !== 'object') return a;
    if (Array.isArray(a)) return a.map(function (x, i) { return yhdista(x, b[i]); });
    var o = {};
    Object.keys(a).forEach(function (k) {
      o[k] = (a[k] && typeof a[k] === 'object') ? yhdista(a[k], b[k]) : (b[k] != null && b[k] !== '' ? b[k] : a[k]);
    });
    return o;
  }
  function tj() { return (window.DIGIOPO_T && window.DIGIOPO_T.g8 && window.DIGIOPO_T.g8.tutkija) || {}; }
  function D() { return yhdista(FI, tj().lv4); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  /* Kuvauksen pelkkä teksti PDF:ään: <br>-rivin jälkeiset lähdelinkit jätetään pois */
  function teksti(html) { var e = document.createElement('div'); e.innerHTML = String(html || '').split(/<br\s*\/?>/i)[0]; return (e.textContent || '').replace(/\s+/g, ' ').trim(); }
  function $(id) { return document.getElementById(id); }
  function onValmis() { try { return localStorage.getItem(VALMIS) === '1'; } catch (e) { return false; } }

  function tyhjaTila() { return { painotus: '', aineet: [], jatko: '', haave: '', selvita: '', nimi: '' }; }
  function lue() {
    var t = tyhjaTila();
    try {
      var v = JSON.parse(localStorage.getItem(AVAIN) || 'null');
      if (v && typeof v === 'object') {
        Object.keys(t).forEach(function (k) { if (v[k] != null) t[k] = v[k]; });
        if (!Array.isArray(t.aineet)) t.aineet = [];
        /* Vanhat indeksipohjaiset painotukset (l0–l9) uusiin tunnisteisiin. Poistetut linjat
           (kieli, musiikki, kuvataide, urheilu) vastaavat nyt erikoislukioita. */
        var VANHAT = { l0: 'l-yleinen', l1: 'e1', l2: 'l-matlu', l3: 'e3', l4: 'e4', l5: 'e2',
          l6: 'l-teatteri', l7: 'l-media', l8: 'l-yhteiskunta', l9: 'l-yrittajyys' };
        if (VANHAT[t.painotus]) { t.painotus = VANHAT[t.painotus]; localStorage.setItem(AVAIN, JSON.stringify(t)); }
        return t;
      }
      /* Siirto vanhasta ohjatusta suunnitelmasta: jatkosuunta ja vapaat tekstit talteen */
      var w = JSON.parse(localStorage.getItem(VANHA) || 'null');
      if (w && typeof w === 'object') {
        if (['amk', 'yliopisto', 'molemmat', 'eos'].indexOf(w.jatko) !== -1) t.jatko = w.jatko;
        t.haave = String(w.haave || '').slice(0, 300);
        t.selvita = String(w.selvita || '').slice(0, 300);
        localStorage.setItem(AVAIN, JSON.stringify(t));
      }
      localStorage.removeItem(VANHA);
    } catch (e) {}
    return t;
  }
  var tila = lue();
  function tallenna() { try { localStorage.setItem(AVAIN, JSON.stringify(tila)); } catch (e) {} }

  /* Painotusvaihtoehdot sivun omista taulukoista (myös käännetyt nimet ja kuvaukset) */
  function painotukset() {
    var t = tj(), lista = [];
    var valitut = (typeof lukioValitut !== 'undefined') ? lukioValitut : new Set();
    if (typeof TJ_LINJAT !== 'undefined') TJ_LINJAT.forEach(function (l, i) {
      lista.push({ id: 'l-' + (l.id || i), ryhma: 'p', nimi: (t.l_nimi || [])[i] || l.nimi, kuvaus: (t.l_kuvaus || [])[i] || l.kuvaus,
        /* "Ei erityistä painotusta" sopii kaikkeen, joten sitä ei merkitä erikseen */
        sopii: valitut.size > 0 && l.id !== 'yleinen' && l.k.some(function (a) { return valitut.has(a); }) });
    });
    if (typeof TJ_ERIKOISLUKIOT !== 'undefined') TJ_ERIKOISLUKIOT.forEach(function (e, i) {
      var ehdot = (e.f || []).concat(e.req || []);
      lista.push({ id: 'e' + i, ryhma: 'e', nimi: e.nimi, kuvaus: (t.e_kuvaus || [])[i] || e.kuvaus,
        sopii: valitut.size > 0 && ehdot.some(function (a) { return valitut.has(a); }) });
    });
    return lista;
  }
  function painotus(id) { var p = painotukset(); for (var i = 0; i < p.length; i++) if (p[i].id === id) return p[i]; return null; }
  function jatko(d, id) { for (var i = 0; i < d.jatko.length; i++) if (d.jatko[i].id === id) return d.jatko[i]; return null; }
  function valmisKaikki() { return !!tila.painotus && tila.aineet.length > 0 && !!tila.jatko; }

  function nappi(cls, attrs, on, txt, lisa) {
    return '<button type="button" class="amis-polku-nappi ' + cls + (on ? ' valittu' : '') + '" ' + attrs +
      ' aria-pressed="' + on + '">' + esc(txt) + (lisa || '') + '</button>';
  }

  function piirraKysymykset(d) {
    var alue = $('lv4-kysymykset'); if (!alue) return;
    var p = painotukset(), html = '';

    /* 1. Painotus */
    var valP = tila.painotus === 'eos' ? null : painotus(tila.painotus);
    var sopiviaOn = p.some(function (x) { return x.sopii; });
    var ryhma = function (r, otsikko) {
      return '<p class="lv4-ryhma">' + esc(otsikko) + '</p><div class="amis-polku-napit">' +
        p.filter(function (x) { return x.ryhma === r; }).map(function (x) {
          return nappi('lv4-chip' + (x.sopii ? ' sopii' : ''), 'data-lv4="painotus" data-arvo="' + x.id + '"', tila.painotus === x.id, x.nimi,
            x.sopii ? ' <span class="lv4-sopii" aria-hidden="true">★</span><span class="lv4-sr"> (' + esc(d.ui.sopii) + ')</span>' : '');
        }).join('') + '</div>';
    };
    var selP = '';
    if (valP) selP = '<strong>' + esc(valP.nimi) + ':</strong> ' + valP.kuvaus + (valP.ryhma === 'e' ? '<br>' + esc(d.ui.erikois_huom) : '');
    else if (tila.painotus === 'eos') selP = esc(d.ui.eos_selitys);
    html += '<fieldset class="amis-polku-kys"><legend><span class="amis-tt-nro" aria-hidden="true">1</span>' + esc(d.ui.q_painotus) + '</legend>' +
      (sopiviaOn ? '<p class="lv4-selite">' + esc(d.ui.sopii_selite) + '</p>' : '') +
      ryhma('p', d.ui.ryhma_painotukset) + ryhma('e', d.ui.ryhma_erikois) +
      '<div class="amis-polku-napit lv4-eos">' + nappi('lv4-chip', 'data-lv4="painotus" data-arvo="eos"', tila.painotus === 'eos', d.ui.eos) + '</div>' +
      '<div class="amis-polku-selitys" aria-live="polite"' + (selP ? '' : ' hidden') + '>' + selP + '</div></fieldset>';

    /* 2. Aineet (1–3) */
    html += '<fieldset class="amis-polku-kys"><legend><span class="amis-tt-nro" aria-hidden="true">2</span>' + esc(d.ui.q_aineet) +
      ' <span class="amis-tt-laskuri lv4-laskuri" aria-live="polite">' + esc(d.ui.aineet_laskuri.replace('{n}', tila.aineet.length)) + '</span></legend>' +
      '<div class="amis-polku-napit">' + d.aineet.map(function (a) {
        return nappi('lv4-chip', 'data-lv4="aine" data-arvo="' + esc(a) + '"', tila.aineet.indexOf(a) !== -1, a);
      }).join('') + '</div><p class="amis-polku-selitys lv4-max" role="status" hidden></p></fieldset>';

    /* 3. Jatko */
    var valJ = jatko(d, tila.jatko);
    html += '<fieldset class="amis-polku-kys"><legend><span class="amis-tt-nro" aria-hidden="true">3</span>' + esc(d.ui.q_jatko) + '</legend>' +
      '<div class="amis-polku-napit">' + d.jatko.map(function (j) {
        return nappi('', 'data-lv4="jatko" data-arvo="' + j.id + '"', tila.jatko === j.id, j.teksti);
      }).join('') + '</div>' +
      '<p class="amis-polku-selitys" aria-live="polite"' + (valJ ? '' : ' hidden') + '>' + (valJ ? esc(valJ.selitys) : '') + '</p></fieldset>';

    alue.innerHTML = html;
  }

  function korttiRivit(d) {
    var p = tila.painotus === 'eos' ? null : painotus(tila.painotus), j = jatko(d, tila.jatko);
    var r = [
      [d.ui.k_painotus, p ? p.nimi : (tila.painotus === 'eos' ? d.ui.eos : '–')],
      [d.ui.k_aineet, tila.aineet.length ? tila.aineet.join(', ') : '–'],
      [d.ui.k_jatko, j ? j.kortti : '–']
    ];
    if ((tila.haave || '').trim()) r.push([d.ui.k_haave, tila.haave.trim()]);
    if ((tila.selvita || '').trim()) r.push([d.ui.k_selvita, tila.selvita.trim()]);
    return r;
  }

  function piirraKortti(d) {
    var ok = valmisKaikki(), valmis = onValmis();
    var kortti = $('lv4-kortti');
    if (kortti) {
      kortti.hidden = !ok;
      if (ok) kortti.innerHTML = '<p class="amis-polku-kortti-tag">' + esc(d.ui.kortti_otsikko) + '</p><dl>' +
        korttiRivit(d).map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl>';
    }
    var puuttuu = $('lv4-puuttuu'); if (puuttuu) { puuttuu.hidden = ok; puuttuu.textContent = d.ui.puuttuu; }
    var vn = $('lv4-valmis');
    if (vn) { vn.hidden = !ok; vn.disabled = valmis; vn.textContent = valmis ? d.ui.tallennettu : d.ui.valmis; vn.classList.toggle('kuitattu', valmis); }
    var l = $('lv4-lataa'); if (l) { l.hidden = !(ok && valmis); l.textContent = d.ui.lataa; }
    var lo = $('lv4-lataa-ohje'); if (lo && !lo.dataset.virhe) { lo.hidden = !(ok && valmis); lo.textContent = d.ui.lataa_ohje; }
    var yv = $('lukio-yhteenveto'); if (yv) yv.hidden = !(ok && valmis);
  }

  function piirraTekstit(d) {
    var set = function (id, t) { var el = $(id); if (el) el.textContent = t; };
    set('lv4-nimi-label', d.ui.nimi); set('lv4-haave-label', d.ui.haave); set('lv4-selvita-label', d.ui.selvita);
    set('lv4-tyhjenna', d.ui.tyhjenna);
    var ph = function (id, t) { var el = $(id); if (el) el.placeholder = t; };
    ph('lv4-haave', d.ui.haave_esim); ph('lv4-selvita', d.ui.selvita_esim);
    ['nimi', 'haave', 'selvita'].forEach(function (k) { var el = $('lv4-' + k); if (el && document.activeElement !== el) el.value = tila[k] || ''; });
    var t = tj(), huom = $('lv4-kieli');
    if (huom) {
      var lang = (document.documentElement.getAttribute('lang') || 'fi').slice(0, 2);
      huom.hidden = !!t.lv4 || lang === 'fi' || !t.lang_warning;
      if (!huom.hidden) huom.textContent = t.lang_warning;
    }
  }

  function piirra() { var d = D(); piirraTekstit(d); piirraKysymykset(d); piirraKortti(d); }

  /* ── PDF (A4, jsPDF ladataan vasta tarvittaessa) ── */
  function pvm() { var x = new Date(); return x.getDate() + '.' + (x.getMonth() + 1) + '.' + x.getFullYear(); }
  function tiedostonimi(paate) {
    var n = (tila.nimi || '').trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9ÅÄÖåäö_-]/g, '');
    var x = new Date(), iso = x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
    return 'oma-lukiosuunnitelmani' + (n ? '-' + n : '') + '-' + iso + '.' + paate;
  }
  function lataaJsPDF(cb) {
    if (window.jspdf && window.jspdf.jsPDF) { cb(); return; }
    var vanha = document.querySelector('script[data-amis-jspdf]');
    if (vanha) { vanha.addEventListener('load', function () { cb(); }); vanha.addEventListener('error', function () { cb(new Error('jspdf')); }); return; }
    var sc = document.createElement('script');
    sc.src = '/vendor/jspdf/jspdf.umd.min.js'; sc.setAttribute('data-amis-jspdf', '1');
    sc.onload = function () { cb(); }; sc.onerror = function () { cb(new Error('jspdf')); };
    document.head.appendChild(sc);
  }
  function teePDF(d) {
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 50, maxW = W - M * 2, y;
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, W, 88, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.text(d.ui.kortti_otsikko, M, 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.text(d.ui.pdf_ala, M, 68);
    y = 120; doc.setTextColor(51, 65, 85); doc.setFontSize(11);
    if ((tila.nimi || '').trim()) {
      doc.setFont('helvetica', 'bold'); doc.text(d.ui.pdf_nimi + ':', M, y);
      doc.setFont('helvetica', 'normal'); doc.text(tila.nimi.trim(), M + 80, y); y += 18;
    }
    doc.setFont('helvetica', 'bold'); doc.text(d.ui.pdf_pvm + ':', M, y);
    doc.setFont('helvetica', 'normal'); doc.text(pvm(), M + 80, y); y += 26;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5);   /* rivitys samalla fontilla kuin piirto */
    var rivit = korttiRivit(d).map(function (r) { return { o: r[0], a: doc.splitTextToSize(r[1], maxW - 32) }; });
    var k = 40 + rivit.reduce(function (s, r) { return s + 16 + r.a.length * 15 + 8; }, 0);
    doc.setFillColor(239, 246, 255); doc.setDrawColor(59, 130, 246); doc.setLineWidth(1.5);
    doc.roundedRect(M, y, maxW, k, 10, 10, 'FD');
    var yy = y + 26;
    doc.setFontSize(10); doc.setTextColor(30, 58, 138); doc.text(d.ui.pdf_otsikko.toUpperCase(), M + 16, yy); yy += 22;
    rivit.forEach(function (r) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(29, 78, 216); doc.text(r.o.toUpperCase(), M + 16, yy); yy += 14;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(15, 23, 42); doc.text(r.a, M + 16, yy); yy += r.a.length * 15 + 10;
    });
    y += k + 26;

    /* Valitun painotuksen kuvaus muistiin */
    var p = tila.painotus === 'eos' ? null : painotus(tila.painotus);
    if (p) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 58, 138);
      doc.text(p.nimi, M, y); y += 16;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(71, 85, 105);
      doc.text(doc.splitTextToSize(teksti(p.kuvaus) + (p.ryhma === 'e' ? ' ' + d.ui.erikois_huom : ''), maxW), M, y);
    }
    doc.setDrawColor(191, 219, 254); doc.setLineWidth(1); doc.line(M, H - 44, W - M, H - 44);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(30, 58, 138); doc.text(d.ui.pdf_loppu, M, H - 28);
    doc.save(tiedostonimi('pdf'));
  }
  function lataaTxt(d) {
    var t = [d.ui.kortti_otsikko.toUpperCase(), d.ui.pdf_ala, ''];
    if ((tila.nimi || '').trim()) t.push(d.ui.pdf_nimi + ': ' + tila.nimi.trim());
    t.push(d.ui.pdf_pvm + ': ' + pvm(), '');
    korttiRivit(d).forEach(function (r) { t.push(r[0] + ':', r[1], ''); });
    t.push(d.ui.pdf_loppu);
    var url = URL.createObjectURL(new Blob([t.join('\n')], { type: 'text/plain;charset=utf-8' }));
    var a = document.createElement('a'); a.href = url; a.download = tiedostonimi('txt');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function lataa() {
    var d = D(), b = $('lv4-lataa'), lo = $('lv4-lataa-ohje');
    if (b) b.disabled = true;
    lataaJsPDF(function (err) {
      if (b) b.disabled = false;
      if (!err) { try { teePDF(d); return; } catch (e) { err = e; } }
      lataaTxt(d);
      if (lo) { lo.dataset.virhe = '1'; lo.hidden = false; lo.textContent = d.ui.lataa_virhe; }
    });
  }

  /* ── tapahtumat ── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#lukio-v4-tehtava button');
    if (!t) return;
    var d = D(), tyyppi = t.dataset.lv4, arvo = t.dataset.arvo;
    if (tyyppi === 'painotus' || tyyppi === 'jatko') {
      tila[tyyppi] = arvo; tallenna(); piirraKysymykset(d); piirraKortti(d);
      var u = document.querySelector('#lv4-kysymykset button[data-lv4="' + tyyppi + '"][data-arvo="' + arvo + '"]');
      if (u) u.focus();
    } else if (tyyppi === 'aine') {
      var i = tila.aineet.indexOf(arvo);
      if (i !== -1) tila.aineet.splice(i, 1);
      else if (tila.aineet.length >= 3) {
        var m = document.querySelector('#lv4-kysymykset .lv4-max');
        if (m) { m.hidden = false; m.textContent = d.ui.aineet_max; }
        return;
      } else tila.aineet.push(arvo);
      tallenna(); piirraKysymykset(d); piirraKortti(d);
      var u2 = Array.prototype.find.call(document.querySelectorAll('#lv4-kysymykset button[data-lv4="aine"]'), function (x) { return x.dataset.arvo === arvo; });
      if (u2) u2.focus();
    } else if (t.id === 'lv4-valmis') {
      if (!valmisKaikki()) return;
      try { localStorage.setItem(VALMIS, '1'); } catch (err) {}
      piirraKortti(d);
      var l = $('lv4-lataa'); if (l) l.focus();
    } else if (t.id === 'lv4-lataa') {
      lataa();
    } else if (t.id === 'lv4-tyhjenna') {
      if (!window.confirm(d.ui.tyhjenna_varmista)) return;
      tila = tyhjaTila();
      try { localStorage.removeItem(AVAIN); localStorage.removeItem(VALMIS); } catch (err) {}
      var lo = $('lv4-lataa-ohje'); if (lo) delete lo.dataset.virhe;
      piirra();
    }
  });
  document.addEventListener('input', function (e) {
    var id = e.target && e.target.id;
    var kentat = { 'lv4-nimi': ['nimi', 60], 'lv4-haave': ['haave', 300], 'lv4-selvita': ['selvita', 300] };
    if (!kentat[id]) return;
    tila[kentat[id][0]] = e.target.value.slice(0, kentat[id][1]); tallenna();
    if (id !== 'lv4-nimi') piirraKortti(D());
  });
  /* Vaihe 1:n kiinnostukset muuttuvat → päivitä tähtimerkit.
     Kytketään sivun omaan paivitaLukio-funktioon, jota kaikki suodatusmuutokset kutsuvat. */
  if (typeof window.paivitaLukio === 'function' && !window.paivitaLukio.__lv4) {
    var alkup = window.paivitaLukio;
    window.paivitaLukio = function () {
      var r = alkup.apply(this, arguments);
      try { piirraKysymykset(D()); } catch (e) {}
      return r;
    };
    window.paivitaLukio.__lv4 = true;
  }
  document.addEventListener('digiopo:langchange', function () { setTimeout(piirra, 0); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', piirra);
  else piirra();
})();
