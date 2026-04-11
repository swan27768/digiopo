function luoTehtavaKortti(tehtava) {
  if (tehtava.tag === "Keskustelu") {
    return `
      <a class="course-card keskustelu-kortti" href="${tehtava.href}" style="
        background: linear-gradient(135deg, #faf5ff, #ede9fe);
        border: 2px solid #c4b5fd;
        border-radius: 14px;
        padding: 18px 18px 14px;
        position: relative;
        display: block;
        text-decoration: none;
        transition: box-shadow 0.2s, transform 0.2s;
        margin-bottom: 2px;
      ">
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="
            font-size: 26px;
            line-height: 1;
            flex-shrink: 0;
            margin-top: 2px;
            color: #7c3aed;
          "><i class="fa-solid fa-people-group"></i></div>
          <div style="flex:1;">
            <div style="
              display:inline-block;
              background:#7c3aed;
              color:white;
              font-size:10px;
              font-weight:700;
              text-transform:uppercase;
              letter-spacing:0.08em;
              padding:2px 10px;
              border-radius:999px;
              margin-bottom:6px;
            ">Ryhmäkeskustelu</div>
            <h3 style="margin:0 0 5px; font-size:15px; color:#3b0764; font-weight:700;">
              ${tehtava.title}
            </h3>
            <p style="margin:0 0 10px; font-size:13px; color:#6d28d9; line-height:1.5;">
              ${tehtava.description}
            </p>
            <div style="
              background: rgba(255,255,255,0.7);
              border-left: 3px solid #a855f7;
              border-radius: 6px;
              padding: 7px 10px;
              font-size: 12px;
              color: #4c1d95;
              font-style: italic;
            ">
              👥 Keskustele parin tai pienryhmän kanssa
            </div>
          </div>
        </div>
      </a>
    `;
  }

  // Vihkomainen ulkoasu kirjoitustehtäville
  return `
    <a class="course-card vihko-kortti" href="${tehtava.href}" style="
      background:
        repeating-linear-gradient(
          transparent,
          transparent 27px,
          #bfdbfe 27px,
          #bfdbfe 28px
        ),
        linear-gradient(to right, #fef9c3 0px, #fef9c3 38px, #fefce8 38px);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #e2e8f0;
      border-radius: 4px 12px 12px 4px;
      padding: 14px 18px 14px 52px;
      position: relative;
      display: block;
      text-decoration: none;
      transition: box-shadow 0.2s, transform 0.2s;
      box-shadow: 2px 2px 6px rgba(0,0,0,0.07);
    ">
      <div style="
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 38px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 10px 0;
      ">
        <div style="width:12px;height:12px;border-radius:50%;border:2px solid #94a3b8;background:#fff;"></div>
        <div style="width:12px;height:12px;border-radius:50%;border:2px solid #94a3b8;background:#fff;"></div>
        <div style="width:12px;height:12px;border-radius:50%;border:2px solid #94a3b8;background:#fff;"></div>
      </div>
      <div style="
        position: absolute;
        left: 38px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #fca5a5;
        opacity: 0.6;
      "></div>
      <h3 style="margin:0 0 5px; font-size:15px; color:#1e293b; font-weight:700;">
        ${tehtava.title}
        <i class="fa-solid ${tehtava.icon}" style="font-size:13px; color:#64748b; margin-left:6px;"></i>
      </h3>
      <p style="margin:0 0 10px; font-size:13px; color:#475569; line-height:1.5;">
        ${tehtava.description}
      </p>
      <span style="
        display:inline-block;
        background:#fef08a;
        color:#713f12;
        border:1px solid #fde047;
        border-radius:999px;
        font-size:11px;
        font-weight:700;
        padding:2px 10px;
      ">✏️ Yksilötehtävä</span>
    </a>
  `;
}

function naytaLuokanTehtavat() {
  const classNumber = window.currentClassNumber || "7";
  // Tue sekä merkkijono- että numeroavaimia
  const luokanTehtavat =
    tehtavat[classNumber] ||
    tehtavat[parseInt(classNumber)] ||
    tehtavat[String(classNumber)] ||
    [];

  const kasitellyt = new Set();

  luokanTehtavat.forEach((tehtava) => {
    const container = document.getElementById(tehtava.aiheId);
    if (!container) return;

    if (!kasitellyt.has(tehtava.aiheId)) {
      container.innerHTML = "";
      kasitellyt.add(tehtava.aiheId);
    }

    container.innerHTML += luoTehtavaKortti(tehtava);
  });
}

// ── Maskotin ilmeenvaihto ──────────────────────────────────────
const ILMEET_DEFAULT = {
  tervetuloa: "iloisena",
  "omat-vahvuudet": "miettivana",
  opiskelutaidot: "kannustavana",
  "mina-oppijana": "miettivana",
  tulevaisuus: "yllattyneena",
  koulutus: "miettivana",
  tet: "yllattyneena",
  raha: "iloisena",
  ammatti: "miettivana",
  jatko: "miettivana",
  yhteishaku: "kannustavana",
  testi: "iloisena",
  valinnat: "kannustavana",
};

const ILME_PAATE = {
  iloisena: "",
  miettivana: "_miettiva",
  yllattyneena: "_yllattyy",
  kannustavana: "_kannustaa",
};

function vaihdaMaskorinIlme(osioId) {
  const maskottiKuva = document.querySelector(".maskotti");
  if (!maskottiKuva) return;

  const ilmeet = window.maskottiIlmeet || ILMEET_DEFAULT;
  const ilme = ilmeet[osioId];
  if (ilme === undefined) return;

  const paate = ILME_PAATE[ilme] ?? "";

  const src = maskottiKuva.getAttribute("src") || "";
  const tiedostoNimi = src.split("/").pop() || "";
  const perus = tiedostoNimi
    .replace(/_miettiva|_yllattyy|_kannustaa/, "")
    .replace(/\.png$/, "");

  const uusiTiedosto = `${perus}${paate}.png`;
  const uusiSrc = src.replace(tiedostoNimi, uusiTiedosto);

  if (uusiSrc === src) return;

  maskottiKuva.style.transition = "opacity 0.25s ease";
  maskottiKuva.style.opacity = "0";

  setTimeout(() => {
    const tmp = new Image();
    tmp.onload = () => {
      maskottiKuva.src = uusiSrc;
      maskottiKuva.style.opacity = "1";
    };
    tmp.onerror = () => {
      maskottiKuva.style.opacity = "1";
    };
    tmp.src = uusiSrc;
  }, 250);
}

// ── Sisällysluettelo + ilmeenvaihto ───────────────────────────
function aktivoiSisallysluettelo() {
  const sections = document.querySelectorAll(".aihe-osio");
  const navLinks = document.querySelectorAll(".aihelista a");
  let edellinenId = "";

  function setActiveLink() {
    let currentId = "";
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 160) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (href === `#${currentId}`) {
        link.classList.add("active");
      }
    });

    if (currentId && currentId !== edellinenId) {
      edellinenId = currentId;
      vaihdaMaskorinIlme(currentId);
    }
  }

  window.addEventListener("scroll", setActiveLink, { passive: true });
  setActiveLink();
}

function setupScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    () => {
      btn.classList.toggle("nakyvissa", window.scrollY > 300);
    },
    { passive: true },
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ── Käynnistys ────────────────────────────────────────────────
// Käytetään window.load jotta window.currentClassNumber on
// varmasti asetettu ennen tehtävien renderöintiä
window.addEventListener("load", () => {
  naytaLuokanTehtavat();
  aktivoiSisallysluettelo();
  setupScrollTop();
});
