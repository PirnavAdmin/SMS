import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminSettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openCommunication(): Promise<void> {
    await this.navigateToModule('communication');
    await this.waitForAppReady();
  }

  async openEvents(): Promise<void> {
    await this.navigateToModule('events');
    await this.waitForAppReady();
  }

  async openReports(): Promise<void> {
    await this.navigateToModule('reports');
    await this.waitForAppReady();
  }

  async openUsers(): Promise<void> {
    await this.navigateToModule('users');
    await this.waitForAppReady();
  }

  async openSettings(): Promise<void> {
    await this.navigateToModule('settings');
    await this.waitForAppReady();
  }

  async openTraining(): Promise<void> {
    await this.navigateToModule('training');
    await this.waitForAppReady();
  }

  async assertModuleRendered(pattern: RegExp): Promise<void> {
    await this.assertNoFatalUiError();
    await expect(this.mainContent).toContainText(pattern);
  }
}
