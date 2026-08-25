const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/jira/api/dashboard',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log('Status', res.statusCode);
  console.log('Headers', res.headers);
  let body = '';
  res.on('data', (chunk) => { body += chunk });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log('Body keys:', Object.keys(json));
      if (json.error) console.error('Error:', json.error);
      else console.log('Iniciativas:', (json.iniciativas || []).length, 'Epics:', (json.epics || []).length);
    } catch (e) {
      console.log('Response not JSON or too large. Length:', body.length);
      console.log(body.slice(0,1000));
    }
  });
});

req.on('error', (e) => console.error('Request error', e));
req.end();
