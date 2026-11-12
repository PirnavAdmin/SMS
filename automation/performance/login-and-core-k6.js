import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 25 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:5151';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || '';

export function setup() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return { token: '' };
  }
  const res = http.post(
    `${API_URL}/api/auth/login`,
    JSON.stringify({ emailOrPhone: ADMIN_EMAIL, password: ADMIN_PASSWORD, portal: 'Admin' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status === 200) {
    return { token: res.json('token') || '' };
  }
  return { token: '' };
}

export default function (data) {
  const brandingRes = http.get(`${API_URL}/api/Settings/public-branding`);
  check(brandingRes, { 'public-branding status 200': (r) => r.status === 200 });

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const loginRes = http.post(
      `${API_URL}/api/auth/login`,
      JSON.stringify({ emailOrPhone: ADMIN_EMAIL, password: ADMIN_PASSWORD, portal: 'Admin' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(loginRes, { 'login status 200': (r) => r.status === 200 });
  }

  if (data.token) {
    const headers = { Authorization: `Bearer ${data.token}` };
    const dashRes = http.get(`${API_URL}/api/dashboard/summary`, { headers });
    check(dashRes, { 'dashboard summary 200': (r) => r.status === 200 });

    const studentsRes = http.get(`${API_URL}/api/v1/students?pageNumber=1&pageSize=10`, { headers });
    check(studentsRes, { 'students list 200': (r) => r.status === 200 });

    const feesRes = http.get(`${API_URL}/api/finance/fee-heads`, { headers });
    check(feesRes, { 'fee-heads 200': (r) => r.status === 200 });
  }

  sleep(0.5);
}
