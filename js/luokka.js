const classNumber = window.currentClassNumber || "7";

const cards = document.getElementById("classCards");

Object.keys(tehtavat).forEach(function (id) {
  const task = tehtavat[id];

  if (task.class !== classNumber) return;

  const card = document.createElement("a");

  card.className = "course-card";
  card.href = "../tehtava.html?id=" + id;

  card.innerHTML =
    "<h3>" +
    task.title +
    "</h3>" +
    "<p>" +
    task.instructions[0] +
    "</p>" +
    "<span class='tag'>" +
    task.category +
    "</span>";

  cards.appendChild(card);
});
