window.addEventListener("load", function () {
  const searchInput = document.getElementById("taskSearch");
  const resultsBox = document.getElementById("searchResults");

  if (!searchInput || !resultsBox) return;

  let results = [];
  resultsBox.style.display = "none";

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toLowerCase().trim();

    results = [];
    resultsBox.innerHTML = "";

    if (query.length < 2) {
      resultsBox.style.display = "none";
      return;
    }

    Object.keys(tehtavat).forEach(function (id) {
      const task = tehtavat[id];
      const text = (
        task.title +
        " " +
        task.instructions.join(" ")
      ).toLowerCase();

      if (text.includes(query)) {
        results.push(id);

        const item = document.createElement("div");
        item.className = "result-item";
        item.textContent = task.title;

        item.addEventListener("click", function () {
          window.location.href = "tehtava.html?id=" + id;
        });

        resultsBox.appendChild(item);
      }
    });

    resultsBox.style.display = results.length > 0 ? "block" : "none";
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && results.length > 0) {
      window.location.href = "tehtava.html?id=" + results[0];
    }
  });
});
