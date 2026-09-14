// DigiOpo – Tehtävien ratkaisut ja opettajan ohjeet (palvelinpuolinen suojaus)
//
// GET /api/ratkaisu?tehtava=murhamysteeri
//   → 200 { ok:true, html:"<opettajan ohje + ratkaisu>" }   VAIN opettajaistunnossa
//   → 401 { ok:false, virhe:"ei_opettajaistuntoa" }         oppilaalle / kirjautumattomalle
//
// TARKOITUS: ratkaisua EI ole missään staattisessa tiedostossa, jonka oppilas voi
// ladata. Teksti lähetetään selaimeen vasta kun pyyntö tulee opettajan istunnossa
// (digiopo_lisenssi-eväste, typ === 'opettaja'). Näin oppilas ei löydä vastausta
// sivun lähdekoodista (Ctrl+U), kehittäjätyökaluista eikä suoralla API-kutsulla.
//
// Koulukoodilla kirjautunut oppilas (typ === 'koulu') EI läpäise tarkistusta.
//
// TÄRKEÄÄ: Cache-Control: private, no-store → CDN ei koskaan välimuisti opettajan
// vastausta (muuten se voisi vuotaa oppilaalle). Fail-closed: jos maksumuuri on pois
// päältä (ei LISENSSI_JWT_SECRET-muuttujaa), haeOpettajaIstunto palauttaa null → 401.

import { haeOpettajaIstunto } from './_lib/opettaja.js';
import { kirjaaVirhe } from './_lib/virhelogi.js';

// Opettajan ohje + ratkaisu tehtäväavaimen mukaan. HTML renderöityy tehtäväsivun
// valmiilla CSS-luokilla (.ratkaisu-box, .t-card, .t-table, .tavoite-grid, .t-vinkki).
// Uuden tehtävän ratkaisu lisätään tähän objektiin omalla avaimellaan.
const SISALTO = {
  murhamysteeri: `
    <div class="ratkaisu-box">
      <h2>✅ RATKAISU — EI OPPILAILLE</h2>
      <p><strong>Tekijä: Hanna Lehtinen (vahtimestari)</strong></p>
      <p><strong>Tapa:</strong> Hanna sammutti valot klo 14:15 vahtimestarin huoneestaan, poimi kellon vitriinistä pimeässä ja piilotti sen siivousvaunuun — jonka vei ulos klo 14:28.</p>
      <p><strong>Motiivi:</strong> Hanna oli ollut sairaslomalla taloushuolien takia — tarvitsi rahaa nopeasti. Tiesi antiikkikellon suuren arvon.</p>
      <p style="margin-top:.5rem;"><strong>Ratkaisevat todisteet:</strong> Vihjekortti D (kamera + vaunu) + Vihjekortti A (valot) + Vihjekortti C (taloushuolet)</p>
    </div>

    <div class="t-card">
      <h2>⏱ Rakenne ja ajoitus</h2>
      <table class="t-table">
        <thead><tr><th>Vaihe</th><th>Aika</th><th>Toiminta</th></tr></thead>
        <tbody>
          <tr><td><strong>Johdanto</strong></td><td style="white-space:nowrap">3 min</td><td>Lue tapauksen kuvaus ääneen. Jaa vihjekortti A–D, yksi per oppilas.</td></tr>
          <tr><td><strong>Ryhmätyö</strong></td><td style="white-space:nowrap">20 min</td><td>Oppilaat jakavat tietoa puhumalla — kortteja ei saa näyttää.</td></tr>
          <tr><td><strong>Päätelmä</strong></td><td style="white-space:nowrap">5 min</td><td>Ryhmä täyttää päätelmälomakkeen yhdessä.</td></tr>
          <tr><td><strong>Purku</strong></td><td style="white-space:nowrap">10 min</td><td>Paljasta ratkaisu. Keskustele: mikä vihje ratkaisi? Mitä ajattelutapaa käytettiin?</td></tr>
        </tbody>
      </table>
    </div>

    <div class="t-card">
      <h2>🎯 Pedagogiset tavoitteet</h2>
      <div class="tavoite-grid">
        <div class="tavoite-item"><strong>🔍 Kriittinen</strong>Opitaan kyseenalaistamaan alibit ja arvioimaan tiedon luotettavuutta.</div>
        <div class="tavoite-item"><strong>🧩 Looginen</strong>Päättelyketjun rakentaminen yksittäisistä vihjeistä kokonaisuudeksi.</div>
        <div class="tavoite-item"><strong>💡 Lateraalinen</strong>Vaihtoehtoisten selitysten keksiminen — miksi Liisan piirros ei ole todiste.</div>
        <div class="tavoite-item"><strong>🪞 Reflektiivinen</strong>Päätelmälomakkeen kysymys 6 ohjaa prosessin arviointiin.</div>
      </div>
    </div>

    <div class="t-card">
      <h2>💡 Vinkkejä</h2>
      <ul>
        <li>Jos ryhmä jumittuu: kehota tarkistamaan ajoitukset uudelleen — Vihjekortti A + D yhdessä ratkaisevat asian.</li>
        <li>Lisää haastetta: piilota Vihjekortti D ja anna se vasta 10 min kuluttua, jos ryhmä ei edisty.</li>
        <li>Isompi ryhmä: tulosta kaksi sarjaa vihjeitä, voit antaa kahdelle oppilaalle saman kortin.</li>
        <li>Murhamysteerin jälkeen oppilaat voivat jatkaa ajattelupelissä ja tunnistaa mitä ajattelutapoja he juuri käyttivät.</li>
      </ul>
      <div class="t-vinkki">
        <strong>📎 Tulostusohje</strong>
        Tulosta yksi dokumentti per ryhmä. Leikkaa vihjekortti A, B, C ja D erilleen. Jaa yksi kortti kullekin ryhmän jäsenelle. Päätelmälomake jää ryhmälle yhteiseksi.
      </div>
    </div>

    <div class="t-card" style="margin-bottom:2rem;">
      <h2>♿ Saavutettavuus</h2>
      <ul>
        <li>Korttien lukeminen ei vaadi erityistaitoja — tiedot voidaan lukea ääneen toiselle.</li>
        <li>Muistiinpanot voi tehdä myös piirtämällä tai symboleilla.</li>
        <li>Isommalle ryhmälle sama kortti voidaan antaa kahdelle oppilaalle.</li>
        <li>Hiljaisempi oppilas voi toimia "kirjurina" joka täyttää lomakkeen.</li>
      </ul>
    </div>
`,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // EI välimuistia: opettajakohtainen sisältö ei saa päätyä CDN:ään eikä oppilaalle.
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  try {
    // Valtuutus: vain opettajaistunto (typ === 'opettaja') pääsee sisältöön.
    const opettaja = await haeOpettajaIstunto(req);
    if (!opettaja) {
      return res.status(401).json({ ok: false, virhe: 'ei_opettajaistuntoa' });
    }

    const tehtava = String((req.query && req.query.tehtava) || '').trim();
    const html = Object.prototype.hasOwnProperty.call(SISALTO, tehtava) ? SISALTO[tehtava] : null;
    if (!html) {
      return res.status(404).json({ ok: false, virhe: 'tehtavaa_ei_loydy' });
    }

    return res.status(200).json({ ok: true, html });
  } catch (err) {
    console.error('ratkaisu GET:', err);
    await kirjaaVirhe('ratkaisu GET', err);
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
