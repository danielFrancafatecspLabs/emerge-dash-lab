const https = require('https');
const token = 'ATATT3xFfGF0H948UMMf-mW3S74c_oTD1mKwgT13kRN4tFEpbm4NMu3s3ovvQv-o52cY8pW15TfkKxemnxHMaQoKAspNDTF40dTBKO-MOhuCCvurAb90_CCvImBX2efeMzFzSHIhzJB2IMn4lVvBFNgymzZH3fqXtdRxqJFGosxYTW6TuYSlor8=9F0C4DED';
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