import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/anbuk/OneDrive/Desktop/inventory management system microservices-1/inventory-management-system/backend';

const services = [
  { name: 'auth-service', port: 5001, db: 'inventory_auth_db' },
  { name: 'product-service', port: 5002, db: 'inventory_product_db' },
  { name: 'inventory-service', port: 5003, db: 'inventory_inventory_db' },
  { name: 'supplier-service', port: 5004, db: 'inventory_supplier_db' },
  { name: 'customer-service', port: 5005, db: 'inventory_customer_db' },
  { name: 'purchase-service', port: 5006, db: 'inventory_purchase_db' },
  { name: 'sales-service', port: 5007, db: 'inventory_sales_db' }
];

const write = (p, content) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.trim() + '\n', 'utf-8');
};

const getEnv = (port, db) => `
PORT=${port}
MONGO_URI=mongodb://localhost:27017/${db}
JWT_SECRET=secret
`;

const getPackageJson = (name) => `{
  "name": "${name}",
  "version": "1.0.0",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  }
}`;

const getDockerfile = () => `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 80
CMD ["npm", "start"]
`;

const getServerJs = () => `
import app from './app.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
  })
  .catch(err => console.error(err));
`;

const getAppJs = (name) => `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('${name} is running'));

export default app;
`;

services.forEach(svc => {
  const svcPath = path.join(baseDir, svc.name);
  write(path.join(svcPath, '.env'), getEnv(svc.port, svc.db));
  write(path.join(svcPath, 'package.json'), getPackageJson(svc.name));
  write(path.join(svcPath, 'Dockerfile'), getDockerfile());
  write(path.join(svcPath, 'src/server.js'), getServerJs());
  write(path.join(svcPath, 'src/app.js'), getAppJs(svc.name));
});

// API Gateway
const gatewayPath = path.join(baseDir, 'api-gateway');
write(path.join(gatewayPath, '.env'), 'PORT=5000\n');
write(path.join(gatewayPath, 'package.json'), `{
  "name": "api-gateway",
  "version": "1.0.0",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "http-proxy-middleware": "^2.0.6"
  }
}`);
write(path.join(gatewayPath, 'Dockerfile'), getDockerfile());
write(path.join(gatewayPath, 'src/server.js'), `
import app from './app.js';
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`API Gateway running on port \${PORT}\`));
`);
write(path.join(gatewayPath, 'src/app.js'), `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();
const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));

const routes = {
  '/api/auth': 'http://localhost:5001',
  '/api/products': 'http://localhost:5002',
  '/api/categories': 'http://localhost:5002',
  '/api/stock': 'http://localhost:5003',
  '/api/requests': 'http://localhost:5003',
  '/api/notifications': 'http://localhost:5003',
  '/api/reports': 'http://localhost:5003',
  '/api/suppliers': 'http://localhost:5004',
  '/api/customers': 'http://localhost:5005',
  '/api/purchases': 'http://localhost:5006',
  '/api/sales': 'http://localhost:5007'
};

for (const [route, target] of Object.entries(routes)) {
  app.use(route, createProxyMiddleware({ target, changeOrigin: true }));
}

app.get('/', (req, res) => res.send('API Gateway running'));
export default app;
`);

// Shared setup
const sharedPath = path.join(baseDir, 'shared');
write(path.join(sharedPath, 'package.json'), `{
  "name": "shared",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "dependencies": {
    "jsonwebtoken": "^9.0.2"
  }
}`);

write(path.join(sharedPath, 'middleware/auth.middleware.js'), `
import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded; // we just pass decoded payload { id, role }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Admin' });
  }
};
`);

// docker-compose.yml
write(path.join(baseDir, 'docker-compose.yml'), `
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
  
  api-gateway:
    build: ./api-gateway
    ports:
      - "5000:5000"
    depends_on:
      - auth-service
      - product-service
      - inventory-service
      - supplier-service
      - customer-service
      - purchase-service
      - sales-service

  auth-service:
    build: ./auth-service
    ports:
      - "5001:5001"
    depends_on:
      - mongodb

  product-service:
    build: ./product-service
    ports:
      - "5002:5002"
    depends_on:
      - mongodb

  inventory-service:
    build: ./inventory-service
    ports:
      - "5003:5003"
    depends_on:
      - mongodb

  supplier-service:
    build: ./supplier-service
    ports:
      - "5004:5004"
    depends_on:
      - mongodb

  customer-service:
    build: ./customer-service
    ports:
      - "5005:5005"
    depends_on:
      - mongodb

  purchase-service:
    build: ./purchase-service
    ports:
      - "5006:5006"
    depends_on:
      - mongodb

  sales-service:
    build: ./sales-service
    ports:
      - "5007:5007"
    depends_on:
      - mongodb
`);

console.log('Scaffolding complete!');
