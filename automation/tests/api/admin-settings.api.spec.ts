import { test, expect } from '../../fixtures/test-fixtures';
import { assertSuccessEnvelope } from '../../utils/schema';

test.describe('API: Dashboard, Settings, Branches, Academic Years & SuperAdmin Guards @api @regression', () => {
  test('dashboard summary, branches, academic years, events, and settings return 200 @api @regression', async ({
    adminApi,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const dashRes = await adminApi.get('/api/dashboard/summary');
    expect(dashRes.status()).toBe(200);
    const dashData = assertSuccessEnvelope(await dashRes.json(), 'GET /api/dashboard/summary');
    expect(dashData).toBeTruthy();

    for (const ep of ['/api/branches', '/api/academic-years', '/api/Settings', '/api/events/options']) {
      const res = await adminApi.get(ep);
      expect(res.status(), `GET ${ep}`).toBe(200);
      assertSuccessEnvelope(await res.json(), `GET ${ep}`);
    }
  });

  test('SuperAdmin-only endpoints deny standard Admin token with 403 @api @regression', async ({
    adminApi,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    // Only enforce if the logged-in user is Admin (not SuperAdmin)
    const meRes = await adminApi.get('/api/superadmin/current-user');
    expect(meRes.status()).toBe(200);
    const me = await meRes.json();
    const roles: string[] = Array.isArray(me.roles) ? me.roles : [];
    const isSuperAdmin = roles.some((r) => r.toLowerCase().replace(/\s+/g, '') === 'superadmin');

    if (!isSuperAdmin) {
      const saSummaryRes = await adminApi.get('/api/superadmin/dashboard/summary');
      expect(saSummaryRes.status()).toBe(403);
    }
  });
});
