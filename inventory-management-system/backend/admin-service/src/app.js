import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import productRoutes from './routes/products.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import stockRoutes from './routes/stock.routes.js';
import stockOutRoutes from './routes/stockOut.routes.js';
import requestRoutes from './routes/requests.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import reportRoutes from './routes/reports.routes.js';
import supplierRoutes from './routes/suppliers.routes.js';
import customerRoutes from './routes/customers.routes.js';
import purchaseRoutes from './routes/purchases.routes.js';
import saleRoutes from './routes/sales.routes.js';

// Middleware
import { errorHandler, notFound } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ── Security ──
app.use(helmet());

// ── Request Logging ──
// Production: concise "combined" format; Development: colorful "dev" format
app.use(morgan(isProd ? 'combined' : 'dev'));

// ── Compression ──
app.use(compression());

// ── CORS — allow frontend + gateway ──
const allowedOrigins = isProd
  ? ['http://localhost:5000']
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'admin-service', uptime: process.uptime(), timestamp: new Date().toISOString() })
);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/stock-out', stockOutRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
