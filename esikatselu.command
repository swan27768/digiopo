#!/bin/bash
# DigiOpo – paikallinen esikatselu (kaksoisklikattava)
# Tuplaklikkaa tätä tiedostoa Finderissa käynnistääksesi esikatselun.

# Siirry tämän tiedoston kansioon
cd "$(dirname "$0")" || exit 1

echo "Käynnistetään DigiOpo-esikatselu..."

# Tarkista että node on asennettu
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  ⚠️  Node.js ei ole asennettu."
  echo "  Lataa se osoitteesta https://nodejs.org (LTS-versio) ja yritä uudelleen."
  echo ""
  read -r -p "Paina Enter sulkeaksesi..."
  exit 1
fi

# Avaa selain pienen viiveen jälkeen (palvelin ehtii käynnistyä)
( sleep 1.5 && open "http://localhost:8000" ) &

# Käynnistä palvelin
node dev-server.cjs
