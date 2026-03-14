const amisVocabulary = [
  {
    term: "Ammatillinen koulutus",
    definition: "Koulutus, jossa opiskellaan ammatti.",
  },
  {
    term: "Ammatillinen perustutkinto",
    definition: "Tutkinto, jossa opitaan ammatin perustaidot.",
  },
  {
    term: "Ammattitutkinto",
    definition:
      "Tutkinto henkilölle, jolla on jo alan osaamista tai työkokemusta.",
  },
  {
    term: "Erikoisammattitutkinto",
    definition: "Tutkinto kokeneelle ammattilaiselle.",
  },
  {
    term: "Tutkinto",
    definition: "Koulutuksen kokonaisuus, joka antaa pätevyyden ammattiin.",
  },
  {
    term: "Tutkinnon osa",
    definition: "Tutkinnon yksi osa tai opintokokonaisuus.",
  },
  {
    term: "Osaamispiste (osp)",
    definition: "Mitta, joka kertoo opintojen laajuuden.",
  },
  { term: "Osaaminen", definition: "Tiedot ja taidot, jotka opiskelija osaa." },
  {
    term: "Näyttö",
    definition: "Tilanne, jossa opiskelija näyttää osaamisensa työtehtävissä.",
  },
  {
    term: "Oppimisympäristö",
    definition:
      "Paikka tai tilanne, jossa opitaan (esim. koulu tai työpaikka).",
  },
  {
    term: "Työpaikalla oppiminen",
    definition: "Opiskelua oikealla työpaikalla.",
  },
  { term: "Oppisopimus", definition: "Opiskelua työpaikalla työsuhteessa." },
  {
    term: "Koulutussopimus",
    definition: "Opiskelua työpaikalla ilman työsuhdetta.",
  },
  {
    term: "HOKS",
    definition: "Henkilökohtainen suunnitelma opiskelijan opinnoista.",
  },
  {
    term: "Ohjaaja / opettaja",
    definition: "Henkilö, joka opettaa ja auttaa opiskelijaa.",
  },
  { term: "Opiskelija", definition: "Henkilö, joka opiskelee koulussa." },
  {
    term: "Valinnainen tutkinnon osa",
    definition: "Tutkinnon osa, jonka opiskelija voi valita itse.",
  },
  {
    term: "Pakollinen tutkinnon osa",
    definition: "Tutkinnon osa, joka kaikkien täytyy suorittaa.",
  },
  {
    term: "Yhteiset tutkinnon osat (YTO)",
    definition: "Yleisiä opintoja, kuten kieliä ja matematiikkaa.",
  },
  { term: "Arviointi", definition: "Opettaja arvioi opiskelijan osaamisen." },
  {
    term: "Aiempi osaaminen",
    definition: "Tiedot ja taidot, jotka opiskelija osaa jo.",
  },
  {
    term: "Osaamisen tunnistaminen",
    definition: "Selvitetään, mitä opiskelija osaa jo.",
  },
  {
    term: "Osaamisen tunnustaminen",
    definition: "Aiempi osaaminen hyväksytään osaksi opintoja.",
  },
  { term: "Opintopolku", definition: "Opiskelijan oma reitti opinnoissa." },
  {
    term: "Työpaikkaohjaaja",
    definition: "Työpaikan henkilö, joka ohjaa opiskelijaa.",
  },
  { term: "Arvosana", definition: "Numero tai arvio opiskelijan osaamisesta." },
  { term: "Jatkuva haku", definition: "Koulutukseen voi hakea ympäri vuoden." },
  { term: "Yhteishaku", definition: "Valtakunnallinen haku koulutuksiin." },
  {
    term: "Erityinen tuki",
    definition: "Lisätuki opiskelijalle, joka tarvitsee apua opinnoissa.",
  },
  {
    term: "Erityisen tuen suunnitelma",
    definition: "Suunnitelma opiskelijan tukemiseksi.",
  },
];

const AMIS_STORAGE_KEY = "digiopo-amissanasto-stats";

let amisCurrentQuestion = 0;
let amisScore = 0;
let amisQuestions = [];
let amisAnswered = false;
let amisStats = {
  gamesPlayed: 0,
  totalScore: 0,
};

function amisShuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function amisLoadStats() {
  const raw = localStorage.getItem(AMIS_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    amisStats.gamesPlayed = Number(parsed.gamesPlayed) || 0;
    amisStats.totalScore = Number(parsed.totalScore) || 0;
  } catch (error) {
    console.warn("Amissanaston tallennettu data oli virheellinen.");
  }
}

function amisSaveStats() {
  localStorage.setItem(AMIS_STORAGE_KEY, JSON.stringify(amisStats));
}

function amisUpdateStartStats() {
  const gamesEl = document.getElementById("stats-games");
  const totalEl = document.getElementById("stats-total");
  const goalEl = document.getElementById("stats-goal");

  if (gamesEl) gamesEl.textContent = amisStats.gamesPlayed;
  if (totalEl) totalEl.textContent = amisStats.totalScore;
  if (goalEl) goalEl.textContent = "10";
}

function amisGenerateQuestions() {
  const shuffled = amisShuffleArray(amisVocabulary);
  const selected = shuffled.slice(0, 10);

  return selected.map((correct) => {
    const wrongOptions = amisShuffleArray(
      amisVocabulary.filter((item) => item.term !== correct.term),
    ).slice(0, 3);

    const options = amisShuffleArray([correct, ...wrongOptions]);

    return {
      definition: correct.definition,
      correctTerm: correct.term,
      options: options.map((item) => item.term),
    };
  });
}

