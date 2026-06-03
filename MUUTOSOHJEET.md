# DigiOpo – Ohjeet muutosten tekemiseen

## Normaalit sisältömuutokset (tekstit, kuvat, pelit)

1. Avaa tiedosto kansiossa `/Users/vicis/Projects/digiopo`
2. Tee muutokset
3. Avaa Terminal ja aja:

```bash
cd /Users/vicis/Projects/digiopo
git add -A
git commit -m "Lyhyt kuvaus muutoksesta"
git push
```

Vercel julkaisee uuden version automaattisesti noin 1–2 minuutissa.

---

## Lisenssien hallinta (lisäys, poisto, voimassaoloajan muutos)

1. Kirjaudu [supabase.com](https://supabase.com)
2. Avaa digiopo-projekti → **Table Editor → lisenssit**
3. Muokkaa suoraan taulukossa

Tärkeät kentät:
- `koodi` – koulun kirjautumiskoodi (esim. KOULU-2026)
- `voimassa_asti` – päivämäärä muodossa 2026-12-31
- `aktiivinen` – true = toimii, false = estetty

---

## Käyntilaskurin seuranta

1. Kirjaudu [supabase.com](https://supabase.com)
2. Avaa digiopo-projekti → **Table Editor → käyttölaskuri**

Luvut päivittyvät automaattisesti kun käyttäjät vierailevat sivuilla.

---

## API-funktioiden muuttaminen (lisenssi- tai ping-logiikka)

1. Muokkaa tiedostoa `api/lisenssi.js` tai `api/ping.js`
2. Committaa ja pushaa (ohjeet yllä)
3. Vercel ottaa muutokset käyttöön automaattisesti

---

## Ympäristömuuttujien päivitys (Supabase-avaimet)

1. Kirjaudu [vercel.com](https://vercel.com)
2. digiopo → **Settings → Environment Variables**
3. Muokkaa arvoa → tallenna
4. digiopo → **Deployments** → klikkaa viimeisintä → **Redeploy**

---

## Jos jokin menee pieleen

- **Sivusto ei lataudu:** tarkista Vercel → Deployments — onko viimeisin deploy onnistunut
- **Kirjautuminen ei toimi:** tarkista Supabase → lisenssit-taulu ja ympäristömuuttujat Vercelissä
- **Muutos ei näy:** odota 2 min tai tarkista että git push onnistui
