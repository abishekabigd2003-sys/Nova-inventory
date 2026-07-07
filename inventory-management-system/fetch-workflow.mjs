import https from 'https';

const options = {
  hostname: 'raw.githubusercontent.com',
  path: '/abishekabigd2003-sys/Nova-inventory/main/.github/workflows/ci-cd.yml',
  method: 'GET'
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', console.error);
