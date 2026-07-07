import https from 'https';

const options = {
  hostname: 'api.github.com',
  path: '/repos/abishekabigd2003-sys/Nova-inventory/actions/runs',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const parsed = JSON.parse(data);
      if (parsed.workflow_runs) {
        parsed.workflow_runs.slice(0, 5).forEach(run => {
          console.log(`ID: ${run.id} | Name: ${run.name} | Created At: ${run.created_at} | Status: ${run.status} | Conclusion: ${run.conclusion}`);
        });
      }
    }
  });
});

req.on('error', console.error);
req.end();
