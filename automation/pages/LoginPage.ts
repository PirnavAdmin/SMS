import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly landingSignInBtn: Locator;
  readonly identifierInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.landingSignInBtn = page.locator('header button:has-text("Sign In")').first();
    this.identifierInput = page.locator('input[placeholder="Enter email, phone, or Student ID"]').first();
    this.passwordInput = page.locator('input[placeholder="Enter your password"]').first();
    this.submitButton = page.locator('button[type="submit"]:has-text("Sign In")').first();
    this.forgotPasswordLink = page.locator('button:has-text("Forgot Password?")').first();
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]').first();
    this.errorBanner = page.locator('div.bg-rose-50, div[class*="text-rose"]').first();
  }

  async gotoLanding(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async gotoLogin(): Promise<void> {
    await this.page.goto('/#login', { waitUntil: 'domcontentloaded' });
    await this.identifierInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async openLoginFromLanding(): Promise<void> {
    await this.gotoLanding();
    await this.landingSignInBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await this.landingSignInBtn.click();
    await this.identifierInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async login(identifier: string, password: string, rememberMe = false): Promise<void> {
    if (!(await this.identifierInput.isVisible().catch(() => false))) {
      await this.gotoLogin();
    }
    await this.identifierInput.fill(identifier);
    await this.passwordInput.fill(password);
    if (rememberMe) {
      const checked = await this.rememberMeCheckbox.isChecked();
      if (!checked) await this.rememberMeCheckbox.check();
    }
    await this.submitButton.click();
  }

  async loginAndWaitForDashboard(identifier: string, password: string): Promise<void> {
    await this.login(identifier, password);
    await expect(this.page.locator('aside').first()).toBeVisible({ timeout: 20_000 });
  }

  async openForgotPasswordFlow(): Promise<void> {
    await this.forgotPasswordLink.click();
    await expect(this.page.locator('text=Reset Your Password')).toBeVisible({ timeout: 5_000 });
  }

  async getValidationOrErrorMessages(): Promise<string> {
    const errors = await this.page.locator('div[class*="rose"], p[class*="rose"]').allInnerTexts();
    return errors.join(' | ').trim();
  }
}
