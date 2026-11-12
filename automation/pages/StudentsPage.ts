import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class StudentsPage extends BasePage {
  readonly searchInput: Locator;
  readonly addStudentButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('main input[placeholder*="Search" i]').first();
    this.addStudentButton = page.locator('main button:has-text("Add Student"), main button:has-text("New Student")').first();
  }

  async open(): Promise<void> {
    await this.navigateToSidebarItem('Student Directory');
    await this.waitForAppReady();
  }

  async searchStudent(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  async getRowCount(): Promise<number> {
    return this.mainContent.locator('table tbody tr').count();
  }

  async assertRendered(): Promise<void> {
    await this.assertNoFatalUiError();
    await expect(this.mainContent).toContainText(/Student/i);
  }
}
