import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/anbuk/OneDrive/Desktop/inventory management system microservices-1/inventory-management-system/backend';

const addErrorHandlers = (svcName) => {
  const appPath = path.join(baseDir, svcName, 'src', 'app.js');
  let content = fs.readFileSync(appPath, 'utf8');

  // Skip if already added
  if (content.includes('errorHandler')) return;

  // Add imports
  content = content.replace("import dotenv from 'dotenv';", "import dotenv from 'dotenv';\nimport { errorHandler, notFound } from 'shared/middleware/error.middleware.js';");

  // Add middleware before export default app;
  content = content.replace("export default app;", "app.use(notFound);\napp.use(errorHandler);\n\nexport default app;");

  fs.writeFileSync(appPath, content);
};

addErrorHandlers('auth-service');
addErrorHandlers('product-service');
addErrorHandlers('inventory-service');

console.log('Added error handlers to core services');
