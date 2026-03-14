const vocabularyData = [
  {
    id: 1,
    term: "Abiturientti",
    definition: "Lukion 3. tai 4. vuosikurssin opiskelija.",
  },
  {
    id: 2,
    term: "Digilukiseula",
    definition:
      "Sähköisesti tehtävä lukiseula, jolla selvitetään mahdollisia lukivaikeuksia ja tarvittavia tukitoimia.",
  },
  {
    id: 3,
    term: "Erityisopettaja",
    definition:
      "Opettaja, joka tukee opiskelijaa oppimisvaikeuksissa ja opiskeluun liittyvissä ongelmissa.",
  },
  {
    id: 4,
    term: "Formatiivinen arviointi",
    definition:
      "Oppimisen aikana tapahtuva arviointi, joka tukee ja ohjaa oppimisprosessia.",
  },
  {
    id: 5,
    term: "Itsearviointi",
    definition:
      "Oman oppimisen ja työskentelyn arvioimista sekä omien tavoitteiden tarkastelua.",
  },
  {
    id: 7,
    term: "K-merkintä",
    definition: "Keskeytetty suoritus; moduuli täytyy suorittaa uudelleen.",
  },
  {
    id: 8,
    term: "Kuraattori",
    definition:
      "Koulun sosiaalityöntekijä, joka auttaa esimerkiksi motivaatio-, poissaolo- tai ihmissuhdeongelmissa.",
  },
  {
    id: 9,
    term: "Laaja-alainen osaaminen",
    definition:
      "Kaikkia oppiaineita yhdistävä kokonaisuus, joka sisältää tietoja, taitoja ja arvoja.",
  },
  {
    id: 10,
    term: "Lukiodiplomi",
    definition:
      "Taito- ja taideaineissa suoritettava erillinen näyttö erityisestä osaamisesta.",
  },
  {
    id: 11,
    term: "Moduuli",
    definition: "Oppiaineen osa, josta opintojaksot rakentuvat.",
  },
  {
    id: 12,
    term: "Opintopiste",
    definition:
      "Mittaa opintojakson työmäärää; 1 opintopiste ≈ noin 14,5 tuntia työtä.",
  },
  {
    id: 13,
    term: "Opintojakso",
    definition:
      "Lukio-opintojen kokonaisuus, joka voi sisältää yhden tai useamman moduulin.",
  },
  {
    id: 14,
    term: "Opinto-ohjaaja (opo)",
    definition:
      "Henkilö, joka auttaa opintojen suunnittelussa sekä jatko-opintoihin ja työelämään liittyvissä kysymyksissä.",
  },
  {
    id: 15,
    term: "Opinto-opas",
    definition:
      "Opas, jossa on tietoa lukio-opinnoista, ohjeista ja aikatauluista.",
  },
  {
    id: 16,
    term: "Opintosuoritusote",
    definition:
      "Kooste kaikista suoritetuista opinnoista ja niiden arvosanoista.",
  },
  {
    id: 17,
    term: "Opintotarjotin",
    definition:
      "Järjestelmä tai näkymä, jossa näkyvät kaikki tarjolla olevat opinnot.",
  },
  {
    id: 18,
    term: "OPKH",
    definition:
      "Opiskelijoiden edustajaryhmä, joka toimii opiskelijoiden ja henkilökunnan välillä.",
  },
  {
    id: 19,
    term: "Palkki",
    definition:
      "Opintotarjottimen rivi, jossa näkyvät samaan aikaan pidettävät opintojaksot.",
  },
  {
    id: 20,
    term: "Periodi",
    definition: "Lukuvuoden noin seitsemän viikon mittainen jakso.",
  },
  {
    id: 21,
    term: "Preliminääri",
    definition: "Harjoituskoe ennen ylioppilaskirjoituksia.",
  },
  {
    id: 22,
    term: "Psykologi",
    definition:
      "Koulupsykologi, jolta saa apua esimerkiksi stressiin tai mielialaan liittyvissä asioissa.",
  },
  {
    id: 23,
    term: "Päättötodistus",
    definition:
      "Lukion päättyessä saatava todistus opintojaksojen arvosanoista.",
  },
  {
    id: 24,
    term: "Päätösviikko",
    definition:
      "Periodin lopussa oleva viikko, jolloin järjestetään kokeita ja muuta arviointia.",
  },
  {
    id: 25,
    term: "Reaaliaine",
    definition:
      "Oppiaineet, jotka eivät ole matematiikkaa tai kieliä (esim. historia, biologia).",
  },
  {
    id: 26,
    term: "Ryhmänohjaaja (RO)",
    definition:
      "Opettaja, joka ohjaa opiskelijan kotiryhmää ja seuraa opintojen etenemistä.",
  },
  {
    id: 27,
    term: "Summatiivinen arviointi",
    definition:
      "Oppimisen lopussa tehtävä kokoava arviointi (esim. kokeet ja esseet).",
  },
  {
    id: 28,
    term: "Tutor",
    definition:
      "Vanhemman vuosikurssin opiskelija, joka auttaa uusia opiskelijoita lukion alussa.",
  },
  {
    id: 29,
    term: "Vertaisarviointi",
    definition: "Toisen opiskelijan tekemä arviointi opiskelijan oppimisesta.",
  },
  {
    id: 30,
    term: "Wilma",
    definition:
      "Oppilashallintojärjestelmä, jossa tehdään opintovalinnat, viestitään ja seurataan opintoja.",
  },
  {
    id: 31,
    term: "Ylioppilastutkinto",
    definition:
      "Lukio-opintojen lopussa suoritettava valtakunnallinen koe useassa oppiaineessa.",
  },
  {
    id: 32,
    term: "Z-merkintä",
    definition:
      "Kesken jäänyt suoritus; puuttuvat osat pitää suorittaa myöhemmin.",
  },
];

