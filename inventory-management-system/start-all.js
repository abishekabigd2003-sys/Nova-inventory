const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'api-gateway', port: 5000 },
  { name: 'auth-service', port: 5001 },
  { name: 'product-service', port: 5002 },
  { name: 'inventory-service', port: 5003 },
  { name: 'supplier-service', port: 5004 },
  { name: 'customer-service', port: 5005 },
  { name: 'purchase-service', port: 5006 },
  { name: 'sales-service', port: 5007 }
];

const backendDir = path.join(__dirname, 'backend');

console.log('🚀 Starting all Inventory Management System microservices...\n');

services.forEach(service => {
  const servicePath = path.join(backendDir, service.name);
  
  // Use npm start instead of dev
  const proc = spawn('npm', ['start'], {
    cwd: servicePath,
    shell: true,
    env: { ...process.env, PORT: service.port }
  });

  proc.stdout.on('data', data => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`[${service.name}] ${line}`);
    });
  });

  proc.stderr.on('data', data => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.error(`[${service.name} ERROR] ${line}`);
    });
  });

  proc.on('close', code => {
    console.log(`[${service.name}] exited with code ${code}`);
  });
});

console.log('All services are booting up. Output will stream below:\n');
