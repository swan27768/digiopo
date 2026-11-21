/* ==========================================================================
   DigiOpo – Koulutusalojen 3D-taustat (tausta3d.js)
   --------------------------------------------------------------------------
   Kevyt three.js-tausta tarinoiden taakse. Tarina kertoo nykyisen kohtauksen
   asettamalla <html data-tausta="..."> ja lähettämällä tapahtuman
   window "tausta3d:kohtaus" (detail = kohtauksen nimi).

   Maailma valitaan <html data-tausta-maailma="tekniikka">. Uusia aloja varten
   lisää rakentaja MAAILMAT-olioon.

   Saavutettavuus ja suorituskyky:
   - prefers-reduced-motion: ei animaatiota, kamera siirtyy suoraan.
   - Pysähtyy, kun välilehti ei näy. Ruudunpäivitys rajattu ~40 fps:iin.
   - Jos WebGL ei toimi, mitään ei tapahdu (sivun tasainen tausta jää).
   - Canvas on aria-hidden eikä ota vastaan klikkauksia.
   ========================================================================== */
import * as THREE from "../../vendor/three/three.module.min.js";

const html = document.documentElement;
const maailmaNimi = html.dataset.taustaMaailma || "tekniikka";

/* ---------- WebGL-tuki ---------- */
function webglToimii() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

function kaynnista() {
  const vahennaLiiketta = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Renderer & canvas ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < 1.5, alpha: false, powerPreference: "low-power" });
  } catch (e) { console.info("[tausta3d] WebGL-alustus epäonnistui.", e); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const canvas = renderer.domElement;
  canvas.id = "tausta3d";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("tabindex", "-1");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", zIndex: "0", pointerEvents: "none" });

  const tyyli = document.createElement("style");
  tyyli.textContent = "#story{position:relative;z-index:1}";
  document.head.appendChild(tyyli);

  html.classList.add("tausta3d-ok");
  const liita = () => document.body.prepend(canvas);
  if (document.body) liita(); else document.addEventListener("DOMContentLoaded", liita);

  /* ---------- Scene & camera ---------- */
  const scene = new THREE.Scene();
  const BG = 0x0b132b;
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 18, 75);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

  const rakentaja = MAAILMAT[maailmaNimi] || MAAILMAT.tekniikka;
  const maailma = rakentaja(scene, () => pyydaRuutu());

  /* ---------- Kameran siirrot ---------- */
  const kamPos = new THREE.Vector3(), kamKohde = new THREE.Vector3();
  const alkuPos = new THREE.Vector3(), alkuKohde = new THREE.Vector3();
  const loppuPos = new THREE.Vector3(), loppuKohde = new THREE.Vector3();
  let siirtoAlku = 0, siirtoKesto = 2.2, siirtyy = false;
  let nykyinen = null;

  function asetaKohtaus(nimi, heti) {
    const k = maailma.kohtaukset[nimi] ? nimi : maailma.oletus;
    if (k === nykyinen) return;
    nykyinen = k;
    const kohta = maailma.kohtaukset[k];
    maailma.asetaTila(kohta.tila || {});
    loppuPos.fromArray(kohta.kamera);
    loppuKohde.fromArray(kohta.kohde);
    if (heti || vahennaLiiketta.matches || !kamPos.lengthSq()) {
      kamPos.copy(loppuPos); kamKohde.copy(loppuKohde); siirtyy = false;
    } else {
      alkuPos.copy(kamPos); alkuKohde.copy(kamKohde);
      siirtoAlku = performance.now() / 1000; siirtyy = true;
    }
    pyydaRuutu();
  }

  const helppo = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- Hiiren parallaksi (hento) ---------- */
  const hiiri = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    hiiri.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    hiiri.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- Silmukka ---------- */
  let edellinen = performance.now() / 1000, viimeRuutu = 0, kaynnissa = false, rafId = 0;
  const RUUTUVALI = 1 / 40;

  function piirra(nyt) {
    const t = nyt;
    if (siirtyy) {
      const p = Math.min(1, (t - siirtoAlku) / siirtoKesto);
      const e = helppo(p);
      kamPos.lerpVectors(alkuPos, loppuPos, e);
      kamKohde.lerpVectors(alkuKohde, loppuKohde, e);
      if (p >= 1) siirtyy = false;
    }
    const liike = !vahennaLiiketta.matches;
    hiiri.x += (hiiri.tx - hiiri.x) * 0.05;
    hiiri.y += (hiiri.ty - hiiri.y) * 0.05;
    camera.position.copy(kamPos);
    if (liike) {
      camera.position.x += Math.sin(t * 0.21) * 0.35 + hiiri.x * 0.6;
      camera.position.y += Math.sin(t * 0.17) * 0.15 - hiiri.y * 0.3;
    }
    camera.lookAt(kamKohde);
    renderer.render(scene, camera);
  }

  function silmukka() {
    rafId = requestAnimationFrame(silmukka);
    const nyt = performance.now() / 1000;
    if (nyt - viimeRuutu < RUUTUVALI) return;
    const dt = Math.min(0.1, nyt - edellinen);
    edellinen = nyt; viimeRuutu = nyt;
    maailma.paivita(dt, nyt);
    piirra(nyt);
  }

  function kaynnistaSilmukka() {
    if (kaynnissa || vahennaLiiketta.matches || document.hidden) return;
    kaynnissa = true; edellinen = performance.now() / 1000;
    rafId = requestAnimationFrame(silmukka);
  }
  function pysaytaSilmukka() { kaynnissa = false; cancelAnimationFrame(rafId); }

  /* Liikkeettömässä tilassa piirretään yksi kuva aina kun jotain muuttuu */
  function pyydaRuutu() {
    if (kaynnissa) return;
    requestAnimationFrame(() => { maailma.paivita(0, performance.now() / 1000); piirra(performance.now() / 1000); });
  }

  document.addEventListener("visibilitychange", () => { document.hidden ? pysaytaSilmukka() : kaynnistaSilmukka(); });
  const reagoi = () => { if (vahennaLiiketta.matches) { pysaytaSilmukka(); siirtyy = false; kamPos.copy(loppuPos); kamKohde.copy(loppuKohde); pyydaRuutu(); } else kaynnistaSilmukka(); };
  if (vahennaLiiketta.addEventListener) vahennaLiiketta.addEventListener("change", reagoi);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    pyydaRuutu();
  });

  window.addEventListener("tausta3d:kohtaus", (e) => asetaKohtaus(e.detail));
  asetaKohtaus(html.dataset.tausta, true);
  kaynnistaSilmukka();
  pyydaRuutu();
}

/* ==========================================================================
   APUFUNKTIOT
   ========================================================================== */
function mat(color, opts) { return new THREE.MeshStandardMaterial(Object.assign({ color, metalness: 0.4, roughness: 0.55 }, opts || {})); }
function hehku(color, voima) { return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: voima == null ? 1.4 : voima, roughness: 1 }); }
function laatikko(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function sylinteri(rt, rb, h, m, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), m); }

function tekstiTekstuuri(rivit, vari, tausta, w, h) {
  const c = document.createElement("canvas");
  c.width = w || 512; c.height = h || 288;
  const g = c.getContext("2d");
  g.fillStyle = tausta || "#06101f"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = vari || "#6fffe9";
  g.textAlign = "center"; g.textBaseline = "middle";
  const koko = Math.floor(c.height / (rivit.length + 1.5));
  g.font = "bold " + koko + "px 'Segoe UI', Arial, sans-serif";
  rivit.forEach((r, i) => g.fillText(r, c.width / 2, c.height * (i + 1) / (rivit.length + 1)));
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

function kayraTekstuuri(vari, siemen) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 288;
  const g = c.getContext("2d");
  g.fillStyle = "#06101f"; g.fillRect(0, 0, 512, 288);
  g.strokeStyle = "rgba(111,255,233,.15)"; g.lineWidth = 1;
  for (let x = 0; x < 512; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 288); g.stroke(); }
  for (let y = 0; y < 288; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.strokeStyle = vari; g.lineWidth = 5; g.beginPath();
  for (let x = 0; x <= 512; x += 8) {
    const y = 150 + Math.sin(x / 40 + siemen) * 50 + Math.sin(x / 13 + siemen * 2) * 15;
    x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke();
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

function raitaTekstuuri() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = "#ffd43b"; g.fillRect(0, 0, 256, 32);
  g.fillStyle = "#111";
  for (let x = -32; x < 256; x += 48) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 24, 0); g.lineTo(x + 48, 0); g.lineTo(x + 24, 32); g.fill(); }
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.wrapS = THREE.RepeatWrapping;
  return tx;
}

/* Kipinä-/hiukkasjärjestelmä */
function hiukkaset(maara, vari, koko) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(maara * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: vari, size: koko || 0.08, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(geo, m);
  p.frustumCulled = false;
  return { points: p, pos, nopeus: new Float32Array(maara * 3), ika: new Float32Array(maara), maara };
}

/* ==========================================================================
   MAAILMAT
   ========================================================================== */
