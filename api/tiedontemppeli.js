// DigiOpo – Tiedon Temppeli API (palvelinvetoinen: vastaukset + pisteet)
// ─────────────────────────────────────────────────────────────
// GET  /api/tiedontemppeli?toiminto=tulostaulu       → { ok, tulokset[] }
// POST /api/tiedontemppeli  (body.toiminto ratkaisee):
//   peli_aloita     { series }                                   → { ok, token }
//   peli_avaa       { token, round, q }                          → { ok, token, sekunnit }   (käynnistää kysymyksen kellon PALVELIMELLA)
//   peli_vastaa     { token, round, q, valinta }                 → { ok, oikein, pisteet?, selitys?, total, token }
//   peli_aikakatkaisu { token, round, q }                        → { ok, oikea, selitys, total, token }  (vain kun aika on oikeasti kulunut)
//   peli_tallenna   { token, id, nimi, koulu, luokka }           → { ok, saved }
//
// TURVA: oikeat vastaukset JA selitykset ovat VAIN täällä palvelimella – niitä ei
// lähetetä selaimeen, joten oppilas ei löydä niitä sivun lähdekoodista. Pisteet
// lasketaan ja kootaan palvelimella allekirjoitettuun tokeniin (HMAC), joten
// tulostauluun ei voi kirjata keksittyä pistemäärää.
//
// AIKA: kysymyksen kello käynnistyy palvelimella (peli_avaa) ja aikabonus lasketaan palvelimen
// kellosta (vastaushetki − avaushetki). Selain ei lähetä aikaa. Jos Upstash Redis on konfiguroitu,
// avaushetki ja "kysymys käsitelty" -lukko tallennetaan sinne, jolloin vanhan tokenin uudelleenkäyttö
// ei nollaa kelloa eikä anna pisteitä vastauksesta, joka on jo paljastettu aikakatkaisussa.
// Ilman Redisiä sama toimii tokenin sisällä (heikompi: vanhan tokenin voi toistaa).

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';
import { rateLimitSallittu } from './_lib/rate.js';
import { luoToken, tarkistaToken } from './_lib/token.js';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Peli-tokenin allekirjoitus. Käytä lisenssisalaisuutta; devissä (ei muuria)
// varasalaisuus, jotta peli toimii – vastaukset ovat silti palvelimella.
// TUOTANNOSSA ei saa käyttää varasalaisuutta: se olisi julkinen (löytyy koodista), jolloin kuka
// tahansa voisi väärentää tokenin ja kirjata keksityn pistemäärän tulostauluun. Siksi tuotannossa
// puuttuva LISENSSI_JWT_SECRET pysäyttää pelin (500) eikä putoa heikkoon oletukseen.
const ON_TUOTANTO = process.env.VERCEL_ENV === 'production';
const PELI_SECRET = process.env.LISENSSI_JWT_SECRET
  || (ON_TUOTANTO ? null : 'temppeli-dev-secret-2025');

// ── Rate limit: jaettu Redis-laskuri (ks. _lib/rate.js) ───────
const RL_MAX = 3000;         // POST-toimintoja per IP / 10 min. Peli tekee ~50/oppilas, ja
                             // koulussa kymmenet oppilaat jakavat saman IP:n (NAT) → korkea raja.
const RL_IKKUNA_S = 10 * 60; // 10 minuutin ikkuna

// ── Pelin pisteytys (samat arvot kuin pelissä) ────────────────
const Q_TIME     = 30;                 // sekuntia per kysymys
const BASE_PTS   = [100, 150, 200];    // kierros 1,2,3
const MAX_BONUS  = 60;                 // maksimi aikabonus
const KYS_PER_KIERROS = 10;
const VAARIN_SAKKO = 20;               // pistevähennys väärästä vastauksesta (kerran per vaihtoehto)
const ALKU_ARMO_S  = 1.5;              // verkkoviive: ensimmäiset sekunnit eivät syö bonusta
const VASTAUS_ARMO_S = 3;              // vastaus hyväksytään vielä Q_TIME + tämä jälkeen (viive)
const AIKAKATKAISU_ARMO_S = 2;         // aikakatkaisu sallitaan aikaisintaan Q_TIME − tämä
const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Yksi Redis-komento Upstashin REST-rajapinnalla. Palauttaa null, jos Redis puuttuu/virhe (→ varatila).
async function redis(...komento) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const r = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(komento),
    });
    const j = await r.json();
    return j.result ?? null;
  } catch { return null; }
}
const avaaAvain  = (sid, tag) => `tt:av:${sid}:${tag}`;
const lukkoAvain = (sid, tag) => `tt:lk:${sid}:${tag}`;
async function onLukittu(sid, tag) { return (await redis('EXISTS', lukkoAvain(sid, tag))) === 1; }
async function lukitse(sid, tag)   { await redis('SET', lukkoAvain(sid, tag), '1', 'EX', 7200); }

