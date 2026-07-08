import { test, expect } from '@playwright/test';

test.describe('Stock In Workflow', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      // Ignore known false positives like missing favicon or our own rate limit skips
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('429')) {
        consoleErrors.push(msg.text());
      }
    });

    // Login as Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@inventory.com');
    await page.fill('input[type="password"]', 'Admin@123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard*');
    
    await page.waitForTimeout(500); // Give React time to settle
    
    const imsUser = await page.evaluate(() => localStorage.getItem('ims_user'));
    console.log('ims_user in localStorage before click:', imsUser);
    
    // Go to Stock In Page
    await page.locator('nav a[href="/admin/dashboard/stock-in"]').click();
    await page.waitForSelector('.stockin-container');
  });

  test('Should render the Stock In form and table', async ({ page }) => {
    // Form Pane
    await expect(page.locator('.stockin-form')).toBeVisible();
    await expect(page.locator('input[name="poNumber"]')).toBeVisible();
    await expect(page.locator('input[name="partyName"]')).toBeVisible();
    
    // Table Pane - either empty state or table
    const tableVisible = await page.locator('.erp-table').isVisible();
    const emptyVisible = await page.locator('.empty-state').isVisible();
    expect(tableVisible || emptyVisible).toBeTruthy();
    
    await expect(page.locator('.search-box')).toBeVisible();
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('Should validate and submit a new Stock In record', async ({ page }) => {
    const randomPO = `PO-${Math.floor(Math.random() * 10000)}`;

    // Fill form
    await page.fill('input[name="poNumber"]', randomPO);
    await page.fill('input[name="partyName"]', 'QA Supplier');
    await page.fill('input[name="yarnCount"]', '40s QA');
    await page.fill('input[name="itemName"]', 'QA Cotton');
    await page.fill('input[name="baleCount"]', '5');
    await page.fill('input[name="weight"]', '250.5');
    
    // Submit
    await page.click('button[type="submit"]');

    // Wait for success alert or error alert
    const successAlert = page.locator('.alert-success');
    const errorAlert = page.locator('.alert-error');
    
    await Promise.race([
      successAlert.waitFor({ state: 'visible', timeout: 5000 }),
      errorAlert.waitFor({ state: 'visible', timeout: 5000 })
    ]).catch(() => {});

    if (await errorAlert.isVisible()) {
      const errorMsg = await errorAlert.textContent();
      throw new Error(`Submission failed with error: ${errorMsg}`);
    }

    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('successfully');

    // Verify record in table
    await page.waitForTimeout(1000); // Wait for table refresh
    const tableRow = page.locator('tr').filter({ hasText: randomPO });
    await expect(tableRow).toBeVisible();
    await expect(tableRow).toContainText('QA Supplier');
    await expect(tableRow).toContainText('QA Cotton');
    await expect(tableRow).toContainText('5');
    await expect(tableRow).toContainText('250.5 KG');

    // Verify search works
    await page.fill('.search-box input', randomPO);
    await page.waitForTimeout(500); // Debounce
    await expect(page.locator('.erp-table tbody tr')).toHaveCount(1);

    expect(consoleErrors).toHaveLength(0);
  });
});
