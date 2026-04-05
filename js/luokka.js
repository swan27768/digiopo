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

function aktivoiSisallysluettelo() {
  const sections = document.querySelectorAll(".aihe-osio");
  const navLinks = document.querySelectorAll(".aihelista a");

  function setActiveLink() {
    let currentId = "";

    // getBoundingClientRect päivittyy aina — ei vanhene dynaamisella sisällöllä
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      // Osio on "aktiivinen" kun sen yläreuna on näkyvissä tai ohi
      if (rect.top <= 160) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      // Täsmää vain päälinkit (#id), ei sub-linkkejä (#id-mission)
      if (href === `#${currentId}`) {
        link.classList.add("active");
      }
    });
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
