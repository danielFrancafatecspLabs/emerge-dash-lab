const { fetchDashboardRaw } = require('./src/lib/jira');
fetchDashboardRaw().then(raw => {
  console.log('=== INICIATIVAS (board 2734) ===');
  raw.iniciativas.forEach(i => console.log(i.key + ': "' + i.fields.summary + '" (status: ' + i.fields.status.name + ')'));
  console.log('');
  const alvos = ['ARI', 'Jurídico', 'SPAM', 'Spam', 'Editais', 'Automação'];
  for (const alvo of alvos) {
    const encontradas = raw.iniciativas.filter(i => i.fields.summary.toLowerCase().includes(alvo.toLowerCase()));
    if (encontradas.length > 0) {
      encontradas.forEach(e => console.log('  "' + alvo + '" → "' + e.fields.summary + '" (' + e.key + ')'));
    }
  }
}).catch(e => console.error(e));