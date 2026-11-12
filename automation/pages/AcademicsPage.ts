import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AcademicsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openClasses(): Promise<void> {
    await this.navigateToModule('academic-class');
    await this.waitForAppReady();
  }

  async openSubjects(): Promise<void> {
    await this.navigateToModule('subjects');
    await this.waitForAppReady();
  }

  async openTimetable(): Promise<void> {
    await this.navigateToModule('timetable');
    await this.waitForAppReady();
  }

  async openAttendance(): Promise<void> {
    await this.navigateToModule('attendance');
    await this.waitForAppReady();
  }

  async openExaminations(): Promise<void> {
    await this.navigateToModule('examination');
    await this.waitForAppReady();
  }

  async openMarksEntry(): Promise<void> {
    await this.navigateToModule('marks-entry');
    await this.waitForAppReady();
  }

  async openReportCards(): Promise<void> {
    await this.navigateToModule('report-cards');
    await this.waitForAppReady();
  }

  async openHomework(): Promise<void> {
    await this.navigateToModule('homework');
    await this.waitForAppReady();
  }

  async assertModuleRendered(pattern: RegExp): Promise<void> {
    await this.assertNoFatalUiError();
    await expect(this.mainContent).toContainText(pattern);
  }
}
