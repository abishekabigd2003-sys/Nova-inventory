# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication & Authorization >> Valid Admin Login & Logout
- Location: tests\auth.spec.js:5:3

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
  3  | test.describe('Authentication & Authorization', () => {
  4  |   
  5  |   test('Valid Admin Login & Logout', async ({ page }) => {
  6  |     await page.goto('/login');
  7  |     await page.fill('input[type="email"]', 'admin@inventory.com');
  8  |     await page.fill('input[type="password"]', 'Admin@123!');
  9  |     await page.click('button[type="submit"]');
  10 | 
> 11 |     await page.waitForURL('**/dashboard*');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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
  36 |     await page.goto('/admin/dashboard');
  37 |     // Should redirect to login or show unauthorized
  38 |     await expect(page).toHaveURL(/.*login.*/);
  39 |   });
  40 | });
  41 | 
```