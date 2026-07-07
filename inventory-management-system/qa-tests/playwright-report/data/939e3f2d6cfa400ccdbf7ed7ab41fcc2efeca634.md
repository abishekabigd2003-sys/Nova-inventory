# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.js >> UI Component Validations >> Login Page UI Elements
- Location: tests\ui.spec.js:15:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

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
> 16 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
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
  40 |     await page.waitForURL('**/dashboard*');
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