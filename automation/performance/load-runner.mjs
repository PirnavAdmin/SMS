import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile(path.join(rootDir, '.env.test'));
loadEnvFile(path.resolve(rootDir, '..', '.env'));

const API_URL = (process.env.API_URL || 'http://localhost:5151').replace(/\/+$/, '');
const VUS = Number(process.env.PERF_VUS || 10);
const DURATION_SEC = Number(process.env.PERF_DURATION_SEC || 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Number(sorted[idx].toFixed(2));
}

async function hitEndpoint(name, url, options = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
    const ms = performance.now() - start;
    return { name, ok: res.ok, status: res.status, ms };
  } catch {
    const ms = performance.now() - start;
    return { name, ok: false, status: 0, ms };
  }
}

async function main() {
  console.log(`\n[Perf] Target API: ${API_URL} | VUs: ${VUS} | Duration: ${DURATION_SEC}s`);

  // Quick reachability check
  const probe = await hitEndpoint('probe', `${API_URL}/api/Settings/public-branding`);
  if (probe.status === 0) {
    console.error(`[Perf] Backend is not reachable at ${API_URL}. Start the backend before running load tests.`);
    process.exit(1);
  }

  let token = '';
  if (ADMIN_EMAIL && ADMIN_PASSWORD && ADMIN_PASSWORD !== 'your-admin-password-here') {
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: ADMIN_EMAIL, password: ADMIN_PASSWORD, portal: 'Admin' }),
    });
    if (loginRes.ok) {
      const json = await loginRes.json();
      token = json?.token || '';
    }
  }

  const endpoints = [
    { name: 'GET /api/Settings/public-branding', url: `${API_URL}/api/Settings/public-branding`, opts: {} },
  ];

  if (ADMIN_EMAIL && ADMIN_PASSWORD && ADMIN_PASSWORD !== 'your-admin-password-here') {
    endpoints.push({
      name: 'POST /api/auth/login',
      url: `${API_URL}/api/auth/login`,
      opts: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: ADMIN_EMAIL, password: ADMIN_PASSWORD, portal: 'Admin' }),
      },
    });
  }

  if (token) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    endpoints.push(
      { name: 'GET /api/dashboard/summary', url: `${API_URL}/api/dashboard/summary`, opts: { headers: authHeaders } },
      { name: 'GET /api/v1/students', url: `${API_URL}/api/v1/students?pageNumber=1&pageSize=10`, opts: { headers: authHeaders } },
      { name: 'GET /api/finance/fee-heads', url: `${API_URL}/api/finance/fee-heads`, opts: { headers: authHeaders } }
    );
  }

  const results = [];
  const deadline = Date.now() + DURATION_SEC * 1000;

  async function worker() {
    while (Date.now() < deadline) {
      for (const ep of endpoints) {
        if (Date.now() >= deadline) break;
        results.push(await hitEndpoint(ep.name, ep.url, ep.opts));
      }
    }
  }

  const startedAt = performance.now();
  await Promise.all(Array.from({ length: VUS }, () => worker()));
  const totalSec = (performance.now() - startedAt) / 1000;

  const byEndpoint = new Map();
  for (const r of results) {
    if (!byEndpoint.has(r.name)) byEndpoint.set(r.name, []);
    byEndpoint.get(r.name).push(r);
  }

  const summary = [];
  for (const [name, list] of byEndpoint.entries()) {
    const latencies = list.map((x) => x.ms).sort((a, b) => a - b);
    const errors = list.filter((x) => !x.ok).length;
    const avg = latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length);
    summary.push({
      endpoint: name,
      requests: list.length,
      errors,
      errorRatePct: Number(((errors / list.length) * 100).toFixed(2)),
      avgMs: Number(avg.toFixed(2)),
      p50Ms: percentile(latencies, 50),
      p95Ms: percentile(latencies, 95),
      p99Ms: percentile(latencies, 99),
      maxMs: Number((latencies[latencies.length - 1] || 0).toFixed(2)),
    });
  }

  const totalErrors = results.filter((r) => !r.ok).length;
  const report = {
    timestamp: new Date().toISOString(),
    target: API_URL,
    vus: VUS,
    durationSec: Number(totalSec.toFixed(2)),
    totalRequests: results.length,
    rps: Number((results.length / Math.max(0.01, totalSec)).toFixed(2)),
    totalErrors,
    endpoints: summary,
  };

  const reportsDir = path.join(rootDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'perf-results.json'), JSON.stringify(report, null, 2));

  const htmlRows = summary
    .map(
      (s) =>
        `<tr><td>${s.endpoint}</td><td>${s.requests}</td><td>${s.errors} (${s.errorRatePct}%)</td><td>${s.avgMs}</td><td>${s.p95Ms}</td><td>${s.p99Ms}</td><td>${s.maxMs}</td></tr>`
    )
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>SMS Load Test Report</title>
  <style>body{font-family:system-ui,sans-serif;margin:2rem;background:#f8fafc;color:#0f172a}table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}th,td{padding:.75rem 1rem;border-bottom:1px solid #e2e8f0;text-align:left}th{background:#0f172a;color:#fff}</style>
  </head><body><h1>SMS Load & Performance Report</h1>
  <p><strong>Target:</strong> ${API_URL} | <strong>VUs:</strong> ${VUS} | <strong>Duration:</strong> ${report.durationSec}s | <strong>Total Requests:</strong> ${report.totalRequests} | <strong>Throughput:</strong> ${report.rps} req/s</p>
  <table><thead><tr><th>Endpoint</th><th>Requests</th><th>Errors</th><th>Avg (ms)</th><th>p95 (ms)</th><th>p99 (ms)</th><th>Max (ms)</th></tr></thead><tbody>${htmlRows}</tbody></table>
  </body></html>`;

  fs.writeFileSync(path.join(reportsDir, 'perf-report.html'), html);
  console.table(summary);
  console.log(`[Perf] Throughput: ${report.rps} req/s | Reports saved to automation/reports/perf-report.html`);

  const failRate = totalErrors / Math.max(1, results.length);
  if (failRate > 0.05) {
    console.error(`[Perf] Failure rate ${(failRate * 100).toFixed(2)}% exceeded 5% threshold.`);
    process.exit(1);
  }
}

main();
