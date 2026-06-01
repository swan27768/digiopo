# DigiOpo – Tekninen seloste

## Arkkitehtuuri

| Palvelu | Rooli | Osoite |
|---|---|---|
| **Vercel** | Staattinen sivusto + API-funktiot | app.digiopo.fi |
| **Supabase** | Tietokanta (lisenssit + käyttölaskuri) | supabase.com |
| **GitHub** | Lähdekoodi + automaattinen deploy | github.com/swan27768/digiopo |
| **Domainkeskus** | DNS (CNAME app → Vercel) | domainkeskus.com |

## Miten deploy toimii

Kun pushaat muutoksen GitHubiin (`main`-haara), Vercel hakee koodin automaattisesti ja julkaisee uuden version muutamassa minuutissa. Manuaalista deployta ei tarvita.

## API-funktiot

| Funktio | Polku | Kuvaus |
|---|---|---|
| `api/lisenssi.js` | POST /api/lisenssi | Tarkistaa koulukoodin Supabasesta |
| `api/ping.js` | POST /api/ping | Kasvattaa sivukohtaista käyntilaskuria |

## Ympäristömuuttujat (Vercel)

Asetukset: Vercel → digiopo → Settings → Environment Variables

| Muuttuja | Kuvaus |
|---|---|
| `SUPABASE_URL` | Supabase-projektin URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role -avain |

---

## Tietojen päivittäminen

### Lisenssien hallinta (Supabase)

1. Kirjaudu [supabase.com](https://supabase.com)
2. Avaa digiopo-projekti → **Table Editor → lisenssit**
3. Lisää, muokkaa tai poista koulukoodeja suoraan taulukossa

Taulukkon kentät: `koodi`, `koulu`, `tyyppi`, `voimassa_asti`, `aktiivinen`

### Käyntilaskurin seuranta (Supabase)

1. Kirjaudu [supabase.com](https://supabase.com)
2. Avaa digiopo-projekti → **Table Editor → käyttölaskuri**
3. Luvut päivittyvät automaattisesti käyttäjien sivuvierailuista

### Sivuston sisällön muokkaus (GitHub / suoraan tiedostoihin)

1. Muokkaa tiedostoja kansiossa `/Users/vicis/Projects/digiopo`
2. Committaa ja pushaa GitHubiin — Vercel päivittyy automaattisesti

### Ympäristömuuttujien päivitys (Vercel)

1. Kirjaudu [vercel.com](https://vercel.com)
2. digiopo → Settings → Environment Variables
3. Muokkaa arvoja → tallenna → tee uusi deploy (Deployments → Redeploy)
