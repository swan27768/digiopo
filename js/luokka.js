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

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;

      if (window.scrollY >= sectionTop - 140) {
        currentId = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");

      if (link.getAttribute("href") === `#${currentId}`) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", setActiveLink);
  window.addEventListener("load", setActiveLink);
  setActiveLink();
}

document.addEventListener("DOMContentLoaded", function () {
  naytaLuokanTehtavat();
  aktivoiSisallysluettelo();
});

function setupScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  // näytä kun scrollataan alas
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btn.classList.add("nakyvissa");
    } else {
      btn.classList.remove("nakyvissa");
    }
  });

  // scroll ylös
  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

window.addEventListener("load", setupScrollTop);
