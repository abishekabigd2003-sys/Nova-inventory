import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/anbuk/OneDrive/Desktop/inventory management system microservices-1/inventory-management-system/backend';
const services = ['auth-service', 'product-service', 'inventory-service', 'supplier-service', 'customer-service', 'purchase-service', 'sales-service'];

services.forEach(svc => {
  const dockerfileContent = "FROM node:18-alpine\nWORKDIR /app\nCOPY shared ./shared\nCOPY " + svc + "/package*.json ./" + svc + "/\nWORKDIR /app/" + svc + "\nRUN npm install\nCOPY " + svc + "/ .\nEXPOSE " + (svc === 'auth-service' ? 5001 : svc === 'product-service' ? 5002 : svc === 'inventory-service' ? 5003 : svc === 'supplier-service' ? 5004 : svc === 'customer-service' ? 5005 : svc === 'purchase-service' ? 5006 : 5007) + "\nCMD [\"npm\", \"start\"]\n";
  fs.writeFileSync(path.join(baseDir, svc, 'Dockerfile'), dockerfileContent);
});

// Update gateway dockerfile (doesn't need shared)
const gwDockerfile = "FROM node:18-alpine\nWORKDIR /app\nCOPY api-gateway/package*.json ./api-gateway/\nWORKDIR /app/api-gateway\nRUN npm install\nCOPY api-gateway/ .\nEXPOSE 5000\nCMD [\"npm\", \"start\"]\n";
fs.writeFileSync(path.join(baseDir, 'api-gateway', 'Dockerfile'), gwDockerfile);

// Update docker-compose.yml
let composeContent = fs.readFileSync(path.join(baseDir, 'docker-compose.yml'), 'utf-8');
composeContent = composeContent.replace(/build: \.\/(.*)/g, 'build:\n      context: .\n      dockerfile: ./$1/Dockerfile');
fs.writeFileSync(path.join(baseDir, 'docker-compose.yml'), composeContent);

console.log('Fixed dockerfiles and docker-compose!');
