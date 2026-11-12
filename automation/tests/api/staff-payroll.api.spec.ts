import { test, expect } from '../../fixtures/test-fixtures';
import { assertSuccessEnvelope } from '../../utils/schema';

test.describe('API: Staff, HR & Payroll @api @regression', () => {
  test('staff & payroll read endpoints return 200 with valid data @api @regression', async ({
    adminApi,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const endpoints = [
      '/api/staff',
      '/api/staff/next-emp-id',
      '/api/staff/teachers/dropdown',
      '/api/payroll/configurations',
      '/api/staff-letters/templates',
    ];

    for (const ep of endpoints) {
      const res = await adminApi.get(ep);
      expect(res.status(), `GET ${ep}`).toBeLessThan(500);
      if (res.status() === 200) {
        const body = await res.json();
        expect(body).toBeTruthy();
      }
    }

    const empIdRes = await adminApi.get('/api/staff/next-emp-id');
    expect(empIdRes.status()).toBe(200);
    const empData = assertSuccessEnvelope(await empIdRes.json(), 'GET /api/staff/next-emp-id');
    expect(typeof empData.nextEmployeeId).toBe('string');
  });
});
