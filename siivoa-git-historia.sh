#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# DigiOpo – kuvien commit + git-historian siivous
#
# Aja tämä repon juuressa OMASSA TERMINAALISSASI (ei Cowork-sandboxissa).
# Skripti:
#   1. Poistaa vanhentuneet suuret PNG/JPG-kuvat (webp-versiot ovat jo tilalla)
#   2. Committaa kuvaoptimoinnit
#   3. Poistaa git-HISTORIASTA vanhat isot binäärit (EI nykyisiä tiedostoja)
#   4. Pakkaa repon uudelleen ja raportoi koon
#
# ⚠️  TÄMÄ KIRJOITTAA GIT-HISTORIAN UUDELLEEN: kaikki commit-hashit muuttuvat.
#     Vaatii lopuksi `git push --force`. Varmuuskopio on jo otettu Coworkissa
#     (digiopo-backup-*.tar.gz outputs-kansiossa). Ota halutessasi vielä toinen:
#         git clone --mirror . ../digiopo-backup.git
#
# Force-pushia EI tehdä automaattisesti – näet komennot lopuksi.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REMOTE_URL="git@github.com:swan27768/digiopo.git"
THRESH=307200   # 300 kt tavuina – tätä isommat HISTORIALLISET blobit poistetaan

cd "$(git rev-parse --show-toplevel)"
echo "Repo: $(pwd)"
echo "Alkuperäinen .git-koko: $(du -sh .git | cut -f1)"
echo

# 0) Poista mahdollinen jumittunut lukko
[ -f .git/index.lock ] && rm -f .git/index.lock && echo "Poistettu vanha .git/index.lock"

# Varmista puhdas lähtötilanne (paitsi meidän kuvamuutokset)
git rev-parse --abbrev-ref HEAD | grep -qx main || { echo "Et ole main-haarassa – keskeytetään."; exit 1; }

# 1) Poista vanhentuneet isot kuvat (webp jo tilalla, viittaukset päivitetty)
echo "1) Poistetaan vanhentuneet PNG/JPG-kuvat…"
git rm -q --ignore-unmatch \
  images/liikunta-ala.png \
  pelit/duunimina/img/duunimina-hero.png \
  images/koulutusalat/tekniikan-ala.png \
  images/koulutusalat/luonto-ymparisto-ala.png \
  images/koulutusalat/merenkulkuala-iso.png \
  images/koulutusalat/palvelu-ala.png \
  images/koulutusalat/elintarvikeala-iso.png \
  images/koulutusalat/taide-ja-humanistinen-ala.png \
  images/koulutusalat/sote-ala-iso.png \
  images/koulutusalat/kaupan-ala.png \
  images/koulutusalat/it-ala-iso.png \
  images/robo_maskotti_tyytyvainen_punainen_reppu.png \
  pelit/tiedon_temppeli.png \
  images/paatoskompassi.png \
  images/9lk-infograafi.jpg \
  images/taustakuva.webp

# 2) Lisää uudet webp-tiedostot + päivitetyt html/js ja committaa
git add -A
git commit -m "Optimoi kuvat WebP:ksi (-24 Mt työpuusta)" || echo "(ei committoitavaa)"
echo

# 3) Varmista git-filter-repo (vikasietoinen: brew → pip → suora lataus)
FR="git filter-repo"
if ! git filter-repo --version >/dev/null 2>&1; then
  echo "Asennetaan git-filter-repo…"
  command -v brew >/dev/null 2>&1 && brew install git-filter-repo || true
  if ! git filter-repo --version >/dev/null 2>&1; then
    echo "Ladataan git-filter-repo suoraan…"
    curl -fsSL https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo \
      -o /tmp/git-filter-repo && chmod +x /tmp/git-filter-repo && FR="python3 /tmp/git-filter-repo"
  fi
fi
$FR --version >/dev/null 2>&1 || { echo "git-filter-repo ei käytettävissä. Asenna: brew install git-filter-repo"; exit 1; }
echo "Käytetään: $FR"

# 4) Laske poistettavat blobit = HISTORIAN isot blobit, jotka EIVÄT ole nykyversiossa
echo "4) Lasketaan poistettavat historialliset blobit…"
git ls-tree -r HEAD | awk '{print $3}' | sort -u > /tmp/head-blobs.txt
git cat-file --batch-all-objects --batch-check='%(objecttype) %(objectname) %(objectsize)' \
  | awk -v t="$THRESH" '$1=="blob" && $3>t {print $2}' | sort -u > /tmp/big-blobs.txt
comm -23 /tmp/big-blobs.txt /tmp/head-blobs.txt > /tmp/strip-ids.txt
echo "   Poistetaan $(wc -l < /tmp/strip-ids.txt) vanhaa blobia historiasta (nykyiset tiedostot säilyvät)."
echo

# 5) Kirjoita historia uudelleen
echo "5) Ajetaan git filter-repo…"
$FR --force --strip-blobs-with-ids /tmp/strip-ids.txt

# 6) Siivoa reflog + pakkaa
git reflog expire --expire=now --all || true
git gc --prune=now --aggressive

# 7) Palauta remote (filter-repo poistaa sen turvasyistä)
git remote add origin "$REMOTE_URL" 2>/dev/null || git remote set-url origin "$REMOTE_URL"

echo
echo "──────────────────────────────────────────────"
echo "Valmis. Uusi .git-koko: $(du -sh .git | cut -f1)"
echo
echo "Tarkista että sivusto näyttää oikealta (esim.):  ./esikatselu.command"
echo
echo "Kun olet valmis julkaisemaan, PAKOTA push GitHubiin:"
echo "    git push origin --force --all"
echo "    git push origin --force --tags"
echo
echo "⚠️  Mahdolliset muut kloonit pitää kloonata uudelleen (git pull ei riitä)."
echo "    Vercel julkaisee automaattisesti uuden historian pushin jälkeen."
