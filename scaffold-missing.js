import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/anbuk/OneDrive/Desktop/inventory management system microservices-1/inventory-management-system/backend';

const setupService = (name, singularName, routeName) => {
  const svcPath = path.join(baseDir, name);
  const ModelName = singularName.charAt(0).toUpperCase() + singularName.slice(1);
  
  // Model
  const modelContent = "import mongoose from 'mongoose';\n" +
"\n" +
"const " + ModelName + "Schema = new mongoose.Schema(\n" +
  "{\n" +
    "name: { type: String, required: true },\n" +
    "description: { type: String },\n" +
    "isActive: { type: Boolean, default: true }\n" +
  "},\n" +
  "{ timestamps: true }\n" +
");\n" +
"\n" +
"export default mongoose.model('" + ModelName + "', " + ModelName + "Schema);\n";

  fs.mkdirSync(path.join(svcPath, 'src/models'), { recursive: true });
  fs.writeFileSync(path.join(svcPath, 'src/models', ModelName + '.js'), modelContent);

  // Routes
  const routesContent = "import express from 'express';\n" +
"import " + ModelName + " from '../models/" + ModelName + ".js';\n" +
"import { protect, authorize } from 'shared/middleware/auth.middleware.js';\n" +
"\n" +
"const router = express.Router();\n" +
"\n" +
"router.route('/')\n" +
  ".get(protect, async (req, res, next) => {\n" +
    "try {\n" +
      "const items = await " + ModelName + ".find();\n" +
      "res.json(items);\n" +
    "} catch (error) {\n" +
      "next(error);\n" +
    "}\n" +
  "})\n" +
  ".post(protect, authorize('Admin', 'Manager'), async (req, res, next) => {\n" +
    "try {\n" +
      "const item = await " + ModelName + ".create(req.body);\n" +
      "res.status(201).json(item);\n" +
    "} catch (error) {\n" +
      "next(error);\n" +
    "}\n" +
  "});\n" +
"\n" +
"router.route('/:id')\n" +
  ".get(protect, async (req, res, next) => {\n" +
    "try {\n" +
      "const item = await " + ModelName + ".findById(req.params.id);\n" +
      "if (item) res.json(item);\n" +
      "else { res.status(404); throw new Error('" + ModelName + " not found'); }\n" +
    "} catch (error) {\n" +
      "next(error);\n" +
    "}\n" +
  "})\n" +
  ".put(protect, authorize('Admin', 'Manager'), async (req, res, next) => {\n" +
    "try {\n" +
      "const item = await " + ModelName + ".findByIdAndUpdate(req.params.id, req.body, { new: true });\n" +
      "res.json(item);\n" +
    "} catch (error) {\n" +
      "next(error);\n" +
    "}\n" +
  "})\n" +
  ".delete(protect, authorize('Admin'), async (req, res, next) => {\n" +
    "try {\n" +
      "await " + ModelName + ".findByIdAndDelete(req.params.id);\n" +
      "res.json({ message: '" + ModelName + " removed' });\n" +
    "} catch (error) {\n" +
      "next(error);\n" +
    "}\n" +
  "});\n" +
"\n" +
"export default router;\n";

  fs.mkdirSync(path.join(svcPath, 'src/routes'), { recursive: true });
  fs.writeFileSync(path.join(svcPath, 'src/routes', routeName + '.routes.js'), routesContent);

  // App.js
  const appContent = "import express from 'express';\n" +
"import cors from 'cors';\n" +
"import dotenv from 'dotenv';\n" +
"import " + routeName + "Routes from './routes/" + routeName + ".routes.js';\n" +
"import { errorHandler, notFound } from 'shared/middleware/error.middleware.js';\n" +
"\n" +
"dotenv.config();\n" +
"\n" +
"const app = express();\n" +
"app.use(cors());\n" +
"app.use(express.json());\n" +
"\n" +
"app.use('/', " + routeName + "Routes);\n" +
"\n" +
"app.use(notFound);\n" +
"app.use(errorHandler);\n" +
"\n" +
"export default app;\n";

  fs.writeFileSync(path.join(svcPath, 'src/app.js'), appContent);
  
  // Package.json - ensure shared is there
  const pkgPath = path.join(svcPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.dependencies['shared'] = 'file:../shared';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
};

setupService('supplier-service', 'supplier', 'supplier');
setupService('customer-service', 'customer', 'customer');
setupService('purchase-service', 'purchase', 'purchase');
setupService('sales-service', 'sale', 'sale');

console.log('Scaffolded missing services models and routes');
