import path from 'path';
import { test, expect } from '../../fixtures/test-fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { parseCsvFile } from '../../utils/csv';
import { getConfig, hasAdminCredentials } from '../../utils/env';

const csvPath = path.resolve(__dirname, '../../data/login-cases.csv');
const loginRows = parseCsvFile(csvPath);

function resolveEnvPlaceholder(val: string): string {
  const cfg = getConfig();
  if (val === '$ADMIN_EMAIL') return cfg.adminEmail;
  if (val === '$ADMIN_PASSWORD') return cfg.adminPassword;
  return val;
}

test.describe('Data-Driven: Login Matrix (CSV) @ddt @regression', () => {
  for (const row of loginRows) {
    test(`[${row.caseId}] login outcome="${row.expectedOutcome}" @ddt`, async ({ page, apiClient }) => {
      const identifier = resolveEnvPlaceholder(row.identifier);
      const password = resolveEnvPlaceholder(row.password);

      if (row.expectedOutcome === 'success') {
        test.skip(!hasAdminCredentials(), 'ADMIN_EMAIL / ADMIN_PASSWORD not configured');
      }
      if (row.expectedOutcome !== 'validation') {
        test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');
      }

      const loginPage = new LoginPage(page);
      await loginPage.gotoLogin();
      await loginPage.identifierInput.fill(identifier);
      await loginPage.passwordInput.fill(password);
      await loginPage.submitButton.click();

      if (row.expectedOutcome === 'success') {
        await expect(page.locator('aside').first()).toBeVisible({ timeout: 20_000 });
      } else {
        const pattern = row.expectedErrorPattern ? new RegExp(row.expectedErrorPattern, 'i') : /invalid|required|error|failed/i;
        await expect(page.locator('main')).toContainText(pattern, { timeout: 10_000 });
      }
    });
  }
});
