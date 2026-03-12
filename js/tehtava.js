console.log("tehtava.js käynnistyi");

window.addEventListener("load", function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  console.log("ID:", id);
  console.log("tehtavat:", tehtavat);

  if (!id || !tehtavat || !tehtavat[id]) {
    console.error("Tehtävää ei löytynyt:", id);
    return;
  }

  const task = tehtavat[id];

  /* HAE HTML ELEMENTIT */

  const title = document.getElementById("taskTitle");
  const instructions = document.getElementById("taskInstructions");
  const notes = document.getElementById("notes");

  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");

  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  const breadcrumb = document.getElementById("breadcrumb");
  const saveStatus = document.getElementById("saveStatus");

  const taskCategoryTag = document.getElementById("taskCategoryTag");
  const taskClassLabel = document.getElementById("taskClassLabel");

  const pdfLink = document.getElementById("pdfLink");

  /* TEHTÄVÄN TIEDOT */

  if (title) title.textContent = task.title;

  if (pdfLink) pdfLink.href = task.pdf;

  if (taskCategoryTag) {
    taskCategoryTag.textContent = task.category;

    if (task.category === "opiskelu")
      taskCategoryTag.classList.add("tag-opiskelu");

    if (task.category === "tet") taskCategoryTag.classList.add("tag-tet");
  }

  if (taskClassLabel) taskClassLabel.textContent = task.class + ". luokka";

  if (breadcrumb)
    breadcrumb.textContent =
      "Etusivu → " + task.class + ". luokka → " + task.title;

  /* OHJEET */

  if (instructions) {
    instructions.innerHTML = "";

    task.instructions.forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      instructions.appendChild(li);
    });
  }

  /* AUTOMAATTINEN TALLENNUS */

  const storageKey = "digiopo_notes_" + id;

  if (notes) {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      notes.value = saved;
    }

    let saveTimer;

    notes.addEventListener("input", function () {
      localStorage.setItem(storageKey, notes.value);

      if (saveStatus) {
        saveStatus.textContent = "Tallennettu automaattisesti";
      }

      clearTimeout(saveTimer);

      saveTimer = setTimeout(function () {
        if (saveStatus) saveStatus.textContent = "";
      }, 1500);
    });
  }

  /* TYHJENNÄ */

  if (clearBtn && notes) {
    clearBtn.addEventListener("click", function () {
      if (confirm("Tyhjennetäänkö vastaus?")) {
        notes.value = "";
        localStorage.removeItem(storageKey);

        if (saveStatus) saveStatus.textContent = "Vastaus tyhjennetty";
      }
    });
  }

  /* WORD LATAUS */

  if (downloadBtn && notes) {
    downloadBtn.addEventListener("click", function () {
      const text = notes.value || "";

      const html =
        "<html><head><meta charset='utf-8'></head><body>" +
        "<h1>" +
        task.title +
        "</h1>" +
        "<p>" +
        text.replace(/\n/g, "<br>") +
        "</p>" +
        "</body></html>";

      const blob = new Blob(["\ufeff", html], {
        type: "application/msword",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = task.title + ".doc";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    });
  }

  /* SIVUNAVIGAATIO */

  if (prevBtn && nextBtn && window.tehtavaJarjestys) {
    const index = tehtavaJarjestys.indexOf(id);

    if (index > 0) {
      const prevId = tehtavaJarjestys[index - 1];

      prevBtn.href = "tehtava.html?id=" + prevId;
      prevBtn.textContent = "← " + tehtavat[prevId].title;
    } else {
      prevBtn.style.visibility = "hidden";
    }

    if (index < tehtavaJarjestys.length - 1) {
      const nextId = tehtavaJarjestys[index + 1];

      nextBtn.href = "tehtava.html?id=" + nextId;
      nextBtn.textContent = tehtavat[nextId].title + " →";
    } else {
      nextBtn.style.visibility = "hidden";
    }
  }
});
