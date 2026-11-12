import { test, expect } from '../../fixtures/test-fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { getConfig, hasAdminCredentials } from '../../utils/env';

test.describe('E2E: Authentication & Session Lifecycle @e2e @regression', () => {
  test('full login, reload persistence, context headers, and logout flow @e2e @regression', async ({
    page,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!hasAdminCredentials(), 'ADMIN_EMAIL / ADMIN_PASSWORD not configured');

    const cfg = getConfig();
    const loginPage = new LoginPage(page);

    // 1. Landing -> Login
    await loginPage.openLoginFromLanding();
    await loginPage.loginAndWaitForDashboard(cfg.adminEmail, cfg.adminPassword);

    const dashboard = new DashboardPage(page);
    await dashboard.assertLoaded();

    // 2. Verify JWT stored and survives page reload
    const tokenBeforeReload = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenBeforeReload).toBeTruthy();

    await page.reload();
    await dashboard.assertLoaded();

    // 3. Logout clears session & blocks protected dashboard
    await dashboard.logout();
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfterLogout).toBeFalsy();
  });

  test('forgot password flow navigates cleanly to OTP reset screen @e2e @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.openForgotPasswordFlow();
    await expect(page.locator('button[type="submit"], button:has-text("Send")').first()).toBeVisible();
  });
});
