#!/bin/bash
# DigiOpo – julkaise muutokset (kaksoisklikattava)
# Tuplaklikkaa tätä Finderissa: lähettää tehdyt commitit GitHubiin,
# jolloin Vercel julkaisee ne automaattisesti tuotantoon.

cd "$(dirname "$0")" || exit 1

echo "──────────────────────────────────────────"
echo "  DigiOpo – julkaisu (push GitHubiin)"
echo "──────────────────────────────────────────"
echo ""

# Näytä mitä ollaan lähettämässä
AHEAD=$(git rev-list --count origin/main..main 2>/dev/null)
echo "Lähetetään $AHEAD uutta committia haaraan main."
echo ""

if git push origin main; then
  echo ""
  echo "✅ Valmis! Muutokset on lähetetty GitHubiin."
  echo "   Vercel julkaisee ne tuotantoon automaattisesti (1–2 min)."
  echo "   Seuraa tilannetta: https://vercel.com/dashboard"
else
  echo ""
  echo "⚠️  Push epäonnistui. Tarkista verkkoyhteys ja GitHub-kirjautuminen."
fi

echo ""
read -r -p "Paina Enter sulkeaksesi..."
