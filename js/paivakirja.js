/**
 * DigiOpo – Päiväkirjani
 * Viikoittainen oppimispäiväkirja. Suljettava palkki (sivun oma klikkaa auki
 * -kuvio), yksi jokaisen Selviytymiskeinon perään. Kysymykset valitaan osion
 * teeman mukaan ([data-teema]). Oppilas valitsee kysymyksistä 1–2 tai kaikki,
 * kirjoittaa lyhyet vastaukset ja lataa merkinnän PDF:nä omaan Drive-kansioonsa.
 *
 * Ei palvelintallennusta. Nimi ja luokka muistetaan vain laitteelle ja
 * synkataan kaikkien saman sivun päiväkirjojen välillä (kirjoita kerran).
 */
(function () {
  'use strict';

  /* ── Kysymykset osion teeman mukaan ─────────────────────────────────── */
  var TEEMAT = {
    opiskelu: { teema: 'Opi oppimaan', kysymykset: [
      'Mikä tapa oppia toimi sinulle parhaiten tällä oppitunnilla?',
      'Mikä opiskelussa tuntui vaikealta?',
      'Mitä kokeilisit ensi kerralla toisin?'
    ]},
    motivaatio: { teema: 'Motivaatio', kysymykset: [
      'Mikä saa sinut jaksamaan koulussa?',
      'Mikä vie sinulta motivaation?',
      'Mikä auttaisi sinua, kun into loppuu?'
    ]},
    vahvuudet: { teema: 'Vahvuudet', kysymykset: [
      'Minkä huomasit osaavasi?',
      'Mistä sait tällä viikolla hyvän fiiliksen tai kehut?',
      'Missä haluaisit tulla paremmaksi?'
    ]},
    tulevaisuus: { teema: 'Tulevaisuus', kysymykset: [
      'Mikä sai sinut tällä viikolla innostumaan?',
      'Millaisesta tulevaisuudesta haaveilet juuri nyt?',
      'Mitä uutta opit itsestäsi?'
    ]}
  };
  var OLETUS = 'opiskelu';

  var JSPDF_URL = '/vendor/jspdf/jspdf.umd.min.js';
  var KUVA_URL = '../images/paivakirja.webp';
  var KK = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta',
            'heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];

  /* ── Apurit ─────────────────────────────────────────────────────────── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function pvmISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pvmFI(d) { return d.getDate() + '. ' + KK[d.getMonth()] + ' ' + d.getFullYear(); }
  function pvmLyhyt(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function siisti(s) {
    return (s || '').trim().replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9ÅÄÖåäö._-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function esc(s) { return (s == null ? '' : String(s)); }
  function muista(avain, arvo) { try { localStorage.setItem(avain, arvo); } catch (e) {} }
  function palauta(avain) { try { return localStorage.getItem(avain) || ''; } catch (e) { return ''; } }

  /* ── Nimen/luokan synkkaus kaikkien instanssien välillä ─────────────── */
  var nimiKentat = [], luokkaKentat = [];
  function paivitaKaikki(kentat, val) {
    for (var i = 0; i < kentat.length; i++) { if (kentat[i].value !== val) kentat[i].value = val; }
  }

  /* ── PDF ────────────────────────────────────────────────────────────── */
  function lataaJsPDF(cb) {
    if (window.jspdf && window.jspdf.jsPDF) { cb(); return; }
    var vanha = document.querySelector('script[data-pk-jspdf]');
    if (vanha) { vanha.addEventListener('load', function () { cb(); }); return; }
    var s = document.createElement('script');
    s.src = JSPDF_URL; s.setAttribute('data-pk-jspdf', '1');
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error('jspdf-lataus epäonnistui')); };
    document.head.appendChild(s);
  }

  function teePDF(t) {
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    var M = 56, maxW = W - M * 2, y = 0;

    doc.setFillColor(124, 58, 237); doc.rect(0, 0, W, 92, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text('Päiväkirjani', M, 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text('Mun juttu – mun tarinaa', M, 66);
    y = 128;

    doc.setTextColor(60, 60, 60); doc.setFontSize(11);
    function meta(label, val) {
      doc.setFont('helvetica', 'bold'); doc.text(label, M, y);
      doc.setFont('helvetica', 'normal'); doc.text(esc(val), M + 96, y); y += 18;
    }
    meta('Nimi:', t.nimi); meta('Luokka:', t.luokka); meta('Päivämäärä:', t.pvmFI); meta('Teema:', t.teema);
    y += 8; doc.setDrawColor(220, 210, 250); doc.line(M, y, W - M, y); y += 24;

    function sivuTarvittaessa(k) { if (y + k > H - M) { doc.addPage(); y = M; } }
    for (var i = 0; i < t.parit.length; i++) {
      var p = t.parit[i];
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(76, 29, 149);
      var kys = doc.splitTextToSize(p.kysymys, maxW);
      sivuTarvittaessa(kys.length * 15 + 10); doc.text(kys, M, y); y += kys.length * 15 + 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11.5); doc.setTextColor(30, 30, 30);
      var vas = doc.splitTextToSize(p.vastaus, maxW);
      sivuTarvittaessa(vas.length * 15 + 16); doc.text(vas, M, y); y += vas.length * 15 + 20;
    }
    doc.save(t.tiedostonimi);
  }

  /* ── Pikku-DOM-apuri ────────────────────────────────────────────────── */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* ── Rakenna yksi päiväkirja slottiin ───────────────────────────────── */
  function rakenna(slot, idx) {
    var avain = slot.getAttribute('data-teema') || OLETUS;
    var setti = TEEMAT[avain] || TEEMAT[OLETUS];
    var d = new Date();

    var kortti = el('div', 'pk-kortti');

    /* Palkki (suljettu oletuksena) */
    var bar = el('button', 'pk-bar');
    bar.type = 'button';
    var bodyId = 'pk-body-' + idx;
    bar.setAttribute('aria-expanded', 'false');
    bar.setAttribute('aria-controls', bodyId);

    var kuva = el('img', 'pk-bar-kuva');
    kuva.src = KUVA_URL; kuva.alt = ''; kuva.setAttribute('aria-hidden', 'true');
    kuva.width = 1054; kuva.height = 1492; kuva.loading = 'lazy';

    var barTeksti = el('span', 'pk-bar-teksti');
    barTeksti.appendChild(el('span', 'pk-bar-otsikko', 'Päiväkirjani'));
    barTeksti.appendChild(el('span', 'pk-bar-ala', 'Mun juttu – mun tarinaa'));

    var barPvm = el('span', 'pk-bar-pvm', pvmLyhyt(d));
    var nuoli = el('span', 'pk-bar-nuoli', '▼'); nuoli.setAttribute('aria-hidden', 'true');

    bar.appendChild(kuva); bar.appendChild(barTeksti); bar.appendChild(barPvm); bar.appendChild(nuoli);

    /* Auki-osa */
    var body = el('div', 'pk-body'); body.id = bodyId; body.style.display = 'none';

    var tieto = el('p', 'pk-tieto',
      'Hyvä tietää: tämä on koulutehtävä. Opettaja voi joskus pyytää sinua näyttämään päiväkirjasi. Se auttaa häntä tukemaan sinua. Kirjoita rehellisesti — ja juuri niin paljon kuin sinusta tuntuu hyvältä.');
    body.appendChild(tieto);

    /* Nimi + luokka */
    var tunnistus = el('div', 'pk-tunnistus');
    function kentta(labelTeksti, id, place) {
      var wrap = el('div', 'pk-kentta');
      var lab = el('label', null, labelTeksti); lab.setAttribute('for', id + '-' + idx);
      var inp = el('input'); inp.type = 'text'; inp.id = id + '-' + idx;
      inp.autocomplete = 'off'; inp.placeholder = place;
      wrap.appendChild(lab); wrap.appendChild(inp);
      return { wrap: wrap, inp: inp };
    }
    var kNimi = kentta('Nimi', 'pk-nimi', 'Etunimi');
    var kLuokka = kentta('Luokka', 'pk-luokka', 'esim. 7A');
    kNimi.inp.value = palauta('pk_nimi');
    kLuokka.inp.value = palauta('pk_luokka');
    kNimi.inp.addEventListener('input', function () { muista('pk_nimi', kNimi.inp.value); paivitaKaikki(nimiKentat, kNimi.inp.value); });
    kLuokka.inp.addEventListener('input', function () { muista('pk_luokka', kLuokka.inp.value); paivitaKaikki(luokkaKentat, kLuokka.inp.value); });
    nimiKentat.push(kNimi.inp); luokkaKentat.push(kLuokka.inp);
    tunnistus.appendChild(kNimi.wrap); tunnistus.appendChild(kLuokka.wrap);
    body.appendChild(tunnistus);

    body.appendChild(el('p', 'pk-ohje', 'Valitse 1–2 kysymystä tai kaikki. Kirjoita lyhyt vastaus.'));

    /* Kysymykset */
    var kysLista = el('div', 'pk-kysymykset');
    var viittaukset = [];
    setti.kysymykset.forEach(function (teksti, i) {
      var k = el('div', 'pk-kysymys');
      var yla = el('label', 'pk-kysymys-yla'); yla.setAttribute('for', 'pk-kys-' + idx + '-' + i);
      var cb = el('input'); cb.type = 'checkbox'; cb.id = 'pk-kys-' + idx + '-' + i;
      var span = el('span', 'pk-kysymys-teksti', teksti);
      yla.appendChild(cb); yla.appendChild(span);
      var vDiv = el('div', 'pk-vastaus'); vDiv.style.display = 'none';
      var ta = el('textarea'); ta.setAttribute('aria-label', 'Vastaus: ' + teksti);
      ta.setAttribute('maxlength', '400'); ta.placeholder = 'Kirjoita 1–2 lausetta…';
      var merkit = el('div', 'pk-merkit', '0 / 400');
      ta.addEventListener('input', function () { merkit.textContent = ta.value.length + ' / 400'; });
      vDiv.appendChild(ta); vDiv.appendChild(merkit);
      cb.addEventListener('change', function () {
        if (cb.checked) { k.classList.add('pk-valittu'); vDiv.style.display = 'block'; ta.focus(); }
        else { k.classList.remove('pk-valittu'); vDiv.style.display = 'none'; }
      });
      k.appendChild(yla); k.appendChild(vDiv); kysLista.appendChild(k);
      viittaukset.push({ teksti: teksti, cb: cb, ta: ta });
    });
    body.appendChild(kysLista);

    /* Lataa */
    var toiminnot = el('div', 'pk-toiminnot');
    var nappi = el('button', 'pk-lataa'); nappi.type = 'button';
    var ikoni = el('i', 'fa-solid fa-download'); ikoni.setAttribute('aria-hidden', 'true');
    nappi.appendChild(ikoni); nappi.appendChild(el('span', null, 'Lataa päiväkirjamerkintä (PDF)'));
    var vahvistus = el('div', 'pk-vahvistus'); vahvistus.setAttribute('role', 'status'); vahvistus.setAttribute('aria-live', 'polite');
    toiminnot.appendChild(nappi); toiminnot.appendChild(vahvistus);
    body.appendChild(toiminnot);

    function nayta(v, huom) { vahvistus.textContent = v; vahvistus.classList.add('pk-nakyy'); vahvistus.classList.toggle('pk-huom', !!huom); }

    nappi.addEventListener('click', function () {
      var nimi = kNimi.inp.value.trim(), lk = kLuokka.inp.value.trim();
      if (!nimi || !lk) { nayta('Kirjoita ensin nimesi ja luokkasi, niin merkintä nimetään oikein.', true); return; }
      var parit = [];
      viittaukset.forEach(function (r) { if (r.cb.checked && r.ta.value.trim()) parit.push({ kysymys: r.teksti, vastaus: r.ta.value.trim() }); });
      if (!parit.length) { nayta('Valitse ainakin yksi kysymys ja kirjoita siihen vastaus.', true); return; }
      nappi.disabled = true; var vanha = nappi.lastChild.textContent; nappi.lastChild.textContent = 'Tehdään PDF…';
      lataaJsPDF(function (err) {
        if (err) { nappi.disabled = false; nappi.lastChild.textContent = vanha; nayta('PDF:n teko ei onnistunut. Yritä uudelleen hetken kuluttua.', true); return; }
        var tiedostonimi = 'paivakirjani_' + pvmISO(d) + '_' + (siisti(lk) || 'luokka') + '_' + (siisti(nimi) || 'oppilas') + '.pdf';
        try {
          teePDF({ nimi: nimi, luokka: lk, teema: setti.teema, pvmFI: pvmFI(d), parit: parit, tiedostonimi: tiedostonimi });
          nayta('Merkintä ladattu (' + tiedostonimi + '). Tallenna se päiväkirja-kansioosi Drivessä.');
        } catch (e) { nayta('PDF:n teko ei onnistunut. Yritä uudelleen.', true); }
        nappi.disabled = false; nappi.lastChild.textContent = vanha;
      });
    });

    /* Avaa/sulje */
    bar.addEventListener('click', function () {
      var auki = bar.getAttribute('aria-expanded') === 'true';
      bar.setAttribute('aria-expanded', auki ? 'false' : 'true');
      body.style.display = auki ? 'none' : 'block';
    });

    kortti.appendChild(bar); kortti.appendChild(body);
    slot.appendChild(kortti);
  }

  /* Siirrä palkki osion Yhteenveto-laatikon jälkeen (viimeiseksi). Yhteenvedon
     lisää js/osio-rakenne.js DOMContentLoaded-hetkellä, joten tämä ajetaan sen
     jälkeen ja vielä uudelleen 'load'-tapahtumassa varmuuden vuoksi. */
  function siirraYhteenvedonJalkeen(slot) {
    var osio = slot.closest('.aihe-osio') || slot.closest('[data-osio]');
    if (!osio) return;
    var yht = osio.querySelector('.osio-yhteenveto');
    if (yht && yht.parentNode) yht.parentNode.insertBefore(slot, yht.nextSibling);
  }
  function repositionAll() {
    var slots = document.querySelectorAll('[data-paivakirja]');
    for (var i = 0; i < slots.length; i++) siirraYhteenvedonJalkeen(slots[i]);
  }

  function init() {
    var slots = document.querySelectorAll('[data-paivakirja]');
    for (var i = 0; i < slots.length; i++) rakenna(slots[i], i);
    repositionAll();
  }

  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', repositionAll);
  // osio-rakenne.js rakentaa Yhteenveto-laatikot uudelleen kielen vaihtuessa
  // (myös ensilatauksen async-fetchissä) — siirretään palkki taas sen perään.
  document.addEventListener('digiopo:langchange', repositionAll);
})();
