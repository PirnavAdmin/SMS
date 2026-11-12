import { test as base, Page } from '@playwright/test';
import { getConfig, hasAdminCredentials } from '../utils/env';
import { SmsApiClient } from '../utils/api-client';
import { TestDataRegistry } from '../data/seed-and-cleanup';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

export interface SmsFixtures {
  apiClient: SmsApiClient;
  adminApi: SmsApiClient;
  dataRegistry: TestDataRegistry;
  adminPage: Page;
}

let cachedAdminToken: string | null = null;
let cachedAdminRole = '';
let cachedAdminBranch = '';

export const test = base.extend<SmsFixtures>({
  apiClient: async ({ request }, use) => {
    const client = new SmsApiClient(request, getConfig().apiUrl);
    await use(client);
  },

  adminApi: async ({ request }, use) => {
    const cfg = getConfig();
    const client = new SmsApiClient(request, cfg.apiUrl);
    if (hasAdminCredentials() && (await client.isBackendReachable())) {
      if (!cachedAdminToken) {
        const res = await client.login(cfg.adminEmail, cfg.adminPassword, 'Admin');
        if (res.status === 200 && res.body?.token) {
          cachedAdminToken = res.body.token;
          cachedAdminRole = Array.isArray(res.body.roles) && res.body.roles.length > 0 ? res.body.roles[0] : 'Admin';
          cachedAdminBranch = res.body.branch || '';
        }
      } else {
        client.setToken(cachedAdminToken);
        client.setContextHeaders({ role: cachedAdminRole, branch: cachedAdminBranch });
      }
    }
    await use(client);
  },

  dataRegistry: async ({ adminApi }, use) => {
    const registry = new TestDataRegistry();
    await use(registry);
    await registry.cleanupAll(adminApi);
  },

  adminPage: async ({ page }, use) => {
    const cfg = getConfig();
    if (!hasAdminCredentials()) {
      test.skip(true, 'ADMIN_EMAIL / ADMIN_PASSWORD not configured in environment or automation/.env.test');
    }
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await loginPage.loginAndWaitForDashboard(cfg.adminEmail, cfg.adminPassword);
    const dashboard = new DashboardPage(page);
    await dashboard.assertLoaded();
    await use(page);
  },
});

export { expect } from '@playwright/test';