const STORAGE_KEY = "digiopo-sanastopeli";

let gameState = {
  currentSet: [],
  selectedTerm: null,
  selectedDef: null,
  matchedPairs: [],
  score: 0,
  attempts: 0,
  hintsLeft: 3,
  totalPairs: 6,
  totalScore: 0,
  gamesPlayed: 0,
};

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function getRandomSubset(array, count) {
  return shuffleArray(array).slice(0, count);
}

function saveStats() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      totalScore: gameState.totalScore,
      gamesPlayed: gameState.gamesPlayed,
    }),
  );
}

function loadStats() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    gameState.totalScore = Number(saved.totalScore) || 0;
    gameState.gamesPlayed = Number(saved.gamesPlayed) || 0;
  } catch (error) {
    console.warn("Sanastopelin tallennettu data oli virheellinen.");
  }
}

function initGame() {
  hideVictoryModal();

  if (gameState.matchedPairs.length === gameState.totalPairs) {
    gameState.totalScore += gameState.score;
    gameState.gamesPlayed += 1;
    saveStats();
  }

  gameState.currentSet = getRandomSubset(vocabularyData, gameState.totalPairs);
  gameState.selectedTerm = null;
  gameState.selectedDef = null;
  gameState.matchedPairs = [];
  gameState.score = 0;
  gameState.attempts = 0;
  gameState.hintsLeft = 3;

  renderGame();
  updateUI();
}

function renderGame() {
  const termsContainer = document.getElementById("terms-container");
  const definitionsContainer = document.getElementById("definitions-container");

  if (!termsContainer || !definitionsContainer) return;

  const shuffledTerms = shuffleArray(gameState.currentSet);
  const shuffledDefinitions = shuffleArray(gameState.currentSet);

  termsContainer.innerHTML = shuffledTerms
    .map(
      (item) => `
    <button
      class="sanastopeli-card term-card"
      type="button"
      data-id="${item.id}"
      data-type="term"
      aria-label="Termi: ${item.term}"
    >
      <strong>${item.term}</strong>
    </button>
  `,
    )
    .join("");

  definitionsContainer.innerHTML = shuffledDefinitions
    .map(
      (item) => `
    <button
      class="sanastopeli-card def-card"
      type="button"
      data-id="${item.id}"
      data-type="def"
      aria-label="Määritelmä: ${item.definition}"
    >
      <p>${item.definition}</p>
    </button>
  `,
    )
    .join("");

  document.querySelectorAll('[data-type="term"]').forEach((card) => {
    card.addEventListener("click", () => handleCardClick(card, "term"));
  });

  document.querySelectorAll('[data-type="def"]').forEach((card) => {
    card.addEventListener("click", () => handleCardClick(card, "def"));
  });
}

function clearSelection(type) {
  document.querySelectorAll(`[data-type="${type}"]`).forEach((card) => {
    card.classList.remove("card-selected");
  });
}

function clearHintHighlights() {
  document.querySelectorAll(".hint-highlight").forEach((card) => {
    card.classList.remove("hint-highlight");
  });
}

function handleCardClick(card, type) {
  if (card.classList.contains("matched")) return;

  clearHintHighlights();

  const id = Number(card.dataset.id);

  if (type === "term") {
    clearSelection("term");
    gameState.selectedTerm = id;
    card.classList.add("card-selected");
    return;
  }

  if (gameState.selectedTerm === null) {
    showFeedback("Valitse ensin termi.", "warning");
    return;
  }

  clearSelection("def");
  gameState.selectedDef = id;
  card.classList.add("card-selected");

  checkMatch();
}

function checkMatch() {
  gameState.attempts += 1;

  const termCard = document.querySelector(
    `[data-type="term"][data-id="${gameState.selectedTerm}"]`,
  );
  const defCard = document.querySelector(
    `[data-type="def"][data-id="${gameState.selectedDef}"]`,
  );

  if (!termCard || !defCard) return;

  if (gameState.selectedTerm === gameState.selectedDef) {
    gameState.matchedPairs.push(gameState.selectedTerm);
    gameState.score += 100;

    termCard.classList.remove("card-selected");
    defCard.classList.remove("card-selected");
    termCard.classList.add("card-correct", "matched");
    defCard.classList.add("card-correct", "matched");

    showFeedback("Oikein! +100 pistettä", "success");
    createConfetti(16);

    if (gameState.matchedPairs.length === gameState.totalPairs) {
      setTimeout(showVictory, 900);
    }
  } else {
    gameState.score = Math.max(0, gameState.score - 20);

    termCard.classList.add("card-wrong");
    defCard.classList.add("card-wrong");

    showFeedback("Väärin! -20 pistettä", "error");

    setTimeout(() => {
      termCard.classList.remove("card-wrong", "card-selected");
      defCard.classList.remove("card-wrong", "card-selected");
    }, 450);
  }

  gameState.selectedTerm = null;
  gameState.selectedDef = null;
  updateUI();
}

