import { test, expect } from '../../fixtures/test-fixtures';
import { AcademicsPage } from '../../pages/AcademicsPage';

test.describe('E2E: Academics, Attendance & Examination Flow @e2e @regression', () => {
  test('admin navigates Classes, Subjects, Timetable, Attendance, Exams, Marks Entry, and Report Cards @e2e @regression', async ({
    adminPage,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const academics = new AcademicsPage(adminPage);

    await academics.openClasses();
    await academics.assertModuleRendered(/Class|Section|Academic/i);

    await academics.openSubjects();
    await academics.assertModuleRendered(/Subject/i);

    await academics.openTimetable();
    await academics.assertModuleRendered(/Timetable|Time Table|Schedule/i);

    await academics.openAttendance();
    await academics.assertModuleRendered(/Attendance/i);

    await academics.openExaminations();
    await academics.assertModuleRendered(/Exam|Examination|Assessment/i);

    await academics.openMarksEntry();
    await academics.assertModuleRendered(/Marks|Score|Grade/i);

    await academics.openReportCards();
    await academics.assertModuleRendered(/Report|Card|Result/i);

    await academics.openHomework();
    await academics.assertModuleRendered(/Homework|Assignment/i);
  });
});
