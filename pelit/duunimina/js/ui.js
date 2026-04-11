// ============================
// DUUNIMINÄ UI
// ============================

// Varmistukset: jos nämä puuttuvat, renderöinti katkeaa muuten hiljaa.
function assertGlobals() {
  const missing = [];
  if (typeof window.TOTAL_QUESTIONS === "undefined")
    missing.push("TOTAL_QUESTIONS");
  if (typeof window.calculateDuuniMina !== "function")
    missing.push("calculateDuuniMina()");
  if (typeof window.TYPE_PROFILES === "undefined")
    missing.push("TYPE_PROFILES");
  if (typeof window.buildInterpretation !== "function")
    missing.push("buildInterpretation()");
  if (missing.length) {
    throw new Error("Puuttuvat globaalit: " + missing.join(", "));
  }
}

function renderError(err) {
  const box = document.getElementById("result");
  const test = document.getElementById("test");
  document.getElementById("start")?.classList.add("hidden");
  test?.classList.add("hidden");
  box?.classList.remove("hidden");
  if (box) {
    box.innerHTML = `
      <div class="result-card">
        <h2>Tekninen virhe</h2>
        <p>Tulos ei valmistunut, koska sovelluksessa on koodivirhe.</p>
        <pre style="white-space:pre-wrap; font-size:14px; line-height:1.4;">${String(err && err.stack ? err.stack : err)}</pre>
        <button onclick="location.reload()">Lataa sivu uudelleen</button>
      </div>
    `;
  }
}

// Kysymykset (UI-tekstit). NÄIDEN määrä pitää olla 24.
const QUESTIONS = [
  "Haluan auttaa muita, jos huomaan jonkun tarvitsevan apua.",
  "Pidän siitä, että asiat tehdään oikein ja turvallisesti.",
  "Tykkään miettiä, miksi asiat toimivat niin kuin toimivat.",
  "Tykkään keksiä uusia tapoja tehdä asioita.",
  "Haluan saada asioita tapahtumaan.",
  "Pidän ihmisistä ja ryhmistä.",
  "Nautin tehtävistä, joissa pitää käyttää aivoja.",
  "Minulla on paljon ideoita.",
  "Uskallan sanoa mielipiteeni ääneen.",
  "Minusta on tärkeää, että ympäristö on siisti ja toimiva.",
  "Jaksan kuunnella, jos joku haluaa puhua.",
  "Minusta on tärkeää, että kaikilla on hyvä fiilis.",
  "Tykkään tehdä asioita omalla tyylilläni.",
  "Tykkään suunnitella ennen kuin toimin.",
  "Innostun, kun saan päättää tai suunnitella jotain.",
  "Minusta on tärkeää, että asiat tehdään huolellisesti.",
  "Minulle tulee hyvä mieli, kun voin olla hyödyksi.",
  "Saan energiaa ihmisistä ja yhdessä tekemisestä.",
  "Tykkään ratkaista ongelmia.",
  "Kyllästyn, jos kaikki on aina samanlaista.",
  "Tykkään ottaa vastuuta.",
  "Pidän järjestyksestä.",
  "Haluan, että tekemisellä on näkyvä vaikutus.",
  "Teen mieluummin käytännön hommia kuin pelkkää puhetta.",
];

let answers = {};
let motiveSeed = null;
let current = 0; // 0 = seed-näkymä, 1..TOTAL_QUESTIONS = väittämät

function startTest() {
  document.getElementById("infoBtn").style.display = "none";

  try {
    assertGlobals();

    // Turvacheck: kysymysmäärän synkka
    if (QUESTIONS.length !== window.TOTAL_QUESTIONS) {
      throw new Error(
        `QUESTIONS.length (${QUESTIONS.length}) != TOTAL_QUESTIONS (${window.TOTAL_QUESTIONS}).`,
      );
    }

    answers = {};
    motiveSeed = null;
    current = 0;

    document.getElementById("result").classList.add("hidden");
    document.getElementById("start").classList.add("hidden");
    document.getElementById("test").classList.remove("hidden");

    showSeed();
  } catch (e) {
    renderError(e);
  }
}

