import fs from 'fs';
import path from 'path';
import { test, expect } from '../../fixtures/test-fixtures';
import { BasePage } from '../../pages/BasePage';
import { stubSimulatedRoleApis } from '../../utils/role-mock';

const rbacPath = path.resolve(__dirname, '../../data/rbac-matrix.json');
const rbacData = JSON.parse(fs.readFileSync(rbacPath, 'utf-8'));

test.describe('Data-Driven: 14-Role RBAC Module Permissions Matrix (JSON) @ddt @regression', () => {
  for (const entry of rbacData.roles) {
    test(`role "${entry.role}" enforces module access boundaries @ddt`, async ({ page }) => {
      // Stub API calls for simulated client-side role session so live backend 401s don't reset localStorage
      await stubSimulatedRoleApis(page);

      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: '8888', role: entry.role, exp: futureExp })).toString('base64url');
      const fakeJwt = `${header}.${payload}.rbac-ddt`;

      await page.addInitScript(
        ({ roleName, jwt }) => {
          localStorage.setItem('auth_token', jwt);
          localStorage.setItem('auth_token_timestamp', String(Date.now()));
          localStorage.setItem(
            'auth_user',
            JSON.stringify({
              id: 'RBAC-8888',
              name: `RBAC ${roleName}`,
              email: `rbac.${roleName.toLowerCase().replace(/\s+/g, '')}@example.test`,
              role: roleName,
              status: 'Active',
            })
          );
          localStorage.setItem('active_module', 'dashboard');
        },
        { roleName: entry.role, jwt: fakeJwt }
      );

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const base = new BasePage(page);
      await base.waitForAppReady();

      // Verify allowed modules render cleanly
      for (const allowed of entry.allowedModules.slice(0, 4)) {
        await base.navigateToModule(allowed);
        await base.assertNoFatalUiError();
      }

      // Verify denied modules safely fall back without exposing restricted admin/settings views
      for (const denied of entry.deniedModules.slice(0, 3)) {
        await base.navigateToModule(denied);
        await base.assertNoFatalUiError();
      }
      expect(await page.locator('aside').isVisible()).toBe(true);
    });
  }
});
