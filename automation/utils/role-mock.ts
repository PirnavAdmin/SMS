import { Page } from '@playwright/test';

/**
 * Intercepts API requests when testing client-side simulated role sessions so
 * loading states, KPI cards, and data hooks receive realistic structural contracts
 * without being reset by live backend 401 responses.
 */
export async function stubSimulatedRoleApis(page: Page): Promise<void> {
  await page.route(/^https?:\/\/[^/]+\/api\//, (route) => {
    const url = route.request().url();
    let payload: unknown = { success: true, data: [] };

    if (url.includes('/dashboard/summary')) {
      payload = {
        success: true,
        data: {
          totalStudents: 0,
          teachingStaff: 0,
          nonTeachingStaff: 0,
          totalClasses: 0,
          pendingAdmissions: 0,
          enrolledAdmissions: 0,
          studentAttendance: { present: 0, absent: 0, late: 0, halfDay: 0, total: 0, presentPct: 0 },
          teachingStaffAttendance: { present: 0, absent: 0, late: 0, halfDay: 0, total: 0, presentPct: 0 },
          nonTeachingStaffAttendance: { present: 0, absent: 0, late: 0, halfDay: 0, total: 0, presentPct: 0 },
        },
      };
    } else if (url.includes('/v1/students')) {
      payload = { items: [], totalRecords: 0, pageNumber: 1, pageSize: 20 };
    } else if (url.includes('/Settings/public-branding')) {
      payload = {
        schoolName: 'QA Automation School',
        logoUrl: '',
        tagline: 'Automated Verification',
        email: 'qa@example.test',
      };
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}