function updateUI() {
  const currentScore = document.getElementById("current-score");
  const totalScore = document.getElementById("total-score");
  const matches = document.getElementById("matches");
  const hintsLeft = document.getElementById("hints-left");
  const progressBar = document.getElementById("progress-bar");
  const hintBtn = document.getElementById("hint-btn");

  if (currentScore) currentScore.textContent = gameState.score;
  if (totalScore) totalScore.textContent = gameState.totalScore;
  if (matches)
    matches.textContent = `${gameState.matchedPairs.length}/${gameState.totalPairs}`;
  if (hintsLeft) hintsLeft.textContent = gameState.hintsLeft;
  if (progressBar) {
    progressBar.style.width = `${(gameState.matchedPairs.length / gameState.totalPairs) * 100}%`;
  }
  if (hintBtn) {
    hintBtn.disabled = gameState.hintsLeft <= 0;
  }
}

function showFeedback(message, type) {
  const feedback = document.getElementById("feedback");
  if (!feedback) return;

  feedback.className = `sanastopeli-feedback ${type} show`;
  feedback.textContent = message;

  setTimeout(() => {
    feedback.classList.remove("show");
  }, 1800);
}

function useHint() {
  if (gameState.hintsLeft <= 0) return;

  const unmatched = gameState.currentSet.filter(
    (item) => !gameState.matchedPairs.includes(item.id),
  );
  if (!unmatched.length) return;

  const hintItem = unmatched[Math.floor(Math.random() * unmatched.length)];

  const termCard = document.querySelector(
    `[data-type="term"][data-id="${hintItem.id}"]`,
  );
  const defCard = document.querySelector(
    `[data-type="def"][data-id="${hintItem.id}"]`,
  );

  if (!termCard || !defCard) return;

  termCard.classList.add("hint-highlight");
  defCard.classList.add("hint-highlight");

  gameState.hintsLeft -= 1;
  gameState.score = Math.max(0, gameState.score - 50);

  showFeedback("Vinkki näytetty -50 pistettä", "info");
  updateUI();

  setTimeout(() => {
    termCard.classList.remove("hint-highlight");
    defCard.classList.remove("hint-highlight");
  }, 2800);
}

function shuffleCards() {
  const termsContainer = document.getElementById("terms-container");
  const definitionsContainer = document.getElementById("definitions-container");

  if (!termsContainer || !definitionsContainer) return;

  const unmatchedTerms = [...termsContainer.children].filter(
    (card) => !card.classList.contains("matched"),
  );
  const unmatchedDefinitions = [...definitionsContainer.children].filter(
    (card) => !card.classList.contains("matched"),
  );

  shuffleArray(unmatchedTerms).forEach((card) =>
    termsContainer.appendChild(card),
  );
  shuffleArray(unmatchedDefinitions).forEach((card) =>
    definitionsContainer.appendChild(card),
  );

  clearSelection("term");
  clearSelection("def");
  clearHintHighlights();

  gameState.selectedTerm = null;
  gameState.selectedDef = null;

  showFeedback("Kortit sekoitettu.", "info");
}

function createConfetti(amount = 20) {
  const colors = ["#fbbf24", "#22c55e", "#ec4899", "#6366f1", "#f97316"];

  for (let i = 0; i < amount; i += 1) {
    const confetti = document.createElement("div");
    confetti.className = "sanastopeli-confetti";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.4}s`;
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 3200);
  }
}

function showVictory() {
  const accuracy =
    gameState.attempts > 0
      ? Math.round((gameState.totalPairs / gameState.attempts) * 100)
      : 100;

  const finalScore = document.getElementById("final-score");
  const finalAccuracy = document.getElementById("final-accuracy");
  const modal = document.getElementById("victory-modal");

  if (finalScore) finalScore.textContent = gameState.score;
  if (finalAccuracy) finalAccuracy.textContent = `${accuracy}%`;

  if (modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  createConfetti(48);
}

function hideVictoryModal() {
  const modal = document.getElementById("victory-modal");
  if (!modal) return;

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function initSanastopeli() {
  const hintBtn = document.getElementById("hint-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");
  const playAgainBtn = document.getElementById("play-again-btn");

  if (hintBtn) hintBtn.addEventListener("click", useHint);
  if (shuffleBtn) shuffleBtn.addEventListener("click", shuffleCards);
  if (playAgainBtn) playAgainBtn.addEventListener("click", initGame);

  loadStats();
  updateUI();
  initGame();
}

document.addEventListener("DOMContentLoaded", initSanastopeli);
