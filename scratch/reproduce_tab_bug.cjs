const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../automation/node_modules/@playwright/test'));
const crypto = require('crypto');

const key = 'SMS_Api_Secure_JWT_Signing_Key_2026_x9F8k2L7mQ1vN4pZ8sT3wE6yA0uC5iR!';
function base64url(str) { return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const now = Math.floor(Date.now() / 1000);
const payload = base64url(JSON.stringify({
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'Admin User',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
  iss: 'SMS_NEW_API',
  aud: 'SMS_NEW_Client',
  exp: now + 3600 * 24,
  nbf: now - 10
}));
const signature = crypto.createHmac('sha256', key).update(header + '.' + payload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = header + '.' + payload + '.' + signature;

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.addInitScript(({ token }) => {
    const user = {
      id: "admin-1",
      name: "Admin User",
      email: "admin@pirnavschools.edu",
      role: "Admin",
      status: "Active"
    };

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_token_timestamp', Date.now().toString());
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
  }, { token });

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Navigate to School Settings
  console.log('Navigating to School Settings...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('navigate_module', { detail: 'settings' }));
  });
  await page.waitForTimeout(1000);

  // 2. Click Certificate Templates tab
  console.log('Clicking Certificate Templates tab...');
  const certTab = page.locator('button:has-text("Certificate Templates")');
  console.log('certTab count:', await certTab.count());
  if (await certTab.count() > 0) {
    await certTab.first().click();
    await page.waitForTimeout(1000);
  }

  // 3. Click Numbering Rules
  console.log('Clicking Numbering Rules...');
  const numberingBtn = page.locator('button:has-text("Numbering Rules")');
  console.log('numberingBtn count:', await numberingBtn.count());
  if (await numberingBtn.count() > 0) {
    await numberingBtn.first().click();
    await page.waitForTimeout(1000);
  }

  const checkState = async (step) => {
    const buttons = await page.locator('button').allTextContents();
    const isNumberingActive = await page.locator('button:has-text("Numbering Rules")').evaluateAll(els => els.some(el => el.className.includes('bg-sky-500')));
    const activeModule = await page.evaluate(() => localStorage.getItem('active_module'));
    const isLoginVisible = await page.locator('input[type="password"]').count() > 0;
    return {
      step,
      activeModule,
      isNumberingActive,
      isLoginVisible,
      url: page.url()
    };
  };

  console.log('State before blur:', await checkState('Before Tab Switch'));

  // 4. Simulate switching to another tab and back
  console.log('Simulating tab blur / visibility hidden...');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('blur'));
  });

  await page.waitForTimeout(2000);

  console.log('Simulating returning to tab (focus / visibility visible)...');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  });

  await page.waitForTimeout(2000);

  console.log('State after return:', await checkState('After Tab Return'));

  await page.screenshot({ path: 'scratch/tab_reproduce.png' });
  console.log('Screenshot saved.');

  await browser.close();
})();