// Q1 seed
function showSeed() {
  document.getElementById("test").innerHTML = `
    <h2>Mikä tuntuu sinusta kaikkein omimmalta?</h2>

    <button onclick="setSeed('Auttaa')">
      Autan muita ja huomaan helposti, jos joku tarvitsee tukea.
    </button>

    <button onclick="setSeed('Yhdistää')">
      Viihdyn porukassa ja tuon ihmiset yhteen.
    </button>

    <button onclick="setSeed('Vaikuttaa')">
      Haluan vaikuttaa, päättää ja saada asioita liikkeelle.
    </button>

    <button onclick="setSeed('Luoda')">
      Tykkään keksiä, luoda ja tehdä omalla tyylilläni.
    </button>

    <button onclick="setSeed('Ymmärtää')">
      Haluan ymmärtää ja ratkaista ongelmia.
    </button>

    <button onclick="setSeed('Turvata')">
      Tykkään tehdä käytännön asioita ja pitää huolta, että asiat toimivat.
    </button>
  `;
}

function setSeed(m) {
  motiveSeed = m;
  current = 1;
  showQuestion();
}

// Väittämät
function showQuestion() {
  try {
    assertGlobals();

    // Jos mennään yli -> tulos
    if (current > window.TOTAL_QUESTIONS) {
      showResult();
      return;
    }

    const idx = current - 1;
    const text = QUESTIONS[idx];

    if (!text) {
      // Tämä estää “viimeinen kysymys undefined -> jumi”
      throw new Error(
        `Kysymysteksti puuttuu indeksistä ${idx} (current=${current}).`,
      );
    }

    const test = document.getElementById("test");
    test.innerHTML = `
      <div class="question">
        <h3>${current} / ${window.TOTAL_QUESTIONS}</h3>
        <p>${text}</p>
        ${likert()}
      </div>
    `;
  } catch (e) {
    renderError(e);
  }
}

function likert() {
  return `
    <div class="likert">
      <button onclick="answer(1)">Ei kuvaa minua</button>
      <button onclick="answer(2)">Vähän</button>
      <button onclick="answer(3)">Jonkin verran</button>
      <button onclick="answer(4)">Paljon</button>
      <button onclick="answer(5)">Tosi paljon</button>
    </div>
  `;
}

function answer(v) {
  try {
    answers[current] = v;

    // TÄRKEÄ: pakotetaan siirtymä Q24 -> Result aina
    if (current >= window.TOTAL_QUESTIONS) {
      current = window.TOTAL_QUESTIONS + 1;
      showQuestion(); // ohjaa showResultiin
      return;
    }

    current++;
    showQuestion();
  } catch (e) {
    renderError(e);
  }
}

