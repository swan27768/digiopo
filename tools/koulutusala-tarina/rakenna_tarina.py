#!/usr/bin/env python3
"""DigiOpo – koulutusalan tarinapelin rakentaja.

Rakentaa alan Twine/SugarCube-tiedostoon tarinan, ammattikortin ja
"Kenet kutsut paikalle?" -tehtävän alan omasta sisältötiedostosta.

Käyttö:
    python3 rakenna_tarina.py alat/tekniikka.py <alkuperäinen.html> <uusi.html>

Alkuperäisestä tiedostosta säilytetään: SugarCube-moottori, head-osan
lisenssi/seuranta-skriptit, kansi-passagen tunniste (startnode) ja
sisällön SAILYTA-listan passaget (esim. oppilaitossivut). Kaikki muu
korvataan. Yhteinen koodi on tiedostoissa tarina-yhteinen.js/.css ja
3D-taustat tausta3d.js:ssä.
"""
import json, re, runpy, sys

def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;").replace("'", "&#39;"))

def unesc(t):
    return (t.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
             .replace("&#39;", "'").replace("&amp;", "&"))

PASSAGE_RE = re.compile(r'<tw-passagedata([^>]*)>(.*?)</tw-passagedata>', re.S)

def attr(a, nimi):
    m = re.search(nimi + r'="([^"]*)"', a)
    return m.group(1) if m else ""

# Kannen napin kuvakkeet (SVG-polut, 24x24)
IKONIT = {
    "virta": '<path d="M12 3v9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    "syke": '<path d="M2 12h4l2-5 4 10 3-7 2 2h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
}

# --------------------------------------------------------------------------
def valinta(v, avain, seuraava, kysymys, siirtyma_teksti):
    sets = f"<<set $aika += {v['aika']}>>"
    for k, n in v.get("piirteet", {}).items():
        sets += f"<<set $piirre.{k} += {n}>>"
    run = f'<<run setup.tausta("{v["tausta"]}")>>' if v.get("tausta") else ""
    kului = f'Aikaa kului {v["aika"]} min.' + (f" {siirtyma_teksti}" if siirtyma_teksti else "")
    return (f'<<link "{v["teksti"]}">>{sets}{run}<<replace "#valinnat">>'
            f'<div class="palaute">{v["palaute"]}<p class="aika-kului">{kului}</p></div>'
            f'<<kiinnostus "{avain}" "{seuraava}" "{kysymys}">><</replace>><</link>>')

def kuva_html(k):
    """Valinnainen kohtauskuva: k["kuva"] = dict(src, alt, leveys, korkeus). Polku sivun kansiosta."""
    kv = k.get("kuva")
    if not kv: return ""
    return (f'<figure class="kohtaus-kuva"><img src="{kv["src"]}" alt="{kv["alt"]}" '
            f'width="{kv["leveys"]}" height="{kv["korkeus"]}" loading="lazy" decoding="async"></figure>\n')

def kohtaus_passage(k, nro, yht, seuraava, A):
    vv = "\n".join(valinta(v, k["avain"], seuraava, k["kysymys"], A.get("siirtymaTeksti", "")) for v in k["valinnat"])
    tk = f'<<run setup.taustakuva("{k["taustakuva"]}")>>' if k.get("taustakuva") else ""
    return f"""{tk}<<include "HUD">>
<p class="kohtaus-nro">Kohtaus {nro}/{yht}</p>
<h2>{k['otsikko']}</h2>
{kuva_html(k)}{k['johdanto']}
<p class="valitse-ohje">Mitä teet?</p>
<div id="valinnat" class="answer-group valinnat">
{vv}
</div>"""

