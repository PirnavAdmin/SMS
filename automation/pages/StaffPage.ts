import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class StaffPage extends BasePage {
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('main input[placeholder*="Search" i]').first();
  }

  async openDirectory(): Promise<void> {
    await this.navigateToModule('staff-directory');
    await this.waitForAppReady();
  }

  async openAttendance(): Promise<void> {
    await this.navigateToModule('staff-attendance');
    await this.waitForAppReady();
  }

  async openLeaveManagement(): Promise<void> {
    await this.navigateToModule('staff-leave');
    await this.waitForAppReady();
  }

  async openPayroll(): Promise<void> {
    await this.navigateToModule('staff-payroll');
    await this.waitForAppReady();
  }

  async assertRendered(): Promise<void> {
    await this.assertNoFatalUiError();
    await expect(this.mainContent).toContainText(/Staff|Employee|Faculty|Attendance|Leave|Payroll/i);
  }
}