// Tulos
function showResult() {
  document.getElementById("infoBtn").style.display = "none";

  try {
    const result = window.calculateDuuniMina(answers, motiveSeed);

    const main = window.TYPE_PROFILES[result.primary];
    if (!main) {
      throw new Error(`TYPE_PROFILES ei sisällä avainta: "${result.primary}"`);
    }

    const secondary = result.secondary
      ? window.TYPE_PROFILES[result.secondary]
      : null;
    const interpretation = window.buildInterpretation(
      result.primary,
      result.secondary,
    );

    document.getElementById("test").classList.add("hidden");
    const box = document.getElementById("result");
    box.classList.remove("hidden");

    box.innerHTML = `
      <div class="result-card">

        <h1>Olet ${main.title}</h1>

        <div class="interpretation-box">
          ${interpretation}
        </div>

        <p class="lead">${main.lead}</p>
        <p>${main.meaning}</p>

        ${
          secondary
            ? `
          <hr>
          <h3>Toinen vahvuutesi: ${secondary.title}</h3>
          <p class="lead">${secondary.lead}</p>
          <p>${secondary.meaning}</p>
        `
            : ""
        }

      <div class="action-row">
        <button onclick="window.print()">Tulosta</button>
        <button onclick="location.reload()">Aloita alusta</button>
        <button class="info-circle desktop-only" aria-label="Teoreettinen tausta" onclick="openInfo()">i</button>
            
      </div>


      </div>
    `;
  } catch (e) {
    renderError(e);
  }
}
function openInfo() {
  const box = document.createElement("div");
  box.id = "teacherInfo";
  box.innerHTML = `
  <div class="info-modal">

    <div class="info-header">
      <h2>DuuniMinän tutkimuksellinen perusta</h2>
      <button class="close" onclick="closeInfo()">×</button>
    </div>

    <div class="info-body">

      <h3>1. Persoonallisuus – Big Five</h3>
      <p>
        DuuniMinän rakenne pohjautuu Big Five -malliin, joka on
        kansainvälisesti tutkituin persoonallisuusteoria.
        Ulottuvuudet on käännetty nuoren arkeen:
      </p>

      <ul>
        <li>Agreeableness → Auttaa</li>
        <li>Extraversion → Yhdistää / Vaikuttaa</li>
        <li>Openness → Luoda</li>
        <li>Conscientiousness → Ymmärtää / Turvata / Rakentaa</li>
      </ul>

      <h3>2. Ammatillinen suunta – Holland RIASEC</h3>
      <p>
        Hollandin teoria osoittaa, että ihmiset hakeutuvat
        ammatteihin persoonallisten mieltymysten pohjalta.
        DuuniMinä on tästä nuorisolähtöinen sovellus:
      </p>

      <ul>
        <li>Social → Auttaa / Yhdistää</li>
        <li>Enterprising → Vaikuttaa</li>
        <li>Artistic → Luoda</li>
        <li>Investigative → Ymmärtää</li>
        <li>Realistic → Rakentaa</li>
        <li>Conventional → Turvata</li>
      </ul>

      <h3>3. Sisäinen motivaatio – Deci & Ryan</h3>
      <p>
        Malli nojaa kolmeen perustarpeeseen:
        autonomia, yhteys ja pystyvyys.
        Siksi DuuniMinä puhuu motiiveista,
        ei vain kiinnostuksista.
      </p>

      <h3>4. Nuoren kehitysvaihe</h3>
      <p>
        Työkalu tukee ammatillisen identiteetin rakentumista:
        ei lukitse, vaan rohkaisee kokeilemaan.
      </p>

      <h3>5. Ohjauksellinen perusta</h3>
      <p>
        Sosio-kognitiivinen urateoria korostaa
        minäkäsitystä ja pystyvyysuskomuksia.
        DuuniMinä antaa nuorelle kielen,
        jolla puhua itsestään realistisesti.
      </p>

      <div class="info-footer">
        <strong>Ydinajatus:</strong><br>
        DuuniMinä ei arvioi nuorta – se näyttää,
        missä hän on luontaisesti vahva.
      </div>

    </div>
  </div>`;
  document.body.appendChild(box);
}
function openInfo() {
  const box = document.createElement("div");
  box.id = "teacherInfo";
  box.innerHTML = `
  <div class="info-modal">

    <div class="info-header">
      <h2>DuuniMinän tutkimuksellinen perusta</h2>
      <button class="close" onclick="closeInfo()">×</button>
    </div>

    <div class="info-body">

      <h3>1. Persoonallisuus – Big Five</h3>
      <p>
        DuuniMinän rakenne pohjautuu Big Five -malliin,
        joka on kansainvälisesti tutkituin persoonallisuusteoria.
      </p>

      <ul>
        <li>Agreeableness → Auttaa</li>
        <li>Extraversion → Yhdistää / Vaikuttaa</li>
        <li>Openness → Luoda</li>
        <li>Conscientiousness → Ymmärtää / Turvata / Rakentaa</li>
      </ul>

      <h3>2. Ammatillinen suunta – Holland RIASEC</h3>
      <ul>
        <li>Social → Auttaa / Yhdistää</li>
        <li>Enterprising → Vaikuttaa</li>
        <li>Artistic → Luoda</li>
        <li>Investigative → Ymmärtää</li>
        <li>Realistic → Rakentaa</li>
        <li>Conventional → Turvata</li>
      </ul>

      <h3>3. Sisäinen motivaatio – Deci & Ryan</h3>
      <p>
        Malli nojaa kolmeen perustarpeeseen:
        autonomia, yhteys ja pystyvyys.
      </p>

      <h3>4. Nuoren kehitysvaihe</h3>
      <p>
        Työkalu tukee ammatillisen identiteetin rakentumista –
        ei lukitse vaan rohkaisee kokeilemaan.
      </p>

      <h3>5. Ohjauksellinen perusta</h3>
      <p>
        Sosio-kognitiivinen urateoria korostaa minäkäsitystä
        ja pystyvyysuskomuksia.
      </p>

      <div class="info-footer">
        <strong>Ydinajatus:</strong><br>
        DuuniMinä ei arvioi nuorta – se näyttää,
        missä hän on luontaisesti vahva.
      </div>

    </div>
  </div>`;
  document.body.appendChild(box);
}

function closeInfo() {
  const el = document.getElementById("teacherInfo");
  if (el) el.remove();
}

function closeInfo() {
  document.getElementById("teacherInfo")?.remove();
}
// Tee funktiot varmasti löydettäväksi inline-onclickeille
window.startTest = startTest;
window.setSeed = setSeed;
window.answer = answer;

window.onload = function () {
  const btn = document.getElementById("infoBtn");
  if (btn) btn.style.display = "block";
};
