import { test, expect } from '../../fixtures/test-fixtures';
import { assertMatchesSchema } from '../../utils/schema';
import { AUTH_RESPONSE_SCHEMA, PUBLIC_BRANDING_SCHEMA } from './schemas/contracts';
import { getConfig, hasAdminCredentials } from '../../utils/env';

test.describe('API: Authentication, JWT & Security Middleware @api @smoke @regression', () => {
  test('public branding & superadmin setup-status endpoints are accessible anonymously @api @smoke', async ({
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const brandingRes = await apiClient.get('/api/Settings/public-branding');
    expect(brandingRes.status()).toBe(200);
    const brandingBody = await brandingRes.json();
    expect(brandingBody.success).toBe(true);
    assertMatchesSchema(brandingBody.data, PUBLIC_BRANDING_SCHEMA, 'public-branding.data');

    const setupRes = await apiClient.get('/api/superadmin/setup-status');
    expect(setupRes.status()).toBe(200);
    const setupBody = await setupRes.json();
    expect(typeof setupBody.isConfigured).toBe('boolean');
    expect(typeof setupBody.superAdminCount).toBe('number');
  });

  test('protected endpoints reject unauthenticated requests with 401 @api @smoke', async ({ apiClient }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const protectedEndpoints = [
      '/api/v1/students',
      '/api/staff',
      '/api/classes',
      '/api/finance/fee-heads',
      '/api/dashboard/summary',
      '/api/branches',
      '/api/academic-years',
    ];

    for (const ep of protectedEndpoints) {
      const res = await apiClient.get(ep);
      expect(res.status(), `Expected 401 for unauthenticated GET ${ep}`).toBe(401);
    }
  });

  test('admin login returns valid JWT and expected AuthResponseDto schema @api @smoke @regression', async ({
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!hasAdminCredentials(), 'ADMIN_EMAIL / ADMIN_PASSWORD not configured');

    const cfg = getConfig();
    const { status, body } = await apiClient.login(cfg.adminEmail, cfg.adminPassword, 'Admin');
    expect(status).toBe(200);
    assertMatchesSchema(body, AUTH_RESPONSE_SCHEMA, 'loginResponse');
    expect(body.roles.length).toBeGreaterThan(0);

    // Verify JWT has 3 segments and valid exp claim
    const parts = String(body.token).split('.');
    expect(parts.length).toBe(3);
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    expect(claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test('invalid login credentials return 401 and malformed login returns 400 @api', async ({ apiClient }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const badCreds = await apiClient.login('wrong.user@example.test', 'WrongPass!123');
    expect([400, 401]).toContain(badCreds.status);

    const emptyCreds = await apiClient.post('/api/auth/login', { emailOrPhone: '', password: '' });
    expect(emptyCreds.status()).toBe(400);
  });

  test('OTP verify rejects invalid/non-existent code cleanly without 500 @api', async ({ apiClient }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const res = await apiClient.post('/api/auth/otp/verify', {
      emailOrPhone: 'nonexistent.otp@example.test',
      otpCode: '000000',
    });
    expect(res.status()).toBeLessThan(500);
    expect(res.ok()).toBe(false);
  });
});
