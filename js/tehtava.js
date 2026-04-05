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
    if (task.category === "vahvuudet")
      taskCategoryTag.classList.add("tag-vahvuudet");
    if (task.category === "opiskelu")
      taskCategoryTag.classList.add("tag-opiskelu");
    if (task.category === "tet") taskCategoryTag.classList.add("tag-tet");
    if (task.category === "oppiminen")
      taskCategoryTag.classList.add("tag-oppiminen");
    if (task.category === "keskustelu")
      taskCategoryTag.classList.add("tag-interactive");
    if (task.category === "urat") taskCategoryTag.classList.add("tag-urat");
  }

  if (taskClassLabel) {
    taskClassLabel.textContent = task.class + ". luokka";
  }

  if (breadcrumb) {
    breadcrumb.textContent =
      "Etusivu → " + task.class + ". luokka → " + task.title;
  }

  if (backToClass) {
    backToClass.href = "sivut/" + task.class + "luokka.html";
    backToClass.textContent = "← Takaisin " + task.class + ". luokan sivulle";
  }

  // ── Keskustelu-tyyppi: näytetään kysymykset ja vinkit, ei kirjoituskenttää ──
  if (task.tyyppi === "keskustelu") {
    if (instructions) {
      instructions.innerHTML = "";

      // Kesto-pilli
      if (task.kesto) {
        const kesto = document.createElement("p");
        kesto.style.cssText =
          "display:inline-block;background:#ede9fe;color:#4c1d95;" +
          "padding:4px 12px;border-radius:999px;font-size:13px;" +
          "font-weight:600;margin-bottom:16px;";
        kesto.textContent = "⏱ " + task.kesto;
        instructions.appendChild(kesto);
      }

      // Keskustelukysymykset
      if (task.kysymykset && task.kysymykset.length) {
        const h = document.createElement("h3");
        h.textContent = "Keskustelukysymykset";
        h.style.cssText = "margin-top:0;margin-bottom:10px;color:#3b0764;";
        instructions.appendChild(h);

        task.kysymykset.forEach(function (q, i) {
          const div = document.createElement("div");
          div.style.cssText =
            "display:flex;gap:12px;align-items:flex-start;" +
            "background:#faf5ff;border-left:4px solid #a855f7;" +
            "border-radius:8px;padding:12px 14px;margin-bottom:10px;";
          div.innerHTML =
            "<span style='font-size:18px;font-weight:700;color:#7c3aed;" +
            "min-width:24px;'>" +
            (i + 1) +
            ".</span>" +
            "<span style='line-height:1.5;color:#1e1b4b;'>" +
            q +
            "</span>";
          instructions.appendChild(div);
        });
      }

      // Ohjaajan vinkit
      if (task.vinkit && task.vinkit.length) {
        const vinkitDiv = document.createElement("div");
        vinkitDiv.style.cssText =
          "margin-top:20px;background:#fef9c3;border-left:4px solid #ca8a04;" +
          "border-radius:8px;padding:14px 16px;";

        const vh = document.createElement("h4");
        vh.textContent = "💡 Ohjaajan vinkit";
        vh.style.cssText = "margin:0 0 10px;color:#78350f;font-size:14px;";
        vinkitDiv.appendChild(vh);

        const ul = document.createElement("ul");
        ul.style.cssText = "margin:0;padding-left:18px;";
        task.vinkit.forEach(function (v) {
          const li = document.createElement("li");
          li.textContent = v;
          li.style.cssText =
            "margin-bottom:6px;color:#451a03;font-size:14px;line-height:1.5;";
          ul.appendChild(li);
        });
        vinkitDiv.appendChild(ul);
        instructions.appendChild(vinkitDiv);
      }
    }

    // Piilota kirjoituskenttä ja napit
    if (notes)
      notes.closest(".task-right") &&
        (notes.closest("section, div").style.display = "none");
    if (downloadBtn) downloadBtn.style.display = "none";
    if (clearBtn) clearBtn.style.display = "none";
    if (saveStatus) saveStatus.style.display = "none";

    return; // ei enää jatketa tavalliseen logiikkaan
  }

  // ── Tavallinen kirjoitustehtävä ──────────────────────────────────────────────
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
    if (saved) notes.value = saved;
  }

  if (notes) {
    let saveTimer;
    notes.addEventListener("input", function () {
      localStorage.setItem(storageKey, notes.value);
      if (saveStatus) saveStatus.textContent = "Tallennettu automaattisesti";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        if (saveStatus) saveStatus.textContent = "";
      }, 1500);
    });
  }

  if (clearBtn && notes) {
    clearBtn.addEventListener("click", function () {
      if (confirm("Tyhjennetäänkö vastaus?")) {
        notes.value = "";
        localStorage.removeItem(storageKey);
        if (saveStatus) saveStatus.textContent = "Vastaus tyhjennetty";
      }
    });
  }

  function lataaTextTiedosto(filename, heading, content) {
    const teksti =
      heading + "\n" + "=".repeat(heading.length) + "\n\n" + content;
    const blob = new Blob([teksti], { type: "text/plain;charset=utf-8" });
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
      lataaTextTiedosto(safeFileName + ".txt", task.title, text);
    });
  }

  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      window.history.back();
    });
  }
});
