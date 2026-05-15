//const KALENTERI_ORIGIN = 'https://osoite-jossa-kalenteri-sijaitsee.fi';
const KALENTERI_ORIGIN = '*'; // VAIN testausvaiheessa!

window.addEventListener('message', e => {
  if (e.origin !== KALENTERI_ORIGIN) return;

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