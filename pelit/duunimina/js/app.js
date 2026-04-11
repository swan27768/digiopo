function showResult() {

  document.getElementById("question").classList.add("hidden");
  const box = document.getElementById("result");
  box.classList.remove("hidden");

  const result = calculateDuuniMina(answers, motiveSeed);
  const main = TYPE_PROFILES[result.primary];
  const secondary = result.secondary ? TYPE_PROFILES[result.secondary] : null;

  const interpretation = buildInterpretation(result.primary, result.secondary);

  box.innerHTML = `
    <div class="result-card">

      <p class="lead">${interpretation}</p>

      <h1>${main.title}</h1>
      <p class="lead">${main.lead}</p>
      <p>${main.meaning}</p>
      <p><b>Lupaus:</b> ${main.promise}</p>

      ${secondary ? `
        <hr>
        <h3>Toinen vahvuutesi: ${secondary.title}</h3>
        <p>${secondary.lead}</p>
        <p>${secondary.meaning}</p>
      ` : ""}

      <div class="action-row no-print">
        <button onclick="window.print()" class="action-btn">Tulosta tulos</button>
        <button onclick="location.reload()" class="action-btn secondary">Aloita alusta</button>
      </div>

    </div>
  `;
}
