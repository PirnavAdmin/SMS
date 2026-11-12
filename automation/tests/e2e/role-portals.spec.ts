import { test, expect } from '../../fixtures/test-fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';

interface OptionalRoleAccount {
  role: string;
  emailEnv: string;
  passwordEnv: string;
  expectedModuleText: RegExp;
}

const OPTIONAL_ROLE_ACCOUNTS: OptionalRoleAccount[] = [
  { role: 'Teacher', emailEnv: 'TEACHER_EMAIL', passwordEnv: 'TEACHER_PASSWORD', expectedModuleText: /Dashboard|Classes|Attendance|Homework/i },
  { role: 'Accountant', emailEnv: 'ACCOUNTANT_EMAIL', passwordEnv: 'ACCOUNTANT_PASSWORD', expectedModuleText: /Dashboard|Finance|Fee/i },
  { role: 'Librarian', emailEnv: 'LIBRARIAN_EMAIL', passwordEnv: 'LIBRARIAN_PASSWORD', expectedModuleText: /Dashboard|Library|Books/i },
  { role: 'Hostel Warden', emailEnv: 'WARDEN_EMAIL', passwordEnv: 'WARDEN_PASSWORD', expectedModuleText: /Dashboard|Hostel|Students/i },
  { role: 'Student', emailEnv: 'STUDENT_EMAIL', passwordEnv: 'STUDENT_PASSWORD', expectedModuleText: /Dashboard|Attendance|Timetable|Homework/i },
  { role: 'Parent', emailEnv: 'PARENT_EMAIL', passwordEnv: 'PARENT_PASSWORD', expectedModuleText: /Dashboard|Attendance|Fee|Homework/i },
];

test.describe('E2E: Multi-Role Portal Journeys @e2e @regression', () => {
  for (const acct of OPTIONAL_ROLE_ACCOUNTS) {
    test(`${acct.role} portal login & dashboard journey @e2e`, async ({ page, apiClient }) => {
      const email = process.env[acct.emailEnv] || '';
      const password = process.env[acct.passwordEnv] || '';
      test.skip(!email || !password, `${acct.emailEnv} / ${acct.passwordEnv} not configured in .env.test`);
      test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

      const loginPage = new LoginPage(page);
      await loginPage.gotoLogin();
      await loginPage.loginAndWaitForDashboard(email, password);

      const dashboard = new DashboardPage(page);
      await dashboard.assertLoaded();
      await expect(page.locator('main')).toContainText(acct.expectedModuleText);

      await dashboard.logout();
    });
  }
});
