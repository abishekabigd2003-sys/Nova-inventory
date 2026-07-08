import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Desktop', width: 1920, height: 1080 }
];

const routes = [
  '/admin/dashboard',
  '/admin/products',
  '/admin/categories',
  '/admin/stock-in',
  '/admin/stock-out',
  '/admin/reports',
  '/admin/approval'
];

test.describe('Comprehensive Responsive Testing', () => {
  test.describe.configure({ mode: 'serial' });

  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Login as Admin
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
      
      test.beforeAll(async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const route of routes) {
        test(`Check overflow and UI integrity on ${route}`, async () => {
          await page.goto(route);
          await page.waitForLoadState('networkidle');

          // Wait a brief moment for any animations or responsive hooks to settle
          await page.waitForTimeout(500);

          // Evaluate if there's horizontal scrollbar
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth ||
                   document.body.scrollWidth > window.innerWidth;
          });

          // Find EXACTLY which element is causing overflow:
          if (hasHorizontalScroll) {
             const overflowElements = await page.evaluate(() => {
                const elems = document.querySelectorAll('*');
                const overflowing = [];
                for (const el of elems) {
                   const rect = el.getBoundingClientRect();
                   if (rect.right > window.innerWidth && rect.width > 0) {
                      let tagStr = el.tagName.toLowerCase();
                      if (el.className && typeof el.className === 'string') {
                         tagStr += '.' + el.className.split(' ').join('.');
                      }
                      overflowing.push(tagStr);
                   }
                }
                return overflowing;
             });
             console.log(`[ERROR] [${viewport.name}] ${route} has horizontal scroll! Elements pushing boundaries:\n`, overflowElements.slice(0, 10));
          }

          expect(hasHorizontalScroll).toBe(false);
        });
      }
    });
  }
});
