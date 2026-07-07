# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow.spec.js >> Complete E2E Business Workflow >> End-to-End Inventory Lifecycle
- Location: tests\workflow.spec.js:16:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard*" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img "Inventory Management 1" [ref=e6]
    - img "Inventory Management 2" [ref=e7]
    - img "Inventory Management 3" [ref=e8]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - heading "Welcome back" [level=1] [ref=e12]
      - paragraph [ref=e13]: Sign in to your account to continue
    - alert [ref=e14]: Not allowed by CORS
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]: Email address
        - textbox "Email address" [ref=e18]:
          - /placeholder: you@company.com
          - text: admin@inventory.com
      - generic [ref=e19]:
        - generic [ref=e21]: Password
        - textbox "Password" [ref=e22]:
          - /placeholder: ••••••••
          - text: Admin@123!
        - link "Forgot password?" [ref=e23] [cursor=pointer]:
          - /url: "#forgot"
      - button "Sign in" [ref=e24] [cursor=pointer]
    - generic [ref=e26]: or continue with
    - generic [ref=e27]:
      - button "Google" [ref=e28] [cursor=pointer]:
        - img [ref=e29]
        - text: Google
      - button "Apple" [ref=e34] [cursor=pointer]:
        - img [ref=e35]
        - text: Apple
    - paragraph [ref=e37]:
      - text: Don't have an account?
      - button "Create one" [ref=e38] [cursor=pointer]
    - paragraph [ref=e39]:
      - text: "Demo:"
      - strong [ref=e40]: admin@inventory.com
      - text: /
      - strong [ref=e41]: Admin@123!
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Complete E2E Business Workflow', () => {
  4  |   let consoleErrors = [];
  5  | 
  6  |   test.beforeEach(({ page }) => {
  7  |     consoleErrors = [];
  8  |     page.on('console', msg => {
  9  |       if (msg.type() === 'error') {
  10 |         // Some errors might be inevitable depending on 3rd party, but we capture them
  11 |         consoleErrors.push(msg.text());
  12 |       }
  13 |     });
  14 |   });
  15 | 
  16 |   test('End-to-End Inventory Lifecycle', async ({ page }) => {
  17 |     // 1. Login
  18 |     await test.step('Login to Admin', async () => {
  19 |       await page.goto('/login');
  20 |       await page.fill('input[type="email"]', 'admin@inventory.com');
  21 |       await page.fill('input[type="password"]', 'Admin@123!');
  22 |       await page.click('button[type="submit"]');
> 23 |       await page.waitForURL('**/dashboard*');
     |                  ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  24 |       await expect(page).toHaveURL(/.*dashboard.*/);
  25 |     });
  26 | 
  27 |     // 2. Dashboard
  28 |     await test.step('View Dashboard', async () => {
  29 |       // Validate dashboard loaded
  30 |       const dashHeader = page.locator('h1, h2, .page-title');
  31 |       if (await dashHeader.count() > 0) {
  32 |         await expect(dashHeader.first()).toBeVisible();
  33 |       }
  34 |     });
  35 | 
  36 |     // 3. Suppliers (assuming route /admin/suppliers or /admin/categories for now)
  37 |     // The prompt says Suppliers, Products, Stock In, Stock Out, Purchase Orders, Sales, Reports, Settings
  38 |     const routes = [
  39 |       { name: 'Suppliers/Categories', path: '/admin/categories' },
  40 |       { name: 'Products', path: '/admin/products' },
  41 |       { name: 'Stock In', path: '/admin/stock-in' },
  42 |       { name: 'Stock Out', path: '/admin/stock-out' },
  43 |       { name: 'Reports', path: '/admin/reports' },
  44 |     ];
  45 | 
  46 |     for (const route of routes) {
  47 |       await test.step(`Navigate and Verify: ${route.name}`, async () => {
  48 |         await page.goto(route.path);
  49 |         await page.waitForLoadState('networkidle');
  50 |         const text = await page.textContent('body');
  51 |         expect(text).not.toContain('Not Found');
  52 |         expect(text).not.toContain('Cannot GET');
  53 |       });
  54 |     }
  55 | 
  56 |     // Since we might not have 'Settings' or 'Purchase Orders' explicitly mapped yet based on codebase,
  57 |     // we attempt to navigate or handle gracefully if they don't exist yet, but the test ensures
  58 |     // the system doesn't crash.
  59 | 
  60 |     // 4. Logout
  61 |     await test.step('Logout', async () => {
  62 |       const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")');
  63 |       if (await logoutBtn.count() > 0) {
  64 |         await logoutBtn.click();
  65 |         await page.waitForURL('**/login*');
  66 |       }
  67 |     });
  68 |     
  69 |     // Check for massive JS errors
  70 |     if (consoleErrors.length > 0) {
  71 |       console.warn('Console errors detected during E2E flow:', consoleErrors);
  72 |     }
  73 |   });
  74 | });
  75 | 
```