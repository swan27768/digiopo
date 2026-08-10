/* ============================================================
   DigiOpo – Opettajan muokkaustila -keskus (etusivu)
   - Yksi keskeinen paikka: kirjautuminen, omat ryhmät, aikataulut, jako.
   - Osiojärjestys muokataan luokkasivulla → keskus ohjaa sinne napilla
     (/Nluokka?tili_ryhma=KOODI[&aikataulu=1]).
   - Valtuutus tulee opettajan istunnosta (lisenssieväste + omistajuus).
   ============================================================ */
(function () {
  "use strict";

  var API_J = "/api/jarjestys";
  var API_L = "/api/lisenssi";
  var SUPABASE_URL = "https://uiqjrhaoumxwshnojtyn.supabase.co";
  var SUPABASE_ANON = "sb_publishable_hTXgi8AA2p94327GlrdjmA_aTrJOqCA";
  var SB_CDN = "/vendor/supabase/supabase.js";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function post(url, payload, headers) {
    return fetch(url, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, headers || {}),
      body: JSON.stringify(payload || {}),
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, virhe: "verkko" }; });
  }

  // ── Supabase-sessio → opettajaeväste (jos suoraan omat_ryhmat ei vielä käy) ──
  var _sb = null;
  function lataaSb() {
    return new Promise(function (resolve, reject) {
      if (_sb) return resolve(_sb);
      function tee() { try { _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON); resolve(_sb); } catch (e) { reject(e); } }
      if (window.supabase) return tee();
      var s = document.createElement("script");
      s.src = SB_CDN; s.onload = tee; s.onerror = function () { reject(new Error("supabase-js ei latautunut")); };
      document.head.appendChild(s);
    });
  }
  function varmistaOpettajaEvaste() {
    return lataaSb().then(function (db) {
      return db.auth.getSession().then(function (res) {
        var session = res && res.data && res.data.session;
        if (!session) return false;
        return post(API_L, {}, { Authorization: "Bearer " + session.access_token }).then(function (v) { return !!(v && v.ok); });
      });
    }).catch(function () { return false; });
  }

  // ── Tyylit (self-contained) ──
  function lisaaTyylit() {
    if (document.getElementById("ope-keskus-tyylit")) return;
    var st = document.createElement("style");
    st.id = "ope-keskus-tyylit";
    st.textContent = [
      ".ope-keskus-nappi{position:fixed;right:16px;bottom:16px;z-index:9998;background:#2b3350;color:#f4f5fb;border:1px solid rgba(255,255,255,.14);border-radius:.7rem;padding:.7rem 1.15rem;font-size:.92rem;font-weight:600;letter-spacing:.01em;cursor:pointer;box-shadow:0 6px 20px rgba(20,18,48,.32);font-family:inherit;transition:background .18s,transform .15s}",
      ".ope-keskus-nappi:hover{background:#38426a;transform:translateY(-1px)}",
      ".ope-keskus-overlay{position:fixed;inset:0;z-index:10002;display:flex;align-items:flex-start;justify-content:center;background:rgba(31,17,71,.55);padding:24px 12px;overflow:auto}",
      ".ope-keskus{width:min(96vw,600px);background:#fff;color:#1f1147;border-radius:.9rem;padding:1.3rem;box-shadow:0 12px 40px rgba(0,0,0,.35);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}",
      ".ok-head{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:1.15rem;margin-bottom:1rem;gap:.6rem}",
      ".ok-sulje{background:none;border:1px solid #ddd6fe;border-radius:.5rem;width:32px;height:32px;cursor:pointer;color:#4b416b;flex:none}",
      ".ok-tila{color:#6b5f88}",
      ".ok-email{font-size:.82rem;color:#8b7fb0;margin:0 0 .8rem}",
      ".ok-nappi{display:inline-block;background:#7c3aed;color:#fff;border:none;border-radius:.6rem;padding:.6rem 1rem;font-size:.95rem;font-weight:700;cursor:pointer;text-decoration:none;font-family:inherit}",
      ".ok-nappi:hover{background:#6d28d9}",
      ".ok-kortti{border:1px solid #e6ddf5;border-radius:.7rem;padding:.8rem .9rem;margin-bottom:.7rem;background:#faf8ff}",
      ".ok-kortti-head{display:flex;justify-content:space-between;align-items:baseline;gap:.6rem;margin-bottom:.5rem}",
      ".ok-nimi{font-weight:700;font-size:1rem}",
      ".ok-koodi{font-family:ui-monospace,Menlo,monospace;font-size:.85rem;color:#6d28d9}",
      ".ok-rivi{display:flex;align-items:center;flex-wrap:wrap;gap:.35rem;margin:.35rem 0}",
      ".ok-lbl{font-size:.8rem;color:#6b5f88;margin-right:.2rem;min-width:96px}",
      ".ok-mini{background:#fff;border:1px solid #ddd6fe;border-radius:.45rem;padding:.3rem .6rem;font-size:.83rem;cursor:pointer;color:#4b416b;font-family:inherit}",
      ".ok-mini:hover{border-color:#7c3aed}",
      ".ok-jako{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;background:#efeaf9;border-radius:.35rem;padding:.2rem .45rem;word-break:break-all}",
      ".ok-alanapit{display:flex;align-items:center;gap:.8rem;flex-wrap:wrap;margin-top:1rem}",
    ].join("");
    document.head.appendChild(st);
  }

  // ── Keskus-modaali ──
  function avaaKeskus() {
    if (document.querySelector(".ope-keskus-overlay")) return;
    var overlay = document.createElement("div");
    overlay.className = "ope-keskus-overlay";
    overlay.innerHTML =
      '<div class="ope-keskus"><div class="ok-head"><span>Hallintapaneeli</span>' +
      '<button type="button" class="ok-sulje" title="Sulje">✕</button></div>' +
      '<div class="ok-body"><p class="ok-tila">Tarkistetaan kirjautumista…</p></div></div>';
    document.body.appendChild(overlay);
    var q = function (s) { return overlay.querySelector(s); };
    function sulje() { overlay.remove(); }
    overlay.addEventListener("click", function (e) { if (e.target === overlay) sulje(); });
    q(".ok-sulje").addEventListener("click", sulje);

    function lataa() {
      q(".ok-body").innerHTML = '<p class="ok-tila">Tarkistetaan kirjautumista…</p>';
      post(API_J, { toiminto: "omat_ryhmat" }).then(function (v) {
        if (v && v.ok) return renderRyhmat(v.email, v.ryhmat || []);
        // eväste ei vielä asetettu → yritä supabase-sessiosta
        varmistaOpettajaEvaste().then(function (ok) {
          if (!ok) return renderKirjaudu();
          post(API_J, { toiminto: "omat_ryhmat" }).then(function (v2) {
            if (v2 && v2.ok) renderRyhmat(v2.email, v2.ryhmat || []);
            else renderKirjaudu();
          });
        });
      });
    }

    function renderKirjaudu() {
      q(".ok-body").innerHTML =
        '<p style="color:#556">Kirjaudu opettajana sähköpostilla, niin voit hallita ryhmiäsi: osiojärjestys, aikataulut ja jakolinkit.</p>' +
        '<a class="ok-nappi" href="/kirjaudu.html">Kirjaudu opettajana →</a>';
    }

    function renderRyhmat(email, ryhmat) {
      var html = '<p class="ok-email">Kirjautunut: <strong>' + esc(email || "") + '</strong>' +
        ' <button type="button" class="ok-ulos" style="background:none;border:none;padding:0;margin-left:8px;font-size:.78rem;color:#b91c1c;text-decoration:underline;cursor:pointer">Kirjaudu ulos</button></p>';
      if (!ryhmat.length) {
        html += '<p style="color:#556;margin:.2rem 0 .6rem">Ei vielä ryhmiä. Luo ensimmäinen alta.</p>';
      } else {
        html += ryhmat.map(function (r) {
          var nimi = r.nimi ? esc(r.nimi) : "(nimetön ryhmä)";
          return '<div class="ok-kortti" data-koodi="' + esc(r.ryhmakoodi) + '">' +
            '<div class="ok-kortti-head"><span class="ok-nimi">' + nimi + '</span><span class="ok-koodi">' + esc(r.ryhmakoodi) + '</span></div>' +
            '<div class="ok-rivi"><span class="ok-lbl">Osiojärjestys:</span>' + [7, 8, 9].map(function (l) { return '<button type="button" class="ok-mini" data-jarj="' + l + '">' + l + '. lk</button>'; }).join("") + '</div>' +
            '<div class="ok-rivi"><span class="ok-lbl">Aikataulu:</span>' + [7, 8, 9].map(function (l) { return '<button type="button" class="ok-mini" data-aika="' + l + '">' + l + '. lk</button>'; }).join("") + '</div>' +
            '<div class="ok-rivi"><span class="ok-lbl">Jaa oppilaille:</span> <code class="ok-jako">' + esc(r.ryhmakoodi) + '</code> <button type="button" class="ok-mini ok-kopioi">Kopioi koodi</button></div>' +
            '<div class="ok-rivi"><button type="button" class="ok-mini ok-poista" style="color:#b91c1c;border-color:#e0a3a3">🗑 Poista ryhmä</button></div>' +
          '</div>';
        }).join("");
      }
      html += '<div class="ok-alanapit"><button type="button" class="ok-nappi ok-luo">➕ Luo uusi ryhmä</button></div>';
      q(".ok-body").innerHTML = html;
      kytke();
    }

    function kytke() {
      // Uloskirjautuminen. Lisenssieväste on pitkäikäinen (~300 vrk), joten
      // ilman tätä koulun yhteiskone jäisi opettajana kirjautuneeksi lähes
      // vuodeksi. Eväste on HttpOnly → tyhjennys vaatii palvelinkutsun.
      var ulos = q(".ok-body").querySelector(".ok-ulos");
      if (ulos) ulos.addEventListener("click", function () {
        if (!window.confirm("Kirjaudutaanko ulos?\n\nTältä laitteelta poistuu myös pääsy sisältöön. Käytä tätä aina yhteiskoneella.")) return;
        ulos.disabled = true; ulos.textContent = "Kirjataan ulos…";
        fetch("/api/lisenssi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toiminto: "kirjaudu_ulos" })
        }).then(function () {
          // HUOM avainten nimet: lisenssiportti käyttää ALAVIIVAA, ryhmätiedot
          // VÄLIVIIVAA. digiopo_laite jätetään – se on laitetunniste käytön
          // seurantaa varten, ja sen poisto vääristäisi laitemäärät.
          try {
            localStorage.removeItem("digiopo_lisenssi");
            localStorage.removeItem("digiopo-ope-ryhma");
            localStorage.removeItem("digiopo-ryhma");
            localStorage.removeItem("digiopo-ryhmalista");

            // ⚠️ PAKOLLINEN: myös Supabasen auth-istunto pois.
            //
            // opettaja-keskus.js:n varmistaOpettajaEvaste() lukee Supabase-
            // istunnon localStoragesta ja luo sen perusteella lisenssievästeen
            // UUDELLEEN. Pelkkä evästeen poisto ei siis riitä – käyttäjä
            // kirjautuisi hiljaa takaisin sisään seuraavalla hallintasivun
            // avauksella, ja yhteiskone jäisi kirjautuneeksi.
            //
            // supabase-js tallentaa avaimeen sb-<projekti>-auth-token.
            // Poistetaan kaikki sitä muotoa olevat, jottei avain ole
            // kovakoodattu projektitunnukseen.
            var poistettavat = [];
            for (var i = 0; i < localStorage.length; i++) {
              var avain = localStorage.key(i);
              if (avain && /^sb-.+-auth-token(\.\d+)?$/.test(avain)) poistettavat.push(avain);
            }
            poistettavat.forEach(function (a) { localStorage.removeItem(a); });
          } catch (e) {}
          // Kirjautumissivulle eikä etusivulle: jos opettaja on jo etusivulla,
          // ohjaus "/"-osoitteeseen ei näyttäisi tapahtuvan mitään ja käyttäjä
          // luulisi painikkeen olevan rikki. replace() ei jätä historiamerkintää,
          // joten paluunuoli ei vie takaisin kirjautuneeseen näkymään.
          window.location.replace("/kirjaudu.html?uloskirjattu=1");
        }).catch(function () {
          ulos.disabled = false; ulos.textContent = "Kirjaudu ulos";
          window.alert("Uloskirjautuminen epäonnistui. Tarkista verkkoyhteys.");
        });
      });

      Array.prototype.forEach.call(q(".ok-body").querySelectorAll(".ok-kortti"), function (kortti) {
        var koodi = kortti.getAttribute("data-koodi");
        Array.prototype.forEach.call(kortti.querySelectorAll("[data-jarj]"), function (b) {
          b.addEventListener("click", function () { location.href = "/" + b.getAttribute("data-jarj") + "luokka?tili_ryhma=" + encodeURIComponent(koodi); });
        });
        Array.prototype.forEach.call(kortti.querySelectorAll("[data-aika]"), function (b) {
          b.addEventListener("click", function () { location.href = "/" + b.getAttribute("data-aika") + "luokka?tili_ryhma=" + encodeURIComponent(koodi) + "&aikataulu=1"; });
        });
        var kop = kortti.querySelector(".ok-kopioi");
        if (kop) kop.addEventListener("click", function () {
          if (navigator.clipboard) navigator.clipboard.writeText(koodi).then(function () {
            var o = kop.textContent; kop.textContent = "Kopioitu ✓"; setTimeout(function () { kop.textContent = o; }, 1500);
          });
        });
        var pois = kortti.querySelector(".ok-poista");
        if (pois) pois.addEventListener("click", function () {
          if (!window.confirm("Poistetaanko ryhmä " + koodi + " pysyvästi?\n\nTämä poistaa myös ryhmän osiojärjestyksen ja aikataulun. Ei voi perua.")) return;
          post(API_J, { toiminto: "poista_oma", ryhma: koodi, vahvista: koodi }).then(function (r) { if (r && r.ok) lataa(); else alert("Poisto epäonnistui."); });
        });
      });

      var luo = q(".ok-luo");
      if (luo) luo.addEventListener("click", function () {
        var nimi = window.prompt("Anna ryhmälle nimi (esim. 7A). Voit jättää tyhjäksi.", "");
        if (nimi === null) return;
        var koulukoodi = null;
        try { var lis = JSON.parse(localStorage.getItem("digiopo_lisenssi") || "null"); if (lis) koulukoodi = lis.koodi || lis.koulu || null; } catch (e) {}
        luo.disabled = true; luo.textContent = "Luodaan…";
        post(API_J, { toiminto: "luo_oma", nimi: nimi.trim(), koulukoodi: koulukoodi }).then(function (r) {
          if (r && r.ok) lataa();
          else { luo.disabled = false; luo.textContent = "➕ Luo uusi ryhmä"; alert("Ryhmän luonti epäonnistui."); }
        });
      });

    }

    lataa();
  }

  // ── Kelluva nappi etusivulle ──
  document.addEventListener("DOMContentLoaded", function () {
    lisaaTyylit();
    if (document.querySelector(".ope-keskus-nappi")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ope-keskus-nappi";
    b.textContent = "Hallintapaneeli";
    b.addEventListener("click", avaaKeskus);
    document.body.appendChild(b);
  });
})();
