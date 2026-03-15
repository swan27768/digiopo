window.addEventListener("load", function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || !tehtavat || !tehtavat[id]) {
    document.body.innerHTML = "<p>Tehtävää ei löytynyt.</p>";
    console.error("Tehtävää ei löytynyt:", id);
    return;
  }

  const task = tehtavat[id];
  const storageKey = "digiopo_notes_" + id;

  const title = document.getElementById("taskTitle");
  const instructions = document.getElementById("taskInstructions");
  const notes = document.getElementById("notes");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const backToClass = document.getElementById("backToClass");
  const breadcrumb = document.getElementById("breadcrumb");
  const saveStatus = document.getElementById("saveStatus");
  const taskCategoryTag = document.getElementById("taskCategoryTag");
  const taskClassLabel = document.getElementById("taskClassLabel");

  if (title) {
    title.textContent = task.title;
  }

  if (taskCategoryTag) {
    taskCategoryTag.textContent = task.category;

    if (task.category === "vahvuudet") {
      taskCategoryTag.classList.add("tag-vahvuudet");
    }

    if (task.category === "opiskelu") {
      taskCategoryTag.classList.add("tag-opiskelu");
    }

    if (task.category === "tet") {
      taskCategoryTag.classList.add("tag-tet");
    }
  }

  if (taskClassLabel) {
    taskClassLabel.textContent = task.class + ". luokka";
  }
  if (task.category === "oppiminen") {
    taskCategoryTag.classList.add("tag-oppiminen");
  }

  if (breadcrumb) {
    breadcrumb.textContent =
      "Etusivu → " + task.class + ". luokka → " + task.title;
  }

  if (backToClass) {
    backToClass.href = "sivut/" + task.class + "luokka.html";
    backToClass.textContent = "← Takaisin " + task.class + ". luokan sivulle";
  }

  if (instructions) {
    instructions.innerHTML = "";

    task.instructions.forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      instructions.appendChild(li);
    });
  }

  if (notes) {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      notes.value = saved;
    }
  }

  if (notes) {
    let saveTimer;

    notes.addEventListener("input", function () {
      localStorage.setItem(storageKey, notes.value);

      if (saveStatus) {
        saveStatus.textContent = "Tallennettu automaattisesti";
      }

      clearTimeout(saveTimer);

      saveTimer = setTimeout(function () {
        if (saveStatus) {
          saveStatus.textContent = "";
        }
      }, 1500);
    });
  }

  if (clearBtn && notes) {
    clearBtn.addEventListener("click", function () {
      if (confirm("Tyhjennetäänkö vastaus?")) {
        notes.value = "";
        localStorage.removeItem(storageKey);

        if (saveStatus) {
          saveStatus.textContent = "Vastaus tyhjennetty";
        }
      }
    });
  }

  function lataaWordTiedosto(filename, heading, content) {
    const html =
      "<html><head><meta charset='utf-8'></head><body>" +
      "<h1>" +
      heading +
      "</h1>" +
      "<p>" +
      content.replace(/\n/g, "<br>") +
      "</p>" +
      "</body></html>";

    const blob = new Blob(["\ufeff", html], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  if (downloadBtn && notes) {
    downloadBtn.addEventListener("click", function () {
      const text = notes.value || "";
      const safeFileName = task.title.replace(/[^\wäöåÄÖÅ\- ]/g, "").trim();
      lataaWordTiedosto(safeFileName + ".doc", task.title, text);
    });
  }
});
