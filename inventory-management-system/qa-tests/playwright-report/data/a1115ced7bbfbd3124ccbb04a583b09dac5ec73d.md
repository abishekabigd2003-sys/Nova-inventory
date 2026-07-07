# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication & Authorization >> Route Protection (Unauthorized Access)
- Location: tests\auth.spec.js:34:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/admin/dashboard
Call log:
  - navigating to "http://localhost:5173/admin/dashboard", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication & Authorization', () => {
  4  |   
  5  |   test('Valid Admin Login & Logout', async ({ page }) => {
  6  |     await page.goto('/login');
  7  |     await page.fill('input[type="email"]', 'admin@inventory.com');
  8  |     await page.fill('input[type="password"]', 'Admin@123!');
  9  |     await page.click('button[type="submit"]');
  10 | 
  11 |     await page.waitForURL('**/dashboard*');
  12 |     await expect(page).toHaveURL(/.*dashboard.*/);
  13 | 
  14 |     // Logout
  15 |     const logoutBtn = page.locator('button:has-text("Logout")');
  16 |     if (await logoutBtn.count() > 0) {
  17 |       await logoutBtn.click();
  18 |       await page.waitForURL('**/login*');
  19 |       await expect(page).toHaveURL(/.*login.*/);
  20 |     }
  21 |   });
  22 | 
  23 |   test('Invalid Credentials', async ({ page }) => {
  24 |     await page.goto('/login');
  25 |     await page.fill('input[type="email"]', 'admin@inventory.com');
  26 |     await page.fill('input[type="password"]', 'wrongpassword');
  27 |     await page.click('button[type="submit"]');
  28 | 
  29 |     // Expect error message
  30 |     const errorMsg = page.locator('.error, .alert, [role="alert"]');
  31 |     await expect(errorMsg).toBeVisible();
  32 |   });
  33 | 
  34 |   test('Route Protection (Unauthorized Access)', async ({ page }) => {
  35 |     // Try accessing dashboard without login
> 36 |     await page.goto('/admin/dashboard');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/admin/dashboard
  37 |     // Should redirect to login or show unauthorized
  38 |     await expect(page).toHaveURL(/.*login.*/);
  39 |   });
  40 | });
  41 | 
```