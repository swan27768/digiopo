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

      // Lukuohje ennen taustatietoa
      if (task.taustateksti) {
        const lukuOhje = document.createElement("p");
        lukuOhje.textContent =
          "📖 Lue ensin – sitten keskustele parin kanssa tai pienryhmässä.";
        lukuOhje.style.cssText =
          "font-size:15px;font-weight:600;color:#4c1d95;" +
          "background:#ede9fe;border-radius:8px;padding:10px 14px;" +
          "margin-bottom:12px;";
        instructions.appendChild(lukuOhje);
      }

      // Taustateksti — otsikko + kappaleet erikseen
      if (task.taustateksti) {
        const tausta = document.createElement("div");
        tausta.style.cssText =
          "background:#f0fdf4;border-left:4px solid #16a34a;" +
          "border-radius:12px;padding:18px 20px;margin-bottom:20px;";

        // Otsikko taustatekstille
        if (task.taustaOtsikko) {
          const th = document.createElement("h3");
          th.textContent = task.taustaOtsikko;
          th.style.cssText =
            "margin:0 0 12px;color:#14532d;font-size:18px;font-weight:700;";
          tausta.appendChild(th);
        }

        // Teksti — pilkotaan kaksoisrivinvaihdolla kappaleisiin
        const kappaleet = task.taustateksti.split("\n\n");
        kappaleet.forEach(function (kappale) {
          const tp = document.createElement("p");
          tp.textContent = kappale.trim();
          tp.style.cssText =
            "margin:0 0 10px;font-size:16px;color:#166534;line-height:1.7;";
          tausta.appendChild(tp);
        });

        // Lähde
        if (task.taustaLahde) {
          const lahde = document.createElement("p");
          lahde.textContent = "Lähde: " + task.taustaLahde;
          lahde.style.cssText =
            "margin:10px 0 0;font-size:13px;color:#15803d;font-style:italic;";
          tausta.appendChild(lahde);
        }

        instructions.appendChild(tausta);
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
        vh.textContent = "💡 Opon vinkit";
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
    // Muistiinpanokenttä keskustelutehtävälle
    const keskusteluStorageKey = "digiopo_notes_" + id;

    const muistiOhje = document.createElement("div");
    muistiOhje.style.cssText =
      "margin-top:24px;background:#ede9fe;border-left:4px solid #7c3aed;" +
      "border-radius:8px;padding:14px 16px;";
    const muistiOhjeTeksti = document.createElement("p");
    muistiOhjeTeksti.innerHTML =
      "<strong>📝 Kirjaa ajatuksesi</strong><br>" +
      "Kirjoita tähän omat muistiinpanosi keskustelusta. " +
      "Lataa ne lopuksi ja palauta opollesi.";
    muistiOhjeTeksti.style.cssText =
      "margin:0 0 12px;font-size:14px;color:#3b0764;line-height:1.6;";
    muistiOhje.appendChild(muistiOhjeTeksti);

    const muistiKentta = document.createElement("textarea");
    muistiKentta.placeholder = "Kirjoita tähän...";
    muistiKentta.style.cssText =
      "width:100%;min-height:140px;padding:12px;border:1px solid #c4b5fd;" +
      "border-radius:8px;font-size:15px;line-height:1.6;resize:vertical;" +
      "font-family:inherit;box-sizing:border-box;background:#fff;color:#1e1b4b;";

    const savedKeskustelu = localStorage.getItem(keskusteluStorageKey);
    if (savedKeskustelu) muistiKentta.value = savedKeskustelu;

    muistiKentta.addEventListener("input", function () {
      localStorage.setItem(keskusteluStorageKey, muistiKentta.value);
    });
    muistiOhje.appendChild(muistiKentta);

    // Painikkeet
    const nappiRivi = document.createElement("div");
    nappiRivi.style.cssText =
      "display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;align-items:center;";

    const lataaBtn = document.createElement("button");
    lataaBtn.textContent = "⬇ Lataa muistiinpanot";
    lataaBtn.style.cssText =
      "background:#7c3aed;color:#fff;border:none;padding:9px 18px;" +
      "border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;";
    lataaBtn.addEventListener("click", function () {
      const teksti = muistiKentta.value || "";
      const otsikko = task.title;
      const blob = new Blob(
        [otsikko + "\n" + "=".repeat(otsikko.length) + "\n\n" + teksti],
        { type: "text/plain;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = otsikko.replace(/[^\wäöåÄÖÅ\- ]/g, "").trim() + ".txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    nappiRivi.appendChild(lataaBtn);

    const tyhjennaBtn = document.createElement("button");
    tyhjennaBtn.textContent = "🗑 Tyhjennä";
    tyhjennaBtn.style.cssText =
      "background:#fff;color:#7c3aed;border:2px solid #c4b5fd;padding:9px 18px;" +
      "border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;";
    tyhjennaBtn.addEventListener("click", function () {
      if (confirm("Tyhjennetäänkö muistiinpanot?")) {
        muistiKentta.value = "";
        localStorage.removeItem(keskusteluStorageKey);
      }
    });
    nappiRivi.appendChild(tyhjennaBtn);

    const opoOhje = document.createElement("span");
    opoOhje.textContent = "💡 Palauta ladattu tiedosto opollesi";
    opoOhje.style.cssText = "font-size:13px;color:#6d28d9;font-style:italic;";
    nappiRivi.appendChild(opoOhje);

    muistiOhje.appendChild(nappiRivi);
    instructions.appendChild(muistiOhje);

    // Piilota tavallinen kirjoituskenttä ja kaikki sen vanhemmat joissa se on
    if (notes) {
      // Piilota notes itse
      notes.style.display = "none";
      // Piilota myös label ja kaikki sisarukset samassa containerissa
      let el = notes.parentElement;
      while (
        el &&
        el.tagName !== "MAIN" &&
        el.tagName !== "ARTICLE" &&
        !el.classList.contains("task-content")
      ) {
        // Jos tässä containerissa on vain notes-kenttä ja siihen liittyvät elementit, piilota koko container
        const siblings = Array.from(el.children);
        const onlyNotes = siblings.every(function (s) {
          return (
            s === notes ||
            s.tagName === "LABEL" ||
            s.tagName === "P" ||
            s.id === "saveStatus"
          );
        });
        if (onlyNotes) {
          el.style.display = "none";
          el = el.parentElement;
        } else {
          break;
        }
      }
    }
    if (downloadBtn) downloadBtn.style.display = "none";
    if (clearBtn) clearBtn.style.display = "none";
    if (saveStatus) saveStatus.style.display = "none";

    // Sulje-painike: takaisin edelliselle sivulle
    const closeBtn2 = document.getElementById("closeBtn");
    if (closeBtn2) {
      closeBtn2.addEventListener("click", function () {
        if (document.referrer) {
          window.location.href = document.referrer;
        } else {
          window.history.back();
        }
      });
    }

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