function amisShowStart() {
  document.getElementById("start-screen")?.classList.remove("is-hidden");
  document.getElementById("game-screen")?.classList.add("is-hidden");
  document.getElementById("result-screen")?.classList.add("is-hidden");
  amisUpdateStartStats();
}

function amisShowGame() {
  document.getElementById("start-screen")?.classList.add("is-hidden");
  document.getElementById("game-screen")?.classList.remove("is-hidden");
  document.getElementById("result-screen")?.classList.add("is-hidden");
}

function amisShowResult() {
  document.getElementById("start-screen")?.classList.add("is-hidden");
  document.getElementById("game-screen")?.classList.add("is-hidden");
  document.getElementById("result-screen")?.classList.remove("is-hidden");

  const finalScoreEl = document.getElementById("final-score");
  const resultMessageEl = document.getElementById("result-message");
  const resultEmojiEl = document.getElementById("result-emoji");
  const gamesCountEl = document.getElementById("result-games-count");

  if (finalScoreEl) finalScoreEl.textContent = `${amisScore}/10`;

  amisStats.gamesPlayed += 1;
  amisStats.totalScore += amisScore;
  amisSaveStats();
  amisUpdateStartStats();

  if (gamesCountEl) gamesCountEl.textContent = amisStats.gamesPlayed;

  if (amisScore === 10) {
    if (resultEmojiEl) resultEmojiEl.textContent = "🏆";
    if (resultMessageEl)
      resultMessageEl.textContent =
        "Täydellinen tulos! Olet ammatillisen koulutuksen sanaston mestari!";
  } else if (amisScore >= 8) {
    if (resultEmojiEl) resultEmojiEl.textContent = "🎉";
    if (resultMessageEl)
      resultMessageEl.textContent =
        "Erinomaista! Hallitset termit todella hyvin!";
  } else if (amisScore >= 6) {
    if (resultEmojiEl) resultEmojiEl.textContent = "👍";
    if (resultMessageEl)
      resultMessageEl.textContent =
        "Hyvä suoritus! Vielä vähän harjoittelua ja osaat kaiken.";
  } else if (amisScore >= 4) {
    if (resultEmojiEl) resultEmojiEl.textContent = "📚";
    if (resultMessageEl)
      resultMessageEl.textContent =
        "Ihan hyvä alku! Kertaa termejä ja kokeile uudestaan.";
  } else {
    if (resultEmojiEl) resultEmojiEl.textContent = "💪";
    if (resultMessageEl)
      resultMessageEl.textContent = "Hyvä yritys! Harjoitus tekee mestarin.";
  }
}

function amisStartGame() {
  amisCurrentQuestion = 0;
  amisScore = 0;
  amisQuestions = amisGenerateQuestions();
  amisAnswered = false;

  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.textContent = "0";

  amisShowGame();
  amisDisplayQuestion();
}

function amisDisplayQuestion() {
  const question = amisQuestions[amisCurrentQuestion];
  if (!question) return;

  amisAnswered = false;

  const counterEl = document.getElementById("question-counter");
  const progressEl = document.getElementById("progress-bar");
  const definitionEl = document.getElementById("definition");
  const feedbackEl = document.getElementById("feedback");
  const optionsEl = document.getElementById("options");

  if (counterEl) counterEl.textContent = `${amisCurrentQuestion + 1}/10`;
  if (progressEl) progressEl.style.width = `${(amisCurrentQuestion + 1) * 10}%`;
  if (definitionEl) definitionEl.textContent = question.definition;
  if (feedbackEl) feedbackEl.classList.add("is-hidden");
  if (!optionsEl) return;

  optionsEl.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "amissanasto-option-btn";
    button.textContent = option;
    button.addEventListener("click", () => amisSelectAnswer(option, button));
    optionsEl.appendChild(button);
  });
}

function amisSelectAnswer(selected, clickedButton) {
  if (amisAnswered) return;
  amisAnswered = true;

  const question = amisQuestions[amisCurrentQuestion];
  const isCorrect = selected === question.correctTerm;
  const buttons = document.querySelectorAll(".amissanasto-option-btn");
  const feedback = document.getElementById("feedback");
  const feedbackContent = document.getElementById("feedback-content");
  const scoreEl = document.getElementById("score");

  buttons.forEach((button) => {
    button.disabled = true;

    if (button.textContent === question.correctTerm) {
      button.classList.add("is-correct");
    } else if (button === clickedButton && !isCorrect) {
      button.classList.add("is-wrong");
    } else {
      button.classList.add("is-muted");
    }
  });

  if (isCorrect) {
    amisScore += 1;
    if (scoreEl) scoreEl.textContent = String(amisScore);

    if (feedbackContent) {
      feedbackContent.className = "amissanasto-feedback-content is-success";
      feedbackContent.textContent = "✓ Oikein! Hienoa!";
    }
  } else {
    if (feedbackContent) {
      feedbackContent.className = "amissanasto-feedback-content is-error";
      feedbackContent.textContent = `✗ Väärin! Oikea vastaus: ${question.correctTerm}`;
    }
  }

  feedback?.classList.remove("is-hidden");

  setTimeout(() => {
    amisCurrentQuestion += 1;

    if (amisCurrentQuestion < 10) {
      amisDisplayQuestion();
    } else {
      amisShowResult();
    }
  }, 1800);
}

function initAmissanasto() {
  amisLoadStats();
  amisUpdateStartStats();

  document
    .getElementById("start-btn")
    ?.addEventListener("click", amisStartGame);
  document
    .getElementById("play-again-btn")
    ?.addEventListener("click", amisStartGame);
  document
    .getElementById("back-to-start-btn")
    ?.addEventListener("click", amisShowStart);

  amisShowStart();
}

document.addEventListener("DOMContentLoaded", initAmissanasto);
