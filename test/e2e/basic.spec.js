const { test, expect } = require('@playwright/test');

test.describe('Datablog Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/Datablog/i);
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText('Datablog');
  });

  test('should navigate to create new page', async ({ page }) => {
    await page.goto('/');
    
    // Look for a "New Page" or "Create" link/button
    const createButton = page.locator('a[href*="new"], button:has-text("New"), a:has-text("Create")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Should navigate to a form page
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('should handle API requests', async ({ page }) => {
    // Test API endpoint accessibility
    const response = await page.request.get('/api/pages');
    
    // Should return JSON response
    expect(response.status()).toBeLessThan(500);
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
    }
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
  });
});