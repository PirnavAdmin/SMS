import { test } from '@playwright/test';

test('inspect fee collection view for Veera Garikapati', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.addInitScript(() => {
    const adminUser = {
      id: 'USR-001',
      name: 'Administrator',
      email: 'pirnavsms@gmail.com',
      role: 'Admin',
      phone: '+91 9581768555',
      lastLogin: '2026-07-21 09:30 AM',
      status: 'Active'
    };
    localStorage.setItem('auth_user', JSON.stringify(adminUser));
    localStorage.setItem('user', JSON.stringify(adminUser));
    localStorage.setItem('auth_token', 'offline-bypass-dev-token-valid');
    localStorage.setItem('auth_token_timestamp', Date.now().toString());
    localStorage.setItem('active_module', 'fees');
    localStorage.setItem('selected_academic_year', '2026-2027');
    localStorage.setItem('selected_branch', 'Anand bhavan');
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  // Take screenshot of what loaded
  await page.screenshot({ path: 'automation/test-results/after_login.png' });

  console.log('Current URL:', page.url());

  // Check if we are on Finance / Fee Collection
  const content = await page.content();
  console.log('Has Fee Collection:', content.includes('Fee Collection') || content.includes('Outstanding Charges'));

  // If there is search input or student list:
  const searchInput = page.locator('input[placeholder*="Search student" i], input[placeholder*="Search by" i], input[type="text"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('Veera');
    await page.waitForTimeout(1000);
  }

  // Look for Veera Garikapati
  const veeraCard = page.locator('text=Veera Garikapati').first();
  if (await veeraCard.isVisible()) {
    console.log('Found Veera Garikapati card, clicking...');
    await veeraCard.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('Veera Garikapati not found directly.');
  }

  await page.screenshot({ path: 'automation/test-results/veera_collection.png' });

  // Check for Transport Fee text anywhere
  const hasTransport = await page.locator('text=Transport Fee').count();
  console.log('Count of "Transport Fee" on page:', hasTransport);

  // Dump Outstanding Charges table rows if any
  const rows = await page.locator('table tbody tr').allInnerTexts();
  console.log('Table rows found:', rows.length);
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    console.log(`Row ${i}:`, rows[i].replace(/\n+/g, ' | '));
  }
});
