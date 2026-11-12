import { test, expect } from '../../fixtures/test-fixtures';
import { buildAdmissionPayload } from '../../data/generators';
import { assertMatchesSchema, assertSuccessEnvelope } from '../../utils/schema';
import { ADMISSION_ITEM_SCHEMA, STUDENT_PAGED_SCHEMA } from './schemas/contracts';

test.describe('API: Admissions & Students Lifecycle @api @regression', () => {
  test('POST -> GET -> PUT -> DELETE admission persists and cleans up DB state @api @regression', async ({
    adminApi,
    dataRegistry,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const payload = buildAdmissionPayload();

    // 1. Create
    const createRes = await adminApi.post('/api/admissions', payload);
    expect(createRes.status()).toBe(200);
    const createdData = assertSuccessEnvelope(await createRes.json(), 'POST /api/admissions');
    assertMatchesSchema(createdData, ADMISSION_ITEM_SCHEMA, 'createdAdmission');

    const identifier = createdData.registrationNo || String(createdData.id);
    dataRegistry.trackDelete(`/api/admissions/${identifier}`, `Admission ${identifier}`);

    // 2. Read back from DB
    const getRes = await adminApi.get(`/api/admissions/${identifier}`);
    expect(getRes.status()).toBe(200);
    const fetched = assertSuccessEnvelope(await getRes.json(), 'GET /api/admissions/{id}');
    expect(fetched.lastName || fetched.applicantFullName).toContain(payload.lastName);

    // 3. Update
    const updateRes = await adminApi.put(`/api/admissions/${identifier}`, {
      ...payload,
      address: '202 Updated QA Street',
    });
    expect(updateRes.status()).toBe(200);

    // 4. Delete & verify 404
    const delRes = await adminApi.delete(`/api/admissions/${identifier}`);
    expect(delRes.status()).toBe(200);

    const afterDelRes = await adminApi.get(`/api/admissions/${identifier}`);
    expect(afterDelRes.status()).toBe(404);
  });

  test('GET /api/v1/students and dropdowns match contract @api @regression', async ({ adminApi, apiClient }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const res = await adminApi.get('/api/v1/students?pageNumber=1&pageSize=10');
    expect(res.status()).toBe(200);
    const body = await res.json();
    assertMatchesSchema(body, STUDENT_PAGED_SCHEMA, 'GET /api/v1/students');

    for (const dropdownPath of [
      '/api/v1/students/dropdowns/academic-years',
      '/api/v1/students/dropdowns/classes',
    ]) {
      const ddRes = await adminApi.get(dropdownPath);
      expect(ddRes.status(), `GET ${dropdownPath}`).toBe(200);
      expect(Array.isArray(await ddRes.json())).toBe(true);
    }
  });
});
