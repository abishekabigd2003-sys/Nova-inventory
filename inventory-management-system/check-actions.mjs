import https from 'https';
import fs from 'fs';

const options = {
  hostname: 'api.github.com',
  path: '/repos/abishekabigd2003-sys/Nova-inventory/actions/runs?per_page=1',
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
      if (parsed.workflow_runs && parsed.workflow_runs.length > 0) {
        const run = parsed.workflow_runs[0];
        console.log(`Workflow: ${run.name}`);
        
        const jobsUrl = run.jobs_url;
        const jobsPath = new URL(jobsUrl).pathname;
        const jobReq = https.request({ ...options, path: jobsPath }, (jRes) => {
          let jData = '';
          jRes.on('data', chunk => jData += chunk);
          jRes.on('end', () => {
            const jParsed = JSON.parse(jData);
            jParsed.jobs.forEach(job => {
              if (job.conclusion === 'failure') {
                console.log(`Fetching logs for failed job: ${job.name} (ID: ${job.id})`);
                const logsReq = https.request({ ...options, path: `/repos/abishekabigd2003-sys/Nova-inventory/actions/jobs/${job.id}/logs` }, (lRes) => {
                  if (lRes.statusCode === 302) {
                    const logUrl = lRes.headers.location;
                    https.get(logUrl, (logStream) => {
                      let logData = '';
                      logStream.on('data', c => logData += c);
                      logStream.on('end', () => {
                        // Extract lines with errors
                        const lines = logData.split('\n');
                        const errorLines = lines.filter(l => l.includes('Error') || l.includes('failed') || l.includes('FAIL') || l.includes('npm ERR!')).slice(-50);
                        console.log('--- ERROR LOG SNIPPET ---');
                        console.log(errorLines.join('\n'));
                      });
                    });
                  }
                });
                logsReq.end();
              }
            });
          });
        });
        jobReq.end();
      }
    }
  });
});

req.on('error', console.error);
req.end();
