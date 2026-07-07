# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.js >> UI Component Validations >> Dashboard UI Elements (Admin)
- Location: tests\ui.spec.js:34:3

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
  3  | test.describe('UI Component Validations', () => {
  4  |   let consoleErrors = [];
  5  | 
  6  |   test.beforeEach(({ page }) => {
  7  |     consoleErrors = [];
  8  |     page.on('console', msg => {
  9  |       if (msg.type() === 'error') {
  10 |         consoleErrors.push(msg.text());
  11 |       }
  12 |     });
  13 |   });
  14 | 
  15 |   test('Login Page UI Elements', async ({ page }) => {
  16 |     await page.goto('/login');
  17 |     
  18 |     // Check Layout
  19 |     const form = page.locator('form');
  20 |     await expect(form).toBeVisible();
  21 | 
  22 |     // Check Inputs & Labels
  23 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  24 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  25 | 
  26 |     // Check Buttons
  27 |     const submitBtn = page.locator('button[type="submit"]');
  28 |     await expect(submitBtn).toBeVisible();
  29 |     await expect(submitBtn).toHaveText(/Login|Sign In/i);
  30 |     
  31 |     expect(consoleErrors).toHaveLength(0);
  32 |   });
  33 | 
  34 |   test('Dashboard UI Elements (Admin)', async ({ page }) => {
  35 |     await page.goto('/login');
  36 |     await page.fill('input[type="email"]', 'admin@inventory.com');
  37 |     await page.fill('input[type="password"]', 'Admin@123!');
  38 |     await page.click('button[type="submit"]');
  39 | 
> 40 |     await page.waitForURL('**/dashboard*');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  41 | 
  42 |     // Sidebar navigation
  43 |     await expect(page.locator('nav.sidebar-nav')).toBeVisible();
  44 | 
  45 |     // Charts/Widgets
  46 |     // Assuming we have some widget containers
  47 |     const widgets = page.locator('.widget, .card');
  48 |     if (await widgets.count() > 0) {
  49 |       await expect(widgets.first()).toBeVisible();
  50 |     }
  51 | 
  52 |     // Header/Theme toggle
  53 |     const themeBtn = page.locator('.theme-toggle');
  54 |     if (await themeBtn.count() > 0) {
  55 |       await expect(themeBtn).toBeVisible();
  56 |     }
  57 | 
  58 |     expect(consoleErrors).toHaveLength(0);
  59 |   });
  60 | });
  61 | 
```