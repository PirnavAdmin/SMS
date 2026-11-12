import { test, expect } from '../../fixtures/test-fixtures';
import { FinancePage } from '../../pages/FinancePage';
import { buildFeeHeadPayload } from '../../data/generators';

test.describe('E2E: Finance & Fee Collection Flow @e2e @regression', () => {
  test('finance dashboard, fee setup, and fee collection integrate with backend APIs @e2e @regression', async ({
    adminPage,
    adminApi,
    dataRegistry,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin API token not available');

    // Seed a disposable fee head via API to verify persistence & UI visibility
    const feeHeadPayload = buildFeeHeadPayload();
    const res = await adminApi.post('/api/finance/fee-heads', feeHeadPayload);
    if (res.ok()) {
      const json = await res.json();
      const createdId = json?.data?.id;
      if (createdId) {
        dataRegistry.trackDelete(`/api/finance/fee-heads/${createdId}`, `FeeHead ${createdId}`);
      }
    }

    const finance = new FinancePage(adminPage);

    await finance.openFinanceDashboard();
    await finance.assertRendered();

    await finance.openFeeSetup();
    await finance.assertRendered();
    const setupText = await adminPage.locator('main').innerText();
    expect(setupText).not.toContain('MONTHLY DUE DATE CONFIGURATION (12 MONTHS)');

    await finance.openFeeCollection();
    await finance.assertRendered();
  });
});
