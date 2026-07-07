import { test, expect } from '@playwright/test';

test.describe('E2E UI Testing', () => {
  let consoleErrors = [];

  test.beforeEach(({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('Admin Full Navigation & Theme Test', async ({ page }) => {
    // 1. Admin Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inventory.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to load
    await page.waitForURL('/admin/dashboard');
    expect(page.url()).toContain('/admin/dashboard');

    // 2. Theme Testing
    // Check if html has data-theme='sapphire' (Dark) initially
    const htmlTheme = await page.getAttribute('html', 'data-theme');
    
    // Toggle Theme (Button should have class theme-toggle)
    const themeBtn = await page.waitForSelector('.theme-toggle');
    await themeBtn.click();
    
    const newTheme = await page.getAttribute('html', 'data-theme');
    expect(newTheme).not.toBe(htmlTheme); // Theme should change

    // 3. Navigation to all Pages
    const routes = [
      '/admin/stock-in',
      '/admin/stock-out',
      '/admin/products',
      '/admin/categories',
      '/admin/approval',
      '/admin/reports'
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const text = await page.textContent('body');
      expect(text).not.toContain('Not Found');
    }

    // 4. Assert zero console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('User Restricted Access & Navigation', async ({ page }) => {
    // 1. User Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'testuser2@inventory.com'); // We registered this user in API tests
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for User Dashboard
    await page.waitForURL('/user/dashboard');
    expect(page.url()).toContain('/user/dashboard');

    // 2. Navigation
    const routes = [
      '/user/stock-in',
      '/user/stock-out',
      '/user/requests'
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }

    // 3. Negative testing: User accessing Admin route
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/admin/dashboard'); // Should redirect or block

    // 4. Assert zero console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
