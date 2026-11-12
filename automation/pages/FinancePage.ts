import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class FinancePage extends BasePage {
  readonly searchStudentInput: Locator;

  constructor(page: Page) {
    super(page);
    this.searchStudentInput = page.locator('main input[placeholder*="Search" i]').first();
  }

  async openFeeCollection(): Promise<void> {
    await this.navigateToModule('fees');
    await this.waitForAppReady();
  }

  async openFinanceDashboard(): Promise<void> {
    await this.navigateToModule('finance-dashboard');
    await this.waitForAppReady();
  }

  async openFeeSetup(): Promise<void> {
    await this.navigateToModule('fee-setup');
    await this.waitForAppReady();
  }

  async searchInFinance(query: string): Promise<void> {
    if (await this.searchStudentInput.isVisible().catch(() => false)) {
      await this.searchStudentInput.fill(query);
      await this.page.waitForTimeout(400);
    }
  }

  async assertRendered(): Promise<void> {
    await this.assertNoFatalUiError();
    await expect(this.mainContent).toContainText(/Fee|Finance|Collection|Ledger|Revenue/i);
  }
}
