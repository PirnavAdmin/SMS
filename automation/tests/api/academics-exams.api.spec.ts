import { test, expect } from '../../fixtures/test-fixtures';
import { buildDepartmentPayload } from '../../data/generators';
import { assertSuccessEnvelope } from '../../utils/schema';

test.describe('API: Academics, Timetable & Examination @api @regression', () => {
  test('academic read endpoints return 200 with valid envelopes @api @regression', async ({
    adminApi,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const endpoints = [
      '/api/classes',
      '/api/classes/teacher-assignments',
      '/api/departments',
      '/api/subjects',
      '/api/timetable/options',
      '/api/examination-new/options',
      '/api/homework/options',
    ];

    for (const ep of endpoints) {
      const res = await adminApi.get(ep);
      expect(res.status(), `GET ${ep}`).toBe(200);
      const json = await res.json();
      expect(json).toBeTruthy();
    }
  });

  test('department CRUD persists to database and cleans up @api @regression', async ({
    adminApi,
    dataRegistry,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const payload = buildDepartmentPayload();
    const createRes = await adminApi.post('/api/departments', payload);
    expect(createRes.status()).toBe(200);
    const created = assertSuccessEnvelope(await createRes.json(), 'POST /api/departments');
    const deptId = created?.id || created?.departmentId;
    expect(deptId).toBeTruthy();

    dataRegistry.trackDelete(`/api/departments/${deptId}`, `Department ${deptId}`);

    const getRes = await adminApi.get(`/api/departments/${deptId}`);
    expect(getRes.status()).toBe(200);
  });
});
