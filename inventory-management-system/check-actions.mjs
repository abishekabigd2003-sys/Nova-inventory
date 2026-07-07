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
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const parsed = JSON.parse(data);
      if (parsed.workflow_runs && parsed.workflow_runs.length > 0) {
        const runId = parsed.workflow_runs[0].id;
        console.log(`Latest Run ID: ${runId}`);
        
        const jobsOptions = {
          hostname: 'api.github.com',
          path: `/repos/abishekabigd2003-sys/Nova-inventory/actions/runs/${runId}/jobs`,
          method: 'GET',
          headers: { 'User-Agent': 'Node.js' }
        };
        
        https.get(jobsOptions, (jRes) => {
          let jData = '';
          jRes.on('data', c => jData += c);
          jRes.on('end', () => {
            const jParsed = JSON.parse(jData);
            jParsed.jobs.forEach(job => {
              if (job.conclusion === 'failure') {
                console.log(`Job: ${job.name} - ${job.conclusion}`);
                console.log(`Job ID for logs: ${job.id}`);
                
                const logOptions = {
                  hostname: 'api.github.com',
                  path: `/repos/abishekabigd2003-sys/Nova-inventory/actions/jobs/${job.id}/logs`,
                  method: 'GET',
                  headers: { 'User-Agent': 'Node.js' }
                };
                
                // GitHub job logs redirect to an S3 URL, need to follow redirect
                const fetchLogs = (opts) => {
                  https.get(opts, (lRes) => {
                    if (lRes.statusCode > 300 && lRes.statusCode < 400 && lRes.headers.location) {
                      https.get(lRes.headers.location, (redirectRes) => {
                        let logs = '';
                        redirectRes.on('data', c => logs += c);
                        redirectRes.on('end', () => {
                          fs.writeFileSync('job_failure.log', logs);
                          console.log('Saved job logs to job_failure.log');
                        });
                      });
                    } else {
                      let logs = '';
                      lRes.on('data', c => logs += c);
                      lRes.on('end', () => {
                        fs.writeFileSync('job_failure.log', logs);
                        console.log('Saved job logs to job_failure.log');
                      });
                    }
                  });
                };
                
                fetchLogs(logOptions);
              }
            });
          });
        }).on('error', console.error);
        
      }
    }
  });
});
req.on('error', console.error);
req.end();
