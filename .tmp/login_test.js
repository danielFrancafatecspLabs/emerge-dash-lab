const http = require('http');
const data = JSON.stringify({ username: 'marco_asterito', password: 'asterito2026' });
const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/jira/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('StatusCode', res.statusCode);
  console.log('Headers', res.headers);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Body', body);
  });
});

req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
