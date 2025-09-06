const { test, expect } = require('@playwright/test');

test.describe('Console Error Prevention', () => {
  test('should not have CSP violations for Google Fonts', async ({ page }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for CSP violations related to Google Fonts
    const cspErrors = consoleErrors.filter(
      error =>
        error.includes('Content Security Policy') &&
        error.includes('fonts.googleapis.com')
    );

    expect(cspErrors).toHaveLength(0);
  });

  test('should handle 401 errors gracefully for unauthenticated users', async ({
    page,
  }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for 401 errors - these should be handled gracefully
    const unauthorizedErrors = consoleErrors.filter(
      error => error.includes('401') && error.includes('Unauthorized')
    );

    // 401 errors are expected for unauthenticated users, but they should be handled gracefully
    // The app should not crash or show error messages to users
    expect(unauthorizedErrors.length).toBeLessThanOrEqual(2); // Allow some 401s but not excessive

    // Verify the page still loads correctly despite 401 errors
    await expect(page.locator('h1')).toContainText('Datablog');
    await expect(page.locator('#loginBtn')).toBeVisible();
  });

  test('should not have JavaScript runtime errors', async ({ page }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for JavaScript runtime errors (not network errors)
    const jsErrors = consoleErrors.filter(
      error =>
        !error.includes('Content Security Policy') &&
        !error.includes('Failed to load resource') &&
        !error.includes('401') &&
        !error.includes('Unauthorized')
    );

    expect(jsErrors).toHaveLength(0);
  });

  test('should load without critical console warnings', async ({ page }) => {
    const consoleWarnings = [];

    // Listen for console warnings
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for critical warnings that should be addressed
    const criticalWarnings = consoleWarnings.filter(
      warning =>
        warning.includes('deprecated') ||
        warning.includes('security') ||
        warning.includes('performance')
    );

    // Log warnings for visibility but don't fail the test
    if (consoleWarnings.length > 0) {
      console.log('Console warnings found:', consoleWarnings);
    }

    // Only fail on critical warnings
    expect(criticalWarnings).toHaveLength(0);
  });

  test('should handle authenticated user without console errors', async ({
    page,
  }) => {
    const consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Login as admin user
    await page.locator('#loginBtn').click();
    await page.locator('#email').fill('admin@example.com');
    await page.locator('#password').fill('DatablogAdminPassword123');
    await page.locator('#loginSubmit').click();

    // Wait for login success
    await expect(page.locator('#loginSuccess')).toContainText(
      'Login successful!'
    );
    await page.waitForLoadState('networkidle');

    // Check that authenticated user has fewer console errors
    const cspErrors = consoleErrors.filter(error =>
      error.includes('Content Security Policy')
    );

    // Should still have no CSP errors even when authenticated
    expect(cspErrors).toHaveLength(0);

    // Verify user is logged in successfully
    await expect(page.locator('#userEmail')).toContainText('admin@example.com');
  });
});
