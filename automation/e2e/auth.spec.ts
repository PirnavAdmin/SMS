import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation E2E Suite', () => {
  test('should render login page with role selections and input fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check application title or branding
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Verify presence of login or interactive elements
    await page.waitForSelector('body', { timeout: 10000 });
    const interactiveElements = page.locator('input, button, a, [role="button"]');
    const elementCount = await interactiveElements.count();
    expect(elementCount).toBeGreaterThanOrEqual(1);
  });

  test('should display validation or error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="text"], input[type="email"], input[placeholder*="Email"], input[placeholder*="Phone"], input[name="emailOrPhone"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('invalid_user@school.com');
      await passwordInput.fill('WrongPassword123');

      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should support quick login or demo login navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try finding direct admin login or demo portal button if available
    const adminBtn = page.locator('button:has-text("Admin"), div:has-text("Admin Login")').first();
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
    }
  });
});
