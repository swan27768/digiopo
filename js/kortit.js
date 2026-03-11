const container = document.getElementById("taskCards");

Object.keys(tehtavat).forEach(function (id) {
  const task = tehtavat[id];

  const card = document.createElement("a");

  card.className = "course-card";
  card.href = "tehtava.html?id=" + id;

  card.dataset.category = task.category;

  card.innerHTML = `
<h3>${task.title}</h3>
<p>${task.instructions[0]}</p>
<span class="tag">${task.category}</span>
`;

  container.appendChild(card);
});
