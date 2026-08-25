const http = require('http');

const postData = JSON.stringify({ username: 'marco_asterito', password: 'asterito2026' });
const postOptions = {
  hostname: 'localhost',
  port: 3003,
  path: '/jira/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const postReq = http.request(postOptions, (res) => {
  console.log('POST Status', res.statusCode);
  console.log('POST Headers', res.headers);
  let body = '';
  res.on('data', (d) => (body += d));
  res.on('end', () => {
    console.log('POST Body', body);
    const setCookie = res.headers['set-cookie'] || [];
    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('Using Cookie:', cookie);

    const getOptions = {
      hostname: 'localhost',
      port: 3003,
      path: '/jira/api/dashboard',
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
      },
    };

    const getReq = http.request(getOptions, (gres) => {
      console.log('GET Status', gres.statusCode);
      console.log('GET Headers', gres.headers);
      let gbody = '';
      gres.on('data', (chunk) => (gbody += chunk));
      gres.on('end', () => {
        try {
          const json = JSON.parse(gbody);
          console.log('GET Body keys:', Object.keys(json));
          if (json.error) console.error('Error:', json.error);
          else console.log('Iniciativas:', (json.iniciativas || []).length, 'Epics:', (json.epics || []).length);
        } catch (e) {
          console.log('GET Body len', gbody.length);
          console.log(gbody.slice(0,2000));
        }
      });
    });

    getReq.on('error', (e) => console.error('GET error', e));
    getReq.end();
  });
});

postReq.on('error', (e) => console.error('POST error', e));
postReq.write(postData);
postReq.end();
