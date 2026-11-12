import { test, expect } from '../../fixtures/test-fixtures';
import { AdmissionsPage } from '../../pages/AdmissionsPage';
import { StudentsPage } from '../../pages/StudentsPage';
import { buildAdmissionPayload } from '../../data/generators';

test.describe('E2E: Admissions to Student Directory Flow @e2e @regression', () => {
  test('created admission application hydrates into Admissions UI and cleans up safely @e2e @regression', async ({
    adminPage,
    adminApi,
    dataRegistry,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
    test.skip(!adminApi.getToken(), 'Admin API token not available');

    const payload = buildAdmissionPayload();
    const createRes = await adminApi.post('/api/admissions', payload);
    expect(createRes.ok(), `Expected POST /api/admissions to succeed, got ${createRes.status()}`).toBe(true);

    const createdJson = await createRes.json();
    const appId = createdJson?.data?.registrationNo || createdJson?.data?.id;
    expect(appId).toBeTruthy();
    dataRegistry.trackDelete(`/api/admissions/${appId}`, `Admission ${appId}`);

    // Verify in Admissions UI
    const admissionsPage = new AdmissionsPage(adminPage);
    await admissionsPage.open();
    await admissionsPage.assertRendered();
    await admissionsPage.searchApplicant(payload.lastName);

    await expect(adminPage.locator('main')).toContainText(payload.lastName, { timeout: 10_000 });

    // Also verify Student Directory loads cleanly
    const studentsPage = new StudentsPage(adminPage);
    await studentsPage.open();
    await studentsPage.assertRendered();
  });
});
