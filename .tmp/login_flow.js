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

    // Now GET /jira/bem-vindo with the cookie
    const getOptions = {
      hostname: 'localhost',
      port: 3003,
      path: '/jira/bem-vindo',
      method: 'GET',
      headers: {
        'Cookie': cookie,
      },
    };

    const getReq = http.request(getOptions, (gres) => {
      console.log('GET Status', gres.statusCode);
      console.log('GET Headers', gres.headers);
      let gbody = '';
      gres.on('data', (chunk) => (gbody += chunk));
      gres.on('end', () => {
        console.log('GET Body length', gbody.length);
      });
    });

    getReq.on('error', (e) => console.error('GET error', e));
    getReq.end();
  });
});

postReq.on('error', (e) => console.error('POST error', e));
postReq.write(postData);
postReq.end();
