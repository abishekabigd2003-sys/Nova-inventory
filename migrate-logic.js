import fs from 'fs';
import path from 'path';

const oldBase = 'c:/Users/anbuk/OneDrive/Desktop/Inventory Management System/backend';
const newBase = 'c:/Users/anbuk/OneDrive/Desktop/inventory management system microservices-1/inventory-management-system/backend';

// Helper to update imports
const fixImports = (content) => {
  let newContent = content.replace(
    /from '\.\.\/middleware\/auth\.middleware\.js'/g,
    "from 'shared/middleware/auth.middleware.js'"
  );
  // Remove unused imports or fix models
  return newContent;
};

// 1. AUTH SERVICE
fs.copyFileSync(
  path.join(oldBase, 'models/User.js'),
  path.join(newBase, 'auth-service/src/models/User.js')
);

let authRoutes = fs.readFileSync(path.join(oldBase, 'routes/auth.routes.js'), 'utf-8');
authRoutes = fixImports(authRoutes);
fs.writeFileSync(path.join(newBase, 'auth-service/src/routes/auth.routes.js'), authRoutes);

// Update auth-service app.js to use routes
let authApp = fs.readFileSync(path.join(newBase, 'auth-service/src/app.js'), 'utf-8');
authApp = authApp.replace(
  "app.get('/', (req, res) => res.send('auth-service is running'));",
  "import authRoutes from './routes/auth.routes.js';\napp.use('/', authRoutes);\napp.get('/health', (req, res) => res.send('auth-service is running'));"
);
fs.writeFileSync(path.join(newBase, 'auth-service/src/app.js'), authApp);

// Update auth-service package.json to include shared
let authPkg = JSON.parse(fs.readFileSync(path.join(newBase, 'auth-service/package.json'), 'utf-8'));
authPkg.dependencies['shared'] = 'file:../shared';
fs.writeFileSync(path.join(newBase, 'auth-service/package.json'), JSON.stringify(authPkg, null, 2));


// 2. PRODUCT SERVICE
fs.copyFileSync(
  path.join(oldBase, 'models/Product.js'),
  path.join(newBase, 'product-service/src/models/Product.js')
);
fs.copyFileSync(
  path.join(oldBase, 'models/Category.js'),
  path.join(newBase, 'product-service/src/models/Category.js')
);

let productRoutes = fs.readFileSync(path.join(oldBase, 'routes/product.routes.js'), 'utf-8');
productRoutes = fixImports(productRoutes);
fs.writeFileSync(path.join(newBase, 'product-service/src/routes/product.routes.js'), productRoutes);

let categoryRoutes = fs.readFileSync(path.join(oldBase, 'routes/category.routes.js'), 'utf-8');
categoryRoutes = fixImports(categoryRoutes);
fs.writeFileSync(path.join(newBase, 'product-service/src/routes/category.routes.js'), categoryRoutes);

let productApp = fs.readFileSync(path.join(newBase, 'product-service/src/app.js'), 'utf-8');
productApp = productApp.replace(
  "app.get('/', (req, res) => res.send('product-service is running'));",
  "import productRoutes from './routes/product.routes.js';\nimport categoryRoutes from './routes/category.routes.js';\napp.use('/', productRoutes);\napp.use('/categories', categoryRoutes);\napp.get('/health', (req, res) => res.send('product-service is running'));"
);
fs.writeFileSync(path.join(newBase, 'product-service/src/app.js'), productApp);

let productPkg = JSON.parse(fs.readFileSync(path.join(newBase, 'product-service/package.json'), 'utf-8'));
productPkg.dependencies['shared'] = 'file:../shared';
fs.writeFileSync(path.join(newBase, 'product-service/package.json'), JSON.stringify(productPkg, null, 2));


// 3. INVENTORY SERVICE
fs.copyFileSync(
  path.join(oldBase, 'models/Stock.js'),
  path.join(newBase, 'inventory-service/src/models/Stock.js')
);
fs.copyFileSync(
  path.join(oldBase, 'models/EditRequest.js'),
  path.join(newBase, 'inventory-service/src/models/EditRequest.js')
);
fs.copyFileSync(
  path.join(oldBase, 'models/AuditLog.js'),
  path.join(newBase, 'inventory-service/src/models/AuditLog.js')
);
fs.copyFileSync(
  path.join(oldBase, 'models/Notification.js'),
  path.join(newBase, 'inventory-service/src/models/Notification.js')
);

let stockRoutes = fs.readFileSync(path.join(oldBase, 'routes/stock.routes.js'), 'utf-8');
stockRoutes = fixImports(stockRoutes);
// Need to fix models imports if they are imported across services.
// e.g. Stock might import Product, we can't easily cross-reference DBs directly, but this is a naive migration as per instructions (don't rewrite logic, just move).
fs.writeFileSync(path.join(newBase, 'inventory-service/src/routes/stock.routes.js'), stockRoutes);

let requestRoutes = fs.readFileSync(path.join(oldBase, 'routes/request.routes.js'), 'utf-8');
requestRoutes = fixImports(requestRoutes);
fs.writeFileSync(path.join(newBase, 'inventory-service/src/routes/request.routes.js'), requestRoutes);

let notificationRoutes = fs.readFileSync(path.join(oldBase, 'routes/notification.routes.js'), 'utf-8');
notificationRoutes = fixImports(notificationRoutes);
fs.writeFileSync(path.join(newBase, 'inventory-service/src/routes/notification.routes.js'), notificationRoutes);

let reportRoutes = fs.readFileSync(path.join(oldBase, 'routes/report.routes.js'), 'utf-8');
reportRoutes = fixImports(reportRoutes);
fs.writeFileSync(path.join(newBase, 'inventory-service/src/routes/report.routes.js'), reportRoutes);

let inventoryApp = fs.readFileSync(path.join(newBase, 'inventory-service/src/app.js'), 'utf-8');
inventoryApp = inventoryApp.replace(
  "app.get('/', (req, res) => res.send('inventory-service is running'));",
  "import stockRoutes from './routes/stock.routes.js';\nimport requestRoutes from './routes/request.routes.js';\nimport notificationRoutes from './routes/notification.routes.js';\nimport reportRoutes from './routes/report.routes.js';\napp.use('/', stockRoutes);\napp.use('/requests', requestRoutes);\napp.use('/notifications', notificationRoutes);\napp.use('/reports', reportRoutes);\napp.get('/health', (req, res) => res.send('inventory-service is running'));"
);
fs.writeFileSync(path.join(newBase, 'inventory-service/src/app.js'), inventoryApp);

let inventoryPkg = JSON.parse(fs.readFileSync(path.join(newBase, 'inventory-service/package.json'), 'utf-8'));
inventoryPkg.dependencies['shared'] = 'file:../shared';
fs.writeFileSync(path.join(newBase, 'inventory-service/package.json'), JSON.stringify(inventoryPkg, null, 2));


console.log('Logic migration complete!');
