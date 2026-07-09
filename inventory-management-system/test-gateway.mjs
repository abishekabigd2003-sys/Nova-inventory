import http from 'http';

const req = http.request({
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:5173'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Body:', data));
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(JSON.stringify({ email: 'admin@inventory.com', password: 'Admin@123!' }));
req.end();
