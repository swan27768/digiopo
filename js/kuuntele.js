/*!
 * DigiOpo — Kuuntele (ääneenluku)
 * -----------------------------------------------------------------------------
 * Kelluva "Kuuntele"-painike, joka lukee näkyvän tekstin ääneen ja korostaa
 * luettavan kohdan. Kaksi lähdettä:
 *   1) Valmiiksi tuotetut äänitiedostot (Piper-neuroääni) — paras laatu, sama
 *      joka laitteella, toimii offline. Etsitään /audio/manifest.json:n kautta
 *      tai window.KUUNTELE_AUDIO-objektista (upotettu demo).
 *   2) Selaimen puhesynteesi (Web Speech API) — varajärjestelmä, jos jonkin
 *      kohdan äänitiedostoa ei löydy tai selain on offline ilman tiedostoja.
 *
 * Ei riippuvuuksia, ei build-vaihetta. Liitä sivulle:
 *   <script src="/js/kuuntele.js" defer></script>
 *
 * © Olga Lenskaya — osa DigiOpo-oppimateriaalia.
 */
(function () {
  "use strict";

  var hasSpeech = ("speechSynthesis" in window) &&
                  (typeof window.SpeechSynthesisUtterance !== "undefined");
  var synth = hasSpeech ? window.speechSynthesis : null;

  // --- Lukunopeudet ---------------------------------------------------------
  var SPEEDS = [
    { id: "hidas",    label: "Hidas",    rate: 0.7  },
    { id: "normaali", label: "Normaali", rate: 0.9  },
    { id: "nopea",    label: "Nopea",    rate: 1.15 }
  ];
  var DEFAULT_SPEED = "normaali";
  var STORAGE_KEY = "digiopo_kuuntele_nopeus";
  var VOICE_KEY = "digiopo_kuuntele_aani";

  var LANG_MAP = {
    fi: "fi-FI", sv: "sv-SE", en: "en-US", et: "et-EE", ru: "ru-RU",
    ar: "ar-SA", fa: "fa-IR", so: "so-SO", sq: "sq-AL", es: "es-ES", tr: "tr-TR"
  };

  var READABLE_SELECTOR = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "blockquote", "figcaption", "dt", "dd", "td", "th",
    ".task-intro", ".task-body", ".highlight-quote", ".pair-box",
    ".radio-option", ".role-title", ".role-desc", ".vaihe-tag",
    ".situation-label", ".header-title", ".header-label",
    ".name-card-hint", ".save-step", "label"
  ].join(",");

  var EXCLUDE_SELECTOR =
    "script,style,noscript,textarea,input,select,button,nav,.nav," +
    ".progress-bar,.kuuntele-widget,.kuuntele-skip," +
    // Ei oppilaan ääneenluettavaa: "i"-teoriaikkunat ja opettajan ohjeet
    ".teoria-modal,.teoria-nappi,.ope-osio,.ope-paneeli,.ope-vihje," +
    ".opettaja-osio,.opettaja-sisalto,.opettaja-toggle";

  var speedId = readSpeed();
  var chosenVoiceURI = readVoicePref();
  var state = { playing: false, segments: [], segIndex: 0, hl: null, lang: "fi-FI" };

  // Äänitiedostotila.
  var audioMode = false;      // onko valmiita äänitiedostoja käytössä
  var audioMap = null;        // { hash: url|dataURI }
  var audioEl = null;         // uudelleenkäytetty <audio>-elementti

  // --- Asetusten talletus ---------------------------------------------------
  function readSpeed() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      if (s && SPEEDS.some(function (x) { return x.id === s; })) return s;
    } catch (e) {}
    return DEFAULT_SPEED;
  }
  function saveSpeed() { try { localStorage.setItem(STORAGE_KEY, speedId); } catch (e) {} }
  function readVoicePref() { try { return localStorage.getItem(VOICE_KEY) || ""; } catch (e) { return ""; } }
  function saveVoicePref() { try { localStorage.setItem(VOICE_KEY, chosenVoiceURI || ""); } catch (e) {} }
  function speed() {
    for (var i = 0; i < SPEEDS.length; i++) if (SPEEDS[i].id === speedId) return SPEEDS[i];
    return SPEEDS[1];
  }

  // --- Tekstin käsittely ----------------------------------------------------
  function isVisible(el) {
    if (!el || !el.getClientRects || el.getClientRects().length === 0) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    if (parseFloat(cs.opacity) === 0) return false;
    return true;
  }

  // Siisti puhuttava/haettava teksti. TÄRKEÄÄ: tämän on tuotettava sama tulos
  // kuin generointiskriptin, jotta hash täsmää äänitiedostoon.
  function normalize(raw) {
    return (raw || "")
      .replace(/[\u{1F000}-\u{1FAFF}]/gu, " ")
      .replace(/[\u{2600}-\u{27BF}]/gu, " ")
      .replace(/[\u{2190}-\u{21FF}]/gu, " ")
      .replace(/[\u{2B00}-\u{2BFF}]/gu, " ")
      .replace(/️/gu, "")
      .replace(/[·•|]/g, ", ")
      .replace(/[—–]/g, ", ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // FNV-1a 32-bit UTF-8-tavuista → 8 heksaa. Sama toteutus generointiskriptissä.
  function hashText(str) {
    var bytes = new TextEncoder().encode(str);
    var h = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  // Järjestysluvut: "7. luokka" → "seitsemäs luokka". Muunnetaan vain kun perässä
  // (välin/väliviivan jälkeen) on pienellä alkava sana → lauseenloput ("…on 7.")
  // ja isolla alkavat uudet lauseet eivät muutu.
  var ORDINALS = {
    1:"ensimmäinen",2:"toinen",3:"kolmas",4:"neljäs",5:"viides",6:"kuudes",7:"seitsemäs",
    8:"kahdeksas",9:"yhdeksäs",10:"kymmenes",11:"yhdestoista",12:"kahdestoista",13:"kolmastoista",
    14:"neljästoista",15:"viidestoista",16:"kuudestoista",17:"seitsemästoista",18:"kahdeksastoista",
    19:"yhdeksästoista",20:"kahdeskymmenes",21:"kahdeskymmenesensimmäinen",22:"kahdeskymmenestoinen",
    23:"kahdeskymmeneskolmas",24:"kahdeskymmenesneljäs",25:"kahdeskymmenesviides",26:"kahdeskymmeneskuudes",
    27:"kahdeskymmenesseitsemäs",28:"kahdeskymmeneskahdeksas",29:"kahdeskymmenesyhdeksäs",30:"kolmaskymmenes",
    31:"kolmaskymmenesensimmäinen"
  };
  function speakable(text) {
    return (text || "").replace(/(\d+)\.(?=[\s-]*[a-zäöåé])/g, function (m, n) {
      var o = ORDINALS[parseInt(n, 10)];
      return o ? o : m;
    });
  }

  function collectSegments() {
    var nodes = document.body.querySelectorAll(READABLE_SELECTOR);
    var out = [];
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.closest(EXCLUDE_SELECTOR)) return;
      if (el.querySelector(READABLE_SELECTOR)) return;
      if (!isVisible(el)) return;
      var text = normalize(el.innerText || el.textContent);
      if (!text) return;
      out.push({ el: el, text: text, hash: hashText(text) });
    });
    return out;
  }

  function chunk(text) {
    var parts = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
    var chunks = [], buf = "";
    parts.forEach(function (p) {
      if ((buf + p).length > 180 && buf) { chunks.push(buf.trim()); buf = p; }
      else buf += p;
    });
    if (buf.trim()) chunks.push(buf.trim());
    return chunks;
  }

  // --- Selainäänen valinta (varajärjestelmä) --------------------------------
  function pickLang() {
    var l = (document.documentElement.getAttribute("lang") || "fi").toLowerCase().slice(0, 2);
    return LANG_MAP[l] || l || "fi-FI";
  }
  function scoreVoice(v) {
    var s = 0;
    var n = ((v.name || "") + " " + (v.voiceURI || "")).toLowerCase();
    if (/premium|enhanced|neural|natural|siri/.test(n)) s += 6;
    if (/google/.test(n)) s += 5;
    if (v.localService) s += 2;
    if (/compact|eloquence|espeak/.test(n)) s -= 6;
    return s;
  }
  function voicesForLang(lang) {
    if (!synth) return [];
    var base = lang.slice(0, 2).toLowerCase();
    return (synth.getVoices() || [])
      .filter(function (v) { return (v.lang || "").toLowerCase().slice(0, 2) === base; })
      .sort(function (a, b) { return scoreVoice(b) - scoreVoice(a); });
  }
  function chooseVoice(lang) {
    var list = voicesForLang(lang);
    if (chosenVoiceURI) {
      for (var i = 0; i < list.length; i++) if (list[i].voiceURI === chosenVoiceURI) return list[i];
    }
    return list[0] || null;
  }

  // --- Äänitiedostot --------------------------------------------------------
  function initAudio() {
    // 1) Upotettu kartta (esim. demo)
    if (window.KUUNTELE_AUDIO && window.KUUNTELE_AUDIO.map) {
      audioMap = window.KUUNTELE_AUDIO.map;
      audioMode = true;
      return;
    }
    // 2) Sivuston manifest: /audio/manifest.json { voice, hashes:[...] }
    try {
      fetch("/audio/manifest.json", { credentials: "same-origin" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j) return;
          var hashes = Array.isArray(j.hashes) ? j.hashes : (j.hashes ? Object.keys(j.hashes) : []);
          if (!hashes.length) return;
          audioMap = {};
          hashes.forEach(function (h) { audioMap[h] = "/audio/" + h + ".mp3"; });
          audioMode = true;
          if (window._kuunteleAfterAudio) window._kuunteleAfterAudio();
        })
        .catch(function () {});
    } catch (e) {}
  }

  function audioURLFor(text) {
    if (!audioMode || !audioMap) return null;
    var u = audioMap[hashText(text)];
    return u || null;
  }

  function playAudio(url, onend, onerror) {
    try {
      if (!audioEl) audioEl = new Audio();
      audioEl.src = url;
      audioEl.playbackRate = speed().rate;
      audioEl.onended = function () { if (state.playing) onend(); };
      audioEl.onerror = function () { if (state.playing) onerror(); };
      var p = audioEl.play();
      if (p && p.catch) p.catch(function () { if (state.playing) onerror(); });
    } catch (e) { onerror(); }
  }

  // --- Korostus -------------------------------------------------------------
  function highlight(el) {
    clearHighlight();
    el.classList.add("kuuntele-highlight");
    state.hl = el;
    try { el.scrollIntoView({ block: "center", behavior: "smooth" }); }
    catch (e) { try { el.scrollIntoView(); } catch (e2) {} }
  }
  function clearHighlight() {
    if (state.hl) { state.hl.classList.remove("kuuntele-highlight"); state.hl = null; }
  }

  // --- Toisto ---------------------------------------------------------------
  // Automaattinen jatko: kun oppilas on kerran painanut Kuuntele (armed=true),
  // ruudun vaihtuessa lukija alkaa lukea uutta sisältöä itsestään. Aina näkyvä
  // yläosa (nimikortti, otsikko) tunnistetaan "pysyväksi" eikä sitä lueta joka
  // kerta uudelleen.
  var armed = false;
  var prevVisible = [];              // edellisen skannauksen näkyvät hashit

  function sameList(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function beginRead(segs, fromIndex) {
    if (synth) synth.cancel();
    if (audioEl) { try { audioEl.pause(); } catch (e) {} }
    state.segments = segs;
    if (!state.segments.length) return;
    state.lang = pickLang();
    state.segIndex = fromIndex || 0;
    state.playing = true;
    updateButton();
    speakSegment(state.segIndex);
  }

  // Ensimmäinen segmentti, joka on tällä hetkellä näkyvissä ruudulla (viewportissa).
  // Näin pitkillä vieritettävillä sivuilla luku alkaa siitä, mitä oppilas katsoo,
  // eikä aina sivun ylimmästä rivistä.
  function firstInViewport(segs) {
    var top = 64; // varaa tilaa mahdolliselle kiinteälle yläpalkille
    for (var i = 0; i < segs.length; i++) {
      var r = segs[i].el.getBoundingClientRect();
      if (r.bottom > top && r.top < window.innerHeight) return i;
    }
    return 0;
  }

  // Käyttäjän painallus: aloita luku näkyvästä kohdasta (ei sivun alusta).
  function manualStart() {
    armed = true;
    var segs = collectSegments();
    if (!segs.length) return;
    prevVisible = segs.map(function (s) { return s.hash; });
    beginRead(segs, firstInViewport(segs));
  }

  // DOM muuttui. Automaattinen jatko käynnistyy VAIN aidossa ruudun vaihdossa:
  // vanhaa näkyvää sisältöä katosi JA uutta tuli tilalle. Pelkkä paneelin tai
  // tehtävän avaaminen (vain lisäystä) tai sulkeminen (vain poistoa) ei keskeytä
  // lukua eikä hyppää mihinkään.
  var scanTimer = null;
  function onDomChange() {
    if (!armed) return;
    if (scanTimer) return;
    scanTimer = setTimeout(function () {
      scanTimer = null;
      var segs = collectSegments();
      var cur = segs.map(function (s) { return s.hash; });
      if (sameList(cur, prevVisible)) return;   // näkyvyys ei muuttunut (esim. vain korostus)
      var prevSet = Object.create(null); prevVisible.forEach(function (h) { prevSet[h] = 1; });
      var curSet = Object.create(null); cur.forEach(function (h) { curSet[h] = 1; });
      var removed = false;
      for (var i = 0; i < prevVisible.length; i++) { if (!curSet[prevVisible[i]]) { removed = true; break; } }
      var addedIdx = -1;
      for (var j = 0; j < segs.length; j++) { if (!prevSet[segs[j].hash]) { addedIdx = j; break; } }
      prevVisible = cur;
      if (removed && addedIdx !== -1) beginRead(segs, addedIdx); // aito ruudun vaihto → lue uusi ruutu
    }, 280);
  }

  function stop() {
    state.playing = false;
    if (synth) synth.cancel();
    if (audioEl) { try { audioEl.pause(); } catch (e) {} }
    clearHighlight();
    updateButton();
  }

  function speakSegment(i) {
    if (!state.playing) return;
    if (i >= state.segments.length) { stop(); return; }
    state.segIndex = i;
    var seg = state.segments[i];
    if (!isVisible(seg.el)) { speakSegment(i + 1); return; }
    highlight(seg.el);
    var next = function () { speakSegment(i + 1); };
    var url = audioURLFor(seg.text);
    if (url) {
      playAudio(url, next, function () { speakViaSpeech(seg.text, next); });
    } else {
      speakViaSpeech(seg.text, next);
    }
  }

  function speakViaSpeech(text, done) {
    if (!synth) { done(); return; } // ei äänitiedostoa eikä puhesynteesiä
    speakChunks(chunk(speakable(text)), 0, done);
  }

  function speakChunks(chunks, ci, done) {
    if (!state.playing) return;
    if (ci >= chunks.length) { done(); return; }
    var u = new SpeechSynthesisUtterance(chunks[ci]);
    u.lang = state.lang;
    u.rate = speed().rate;
    var v = chooseVoice(state.lang);
    if (v) u.voice = v;
    u.onend = function () { if (state.playing) speakChunks(chunks, ci + 1, done); };
    u.onerror = function () { if (state.playing) speakChunks(chunks, ci + 1, done); };
    synth.speak(u);
  }

  // Chrome pysäyttää synteesin ~15 s jälkeen — pidetään hereillä.
  if (synth) {
    setInterval(function () {
      if (state.playing && synth.paused) { try { synth.resume(); } catch (e) {} }
    }, 8000);
  }

  // --- Käyttöliittymä -------------------------------------------------------
  function buildUI() {
    initAudio();

    var css =
      ".kuuntele-widget{position:fixed;right:16px;z-index:2147483000;display:flex;" +
      "gap:8px;align-items:center;font-family:inherit}" +
      ".kuuntele-btn,.kuuntele-speed{border:none;cursor:pointer;border-radius:999px;" +
      "font-family:inherit;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.18);" +
      "-webkit-tap-highlight-color:transparent}" +
      ".kuuntele-btn{display:flex;align-items:center;gap:8px;padding:12px 18px;" +
      "background:#0F6E56;color:#fff;font-size:15px;min-height:44px}" +
      ".kuuntele-btn.playing{background:#BA7517}" +
      ".kuuntele-btn:hover{filter:brightness(1.06)}" +
      ".kuuntele-ico{font-size:18px;line-height:1}" +
      ".kuuntele-speed{padding:0 14px;min-height:44px;background:#fff;color:#0F6E56;" +
      "font-size:13px;border:1.5px solid rgba(15,110,86,.25)}" +
      ".kuuntele-voice{max-width:140px;min-height:44px;padding:0 10px;border-radius:999px;" +
      "background:#fff;color:#0F6E56;font-family:inherit;font-weight:600;font-size:12px;" +
      "border:1.5px solid rgba(15,110,86,.25);box-shadow:0 4px 14px rgba(0,0,0,.18);cursor:pointer}" +
      ".kuuntele-highlight{background:rgba(255,206,84,.5);" +
      "box-shadow:0 0 0 4px rgba(255,206,84,.5);border-radius:4px}" +
      "@media (prefers-reduced-motion:reduce){.kuuntele-highlight{transition:none}}" +
      "@media print{.kuuntele-widget{display:none}}";
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var widget = document.createElement("div");
    widget.className = "kuuntele-widget";
    widget.setAttribute("role", "region");
    widget.setAttribute("aria-label", "Kuuntele sivun teksti");
    var hasNav = !!document.querySelector(".nav");
    widget.style.bottom = "calc(" + (hasNav ? 84 : 20) + "px + env(safe-area-inset-bottom,0px))";

    var btn = document.createElement("button");
    btn.className = "kuuntele-btn";
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = '<span class="kuuntele-ico" aria-hidden="true">🔊</span>' +
                    '<span class="kuuntele-label">Kuuntele</span>';

    var speedBtn = document.createElement("button");
    speedBtn.className = "kuuntele-speed";
    speedBtn.type = "button";
    speedBtn.setAttribute("aria-label", "Lukunopeus");
    speedBtn.textContent = speed().label;

    var voiceSel = document.createElement("select");
    voiceSel.className = "kuuntele-voice";
    voiceSel.setAttribute("aria-label", "Valitse ääni");
    voiceSel.style.display = "none";

    widget.appendChild(btn);
    widget.appendChild(speedBtn);
    widget.appendChild(voiceSel);
    document.body.appendChild(widget);

    var icoEl = btn.querySelector(".kuuntele-ico");
    var labelEl = btn.querySelector(".kuuntele-label");

    window._kuunteleUpdateButton = function () {
      if (state.playing) {
        btn.classList.add("playing");
        labelEl.textContent = "Pysäytä";
        icoEl.textContent = "⏹";
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.remove("playing");
        labelEl.textContent = "Kuuntele";
        icoEl.textContent = "🔊";
        btn.setAttribute("aria-pressed", "false");
      }
    };

    btn.addEventListener("click", function () { if (state.playing) stop(); else manualStart(); });

    // Seuraa ruudun vaihtumista automaattista jatkoa varten.
    try {
      var mo = new MutationObserver(onDomChange);
      mo.observe(document.body, {
        subtree: true, childList: true, attributes: true,
        attributeFilter: ["class", "style", "hidden"]
      });
    } catch (e) {}

    speedBtn.addEventListener("click", function () {
      var idx = 0;
      for (var i = 0; i < SPEEDS.length; i++) if (SPEEDS[i].id === speedId) { idx = i; break; }
      speedId = SPEEDS[(idx + 1) % SPEEDS.length].id;
      saveSpeed();
      speedBtn.textContent = speed().label;
      if (audioEl && !audioEl.paused) {
        audioEl.playbackRate = speed().rate;            // MP3: muuta nopeus lennossa
      } else if (state.playing && synth) {
        var i2 = state.segIndex; synth.cancel(); speakSegment(i2); // puhe: aloita lohko uusiksi
      }
    });

    function populateVoices() {
      // Äänivalitsin näkyy vain selainäänitilassa (ei kun MP3:t käytössä).
      if (audioMode || !synth) { voiceSel.style.display = "none"; return; }
      var list = voicesForLang(pickLang());
      if (list.length <= 1) { voiceSel.style.display = "none"; return; }
      voiceSel.style.display = "";
      voiceSel.innerHTML = "";
      var activeURI = chosenVoiceURI || list[0].voiceURI;
      list.forEach(function (v) {
        var o = document.createElement("option");
        o.value = v.voiceURI;
        o.textContent = v.name;
        if (v.voiceURI === activeURI) o.selected = true;
        voiceSel.appendChild(o);
      });
    }
    voiceSel.addEventListener("change", function () {
      chosenVoiceURI = voiceSel.value;
      saveVoicePref();
      if (state.playing && synth) { var i = state.segIndex; synth.cancel(); speakSegment(i); }
    });

    window._kuunteleAfterAudio = populateVoices; // piilota valitsin kun manifest ehtii latautua
    populateVoices();
    if (synth && typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", populateVoices);
    } else if (synth) {
      synth.onvoiceschanged = populateVoices;
    }
  }

  function updateButton() {
    if (typeof window._kuunteleUpdateButton === "function") window._kuunteleUpdateButton();
  }

  window.addEventListener("pagehide", function () { try { if (synth) synth.cancel(); if (audioEl) audioEl.pause(); } catch (e) {} });
  window.addEventListener("beforeunload", function () { try { if (synth) synth.cancel(); if (audioEl) audioEl.pause(); } catch (e) {} });

  // Generointiapuri: paljastetaan kaikki luettavat lohkot (myös piilossa olevat
  // slidet) tekstinä + hashina. Käytössä vain kun window.KUUNTELE_EXPOSE on tosi.
  if (window.KUUNTELE_EXPOSE) {
    window.__kuunteleAll = function () {
      var nodes = document.body.querySelectorAll(READABLE_SELECTOR);
      var out = [];
      Array.prototype.forEach.call(nodes, function (el) {
        if (el.closest(EXCLUDE_SELECTOR)) return;
        if (el.querySelector(READABLE_SELECTOR)) return;
        var text = normalize(el.textContent); // textContent → myös piilotetut slidet
        if (!text) return;
        out.push({ text: text, hash: hashText(text) });
      });
      return out;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();