// Kysymyksen avaushetki (ms): Redis ensisijainen, muuten tokenissa oleva. NX = ensimmäinen avaus voittaa.
async function haeAvausHetki(tila, tag, nyt, luoJosPuuttuu) {
  const avain = avaaAvain(tila.sid, tag);
  if (luoJosPuuttuu) {
    const asetettu = await redis('SET', avain, String(nyt), 'NX', 'EX', 7200);
    if (asetettu === 'OK') return nyt;
  }
  const v = await redis('GET', avain);
  if (v && Number.isFinite(Number(v))) return Number(v);
  const tokenissa = Number(tila.avattu[tag]);
  return Number.isFinite(tokenissa) && tokenissa > 0 ? tokenissa : null;
}

// Vastausavain + selitykset: [sarja][kierros0-2][kysymys0-9] = { c: oikeaIndeksi, e: selitys }
const VASTAUSAVAIN = [[[{"c":1,"e":"2,40 € × 5 päivää × 2 viikkoa = 24,00 €"},{"c":1,"e":"Viesti kertoo, että Tero on toistuvasti laiminlyönyt tehtäviään – vanhemmat huolestuvat."},{"c":1,"e":"Kännykät ja tietokoneet ovat moderneja keksintöjä – 200 vuotta sitten niitä ei ollut olemassa."},{"c":1,"e":"Vesi ja vesipitoiset nesteet laajenevat jäätyessään – siksi pullo pullistui."},{"c":1,"e":"\"I would like...\" on kohteliaampi, ja \"loaf of bread\" on oikea ilmaisu leivälle englanniksi."},{"c":0,"e":"Ruotsissa \"glas\" = lasi ja \"glass\" = jäätelö. Sara tilasi vahingossa lasin vettä!"},{"c":1,"e":"Lämmittely valmistelee lihakset ja nivelet rasitukseen, mikä vähentää loukkaantumisriskiä."},{"c":2,"e":"Huilu on puhallinsoitin. Viulu on jousisoitin ja rummut on lyömäsoitin."},{"c":0,"e":"Yhteyttämisessä kasvit tuottavat energiaa auringonvalolla, vedellä ja CO₂:lla vapauttaen happea."},{"c":1,"e":"Viro on Suomen naapurimaa Suomenlahden eteläpuolella."}],[{"c":0,"e":"45 € on 75 % alkuperäisestä hinnasta. 45 ÷ 0,75 = 60 €."},{"c":0,"e":"Artikkeli herättää huolta: nuorten unenpuute on kasvava ongelma, johon yhteiskunnan pitäisi reagoida."},{"c":2,"e":"Kriittinen medialukutaito: ennen jakamista kannattaa aina tarkistaa lähde ja etsiä vahvistusta luotettavista medioista."},{"c":2,"e":"Yksi lentomatka tuottaa moninkertaisesti enemmän CO₂ kuin valojen sammuttaminen tai muovipussit koko vuodelta."},{"c":1,"e":"Venäjän vallankumous 1917 kaatoi tsaarin vallan, jolloin Suomella oli tilaisuus julistautua itsenäiseksi."},{"c":2,"e":"Tummat värit absorboivat lähes kaiken auringonsäteilyn, vaaleat heijastavat sen pois – siksi tummat vaatteet lämpiävät enemmän."},{"c":1,"e":"\"Agree\" on verbi, jota ei voi yhdistää \"am\"-apuverbiin tässä muodossa. Oikein: \"I agree with you\"."},{"c":1,"e":"\"Jag är kall\" tarkoittaa \"olen kylmä/tunteeton ihmisenä\". Oikein on \"Jag har kallt\" = minulla on kylmä."},{"c":1,"e":"Ekosysteemit ovat herkkiä verkostoja: yhden lajin katoaminen voi laukaista ketjureaktion, joka vaikuttaa kymmeniin muihin lajeihin."},{"c":0,"e":"Maan akselin kaltevuuden takia pohjoiset alueet, kuten Suomi, saavat kesällä aurinkoa lähes ympäri vuorokauden."}],[{"c":0,"e":"45 € × 0,70 = 31,50 € per lippu. 31,50 × 2 = 63 €."},{"c":1,"e":"Mainoksissa luvut voivat olla harhaanjohtavia: pieni otanta tai valikoitu ryhmä voi antaa vääristyneen kuvan."},{"c":2,"e":"Deepfake-teknologia voi luoda erittäin realistisia väärennettyjä videoita – kriittinen medialukutaito on tärkeämpää kuin koskaan."},{"c":1,"e":"Pitkät kuljetusmatkat – erityisesti lentokoneella – tuottavat huomattavasti enemmän CO₂ kuin lähellä tuotettu ruoka."},{"c":1,"e":"Teollistuminen muutti yhteiskunnan rakenteen: koneet korvasivat käsityöläiset, ja kasvava teollisuus tarvitsi työvoimaa kaupungeissa."},{"c":2,"e":"Lämpölaajeneminen: ilman rakoja silta voisi vääristyä tai murtua lämpötilojen vaihtuessa."},{"c":1,"e":"Englanniksi oikea rakenne on \"different from\", ei \"different than\" – vaikka \"than\" on arkikielessä yleinen."},{"c":1,"e":"\"Tycka om\" = pitää jostakin. \"Att läsa\" = lukea. \"Böcker\" = kirjat. Lause: \"Pidän kirjojen lukemisesta.\""},{"c":1,"e":"Bakteerit ja virukset ovat täysin eri asioita. Antibiootit häiritsevät bakteerien solurakennetta – viruksiin ne eivät tehoa lainkaan."},{"c":1,"e":"Demokratiassa valta kuuluu kansalle ja jokainen ääni on yhtä arvokas – enemmistön valta ei kuitenkaan saa loukata vähemmistön oikeuksia."}]],[[{"c":1,"e":"Poikia on 16 (28 − 12). 16 ÷ 28 × 100 ≈ 57 %."},{"c":1,"e":"Yhdyssana koostuu kahdesta tai useammasta sanasta: koira + pentu = koiranpentu."},{"c":2,"e":"Suomi itsenäistyi 1917, toinen maailmansota alkoi 1939 ja ihminen laskeutui Kuulle 1969."},{"c":0,"e":"Vesi laajenee jäätyessään – jää on harvinaisella tavalla kevyempää kuin nestemäinen vesi, siksi se kelluu."},{"c":1,"e":"'She doesn't' on oikein – kolmannen persoonan yksikkö tarvitsee 'does not' (doesn't)."},{"c":1,"e":"God morgon = hyvää huomenta. God natt = hyvää yötä. God kväll = hyvää iltaa."},{"c":2,"e":"D-vitamiinia syntyy ihossa UVB-säteilyn vaikutuksesta. Se on tärkeä luustolle ja immuunijärjestelmälle."},{"c":1,"e":"Diatonisessa asteikossa on 7 nuottia: do, re, mi, fa, sol, la, si."},{"c":2,"e":"Selkärankaisilla on selkäranka. Kotilo on nilviäinen, meduusa on selkärangaton – koira on selkärankainen."},{"c":1,"e":"Rovaniemi on pinta-alaltaan Suomen suurin kaupunki, vaikka Helsingissä asuu enemmän ihmisiä."}],[{"c":2,"e":"Vuosi 1: 800 × 1,02 = 816 €. Vuosi 2: 816 × 1,02 = 832,32 €. Koronkorko kasvattaa enemmän kuin yksinkertainen korko."},{"c":1,"e":"Pieni tai valikoitu otanta voi antaa vääristyneen kuvan. Mainoksissa lukuja käytetään usein harhaanjohtavasti."},{"c":1,"e":"Pilvipalveluissa tiedot tallennetaan etäpalvelimille – niitä voi käyttää millä laitteella tahansa internetin kautta."},{"c":1,"e":"Hiilijalanjälki mittaa kaikkia kasvihuonekaasupäästöjä – liikenteestä, energiasta, ruoasta ja kulutuksesta."},{"c":1,"e":"K. J. Ståhlberg toimi Suomen ensimmäisenä presidenttinä 1919–1925."},{"c":1,"e":"Ampeeri mittaa sähkövirran määrää. Voltti mittaa jännitettä, watti tehoa."},{"c":1,"e":"'I am boring' = olen tylsä ihminen. 'I am bored' = minulla on tylsää. Suomalaisille hyvin yleinen virhe."},{"c":1,"e":"'Spela roll' = olla merkitystä. 'Ingen roll' = ei merkitystä. Suomeksi: 'sillä ei ole väliä'."},{"c":2,"e":"Mitokondrio tuottaa solun energian hajottamalla glukoosia. Sitä kutsutaan solun voimalaitokseksi."},{"c":1,"e":"Aasia on selvästi suurin manner: noin 44 miljoonaa km². Afrikka on toiseksi suurin."}],[{"c":0,"e":"15 € × 18 vk = 270 € yhteensä. 40 % × 270 = 108 €."},{"c":1,"e":"Tämä on 'phishing' – huijaus. Oikeat pankit eivät koskaan pyydä tunnuksia tekstiviestillä tai sähköpostilinkissä."},{"c":1,"e":"Tekoäly voi auttaa ideoinnissa, mutta oman ajattelun kehittäminen on koulun tärkein tavoite."},{"c":1,"e":"Sademetsien raivaus palmuöljyviljelmille on yksi suurimmista biodiversiteetin uhkista tropiikissa."},{"c":1,"e":"Kylmässä sodassa USA (kapitalismi) ja Neuvostoliitto (kommunismi) kilpailivat maailmanherruudesta – suoraa sotaa ei ollut, mutta ydinsotaan oli lähellä useaan kertaan."},{"c":1,"e":"10 000 metrin korkeudessa ilmanpaine on kolmannes merenpinnan paineesta – ilman paineistusta matkustajat menettäisivät tajunnan minuuteissa."},{"c":1,"e":"'Stress affects health' (verbi). 'Stress has a negative effect' (substantiivi). Suomalaisille yleinen sekaannus."},{"c":1,"e":"'Kvitto' = kuitti. 'Vill du ha' = haluatko. 'Kontant' = käteinen, 'betala med kort' = maksaa kortilla."},{"c":1,"e":"Antibioottiresistenssi on kasvava maailmanlaajuinen uhka: vajaat kurssit kasvattavat resistenttejä bakteerikantoja."},{"c":1,"e":"Progressiivisessa verotuksessa tulojen kasvaessa myös veroprosentti nousee. Tavoitteena on tasata yhteiskunnan tuloeroja."}]],[[{"c":1,"e":"24 + 24 + 12 = 60. Kolmas hylly on puolillaan: 24 ÷ 2 = 12."},{"c":0,"e":"Vastakkaisia ajatuksia yhdistävän 'mutta'-sanan eteen tulee pilkku suomen kielessä."},{"c":1,"e":"Radio keksittiin 1890-luvulla, televisio 1920-luvulla ja älypuhelin vasta 1990-luvulla."},{"c":1,"e":"Lämmin, kostea uloshengitysilma kohtaa kylmän ilman – kosteus tiivistyy pisaroiksi. Ei savua eikä jäätä, vain vesipisaroita."},{"c":0,"e":"Library = kirjasto. Kirjakauppa = bookshop. Kirjahylly = bookshelf."},{"c":1,"e":"'Bok' = kirja. Kirja monikko = 'böcker'. 'Bok' tarkoittaa myös pyökkipuuta – konteksti ratkaisee!"},{"c":1,"e":"Iho on ihmisen suurin elin – se kattaa koko kehon, suojelee sisäelimiä ja säätelee lämpötilaa."},{"c":2,"e":"Oboe on puupuhallinsoitin. Kitara on kielisoitin. Urut voivat olla pilliurut (puhallin) tai sähköiset."},{"c":1,"e":"Hyönteisellä on kuusi jalkaa ja kolmiosainen keho. Hämähäkki on 8-jalkainen hämähäkkieläin, etana on nilviäinen."},{"c":1,"e":"Halti (1 328 m) on Suomen korkein kohta, sijaitsee Käsivarren Lapissa lähellä Norjan rajaa."}],[{"c":0,"e":"Tarjous A: 7,50 ÷ 3 = 2,50 €/kpl. Tarjous B: 13,00 ÷ 5 = 2,60 €/kpl. A on 10 senttiä halvempi per kappale."},{"c":1,"e":"Kilpailuja ei voiteta yllättäen arvaamatta. Henkilötietopyyntö pelin sisällä on lähes aina huijaus."},{"c":1,"e":"Lähdekoodi on ohjelmoijan kirjoittama teksti. Kääntäjä muuttaa sen tietokoneen ymmärtämäksi binaariseksi kieleksi."},{"c":1,"e":"Pariisin sopimus (2015) tavoittelee lämpenemisen rajoittamista 1,5–2 °C:seen. Tähän tarvitaan merkittäviä päästövähennyksiä kaikissa maissa."},{"c":1,"e":"Neuvostoliiton heikkeneminen ja demokratialiike johtivat muurin kaatumiseen – yksi kylmän sodan symbolisimmista käänteistä."},{"c":1,"e":"Valo kulkee 300 000 km/s – silti tähtienvälinen matka on niin valtava, että näemme tähdet sellaisina kuin ne olivat menneisyydessä."},{"c":1,"e":"Englanniksi oikea rakenne on 'different from', ei 'different than'. Täysin: 'different from Sweden's weather'."},{"c":1,"e":"'Tycka om' = pitää jostakin. 'Att läsa' = lukea. 'Böcker' = kirjat. Lause: 'Pidän kirjojen lukemisesta.'"},{"c":1,"e":"Rokote sisältää heikennettyjä tai tapettuja taudinaiheuttajia. Keho oppii tunnistamaan ne ja puolustautumaan tulevaisuudessa."},{"c":2,"e":"Amazonin sademetsä sijaitsee pääosin Brasiliassa, Etelä-Amerikassa. Se on maailman suurin trooppinen sademetsä."}],[{"c":1,"e":"10 kg säkki on 1,30 € halvempi kuin kaksi 5 kg säkkiä (2 × 4,90 = 9,80 €). Suurempi pakoko on usein edullisempi."},{"c":1,"e":"Katselukerrat eivät tee väitteestä totta. Uutisten levittäminen ennen tarkistamista vahvistaa disinformaatiota."},{"c":1,"e":"Phishing-hyökkäyksissä rikollinen esiintyy pankkina tai viranomaisena. Tavoite on varastaa tunnuksia tai henkilötietoja."},{"c":1,"e":"Mehiläiset ja muut pölyttäjät ovat välttämättömiä 75 %:lle maailman viljelykasveista. Niiden häviäminen romahduttaisi sadontuotannon."},{"c":1,"e":"Apartheid-järjestelmässä mustilla ei ollut äänioikeutta. Nelson Mandela kamppaili sen lopettamiseksi ja toimi myöhemmin Etelä-Afrikan presidenttinä."},{"c":2,"e":"Lämpölaajeneminen: ilman rakoja kesän kuumuus vääntäisi terässillan tai rikkoisi betonirakenteen. Sillat voivat pidentyä useita senttimetrejä kesällä."},{"c":1,"e":"'Nevertheless' = silti, siitä huolimatta. Esimerkki: 'It was raining; nevertheless, we went for a walk.' (= Silti lähdimme kävelylle.)"},{"c":0,"e":"'Förstå' = ymmärtää. 'Förstår du?' = Ymmärrätkö? Vertaa: 'Jag förstår' = minä ymmärrän."},{"c":1,"e":"Higgsin bosonin löytäminen vahvisti vuosikymmenten teoreettisen työn. Peter Higgs ja François Englert saivat siitä fysiikan Nobelin palkinnon 2013."},{"c":1,"e":"Oikeusvaltiossa laki on ylin auktoriteetti. Demokratiassa myös johtajat toimivat lakien rajoissa – ketään ei voi asettaa lain yläpuolelle."}]]];

