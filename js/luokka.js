const classNumber = window.currentClassNumber || "7";
const basePath = window.currentBasePath || "";

const sidebar = document.getElementById("classTasks");
const cards = document.getElementById("classCards");

if (sidebar && cards) {
  Object.keys(tehtavat).forEach(function (id) {
    const task = tehtavat[id];

    if (task.class !== classNumber) return;

    const link = document.createElement("a");
    link.href = basePath + "tehtava.html?id=" + id;
    link.textContent = task.title;
    sidebar.appendChild(link);

    const card = document.createElement("div");
    card.className = "task-card";

    card.innerHTML =
      "<h3>" +
      task.title +
      "</h3>" +
      "<p>" +
      task.instructions[0] +
      "</p>" +
      "<a class='download-btn' href='" +
      basePath +
      "tehtava.html?id=" +
      id +
      "'>Avaa tehtävä →</a>";

    cards.appendChild(card);
  });
}
