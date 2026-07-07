import { test, expect } from '@playwright/test';

test.describe('UI Component Validations', () => {
  let consoleErrors = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('Login Page UI Elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check Layout
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check Inputs & Labels
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Check Buttons
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText(/Login|Sign In/i);
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('Dashboard UI Elements (Admin)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inventory.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard*');

    // Sidebar navigation
    await expect(page.locator('nav.sidebar-nav')).toBeVisible();

    // Charts/Widgets
    // Assuming we have some widget containers
    const widgets = page.locator('.widget, .card');
    if (await widgets.count() > 0) {
      await expect(widgets.first()).toBeVisible();
    }

    // Header/Theme toggle
    const themeBtn = page.locator('.theme-toggle');
    if (await themeBtn.count() > 0) {
      await expect(themeBtn).toBeVisible();
    }

    expect(consoleErrors).toHaveLength(0);
  });
});
