const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/jira/api/dashboard',
  method: 'GET',
  headers: {
    Accept: 'application/json',
    Cookie: 'auth_token=test',
  },
};

const req = http.request(options, (res) => {
  console.log('Status', res.statusCode);
  let body = '';
  res.on('data', (c) => (body += c));
  res.on('end', () => {
    try {
      const j = JSON.parse(body);
      console.log('Keys', Object.keys(j));
      if (j.error) console.error('Error', j.error);
      else console.log('Iniciativas', j.iniciativas?.length, 'Epics', j.epics?.length);
    } catch (e) {
      console.log('Body len', body.length);
    }
  });
});
req.on('error', (e) => console.error('Request error', e));
req.end();
