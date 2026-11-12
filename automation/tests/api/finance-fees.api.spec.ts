import { test, expect } from '../../fixtures/test-fixtures';
import { buildFeeHeadPayload } from '../../data/generators';
import { assertSuccessEnvelope } from '../../utils/schema';

test.describe('API: Finance & Fee Management @api @regression', () => {
  test('finance read endpoints return 200 and expected envelope shapes @api @regression', async ({
    adminApi,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const endpoints = [
      '/api/finance/fee-heads',
      '/api/finance/accounts',
      '/api/finance/transactions?page=1&pageSize=10',
      '/api/finance/transactions/summary',
      '/api/finance/fee-collection/students?page=1&pageSize=10',
      '/api/fees/options',
    ];

    for (const ep of endpoints) {
      const res = await adminApi.get(ep);
      expect(res.status(), `GET ${ep}`).toBe(200);
      const body = await res.json();
      assertSuccessEnvelope(body, `GET ${ep}`);
    }
  });

  test('fee-head creation persists and cleans up without leaving test records @api @regression', async ({
    adminApi,
    dataRegistry,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const payload = buildFeeHeadPayload();
    const createRes = await adminApi.post('/api/finance/fee-heads', payload);
    expect(createRes.status()).toBe(200);

    const created = assertSuccessEnvelope(await createRes.json(), 'POST /api/finance/fee-heads');
    expect(created.name).toBe(payload.name);
    if (created.id) {
      dataRegistry.trackDelete(`/api/finance/fee-heads/${created.id}`, `FeeHead ${created.id}`);
    }
  });
});
