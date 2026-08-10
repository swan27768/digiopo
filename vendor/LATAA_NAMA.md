# /vendor – itse-hostatut kirjastot

Viittaukset koodissa on jo vaihdettu näihin paikallisiin polkuihin. **Lataa alla
olevat 2 tiedostoa ennen kuin deployaat**, muuten kirjautuminen ja
`pelit/ajattelutavat.html` hajoavat (tiedostoja ei vielä ole).

Aja projektin juuressa (`digiopo/`):

```bash
# 1. Supabase JS (kirjautuminen + lisenssiportti + opettajakeskus)
curl -L --create-dirs "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js" \
  -o vendor/supabase/supabase.js

# 2. Chart.js 4.4.1 (pelit/ajattelutavat.html)
curl -L --create-dirs "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" \
  -o vendor/chart/chart.umd.js
```

Tarkista latauksen jälkeen, että tiedostot ovat isoja (ei virhesivu):

```bash
ls -lh vendor/supabase/supabase.js vendor/chart/chart.umd.js
# supabase.js ~120 kt, chart.umd.js ~200 kt
head -c 80 vendor/supabase/supabase.js   # pitäisi näyttää JS-koodia, ei HTML:ää
```

## Mitkä viittaukset vaihdettiin

| Tiedosto | Vanha (CDN) | Uusi |
|---|---|---|
| `kirjaudu.html:213` | jsdelivr @supabase/supabase-js@2 | `/vendor/supabase/supabase.js` |
| `js/opettaja-keskus.js:15` | jsdelivr @supabase/supabase-js@2 | `/vendor/supabase/supabase.js` |
| `js/lisenssiportti.js:42` | jsdelivr @supabase/supabase-js@2 | `/vendor/supabase/supabase.js` |
| `pelit/ajattelutavat.html:7` | cdnjs Chart.js 4.4.1 | `/vendor/chart/chart.umd.js` |

## Testaus ennen deployta

1. Lataa yllä olevat 2 tiedostoa.
2. Aja paikallinen esikatselu (`esikatselu.command` / dev-server).
3. Testaa: kirjautuminen (`/kirjaudu`), lisenssiportti, ja `pelit/ajattelutavat.html`
   (kaavion pitää piirtyä).
4. **CSP:** `vercel.json`:n `connect-src` sallii yhä `https://*.supabase.co`
   (tarpeen — Supabasen API-kutsut menevät sinne). `script-src`:stä voi poistaa
   `https://cdn.jsdelivr.net`:n **vasta kun myös muut jsdelivr/unpkg-riippuvuudet
   on vendoroitu** (React/Babel vahvuusmatka-uusi:ssa käyttää yhä unpkgia).

> Kun nämä toimivat, seuraavat kohteet ovat Font Awesome ja Google Fonts
> (ks. `MUUTOSLISTA_optimointi.md`).
