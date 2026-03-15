/**
 * k6 stress test — Read-path only (login once, hammer GET endpoints)
 *
 * This simulates many authenticated users hitting the reports and
 * single-report endpoints concurrently. No AI calls are made.
 *
 * Run locally:  k6 run tests/stress/read-load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '20s', target: 30 },
    { duration: '1m',  target: 30 },
    { duration: '20s', target: 80 },
    { duration: '20s', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],   // read path should be faster
    http_req_failed:   ['rate<0.01'],
    errors:            ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3001';

// Setup: one shared user for read-path tests
export function setup() {
  const email = 'readtest@lazycv.test';
  const pass  = 'Read1234!';

  // Register (ignore if already exists)
  http.post(`${BASE}/api/auth/register`,
    JSON.stringify({ username: 'readtestuser', email, password: pass }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Login and grab cookie
  const login = http.post(`${BASE}/api/auth/login`,
    JSON.stringify({ email, password: pass }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const match = login.headers['Set-Cookie']
    ? login.headers['Set-Cookie'].match(/token=([^;]+)/) : null;

  return { cookie: match ? `token=${match[1]}` : '' };
}

export default function ({ cookie }) {
  if (!cookie) { sleep(1); return; }

  // Hit reports list
  const list = http.get(`${BASE}/api/interview`, {
    headers: { Cookie: cookie },
  });
  const listOk = check(list, {
    'GET /interview → 200': (r) => r.status === 200,
    'response < 500ms':     (r) => r.timings.duration < 500,
  });
  errorRate.add(!listOk);

  // Hit get-me
  const me = http.get(`${BASE}/api/auth/get-me`, {
    headers: { Cookie: cookie },
  });
  check(me, { 'GET /auth/get-me → 200': (r) => r.status === 200 });

  sleep(0.5);
}
