#!/bin/bash
# DigiOpo – tuota ääneenluku Azure-neuroäänellä (kaksoisklikattava)
# Tarvitset ilmaisen Azure Speech -avaimen ja alueen (esim. westeurope).
cd "$(dirname "$0")" || exit 1
echo "──────────────────────────────────────────"
echo "  DigiOpo – Azure-neuroäänen tuotanto"
echo "──────────────────────────────────────────"
echo ""
GEN="audio/_gen.tsv"
if [ ! -f "$GEN" ]; then echo "Virhe: $GEN puuttuu."; read -r -p "Enter..."; exit 1; fi

read -r -p "Azure Speech -avain (KEY 1): " KEY
read -r -p "Alue (esim. westeurope / swedencentral): " REGION
read -r -p "Ääni [Enter = fi-FI-NooraNeural, muut: fi-FI-HarriNeural / fi-FI-SelmaNeural]: " VOICE
VOICE=${VOICE:-fi-FI-NooraNeural}
ENDPOINT="https://$REGION.tts.speech.microsoft.com/cognitiveservices/v1"
DONE="audio/.azure_done"; touch "$DONE"

xmlesc(){ printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'; }

total=$(wc -l < "$GEN" | tr -d ' '); ok=0; fail=0; i=0
echo "Tuotetaan $total ääntä äänellä $VOICE ..."
echo ""
while IFS=$'\t' read -r H TXT; do
  i=$((i+1))
  [ -z "$H" ] && continue
  grep -qx "$H" "$DONE" && continue
  ESC=$(xmlesc "$TXT")
  SSML="<speak version='1.0' xml:lang='fi-FI'><voice name='$VOICE'><prosody rate='+10%'>$ESC</prosody></voice></speak>"
  CODE=$(curl -s -S -w '%{http_code}' -o "audio/$H.mp3.tmp" -X POST "$ENDPOINT" \
    -H "Ocp-Apim-Subscription-Key: $KEY" \
    -H "Content-Type: application/ssml+xml" \
    -H "X-Microsoft-OutputFormat: audio-24khz-96kbitrate-mono-mp3" \
    -H "User-Agent: digiopo" \
    --data-raw "$SSML" 2>/dev/null)
  if [ "$CODE" = "200" ] && [ -s "audio/$H.mp3.tmp" ]; then
    mv "audio/$H.mp3.tmp" "audio/$H.mp3"; echo "$H" >> "$DONE"; ok=$((ok+1))
  else
    rm -f "audio/$H.mp3.tmp"; fail=$((fail+1))
    [ "$fail" -le 3 ] && echo "  Virhe (HTTP $CODE): ${TXT:0:40}"
    if [ "$CODE" = "401" ] || [ "$CODE" = "403" ]; then
      echo ""; echo "  ⚠️  Avain tai alue väärin. Tarkista ja aja uudelleen."; break
    fi
  fi
  if [ $((i % 50)) -eq 0 ]; then echo "  $i / $total ..."; fi
done < "$GEN"

echo ""
echo "Valmis: $ok tuotettu, $fail virhettä."
if [ "$ok" -gt 0 ] && [ "$fail" -eq 0 ]; then
  echo ""
  echo "Tallennetaan muutokset (git commit) ..."
  git add audio >/dev/null 2>&1
  git commit -q -m "Vaihda aaneenluku Azure-neuroaaneen ($VOICE)" >/dev/null 2>&1 && echo "✅ Committoitu." || echo "(ei uusia muutoksia committiin)"
  echo ""
  echo "Julkaise nyt tuotantoon: tuplaklikkaa julkaise.command"
fi
echo ""
read -r -p "Paina Enter sulkeaksesi..."
