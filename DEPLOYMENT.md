# DigiOpo – Julkaiseminen

## Nykytilanne

DigiOpo on **täysin staattinen sivusto** (HTML + CSS + JavaScript).  
Se voidaan julkaista suoraan ilman palvelinta tai asennuksia.

> **proxy.js** on valmisteltu tulevia tekoälyominaisuuksia varten,  
> mutta se **ei ole tällä hetkellä kytketty mihinkään sivuston toimintoon**.  
> Sivusto toimii julkisesti ilman proxy-palvelinta.

---

## Vaihtoehto 1: Netlify (suositeltu, ilmainen)

1. Mene osoitteeseen [netlify.com](https://www.netlify.com) ja kirjaudu sisään
2. Vedä `digiopo`-kansio selainikkunaan tai valitse **"Deploy manually"**
3. Sivusto on julkinen muutamassa sekunnissa

**GitHub-integraatio (automaattinen päivitys):**
1. Vie projekti GitHubiin
2. Netlify > "New site from Git" > valitse repositorio
3. Jokainen `git push` päivittää sivuston automaattisesti

---

## Vaihtoehto 2: GitHub Pages (ilmainen)

```bash
# Vie projekti GitHubiin ja ota Pages käyttöön:
# Repository > Settings > Pages > Source: Deploy from branch > main
```

Sivusto näkyy osoitteessa: `https://kayttajatunnus.github.io/digiopo`

---

## Vaihtoehto 3: Vercel (ilmainen)

```bash
npm install -g vercel
cd digiopo
vercel
```

---

## Proxy-palvelin (tekoälyominaisuudet, tuleva)

Proxy tarvitaan vain jos sivustoon lisätään Claude-tekoälyintegraatio.

### Paikallinen kehitys

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Kopioi ympäristömuuttujat
cp .env.example .env

# 3. Lisää oma API-avaimesi .env-tiedostoon
# ANTHROPIC_API_KEY=sk-ant-...

# 4. Käynnistä proxy
npm start
# → Proxy käynnissä: http://localhost:3001
```

### Proxy tuotantoon (Render.com, ilmainen)

1. Luo tili osoitteessa [render.com](https://render.com)
2. **New > Web Service** > yhdistä GitHub-repositorio
3. Asetukset:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment variable:** `ANTHROPIC_API_KEY` = oma avaimesi
4. Kopioi Renderin antama URL (esim. `https://digiopo-proxy.onrender.com`)
5. Päivitä tämä URL sivuston fetch-kutsuihin ennen kuin proxy otetaan käyttöön

> **Tietoturvahuomio:** Älä koskaan laita `ANTHROPIC_API_KEY`-avainta suoraan HTML/JS-tiedostoihin.  
> Proxy-palvelin pitää avaimen turvassa palvelimella.

---

## Tiedostorakenne julkaisua varten

Julkaisemiseen tarvitaan vain nämä kansiot ja tiedostot:

```
digiopo/
├── index.html
├── sivut/
├── pelit/
├── robo-peli/
├── tehtavat/
├── css/
├── js/
└── images/
```

`proxy.js`, `package.json` ja `.env` jätetään palvelimelle – ne eivät kuulu staattiseen julkaisuun.
