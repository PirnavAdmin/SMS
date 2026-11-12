import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdmissionsPage extends BasePage {
  readonly newApplicationButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.newApplicationButton = page.locator('button:has-text("New Application"), button:has-text("Add Admission"), button:has-text("Apply")').first();
    this.searchInput = page.locator('main input[placeholder*="Search" i]').first();
  }

  async open(): Promise<void> {
    await this.navigateToSidebarItem('Admissions');
    await this.waitForAppReady();
  }

  async searchApplicant(query: string): Promise<void> {
    if (await this.searchInput.isVisible().catch(() => false)) {
      await this.searchInput.fill(query);
      await this.page.waitForTimeout(400);
    }
  }

  async assertRendered(): Promise<void> {
    await this.assertNoFatalUiError();
    await expect(this.mainContent).toContainText(/Admission|Application/i);
  }
}
