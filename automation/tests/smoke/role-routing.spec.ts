import { test, expect } from '../../fixtures/test-fixtures';
import { BasePage } from '../../pages/BasePage';
import { stubSimulatedRoleApis } from '../../utils/role-mock';

interface RoleSmokeCase {
  role: string;
  expectedSidebarLabels: string[];
  forbiddenSidebarLabels: string[];
  restrictedModule: string;
}

const ROLE_CASES: RoleSmokeCase[] = [
  {
    role: 'Teacher',
    expectedSidebarLabels: ['Dashboard', 'Student Directory', 'Student Attendance', 'Marks Entry', 'Homework'],
    forbiddenSidebarLabels: ['Admissions', 'User Management', 'Settings'],
    restrictedModule: 'settings',
  },
  {
    role: 'Accountant',
    expectedSidebarLabels: ['Dashboard', 'Inventory', 'Communication Hub'],
    forbiddenSidebarLabels: ['Admissions', 'Examinations', 'Settings'],
    restrictedModule: 'admissions',
  },
  {
    role: 'Librarian',
    expectedSidebarLabels: ['Dashboard', 'Library', 'Communication Hub'],
    forbiddenSidebarLabels: ['Admissions', 'Settings', 'Examinations'],
    restrictedModule: 'settings',
  },
  {
    role: 'Student',
    expectedSidebarLabels: ['Dashboard', 'Student Attendance', 'Timetable', 'Homework'],
    forbiddenSidebarLabels: ['Admissions', 'Settings', 'School Reports'],
    restrictedModule: 'admissions',
  },
  {
    role: 'Parent',
    expectedSidebarLabels: ['Dashboard', 'Student Attendance', 'Timetable', 'Homework'],
    forbiddenSidebarLabels: ['Admissions', 'Settings', 'Inventory'],
    restrictedModule: 'settings',
  },
];

test.describe('Smoke: Role-Based Routing & Sidebar Isolation @smoke @regression', () => {
  for (const rc of ROLE_CASES) {
    test(`role "${rc.role}" sees permitted sidebar items and falls back on restricted modules @smoke`, async ({ page }) => {
      // Stub API calls for simulated client-side role session so live backend 401s don't reset localStorage
      await stubSimulatedRoleApis(page);

      // Seed a simulated client session using a structurally valid non-expired JWT envelope
      // to verify client-side RBAC routing & sidebar rendering quickly.
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: '9999', role: rc.role, exp: futureExp })).toString('base64url');
      const fakeJwt = `${header}.${payload}.smoke-signature`;

      await page.addInitScript(
        ({ roleName, jwt }) => {
          const mockUser = {
            id: 'SMOKE-9999',
            name: `Smoke ${roleName}`,
            email: `smoke.${roleName.toLowerCase().replace(/\s+/g, '')}@example.test`,
            role: roleName,
            status: 'Active',
          };
          localStorage.setItem('auth_token', jwt);
          localStorage.setItem('auth_token_timestamp', String(Date.now()));
          localStorage.setItem('auth_user', JSON.stringify(mockUser));
          localStorage.setItem('active_module', 'dashboard');
        },
        { roleName: rc.role, jwt: fakeJwt }
      );

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const base = new BasePage(page);
      await base.waitForAppReady();

      const labels = await base.getVisibleSidebarLabels();
      const joined = labels.join(' | ');

      for (const expected of rc.expectedSidebarLabels) {
        expect(joined, `Expected "${expected}" in sidebar for ${rc.role}`).toContain(expected);
      }
      for (const forbidden of rc.forbiddenSidebarLabels) {
        expect(labels.some((l) => l.toLowerCase() === forbidden.toLowerCase()), `Did not expect "${forbidden}" for ${rc.role}`).toBe(false);
      }

      // Attempt navigating to a restricted module and verify it does not crash or expose restricted admin settings
      await base.navigateToModule(rc.restrictedModule);
      await base.assertNoFatalUiError();
    });
  }
});
