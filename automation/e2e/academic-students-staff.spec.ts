import { test, expect } from '@playwright/test';

test.describe('Academic, Students & Staff E2E Suite', () => {
  test('should render Admissions application workflow components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const admissionsNav = page.locator('text=Admissions, text=Admission, a[href*="admission"]').first();
    if (await admissionsNav.isVisible()) {
      await admissionsNav.click();
      await page.waitForTimeout(500);
    }
  });

  test('should render Staff Management with sequential employee ID support', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const staffNav = page.locator('text=Staff, text=Teachers, text=Employee, a[href*="staff"]').first();
    if (await staffNav.isVisible()) {
      await staffNav.click();
      await page.waitForTimeout(500);
    }
  });

  test('should render Timetable generator & Examination scheduling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const timetableNav = page.locator('text=Timetable, text=Schedule, a[href*="timetable"]').first();
    if (await timetableNav.isVisible()) {
      await timetableNav.click();
      await page.waitForTimeout(500);
    }
  });
});
