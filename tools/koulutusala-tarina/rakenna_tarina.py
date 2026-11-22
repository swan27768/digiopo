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
    "play": '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
    "sydan": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
    "kassi": '<path d="M5 8h14l-1.2 12H6.2z" fill="currentColor"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    "lehti": '<path d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15z" fill="currentColor"/><path d="M5 19l8-8" fill="none" stroke="#2a1405" stroke-width="1.6" stroke-linecap="round"/>',
    "kone": '<path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" fill="currentColor"/>',
    "pokaali": '<path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.8 3.5M17 6h2.5a2.5 2.5 0 0 1-2.8 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 13v4M8.5 20h7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    "syke": '<path d="M2 12h4l2-5 4 10 3-7 2 2h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
}

# --------------------------------------------------------------------------
def valinta(v, avain, seuraava, kysymys, siirtyma_teksti, lisa=0):
    sets = f"<<set $aika += {v['aika']}>>" + (f"<<set $aika += {lisa}>>" if lisa else "")
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
    if isinstance(kv, list):   # useampi kuva rinnakkain, kuvateksteineen
        return ('<div class="kohtaus-kuvat">' + "".join(
            f'<figure class="kohtaus-kuva"><img src="{x["src"]}" alt="{x["alt"]}" width="{x["leveys"]}" height="{x["korkeus"]}" loading="lazy" decoding="async">'
            + (f'<figcaption>{x["teksti"]}</figcaption>' if x.get("teksti") else "") + '</figure>' for x in kv) + '</div>\n')
    return (f'<figure class="kohtaus-kuva"><img src="{kv["src"]}" alt="{kv["alt"]}" '
            f'width="{kv["leveys"]}" height="{kv["korkeus"]}" loading="lazy" decoding="async"></figure>\n')

