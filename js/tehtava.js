window.addEventListener("load", function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id || !tehtavat || !tehtavat[id]) {
    document.body.innerHTML =
      '<p style="padding:2rem;color:#991b1b;">Tehtävää ei löytynyt.</p>';
    console.error("Tehtävää ei löytynyt:", id);
    return;
  }

  const task = tehtavat[id];
  const storageKey = "digiopo_notes_" + id;

  // ── DOM-viittaukset ──────────────────────────────────────────────────────────
  const title          = document.getElementById("taskTitle");
  const instructions   = document.getElementById("taskInstructions");
  const notes          = document.getElementById("notes");
  const downloadBtn    = document.getElementById("downloadBtn");
  const clearBtn       = document.getElementById("clearBtn");
  const backToClass    = document.getElementById("backToClass");
  const breadcrumb     = document.getElementById("breadcrumb");
  const saveStatus     = document.getElementById("saveStatus");
  const taskCategoryTag = document.getElementById("taskCategoryTag");
  const taskClassLabel = document.getElementById("taskClassLabel");

  // ── Otsikko ─────────────────────────────────────────────────────────────────
  if (title) title.textContent = task.title;

  // ── Kategoria-tagi ──────────────────────────────────────────────────────────
  if (taskCategoryTag) {
    taskCategoryTag.textContent = task.category;
    const tagMap = {
      vahvuudet:   "tag-vahvuudet",
      opiskelu:    "tag-opiskelu",
      tet:         "tag-tet",
      oppiminen:   "tag-oppiminen",
      keskustelu:  "tag-interactive",
      urat:        "tag-urat",
      reflektio:   "tag-kirjoitus",
    };
    if (tagMap[task.category]) taskCategoryTag.classList.add(tagMap[task.category]);
  }

  // ── Luokkatunnus ────────────────────────────────────────────────────────────
  if (taskClassLabel) taskClassLabel.textContent = task.class + ". luokka";

  // ── Murupolku ───────────────────────────────────────────────────────────────
  if (breadcrumb) {
    breadcrumb.textContent =
      "Etusivu → " + task.class + ". luokka → " + task.title;
  }

  // ── Navigointi: Palaa luokan sivulle (oikeaan osioon) ───────────────────────
  if (backToClass) {
    const anchor = task.sektio ? "#" + task.sektio : "";
    backToClass.href = "sivut/" + task.class + "luokka.html" + anchor;
    backToClass.textContent =
      "← Takaisin " + task.class + ". luokan sivulle";
  }

  // ════════════════════════════════════════════════════════════════════════════
  // KESKUSTELUTEHTÄVÄ
  // ════════════════════════════════════════════════════════════════════════════
  if (task.tyyppi === "keskustelu") {
    if (instructions) {
      instructions.innerHTML = "";

      // ── Kesto-merkki ──────────────────────────────────────────────────────
      if (task.kesto) {
        const kesto = document.createElement("p");
        kesto.style.cssText =
          "display:inline-block;background:#ede9fe;color:#4c1d95;" +
          "padding:4px 14px;border-radius:999px;font-size:13px;" +
          "font-weight:600;margin-bottom:20px;";
        kesto.textContent = "⏱ " + task.kesto;
        instructions.appendChild(kesto);
      }

      // ── VAIHE 1: Rakenne (jos määritelty) ─────────────────────────────────
      if (task.rakenne && task.rakenne.length) {
        const rakenneLohko = document.createElement("div");
        rakenneLohko.style.cssText =
          "background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;" +
          "padding:16px 20px;margin-bottom:20px;";
        rakenneLohko.setAttribute("aria-label", "Tehtävän rakenne");

        const rakenneH = document.createElement("h3");
        rakenneH.id = "rakenne-otsikko";
        rakenneH.textContent = "Tehtävän rakenne";
        rakenneH.style.cssText =
          "margin:0 0 12px;color:#0c4a6e;font-size:1rem;font-weight:700;";
        rakenneLohko.appendChild(rakenneH);

        const rakenneOl = document.createElement("ol");
        rakenneOl.setAttribute("aria-labelledby", "rakenne-otsikko");
        rakenneOl.style.cssText =
          "margin:0;padding-left:22px;color:#0369a1;";
        task.rakenne.forEach(function (askel) {
          const li = document.createElement("li");
          li.textContent = askel;
          li.style.cssText =
            "margin-bottom:6px;font-size:0.9rem;line-height:1.6;color:#0c4a6e;";
          rakenneOl.appendChild(li);
        });
        rakenneLohko.appendChild(rakenneOl);
        instructions.appendChild(rakenneLohko);
      }

      // ── VAIHE 2: Taustateksti (jos olemassa) ──────────────────────────────
      if (task.taustateksti) {
        const lukuOhje = document.createElement("p");
        lukuOhje.textContent =
          "📖 Lue ensin – sitten keskustele parin kanssa tai pienryhmässä.";
        lukuOhje.style.cssText =
          "font-size:0.9rem;font-weight:600;color:#4c1d95;" +
          "background:#ede9fe;border-radius:8px;padding:10px 14px;" +
          "margin-bottom:12px;";
        instructions.appendChild(lukuOhje);

        const tausta = document.createElement("div");
        tausta.style.cssText =
          "background:#f0fdf4;border-left:4px solid #16a34a;" +
          "border-radius:12px;padding:18px 20px;margin-bottom:20px;";
        tausta.setAttribute("role", "region");
        tausta.setAttribute("aria-label", task.taustaOtsikko || "Taustateksti");

        if (task.taustaOtsikko) {
          const th = document.createElement("h3");
          th.textContent = task.taustaOtsikko;
          th.style.cssText =
            "margin:0 0 12px;color:#14532d;font-size:1.05rem;font-weight:700;";
          tausta.appendChild(th);
        }

        task.taustateksti.split("\n\n").forEach(function (kappale) {
          const tp = document.createElement("p");
          tp.textContent = kappale.trim();
          tp.style.cssText =
            "margin:0 0 10px;font-size:0.92rem;color:#166534;line-height:1.7;";
          tausta.appendChild(tp);
        });

        if (task.taustaLahde) {
          const lahde = document.createElement("p");
          lahde.textContent = "Lähde: " + task.taustaLahde;
          lahde.style.cssText =
            "margin:10px 0 0;font-size:0.8rem;color:#15803d;font-style:italic;";
          tausta.appendChild(lahde);
        }

        instructions.appendChild(tausta);
      }

      // ── VAIHE 3: Keskustelukysymykset ─────────────────────────────────────
      if (task.kysymykset && task.kysymykset.length) {
        const kysSektio = document.createElement("section");
        kysSektio.setAttribute("aria-labelledby", "kysymykset-otsikko");
        kysSektio.style.cssText = "margin-bottom:20px;";

        const kysH = document.createElement("h3");
        kysH.id = "kysymykset-otsikko";
        kysH.textContent = "Keskustelukysymykset";
        kysH.style.cssText =
          "margin:0 0 12px;color:#3b0764;font-size:1rem;font-weight:700;";
        kysSektio.appendChild(kysH);

        const kysOl = document.createElement("ol");
        kysOl.style.cssText =
          "list-style:none;padding:0;margin:0;display:flex;" +
          "flex-direction:column;gap:10px;";

        task.kysymykset.forEach(function (q, i) {
          const li = document.createElement("li");
          li.style.cssText =
            "display:flex;gap:12px;align-items:flex-start;" +
            "background:#faf5ff;border-left:4px solid #a855f7;" +
            "border-radius:8px;padding:12px 14px;";

          const num = document.createElement("span");
          num.setAttribute("aria-hidden", "true");
          num.style.cssText =
            "font-size:1rem;font-weight:700;color:#7c3aed;min-width:22px;flex-shrink:0;";
          num.textContent = (i + 1) + ".";

          const teksti = document.createElement("span");
          teksti.style.cssText = "line-height:1.6;color:#1e1b4b;font-size:0.92rem;";
          teksti.textContent = q;

          li.appendChild(num);
          li.appendChild(teksti);
          kysOl.appendChild(li);
        });

        kysSektio.appendChild(kysOl);
        instructions.appendChild(kysSektio);
      }

      // ── Ohjaajan vinkit ────────────────────────────────────────────────────
      if (task.vinkit && task.vinkit.length) {
        const vinkitDiv = document.createElement("div");
        vinkitDiv.style.cssText =
          "margin-bottom:20px;background:#fef9c3;border-left:4px solid #ca8a04;" +
          "border-radius:8px;padding:14px 16px;";
        vinkitDiv.setAttribute("role", "region");
        vinkitDiv.setAttribute("aria-labelledby", "vinkit-otsikko");

        const vh = document.createElement("h3");
        vh.id = "vinkit-otsikko";
        vh.textContent = "💡 Opon vinkit";
        vh.style.cssText =
          "margin:0 0 10px;color:#78350f;font-size:0.9rem;font-weight:700;";
        vinkitDiv.appendChild(vh);

        const ul = document.createElement("ul");
        ul.style.cssText = "margin:0;padding-left:20px;";
        task.vinkit.forEach(function (v) {
          const li = document.createElement("li");
          li.textContent = v;
          li.style.cssText =
            "margin-bottom:6px;color:#451a03;font-size:0.88rem;line-height:1.6;";
          ul.appendChild(li);
        });
        vinkitDiv.appendChild(ul);
        instructions.appendChild(vinkitDiv);
      }

      // ── Muistiinpanokenttä ────────────────────────────────────────────────
      const muistiId = "muistikentta-" + id;
      const muistiOhje = document.createElement("section");
      muistiOhje.setAttribute("aria-labelledby", "muisti-otsikko");
      muistiOhje.style.cssText =
        "background:#ede9fe;border-left:4px solid #7c3aed;" +
        "border-radius:8px;padding:16px 18px;margin-top:4px;";

      const muistiH = document.createElement("h3");
      muistiH.id = "muisti-otsikko";
      muistiH.innerHTML = "📝 Kirjaa ajatuksesi";
      muistiH.style.cssText =
        "margin:0 0 6px;font-size:0.95rem;color:#3b0764;font-weight:700;";
      muistiOhje.appendChild(muistiH);

      const muistiKuvaus = document.createElement("p");
      muistiKuvaus.id = "muisti-kuvaus";
      muistiKuvaus.textContent =
        "Kirjoita tähän omat muistiinpanosi keskustelusta. " +
        "Lataa ne lopuksi ja palauta opollesi.";
      muistiKuvaus.style.cssText =
        "margin:0 0 12px;font-size:0.88rem;color:#3b0764;line-height:1.6;";
      muistiOhje.appendChild(muistiKuvaus);

      // Label + textarea (saavutettavuus: label for textarea)
      const muistiLabel = document.createElement("label");
      muistiLabel.setAttribute("for", muistiId);
      muistiLabel.style.cssText =
        "display:block;font-size:0.88rem;font-weight:600;" +
        "color:#4c1d95;margin-bottom:6px;";
      muistiLabel.textContent = "Omat muistiinpanosi:";
      muistiOhje.appendChild(muistiLabel);

      const muistiKentta = document.createElement("textarea");
      muistiKentta.id = muistiId;
      muistiKentta.setAttribute("aria-describedby", "muisti-kuvaus");
      muistiKentta.setAttribute("aria-required", "false");
      muistiKentta.style.cssText =
        "width:100%;min-height:140px;padding:12px;" +
        "border:1.5px solid #c4b5fd;border-radius:8px;" +
        "font-size:0.92rem;line-height:1.6;resize:vertical;" +
        "font-family:inherit;box-sizing:border-box;" +
        "background:#fff;color:#1e1b4b;";

      const keskusteluStorageKey = "digiopo_notes_" + id;
      const savedKeskustelu = localStorage.getItem(keskusteluStorageKey);
      if (savedKeskustelu) muistiKentta.value = savedKeskustelu;

      // aria-live tallennusilmoitus
      const tallennusIlmoitus = document.createElement("div");
      tallennusIlmoitus.setAttribute("role", "status");
      tallennusIlmoitus.setAttribute("aria-live", "polite");
      tallennusIlmoitus.setAttribute("aria-atomic", "true");
      tallennusIlmoitus.style.cssText =
        "min-height:1px;font-size:0.82rem;color:#4c1d95;" +
        "margin-top:4px;margin-bottom:8px;";

      let tallennusTimer;
      muistiKentta.addEventListener("input", function () {
        localStorage.setItem(keskusteluStorageKey, muistiKentta.value);
        tallennusIlmoitus.textContent = "✓ Tallennettu";
        clearTimeout(tallennusTimer);
        tallennusTimer = setTimeout(function () {
          tallennusIlmoitus.textContent = "";
        }, 2000);
      });

      muistiOhje.appendChild(muistiKentta);
      muistiOhje.appendChild(tallennusIlmoitus);

      // Painikkeet
      const nappiRivi = document.createElement("div");
      nappiRivi.style.cssText =
        "display:flex;gap:10px;margin-top:4px;flex-wrap:wrap;align-items:center;";

      const lataaBtn = document.createElement("button");
      lataaBtn.textContent = "⬇ Lataa muistiinpanot";
      lataaBtn.setAttribute("type", "button");
      lataaBtn.style.cssText =
        "background:#7c3aed;color:#fff;border:none;padding:9px 18px;" +
        "border-radius:8px;font-size:0.88rem;font-weight:600;" +
        "cursor:pointer;outline-offset:3px;";
      lataaBtn.addEventListener("click", function () {
        const teksti = muistiKentta.value || "";
        const otsikko = task.title;
        const blob = new Blob(
          [otsikko + "\n" + "=".repeat(otsikko.length) + "\n\n" + teksti],
          { type: "text/plain;charset=utf-8" }
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
      tyhjennaBtn.setAttribute("type", "button");
      tyhjennaBtn.style.cssText =
        "background:#fff;color:#7c3aed;border:2px solid #c4b5fd;" +
        "padding:9px 18px;border-radius:8px;font-size:0.88rem;" +
        "font-weight:600;cursor:pointer;outline-offset:3px;";
      tyhjennaBtn.addEventListener("click", function () {
        if (confirm("Tyhjennetäänkö muistiinpanot?")) {
          muistiKentta.value = "";
          localStorage.removeItem(keskusteluStorageKey);
          tallennusIlmoitus.textContent = "Muistiinpanot tyhjennetty.";
          setTimeout(function () {
            tallennusIlmoitus.textContent = "";
          }, 2000);
        }
      });
      nappiRivi.appendChild(tyhjennaBtn);

      const opoOhje = document.createElement("span");
      opoOhje.setAttribute("aria-hidden", "true");
      opoOhje.textContent = "💡 Palauta ladattu tiedosto opollesi";
      opoOhje.style.cssText =
        "font-size:0.82rem;color:#6d28d9;font-style:italic;";
      nappiRivi.appendChild(opoOhje);

      muistiOhje.appendChild(nappiRivi);
      instructions.appendChild(muistiOhje);

      // Piilota tavallinen notes-kenttä ja sen ympäristö
      if (notes) {
        notes.style.display = "none";
        let el = notes.parentElement;
        while (
          el &&
          el.tagName !== "MAIN" &&
          el.tagName !== "ARTICLE" &&
          !el.classList.contains("task-content")
        ) {
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
      if (clearBtn)    clearBtn.style.display    = "none";
      if (saveStatus)  saveStatus.style.display  = "none";
    }

    // Sulje-painike
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

    return;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // KIRJOITUSTEHTÄVÄ (tavallinen)
  // ════════════════════════════════════════════════════════════════════════════
  if (instructions) {
    instructions.innerHTML = "";

    // Kuvaus (reflektio-tyyppi)
    if (task.kuvaus) {
      const kuvausP = document.createElement("p");
      kuvausP.textContent = task.kuvaus;
      kuvausP.style.cssText =
        "background:#f0fdf4;border-left:4px solid #16a34a;" +
        "border-radius:8px;padding:12px 16px;margin-bottom:16px;" +
        "font-size:0.92rem;color:#166534;line-height:1.7;";
      instructions.appendChild(kuvausP);
    }

    // Ohjaajan vinkit (kirjoitustehtävälle)
    if (task.vinkit && task.vinkit.length) {
      const vinkitDiv = document.createElement("div");
      vinkitDiv.style.cssText =
        "background:#fef9c3;border-left:4px solid #ca8a04;" +
        "border-radius:8px;padding:14px 16px;margin-bottom:16px;";
      vinkitDiv.setAttribute("role", "region");
      vinkitDiv.setAttribute("aria-labelledby", "kirjoitus-vinkit-otsikko");

      const vh = document.createElement("h3");
      vh.id = "kirjoitus-vinkit-otsikko";
      vh.textContent = "💡 Vinkit kirjoittamiseen";
      vh.style.cssText =
        "margin:0 0 10px;color:#78350f;font-size:0.9rem;font-weight:700;";
      vinkitDiv.appendChild(vh);

      const ul = document.createElement("ul");
      ul.style.cssText = "margin:0;padding-left:20px;";
      task.vinkit.forEach(function (v) {
        const li = document.createElement("li");
        li.textContent = v;
        li.style.cssText =
          "margin-bottom:6px;color:#451a03;font-size:0.88rem;line-height:1.6;";
        ul.appendChild(li);
      });
      vinkitDiv.appendChild(ul);
      instructions.appendChild(vinkitDiv);
    }

    // Tehtäväkysymykset
    const kysOtsikko = document.createElement("h3");
    kysOtsikko.id = "kirjoitus-kysymykset";
    kysOtsikko.textContent = "Kirjoitustehtävä";
    kysOtsikko.style.cssText =
      "margin:0 0 10px;color:#3b0764;font-size:1rem;font-weight:700;";
    instructions.appendChild(kysOtsikko);

    const ol = document.createElement("ol");
    ol.setAttribute("aria-labelledby", "kirjoitus-kysymykset");
    ol.style.cssText = "padding-left:20px;margin:0 0 8px;";
    task.instructions.forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      li.style.cssText =
        "margin-bottom:8px;font-size:0.92rem;line-height:1.6;color:#1e1b4b;";
      ol.appendChild(li);
    });
    instructions.appendChild(ol);
  }

  // Lataa tallennettu teksti
  if (notes) {
    const saved = localStorage.getItem(storageKey);
    if (saved) notes.value = saved;
  }

  // Autosave + ilmoitus
  if (notes && saveStatus) {
    saveStatus.setAttribute("role", "status");
    saveStatus.setAttribute("aria-live", "polite");
    saveStatus.setAttribute("aria-atomic", "true");
    let saveTimer;
    notes.addEventListener("input", function () {
      localStorage.setItem(storageKey, notes.value);
      saveStatus.textContent = "✓ Tallennettu automaattisesti";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        saveStatus.textContent = "";
      }, 1500);
    });
  }

  // Tyhjennä-nappi
  if (clearBtn && notes) {
    clearBtn.addEventListener("click", function () {
      if (confirm("Tyhjennetäänkö vastaus?")) {
        notes.value = "";
        localStorage.removeItem(storageKey);
        if (saveStatus) saveStatus.textContent = "Vastaus tyhjennetty";
      }
    });
  }

  // Lataa-nappi
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
      const safeFileName =
        task.title.replace(/[^\wäöåÄÖÅ\- ]/g, "").trim();
      lataaTextTiedosto(safeFileName + ".txt", task.title, text);
    });
  }

  // Sulje-painike
  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      window.history.back();
    });
  }
});