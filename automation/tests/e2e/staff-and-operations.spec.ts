import { test } from '../../fixtures/test-fixtures';
import { StaffPage } from '../../pages/StaffPage';
import { OperationsPage } from '../../pages/OperationsPage';
import { AdminSettingsPage } from '../../pages/AdminSettingsPage';

test.describe('E2E: Staff, HR & Campus Operations Flow @e2e @regression', () => {
  test('staff, payroll, transport, hostel, library, uniform, inventory, and settings modules operate end-to-end @e2e @regression', async ({
    adminPage,
    apiClient,
  }) => {
    test.skip(!(await apiClient.isBackendReachable()), 'Backend API not reachable on API_URL');

    const staff = new StaffPage(adminPage);
    await staff.openDirectory();
    await staff.assertRendered();
    await staff.openAttendance();
    await staff.assertRendered();
    await staff.openLeaveManagement();
    await staff.assertRendered();
    await staff.openPayroll();
    await staff.assertRendered();

    const ops = new OperationsPage(adminPage);
    await ops.openTransport();
    await ops.assertModuleRendered(/Transport|Route|Vehicle|Driver/i);
    await ops.openHostel();
    await ops.assertModuleRendered(/Hostel|Room|Block|Outpass/i);
    await ops.openLibrary();
    await ops.assertModuleRendered(/Library|Book|Catalog/i);
    await ops.openUniforms();
    await ops.assertModuleRendered(/Uniform/i);
    await ops.openInventory();
    await ops.assertModuleRendered(/Inventory|Stock|Category/i);

    const adminSettings = new AdminSettingsPage(adminPage);
    await adminSettings.openCommunication();
    await adminSettings.assertModuleRendered(/Communication|Announcement|Circular/i);
    await adminSettings.openEvents();
    await adminSettings.assertModuleRendered(/Event|Holiday|Calendar/i);
    await adminSettings.openReports();
    await adminSettings.assertModuleRendered(/Report/i);
    await adminSettings.openUsers();
    await adminSettings.assertModuleRendered(/User|Role/i);
    await adminSettings.openSettings();
    await adminSettings.assertModuleRendered(/Setting|School|Campus/i);
  });
});
