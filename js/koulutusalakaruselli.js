/* =============================================
   KOULUTUSALAKARUSELLI
   Tiedosto: js/koulutusalakaruselli.js
============================================= */
(function () {
  const ALA_KUVAT = [
    { src: "../images/koulutusalat/kaupan-ala.png",                alt: "Kaupan ala – infograafi",                nimi: "Kaupan ala" },
    { src: "../images/koulutusalat/elintarvikeala-iso.png",        alt: "Elintarvikeala – infograafi",            nimi: "Elintarvikeala" },
    { src: "../images/koulutusalat/it-ala-iso.png",                alt: "IT-ala – infograafi",                    nimi: "IT-ala" },
    { src: "../images/koulutusalat/luonto-ymparisto-ala.png",      alt: "Luonto- ja ympäristöalat – infograafi",  nimi: "Luonto- ja ympäristöalat" },
    { src: "../images/koulutusalat/palvelu-ala.png",               alt: "Palvelualat – infograafi",               nimi: "Palvelualat" },
    { src: "../images/koulutusalat/tekniikan-ala.png",             alt: "Tekniikan alat – infograafi",            nimi: "Tekniikan alat" },
    { src: "../images/koulutusalat/taide-ja-humanistinen-ala.png", alt: "Taide- ja humanistinen ala – infograafi",nimi: "Taide- ja humanistinen ala" },
    { src: "../images/koulutusalat/sote-ala-iso.png",              alt: "Terveys- ja hyvinvointiala – infograafi",nimi: "Terveys- ja hyvinvointiala" },
  ];

  let nykyinenSivu = 0;
  let lightboxIndeksi = 0;
  let lightboxEl = null;

  /* --- Luo lightbox-elementti suoraan bodyyn ---
     Näin vältetään position:fixed-ongelma,
     joka syntyy kun parent-elementillä on
     transform/filter/will-change. */
  function luoLightbox() {
    // Poista vanha jos on
    const vanha = document.getElementById("alaLightbox");
    if (vanha) vanha.remove();

    const lb = document.createElement("div");
    lb.id = "alaLightbox";
    lb.className = "ala-lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Kuvan suurennos");
    lb.setAttribute("aria-hidden", "true");
    lb.addEventListener("click", function (e) {
      if (e.target === lb) suljeKaruselliLightbox();
    });

    lb.innerHTML = `
      <div class="ala-lightbox-sisalto">
        <button class="ala-lightbox-sulje" aria-label="Sulje suurennos">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <button class="ala-lightbox-nuoli vasen" aria-label="Edellinen kuva">
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <img id="alaLightboxKuva" src="" alt="" class="ala-lightbox-kuva" />
        <button class="ala-lightbox-nuoli oikea" aria-label="Seuraava kuva">
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
        <p id="alaLightboxNimi" class="ala-lightbox-nimi"></p>
      </div>`;

    lb.querySelector(".ala-lightbox-sulje").addEventListener("click", suljeKaruselliLightbox);
    lb.querySelector(".ala-lightbox-nuoli.vasen").addEventListener("click", () => lightboxSiirry(-1));
    lb.querySelector(".ala-lightbox-nuoli.oikea").addEventListener("click", () => lightboxSiirry(1));

    // Lisää suoraan bodyyn — ei nested containerin sisään
    document.body.appendChild(lb);
    lightboxEl = lb;
  }

  /* --- Karusellilogiikka --- */
  const slideWidth = () => {
    const track = document.getElementById("alaKaruselliTrack");
    if (!track) return 0;
    const slide = track.querySelector(".ala-slide");
    if (!slide) return 0;
    return slide.offsetWidth + 14;
  };

  const slidesPerView = () => {
    const w = window.innerWidth;
    if (w >= 900) return 3;
    if (w >= 600) return 2;
    return 1;
  };

  const maxSivu = () => Math.max(0, ALA_KUVAT.length - slidesPerView());

  function paivitaKaruselli() {
    const track = document.getElementById("alaKaruselliTrack");
    if (!track) return;
    track.style.transform = `translateX(-${nykyinenSivu * slideWidth()}px)`;
    document.getElementById("alaEdellinen").disabled = nykyinenSivu === 0;
    document.getElementById("alaSeuraava").disabled  = nykyinenSivu >= maxSivu();
    document.querySelectorAll(".ala-dot").forEach((d, i) => {
      d.classList.toggle("aktiivinen", i === nykyinenSivu);
      d.setAttribute("aria-selected", String(i === nykyinenSivu));
    });
  }

  function rakennaDots() {
    const container = document.getElementById("alaKaruselliDots");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i <= maxSivu(); i++) {
      const btn = document.createElement("button");
      btn.className = "ala-dot" + (i === 0 ? " aktiivinen" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `Siirry kohtaan ${i + 1}`);
      btn.setAttribute("aria-selected", String(i === 0));
      btn.addEventListener("click", () => { nykyinenSivu = i; paivitaKaruselli(); });
      container.appendChild(btn);
    }
  }

  window.siirraKaruselli = function (suunta) {
    nykyinenSivu = Math.max(0, Math.min(nykyinenSivu + suunta, maxSivu()));
    paivitaKaruselli();
  };

  /* --- Lightbox-funktiot --- */
  function paivitaLightboxKuva() {
    if (!lightboxEl) return;
    const kuva = lightboxEl.querySelector("#alaLightboxKuva");
    const nimi = lightboxEl.querySelector("#alaLightboxNimi");
    kuva.src = ALA_KUVAT[lightboxIndeksi].src;
    kuva.alt = ALA_KUVAT[lightboxIndeksi].alt;
    nimi.textContent = ALA_KUVAT[lightboxIndeksi].nimi;
  }

  window.avaaLightbox = function (indeksi) {
    lightboxIndeksi = indeksi;
    if (!lightboxEl) luoLightbox();
    paivitaLightboxKuva();
    lightboxEl.classList.add("auki");
    lightboxEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightboxEl.querySelector(".ala-lightbox-sulje").focus();
  };

  window.suljeKaruselliLightbox = function () {
    if (!lightboxEl) return;
    lightboxEl.classList.remove("auki");
    lightboxEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  function lightboxSiirry(suunta) {
    lightboxIndeksi = (lightboxIndeksi + suunta + ALA_KUVAT.length) % ALA_KUVAT.length;
    paivitaLightboxKuva();
  }
  window.lightboxSiirry = lightboxSiirry;

  /* --- Näppäimistötuki --- */
  document.addEventListener("keydown", function (e) {
    if (!lightboxEl || !lightboxEl.classList.contains("auki")) return;
    if (e.key === "Escape")     suljeKaruselliLightbox();
    if (e.key === "ArrowLeft")  lightboxSiirry(-1);
    if (e.key === "ArrowRight") lightboxSiirry(1);
  });

  /* --- Pyyhkäisytuki mobiilille --- */
  (function () {
    let startX = null;
    const track = document.getElementById("alaKaruselliTrack");
    if (!track) return;
    track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", e => {
      if (startX === null) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) window.siirraKaruselli(diff > 0 ? 1 : -1);
      startX = null;
    }, { passive: true });
  })();

  /* --- Init --- */
  window.addEventListener("load", function () {
    luoLightbox();
    rakennaDots();
    paivitaKaruselli();
    window.addEventListener("resize", function () {
      rakennaDots();
      nykyinenSivu = Math.min(nykyinenSivu, maxSivu());
      paivitaKaruselli();
    }, { passive: true });
  });

})();