import https from 'https';

const options = {
  hostname: 'api.github.com',
  path: '/repos/abishekabigd2003-sys/Nova-inventory/contents/.github/workflows',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const parsed = JSON.parse(data);
      parsed.forEach(file => {
        console.log(`File: ${file.name}`);
      });
    } else {
      console.log(`Error: ${res.statusCode} ${data}`);
    }
  });
});
req.on('error', console.error);
req.end();
