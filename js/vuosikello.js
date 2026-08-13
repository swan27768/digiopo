// HUOM: Tätä tiedostoa EI käytetä tuotannossa. Varsinainen host-silta on
// upotettu suoraan sivut/9luokka.html:ään (avaaVuosikello + message-kuuntelija).
// Jäljellä referenssiksi. Jos otat käyttöön, aseta KALENTERI_ORIGIN oikeaan
// osoitteeseen tuotannossa.
//
// const KALENTERI_ORIGIN = 'https://app.digiopo.fi';
const KALENTERI_ORIGIN = '*'; // '*' = älä rajaa originia (vain testaus!)

window.addEventListener('message', e => {
  // Kun origin on '*', ei rajata; muuten vaaditaan täsmäävä origin.
  if (KALENTERI_ORIGIN !== '*' && e.origin !== KALENTERI_ORIGIN) return;

  // Kalenteri pyytää tallennettua dataa
  if (e.data?.type === 'vuosikello-load-request') {
    const userId = getCurrentUserId(); // digikirjasi oma funktio
    const saved = localStorage.getItem('vuosikello-' + userId);
    e.source.postMessage({
      type: 'vuosikello-load-response',
      payload: saved || '{}'
    }, KALENTERI_ORIGIN);
  }

  // Kalenteri lähettää päivitetyn datan tallennettavaksi
  if (e.data?.type === 'vuosikello-save') {
    const userId = getCurrentUserId();
    localStorage.setItem('vuosikello-' + userId, e.data.payload);
  }

  // Säädä iframen korkeus sisällön mukaan
  if (e.data?.type === 'vuosikello-height') {
    document.getElementById('kalenteri-iframe').style.height = e.data.height + 'px';
  }
});