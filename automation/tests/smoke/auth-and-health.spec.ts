import { test, expect } from '../../fixtures/test-fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { getConfig, hasAdminCredentials } from '../../utils/env';

test.describe('Smoke: Authentication & Entry Points @smoke', () => {
  test('landing page renders branding, portals, and Sign In CTA @smoke', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const loginPage = new LoginPage(page);
    await loginPage.gotoLanding();

    await expect(loginPage.landingSignInBtn).toBeVisible();
    await expect(page.locator('body')).toContainText(/Campus|School|Portal|Admissions|Sign In/i);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('; ')}`).toEqual([]);
  });

  test('Sign In button opens login view and validates empty submission @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.openLoginFromLanding();

    await expect(loginPage.identifierInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    await loginPage.submitButton.click();
    const msg = await loginPage.getValidationOrErrorMessages();
    expect(msg.length).toBeGreaterThan(0);
  });

  test('invalid credentials show authentication error without crashing @smoke', async ({ page, apiClient }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.login('invalid.smoke@example.test', 'WrongPass!999');

    await expect(loginPage.errorBanner).toBeVisible({ timeout: 10_000 });
  });

  test('admin can authenticate end-to-end and reach Dashboard @smoke @regression', async ({ page, apiClient }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!hasAdminCredentials(), 'ADMIN_EMAIL / ADMIN_PASSWORD not configured');

    const cfg = getConfig();
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForDashboard(cfg.adminEmail, cfg.adminPassword);

    const dashboard = new DashboardPage(page);
    await dashboard.assertLoaded();

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('public branding endpoint responds < 500 @smoke @api', async ({ apiClient }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    const res = await apiClient.get('/api/Settings/public-branding');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('schoolName');
  });
});
