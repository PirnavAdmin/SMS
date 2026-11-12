import { expect, Locator, Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly mainContent: Locator;
  readonly searchTrigger: Locator;
  readonly profileMenuButton: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('aside').first();
    this.mainContent = page.locator('main').first();
    this.searchTrigger = page.locator('header button:has-text("Search")').first();
    this.profileMenuButton = page.locator('header div.relative button').last();
    this.signOutButton = page.locator('button:has-text("Sign Out")').first();
  }

  async waitForAppReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.mainContent).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Navigates to a top-level or nested sidebar module by visible label.
   * Expands parent group first if a parentLabel is supplied.
   */
  async navigateToSidebarItem(label: string, parentGroupLabel?: string): Promise<void> {
    if (parentGroupLabel) {
      const parentBtn = this.sidebar.locator('button', { hasText: parentGroupLabel }).first();
      await parentBtn.waitFor({ state: 'visible', timeout: 10_000 });
      const targetBtn = this.sidebar.locator('button', { hasText: label }).first();
      if (!(await targetBtn.isVisible().catch(() => false))) {
        await parentBtn.click();
      }
    }
    const itemBtn = this.sidebar.locator('button', { hasText: label }).first();
    await itemBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await itemBtn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigates directly via the app's module state event (useful for deep modules across roles).
   */
  async navigateToModule(moduleId: string): Promise<void> {
    await this.page.evaluate((mod) => {
      localStorage.setItem('active_module', mod);
      window.dispatchEvent(new CustomEvent('navigate_module', { detail: mod }));
    }, moduleId);
    await this.page.waitForTimeout(300);
  }

  async getActiveModule(): Promise<string> {
    return this.page.evaluate(() => localStorage.getItem('active_module') || 'dashboard');
  }

  async getVisibleSidebarLabels(): Promise<string[]> {
    const texts = await this.sidebar.locator('button').allInnerTexts();
    return texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async selectBranch(branchName: string): Promise<void> {
    const branchBtn = this.page.locator('header button').filter({ hasText: /Campus|Branch|Anand|Main/i }).first();
    if (await branchBtn.isVisible().catch(() => false)) {
      await branchBtn.click();
      const option = this.page.locator('header button', { hasText: branchName }).first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
      }
    }
  }

  async selectAcademicYear(yearLabel: string): Promise<void> {
    const ayBtn = this.page.locator('header button:has-text("Academic Year:")').first();
    if (await ayBtn.isVisible().catch(() => false)) {
      await ayBtn.click();
      const option = this.page.locator('header button', { hasText: yearLabel }).first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
      }
    }
  }

  async logout(): Promise<void> {
    await this.profileMenuButton.click();
    await this.signOutButton.waitFor({ state: 'visible', timeout: 5_000 });
    await this.signOutButton.click();
    await this.page.waitForTimeout(400);
  }

  async assertNoFatalUiError(): Promise<void> {
    await expect(this.mainContent).toContainText(/\S+/, { timeout: 15_000 });
    const bodyText = (await this.mainContent.innerText().catch(() => '')) || '';
    expect(bodyText.trim().length).toBeGreaterThan(0);
    expect(bodyText).not.toMatch(/Something went wrong|Application error|Cannot read properties of/i);
  }
}
