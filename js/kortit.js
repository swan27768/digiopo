const taskCardsContainer = document.getElementById("taskCards");

function getCategoryClass(category) {
  if (category === "opiskelu") return "tag-opiskelu";
  if (category === "tet") return "tag-tet";
  return "";
}

function renderTaskCards(filterCategory = "all") {
  if (!taskCardsContainer) return;

  taskCardsContainer.innerHTML = "";

  Object.keys(tehtavat).forEach(function (id) {
    const task = tehtavat[id];

    if (filterCategory !== "all" && task.category !== filterCategory) {
      return;
    }

    const card = document.createElement("a");
    card.className = "course-card";
    card.href = "tehtava.html?id=" + id;
    card.dataset.category = task.category;

    card.innerHTML =
      "<h3>" +
      task.title +
      "</h3>" +
      "<p>" +
      task.instructions[0] +
      "</p>" +
      "<span class='tag " +
      getCategoryClass(task.category) +
      "'>" +
      task.category +
      "</span>";

    taskCardsContainer.appendChild(card);
  });
}

renderTaskCards();
