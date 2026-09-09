-- DigiOpo – Opettajalisenssin eksplisiittinen kytkös koulukoodiin (Vaihe 3)
-- Aja Supabase SQL Editorissa. Idempotentti (turvallinen ajaa uudelleen).
--
-- IDEA: ryhmä tarvitsee koulukoodin (ryhmä → koulukoodi → koululisenssi). Se
-- päätellään nyt opettajan lisenssistä palvelimella (api/jarjestys.js luo_oma).
-- Luotettavin lähde on TALLENNETTU kytkös: opettajalisenssin oma koulukoodi-
-- kenttä, joka täytetään tilaushetkellä (digiopo-home/api/tilaus.js) tai käsin.

-- 1) Uusi sarake: opettajalisenssin koulukoodi
alter table lisenssit add column if not exists koulukoodi text;

-- 2) Takautuva täydennys: aseta koulukoodi niille opettajalisensseille, joiden
--    koulu-nimi täsmää aktiiviseen koululisenssiin. (Nyt kannassa ei ole
--    duplikaattikoulunimiä; jos niitä joskus tulee, tämä valitsee jonkin niistä.)
update lisenssit o
set koulukoodi = k.koodi
from lisenssit k
where o.tyyppi = 'opettaja'
  and o.koulukoodi is null
  and k.tyyppi in ('vuosi', 'kunta', 'testi')
  and k.aktiivinen
  and k.koulu = o.koulu;

-- 3) Tarkistus: ketkä opettajat jäivät ilman kytköstä (orvot) — näille luo_oma
--    palauttaa selkeän virheen eikä luo orpo-ryhmää.
-- select email, koulu from lisenssit where tyyppi = 'opettaja' and koulukoodi is null;