const MAAILMAT = {

  /* ------------------------------------------------------------------------
     TEKNIIKKA – "Linja seis!": sähköpyörätehdas
     Asemat: linja (keskellä), ohjaamo (vasen), sähkökeskus (vasen takana),
     koneistamo (oikea takana), konehalli (oikea), lastauslaituri (kaukana oikealla)
     ------------------------------------------------------------------------ */
  tekniikka(scene) {
    const VARI = { metalli: 0x2a3a5e, tumma: 0x18223f, syaani: 0x6fffe9, sininen: 0x4ea8de, keltainen: 0xffd43b, punainen: 0xff3b3b, oranssi: 0xff8c2b, vihrea: 0x51cf66 };
    const metalli = mat(VARI.metalli, { metalness: 0.7, roughness: 0.35 });
    const tumma = mat(VARI.tumma, { metalness: 0.5, roughness: 0.6 });
    const keltainen = mat(VARI.keltainen, { metalness: 0.2, roughness: 0.5 });
    const syaaniHehku = hehku(VARI.syaani, 1.2);

    /* Valot */
    scene.add(new THREE.HemisphereLight(0x9fdcff, 0x0b132b, 1.1));
    const aurinko = new THREE.DirectionalLight(0xffffff, 1.4);
    aurinko.position.set(10, 20, 12);
    scene.add(aurinko);
    const yleisvalo = new THREE.PointLight(VARI.syaani, 18, 40, 1.4);
    yleisvalo.position.set(0, 8, 4);
    scene.add(yleisvalo);

    /* Lattia + ruudukko */
    const lattia = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), mat(0x0e1730, { metalness: 0.2, roughness: 0.9 }));
    lattia.rotation.x = -Math.PI / 2;
    scene.add(lattia);
    const grid = new THREE.GridHelper(220, 110, VARI.syaani, 0x1c2541);
    grid.material.transparent = true; grid.material.opacity = 0.28;
    grid.position.y = 0.01;
    scene.add(grid);

    /* Taustahyllyt syvyyden tunteeksi */
    for (let i = 0; i < 14; i++) {
      const hylly = new THREE.Group();
      const x = -30 + i * 6;
      for (let k = 0; k < 3; k++) {
        const taso = laatikko(4.5, 0.15, 1.6, tumma); taso.position.y = 1 + k * 1.6; hylly.add(taso);
        for (let j = 0; j < 3; j++) {
          if ((i + j + k) % 3 === 0) continue;
          const lt = laatikko(1, 0.9, 1.1, mat([0x3b4a73, 0x2f3d63, 0x51618f][(i + j) % 3]));
          lt.position.set(-1.4 + j * 1.4, 1.55 + k * 1.6, 0); hylly.add(lt);
        }
      }
      [-2.2, 2.2].forEach((px) => { const p = laatikko(0.15, 5, 0.15, metalli); p.position.set(px, 2.5, 0); hylly.add(p); });
      hylly.position.set(x, 0, -26);
      scene.add(hylly);
    }

    /* ---------- LINJA ---------- */
    const linja = new THREE.Group();
    const hihna = laatikko(20, 0.3, 2, mat(0x111827, { roughness: 0.9 }));
    hihna.position.y = 1; linja.add(hihna);
    [-1.05, 1.05].forEach((z) => { const reuna = laatikko(20, 0.25, 0.12, syaaniHehku); reuna.position.set(0, 1.2, z); linja.add(reuna); });
    for (let x = -9; x <= 9; x += 3) [-0.8, 0.8].forEach((z) => { const jalka = laatikko(0.2, 1, 0.2, metalli); jalka.position.set(x, 0.5, z); linja.add(jalka); });
    scene.add(linja);

    /* Pyörän rungot hihnalla (yksinkertaistettu: kaksi rengasta + runko) */
    const renkaat = [];
    const rengasGeo = new THREE.TorusGeometry(0.32, 0.06, 8, 20);
    const rengasMat = mat(0x0f0f14, { roughness: 0.8 });
    const runkoMat = mat(VARI.sininen, { metalness: 0.6, roughness: 0.3 });
    for (let i = 0; i < 7; i++) {
      const pyora = new THREE.Group();
      const r1 = new THREE.Mesh(rengasGeo, rengasMat); r1.position.set(-0.45, 0.38, 0);
      const r2 = new THREE.Mesh(rengasGeo, rengasMat); r2.position.set(0.45, 0.38, 0);
      const runko = laatikko(0.95, 0.07, 0.07, runkoMat); runko.position.set(0, 0.62, 0); runko.rotation.z = 0.25;
      const satula = laatikko(0.07, 0.4, 0.07, runkoMat); satula.position.set(-0.2, 0.72, 0);
      const akku = laatikko(0.35, 0.14, 0.14, hehku(VARI.vihrea, 0.9)); akku.position.set(0.05, 0.55, 0);
      pyora.add(r1, r2, runko, satula, akku);
      pyora.position.set(-9 + i * 3, 1.15, 0);
      linja.add(pyora); renkaat.push(pyora);
    }

    /* Robottikäsivarret */
    function robotti(x, z) {
      const g = new THREE.Group();
      const jalusta = sylinteri(0.6, 0.75, 0.5, keltainen); jalusta.position.y = 0.25; g.add(jalusta);
      const kaanto = new THREE.Group(); kaanto.position.y = 0.5; g.add(kaanto);
      const olka = new THREE.Group(); olka.position.y = 0.3; kaanto.add(olka);
      const yla = laatikko(0.35, 2, 0.35, keltainen); yla.position.y = 1; olka.add(yla);
      const kyynar = new THREE.Group(); kyynar.position.y = 2; olka.add(kyynar);
      const ala = laatikko(0.28, 1.6, 0.28, keltainen); ala.position.y = 0.8; kyynar.add(ala);
      const karki = sylinteri(0.12, 0.12, 0.35, metalli); karki.position.y = 1.7; kyynar.add(karki);
      const valo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), hehku(VARI.syaani, 1.6)); valo.position.y = 1.95; kyynar.add(valo);
      g.position.set(x, 0, z);
      scene.add(g);
      return { g, kaanto, olka, kyynar, valo };
    }
    const robotit = [robotti(-3.5, -2.2), robotti(3.5, -2.2)];

    /* Hälytysmajakat */
    const majakat = [];
    [[-10.5, -1.6], [0, -2.6], [10.5, -1.6]].forEach(([x, z]) => {
      const tolppa = laatikko(0.12, 3, 0.12, metalli); tolppa.position.set(x, 1.5, z); scene.add(tolppa);
      const kupu = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), hehku(VARI.punainen, 0.2)); kupu.position.set(x, 3.15, z); scene.add(kupu);
      const valo = new THREE.PointLight(VARI.punainen, 0, 14, 1.2); valo.position.set(x, 3.3, z); scene.add(valo);
      majakat.push({ kupu, valo });
    });

    /* ---------- OHJAAMO (x ≈ -24) ---------- */
    const ohjaamo = new THREE.Group();
    ohjaamo.position.set(-24, 0, 0);
    ohjaamo.rotation.y = Math.PI / 2;
    const seina = laatikko(9, 5, 0.3, tumma); seina.position.set(0, 2.5, -0.2); ohjaamo.add(seina);
    const naytot = [];
    const halyTx = tekstiTekstuuri(["VIKA E-47", "ROBOTTI 3", "YLIVIRTA"], "#ffffff", "#7a0d12");
    const okTx = tekstiTekstuuri(["LINJA OK", "120 / 120"], "#051b1f", "#51cf66");
    for (let r = 0; r < 2; r++) for (let s = 0; s < 3; s++) {
      const keski = r === 0 && s === 1;
      const m = new THREE.MeshBasicMaterial({ map: keski ? halyTx : kayraTekstuuri(["#6fffe9", "#4ea8de", "#ffd43b"][(r + s) % 3], r * 3 + s) });
      const n = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.45), m);
      n.position.set(-2.8 + s * 2.8, 3.6 - r * 1.75, 0);
      ohjaamo.add(n);
      naytot.push({ n, keski });
    }
    const poyta = laatikko(7, 0.9, 1.6, metalli); poyta.position.set(0, 0.45, 1.6); ohjaamo.add(poyta);
    const napit = [];
    for (let i = 0; i < 10; i++) {
      const nappi = laatikko(0.25, 0.08, 0.25, hehku([VARI.syaani, VARI.keltainen, VARI.vihrea][i % 3], 1));
      nappi.position.set(-2.6 + i * 0.58, 0.94, 1.4); ohjaamo.add(nappi); napit.push(nappi);
    }
    const hatanappi = sylinteri(0.22, 0.22, 0.15, hehku(VARI.punainen, 1.2)); hatanappi.position.set(2.9, 1, 1.9); ohjaamo.add(hatanappi);
    scene.add(ohjaamo);

    /* ---------- SÄHKÖKESKUS (x ≈ -12, z ≈ -12) ---------- */
    const keskus = new THREE.Group();
    keskus.position.set(-12, 0, -12);
    const kaappi = laatikko(4, 5, 1, mat(0x8a94a6, { metalness: 0.6, roughness: 0.4 })); kaappi.position.y = 2.5; keskus.add(kaappi);
    const sisus = laatikko(3.6, 4.6, 0.05, tumma); sisus.position.set(0, 2.5, 0.51); keskus.add(sisus);
    const ovi = laatikko(2, 4.6, 0.08, mat(0x9aa4b6, { metalness: 0.6, roughness: 0.4 })); ovi.position.set(-2.6, 2.5, 1.3); ovi.rotation.y = -1.1; keskus.add(ovi);
    const katkaisijat = [];
    for (let r = 0; r < 4; r++) for (let s = 0; s < 8; s++) {
      const k = laatikko(0.3, 0.55, 0.2, mat(0xe9ecef, { metalness: 0.1, roughness: 0.7 }));
      k.position.set(-1.5 + s * 0.43, 4 - r * 1.05, 0.62); keskus.add(k);
      const kahva = laatikko(0.12, 0.15, 0.1, mat(0x343a40)); kahva.position.set(k.position.x, k.position.y + 0.08, 0.76); keskus.add(kahva);
      katkaisijat.push({ k, kahva });
    }
    const laukeava = katkaisijat[10];
    laukeava.merkki = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), hehku(VARI.punainen, 2));
    laukeava.merkki.position.set(laukeava.k.position.x, laukeava.k.position.y - 0.18, 0.75);
    keskus.add(laukeava.merkki);
    scene.add(keskus);

    /* Kaapelit keskukselta linjalle + kulkevat sykkeet */
    const kaapelit = [];
    const kaapeliMat = mat(0x1f2937, { roughness: 0.8 });
    [[-0.8, 0], [0, 0.4], [0.8, -0.4]].forEach(([dx, dz], i) => {
      const kayra = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-12 + dx, 5, -12),
        new THREE.Vector3(-11 + dx, 6.5, -10 + dz),
        new THREE.Vector3(-5 + dx, 6.2, -5 + dz),
        new THREE.Vector3(3.5 + dx * 0.5, 5.5, -2.5),
        new THREE.Vector3(3.5 + dx * 0.3, 3.2, -2.3)
      ]);
      const putki = new THREE.Mesh(new THREE.TubeGeometry(kayra, 60, 0.06, 6, false), kaapeliMat);
      scene.add(putki);
      const sykkeet = [];
      for (let j = 0; j < 4; j++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hehku(VARI.syaani, 2));
        scene.add(s); sykkeet.push({ s, t: j / 4 + i * 0.07 });
      }
      kaapelit.push({ kayra, sykkeet });
    });

    /* ---------- KONEISTAMO (x ≈ 14, z ≈ -10) ---------- */
    const cnc = new THREE.Group();
    cnc.position.set(14, 0, -10);
    const alusta = laatikko(5, 1.2, 2.6, mat(0xdee2e6, { metalness: 0.3, roughness: 0.5 })); alusta.position.y = 0.6; cnc.add(alusta);
    const kotelo = new THREE.Mesh(new THREE.BoxGeometry(5, 2.8, 2.6), new THREE.MeshStandardMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.12, metalness: 0.1, roughness: 0.1 }));
    kotelo.position.y = 2.6; cnc.add(kotelo);
    const kehys = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 2.8, 2.6)), new THREE.LineBasicMaterial({ color: VARI.syaani }));
    kehys.position.y = 2.6; cnc.add(kehys);
    const kara = new THREE.Group(); kara.position.set(-1.2, 2.2, 0); cnc.add(kara);
    const kappale = sylinteri(0.35, 0.35, 2.2, mat(0xadb5bd, { metalness: 0.9, roughness: 0.25 }), 20);
    kappale.rotation.z = Math.PI / 2; kara.add(kappale);
    const istukka = sylinteri(0.6, 0.6, 0.4, metalli, 20); istukka.rotation.z = Math.PI / 2; istukka.position.set(-1.25, 2.2, 0); cnc.add(istukka);
    const tera = laatikko(0.18, 0.7, 0.18, mat(VARI.keltainen)); tera.position.set(-0.6, 2.85, 0); cnc.add(tera);
    const cncNaytto = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["48,00 mm", "± 0,05"], "#6fffe9") }));
    cncNaytto.position.set(2.1, 2.4, 1.32); cnc.add(cncNaytto);
    scene.add(cnc);
    const kipinat = hiukkaset(160, 0xffb347, 0.09);
    scene.add(kipinat.points);
    const kipinaLahde = new THREE.Vector3(14 - 0.6, 2.5, -10);

    /* ---------- KONEHALLI / JÄÄHDYTYS (x ≈ 26, z ≈ 4) ---------- */
    const halli = new THREE.Group();
    halli.position.set(26, 0, 4);
    const tuuletinKehys = new THREE.Mesh(new THREE.TorusGeometry(2, 0.22, 10, 40), metalli);
    tuuletinKehys.position.set(0, 4, 0); halli.add(tuuletinKehys);
    const siivet = new THREE.Group(); siivet.position.set(0, 4, 0); halli.add(siivet);
    for (let i = 0; i < 5; i++) {
      const siipi = laatikko(0.55, 1.75, 0.06, mat(0xced4da, { metalness: 0.5 }));
      siipi.position.y = 0.95; const piv = new THREE.Group(); piv.rotation.z = (i / 5) * Math.PI * 2; siipi.rotation.y = 0.35;
      piv.add(siipi); siivet.add(piv);
    }
    const napa = sylinteri(0.35, 0.35, 0.3, tumma); napa.rotation.x = Math.PI / 2; siivet.add(napa);
    const jalka = laatikko(0.3, 2, 0.3, metalli); jalka.position.set(0, 1, 0); halli.add(jalka);
    const yksikko = laatikko(3.5, 2.2, 2, mat(0xbfc7d5, { metalness: 0.4 })); yksikko.position.set(4, 1.1, -1.5); halli.add(yksikko);
    const yksikonValo = laatikko(0.5, 0.2, 0.05, hehku(VARI.punainen, 1.5)); yksikonValo.position.set(4, 1.8, -0.48); halli.add(yksikonValo);
    for (let i = 0; i < 3; i++) {
      const kanava = sylinteri(0.55, 0.55, 18, mat(0x8a94a6, { metalness: 0.7, roughness: 0.3 }), 14);
      kanava.rotation.z = Math.PI / 2; kanava.position.set(-6, 7 + i * 0.05, -3 + i * 3); halli.add(kanava);
    }
    scene.add(halli);
    const ilma = hiukkaset(260, 0x9fdcff, 0.06);
    scene.add(ilma.points);
    const lampoValo = new THREE.PointLight(VARI.oranssi, 0, 16, 1.2);
    lampoValo.position.set(26, 3, 6); scene.add(lampoValo);

    /* ---------- LASTAUSLAITURI (x ≈ 40) ---------- */
    const laituri = new THREE.Group();
    laituri.position.set(40, 0, 0);
    const taso = laatikko(10, 1.2, 6, mat(0x495057, { roughness: 0.9 })); taso.position.set(-2, 0.6, 0); laituri.add(taso);
    const raidat = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 0.3), new THREE.MeshStandardMaterial({ map: (() => { const t = raitaTekstuuri(); t.repeat.set(6, 1); return t; })() }));
    raidat.position.set(-2, 1.25, 3); laituri.add(raidat);
    const ovenKehys = laatikko(6, 0.4, 0.4, keltainen); ovenKehys.position.set(3, 5.2, -3); laituri.add(ovenKehys);
    [0, 6].forEach((dx) => { const p = laatikko(0.4, 5, 0.4, keltainen); p.position.set(0 + dx, 2.6, -3); laituri.add(p); });
    const rekka = new THREE.Group(); rekka.position.set(7, 0, 0.5);
    const kontti = laatikko(7, 3.2, 2.6, mat(0xf1f3f5, { metalness: 0.2, roughness: 0.6 })); kontti.position.set(0, 2.2, 0); rekka.add(kontti);
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["VOLTTIPYÖRÄ"], "#4ea8de", "#f1f3f5", 512, 128), transparent: true }));
    logo.position.set(0, 2.4, 1.31); rekka.add(logo);
    const ohjaamoRekka = laatikko(2.2, 2.6, 2.5, mat(0x4ea8de, { metalness: 0.5, roughness: 0.3 })); ohjaamoRekka.position.set(4.7, 1.8, 0); rekka.add(ohjaamoRekka);
    const ikkuna = laatikko(0.05, 1, 2.1, hehku(0x9fdcff, 0.5)); ikkuna.position.set(5.82, 2.4, 0); rekka.add(ikkuna);
    const rengasIso = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 18);
    [[-2.5, 1.2], [-2.5, -1.2], [-1.2, 1.2], [-1.2, -1.2], [4.6, 1.2], [4.6, -1.2]].forEach(([x, z]) => {
      const r = new THREE.Mesh(rengasIso, rengasMat); r.rotation.x = Math.PI / 2; r.position.set(x, 0.55, z); rekka.add(r);
    });
    const vilkut = [];
    [[-3.52, 0.7, 1.1], [-3.52, 0.7, -1.1], [5.82, 1, 1.1], [5.82, 1, -1.1]].forEach(([x, y, z]) => {
      const v = laatikko(0.08, 0.2, 0.3, hehku(VARI.oranssi, 0.2)); v.position.set(x, y, z); rekka.add(v); vilkut.push(v);
    });
    laituri.add(rekka);
    for (let i = 0; i < 4; i++) {
      const lava = laatikko(1.2, 0.15, 1.2, mat(0x8d6e4f, { roughness: 0.9 })); lava.position.set(-5 + i * 1.6, 1.28, -1); laituri.add(lava);
      const pakkaus = laatikko(1.1, 1.1, 1.1, mat(0xc8a27a, { roughness: 0.9 })); pakkaus.position.set(-5 + i * 1.6, 1.9, -1); laituri.add(pakkaus);
    }
    scene.add(laituri);
    const laituriValo = new THREE.PointLight(0xffd8a8, 14, 22, 1.3);
    laituriValo.position.set(40, 7, 4); scene.add(laituriValo);

    /* ---------- TILA ---------- */
    const tila = { halytys: false, linjaKay: true, korjattu: false, loppu: false };
    let hihnaOffset = 0;

    function asetaTila(t) {
      tila.halytys = !!t.halytys;
      tila.linjaKay = !!t.linjaKay;
      tila.korjattu = !!t.korjattu;
      tila.loppu = !!t.loppu;
      naytot.forEach((o) => { if (o.keski) o.n.material.map = tila.halytys ? halyTx : okTx; o.n.material.needsUpdate = true; });
      laukeava.merkki.visible = tila.halytys;
      laukeava.kahva.position.y = laukeava.k.position.y + (tila.halytys ? -0.1 : 0.08);
      yksikonValo.material.emissive.setHex(tila.korjattu || !tila.halytys ? VARI.vihrea : VARI.punainen);
    }

    const tmp = new THREE.Vector3();
    function paivita(dt, t) {
      /* Hihna ja pyörät */
      const nopeus = tila.linjaKay ? 1.6 : 0;
      hihnaOffset += nopeus * dt;
      renkaat.forEach((p, i) => {
        let x = -9 + i * 3 + hihnaOffset;
        x = ((x + 10.5) % 21 + 21) % 21 - 10.5;
        p.position.x = x;
        p.children[0].rotation.z = -hihnaOffset * 2; p.children[1].rotation.z = -hihnaOffset * 2;
      });

      /* Robotit */
      robotit.forEach((r, i) => {
        const jumissa = tila.halytys && i === 1;
        if (tila.linjaKay) {
          r.kaanto.rotation.y = Math.sin(t * 1.1 + i) * 0.9;
          r.olka.rotation.z = -0.35 + Math.sin(t * 1.3 + i * 2) * 0.25;
          r.kyynar.rotation.z = 1.1 + Math.sin(t * 1.7 + i) * 0.35;
        } else if (jumissa) {
          r.olka.rotation.z += (-0.9 - r.olka.rotation.z) * 0.05;
          r.kyynar.rotation.z += (1.9 - r.kyynar.rotation.z) * 0.05;
        }
        r.valo.material.emissive.setHex(jumissa ? VARI.punainen : VARI.syaani);
        r.valo.material.emissiveIntensity = jumissa ? 1 + Math.abs(Math.sin(t * 6)) * 2 : 1.6;
      });

      /* Majakat */
      majakat.forEach((m, i) => {
        if (tila.halytys) {
          const v = Math.max(0, Math.sin(t * 5 + i));
          m.kupu.material.emissive.setHex(VARI.punainen);
          m.kupu.material.emissiveIntensity = 0.4 + v * 2.2;
          m.valo.color.setHex(VARI.punainen); m.valo.intensity = v * 14;
        } else {
          m.kupu.material.emissive.setHex(tila.loppu ? VARI.vihrea : 0x2b8a3e);
          m.kupu.material.emissiveIntensity = tila.loppu ? 1.6 : 0.6;
          m.valo.color.setHex(VARI.vihrea); m.valo.intensity = tila.loppu ? 6 : 0;
        }
      });

      /* Ohjaamo */
      naytot.forEach((o) => { if (o.keski && tila.halytys) o.n.material.color.setScalar(0.65 + Math.abs(Math.sin(t * 4)) * 0.35); else o.n.material.color.setScalar(1); });
      napit.forEach((n, i) => { n.material.emissiveIntensity = 0.5 + Math.abs(Math.sin(t * 2 + i * 0.7)) * 0.9; });

      /* Sähkökeskus: merkkivalo vilkkuu, sykkeet kulkevat */
      if (laukeava.merkki.visible) laukeava.merkki.material.emissiveIntensity = Math.abs(Math.sin(t * 5)) * 3;
      kaapelit.forEach((k, i) => {
        const nop = tila.halytys ? (i === 1 ? 0 : 0.05) : 0.18;
        k.sykkeet.forEach((s) => {
          s.t = (s.t + nop * dt) % 1;
          k.kayra.getPointAt(s.t, tmp); s.s.position.copy(tmp);
          s.s.material.emissive.setHex(tila.halytys && i === 1 ? VARI.punainen : VARI.syaani);
          s.s.visible = !(tila.halytys && i === 1) || Math.sin(t * 4) > 0;
        });
      });

      /* Koneistamo: kappale pyörii, kipinät lentävät */
      kara.rotation.x += dt * 14;
      tera.position.x = -0.6 + Math.sin(t * 0.6) * 0.5;
      kipinaLahde.set(14 + tera.position.x, 2.5, -10);
      const kp = kipinat;
      for (let i = 0; i < kp.maara; i++) {
        kp.ika[i] -= dt;
        if (kp.ika[i] <= 0) {
          kp.ika[i] = 0.4 + Math.random() * 0.6;
          kp.pos[i * 3] = kipinaLahde.x; kp.pos[i * 3 + 1] = kipinaLahde.y; kp.pos[i * 3 + 2] = kipinaLahde.z;
          kp.nopeus[i * 3] = (Math.random() - 0.5) * 3; kp.nopeus[i * 3 + 1] = Math.random() * 2.5; kp.nopeus[i * 3 + 2] = 1 + Math.random() * 2;
        }
        kp.nopeus[i * 3 + 1] -= 9 * dt;
        kp.pos[i * 3] += kp.nopeus[i * 3] * dt; kp.pos[i * 3 + 1] += kp.nopeus[i * 3 + 1] * dt; kp.pos[i * 3 + 2] += kp.nopeus[i * 3 + 2] * dt;
        if (kp.pos[i * 3 + 1] < 1.25) { kp.pos[i * 3 + 1] = 1.25; kp.nopeus[i * 3 + 1] *= -0.3; }
      }
      kp.points.geometry.attributes.position.needsUpdate = true;

      /* Konehalli: tuuletin hidas kun vika, ilma virtaa */
      const tuuletinNop = tila.halytys && !tila.korjattu ? 0.6 : 7;
      siivet.rotation.z -= tuuletinNop * dt;
      const il = ilma;
      for (let i = 0; i < il.maara; i++) {
        il.ika[i] -= dt;
        if (il.ika[i] <= 0) {
          il.ika[i] = 1.5 + Math.random() * 2;
          const a = Math.random() * Math.PI * 2, r = Math.random() * 1.8;
          il.pos[i * 3] = 26 + Math.cos(a) * r; il.pos[i * 3 + 1] = 4 + Math.sin(a) * r; il.pos[i * 3 + 2] = 4.3;
        }
        il.pos[i * 3 + 2] += tuuletinNop * 0.5 * dt;
        il.pos[i * 3 + 1] += Math.sin(t + i) * 0.003;
      }
      il.points.geometry.attributes.position.needsUpdate = true;
      il.points.material.opacity = tila.halytys && !tila.korjattu ? 0.25 : 0.7;
      lampoValo.intensity = tila.halytys && !tila.korjattu ? 8 + Math.sin(t * 2) * 3 : 0;

      /* Laituri: rekan vilkut */
      const vilkku = Math.sin(t * 6) > 0;
      vilkut.forEach((v) => { v.material.emissiveIntensity = vilkku ? 2.4 : 0.2; });
      yleisvalo.intensity = tila.loppu ? 26 : 18;
    }

    /* Kamerapisteet: [kamera], [katsekohde], tila */
    const kohtaukset = {
      kansi:      { kamera: [-9, 4.2, 9],   kohde: [4, 2.4, -5],   tila: { linjaKay: true } },
      tehdas:     { kamera: [0, 9, 17],     kohde: [0, 1.5, -2],   tila: { linjaKay: true } },
      halytys:    { kamera: [8, 6.5, 13],   kohde: [2, 1.5, -2],     tila: { halytys: true } },
      ohjaamo:    { kamera: [-16.5, 3.4, 4.5], kohde: [-24, 2.9, 0], tila: { halytys: true } },
      sahko:      { kamera: [-9.5, 3.4, -4.5], kohde: [-12, 2.8, -12], tila: { halytys: true } },
      koneistamo: { kamera: [17, 3.6, -3.5], kohde: [13.5, 2.3, -10], tila: { halytys: true } },
      halli:      { kamera: [20.5, 4.5, 12], kohde: [26.5, 3.6, 3],  tila: { halytys: true } },
      halliOk:    { kamera: [20.5, 4.5, 12], kohde: [26.5, 3.6, 3],  tila: { halytys: true, korjattu: true } },
      laituri:    { kamera: [33, 4.5, 11],  kohde: [41, 2.2, 0],    tila: { linjaKay: true, korjattu: true } },
      loppu:      { kamera: [12, 13, 26],   kohde: [12, 1, -3],     tila: { linjaKay: true, korjattu: true, loppu: true } }
    };

    return { kohtaukset, oletus: "tehdas", asetaTila, paivita };
  },
  /* ------------------------------------------------------------------------
     SOTE – "Hälytys 112": ilta kaupungissa
     Asemat: kaupunki + sairaala (keskellä), hätäkeskus (vasen), Ainon koti
     (vasen edessä), tie ja ambulanssi (keskellä edessä), päivystyksen käytävä,
     synnytyshuone ja rauhallinen huone (oikealla, "sairaalan sisällä").
     ------------------------------------------------------------------------ */
  sote(scene, piirraUudelleen) {
    const VARI = { minttu: 0x7cf3d0, turkoosi: 0x5cc2c4, sininen: 0x3b82f6, valo: 0xffe3b3, persikka: 0xffc6a5, punainen: 0xff4d5a, vihrea: 0x51cf66 };
    const BG = 0xe4eff1;
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 35, 120);

    const valkoinen = mat(0xffffff, { metalness: 0.05, roughness: 0.75 });
    const harmaa = mat(0x60727a, { metalness: 0.2, roughness: 0.8 });
    const tumma = mat(0x1c2c33, { metalness: 0.3, roughness: 0.7 });
    const puu = mat(0x9a6b47, { metalness: 0.05, roughness: 0.85 });
    const kangas = mat(0x3f7f86, { metalness: 0.0, roughness: 0.95 });

    scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d9dc, 1.5));
    const kuu = new THREE.DirectionalLight(0xffffff, 1.5);
    kuu.position.set(-12, 22, 10);
    scene.add(kuu);

    /* Maa, tie */
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(0xbfd3c6, { roughness: 1 }));
    maa.rotation.x = -Math.PI / 2; scene.add(maa);
    const tie = new THREE.Mesh(new THREE.PlaneGeometry(140, 7), mat(0x6b767b, { roughness: 0.95 }));
    tie.rotation.x = -Math.PI / 2; tie.position.set(10, 0.01, 4); scene.add(tie);
    const viivat = [];
    const viivaMat = new THREE.MeshBasicMaterial({ color: 0xf1f3f5 });
    for (let i = 0; i < 40; i++) {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.15), viivaMat);
      v.rotation.x = -Math.PI / 2; v.position.set(-60 + i * 3.5, 0.02, 4); scene.add(v); viivat.push(v);
    }
    /* Katuvalot */
    for (let i = 0; i < 10; i++) {
      const x = -36 + i * 9;
      const tolppa = sylinteri(0.06, 0.08, 4, tumma, 8); tolppa.position.set(x, 2, 8.2); scene.add(tolppa);
      const lamppu = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), hehku(VARI.valo, 1.6)); lamppu.position.set(x, 4.05, 8.2); scene.add(lamppu);
    }
    /* Puut */
    const puuLehti = mat(0x1f5f4a, { roughness: 0.9 });
    for (let i = 0; i < 18; i++) {
      const x = -40 + (i * 7.3) % 90, z = 11 + (i % 3) * 2.5;
      const runko = sylinteri(0.12, 0.16, 1.2, puu, 6); runko.position.set(x, 0.6, z); scene.add(runko);
      const latva = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 8), puuLehti); latva.position.set(x, 2.2, z); scene.add(latva);
    }

    /* ---------- SAIRAALA (keskellä takana) ---------- */
    const sairaala = new THREE.Group(); sairaala.position.set(4, 0, -10);
    const runko = laatikko(22, 9, 7, valkoinen); runko.position.y = 4.5; sairaala.add(runko);
    const siipi = laatikko(8, 6, 6, valkoinen); siipi.position.set(-14, 3, 1); sairaala.add(siipi);
    const ikkunat = [];
    for (let r = 0; r < 4; r++) for (let s = 0; s < 10; s++) {
      const paalla = (r * 7 + s * 3) % 5 !== 0;
      const ik = laatikko(1.2, 1, 0.05, hehku(paalla ? 0xbfe3f0 : 0x8fb3c0, paalla ? 0.55 : 0.35));
      ik.position.set(-9.9 + s * 2.2, 1.6 + r * 2, 3.53); sairaala.add(ik); ikkunat.push(ik);
    }
    const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["H"], "#ffffff", "#1f6fd1", 256, 256) }));
    kyltti.position.set(8.5, 7.6, 3.56); sairaala.add(kyltti);
    const pkyltti = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["PÄIVYSTYS"], "#ffffff", "#0b6b5f", 512, 96) }));
    pkyltti.position.set(-3, 3.2, 3.56); sairaala.add(pkyltti);
    const katos = laatikko(8, 0.3, 4, harmaa); katos.position.set(-3, 2.6, 5.3); sairaala.add(katos);
    scene.add(sairaala);

    /* ---------- AMBULANSSI ---------- */
    function ambulanssi() {
      const g = new THREE.Group();
      const kori = laatikko(3.6, 2.1, 2, mat(0xf8f9fa, { metalness: 0.3, roughness: 0.4 })); kori.position.set(-0.4, 1.45, 0); g.add(kori);
      const nokka = laatikko(1.4, 1.5, 2, mat(0xf8f9fa, { metalness: 0.3, roughness: 0.4 })); nokka.position.set(2, 1.15, 0); g.add(nokka);
      const raita = laatikko(5.1, 0.35, 2.02, mat(0x1fa3a0, { metalness: 0.2 })); raita.position.set(0.3, 1.1, 0); g.add(raita);
      const ruutu = laatikko(0.05, 0.7, 1.7, hehku(0x9fdcff, 0.4)); ruutu.position.set(2.72, 1.55, 0); g.add(ruutu);
      const rg = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
      [[-1.5, 0.95], [-1.5, -0.95], [1.9, 0.95], [1.9, -0.95]].forEach(([x, z]) => { const r = new THREE.Mesh(rg, mat(0x111111, { roughness: 0.9 })); r.rotation.x = Math.PI / 2; r.position.set(x, 0.42, z); g.add(r); });
      const vilkut = [];
      [[0.6, 0.6], [0.6, -0.6], [-1.9, 0.6], [-1.9, -0.6]].forEach(([x, z], i) => {
        const v = laatikko(0.35, 0.18, 0.35, hehku(VARI.sininen, 0.3)); v.position.set(x, 2.6, z); g.add(v); vilkut.push(v);
      });
      const valo = new THREE.PointLight(VARI.sininen, 0, 14, 1.3); valo.position.set(0, 3.2, 0); g.add(valo);
      /* Oikea ambulanssikuva (läpinäkyvä WebP) korvaa palikkamallin, kun se on latautunut */
      const palikat = g.children.filter((o) => o !== valo);
      new THREE.TextureLoader().load(new URL("../../images/koulutusalat/ambulanssi.webp", import.meta.url).href, (tx) => {
        tx.colorSpace = THREE.SRGBColorSpace;
        const kuva = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, alphaTest: 0.5 }));
        kuva.center.set(0.5, 0.02);          // pyörien alareuna tien pintaan
        kuva.scale.set(5.8, 5.8 * 693 / 1024, 1);
        kuva.position.set(0, 0.02, 0);
        g.add(kuva);
        palikat.forEach((o) => { o.visible = false; });
        if (piirraUudelleen) piirraUudelleen();
      }, undefined, () => { /* kuva ei latautunut: palikkamalli jää näkyviin */ });
      return { g, vilkut, valo };
    }
    const amb = ambulanssi();
    amb.g.position.set(10, 0, 3); scene.add(amb.g);

    /* ---------- HÄTÄKESKUS (x ≈ -40) ---------- */
    const hk = new THREE.Group(); hk.position.set(-40, 0, -6);
    const hkLattia = laatikko(14, 0.1, 10, mat(0xd6dfe2)); hkLattia.position.y = 0.05; hk.add(hkLattia);
    const hkSeina = laatikko(14, 6, 0.3, mat(0xf6f9fa)); hkSeina.position.set(0, 3, -4.8); hk.add(hkSeina);
    const kartta = document.createElement("canvas"); kartta.width = 512; kartta.height = 288;
    (function () {
      const g = kartta.getContext("2d");
      g.fillStyle = "#0c2a2a"; g.fillRect(0, 0, 512, 288);
      g.strokeStyle = "rgba(124,243,208,.35)"; g.lineWidth = 6;
      [[0, 60, 512, 90], [0, 200, 512, 170], [120, 0, 150, 288], [360, 0, 330, 288]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
      g.fillStyle = "rgba(124,243,208,.12)"; for (let i = 0; i < 18; i++) g.fillRect((i * 97) % 480, (i * 53) % 250, 26, 18);
    })();
    const karttaTx = new THREE.CanvasTexture(kartta); karttaTx.colorSpace = THREE.SRGBColorSpace;
    const isoNaytto = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.9), new THREE.MeshBasicMaterial({ map: karttaTx }));
    isoNaytto.position.set(0, 3.6, -4.6); hk.add(isoNaytto);
    const piste = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), new THREE.MeshBasicMaterial({ color: VARI.punainen }));
    piste.position.set(1.1, 3.9, -4.58); hk.add(piste);
    const reitti = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), new THREE.MeshBasicMaterial({ color: VARI.sininen }));
    reitti.position.set(-2, 3.2, -4.58); hk.add(reitti);
    const n112 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["112", "PUHELU"], "#ffffff", "#9b1c2c") }));
    n112.position.set(-5, 3.6, -4.6); hk.add(n112);
    const poyta = laatikko(7, 0.12, 2, mat(0xd9e2e4)); poyta.position.set(0, 1, -1.5); hk.add(poyta);
    [[-3.2, -1.5], [3.2, -1.5]].forEach(([x, z]) => { const j = laatikko(0.12, 1, 1.8, harmaa); j.position.set(x, 0.5, z); hk.add(j); });
    for (let i = 0; i < 3; i++) {
      const n = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.95), new THREE.MeshBasicMaterial({ map: kayraTekstuuri(["#7cf3d0", "#5cc2c4", "#ffc6a5"][i], i * 2) }));
      n.position.set(-2 + i * 2, 1.7, -2.15); n.rotation.y = (1 - i) * 0.25; hk.add(n);
      const jalka = laatikko(0.1, 0.4, 0.1, tumma); jalka.position.set(-2 + i * 2, 1.25, -2.2); hk.add(jalka);
    }
    const tuoli = new THREE.Group();
    const istuin = laatikko(0.9, 0.12, 0.9, tumma); istuin.position.y = 0.6; tuoli.add(istuin);
    const selka = laatikko(0.9, 1, 0.12, tumma); selka.position.set(0, 1.15, 0.45); tuoli.add(selka);
    tuoli.position.set(0, 0, -0.2); hk.add(tuoli);
    const kuulokkeet = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 20, Math.PI), hehku(VARI.minttu, 1)); kuulokkeet.position.set(1.2, 1.3, -1.4); hk.add(kuulokkeet);
    scene.add(hk);
    const hkValo = new THREE.PointLight(VARI.minttu, 10, 16, 1.4); hkValo.position.set(-40, 5, -3); scene.add(hkValo);

    /* ---------- AINON KOTI (x ≈ -24, z ≈ 18) ---------- */
    const koti = new THREE.Group(); koti.position.set(-24, 0, 34);
    const kLattia = laatikko(10, 0.1, 8, puu); kLattia.position.y = 0.05; koti.add(kLattia);
    const kSeina1 = laatikko(10, 4, 0.2, mat(0xfbfaf7, { roughness: 0.9 })); kSeina1.position.set(0, 2, -4); koti.add(kSeina1);
    const kSeina2 = laatikko(0.2, 4, 8, mat(0xf3f1ec, { roughness: 0.9 })); kSeina2.position.set(-5, 2, 0); koti.add(kSeina2);
    const ikkuna = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ color: 0xbfe3f5 }));
    ikkuna.position.set(1.5, 2.4, -3.88); koti.add(ikkuna);
    const kuuKuva = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d5 })); kuuKuva.visible = false; kuuKuva.position.set(2.1, 2.8, -3.86); koti.add(kuuKuva);
    const matto = new THREE.Mesh(new THREE.CircleGeometry(2, 32), mat(0xb5564b, { roughness: 1 })); matto.rotation.x = -Math.PI / 2; matto.position.set(0.5, 0.12, 0.3); koti.add(matto);
    const nojatuoli = new THREE.Group();
    const nt1 = laatikko(1.4, 0.5, 1.2, kangas); nt1.position.y = 0.45; nojatuoli.add(nt1);
    const nt2 = laatikko(1.4, 1.2, 0.3, kangas); nt2.position.set(0, 1, -0.5); nojatuoli.add(nt2);
    [-0.6, 0.6].forEach((x) => { const k = laatikko(0.22, 0.75, 1.2, kangas); k.position.set(x, 0.65, 0); nojatuoli.add(k); });
    nojatuoli.position.set(-2.8, 0, -2); nojatuoli.rotation.y = 0.5; koti.add(nojatuoli);
    const poyta2 = sylinteri(0.6, 0.6, 0.08, puu, 20); poyta2.position.set(1.8, 0.75, 0.6); koti.add(poyta2);
    const poytaJalka = sylinteri(0.06, 0.06, 0.7, puu, 8); poytaJalka.position.set(1.8, 0.38, 0.6); koti.add(poytaJalka);
    const muki = sylinteri(0.1, 0.09, 0.18, mat(0xf8f9fa), 12); muki.position.set(1.9, 0.88, 0.5); koti.add(muki);
    const kaatunutTuoli = new THREE.Group();
    const kt1 = laatikko(0.7, 0.08, 0.7, puu); kaatunutTuoli.add(kt1);
    const kt2 = laatikko(0.7, 0.8, 0.08, puu); kt2.position.set(0, 0.4, -0.35); kaatunutTuoli.add(kt2);
    kaatunutTuoli.rotation.z = Math.PI / 2; kaatunutTuoli.position.set(-0.6, 0.38, 1.6); koti.add(kaatunutTuoli);
    /* Mirri-kissa */
    const kissa = new THREE.Group();
    const kissaMat = mat(0xd9822b, { roughness: 0.9 });
    const kRunko = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), kissaMat); kRunko.scale.set(1.4, 0.9, 0.9); kRunko.position.y = 0.3; kissa.add(kRunko);
    const kPaa = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), kissaMat); kPaa.position.set(0.38, 0.5, 0); kissa.add(kPaa);
    [-0.08, 0.08].forEach((z) => { const k = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), kissaMat); k.position.set(0.4, 0.68, z); kissa.add(k); });
    const hanta = new THREE.Group(); hanta.position.set(-0.35, 0.35, 0); kissa.add(hanta);
    const hantaM = sylinteri(0.04, 0.03, 0.5, kissaMat, 6); hantaM.position.y = 0.25; hanta.add(hantaM);
    kissa.position.set(2.6, 0.1, -1.4); kissa.rotation.y = 2.4; koti.add(kissa);
    const lamppu = sylinteri(0.25, 0.35, 0.4, hehku(VARI.valo, 1.2), 16); lamppu.position.set(-3.8, 2.2, -3.2); koti.add(lamppu);
    const lJalka = sylinteri(0.04, 0.04, 2, tumma, 6); lJalka.position.set(-3.8, 1, -3.2); koti.add(lJalka);
    scene.add(koti);
    const kotiValo = new THREE.PointLight(VARI.valo, 14, 12, 1.4); kotiValo.position.set(-26, 3, 32); scene.add(kotiValo);

    /* ---------- SAIRAALAN SISÄTILAT (x ≈ 40…70, z ≈ -30) ---------- */
    /* Päivystyksen käytävä */
    const kaytava = new THREE.Group(); kaytava.position.set(40, 0, -30);
    const kkLattia = laatikko(6, 0.1, 26, mat(0xdfe9ea, { roughness: 0.4, metalness: 0.1 })); kkLattia.position.set(0, 0.05, -8); kaytava.add(kkLattia);
    [-3, 3].forEach((x) => { const s = laatikko(0.2, 3.4, 26, mat(0xfafcfc, { roughness: 0.8 })); s.position.set(x, 1.7, -8); kaytava.add(s); });
    const kKatto = laatikko(6, 0.1, 26, mat(0xffffff)); kKatto.position.set(0, 3.4, -8); kaytava.add(kKatto);
    const kattovalot = [];
    for (let i = 0; i < 7; i++) { const v = laatikko(1.6, 0.05, 0.6, hehku(0xf4fbff, 0.7)); v.position.set(0, 3.33, 3 - i * 3.6); kaytava.add(v); kattovalot.push(v); }
    for (let i = 0; i < 4; i++) {
      const sanky = new THREE.Group();
      const patja = laatikko(0.95, 0.2, 2, mat(0xf8f9fa)); patja.position.y = 0.75; sanky.add(patja);
      const runko2 = laatikko(1, 0.1, 2.05, harmaa); runko2.position.y = 0.6; sanky.add(runko2);
      [[-0.45, -0.95], [0.45, -0.95], [-0.45, 0.95], [0.45, 0.95]].forEach(([x, z]) => { const j = sylinteri(0.03, 0.03, 0.6, harmaa, 6); j.position.set(x, 0.3, z); sanky.add(j); });
      const tyyny = laatikko(0.7, 0.12, 0.35, mat(0xdbeafe)); tyyny.position.set(0, 0.91, -0.75); sanky.add(tyyny);
      sanky.position.set(i % 2 ? 2.2 : -2.2, 0, -2 - i * 4.5); kaytava.add(sanky);
    }
    const tiski = laatikko(2.2, 1.1, 0.8, mat(0x5cc2c4, { roughness: 0.6 })); tiski.position.set(-1.6, 0.55, 1.5); kaytava.add(tiski);
    const tNaytto = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["1 · 2 · 3", "KIIREELLISYYS"], "#7cf3d0", "#06141b") }));
    tNaytto.position.set(-1.6, 1.45, 1.1); tNaytto.rotation.y = Math.PI; kaytava.add(tNaytto);
    const opaste = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.6), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["PÄIVYSTYS →"], "#ffffff", "#0b6b5f", 512, 96) }));
    opaste.position.set(0, 2.9, -18); kaytava.add(opaste);
    scene.add(kaytava);
    const kValo = new THREE.PointLight(0xffffff, 4, 24, 1.2); kValo.position.set(40, 3, -33); scene.add(kValo);

    /* Synnytyshuone */
    const synn = new THREE.Group(); synn.position.set(56, 0, -32);
    const sLattia = laatikko(9, 0.1, 8, mat(0xe8efee, { roughness: 0.6 })); sLattia.position.y = 0.05; synn.add(sLattia);
    const sSeina = laatikko(9, 3.6, 0.2, mat(0xfcfcfb, { roughness: 0.9 })); sSeina.position.set(0, 1.8, -4); synn.add(sSeina);
    const sSeina2 = laatikko(0.2, 3.6, 8, mat(0xf4f6f6, { roughness: 0.9 })); sSeina2.position.set(-4.5, 1.8, 0); synn.add(sSeina2);
    const sSanky = new THREE.Group();
    const sp = laatikko(1.3, 0.25, 2.3, mat(0xffffff)); sp.position.y = 0.8; sSanky.add(sp);
    const sr = laatikko(1.35, 0.12, 2.35, harmaa); sr.position.y = 0.62; sSanky.add(sr);
    const sTyyny = laatikko(0.9, 0.18, 0.45, mat(0xffe4e6)); sTyyny.position.set(0, 1.0, -0.85); sSanky.add(sTyyny);
    const peitto = laatikko(1.25, 0.08, 1.3, mat(0xa5d8dd)); peitto.position.set(0, 0.97, 0.45); sSanky.add(peitto);
    sSanky.position.set(-1.5, 0, -1.6); synn.add(sSanky);
    const ctgTx = (function () {
      const c = document.createElement("canvas"); c.width = 512; c.height = 160;
      const g = c.getContext("2d"); g.fillStyle = "#06141b"; g.fillRect(0, 0, 512, 160);
      g.strokeStyle = "#7cf3d0"; g.lineWidth = 4; g.beginPath();
      for (let x = 0; x <= 512; x += 4) {
        const v = x % 128; const y = v > 50 && v < 58 ? 30 : v > 58 && v < 64 ? 130 : 85 + Math.sin(x / 9) * 4;
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
    })();
    const monitori = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ map: ctgTx }));
    monitori.position.set(0.3, 1.8, -3.85); synn.add(monitori);
    const monKehys = laatikko(1.35, 0.65, 0.08, tumma); monKehys.position.set(0.3, 1.8, -3.92); synn.add(monKehys);
    const kehto = new THREE.Group();
    const kp = laatikko(0.7, 0.35, 0.5, mat(0xf8f9fa, { transparent: true, opacity: 0.85 })); kp.position.y = 0.95; kehto.add(kp);
    const kJalka = laatikko(0.08, 0.8, 0.08, harmaa); kJalka.position.y = 0.4; kehto.add(kJalka);
    const vauva = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat(0xffd8c2)); vauva.position.set(-0.15, 1.15, 0); kehto.add(vauva);
    const vaippa = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.25, 4, 8), mat(0xfff3bf)); vaippa.rotation.z = Math.PI / 2; vaippa.position.set(0.12, 1.12, 0); kehto.add(vaippa);
    kehto.position.set(1.4, 0, -0.6); synn.add(kehto);
    const sIkkuna = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 1.6), new THREE.MeshBasicMaterial({ color: 0x1b3b5a }));
    scene.add(synn);
    const synnValo = new THREE.PointLight(0xffd6b5, 12, 12, 1.4); synnValo.position.set(56, 3, -30); scene.add(synnValo);

    /* Rauhallinen huone */
    const rauha = new THREE.Group(); rauha.position.set(70, 0, -32);
    const rLattia = laatikko(8, 0.1, 7, mat(0xe3ebe7, { roughness: 0.9 })); rLattia.position.y = 0.05; rauha.add(rLattia);
    const rSeina = laatikko(8, 3.6, 0.2, mat(0xf8fbfa, { roughness: 0.9 })); rSeina.position.set(0, 1.8, -3.5); rauha.add(rSeina);
    function tuoliP(x, rot) {
      const t = new THREE.Group();
      const i1 = laatikko(1, 0.4, 0.95, mat(0x6fb7a8, { roughness: 0.95 })); i1.position.y = 0.45; t.add(i1);
      const i2 = laatikko(1, 0.9, 0.22, mat(0x6fb7a8, { roughness: 0.95 })); i2.position.set(0, 0.9, -0.4); t.add(i2);
      t.position.set(x, 0, -0.6); t.rotation.y = rot; rauha.add(t);
    }
    tuoliP(-1.2, 0.9); tuoliP(1.2, -0.9);
    const ruukku = sylinteri(0.35, 0.28, 0.6, mat(0xd08c60), 14); ruukku.position.set(-3, 0.3, -2.6); rauha.add(ruukku);
    for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 6), mat(0x2f9e6e)); l.position.set(-3 + Math.cos(i) * 0.15, 1.05, -2.6 + Math.sin(i) * 0.15); l.rotation.z = Math.cos(i * 2) * 0.35; l.rotation.x = Math.sin(i * 2) * 0.35; rauha.add(l); }
    const sakki = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), mat(0xffc6a5, { roughness: 1 })); sakki.scale.set(1, 0.6, 1); sakki.position.set(2.6, 0.45, -2.2); rauha.add(sakki);
    const taulu = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: kayraTekstuuri("#7cf3d0", 0.4) }));
    taulu.position.set(0, 2.2, -3.38); rauha.add(taulu);
    scene.add(rauha);
    const rauhaValo = new THREE.PointLight(0xf2fffb, 5, 12, 1.4); rauhaValo.position.set(70, 3, -30); scene.add(rauhaValo);
    const hengitys = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshBasicMaterial({ color: VARI.minttu, transparent: true, opacity: 0.35 }));
    hengitys.position.set(70, 1.8, -32.6); scene.add(hengitys);

    /* ---------- TILA ---------- */
    const tila = { vilkut: false, ajaa: false, loppu: false };
    function asetaTila(t) {
      tila.vilkut = !!t.vilkut; tila.ajaa = !!t.ajaa; tila.loppu = !!t.loppu;
      if (tila.ajaa) amb.g.position.set(10, 0, 3);
      else if (tila.loppu) amb.g.position.set(8.5, 0, -1.2);   // katoksen viereen, ei sen alle
      else amb.g.position.set(10, 0, 3);
      amb.g.rotation.y = tila.loppu ? Math.PI / 2 : 0;
    }
    let tieOffset = 0;
    function paivita(dt, t) {
      const vilkku = tila.vilkut && (Math.sin(t * 9) > 0);
      amb.vilkut.forEach((v, i) => { v.material.emissiveIntensity = tila.vilkut ? ((i % 2 === 0) === vilkku ? 3 : 0.3) : 0.3; });
      amb.valo.intensity = tila.vilkut ? (vilkku ? 16 : 4) : 0;
      if (tila.ajaa) {
        tieOffset = (tieOffset + dt * 14) % 3.5;
        viivat.forEach((v, i) => { v.position.x = -60 + i * 3.5 + tieOffset; });
        amb.g.position.y = Math.abs(Math.sin(t * 7)) * 0.03;
      }
      piste.scale.setScalar(1 + Math.abs(Math.sin(t * 3)) * 0.8);
      reitti.position.x = -2 + ((t * 0.5) % 3.1);
      reitti.position.y = 3.2 + ((t * 0.5) % 3.1) * 0.22;
      hanta.rotation.z = Math.sin(t * 2) * 0.5;
      ctgTx.offset.x = (t * 0.12) % 1;
      const h = 0.8 + Math.sin(t * Math.PI * 2 / 10) * 0.35;
      hengitys.scale.setScalar(h);
      hengitys.material.opacity = 0.18 + (h - 0.45) * 0.3;
      if (Math.floor(t * 2) % 7 === 0) { const ik = ikkunat[Math.floor(t) % ikkunat.length]; ik.material.emissiveIntensity = 0.9; }
      kotiValo.intensity = 13 + Math.sin(t * 1.3) * 0.6;
    }

    const kohtaukset = {
      kansi:      { kamera: [-6, 4, 14],     kohde: [4, 3.2, -8],    tila: { vilkut: true, ajaa: false } },
      ilta:       { kamera: [-4, 5, 15],     kohde: [10, 2, 1],    tila: { vilkut: true } },
      hatakeskus: { kamera: [-36.5, 2.8, 2.5], kohde: [-40, 3, -9],    tila: {} },
      koti:       { kamera: [-20.5, 3.2, 39.5], kohde: [-25, 1.2, 32], tila: { vilkut: true } },
      ambulanssi: { kamera: [4, 2.2, 8],     kohde: [12, 1.4, 2.5],   tila: { vilkut: true, ajaa: true } },
      paivystys:  { kamera: [40.6, 2.1, -26.6], kohde: [39.6, 1.3, -44],   tila: {} },
      synnytys:   { kamera: [59.5, 2.6, -26.5], kohde: [55.5, 1.1, -33], tila: {} },
      nuoret:     { kamera: [73, 2.4, -27.5], kohde: [70, 1.2, -33],  tila: {} },
      loppu:      { kamera: [-8, 11, 26],    kohde: [6, 2, -6],       tila: { loppu: true } }
    };
    return { kohtaukset, oletus: "ilta", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     IT – "Julkaisupäivä": pelistudio Pikselipaja
     Pisteet: testaus (vasen takana), koodi (keskellä vasemmalla), ux (oikealla
     takana, sohva ja tv), verkko (konesali oikealla), tietoturva (vasen edessä),
     tuki (oikea edessä). Takaseinällä iso julkaisunäyttö.
     ------------------------------------------------------------------------ */
  it(scene) {
    const VARI = { violetti: 0x9b7bff, pinkki: 0xff6bb5, syaani: 0x5ce1ff, vihrea: 0x51cf66, oranssi: 0xff9f1c, punainen: 0xff4d4d, valo: 0xfff1d6 };
    const BG = 0x150f2b;
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 22, 70);

    const seina = mat(0x2a2348, { metalness: 0.05, roughness: 0.9 });
    const puu = mat(0xb98a5e, { metalness: 0.05, roughness: 0.7 });
    const tumma = mat(0x1b1730, { metalness: 0.4, roughness: 0.5 });
    const musta = mat(0x0d0b16, { metalness: 0.3, roughness: 0.6 });
    const kangas = mat(0x6a4fd0, { metalness: 0.0, roughness: 0.95 });
    const kangas2 = mat(0xff6bb5, { metalness: 0.0, roughness: 0.95 });

    scene.add(new THREE.HemisphereLight(0xd6ccff, 0x2a2048, 1.6));
    const paa = new THREE.DirectionalLight(0xffffff, 0.9); paa.position.set(6, 18, 12); scene.add(paa);
    const violettiValo = new THREE.PointLight(VARI.violetti, 22, 30, 1.5); violettiValo.position.set(-8, 5.5, -2); scene.add(violettiValo);
    const pinkkiValo = new THREE.PointLight(VARI.pinkki, 16, 26, 1.5); pinkkiValo.position.set(9, 5, -5); scene.add(pinkkiValo);

    /* Lattia, seinät */
    const lattia = new THREE.Mesh(new THREE.PlaneGeometry(60, 50), mat(0x3a3150, { metalness: 0.1, roughness: 0.85 }));
    lattia.rotation.x = -Math.PI / 2; lattia.position.z = -2; scene.add(lattia);
    const takaseina = laatikko(42, 8, 0.3, seina); takaseina.position.set(0, 4, -14.15); scene.add(takaseina);
    const vasen = laatikko(0.3, 8, 30, seina); vasen.position.set(-20.15, 4, -1); scene.add(vasen);
    const oikea = laatikko(0.3, 8, 30, seina); oikea.position.set(20.15, 4, -1); scene.add(oikea);
    /* Matot */
    const matto1 = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), mat(0x4b3a8a, { roughness: 1 })); matto1.rotation.x = -Math.PI / 2; matto1.position.set(8.5, 0.01, -9.5); scene.add(matto1);
    const matto2 = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), mat(0x2f2852, { roughness: 1 })); matto2.rotation.x = -Math.PI / 2; matto2.position.set(-7.5, 0.01, -5.6); scene.add(matto2);

    /* ---------- Tekstuurit ---------- */
    function kangasTx(w, h, piirto) {
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      piirto(c.getContext("2d"), w, h);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
    }
    function koodiTx(siemen) {
      return kangasTx(512, 320, (g, w, h) => {
        g.fillStyle = "#14112a"; g.fillRect(0, 0, w, h);
        const varit = ["#c4b1ff", "#5ce1ff", "#ff9bd2", "#ffd166", "#8ce99a", "#e9e4ff"];
        let s = siemen * 9301 + 49297;
        const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        for (let y = 16; y < h - 8; y += 18) {
          let x = 20 + Math.floor(r() * 4) * 22;
          const n = 1 + Math.floor(r() * 4);
          for (let i = 0; i < n; i++) { const l = 30 + r() * 110; g.fillStyle = varit[Math.floor(r() * varit.length)]; g.fillRect(x, y, l, 8); x += l + 12; if (x > w - 40) break; }
        }
      });
    }
    function bugiTx() {
      return kangasTx(512, 320, (g, w, h) => {
        g.fillStyle = "#f4f1ff"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#2a2348"; g.font = "bold 34px 'Segoe UI', Arial"; g.fillText("BUGILISTA", 24, 50);
        const rivit = [["#ff4d4d", "Peli kaatuu tauolla"], ["#ff9f1c", "Ääni pätkii"], ["#51cf66", "Valikko korjattu"], ["#51cf66", "Pisteet korjattu"]];
        rivit.forEach(([v, t], i) => { const y = 100 + i * 52; g.fillStyle = v; g.beginPath(); g.arc(40, y - 10, 11, 0, 7); g.fill(); g.fillStyle = "#2a2348"; g.font = "26px 'Segoe UI', Arial"; g.fillText(t, 64, y); });
      });
    }
    function varoitusTx() {
      return kangasTx(512, 320, (g, w, h) => {
        g.fillStyle = "#1a0f1f"; g.fillRect(0, 0, w, h);
        g.strokeStyle = "#ff4d4d"; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
        g.fillStyle = "#ff4d4d"; g.beginPath(); g.moveTo(w / 2, 50); g.lineTo(w / 2 + 62, 160); g.lineTo(w / 2 - 62, 160); g.closePath(); g.fill();
        g.fillStyle = "#1a0f1f"; g.font = "bold 70px Arial"; g.textAlign = "center"; g.fillText("!", w / 2, 150);
        g.fillStyle = "#ffe3e3"; g.font = "bold 34px 'Segoe UI', Arial"; g.fillText("EPÄILYTTÄVÄ VIESTI", w / 2, 230);
        g.font = "24px 'Segoe UI', Arial"; g.fillText("Älä klikkaa linkkiä", w / 2, 272);
      });
    }
    function chatTx() {
      return kangasTx(512, 320, (g, w, h) => {
        g.fillStyle = "#f4f1ff"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#6a4fd0"; g.fillRect(0, 0, w, 48); g.fillStyle = "#fff"; g.font = "bold 24px 'Segoe UI', Arial"; g.fillText("Tuki · Veikko", 20, 32);
        const kupla = (x, y, l, v) => { g.fillStyle = v; g.beginPath(); g.roundRect ? g.roundRect(x, y, l, 40, 16) : g.rect(x, y, l, 40); g.fill(); };
        kupla(20, 70, 280, "#e3dcff"); kupla(200, 125, 290, "#ff9bd2"); kupla(20, 180, 230, "#e3dcff"); kupla(260, 235, 230, "#ff9bd2");
      });
    }
    function peliTx() {
      return kangasTx(512, 288, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1b1050"); gr.addColorStop(1, "#4b1f6e"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(255,255,255," + (0.3 + (i % 5) * 0.14) + ")"; g.fillRect((i * 97) % w, (i * 53) % h, 2, 2); }
        g.fillStyle = "#ff9f1c"; g.beginPath(); g.arc(380, 200, 70, 0, 7); g.fill();
        g.strokeStyle = "#ffd6a5"; g.lineWidth = 5; g.beginPath(); g.ellipse(380, 200, 120, 26, -0.25, 0, 7); g.stroke();
        /* kettu: kolmiopää ja korvat */
        g.fillStyle = "#ff7a1a"; g.beginPath(); g.moveTo(130, 120); g.lineTo(200, 120); g.lineTo(165, 175); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(130, 120); g.lineTo(140, 92); g.lineTo(152, 120); g.fill(); g.beginPath(); g.moveTo(178, 120); g.lineTo(190, 92); g.lineTo(200, 120); g.fill();
        g.fillStyle = "#fff"; g.beginPath(); g.moveTo(152, 150); g.lineTo(178, 150); g.lineTo(165, 175); g.fill();
        g.fillStyle = "#1b1050"; g.fillRect(148, 132, 6, 6); g.fillRect(176, 132, 6, 6);
      });
    }
    function paaTx(valmis) {
      return kangasTx(1024, 480, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1b1050"); gr.addColorStop(1, valmis ? "#0f5132" : "#5a1f7a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 120; i++) { g.fillStyle = "rgba(255,255,255," + (0.25 + (i % 4) * 0.18) + ")"; g.fillRect((i * 137) % w, (i * 71) % h, 3, 3); }
        g.fillStyle = "#ff9f1c"; g.beginPath(); g.arc(850, 330, 90, 0, 7); g.fill();
        g.strokeStyle = "#ffd6a5"; g.lineWidth = 7; g.beginPath(); g.ellipse(850, 330, 160, 34, -0.25, 0, 7); g.stroke();
        g.textAlign = "left"; g.fillStyle = "#ffd6a5"; g.font = "bold 34px 'Segoe UI', Arial"; g.fillText("PIKSELIPAJA ESITTÄÄ", 70, 110);
        g.fillStyle = "#ffffff"; g.font = "900 82px 'Segoe UI', Arial"; g.fillText("KETTU", 70, 200); g.fillText("KIERTORADALLA", 70, 285);
        g.fillStyle = valmis ? "#8ce99a" : "#ff9bd2"; g.font = "bold 46px 'Segoe UI', Arial";
        g.fillText(valmis ? "★ JULKAISTU! ★" : "JULKAISU KLO 12.00", 70, 390);
      });
    }

    /* ---------- Huonekalut ---------- */
    function naytto(w, h, tx, voima) {
      const g = new THREE.Group();
      const kehys = laatikko(w + 0.08, h + 0.08, 0.06, musta); g.add(kehys);
      const ruutu = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(voima || 1, voima || 1, voima || 1) }));
      ruutu.position.z = 0.035; g.add(ruutu);
      const jalka = laatikko(0.08, 0.35, 0.08, musta); jalka.position.y = -h / 2 - 0.15; g.add(jalka);
      const alusta = laatikko(0.4, 0.03, 0.25, musta); alusta.position.y = -h / 2 - 0.32; g.add(alusta);
      g.userData.ruutu = ruutu;
      return g;
    }
    function poyta(x, z) {
      const g = new THREE.Group();
      const kansi = laatikko(2.6, 0.08, 1.2, puu); kansi.position.y = 0.76; g.add(kansi);
      [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]].forEach(([a, b]) => { const j = laatikko(0.06, 0.76, 0.06, tumma); j.position.set(a, 0.38, b); g.add(j); });
      const tuoli = new THREE.Group();
      const istuin = laatikko(0.6, 0.1, 0.6, kangas); istuin.position.y = 0.5; tuoli.add(istuin);
      const selka = laatikko(0.6, 0.7, 0.08, kangas); selka.position.set(0, 0.9, 0.3); tuoli.add(selka);
      const tolppa = sylinteri(0.04, 0.04, 0.45, tumma, 8); tolppa.position.y = 0.25; tuoli.add(tolppa);
      const jalka = sylinteri(0.3, 0.3, 0.04, tumma, 10); jalka.position.y = 0.03; tuoli.add(jalka);
      tuoli.position.set(0.2, 0, 1.05); tuoli.rotation.y = 0.25; g.add(tuoli);
      g.position.set(x, 0, z); scene.add(g);
      return g;
    }
    function kasvi(x, z, k) {
      const ruukku = sylinteri(0.32 * k, 0.25 * k, 0.55 * k, mat(0xe8e2f7, { roughness: 0.8 }), 14); ruukku.position.set(x, 0.28 * k, z); scene.add(ruukku);
      const lehti = mat(0x2f9e6e, { roughness: 0.9 });
      for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.12 * k, 1.1 * k, 6), lehti); l.position.set(x + Math.cos(i) * 0.14 * k, 0.95 * k, z + Math.sin(i) * 0.14 * k); l.rotation.z = Math.cos(i * 2) * 0.45; l.rotation.x = Math.sin(i * 2) * 0.45; scene.add(l); }
    }
    function lamppu(x, z) {
      const johto = sylinteri(0.01, 0.01, 2, musta, 4); johto.position.set(x, 7, z); scene.add(johto);
      const varjo = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 16, 1, true), mat(0x1b1730, { side: THREE.DoubleSide })); varjo.position.set(x, 5.85, z); scene.add(varjo);
      const polttimo = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), hehku(VARI.valo, 2)); polttimo.position.set(x, 5.68, z); scene.add(polttimo);
    }
    [[-11, -6], [-4, -6], [8, -9], [-12, 3], [10, 3], [15, -4]].forEach(([x, z]) => lamppu(x, z));

    /* Iso julkaisunäyttö takaseinällä */
    const paaKesken = paaTx(false), paaValmis = paaTx(true);
    const paaRuutu = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), new THREE.MeshBasicMaterial({ map: paaKesken }));
    paaRuutu.position.set(0, 4.3, -13.95); scene.add(paaRuutu);
    const paaKehys = laatikko(9.3, 4.5, 0.12, musta); paaKehys.position.set(0, 4.3, -14.02); scene.add(paaKehys);
    const neonAla = laatikko(9.3, 0.06, 0.06, hehku(VARI.violetti, 2)); neonAla.position.set(0, 2.0, -13.9); scene.add(neonAla);

    /* Neonkyltti vasemmalla seinällä */
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["PIKSELIPAJA"], "#ff9bd2", "#2a2348", 768, 154) }));
    neon.position.set(-19.98, 4.6, -4); neon.rotation.y = Math.PI / 2; scene.add(neon);

    /* ---------- TESTAUS ---------- */
    poyta(-11, -7);
    const bugiNaytto = naytto(1.5, 0.95, bugiTx()); bugiNaytto.position.set(-11.4, 1.5, -7.25); scene.add(bugiNaytto);
    const puhelimet = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Group();
      const kuori = laatikko(0.22, 0.42, 0.03, musta); p.add(kuori);
      const ruutu = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.37), hehku([VARI.syaani, VARI.violetti, VARI.pinkki][i % 3], 1.2)); ruutu.position.z = 0.017; p.add(ruutu);
      p.position.set(-10.55 + (i % 3) * 0.32, 1.02 + Math.floor(i / 3) * 0.02, -6.75 - Math.floor(i / 3) * 0.3); p.rotation.x = -0.35;
      scene.add(p); puhelimet.push(ruutu);
    }
    const kaatuva = puhelimet[1];

    /* ---------- KOODI ---------- */
    poyta(-4, -7);
    const koodi1 = naytto(1.25, 0.8, koodiTx(1)); koodi1.position.set(-4.7, 1.38, -7.2); koodi1.rotation.y = 0.12; scene.add(koodi1);
    const koodi2 = naytto(1.25, 0.8, koodiTx(5)); koodi2.position.set(-3.35, 1.38, -7.2); koodi2.rotation.y = -0.12; scene.add(koodi2);
    const koodiTxt = koodi1.userData.ruutu.material.map;
    const muki = sylinteri(0.07, 0.06, 0.16, mat(0xff9bd2), 12); muki.position.set(-2.95, 0.88, -6.75); scene.add(muki);
    const nappis = laatikko(0.9, 0.03, 0.3, musta); nappis.position.set(-4.1, 0.81, -6.75); scene.add(nappis);

    /* ---------- UX: sohva, tv, lappuseinä ---------- */
    const tv = naytto(3.2, 1.8, peliTx()); tv.position.set(8.5, 2.3, -13.85); tv.children[2].visible = false; tv.children[3].visible = false; scene.add(tv);
    const sohva = new THREE.Group();
    const istuin = laatikko(3.4, 0.45, 1.1, kangas); istuin.position.y = 0.42; sohva.add(istuin);
    const selka = laatikko(3.4, 0.8, 0.3, kangas); selka.position.set(0, 0.95, 0.45); sohva.add(selka);
    [-1.75, 1.75].forEach((x) => { const k = laatikko(0.3, 0.7, 1.1, kangas); k.position.set(x, 0.55, 0); sohva.add(k); });
    [-1, 0, 1].forEach((x, i) => { const t = laatikko(0.8, 0.35, 0.18, i === 1 ? kangas2 : mat(0xffd166)); t.position.set(x, 0.85, 0.25); t.rotation.x = -0.2; sohva.add(t); });
    sohva.position.set(8.5, 0, -8.6); scene.add(sohva);
    const pallo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), kangas2); pallo.scale.set(1, 0.65, 1); pallo.position.set(5.6, 0.38, -10.4); scene.add(pallo);
    const lapVarit = [0xffd166, 0xff9bd2, 0x8ce99a, 0x5ce1ff];
    for (let i = 0; i < 16; i++) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ color: lapVarit[i % 4] }));
      l.position.set(11.6 + (i % 4) * 0.48, 2.0 + Math.floor(i / 4) * 0.48, -13.98); l.rotation.z = ((i * 37) % 9 - 4) * 0.02; scene.add(l);
    }
    const ohjain = laatikko(0.35, 0.06, 0.2, musta); ohjain.position.set(8.2, 0.68, -8.7); scene.add(ohjain);

    /* ---------- VERKKO: konesali ---------- */
    const ledit = [];
    const vikaLedi = [];
    for (let r = 0; r < 3; r++) {
      const kaappi = new THREE.Group();
      const runko = laatikko(1.1, 2.6, 1.0, musta); runko.position.y = 1.3; kaappi.add(runko);
      for (let y = 0; y < 9; y++) {
        const yksikko = laatikko(0.04, 0.18, 0.86, tumma); yksikko.position.set(-0.56, 0.3 + y * 0.25, 0); kaappi.add(yksikko);
        for (let k = 0; k < 4; k++) {
          const vari = (r === 1 && y === 4 && k === 0) ? VARI.oranssi : [VARI.vihrea, VARI.syaani, VARI.vihrea, VARI.violetti][k];
          const led = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), hehku(vari, 2));
          led.position.set(-0.585, 0.3 + y * 0.25, -0.32 + k * 0.1); led.rotation.y = -Math.PI / 2; kaappi.add(led);
          if (r === 1 && y === 4 && k === 0) vikaLedi.push(led); else ledit.push(led);
        }
      }
      kaappi.position.set(18.6, 0, -7.4 + r * 1.3); scene.add(kaappi);
    }
    const kaapelit = [VARI.syaani, VARI.pinkki, 0xffd166, VARI.violetti];
    kaapelit.forEach((v, i) => { const c = sylinteri(0.025, 0.025, 3.6, mat(v), 6); c.rotation.x = Math.PI / 2; c.position.set(18.0 - i * 0.04, 2.75 + i * 0.05, -6.1); scene.add(c); });
    const palvelinValo = new THREE.PointLight(VARI.syaani, 8, 9, 1.6); palvelinValo.position.set(16.5, 2.5, -6); scene.add(palvelinValo);

    /* ---------- TIETOTURVA ---------- */
    poyta(-12, 2);
    const turvaNaytto = naytto(1.5, 0.95, varoitusTx()); turvaNaytto.position.set(-12.3, 1.5, 1.75); scene.add(turvaNaytto);
    const lukko = new THREE.Group();
    const lr = laatikko(0.26, 0.22, 0.1, mat(0xffd166, { metalness: 0.6 })); lukko.add(lr);
    const lk = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16, Math.PI), mat(0xd0d4dc, { metalness: 0.8 })); lk.position.y = 0.11; lukko.add(lk);
    lukko.position.set(-11.1, 0.92, 2.2); scene.add(lukko);
    const turvaValo = new THREE.PointLight(VARI.punainen, 0, 6, 1.6); turvaValo.position.set(-12.3, 1.8, 2.6); scene.add(turvaValo);
    kasvi(-17.5, 4, 1.3);

    /* ---------- TUKI ---------- */
    poyta(10, 3);
    const tukiNaytto = naytto(1.5, 0.95, chatTx()); tukiNaytto.position.set(9.7, 1.5, 2.75); scene.add(tukiNaytto);
    const kuuloke = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 20, Math.PI), musta); kuuloke.position.set(10.9, 0.98, 3.2); kuuloke.rotation.x = -0.3; scene.add(kuuloke);
    [10.74, 11.06].forEach((x) => { const k = sylinteri(0.07, 0.07, 0.05, kangas, 12); k.rotation.z = Math.PI / 2; k.position.set(x, 0.84, 3.25); scene.add(k); });
    kasvi(16, 4.5, 1.2);
    kasvi(-17, -11, 1.5); kasvi(16.5, -12, 1.4); kasvi(2.8, -12.4, 1.0);

    /* Konfetti julkaisun kunniaksi */
    const konf = hiukkaset(260, 0xffffff, 0.12);
    const konfVarit = new Float32Array(260 * 3);
    const varit = [0xff9bd2, 0xc4b1ff, 0x8ce99a, 0xffd166, 0x5ce1ff].map((v) => new THREE.Color(v));
    for (let i = 0; i < 260; i++) { const c = varit[i % 5]; konfVarit.set([c.r, c.g, c.b], i * 3); konf.pos.set([-6 + Math.random() * 12, 2 + Math.random() * 6, -12 + Math.random() * 8], i * 3); konf.nopeus[i] = 0.6 + Math.random() * 1.2; }
    konf.points.geometry.setAttribute("color", new THREE.BufferAttribute(konfVarit, 3));
    konf.points.material.vertexColors = true; konf.points.material.color.set(0xffffff);
    konf.points.visible = false; scene.add(konf.points);

    /* ---------- TILA ---------- */
    const tila = { loppu: false, vika: false, verkkoVika: false, varoitus: false };
    function asetaTila(t) {
      tila.loppu = !!t.loppu; tila.vika = !!t.vika; tila.verkkoVika = !!t.verkkoVika; tila.varoitus = !!t.varoitus;
      paaRuutu.material.map = tila.loppu ? paaValmis : paaKesken; paaRuutu.material.needsUpdate = true;
      konf.points.visible = tila.loppu;
      vikaLedi.forEach((l) => l.material.emissive.setHex(tila.verkkoVika ? VARI.oranssi : VARI.vihrea));
    }
    function paivita(dt, t) {
      kaatuva.material.emissive.setHex(tila.vika && Math.sin(t * 6) > 0 ? VARI.punainen : VARI.violetti);
      ledit.forEach((l, i) => { l.material.emissiveIntensity = (Math.sin(t * (2 + (i % 7)) + i) > 0.2) ? 2.2 : 0.4; });
      vikaLedi.forEach((l) => { l.material.emissiveIntensity = tila.verkkoVika ? (Math.sin(t * 8) > 0 ? 3 : 0.2) : 2; });
      turvaValo.intensity = tila.varoitus ? 3 + Math.sin(t * 5) * 2 : 0;
      koodiTxt.offset.y = (t * 0.03) % 1;
      neonAla.material.emissiveIntensity = 1.6 + Math.sin(t * 2) * 0.4;
      if (konf.points.visible) {
        for (let i = 0; i < 260; i++) {
          let y = konf.pos[i * 3 + 1] - konf.nopeus[i] * dt;
          if (y < 0.1) y = 7.5;
          konf.pos[i * 3 + 1] = y; konf.pos[i * 3] += Math.sin(t * 2 + i) * dt * 0.3;
        }
        konf.points.geometry.attributes.position.needsUpdate = true;
      }
    }
    koodiTxt.wrapT = THREE.RepeatWrapping;

    const kohtaukset = {
      kansi:      { kamera: [-3, 3.2, 7],     kohde: [14, 2.2, -8],   tila: {} },
      studio:     { kamera: [0, 4.4, 9.5],    kohde: [0, 2.4, -8],    tila: {} },
      testaus:    { kamera: [-10.6, 2.2, -3.4], kohde: [-11, 1.1, -7.5], tila: { vika: true } },
      koodi:      { kamera: [-3.8, 2.1, -3.8], kohde: [-4, 1.3, -7.4],  tila: {} },
      ux:         { kamera: [8.5, 2.5, -4],   kohde: [8.5, 1.7, -13],  tila: {} },
      verkko:     { kamera: [13.5, 2.4, -4],  kohde: [18.6, 1.6, -6.4], tila: { verkkoVika: true } },
      tietoturva: { kamera: [-11.8, 2.2, 5.6], kohde: [-12.2, 1.2, 1.5], tila: { varoitus: true } },
      tuki:       { kamera: [10.2, 2.2, 6.6], kohde: [9.8, 1.2, 2.5],  tila: {} },
      loppu:      { kamera: [0, 3.6, 6.5],    kohde: [0, 3.8, -13],   tila: { loppu: true } }
    };
    return { kohtaukset, oletus: "studio", asetaTila, paivita };
  }

};

/* ---------- Käynnistys (lopussa, jotta MAAILMAT on määritelty) ---------- */
if (!webglToimii()) { console.info("[tausta3d] WebGL ei käytössä – tasainen tausta."); }
else { kaynnista(); }