# --------------------------------------------------------------------------
def rakenna(A, src, dst):
    s = open(src, encoding="utf-8").read()

    # --- passaget
    m = re.search(r'<tw-storydata[^>]*startnode="(\d+)"', s)
    startpid = m.group(1)
    kaikki = [(attr(a, "pid"), unesc(attr(a, "name"))) for a, _ in PASSAGE_RE.findall(s)]
    kansi_nimi = [n for p, n in kaikki if p == startpid][0]
    sailyta = set(A.get("SAILYTA", [])) | {"StoryInit", kansi_nimi}
    for nimi in A.get("SAILYTA", []):
        assert nimi in [n for _, n in kaikki], ("säilytettävää ei löydy", nimi)

    def suodata(mm):
        return mm.group(0) if unesc(attr(mm.group(1), "name")) in sailyta else ""
    s = PASSAGE_RE.sub(suodata, s)

    def korvaa(nimi, teksti, tags=None, uusi_nimi=None):
        nonlocal s
        pat = re.compile(r'(<tw-passagedata[^>]*name="' + re.escape(esc(nimi)) + r'"[^>]*>)(.*?)(</tw-passagedata>)', re.S)
        mm = pat.search(s); assert mm, nimi
        alku = mm.group(1)
        if tags is not None: alku = re.sub(r'tags="[^"]*"', f'tags="{tags}"', alku)
        if uusi_nimi: alku = re.sub(r'name="[^"]*"', f'name="{esc(uusi_nimi)}"', alku)
        s = s[:mm.start()] + alku + esc(teksti.strip() + "\n") + mm.group(3) + s[mm.end():]

    pidit = [int(x) for x in re.findall(r'<tw-passagedata pid="(\d+)"', s)] + [int(p) for p, _ in kaikki]
    seur = [max(pidit) + 1]
    uudet = []
    def lisaa(nimi, teksti, tags="", pos="1200,100"):
        pid = seur[0]; seur[0] += 1
        uudet.append(f'<tw-passagedata pid="{pid}" name="{esc(nimi)}" tags="{tags}" position="{pos}" size="100,100">'
                     + esc(teksti.strip() + "\n") + "</tw-passagedata>")

    PIIRTEET, AMMATIT = A["PIIRTEET"], A["AMMATIT"]
    pset = ", ".join(f"{k}: 0" for k in PIIRTEET)
    kset = ", ".join(f"{k}: 0" for k in AMMATIT)
    alustus = f'<<set $aika to 0>><<set $piirre to {{{pset}}}>><<set $kiinn to {{{kset}}}>><<set $korttiTop to []>>'

    korvaa("StoryInit", f"""<<run Config.saves.maxAutoSaves = 0;>>
/* {A['tarinaNimi']} – alkuarvot */
{alustus}
<<set $korttiNimi to "">>
<<set $ammatti to "">>""")

    K = A["KANSI"]
    korvaa(kansi_nimi, f"""<<script>>
$('body').addClass('hide-navbar');
<</script>>
<div class="cover-link cover-3d">
  <div class="cover-inner">
    <p class="cover-pieni">{K['pieni']}</p>
    <h1 class="cover-title">{K['otsikko']}</h1>
    <p class="cover-subtitle">{K['alaotsikko']}</p>
    <button type="button" class="cover-kaynnista" onclick="kaynnistaTarina(this)"><svg class="cover-virta" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{IKONIT[K.get('ikoni', 'virta')]}</svg><span>{K.get('nappi', 'Käynnistä')}</span></button>
  </div>
</div>""", tags="scene-kansi")

    S = A["ALKU"]
    faktat = "\n".join(f"<li><strong>{a}</strong><span>{b}</span></li>" for a, b in S["faktat"])
    lisaa("start", f"""<<nobr>>
<div class="alku-kortti">
<p class="alku-tag">{S['tag']}</p>
<h2 class="alku-otsikko">{A['tarinaNimi']}</h2>
<p class="alku-teksti">{S['teksti']}</p>
<ul class="alku-faktat">
{faktat}
</ul>
<div class="intro-nappi"><<link "Aloita tarina">><<goto "{A['TARINA_ALKU']['nimi']}">><</link>></div>
</div>
<</nobr>>""", f"scene-{A['yleisKohtaus']} alku-sivu")

    hud = "".join(f'<span class="{c}">{t}</span>' for c, t in A["HUD"])
    lisaa("HUD", f'<div class="hud" role="status">{hud}</div>')

    lisaa("Widgetit", """<<widget "kiinnostus">><<set _avain to _args[0]>><<set _seuraava to _args[1]>><div class="kiinnostus"><p class="kiinnostus-kysymys"><<print _args[2]>></p><div class="answer-group kiinnostus-napit"><<capture _avain, _seuraava>><<link "Kiinnostava">><<set $kiinn[_avain] to 2>><<set $aika += SIIRTYMA>><<goto _seuraava>><</link>><<link "Ehkä">><<set $kiinn[_avain] to 1>><<set $aika += SIIRTYMA>><<goto _seuraava>><</link>><<link "Ei minun juttu">><<set $kiinn[_avain] to 0>><<set $aika += SIIRTYMA>><<goto _seuraava>><</link>><</capture>></div></div><</widget>>""".replace("SIIRTYMA", str(A.get("siirtyma", 0))), "widget")

    T = A["TARINA_ALKU"]
    kohtaukset = A["KOHTAUKSET"]
    lisaa(T["nimi"], alustus + "\n" + T["teksti"].replace("{{ENSIMMAINEN}}", kohtaukset[0]["nimi"]), f"scene-{T['tausta']}")
    for i, k in enumerate(kohtaukset):
        seuraava = kohtaukset[i + 1]["nimi"] if i + 1 < len(kohtaukset) else A["TARINA_LOPPU"]["nimi"]
        lisaa(k["nimi"], kohtaus_passage(k, i + 1, len(kohtaukset), seuraava, A), f"scene-{k['tausta']}")
    L = A["TARINA_LOPPU"]
    lisaa(L["nimi"], L["teksti"] + '\n<div class="intro-nappi"><<link "Katso ammattikorttisi">><<goto "Ammattikortti">><</link>></div>', "scene-loppu")

    lisaa("Ammattikortti", """<<run setup.tallennaKortti()>>
<h1>Ammattikorttisi</h1>
<p>Kortti on tehty sinun valinnoistasi ja siitä, mikä sinua kiinnosti. Se ei ole testi vaan vinkki: näitä kannattaa tutkia lisää.</p>
<div class="kortti-nimi-rivi"><label for="kortti-nimi">Nimesi korttiin (vapaaehtoinen)</label>
<input id="kortti-nimi" type="text" maxlength="40" autocomplete="off" oninput="paivitaKorttiNimi(this.value)"></div>
<div id="ammattikortti"><<print setup.korttiHTML()>></div>
<div class="intro-nappi action-row">
<a class="macro-link btn-secondary" href="javascript:void(0)" onclick="lataaAmmattikortti()">Lataa kortti kuvana</a>
<<link "Seuraava tehtävä: Kenet kutsut paikalle?">><<goto "Kutsu: ohje">><</link>>
</div>""", "scene-loppu")

    lisaa("Kutsu: ohje", f"""<<nobr>>
<div class="kutsu-ohje">
<p class="alku-tag">Tehtävä · noin 25 min</p>
<h2 class="alku-otsikko">Kenet kutsut paikalle?</h2>
<p>{A['KUTSU_JOHDANTO']}</p>
<p>Saat <strong>{len(A['KUTSU_KORTIT'])} tilannetta</strong>. Jokaisessa teet kaksi asiaa:</p>
<ol class="kutsu-askeleet"><li>Valitse ammattilainen, joka auttaa tilanteessa.</li><li>Kirjoita yhdellä lauseella, miksi valitsit hänet.</li></ol>
<p>Sitten näet, osuitko oikeaan. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.</p>
<div class="intro-nappi"><<link "Aloita">><<goto "Kutsu">><</link>></div>
</div>
<</nobr>>""", f"scene-{A['yleisKohtaus']}")

    lisaa("Kutsu", """<<nobr>>
<div id="kutsu-alue" class="kutsu-alue"></div>
<<script>>setTimeout(function () { if (window.kutsuPiirra) kutsuPiirra(); }, 0);<</script>>
<</nobr>>""", f"scene-{A['yleisKohtaus']}")

    lisaa("Kutsu: tulos", """<<nobr>>
<h2>Kenet kutsut paikalle? – tulokset</h2>
<div id="kutsu-yhteenveto"><<print setup.kutsuYhteenveto()>></div>
<p class="pieni" style="text-align:center">Lataa vastauksesi ja palauta tiedosto Classroomiin.</p>
<div class="intro-nappi action-row">
<a class="macro-link btn-primary" href="javascript:void(0)" onclick="lataaVastaukset()">Lataa vastaukset</a>
<<link "Valmis">><<goto "Loppu">><</link>>
</div>
<</nobr>>""", "scene-loppu")

    opl_teksti, opl_kohde = A["OPPILAITOKSET"]
    lisaa("Loppu", f"""<<nobr>>
<h2>Valmis!</h2>
<p>{A['LOPPU_TEKSTI']}</p>
<p>Muistitko ladata vastauksesi ja palauttaa ne Classroomiin? Jos et, <<link "palaa tuloksiin">><<goto "Kutsu: tulos">><</link>>.</p>
<div class="intro-nappi">
<<link "{opl_teksti}">><<goto "{opl_kohde}">><</link>>
</div>
<div class="info-text">
  <p><strong>Käytätkö yhteistä konetta?</strong> Tyhjennä vastauksesi ennen kuin lopetat.</p>
  <div class="intro-nappi action-row">
    <a class="macro-link btn-secondary" href="javascript:void(0)" onclick="tyhjennaKaikki(this)">Tyhjennä vastaukset</a>
    <<link "Palaa alkuun">><<goto "{kansi_nimi}">><</link>>
  </div>
</div>
<</nobr>>""", "scene-loppu")

    i = s.index("</tw-storydata>")
    s = s[:i] + "".join(uudet) + s[i:]

    # --- säilytettyjen passagejen linkit: puuttuvat kohteet -> Loppu
    nimet = {unesc(attr(a, "name")) for a, _ in PASSAGE_RE.findall(s)}
    def korjaa_linkit(mm):
        a, b = mm.group(1), mm.group(2)
        nimi = unesc(attr(a, "name"))
        if nimi not in A.get("SAILYTA", []): return mm.group(0)
        t = unesc(b)
        for f, r in A.get("SAILYTA_KORVAUKSET", []):
            t = t.replace(f, r)
        def wl(m2):
            label, kohde = m2.group(1), m2.group(2)
            return m2.group(0) if kohde in nimet else f"[[Takaisin->Loppu]]"
        t = re.sub(r'\[\[([^\]]*?)->([^\]]*?)\]\]', wl, t)
        def gt(m2):
            return m2.group(0) if m2.group(1) in nimet else '<<goto "Loppu">>'
        t = re.sub(r'<<goto "([^"]*)">>', gt, t)
        t = re.sub(r'<<link "([^"]*)">>(\s*)<<goto "Loppu">>', r'<<link "Takaisin">>\2<<goto "Loppu">>', t)
        return f'<tw-passagedata{a}>' + esc(t) + '</tw-passagedata>'
    s = PASSAGE_RE.sub(korjaa_linkit, s)

    # tarkistus: kaikki linkit osuvat
    nimet = {unesc(attr(a, "name")) for a, _ in PASSAGE_RE.findall(s)}
    puuttuu = set()
    for a, b in PASSAGE_RE.findall(s):
        t = unesc(b)
        for k in re.findall(r'<<goto "([^"]*)">>', t) + re.findall(r'\[\[[^\]]*?->([^\]]*?)\]\]', t) + re.findall(r'<<kiinnostus "[^"]*" "([^"]*)"', t):
            if k not in nimet: puuttuu.add((unesc(attr(a, "name")), k))
    assert not puuttuu, puuttuu

    # --- head: tarina alkaa aina kannesta (SugarCuben istuntotila tyhjennetään ennen käynnistystä)
    tarina = unesc(re.search(r'<tw-storydata[^>]*name="([^"]*)"', s).group(1))
    slug = re.sub(r'[^\w]+', '-', tarina.lower()).strip('-')
    nollaus = ('<script id="sc-aloita-alusta">try{sessionStorage.removeItem("' + slug + '.state");}catch(e){}</script>\n')
    if 'id="sc-aloita-alusta"' not in s:
        s = s.replace('<script id="sc-clear-saves">', nollaus + '<script id="sc-clear-saves">', 1)
        assert 'id="sc-aloita-alusta"' in s

    s = re.sub(r'<html[^>]*>', f'<html data-init="no-js" data-tausta-maailma="{A["maailma"]}" data-tausta="kansi">', s, count=1)
    s = re.sub(r'<title>.*?</title>', f'<title>{A["alaNimi"]} – {A["tarinaNimi"]}</title>', s, count=1)
    linkki = '<link rel="stylesheet" href="koulutusalat-yhteinen.css">'
    assert linkki in s
    s = s.replace(linkki, linkki + '\n<link rel="stylesheet" href="tarina-yhteinen.css">\n<script src="tarina-yhteinen.js"></script>\n<script type="module" src="tausta3d.js"></script>', 1)

    # --- tyylit: vain alan teema
    s = re.sub(r'(<style role="stylesheet" id="twine-user-stylesheet" type="text/twine-css">).*?(</style>)',
               lambda mm: mm.group(1) + "\n" + A["TEEMA"].strip() + "\n" + mm.group(2), s, count=1, flags=re.S)

    # --- skripti: vain alan data
    DATA = {
        "ala": A["ala"], "alaNimi": A["alaNimi"], "tarinaNimi": A["tarinaNimi"],
        "kello": A["kello"], "katsoTeksti": A["katsoTeksti"], "aikaRivi": A.get("aikaRivi", ""),
        "kutsuTilanneOtsikko": A.get("kutsuTilanneOtsikko", "Tilanne"),
        "piirteet": PIIRTEET, "ammatit": AMMATIT, "kutsuKortit": A["KUTSU_KORTIT"],
    }
    js = ("\n/* " + A["tarinaNimi"] + " – alan sisältö. Moottori: tarina-yhteinen.js */\n"
          "TarinaYhteinen.alusta(setup, " + json.dumps(DATA, ensure_ascii=False, indent=1) + ");\n")
    js = js.replace("</", "<\\/")
    s = re.sub(r'(<script role="script" id="twine-user-script" type="text/twine-javascript">).*?(</script>)',
               lambda mm: mm.group(1) + js + mm.group(2), s, count=1, flags=re.S)

    open(dst, "w", encoding="utf-8").write(s)
    print(f"OK {dst}: {len(s)} tavua, {len(nimet)} passagea")

if __name__ == "__main__":
    A = runpy.run_path(sys.argv[1])
    rakenna(A, sys.argv[2], sys.argv[3])
