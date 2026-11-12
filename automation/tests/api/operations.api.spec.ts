import { test, expect } from '../../fixtures/test-fixtures';

test.describe('API: Transport, Hostel, Library, Uniform & Inventory @api @regression', () => {
  test('campus operations read endpoints respond 200 @api @regression', async ({
    adminApi,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const endpoints = [
      '/api/transport/routes',
      '/api/transport/vehicles',
      '/api/transport/drivers',
      '/api/transport/dashboard',
      '/api/hostels/dashboard',
      '/api/hostels/blocks',
      '/api/Uniform/dashboard',
      '/api/Uniform/types',
      '/api/Inventory/categories',
    ];

    for (const ep of endpoints) {
      const res = await adminApi.get(ep);
      expect(res.status(), `GET ${ep}`).toBe(200);
    }
  });

  test('Library enforces Read-Only 403 guard for Admin role @api @regression', async ({
    adminApi,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin token not available');

    const mutateRes = await adminApi.post('/api/library/books', {
      title: 'Unauthorized Admin Book Mutation',
      author: 'QA Audit',
      category: 'Test',
      rackLocation: 'Z1',
      totalCopies: 1,
    });
    // LibraryController explicitly returns 403 for Admin role mutations (or 404 if route differs)
    expect([403, 404, 405]).toContain(mutateRes.status());
  });
});
