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

-- ─── Laskunumeroiden juokseva varaus ─────────────────────────────────────────
-- api/tilaus.js kutsuu seuraava_laskunumero()-funktiota jokaiselle laskulle.
-- Numero on muotoa VVVVNNNN (vuosi + 4-numeroinen juokseva) ja varataan
-- atomisesti, jotta kaksi samanaikaista tilausta eivät saa samaa numeroa.
--
-- HUOM: sekä tämä taulu että funktio puuttuivat aiemmin kaikista SQL-tiedostoista
-- ja elivät vain tuotannossa (skeeman ajautuma, havaittu ja korjattu 2026-07-27
-- Supabase-siirron yhteydessä). Ilman näitä kantaa ei voinut rakentaa tyhjästä.

create table if not exists laskunumerot (
  vuosi      integer primary key,
  seuraava   integer not null default 1,
  paivitetty timestamptz not null default now()
);

alter table laskunumerot enable row level security;

-- Ei suoraa pääsyä: vain palvelin (service_role) käyttää funktion kautta,
-- joka ohittaa RLS:n. Sama using(false)-malli kuin muilla tauluilla.
drop policy if exists laskunumerot_ei_paasya on laskunumerot;
create policy laskunumerot_ei_paasya on laskunumerot using (false);

-- Varaa ja palauta seuraava laskunumero atomisesti. Palauttaa 'VVVVNNNN'.
create or replace function seuraava_laskunumero() returns text
    language plpgsql
    as $$
declare
  v int := extract(year from current_date)::int;
  n int;
begin
  loop
    update laskunumerot
       set seuraava = seuraava + 1,
           paivitetty = now()
     where vuosi = v
    returning seuraava - 1 into n;

    exit when found;

    -- Vuoden ensimmäinen lasku: rivi puuttuu vielä.
    begin
      insert into laskunumerot (vuosi, seuraava) values (v, 2);
      n := 1;
      exit;
    exception when unique_violation then
      -- Toinen pyyntö ehti luoda rivin. Kierretään uudelleen, jolloin
      -- UPDATE-haara hoitaa varauksen.
      null;
    end;
  end loop;

  -- Muoto on kiinteä 4 numeroa, koska api/tilaus.js pilkkoo laskunumeron
  -- näyttöä varten kohdasta 4 (slice(0,4) + "-" + slice(4)). Jos numeroita
  -- tulisi viisi, näyttömuoto ja viitenumero menisivät hiljaisesti rikki.
  -- Mieluummin kaatuu äänekkäästi.
  if n > 9999 then
    raise exception
      'Laskunumerot loppuivat vuodelta % (max 9999). Laajenna muotoa ennen jatkoa.', v;
  end if;

  return v::text || lpad(n::text, 4, '0');
end;
$$;

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
