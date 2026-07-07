import { test, expect } from '@playwright/test';

test.describe('Authentication & Authorization', () => {
  
  test('Valid Admin Login & Logout', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inventory.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard*');
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Logout
    const logoutBtn = page.locator('button:has-text("Logout")');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForURL('**/login*');
      await expect(page).toHaveURL(/.*login.*/);
    }
  });

  test('Invalid Credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inventory.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Expect error message
    const errorMsg = page.locator('.error, .alert, [role="alert"]');
    await expect(errorMsg).toBeVisible();
  });

  test('Route Protection (Unauthorized Access)', async ({ page }) => {
    // Try accessing dashboard without login
    await page.goto('/admin/dashboard');
    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/.*login.*/);
  });
});
