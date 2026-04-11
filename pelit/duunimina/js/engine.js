// ============================
// DUUNIMINÄ ENGINE 2.0
// ============================

// 24 väittämän pistejakauma motiiveihin
const DUUNIMINA_TYPES = window.DUUNIMINA_TYPES;
window.QUESTION_MAP = {
  1: "Auttaa",
  2: "Turvata",
  3: "Ymmärtää",
  4: "Luoda",

  5: "Vaikuttaa",
  6: "Yhdistää",
  7: "Ymmärtää",
  8: "Luoda",

  9: "Vaikuttaa",
 10: "Turvata",
 11: "Auttaa",
 12: "Yhdistää",

 13: "Luoda",
 14: "Ymmärtää",
 15: "Vaikuttaa",
 16: "Turvata",

 17: "Auttaa",
 18: "Yhdistää",
 19: "Ymmärtää",
 20: "Luoda",

 21: "Vaikuttaa",
 22: "Turvata",
 23: "Auttaa",
 24: "Yhdistää"
};
window.TOTAL_QUESTIONS = 24;
window.MOTIVE_SEED_BONUS = 2;

// ============================
// PÄÄLASKENTA
// ============================

window.calculateDuuniMina = function(answers, motiveSeed = null) {

  const scores = {
    Auttaa: 0,
    Yhdistää: 0,
    Vaikuttaa: 0,
    Luoda: 0,
    Ymmärtää: 0,
    Turvata: 0
  };

  // Summaa vastaukset (1–24 aina varmasti)
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    const value = Number(answers[i] || 0);
    const motive = QUESTION_MAP[i];
    scores[motive] += value;
  }

  const total = Object.values(scores).reduce((a,b)=>a+b,0);
  const average = total / TOTAL_QUESTIONS;

  // ETSIJÄ-tila
  if (average < 1.4) {
    return { primary: "Etsijä", secondary: null };
  }

  // Q1 ohjaava bonus
  if (motiveSeed && scores[motiveSeed] !== undefined) {
    scores[motiveSeed] += MOTIVE_SEED_BONUS;
  }

  const ordered = Object.entries(scores).sort((a,b)=>b[1]-a[1]);

  const primaryMotive   = ordered[0][0];
  const secondaryMotive = ordered[1][0];

  const primary = Object.keys(window.DUUNIMINA_TYPES)
    .find(k => DUUNIMINA_TYPES[k].motive === primaryMotive);

  const secondary =
    ordered[1][1] >= ordered[0][1] * 0.7
      ? Object.keys(window.DUUNIMINA_TYPES).find(k => DUUNIMINA_TYPES[k].motive === secondaryMotive)
      : null;

  return { primary, secondary };
};

window.calculateDuuniMina = calculateDuuniMina;


