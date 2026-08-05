window.addEventListener("load", async function () {
  // ── Hae tehtävädata (ei enää riippuvainen tehtavat.js:stä) ──────────────────
  let tehtavat = window.tehtavat;
  if (!tehtavat) {
    try {
      const vastaus = await fetch("js/tehtavat.json");
      if (vastaus.ok) tehtavat = await vastaus.json();
    } catch (e) {
      console.error("Tehtävädata ei latautunut:", e);
    }
  }

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

      // ── Kuva + Aihekortti rinnakkain ──────────────────────────────────────
      if (task.kuva || task.taustaOtsikko || task.taustateksti) {
        const rivi = document.createElement("div");
        rivi.style.cssText =
          "display:flex;gap:20px;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;";

        // Kuva
        if (task.kuva) {
          const kuvaKehys = document.createElement("div");
          kuvaKehys.style.cssText =
            "border-radius:16px;overflow:hidden;flex-shrink:0;" +
            "width:160px;background:white;";
          const kuva = document.createElement("img");
          kuva.src = task.kuva;
          kuva.alt = task.kuvaAlt || "";
          kuva.style.cssText = "width:100%;display:block;mix-blend-mode:multiply;";
          kuvaKehys.appendChild(kuva);
          rivi.appendChild(kuvaKehys);
        }

        // Aihekortti
        if (task.taustaOtsikko || task.taustateksti) {
          const aihekortti = document.createElement("div");
          aihekortti.setAttribute("role", "region");
          aihekortti.setAttribute("aria-label", "Keskustelun aihe");
          aihekortti.style.cssText =
            "background:#fff;border-left:5px solid #7c3aed;" +
            "border-radius:0 16px 16px 0;padding:20px 22px;flex:1;min-width:200px;" +
            "box-shadow:0 2px 12px rgba(124,58,237,0.08);";

          const aiheLabel = document.createElement("div");
          aiheLabel.textContent = "📖 Keskustelun aihe";
          aiheLabel.style.cssText =
            "font-size:0.72rem;font-weight:800;letter-spacing:0.09em;" +
            "text-transform:uppercase;color:#7c3aed;margin-bottom:8px;";
          aihekortti.appendChild(aiheLabel);

          if (task.taustaOtsikko) {
            const aiheH = document.createElement("h3");
            aiheH.textContent = task.taustaOtsikko;
            aiheH.style.cssText =
              "font-size:1.05rem;font-weight:900;color:#4c1d95;margin:0 0 10px;";
            aihekortti.appendChild(aiheH);
          }

          if (task.taustateksti) {
            task.taustateksti.split("\n\n").forEach(function (kappale) {
              const p = document.createElement("p");
              p.textContent = kappale.trim();
              p.style.cssText =
                "font-size:0.92rem;color:#374151;line-height:1.65;margin:0 0 8px;";
              aihekortti.appendChild(p);
            });
          }

          if (task.taustaLahde) {
            const lahde = document.createElement("p");
            lahde.textContent = "Lähde: " + task.taustaLahde;
            lahde.style.cssText =
              "font-size:0.78rem;color:#9ca3af;font-style:italic;margin:10px 0 0;";
            aihekortti.appendChild(lahde);
          }

          rivi.appendChild(aihekortti);
        }

        instructions.appendChild(rivi);
      }

      // ── Vaiheet: ympyräkaavio ──────────────────────────────────────────────
      const vaiheet = task.vaiheet || [
        { otsikko: "Mieti itse",              aika: "2 min", ikoni: "🤔", vari: "#7c3aed",
          teksti: "Lue teksti rauhassa. Mieti sitten: mitä ajattelet tästä? Oletko samaa vai eri mieltä? Voit tehdä lyhyen muistiinpanon itsellesi." },
        { otsikko: "Keskustele parin kanssa", aika: "5 min", ikoni: "👥", vari: "#0891b2",
          teksti: "Keskustelkaa yhdessä. Kerro oma mielipiteesi: \"Olen itse sitä mieltä, että...\". Kuuntele toista – älä keskeytä. Kysy, jos et ymmärrä. Ei tarvitse olla samaa mieltä." },
        { otsikko: "Jaa luokalle",            aika: "3 min", ikoni: "🙋", vari: "#059669",
          teksti: "Vaihtakaa ajatuksia koko luokan kanssa. Yksi asia pariltanne: mitä ajattelitte tai mistä olitte eri mieltä? Perustele lyhyesti." },
      ];

      // Wrapper
      const kaavioWrap = document.createElement("div");
      kaavioWrap.style.cssText =
        "background:#fdf4ff;border:2px solid #e9d5ff;border-radius:16px;" +
        "padding:24px 20px 20px;margin-bottom:24px;";

      const kaavioOhje = document.createElement("p");
      kaavioOhje.textContent = "Näin keskustelu etenee – klikkaa vaihetta nähdäksesi ohjeen:";
      kaavioOhje.style.cssText =
        "text-align:center;font-style:italic;font-size:0.85rem;" +
        "color:#6b7280;margin:0 0 20px;";
      kaavioWrap.appendChild(kaavioOhje);

      // Ympyrärivi
      const ympyraRivi = document.createElement("div");
      ympyraRivi.setAttribute("role", "list");
      ympyraRivi.style.cssText =
        "display:flex;align-items:flex-start;justify-content:center;" +
        "gap:0;flex-wrap:wrap;";

      // Detaljiboksi
      const detalji = document.createElement("div");
      detalji.setAttribute("role", "region");
      detalji.setAttribute("aria-live", "polite");
      detalji.style.cssText =
        "margin-top:18px;min-height:48px;background:#fff;" +
        "border-radius:12px;padding:14px 18px;font-size:0.9rem;" +
        "color:#374151;line-height:1.6;display:none;" +
        "border-left:4px solid #7c3aed;";

      vaiheet.forEach(function (v, i) {
        // Ympyrä + label + nuoli
        const item = document.createElement("div");
        item.setAttribute("role", "listitem");
        item.style.cssText =
          "display:flex;align-items:center;gap:0;";

        // Ympyrä-nappi
        const btn = document.createElement("button");
        btn.setAttribute("type", "button");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-label", "Vaihe " + (i+1) + ": " + v.otsikko);
        btn.style.cssText =
          "display:flex;flex-direction:column;align-items:center;gap:8px;" +
          "background:none;border:none;cursor:pointer;padding:0;outline-offset:4px;";

        const ymWrapper = document.createElement("div");
        ymWrapper.style.cssText = "position:relative;";

        const ympyra = document.createElement("div");
        ympyra.setAttribute("aria-hidden", "true");
        ympyra.style.cssText =
          "width:72px;height:72px;border-radius:50%;" +
          "border:3px solid " + (v.vari || "#7c3aed") + ";" +
          "background:#fff;display:flex;align-items:center;justify-content:center;" +
          "font-size:2rem;transition:background 0.18s,transform 0.18s;";
        ympyra.textContent = v.ikoni || "💬";

        const badge = document.createElement("div");
        badge.setAttribute("aria-hidden", "true");
        badge.textContent = i + 1;
        badge.style.cssText =
          "position:absolute;top:-6px;right:-6px;" +
          "width:22px;height:22px;border-radius:50%;" +
          "background:#ec4899;color:#fff;" +
          "font-size:0.72rem;font-weight:900;" +
          "display:flex;align-items:center;justify-content:center;";

        ymWrapper.appendChild(ympyra);
        ymWrapper.appendChild(badge);

        const label = document.createElement("div");
        label.textContent = v.otsikko;
        label.style.cssText =
          "font-size:0.78rem;font-weight:700;color:#1e1b4b;text-align:center;max-width:80px;";

        const aikaTag = document.createElement("div");
        aikaTag.textContent = v.aika || "";
        aikaTag.style.cssText =
          "font-size:0.7rem;color:" + (v.vari || "#7c3aed") + ";font-weight:600;";

        btn.appendChild(ymWrapper);
        btn.appendChild(label);
        if (v.aika) btn.appendChild(aikaTag);

        // Klikkaus: näytä detalji
        btn.addEventListener("click", function () {
          const isOpen = btn.getAttribute("aria-expanded") === "true";
          // Resetoi kaikki
          ympyraRivi.querySelectorAll("button").forEach(function (b) {
            b.setAttribute("aria-expanded", "false");
            b.querySelector("div > div").style.background = "#fff";
            b.querySelector("div > div").style.transform = "";
          });
          if (isOpen) {
            detalji.style.display = "none";
          } else {
            btn.setAttribute("aria-expanded", "true");
            ympyra.style.background = (v.vari || "#7c3aed") + "22";
            ympyra.style.transform = "scale(1.08)";
            detalji.style.borderLeftColor = v.vari || "#7c3aed";
            detalji.innerHTML =
              "<strong style='color:" + (v.vari||"#7c3aed") + ";'>Vaihe " + (i+1) + ": " + v.otsikko + "</strong><br>" +
              "<span style='font-size:0.78rem;color:#6b7280;'>⏱ " + (v.aika||"") + "</span><br><br>" +
              v.teksti;
            detalji.style.display = "block";
          }
        });

        item.appendChild(btn);

        // Nuoli (ei viimeisen jälkeen)
        if (i < vaiheet.length - 1) {
          const nuoli = document.createElement("div");
          nuoli.setAttribute("aria-hidden", "true");
          nuoli.textContent = "→";
          nuoli.style.cssText =
            "font-size:1.4rem;color:#d1d5db;padding:0 6px;margin-top:24px;flex-shrink:0;";
          item.appendChild(nuoli);
        }

        ympyraRivi.appendChild(item);
      });

      kaavioWrap.appendChild(ympyraRivi);
      kaavioWrap.appendChild(detalji);
      instructions.appendChild(kaavioWrap);

      // ── Yhteenveto-kenttä ─────────────────────────────────────────────────
      const summaryId = "yhteenveto-" + id;
      const summaryBox = document.createElement("section");
      summaryBox.setAttribute("aria-labelledby", "yhteenveto-otsikko");
      summaryBox.style.cssText =
        "background:#fff;border:2px solid #a7f3d0;border-radius:16px;padding:22px;";

      const summaryH = document.createElement("h3");
      summaryH.id = "yhteenveto-otsikko";
      summaryH.textContent = "✏️ Kirjoita lyhyt yhteenveto keskustelusta";
      summaryH.style.cssText =
        "font-size:1rem;font-weight:800;color:#065f46;margin:0 0 6px;";
      summaryBox.appendChild(summaryH);

      const summaryDesc = document.createElement("p");
      summaryDesc.id = "yhteenveto-kuvaus";
      summaryDesc.textContent = "Kirjoita oma mielipide keskustelun aiheesta.";
      summaryDesc.style.cssText =
        "font-size:0.88rem;color:#374151;margin:0 0 12px;";
      summaryBox.appendChild(summaryDesc);

      const summaryLabel = document.createElement("label");
      summaryLabel.setAttribute("for", summaryId);
      summaryLabel.style.cssText =
        "display:block;font-size:0.85rem;font-weight:600;color:#065f46;margin-bottom:6px;";
      summaryLabel.textContent = "Omat muistiinpanosi:";
      summaryBox.appendChild(summaryLabel);

      const summaryTA = document.createElement("textarea");
      summaryTA.id = summaryId;
      summaryTA.setAttribute("aria-describedby", "yhteenveto-kuvaus");
      summaryTA.placeholder = "Mielestäni…";
      summaryTA.style.cssText =
        "width:100%;min-height:100px;border:2px solid #d1fae5;border-radius:10px;" +
        "padding:12px;font-size:0.9rem;font-family:inherit;color:#1e1b4b;" +
        "resize:vertical;outline:none;box-sizing:border-box;transition:border-color 0.2s;";
      summaryTA.addEventListener("focus", function () {
        this.style.borderColor = "#10b981";
      });
      summaryTA.addEventListener("blur", function () {
        this.style.borderColor = "#d1fae5";
      });

      const savedVal = localStorage.getItem("digiopo_notes_" + id);
      if (savedVal) summaryTA.value = savedVal;

      const liveStatus = document.createElement("div");
      liveStatus.setAttribute("role", "status");
      liveStatus.setAttribute("aria-live", "polite");
      liveStatus.setAttribute("aria-atomic", "true");
      liveStatus.style.cssText =
        "min-height:1px;font-size:0.8rem;color:#059669;margin-top:4px;margin-bottom:8px;";

      // Luonnos tallentuu hiljaa selaimen muistiin, jotta teksti ei katoa
      // sivun päivityksessä. EI näytetä "Tallennettu"-tekstiä kirjoittaessa,
      // koska varsinainen tallennus tapahtuu vasta "Tallenna omalle koneelle"
      // -napista (muuten oppilas luulee jo palauttaneensa tehtävän).
      summaryTA.addEventListener("input", function () {
        localStorage.setItem("digiopo_notes_" + id, summaryTA.value);
      });

      summaryBox.appendChild(summaryTA);
      summaryBox.appendChild(liveStatus);

      // Napit
      const nappiRivi = document.createElement("div");
      nappiRivi.style.cssText =
        "display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;align-items:center;";

      const lataaBtn = document.createElement("button");
      lataaBtn.type = "button";
      lataaBtn.textContent = "⬇ Tallenna omalle koneelle";
      lataaBtn.style.cssText =
        "background:linear-gradient(135deg,#10b981,#059669);color:#fff;" +
        "border:none;padding:10px 18px;border-radius:10px;" +
        "font-size:0.9rem;font-weight:700;cursor:pointer;outline-offset:3px;";
      lataaBtn.addEventListener("click", function () {
        const txt = summaryTA.value.trim();
        if (!txt) { alert("Kirjoita ensin yhteenveto!"); return; }
        const otsikko = task.title;
        const blob = new Blob(
          [otsikko + "\n" + "=".repeat(otsikko.length) + "\n\n" + txt],
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
        liveStatus.textContent = "✓ Tallennettu tiedostoksi";
        clearTimeout(liveStatus._t);
        liveStatus._t = setTimeout(function () { liveStatus.textContent = ""; }, 4000);
      });
      nappiRivi.appendChild(lataaBtn);

      const classroomBtn = document.createElement("button");
      classroomBtn.type = "button";
      classroomBtn.textContent = "📤 Palauta Classroomiin";
      classroomBtn.style.cssText =
        "background:#ede9fe;color:#7c3aed;" +
        "border:none;padding:10px 18px;border-radius:10px;" +
        "font-size:0.9rem;font-weight:700;cursor:pointer;outline-offset:3px;";
      classroomBtn.addEventListener("click", function () {
        window.open("https://classroom.google.com", "_blank", "noopener");
      });
      nappiRivi.appendChild(classroomBtn);

      const ohje = document.createElement("p");
      ohje.setAttribute("role", "note");
      ohje.style.cssText =
        "font-size:0.8rem;color:#6b7280;margin:8px 0 0;width:100%;";
      ohje.textContent = "ℹ️ Tallenna ensin tiedosto, sitten liitä se Classroomin palautukseen.";
      nappiRivi.appendChild(ohje);

      summaryBox.appendChild(nappiRivi);
      instructions.appendChild(summaryBox);

      // Piilota alkuperäinen notes-alue kokonaan
      const notesWrapper = notes && notes.closest(".task-notes-wrapper");
      if (notesWrapper) notesWrapper.style.display = "none";
      else if (notes) notes.style.display = "none";
      if (downloadBtn) downloadBtn.style.display = "none";
      if (clearBtn)    clearBtn.style.display    = "none";
      if (saveStatus)  saveStatus.style.display  = "none";
    }

    const closeBtn2 = document.getElementById("closeBtn");
    if (closeBtn2) {
      closeBtn2.addEventListener("click", function () {
        const anchor2 = task.sektio ? "#" + task.sektio : "";
        window.location.href = "sivut/" + task.class + "luokka.html" + anchor2;
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