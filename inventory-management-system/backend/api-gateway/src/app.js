import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const isProd = process.env.NODE_ENV === 'production';

// ── Security Middleware ──
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow React inline scripts
  crossOriginEmbedderPolicy: false,
}));

// ── Request Logging ──
app.use(morgan(isProd ? 'combined' : 'dev'));

// ── Compression ──
app.use(compression());

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased limit for tests
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
  skip: (req) => req.path === '/health' || req.path.startsWith('/assets'), // Skip static assets
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// ── CORS ──
const allowedOrigins = isProd
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:5000', 'http://127.0.0.1:5000', process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[api-gateway] CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ── Admin Service URL ──
const ADMIN_URL = isProd 
  ? process.env.ADMIN_SERVICE_URL 
  : (process.env.ADMIN_SERVICE_URL || 'http://localhost:5001');

if (isProd && !ADMIN_URL) {
  console.error('FATAL: ADMIN_SERVICE_URL is not defined in environment variables');
  process.exit(1);
}

// ── API Proxy Routes ──
const apiRoutes = {
  '/socket.io': ADMIN_URL,
  '/api/auth': ADMIN_URL,
  '/api/users': ADMIN_URL,
  '/api/dashboard': ADMIN_URL,
  '/api/products': ADMIN_URL,
  '/api/categories': ADMIN_URL,
  '/api/stock': ADMIN_URL,
  '/api/stock-out': ADMIN_URL,
  '/api/stockin': ADMIN_URL,
  '/api/requests': ADMIN_URL,
  '/api/notifications': ADMIN_URL,
  '/api/reports': ADMIN_URL,
  '/api/suppliers': ADMIN_URL,
  '/api/customers': ADMIN_URL,
  '/api/purchases': ADMIN_URL,
  '/api/sales': ADMIN_URL,
  '/uploads': ADMIN_URL,
  '/health': ADMIN_URL,
};

for (const [route, target] of Object.entries(apiRoutes)) {
  app.use(route, createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: route === '/socket.io',
    onError: (err, req, res) => {
      console.error(`[api-gateway] Proxy Error on ${route}: `, err.message);
      if (res.headersSent) return;
      res.status(502).json({ message: 'Bad Gateway: Service is unavailable.' });
    }
  }));
}

// ── Static File Serving (Frontend) ──
const distPath = process.env.FRONTEND_DIST_PATH
  ? path.resolve(__dirname, process.env.FRONTEND_DIST_PATH)
  : path.resolve(__dirname, '../../../frontend/dist');

if (fs.existsSync(distPath)) {
  console.log(`[api-gateway] Serving frontend from: ${distPath}`);

  // Serve static assets with cache headers
  app.use(express.static(distPath, {
    maxAge: isProd ? '1y' : 0,
    etag: true,
    index: false, // Don't auto-serve index.html — we handle SPA fallback below
  }));

  // SPA Fallback — serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn(`[api-gateway] Frontend dist not found at: ${distPath}`);
  console.warn('[api-gateway] Run "npm run build" in the frontend directory first.');
  app.get('/', (req, res) => res.json({
    message: 'API Gateway running. Frontend not built yet.',
    hint: 'Run "cd frontend && npm run build" then restart the gateway.'
  }));
}

export default app;