function sbHeaders(extra = {}) {
  return {
    apikey:        SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Accept:        "application/json",
    ...extra,
  };
}

async function sb(polku, opts = {}) {
  const base = (SUPABASE_URL || "").replace(/\/$/, "");
  const r = await fetch(`${base}/rest/v1/${polku}`, {
    ...opts,
    headers: sbHeaders(opts.headers || {}),
  });
  return r;
}

// Julkinen tulostaulu: vain nimimerkki, koulu ja pisteet (tietosuoja: ei id:tä, luokkaa eikä
// päivämäärää). `oma` kertoo selaimelle, mikä rivi on pelaajan oma, ilman että id paljastuu.
function riviTulokseksi(r, omaId) {
  return {
    name:  r.nimi,
    koulu: r.koulu,
    score: r.pisteet,
    oma:   Boolean(omaId) && r.id === omaId,
  };
}

// ── Peli-token: allekirjoitettu, tamper-proof pelisessio ──────
async function luoPeliToken(tila) {
  return await luoToken({
    typ: 'temppeli',
    sid: tila.sid,
    series: tila.series,
    total: tila.total,
    scored: tila.scored,               // taulukko "kierros-kysymys" merkkijonoja
    avattu: tila.avattu || {},         // { "kierros-kysymys": avaushetki ms }
    vaarat: tila.vaarat || {},         // { "kierros-kysymys": [jo sakotetut väärät vaihtoehdot] }
    iat: Date.now(),
    exp: Date.now() + 2 * 60 * 60 * 1000, // 2 h
  }, PELI_SECRET);
}

