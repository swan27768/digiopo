/* Päätösraati (9. lk) – päätöksenteko kuuden näkökulman avulla.
   Oma malli: nimet, tekstit ja sisältö on kirjoitettu itse. */
(function () {
  'use strict';

  var NAKOKULMAT = [
    { id: 'faktat',      ikoni: '🔍', nimi: 'Faktat',          kysymys: 'Mitä tiedän varmasti? Mitä en vielä tiedä?' },
    { id: 'fiilis',      ikoni: '💬', nimi: 'Fiilis',          kysymys: 'Miltä tämä tuntuu? Mitä vaistoni sanoo?' },
    { id: 'hyvaa',       ikoni: '🌱', nimi: 'Hyvät puolet',    kysymys: 'Mitä hyvää tästä voisi seurata?' },
    { id: 'riskit',      ikoni: '⚠️', nimi: 'Riskit',          kysymys: 'Mikä voisi mennä pieleen? Miten siihen voi varautua?' },
    { id: 'vaihtoehdot', ikoni: '💡', nimi: 'Vaihtoehdot',     kysymys: 'Mitä muita ratkaisuja on?' },
    { id: 'askel',       ikoni: '🧭', nimi: 'Seuraava askel',  kysymys: 'Mitä teen ensin? Milloin päätän?' }
  ];

  var TILANTEET = [
    {
      id: 'haku',
      otsikko: 'Mihin hakisit?',
      kuvaus: 'Yhteishaku lähestyy ja kaverit ovat valinneet koulunsa.',
      tarina: [
        'Yhteishaku lähestyy. Kaverisi aikovat hakea samaan lukioon. Sinua kiinnostaa kuitenkin myös sähköala ammattiopistossa.',
        'Et ole varma, kumpi sopii sinulle paremmin. Sinun pitäisi päättää, mihin laitat hakutoiveet.'
      ],
      ajatukset: [
        { teksti: 'Keskiarvosi on 7,8. Haussa voit laittaa useita hakutoiveita järjestykseen.', nako: 'faktat',
          miksi: 'Tämän voi tarkistaa. Se on tietoa, ei mielipide.' },
        { teksti: 'Ajatus siitä, että kaverit menevät eri kouluun, tuntuu ikävältä.', nako: 'fiilis',
          miksi: 'Tässä kerrotaan tunteesta. Tunteet ovat tärkeää tietoa, vaikka ne eivät ole faktoja.' },
        { teksti: 'Alalla saisit tehdä oikeita töitä käsilläsi, ja siitä tykkäät.', nako: 'hyvaa',
          miksi: 'Tässä mietitään, mitä hyvää valinnasta voisi tulla.' },
        { teksti: 'Jos valitset alan vain siksi, että se kiinnostaa, se voi osoittautua vääräksi.', nako: 'riskit',
          miksi: 'Tässä mietitään, mikä voisi mennä pieleen.' },
        { teksti: 'Voisit käydä tutustumassa molempiin kouluihin ennen kuin päätät.', nako: 'vaihtoehdot',
          miksi: 'Tässä keksitään uusi tapa edetä. Se on vaihtoehto.' },
        { teksti: 'Kysyt ensin opolta neuvoa ja päätät asian viikonloppuun mennessä.', nako: 'askel',
          miksi: 'Tässä sovitaan, mitä tehdään ensin ja milloin päätetään.' }
      ],
      vaihtoehdot: [
        'Haen lukioon, koska kaverit menevät sinne.',
        'Laitan sähköalan ykköseksi.',
        'Käyn tutustumassa molempiin kouluihin ja päätän hakutoiveiden järjestyksen sen jälkeen.'
      ],
      kaanne: 'Kaverisi kertoo, että hänkin harkitsee sähköalaa. Hän ei ole kertonut siitä muille.'
    },
    {
      id: 'ryhmatyo',
      otsikko: 'Ryhmätyö ei etene',
      kuvaus: 'Ryhmätyön määräaika lähestyy, ja yksi osa on kesken.',
      tarina: [
        'Teillä on kolmen hengen ryhmätyö. Palautus on perjantaina. Kaksi osaa on valmiina, mutta kolmas on tekemättä.',
        'Se osa oli kaverisi vastuulla. Hän ei ole vastannut viesteihin kahteen päivään.'
      ],
      ajatukset: [
        { teksti: 'Palautus on perjantaina. Kolmesta osasta kaksi on valmiina.', nako: 'faktat',
          miksi: 'Tämän voi tarkistaa. Se on tietoa tilanteesta.' },
        { teksti: 'Sinua ärsyttää, ja samalla vähän huolettaa, kun et tiedä miksi osa on kesken.', nako: 'fiilis',
          miksi: 'Tässä kerrotaan, miltä sinusta tuntuu.' },
        { teksti: 'Jos asian saa selvitettyä, ryhmä oppii puhumaan vaikeistakin asioista.', nako: 'hyvaa',
          miksi: 'Tässä mietitään, mitä hyvää voisi seurata.' },
        { teksti: 'Jos teet osan itse, kukaan ei opi vastuuta ja sinä väsyt.', nako: 'riskit',
          miksi: 'Tässä mietitään, mikä voisi mennä pieleen.' },
        { teksti: 'Voisitte jakaa jäljellä olevan osan kolmeen pieneen palaan.', nako: 'vaihtoehdot',
          miksi: 'Tässä keksitään toinen tapa ratkaista asia.' },
        { teksti: 'Pyydät ryhmän kokoon huomenna välitunnille ja sovitte, kuka tekee mitä.', nako: 'askel',
          miksi: 'Tässä sovitaan konkreettinen seuraava askel.' }
      ],
      vaihtoehdot: [
        'Teen kesken jääneen osan itse, ettei arvosana kärsi.',
        'Puhun ensin kaverille kahden kesken ja kysyn, mikä on vialla.',
        'Kerron opettajalle heti, ettei ryhmä toimi.'
      ],
      kaanne: 'Kaverisi vastaa viimein. Hän kertoo, että kotona on ollut hankalaa viime viikolla.'
    },
    {
      id: 'raha',
      otsikko: 'Mihin rahat?',
      kuvaus: 'Olet säästänyt kesätyörahaa. Mihin sen käyttäisit?',
      tarina: [
        'Olet säästänyt kesätöistä 200 euroa. Sinulla on kolme ajatusta: uusi puhelin, konserttilippu kavereiden kanssa tai säästäminen.',
        'Vanha puhelimesi toimii vielä, mutta on hidas.'
      ],
      ajatukset: [
        { teksti: 'Sinulla on 200 euroa. Uusi puhelin maksaisi 230 euroa ja konserttilippu 60 euroa.', nako: 'faktat',
          miksi: 'Tässä on lukuja, jotka voi tarkistaa.' },
        { teksti: 'Vanhan puhelimen kanssa tuntuu vähän kiusalliselta, kun muilla on uudemmat.', nako: 'fiilis',
          miksi: 'Tässä kerrotaan tunteesta, ei asiasta, jonka voi mitata.' },
        { teksti: 'Konsertti olisi yhteinen muisto kavereiden kanssa, ja rahaa jäisi vielä säästöön.', nako: 'hyvaa',
          miksi: 'Tässä mietitään, mitä hyvää valinnasta seuraisi.' },
        { teksti: 'Jos ostat puhelimen heti ja rikot sen, rahaa ei ole enää jäljellä.', nako: 'riskit',
          miksi: 'Tässä mietitään, mikä voisi mennä pieleen.' },
        { teksti: 'Voit ostaa käytetyn puhelimen tai odottaa alennuksia.', nako: 'vaihtoehdot',
          miksi: 'Tässä keksitään muita tapoja ratkaista asia.' },
        { teksti: 'Vertaat kolmen kaupan hintoja viikonloppuna ja päätät sunnuntaina.', nako: 'askel',
          miksi: 'Tässä sovitaan, mitä tehdään ja milloin päätetään.' }
      ],
      vaihtoehdot: [
        'Ostan konserttilipun ja säästän loput.',
        'Säästän kaiken ja odotan.',
        'Ostan käytetyn puhelimen ja pidän loput rahat.'
      ],
      kaanne: 'Vanhan puhelimen akku alkaa pettää. Se sammuu välillä kesken päivän.'
    }
  ];

  var AVAIN = 'paatosraati9_tila';
  var tila = lataa() || alkutila();
  var nakyma = document.getElementById('pr-nakyma');
  var vaiheLista = document.getElementById('pr-vaiheet');

  function alkutila() {
    return { tilanne: null, vaihe: 0, lajiteltu: {}, ekaYritys: {}, jarjestys: null,
             valinta: null, oma: '', painavat: [], perustelu: '',
             muuttuiko: '', muutosTeksti: '', pohdinta: { p1: '', p2: '', p3: '' } };
  }
  function lataa() {
    try {
      var s = JSON.parse(localStorage.getItem(AVAIN));
      if (s && typeof s === 'object' && s.pohdinta) return s;
    } catch (e) {}
    return null;
  }
  function tallenna() {
    try { localStorage.setItem(AVAIN, JSON.stringify(tila)); } catch (e) {}
  }

  function el(tag, attrs, teksti) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    if (teksti != null) e.textContent = teksti;
    return e;
  }
  function nakoHaku(id) {
    for (var i = 0; i < NAKOKULMAT.length; i++) if (NAKOKULMAT[i].id === id) return NAKOKULMAT[i];
    return null;
  }
  function tilanneHaku() {
    for (var i = 0; i < TILANTEET.length; i++) if (TILANTEET[i].id === tila.tilanne) return TILANTEET[i];
    return null;
  }
  function sekoita(n) {
    var a = [], i, j, t;
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function menePaikalle(v) {
    tila.vaihe = v; tallenna(); piirra();
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    var h = nakyma && nakyma.querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function paivitaVaiheet() {
    if (!vaiheLista) return;
    Array.prototype.forEach.call(vaiheLista.querySelectorAll('li'), function (li) {
      var v = Number(li.getAttribute('data-v'));
      li.className = v === tila.vaihe ? 'on' : (v < tila.vaihe ? 'valmis' : '');
      if (v === tila.vaihe) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }

  function nakokulmaLista() {
    var g = el('div', { class: 'pr-nakokulmat', role: 'list' });
    NAKOKULMAT.forEach(function (n) {
      var d = el('div', { class: 'pr-nako', role: 'listitem' });
      var b = el('b'); b.textContent = n.ikoni + ' ' + n.nimi;
      d.appendChild(b); d.appendChild(el('span', null, n.kysymys));
      g.appendChild(d);
    });
    return g;
  }

  /* ── Vaihe 0: valitse tilanne ── */
  function vaihe0() {
    var k = el('div', { class: 'pr-kortti' });
    k.appendChild(el('h2', null, 'Valitse tilanne'));
    k.appendChild(el('p', null, 'Valitse se tilanne, joka tuntuu sinulle läheisimmältä. Kuvittele, että päätös on sinun.'));
    var l = el('div', { class: 'pr-tilanteet' });
    TILANTEET.forEach(function (t) {
      var b = el('button', { type: 'button', class: 'pr-tilanne-nappi' });
      b.appendChild(el('b', null, t.otsikko));
      b.appendChild(el('span', null, t.kuvaus));
      b.addEventListener('click', function () {
        var uusi = alkutila();
        uusi.tilanne = t.id; uusi.jarjestys = sekoita(t.ajatukset.length);
        tila = uusi; menePaikalle(1);
      });
      l.appendChild(b);
    });
    k.appendChild(l);
    nakyma.appendChild(k);
  }

  /* ── Vaihe 1: lajittele ajatukset ── */
  function vaihe1() {
    var t = tilanneHaku(); if (!t) { menePaikalle(0); return; }
    var k = el('div', { class: 'pr-kortti' });
    k.appendChild(el('h2', null, t.otsikko));
    var tarina = el('div', { class: 'pr-tarina' });
    t.tarina.forEach(function (p) { tarina.appendChild(el('p', null, p)); });
    k.appendChild(tarina);

    k.appendChild(el('h3', null, 'Kuusi näkökulmaa'));
    k.appendChild(el('p', null, 'Hyvässä päätöksessä katsotaan asiaa jokaisesta näkökulmasta erikseen. Älä sekoita niitä keskenään.'));
    k.appendChild(nakokulmaLista());

    k.appendChild(el('h3', null, 'Mihin näkökulmaan ajatus kuuluu?'));
    k.appendChild(el('p', null, 'Alla on kuusi ajatusta tästä tilanteesta. Valitse jokaiselle se näkökulma, johon se sopii parhaiten.'));
    var edist = el('p', { class: 'pr-edistyminen', 'aria-live': 'polite' });
    k.appendChild(edist);

    var jarj = (tila.jarjestys && tila.jarjestys.length === t.ajatukset.length) ? tila.jarjestys : sekoita(t.ajatukset.length);
    tila.jarjestys = jarj;

    function laskeValmiit() {
      var n = Object.keys(tila.lajiteltu).length;
      edist.textContent = 'Lajiteltu ' + n + ' / ' + t.ajatukset.length;
      return n;
    }
    var jatka = el('button', { type: 'button', class: 'pr-nappi vihrea' }, 'Seuraavaksi: tee päätös →');
    function paivitaJatka() { jatka.disabled = laskeValmiit() < t.ajatukset.length; }

    jarj.forEach(function (idx) {
      var a = t.ajatukset[idx];
      var kortti = el('div', { class: 'pr-ajatus' });
      kortti.appendChild(el('p', { class: 'pr-ajatus-teksti' }, a.teksti));
      var rivi = el('div', { class: 'pr-valinnat', role: 'group', 'aria-label': 'Valitse näkökulma tälle ajatukselle' });
      var palaute = el('div', { class: 'pr-palaute', 'aria-live': 'polite', hidden: 'hidden' });
      var nappiKartta = {};

      function lukitse(oikea) {
        kortti.classList.add('ok');
        Object.keys(nappiKartta).forEach(function (id) {
          nappiKartta[id].disabled = true;
          if (id === oikea) nappiKartta[id].classList.add('oikein');
        });
        palaute.className = 'pr-palaute ok'; palaute.hidden = false;
        palaute.textContent = 'Oikein! ' + a.miksi;
      }

      NAKOKULMAT.forEach(function (n) {
        var b = el('button', { type: 'button', class: 'pr-nappi-nako' });
        b.textContent = n.ikoni + ' ' + n.nimi;
        nappiKartta[n.id] = b;
        b.addEventListener('click', function () {
          if (tila.ekaYritys[idx] === undefined) tila.ekaYritys[idx] = (n.id === a.nako);
          if (n.id === a.nako) {
            tila.lajiteltu[idx] = n.id; tallenna(); lukitse(n.id); paivitaJatka();
          } else {
            b.disabled = true; b.classList.add('vaarin');
            palaute.className = 'pr-palaute hmm'; palaute.hidden = false;
            palaute.textContent = 'Mieti vielä. Näkökulma "' + n.nimi + '" kysyy: ' + n.kysymys + ' Vastaako ajatus siihen? Kokeile toista.';
            tallenna();
          }
        });
        rivi.appendChild(b);
      });
      kortti.appendChild(rivi); kortti.appendChild(palaute);
      k.appendChild(kortti);
      if (tila.lajiteltu[idx]) lukitse(tila.lajiteltu[idx]);
    });

    var rivi2 = el('div', { class: 'pr-rivi' });
    var takaisin = el('button', { type: 'button', class: 'pr-nappi hento' }, '← Valitse toinen tilanne');
    takaisin.addEventListener('click', function () { menePaikalle(0); });
    jatka.addEventListener('click', function () { menePaikalle(2); });
    rivi2.appendChild(takaisin); rivi2.appendChild(jatka);
    k.appendChild(rivi2);
    paivitaJatka();
    nakyma.appendChild(k);
  }

  /* ── Vaihe 2: päätä ── */
  function vaihe2() {
    var t = tilanneHaku(); if (!t) { menePaikalle(0); return; }
    var k = el('div', { class: 'pr-kortti' });
    k.appendChild(el('h2', null, 'Tee päätös'));
    k.appendChild(el('p', null, 'Nyt olet katsonut tilannetta joka puolelta. Mitä sinä tekisit?'));

    var fs = el('fieldset');
    fs.appendChild(el('legend', null, 'Valitse yksi'));
    var lista = el('div', { class: 'pr-vaihtoehdot' });
    var vaihtoehdot = t.vaihtoehdot.concat(['Oma ratkaisu (kirjoita alle)']);
    var omaKentta = el('input', { type: 'text', id: 'pr-oma', 'aria-label': 'Oma ratkaisusi', placeholder: 'Kirjoita oma ratkaisusi', maxlength: '200' });
    omaKentta.value = tila.oma || '';
    omaKentta.hidden = tila.valinta !== vaihtoehdot.length - 1;

    var jatka = el('button', { type: 'button', class: 'pr-nappi vihrea' }, 'Vahvista päätös →');
    function tarkista() {
      var ok = tila.valinta !== null && tila.painavat.length >= 1;
      if (tila.valinta === vaihtoehdot.length - 1 && !(omaKentta.value || '').trim()) ok = false;
      jatka.disabled = !ok;
    }

    vaihtoehdot.forEach(function (teksti, i) {
      var lbl = el('label', { class: 'pr-vaihtoehto' + (tila.valinta === i ? ' valittu' : '') });
      var inp = el('input', { type: 'radio', name: 'pr-valinta', value: String(i) });
      inp.checked = tila.valinta === i;
      inp.addEventListener('change', function () {
        tila.valinta = i;
        Array.prototype.forEach.call(lista.querySelectorAll('.pr-vaihtoehto'), function (x, j) {
          x.classList.toggle('valittu', j === i);
        });
        omaKentta.hidden = i !== vaihtoehdot.length - 1;
        if (!omaKentta.hidden) omaKentta.focus();
        tallenna(); tarkista();
      });
      lbl.appendChild(inp); lbl.appendChild(el('span', null, teksti));
      lista.appendChild(lbl);
    });
    fs.appendChild(lista); fs.appendChild(omaKentta);
    omaKentta.addEventListener('input', function () { tila.oma = omaKentta.value; tallenna(); tarkista(); });
    k.appendChild(fs);

    var fs2 = el('fieldset');
    fs2.appendChild(el('legend', null, 'Mitkä kaksi näkökulmaa painoivat eniten päätöksessäsi? (valitse 1–2)'));
    var l2 = el('div', { class: 'pr-vaihtoehdot' });
    NAKOKULMAT.forEach(function (n) {
      var lbl = el('label', { class: 'pr-vaihtoehto' + (tila.painavat.indexOf(n.id) > -1 ? ' valittu' : '') });
      var inp = el('input', { type: 'checkbox', value: n.id });
      inp.checked = tila.painavat.indexOf(n.id) > -1;
      inp.addEventListener('change', function () {
        var i = tila.painavat.indexOf(n.id);
        if (inp.checked && i === -1) {
          if (tila.painavat.length >= 2) { inp.checked = false; return; }
          tila.painavat.push(n.id);
        } else if (!inp.checked && i > -1) tila.painavat.splice(i, 1);
        lbl.classList.toggle('valittu', inp.checked);
        tallenna(); tarkista();
      });
      lbl.appendChild(inp); lbl.appendChild(el('span', null, n.ikoni + ' ' + n.nimi));
      l2.appendChild(lbl);
    });
    fs2.appendChild(l2); k.appendChild(fs2);

    k.appendChild(el('label', { class: 'pr-kysymys', for: 'pr-perustelu' }, 'Perustele päätöksesi yhdellä lauseella (ei pakollinen)'));
    var perus = el('textarea', { id: 'pr-perustelu', maxlength: '500' });
    perus.value = tila.perustelu || '';
    perus.addEventListener('input', function () { tila.perustelu = perus.value; tallenna(); });
    k.appendChild(perus);

    var rivi = el('div', { class: 'pr-rivi' });
    var takaisin = el('button', { type: 'button', class: 'pr-nappi hento' }, '← Takaisin');
    takaisin.addEventListener('click', function () { menePaikalle(1); });
    jatka.addEventListener('click', function () { menePaikalle(3); });
    rivi.appendChild(takaisin); rivi.appendChild(jatka);
    k.appendChild(rivi);
    tarkista();
    nakyma.appendChild(k);
  }

  /* ── Vaihe 3: käänne ── */
  function vaihe3() {
    var t = tilanneHaku(); if (!t) { menePaikalle(0); return; }
    var k = el('div', { class: 'pr-kortti' });
    k.appendChild(el('h2', null, 'Käänne!'));
    k.appendChild(el('p', null, 'Hyvä päätöksentekijä päivittää päätöstään, kun saa uutta tietoa. Tilanne muuttuu:'));
    var tw = el('div', { class: 'pr-twist' });
    tw.appendChild(el('p', null, t.kaanne));
    k.appendChild(tw);

    var jatka = el('button', { type: 'button', class: 'pr-nappi vihrea' }, 'Pohdi lopuksi →');
    jatka.disabled = !tila.muuttuiko;

    var fs = el('fieldset');
    fs.appendChild(el('legend', null, 'Muuttuuko päätöksesi?'));
    var l = el('div', { class: 'pr-vaihtoehdot' });
    [['kylla', 'Kyllä, muutan päätöstäni'], ['ei', 'Ei, pysyn alkuperäisessä'], ['en', 'En ole varma']].forEach(function (o) {
      var lbl = el('label', { class: 'pr-vaihtoehto' + (tila.muuttuiko === o[0] ? ' valittu' : '') });
      var inp = el('input', { type: 'radio', name: 'pr-muutos', value: o[0] });
      inp.checked = tila.muuttuiko === o[0];
      inp.addEventListener('change', function () {
        tila.muuttuiko = o[0];
        Array.prototype.forEach.call(l.querySelectorAll('.pr-vaihtoehto'), function (x) {
          var i2 = x.querySelector('input');
          x.classList.toggle('valittu', !!(i2 && i2.checked));
        });
        tallenna(); jatka.disabled = false;
      });
      lbl.appendChild(inp); lbl.appendChild(el('span', null, o[1]));
      l.appendChild(lbl);
    });
    fs.appendChild(l); k.appendChild(fs);

    k.appendChild(el('label', { class: 'pr-kysymys', for: 'pr-muutosteksti' }, 'Mitä teet nyt ja miksi? Mikä näkökulma auttoi tässä eniten?'));
    var ta = el('textarea', { id: 'pr-muutosteksti', maxlength: '600' });
    ta.value = tila.muutosTeksti || '';
    ta.addEventListener('input', function () { tila.muutosTeksti = ta.value; tallenna(); });
    k.appendChild(ta);

    var rivi = el('div', { class: 'pr-rivi' });
    var takaisin = el('button', { type: 'button', class: 'pr-nappi hento' }, '← Takaisin');
    takaisin.addEventListener('click', function () { menePaikalle(2); });
    jatka.addEventListener('click', function () { menePaikalle(4); });
    rivi.appendChild(takaisin); rivi.appendChild(jatka);
    k.appendChild(rivi);
    nakyma.appendChild(k);
  }

  /* ── Vaihe 4: yhteenveto ja pohdinta ── */
  function valintaTeksti(t) {
    if (tila.valinta === null) return '(ei valintaa)';
    if (tila.valinta >= t.vaihtoehdot.length) return (tila.oma || '').trim() || '(oma ratkaisu)';
    return t.vaihtoehdot[tila.valinta];
  }
  function muutosTeksti() {
    return ({ kylla: 'Kyllä, muutin päätöstäni', ei: 'Ei, pysyin alkuperäisessä', en: 'En ollut varma' })[tila.muuttuiko] || '(ei vastausta)';
  }
  function vaihe4() {
    var t = tilanneHaku(); if (!t) { menePaikalle(0); return; }
    var k = el('div', { class: 'pr-kortti pr-yhteenveto' });
    k.appendChild(el('h2', null, 'Yhteenveto'));

    var heti = 0; Object.keys(tila.ekaYritys).forEach(function (i) { if (tila.ekaYritys[i]) heti++; });
    var painavatNimet = tila.painavat.map(function (id) { var n = nakoHaku(id); return n ? n.ikoni + ' ' + n.nimi : id; }).join(', ') || '–';

    var dl = el('dl');
    [['Tilanne', t.otsikko], ['Päätökseni', valintaTeksti(t)], ['Painavimmat näkökulmat', painavatNimet],
     ['Lajittelu', heti + ' / ' + t.ajatukset.length + ' heti oikein'], ['Käänteen jälkeen', muutosTeksti()]
    ].forEach(function (r) { dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); });
    k.appendChild(dl);

    var ohitetut = NAKOKULMAT.filter(function (n) { return tila.painavat.indexOf(n.id) === -1; });
    if (ohitetut.length) {
      k.appendChild(el('h3', null, 'Näihin kannattaa vielä palata'));
      k.appendChild(el('p', null, 'Et valinnut näitä painavimmiksi. Se on ihan ok. Kysy silti itseltäsi:'));
      var ul = el('ul', { class: 'pr-ei-valittu' });
      ohitetut.forEach(function (n) { ul.appendChild(el('li', null, n.ikoni + ' ' + n.nimi + ': ' + n.kysymys)); });
      k.appendChild(ul);
    }

    k.appendChild(el('h3', null, 'Pohdi lopuksi'));
    [['p1', '1. Mikä näkökulma oli sinulle helpoin? Mikä oli vaikein?'],
     ['p2', '2. Mitä näkökulmaa käytät harvoin, kun teet päätöksiä oikeassa elämässä?'],
     ['p3', '3. Missä oikeassa tilanteessa haluaisit kokeilla tätä seuraavaksi?']
    ].forEach(function (q) {
      k.appendChild(el('label', { class: 'pr-kysymys', for: 'pr-' + q[0] }, q[1]));
      var ta = el('textarea', { id: 'pr-' + q[0], maxlength: '800' });
      ta.value = tila.pohdinta[q[0]] || '';
      ta.addEventListener('input', function () { tila.pohdinta[q[0]] = ta.value; tallenna(); });
      k.appendChild(ta);
    });

    var ilm = el('p', { class: 'pr-ilmoitus', role: 'status', hidden: 'hidden' }, 'Tiedosto tallennettu! Voit palauttaa sen opettajalle.');
    var rivi = el('div', { class: 'pr-rivi' });
    var lataaNappi = el('button', { type: 'button', class: 'pr-nappi vihrea' }, '⬇ Tallenna vastaukseni');
    lataaNappi.addEventListener('click', function () { lataaTiedosto(t); ilm.hidden = false; setTimeout(function () { ilm.hidden = true; }, 4000); });
    var uusi = el('button', { type: 'button', class: 'pr-nappi hento' }, 'Kokeile toista tilannetta');
    uusi.addEventListener('click', function () { tila = alkutila(); menePaikalle(0); });
    var takaisin = el('button', { type: 'button', class: 'pr-nappi hento' }, '← Takaisin');
    takaisin.addEventListener('click', function () { menePaikalle(3); });
    rivi.appendChild(takaisin); rivi.appendChild(lataaNappi); rivi.appendChild(uusi);
    k.appendChild(rivi); k.appendChild(ilm);

    var jatko = el('p', { class: 'pr-vihje' });
    jatko.style.marginTop = '14px';
    jatko.textContent = 'Seuraavaksi voit kokeilla samaa ryhmässä Neuvonantaja-tehtävässä.';
    k.appendChild(jatko);
    nakyma.appendChild(k);
  }

  function lataaTiedosto(t) {
    var rivit = ['PÄÄTÖSRAATI', '===========', 'Tilanne: ' + t.otsikko, 'Päätökseni: ' + valintaTeksti(t),
      'Painavimmat näkökulmat: ' + (tila.painavat.map(function (id) { var n = nakoHaku(id); return n ? n.nimi : id; }).join(', ') || '–'),
      'Perustelu: ' + ((tila.perustelu || '').trim() || '(ei vastausta)'), '',
      'Käänne: ' + t.kaanne, 'Muuttuiko päätös: ' + muutosTeksti(),
      'Mitä teen nyt ja miksi: ' + ((tila.muutosTeksti || '').trim() || '(ei vastausta)'), '',
      '1. Helpoin ja vaikein näkökulma', tila.pohdinta.p1 || '(ei vastausta)', '',
      '2. Näkökulma, jota käytän harvoin', tila.pohdinta.p2 || '(ei vastausta)', '',
      '3. Missä haluan kokeilla seuraavaksi', tila.pohdinta.p3 || '(ei vastausta)'];
    var blob = new Blob([rivit.join('\n')], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'paatosraati.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function piirra() {
    if (!nakyma) return;
    while (nakyma.firstChild) nakyma.removeChild(nakyma.firstChild);
    paivitaVaiheet();
    var v = tila.vaihe;
    if (v > 0 && !tilanneHaku()) v = tila.vaihe = 0;
    ({ 0: vaihe0, 1: vaihe1, 2: vaihe2, 3: vaihe3, 4: vaihe4 }[v] || vaihe0)();
  }

  piirra();
})();
