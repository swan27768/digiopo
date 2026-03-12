const classNumber = "7";

const sidebar = document.getElementById("classTasks");
const cards = document.getElementById("classCards");

Object.keys(tehtavat).forEach(function (id) {
  const task = tehtavat[id];

  if (task.class === classNumber) {
    /* SIDEBAR LINK */

    const link = document.createElement("a");

    link.href = "../tehtava.html?id=" + id;
    link.textContent = task.title;

    sidebar.appendChild(link);

    /* CARD */

    const card = document.createElement("div");

    card.className = "task-card";

    card.innerHTML = `
<h3>${task.title}</h3>
<p>${task.instructions[0]}</p>
<a class="download-btn" href="../tehtava.html?id=${id}">
Avaa tehtävä →
</a>
`;

    cards.appendChild(card);
  }
});
