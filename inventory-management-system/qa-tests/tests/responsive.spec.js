import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile XS', width: 320, height: 568 },
  { name: 'Mobile S', width: 360, height: 640 },
  { name: 'Mobile M', width: 375, height: 667 },
  { name: 'Mobile L', width: 390, height: 844 },
  { name: 'Mobile XL', width: 414, height: 896 },
  { name: 'Mobile XXL', width: 430, height: 932 },
  { name: 'Mobile Max', width: 480, height: 854 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Desktop', width: 1920, height: 1080 }
];

const authRoutes = [
  '/admin/dashboard',
  '/admin/products',
  '/admin/categories',
  '/admin/stock-in',
  '/admin/stock-out',
  '/admin/reports',
  '/admin/approval'
];

test.describe('Comprehensive Responsive Testing', () => {

  test.describe('Unauthenticated Routes', () => {
    for (const viewport of viewports) {
      test.describe(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        test.use({ viewport });
        
        test(`Check overflow and UI integrity on /login`, async ({ page }) => {
          await page.goto('/login');
          await page.waitForLoadState('networkidle');

          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });

          expect(hasHorizontalScroll, `Route /login has horizontal scroll at ${viewport.width}x${viewport.height}`).toBeFalsy();
        });
      });
    }
  });

  test.describe('Authenticated Routes', () => {
    test.describe.configure({ mode: 'serial' });

    let page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await page.goto('/login');
      await page.fill('input[type="email"]', 'admin@inventory.com');
      await page.fill('input[type="password"]', 'Admin@123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard*');
    });

    test.afterAll(async () => {
      await page.close();
    });

    for (const viewport of viewports) {
      test.describe(`Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        
        for (const route of authRoutes) {
          test(`Check overflow and UI integrity on ${route}`, async () => {
            await page.setViewportSize(viewport);
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            const hasHorizontalScroll = await page.evaluate(() => {
              return document.documentElement.scrollWidth > window.innerWidth;
            });

            expect(hasHorizontalScroll, `Route ${route} has horizontal scroll at ${viewport.width}x${viewport.height}`).toBeFalsy();
          });
        }
      });
    }
  });
});
