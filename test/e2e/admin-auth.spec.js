const { test, expect } = require('@playwright/test');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

test.describe('Admin Authentication', () => {
  const adminCredentials = {
    email: 'admin@datablog.dev',
    password: 'AdminPassword123',
  };

  test.beforeAll('Create admin user', async () => {
    // Create admin user using the script
    try {
      const { stdout, stderr } = await execAsync(
        `node scripts/create-admin.js ${adminCredentials.email} ${adminCredentials.password}`
      );
      console.log('Admin user creation output:', stdout);
      if (stderr) {
        console.log('Admin user creation stderr:', stderr);
      }
    } catch (error) {
      console.error('Failed to create admin user:', error.message);
      throw error;
    }
  });

  test('should create admin user successfully via script', async () => {
    // This test verifies that the beforeAll hook succeeded
    // The actual creation is tested by the script execution
    expect(true).toBeTruthy();
  });

  test('should load homepage and show login button for anonymous users', async ({
    page,
  }) => {
    await page.goto('/');

    // Check that the page loads successfully
    await expect(page).toHaveTitle(/Datablog/i);

    // Check for login button (should be visible for anonymous users)
    await expect(page.locator('#loginBtn')).toBeVisible();

    // Check for login prompt message (should be visible for anonymous users)
    await expect(
      page.locator('text=Please log in to view your pages')
    ).toBeVisible();

    // Verify that the "Your Pages" section heading is not visible for non-authenticated users
    await expect(
      page.locator('h2:has-text("📚 Your Pages")')
    ).not.toBeVisible();
  });

  test('should open login modal when login button is clicked', async ({
    page,
  }) => {
    await page.goto('/');

    // Click the login button
    await page.locator('#loginBtn').click();

    // Check that the login modal is visible
    await expect(page.locator('#loginModal')).toBeVisible();

    // Check for email and password fields
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Check for login submit button
    await expect(page.locator('#loginSubmit')).toBeVisible();
  });

  test('should successfully login with admin credentials', async ({ page }) => {
    await page.goto('/');

    // Open login modal
    await page.locator('#loginBtn').click();
    await expect(page.locator('#loginModal')).toBeVisible();

    // Fill in admin credentials
    await page.locator('#email').fill(adminCredentials.email);
    await page.locator('#password').fill(adminCredentials.password);

    // Submit the form
    await page.locator('#loginSubmit').click();

    // Wait for success message (with "Redirecting..." text)
    await expect(page.locator('#loginSuccess')).toContainText(
      'Login successful! Redirecting...',
      { timeout: 10000 }
    );

    // Wait for page to refresh automatically (the page will reload)
    await page.waitForLoadState('networkidle');

    // After refresh, check that user menu is visible and login button is hidden
    await expect(page.locator('#userMenu')).toBeVisible();
    await expect(page.locator('#userEmail')).toContainText(
      adminCredentials.email
    );
    await expect(page.locator('#loginBtn')).not.toBeVisible();
  });

  test('should show pages section after successful login', async ({ page }) => {
    await page.goto('/');

    // Login process
    await page.locator('#loginBtn').click();
    await page.locator('#email').fill(adminCredentials.email);
    await page.locator('#password').fill(adminCredentials.password);
    await page.locator('#loginSubmit').click();

    // Wait for success message and automatic page refresh
    await expect(page.locator('#loginSuccess')).toContainText(
      'Login successful! Redirecting...',
      { timeout: 10000 }
    );
    await page.waitForLoadState('networkidle');

    // After automatic refresh, check that pages section is now visible
    await expect(page.locator('h2:has-text("📚 Your Pages")')).toBeVisible();

    // Check that "Create New Page" button is visible
    await expect(page.locator('text=Create New Page')).toBeVisible();

    // Verify that the login prompt is no longer visible
    await expect(
      page.locator('text=Please log in to view your pages')
    ).not.toBeVisible();
  });

  test('should be able to navigate to create page when authenticated', async ({
    page,
  }) => {
    await page.goto('/');

    // Login process
    await page.locator('#loginBtn').click();
    await page.locator('#email').fill(adminCredentials.email);
    await page.locator('#password').fill(adminCredentials.password);
    await page.locator('#loginSubmit').click();

    // Wait for success message and automatic page refresh
    await expect(page.locator('#loginSuccess')).toContainText(
      'Login successful! Redirecting...',
      { timeout: 10000 }
    );
    await page.waitForLoadState('networkidle');

    // After automatic refresh, click on "Create New Page" button
    const createPageButton = page
      .locator('a[href="/page"]:has-text("Create New Page")')
      .first();
    await expect(createPageButton).toBeVisible();
    await createPageButton.click();

    // Should navigate to the new page form
    await expect(page).toHaveURL(/\/page\/?$/);

    // Should see the new page form
    await expect(page.locator('form')).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    await page.goto('/');

    // Login first
    await page.locator('#loginBtn').click();
    await page.locator('#email').fill(adminCredentials.email);
    await page.locator('#password').fill(adminCredentials.password);
    await page.locator('#loginSubmit').click();

    // Wait for login success and automatic page refresh
    await expect(page.locator('#loginSuccess')).toContainText(
      'Login successful! Redirecting...',
      { timeout: 10000 }
    );
    await page.waitForLoadState('networkidle');

    // After login, click on the dropdown to open user menu
    await page.locator('#userMenu .dropdown-toggle').click();

    // Click logout
    await page.locator('#logoutBtn').click();

    // Wait for automatic page refresh after logout
    await page.waitForLoadState('networkidle');

    // Should return to anonymous state after automatic refresh
    await expect(page.locator('#loginBtn')).toBeVisible();
    await expect(page.locator('#userMenu')).not.toBeVisible();

    // Should show login prompt again
    await expect(
      page.locator('text=Please log in to view your pages')
    ).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Open login modal
    await page.locator('#loginBtn').click();

    // Try with invalid credentials
    await page.locator('#email').fill('invalid@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.locator('#loginSubmit').click();

    // Should show error message
    await expect(page.locator('#loginError')).toBeVisible({ timeout: 5000 });

    // Should still be in login modal (not logged in)
    await expect(page.locator('#loginModal')).toBeVisible();
    await expect(page.locator('#loginBtn')).toBeVisible();
  });

  test('should reject empty credentials', async ({ page }) => {
    await page.goto('/');

    // Open login modal
    await page.locator('#loginBtn').click();

    // Try to submit with empty fields
    await page.locator('#loginSubmit').click();

    // Should not close modal and should show validation
    await expect(page.locator('#loginModal')).toBeVisible();

    // HTML5 validation should prevent submission
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');

    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });
});
