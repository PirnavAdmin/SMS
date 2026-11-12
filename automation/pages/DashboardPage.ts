import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.navigateToSidebarItem('Dashboard');
    await this.waitForAppReady();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.sidebar).toBeVisible({ timeout: 15_000 });
    await expect(this.mainContent).toBeVisible({ timeout: 15_000 });
    await this.assertNoFatalUiError();
  }
}
