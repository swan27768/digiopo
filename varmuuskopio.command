#!/bin/bash
# DigiOpo – tietokannan varmuuskopio (kaksoisklikattava)
#
# Tuplaklikkaa tätä Finderissa. Skripti kysyy tietokannan salasanan ja tallentaa
# varmuuskopion kansioon ~/Documents/Varmuuskopiot päivämäärällä nimettynä.
#
# MIKSI SESSION POOLER EIKÄ SUORA YHTEYS:
# Supabasen suora yhteys (db.<projekti>.supabase.co) on IPv6-only eikä toimi
# IPv4-verkosta – nimi ei edes ratkea. Session pooler on ilmainen, IPv4-
# yhteensopiva ja tukee pg_dumpia. Transaction pooler (portti 6543) EI tue.
#
# HUOM KÄYTTÄJÄNIMI: poolerissa se on postgres.<projektitunnus>, ei pelkkä
# postgres. Tämä on yleisin syy virheeseen "password authentication failed".

set -u

PALVELIN="aws-0-eu-central-1.pooler.supabase.com"
PORTTI="5432"
KAYTTAJA="postgres.uiqjrhaoumxwshnojtyn"
KANTA="postgres"
KOHDE="$HOME/Documents/Varmuuskopiot"

echo "──────────────────────────────────────────"
echo "  DigiOpo – tietokannan varmuuskopio"
echo "──────────────────────────────────────────"
echo ""

# ─── Etsi UUSIN pg_dump ──────────────────────────────────────────────────────
# pg_dump kieltäytyy dumppaamasta palvelinta, joka on sitä uudempi. Supabase
# päivittää Postgresin versiota ajoittain (17.6 heinäkuussa 2026), joten
# macOS:n mukana tullut tai vanha Homebrew-versio lakkaa toimimasta yllättäen.
# Etsitään siksi kaikki asennetut ja valitaan korkein versio.
etsi_pg_dump() {
  local paras="" paras_ver=0 ehdokas ver
  for ehdokas in \
    /opt/homebrew/opt/postgresql@*/bin/pg_dump \
    /usr/local/opt/postgresql@*/bin/pg_dump \
    /Applications/Postgres.app/Contents/Versions/*/bin/pg_dump \
    "$(command -v pg_dump 2>/dev/null)"
  do
    [ -x "$ehdokas" ] || continue
    ver=$("$ehdokas" --version 2>/dev/null | grep -oE '[0-9]+' | head -1)
    [ -n "$ver" ] || continue
    if [ "$ver" -gt "$paras_ver" ]; then paras_ver=$ver; paras=$ehdokas; fi
  done
  echo "$paras"
}

PG_DUMP=$(etsi_pg_dump)

if [ -z "$PG_DUMP" ]; then
  echo "  ⚠️  pg_dump puuttuu."
  echo "     Asenna:  brew install postgresql@17"
  echo ""
  read -r -p "Paina Enter sulkeaksesi..."
  exit 1
fi

# Ympäristömuuttujat voivat ohittaa -U ja -h -valitsimet. Tämä on juuri se
# ansa, joka aiheutti toistuvat "password authentication failed for user
# postgres" -virheet: PGUSER ohittaa komentorivin käyttäjänimen hiljaa.
unset PGUSER PGHOST PGPORT PGDATABASE PGPASSWORD 2>/dev/null || true

mkdir -p "$KOHDE"
TIEDOSTO="$KOHDE/digiopo_$(date +%Y-%m-%d).sql"

echo "  pg_dump:   $PG_DUMP  (versio $("$PG_DUMP" --version | grep -oE '[0-9]+\.[0-9]+' | head -1))"
echo "  Palvelin:  $PALVELIN"
echo "  Käyttäjä:  $KAYTTAJA"
echo "  Kohde:     $TIEDOSTO"
echo ""

# Salasana kysytään näkymättömänä eikä se päädy komentohistoriaan.
read -r -s -p "  Tietokannan salasana: " SALASANA
echo ""
echo ""

if [ -z "$SALASANA" ]; then
  echo "  ⚠️  Salasana on tyhjä – keskeytetään."
  echo ""
  read -r -p "Paina Enter sulkeaksesi..."
  exit 1
fi

echo "  Haetaan varmuuskopiota…"
echo ""

if PGPASSWORD="$SALASANA" "$PG_DUMP" \
     -h "$PALVELIN" -p "$PORTTI" -U "$KAYTTAJA" -d "$KANTA" \
     --clean --if-exists --no-owner --no-privileges \
     -f "$TIEDOSTO" 2>/tmp/digiopo_dump_virhe.txt
then
  TAULUJA=$(grep -c "^CREATE TABLE" "$TIEDOSTO" 2>/dev/null || echo 0)
  KOKO=$(du -h "$TIEDOSTO" | cut -f1)

  echo "  ✅ Varmuuskopio tallennettu."
  echo "     Tiedosto:  $(basename "$TIEDOSTO")  ($KOKO)"
  echo "     Tauluja:   $TAULUJA  (sis. Supabasen auth- ja storage-skeemat)"
  echo ""

  # Raaka lukumäärä on huono mittari: se sisältää Supabasen sisäiset skeemat,
  # joiden määrä vaihtelee alustan päivitysten mukana. Tarkistetaan sen sijaan
  # että olennaiset taulut ovat oikeasti mukana.
  PUUTTUU=""
  for t in lisenssit opetusryhmat jarjestykset fake_insta_profiilit maailma_ratkaisut; do
    grep -q "CREATE TABLE public\.$t\b" "$TIEDOSTO" || PUUTTUU="$PUUTTUU $t"
  done
  # auth.users sisältää opettajatilit – ilman sitä kukaan ei pääse kirjautumaan
  # palautuksen jälkeen, vaikka lisenssit olisivat tallessa.
  grep -q "CREATE TABLE auth\.users\b" "$TIEDOSTO" || PUUTTUU="$PUUTTUU auth.users"

  if [ -n "$PUUTTUU" ]; then
    echo "  ⚠️  Kopiosta puuttuu tauluja:$PUUTTUU"
    echo "     Älä luota tähän kopioon – selvitä syy ennen kuin poistat vanhoja."
    echo ""
  else
    echo "     Tarkistettu: lisenssit, ryhmät, oppilastyöt ja opettajatilit mukana."
    echo ""
  fi

  echo "  MUISTA: vie kopio myös koneen ulkopuolelle (pilvi tai ulkoinen levy)."
  echo "  Kopio samalla koneella ei suojaa koneen hajoamiselta."
  echo ""
  echo "  Merkitse tehtävä tehdyksi hallintapaneelin muistutuslistassa."
else
  echo "  ❌ Varmuuskopio EPÄONNISTUI."
  echo ""
  sed 's/^/     /' /tmp/digiopo_dump_virhe.txt
  echo ""
  echo "  Yleisimmät syyt:"
  echo "   · Väärä salasana → Supabase → Settings → Database → Reset database password"
  echo "   · Versioero      → brew install postgresql@17  (pg_dump ei saa olla palvelinta vanhempi)"
  echo "   · Alue vaihtunut → tarkista osoite Supabasen Connect-ikkunasta"
  echo ""
  rm -f "$TIEDOSTO"
fi

rm -f /tmp/digiopo_dump_virhe.txt
echo ""
read -r -p "Paina Enter sulkeaksesi..."
