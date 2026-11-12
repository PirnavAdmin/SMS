import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class OperationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openTransport(): Promise<void> {
    await this.navigateToModule('transport');
    await this.waitForAppReady();
  }

  async openHostel(): Promise<void> {
    await this.navigateToModule('hostel');
    await this.waitForAppReady();
  }

  async openLibrary(): Promise<void> {
    await this.navigateToModule('library');
    await this.waitForAppReady();
  }

  async openUniforms(): Promise<void> {
    await this.navigateToModule('uniforms');
    await this.waitForAppReady();
  }

  async openInventory(): Promise<void> {
    await this.navigateToModule('inventory');
    await this.waitForAppReady();
  }

  async assertModuleRendered(pattern: RegExp): Promise<void> {
    await this.assertNoFatalUiError();
    await expect(this.mainContent).toContainText(pattern);
  }
}
