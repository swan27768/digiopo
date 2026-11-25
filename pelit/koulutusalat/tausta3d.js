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
  },

  /* ------------------------------------------------------------------------
     ELINTARVIKE – "Uusi välipala": vaalea, herkullinen välipalatehdas
     Osastot vasemmalta oikealle: hygienia, leipomo, meijeri, laboratorio,
     tuotekehitys, pakkauslinja. Keskellä leijuu jättimäinen Marjapala.
     ------------------------------------------------------------------------ */
  elintarvike(scene) {
    const V = { mansikka: 0xff6b8b, vadelma: 0xe8487a, vanilja: 0xfff1c9, karamelli: 0xf2a65a, suklaa: 0x6b3e26, pistaasi: 0xa8d5a2, minttu: 0xbfe8d8, mustikka: 0x5b6ee1, sitruuna: 0xffe066, persikka: 0xffc8a8, kerma: 0xfff8ee };
    const BG = 0xfff1e4;
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 26, 80);

    const kerma = mat(V.kerma, { metalness: 0.02, roughness: 0.8 });
    const persikka = mat(V.persikka, { metalness: 0.02, roughness: 0.85 });
    const teras = mat(0xf1f4f6, { metalness: 0.25, roughness: 0.35 });
    const mansikka = mat(V.mansikka, { metalness: 0.05, roughness: 0.55 });
    const suklaa = mat(V.suklaa, { metalness: 0.1, roughness: 0.5 });
    const karamelli = mat(V.karamelli, { metalness: 0.1, roughness: 0.5 });
    const minttu = mat(V.minttu, { metalness: 0.05, roughness: 0.7 });
    const pistaasi = mat(V.pistaasi, { metalness: 0.05, roughness: 0.7 });
    const valkoinen = mat(0xffffff, { metalness: 0.05, roughness: 0.6 });

    scene.add(new THREE.HemisphereLight(0xfffaf2, 0xffd9c2, 1.7));
    const aur = new THREE.DirectionalLight(0xfff4e0, 1.3); aur.position.set(-10, 22, 14); scene.add(aur);

    /* Ruutulattia */
    const lattiaTx = (() => {
      const c = document.createElement("canvas"); c.width = 256; c.height = 256; const g = c.getContext("2d");
      g.fillStyle = "#fff8ee"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#ffe3e8"; g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(40, 20); return tx;
    })();
    const lattia = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshStandardMaterial({ map: lattiaTx, roughness: 0.6, metalness: 0.05 }));
    lattia.rotation.x = -Math.PI / 2; lattia.position.set(6, 0, -6); scene.add(lattia);
    const seina = laatikko(120, 9, 0.4, persikka); seina.position.set(6, 4.5, -16); scene.add(seina);
    /* Isot ikkunat ja raidallinen markiisi */
    for (let i = 0; i < 9; i++) {
      const ik = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3), new THREE.MeshBasicMaterial({ color: 0xd9f2ff })); ik.position.set(-30 + i * 9, 5.6, -15.78); scene.add(ik);
      const pk = laatikko(4.4, 0.12, 0.2, valkoinen); pk.position.set(-30 + i * 9, 4.05, -15.7); scene.add(pk);
    }
    const raitaTx = (() => {
      const c = document.createElement("canvas"); c.width = 256; c.height = 32; const g = c.getContext("2d");
      for (let x = 0; x < 256; x += 32) { g.fillStyle = (x / 32) % 2 ? "#ffffff" : "#ff8fab"; g.fillRect(x, 0, 32, 32); }
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.repeat.set(30, 1); return tx;
    })();
    const markiisi = new THREE.Mesh(new THREE.PlaneGeometry(120, 1.2), new THREE.MeshStandardMaterial({ map: raitaTx, roughness: 0.8, side: THREE.DoubleSide }));
    markiisi.position.set(6, 8.2, -15.4); markiisi.rotation.x = 0.5; scene.add(markiisi);

    const kyltti = (teksti, x, z, vari) => {
      const k = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.8), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri([teksti], "#ffffff", vari, 512, 102) }));
      k.position.set(x, 3.9, z); scene.add(k); return k;
    };

    /* ---------- HYGIENIASULKU (x -24) ---------- */
    kyltti("HYGIENIASULKU", -24, -15.75, "#5bb89a");
    const allas = laatikko(3, 0.9, 1, teras); allas.position.set(-24, 0.45, -13.5); scene.add(allas);
    [-25, -23].forEach((x) => { const h = sylinteri(0.04, 0.04, 0.5, teras, 8); h.position.set(x, 1.15, -13.8); scene.add(h); const n = laatikko(0.06, 0.06, 0.3, teras); n.position.set(x, 1.38, -13.65); scene.add(n); });
    const peili = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ color: 0xdff1ff })); peili.position.set(-24, 2.3, -15.75); scene.add(peili);
    for (let i = 0; i < 4; i++) {
      const naulakko = sylinteri(0.03, 0.03, 0.3, teras, 6); naulakko.rotation.x = Math.PI / 2; naulakko.position.set(-27.6 + i * 0.6, 2.1, -15.6); scene.add(naulakko);
      const takki = laatikko(0.45, 1.1, 0.12, valkoinen); takki.position.set(-27.6 + i * 0.6, 1.5, -15.5); scene.add(takki);
    }
    const saippua = laatikko(0.18, 0.3, 0.12, mansikka); saippua.position.set(-22.6, 1.05, -13.3); scene.add(saippua);
    const kuplat = [];
    for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (i % 3) * 0.03, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1 })); b.position.set(-24 + (i % 5) * 0.3 - 0.6, 1.2, -13.4); scene.add(b); kuplat.push(b); }

    /* ---------- LEIPOMO (x -12) ---------- */
    kyltti("LEIPOMO", -12, -15.75, "#e07a3c");
    const uuni = laatikko(3.4, 2.6, 1.6, valkoinen); uuni.position.set(-13, 1.3, -14.2); scene.add(uuni);
    const luukku = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), hehku(0xff9a3c, 1.1)); luukku.position.set(-13, 1.5, -13.39); scene.add(luukku);
    const poyta = laatikko(4, 0.12, 1.6, mat(0xd8a978, { roughness: 0.7 })); poyta.position.set(-10.5, 0.95, -11.2); scene.add(poyta);
    [[-12.3, -11.8], [-8.7, -11.8], [-12.3, -10.6], [-8.7, -10.6]].forEach(([x, z]) => { const j = laatikko(0.1, 0.9, 0.1, teras); j.position.set(x, 0.45, z); scene.add(j); });
    const kulho = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), teras); kulho.position.set(-11.6, 1.6, -11.2); scene.add(kulho);
    const massa = new THREE.Mesh(new THREE.SphereGeometry(0.52, 18, 10), mat(0xe9c58f, { roughness: 0.95 })); massa.scale.y = 0.35; massa.position.set(-11.6, 1.45, -11.2); scene.add(massa);
    const vispila = new THREE.Group(); const vv = sylinteri(0.03, 0.03, 0.9, teras, 6); vv.position.y = 0.45; vispila.add(vv); vispila.position.set(-11.6, 1.3, -11.2); scene.add(vispila);
    const pellit = [];
    for (let i = 0; i < 6; i++) { const p = laatikko(0.5, 0.12, 0.22, karamelli); p.position.set(-10.3 + (i % 3) * 0.6, 1.08, -11.5 + Math.floor(i / 3) * 0.5); scene.add(p); pellit.push(p); }
    const vaaka = laatikko(0.5, 0.12, 0.4, mat(V.mansikka)); vaaka.position.set(-9.1, 1.07, -10.9); scene.add(vaaka);

    /* ---------- MEIJERI (x 0) ---------- */
    kyltti("MEIJERI", 0, -15.75, "#5b9be1");
    const sailiot = [];
    [-1.6, 1.6].forEach((x, i) => {
      const s = sylinteri(1.1, 1.1, 3.6, teras, 24); s.position.set(x, 2.2, -13.4); scene.add(s);
      const kansi = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), teras); kansi.position.set(x, 4.0, -13.4); scene.add(kansi);
      const jalka = sylinteri(0.9, 1.0, 0.4, teras, 20); jalka.position.set(x, 0.2, -13.4); scene.add(jalka);
      const raita = sylinteri(1.12, 1.12, 0.3, mat(i ? V.mansikka : V.mustikka), 24); raita.position.set(x, 2.8, -13.4); scene.add(raita);
      sailiot.push(s);
    });
    const putki = sylinteri(0.12, 0.12, 3.2, teras, 10); putki.rotation.z = Math.PI / 2; putki.position.set(0, 3.4, -13.4); scene.add(putki);
    const lampoC = document.createElement("canvas"); lampoC.width = 256; lampoC.height = 128;
    const lampoTx = new THREE.CanvasTexture(lampoC); lampoTx.colorSpace = THREE.SRGBColorSpace;
    function piirraLampo(arvo) {
      const g = lampoC.getContext("2d");
      g.fillStyle = "#16324f"; g.fillRect(0, 0, 256, 128);
      g.fillStyle = arvo >= 72 ? "#8ce99a" : "#ffd166"; g.font = "bold 64px 'Segoe UI', Arial"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(arvo + " °C", 128, 66); lampoTx.needsUpdate = true;
    }
    piirraLampo(68);
    const lampo = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshBasicMaterial({ map: lampoTx })); lampo.position.set(0, 1.9, -12.6); scene.add(lampo);
    const lampoTausta = laatikko(1.25, 0.7, 0.08, valkoinen); lampoTausta.position.set(0, 1.9, -12.66); scene.add(lampoTausta);
    const lampoJalka = sylinteri(0.05, 0.05, 1.5, teras, 8); lampoJalka.position.set(0, 0.8, -12.7); scene.add(lampoJalka);
    for (let i = 0; i < 5; i++) { const pullo = sylinteri(0.14, 0.14, 0.5, valkoinen, 12); pullo.position.set(2.8 + i * 0.35, 0.25, -11.8); scene.add(pullo); const k = sylinteri(0.08, 0.08, 0.1, mat(V.mustikka), 10); k.position.set(2.8 + i * 0.35, 0.55, -11.8); scene.add(k); }

    /* ---------- LABORATORIO (x 12) ---------- */
    kyltti("LABORATORIO", 12, -15.75, "#9775fa");
    const labPoyta = laatikko(4.4, 0.1, 1.5, valkoinen); labPoyta.position.set(12, 0.95, -13.4); scene.add(labPoyta);
    const labKaappi = laatikko(4.4, 0.9, 1.5, minttu); labKaappi.position.set(12, 0.45, -13.4); scene.add(labKaappi);
    const mikro = new THREE.Group();
    const mJ = laatikko(0.5, 0.08, 0.4, valkoinen); mikro.add(mJ);
    const mV = laatikko(0.12, 0.7, 0.12, valkoinen); mV.position.set(0, 0.35, -0.12); mikro.add(mV);
    const mP = sylinteri(0.07, 0.07, 0.4, mat(0x343a40), 10); mP.position.set(0, 0.62, 0.02); mP.rotation.x = 0.5; mikro.add(mP);
    mikro.position.set(10.6, 1.04, -13.4); scene.add(mikro);
    const putket = [];
    [V.mansikka, V.sitruuna, V.pistaasi, V.mustikka, V.karamelli].forEach((v, i) => {
      const lasi = sylinteri(0.07, 0.07, 0.5, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.1 }), 10); lasi.position.set(11.8 + i * 0.25, 1.25, -13.6); scene.add(lasi);
      const neste = sylinteri(0.06, 0.06, 0.28, mat(v, { roughness: 0.3 }), 10); neste.position.set(11.8 + i * 0.25, 1.14, -13.6); scene.add(neste); putket.push(neste);
    });
    for (let i = 0; i < 3; i++) { const m = sylinteri(0.22, 0.22, 0.05, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }), 20); m.position.set(13.4 + i * 0.5, 1.03, -13.1); scene.add(m); const pa = sylinteri(0.12, 0.12, 0.02, mat(V.karamelli), 12); pa.position.set(13.4 + i * 0.5, 1.06, -13.1); scene.add(pa); }
    const labNaytto = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: kayraTekstuuri("#ff6b8b", 1.7) })); labNaytto.position.set(12.6, 1.75, -14.0); scene.add(labNaytto);

    /* ---------- TUOTEKEHITYS (x 24) ---------- */
    kyltti("TUOTEKEHITYS", 24, -15.75, "#e8487a");
    const pyorea = sylinteri(1.6, 1.6, 0.1, valkoinen, 32); pyorea.position.set(24, 0.95, -12.6); scene.add(pyorea);
    const jalkaP = sylinteri(0.15, 0.4, 0.9, teras, 12); jalkaP.position.set(24, 0.45, -12.6); scene.add(jalkaP);
    const marjat = [];
    [[23.3, -12.2, V.mansikka], [24.6, -12.0, V.mustikka], [24.2, -13.2, V.pistaasi]].forEach(([x, z, v]) => {
      const kuppi = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), valkoinen); kuppi.position.set(x, 1.32, z); scene.add(kuppi);
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(v, { roughness: 0.4 })); m.position.set(x + Math.cos(i) * 0.14, 1.27 + (i % 2) * 0.05, z + Math.sin(i) * 0.14); scene.add(m); marjat.push(m); }
    });
    for (let i = 0; i < 4; i++) { const p = laatikko(0.45, 0.12, 0.18, i % 2 ? karamelli : mansikka); p.position.set(23.4 + i * 0.42, 1.06, -13.4 + (i % 2) * 0.2); p.rotation.y = 0.3 * (i - 1.5); scene.add(p); }
    const taulu = laatikko(3.2, 2, 0.08, valkoinen); taulu.position.set(24, 2.6, -15.6); scene.add(taulu);
    const lapVarit = [V.mansikka, V.sitruuna, V.pistaasi, V.mustikka, V.persikka];
    for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ color: lapVarit[i % 5] })); l.position.set(22.9 + (i % 5) * 0.55, 2.2 + Math.floor(i / 5) * 0.65, -15.54); l.rotation.z = ((i * 31) % 7 - 3) * 0.03; scene.add(l); }

    /* ---------- PAKKAUSLINJA (x 36) ---------- */
    kyltti("PAKKAUS", 36, -15.75, "#c2255c");
    const hihna = laatikko(10, 0.2, 1.2, mat(0x5b5f66, { roughness: 0.8 })); hihna.position.set(36, 1.0, -12.6); scene.add(hihna);
    [-0.65, 0.65].forEach((z) => { const r = laatikko(10, 0.15, 0.1, mat(V.mansikka)); r.position.set(36, 1.15, -12.6 + z); scene.add(r); });
    for (let x = 31.5; x <= 40.5; x += 3) [-0.5, 0.5].forEach((z) => { const j = laatikko(0.12, 0.95, 0.12, teras); j.position.set(x, 0.48, -12.6 + z); scene.add(j); });
    const kone = laatikko(1.8, 2, 1.8, valkoinen); kone.position.set(38.5, 1.9, -12.6); scene.add(kone);
    const koneIkkuna = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ color: 0xbfe8ff })); koneIkkuna.position.set(38.5, 2.2, -11.69); scene.add(koneIkkuna);
    const merkkivalo = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), hehku(0x51cf66, 2)); merkkivalo.position.set(38.5, 3.05, -12.6); scene.add(merkkivalo);
    const patukat = [];
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Group();
      const kaare = laatikko(0.7, 0.16, 0.3, mansikka); p.add(kaare);
      const raita = laatikko(0.2, 0.17, 0.31, mat(V.vanilja)); p.add(raita);
      p.position.set(31.5 + i * 1.0, 1.2, -12.6); scene.add(p); patukat.push(p);
    }
    for (let i = 0; i < 6; i++) { const lt = laatikko(0.9, 0.6, 0.6, mat(0xd8a978, { roughness: 0.9 })); lt.position.set(41.8 + (i % 2) * 0.95, 0.3 + Math.floor(i / 2) * 0.62, -13.6); scene.add(lt); }

    /* ---------- JÄTTIMARJAPALA keskellä ---------- */
    const jatti = new THREE.Group();
    const pohja = laatikko(3.2, 0.9, 1.3, mat(0xe2b06e, { roughness: 0.9 })); jatti.add(pohja);
    const kuorrute = laatikko(3.25, 0.25, 1.35, mat(0xffe3ec, { roughness: 0.4 })); kuorrute.position.y = 0.55; jatti.add(kuorrute);
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(V.mansikka, { roughness: 0.35 })); m.scale.set(1, 1.2, 1); m.position.set(-1.3 + i * 0.43, 0.75, (i % 2 ? 0.25 : -0.25)); jatti.add(m); }
    const sprinklet = [];
    const sVarit = [V.mansikka, V.sitruuna, V.pistaasi, V.mustikka, 0xffffff];
    for (let i = 0; i < 26; i++) { const s = laatikko(0.14, 0.04, 0.04, mat(sVarit[i % 5])); s.position.set(-1.5 + (i * 0.37) % 3, 0.69, -0.55 + (i * 0.53) % 1.1); s.rotation.y = i; jatti.add(s); sprinklet.push(s); }
    jatti.position.set(6, 5.2, -7); scene.add(jatti);
    const jattiValo = new THREE.PointLight(0xffb3c6, 10, 14, 1.5); jattiValo.position.set(6, 7, -4); scene.add(jattiValo);

    /* Juhlasprinklet (loppu) */
    const konf = hiukkaset(240, 0xffffff, 0.16);
    const kv = new Float32Array(240 * 3);
    const kVarit = [V.mansikka, V.sitruuna, V.pistaasi, V.mustikka, V.karamelli].map((v) => new THREE.Color(v));
    for (let i = 0; i < 240; i++) { const c = kVarit[i % 5]; kv.set([c.r, c.g, c.b], i * 3); konf.pos.set([0 + Math.random() * 12, 1 + Math.random() * 8, -12 + Math.random() * 10], i * 3); konf.nopeus[i] = 0.5 + Math.random(); }
    konf.points.geometry.setAttribute("color", new THREE.BufferAttribute(kv, 3));
    konf.points.material.vertexColors = true; konf.points.material.blending = THREE.NormalBlending;
    konf.points.visible = false; scene.add(konf.points);

    /* Kasveja ja korikeinuja tuomaan kodikkuutta */
    [[-30, -13], [-18, -13.5], [6, -14.5], [18, -14], [30, -14]].forEach(([x, z], i) => {
      const r = sylinteri(0.35, 0.28, 0.6, mat(i % 2 ? V.persikka : V.minttu), 14); r.position.set(x, 0.3, z); scene.add(r);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.65, 14, 10), pistaasi); l.position.set(x, 1.15, z); scene.add(l);
    });

    /* ---------- TILA ---------- */
    const tila = { loppu: false, lampoOk: false, linjaSeis: false };
    function asetaTila(t) {
      tila.loppu = !!t.loppu; tila.lampoOk = !!t.lampoOk; tila.linjaSeis = !!t.linjaSeis;
      piirraLampo(tila.lampoOk ? 72 : 68);
      konf.points.visible = tila.loppu;
      merkkivalo.material.emissive.setHex(tila.linjaSeis ? 0xff4d4d : 0x51cf66);
    }
    let hihnaX = 0;
    function paivita(dt, t) {
      jatti.rotation.y = Math.sin(t * 0.4) * 0.5 + 0.3;
      jatti.position.y = 5.2 + Math.sin(t * 1.1) * 0.18;
      vispila.rotation.y = t * 5;
      vispila.position.x = -11.6 + Math.sin(t * 3) * 0.08;
      luukku.material.emissiveIntensity = 1.0 + Math.sin(t * 2) * 0.25;
      kuplat.forEach((b, i) => { const y = ((t * 0.4 + i * 0.13) % 1.3); b.position.y = 1.1 + y; b.material.opacity = 0.6 * (1 - y / 1.3); });
      putket.forEach((p, i) => { p.scale.y = 1 + Math.sin(t * 1.5 + i) * 0.08; });
      if (!tila.linjaSeis) {
        hihnaX = (hihnaX + dt * 0.8) % 1;
        patukat.forEach((p, i) => { p.position.x = 31.5 + ((i + hihnaX) % 9); p.visible = p.position.x < 38.0 || p.position.x > 39.2; });
      }
      merkkivalo.material.emissiveIntensity = tila.linjaSeis ? (Math.sin(t * 8) > 0 ? 3 : 0.3) : 2;
      if (konf.points.visible) {
        for (let i = 0; i < 240; i++) {
          let y = konf.pos[i * 3 + 1] - konf.nopeus[i] * dt;
          if (y < 0.1) y = 9;
          konf.pos[i * 3 + 1] = y;
        }
        konf.points.geometry.attributes.position.needsUpdate = true;
      }
    }

    const kohtaukset = {
      kansi:       { kamera: [-3, 3.6, 4],    kohde: [4, 4.6, -8],     tila: {} },
      yleis:       { kamera: [6, 6.5, 14],    kohde: [6, 3, -10],      tila: {} },
      hygienia:    { kamera: [-24, 2.4, -8],  kohde: [-24.5, 1.6, -14.5], tila: {} },
      leipomo:     { kamera: [-10.5, 2.8, -6.8], kohde: [-11.5, 1.3, -12.4], tila: {} },
      meijeri:     { kamera: [0.5, 2.4, -8],  kohde: [0, 2.2, -13.4],  tila: {} },
      laboratorio: { kamera: [12.2, 2.3, -9.6], kohde: [12.2, 1.3, -13.6], tila: {} },
      kehitys:     { kamera: [24, 3.0, -8.6], kohde: [24, 1.3, -13],   tila: {} },
      pakkaus:     { kamera: [34, 2.8, -7.8], kohde: [37, 1.3, -12.6], tila: { linjaSeis: true } },
      loppu:       { kamera: [6, 4.2, -0.5],  kohde: [6, 5, -7],       tila: { loppu: true, lampoOk: true } }
    };
    return { kohtaukset, oletus: "yleis", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     KAUPPA – "Ostajana muotimessuilla": vaalea messuhalli ja catwalk
     Osastot: trendiseinä ja farkkuosasto vasemmalla takana, vastuullisuus ja
     Kolibrin osasto oikealla takana, varasto vasemmalla edessä, kuvausstudio
     oikealla edessä. Keskellä catwalk.
     ------------------------------------------------------------------------ */
  kauppa(scene) {
    const V = { kulta: 0xf3c969, koralli: 0xff7f8e, musta: 0x1b1820, denim: 0x3d5a98, vaaleaDenim: 0x7d9bd1, vihrea: 0x6fbf73, minttu: 0xbfe8d8, laventeli: 0xc9b8ff, persikka: 0xffc8a8, valko: 0xfaf8f5 };
    const BG = 0xf4efe9;
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 28, 85);

    const valko = mat(V.valko, { metalness: 0.05, roughness: 0.6 });
    const musta = mat(V.musta, { metalness: 0.3, roughness: 0.5 });
    const kulta = mat(V.kulta, { metalness: 0.7, roughness: 0.3 });
    const metalli = mat(0xc9ccd2, { metalness: 0.6, roughness: 0.35 });
    const pahvi = mat(0xc89b6a, { metalness: 0.0, roughness: 0.9 });

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe9dccf, 1.6));
    const aur = new THREE.DirectionalLight(0xfff6e8, 1.2); aur.position.set(8, 24, 14); scene.add(aur);

    /* Lattia (kiiltävä), takaseinä, kattoristikko */
    const lattia = new THREE.Mesh(new THREE.PlaneGeometry(140, 80), mat(0xf6efe6, { metalness: 0.1, roughness: 0.4 }));
    lattia.rotation.x = -Math.PI / 2; lattia.position.z = -6; scene.add(lattia);
    const seina = laatikko(140, 12, 0.4, mat(0xe6ddd3, { roughness: 0.9 })); seina.position.set(0, 6, -20); scene.add(seina);
    const banneri = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["MUOTIMESSUT · KEVÄT"], "#f3c969", "#1b1820", 1024, 154) }));
    banneri.position.set(0, 9, -19.75); scene.add(banneri);
    for (let x = -36; x <= 36; x += 6) { const p = laatikko(0.18, 0.18, 30, metalli); p.position.set(x, 11, -6); scene.add(p); }
    const kohdevalot = [];
    for (let x = -30; x <= 30; x += 10) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.45, 12), musta); v.position.set(x, 10.6, -6); scene.add(v);
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), hehku(0xfff3d6, 2)); h.rotation.x = Math.PI / 2; h.position.set(x, 10.36, -6); scene.add(h); kohdevalot.push(h);
    }

    /* ---------- Apuvälineet ---------- */
    function vaateteline(x, z, varit, rot) {
      const g = new THREE.Group();
      const tanko = sylinteri(0.03, 0.03, 2.4, metalli, 8); tanko.rotation.z = Math.PI / 2; tanko.position.y = 1.7; g.add(tanko);
      [-1.2, 1.2].forEach((px) => { const j = sylinteri(0.03, 0.03, 1.7, metalli, 8); j.position.set(px, 0.85, 0); g.add(j); const k = laatikko(0.5, 0.04, 0.5, metalli); k.position.set(px, 0.02, 0); g.add(k); });
      varit.forEach((v, i) => {
        const vaate = laatikko(0.08, 1.0, 0.55, mat(v, { roughness: 0.85 })); vaate.position.set(-1.0 + i * (2.0 / Math.max(1, varit.length - 1)), 1.15, 0); g.add(vaate);
        const ripustin = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 10, Math.PI), metalli); ripustin.position.set(vaate.position.x, 1.72, 0); ripustin.rotation.y = Math.PI / 2; g.add(ripustin);
      });
      g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g;
    }
    function mallinukke(x, z, ylavari, alavari, rot) {
      const g = new THREE.Group();
      const jalusta = sylinteri(0.35, 0.4, 0.08, musta, 20); g.add(jalusta);
      const tanko = sylinteri(0.03, 0.03, 0.6, metalli, 8); tanko.position.y = 0.35; g.add(tanko);
      const ala = sylinteri(0.2, 0.26, 0.9, mat(alavari, { roughness: 0.85 }), 14); ala.position.y = 1.0; g.add(ala);
      const yla = sylinteri(0.3, 0.22, 0.75, mat(ylavari, { roughness: 0.85 }), 14); yla.position.y = 1.8; g.add(yla);
      const kaula = sylinteri(0.06, 0.07, 0.15, valko, 10); kaula.position.y = 2.25; g.add(kaula);
      const paa = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), valko); paa.scale.y = 1.2; paa.position.y = 2.48; g.add(paa);
      g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g;
    }
    function osasto(x, z, vari, teksti, tekstiVari, leveys) {
      const L = leveys || 8;
      const taka = laatikko(L, 4, 0.2, mat(vari, { roughness: 0.85 })); taka.position.set(x, 2, z - 2.5); scene.add(taka);
      [-L / 2, L / 2].forEach((dx) => { const s = laatikko(0.2, 4, 5, mat(vari, { roughness: 0.85 })); s.position.set(x + dx, 2, z); scene.add(s); });
      const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.6, 0.9), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri([teksti], tekstiVari || "#ffffff", "#1b1820", 768, 115) }));
      kyltti.position.set(x, 4.6, z - 2.35); scene.add(kyltti);
      const kehys = laatikko(L * 0.6 + 0.1, 1.0, 0.1, kulta); kehys.position.set(x, 4.6, z - 2.42); scene.add(kehys);
    }

    /* ---------- CATWALK keskellä ---------- */
    const catwalk = laatikko(3.2, 0.5, 16, valko); catwalk.position.set(0, 0.25, -7); scene.add(catwalk);
    const reunavalot = [];
    [-1.62, 1.62].forEach((dx) => { const r = laatikko(0.06, 0.08, 16, hehku(V.kulta, 1.6)); r.position.set(dx, 0.48, -7); scene.add(r); reunavalot.push(r); });
    const nukkeCat = [mallinukke(0, -12.5, V.koralli, V.musta), mallinukke(0, -8.5, V.vaaleaDenim, V.valko), mallinukke(0, -4.5, V.kulta, V.denim)];
    nukkeCat.forEach((n) => { n.position.y = 0.5; });
    for (let i = 0; i < 2; i++) for (let k = 0; k < 6; k++) {
      [-3.4, 3.4].forEach((dx) => { const t = laatikko(0.5, 0.45, 0.5, mat(i ? V.laventeli : V.koralli, { roughness: 0.9 })); t.position.set(dx + Math.sign(dx) * i * 0.9, 0.23, -12 + k * 1.6); scene.add(t); });
    }

    /* ---------- TRENDISEINÄ (vasen takana) ---------- */
    const trendiTx = (() => {
      const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d");
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, 1024, 512);
      const varit = ["#ff7f8e", "#f3c969", "#8ec5ff", "#8ce99a", "#c9b8ff", "#ffc8a8", "#3d5a98", "#1b1820"];
      for (let i = 0; i < 16; i++) { g.fillStyle = varit[i % 8]; g.fillRect(40 + (i % 8) * 120, 60 + Math.floor(i / 8) * 200, 100, 150); }
      g.fillStyle = "#1b1820"; g.font = "bold 40px 'Segoe UI', Arial"; g.fillText("KEVÄÄN TRENDIT", 40, 470);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
    })();
    const trendiSeina = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: trendiTx })); trendiSeina.position.set(-24, 3.2, -19.7); scene.add(trendiSeina);
    const tabletti = laatikko(0.9, 0.6, 0.04, musta); tabletti.position.set(-23, 1.3, -15.5); tabletti.rotation.x = -0.6; scene.add(tabletti);
    const tablettiRuutu = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ map: kayraTekstuuri("#ff7f8e", 2.2) })); tablettiRuutu.position.set(-23, 1.32, -15.48); tablettiRuutu.rotation.x = -0.6; scene.add(tablettiRuutu);
    const jalka = sylinteri(0.04, 0.04, 1.1, metalli, 8); jalka.position.set(-23, 0.6, -15.7); scene.add(jalka);

    /* ---------- FARKKUOSASTO ---------- */
    osasto(-12, -15, 0xaec6f2, "DENIM", "#8ec5ff");
    vaateteline(-13.6, -15.6, [V.denim, V.vaaleaDenim, V.denim, 0x24365e, V.vaaleaDenim, V.denim]);
    vaateteline(-10.4, -15.6, [V.vaaleaDenim, V.denim, 0x24365e, V.vaaleaDenim, V.denim, V.vaaleaDenim]);
    const tiski = laatikko(2.4, 1.0, 0.8, musta); tiski.position.set(-12, 0.5, -12.6); scene.add(tiski);
    const tiskiKansi = laatikko(2.5, 0.06, 0.9, kulta); tiskiKansi.position.set(-12, 1.03, -12.6); scene.add(tiskiKansi);
    for (let i = 0; i < 4; i++) { const pino = laatikko(0.45, 0.08 + i * 0.02, 0.35, mat(i % 2 ? V.denim : V.vaaleaDenim)); pino.position.set(-12.8 + i * 0.5, 1.1, -12.6); scene.add(pino); }

    /* ---------- VASTUULLISUUS (oikealla takana) ---------- */
    osasto(12, -15, 0xb5e3bd, "REILU · LUOMU", "#8ce99a");
    const rullat = [];
    [V.minttu, V.valko, V.vihrea, V.persikka, 0xe9e3d3].forEach((v, i) => { const r = sylinteri(0.22, 0.22, 1.6, mat(v, { roughness: 0.9 }), 16); r.rotation.z = Math.PI / 2; r.position.set(12, 0.3 + (i % 3) * 0.46, -16 + Math.floor(i / 3) * 0.5); scene.add(r); rullat.push(r); });
    vaateteline(14.5, -14.2, [V.valko, V.minttu, V.valko, V.vihrea, V.valko], Math.PI / 2);
    const sertTx = tekstiTekstuuri(["✓ LUOMU", "✓ REILU TYÖ"], "#2b8a3e", "#ffffff", 512, 320);
    const sert = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshBasicMaterial({ map: sertTx })); sert.position.set(9.6, 2.4, -17.35); scene.add(sert);

    /* ---------- KOLIBRIN OSASTO (somistus) ---------- */
    osasto(23, -15, 0xffb8c3, "KOLIBRI", "#ff7f8e");
    const nuket = [mallinukke(21.5, -15.5, V.koralli, V.denim, 0.2), mallinukke(24.5, -15.5, V.kulta, V.valko, -0.2)];
    const koroke = laatikko(5, 0.2, 2, valko); koroke.position.set(23, 0.1, -15.5); scene.add(koroke);
    nuket.forEach((n) => { n.position.y = 0.2; });
    const kassit = [];
    [V.koralli, V.kulta, V.musta].forEach((v, i) => { const k = laatikko(0.5, 0.6, 0.2, mat(v, { roughness: 0.6 })); k.position.set(25.6 + i * 0.4, 0.3, -12.6 + (i % 2) * 0.3); k.rotation.y = i * 0.4; scene.add(k); kassit.push(k); });

    /* ---------- KUVAUSSTUDIO (oikealla edessä) ---------- */
    const tausta = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4, 24, 1, true, Math.PI * 0.75, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide }));
    tausta.position.set(22, 2, 5); scene.add(tausta);
    const studioLattia = new THREE.Mesh(new THREE.CircleGeometry(3, 24), valko); studioLattia.rotation.x = -Math.PI / 2; studioLattia.position.set(22, 0.02, 5); scene.add(studioLattia);
    const studioNukke = mallinukke(22, 3.6, V.laventeli, V.vaaleaDenim);
    const softboksit = [];
    [[19.5, 6.5], [24.5, 6.5]].forEach(([x, z]) => {
      const j = sylinteri(0.03, 0.03, 2.4, musta, 8); j.position.set(x, 1.2, z); scene.add(j);
      const b = laatikko(0.9, 0.9, 0.3, musta); b.position.set(x, 2.5, z); b.lookAt(22, 2, 3.6); scene.add(b);
      const e = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), hehku(0xffffff, 1.8)); e.position.set(x, 2.5, z); e.lookAt(22, 2.5, 3.6); e.translateZ(0.16); scene.add(e); softboksit.push(e);
    });
    const kamera = new THREE.Group();
    const runko = laatikko(0.35, 0.25, 0.2, musta); runko.position.y = 1.55; kamera.add(runko);
    const objektiivi = sylinteri(0.08, 0.08, 0.22, musta, 12); objektiivi.rotation.x = Math.PI / 2; objektiivi.position.set(0, 1.55, -0.2); kamera.add(objektiivi);
    [0, 2.1, 4.2].forEach((a) => { const l = sylinteri(0.02, 0.02, 1.5, metalli, 6); l.position.set(Math.sin(a) * 0.25, 0.72, Math.cos(a) * 0.25); l.rotation.set(Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18); kamera.add(l); });
    kamera.position.set(22, 0, 8.2); scene.add(kamera);
    const salama = new THREE.PointLight(0xffffff, 0, 10, 1.5); salama.position.set(22, 2.5, 6.5); scene.add(salama);

    /* ---------- VARASTO (vasen edessä) ---------- */
    for (let h = 0; h < 2; h++) {
      const hx = -24 + h * 4.2;
      [-1.5, 1.5].forEach((dx) => { const p = laatikko(0.1, 3.4, 0.1, mat(0x3b6fd1)); p.position.set(hx + dx, 1.7, 3.2); scene.add(p); const p2 = p.clone(); p2.position.z = 4.4; scene.add(p2); });
      for (let t = 0; t < 3; t++) {
        const taso = laatikko(3.2, 0.08, 1.3, mat(0xf08c00)); taso.position.set(hx, 0.4 + t * 1.2, 3.8); scene.add(taso);
        for (let b = 0; b < 3; b++) { if ((h + t + b) % 4 === 3) continue; const lt = laatikko(0.85, 0.7, 0.9, pahvi); lt.position.set(hx - 1 + b * 1.0, 0.8 + t * 1.2, 3.8); scene.add(lt); }
      }
    }
    const lava = laatikko(1.2, 0.15, 1.0, mat(0xd2a26a)); lava.position.set(-17.5, 0.08, 6.5); scene.add(lava);
    const lavaLaatikot = [];
    for (let i = 0; i < 4; i++) { const lt = laatikko(0.5, 0.45, 0.45, pahvi); lt.position.set(-17.75 + (i % 2) * 0.52, 0.38 + Math.floor(i / 2) * 0.46, 6.5); scene.add(lt); lavaLaatikot.push(lt); }
    const lista = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), new THREE.MeshBasicMaterial({ color: 0xffffff })); lista.position.set(-17.5, 1.0, 6.75); scene.add(lista);
    const varoitusValo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), hehku(0xffa94d, 0)); varoitusValo.position.set(-17.5, 1.4, 6.5); scene.add(varoitusValo);

    /* Kultakonfetti (loppu) */
    const konf = hiukkaset(260, 0xffffff, 0.14);
    const kv = new Float32Array(260 * 3);
    const kVarit = [V.kulta, V.koralli, 0xffffff, V.laventeli, V.kulta].map((v) => new THREE.Color(v));
    for (let i = 0; i < 260; i++) { const c = kVarit[i % 5]; kv.set([c.r, c.g, c.b], i * 3); konf.pos.set([-5 + Math.random() * 10, 1 + Math.random() * 9, -15 + Math.random() * 12], i * 3); konf.nopeus[i] = 0.6 + Math.random(); }
    konf.points.geometry.setAttribute("color", new THREE.BufferAttribute(kv, 3));
    konf.points.material.vertexColors = true; konf.points.material.blending = THREE.NormalBlending;
    konf.points.visible = false; scene.add(konf.points);

    /* ---------- TILA ---------- */
    const tila = { loppu: false, kuvaus: false, puute: false };
    function asetaTila(t) {
      tila.loppu = !!t.loppu; tila.kuvaus = !!t.kuvaus; tila.puute = !!t.puute;
      konf.points.visible = tila.loppu;
    }
    function paivita(dt, t) {
      reunavalot.forEach((r, i) => { r.material.emissiveIntensity = 1.3 + Math.sin(t * 2 + i) * 0.4; });
      kohdevalot.forEach((h, i) => { h.material.emissiveIntensity = 1.6 + Math.sin(t * 1.3 + i) * 0.4; });
      nukkeCat.forEach((n, i) => { n.rotation.y = Math.sin(t * 0.5 + i * 2) * 0.6; });
      studioNukke.rotation.y = Math.sin(t * 0.4) * 0.4;
      salama.intensity = tila.kuvaus && (t % 2.4) < 0.12 ? 30 : 0;
      softboksit.forEach((e) => { e.material.emissiveIntensity = tila.kuvaus && (t % 2.4) < 0.12 ? 4 : 1.8; });
      varoitusValo.material.emissiveIntensity = tila.puute ? (Math.sin(t * 6) > 0 ? 3 : 0.3) : 0;
      tablettiRuutu.material.map.offset.x = (t * 0.05) % 1;
      if (konf.points.visible) {
        for (let i = 0; i < 260; i++) {
          let y = konf.pos[i * 3 + 1] - konf.nopeus[i] * dt;
          if (y < 0.6) y = 10;
          konf.pos[i * 3 + 1] = y; konf.pos[i * 3] += Math.sin(t * 1.5 + i) * dt * 0.25;
        }
        konf.points.geometry.attributes.position.needsUpdate = true;
      }
    }
    tablettiRuutu.material.map.wrapS = THREE.RepeatWrapping;

    const kohtaukset = {
      kansi:    { kamera: [3, 2.2, 6],      kohde: [20, 1.8, -12],   tila: {} },
      halli:    { kamera: [0, 7, 16],       kohde: [0, 2.6, -10],    tila: {} },
      trendit:  { kamera: [-22.5, 2.6, -9], kohde: [-24, 2.8, -19.5], tila: {} },
      edustaja: { kamera: [-11, 2.6, -6.5], kohde: [-12, 1.5, -15],  tila: {} },
      vastuu:   { kamera: [11.5, 2.6, -7],  kohde: [12, 1.4, -16],   tila: {} },
      somistus: { kamera: [22, 2.8, -7.5],  kohde: [23, 1.6, -15.5], tila: {} },
      verkko:   { kamera: [19, 2.6, 12.5],  kohde: [22, 1.6, 4],     tila: { kuvaus: true } },
      varasto:  { kamera: [-15.5, 2.4, 11], kohde: [-20, 1.4, 4],    tila: { puute: true } },
      loppu:    { kamera: [0, 2.4, 4],      kohde: [0, 2.2, -12],    tila: { loppu: true } }
    };
    return { kohtaukset, oletus: "halli", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     LUONTO – "Mysteeri joella": Lapin jokilaakso ruskan aikaan
     Joki virtaa tunturilta (kaukana takana) kohti katsojaa. Hakkuuaukean oja
     tuo mutaa jokeen. Lopussa tulee talvi ja lunta.
     ------------------------------------------------------------------------ */
  luonto(scene) {
    const V = { kuusi: 0x2f5d3a, kuusiTumma: 0x234a2e, ruska1: 0xe8892e, ruska2: 0xd2452b, ruska3: 0xf2b84b, sammal: 0x8fa65a, kanerva: 0x9c5a4a, kivi: 0x9a9a92, vesi: 0x5b9bd5, muta: 0x8b5a2b, tunturi: 0xb9875a, punainen: 0xa83a2a };
    const BG = 0xf6dccb;
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 50, 170);

    scene.add(new THREE.HemisphereLight(0xfff0e0, 0x7a6a4a, 1.5));
    const aur = new THREE.DirectionalLight(0xffd2a8, 1.6); aur.position.set(-30, 18, -20); scene.add(aur);

    const maaMat = mat(0xa89662, { metalness: 0, roughness: 1 });
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), maaMat); maa.rotation.x = -Math.PI / 2; maa.position.z = -40; scene.add(maa);
    /* Ruskalaikut */
    const laikut = [];
    for (let i = 0; i < 70; i++) {
      const v = [V.ruska1, V.ruska2, V.sammal, V.kanerva, V.ruska3][i % 5];
      const l = new THREE.Mesh(new THREE.CircleGeometry(2 + (i * 7) % 5, 10), mat(v, { roughness: 1 }));
      l.rotation.x = -Math.PI / 2; l.position.set(-60 + (i * 37) % 120, 0.02 + (i % 3) * 0.003, 20 - (i * 53) % 110); scene.add(l); laikut.push(l);
    }

    /* Tunturit */
    const tunturiMat = mat(V.tunturi, { roughness: 1, flatShading: true });
    [[-40, -110, 26, 20], [0, -125, 34, 26], [45, -112, 28, 18], [-80, -100, 22, 14], [85, -100, 24, 15]].forEach(([x, z, r, h]) => {
      const t = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7, 1), tunturiMat); t.position.set(x, h / 2 - 1, z); t.scale.z = 0.7; scene.add(t);
    });

    /* Joki: nauha käyrää pitkin */
    const jokiKayra = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -100), new THREE.Vector3(-6, 0, -75), new THREE.Vector3(4, 0, -55), new THREE.Vector3(0, 0, -38),
      new THREE.Vector3(-8, 0, -20), new THREE.Vector3(-2, 0, -4), new THREE.Vector3(6, 0, 10), new THREE.Vector3(2, 0, 30)]);
    const N = 160, pos = [], col = [], idx = [];
    const sininen = new THREE.Color(V.vesi), ruskea = new THREE.Color(0x9a7650);
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = jokiKayra.getPoint(t), tan = jokiKayra.getTangent(t);
      const nx = -tan.z, nz = tan.x, w = 2.2 + t * 1.4;
      pos.push(p.x + nx * w, 0.05, p.z + nz * w, p.x - nx * w, 0.05, p.z - nz * w);
      const muta = Math.max(0, Math.min(1, (t - 0.4) * 8)) * (1 - Math.max(0, t - 0.75) * 1.2);
      const c = sininen.clone().lerp(ruskea, muta * 0.85);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const jokiGeo = new THREE.BufferGeometry();
    jokiGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    jokiGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    jokiGeo.setIndex(idx); jokiGeo.computeVertexNormals();
    const jokiMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.0, side: THREE.DoubleSide });
    const joki = new THREE.Mesh(jokiGeo, jokiMat); scene.add(joki);
    const puhdasVari = col.slice();
    function jokiPuhdas(puhdas) {
      const c = jokiGeo.attributes.color;
      for (let i = 0; i < c.count; i++) {
        if (puhdas) c.setXYZ(i, sininen.r, sininen.g, sininen.b); else c.setXYZ(i, puhdasVari[i * 3], puhdasVari[i * 3 + 1], puhdasVari[i * 3 + 2]);
      }
      c.needsUpdate = true;
    }
    const jokiPiste = (t) => jokiKayra.getPoint(t);
    const lahellaJokea = (x, z, r) => { for (let i = 0; i <= 60; i++) { const p = jokiKayra.getPoint(i / 60); if ((p.x - x) ** 2 + (p.z - z) ** 2 < r * r) return true; } return false; };

    /* Puut */
    const kuusiMat = mat(V.kuusi, { roughness: 0.9, flatShading: true }), kuusiMat2 = mat(V.kuusiTumma, { roughness: 0.9, flatShading: true });
    const runkoMat = mat(0x5a4030, { roughness: 1 }), koivuRunko = mat(0xeeeae0, { roughness: 0.9 });
    const lumiLakit = [];
    const lumiMat = mat(0xffffff, { roughness: 0.8 });
    function kuusi(x, z, k) {
      const g = new THREE.Group();
      const r = sylinteri(0.12 * k, 0.16 * k, 0.8 * k, runkoMat, 6); r.position.y = 0.4 * k; g.add(r);
      [0, 1, 2].forEach((j) => {
        const c = new THREE.Mesh(new THREE.ConeGeometry((1.2 - j * 0.3) * k, (1.8 - j * 0.3) * k, 7), j % 2 ? kuusiMat2 : kuusiMat);
        c.position.y = (1.1 + j * 0.9) * k; g.add(c);
        const lumi = new THREE.Mesh(new THREE.ConeGeometry((0.9 - j * 0.25) * k, (0.6 - j * 0.1) * k, 7), lumiMat); lumi.position.y = (1.7 + j * 0.9) * k; lumi.visible = false; g.add(lumi); lumiLakit.push(lumi);
      });
      g.position.set(x, 0, z); scene.add(g);
    }
    const lehdet = [];
    function koivu(x, z, k, v) {
      const r = sylinteri(0.08 * k, 0.1 * k, 2 * k, koivuRunko, 6); r.position.set(x, k, z); scene.add(r);
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 * k, 0), mat(v, { roughness: 0.9, flatShading: true })); l.position.set(x, 2.3 * k, z); scene.add(l); lehdet.push(l);
    }
    let siemen = 7;
    const rnd = () => { siemen = (siemen * 9301 + 49297) % 233280; return siemen / 233280; };
    for (let i = 0; i < 260; i++) {
      const x = -70 + rnd() * 140, z = 25 - rnd() * 125;
      if (lahellaJokea(x, z, 6.5)) continue;
      if (x > 8 && x < 26 && z < -28 && z > -48) continue;   // hakkuuaukea
      if (x > 16 && x < 32 && z > -4 && z < 12) continue;     // kylä
      if (x < -8 && x > -22 && z < -2 && z > -14) continue;   // laavu
      const k = 0.8 + rnd() * 0.9;
      if (rnd() < 0.72) kuusi(x, z, k); else koivu(x, z, k * 0.9, [V.ruska1, V.ruska3, V.ruska2][i % 3]);
    }

    /* Kivet rannoilla */
    const kiviMat = mat(V.kivi, { roughness: 0.95, flatShading: true });
    for (let i = 0; i < 40; i++) {
      const t = (i * 0.023) % 1, p = jokiPiste(t), s = (i % 2 ? 1 : -1) * (3.6 + (i % 3));
      const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + (i % 4) * 0.15, 0), kiviMat); k.position.set(p.x + s, 0.2, p.z + (i % 5) - 2); k.rotation.set(i, i * 2, 0); scene.add(k);
    }

    /* ---------- RANTA: kuolleet kalat ---------- */
    const rantaP = jokiPiste(0.86);
    const kalat = [];
    for (let i = 0; i < 3; i++) {
      const kala = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), mat(0xb8c4cc, { metalness: 0.6, roughness: 0.3 })); kala.scale.set(1.8, 0.45, 0.6);
      kala.position.set(rantaP.x + 3.4 + i * 0.6, 0.15, rantaP.z + 1 + i * 0.5); kala.rotation.y = i; scene.add(kala); kalat.push(kala);
      const pyrsto = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), kala.material); pyrsto.rotation.z = Math.PI / 2; pyrsto.position.set(kala.position.x - 0.55, 0.15, kala.position.z); scene.add(pyrsto);
    }
    const laukku = laatikko(0.7, 0.45, 0.45, mat(0x3a8fd6)); laukku.position.set(rantaP.x + 5.6, 0.23, rantaP.z + 2.2); scene.add(laukku);

    /* ---------- NÄYTTEENOTTO ---------- */
    const nayteP = jokiPiste(0.72);
    const pakki = laatikko(0.9, 0.5, 0.6, mat(0xf08c00)); pakki.position.set(nayteP.x + 3.8, 0.25, nayteP.z); scene.add(pakki);
    for (let i = 0; i < 5; i++) { const pullo = sylinteri(0.09, 0.09, 0.4, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.2 }), 10); pullo.position.set(nayteP.x + 3.4 + i * 0.2, 0.7, nayteP.z); scene.add(pullo); }
    const keppi = sylinteri(0.04, 0.04, 2.2, mat(0xffd166), 6); keppi.position.set(nayteP.x + 2.4, 1.1, nayteP.z + 0.4); keppi.rotation.z = 0.5; scene.add(keppi);

    /* ---------- LAAVU ---------- */
    const laavu = new THREE.Group();
    const katto = laatikko(4, 0.12, 3, mat(0x7a5a3a, { roughness: 1 })); katto.position.set(0, 1.4, -0.3); katto.rotation.x = -0.75; laavu.add(katto);
    [-2, 2].forEach((x) => { const s = laatikko(0.12, 2.2, 3, mat(0x6b4a2e)); s.position.set(x, 1.1, -0.3); s.rotation.x = -0.75; s.scale.y = 0.9; laavu.add(s); });
    for (let i = 0; i < 3; i++) { const h = sylinteri(0.18, 0.18, 2.6, mat(0x8a6a4a), 8); h.rotation.z = Math.PI / 2; h.position.set(0, 0.18, 1.2 + i * 0.05); h.rotation.y = i * 0.6; laavu.add(h); }
    laavu.position.set(-15, 0, -8); laavu.rotation.y = 0.4; scene.add(laavu);
    const nuotio = new THREE.Group();
    for (let i = 0; i < 4; i++) { const h = sylinteri(0.07, 0.07, 0.8, mat(0x4a3020), 6); h.rotation.z = Math.PI / 2; h.rotation.y = i * Math.PI / 4; h.position.y = 0.1; nuotio.add(h); }
    const liekki = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), hehku(0xff8a2b, 2.5)); liekki.position.y = 0.45; nuotio.add(liekki);
    nuotio.position.set(-13.2, 0, -5.4); scene.add(nuotio);
    const tuli = new THREE.PointLight(0xff9a3c, 8, 9, 1.6); tuli.position.set(-13.2, 1, -5.4); scene.add(tuli);
    const reppu = laatikko(0.5, 0.7, 0.35, mat(0xd2452b)); reppu.position.set(-11.6, 0.35, -6.6); scene.add(reppu);

    /* ---------- POROAITA + porot ---------- */
    const aitaP = jokiPiste(0.42);
    for (let i = 0; i < 14; i++) { const t = sylinteri(0.06, 0.07, 1.5, mat(0x6b5a46), 6); t.position.set(aitaP.x - 6 - i * 1.4, 0.75, aitaP.z + Math.sin(i) * 0.5); scene.add(t); }
    const aitaLanka = laatikko(19, 0.03, 0.03, mat(0x6b5a46)); aitaLanka.position.set(aitaP.x - 15, 1.1, aitaP.z); scene.add(aitaLanka);
    const porot = [];
    const poroMat = [mat(0x8a7a66, { roughness: 1 }), mat(0x5e5146, { roughness: 1 }), mat(0xcfc6b8, { roughness: 1 })];
    function poro(x, z, ry, m) {
      const g = new THREE.Group();
      const keho = laatikko(1.1, 0.5, 0.45, m); keho.position.y = 0.85; g.add(keho);
      [[-0.4, -0.15], [0.4, -0.15], [-0.4, 0.15], [0.4, 0.15]].forEach(([a, b]) => { const j = laatikko(0.1, 0.6, 0.1, m); j.position.set(a, 0.3, b); g.add(j); });
      const kaula = laatikko(0.18, 0.45, 0.22, m); kaula.position.set(0.55, 1.15, 0); kaula.rotation.z = -0.5; g.add(kaula);
      const paa = laatikko(0.36, 0.2, 0.2, m); paa.position.set(0.78, 1.35, 0); g.add(paa);
      const sarvi = mat(0xd8c8a8, { roughness: 0.9 });
      [-0.08, 0.08].forEach((dz) => { const s = sylinteri(0.02, 0.03, 0.5, sarvi, 5); s.position.set(0.7, 1.65, dz * 2.5); s.rotation.set(dz * 3, 0, 0.3); g.add(s); const s2 = sylinteri(0.015, 0.02, 0.25, sarvi, 5); s2.position.set(0.82, 1.75, dz * 3.5); s2.rotation.z = -0.6; g.add(s2); });
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); porot.push(g); return g;
    }
    [[-6, -2, 0.6], [-9, 1.5, 2.6], [-11, -3, -0.4], [-13.5, 0.5, 1.4], [-8, -5, 3]].forEach(([dx, dz, r], i) => poro(aitaP.x + dx, aitaP.z + dz, r, poroMat[i % 3]));

    /* ---------- HAKKUUAUKEA + oja + metsäkone ---------- */
    const aukea = new THREE.Mesh(new THREE.CircleGeometry(10, 20), mat(0xb8955f, { roughness: 1 })); aukea.rotation.x = -Math.PI / 2; aukea.position.set(17, 0.03, -38); scene.add(aukea);
    for (let i = 0; i < 26; i++) { const k = sylinteri(0.2, 0.25, 0.3, mat(0xc9a77a), 8); k.position.set(10 + (i * 7.3) % 15, 0.15, -44 + (i * 3.7) % 12); scene.add(k); }
    for (let i = 0; i < 9; i++) { const t = sylinteri(0.22, 0.22, 4, mat(0xa07850), 8); t.rotation.z = Math.PI / 2; t.position.set(21, 0.25 + Math.floor(i / 4) * 0.42, -32 + (i % 4) * 0.45); scene.add(t); }
    const ojaKayra = new THREE.CatmullRomCurve3([new THREE.Vector3(22, 0, -40), new THREE.Vector3(14, 0, -39), new THREE.Vector3(8, 0, -37), jokiPiste(0.48).clone()]);
    const ojaPos = [], ojaIdx = [];
    for (let i = 0; i <= 40; i++) {
      const p = ojaKayra.getPoint(i / 40), tn = ojaKayra.getTangent(i / 40), w = 0.6;
      ojaPos.push(p.x - tn.z * w, 0.07, p.z + tn.x * w, p.x + tn.z * w, 0.07, p.z - tn.x * w);
      if (i < 40) { const a = i * 2; ojaIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const ojaGeo = new THREE.BufferGeometry(); ojaGeo.setAttribute("position", new THREE.Float32BufferAttribute(ojaPos, 3)); ojaGeo.setIndex(ojaIdx); ojaGeo.computeVertexNormals();
    const ojaMat = mat(V.muta, { roughness: 0.4, side: THREE.DoubleSide });
    const oja = new THREE.Mesh(ojaGeo, ojaMat); scene.add(oja);
    const allas = new THREE.Mesh(new THREE.CircleGeometry(1.8, 16), mat(0x6a8fb0, { roughness: 0.2 })); allas.rotation.x = -Math.PI / 2; allas.position.set(11, 0.08, -38.4); allas.visible = false; scene.add(allas);
    const kone = new THREE.Group();
    const kKeho = laatikko(3.2, 1.2, 1.6, mat(0xf2c12e)); kKeho.position.y = 1.2; kone.add(kKeho);
    const kOhj = laatikko(1.3, 1.2, 1.5, mat(0xf2c12e)); kOhj.position.set(0.8, 2.3, 0); kone.add(kOhj);
    const kIkk = laatikko(1.32, 0.7, 1.4, new THREE.MeshStandardMaterial({ color: 0x9ec9e8, roughness: 0.1, metalness: 0.3 })); kIkk.position.set(0.8, 2.45, 0); kone.add(kIkk);
    [[-1.1, 0.85], [1.1, 0.85], [-1.1, -0.85], [1.1, -0.85]].forEach(([x, z]) => { const r = sylinteri(0.55, 0.55, 0.4, mat(0x222222), 14); r.rotation.x = Math.PI / 2; r.position.set(x, 0.55, z); kone.add(r); });
    const puomi = laatikko(3.4, 0.2, 0.2, mat(0xf2c12e)); puomi.position.set(-1.8, 2.6, 0); puomi.rotation.z = 0.35; kone.add(puomi);
    kone.position.set(18, 0, -42); kone.rotation.y = -0.5; scene.add(kone);
    /* Mutapilvi joessa */
    const muta = new THREE.Mesh(new THREE.CircleGeometry(2.6, 18), new THREE.MeshBasicMaterial({ color: 0x8b5a2b, transparent: true, opacity: 0.55 }));
    const mp = jokiPiste(0.49); muta.rotation.x = -Math.PI / 2; muta.position.set(mp.x + 0.5, 0.09, mp.z + 1.5); muta.scale.set(1, 1.8, 1); scene.add(muta);

    /* ---------- KYLÄ + laboratorio ---------- */
    const talot = [];
    function talo(x, z, ry, v, k) {
      const g = new THREE.Group();
      const s = laatikko(3 * k, 2 * k, 2.4 * k, mat(v, { roughness: 0.8 })); s.position.y = k; g.add(s);
      const katto = new THREE.Mesh(new THREE.ConeGeometry(2.3 * k, 1.3 * k, 4), mat(0x3b3b3b, { roughness: 0.8 })); katto.position.y = 2.6 * k; katto.rotation.y = Math.PI / 4; katto.scale.z = 0.8; g.add(katto);
      [-1.5 * k, 1.5 * k].forEach((dx) => { const n = laatikko(0.12, 2 * k, 0.12, mat(0xffffff)); n.position.set(dx, k, 1.21 * k); g.add(n); });
      const ikk = new THREE.Mesh(new THREE.PlaneGeometry(0.7 * k, 0.6 * k), hehku(0xffd59e, 1.2)); ikk.position.set(0, 1.1 * k, 1.22 * k); g.add(ikk);
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); talot.push(g); return g;
    }
    talo(22, 2, -0.3, V.punainen, 1); talo(27, 6, -0.6, V.punainen, 0.9); talo(28, -1, -0.2, 0xd9c48a, 0.85);
    const lab = talo(21, 8, -0.9, 0xf2f2f2, 1.1);
    const labKyltti = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.45), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["LABORATORIO"], "#ffffff", "#2f6b45", 512, 104) }));
    labKyltti.position.set(0, 2.25, 1.35); lab.add(labKyltti);

    /* ---------- Lumi (loppu) ---------- */
    const lumi = hiukkaset(500, 0xffffff, 0.18);
    for (let i = 0; i < 500; i++) { lumi.pos.set([-25 + Math.random() * 50, Math.random() * 18, -30 + Math.random() * 50], i * 3); lumi.nopeus[i] = 0.6 + Math.random() * 0.8; }
    lumi.points.material.blending = THREE.NormalBlending; lumi.points.visible = false; scene.add(lumi.points);

    /* ---------- TILA ---------- */
    const tila = { talvi: false, korjattu: false };
    const maaVari = maaMat.color.clone();
    function asetaTila(t) {
      tila.talvi = !!t.talvi; tila.korjattu = !!t.korjattu || tila.talvi;
      lumi.points.visible = tila.talvi;
      lumiLakit.forEach((l) => { l.visible = tila.talvi; });
      maaMat.color.copy(tila.talvi ? new THREE.Color(0xffffff) : maaVari);
      laikut.forEach((l) => { l.visible = !tila.talvi; });
      lehdet.forEach((l) => { l.visible = !tila.talvi; });
      tunturiMat.color.set(tila.talvi ? 0xe8eef4 : V.tunturi);
      scene.background.set(tila.talvi ? 0xdfe6f0 : BG); scene.fog.color.set(tila.talvi ? 0xdfe6f0 : BG);
      muta.visible = !tila.korjattu; allas.visible = tila.korjattu;
      jokiPuhdas(tila.korjattu);
      jokiMat.color.set(tila.talvi ? 0xdde8f2 : 0xffffff);
    }
    function paivita(dt, t) {
      liekki.scale.set(1 + Math.sin(t * 13) * 0.12, 1 + Math.sin(t * 9) * 0.2, 1 + Math.cos(t * 11) * 0.12);
      tuli.intensity = 7 + Math.sin(t * 12) * 1.5;
      porot.forEach((p, i) => { p.children[7].rotation.z = Math.sin(t * 1.3 + i) * 0.12; p.position.x += Math.sin(t * 0.3 + i) * dt * 0.08; });
      muta.material.opacity = 0.45 + Math.sin(t * 1.5) * 0.1;
      if (lumi.points.visible) {
        for (let i = 0; i < 500; i++) { let y = lumi.pos[i * 3 + 1] - lumi.nopeus[i] * dt; if (y < 0) y = 18; lumi.pos[i * 3 + 1] = y; lumi.pos[i * 3] += Math.sin(t + i) * dt * 0.2; }
        lumi.points.geometry.attributes.position.needsUpdate = true;
      }
    }

    const R = jokiPiste(0.86), N2 = jokiPiste(0.72), H = jokiPiste(0.48);
    const kohtaukset = {
      kansi:      { kamera: [R.x - 4, 2.6, R.z + 8],    kohde: [0, 6, -100],              tila: {} },
      laakso:     { kamera: [10, 22, 34],               kohde: [0, 0, -40],               tila: {} },
      ranta:      { kamera: [R.x + 8, 2.4, R.z + 6],    kohde: [R.x + 3.5, 0.2, R.z + 1], tila: {} },
      naytteet:   { kamera: [N2.x + 8, 2.6, N2.z + 5],  kohde: [N2.x + 2, 0.4, N2.z - 1], tila: {} },
      laavu:      { kamera: [-8, 2.6, 1],               kohde: [-14.5, 1, -7.5],          tila: {} },
      porot:      { kamera: [aitaP.x - 2, 3, aitaP.z + 9], kohde: [aitaP.x - 10, 0.8, aitaP.z - 1], tila: {} },
      hakkuu:     { kamera: [4, 4.5, -27],              kohde: [14, 0.8, -39],            tila: {} },
      kyla:       { kamera: [15, 3.2, 18],              kohde: [23, 1.5, 4],              tila: {} },
      loppu:      { kamera: [R.x - 4, 3.2, R.z + 9],    kohde: [0, 4, -70],               tila: { talvi: true } }
    };
    return { kohtaukset, oletus: "laakso", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     LENTOKENTTÄ – "Myrsky lentokentällä": lumimyrsky illalla, aamulla aurinko
     Terminaali keskellä, kiitotie takana, torni oikealla, bussipysäkki edessä.
     ------------------------------------------------------------------------ */
  tyomaa(scene) {
    const V = { taivas: 0x9cc8ec, sora: 0x8f877a, betoni: 0xb8b4ac, puu: 0xd9b77e, puuTumma: 0xb48a52, keltainen: 0xf2c230, oranssi: 0xff7a1a, valko: 0xf2f2ee };
    scene.background = new THREE.Color(V.taivas);
    scene.fog = new THREE.Fog(V.taivas, 45, 130);
    const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x5a5040, 1.15); scene.add(hemi);
    const aur = new THREE.DirectionalLight(0xfff0d8, 1.25); aur.position.set(-20, 30, 15); scene.add(aur);

    /* Maa: sora ja nurmi */
    const nurmi = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), mat(0x5d8a45, { roughness: 1, metalness: 0 })); nurmi.rotation.x = -Math.PI / 2; nurmi.position.y = -0.02; scene.add(nurmi);
    const sora = new THREE.Mesh(new THREE.CircleGeometry(24, 40), mat(V.sora, { roughness: 1, metalness: 0 })); sora.rotation.x = -Math.PI / 2; scene.add(sora);
    /* Mäntymetsä */
    const runkoMat = mat(0x8a5a3a, { metalness: 0, roughness: 1 }), havuMat = mat(0x2f5a34, { metalness: 0, roughness: 1 });
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 35; if (Math.sin(a) > 0.6 && r < 40) continue;
      const g = new THREE.Group(), k = 1 + Math.random() * 0.8;
      const rr = sylinteri(0.25 * k, 0.35 * k, 9 * k, runkoMat, 6); rr.position.y = 4.5 * k; g.add(rr);
      const l = new THREE.Mesh(new THREE.ConeGeometry(2.4 * k, 5 * k, 8), havuMat); l.position.y = 10 * k; g.add(l);
      g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 10); g.userData.v = Math.random() * 6; scene.add(g);
    }
    /* Naapuritalo taustalla */
    const naapuri = new THREE.Group();
    const nt = laatikko(10, 4, 7, mat(V.valko, { metalness: 0 })); nt.position.y = 2; naapuri.add(nt);
    const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.2, 3, 4, 1), mat(0x2a2e36, { metalness: 0.3 })); nk.rotation.y = Math.PI / 4; nk.scale.set(1.15, 1, 0.82); nk.position.y = 5.5; naapuri.add(nk);
    for (let i = 0; i < 3; i++) { const ik = laatikko(1.1, 1.1, 0.05, mat(0x223344, { metalness: 0.4, roughness: 0.2 })); ik.position.set(-3 + i * 3, 2.3, 3.53); naapuri.add(ik); }
    naapuri.position.set(-16, 0, -22); scene.add(naapuri);

    /* Työmaan talo: laatta, seinäelementit, ristikot */
    const talo = new THREE.Group();
    const laatta = laatikko(12, 0.5, 8, mat(V.betoni, { roughness: 0.95, metalness: 0 })); laatta.position.y = 0.25; talo.add(laatta);
    const seinaMat = mat(0xf0ece4, { roughness: 0.9, metalness: 0 }), suojaMat = mat(0xe8edf2, { roughness: 0.7, metalness: 0 });
    function seina(w, x, z, ry) { const s = new THREE.Group(); const p = laatikko(w, 2.8, 0.25, seinaMat); p.position.y = 1.4; s.add(p); const kalvo = laatikko(w, 2.8, 0.02, suojaMat); kalvo.position.set(0, 1.4, 0.14); s.add(kalvo); s.position.set(x, 0.5, z); s.rotation.y = ry || 0; talo.add(s); return s; }
    seina(12, 0, -3.88); seina(8, -5.88, 0, Math.PI / 2); seina(5, 3.5, 3.88);
    const puuttuva = seina(8, 5.88, 0, Math.PI / 2); puuttuva.visible = false;
    /* Ristikot */
    const ristikot = new THREE.Group(), puuMat = mat(V.puu, { roughness: 0.8, metalness: 0 });
    for (let i = 0; i < 9; i++) {
      const g = new THREE.Group();
      const ala = laatikko(8.6, 0.15, 0.1, puuMat); g.add(ala);
      [-1, 1].forEach((s) => { const y = laatikko(4.9, 0.15, 0.1, puuMat); y.position.set(s * 2.15, 1.2, 0); y.rotation.z = -s * 0.52; g.add(y); });
      const pysty = laatikko(0.1, 2.4, 0.1, puuMat); pysty.position.y = 1.2; g.add(pysty);
      [-1, 1].forEach((s) => { const v = laatikko(0.08, 2.0, 0.08, puuMat); v.position.set(s * 1.4, 0.9, 0); v.rotation.z = s * 0.7; g.add(v); });
      g.rotation.y = Math.PI / 2; g.position.set(-5.6 + i * 1.4, 3.85, 0); ristikot.add(g);
    }
    talo.add(ristikot);
    const katto = new THREE.Group();
    [-1, 1].forEach((s) => { const k = laatikko(12.6, 0.12, 5.2, mat(0x2b2f36, { roughness: 0.6, metalness: 0.4 })); k.position.set(0, 5.05, s * 2.15); k.rotation.x = s * 0.52; katto.add(k); });
    katto.visible = false; talo.add(katto);
    /* Märkätilan putket laatassa */
    const putket = new THREE.Group();
    [[0xd43a2f, 0], [0x2f6fd4, 0.25], [0x777777, 0.6]].forEach(([v, x]) => { const p = sylinteri(0.06, 0.06, 0.8, mat(v, { metalness: 0.3 }), 8); p.position.set(-3.6 + x, 0.9, -2.8); putket.add(p); });
    const kaivo = sylinteri(0.25, 0.25, 0.05, mat(0x555555, { metalness: 0.6 }), 16); kaivo.position.set(-3.2, 0.53, -2.2); putket.add(kaivo);
    talo.add(putket);
    /* Sähkörasiat seinällä */
    const rasiat = [];
    for (let i = 0; i < 4; i++) { const r = laatikko(0.18, 0.18, 0.06, mat(0xffffff, { metalness: 0 })); r.position.set(-4 + i * 2.2, 0.5 + 0.4 + (i % 2) * 0.9, -3.72); talo.add(r); rasiat.push(r); }
    const johto = laatikko(8, 0.03, 0.03, mat(0xf2a33a, { metalness: 0 })); johto.position.set(-0.7, 2.9, -3.72); talo.add(johto);
    talo.position.set(0, 0, 0); scene.add(talo);

    /* Telineet */
    const teras = mat(0x9aa3ad, { metalness: 0.8, roughness: 0.35 });
    for (let x = -6; x <= 6; x += 2) { const t = sylinteri(0.05, 0.05, 4.5, teras, 6); t.position.set(x, 2.25, 4.6); scene.add(t); }
    [1.6, 3.4].forEach((y) => { const l = laatikko(12.4, 0.06, 0.8, mat(0xc9a06a, { metalness: 0 })); l.position.set(0, y, 4.6); scene.add(l); const k = sylinteri(0.04, 0.04, 12.4, teras, 6); k.rotation.z = Math.PI / 2; k.position.set(0, y + 1, 5); scene.add(k); });

    /* Nosturi (ajoneuvonosturi) */
    const nosturi = new THREE.Group();
    const auto = laatikko(3, 1.4, 9, mat(V.keltainen, { metalness: 0.3 })); auto.position.y = 1.4; nosturi.add(auto);
    const ohjaamo = laatikko(2.6, 1.6, 2, mat(0x2a7fb0, { metalness: 0.3 })); ohjaamo.position.set(0, 2.8, 3.6); nosturi.add(ohjaamo);
    for (let i = 0; i < 4; i++) [-1.4, 1.4].forEach((x) => { const r = sylinteri(0.6, 0.6, 0.45, mat(0x1d1d1d), 16); r.rotation.z = Math.PI / 2; r.position.set(x, 0.6, -3 + i * 2); nosturi.add(r); });
    const torni = new THREE.Group(); torni.position.set(0, 2.3, -2); nosturi.add(torni);
    const puomi = laatikko(0.7, 0.7, 22, mat(V.keltainen, { metalness: 0.4 })); puomi.geometry.translate(0, 0, -11); torni.add(puomi);
    torni.rotation.x = 0.85; torni.rotation.y = 0;
    nosturi.position.set(16, 0, 5); nosturi.rotation.y = -Math.PI / 2 - 0.25; scene.add(nosturi);
    /* Riippuva elementti köydessä */
    const koysi = sylinteri(0.025, 0.025, 1, mat(0x222222), 6); scene.add(koysi);
    const elementti = new THREE.Group(); const ep = laatikko(4, 2.8, 0.25, seinaMat); elementti.add(ep); const ek = laatikko(4, 2.8, 0.02, suojaMat); ek.position.z = 0.14; elementti.add(ek); scene.add(elementti);
    const huippu = new THREE.Vector3();

    /* Työmaakoppi ja kyltit */
    const koppi = new THREE.Group();
    const kp = laatikko(6, 2.6, 2.4, mat(0xd8dde3, { metalness: 0.3 })); kp.position.y = 1.4; koppi.add(kp);
    const ik = laatikko(1.4, 0.9, 0.05, mat(0x223344, { metalness: 0.4, roughness: 0.2 })); ik.position.set(-1.2, 1.8, 1.23); koppi.add(ik);
    const ovi = laatikko(0.9, 1.9, 0.05, mat(0x8a9099)); ovi.position.set(1.6, 1.15, 1.23); koppi.add(ovi);
    const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.2), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["TYÖMAA", "Kypärä pakollinen"], "#1d1d1d", "#f2c230", 512, 180) }));
    kyltti.position.set(-0.4, 3.3, 1.2); koppi.add(kyltti);
    const poyta = laatikko(1.8, 0.06, 0.9, mat(0xbfa27a, { metalness: 0 })); poyta.position.set(-1.6, 1.0, 2.2); koppi.add(poyta);
    const piirustus = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 150; const g = c.getContext("2d"); g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, 256, 150); g.strokeStyle = "#2b5fa0"; g.lineWidth = 4; g.strokeRect(20, 20, 216, 110); g.lineWidth = 2; g.beginPath(); g.moveTo(110, 20); g.lineTo(110, 130); g.moveTo(110, 75); g.lineTo(236, 75); g.moveTo(20, 90); g.lineTo(110, 90); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() }));
    piirustus.rotation.x = -Math.PI / 2; piirustus.position.set(-1.6, 1.04, 2.2); koppi.add(piirustus);
    koppi.position.set(-12, 0, 10); koppi.rotation.y = 0.5; scene.add(koppi);
    /* Puutavarapinot ja lavat */
    for (let p = 0; p < 2; p++) for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const l = laatikko(4, 0.18, 0.18, mat(r % 2 ? V.puu : V.puuTumma, { metalness: 0 })); l.position.set(8 + p * 5, 0.09 + r * 0.19, -8 + i * 0.2); scene.add(l); }
    for (let i = 0; i < 4; i++) { const lava = laatikko(1.2, 0.15, 1, mat(0xb08a58, { metalness: 0 })); lava.position.set(-9 + i * 1.5, 0.08, -6); scene.add(lava); const k = laatikko(1, 0.6, 0.8, mat(0xe8e2d6, { metalness: 0 })); k.position.set(-9 + i * 1.5, 0.46, -6); scene.add(k); }
    /* Puomit */
    for (let i = 0; i < 5; i++) { const pu = laatikko(1.6, 0.12, 0.12, mat(i % 2 ? 0xffffff : 0xd43a2f)); pu.position.set(10 + i * 1.6, 0.9, 9); scene.add(pu); }

    /* Työntekijät huomioliiveissä ja kypärissä */
    const tyontekijat = [];
    function tyontekija(x, y, z, liivi) {
      const g = new THREE.Group();
      const k = sylinteri(0.26, 0.3, 0.9, mat(liivi || V.oranssi, { metalness: 0 }), 10); k.position.y = 1.05; g.add(k);
      const j = sylinteri(0.2, 0.18, 0.6, mat(0x2a3140, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(0xe8c3a0, { metalness: 0 })); p.position.y = 1.72; g.add(p);
      const kyp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff, { metalness: 0.1 })); kyp.position.y = 1.78; g.add(kyp);
      const lippa = sylinteri(0.26, 0.26, 0.03, mat(0xffffff), 12); lippa.position.y = 1.79; g.add(lippa);
      g.position.set(x, y, z); g.userData.y0 = y; g.userData.v = Math.random() * 6; scene.add(g); tyontekijat.push(g); return g;
    }
    tyontekija(2, 0.5, 1); tyontekija(-3, 0.5, -1.5, 0xf2e130); tyontekija(6.5, 0, 3);
    const kattomies = tyontekija(1.4, 3.95, 0.5, 0xf2e130);
    const valjas = sylinteri(0.015, 0.015, 3, mat(0xff3b3b), 4); valjas.position.set(1.4, 5.9, 0.5); scene.add(valjas);
    const maalari = tyontekija(-4, 0, 5.4, 0xffffff);

    /* Sade */
    const sade = hiukkaset(1500, 0xcfe0ff, 0.08); sade.points.material.blending = THREE.NormalBlending; sade.points.material.opacity = 0.55;
    for (let i = 0; i < 1500; i++) { sade.pos.set([-25 + Math.random() * 50, Math.random() * 20, -20 + Math.random() * 40], i * 3); sade.nopeus[i] = 12 + Math.random() * 5; }
    sade.points.visible = false; scene.add(sade.points);
    /* Harjannosto-lippu (loppu) */
    const lippu = new THREE.Group(); const salko = sylinteri(0.04, 0.04, 2.2, teras, 6); salko.position.y = 1.1; lippu.add(salko);
    const kangas = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), mat(0xffffff, { metalness: 0, side: THREE.DoubleSide })); kangas.position.set(0.62, 1.8, 0); lippu.add(kangas);
    const risti = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.16), mat(0x1d4fb0, { metalness: 0, side: THREE.DoubleSide })); risti.position.set(0.62, 1.8, 0.005); lippu.add(risti);
    const risti2 = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.75), mat(0x1d4fb0, { metalness: 0, side: THREE.DoubleSide })); risti2.position.set(0.42, 1.8, 0.006); lippu.add(risti2);
    lippu.position.set(0, 6.2, 0); lippu.visible = false; scene.add(lippu);

    const tila = { tila: "paiva" };
    function asetaTila(t) {
      tila.tila = t.tila || "paiva";
      const s = tila.tila === "sade", tuuli = tila.tila === "tuuli", valmis = tila.tila === "valmis";
      sade.points.visible = s;
      katto.visible = valmis; puuttuva.visible = valmis || tila.tila === "katto" || s; lippu.visible = valmis;
      elementti.visible = !valmis && !s; koysi.visible = elementti.visible;
      const tumma = s || tuuli;
      scene.background.set(s ? 0x7d8794 : tuuli ? 0x8fa6bc : V.taivas); scene.fog.color.copy(scene.background);
      hemi.intensity = tumma ? 0.8 : 1.15; aur.intensity = tumma ? 0.45 : 1.25;
    }
    function paivita(dt, t) {
      const tuuli = tila.tila === "tuuli" ? 1 : 0.15;
      torni.rotation.y = Math.sin(t * 0.15) * 0.05;
      torni.updateMatrixWorld(true);
      huippu.set(0, 0, -22).applyMatrix4(puomi.matrixWorld);
      const heilu = Math.sin(t * 1.3) * 0.9 * tuuli, alas = 9;
      elementti.position.set(huippu.x + heilu, huippu.y - alas - 1.4, huippu.z);
      elementti.rotation.y = Math.sin(t * 0.8) * 0.6 * tuuli + 0.3; elementti.rotation.z = Math.sin(t * 1.3) * 0.08 * tuuli;
      koysi.position.set((huippu.x + elementti.position.x) / 2, huippu.y - alas / 2, huippu.z); koysi.scale.y = alas; koysi.rotation.z = -heilu / alas;
      scene.children.forEach((o) => { if (o.userData && o.userData.v !== undefined && o.children.length === 2 && o.position.y === 0 && !tyontekijat.includes(o)) o.rotation.z = Math.sin(t * (1 + tuuli * 2) + o.userData.v) * 0.02 * (1 + tuuli * 4); });
      tyontekijat.forEach((w, i) => { w.rotation.y = Math.sin(t * 0.5 + i) * 0.6; });
      kattomies.position.x = 1.4 + Math.sin(t * 0.4) * 1.2; valjas.position.x = kattomies.position.x;
      maalari.position.x = -4 + Math.sin(t * 0.6) * 1.5;
      kangas.rotation.y = Math.sin(t * 3) * 0.3; risti.rotation.y = kangas.rotation.y; risti2.rotation.y = kangas.rotation.y;
      if (sade.points.visible) { for (let i = 0; i < 1500; i++) { let y = sade.pos[i * 3 + 1] - sade.nopeus[i] * dt; if (y < 0) y = 20; sade.pos[i * 3 + 1] = y; } sade.points.geometry.attributes.position.needsUpdate = true; }
    }
    const kohtaukset = {
      kansi:    { kamera: [-16, 7, 20],  kohde: [2, 3, 0],      tila: {} },
      tyomaa:   { kamera: [-18, 11, 24], kohde: [2, 2, -1],     tila: {} },
      koppi:    { kamera: [-10, 2.6, 15], kohde: [-13, 1.2, 11], tila: {} },
      nosto:    { kamera: [-6, 4, 14],   kohde: [8, 7, 0],      tila: { tila: "tuuli" } },
      katto:    { kamera: [4, 2.2, 9],   kohde: [0, 5, 0],      tila: { tila: "katto" } },
      sahkot:   { kamera: [0, 1.9, 1.5], kohde: [-1, 1.5, -3.8], tila: { tila: "katto" } },
      putket:   { kamera: [-1.5, 2.6, 1], kohde: [-3.4, 0.6, -2.6], tila: { tila: "katto" } },
      maalaus:  { kamera: [-4, 2.4, 13], kohde: [-3, 2, 4],     tila: { tila: "sade" } },
      loppu:    { kamera: [-14, 6, 18],  kohde: [0, 4, 0],      tila: { tila: "valmis" } }
    };
    return { kohtaukset, oletus: "tyomaa", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     TURVALLISUUS – "Yövuoro satamakaupungissa": satama, katu, vankila ja hätäkeskus yöllä
     ------------------------------------------------------------------------ */
  satama(scene) {
    const V = { yo: 0x0b1424, vesi: 0x0d2236, laituri: 0x4a4f57, asfaltti: 0x23272d };
    scene.background = new THREE.Color(V.yo);
    scene.fog = new THREE.Fog(V.yo, 40, 150);
    const hemi = new THREE.HemisphereLight(0x5f7fb0, 0x101418, 0.55); scene.add(hemi);
    const kuu = new THREE.DirectionalLight(0xaec8ff, 0.6); kuu.position.set(-30, 40, -20); scene.add(kuu);

    /* Tähdet ja kuu */
    const tahdet = hiukkaset(500, 0xffffff, 0.35); tahdet.points.material.blending = THREE.NormalBlending; tahdet.points.material.opacity = 0.8;
    for (let i = 0; i < 500; i++) { const a = Math.random() * Math.PI * 2, b = 0.15 + Math.random() * 1.2; tahdet.pos.set([Math.cos(a) * Math.cos(b) * 120, Math.sin(b) * 120, Math.sin(a) * Math.cos(b) * 120], i * 3); }
    scene.add(tahdet.points);
    const kuuPallo = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 16), hehku(0xe8eeff, 1.2)); kuuPallo.position.set(-50, 45, -90); scene.add(kuuPallo);

    /* Meri, laituri ja katu */
    const meri = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), mat(V.vesi, { metalness: 0.7, roughness: 0.25 })); meri.rotation.x = -Math.PI / 2; meri.position.set(0, -0.6, -110); scene.add(meri);
    const laituri = laatikko(140, 1, 30, mat(V.laituri, { roughness: 0.95, metalness: 0 })); laituri.position.set(0, -0.5, 0); scene.add(laituri);
    const kentta = new THREE.Mesh(new THREE.PlaneGeometry(140, 60), mat(V.asfaltti, { roughness: 1, metalness: 0 })); kentta.rotation.x = -Math.PI / 2; kentta.position.set(0, -0.49, 44); scene.add(kentta);
    const reunaViiva = laatikko(140, 0.05, 0.3, hehku(0xf2c230, 0.5)); reunaViiva.position.set(0, 0.03, -14.6); scene.add(reunaViiva);

    /* Kontit */
    const konttiVarit = [0xb23a2e, 0x2f6fb0, 0x2f8a4a, 0xd9822b, 0x8a8f96, 0x6b3fa0];
    for (let x = 0; x < 6; x++) for (let z = 0; z < 3; z++) {
      const kork = 1 + Math.floor(Math.random() * 3);
      for (let y = 0; y < kork; y++) { const k = laatikko(6, 2.5, 2.4, mat(konttiVarit[(x + z * 2 + y) % 6], { roughness: 0.7, metalness: 0.5 })); k.position.set(2 + x * 6.4, 1.25 + y * 2.5, -11 + z * 2.6); scene.add(k); }
    }
    /* Konttinosturit, joissa punaiset varoitusvalot */
    const nosturiValot = [];
    [6, 30].forEach((x) => {
      const g = new THREE.Group(), m = mat(0x2d6fae, { metalness: 0.6, roughness: 0.4 });
      [-3, 3].forEach((dx) => [-2, 2].forEach((dz) => { const j = laatikko(0.7, 22, 0.7, m); j.position.set(dx, 11, dz); g.add(j); }));
      const puomi = laatikko(1.4, 1.6, 44, m); puomi.position.set(0, 23, -8); g.add(puomi);
      const ohj = laatikko(2.2, 1.8, 2.2, mat(0xe8eef4, { metalness: 0.3 })); ohj.position.set(0, 21, -10); g.add(ohj);
      [[0, 24, 14], [0, 24, -30], [0, 23, 0]].forEach((p) => { const v = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), hehku(0xff2a2a, 2)); v.position.set(...p); g.add(v); nosturiValot.push(v); });
      g.position.set(x, 0, -14); scene.add(g);
    });
    /* Laiva */
    const laiva = new THREE.Group();
    const runko = laatikko(50, 6, 10, mat(0x1d2b3a, { metalness: 0.5 })); runko.position.y = 1; laiva.add(runko);
    const keula = laatikko(10, 0.4, 10.2, mat(0x8a1f1f)); keula.position.set(0, -1.6, 0); keula.scale.x = 5; laiva.add(keula);
    const komento = laatikko(8, 7, 9, mat(0xe8eef4, { metalness: 0.2 })); komento.position.set(-18, 7.5, 0); laiva.add(komento);
    for (let i = 0; i < 6; i++) { const ik = laatikko(0.9, 0.6, 0.05, hehku(0xffd38a, 1.1)); ik.position.set(-21 + i * 1.3, 9.5, 4.55); laiva.add(ik); }
    laiva.position.set(16, 0, -24); scene.add(laiva);

    /* Varastohalli (tulipalo) */
    const halli = new THREE.Group();
    const hr = laatikko(14, 7, 9, mat(0x8c6a52, { roughness: 0.9, metalness: 0.1 })); hr.position.y = 3.5; halli.add(hr);
    const hk = laatikko(14.6, 0.5, 9.6, mat(0x3a3f47)); hk.position.y = 7.25; halli.add(hk);
    const halliIkkunat = [];
    for (let i = 0; i < 5; i++) { const ik = laatikko(1.6, 1.2, 0.05, hehku(0x1a2230, 0.2)); ik.position.set(-5 + i * 2.5, 5, 4.53); halli.add(ik); halliIkkunat.push(ik); }
    const halliOvi = laatikko(4, 4.5, 0.05, mat(0x5a6068, { metalness: 0.6 })); halliOvi.position.set(3.5, 2.25, 4.53); halli.add(halliOvi);
    halli.position.set(-16, 0, -6); scene.add(halli);
    const tuli = hiukkaset(350, 0xff7a1a, 0.9);
    for (let i = 0; i < 350; i++) { tuli.pos.set([-16 + (Math.random() - 0.5) * 10, 7.5 + Math.random() * 4, -6 + (Math.random() - 0.5) * 6], i * 3); tuli.nopeus[i] = 1.5 + Math.random() * 2.5; }
    scene.add(tuli.points);
    const savu = hiukkaset(250, 0x5a5f66, 2.4); savu.points.material.blending = THREE.NormalBlending; savu.points.material.opacity = 0.45;
    for (let i = 0; i < 250; i++) { savu.pos.set([-16 + (Math.random() - 0.5) * 8, 9 + Math.random() * 18, -6 + (Math.random() - 0.5) * 6], i * 3); savu.nopeus[i] = 1 + Math.random() * 1.5; }
    scene.add(savu.points);
    const tuliValo = new THREE.PointLight(0xff7a2a, 0, 40, 1.6); tuliValo.position.set(-16, 9, -2); scene.add(tuliValo);

    /* Paloauto */
    const paloauto = new THREE.Group();
    const pa1 = laatikko(2.6, 2.4, 8, mat(0xc8201c, { metalness: 0.4 })); pa1.position.y = 1.7; paloauto.add(pa1);
    const pa2 = laatikko(2.5, 1.2, 2.2, mat(0xc8201c, { metalness: 0.4 })); pa2.position.set(0, 3.4, 2.6); paloauto.add(pa2);
    const tikas = laatikko(0.8, 0.3, 7, mat(0xc9ced6, { metalness: 0.8 })); tikas.position.set(0, 3.2, -1); paloauto.add(tikas);
    for (let i = 0; i < 3; i++) [-1.3, 1.3].forEach((x) => { const r = sylinteri(0.55, 0.55, 0.4, mat(0x151515), 14); r.rotation.z = Math.PI / 2; r.position.set(x, 0.55, -2.6 + i * 2.6); paloauto.add(r); });
    const paloVilkut = [];
    [-0.8, 0.8].forEach((x) => { const v = laatikko(0.5, 0.25, 0.3, hehku(0x3a7bff, 2.2)); v.position.set(x, 4.15, 3.2); paloauto.add(v); paloVilkut.push(v); });
    paloauto.position.set(-8, 0, 4); paloauto.rotation.y = -0.6; scene.add(paloauto);

    /* Aita ja portti, vartija taskulampun kanssa */
    const aitaMat = mat(0x9aa3ad, { metalness: 0.8, roughness: 0.4, transparent: true, opacity: 0.55 });
    [[-45, -2], [2, 45]].forEach(([a, b]) => { const aita = laatikko(b - a, 2.4, 0.05, aitaMat); aita.position.set((a + b) / 2, 1.2, 4.5); scene.add(aita); for (let x = a; x <= b; x += 4) { const t = sylinteri(0.06, 0.06, 2.6, mat(0x8a9099, { metalness: 0.8 }), 6); t.position.set(x, 1.3, 4.5); scene.add(t); } });
    const portti = laatikko(4, 2.4, 0.08, aitaMat); portti.position.set(0, 1.2, 4.5); scene.add(portti);
    const ihmiset = [];
    function ihminen(x, z, takki, hlo) {
      const g = new THREE.Group();
      const k = sylinteri(0.26, 0.3, 0.9, mat(takki, { metalness: 0 }), 10); k.position.y = 1.05; g.add(k);
      const j = sylinteri(0.2, 0.18, 0.6, mat(0x1d2230, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(hlo || 0xe0b896, { metalness: 0 })); p.position.y = 1.72; g.add(p);
      g.position.set(x, 0, z); g.userData.v = Math.random() * 6; scene.add(g); ihmiset.push(g); return g;
    }
    const vartija = ihminen(-1, 7, 0x1a1f2a);
    const liivi = sylinteri(0.27, 0.31, 0.5, mat(0xd8e030, { metalness: 0 }), 10); liivi.position.y = 1.2; vartija.add(liivi);
    const lamppuKeila = new THREE.Mesh(new THREE.ConeGeometry(1.4, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }));
    lamppuKeila.position.set(0.8, 1, -3); lamppuKeila.rotation.x = -Math.PI / 2 + 0.2; vartija.add(lamppuKeila);
    const varjo1 = ihminen(4, -1.5, 0x2a2a2a), varjo2 = ihminen(5, -2.2, 0x3a2a24);

    /* Katuvalot */
    for (let x = -40; x <= 40; x += 13) {
      const t = sylinteri(0.1, 0.12, 7, mat(0x3a3f47, { metalness: 0.7 }), 8); t.position.set(x, 3.5, 13); scene.add(t);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), hehku(0xffc77a, 2)); p.position.set(x, 7, 13); scene.add(p);
      const ympyra = new THREE.Mesh(new THREE.CircleGeometry(4, 24), new THREE.MeshBasicMaterial({ color: 0xffb35a, transparent: true, opacity: 0.12, depthWrite: false })); ympyra.rotation.x = -Math.PI / 2; ympyra.position.set(x, 0.02, 13); scene.add(ympyra);
    }

    /* Kaupunki: talot valaistuine ikkunoineen, klubi neonkyltillä */
    const ikkunaKirkas = hehku(0xffd99a, 1.1), ikkunaSammunut = mat(0x1a2230, { metalness: 0.3, roughness: 0.3 });
    const ikkunat = [];
    for (let i = 0; i < 9; i++) {
      if (i === 4) continue;
      const x = -44 + i * 11, k = 9 + (i * 7) % 9;
      const t = laatikko(9, k, 8, mat([0x5a4b44, 0x46505c, 0x6a5a4a, 0x3c4654][i % 4], { roughness: 0.9, metalness: 0 })); t.position.set(x, k / 2, 26); scene.add(t);
      for (let r = 1; r < k / 3; r++) for (let c = 0; c < 3; c++) { const ik = laatikko(1.2, 1.3, 0.05, Math.random() < 0.45 ? ikkunaKirkas : ikkunaSammunut); ik.position.set(x - 2.8 + c * 2.8, r * 3, 21.97); scene.add(ik); ikkunat.push(ik); }
    }
    const klubi = new THREE.Group();
    const kr = laatikko(10, 5, 7, mat(0x1e1a2a, { metalness: 0.2 })); kr.position.y = 2.5; klubi.add(kr);
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["KLUBI NORDIC"], "#ff5ad8", "#120818", 512, 140), transparent: true }));
    neon.position.set(0, 4.2, 3.52); klubi.add(neon);
    const klubiOvi = laatikko(1.6, 2.4, 0.05, hehku(0x7a3aff, 0.8)); klubiOvi.position.set(0, 1.2, 3.52); klubi.add(klubiOvi);
    const jono = []; for (let i = 0; i < 5; i++) jono.push(ihminen(-2.5 - i * 0.9, 18.6 + (i % 2) * 0.3, [0x7a2a5a, 0x2a5a7a, 0x5a7a2a, 0x7a5a2a, 0x3a3a7a][i]));
    const jv = ihminen(1.6, 18.8, 0x111111); const jvLiivi = sylinteri(0.27, 0.31, 0.5, mat(0xd8e030, { metalness: 0 }), 10); jvLiivi.position.y = 1.2; jv.add(jvLiivi);
    klubi.position.set(0, 0, 25); klubi.rotation.y = Math.PI; scene.add(klubi);
    const klubiValo = new THREE.PointLight(0xff5ad8, 10, 14, 1.8); klubiValo.position.set(0, 4, 20.5); scene.add(klubiValo);

    /* Poliisiauto vilkkuvaloilla */
    const poliisi = new THREE.Group();
    const pr = laatikko(2.2, 1.9, 5.2, mat(0xf2f4f7, { metalness: 0.4, roughness: 0.4 })); pr.position.y = 1.35; poliisi.add(pr);
    const raita = laatikko(2.24, 0.45, 3.2, mat(0x1d3a9a, { metalness: 0.3 })); raita.position.set(0, 1.25, -0.4); poliisi.add(raita);
    const tuulilasi = laatikko(2.0, 0.8, 0.05, mat(0x223344, { metalness: 0.5, roughness: 0.15 })); tuulilasi.position.set(0, 1.85, 2.62); poliisi.add(tuulilasi);
    for (let i = 0; i < 2; i++) [-1.1, 1.1].forEach((x) => { const r = sylinteri(0.4, 0.4, 0.3, mat(0x151515), 14); r.rotation.z = Math.PI / 2; r.position.set(x, 0.4, -1.6 + i * 3.2); poliisi.add(r); });
    const sininen = []; [-0.5, 0.5].forEach((x) => { const v = laatikko(0.6, 0.2, 0.3, hehku(0x2a5bff, 2.5)); v.position.set(x, 2.4, 1.2); poliisi.add(v); sininen.push(v); });
    const poliisiValo = new THREE.PointLight(0x2a5bff, 0, 18, 1.6); poliisiValo.position.set(0, 3, 0); poliisi.add(poliisiValo);
    poliisi.position.set(14, 0, 9); poliisi.rotation.y = 1.2; scene.add(poliisi);
    const poliisit = [ihminen(11.5, 10.5, 0x1d2a4a), ihminen(12.2, 11.5, 0x1d2a4a)];
    const nuori = ihminen(10.3, 11.6, 0x8a3a2a);

    /* Vankila: muuri, vartiotorni ja valonheitin */
    const vankila = new THREE.Group();
    const muuriMat = mat(0x8e8a84, { roughness: 1, metalness: 0 });
    [[0, -9, 24, 0], [0, 9, 24, 0], [-12, 0, 18, Math.PI / 2], [12, 0, 18, Math.PI / 2]].forEach(([x, z, w, r]) => { const m = laatikko(w, 6, 0.6, muuriMat); m.position.set(x, 3, z); m.rotation.y = r; vankila.add(m); });
    const sellit = laatikko(16, 9, 8, mat(0xb7b2aa, { roughness: 0.9, metalness: 0 })); sellit.position.set(0, 4.5, 0); vankila.add(sellit);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { const ik = laatikko(0.6, 0.9, 0.05, Math.random() < 0.25 ? ikkunaKirkas : ikkunaSammunut); ik.position.set(-7 + c * 2, 2 + r * 2.6, 4.03); vankila.add(ik); }
    const torni = sylinteri(1.2, 1.4, 11, muuriMat, 12); torni.position.set(11, 5.5, 8.4); vankila.add(torni);
    const koppi = laatikko(3, 2, 3, mat(0x3a3f47)); koppi.position.set(11, 12, 8.4); vankila.add(koppi);
    const heitin = { target: new THREE.Object3D() }; vankila.add(heitin.target);
    const heitinKeila = new THREE.Mesh(new THREE.ConeGeometry(3, 16, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide }));
    heitinKeila.geometry.translate(0, -8, 0); heitinKeila.position.set(11, 12.5, 8.4); vankila.add(heitinKeila);
    const vanginvartija = ihminen(0, 0, 0x1d2a4a); scene.remove(vanginvartija); vanginvartija.position.set(-3, 0, 10.5); vankila.add(vanginvartija);
    vankila.position.set(60, 0, 8); vankila.rotation.y = -0.4; scene.add(vankila);

    /* Hätäkeskus: oma huone näyttöineen (kaukana muusta maailmasta) */
    const hk112 = new THREE.Group();
    const lattia = laatikko(16, 0.1, 12, mat(0x2a2f38, { roughness: 1, metalness: 0 })); hk112.add(lattia);
    const seinaMat = mat(0x1b2230, { roughness: 1, metalness: 0 });
    [[0, 3, -6, 16, 0], [0, 3, 6, 16, 0], [-8, 3, 0, 12, Math.PI / 2], [8, 3, 0, 12, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, seinaMat); s.position.set(x, y, z); s.rotation.y = r; hk112.add(s); });
    const katto112 = laatikko(16, 0.1, 12, seinaMat); katto112.position.y = 6; hk112.add(katto112);
    const kartta = (() => { const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d"); g.fillStyle = "#06121f"; g.fillRect(0, 0, 512, 256);
      g.fillStyle = "#123a5a"; g.fillRect(0, 170, 512, 86); g.strokeStyle = "#3a6a8a"; g.lineWidth = 2;
      for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(Math.random() * 512, Math.random() * 170); g.lineTo(Math.random() * 512, Math.random() * 170); g.stroke(); }
      [["#ff4a4a", 120, 120], ["#ffb02a", 300, 80], ["#4aa8ff", 400, 140], ["#4aff8a", 220, 40]].forEach(([v, x, y]) => { g.fillStyle = v; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = "#9fd0ff"; g.font = "bold 22px Arial"; g.fillText("TILANNEKUVA", 16, 30);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const iso = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: kartta })); iso.position.set(0, 3.6, -5.85); hk112.add(iso);
    const naytot = [];
    [-5, 0, 5].forEach((x, i) => {
      const poyta = laatikko(3.6, 0.08, 1.4, mat(0x9aa3ad, { metalness: 0.4 })); poyta.position.set(x, 1, -1); hk112.add(poyta);
      [-0.85, 0.85].forEach((dx, j) => { const n = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: kayraTekstuuri(["#6fffe9", "#ffb02a", "#ff6b6b"][(i + j) % 3], i * 2 + j) })); n.position.set(x + dx, 1.6, -1.5); n.rotation.y = -dx * 0.25; hk112.add(n); naytot.push(n); });
      const tuoli = laatikko(0.7, 1.2, 0.7, mat(0x111418)); tuoli.position.set(x, 0.6, 0.1); hk112.add(tuoli);
    });
    const paivystajat = [];
    [-5, 5].forEach((x) => { const p = ihminen(0, 0, 0x1a2440); scene.remove(p); p.position.set(x, 0.1, 0.1); hk112.add(p); paivystajat.push(p);
      const kuuloke = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 16, Math.PI), mat(0x111111)); kuuloke.position.set(0, 1.78, 0); kuuloke.rotation.y = Math.PI / 2; p.add(kuuloke); });
    const hkValo = new THREE.PointLight(0xbfd8ff, 16, 20, 1.5); hkValo.position.set(0, 5, 1); hk112.add(hkValo);
    const halytysValo = new THREE.PointLight(0xff3a3a, 0, 14, 1.5); halytysValo.position.set(0, 5, -4); hk112.add(halytysValo);
    hk112.position.set(0, 0, 120); scene.add(hk112);
    /* Hätäkeskuksen rakennus kadulla */
    const hkTalo = laatikko(10, 7, 8, mat(0x4a5260, { metalness: 0.2 })); hkTalo.position.set(-34, 3.5, 17); scene.add(hkTalo);
    const hkKyltti = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["112"], "#ffffff", "#c8201c", 256, 120) })); hkKyltti.position.set(-34, 5.6, 12.97); scene.add(hkKyltti);

    const tila = { tila: "yo" };
    function asetaTila(t) {
      tila.tila = t.tila || "yo";
      const palo = tila.tila === "palo", aamu = tila.tila === "aamu";
      tuli.points.visible = palo; savu.points.visible = palo; paloauto.visible = palo || aamu;
      tuliValo.intensity = palo ? 40 : 0;
      halliIkkunat.forEach((ik) => { ik.material = palo ? hehku(0xff7a1a, 2) : hehku(0x1a2230, 0.2); });
      varjo1.visible = varjo2.visible = tila.tila === "portti";
      poliisit.forEach((p) => { p.visible = tila.tila === "partio"; }); nuori.visible = tila.tila === "partio";
      scene.background.set(aamu ? 0x4a5a7e : V.yo); scene.fog.color.copy(scene.background);
      hemi.intensity = aamu ? 0.9 : 0.55; kuu.color.set(aamu ? 0xffc8a0 : 0xaec8ff);
      tahdet.points.material.opacity = aamu ? 0.25 : 0.8;
    }
    function paivita(dt, t) {
      const vilkku = Math.sin(t * 9) > 0;
      sininen[0].material.emissiveIntensity = vilkku ? 3 : 0.2; sininen[1].material.emissiveIntensity = vilkku ? 0.2 : 3;
      poliisiValo.intensity = tila.tila === "partio" ? (vilkku ? 14 : 4) : 0;
      paloVilkut.forEach((v, i) => { v.material.emissiveIntensity = (Math.sin(t * 8 + i * Math.PI) > 0) ? 3 : 0.2; });
      nosturiValot.forEach((v) => { v.material.emissiveIntensity = Math.sin(t * 2) > 0.3 ? 2.4 : 0.4; });
      halytysValo.intensity = tila.tila === "112" ? (Math.sin(t * 3) > 0 ? 6 : 0) : 0;
      neon.material.opacity = 0.85 + Math.sin(t * 17) * 0.05 + (Math.random() < 0.01 ? -0.5 : 0);
      const kulma = Math.sin(t * 0.4) * 0.9;
      heitin.target.position.set(11 + Math.sin(kulma) * 30, 0, 8.4 + Math.cos(kulma) * 30 - 30);
      heitinKeila.rotation.set(0, 0, 0); heitinKeila.lookAt(heitin.target.getWorldPosition(new THREE.Vector3())); heitinKeila.rotateX(-Math.PI / 2);
      vartija.position.x = -1 + Math.sin(t * 0.3) * 2.5; vartija.rotation.y = Math.PI + Math.sin(t * 0.7) * 0.4;
      ihmiset.forEach((p, i) => { if (p !== vartija) p.rotation.y = Math.sin(t * 0.6 + p.userData.v) * 0.5; });
      vanginvartija.position.x = -3 + Math.sin(t * 0.25) * 6;
      paivystajat.forEach((p, i) => { p.rotation.y = Math.PI + Math.sin(t * 0.8 + i) * 0.25; });
      if (tuli.points.visible) {
        for (let i = 0; i < 350; i++) { let y = tuli.pos[i * 3 + 1] + tuli.nopeus[i] * dt; if (y > 13) y = 7.5; tuli.pos[i * 3 + 1] = y; }
        tuli.points.geometry.attributes.position.needsUpdate = true;
        for (let i = 0; i < 250; i++) { let y = savu.pos[i * 3 + 1] + savu.nopeus[i] * dt; let x = savu.pos[i * 3] + dt * 0.8; if (y > 30) { y = 9; x = -16 + (Math.random() - 0.5) * 8; } savu.pos[i * 3 + 1] = y; savu.pos[i * 3] = x; }
        savu.points.geometry.attributes.position.needsUpdate = true;
        tuliValo.intensity = 34 + Math.sin(t * 13) * 8 + Math.random() * 6;
      }
    }
    const kohtaukset = {
      kansi:   { kamera: [-30, 9, 19],   kohde: [8, 5, -8],      tila: {} },
      satama:  { kamera: [-30, 15, 20],  kohde: [6, 3, -8],      tila: {} },
      portti:  { kamera: [-4, 2.4, 13],  kohde: [3, 1.2, -1],    tila: { tila: "portti" } },
      klubi:   { kamera: [-7, 2.8, 10],  kohde: [0, 2.6, 20],    tila: {} },
      "112":   { kamera: [0, 3, 125],    kohde: [0, 2.4, 115],    tila: { tila: "112" } },
      palo:    { kamera: [9, 5, 11],     kohde: [-15, 6, -5],    tila: { tila: "palo" } },
      partio:  { kamera: [20, 2.6, 17],  kohde: [12, 1.2, 10],   tila: { tila: "partio" } },
      vankila: { kamera: [38, 10, 14],   kohde: [60, 4, 6],      tila: {} },
      loppu:   { kamera: [-30, 9, 19],   kohde: [8, 5, -8],      tila: { tila: "aamu" } }
    };
    return { kohtaukset, oletus: "satama", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     LIIKENNE – "Lumimyräkkäpäivä": talvinen kaupunki, moottoritie, rata, korjaamo ja liikennekeskus
     ------------------------------------------------------------------------ */
  liikenne(scene) {
    const V = { taivas: 0xaab8c8, lumi: 0xeef3f8, tie: 0x3a3f46, viiva: 0xf2f2f2 };
    scene.background = new THREE.Color(V.taivas);
    scene.fog = new THREE.Fog(V.taivas, 30, 120);
    const hemi = new THREE.HemisphereLight(0xeef4ff, 0x8a96a6, 1.1); scene.add(hemi);
    const aur = new THREE.DirectionalLight(0xffffff, 0.7); aur.position.set(-20, 30, 10); scene.add(aur);

    const maa = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(V.lumi, { roughness: 1, metalness: 0 })); maa.rotation.x = -Math.PI / 2; maa.position.y = -0.02; scene.add(maa);
    /* Moottoritie (x-suunta) ja katu (z-suunta) */
    const tieMat = mat(V.tie, { roughness: 0.6, metalness: 0.2 });
    const mt = laatikko(240, 0.04, 14, tieMat); mt.position.set(0, 0.02, -18); scene.add(mt);
    const katu = laatikko(10, 0.04, 80, tieMat); katu.position.set(-6, 0.03, 18); scene.add(katu);
    for (let x = -118; x < 120; x += 8) { [-18 - 3.5, -18 + 3.5].forEach((z) => { const v = laatikko(3.5, 0.05, 0.18, mat(V.viiva, { metalness: 0 })); v.position.set(x, 0.05, z); scene.add(v); }); }
    const keski = laatikko(240, 0.6, 0.4, mat(0x9aa3ad, { metalness: 0.7 })); keski.position.set(0, 0.35, -18); scene.add(keski);
    /* Lumivallit tienvarsilla */
    [-26, -10].forEach((z) => { const v = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 240, 8, 1, false, 0, Math.PI), mat(0xf6f9fc, { roughness: 1, metalness: 0 })); v.rotation.z = Math.PI / 2; v.rotation.y = 0; v.position.set(0, 0, z); v.scale.set(1, 1, 0.5); scene.add(v); });
    /* Ylikulkusilta */
    const silta = laatikko(8, 1, 40, mat(0xb7bcc2, { roughness: 0.9, metalness: 0 })); silta.position.set(30, 6, -18); scene.add(silta);
    [-26, -10].forEach((z) => { const p = laatikko(1.4, 6, 1.4, mat(0xb7bcc2, { metalness: 0 })); p.position.set(30, 3, z); scene.add(p); });
    const opaste = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.6), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["⚠ LIUKASTA – 80"], "#ffffff", "#0b3d91", 512, 128) })); opaste.position.set(30, 8.2, -14.9); scene.add(opaste);
    const opasteTaka = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.6), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["⚠ LIUKASTA – 80"], "#ffffff", "#0b3d91", 512, 128) })); opasteTaka.position.set(30, 8.2, -21.1); opasteTaka.rotation.y = Math.PI; scene.add(opasteTaka);
    /* Kuusimetsä */
    const havu = mat(0x2c4a33, { roughness: 1, metalness: 0 }), lumiHattu = mat(0xf6f9fc, { roughness: 1, metalness: 0 }), runko = mat(0x6a4a32, { metalness: 0 });
    const puut = [];
    for (let i = 0; i < 90; i++) {
      const x = -110 + Math.random() * 220, z = i < 20 ? -30 - Math.random() * 4 : -54 - Math.random() * 36; const g = new THREE.Group(), k = 0.8 + Math.random() * 0.9;
      const r = sylinteri(0.2 * k, 0.25 * k, 2 * k, runko, 6); r.position.y = k; g.add(r);
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.8 * k, 6 * k, 8), havu); c.position.y = 4.5 * k; g.add(c);
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.9 * k, 2 * k, 8), lumiHattu); h.position.y = 6.8 * k; g.add(h);
      g.position.set(x, 0, z); scene.add(g); puut.push(g);
    }
    /* Rata ja juna */
    const rataZ = -48;
    const rata = laatikko(240, 0.3, 4, mat(0x6b6660, { roughness: 1, metalness: 0 })); rata.position.set(0, 0.15, rataZ); scene.add(rata);
    [-0.75, 0.75].forEach((d) => { const k = laatikko(240, 0.15, 0.12, mat(0x8a8f96, { metalness: 0.9, roughness: 0.3 })); k.position.set(0, 0.38, rataZ + d); scene.add(k); });
    for (let x = -110; x <= 110; x += 22) { const p = sylinteri(0.12, 0.15, 7, mat(0x6a7078, { metalness: 0.7 }), 6); p.position.set(x, 3.5, rataZ - 2.6); scene.add(p); const o = laatikko(0.1, 0.1, 3, mat(0x6a7078)); o.position.set(x, 6.8, rataZ - 1.2); scene.add(o); }
    const ajolanka = laatikko(240, 0.04, 0.04, mat(0x222222)); ajolanka.position.set(0, 6.4, rataZ); scene.add(ajolanka);
    const juna = new THREE.Group();
    const veturi = laatikko(9, 3.6, 3, mat(0xf2f4f6, { metalness: 0.5, roughness: 0.4 })); veturi.position.set(0, 2.4, 0); juna.add(veturi);
    const vVihr = laatikko(9.02, 0.9, 3.02, mat(0x3fae49, { metalness: 0.3 })); vVihr.position.set(0, 1.6, 0); juna.add(vVihr);
    const nokka = laatikko(1.2, 2.2, 2.9, mat(0x2a3a4a, { metalness: 0.6, roughness: 0.2 })); nokka.position.set(4.9, 2.9, 0); juna.add(nokka);
    const valo = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), hehku(0xfff4d8, 2.4)); valo.position.set(5.5, 1.6, 0.9); juna.add(valo); const valo2 = valo.clone(); valo2.position.z = -0.9; juna.add(valo2);
    for (let i = 1; i <= 5; i++) { const v = laatikko(12, 4.4, 3, mat(0xdfe4ea, { metalness: 0.5, roughness: 0.4 })); v.position.set(-i * 12.4 + 1.5, 2.8, 0); juna.add(v); const r = laatikko(12.02, 0.5, 3.02, mat(0x3fae49)); r.position.set(-i * 12.4 + 1.5, 1.6, 0); juna.add(r);
      for (let j = 0; j < 6; j++) [1.52, -1.52].forEach((z) => { const ik = laatikko(1.2, 0.7, 0.02, mat(0x1f2a36, { metalness: 0.6, roughness: 0.2 })); ik.position.set(-i * 12.4 + 1.5 - 5 + j * 2, 3.6, z); juna.add(ik); }); }
    juna.position.set(-30, 0.4, rataZ); scene.add(juna);
    /* Kaatunut puu radalla (tila "puu") */
    const kaatunut = new THREE.Group(); const kr = sylinteri(0.25, 0.35, 12, runko, 6); kr.position.y = 6; kaatunut.add(kr);
    const kc = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6, 8), havu); kc.position.y = 10; kaatunut.add(kc);
    kaatunut.position.set(40, 0, rataZ + 6); kaatunut.rotation.x = -0.6; kaatunut.visible = false; scene.add(kaatunut);

    /* Autot moottoritiellä */
    const autoVarit = [0xc8201c, 0x1d4fb0, 0xf2f2f2, 0x2a2a2a, 0x8a8f96, 0x3a7a4a];
    function auto(vari, pituus) {
      const g = new THREE.Group(); const l = pituus || 4.2;
      const k = laatikko(l, 0.9, 1.8, mat(vari, { metalness: 0.6, roughness: 0.35 })); k.position.y = 0.75; g.add(k);
      const y = laatikko(l * 0.55, 0.7, 1.6, mat(0x1f2a36, { metalness: 0.6, roughness: 0.2 })); y.position.set(-l * 0.05, 1.5, 0); g.add(y);
      const yk = laatikko(l * 0.55, 0.12, 1.62, mat(V.lumi, { metalness: 0 })); yk.position.set(-l * 0.05, 1.9, 0); g.add(yk);
      [[l * 0.32, 0.8], [l * 0.32, -0.8], [-l * 0.32, 0.8], [-l * 0.32, -0.8]].forEach(([x, z]) => { const r = sylinteri(0.35, 0.35, 0.3, mat(0x111111), 12); r.rotation.x = Math.PI / 2; r.position.set(x, 0.35, z); g.add(r); });
      [0.6, -0.6].forEach((z) => { const v = laatikko(0.05, 0.18, 0.4, hehku(0xfff4d8, 1.5)); v.position.set(l / 2 + 0.01, 0.85, z); g.add(v); const t = laatikko(0.05, 0.18, 0.4, hehku(0xff2a2a, 1.2)); t.position.set(-l / 2 - 0.01, 0.85, z); g.add(t); });
      return g;
    }
    const liikkuvat = [];
    for (let i = 0; i < 10; i++) { const s = i % 2 ? 1 : -1, a = auto(autoVarit[i % 6]); a.rotation.y = s > 0 ? 0 : Math.PI; a.userData = { s, x: -110 + i * 23, v: 14 + Math.random() * 6, z: -18 + (s > 0 ? 4 : -4) + (i % 4 < 2 ? 1.6 : -1.6) * s }; scene.add(a); liikkuvat.push(a); }
    /* Rekka */
    const rekka = new THREE.Group();
    const ohj = laatikko(2.4, 3, 2.5, mat(0x1d4fb0, { metalness: 0.5 })); ohj.position.set(6.4, 2, 0); rekka.add(ohj);
    const pera = laatikko(12, 3.6, 2.5, mat(0xeeeeee, { metalness: 0.3 })); pera.position.set(-1.2, 2.5, 0); rekka.add(pera);
    const peraLumi = laatikko(12, 0.15, 2.5, mat(V.lumi, { metalness: 0 })); peraLumi.position.set(-1.2, 4.38, 0); rekka.add(peraLumi);
    for (let i = 0; i < 4; i++) [1.2, -1.2].forEach((z) => { const r = sylinteri(0.55, 0.55, 0.4, mat(0x111111), 12); r.rotation.x = Math.PI / 2; r.position.set(6.4 - (i ? 3 + i * 2.2 : 0), 0.55, z); rekka.add(r); });
    const rekkaValot = [0.9, -0.9].map((z) => { const v = laatikko(0.05, 0.25, 0.4, hehku(0xfff4d8, 2)); v.position.set(7.62, 1.1, z); rekka.add(v); return v; });
    rekka.userData = { x: -40 }; rekka.position.set(-40, 0, -18 + 5.5); scene.add(rekka);
    /* Taukopaikka ja kyltti */
    const tauko = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["P  ☕  1 km"], "#ffffff", "#0b3d91", 384, 180) })); tauko.position.set(-60, 3, -10.2); scene.add(tauko);
    const taukoT = sylinteri(0.08, 0.08, 3, mat(0x8a9099, { metalness: 0.7 }), 6); taukoT.position.set(-60, 1.5, -10.25); scene.add(taukoT);

    /* Kaupunki: bussi ja pysäkki kadulla */
    const bussi = new THREE.Group();
    const bk = laatikko(2.5, 3, 11, mat(0xf2f4f6, { metalness: 0.4, roughness: 0.4 })); bk.position.y = 1.9; bussi.add(bk);
    const bs = laatikko(2.52, 0.9, 11.02, mat(0x1d4fb0, { metalness: 0.3 })); bs.position.y = 0.9; bussi.add(bs);
    for (let i = 0; i < 5; i++) [1.27, -1.27].forEach((x) => { const ik = laatikko(0.02, 1.2, 1.8, mat(0x1f2a36, { metalness: 0.6, roughness: 0.2 })); ik.position.set(x, 2.4, -4 + i * 2.1); bussi.add(ik); });
    const bTaulu = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["7  KESKUSTA"], "#ffb02a", "#111111", 384, 80) })); bTaulu.position.set(0, 3.1, 5.52); bussi.add(bTaulu);
    for (let i = 0; i < 2; i++) [1.25, -1.25].forEach((x) => { const r = sylinteri(0.5, 0.5, 0.35, mat(0x111111), 12); r.rotation.z = Math.PI / 2; r.position.set(x, 0.5, -3.5 + i * 7); bussi.add(r); });
    const ramppi = laatikko(1.1, 0.06, 1.4, mat(0x9aa3ad, { metalness: 0.7 })); ramppi.position.set(-1.8, 0.25, 0.5); ramppi.rotation.z = 0.25; bussi.add(ramppi);
    bussi.position.set(-4.5, 0, 22); scene.add(bussi);
    const katos = new THREE.Group(); const kk = laatikko(3.6, 0.15, 1.6, mat(0x6a7078, { metalness: 0.6 })); kk.position.y = 2.6; katos.add(kk); const kkl = laatikko(3.6, 0.15, 1.6, mat(V.lumi, { metalness: 0 })); kkl.position.y = 2.75; katos.add(kkl);
    const lasi = laatikko(3.6, 2.4, 0.05, mat(0xbfd8ff, { transparent: true, opacity: 0.35, metalness: 0.2 })); lasi.position.set(0, 1.3, -0.75); katos.add(lasi);
    katos.position.set(-12, 0, 22); katos.rotation.y = Math.PI / 2; scene.add(katos);
    const ihmiset = [];
    function ihminen(x, z, takki) { const g = new THREE.Group(); const k = sylinteri(0.26, 0.3, 0.9, mat(takki, { metalness: 0 }), 10); k.position.y = 1.05; g.add(k); const j = sylinteri(0.2, 0.18, 0.6, mat(0x1d2230, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j); const p = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(0xe0b896, { metalness: 0 })); p.position.y = 1.72; g.add(p); const pipo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(takki === 0x1d4fb0 ? 0xff4a4a : 0x2a5bd7, { metalness: 0 })); pipo.position.y = 1.78; g.add(pipo); g.position.set(x, 0, z); g.userData.v = Math.random() * 6; scene.add(g); ihmiset.push(g); return g; }
    ihminen(-12.5, 20.6, 0x7a2a5a); ihminen(-12.4, 23.2, 0x3a5a2a);
    const pyoratuoli = new THREE.Group(); const pi = ihminen(0, 0, 0x1d4fb0); scene.remove(pi); pi.scale.set(1, 0.72, 1); pyoratuoli.add(pi);
    [0.35, -0.35].forEach((z) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 6, 18), mat(0x333333, { metalness: 0.6 })); r.position.set(0, 0.35, z); pyoratuoli.add(r); });
    pyoratuoli.position.set(-10.6, 0, 22.4); pyoratuoli.rotation.y = -Math.PI / 2; scene.add(pyoratuoli);
    /* Talot kadun varrella */
    for (let i = 0; i < 6; i++) { const k = 8 + (i * 5) % 8; const t = laatikko(9, k, 8, mat([0xc9b8a2, 0x9fb0bf, 0xd8cfc2, 0xb0a18c][i % 4], { roughness: 0.9, metalness: 0 })); t.position.set(i < 3 ? -22 : 10, k / 2, (i < 3 ? 14 : 44) + (i % 3) * 13); scene.add(t); const l = laatikko(9.2, 0.3, 8.2, mat(V.lumi, { metalness: 0 })); l.position.set(t.position.x, k + 0.15, t.position.z); scene.add(l); }

    /* Korjaamo: halli, nostin, auto, renkaat ja asiakaspalvelu */
    const korjaamo = new THREE.Group();
    const kl = laatikko(18, 0.1, 12, mat(0x8a9099, { roughness: 0.7, metalness: 0.2 })); korjaamo.add(kl);
    const sMat = mat(0xd8dde3, { roughness: 0.9, metalness: 0.1 });
    [[0, 3, -6, 18, 0], [-9, 3, 0, 12, Math.PI / 2], [9, 3, 0, 12, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, sMat); s.position.set(x, y, z); s.rotation.y = r; korjaamo.add(s); });
    const kKatto = laatikko(18.4, 0.3, 12.4, mat(0x4a525c)); kKatto.position.y = 6.1; korjaamo.add(kKatto); const kKL = laatikko(18.4, 0.3, 12.4, mat(V.lumi, { metalness: 0 })); kKL.position.y = 6.4; korjaamo.add(kKL);
    [[-6.5, 2.2], [6.5, 2.2]].forEach(([x]) => { const e = laatikko(5, 6, 0.2, sMat); e.position.set(x, 3, 6); korjaamo.add(e); });
    const ylapalkki = laatikko(8, 1.6, 0.2, sMat); ylapalkki.position.set(0, 5.2, 6); korjaamo.add(ylapalkki);
    const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["AUTOKORJAAMO"], "#ffffff", "#c8201c", 512, 100) })); kyltti.position.set(0, 7.3, 6.15); korjaamo.add(kyltti);
    const nostin = new THREE.Group(); [-1.3, 1.3].forEach((z) => { const p = laatikko(0.3, 3.2, 0.3, mat(0xc8201c, { metalness: 0.5 })); p.position.set(-2.2, 1.6, z * 1.2); nostin.add(p); const v = laatikko(4.4, 0.15, 0.3, mat(0x555a60, { metalness: 0.7 })); v.position.set(0, 1.7, z); nostin.add(v); });
    korjaamo.add(nostin);
    const nostoAuto = auto(0xf2f2f2); nostoAuto.position.set(0, 1.8, 0); korjaamo.add(nostoAuto);
    const kolariAuto = auto(0x1d4fb0); kolariAuto.position.set(-4.5, 0.05, -3.2); kolariAuto.rotation.y = 0.2; korjaamo.add(kolariAuto);
    const kolho = laatikko(0.6, 0.6, 1.9, mat(0x163a80, { metalness: 0.6 })); kolho.position.set(2.2, 0.75, 0); kolho.rotation.z = 0.35; kolariAuto.add(kolho);
    const anturi = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), hehku(0xff8a2a, 1.8)); anturi.position.set(2.15, 0.6, 0); kolariAuto.add(anturi);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.15, 8, 18), mat(0x161616, { roughness: 0.9 })); r.rotation.x = Math.PI / 2; r.position.set(6.5 + (i % 2) * 0.9, 0.18 + j * 0.3, -4 + Math.floor(i / 2) * 1); korjaamo.add(r); }
    const tiski = laatikko(3, 1.1, 0.8, mat(0x3a4a5c, { metalness: 0.3 })); tiski.position.set(6, 0.55, 3.6); korjaamo.add(tiski);
    const naytto = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ map: kayraTekstuuri("#6fffe9", 3) })); naytto.position.set(6, 1.45, 3.4); naytto.rotation.y = Math.PI; korjaamo.add(naytto);
    const mekaanikko = ihminen(0, 0, 0x2a5bd7); scene.remove(mekaanikko); mekaanikko.position.set(1.8, 0, 1.6); korjaamo.add(mekaanikko);
    const myyja = ihminen(0, 0, 0x3a3f47); scene.remove(myyja); myyja.position.set(6, 0, 2.8); korjaamo.add(myyja);
    const jono = [0, 1, 2].map((i) => { const a = ihminen(0, 0, [0x8a3a2a, 0x2a6a5a, 0x6a5a2a][i]); scene.remove(a); a.position.set(6 - i * 0.2, 0, 4.6 + i * 0.9); a.visible = false; korjaamo.add(a); return a; });
    const kValo = new THREE.PointLight(0xfff4e0, 14, 22, 1.5); kValo.position.set(0, 5.5, 0); korjaamo.add(kValo);
    korjaamo.position.set(26, 0, 22); korjaamo.rotation.y = -Math.PI / 2; scene.add(korjaamo);

    /* Liikennekeskus: huone näyttöineen (kaukana muusta maailmasta) */
    const lk = new THREE.Group();
    const lkl = laatikko(16, 0.1, 12, mat(0x2a2f38, { roughness: 1, metalness: 0 })); lk.add(lkl);
    const lks = mat(0x1e2632, { roughness: 1, metalness: 0 });
    [[0, 3, -6, 16, 0], [0, 3, 6, 16, 0], [-8, 3, 0, 12, Math.PI / 2], [8, 3, 0, 12, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, lks); s.position.set(x, y, z); s.rotation.y = r; lk.add(s); });
    const kameraKuva = (siemen) => { const c = document.createElement("canvas"); c.width = 256; c.height = 144; const g = c.getContext("2d");
      g.fillStyle = "#c9d3dd"; g.fillRect(0, 0, 256, 144); g.fillStyle = "#3a3f46"; g.beginPath(); g.moveTo(90 + siemen * 6, 0); g.lineTo(166 - siemen * 4, 0); g.lineTo(256, 144); g.lineTo(0, 144); g.fill();
      g.fillStyle = "#f2f2f2"; for (let y = 10; y < 144; y += 22) g.fillRect(126 + (y / 144) * 4, y, 3, 10);
      ["#c8201c", "#1d4fb0", "#eeeeee"].forEach((v, i) => { g.fillStyle = v; g.fillRect(70 + i * 40 + siemen * 5, 60 + i * 20, 18 + i * 6, 12 + i * 4); });
      g.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < 160; i++) g.fillRect(Math.random() * 256, Math.random() * 144, 2, 2);
      g.fillStyle = "#ffd43b"; g.font = "bold 12px Arial"; g.fillText("KAMERA " + (siemen + 1), 6, 14);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const n = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: kameraKuva(r * 4 + c) })); n.position.set(-5.1 + c * 3.4, 2.4 + r * 1.95, -5.85); lk.add(n); }
    [-4, 0, 4].forEach((x, i) => { const p = laatikko(3.4, 0.08, 1.3, mat(0x9aa3ad, { metalness: 0.4 })); p.position.set(x, 1, -1); lk.add(p);
      [-0.8, 0.8].forEach((dx, j) => { const n = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85), new THREE.MeshBasicMaterial({ map: kayraTekstuuri(["#6fffe9", "#ffb02a", "#4aa8ff"][(i + j) % 3], i * 3 + j) })); n.position.set(x + dx, 1.6, -1.45); n.rotation.y = -dx * 0.25; lk.add(n); });
      const p2 = ihminen(0, 0, 0x2a3a5a); scene.remove(p2); p2.position.set(x, 0.1, 0.1); lk.add(p2); p2.userData.lk = true; });
    const lkValo = new THREE.PointLight(0xbfd8ff, 16, 20, 1.5); lkValo.position.set(0, 5, 1); lk.add(lkValo);
    lk.position.set(0, 0, 140); scene.add(lk);

    /* Lumisade */
    const lumi = hiukkaset(1800, 0xffffff, 0.16); lumi.points.material.blending = THREE.NormalBlending; lumi.points.material.opacity = 0.85;
    for (let i = 0; i < 1800; i++) { lumi.pos.set([-60 + Math.random() * 120, Math.random() * 25, -60 + Math.random() * 100], i * 3); lumi.nopeus[i] = 1.5 + Math.random() * 1.5; }
    scene.add(lumi.points);

    const tila = { tila: "lumi" };
    function asetaTila(t) {
      tila.tila = t.tila || "lumi";
      const myrsky = tila.tila === "myrsky" || tila.tila === "puu", ilta = tila.tila === "ilta";
      kaatunut.visible = tila.tila === "puu";
      jono.forEach((a) => { a.visible = tila.tila === "jono"; });
      scene.background.set(myrsky ? 0x8a96a6 : ilta ? 0xe8b8a0 : V.taivas);
      scene.fog.near = myrsky ? 18 : 30; scene.fog.far = myrsky ? 80 : 120; scene.fog.color.copy(scene.background);
      hemi.intensity = myrsky ? 0.85 : 1.1; aur.color.set(ilta ? 0xffc8a0 : 0xffffff);
      lumi.points.visible = !ilta; lumi.points.material.size = myrsky ? 0.22 : 0.16;
    }
    function paivita(dt, t) {
      const myrsky = tila.tila === "myrsky" || tila.tila === "puu";
      liikkuvat.forEach((a) => { const u = a.userData; u.x += u.s * u.v * dt * (myrsky ? 0.6 : 1); if (u.x > 115) u.x = -115; if (u.x < -115) u.x = 115; a.position.set(u.x, 0, u.z); });
      if (tila.tila !== "tauko") { rekka.userData.x += dt * 9; if (rekka.userData.x > 115) rekka.userData.x = -115; } rekka.position.x = tila.tila === "tauko" ? -66 : rekka.userData.x; rekka.position.z = tila.tila === "tauko" ? -7 : -18 + 5.5;
      const junaSeis = tila.tila === "puu";
      if (!junaSeis) { juna.position.x += dt * 16; if (juna.position.x > 160) juna.position.x = -100; } else juna.position.x = 20;
      const tuuli = myrsky ? 3 : 0.8;
      for (let i = 0; i < 1800; i++) { let y = lumi.pos[i * 3 + 1] - lumi.nopeus[i] * dt; let x = lumi.pos[i * 3] + tuuli * dt; if (y < 0) y = 25; if (x > 60) x = -60; lumi.pos[i * 3 + 1] = y; lumi.pos[i * 3] = x; }
      lumi.points.geometry.attributes.position.needsUpdate = true;
      anturi.material.emissiveIntensity = Math.sin(t * 6) > 0 ? 2.2 : 0.3;
      ihmiset.forEach((p) => { p.rotation.y = Math.sin(t * 0.6 + p.userData.v) * 0.4; });
      mekaanikko.position.z = 1.6 + Math.sin(t * 0.5) * 1.2;
      nostoAuto.position.y = 1.8 + Math.sin(t * 0.3) * 0.05;
    }
    const kohtaukset = {
      kansi:          { kamera: [-30, 10, 8],    kohde: [10, 2, -20],     tila: {} },
      liikenne:       { kamera: [-34, 14, 10],   kohde: [8, 1, -20],      tila: {} },
      korjaamo:       { kamera: [13, 3.4, 23],   kohde: [27, 1.6, 22],    tila: {} },
      moottoritie:    { kamera: [-80, 6, -4],    kohde: [-55, 1.5, -16],  tila: { tila: "myrsky" } },
      bussi:          { kamera: [-17, 3, 32],    kohde: [-7, 1.5, 21],    tila: {} },
      kolari:         { kamera: [23, 2.2, 14.5], kohde: [29.2, 0.8, 17.5],      tila: {} },
      juna:           { kamera: [54, 5, -38],    kohde: [28, 3, -49],     tila: { tila: "puu" } },
      huolto:         { kamera: [21.5, 2.6, 21], kohde: [23, 1.2, 28],    tila: { tila: "jono" } },
      liikennekeskus: { kamera: [0, 3, 145],     kohde: [0, 3, 135],      tila: {} },
      loppu:          { kamera: [-30, 10, 8],    kohde: [10, 2, -20],     tila: { tila: "ilta" } }
    };
    return { kohtaukset, oletus: "liikenne", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     ELÄIMET – "Eläinkeskuksen pitkä päivä": maaseudun eläinkeskus keväällä
     ------------------------------------------------------------------------ */
  elainkeskus(scene) {
    const V = { taivas: 0xbcd3e6, nurmi: 0x6f8f4a, multa: 0x8a7458, punainen: 0x9e2f25, valko: 0xf2efe8, puu: 0xb48a52 };
    scene.background = new THREE.Color(V.taivas);
    scene.fog = new THREE.Fog(V.taivas, 50, 150);
    const hemi = new THREE.HemisphereLight(0xfff8ec, 0x5a6a40, 1.15); scene.add(hemi);
    const aur = new THREE.DirectionalLight(0xfff0d8, 1.2); aur.position.set(-25, 30, 18); scene.add(aur);
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(V.nurmi, { roughness: 1, metalness: 0 })); maa.rotation.x = -Math.PI / 2; maa.position.y = -0.02; scene.add(maa);
    const piha = new THREE.Mesh(new THREE.CircleGeometry(16, 40), mat(0xa89a80, { roughness: 1, metalness: 0 })); piha.rotation.x = -Math.PI / 2; scene.add(piha);
    /* Metsänreuna */
    const havu = mat(0x2f4f33, { roughness: 1, metalness: 0 }), koivu = mat(0xe8e4da, { metalness: 0 }), runkoM = mat(0x6a4a32, { metalness: 0 });
    for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 40, g = new THREE.Group(), k = 0.9 + Math.random() * 0.8;
      const rr = sylinteri(0.25 * k, 0.32 * k, 3 * k, i % 3 ? runkoM : koivu, 6); rr.position.y = 1.5 * k; g.add(rr);
      const c = new THREE.Mesh(new THREE.ConeGeometry(2 * k, 7 * k, 8), havu); c.position.y = 6 * k; g.add(c);
      g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); scene.add(g); }
    /* Rakennus-apu */
    function talo(w, h, d, vari, kattoVari) { const g = new THREE.Group(); const r = laatikko(w, h, d, mat(vari, { roughness: 0.9, metalness: 0 })); r.position.y = h / 2; g.add(r);
      [-1, 1].forEach((s) => { const k = laatikko(w + 0.6, 0.2, d / 2 / Math.cos(0.5) + 0.4, mat(kattoVari || 0x3a3f47, { roughness: 0.8 })); k.position.set(0, h + Math.tan(0.5) * d / 4, s * d / 4); k.rotation.x = s * 0.5; g.add(k); });
      return g; }
    function kyltti(teksti, w) { return new THREE.Mesh(new THREE.PlaneGeometry(w || 4, 0.9), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri([teksti], "#ffffff", "#2f6b3a", 512, 110) })); }
    /* Eläimet */
    const elaimet = [];
    function elain(tyyppi, vari) {
      const g = new THREE.Group(), m = mat(vari, { roughness: 0.9, metalness: 0 });
      const D = { koira: [0.9, 0.45, 0.35, 0.45, 0.35], lehma: [2.4, 1.1, 0.9, 1.1, 0.7], hevonen: [2.2, 0.9, 0.7, 1.3, 0.6], lammas: [1.1, 0.7, 0.7, 0.45, 0.4], kissa: [0.55, 0.28, 0.22, 0.3, 0.22] }[tyyppi];
      const [l, k, lev, jk, pk] = D;
      const runko = tyyppi === "lammas" ? new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), mat(0xe8e0cc, { roughness: 1, metalness: 0 })) : laatikko(l, k, lev, m);
      if (tyyppi === "lammas") runko.scale.set(1.1, 0.85, 0.8); runko.position.y = jk + k / 2; g.add(runko);
      const paa = laatikko(pk * 1.2, pk, pk * 0.9, tyyppi === "lammas" ? mat(0x3a3530, { metalness: 0 }) : m); paa.position.set(l / 2 + pk * 0.4, jk + k * (tyyppi === "hevonen" ? 1.3 : 0.9), 0); g.add(paa);
      if (tyyppi === "hevonen") { const kaula = laatikko(0.5, 1.1, 0.4, m); kaula.position.set(l / 2 - 0.1, jk + k + 0.2, 0); kaula.rotation.z = -0.5; g.add(kaula); }
      [[l / 2 - 0.15, lev / 2 - 0.1], [l / 2 - 0.15, -lev / 2 + 0.1], [-l / 2 + 0.15, lev / 2 - 0.1], [-l / 2 + 0.15, -lev / 2 + 0.1]].forEach(([x, z]) => { const j = laatikko(0.14 * (k + 0.3), jk, 0.14 * (k + 0.3), tyyppi === "lammas" ? mat(0x3a3530) : m); j.position.set(x, jk / 2, z); g.add(j); });
      if (tyyppi === "lehma") [[0.3, 0.2], [-0.5, -0.3]].forEach(([x, z]) => { const p = laatikko(0.6, 0.5, 0.02, mat(0x111111, { metalness: 0 })); p.position.set(x, jk + k / 2 + 0.1, lev / 2 + 0.01 * (z > 0 ? 1 : -1) * 1); g.add(p); });
      if (tyyppi === "koira" || tyyppi === "kissa") { const h = laatikko(0.4 * l, 0.08, 0.08, m); h.position.set(-l / 2 - 0.15, jk + k * 0.9, 0); h.rotation.z = 0.6; g.add(h); g.userData.hanta = h; }
      g.userData.v = Math.random() * 6; scene.add(g); elaimet.push(g); return g;
    }
    function ihminen(x, z, takki) { const g = new THREE.Group(); const k = sylinteri(0.26, 0.3, 0.9, mat(takki, { metalness: 0 }), 10); k.position.y = 1.05; g.add(k); const j = sylinteri(0.2, 0.18, 0.6, mat(0x2a3140, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j); const p = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(0xe0b896, { metalness: 0 })); p.position.y = 1.72; g.add(p); g.position.set(x, 0, z); g.userData.v = Math.random() * 6; scene.add(g); return g; }

    /* Koirahoitola ja aitaukset (x -14, z 6) */
    const hoitola = talo(10, 3.2, 6, 0xe6d6b0); hoitola.position.set(-14, 0, 4); hoitola.rotation.y = 0.4; scene.add(hoitola);
    const k1 = kyltti("KOIRAHOITOLA"); k1.position.set(0, 2.6, 3.02); hoitola.add(k1);
    const aitaM = mat(0xb08a58, { metalness: 0 });
    for (let i = 0; i < 4; i++) { const tarha = new THREE.Group(); [[0, 2, 3, 0], [1.5, 0.5, 0.06, 1], [-1.5, 0.5, 0.06, 1]].forEach(([x, z, w, r]) => { const a = laatikko(r ? 3 : w, 1.1, r ? 0.06 : 0.06, aitaM); a.position.set(x, 0.55, z); if (r) { a.rotation.y = Math.PI / 2; a.position.set(x, 0.55, 0.5); } tarha.add(a); }); tarha.position.set(-4.5 + i * 3.1 - 14, 0, 0); hoitola.add(tarha); tarha.position.set(-4.5 + i * 3.1, 0, 4.6); }
    const koirat = [0xd9a441, 0x2a2a2a, 0xf2efe8, 0x8a5a32].map((v, i) => { const d = elain("koira", v); d.position.set(-19 + i * 2.7, 0, 9.6 - i * 1.2); d.rotation.y = -0.4; return d; });
    const hoitaja = ihminen(-12.5, 9.5, 0x2f6b3a);
    /* Pieneläinklinikka */
    const klinikka = talo(8, 3.4, 6, 0xf2f4f6, 0x5a6470); klinikka.position.set(-2, 0, -10); scene.add(klinikka);
    const k2 = kyltti("ELÄINKLINIKKA"); k2.position.set(0, 2.7, 3.02); klinikka.add(k2);
    const risti = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["✚"], "#2f9e44", "#ffffff", 128, 128) })); risti.position.set(-3, 2.7, 3.02); klinikka.add(risti);
    const ovi = laatikko(1.2, 2.2, 0.05, mat(0x8fc6e8, { metalness: 0.4, roughness: 0.2 })); ovi.position.set(1.6, 1.1, 3.02); klinikka.add(ovi);
    const kissa = elain("kissa", 0x5a4632); kissa.position.set(-0.2, 0, -5.8); const kantaja = ihminen(0.8, -5.4, 0x8a3a5a);
    /* Navetta ja lehmät */
    const navetta = talo(16, 5, 10, V.punainen); navetta.position.set(14, 0, -10); navetta.rotation.y = -0.35; scene.add(navetta);
    [[-5, 0], [5, 0]].forEach(([x]) => { const n = laatikko(0.2, 2.6, 0.06, mat(0xffffff)); n.position.set(x, 1.3, 5.04); navetta.add(n); });
    const navOvi = laatikko(3.6, 3.2, 0.06, mat(0x6a2018)); navOvi.position.set(0, 1.6, 5.03); navetta.add(navOvi);
    const siilo = sylinteri(1.6, 1.6, 9, mat(0xc9ced6, { metalness: 0.6 }), 16); siilo.position.set(24, 4.5, -16); scene.add(siilo);
    const lehmat = [0, 1, 2, 3].map((i) => { const c = elain("lehma", i % 2 ? 0xf2efe8 : 0x6a3a22); c.position.set(18 + (i % 2) * 4, 0, -1 + Math.floor(i / 2) * 3.6); c.rotation.y = 0.5 + i * 0.8; return c; });
    const makaava = lehmat[0]; 
    const navettaAita = new THREE.Group(); for (let i = 0; i < 10; i++) { const t = laatikko(0.12, 1.2, 0.12, aitaM); t.position.set(15 + i * 1.4, 0.6, 4.5); navettaAita.add(t); } const ap = laatikko(13, 0.1, 0.08, aitaM); ap.position.set(21.3, 1, 4.5); navettaAita.add(ap); scene.add(navettaAita);
    const karjanhoitaja = ihminen(16, 1.6, 0x3a4a5a);
    /* Talli, tarha ja hevoset */
    const talli = talo(12, 3.6, 7, 0x8a5a32, 0x2a2e36); talli.position.set(10, 0, 14); talli.rotation.y = Math.PI + 0.3; scene.add(talli);
    const k3 = kyltti("TALLI", 2.5); k3.position.set(0, 3, 3.52); talli.add(k3);
    const tarha = new THREE.Group(); const tarhaM = mat(0xf2efe8, { metalness: 0 });
    for (let a = 0; a < 24; a++) { const kul = a / 24 * Math.PI * 2; const t = laatikko(0.15, 1.4, 0.15, tarhaM); t.position.set(Math.cos(kul) * 7, 0.7, Math.sin(kul) * 7); tarha.add(t);
      const kai = laatikko(1.85, 0.1, 0.08, tarhaM); kai.position.set(Math.cos(kul + Math.PI / 24) * 7, 1.2, Math.sin(kul + Math.PI / 24) * 7); kai.rotation.y = -kul - Math.PI / 24 + Math.PI / 2; tarha.add(kai); }
    tarha.position.set(22, 0, 18); scene.add(tarha);
    const hevoset = [0x8a5a32, 0xd9c8a8].map((v, i) => { const h = elain("hevonen", v); h.position.set(20 + i * 4, 0, 17 + i * 2); h.rotation.y = i ? 2 : 0.3; return h; });
    const tallityontekija = ihminen(19, 15, 0x5a2a6a);
    /* Lammastarha */
    const lammasTarha = new THREE.Group(); for (let i = 0; i < 16; i++) { const t = laatikko(0.12, 1, 0.12, aitaM); const s = Math.floor(i / 4), j = i % 4; t.position.set(s % 2 ? j * 3 : (s ? 12 : 0), 0.5, s % 2 ? (s === 1 ? 0 : 12) : j * 3); lammasTarha.add(t); }
    lammasTarha.position.set(-28, 0, -14); scene.add(lammasTarha);
    const olki = new THREE.Mesh(new THREE.CircleGeometry(6, 24), mat(0xd9c27a, { roughness: 1, metalness: 0 })); olki.rotation.x = -Math.PI / 2; olki.position.set(-22, 0.01, -8); scene.add(olki);
    const lampaat = []; for (let i = 0; i < 9; i++) { const l = elain("lammas", 0xe8e0cc); l.position.set(-26 + (i % 3) * 3 + Math.random(), 0, -12 + Math.floor(i / 3) * 3 + Math.random()); l.rotation.y = Math.random() * 6; lampaat.push(l); }
    const pyoro = sylinteri(0.8, 0.8, 1.4, mat(0xe8c23a, { roughness: 0.8, metalness: 0 }), 16); pyoro.rotation.z = Math.PI / 2; pyoro.position.set(-19, 0.8, -4); scene.add(pyoro);
    const elainlaakari = ihminen(-21, -6, 0x2f9e8a);
    /* Pöly ja hyönteiset aurinkoisessa ilmassa */
    const poly = hiukkaset(300, 0xfff4c8, 0.12); poly.points.material.blending = THREE.NormalBlending; poly.points.material.opacity = 0.6;
    for (let i = 0; i < 300; i++) { poly.pos.set([-40 + Math.random() * 80, Math.random() * 8, -30 + Math.random() * 60], i * 3); poly.nopeus[i] = Math.random() * 6; } scene.add(poly.points);

    const tila = { tila: "paiva" };
    function asetaTila(t) {
      tila.tila = t.tila || "paiva";
      const ilta = tila.tila === "ilta";
      makaava.position.y = tila.tila === "navetta" ? -0.85 : 0;
      scene.background.set(ilta ? 0xf0b890 : V.taivas); scene.fog.color.copy(scene.background);
      hemi.intensity = ilta ? 0.85 : 1.15; aur.color.set(ilta ? 0xffb080 : 0xfff0d8); aur.position.set(ilta ? -40 : -25, ilta ? 8 : 30, 18);
    }
    function paivita(dt, t) {
      elaimet.forEach((e) => { if (e.userData.hanta) e.userData.hanta.rotation.y = Math.sin(t * 8 + e.userData.v) * 0.6; });
      koirat.forEach((d, i) => { d.position.x = -19 + i * 2.7 + Math.sin(t * 0.8 + i) * 0.8; d.rotation.y = Math.cos(t * 0.8 + i) > 0 ? -0.4 : Math.PI - 0.4; });
      hevoset.forEach((h, i) => { const a = t * 0.15 + i * 3; h.position.set(22 + Math.cos(a) * 4, 0, 18 + Math.sin(a) * 4); h.rotation.y = -a - Math.PI / 2 * (i ? 1 : 1); });
      lampaat.forEach((l, i) => { l.rotation.y += Math.sin(t * 0.3 + i) * 0.002; });
      lehmat.forEach((c, i) => { if (c !== makaava || tila.tila !== "navetta") c.rotation.y = 0.5 + i * 0.8 + Math.sin(t * 0.2 + i) * 0.2; });
      for (let i = 0; i < 300; i++) { poly.pos[i * 3 + 1] = (poly.pos[i * 3 + 1] + Math.sin(t + poly.nopeus[i]) * dt * 0.3 + 8) % 8; } poly.points.geometry.attributes.position.needsUpdate = true;
      hoitaja.rotation.y = Math.sin(t * 0.5) * 0.8; elainlaakari.rotation.y = Math.sin(t * 0.4) * 0.6;
    }
    const kohtaukset = {
      kansi:     { kamera: [-30, 14, 34],  kohde: [0, 2, -2],     tila: {} },
      piha:      { kamera: [-26, 12, 30],  kohde: [0, 2, -2],     tila: {} },
      hoitola:   { kamera: [-10, 3.2, 17], kohde: [-16, 1, 8],    tila: {} },
      trimmaamo: { kamera: [-8, 2.6, 12],  kohde: [-14, 1.4, 5],  tila: {} },
      klinikka:  { kamera: [4, 2.6, -1],   kohde: [-1, 1.2, -7],  tila: {} },
      navetta:   { kamera: [10, 3, 8],     kohde: [18, 0.8, -1],  tila: { tila: "navetta" } },
      talli:     { kamera: [12, 3.5, 26],  kohde: [22, 1.2, 18],  tila: {} },
      lampaat:   { kamera: [-13, 4, -3],   kohde: [-24, 0.8, -9], tila: {} },
      loppu:     { kamera: [-30, 14, 34],  kohde: [0, 2, -2],     tila: { tila: "ilta" } }
    };
    return { kohtaukset, oletus: "piha", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     MUSIIKKI – "Konserttitalon kulisseissa": konserttisali, lava, valot ja äänitysstudio
     ------------------------------------------------------------------------ */
  konserttitalo(scene) {
    const V = { tausta: 0x120c1c, puu: 0xa8744a, puuTumma: 0x6a4428, lava: 0x3a2a20, penkki: 0x7a1f3a };
    scene.background = new THREE.Color(V.tausta);
    scene.fog = new THREE.Fog(V.tausta, 40, 110);
    const hemi = new THREE.HemisphereLight(0xffe8d0, 0x1a1020, 0.55); scene.add(hemi);
    const lavaValo = new THREE.PointLight(0xffe2b8, 30, 40, 1.4); lavaValo.position.set(0, 12, -6); scene.add(lavaValo);
    const saliValo = new THREE.PointLight(0xffd8a8, 0, 60, 1.2); saliValo.position.set(0, 16, 14); scene.add(saliValo);

    /* Sali: lattia, seinät puupaneeleista, katsomo portaittain */
    const lattia = laatikko(60, 0.2, 70, mat(0x3a2418, { roughness: 0.9, metalness: 0 })); lattia.position.set(0, -0.1, 8); scene.add(lattia);
    const seinaM = mat(V.puu, { roughness: 0.8, metalness: 0.05 });
    [-30, 30].forEach((x) => { const s = laatikko(0.5, 22, 70, seinaM); s.position.set(x, 11, 8); scene.add(s);
      for (let i = 0; i < 12; i++) { const r = laatikko(0.3, 18, 0.6, mat(V.puuTumma, { metalness: 0 })); r.position.set(x - Math.sign(x) * 0.4, 9, -24 + i * 6); scene.add(r); } });
    const taka = laatikko(60, 22, 0.5, seinaM); taka.position.set(0, 11, -26); scene.add(taka);
    for (let i = 0; i < 9; i++) { const u = sylinteri(0.35, 0.35, 6, mat(0xc9ced6, { metalness: 0.8, roughness: 0.3 }), 10); u.position.set(-12 + i * 3, 15, -25.4); scene.add(u); }
    const katto = laatikko(60, 0.5, 70, mat(0x1c1420, { metalness: 0 })); katto.position.set(0, 22, 8); scene.add(katto);
    const penkkiM = mat(V.penkki, { roughness: 0.9, metalness: 0 });
    /* Penkit ja yleisö instansseina (paljon kappaleita, vähän piirtokutsuja) */
    const paikat = [];
    const porrasM = mat(0x4a2c1c, { metalness: 0 });
    for (let r = 0; r < 14; r++) {
      const korko = r * 0.55, z = 6 + r * 2.2;
      const porras = laatikko(52, korko + 0.2, 2.2, porrasM); porras.position.set(0, (korko + 0.2) / 2 - 0.1, z); scene.add(porras);
      for (let c = 0; c < 22; c++) { const x = -23 + c * 2.2; if (Math.abs(x) < 1.2) continue; paikat.push([x, korko, z]); }
    }
    const penkit = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 1, 0.3), penkkiM, paikat.length);
    const paat = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 8, 6), mat(0xffffff, { metalness: 0 }), paikat.length);
    const apu = new THREE.Object3D(), vari = new THREE.Color();
    paikat.forEach(([x, k, z], i) => {
      apu.position.set(x, k + 0.75, z + 0.6); apu.updateMatrix(); penkit.setMatrixAt(i, apu.matrix);
      apu.position.set(x, k + 1.55, z + 0.4); apu.updateMatrix(); paat.setMatrixAt(i, apu.matrix);
      paat.setColorAt(i, vari.set([0x2a2a30, 0x3a2a22, 0x5a4a3a, 0x1c1c20][i % 4]));
    });
    scene.add(penkit); paat.visible = false; scene.add(paat);
    const yleiso = [paat];
    /* Lava */
    const lava = laatikko(36, 1.4, 18, mat(V.lava, { roughness: 0.7, metalness: 0 })); lava.position.set(0, 0.6, -15); scene.add(lava);
    const lavaReuna = laatikko(36, 0.08, 0.2, hehku(0xffd38a, 0.6)); lavaReuna.position.set(0, 1.32, -6.05); scene.add(lavaReuna);
    const L0 = 1.3;
    /* Orkesteri: tuolit ja nuottitelineet kaarissa */
    const tuoliM = mat(0x1a1a1e, { metalness: 0.2 }), teline = mat(0x2a2a2e, { metalness: 0.6 }), nuottiM = mat(0xf2efe6, { metalness: 0 });
    const muusikot = [];
    for (let k = 0; k < 3; k++) { const sade = 5 + k * 3, n = 7 + k * 3;
      for (let i = 0; i < n; i++) { const a = Math.PI * (0.15 + 0.7 * i / (n - 1)); const x = Math.cos(a) * sade, z = -9 - Math.sin(a) * sade * 0.7;
        const tuoli = laatikko(0.6, 0.6, 0.6, tuoliM); tuoli.position.set(x, L0 + 0.3, z); scene.add(tuoli);
        const jalka = sylinteri(0.02, 0.02, 1.1, teline, 5); jalka.position.set(x * 0.9, L0 + 0.55, z + 0.7); scene.add(jalka);
        const nuotti = laatikko(0.6, 0.45, 0.02, nuottiM); nuotti.position.set(x * 0.9, L0 + 1.15, z + 0.7); nuotti.rotation.x = -0.5; scene.add(nuotti);
        const m = new THREE.Group(); const kr = sylinteri(0.22, 0.26, 0.7, mat(0x111114, { metalness: 0 }), 8); kr.position.y = 0.95; m.add(kr);
        const pa = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), mat(0xe0b896, { metalness: 0 })); pa.position.y = 1.45; m.add(pa);
        m.position.set(x, L0, z); m.lookAt(0, L0, -5); scene.add(m); muusikot.push(m); } }
    /* Kapellimestarin koroke */
    const koroke = laatikko(1.2, 0.3, 1.2, mat(0x5a3a28, { metalness: 0 })); koroke.position.set(0, L0 + 0.15, -7.2); scene.add(koroke);
    const kapu = new THREE.Group(); const kk = sylinteri(0.24, 0.28, 0.9, mat(0x111114), 8); kk.position.y = 0.75; kapu.add(kk); const kp = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat(0xe0b896)); kp.position.y = 1.4; kapu.add(kp);
    const tahtipuikko = laatikko(0.02, 0.02, 0.45, mat(0xffffff)); tahtipuikko.position.set(0.3, 1.1, -0.25); kapu.add(tahtipuikko);
    kapu.position.set(0, L0 + 0.3, -7.2); kapu.rotation.y = Math.PI; scene.add(kapu);
    /* Flyygeli */
    const flyygeli = new THREE.Group(); const fk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.35, 24, 1, false, 0, Math.PI), mat(0x0a0a0c, { metalness: 0.4, roughness: 0.15 })); fk.scale.set(1, 1, 1.6); fk.position.y = 1; flyygeli.add(fk);
    const fl = laatikko(2.4, 0.35, 0.6, mat(0x0a0a0c, { metalness: 0.4, roughness: 0.15 })); fl.position.set(0, 1, -0.2); flyygeli.add(fl);
    const kos = laatikko(2.2, 0.06, 0.25, mat(0xf2f2ee)); kos.position.set(0, 1.08, -0.42); flyygeli.add(kos);
    const kansi = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.04, 24, 1, false, 0, Math.PI), mat(0x0a0a0c, { metalness: 0.4, roughness: 0.15 })); kansi.scale.set(1, 1, 1.6); kansi.position.set(0, 1.6, 0.3); kansi.rotation.x = -0.45; flyygeli.add(kansi);
    [-1, 1, 0].forEach((x, i) => { const j = sylinteri(0.07, 0.07, 0.8, mat(0x0a0a0c), 8); j.position.set(x, 0.4, i === 2 ? 1.5 : 0); flyygeli.add(j); });
    flyygeli.position.set(-11, L0, -12); flyygeli.rotation.y = 0.5; scene.add(flyygeli);
    const virittaja = new THREE.Group(); const vk = sylinteri(0.24, 0.28, 0.9, mat(0x3a5a7a), 8); vk.position.y = 0.75; virittaja.add(vk); const vp = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat(0xe0b896)); vp.position.y = 1.4; virittaja.add(vp);
    virittaja.position.set(-11.6, L0, -13.4); scene.add(virittaja);
    /* Bändi: rummut, basso ja vahvistin */
    const rummut = new THREE.Group(); const rumM = mat(0xb02a3a, { metalness: 0.4, roughness: 0.3 }), peltiM = mat(0xd9b84a, { metalness: 0.9, roughness: 0.2 });
    const bd = sylinteri(0.6, 0.6, 0.5, rumM, 18); bd.rotation.x = Math.PI / 2; bd.position.y = 0.6; rummut.add(bd);
    [[-0.6, 1.1, 0.3, 0.3], [0.6, 1.1, 0.3, 0.3], [0.9, 0.8, 0.4, 0.45]].forEach(([x, y, r, h]) => { const t = sylinteri(r, r, h, rumM, 14); t.position.set(x, y, 0.3); rummut.add(t); });
    [[-1.1, 1.6], [1.2, 1.7]].forEach(([x, y]) => { const p = sylinteri(0.45, 0.45, 0.02, peltiM, 18); p.position.set(x, y, 0); rummut.add(p); const j = sylinteri(0.02, 0.02, y, teline, 5); j.position.set(x, y / 2, 0); rummut.add(j); });
    rummut.position.set(10, L0, -18); rummut.rotation.y = -0.4; scene.add(rummut);
    const vahvistin = laatikko(1, 1.2, 0.6, mat(0x1a1a1a, { metalness: 0.2 })); vahvistin.position.set(13, L0 + 0.6, -14.5); scene.add(vahvistin);
    const kangas = laatikko(0.8, 0.8, 0.02, mat(0x3a3a3a, { roughness: 1 })); kangas.position.set(13, L0 + 0.6, -14.19); scene.add(kangas);
    const basisti = new THREE.Group(); const bk = sylinteri(0.24, 0.28, 0.9, mat(0x2a2a2a), 8); bk.position.y = 1.05; basisti.add(bk); const bp = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat(0xe0b896)); bp.position.y = 1.7; basisti.add(bp);
    const bj = sylinteri(0.18, 0.16, 0.6, mat(0x1d2230), 8); bj.position.y = 0.3; basisti.add(bj);
    const bassoRunko = laatikko(0.5, 0.7, 0.08, mat(0xd9a03a, { metalness: 0.3, roughness: 0.3 })); bassoRunko.position.set(0.1, 0.95, 0.3); bassoRunko.rotation.z = 0.5; basisti.add(bassoRunko);
    const kaula = laatikko(1.2, 0.08, 0.05, mat(0x6a4428)); kaula.position.set(-0.55, 1.35, 0.3); kaula.rotation.z = 0.5; basisti.add(kaula);
    const tulpat = [-0.19, 0.19].map((x) => { const t = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), hehku(0xffd43b, 1.5)); t.position.set(x, 1.7, 0); basisti.add(t); return t; });
    basisti.position.set(12, L0, -13); basisti.rotation.y = -0.6; scene.add(basisti);
    /* Laulaja ja mikrofoni lavan edessä */
    const mikki = sylinteri(0.02, 0.02, 1.6, teline, 6); mikki.position.set(3, L0 + 0.8, -7.4); scene.add(mikki);
    const laulaja = new THREE.Group(); const lk = sylinteri(0.24, 0.3, 0.95, mat(0xd94a8a, { metalness: 0.2 }), 10); lk.position.y = 1.05; laulaja.add(lk); const lp = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat(0xe0b896)); lp.position.y = 1.72; laulaja.add(lp);
    laulaja.position.set(3, L0, -7.9); laulaja.visible = false; scene.add(laulaja);
    /* Valoriggi ja liikkuvat valot (keilat) */
    const riggi = laatikko(30, 0.4, 0.4, mat(0x2a2a2e, { metalness: 0.8 })); riggi.position.set(0, 14, -10); scene.add(riggi);
    const riggi2 = laatikko(30, 0.4, 0.4, mat(0x2a2a2e, { metalness: 0.8 })); riggi2.position.set(0, 14, -18); scene.add(riggi2);
    const keilat = [], valoVarit = [0xff4ad8, 0x4a9bff, 0xffd34a, 0x8a4aff, 0x4affc8, 0xff8a4a];
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group(); const lampp = sylinteri(0.25, 0.3, 0.5, mat(0x111111, { metalness: 0.6 }), 10); g.add(lampp);
      const keila = new THREE.Mesh(new THREE.ConeGeometry(1.6, 14, 18, 1, true), new THREE.MeshBasicMaterial({ color: valoVarit[i % 6], transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      keila.geometry.translate(0, -7, 0); g.add(keila);
      g.position.set(-13.5 + (i % 6) * 5.4, 13.6, i < 6 ? -10 : -18); g.userData = { v: i * 0.7, keila }; scene.add(g); keilat.push(g);
    }
    const valoPoyta = laatikko(3, 1, 1.5, mat(0x1a1a1e, { metalness: 0.4 })); valoPoyta.position.set(-4, 4.9, 26); scene.add(valoPoyta);
    const miksauspoyta = laatikko(3, 1, 1.5, mat(0x1a1a1e, { metalness: 0.4 })); miksauspoyta.position.set(4, 4.9, 26); scene.add(miksauspoyta);
    [[-4, 0xff4ad8], [4, 0x4affc8]].forEach(([x, v]) => { const n = laatikko(2.6, 0.05, 1.2, hehku(v, 0.6)); n.position.set(x, 5.43, 26); scene.add(n); });
    const savu = hiukkaset(150, 0xc8b8ff, 0.7); savu.points.material.blending = THREE.NormalBlending; savu.points.material.opacity = 0.14;
    for (let i = 0; i < 150; i++) { savu.pos.set([-16 + Math.random() * 32, 2 + Math.random() * 10, -24 + Math.random() * 16], i * 3); savu.nopeus[i] = Math.random() * 6; } scene.add(savu.points);
    /* Äänitysstudio (kaukana muusta maailmasta) */
    const st = new THREE.Group();
    const stL = laatikko(12, 0.1, 10, mat(0x2a2a2e, { roughness: 1 })); st.add(stL);
    const stS = mat(0x8a3a22, { roughness: 1, metalness: 0 });
    [[0, 3, -5, 12, 0], [0, 3, 5, 12, 0], [-6, 3, 0, 10, Math.PI / 2], [6, 3, 0, 10, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, stS); s.position.set(x, y, z); s.rotation.y = r; st.add(s); });
    const ikkuna = laatikko(4, 2, 0.05, mat(0x88aacc, { transparent: true, opacity: 0.35, metalness: 0.3 })); ikkuna.position.set(0, 2.8, -4.85); st.add(ikkuna);
    const poyta = laatikko(5, 0.9, 1.6, mat(0x2a2a2e, { metalness: 0.3 })); poyta.position.set(0, 0.45, -2.5); st.add(poyta);
    const konsoli = laatikko(4.6, 0.1, 1.3, mat(0xd8d2c4, { metalness: 0.2 })); konsoli.position.set(0, 0.96, -2.5); konsoli.rotation.x = 0.15; st.add(konsoli);
    for (let i = 0; i < 24; i++) { const f = laatikko(0.06, 0.08, 0.3, mat([0xff4a4a, 0x4aff8a, 0xffd34a][i % 3])); f.position.set(-2.2 + i * 0.19, 1.05, -2.4); st.add(f); }
    [-1.2, 1.2].forEach((x, i) => { const n = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1), new THREE.MeshBasicMaterial({ map: kayraTekstuuri(["#6fffe9", "#ffb02a"][i], i + 4) })); n.position.set(x, 1.7, -3.2); st.add(n); });
    [-2.8, 2.8].forEach((x) => { const k = laatikko(0.6, 0.9, 0.6, mat(0x111111)); k.position.set(x, 1.4, -3.1); st.add(k); });
    const stValo = new THREE.PointLight(0xffd8b0, 14, 16, 1.4); stValo.position.set(0, 5, 0); st.add(stValo);
    st.position.set(0, 0, 130); scene.add(st);

    const tila = { tila: "harjoitus" };
    function asetaTila(t) {
      tila.tila = t.tila || "harjoitus";
      const konsertti = tila.tila === "konsertti", valot = tila.tila === "valot" || konsertti;
      yleiso.forEach((y) => { y.visible = konsertti; });
      laulaja.visible = konsertti || tila.tila === "kapu";
      keilat.forEach((k) => { k.userData.keila.visible = valot; });
      saliValo.intensity = konsertti ? 0 : 18; lavaValo.intensity = konsertti ? 45 : 30;
      savu.points.visible = valot;
    }
    function paivita(dt, t) {
      keilat.forEach((k) => { const u = k.userData; k.rotation.z = Math.sin(t * 0.7 + u.v) * 0.45; k.rotation.x = Math.cos(t * 0.5 + u.v) * 0.3; });
      kapu.rotation.z = tila.tila === "konsertti" || tila.tila === "kapu" ? Math.sin(t * 4) * 0.05 : 0;
      tahtipuikko.rotation.x = Math.sin(t * 4) * 0.6;
      muusikot.forEach((m, i) => { m.children[1].position.y = 1.45 + (tila.tila === "konsertti" ? Math.sin(t * 3 + i) * 0.02 : 0); });
      basisti.rotation.y = -0.6 + Math.sin(t * 2) * 0.08;
      virittaja.rotation.y = 0.5 + Math.sin(t * 0.6) * 0.3;
      tulpat.forEach((x) => { x.visible = tila.tila === "basso"; });
      if (savu.points.visible) { for (let i = 0; i < 150; i++) { savu.pos[i * 3] += Math.sin(t * 0.3 + savu.nopeus[i]) * dt * 0.3; } savu.points.geometry.attributes.position.needsUpdate = true; }
    }
    const kohtaukset = {
      kansi:     { kamera: [0, 9, 32],      kohde: [0, 3, -12],     tila: { tila: "konsertti" } },
      sali:      { kamera: [-14, 9, 28],    kohde: [0, 2, -12],     tila: {} },
      studio:    { kamera: [0, 2.4, 134],   kohde: [0, 1.4, 126],   tila: {} },
      flyygeli:  { kamera: [-5, 4, -4],     kohde: [-11, 1.8, -12], tila: {} },
      kapu:      { kamera: [4, 3.4, -2],    kohde: [0, 2.6, -9],    tila: { tila: "kapu" } },
      orkesteri: { kamera: [-6, 3.4, -4],   kohde: [-3, 2, -14],    tila: {} },
      basso:     { kamera: [7, 3, -6],      kohde: [12, 2.4, -14],  tila: { tila: "basso" } },
      valot:     { kamera: [0, 6, 18],      kohde: [0, 8, -12],     tila: { tila: "valot" } },
      loppu:     { kamera: [10, 10, 34],    kohde: [0, 3, -12],     tila: { tila: "konsertti" } }
    };
    return { kohtaukset, oletus: "sali", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     KÄSITYÖ – "Käsityömessut": pajayhteisön työtila, valokuvastudio ja messuhalli
     Pisteet: keinutuoli (vasen takana), muotoilu (keskellä takana), kangaspuut (oikea takana),
     verhoilu (oikea edessä), ompelu ja vaaterekki (vasen edessä).
     Studio on kaukana (z=130) ja messuhalli toisella puolella (z=-130).
     ------------------------------------------------------------------------ */
  paja(scene) {
    const V = { tausta: 0xefe6da, lattia: 0xc49a6c, seina: 0xf4efe8, tiili: 0xd9cfc2, puu: 0xd8b98a, tumma: 0x7a5232, iho: 0xe0b896 };
    scene.background = new THREE.Color(V.tausta);
    scene.fog = new THREE.Fog(V.tausta, 40, 95);
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb89a7a, 1.15));
    const aur = new THREE.DirectionalLight(0xfff0d8, 0.9); aur.position.set(-10, 18, 12); scene.add(aur);
    const puuM = mat(V.puu, { roughness: 0.8, metalness: 0 }), tummaM = mat(V.tumma, { roughness: 0.8, metalness: 0 });
    const hahmot = [];
    function hahmo(vari, x, z, ry, ryhma) {
      const g = new THREE.Group(); const k = sylinteri(0.26, 0.32, 1.0, mat(vari, { metalness: 0 }), 10); k.position.y = 1.05; g.add(k);
      const j = sylinteri(0.2, 0.18, 0.6, mat(0x2f3440, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(V.iho, { metalness: 0 })); p.position.y = 1.75; g.add(p);
      g.position.set(x, 0, z); g.rotation.y = ry || 0; (ryhma || scene).add(g); hahmot.push(g); return g;
    }
    function poyta(x, z, w, d, ryhma) { const g = new THREE.Group(); const t = laatikko(w, 0.12, d, puuM); t.position.y = 0.95; g.add(t);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const j = laatikko(0.12, 0.9, 0.12, tummaM); j.position.set(a * (w / 2 - 0.15), 0.45, b * (d / 2 - 0.15)); g.add(j); });
      g.position.set(x, 0, z); (ryhma || scene).add(g); return g; }
    function keinutuoli(vari) {
      const g = new THREE.Group(), m = mat(vari, { roughness: 0.6, metalness: 0.05 });
      const ist = laatikko(1, 0.1, 0.9, m); ist.position.y = 0.75; g.add(ist);
      [[-0.42, -0.38], [0.42, -0.38], [-0.42, 0.38], [0.42, 0.38]].forEach(([x, z]) => { const j = sylinteri(0.05, 0.05, 0.62, m, 8); j.position.set(x, 0.42, z); g.add(j); });
      [-0.42, 0.42].forEach((x) => { const t = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 6, 24, 0.75), m); t.rotation.set(0, Math.PI / 2, -Math.PI / 2 - 0.375); t.position.set(x, 1.5, 0); g.add(t); });
      for (let i = 0; i < 6; i++) { const s = sylinteri(0.025, 0.025, 1.1, m, 6); s.position.set(-0.35 + i * 0.14, 1.35, -0.42); s.rotation.x = -0.12; g.add(s); }
      const yla = laatikko(1, 0.14, 0.08, m); yla.position.set(0, 1.92, -0.5); g.add(yla);
      [-0.5, 0.5].forEach((x) => { const k = laatikko(0.08, 0.06, 0.8, m); k.position.set(x, 1.1, 0); g.add(k); });
      return g;
    }
    function aaltotuoli(vari) {
      const g = new THREE.Group(), m = mat(vari, { roughness: 0.5, metalness: 0 });
      for (let i = 0; i < 5; i++) { const x = -0.4 + i * 0.2;
        const kayra = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0, 0.5), new THREE.Vector3(x, 0.5, 0.1), new THREE.Vector3(x, 0.8, -0.3), new THREE.Vector3(x, 1.3, -0.1), new THREE.Vector3(x, 1.8, -0.45)]);
        const s = new THREE.Mesh(new THREE.TubeGeometry(kayra, 24, 0.05, 6), m); g.add(s); }
      const ist = laatikko(1, 0.06, 0.6, m); ist.position.set(0, 0.62, 0.05); ist.rotation.x = 0.1; g.add(ist);
      return g;
    }
    function tyyny(vari, koko) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), mat(vari, { roughness: 1, metalness: 0 })); t.scale.set(koko || 1, 0.32, koko || 1); return t; }

    /* Paja: lattia, seinät, ikkunat ja lamput */
    const lattia = laatikko(46, 0.2, 40, mat(V.lattia, { roughness: 0.9, metalness: 0 })); lattia.position.set(0, -0.1, 0); scene.add(lattia);
    for (let x = -22; x <= 22; x += 1.2) { const r = laatikko(0.03, 0.01, 40, mat(0xa88058, { metalness: 0 })); r.position.set(x, 0.005, 0); scene.add(r); }
    const seinaM = mat(V.seina, { roughness: 0.95, metalness: 0 });
    const taka = laatikko(46, 10, 0.4, mat(V.tiili, { roughness: 1, metalness: 0 })); taka.position.set(0, 5, -14); scene.add(taka);
    [-23, 23].forEach((x) => { const s = laatikko(0.4, 10, 40, seinaM); s.position.set(x, 5, 0); scene.add(s); });
    for (let i = 0; i < 5; i++) { const ik = laatikko(5, 4, 0.1, hehku(0xdcefff, 0.9)); ik.position.set(-16 + i * 8, 6, -13.75); scene.add(ik);
      const pk = laatikko(0.12, 4, 0.12, tummaM); pk.position.set(-16 + i * 8, 6, -13.65); scene.add(pk); const vk = laatikko(5, 0.12, 0.12, tummaM); vk.position.set(-16 + i * 8, 6, -13.65); scene.add(vk); }
    for (let i = 0; i < 4; i++) { const p = laatikko(46, 0.4, 0.4, tummaM); p.position.set(0, 9.6, -10 + i * 7); scene.add(p); }
    const lamput = [];
    [[-10, -6], [0, -7], [9, -6], [11, 3], [-11, 3]].forEach(([x, z]) => {
      const j = sylinteri(0.01, 0.01, 4, mat(0x222222), 4); j.position.set(x, 7.6, z); scene.add(j);
      const v = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.5, 16, 1, true), mat(0x2f4f4a, { side: THREE.DoubleSide })); v.position.set(x, 5.6, z); scene.add(v);
      const pol = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), hehku(0xffe2a8, 2)); pol.position.set(x, 5.45, z); scene.add(pol);
      const l = new THREE.PointLight(0xffd9a0, 10, 12, 1.5); l.position.set(x, 5.2, z); scene.add(l); lamput.push(l); });
    const nimi = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["PAJA KÄSI & KUVA"], "#f4efe8", "#2f4f4a", 1024, 160) }));
    nimi.position.set(0, 8.8, -13.75); scene.add(nimi);

    /* 1. Entisöijän työpiste: keinutuoli pukilla, puristimet, puutavara */
    poyta(-10, -8, 5, 2.2);
    const kt = keinutuoli(0x7a3e22); kt.position.set(-10, 1.0, -8); kt.rotation.y = 0.5; scene.add(kt);
    for (let i = 0; i < 3; i++) { const p = laatikko(0.12, 0.35, 0.5, mat(0xd9480f, { metalness: 0.3 })); p.position.set(-11.8 + i * 0.4, 1.2, -7.2); scene.add(p); }
    for (let i = 0; i < 9; i++) { const l = laatikko(3.2, 0.25, 0.3, mat([0xe8cfa6, 0xdcbf92, 0xf0dcb8][i % 3], { roughness: 0.8, metalness: 0 })); l.position.set(-16.5, 0.15 + Math.floor(i / 3) * 0.26, -11 + (i % 3) * 0.34); scene.add(l); }
    const entisoija = hahmo(0x5c7a4a, -12.8, -6.6, 2.4);
    /* 2. Muotoilija: piirustuspöytä ja aaltotuolin prototyypit */
    poyta(0, -9, 4, 2);
    const paperi = laatikko(1.6, 0.01, 1.1, mat(0xffffff, { metalness: 0 })); paperi.position.set(-0.8, 1.02, -9); scene.add(paperi);
    for (let i = 0; i < 4; i++) { const v = laatikko(1.2, 0.012, 0.02, mat(0x3a5a8a, { metalness: 0 })); v.position.set(-0.8, 1.03, -9.3 + i * 0.2); v.rotation.y = Math.sin(i) * 0.4; scene.add(v); }
    const at1 = aaltotuoli(0xf1e6cc); at1.position.set(2.6, 0, -7); at1.rotation.y = -0.6; scene.add(at1);
    const at2 = aaltotuoli(0xc9a97a); at2.position.set(-3.2, 0, -7.4); at2.rotation.y = 0.5; at2.scale.setScalar(0.85); scene.add(at2);
    const muotoilija = hahmo(0x2a2a30, 1.4, -10.4, -0.3);
    /* 3. Tekstiiliartesaani: kangaspuut ja tyynypino */
    const kp = new THREE.Group();
    [[-1.3, 0], [1.3, 0]].forEach(([x]) => { [-0.9, 0.9].forEach((z) => { const j = laatikko(0.14, 1.8, 0.14, tummaM); j.position.set(x, 0.9, z); kp.add(j); }); });
    [[0, 1.6, -0.9], [0, 1.6, 0.9], [0, 0.9, 0.9]].forEach(([x, y, z]) => { const p = sylinteri(0.08, 0.08, 2.8, puuM, 8); p.rotation.z = Math.PI / 2; p.position.set(x, y, z); kp.add(p); });
    for (let i = 0; i < 26; i++) { const l = laatikko(0.012, 0.012, 1.8, mat([0xe9c46a, 0x6d597a, 0xe76f51][i % 3], { metalness: 0 })); l.position.set(-1.2 + i * 0.096, 1.25, 0); l.rotation.x = 0.39; kp.add(l); }
    const kudos = laatikko(2.5, 0.02, 0.7, mat(0x6d597a, { roughness: 1, metalness: 0 })); kudos.position.set(0, 1.05, 0.55); kudos.rotation.x = 0.39; kp.add(kudos);
    const sukkula = laatikko(0.5, 0.06, 0.1, mat(0x9c6644)); sukkula.position.set(0, 1.15, 0.2); kp.add(sukkula);
    kp.position.set(9, 0, -8); kp.rotation.y = -0.3; scene.add(kp);
    poyta(13, -9.5, 2.6, 1.6);
    [0x3a3a44, 0xc96a7a, 0xe9dcc8, 0xd9a441].forEach((v, i) => { const t = tyyny(v, 1); t.position.set(13, 1.12 + i * 0.3, -9.5); t.rotation.y = i * 0.4; scene.add(t);
      const tu = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), mat([0xd9a441, 0x6c757d, 0xd9a441, 0xe76f51][i])); tu.position.set(13.48, 1.0 + i * 0.3, -9.2); scene.add(tu); });
    const tekstiili = hahmo(0xc96a7a, 9.4, -6.6, 2.8);
    /* 4. Verhoilija: nojatuoli ja kangasrullat */
    const nt = new THREE.Group(), ntM = mat(0x4a7d8c, { roughness: 1, metalness: 0 });
    const ntI = laatikko(1.4, 0.45, 1.2, ntM); ntI.position.y = 0.6; nt.add(ntI);
    const ntS = laatikko(1.4, 1.1, 0.3, mat(0xb08a5c, { roughness: 0.9, metalness: 0 })); ntS.position.set(0, 1.3, -0.5); nt.add(ntS);
    [-0.75, 0.75].forEach((x) => { const k = laatikko(0.2, 0.7, 1.2, ntM); k.position.set(x, 0.85, 0); nt.add(k); });
    [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]].forEach(([x, z]) => { const j = sylinteri(0.05, 0.04, 0.4, tummaM, 6); j.position.set(x, 0.2, z); nt.add(j); });
    nt.position.set(12, 0, 3); nt.rotation.y = -0.7; scene.add(nt);
    const rullaTeline = laatikko(0.2, 3.4, 4.6, tummaM); rullaTeline.position.set(22.5, 1.7, 3); scene.add(rullaTeline);
    [0x4a7d8c, 0x7aa6b4, 0x9aa5ad, 0xd8d0c4, 0x3f6f6a, 0xb5654f].forEach((v, i) => { const r = sylinteri(0.25, 0.25, 2.6, mat(v, { roughness: 1, metalness: 0 }), 14); r.position.set(22, 0.6 + Math.floor(i / 2) * 1.0, 1.9 + (i % 2) * 2.2); r.rotation.x = Math.PI / 2; r.rotation.z = 0.0; scene.add(r); });
    const naytteet = []; for (let i = 0; i < 5; i++) { const n = laatikko(0.5, 0.02, 0.5, mat([0x4a7d8c, 0x7aa6b4, 0xb7c1c8, 0xe3ddd2, 0x2f5a66][i], { roughness: 1, metalness: 0 })); naytteet.push(n); }
    poyta(15, 6.5, 2.4, 1.4); naytteet.forEach((n, i) => { n.position.set(14.1 + i * 0.45, 1.03 + i * 0.005, 6.5); n.rotation.y = i * 0.2; scene.add(n); });
    const verhoilija = hahmo(0x3f6f6a, 13.4, 4.6, -2.3);
    /* 5. Ompelija: ompelukone, mallinukke ja vaaterekki */
    poyta(-12, 4, 3, 1.6);
    const kone = new THREE.Group(); const ka = laatikko(1.1, 0.2, 0.45, mat(0xf2f2ee)); ka.position.y = 0.1; kone.add(ka);
    const kv = laatikko(0.2, 0.6, 0.4, mat(0xf2f2ee)); kv.position.set(0.45, 0.4, 0); kone.add(kv); const kyl = laatikko(1.0, 0.22, 0.38, mat(0xf2f2ee)); kyl.position.set(0, 0.68, 0); kone.add(kyl);
    const neula = sylinteri(0.01, 0.01, 0.3, mat(0xcccccc, { metalness: 0.9 }), 4); neula.position.set(-0.42, 0.42, 0); kone.add(neula);
    kone.position.set(-12.5, 1.01, 4); scene.add(kone);
    for (let i = 0; i < 6; i++) { const r = sylinteri(0.07, 0.07, 0.16, mat([0xe63946, 0x457b9d, 0xf1c453, 0x2a9d8f, 0x9aa5ad, 0x6d597a][i], { metalness: 0 }), 10); r.position.set(-11 + (i % 3) * 0.2, 1.09, 3.6 + Math.floor(i / 3) * 0.25); scene.add(r); }
    const nukke = new THREE.Group(); const nv = sylinteri(0.3, 0.22, 0.9, mat(0x8a5a3a, { roughness: 0.9, metalness: 0 }), 12); nv.position.y = 1.55; nukke.add(nv);
    const nj = sylinteri(0.03, 0.03, 1.1, tummaM, 6); nj.position.y = 0.55; nukke.add(nj); nukke.position.set(-15, 0, 6); scene.add(nukke);
    const rekki = new THREE.Group(), rM = mat(0x9aa0a6, { metalness: 0.8, roughness: 0.3 });
    const rt = sylinteri(0.04, 0.04, 4, rM, 8); rt.rotation.z = Math.PI / 2; rt.position.y = 2.1; rekki.add(rt);
    [-2, 2].forEach((x) => { const j = sylinteri(0.04, 0.04, 2.1, rM, 8); j.position.set(x, 1.05, 0); rekki.add(j); });
    [0x2b2d42, 0x6b4f3a, 0x8d99ae, 0x3a5a40, 0xbc6c25, 0x1b1b1e, 0xa3a380, 0x5e503f, 0xd4a373, 0x343a40].forEach((v, i) => {
      const t = laatikko(0.18, 1.3, 0.7, mat(v, { roughness: 1, metalness: 0 })); t.position.set(-1.7 + i * 0.37, 1.35, 0); rekki.add(t); });
    rekki.position.set(-18, 0, 1); rekki.rotation.y = 0.9; scene.add(rekki);
    const ompelija = hahmo(0x9c6644, -12.5, 5.3, Math.PI);
    /* Pölyä valossa */
    const poly = hiukkaset(120, 0xfff2d0, 0.06); poly.points.material.opacity = 0.5;
    for (let i = 0; i < 120; i++) { poly.pos.set([-20 + Math.random() * 40, 1 + Math.random() * 7, -12 + Math.random() * 20], i * 3); poly.nopeus[i] = Math.random() * 6; } scene.add(poly.points);

    /* Valokuvastudio (kaukana) */
    const st = new THREE.Group();
    const stL = laatikko(16, 0.1, 14, mat(0x2a2a2e, { roughness: 1, metalness: 0 })); st.add(stL);
    const stS = laatikko(16, 8, 0.2, mat(0x1c1c22, { roughness: 1, metalness: 0 })); stS.position.set(0, 4, -7); st.add(stS);
    const kaari = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 24, 1, true, Math.PI, Math.PI / 2), mat(0xf4f1ea, { roughness: 1, metalness: 0, side: THREE.DoubleSide }));
    kaari.rotation.z = Math.PI / 2; kaari.position.set(0, 2.05, -4.5); st.add(kaari);
    const sv = laatikko(6, 4, 0.05, mat(0xf4f1ea, { roughness: 1, metalness: 0 })); sv.position.set(0, 4.05, -6.5); st.add(sv);
    const sl = laatikko(6, 0.05, 3, mat(0xf4f1ea, { roughness: 1, metalness: 0 })); sl.position.set(0, 0.06, -1.5); st.add(sl);
    const tuote = aaltotuoli(0xf1e6cc); tuote.position.set(0, 0.08, -2.6); tuote.rotation.y = 0.5; st.add(tuote);
    const softboksit = [];
    [[-3.6, 0.6], [3.6, -0.6]].forEach(([x, r]) => { const g = new THREE.Group(); const j = sylinteri(0.04, 0.04, 2.6, mat(0x222222), 6); j.position.y = 1.3; g.add(j);
      const b = laatikko(1.4, 1.4, 0.5, mat(0x111111)); b.position.y = 2.9; g.add(b); const e = laatikko(1.3, 1.3, 0.02, hehku(0xffffff, 1.2)); e.position.set(0, 2.9, 0.26); g.add(e);
      g.position.set(x, 0, -0.4); g.rotation.y = r; st.add(g); softboksit.push(e); });
    const kamera = new THREE.Group(); [0, 2.1, 4.2].forEach((a) => { const j = sylinteri(0.02, 0.02, 1.5, mat(0x222222), 4); j.position.set(Math.sin(a) * 0.3, 0.7, Math.cos(a) * 0.3); j.rotation.set(Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2); kamera.add(j); });
    const kr = laatikko(0.4, 0.3, 0.25, mat(0x111111)); kr.position.y = 1.5; kamera.add(kr); const ob = sylinteri(0.1, 0.1, 0.25, mat(0x222222), 12); ob.rotation.x = Math.PI / 2; ob.position.set(0, 1.5, -0.24); kamera.add(ob);
    kamera.position.set(0.8, 0, 3); kamera.rotation.y = 0.15; st.add(kamera);
    const kuvaaja = hahmo(0x343a40, 2.6, 2.4, 0.9, st);
    const salama = new THREE.PointLight(0xffffff, 0, 14, 1.2); salama.position.set(0, 3, 0); st.add(salama);
    st.add(new THREE.PointLight(0xfff2e0, 10, 18, 1.4)); st.children[st.children.length - 1].position.set(0, 6, 2);
    const stM = mat(0x1c1c22, { roughness: 1, metalness: 0 });
    [-8, 8].forEach((x) => { const w = laatikko(0.2, 8, 14, stM); w.position.set(x, 4, 0); st.add(w); });
    const stK = laatikko(16, 0.2, 14, stM); stK.position.set(0, 8, 0); st.add(stK);
    const stE = laatikko(16, 8, 0.2, stM); stE.position.set(0, 4, 7); st.add(stE);
    st.position.set(0, 0, 130); scene.add(st);

    /* Messuhalli (kaukana toisella puolella) */
    const mh = new THREE.Group();
    const mhL = laatikko(50, 0.1, 34, mat(0x8a8f98, { roughness: 0.9, metalness: 0 })); mh.add(mhL);
    const mhT = laatikko(50, 12, 0.3, mat(0x2b3a55, { metalness: 0 })); mhT.position.set(0, 6, -17); mh.add(mhT);
    const banneri = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["KÄSITYÖMESSUT"], "#ffffff", "#c96a7a", 1024, 160) }));
    banneri.position.set(0, 9, -16.8); mh.add(banneri);
    const osastoVarit = [0xc96a7a, 0x4a7d8c, 0xd9a441, 0x5c7a4a];
    for (let i = 0; i < 4; i++) { const x = -15 + i * 10, o = new THREE.Group();
      const taus = laatikko(8, 3.2, 0.15, mat(0xf4efe8, { metalness: 0 })); taus.position.set(0, 1.6, -2); o.add(taus);
      const yla = laatikko(8, 0.6, 0.2, mat(osastoVarit[i], { metalness: 0 })); yla.position.set(0, 3.4, -1.9); o.add(yla);
      const tis = laatikko(4, 1, 1, puuM); tis.position.set(0, 0.5, 0.6); o.add(tis);
      if (i === 0) { const k = keinutuoli(0x8a4a2a); k.position.set(-2.5, 0, -0.6); k.rotation.y = 0.5; o.add(k); }
      if (i === 1) { const n = nt.clone(); n.position.set(-2.4, 0, -0.6); n.rotation.y = 0.5; o.add(n); }
      if (i === 2) [0x3a3a44, 0xc96a7a, 0xe9dcc8].forEach((v, j) => { const t = tyyny(v, 0.8); t.position.set(-0.8 + j * 0.8, 1.15, 0.6); o.add(t); });
      if (i === 3) { const r = rekki.clone(); r.scale.setScalar(0.7); r.position.set(2, 0, -1.2); r.rotation.y = 0; o.add(r); }
      const a = aaltotuoli(0xf1e6cc); a.position.set(2.6, 0, -0.6); a.visible = i === 0; o.add(a);
      o.position.set(x, 0, -10); mh.add(o); }
    const vieraat = [];
    for (let i = 0; i < 26; i++) { const v = hahmo([0x3a5a8a, 0xb5654f, 0x5c7a4a, 0x6d597a, 0x343a40, 0xd9a441][i % 6], -20 + Math.random() * 40, -6 + Math.random() * 14, Math.random() * 6, mh); vieraat.push(v); v.userData.v = Math.random() * 6; }
    [-25, 25].forEach((x) => { const w = laatikko(0.3, 12, 34, mat(0x2b3a55, { metalness: 0 })); w.position.set(x, 6, 0); mh.add(w); });
    const mhK = laatikko(50, 0.3, 34, mat(0x3a4660, { metalness: 0 })); mhK.position.set(0, 12, 0); mh.add(mhK);
    const mhE = laatikko(50, 12, 0.3, mat(0x2b3a55, { metalness: 0 })); mhE.position.set(0, 6, 17); mh.add(mhE);
    for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xfff2dc, 14, 22, 1.3); l.position.set(-18 + i * 7.2, 10, -6); mh.add(l); }
    mh.position.set(0, 0, -130); scene.add(mh);

    const tila = { tila: "paja" };
    function asetaTila(t) { tila.tila = t.tila || "paja"; vieraat.forEach((v) => { v.visible = tila.tila === "messut"; }); }
    let salamaAika = 0;
    function paivita(dt, t) {
      sukkula.position.x = Math.sin(t * 1.2) * 1.1;
      neula.position.y = 0.42 + Math.abs(Math.sin(t * 14)) * 0.06;
      kt.rotation.x = Math.sin(t * 1.1) * 0.06;
      hahmot.forEach((h, i) => { h.children[2].position.y = 1.75 + Math.sin(t * 1.5 + i) * 0.015; });
      vieraat.forEach((v) => { v.rotation.y += Math.sin(t * 0.4 + v.userData.v) * dt * 0.4; });
      salamaAika += dt; if (salamaAika > 3.2) salamaAika = 0;
      const sal = salamaAika < 0.12 ? 1 : 0; salama.intensity = sal * 60; softboksit.forEach((e) => { e.material.emissiveIntensity = 1.2 + sal * 3; });
      for (let i = 0; i < 120; i++) { poly.pos[i * 3 + 1] += Math.sin(t * 0.4 + poly.nopeus[i]) * dt * 0.08; } poly.points.geometry.attributes.position.needsUpdate = true;
    }
    const kohtaukset = {
      kansi:      { kamera: [3, 4.2, 6],     kohde: [-1, 1.5, -8],   tila: {} },
      paja:       { kamera: [-5, 4.5, 7],    kohde: [1, 1.4, -7],    tila: {} },
      keinutuoli: { kamera: [-7.5, 3, -3],   kohde: [-10.5, 1.6, -8], tila: {} },
      muotoilu:   { kamera: [0.5, 3.2, -2],  kohde: [0, 1.2, -8],    tila: {} },
      tyynyt:     { kamera: [10, 3.2, -2.5], kohde: [11, 1.3, -8.5], tila: {} },
      verhoilu:   { kamera: [9, 3, 9],       kohde: [13, 1.2, 3.5],  tila: {} },
      ompelu:     { kamera: [-10, 3.2, 10],  kohde: [-14, 1.4, 3],   tila: {} },
      studio:     { kamera: [-1.2, 2.3, 136], kohde: [0, 1.1, 127.5], tila: {} },
      messut:     { kamera: [6, 5, -116],    kohde: [0, 1.5, -140],  tila: { tila: "messut" } },
      loppu:      { kamera: [-8, 6, -116],   kohde: [0, 1.5, -140],  tila: { tila: "messut" } }
    };
    return { kohtaukset, oletus: "paja", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     KASVATUS JA OHJAUS – "Retkipäivä": koulu, päiväkoti, metsäpolku, laavu ja järvi.
     Luokkahuone on kaukana (z=130) ja nuorisotalo toisella puolella (z=-130).
     ------------------------------------------------------------------------ */
  retki(scene) {
    const V = { taivas: 0xd8ecf2, nurmi: 0x7fae5a, kuusi: 0x2f5d3a, kuusiT: 0x264d31, koivu: 0x8cbf5a, iho: 0xe0b896, liivi: 0x2456c8 };
    scene.background = new THREE.Color(V.taivas);
    scene.fog = new THREE.Fog(V.taivas, 45, 140);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7a4a, 1.3));
    const aur = new THREE.DirectionalLight(0xfff2d8, 1.3); aur.position.set(-20, 30, 15); scene.add(aur);
    const hahmot = [];
    function hahmo(vari, x, z, ry, k, ryhma, liivi) {
      k = k || 1; const g = new THREE.Group();
      const kr = sylinteri(0.26, 0.32, 1.0, mat(vari, { metalness: 0 }), 10); kr.position.y = 1.05; g.add(kr);
      if (liivi) { const l = sylinteri(0.29, 0.34, 0.6, mat(V.liivi, { metalness: 0 }), 10); l.position.y = 1.15; g.add(l);
        const r = sylinteri(0.295, 0.33, 0.07, hehku(0xe8f0ff, 0.9), 10); r.position.y = 1.05; g.add(r); }
      const j = sylinteri(0.2, 0.18, 0.6, mat(0x2f3440, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(V.iho, { metalness: 0 })); p.position.y = 1.75; g.add(p);
      g.userData.paa = p; g.userData.v = Math.random() * 6;
      g.scale.setScalar(k); g.position.set(x, 0, z); g.rotation.y = ry || 0; (ryhma || scene).add(g); hahmot.push(g); return g;
    }
    const lapsiVarit = [0xe76f51, 0xf4a261, 0x2a9d8f, 0xe9c46a, 0x8ab17d, 0xb56576, 0x6d597a, 0x48cae4];

    /* Maa, polut ja järvi */
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(V.nurmi, { metalness: 0, roughness: 1 })); maa.rotation.x = -Math.PI / 2; maa.position.z = -20; scene.add(maa);
    const jarvi = new THREE.Mesh(new THREE.CircleGeometry(30, 40), mat(0x4f8fb8, { metalness: 0.1, roughness: 0.25 })); jarvi.rotation.x = -Math.PI / 2; jarvi.position.set(42, 0.03, -2); jarvi.scale.y = 0.7; scene.add(jarvi);
    const laituri = laatikko(1.6, 0.15, 7, mat(0x9a7a56, { metalness: 0 })); laituri.position.set(16, 0.3, 2); laituri.rotation.y = -1.2; scene.add(laituri);
    function polku(pisteet, lev, vari, y) {
      const k = new THREE.CatmullRomCurve3(pisteet.map(([x, z]) => new THREE.Vector3(x, 0, z))), N = 60, pos = [], idx = [];
      for (let i = 0; i <= N; i++) { const t = i / N, p = k.getPoint(t), tan = k.getTangent(t), nx = -tan.z * lev, nz = tan.x * lev;
        pos.push(p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      scene.add(new THREE.Mesh(g, mat(vari, { metalness: 0, roughness: 1, side: THREE.DoubleSide }))); return k;
    }
    polku([[0, -32], [4, -20], [2, -8], [-4, 0], [-10, 4]], 1.4, 0xb9b0a0, 0.04);              // esteetön sorapolku
    polku([[-6, -30], [-12, -20], [-8, -10], [-14, -2], [-10, 4]], 0.6, 0x7a5a3a, 0.05);        // kapea juurakkopolku
    const juuret = []; for (let i = 0; i < 14; i++) { const j = sylinteri(0.08, 0.08, 1.4, mat(0x5a4030, { metalness: 0 }), 5); j.rotation.z = Math.PI / 2; j.rotation.y = i; j.position.set(-11 + Math.sin(i) * 2, 0.08, -24 + i * 1.6); scene.add(j); juuret.push(j); }

    /* Puut */
    const kuusiM = mat(V.kuusi, { roughness: 0.9, flatShading: true }), kuusiM2 = mat(V.kuusiT, { roughness: 0.9, flatShading: true }), runkoM = mat(0x5a4030, { roughness: 1, metalness: 0 }), koivuR = mat(0xeeeae0, { roughness: 0.9, metalness: 0 });
    function kuusi(x, z, k) { const g = new THREE.Group(); const r = sylinteri(0.12 * k, 0.16 * k, 0.8 * k, runkoM, 6); r.position.y = 0.4 * k; g.add(r);
      [0, 1, 2].forEach((j) => { const c = new THREE.Mesh(new THREE.ConeGeometry((1.2 - j * 0.3) * k, (1.8 - j * 0.3) * k, 7), j % 2 ? kuusiM2 : kuusiM); c.position.y = (1.1 + j * 0.9) * k; g.add(c); });
      g.position.set(x, 0, z); scene.add(g); }
    function koivu(x, z, k) { const r = sylinteri(0.08 * k, 0.1 * k, 2 * k, koivuR, 6); r.position.set(x, k, z); scene.add(r);
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 * k, 0), mat(V.koivu, { roughness: 0.9, flatShading: true, metalness: 0 })); l.position.set(x, 2.3 * k, z); scene.add(l); }
    let s0 = 11; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
    for (let i = 0; i < 230; i++) { const x = -60 + rnd() * 120, z = 30 - rnd() * 110;
      if (x > 12 && Math.hypot(x - 42, (z + 2) / 0.7) < 33) continue;           // järvi
      if (x > -22 && x < 30 && z < -22 && z > -60) continue;                       // koulun ja päiväkodin piha
      if (Math.hypot(x + 10, z - 4) < 7) continue;                                 // laavu
      if (Math.abs(x - 1) < 3.5 && z > -24 && z < 2) continue;                     // sorapolku
      if (Math.abs(x + 10) < 2.5 && z > -30 && z < 4) continue;                    // juurakkopolku
      if (x > -6 && x < 8 && z > -16 && z < -6) continue;                          // ryhmän aukio
      const k = 1 + rnd() * 1.3; if (rnd() < 0.65) kuusi(x, z, k); else koivu(x, z, k); }

    /* Koulu, päiväkoti ja bussi */
    const koulu = laatikko(26, 7, 10, mat(0xd9c3a5, { metalness: 0, roughness: 0.9 })); koulu.position.set(-4, 3.5, -50); scene.add(koulu);
    const katto = laatikko(27, 0.5, 11, mat(0x5a5e66, { metalness: 0.2 })); katto.position.set(-4, 7.2, -50); scene.add(katto);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const ik = laatikko(2, 1.4, 0.1, mat(0xbfe0f0, { metalness: 0.3, roughness: 0.2 })); ik.position.set(-15 + i * 3.1, 2 + r * 3, -44.95); scene.add(ik); }
    const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["KOIVUMÄEN KOULU"], "#ffffff", "#2a6f97", 1024, 170) })); kyltti.position.set(-4, 6.2, -44.9); scene.add(kyltti);
    const pk = new THREE.Group(); const pkR = laatikko(9, 3.5, 7, mat(0xf2d16b, { metalness: 0, roughness: 0.9 })); pkR.position.y = 1.75; pk.add(pkR);
    const pkK = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.4, 4), mat(0xc0443a, { metalness: 0 })); pkK.rotation.y = Math.PI / 4; pkK.scale.z = 0.8; pkK.position.y = 4.7; pk.add(pkK);
    [0xe76f51, 0x2a9d8f, 0x48cae4].forEach((v, i) => { const ik = laatikko(1.5, 1.3, 0.1, mat(v, { metalness: 0 })); ik.position.set(-2.8 + i * 2.8, 2, 3.52); pk.add(ik); });
    const ovi = laatikko(1.2, 2.2, 0.1, mat(0x7a5232, { metalness: 0 })); ovi.position.set(1.4, 1.1, 3.53); pk.add(ovi);
    pk.position.set(18, 0, -42); pk.rotation.y = -0.4; scene.add(pk);
    const keinu = new THREE.Group(); [-1.2, 1.2].forEach((x) => { const j = sylinteri(0.06, 0.06, 2.6, mat(0xe63946, { metalness: 0.5 }), 6); j.position.set(x, 1.3, 0); j.rotation.z = x > 0 ? 0.2 : -0.2; keinu.add(j); });
    const kp = sylinteri(0.06, 0.06, 2.8, mat(0xe63946, { metalness: 0.5 }), 6); kp.rotation.z = Math.PI / 2; kp.position.y = 2.55; keinu.add(kp); keinu.position.set(14, 0, -34); scene.add(keinu);
    const bussi = new THREE.Group();
    const bk = laatikko(2.5, 2.8, 10, mat(0xf4f1e8, { metalness: 0.3, roughness: 0.4 })); bk.position.y = 1.8; bussi.add(bk);
    const bv = laatikko(2.52, 0.8, 10.02, mat(0xf2a541, { metalness: 0.3 })); bv.position.y = 0.95; bussi.add(bv);
    for (let i = 0; i < 6; i++) [-1.27, 1.27].forEach((x) => { const ik = laatikko(0.02, 0.9, 1.3, mat(0x22303c, { metalness: 0.5, roughness: 0.2 })); ik.position.set(x, 2.4, -3.8 + i * 1.5); bussi.add(ik); });
    [[-1.1, -3.4], [1.1, -3.4], [-1.1, 3.4], [1.1, 3.4]].forEach(([x, z]) => { const r = sylinteri(0.5, 0.5, 0.35, mat(0x1a1a1a), 14); r.rotation.z = Math.PI / 2; r.position.set(x, 0.5, z); bussi.add(r); });
    bussi.position.set(8, 0, -30); bussi.rotation.y = Math.PI / 2 + 0.1; scene.add(bussi);
    const pkAikuinen = hahmo(0xe05a6a, 15.5, -35.5, 2.6);
    const pkLapsi = hahmo(0xf4a261, 16.2, -35.2, -2.2, 0.55);

    /* Esteetön polku: avustaja ja pyörätuoli */
    const pt = new THREE.Group(); const ist = laatikko(0.7, 0.1, 0.7, mat(0x333a44)); ist.position.y = 0.65; pt.add(ist);
    const sel = laatikko(0.7, 0.7, 0.08, mat(0x333a44)); sel.position.set(0, 1.0, -0.35); pt.add(sel);
    [-0.42, 0.42].forEach((x) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 20), mat(0xb0b6bc, { metalness: 0.8, roughness: 0.3 })); r.rotation.y = Math.PI / 2; r.position.set(x, 0.45, -0.05); pt.add(r); });
    const amir = hahmo(0x2a9d8f, 0, 0, 0, 0.6, pt, true); amir.position.set(0, 0.2, 0); amir.children[amir.children.length - 2].visible = false;
    pt.position.set(3.4, 0, -19); pt.rotation.y = Math.PI - 0.2; scene.add(pt);
    const avustaja = hahmo(0x6d597a, 3.6, -17.8, Math.PI - 0.2);

    /* Retkiryhmä aukiolla: lapset jonossa heijastinliiveissä, ohjaaja viittoo */
    const ryhma = [];
    for (let i = 0; i < 7; i++) ryhma.push(hahmo(lapsiVarit[i], -2.5 + i * 0.9, -11 + Math.sin(i) * 0.6, Math.PI, 0.62, null, true));
    const viittoja = hahmo(0xc0443a, 1, -13.4, 0);
    const kadet = [-0.35, 0.35].map((x) => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(V.iho)); k.position.set(x, 1.45, 0.3); viittoja.add(k); return k; });

    /* Laavu, nuotio ja leikkipiiri */
    const lv = new THREE.Group(), lvM = mat(0x8a6440, { metalness: 0, roughness: 1 });
    const lvK = laatikko(6, 0.15, 4.2, lvM); lvK.rotation.x = -0.7; lvK.position.set(0, 2, -1.3); lv.add(lvK);
    [-3, 3].forEach((x) => { const s = laatikko(0.15, 3, 3, lvM); s.position.set(x, 1.4, -1.6); s.rotation.x = -0.35; lv.add(s); });
    const lvL = laatikko(6, 0.3, 2.4, lvM); lvL.position.set(0, 0.3, -2); lv.add(lvL);
    lv.position.set(-10, 0, 0); scene.add(lv);
    const kivet = new THREE.Group(); for (let i = 0; i < 10; i++) { const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), mat(0x8a8a84, { flatShading: true, metalness: 0 })); k.position.set(Math.cos(i / 10 * 6.283) * 0.8, 0.15, Math.sin(i / 10 * 6.283) * 0.8); kivet.add(k); }
    kivet.position.set(-10, 0, 4.4); scene.add(kivet);
    const liekit = []; [0xffb703, 0xfb8500, 0xffd166].forEach((v, i) => { const l = new THREE.Mesh(new THREE.ConeGeometry(0.3 - i * 0.06, 0.9 + i * 0.2, 6), hehku(v, 2)); l.position.set(-10 + (i - 1) * 0.15, 0.5, 4.4); scene.add(l); liekit.push(l); });
    const tuli = new THREE.PointLight(0xffa040, 6, 9, 1.5); tuli.position.set(-10, 1.2, 4.4); scene.add(tuli);
    const piiri = [];
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; piiri.push(hahmo(lapsiVarit[(i + 3) % 8], -10 + Math.cos(a) * 3.2, 4.4 + Math.sin(a) * 3.2, -a - Math.PI / 2, 0.62, null, i % 2 === 0)); }
    const sofia = hahmo(0xb56576, -10 + 5.2, 4.4 + 2.6, -2.3, 0.62);
    const opettaja = hahmo(0x2a6f97, -10 + Math.cos(5.6) * 3.4, 4.4 + Math.sin(5.6) * 3.4, -5.6 - Math.PI / 2);

    /* Luokkahuone (kaukana) */
    const lk = new THREE.Group(), lkS = mat(0xf1ece2, { metalness: 0, roughness: 1 });
    const lkL = laatikko(16, 0.1, 14, mat(0xcfc0a0, { metalness: 0 })); lk.add(lkL);
    [[0, 3, -7, 16, 0], [0, 3, 7, 16, 0], [-8, 3, 0, 14, Math.PI / 2], [8, 3, 0, 14, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, lkS); s.position.set(x, y, z); s.rotation.y = r; lk.add(s); });
    const taulu = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.1), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["RETKIPÄIVÄ", "1. Pysy ryhmässä", "2. Kuuntele ohjaajaa"], "#1d3557", "#f1faee", 2000, 700) }));
    taulu.position.set(0, 2.8, -6.85); lk.add(taulu);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = -4.5 + c * 3, z = -2 + r * 2.4;
      const p = laatikko(1.4, 0.08, 0.8, mat(0xd8b98a, { metalness: 0 })); p.position.set(x, 0.75, z); lk.add(p);
      const j = laatikko(1.3, 0.7, 0.06, mat(0x9aa0a6, { metalness: 0.6 })); j.position.set(x, 0.36, z - 0.3); lk.add(j);
      const o = hahmo(lapsiVarit[(r * 4 + c) % 8], x, z + 0.6, Math.PI, 0.6, lk); o.position.y = -0.1;
      if ((r + c) % 3 === 0) { const kasi = sylinteri(0.06, 0.06, 0.6, mat(lapsiVarit[(r * 4 + c) % 8]), 6); kasi.position.set(0.22, 2.2, 0); o.add(kasi); } }
    const petri = hahmo(0x8ab17d, 2.6, -5.4, 0.3, 1, lk);
    lk.add(new THREE.PointLight(0xfff6e8, 16, 20, 1.3)); lk.children[lk.children.length - 1].position.set(0, 5.5, 0);
    const lkK = laatikko(16, 0.2, 14, lkS); lkK.position.y = 6; lk.add(lkK);
    lk.position.set(0, 0, 130); scene.add(lk);

    /* Nuorisotalo (kaukana toisella puolella) */
    const nt = new THREE.Group(), ntS = mat(0xe8eef2, { metalness: 0, roughness: 1 });
    const ntL = laatikko(18, 0.1, 14, mat(0xb8bec4, { metalness: 0 })); nt.add(ntL);
    [[0, 3, -7, 18, 0], [0, 3, 7, 18, 0], [-9, 3, 0, 14, Math.PI / 2], [9, 3, 0, 14, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, ntS); s.position.set(x, y, z); s.rotation.y = r; nt.add(s); });
    const ntO = laatikko(3, 4.5, 0.25, mat(0x1d3fa0, { metalness: 0 })); ntO.position.set(5, 2.25, -6.85); nt.add(ntO);
    const bil = new THREE.Group(); const bp = laatikko(2.4, 0.2, 4.2, mat(0x2fa59a, { roughness: 0.9, metalness: 0 })); bp.position.y = 0.95; bil.add(bp);
    const br = laatikko(2.7, 0.35, 4.5, mat(0x1d2b44, { metalness: 0.2 })); br.position.y = 0.78; bil.add(br);
    [[-1, -1.8], [1, -1.8], [-1, 1.8], [1, 1.8]].forEach(([x, z]) => { const j = laatikko(0.3, 0.7, 0.3, mat(0x1d2b44)); j.position.set(x, 0.35, z); bil.add(j); });
    [0xffd166, 0xe63946, 0x1d3fa0, 0xf4a261, 0x2a9d8f, 0xffffff, 0x111111].forEach((v, i) => { const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(v, { metalness: 0.2, roughness: 0.3 })); p.position.set(-0.6 + (i % 4) * 0.35, 1.12, -0.5 + Math.floor(i / 4) * 0.8); bil.add(p); });
    bil.position.set(0, 0, 0); nt.add(bil);
    const sohva = laatikko(3.4, 0.8, 1.2, mat(0xe76f51, { metalness: 0 })); sohva.position.set(-6, 0.4, -5.5); nt.add(sohva);
    const sohvaS = laatikko(3.4, 0.9, 0.3, mat(0xe76f51, { metalness: 0 })); sohvaS.position.set(-6, 1.1, -6.1); nt.add(sohvaS);
    const viiri = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.1), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["NUORISOTALO"], "#ffffff", "#e76f51", 1024, 140) })); viiri.position.set(-3, 4.6, -6.85); nt.add(viiri);
    hahmo(0x1d2b44, -1.8, 0.8, 1.4, 0.92, nt); hahmo(0xc0443a, 1.8, -1.2, -1.6, 0.92, nt); hahmo(0x2a9d8f, -6.5, -4.6, 0.2, 0.92, nt);
    const ohjaajaN = hahmo(0xe9c46a, 3.4, 2.6, -2.4, 1, nt);
    const puhelin = laatikko(0.12, 0.2, 0.02, hehku(0x9fd8ff, 1.4)); puhelin.position.set(0.25, 1.3, 0.3); ohjaajaN.add(puhelin);
    nt.add(new THREE.PointLight(0xfff6e8, 16, 22, 1.3)); nt.children[nt.children.length - 1].position.set(0, 5.5, 0);
    const ntK = laatikko(18, 0.2, 14, ntS); ntK.position.y = 6; nt.add(ntK);
    nt.position.set(0, 0, -130); scene.add(nt);

    const tila = { tila: "retki" };
    function asetaTila(t) { tila.tila = t.tila || "retki"; const ilta = tila.tila === "ilta"; tuli.intensity = ilta ? 14 : 6; aur.intensity = ilta ? 0.7 : 1.3; aur.color.set(ilta ? 0xffb37a : 0xfff2d8); }
    function paivita(dt, t) {
      liekit.forEach((l, i) => { l.scale.y = 1 + Math.sin(t * 9 + i * 2) * 0.18; l.scale.x = 1 + Math.cos(t * 7 + i) * 0.1; });
      tuli.intensity = (tila.tila === "ilta" ? 14 : 6) + Math.sin(t * 13) * 1.2;
      kadet.forEach((k, i) => { k.position.y = 1.45 + Math.sin(t * 4 + i * 1.7) * 0.15; k.position.x = (i ? 0.35 : -0.35) + Math.cos(t * 3 + i) * 0.06; });
      piiri.forEach((h, i) => { h.position.y = Math.max(0, Math.sin(t * 3 + i * 0.7)) * 0.12; });
      hahmot.forEach((h) => { h.userData.paa.position.y = 1.75 + Math.sin(t * 1.5 + h.userData.v) * 0.015; });
      pt.position.z = -19 + Math.sin(t * 0.3) * 0.4; avustaja.position.z = pt.position.z + 1.2;
    }
    const kohtaukset = {
      kansi:       { kamera: [-2, 6, 18],       kohde: [-6, 1, 2],       tila: {} },
      retki:       { kamera: [10, 12, 22],      kohde: [-2, 0, -14],     tila: {} },
      nuorisotalo: { kamera: [6, 3.2, -124.5],  kohde: [-1, 1, -132],    tila: {} },
      paivakoti:   { kamera: [21, 2.8, -28],    kohde: [16, 1.3, -37],   tila: {} },
      luokka:      { kamera: [0, 3.6, 135.5],   kohde: [0, 1.4, 126],    tila: {} },
      polku:       { kamera: [8, 3, -11],       kohde: [3, 0.9, -19],    tila: {} },
      ryhma:       { kamera: [1, 2.6, -4.5],    kohde: [0, 0.9, -12],    tila: {} },
      laavu:       { kamera: [-3, 3.6, 12],     kohde: [-10, 0.8, 3.5],  tila: {} },
      loppu:       { kamera: [-17, 4.5, 13],    kohde: [-9, 1, 2],      tila: { tila: "ilta" } }
    };
    return { kohtaukset, oletus: "retki", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     MERENKULKU – "Ensimmäinen merivuoro": ro-ro-rahtilaiva satamassa.
     Laiva on laiturissa perä edellä (perä z=0, keula z=-60). Luotsivene laivan kyljessä.
     Konehuone on kaukana (z=140), keittiö (z=-150) ja komentosilta (x=140).
     ------------------------------------------------------------------------ */
  laiva(scene) {
    const V = { taivas: 0xcfe3ee, meri: 0x2f6f8f, runko: 0x1f3d63, punainen: 0xb23a2a, valk: 0xf2f4f6, iho: 0xe0b896 };
    scene.background = new THREE.Color(V.taivas);
    scene.fog = new THREE.Fog(V.taivas, 70, 220);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a5a6a, 1.2));
    const aur = new THREE.DirectionalLight(0xfff0dc, 1.3); aur.position.set(-30, 40, 20); scene.add(aur);
    const hahmot = [];
    function hahmo(vari, x, z, ry, ryhma, kypara, y) {
      const g = new THREE.Group(); const kr = sylinteri(0.26, 0.32, 1.0, mat(vari, { metalness: 0 }), 10); kr.position.y = 1.05; g.add(kr);
      const j = sylinteri(0.2, 0.18, 0.6, mat(0x2f3440, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(V.iho, { metalness: 0 })); p.position.y = 1.75; g.add(p);
      if (kypara) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(kypara, { metalness: 0 })); k.position.y = 1.8; g.add(k); }
      g.userData.paa = p; g.userData.v = Math.random() * 6;
      g.position.set(x, y || 0, z); g.rotation.y = ry || 0; (ryhma || scene).add(g); hahmot.push(g); return g;
    }
    /* Meri ja laituri */
    const meri = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 40, 40), mat(V.meri, { metalness: 0.1, roughness: 0.35 })); meri.rotation.x = -Math.PI / 2; meri.position.y = -0.05; scene.add(meri);
    const mPos = meri.geometry.attributes.position, mAlku = Float32Array.from(mPos.array);
    const laituri = laatikko(120, 2, 40, mat(0x9aa0a6, { metalness: 0, roughness: 1 })); laituri.position.set(0, 0, 22); scene.add(laituri);
    for (let i = 0; i < 12; i++) { const v = laatikko(4, 0.02, 0.2, mat(0xffd43b, { metalness: 0 })); v.position.set(-20 + (i % 4) * 5, 1.02, 10 + Math.floor(i / 4) * 8); scene.add(v); }
    [-14, 14].forEach((x) => { const p = sylinteri(0.3, 0.4, 0.8, mat(0x222222), 10); p.position.set(x, 1.4, 2.5); scene.add(p); });
    /* Nosturit ja kontit laiturilla */
    [[-40, 18], [40, 18]].forEach(([x, z]) => { const n = new THREE.Group(), nm = mat(0xe8590c, { metalness: 0.4 });
      [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([a, b]) => { const j = laatikko(0.6, 18, 0.6, nm); j.position.set(a, 9, b); n.add(j); });
      const p = laatikko(1, 1.2, 30, nm); p.position.set(0, 18, -8); n.add(p); n.position.set(x, 1, z); scene.add(n); });
    const konttiVarit = [0xc92a2a, 0x1971c2, 0x2b8a3e, 0xf08c00, 0x5f3dc4, 0x868e96];
    for (let i = 0; i < 24; i++) { const k = laatikko(6, 2.6, 2.4, mat(konttiVarit[i % 6], { metalness: 0.3, roughness: 0.6 })); k.position.set(30 + (i % 3) * 6.4, 2.3 + Math.floor(i / 12) * 2.6, 26 + (Math.floor(i / 3) % 4) * 2.6); scene.add(k); }

    /* Laiva */
    const L = new THREE.Group();
    const runko = laatikko(14, 7, 60, mat(V.runko, { metalness: 0.3, roughness: 0.5 })); runko.position.set(0, 2.5, -30); L.add(runko);
    const vesiraja = laatikko(14.05, 1.6, 60.05, mat(V.punainen, { metalness: 0.2 })); vesiraja.position.set(0, -0.2, -30); L.add(vesiraja);
    const keula = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 7, 24, 1, false, Math.PI / 2, Math.PI), mat(V.runko, { metalness: 0.3, roughness: 0.5 })); keula.scale.z = 1.6; keula.position.set(0, 2.5, -60); L.add(keula);
    const kansi = laatikko(13.8, 0.2, 60, mat(0x6b7480, { metalness: 0.2 })); kansi.position.set(0, 6.05, -30); L.add(kansi);
    const kyl = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.2), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["M/S AALLOTAR"], "#ffffff", "#1f3d63", 1024, 120) })); kyl.position.set(7.03, 4.6, -16); kyl.rotation.y = Math.PI / 2; L.add(kyl);
    const ylarak = laatikko(14, 6, 18, mat(V.valk, { metalness: 0.1 })); ylarak.position.set(0, 9.1, -48); L.add(ylarak);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) [-7.02, 7.02].forEach((x) => { const ik = laatikko(0.05, 0.8, 1.6, mat(0x22303c, { metalness: 0.5, roughness: 0.2 })); ik.position.set(x, 8 + r * 2.4, -55 + i * 2.8); L.add(ik); });
    const silta = laatikko(16, 2.6, 6, mat(V.valk, { metalness: 0.1 })); silta.position.set(0, 13.4, -53); L.add(silta);
    const sIk = laatikko(15, 1.1, 0.1, mat(0x1a2a3a, { metalness: 0.6, roughness: 0.15 })); sIk.position.set(0, 13.7, -56.05); L.add(sIk);
    const savupiippu = laatikko(3, 5, 4, mat(V.punainen, { metalness: 0.2 })); savupiippu.position.set(0, 14.6, -42); L.add(savupiippu);
    const piippuMusta = laatikko(3.02, 1, 4.02, mat(0x111111)); piippuMusta.position.set(0, 16.6, -42); L.add(piippuMusta);
    const masto = sylinteri(0.12, 0.12, 6, mat(0xdddddd, { metalness: 0.6 }), 6); masto.position.set(0, 17.5, -53); L.add(masto);
    const tutka = laatikko(2.4, 0.15, 0.3, mat(0x222222)); tutka.position.set(0, 19.2, -53); L.add(tutka);
    /* Pelastusveneet */
    const pelVeneet = [];
    [-7.8, 7.8].forEach((x) => { const v = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 5, 6, 12), mat(0xff7a1a, { metalness: 0, roughness: 0.6 })); v.rotation.x = Math.PI / 2; v.scale.set(1, 1, 0.8); v.position.set(x, 9.6, -40); L.add(v); pelVeneet.push(v);
      [-2, 2].forEach((z) => { const d = laatikko(0.2, 2.2, 0.2, mat(0xdddddd, { metalness: 0.6 })); d.position.set(x * 0.94, 10.2, -40 + z); L.add(d); }); });
    /* Peräportti ja autokansi */
    const aukko = laatikko(10, 5, 0.2, mat(0x0d1218)); aukko.position.set(0, 3.5, 0.02); L.add(aukko);
    const ramppi = laatikko(10, 0.3, 9, mat(0x4a5058, { metalness: 0.5 })); ramppi.position.set(0, 1.6, 4.3); ramppi.rotation.x = -0.12; L.add(ramppi);
    for (let i = 0; i < 6; i++) { const v = laatikko(0.6, 0.6, 0.6, hehku(0xffe2a8, 1)); v.position.set(-4 + i * 1.6, 5.7, 0.05); L.add(v); }
    scene.add(L);
    /* Rekat jonossa laiturilla */
    const rekat = [];
    function rekka(x, z, v) { const g = new THREE.Group(); const ohj = laatikko(2.4, 2.6, 2.4, mat(v, { metalness: 0.4 })); ohj.position.set(0, 2.6, -1.2); g.add(ohj);
      const per = laatikko(2.5, 3, 9, mat(0xe9ecef, { metalness: 0.2 })); per.position.set(0, 3, 4.8); g.add(per);
      [[-1.1, -1], [1.1, -1], [-1.1, 6], [1.1, 6], [-1.1, 8], [1.1, 8]].forEach(([a, b]) => { const r = sylinteri(0.5, 0.5, 0.4, mat(0x1a1a1a), 12); r.rotation.z = Math.PI / 2; r.position.set(a, 1.5, b); g.add(r); });
      g.position.set(x, 0, z); scene.add(g); rekat.push(g); return g; }
    rekka(-3, 12, 0x1971c2); rekka(3, 16, 0xc92a2a); rekka(-3, 26, 0x2b8a3e); rekka(3, 30, 0xf08c00);
    const ahtaaja = hahmo(0xffd43b, 6, 9, -2.4, null, 0xff8c1a, 1);
    const ohjaus = [-0.4, 0.4].map((x) => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), hehku(0xff6b00, 1.5)); k.position.set(x, 1.5, 0.3); ahtaaja.add(k); return k; });
    const merimies = hahmo(0xff7a1a, -5.6, -38, Math.PI / 2, L, 0xffffff, 6.15);
    const kadetti = hahmo(0x1f3d63, -4.4, -39.2, -Math.PI / 2, L, 0xffffff, 6.15);

    /* Luotsivene ja luotsitikkaat laivan kyljessä */
    const lv = new THREE.Group();
    const lvR = laatikko(3.2, 1.4, 11, mat(0xe8590c, { metalness: 0.3, roughness: 0.5 })); lvR.position.y = 0.6; lv.add(lvR);
    const lvK = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 4), mat(0xe8590c, { metalness: 0.3 })); lvK.rotation.x = -Math.PI / 2; lvK.rotation.y = Math.PI / 4; lvK.scale.set(1, 1, 0.6); lvK.position.set(0, 0.6, -6.9); lv.add(lvK);
    const lvH = laatikko(2.6, 1.8, 3.6, mat(0xe8590c, { metalness: 0.2 })); lvH.position.set(0, 2.2, -0.5); lv.add(lvH);
    const lvI = laatikko(2.7, 0.6, 3.7, mat(0x22303c, { metalness: 0.6, roughness: 0.2 })); lvI.position.set(0, 2.6, -0.5); lv.add(lvI);
    const lvT = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["LUOTSI"], "#ffffff", "#e8590c", 512, 110) })); lvT.position.set(1.61, 1, 0); lvT.rotation.y = Math.PI / 2; lv.add(lvT);
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.1, 6, 10), mat(0x1a1a1a)); r.rotation.y = Math.PI / 2; r.position.set(1.65, 0.6, -4 + i * 1.6); lv.add(r); }
    lv.position.set(9.4, 0, -22); scene.add(lv);
    const tikkaat = new THREE.Group();
    [-0.35, 0.35].forEach((z) => { const k = laatikko(0.04, 6.8, 0.04, mat(0xd9c38a, { metalness: 0 })); k.position.set(0, 3.2, z); tikkaat.add(k); });
    for (let i = 0; i < 16; i++) { const a = laatikko(0.08, 0.06, 0.8, mat(0x8a5a2a, { metalness: 0 })); a.position.set(0, 0.2 + i * 0.42, 0); tikkaat.add(a); }
    tikkaat.position.set(7.08, 0, -22); scene.add(tikkaat);
    const luotsi = hahmo(0x2f3440, 7.5, -22, -Math.PI / 2, null, 0xffffff, 2.4);
    const lLiivi = sylinteri(0.29, 0.33, 0.55, mat(0xffd43b, { metalness: 0 }), 10); lLiivi.position.y = 1.15; luotsi.add(lLiivi);

    /* Konehuone (kaukana) */
    const kh = new THREE.Group(), khS = mat(0xd9dde2, { metalness: 0.2, roughness: 0.8 });
    const khL = laatikko(20, 0.2, 16, mat(0x5a6470, { metalness: 0.4 })); kh.add(khL);
    [[0, 4, -8, 20, 0], [0, 4, 8, 20, 0], [-10, 4, 0, 16, Math.PI / 2], [10, 4, 0, 16, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 8, 0.2, khS); s.position.set(x, y, z); s.rotation.y = r; kh.add(s); });
    [-3.5, 3.5].forEach((x) => { const m = new THREE.Group(); const b = laatikko(4, 3.2, 9, mat(0x6b8f3a, { metalness: 0.5, roughness: 0.4 })); b.position.y = 1.7; m.add(b);
      for (let i = 0; i < 6; i++) { const s = sylinteri(0.4, 0.4, 1, mat(0x8a9aa6, { metalness: 0.8, roughness: 0.3 }), 10); s.position.set(0, 3.8, -3.5 + i * 1.4); m.add(s); }
      m.position.set(x, 0, -1); kh.add(m); });
    for (let i = 0; i < 6; i++) { const p = sylinteri(0.18, 0.18, 20, mat([0xc92a2a, 0x1971c2, 0xf08c00][i % 3], { metalness: 0.5 }), 8); p.rotation.z = Math.PI / 2; p.position.set(0, 6.4 + (i % 3) * 0.5, -7 + i * 0.4); kh.add(p); }
    const mittari = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20), mat(0xffffff, { metalness: 0 })); m.position.set(-6 + i * 1.2, 2.5, -7.85); kh.add(m);
      const n = laatikko(0.04, 0.3, 0.02, mat(0xc92a2a)); n.position.set(-6 + i * 1.2, 2.5, -7.82); kh.add(n); mittari.push(n); }
    const pumppu = sylinteri(0.6, 0.6, 1.4, mat(0x1971c2, { metalness: 0.6 }), 12); pumppu.position.set(6.5, 0.8, 4); kh.add(pumppu);
    const lammikko = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), mat(0x111111, { metalness: 0.6, roughness: 0.1 })); lammikko.rotation.x = -Math.PI / 2; lammikko.position.set(6.5, 0.11, 5.2); kh.add(lammikko);
    const konemestari = hahmo(0x1f3d63, 4.6, 5, 1.6, kh, 0xffffff);
    kh.add(new THREE.PointLight(0xfff2dc, 18, 24, 1.3)); kh.children[kh.children.length - 1].position.set(0, 7, 2);
    const khK = laatikko(20, 0.2, 16, khS); khK.position.y = 8; kh.add(khK);
    kh.position.set(0, 0, 140); scene.add(kh);

    /* Keittiö (kaukana) */
    const ke = new THREE.Group(), keS = mat(0xeef2f5, { metalness: 0.1, roughness: 0.9 });
    const keL = laatikko(14, 0.2, 10, mat(0xb8c0c8, { metalness: 0.2 })); ke.add(keL);
    [[0, 3, -5, 14, 0], [0, 3, 5, 14, 0], [-7, 3, 0, 10, Math.PI / 2], [7, 3, 0, 10, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, keS); s.position.set(x, y, z); s.rotation.y = r; ke.add(s); });
    const rst = mat(0xc8ced4, { metalness: 0.8, roughness: 0.3 });
    const liesi = laatikko(5, 1, 1.4, rst); liesi.position.set(-2, 0.5, -4); ke.add(liesi);
    const kattilat = []; for (let i = 0; i < 3; i++) { const k = sylinteri(0.45, 0.4, 0.6, rst, 14); k.position.set(-3.6 + i * 1.6, 1.3, -4); ke.add(k); kattilat.push(k); }
    const poyta = laatikko(4, 1, 1.6, rst); poyta.position.set(1, 0.5, 0.5); ke.add(poyta);
    const kaide = laatikko(4, 0.06, 0.06, rst); kaide.position.set(1, 1.15, 1.35); ke.add(kaide);
    const kokki = hahmo(0xffffff, -1, -2.6, Math.PI, ke); const myssy = sylinteri(0.22, 0.2, 0.35, mat(0xffffff), 10); myssy.position.y = 2.05; kokki.add(myssy);
    const hoyry = hiukkaset(40, 0xffffff, 0.15); hoyry.points.material.opacity = 0.35; hoyry.points.material.blending = THREE.NormalBlending;
    for (let i = 0; i < 40; i++) { hoyry.pos.set([-3.6 + (i % 3) * 1.6, 1.7 + Math.random() * 1.5, -4], i * 3); hoyry.nopeus[i] = Math.random(); } ke.add(hoyry.points);
    ke.add(new THREE.PointLight(0xffffff, 12, 18, 1.3)); ke.children[ke.children.length - 1].position.set(0, 5, 0);
    const keK = laatikko(14, 0.2, 10, keS); keK.position.y = 6; ke.add(keK);
    ke.position.set(0, 0, -150); scene.add(ke);

    /* Komentosilta (kaukana) */
    const ks = new THREE.Group(), ksS = mat(0x2a3440, { metalness: 0.2, roughness: 0.8 });
    const ksL = laatikko(16, 0.2, 10, mat(0x3a3f46, { metalness: 0.2 })); ks.add(ksL);
    [[0, 3, 5, 16, 0], [-8, 3, 0, 10, Math.PI / 2], [8, 3, 0, 10, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, ksS); s.position.set(x, y, z); s.rotation.y = r; ks.add(s); });
    const ksAla = laatikko(16, 1.6, 0.2, ksS); ksAla.position.set(0, 0.8, -5); ks.add(ksAla);
    const ksYla = laatikko(16, 1.2, 0.2, ksS); ksYla.position.set(0, 5.4, -5); ks.add(ksYla);
    for (let i = 0; i < 6; i++) { const p = laatikko(0.15, 3.2, 0.25, ksS); p.position.set(-7.5 + i * 3, 3.2, -5); ks.add(p); }
    const nakyma = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ color: 0x9cc7dc })); nakyma.position.set(0, 2, -14); ks.add(nakyma);
    const ulappa = new THREE.Mesh(new THREE.PlaneGeometry(40, 7), new THREE.MeshBasicMaterial({ color: 0x2f6f8f })); ulappa.position.set(0, -1.6, -13.9); ks.add(ulappa);
    const konsoli = laatikko(10, 1.2, 1.6, mat(0x1d232a, { metalness: 0.4 })); konsoli.position.set(0, 0.7, -3.4); konsoli.rotation.x = -0.15; ks.add(konsoli);
    [-3, 0, 3].forEach((x, i) => { const n = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: kayraTekstuuri(["#6fffe9", "#ffd43b", "#8ce99a"][i], i + 2) })); n.position.set(x, 1.75, -3.85); n.rotation.x = -0.3; ks.add(n); });
    const ruori = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 20), mat(0xcccccc, { metalness: 0.8 })); ruori.position.set(0, 1.6, -2.4); ruori.rotation.x = -0.6; ks.add(ruori);
    const peramies = hahmo(0x111827, 1.6, -1.2, Math.PI + 0.3, ks);
    [0, 1, 2, 3].forEach((i) => { const r = laatikko(0.28, 0.05, 0.03, mat(0xd4af37, { metalness: 0.9, roughness: 0.2 })); r.position.set(0.3, 1.35 - i * 0.07, 0.05); r.rotation.y = 1.2; peramies.add(r); });
    ks.add(new THREE.PointLight(0xdfefff, 10, 18, 1.3)); ks.children[ks.children.length - 1].position.set(0, 5, 0);
    const ksK = laatikko(16, 0.2, 10, ksS); ksK.position.y = 6; ks.add(ksK);
    ks.position.set(140, 0, 0); scene.add(ks);

    const savu = hiukkaset(80, 0x777777, 0.7); savu.points.material.blending = THREE.NormalBlending; savu.points.material.opacity = 0.3;
    for (let i = 0; i < 80; i++) { savu.pos.set([Math.random() - 0.5, 17 + Math.random() * 8, -42 + Math.random() * 2], i * 3); savu.nopeus[i] = Math.random(); } scene.add(savu.points);

    const tila = { tila: "satama" };
    function asetaTila(t) { tila.tila = t.tila || "satama"; const lahto = tila.tila === "lahto";
      rekat.forEach((r) => { r.visible = !lahto; }); ramppi.rotation.x = lahto ? -1.45 : -0.12; ramppi.position.set(0, lahto ? 5.6 : 1.6, lahto ? 0.6 : 4.3);
      aur.color.set(lahto ? 0xffb37a : 0xfff0dc); }
    function paivita(dt, t) {
      for (let i = 0; i < mPos.count; i++) { const x = mAlku[i * 3], y = mAlku[i * 3 + 1]; mPos.array[i * 3 + 2] = Math.sin(x * 0.15 + t) * 0.12 + Math.cos(y * 0.12 + t * 0.8) * 0.12; } mPos.needsUpdate = true;
      lv.position.y = Math.sin(t * 1.4) * 0.25; lv.rotation.z = Math.sin(t * 1.1) * 0.04;
      luotsi.position.y = 2.4 + Math.max(0, Math.sin(t * 0.4)) * 2.4;
      ohjaus.forEach((o, i) => { o.position.y = 1.5 + Math.sin(t * 3 + i * Math.PI) * 0.3; });
      mittari.forEach((n, i) => { n.rotation.z = Math.sin(t * 0.8 + i) * 0.6; });
      kattilat.forEach((k, i) => { k.position.y = 1.3 + Math.abs(Math.sin(t * 5 + i)) * 0.02; });
      for (let i = 0; i < 40; i++) { hoyry.pos[i * 3 + 1] += dt * (0.4 + hoyry.nopeus[i] * 0.4); if (hoyry.pos[i * 3 + 1] > 3.5) hoyry.pos[i * 3 + 1] = 1.7; } hoyry.points.geometry.attributes.position.needsUpdate = true;
      for (let i = 0; i < 80; i++) { savu.pos[i * 3 + 1] += dt * (0.8 + savu.nopeus[i]); savu.pos[i * 3 + 2] += dt * 1.2; if (savu.pos[i * 3 + 1] > 27) { savu.pos[i * 3 + 1] = 17; savu.pos[i * 3 + 2] = -42; } } savu.points.geometry.attributes.position.needsUpdate = true;
      hahmot.forEach((h) => { h.userData.paa.position.y = 1.75 + Math.sin(t * 1.5 + h.userData.v) * 0.015; });
    }
    const kohtaukset = {
      kansi:       { kamera: [34, 14, 22],      kohde: [0, 6, -26],      tila: {} },
      satama:      { kamera: [20, 9, 12],       kohde: [-1, 3, 2],        tila: {} },
      luotsi:      { kamera: [22, 4, -10],      kohde: [8, 3, -22],      tila: {} },
      turva:       { kamera: [-1, 9, -28],      kohde: [-7, 8.6, -40],   tila: {} },
      konehuone:   { kamera: [-6, 4.5, 147],    kohde: [5, 1, 143.5],      tila: {} },
      keittio:     { kamera: [4.5, 3.4, -145],  kohde: [-1.5, 1.4, -153], tila: {} },
      komentosilta:{ kamera: [144, 3.2, 3.5],   kohde: [140, 2, -6],     tila: {} },
      loppu:       { kamera: [26, 12, 14],      kohde: [0, 5, -22],      tila: { tila: "lahto" } }
    };
    return { kohtaukset, oletus: "satama", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     YRITTÄJYYS – "Kesäkahvila": rantakioski järven rannalla, toimisto (z=130) ja tukkumyymälä (z=-130).
     ------------------------------------------------------------------------ */
  rantakahvila(scene) {
    const V = { taivas: 0xbfe3f5, hiekka: 0xe8d6a8, nurmi: 0x86b860, vesi: 0x3f8fc0, iho: 0xe0b896 };
    scene.background = new THREE.Color(V.taivas);
    scene.fog = new THREE.Fog(V.taivas, 50, 150);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a5a, 1.3));
    const aur = new THREE.DirectionalLight(0xfff0d0, 1.4); aur.position.set(15, 30, 20); scene.add(aur);
    const hahmot = [];
    function hahmo(vari, x, z, ry, k, ryhma) {
      k = k || 1; const g = new THREE.Group();
      const kr = sylinteri(0.26, 0.32, 1.0, mat(vari, { metalness: 0 }), 10); kr.position.y = 1.05; g.add(kr);
      const j = sylinteri(0.2, 0.18, 0.6, mat(0x2f3440, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(V.iho, { metalness: 0 })); p.position.y = 1.75; g.add(p);
      g.userData.paa = p; g.userData.v = Math.random() * 6;
      g.scale.setScalar(k); g.position.set(x, 0, z); g.rotation.y = ry || 0; (ryhma || scene).add(g); hahmot.push(g); return g;
    }
    /* Maa, ranta ja järvi */
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), mat(V.nurmi, { metalness: 0, roughness: 1 })); maa.rotation.x = -Math.PI / 2; maa.position.z = -40; scene.add(maa);
    const hiekka = new THREE.Mesh(new THREE.PlaneGeometry(60, 14), mat(V.hiekka, { metalness: 0, roughness: 1 })); hiekka.rotation.x = -Math.PI / 2; hiekka.position.set(0, 0.02, 9); scene.add(hiekka);
    const vesi = new THREE.Mesh(new THREE.PlaneGeometry(240, 100, 40, 16), mat(V.vesi, { metalness: 0.1, roughness: 0.2 })); vesi.rotation.x = -Math.PI / 2; vesi.position.set(0, 0.05, 66); scene.add(vesi);
    const vesiPos = vesi.geometry.attributes.position, vesiY = Float32Array.from(vesiPos.array);
    const laituri = laatikko(2, 0.2, 12, mat(0x9a7a56, { metalness: 0 })); laituri.position.set(14, 0.35, 20); scene.add(laituri);
    for (let i = 0; i < 6; i++) { const t = sylinteri(0.1, 0.1, 1, mat(0x6a5236), 6); t.position.set(14 + (i % 2 ? 0.9 : -0.9), 0, 15 + Math.floor(i / 2) * 5); scene.add(t); }
    /* Puut */
    const kuusiM = mat(0x2f5d3a, { roughness: 0.9, flatShading: true }), runkoM = mat(0x5a4030, { roughness: 1, metalness: 0 }), lehtiM = mat(0x6fa84a, { roughness: 0.9, flatShading: true, metalness: 0 });
    let s0 = 7; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
    for (let i = 0; i < 120; i++) { const x = -70 + rnd() * 140, z = -10 - rnd() * 70; if (Math.abs(x) < 14 && z > -22) continue; const k = 1 + rnd() * 1.4;
      if (rnd() < 0.5) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.2 * k, 3.2 * k, 7), kuusiM); c.position.set(x, 1.6 * k + 0.4, z); scene.add(c); }
      else { const r = sylinteri(0.12 * k, 0.15 * k, 2 * k, runkoM, 6); r.position.set(x, k, z); scene.add(r); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 * k, 0), lehtiM); l.position.set(x, 2.6 * k, z); scene.add(l); } }
    /* Kioski */
    const ki = new THREE.Group(), punainen = mat(0xa23b2c, { roughness: 0.9, metalness: 0 }), valk = mat(0xf2ede4, { roughness: 0.8, metalness: 0 });
    const runko = laatikko(5, 2.8, 3.4, punainen); runko.position.y = 1.4; ki.add(runko);
    const aukko = laatikko(2.6, 1.1, 0.1, mat(0x2a1a14, { metalness: 0 })); aukko.position.set(-0.4, 1.75, 1.71); ki.add(aukko);
    const tiski = laatikko(3, 0.12, 0.6, valk); tiski.position.set(-0.4, 1.18, 2.3); ki.add(tiski);
    const katto = laatikko(5.6, 0.25, 4.2, mat(0x3a3a3a, { metalness: 0.2 })); katto.position.set(0, 2.95, 0.2); katto.rotation.x = -0.08; ki.add(katto);
    for (let i = 0; i < 7; i++) { const m = laatikko(0.8, 0.05, 1.3, mat(i % 2 ? 0xffffff : 0xe0574a, { metalness: 0 })); m.position.set(-2.4 + i * 0.8, 2.5, 2.4); m.rotation.x = 0.45; ki.add(m); }
    const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.6), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["KAHVILA LAITURI"], "#f6efe0", "#7a2a1c", 1024, 170) })); kyltti.position.set(0, 3.45, 2.05); kyltti.rotation.x = -0.15; ki.add(kyltti);
    const keitin = laatikko(0.5, 0.5, 0.4, mat(0x9aa0a6, { metalness: 0.8, roughness: 0.3 })); keitin.position.set(0.8, 1.49, 2.25); ki.add(keitin);
    const leivokset = []; for (let i = 0; i < 6; i++) { const l = sylinteri(0.1, 0.08, 0.1, mat(i % 2 ? 0x6b3e26 : 0xd94f5c), 10); l.position.set(-1.6 + i * 0.22, 1.29, 2.35); ki.add(l); leivokset.push(l); }
    ki.position.set(0, 0, 0); scene.add(ki);
    const myyja = hahmo(0x1d1d22, -1.1, 1.85, 0, 0.9, ki); const myyja2 = hahmo(0x1d1d22, 0.3, 1.85, 0, 0.9, ki);
    /* Pöydät ja aurinkovarjot */
    const varjot = [];
    [[-6, 6, 0xf2c14e], [6, 6, 0x4ea5d9], [-3, 10, 0xe0574a], [4, 11, 0xf2c14e]].forEach(([x, z, v]) => {
      const p = sylinteri(0.6, 0.6, 0.06, valk, 16); p.position.set(x, 0.75, z); scene.add(p); const j = sylinteri(0.05, 0.05, 0.75, mat(0x444444), 6); j.position.set(x, 0.38, z); scene.add(j);
      const t = sylinteri(0.03, 0.03, 2.4, mat(0x888888), 6); t.position.set(x, 1.2, z); scene.add(t);
      const vv = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.6, 8), mat(v, { metalness: 0, side: THREE.DoubleSide })); vv.position.set(x, 2.5, z); scene.add(vv); varjot.push(vv);
      [0, 2.1, 4.2].forEach((a) => { const tu = laatikko(0.4, 0.45, 0.4, mat(0xffffff)); tu.position.set(x + Math.cos(a) * 1, 0.23, z + Math.sin(a) * 1); scene.add(tu); }); });
    const jono = []; [[-0.8, 3.3], [-0.6, 4.4], [-0.2, 5.4], [0.4, 6.3]].forEach(([x, z], i) => jono.push(hahmo([0xe76f51, 0x2a9d8f, 0x6d597a, 0xe9c46a][i], x, z, Math.PI, i === 3 ? 0.7 : 1)));
    const istujat = [hahmo(0x48cae4, -6.9, 6.3, 1.5), hahmo(0xb56576, 5.2, 6.4, -1.4), hahmo(0x8ab17d, 4.6, 11.8, -2.3)];
    const puhelin = laatikko(0.25, 0.4, 0.03, hehku(0x9fd8ff, 1.4)); puhelin.position.set(0.3, 1.5, 0.3); myyja2.add(puhelin); puhelin.visible = false;
    const kuitit = []; for (let i = 0; i < 6; i++) { const k = laatikko(0.18, 0.005, 0.3, mat(0xfafafa)); k.position.set(-0.2 + (i % 3) * 0.25, 1.25, 2.15 + Math.floor(i / 3) * 0.3); k.rotation.y = i; ki.add(k); kuitit.push(k); }
    const valot = []; for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), hehku(0xffd98a, 0)); l.position.set(-2.6 + i * 0.58, 2.9 + Math.sin(i / 9 * Math.PI) * -0.25, 2.45); ki.add(l); valot.push(l); }

    /* Toimisto (yritysneuvoja ja pankki) */
    const to = new THREE.Group(), toS = mat(0xeef0f2, { metalness: 0, roughness: 1 });
    const toL = laatikko(16, 0.1, 12, mat(0x8f9aa6, { metalness: 0 })); to.add(toL);
    [[0, 3, -6, 16, 0], [0, 3, 6, 16, 0], [-8, 3, 0, 12, Math.PI / 2], [8, 3, 0, 12, Math.PI / 2]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 6, 0.2, toS); s.position.set(x, y, z); s.rotation.y = r; to.add(s); });
    const tk = laatikko(16, 0.2, 12, toS); tk.position.y = 6; to.add(tk);
    const ikkuna = laatikko(6, 2.6, 0.1, hehku(0xcfe8ff, 0.9)); ikkuna.position.set(-2, 3, -5.85); to.add(ikkuna);
    [[-3.5, -2.5], [3.5, -2.5]].forEach(([x, z], i) => { const p = laatikko(2.6, 0.08, 1.3, mat(0xd8c3a0, { metalness: 0 })); p.position.set(x, 0.85, z); to.add(p);
      const j = laatikko(2.4, 0.8, 0.06, mat(0x555a60)); j.position.set(x, 0.42, z - 0.6); to.add(j);
      const n = laatikko(0.9, 0.55, 0.05, hehku(i ? 0x9fd8ff : 0xbfe8c0, 1)); n.position.set(x, 1.25, z - 0.4); to.add(n);
      hahmo(i ? 0x2a4a7a : 0x3a6a4a, x, z - 1.2, 0, 1, to);
      hahmo(0xe76f51, x - 0.4, z + 1.2, Math.PI, 1, to); });
    const juliste = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["YRITYS-", "NEUVONTA"], "#2a4a7a", "#ffffff", 800, 400) })); juliste.position.set(4, 3.4, -5.88); to.add(juliste);
    to.add(new THREE.PointLight(0xfff6e8, 16, 20, 1.3)); to.children[to.children.length - 1].position.set(0, 5.5, 0);
    to.position.set(0, 0, 130); scene.add(to);

    /* Tukkumyymälä */
    const tu = new THREE.Group();
    const tuL = laatikko(24, 0.1, 18, mat(0x9aa0a6, { metalness: 0 })); tu.add(tuL);
    const tuK = laatikko(24, 0.2, 18, mat(0xd6d9dc, { metalness: 0 })); tuK.position.y = 8; tu.add(tuK);
    [[0, 4, -9, 24, 0], [-12, 4, 0, 18, Math.PI / 2], [12, 4, 0, 18, Math.PI / 2], [0, 4, 9, 24, 0]].forEach(([x, y, z, w, r]) => { const s = laatikko(w, 8, 0.2, mat(0xe4e6e8, { metalness: 0 })); s.position.set(x, y, z); s.rotation.y = r; tu.add(s); });
    const hyllyVarit = [0xd94f5c, 0xf2c14e, 0x4ea5d9, 0x8ab17d, 0xf4a261, 0xffffff];
    for (let h = 0; h < 3; h++) { const x = -6 + h * 6, g = new THREE.Group();
      for (let t = 0; t < 4; t++) { const ta = laatikko(1.4, 0.08, 10, mat(0xe07a2a, { metalness: 0.4 })); ta.position.y = 0.3 + t * 1.5; g.add(ta);
        for (let n = 0; n < 9; n++) { const pk = laatikko(1.1, 0.9, 0.9, mat(hyllyVarit[(h + t + n) % 6], { metalness: 0 })); pk.position.set(0, 0.8 + t * 1.5, -4.4 + n * 1.1); g.add(pk); } }
      [-5, 5].forEach((z) => [-0.7, 0.7].forEach((xx) => { const p = laatikko(0.1, 6, 0.1, mat(0x2a5aa0, { metalness: 0.4 })); p.position.set(xx, 3, z); g.add(p); }));
      g.position.set(x, 0, -1); tu.add(g); }
    const karry = new THREE.Group(); const kl = laatikko(1.2, 0.6, 0.8, mat(0x9aa0a6, { metalness: 0.7 })); kl.position.y = 0.6; karry.add(kl);
    for (let i = 0; i < 4; i++) { const p = laatikko(0.5, 0.4, 0.4, mat(hyllyVarit[i])); p.position.set(-0.3 + (i % 2) * 0.6, 1.1, -0.2 + Math.floor(i / 2) * 0.4); karry.add(p); }
    karry.position.set(-3, 0, 5.5); tu.add(karry);
    hahmo(0x1d6f6a, -3.2, 6.8, 2.8, 1, tu); hahmo(0xe76f51, -2, 4.6, 3.6, 1, tu);
    tu.add(new THREE.PointLight(0xffffff, 22, 30, 1.2)); tu.children[tu.children.length - 1].position.set(0, 7, 0);
    tu.position.set(0, 0, -130); scene.add(tu);

    const tila = { tila: "paiva" };
    function asetaTila(t) { tila.tila = t.tila || "paiva"; const ilta = tila.tila === "avajaiset";
      valot.forEach((l) => { l.visible = ilta; l.material.emissiveIntensity = 2.2; }); aur.color.set(ilta ? 0xffc890 : 0xfff0d0);
      puhelin.visible = tila.tila === "some"; kuitit.forEach((k) => { k.visible = tila.tila === "kirjanpito"; }); jono.forEach((j) => { j.visible = ilta || tila.tila === "asiakas"; }); }
    function paivita(dt, t) {
      for (let i = 0; i < vesiPos.count; i++) { const x = vesiY[i * 3], y = vesiY[i * 3 + 1]; vesiPos.array[i * 3 + 2] = Math.sin(x * 0.25 + t * 1.1) * 0.08 + Math.cos(y * 0.3 + t * 0.8) * 0.06; }
      vesiPos.needsUpdate = true;
      varjot.forEach((v, i) => { v.rotation.y = Math.sin(t * 0.6 + i) * 0.05; });
      hahmot.forEach((h) => { h.userData.paa.position.y = 1.75 + Math.sin(t * 1.5 + h.userData.v) * 0.015; });
      if (tila.tila === "avajaiset") valot.forEach((l, i) => { l.material.emissiveIntensity = 1.6 + Math.sin(t * 3 + i) * 0.6; });
    }
    const kohtaukset = {
      kansi:      { kamera: [7, 3.5, 14],    kohde: [-1, 1.5, 1],    tila: {} },
      ranta:      { kamera: [-12, 7, 22],    kohde: [1, 1, 2],       tila: {} },
      neuvoja:    { kamera: [-1.2, 2.4, 133], kohde: [-3.5, 1.3, 127.5], tila: {} },
      pankki:     { kamera: [5.8, 2.4, 133], kohde: [3.5, 1.3, 127.5], tila: {} },
      tukku:      { kamera: [4, 3.5, -122],  kohde: [-2, 1.5, -132], tila: {} },
      kirjanpito: { kamera: [2.2, 2.3, 5.2], kohde: [0, 1.25, 2.2], tila: { tila: "kirjanpito" } },
      some:       { kamera: [3.6, 2.0, 6.5], kohde: [0.2, 1.6, 2], tila: { tila: "some" } },
      asiakas:    { kamera: [4.5, 2.4, 8],   kohde: [-0.4, 1.4, 3],  tila: { tila: "asiakas" } },
      loppu:      { kamera: [8, 4, 16],      kohde: [0, 1.5, 2],     tila: { tila: "avajaiset" } }
    };
    return { kohtaukset, oletus: "ranta", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     TAIDE JA MUOTOILU – "Kampanja": mainostoimisto Kipinä (avokonttori, neuvotteluhuone,
     muotoilupaja) ja kaupungin uusi skeittipuisto kaukana (z=-130).
     ------------------------------------------------------------------------ */
  mainostoimisto(scene) {
    const V = { tausta: 0xece8e2, lattia: 0xb9a58a, seina: 0xf6f3ee, iho: 0xe0b896 };
    scene.background = new THREE.Color(V.tausta);
    scene.fog = new THREE.Fog(V.tausta, 45, 110);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8a70, 1.2));
    const aur = new THREE.DirectionalLight(0xfff2e0, 1.0); aur.position.set(-12, 20, 14); scene.add(aur);
    const hahmot = [];
    function hahmo(vari, x, z, ry, k, ryhma) {
      k = k || 1; const g = new THREE.Group();
      const kr = sylinteri(0.26, 0.32, 1.0, mat(vari, { metalness: 0 }), 10); kr.position.y = 1.05; g.add(kr);
      const j = sylinteri(0.2, 0.18, 0.6, mat(0x2f3440, { metalness: 0 }), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(V.iho, { metalness: 0 })); p.position.y = 1.75; g.add(p);
      g.userData.paa = p; g.userData.v = Math.random() * 6;
      g.scale.setScalar(k); g.position.set(x, 0, z); g.rotation.y = ry || 0; (ryhma || scene).add(g); hahmot.push(g); return g;
    }
    function tyopiste(x, z, ry, naytto) {
      const g = new THREE.Group();
      const p = laatikko(1.8, 0.08, 0.9, mat(0xf2f2f2, { metalness: 0 })); p.position.y = 0.95; g.add(p);
      [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].forEach(([a, b]) => { const j = sylinteri(0.03, 0.03, 0.95, mat(0x333333), 6); j.position.set(a, 0.47, b); g.add(j); });
      const n = laatikko(1.0, 0.6, 0.04, mat(0x1a1a1a)); n.position.set(0, 1.4, -0.3); g.add(n);
      const ruutu = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.54), new THREE.MeshBasicMaterial({ map: naytto })); ruutu.position.set(0, 1.4, -0.27); g.add(ruutu);
      const ja = sylinteri(0.02, 0.02, 0.3, mat(0x333333), 6); ja.position.set(0, 1.08, -0.3); g.add(ja);
      g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g); return g;
    }
    function kuvaTekstuuri(piirra, w, h) { const c = document.createElement("canvas"); c.width = w || 256; c.height = h || 160; const x = c.getContext("2d"); piirra(x, c.width, c.height); const t = new THREE.CanvasTexture(c); if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace; return t; }
    const nayttoLogo = kuvaTekstuuri((x, w, h) => { x.fillStyle = "#14162b"; x.fillRect(0, 0, w, h); x.fillStyle = "#39ff88"; x.beginPath(); x.arc(w / 2, h / 2, 40, 0, 6.3); x.fill(); x.fillStyle = "#14162b"; x.font = "bold 36px sans-serif"; x.textAlign = "center"; x.fillText("SK8", w / 2, h / 2 + 12); });
    const nayttoPiirros = kuvaTekstuuri((x, w, h) => { x.fillStyle = "#fff8ec"; x.fillRect(0, 0, w, h); x.strokeStyle = "#e76f51"; x.lineWidth = 6; x.beginPath(); x.moveTo(20, 120); x.bezierCurveTo(80, 20, 160, 160, 236, 40); x.stroke(); x.strokeStyle = "#264653"; x.lineWidth = 4; x.strokeRect(60, 50, 60, 60); });
    const naytto3d = kuvaTekstuuri((x, w, h) => { x.fillStyle = "#1d2433"; x.fillRect(0, 0, w, h); x.strokeStyle = "#6fb7e6"; x.lineWidth = 2; for (let i = 0; i < 10; i++) { x.beginPath(); x.moveTo(0, 30 + i * 13); x.quadraticCurveTo(w / 2, 150 - i * 6, w, 30 + i * 13); x.stroke(); } });

    /* Avokonttori */
    const lattia = laatikko(40, 0.2, 30, mat(V.lattia, { roughness: 0.8, metalness: 0 })); lattia.position.y = -0.1; scene.add(lattia);
    const seinaM = mat(V.seina, { roughness: 1, metalness: 0 });
    const taka = laatikko(40, 7, 0.3, mat(0xd9d2c8, { roughness: 1, metalness: 0 })); taka.position.set(0, 3.5, -12); scene.add(taka);
    [-20, 20].forEach((x) => { const s = laatikko(0.3, 7, 30, seinaM); s.position.set(x, 3.5, 3); scene.add(s); });
    for (let i = 0; i < 4; i++) { const ik = laatikko(6, 3.6, 0.1, hehku(0xdcefff, 0.9)); ik.position.set(-19.8, 3.4, -6 + i * 7); ik.rotation.y = Math.PI / 2; scene.add(ik); }
    const julisteVarit = [[0x14162b, 0x39ff88], [0xff6f59, 0xfff3e0], [0x2a9d8f, 0xf4d35e], [0x6d597a, 0xffb4a2], [0xf4d35e, 0x1d3557]];
    julisteVarit.forEach(([t, k], i) => { const j = new THREE.Group(); const b = laatikko(1.6, 2.2, 0.04, mat(t, { metalness: 0 })); j.add(b);
      const ym = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), mat(k, { metalness: 0 })); ym.position.set(0, 0.25, 0.03); j.add(ym);
      const vi = laatikko(1.1, 0.16, 0.02, mat(k, { metalness: 0 })); vi.position.set(0, -0.6, 0.03); j.add(vi);
      j.position.set(-10 + i * 2.4, 3.6, -11.8); j.rotation.z = (i % 2 ? 1 : -1) * 0.03; scene.add(j); });
    const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["MAINOSTOIMISTO KIPINÄ"], "#d9d2c8", "#e2552f", 1400, 220), transparent: true }));
    kyltti.position.set(6, 5.6, -11.8); scene.add(kyltti);
    const lamput = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xfff0dc, 9, 14, 1.4); l.position.set(-9 + i * 6, 5.5, -2); scene.add(l); lamput.push(l);
      const v = sylinteri(0.5, 0.5, 0.08, hehku(0xfff4e0, 1.5), 16); v.position.set(-9 + i * 6, 6.5, -2); scene.add(v); }
    /* Graafinen suunnittelija: logo näytöllä */
    tyopiste(-8, -4, 0, nayttoLogo); const graafikko = hahmo(0x2a2a30, -8, -3.1, Math.PI);
    /* Kuvittaja: piirtopöytä */
    tyopiste(-4, -4, 0, nayttoPiirros); const kuvittaja = hahmo(0xe76f51, -4, -3.1, Math.PI);
    const kyna = sylinteri(0.015, 0.01, 0.25, mat(0x222222), 6); kyna.rotation.z = 1.1; kyna.position.set(-3.8, 1.05, -3.9); scene.add(kyna);
    /* 3D-mallintaja: skeittipuiston malli pöydällä */
    tyopiste(0, -4, 0, naytto3d); const mallintaja = hahmo(0x2a9d8f, 0.4, -3.1, Math.PI);
    const malli = new THREE.Group(); const mp = laatikko(1.6, 0.05, 1.1, mat(0xb8bcc2, { metalness: 0 })); malli.add(mp);
    const ramppi = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16, 1, true, 0, Math.PI / 2), mat(0x9aa0a6, { side: THREE.DoubleSide, metalness: 0 })); ramppi.rotation.z = Math.PI / 2; ramppi.position.set(-0.4, 0.38, 0); malli.add(ramppi);
    const kaide = laatikko(0.9, 0.02, 0.02, mat(0xe2552f)); kaide.position.set(0.3, 0.15, 0.2); malli.add(kaide);
    malli.position.set(3, 1.0, -1.5); scene.add(malli); poytaAlle(3, -1.5);
    function poytaAlle(x, z) { const p = laatikko(2, 0.08, 1.4, mat(0xf2f2f2, { metalness: 0 })); p.position.set(x, 0.95, z); scene.add(p); const j = laatikko(1.8, 0.9, 1.2, mat(0xdedad3, { metalness: 0 })); j.position.set(x, 0.45, z); scene.add(j); }
    /* Muotoilija: 3D-tulostin ja prototyypit */
    poytaAlle(9, -4);
    const tulostin = new THREE.Group(); const tk = laatikko(0.8, 0.9, 0.8, mat(0x2b2d42, { metalness: 0.3 })); tk.position.y = 0.45; tulostin.add(tk);
    const ikk = laatikko(0.6, 0.6, 0.02, mat(0x9fd8ff, { transparent: true, opacity: 0.5 })); ikk.position.set(0, 0.5, 0.41); tulostin.add(ikk);
    const suutin = laatikko(0.1, 0.1, 0.1, hehku(0xff9f43, 1.2)); suutin.position.set(0, 0.7, 0.1); tulostin.add(suutin);
    tulostin.position.set(8.5, 0.99, -4.2); scene.add(tulostin);
    const protot = []; [0x39ff88, 0xff6f59, 0xf4d35e].forEach((v, i) => { const p = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.05, 8, 16), mat(v, { metalness: 0 })); p.position.set(9.4 + i * 0.3, 1.07, -3.8); p.rotation.x = Math.PI / 2; scene.add(p); protot.push(p); });
    const muotoilija = hahmo(0x6d597a, 9.6, -2.9, Math.PI);
    /* Neuvotteluhuone: lasiseinä, pöytä, näyttö */
    const nh = new THREE.Group();
    const lasi = laatikko(0.08, 3, 7, mat(0xcfe8f0, { transparent: true, opacity: 0.25, metalness: 0.2 })); lasi.position.set(-4, 1.5, 0); nh.add(lasi);
    const np = laatikko(3.4, 0.1, 1.6, mat(0x5a4636, { metalness: 0 })); np.position.set(0, 0.95, 0); nh.add(np);
    const nj = laatikko(3, 0.9, 1.2, mat(0x3a2e24, { metalness: 0 })); nj.position.set(0, 0.45, 0); nh.add(nj);
    const nn = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["BRIEF:", "Skeittipuiston avajaiset", "Kohderyhmä 13–18 v"], "#1d3557", "#f1faee", 3400, 1400) }));
    nn.position.set(0, 2.2, -3.4); nh.add(nn);
    const asiakas = hahmo(0x8ab17d, -0.8, 1.2, Math.PI, 1, nh); const ad = hahmo(0x2a2a30, 0.9, 1.2, Math.PI, 1, nh); hahmo(0xe2552f, 1.9, -0.2, -Math.PI / 2, 1, nh);
    nh.position.set(14, 0, 5); scene.add(nh);
    const sohva = laatikko(3, 0.7, 1, mat(0xe2552f, { metalness: 0 })); sohva.position.set(-10, 0.35, 6); scene.add(sohva);
    const kasvi = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), mat(0x5c8a4a, { flatShading: true, metalness: 0 })); kasvi.position.set(-12.5, 1.2, 6); scene.add(kasvi);
    const ruukku = sylinteri(0.35, 0.28, 0.6, mat(0xd9c8b0), 10); ruukku.position.set(-12.5, 0.3, 6); scene.add(ruukku);

    /* Skeittipuisto (kaukana) */
    const sp = new THREE.Group();
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mat(0x86b860, { metalness: 0, roughness: 1 })); maa.rotation.x = -Math.PI / 2; sp.add(maa);
    const betoni = laatikko(30, 0.2, 22, mat(0xb8bcc2, { metalness: 0, roughness: 1 })); betoni.position.y = 0.05; sp.add(betoni);
    const kulho = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 6, 24, 1, true, 0, Math.PI / 2), mat(0xa0a6ad, { side: THREE.DoubleSide, metalness: 0 })); kulho.rotation.z = Math.PI / 2; kulho.rotation.y = Math.PI; kulho.position.set(-8, 4.05, -4); kulho.visible = false; sp.add(kulho);
    const lava = laatikko(6, 1.2, 4, mat(0xa0a6ad, { metalness: 0 })); lava.position.set(-6, 0.6, -3); sp.add(lava);
    const kisko = laatikko(5, 0.06, 0.06, mat(0xe2552f, { metalness: 0.6 })); kisko.position.set(3, 0.6, 3); sp.add(kisko);
    [-2, 2].forEach((d) => { const j = laatikko(0.06, 0.5, 0.06, mat(0x444444)); j.position.set(3 + d, 0.3, 3); sp.add(j); });
    const muuri = laatikko(14, 3.2, 0.4, mat(0xd8d4cc, { metalness: 0 })); muuri.position.set(0, 1.6, -11); sp.add(muuri);
    const muraali = new THREE.Mesh(new THREE.PlaneGeometry(13.6, 3), new THREE.MeshBasicMaterial({ map: kuvaTekstuuri((x, w, h) => {
      const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#14162b"); g.addColorStop(0.5, "#6d597a"); g.addColorStop(1, "#ff6f59"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = "#39ff88"; x.lineWidth = 10; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(i * 220, h); x.bezierCurveTo(i * 220 + 80, 20, i * 220 + 160, 200, i * 220 + 260, 10); x.stroke(); }
      x.fillStyle = "#f4d35e"; x.font = "bold 90px sans-serif"; x.fillText("ROLL", 70, 160); }, 1024, 230) }));
    muraali.position.set(0, 1.6, -10.78); sp.add(muraali);
    const maalari = hahmo(0x343a40, 2, -9.6, 0, 1, sp); const tikkaat = laatikko(0.5, 2.6, 0.08, mat(0xc8c8c8, { metalness: 0.6 })); tikkaat.position.set(2.8, 1.3, -10.4); tikkaat.rotation.x = 0.2; sp.add(tikkaat);
    const pav = new THREE.Group(); const pk = laatikko(6, 0.2, 4, mat(0x2b2d42)); pk.position.y = 3; pav.add(pk);
    [[-2.8, -1.8], [2.8, -1.8], [-2.8, 1.8], [2.8, 1.8]].forEach(([x, z]) => { const t = sylinteri(0.08, 0.08, 3, mat(0x888888, { metalness: 0.6 }), 8); t.position.set(x, 1.5, z); pav.add(t); });
    const lavaV = laatikko(5, 0.4, 3, mat(0x5a4636)); lavaV.position.y = 0.2; pav.add(lavaV);
    const bann = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 0.9), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["AVAJAISET"], "#14162b", "#39ff88", 1024, 170) })); bann.position.set(0, 2.5, 2.02); pav.add(bann);
    const ramppiP = laatikko(1.2, 0.05, 2.2, mat(0x9aa0a6)); ramppiP.position.set(3.4, 0.2, 0.6); ramppiP.rotation.z = 0.18; pav.add(ramppiP);
    pav.position.set(11, 0, 4); pav.rotation.y = -0.6; sp.add(pav);
    const sisustaja = hahmo(0xf4a261, 9.2, 6.2, -0.4, 1, sp);
    const skeittaajat = [], yleiso = [];
    for (let i = 0; i < 4; i++) { const s = hahmo([0x39ff88, 0xff6f59, 0x48cae4, 0xf4d35e][i], -6 + i * 4, 2 + (i % 2) * 3, i, 0.85, sp); skeittaajat.push(s);
      const lauta = laatikko(0.25, 0.04, 0.8, mat(0x222222)); lauta.position.y = 0.05; s.add(lauta); s.userData.x0 = s.position.x; }
    for (let i = 0; i < 16; i++) { const y = hahmo([0x3a5a8a, 0xb5654f, 0x5c7a4a, 0x6d597a, 0x343a40, 0xd9a441][i % 6], -12 + Math.random() * 26, 8 + Math.random() * 4, Math.PI + (Math.random() - 0.5), 0.95, sp); yleiso.push(y); }
    const valot = []; for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffd59a, 0, 18, 1.3); l.position.set(-12 + i * 5, 5, 0); sp.add(l); valot.push(l); }
    sp.position.set(0, 0, -130); scene.add(sp);

    const tila = { tila: "paiva" };
    function asetaTila(t) { tila.tila = t.tila || "paiva"; const ilta = tila.tila === "avajaiset";
      yleiso.forEach((y) => { y.visible = ilta; }); valot.forEach((l) => { l.intensity = ilta ? 12 : 0; }); aur.color.set(ilta ? 0xffb37a : 0xfff2e0); }
    function paivita(dt, t) {
      suutin.position.x = Math.sin(t * 2.2) * 0.25; suutin.position.z = 0.1 + Math.cos(t * 1.7) * 0.15;
      protot.forEach((p, i) => { p.rotation.z = t * 0.6 + i; });
      malli.rotation.y = Math.sin(t * 0.4) * 0.35;
      skeittaajat.forEach((s, i) => { s.position.x = s.userData.x0 + Math.sin(t * 0.9 + i * 1.7) * 2.5; s.rotation.y = Math.cos(t * 0.9 + i * 1.7) > 0 ? Math.PI / 2 : -Math.PI / 2; });
      maalari.position.x = 2 + Math.sin(t * 0.7) * 0.6;
      hahmot.forEach((h) => { h.userData.paa.position.y = 1.75 + Math.sin(t * 1.5 + h.userData.v) * 0.015; });
    }
    const kohtaukset = {
      kansi:      { kamera: [-2, 4.2, 9],     kohde: [-2, 2.4, -10],   tila: {} },
      toimisto:   { kamera: [6, 6, 12],       kohde: [-2, 1.5, -5],    tila: {} },
      brief:      { kamera: [14, 2.8, 10.5],  kohde: [14, 1.6, 2],     tila: {} },
      kuvitus:    { kamera: [-2.6, 2.6, -0.6], kohde: [-4, 1.3, -4.2], tila: {} },
      mallinnus:  { kamera: [5.2, 2.5, 0.4],  kohde: [1.8, 1.2, -3],   tila: {} },
      muotoilu:   { kamera: [11.4, 2.5, -0.6], kohde: [9, 1.2, -4],    tila: {} },
      sisustus:   { kamera: [4, 4, -114],     kohde: [11, 1.2, -126],  tila: {} },
      muraali:    { kamera: [-4, 2.4, -131],  kohde: [1, 1.7, -141],   tila: {} },
      graafikko:  { kamera: [-6.4, 2.5, -0.6], kohde: [-8, 1.3, -4.2], tila: {} },
      loppu:      { kamera: [-14, 6, -112],   kohde: [2, 1.2, -132],   tila: { tila: "avajaiset" } }
    };
    return { kohtaukset, oletus: "toimisto", asetaTila, paivita };
  },

  /* ------------------------------------------------------------------------
     Lukiopolku – "Päivystyksen ilta": sairaalan kerros leikkauskuvana.
     Huoneet vasemmalta oikealle: ambulanssihalli (x -21), laboratorio (-9),
     röntgen (0), tutkimushuone (9), lääkehuone (18), osasto (27).
     Tila { ilta: 0…1 } hämärtää ikkunat ja sytyttää valot vuoron edetessä.
     ------------------------------------------------------------------------ */
  sairaala(scene) {
    const V = { tausta: 0xdfeeee, lattia: 0xc9d6d3, seina: 0xf3f7f6, mint: 0x7fc8b8, iho: 0xe5bc98, iho2: 0xa8754f, hoito: 0x5b8fd0, valk: 0xf7f9fa };
    scene.background = new THREE.Color(V.tausta);
    scene.fog = new THREE.Fog(V.tausta, 40, 110);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xa9bdb8, 1.35); scene.add(hemi);
    const aur = new THREE.DirectionalLight(0xffe2c0, 1.1); aur.position.set(-18, 22, 16); scene.add(aur);

    const M = (c, o) => mat(c, Object.assign({ metalness: 0, roughness: 0.8 }, o || {}));
    function kuvaTx(piirra, w, h) { const c = document.createElement("canvas"); c.width = w || 256; c.height = h || 160; const x = c.getContext("2d"); piirra(x, c.width, c.height); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
    function taso(w, h, tx) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx })); }

    /* Hahmot: haalari/takki värillä, valkoinen takki = lääkäri, bioanalyytikko, farmaseutti */
    const hahmot = [];
    function hahmo(vari, x, z, ry, o) {
      o = o || {}; const g = new THREE.Group();
      const kr = sylinteri(0.25, 0.31, 0.95, M(vari), 12); kr.position.y = 1.05; g.add(kr);
      if (o.takki) { const t = sylinteri(0.29, 0.38, 1.05, M(V.valk), 12); t.position.y = 0.98; g.add(t); }
      const j = sylinteri(0.19, 0.17, 0.6, M(o.housut || vari), 8); j.position.y = 0.3; g.add(j);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), M(o.iho || V.iho)); p.position.y = 1.74; g.add(p);
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(o.hius || 0x4a3426)); hi.position.y = 1.78; g.add(hi);
      if (o.heijastin) { const r = laatikko(0.64, 0.07, 0.1, hehku(0xd8ff5a, 0.7)); r.position.set(0, 1.2, 0.27); g.add(r); }
      g.userData.paa = p; g.userData.hi = hi; g.userData.v = Math.random() * 6;
      g.position.set(x, 0, z); g.rotation.y = ry || 0; (o.ryhma || scene).add(g); hahmot.push(g); return g;
    }
    /* Makaava potilas peiton alla */
    function makaava(x, y, z, ry, peitto, o) {
      o = o || {}; const g = new THREE.Group();
      const kr = laatikko(0.62, 0.26, 1.55, M(peitto)); kr.position.set(0, 0.13, 0.25); g.add(kr);
      const ty = laatikko(0.55, 0.12, 0.38, M(0xffffff)); ty.position.set(0, 0.08, -0.72); g.add(ty);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), M(o.iho || V.iho)); p.position.set(0, 0.28, -0.66); g.add(p);
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(o.hius || 0xd9d9d9)); hi.rotation.x = -Math.PI / 2; hi.position.set(0, 0.28, -0.7); g.add(hi);
      g.position.set(x, y, z); g.rotation.y = ry || 0; scene.add(g); return g;
    }
    function sanky(x, z, ry, korkeus) {
      const g = new THREE.Group(); const h = korkeus || 0.75;
      const runko = laatikko(1.0, 0.16, 2.2, M(0xd7dde0, { metalness: 0.4, roughness: 0.4 })); runko.position.y = h - 0.1; g.add(runko);
      const patja = laatikko(0.92, 0.14, 2.05, M(0xeef3f5)); patja.position.y = h + 0.05; g.add(patja);
      const paaty = laatikko(1.02, 0.55, 0.06, M(0x9fb5bd, { metalness: 0.3 })); paaty.position.set(0, h + 0.2, -1.1); g.add(paaty);
      [[-0.42, -0.95], [0.42, -0.95], [-0.42, 0.95], [0.42, 0.95]].forEach(([a, b]) => { const j = sylinteri(0.035, 0.035, h - 0.1, M(0x8a979c, { metalness: 0.6 }), 6); j.position.set(a, (h - 0.1) / 2, b); g.add(j); });
      g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g); return g;
    }
    function poyta(x, z, w, d, vari, ry) {
      const g = new THREE.Group();
      const p = laatikko(w, 0.07, d, M(vari || 0xeceff0)); p.position.y = 0.92; g.add(p);
      const k = laatikko(w - 0.06, 0.86, d - 0.08, M(0xd5dcde)); k.position.y = 0.45; g.add(k);
      g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g); return g;
    }

    /* Kerroksen pohja ja seinät */
    const lattia = laatikko(70, 0.2, 13, M(V.lattia)); lattia.position.set(3, -0.1, -0.5); scene.add(lattia);
    const raita = laatikko(70, 0.01, 0.5, M(V.mint)); raita.position.set(3, 0.005, 3.6); scene.add(raita);
    const piha = new THREE.Mesh(new THREE.PlaneGeometry(260, 200), M(0x9fb8a2, { roughness: 1 })); piha.rotation.x = -Math.PI / 2; piha.position.y = -0.25; scene.add(piha);
    const tie = new THREE.Mesh(new THREE.PlaneGeometry(9, 80), M(0x5f6a70)); tie.rotation.x = -Math.PI / 2; tie.position.set(-30, -0.22, 20); scene.add(tie);
    const seinaM = M(V.seina, { roughness: 1 });
    const takaseina = laatikko(58, 3.4, 0.3, seinaM); takaseina.position.set(8, 1.7, -6); scene.add(takaseina);
    const sokkeli = laatikko(58, 0.25, 0.05, M(V.mint)); sokkeli.position.set(8, 0.13, -5.83); scene.add(sokkeli);
    [-16, -4.5, 4.5, 13.5, 22.5, 31.5].forEach((x) => { const s = laatikko(0.25, 3.4, 8.5, seinaM); s.position.set(x, 1.7, -1.75); scene.add(s);
      const r = laatikko(0.27, 0.25, 8.5, M(V.mint)); r.position.set(x, 0.13, -1.75); scene.add(r); });
    /* Ikkunat takaseinässä: iltataivas */
    const taivasTx = kuvaTx((x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#d0d0d0"); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(60,70,80,.55)"; for (let i = 0; i < 9; i++) { const bw = 18 + (i * 37) % 30, bh = 30 + (i * 53) % 70; x.fillRect(i * 30, h - bh, bw, bh); } }, 256, 160);
    const ikkunaMat = new THREE.MeshBasicMaterial({ map: taivasTx, color: 0xffd6a8 });
    const ikkunat = [];
    [-9, 0, 9, 18, 27].forEach((x) => { const k = laatikko(2.6, 1.5, 0.08, M(0xb8c4c8, { metalness: 0.5 })); k.position.set(x + 1.4, 2.1, -5.82); scene.add(k);
      const ik = taso(2.4, 1.3, taivasTx); ik.material = ikkunaMat; ik.position.set(x + 1.4, 2.1, -5.77); scene.add(ik); ikkunat.push(ik); });
    /* Kattovalot (riippuvat paneelit) */
    const valoMat = hehku(0xfff6e6, 0.6); const kattoValot = [];
    [-21, -9, 0, 9, 18, 27].forEach((x) => { const v = laatikko(1.8, 0.06, 0.5, valoMat); v.position.set(x, 3.35, -1.5); scene.add(v);
      const l = new THREE.PointLight(0xfff1dc, 0, 9, 1.5); l.position.set(x, 3.0, -1.2); scene.add(l); kattoValot.push(l); });
    /* Huoneiden nimikyltit seinässä */
    function kyltti(teksti, x, vari) { const k = taso(2.6, 0.42, tekstiTekstuuri([teksti], "#ffffff", vari || "#2f7f73", 900, 145)); k.position.set(x, 3.0, -5.82); scene.add(k); }
    kyltti("LABORATORIO", -9 - 1.6); kyltti("RÖNTGEN", -1.6, "#3b6fb0"); kyltti("TUTKIMUSHUONE 3", 9 - 1.6); kyltti("LÄÄKEHUONE", 18 - 1.6, "#7a5aa6"); kyltti("OSASTO 5B", 27 - 1.6);

    /* ---- 1. Ambulanssihalli ---- */
    const halli = laatikko(11, 4.6, 0.3, M(0xe5ecec)); halli.position.set(-21.5, 2.3, -6); scene.add(halli);
    const ovi = laatikko(4.4, 3.4, 0.1, M(0x9eb7bf, { metalness: 0.4, transparent: true, opacity: 0.55 })); ovi.position.set(-21, 1.7, -5.8); scene.add(ovi);
    const pkyltti = taso(4.6, 0.8, tekstiTekstuuri(["PÄIVYSTYS"], "#ffffff", "#c8102e", 1100, 190)); pkyltti.position.set(-21, 4.0, -5.82); scene.add(pkyltti);
    const katos = laatikko(12, 0.25, 9, M(0xcfd8da, { metalness: 0.3 })); katos.position.set(-21.5, 4.7, -1.5); scene.add(katos);
    [[-27, 2.8], [-16.2, 2.8]].forEach(([x, z]) => { const t = sylinteri(0.14, 0.14, 4.7, M(0xb0bcc0, { metalness: 0.5 }), 10); t.position.set(x, 2.35, z); scene.add(t); });
    /* Ambulanssi: suomalainen keltainen korkeakattoinen pakettiauto, punakeltainen ruutukuvio */
    const amb = new THREE.Group();
    const KEL = "#f5e20c", PUN = "#e3170a", ORA = "#ff7a00", SIN = "#1d3fbf";
    function tahti(x, cx, cy, r) {
      x.save(); x.translate(cx, cy); x.fillStyle = SIN;
      for (let i = 0; i < 3; i++) { x.save(); x.rotate(i * Math.PI / 3); x.fillRect(-r * 0.22, -r, r * 0.44, r * 2); x.restore(); }
      x.strokeStyle = "#ffffff"; x.lineWidth = r * 0.08; x.beginPath(); x.moveTo(0, -r * 0.7); x.lineTo(0, r * 0.7); x.stroke();
      x.beginPath(); x.moveTo(-r * 0.15, -r * 0.45); x.quadraticCurveTo(r * 0.25, -r * 0.25, -r * 0.15, 0); x.quadraticCurveTo(-r * 0.45, r * 0.25, r * 0.15, r * 0.45); x.stroke(); x.restore();
    }
    function ruudut(x, y0, h, w, alku) {
      x.fillStyle = ORA; x.fillRect(0, y0 - h * 0.28, w, h * 0.16);
      x.fillStyle = PUN; const s = h * 0.9;
      for (let i = alku || 0, n = 0; i < w; i += s * 1.25, n++) { x.save(); x.translate(i, y0); x.transform(1, 0, -0.35, 1, 0, 0); x.fillRect(0, 0, s, h * 0.62); x.restore(); }
      x.fillStyle = ORA; x.fillRect(0, y0 + h * 0.8, w, h * 0.16);
    }
    /* Kylki (1024 x 512): vasen reuna = auton etupää */
    const kylkiTx = kuvaTx((x, w, h) => {
      x.fillStyle = KEL; x.fillRect(0, 0, w, h);
      x.fillStyle = "#1b2430"; x.beginPath(); x.moveTo(40, 70); x.lineTo(205, 70); x.lineTo(205, 215); x.lineTo(15, 215); x.closePath(); x.fill();
      x.fillRect(235, 75, 210, 125);
      x.fillStyle = PUN; for (let i = 0; i < 5; i++) { x.save(); x.translate(330 + i * 22, 75); x.transform(1, 0, -0.5, 1, 0, 0); x.fillRect(0, 0, 11, 125); x.restore(); }
      x.fillStyle = "#11161d"; x.fillRect(215, 60, 6, 400); x.fillRect(470, 60, 6, 400);
      x.fillRect(110, 245, 40, 10); x.fillRect(300, 245, 40, 10);
      tahti(x, 610, 140, 62);
      x.fillStyle = SIN; x.font = "bold 74px Arial, sans-serif"; x.fillText("112", 690, 140);
      x.font = "bold 46px Arial, sans-serif"; x.fillText("AMBULANSSI", 690, 195);
      x.fillStyle = PUN; x.fillRect(880, 15, 40, 90); x.fillRect(940, 15, 40, 90);
      ruudut(x, 300, 110, w, 20);
    }, 1024, 512);
    const kylkiTx2 = kylkiTx.clone(); kylkiTx2.wrapS = THREE.RepeatWrapping; kylkiTx2.repeat.x = -1; kylkiTx2.needsUpdate = true;
    const takaTx = kuvaTx((x, w, h) => {
      x.fillStyle = KEL; x.fillRect(0, 0, w, h);
      x.fillStyle = "#1b2430"; x.fillRect(40, 50, 190, 150); x.fillRect(282, 50, 190, 150);
      x.fillStyle = "#11161d"; x.fillRect(253, 30, 6, 470);
      x.fillStyle = PUN; for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) x.fillRect(i * 64, 300 + j * 64, 64, 64);
      tahti(x, 256, 250, 34);
    }, 512, 512);
    const keulaTx = kuvaTx((x, w, h) => {
      x.fillStyle = KEL; x.fillRect(0, 0, w, h);
      x.fillStyle = "#2a2f36"; x.fillRect(150, 40, 212, 110);
      x.fillStyle = "#d9dde2"; for (let i = 0; i < 5; i++) x.fillRect(158, 50 + i * 20, 196, 6);
      x.fillStyle = "#eef3ff"; x.fillRect(20, 50, 110, 45); x.fillRect(382, 50, 110, 45);
      x.fillStyle = "#3a63ff"; x.fillRect(175, 165, 40, 16); x.fillRect(297, 165, 40, 16);
      x.fillStyle = "#ffffff"; x.fillRect(176, 205, 160, 40); x.fillStyle = SIN; x.fillRect(176, 205, 22, 40);
      x.fillStyle = ORA; for (let i = 0; i < 6; i++) x.fillRect(10 + i * 85, 262, 55, 26);
    }, 512, 300);
    const konepeltiTx = kuvaTx((x, w, h) => { x.fillStyle = KEL; x.fillRect(0, 0, w, h); x.fillStyle = PUN;
      [0, 1].forEach((i) => { x.save(); x.translate(80 + i * 70, 0); x.transform(1, 0, -0.6, 1, 0, 0); x.fillRect(0, 0, 38, h); x.restore(); }); }, 256, 256);
    const keltM = M(0xf5e20c, { roughness: 0.45, metalness: 0.1, emissive: 0x3a3300 });
    const L = 4.4, K = 2.6, Lev = 2.1;
    const kori = new THREE.Mesh(new THREE.BoxGeometry(Lev, K, L), [
      M(0xffffff, { map: kylkiTx, roughness: 0.45, emissive: 0x332d00, emissiveMap: kylkiTx }), M(0xffffff, { map: kylkiTx2, roughness: 0.45, emissive: 0x332d00, emissiveMap: kylkiTx2 }),
      keltM, keltM, keltM, M(0xffffff, { map: takaTx, roughness: 0.45, emissive: 0x332d00, emissiveMap: takaTx })]);
    kori.position.set(0, 0.45 + K / 2, 0); amb.add(kori);
    const keula = new THREE.Mesh(new THREE.BoxGeometry(Lev - 0.04, 0.95, 0.9), [keltM, keltM, M(0xffffff, { map: konepeltiTx }), keltM, M(0xffffff, { map: keulaTx }), keltM]);
    keula.position.set(0, 0.45 + 0.475, L / 2 + 0.45); amb.add(keula);
    const tuulilasi = laatikko(Lev - 0.12, 1.25, 0.05, M(0x1b2430, { metalness: 0.6, roughness: 0.15 }));
    tuulilasi.position.set(0, 1.95, L / 2 + 0.35); tuulilasi.rotation.x = -0.55; amb.add(tuulilasi);
    const lippa = new THREE.Mesh(new THREE.PlaneGeometry(Lev - 0.1, 0.32), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["AMBULANSSI"], "#f5e20c", "#e3170a", 700, 110) }));
    lippa.position.set(0, 2.9, L / 2 + 0.02); amb.add(lippa);
    [-1, 1].forEach((s) => { const p = laatikko(0.08, 0.25, 0.18, M(0x111111)); p.position.set(s * (Lev / 2 + 0.06), 2.0, L / 2 - 0.1); amb.add(p); });
    [[-0.95, -1.4], [0.95, -1.4], [-0.95, 2.6], [0.95, 2.6]].forEach(([x, z]) => {
      const r = sylinteri(0.42, 0.42, 0.28, M(0x15181b), 18); r.rotation.z = Math.PI / 2; r.position.set(x, 0.42, z); amb.add(r);
      const v = sylinteri(0.25, 0.25, 0.3, M(0xb9c0c8, { metalness: 0.8, roughness: 0.3 }), 10); v.rotation.z = Math.PI / 2; v.position.set(x, 0.42, z); amb.add(v); });
    const vilkut = [];
    const palkki = laatikko(Lev - 0.2, 0.16, 0.5, M(0x22304a)); palkki.position.set(0, 0.45 + K + 0.08, L / 2 - 0.35); amb.add(palkki);
    [-0.5, 0.5].forEach((x) => { const v = laatikko(0.85, 0.12, 0.42, hehku(0x2d6bff, 1.6)); v.position.set(x, 0.45 + K + 0.12, L / 2 - 0.35); amb.add(v); vilkut.push(v); });
    [-1, 1].forEach((s) => { const v = laatikko(0.08, 0.08, L - 1.2, hehku(0x2d6bff, 1.6)); v.position.set(s * (Lev / 2 - 0.05), 0.45 + K + 0.04, -0.3); amb.add(v); vilkut.push(v); });
    [-0.7, 0.7].forEach((x) => { const v = laatikko(0.3, 0.12, 0.08, hehku(0x2d6bff, 1.6)); v.position.set(x, 0.45 + K - 0.15, -L / 2 - 0.03); amb.add(v); vilkut.push(v); });
    amb.position.set(-25.5, 0, 3.0); scene.add(amb);
    const paarit = new THREE.Group();
    const pr = laatikko(0.7, 0.1, 2.0, M(0xffb703)); pr.position.y = 0.85; paarit.add(pr);
    const pj = laatikko(0.5, 0.8, 1.6, M(0x8a979c, { metalness: 0.5 })); pj.position.y = 0.4; pj.scale.set(1, 1, 1); paarit.add(pj);
    paarit.position.set(-20.4, 0, 0.6); paarit.rotation.y = 0.25; scene.add(paarit);
    makaava(-20.4, 0.9, 0.6, 0.25, 0xe07a5f);
    const samir = hahmo(0x2f6b3a, -19.4, 1.6, -2.2, { heijastin: true, iho: V.iho2, hius: 0x1d1d1d });
    hahmo(0x2f6b3a, -21.6, 2.1, 2.6, { heijastin: true, hius: 0x6b4423 });
    hahmo(V.hoito, -18.4, -1.6, 2.7, { hius: 0x8a5a2b });
    hahmo(V.hoito, -17.4, -0.6, 2.3, { hius: 0x2b2b2b });
    const ambValo = new THREE.PointLight(0x2d7dff, 0, 10, 1.6); ambValo.position.set(-23, 3, 2.5); scene.add(ambValo);

    /* ---- 2. Laboratorio ---- */
    poyta(-9.8, -4.9, 6.5, 1.1);
    const analysaattori = laatikko(1.6, 1.2, 0.9, M(0xe9eef0, { metalness: 0.2 })); analysaattori.position.set(-11.6, 1.56, -4.9); scene.add(analysaattori);
    const an = taso(0.7, 0.4, kayraTekstuuri("#5ce1a8", 1)); an.position.set(-11.9, 1.75, -4.44); scene.add(an);
    const anValo = laatikko(0.1, 0.1, 0.02, hehku(0x51cf66, 1.6)); anValo.position.set(-11.0, 1.9, -4.44); scene.add(anValo);
    const linko = new THREE.Group(); const lk = sylinteri(0.35, 0.38, 0.35, M(0xdfe5e7, { metalness: 0.3 }), 20); linko.add(lk);
    const roottori = new THREE.Group(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const p = sylinteri(0.035, 0.035, 0.16, M([0xc92a2a, 0x7048e8, 0xf08c00][i % 3]), 6); p.position.set(Math.cos(a) * 0.2, 0.22, Math.sin(a) * 0.2); roottori.add(p); }
    linko.add(roottori); linko.position.set(-9.7, 1.13, -4.8); scene.add(linko);
    /* Putkiteline: kaksi "Virtasta" – yksi korkki punainen, toinen violetti */
    const teline = laatikko(0.9, 0.08, 0.3, M(0xffffff)); teline.position.set(-8.4, 1.0, -4.5); scene.add(teline);
    const putket = [];
    for (let i = 0; i < 7; i++) { const p = sylinteri(0.035, 0.035, 0.32, M(0xeef6ff, { transparent: true, opacity: 0.85 }), 8); p.position.set(-8.75 + i * 0.12, 1.15, -4.5); scene.add(p);
      const k = sylinteri(0.04, 0.04, 0.06, M([0xc92a2a, 0x7048e8, 0x2b8a3e, 0xf08c00][i % 4]), 8); k.position.set(-8.75 + i * 0.12, 1.33, -4.5); scene.add(k); putket.push(k); }
    const mikro = new THREE.Group(); const mj = laatikko(0.3, 0.06, 0.35, M(0x2b2d42)); mikro.add(mj);
    const mv = laatikko(0.06, 0.5, 0.06, M(0x2b2d42)); mv.position.set(0, 0.25, -0.12); mikro.add(mv);
    const mo = sylinteri(0.05, 0.05, 0.3, M(0xdfe5e7, { metalness: 0.5 }), 10); mo.rotation.x = 0.5; mo.position.set(0, 0.45, -0.02); mikro.add(mo);
    mikro.position.set(-7.3, 0.98, -4.7); scene.add(mikro);
    poyta(-12.6, -0.8, 1.1, 2.6, 0xeceff0, 0);
    const naytto = laatikko(0.06, 0.5, 0.8, M(0x1a1a1a)); naytto.position.set(-12.9, 1.4, -0.8); scene.add(naytto);
    const nr = taso(0.74, 0.44, tekstiTekstuuri(["VIRTANEN E. ✓", "VIRTANEN L. ?"], "#d3f9d8", "#12352c", 512, 300)); nr.rotation.y = Math.PI / 2; nr.position.set(-12.86, 1.4, -0.8); scene.add(nr);
    const mei = hahmo(0x4f8fbf, -9.0, -3.7, Math.PI, { takki: true, hius: 0x111111 });

    /* ---- 3. Röntgen ---- */
    const rPoyta = new THREE.Group(); const rp = laatikko(0.9, 0.12, 2.4, M(0xe9eef0)); rp.position.y = 0.85; rPoyta.add(rp);
    const rj = laatikko(0.5, 0.8, 1.2, M(0xbfc9cd, { metalness: 0.3 })); rj.position.y = 0.4; rPoyta.add(rj);
    rPoyta.position.set(0.2, 0, -2.4); rPoyta.rotation.y = Math.PI / 2; scene.add(rPoyta);
    makaava(0.2, 0.92, -2.4, Math.PI / 2, 0x9ec5e8);
    const tyyny = laatikko(0.5, 0.18, 0.4, M(0xfff1c1)); tyyny.position.set(0.9, 1.05, -2.25); scene.add(tyyny);
    const kisko2 = laatikko(4.2, 0.12, 0.2, M(0xbfc9cd, { metalness: 0.5 })); kisko2.position.set(0.2, 3.25, -2.4); scene.add(kisko2);
    const putki = new THREE.Group(); const pv = sylinteri(0.06, 0.06, 1.2, M(0xbfc9cd, { metalness: 0.5 }), 8); pv.position.y = -0.6; putki.add(pv);
    const pk = laatikko(0.55, 0.4, 0.55, M(0xf4f6f6)); pk.position.y = -1.35; putki.add(pk);
    const kollimaattori = laatikko(0.32, 0.12, 0.32, hehku(0xfff3a3, 0.4)); kollimaattori.position.y = -1.6; putki.add(kollimaattori);
    putki.position.set(0.5, 3.2, -2.4); scene.add(putki);
    const valokeila = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3a3, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
    valokeila.position.set(0.5, 1.32, -2.4); valokeila.rotation.y = Math.PI / 4; scene.add(valokeila);
    const katselu = laatikko(1.7, 1.2, 0.06, M(0x2b2d42)); katselu.position.set(-2.4, 1.9, -5.8); scene.add(katselu);
    const lonkka = taso(1.55, 1.05, kuvaTx((x, w, h) => { x.fillStyle = "#0b1220"; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(220,235,255,.85)";
      x.beginPath(); x.ellipse(w * 0.5, h * 0.32, 70, 34, 0, 0, 6.3); x.fill();
      [[0.3, 1], [0.7, -1]].forEach(([cx, s]) => { x.beginPath(); x.arc(w * cx, h * 0.55, 20, 0, 6.3); x.fill(); x.save(); x.translate(w * cx, h * 0.55); x.rotate(s * 0.25); x.fillRect(-11, 10, 22, 70); x.restore(); });
      x.fillStyle = "#0b1220"; x.beginPath(); x.ellipse(w * 0.5, h * 0.36, 26, 14, 0, 0, 6.3); x.fill(); }, 256, 176));
    lonkka.position.set(-2.4, 1.9, -5.76); scene.add(lonkka);
    const lyijy = laatikko(1.1, 1.9, 0.08, M(0x4c6a7c)); lyijy.position.set(3.7, 0.95, -4.2); lyijy.rotation.y = -0.4; scene.add(lyijy);
    const joel = hahmo(0x3b6fb0, 1.6, -1.0, -2.6, { hius: 0xa0522d });
    const tytar = hahmo(0x9c6644, 3.6, 1.6, -2.3, { hius: 0xb08d57 });

    /* ---- 4. Tutkimushuone ---- */
    sanky(8.0, -3.4, 0, 0.78);
    const leo = hahmo(0x2f9e8f, 8.0, -2.4, 0.2, { hius: 0x3d2b1f }); leo.position.y = 0.3; leo.scale.setScalar(0.92);
    const isa = hahmo(0x6c757d, 6.0, -1.2, 1.2, { hius: 0x3d2b1f });
    const anna = hahmo(0x9b5de5, 10.2, -1.6, -2.0, { takki: true, hius: 0xc68642 });
    const verhoKisko = laatikko(0.05, 0.05, 4, M(0xbfc9cd)); verhoKisko.position.set(10.8, 3.1, -3.0); scene.add(verhoKisko);
    const verho = laatikko(0.04, 2.5, 1.6, M(0x7fc8b8, { side: THREE.DoubleSide })); verho.position.set(10.8, 1.8, -4.3); scene.add(verho);
    const monitori = laatikko(0.7, 0.5, 0.08, M(0x1a1a1a)); monitori.position.set(6.6, 2.0, -5.7); scene.add(monitori);
    const ekgTx = kayraTekstuuri("#51cf66", 3); ekgTx.wrapS = THREE.RepeatWrapping;
    const ekg = taso(0.64, 0.44, ekgTx); ekg.position.set(6.6, 2.0, -5.65); scene.add(ekg);
    const tuoli = laatikko(0.55, 0.5, 0.55, M(0x3f7f86)); tuoli.position.set(5.8, 0.25, -1.4); scene.add(tuoli);

    /* ---- 5. Lääkehuone ---- */
    const hyllyt = new THREE.Group();
    for (let r = 0; r < 4; r++) { const h = laatikko(4.6, 0.05, 0.5, M(0xf0f0f0)); h.position.set(0, 0.9 + r * 0.55, 0); hyllyt.add(h);
      for (let i = 0; i < 14; i++) { const v = [0xff6b6b, 0x4dabf7, 0xffd43b, 0x69db7c, 0xffffff, 0xb197fc][(i * 7 + r * 3) % 6]; const b = laatikko(0.22 + (i % 3) * 0.05, 0.3, 0.3, M(v)); b.position.set(-2.1 + i * 0.31, 1.08 + r * 0.55, 0); hyllyt.add(b); } }
    hyllyt.position.set(15.9, -0.2, -5.5); scene.add(hyllyt);
    poyta(18, -1.6, 3.4, 1.0);
    const lnaytto = laatikko(0.9, 0.55, 0.05, M(0x1a1a1a)); lnaytto.position.set(17.2, 1.4, -1.85); scene.add(lnaytto);
    const lista = taso(0.84, 0.5, kuvaTx((x, w, h) => { x.fillStyle = "#f8f9fa"; x.fillRect(0, 0, w, h); x.fillStyle = "#212529"; x.font = "bold 20px sans-serif"; x.fillText("Elli K. · lääkelista", 12, 28);
      x.font = "17px sans-serif"; ["Verenohennus", "Verenpaine", "D-vitamiini", "Kipulääke ?"].forEach((t, i) => { x.fillStyle = i === 3 ? "#c92a2a" : "#495057"; x.fillText("• " + t, 16, 62 + i * 26); });
      x.fillStyle = "#ffe066"; x.fillRect(w - 46, 112, 30, 30); x.fillStyle = "#212529"; x.font = "bold 24px sans-serif"; x.fillText("!", w - 35, 136); }, 256, 160));
    lista.position.set(17.2, 1.4, -1.82); scene.add(lista);
    const dosetti = laatikko(0.5, 0.06, 0.25, M(0x74c0fc)); dosetti.position.set(18.6, 0.99, -1.4); scene.add(dosetti);
    const pillerit = []; for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M([0xffffff, 0xffa94d][i % 2])); p.position.set(18.42 + i * 0.12, 1.04, -1.4); scene.add(p); pillerit.push(p); }
    const oskari = hahmo(0x7a5aa6, 17.6, -0.6, Math.PI, { takki: true, hius: 0xe0c070 });

    /* ---- 6. Osasto ---- */
    sanky(26.2, -3.6, 0, 0.72);
    const elli = makaava(26.2, 0.8, -3.6, 0, 0xf4a6b5);
    const istuva = new THREE.Group(); const ik2 = sylinteri(0.25, 0.3, 0.8, M(0xf4a6b5), 12); ik2.position.y = 0.4; istuva.add(ik2);
    const ip = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), M(V.iho)); ip.position.y = 1.0; istuva.add(ip);
    const ih = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd9d9d9)); ih.position.y = 1.04; istuva.add(ih);
    istuva.position.set(26.75, 0.82, -3.2); istuva.rotation.y = Math.PI / 2; istuva.visible = false; scene.add(istuva);
    const rollaattori = new THREE.Group();
    [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([a, b]) => { const j = sylinteri(0.02, 0.02, 0.85, M(0xc92a2a, { metalness: 0.4 }), 6); j.position.set(a, 0.45, b); rollaattori.add(j);
      const r = sylinteri(0.08, 0.08, 0.04, M(0x222222), 10); r.rotation.z = Math.PI / 2; r.position.set(a, 0.08, b); rollaattori.add(r); });
    const ko = laatikko(0.55, 0.04, 0.4, M(0x333333)); ko.position.y = 0.55; rollaattori.add(ko);
    rollaattori.position.set(27.6, 0, -2.0); scene.add(rollaattori);
    const tippa = new THREE.Group(); const tt = sylinteri(0.02, 0.02, 2.0, M(0xbfc9cd, { metalness: 0.6 }), 6); tt.position.y = 1.0; tippa.add(tt);
    const pussi = laatikko(0.22, 0.32, 0.06, M(0xe7f5ff, { transparent: true, opacity: 0.8 })); pussi.position.set(0.12, 1.85, 0); tippa.add(pussi);
    tippa.position.set(25.1, 0, -4.4); scene.add(tippa);
    const yolamppu = new THREE.PointLight(0xffc078, 0, 6, 1.6); yolamppu.position.set(25.2, 1.4, -4.8); scene.add(yolamppu);
    const ylv = laatikko(0.3, 0.2, 0.15, hehku(0xffc078, 0.2)); ylv.position.set(25.2, 1.4, -5.75); scene.add(ylv);
    const iida = hahmo(0x2a9d8f, 27.8, -3.1, -1.4, { hius: 0x8a5a2b, housut: 0x1d3557 });
    hahmo(V.hoito, 30.6, -2.2, -1.2, { hius: 0x111111 });

    /* Käytävällä liikkuvat hoitajat */
    const kulkijat = [hahmo(V.hoito, -6, 2.6, Math.PI / 2, { hius: 0x6b4423 }), hahmo(0x2a9d8f, 14, 3.0, -Math.PI / 2, { hius: 0x2b2b2b })];
    kulkijat.forEach((k, i) => { k.userData.x0 = k.position.x; k.userData.s = i ? -1 : 1; });

    const tila = { ilta: 0, vilkut: false, nousu: false };
    const paivaTausta = new THREE.Color(V.tausta), iltaTausta = new THREE.Color(0x26324a);
    const ikkPaiva = new THREE.Color(0xffd6a8), ikkIlta = new THREE.Color(0x3a4a78);
    function asetaTila(t) {
      tila.ilta = t.ilta || 0; tila.vilkut = !!t.vilkut; tila.nousu = !!t.nousu;
      const i = tila.ilta;
      scene.background.copy(paivaTausta).lerp(iltaTausta, i * 0.75); scene.fog.color.copy(scene.background);
      ikkunaMat.color.copy(ikkPaiva).lerp(ikkIlta, i);
      hemi.intensity = 1.35 - i * 0.45; aur.intensity = 1.1 - i * 0.8; aur.color.set(i > 0.5 ? 0xb8c4ff : 0xffe2c0);
      valoMat.emissiveIntensity = 0.6 + i * 1.2; kattoValot.forEach((l) => { l.intensity = i * 6; });
      yolamppu.intensity = i > 0.7 ? 5 : 0; ylv.material.emissiveIntensity = i > 0.7 ? 1.6 : 0.2;
      elli.visible = !tila.nousu; istuva.visible = tila.nousu; iida.position.x = tila.nousu ? 27.4 : 27.8;
      ambValo.intensity = 0;
    }
    function paivita(dt, t) {
      const vilk = tila.vilkut && Math.floor(t * 4) % 2 === 0;
      vilkut.forEach((v, i) => { v.material.emissiveIntensity = tila.vilkut ? ((Math.floor(t * 4) + i) % 2 ? 2.2 : 0.2) : 0.3; });
      ambValo.intensity = vilk ? 6 : 0;
      roottori.rotation.y = t * 9;
      anValo.material.emissiveIntensity = Math.floor(t * 1.5) % 2 ? 1.8 : 0.3;
      putket[1].position.y = 1.33 + Math.max(0, Math.sin(t * 1.4)) * 0.05;
      putki.position.x = 0.5 + Math.sin(t * 0.5) * 0.08; valokeila.position.x = putki.position.x; kollimaattori.material.emissiveIntensity = 0.3 + (Math.sin(t * 2) + 1) * 0.3;
      ekgTx.offset.x = (t * 0.15) % 1;
      pillerit.forEach((p, i) => { p.position.y = 1.04 + Math.max(0, Math.sin(t * 2 + i)) * 0.03; });
      pussi.position.y = 1.85 + Math.sin(t * 0.8) * 0.01;
      kulkijat.forEach((k, i) => { const s = Math.sin(t * 0.25 + i * 2); k.position.x = k.userData.x0 + s * 4; k.rotation.y = Math.cos(t * 0.25 + i * 2) > 0 ? Math.PI / 2 : -Math.PI / 2; });
      hahmot.forEach((h) => { h.userData.paa.position.y = 1.74 + Math.sin(t * 1.5 + h.userData.v) * 0.015; h.userData.hi.position.y = h.userData.paa.position.y + 0.04; });
    }
    const kohtaukset = {
      kansi:       { kamera: [-9, 11, 21],     kohde: [-1, 0.5, -2],     tila: { ilta: 0, vilkut: true } },
      ilta:        { kamera: [-11, 4.5, 15],   kohde: [-21, 1.5, -2],    tila: { ilta: 0 } },
      ambulanssi:  { kamera: [-17.2, 2.8, 8.5], kohde: [-21.5, 1.2, -1], tila: { ilta: 0.1, vilkut: true } },
      laboratorio: { kamera: [-7.2, 2.5, 3.2], kohde: [-10.2, 1.1, -4],  tila: { ilta: 0.3 } },
      rontgen:     { kamera: [2.6, 2.8, 3.6],  kohde: [-0.4, 1.3, -3],  tila: { ilta: 0.45 } },
      tutkimus:    { kamera: [10.8, 2.6, 3.4], kohde: [7.6, 1.2, -3],   tila: { ilta: 0.6 } },
      laakehuone:  { kamera: [20.2, 2.5, 2.8], kohde: [17.2, 1.4, -3.6], tila: { ilta: 0.75 } },
      osasto:      { kamera: [29.4, 2.5, 3.2], kohde: [26, 1.0, -3.4],  tila: { ilta: 0.9 } },
      osastoNousu: { kamera: [29.4, 2.5, 3.2], kohde: [26, 1.0, -3.4],  tila: { ilta: 0.9, nousu: true } },
      loppu:       { kamera: [3, 13, 24],      kohde: [3, 0.5, -2],     tila: { ilta: 1, nousu: true } }
    };
    return { kohtaukset, oletus: "ilta", asetaTila, paivita };
  },

  hoitola(scene) {
    const V = { seina: 0xf3e3df, salvia: 0xb7c9b0, roosa: 0xe9b7b0, kerma: 0xfaf4ee, puu: 0xc49a74, kulta: 0xd4b06a };
    scene.background = new THREE.Color(0xf6ebe6);
    scene.fog = new THREE.Fog(0xf6ebe6, 30, 70);
    const hemi = new THREE.HemisphereLight(0xfff4ec, 0xd8c2b8, 1.25); scene.add(hemi);
    const aur = new THREE.DirectionalLight(0xfff0e0, 0.8); aur.position.set(8, 14, 10); scene.add(aur);
    const lamput = [];
    function valo(x, y, z, v, i) { const l = new THREE.PointLight(v || 0xffd9a8, i || 8, 12); l.position.set(x, y, z); scene.add(l); lamput.push(l); return l; }

    /* Lattia ja seinät */
    const lattia = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), mat(0xd9c0a4, { roughness: 0.7, metalness: 0 })); lattia.rotation.x = -Math.PI / 2; scene.add(lattia);
    for (let x = -14.5; x < 15; x += 1) { const r = laatikko(0.02, 0.005, 22, mat(0xc8ab8c, { metalness: 0 })); r.position.set(x, 0.003, 0); scene.add(r); }
    const seinaMat = mat(V.seina, { roughness: 0.95, metalness: 0 });
    const takaseina = laatikko(30, 6, 0.3, seinaMat); takaseina.position.set(0, 3, -11); scene.add(takaseina);
    const vasen = laatikko(0.3, 6, 22, seinaMat); vasen.position.set(-15, 3, 0); scene.add(vasen);
    const oikea = laatikko(0.3, 6, 22, mat(V.salvia, { roughness: 0.95, metalness: 0 })); oikea.position.set(15, 3, 0); scene.add(oikea);
    /* Väliseinä hoitohuoneeseen (oikealla takana) */
    const valiseina = laatikko(0.2, 4, 7, mat(V.kerma, { metalness: 0 })); valiseina.position.set(6, 2, -7.5); scene.add(valiseina);

    /* Kyltti */
    const nimiKyltti = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["Hoitola Helmi"], "#a8606a", "#faf4ee", 1024, 150), transparent: true }));
    nimiKyltti.position.set(-6, 4.6, -10.84); scene.add(nimiKyltti);
    const neonC = document.createElement("canvas"); neonC.width = 256; neonC.height = 96; const neonTx = new THREE.CanvasTexture(neonC); neonTx.colorSpace = THREE.SRGBColorSpace;
    function piirraNeon(t) { const g = neonC.getContext("2d"); g.clearRect(0, 0, 256, 96); g.shadowColor = "#ff7aa8"; g.shadowBlur = 18; g.fillStyle = "#ffd6e6"; g.font = "bold 58px 'Segoe UI', Arial"; g.textAlign = "center"; g.fillText(t, 128, 66); neonTx.needsUpdate = true; }
    piirraNeon("AUKI");
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.75), new THREE.MeshBasicMaterial({ map: neonTx, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); neon.position.set(-1, 4.6, -10.82); scene.add(neon);

    /* Vastaanottotiski */
    const tiski = new THREE.Group();
    const runko = laatikko(4, 1.1, 1.1, mat(V.kerma, { metalness: 0 })); runko.position.y = 0.55; tiski.add(runko);
    const kansi = laatikko(4.2, 0.08, 1.3, mat(V.kulta, { metalness: 0.6, roughness: 0.35 })); kansi.position.y = 1.14; tiski.add(kansi);
    const naytto = laatikko(0.7, 0.45, 0.04, mat(0x222222)); naytto.position.set(-0.8, 1.45, -0.2); tiski.add(naytto);
    const puhelin = laatikko(0.18, 0.02, 0.34, mat(0x333333)); puhelin.position.set(0.6, 1.19, 0.1); tiski.add(puhelin);
    const puhNaytto = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.3), hehku(0xff9ec0, 1.5)); puhNaytto.rotation.x = -Math.PI / 2; puhNaytto.position.set(0.6, 1.205, 0.1); tiski.add(puhNaytto);
    const kukat = new THREE.Group(); const maljakko = sylinteri(0.12, 0.09, 0.35, mat(0xffffff), 12); maljakko.position.y = 0.17; kukat.add(maljakko);
    for (let i = 0; i < 7; i++) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat([0xf4a7b9, 0xffffff, 0xe98ca0][i % 3], { metalness: 0 })); k.position.set(Math.sin(i) * 0.15, 0.45 + Math.random() * 0.15, Math.cos(i) * 0.15); kukat.add(k); }
    kukat.position.set(1.5, 1.18, -0.2); tiski.add(kukat);
    tiski.position.set(-4, 0, -4); scene.add(tiski);

    /* Aula: nojatuoli, pampasruoho, matto */
    const tuoli = new THREE.Group();
    const istuin = laatikko(1.3, 0.45, 1.1, mat(0xffffff, { roughness: 0.6, metalness: 0 })); istuin.position.y = 0.45; tuoli.add(istuin);
    const selka = laatikko(1.3, 0.9, 0.25, mat(0xffffff, { roughness: 0.6, metalness: 0 })); selka.position.set(0, 0.9, -0.45); tuoli.add(selka);
    [-0.6, 0.6].forEach((x) => { const k = laatikko(0.2, 0.6, 1.1, mat(0xffffff, { roughness: 0.6, metalness: 0 })); k.position.set(x, 0.7, 0); tuoli.add(k); });
    const tyyny = laatikko(0.7, 0.55, 0.18, mat(V.roosa, { metalness: 0 })); tyyny.position.set(0, 0.95, -0.25); tyyny.rotation.x = -0.2; tuoli.add(tyyny);
    tuoli.position.set(-11, 0, -2); tuoli.rotation.y = 0.6; scene.add(tuoli);
    const matto = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), mat(0xeee4da, { roughness: 1, metalness: 0 })); matto.rotation.x = -Math.PI / 2; matto.position.set(-10.5, 0.01, -1.5); scene.add(matto);
    function pampas(x, z) {
      const g = new THREE.Group(); const m = sylinteri(0.22, 0.16, 0.7, mat(0xffffff), 12); m.position.y = 0.35; g.add(m);
      for (let i = 0; i < 9; i++) {
        const v = sylinteri(0.008, 0.008, 1.6, mat(0xb89a7a, { metalness: 0 }), 4); const a = (i / 9) * Math.PI * 2;
        const kulma = 0.25 + Math.random() * 0.2; v.position.set(Math.sin(a) * 0.35, 1.45, Math.cos(a) * 0.35); v.rotation.set(Math.cos(a) * kulma, 0, -Math.sin(a) * kulma); g.add(v);
        const tupsu = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0xe2cdb2, { roughness: 1, metalness: 0 })); tupsu.scale.set(0.8, 2.4, 0.8);
        tupsu.position.set(Math.sin(a) * 0.62, 2.35, Math.cos(a) * 0.62); tupsu.rotation.copy(v.rotation); g.add(tupsu);
      }
      g.position.set(x, 0, z); scene.add(g); return g;
    }
    pampas(-13.2, -3.5); pampas(4, -4.5);
    const kehys = laatikko(2.2, 1.6, 0.06, mat(V.kulta, { metalness: 0.6, roughness: 0.3 })); kehys.position.set(-11, 2.8, -10.8); scene.add(kehys);
    const peili = laatikko(2, 1.4, 0.07, mat(0xdfe8ee, { metalness: 0.9, roughness: 0.05 })); peili.position.set(-11, 2.8, -10.76); scene.add(peili);

    /* Kampaamo: kolme peilipaikkaa vasemmalla seinällä */
    const kampaamo = [];
    for (let i = 0; i < 3; i++) {
      const z = -6 + i * 3.4;
      const p = laatikko(0.06, 1.8, 1.2, mat(0xdfe8ee, { metalness: 0.9, roughness: 0.05 })); p.position.set(-14.8, 2.3, z); scene.add(p);
      const pk = laatikko(0.04, 2, 1.4, mat(V.kulta, { metalness: 0.6, roughness: 0.3 })); pk.position.set(-14.83, 2.3, z); scene.add(pk);
      const hylly = laatikko(0.5, 0.06, 1.3, mat(V.kerma)); hylly.position.set(-14.6, 1.1, z); scene.add(hylly);
      const t = new THREE.Group();
      const ist = sylinteri(0.45, 0.45, 0.2, mat(0x2b2b2b, { roughness: 0.4, metalness: 0.2 }), 16); ist.position.y = 0.7; t.add(ist);
      const sel = laatikko(0.8, 0.8, 0.15, mat(0x2b2b2b, { roughness: 0.4, metalness: 0.2 })); sel.position.set(0, 1.15, 0.38); t.add(sel);
      const jalka = sylinteri(0.06, 0.35, 0.6, mat(0xcccccc, { metalness: 0.8, roughness: 0.3 }), 12); jalka.position.y = 0.3; t.add(jalka);
      t.position.set(-13.4, 0, z); t.rotation.y = -Math.PI / 2; scene.add(t); kampaamo.push(t);
      valo(-14, 3.2, z, 0xfff1e0, 3);
    }
    const asiakas = new THREE.Group(); const ak = sylinteri(0.26, 0.3, 0.8, mat(0x6a8caf, { metalness: 0 }), 10); ak.position.y = 1.2; asiakas.add(ak);
    const ap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(0xe8c3a0, { metalness: 0 })); ap.position.y = 1.85; asiakas.add(ap);
    const hiukset = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), mat(0x3a2418, { metalness: 0 })); hiukset.position.y = 1.9; asiakas.add(hiukset);
    asiakas.position.set(-13.4, 0, -2.6); scene.add(asiakas);
    const kampaaja = new THREE.Group(); const kk = sylinteri(0.25, 0.3, 0.95, mat(0x2b2b2b, { metalness: 0 }), 10); kk.position.y = 1.05; kampaaja.add(kk);
    const kp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0xd9a888, { metalness: 0 })); kp.position.y = 1.75; kampaaja.add(kp);
    kampaaja.position.set(-12.4, 0, -2.2); scene.add(kampaaja);

    /* Hoitohuone: hoitosänky, pyyhkeet, kynttilät, tuotehylly */
    const sanky = new THREE.Group();
    const sR = laatikko(2.2, 0.7, 0.85, mat(0xffffff, { metalness: 0 })); sR.position.y = 0.6; sanky.add(sR);
    const pyyhe = laatikko(2.0, 0.08, 0.9, mat(0xd8d0c8, { roughness: 1, metalness: 0 })); pyyhe.position.y = 0.99; sanky.add(pyyhe);
    const potilas = new THREE.Group(); const pk2 = sylinteri(0.25, 0.28, 1.4, mat(0xf2ece6, { roughness: 1, metalness: 0 }), 10); pk2.rotation.z = Math.PI / 2; pk2.position.set(0.1, 1.2, 0); potilas.add(pk2);
    const pp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0xf0d8c8, { metalness: 0 })); pp.position.set(-0.85, 1.2, 0); potilas.add(pp);
    const nauha = sylinteri(0.205, 0.205, 0.1, mat(0xffffff, { metalness: 0 }), 12); nauha.rotation.z = Math.PI / 2; nauha.position.set(-0.95, 1.22, 0); potilas.add(nauha);
    sanky.add(potilas);
    sanky.position.set(10, 0, -8); scene.add(sanky);
    const hoitaja = new THREE.Group(); const hk = sylinteri(0.25, 0.3, 0.95, mat(0xb7c9b0, { metalness: 0 }), 10); hk.position.y = 1.05; hoitaja.add(hk);
    const hp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0xe8c3a0, { metalness: 0 })); hp.position.y = 1.75; hoitaja.add(hp);
    hoitaja.position.set(8.4, 0, -8); scene.add(hoitaja);
    const hylly2 = laatikko(2.6, 0.06, 0.5, mat(V.kerma)); hylly2.position.set(11, 1.6, -10.6); scene.add(hylly2);
    const hylly3 = hylly2.clone(); hylly3.position.y = 2.4; scene.add(hylly3);
    const pullot = [];
    for (let i = 0; i < 12; i++) {
      const b = sylinteri(0.08, 0.1, 0.32 + (i % 3) * 0.08, mat([0xf4c7c3, 0xffffff, 0xc9a26a, 0xb7c9b0][i % 4], { roughness: 0.3, metalness: 0.1 }), 10);
      b.position.set(9.9 + (i % 6) * 0.42, i < 6 ? 1.82 : 2.62, -10.55); scene.add(b); pullot.push(b);
    }
    const kynttilat = [];
    [[11.7, -9.6], [12.1, -9.4], [11.9, -9.9]].forEach(([x, z], i) => {
      const k = sylinteri(0.12, 0.12, 0.3 + i * 0.12, mat(0xfff2dc, { metalness: 0 }), 12); k.position.set(x, 1.05 + (0.15 + i * 0.06), z); scene.add(k);
      const liekki = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), hehku(0xffb24a, 3)); liekki.scale.y = 1.8; liekki.position.set(x, 1.05 + 0.32 + i * 0.12 + 0.06, z); scene.add(liekki); kynttilat.push(liekki);
    });
    const poyta = laatikko(1.4, 0.06, 0.8, mat(V.puu, { metalness: 0 })); poyta.position.set(11.9, 1.0, -9.6); scene.add(poyta);
    const poytaJ = laatikko(1.2, 1, 0.6, mat(V.kerma, { metalness: 0 })); poytaJ.position.set(11.9, 0.5, -9.6); scene.add(poytaJ);
    const kynValo = valo(11.9, 1.8, -9.4, 0xffc27a, 6);
    for (let i = 0; i < 3; i++) { const p = sylinteri(0.14, 0.14, 0.5, mat(0x7a6a60, { roughness: 1, metalness: 0 }), 12); p.rotation.z = Math.PI / 2; p.position.set(12.3, 1.1 + i * 0.0, -10.2 + i * 0.3); scene.add(p); }
    /* Valosarja verholla */
    const valosarja = [];
    for (let i = 0; i < 40; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), hehku(0xffe2a8, 2.5)); l.position.set(7.5 + Math.random() * 7, 2.6 + Math.random() * 2.2, -10.75); scene.add(l); valosarja.push(l); }

    /* Välinehuolto: desinfiointikaappi ja työtaso */
    const vh = new THREE.Group();
    const taso = laatikko(2.4, 0.95, 0.8, mat(0xffffff, { metalness: 0 })); taso.position.y = 0.475; vh.add(taso);
    const kaappi = laatikko(0.9, 0.7, 0.6, mat(0xe8ecef, { metalness: 0.5, roughness: 0.3 })); kaappi.position.set(-0.6, 1.3, 0); vh.add(kaappi);
    const uv = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), hehku(0x8a7bff, 2.2)); uv.position.set(-0.6, 1.3, 0.31); vh.add(uv);
    const allas = laatikko(0.7, 0.06, 0.5, mat(0xcfd6dc, { metalness: 0.8, roughness: 0.2 })); allas.position.set(0.6, 0.96, 0); vh.add(allas);
    for (let i = 0; i < 4; i++) { const v = laatikko(0.04, 0.02, 0.25, mat(0xaab4bc, { metalness: 0.9, roughness: 0.2 })); v.position.set(0.3 + i * 0.12, 1.0, 0.1); vh.add(v); }
    const pumppu = sylinteri(0.06, 0.07, 0.25, mat(0x6aa0d0, { metalness: 0 }), 10); pumppu.position.set(1.05, 1.08, -0.15); vh.add(pumppu);
    vh.position.set(13.8, 0, 1); vh.rotation.y = -Math.PI / 2; scene.add(vh);

    /* Hieronta: toinen sänky salvianvihreän seinän vieressä */
    const sanky2 = sanky.clone(); sanky2.position.set(11.5, 0, -3.6); sanky2.rotation.y = Math.PI / 2; scene.add(sanky2);
    const hieroja = hoitaja.clone(); hieroja.position.set(10.5, 0, -3.6); scene.add(hieroja);

    /* Ruusun terälehdet (loppu) */
    const lehdet = hiukkaset(260, 0xffb6c8, 0.16);
    for (let i = 0; i < 260; i++) { lehdet.pos.set([-12 + Math.random() * 24, Math.random() * 6, -9 + Math.random() * 16], i * 3); lehdet.nopeus[i] = 0.3 + Math.random() * 0.5; }
    lehdet.points.material.blending = THREE.NormalBlending; lehdet.points.material.opacity = 0.9; lehdet.points.visible = false; scene.add(lehdet.points);

    const tila = { tila: "paiva" };
    function asetaTila(t) {
      tila.tila = t.tila || "paiva";
      const ilta = tila.tila === "loppu";
      lehdet.points.visible = ilta;
      hemi.intensity = ilta ? 0.75 : 1.25; aur.intensity = ilta ? 0.2 : 0.8;
      scene.background.set(ilta ? 0xd8bfc0 : 0xf6ebe6); scene.fog.color.set(ilta ? 0xd8bfc0 : 0xf6ebe6);
      piirraNeon(ilta ? "KIITOS!" : "AUKI");
    }
    function paivita(dt, t) {
      kynttilat.forEach((k, i) => { k.material.emissiveIntensity = 2.5 + Math.sin(t * 9 + i * 2) * 0.6 + Math.sin(t * 23 + i) * 0.3; });
      kynValo.intensity = 5.5 + Math.sin(t * 9) * 0.6;
      valosarja.forEach((l, i) => { l.material.emissiveIntensity = 2 + Math.sin(t * 1.5 + i) * 0.8; });
      kampaaja.position.x = -12.4 + Math.sin(t * 0.8) * 0.15; kampaaja.rotation.y = Math.sin(t * 0.6) * 0.4;
      hoitaja.rotation.y = Math.sin(t * 0.5) * 0.3; hieroja.position.y = Math.abs(Math.sin(t * 1.6)) * 0.03;
      neon.material.opacity = 0.85 + Math.sin(t * 2) * 0.1;
      if (lehdet.points.visible) {
        for (let i = 0; i < 260; i++) { let y = lehdet.pos[i * 3 + 1] - lehdet.nopeus[i] * dt; if (y < 0) y = 6; lehdet.pos[i * 3 + 1] = y; lehdet.pos[i * 3] += Math.sin(t + i) * dt * 0.3; }
        lehdet.points.geometry.attributes.position.needsUpdate = true;
      }
    }
    const kohtaukset = {
      kansi:     { kamera: [0, 3.2, 9],     kohde: [-2, 2, -6],     tila: {} },
      aula:      { kamera: [2, 4.5, 10],    kohde: [-3, 1.5, -5],   tila: {} },
      valineet:  { kamera: [10.5, 2.3, 1.2], kohde: [13.8, 1.1, 1], tila: {} },
      kampaamo:  { kamera: [-10, 2.4, 0.5], kohde: [-14, 1.6, -3],  tila: {} },
      hoitohuone:{ kamera: [7.5, 2.6, -3.5], kohde: [10.5, 1.2, -9], tila: {} },
      hieronta:  { kamera: [8, 2.4, 0.5],   kohde: [11.5, 1, -3.6], tila: {} },
      tiski:     { kamera: [-3, 2.4, -1.2], kohde: [-4, 1.2, -4.5], tila: {} },
      esittely:  { kamera: [9.5, 2.2, -7.2], kohde: [11, 2, -10.6], tila: {} },
      loppu:     { kamera: [0, 3, 8],       kohde: [-2, 2.2, -8],   tila: { tila: "loppu" } }
    };
    return { kohtaukset, oletus: "aula", asetaTila, paivita };
  },

  festari(scene) {
    const V = { taivas: 0x2a2350, hamara: 0xff9a6b, valo: 0xffd98a, pinkki: 0xff5fa2, turkoosi: 0x3ddbd9, violetti: 0x8b5cf6 };
    scene.background = new THREE.Color(V.taivas);
    scene.fog = new THREE.Fog(0x4a3a6a, 30, 120);
    const hemi = new THREE.HemisphereLight(0xffc8b0, 0x22304a, 1.05); scene.add(hemi);
    const aurinko = new THREE.DirectionalLight(0xffb27a, 1.0); aurinko.position.set(-30, 12, -40); scene.add(aurinko);

    /* Taivaan liukuväri (iso pallo) */
    const taivasC = document.createElement("canvas"); taivasC.width = 16; taivasC.height = 256;
    const tg = taivasC.getContext("2d"), gr = tg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#1d1a45"); gr.addColorStop(0.45, "#5b3a7a"); gr.addColorStop(0.62, "#e07a6a"); gr.addColorStop(0.72, "#ffb27a"); gr.addColorStop(1, "#ffb27a");
    tg.fillStyle = gr; tg.fillRect(0, 0, 16, 256);
    const taivasTx = new THREE.CanvasTexture(taivasC); taivasTx.colorSpace = THREE.SRGBColorSpace;
    const taivas = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 16), new THREE.MeshBasicMaterial({ map: taivasTx, side: THREE.BackSide, fog: false }));
    scene.add(taivas);

    /* Maa ja järvi */
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), mat(0x3f6b3a, { roughness: 1, metalness: 0 })); maa.rotation.x = -Math.PI / 2; maa.position.z = 30; scene.add(maa);
    const jarvi = new THREE.Mesh(new THREE.PlaneGeometry(260, 120), new THREE.MeshStandardMaterial({ color: 0x6a5a8a, roughness: 0.25, metalness: 0.6 }));
    jarvi.rotation.x = -Math.PI / 2; jarvi.position.set(0, -0.05, -60); scene.add(jarvi);
    const ranta = new THREE.Mesh(new THREE.PlaneGeometry(200, 3), mat(0xc9b28a, { roughness: 1, metalness: 0 })); ranta.rotation.x = -Math.PI / 2; ranta.position.set(0, 0.01, -1); scene.add(ranta);
    /* Saaret horisontissa */
    [[-60, -95, 14], [-20, -100, 10], [40, -92, 18], [80, -98, 12]].forEach(([x, z, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1d2a2a, { roughness: 1, metalness: 0 })); s.scale.y = 0.25; s.position.set(x, 0, z); scene.add(s);
    });
    const heijastus = new THREE.Mesh(new THREE.PlaneGeometry(14, 60), new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
    heijastus.rotation.x = -Math.PI / 2; heijastus.position.set(-20, 0.02, -50); scene.add(heijastus);

    /* Puut */
    const runkoMat = mat(0x4a3324, { metalness: 0, roughness: 1 }), latvaMat = [mat(0x1f4a2e, { metalness: 0, roughness: 1 }), mat(0x2b5a33, { metalness: 0, roughness: 1 })];
    function puu(x, z, k) {
      const g = new THREE.Group(); const s = k || 1;
      const r = sylinteri(0.25 * s, 0.35 * s, 3 * s, runkoMat, 8); r.position.y = 1.5 * s; g.add(r);
      const l = new THREE.Mesh(new THREE.SphereGeometry(2.2 * s, 10, 8), latvaMat[Math.floor(Math.random() * 2)]); l.position.y = 4.5 * s; l.scale.y = 1.3; g.add(l);
      g.position.set(x, 0, z); scene.add(g);
    }
    for (let i = 0; i < 26; i++) { const x = -60 + Math.random() * 120, z = 18 + Math.random() * 30; if (Math.abs(x) < 8 && z < 30) continue; puu(x, z, 0.9 + Math.random() * 0.8); }
    [[-34, 4], [-30, 10], [34, 6], [38, 12], [-14, 22], [16, 24]].forEach(([x, z]) => puu(x, z, 1.4));

    /* Valoköynnökset */
    const lamput = [];
    function koynnos(a, b, n, roikku) {
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t, y = a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * roikku;
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), hehku(V.valo, 2.4)); l.position.set(x, y, z); scene.add(l); lamput.push(l);
      }
      [a, b].forEach((p) => { const t = sylinteri(0.06, 0.06, p[1], mat(0x333333), 6); t.position.set(p[0], p[1] / 2, p[2]); scene.add(t); });
    }
    /* Markkinakatu (oikealla) */
    for (let i = 0; i < 4; i++) koynnos([8 + i * 5, 4, 10], [8 + i * 5 + 5, 4, 10], 12, 0.8);
    for (let i = 0; i < 4; i++) koynnos([8 + i * 5, 4, 15], [8 + i * 5 + 5, 4, 15], 12, 0.8);
    koynnos([-12, 4.5, 6], [6, 4.5, 6], 30, 1.2);

    /* Kojut */
    const kojuVarit = [0xd94860, 0xf2a541, 0x3b8fd9, 0x2f9e6e, 0xb15dd1, 0xf08aa0];
    function koju(x, z, v, ry) {
      const g = new THREE.Group();
      const poyta = laatikko(2.4, 0.9, 1.2, mat(0x8a6a4a, { metalness: 0 })); poyta.position.y = 0.45; g.add(poyta);
      const katto = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.2, 4), mat(v, { metalness: 0, roughness: 0.8 })); katto.rotation.y = Math.PI / 4; katto.position.y = 2.9; g.add(katto);
      [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]].forEach(([a, b]) => { const t = sylinteri(0.04, 0.04, 2.4, mat(0xdddddd), 6); t.position.set(a, 1.2, b); g.add(t); });
      for (let i = 0; i < 5; i++) { const tuote = laatikko(0.25, 0.25 + Math.random() * 0.3, 0.25, mat(kojuVarit[(i + 2) % 6], { metalness: 0 })); tuote.position.set(-0.9 + i * 0.45, 1.0, 0); g.add(tuote); }
      g.position.set(x, 0, z); g.rotation.y = ry || 0; scene.add(g);
    }
    for (let i = 0; i < 4; i++) { koju(10.5 + i * 5, 8.2, kojuVarit[i], 0); koju(10.5 + i * 5, 16.8, kojuVarit[(i + 3) % 6], Math.PI); }

    /* Päälava rannalla */
    const lava = new THREE.Group();
    const lattia = laatikko(14, 1.2, 7, mat(0x22222a)); lattia.position.y = 0.6; lava.add(lattia);
    const takaseina = laatikko(14, 7, 0.3, mat(0x15151c)); takaseina.position.set(0, 4.7, -3.4); lava.add(takaseina);
    const lavaKatto = laatikko(15, 0.4, 8, mat(0x2a2a33)); lavaKatto.position.y = 8.3; lava.add(lavaKatto);
    [[-7, -3.6], [7, -3.6], [-7, 3.6], [7, 3.6]].forEach(([x, z]) => { const p = laatikko(0.4, 8, 0.4, mat(0x8a93a8, { metalness: 0.8, roughness: 0.3 })); p.position.set(x, 4.2, z); lava.add(p); });
    const nayttoC = document.createElement("canvas"); nayttoC.width = 512; nayttoC.height = 256; const nayttoTx = new THREE.CanvasTexture(nayttoC); nayttoTx.colorSpace = THREE.SRGBColorSpace;
    function piirraNaytto(t) {
      const g = nayttoC.getContext("2d"), gg = g.createLinearGradient(0, 0, 512, 256);
      gg.addColorStop(0, "#ff5fa2"); gg.addColorStop(0.5, "#8b5cf6"); gg.addColorStop(1, "#3ddbd9");
      g.fillStyle = gg; g.fillRect(0, 0, 512, 256);
      g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "bold 58px 'Segoe UI', Arial"; g.fillText(t[0], 256, 118); g.font = "bold 34px 'Segoe UI', Arial"; g.fillText(t[1], 256, 178);
      nayttoTx.needsUpdate = true;
    }
    piirraNaytto(["KESÄYÖN FESTARIT", "RANTALAVA"]);
    const naytto = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map: nayttoTx })); naytto.position.set(0, 4.6, -3.2); lava.add(naytto);
    [-6, 6].forEach((x) => { const k = laatikko(1.4, 2.6, 1.2, mat(0x111111)); k.position.set(x, 2.5, 2.4); lava.add(k); });
    const bandi = [];
    [[-3, 0xff5fa2], [0, 0xffd98a], [3, 0x3ddbd9]].forEach(([x, v]) => {
      const g = new THREE.Group(); const keho = sylinteri(0.26, 0.3, 0.9, mat(v, { metalness: 0 }), 10); keho.position.y = 2.25; g.add(keho);
      const paa = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(0xe8c3a0, { metalness: 0 })); paa.position.y = 2.95; g.add(paa);
      g.position.set(x, 0, 0); lava.add(g); bandi.push(g);
    });
    const keilat = [];
    [0xff5fa2, 0x3ddbd9, 0xffd98a, 0x8b5cf6].forEach((v, i) => {
      const k = new THREE.Mesh(new THREE.ConeGeometry(1.4, 8, 16, 1, true), new THREE.MeshBasicMaterial({ color: v, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      k.geometry.translate(0, -4, 0); const g = new THREE.Group(); g.add(k); g.position.set(-5 + i * 3.3, 8, 1.5); g.userData.v = i; lava.add(g); keilat.push(g);
    });
    lava.position.set(-6, 0, 0); scene.add(lava);

    /* Pelitelta (vasemmalla) */
    const telta = new THREE.Group();
    const teltta = laatikko(10, 4, 7, new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.9, transparent: true, opacity: 0.92 })); teltta.position.y = 2; telta.add(teltta);
    const teltanKatto = new THREE.Mesh(new THREE.ConeGeometry(7, 2.4, 4), mat(0xf4f6fa, { metalness: 0 })); teltanKatto.rotation.y = Math.PI / 4; teltanKatto.scale.z = 0.7; teltanKatto.position.y = 5.2; telta.add(teltanKatto);
    const aukko = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.4), new THREE.MeshBasicMaterial({ color: 0x0a0d1c })); aukko.position.set(0, 1.8, 3.51); telta.add(aukko);
    const ruudut = [];
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), hehku([0x3ddbd9, 0x8b5cf6, 0x51cf66][i % 3], 2)); r.position.set(-3.2 + i * 1.3, 1.5, 3.4); telta.add(r); ruudut.push(r); }
    const pelaajat = [];
    for (let i = 0; i < 6; i++) { const p = new THREE.Group(); const k = sylinteri(0.22, 0.26, 0.7, mat(0x222831, { metalness: 0 }), 8); k.position.y = 0.9; p.add(k); const h = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), mat(0xe8c3a0, { metalness: 0 })); h.position.y = 1.45; p.add(h); p.position.set(-3.2 + i * 1.3, 0, 4.1); telta.add(p); pelaajat.push(p); }
    const pelikyltti = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.9), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["PELITELTTA"], "#3ddbd9", "#0a0d1c", 512, 92) })); pelikyltti.position.set(0, 3.7, 3.52); telta.add(pelikyltti);
    telta.position.set(-28, 0, 12); telta.rotation.y = 0.5; scene.add(telta);

    /* Info-piste ja portti */
    const info = new THREE.Group();
    const infoKoju = laatikko(3, 1.1, 1.4, mat(0x3b8fd9, { metalness: 0 })); infoKoju.position.y = 0.55; info.add(infoKoju);
    const infoKatto = laatikko(3.4, 0.2, 2, mat(0xf4f6fa, { metalness: 0 })); infoKatto.position.y = 2.6; info.add(infoKatto);
    [[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8]].forEach(([a, b]) => { const t = sylinteri(0.05, 0.05, 2.5, mat(0xdddddd), 6); t.position.set(a, 1.3, b); info.add(t); });
    const infoK = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["i  INFO"], "#ffffff", "#3b8fd9", 256, 74) })); infoK.position.set(0, 2.2, 1.01); info.add(infoK);
    const tulkki = new THREE.Group(); const tk = sylinteri(0.24, 0.28, 0.9, mat(0x8b5cf6, { metalness: 0 }), 10); tk.position.y = 1.05; tulkki.add(tk); const th = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat(0xe8c3a0, { metalness: 0 })); th.position.y = 1.7; tulkki.add(th);
    const kasi1 = sylinteri(0.06, 0.06, 0.5, mat(0x8b5cf6, { metalness: 0 }), 6), kasi2 = kasi1.clone(); kasi1.position.set(-0.3, 1.3, 0.15); kasi2.position.set(0.3, 1.3, 0.15); tulkki.add(kasi1, kasi2);
    tulkki.position.set(0.6, 0, 1.6); info.add(tulkki);
    info.position.set(4, 0, 26); scene.add(info);
    const portti = new THREE.Group();
    [-4, 4].forEach((x) => { const p = laatikko(0.5, 5, 0.5, mat(0xffd98a, { metalness: 0 })); p.position.set(x, 2.5, 0); portti.add(p); });
    const porttiKyltti = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["KESÄYÖN FESTARIT"], "#1d1a45", "#ffd98a", 1024, 168), side: THREE.DoubleSide })); porttiKyltti.position.y = 4.6; portti.add(porttiKyltti);
    const opaste = new THREE.Group(); const opTolppa = sylinteri(0.06, 0.06, 2.6, mat(0x444444), 6); opTolppa.position.y = 1.3; opaste.add(opTolppa);
    [["RANTALAVA →", 2.3], ["← PELITELTTA", 1.8], ["MARKKINAT →", 1.3]].forEach(([t, y], i) => { const k = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri([t], "#ffffff", ["#d94860", "#3b8fd9", "#2f9e6e"][i], 256, 56), side: THREE.DoubleSide })); k.position.y = y; opaste.add(k); });
    opaste.position.set(5.5, 0, 1.5); portti.add(opaste);
    portti.position.set(-2, 0, 34); scene.add(portti);

    /* Laituri ja kamarimuusikot */
    const laituri = new THREE.Group();
    const lankut = laatikko(3, 0.2, 10, mat(0x9a7a55, { metalness: 0, roughness: 0.9 })); lankut.position.set(0, 0.35, -5); laituri.add(lankut);
    for (let z = -9.5; z <= -0.5; z += 3) [-1.3, 1.3].forEach((x) => { const t = sylinteri(0.12, 0.12, 1, mat(0x5a4330, { metalness: 0 }), 6); t.position.set(x, -0.1, z); laituri.add(t); });
    const muusikot = [];
    [[-0.6, 0xe86a8a, true], [0.7, 0x222831, false]].forEach(([x, v, sello]) => {
      const g = new THREE.Group(); const k = sylinteri(0.24, 0.3, 0.9, mat(v, { metalness: 0 }), 10); k.position.y = 0.95; g.add(k);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), mat(0xe8c3a0, { metalness: 0 })); p.position.y = 1.6; g.add(p);
      const soitin = new THREE.Mesh(new THREE.SphereGeometry(sello ? 0.35 : 0.14, 10, 8), mat(0x8a4a20, { metalness: 0.2, roughness: 0.4 })); soitin.scale.set(1, 1.5, 0.4);
      soitin.position.set(sello ? 0.1 : 0.2, sello ? 0.9 : 1.35, 0.3); if (!sello) soitin.rotation.z = 1.1; g.add(soitin);
      g.position.set(x, 0.45, -8.5); g.rotation.y = Math.PI; laituri.add(g); muusikot.push(g);
    });
    const katos = laatikko(3.2, 0.12, 2.6, new THREE.MeshStandardMaterial({ color: 0xf4f6fa, transparent: true, opacity: 0.85 })); katos.position.set(0, 2.9, -8.4); laituri.add(katos);
    [[-1.4, -9.5], [1.4, -9.5], [-1.4, -7.3], [1.4, -7.3]].forEach(([a, b]) => { const t = sylinteri(0.04, 0.04, 2.5, mat(0xdddddd), 6); t.position.set(a, 1.7, b); laituri.add(t); });
    laituri.position.set(18, 0, 0); scene.add(laituri);

    /* Yleisö */
    const yleiso = [];
    const vaatteet = [0xff5fa2, 0xffd98a, 0x3ddbd9, 0xf4f6fa, 0x8b5cf6, 0xd94860, 0x2f9e6e, 0x3b8fd9];
    const yGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.9, 7), pGeo = new THREE.SphereGeometry(0.17, 8, 6), pMat = mat(0xe8c3a0, { metalness: 0 });
    const yMat = vaatteet.map((v) => mat(v, { metalness: 0, roughness: 0.9 }));
    function ihminen(x, z) {
      const g = new THREE.Group(); const k = new THREE.Mesh(yGeo, yMat[Math.floor(Math.random() * yMat.length)]); k.position.y = 0.95; g.add(k);
      const jalat = sylinteri(0.17, 0.17, 0.5, mat(0x2a2f38, { metalness: 0 }), 6); jalat.position.y = 0.25; g.add(jalat);
      const p = new THREE.Mesh(pGeo, pMat); p.position.y = 1.58; g.add(p);
      g.position.set(x, 0, z); g.userData.v = Math.random() * 6.28; scene.add(g); yleiso.push(g);
    }
    for (let i = 0; i < 70; i++) ihminen(-14 + Math.random() * 16, 6 + Math.random() * 9);
    for (let i = 0; i < 30; i++) ihminen(9 + Math.random() * 20, 10.5 + Math.random() * 4);

    /* Ilotulitus (loppu) ja sade */
    const tuli = hiukkaset(600, 0xffffff, 0.3);
    const tuliVarit = new Float32Array(600 * 3), tv = [[1, .37, .64], [1, .85, .54], [.24, .86, .85], [.55, .36, .96]];
    for (let i = 0; i < 600; i++) tuliVarit.set(tv[Math.floor(i / 150)], i * 3);
    tuli.points.geometry.setAttribute("color", new THREE.BufferAttribute(tuliVarit, 3)); tuli.points.material.vertexColors = true; tuli.points.visible = false; scene.add(tuli.points);
    const keskukset = [[-20, 26, -40], [0, 30, -50], [20, 24, -42], [35, 28, -55]];
    const suunnat = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), n = 0.75 + Math.random() * 0.25;
      suunnat.set([Math.cos(a) * r * n, u * n, Math.sin(a) * r * n], i * 3);
    }
    const sade = hiukkaset(1200, 0xcfe0ff, 0.08); sade.points.material.blending = THREE.NormalBlending; sade.points.material.opacity = 0.6;
    for (let i = 0; i < 1200; i++) { sade.pos.set([-10 + Math.random() * 50, Math.random() * 18, -20 + Math.random() * 30], i * 3); sade.nopeus[i] = 9 + Math.random() * 4; }
    sade.points.visible = false; scene.add(sade.points);

    const tila = { tila: "ilta" };
    function asetaTila(t) {
      tila.tila = t.tila || "ilta";
      const s = tila.tila === "sade";
      sade.points.visible = s; tuli.points.visible = tila.tila === "loppu";
      hemi.intensity = s ? 0.75 : 1.05; aurinko.intensity = s ? 0.3 : 1.0;
      scene.fog.color.set(s ? 0x5a6378 : 0x4a3a6a); scene.fog.near = s ? 12 : 30; scene.fog.far = s ? 70 : 120;
      piirraNaytto(tila.tila === "loppu" ? ["KIITOS!", "NÄHDÄÄN ENSI KESÄNÄ"] : ["KESÄYÖN FESTARIT", "RANTALAVA"]);
    }
    function paivita(dt, t) {
      lamput.forEach((l, i) => { l.material.emissiveIntensity = 2 + Math.sin(t * 2 + i * 0.7) * 0.6; });
      keilat.forEach((k) => { k.rotation.z = Math.sin(t * 0.8 + k.userData.v) * 0.5; });
      bandi.forEach((b, i) => { b.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.12; });
      yleiso.forEach((h) => { h.position.y = Math.max(0, Math.sin(t * 3 + h.userData.v)) * 0.12; });
      ruudut.forEach((r, i) => { r.material.emissiveIntensity = 1.6 + Math.sin(t * 6 + i * 1.7) * 0.6; });
      pelaajat.forEach((p, i) => { p.rotation.y = Math.sin(t * 2 + i) * 0.15; });
      muusikot.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.4 + i) * 0.05; });
      kasi1.rotation.z = Math.sin(t * 5) * 0.8; kasi2.rotation.z = -Math.sin(t * 5 + 1) * 0.8;
      heijastus.material.opacity = 0.2 + Math.sin(t * 0.7) * 0.06;
      if (sade.points.visible) {
        for (let i = 0; i < 1200; i++) { let y = sade.pos[i * 3 + 1] - sade.nopeus[i] * dt; if (y < 0) y = 18; sade.pos[i * 3 + 1] = y; }
        sade.points.geometry.attributes.position.needsUpdate = true;
      }
      if (tuli.points.visible) {
        for (let i = 0; i < 600; i++) {
          const k = Math.floor(i / 150), vaihe = ((t * 0.35 + k * 0.27) % 1), c = keskukset[k], r = (1 - Math.pow(1 - vaihe, 3)) * 9;
          tuli.pos[i * 3] = c[0] + suunnat[i * 3] * r; tuli.pos[i * 3 + 1] = c[1] + suunnat[i * 3 + 1] * r - vaihe * vaihe * 5; tuli.pos[i * 3 + 2] = c[2] + suunnat[i * 3 + 2] * r;
        }
        tuli.points.geometry.attributes.position.needsUpdate = true;
      }
    }
    const kohtaukset = {
      kansi:     { kamera: [-2, 6, 46],    kohde: [-2, 4, 0],    tila: {} },
      puisto:    { kamera: [10, 16, 44],   kohde: [0, 1, 4],     tila: {} },
      portti:    { kamera: [2, 3, 44],     kohde: [-2, 3, 34],   tila: {} },
      lava:      { kamera: [-6, 4, 16],    kohde: [-6, 4, 0],    tila: {} },
      pelit:     { kamera: [-20, 3.5, 22], kohde: [-28, 2, 12],  tila: {} },
      markkinat: { kamera: [6, 2.6, 12.5], kohde: [26, 2, 12.5], tila: {} },
      info:      { kamera: [8, 2.8, 33],   kohde: [4, 1.6, 26],  tila: {} },
      jarvi:     { kamera: [18, 3, 4],     kohde: [18, 1.4, -9], tila: { tila: "sade" } },
      loppu:     { kamera: [0, 5, 20],     kohde: [0, 10, -40],  tila: { tila: "loppu" } }
    };
    return { kohtaukset, oletus: "puisto", asetaTila, paivita };
  },

  areena(scene) {
    const V = { yo: 0x0d1530, oranssi: 0xff8f3a, turkoosi: 0x3ddbd9, punainen: 0xe8434f, valko: 0xf4f6fa, sininen: 0x2f6fe0, pinkki: 0xff5fa2 };
    scene.background = new THREE.Color(V.yo);
    scene.fog = new THREE.Fog(V.yo, 30, 110);

    const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x1a2040, 1.25); scene.add(hemi);
    const yla = new THREE.DirectionalLight(0xffffff, 0.9); yla.position.set(5, 30, 12); scene.add(yla);

    /* Kenttä: lattia ja viivat (canvas-tekstuuri) */
    const kenttaTx = (() => {
      const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d");
      g.fillStyle = "#2f6fb8"; g.fillRect(0, 0, 1024, 512);
      g.fillStyle = "rgba(255,255,255,.04)"; for (let x = 0; x < 1024; x += 16) g.fillRect(x, 0, 8, 512);
      g.strokeStyle = "#ffffff"; g.lineWidth = 6;
      g.strokeRect(10, 10, 1004, 492);
      g.beginPath(); g.moveTo(512, 10); g.lineTo(512, 502); g.stroke();
      g.beginPath(); g.arc(512, 256, 70, 0, Math.PI * 2); g.stroke();
      g.strokeRect(10, 166, 110, 180); g.strokeRect(904, 166, 110, 180);
      g.fillStyle = "#ff8f3a"; g.beginPath(); g.arc(512, 256, 12, 0, Math.PI * 2); g.fill();
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
    })();
    const ulko = new THREE.Mesh(new THREE.PlaneGeometry(120, 90), mat(0x3a3f55, { roughness: 0.9, metalness: 0.1 })); ulko.rotation.x = -Math.PI / 2; ulko.position.y = -0.01; scene.add(ulko);
    const kentta = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ map: kenttaTx, roughness: 0.45, metalness: 0.1 }));
    kentta.rotation.x = -Math.PI / 2; scene.add(kentta);
    /* Kaukalo (laidat) */
    const laitaMat = mat(V.valko, { roughness: 0.5, metalness: 0.1 });
    [[0, 10.1, 40.4, 0.2], [0, -10.1, 40.4, 0.2], [20.1, 0, 0.2, 20.4], [-20.1, 0, 0.2, 20.4]].forEach(([x, z, w, d]) => {
      const l = laatikko(w, 0.5, d, laitaMat); l.position.set(x, 0.25, z); scene.add(l);
    });
    /* Maalit */
    const maaliMat = mat(V.punainen, { roughness: 0.4 });
    const verkkoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 1, side: THREE.DoubleSide });
    [-1, 1].forEach((s) => {
      const g = new THREE.Group();
      const ylaR = sylinteri(0.05, 0.05, 1.6, maaliMat, 8); ylaR.rotation.x = Math.PI / 2; ylaR.position.set(0, 1.15, 0); g.add(ylaR);
      [-0.8, 0.8].forEach((z) => { const p = sylinteri(0.05, 0.05, 1.15, maaliMat, 8); p.position.set(0, 0.575, z); g.add(p); });
      const verkko = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.15, 1.6), verkkoMat); verkko.position.set(s * 0.33, 0.575, 0); g.add(verkko);
      g.position.set(s * 17.5, 0, 0); scene.add(g);
    });

    /* Katsomot ja yleisö */
    const katsomoMat = mat(0x262c48, { roughness: 0.8 });
    const yleiso = [];
    const pukuVarit = [0xff8f3a, 0xff8f3a, 0x3ddbd9, 0xf4f6fa, 0xe8434f, 0x2f6fe0, 0xffd43b, 0xff5fa2, 0x51cf66];
    const yleisoGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.8, 7), paaGeo = new THREE.SphereGeometry(0.16, 8, 6);
    const yleisoMat = pukuVarit.map((v) => mat(v, { roughness: 0.9, metalness: 0 })), paaMat = mat(0xe8c3a0, { metalness: 0 });
    function katsomo(z, suunta) {
      for (let r = 0; r < 6; r++) {
        const aste = laatikko(44, 0.8, 1.6, katsomoMat); aste.position.set(0, 0.4 + r * 0.8, z + suunta * (2 + r * 1.6)); scene.add(aste);
        for (let x = -21; x <= 21; x += 1.05) {
          if (Math.random() < 0.18) continue;
          const g = new THREE.Group();
          const k = new THREE.Mesh(yleisoGeo, yleisoMat[Math.floor(Math.random() * yleisoMat.length)]); k.position.y = 0.4; g.add(k);
          const p = new THREE.Mesh(paaGeo, paaMat); p.position.y = 0.95; g.add(p);
          g.position.set(x + (Math.random() - 0.5) * 0.3, 0.8 + r * 0.8, z + suunta * (2 + r * 1.6));
          g.userData.vaihe = Math.random() * 6.28; g.userData.y0 = g.position.y;
          scene.add(g); yleiso.push(g);
        }
      }
    }
    katsomo(11, 1); katsomo(-11, -1);
    /* Takaseinät ja mainostaulut (tekstit keksittyjä) */
    const seinaMat = mat(0x1a2142, { roughness: 0.9 });
    [[0, 6, 22.5, 60, 14, 0.5], [0, 6, -22.5, 60, 14, 0.5], [30, 6, 0, 0.5, 14, 46], [-30, 6, 0, 0.5, 14, 46]].forEach(([x, y, z, w, h, d]) => {
      const s = laatikko(w, h, d, seinaMat); s.position.set(x, y, z); scene.add(s);
    });
    const banneri = new THREE.Mesh(new THREE.PlaneGeometry(26, 2.2), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["NUORTEN SM-FINAALI"], "#ffffff", "#ff8f3a", 1024, 88) }));
    banneri.position.set(0, 9.5, -22.2); scene.add(banneri);
    const banneri2 = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.6), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["KOTKAT · HAUKAT"], "#0d1530", "#3ddbd9", 1024, 116) }));
    banneri2.position.set(-29.7, 9, 0); banneri2.rotation.y = Math.PI / 2; scene.add(banneri2);

    /* Kattoristikko ja valonheittimet */
    const teras = mat(0x8a93a8, { metalness: 0.8, roughness: 0.35 });
    for (let x = -24; x <= 24; x += 6) { const p = laatikko(0.3, 0.3, 40, teras); p.position.set(x, 14, 0); scene.add(p); }
    for (let z = -16; z <= 16; z += 8) { const p = laatikko(50, 0.3, 0.3, teras); p.position.set(0, 14, z); scene.add(p); }
    const heittimet = [];
    const valoVarit = [0xffffff, 0x3ddbd9, 0xff8f3a, 0xff5fa2, 0xffffff, 0x3ddbd9];
    valoVarit.forEach((v, i) => {
      const keila = new THREE.Mesh(new THREE.ConeGeometry(2.2, 14, 20, 1, true), new THREE.MeshBasicMaterial({ color: v, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      keila.geometry.translate(0, -7, 0);
      const g = new THREE.Group(); g.add(keila);
      const runko = sylinteri(0.35, 0.45, 0.7, mat(0x222831), 12); g.add(runko);
      g.position.set(-15 + i * 6, 13.6, i % 2 ? 6 : -6); scene.add(g);
      g.userData.vaihe = i * 1.1; heittimet.push(g);
    });
    /* Valopisteet lattialla (tanssi) */
    const lammit = [];
    [[-3, 0x3ddbd9], [0, 0xff5fa2], [3, 0xff8f3a]].forEach(([x, v]) => {
      const d = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: v, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }));
      d.rotation.x = -Math.PI / 2; d.position.set(x, 0.03, 0); scene.add(d); lammit.push(d);
    });

    /* Tulostaulu (kuutio katossa) */
    const tauluC = document.createElement("canvas"); tauluC.width = 512; tauluC.height = 256; const tauluTx = new THREE.CanvasTexture(tauluC); tauluTx.colorSpace = THREE.SRGBColorSpace;
    function piirraTaulu(tulos) {
      const g = tauluC.getContext("2d");
      g.fillStyle = "#05070f"; g.fillRect(0, 0, 512, 256);
      g.textAlign = "center"; g.fillStyle = "#3ddbd9"; g.font = "bold 34px 'Segoe UI', Arial"; g.fillText(tulos ? "LOPPUTULOS" : "FINAALI KLO 18.00", 256, 50);
      g.font = "bold 44px 'Segoe UI', Arial"; g.fillStyle = "#ff8f3a"; g.fillText("KOTKAT", 130, 120); g.fillStyle = "#e9eef7"; g.fillText("HAUKAT", 382, 120);
      g.font = "bold 92px 'Consolas', monospace"; g.fillStyle = "#ffd43b"; g.fillText(tulos ? "5 – 4" : "0 – 0", 256, 220);
      tauluTx.needsUpdate = true;
    }
    piirraTaulu(false);
    const taulu = new THREE.Group();
    const tauluMat = new THREE.MeshBasicMaterial({ map: tauluTx });
    const kuutio = laatikko(5, 2.6, 5, mat(0x111522)); taulu.add(kuutio);
    [0, 1, 2, 3].forEach((i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.35), tauluMat); p.position.set(Math.sin(i * Math.PI / 2) * 2.52, 0, Math.cos(i * Math.PI / 2) * 2.52); p.rotation.y = i * Math.PI / 2; taulu.add(p); });
    taulu.position.set(0, 10.5, 0); scene.add(taulu);
    [-1.8, 1.8].forEach((x) => { const v = sylinteri(0.04, 0.04, 2.3, teras, 6); v.position.set(x, 12.9, 0); scene.add(v); });

    /* Hahmot */
    const ihoMat = mat(0xe8c3a0, { metalness: 0 }), housutMat = mat(0x1d2233, { metalness: 0 });
    function hahmo(vari, koko) {
      const g = new THREE.Group(); const s = koko || 1;
      const keho = sylinteri(0.24 * s, 0.28 * s, 0.85 * s, mat(vari, { roughness: 0.7, metalness: 0 }), 10); keho.position.y = 1.05 * s; g.add(keho);
      const jalat = sylinteri(0.2 * s, 0.18 * s, 0.65 * s, housutMat, 8); jalat.position.y = 0.33 * s; g.add(jalat);
      const paa = new THREE.Mesh(new THREE.SphereGeometry(0.19 * s, 12, 10), ihoMat); paa.position.y = 1.7 * s; g.add(paa);
      scene.add(g); return g;
    }
    /* Pelaajat: Kotkat (oranssi) ja Haukat (valkoinen) */
    const kotkat = [], haukat = [];
    for (let i = 0; i < 6; i++) { const h = hahmo(V.oranssi); h.userData.i = i; kotkat.push(h); }
    for (let i = 0; i < 6; i++) { const h = hahmo(V.valko); h.userData.i = i; haukat.push(h); }
    const pallo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xffffff, { metalness: 0 })); scene.add(pallo);
    /* Tanssijat */
    const tanssijat = [];
    [0x3ddbd9, 0xff5fa2, 0xffd43b, 0xff8f3a, 0xb197fc].forEach((v, i) => { const h = hahmo(v, 0.95); h.userData.i = i; tanssijat.push(h); });
    /* Sirkus: ilmavanne katosta, turvamatto */
    const sirkus = new THREE.Group();
    const vanne = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 10, 40), mat(0xffd43b, { metalness: 0.7, roughness: 0.3 }));
    const vanneRyhma = new THREE.Group(); vanneRyhma.add(vanne);
    const koysi = sylinteri(0.025, 0.025, 7.2, mat(0xf4f6fa, { metalness: 0 }), 6); koysi.position.y = 4.5; vanneRyhma.add(koysi);
    const artisti = hahmo(V.pinkki, 0.8); scene.remove(artisti); artisti.position.set(0, -0.8, 0); artisti.rotation.z = 0.5; vanneRyhma.add(artisti);
    vanneRyhma.position.set(0, 7, 0); sirkus.add(vanneRyhma);
    const matto = laatikko(4, 0.35, 4, mat(0x2f6fe0, { roughness: 0.95, metalness: 0 })); matto.position.y = 0.18; sirkus.add(matto);
    const tukija = hahmo(0x3ddbd9); scene.remove(tukija); tukija.position.set(1.6, 0.35, 1.2); sirkus.add(tukija);
    sirkus.position.set(-12, 0, -4); scene.add(sirkus);
    const riggausValo = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), hehku(0x51cf66, 3)); riggausValo.position.set(-12, 14.3, -4); scene.add(riggausValo);

    /* Fysiopiste kentän päädyssä */
    const fysio = new THREE.Group();
    const poyta = laatikko(2.2, 0.12, 0.8, mat(0x2f6fe0, { metalness: 0, roughness: 0.8 })); poyta.position.y = 0.8; fysio.add(poyta);
    [[-0.95, -0.3], [0.95, -0.3], [-0.95, 0.3], [0.95, 0.3]].forEach(([x, z]) => { const j = sylinteri(0.04, 0.04, 0.8, teras, 6); j.position.set(x, 0.4, z); fysio.add(j); });
    const potilas = hahmo(V.oranssi, 0.9); scene.remove(potilas); potilas.rotation.z = Math.PI / 2; potilas.position.set(0.8, 1.05, 0); fysio.add(potilas);
    const fysioterapeutti = hahmo(0xf4f6fa); scene.remove(fysioterapeutti); fysioterapeutti.position.set(1.4, 0, 0.9); fysio.add(fysioterapeutti);
    const laukku = laatikko(0.6, 0.4, 0.35, mat(V.punainen, { metalness: 0 })); laukku.position.set(-1.6, 0.2, 0.6); fysio.add(laukku);
    const risti = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["+"], "#ffffff", "#e8434f", 64, 64) })); risti.position.set(-1.6, 0.22, 0.78); fysio.add(risti);
    fysio.position.set(-24, 0, 6); scene.add(fysio);

    /* Pukukoppi (päätyseinän takana oma tila) */
    const koppi = new THREE.Group();
    const koppiLattia = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat(0x5a6278, { roughness: 0.9, metalness: 0 })); koppiLattia.rotation.x = -Math.PI / 2; koppiLattia.position.y = 0.01; koppi.add(koppiLattia);
    for (let i = 0; i < 8; i++) {
      const kaappi = laatikko(1.4, 2.6, 0.7, mat(i % 2 ? 0xff8f3a : 0xf08030, { roughness: 0.6, metalness: 0.3 })); kaappi.position.set(-5 + i * 1.45, 1.3, -4.4); koppi.add(kaappi);
      const nro = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri([String(i + 4)], "#0d1530", "#ffffff", 64, 44) })); nro.position.set(-5 + i * 1.45, 2.2, -4.04); koppi.add(nro);
    }
    const penkki = laatikko(10, 0.12, 0.6, mat(0xb58a5a, { metalness: 0, roughness: 0.8 })); penkki.position.set(0, 0.5, -2.6); koppi.add(penkki);
    const koppiPelaajat = [];
    for (let i = 0; i < 5; i++) { const h = hahmo(V.oranssi, 0.95); scene.remove(h); h.position.set(-4 + i * 2, 0, -2.4 + (i % 2) * 0.2); koppi.add(h); koppiPelaajat.push(h); }
    const hieroja = hahmo(0x3ddbd9); scene.remove(hieroja); hieroja.position.set(3.5, 0, 0.4); koppi.add(hieroja);
    const taulu2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["TÄNÄÄN:", "YHDESSÄ!"], "#0d1530", "#f4f6fa", 512, 300) })); taulu2.position.set(5.6, 1.9, -4.04); koppi.add(taulu2);
    [[0, 2.5, -4.8, 14, 5, 0.2], [-7, 2.5, 0, 0.2, 5, 10], [7, 2.5, 0, 0.2, 5, 10]].forEach(([x, y, z, w, h, d]) => { const s = laatikko(w, h, d, mat(0xcfd6e4, { roughness: 0.9, metalness: 0 })); s.position.set(x, y, z); koppi.add(s); });
    const koppiValo = new THREE.PointLight(0xfff1d6, 30, 18); koppiValo.position.set(0, 4.5, 0); koppi.add(koppiValo);
    koppi.position.set(0, 0, -38); scene.add(koppi);

    /* Konfetti */
    const konf = hiukkaset(500, 0xffffff, 0.22);
    const konfVarit = new Float32Array(500 * 3);
    const vv = [[1, .56, .23], [.24, .86, .85], [1, .37, .64], [1, .83, .23], [1, 1, 1]];
    for (let i = 0; i < 500; i++) {
      konf.pos.set([-18 + Math.random() * 36, Math.random() * 13, -9 + Math.random() * 18], i * 3); konf.nopeus[i] = 0.8 + Math.random() * 1.4;
      konfVarit.set(vv[i % 5], i * 3);
    }
    konf.points.geometry.setAttribute("color", new THREE.BufferAttribute(konfVarit, 3));
    konf.points.material.vertexColors = true; konf.points.material.blending = THREE.NormalBlending; konf.points.material.opacity = 1;
    konf.points.visible = false; scene.add(konf.points);

    /* ---------- TILA ---------- */
    const tila = { tila: "lammittely" };
    function asetaTila(t) {
      tila.tila = t.tila || "lammittely";
      const show = tila.tila === "tanssi";
      lammit.forEach((d) => { d.visible = show; });
      tanssijat.forEach((h) => { h.visible = show; });
      konf.points.visible = tila.tila === "loppu";
      piirraTaulu(tila.tila === "loppu");
      const peli = tila.tila === "finaali" || tila.tila === "loppu";
      haukat.forEach((h) => { h.visible = peli || tila.tila === "lammittely"; });
      kotkat.forEach((h) => { h.visible = !show; });
      pallo.visible = tila.tila === "finaali";
      hemi.intensity = show ? 0.7 : 1.25; yla.intensity = show ? 0.4 : 0.9;
    }
    function paivita(dt, t) {
      const tl = tila.tila;
      kotkat.forEach((h, i) => {
        if (tl === "lammittely") { const a = t * 0.5 + i * 1.05; h.position.set(-9 + Math.cos(a) * 5, Math.abs(Math.sin(t * 6 + i)) * 0.08, Math.sin(a) * 4); h.rotation.y = -a; }
        else if (tl === "finaali") { const a = t * 0.7 + i; h.position.set(-10 + i * 3.4 + Math.sin(a) * 2.2, 0, -6 + (i % 3) * 6 + Math.cos(a * 1.3) * 1.5); h.rotation.y = a; }
        else { h.position.set(-6 + i * 2.4, (tl === "loppu" ? Math.abs(Math.sin(t * 5 + i)) * 0.6 : 0), 1.5 + (i % 2)); h.rotation.y = 0; }
      });
      haukat.forEach((h, i) => {
        if (tl === "lammittely") { const a = -t * 0.5 + i * 1.05; h.position.set(9 + Math.cos(a) * 5, Math.abs(Math.sin(t * 6 + i)) * 0.08, Math.sin(a) * 4); h.rotation.y = -a; }
        else if (tl === "finaali") { const a = t * 0.6 + i * 1.3; h.position.set(-8 + i * 3.2 + Math.cos(a) * 2, 0, -5 + (i % 3) * 5 + Math.sin(a) * 1.6); h.rotation.y = -a; }
        else { h.position.set(6 + (i % 3) * 2, 0, -2 - Math.floor(i / 3) * 2); h.rotation.y = Math.PI; }
      });
      if (pallo.visible) pallo.position.set(Math.sin(t * 1.7) * 9, 0.12, Math.sin(t * 2.3) * 5);
      tanssijat.forEach((h, i) => {
        const a = t * 0.8 + i * (Math.PI * 2 / 5);
        h.position.set(Math.cos(a) * 3.2, Math.abs(Math.sin(t * 3 + i)) * 0.25, Math.sin(a) * 1.8);
        h.rotation.y = t * 2 + i;
      });
      lammit.forEach((d, i) => { d.position.x = Math.sin(t * 0.6 + i * 2) * 4; d.position.z = Math.cos(t * 0.5 + i) * 2; });
      heittimet.forEach((g) => { g.rotation.z = Math.sin(t * 0.5 + g.userData.vaihe) * 0.45; g.rotation.x = Math.cos(t * 0.4 + g.userData.vaihe) * 0.3; });
      const into = tl === "finaali" || tl === "loppu" ? 1 : 0.25;
      yleiso.forEach((h) => { h.position.y = h.userData.y0 + Math.max(0, Math.sin(t * 4 + h.userData.vaihe)) * 0.18 * into; });
      vanneRyhma.rotation.z = Math.sin(t * 0.9) * 0.25; vanneRyhma.rotation.y = t * 0.4;
      riggausValo.material.emissiveIntensity = Math.sin(t * 3) > 0 ? 3 : 0.6;
      koppiPelaajat.forEach((h, i) => { h.rotation.y = Math.sin(t * 0.8 + i) * 0.4; });
      taulu.rotation.y = t * 0.15;
      if (konf.points.visible) {
        for (let i = 0; i < 500; i++) {
          let y = konf.pos[i * 3 + 1] - konf.nopeus[i] * dt; if (y < 0) y = 13;
          konf.pos[i * 3 + 1] = y; konf.pos[i * 3] += Math.sin(t * 2 + i) * dt * 0.5;
        }
        konf.points.geometry.attributes.position.needsUpdate = true;
      }
    }

    const kohtaukset = {
      kansi:      { kamera: [-22, 7, 20],   kohde: [0, 4, 0],      tila: { tila: "finaali" } },
      halli:      { kamera: [0, 16, 30],    kohde: [0, 2, 0],      tila: { tila: "lammittely" } },
      lammittely: { kamera: [-14, 4, 12],   kohde: [-8, 1, 0],     tila: { tila: "lammittely" } },
      fysio:      { kamera: [-19.5, 2.6, 10.5], kohde: [-24, 0.9, 6], tila: { tila: "lammittely" } },
      tanssi:     { kamera: [0, 5, 13],     kohde: [0, 1, 0],      tila: { tila: "tanssi" } },
      sirkus:     { kamera: [-6, 3, 6],     kohde: [-12, 6, -4],   tila: { tila: "lammittely" } },
      pukukoppi:  { kamera: [0, 2.2, -32.5], kohde: [0, 1.4, -42], tila: { tila: "lammittely" } },
      finaali:    { kamera: [14, 9, 22],    kohde: [0, 1, 0],      tila: { tila: "finaali" } },
      loppu:      { kamera: [-4, 5, 18],    kohde: [0, 4, 0],      tila: { tila: "loppu" } }
    };
    return { kohtaukset, oletus: "halli", asetaTila, paivita };
  },

  lentokentta(scene) {
    const V = { yo: 0x1d2c47, lumi: 0xe6eef7, meripihka: 0xffc15e, sininen: 0x4d8dff, punainen: 0xff4d4d, valko: 0xf4f6fa };
    scene.background = new THREE.Color(V.yo);
    scene.fog = new THREE.Fog(0x33456a, 18, 95);

    const hemi = new THREE.HemisphereLight(0xb8c8e8, 0x2a3550, 1.2); scene.add(hemi);
    const kuu = new THREE.DirectionalLight(0xcfe0ff, 0.6); kuu.position.set(-20, 30, 20); scene.add(kuu);
    const aamu = new THREE.DirectionalLight(0xffc89a, 0); aamu.position.set(40, 10, -40); scene.add(aamu);

    const lumiMat = mat(V.lumi, { roughness: 0.95 });
    const maa = new THREE.Mesh(new THREE.PlaneGeometry(300, 200), lumiMat); maa.rotation.x = -Math.PI / 2; maa.position.z = -30; scene.add(maa);

    /* Kiitotie + valot */
    const kiitotie = new THREE.Mesh(new THREE.PlaneGeometry(160, 9), mat(0x5a6170, { roughness: 0.8 })); kiitotie.rotation.x = -Math.PI / 2; kiitotie.position.set(0, 0.02, -38); scene.add(kiitotie);
    for (let x = -76; x <= 76; x += 6) { const v = laatikko(3, 0.02, 0.3, mat(0xf4f6fa)); v.position.set(x, 0.04, -38); scene.add(v); }
    const reunavalot = [];
    for (let x = -78; x <= 78; x += 4) [-4.8, 4.8].forEach((dz) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), hehku(dz > 0 ? 0xfff2cc : V.meripihka, 2.5)); l.position.set(x, 0.15, -38 + dz); scene.add(l); reunavalot.push(l); });
    const rullaus = new THREE.Mesh(new THREE.PlaneGeometry(6, 22), mat(0x5a6170, { roughness: 0.8 })); rullaus.rotation.x = -Math.PI / 2; rullaus.position.set(-6, 0.02, -24); scene.add(rullaus);
    for (let z = -34; z <= -14; z += 2.5) [-3.2, 3.2].forEach((dx) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hehku(V.sininen, 2.5)); l.position.set(-6 + dx, 0.12, z); scene.add(l); });
    const asemataso = new THREE.Mesh(new THREE.PlaneGeometry(50, 12), mat(0x667080, { roughness: 0.85 })); asemataso.rotation.x = -Math.PI / 2; asemataso.position.set(0, 0.025, -18); scene.add(asemataso);

    /* Terminaali */
    const ikkunaTx = (() => {
      const c = document.createElement("canvas"); c.width = 512; c.height = 128; const g = c.getContext("2d");
      g.fillStyle = "#ffd89a"; g.fillRect(0, 0, 512, 128);
      g.fillStyle = "#c98f3d"; for (let x = 0; x < 512; x += 32) g.fillRect(x, 0, 3, 128); g.fillRect(0, 60, 512, 3);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.repeat.set(4, 1); return tx;
    })();
    const terminaali = laatikko(44, 6, 9, mat(0xc9d2dd, { roughness: 0.6 })); terminaali.position.set(0, 3, -6.5); scene.add(terminaali);
    const lasi = new THREE.Mesh(new THREE.PlaneGeometry(40, 4.4), new THREE.MeshStandardMaterial({ map: ikkunaTx, emissive: 0xffc070, emissiveMap: ikkunaTx, emissiveIntensity: 0.9, roughness: 0.3 }));
    lasi.position.set(0, 2.6, -1.98); scene.add(lasi);
    const katos = laatikko(46, 0.4, 3, mat(0xeef2f6)); katos.position.set(0, 6.2, -1.2); scene.add(katos);
    const katonLumi = laatikko(44.4, 0.25, 9.4, lumiMat); katonLumi.position.set(0, 6.15, -6.5); scene.add(katonLumi);
    const kyltti = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.3), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["LÄHTÖAULA · DEPARTURES"], "#ffffff", "#1d2c47", 1024, 112) }));
    kyltti.position.set(0, 5.4, -1.94); scene.add(kyltti);
    /* Lähtötaulu: PERUTTU */
    const tauluC = document.createElement("canvas"); tauluC.width = 512; tauluC.height = 320; const tauluTx = new THREE.CanvasTexture(tauluC); tauluTx.colorSpace = THREE.SRGBColorSpace;
    function piirraTaulu(aamu) {
      const g = tauluC.getContext("2d");
      g.fillStyle = "#0b1020"; g.fillRect(0, 0, 512, 320);
      g.fillStyle = "#ffd25e"; g.font = "bold 30px 'Segoe UI', Arial"; g.fillText("LÄHTEVÄT", 20, 40);
      const rivit = aamu ? [["07.10", "OULU", "AJASSA", "#8ce99a"], ["07.40", "ROVANIEMI", "AJASSA", "#8ce99a"], ["08.05", "KUOPIO", "AJASSA", "#8ce99a"], ["08.30", "IVALO", "AJASSA", "#8ce99a"]]
        : [["19.05", "OULU", "PERUTTU", "#ff6b6b"], ["19.40", "ROVANIEMI", "PERUTTU", "#ff6b6b"], ["20.15", "KUOPIO", "PERUTTU", "#ff6b6b"], ["21.00", "IVALO", "PERUTTU", "#ff6b6b"]];
      g.font = "bold 28px 'Consolas', monospace";
      rivit.forEach(([a, k, t, v], i) => { const y = 95 + i * 58; g.fillStyle = "#e9eef7"; g.fillText(a, 20, y); g.fillText(k, 130, y); g.fillStyle = v; g.fillText(t, 340, y); });
      tauluTx.needsUpdate = true;
    }
    piirraTaulu(false);
    const taulu = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map: tauluTx })); taulu.position.set(-4, 2.6, -1.9); scene.add(taulu);
    const tauluKehys = laatikko(4.4, 2.8, 0.08, mat(0x222831)); tauluKehys.position.set(-4, 2.6, -1.95); scene.add(tauluKehys);

    /* Ihmisiä jonossa (aula) */
    const ihmiset = [];
    const takit = [0xd94848, 0x3b6fd1, 0x2f9e6e, 0xf2a541, 0x7a5ac8, 0x444b55];
    function ihminen(x, z, v) {
      const g = new THREE.Group();
      const keho = sylinteri(0.22, 0.26, 1.0, mat(v, { roughness: 0.9 }), 10); keho.position.y = 0.95; g.add(keho);
      const jalat = sylinteri(0.18, 0.18, 0.5, mat(0x2a2f38), 8); jalat.position.y = 0.25; g.add(jalat);
      const paa = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), mat(0xe8c3a0)); paa.position.y = 1.62; g.add(paa);
      const pipo = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(takit[(ihmiset.length + 2) % 6])); pipo.position.y = 1.66; g.add(pipo);
      const laukku = laatikko(0.35, 0.5, 0.22, mat(0x30343c)); laukku.position.set(0.4, 0.3, 0); g.add(laukku);
      g.position.set(x, 0, z); scene.add(g); ihmiset.push(g); return g;
    }
    for (let i = 0; i < 9; i++) ihminen(-6.5 + i * 0.9 + (i % 2) * 0.2, 0.2 + (i % 3) * 0.35, takit[i % 6]);

    /* Ravintolasiipi (vasen) */
    const ravintola = laatikko(10, 4.5, 7, mat(0xb8c2cf, { roughness: 0.6 })); ravintola.position.set(-28, 2.25, -6); scene.add(ravintola);
    const ravLasi = new THREE.Mesh(new THREE.PlaneGeometry(9, 3), new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffb050, emissiveIntensity: 1.1 })); ravLasi.position.set(-28, 2, -2.48); scene.add(ravLasi);
    const ravKyltti = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.8), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["RAVINTOLA"], "#ffd25e", "#2a1800", 512, 82) })); ravKyltti.position.set(-28, 4.1, -2.46); scene.add(ravKyltti);
    const hoyry = hiukkaset(60, 0xffffff, 0.35);
    for (let i = 0; i < 60; i++) { hoyry.pos.set([-30 + Math.random() * 4, 4.6 + Math.random() * 3, -6 + Math.random() * 2], i * 3); hoyry.nopeus[i] = 0.4 + Math.random() * 0.5; }
    hoyry.points.material.opacity = 0.35; hoyry.points.material.transparent = true; hoyry.points.material.blending = THREE.NormalBlending; scene.add(hoyry.points);
    const kattila = sylinteri(0.6, 0.55, 0.6, mat(0xb8c0c8, { metalness: 0.7, roughness: 0.3 }), 16); kattila.position.set(-26, 1.3, -2.2); scene.add(kattila);
    const poyta = laatikko(3, 0.1, 1, mat(0x8a6a4a)); poyta.position.set(-27, 1.0, -1.8); scene.add(poyta);

    /* Lentokoneet asematasolla */
    const koneet = [];
    function kone(x, z, ry) {
      const g = new THREE.Group();
      const runko = sylinteri(0.9, 0.9, 12, mat(V.valko, { roughness: 0.4 }), 18); runko.rotation.z = Math.PI / 2; runko.position.y = 2; g.add(runko);
      const nokka = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 12), mat(V.valko, { roughness: 0.4 })); nokka.scale.x = 1.6; nokka.position.set(6, 2, 0); g.add(nokka);
      const pyrsto = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 18), mat(V.valko, { roughness: 0.4 })); pyrsto.rotation.z = Math.PI / 2; pyrsto.position.set(-7.2, 2.2, 0); g.add(pyrsto);
      const raita = sylinteri(0.92, 0.92, 11.5, mat(0x2b5fa8), 18, 1); raita.rotation.z = Math.PI / 2; raita.position.y = 1.7; raita.scale.set(1, 1, 0.3); g.add(raita);
      const siipi = laatikko(3, 0.15, 13, mat(0xdfe4ea)); siipi.position.set(0.5, 1.6, 0); g.add(siipi);
      const evä = laatikko(2, 2.6, 0.15, mat(0x2b5fa8)); evä.position.set(-6.8, 3.6, 0); evä.rotation.z = -0.35; g.add(evä);
      const vaaka = laatikko(1.4, 0.12, 4.5, mat(0xdfe4ea)); vaaka.position.set(-7, 2.4, 0); g.add(vaaka);
      [-3.2, 3.2].forEach((dz) => { const m = sylinteri(0.45, 0.45, 1.6, mat(0x9aa3ae, { metalness: 0.6 }), 14); m.rotation.z = Math.PI / 2; m.position.set(1.2, 1.1, dz); g.add(m); });
      const lumiRunko = sylinteri(0.5, 0.5, 11, lumiMat, 10); lumiRunko.rotation.z = Math.PI / 2; lumiRunko.position.y = 2.75; lumiRunko.scale.set(1, 0.3, 1); g.add(lumiRunko);
      const vilkku = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), hehku(V.punainen, 3)); vilkku.position.set(0, 2.95, 0); g.add(vilkku); g.userData.vilkku = vilkku;
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); koneet.push(g); return g;
    }
    kone(-12, -18, 0.3); kone(10, -18, -0.25);
    const nouseva = kone(-30, -38, 0); nouseva.visible = false;

    /* Lennonjohtotorni */
    const torni = new THREE.Group();
    const varsi = sylinteri(1.2, 1.6, 18, mat(0xdde3ea, { roughness: 0.5 }), 16); varsi.position.y = 9; torni.add(varsi);
    const hytti = sylinteri(3, 2.2, 2.4, mat(0xc9d2dd, { metalness: 0.5, roughness: 0.3 }), 20); hytti.position.y = 19.2; torni.add(hytti);
    const hyttiLasi = sylinteri(3.05, 3.05, 1.4, new THREE.MeshStandardMaterial({ color: 0x8fd0ff, emissive: 0x2b6fb0, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.2 }), 20); hyttiLasi.position.y = 21; torni.add(hyttiLasi);
    const katto = sylinteri(3.2, 3.2, 0.3, mat(0xeef2f6), 20); katto.position.y = 21.8; torni.add(katto);
    const torniValo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), hehku(V.punainen, 3)); torniValo.position.y = 22.6; torni.add(torniValo);
    torni.position.set(30, 0, -14); scene.add(torni);

    /* Lumiaurat kiitotiellä */
    const aurat = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      const kori = laatikko(3, 1.4, 1.6, mat(0xf2a541)); kori.position.y = 1.1; g.add(kori);
      const ohj = laatikko(1.2, 1, 1.5, mat(0xf2a541)); ohj.position.set(1.1, 2.2, 0); g.add(ohj);
      const terä = laatikko(0.3, 0.8, 3.4, mat(0x444b55)); terä.position.set(2.1, 0.5, 0); terä.rotation.y = 0.3; g.add(terä);
      const valo = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), hehku(V.meripihka, 3)); valo.position.set(1.1, 2.85, 0); g.add(valo); g.userData.valo = valo;
      [-0.9, 0.9].forEach((x) => [-0.8, 0.8].forEach((z) => { const r = sylinteri(0.4, 0.4, 0.3, mat(0x222222), 12); r.rotation.x = Math.PI / 2; r.position.set(x, 0.4, z); g.add(r); }));
      g.position.set(-20 + i * 5, 0, -37 + i * 1.6); scene.add(g); aurat.push(g);
    }

    /* Bussi ja pysäkki */
    const bussi = new THREE.Group();
    const bKeho = laatikko(10, 3, 2.6, mat(0x2b5fa8, { roughness: 0.5 })); bKeho.position.y = 1.9; bussi.add(bKeho);
    const bIkk = laatikko(9.4, 1.1, 2.62, new THREE.MeshStandardMaterial({ color: 0x9fd2ff, emissive: 0xffd08a, emissiveIntensity: 0.6, roughness: 0.2 })); bIkk.position.y = 2.5; bussi.add(bIkk);
    const bLumi = laatikko(10, 0.2, 2.6, lumiMat); bLumi.position.y = 3.5; bussi.add(bLumi);
    [-3.2, 3.2].forEach((x) => [-1.3, 1.3].forEach((z) => { const r = sylinteri(0.5, 0.5, 0.4, mat(0x222222), 14); r.rotation.x = Math.PI / 2; r.position.set(x, 0.5, z); bussi.add(r); }));
    const etuvalot = [];
    [-0.9, 0.9].forEach((z) => { const v = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), hehku(0xfff3c4, 2.5)); v.position.set(5.01, 1, z); v.rotation.y = Math.PI / 2; bussi.add(v); etuvalot.push(v); });
    const kilpi = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["HOTELLI"], "#ffc15e", "#111111", 256, 48) })); kilpi.position.set(5.02, 3.0, 0); kilpi.rotation.y = Math.PI / 2; bussi.add(kilpi);
    bussi.position.set(14, 0, 6); bussi.rotation.y = Math.PI; scene.add(bussi);
    const katosB = laatikko(4, 0.15, 1.6, mat(0xeef2f6)); katosB.position.set(8, 2.6, 4); scene.add(katosB);
    [6.2, 9.8].forEach((x) => { const t = sylinteri(0.06, 0.06, 2.6, mat(0x555c66), 6); t.position.set(x, 1.3, 4.6); scene.add(t); });
    for (let i = 0; i < 4; i++) ihminen(7 + i * 0.8, 3.6 + (i % 2) * 0.4, takit[(i + 3) % 6]);

    /* Hotelli (oikealla edessä) */
    const hotelli = laatikko(9, 10, 7, mat(0xa9b4c2, { roughness: 0.7 })); hotelli.position.set(32, 5, 8); scene.add(hotelli);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hehku((x + y) % 3 ? 0xffd59e : 0x34465f, 1)); w.position.set(28.5 + x * 1.7, 1.8 + y * 1.8, 11.52); scene.add(w);
    }
    const hKyltti = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.9), new THREE.MeshBasicMaterial({ map: tekstiTekstuuri(["HOTELLI"], "#ffffff", "#2b5fa8", 512, 92) })); hKyltti.position.set(32, 10.6, 11.52); scene.add(hKyltti);

    /* Lumimyrsky */
    const lumi = hiukkaset(1400, 0xffffff, 0.14);
    for (let i = 0; i < 1400; i++) { lumi.pos.set([-45 + Math.random() * 90, Math.random() * 22, -50 + Math.random() * 70], i * 3); lumi.nopeus[i] = 1.5 + Math.random() * 1.5; }
    lumi.points.material.blending = THREE.NormalBlending; scene.add(lumi.points);

    /* ---------- TILA ---------- */
    const tila = { aamu: false };
    function asetaTila(t) {
      tila.aamu = !!t.aamu;
      scene.background.set(tila.aamu ? 0xffcfa8 : V.yo);
      scene.fog.color.set(tila.aamu ? 0xffe2c8 : 0x33456a);
      scene.fog.near = tila.aamu ? 40 : 18; scene.fog.far = tila.aamu ? 160 : 95;
      hemi.intensity = tila.aamu ? 1.6 : 1.2; aamu.intensity = tila.aamu ? 1.4 : 0;
      lumi.points.visible = !tila.aamu;
      piirraTaulu(tila.aamu);
      nouseva.visible = tila.aamu;
      aurat.forEach((a) => { a.visible = !tila.aamu; });
    }
    function paivita(dt, t) {
      if (lumi.points.visible) {
        for (let i = 0; i < 1400; i++) {
          let y = lumi.pos[i * 3 + 1] - lumi.nopeus[i] * dt, x = lumi.pos[i * 3] + dt * 6;
          if (y < 0) y = 22; if (x > 45) x = -45;
          lumi.pos[i * 3 + 1] = y; lumi.pos[i * 3] = x;
        }
        lumi.points.geometry.attributes.position.needsUpdate = true;
      }
      for (let i = 0; i < 60; i++) { let y = hoyry.pos[i * 3 + 1] + hoyry.nopeus[i] * dt; if (y > 9) y = 4.6; hoyry.pos[i * 3 + 1] = y; }
      hoyry.points.geometry.attributes.position.needsUpdate = true;
      reunavalot.forEach((l, i) => { l.material.emissiveIntensity = 2 + Math.sin(t * 3 - i * 0.3) * 0.8; });
      koneet.forEach((k) => { k.userData.vilkku.material.emissiveIntensity = Math.sin(t * 4) > 0.6 ? 4 : 0.2; });
      torniValo.material.emissiveIntensity = Math.sin(t * 2) > 0 ? 3.5 : 0.3;
      aurat.forEach((a, i) => { a.position.x = -24 + ((t * 3 + i * 18) % 60); a.userData.valo.material.emissiveIntensity = Math.sin(t * 9 + i) > 0 ? 4 : 0.2; });
      ihmiset.forEach((h, i) => { h.rotation.y = Math.sin(t * 0.7 + i) * 0.3; });
      if (nouseva.visible) {
        const s = (t * 0.12) % 1;
        nouseva.position.set(-40 + s * 90, Math.max(0, (s - 0.4) * 30), -38);
        nouseva.rotation.z = s > 0.4 ? 0.12 : 0;
      }
    }

    const kohtaukset = {
      kansi:     { kamera: [-14, 3.2, 16],  kohde: [6, 5, -14],    tila: {} },
      kentta:    { kamera: [-10, 12, 30],   kohde: [4, 2, -16],    tila: {} },
      torni:     { kamera: [22, 8, 2],      kohde: [30, 18, -14],  tila: {} },
      kiitotie:  { kamera: [-26, 3.5, -26], kohde: [-6, 1, -38],   tila: {} },
      aula:      { kamera: [-3, 2.2, 9],    kohde: [-3, 2, -2],    tila: {} },
      ravintola: { kamera: [-24, 2.6, 7],   kohde: [-28, 2.2, -3], tila: {} },
      bussi:     { kamera: [4, 3, 13],      kohde: [12, 1.8, 5],   tila: {} },
      hotelli:   { kamera: [22, 4, 24],     kohde: [32, 5, 9],     tila: {} },
      loppu:     { kamera: [-8, 6, 22],     kohde: [6, 4, -30],    tila: { aamu: true } }
    };
    return { kohtaukset, oletus: "kentta", asetaTila, paivita };
  }

};

/* ---------- Käynnistys (lopussa, jotta MAAILMAT on määritelty) ---------- */
if (!webglToimii()) { console.info("[tausta3d] WebGL ei käytössä – tasainen tausta."); }
else { kaynnista(); }