async function lueTila(token) {
  const p = token ? await tarkistaToken(token, PELI_SECRET) : null;
  if (!p || p.typ !== 'temppeli') return null;
  if (![0, 1, 2].includes(p.series)) return null;
  if (!Array.isArray(p.scored)) return null;
  const avattu = (p.avattu && typeof p.avattu === 'object' && !Array.isArray(p.avattu)) ? p.avattu : {};
  const vaarat = (p.vaarat && typeof p.vaarat === 'object' && !Array.isArray(p.vaarat)) ? p.vaarat : {};
  return { sid: p.sid, series: p.series, total: Number(p.total) || 0, scored: p.scored, avattu, vaarat };
}

// Poistaa HTML-merkit ja ohjausmerkit pelaajan syöttämästä tekstistä (puolustus XSS:ää vastaan;
// selain escapeaa lisäksi tulostaulun tekstit).
function puhdista(v, max) {
  return String(v || "")
    .replace(/[<>&"`\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function kokluku(v) { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : null; }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "https://app.digiopo.fi");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Pelin vastaukset eivät saa päätyä CDN-välimuistiin
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PELI_SECRET) {
    if (!PELI_SECRET) console.error("tiedontemppeli: LISENSSI_JWT_SECRET puuttuu tuotannosta");
    return res.status(500).json({ ok: false, virhe: "palvelin_ei_konfiguroitu" });
  }

  // ── GET: tulostaulu ──────────────────────────────────────────
  if (req.method === "GET") {
    if (String(req.query.toiminto || "") !== "tulostaulu") {
      return res.status(400).json({ ok: false, virhe: "tuntematon_toiminto" });
    }
    try {
      const r = await sb("tiedontemppeli_tulostaulu?order=pisteet.desc&limit=5&select=id,nimi,koulu,pisteet");
      if (!r.ok) throw new Error(`DB ${r.status}`);
      const rivit = await r.json();
      const omaId = String(req.query.pid || "").slice(0, 80);
      return res.status(200).json({ ok: true, tulokset: rivit.map(rivi => riviTulokseksi(rivi, omaId)) });
    } catch (err) {
      console.error("tiedontemppeli GET:", err);
      await kirjaaVirhe('tiedontemppeli GET', err);
      return res.status(500).json({ ok: false, virhe: "palvelinvirhe" });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, virhe: "metodi_ei_sallittu" });
  }

  // ── Rate limit ───────────────────────────────────────────────
  const ip = haeIp(req);
  if (!(await rateLimitSallittu(`rl:tiedontemppeli:ip:${ip}`, RL_MAX, RL_IKKUNA_S))) {
    return res.status(429).json({ ok: false, virhe: "liikaa_yrityksia" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, virhe: "virheellinen_pyynto" });
  }

  const toiminto = String(body.toiminto || "");

  try {
    // ── peli_aloita: uusi pelisessio ───────────────────────────
    if (toiminto === "peli_aloita") {
      const series = kokluku(body.series);
      if (![0, 1, 2].includes(series)) {
        return res.status(400).json({ ok: false, virhe: "virheellinen_sarja" });
      }
      const token = await luoPeliToken({
        sid: 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        series, total: 0, scored: [], avattu: {}, vaarat: {},
      });
      return res.status(200).json({ ok: true, token });
    }

    // ── peli_avaa: käynnistää kysymyksen kellon PALVELIMELLA ───
    if (toiminto === "peli_avaa") {
      const tila = await lueTila(body.token);
      if (!tila) return res.status(401).json({ ok: false, virhe: "istunto_vanhentunut" });
      const round = kokluku(body.round);
      const q     = kokluku(body.q);
      if (![1, 2, 3].includes(round) || !Number.isInteger(q) || q < 0 || q >= KYS_PER_KIERROS) {
        return res.status(400).json({ ok: false, virhe: "virheellinen_pyynto" });
      }
      const tag = round + "-" + q;
      if (tila.scored.includes(tag) || await onLukittu(tila.sid, tag)) {
        return res.status(200).json({ ok: true, jo: true, token: body.token, sekunnit: Q_TIME });
      }
      const nyt = Date.now();
      const alku = await haeAvausHetki(tila, tag, nyt, true) ?? nyt;
      let token = body.token;
      if (tila.avattu[tag] !== alku) {
        tila.avattu[tag] = alku;
        token = await luoPeliToken(tila);
      }
      const sekunnit = Math.max(0, Math.ceil(Q_TIME - (nyt - alku) / 1000));
      return res.status(200).json({ ok: true, token, sekunnit });
    }

    // ── peli_vastaa: tarkista vastaus, laske pisteet ──────────
    if (toiminto === "peli_vastaa") {
      const tila = await lueTila(body.token);
      if (!tila) return res.status(401).json({ ok: false, virhe: "istunto_vanhentunut" });

      const round   = kokluku(body.round);
      const q       = kokluku(body.q);
      const valinta = kokluku(body.valinta);   // body.aika ohitetaan: kello on palvelimella
      if (![1, 2, 3].includes(round) || !Number.isInteger(q) || q < 0 || q >= KYS_PER_KIERROS || ![0, 1, 2].includes(valinta)) {
        return res.status(400).json({ ok: false, virhe: "virheellinen_pyynto" });
      }

      const avain = VASTAUSAVAIN[tila.series][round - 1][q];
      const tag = round + "-" + q;

      // Jo pisteytetty tai lukittu → ei tuplapisteitä
      if (tila.scored.includes(tag) || await onLukittu(tila.sid, tag)) {
        return res.status(200).json({ ok: true, oikein: (valinta === avain.c), jo: true, total: tila.total });
      }

      // Kulunut aika palvelimen kellolla
      const nyt = Date.now();
      const alku = await haeAvausHetki(tila, tag, nyt, false);
      const kulunut = alku ? (nyt - alku) / 1000 : null;

      if (kulunut !== null && kulunut > Q_TIME + VASTAUS_ARMO_S) {
        // Aika loppui: ei pisteitä, kysymys lukitaan
        tila.scored.push(tag);
        await lukitse(tila.sid, tag);
        const uusiToken = await luoPeliToken(tila);
        return res.status(200).json({ ok: true, oikein: false, aikaloppui: true, oikea: avain.c, selitys: avain.e, total: tila.total, token: uusiToken });
      }

      if (valinta === avain.c) {
        // Ilman tallennettua avaushetkeä: perus­pisteet, ei bonusta
        const jaljella = kulunut === null ? 0
          : Math.max(0, Math.min(Q_TIME, Q_TIME - Math.max(0, kulunut - ALKU_ARMO_S)));
        const bonus = Math.max(0, Math.min(MAX_BONUS, Math.round((jaljella / Q_TIME) * MAX_BONUS)));
        const pisteet = BASE_PTS[round - 1] + bonus;
        tila.total += pisteet;
        tila.scored.push(tag);
        await lukitse(tila.sid, tag);
        const uusiToken = await luoPeliToken(tila);
        return res.status(200).json({
          ok: true, oikein: true, pisteet, bonus, total: tila.total,
          selitys: avain.e, token: uusiToken,
        });
      }

      // Väärin → pistevähennys (kerran per väärä vaihtoehto, ei alle nollan). Oikeaa ei paljasteta, saa yrittää uudelleen.
      const sakotetut = Array.isArray(tila.vaarat[tag]) ? tila.vaarat[tag] : [];
      let sakko = 0, token = body.token;
      if (!sakotetut.includes(valinta)) {
        // Redis estää vanhalla tokenilla arvaamisen ilman sakkoa (SADD palauttaa 0, jos jo sakotettu)
        const uusi = await redis('SADD', `tt:vr:${tila.sid}:${tag}`, String(valinta));
        if (uusi !== 0) {
          sakko = Math.min(VAARIN_SAKKO, tila.total);
          tila.total -= sakko;
          tila.vaarat[tag] = [...sakotetut, valinta];
          token = await luoPeliToken(tila);
        }
      }
      return res.status(200).json({ ok: true, oikein: false, sakko, total: tila.total, token });
    }

    // ── peli_aikakatkaisu: paljasta oikea, 0 pistettä (vain kun aika on oikeasti kulunut) ──
    if (toiminto === "peli_aikakatkaisu") {
      const tila = await lueTila(body.token);
      if (!tila) return res.status(401).json({ ok: false, virhe: "istunto_vanhentunut" });
      const round = kokluku(body.round);
      const q     = kokluku(body.q);
      if (![1, 2, 3].includes(round) || !Number.isInteger(q) || q < 0 || q >= KYS_PER_KIERROS) {
        return res.status(400).json({ ok: false, virhe: "virheellinen_pyynto" });
      }
      const avain = VASTAUSAVAIN[tila.series][round - 1][q];
      const tag = round + "-" + q;
      let token = body.token;
      const jo = tila.scored.includes(tag) || await onLukittu(tila.sid, tag);
      if (!jo) {
        const nyt = Date.now();
        const alku = await haeAvausHetki(tila, tag, nyt, false);
        if (!alku) return res.status(409).json({ ok: false, virhe: "ei_avattu" });
        if ((nyt - alku) / 1000 < Q_TIME - AIKAKATKAISU_ARMO_S) {
          return res.status(409).json({ ok: false, virhe: "liian_aikaisin" });
        }
        tila.scored.push(tag);           // lukitse: ei voi vastata aikakatkaisun jälkeen
        await lukitse(tila.sid, tag);
        token = await luoPeliToken(tila);
      }
      return res.status(200).json({ ok: true, oikea: avain.c, selitys: avain.e, total: tila.total, token });
    }

    // ── peli_tallenna: kirjaa palvelimen vahvistama summa ──────
    if (toiminto === "peli_tallenna") {
      const tila = await lueTila(body.token);
      if (!tila) return res.status(401).json({ ok: false, virhe: "istunto_vanhentunut" });

      const id     = String(body.id || "").trim().replace(/[^\w.\-]/g, "").slice(0, 80);
      const nimi   = puhdista(body.nimi,   30);
      const koulu  = puhdista(body.koulu,  40);
      const luokka = "";                 // luokkatietoa ei enää tallenneta (tietosuoja)
      const pisteet = tila.total;        // VAIN palvelimen laskema summa
      if (!id || !nimi || !koulu || !Number.isFinite(pisteet) || pisteet < 0) {
        return res.status(400).json({ ok: false, virhe: "virheelliset_parametrit" });
      }

      const r = await sb("rpc/tiedontemppeli_tallenna_tulos", {
        method: "POST",
        body: JSON.stringify({
          p_id: id, p_nimi: nimi, p_koulu: koulu, p_luokka: luokka,
          p_pisteet: pisteet,
          p_pvm: new Date().toLocaleDateString("fi-FI"),
          p_paivitetty: Date.now(),
        }),
      });
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const tulos = await r.json();
      if (tulos === "aiempi_parempi") {
        return res.status(200).json({ ok: true, saved: false, reason: "Aiempi tulos on parempi", total: pisteet });
      }
      return res.status(200).json({ ok: true, saved: true, total: pisteet });
    }

    return res.status(400).json({ ok: false, virhe: "tuntematon_toiminto" });
  } catch (err) {
    console.error("tiedontemppeli POST:", err);
    await kirjaaVirhe('tiedontemppeli POST', err, { toiminto });
    return res.status(500).json({ ok: false, virhe: "palvelinvirhe" });
  }
}
