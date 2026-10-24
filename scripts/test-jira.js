const https = require('https');
const token = '***REMOVIDO***';
const email = 'daniel.anunciacao@claro.com.br';
const auth = Buffer.from(`${email}:${token}`).toString('base64');

const req = https.get('https://clarobr-jsw-tecnologia.atlassian.net/rest/api/3/myself', {
  headers: { 'Authorization': `Basic ${auth}` }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Resposta:', d.slice(0, 300));
  });
});
req.on('error', e => console.log('ERRO:', e.message));
req.end();