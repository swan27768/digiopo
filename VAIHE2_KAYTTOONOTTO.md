# Vaihe 2 — Osiojärjestyksen jako oppilaille

Opettaja järjestää osiot (Vaihe 1) ja **julkaisee** järjestyksen oppilaille.
Oppilaat näkevät opettajan järjestyksen kaikilla laitteilla **ryhmäkoodilla**.

## Arkkitehtuuri

Sama kaava kuin lisenssintarkistuksessa: selain **ei** puhu suoraan Supabaseen.

```
Selain ──> /api/jarjestys (Vercel, service_key) ──> Supabase
```

- **Oppilas (luku):** `GET /api/jarjestys?ryhma=KOODI&luokka=7` — julkinen, vain ryhmäkoodi.
- **Opettaja (kirjoitus):** `POST /api/jarjestys` toiminnoilla `rekisteroi` ja `tallenna` — vaatii salaisen opettaja-avaimen.

Tunnistus: **ryhmäkoodi** (jaetaan oppilaille) + **opettaja-avain** (salainen, vain opettajalla). Ei tilejä, ei sähköposteja.

## Käyttöönotto (3 askelta)

### 1. Tietokanta
Aja Supabasen SQL Editorissa tiedosto **`supabase_jarjestys.sql`** (vaatii, että `supabase_schema.sql` on jo ajettu — käyttää sen `paivita_muokattu_at`-funktiota). Tämä luo taulut `opetusryhmat` ja `jarjestykset` sekä RLS-säännöt (kaikki julkinen pääsy estetty).

### 2. Ympäristömuuttujat (Vercel)
- `SUPABASE_URL` ja `SUPABASE_SERVICE_KEY` — **ovat jo käytössä** (lisenssi.js käyttää samoja).
- `JARJESTYS_PEPPER` *(valinnainen)* — ylimääräinen salainen "suola" opettaja-avaimen tiivisteeseen. **Aseta se kerran ennen julkaisua äläkä muuta sen jälkeen** (muutos mitätöisi olemassa olevat avaimet). Jos jätät asettamatta, toimii silti.

### 3. Julkaisu
Vie `jarjestys-ominaisuus`-haara tuotantoon (merge mainiin + push, tai Vercel-deploy). API-funktio `api/jarjestys.js` reitittyy automaattisesti `/api/jarjestys`-osoitteeseen.

## Testaus (kun pääset Verceliin)

1. Avaa opettajana: `https://app.digiopo.fi/sivut/7luokka.html?ope=1`
2. Raahaa osiot haluamaasi järjestykseen.
3. Klikkaa **"Luo jakoryhmä"**, anna salainen avain (väh. 4 merkkiä). Saat **ryhmäkoodin** ja oppilaan linkin; järjestys julkaistaan heti.
4. Tee myöhempiä muutoksia → klikkaa **"Tallenna oppilaille"**.
5. Avaa oppilaan linkki toisessa selaimessa/incognitossa (koulukoodi syötettävä kuten normaalisti): osioiden pitäisi näkyä opettajan järjestyksessä.
6. Toista 8lk- ja 9lk-sivuille (sama ryhmäkoodi, järjestys tallennetaan luokka-asteittain).

## Tärkeää tietää

- **Ryhmäkoodi on yhteinen kaikille luokka-asteille**, mutta järjestys tallennetaan erikseen kullekin (7/8/9). Sama opettaja-avain toimii kaikilla.
- **Opettaja-avain tallentuu vain opettajan omaan selaimeen** (localStorage). Toisella laitteella opettaja luo joko uuden ryhmän tai (myöhemmässä versiossa) syöttää saman koodin + avaimen uudelleen.
- Oppilas, joka ei ole avannut `?ryhma=`-linkkiä, näkee oletusjärjestyksen (tai oman selaimensa Vaihe 1 -järjestyksen).
- Turvataso: opettaja-avain on luokkahuonekäyttöön sopiva PIN, ei pankkitason suojaus. Avaimen tiiviste (SHA-256 + valinnainen pepper) tallennetaan, ei avainta itseään.

## Mahdolliset jatkot
- Opettajan "kirjaudu olemassa olevaan ryhmään" -nappi (ryhmäkoodi + avain) toiselle laitteelle.
- Ryhmäkoodin syöttö oppilaalle lisenssiportin yhteyteen (nyt vain linkin kautta).
- Vaihe 3: varsinainen Supabase Auth, jos halutaan vahvempi opettajaidentiteetti.
