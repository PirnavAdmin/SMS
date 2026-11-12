import { test, expect } from '../../fixtures/test-fixtures';
import { BasePage } from '../../pages/BasePage';

const ADMIN_PRIMARY_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'students', label: 'Students' },
  { id: 'attendance', label: 'Student Attendance' },
  { id: 'academics', label: 'Academics' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'timetable', label: 'Timetable' },
  { id: 'examination', label: 'Examination' },
  { id: 'marks-entry', label: 'Marks Entry' },
  { id: 'report-cards', label: 'Report Cards' },
  { id: 'homework', label: 'Homework' },
  { id: 'fees', label: 'Finance & Fees' },
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'library', label: 'Library' },
  { id: 'transport', label: 'Transport' },
  { id: 'hostel', label: 'Hostel' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'staff-directory', label: 'Staff Directory' },
  { id: 'communication', label: 'Communication Hub' },
  { id: 'events', label: 'Events' },
  { id: 'training', label: 'Faculty Training' },
  { id: 'reports', label: 'School Reports' },
  { id: 'users', label: 'User Management' },
  { id: 'settings', label: 'Settings' },
];

test.describe('Smoke: Primary Application Views Stability @smoke @regression', () => {
  test('all Admin primary modules render cleanly with zero uncaught errors or 5xx responses @smoke', async ({
    adminPage,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const pageErrors: string[] = [];
    const serverErrors: string[] = [];

    adminPage.on('pageerror', (err) => pageErrors.push(err.message));
    adminPage.on('response', (res) => {
      if (res.status() >= 500) {
        serverErrors.push(`${res.status()} ${res.url()}`);
      }
    });

    const base = new BasePage(adminPage);

    for (const mod of ADMIN_PRIMARY_MODULES) {
      await test.step(`Verify module: ${mod.label} (${mod.id})`, async () => {
        await base.navigateToModule(mod.id);
        await base.assertNoFatalUiError();
      });
    }

    expect(pageErrors, `Uncaught JS errors: ${pageErrors.join(' | ')}`).toEqual([]);
    expect(serverErrors, `HTTP 5xx errors: ${serverErrors.join(' | ')}`).toEqual([]);
  });
});
