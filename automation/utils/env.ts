import fs from 'fs';
import path from 'path';

let loaded = false;

/**
 * Loads key=value pairs from automation/.env.test (or root .env) into process.env
 * without overriding explicitly supplied shell environment variables.
 */
export function loadTestEnv(): void {
  if (loaded) return;
  loaded = true;

  const candidates = [
    path.resolve(__dirname, '..', '.env.test'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined || process.env[key] === '') {
        process.env[key] = val;
      }
    }
  }
}

export function getConfig() {
  loadTestEnv();
  return {
    baseUrl: (process.env.BASE_URL || 'http://localhost:5173').replace(/\/+$/, ''),
    apiUrl: (process.env.API_URL || 'http://localhost:5151').replace(/\/+$/, ''),
    adminEmail: process.env.ADMIN_EMAIL || '',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    testBranch: process.env.TEST_BRANCH || '',
    testAcademicYear: process.env.TEST_ACADEMIC_YEAR || '',
  };
}

export function hasAdminCredentials(): boolean {
  const { adminEmail, adminPassword } = getConfig();
  return Boolean(adminEmail && adminPassword && adminPassword !== 'your-admin-password-here');
}
