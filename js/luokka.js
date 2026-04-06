function luoTehtavaKortti(tehtava) {
  return `
    <a class="course-card" href="${tehtava.href}">
      <h3>
        ${tehtava.title}
        <i class="fa-solid ${tehtava.icon}"></i>
      </h3>
      <p>${tehtava.description}</p>
      <span class="tag ${tehtava.tagClass || ""}">${tehtava.tag}</span>
    </a>
  `;
}

function naytaLuokanTehtavat() {
  const classNumber = window.currentClassNumber || "7";
  const luokanTehtavat = tehtavat[classNumber] || [];

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
//
// Kuvatiedostot nimetään näin images/-kansioon:
//   robo_maskotti.png            (perus / iloinen)
//   robo_maskotti_miettiva.png   (miettivä)
//   robo_maskotti_yllattyy.png   (yllättynyt)
//   robo_maskotti_kannustaa.png  (kannustava)
//
//   tikku_maskotti.png            jne. samalla logiikalla
//
// Sivukohtainen ylikirjoitus: aseta window.maskottiIlmeet = {...}
// ennen luokka.js:n latautumista.

const ILMEET_DEFAULT = {
  // 7. luokka
  tervetuloa: "iloisena",
  "omat-vahvuudet": "miettivana",
  opiskelutaidot: "kannustavana",
  "mina-oppijana": "miettivana",
  tulevaisuus: "yllattyneena",

  // 8. luokka
  koulutus: "miettivana",
  tet: "yllattyneena",
  raha: "iloisena",
  ammatti: "miettivana",

  // 9. luokka
  jatko: "miettivana",
  yhteishaku: "kannustavana",
  tet: "yllattyneena",
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

  // Päätellään perusnimi nykyisestä src:stä — tukee robo_ ja tikku_
  const src = maskottiKuva.getAttribute("src") || "";
  const tiedostoNimi = src.split("/").pop() || "";
  const perus = tiedostoNimi
    .replace(/_miettiva|_yllattyy|_kannustaa/, "")
    .replace(/\.png$/, "");

  const uusiTiedosto = `${perus}${paate}.png`;
  const uusiSrc = src.replace(tiedostoNimi, uusiTiedosto);

  if (uusiSrc === src) return;

  // Pehmeä fade-vaihto
  maskottiKuva.style.transition = "opacity 0.25s ease";
  maskottiKuva.style.opacity = "0";

  setTimeout(() => {
    const tmp = new Image();
    tmp.onload = () => {
      maskottiKuva.src = uusiSrc;
      maskottiKuva.style.opacity = "1";
    };
    tmp.onerror = () => {
      // Kuvatiedosto puuttuu — palautetaan vanha näkyviin
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

    // Vaihda ilme vain kun osio oikeasti vaihtuu
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

document.addEventListener("DOMContentLoaded", () => {
  naytaLuokanTehtavat();
  aktivoiSisallysluettelo();
});

window.addEventListener("load", setupScrollTop);
