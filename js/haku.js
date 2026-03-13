window.addEventListener("load", function () {
  const searchInput = document.getElementById("taskSearch");
  const resultsBox = document.getElementById("searchResults");

  if (!searchInput || !resultsBox) return;

  let results = [];
  let selectedIndex = -1;

  resultsBox.style.display = "none";

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toLowerCase();

    resultsBox.innerHTML = "";
    results = [];
    selectedIndex = -1;

    if (query.length < 2) {
      resultsBox.style.display = "none";
      return;
    }

    Object.keys(tehtavat).forEach(function (id) {
      const task = tehtavat[id];

      const text =
        task.title.toLowerCase() + task.instructions.join(" ").toLowerCase();

      if (text.includes(query)) {
        results.push(id);

        const item = document.createElement("div");

        item.className = "result-item";
        item.textContent = task.title;

        item.onclick = function () {
          window.location.href = "tehtava.html?id=" + id;
        };

        resultsBox.appendChild(item);
      }
    });

    resultsBox.style.display = results.length > 0 ? "block" : "none";
  });

  searchInput.addEventListener("keydown", function (e) {
    const items = resultsBox.querySelectorAll(".result-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();

      if (selectedIndex < items.length - 1) {
        selectedIndex++;
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      if (selectedIndex > 0) {
        selectedIndex--;
      }
    }

    /* ENTER */

    if (e.key === "Enter" && results.length > 0) {
      const id = results[selectedIndex >= 0 ? selectedIndex : 0];

      window.location.href = "tehtava.html?id=" + id;
    }

    /* korosta valittu */

    items.forEach(function (item) {
      item.classList.remove("selected");
    });

    if (selectedIndex >= 0 && items[selectedIndex]) {
      items[selectedIndex].classList.add("selected");
    }
  });

  /* SULJE HAKU */

  document.addEventListener("click", function (event) {
    const searchBox = document.querySelector(".header-search");

    if (!searchBox.contains(event.target)) {
      resultsBox.style.display = "none";
    }
  });
});
