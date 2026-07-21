-- DigiOpo – Laskutuksen seuranta ja maksun varmistus
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- TAUSTA: tilauslomake loi lisenssin täydellä voimassaololla heti lomakkeen
-- lähetyksestä, ennen kuin laskua oli maksettu. Kuka tahansa saattoi täyttää
-- lomakkeen tekaistuilla tiedoilla ja saada toimivan koulukoodin vuodeksi.
--
-- RATKAISU: tilaus luo lisenssin lyhyellä alkuvoimassaololla (30 pv). Kun
-- maksu saapuu, voimassaolo jatketaan ostettuun kauteen hallintapaneelista.
-- Jos laskua ei makseta, pääsy päättyy itsestään – oletusarvo on turvallinen
-- eikä vaadi kenenkään muistavan tehdä mitään.

-- ─── Laskutustiedot ──────────────────────────────────────────────────────────

-- Laskunumero: generoitiin aiemmin, lähetettiin sähköpostissa ja unohtui.
-- Ilman tätä saapunutta maksua ei voi yhdistää lisenssiin muuten kuin
-- sähköpostiarkistosta.
alter table lisenssit add column if not exists laskunumero text;
alter table lisenssit add column if not exists lasku_pvm   date;

-- Ostettu kausi: mihin asti voimassaolo jatketaan, kun lasku on maksettu.
-- Lasketaan tilaushetkellä (tilauspäivä + 1 tai 3 vuotta), jotta asiakas saa
-- sen mitä osti eikä maksun viivästyminen lyhennä hänen kauttaan.
alter table lisenssit add column if not exists taysi_voimassa_asti date;

-- Maksun tila. Käsin luoduilla lisensseillä (kokeilut, pilotit) tämä on true
-- heti, koska niistä ei ole laskua.
alter table lisenssit add column if not exists maksettu boolean not null default true;

-- ─── Indeksi perintätyöjonoa varten ──────────────────────────────────────────
create index if not exists lisenssit_maksamattomat_idx
  on lisenssit (maksettu, voimassa_asti)
  where maksettu = false;

-- ─── Näkymä: maksamattomat tilaukset ─────────────────────────────────────────
-- Hallintapaneelin "pian vanhenevat" -lista näyttää nämä automaattisesti,
-- koska alkuvoimassaolo on 30 päivää. Tämä näkymä on tarkempaa tarkastelua
-- varten: paljonko aikaa on jäljellä ennen kuin pääsy katkeaa.
create or replace view lisenssit_maksamattomat as
select
  koodi,
  koulu,
  yhteyshenkilö,
  email,
  tyyppi,
  laskunumero,
  lasku_pvm,
  voimassa_asti                                  as paasy_paattyy,
  taysi_voimassa_asti                            as jatketaan_asti,
  (voimassa_asti - current_date)                 as paivia_jaljella,
  (current_date - lasku_pvm)                     as paivia_laskusta
from lisenssit
where maksettu = false
  and aktiivinen = true
order by voimassa_asti asc;

-- ─── Vanhat rivit ────────────────────────────────────────────────────────────
-- Ennen tätä muutosta luodut lisenssit merkitään maksetuiksi, koska niiden
-- voimassaolo on jo asetettu täydeksi eikä laskutustietoa ole tallessa.
update lisenssit
   set maksettu = true
 where maksettu is null;

-- ─── Tarkistus ───────────────────────────────────────────────────────────────
-- select * from lisenssit_maksamattomat;
