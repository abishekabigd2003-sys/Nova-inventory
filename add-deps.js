const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'inventory-management-system/backend/api-gateway/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.dependencies.helmet = '^7.1.0';
pkg.dependencies['express-rate-limit'] = '^7.1.5';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

console.log('Added dependencies to api-gateway');