def kohtaus_passage(k, nro, yht, seuraava, A):
    # Kohtauskohtainen lisäaika (esim. yö kuluu) ja siirtymäteksti ohittavat alan oletukset
    vv = "\n".join(valinta(v, k["avain"], seuraava, k["kysymys"], k.get("siirtymaTeksti", A.get("siirtymaTeksti", "")), k.get("lisaaika", 0)) for v in k["valinnat"])
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
    # Loppuosan tehtävä: oletuksena "Kenet kutsut paikalle?". Ala voi muuttaa tekstit TEHTAVA-sanakirjalla.
    TH = dict(nimi="Kenet kutsut paikalle?", tag="Tehtävä · noin 25 min",
              maara=f"<strong>{len(A['KUTSU_KORTIT'])} tilannetta</strong>",
              askeleet=["Valitse ammattilainen, joka auttaa tilanteessa.", "Kirjoita yhdellä lauseella, miksi valitsit hänet."],
              lopuksi="Sitten näet, osuitko oikeaan. Lopuksi lataat vastauksesi ja palautat ne Classroomiin.",
              tulosOtsikko=None, ohjeAskelLause="Jokaisessa teet kaksi asiaa:")
    TH.update({k: v for k, v in A.get("TEHTAVA", {}).items() if k in TH})
    pset = ", ".join(f"{k}: 0" for k in PIIRTEET)
    kset = ", ".join(f"{k}: 0" for k in AMMATIT)
    alustus = f'<<set $aika to 0>><<set $piirre to {{{pset}}}>><<set $kiinn to {{{kset}}}>><<set $korttiTop to []>>'

    korvaa("StoryInit", f"""<<run Config.saves.maxAutoSaves = 0;>>
/* {A['tarinaNimi']} – alkuarvot */
{alustus}
<<set $korttiNimi to "">>
<<set $ammatti to "">>""")

    TK = A.get("TAUSTAKUVAT", {})
    def tk(avain):
        """Taustakuva passagelle. Lista = arvotaan yksi kuva joka kerta (SugarCuben either)."""
        v = TK.get(avain)
        if not v: return ""
        if isinstance(v, list):
            return '<<run setup.taustakuva(either(' + ", ".join(f'"{x}"' for x in v) + '))>>'
        return f'<<run setup.taustakuva("{v}")>>' 
    K = A["KANSI"]
    korvaa(kansi_nimi, f"""{tk('kansi')}<<script>>
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
    lisaa("start", f"""<<nobr>>{tk('alku')}
<div class="alku-kortti">
<p class="alku-tag">{S['tag']}</p>
<h2 class="alku-otsikko">{A['tarinaNimi']}</h2>
<p class="alku-teksti">{S['teksti']}</p>
{kuva_html(S)}<ul class="alku-faktat">
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

    lisaa("Ammattikortti", f"""{tk('kortti')}<<run setup.tallennaKortti()>>
<h1>Ammattikorttisi</h1>
<p>Kortti on tehty sinun valinnoistasi ja siitä, mikä sinua kiinnosti. Se ei ole testi vaan vinkki: näitä kannattaa tutkia lisää.</p>
<div class="kortti-nimi-rivi"><label for="kortti-nimi">Nimesi korttiin (vapaaehtoinen)</label>
<input id="kortti-nimi" type="text" maxlength="40" autocomplete="off" oninput="paivitaKorttiNimi(this.value)"></div>
<div id="ammattikortti"><<print setup.korttiHTML()>></div>
<div class="intro-nappi action-row">
<a class="macro-link btn-secondary" href="javascript:void(0)" onclick="lataaAmmattikortti()">Lataa kortti kuvana</a>
<<link "Seuraava tehtävä: {TH['nimi']}">><<goto "Kutsu: ohje">><</link>>
</div>""", "scene-loppu")

    lisaa("Kutsu: ohje", f"""<<nobr>>{tk('tehtava')}
<div class="kutsu-ohje">
<p class="alku-tag">{TH['tag']}</p>
<h2 class="alku-otsikko">{TH['nimi']}</h2>
<p>{A['KUTSU_JOHDANTO']}</p>
{kuva_html(A.get('TEHTAVA', {}))}<p>Saat {TH['maara']}. {TH['ohjeAskelLause']}</p>
<ol class="kutsu-askeleet">{''.join(f'<li>{x}</li>' for x in TH['askeleet'])}</ol>
<p>{TH['lopuksi']}</p>
<div class="intro-nappi"><<link "Aloita">><<goto "Kutsu">><</link>></div>
</div>
<</nobr>>""", f"scene-{A['yleisKohtaus']}")

    lisaa("Kutsu", f"""<<nobr>>{tk('tehtava')}
<div id="kutsu-alue" class="kutsu-alue"></div>
<<script>>setTimeout(function () {{ if (window.kutsuPiirra) kutsuPiirra(); }}, 0);<</script>>
<</nobr>>""", f"scene-{A['yleisKohtaus']}")

    lisaa("Kutsu: tulos", f"""<<nobr>>{tk('tehtava')}
<h2>{TH['tulosOtsikko'] or TH['nimi'] + ' – tulokset'}</h2>
<div id="kutsu-yhteenveto"><<print setup.kutsuYhteenveto()>></div>
<p class="pieni" style="text-align:center">Lataa vastauksesi ja palauta tiedosto Classroomiin.</p>
<div class="intro-nappi action-row">
<a class="macro-link btn-primary" href="javascript:void(0)" onclick="lataaVastaukset()">Lataa vastaukset</a>
<<link "Valmis">><<goto "Loppu">><</link>>
</div>
<</nobr>>""", "scene-loppu")

    opl_teksti, opl_kohde = A["OPPILAITOKSET"]
    lisaa("Loppu", f"""<<nobr>>{tk('loppu')}
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

    # Alan omat lisäpassaget (esim. uuden alan oppilaitossivu, jota alkuperäisessä ei ole)
    for lp in A.get("LISAPASSAGET", []):
        lisaa(lp["nimi"], tk("oppilaitokset") + lp["teksti"], lp.get("tags", ""))

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
        return f'<tw-passagedata{a}>' + esc(tk('oppilaitokset') + t) + '</tw-passagedata>'
    s = PASSAGE_RE.sub(korjaa_linkit, s)

    # tarkistus: kaikki linkit osuvat
    nimet = {unesc(attr(a, "name")) for a, _ in PASSAGE_RE.findall(s)}
    puuttuu = set()
    for a, b in PASSAGE_RE.findall(s):
        t = unesc(b)
        for k in re.findall(r'<<goto "([^"]*)">>', t) + re.findall(r'\[\[[^\]]*?->([^\]]*?)\]\]', t) + re.findall(r'<<kiinnostus "[^"]*" "([^"]*)"', t):
            if k not in nimet: puuttuu.add((unesc(attr(a, "name")), k))
    assert not puuttuu, puuttuu

    # Uusi ala, jonka pohjana on toisen alan tiedosto: oma tarinan nimi ja IFID
    if A.get("TARINA_TUNNISTE"):
        T2 = A["TARINA_TUNNISTE"]
        vanha_nimi = unesc(re.search(r'<tw-storydata[^>]*name="([^"]*)"', s).group(1))
        vanha_ifid = re.search(r'<tw-storydata[^>]*ifid="([^"]*)"', s).group(1)
        s = s.replace(vanha_ifid, T2["ifid"]).replace(vanha_ifid.upper(), T2["ifid"])
        assert s.count(f'generateName("{vanha_nimi}")') == 1
        s = s.replace(f'generateName("{vanha_nimi}")', f'generateName("{T2["nimi"]}")')
        def sd(mm):
            t = re.sub(r' name="[^"]*"', f' name="{esc(T2["nimi"])}"', mm.group(0), count=1)
            return re.sub(r' ifid="[^"]*"', f' ifid="{T2["ifid"]}"', t, count=1)
        s = re.sub(r'<tw-storydata[^>]*>', sd, s, count=1)

    # --- head: tarina alkaa aina kannesta (SugarCuben istuntotila tyhjennetään ennen käynnistystä)
    tarina = unesc(re.search(r'<tw-storydata[^>]*name="([^"]*)"', s).group(1))
    # Sama muoto kuin SugarCuben Util.slugify: alaviivat ja välilyönnit -> '-'
    slug = re.sub(r'[_\s\u2013\u2014-]+', '-', re.sub(r'[^\w\s\u2013\u2014-]+', '', tarina.strip())).lower()
    # Tarina alkaa aina alusta: tila tyhjennetään latauksessa, ja jos selain palauttaa sivun
    # välimuistista (Takaisin-nappi, suljettu välilehti avataan uudelleen), sivu ladataan alusta.
    avain = slug + '.state'
    nollaus = ('<script id="sc-aloita-alusta">try{sessionStorage.removeItem("' + avain + '");}catch(e){}'
               'window.addEventListener("pageshow",function(e){if(e.persisted){try{sessionStorage.removeItem("' + avain + '");}catch(x){}location.reload();}});</script>\n')
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
    if "TEHTAVA" in A: DATA["tehtava"] = A["TEHTAVA"]
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
